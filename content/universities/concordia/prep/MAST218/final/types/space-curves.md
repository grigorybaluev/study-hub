---
title: Vector functions and space curves
order: 7
asks: domain and limits, tangent lines, position from acceleration, arc length, curvature, components of acceleration
units: [vector-functions, motion-arc-length-curvature]
---

## Logic

A vector function is three ordinary functions, so limits, derivatives and integrals are done
component by component. The geometry comes from just two vectors at the parameter asked: $\mathbf{r}'$
and $\mathbf{r}''$. Their lengths, dot product and cross product give the speed, the curvature and the
split of the acceleration.

## Pattern

:::steps[From r(t) to everything]
1. Differentiate twice: $\mathbf{r}'$, $\mathbf{r}''$. Evaluate at the parameter if one is given.
2. Tangent line: $\mathbf{r}(t_0) + s\,\mathbf{r}'(t_0)$. For the parameter at a point, solve one coordinate and confirm with the others.
3. Speed and length: $|\mathbf{r}'|$, and $L = \int_a^b |\mathbf{r}'|\,dt$. Look for a perfect square or $\cos^2 + \sin^2$.
4. Curvature: $\kappa = \frac{|\mathbf{r}' \times \mathbf{r}''|}{|\mathbf{r}'|^3}$; for a graph $\frac{|f''|}{(1 + f'^2)^{3/2}}$.
5. Components: $a_T = \frac{\mathbf{r}' \cdot \mathbf{r}''}{|\mathbf{r}'|}$, $a_N = \frac{|\mathbf{r}' \times \mathbf{r}''|}{|\mathbf{r}'|}$.
6. Backward: integrate each component and fix one constant vector per integration from the initial data.
:::

## Traps

:::caution[Traps]
- The speed is a number and the velocity a vector.
- $\kappa$ has the cube of the speed below; $a_N$ has the first power.
- Substitute the initial $t$ into the antiderivative to find $\mathbf{C}$: $\mathbf{C}$ is not automatically the initial vector.
- Two curves meeting need two parameters.
- The tangent line needs its own parameter, since $t_0$ is a fixed number.
- A curve of intersection: parametrize the cylinder first, then solve the other surface for the remaining variable.
:::

## Worked problems

::::exercise[Length and curvature of one curve]
For $\mathbf{r}(t) = \langle 6t,\ 3\sqrt{2}\,t^2,\ 2t^3 \rangle$: find the length from $t = 0$ to $t = 1$, the curvature as a function of $t$, and $a_T$ and $a_N$.

:::solution
$\mathbf{r}' = \langle 6, 6\sqrt{2}\,t, 6t^2 \rangle$ and $\mathbf{r}'' = \langle 0, 6\sqrt{2}, 12t \rangle$.

The speed is $\sqrt{36 + 72t^2 + 36t^4} = 6(1 + t^2)$, so $L = \int_0^1 6(1 + t^2)\,dt = 8$.

$\mathbf{r}' \times \mathbf{r}'' = \langle 36\sqrt{2}\,t^2,\ -72t,\ 36\sqrt{2} \rangle$, of length $36\sqrt{2}(1 + t^2)$. So

$$
\kappa(t) = \frac{36\sqrt{2}(1 + t^2)}{216(1 + t^2)^3} = \frac{\sqrt{2}}{6(1 + t^2)^2} .
$$

$\mathbf{r}' \cdot \mathbf{r}'' = 72t + 72t^3 = 72t(1 + t^2)$, so $a_T = 12t$ and $a_N = 6\sqrt{2}$.
:::
::::

:::note[Pattern at work]
Steps 1, 3, 4, 5. The factor $1 + t^2$ survives through everything because the root was a perfect square.
:::

::::exercise[A curve of intersection and its tangent]
Find a vector function for the curve where $x^2 + y^2 = 9$ meets $z = x + y$, and the tangent line at $(0, 3, 3)$.

:::solution
$x = 3\cos t$, $y = 3\sin t$, $z = 3\cos t + 3\sin t$. The point $(0, 3, 3)$ is at $t = \frac{\pi}{2}$.

$\mathbf{r}'(t) = \langle -3\sin t, 3\cos t, -3\sin t + 3\cos t \rangle$, so $\mathbf{r}'\left(\frac{\pi}{2}\right) = \langle -3, 0, -3 \rangle$. The tangent line is $x = -3s$, $y = 3$, $z = 3 - 3s$.
:::
::::

:::note[Pattern at work]
Parametrize the cylinder, then step 2.
:::

::::exercise[From acceleration back to position]
A particle has $\mathbf{a}(t) = \langle 0, 2, -6t \rangle$, $\mathbf{v}(0) = \langle 1, 0, 0 \rangle$ and $\mathbf{r}(0) = \langle 0, 0, 1 \rangle$. Find $\mathbf{r}(t)$. At $t = 1$, find the speed, $a_T$, $a_N$ and $\kappa$.

:::solution
$\mathbf{v}(t) = \langle 1, 2t, -3t^2 \rangle$ and $\mathbf{r}(t) = \langle t, t^2, 1 - t^3 \rangle$.

At $t = 1$: $\mathbf{v} = \langle 1, 2, -3 \rangle$ with speed $\sqrt{14}$, and $\mathbf{a} = \langle 0, 2, -6 \rangle$.

$\mathbf{v} \cdot \mathbf{a} = 22$, so $a_T = \frac{22}{\sqrt{14}}$. $\mathbf{v} \times \mathbf{a} = \langle -6, 6, 2 \rangle$ has length $2\sqrt{19}$, so $a_N = \frac{2\sqrt{19}}{\sqrt{14}}$ and $\kappa = \frac{2\sqrt{19}}{14\sqrt{14}}$.

Check: $a_T^2 + a_N^2 = \frac{484 + 76}{14} = 40 = |\mathbf{a}|^2$.
:::
::::

:::note[Pattern at work]
Step 6, then steps 4 and 5 at the point. The last line is a free check that catches any arithmetic slip.
:::
