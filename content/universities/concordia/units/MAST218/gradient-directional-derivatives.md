---
title: Directional derivatives and the gradient
order: 13
status: detailed
weeks: [11]
introduces: [gradient, directional-derivative]
requires:
  - {concept: partial-derivative, strength: hard}
  - {concept: dot-product, strength: hard}
  - {concept: vector, strength: hard}
reinforces:
  - {concept: tangent-plane, perspective: "to level surfaces via the gradient"}
---

The partial derivatives give the slope of a surface in two directions, east and north. A walker can
head in any direction, so the slope in every other direction is wanted too. It turns out that the two
partials already contain all those slopes: stacked into one vector, the gradient, they produce the
rate in any direction by a dot product. That vector also has a meaning of its own: it points in the
direction of fastest increase, its length is that fastest rate, and it is perpendicular to the level
curves. This last fact gives tangent planes to surfaces that are not graphs.

## Directional derivatives

### The rate in a chosen direction

:::definition[Directional derivative]
The **directional derivative** of $f$ at $(a, b)$ in the direction of a **unit** vector
$\mathbf{u} = \langle u_1, u_2 \rangle$ is

$$
D_{\mathbf{u}}f(a, b) = \lim_{h \to 0} \frac{f(a + hu_1, b + hu_2) - f(a, b)}{h} ,
$$

when the limit exists.
:::

Since $\mathbf{u}$ has length $1$, a step $h$ along it covers distance $h$, so the quotient really is
change per unit of distance. Geometrically, $D_{\mathbf{u}}f(a, b)$ is the slope of the curve cut from
the surface by the vertical plane through $(a, b)$ in the direction $\mathbf{u}$. With
$\mathbf{u} = \mathbf{i}$ it is $f_x$, and with $\mathbf{u} = \mathbf{j}$ it is $f_y$.

::::example[A directional derivative from the definition]
Use the definition to find $D_{\mathbf{u}}f(1, 0)$ for $f(x, y) = x^2 + y^2$ and $\mathbf{u} = \left\langle \frac{1}{\sqrt{2}}, \frac{1}{\sqrt{2}} \right\rangle$.

:::solution
$$
\frac{f\left(1 + \frac{h}{\sqrt{2}}, \frac{h}{\sqrt{2}}\right) - 1}{h} = \frac{1 + \sqrt{2}\,h + \frac{h^2}{2} + \frac{h^2}{2} - 1}{h} = \sqrt{2} + h \to \sqrt{2} .
$$
:::
::::

### The formula

Limits are not needed in practice, because the chain rule reduces the computation to the two partials.

::::theorem[Directional derivative from the partials]
If $f$ is differentiable, then for every unit vector $\mathbf{u} = \langle u_1, u_2 \rangle$,

$$
D_{\mathbf{u}}f(x, y) = f_x(x, y)\,u_1 + f_y(x, y)\,u_2 .
$$

:::proof
Fix $(a, b)$ and let $g(h) = f(a + hu_1, b + hu_2)$. By definition $D_{\mathbf{u}}f(a, b) = g'(0)$. By
the chain rule with $x = a + hu_1$, $y = b + hu_2$,

$$
g'(h) = f_x\,\frac{dx}{dh} + f_y\,\frac{dy}{dh} = f_x\,u_1 + f_y\,u_2 ,
$$

and $h = 0$ gives the formula at $(a, b)$.
:::
::::

If the direction is given by an angle $\theta$ from the positive $x$-axis, then
$\mathbf{u} = \langle \cos\theta, \sin\theta \rangle$ and $D_{\mathbf{u}}f = f_x\cos\theta + f_y\sin\theta$.

## The gradient

### Definition

The formula is a dot product of $\mathbf{u}$ with a vector built from the partials, and that vector is
worth a name.

:::definition[Gradient]
The **gradient** of $f(x, y)$ is the vector function

$$
\nabla f(x, y) = \langle f_x(x, y), f_y(x, y) \rangle = f_x\,\mathbf{i} + f_y\,\mathbf{j} ,
$$

read "del $f$" or "grad $f$". For $f(x, y, z)$, $\nabla f = \langle f_x, f_y, f_z \rangle$.
:::

:::proposition[Directional derivative as a dot product]
For a differentiable $f$ and a unit vector $\mathbf{u}$,

$$
D_{\mathbf{u}}f = \nabla f \cdot \mathbf{u} ,
$$

in two variables or three.
:::

:::steps[Computing a directional derivative]
1. Find the partials and evaluate them at the point: $\nabla f(a, b)$.
2. Make the direction a unit vector: $\mathbf{u} = \dfrac{\mathbf{v}}{|\mathbf{v}|}$, or $\langle \cos\theta, \sin\theta \rangle$. If the direction is "toward a point $Q$", take $\mathbf{v} = \overrightarrow{PQ}$.
3. Take the dot product.
:::

::::example[In the direction of a vector]
Find the directional derivative of $f(x, y) = x^2y - y^3$ at $(2, 1)$ in the direction of $\mathbf{v} = \langle 3, 4 \rangle$.

:::solution
$\nabla f = \langle 2xy,\ x^2 - 3y^2 \rangle$, so $\nabla f(2, 1) = \langle 4, 1 \rangle$. The vector
$\mathbf{v}$ has length $5$, so $\mathbf{u} = \left\langle \frac35, \frac45 \right\rangle$ and

$$
D_{\mathbf{u}}f(2, 1) = \langle 4, 1 \rangle \cdot \left\langle \frac35, \frac45 \right\rangle = \frac{12}{5} + \frac45 = \frac{16}{5} .
$$
:::
::::

::::example[In the direction of an angle]
Find the rate of change of $f(x, y) = x^2 + xy$ at $(1, 2)$ in the direction at angle $\theta = \frac{\pi}{3}$ to the positive $x$-axis.

:::solution
$\nabla f = \langle 2x + y,\ x \rangle$, so $\nabla f(1, 2) = \langle 4, 1 \rangle$, and
$\mathbf{u} = \left\langle \frac12, \frac{\sqrt{3}}{2} \right\rangle$:

$$
D_{\mathbf{u}}f(1, 2) = 2 + \frac{\sqrt{3}}{2} \approx 2.87 .
$$
:::
::::

::::example[Three variables, toward a point]
Find the rate of change of $f(x, y, z) = x^2y + yz^2$ at $P(1, 2, -1)$ in the direction toward $Q(3, 1, 1)$.

:::solution
$\nabla f = \langle 2xy,\ x^2 + z^2,\ 2yz \rangle$, so $\nabla f(1, 2, -1) = \langle 4, 2, -4 \rangle$.
The direction is $\overrightarrow{PQ} = \langle 2, -1, 2 \rangle$, of length $3$. So

$$
D_{\mathbf{u}}f = \frac13\langle 4, 2, -4 \rangle \cdot \langle 2, -1, 2 \rangle = \frac{8 - 2 - 8}{3} = -\frac23 .
$$

The function decreases in that direction.
:::
::::

:::caution[The direction must be a unit vector]
$\nabla f \cdot \mathbf{v}$ with $|\mathbf{v}| \ne 1$ is not a rate per unit of distance: it is scaled by
$|\mathbf{v}|$. Above, the unnormalized product $\langle 4, 1 \rangle \cdot \langle 3, 4 \rangle = 16$ is
five times the true rate. And $\nabla f$ is a vector while $D_{\mathbf{u}}f$ is a number.
:::

### Fastest increase

Write the dot product with the angle $\theta$ between $\nabla f$ and $\mathbf{u}$:

$$
D_{\mathbf{u}}f = |\nabla f|\,|\mathbf{u}|\cos\theta = |\nabla f|\cos\theta .
$$

Only $\cos\theta$ changes with the direction, so every rate at the point is known at a glance.

::::theorem[The gradient gives the fastest increase]
Let $f$ be differentiable and $\nabla f \ne \mathbf{0}$ at a point. There:

1. the **maximum** rate of change is $|\nabla f|$, in the direction of $\nabla f$;
2. the **minimum** rate of change is $-|\nabla f|$, in the direction of $-\nabla f$;
3. the rate is $0$ in the directions perpendicular to $\nabla f$.

:::proof
$D_{\mathbf{u}}f = |\nabla f|\cos\theta$, and $\cos\theta$ has maximum $1$ at $\theta = 0$, minimum $-1$ at $\theta = \pi$, and is $0$ at $\theta = \frac{\pi}{2}$.
:::
::::

::::example[Walking on a hill]
The height of a hill is $h(x, y) = 200 - \frac{x^2}{100} - \frac{y^2}{50}$, in metres, with $x$ pointing east and $y$ north. A hiker stands at $(60, -40)$. In which direction is the climb steepest, and how steep is it? Which directions are level? What is the slope going due east?

:::solution
$\nabla h = \left\langle -\frac{x}{50},\ -\frac{y}{25} \right\rangle$, so $\nabla h(60, -40) = \langle -1.2,\ 1.6 \rangle$.

Steepest climb: along $\nabla h$, the unit vector $\left\langle -\frac35, \frac45 \right\rangle$, with slope $|\nabla h| = 2$.

Level directions: perpendicular to $\nabla h$, namely $\pm\left\langle \frac45, \frac35 \right\rangle$.

Due east: $\mathbf{u} = \mathbf{i}$, so the slope is $h_x = -1.2$, a descent.
:::
::::

```sim
id: gradient-direction
controls:
  - {id: fn, label: "Function (0: x² + 4y², 1: x²y − y³, 2: sin x + cos y, 3: a hill)", min: 0, max: 3, step: 1, default: 0, decimals: 0}
  - {id: a, label: Point x, min: -2, max: 2, step: 0.05, default: 1, decimals: 2}
  - {id: b, label: Point y, min: -2, max: 2, step: 0.05, default: 0.7, decimals: 2}
  - {id: th, label: Direction θ of u (degrees), min: 0, max: 360, step: 1, default: 40, decimals: 0}
note: 'Top: the contour map at the point. The yellow arrow is ∇f, perpendicular to the level curve; the green arrow is the unit direction u. Bottom: the rate D_u f = |∇f| cos(angle) as θ goes round. It peaks at |∇f| where u lines up with ∇f, and it is 0 along the level curve. At a critical point the whole curve flattens to 0.'
```

```python
# Every direction at once: D_u f at (2, 1) for f = x²y − y³, whose gradient is <4, 1>.
import numpy as np

grad = np.array([4.0, 1.0])
theta = np.radians(np.arange(0, 360, 1))
rates = grad[0]*np.cos(theta) + grad[1]*np.sin(theta)
print(round(rates.max(), 3), round(np.linalg.norm(grad), 3))   # 4.123 4.123
print(int(np.degrees(theta[rates.argmax()])))                  # 14: the direction of the gradient
```

:::note
The gradient is the working tool of machine learning. A model's loss is a function of many parameters,
and $-\nabla L$ is the direction in which the loss falls fastest locally. Gradient descent is the
repeated step $\mathbf{x} \leftarrow \mathbf{x} - \eta\,\nabla L(\mathbf{x})$.
:::

:::equations{#gradient}
- *Gradient*: $\nabla f = \langle f_x, f_y \rangle$.
- *Directional derivative*: $D_{\mathbf{u}}f = \nabla f \cdot \mathbf{u}$, with $|\mathbf{u}| = 1$.
- *Geometric form*: $D_{\mathbf{u}}f = |\nabla f|\cos\theta$.
- *Largest rate*: $|\nabla f|$, along $\nabla f$.
:::

## The gradient and level sets

### Level curves

Walking along a level curve keeps $f$ constant, so the rate is $0$ along it. That rate is the dot
product of $\nabla f$ with the tangent direction, so the two are perpendicular.

::::theorem[The gradient is perpendicular to level curves]
If $\nabla f(a, b) \ne \mathbf{0}$, then $\nabla f(a, b)$ is perpendicular to the level curve of $f$
through $(a, b)$.

:::proof
Let $\mathbf{r}(t) = \langle x(t), y(t) \rangle$ parametrize the level curve, with $\mathbf{r}(t_0) = \langle a, b \rangle$. Then $f(x(t), y(t)) = k$ for all $t$, and the chain rule gives

$$
f_x\,x'(t) + f_y\,y'(t) = 0 , \qquad\text{that is}\qquad \nabla f \cdot \mathbf{r}'(t) = 0 .
$$
:::
::::

So on a contour map, the gradient at a point crosses the contour at a right angle, pointing to higher
values, and it is long where the contours are close. A stream runs down the surface along $-\nabla f$:
perpendicular to the contours.

::::example[The tangent line to a level curve]
Find the tangent line to the ellipse $x^2 + 4y^2 = 8$ at $(2, 1)$.

:::solution
The ellipse is the level curve at $8$ of $f(x, y) = x^2 + 4y^2$. There $\nabla f = \langle 2x, 8y \rangle = \langle 4, 8 \rangle$, a normal of the tangent line:

$$
4(x - 2) + 8(y - 1) = 0 \quad\Longleftrightarrow\quad x + 2y = 4 .
$$
:::
::::

### Tangent planes to level surfaces

The same argument works one dimension up. Every curve on the level surface $F(x, y, z) = k$ through a
point $P$ has its tangent perpendicular to $\nabla F(P)$. All those tangents therefore lie in one
plane, with normal $\nabla F(P)$.

:::definition[Tangent plane to a level surface]
If $\nabla F(x_0, y_0, z_0) \ne \mathbf{0}$, the **tangent plane** to the level surface $F(x, y, z) = k$ at
$P(x_0, y_0, z_0)$ is

$$
F_x(P)(x - x_0) + F_y(P)(y - y_0) + F_z(P)(z - z_0) = 0 ,
$$

and the **normal line** at $P$ is the line through $P$ in the direction $\nabla F(P)$:

$$
\frac{x - x_0}{F_x(P)} = \frac{y - y_0}{F_y(P)} = \frac{z - z_0}{F_z(P)} .
$$
:::

This covers surfaces that are not graphs, such as a whole ellipsoid. It also contains the earlier
formula: a graph $z = f(x, y)$ is the level surface at $0$ of $F(x, y, z) = f(x, y) - z$, with
$\nabla F = \langle f_x, f_y, -1 \rangle$, exactly the normal found before.

::::example[A surface given by a product]
Find the tangent plane and the normal line to $xyz = 6$ at $(1, 2, 3)$.

:::solution
$\nabla F = \langle yz, xz, xy \rangle$, so $\nabla F(1, 2, 3) = \langle 6, 3, 2 \rangle$. The tangent plane is

$$
6(x - 1) + 3(y - 2) + 2(z - 3) = 0 \quad\Longleftrightarrow\quad 6x + 3y + 2z = 18 ,
$$

and the normal line is

$$
\frac{x - 1}{6} = \frac{y - 2}{3} = \frac{z - 3}{2} .
$$
:::
::::

::::example[A hyperboloid]
Find the tangent plane and the normal line to $x^2 + y^2 - z^2 = 1$ at $(1, 1, 1)$.

:::solution
$\nabla F = \langle 2x, 2y, -2z \rangle = \langle 2, 2, -2 \rangle$ at the point, or the parallel normal $\langle 1, 1, -1 \rangle$. The tangent plane is

$$
(x - 1) + (y - 1) - (z - 1) = 0 \quad\Longleftrightarrow\quad x + y - z = 1 ,
$$

and the normal line is $x = 1 + t$, $y = 1 + t$, $z = 1 - t$.
:::
::::

:::proposition[Tangent to a curve of intersection]
Where the surfaces $F = k_1$ and $G = k_2$ meet in a curve, its tangent is perpendicular to both
gradients, so it has direction $\nabla F \times \nabla G$.
:::

::::example[Where a sphere meets a paraboloid]
Find the tangent line at $(1, 1, 2)$ to the curve in which $x^2 + y^2 + z^2 = 6$ meets $z = x^2 + y^2$.

:::solution
Check the point: $1 + 1 + 4 = 6$ and $2 = 1 + 1$. With $F = x^2 + y^2 + z^2$ and $G = x^2 + y^2 - z$,

$$
\nabla F(1, 1, 2) = \langle 2, 2, 4 \rangle ,
\qquad
\nabla G(1, 1, 2) = \langle 2, 2, -1 \rangle ,
\qquad
\nabla F \times \nabla G = \langle -10, 10, 0 \rangle .
$$

The direction is $\langle 1, -1, 0 \rangle$, and the line is $x = 1 + t$, $y = 1 - t$, $z = 2$.
This matches the geometry: the curve is the circle $x^2 + y^2 = 2$ at height $2$.
:::
::::

:::caution[Which function gets the gradient]
For the tangent plane to a surface, the function differentiated has **three** variables, and the
surface is its level set: $\nabla F$ is a vector in space. A gradient of $f(x, y)$ is a vector in the
plane, perpendicular to the level curves and not to the graph: it is not a normal of the surface
$z = f(x, y)$.
:::

:::insight
The gradient holds every first-order fact about $f$ at a point: the rate in every direction by a dot
product, the fastest climb by its direction and length, and the level set by what it is perpendicular to.
:::

:::equations{#level-sets}
- *Tangent to a level curve*: $f_x(a, b)(x - a) + f_y(a, b)(y - b) = 0$.
- *Tangent plane to $F = k$*: $F_x(x - x_0) + F_y(y - y_0) + F_z(z - z_0) = 0$.
- *Normal line*: $\mathbf{r} = \mathbf{r}_0 + t\,\nabla F(P)$.
- *Curve of intersection*: direction $\nabla F \times \nabla G$.
:::

## Further reading

- [Wikipedia — Gradient](https://en.wikipedia.org/wiki/Gradient) — the steepest-slope picture and its role in other fields.
- [Wikipedia — Directional derivative](https://en.wikipedia.org/wiki/Directional_derivative) — the definition and the dot-product form.
- [Wikipedia — Gradient descent](https://en.wikipedia.org/wiki/Gradient_descent) — the method built on $-\nabla f$.
