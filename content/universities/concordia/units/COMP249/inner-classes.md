---
title: Nested, inner and anonymous classes
order: 9
status: detailed
weeks: [9]
notes: ["COMP 249 course outline (Winter 2026): week 9, ch. 13, Interfaces & Inner Classes (second week: inner classes)"]
introduces: []
requires:
  - {concept: interface, strength: hard}
  - {concept: class-and-object, strength: hard}
  - {concept: object-reference, strength: soft}
reinforces:
  - {concept: class-and-object, perspective: "classes declared inside classes: static nested, inner with an enclosing instance, local and anonymous classes, and lambdas as their shorthand"}
---

A class may be declared inside another class. That sounds like a curiosity until two
needs meet it: a helper type that means nothing outside its owner (the node of a list),
and a one-off object that implements an interface for a single call (a comparator, a
filter). The four kinds of nested class differ only in *what they can see*, and lambdas
are the short form of the last one.

## Static nested classes

> **Definition.** A **static nested class** is declared with `static` inside another
> class. It is an ordinary class whose name lives inside the outer one
> (`Outer.Nested`), with access to the outer class's private *static* members and to
> the private members of any `Outer` object it is handed. It has no connection to any
> particular outer object.

Use it for helper types that belong with a class: `LinkedList.Node`, `Map.Entry`. If
the helper is `private`, no code outside the outer class can even name it, which is the
strongest encapsulation Java offers for an implementation detail.

```sim
id: java-249-static-nested
custom: true
engine: java
code: |
  public class Main {
      public static void main(String[] args) {
          Bank bank = new Bank();
          bank.open("Ana", 100);
          bank.open("Bo", 250);
          Bank.Summary s = bank.summary();
          System.out.println(s.count + " accounts, total " + s.total);
          System.out.println(s);
      }
  }
  class Bank {
      private static class Account {          // nobody outside Bank can name this type
          String owner; double balance;
          Account(String owner, double balance) { this.owner = owner; this.balance = balance; }
      }
      public static class Summary {           // a small result type that belongs with Bank
          public int count; public double total;
          public String toString() { return "Summary[" + count + ", " + total + "]"; }
      }
      private Account[] accounts = new Account[10];
      private int n = 0;
      void open(String owner, double amount) { accounts[n++] = new Account(owner, amount); }
      Summary summary() {
          Summary s = new Summary();
          for (int i = 0; i < n; i++) { s.count++; s.total += accounts[i].balance; }
          return s;
      }
  }
note: 'Two nested classes with two jobs: Account is a private implementation detail, Summary a public result type named Bank.Summary from outside. Try new Bank.Account("x", 1) in main and read the access error.'
```

## Inner classes

> **Definition.** A non-static nested class is an **inner class**. Each inner object is
> created *from within* an object of the outer class (or as `outerObject.new Inner()`)
> and keeps a hidden reference to that enclosing instance, so its methods use the outer
> object's fields and methods directly, as if they were its own — including private
> ones. An inner class cannot declare static members of its own.

The classic use is an object whose whole purpose is to walk or modify the enclosing
object — an iterator over a collection — because "the collection I belong to" is
available without being passed around.

```sim
id: java-249-inner
custom: true
engine: java
code: |
  public class Main {
      public static void main(String[] args) {
          Playlist p = new Playlist();
          p.add("Intro"); p.add("Verse"); p.add("Chorus");
          Playlist.Cursor c = p.cursor();
          while (c.hasNext()) System.out.println(c.next());
          Playlist.Cursor again = p.new Cursor();
          System.out.println(again.next() + " (" + p.plays + " plays)");
      }
  }
  class Playlist {
      private String[] songs = new String[8];
      private int size = 0;
      int plays = 0;
      void add(String s) { songs[size++] = s; }
      Cursor cursor() { return new Cursor(); }
      class Cursor {                              // inner: sees songs, size, plays of its Playlist
          private int at = 0;
          boolean hasNext() { return at < size; }
          String next() { plays++; return songs[at++]; }
      }
  }
note: 'Every Cursor belongs to one Playlist: its methods read songs and size and even change plays without a reference being passed. Watch the Variables panel — c has its own at, and the outer object it was created from. Try new Playlist.Cursor() in main with no instance and read the error.'
```

## Local and anonymous classes

A class can also be declared *inside a method* (a **local class**), visible only there
and able to use the method's local variables provided they are **effectively final**
(assigned once). Shorter still is the **anonymous class**: a class with no name,
declared and instantiated in one expression, usually to implement an interface for
a single use.

> **Definition.** `new Interface() { … body … }` creates an object of an unnamed class
> that implements `Interface` (or extends a class, when a class name is used) with the
> members given in the body. It may read effectively-final local variables of the
> enclosing method and, in an instance method, the enclosing object's members.

```sim
id: java-249-anonymous
custom: true
engine: java
code: |
  import java.util.*;
  interface Filter { boolean keep(String s); }
  public class Main {
      static ArrayList<String> select(String[] words, Filter f) {
          ArrayList<String> out = new ArrayList<>();
          for (String w : words) if (f.keep(w)) out.add(w);
          return out;
      }
      public static void main(String[] args) {
          String[] words = {"kiwi", "fig", "banana", "plum", "apple"};
          final int minLength = 5;
          Filter longOnes = new Filter() {
              public boolean keep(String s) { return s.length() >= minLength; }
          };
          System.out.println(select(words, longOnes));
          System.out.println(select(words, new Filter() {
              public boolean keep(String s) { return s.startsWith("p") || s.endsWith("g"); }
          }));
          Arrays.sort(words, new Comparator<String>() {
              public int compare(String a, String b) { return b.length() - a.length(); }
          });
          System.out.println(Arrays.toString(words));
      }
  }
note: 'Three throwaway objects, none with a class name: two filters and a comparator. The first one uses minLength from the enclosing method — try assigning minLength = 6 after the declaration and read why the compiler refuses. Then rewrite the second filter as a named class and compare the amount of code.'
```

## Lambdas: the anonymous class, shortened

When the interface has exactly one abstract method (a **functional interface** —
`Comparator`, `Runnable`, the `Filter` above), an anonymous class is mostly ceremony.
A **lambda expression** keeps only the parameters and the body:

```java
Filter longOnes = s -> s.length() >= 5;
Arrays.sort(words, (a, b) -> b.length() - a.length());
list.forEach(x -> System.out.println(x));
```

Parameter types are inferred from the interface; a body with several statements goes in
braces with an explicit `return`. The same effectively-final rule applies to captured
locals. Lambdas do not replace anonymous classes that need fields, several methods or
`this` of their own — but for passing a rule or an ordering to a method, they are the
form the course expects from here on.

```sim
id: java-249-lambdas
custom: true
engine: java
code: |
  import java.util.*;
  interface Filter { boolean keep(int x); }
  public class Main {
      static int count(int[] data, Filter f) {
          int n = 0;
          for (int x : data) if (f.keep(x)) n++;
          return n;
      }
      public static void main(String[] args) {
          int[] data = {3, 8, 12, 5, 20, 7, 16};
          int limit = 10;
          System.out.println(count(data, x -> x % 2 == 0));
          System.out.println(count(data, x -> x > limit));
          Filter inRange = x -> { int lo = 5, hi = 15; return x >= lo && x <= hi; };
          System.out.println(count(data, inRange));
          ArrayList<String> names = new ArrayList<>(List.of("Cy", "Ana", "Bo"));
          names.sort((a, b) -> a.compareTo(b));
          names.forEach(n -> System.out.print(n + " "));
          System.out.println();
      }
  }
note: 'Each lambda becomes a Filter object; step into count and watch the lambda frame appear with its parameter bound. The block form needs braces and return. Replace the second lambda with an anonymous class to see exactly what the short form stands for.'
```

> **Key insight.** Nesting is about visibility: a static nested class sees the outer
> class, an inner class sees one outer *object*, a local or anonymous class sees the
> method it sits in. Lambdas are anonymous classes for one-method interfaces — the same
> object, less text.

## Further reading

- [The Java Tutorials — Nested Classes](https://docs.oracle.com/javase/tutorial/java/javaOO/nested.html) — Static nested versus inner, with the shadowing rules.
- [The Java Tutorials — Lambda Expressions](https://docs.oracle.com/javase/tutorial/java/javaOO/lambdaexpressions.html) — From anonymous class to lambda, step by step.
