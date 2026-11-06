---
title: Partial derivatives, tangent planes and the chain rule
order: 9
asks: partials of every order, tangent plane, linear approximation, differentials, chain rule, implicit differentiation
units: [partial-derivatives-chain-rule]
---

## Logic

Differentiate in one variable with the others frozen. Evaluated at a point, the partials are the
slopes that fix the tangent plane, and the same formula is the linear approximation. The chain rule
adds one term for each route a change can travel from the top of the tree to the bottom.

## Pattern

:::steps[Tangent plane and estimate]
1. Evaluate $f$, $f_x$, $f_y$ at the base point, which should be a nearby point with easy numbers.
2. Write $z = f(a, b) + f_x(a, b)(x - a) + f_y(a, b)(y - b)$.
3. To estimate, substitute the target point into the right side.
4. For errors: $dz = f_x\,dx + f_y\,dy$, with the errors as $dx$, $dy$, both at their worst.
:::

:::steps[Chain rule by the tree]
1. Draw the tree: dependent variable, intermediate variables, independent variables.
2. For $\partial z / \partial s$: for each path from $z$ to $s$, multiply the derivatives along it, and add.
3. Substitute, so that the answer is in the bottom variables or a number.
4. Implicit: $\frac{dy}{dx} = -\frac{F_x}{F_y}$, $\frac{\partial z}{\partial x} = -\frac{F_x}{F_z}$, with $F$ collected on one side.
:::

## Traps

:::caution[Traps]
- Evaluate the partials at the base point, not at the target.
- In the tangent plane, only $x$, $y$ (and $z$) stay as letters.
- The implicit formulas carry a minus sign.
- $d$ for one independent variable, $\partial$ for several.
- Having both partials at a point does not guarantee differentiability; continuity of the partials does.
:::

## Worked problems

::::exercise[A tangent plane and an estimate]
For $f(x, y) = \ln(x^2 + 3y)$, find the tangent plane at $(2, -1)$ and estimate $f(2.05, -0.98)$.

:::solution
$f(2, -1) = \ln 1 = 0$. $f_x = \frac{2x}{x^2 + 3y} = 4$ and $f_y = \frac{3}{x^2 + 3y} = 3$ at the point. So

$$
z = 4(x - 2) + 3(y + 1) ,
\qquad
f(2.05, -0.98) \approx 4(0.05) + 3(0.02) = 0.26 .
$$

The true value is about $0.233$. The steps are not so small here, because the denominator is $1$ and changes quickly.
:::
::::

:::note[Pattern at work]
Steps 1 to 3. The base point was chosen so that the logarithm is $0$.
:::

::::exercise[A chain rule in polar variables]
For $z = x^2y - y^2$ with $x = s\cos t$, $y = s\sin t$, find $z_s$ and $z_t$ at $(s, t) = (2, 0)$.

:::solution
At $(2, 0)$: $x = 2$, $y = 0$. $z_x = 2xy = 0$ and $z_y = x^2 - 2y = 4$. The inner derivatives are $x_s = \cos t = 1$, $y_s = \sin t = 0$, $x_t = -s\sin t = 0$, $y_t = s\cos t = 2$. So

$$
z_s = 0(1) + 4(0) = 0 ,
\qquad
z_t = 0(0) + 4(2) = 8 .
$$
:::
::::

:::note[Pattern at work]
Two paths to each of $s$ and $t$. Evaluating everything first keeps each term a single number.
:::

::::exercise[Implicit slopes and a measurement error]
(a) Find $z_x$ and $z_y$ at $(1, 3, 1)$ if $xz + yz^2 + x^2 = 5$. (b) A box measures $10 \times 6 \times 4$ cm, each side to within $0.1$ cm. Estimate the maximum error in its volume.

:::solution
(a) $F = xz + yz^2 + x^2 - 5$. At the point, $F_x = z + 2x = 3$, $F_y = z^2 = 1$ and $F_z = x + 2yz = 7$. So $z_x = -\frac37$ and $z_y = -\frac17$.

(b) $V = lwh$, so $dV = wh\,dl + lh\,dw + lw\,dh = (24 + 40 + 60)(0.1) = 12.4$ cm³, out of $240$ cm³: about $5$ %.
:::
::::

:::note[Pattern at work]
(a) is step 4 of the tree list with the formula. (b) is step 4 of the plane list, with three variables.
:::
