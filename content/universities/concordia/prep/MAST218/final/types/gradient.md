---
title: Gradient and directional derivatives
order: 10
asks: the rate in a direction, fastest increase, level directions, tangent planes to level surfaces
units: [gradient-directional-derivatives]
---

## Logic

The gradient is the partials written as one vector, evaluated at the point. Three readings answer
almost everything. Dot it with a unit vector to get a rate. Take its direction and length for the
fastest increase. Use it as a normal for a level curve or level surface.

## Pattern

:::steps[Reading the gradient]
1. Compute $\nabla f$ and evaluate at the point.
2. Rate in a direction: make $\mathbf{u}$ a unit vector, then $D_{\mathbf{u}}f = \nabla f \cdot \mathbf{u}$.
3. Fastest increase: direction $\nabla f$, rate $|\nabla f|$. Fastest decrease: $-\nabla f$, rate $-|\nabla f|$.
4. No change: directions perpendicular to $\nabla f$. In the plane, swap the components and change one sign.
5. Level surface $F = k$: normal $\nabla F(P)$, so the tangent plane is $\nabla F(P) \cdot \langle x - x_0, y - y_0, z - z_0 \rangle = 0$, and the normal line is $\mathbf{r}_0 + t\,\nabla F(P)$.
6. A graph $z = f(x, y)$ is $F = f - z = 0$, with normal $\langle f_x, f_y, -1 \rangle$.
:::

## Traps

:::caution[Traps]
- Normalize the direction first. "Toward $Q$" means $\overrightarrow{PQ}$, not the vector $Q$.
- The gradient of $f(x, y)$ lives in the plane: it is perpendicular to the level curve, not to the graph.
- The maximum rate is a number, the direction is a vector: give both.
- For a surface, use all three variables: put everything into $F$ first.
:::

## Worked problems

::::exercise[Every reading at one point]
For $f(x, y) = x^3y^2$ at $P(1, 2)$: find the rate of change toward $Q(4, 6)$, the maximum rate and its direction, and the directions of no change.

:::solution
$\nabla f = \langle 3x^2y^2, 2x^3y \rangle$, so $\nabla f(1, 2) = \langle 12, 4 \rangle$.

Toward $Q$: $\overrightarrow{PQ} = \langle 3, 4 \rangle$, of length $5$, so $D_{\mathbf{u}}f = \frac{36 + 16}{5} = \frac{52}{5}$.

Maximum: $|\nabla f| = \sqrt{160} = 4\sqrt{10}$, in the direction $\frac{1}{\sqrt{10}}\langle 3, 1 \rangle$.

No change: $\pm\frac{1}{\sqrt{10}}\langle 1, -3 \rangle$.
:::
::::

:::note[Pattern at work]
Steps 1 to 4 on one vector. Note that the first rate, about $10.4$, is below the maximum, about $12.6$: a useful sanity check.
:::

::::exercise[Tangent planes from gradients]
(a) Find the tangent plane and the normal line of $x^2 + 2y^2 + 3z^2 = 6$ at $(1, 1, 1)$. (b) At which point of $z = x^2 + y^2$ is the tangent plane parallel to $2x + 4y - z = 1$?

:::solution
(a) $\nabla F = \langle 2x, 4y, 6z \rangle = \langle 2, 4, 6 \rangle$, or $\langle 1, 2, 3 \rangle$. The plane is $x + 2y + 3z = 6$, and the normal line is $x = 1 + t$, $y = 1 + 2t$, $z = 1 + 3t$.

(b) The surface has normal $\langle 2x, 2y, -1 \rangle$ and the plane has normal $\langle 2, 4, -1 \rangle$. With equal third components, these are parallel when $2x = 2$ and $2y = 4$: the point $(1, 2, 5)$.
:::
::::

:::note[Pattern at work]
(a) is step 5, and any multiple of the gradient serves as the normal. (b) is step 6 used in reverse, an equation between normals.
:::

::::exercise[Fastest cooling]
The temperature in a room is $T(x, y, z) = xy + yz + zx$. At $(1, 2, 3)$, in which direction does it fall fastest, and at what rate?

:::solution
$\nabla T = \langle y + z, x + z, x + y \rangle = \langle 5, 4, 3 \rangle$. It falls fastest along $-\langle 5, 4, 3 \rangle$, at the rate $|\nabla T| = \sqrt{50} = 5\sqrt{2}$.
:::
::::

:::note[Pattern at work]
Step 3 with three variables and the sign reversed.
:::
