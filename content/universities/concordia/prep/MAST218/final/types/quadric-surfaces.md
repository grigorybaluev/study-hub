---
title: Cylinders and quadric surfaces
order: 6
asks: classify a surface from its equation, complete the squares, describe its traces
units: [lines-planes-surfaces]
---

## Logic

A second-degree equation names its own surface. Powers come first: a missing variable, a linear
variable, or all squares. Signs come second, once the right side is positive. Traces confirm the
reading, and each trace is a conic.

## Pattern

:::steps[Reading a quadric]
1. A variable is missing: a cylinder over the curve in the other two.
2. Complete squares where a variable appears both squared and linear.
3. One variable linear: a paraboloid, elliptic if the squares have the same sign, hyperbolic if not.
4. All squared with right side $0$: a cone, along the variable alone on one side.
5. All squared, right side made $1$: no minus sign is an ellipsoid, one is one sheet (axis: the minus variable), two is two sheets (axis: the plus variable).
6. Check with a trace: set one variable to a constant and name the conic.
:::

## Traps

:::caution[Traps]
- Divide so that the right side is $+1$ before counting minus signs.
- $x^2 + y^2 = 1$ in space is a cylinder, not a circle.
- The cone's right side is $0$ once everything is on one side; a hyperboloid's is not.
- The denominators are squares: $\frac{x^2}{4}$ has semi-axis $2$.
- The centre has the signs opposite to those inside the brackets.
:::

## Worked problems

::::exercise[Five surfaces to name]
Name each surface and its axis: (a) $x^2 + 4y^2 - z^2 = 4$; (b) $z^2 = 4x^2 + y^2$; (c) $y = x^2 - z^2$; (d) $y^2 + 4z^2 = 4$; (e) $x = y^2 + 2z^2$.

:::solution
(a) $\frac{x^2}{4} + y^2 - \frac{z^2}{4} = 1$: one minus sign, a hyperboloid of one sheet, axis the $z$-axis.

(b) All squared, right side $0$ after moving: an elliptic cone opening along the $z$-axis.

(c) $y$ linear, squares of opposite signs: a hyperbolic paraboloid.

(d) $x$ missing: an elliptic cylinder along the $x$-axis, over $\frac{y^2}{4} + z^2 = 1$.

(e) $x$ linear, squares of the same sign: an elliptic paraboloid opening along the positive $x$-axis.
:::
::::

:::note[Pattern at work]
Each one stops at a different step: (a) step 5, (b) step 4, (c) and (e) step 3, (d) step 1. The order of the steps is what makes this fast.
:::

::::exercise[Completing three squares]
Identify $x^2 + y^2 - 4z^2 + 4x - 6y - 8z + 5 = 0$ and describe its traces at $z = -1$ and $x = -2$.

:::solution
$(x + 2)^2 - 4 + (y - 3)^2 - 9 - 4(z + 1)^2 + 4 + 5 = 0$, so $(x + 2)^2 + (y - 3)^2 - 4(z + 1)^2 = 4$, and

$$
\frac{(x + 2)^2}{4} + \frac{(y - 3)^2}{4} - (z + 1)^2 = 1 .
$$

A hyperboloid of one sheet with centre $(-2, 3, -1)$ and axis parallel to the $z$-axis.

At $z = -1$: the circle $(x + 2)^2 + (y - 3)^2 = 4$, the narrowest slice. At $x = -2$: the hyperbola $\frac{(y - 3)^2}{4} - (z + 1)^2 = 1$.
:::
::::

:::note[Pattern at work]
Steps 2, 5 and 6. Note $-4(z + 1)^2$ gives back $+4$ on the left, the factored coefficient at work.
:::
