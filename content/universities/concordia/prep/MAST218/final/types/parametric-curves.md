---
title: Parametric curves
order: 1
asks: eliminate the parameter, tangents and concavity, area of a loop, arc length
units: [parametric-curves, calculus-on-parametric-curves]
---

## Logic

A parametric curve is a point moving with time, so $x$ and $y$ are both functions of $t$. Everything
about the curve is computed in $t$: the slope is a ratio of two rates, and an area or a length is an
integral in $t$ with $t$-limits. The curve is never needed as $y = F(x)$.

## Pattern

:::steps[Calculus in the parameter]
1. Picture: eliminate $t$ if possible, and mark the start, the end and the direction.
2. Slope: $\frac{dy}{dx} = \frac{y'(t)}{x'(t)}$. Horizontal tangent: $y' = 0$, $x' \ne 0$. Vertical tangent: $x' = 0$, $y' \ne 0$.
3. Concavity: differentiate the slope in $t$, then divide by $x'(t)$ again: $\frac{d^2y}{dx^2} = \frac{\frac{d}{dt}(dy/dx)}{x'(t)}$.
4. Area: $\left|\int_\alpha^\beta y(t)\,x'(t)\,dt\right|$ over one traversal.
5. Length: $\int_\alpha^\beta \sqrt{x'(t)^2 + y'(t)^2}\,dt$. Simplify the root before integrating.
:::

## Traps

:::caution[Traps]
- $\frac{d^2y}{dx^2}$ is not $\frac{y''(t)}{x''(t)}$.
- A point where the curve crosses itself has two values of $t$, so it has two tangents.
- Limits of integration are values of $t$, never of $x$.
- If $x' = y' = 0$ at a point, the formula gives $\frac00$: take a limit.
- The area integral comes out negative when the curve runs right to left: take the absolute value.
:::

## Worked problems

::::exercise[A curve with a loop]
For $x = t^2 - 4$, $y = t^3 - 4t$: find where the curve crosses itself and the tangents there, the horizontal and vertical tangents, where it is concave up, and the area of the loop.

:::solution
**Crossing.** $y = t(t^2 - 4) = 0$ at $t = 0, \pm 2$, and $x = 0$ at $t = \pm 2$. So $t = 2$ and $t = -2$ both give the origin.

**Slope.** $\frac{dy}{dx} = \frac{3t^2 - 4}{2t}$, which is $2$ at $t = 2$ and $-2$ at $t = -2$. The tangents at the origin are $y = 2x$ and $y = -2x$.

**Horizontal.** $3t^2 = 4$ gives $t = \pm\frac{2}{\sqrt{3}}$, at the points $\left(-\frac83, \mp\frac{16\sqrt{3}}{9}\right)$. **Vertical.** $x' = 2t = 0$ at $t = 0$, the point $(-4, 0)$.

**Concavity.** $\frac{d^2y}{dx^2} = \frac{\frac{d}{dt}\left(\frac32t - 2t^{-1}\right)}{2t} = \frac{\frac32 + 2t^{-2}}{2t} = \frac{3t^2 + 4}{4t^3}$, positive exactly for $t > 0$.

**Area.** The loop is $-2 \le t \le 2$:

$$
\left| \int_{-2}^{2} (t^3 - 4t)(2t)\,dt \right| = \left| 2\int_{-2}^{2} (t^4 - 4t^2)\,dt \right| = \frac{256}{15} .
$$
:::
::::

:::note[Pattern at work]
Step 2 gives the two tangents at the crossing, one per value of $t$. Step 3 divides by $x'(t) = 2t$ a second time. Step 4 reads the limits from the two values of $t$ at the crossing point.
:::

::::exercise[An arc length that simplifies]
Find the length of $x = 2t^3$, $y = 3t^2$ for $0 \le t \le \sqrt{3}$.

:::solution
$x' = 6t^2$ and $y' = 6t$, so $\sqrt{x'^2 + y'^2} = \sqrt{36t^4 + 36t^2} = 6t\sqrt{t^2 + 1}$ for $t \ge 0$. With $u = t^2 + 1$,

$$
L = \int_0^{\sqrt{3}} 6t\sqrt{t^2 + 1}\,dt = \left[ 2(t^2 + 1)^{3/2} \right]_0^{\sqrt{3}} = 16 - 2 = 14 .
$$
:::
::::

:::note[Pattern at work]
Step 5: factor $t^2$ out of the root before integrating. It leaves a substitution in plain sight.
:::
