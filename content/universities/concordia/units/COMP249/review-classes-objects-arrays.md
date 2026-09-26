---
title: Review of classes, objects and arrays
order: 1
kind: review
status: detailed
weeks: [1]
introduces: []
requires: []
reinforces: [class-and-object, object-reference, array]
---

Week one replays the COMP 248 material the rest of the course builds on: a class with
private fields, constructors and accessors; references, `null` and aliasing; arrays of
objects. Nothing new — the units of COMP 248 are the material — but the three things
below must be automatic before inheritance starts, because every later chapter assumes
them.

- **A class is a type.** Fields describe state, the constructor establishes it, methods
  are the only way in when fields are `private`. `this` names the current object.
- **A variable of class type holds a reference.** `Point p = q;` copies the arrow, not
  the box; `p == q` compares arrows, `p.equals(q)` is whatever the class says it is;
  `null` is "no object" and dereferencing it is a `NullPointerException`.
- **An array of objects starts as an array of `null`s.** Each slot still needs a `new`.
  Passing an array (or any object) to a method passes the reference, so the method can
  change what is inside.

One program that touches all three; trace it, then step through it:

```sim
id: java-249-review-refs
custom: true
engine: java
code: |
  public class Main {
      public static void main(String[] args) {
          Account[] bank = new Account[3];
          bank[0] = new Account("Ana", 100);
          bank[1] = new Account("Bo", 50);
          Account alias = bank[0];
          alias.deposit(25);
          transfer(bank[0], bank[1], 60);
          System.out.println(bank[0] + " | " + bank[1]);
          System.out.println(alias == bank[0]);
          System.out.println(bank[2].getBalance());
      }
      static void transfer(Account from, Account to, double amount) {
          from.withdraw(amount);
          to.deposit(amount);
      }
  }
  class Account {
      private String owner;
      private double balance;
      Account(String owner, double balance) { this.owner = owner; this.balance = balance; }
      void deposit(double x) { balance += x; }
      void withdraw(double x) { if (x <= balance) balance -= x; }
      double getBalance() { return balance; }
      public String toString() { return owner + ": " + balance; }
  }
note: 'Watch the Variables panel: alias and bank[0] show the same #id, so the deposit through alias changes the account the array holds. The last line dereferences the slot nobody filled and ends with a NullPointerException — that is the expected ending; fix it by constructing a third account.'
```

Checklist for the first lab: write a small class from a sentence-long description, give
it a `toString`, build an array of it, loop with both `for` forms, and explain to
yourself why `==` on two freshly constructed equal objects is `false`.

## Further reading

- [The Java Tutorials — Classes and Objects](https://docs.oracle.com/javase/tutorial/java/javaOO/index.html) — The chapter this week recaps, with the same vocabulary the course uses.
- [The Java Tutorials — Arrays](https://docs.oracle.com/javase/tutorial/java/nutsandbolts/arrays.html) — Declaration, creation and the default values of each element type.
