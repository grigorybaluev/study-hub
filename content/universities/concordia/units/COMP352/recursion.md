---
title: Recursion and its analysis
order: 2
status: detailed
weeks: [2]
notes: ["Deck 2, Recursion: slides 2–7 recursive methods, base cases, the run-time stack and frames; 8–16 linear recursion (LinearSum, ReverseArray, power by repeated squaring, tail recursion); 17–25 binary recursion (BinarySum, Fibonacci: exponential first attempt, linear version); 26–30 the English ruler; 31–35 multiple recursion (copying a folder, PuzzleSolve)"]
textbook: "Goodrich, Tamassia & Goldwasser, Data Structures and Algorithms in Java, 6e, ch. 5"
introduces: []
requires:
  - {concept: recursion, strength: hard}
  - {concept: algorithm-analysis, strength: hard}
  - {concept: array, strength: soft}
reinforces:
  - {concept: recursion, perspective: "linear, binary, multiple and tail recursion; the recursion trace as a tree; counting calls and depth to get the running time"}
---

COMP 249 introduced recursion as a way to write methods. This unit classifies recursions
by the *shape* of their call tree — one call per level, two, many — because the shape
is what decides the running time, and it shows how a bad shape (Fibonacci's) is turned
into a good one by passing more information down.

## Frames and the recursion trace

Every call, recursive or not, gets a **frame** on the run-time stack: parameters,
locals, and where to resume in the caller. A recursion is correct when every chain of
calls reaches a **base case** and each recursive call moves strictly toward one. The
**recursion trace** draws one box per call with arrows to the calls it makes and the
values returned — it is the object we analyse: its depth bounds the stack, and its
number of boxes times the work per box bounds the time.

```sim
id: ds-352-call-tree-fib
custom: true
engine: ds
mode: call-tree
fn: fib
n: 5
ops: ["run fib 5"]
note: "The recursion tree of fib(5): each box is a call, filled in when it returns. fib(2) is computed three times and fib(1) five times — the tree has 15 boxes for n = 5 and roughly doubles with each +1 in n. Switch the function to sum or power and compare the shapes."
```

## Linear recursion

> **Definition.** A method is **linearly recursive** when each call makes at most one
> recursive call. The trace is a chain; if each step reduces the size by one, the depth
> is $n$ and, with $O(1)$ work per call, the time is $O(n)$ — the recursive form of a
> loop.

`LinearSum(A, n)` returns `A[n − 1] + LinearSum(A, n − 1)` with `LinearSum(A, 0) = 0`;
`ReverseArray(A, i, j)` swaps `A[i]` and `A[j]` and recurses on `(i + 1, j − 1)` until the
indices meet — $n/2$ calls, still $O(n)$. The interesting linear recursion reduces the
size by *half*: computing $x^n$ by **repeated squaring**, $x^n = (x^{\lfloor n/2
\rfloor})^2$ (times $x$ when $n$ is odd), makes one call per halving, so
$O(\log n)$ multiplications instead of $n$. The chain matters: a version that calls
`power(x, n/2)` *twice* instead of storing the result once is back to $O(n)$.

```sim
id: java-352-linear-recursion
custom: true
engine: java
code: |
  public class Main {
      static int calls = 0;
      static int linearSum(int[] a, int n) {
          calls++;
          if (n == 0) return 0;
          return linearSum(a, n - 1) + a[n - 1];
      }
      static void reverse(int[] a, int i, int j) {
          if (i < j) { int t = a[i]; a[i] = a[j]; a[j] = t; reverse(a, i + 1, j - 1); }
      }
      static long powerSlow(long x, int n) {        // O(n): two calls that repeat the same work
          calls++;
          if (n == 0) return 1;
          if (n % 2 == 0) return powerSlow(x, n / 2) * powerSlow(x, n / 2);
          return x * powerSlow(x, n / 2) * powerSlow(x, n / 2);
      }
      static long power(long x, int n) {            // O(log n): store the half, square it
          calls++;
          if (n == 0) return 1;
          long half = power(x, n / 2);
          return n % 2 == 0 ? half * half : x * half * half;
      }
      public static void main(String[] args) {
          int[] a = {3, 1, 4, 1, 5, 9};
          System.out.println("sum " + linearSum(a, a.length) + " in " + calls + " calls");
          reverse(a, 0, a.length - 1);
          System.out.println(a[0] + " " + a[1] + " " + a[2] + " " + a[3] + " " + a[4] + " " + a[5]);
          calls = 0; System.out.println("2^16 = " + power(2, 16) + " in " + calls + " calls");
          calls = 0; System.out.println("2^16 = " + powerSlow(2, 16) + " in " + calls + " calls");
      }
  }
note: 'linearSum makes n + 1 calls; power makes log n + 2; powerSlow gets the same answer with 63 calls because each level doubles the number of calls — the trace is a full binary tree of depth log n + 1 with 2n leaves. Raise the exponent to 64 and compare again.'
```

**Tail recursion** is the special case where the recursive call is the very last action
(nothing is done with its result): `ReverseArray` is tail-recursive, `LinearSum` is not
(it adds after the call). A tail-recursive method can be rewritten as a loop
mechanically, which saves the stack frames; Java's compiler does not do it for you.

## Binary recursion

> **Definition.** A method is **binary recursive** when each call makes two recursive
> calls. The trace is a binary tree. Time depends on how the size shrinks: halving the
> problem gives a tree of depth $\log n$ with $O(n)$ boxes in total; reducing it by one
> and two (Fibonacci) gives a tree of depth $n$ with exponentially many boxes.

`BinarySum(A, i, n)` adds the two halves of $A[i .. i+n-1]$ recursively: $2n - 1$ calls,
depth $\lceil \log_2 n \rceil$ — linear time, but only logarithmic stack space, which is
why divide-and-conquer sorts (unit 9) use this shape. The Fibonacci "first attempt"
`fib(n) = fib(n−1) + fib(n−2)` is binary recursion with the *wrong* size reduction: the
number of calls $n_k$ satisfies $n_k > 2^{k/2}$, so computing $F_{50}$ takes over $2^{25}$
calls. The repair (slide 24) returns *two* numbers from each call — $(F_k, F_{k-1})$ — so
that each level needs only one recursive call: linear recursion, $O(n)$.

```sim
id: java-352-fibonacci
custom: true
engine: java
code: |
  public class Main {
      static int calls = 0;
      static long fibBinary(int k) {
          calls++;
          if (k <= 1) return k;
          return fibBinary(k - 1) + fibBinary(k - 2);
      }
      // returns {F_k, F_{k-1}}: the pair lets each level make one call instead of two
      static long[] fibLinear(int k) {
          calls++;
          if (k <= 1) return new long[] {k, 0};
          long[] prev = fibLinear(k - 1);
          return new long[] {prev[0] + prev[1], prev[0]};
      }
      public static void main(String[] args) {
          for (int k = 4; k <= 12; k += 4) {
              calls = 0; long b = fibBinary(k); int cb = calls;
              calls = 0; long l = fibLinear(k)[0]; int cl = calls;
              System.out.println("F(" + k + ") = " + b + " = " + l + "   binary: " + cb + " calls, linear: " + cl + " calls");
          }
      }
  }
note: 'Same numbers, 465 calls versus 12 for k = 12 — and the binary count grows by a factor of about 1.6 for every +1 in k (the step budget runs out near k = 15). Returning the pair is the whole trick: the information the second call would recompute is already in hand.'
```

The **English ruler** (slides 26–30) is binary recursion drawing rather than
computing: `drawInterval(L)` draws the interval of length $L - 1$, a tick of length
$L$, then the interval of length $L - 1$ again — $2^L - 1$ ticks from a three-line
method.

## Multiple recursion

> **Definition.** A method is **multiply recursive** when a call may make more than two
> recursive calls — one per child in a folder, one per remaining choice in a puzzle.
> The trace is a general tree; its total size is what the analysis counts.

Copying a folder recurses once per entry (files copied, subfolders recursed): the trace
has one box per entry in the whole subtree, so the cost is linear in the number of
entries. `PuzzleSolve(k, S, U)` extends a partial solution $S$ by each element $e$ of
the unused set $U$ and recurses with $k - 1$ — the trace enumerates permutations, $n!$
leaves, which is why it is used only for small $k$ (the `cbb + ba = abc` cryptarithm
tries $3! = 6$ assignments).

```sim
id: ds-352-call-tree-hanoi
custom: true
engine: ds
mode: call-tree
fn: hanoi
n: 4
ops: ["run hanoi 4"]
note: "Binary recursion with the depth-n shape: moves(n) = moves(n−1) + 1 + moves(n−1) makes 2ⁿ − 1 moves and 2ⁿ − 1 calls. Compare with binsum (halving: 2n − 1 calls, depth log n) on the same n — the two shapes of binary recursion, one exponential and one linear."
```

**Equations**

- *Linear recursion, size − 1*: $T(n) = T(n-1) + O(1) \Rightarrow T(n) = O(n)$; *size halved*: $T(n) = T(n/2) + O(1) \Rightarrow O(\log n)$ (repeated squaring).
- *Binary recursion, size halved*: $T(n) = 2T(n/2) + O(1) \Rightarrow O(n)$, depth $\lceil \log_2 n \rceil$ (BinarySum).
- *Fibonacci, first attempt*: calls $n_k = n_{k-1} + n_{k-2} + 1 > 2^{k/2}$ — exponential; the pair-returning version makes $k$ calls.

> **Key insight.** The running time of a recursion is the size of its trace times the
> work per box. Look at how the argument shrinks — by one, by half, in two ways — and
> the shape of the tree, hence the class, follows; when the tree recomputes the same
> subproblems, pass the answers down instead.

## Further reading

- [Goodrich, Tamassia & Goldwasser — Recursion (ch. 5 slides)](https://www.cs.uic.edu/~jbell/CourseNotes/DataStructures/Recursion.html) — Linear, binary and multiple recursion with the same examples.
- [Sedgewick & Wayne — Recursion](https://introcs.cs.princeton.edu/java/23recursion/) — Towers of Hanoi, gcd and the Fibonacci trap, with running-time arguments.
