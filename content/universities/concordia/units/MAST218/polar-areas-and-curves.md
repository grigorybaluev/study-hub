---
title: Areas in polar coordinates and the classic polar curves
order: 4
status: detailed
weeks: [3]
introduces:
  - {concept: polar-coordinates, perspective: "areas, symmetry, and the classic curves — cardioids, limaçons, circles through the pole, roses"}
requires:
  - {concept: integral, strength: hard}
  - {concept: trigonometric-integrals, strength: soft}
reinforces: []
---

Areas come out of polar equations as naturally as lengths did — the building block is a
circular sector instead of a rectangle. The second half of the unit is a catalogue:
cardioids, limaçons, circles through the pole and roses, with the symmetry tests that make
sketching them quick, and the recipe for the area between two of them.

## Area in polar coordinates

A sector of a circle of radius $R$ with angle $b - a$ has area $\tfrac12 R^2 (b - a) = \tfrac12\int_a^b R^2\,d\theta$.
Replace the constant radius by a curve $r = f(\theta)$ and the same integral measures the region
swept by the radius.

::::theorem[Area bounded by a polar curve]
If $f \ge 0$ is continuous on $[a, b]$ with $0 \le b - a \le 2\pi$, the region bounded by $r = f(\theta)$
and the rays $\theta = a$, $\theta = b$ has area

$$
A = \frac12\int_a^b f(\theta)^2\,d\theta = \frac12\int_a^b r^2\,d\theta .
$$

:::proof
Split $[a, b]$ into small angles $\Delta\theta$. Over each, the region is nearly a sector of
radius $f(\theta_i^*)$, with area $\tfrac12 f(\theta_i^*)^2\,\Delta\theta$. Adding them is a Riemann sum of
$\tfrac12 f^2$, whose limit is the integral.
:::
::::

::::theorem[Area between two polar curves]
If $0 \le g(\theta) \le f(\theta)$ on $[a, b]$, the region between $r = g(\theta)$ (inner) and $r = f(\theta)$
(outer) has area

$$
A = \frac12\int_a^b f(\theta)^2\,d\theta - \frac12\int_a^b g(\theta)^2\,d\theta = \frac12\int_a^b \big[f(\theta)^2 - g(\theta)^2\big]\,d\theta .
$$

:::proof
The region swept by the outer curve minus the region swept by the inner one.
:::
::::

:::caution
It is $\tfrac12\int(f^2 - g^2)$, **not** $\tfrac12\int(f - g)^2$ — the difference of two sector areas,
not the area of one sector of radius $f - g$.
:::

:::steps[An area problem in polar coordinates]
1. **Find the limits.** If the angles are not given, solve $f(\theta) = g(\theta)$ for the
   intersections, and solve $f(\theta) = 0$ for where a curve passes through the pole. The pole
   has many names, so it can be an intersection that $f = g$ does not find.
2. **Set up** $\tfrac12\int_a^b(\text{outer}^2 - \text{inner}^2)\,d\theta$, using a sketch to see which
   curve is outer on each interval, and split the interval where that changes.
3. **Use symmetry** to integrate over part of the region and multiply.
:::

::::example[Inside two circles]
Find the area inside both $r = 4\cos\theta$ and $r = 4\sin\theta$.

:::solution
**Intersections.** $4\cos\theta = 4\sin\theta \iff \tan\theta = 1$, so $\theta = \tfrac{\pi}{4}$; both
circles also pass through the pole.

**Area.** From $0$ to $\tfrac{\pi}{4}$ the region is bounded by $r = 4\sin\theta$, from $\tfrac{\pi}{4}$
to $\tfrac{\pi}{2}$ by $r = 4\cos\theta$, and the two halves are mirror images in the line
$\theta = \tfrac{\pi}{4}$. So

$$
A = 2\cdot\frac12\int_0^{\pi/4}(4\sin\theta)^2\,d\theta = 16\int_0^{\pi/4}\frac{1 - \cos 2\theta}{2}\,d\theta = 8\Big[\theta - \frac{\sin 2\theta}{2}\Big]_0^{\pi/4} = 2\pi - 4 .
$$

Without the symmetry, add the two pieces:
$\tfrac12\int_0^{\pi/4}(4\sin\theta)^2\,d\theta + \tfrac12\int_{\pi/4}^{\pi/2}(4\cos\theta)^2\,d\theta$.
:::
::::

::::example[Inside a circle, outside a cardioid]
Find the area inside $r = 3\cos\theta$ and outside $r = 1 + \cos\theta$.

:::solution
**Intersections.** $1 + \cos\theta = 3\cos\theta \iff \cos\theta = \tfrac12$, so $\theta = \pm\tfrac{\pi}{3}$.
Between them the circle is outer.

$$
A = \frac12\int_{-\pi/3}^{\pi/3}\Big[(3\cos\theta)^2 - (1 + \cos\theta)^2\Big]\,d\theta = \frac12\int_{-\pi/3}^{\pi/3}\big(8\cos^2\theta - 2\cos\theta - 1\big)\,d\theta = \pi .
$$
:::
::::

```sim
id: polar-area
controls:
  - {id: ex, label: "example (0 cardioid, 1 two circles, 2 circle − cardioid, 3 inner loop, 4 rose)", min: 0, max: 4, step: 1, default: 1, decimals: 0}
  - {id: sweep, label: "sweep the angle (fraction)", min: 0, max: 1, step: 0.01, default: 1, decimals: 2}
note: 'The green region is swept out as θ runs from the lower limit to the dashed ray; its area is ½∫ (r_out² − r_in²) dθ up to that ray. At sweep = 1 it reaches the exact value in the title. Example 1 shows why the limits come from the intersection θ = π/4; example 3 is the inner loop, where r < 0 throughout.'
```

```python
# Areas in polar coordinates, A = ½∫ (r_out² − r_in²) dθ, for the five examples of the sim.
import sympy as sp

t = sp.symbols('theta', real=True)
half = sp.Rational(1, 2)
def A(outer, a, b, inner=0):
    return sp.simplify(half * sp.integrate(outer**2 - inner**2, (t, a, b)))

pi = sp.pi
cases = {
    "cardioid r = 1 − sin θ": A(1 - sp.sin(t), 0, 2 * pi),
    "inside r = 4cos θ and r = 4sin θ": 2 * A(4 * sp.sin(t), 0, pi / 4),          # symmetric: twice one half
    "inside 3cos θ, outside 1 + cos θ": A(3 * sp.cos(t), -pi / 3, pi / 3, 1 + sp.cos(t)),
    "inner loop of r = 1 + 2cos θ": A(1 + 2 * sp.cos(t), 2 * pi / 3, 4 * pi / 3),
    "rose r = sin 2θ (4 petals)": 4 * A(sp.sin(2 * t), 0, pi / 2),
}
for name, value in cases.items():
    print(f"{name:34} {str(value):14} ≈ {float(value):.4f}")
print("one petal of r = cos 2θ:", A(sp.cos(2 * t), -pi / 4, pi / 4))           # π/8
# Output:
#   cardioid r = 1 − sin θ             3*pi/2         ≈ 4.7124
#   inside r = 4cos θ and r = 4sin θ   -4 + 2*pi      ≈ 2.2832
#   inside 3cos θ, outside 1 + cos θ   pi             ≈ 3.1416
#   inner loop of r = 1 + 2cos θ       pi - 3*sqrt(3)/2 ≈ 0.5435
#   rose r = sin 2θ (4 petals)         pi/2           ≈ 1.5708
#   one petal of r = cos 2θ: pi/8
```

:::insight
Areas in polar coordinates are sums of thin sectors, so everything hangs on the angles: where
the curves cross, where they pass through the pole, and which curve is outside on each
interval. The integral itself is almost always a $\cos^2$ / $\sin^2$ half-angle computation.
:::

## Symmetry

::::proposition[Symmetry tests]
The curve $r = f(\theta)$ is symmetric

1. about the **polar axis** if the equation is unchanged when $\theta$ is replaced by $-\theta$;
2. about the **vertical line** $\theta = \tfrac{\pi}{2}$ if it is unchanged when $\theta$ is replaced by $\pi - \theta$;
3. about the **pole** if it is unchanged when $\theta$ is replaced by $\theta + \pi$, or $r$ by $-r$.

:::proof
$(r, -\theta)$ is the reflection of $(r, \theta)$ in the polar axis, $(r, \pi - \theta)$ its reflection in
the vertical axis, and $(r, \theta + \pi) = (-r, \theta)$ its reflection through the pole. If the
equation survives the substitution, every reflected point is on the curve too.
:::
::::

For example, $\cos$ is even, so every $r = f(\cos\theta)$ is symmetric about the polar axis, and
$\sin(\pi - \theta) = \sin\theta$, so every $r = f(\sin\theta)$ is symmetric about the vertical axis.

## Cardioids

:::definition[Cardioid]
The curves $r = a(1 - \sin\theta)$, $r = a(1 + \sin\theta)$, $r = a(1 - \cos\theta)$ and $r = a(1 + \cos\theta)$,
$a > 0$, are **cardioids** — heart shapes with a cusp at the pole. The sine ones are symmetric
about the vertical axis, the cosine ones about the polar axis.
:::

::::example[The cardioid $r = 1 - \sin\theta$]
Sketch $r = 1 - \sin\theta$, $0 \le \theta \le 2\pi$, with its horizontal and vertical tangents, and find
its length and area.

:::solution
**Table.**

| $\theta$ | $0$ | $\tfrac{\pi}{6}$ | $\tfrac{\pi}{2}$ | $\tfrac{5\pi}{6}$ | $\pi$ | $\tfrac{7\pi}{6}$ | $\tfrac{3\pi}{2}$ | $\tfrac{11\pi}{6}$ |
|---|---|---|---|---|---|---|---|---|
| $r$ | $1$ | $\tfrac12$ | $0$ | $\tfrac12$ | $1$ | $\tfrac32$ | $2$ | $\tfrac32$ |

It passes through the pole at $\theta = \tfrac{\pi}{2}$ (a cusp), reaches its lowest point $(2, \tfrac{3\pi}{2})$
at the bottom, and is symmetric about the vertical axis ($\sin(\pi - \theta) = \sin\theta$).

**Tangents.** With $f = 1 - \sin\theta$, $f' = -\cos\theta$:

- horizontal ($dy/d\theta = 0$): $\theta = \tfrac{\pi}{6}, \tfrac{5\pi}{6}$ (the two tops, $r = \tfrac12$) and
  $\theta = \tfrac{3\pi}{2}$ (the bottom);
- vertical ($dx/d\theta = 0$): $\theta = \tfrac{7\pi}{6}, \tfrac{11\pi}{6}$ (the widest points, $r = \tfrac32$);
- at $\theta = \tfrac{\pi}{2}$ both derivatives vanish: the cusp.

**Length and area.**

$$
L = \int_0^{2\pi}\sqrt{(1 - \sin\theta)^2 + \cos^2\theta}\,d\theta = \int_0^{2\pi}\sqrt{2 - 2\sin\theta}\,d\theta = 8
\qquad
A = \frac12\int_0^{2\pi}(1 - \sin\theta)^2\,d\theta = \frac{3\pi}{2} .
$$
:::
::::

:::note
A quick sketch may mark the $x$-intercepts $(1, 0)$ and $(1, \pi)$ as vertical tangents. The
slope there is $-1$ at $\theta = 0$ and $1$ at $\theta = \pi$; the vertical tangents are at
$\theta = \tfrac{7\pi}{6}$ and $\tfrac{11\pi}{6}$, as the sim shows.
:::

```sim
id: polar-tangent
controls:
  - {id: th, label: "θ (× π)", min: 0, max: 2, step: 0.0138889, default: 0.1666667, decimals: 3}
note: 'The cardioid r = 1 − sin θ with its tangent at θ. Yellow squares are the horizontal tangents (θ = π/6, 5π/6, 3π/2), violet diamonds the vertical ones (θ = 7π/6, 11π/6). At θ = π/2 the point is the pole and dy/dx is 0/0 — the cusp. Move θ to 0 or 1 (θ = π) to see the slopes −1 and 1 at the x-intercepts.'
```

```python
# Tangents of the cardioid r = 1 − sin θ: solve dy/dθ = 0 (horizontal) and dx/dθ = 0 (vertical)
# on [0, 2π), and read the slope anywhere from dy/dx = (f′ sin θ + f cos θ)/(f′ cos θ − f sin θ).
import sympy as sp

t = sp.symbols('theta', real=True)
f = 1 - sp.sin(t)
x, y = f * sp.cos(t), f * sp.sin(t)
dx, dy = sp.diff(x, t), sp.diff(y, t)

def roots(expr):
    return sorted(sp.solveset(sp.simplify(expr), t, sp.Interval.Ropen(0, 2 * sp.pi)), key=float)

print("dy/dθ = 0 at", roots(dy))                         # π/6, π/2, 5π/6, 3π/2
print("dx/dθ = 0 at", roots(dx))                         # π/2, 7π/6, 11π/6
print("both zero at θ = π/2 (r = 0): the cusp at the pole")
for th in (sp.pi / 6, sp.Integer(0), sp.pi):             # the sim's default, then the two x-intercepts
    print(f"slope at θ = {th}:", sp.nsimplify(sp.simplify((dy / dx).subs(t, th))))
# Output:
#   dy/dθ = 0 at [pi/6, pi/2, 5*pi/6, 3*pi/2]
#   dx/dθ = 0 at [pi/2, 7*pi/6, 11*pi/6]
#   both zero at θ = π/2 (r = 0): the cusp at the pole
#   slope at θ = pi/6: 0
#   slope at θ = 0: -1
#   slope at θ = pi: 1
```

The other three cardioids are reflections and rotations of this one: $r = 1 + \sin\theta$ is it
upside down — cusp at the bottom, top at $(2, \tfrac{\pi}{2})$; $r = 1 - \cos\theta$ bulges to the left
with the cusp on the right, and $r = 1 + \cos\theta$ bulges to the right. Scaling $a$ scales the
picture: $r = 2 - 2\sin\theta$ reaches down to $y = -4$.

## Limaçons

:::definition[Limaçon]
The curves $r = a \pm b\cos\theta$ and $r = a \pm b\sin\theta$, $a, b > 0$, are **limaçons**. They have an
**inner loop** when $a < b$ (then $r$ becomes negative for part of the turn), no inner loop when
$a > b$, and are cardioids when $a = b$.
:::

::::example[The inner loop of $r = 1 + 2\cos\theta$]
Find the area enclosed by the inner loop of $r = 1 + 2\cos\theta$.

:::solution
**Limits.** The loop starts and ends at the pole: $1 + 2\cos\theta = 0 \iff \cos\theta = -\tfrac12$,
so $\theta = \tfrac{2\pi}{3}$ and $\tfrac{4\pi}{3}$. In between $r < 0$ (at $\theta = \pi$, $r = -1$), so these
points are plotted through the pole — the small loop inside.

$$
A = \frac12\int_{2\pi/3}^{4\pi/3}(1 + 2\cos\theta)^2\,d\theta = \pi - \frac{3\sqrt3}{2} \approx 0.544 .
$$

Squaring makes the negative $r$ harmless: $r^2$ is still the right sector size.
:::
::::

## Circles through the pole

::::proposition[Circles $r = a\cos\theta$ and $r = a\sin\theta$]
- $r = a\cos\theta$ is the circle centred $(\tfrac{a}{2}, 0)$ with radius $\tfrac{|a|}{2}$;
- $r = a\sin\theta$ is the circle centred $(0, \tfrac{a}{2})$ with radius $\tfrac{|a|}{2}$.

Each is traced once for $0 \le \theta \le \pi$; over $\pi \le \theta \le 2\pi$ it is traced again.

:::proof
Multiply $r = a\cos\theta$ by $r$: $x^2 + y^2 = ax$. Complete the square:

$$
x^2 - 2\cdot\frac{a}{2}x + \frac{a^2}{4} + y^2 = \frac{a^2}{4}
\quad\Longleftrightarrow\quad
\Big(x - \frac{a}{2}\Big)^2 + y^2 = \frac{a^2}{4} .
$$

The same steps turn $r = a\sin\theta$ into $x^2 + \big(y - \tfrac{a}{2}\big)^2 = \tfrac{a^2}{4}$.
:::
::::

::::example[Four circles and a shifted one]
Identify $r = 4\cos\theta$, $r = -4\cos\theta$, $r = 4\sin\theta$, $r = -4\sin\theta$ and $r = 2\cos\theta + 4\sin\theta$.

:::solution
By the proposition: $r = \pm 4\cos\theta$ are the circles of radius 2 centred $(\pm 2, 0)$, and
$r = \pm 4\sin\theta$ those centred $(0, \pm 2)$.

For the last one, multiply by $r$: $x^2 + y^2 = 2x + 4y$, and complete both squares:

$$
(x - 1)^2 + (y - 2)^2 = 5 ,
$$

the circle centred $(1, 2)$ with radius $\sqrt5$. It passes through the pole, like every
$r = A\cos\theta + B\sin\theta$.
:::
::::

:::note
A slip is easy here: completing the square as $(y + 2)^2$ places the centre at $(1, -2)$. Since
$y^2 - 4y + 4 = (y - 2)^2$, the centre is $(1, 2)$: at $\theta = \tfrac{\pi}{2}$ the curve is at $r = 4$,
the point $(0, 4)$, which is above the axis.
:::

## Roses

:::proposition[Petals of a rose]
The **roses** $r = k\sin n\theta$ and $r = k\cos n\theta$ ($n$ a positive integer) have $n$ petals when $n$
is odd and $2n$ petals when $n$ is even. They pass through the pole where $\sin n\theta = 0$ (or
$\cos n\theta = 0$), and each petal lies between two consecutive such angles.
:::

::::example[Two four-petalled roses]
Find the total area of $r = \sin 2\theta$, and the area of one petal of $r = \cos 2\theta$.

:::solution
For $r = \sin 2\theta$, $r = 0$ when $2\theta = k\pi$, i.e. $\theta = \tfrac{k\pi}{2}$: one petal is
$0 \le \theta \le \tfrac{\pi}{2}$, and there are four ($n = 2$ is even). So

$$
A = 4\cdot\frac12\int_0^{\pi/2}\sin^2 2\theta\,d\theta = \frac{\pi}{2} .
$$

For $r = \cos 2\theta$, $r = 0$ when $2\theta = \tfrac{\pi}{2} + k\pi$, i.e. $\theta = \tfrac{\pi}{4} + \tfrac{k\pi}{2}$.
The petal along the polar axis is $-\tfrac{\pi}{4} \le \theta \le \tfrac{\pi}{4}$:

$$
\frac12\int_{-\pi/4}^{\pi/4}\cos^2 2\theta\,d\theta = \frac{\pi}{8} .
$$
:::
::::

```sim
id: polar-curve
controls:
  - {id: fam, label: "curve (0 circle, 1 cardioid, 2 limaçon, 3 rose, 4 spiral)", min: 0, max: 4, step: 1, default: 3, decimals: 0}
  - {id: a, label: "a", min: -4, max: 4, step: 0.5, default: 1, decimals: 1}
  - {id: b, label: "b (limaçon)", min: 0, max: 4, step: 0.5, default: 2, decimals: 1}
  - {id: n, label: "n (rose)", min: 1, max: 6, step: 1, default: 2, decimals: 0}
  - {id: T, label: "trace (fraction of the θ range)", min: 0, max: 1, step: 0.01, default: 1, decimals: 2}
note: 'Roses first: r = cos 2θ has four petals; try n = 3 (three petals, each drawn twice over 0 ≤ θ ≤ 2π) and n = 4 (eight). Then switch the curve: the limaçon with a = 1, b = 2 shows its inner loop (the stretch where r < 0), a = 2, b = 1 has none; the circle r = a cos θ is finished at trace 0.5 (θ = π) and then retraced.'
```

```python
# Petals of the roses r = cos nθ. A petal tip is where |r| = 1, at θ = kπ/n (k = 0 … 2n − 1).
# The tip is drawn in direction θ when r = +1 and in direction θ + π when r = −1, so count the
# distinct directions: n odd -> n petals (every tip is drawn twice), n even -> 2n petals.
from math import pi, cos

def petals(n):
    directions = set()
    for k in range(2 * n):
        th = k * pi / n
        d = th if cos(n * th) > 0 else th + pi
        directions.add(round(d % (2 * pi), 9))
    return len(directions)

for n in range(1, 7):
    print(f"n = {n}: {petals(n)} petal{'' if petals(n) == 1 else 's'}")
# Output:
#   n = 1: 1 petal
#   n = 2: 4 petals
#   n = 3: 3 petals
#   n = 4: 8 petals
#   n = 5: 5 petals
#   n = 6: 12 petals
```

:::equations
- $A = \tfrac12\displaystyle\int_a^b r^2\,d\theta$; between two curves $A = \tfrac12\displaystyle\int_a^b\big(r_{\text{out}}^2 - r_{\text{in}}^2\big)\,d\theta$.
- Symmetry: $\theta \to -\theta$ (polar axis), $\theta \to \pi - \theta$ (vertical axis), $\theta \to \theta + \pi$ or $r \to -r$ (pole).
- $r = a\cos\theta$: centre $(\tfrac{a}{2}, 0)$; $r = a\sin\theta$: centre $(0, \tfrac{a}{2})$; radius $\tfrac{|a|}{2}$.
- Limaçon $r = a \pm b\cos\theta$: inner loop iff $a < b$; rose $r = k\cos n\theta$: $n$ petals ($n$ odd), $2n$ ($n$ even).
:::

## Further reading

- [Paul's Online Notes — Area with Polar Coordinates](https://tutorial.math.lamar.edu/Classes/CalcII/PolarArea.aspx) — the sector derivation and areas between two polar curves, with the intersection step.
- [Paul's Online Notes — Polar Coordinates](https://tutorial.math.lamar.edu/Classes/CalcII/PolarCoordinates.aspx) — sketches of cardioids, limaçons and roses, and the symmetry tests.
