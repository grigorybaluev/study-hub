---
title: Three-dimensional coordinates and vectors
order: 6
status: detailed
weeks: [4]
introduces: []
requires:
  - {concept: vector, strength: hard}
reinforces:
  - {concept: vector, perspective: "geometric vectors in the plane and in space: triangle and parallelogram laws, components, the standard basis i, j, k"}
---

The plane is $\mathbb{R}^2$, pairs of numbers; space is $\mathbb{R}^3$, triples. Most formulas carry
over with one more term: the distance formula gains a $(z_2 - z_1)^2$, a circle becomes a sphere.
What changes is the meaning of an equation: one equation in $x, y, z$ describes a *surface*, not a
curve. Vectors are the second tool of the course: arrows with a length and a direction, added
tip to tail, and written as lists of components once a coordinate system is fixed.

## Three-dimensional coordinates

### Points in space

The plane is $\mathbb{R}^2 = \mathbb{R} \times \mathbb{R}$: a point $P(a, b)$ is reached by going
$a$ along the $x$-axis and $b$ parallel to the $y$-axis. Space adds a third axis, the $z$-axis,
perpendicular to both.

:::definition[Three-dimensional coordinate system]
$\mathbb{R}^3 = \mathbb{R} \times \mathbb{R} \times \mathbb{R}$ is the set of ordered triples
$(a, b, c)$. Three mutually perpendicular axes through the origin $O$ name the points of space:
$P(a, b, c)$ is the corner opposite $O$ of the box with edges $a$, $b$ and $c$ along the $x$-,
$y$- and $z$-axes. The axes are drawn **right-handed**: curling the fingers of the right hand
from the positive $x$-axis to the positive $y$-axis, the thumb points along the positive
$z$-axis.
:::

### An equation is a surface

In the plane, an equation $F(x, y) = 0$ has a curve as its graph. In space, an equation
$F(x, y, z) = 0$ leaves two of the three coordinates free, and its graph is a **surface**.

::::example[The same equation in the plane and in space]
Describe $x = k$ in $\mathbb{R}^2$ and in $\mathbb{R}^3$; then $y = k$ and $z = k$ in $\mathbb{R}^3$.

:::solution
In $\mathbb{R}^2$, $\{(x, y) : x = k,\ y \in \mathbb{R}\}$ is the vertical line through $(k, 0)$.

In $\mathbb{R}^3$, $\{(x, y, z) : x = k,\ y, z \in \mathbb{R}\}$ leaves $y$ and $z$ free: it is
the plane through $(k, 0, 0)$ parallel to the $yz$-plane.

Likewise $y = k$ is the plane parallel to the $xz$-plane and $z = k$ the horizontal plane
parallel to the $xy$-plane. With $k = 0$ these are the three **coordinate planes**.
:::
::::

::::example[A circle becomes a cylinder]
Describe $x^2 + y^2 = r^2$ in $\mathbb{R}^2$ and in $\mathbb{R}^3$.

:::solution
In $\mathbb{R}^2$ it is the circle of radius $r$ about the origin. In $\mathbb{R}^3$ the equation
says nothing about $z$, so every point $(x, y, z)$ with $(x, y)$ on that circle belongs to it: the
circle is copied into every horizontal plane $z = k$. The surface is the **circular cylinder** of
radius $r$ around the $z$-axis.
:::
::::

### Distance and midpoint

::::proposition[Distance and midpoint in space]
For $A(x_1, y_1, z_1)$ and $B(x_2, y_2, z_2)$,

$$
|AB| = \sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2 + (z_2 - z_1)^2} ,
$$

and the midpoint of $AB$ is

$$
M = \left( \frac{x_1 + x_2}{2},\ \frac{y_1 + y_2}{2},\ \frac{z_1 + z_2}{2} \right).
$$

:::proof
Let $C(x_2, y_2, z_1)$, the point below or above $B$ at the height of $A$. $A$ and $C$ lie in
the horizontal plane $z = z_1$, so by the plane formula $|AC|^2 = (x_2 - x_1)^2 + (y_2 - y_1)^2$.
The segment $CB$ is vertical, of length $|z_2 - z_1|$, and perpendicular to $AC$. By Pythagoras in
the right triangle $ACB$, $|AB|^2 = |AC|^2 + |CB|^2$. The midpoint is checked the same way:
$|AM| = |MB| = \frac12|AB|$.
:::
::::

## Spheres

### The standard equation

A circle is the set of points at a fixed distance from a centre; the same definition in space
gives a sphere.

::::theorem[Equation of a sphere]
The sphere with centre $Q(a, b, c)$ and radius $r > 0$, the set $\{P(x, y, z) : |PQ| = r\}$, has
the **standard equation**

$$
(x - a)^2 + (y - b)^2 + (z - c)^2 = r^2 .
$$

:::proof
By the distance formula, $|PQ| = r$ is $\sqrt{(x - a)^2 + (y - b)^2 + (z - c)^2} = r$. Both sides
are non-negative, so squaring is reversible.
:::
::::

Expanding the squares gives the **general equation**

$$
x^2 + y^2 + z^2 + Gx + Hy + Iz + J = 0 :
$$

the squared terms all have coefficient $1$ (or the same coefficient, which can be divided out)
and there are no products such as $xy$. Completing the square in each variable goes back.

::::example[Centre and radius]
Show that $2x^2 + 8x + 2y^2 - 10y + 2z^2 + 16z = 5$ is a sphere and find its centre and radius.

:::solution
Complete the square in each variable, keeping the factor $2$ outside:

$$
2(x^2 + 4x + 4) - 8 + 2\left(y^2 - 5y + \frac{25}{4}\right) - \frac{25}{2} + 2(z^2 + 8z + 16) - 32 = 5 ,
$$

so

$$
2(x + 2)^2 + 2\left(y - \frac52\right)^2 + 2(z + 4)^2 = 5 + 8 + \frac{25}{2} + 32 = \frac{115}{2} .
$$

Dividing by $2$,

$$
(x + 2)^2 + \left(y - \frac52\right)^2 + (z + 4)^2 = \frac{115}{4} .
$$

The centre is $\left(-2, \frac52, -4\right)$ and the radius $r = \sqrt{\frac{115}{4}} = \frac{\sqrt{115}}{2} \approx 5.36$.
:::
::::

:::caution[Completing the square with a factor in front]
Each completed square adds a number on the left that has to be paid for: $2(x^2 + 4x + 4)$ adds
$2 \cdot 4 = 8$, not $4$, because of the factor in front. And the right-hand side must come out
positive at the end; if it is $0$ the "sphere" is a single point, and if it is negative no point
satisfies the equation.
:::

### Inside and outside

Replacing $=$ by an inequality gives a solid region instead of a surface.

:::definition[Interior and exterior of a sphere]
For the sphere with centre $(a, b, c)$ and radius $r$, the points with

$$
(x - a)^2 + (y - b)^2 + (z - c)^2 < r^2
$$

form its **interior** (the open ball), and the points with $> r^2$ its **exterior**.
:::

::::example[A spherical shell]
Describe the region $\{(x, y, z) : 2 \le x^2 + y^2 + z^2 \le 5\}$.

:::solution
$x^2 + y^2 + z^2$ is the squared distance from the origin, so the condition is
$\sqrt2 \le |OP| \le \sqrt5$. The region is the solid shell between the spheres of radius
$\sqrt2$ and $\sqrt5$ centred at the origin, both spheres included.
:::
::::

:::equations
- *Distance*: $|AB| = \sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2 + (z_2 - z_1)^2}$.
- *Midpoint*: $\left( \frac{x_1 + x_2}{2}, \frac{y_1 + y_2}{2}, \frac{z_1 + z_2}{2} \right)$.
- *Sphere*: $(x - a)^2 + (y - b)^2 + (z - c)^2 = r^2$, centre $(a, b, c)$, radius $r$.
:::

## Vectors

### Length and direction

:::definition[Vector]
A **vector** is a quantity with a length and a direction, drawn as an arrow. The arrow from a
point $A$, the **tail**, to a point $B$, the **tip**, is written $\overrightarrow{AB}$. Its
**length** (or magnitude) is written $|\overrightarrow{AB}|$ or $\|\overrightarrow{AB}\|$.

Two vectors $\mathbf{u}$ and $\mathbf{v}$ are **equivalent** (equal) if they have the same length
and the same direction, wherever their tails are. The **zero vector** $\mathbf{0}$ has length $0$
and no direction.
:::

So a vector is not tied to a place: the same vector can be drawn starting from any point.

### Scalar multiplication

:::definition[Scalar multiple]
For a vector $\mathbf{v}$ and a number (a **scalar**) $c$, the vector $c\mathbf{v}$ has length

$$
|c\mathbf{v}| = |c|\,|\mathbf{v}| ,
$$

and the same direction as $\mathbf{v}$ if $c > 0$, the opposite direction if $c < 0$; $0\mathbf{v} = \mathbf{0}$.
:::

In particular $-\mathbf{v} = (-1)\mathbf{v}$ has the same length as $\mathbf{v}$ and points the
other way, and $2\mathbf{a}$ is $\mathbf{a}$ laid twice end to end.

:::definition[Parallel vectors]
Nonzero vectors $\mathbf{u}$ and $\mathbf{v}$ are **parallel** if one is a scalar multiple of
the other: $\mathbf{u} = c\mathbf{v}$ or $\mathbf{v} = c\mathbf{u}$ for some scalar $c$.
:::

### Unit vectors

:::definition[Unit vector]
A vector $\mathbf{u}$ is a **unit vector** if $|\mathbf{u}| = 1$.
:::

::::proposition[The two unit vectors along a vector]
Every nonzero vector $\mathbf{u}$ has exactly two parallel unit vectors:

$$
\frac{\mathbf{u}}{|\mathbf{u}|} \qquad\text{and}\qquad -\frac{\mathbf{u}}{|\mathbf{u}|} ,
$$

the first in the direction of $\mathbf{u}$, the second opposite.

:::proof
$\frac{1}{|\mathbf{u}|}$ is a positive scalar, so $\frac{\mathbf{u}}{|\mathbf{u}|}$ has the
direction of $\mathbf{u}$ and length $\frac{1}{|\mathbf{u}|}\,|\mathbf{u}| = 1$; its negative has
the same length and the opposite direction. Any unit vector $c\mathbf{u}$ needs
$|c|\,|\mathbf{u}| = 1$, so $c = \pm\frac{1}{|\mathbf{u}|}$, and there are no others.
:::
::::

### Vector addition

:::definition[Sum of two vectors]
**Triangle law.** Place $\mathbf{v}$ with its tail at the tip of $\mathbf{u}$. Then
$\mathbf{u} + \mathbf{v}$ runs from the tail of $\mathbf{u}$ to the tip of $\mathbf{v}$:

$$
\overrightarrow{AB} + \overrightarrow{BC} = \overrightarrow{AC} .
$$

**Parallelogram law.** Place $\mathbf{u} = \overrightarrow{AB}$ and $\mathbf{v} = \overrightarrow{AC}$
tail to tail and complete the parallelogram $ABPC$. Then $\mathbf{u} + \mathbf{v}$ is its
diagonal:

$$
\overrightarrow{AB} + \overrightarrow{AC} = \overrightarrow{AP} .
$$
:::

The two laws give the same vector: in the parallelogram, $\overrightarrow{BP}$ is equivalent to
$\overrightarrow{AC}$, so the parallelogram law is the triangle law applied to
$\overrightarrow{AB} + \overrightarrow{BP}$.

The **difference** $\mathbf{u} - \mathbf{v}$ is $\mathbf{u} + (-\mathbf{v})$. Drawn tail to tail,
it is the other diagonal of the parallelogram, from the tip of $\mathbf{v}$ to the tip of
$\mathbf{u}$.

## Components

### Position vectors

Put the tail of a vector $\mathbf{a}$ at the origin. Its tip lands on a single point
$P(a_1, a_2)$ in the plane, or $P(a_1, a_2, a_3)$ in space, and that point determines the vector.

:::definition[Components]
If $\mathbf{a} = \overrightarrow{OP}$ with $P(a_1, a_2, a_3)$, then $a_1, a_2, a_3$ are the
**components** of $\mathbf{a}$, written

$$
\mathbf{a} = \langle a_1, a_2, a_3 \rangle ,
$$

and $\overrightarrow{OP}$ is the **position vector** of $P$. In the plane,
$\mathbf{a} = \langle a_1, a_2 \rangle$. More generally $V_n$ is the set of all $n$-dimensional
vectors $\langle a_1, \dots, a_n \rangle$; $V_2$ and $V_3$ are the plane and space.
:::

The angle brackets keep the vector $\langle a_1, a_2, a_3 \rangle$ apart from the point
$(a_1, a_2, a_3)$. For two points $A(x_1, y_1, z_1)$ and $B(x_2, y_2, z_2)$, the vector from $A$
to $B$ is $\overrightarrow{AB} = \langle x_2 - x_1,\ y_2 - y_1,\ z_2 - z_1 \rangle$, tip minus
tail.

:::proposition[Operations on components]
For $\mathbf{a} = \langle a_1, a_2, a_3 \rangle$, $\mathbf{b} = \langle b_1, b_2, b_3 \rangle$ and a
scalar $c$,

$$
c\mathbf{a} = \langle ca_1, ca_2, ca_3 \rangle
\qquad
\mathbf{a} + \mathbf{b} = \langle a_1 + b_1, a_2 + b_2, a_3 + b_3 \rangle
\qquad
\mathbf{a} - \mathbf{b} = \langle a_1 - b_1, a_2 - b_2, a_3 - b_3 \rangle .
$$
:::

The geometric operations become arithmetic on the components, one coordinate at a time.

### Length

:::proposition[Length from components]
For $\mathbf{a} = \langle a_1, a_2, \dots, a_n \rangle$,

$$
|\mathbf{a}| = \sqrt{a_1^2 + a_2^2 + \dots + a_n^2} .
$$
:::

In $V_2$ and $V_3$ this is the distance from $O$ to the tip $P$; the formula takes the same shape
in every dimension.

### The standard basis

:::definition[Standard basis vectors]
In $V_2$, $\mathbf{i} = \langle 1, 0 \rangle$ and $\mathbf{j} = \langle 0, 1 \rangle$, the position
vectors of $(1, 0)$ and $(0, 1)$. In $V_3$,

$$
\mathbf{i} = \langle 1, 0, 0 \rangle \qquad \mathbf{j} = \langle 0, 1, 0 \rangle \qquad \mathbf{k} = \langle 0, 0, 1 \rangle .
$$
:::

Every vector is a combination of them, with its components as coefficients:

$$
\langle a_1, a_2 \rangle = a_1\mathbf{i} + a_2\mathbf{j}
\qquad
\langle a_1, a_2, a_3 \rangle = a_1\mathbf{i} + a_2\mathbf{j} + a_3\mathbf{k} .
$$

::::example[A combination of two vectors]
Let $\mathbf{a} = \langle 2, 1, 1 \rangle$ and $\mathbf{b} = \langle -4, 1, 3 \rangle$. Write both
with $\mathbf{i}, \mathbf{j}, \mathbf{k}$, and find $2\mathbf{a} - 3\mathbf{b}$ and the unit vector in
the direction of $\mathbf{b}$.

:::solution
$\mathbf{a} = 2\mathbf{i} + \mathbf{j} + \mathbf{k}$, the position vector of $P(2, 1, 1)$, and
$\mathbf{b} = -4\mathbf{i} + \mathbf{j} + 3\mathbf{k}$. Component by component,

$$
2\mathbf{a} - 3\mathbf{b} = \langle 4, 2, 2 \rangle + \langle 12, -3, -9 \rangle = \langle 16, -1, -7 \rangle = 16\mathbf{i} - \mathbf{j} - 7\mathbf{k} .
$$

$|\mathbf{b}| = \sqrt{16 + 1 + 9} = \sqrt{26}$, so the unit vector is
$\frac{1}{\sqrt{26}}\langle -4, 1, 3 \rangle$.
:::
::::

:::caution[A scalar multiplies every component]
$-3\mathbf{b}$ multiplies *every* component by $-3$, signs included: $-3 \cdot 3 = -9$. Writing
$-3\mathbf{b}$ as $\langle 12, -3, 9 \rangle$ changes only some signs and produces a vector that is
not parallel to $\mathbf{b}$ at all.
:::

:::insight
A vector has two faces. Geometrically it is an arrow, added tip to tail; in coordinates it is a
list of numbers, added entry by entry. The position vector $\overrightarrow{OP}$ joins the two,
and $\mathbf{i}, \mathbf{j}, \mathbf{k}$ turn the list back into a sum of arrows.
:::

:::equations{#vector}
- *Scalar multiple*: $|c\mathbf{v}| = |c|\,|\mathbf{v}|$; same direction if $c > 0$, opposite if $c < 0$.
- *Unit vectors along $\mathbf{u}$*: $\pm\dfrac{\mathbf{u}}{|\mathbf{u}|}$.
- *Triangle law*: $\overrightarrow{AB} + \overrightarrow{BC} = \overrightarrow{AC}$.
- *Components*: $\overrightarrow{AB} = \langle x_2 - x_1, y_2 - y_1, z_2 - z_1 \rangle$; operations entry by entry.
- *Length*: $|\mathbf{a}| = \sqrt{a_1^2 + \dots + a_n^2}$.
- *Standard basis*: $\langle a_1, a_2, a_3 \rangle = a_1\mathbf{i} + a_2\mathbf{j} + a_3\mathbf{k}$.
:::

## Further reading

- [Paul's Online Notes — The 3-D Coordinate System](https://tutorial.math.lamar.edu/Classes/CalcII/3DSpace.aspx) — equations that are curves in the plane and surfaces in space.
- [Paul's Online Notes — Vector Arithmetic](https://tutorial.math.lamar.edu/Classes/CalcII/VectorArithmetic.aspx) — the geometric and component pictures side by side.
- [Wikipedia — Euclidean vector](https://en.wikipedia.org/wiki/Euclidean_vector) — the arrow view, components and bases.
