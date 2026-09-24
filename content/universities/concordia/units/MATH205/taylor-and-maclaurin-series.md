---
title: Taylor and Maclaurin series
order: 22
status: detailed
notes: ["Lecture 22 handout — learning/Slides/Lecture22.pdf (Stewart 11.10: coefficient formula, Maclaurin series, Taylor polynomials and remainder, convergence to f)"]
weeks: [11]
textbook: "Stewart, Calculus: Early Transcendentals, 11.10"
introduces: [taylor-series]
requires:
  - {concept: power-series, strength: hard}
  - {concept: derivative, strength: hard}
reinforces: []
---

The previous lecture built power series by manipulating the geometric one. The Taylor
series answers the general question: *if* $f$ has a power series about $a$, what are its
coefficients? They are the derivatives of $f$ at $a$ — and the partial sums are the
polynomials that best mimic $f$ near $a$.

## The coefficients are the derivatives

> **Theorem.** If $f$ has a power series representation at $a$, $f(x) = \displaystyle\sum_{n=0}^{\infty} c_n(x - a)^n$ for $|x - a| < R$, then its coefficients are $c_n = \dfrac{f^{(n)}(a)}{n!}$.

*Why.* Differentiate term by term $n$ times and set $x = a$: every term vanishes except
the one that has become the constant $n!\,c_n$.

> **Definition.** The series $\displaystyle\sum_{n=0}^{\infty}\frac{f^{(n)}(a)}{n!}(x - a)^n = f(a) + f'(a)(x - a) + \frac{f''(a)}{2!}(x - a)^2 + \dots$ is the **Taylor series of $f$ at $a$**. When $a = 0$ it is the **Maclaurin series** of $f$.

> **Key insight.** Uniqueness: a function has *at most one* power series about a given
> point. So whichever route produced a series — substitution, integration, or the
> derivative formula — it is *the* Taylor series. This is why last lecture's tricks were
> legitimate shortcuts.

> **Example — $e^x$ at $0$.** Every derivative is $e^x$, so $f^{(n)}(0) = 1$ and $e^x = \displaystyle\sum_{n=0}^{\infty}\frac{x^n}{n!} = 1 + x + \frac{x^2}{2!} + \frac{x^3}{3!} + \dots$, radius $\infty$ (ratio test).

> **Example — $\sin x$ at $0$.** Derivatives cycle $\sin, \cos, -\sin, -\cos$; at $0$ the values cycle $0, 1, 0, -1$. Only odd powers survive: $\sin x = \displaystyle\sum_{n=0}^{\infty}(-1)^n\frac{x^{2n+1}}{(2n+1)!} = x - \frac{x^3}{3!} + \frac{x^5}{5!} - \dots$, radius $\infty$. Differentiating term by term: $\cos x = \displaystyle\sum_{n=0}^{\infty}(-1)^n\frac{x^{2n}}{(2n)!}$.

## Taylor polynomials and the remainder

> **Definition.** The **$n$-th degree Taylor polynomial** of $f$ at $a$ is the partial sum $T_n(x) = \displaystyle\sum_{i=0}^{n}\frac{f^{(i)}(a)}{i!}(x - a)^i$.

> **Definition.** The **remainder** is $R_n(x) = f(x) - T_n(x)$.

$T_1$ is the tangent line — the linear approximation of MATH 203. $T_2$ adds the
curvature, and so on: $T_n$ is the unique polynomial of degree $\le n$ that agrees with
$f$ in value and first $n$ derivatives at $a$.

```sim
id: calc-taylor-polynomials
controls:
  - {id: n, label: "Degree n", min: 0, max: 12, step: 1, default: 3, decimals: 0}
  - {id: a, label: "Centre a", min: -3, max: 3, step: 0.25, default: 0, decimals: 2}
note: 'sin x with its Taylor polynomial Tₙ about a (top) and the remainder |Rₙ(x)| = |sin x − Tₙ(x)| (bottom). Each extra degree widens the window where Tₙ hugs the curve; moving a slides the window. Because R = ∞ here, the window grows without bound as n → ∞, but for any fixed n it is local.'
```

```python
# Taylor polynomials of sin about a: Tₙ(x) = Σ sin⁽ⁱ⁾(a)/i! · (x − a)ⁱ; the
# remainder is small near a and grows away from it.
from math import sin, cos, factorial

def T(n, a, x):
    d = (sin(a), cos(a), -sin(a), -cos(a))               # the derivatives of sin cycle with period 4
    return sum(d[i % 4] * (x - a)**i / factorial(i) for i in range(n + 1))

for x in (0.5, 1.5, 3):                                  # the sim's defaults n = 3, a = 0: T₃ = x − x³/6
    print(f'x = {x}: T3 = {T(3, 0, x):.4f}, sin = {sin(x):.4f}, |R3| = {abs(sin(x) - T(3, 0, x)):.2e}')
print(f'x = 3, n = 9: |R9| = {abs(sin(3) - T(9, 0, 3)):.2e}')               # more degrees widen the window
# Output:
#   x = 0.5: T3 = 0.4792, sin = 0.4794, |R3| = 2.59e-04
#   x = 1.5: T3 = 0.9375, sin = 0.9975, |R3| = 6.00e-02
#   x = 3: T3 = -1.5000, sin = 0.1411, |R3| = 1.64e+00
#   x = 3, n = 9: |R9| = 4.19e-03
```

## When does the Taylor series equal $f$?

Having a Taylor series is not the same as being represented by it: the series might
converge to something else. The test is whether the remainder disappears.

> **Theorem.** If $f(x) = T_n(x) + R_n(x)$ and $\displaystyle\lim_{n \to \infty} R_n(x) = 0$ for $|x - a| < R$, then $f$ equals the sum of its Taylor series on $|x - a| < R$.

The usual way to show $R_n \to 0$ is **Taylor's inequality**: if $|f^{(n+1)}(x)| \le M$ for
$|x - a| \le d$, then $|R_n(x)| \le \dfrac{M}{(n+1)!}|x - a|^{n+1}$ there. Since
$|x - a|^{n+1}/(n+1)! \to 0$ for every $x$, any function whose derivatives are all bounded
by a common $M$ — $\sin$, $\cos$, $e^x$ on bounded intervals — is represented by its
Taylor series everywhere.

> **Example.** $|\sin^{(n+1)}(x)| \le 1$ for all $x$, so $|R_n(x)| \le \dfrac{|x|^{n+1}}{(n+1)!} \to 0$: the sine series converges to $\sin x$ for every $x$. For $|x| \le 1$ and $n = 5$ the error is at most $1/720 \approx 0.0014$.

> **Caution.** $f(x) = e^{-1/x^2}$ (with $f(0) = 0$) has every derivative equal to $0$ at
> $0$. Its Maclaurin series is identically $0$, converges everywhere, and equals $f$
> only at $x = 0$. The remainder theorem is not decoration.

## The standard Maclaurin series

**Equations**

- $\dfrac{1}{1 - x} = \displaystyle\sum_{n=0}^{\infty} x^n$, $\ R = 1$
- $e^x = \displaystyle\sum_{n=0}^{\infty}\frac{x^n}{n!}$, $\ R = \infty$
- $\sin x = \displaystyle\sum_{n=0}^{\infty}(-1)^n\frac{x^{2n+1}}{(2n+1)!}$, $\quad\cos x = \displaystyle\sum_{n=0}^{\infty}(-1)^n\frac{x^{2n}}{(2n)!}$, $\ R = \infty$
- $\tan^{-1}x = \displaystyle\sum_{n=0}^{\infty}(-1)^n\frac{x^{2n+1}}{2n+1}$, $\quad\ln(1 + x) = \displaystyle\sum_{n=1}^{\infty}(-1)^{n-1}\frac{x^n}{n}$, $\ R = 1$
- $c_n = \dfrac{f^{(n)}(a)}{n!}$; $\quad |R_n(x)| \le \dfrac{M}{(n+1)!}|x - a|^{n+1}$ when $|f^{(n+1)}| \le M$

> **Example — using the table.** $e^{-x^2} = \displaystyle\sum_{n=0}^{\infty}\frac{(-1)^n x^{2n}}{n!}$, so $\displaystyle\int_0^1 e^{-x^2}\,dx = \sum_{n=0}^{\infty}\frac{(-1)^n}{n!\,(2n+1)} = 1 - \frac13 + \frac{1}{10} - \frac{1}{42} + \frac{1}{216} - \dots \approx 0.7468$, with the alternating series estimate giving the accuracy. This is the integral that lecture 2 could only bound; the series computes it — and it is the one behind every normal-distribution table.

> **Note — where this goes next.** In MAST 221 the moment generating function $E[e^{tX}]$
> is expanded exactly this way, and its Taylor coefficients at $0$ are the moments of
> $X$. In numerical methods, $T_1$ and $T_2$ are the basis of Newton's method and of
> error estimates for every finite-difference formula.

## Further reading

- [Paul's Online Notes — Taylor Series](https://tutorial.math.lamar.edu/Classes/CalcII/TaylorSeries.aspx) — Deriving the standard series from the coefficient formula and by manipulation.
- [Paul's Online Notes — Applications of Series](https://tutorial.math.lamar.edu/Classes/CalcII/SeriesApplications.aspx) — Integrating $e^{-x^2}$ and other functions with no elementary antiderivative.
