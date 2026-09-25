---
title: Analysis of algorithms
order: 1
status: detailed
weeks: [1]
introduces: [algorithm-analysis]
requires:
  - {concept: function, strength: hard}
  - {concept: iteration, strength: hard}
  - {concept: array, strength: soft}
  - {concept: series, strength: soft}
reinforces: []
---

Two programs both work; one takes a second on a million items, the other an hour. This
unit is the vocabulary for saying *why* before running either: count the steps an
algorithm makes as a function of the input size $n$, keep only how that count grows, and
name the growth with big-O. Every structure in the rest of the course is judged this way.

## Measuring versus estimating

The experimental way — implement, time with `System.currentTimeMillis()` for inputs of
several sizes, plot — is honest but limited: it needs an implementation, the same
hardware and software for any comparison, and inputs that may not represent the ones
that matter. The alternative is an abstract estimate from the algorithm's definition,
independent of machine and language: assume a **RAM model** (one CPU, memory cells
accessed in constant time), and count **primitive operations** — assigning a value,
indexing an array, comparing two numbers, calling a method, returning — each taken to
cost one unit. The count is a function of $n$, the input size, and since the same input
size can take different times we focus on the **worst case**: $\mathrm{worstTime}(n)$,
the maximum number of statements executed over all inputs of size $n$. It is the case
that matters in games, robotics and finance, and it is the easiest to reason about.

> **Example.** For `for (int i = 0; i < n - 1; i++) if (a[i] > a[i+1]) System.out.println(i);`
> the worst case (every comparison true) executes `i = 0` once, the test `i < n − 1`
> $n$ times, `i++` $n-1$ times, the comparison $n-1$ times and the print $n-1$ times:
> $\mathrm{worstTime}(n) = 4n - 2$. Nobody will ever need the $-2$; the point of the
> rest of the unit is to say "linear" and stop.

Algorithms are written in **pseudocode** — indentation instead of braces, `←` for
assignment, plain words for the structures — so the count is not muddied by language
details.

## Growth rate and the seven functions

Changing the hardware multiplies the running time by a constant; it does not change
whether doubling $n$ doubles the time or quadruples it. That is the **growth rate**, and
it is the property an algorithm owns. Seven functions cover almost every algorithm in
the course, from cheapest to most expensive:

| name | $f(n)$ | typical of |
|---|---|---|
| constant | $1$ | one array access, one arithmetic step |
| logarithmic | $\log n$ | halving the problem each step: binary search |
| linear | $n$ | one pass over the input |
| n-log-n | $n \log n$ | the good sorting algorithms |
| quadratic | $n^2$ | nested loops over the input; simple sorts |
| cubic | $n^3$ | three nested loops; Floyd-Warshall |
| exponential | $2^n$ | trying every subset; naive Fibonacci |

```sim
id: ds-growth-rates
controls:
  - {id: nmax, label: "largest n", min: 4, max: 512, step: 4, default: 64, decimals: 0}
  - {id: c, label: "constant on the linear term (c·n)", min: 1, max: 100, step: 1, default: 1, decimals: 0}
note: "Both axes are logarithmic, so every polynomial is a straight line whose slope is its degree, and 2ⁿ curves upward on any scale. Multiply the linear function by a constant of 100 — it moves up but stays parallel; growth rate ignores constants, and for large n the cheaper function always wins."
```

Algorithms with growth rates above $n \log n$ are usable only for small inputs; a
polynomial-time algorithm is the goal, and an exponential one is a last resort. A
table of "largest problem solvable in an hour" makes the point: with a quadratic
algorithm a machine a hundred times faster solves a problem only ten times larger.

## Big-O notation

> **Definition.** $f(n)$ is $O(g(n))$ if there are constants $c > 0$ and $n_0 \ge 1$
> such that $f(n) \le c \cdot g(n)$ for all $n \ge n_0$. In words: from some point on,
> $f$ is bounded above by a constant multiple of $g$ — $g$ is an upper bound on $f$'s
> growth rate.

The definition is a *claim with witnesses*: to show $2n + 10$ is $O(n)$, exhibit $c$ and
$n_0$ — $2n + 10 \le 3n$ once $n \ge 10$, so $c = 3, n_0 = 10$ work. To show $n^2$ is
*not* $O(n)$, note that $n^2 \le cn$ would need $n \le c$, false for large $n$ whatever
$c$ is.

```sim
id: ds-big-o-witness
controls:
  - {id: c, label: "c", min: 1, max: 20, step: 1, default: 4, decimals: 0}
  - {id: n0, label: "n₀", min: 1, max: 40, step: 1, default: 5, decimals: 0}
note: "f(n) = 3n² + 10n + 20 against c·n². The title says whether the pair (c, n₀) witnesses f(n) = O(n²). With c = 4 the crossing is at n₀ = 7; with c = 5 it is earlier; with c = 3 no n₀ ever works, because f(n)/n² approaches 3 from above — so 3 is the infimum of usable constants, never attained."
```

Rules that make big-O usable without witnesses each time:

- **Drop lower-order terms and constant factors**: $a_d n^d + \dots + a_0$ is $O(n^d)$;
  $3n^4 + 6n^3 + 10n^2 + 5n + 4$ is $O(n^4)$; $3\log n + 5$ is $O(\log n)$.
- **Use the simplest, tightest class**: $2n$ is $O(n^2)$ too, but say $O(n)$; say
  $O(n)$ rather than $O(3n)$.
- **Logarithms** need no base: $\log_a n = \log_b n / \log_b a$, a constant factor.
- **Sums and products**: sequential pieces add, $O(f) + O(g) = O(\max(f, g))$; nested
  pieces multiply.

The hierarchy $O(1) \subset O(\log n) \subset O(\sqrt n) \subset O(n) \subset O(n \log n)
\subset O(n^2) \subset O(n^3) \subset O(2^n)$ orders the classes; a warning goes with it —
a big-O statement says nothing about small inputs, where a "worse" algorithm with a tiny
constant may win, as $f_1(n) = 3000$ versus $f_2(n) = n^2$ shows below $n = 55$.

## Finding the big-O of code

Five shapes cover most methods:

1. **No loop, no recursion** — a fixed number of statements: $O(1)$, whatever $n$ is.
2. **A loop whose variable is halved (or doubled) each pass** — `while (n > 1) n = n / 2;`
   runs $\lfloor \log_2 n \rfloor$ times: $O(\log n)$.
3. **A single loop over the input** — $O(n)$; a loop to $n$ containing a halving loop —
   $O(n \log n)$.
4. **Nested loops over the input** — the inner loop runs $n$ times for each of $n$
   outer passes: $O(n^2)$; if the inner loop runs `i` times, the total is
   $\sum_{i=1}^{n} i = n(n+1)/2$, still $O(n^2)$. Three levels give $O(n^3)$.
5. **Sequential blocks** — the larger of the two: an $O(n)$ loop followed by an $O(n^2)$
   pair of loops is $O(n^2)$.

The stepper counts every statement it executes; the two loops below make the
difference between $n^2$ and $n$ visible in its step counter:

```sim
id: java-352-loop-cases
custom: true
engine: java
code: |
  public class Main {
      static int pairs(int n) {          // case 4: nested loops, i runs n times, j runs i times
          int count = 0;
          for (int i = 0; i < n; i++)
              for (int j = 0; j < i; j++) count++;
          return count;
      }
      static int halvings(int n) {       // case 2: n is halved each pass
          int count = 0;
          while (n > 1) { n = n / 2; count++; }
          return count;
      }
      static int single(int[] a) {       // case 3: one pass
          int max = a[0];
          for (int x : a) if (x > max) max = x;
          return max;
      }
      public static void main(String[] args) {
          int n = 12;
          System.out.println("pairs(" + n + ") counted " + pairs(n) + " = n(n-1)/2 inner passes");
          System.out.println("halvings(" + n + ") = " + halvings(n) + " = floor(log2 n)");
          int[] a = new int[n];
          for (int i = 0; i < n; i++) a[i] = (i * 7) % n;
          System.out.println("max = " + single(a));
      }
  }
note: 'The status bar shows the total number of steps the program made. Run with n = 12, then n = 24: pairs makes about four times as many steps (quadratic), halvings one more (logarithmic), single twice as many (linear). Count the steps of each method by stepping from its call to its return.'
```

## Asymptotic analysis and the prefix-averages example

**Asymptotic analysis** compares algorithms by growth rate alone: given the same
problem, the one with the slower-growing worst case is better *for large enough
inputs*. The classic demonstration computes **prefix averages**: for an
array $X$, the array $A$ with $A[i]$ the mean of $X[0..i]$. The obvious algorithm sums
$X[0..i]$ afresh for each $i$ — two nested loops, $1 + 2 + \dots + n = n(n+1)/2$
additions, $O(n^2)$. Keeping a running sum makes each prefix cost one addition: $O(n)$.
Same output, and at $n = 10^6$ the difference between a million steps and half a trillion.

```sim
id: java-352-prefix-averages
custom: true
engine: java
code: |
  import java.util.Arrays;
  public class Main {
      static double[] prefixAverage1(double[] x) {      // O(n^2): re-sums each prefix
          int n = x.length;
          double[] a = new double[n];
          for (int i = 0; i < n; i++) {
              double sum = 0;
              for (int j = 0; j <= i; j++) sum += x[j];
              a[i] = sum / (i + 1);
          }
          return a;
      }
      static double[] prefixAverage2(double[] x) {      // O(n): running sum
          int n = x.length;
          double[] a = new double[n];
          double sum = 0;
          for (int i = 0; i < n; i++) {
              sum += x[i];
              a[i] = sum / (i + 1);
          }
          return a;
      }
      public static void main(String[] args) {
          double[] x = {4, 8, 3, 9, 6, 2, 7, 1};
          System.out.println(Arrays.toString(prefixAverage1(x)));
          System.out.println(Arrays.toString(prefixAverage2(x)));
      }
  }
note: 'Same answers. Step through each call and compare the step counts: for n = 8 the first makes 36 additions in the inner loop, the second 8. Double the array and the first quadruples its work. Asymptotic analysis is exactly this comparison, done without running anything.'
```

## Big-Omega, big-Theta, and plain English

Big-O is an upper bound, and on its own it is loose: $2n$ is $O(n^{100})$. Two
companions tighten it:

> **Definition.** $f(n)$ is $\Omega(g(n))$ if $f(n) \ge c \cdot g(n)$ for all
> $n \ge n_0$, for some $c > 0$, $n_0 \ge 1$ — $g$ is a *lower* bound on $f$'s growth.
> $f(n)$ is $\Theta(g(n))$ if it is both $O(g(n))$ and $\Omega(g(n))$: there are
> $c_1, c_2$ with $c_1 g(n) \le f(n) \le c_2 g(n)$ from $n_0$ on — $f$ and $g$ grow at
> the same rate.

So $3n\log n + 2n$ is $\Theta(n \log n)$; $5n^2$ is $\Omega(n)$, $\Omega(n^2)$ and
$\Theta(n^2)$ but not $\Omega(n^3)$. Reading them as a table: $O$ is "$\le$", $\Omega$ is
"$\ge$", $\Theta$ is "$=$", all up to constants and for large $n$. The course's
plain-English convention: say "linear", "quadratic", "logarithmic" for
$\Theta(n), \Theta(n^2), \Theta(\log n)$, and reserve big-O for genuine upper bounds. And
since growth rate is what we care about, doubling the input size tells you the class
directly: $\mathrm{worstTime}(2n) \approx 4 \cdot \mathrm{worstTime}(n)$ means quadratic,
$\approx 2\times$ means linear, $+1$ step means logarithmic.

**Equations**

- *Big-O*: $f(n) \in O(g(n)) \iff \exists\, c > 0, n_0 \ge 1: f(n) \le c\,g(n)\ \forall n \ge n_0$; big-Omega flips the inequality; big-Theta requires both.
- *Polynomials*: $\sum_{k=0}^{d} a_k n^k = \Theta(n^d)$ when $a_d > 0$.
- *Triangular loop*: $\sum_{i=1}^{n} i = \frac{n(n+1)}{2} = \Theta(n^2)$; halving loop: $\lfloor \log_2 n \rfloor$ passes.
- *Change of base*: $\log_a n = \log_b n / \log_b a$, so all logarithms are one class.

> **Key insight.** Count primitive operations in the worst case, keep only the fastest-
> growing term without its constant, and name the class. From here on every operation of
> every structure gets such a label — $O(1)$, $O(\log n)$, $O(n)$ — and choosing a
> structure means choosing which operations may be slow.

## Further reading

- [Big O Cheat Sheet](https://www.bigocheatsheet.com/) — the complexities of every structure and sort in this course on one page, for later reference.
