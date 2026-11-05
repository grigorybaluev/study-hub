---
title: Conic sections
order: 3
asks: a general equation to its features, an equation from its features, a polar conic
units: [conic-sections]
---

## Logic

A conic is one of three curves, and its equation comes in three forms: general, standard and polar.
Every question is a move between them. The standard form shows the centre and the numbers $a$, $b$,
$c$, and all the features follow. The polar form shows the eccentricity once the constant in the
denominator is $1$.

## Pattern

:::steps[From an equation to the features]
1. Complete the squares: factor the leading coefficient out of each variable first.
2. Divide so the right side is $1$ (or isolate the linear variable for a parabola).
3. Read the type. Sum of squares: ellipse. Difference: hyperbola. One variable squared: parabola.
4. Ellipse: $a$ is the larger root and $c^2 = a^2 - b^2$. Hyperbola: $a$ goes with the positive term and $c^2 = a^2 + b^2$. Parabola: $4p$ is the coefficient of the linear term.
5. Shift everything by the centre or the vertex, and say which way the axis runs.
:::

:::steps[Reading a polar conic]
1. Make the constant in the denominator $1$: $r = \frac{ed}{1 \pm e\cos\theta}$ or $\frac{ed}{1 \pm e\sin\theta}$.
2. Read $e$: $e < 1$ ellipse, $e = 1$ parabola, $e > 1$ hyperbola.
3. Get $d$ from the numerator. Directrix: $x = \pm d$ with cosine, $y = \pm d$ with sine, the sign as in the denominator.
4. Vertices: substitute the two angles along the axis.
:::

## Traps

:::caution[Traps]
- $c^2 = a^2 - b^2$ for an ellipse, $c^2 = a^2 + b^2$ for a hyperbola.
- For an ellipse $a$ is the larger number; for a hyperbola $a$ belongs to the positive term, whichever is larger.
- $r = \frac{6}{2 + 3\cos\theta}$ does not have $e = 3$: divide by $2$ first.
- A negative right side after completing the square means the equation has no points.
- Asymptotes need the centre: $y - k = \pm\frac{b}{a}(x - h)$.
:::

## Worked problems

::::exercise[An ellipse from its general equation]
Find the centre, vertices and foci of $4x^2 + 9y^2 - 16x + 54y + 61 = 0$.

:::solution
$4(x - 2)^2 - 16 + 9(y + 3)^2 - 81 + 61 = 0$, so $4(x - 2)^2 + 9(y + 3)^2 = 36$, and

$$
\frac{(x - 2)^2}{9} + \frac{(y + 3)^2}{4} = 1 .
$$

An ellipse with centre $(2, -3)$, $a = 3$, $b = 2$ and $c = \sqrt{5}$, with its long axis horizontal. Vertices $(-1, -3)$ and $(5, -3)$; foci $(2 \pm \sqrt{5}, -3)$.
:::
::::

:::note[Pattern at work]
Step 1 multiplies each added constant by its factor: $4 \cdot 4 = 16$ and $9 \cdot 9 = 81$. Steps 4 and 5 find the features at the origin, then shift them.
:::

::::exercise[Two curves from their features]
(a) Find the hyperbola with vertices $(0, \pm 3)$ and foci $(0, \pm 5)$, and its asymptotes. (b) Find the parabola with focus $(2, 1)$ and directrix $x = -4$.

:::solution
(a) The transverse axis is vertical, with $a = 3$, $c = 5$, so $b^2 = 25 - 9 = 16$:

$$
\frac{y^2}{9} - \frac{x^2}{16} = 1 , \qquad y = \pm\frac34x .
$$

(b) The vertex is halfway between focus and directrix, at $(-1, 1)$, and $p = 3$. The parabola opens right: $(y - 1)^2 = 12(x + 1)$.
:::
::::

:::note[Pattern at work]
Reading the steps backward: features give $a$, $b$, $c$, and those give the standard form.
:::

::::exercise[Two polar conics]
Identify $r = \frac{12}{3 + 2\cos\theta}$ and $r = \frac{10}{2 - 3\sin\theta}$, with the directrix of each.

:::solution
The first is $\frac{4}{1 + \frac23\cos\theta}$: $e = \frac23$, an ellipse, $ed = 4$, so $d = 6$ and the directrix is $x = 6$. Its vertices are at $r = \frac{12}{5}$ for $\theta = 0$ and $r = 12$ for $\theta = \pi$.

The second is $\frac{5}{1 - \frac32\sin\theta}$: $e = \frac32$, a hyperbola, $ed = 5$, so $d = \frac{10}{3}$ and the directrix is $y = -\frac{10}{3}$.
:::
::::

:::note[Pattern at work]
Step 1 first, every time; only then can $e$ be read. The sign and the trig function give the directrix.
:::
