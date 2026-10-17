---
title: Lines, planes and quadric surfaces
order: 8
status: outline
weeks: [5]
introduces: [quadric-surface]
requires:
  - {concept: vector, strength: hard}
  - {concept: dot-product, strength: hard}
  - {concept: cross-product, strength: hard}
reinforces:
  - {concept: line-and-plane-equations, perspective: "vector, parametric and symmetric equations of a line; normal vector, standard and general equations of a plane; building a plane from points, lines and planes; the line where two planes meet"}
---

A line in space is fixed by a point and a direction; a plane by a point and a normal, a direction
perpendicular to it. Every problem about lines and planes comes down to finding those two pieces:
the dot product says when two directions are perpendicular, and the cross product produces a
direction perpendicular to two given ones. The cylinders and quadric surfaces of the last part are
the next step, surfaces of degree two.

## Lines

### The vector equation

Let $L$ pass through the point $P_0(x_0, y_0, z_0)$ in the direction of a nonzero vector
$\mathbf{v} = \langle a, b, c \rangle$. A point $P(x, y, z)$ lies on $L$ exactly when
$\overrightarrow{P_0P}$ is parallel to $\mathbf{v}$, that is $\overrightarrow{P_0P} = t\mathbf{v}$
for some number $t$. With position vectors $\mathbf{r}_0 = \overrightarrow{OP_0}$ and
$\mathbf{r} = \overrightarrow{OP}$, this reads $\mathbf{r} - \mathbf{r}_0 = t\mathbf{v}$.

:::definition[Vector equation of a line]
The line through $P_0$ with **direction vector** $\mathbf{v}$ is

$$
\mathbf{r} = \mathbf{r}_0 + t\mathbf{v} , \qquad t \in \mathbb{R} .
$$

Each value of the **parameter** $t$ gives one point of the line.
:::

### Parametric and symmetric equations

Writing the vector equation in components,
$\langle x, y, z \rangle = \langle x_0 + ta,\ y_0 + tb,\ z_0 + tc \rangle$, gives three scalar
equations; solving each for $t$ and equating gives a form without the parameter.

:::definition[Parametric and symmetric equations of a line]
The line through $P_0(x_0, y_0, z_0)$ with direction $\langle a, b, c \rangle$ has **parametric
equations**

$$
x = x_0 + at \qquad y = y_0 + bt \qquad z = z_0 + ct ,
$$

and, if $a, b, c$ are all nonzero, **symmetric equations**

$$
\frac{x - x_0}{a} = \frac{y - y_0}{b} = \frac{z - z_0}{c} .
$$

The numbers $a, b, c$ are the **direction numbers** of the line.
:::

If a direction number is $0$, that coordinate is constant and stands apart. For $a = 0$ and
$b, c \ne 0$, the symmetric equations are

$$
x = x_0 , \qquad \frac{y - y_0}{b} = \frac{z - z_0}{c} .
$$

:::proposition[Parallel lines]
Two lines are parallel if and only if their direction vectors are parallel:
$L_1 \parallel L_2 \iff \mathbf{v}_1 = k\mathbf{v}_2$ for some scalar $k$.
:::

::::example[A line parallel to a given line]
Find parametric and symmetric equations of the line through $A(-1, 1, 2)$ parallel to the line
$x = 2 + 3t$, $y = -1 + t$, $z = 3t$.

:::solution
A parallel line can use the same direction: read the coefficients of $t$,
$\mathbf{v} = \langle 3, 1, 3 \rangle$. Through $A$,

$$
x = -1 + 3t \qquad y = 1 + t \qquad z = 2 + 3t ,
$$

and solving each for $t$,

$$
\frac{x + 1}{3} = \frac{y - 1}{1} = \frac{z - 2}{3} .
$$
:::
::::

::::example[A direction number equal to zero]
Write symmetric equations for the line $x = 1$, $y = -2 + t$, $z = 3 - 2t$.

:::solution
The direction is $\mathbf{v} = \langle 0, 1, -2 \rangle$. Its first number is $0$, so $x$ stays
$1$, and only $y$ and $z$ go into the fraction:

$$
x = 1 , \qquad \frac{y + 2}{1} = \frac{z - 3}{-2} .
$$
:::
::::

::::example[A line perpendicular to two vectors]
Find the line through $A(1, -1, 2)$ perpendicular to both $\mathbf{i} + \mathbf{j}$ and
$2\mathbf{j} + \mathbf{k}$.

:::solution
The direction must be perpendicular to both vectors, which is what the cross product produces:

$$
\mathbf{v} = (\mathbf{i} + \mathbf{j}) \times (2\mathbf{j} + \mathbf{k}) =
\begin{vmatrix} \mathbf{i} & \mathbf{j} & \mathbf{k} \\ 1 & 1 & 0 \\ 0 & 2 & 1 \end{vmatrix}
= \langle 1, -1, 2 \rangle .
$$

So $x = 1 + t$, $y = -1 - t$, $z = 2 + 2t$, or
$\frac{x - 1}{1} = \frac{y + 1}{-1} = \frac{z - 2}{2}$.
:::
::::

### The line through two points

Through two points $P_0$ and $P_1$, take $\mathbf{v} = \overrightarrow{P_0P_1} = \mathbf{r}_1 - \mathbf{r}_0$.

:::proposition[Line through two points and a segment]
The line through $P_0$ and $P_1$ is

$$
\mathbf{r} = \mathbf{r}_0 + t(\mathbf{r}_1 - \mathbf{r}_0) = (1 - t)\,\mathbf{r}_0 + t\,\mathbf{r}_1 , \qquad t \in \mathbb{R} ,
$$

and restricting to $0 \le t \le 1$ gives the **line segment** from $P_0$ (at $t = 0$) to $P_1$
(at $t = 1$).
:::

::::example[A segment and its midpoint]
Parametrize the segment from $P_0(2, -1, 3)$ to $P_1(4, 3, -1)$ and find its midpoint.

:::solution
$\overrightarrow{P_0P_1} = \langle 2, 4, -4 \rangle$, so

$$
x = 2 + 2t \qquad y = -1 + 4t \qquad z = 3 - 4t , \qquad 0 \le t \le 1 .
$$

The midpoint is at $t = \frac12$: $(3, 1, 1)$, the average of the endpoints.
:::
::::

### Skew lines

In the plane two lines either meet or are parallel. In space there is a third possibility.

:::definition[Skew lines]
Two lines in space are **skew** if they are not parallel and do not intersect. Skew lines lie in
two parallel planes.
:::

:::steps[Parallel, intersecting or skew]
1. Compare the direction vectors. If one is a multiple of the other, the lines are parallel (or the
   same line, if they share a point).
2. Otherwise, give the lines different parameters ($t$ and $s$) and set the coordinates equal:
   three equations in two unknowns.
3. Solve two of the equations for $t$ and $s$ and test the third. If it holds, the lines meet at
   that point; if not, they are skew.
:::

::::example[Two skew lines]
Show that $L_1$: $x = 1 + t$, $y = -1 + 2t$, $z = t$ and $L_2$: $x = 2 - s$, $y = s$, $z = 3 + s$
are skew.

:::solution
The directions $\langle 1, 2, 1 \rangle$ and $\langle -1, 1, 1 \rangle$ are not multiples of each
other, so the lines are not parallel. A common point would need

$$
1 + t = 2 - s \qquad -1 + 2t = s \qquad t = 3 + s .
$$

Substituting $s = 2t - 1$ into the first equation gives $1 + t = 3 - 2t$, so $t = \frac23$ and
$s = \frac13$. The third equation would need $\frac23 = \frac{10}{3}$, which is false. No common
point: the lines are skew.
:::
::::

:::caution[One parameter per line]
Each line needs its own parameter. Writing both lines with the same $t$ asks whether they pass
through the same point *at the same time*, a stronger question, and can miss an intersection.
:::

:::equations{#line}
- *Vector*: $\mathbf{r} = \mathbf{r}_0 + t\mathbf{v}$.
- *Parametric*: $x = x_0 + at$, $y = y_0 + bt$, $z = z_0 + ct$.
- *Symmetric*: $\dfrac{x - x_0}{a} = \dfrac{y - y_0}{b} = \dfrac{z - z_0}{c}$.
- *Segment*: $\mathbf{r} = (1 - t)\,\mathbf{r}_0 + t\,\mathbf{r}_1$, $0 \le t \le 1$.
- *Parallel lines*: $\mathbf{v}_1 \parallel \mathbf{v}_2$.
:::

## Planes

### The normal vector

A single direction does not fix a plane: a plane contains infinitely many directions. One
direction perpendicular to it does. Let the plane pass through $P_0(x_0, y_0, z_0)$ and let
$\mathbf{n} = \langle a, b, c \rangle$ be perpendicular to it. A point $P(x, y, z)$ is in the plane
exactly when $\overrightarrow{P_0P} = \mathbf{r} - \mathbf{r}_0$ lies in it, that is, when it is
perpendicular to $\mathbf{n}$.

:::definition[Equations of a plane]
The plane through $P_0(x_0, y_0, z_0)$ with **normal vector** $\mathbf{n} = \langle a, b, c \rangle \ne \mathbf{0}$
has the **vector equation**

$$
(\mathbf{r} - \mathbf{r}_0) \cdot \mathbf{n} = 0 ,
$$

the **standard equation**

$$
a(x - x_0) + b(y - y_0) + c(z - z_0) = 0 ,
$$

and, expanding, the **general equation**

$$
ax + by + cz + d = 0 , \qquad d = -(ax_0 + by_0 + cz_0) .
$$
:::

So the coefficients of $x, y, z$ in any linear equation are a normal vector of its plane: the
normal can be read off at a glance.

:::proposition[Parallel and perpendicular planes]
Planes with normals $\mathbf{n}_1$ and $\mathbf{n}_2$ are

1. **parallel** if and only if $\mathbf{n}_1 \parallel \mathbf{n}_2$;
2. **perpendicular** if and only if $\mathbf{n}_1 \cdot \mathbf{n}_2 = 0$.
:::

### Finding a plane

Every plane problem ends with a point and a normal; what changes is where the normal comes from.

:::steps[Finding a plane from the data]
1. **A point and a normal** are given: write the standard equation.
2. **A point and a line perpendicular to the plane**: the line's direction vector is a normal.
3. **A point and a parallel plane**: use the other plane's normal (read off its coefficients).
4. **Three points** $A, B, C$ (not on one line): $\mathbf{n} = \overrightarrow{AB} \times \overrightarrow{AC}$.
5. **A point $P_0$ and a line in the plane**: take a point $A$ on the line (set the parameter to
   $0$) and the line's direction $\mathbf{v}$; then $\mathbf{n} = \overrightarrow{P_0A} \times \mathbf{v}$.
   Equivalently, take two points $A, B$ on the line and use $\overrightarrow{AB} \times \overrightarrow{AP_0}$.
:::

::::example[A point and a normal]
Find the plane through $A(-1, 1, 2)$ perpendicular to $\mathbf{v} = \langle -1, 3, 2 \rangle$.

:::solution
$\mathbf{v}$ is a normal, so

$$
-1(x + 1) + 3(y - 1) + 2(z - 2) = 0 \quad\Longleftrightarrow\quad -x + 3y + 2z - 8 = 0 .
$$
:::
::::

::::example[A plane through three points]
Find the plane through $P(1, -1, 2)$, $Q(2, 1, 4)$ and $R(3, 2, 1)$.

:::solution
$\overrightarrow{PQ} = \langle 1, 2, 2 \rangle$ and $\overrightarrow{PR} = \langle 2, 3, -1 \rangle$
lie in the plane, so their cross product is a normal:
$\mathbf{n} = \overrightarrow{PQ} \times \overrightarrow{PR} = \langle -8, 5, -1 \rangle$. Through $P$,

$$
-8(x - 1) + 5(y + 1) - (z - 2) = 0 \quad\Longleftrightarrow\quad -8x + 5y - z + 15 = 0 .
$$

Check with the other points: $Q$ gives $-16 + 5 - 4 + 15 = 0$ and $R$ gives $-24 + 10 - 1 + 15 = 0$.
:::
::::

::::example[A plane through a point and a line]
Find the plane through $P_0(2, 0, 1)$ that contains the line
$\frac{x - 1}{1} = \frac{y - 2}{2} = \frac{z + 3}{-1}$.

:::solution
At $t = 0$ the line passes through $A(1, 2, -3)$, and its direction is $\mathbf{v} = \langle 1, 2, -1 \rangle$.
Both $\overrightarrow{P_0A} = \langle -1, 2, -4 \rangle$ and $\mathbf{v}$ lie in the plane, so

$$
\mathbf{n} = \overrightarrow{P_0A} \times \mathbf{v} =
\begin{vmatrix} \mathbf{i} & \mathbf{j} & \mathbf{k} \\ -1 & 2 & -4 \\ 1 & 2 & -1 \end{vmatrix}
= \langle 6, -5, -4 \rangle .
$$

Through $P_0$: $6(x - 2) - 5y - 4(z - 1) = 0$, that is $6x - 5y - 4z - 8 = 0$. Check: $A$ gives
$6 - 10 + 12 - 8 = 0$. (Two points of the line, $A$ and $B(2, 4, -4)$ at $t = 1$, give
$\overrightarrow{AB} \times \overrightarrow{AP_0} = \langle 6, -5, -4 \rangle$, the same normal.)
:::
::::

:::caution[A direction in the plane is not a normal]
When a line lies *in* the plane, its direction is perpendicular to the normal, not equal to it.
Only a line *perpendicular* to the plane (case 2) hands over its direction as the normal. Two
directions in the plane need a cross product.
:::

### The line where two planes meet

Two planes that are not parallel meet in a line. Its direction is perpendicular to both normals.

:::steps[The line of intersection of two planes]
1. **Direction**: $\mathbf{v} = \mathbf{n}_1 \times \mathbf{n}_2$, perpendicular to both normals,
   so it lies in both planes.
2. **A point**: set one variable to $0$ (say $z = 0$) and solve the two plane equations for the
   other two.
3. Or solve the system of the two equations for two variables in terms of the third, and use the
   third as the parameter.
:::

::::example[The intersection of two planes]
Find the line where the planes $x + y - z = 2$ and $2x - y + 3z = 1$ meet.

:::solution
The normals $\mathbf{n}_1 = \langle 1, 1, -1 \rangle$ and $\mathbf{n}_2 = \langle 2, -1, 3 \rangle$
are not parallel, so the planes meet. The direction is

$$
\mathbf{v} = \mathbf{n}_1 \times \mathbf{n}_2 =
\begin{vmatrix} \mathbf{i} & \mathbf{j} & \mathbf{k} \\ 1 & 1 & -1 \\ 2 & -1 & 3 \end{vmatrix}
= \langle 2, -5, -3 \rangle .
$$

With $z = 0$: $x + y = 2$ and $2x - y = 1$, so $x = 1$, $y = 1$, and $(1, 1, 0)$ is on the line:

$$
x = 1 + 2t \qquad y = 1 - 5t \qquad z = -3t .
$$

Solving the system instead gives $x = 1 - \frac23 z$, $y = 1 + \frac53 z$; with $z = -3t$ this is the
same line.
:::
::::

:::insight
A line is a point plus a direction; a plane is a point plus a normal. The dot product checks that
two directions are perpendicular, and the cross product makes a direction perpendicular to two
others: a normal from two directions in a plane, or a line's direction from two normals.
:::

:::equations{#plane}
- *Vector*: $(\mathbf{r} - \mathbf{r}_0) \cdot \mathbf{n} = 0$.
- *Standard*: $a(x - x_0) + b(y - y_0) + c(z - z_0) = 0$.
- *General*: $ax + by + cz + d = 0$, normal $\langle a, b, c \rangle$.
- *Through three points*: $\mathbf{n} = \overrightarrow{AB} \times \overrightarrow{AC}$.
- *Parallel planes*: $\mathbf{n}_1 \parallel \mathbf{n}_2$; *perpendicular planes*: $\mathbf{n}_1 \cdot \mathbf{n}_2 = 0$.
- *Line of two planes*: direction $\mathbf{n}_1 \times \mathbf{n}_2$.
:::

## Cylinders and quadric surfaces

Not yet taught: the cylinders over a curve in a plane, and the quadric surfaces (ellipsoids,
paraboloids, hyperboloids and cones), recognised from their traces in planes parallel to the
coordinate planes.

## Further reading

- [Paul's Online Notes — Equations of Lines](https://tutorial.math.lamar.edu/Classes/CalcII/EqnsOfLines.aspx) — vector, parametric and symmetric forms.
- [Paul's Online Notes — Equations of Planes](https://tutorial.math.lamar.edu/Classes/CalcII/EqnsOfPlanes.aspx) — the normal vector and the standard and general equations.
- [Wikipedia — Skew lines](https://en.wikipedia.org/wiki/Skew_lines) — why two lines in space can miss each other without being parallel.
