---
title: Vectors, dot and cross products
order: 4
asks: lengths and spheres, angles, projections, perpendicular vectors, areas
units: [vectors-3d, dot-cross-product]
---

## Logic

The dot product answers "how much do these two point the same way?" with a number. The cross product
answers "what is perpendicular to both?" with a vector whose length is an area. Almost every problem
here is one of those two questions, so decide first whether the answer is a number or a vector.

## Pattern

:::steps[Choosing the product]
1. Sphere: complete three squares to get $(x - h)^2 + (y - k)^2 + (z - l)^2 = r^2$.
2. Angle or perpendicularity: $\cos\theta = \frac{\mathbf{a} \cdot \mathbf{b}}{|\mathbf{a}|\,|\mathbf{b}|}$; perpendicular means $\mathbf{a} \cdot \mathbf{b} = 0$.
3. Projection of $\mathbf{b}$ onto $\mathbf{a}$: scalar $\frac{\mathbf{a} \cdot \mathbf{b}}{|\mathbf{a}|}$, vector $\frac{\mathbf{a} \cdot \mathbf{b}}{|\mathbf{a}|^2}\,\mathbf{a}$.
4. A vector perpendicular to two others: $\mathbf{a} \times \mathbf{b}$. Check with two dot products.
5. Area: parallelogram $|\mathbf{a} \times \mathbf{b}|$, triangle half of it.
:::

## Traps

:::caution[Traps]
- The middle component of a cross product has the opposite sign in the determinant expansion.
- $\mathbf{b} \times \mathbf{a} = -\mathbf{a} \times \mathbf{b}$, while $\mathbf{a} \cdot \mathbf{b} = \mathbf{b} \cdot \mathbf{a}$.
- "Projection of $\mathbf{b}$ onto $\mathbf{a}$" divides by $|\mathbf{a}|$, not $|\mathbf{b}|$.
- The vector projection divides by $|\mathbf{a}|^2$, the scalar one by $|\mathbf{a}|$.
- $(\mathbf{a} \cdot \mathbf{b}) \cdot \mathbf{c}$ makes no sense: a number cannot be dotted with a vector.
:::

## Worked problems

::::exercise[Everything about one pair of vectors]
For $\mathbf{a} = \langle 2, 1, -2 \rangle$ and $\mathbf{b} = \langle 3, 0, 4 \rangle$, find the angle between them, the projection of $\mathbf{b}$ onto $\mathbf{a}$, and the area of their parallelogram.

:::solution
$|\mathbf{a}| = 3$, $|\mathbf{b}| = 5$ and $\mathbf{a} \cdot \mathbf{b} = 6 - 8 = -2$. So $\cos\theta = -\frac{2}{15}$ and $\theta \approx 97.7°$, obtuse as the sign says.

Scalar projection: $-\frac23$. Vector projection: $-\frac29\langle 2, 1, -2 \rangle$.

$\mathbf{a} \times \mathbf{b} = \langle 4, -14, -3 \rangle$. Check: $8 - 14 + 6 = 0$ and $12 - 12 = 0$. The area is $\sqrt{16 + 196 + 9} = \sqrt{221}$.
:::
::::

:::note[Pattern at work]
Steps 2, 3, 4 and 5 in turn, each using numbers already found. The two zero dot products catch any slip in the cross product.
:::

::::exercise[A triangle, a sphere, a missing number]
(a) Find the area of the triangle with vertices $P(1, 0, 1)$, $Q(2, 2, 0)$, $R(0, 1, 3)$. (b) Find the centre and radius of $x^2 + y^2 + z^2 - 4x + 6y - 2z - 2 = 0$. (c) For which $c$ are $\langle c, 1, 2 \rangle$ and $\langle 3, -c, 1 \rangle$ perpendicular?

:::solution
(a) $\overrightarrow{PQ} = \langle 1, 2, -1 \rangle$, $\overrightarrow{PR} = \langle -1, 1, 2 \rangle$, and their cross product is $\langle 5, -1, 3 \rangle$. The area is $\frac12\sqrt{35}$.

(b) $(x - 2)^2 + (y + 3)^2 + (z - 1)^2 = 2 + 4 + 9 + 1 = 16$: centre $(2, -3, 1)$, radius $4$.

(c) $3c - c + 2 = 0$, so $c = -1$.
:::
::::

:::note[Pattern at work]
(a) is step 5 with both vectors drawn from one vertex. (b) is step 1, adding the same constants to both sides. (c) is step 2 as an equation.
:::
