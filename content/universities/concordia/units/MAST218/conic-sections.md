---
title: Conic sections
order: 5
status: detailed
weeks: [3]
introduces:
  - {concept: conic-section, perspective: "the ellipse and the hyperbola from their foci: standard, parametric and shifted equations"}
requires:
  - {concept: trigonometric-functions, strength: soft}
reinforces:
  - {concept: parametric-curve, perspective: "the ellipse as x = a cos t, y = b sin t"}
---

An ellipse and a hyperbola are both defined by two fixed points, the **foci**. On an ellipse the
*sum* of the distances to the foci is constant; on a hyperbola the *difference* is. Squaring the
distance formula twice turns either condition into a second-degree equation in $x$ and $y$, and
completing the square turns any such equation back into a picture: centre, axes, foci.

## The ellipse

### Two foci and a constant sum

:::definition[Ellipse]
Let $F_1$ and $F_2$ be two fixed points, the **foci**, and $a > 0$ a constant. The **ellipse**
with foci $F_1, F_2$ is the set of points whose distances to the foci add up to $2a$:

$$
E = \{\, P(x, y) : |PF_1| + |PF_2| = 2a \,\}.
$$
:::

Distances are measured with the distance formula: for $A(x_1, y_1)$ and $B(x_2, y_2)$,
$|AB| = \sqrt{(x_1 - x_2)^2 + (y_1 - y_2)^2}$, and the midpoint of $AB$ is $\left(\frac{x_1 + x_2}{2}, \frac{y_1 + y_2}{2}\right)$.

::::proposition[The constant must exceed the focal distance]
Write $|F_1F_2| = 2c$. A point $P$ off the line $F_1F_2$ can lie on the ellipse only if $a > c$.

:::proof
$P$, $F_1$ and $F_2$ form a triangle, and by the triangle inequality
$|PF_1| + |PF_2| > |F_1F_2|$, that is $2a > 2c$. (If $a = c$ the "ellipse" is only the
segment $F_1F_2$; if $a < c$ it is empty.)
:::
::::

### The standard equation

Put the foci on the $x$-axis, symmetric about the origin: $F_1(c, 0)$ and $F_2(-c, 0)$. Since
$a > c$, the number $a^2 - c^2$ is positive and has a square root $b$.

::::theorem[Standard equation of an ellipse]
With foci $(\pm c, 0)$, constant sum $2a$ and $b^2 = a^2 - c^2$, the ellipse is

$$
\frac{x^2}{a^2} + \frac{y^2}{b^2} = 1 , \qquad a > b > 0 .
$$

:::proof
The condition is $\sqrt{(x + c)^2 + y^2} + \sqrt{(x - c)^2 + y^2} = 2a$. Move one root across and
square:

$$
(x + c)^2 + y^2 = 4a^2 - 4a\sqrt{(x - c)^2 + y^2} + (x - c)^2 + y^2 .
$$

Expanding, everything cancels except $4cx = 4a^2 - 4a\sqrt{(x - c)^2 + y^2}$, so
$a\sqrt{(x - c)^2 + y^2} = a^2 - cx$. Square again:

$$
a^2(x^2 - 2cx + c^2 + y^2) = a^4 - 2a^2cx + c^2x^2
\quad\Longrightarrow\quad
x^2(a^2 - c^2) + a^2y^2 = a^2(a^2 - c^2).
$$

With $b^2 = a^2 - c^2$ this is $b^2x^2 + a^2y^2 = a^2b^2$ (the **general** form); dividing by
$a^2b^2$ gives the standard form. Each step can be reversed for points with $|x| \le a$, so no
extra points were picked up by squaring.
:::
::::

### Axes, vertices and the graph

Solving for $y$,

$$
\frac{y^2}{b^2} = 1 - \frac{x^2}{a^2}
\quad\Longrightarrow\quad
y = \pm\frac{b}{a}\sqrt{a^2 - x^2} , \qquad -a \le x \le a ,
$$

so the ellipse is the graph of two functions, the upper and lower halves, and is symmetric about
both axes.

:::definition[Vertices and axes of an ellipse]
For $\frac{x^2}{a^2} + \frac{y^2}{b^2} = 1$ with $a > b$:
- the **vertices** $A(a, 0)$ and $A'(-a, 0)$ end the **major axis** $A'A$, of length $2a$;
- the **co-vertices** $B(0, b)$ and $B'(0, -b)$ end the **minor axis** $B'B$, of length $2b$;
- the foci $(\pm c, 0)$, with $c^2 = a^2 - b^2$, lie on the major axis; $|F_1F_2| = 2c$ is the **focal length**.
:::

The three lengths are the sides of a right triangle: from a co-vertex $B$ to either focus the
distance is $\sqrt{b^2 + c^2} = a$, half of the constant sum, as it must be by symmetry.

:::remark
If $a = b$ then $c = 0$: both foci sit at the centre and the ellipse is the circle
$x^2 + y^2 = a^2$. A circle is an ellipse with no preferred direction.
:::

### The parametric form

Since $\cos^2 t + \sin^2 t = 1$, setting $\frac{x^2}{a^2} = \cos^2 t$ and $\frac{y^2}{b^2} = \sin^2 t$ satisfies the equation:

$$
x = a\cos t \qquad y = b\sin t \qquad 0 \le t \le 2\pi
$$

traces the ellipse once, counter-clockwise from $A(a, 0)$. It is the unit circle stretched by $a$
horizontally and by $b$ vertically.

::::example[Reading an equation]
Find the axes, foci and a parametrisation of $\dfrac{x^2}{16} + \dfrac{y^2}{4} = 1$.

:::solution
$a^2 = 16$ and $b^2 = 4$, so $a = 4$, $b = 2$ and the major axis is horizontal. The vertices are
$(\pm 4, 0)$ and the co-vertices $(0, \pm 2)$. From $c^2 = a^2 - b^2 = 12$, the foci are
$(\pm 2\sqrt3, 0)$. A parametrisation is $x = 4\cos t$, $y = 2\sin t$.
:::
::::

### Vertical and shifted ellipses

Exchanging $x$ and $y$ reflects the picture in the line $y = x$: the major axis becomes vertical.

:::proposition[Vertical ellipse]
With $a > b > 0$ and $c^2 = a^2 - b^2$,

$$
\frac{y^2}{a^2} + \frac{x^2}{b^2} = 1
$$

is an ellipse with vertices $(0, \pm a)$, co-vertices $(\pm b, 0)$ and foci $(0, \pm c)$. The
larger denominator always sits under the variable of the major axis.
:::

Replacing $x$ by $x - h$ and $y$ by $y - k$ moves every point by $(h, k)$, so the centre of
symmetry moves from the origin to $(h, k)$:

$$
\frac{(x - h)^2}{a^2} + \frac{(y - k)^2}{b^2} = 1
\qquad\text{or}\qquad
\frac{(y - k)^2}{a^2} + \frac{(x - h)^2}{b^2} = 1 .
$$

Expanded, a shifted ellipse is a general equation $Ax^2 + Cy^2 + Dx + Ey + F = 0$ with $A, C > 0$.
To go back, complete the square in each variable.

:::steps[From a general equation to the picture]
1. Group the $x$-terms and the $y$-terms; factor out the coefficients of $x^2$ and $y^2$.
2. Complete each square, adding the same amounts to the right-hand side.
3. Divide by the right-hand side to get $1$ there: read off the centre $(h, k)$, $a^2$ (the larger denominator) and $b^2$.
4. Find the vertices, co-vertices and foci of the unshifted ellipse, then add $(h, k)$ to each.
:::

::::example[Completing the square]
Identify $x^2 + 2x + 3y^2 - 12y + 10 = 0$: centre, axes, vertices and foci.

:::solution
Group and complete the squares:

$$
(x^2 + 2x + 1) + 3(y^2 - 4y + 4) = -10 + 1 + 12
\quad\Longrightarrow\quad
(x + 1)^2 + 3(y - 2)^2 = 3 ,
$$

and dividing by $3$,

$$
\frac{(x + 1)^2}{3} + \frac{(y - 2)^2}{1} = 1 .
$$

The centre is $(-1, 2)$; $a^2 = 3$ under $x$, so the major axis is horizontal with $a = \sqrt3$,
and $b = 1$. Then $c^2 = a^2 - b^2 = 2$, $c = \sqrt2$.

The unshifted ellipse $\frac{x^2}{3} + y^2 = 1$ has vertices $(\pm\sqrt3, 0)$, co-vertices $(0, \pm 1)$
and foci $(\pm\sqrt2, 0)$. Shifting by $(-1, 2)$:

- vertices $A(\sqrt3 - 1, 2)$ and $A'(-\sqrt3 - 1, 2)$;
- co-vertices $B(-1, 3)$ and $B'(-1, 1)$;
- foci $F_1(\sqrt2 - 1, 2)$ and $F_2(-\sqrt2 - 1, 2)$.
:::
::::

:::caution
Completing the square can leave a right-hand side that is zero or negative. With $+15$ instead
of $+10$ above, the same steps give $(x + 1)^2 + 3(y - 2)^2 = -2$: no point satisfies it, since
the left side is never negative. With $+13$ the right side is $0$ and the "ellipse" is the single
point $(-1, 2)$. Check the sign before dividing.
:::

```sim
id: conic-ellipse
controls:
  - {id: a, label: "a (semi-major axis)", min: 1, max: 5, step: 0.1, default: 4, decimals: 1}
  - {id: b, label: "b (semi-minor axis, at most a)", min: 0.5, max: 5, step: 0.1, default: 2, decimals: 1}
  - {id: vert, label: "major axis (0 horizontal, 1 vertical)", min: 0, max: 1, step: 1, default: 0, decimals: 0}
  - {id: h, label: "h (centre x)", min: -3, max: 3, step: 0.5, default: 0, decimals: 1}
  - {id: k, label: "k (centre y)", min: -3, max: 3, step: 0.5, default: 0, decimals: 1}
  - {id: t, label: "P at t (× π), x = a cos t, y = b sin t", min: 0, max: 2, step: 0.01, default: 0.3, decimals: 2}
note: 'Move P round the ellipse: the two focal distances trade length, but their sum stays 2a. Raise b to a and the foci merge into the centre (a circle); flip the major axis and the foci move to the vertical axis. The defaults are the ellipse x²/16 + y²/4 = 1; for the completing-the-square example set a = 1.7 (≈ √3), b = 1, h = −1, k = 2.'
```

```python
# Every point of x²/a² + y²/b² = 1 has |PF₁| + |PF₂| = 2a, and completing the square turns a
# general equation into the standard form. Defaults: the ellipse x²/16 + y²/4 = 1 of the lecture.
from math import cos, sin, sqrt, hypot, pi

a, b = 4, 2
c = sqrt(a**2 - b**2)                                # c² = a² − b²
for t in (0, pi / 5, pi / 2, 2.4):
    x, y = a * cos(t), b * sin(t)                    # the parametric form
    print(f"t = {t:.3f}: P = ({x:6.3f}, {y:6.3f})  |PF1| + |PF2| = {hypot(x - c, y) + hypot(x + c, y):.6f}")

def ellipse_from_general(A, D, C, E, F):             # A x² + D x + C y² + E y + F = 0, with A, C > 0
    h, k = -D / (2 * A), -E / (2 * C)
    rhs = A * h**2 + C * k**2 - F                     # A(x − h)² + C(y − k)² = rhs
    if rhs <= 0:
        return f"no ellipse: A(x − h)² + C(y − k)² = {rhs:g}"
    ax2, ay2 = rhs / A, rhs / C                       # (x − h)²/ax2 + (y − k)²/ay2 = 1
    c = sqrt(abs(ax2 - ay2))
    foci = [(h + c, k), (h - c, k)] if ax2 >= ay2 else [(h, k + c), (h, k - c)]
    return f"centre ({h:g}, {k:g}), (x−h)²/{ax2:g} + (y−k)²/{ay2:g} = 1, foci " + ", ".join(f"({p:.4f}, {q:g})" for p, q in foci)

print(ellipse_from_general(1, 2, 3, -12, 10))         # x² + 2x + 3y² − 12y + 10 = 0
print(ellipse_from_general(1, 2, 3, -12, 15))         # the same with +15
# Output:
#   t = 0.000: P = ( 4.000,  0.000)  |PF1| + |PF2| = 8.000000
#   t = 0.628: P = ( 3.236,  1.176)  |PF1| + |PF2| = 8.000000
#   t = 1.571: P = ( 0.000,  2.000)  |PF1| + |PF2| = 8.000000
#   t = 2.400: P = (-2.950,  1.351)  |PF1| + |PF2| = 8.000000
#   centre (-1, 2), (x−h)²/3 + (y−k)²/1 = 1, foci (0.4142, 2), (-2.4142, 2)
#   no ellipse: A(x − h)² + C(y − k)² = -2
```

:::insight
Everything about an ellipse is read off $a$ and $b$: the larger denominator names the major
axis, $c^2 = a^2 - b^2$ places the foci on it, and the centre is wherever the squares are
completed. The sum of the focal distances is the length of the major axis.
:::

:::equations
- *Definition*: $|PF_1| + |PF_2| = 2a$, with $a > c$ where $|F_1F_2| = 2c$.
- *Standard form*: $\dfrac{x^2}{a^2} + \dfrac{y^2}{b^2} = 1$ with $b^2 = a^2 - c^2$; foci $(\pm c, 0)$, vertices $(\pm a, 0)$, co-vertices $(0, \pm b)$.
- *Parametric form*: $x = a\cos t$, $y = b\sin t$, $0 \le t \le 2\pi$.
- *Shifted*: $\dfrac{(x - h)^2}{a^2} + \dfrac{(y - k)^2}{b^2} = 1$ (major axis horizontal) or $\dfrac{(y - k)^2}{a^2} + \dfrac{(x - h)^2}{b^2} = 1$ (vertical).
:::

## The hyperbola

### Two foci and a constant difference

:::definition[Hyperbola]
Let $F_1, F_2$ be two fixed points (the foci) and $a > 0$ a constant. The **hyperbola** with foci
$F_1, F_2$ is the set of points whose distances to the foci differ by $2a$:

$$
H = \{\, P(x, y) : \big|\, |PF_1| - |PF_2| \,\big| = 2a \,\}.
$$
:::

The absolute value allows either focus to be the nearer one: points nearer $F_1$ form one
**branch**, points nearer $F_2$ the other.

::::proposition[The constant must be less than the focal distance]
With $|F_1F_2| = 2c$, a point $P$ off the line $F_1F_2$ can lie on the hyperbola only if $a < c$.

:::proof
In the triangle $PF_1F_2$, one side is longer than the difference of the other two:
$\big|\, |PF_1| - |PF_2| \,\big| < |F_1F_2|$, that is $2a < 2c$.
:::
::::

### The standard equation

Place the foci at $F_1(c, 0)$ and $F_2(-c, 0)$. Now $c > a$, so it is $c^2 - a^2$ that is positive.

::::theorem[Standard equation of a hyperbola]
With foci $(\pm c, 0)$, constant difference $2a$ and $b^2 = c^2 - a^2$ (so $c^2 = a^2 + b^2$), the
hyperbola is

$$
\frac{x^2}{a^2} - \frac{y^2}{b^2} = 1 .
$$

:::proof
The two squarings of the ellipse proof go through unchanged (the sign in front of a root does not
survive squaring) and give

$$
x^2(a^2 - c^2) + a^2y^2 = a^2(a^2 - c^2)
\quad\Longrightarrow\quad
x^2(c^2 - a^2) - a^2y^2 = a^2(c^2 - a^2).
$$

With $b^2 = c^2 - a^2$ this is $b^2x^2 - a^2y^2 = a^2b^2$; divide by $a^2b^2$.
:::
::::

Here $a$ and $b$ play different roles than for an ellipse: $b$ may be larger or smaller than
$a$, and $c$ is the largest of the three.

:::definition[Vertices and transverse axis]
For $\frac{x^2}{a^2} - \frac{y^2}{b^2} = 1$ the curve meets the $x$-axis at the **vertices**
$A(a, 0)$ and $A'(-a, 0)$; the segment $A'A$, of length $2a$, is the **transverse axis**. It
does not meet the $y$-axis at all ($-y^2/b^2 = 1$ has no solution); the points $B(0, b)$ and
$B'(0, -b)$ are used only to draw the box that guides the asymptotes.
:::

### Asymptotes

Solving for $y$,

$$
y = \pm\frac{b}{a}\sqrt{x^2 - a^2} , \qquad |x| \ge a ,
$$

so there is no curve between $x = -a$ and $x = a$, and far from the centre the $a^2$ under the root
matters less and less.

::::proposition[Asymptotes of a hyperbola]
The hyperbola $\frac{x^2}{a^2} - \frac{y^2}{b^2} = 1$ has the two asymptotes

$$
y = \frac{b}{a}\,x \qquad y = -\frac{b}{a}\,x ,
$$

the diagonals of the box with corners $(\pm a, \pm b)$.

:::proof
For the upper right part, $x \ge a$:

$$
\frac{b}{a}x - \frac{b}{a}\sqrt{x^2 - a^2} = \frac{b}{a}\cdot\frac{x^2 - (x^2 - a^2)}{x + \sqrt{x^2 - a^2}} = \frac{ab}{x + \sqrt{x^2 - a^2}} \to 0 \quad (x \to \infty).
$$

The other three parts follow by symmetry about both axes.
:::
::::

:::steps[Sketching a hyperbola]
1. Mark the vertices $(\pm a, 0)$ and the points $(0, \pm b)$; draw the box through them.
2. Draw the diagonals of the box, extended: the asymptotes.
3. Draw each branch through its vertex, bending away from the centre and approaching the asymptotes.
4. Mark the foci at $(\pm c, 0)$, $c = \sqrt{a^2 + b^2}$: outside the box, inside the branches.
:::

### Vertical and shifted hyperbolas

Exchanging $x$ and $y$ gives a hyperbola opening up and down:

$$
\frac{y^2}{a^2} - \frac{x^2}{b^2} = 1 , \qquad c^2 = a^2 + b^2 ,
$$

with vertices $(0, \pm a)$, foci $(0, \pm c)$ and asymptotes $y = \pm\frac{a}{b}x$. For a
hyperbola the *sign*, not the size of the denominators, decides the direction: the positive term
names the transverse axis. Moving the centre to $(h, k)$:

$$
\frac{(x - h)^2}{a^2} - \frac{(y - k)^2}{b^2} = 1
\qquad\text{or}\qquad
\frac{(y - k)^2}{a^2} - \frac{(x - h)^2}{b^2} = 1 ,
$$

with the asymptotes through $(h, k)$: $y - k = \pm\frac{b}{a}(x - h)$ in the first case,
$y - k = \pm\frac{a}{b}(x - h)$ in the second.

::::example[A shifted hyperbola]
Identify $4x^2 - 9y^2 - 8x - 36y - 68 = 0$: centre, vertices, foci and asymptotes.

:::solution
Complete the squares, keeping track of the minus sign in front of the $y$-terms:

$$
4(x^2 - 2x + 1) - 9(y^2 + 4y + 4) = 68 + 4 - 36
\quad\Longrightarrow\quad
4(x - 1)^2 - 9(y + 2)^2 = 36 ,
$$

and dividing by $36$,

$$
\frac{(x - 1)^2}{9} - \frac{(y + 2)^2}{4} = 1 .
$$

The centre is $(1, -2)$, $a = 3$, $b = 2$, and the positive term is in $x$: the transverse axis is
horizontal. Then $c = \sqrt{9 + 4} = \sqrt{13}$.

- vertices $(1 \pm 3, -2)$: $(4, -2)$ and $(-2, -2)$;
- foci $(1 \pm \sqrt{13}, -2)$;
- asymptotes $y + 2 = \pm\frac23(x - 1)$.
:::
::::

```sim
id: conic-hyperbola
controls:
  - {id: a, label: "a", min: 0.5, max: 4, step: 0.1, default: 2, decimals: 1}
  - {id: b, label: "b", min: 0.5, max: 4, step: 0.1, default: 1.5, decimals: 1}
  - {id: vert, label: "transverse axis (0 horizontal, 1 vertical)", min: 0, max: 1, step: 1, default: 0, decimals: 0}
  - {id: h, label: "h (centre x)", min: -3, max: 3, step: 0.5, default: 0, decimals: 1}
  - {id: k, label: "k (centre y)", min: -3, max: 3, step: 0.5, default: 0, decimals: 1}
  - {id: s, label: "P along the branch", min: -1.5, max: 1.5, step: 0.01, default: 0.8, decimals: 2}
  - {id: branch, label: "P on branch (0 right/upper, 1 left/lower)", min: 0, max: 1, step: 1, default: 0, decimals: 0}
note: 'P is (±a cosh s, b sinh s), a point of the curve because cosh² s − sinh² s = 1. Move it along either branch: the focal distances grow together and their difference stays 2a. The dashed lines are the diagonals of the box, the asymptotes. For the worked example set a = 3, b = 2, h = 1, k = −2.'
```

```python
# The hyperbola x²/a² − y²/b² = 1: ||PF₁| − |PF₂|| = 2a on both branches, and the branch hugs
# the asymptote y = (b/a)x more closely the further out it goes.
from math import cosh, sinh, sqrt, hypot

a, b = 2, 1.5
c = sqrt(a**2 + b**2)                                # c² = a² + b²
for s, side in ((0, 1), (0.8, 1), (1.5, -1)):
    x, y = side * a * cosh(s), b * sinh(s)           # cosh² − sinh² = 1 puts P on the curve
    print(f"P = ({x:7.3f}, {y:6.3f})  ||PF1| − |PF2|| = {abs(hypot(x - c, y) - hypot(x + c, y)):.6f}")

for x in (2.5, 5, 10, 100):                          # upper right branch vs the asymptote
    y = b / a * sqrt(x**2 - a**2)
    print(f"x = {x:5}: curve {y:9.4f}   asymptote {b / a * x:9.4f}   gap {b / a * x - y:.5f}")

# 4x² − 9y² − 8x − 36y − 68 = 0  →  4(x − 1)² − 9(y + 2)² = 36
h, k, rhs = 1, -2, 68 + 4 * 1**2 - 9 * (-2)**2
A2, B2 = rhs / 4, rhs / 9
print(f"(x − {h})²/{A2:g} − (y + {-k})²/{B2:g} = 1, foci ({h} ± {sqrt(A2 + B2):.4f}, {k}), asymptote slopes ±{sqrt(B2 / A2):.4f}")
# Output:
#   P = (  2.000,  0.000)  ||PF1| − |PF2|| = 4.000000
#   P = (  2.675,  1.332)  ||PF1| − |PF2|| = 4.000000
#   P = ( -4.705,  3.194)  ||PF1| − |PF2|| = 4.000000
#   x =   2.5: curve    1.1250   asymptote    1.8750   gap 0.75000
#   x =     5: curve    3.4369   asymptote    3.7500   gap 0.31307
#   x =    10: curve    7.3485   asymptote    7.5000   gap 0.15153
#   x =   100: curve   74.9850   asymptote   75.0000   gap 0.01500
#   (x − 1)²/9 − (y + 2)²/4 = 1, foci (1 ± 3.6056, -2), asymptote slopes ±0.6667
```

:::caution
The two curves are easy to mix up. For an ellipse $a$ is the largest length and $c^2 = a^2 - b^2$;
for a hyperbola $c$ is the largest and $c^2 = a^2 + b^2$. For an ellipse the larger denominator
names the major axis; for a hyperbola the positive term names the transverse axis, whatever the
sizes of $a$ and $b$.
:::

:::insight
The hyperbola is the ellipse with one sign changed: difference instead of sum in the definition,
$-$ instead of $+$ in the equation, $c^2 = a^2 + b^2$ instead of $a^2 - b^2$. The box on $a$ and $b$
carries the whole sketch: its diagonals are the asymptotes and its half-diagonal is $c$.
:::

:::equations
- *Definition*: $\big|\, |PF_1| - |PF_2| \,\big| = 2a$, with $a < c$ where $|F_1F_2| = 2c$.
- *Standard form*: $\dfrac{x^2}{a^2} - \dfrac{y^2}{b^2} = 1$ with $c^2 = a^2 + b^2$; vertices $(\pm a, 0)$, foci $(\pm c, 0)$.
- *Asymptotes*: $y = \pm\dfrac{b}{a}x$; for $\dfrac{y^2}{a^2} - \dfrac{x^2}{b^2} = 1$, $y = \pm\dfrac{a}{b}x$.
- *Shifted*: $\dfrac{(x - h)^2}{a^2} - \dfrac{(y - k)^2}{b^2} = 1$ or $\dfrac{(y - k)^2}{a^2} - \dfrac{(x - h)^2}{b^2} = 1$, centre $(h, k)$.
:::

## Further reading

- [Paul's Online Notes — Ellipses](https://tutorial.math.lamar.edu/Classes/Alg/Ellipses.aspx) — standard and shifted forms, with completing the square worked out.
- [Paul's Online Notes — Hyperbolas](https://tutorial.math.lamar.edu/Classes/Alg/Hyperbolas.aspx) — the box-and-asymptotes sketch for both orientations.
- [Wikipedia — Conic section](https://en.wikipedia.org/wiki/Conic_section) — why these curves are slices of a cone, and the parabola that completes the family.
