---
title: Conic sections
order: 5
status: detailed
weeks: [3, 4]
introduces:
  - {concept: conic-section, perspective: "the ellipse and the hyperbola from their foci, the parabola from focus and directrix; eccentricity and polar equations with a focus at the pole"}
requires:
  - {concept: polar-coordinates, strength: hard}
  - {concept: trigonometric-functions, strength: soft}
reinforces:
  - {concept: parametric-curve, perspective: "the ellipse as x = a cos t, y = b sin t"}
---

An ellipse and a hyperbola are both defined by two fixed points, the **foci**. On an ellipse the
*sum* of the distances to the foci is constant; on a hyperbola the *difference* is. Squaring the
distance formula twice turns either condition into a second-degree equation in $x$ and $y$, and
completing the square turns any such equation back into a picture: centre, axes, foci. The
parabola is defined by one focus and a line, the **directrix**, and the ratio of the two distances,
the **eccentricity**, puts all three curves into one family with a single polar equation.

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

::::example[A hyperbola from its asymptotes]
A hyperbola has asymptotes $y = \frac54x - \frac{13}{4}$ and $y = -\frac54x - \frac34$, and a
horizontal transverse axis of length $8$. Find its equation.

:::solution
The centre is where the asymptotes cross:

$$
\frac54x - \frac{13}{4} = -\frac54x - \frac34
\quad\Longrightarrow\quad
\frac{10}{4}x = \frac{10}{4}
\quad\Longrightarrow\quad
x = 1 , \quad y = -2 .
$$

The transverse axis is horizontal, so the equation is
$\frac{(x - h)^2}{a^2} - \frac{(y - k)^2}{b^2} = 1$ with $(h, k) = (1, -2)$, and its length is
$2a = 8$, so $a = 4$. The asymptotes of this form have slopes $\pm\frac{b}{a}$; here they are
$\pm\frac54$, so $b = \frac54 \cdot 4 = 5$:

$$
\frac{(x - 1)^2}{16} - \frac{(y + 2)^2}{25} = 1 .
$$

The minus sign is what makes it a hyperbola: with $+$ the same numbers describe an ellipse,
which has no asymptotes at all.
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

## The parabola

### A focus and a directrix

An ellipse and a hyperbola use two foci. A parabola uses one focus and a line.

:::definition[Parabola]
Let $F$ be a fixed point, the **focus**, and $\ell$ a fixed line not through $F$, the
**directrix**. The **parabola** with focus $F$ and directrix $\ell$ is the set of points as far
from $F$ as from $\ell$:

$$
\{\, P(x, y) : |PF| = \operatorname{dist}(P, \ell) \,\}.
$$

The line through $F$ perpendicular to $\ell$ is the **axis**; the point of the axis halfway
between $F$ and $\ell$ lies on the curve and is the **vertex**.
:::

### The standard equation

Put the vertex at the origin and the focus on the $y$-axis: $F(0, p)$ and $\ell : y = -p$, with
$p \ne 0$. Then $p$ is the *signed* distance from the vertex to the focus.

::::theorem[Standard equation of a parabola]
The parabola with focus $(0, p)$ and directrix $y = -p$ is

$$
x^2 = 4py \qquad\text{that is}\qquad y = \frac{1}{4p}\,x^2 .
$$

It opens upward if $p > 0$ and downward if $p < 0$.

:::proof
The distance from $P(x, y)$ to the horizontal line $y = -p$ is measured along the vertical through
$P$, to the foot $(x, -p)$:

$$
\sqrt{(x - 0)^2 + (y - p)^2} = \sqrt{(x - x)^2 + (y + p)^2} .
$$

Squaring, $x^2 + y^2 - 2py + p^2 = y^2 + 2py + p^2$, and everything cancels except
$x^2 = 4py$. Both sides were non-negative, so squaring added no points.
:::
::::

So the graphs $y = cx^2$ of school algebra are exactly the parabolas with a vertical axis and
vertex at the origin, with focus at height $p = \frac{1}{4c}$.

### Horizontal and shifted parabolas

Exchanging $x$ and $y$ turns the axis horizontal.

:::proposition[Horizontal parabola]
The parabola with focus $(p, 0)$ and directrix $x = -p$ is

$$
y^2 = 4px .
$$

It opens to the right ($x \ge 0$) if $p > 0$ and to the left ($x \le 0$) if $p < 0$.
:::

Moving the vertex from the origin to $(h, k)$ moves the focus and the directrix with it.

:::proposition[Shifted parabolas]
With vertex $(h, k)$:

| Equation | Opens | Focus | Directrix |
|---|---|---|---|
| $(x - h)^2 = 4p(y - k)$ | up if $p > 0$, down if $p < 0$ | $(h,\ k + p)$ | $y = k - p$ |
| $(y - k)^2 = 4p(x - h)$ | right if $p > 0$, left if $p < 0$ | $(h + p,\ k)$ | $x = h - p$ |
:::

The squared variable names the direction the axis does *not* point in: $(x - h)^2$ means the
axis is vertical.

::::example[Vertex, focus and directrix]
Find the vertex, focus and directrix of $y^2 = 2x$ and of $y^2 - 2y = 2x$.

:::solution
For $y^2 = 2x$: comparing with $y^2 = 4px$, $4p = 2$ and $p = \frac12$. The vertex is the origin,
the focus $\left(\frac12, 0\right)$, the directrix $x = -\frac12$; it opens to the right.

For $y^2 - 2y = 2x$, complete the square in $y$:

$$
y^2 - 2y + 1 = 2x + 1
\quad\Longrightarrow\quad
(y - 1)^2 = 2\left(x + \frac12\right).
$$

This is the first parabola moved so that its vertex is $\left(-\frac12, 1\right)$, with the same
$p = \frac12$. The focus is $\left(-\frac12 + \frac12,\ 1\right) = (0, 1)$ and the directrix is
$x = -\frac12 - \frac12 = -1$.
:::
::::

::::example[A parabola from its vertex and focus]
Find the equation of the parabola with vertex $(2, 3)$ and focus $(2, -1)$.

:::solution
The vertex and the focus are on the vertical line $x = 2$, so the axis is vertical and the
equation is $(x - 2)^2 = 4p(y - 3)$. The focus is $(h, k + p) = (2, 3 + p)$, so

$$
3 + p = -1 \quad\Longrightarrow\quad p = -4 ,
$$

and the parabola opens downward, away from the vertex towards the focus:

$$
(x - 2)^2 = -16(y - 3) .
$$

As a check, the directrix $y = k - p = 3 + 4 = 7$ is as far above the vertex as the focus is
below it. The point $(10, -1)$ is on the curve, since $64 = -16 \cdot (-4)$; it is $8$ from the
focus and $8$ from the directrix.
:::
::::

```sim
id: conic-parabola
controls:
  - {id: p, label: "p (signed, vertex to focus)", min: -4, max: 4, step: 0.1, default: 1, decimals: 1}
  - {id: horiz, label: "axis (0 vertical, 1 horizontal)", min: 0, max: 1, step: 1, default: 0, decimals: 0}
  - {id: h, label: "h (vertex x)", min: -3, max: 3, step: 0.5, default: 0, decimals: 1}
  - {id: k, label: "k (vertex y)", min: -3, max: 3, step: 0.5, default: 0, decimals: 1}
  - {id: t, label: "P at t (2pt across the axis, pt² along it)", min: -2.5, max: 2.5, step: 0.01, default: 1.2, decimals: 2}
note: 'Move P along the curve: its distances to the focus and to the directrix change together and stay equal. Raise |p| and the focus and the directrix move apart as the curve widens; the dotted chord through F is 4|p| long, the 4p of the equation. Take p below 0 and the curve turns to open the other way, still round the focus. The defaults are x² = 4y; for y² − 2y = 2x set the axis horizontal, p = 0.5, h = −0.5, k = 1, and for the vertex (2, 3) with focus (2, −1) set p = −4, h = 2, k = 3, t = −1, which puts P at (10, −1).'
```

```python
# The parabola (x − h)² = 4p(y − k): every point is as far from the focus as from the directrix,
# and the focus and the directrix are read off the vertex and p. Defaults: x² = 4y, p = 1.
from math import hypot

def parabola(h, k, p, horizontal=False):
    """Vertex (h, k) and signed p: the focus, the directrix as (axis letter, value), the point at t."""
    if horizontal:                                     # (y − k)² = 4p(x − h)
        return (h + p, k), ("x", h - p), lambda t: (h + p * t**2, k + 2 * p * t)
    return (h, k + p), ("y", k - p), lambda t: (h + 2 * p * t, k + p * t**2)

def check(P, F, directrix):
    letter, c = directrix
    return hypot(P[0] - F[0], P[1] - F[1]), abs((P[0] if letter == "x" else P[1]) - c)

F, ell, point = parabola(0, 0, 1)
for t in (0, 0.5, 1.2, -2.5):
    P = point(t)
    pf, dl = check(P, F, ell)
    print(f"t = {t:4}: P = ({P[0]:5.2f}, {P[1]:5.2f})  |PF| = {pf:.4f}  dist(P, directrix) = {dl:.4f}")

# y² − 2y = 2x  →  (y − 1)² = 2(x + 1/2): horizontal, vertex (−1/2, 1), 4p = 2
F, (letter, c), _ = parabola(-0.5, 1, 0.5, horizontal=True)
print(f"(y − 1)² = 2(x + 1/2): focus ({F[0]:g}, {F[1]:g}), directrix {letter} = {c:g}")

# vertex (2, 3) and focus (2, −1) are on x = 2: p = −1 − 3 = −4
h, k, p = 2, 3, -1 - 3
F, (letter, c), _ = parabola(h, k, p)
P = (10, -1)
pf, dl = check(P, F, (letter, c))
print(f"(x − 2)² = {4 * p}(y − 3), directrix {letter} = {c}: {P} on it: {(P[0] - h)**2 == 4 * p * (P[1] - k)}, |PF| = {pf:g}, dist = {dl:g}")
# Output:
#   t =    0: P = ( 0.00,  0.00)  |PF| = 1.0000  dist(P, directrix) = 1.0000
#   t =  0.5: P = ( 1.00,  0.25)  |PF| = 1.2500  dist(P, directrix) = 1.2500
#   t =  1.2: P = ( 2.40,  1.44)  |PF| = 2.4400  dist(P, directrix) = 2.4400
#   t = -2.5: P = (-5.00,  6.25)  |PF| = 7.2500  dist(P, directrix) = 7.2500
#   (y − 1)² = 2(x + 1/2): focus (0, 1), directrix x = -1
#   (x − 2)² = -16(y − 3), directrix y = 7: (10, -1) on it: True, |PF| = 8, dist = 8
```

:::caution
$p$ is a signed distance, from the vertex *to* the focus. If the focus is below or to the left of
the vertex, $p$ is negative; writing $p = 4$ in the last example gives the parabola that opens
upward, with its focus at $(2, 7)$. A sketch with the vertex, the focus and the directrix catches
the sign at once: the curve always bends around the focus, away from the directrix.
:::

:::equations
- *Definition*: $|PF| = \operatorname{dist}(P, \ell)$, focus $F$, directrix $\ell$.
- *Vertical axis*: $x^2 = 4py$, focus $(0, p)$, directrix $y = -p$.
- *Horizontal axis*: $y^2 = 4px$, focus $(p, 0)$, directrix $x = -p$.
- *Shifted*: $(x - h)^2 = 4p(y - k)$ or $(y - k)^2 = 4p(x - h)$, vertex $(h, k)$.
:::

## Eccentricity and polar equations

### One definition for all three curves

The parabola compares two distances and asks for their ratio to be $1$. Allowing any positive
ratio gives the whole family.

:::definition[Eccentricity]
Let $F$ be a point, $\ell$ a line not through $F$, and $e > 0$ a constant. The set

$$
\left\{\, P : \frac{|PF|}{\operatorname{dist}(P, \ell)} = e \,\right\}
$$

is a **conic section** with focus $F$, directrix $\ell$ and **eccentricity** $e$. It is

- an **ellipse** if $e < 1$,
- a **parabola** if $e = 1$,
- a **hyperbola** if $e > 1$.
:::

For the ellipse and the hyperbola, the eccentricity is read off the standard equation.

::::proposition[Eccentricity from the axes]
For $\frac{x^2}{a^2} + \frac{y^2}{b^2} = 1$ (with $c^2 = a^2 - b^2$) and for
$\frac{x^2}{a^2} - \frac{y^2}{b^2} = 1$ (with $c^2 = a^2 + b^2$), the focus $(c, 0)$ and the line
$x = \frac{a^2}{c}$ are a focus and a directrix, with

$$
e = \frac{c}{a} .
$$

So $e < 1$ for an ellipse, since $c < a$, and $e > 1$ for a hyperbola, since $c > a$.

:::proof
On the ellipse $y^2 = b^2\left(1 - \frac{x^2}{a^2}\right)$, so

$$
|PF|^2 = (x - c)^2 + b^2 - \frac{b^2}{a^2}x^2 = \frac{c^2}{a^2}x^2 - 2cx + a^2 = \left(a - \frac{c}{a}x\right)^2 .
$$

For $|x| \le a$ the bracket is positive, and $a - \frac{c}{a}x = \frac{c}{a}\left(\frac{a^2}{c} - x\right) = \frac{c}{a}\operatorname{dist}(P, \ell)$.
For the hyperbola, $y^2 = b^2\left(\frac{x^2}{a^2} - 1\right)$ gives the same square, and taking
absolute values gives the same ratio $\frac{c}{a}$.
:::
::::

A circle would be $e = 0$: both foci at the centre and the directrix infinitely far away. The
definition above leaves it out, since it needs a line.

### Polar equations with a focus at the pole

The definition becomes simplest in polar coordinates when the focus is the pole. Then $|PF| = r$,
and the distance to the directrix is a linear expression in $r\cos\theta$ or $r\sin\theta$.

::::theorem[Polar equations of conics]
Let a conic have eccentricity $e$, a focus at the pole, and a directrix at distance $d > 0$ from
it. Its polar equation is

| Directrix | Equation |
|---|---|
| $x = d$ | $r = \dfrac{ed}{1 + e\cos\theta}$ |
| $x = -d$ | $r = \dfrac{ed}{1 - e\cos\theta}$ |
| $y = d$ | $r = \dfrac{ed}{1 + e\sin\theta}$ |
| $y = -d$ | $r = \dfrac{ed}{1 - e\sin\theta}$ |

:::proof
Take the directrix $x = d$ and a point $P$ of the curve on the same side of it as the pole. Its
$x$-coordinate is $r\cos\theta$, so $\operatorname{dist}(P, \ell) = d - r\cos\theta$, and the
condition $|PF| = e \operatorname{dist}(P, \ell)$ is

$$
r = e(d - r\cos\theta)
\quad\Longrightarrow\quad
r(1 + e\cos\theta) = ed .
$$

For $x = -d$ the distance is $d + r\cos\theta$, which changes the sign; for $y = \pm d$ the
coordinate is $r\sin\theta$ instead. For a hyperbola, the branch on the far side of the directrix
comes out of the same equation with $r < 0$.
:::
::::

To read an equation, divide numerator and denominator so that the denominator starts with $1$:
the coefficient of $\cos\theta$ or $\sin\theta$ is then $e$, and the numerator is $ed$.

::::example[A conic from its directrix]
Find the polar equation of the conic with focus at the pole, directrix $y = -5$ and eccentricity
$2$.

:::solution
The directrix is $y = -d$ with $d = 5$, so the form is $r = \frac{ed}{1 - e\sin\theta}$:

$$
r = \frac{2 \cdot 5}{1 - 2\sin\theta} = \frac{10}{1 - 2\sin\theta} .
$$

Since $e = 2 > 1$, it is a hyperbola.
:::
::::

::::example[An ellipse in polar form]
Identify $r = \dfrac{3}{2 + \cos\theta}$: its type, eccentricity and directrix, its Cartesian
equation, and a sketch.

:::solution
Divide numerator and denominator by $2$ to make the denominator start with $1$:

$$
r = \frac{\frac32}{1 + \frac12\cos\theta} .
$$

So $e = \frac12 < 1$, an ellipse. From $ed = \frac32$, $d = 3$, and the $+\cos\theta$ form puts the
directrix at $x = 3$.

For the Cartesian equation, clear the fraction and use $r = \sqrt{x^2 + y^2}$, $r\cos\theta = x$:

$$
2r + r\cos\theta = 3
\quad\Longrightarrow\quad
2\sqrt{x^2 + y^2} = 3 - x
\quad\Longrightarrow\quad
4(x^2 + y^2) = 9 - 6x + x^2 .
$$

Collect and complete the square in $x$:

$$
3x^2 + 6x + 4y^2 = 9
\quad\Longrightarrow\quad
3(x + 1)^2 + 4y^2 = 12
\quad\Longrightarrow\quad
\frac{(x + 1)^2}{4} + \frac{y^2}{3} = 1 .
$$

The centre is $(-1, 0)$, $a = 2$, $b = \sqrt3$ and $c = \sqrt{4 - 3} = 1$, so the foci are
$(0, 0)$, the pole as promised, and $(-2, 0)$; and $\frac{c}{a} = \frac12 = e$.

To sketch straight from the polar equation, take the four quarter-turn angles:

| $\theta$ | $0$ | $\frac{\pi}{2}$ | $\pi$ | $\frac{3\pi}{2}$ |
|---|---|---|---|---|
| $r$ | $1$ | $\frac32$ | $3$ | $\frac32$ |
| point | $(1, 0)$ | $\left(0, \frac32\right)$ | $(-3, 0)$ | $\left(0, -\frac32\right)$ |

$(1, 0)$ and $(-3, 0)$ are the vertices; the curve is closest to the focus at $\theta = 0$, on
the side facing the directrix.
:::
::::

::::example[A hyperbola in polar form]
Identify $r = \dfrac{1}{2 + 4\sin\theta}$ and find its Cartesian equation and asymptotes.

:::solution
Dividing by $2$,

$$
r = \frac{\frac12}{1 + 2\sin\theta} ,
$$

so $e = 2 > 1$, a hyperbola. From $ed = \frac12$, $d = \frac14$: the directrix is $y = \frac14$.

The vertices lie on the axis, the $y$-axis here:

- $\theta = \frac{\pi}{2}$: $r = \frac16$, the point $\left(0, \frac16\right)$;
- $\theta = \frac{3\pi}{2}$: $r = \frac{1}{2 - 4} = -\frac12$. A negative $r$ goes the other way, so this is the point $\left(0, \frac12\right)$.

The centre is their midpoint $\left(0, \frac13\right)$, so $a = \frac16$, and the pole is a focus
at distance $c = \frac13$ from the centre ($\frac{c}{a} = 2 = e$). Also $\theta = 0$ and
$\theta = \pi$ give $r = \frac12$: the points $\left(\pm\frac12, 0\right)$.

For the Cartesian equation, $2r + 4r\sin\theta = 1$ becomes $2\sqrt{x^2 + y^2} = 1 - 4y$, and
squaring,

$$
4(x^2 + y^2) = 1 - 8y + 16y^2
\quad\Longrightarrow\quad
4x^2 - 12\left(y - \frac13\right)^2 = -\frac13
\quad\Longrightarrow\quad
\frac{\left(y - \frac13\right)^2}{\frac{1}{36}} - \frac{x^2}{\frac{1}{12}} = 1 ,
$$

with $a^2 = \frac{1}{36}$ and $b^2 = \frac{1}{12}$, as expected from $b^2 = c^2 - a^2 = \frac19 - \frac{1}{36}$.

The curve runs off to infinity where the denominator vanishes:

$$
2 + 4\sin\theta = 0
\quad\Longrightarrow\quad
\sin\theta = -\frac12
\quad\Longrightarrow\quad
\theta = \frac{7\pi}{6} \quad\text{or}\quad \theta = \frac{11\pi}{6} .
$$

The asymptotes are parallel to these two directions, with slopes $\tan\frac{7\pi}{6} = \frac{1}{\sqrt3}$
and $\tan\frac{11\pi}{6} = -\frac{1}{\sqrt3}$, but they pass through the centre, not the pole:

$$
y - \frac13 = \pm\frac{1}{\sqrt3}\,x ,
$$

which agrees with the slopes $\pm\frac{a}{b} = \pm\frac{1/6}{1/(2\sqrt3)}$ of the vertical form.
:::
::::

```sim
id: conic-polar
controls:
  - {id: e, label: "e (eccentricity)", min: 0, max: 2.5, step: 0.01, default: 0.5, decimals: 2}
  - {id: d, label: "d (ed when keep = 1)", min: 0.25, max: 5, step: 0.05, default: 3, decimals: 2}
  - {id: dir, label: "directrix (0 x = d, 1 x = −d, 2 y = d, 3 y = −d)", min: 0, max: 3, step: 1, default: 0, decimals: 0}
  - {id: theta, label: "P at θ (× π)", min: 0, max: 2, step: 0.01, default: 0.5, decimals: 2}
  - {id: keep, label: "as e moves, keep (0 d, 1 ed)", min: 0, max: 1, step: 1, default: 0, decimals: 0}
  - {id: family, label: "dotted family (0 off, 1 on)", min: 0, max: 1, step: 1, default: 1, decimals: 0}
note: 'The focus F is at the pole and the yellow dashed line is the directrix. Slide e: below 1 the curve is an ellipse, at 1 a parabola, above 1 a hyperbola, whose second branch (the points with r < 0) comes in from far beyond the directrix as e grows; with keep = 0 the frame widens with ed past e = 1. Slide θ: P moves along the curve and |PF| ÷ dist(P, directrix) stays e. The dotted curves keep everything but e. With keep = 0 the focus and the directrix stay put, so as e falls to 0 the curve shrinks into the focus. With keep = 1 the slider sets ed instead: every curve passes through the same two points beside the focus, the directrix comes in from infinity as e grows, and e = 0 is the circle r = ed. The defaults are the ellipse r = 3/(2 + cos θ); for the other two examples set e = 2, d = 5, directrix 3, and e = 2, d = 0.25, directrix 2.'
```

```python
# r = ed / (1 + e cos θ), focus at the pole and directrix x = d: |PF| / dist(P, ℓ) = e at every θ.
# Defaults: e = 1/2 and d = 3, the ellipse r = 3/(2 + cos θ).
from math import cos, sin, sqrt, pi

def kind(e):
    return "circle" if e == 0 else "parabola" if e == 1 else "ellipse" if e < 1 else "hyperbola"

e, d = 0.5, 3
for th in (0, pi / 2, pi, 4.0):
    r = e * d / (1 + e * cos(th))
    x, y = r * cos(th), r * sin(th)
    print(f"θ = {th:.3f}: r = {r:.4f}, P = ({x:7.4f}, {y:7.4f}), |PF| / dist(P, ℓ) = {abs(r) / abs(d - x):.4f}")

def axes(e, ed):
    """Centre (along the axis, from the focus), a, b and c, from the vertices at θ = 0 and θ = π."""
    r0, r1 = ed / (1 + e), ed / (1 - e)         # r1 < 0 for a hyperbola: that vertex is on the far branch
    centre = (r0 - r1) / 2                       # the vertices are r0 and −r1 along the axis
    a, c = abs(r0 + r1) / 2, abs(centre)         # the focus is c from the centre
    return centre, a, sqrt(abs(a**2 - c**2)), c

for name, e, ed in (("r = 3/(2 + cos θ)", 0.5, 1.5), ("r = 1/(2 + 4 sin θ)", 2, 0.5)):
    centre, a, b, c = axes(e, ed)
    print(f"{name}: e = {e}, {kind(e)}, d = {ed / e:g}; centre {centre:+.4f} along the axis, a = {a:.4f}, b = {b:.4f}, c = {c:.4f}, c/a = {c / a:g}")

# hold ed = 3/2 and let e shrink: r is squeezed between its values at θ = 0 and θ = π towards the circle r = 3/2
for e in (0.5, 0.1, 0.01, 0):
    print(f"e = {e:<4}: {1.5 / (1 + e):.4f} ≤ r ≤ {1.5 / (1 - e):.4f}  ({kind(e)})")
# Output:
#   θ = 0.000: r = 1.0000, P = ( 1.0000,  0.0000), |PF| / dist(P, ℓ) = 0.5000
#   θ = 1.571: r = 1.5000, P = ( 0.0000,  1.5000), |PF| / dist(P, ℓ) = 0.5000
#   θ = 3.142: r = 3.0000, P = (-3.0000,  0.0000), |PF| / dist(P, ℓ) = 0.5000
#   θ = 4.000: r = 2.2282, P = (-1.4565, -1.6863), |PF| / dist(P, ℓ) = 0.5000
#   r = 3/(2 + cos θ): e = 0.5, ellipse, d = 3; centre -1.0000 along the axis, a = 2.0000, b = 1.7321, c = 1.0000, c/a = 0.5
#   r = 1/(2 + 4 sin θ): e = 2, hyperbola, d = 0.25; centre +0.3333 along the axis, a = 0.1667, b = 0.2887, c = 0.3333, c/a = 2
#   e = 0.5 : 1.0000 ≤ r ≤ 3.0000  (ellipse)
#   e = 0.1 : 1.3636 ≤ r ≤ 1.6667  (ellipse)
#   e = 0.01: 1.4851 ≤ r ≤ 1.5152  (ellipse)
#   e = 0   : 1.5000 ≤ r ≤ 1.5000  (circle)
```

:::caution
The angles where $r \to \infty$ come from solving $\sin\theta = -\frac12$, which has its solutions
in the third and fourth quadrants, $\frac{7\pi}{6}$ and $\frac{11\pi}{6}$, not at $\frac{\pi}{6}$.
They give the *directions* of the asymptotes; the asymptotes themselves go through the centre of
the hyperbola, which is not the pole.
:::

:::insight
One focus, one line and one number describe every conic. In polar coordinates centred at that
focus the whole family is $r = \frac{ed}{1 \pm e\cos\theta}$ or $\frac{ed}{1 \pm e\sin\theta}$, and
the type is read off the coefficient once the denominator starts with $1$.
:::

:::equations
- *Eccentricity*: $\dfrac{|PF|}{\operatorname{dist}(P, \ell)} = e$; ellipse $e < 1$, parabola $e = 1$, hyperbola $e > 1$.
- *From the axes*: $e = \dfrac{c}{a}$ for the ellipse and the hyperbola.
- *Polar, focus at the pole*: $r = \dfrac{ed}{1 \pm e\cos\theta}$ (directrix $x = \pm d$), $r = \dfrac{ed}{1 \pm e\sin\theta}$ (directrix $y = \pm d$).
:::

## Further reading

- [Paul's Online Notes — Ellipses](https://tutorial.math.lamar.edu/Classes/Alg/Ellipses.aspx) — standard and shifted forms, with completing the square worked out.
- [Paul's Online Notes — Hyperbolas](https://tutorial.math.lamar.edu/Classes/Alg/Hyperbolas.aspx) — the box-and-asymptotes sketch for both orientations.
- [Paul's Online Notes — Parabolas](https://tutorial.math.lamar.edu/Classes/Alg/Parabolas.aspx) — vertex form and sketching, without the focus.
- [Wikipedia — Conic section](https://en.wikipedia.org/wiki/Conic_section) — why these curves are slices of a cone, and the eccentricity and directrix view of all three.
