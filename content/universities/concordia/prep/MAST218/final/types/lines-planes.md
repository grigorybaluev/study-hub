---
title: Lines and planes
order: 5
asks: build a line or a plane from the data, intersections, relative position, distances, angles
units: [lines-planes-surfaces]
---

## Logic

A line needs a point and a direction; a plane needs a point and a normal. Every construction problem
is about finding those two pieces, usually with one cross product. Every question about position is a
substitution or a comparison of the same vectors. The map tab draws all the conversions.

## Pattern

:::steps[Building lines and planes]
1. Write down what is given as vectors: points, directions, normals. Read normals off the coefficients.
2. A plane: find $\mathbf{n}$, directly, or from $\mathbf{n} = \mathbf{u} \times \mathbf{v}$ with two directions in it.
3. A line: find $\mathbf{v}$, directly, from two points, or from $\mathbf{n}_1 \times \mathbf{n}_2$ for two planes.
4. Attach a point. For a line of two planes, set one variable to $0$ and solve.
5. Check: substitute the given points into the answer.
:::

:::steps[Comparing and measuring]
1. Line against plane: substitute the line into the plane and solve for $t$.
2. Two lines: compare directions, then solve with two parameters, using the third equation as the test.
3. Distance from a point to a plane: $\frac{|ax_0 + by_0 + cz_0 + d|}{\sqrt{a^2 + b^2 + c^2}}$.
4. Skew lines: $\frac{|\overrightarrow{P_1P_2} \cdot (\mathbf{v}_1 \times \mathbf{v}_2)|}{|\mathbf{v}_1 \times \mathbf{v}_2|}$.
5. Angle of two planes: the acute angle between the normals.
:::

## Traps

:::caution[Traps]
- A direction lying in a plane is perpendicular to its normal, not equal to it.
- Two lines need two parameters.
- Parallel to a plane means $\mathbf{v} \cdot \mathbf{n} = 0$; perpendicular to it means $\mathbf{v} \parallel \mathbf{n}$.
- Symmetric form hides signs: $\frac{x - 1}{2} = \frac{y + 3}{-1} = z$ has point $(1, -3, 0)$.
- Before comparing planes, or using the distance formula, put the equation in the form the formula expects.
:::

## Worked problems

::::exercise[A plane from three points]
Find the plane through $P(1, 2, 0)$, $Q(3, 0, 1)$, $R(0, 1, 2)$, and the area of the triangle $PQR$.

:::solution
$\overrightarrow{PQ} = \langle 2, -2, 1 \rangle$ and $\overrightarrow{PR} = \langle -1, -1, 2 \rangle$, so
$\overrightarrow{PQ} \times \overrightarrow{PR} = \langle -3, -5, -4 \rangle$, and $\mathbf{n} = \langle 3, 5, 4 \rangle$ also works.

$3(x - 1) + 5(y - 2) + 4z = 0$, that is $3x + 5y + 4z = 13$. Check: $Q$ gives $9 + 4 = 13$ and $R$ gives $5 + 8 = 13$.

The area is $\frac12\sqrt{9 + 25 + 16} = \frac{5\sqrt{2}}{2}$.
:::
::::

:::note[Pattern at work]
Steps 2, 4 and 5 of the first list. The same cross product gives the plane and the area.
:::

::::exercise[Two lines and the plane they span]
Do $L_1$: $x = 1 + t$, $y = 2 - t$, $z = 3t$ and $L_2$: $x = 2 + 2s$, $y = 1 + s$, $z = 3 - s$ meet? If so, find the plane containing both.

:::solution
The directions $\langle 1, -1, 3 \rangle$ and $\langle 2, 1, -1 \rangle$ are not multiples. Equate two coordinates: $1 + t = 2 + 2s$ and $2 - t = 1 + s$. Adding gives $3 = 3 + 3s$, so $s = 0$ and $t = 1$. The third coordinate gives $3 = 3$: they meet at $(2, 1, 3)$.

The normal is $\langle 1, -1, 3 \rangle \times \langle 2, 1, -1 \rangle = \langle -2, 7, 3 \rangle$, so
$-2(x - 2) + 7(y - 1) + 3(z - 3) = 0$, that is $-2x + 7y + 3z = 12$.
:::
::::

:::note[Pattern at work]
Step 2 of the second list decides the position; only because the lines meet does the plane exist. Then two directions give the normal.
:::

::::exercise[Two planes: the line and the angle]
Find the line where $x + y + z = 3$ and $x - y + 2z = 2$ meet, and the angle between the planes.

:::solution
$\mathbf{v} = \langle 1, 1, 1 \rangle \times \langle 1, -1, 2 \rangle = \langle 3, -1, -2 \rangle$. With $z = 0$: $x + y = 3$ and $x - y = 2$, so $x = \frac52$, $y = \frac12$:

$$
x = \frac52 + 3t \qquad y = \frac12 - t \qquad z = -2t .
$$

$\cos\theta = \frac{|1 - 1 + 2|}{\sqrt{3}\sqrt{6}} = \frac{\sqrt{2}}{3}$, so $\theta \approx 61.9°$.
:::
::::

:::note[Pattern at work]
Step 3 and step 4 of the first list, then step 5 of the second. Both answers come from the same two normals.
:::
