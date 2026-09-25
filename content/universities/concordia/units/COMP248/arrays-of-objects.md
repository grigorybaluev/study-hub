---
title: References and arrays of objects
order: 9
status: detailed
weeks: [10]
notes: ["COMP 248 course outline (Fall 2016): week 10, Arrays of objects; lab exercise 6"]
introduces: [object-reference]
requires:
  - {concept: array, strength: hard}
  - {concept: class-and-object, strength: hard}
reinforces: []
---

What a variable of class type actually holds, and everything that follows: `null`,
aliasing, `==` versus `equals`, objects as parameters and return values, and arrays whose
elements are objects.

## A variable of class type holds a reference

A primitive variable holds its value. A variable whose type is a class or an array holds
a **reference** — the address of an object living elsewhere in memory — and the object
itself is created by `new`. Draw it: a box for the variable with an arrow to a separate
box for the object. Every rule in this unit is a consequence of that picture.

:::definition
`null` is the reference that points to no object. A field or array
element of class type starts as `null`; a local variable must be assigned before use.
Calling a method or reading a field through `null` throws a `NullPointerException`.
:::

```java
Student s = new Student("Ana", 1);   // s → Student#1
Student t = s;                       // t → the same Student#1  (aliasing)
Student u = null;                    // u → nothing
t.setName("Bo");                     // changes the one object; s.getName() is "Bo"
u.getName();                         // NullPointerException
```

**Aliasing** — two variables referring to one object — is not a bug, it is how objects
are shared; the bug is *forgetting* it. Assignment between reference variables copies the
arrow, never the object.

```sim
id: java-aliasing-objects
custom: true
engine: java
code: |
  public class Main {
      public static void main(String[] args) {
          Point p = new Point(1, 2);
          Point q = p;
          Point r = new Point(1, 2);
          q.x = 10;
          System.out.println(p.x + " " + q.x + " " + r.x);
          System.out.println((p == q) + " " + (p == r) + " " + p.equals(r));
          Point none = null;
          System.out.println(none == null);
          System.out.println(none.x);
      }
  }
  class Point {
      int x, y;
      Point(int x, int y) { this.x = x; this.y = y; }
      public boolean equals(Point o) { return o != null && x == o.x && y == o.y; }
  }
note: 'Watch the #ids — p and q are both Point#1, r is Point#2 with the same contents. == compares the arrows, equals compares what the class says matters. The last line dereferences null; read the exception.'
```

## Equality: == versus equals

`==` on two references asks "same object?" — `p == q` above is `true`, `p == r` is
`false` although the coordinates match. To compare *contents* the class must say what
equal means by defining `equals`; `String` did this for you, which is why the
strings unit told you to use it. A class without its own `equals` inherits one that
behaves like `==`. When you write `equals`, first check for `null`, then compare the
fields that define identity.

:::syntax[An equals method]
```java
public boolean equals(<ClassName> other) {
    return other != null
        && <primitive field> == other.<primitive field>
        && <object field>.equals(other.<object field>);
}
```

- `other != null` comes first: `&&` short-circuits, so the field comparisons never run on
  `null`.
- Primitive fields compare with `==`; object fields (a `String` name) compare with their own
  `equals`.
:::

## Objects as parameters and results

Passing an object to a method passes the reference (by value): the method can call
mutators on the caller's object and the caller sees the change, exactly as with arrays.
Reassigning the parameter inside the method changes nothing outside. Returning an object
returns a reference to it — and if that object is one of your `private` fields, the
caller now has a way past your encapsulation (a **privacy leak**); return a copy when the
field is mutable.

```sim
id: java-objects-as-parameters
custom: true
engine: java
code: |
  public class Main {
      static void applyInterest(BankAccount a, double rate) {
          a.deposit(a.getBalance() * rate);
      }
      static void tryToReplace(BankAccount a) {
          a = new BankAccount("nobody", 0);
      }
      static BankAccount richer(BankAccount a, BankAccount b) {
          return a.getBalance() >= b.getBalance() ? a : b;
      }
      public static void main(String[] args) {
          BankAccount x = new BankAccount("Ana", 100);
          BankAccount y = new BankAccount("Bo", 250);
          applyInterest(x, 0.10);
          tryToReplace(y);
          System.out.println(x.getBalance() + " " + y.getBalance());
          BankAccount top = richer(x, y);
          top.deposit(1);
          System.out.println(y.getBalance() + " " + (top == y));
      }
  }
  class BankAccount {
      private String owner; private double balance;
      BankAccount(String o, double b) { owner = o; balance = b; }
      void deposit(double amt) { if (amt > 0) balance += amt; }
      double getBalance() { return balance; }
  }
note: 'applyInterest changes the caller''s object through the reference; tryToReplace only repoints its own parameter; richer returns a reference to an existing object, so top is an alias for y. Step through and follow the #ids.'
```

## Arrays of objects

`Student[] roster = new Student[3];` creates an array of three **references, all
`null`** — no `Student` exists yet. Each slot is filled with `new` (or with an existing
object, which makes an alias). Loops over an array of objects look like loops over ints
with method calls instead of arithmetic, plus one extra guard: skip or stop at `null`
when the array is partially filled.

:::syntax[Array of objects]
```java
<ClassName>[] <name> = new <ClassName>[<length>];   // <length> references, all null
<name>[<index>] = new <ClassName>(<arguments>);     // one object per slot
<name>[<index>].<method>(<arguments>)
```

- Creating the array creates no objects; each slot needs its own `new` (or an existing
  object, which makes an alias).
- A call through an empty slot throws `NullPointerException`: guard with
  `<name>[i] != null` when the array is partially filled.
:::

```sim
id: java-array-of-objects
custom: true
engine: java
code: |
  public class Main {
      public static void main(String[] args) {
          Student[] roster = new Student[4];
          roster[0] = new Student("Ana", 78);
          roster[1] = new Student("Bo", 91);
          roster[2] = new Student("Cy", 64);
          int count = 3;
          Student best = roster[0];
          for (int i = 1; i < count; i++) {
              if (roster[i].getMark() > best.getMark()) best = roster[i];
          }
          System.out.println("best: " + best);
          for (int i = 0; i < roster.length; i++) {
              System.out.println(i + ": " + (roster[i] == null ? "empty" : roster[i].getName()));
          }
          System.out.println(roster[3].getName());
      }
  }
  class Student {
      private String name; private int mark;
      Student(String n, int m) { name = n; mark = m; }
      String getName() { return name; }
      int getMark() { return mark; }
      public String toString() { return name + " (" + mark + ")"; }
  }
note: 'new Student[4] holds four nulls until each is filled. The maximum loop runs to count, the printing loop to length with a null guard; the last line forgets the guard. Notice best is an alias for roster[1], not a copy.'
```

## Reading the picture

When a program with objects prints something unexpected, draw the boxes and arrows at
the line in question: which variables point to which objects, which slots are `null`.
The Variables panel's `#id` does this for you — two names with the same `#` are one
object. The classic exam question hands you a program with aliasing and asks for the
output; the drawing is the whole method.

::::exercise[What does this print?]
```java
Point a = new Point(1, 1);
Point b = a;
Point[] ps = {a, new Point(1, 1), b};
ps[2].x = 5;
ps[1] = ps[0];
ps[1].y = 7;
System.out.println(a.x + "," + a.y + " " + (ps[0] == ps[2])
        + " " + ps[1].equals(new Point(5, 7)));
```

Use the `Point` class of the example above, whose `equals` compares `x` and `y`.

:::solution
```text
5,7 true true
```

Draw it. `a`, `b`, `ps[0]` and `ps[2]` all refer to one object; `ps[1]` starts as a second one.
`ps[2].x = 5` changes the shared object. `ps[1] = ps[0]` repoints `ps[1]` to it too (the second
point is now unreachable), and `ps[1].y = 7` changes the shared object again. So `a` is (5, 7);
`ps[0] == ps[2]` is the same object; and `equals` compares contents with a new (5, 7).
:::
::::

:::insight
Objects live in one place and are reached through references;
assignment, parameters, return values and array slots all copy the reference. So
changes through one name show up under every alias, `==` compares arrows while `equals`
compares contents, and an array of objects starts as an array of `null`s.
:::

:::equations
- *Identity versus equality*: $p \texttt{ == } q$ iff $p$ and $q$ refer to the same object; $p\texttt{.equals}(q)$ is whatever the class defines, and should satisfy $p\texttt{.equals}(p)$, symmetry, and $p\texttt{.equals(null)} = \texttt{false}$.
- *An array of objects of length $n$*: $n$ references, initially all `null`; the objects are allocated separately, one per `new`.
:::

## Further reading

- [The Java Tutorials — Objects](https://docs.oracle.com/javase/tutorial/java/javaOO/objects.html) — Creating objects, referencing fields, and what happens to unreferenced ones.
- [The Java Tutorials — Passing Information to a Method or a Constructor](https://docs.oracle.com/javase/tutorial/java/javaOO/arguments.html) — Reference types as parameters, the official wording.
