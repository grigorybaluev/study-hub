---
title: Polar coordinates and polar curves
order: 3
status: detailed
weeks: [3]
introduces: [polar-coordinates]
requires:
  - {concept: trigonometric-functions, strength: hard}
  - {concept: parametric-curve, strength: hard}
  - {concept: derivative, strength: hard}
  - {concept: integral, strength: hard}
reinforces:
  - {concept: arc-length, perspective: "of a polar curve, L = ∫ √(r² + r′²) dθ"}
---

A second way to name the points of the plane: by how far they are from a fixed point and in
which direction. Curves that are awkward as $y = F(x)$ — circles about the origin, spirals —
become one-line equations $r = f(\theta)$, and the calculus of parametric curves (slopes and
lengths) carries over with $\theta$ as the parameter.

## Polar coordinates

### The pole, the polar axis and $(r, \theta)$

:::definition[Polar coordinates]
Fix a point $O$, the **pole**, and a ray from it, the **polar axis** (drawn along the positive
$x$-axis). A point $P$ has **polar coordinates** $(r, \theta)$ where $r$ is the directed distance
from $O$ to $P$ and $\theta$ is the angle from the polar axis to the segment $OP$.

- $\theta > 0$ is measured counter-clockwise, $\theta < 0$ clockwise.
- The pole is $(0, \theta)$ for **every** $\theta$.
- A negative $r$ means "go $|r|$ the other way": $(-r, \theta)$ is the point opposite $(r, \theta)$
  through the pole.
:::

Unlike Cartesian coordinates, one point has infinitely many polar names.

::::proposition[Many names for one point]
For every integer $n$,

$$
(r, \theta) = (r, \theta + 2n\pi) = \big(-r, \theta + (2n + 1)\pi\big).
$$

:::proof
Adding a full turn $2\pi$ to the angle points the same way. Adding $\pi$ points the opposite
way, and changing the sign of $r$ reverses the direction once more, back to the same point.
:::
::::

::::example[Equivalent pairs]
Give two other polar names of $P(2, \pi/4)$, and locate $Q(2, 5\pi/4)$, the polar point
$(4, \pi)$, and the Cartesian point $(0, -2)$ in polar form.

:::solution
$P(2, \tfrac{\pi}{4}) = (2, \tfrac{\pi}{4} + 2\pi) = (2, \tfrac{9\pi}{4}) = (-2, \tfrac{5\pi}{4})$.

$Q(2, \tfrac{5\pi}{4})$ is half a turn further round, so it is $P$'s mirror through the pole:
$Q = (-2, \tfrac{\pi}{4})$.

$(4, \pi)$ lies on the negative $x$-axis at distance 4 — the Cartesian point $(-4, 0)$, also
written $(4, -\pi)$ or $(-4, 0)$ in polar form.

$(0, -2)$ is 2 units down: $r = 2$, $\theta = -\tfrac{\pi}{2}$, or equivalently
$(2, \tfrac{3\pi}{2})$ and $(-2, \tfrac{\pi}{2})$.
:::
::::

```sim
id: polar-point
controls:
  - {id: r, label: "r", min: -4, max: 4, step: 0.05, default: 2, decimals: 2}
  - {id: th, label: "θ (× π)", min: -2, max: 2, step: 0.0833333, default: 0.25, decimals: 2}
note: 'The dashed ray is the direction θ; the green segment is the distance |r|. Make r negative and the point jumps to the opposite side of the pole, along the same line. The title lists two other names of the same point: (−r, θ + π) and (r, θ + 2π).'
```

```python
# One point, many polar names: (r, θ), (r, θ + 2π) and (−r, θ + π) all land on the same (x, y).
from math import cos, sin, pi, hypot, atan2

def to_xy(r, th):
    return (round(r * cos(th), 3) + 0.0, round(r * sin(th), 3) + 0.0)

r, th = 2, pi / 4                                    # the sim's default point
for name, (rr, tt) in {"(r, θ)": (r, th), "(r, θ + 2π)": (r, th + 2 * pi), "(−r, θ + π)": (-r, th + pi)}.items():
    print(f"{name:12} -> {to_xy(rr, tt)}")

print("(−3, −π/4) ->", to_xy(-3, -pi / 4))           # second quadrant: (−3√2/2, 3√2/2)
x, y = -1, -2                                        # Cartesian to polar, third quadrant
print("(−1, −2) -> r =", round(hypot(x, y), 4), " θ =", round(atan2(y, x), 4), "(atan2 picks the quadrant)")
# Output:
#   (r, θ)       -> (1.414, 1.414)
#   (r, θ + 2π)  -> (1.414, 1.414)
#   (−r, θ + π)  -> (1.414, 1.414)
#   (−3, −π/4) -> (-2.121, 2.121)
#   (−1, −2) -> r = 2.2361  θ = -2.0344 (atan2 picks the quadrant)
```

:::insight
A polar name is an instruction — turn by $\theta$, then walk $r$ (backwards if $r < 0$). Many
instructions reach the same point, which is why solving polar equations needs care: two
curves can meet at a point where their equations use different names for it.
:::

## Converting between polar and Cartesian

::::proposition[Polar to Cartesian]
For every $r$ and $\theta$,

$$
x = r\cos\theta \qquad y = r\sin\theta .
$$

:::proof
For $r > 0$, drop a perpendicular from $P$ to the polar axis: the right triangle has hypotenuse
$r$, angle $\theta$, adjacent side $x$ and opposite side $y$. For $r < 0$ the point is
$(|r|, \theta + \pi)$, and $|r|\cos(\theta + \pi) = -|r|\cos\theta = r\cos\theta$ (likewise for sine).
:::
::::

:::proposition[Cartesian to polar]
$$
r^2 = x^2 + y^2 \qquad \tan\theta = \frac{y}{x}\ (x \neq 0)
$$

With $r = \sqrt{x^2 + y^2} \ge 0$ the angle is $\theta = \tan^{-1}(y/x) + n\pi$: $n = 0$ when $x > 0$
(first or fourth quadrant, where $\tan^{-1}$ lands), $n = 1$ when $x < 0$.
:::

:::caution
$\tan^{-1}$ only returns angles in $(-\tfrac{\pi}{2}, \tfrac{\pi}{2})$ — the right half-plane. For
a point with $x < 0$, add $\pi$ (or keep the angle and make $r$ negative). Always check the
quadrant against a sketch.
:::

::::example[Polar to Cartesian]
Find the Cartesian coordinates of $(r, \theta) = (-3, -\tfrac{\pi}{4})$.

:::solution
$$
x = -3\cos\left(-\tfrac{\pi}{4}\right) = -\tfrac{3\sqrt2}{2} \qquad y = -3\sin\left(-\tfrac{\pi}{4}\right) = \tfrac{3\sqrt2}{2}
$$

The ray $\theta = -\tfrac{\pi}{4}$ points into the fourth quadrant; $r < 0$ sends the point to
the opposite, second quadrant.
:::
::::

::::example[Cartesian to polar]
Find polar coordinates of the Cartesian points $(1, 2)$ and $(-1, -2)$.

:::solution
Both have $r = \sqrt{1 + 4} = \sqrt5$ and $\tan\theta = 2$.

$(1, 2)$ is in the first quadrant: $(\sqrt5, \tan^{-1}2)$.

$(-1, -2)$ is in the third quadrant, so add $\pi$: $(\sqrt5, \tan^{-1}2 + \pi)$ — or keep
the angle and flip the sign, $(-\sqrt5, \tan^{-1}2)$.
:::
::::

:::equations
- $x = r\cos\theta$, $y = r\sin\theta$ — valid for every $r$, including negative.
- $r^2 = x^2 + y^2$, $\tan\theta = y/x$ — then fix the quadrant.
- $(r, \theta) = (r, \theta + 2n\pi) = (-r, \theta + (2n+1)\pi)$.
:::

## Polar curves

:::definition[Polar curve]
The **polar curve** $r = f(\theta)$, or more generally $F(r, \theta) = 0$, is the set of points
that have *at least one* polar name $(r, \theta)$ satisfying the equation.
:::

Any Cartesian curve $y = F(x)$ or $F(x, y) = 0$ becomes a polar curve by substituting
$x = r\cos\theta$, $y = r\sin\theta$; going back, look for $r\cos\theta$, $r\sin\theta$ and $r^2$ in
the polar equation (multiplying through by $r$ often helps).

::::example[Changing the description]
Write $y^2 = 4x + 1$ in polar form, and identify the polar curves $r^2\cos 2\theta = 1$ and
$r = \dfrac{5}{2\cos\theta + 3\sin\theta}$.

:::solution
Substituting, $y^2 = 4x + 1$ becomes $(r\sin\theta)^2 = 4r\cos\theta + 1$.

With $\cos 2\theta = \cos^2\theta - \sin^2\theta$:

$$
r^2\cos 2\theta = (r\cos\theta)^2 - (r\sin\theta)^2 = x^2 - y^2 = 1 ,
$$

a hyperbola.

Clearing the denominator, $2r\cos\theta + 3r\sin\theta = 5$, i.e. $2x + 3y = 5$ — a line.
:::
::::

### The two simplest curves

::::proposition[Lines through the pole and circles about it]
1. $\theta = k$ (a constant) is the line through the pole making angle $k$ with the polar axis:
   $y = x\tan k$ (or $x = 0$ when $k = \tfrac{\pi}{2}$).
2. $r = a$ (a constant) is the circle about the pole of radius $|a|$: $x^2 + y^2 = a^2$.

:::proof
1. The points $(r, k)$ with $r > 0$ fill the ray at angle $k$; those with $r < 0$ fill the
   opposite ray. Together they are the whole line, and $\tan\theta = y/x$ gives $y = x\tan k$.
2. $r = a$ says $|OP| = |a|$; squaring, $r^2 = a^2$, i.e. $x^2 + y^2 = a^2$.
:::
::::

Note the line $\theta = \tfrac{\pi}{2}$ is the same as $\theta = \tfrac{\pi}{2} + \pi$: an angle and
the angle half a turn later describe one line.

```sim
id: polar-curve
controls:
  - {id: fam, label: "curve (0 circle, 1 cardioid, 2 limaçon, 3 rose, 4 spiral)", min: 0, max: 4, step: 1, default: 4, decimals: 0}
  - {id: a, label: "a", min: -4, max: 4, step: 0.1, default: 4, decimals: 1}
  - {id: b, label: "b (limaçon)", min: 0, max: 4, step: 0.5, default: 2, decimals: 1}
  - {id: n, label: "n (rose)", min: 1, max: 6, step: 1, default: 2, decimals: 0}
  - {id: T, label: "trace (fraction of the θ range)", min: 0, max: 1, step: 0.01, default: 1, decimals: 2}
note: 'Each point is (r(θ) cos θ, r(θ) sin θ): the curve is drawn as θ increases (the spiral from θ = −4π, the others from 0), and where r(θ) < 0 the point is plotted through the pole. The spiral is r = (1 + |a|)^θ; the default a = 4 is the lecture spiral r = 5^θ. Each of its turns multiplies r by about 24 000, so only the last turn is visible — lower a to 0.2 to see the same shape wind several times into the pole. The title gives the length traced so far, ∫ √(r² + r′²) dθ.'
```

```python
# Plot a polar curve by converting each (r(θ), θ) to (x, y), and measure its length with
# L = ∫ √(r² + r′²) dθ. The sim's default is the spiral r = 5^θ, −4π ≤ θ ≤ 0.3π.
import numpy as np
from math import log, pi, sqrt

def length(r, dr, a, b, n=200_000):
    t = np.linspace(a, b, n)
    return np.trapezoid(np.sqrt(r(t) ** 2 + dr(t) ** 2), t)

spiral, dspiral = (lambda t: 5.0 ** t), (lambda t: 5.0 ** t * log(5))
print("spiral, 0 ≤ θ ≤ 2π:", round(length(spiral, dspiral, 0, 2 * pi), 1),
      " exact √(ln²5 + 1)(5^(2π) − 1)/ln 5 =", round(sqrt(log(5) ** 2 + 1) * (5 ** (2 * pi) - 1) / log(5), 1))
cardioid, dcardioid = (lambda t: 1 - np.sin(t)), (lambda t: -np.cos(t))
print("cardioid r = 1 − sin θ, full length:", round(length(cardioid, dcardioid, 0, 2 * pi), 4))   # 8

def slope(r, dr, t):                                 # dy/dx = (r′ sin θ + r cos θ)/(r′ cos θ − r sin θ)
    return (dr(t) * np.sin(t) + r(t) * np.cos(t)) / (dr(t) * np.cos(t) - r(t) * np.sin(t))
print("spiral slope at θ = 0:", round(slope(spiral, dspiral, 0.0), 4), "= 1/ln 5 =", round(1 / log(5), 4))
# Output:
#   spiral, 0 ≤ θ ≤ 2π: 29015.6  exact √(ln²5 + 1)(5^(2π) − 1)/ln 5 = 29015.6
#   cardioid r = 1 − sin θ, full length: 8.0
#   spiral slope at θ = 0: 0.6213 = 1/ln 5 = 0.6213
```

## Tangent lines and arc length

A polar curve $r = f(\theta)$ is a parametric curve with parameter $\theta$:

$$
x = f(\theta)\cos\theta \qquad y = f(\theta)\sin\theta ,
$$

so the slope and length formulas of the parametric units apply directly.

::::theorem[Slope of a polar curve]
At a point where the denominator is not zero,

$$
\frac{dy}{dx} = \frac{dy/d\theta}{dx/d\theta} = \frac{f'(\theta)\sin\theta + f(\theta)\cos\theta}{f'(\theta)\cos\theta - f(\theta)\sin\theta} .
$$

:::proof
Differentiate $x = f\cos\theta$ and $y = f\sin\theta$ with the product rule:
$x' = f'\cos\theta - f\sin\theta$ and $y' = f'\sin\theta + f\cos\theta$, then divide.
:::
::::

Horizontal tangents are where the numerator is $0$ (and the denominator is not), vertical
tangents where the denominator is $0$ (and the numerator is not) — exactly as for
parametric curves.

::::theorem[Length of a polar curve]
If $f'$ is continuous and the curve is traced exactly once for $a \le \theta \le b$,

$$
L = \int_a^b \sqrt{f(\theta)^2 + f'(\theta)^2}\,d\theta = \int_a^b \sqrt{r^2 + \left(\frac{dr}{d\theta}\right)^2}\,d\theta .
$$

:::proof
Start from $L = \int_a^b \sqrt{x'(\theta)^2 + y'(\theta)^2}\,d\theta$ and expand:

$$
\begin{aligned}
x'^2 + y'^2 &= (f'\cos\theta - f\sin\theta)^2 \\
  &\quad + (f'\sin\theta + f\cos\theta)^2 \\
  &= f'^2(\cos^2\theta + \sin^2\theta) \\
  &\quad + f^2(\sin^2\theta + \cos^2\theta) \\
  &= f'^2 + f^2 ,
\end{aligned}
$$

the cross terms $\mp 2ff'\sin\theta\cos\theta$ cancelling.
:::
::::

::::example[The spiral $r = 5^\theta$]
Find the length of $r = 5^\theta$ for $0 \le \theta \le 2\pi$, and its slope as a function of
$\theta$.

:::solution
$r' = 5^\theta\ln 5$, so $r^2 + r'^2 = 5^{2\theta}(\ln^2 5 + 1)$ and

$$
L = \int_0^{2\pi} 5^\theta\sqrt{\ln^2 5 + 1}\,d\theta = \sqrt{\ln^2 5 + 1}\,\left[\frac{5^\theta}{\ln 5}\right]_0^{2\pi} = \frac{\sqrt{\ln^2 5 + 1}\,\big(5^{2\pi} - 1\big)}{\ln 5} \approx 29\,016 .
$$

The number is large because $r$ grows by a factor $5^{2\pi}$ over one turn. With
$x = 5^\theta\cos\theta$, $y = 5^\theta\sin\theta$ and the common factor $5^\theta$ cancelled,

$$
\frac{dy}{dx} = \frac{\ln 5\,\sin\theta + \cos\theta}{\ln 5\,\cos\theta - \sin\theta} ,
$$

which at $\theta = 0$ is $1/\ln 5 \approx 0.621$.
:::
::::

:::insight
Everything calculus did for $x = f(t)$, $y = g(t)$ it does for $r = f(\theta)$: substitute
$x = f(\theta)\cos\theta$, $y = f(\theta)\sin\theta$ and treat $\theta$ as the parameter. The length
formula simplifies to $\sqrt{r^2 + r'^2}$ because the cross terms cancel.
:::

:::equations
- $\dfrac{dy}{dx} = \dfrac{f'\sin\theta + f\cos\theta}{f'\cos\theta - f\sin\theta}$ — horizontal tangent: numerator $0$; vertical: denominator $0$.
- $L = \displaystyle\int_a^b \sqrt{r^2 + r'^2}\,d\theta$ — the curve traced once.
- $\theta = k$: a line through the pole; $r = a$: a circle about the pole, radius $|a|$.
:::

## Further reading

- [Paul's Online Notes — Polar Coordinates](https://tutorial.math.lamar.edu/Classes/CalcII/PolarCoordinates.aspx) — conversions both ways, with the quadrant check spelled out.
- [Paul's Online Notes — Tangents with Polar Coordinates](https://tutorial.math.lamar.edu/Classes/CalcII/PolarTangents.aspx) — the slope formula and horizontal and vertical tangents.
- [Paul's Online Notes — Arc Length with Polar Coordinates](https://tutorial.math.lamar.edu/Classes/CalcII/PolarArcLength.aspx) — the $\sqrt{r^2 + r'^2}$ formula with worked examples.
