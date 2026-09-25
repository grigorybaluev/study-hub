---
title: Polymorphism and abstract classes
order: 3
status: detailed
weeks: [3]
introduces: [polymorphism]
requires:
  - {concept: inheritance, strength: hard}
  - {concept: object-reference, strength: hard}
  - {concept: array, strength: soft}
reinforces: []
---

A `Shape` variable may hold a `Circle` or a `Rectangle`, and `s.area()` runs whichever
class's version fits the object actually there. That is polymorphism, and it is the
reason inheritance is worth the trouble: one loop over `Shape[]` handles every kind of
shape, including kinds written after the loop. This unit separates the two types every
reference has, explains late binding, and introduces abstract classes as the honest way
to say "every shape has an area, but *Shape* itself does not know how to compute it".

## Static type and dynamic type

> **Definition.** A reference variable has a **static type** — the type in its
> declaration, fixed at compile time — and refers to an object whose **dynamic type**
> (run-time class) is that type or any subclass of it. `Shape s = new Circle(2);` has
> static type `Shape` and dynamic type `Circle`.

The compiler only knows the static type. So `s.area()` compiles only if `Shape` declares
`area()`; `s.radius()` does not compile even though the object has a radius, because some
other `Shape` might not. Assigning up the hierarchy (`Shape s = circle`) needs no cast —
an **upcast** is always safe. Assigning down (`Circle c = s`) needs an explicit
**downcast** `(Circle) s`, which the compiler allows and the run time checks: if the
object is not a `Circle`, `ClassCastException`. Test first with `instanceof`.

```sim
id: java-249-static-dynamic
custom: true
engine: java
code: |
  public class Main {
      public static void main(String[] args) {
          Shape s = new Circle(2);
          System.out.println(s.area());
          System.out.println(s instanceof Circle);
          if (s instanceof Circle) {
              Circle c = (Circle) s;
              System.out.println(c.radius());
          }
          Shape r = new Rectangle(2, 3);
          Circle bad = (Circle) r;
      }
  }
  class Shape {
      double area() { return 0; }
  }
  class Circle extends Shape {
      private double r;
      Circle(double r) { this.r = r; }
      double radius() { return r; }
      @Override double area() { return Math.PI * r * r; }
  }
  class Rectangle extends Shape {
      private double w, h;
      Rectangle(double w, double h) { this.w = w; this.h = h; }
      @Override double area() { return w * h; }
  }
note: 'The Variables panel shows s = Circle#… although s is declared Shape: that is the two types side by side. The last line downcasts a Rectangle to Circle and ends in ClassCastException. Then try s.radius() without the cast and read the compile error — the static type decides what compiles.'
```

## Late binding

> **Definition.** **Late (dynamic) binding**: which override runs for `s.area()` is
> decided at run time from the object's dynamic type, not from the variable's static
> type. Java does this for every non-static, non-private, non-final method call. The
> effect is **polymorphism** — "many forms": the same call, different behaviour per class.

Contrast with **overloading**, which is resolved at compile time from the static types of
the arguments. Given `print(Shape)` and `print(Circle)`, calling `print(s)` with `s` of
static type `Shape` picks `print(Shape)` even when `s` holds a `Circle`; inside, `s.area()`
still late-binds to `Circle.area`. Static methods and fields are never late-bound either:
a "hidden" static method is chosen by the static type.

```sim
id: java-249-late-binding
custom: true
engine: java
code: |
  public class Main {
      static String describe(Shape s) { return "a shape of area " + s.area(); }
      static String describe(Circle c) { return "a circle of radius " + c.radius(); }
      public static void main(String[] args) {
          Shape[] shapes = { new Circle(1), new Rectangle(2, 3), new Circle(0.5) };
          double total = 0;
          for (Shape s : shapes) {
              System.out.println(describe(s));
              total += s.area();
          }
          System.out.printf("total %.2f%n", total);
          Circle c = new Circle(1);
          System.out.println(describe(c));
      }
  }
  class Shape { double area() { return 0; } }
  class Circle extends Shape {
      private double r;
      Circle(double r) { this.r = r; }
      double radius() { return r; }
      @Override double area() { return Math.PI * r * r; }
  }
  class Rectangle extends Shape {
      private double w, h;
      Rectangle(double w, double h) { this.w = w; this.h = h; }
      @Override double area() { return w * h; }
  }
note: 'Inside the loop every element has static type Shape, so describe(Shape) is chosen for all three (overloading, compile time) while s.area() runs the Circle or Rectangle version (overriding, run time). The direct call with a Circle variable picks the other overload. Add a Triangle class and the loop needs no change.'
```

## Abstract classes and methods

The `Shape.area()` above returns `0` — a lie that exists only so the method can be
called. Java lets a class admit it has no sensible implementation:

> **Definition.** An **abstract method** has a signature and no body
> (`abstract double area();`). A class with at least one abstract method must itself be
> declared **abstract**, and an abstract class cannot be instantiated — `new Shape()` is
> a compile error. A concrete (non-abstract) subclass must override every abstract
> method it inherits, or the compiler refuses it. Abstract classes may still have
> fields, constructors (called through `super(...)`) and ordinary methods, and those
> ordinary methods may call the abstract ones — late binding fills them in.

So an abstract class is a partial implementation plus a contract for what subclasses must
supply. The variable type `Shape` remains perfectly usable; only `new Shape` is banned.

```sim
id: java-249-abstract
custom: true
engine: java
code: |
  public class Main {
      public static void main(String[] args) {
          Shape[] shapes = { new Circle(1), new Square(2) };
          for (Shape s : shapes) System.out.println(s);
      }
  }
  abstract class Shape {
      private String name;
      Shape(String name) { this.name = name; }
      abstract double area();
      double scaledArea(double k) { return k * k * area(); }
      @Override public String toString() { return name + " area " + area() + ", doubled " + scaledArea(2); }
  }
  class Circle extends Shape {
      private double r;
      Circle(double r) { super("circle"); this.r = r; }
      @Override double area() { return Math.PI * r * r; }
  }
  class Square extends Shape {
      private double side;
      Square(double side) { super("square"); this.side = side; }
      @Override double area() { return side * side; }
  }
note: 'toString and scaledArea live in the abstract class and call area(), which each subclass provides. Add Shape nothing = new Shape("?"); to main: the program no longer compiles, abstract classes cannot be instantiated. Then remove area() from Square and read the other error the compiler gives.'
```

## Designing with polymorphism

- Put what is common in the superclass, what varies in overrides, and what the
  superclass cannot know in abstract methods.
- Program to the general type: parameters, array elements and return types of the
  superclass type, so callers stay unchanged when subclasses are added.
- `instanceof` chains (`if (s instanceof Circle) … else if (s instanceof Square) …`)
  are usually a sign that a method belongs in the classes instead.
- Override `toString` and `equals` in the classes that hold data; `Object`'s versions are
  rarely what a subclass wants.
- Clone and copy: copying a polymorphic object needs the *dynamic* type's copy
  constructor, which is why the textbook's `clone` discussion appears here.

> **Key insight.** Two types, two moments: the static type governs what *compiles*
> (which methods may be called, which overload is chosen), the dynamic type governs what
> *runs* (which override). Every polymorphism question reduces to asking which of the two
> is in play.

## Further reading

- [The Java Tutorials — Polymorphism](https://docs.oracle.com/javase/tutorial/java/IandI/polymorphism.html) — Virtual method invocation with a bicycle hierarchy.
- [The Java Tutorials — Abstract Methods and Classes](https://docs.oracle.com/javase/tutorial/java/IandI/abstract.html) — When to choose an abstract class over an interface (the next-but-one unit).
