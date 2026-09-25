---
title: Indefinite integrals and net change
order: 5
status: detailed
weeks: [3]
introduces: []
requires:
  - {concept: antiderivative, strength: hard}
  - {concept: fundamental-theorem-of-calculus, strength: hard}
reinforces:
  - {concept: antiderivative, perspective: "the indefinite-integral notation, the standard table, and the net change theorem"}
---

Now that antiderivatives evaluate definite integrals, they get integral notation of
their own. The lecture fixes the notation, restates the table in it, and turns Part II of
the fundamental theorem into a physical statement: the integral of a rate of change is
the net change.

## The indefinite integral

:::definition[Indefinite integral]
The **indefinite integral** of $f$ is its general antiderivative:

$$
\int f(x)\,dx = F(x) + C \qquad\text{where } F'(x) = f(x).
$$
:::

:::caution[Two meanings of $\int$]
$\int_a^b f(x)\,dx$ is a *number*; $\int f(x)\,dx$ is a *family of functions*. They are
linked by Part II, where the $C$ cancels in the subtraction:

$$
\int_a^b f(x)\,dx = \Big[\int f(x)\,dx\Big]_a^b .
$$
:::

### The table, in integral notation

:::equations
- $\displaystyle\int x^n\,dx = \frac{x^{n+1}}{n+1} + C\ (n \ne -1)$, $\quad\displaystyle\int \frac{dx}{x} = \ln|x| + C$
- $\displaystyle\int e^x\,dx = e^x + C$, $\quad\displaystyle\int a^x\,dx = \frac{a^x}{\ln a} + C$
- $\displaystyle\int \sin x\,dx = -\cos x + C$, $\quad\displaystyle\int \cos x\,dx = \sin x + C$
- $\displaystyle\int \sec^2 x\,dx = \tan x + C$, $\quad\displaystyle\int \csc^2 x\,dx = -\cot x + C$
- $\displaystyle\int \sec x\tan x\,dx = \sec x + C$, $\quad\displaystyle\int \csc x\cot x\,dx = -\csc x + C$
- $\displaystyle\int \frac{dx}{\sqrt{1 - x^2}} = \sin^{-1} x + C$, $\quad\displaystyle\int \frac{dx}{1 + x^2} = \tan^{-1} x + C$
:::

### Integrating rules

- $\displaystyle\int c f(x)\,dx = c\int f(x)\,dx$
- $\displaystyle\int \big(f(x) \pm g(x)\big)\,dx = \int f(x)\,dx \pm \int g(x)\,dx$

::::example[Straight from the table]
Find $\displaystyle\int \left(2\cos x - \frac{3}{1 + x^2} + \sqrt{x}\right)dx$.

:::solution
Rewrite the root as a power, $\sqrt{x} = x^{1/2}$, then integrate term by term:

$$
\int \left(2\cos x - \frac{3}{1 + x^2} + x^{1/2}\right)dx = 2\sin x - 3\tan^{-1}x + \frac{2}{3}x^{3/2} + C .
$$
:::
::::

::::example[Simplify, then integrate]
Evaluate $\displaystyle\int_1^4 \frac{x^2 + 1}{\sqrt{x}}\,dx$.

:::solution
Split the quotient into powers first:

$$
\int_1^4 \big(x^{3/2} + x^{-1/2}\big)dx = \left[\frac{2}{5}x^{5/2} + 2x^{1/2}\right]_1^4 = \left(\frac{64}{5} + 4\right) - \left(\frac{2}{5} + 2\right) = \frac{72}{5} .
$$
:::
::::

## The net change theorem

:::theorem[Net change]
The integral of a rate of change is the net change:

$$
\int_a^b F'(x)\,dx = F(b) - F(a) .
$$
:::

It is Part II of the fundamental theorem, read as physics. Whatever $F$ measures —
position, volume, population, cost — integrating its rate over $[a, b]$ gives how much it
changed, not what it is.

For a particle on a line with velocity $v(t) = s'(t)$, the theorem gives two different
quantities:

- $\displaystyle\int_{t_1}^{t_2} v(t)\,dt = s(t_2) - s(t_1)$ is the **displacement**: where it ended relative to where it started.
- $\displaystyle\int_{t_1}^{t_2} |v(t)|\,dt$ is the **total distance** travelled: backward motion counts positively too.

::::example[Displacement versus distance]
A particle moves with velocity $v(t) = t^2 - t - 6$ for $1 \le t \le 4$. Find its
displacement and the total distance it travels.

:::solution
Displacement:

$$
\int_1^4 v\,dt = \left[\frac{t^3}{3} - \frac{t^2}{2} - 6t\right]_1^4 = -\frac{9}{2} .
$$

Since $v(t) = (t - 3)(t + 2)$, the velocity is negative on $[1, 3]$ and positive on $[3, 4]$,
so split there for the distance:

$$
-\int_1^3 v\,dt + \int_3^4 v\,dt = \frac{22}{3} + \frac{17}{6} = \frac{61}{6} .
$$
:::
::::

```sim
id: calc-net-change
controls:
  - {id: T, label: "End time T", min: 0, max: 6.28, step: 0.02, default: 4, decimals: 2}
note: 'Velocity v(t) = 3 sin t (top, shaded by sign) and position s(t) = ∫₀ᵗ v = 3(1 − cos t) (bottom). Displacement is the signed area and equals s(T); distance keeps adding after the particle turns around at t = π.'
```

```python
# Velocity v(t) = 3 sin t: displacement is the signed integral ∫₀ᵀ v dt = s(T) − s(0),
# distance is ∫₀ᵀ |v| dt and keeps growing after the particle turns back at t = π.
from math import sin, cos, pi

s = lambda t: 3*(1 - cos(t))                             # position with s(0) = 0

def distance(T):
    if T <= pi:
        return s(T)
    return s(pi) + (s(pi) - s(T))                        # out to 6, then back by s(π) − s(T)

for T in (2, 4, 2*pi):                                   # the sim's default is T = 4
    print(f'T = {T:.3f}: displacement {s(T):.3f}, distance {distance(T):.3f}')
# Output:
#   T = 2.000: displacement 4.248, distance 4.248
#   T = 4.000: displacement 4.961, distance 7.039
#   T = 6.283: displacement 0.000, distance 12.000
```

:::insight
"Net" is the whole point. The velocity graph's signed area tells you
the *displacement*; to get the distance you must split the interval where $v$ changes
sign. The same split will be needed for the area between curves (lecture 8).
:::

:::note
Other readings of the same theorem: $\int_a^b V'(t)\,dt$ is the change in volume
of water in a tank; $\int_{x_1}^{x_2} \rho(x)\,dx$ is the mass of a rod segment when
$\rho$ is the linear density; $\int_a^b C'(x)\,dx$ is the increase in cost from producing
$a$ to $b$ units when $C'$ is the marginal cost.
:::

## Further reading

- [Paul's Online Notes — Computing Indefinite Integrals](https://tutorial.math.lamar.edu/Classes/CalcI/ComputingIndefiniteIntegrals.aspx) — Table and rules with many worked integrals.
- [Paul's Online Notes — Computing Definite Integrals](https://tutorial.math.lamar.edu/Classes/CalcI/ComputingDefiniteIntegrals.aspx) — Includes the displacement / distance distinction.
