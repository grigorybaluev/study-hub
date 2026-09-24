---
title: Power series
order: 20
status: detailed
notes: ["Lecture 20 handout — learning/Slides/Lecture20.pdf (Stewart 11.8: definition, the three possibilities, interval and radius of convergence, algebra of power series, Cauchy product)"]
weeks: [11]
textbook: "Stewart, Calculus: Early Transcendentals, 11.8"
introduces: [power-series]
requires:
  - {concept: series, strength: hard}
  - {concept: convergence-tests, strength: hard}
reinforces: []
---

A power series is a polynomial that never stops. For each value of $x$ it is an ordinary
numerical series that may or may not converge, and the set of $x$ where it does turns
out to be always an interval centred at the base point — found, almost always, with the
ratio test.

## Definition

> **Definition.** A **power series in $x - a$** (or **centred at $a$**, or **about $a$**) is a series of the form $\displaystyle\sum_{n=0}^{\infty} c_n (x - a)^n = c_0 + c_1(x - a) + c_2(x - a)^2 + \dots$; the constants $c_n$ are its **coefficients**. With $a = 0$ it is a power series in $x$: $\sum c_n x^n$.

At $x = a$ every term but the first vanishes, so the series converges there trivially,
to $c_0$. (Convention: $(x - a)^0 = 1$ even at $x = a$.)

> **Example.** $\displaystyle\sum_{n=0}^{\infty} x^n = 1 + x + x^2 + \dots$ is the geometric series with ratio $x$: it converges exactly for $|x| < 1$, to $\dfrac{1}{1 - x}$. So on $(-1, 1)$ the power series *is* the function $1/(1 - x)$ — the first example of a function represented by a power series.

## Where a power series converges

> **Theorem.** For a power series $\sum c_n(x - a)^n$ exactly one of the following holds:
> (i) it converges only at $x = a$;
> (ii) it converges for every real $x$;
> (iii) there is a number $R > 0$ such that it converges (absolutely) when $|x - a| < R$ and diverges when $|x - a| > R$ — and at the two endpoints $x = a \pm R$ it may do either.

> **Definition.** $R$ is the **radius of convergence** ($R = 0$ in case (i), $R = \infty$ in case (ii)). The set of $x$ where the series converges is the **interval of convergence**: the single point $\{a\}$, the whole line $(-\infty, \infty)$, or one of $(a - R, a + R)$, $[a - R, a + R)$, $(a - R, a + R]$, $[a - R, a + R]$.

The radius comes from the ratio test on $|c_{n+1}(x-a)^{n+1}| / |c_n(x-a)^n| = |x - a|\cdot|c_{n+1}/c_n|$:
if $|c_{n+1}/c_n| \to \ell$ the series converges for $|x - a| < 1/\ell$, so $R = 1/\ell$ (with
$R = \infty$ if $\ell = 0$ and $R = 0$ if $\ell = \infty$). The endpoints give ratio limit $1$
and must be **checked separately**, with the tests of lectures 16–19.

```sim
id: calc-power-series-interval
controls:
  - {id: N, label: "Terms N", min: 1, max: 60, step: 1, default: 8, decimals: 0}
note: 'Partial sums S_N(x) = Σₙ₌₁ᴺ xⁿ/n against the function −ln(1 − x) they converge to. Inside |x| < 1 the curves pile up on the function as N grows; at x = −1 the series converges (alternating harmonic), at x = 1 it is the harmonic series and blows up, and beyond |x| > 1 the partial sums explode. The interval of convergence is [−1, 1).'
```

```python
# Σ xⁿ/n = −ln(1 − x) on its interval of convergence [−1, 1).
from math import log

def S(x, N): return sum(x**n / n for n in range(1, N + 1))

for x in (0.5, -1, 1, 1.2):                              # the sim's default N = 8, then more terms
    print(f'x = {x}:', *(f'{S(x, N):.4g}' for N in (8, 100, 1000)),
          f'| -ln(1-x) = {-log(1 - x):.4f}' if x < 1 else '| diverges')
# Output:
#   x = 0.5: 0.6928 0.6931 0.6931 | -ln(1-x) = 0.6931
#   x = -1: -0.6345 -0.6882 -0.6926 | -ln(1-x) = -0.6931
#   x = 1: 2.718 5.187 7.485 | diverges
#   x = 1.2: 5.059 5.251e+06 9.154e+76 | diverges
```

> **Example.** $\displaystyle\sum_{n=1}^{\infty}\frac{(x - 3)^n}{n}$. Ratio: $\left|\frac{(x-3)^{n+1}}{n+1}\cdot\frac{n}{(x-3)^n}\right| = |x - 3|\,\frac{n}{n+1} \to |x - 3|$, so $R = 1$ and the series converges for $2 < x < 4$. Endpoints: at $x = 4$ it is $\sum 1/n$, divergent; at $x = 2$ it is $\sum (-1)^n/n$, convergent. Interval of convergence $[2, 4)$.
> $\displaystyle\sum_{n=0}^{\infty}\frac{x^n}{n!}$: ratio $\dfrac{|x|}{n+1} \to 0$ for every $x$, so $R = \infty$.
> $\displaystyle\sum_{n=0}^{\infty} n!\,x^n$: ratio $(n+1)|x| \to \infty$ for every $x \ne 0$, so $R = 0$.

> **Caution.** The ratio test never decides the endpoints. Two of the three examples
> above have different behaviour at their two ends; omitting the endpoint check is the
> standard lost mark.

## Algebra of power series

> **Theorem.** Let $\sum a_n(x - a)^n$ and $\sum b_n(x - a)^n$ have radii $R_a$ and $R_b$, and let $c$ be a constant. Then
> 1. $\sum a_n(x - a)^n \pm \sum b_n(x - a)^n = \sum (a_n \pm b_n)(x - a)^n$, with radius at least $\min\{R_a, R_b\}$;
> 2. $c\sum a_n(x - a)^n = \sum (c a_n)(x - a)^n$, with radius $R_a$;
> 3. $\big(\sum a_n(x - a)^n\big)\big(\sum b_n(x - a)^n\big) = \sum c_n(x - a)^n$ with $c_n = \displaystyle\sum_{j=0}^{n} a_j b_{n-j}$, valid where both converge.

> **Definition.** The series in 3, with coefficients $c_n = \sum_{j=0}^n a_j b_{n-j}$, is the **Cauchy product** of the two series — the same rule as multiplying polynomials and collecting powers.

> **Key insight.** Inside its radius a power series behaves like a polynomial: add,
> scale, multiply term by term. The justification is absolute convergence (lecture 19),
> which is what case (iii) of the theorem guarantees strictly inside the interval. The
> next lecture adds the two remaining polynomial operations — differentiate and
> integrate.

**Equations**

- $\displaystyle\sum_{n=0}^{\infty} c_n(x - a)^n$ converges for $|x - a| < R$, diverges for $|x - a| > R$
- $R = \displaystyle\lim_{n\to\infty}\left|\frac{c_n}{c_{n+1}}\right|$ when the limit exists; endpoints checked separately
- $\displaystyle\sum_{n=0}^{\infty} x^n = \frac{1}{1 - x}$ for $|x| < 1$

## Further reading

- [Paul's Online Notes — Power Series](https://tutorial.math.lamar.edu/Classes/CalcII/PowerSeries.aspx) — Radius and interval of convergence with the endpoint bookkeeping done in full.
