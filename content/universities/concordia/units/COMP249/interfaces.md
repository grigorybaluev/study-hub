---
title: Interfaces
order: 8
status: detailed
weeks: [8]
introduces: [interface]
requires:
  - {concept: polymorphism, strength: hard}
  - {concept: inheritance, strength: hard}
reinforces: []
---

An abstract class says "every shape has an area" and also *is* a shape. An interface says
only the first part: it lists methods, and any class whatever — shape, employee, string
— may promise to provide them. That is how one sorting method sorts anything
`Comparable`, and how a class can play several roles at once despite single inheritance.

## What an interface is

> **Definition.** An **interface** is a type that declares method headers without
> bodies (implicitly `public abstract`) and, optionally, constants (implicitly
> `public static final`). A class **implements** an interface by listing it after
> `implements` and defining every method with `public`; the class may implement several
> interfaces, and interfaces may extend other interfaces. An interface cannot be
> instantiated, but it is a full-fledged *type*: variables, parameters, array elements
> and return values may be declared with it, and they may refer to any object of any
> implementing class.

Through an interface-typed variable only the interface's methods are callable — the
static-type rule of polymorphism again — and the call late-binds to the object's class.
`instanceof` and casts work with interfaces exactly as with classes.

```sim
id: java-249-interface-basics
custom: true
engine: java
code: |
  interface Measurable {
      double NONE = 0;
      double measure();
  }
  class Circle implements Measurable {
      private double r;
      Circle(double r) { this.r = r; }
      public double measure() { return Math.PI * r * r; }
  }
  class Employee implements Measurable {
      private String name; private double salary;
      Employee(String name, double salary) { this.name = name; this.salary = salary; }
      public double measure() { return salary; }
      public String getName() { return name; }
  }
  public class Main {
      static double largest(Measurable[] items) {
          double best = Measurable.NONE;
          for (Measurable m : items) if (m.measure() > best) best = m.measure();
          return best;
      }
      public static void main(String[] args) {
          Measurable[] things = { new Circle(1), new Employee("Ana", 52000), new Circle(3) };
          System.out.println(largest(things));
          Measurable m = things[1];
          if (m instanceof Employee) System.out.println(((Employee) m).getName());
      }
  }
note: 'A circle and an employee have nothing in common except that each can be measured, so a class hierarchy would be wrong; an interface fits. Add System.out.println(m.getName()); without the cast and the program does not compile: through a Measurable variable only measure() is visible. Add a third class (a String wrapper measured by length) and largest() needs no change.'
```

## Interface versus abstract class

| | abstract class | interface |
|---|---|---|
| fields | yes, any | constants only |
| constructors | yes (run via `super`) | none |
| method bodies | any mix of abstract and concrete | `default` and `static` methods only (Java 8+) |
| a class may have | exactly one superclass | any number of interfaces |
| expresses | "is a kind of", shared implementation | "can do", a capability |

Choose an abstract class when subclasses share code and state; choose an interface when
unrelated classes need a common protocol, or when a class already extends something
else. Often both: an interface for the contract, an abstract class that implements the
boring part of it for subclasses that want it.

A **`default` method** gives an interface method a body that implementing classes
inherit unless they override it — the way a library interface grows without breaking
the classes that already implement it. A **`static` method** in an interface is a
helper called as `Interface.method()`.

## Comparable: the interface the library relies on

`Comparable<T>` declares one method, `int compareTo(T other)`: negative when `this`
comes before `other`, zero when they rank equal, positive when after. Implement it and
`Arrays.sort`, `Collections.sort`, `TreeSet` and every other ordered container know how
to order your objects. `String`, `Integer` and the other wrappers implement it already.
The convention: `compareTo` should be consistent with `equals`, and for numbers use
`Double.compare(a, b)` rather than the subtraction trick, which overflows or truncates.

```sim
id: java-249-comparable
custom: true
engine: java
code: |
  import java.util.Arrays;
  class Student implements Comparable<Student> {
      private String name; private double gpa;
      Student(String name, double gpa) { this.name = name; this.gpa = gpa; }
      public int compareTo(Student other) {
          int byGpa = Double.compare(other.gpa, gpa);   // descending GPA
          return byGpa != 0 ? byGpa : name.compareTo(other.name);
      }
      public String toString() { return name + " " + gpa; }
  }
  public class Main {
      static <T extends Comparable<T>> T maxOf(T[] items) {
          T best = items[0];
          for (T x : items) if (x.compareTo(best) > 0) best = x;
          return best;
      }
      public static void main(String[] args) {
          Student[] s = { new Student("Bo", 3.4), new Student("Ana", 3.9), new Student("Cy", 3.4) };
          Arrays.sort(s);
          System.out.println(Arrays.toString(s));
          System.out.println("max: " + maxOf(s));
          Integer[] nums = {4, 17, 9};
          System.out.println(maxOf(nums) + " " + maxOf(new String[] {"pear", "apple"}));
      }
  }
note: 'One compareTo makes Student sortable by the library and by maxOf, which works for any Comparable type — Integer and String included. Change compareTo to sort ascending by name only, or return 0 for everyone and see what sort does with ties (it keeps their order).'
```

## Interfaces as parameters: strategy objects

Because an interface variable can hold any implementing object, a method can be handed
*behaviour*: a `Comparator<T>` object tells `sort` how to order, a `Filter` object tells
a search what to keep. The class that implements the interface is often tiny and
exists only to be passed along — which is why the next unit's anonymous classes and
lambdas were added to the language.

```sim
id: java-249-strategy
custom: true
engine: java
code: |
  import java.util.*;
  interface Filter { boolean keep(int x); }
  class Even implements Filter { public boolean keep(int x) { return x % 2 == 0; } }
  class AtLeast implements Filter {
      private int min;
      AtLeast(int min) { this.min = min; }
      public boolean keep(int x) { return x >= min; }
  }
  public class Main {
      static ArrayList<Integer> select(int[] data, Filter f) {
          ArrayList<Integer> out = new ArrayList<>();
          for (int x : data) if (f.keep(x)) out.add(x);
          return out;
      }
      public static void main(String[] args) {
          int[] data = {3, 8, 12, 5, 20, 7};
          System.out.println(select(data, new Even()));
          System.out.println(select(data, new AtLeast(8)));
          Filter big = new AtLeast(12);
          System.out.println(select(data, big) + " " + big.keep(4));
      }
  }
note: 'select never changes; the rule it applies is an object. Write a third Filter (odd numbers, or multiples of a given k) and pass it. Then look ahead: the next unit writes new Filter() { … } and x -> x > 10 in place of a whole class.'
```

> **Key insight.** Inheritance shares code; an interface shares only a promise. Program
> against the promise — the parameter type is the interface — and any class that keeps
> it, written by anyone, at any later date, works with your code.

## Further reading

- [The Java Tutorials — Interfaces](https://docs.oracle.com/javase/tutorial/java/IandI/createinterface.html) — Defining, implementing and using an interface as a type; default methods.
- [Java API — Comparable](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/lang/Comparable.html) — The contract, including the "consistent with equals" recommendation.
