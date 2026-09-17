---
title: Functions as power series
order: 21
status: detailed
notes: ["Lecture 21 handout — learning/Slides/Lecture21.pdf (Stewart 11.9: analytic functions, term-by-term differentiation and integration)"]
weeks: [11]
textbook: "Stewart, Calculus: Early Transcendentals, 11.9"
introduces: []
requires:
  - {concept: power-series, strength: hard}
  - {concept: derivative, strength: hard}
  - {concept: fundamental-theorem-of-calculus, strength: hard}
reinforces:
  - {concept: power-series, perspective: "representing known functions as power series, and differentiating and integrating them term by term"}
---

The geometric series says $1/(1 - x)$ *is* a power series on $(-1, 1)$. Substitution,
differentiation and integration — all performed term by term, as on a polynomial —
manufacture power series for a whole family of functions from that one seed, without
computing a single coefficient from scratch.

## Analytic functions

> **Definition.** A function $f$ is **analytic at $a$** if it can be represented by a power series about $a$ with a positive radius of convergence: $f(x) = \sum c_n(x - a)^n$ for $|x - a| < R$, $R > 0$.

The starting point is the geometric series,
$$\frac{1}{1 - x} = \sum_{n=0}^{\infty} x^n, \qquad |x| < 1,$$
and the first manufacturing tool is **substitution**: replace $x$ by any expression that
keeps the ratio below $1$.

> **Example.** $\dfrac{1}{1 + x^2} = \dfrac{1}{1 - (-x^2)} = \displaystyle\sum_{n=0}^{\infty}(-x^2)^n = \sum_{n=0}^{\infty}(-1)^n x^{2n}$, valid for $|{-x^2}| < 1$, i.e. $|x| < 1$.
> $\dfrac{x^3}{x + 2} = \dfrac{x^3}{2}\cdot\dfrac{1}{1 - (-x/2)} = \dfrac{x^3}{2}\displaystyle\sum_{n=0}^{\infty}\Big(-\frac{x}{2}\Big)^n = \sum_{n=0}^{\infty}\frac{(-1)^n}{2^{n+1}}x^{n+3}$, valid for $|x| < 2$.

## Term-by-term differentiation and integration

> **Theorem.** Suppose $\sum c_n(x - a)^n$ has radius of convergence $R > 0$ and let $f(x) = \sum_{n=0}^{\infty} c_n(x - a)^n$ on $(a - R, a + R)$. Then $f$ is differentiable on that interval and
> (1) $f'(x) = \displaystyle\sum_{n=1}^{\infty} n\,c_n (x - a)^{n-1}$;
> (2) $\displaystyle\int f(x)\,dx = C + \sum_{n=0}^{\infty} c_n\frac{(x - a)^{n+1}}{n + 1}$.
> Both series have the **same radius of convergence $R$** as the original.

> **Caution.** Same *radius*, not necessarily the same *interval*: differentiating can
> lose an endpoint and integrating can gain one. $\sum x^n/n^2$ converges on $[-1, 1]$;
> its derivative $\sum x^{n-1}/n$ converges on $[-1, 1)$; the derivative of that,
> $\sum (n-1)x^{n-2}/n$, only on $(-1, 1)$.

> **Example — differentiate.** From $\dfrac{1}{1 - x} = \sum x^n$: $\dfrac{1}{(1 - x)^2} = \dfrac{d}{dx}\dfrac{1}{1 - x} = \displaystyle\sum_{n=1}^{\infty} n x^{n-1} = 1 + 2x + 3x^2 + \dots$, $|x| < 1$.

> **Example — integrate.** $\ln(1 - x) = -\displaystyle\int\frac{dx}{1 - x} = -\sum_{n=0}^{\infty}\frac{x^{n+1}}{n+1} + C$; at $x = 0$ both sides are $0$, so $C = 0$ and $-\ln(1 - x) = \displaystyle\sum_{n=1}^{\infty}\frac{x^n}{n} = x + \frac{x^2}{2} + \frac{x^3}{3} + \dots$, $|x| < 1$. (At $x = -1$ the series still converges, to $\ln 2$ — Abel's theorem lets the identity extend to that endpoint, giving the sum of the alternating harmonic series.)

> **Example — integrate the substituted series.** $\tan^{-1}x = \displaystyle\int\frac{dx}{1 + x^2} = \int\sum_{n=0}^{\infty}(-1)^n x^{2n}\,dx = \sum_{n=0}^{\infty}(-1)^n\frac{x^{2n+1}}{2n+1} = x - \frac{x^3}{3} + \frac{x^5}{5} - \dots$, with $C = 0$ since $\tan^{-1}0 = 0$; valid for $|x| < 1$ (and at both endpoints). At $x = 1$: $\dfrac{\pi}{4} = 1 - \dfrac13 + \dfrac15 - \dfrac17 + \dots$.

```sim
id: calc-arctan-series
controls:
  - {id: N, label: "Highest odd power index N", min: 0, max: 30, step: 1, default: 3, decimals: 0}
note: 'arctan x (white) against the partial sums Σₙ₌₀ᴺ (−1)ⁿ x²ⁿ⁺¹/(2n+1) obtained by integrating the geometric series for 1/(1 + x²). Convergence is fast near 0, slow near ±1, and fails outside — the radius of the seed series is inherited. The title shows the partial sum at x = 1 crawling toward π/4.'
```

> **Key insight.** Integrating a power series is *easier* than integrating the function.
> $\int e^{-x^2}\,dx$ has no elementary antiderivative, yet substituting $-x^2$ into the
> exponential series and integrating term by term gives a power series for it that
> converges everywhere — usable for numerical values to any accuracy. That is the
> practical payoff of the whole chapter.

> **Example — a definite integral with no closed form.** $\displaystyle\int_0^{0.1}\frac{dx}{1 + x^5} = \int_0^{0.1}\sum_{n=0}^{\infty}(-1)^n x^{5n}\,dx = \sum_{n=0}^{\infty}(-1)^n\frac{(0.1)^{5n+1}}{5n+1} = 0.1 - \frac{10^{-6}}{6} + \dots \approx 0.0999998$, with the error controlled by the alternating series estimate.

**Equations**

- $\dfrac{1}{1 - x} = \displaystyle\sum_{n=0}^{\infty} x^n$, $\quad\dfrac{1}{1 + x^2} = \displaystyle\sum_{n=0}^{\infty}(-1)^n x^{2n}$, $\ |x| < 1$
- $\Big(\sum c_n(x-a)^n\Big)' = \sum n c_n (x-a)^{n-1}$, $\quad\int\sum c_n(x-a)^n\,dx = C + \sum c_n\dfrac{(x-a)^{n+1}}{n+1}$ — same $R$
- $-\ln(1 - x) = \displaystyle\sum_{n=1}^{\infty}\frac{x^n}{n}$, $\quad\tan^{-1}x = \displaystyle\sum_{n=0}^{\infty}(-1)^n\frac{x^{2n+1}}{2n+1}$

## Further reading

- [Paul's Online Notes — Power Series and Functions](https://tutorial.math.lamar.edu/Classes/CalcII/PowerSeriesandFunctions.aspx) — Building series from the geometric one by substitution, differentiation and integration.
