---
title: Dot product and cross product
order: 7
status: detailed
weeks: [4, 5]
introduces: []
requires:
  - {concept: vector, strength: hard}
reinforces:
  - {concept: dot-product, perspective: "component formula, algebraic rules, the angle formula a · b = |a||b| cos θ, scalar and vector projections, direction cosines"}
  - {concept: cross-product, perspective: "determinant formula and right-hand rule, |a × b| = |a||b| sin θ as the area of a parallelogram, algebraic rules"}
---

Two ways to multiply vectors. The dot product turns two vectors into a number that measures how
much they point the same way: lengths, angles, perpendicularity and projections all come from it.
The cross product turns two vectors in space into a third vector perpendicular to both, whose
length is the area of the parallelogram they span. Together they are the tools for the lines and
planes of the next unit: the dot product tests perpendicularity, the cross product produces it.

## The dot product

### Definition

:::definition[Dot product]
For $\mathbf{a} = \langle a_1, a_2, \dots, a_n \rangle$ and $\mathbf{b} = \langle b_1, b_2, \dots, b_n \rangle$,
the **dot product** (also inner or scalar product) is the number

$$
\mathbf{a} \cdot \mathbf{b} = a_1b_1 + a_2b_2 + \dots + a_nb_n .
$$
:::

::::example[A dot product in space]
Compute $\langle 2, -1, 3 \rangle \cdot \langle -1, 4, 5 \rangle$.

:::solution
Multiply matching components and add:

$$
2 \cdot (-1) + (-1) \cdot 4 + 3 \cdot 5 = -2 - 4 + 15 = 9 .
$$
:::
::::

The result is a scalar, not a vector. So $\mathbf{a} \cdot \mathbf{0} = 0$ (a number), and an
expression such as $(\mathbf{a} \cdot \mathbf{b}) \cdot \mathbf{c}$ is meaningless: the bracket is
already a number, and a number cannot be dotted with a vector.

### Properties

::::proposition[Rules of the dot product]
For vectors $\mathbf{a}, \mathbf{b}, \mathbf{c}$ in $V_n$ and a scalar $c$:

1. $\mathbf{a} \cdot \mathbf{a} = a_1^2 + a_2^2 + \dots + a_n^2 = |\mathbf{a}|^2$;
2. $c(\mathbf{a} \cdot \mathbf{b}) = (c\mathbf{a}) \cdot \mathbf{b} = \mathbf{a} \cdot (c\mathbf{b})$;
3. $\mathbf{a} \cdot \mathbf{b} = \mathbf{b} \cdot \mathbf{a}$;
4. $\mathbf{a} \cdot (\mathbf{b} + \mathbf{c}) = \mathbf{a} \cdot \mathbf{b} + \mathbf{a} \cdot \mathbf{c}$;
5. $(\mathbf{a} + \mathbf{b}) \cdot \mathbf{c} = \mathbf{a} \cdot \mathbf{c} + \mathbf{b} \cdot \mathbf{c}$.

:::proof
Each rule holds in every component, because it holds for numbers. For rule 4, the $i$-th term
of $\mathbf{a} \cdot (\mathbf{b} + \mathbf{c})$ is $a_i(b_i + c_i) = a_ib_i + a_ic_i$; summing over
$i$ gives $\mathbf{a} \cdot \mathbf{b} + \mathbf{a} \cdot \mathbf{c}$. Rule 1 is the length formula
squared, and rule 5 follows from rules 3 and 4.
:::
::::

Rule 1 links the dot product to length, and rules 2–5 let a dot product of sums be expanded like
a product of brackets in algebra.

::::example[The parallelogram identity]
Expand $|\mathbf{a} + \mathbf{b}|^2$ and $|\mathbf{a} - \mathbf{b}|^2$, and add them.

:::solution
By rule 1, a squared length is a dot product with itself; expand with rules 3–5:

$$
|\mathbf{a} + \mathbf{b}|^2 = (\mathbf{a} + \mathbf{b}) \cdot (\mathbf{a} + \mathbf{b}) = |\mathbf{a}|^2 + 2\,\mathbf{a} \cdot \mathbf{b} + |\mathbf{b}|^2 ,
$$

and in the same way

$$
|\mathbf{a} - \mathbf{b}|^2 = |\mathbf{a}|^2 - 2\,\mathbf{a} \cdot \mathbf{b} + |\mathbf{b}|^2 .
$$

Adding, the middle terms cancel:

$$
|\mathbf{a} + \mathbf{b}|^2 + |\mathbf{a} - \mathbf{b}|^2 = 2|\mathbf{a}|^2 + 2|\mathbf{b}|^2 .
$$

$\mathbf{a} + \mathbf{b}$ and $\mathbf{a} - \mathbf{b}$ are the two diagonals of the parallelogram
on $\mathbf{a}$ and $\mathbf{b}$: the squares of the diagonals add up to the squares of the four
sides.
:::
::::

### The angle between two vectors

The angle $\theta$ between nonzero vectors $\mathbf{a}$ and $\mathbf{b}$ is the angle between them
when they are drawn from the same tail, taken in $0 \le \theta \le \pi$.

::::theorem[Geometric form of the dot product]
For nonzero vectors $\mathbf{a}$ and $\mathbf{b}$ with angle $\theta$ between them,

$$
\mathbf{a} \cdot \mathbf{b} = |\mathbf{a}|\,|\mathbf{b}| \cos\theta .
$$

:::proof
Draw $\mathbf{a}$ and $\mathbf{b}$ from one tail. The third side of the triangle they span is
$\mathbf{a} - \mathbf{b}$, and the law of cosines gives

$$
|\mathbf{a} - \mathbf{b}|^2 = |\mathbf{a}|^2 + |\mathbf{b}|^2 - 2|\mathbf{a}|\,|\mathbf{b}| \cos\theta .
$$

The expansion in the last example gives $|\mathbf{a} - \mathbf{b}|^2 = |\mathbf{a}|^2 - 2\,\mathbf{a} \cdot \mathbf{b} + |\mathbf{b}|^2$.
Comparing the two, $\mathbf{a} \cdot \mathbf{b} = |\mathbf{a}|\,|\mathbf{b}| \cos\theta$. (If the
vectors are parallel the triangle is flat, and both sides are $\pm|\mathbf{a}|\,|\mathbf{b}|$.)
:::
::::

The component formula is easy to compute, and the geometric formula says what the number means:
the dot product is positive when the angle is acute, zero when it is a right angle, and negative
when it is obtuse.

:::caution[The angle between two vectors is at most $\pi$]
The angle between two vectors is never more than $\pi$. $\cos\theta$ is decreasing on $[0, \pi]$,
so the sign and size of $\mathbf{a} \cdot \mathbf{b}$ pin $\theta$ down exactly; an angle such as
$\frac{3\pi}{2}$ would make the formula ambiguous.
:::

### What the sign says

Since $|\mathbf{a}|\,|\mathbf{b}| > 0$, the sign of $\mathbf{a} \cdot \mathbf{b}$ is the sign of
$\cos\theta$. There are five cases:

| Angle | Dot product | Picture |
|---|---|---|
| $\theta = 0$ | $\mathbf{a} \cdot \mathbf{b} = \lvert\mathbf{a}\rvert\,\lvert\mathbf{b}\rvert > 0$ | same direction |
| $0 < \theta < \frac{\pi}{2}$ | $\mathbf{a} \cdot \mathbf{b} > 0$ | acute angle |
| $\theta = \frac{\pi}{2}$ | $\mathbf{a} \cdot \mathbf{b} = 0$ | right angle |
| $\frac{\pi}{2} < \theta < \pi$ | $\mathbf{a} \cdot \mathbf{b} < 0$ | obtuse angle |
| $\theta = \pi$ | $\mathbf{a} \cdot \mathbf{b} = -\lvert\mathbf{a}\rvert\,\lvert\mathbf{b}\rvert < 0$ | opposite directions |

:::definition[Orthogonal vectors]
Vectors $\mathbf{a}$ and $\mathbf{b}$ are **orthogonal** (perpendicular), written
$\mathbf{a} \perp \mathbf{b}$, if

$$
\mathbf{a} \cdot \mathbf{b} = 0 .
$$

For nonzero vectors this says exactly that the angle between them is $\frac{\pi}{2}$; the zero
vector counts as orthogonal to every vector.
:::

A perpendicularity condition is one linear equation in the unknown components. Two conditions and
a length are enough to pin down a vector in space.

::::example[Unit vectors perpendicular to two vectors]
Find the unit vectors perpendicular to both $\mathbf{i} + \mathbf{j}$ and $\mathbf{j} + \mathbf{k}$.

:::solution
Let $\mathbf{a} = \langle a_1, a_2, a_3 \rangle$. Perpendicular to $\langle 1, 1, 0 \rangle$ and to
$\langle 0, 1, 1 \rangle$, and of length $1$:

$$
a_1 + a_2 = 0 \qquad a_2 + a_3 = 0 \qquad a_1^2 + a_2^2 + a_3^2 = 1 .
$$

The first two give $a_1 = -a_2$ and $a_3 = -a_2$, so the third becomes $3a_2^2 = 1$ and
$a_2 = \pm\frac{1}{\sqrt 3}$. The two answers are

$$
\frac{1}{\sqrt 3}\langle 1, -1, 1 \rangle \qquad\text{and}\qquad \frac{1}{\sqrt 3}\langle -1, 1, -1 \rangle ,
$$

one the negative of the other. The cross product below gives the same pair in one step.
:::
::::

::::example[Unit vectors at a given angle]
Find the unit vectors $\mathbf{a}$ in the plane that make the angle $\frac{\pi}{3}$ with
$\mathbf{b} = \langle -3, 4 \rangle$.

:::solution
Let $\mathbf{a} = \langle a_1, a_2 \rangle$. Then $|\mathbf{a}| = 1$, $|\mathbf{b}| = 5$ and
$\cos\frac{\pi}{3} = \frac12$, so the angle formula and the length give

$$
-3a_1 + 4a_2 = 1 \cdot 5 \cdot \tfrac12 = \tfrac52 \qquad a_1^2 + a_2^2 = 1 .
$$

From the first, $a_2 = \frac{5 + 6a_1}{8}$. Substituting,
$64a_1^2 + (5 + 6a_1)^2 = 64$, that is $100a_1^2 + 60a_1 - 39 = 0$, so

$$
a_1 = \frac{-3 \pm 4\sqrt 3}{10} \qquad a_2 = \frac{4 \pm 3\sqrt 3}{10} ,
$$

with matching signs. There are two answers, one on each side of $\mathbf{b}$.
:::
::::

::::example[An angle of a triangle]
Find the angle at $A$ of the triangle with vertices $A(-1, 2, 3)$, $B(1, 4, 5)$ and $C(2, -3, 7)$.

:::solution
The angle at $A$ is the angle between $\overrightarrow{AB}$ and $\overrightarrow{AC}$, both drawn
from $A$:

$$
\overrightarrow{AB} = \langle 2, 2, 2 \rangle \qquad \overrightarrow{AC} = \langle 3, -5, 4 \rangle .
$$

Then

$$
\cos\alpha = \frac{\overrightarrow{AB} \cdot \overrightarrow{AC}}{|\overrightarrow{AB}|\,|\overrightarrow{AC}|} = \frac{6 - 10 + 8}{\sqrt{12}\,\sqrt{50}} = \frac{4}{10\sqrt 6} = \frac{\sqrt 6}{15} ,
$$

so $\alpha = \arccos\frac{\sqrt 6}{15} \approx 80.6^\circ$. The law of cosines on the three side
lengths gives the same angle with more arithmetic.
:::
::::

:::caution[Both vectors must start at the vertex]
The angle at $A$ uses $\overrightarrow{AB}$ and $\overrightarrow{AC}$. Using $\overrightarrow{BA}$
for one of them reverses it and gives $\pi - \alpha$, the outside angle.
:::

:::equations{#dot}
- *Definition*: $\mathbf{a} \cdot \mathbf{b} = a_1b_1 + \dots + a_nb_n$, a scalar.
- *Length*: $\mathbf{a} \cdot \mathbf{a} = |\mathbf{a}|^2$.
- *Parallelogram identity*: $|\mathbf{a} + \mathbf{b}|^2 + |\mathbf{a} - \mathbf{b}|^2 = 2|\mathbf{a}|^2 + 2|\mathbf{b}|^2$.
- *Angle*: $\mathbf{a} \cdot \mathbf{b} = |\mathbf{a}|\,|\mathbf{b}| \cos\theta$, $0 \le \theta \le \pi$.
:::

## Projections and direction cosines

### Scalar and vector projections

Drop a perpendicular from the tip of $\mathbf{b}$ onto the line through $\mathbf{a}$. The foot
splits $\mathbf{b}$ into a part along $\mathbf{a}$ (its shadow on $\mathbf{a}$) and a part
perpendicular to $\mathbf{a}$. The shadow has signed length $|\mathbf{b}|\cos\theta$, and the dot
product computes it without the angle.

:::definition[Scalar and vector projections]
For $\mathbf{a} \ne \mathbf{0}$, the **scalar projection** of $\mathbf{b}$ onto $\mathbf{a}$ (the
component of $\mathbf{b}$ along $\mathbf{a}$) is the number

$$
\operatorname{comp}_{\mathbf{a}} \mathbf{b} = |\mathbf{b}|\cos\theta = \frac{\mathbf{a} \cdot \mathbf{b}}{|\mathbf{a}|} ,
$$

and the **vector projection** of $\mathbf{b}$ onto $\mathbf{a}$ is that number times the unit
vector along $\mathbf{a}$:

$$
\operatorname{proj}_{\mathbf{a}} \mathbf{b} = \frac{\mathbf{a} \cdot \mathbf{b}}{|\mathbf{a}|}\,\frac{\mathbf{a}}{|\mathbf{a}|} = \frac{\mathbf{a} \cdot \mathbf{b}}{|\mathbf{a}|^2}\,\mathbf{a} .
$$
:::

::::proposition[The rest of b is orthogonal to a]
The **orthogonal projection** $\operatorname{orth}_{\mathbf{a}} \mathbf{b} = \mathbf{b} - \operatorname{proj}_{\mathbf{a}} \mathbf{b}$
is orthogonal to $\mathbf{a}$, so

$$
\mathbf{b} = \operatorname{proj}_{\mathbf{a}} \mathbf{b} + \operatorname{orth}_{\mathbf{a}} \mathbf{b}
$$

splits $\mathbf{b}$ into a part parallel to $\mathbf{a}$ and a part perpendicular to it.

:::proof
$$
\mathbf{a} \cdot \left(\mathbf{b} - \frac{\mathbf{a} \cdot \mathbf{b}}{|\mathbf{a}|^2}\,\mathbf{a}\right) = \mathbf{a} \cdot \mathbf{b} - \frac{\mathbf{a} \cdot \mathbf{b}}{|\mathbf{a}|^2}\,|\mathbf{a}|^2 = 0 .
$$
:::
::::

::::example[Projecting one vector onto another]
Let $\mathbf{a} = \langle 2, 1, -2 \rangle$ and $\mathbf{b} = \langle 3, -1, 4 \rangle$. Find
$\operatorname{comp}_{\mathbf{a}} \mathbf{b}$, $\operatorname{proj}_{\mathbf{a}} \mathbf{b}$ and
$\operatorname{orth}_{\mathbf{a}} \mathbf{b}$.

:::solution
$\mathbf{a} \cdot \mathbf{b} = 6 - 1 - 8 = -3$ and $|\mathbf{a}| = 3$, so

$$
\operatorname{comp}_{\mathbf{a}} \mathbf{b} = \frac{-3}{3} = -1 \qquad \operatorname{proj}_{\mathbf{a}} \mathbf{b} = \frac{-3}{9}\,\mathbf{a} = \left\langle -\tfrac23, -\tfrac13, \tfrac23 \right\rangle .
$$

The scalar projection is negative because the angle is obtuse: the shadow of $\mathbf{b}$ points
against $\mathbf{a}$. The rest is

$$
\operatorname{orth}_{\mathbf{a}} \mathbf{b} = \langle 3, -1, 4 \rangle - \left\langle -\tfrac23, -\tfrac13, \tfrac23 \right\rangle = \left\langle \tfrac{11}{3}, -\tfrac23, \tfrac{10}{3} \right\rangle ,
$$

and indeed $\mathbf{a} \cdot \operatorname{orth}_{\mathbf{a}} \mathbf{b} = \frac{22 - 2 - 20}{3} = 0$.
:::
::::

::::example[All vectors with a given component]
Let $\mathbf{a} = \langle -1, 2, 0 \rangle$. Find all $\mathbf{b}$ with $\operatorname{comp}_{\mathbf{a}} \mathbf{b} = 4$.

:::solution
Let $\mathbf{b} = \langle b_1, b_2, b_3 \rangle$. The condition is
$\frac{\mathbf{a} \cdot \mathbf{b}}{|\mathbf{a}|} = 4$ with $|\mathbf{a}| = \sqrt 5$:

$$
-b_1 + 2b_2 = 4\sqrt 5 \quad\Longrightarrow\quad b_1 = 2b_2 - 4\sqrt 5 .
$$

So $\mathbf{b} = \langle 2b_2 - 4\sqrt 5,\ b_2,\ b_3 \rangle$ for any $b_2, b_3$. One equation leaves
two components free: all these $\mathbf{b}$ have the same shadow on $\mathbf{a}$ and differ by
vectors perpendicular to $\mathbf{a}$.
:::
::::

:::caution[Projection onto which vector?]
$\operatorname{comp}_{\mathbf{a}} \mathbf{b}$ divides by $|\mathbf{a}|$ and
$\operatorname{proj}_{\mathbf{a}} \mathbf{b}$ points along $\mathbf{a}$: the vector you project
*onto* goes in the denominator. In general
$\operatorname{proj}_{\mathbf{a}} \mathbf{b} \ne \operatorname{proj}_{\mathbf{b}} \mathbf{a}$. And
the vector projection divides by $|\mathbf{a}|^2$, not $|\mathbf{a}|$.
:::

### Direction angles and direction cosines

:::definition[Direction angles and direction cosines]
The **direction angles** of a nonzero vector $\mathbf{a}$ are the angles $\alpha, \beta, \gamma$
in $[0, \pi]$ that it makes with the positive $x$-, $y$- and $z$-axes. Their cosines
$\cos\alpha, \cos\beta, \cos\gamma$ are the **direction cosines** of $\mathbf{a}$.
:::

::::proposition[Direction cosines from components]
For $\mathbf{a} = \langle a_1, a_2, a_3 \rangle \ne \mathbf{0}$,

$$
\cos\alpha = \frac{a_1}{|\mathbf{a}|} \qquad \cos\beta = \frac{a_2}{|\mathbf{a}|} \qquad \cos\gamma = \frac{a_3}{|\mathbf{a}|} ,
$$

so $\langle \cos\alpha, \cos\beta, \cos\gamma \rangle = \frac{\mathbf{a}}{|\mathbf{a}|}$ is the unit
vector along $\mathbf{a}$, and

$$
\cos^2\alpha + \cos^2\beta + \cos^2\gamma = 1 .
$$

:::proof
The $x$-axis points along $\mathbf{i} = \langle 1, 0, 0 \rangle$, so
$\cos\alpha = \frac{\mathbf{a} \cdot \mathbf{i}}{|\mathbf{a}|\,|\mathbf{i}|} = \frac{a_1}{|\mathbf{a}|}$;
the same with $\mathbf{j}$ and $\mathbf{k}$ gives the other two. A unit vector has length $1$, so
the sum of the squares of its components is $1$.
:::
::::

::::example[Direction cosines]
Find the direction cosines of $\mathbf{a} = \langle 1, 2, 5 \rangle$.

:::solution
$|\mathbf{a}| = \sqrt{1 + 4 + 25} = \sqrt{30}$, so

$$
\cos\alpha = \frac{1}{\sqrt{30}} \qquad \cos\beta = \frac{2}{\sqrt{30}} \qquad \cos\gamma = \frac{5}{\sqrt{30}} .
$$

Check: $\frac{1 + 4 + 25}{30} = 1$.
:::
::::

::::example[The third direction angle]
A vector has direction angles $\alpha = \frac{\pi}{3}$ and $\beta = \frac{\pi}{4}$. Find $\gamma$.

:::solution
$$
\cos^2\gamma = 1 - \cos^2\tfrac{\pi}{3} - \cos^2\tfrac{\pi}{4} = 1 - \tfrac14 - \tfrac12 = \tfrac14 ,
$$

so $\cos\gamma = \pm\frac12$ and $\gamma = \frac{\pi}{3}$ or $\gamma = \frac{2\pi}{3}$. Both are
possible: the vector can point up or down.
:::
::::

:::insight
The dot product measures how much of one vector lies along another. Divided by one length it is a
signed shadow (the scalar projection); divided by both it is a cosine. Projecting onto the three
axes gives the direction cosines.
:::

:::equations{#proj}
- *Orthogonal*: $\mathbf{a} \perp \mathbf{b} \iff \mathbf{a} \cdot \mathbf{b} = 0$.
- *Scalar projection*: $\operatorname{comp}_{\mathbf{a}} \mathbf{b} = \dfrac{\mathbf{a} \cdot \mathbf{b}}{|\mathbf{a}|}$.
- *Vector projection*: $\operatorname{proj}_{\mathbf{a}} \mathbf{b} = \dfrac{\mathbf{a} \cdot \mathbf{b}}{|\mathbf{a}|^2}\,\mathbf{a}$; $\mathbf{b} - \operatorname{proj}_{\mathbf{a}} \mathbf{b} \perp \mathbf{a}$.
- *Direction cosines*: $\langle \cos\alpha, \cos\beta, \cos\gamma \rangle = \dfrac{\mathbf{a}}{|\mathbf{a}|}$, $\cos^2\alpha + \cos^2\beta + \cos^2\gamma = 1$.
:::

## The cross product

### Definition

The dot product of two vectors is a number. The cross product, defined only in space, is a vector,
built to be perpendicular to both factors.

:::definition[Cross product]
For $\mathbf{a} = \langle a_1, a_2, a_3 \rangle$ and $\mathbf{b} = \langle b_1, b_2, b_3 \rangle$,
the **cross product** (vector product) is

$$
\mathbf{a} \times \mathbf{b} =
\begin{vmatrix} \mathbf{i} & \mathbf{j} & \mathbf{k} \\ a_1 & a_2 & a_3 \\ b_1 & b_2 & b_3 \end{vmatrix}
= \begin{vmatrix} a_2 & a_3 \\ b_2 & b_3 \end{vmatrix}\mathbf{i}
- \begin{vmatrix} a_1 & a_3 \\ b_1 & b_3 \end{vmatrix}\mathbf{j}
+ \begin{vmatrix} a_1 & a_2 \\ b_1 & b_2 \end{vmatrix}\mathbf{k} ,
$$

that is,

$$
\mathbf{a} \times \mathbf{b} = \langle a_2b_3 - a_3b_2,\ a_3b_1 - a_1b_3,\ a_1b_2 - a_2b_1 \rangle .
$$
:::

The "determinant" with $\mathbf{i}, \mathbf{j}, \mathbf{k}$ in its first row is a memory aid:
expand along the first row, with the signs $+, -, +$.

::::theorem[The cross product is orthogonal to both factors]
$\mathbf{a} \times \mathbf{b}$ is orthogonal to $\mathbf{a}$ and to $\mathbf{b}$, so it is
perpendicular to the plane through $\mathbf{a}$ and $\mathbf{b}$. Its direction is given by the
**right-hand rule**: curl the fingers of the right hand from $\mathbf{a}$ to $\mathbf{b}$, and the
thumb points along $\mathbf{a} \times \mathbf{b}$.

:::proof
$$
\mathbf{a} \cdot (\mathbf{a} \times \mathbf{b}) = a_1(a_2b_3 - a_3b_2) + a_2(a_3b_1 - a_1b_3) + a_3(a_1b_2 - a_2b_1) = 0 ,
$$

since the six terms cancel in pairs. The same computation with $\mathbf{b}$ gives
$\mathbf{b} \cdot (\mathbf{a} \times \mathbf{b}) = 0$. The right-hand rule is the orientation of
the axes: it holds for $\mathbf{i} \times \mathbf{j} = \mathbf{k}$, and moving the vectors
continuously keeps it.
:::
::::

The standard basis vectors multiply in a cycle: going forward in the order
$\mathbf{i} \to \mathbf{j} \to \mathbf{k} \to \mathbf{i}$ gives a plus sign, going backward a minus
sign:

$$
\mathbf{i} \times \mathbf{j} = \mathbf{k} \qquad \mathbf{j} \times \mathbf{k} = \mathbf{i} \qquad \mathbf{k} \times \mathbf{i} = \mathbf{j} \qquad \mathbf{j} \times \mathbf{i} = -\mathbf{k} .
$$

::::example[Unit vectors perpendicular to two vectors, again]
Find the unit vectors perpendicular to both $\mathbf{i} + \mathbf{j}$ and $\mathbf{j} + \mathbf{k}$,
this time with the cross product.

:::solution
$$
\mathbf{w} = (\mathbf{i} + \mathbf{j}) \times (\mathbf{j} + \mathbf{k}) =
\begin{vmatrix} \mathbf{i} & \mathbf{j} & \mathbf{k} \\ 1 & 1 & 0 \\ 0 & 1 & 1 \end{vmatrix}
= (1 - 0)\mathbf{i} - (1 - 0)\mathbf{j} + (1 - 0)\mathbf{k} = \langle 1, -1, 1 \rangle .
$$

$|\mathbf{w}| = \sqrt 3$, so the two unit vectors are $\pm\frac{1}{\sqrt 3}\langle 1, -1, 1 \rangle$,
as found with the dot product. The cross product gives one perpendicular direction; its negative is
the other answer.
:::
::::

:::caution[The minus sign on the middle component]
The $\mathbf{j}$-component is $-(a_1b_3 - a_3b_1) = a_3b_1 - a_1b_3$. Forgetting the minus sign, or
writing $a_1b_3 + a_3b_1$, gives a vector that is not perpendicular to either factor. Check the
answer: its dot product with $\mathbf{a}$ and with $\mathbf{b}$ must be $0$.
:::

### Length and area

::::theorem[Length of the cross product]
If $\theta$ is the angle between $\mathbf{a}$ and $\mathbf{b}$, $0 \le \theta \le \pi$, then

$$
|\mathbf{a} \times \mathbf{b}| = |\mathbf{a}|\,|\mathbf{b}| \sin\theta ,
$$

and

$$
|\mathbf{a} \times \mathbf{b}|^2 + (\mathbf{a} \cdot \mathbf{b})^2 = |\mathbf{a}|^2\,|\mathbf{b}|^2 .
$$

:::proof
Expanding both sides in components shows
$|\mathbf{a} \times \mathbf{b}|^2 = |\mathbf{a}|^2|\mathbf{b}|^2 - (\mathbf{a} \cdot \mathbf{b})^2$,
which is the second formula. With $\mathbf{a} \cdot \mathbf{b} = |\mathbf{a}|\,|\mathbf{b}|\cos\theta$
it becomes $|\mathbf{a} \times \mathbf{b}|^2 = |\mathbf{a}|^2|\mathbf{b}|^2(1 - \cos^2\theta) = |\mathbf{a}|^2|\mathbf{b}|^2\sin^2\theta$.
Take square roots: $\sin\theta \ge 0$ on $[0, \pi]$.
:::
::::

:::corollary[Area and parallel vectors]
1. $|\mathbf{a} \times \mathbf{b}|$ is the area of the parallelogram with sides $\mathbf{a}$ and
   $\mathbf{b}$ (base $|\mathbf{a}|$, height $|\mathbf{b}|\sin\theta$).
2. The triangle $PQR$ has area $\frac12\,|\overrightarrow{PQ} \times \overrightarrow{PR}|$, half
   the parallelogram.
3. Nonzero vectors are parallel if and only if $\mathbf{a} \times \mathbf{b} = \mathbf{0}$
   ($\theta = 0$ or $\pi$).
:::

::::example[The area of a triangle]
Find the area of the triangle with vertices $P(1, -1, 2)$, $Q(2, 1, 4)$ and $R(3, 2, 1)$.

:::solution
Two sides from the same vertex: $\overrightarrow{PQ} = \langle 1, 2, 2 \rangle$ and
$\overrightarrow{PR} = \langle 2, 3, -1 \rangle$. Then

$$
\overrightarrow{PQ} \times \overrightarrow{PR} =
\begin{vmatrix} \mathbf{i} & \mathbf{j} & \mathbf{k} \\ 1 & 2 & 2 \\ 2 & 3 & -1 \end{vmatrix}
= (-2 - 6)\mathbf{i} - (-1 - 4)\mathbf{j} + (3 - 4)\mathbf{k} = \langle -8, 5, -1 \rangle ,
$$

with length $\sqrt{64 + 25 + 1} = 3\sqrt{10}$. The area is $\frac{3\sqrt{10}}{2}$.
:::
::::

:::remark
A quadrilateral $PQRS$ whose vertices lie in one plane splits along the diagonal $PR$ into two
triangles, so its area is
$\frac12|\overrightarrow{PQ} \times \overrightarrow{PR}| + \frac12|\overrightarrow{PR} \times \overrightarrow{PS}|$.
:::

::::example[An angle from both products]
Find the angle between $\mathbf{a}$ and $\mathbf{b}$ if $\mathbf{a} \times \mathbf{b} = \langle 1, -1, 2 \rangle$
and $\mathbf{a} \cdot \mathbf{b} = 3$.

:::solution
$|\mathbf{a} \times \mathbf{b}| = \sqrt 6 = |\mathbf{a}|\,|\mathbf{b}|\sin\theta$ and
$3 = |\mathbf{a}|\,|\mathbf{b}|\cos\theta$. Dividing, the unknown lengths cancel:

$$
\tan\theta = \frac{\sqrt 6}{3} \quad\Longrightarrow\quad \theta = \arctan\frac{\sqrt 6}{3} \approx 0.685 .
$$

The arctangent is the right angle here because $\mathbf{a} \cdot \mathbf{b} > 0$ makes $\theta$
acute. (With a negative dot product the answer would be $\pi$ plus the arctangent.)
:::
::::

### Rules of the cross product

:::proposition[Rules of the cross product]
For vectors $\mathbf{a}, \mathbf{b}, \mathbf{c}$ in $V_3$ and a scalar $k$:

1. $\mathbf{a} \times \mathbf{b} = -\,\mathbf{b} \times \mathbf{a}$;
2. $k(\mathbf{a} \times \mathbf{b}) = (k\mathbf{a}) \times \mathbf{b} = \mathbf{a} \times (k\mathbf{b})$;
3. $\mathbf{a} \times (\mathbf{b} + \mathbf{c}) = \mathbf{a} \times \mathbf{b} + \mathbf{a} \times \mathbf{c}$;
4. $(\mathbf{a} + \mathbf{b}) \times \mathbf{c} = \mathbf{a} \times \mathbf{c} + \mathbf{b} \times \mathbf{c}$;
5. $\mathbf{a} \times \mathbf{a} = \mathbf{0}$ and $\mathbf{a} \times \mathbf{0} = \mathbf{0}$.
:::

Each rule follows from the component formula. Rule 5 is the parallel test applied to
$\mathbf{a}$ and itself; $\mathbf{0}$ counts as parallel (and orthogonal) to every vector.

:::caution[The cross product is not associative]
In general $(\mathbf{a} \times \mathbf{b}) \times \mathbf{c} \ne \mathbf{a} \times (\mathbf{b} \times \mathbf{c})$:
for instance $(\mathbf{i} \times \mathbf{i}) \times \mathbf{j} = \mathbf{0}$, but
$\mathbf{i} \times (\mathbf{i} \times \mathbf{j}) = \mathbf{i} \times \mathbf{k} = -\mathbf{j}$. And by
rule 1 it is not commutative either: swapping the factors flips the sign, so brackets and order
both matter.
:::

:::insight
The dot product tests perpendicularity; the cross product produces it. Given two directions in
space, $\mathbf{a} \times \mathbf{b}$ is a third direction perpendicular to both, and its length is
the area they span. That is exactly what a normal vector of a plane needs.
:::

:::equations{#cross}
- *Components*: $\mathbf{a} \times \mathbf{b} = \langle a_2b_3 - a_3b_2,\ a_3b_1 - a_1b_3,\ a_1b_2 - a_2b_1 \rangle$.
- *Basis*: $\mathbf{i} \times \mathbf{j} = \mathbf{k}$, $\mathbf{j} \times \mathbf{k} = \mathbf{i}$, $\mathbf{k} \times \mathbf{i} = \mathbf{j}$.
- *Length*: $|\mathbf{a} \times \mathbf{b}| = |\mathbf{a}|\,|\mathbf{b}|\sin\theta$.
- *Identity*: $|\mathbf{a} \times \mathbf{b}|^2 + (\mathbf{a} \cdot \mathbf{b})^2 = |\mathbf{a}|^2|\mathbf{b}|^2$.
- *Triangle area*: $\frac12\,|\overrightarrow{PQ} \times \overrightarrow{PR}|$.
- *Parallel*: $\mathbf{a} \parallel \mathbf{b} \iff \mathbf{a} \times \mathbf{b} = \mathbf{0}$.
- *Anticommutative*: $\mathbf{a} \times \mathbf{b} = -\,\mathbf{b} \times \mathbf{a}$.
:::

## Further reading

- [Paul's Online Notes — Dot Product](https://tutorial.math.lamar.edu/Classes/CalcII/DotProduct.aspx) — the component and angle forms, projections and direction cosines.
- [Paul's Online Notes — Cross Product](https://tutorial.math.lamar.edu/Classes/CalcII/CrossProduct.aspx) — the determinant formula, the right-hand rule and the area interpretation.
- [Wikipedia — Dot product](https://en.wikipedia.org/wiki/Dot_product) — the algebraic and geometric definitions and why they agree.
- [Wikipedia — Vector projection](https://en.wikipedia.org/wiki/Vector_projection) — the scalar projection, the vector projection and the rejection.
- [Wikipedia — Cross product](https://en.wikipedia.org/wiki/Cross_product) — the geometric meaning, the coordinate formula and its algebraic properties.
