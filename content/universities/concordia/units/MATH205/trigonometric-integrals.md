---
title: Trigonometric integrals
order: 9
status: detailed
weeks: [5]
introduces: [trigonometric-integrals]
requires:
  - {concept: substitution-rule, strength: hard}
  - {concept: trigonometric-functions, strength: hard}
reinforces: []
---

Products of powers of trigonometric functions come up on their own and, more
importantly, as the leftovers of trigonometric substitution (next lecture). There is no
new theorem here — only substitution plus two identities, organised into cases by
which exponent is odd.

## Powers of sine and cosine: $\int \sin^m x\,\cos^n x\,dx$

The identity is $\sin^2 x + \cos^2 x = 1$. The strategy is always the same: **peel off one
factor to serve as $du$, convert the rest with the identity.**

**Case $n = 2k + 1$ odd.** Save one $\cos x$, write the remaining even power as
$(1 - \sin^2 x)^k$, and substitute $u = \sin x$, $du = \cos x\,dx$:
$$\int \sin^m x\,\cos^{2k+1} x\,dx = \int \sin^m x\,(1 - \sin^2 x)^k \cos x\,dx = \int u^m (1 - u^2)^k\,du .$$

**Case $m = 2k + 1$ odd.** Save one $\sin x$, write the rest as $(1 - \cos^2 x)^k$, substitute
$u = \cos x$, $du = -\sin x\,dx$:
$$\int \sin^{2k+1} x\,\cos^n x\,dx = \int (1 - \cos^2 x)^k \cos^n x\,\sin x\,dx = -\int (1 - u^2)^k u^n\,du .$$

**Case both even, $m = 2k$, $n = 2l$.** No factor to peel; use the half-angle formulas
$\sin^2 x = \tfrac12(1 - \cos 2x)$, $\cos^2 x = \tfrac12(1 + \cos 2x)$:
$$\int \sin^{2k} x\,\cos^{2l} x\,dx = \frac{1}{2^{k+l}}\int (1 - \cos 2x)^k (1 + \cos 2x)^l\,dx ,$$
then expand and repeat on any even powers of $\cos 2x$.

::::example[An odd power of cosine]
Find $\displaystyle\int \sin^2 x\cos^3 x\,dx$.

:::solution
$n = 3$ is odd: save one $\cos x$ and substitute $u = \sin x$:

$$
\int \sin^2 x\,(1 - \sin^2 x)\cos x\,dx = \int (u^2 - u^4)\,du = \frac{\sin^3 x}{3} - \frac{\sin^5 x}{5} + C .
$$
:::
::::

::::example[Both powers even]
Find $\displaystyle\int \sin^2 x\,dx$.

:::solution
Both exponents are even (here $n = 0$), so use the half-angle formula:

$$
\int \frac{1 - \cos 2x}{2}\,dx = \frac{x}{2} - \frac{\sin 2x}{4} + C .
$$
:::
::::

```sim
id: calc-trig-powers
controls:
  - {id: m, label: "Power of sin, m", min: 0, max: 6, step: 1, default: 3, decimals: 0}
  - {id: n, label: "Power of cos, n", min: 0, max: 6, step: 1, default: 2, decimals: 0}
note: 'The integrand sinᵐx cosⁿx on [0, π] with its integral. The title names the case: n odd → u = sin x, m odd → u = cos x, both even → half-angle formulas. When n is odd the integral over [0, π] vanishes by symmetry — the substitution u = sin x runs from 0 to 0.'
```

```python
# ∫₀^π sinᵐx cosⁿx dx, with the substitution the powers call for.
import sympy as sp

x = sp.symbols('x')
def case(m, n):
    return 'n odd: u = sin x' if n % 2 else 'm odd: u = cos x' if m % 2 else 'both even: half-angle'

for m, n in ((3, 2), (2, 3), (2, 2)):                    # the sim's default is m = 3, n = 2
    I = sp.integrate(sp.sin(x)**m * sp.cos(x)**n, (x, 0, sp.pi))
    print(f'm = {m}, n = {n}: {I}   ({case(m, n)})')
# Output:
#   m = 3, n = 2: 4/15   (m odd: u = cos x)
#   m = 2, n = 3: 0   (n odd: u = sin x)
#   m = 2, n = 2: pi/8   (both even: half-angle)
```

## Powers of tangent and secant: $\int \tan^m x\,\sec^n x\,dx$

The identity is $1 + \tan^2 x = \sec^2 x$, and the two derivatives are
$\frac{d}{dx}\tan x = \sec^2 x$ and $\frac{d}{dx}\sec x = \sec x\tan x$.

**Case $n = 2k$ even.** Save $\sec^2 x$ for $du$, convert the rest to tangents, substitute
$u = \tan x$:
$$\int \tan^m x\,\sec^{2k} x\,dx = \int \tan^m x\,(1 + \tan^2 x)^{k-1}\sec^2 x\,dx = \int u^m (1 + u^2)^{k-1}\,du .$$

**Case $m = 2k + 1$ odd.** Save $\sec x\tan x$ for $du$, convert the remaining even power
of tangent to $(\sec^2 x - 1)^k$, substitute $u = \sec x$:
$$\int \tan^{2k+1} x\,\sec^n x\,dx = \int (\sec^2 x - 1)^k \sec^{n-1} x\,\sec x\tan x\,dx = \int (u^2 - 1)^k u^{n-1}\,du .$$

:::caution
$m$ even and $n$ odd (for instance $\int \sec^3 x\,dx$ or $\int \tan^2 x\sec x\,dx$) fits neither case. Those need integration by parts, plus the standard
$\int \sec x\,dx = \ln|\sec x + \tan x| + C$ and $\int \tan x\,dx = \ln|\sec x| + C$.
:::

::::example[An even power of secant]
Find $\displaystyle\int \tan^3 x\,\sec^4 x\,dx$.

:::solution
$n = 4$ is even: save $\sec^2 x$ and substitute $u = \tan x$:

$$
\int \tan^3 x\,(1 + \tan^2 x)\sec^2 x\,dx = \int (u^3 + u^5)\,du = \frac{\tan^4 x}{4} + \frac{\tan^6 x}{6} + C .
$$
:::
::::

## Products with different frequencies

For $\int \sin mx\cos nx\,dx$, $\int \sin mx\sin nx\,dx$, $\int \cos mx\cos nx\,dx$ no
substitution works; use the product-to-sum identities to turn the product into a sum of
single sines and cosines:

:::equations
- $\sin mx\cos nx = \tfrac12\big[\sin(m - n)x + \sin(m + n)x\big]$
- $\sin mx\sin nx = \tfrac12\big[\cos(m - n)x - \cos(m + n)x\big]$
- $\cos mx\cos nx = \tfrac12\big[\cos(m - n)x + \cos(m + n)x\big]$
:::

::::example[Different frequencies]
Find $\displaystyle\int \sin 4x\cos 5x\,dx$.

:::solution
Product to sum, with $m = 4$, $n = 5$:

$$
\frac12\int\big[\sin(-x) + \sin 9x\big]dx = \frac12\Big[\cos x - \frac{\cos 9x}{9}\Big] + C .
$$
:::
::::

:::insight
Over a full period these products integrate to zero unless $m = n$ —
the orthogonality that Fourier series are built on.
:::

## Further reading

- [Paul's Online Notes — Integrals Involving Trig Functions](https://tutorial.math.lamar.edu/Classes/CalcII/IntegralsWithTrig.aspx) — All the cases with worked examples, including the awkward $\sec^3 x$.
