---
title: Alternating series
order: 18
status: detailed
notes: ["Lecture 18 handout — learning/Slides/Lecture18.pdf (Stewart 11.5: alternating series test, alternating series estimation theorem)"]
weeks: [10]
textbook: "Stewart, Calculus: Early Transcendentals, 11.5"
introduces:
  - {concept: convergence-tests, perspective: "the alternating series test and the estimation theorem for its error"}
requires:
  - {concept: series, strength: hard}
  - {concept: sequence, strength: hard}
reinforces: []
---

Everything so far assumed positive terms. When the signs alternate, cancellation helps:
a series can converge even though the same terms without signs would diverge. The test
is short, and it comes with something the positive-term tests never gave — an explicit
bound on the error of a partial sum.

## Alternating series

:::definition[Alternating series]
An **alternating series** has the form $\displaystyle\sum_{n=1}^{\infty}(-1)^{n-1}a_n = a_1 - a_2 + a_3 - a_4 + \dots$ with every $a_n > 0$. (The version starting with a minus sign, $\sum (-1)^n a_n$, is the same up to an overall sign.)
:::

The **alternating harmonic series** $1 - \tfrac12 + \tfrac13 - \tfrac14 + \dots$ is the
model case.

## The alternating series test

::::theorem[Alternating series test]
If the alternating series $\sum (-1)^{n-1}a_n$, $a_n > 0$, satisfies

1. $a_{n+1} \le a_n$ for all $n$ (the sizes decrease), and
2. $\lim_{n \to \infty} a_n = 0$,

then the series **converges**.

:::proof
The even partial sums $S_2, S_4, \dots$ increase (each adds $a_{2k+1} - a_{2k+2} \ge 0$) and stay
below $a_1$; the odd ones $S_1, S_3, \dots$ decrease and stay above $0$. Both converge by the
monotone convergence theorem, and $S_{2k+1} - S_{2k} = a_{2k+1} \to 0$ forces the two limits to
agree.
:::
::::

::::example[Three alternating series]
Decide whether $\displaystyle\sum \frac{(-1)^{n-1}}{n}$, $\displaystyle\sum (-1)^n\frac{n}{n + 1}$ and $\displaystyle\sum (-1)^{n-1}\frac{n^2}{n^3 + 1}$ converge.

:::solution
- The alternating harmonic series: $a_n = 1/n$ decreases to $0$, so it converges (its sum
  turns out to be $\ln 2$). The harmonic series itself diverges — the signs make all the
  difference.
- $a_n = \frac{n}{n+1} \to 1 \ne 0$, so condition 2 fails; by the divergence test the series
  diverges.
- $a_n \to 0$, and $f(x) = x^2/(x^3 + 1)$ has $f'(x) < 0$ for $x \ge 2$, so the terms decrease
  from $n = 2$ on. It converges.
:::
::::

:::caution
Condition 1 is not automatic from condition 2. Check it — with $a_{n+1} \le a_n$
directly, or with $f'(x) \le 0$ — and remember that "eventually decreasing" is enough.
Without condition 1 the test does not apply, and an alternating series with $a_n \to 0$ can
diverge.
:::

## The estimation theorem

::::theorem[Alternating series estimation]
If $S = \sum (-1)^{n-1}a_n$ satisfies conditions 1 and 2, then the remainder after $n$ terms
obeys $|R_n| = |S - S_n| \le a_{n+1}$.

:::proof
The partial sums hop back and forth across $S$, each hop shorter than the last; so $S$ lies
between any two consecutive partial sums, and the distance from $S_n$ to $S$ is at most the
size of the next hop.
:::
::::

::::example[How many terms?]
How many terms of $\displaystyle\sum_{n=1}^{\infty}\frac{(-1)^{n-1}}{n^3}$ guarantee an error below $0.001$?

:::solution
Need $a_{n+1} = \dfrac{1}{(n+1)^3} \le 0.001$, i.e. $n + 1 \ge 10$: nine terms suffice. Compare
$\sum (-1)^{n-1}/n$, where $a_{n+1} \le 0.001$ needs a thousand terms — alternating
convergence can be very slow.
:::
::::

```sim
id: calc-alternating
controls:
  - {id: p, label: "Exponent p", min: 0.2, max: 2, step: 0.1, default: 1, decimals: 1}
  - {id: n, label: "Partial sums shown n", min: 2, max: 40, step: 1, default: 10, decimals: 0}
note: 'Partial sums of Σ(−1)ⁿ⁻¹/nᵖ. They alternate above and below the sum S (dashed) with shrinking steps, and the last one shown lies within aₙ₊₁ = 1/(n+1)ᵖ of S — the shaded band. Every p > 0 converges here, although the positive version needs p > 1.'
```

```python
# Alternating series estimate: |S − Sₙ| ≤ aₙ₊₁ for Σ (−1)ⁿ⁻¹/nᵖ.
from math import log

def S_n(p, n): return sum((-1)**(k - 1) * k**-p for k in range(1, n + 1))

n = 10                                                   # the sim's defaults: p = 1, n = 10
S = log(2)                                               # the p = 1 sum, 1 − 1/2 + 1/3 − … = ln 2
print(f'S_10 = {S_n(1, n):.5f}, |S − S_10| = {abs(S - S_n(1, n)):.5f} <= a_11 = {1/(n + 1):.5f}')
# Output:
#   S_10 = 0.64563, |S − S_10| = 0.04751 <= a_11 = 0.09091
```


:::insight
The estimation theorem is the first *quantitative* statement about a
series' sum in the course: it says not just "converges" but "here is a number, and
here is how far it can be from the truth". Taylor series will need exactly this kind
of bound to be useful for computation.
:::

:::equations
- $\sum (-1)^{n-1}a_n$ with $a_n \downarrow 0$ converges
- $|S - S_n| \le a_{n+1}$; $\ S$ lies between $S_n$ and $S_{n+1}$
:::

## Further reading

- [Paul's Online Notes — Alternating Series Test](https://tutorial.math.lamar.edu/Classes/CalcII/AlternatingSeries.aspx) — The test, an example where the terms are not decreasing at first, and the estimate.
