---
title: Priority queues and heaps
order: 6
status: detailed
weeks: [6]
introduces: [priority-queue, heap]
requires:
  - {concept: tree, strength: hard}
  - {concept: abstract-data-type, strength: hard}
  - {concept: interface, strength: hard}
  - {concept: algorithm-analysis, strength: hard}
  - {concept: sorting-algorithms, strength: soft}
reinforces: []
---

A queue serves in arrival order; a priority queue serves the most urgent first — the
patient in worst condition, the job with the earliest deadline, the edge of least
weight. Any list can implement it, at $O(n)$ for one of the two operations. The heap,
a complete binary tree stored in an array, does both in $O(\log n)$, and sorting with
it is the first $O(n \log n)$ sort of the course.

## The priority queue ADT

> **Definition.** A **priority queue** stores **entries**, each a pair (key, value),
> and supports `insert(k, v)` and `removeMin()`, which removes and returns an entry
> with the smallest key; auxiliary `min()`, `size()`, `isEmpty()`. Keys must have a
> **total order**: a comparison rule that is reflexive, antisymmetric and transitive,
> so that a smallest key exists. The rule is supplied by a **comparator** object
> (`compare(a, b)` negative, zero or positive) rather than baked into the keys, so the
> same entries can be prioritised differently — by number, by string, by a point's
> $x$ then $y$.

**PQ-sort** sorts a sequence by inserting every element, then removing the minimum
until empty. Its cost is the cost of the priority queue: with an **unsorted list**,
`insert` is $O(1)$ (append) and `removeMin` is $O(n)$ (scan) — PQ-sort is
**selection-sort**, $O(n^2)$; with a **sorted list**, `insert` is $O(n)$ (find the
place) and `removeMin` is $O(1)$ (the front) — PQ-sort is **insertion-sort**, $O(n^2)$
in the worst case but $O(n)$ on an already sorted input. Both can be done **in place**
by using a prefix of the array as the "priority queue" and the rest as the input.

```sim
id: ds-352-selection-insertion
custom: true
engine: ds
mode: sort
algo: selection
data: [7, 4, 8, 2, 5, 3, 9]
ops: ["sort"]
note: "Selection-sort in place: the sorted prefix grows by one minimum per pass, each found by scanning the rest — n(n−1)/2 comparisons regardless of the input. Switch the algorithm to insertion and run on the same data, then on already-sorted data (2 3 4 5 7 8 9): insertion-sort does n − 1 comparisons there, selection-sort still n(n−1)/2."
```

## Heaps

> **Definition.** A **heap** is a binary tree storing keys at its nodes with two
> properties. **Heap-order**: for every node other than the root, the key at the node
> is ≥ the key at its parent — so the minimum is at the root, and keys never decrease
> along a path down. **Complete binary tree**: every level except possibly the last is
> full, and the last level's nodes are filled from the left. The rightmost node of the
> last level is the **last node**.

Completeness pins the shape: a heap with $n$ keys has height $\lfloor \log_2 n \rfloor$,
because levels $0 \dots h-1$ hold $2^h - 1$ nodes and level $h$ at least one, so
$n \ge 2^h$. Every operation below walks one root-to-leaf path, hence $O(\log n)$.

**Insertion** puts the new key in the position that keeps the tree complete (the next
slot after the last node) and then repairs heap-order by **up-heap bubbling**: while the
key is smaller than its parent's, swap them. **Removal** of the minimum takes the root,
moves the last node's key into the root to keep the tree complete, and repairs by
**down-heap bubbling**: while the key is larger than a child's, swap with the *smaller*
child (so the smaller becomes the new parent, restoring order to both). Each takes at
most $h$ swaps.

```sim
id: ds-352-heap-insert-remove
custom: true
engine: ds
mode: heap
data: [4, 5, 6, 15, 9, 7, 20, 16, 25, 14, 12, 11, 8]
ops: ["insert 2", "removeMin", "removeMin"]
note: "The tree and its array are the same object. insert(2) lands in the next free slot and bubbles up three levels to the root; removeMin lifts the last key to the root and sinks it, always toward the smaller child. Each path has at most ⌊log₂ n⌋ steps. Try inserting 30 — no swap at all — and 1."
```

## The array-based heap

A complete tree is exactly the tree with no gaps under level numbering, so a heap is
stored in an array with no references: the root at index $0$ (in the course's 0-based
version), the children of $i$ at $2i + 1$ and $2i + 2$, the parent at
$\lfloor (i-1)/2 \rfloor$, and the last node at index $n - 1$. Insert appends at index
$n$; removeMin swaps index $0$ with $n - 1$ and shrinks. The table:

| operation | time |
|---|---|
| `size`, `isEmpty`, `min` | $O(1)$ |
| `insert` | $O(\log n)$ |
| `removeMin` | $O(\log n)$ |
| space | $O(n)$ |

```sim
id: java-352-array-heap
custom: true
engine: java
code: |
  import java.util.*;
  class MinHeap {
      private ArrayList<Integer> a = new ArrayList<>();
      int size() { return a.size(); }
      int min() { if (a.isEmpty()) throw new NoSuchElementException("empty heap"); return a.get(0); }
      void insert(int k) {
          a.add(k);
          int i = a.size() - 1;
          while (i > 0 && a.get(i) < a.get((i - 1) / 2)) { swap(i, (i - 1) / 2); i = (i - 1) / 2; }   // up-heap
      }
      int removeMin() {
          int m = min();
          int last = a.remove(a.size() - 1);
          if (!a.isEmpty()) { a.set(0, last); downheap(0); }
          return m;
      }
      private void downheap(int i) {
          while (2 * i + 1 < a.size()) {
              int c = 2 * i + 1;
              if (c + 1 < a.size() && a.get(c + 1) < a.get(c)) c++;             // the smaller child
              if (a.get(i) <= a.get(c)) return;
              swap(i, c); i = c;
          }
      }
      private void swap(int i, int j) { int t = a.get(i); a.set(i, a.get(j)); a.set(j, t); }
      public String toString() { return a.toString(); }
  }
  public class Main {
      public static void main(String[] args) {
          MinHeap h = new MinHeap();
          for (int k : new int[] {9, 4, 7, 1, 8, 2}) h.insert(k);
          System.out.println("heap " + h);
          StringBuilder out = new StringBuilder();
          while (h.size() > 0) out.append(h.removeMin()).append(' ');
          System.out.println("heap-sort order: " + out);
          h.removeMin();
      }
  }
note: 'The whole heap is an ArrayList and three index formulas. Watch a in the Variables panel during insert(1), the fourth key: it lands at index 3 and moves up along the parent indices 3 → 1 → 0. Removing until empty yields the keys in order — that is heap-sort. The final removeMin on an empty heap throws.'
```

## Heap-sort and bottom-up construction

**Heap-sort** is PQ-sort with a heap: $n$ insertions at $O(\log n)$ then $n$
removals at $O(\log n)$ — $O(n \log n)$, and it runs in place by using the array's
own prefix as the heap and moving each removed maximum (with a max-heap) to the end
of the array.

Building a heap from $n$ known keys does not need $n$ insertions. **Bottom-up
construction** places all keys in the array and then runs down-heap on each internal
node from the last one to the root: the subtrees below are already heaps by the time a
node is fixed. Each node travels at most the height of its subtree, and small subtrees
dominate — half the nodes are leaves that travel nothing — so the total is $O(n)$
rather than $O(n \log n)$.

```sim
id: ds-352-heap-bottom-up
custom: true
engine: ds
mode: heap
data: [16, 15, 4, 12, 6, 9, 23, 20, 25, 5, 11, 27, 7, 8, 10]
build: bottom-up
ops: ["build", "heapSort"]
note: "An example keys. Bottom-up: the array is laid out as a complete tree, then down-heap runs on internal nodes from the last (index 6) back to the root — most of them move one step or none, which is why the total is linear. heap-sort then swaps the root to the end and shrinks the heap, n times: the sorted tail grows from the right (descending, since this is a min-heap)."
```

**Equations**

- *Height of a heap*: $h = \lfloor \log_2 n \rfloor$, since $2^h \le n \le 2^{h+1} - 1$.
- *Array indices (0-based)*: children of $i$ at $2i + 1$, $2i + 2$; parent at $\lfloor (i - 1)/2 \rfloor$; last node at $n - 1$.
- *PQ-sort*: unsorted list $= $ selection-sort $O(n^2)$; sorted list $=$ insertion-sort $O(n^2)$; heap $=$ heap-sort $O(n \log n)$.
- *Bottom-up construction*: $\sum_{\text{nodes}} \mathrm{height} \le 2n$ swaps — $O(n)$.

> **Key insight.** Heap-order puts the minimum at the root; completeness makes the
> tree an array and its height $\log n$. Insert at the end and bubble up, remove the
> root and bubble down — and a sort falls out at $O(n \log n)$, with the heap built in
> $O(n)$ when the keys are known in advance.

## Further reading

- [Sedgewick & Wayne — Priority Queues](https://algs4.cs.princeton.edu/24pq/) — Binary heaps, heap-sort and the bottom-up construction with an animation.
