---
title: The sorting lower bound, bucket sort and radix sort
order: 10
status: detailed
weeks: [10]
introduces: []
requires:
  - {concept: sorting-algorithms, strength: hard}
  - {concept: algorithm-analysis, strength: hard}
  - {concept: tree, strength: soft}
reinforces:
  - {concept: sorting-algorithms, perspective: "the Ω(n log n) lower bound for comparison sorts by the decision-tree argument; stable sorting; bucket sort and radix sort beating the bound for bounded integer keys"}
---

Merge sort and heap sort take $O(n \log n)$. Could a cleverer comparison of keys do
better? No — and the argument is short enough to be the first *lower bound* of the
course. Yet bucket sort and radix sort sort in $O(n)$: they do not compare keys, they
use them as array indices, and this unit is about when that trick is available.

## Comparison-based sorting and decision trees

Every sort so far learns about the input only by comparing two keys: `x_i < x_j`?
Such an algorithm can be drawn as a **decision tree**: each internal node is a
comparison, its two children the two outcomes, each leaf the permutation the
algorithm would output having reached it. A run of the algorithm on one input is one
root-to-leaf path, and the number of comparisons is the path's length.

> **Definition.** For $n$ distinct keys there are $n!$ possible orderings, and a correct
> algorithm must be able to output each of them, so the decision tree has at least
> $n!$ leaves. A binary tree with $n!$ leaves has height at least $\log_2 n!$, so some
> input costs at least $\log_2 n!$ comparisons. Since $n! \ge (n/2)^{n/2}$,
> $\log_2 n! \ge (n/2)\log_2(n/2)$: **every comparison-based sort is $\Omega(n \log n)$
> in the worst case.** Merge sort and heap sort are therefore optimal up to a constant.

```sim
id: ds-sort-lower-bound
controls:
  - {id: nmax, label: "n", min: 4, max: 200, step: 1, default: 32, decimals: 0}
note: "log₂ n! (red) is the minimum height of any decision tree for n keys, hence the minimum worst-case number of comparisons. n log₂ n (blue) is within a factor of 2 of it — merge sort's count. The dashed line is the easy bound (n/2) log₂(n/2) used in the proof; insertion sort's n(n−1)/2 shows what the bound rules out as optimal."
```

The bound says nothing about algorithms that do *not* compare keys — and it is a
worst-case statement: insertion sort on a nearly sorted input beats it because that
input follows a short path.

## Bucket sort

> **Definition.** **Bucket-sort** sorts a sequence of $n$ entries whose keys are
> integers in $[0, N-1]$: phase 1 empties the sequence, moving each entry into the
> bucket $B[k]$ for its key $k$ (an array of $N$ lists); phase 2 walks the buckets in
> index order, moving their entries back. No comparisons: $O(n + N)$ time, so $O(n)$
> when $N$ is $O(n)$.

It relies on two properties: keys are usable as array indices (**key-type
property**), and entries with equal keys keep their original relative order
(**stability**), because each bucket is a queue.

```sim
id: ds-352-bucket-sort
custom: true
engine: ds
mode: sort
algo: bucket
data: [7, 1, 3, 7, 3, 1, 7, 4]
ops: ["sort"]
note: "Keys in [0, 7]: each key is dropped into its bucket in one step, then the buckets are read in order. Zero comparisons in the caption. The two 7s and the two 3s come out in the order they went in — that stability is what radix sort needs."
```

> **Definition.** A sorting algorithm is **stable** if entries with equal keys appear
> in the output in the same order as in the input. Bucket sort, insertion sort and
> merge sort are stable (when the merge takes the left element on ties); heap sort and
> quick sort are not. Stability matters whenever a sort is applied to keys that are
> only part of the record — by grade and then by name — and it is the whole mechanism
> of radix sort.

## Lexicographic order and radix sort

A key that is a $d$-tuple $(k_1, k_2, \dots, k_d)$ — a date, a version number, a word of
letters — is compared **lexicographically**: by the first component, then by the
second on ties, and so on. **Lexicographic sort** applies a *stable* sort $d$ times,
once per component, *from the last component to the first*: after sorting on $k_d$,
the stable sort on $k_{d-1}$ leaves ties (equal $k_{d-1}$) in $k_d$ order, and by
induction the final sequence is in full lexicographic order.

> **Definition.** **Radix-sort** is lexicographic sort using bucket sort as the stable
> sort: for keys that are $d$-tuples of integers in $[0, N-1]$, $d$ bucket-sort passes,
> $O(d(n + N))$ time. For $b$-bit integers seen as $b$-tuples of bits ($N = 2$), or as
> digits in base $N$, radix sort runs in $O(b \cdot n)$ — linear when the key length is
> fixed.

Sorting from the *most* significant digit first would need the sub-sequences to be
sorted separately; from the least significant, one stable pass per digit over the
whole sequence suffices — the order established by earlier passes is only used to
break ties, which stability preserves.

```sim
id: ds-352-radix-sort
custom: true
engine: ds
mode: sort
algo: radix
data: [170, 45, 75, 90, 802, 24, 2, 66]
ops: ["sort"]
note: "Three passes for three-digit keys, least significant digit first. Pass 1 puts 802 before 2 (both end in 2, and 802 came first); in pass 2 both have tens digit 0 and stability keeps them in that order; pass 3 finally separates them by the hundreds digit. Run the passes from the hundreds down in your head and see where the order breaks."
```

```sim
id: java-352-radix-sort
custom: true
engine: java
code: |
  import java.util.*;
  public class Main {
      static void bucketPass(int[] a, int digit) {                    // stable bucket sort on one decimal digit
          ArrayList<ArrayList<Integer>> buckets = new ArrayList<>();
          for (int b = 0; b < 10; b++) buckets.add(new ArrayList<>());
          int div = 1; for (int i = 0; i < digit; i++) div *= 10;
          for (int x : a) buckets.get((x / div) % 10).add(x);
          int k = 0;
          for (ArrayList<Integer> b : buckets) for (int x : b) a[k++] = x;
      }
      static void radixSort(int[] a, int digits) { for (int d = 0; d < digits; d++) { bucketPass(a, d); System.out.println("after digit " + (d + 1) + ": " + Arrays.toString(a)); } }
      public static void main(String[] args) {
          int[] a = {170, 45, 75, 90, 802, 24, 2, 66};
          radixSort(a, 3);
      }
  }
note: 'Each pass is a bucket sort on one digit; the buckets are ArrayLists so the order within a bucket is the arrival order — the stability. Print the buckets after each pass, or change the passes to run from the hundreds down and watch the result come out wrong.'
```

**Equations**

- *Decision tree*: at least $n!$ leaves, height $\ge \log_2 n! \ge (n/2)\log_2(n/2)$ — comparison sorting is $\Omega(n \log n)$.
- *Bucket-sort*: $O(n + N)$ for integer keys in $[0, N-1]$.
- *Radix-sort*: $d$ stable passes on $d$-tuples, $O(d(n + N))$; $b$-bit integers in $O(bn)$.

> **Key insight.** Comparing keys can never beat $n \log n$, because the answer is one
> of $n!$ leaves of a binary tree. Using keys as indices sidesteps the comparison
> entirely — bucket sort in one pass, radix sort in one stable pass per digit — but
> only for keys that are small integers or tuples of them.

## Further reading

- [Sedgewick & Wayne — String Sorts](https://algs4.cs.princeton.edu/51radix/) — LSD and MSD radix sort with the stability argument and the comparison to the lower bound.
