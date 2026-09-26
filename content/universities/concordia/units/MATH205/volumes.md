---
title: Volumes
order: 12
status: detailed
weeks: [6]
introduces: [volume-by-slicing]
requires:
  - {concept: integral, strength: hard}
  - {concept: fundamental-theorem-of-calculus, strength: hard}
reinforces: []
---

The Riemann-sum recipe in three dimensions: slice a solid into thin slabs, measure each
slab's face, multiply by its thickness, add, refine. Solids of revolution are the case
where every face is a disc or a ring, so the face area comes from one radius.

## Volume by cross-sections

:::definition[Cross-section]
A **cross-section** of a solid $S$ is the plane region cut out of $S$ by a plane $P$.
:::

:::definition[Volume]
Let $S$ lie between the planes $x = a$ and $x = b$, and let $A(x)$ be the area of the
cross-section by the plane through $x$ perpendicular to the $x$-axis. If $A$ is continuous,
the volume of $S$ is

$$
V = \lim_{n \to \infty}\sum_{i=1}^{n} A(x_i^*)\,\Delta x_i = \int_a^b A(x)\,dx .
$$
:::

Each term $A(x_i^*)\Delta x_i$ is the volume of a cylinder-like slab of face $A(x_i^*)$ and
thickness $\Delta x_i$ — the 3-D version of a rectangle.

::::example[A pyramid]
Find the volume of a square pyramid of base side $L$ and height $h$.

:::solution
Put the apex at $x = 0$ and the base at $x = h$. The cross-section at $x$ is a square of side
$Lx/h$, so $A(x) = L^2x^2/h^2$ and

$$
V = \int_0^h \frac{L^2}{h^2}x^2\,dx = \frac{L^2}{h^2}\cdot\frac{h^3}{3} = \frac13 L^2 h ,
$$

the familiar "one third of base times height".
:::
::::

## Solids of revolution

:::definition[Solid of revolution]
The solid obtained by rotating a plane region about a line is a **solid of revolution**.
:::

Rotate the region under $y = f(x)$, $a \le x \le b$, about the $x$-axis. The
cross-section at $x$ is a disc of radius $f(x)$, so $A(x) = \pi f(x)^2$ and

:::equations
- **disc method** (about the $x$-axis): $V = \displaystyle\int_a^b \pi\,f(x)^2\,dx$
- **washer method** (region between $f \ge g \ge 0$): $V = \displaystyle\int_a^b \pi\big(f(x)^2 - g(x)^2\big)\,dx$
- rotating about the $y$-axis a region $c \le y \le d$ described by $x = g(y)$: $V = \displaystyle\int_c^d \pi\,g(y)^2\,dy$
- about a shifted axis $y = k$: radius $= |f(x) - k|$
:::

::::example[A sphere]
Find the volume of a ball of radius $r$ as a solid of revolution.

:::solution
Rotate the semicircle $y = \sqrt{r^2 - x^2}$, $-r \le x \le r$, about the $x$-axis:

$$
V = \int_{-r}^{r}\pi(r^2 - x^2)\,dx = 2\pi\Big[r^2x - \frac{x^3}{3}\Big]_0^r = \frac43\pi r^3 .
$$
:::
::::

::::example[A washer]
Rotate the region between $y = x$ and $y = x^2$ on $[0, 1]$ about the $x$-axis. Find the volume.

:::solution
Outer radius $x$, inner radius $x^2$:

$$
V = \int_0^1 \pi\big(x^2 - x^4\big)\,dx = \pi\Big(\frac13 - \frac15\Big) = \frac{2\pi}{15} .
$$
:::
::::

::::example[About a line that is not an axis]
Rotate the same region about the line $y = -1$. Set up the volume integral.

:::solution
Both radii grow by 1 — outer $x + 1$, inner $x^2 + 1$ — so

$$
V = \int_0^1 \pi\big[(x + 1)^2 - (x^2 + 1)^2\big]\,dx .
$$

Squaring the *shifted* radii, not shifting the squared ones, is the point.
:::
::::

```sim
id: calc-solid-revolution
controls:
  - {id: b, label: "Right end b", min: 0.5, max: 4, step: 0.1, default: 3, decimals: 1}
  - {id: n, label: "Discs n", min: 2, max: 30, step: 1, default: 8, decimals: 0}
note: 'The region under y = √x on [0, b] rotated about the x-axis, drawn as a stack of n discs whose radius is f at the left end of each slab. The disc sum Σ π f(xᵢ)² Δx approaches the exact volume π b²/2 from below as n grows — the same squeeze as for rectangles, one dimension up.'
```

```python
# Volume of y = √x on [0, b] spun about the x-axis: the left-endpoint disc sum
# Σ π f(xᵢ)² Δx climbs to the exact π b²/2.
from math import pi, sqrt

def discs(b, n):
    dx = b / n
    return sum(pi * sqrt(i*dx)**2 * dx for i in range(n))

b = 3                                                    # the sim's defaults: b = 3, n = 8
for n in (8, 80, 800):
    print(n, round(discs(b, n), 4))
print('exact', round(pi*b*b/2, 4))
# Output:
#   8 12.37
#   80 13.9605
#   800 14.1195
#   exact 14.1372
```

:::insight
Set every volume problem up as $\int(\text{face area})\,d(\text{thickness})$.
Decide first which axis the slices are perpendicular to; that fixes the variable of
integration, the limits, and whether the face is a disc, a washer, or something else.
:::

:::caution
For a washer, $\pi(R^2 - r^2)$, not $\pi(R - r)^2$. The face is a ring, and the
ring's area is the difference of two disc areas.
:::

## Further reading

- [Paul's Online Notes — Volumes of Solids of Revolution: Rings](https://tutorial.math.lamar.edu/Classes/CalcI/VolumeWithRings.aspx) — Discs and washers about both axes and about shifted lines.
- [Paul's Online Notes — More Volume Problems](https://tutorial.math.lamar.edu/Classes/CalcI/MoreVolume.aspx) — Cross-sections that are not discs: squares, triangles, semicircles.
