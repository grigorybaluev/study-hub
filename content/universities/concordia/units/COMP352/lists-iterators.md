---
title: Lists, positional lists and iterators
order: 4
status: detailed
weeks: [4]
notes: ["Deck 5, Linked Lists & Iterators: slides 3–8 singly linked list, insert/remove at head and tail; 9–10 stack and queue on a linked list; 11–15 doubly linked list with header/trailer, addAfter, remove; 16–20 iterators, Iterable, for-each, ListIterator. Deck 6, Array Lists, Node Lists & Sequences: slides 3–12 the array list ADT, insertion/removal by shifting, performance, growable arrays, array-list deque methods; 13–21 node lists and the Position ADT; 22–29 sequences and the linked implementation; 30–36 array-based sequence with a circular array, comparison table; 37–38 favourites list"]
textbook: "Goodrich, Tamassia & Goldwasser, Data Structures and Algorithms in Java, 6e, ch. 7"
introduces: []
requires:
  - {concept: linked-list, strength: hard}
  - {concept: array, strength: hard}
  - {concept: generics, strength: hard}
  - {concept: abstract-data-type, strength: hard}
  - {concept: collections, strength: soft}
reinforces:
  - {concept: linked-list, perspective: "singly and doubly linked lists as implementations of the list, stack, queue and sequence ADTs, with the cost of every operation"}
  - {concept: array, perspective: "array lists: indexed access in O(1), insertion and removal by shifting in O(n)"}
  - {concept: collections, perspective: "the list, node-list (positional) and sequence ADTs; iterators and Iterable"}
---

COMP 249 built a linked list by hand and used `ArrayList`. This unit puts both under the
same two ADTs — the index-based **list** and the position-based **node list** — and
tabulates what each costs, so that "which one?" becomes a question about which
operations the program performs most.

## Singly linked lists, revisited with costs

A singly linked list is a chain of nodes from a `head` reference (and usually a `tail`).
**Insert at the head** (allocate, point the new node at the old head, move `head`) and
**remove at the head** are $O(1)$. **Insert at the tail** is $O(1)$ with a `tail`
reference. **Remove at the tail is $O(n)$**: the node before the tail must become the
new tail, and there is no way to reach it except by walking from `head` — the reason
doubly linked lists exist. A stack on a singly linked list uses the head as the top; a
queue uses the head as the front and the tail as the rear; both give $O(1)$
per operation and use space proportional to the number of elements rather than a
fixed capacity.

```sim
id: ds-352-singly-linked
custom: true
engine: ds
mode: linked-list
kind: singly
data: [4, 7, 9]
ops: ["insertFirst 2", "insertLast 11", "removeFirst", "removeLast"]
note: "Every operation but the last is two or three pointer changes. removeLast has to walk to the node before the tail — step through it and count the visits; with n nodes that is n − 1 steps, so a singly linked list is the wrong choice if the program removes at the tail."
```

## Doubly linked lists and sentinels

> **Definition.** A **doubly linked list** gives each node a `prev` reference as well as
> `next`, and keeps two **sentinel** nodes, the **header** before the first element and
> the **trailer** after the last, that hold no data and are never removed. Every real
> node then has a predecessor and a successor, so `addAfter(p, e)`, `addBefore(p, e)`
> and `remove(p)` are the same four (or two) pointer updates wherever `p` is — no
> "first node" or "empty list" special cases — and all are $O(1)$ given `p`.

```sim
id: ds-352-doubly-linked
custom: true
engine: ds
mode: linked-list
kind: doubly
data: [5, 8]
ops: ["insertFirst 3", "insertLast 9", "removeLast", "insertAt 1 6", "removeAt 2"]
note: "hdr and trl are the sentinels. Watch insertFirst: the new node goes between the header and the old first node with exactly the same four assignments as any other insertion. removeLast is now O(1): the trailer's prev is the node to unlink. Only insertAt(i) and removeAt(i) walk — that is the cost of reaching a position, not of changing the list."
```

## The array list ADT and its two implementations

> **Definition.** The **array list (index-based list) ADT** stores a sequence of
> elements accessed by *rank* (index) $0 \dots n-1$: `get(i)`, `set(i, e)`,
> `add(i, e)` (inserts, shifting later elements up), `remove(i)` (shifts them down),
> `size()`, `isEmpty()`; an index outside $[0, n-1]$ (or $[0, n]$ for `add`) throws
> `IndexOutOfBoundsException`.

On an **array**, `get` and `set` are $O(1)$ — the index is the address. `add(i, e)`
must shift $n - i$ elements right, `remove(i)` shift $n - i - 1$ left: $O(n)$ in the
worst case (the front), $O(1)$ at the end. Growing follows the stack's doubling policy:
`add` at the end is $O(1)$ amortised. On a **doubly linked list**, `add` and `remove`
are $O(1)$ once the node is known, but finding index $i$ means walking
$\min(i + 1,\ n - i)$ nodes from the nearer end: $O(n)$ for `get`, `set`, `add`,
`remove` by index. The two implementations are mirror images.

```sim
id: ds-352-array-list
custom: true
engine: ds
mode: array-list
data: [2, 4, 6, 8]
capacity: 4
ops: ["add 1 3", "get 3", "remove 0", "add 4 9"]
note: "add(1, 3) first doubles the full array, then shifts three elements right; get(3) is a single access; remove(0) shifts everything left. The shift counter in the caption is the linear cost. Contrast the doubly linked list above, where the same operations cost a walk but no shifting."
```

## Node lists: positions instead of indices

Indices are awkward for a linked list: after `add(3, e)` every later element has a new
index, and reaching index $i$ costs a walk. The **node list (positional list) ADT**
replaces the index by a **position**, an abstraction of "the node holding this
element" that stays valid while the element stays in the list:

> **Definition.** A **position** `p` supports `p.element()`. The node list offers
> `first()`, `last()`, `prev(p)`, `next(p)`, `set(p, e)`, `addFirst(e)`, `addLast(e)`,
> `addBefore(p, e)`, `addAfter(p, e)` (each returning the new position) and
> `remove(p)`; `prev(first())` and `next(last())` are errors. A doubly linked list
> implements every method in $O(1)$: the position *is* the node.

The **sequence ADT** combines both views — index methods and position methods, plus
`atIndex(i)` and `indexOf(p)` to convert — and is where the comparison lands (deck 6,
slide 36):

| operation | array | doubly linked list |
|---|---|---|
| `size`, `isEmpty` | $O(1)$ | $O(1)$ |
| `get(i)`, `set(i, e)`, `atIndex(i)`, `indexOf(p)` | $O(1)$ | $O(n)$ |
| `first`, `last`, `prev(p)`, `next(p)` | $O(1)$ | $O(1)$ |
| `set(p, e)`, `remove(p)`, `addBefore/After(p, e)` | $O(n)$ (shift) | $O(1)$ |
| `add(i, e)`, `remove(i)` | $O(n)$ | $O(n)$ (walk) |
| `addFirst/Last`, `removeFirst/Last` | $O(1)$ amortised (circular array) | $O(1)$ |

A program that jumps to indices wants the array; one that walks and edits in place
wants the linked list. Java's `ArrayList` and `LinkedList` are these two, and
`LinkedList`'s `ListIterator` is the closest thing to a position.

## Iterators

> **Definition.** An **iterator** is an object that walks a collection: `hasNext()`
> and `next()` (the `Iterator` interface), optionally `remove()`. A class that provides
> `iterator()` implements `Iterable`, which is exactly what Java's for-each loop
> requires: `for (E e : c)` is compiled to an iterator and a `while (hasNext())`.
> A **snapshot** iterator copies the elements first; a **lazy** one reads the live
> structure and is disturbed by concurrent changes (the
> `ConcurrentModificationException` of COMP 249).

Writing the iterator as an inner class of the list gives it the nodes; a
`ListIterator` adds `hasPrevious`, `previous`, `add` and `set` — a cursor between two
elements, which is the positional view again.

```sim
id: java-352-positional-list
custom: true
engine: java
code: |
  import java.util.Iterator;
  class NodeList<E> implements Iterable<E> {
      class Node { E e; Node prev, next; Node(E e, Node p, Node n) { this.e = e; prev = p; next = n; } }
      private Node header = new Node(null, null, null), trailer = new Node(null, header, null);
      private int size = 0;
      NodeList() { header.next = trailer; }
      Node first() { return size == 0 ? null : header.next; }
      Node last() { return size == 0 ? null : trailer.prev; }
      Node next(Node p) { return p.next == trailer ? null : p.next; }
      Node addBetween(E e, Node pred, Node succ) {
          Node n = new Node(e, pred, succ); pred.next = n; succ.prev = n; size++; return n;
      }
      Node addFirst(E e) { return addBetween(e, header, header.next); }
      Node addLast(E e) { return addBetween(e, trailer.prev, trailer); }
      Node addAfter(Node p, E e) { return addBetween(e, p, p.next); }
      E remove(Node p) { p.prev.next = p.next; p.next.prev = p.prev; size--; return p.e; }
      int size() { return size; }
      public Iterator<E> iterator() {
          return new Iterator<E>() {
              Node cur = header.next;
              public boolean hasNext() { return cur != trailer; }
              public E next() { E e = cur.e; cur = cur.next; return e; }
          };
      }
  }
  public class Main {
      public static void main(String[] args) {
          NodeList<String> list = new NodeList<>();
          NodeList<String>.Node a = list.addLast("A");
          NodeList<String>.Node c = list.addLast("C");
          NodeList<String>.Node b = list.addAfter(a, "B");
          list.addFirst("Z");
          for (String s : list) System.out.print(s + " ");
          System.out.println("(" + list.size() + ")");
          System.out.println("removed " + list.remove(c) + ", then " + list.remove(list.first()));
          for (String s : list) System.out.print(s + " ");
          System.out.println();
          for (NodeList<String>.Node p = list.first(); p != null; p = list.next(p)) System.out.print(p.e + ",");
          System.out.println();
      }
  }
note: 'A positional list with sentinels: every insertion is addBetween, every removal two pointer changes, and the positions a, b, c stay valid as neighbours come and go. The anonymous Iterator is what for-each uses. Add a removeFirst and a prev(p) and note that nothing needs a special case for the ends.'
```

**Equations**

- *Reaching index i on a doubly linked list*: $\min(i + 1,\ n - i)$ steps from the nearer end — $O(n)$ worst case, $O(1)$ at the ends.
- *Shifting on an array*: `add(i, e)` moves $n - i$ elements, `remove(i)` moves $n - i - 1$ — $O(n)$ worst case at $i = 0$.

> **Key insight.** Arrays are addressed by index, lists by position; each is $O(1)$ at
> what it is addressed by and $O(n)$ at the other. Sentinels remove the special cases
> from linked code, and iterators are how a client walks either without knowing which.

## Further reading

- [Goodrich, Tamassia & Goldwasser — List and Iterator ADTs (ch. 7 slides)](https://www.cs.uic.edu/~jbell/CourseNotes/DataStructures/Lists.html) — Array lists, positional lists and iterators with the same tables.
- [Java API — ListIterator](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/ListIterator.html) — The cursor-between-elements model that positions approximate.
