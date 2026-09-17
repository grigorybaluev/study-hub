---
title: Improper integrals
order: 13
status: detailed
notes: ["Lecture 13 handout — learning/Slides/Lecture13.pdf (Stewart 7.8: type I and type II, convergence, comparison and limit comparison tests)"]
weeks: [7]
textbook: "Stewart, Calculus: Early Transcendentals, 7.8"
introduces: [improper-integral]
requires:
  - {concept: integral, strength: hard}
  - {concept: limit, strength: hard}
  - {concept: fundamental-theorem-of-calculus, strength: hard}
reinforces: []
---

The definite integral was defined for a bounded function on a bounded interval. Two
things can break: the interval can run to infinity, or the integrand can blow up inside
it. Both are handled the same way — integrate over a safe piece, then take a limit — and
both produce the vocabulary (converge, diverge, compare) that series will reuse.

## Type I: infinite intervals

> **Definition.** (a) If $\int_a^t f(x)\,dx$ exists for every $t \ge a$, then $\displaystyle\int_a^{\infty} f(x)\,dx = \lim_{t \to \infty}\int_a^t f(x)\,dx$, provided the limit exists.
> (b) Likewise $\displaystyle\int_{-\infty}^{b} f(x)\,dx = \lim_{t \to -\infty}\int_t^b f(x)\,dx$.
> The integral is **convergent** if the limit exists (as a finite number) and **divergent** otherwise.
> (c) If both $\int_a^{\infty} f$ and $\int_{-\infty}^{a} f$ converge, $\displaystyle\int_{-\infty}^{\infty} f(x)\,dx = \int_{-\infty}^{a} f(x)\,dx + \int_a^{\infty} f(x)\,dx$ for any $a$.

> **Example — the $p$-integral.** $\displaystyle\int_1^{\infty}\frac{dx}{x^p}$. For $p \ne 1$: $\displaystyle\int_1^t x^{-p}\,dx = \frac{t^{1-p} - 1}{1 - p}$. As $t \to \infty$, $t^{1-p} \to 0$ if $p > 1$ and $\to \infty$ if $p < 1$. For $p = 1$: $\int_1^t dx/x = \ln t \to \infty$.
> So $\displaystyle\int_1^{\infty}\frac{dx}{x^p}$ **converges to $\dfrac{1}{p - 1}$ when $p > 1$ and diverges when $p \le 1$.**

```sim
id: calc-improper-p
controls:
  - {id: p, label: "Exponent p", min: 0.2, max: 3, step: 0.1, default: 2, decimals: 1}
  - {id: t, label: "Upper limit t", min: 1, max: 60, step: 1, default: 10, decimals: 0}
note: 'The area under 1/xᵖ from 1 to t. For p > 1 it levels off at 1/(p − 1) as t grows; for p ≤ 1 it keeps growing without bound, although the curve still goes to 0. Try p = 1: the area is ln t, which grows — just very slowly.'
```

> **Key insight.** $f(x) \to 0$ is *not* enough for convergence: $1/x \to 0$ but its
> integral from $1$ diverges. The integrand must go to zero *fast enough* — faster than
> $1/x$, which is what $p > 1$ says.

> **Example.** $\displaystyle\int_{-\infty}^{\infty}\frac{dx}{1 + x^2} = \lim_{t \to -\infty}\big[\tan^{-1}x\big]_t^0 + \lim_{t \to \infty}\big[\tan^{-1}x\big]_0^t = \frac{\pi}{2} + \frac{\pi}{2} = \pi$ — the total area under a curve that never touches the axis is finite.

> **Caution.** $\int_{-\infty}^{\infty} f$ is **not** $\lim_{t \to \infty}\int_{-t}^{t} f$. The symmetric limit of $\int_{-t}^t x\,dx$ is $0$, but $\int_0^{\infty} x\,dx$ diverges, so $\int_{-\infty}^{\infty} x\,dx$ diverges. The two halves must converge separately.

## Type II: unbounded integrands

> **Definition.** (a) If $f$ is continuous on $[a, b)$ and discontinuous at $b$: $\displaystyle\int_a^b f(x)\,dx = \lim_{t \to b^-}\int_a^t f(x)\,dx$.
> (b) If $f$ is continuous on $(a, b]$ and discontinuous at $a$: $\displaystyle\int_a^b f(x)\,dx = \lim_{t \to a^+}\int_t^b f(x)\,dx$.
> Convergent if the limit exists, divergent otherwise.
> (c) If the discontinuity is at an interior point $c$ and both $\int_a^c f$ and $\int_c^b f$ converge, $\displaystyle\int_a^b f = \int_a^c f + \int_c^b f$.

> **Example.** $\displaystyle\int_0^1 \frac{dx}{\sqrt{x}} = \lim_{t \to 0^+}\big[2\sqrt{x}\big]_t^1 = 2 - 0 = 2$: converges. But $\displaystyle\int_0^1\frac{dx}{x} = \lim_{t \to 0^+}\big[\ln x\big]_t^1 = 0 - (-\infty)$: diverges. Near $0$ the $p$-integral behaves the *opposite* way: $\int_0^1 x^{-p}\,dx$ converges exactly when $p < 1$.

> **Caution — the invisible discontinuity.** $\displaystyle\int_{-1}^{2}\frac{dx}{x^2}$ looks like an ordinary integral; applying Part II blindly gives $\big[-1/x\big]_{-1}^{2} = -\tfrac32$, a negative "area" for a positive function. The integrand is unbounded at $x = 0$; split there, and $\int_{-1}^{0} x^{-2}\,dx$ already diverges. **Always check the integrand for blow-ups inside the interval before evaluating.**

## Convergence tests

When no antiderivative is available, compare with an integral whose behaviour is known.

> **Theorem (comparison test).** Suppose $f$ and $g$ are continuous with $f(x) \ge g(x) \ge 0$ for $x \ge a$.
> (a) If $\int_a^{\infty} f(x)\,dx$ converges, so does $\int_a^{\infty} g(x)\,dx$.
> (b) If $\int_a^{\infty} g(x)\,dx$ diverges, so does $\int_a^{\infty} f(x)\,dx$.

Smaller than a convergent one converges; bigger than a divergent one diverges. The other
two combinations say nothing.

> **Theorem (limit comparison test).** If $f, g \ge 0$ are continuous on $[a, \infty)$ and $\displaystyle\lim_{x \to \infty}\frac{f(x)}{g(x)} = L$ with $0 < L < \infty$, then $\int_a^{\infty} f$ and $\int_a^{\infty} g$ either both converge or both diverge.

> **Example.** $\displaystyle\int_1^{\infty} e^{-x^2}\,dx$ converges: for $x \ge 1$, $e^{-x^2} \le e^{-x}$, and $\int_1^{\infty} e^{-x}\,dx = e^{-1}$ converges. (This is how the normal distribution gets a finite total probability.)
> $\displaystyle\int_1^{\infty}\frac{dx}{\sqrt{x^2 + 1}}$ diverges: the ratio to $1/x$ tends to $1$, and $\int_1^{\infty} dx/x$ diverges.

**Equations**

- $\displaystyle\int_a^{\infty} f = \lim_{t \to \infty}\int_a^t f$; $\quad\displaystyle\int_a^b f = \lim_{t \to b^-}\int_a^t f$ when $f$ blows up at $b$
- $\displaystyle\int_1^{\infty}\frac{dx}{x^p}$ converges iff $p > 1$; $\quad\displaystyle\int_0^1\frac{dx}{x^p}$ converges iff $p < 1$
- $0 \le g \le f$: $\int f$ converges $\Rightarrow$ $\int g$ converges; $\int g$ diverges $\Rightarrow$ $\int f$ diverges

## Further reading

- [Paul's Online Notes — Improper Integrals](https://tutorial.math.lamar.edu/Classes/CalcII/ImproperIntegrals.aspx) — Both types with the $p$-integral worked out.
- [Paul's Online Notes — Comparison Test for Improper Integrals](https://tutorial.math.lamar.edu/Classes/CalcII/ImproperIntegralsCompTest.aspx) — Choosing a comparison function.
