---
title: The integral test
order: 16
status: detailed
notes: ["Lecture 16 handout — learning/Slides/Lecture16.pdf (Stewart 11.3: positive series, integral test, p-series)"]
weeks: [9]
textbook: "Stewart, Calculus: Early Transcendentals, 11.3"
introduces:
  - {concept: convergence-tests, perspective: "the integral test and the p-series it settles"}
requires:
  - {concept: series, strength: hard}
  - {concept: improper-integral, strength: hard}
reinforces: []
---

For a series with positive terms the partial sums increase, so by the monotone
convergence theorem the only question is whether they are bounded. The integral test
answers it by comparing the sum with an improper integral — and hands over the
$p$-series, the benchmark family every later comparison uses.

## Positive series

:::definition[Positive series]
$\displaystyle\sum_{n=1}^{\infty} a_n$ is a **positive series** if $a_n > 0$ for every $n \ge 1$.
:::

For such a series $S_{n+1} = S_n + a_{n+1} > S_n$, so $\{S_n\}$ is increasing. It converges
if and only if it is bounded above — no oscillation is possible.

## The integral test

::::theorem[Integral test]
Suppose $a_n = f(n)$ where $f$ is positive, continuous and non-increasing on $[N, \infty)$ for
some $N \ge 1$. Then $\displaystyle\sum_{n=1}^{\infty} a_n$ and $\displaystyle\int_N^{\infty} f(x)\,dx$
either **both converge or both diverge**.

:::proof
Draw rectangles of width $1$ and heights $a_n$ over $[n, n+1]$. Because $f$ decreases, the
rectangles starting at $n = 2$ lie *under* the curve and the rectangles starting at $n = 1$
lie *over* it:

$$
a_2 + a_3 + \dots + a_n \le \int_1^n f(x)\,dx \le a_1 + a_2 + \dots + a_{n-1} .
$$

If the integral converges, the left sum is bounded, so the series converges. If the integral
diverges, the right sum is unbounded, so the series diverges.
:::
::::

```sim
id: calc-integral-test
controls:
  - {id: p, label: "Exponent p", min: 0.5, max: 2.5, step: 0.1, default: 1, decimals: 1}
  - {id: n, label: "Rectangles n", min: 2, max: 30, step: 1, default: 10, decimals: 0}
note: 'The curve 1/xᵖ with the rectangles of heights 1/kᵖ, k = 2 … n, sitting under it. Their total (the partial sum minus the first term) is trapped below the integral from 1 to n. For p > 1 the integral stays bounded, so the series converges; for p ≤ 1 both grow without bound. Try p = 1 to watch the harmonic series creep up like ln n.'
```

```python
# Integral test for Σ 1/kᵖ: the rectangles k = 2 … n fit under the curve, so
# a₂ + … + aₙ ≤ ∫₁ⁿ x⁻ᵖ dx; both stay bounded exactly when p > 1.
from math import log

def compare(p, n):
    tail = sum(k**-p for k in range(2, n + 1))
    I = log(n) if p == 1 else (n**(1 - p) - 1) / (1 - p)
    return 1 + tail, tail, I

for p in (1, 2):                                         # the sim's default is p = 1, n = 10
    for n in (10, 1000):
        S, tail, I = compare(p, n)
        print(f'p = {p}, n = {n}: S_n = {S:.4f}, tail {tail:.4f} <= integral {I:.4f}')
# Output:
#   p = 1, n = 10: S_n = 2.9290, tail 1.9290 <= integral 2.3026
#   p = 1, n = 1000: S_n = 7.4855, tail 6.4855 <= integral 6.9078
#   p = 2, n = 10: S_n = 1.5498, tail 0.5498 <= integral 0.9000
#   p = 2, n = 1000: S_n = 1.6439, tail 0.6439 <= integral 0.9990
```

:::caution
The test decides *whether* the series converges, not *what* its sum is. In
general $\sum a_n \ne \int_1^{\infty} f$. For $\sum 1/n^2$ the integral is $1$ while the sum
is $\pi^2/6 \approx 1.645$. The sandwich above does give bounds on the sum, though, and a
remainder estimate: $\int_{n+1}^{\infty} f \le R_n = S - S_n \le \int_n^{\infty} f$.
:::

:::caution
The hypotheses matter: the test applies only to positive, eventually
decreasing terms given by a function that can be integrated. Failing "decreasing" is
the usual disqualifier.
:::

## $p$-series

:::definition[$p$-series]
A **$p$-series** is $\displaystyle\sum_{n=1}^{\infty}\frac{1}{n^p}$.
:::

::::theorem[Convergence of $p$-series]
The $p$-series **converges if $p > 1$ and diverges if $p \le 1$.**

:::proof
For $p > 0$ this is the integral test applied to $f(x) = x^{-p}$, using the $p$-integral of
lecture 13: $\int_1^{\infty} x^{-p}\,dx$ converges exactly for $p > 1$. For $p \le 0$ the terms
do not even go to $0$.
:::
::::

::::example[Reading off $p$]
Which of $\displaystyle\sum \frac{1}{n^2}$, $\displaystyle\sum \frac{1}{\sqrt n}$, $\displaystyle\sum \frac{1}{n}$, $\displaystyle\sum n^{-1.001}$ converge?

:::solution
$\sum 1/n^2$ converges ($p = 2$); $\sum 1/\sqrt n$ diverges ($p = \tfrac12$); $\sum 1/n$ diverges
($p = 1$ — the harmonic series, now with a one-line proof); $\sum n^{-1.001}$ converges, barely.
:::
::::

::::example[Slower than harmonic]
Decide whether $\displaystyle\sum_{n=2}^{\infty}\frac{1}{n\ln n}$ and $\displaystyle\sum_{n=2}^{\infty}\frac{1}{n(\ln n)^2}$ converge.

:::solution
$f(x) = \dfrac{1}{x\ln x}$ is positive and decreasing for $x \ge 2$, and

$$
\int_2^{t}\frac{dx}{x\ln x} = \big[\ln(\ln x)\big]_2^t \to \infty ,
$$

so the first series diverges — even more slowly than the harmonic series. For the second the
integral is $\big[-1/\ln x\big]_2^{\infty} = 1/\ln 2$, and the series converges.
:::
::::

:::insight
The boundary between convergence and divergence for positive series
sits at $1/n$: terms that decay like $1/n^p$ need $p > 1$. Every comparison in the next
lecture is a question of "which side of $1/n$ is this?"
:::

:::equations
- $a_n = f(n)$, $f$ positive, continuous, decreasing: $\sum a_n$ converges $\iff \int_N^{\infty} f\,dx$ converges
- $\displaystyle\sum_{n=1}^{\infty}\frac{1}{n^p}$ converges $\iff p > 1$
- remainder: $\displaystyle\int_{n+1}^{\infty} f \le S - S_n \le \int_n^{\infty} f$
:::

## Further reading

- [Paul's Online Notes — Integral Test](https://tutorial.math.lamar.edu/Classes/CalcII/IntegralTest.aspx) — The rectangle picture, the $p$-series, and the hypotheses spelled out.
- [Paul's Online Notes — Estimating the Value of a Series](https://tutorial.math.lamar.edu/Classes/CalcII/EstimatingSeries.aspx) — The remainder bounds from the integral test.
