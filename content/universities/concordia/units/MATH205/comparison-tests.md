---
title: The comparison tests
order: 17
status: detailed
weeks: [9]
introduces:
  - {concept: convergence-tests, perspective: "the comparison and limit comparison tests against geometric and p-series"}
requires:
  - {concept: series, strength: hard}
  - {concept: limit, strength: hard}
reinforces: []
---

With the geometric series and the $p$-series as known benchmarks, most positive series
can be settled by comparison: smaller than a convergent series converges, larger than
a divergent one diverges. The limit form removes the need for an actual inequality and
is the version used in practice.

## The comparison test

::::theorem[Comparison test]
Let $\sum a_n$ and $\sum b_n$ be series with positive terms.

1. If $\sum b_n$ converges and $a_n \le b_n$ for all $n$, then $\sum a_n$ converges.
2. If $\sum b_n$ diverges and $a_n \ge b_n$ for all $n$, then $\sum a_n$ diverges.

:::proof
Positive series converge exactly when their partial sums are bounded. In 1 the partial sums
of $\sum a_n$ are bounded by the sum of $\sum b_n$; in 2 they exceed the unbounded partial
sums of $\sum b_n$.
:::
::::

"For all $n$" can be relaxed to "for all $n \ge N$": finitely many terms never change
convergence.

::::example[Comparing both ways]
Decide whether $\displaystyle\sum \frac{5}{2n^2 + 4n + 3}$ and $\displaystyle\sum \frac{\ln n}{n}$ converge.

:::solution
For $n \ge 1$, $\dfrac{5}{2n^2 + 4n + 3} < \dfrac{5}{2n^2}$, and $\sum \dfrac{5}{2n^2} = \dfrac52\sum\dfrac{1}{n^2}$
converges ($p = 2$), so the first converges. For $n \ge 3$, $\dfrac{\ln n}{n} > \dfrac{1}{n}$, and
the harmonic series diverges, so the second diverges.
:::
::::

:::caution
The inequality must point the *useful* way. Knowing $a_n \le b_n$ with
$\sum b_n$ *divergent* says nothing — $\frac{1}{n^2} \le \frac{1}{n}$, yet $\sum \frac{1}{n^2}$
converges. Likewise $a_n \ge b_n$ with $\sum b_n$ convergent says nothing.
:::

## The limit comparison test

Finding a clean inequality is often awkward (is $\frac{1}{2^n - 1}$ smaller than
$\frac{1}{2^n}$? no — it is bigger). It is enough that the terms are *of the same size*.

::::theorem[Limit comparison test]
Let $\sum a_n$ and $\sum b_n$ have positive terms. If

$$
\lim_{n \to \infty}\frac{a_n}{b_n} = c \quad\text{with } 0 < c < \infty ,
$$

then either **both converge or both diverge**.

:::proof
Eventually $\tfrac{c}{2}b_n < a_n < 2c\,b_n$, and the ordinary comparison test applies in both
directions.
:::
::::

::::example[Same size, same fate]
Decide whether $\displaystyle\sum \frac{1}{2^n - 1}$ and $\displaystyle\sum \frac{2n^2 + 3n}{\sqrt{5 + n^5}}$ converge.

:::solution
For the first take $b_n = 2^{-n}$: $\dfrac{a_n}{b_n} = \dfrac{2^n}{2^n - 1} \to 1$, and $\sum 2^{-n}$
is a convergent geometric series — it converges. The terms of the second behave like
$\dfrac{2n^2}{n^{5/2}} = \dfrac{2}{n^{1/2}}$, so take $b_n = n^{-1/2}$; the ratio tends to $2$, and
$\sum n^{-1/2}$ diverges ($p = \tfrac12$) — it diverges.
:::
::::

```sim
id: calc-comparison
controls:
  - {id: q, label: "Exponent q", min: 1, max: 3, step: 0.1, default: 2, decimals: 1}
note: 'aₙ = 1/(n^q + n) compared with the p-series bₙ = 1/n^q. Top: the ratio aₙ/bₙ settles at a positive constant (1 for q > 1, 1/2 at q = 1), so the two series share their fate. Bottom: both partial sums level off when q > 1 and both keep climbing at q = 1 — the harmonic case.'
```

```python
# Limit comparison: aₙ = 1/(n^q + n) against bₙ = 1/n^q; the ratio tends to a
# positive constant, so both series converge or both diverge.
def ratio(q, n): return (1 / (n**q + n)) / n**-q

for q in (2, 1):                                         # the sim's default q = 2
    sa = sum(1 / (n**q + n) for n in range(1, 41))
    sb = sum(n**-q for n in range(1, 41))
    print(f'q = {q}: ratio at n = 40: {ratio(q, 40):.3f}, partial sums to 40: {sa:.4f}, {sb:.4f}')
print(round(sum(1 / (n*n + n) for n in range(1, 10**6)), 4))   # q = 2 telescopes to 1
# Output:
#   q = 2: ratio at n = 40: 0.976, partial sums to 40: 0.9756, 1.6202
#   q = 1: ratio at n = 40: 0.500, partial sums to 40: 2.1393, 4.2785
#   1.0
```


:::insight
To pick $b_n$, keep only the *dominant* term of the numerator and of
the denominator: powers beat logarithms, exponentials beat powers, and among powers
the highest wins. The result is a $p$-series or a geometric series, and the ratio test
of the limit is a routine limit at infinity.
:::

:::note
What if $c = 0$ or $c = \infty$? Then only one direction survives: with $c = 0$,
$a_n$ is eventually smaller than $b_n$, so convergence of $\sum b_n$ still gives
convergence of $\sum a_n$; with $c = \infty$, divergence of $\sum b_n$ still gives
divergence of $\sum a_n$. Nothing more.
:::

:::equations
- $0 < a_n \le b_n$: $\sum b_n$ converges $\Rightarrow \sum a_n$ converges; $\ a_n \ge b_n > 0$: $\sum b_n$ diverges $\Rightarrow \sum a_n$ diverges
- $\displaystyle\lim \frac{a_n}{b_n} = c \in (0, \infty) \Rightarrow \sum a_n,\ \sum b_n$ converge or diverge together
- benchmarks: $\sum r^n$ ($|r| < 1$ converges), $\ \sum n^{-p}$ ($p > 1$ converges)
:::

## Further reading

- [Paul's Online Notes — Comparison Test / Limit Comparison Test](https://tutorial.math.lamar.edu/Classes/CalcII/SeriesCompTest.aspx) — Both tests with the "keep the dominant term" heuristic and examples where the naive inequality fails.
