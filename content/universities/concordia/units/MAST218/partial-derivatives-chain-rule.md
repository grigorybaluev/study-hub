---
title: Partial derivatives, tangent planes and the chain rule
order: 12
status: detailed
weeks: [9, 10]
introduces: [partial-derivative, tangent-plane, multivariable-chain-rule]
requires:
  - {concept: derivative, strength: hard}
  - {concept: chain-rule, strength: hard}
  - {concept: multivariable-function, strength: hard}
  - {concept: line-and-plane-equations, strength: soft}
reinforces:
  - {concept: linear-approximation, perspective: "in several variables: the tangent plane near a point, differentials and error estimates"}
---

A function of two variables has no single rate of change: the surface may rise going east and fall
going north. The way in is to move one variable at a time. Holding $y$ fixed turns $f(x, y)$ into a
function of $x$ alone, with an ordinary derivative. The two partial derivatives obtained this way give
the slopes of the surface along two directions, and those slopes fix the tangent plane, the flat
surface that best fits the graph near a point. The chain rule then follows the same idea through
compositions: every way a change can travel contributes one term.

## Partial derivatives

### Definition

:::definition[Partial derivative]
The **partial derivatives** of $f(x, y)$ at $(a, b)$ are

$$
f_x(a, b) = \lim_{h \to 0} \frac{f(a + h, b) - f(a, b)}{h} ,
\qquad
f_y(a, b) = \lim_{h \to 0} \frac{f(a, b + h) - f(a, b)}{h} ,
$$

when the limits exist. Other notations for $z = f(x, y)$:

$$
f_x = \frac{\partial f}{\partial x} = \frac{\partial z}{\partial x} = D_x f ,
\qquad
f_y = \frac{\partial f}{\partial y} = \frac{\partial z}{\partial y} = D_y f .
$$
:::

Nothing new is needed to compute one.

:::steps[Computing a partial derivative]
1. To find $f_x$, treat $y$ as a constant and differentiate with respect to $x$.
2. To find $f_y$, treat $x$ as a constant and differentiate with respect to $y$.
3. To evaluate at a point, differentiate first, then substitute.
:::

::::example[Partials of a polynomial]
Find $f_x(1, 2)$ and $f_y(1, 2)$ for $f(x, y) = x^3y^2 + 2x - y$.

:::solution
Treating $y$ as a constant, $y^2$ is a constant factor and $-y$ a constant term: $f_x = 3x^2y^2 + 2$.
Treating $x$ as a constant: $f_y = 2x^3y - 1$. At $(1, 2)$: $f_x = 14$ and $f_y = 3$.
:::
::::

::::example[Partials with the product and chain rules]
Find $f_x$ and $f_y$ for $f(x, y) = \sin(xy) + x^2y$.

:::solution
The chain rule on $\sin(xy)$: the inner function $xy$ has $x$-derivative $y$, so

$$
f_x = y\cos(xy) + 2xy ,
\qquad
f_y = x\cos(xy) + x^2 .
$$
:::
::::

With more variables, the rule is the same: all the variables but one are held fixed. For
$w = xy^2z^3$,

$$
\frac{\partial w}{\partial x} = y^2z^3 ,
\qquad
\frac{\partial w}{\partial y} = 2xyz^3 ,
\qquad
\frac{\partial w}{\partial z} = 3xy^2z^2 .
$$

### Geometric meaning

Fixing $y = b$ cuts the surface $z = f(x, y)$ with a vertical plane, leaving the curve
$z = f(x, b)$. Its slope at $x = a$ is $f_x(a, b)$. In the same way, $f_y(a, b)$ is the slope of the
curve cut by $x = a$. So the partial derivatives are the slopes of the surface in the directions of
the $x$-axis and the $y$-axis, and they are rates of change: if $T(x, y)$ is a temperature in degrees
and $x$ a distance in metres, $T_x$ is in degrees per metre going in the direction of increasing $x$.

:::caution[A variable held constant is still a variable afterwards]
The constant in $f_x$ is only constant while differentiating. In $f_x(x, y) = 3x^2y^2 + 2$ the letter
$y$ stays in the answer: $f_x$ is again a function of both variables. A frequent slip in the other
direction is to apply the product rule to $x^2 \cdot y$ when differentiating in $x$, where $y$ is just
a coefficient.
:::

### Implicit partial derivatives

If $z$ is defined implicitly by an equation in $x$, $y$, $z$, differentiate the equation with respect
to $x$, treating $y$ as a constant and $z$ as a function of $x$ and $y$.

::::example[A surface given by an equation]
The equation $x^2 + yz + z^3 = 3$ defines $z$ near $(1, 1, 1)$. Find $\frac{\partial z}{\partial x}$ and $\frac{\partial z}{\partial y}$ there.

:::solution
Differentiating with respect to $x$:

$$
2x + y\,\frac{\partial z}{\partial x} + 3z^2\,\frac{\partial z}{\partial x} = 0
\quad\Longrightarrow\quad
\frac{\partial z}{\partial x} = -\frac{2x}{y + 3z^2} .
$$

Differentiating with respect to $y$:

$$
z + y\,\frac{\partial z}{\partial y} + 3z^2\,\frac{\partial z}{\partial y} = 0
\quad\Longrightarrow\quad
\frac{\partial z}{\partial y} = -\frac{z}{y + 3z^2} .
$$

At $(1, 1, 1)$: $\frac{\partial z}{\partial x} = -\frac12$ and $\frac{\partial z}{\partial y} = -\frac14$.
:::
::::

### Higher derivatives

The partials are functions of $x$ and $y$, so they have partials of their own.

:::definition[Second partial derivatives]
The four **second partial derivatives** of $z = f(x, y)$ are

$$
f_{xx} = \frac{\partial^2 z}{\partial x^2} ,
\qquad
f_{yy} = \frac{\partial^2 z}{\partial y^2} ,
\qquad
f_{xy} = (f_x)_y = \frac{\partial^2 z}{\partial y\,\partial x} ,
\qquad
f_{yx} = (f_y)_x = \frac{\partial^2 z}{\partial x\,\partial y} .
$$
:::

The notation reads in opposite directions: $f_{xy}$ means $x$ first and then $y$, and so does
$\frac{\partial^2 z}{\partial y\,\partial x}$, read from right to left. It rarely matters, because of
the following theorem.

:::theorem[Clairaut's theorem]
If $f_{xy}$ and $f_{yx}$ are both continuous on a disk around $(a, b)$, then
$f_{xy}(a, b) = f_{yx}(a, b)$.
:::

::::example[Mixed partials agree]
Find the second partials of $f(x, y) = x^3y + e^{xy}$.

:::solution
$f_x = 3x^2y + ye^{xy}$ and $f_y = x^3 + xe^{xy}$. Then

$$
f_{xx} = 6xy + y^2e^{xy} ,
\qquad
f_{yy} = x^2e^{xy} ,
$$

and both mixed partials come out the same:

$$
f_{xy} = 3x^2 + e^{xy} + xye^{xy} = f_{yx} .
$$
:::
::::

Partial derivatives are also the language of the laws of physics. The **Laplace equation**
$u_{xx} + u_{yy} = 0$ governs steady temperatures, and the **wave equation** $u_{tt} = a^2u_{xx}$
governs vibrations. Checking a solution is a matter of computing partials: $u = e^x\cos y$ has
$u_{xx} = e^x\cos y$ and $u_{yy} = -e^x\cos y$, so it solves the Laplace equation.

:::equations{#partials}
- *Partial in $x$*: $f_x(a, b) = \lim_{h \to 0} \dfrac{f(a + h, b) - f(a, b)}{h}$.
- *Clairaut*: $f_{xy} = f_{yx}$ when both are continuous.
- *Laplace equation*: $u_{xx} + u_{yy} = 0$.
- *Wave equation*: $u_{tt} = a^2u_{xx}$.
:::

## Tangent planes and linear approximation

### The tangent plane

Zoom in on a smooth curve and it looks like its tangent line. Zoom in on a smooth surface and it
looks like a plane, which contains the tangent lines of all the curves on the surface through the
point. Two of those curves are already known: the traces in the $x$ and $y$ directions, with slopes
$f_x(a, b)$ and $f_y(a, b)$. Their tangents have the directions $\langle 1, 0, f_x \rangle$ and
$\langle 0, 1, f_y \rangle$, and the cross product of those two is a normal to the plane,
$\langle -f_x, -f_y, 1 \rangle$.

:::definition[Tangent plane]
If $f$ has continuous partial derivatives, the **tangent plane** to $z = f(x, y)$ at
$P(a, b, f(a, b))$ is

$$
z = f(a, b) + f_x(a, b)(x - a) + f_y(a, b)(y - b) ,
$$

and $\langle f_x(a, b), f_y(a, b), -1 \rangle$ is a normal vector of it.
:::

::::example[A tangent plane to a paraboloid]
Find the tangent plane to $z = x^2 - xy + 2y^2$ at $(2, 1, 4)$.

:::solution
$f_x = 2x - y$ and $f_y = -x + 4y$, so $f_x(2, 1) = 3$ and $f_y(2, 1) = 2$. Then

$$
z = 4 + 3(x - 2) + 2(y - 1) \quad\Longleftrightarrow\quad z = 3x + 2y - 4 .
$$
:::
::::

::::example[A tangent plane to a cone]
Find the tangent plane to $z = \sqrt{x^2 + y^2}$ at $(3, 4, 5)$. Does it have one at the origin?

:::solution
$f_x = \frac{x}{\sqrt{x^2 + y^2}}$ and $f_y = \frac{y}{\sqrt{x^2 + y^2}}$, so $f_x(3, 4) = \frac35$ and $f_y(3, 4) = \frac45$:

$$
z = 5 + \frac35(x - 3) + \frac45(y - 4) \quad\Longleftrightarrow\quad z = \frac35x + \frac45y .
$$

At the origin the partials do not exist: along the $x$-axis the surface is $z = |x|$, with a corner.
The tip of a cone has no tangent plane.
:::
::::

### Linear approximation

Near the point of tangency the plane stays close to the surface, and the plane is much easier to
evaluate.

:::definition[Linearization]
The **linearization** of $f$ at $(a, b)$ is

$$
L(x, y) = f(a, b) + f_x(a, b)(x - a) + f_y(a, b)(y - b) ,
$$

and $f(x, y) \approx L(x, y)$ is the **linear approximation** of $f$ near $(a, b)$.
:::

::::example[Estimating a value]
Estimate $\sqrt{3.02^2 + 3.97^2}$ with a linear approximation.

:::solution
Use $f(x, y) = \sqrt{x^2 + y^2}$ near $(3, 4)$, where everything was just computed. So

$$
f(3.02, 3.97) \approx 5 + \frac35(0.02) + \frac45(-0.03) = 5 + 0.012 - 0.024 = 4.988 .
$$

The true value is $4.98812$ to five decimals.
:::
::::

### Differentiability

For one variable, having a derivative is enough for a tangent line that fits. For two variables, it
is not: partial derivatives only look along two lines. The function

$$
f(x, y) = \frac{xy}{x^2 + y^2} , \qquad f(0, 0) = 0
$$

is $0$ on both axes, so $f_x(0, 0) = f_y(0, 0) = 0$ and the formula offers the plane $z = 0$. But the
function is not even continuous at the origin: it is $\frac12$ along $y = x$. The plane does not fit,
and the stronger notion is the following.

:::definition[Differentiable function of two variables]
$f$ is **differentiable** at $(a, b)$ if

$$
\begin{aligned}
&f(a + \Delta x, b + \Delta y) \\
&\quad = f(a, b) + f_x(a, b)\,\Delta x + f_y(a, b)\,\Delta y \\
&\qquad + \varepsilon_1\,\Delta x + \varepsilon_2\,\Delta y ,
\end{aligned}
$$

where $\varepsilon_1, \varepsilon_2 \to 0$ as $(\Delta x, \Delta y) \to (0, 0)$.
:::

In words: the error of the linear approximation is small even compared with the size of the step.
A differentiable function is continuous, and the tangent plane really is tangent. Checking the
definition directly is rarely necessary because of the next theorem.

:::theorem[Continuous partials imply differentiability]
If $f_x$ and $f_y$ exist near $(a, b)$ and are continuous at $(a, b)$, then $f$ is differentiable at $(a, b)$.
:::

Every polynomial, and every combination of smooth functions away from the points where they break down, satisfies this.

### Differentials

The differential writes the linear approximation as a statement about small changes.

:::definition[Total differential]
For $z = f(x, y)$, the **total differential** is

$$
dz = f_x(x, y)\,dx + f_y(x, y)\,dy .
$$
:::

With $dx = \Delta x$ and $dy = \Delta y$, $dz$ is the change in height along the tangent plane, and
$\Delta z$ the change along the surface; $dz \approx \Delta z$ for small steps. This is how errors in
measurements are propagated.

::::example[The error in a computed volume]
A cylinder is measured with radius $5$ cm and height $12$ cm, with possible errors of at most $0.02$ cm and $0.05$ cm. Estimate the maximum error in the computed volume.

:::solution
$V = \pi r^2h$, so $dV = 2\pi rh\,dr + \pi r^2\,dh$. Taking both errors at their worst, with the same sign:

$$
dV = 2\pi(5)(12)(0.02) + \pi(25)(0.05) = 2.4\pi + 1.25\pi = 3.65\pi \approx 11.5 \text{ cm}^3 .
$$

The computed volume is $300\pi \approx 942.5$ cm³, so the relative error is about $1.2$ %. The radius
contributes more than the height, because it enters squared.
:::
::::

```sim
id: tangent-plane
controls:
  - {id: fn, label: "Function (0: 4 − x² − 2y², 1: x² − y², 2: sin x cos y, 3: √(x² + y²))", min: 0, max: 3, step: 1, default: 0, decimals: 0}
  - {id: a, label: Point a, min: -1.5, max: 1.5, step: 0.05, default: 0.8, decimals: 2}
  - {id: b, label: Point b, min: -1.5, max: 1.5, step: 0.05, default: 0.5, decimals: 2}
  - {id: w, label: Window half-width, min: 0.1, max: 2, step: 0.05, default: 1, decimals: 2}
note: 'The blue plane is z = L(x, y) at the red point; the yellow and green lines are the slopes in the x and y directions, which fix it. Shrink the window and the surface flattens onto the plane: the title gives the largest gap between them in the window, which falls much faster than the width. On the cone (function 3) move the point to (0, 0): the partials stop existing, and no plane fits at any zoom.'
```

The estimate of the earlier example, by machine:

```python
# The linearization and its error near (3, 4), with sympy.
from sympy import symbols, sqrt, diff

x, y = symbols('x y')
f = sqrt(x**2 + y**2)
at = {x: 3, y: 4}
L = f.subs(at) + diff(f, x).subs(at)*(x - 3) + diff(f, y).subs(at)*(y - 4)
new = {x: 3.02, y: 3.97}
print(L.subs(new), f.subs(new))   # 4.98800000000000 4.98811587676149
```

:::insight
A surface near a point is a plane up to a small error, and the partial derivatives are the slopes of
that plane. Linear approximation, differentials and error estimates are all this one statement.
:::

:::equations{#tangent-plane}
- *Tangent plane*: $z = f(a, b) + f_x(a, b)(x - a) + f_y(a, b)(y - b)$.
- *Normal of a graph*: $\langle f_x(a, b), f_y(a, b), -1 \rangle$.
- *Total differential*: $dz = f_x\,dx + f_y\,dy$.
:::

## The chain rule

### One independent variable

Suppose $z = f(x, y)$ and the point moves: $x = x(t)$, $y = y(t)$. Then $z$ is a function of $t$
alone. A small change in $t$ changes $x$ and $y$, and each of them changes $z$.

::::theorem[Chain rule, one independent variable]
If $z = f(x, y)$ is differentiable and $x = x(t)$, $y = y(t)$ are differentiable, then

$$
\frac{dz}{dt} = \frac{\partial z}{\partial x}\frac{dx}{dt} + \frac{\partial z}{\partial y}\frac{dy}{dt} .
$$

:::proof
A change $\Delta t$ produces changes $\Delta x$, $\Delta y$. By differentiability,

$$
\Delta z = f_x\,\Delta x + f_y\,\Delta y + \varepsilon_1\,\Delta x + \varepsilon_2\,\Delta y .
$$

Divide by $\Delta t$ and let $\Delta t \to 0$. Then $\Delta x, \Delta y \to 0$ because $x(t)$ and
$y(t)$ are continuous, so $\varepsilon_1, \varepsilon_2 \to 0$, and the last two terms vanish.
:::
::::

The two terms are the two routes from $t$ to $z$: one through $x$, one through $y$.

::::example[Along a circle]
Find $\frac{dz}{dt}$ at $t = \frac{\pi}{4}$ for $z = x^2y$, $x = \cos t$, $y = \sin t$.

:::solution
$$
\frac{dz}{dt} = 2xy\,\frac{dx}{dt} + x^2\,\frac{dy}{dt} = 2\cos t\sin t\,(-\sin t) + \cos^2 t\,\cos t = -2\cos t\sin^2 t + \cos^3 t .
$$

At $t = \frac{\pi}{4}$, with $\cos t = \sin t = \frac{\sqrt{2}}{2}$, this is
$-2\left(\frac{\sqrt{2}}{2}\right)^3 + \left(\frac{\sqrt{2}}{2}\right)^3 = -\frac{\sqrt{2}}{4}$.

Check by substituting first: $z = \cos^2 t\sin t$, and differentiating gives the same expression.
:::
::::

::::example[The temperature felt along a path]
The temperature on a plate is $T(x, y) = 100 - x^2 - 2y^2$. An ant moves with $x = 1 + t$, $y = 2 - t$. How fast does its temperature change at $t = 0$?

:::solution
At $t = 0$ the ant is at $(1, 2)$. There $T_x = -2x = -2$ and $T_y = -4y = -8$, and $x' = 1$, $y' = -1$:

$$
\frac{dT}{dt} = (-2)(1) + (-8)(-1) = 6 .
$$

The temperature rises at $6$ degrees per unit of time: the ant is moving toward the warm centre.
:::
::::

::::example[A triangle changing shape]
The legs of a right triangle are $x = 3$ cm, growing at $2$ cm/s, and $y = 4$ cm, shrinking at $1$ cm/s. How fast do the hypotenuse and the area change?

:::solution
The hypotenuse is $h = \sqrt{x^2 + y^2} = 5$, with

$$
\frac{dh}{dt} = \frac{x}{h}\frac{dx}{dt} + \frac{y}{h}\frac{dy}{dt} = \frac35(2) + \frac45(-1) = \frac25 \text{ cm/s} .
$$

The area is $A = \frac12xy$, with

$$
\frac{dA}{dt} = \frac12y\,\frac{dx}{dt} + \frac12x\,\frac{dy}{dt} = \frac12(4)(2) + \frac12(3)(-1) = \frac52 \text{ cm}^2\text{/s} .
$$
:::
::::

### Two independent variables

If $x$ and $y$ depend on two variables $s$ and $t$, then $z$ does too. Changing $s$ with $t$ held
fixed is the one-variable case with partial derivatives written throughout.

:::theorem[Chain rule, two independent variables]
If $z = f(x, y)$ with $x = x(s, t)$, $y = y(s, t)$, all differentiable, then

$$
\frac{\partial z}{\partial s} = \frac{\partial z}{\partial x}\frac{\partial x}{\partial s} + \frac{\partial z}{\partial y}\frac{\partial y}{\partial s} ,
\qquad
\frac{\partial z}{\partial t} = \frac{\partial z}{\partial x}\frac{\partial x}{\partial t} + \frac{\partial z}{\partial y}\frac{\partial y}{\partial t} .
$$
:::

::::example[Two parameters at a point]
Find $\frac{\partial z}{\partial s}$ and $\frac{\partial z}{\partial t}$ at $(s, t) = (1, 2)$ for $z = x^2 + xy$, $x = st$, $y = s + t$.

:::solution
At $(1, 2)$: $x = 2$, $y = 3$. The outer partials are $z_x = 2x + y = 7$ and $z_y = x = 2$. The inner ones are $x_s = t = 2$, $y_s = 1$, $x_t = s = 1$, $y_t = 1$. So

$$
\frac{\partial z}{\partial s} = 7(2) + 2(1) = 16 ,
\qquad
\frac{\partial z}{\partial t} = 7(1) + 2(1) = 9 .
$$

Check: $z = s^2t^2 + s^2t + st^2$ directly gives $z_s = 2st^2 + 2st + t^2 = 16$ and $z_t = 2s^2t + s^2 + 2st = 9$.
:::
::::

### The tree

Any number of variables follows one pattern, and a tree diagram keeps the count.

:::steps[The chain rule by a tree]
1. Put the dependent variable at the top, the intermediate variables below it, the independent variables at the bottom.
2. Join each variable to the variables it depends on directly, and label each branch with the partial derivative it stands for.
3. To find $\partial w / \partial s$, follow every path from $w$ down to $s$, multiply along each path, and add the paths.
4. Evaluate, or write the answer in the bottom variables only.
:::

:::theorem[Chain rule, general version]
If $u$ is a differentiable function of $x_1, \dots, x_n$, and each $x_j$ is a differentiable function of $t_1, \dots, t_m$, then for each $i$

$$
\frac{\partial u}{\partial t_i} = \sum_{j=1}^n \frac{\partial u}{\partial x_j}\frac{\partial x_j}{\partial t_i} .
$$
:::

::::example[Three intermediate variables]
Find $\frac{\partial w}{\partial s}$ and $\frac{\partial w}{\partial t}$ at $(s, t) = (1, 1)$ for $w = xy + yz + zx$, $x = s + t$, $y = s - t$, $z = st$.

:::solution
Three paths lead from $w$ to each of $s$ and $t$. At $(1, 1)$: $x = 2$, $y = 0$, $z = 1$, so $w_x = y + z = 1$, $w_y = x + z = 3$, $w_z = x + y = 2$. The inner partials are $x_s = 1$, $y_s = 1$, $z_s = t = 1$ and $x_t = 1$, $y_t = -1$, $z_t = s = 1$. Then

$$
\frac{\partial w}{\partial s} = 1(1) + 3(1) + 2(1) = 6 ,
\qquad
\frac{\partial w}{\partial t} = 1(1) + 3(-1) + 2(1) = 0 .
$$
:::
::::

:::caution[$d$ and $\partial$ are different symbols]
Use $\frac{dz}{dt}$ when $z$ ends up depending on one variable, and $\frac{\partial z}{\partial s}$ when
it depends on several. And write the result in the bottom variables, or evaluate it at the point: an
answer that mixes $x$, $y$ and $t$ is unfinished.
:::

### Implicit differentiation

The chain rule gives implicit differentiation as a formula. If $F(x, y) = 0$ defines $y$ as a function
of $x$, then differentiating with respect to $x$ gives $F_x + F_y\,\frac{dy}{dx} = 0$.

:::theorem[Implicit differentiation formulas]
If $F(x, y) = 0$ defines $y$ as a differentiable function of $x$, and $F_y \ne 0$,

$$
\frac{dy}{dx} = -\frac{F_x}{F_y} .
$$

If $F(x, y, z) = 0$ defines $z$ as a differentiable function of $x$ and $y$, and $F_z \ne 0$,

$$
\frac{\partial z}{\partial x} = -\frac{F_x}{F_z} ,
\qquad
\frac{\partial z}{\partial y} = -\frac{F_y}{F_z} .
$$
:::

::::example[Implicit slopes by formula]
Find $\frac{dy}{dx}$ at $(1, 2)$ on $x^2y + y^3 = 10$, and redo the earlier surface $x^2 + yz + z^3 = 3$.

:::solution
With $F = x^2y + y^3 - 10$: $F_x = 2xy$ and $F_y = x^2 + 3y^2$, so

$$
\frac{dy}{dx} = -\frac{2xy}{x^2 + 3y^2} = -\frac{4}{13} \quad\text{at } (1, 2) .
$$

With $F = x^2 + yz + z^3 - 3$: $F_x = 2x$, $F_y = z$, $F_z = y + 3z^2$, so
$\frac{\partial z}{\partial x} = -\frac{2x}{y + 3z^2}$ and $\frac{\partial z}{\partial y} = -\frac{z}{y + 3z^2}$, as before.
:::
::::

:::caution[The minus sign]
It is $-\frac{F_x}{F_y}$. The sign comes from moving $F_x$ across the equation, and the fraction does
not cancel as it seems to: the $\partial F$'s are not numbers.
:::

:::insight
Every path from the top of the tree to the bottom is one route for a change to travel, and each route
contributes a product of rates. With a single route this is the chain rule of one variable.
:::

:::equations{#chain}
- *One parameter*: $\dfrac{dz}{dt} = z_x\dfrac{dx}{dt} + z_y\dfrac{dy}{dt}$.
- *Two parameters*: $\dfrac{\partial z}{\partial s} = z_x\dfrac{\partial x}{\partial s} + z_y\dfrac{\partial y}{\partial s}$.
- *Implicit curve*: $\dfrac{dy}{dx} = -\dfrac{F_x}{F_y}$.
- *Implicit surface*: $\dfrac{\partial z}{\partial x} = -\dfrac{F_x}{F_z}$, $\dfrac{\partial z}{\partial y} = -\dfrac{F_y}{F_z}$.
:::

## Further reading

- [Wikipedia — Partial derivative](https://en.wikipedia.org/wiki/Partial_derivative) — notation and the geometric picture.
- [Wikipedia — Symmetry of second derivatives](https://en.wikipedia.org/wiki/Symmetry_of_second_derivatives) — when mixed partials agree, and an example where they do not.
- [Wikipedia — Chain rule](https://en.wikipedia.org/wiki/Chain_rule) — the multivariable form, in the notation of Jacobians.
- [Wikipedia — Implicit function theorem](https://en.wikipedia.org/wiki/Implicit_function_theorem) — when an equation really does define a function.
