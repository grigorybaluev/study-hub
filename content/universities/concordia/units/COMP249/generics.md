---
title: Generics
order: 10
status: detailed
weeks: [10]
notes: ["COMP 249 course outline (Winter 2026): week 10, ch. 14, Generics"]
introduces: [generics]
requires:
  - {concept: class-and-object, strength: hard}
  - {concept: interface, strength: hard}
  - {concept: polymorphism, strength: soft}
reinforces: []
---

A `Box` class that holds an `Object` can hold anything — and gives back an `Object`, so
every `get` needs a cast and a wrong cast is found only at run time. A `Box<T>` holds a
`T` chosen by whoever creates the box, and the compiler checks every use. Generics are
how the collections of the next units know what they contain; this unit is about
writing generic classes and methods yourself.

## The problem generics solve

```java
class ObjectBox { private Object item; void set(Object x) { item = x; } Object get() { return item; } }
ObjectBox b = new ObjectBox();
b.set("hello");
Integer n = (Integer) b.get();      // compiles; ClassCastException at run time
```

The cast is the programmer promising something the compiler cannot check. With a type
parameter the promise is written once, in the declaration, and checked everywhere.

## Generic classes

> **Definition.** A **generic class** has one or more **type parameters** in angle
> brackets after its name, `class Box<T>`. Inside the class `T` is used like a type —
> for fields, parameters, return values, locals. A use of the class supplies a **type
> argument**, `Box<String>`, and the compiler treats every `T` in that object as
> `String`: `set(5)` is a compile error and `get()` needs no cast. Type arguments must be
> reference types — `Box<int>` is illegal, `Box<Integer>` is the way, with autoboxing
> filling the gap.

Conventions: single capital letters, `T` for a type, `E` for an element, `K`/`V` for key
and value. On the right of an assignment the type argument can be left to inference with
the **diamond**: `Box<String> b = new Box<>();`.

```sim
id: java-249-generic-class
custom: true
engine: java
code: |
  class Box<T> {
      private T item;
      public void set(T x) { item = x; }
      public T get() { return item; }
      public boolean isEmpty() { return item == null; }
      public String toString() { return "Box(" + item + ")"; }
  }
  class Pair<K, V> {
      private K key; private V value;
      public Pair(K key, V value) { this.key = key; this.value = value; }
      public K getKey() { return key; }
      public V getValue() { return value; }
      public Pair<V, K> swap() { return new Pair<>(value, key); }
      public String toString() { return "(" + key + ", " + value + ")"; }
  }
  public class Main {
      public static void main(String[] args) {
          Box<String> words = new Box<>();
          words.set("hello");
          String w = words.get();
          System.out.println(w.toUpperCase() + " " + words);
          Box<Integer> count = new Box<>();
          count.set(41);
          int next = count.get() + 1;
          System.out.println(next);
          Pair<String, Double> price = new Pair<>("pear", 1.25);
          System.out.println(price + " " + price.swap() + " " + price.getValue() * 2);
      }
  }
note: 'One Box class, two different contents, no casts: get() returns exactly the declared T. Now add count.set("forty-two"); — a compile error on a Box<Integer>, where the Object version would have failed later with a ClassCastException. Note the boxing: count.get() + 1 unwraps the Integer.'
```

## Generic methods and bounded types

A single **generic method** declares its own type parameter before the return type:
`static <T> void printAll(T[] items)`. The compiler infers `T` from the argument at each
call. When the method needs to *do* something with a `T` beyond storing it — compare two,
call `measure()` — the parameter must be **bounded**: `<T extends Comparable<T>>` means
"any `T` that implements `Comparable`", and inside the method `compareTo` is available.
(The keyword is `extends` for interfaces too.) Without the bound, `T` is only known to be
an `Object`, and only `Object`'s methods compile.

```sim
id: java-249-generic-methods
custom: true
engine: java
code: |
  import java.util.*;
  public class Main {
      static <T> void printAll(T[] items) {
          for (T x : items) System.out.print(x + " ");
          System.out.println();
      }
      static <T extends Comparable<T>> T largest(ArrayList<T> list) {
          T best = list.get(0);
          for (T x : list) if (x.compareTo(best) > 0) best = x;
          return best;
      }
      static <T> int indexOf(T[] items, T target) {
          for (int i = 0; i < items.length; i++) if (items[i].equals(target)) return i;
          return -1;
      }
      public static void main(String[] args) {
          Integer[] nums = {4, 17, 9};
          String[] words = {"pear", "apple", "fig"};
          printAll(nums); printAll(words);
          ArrayList<String> list = new ArrayList<>();
          for (String w : words) list.add(w);
          System.out.println(largest(list) + " " + indexOf(words, "fig") + " " + indexOf(nums, 17));
          ArrayList<Integer> nums2 = new ArrayList<>(List.of(4, 17, 9));
          System.out.println(largest(nums2));
      }
  }
note: 'printAll and indexOf need nothing from T; largest needs compareTo, so T is bounded by Comparable<T>, and it works for Integer as well as String. Pass it an ArrayList<Object> holding new Object() and the program does not compile: Object has no compareTo. Then write a bounded max for arrays.'
```

## Generic interfaces, and what generics cannot do

Interfaces take type parameters the same way — `Comparable<T>`, `Comparator<T>`, and
your own `interface Stack<E> { void push(E x); E pop(); }` — and a class implements
them with a concrete argument (`implements Comparable<Student>`) or stays generic
itself (`class ArrayStack<E> implements Stack<E>`).

Java implements generics by **erasure**: at run time every `T` is an `Object` (or its
bound), and the compiler inserts the casts you used to write. Consequences worth
knowing: `new T()` and `new T[n]` are illegal (create an `Object[]` and cast, or take a
factory), `x instanceof Box<String>` cannot be checked, static fields cannot be of type
`T`, and a `Box<Integer>` is *not* a `Box<Number>` even though `Integer` is a `Number` —
the **wildcard** `Box<? extends Number>` is the type that accepts both.

```sim
id: java-249-generic-stack
custom: true
engine: java
code: |
  interface Stack<E> {
      void push(E x);
      E pop();
      boolean isEmpty();
  }
  class ArrayStack<E> implements Stack<E> {
      private Object[] data = new Object[4];       // new E[4] is illegal: erasure
      private int size = 0;
      public void push(E x) {
          if (size == data.length) {
              Object[] bigger = new Object[2 * data.length];
              for (int i = 0; i < size; i++) bigger[i] = data[i];
              data = bigger;
          }
          data[size++] = x;
      }
      public E pop() {
          if (size == 0) throw new IllegalStateException("empty stack");
          E top = (E) data[--size];
          data[size] = null;
          return top;
      }
      public boolean isEmpty() { return size == 0; }
  }
  public class Main {
      static boolean balanced(String s) {
          Stack<Character> st = new ArrayStack<>();
          for (char c : s.toCharArray()) {
              if (c == '(' || c == '[') st.push(c);
              else if (c == ')' || c == ']') {
                  if (st.isEmpty()) return false;
                  char open = st.pop();
                  if ((c == ')') != (open == '(')) return false;
              }
          }
          return st.isEmpty();
      }
      public static void main(String[] args) {
          System.out.println(balanced("(a[b]c)") + " " + balanced("(]") + " " + balanced("(("));
          Stack<Integer> nums = new ArrayStack<>();
          for (int i = 1; i <= 6; i++) nums.push(i * i);
          while (!nums.isEmpty()) System.out.print(nums.pop() + " ");
          System.out.println();
          nums.pop();
      }
  }
note: 'A generic interface and a generic implementation, used with two different element types. The Object[] with a cast in pop is the standard erasure workaround; the array doubles when full. The last pop on an empty stack throws — the guard the interface promised. COMP 352 builds every structure this way.'
```

> **Key insight.** A type parameter is a placeholder the *user* of a class fills in, and
> the compiler then checks the whole program against that choice. Bounds say what the
> placeholder must be able to do; erasure explains the few things it cannot.

## Further reading

- [The Java Tutorials — Generics](https://docs.oracle.com/javase/tutorial/java/generics/index.html) — Generic types, methods, bounded parameters, wildcards and erasure, in that order.
- [The Java Tutorials — Type Erasure](https://docs.oracle.com/javase/tutorial/java/generics/erasure.html) — Why `new E[]` and `instanceof Box<String>` are illegal.
