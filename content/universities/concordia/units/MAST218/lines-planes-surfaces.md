---
title: Lines, planes and quadric surfaces
order: 8
status: detailed
weeks: [5, 7]
introduces: [quadric-surface]
requires:
  - {concept: vector, strength: hard}
  - {concept: dot-product, strength: hard}
  - {concept: cross-product, strength: hard}
reinforces:
  - {concept: line-and-plane-equations, perspective: "vector, parametric and symmetric equations of a line; normal vector, standard and general equations of a plane; building a plane from points, lines and planes; the line where two planes meet; angles and distances"}
---

A line in space is fixed by a point and a direction; a plane by a point and a normal, a direction
perpendicular to it. Every problem about lines and planes comes down to finding those two pieces:
the dot product says when two directions are perpendicular, and the cross product produces a
direction perpendicular to two given ones. The cylinders and quadric surfaces of the last parts are
the next step, surfaces of degree two, read from their slices.

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

## Lines against planes: meeting, angles, distances

A line and a plane, two planes, two lines: once they are written down, three questions remain. Do
they meet, at what angle, and how far apart are they? Each answer is one substitution or one dot
product.

### Where a line meets a plane

Substitute the line's $x(t)$, $y(t)$, $z(t)$ into the plane's equation. That leaves one linear
equation in $t$, with three possible outcomes.

:::steps[A line against a plane]
1. Put the parametric equations of the line into the equation of the plane.
2. One solution $t$: put it back into the line to get the point of intersection.
3. No $t$ left and a false statement: the line is parallel to the plane and never meets it.
4. No $t$ left and a true statement: the line lies in the plane.
:::

::::example[A line through a plane]
Where does the line $x = 2 + t$, $y = -1 + 3t$, $z = 1 - 2t$ meet the plane $2x + y - z = 7$?

:::solution
Substituting,

$$
2(2 + t) + (-1 + 3t) - (1 - 2t) = 7 \quad\Longleftrightarrow\quad 2 + 7t = 7 ,
$$

so $t = \frac57$ and the point is $\left(\frac{19}{7}, \frac{8}{7}, -\frac{3}{7}\right)$. Check:
$\frac{38}{7} + \frac87 + \frac37 = 7$.
:::
::::

::::example[A line parallel to a plane]
Does the line $x = 1 + t$, $y = 2 + t$, $z = t$ meet the plane $x - 2y + z = 1$?

:::solution
Substituting, $(1 + t) - 2(2 + t) + t = 1$, that is $-3 = 1$: $t$ cancels and the statement is false.
The line never meets the plane. The reason is visible in the vectors: the direction
$\langle 1, 1, 1 \rangle$ is perpendicular to the normal $\langle 1, -2, 1 \rangle$, because their
dot product is $0$.
:::
::::

### The angle between two planes

Two planes that meet form the same angle as their normals, up to replacing it with its supplement.
The angle between planes is by convention the acute one.

:::proposition[Angle between two planes]
The acute angle $\theta$ between planes with normals $\mathbf{n}_1$ and $\mathbf{n}_2$ satisfies

$$
\cos\theta = \frac{|\mathbf{n}_1 \cdot \mathbf{n}_2|}{|\mathbf{n}_1|\,|\mathbf{n}_2|} .
$$
:::

::::example[Two planes at an angle]
Find the angle between $x + 2y + 2z = 5$ and $2x - y + 2z = 1$.

:::solution
The normals are $\langle 1, 2, 2 \rangle$ and $\langle 2, -1, 2 \rangle$, each of length $3$, and
their dot product is $2 - 2 + 4 = 4$. So $\cos\theta = \frac49$ and $\theta \approx 63.6°$.
:::
::::

### Distance from a point to a plane

Take any point $P_1$ of the plane and the point $P_0$ whose distance is wanted. The shortest way
from $P_0$ to the plane runs along the normal, so the distance is the length of the projection of
$\overrightarrow{P_1P_0}$ onto $\mathbf{n}$.

::::proposition[Distance from a point to a plane]
The distance from $P_0(x_0, y_0, z_0)$ to the plane $ax + by + cz + d = 0$ is

$$
D = \frac{|ax_0 + by_0 + cz_0 + d|}{\sqrt{a^2 + b^2 + c^2}} .
$$

:::proof
Let $P_1(x_1, y_1, z_1)$ be in the plane, so $ax_1 + by_1 + cz_1 = -d$. The distance is the absolute
value of the scalar projection of $\overrightarrow{P_1P_0}$ onto $\mathbf{n} = \langle a, b, c \rangle$,
that is $D = \frac{|\mathbf{n} \cdot \overrightarrow{P_1P_0}|}{|\mathbf{n}|}$. The numerator is

$$
\begin{aligned}
\mathbf{n} \cdot \overrightarrow{P_1P_0} &= a(x_0 - x_1) + b(y_0 - y_1) + c(z_0 - z_1) \\
&= ax_0 + by_0 + cz_0 + d ,
\end{aligned}
$$

and the denominator is $\sqrt{a^2 + b^2 + c^2}$.
:::
::::

::::example[A point and a plane]
Find the distance from $(1, -2, 3)$ to the plane $2x - y + 2z = 3$.

:::solution
Move the constant to the left, $2x - y + 2z - 3 = 0$, and substitute:

$$
D = \frac{|2(1) - (-2) + 2(3) - 3|}{\sqrt{4 + 1 + 4}} = \frac{7}{3} .
$$
:::
::::

Two parallel planes are a constant distance apart, so the formula with any point of one of them
gives that distance.

::::example[Two parallel planes]
Find the distance between $x + 2y - 2z = 3$ and $2x + 4y - 4z = 18$.

:::solution
Divide the second equation by $2$: $x + 2y - 2z = 9$, with the same normal $\langle 1, 2, -2 \rangle$,
so the planes are parallel. The point $(9, 0, 0)$ lies on the second one, and

$$
D = \frac{|9 + 0 - 0 - 3|}{\sqrt{1 + 4 + 4}} = \frac{6}{3} = 2 .
$$
:::
::::

### Distance between skew lines

Skew lines lie in two parallel planes, both with the normal $\mathbf{n} = \mathbf{v}_1 \times \mathbf{v}_2$.
The distance between the lines is the distance between those planes.

:::proposition[Distance between skew lines]
If $P_1$ is on the line with direction $\mathbf{v}_1$ and $P_2$ on the line with direction
$\mathbf{v}_2$, and $\mathbf{n} = \mathbf{v}_1 \times \mathbf{v}_2 \ne \mathbf{0}$, then

$$
D = \frac{|\overrightarrow{P_1P_2} \cdot \mathbf{n}|}{|\mathbf{n}|} .
$$
:::

::::example[How far apart two skew lines are]
Find the distance between the skew lines of the earlier example: $x = 1 + t$, $y = -1 + 2t$, $z = t$
and $x = 2 - s$, $y = s$, $z = 3 + s$.

:::solution
The directions give

$$
\mathbf{n} = \langle 1, 2, 1 \rangle \times \langle -1, 1, 1 \rangle = \langle 1, -2, 3 \rangle .
$$

With $P_1(1, -1, 0)$ and $P_2(2, 0, 3)$, $\overrightarrow{P_1P_2} = \langle 1, 1, 3 \rangle$, so

$$
D = \frac{|1 - 2 + 9|}{\sqrt{1 + 4 + 9}} = \frac{8}{\sqrt{14}} = \frac{4\sqrt{14}}{7} \approx 2.14 .
$$
:::
::::

:::equations{#distance}
- *Angle of two planes*: $\cos\theta = \dfrac{|\mathbf{n}_1 \cdot \mathbf{n}_2|}{|\mathbf{n}_1|\,|\mathbf{n}_2|}$.
- *Point to plane*: $D = \dfrac{|ax_0 + by_0 + cz_0 + d|}{\sqrt{a^2 + b^2 + c^2}}$.
- *Skew lines*: $D = \dfrac{|\overrightarrow{P_1P_2} \cdot (\mathbf{v}_1 \times \mathbf{v}_2)|}{|\mathbf{v}_1 \times \mathbf{v}_2|}$.
:::

## Cylinders

### Traces

A surface is hard to draw directly. Slicing it is easier: fix one coordinate and look at the curve
left in the other two.

:::definition[Trace of a surface]
A **trace** (or **cross-section**) of a surface is the curve in which it meets a plane parallel to a
coordinate plane: $z = k$ (a **horizontal trace**), $x = k$ or $y = k$ (**vertical traces**).
:::

Setting $z = k$ in an equation leaves an equation in $x$ and $y$, a curve in that plane, and the same
goes for the other two. For the surfaces of this unit each trace is a conic, or a degenerate one: a
pair of lines, one point, or nothing.

### An equation with a variable missing

In space the equation $x^2 + y^2 = 1$ does not mention $z$, so it says nothing about $z$: every point
$(x, y, z)$ with $(x, y)$ on the circle belongs to it, at every height. The surface is a tube.

:::definition[Cylinder]
A **cylinder** is the surface swept out by all lines, called **rulings**, that are parallel to a given
line and pass through a given plane curve, the **generating curve**.
:::

So an equation in two of the three variables is a cylinder: its generating curve is that equation
drawn in the plane of the two variables, and its rulings run along the axis of the missing variable.

| Equation | Missing | Generating curve | Surface |
|---|---|---|---|
| $\frac{x^2}{a^2} + \frac{y^2}{b^2} = 1$ | $z$ | ellipse in the $xy$-plane | elliptic cylinder, along the $z$-axis |
| $x^2 + y^2 = a^2$ | $z$ | circle | circular cylinder of radius $a$, axis the $z$-axis |
| $x^2 + z^2 = r^2$ | $y$ | circle in the $xz$-plane | circular cylinder of radius $r$, axis the $y$-axis |
| $y^2 + z^2 = r^2$ | $x$ | circle in the $yz$-plane | circular cylinder of radius $r$, axis the $x$-axis |
| $y = x^2$ | $z$ | parabola in the $xy$-plane | parabolic cylinder |

::::example[Naming two cylinders]
Describe the surfaces $z = 4 - y^2$ and $4x^2 + z^2 = 16$ in space.

:::solution
The first has no $x$: the parabola $z = 4 - y^2$ in the $yz$-plane, slid along the $x$-axis. It is a
parabolic cylinder, like a tunnel roof.

The second has no $y$: dividing by $16$ gives $\frac{x^2}{4} + \frac{z^2}{16} = 1$, an ellipse in the
$xz$-plane with semi-axes $2$ and $4$, slid along the $y$-axis. It is an elliptic cylinder.
:::
::::

:::caution[Count the dimensions before naming the curve]
$x^2 + y^2 = 1$ is a circle in the plane and a cylinder in space. The same goes for $y = x^2$, and for
$y = 3$, which is a line in the plane and a plane in space. An equation describes a curve in space
only with a second equation beside it: $x^2 + y^2 = 1$, $z = 2$ is a circle at height $2$.
:::

## Quadric surfaces

### The general equation

:::definition[Quadric surface]
A **quadric surface** is the graph in space of a second-degree equation in $x$, $y$, $z$:

$$
\begin{aligned}
&Ax^2 + By^2 + Cz^2 + Dxy \\
&\quad + Exz + Fyz + Gx + Hy + Iz + J = 0 .
\end{aligned}
$$
:::

Rotating and shifting the axes brings every such equation to one of two shapes,

$$
Ax^2 + By^2 + Cz^2 + J = 0 \qquad\text{or}\qquad Ax^2 + By^2 + Iz = 0 ,
$$

and that gives the six basic surfaces below (with the cylinders of the previous part as the cases
with a variable missing). The equations here have no product terms such as $xy$, so completing squares
is all the shifting needed.

### The six basic surfaces

In each case $a, b, c > 0$ unless stated. The traces tell the shape.

:::definition[Ellipsoid]
$$
\frac{x^2}{a^2} + \frac{y^2}{b^2} + \frac{z^2}{c^2} = 1 .
$$

All three kinds of trace are ellipses. If $a = b = c$ it is the sphere $x^2 + y^2 + z^2 = a^2$.
:::

Setting $z = k$ shows how a trace depends on the height:

$$
\frac{x^2}{a^2} + \frac{y^2}{b^2} = 1 - \frac{k^2}{c^2} .
$$

The right side is positive for $-c < k < c$, which gives ellipses. It is $0$ at $k = \pm c$, which
leaves the single points $(0, 0, \pm c)$. It is negative for $|k| > c$, and then the trace is empty.
The surface lies between the planes $z = \pm c$. The same reading works for $y = k$ and $x = k$.
Solved for $z$, the ellipsoid splits into two graphs,

$$
z = c\sqrt{1 - \frac{x^2}{a^2} - \frac{y^2}{b^2}} \quad\text{(upper half)}, \qquad z = -c\sqrt{1 - \frac{x^2}{a^2} - \frac{y^2}{b^2}} \quad\text{(lower half)}.
$$

:::definition[Hyperboloid of one sheet]
$$
\frac{x^2}{a^2} + \frac{y^2}{b^2} - \frac{z^2}{c^2} = 1 .
$$

Horizontal traces are ellipses, at every height; vertical traces are hyperbolas. The surface is one
connected tube, narrowest at $z = 0$. The axis is the variable with the **minus** sign.
:::

:::definition[Hyperboloid of two sheets]
$$
-\frac{x^2}{a^2} - \frac{y^2}{b^2} + \frac{z^2}{c^2} = 1 .
$$

Horizontal traces are ellipses for $|k| > c$, single points at $k = \pm c$, and empty for $|k| < c$;
vertical traces are hyperbolas. The surface is two separate bowls. The axis is the variable with the
**plus** sign.
:::

:::definition[Elliptic cone]
$$
\frac{x^2}{a^2} + \frac{y^2}{b^2} = \frac{z^2}{c^2} .
$$

Horizontal traces are ellipses that shrink to the vertex at $z = 0$; vertical traces $x = k$, $y = k$
are hyperbolas for $k \ne 0$. With $a = b$ the horizontal traces are circles (a **circular cone**).
The variable alone on one side is the axis along which it opens:
$\frac{x^2}{a^2} + \frac{z^2}{c^2} = \frac{y^2}{b^2}$ opens along the $y$-axis, and
$\frac{y^2}{b^2} + \frac{z^2}{c^2} = \frac{x^2}{a^2}$ along the $x$-axis.
:::

:::definition[Elliptic paraboloid]
$$
\frac{x^2}{a^2} + \frac{y^2}{b^2} = \frac{z}{c} , \qquad c \ne 0 .
$$

Horizontal traces are ellipses; vertical traces are parabolas. If $c > 0$ then $z \ge 0$ and it opens
upward; if $c < 0$ then $z \le 0$ and it opens downward. With $a = b$ it is a **circular paraboloid**.
The variable of degree one is the axis.
:::

:::definition[Hyperbolic paraboloid]
$$
\frac{x^2}{a^2} - \frac{y^2}{b^2} = \frac{z}{c} , \qquad c \ne 0 .
$$

Horizontal traces are hyperbolas; vertical traces are parabolas, opening up in one direction and down
in the other. The surface is a saddle. Which hyperbola appears depends on the sign of $k$: for
$c > 0$ the branches open along the $x$-axis when $k > 0$ and along the $y$-axis when $k < 0$.
:::

:::remark
"Vertical traces are hyperbolas" has exceptions at single values of $k$, where the hyperbola
degenerates into two crossing lines: $x = 0$ or $y = 0$ for the cone, $x = \pm a$ or $y = \pm b$ for
the hyperboloid of one sheet, and $z = 0$ for the hyperbolic paraboloid. These are special slices of
the same surface, not a different surface.
:::

| Surface | Signs and powers | $z = k$ | $x = k$, $y = k$ |
|---|---|---|---|
| ellipsoid | all squared, $= 1$, all $+$ | ellipses, for $\lvert k\rvert \le c$ | ellipses |
| hyperboloid, one sheet | all squared, $= 1$, one $-$ | ellipses, every $k$ | hyperbolas |
| hyperboloid, two sheets | all squared, $= 1$, two $-$ | ellipses, for $\lvert k\rvert \ge c$ | hyperbolas |
| elliptic cone | all squared, $= 0$ | ellipses, point at $0$ | hyperbolas |
| elliptic paraboloid | one variable linear, squares of one sign | ellipses, one side only | parabolas |
| hyperbolic paraboloid | one variable linear, squares of opposite signs | hyperbolas | parabolas |

```sim
id: quadric-traces
controls:
  - {id: type, label: "Surface (0: ellipsoid, 1: one sheet, 2: two sheets, 3: cone, 4: elliptic paraboloid, 5: hyperbolic paraboloid)", min: 0, max: 5, step: 1, default: 1, decimals: 0}
  - {id: a, label: a, min: 0.5, max: 3, step: 0.1, default: 1.5, decimals: 1}
  - {id: b, label: b, min: 0.5, max: 3, step: 0.1, default: 1.5, decimals: 1}
  - {id: c, label: c, min: 0.5, max: 3, step: 0.1, default: 1.5, decimals: 1}
  - {id: k, label: Height k of the slice z = k, min: -3, max: 3, step: 0.1, default: 1, decimals: 1}
note: 'Move the plane z = k and watch the red trace. On the ellipsoid it disappears once |k| > c; on two sheets it exists only for |k| ≥ c; on the cone it shrinks to a point at k = 0; on the hyperbolic paraboloid the hyperbola swaps its branches as k changes sign. Drag the surface to turn it.'
```

### Identifying a quadric

:::steps[Classifying a quadric surface]
1. A variable missing: a **cylinder** over the curve in the other two.
2. Linear terms in a variable that is also squared: complete the square, so that each variable appears once.
3. One variable only to the first power: a **paraboloid**. Squares of the same sign give elliptic, opposite signs give hyperbolic. The linear variable is the axis.
4. All three squared: move the constant to the right. Right side $0$: a **cone**. Otherwise divide to make the right side $1$.
5. Count the minus signs on the left: none is an **ellipsoid**, one is a **hyperboloid of one sheet** (axis: the minus variable), two is a **hyperboloid of two sheets** (axis: the plus variable). Three gives no points.
6. Check with one trace.
:::

::::example[Two hyperboloids]
Identify $9x^2 - 4y^2 + 36z^2 = 36$ and $x^2 - 9y^2 - 9z^2 = 9$.

:::solution
Dividing the first by $36$ gives $\frac{x^2}{4} - \frac{y^2}{9} + z^2 = 1$. One minus sign: a
hyperboloid of one sheet whose axis is the $y$-axis. Its traces $y = k$ are the ellipses
$\frac{x^2}{4} + z^2 = 1 + \frac{k^2}{9}$, present at every $k$.

Dividing the second by $9$ gives $\frac{x^2}{9} - y^2 - z^2 = 1$. Two minus signs: a hyperboloid of
two sheets whose axis is the $x$-axis. Its traces $x = k$ are $y^2 + z^2 = \frac{k^2}{9} - 1$:
circles for $|k| > 3$, the points $(\pm 3, 0, 0)$ at $k = \pm 3$, and nothing between.
:::
::::

::::example[Completing squares in three variables]
Identify $x^2 + 2y^2 - z^2 - 4x + 8y + 2z + 9 = 0$.

:::solution
Group the variables and complete each square:

$$
(x - 2)^2 - 4 + 2(y + 2)^2 - 8 - (z - 1)^2 + 1 + 9 = 0 ,
$$

so $(x - 2)^2 + 2(y + 2)^2 - (z - 1)^2 = 2$, and dividing by $2$,

$$
\frac{(x - 2)^2}{2} + (y + 2)^2 - \frac{(z - 1)^2}{2} = 1 .
$$

One minus sign: a hyperboloid of one sheet, centred at $(2, -2, 1)$, with its axis parallel to the
$z$-axis.
:::
::::

::::example[A paraboloid along the x-axis]
Identify $x = y^2 + 4z^2 - 6y + 8z + 15$.

:::solution
Only $x$ is linear, so this is a paraboloid along the $x$-direction. Completing the squares,

$$
x = (y - 3)^2 - 9 + 4(z + 1)^2 - 4 + 15 \quad\Longleftrightarrow\quad x - 2 = (y - 3)^2 + 4(z + 1)^2 .
$$

The squares have the same sign: an elliptic paraboloid with vertex $(2, 3, -1)$, opening toward
increasing $x$. The traces $x = k$ are ellipses for $k > 2$.
:::
::::

::::example[A shifted cone]
Identify $4x^2 + 9y^2 - z^2 + 8x - 18y + 13 = 0$.

:::solution
Completing the squares, $4(x + 1)^2 - 4 + 9(y - 1)^2 - 9 - z^2 + 13 = 0$, and the constants cancel:

$$
4(x + 1)^2 + 9(y - 1)^2 = z^2 .
$$

The right side is $0$ once everything is on the left: an elliptic cone with vertex $(-1, 1, 0)$
opening along a line parallel to the $z$-axis.
:::
::::

:::caution[Read the signs only after the right side is positive]
$-x^2 + 4y^2 - z^2 = 4$ has one plus sign on the left, not one minus: dividing by $4$ gives
$-\frac{x^2}{4} + y^2 - \frac{z^2}{4} = 1$, with **two** minus signs, so it is two sheets with axis the
$y$-axis. And $x^2 + y^2 - z^2 = -1$ is not a one-sheet surface: multiplied by $-1$ it is
$-x^2 - y^2 + z^2 = 1$, two sheets.
:::

```python
# Completing the squares by machine, and reading the trace z = k.
from sympy import symbols, expand

x, y, z, k = symbols('x y z k')
eq = x**2 + 2*y**2 - z**2 - 4*x + 8*y + 2*z + 9
standard = (x - 2)**2 + 2*(y + 2)**2 - (z - 1)**2 - 2
print(expand(eq - standard))     # 0: the two forms agree
print(standard.subs(z, 1 + k))   # the slice at height 1 + k: an ellipse for every k
```

:::insight
A quadric is read from its equation in two steps: the powers and the signs name it, and the traces
confirm it. Every trace is a conic from earlier in the course, so a surface is a stack of known curves.
:::

:::equations{#quadric}
- *Ellipsoid*: $\frac{x^2}{a^2} + \frac{y^2}{b^2} + \frac{z^2}{c^2} = 1$.
- *Hyperboloid of one sheet*: $\frac{x^2}{a^2} + \frac{y^2}{b^2} - \frac{z^2}{c^2} = 1$.
- *Hyperboloid of two sheets*: $-\frac{x^2}{a^2} - \frac{y^2}{b^2} + \frac{z^2}{c^2} = 1$.
- *Elliptic cone*: $\frac{x^2}{a^2} + \frac{y^2}{b^2} = \frac{z^2}{c^2}$.
- *Elliptic paraboloid*: $\frac{x^2}{a^2} + \frac{y^2}{b^2} = \frac{z}{c}$.
- *Hyperbolic paraboloid*: $\frac{x^2}{a^2} - \frac{y^2}{b^2} = \frac{z}{c}$.
:::

## Further reading

- [Wikipedia — Skew lines](https://en.wikipedia.org/wiki/Skew_lines) — why two lines in space can miss each other without being parallel.
- [Wikipedia — Distance from a point to a plane](https://en.wikipedia.org/wiki/Distance_from_a_point_to_a_plane) — the projection argument and its coordinate form.
- [Wikipedia — Quadric](https://en.wikipedia.org/wiki/Quadric) — the general equation and the full list of surfaces.
- [Wikipedia — Hyperboloid](https://en.wikipedia.org/wiki/Hyperboloid) — one and two sheets side by side.
