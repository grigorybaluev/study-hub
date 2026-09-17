---
title: Exception handling
order: 4
status: detailed
weeks: [4]
notes: ["COMP 249 course outline (Winter 2026): week 4, ch. 9, Exception Handling (first of two weeks)"]
introduces: [exception-handling]
requires:
  - {concept: class-and-object, strength: hard}
  - {concept: inheritance, strength: soft}
  - {concept: iteration, strength: soft}
reinforces: []
---

Division by zero, an index past the end of an array, a letter where a number was typed:
until now these ended the program with a stack trace. Exceptions are Java's mechanism for
*separating* the code that detects a problem from the code that decides what to do about
it — and for making sure a problem is not silently ignored.

## What an exception is

> **Definition.** An **exception** is an object (of class `Throwable` or a subclass)
> created when something goes wrong. **Throwing** it (`throw new X(...)`, or the run time
> doing so for you) abandons the current statement; execution leaves the method, then
> the caller, and so on up the call stack until a **handler** for that exception class is
> found. If none is found, the program stops and prints the exception with its stack
> trace. `getMessage()` returns the text the exception was created with; `toString()` is
> the class name plus that message.

The classes you will meet first, all in `java.lang` and all thrown by the run time:
`ArithmeticException` (`/ by zero`), `ArrayIndexOutOfBoundsException`,
`NullPointerException`, `NumberFormatException` (from `Integer.parseInt`),
`ClassCastException`, and `InputMismatchException` (from `Scanner.nextInt`, in
`java.util`).

## try, catch

> **Definition.** A **`try` block** wraps statements that may throw; each **`catch`
> clause** after it names an exception class and a parameter, and runs when an exception
> of that class (or a subclass) escapes the try block. After the catch block finishes,
> execution continues *after the whole try statement* — not back inside the try.
> Statements in the try block after the throwing one never run.

```sim
id: java-249-try-catch
custom: true
engine: java
code: |
  import java.util.Scanner;
  public class Main {
      public static void main(String[] args) {
          Scanner in = new Scanner(System.in);
          int[] marks = {70, 85, 92};
          System.out.print("index: ");
          try {
              int i = Integer.parseInt(in.next());
              System.out.println("mark " + marks[i]);
              System.out.println("average " + (marks[i] / (i - 1)));
              System.out.println("done with " + i);
          } catch (ArrayIndexOutOfBoundsException e) {
              System.out.println("no such student: " + e.getMessage());
          } catch (ArithmeticException e) {
              System.out.println("math problem: " + e.getMessage());
          } catch (NumberFormatException e) {
              System.out.println("not a number: " + e.getMessage());
          }
          System.out.println("after the try statement");
      }
  }
stdin: "1"
note: 'With input 1 the division by (i - 1) throws inside the try: the rest of the block is skipped, the matching catch runs, then the program continues after the whole statement. Change the input to 7, to x, and to 2 (which succeeds) and watch which path lights up. The status bar names the exception when a catch takes over.'
```

Catch clauses are tested in order and the first match wins, where "match" means the thrown
object is an instance of the named class. Because `RuntimeException` is a superclass of
all of the above, a `catch (RuntimeException e)` placed *first* would swallow everything
and the compiler flags later, more specific clauses as unreachable — order them from
specific to general. Several unrelated classes that need the same handling can share a
clause: `catch (NumberFormatException | ArithmeticException e)`.

## throw

Code can throw its own exception when it detects a condition it cannot handle: a
negative deposit, an empty list asked for its first element. The message should say what
was wrong, in terms the caller can act on:

```java
if (amount < 0)
    throw new IllegalArgumentException("deposit must be positive, got " + amount);
```

The statement after a `throw` is unreachable; a method with a return type may end with a
`throw` instead of a `return`. The exception classes to reuse before writing your own:
`IllegalArgumentException` (a bad parameter), `IllegalStateException` (the object is not
ready for this operation), `UnsupportedOperationException`.

```sim
id: java-249-throw
custom: true
engine: java
code: |
  public class Main {
      static double safeSqrt(double x) {
          if (x < 0) throw new IllegalArgumentException("negative input: " + x);
          return Math.sqrt(x);
      }
      static double average(int[] data) {
          if (data.length == 0) throw new IllegalArgumentException("empty array");
          int sum = 0;
          for (int d : data) sum += d;
          return (double) sum / data.length;
      }
      public static void main(String[] args) {
          System.out.println(safeSqrt(16));
          try {
              System.out.println(average(new int[] {}));
          } catch (IllegalArgumentException e) {
              System.out.println("could not average: " + e.getMessage());
          }
          System.out.println(safeSqrt(-1));
          System.out.println("never printed");
      }
  }
note: 'Two methods that refuse bad input. The second call is caught; the last is not, so the program ends with the uncaught exception and a trace naming safeSqrt then main — read the Console panel. Wrap the last call in its own try to keep the program alive.'
```

## Propagation and the stack trace

An exception thrown in a method that has no handler for it does not stop there: the
method ends abruptly, and the search continues in its caller, at the point of the call.
This is why a handler in `main` can catch a problem four calls deep, and why the stack
trace lists the chain of calls from the throwing method up to `main`. The stepper's
Variables panel empties frame by frame as the exception unwinds; `printStackTrace()`
prints the same list.

Where to catch is a design decision: as low as the code that can *fix* the problem (ask
for the input again), as high as the code that can *report* it sensibly. Catching an
exception and doing nothing — an empty catch block — hides bugs and is the one pattern
the course forbids.

```sim
id: java-249-propagation
custom: true
engine: java
code: |
  import java.util.Scanner;
  public class Main {
      static int readAge(Scanner in) {
          String text = in.next();
          int age = Integer.parseInt(text);
          if (age < 0 || age > 150) throw new IllegalArgumentException("age out of range: " + age);
          return age;
      }
      static int readValidAge(Scanner in) {
          while (true) {
              try {
                  return readAge(in);
              } catch (NumberFormatException e) {
                  System.out.println("not a number, try again");
              } catch (IllegalArgumentException e) {
                  System.out.println(e.getMessage() + ", try again");
              }
          }
      }
      public static void main(String[] args) {
          Scanner in = new Scanner(System.in);
          int age = readValidAge(in);
          System.out.println("age accepted: " + age);
      }
  }
stdin: |
  twenty
  200
  20
note: 'readAge throws; readValidAge, one level up, catches and loops. Step through twice to see the frames unwind from readAge into the catch in readValidAge, then the retry. NumberFormatException is a subclass of IllegalArgumentException — swap the two catch clauses and read what the compiler says.'
```

> **Key insight.** An exception moves the *decision* about a failure to the nearest
> caller that can make it. `throw` reports, `catch` decides, and everything in between
> is simply skipped — which is the point: the code in between stays clean of error
> checks it could not act on anyway.

## Further reading

- [The Java Tutorials — What Is an Exception?](https://docs.oracle.com/javase/tutorial/essential/exceptions/definition.html) — The call-stack picture, and the rest of that trail for `try`/`catch`.
- [The Java Tutorials — The catch Blocks](https://docs.oracle.com/javase/tutorial/essential/exceptions/catch.html) — Multi-catch and the order rule.
