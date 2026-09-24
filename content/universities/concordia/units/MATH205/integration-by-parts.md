---
title: Integration by parts
order: 7
status: detailed
notes: ["Lecture 7 handout — learning/Slides/Lecture7.pdf (Stewart 7.1: from the product rule, ∫u dv = uv − ∫v du, definite version)"]
weeks: [4]
textbook: "Stewart, Calculus: Early Transcendentals, 7.1"
introduces: [integration-by-parts]
requires:
  - {concept: antiderivative, strength: hard}
  - {concept: derivative, strength: hard}
  - {concept: fundamental-theorem-of-calculus, strength: soft}
reinforces: []
---

Substitution undoes the chain rule. Integration by parts undoes the **product rule**,
and it is the tool for integrands that are products of two unrelated pieces — a
polynomial times an exponential, $x$ times a logarithm, an exponential times a sine.

## From the product rule

For differentiable $f$ and $g$,
$$\frac{d}{dx}\big(f(x)\,g(x)\big) = f'(x)\,g(x) + f(x)\,g'(x).$$
Integrate both sides:
$$\int \big(f'(x)\,g(x) + f(x)\,g'(x)\big)\,dx = f(x)\,g(x),$$
and move one term across:
$$\int f(x)\,g'(x)\,dx = f(x)\,g(x) - \int g(x)\,f'(x)\,dx .$$

## The formula

With $u = f(x)$, $v = g(x)$, $du = f'(x)\,dx$, $dv = g'(x)\,dx$ this is the version
everyone remembers:

> **Theorem (integration by parts).** $\displaystyle\int u\,dv = u\,v - \int v\,du$.

For a definite integral the boundary term is evaluated at the limits:
$$\int_a^b f(x)\,g'(x)\,dx = \Big[f(x)\,g(x)\Big]_a^b - \int_a^b g(x)\,f'(x)\,dx .$$

> **Key insight.** The formula trades $\int u\,dv$ for $\int v\,du$. It is only useful if the
> new integral is easier: choose $u$ as the factor that gets *simpler* when
> differentiated (a power of $x$, $\ln x$, an inverse trig function) and $dv$ as the
> factor you can *integrate* (an exponential, $\sin$, $\cos$, a power of $x$).

```sim
id: calc-parts-area
controls:
  - {id: u2, label: "Upper corner u₂", min: 0.6, max: 2, step: 0.02, default: 1.5, decimals: 2}
note: 'The curve v = u² between u₁ = 0.5 and u₂. The green region under it is ∫v du; the blue region to its left is ∫u dv. Together they fill the difference of two rectangles, u₂v₂ − u₁v₁, which is the boundary term of the formula.'
```

```python
# Integration by parts as areas, for v = u² from u₁ = 0.5 to u₂:
# ∫v du + ∫u dv = u₂v₂ − u₁v₁ (the difference of the two rectangles).
from fractions import Fraction as F

u1, u2 = F(1, 2), F(3, 2)                                # the sim's default u₂ = 1.5
v = lambda u: u**2
A = (u2**3 - u1**3) / 3                                  # ∫ v du = ∫ u² du
B = 2 * (u2**3 - u1**3) / 3                              # ∫ u dv = ∫ u · 2u du
print(A, '+', B, '=', A + B)
print('u2 v2 - u1 v1 =', u2*v(u2) - u1*v(u1))
# Output:
#   13/12 + 13/6 = 13/4
#   u2 v2 - u1 v1 = 13/4
```

> **Example.** $\displaystyle\int x e^x\,dx$. Take $u = x$, $dv = e^x\,dx$; then $du = dx$, $v = e^x$:
> $\displaystyle\int x e^x\,dx = x e^x - \int e^x\,dx = x e^x - e^x + C$.
> The other choice ($u = e^x$, $dv = x\,dx$) produces $\int \tfrac{x^2}{2} e^x\,dx$ — worse.

> **Example — $\ln$ has no obvious $dv$.** $\displaystyle\int \ln x\,dx$: take $u = \ln x$ and $dv = dx$. Then $du = dx/x$, $v = x$, and $\displaystyle\int \ln x\,dx = x\ln x - \int x\cdot\frac{dx}{x} = x\ln x - x + C$. The same trick handles $\int \tan^{-1}x\,dx$ and $\int \sin^{-1}x\,dx$.

> **Example — twice, then solve.** $I = \displaystyle\int e^x\cos x\,dx$. With $u = e^x$, $dv = \cos x\,dx$: $I = e^x\sin x - \int e^x\sin x\,dx$. Apply parts again to the new integral with $u = e^x$, $dv = \sin x\,dx$: $\int e^x\sin x\,dx = -e^x\cos x + \int e^x\cos x\,dx = -e^x\cos x + I$. Hence $I = e^x\sin x + e^x\cos x - I$, so $I = \tfrac12 e^x(\sin x + \cos x) + C$.
> Keep the *same* kind of $u$ both times, or the second step just undoes the first.

> **Example — definite.** $\displaystyle\int_0^{1} x e^{-x}\,dx = \Big[-x e^{-x}\Big]_0^1 + \int_0^1 e^{-x}\,dx = -e^{-1} + \Big[-e^{-x}\Big]_0^1 = -e^{-1} - e^{-1} + 1 = 1 - \frac{2}{e}$.

> **Note — reduction formulas.** Parts applied once to $\int x^n e^x\,dx$ gives
> $x^n e^x - n\int x^{n-1}e^x\,dx$: the power drops by one each round, so $n$ rounds
> finish the job. The same idea yields $\int \sin^n x\,dx = -\tfrac1n \sin^{n-1}x\cos x + \tfrac{n-1}{n}\int \sin^{n-2}x\,dx$, used in the next lecture.

**Equations**

- $\displaystyle\int u\,dv = uv - \int v\,du$
- $\displaystyle\int_a^b f\,g'\,dx = \big[f g\big]_a^b - \int_a^b g\,f'\,dx$
- $\displaystyle\int \ln x\,dx = x\ln x - x + C$, $\quad\displaystyle\int x e^x\,dx = (x - 1)e^x + C$

## Further reading

- [Paul's Online Notes — Integration by Parts](https://tutorial.math.lamar.edu/Classes/CalcII/IntegrationByParts.aspx) — Choosing $u$ and $dv$, the "apply twice and solve" pattern, and the tabular shortcut.
