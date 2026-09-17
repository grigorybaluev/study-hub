---
title: Checked exceptions, finally and your own exception classes
order: 5
status: detailed
weeks: [5]
notes: ["COMP 249 course outline (Winter 2026): week 5, ch. 9, Exception Handling (second week)"]
introduces: []
requires:
  - {concept: exception-handling, strength: hard}
  - {concept: inheritance, strength: hard}
reinforces:
  - {concept: exception-handling, perspective: "checked versus unchecked exceptions, throws clauses, finally, and defining exception classes"}
---

The second week of exceptions is about the rules Java adds on top of throw and catch:
some exceptions *must* be handled or declared (the compiler checks), `finally` runs no
matter what, and a program defines its own exception classes so that "insufficient
funds" is not reported as a generic `RuntimeException` with a string in it.

## The exception hierarchy: checked and unchecked

Every exception class descends from `Throwable`. Two branches matter:

- **`Error`** — the virtual machine is in trouble (`StackOverflowError`,
  `OutOfMemoryError`). Not caught in ordinary programs.
- **`Exception`** — problems a program can reasonably handle. Its subclass
  **`RuntimeException`** groups the ones that indicate a *bug* (`NullPointerException`,
  `ArithmeticException`, `IllegalArgumentException` …).

> **Definition.** A **checked exception** is any `Exception` that is *not* a
> `RuntimeException` (`IOException`, `FileNotFoundException`, and the classes you
> define by extending `Exception`). The compiler enforces the **catch-or-declare rule**:
> a method that may let a checked exception escape must either catch it or declare it
> with a **`throws` clause** in its header. Everything under `RuntimeException` (and
> `Error`) is **unchecked**: it may be thrown and propagated without any declaration.

The reasoning: a missing file is a normal event the caller must plan for, so the
compiler makes the possibility visible in the method's signature; a null dereference is
a bug that should be fixed rather than caught everywhere. `throws` is part of the
contract: a method declaring `throws InsufficientFundsException` tells every caller to
deal with it, and the caller in turn either handles it or declares it too, up to `main`,
which may also declare it (and then the program simply dies with the trace).

```sim
id: java-249-checked
custom: true
engine: java
code: |
  class InsufficientFundsException extends Exception {
      private double shortfall;
      public InsufficientFundsException(double shortfall) {
          super("short by " + shortfall);
          this.shortfall = shortfall;
      }
      public double getShortfall() { return shortfall; }
  }
  class Account {
      private double balance;
      Account(double balance) { this.balance = balance; }
      public void withdraw(double amount) throws InsufficientFundsException {
          if (amount > balance) throw new InsufficientFundsException(amount - balance);
          balance -= amount;
      }
      public double getBalance() { return balance; }
  }
  public class Main {
      public static void main(String[] args) {
          Account acc = new Account(100);
          try {
              acc.withdraw(30);
              acc.withdraw(100);
              System.out.println("both done");
          } catch (InsufficientFundsException e) {
              System.out.println(e.getMessage() + " (needs " + e.getShortfall() + " more)");
          }
          System.out.println("balance " + acc.getBalance());
      }
  }
note: 'withdraw declares the checked exception, so main must catch it. Delete the try/catch and keep the two calls: the program no longer compiles ("unreported exception"). Then add "throws InsufficientFundsException" to main instead and see the program compile and die with the trace.'
```

## Defining an exception class

> **Definition.** A **custom exception** is a class extending `Exception` (checked) or
> `RuntimeException` (unchecked). By convention it ends in `Exception`, has a
> constructor taking a message that it passes to `super(message)`, often a no-argument
> constructor with a default message, and may carry extra fields (the offending value)
> with accessors, since a catch block gets the whole object, not just a string.

Choose checked when the caller can recover and *should be forced to think about it*
(the bank example); choose unchecked for programming errors and precondition violations
(a negative amount is the caller's bug, not a normal event). Give the class a name that
says what happened, so `catch (InsufficientFundsException e)` reads like the policy it
is. Never use exceptions for ordinary control flow — a loop exiting by exception is a
loop written wrong.

## finally

> **Definition.** A **`finally` block** after the catch clauses runs whether the try
> block completed, a catch handled an exception, or an exception is still propagating —
> and also when the try block exits with `return` or `break`. It is for cleanup that must
> happen in every case: closing a file, releasing a resource, restoring a state.

Order of events when the try block throws and a catch matches: try (until the throw) →
catch → finally → the statement after. When no catch matches: try → finally → the
exception continues to the caller. A `return` inside `finally` overrides everything,
including a propagating exception, which is why one should never be written there.

```sim
id: java-249-finally
custom: true
engine: java
code: |
  public class Main {
      static int attempt(int divisor) {
          System.out.println("open resource for " + divisor);
          try {
              int result = 100 / divisor;
              System.out.println("computed " + result);
              return result;
          } catch (ArithmeticException e) {
              System.out.println("caught " + e.getMessage());
              return -1;
          } finally {
              System.out.println("close resource for " + divisor);
          }
      }
      public static void main(String[] args) {
          System.out.println("got " + attempt(4));
          System.out.println("got " + attempt(0));
          try {
              System.out.println(attempt(0) + 1);
              throw new IllegalStateException("propagating");
          } finally {
              System.out.println("outer finally");
          }
      }
  }
note: 'Three exits from the try: a normal return, a caught exception with its own return, and finally after a throw with no catch — the cleanup line prints every time, even after return. Step to the end: outer finally runs, and the IllegalStateException still reaches the top.'
```

## Rethrowing, wrapping, and the stack trace

A catch block may handle part of the problem and rethrow (`throw e;`) so a caller sees it
too — logging first, then rethrowing, is common. It may also throw a *different*
exception that means more at its level, passing the original as the cause. And a method
declared `throws X` may be overridden only by a method whose throws clause is the same or
narrower: an override cannot add checked exceptions, or code written against the
superclass type would be caught out.

`e.printStackTrace()` prints the class, message and the chain of calls; `getMessage()`
is for the user, the trace is for the programmer.

```sim
id: java-249-rethrow
custom: true
engine: java
code: |
  class InvalidGradeException extends RuntimeException {
      public InvalidGradeException(String detail) { super("invalid grade: " + detail); }
  }
  public class Main {
      static int toGrade(String text) {
          try {
              int g = Integer.parseInt(text.trim());
              if (g < 0 || g > 100) throw new InvalidGradeException(g + " is out of range");
              return g;
          } catch (NumberFormatException e) {
              throw new InvalidGradeException("'" + text + "' is not a number");
          }
      }
      public static void main(String[] args) {
          String[] inputs = {"88", " 95 ", "abc", "120"};
          int ok = 0;
          for (String s : inputs) {
              try {
                  System.out.println(toGrade(s));
                  ok++;
              } catch (InvalidGradeException e) {
                  System.out.println("skipped: " + e.getMessage());
              }
          }
          System.out.println(ok + " valid");
          toGrade("-5").hashCode();
      }
  }
note: 'A NumberFormatException from the library is translated into the program''s own InvalidGradeException, so main handles one class. The last line throws outside any try; the Console shows the uncaught exception with its trace through toGrade. Call e.printStackTrace() inside the catch to see the same trace for the handled ones.'
```

> **Key insight.** Checked exceptions are the compiler asking "have you thought about
> this failure?"; `throws` answers "my caller will"; `finally` guarantees cleanup
> whichever way a block ends; and a custom exception class turns a failure into a
> vocabulary word the rest of the program can name.

## Further reading

- [The Java Tutorials — The finally Block](https://docs.oracle.com/javase/tutorial/essential/exceptions/finally.html) — Cleanup semantics with a file example.
- [The Java Tutorials — Unchecked Exceptions: The Controversy](https://docs.oracle.com/javase/tutorial/essential/exceptions/runtime.html) — The design argument for checked exceptions, in one page.
