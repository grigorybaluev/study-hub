---
title: Lagrange multipliers
order: 12
asks: extremes on a curve or surface, closest and farthest points, one or two constraints
units: [optimization-lagrange]
---

## Logic

On a constraint, $f$ stops changing where its level curve touches the constraint without crossing it.
There the gradients are parallel. That gives a system of equations, and all the difficulty is in solving
it without losing a case. The number $\lambda$ is a tool, and the answer is the values of $f$.

## Pattern

:::steps[Setting up and solving]
1. Name $f$ and $g$. For distance, use the squared distance.
2. Write $\nabla f = \lambda\,\nabla g$ in components, plus $g = k$.
3. Eliminate $\lambda$. Cross-multiply, or split on the factors. Treat $x = 0$, $y = 0$ separately if they may hold.
4. Put the relation between the variables into $g = k$ to get the points.
5. Evaluate $f$ at every point. On a closed bounded constraint, the largest is the maximum and the smallest the minimum.
6. Two constraints: $\nabla f = \lambda\,\nabla g + \mu\,\nabla h$, plus both constraints.
:::

## Traps

:::caution[Traps]
- Dividing by a variable can lose the solutions where it is $0$.
- The answer is the points and the values of $f$, not $\lambda$.
- The constraint equation is part of the system: without it, nothing is determined.
- If $\nabla g = \mathbf{0}$ at a point of the constraint, the method can miss it: check that point directly.
- With no closed bounded constraint, a solution of the system need not be an extremum.
:::

## Worked problems

::::exercise[A tilted ellipse]
Find the points of $x^2 + xy + y^2 = 3$ closest to and farthest from the origin.

:::solution
Use $f = x^2 + y^2$. The system is $2x = \lambda(2x + y)$, $2y = \lambda(x + 2y)$.

Cross-multiplying to remove $\lambda$: $2x(x + 2y) = 2y(2x + y)$, which simplifies to $x^2 = y^2$.

If $y = x$: $3x^2 = 3$, so $(1, 1)$ and $(-1, -1)$, with $f = 2$.

If $y = -x$: $x^2 = 3$, so $(\sqrt{3}, -\sqrt{3})$ and $(-\sqrt{3}, \sqrt{3})$, with $f = 6$.

Closest at distance $\sqrt{2}$, farthest at distance $\sqrt{6}$: the semi-axes of a tilted ellipse, along $y = \pm x$.
:::
::::

:::note[Pattern at work]
Steps 1 to 5. Step 3 by cross-multiplying is safe, because nothing is divided.
:::

::::exercise[A linear function on a sphere]
Find the extreme values of $f = x + 2y + 2z$ on $x^2 + y^2 + z^2 = 9$.

:::solution
$1 = 2\lambda x$, $2 = 2\lambda y$, $2 = 2\lambda z$. None of these can have $\lambda = 0$, so $x = \frac{1}{2\lambda}$ and $y = z = \frac{1}{\lambda}$, which gives $y = z = 2x$. The constraint gives $9x^2 = 9$, so $x = \pm 1$.

The points are $(1, 2, 2)$ with $f = 9$ and $(-1, -2, -2)$ with $f = -9$. So the maximum is $9$ and the minimum is $-9$.
:::
::::

:::note[Pattern at work]
The left sides are constants, so step 3 is a safe division. The answer points along $\langle 1, 2, 2 \rangle$: the gradient of $f$ is the direction of fastest increase.
:::

::::exercise[Two constraints]
Find the point on the line $x + y = 2$, $y + z = 2$ closest to the origin.

:::solution
Minimize $f = x^2 + y^2 + z^2$:

$$
2x = \lambda , \qquad 2y = \lambda + \mu , \qquad 2z = \mu .
$$

So $y = x + z$. Then $2x + z = 2$ and $x + 2z = 2$, giving $x = z = \frac23$ and $y = \frac43$. The value is $f = \frac83$. The constraint is a line, so the function has a minimum and no maximum, and this one point is it.
:::
::::

:::note[Pattern at work]
Step 6. The two multipliers are removed by adding the first and third equations.
:::
