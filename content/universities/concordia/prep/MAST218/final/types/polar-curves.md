---
title: Polar curves
order: 2
asks: convert between polar and Cartesian, match or sketch, tangents, areas, lengths
units: [polar-coordinates, polar-areas-and-curves]
---

## Logic

In polar form the angle is the parameter: $x = r\cos\theta$, $y = r\sin\theta$. Slopes come from the
parametric formula, and areas come from thin sectors instead of thin rectangles. Everything hinges on
the range of $\theta$, so sketch $r$ against $\theta$ first and read off where the curve starts, loops
and passes through the pole.

## Pattern

:::steps[Working in polar form]
1. Convert with $x = r\cos\theta$, $y = r\sin\theta$, $r^2 = x^2 + y^2$. Multiply by $r$ when the equation has a lone $\cos\theta$ or $\sin\theta$.
2. Sketch: find where $r = 0$, the largest $|r|$, and the symmetry. Name the family: circle, cardioid, limaçon, rose.
3. Slope: $\frac{dy}{dx} = \frac{r'\sin\theta + r\cos\theta}{r'\cos\theta - r\sin\theta}$.
4. Area: $\frac12\int_\alpha^\beta r^2\,d\theta$. Between two curves: $\frac12\int_\alpha^\beta (r_{\text{out}}^2 - r_{\text{in}}^2)\,d\theta$.
5. Limits: solve $r_1(\theta) = r_2(\theta)$, or $r = 0$ for a petal, and check the sketch.
6. Length: $\int_\alpha^\beta \sqrt{r^2 + r'^2}\,d\theta$.
:::

## Traps

:::caution[Traps]
- Squares do not subtract early: use $r_{\text{out}}^2 - r_{\text{in}}^2$, never $(r_{\text{out}} - r_{\text{in}})^2$.
- Two curves can meet at the pole at different angles, so solving $r_1 = r_2$ can miss that point.
- A rose $r = a\cos n\theta$ has $n$ petals for odd $n$ and $2n$ for even $n$. A full turn over-counts an odd rose.
- $\frac{dr}{d\theta}$ is not the slope of the curve.
- Integrate over one traversal: $r = 4\cos\theta$ is complete after $\theta$ runs through $\pi$.
:::

## Worked problems

::::exercise[Inside a circle, outside another]
Find the area inside $r = 4\cos\theta$ and outside $r = 2$.

:::solution
They meet where $4\cos\theta = 2$, so $\theta = \pm\frac{\pi}{3}$. Between these angles the first circle is the outer curve:

$$
A = \frac12\int_{-\pi/3}^{\pi/3} (16\cos^2\theta - 4)\,d\theta = \int_0^{\pi/3} (4 + 8\cos 2\theta)\,d\theta = \frac{4\pi}{3} + 2\sqrt{3} .
$$
:::
::::

:::note[Pattern at work]
Step 5 for the limits, step 4 with the squares subtracted. Symmetry about the polar axis halves the work.
:::

::::exercise[One petal, one tangent, one conversion]
(a) Find the area of one petal of $r = 2\cos 3\theta$. (b) Find the slope of $r = 1 + \cos\theta$ at $\theta = \frac{\pi}{2}$. (c) Identify $r = 4\sin\theta - 2\cos\theta$.

:::solution
(a) $r = 0$ at $\theta = \pm\frac{\pi}{6}$, which bound one petal:

$$
A = \frac12\int_{-\pi/6}^{\pi/6} 4\cos^2 3\theta\,d\theta = 2\int_0^{\pi/6} (1 + \cos 6\theta)\,d\theta = \frac{\pi}{3} .
$$

(b) At $\theta = \frac{\pi}{2}$: $r = 1$ and $r' = -\sin\theta = -1$, so

$$
\frac{dy}{dx} = \frac{(-1)(1) + (1)(0)}{(-1)(0) - (1)(1)} = 1 .
$$

(c) Multiply by $r$: $x^2 + y^2 = 4y - 2x$. Completing squares gives $(x + 1)^2 + (y - 2)^2 = 5$, a circle with centre $(-1, 2)$ and radius $\sqrt{5}$.
:::
::::

:::note[Pattern at work]
(a) uses $r = 0$ for the limits. (b) substitutes into the slope formula. (c) is the "multiply by $r$" move of step 1.
:::
