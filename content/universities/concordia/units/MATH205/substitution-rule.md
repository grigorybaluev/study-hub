---
title: The substitution rule
order: 6
status: detailed
weeks: [3]
introduces: [substitution-rule]
requires:
  - {concept: antiderivative, strength: hard}
  - {concept: chain-rule, strength: hard}
  - {concept: fundamental-theorem-of-calculus, strength: hard}
reinforces: []
---

The table of antiderivatives covers only a handful of shapes. The first and most-used
way to reach the table from something messier is to *rename the inside function*. The
rule is the chain rule read backwards, and for definite integrals it comes with a rule
for the limits.

## Indefinite integrals

The chain rule says $\dfrac{d}{dx}F(g(x)) = F'(g(x))\,g'(x)$. Read right to left, with
$f = F'$: any integrand of the shape "$f$ of something, times the derivative of that
something" has antiderivative $F(\text{something})$.

:::theorem[Substitution rule]
If $u = g(x)$ is differentiable and $f$ is continuous on the range of $g$, then

$$
\int f(g(x))\,g'(x)\,dx = \int f(u)\,du .
$$
:::

In practice: set $u = g(x)$, compute $du = g'(x)\,dx$, rewrite the integral entirely in
$u$, integrate, and substitute back.

::::example[The inside of a composition]
Find $\displaystyle\int 2x\cos(x^2)\,dx$.

:::solution
Let $u = x^2$, $du = 2x\,dx$:

$$
\int \cos u\,du = \sin u + C = \sin(x^2) + C .
$$

Check: $\frac{d}{dx}\sin(x^2) = 2x\cos(x^2)$ ✓.
:::
::::

::::example[Adjusting a constant]
Find $\displaystyle\int x\sqrt{1 + x^2}\,dx$.

:::solution
With $u = 1 + x^2$, $du = 2x\,dx$, so $x\,dx = \tfrac12 du$:

$$
\int \tfrac12\sqrt{u}\,du = \tfrac12\cdot\tfrac23 u^{3/2} + C = \tfrac13(1 + x^2)^{3/2} + C .
$$
:::
::::

::::example[$u$ in the denominator]
Find $\displaystyle\int \tan x\,dx$.

:::solution
Write $\tan x = \dfrac{\sin x}{\cos x}$ and let $u = \cos x$, $du = -\sin x\,dx$:

$$
-\int \frac{du}{u} = -\ln|u| + C = -\ln|\cos x| + C = \ln|\sec x| + C .
$$
:::
::::

:::insight
Choose $u$ so that $du$ (up to a constant) is *visibly present* in the integrand. Good
candidates: the inside of a composition, the base of a power, the denominator, the argument
of a root. If after substituting there is still an $x$ left over that cannot be written in
terms of $u$, the choice was wrong.
:::

## Definite integrals

Two ways to finish a definite integral after substituting: go back to $x$ and use the
original limits, or — better — convert the limits to $u$ and never return.

:::theorem[Substitution for definite integrals]
If $g'$ is continuous on $[a, b]$ and $f$ is continuous on the range of $u = g(x)$, then

$$
\int_a^b f(g(x))\,g'(x)\,dx = \int_{g(a)}^{g(b)} f(u)\,du .
$$
:::

::::example[New limits, no going back]
Evaluate $\displaystyle\int_0^{b} 2x\cos(x^2)\,dx$.

:::solution
With $u = x^2$ the limits $x = 0,\ x = b$ become $u = 0,\ u = b^2$:

$$
\int_0^{b^2}\cos u\,du = \sin(b^2) .
$$
:::
::::

```sim
id: calc-substitution
controls:
  - {id: b, label: "Upper limit b", min: 0.2, max: 1.7, step: 0.02, default: 1.2, decimals: 2}
note: 'Left: the region under 2x cos(x²) from 0 to b. Right: the region under cos u from 0 to b². The shapes differ — the substitution stretches the axis — but the two areas are always equal, both being sin(b²).'
```

```python
# Substitution u = x²: the area under 2x cos(x²) on [0, b] equals the area under
# cos u on [0, b²]; both are sin(b²).
import sympy as sp

x, u, b = sp.symbols('x u b', positive=True)
lhs = sp.integrate(2*x*sp.cos(x**2), (x, 0, b))
rhs = sp.integrate(sp.cos(u), (u, 0, b**2))
print(lhs, '=', rhs)
print(round(float(lhs.subs(b, 1.2)), 4))                 # the sim's default b = 1.2: sin(1.44)
# Output:
#   sin(b**2) = sin(b**2)
#   0.9915
```

:::caution
After changing the limits, do **not** substitute back: $\int_0^{b^2}\cos u\,du$ is a
number and the job is done. Mixing the two methods (new limits *and* back-substituting)
gives nonsense.
:::

## Integrals of symmetric functions

Suppose $f$ is continuous on $[-a, a]$.

::::proposition[Symmetric functions]
- If $f$ is **even** ($f(-x) = f(x)$), then $\displaystyle\int_{-a}^{a} f(x)\,dx = 2\int_0^a f(x)\,dx$.
- If $f$ is **odd** ($f(-x) = -f(x)$), then $\displaystyle\int_{-a}^{a} f(x)\,dx = 0$.

:::proof
Split at $0$ and substitute $u = -x$ in the left half: $\int_{-a}^0 f(x)\,dx = \int_0^a f(-u)\,du$,
which is $\int_0^a f$ for even $f$ and $-\int_0^a f$ for odd $f$.
:::
::::

The odd case is a free answer — the area to the left of the axis exactly cancels the area
to the right.

::::example[An odd integrand]
Evaluate $\displaystyle\int_{-2}^{2} \frac{x^3 \sin x^2 + \tan x}{1 + x^4}\,dx$.

:::solution
The numerator is odd and the denominator even, so the integrand is odd and the integral is
$0$. No antiderivative is needed (and none exists in elementary terms).
:::
::::

:::equations
- $\displaystyle\int f(g(x))\,g'(x)\,dx = \int f(u)\,du$, $\quad u = g(x),\ du = g'(x)\,dx$
- $\displaystyle\int_a^b f(g(x))\,g'(x)\,dx = \int_{g(a)}^{g(b)} f(u)\,du$
- even: $\displaystyle\int_{-a}^a f = 2\int_0^a f$; odd: $\displaystyle\int_{-a}^a f = 0$
:::

## Further reading

- [Paul's Online Notes — Substitution Rule for Indefinite Integrals](https://tutorial.math.lamar.edu/Classes/CalcI/SubstitutionRuleIndefinite.aspx) — Many examples of choosing $u$, including the ones that look like they should not work.
- [Paul's Online Notes — Substitution Rule for Definite Integrals](https://tutorial.math.lamar.edu/Classes/CalcI/SubstitutionRuleDefinite.aspx) — Converting the limits, and why it saves work.
