---
title: Critical points and absolute extrema
order: 11
asks: find and classify critical points, largest and smallest values on a region, a maximum in words
units: [optimization-lagrange]
---

## Logic

The candidates for extrema are the flat points. The second-derivative test sorts flat points into
minima, maxima and saddles. On a closed bounded region, the extremes must exist, and the search is a
finite list: flat points inside plus the best of the boundary, then compare values.

## Pattern

:::steps[Classifying]
1. Solve $f_x = 0$, $f_y = 0$ together. Factor, and treat each factor as a case.
2. Compute $f_{xx}$, $f_{yy}$, $f_{xy}$ and $D = f_{xx}f_{yy} - f_{xy}^2$.
3. $D < 0$ saddle; $D > 0$ with $f_{xx} > 0$ minimum; $D > 0$ with $f_{xx} < 0$ maximum; $D = 0$ look at the function.
:::

:::steps[On a closed bounded region]
1. Interior: critical points inside the region, with their values. No classification needed.
2. Boundary: each edge is a one-variable problem (or a Lagrange problem).
3. Corners: their values.
4. Compare the whole list.
:::

## Traps

:::caution[Traps]
- Never divide an equation by a variable that can be $0$: $x(y - 1) = 0$ is two cases.
- Critical points outside the region do not count.
- Corners count, even where no derivative is $0$.
- The sign of $f_{xx}$ means nothing when $D \le 0$.
- A local minimum need not be absolute: give a reason.
:::

## Worked problems

::::exercise[Three critical points]
Find and classify the critical points of $f(x, y) = x^4 - 2x^2 + y^2 - 2y$.

:::solution
$f_x = 4x(x^2 - 1) = 0$ gives $x = 0, \pm 1$, and $f_y = 2y - 2 = 0$ gives $y = 1$. $f_{xx} = 12x^2 - 4$, $f_{yy} = 2$, $f_{xy} = 0$, so $D = 24x^2 - 8$.

At $(0, 1)$: $D = -8$, a saddle. At $(\pm 1, 1)$: $D = 16$ and $f_{xx} = 8$, local minima with $f = -2$.
:::
::::

:::note[Pattern at work]
Each factor of step 1 gives a point. The function separates into a part in $x$ and a part in $y$, which is why $f_{xy} = 0$.
:::

::::exercise[On a rectangle]
Find the absolute extrema of $f(x, y) = x^2 - xy + y^2 - 3y$ on $0 \le x \le 2$, $0 \le y \le 3$.

:::solution
Interior: $2x - y = 0$ and $-x + 2y - 3 = 0$ give $(1, 2)$, inside, with $f = -3$.

- $y = 0$: $f = x^2$, from $0$ at $(0, 0)$ to $4$ at $(2, 0)$.
- $y = 3$: $f = x^2 - 3x$, with minimum $-\frac94$ at $x = \frac32$, and $0$, $-2$ at the ends.
- $x = 0$: $f = y^2 - 3y$, with minimum $-\frac94$ at $y = \frac32$.
- $x = 2$: $f = y^2 - 5y + 4$, with minimum $-\frac94$ at $y = \frac52$, and $4$, $-2$ at the ends.

The largest value is $4$ at $(2, 0)$, a corner. The smallest is $-3$ at $(1, 2)$.
:::
::::

:::note[Pattern at work]
Steps 1 to 4 of the region list. The maximum sits at a corner, where no derivative vanishes.
:::

::::exercise[A largest product in words]
Three positive numbers add up to $30$. Maximize $xy^2z$.

:::solution
Put $z = 30 - x - y$, so $f = xy^2(30 - x - y)$. Then

$$
f_x = y^2(30 - 2x - y) = 0 ,
\qquad
f_y = xy(60 - 2x - 3y) = 0 .
$$

With $x, y > 0$: $2x + y = 30$ and $2x + 3y = 60$, so $y = 15$, $x = \frac{15}{2}$ and $z = \frac{15}{2}$. The value is $\frac{50625}{4}$. Here $D > 0$ and $f_{xx} < 0$, a local maximum. $f$ is $0$ on the boundary of the triangle and positive inside, so it is the absolute maximum.
:::
::::

:::note[Pattern at work]
The constraint removes one variable. Positivity removes the cases $x = 0$ and $y = 0$. Lagrange (next type) solves the same problem without the substitution.
:::
