---
title: Merge sort and quick sort
order: 9
status: detailed
weeks: [9]
introduces: [sorting-algorithms]
requires:
  - {concept: recursion, strength: hard}
  - {concept: algorithm-analysis, strength: hard}
  - {concept: array, strength: hard}
  - {concept: heap, strength: soft}
  - {concept: probability, strength: soft}
reinforces: []
---

Selection-sort, insertion-sort and heap-sort came out of the priority queue. The two
sorts of this unit come out of **divide-and-conquer**: split the input, sort the parts
recursively, put them together. Merge sort does the work in the "put together";
quick sort does it in the "split". Both are $O(n \log n)$ — one always, one on average
— and the difference in where the work happens decides everything else about them.

## Divide-and-conquer

> **Definition.** A **divide-and-conquer** algorithm solves a problem by **dividing**
> the input into two or more disjoint parts, **recurring** to solve each part (a base
> case, typically size 0 or 1, is solved directly), and **conquering** by combining the
> parts' solutions into the whole. Its recursion trace is a tree whose depth and
> per-level work give the running time.

## Merge sort

> **Definition.** **Merge-sort** on a sequence $S$ of $n$ elements: if $n \le 1$, done;
> otherwise divide $S$ into two halves $S_1$ and $S_2$, merge-sort each recursively,
> and **merge** the two sorted halves into one sorted sequence.

Merging two sorted sequences of total length $n$ takes $O(n)$: keep a cursor at the
front of each, repeatedly move the smaller of the two front elements to the output.
The recursion tree is a binary tree of depth $\lceil \log_2 n \rceil$ — each level
halves the sequences — and at depth $i$ there are $2^i$ sequences of size $n/2^i$, so
each level's merges cost $O(n)$ in total. Depth $\times$ level cost:
$O(n \log n)$, in the worst case as much as the best; the only memory cost is the
$O(n)$ temporary array the merge writes into.

```sim
id: ds-352-merge-sort
custom: true
engine: ds
mode: sort
algo: merge
data: [7, 2, 9, 4, 3, 8, 6, 1]
ops: ["sort"]
note: "An example. The coloured bars under the array are the recursion tree, one row per depth; each merge step shows the two halves combined. Count the comparisons: 17 for eight elements, against n log₂ n = 24 as the bound. Change the data to a sorted or reversed sequence — merge sort does not care."
```

```sim
id: java-352-merge-sort
custom: true
engine: java
code: |
  import java.util.Arrays;
  public class Main {
      static int comparisons = 0;
      static void mergeSort(int[] a, int lo, int hi) {           // sorts a[lo..hi]
          if (hi - lo < 1) return;                                // base case: 0 or 1 element
          int mid = (lo + hi) / 2;
          mergeSort(a, lo, mid);                                  // divide, recur
          mergeSort(a, mid + 1, hi);
          merge(a, lo, mid, hi);                                  // conquer
      }
      static void merge(int[] a, int lo, int mid, int hi) {
          int[] tmp = new int[hi - lo + 1];
          int i = lo, j = mid + 1, k = 0;
          while (i <= mid && j <= hi) { comparisons++; tmp[k++] = a[i] <= a[j] ? a[i++] : a[j++]; }
          while (i <= mid) tmp[k++] = a[i++];
          while (j <= hi) tmp[k++] = a[j++];
          for (k = 0; k < tmp.length; k++) a[lo + k] = tmp[k];
      }
      public static void main(String[] args) {
          int[] a = {7, 2, 9, 4, 3, 8, 6, 1};
          mergeSort(a, 0, a.length - 1);
          System.out.println(Arrays.toString(a) + " in " + comparisons + " comparisons");
      }
  }
note: 'Three lines of divide-and-conquer and one merge. Step into the recursion and watch the frames stack to depth 3 before the first merge; each merge walks its two halves once. The temporary array is the O(n) extra space merge sort needs.'
```

## Quick sort

> **Definition.** **Quick-sort** on $S$: if $n \le 1$, done; otherwise pick a **pivot**
> $x$ (the last element in the basic version), **partition** $S$ into $L$ (elements
> $< x$), $E$ (elements $= x$) and $G$ (elements $> x$), quick-sort $L$ and $G$
> recursively, and conquer by concatenating $L$, $E$, $G$ — nothing to do, the
> partition already placed the pivot correctly.

Partitioning is $O(n)$: one pass, each element compared with the pivot once. The
recursion tree, however, depends on the pivot. A pivot near the median splits the
sequence in half: depth $O(\log n)$, $O(n)$ per level, $O(n \log n)$. A pivot that is
the minimum or maximum — every time, as happens with the last element of a *sorted*
input — leaves one side empty and the other of size $n - 1$: depth $n$, total
$n + (n-1) + \dots + 1 = O(n^2)$, the **worst case**. Choosing the pivot **at random**
makes a "good" split (both sides at least $n/4$) happen with probability $\frac12$ at
every call, and the expected number of calls on any root-to-leaf path is then
$O(\log n)$: **expected** $O(n \log n)$, whatever the input.

```sim
id: ds-352-quick-sort
custom: true
engine: ds
mode: sort
algo: quick
pivot: last
data: [7, 2, 9, 4, 3, 8, 6, 1]
ops: ["sort"]
note: "In-place partition with the last element as pivot: l walks right past elements ≤ pivot, r walks left past elements ≥ pivot, out-of-place pairs are swapped, and when l and r cross the pivot is dropped between them — in its final position. Now run on 1 2 3 4 5 6 7 8: every partition peels off one element and the tree is a chain, n(n−1)/2 comparisons. Middle-element pivots fix that particular input; only a random pivot fixes every input in expectation."
```

**In-place** quick-sort partitions inside the array: with the
pivot at the right end, index $l$ scans right until it finds an element $\ge$ pivot,
$r$ scans left until it finds one $\le$ pivot; if $l < r$ they are swapped and the scans
continue; when they cross, the pivot is swapped into position $l$. The subarrays on
either side are then sorted recursively — no temporary arrays, which is why quick sort
is usually the fastest in practice despite its worst case.

```sim
id: java-352-quick-sort
custom: true
engine: java
code: |
  import java.util.Arrays;
  public class Main {
      static int comparisons = 0;
      static void quickSort(int[] a, int lo, int hi) {
          if (lo >= hi) return;
          int pivot = a[hi], l = lo, r = hi - 1;
          while (l <= r) {
              while (l <= r && a[l] <= pivot) { comparisons++; l++; }
              while (r >= l && a[r] >= pivot) { comparisons++; r--; }
              if (l < r) { int t = a[l]; a[l] = a[r]; a[r] = t; l++; r--; }
          }
          a[hi] = a[l]; a[l] = pivot;                 // pivot into its final place
          quickSort(a, lo, l - 1);
          quickSort(a, l + 1, hi);
      }
      public static void main(String[] args) {
          int[] a = {7, 2, 9, 4, 3, 8, 6, 1};
          quickSort(a, 0, a.length - 1);
          System.out.println(Arrays.toString(a) + " in " + comparisons + " comparisons");
          int[] sorted = {1, 2, 3, 4, 5, 6, 7, 8};
          comparisons = 0;
          quickSort(sorted, 0, sorted.length - 1);
          System.out.println(Arrays.toString(sorted) + " in " + comparisons + " comparisons (already sorted: the worst case)");
      }
  }
note: 'The same in-place partition as the visualiser. The second call sorts an already sorted array and makes about twice as many comparisons on the same n, with recursion depth 7 instead of 3 — step into it and count the frames. Swap the pivot for a[(lo + hi) / 2] (move it to hi first) and the sorted input becomes a good case.'
```

## The sorts so far

| algorithm | time | notes |
|---|---|---|
| selection-sort | $O(n^2)$ | slow, in place, for small inputs |
| insertion-sort | $O(n^2)$ | slow, in place; $O(n)$ on nearly sorted input |
| heap-sort | $O(n \log n)$ | fast, in place, for large inputs (1K–1M) |
| merge-sort | $O(n \log n)$ | fast, sequential access, needs $O(n)$ extra space; for huge inputs (> 1M) and external sorting |
| quick-sort | $O(n \log n)$ expected, $O(n^2)$ worst | fastest in practice, in place, randomised |

**Equations**

- *Merge-sort*: $T(n) = 2T(n/2) + O(n)$, depth $\lceil \log_2 n \rceil$, $O(n)$ per level $\Rightarrow$ $O(n \log n)$.
- *Quick-sort, worst case* (pivot always extreme): $\sum_{k=1}^{n} k = O(n^2)$; *expected* with a random pivot: $O(n \log n)$, since a good call (both parts $\ge n/4$) has probability $\frac12$ and at most $\log_{4/3} n$ good calls lie on any path.
- *Merging*: two sorted sequences of total length $n$ in at most $n - 1$ comparisons.

> **Key insight.** Divide, recur, conquer — and the tree of calls tells the cost.
> Merge sort always halves, so its tree is always $\log n$ deep; quick sort's tree is
> as deep as its pivots are bad, which randomisation makes rare. Both beat the
> $O(n^2)$ sorts because each level of the tree does only linear work.

## Further reading

- [Sedgewick & Wayne — Quicksort](https://algs4.cs.princeton.edu/23quicksort/) — The in-place partition, the random-shuffle argument and the three-way variant for many duplicates.
