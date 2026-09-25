---
title: Improper integrals
order: 13
status: detailed
weeks: [7]
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

:::definition[Improper integral of type I]
(a) If $\int_a^t f(x)\,dx$ exists for every $t \ge a$, then $\displaystyle\int_a^{\infty} f(x)\,dx = \lim_{t \to \infty}\int_a^t f(x)\,dx$, provided the limit exists.
(b) Likewise $\displaystyle\int_{-\infty}^{b} f(x)\,dx = \lim_{t \to -\infty}\int_t^b f(x)\,dx$.
The integral is **convergent** if the limit exists (as a finite number) and **divergent** otherwise.
(c) If both $\int_a^{\infty} f$ and $\int_{-\infty}^{a} f$ converge, $\displaystyle\int_{-\infty}^{\infty} f(x)\,dx = \int_{-\infty}^{a} f(x)\,dx + \int_a^{\infty} f(x)\,dx$ for any $a$.
:::

::::example[The $p$-integral]
For which $p$ does $\displaystyle\int_1^{\infty}\frac{dx}{x^p}$ converge, and to what?

:::solution
For $p \ne 1$:

$$
\int_1^t x^{-p}\,dx = \frac{t^{1-p} - 1}{1 - p} .
$$

As $t \to \infty$, $t^{1-p} \to 0$ if $p > 1$ and $\to \infty$ if $p < 1$. For $p = 1$:
$\int_1^t dx/x = \ln t \to \infty$. So the integral **converges to $\dfrac{1}{p - 1}$ when
$p > 1$ and diverges when $p \le 1$.**
:::
::::

::::example[Both ends infinite]
Evaluate $\displaystyle\int_{-\infty}^{\infty}\frac{dx}{1 + x^2}$.

:::solution
Split at $0$ and take each limit separately:

$$
\lim_{t \to -\infty}\big[\tan^{-1}x\big]_t^0 + \lim_{t \to \infty}\big[\tan^{-1}x\big]_0^t = \frac{\pi}{2} + \frac{\pi}{2} = \pi .
$$

The total area under a curve that never touches the axis is finite.
:::
::::

```sim
id: calc-improper-p
controls:
  - {id: p, label: "Exponent p", min: 0.2, max: 3, step: 0.1, default: 2, decimals: 1}
  - {id: t, label: "Upper limit t", min: 1, max: 60, step: 1, default: 10, decimals: 0}
note: 'The area under 1/xᵖ from 1 to t. For p > 1 it levels off at 1/(p − 1) as t grows; for p ≤ 1 it keeps growing without bound, although the curve still goes to 0. Try p = 1: the area is ln t, which grows — just very slowly.'
```

```python
# ∫₁ᵗ x⁻ᵖ dx and its limit as t → ∞: converges to 1/(p − 1) for p > 1, diverges for p ≤ 1.
from math import log

def area(p, t):
    return log(t) if p == 1 else (t**(1 - p) - 1) / (1 - p)

for p in (2, 1, 0.5):                                    # the sim's default is p = 2, t = 10
    print(f'p = {p}:', *(f'{area(p, t):.4f}' for t in (10, 1000, 10**6)),
          f'→ {1/(p - 1):.4f}' if p > 1 else '→ ∞')
# Output:
#   p = 2: 0.9000 0.9990 1.0000 → 1.0000
#   p = 1: 2.3026 6.9078 13.8155 → ∞
#   p = 0.5: 4.3246 61.2456 1998.0000 → ∞
```

:::insight
$f(x) \to 0$ is *not* enough for convergence: $1/x \to 0$ but its
integral from $1$ diverges. The integrand must go to zero *fast enough* — faster than
$1/x$, which is what $p > 1$ says.
:::

:::caution
$\int_{-\infty}^{\infty} f$ is **not** $\lim_{t \to \infty}\int_{-t}^{t} f$. The symmetric limit of $\int_{-t}^t x\,dx$ is $0$, but $\int_0^{\infty} x\,dx$ diverges, so $\int_{-\infty}^{\infty} x\,dx$ diverges. The two halves must converge separately.
:::

## Type II: unbounded integrands

:::definition[Improper integral of type II]
(a) If $f$ is continuous on $[a, b)$ and discontinuous at $b$: $\displaystyle\int_a^b f(x)\,dx = \lim_{t \to b^-}\int_a^t f(x)\,dx$.
(b) If $f$ is continuous on $(a, b]$ and discontinuous at $a$: $\displaystyle\int_a^b f(x)\,dx = \lim_{t \to a^+}\int_t^b f(x)\,dx$.
Convergent if the limit exists, divergent otherwise.
(c) If the discontinuity is at an interior point $c$ and both $\int_a^c f$ and $\int_c^b f$ converge, $\displaystyle\int_a^b f = \int_a^c f + \int_c^b f$.
:::

::::example[Blow-up at an endpoint]
Decide whether $\displaystyle\int_0^1 \frac{dx}{\sqrt{x}}$ and $\displaystyle\int_0^1\frac{dx}{x}$ converge.

:::solution
$$
\int_0^1 \frac{dx}{\sqrt{x}} = \lim_{t \to 0^+}\big[2\sqrt{x}\big]_t^1 = 2 - 0 = 2
\qquad
\int_0^1\frac{dx}{x} = \lim_{t \to 0^+}\big[\ln x\big]_t^1 = 0 - (-\infty)
$$

The first converges, the second diverges. Near $0$ the $p$-integral behaves the *opposite*
way to near $\infty$: $\int_0^1 x^{-p}\,dx$ converges exactly when $p < 1$.
:::
::::

:::caution[The invisible discontinuity]
$\displaystyle\int_{-1}^{2}\frac{dx}{x^2}$ looks like an ordinary integral; applying Part II blindly gives $\big[-1/x\big]_{-1}^{2} = -\tfrac32$, a negative "area" for a positive function. The integrand is unbounded at $x = 0$; split there, and $\int_{-1}^{0} x^{-2}\,dx$ already diverges. **Always check the integrand for blow-ups inside the interval before evaluating.**
:::

## Convergence tests

When no antiderivative is available, compare with an integral whose behaviour is known.

:::theorem[Comparison test for integrals]
Suppose $f$ and $g$ are continuous with $f(x) \ge g(x) \ge 0$ for $x \ge a$.
(a) If $\int_a^{\infty} f(x)\,dx$ converges, so does $\int_a^{\infty} g(x)\,dx$.
(b) If $\int_a^{\infty} g(x)\,dx$ diverges, so does $\int_a^{\infty} f(x)\,dx$.
:::

Smaller than a convergent one converges; bigger than a divergent one diverges. The other
two combinations say nothing.

:::theorem[Limit comparison test for integrals]
If $f, g \ge 0$ are continuous on $[a, \infty)$ and

$$
\lim_{x \to \infty}\frac{f(x)}{g(x)} = L \quad\text{with } 0 < L < \infty ,
$$

then $\int_a^{\infty} f$ and $\int_a^{\infty} g$ either both converge or both diverge.
:::

::::example[Deciding without integrating]
Decide whether $\displaystyle\int_1^{\infty} e^{-x^2}\,dx$ and $\displaystyle\int_1^{\infty}\frac{dx}{\sqrt{x^2 + 1}}$ converge.

:::solution
For $x \ge 1$, $e^{-x^2} \le e^{-x}$, and $\int_1^{\infty} e^{-x}\,dx = e^{-1}$ converges, so the
first converges by comparison. (This is how the normal distribution gets a finite total
probability.) For the second, the ratio to $1/x$ tends to $1$ and $\int_1^{\infty} dx/x$
diverges, so it diverges by limit comparison.
:::
::::

:::equations
- $\displaystyle\int_a^{\infty} f = \lim_{t \to \infty}\int_a^t f$; $\quad\displaystyle\int_a^b f = \lim_{t \to b^-}\int_a^t f$ when $f$ blows up at $b$
- $\displaystyle\int_1^{\infty}\frac{dx}{x^p}$ converges iff $p > 1$; $\quad\displaystyle\int_0^1\frac{dx}{x^p}$ converges iff $p < 1$
- $0 \le g \le f$: $\int f$ converges $\Rightarrow$ $\int g$ converges; $\int g$ diverges $\Rightarrow$ $\int f$ diverges
:::

## Further reading

- [Paul's Online Notes — Improper Integrals](https://tutorial.math.lamar.edu/Classes/CalcII/ImproperIntegrals.aspx) — Both types with the $p$-integral worked out.
- [Paul's Online Notes — Comparison Test for Improper Integrals](https://tutorial.math.lamar.edu/Classes/CalcII/ImproperIntegralsCompTest.aspx) — Choosing a comparison function.
