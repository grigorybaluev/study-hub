---
title: Linked data structures
order: 11
status: detailed
weeks: [11]
introduces:
  - {concept: linked-list, perspective: "building a linked list by hand in Java: node class, head reference, insertion, deletion and traversal; the iterator as an inner class"}
requires:
  - {concept: object-reference, strength: hard}
  - {concept: class-and-object, strength: hard}
  - {concept: generics, strength: hard}
  - {concept: recursion, strength: soft}
reinforces: []
---

An array is one block of memory whose size is fixed at creation; inserting in the middle
means shifting everything after it. A **linked list** is the other way to hold a
sequence: each element sits in its own small object, a **node**, that also holds a
reference to the next one. Growing is a `new`, inserting is two reference assignments —
and every operation is an exercise in the reference semantics of COMP 248, which is why
the course builds one by hand before using the library's.

## Nodes and the head

> **Definition.** A **singly linked list** is a chain of **nodes**, each holding a data
> item and a reference `next` to the following node; the last node's `next` is `null`.
> The list object itself holds only a reference to the first node, the **head** (and
> possibly a count). An empty list is `head == null`. Nodes are usually a `private static
> class` inside the list, since nothing outside should touch them.

Adding at the front is the simplest operation and shows the shape of every other: make
the new node point at the current head, then move `head` to the new node. Order matters
— reverse the two statements and the old chain is lost.

```sim
id: java-249-linked-basics
custom: true
engine: java
code: |
  public class Main {
      public static void main(String[] args) {
          StringList list = new StringList();
          list.addFront("c");
          list.addFront("b");
          list.addFront("a");
          list.addEnd("d");
          System.out.println(list + " size " + list.size());
          System.out.println(list.contains("d") + " " + list.contains("z"));
      }
  }
  class StringList {
      private static class Node {
          String data; Node next;
          Node(String data, Node next) { this.data = data; this.next = next; }
      }
      private Node head = null;
      private int size = 0;
      void addFront(String s) {
          head = new Node(s, head);          // new node points at the old head, then becomes the head
          size++;
      }
      void addEnd(String s) {
          Node n = new Node(s, null);
          if (head == null) { head = n; }
          else {
              Node cur = head;
              while (cur.next != null) cur = cur.next;   // walk to the last node
              cur.next = n;
          }
          size++;
      }
      boolean contains(String s) {
          for (Node cur = head; cur != null; cur = cur.next) if (cur.data.equals(s)) return true;
          return false;
      }
      int size() { return size; }
      public String toString() {
          String out = "[";
          for (Node cur = head; cur != null; cur = cur.next) out += cur.data + (cur.next != null ? ", " : "");
          return out + "]";
      }
  }
note: 'Watch head in the Variables panel: each addFront makes a node whose next is the previous head. addEnd walks with a cursor reference until next is null — the traversal idiom every method uses. Swap the two lines of addFront (assign head first) and see the list lose its tail.'
```

## Traversal, insertion and deletion

Every list algorithm is a loop with a cursor: `for (Node cur = head; cur != null;
cur = cur.next)`. To insert *after* a node `p`: `p.next = new Node(x, p.next)`. To
delete the node *after* `p`: `p.next = p.next.next` — nothing points at the removed node
any more, and the garbage collector reclaims it. Both take constant time once `p` is
known; finding `p` is the linear part. The front is special because there is no
previous node — `head` itself is the reference to change — so deletion code has a
`head` case and a general case, or keeps a **previous** cursor one step behind.

```sim
id: java-249-linked-insert-delete
custom: true
engine: java
code: |
  public class Main {
      public static void main(String[] args) {
          IntList list = new IntList();
          for (int x : new int[] {9, 7, 4, 1}) list.addFront(x);
          System.out.println(list);
          list.insertSorted(5);
          System.out.println(list + " after insertSorted(5)");
          System.out.println(list.remove(1) + " " + list.remove(7) + " " + list.remove(3));
          System.out.println(list);
          System.out.println(list.sum());
      }
  }
  class IntList {
      private static class Node { int data; Node next; Node(int d, Node n) { data = d; next = n; } }
      private Node head;
      void addFront(int x) { head = new Node(x, head); }
      void insertSorted(int x) {                 // assumes the list is ascending
          if (head == null || x <= head.data) { head = new Node(x, head); return; }
          Node p = head;
          while (p.next != null && p.next.data < x) p = p.next;
          p.next = new Node(x, p.next);
      }
      boolean remove(int x) {                    // first occurrence
          if (head == null) return false;
          if (head.data == x) { head = head.next; return true; }
          Node prev = head;
          while (prev.next != null && prev.next.data != x) prev = prev.next;
          if (prev.next == null) return false;
          prev.next = prev.next.next;
          return true;
      }
      int sum() { return sum(head); }
      private static int sum(Node n) { return n == null ? 0 : n.data + sum(n.next); }
      public String toString() {
          StringBuilder sb = new StringBuilder("[");
          for (Node c = head; c != null; c = c.next) sb.append(c.data).append(c.next != null ? ", " : "");
          return sb.append("]").toString();
      }
  }
note: 'Insertion keeps a cursor one step before the spot; deletion keeps prev one step before the victim, with the head as the special case. sum is recursive: a list is a node followed by a list. Step through remove(7) and watch prev.next skip a node; remove(1) is the head case.'
```

## Generic lists and an iterator

A list that holds only `int` or only `String` is written once per type; with the last
unit's generics it is written once: `class LinkedList<E>` with `Node<E>` (or a static
nested `Node` whose `data` is `E`). The list should also let a client walk it without
seeing nodes: an **iterator** object with `hasNext()` and `next()`, written as an inner
class so it can see the list's nodes. Implementing the library's `Iterable<E>` interface
(one method, `iterator()`) is what makes the for-each loop accept the list — the same
loop that works on arrays and on the collections of the next unit.

```sim
id: java-249-linked-generic-iterator
custom: true
engine: java
code: |
  import java.util.Iterator;
  class LinkedList<E> implements Iterable<E> {
      private static class Node<E> { E data; Node<E> next; Node(E d, Node<E> n) { data = d; next = n; } }
      private Node<E> head;
      private int size;
      public void addFront(E x) { head = new Node<>(x, head); size++; }
      public E get(int i) {
          if (i < 0 || i >= size) throw new IndexOutOfBoundsException("index " + i + ", size " + size);
          Node<E> cur = head;
          for (int k = 0; k < i; k++) cur = cur.next;
          return cur.data;
      }
      public int size() { return size; }
      public Iterator<E> iterator() { return new ListIterator(); }
      private class ListIterator implements Iterator<E> {     // inner: sees head
          private Node<E> cur = head;
          public boolean hasNext() { return cur != null; }
          public E next() { E d = cur.data; cur = cur.next; return d; }
      }
  }
  public class Main {
      public static void main(String[] args) {
          LinkedList<String> names = new LinkedList<>();
          names.addFront("Cy"); names.addFront("Bo"); names.addFront("Ana");
          for (String n : names) System.out.print(n + " ");
          System.out.println();
          Iterator<String> it = names.iterator();
          while (it.hasNext()) System.out.print(it.next().length() + " ");
          System.out.println();
          LinkedList<Integer> nums = new LinkedList<>();
          nums.addFront(7); nums.addFront(3);
          int total = 0;
          for (int x : nums) total += x;
          System.out.println(total + " " + nums.get(1) + " " + names.get(5));
      }
  }
note: 'The same list class holds Strings and Integers; the inner ListIterator walks it from head without exposing a node, and Iterable is what lets the for-each loop work. The last call asks for index 5 of a 3-element list: IndexOutOfBoundsException with the message the class wrote.'
```

## Doubly linked lists, and what to remember

A **doubly linked list** adds a `prev` reference to each node and keeps a `tail` as well
as a `head`: walking backwards and removing a *given* node become constant-time, at the
price of updating twice as many references per change. The library's `LinkedList` is
one. Whatever the variant, the costs are the same story: constant time to add or remove
at a known position, linear time to reach a position by index — the reverse of the
array's constant-time index and linear-time insert. COMP 352 turns that trade-off into
the analysis of every structure that follows.

> **Key insight.** A linked list is nothing but objects and references: `head` points
> to a node, nodes point to nodes, `null` ends the chain. Every operation is a small
> re-wiring of `next` fields, done in the right order, with the empty list and the head
> as the cases to check first.

## Further reading

- [The Java Tutorials — The Collection Interface / Iterators](https://docs.oracle.com/javase/tutorial/collections/interfaces/collection.html) — What `Iterator` and `Iterable` promise, which the hand-made list above implements.
- [Sedgewick & Wayne — Linked Lists](https://algs4.cs.princeton.edu/13stacks/) — Stacks and queues built on linked nodes, with the same node/head pictures.
