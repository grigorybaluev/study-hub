---
title: More on classes
order: 10
status: detailed
weeks: [11, 12]
introduces: []
requires:
  - {concept: object-reference, strength: hard}
  - {concept: string, strength: soft}
reinforces:
  - {concept: class-and-object, perspective: "static members, overloading, wrapper classes, packages and class design"}
  - {concept: function-definition, perspective: "overloading resolved by parameter types"}
---

The rest of what a class can contain — `static` members, overloaded methods and
constructors, wrapper classes — plus packages, and how to decide what a class should
look like before writing it.

## Static members

> **Definition.** A **static** field belongs to the class, not to any object: there is
> exactly one copy, shared by every instance, and it exists even when no object does. A
> **static method** belongs to the class too — it is called as `ClassName.method()` and
> has no `this`, so it can use only its parameters and static fields.

Static fields are for what is shared: a counter of how many objects have been created, a
running total, a **class constant** (`public static final double RATE = 0.05;` — the
combination of `static`, `final` and `ALL_CAPS` is the Java idiom for a named constant).
Static methods are for work that needs no particular object: `Math.sqrt`, a `main`,
utility methods like `isLeapYear`. The rule from the compiler's error message: a static
method cannot refer to an instance field or call an instance method without an object
in front of it ("non-static … cannot be referenced from a static context").

```sim
id: java-static-counter
custom: true
engine: java
code: |
  public class Main {
      public static void main(String[] args) {
          System.out.println("tickets sold: " + Ticket.getSold());
          Ticket a = new Ticket("row A");
          Ticket b = new Ticket("row B");
          Ticket c = new Ticket("row A");
          System.out.println(a + " " + b + " " + c);
          System.out.println("tickets sold: " + Ticket.getSold() + ", price " + Ticket.PRICE);
      }
  }
  class Ticket {
      public static final double PRICE = 12.5;
      private static int sold = 0;
      private int number;
      private String seat;
      Ticket(String seat) { sold++; number = sold; this.seat = seat; }
      static int getSold() { return sold; }
      public String toString() { return "#" + number + "/" + seat; }
  }
note: 'The Variables panel shows Ticket.sold once, under static fields, while each object has its own number and seat. Step through the three constructors and watch the shared counter feed the per-object number.'
```

## Overloading

> **Definition.** Two methods (or constructors) in one class are **overloaded** when
> they share a name but differ in their parameter lists — number or types. The compiler
> picks the one whose parameters match the arguments' types, widening (`int` to
> `double`) if no exact match exists.

Overloading is for one *operation* on several kinds of input — `print(int)`,
`print(double)`, `print(String)`; a `Point()` and a `Point(int, int)` — not for two
unrelated jobs with a convenient name. The return type alone cannot distinguish overloads.
Ambiguity is a compile error, and a call that matches by widening picks the *most
specific* candidate, which surprises people with `char` arguments (a `char` widens to
`int` before it would convert to anything else).

```sim
id: java-overloading
custom: true
engine: java
code: |
  static String describe(int n) { return "int " + n; }
  static String describe(double d) { return "double " + d; }
  static String describe(String s) { return "String \"" + s + "\""; }
  static double area(double side) { return side * side; }
  static double area(double w, double h) { return w * h; }
  System.out.println(describe(7));
  System.out.println(describe(7.0));
  System.out.println(describe("7"));
  System.out.println(describe('7'));
  System.out.println(area(3) + " " + area(3, 4));
note: 'Same name, chosen by the arguments'' types. describe(''7'') picks the int version — a char widens to int, and prints the character code 55. Add a describe(char c) overload and run again.'
```

## Wrapper classes

Every primitive has a class twin — `Integer`, `Double`, `Boolean`, `Character` — that
exists so a primitive can be treated as an object where one is required (the collections
of COMP 249) and, for now, as a home for utilities and constants: `Integer.parseInt("42")`
and `Double.parseDouble("2.5")` convert text to numbers (throwing a
`NumberFormatException` on bad text — the way to validate a line read with `nextLine()`);
`Integer.MAX_VALUE` and `Integer.MIN_VALUE` are the limits from the first unit;
`Character.isDigit(c)`, `isLetter`, `toUpperCase` classify and convert single characters.
Java converts between `int` and `Integer` automatically (**autoboxing**); you will not
need it until next term.

```sim
id: java-wrappers
custom: true
engine: java
code: |
  Scanner in = new Scanner(System.in);
  String line = in.nextLine();
  int digits = 0, letters = 0;
  for (int i = 0; i < line.length(); i++) {
      char c = line.charAt(i);
      if (Character.isDigit(c)) digits++;
      else if (Character.isLetter(c)) letters++;
  }
  System.out.println(digits + " digits, " + letters + " letters");
  String num = in.nextLine().trim();
  int n = Integer.parseInt(num);
  System.out.println(n + " doubled is " + (n * 2) + "; max int is " + Integer.MAX_VALUE);
  System.out.println(Double.parseDouble("2.5e3") + " " + Integer.parseInt("12a"));
stdin: |
  COMP 248 in fall 2016
    37
note: 'Character.* classify one char at a time; Integer.parseInt turns a trimmed line into a number and refuses text it cannot read — the last line shows the NumberFormatException. Put "3.5" as the second input line and see which call fails.'
```

## Packages and import

Classes are grouped into **packages** — `java.lang` (String, Math, the wrappers: always
available), `java.util` (Scanner, Arrays), and so on. A class outside `java.lang` is
named in full (`java.util.Scanner`) or imported once at the top of the file
(`import java.util.Scanner;`), which is why every Scanner program starts that way. The
Java API documentation is organised by package; learning to read a class's page —
constructors, then methods, each with its parameters and return type — is how you use a
class you have never seen.

## Designing a class

Before writing a class, answer four questions in writing:

1. **What does one object represent?** One noun from the problem; if the answer has
   "and" in it, that is two classes.
2. **What must always be true of it?** The invariants — those become checks in the
   constructor and mutators.
3. **What can the outside do with it?** The public methods, named for what they do
   (`deposit`, `isOverdue`, `toString`), each with a one-line comment.
4. **What is shared by all objects?** Static fields and constants.

Then fields (`private`), constructors (every one leaves a valid object), accessors only
where needed, `toString` always, `equals` when objects will be compared. An
**immutable** class — no mutators, fields set once by the constructor — is the simplest
kind and a good default for values like a `Point` or a `Date`.

> **Key insight.** `static` means "of the class, not of the object": one shared copy, no
> `this`. Overloading is one name for one operation on several types, resolved at compile
> time by the arguments. The wrappers and `Math` are the standard library's way of giving
> primitives a class to hang utilities on — and a class's design is decided by its
> invariants and its public methods, not by its fields.

**Equations**

- *Static versus instance storage*: a class with $s$ static fields and $f$ instance fields, instantiated $k$ times, holds $s + k f$ field values.
- *Overload resolution*: among candidates with the right arity, choose the one every argument converts to with the least widening, and reject the call if two are equally specific.

## Further reading

- [The Java Tutorials — Understanding Class Members](https://docs.oracle.com/javase/tutorial/java/javaOO/classvars.html) — Static fields, static methods and constants.
- [The Java Tutorials — Defining Methods: Overloading](https://docs.oracle.com/javase/tutorial/java/javaOO/methods.html#overloading) — The rules and the advice to use it sparingly.
- [The Java Tutorials — The Numbers Classes](https://docs.oracle.com/javase/tutorial/java/data/numberclasses.html) — Wrapper classes, `parseInt`, and the constants.
- [Java Platform SE 8 API](https://docs.oracle.com/javase/8/docs/api/) — The package index; start from `java.lang` and `java.util`.
