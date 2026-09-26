---
title: Inheritance
order: 2
status: detailed
weeks: [2]
introduces: [inheritance]
requires:
  - {concept: class-and-object, strength: hard}
  - {concept: object-reference, strength: hard}
reinforces: []
---

A class can be defined as "a `Person`, plus a student number": the new class **inherits**
every field and method of the old one and adds or replaces what differs. This unit is
about what exactly is inherited, how constructors chain, and the rules for replacing a
method — the mechanics that polymorphism (next unit) builds on.

## Subclass, superclass, is-a

> **Definition.** `class Student extends Person { … }` makes `Student` a **subclass**
> (derived class) of the **superclass** `Person`. Every member of `Person` is part of
> every `Student` object; a `Student` *is a* `Person` and can be used wherever a
> `Person` is expected. The relation is transitive, so a class inherits from its
> superclass's superclass as well, all the way up to `Object`, the root of every class
> in Java. A class extends exactly one class (single inheritance).

Use `extends` when the sentence "an *X* is a *Y*" is true of the things being modelled,
not merely when two classes share some code. A `Car` is not an `Engine`; a `Car` *has*
an engine — that is a field.

```sim
id: java-249-inherit-basics
custom: true
engine: java
code: |
  public class Main {
      public static void main(String[] args) {
          Person p = new Person("Ana", 1990);
          Student s = new Student("Bo", 2004, 40012345);
          System.out.println(p.describe());
          System.out.println(s.describe());
          System.out.println(s.getName() + " is " + s.age(2026));
          System.out.println(s.getId());
      }
  }
  class Person {
      private String name;
      private int birthYear;
      public Person(String name, int birthYear) { this.name = name; this.birthYear = birthYear; }
      public String getName() { return name; }
      public int age(int year) { return year - birthYear; }
      public String describe() { return "Person " + name; }
  }
  class Student extends Person {
      private int id;
      public Student(String name, int birthYear, int id) {
          super(name, birthYear);
          this.id = id;
      }
      public int getId() { return id; }
  }
note: 'Student adds one field and one method; getName, age and describe come from Person unchanged. Look at the object in the Variables panel: a Student holds name and birthYear too, even though Student never declares them. Then add a getId() call on p and read the error.'
```

## Constructors are not inherited — they chain

A constructor builds *its own* class's part of the object. The superclass part must be
built first, by a superclass constructor, and the subclass constructor says which one:

- `super(args);` as the **first statement** calls that superclass constructor.
- If it is omitted, Java inserts `super();` — which fails to compile when the superclass
  has no zero-argument constructor. That is the commonest inheritance error in week 2.
- `this(args);` delegates to another constructor of the same class instead; the chain
  still ends in a `super(...)` somewhere.

The order of events for `new Student(...)`: `Person`'s constructor runs (with `Person`'s
field initialisers before its body), then `Student`'s field initialisers, then
`Student`'s constructor body.

```sim
id: java-249-ctor-chain
custom: true
engine: java
code: |
  public class Main {
      public static void main(String[] args) {
          Manager m = new Manager("Cy", 5);
          System.out.println(m);
      }
  }
  class Employee {
      protected String name;
      protected double rate = 20;
      Employee(String name) { System.out.println("Employee(" + name + ")"); this.name = name; }
      Employee() { this("nobody"); System.out.println("Employee()"); }
      public String toString() { return name + " @ " + rate; }
  }
  class Manager extends Employee {
      private int reports;
      Manager(String name, int reports) {
          super(name);
          System.out.println("Manager(" + name + ", " + reports + ")");
          this.reports = reports;
          rate = 35;
      }
      Manager() { System.out.println("Manager()"); }
  }
note: 'Step through the frames: Manager(String, int) pushes Employee(String) before its own body runs. Change main to new Manager() and watch the implicit super() route through Employee() and this("nobody"). Then delete the Employee() constructor and read the error the implicit super() causes.'
```

## Private, protected and what is really inherited

Every field of the superclass exists inside the subclass object, but a **`private`** one
is not *accessible* from subclass code: `Student` cannot write `name` directly, it must
go through `getName()` or a protected accessor. The **`protected`** modifier opens a
member to subclasses (and to the package). `public` is open to everyone. The habit the
course asks for: fields `private`, accessors `public`, and `protected` only when a
subclass genuinely needs direct access.

Private *methods* are likewise invisible to the subclass — a subclass method with the same
name is a new, unrelated method, not an override.

## Overriding

> **Definition.** A subclass **overrides** an inherited method by declaring a method
> with the same name, parameter list and (compatible) return type. Calls on an object of
> the subclass run the new version. `super.method()` inside the subclass calls the
> superclass version — the usual shape of an override that *extends* rather than replaces
> the inherited behaviour. Mark overrides with `@Override` so the compiler complains if
> the signature does not actually match anything (a misspelled `tostring` silently
> becomes a new method without it).

Rules the compiler enforces: an override cannot be less accessible than the original
(`public` cannot become `private`), cannot change the return type to an unrelated one,
and a **`final`** method cannot be overridden at all (a `final` class cannot be extended).

Overriding is not overloading: same signature in a *subclass* versus a different parameter
list in the *same* class. The next unit shows why the distinction matters at run time.

```sim
id: java-249-override-super
custom: true
engine: java
code: |
  public class Main {
      public static void main(String[] args) {
          SavingsAccount s = new SavingsAccount(1000, 0.02);
          s.addInterest();
          s.withdraw(200);
          System.out.println(s);
      }
  }
  class Account {
      protected double balance;
      Account(double balance) { this.balance = balance; }
      public void withdraw(double x) { balance -= x; }
      public String toString() { return "balance " + balance; }
  }
  class SavingsAccount extends Account {
      private double rate;
      SavingsAccount(double balance, double rate) { super(balance); this.rate = rate; }
      public void addInterest() { balance += balance * rate; }
      @Override
      public void withdraw(double x) {
          if (balance - x < 0) { System.out.println("refused"); return; }
          super.withdraw(x);
      }
      @Override
      public String toString() { return "savings: " + super.toString() + " at " + rate; }
  }
note: 'Both overrides extend the inherited method through super.…(). Try withdrawing 2000 to hit the guard. Then misspell withdraw as withdraw2 under @Override and read the compiler message — that annotation is the cheapest bug-catcher in the language.'
```

## Shadowing, `Object`, and `equals`

A subclass *field* with the same name as a superclass field does not override it: both
exist, and which one a method sees depends on which class the method is written in
(`super.name` reaches the hidden one). It is legal, confusing, and never necessary; the
stepper shows both copies when it happens.

Every class ultimately extends `Object`, which is where `toString()`, `equals(Object)`
and `hashCode()` come from. The inherited `equals` compares references, so a class that
means "same contents" must override it — with the parameter type `Object`, otherwise it
is an overload that collections and the rest of the library will never call:

```java
@Override
public boolean equals(Object other) {
    if (!(other instanceof Point)) return false;
    Point p = (Point) other;
    return x == p.x && y == p.y;
}
```

> **Key insight.** Inheritance copies nothing: a subclass object simply *contains* a
> complete superclass object, built by a superclass constructor before the subclass adds
> its part. Everything else — access rules, overriding, `super` — follows from that
> picture.

## Further reading

- [The Java Tutorials — Inheritance](https://docs.oracle.com/javase/tutorial/java/IandI/subclasses.html) — What a subclass inherits, casting, and the `Object` class.
- [The Java Tutorials — Overriding and Hiding Methods](https://docs.oracle.com/javase/tutorial/java/IandI/override.html) — The rules for overrides, including the modifier table.
