---
title: Defining classes
order: 8
status: detailed
weeks: [9]
notes: ["COMP 248 course outline (Fall 2016): week 9, Defining Classes (continued); lab exercise 5; course objective CO5d, design and implement a class"]
introduces: [class-and-object]
requires:
  - {concept: function-definition, strength: hard}
  - {concept: string, strength: soft}
reinforces: []
---

Writing your own type: a class as a blueprint of fields and methods, objects created from
it with constructors, `this`, and encapsulation — private data behind public methods.

## Class and object

> **Definition.** A **class** describes a kind of object: the data each one holds (its
> **fields**, or instance variables) and what it can do (its **methods**). An **object**
> is one instance, created with `new`, with its own copy of every field.

`String` and `Scanner` were classes someone else wrote; now you write one. A class
models one thing from the problem — a bank account, a point, a student — and the fields
are that thing's state:

```java
public class Rectangle {
    private double width;               // fields: one per object
    private double height;

    public Rectangle(double w, double h) {   // constructor: same name as the class, no return type
        width = w;
        height = h;
    }

    public double area() {              // instance method: works on this object's fields
        return width * height;
    }

    public void scale(double factor) {
        width *= factor;
        height *= factor;
    }
}
```

`Rectangle r = new Rectangle(3, 4);` creates the object and runs the constructor;
`r.area()` calls the method *on* `r`, and inside `area` the names `width` and `height`
mean `r`'s fields. Two objects `r1` and `r2` have separate fields and the same methods.
The class goes in its own file, `Rectangle.java`; the program that uses it (the
**driver**, with `main`) is another class.

```sim
id: java-first-class
custom: true
engine: java
code: |
  public class Main {
      public static void main(String[] args) {
          Rectangle a = new Rectangle(3, 4);
          Rectangle b = new Rectangle(1.5, 2);
          System.out.println(a.area() + " " + b.area());
          a.scale(2);
          System.out.println(a.area() + " " + b.area());
      }
  }
  class Rectangle {
      private double width, height;
      public Rectangle(double w, double h) { width = w; height = h; }
      public double area() { return width * height; }
      public void scale(double f) { width *= f; height *= f; }
  }
note: 'Two objects from one class. Step into a.scale(2) — the frame shows this = Rectangle#1{…}, and only #1''s fields change. Add a perimeter() method and call it on both.'
```

## Constructors and this

A **constructor** initialises a new object. It has the class's name and no return type;
if you write none, Java supplies an empty **default constructor**, but as soon as you
write one, the default disappears. A class can have several constructors with different
parameter lists (**overloading**, taken up in the more-on-classes unit) — one taking all
fields, one taking none and choosing defaults.

The keyword **`this`** is the object the method was called on. It settles the commonest
naming clash: when a parameter has the same name as a field, `this.width = width`
assigns the parameter to the field — the parameter **shadows** the field inside the
method, and `this.` reaches past it. `this(…)` as the first line of a constructor calls
another constructor of the same class.

```sim
id: java-constructors-this
custom: true
engine: java
code: |
  public class Main {
      public static void main(String[] args) {
          Student s1 = new Student("Ana", 40012345);
          Student s2 = new Student();
          s2.setName("Bo");
          System.out.println(s1.getName() + " " + s1.getId());
          System.out.println(s2.getName() + " " + s2.getId());
      }
  }
  class Student {
      private String name;
      private int id;
      public Student(String name, int id) { this.name = name; this.id = id; }
      public Student() { this("unknown", 0); }
      public String getName() { return name; }
      public int getId() { return id; }
      public void setName(String name) { this.name = name; }
  }
note: 'Step into the constructors: this is the object being built, name alone is the parameter, this.name the field. The no-argument constructor delegates with this("unknown", 0). Remove this. from the two-argument constructor and see what the fields hold.'
```

## Encapsulation

> **Definition.** **Encapsulation** (information hiding) is declaring fields `private`,
> so only the class's own methods can touch them, and exposing what the outside needs
> through `public` methods. **Accessors** (getters, `getName()`) read a field;
> **mutators** (setters, `setName(…)`) change one — and can refuse.

The point is not ceremony. A `private double balance` with a `withdraw` method that
checks the amount means no code anywhere can make the balance negative; a `public`
balance means any line of any program can. The class becomes responsible for its own
**invariants** — the rules that are always true of a valid object — and every rule is
enforced in one place. Not every field needs a setter; an id that never changes has only
a getter.

```sim
id: java-encapsulation
custom: true
engine: java
code: |
  public class Main {
      public static void main(String[] args) {
          BankAccount acc = new BankAccount("Ana", 100);
          acc.deposit(50);
          System.out.println(acc.withdraw(500) + " -> " + acc.getBalance());
          System.out.println(acc.withdraw(120) + " -> " + acc.getBalance());
          acc.deposit(-30);
          System.out.println(acc.getBalance());
      }
  }
  class BankAccount {
      private String owner;
      private double balance;
      public BankAccount(String owner, double initial) { this.owner = owner; balance = initial < 0 ? 0 : initial; }
      public void deposit(double amount) { if (amount > 0) balance += amount; }
      public boolean withdraw(double amount) {
          if (amount <= 0 || amount > balance) return false;
          balance -= amount;
          return true;
      }
      public double getBalance() { return balance; }
  }
note: 'The balance can only move through deposit and withdraw, and both check their input — the invariant "balance ≥ 0" cannot be broken from main. Try adding acc.balance = -1000; to main: the compiler refuses.'
```

## toString and the shape of a class

`System.out.println(obj)` and string concatenation call the object's **`toString()`**
method; without one you get something like `Rectangle@1b6d3586`. Define
`public String toString()` to return a readable description, and printing objects (and
debugging) becomes easy. The conventional order inside a class file: fields, then
constructors, then methods (accessors and mutators, then the rest), with a comment on
each public method saying what it does and what it requires — the outline's "internal
code documentation".

> **Key insight.** A class bundles state and the operations allowed on it, and `private`
> is what makes the bundle mean something: the object can only be changed through methods
> that keep it valid. A constructor makes a valid object; `this` names it from inside;
> `toString` shows it.

**Equations**

- *One class, many objects*: $k$ calls to `new C(…)` produce $k$ objects with $k$ separate copies of each field and one shared copy of each method.
- *Invariant*: a condition $I$ on the fields such that every constructor establishes $I$ and every method preserves $I$ — e.g. $\texttt{balance} \ge 0$.

## Further reading

- [The Java Tutorials — Classes and Objects](https://docs.oracle.com/javase/tutorial/java/javaOO/index.html) — Declaring classes, fields, constructors and using `this`.
- [The Java Tutorials — Controlling Access to Members of a Class](https://docs.oracle.com/javase/tutorial/java/javaOO/accesscontrol.html) — What `private` and `public` mean.
