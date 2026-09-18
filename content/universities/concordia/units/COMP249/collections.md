---
title: The collections framework
order: 12
status: detailed
weeks: [11]
notes: ["COMP 249 course outline (Winter 2026): week 11, ch. 15 & 16, Linked Data Structures & Collections (second half: the collections framework)"]
introduces: [collections]
requires:
  - {concept: generics, strength: hard}
  - {concept: interface, strength: hard}
  - {concept: linked-list, strength: soft}
  - {concept: array, strength: soft}
reinforces: []
---

Having built a list by hand, use the library's. `java.util` supplies the containers every
program needs — resizable lists, sets without duplicates, maps from keys to values —
behind a small family of generic interfaces, so that code written against `List<E>` or
`Map<K, V>` works whichever implementation is plugged in.

## The interfaces and their implementations

> **Definition.** The **collections framework** is a set of interfaces —
> `Collection<E>` with its sub-interfaces `List<E>` (ordered, indexed, duplicates
> allowed), `Set<E>` (no duplicates), `Queue<E>`/`Deque<E>` (ends only) — and
> `Map<K, V>` (key → value, keys unique), each with classes implementing it. The
> everyday ones: `ArrayList` and `LinkedList` for `List`; `HashSet` and `TreeSet` for
> `Set`; `HashMap` and `TreeMap` for `Map`. Every collection is generic, holds
> references only (primitives are boxed), and is iterable with for-each.

Declare the variable with the interface and choose the class at `new`: `List<String>
names = new ArrayList<>();`. Then the choice can change in one place. Which class:
`ArrayList` for indexed access and appends; `LinkedList` for frequent insertion and
removal at the ends (it is also a `Deque`); the `Hash…` classes for speed when order is
irrelevant; the `Tree…` classes when iteration must be sorted (elements must be
`Comparable` or a `Comparator` is supplied).

## Lists

`ArrayList<E>` is the array that grows: `add(x)`, `add(i, x)`, `get(i)`, `set(i, x)`,
`remove(i)`, `size()`, `contains(x)`, `indexOf(x)`, `isEmpty()`, `clear()`. Two traps:
`remove(int index)` and `remove(Object x)` are different overloads, so on a
`List<Integer>` the call `remove(3)` removes *index* 3 while `remove(Integer.valueOf(3))`
removes the *value*; and removing elements from a list while a for-each loop is walking
it throws `ConcurrentModificationException` — use an explicit iterator's `remove`, or
loop backwards by index.

```sim
id: java-249-arraylist
custom: true
engine: java
code: |
  import java.util.*;
  public class Main {
      public static void main(String[] args) {
          List<Integer> marks = new ArrayList<>();
          int[] raw = {78, 91, 64, 91, 55};
          for (int m : raw) marks.add(m);
          marks.add(1, 100);
          System.out.println(marks + " size " + marks.size() + " max " + Collections.max(marks));
          marks.remove(1);                          // by index
          marks.remove(Integer.valueOf(91));        // by value, first occurrence
          System.out.println(marks + " " + marks.contains(91) + " " + marks.indexOf(55));
          Collections.sort(marks);
          System.out.println(marks);
          Iterator<Integer> it = marks.iterator();
          while (it.hasNext()) if (it.next() < 60) it.remove();
          System.out.println(marks);
          for (Integer m : marks) if (m == 64) marks.remove(m);
          System.out.println("unreachable? " + marks);
      }
  }
note: 'Two removes with different meanings on a List<Integer>, a sort through Collections, and the iterator remove that is safe. The last loop removes during a for-each and dies with ConcurrentModificationException at the next step of the loop — read the exception name, then rewrite it with the iterator.'
```

## Sets

A `Set<E>` keeps one copy of each element: `add` returns `false` when the element is
already there, which makes "count distinct words" a loop of `add`s. `HashSet` finds
elements through `hashCode()` and `equals()` — a class used as an element must override
both consistently — and iterates in no useful order; `TreeSet` keeps elements sorted
and adds `first()`, `last()` and range views. Set operations are method calls:
`addAll` (union), `retainAll` (intersection), `removeAll` (difference).

```sim
id: java-249-sets
custom: true
engine: java
code: |
  import java.util.*;
  public class Main {
      public static void main(String[] args) {
          String text = "the cat saw the dog and the dog saw the cat";
          Set<String> distinct = new HashSet<>();
          int repeats = 0;
          for (String w : text.split(" ")) if (!distinct.add(w)) repeats++;
          System.out.println(distinct.size() + " distinct, " + repeats + " repeats: " + distinct);
          Set<String> sorted = new TreeSet<>(distinct);
          System.out.println(sorted + " first " + ((TreeSet<String>) sorted).first());
          Set<Integer> a = new TreeSet<>(List.of(1, 2, 3, 4, 5));
          Set<Integer> b = new TreeSet<>(List.of(4, 5, 6));
          Set<Integer> inter = new TreeSet<>(a); inter.retainAll(b);
          Set<Integer> union = new TreeSet<>(a); union.addAll(b);
          Set<Integer> diff = new TreeSet<>(a); diff.removeAll(b);
          System.out.println(inter + " " + union + " " + diff);
      }
  }
note: 'add returns false for a repeat, so the loop counts them for free. The HashSet prints in hash order (the same order a JVM gives for these strings); the TreeSet copy is alphabetical. Intersection, union and difference are three one-line calls on copies.'
```

## Maps

> **Definition.** A `Map<K, V>` associates each **key** with one **value**: `put(k, v)`
> adds or replaces (returning the old value or `null`), `get(k)` returns the value or
> `null`, `containsKey`, `remove`, `size`, `getOrDefault(k, d)`. A map is not a
> `Collection`; iterate over `keySet()`, `values()` or `entrySet()` — the last giving
> `Map.Entry<K, V>` objects with `getKey()` and `getValue()`. `HashMap` needs the same
> `hashCode`/`equals` discipline as `HashSet`; `TreeMap` keeps keys sorted.

The idiom to know by heart is counting: `counts.put(w, counts.getOrDefault(w, 0) + 1)`.
And its cousin, grouping: the value is a list, created on the first key.

```sim
id: java-249-maps
custom: true
engine: java
code: |
  import java.util.*;
  public class Main {
      public static void main(String[] args) {
          String text = "the cat saw the dog and the dog saw the cat";
          Map<String, Integer> counts = new HashMap<>();
          for (String w : text.split(" ")) counts.put(w, counts.getOrDefault(w, 0) + 1);
          System.out.println(counts);
          for (Map.Entry<String, Integer> e : counts.entrySet())
              if (e.getValue() > 1) System.out.println(e.getKey() + " x" + e.getValue());
          Map<Integer, List<String>> byLength = new TreeMap<>();
          for (String w : counts.keySet()) {
              if (!byLength.containsKey(w.length())) byLength.put(w.length(), new ArrayList<>());
              byLength.get(w.length()).add(w);
          }
          System.out.println(byLength);
          System.out.println(counts.get("cat") + " " + counts.get("cow") + " " + counts.containsKey("saw"));
          int n = counts.get("cow");
      }
  }
note: 'The counting idiom, then grouping into a map of lists. HashMap prints in hash order, TreeMap in key order. The last line unboxes the null that get returns for a missing key — a NullPointerException, and the reason getOrDefault exists.'
```

## Iterators and a table of costs

Every collection provides `iterator()`; for-each calls it for you. The `Iterator` is the
only safe way to remove while walking. Behind each class is a data structure whose
costs matter once collections get large:

| operation | `ArrayList` | `LinkedList` | `HashSet` / `HashMap` | `TreeSet` / `TreeMap` |
|---|---|---|---|---|
| `get(i)` / by index | constant | linear | — | — |
| add at end | constant (amortised) | constant | constant (average) | logarithmic |
| add / remove at front | linear | constant | — | — |
| `contains` / `get(key)` | linear | linear | constant (average) | logarithmic |
| iteration order | insertion | insertion | none | sorted |

`Collections` (the utility class) adds `sort`, `reverse`, `shuffle`, `max`, `min`,
`frequency`; `Arrays.asList` and `List.of` build small lists in one expression;
`Collections.unmodifiableList` and `List.of` return lists that refuse changes.

```sim
id: java-249-collections-capstone
custom: true
engine: java
code: |
  import java.util.*;
  class Student implements Comparable<Student> {
      String name; String program; double gpa;
      Student(String n, String p, double g) { name = n; program = p; gpa = g; }
      public int compareTo(Student o) { return Double.compare(o.gpa, gpa); }
      public String toString() { return name + "(" + gpa + ")"; }
  }
  public class Main {
      public static void main(String[] args) {
          List<Student> all = new ArrayList<>(List.of(
              new Student("Ana", "CS", 3.9), new Student("Bo", "DS", 3.4),
              new Student("Cy", "CS", 3.4), new Student("Dee", "DS", 3.8), new Student("Eve", "CS", 2.9)));
          Map<String, List<Student>> byProgram = new TreeMap<>();
          for (Student s : all) {
              if (!byProgram.containsKey(s.program)) byProgram.put(s.program, new ArrayList<>());
              byProgram.get(s.program).add(s);
          }
          for (Map.Entry<String, List<Student>> e : byProgram.entrySet()) {
              List<Student> group = e.getValue();
              Collections.sort(group);
              double sum = 0;
              for (Student s : group) sum += s.gpa;
              System.out.printf("%s: %s, average %.2f, top %s%n", e.getKey(), group, sum / group.size(), group.get(0).name);
          }
          Set<Double> gpas = new TreeSet<>();
          for (Student s : all) gpas.add(s.gpa);
          System.out.println("distinct GPAs " + gpas);
          Deque<Student> queue = new ArrayDeque<>(all);
          System.out.println("first served: " + queue.pollFirst() + ", last: " + queue.peekLast());
      }
  }
note: 'Grouping into a map of lists, sorting each group with the class''s own compareTo, a TreeSet for distinct values, a Deque for a queue — the framework doing in twenty lines what took a unit each by hand. Change the sort to a lambda ordering by name and see printf pick a different top student.'
```

> **Key insight.** Program to `List`, `Set`, `Map` — the interfaces — and pick the class
> for its cost profile. Everything in the framework rests on three ideas from earlier
> units: generics for the element type, `equals`/`hashCode`/`compareTo` for how elements
> are compared, and `Iterator` for how they are walked.

## Further reading

- [The Java Tutorials — Collections](https://docs.oracle.com/javase/tutorial/collections/index.html) — The interfaces, the implementations and the algorithms, in the order this unit follows.
- [Java API — java.util](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/package-summary.html) — The reference for every method mentioned here.
