---
title: The substitution rule
order: 6
status: detailed
notes: ["Lecture 6 handout — learning/Slides/Lecture6.pdf (Stewart 5.5: substitution for indefinite and definite integrals, symmetric functions)"]
weeks: [3]
textbook: "Stewart, Calculus: Early Transcendentals, 5.5"
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

> **Theorem (substitution rule).** If $u = g(x)$ is differentiable and $f$ is continuous on the range of $g$, then $\displaystyle\int f(g(x))\,g'(x)\,dx = \int f(u)\,du$.

In practice: set $u = g(x)$, compute $du = g'(x)\,dx$, rewrite the integral entirely in
$u$, integrate, and substitute back.

> **Example.** $\displaystyle\int 2x\cos(x^2)\,dx$. Let $u = x^2$, $du = 2x\,dx$: the integral is $\displaystyle\int \cos u\,du = \sin u + C = \sin(x^2) + C$. Check: $\frac{d}{dx}\sin(x^2) = 2x\cos(x^2)$ ✓.

> **Example — adjusting a constant.** $\displaystyle\int x\sqrt{1 + x^2}\,dx$. With $u = 1 + x^2$, $du = 2x\,dx$, so $x\,dx = \tfrac12 du$: $\displaystyle\int \tfrac12\sqrt{u}\,du = \tfrac12\cdot\tfrac23 u^{3/2} + C = \tfrac13(1 + x^2)^{3/2} + C$.

> **Example — $u$ in the numerator.** $\displaystyle\int \tan x\,dx = \int \frac{\sin x}{\cos x}\,dx$. Let $u = \cos x$, $du = -\sin x\,dx$: $\displaystyle -\int \frac{du}{u} = -\ln|u| + C = -\ln|\cos x| + C = \ln|\sec x| + C$.

> **Key insight.** Choose $u$ so that $du$ (up to a constant) is *visibly present* in the
> integrand. Good candidates: the inside of a composition, the base of a power, the
> denominator, the argument of a root. If after substituting there is still an $x$ left
> over that cannot be written in terms of $u$, the choice was wrong.

## Definite integrals

Two ways to finish a definite integral after substituting: go back to $x$ and use the
original limits, or — better — convert the limits to $u$ and never return.

> **Theorem (substitution for definite integrals).** If $g'$ is continuous on $[a, b]$ and $f$ is continuous on the range of $u = g(x)$, then $\displaystyle\int_a^b f(g(x))\,g'(x)\,dx = \int_{g(a)}^{g(b)} f(u)\,du$.

> **Example.** $\displaystyle\int_0^{b} 2x\cos(x^2)\,dx$ with $u = x^2$: the limits $x = 0,\ x = b$ become $u = 0,\ u = b^2$, so the integral is $\displaystyle\int_0^{b^2}\cos u\,du = \sin(b^2)$.

```sim
id: calc-substitution
controls:
  - {id: b, label: "Upper limit b", min: 0.2, max: 1.7, step: 0.02, default: 1.2, decimals: 2}
note: 'Left: the region under 2x cos(x²) from 0 to b. Right: the region under cos u from 0 to b². The shapes differ — the substitution stretches the axis — but the two areas are always equal, both being sin(b²).'
```

> **Caution.** After changing the limits, do **not** substitute back: $\int_0^{b^2}\cos u\,du$ is a
> number and the job is done. Mixing the two methods (new limits *and* back-substituting)
> gives nonsense.

## Integrals of symmetric functions

Suppose $f$ is continuous on $[-a, a]$.

- If $f$ is **even** ($f(-x) = f(x)$), then $\displaystyle\int_{-a}^{a} f(x)\,dx = 2\int_0^a f(x)\,dx$.
- If $f$ is **odd** ($f(-x) = -f(x)$), then $\displaystyle\int_{-a}^{a} f(x)\,dx = 0$.

Both follow from splitting at $0$ and substituting $u = -x$ in the left half. The odd
case is a free answer — the area to the left of the axis exactly cancels the area to the
right.

> **Example.** $\displaystyle\int_{-2}^{2} \frac{x^3 \sin x^2 + \tan x}{1 + x^4}\,dx = 0$: the numerator is odd, the denominator even, so the integrand is odd. No antiderivative is needed (and none exists in elementary terms).

**Equations**

- $\displaystyle\int f(g(x))\,g'(x)\,dx = \int f(u)\,du$, $\quad u = g(x),\ du = g'(x)\,dx$
- $\displaystyle\int_a^b f(g(x))\,g'(x)\,dx = \int_{g(a)}^{g(b)} f(u)\,du$
- even: $\displaystyle\int_{-a}^a f = 2\int_0^a f$; odd: $\displaystyle\int_{-a}^a f = 0$

## Further reading

- [Paul's Online Notes — Substitution Rule for Indefinite Integrals](https://tutorial.math.lamar.edu/Classes/CalcI/SubstitutionRuleIndefinite.aspx) — Many examples of choosing $u$, including the ones that look like they should not work.
- [Paul's Online Notes — Substitution Rule for Definite Integrals](https://tutorial.math.lamar.edu/Classes/CalcI/SubstitutionRuleDefinite.aspx) — Converting the limits, and why it saves work.
