---
title: Functions of several variables, limits and continuity
order: 11
status: detailed
weeks: [9]
introduces: [multivariable-function]
requires:
  - {concept: function, strength: hard}
  - {concept: limit, strength: hard}
  - {concept: quadric-surface, strength: soft}
reinforces:
  - {concept: limit, perspective: "in several variables"}
  - {concept: continuity, perspective: "in several variables"}
---

A vector function sends one number to a point. This unit goes the other way: a function of several
variables sends a point to one number, as a map of a region assigns a height or a temperature to each
place. Such a function has two pictures, a surface over the plane and a contour map on the plane.
Limits look like the limits of one variable, but one thing changes: a point in the plane can be
approached along infinitely many paths, not just from two sides, and all of them must agree.

## Functions of two variables

### Definition, domain and range

:::definition[Function of two variables]
A **function of two variables** $f$ is a rule that assigns to each ordered pair $(x, y)$ in a set
$D \subseteq \mathbb{R}^2$ a unique real number $f(x, y)$. The set $D$ is its **domain**, and its
**range** is $\{ f(x, y) : (x, y) \in D \}$. We often write $z = f(x, y)$, with $x$ and $y$ the
**independent variables** and $z$ the **dependent variable**.
:::

If a function is given by a formula with no domain stated, its domain is every point where the
formula makes sense. The same three restrictions as in one variable decide it: no division by $0$, no
even root of a negative number, no logarithm of a number that is not positive. Where they apply, the
answer is now a region of the plane, so it is drawn rather than listed.

::::example[A domain with a hole along a line]
Find and sketch the domain of $f(x, y) = \dfrac{\sqrt{9 - x^2 - y^2}}{y}$.

:::solution
The root needs $x^2 + y^2 \le 9$, the closed disk of radius $3$ about the origin. The denominator
needs $y \ne 0$. So the domain is the disk without the diameter on the $x$-axis:

$$
D = \{ (x, y) : x^2 + y^2 \le 9,\ y \ne 0 \} .
$$

In a sketch, the circle is drawn solid (it belongs to $D$) and the diameter dashed (it does not).
:::
::::

::::example[A domain bounded by two curves]
Find the domain of $g(x, y) = \ln(y - x^2) + \sqrt{4 - x^2 - y^2}$.

:::solution
The logarithm needs $y > x^2$, the points strictly above the parabola. The root needs
$x^2 + y^2 \le 4$, the closed disk of radius $2$. The domain is the part of the disk above the
parabola: a cap whose circular arc belongs to it and whose parabolic edge does not.
:::
::::

::::example[A range]
Find the range of $f(x, y) = \sqrt{9 - x^2 - y^2}$.

:::solution
On the domain $x^2 + y^2 \le 9$, the quantity $9 - x^2 - y^2$ takes every value from $0$ (on the
circle) to $9$ (at the origin). Its square root takes every value from $0$ to $3$. The range is $[0, 3]$.
:::
::::

### Graphs

:::definition[Graph of a function of two variables]
The **graph** of $f$ is the set of points $(x, y, z)$ in space with $z = f(x, y)$ and $(x, y) \in D$.
It is a surface lying over the domain.
:::

Every surface studied so far that passes the vertical-line test is such a graph.

- A linear function $f(x, y) = ax + by + c$ has a plane as its graph.
- $f(x, y) = \sqrt{9 - x^2 - y^2}$ has the upper half of the sphere $x^2 + y^2 + z^2 = 9$ as its graph. (From $z = \sqrt{9 - x^2 - y^2}$, $z \ge 0$ and $z^2 = 9 - x^2 - y^2$.)
- $f(x, y) = 4 - x^2 - 2y^2$ has an elliptic paraboloid as its graph, opening downward from $(0, 0, 4)$.
- $f(x, y) = x^2 - y^2$ has a hyperbolic paraboloid as its graph: a saddle.
- $f(x, y) = \sqrt{x^2 + y^2}$ has the upper half of a circular cone as its graph.

A full sphere or ellipsoid is not a graph: it has two heights over each interior point, so it takes
two functions, an upper and a lower half.

### Level curves

Drawing a surface by hand is hard. A map solves the same problem with contour lines: curves on flat
paper, each joining the points of equal height.

:::definition[Level curve]
The **level curves** of $f$ are the curves $f(x, y) = k$ in the $xy$-plane, for $k$ in the range of
$f$. A collection of level curves is a **contour map**.
:::

The level curve at $k$ is the horizontal trace of the graph at height $z = k$, dropped onto the
$xy$-plane. So the traces of the previous unit reappear here, and a contour map is the stack of
horizontal traces seen from above.

:::steps[Sketching level curves]
1. Set $f(x, y) = k$ and rewrite it as a curve you can name: a line, circle, ellipse, parabola or hyperbola.
2. Say for which $k$ it exists (the range of $f$), and treat the degenerate values, such as a single point or two lines, separately.
3. Draw the curves for several equally spaced values of $k$ and label each.
4. Read the steepness: where equally spaced levels crowd together, the surface is steep.
:::

::::example[Level curves of a paraboloid and a cone]
Compare the level curves of $f(x, y) = x^2 + y^2$ and $g(x, y) = \sqrt{x^2 + y^2}$ for $k = 1, 2, 3, 4$.

:::solution
Both have circles about the origin as level curves. For $f$ the radii are $\sqrt{k}$:
$1, 1.41, 1.73, 2$, and the circles crowd together going outward, because the bowl gets steeper. For
$g$ the radii are $k$: $1, 2, 3, 4$, evenly spaced, because the cone has a constant slope.

Same shape of curves, different surfaces: the spacing carries the slope.
:::
::::

::::example[Level curves of a saddle]
Describe the level curves of $f(x, y) = x^2 - y^2$.

:::solution
$x^2 - y^2 = k$. For $k > 0$: hyperbolas opening left and right, with vertices $(\pm\sqrt{k}, 0)$. For
$k < 0$: hyperbolas opening up and down, with vertices $(0, \pm\sqrt{-k})$. For $k = 0$: the two lines
$y = \pm x$, crossing at the origin. A crossing of level curves at one height is the signature of a saddle.
:::
::::

::::example[Level curves that are parabolas]
Describe the level curves of $f(x, y) = y - x^2$.

:::solution
$y - x^2 = k$ is $y = x^2 + k$: copies of the parabola $y = x^2$ shifted vertically by $k$. Every real
$k$ occurs, so the range is $\mathbb{R}$. Since the curves are vertical shifts of each other, evenly
spaced for evenly spaced $k$, the graph is the same parabola slid along the direction
$\langle 0, 1, 1 \rangle$: a parabolic cylinder.
:::
::::

```sim
id: level-curves
controls:
  - {id: fn, label: "Function (0: x² + y², 1: √(x² + y²), 2: x² − y², 3: y − x², 4: two hills)", min: 0, max: 4, step: 1, default: 0, decimals: 0}
  - {id: k, label: Level k, min: -3, max: 4, step: 0.1, default: 2, decimals: 1}
note: 'Left: the surface and the plane z = k. Right: the contour map, with the level curve f = k in red, the same curve seen from above. A k outside the range leaves no red curve: try k < 0 for the first two functions. Function 4 has two hills, so a single level curve can come in two pieces.'
```

:::caution[Equal spacing of the levels, not of the curves]
Equally spaced values of $k$ rarely give equally spaced curves; that is the whole information in a
contour map. And a value of $k$ outside the range gives no curve at all: $x^2 + y^2 = -1$ is empty,
not a mistake to be fixed.
:::

## Functions of three or more variables

### Level surfaces

A function of three variables $f(x, y, z)$ assigns a number to each point of a region of space, such
as the temperature at each point of a room. Its graph would need four dimensions, so the contour
idea does the work instead.

:::definition[Level surface]
The **level surfaces** of $f(x, y, z)$ are the surfaces $f(x, y, z) = k$ in space.
:::

::::example[Spheres, and a family of quadrics]
Describe the level surfaces of $f(x, y, z) = x^2 + y^2 + z^2$ and of $g(x, y, z) = x^2 + y^2 - z^2$.

:::solution
$x^2 + y^2 + z^2 = k$ is a sphere of radius $\sqrt{k}$ for $k > 0$, the origin for $k = 0$, and empty
for $k < 0$.

$x^2 + y^2 - z^2 = k$ is a hyperboloid of one sheet for $k > 0$, a cone for $k = 0$, and a hyperboloid
of two sheets for $k < 0$. The cone is the surface that separates the two kinds of hyperboloid.
:::
::::

::::example[A domain in space]
Find the domain of $f(x, y, z) = \ln(1 - x^2 - y^2 - z^2)$.

:::solution
It needs $x^2 + y^2 + z^2 < 1$: the inside of the unit sphere, without the sphere itself.
:::
::::

A function of $n$ variables $f(x_1, \dots, x_n)$ is the same thing with $n$ inputs. In vector form it
reads $f(\mathbf{x})$ with $\mathbf{x} = \langle x_1, \dots, x_n \rangle$. A linear one is a dot
product, $f(\mathbf{x}) = \mathbf{c} \cdot \mathbf{x}$. This is the usual form in data work, where
$\mathbf{x}$ holds the features of a sample or the parameters of a model.

:::equations{#several-variables}
- *Graph*: $\{ (x, y, z) : z = f(x, y),\ (x, y) \in D \}$.
- *Level curve*: $f(x, y) = k$.
- *Level surface*: $f(x, y, z) = k$.
:::

## Limits

### What a limit means in two variables

In one variable, $x \to a$ means approaching from the left or the right. In the plane, a point can be
approached from any direction, along lines and along curves that spiral in. The definition does not
mention any path: it measures only the distance to the point.

:::definition[Limit of a function of two variables]
Let $f$ have domain $D$, and suppose $D$ has points arbitrarily close to $(a, b)$. Then

$$
\lim_{(x, y) \to (a, b)} f(x, y) = L
$$

if for every $\varepsilon > 0$ there is a $\delta > 0$ such that $|f(x, y) - L| < \varepsilon$
whenever $(x, y) \in D$ and $0 < \sqrt{(x - a)^2 + (y - b)^2} < \delta$.
:::

So $f(x, y)$ must be close to $L$ at **every** point close enough to $(a, b)$, whichever way the
point got there. If the limit exists, every path to $(a, b)$ gives the value $L$. Turned around, this
is the main tool.

:::proposition[Two-path test]
If $f(x, y) \to L_1$ along one path to $(a, b)$ and $f(x, y) \to L_2 \ne L_1$ along another path, then
$\lim_{(x, y) \to (a, b)} f(x, y)$ does not exist.
:::

### Showing that a limit does not exist

::::example[Different values along the axes]
Show that $\displaystyle\lim_{(x, y) \to (0, 0)} \frac{x^2 - y^2}{x^2 + y^2}$ does not exist.

:::solution
On the $x$-axis, $y = 0$ and the function is $\frac{x^2}{x^2} = 1$. On the $y$-axis, $x = 0$ and the
function is $\frac{-y^2}{y^2} = -1$. Two paths, two values: no limit.
:::
::::

::::example[The axes agree, a diagonal does not]
Show that $\displaystyle\lim_{(x, y) \to (0, 0)} \frac{xy}{x^2 + y^2}$ does not exist.

:::solution
On both axes the function is $0$. That proves nothing. Along $y = mx$, with $x \ne 0$,

$$
\frac{x \cdot mx}{x^2 + m^2x^2} = \frac{m}{1 + m^2} ,
$$

a constant that depends on the slope: $0$ for $m = 0$ and $\frac12$ for $m = 1$. Different paths give
different values, so there is no limit.
:::
::::

::::example[Every line agrees, a parabola does not]
Show that $\displaystyle\lim_{(x, y) \to (0, 0)} \frac{x^2y}{x^4 + y^2}$ does not exist.

:::solution
Along $y = mx$ with $m \ne 0$,

$$
\frac{mx^3}{x^4 + m^2x^2} = \frac{mx}{x^2 + m^2} \to 0 ,
$$

and along the axes the function is $0$. Every line through the origin gives $0$. But along the parabola $y = x^2$,

$$
\frac{x^2 \cdot x^2}{x^4 + x^4} = \frac12 .
$$

So $0$ and $\frac12$ both occur, and the limit does not exist.
:::
::::

```sim
id: limit-paths
controls:
  - {id: fn, label: "Function (0: xy/(x²+y²), 1: (x²−y²)/(x²+y²), 2: x²y/(x⁴+y²), 3: xy²/(x²+y²))", min: 0, max: 3, step: 1, default: 2, decimals: 0}
  - {id: path, label: "Path (0: line y = mx, 1: parabola y = mx²)", min: 0, max: 1, step: 1, default: 0, decimals: 0}
  - {id: m, label: Coefficient m, min: -3, max: 3, step: 0.1, default: 1, decimals: 1}
note: 'Left: the values of f near the origin, with the path. Right: f along the path as x → 0. Function 2 goes to 0 along every line, and to m/(1 + m²) along y = mx². Function 3 goes to 0 on every path, because its limit exists. Function 0 depends on m along lines.'
```

### Showing that a limit exists

Paths can only disprove a limit. To find a limit, work through these steps in order.

:::steps[Finding a limit at a point]
1. **Substitute.** If $f$ is continuous at the point (a polynomial, or a quotient whose denominator is not $0$ there), the limit is the value.
2. **Simplify.** Factor and cancel if substitution gives $\frac00$.
3. **Try paths.** Use $x = a$, $y = b$, then $y - b = m(x - a)$, then a curve that balances the powers. Two different values end the problem: no limit.
4. **Prove it.** If every path gives the same $L$, show $|f(x, y) - L| \le g(x, y)$ with $g \to 0$ (squeeze), or change to polar coordinates about the point.
:::

::::example[A limit by substitution]
Find $\displaystyle\lim_{(x, y) \to (1, 2)} \frac{x^2y + 3}{x + y}$.

:::solution
The denominator is not $0$ at $(1, 2)$, so the quotient is continuous there: the limit is
$\frac{2 + 3}{3} = \frac53$.
:::
::::

::::example[A limit by cancelling]
Find $\displaystyle\lim_{(x, y) \to (2, 2)} \frac{x^2 - y^2}{x - y}$.

:::solution
The function is not defined on the line $y = x$, but for $x \ne y$ it equals $x + y$. So the limit is
$2 + 2 = 4$.
:::
::::

::::example[A limit by squeezing]
Find $\displaystyle\lim_{(x, y) \to (0, 0)} \frac{xy^2}{x^2 + y^2}$.

:::solution
Every path tried gives $0$, so $0$ is the candidate. Since $y^2 \le x^2 + y^2$,

$$
0 \le \left| \frac{xy^2}{x^2 + y^2} \right| = |x|\,\frac{y^2}{x^2 + y^2} \le |x| ,
$$

and $|x| \to 0$. By the squeeze theorem, the limit is $0$.
:::
::::

Polar coordinates turn the distance to the origin into one variable: with $x = r\cos\theta$ and
$y = r\sin\theta$, $(x, y) \to (0, 0)$ means $r \to 0^+$.

::::example[A limit in polar coordinates]
Find $\displaystyle\lim_{(x, y) \to (0, 0)} \frac{x^3 + y^3}{x^2 + y^2}$ and $\displaystyle\lim_{(x, y) \to (0, 0)} \frac{\sin(x^2 + y^2)}{x^2 + y^2}$.

:::solution
For the first,

$$
\frac{x^3 + y^3}{x^2 + y^2} = \frac{r^3(\cos^3\theta + \sin^3\theta)}{r^2} = r(\cos^3\theta + \sin^3\theta) .
$$

Since $|\cos^3\theta + \sin^3\theta| \le 2$ whatever $\theta$ is, the absolute value is at most $2r \to 0$. The limit is $0$.

For the second, $x^2 + y^2 = r^2$, so the function is $\frac{\sin r^2}{r^2}$, which has no $\theta$ at
all, and $\lim_{u \to 0^+} \frac{\sin u}{u} = 1$. The limit is $1$.
:::
::::

:::caution[The bound must hold for every angle at once]
A polar expression that tends to $0$ for each fixed $\theta$ does not prove the limit is $0$. For
$\frac{x^2y}{x^4 + y^2}$ the polar form is
$\frac{r\cos^2\theta\sin\theta}{r^2\cos^4\theta + \sin^2\theta}$, which goes to $0$ for every fixed
$\theta$, yet the limit does not exist: fixing $\theta$ only tests straight lines. The proof needs a
bound by a function of $r$ alone, with no $\theta$ in it, as in $2r$ above.
:::

:::caution[Many paths never prove a limit]
There are infinitely many paths. Agreement on ten of them, or on every line, is evidence and not a
proof. A proof must cover all the points near $(a, b)$ at once: a squeeze, or polar form with a
bound independent of $\theta$.
:::

:::insight
Disproving a limit takes two paths. Proving one takes an inequality. When substitution gives
$\frac00$ and every term on top has one degree, and every term below another, compare them: a higher
degree on top gives a limit of $0$, and equal degrees give a value that depends on the path.
:::

## Continuity

### Definition

:::definition[Continuity in two variables]
$f$ is **continuous** at $(a, b)$ if $\displaystyle\lim_{(x, y) \to (a, b)} f(x, y) = f(a, b)$, and
continuous on $D$ if it is continuous at every point of $D$.
:::

As in one variable, this packs in three demands: $f(a, b)$ is defined, the limit exists, and the two
are equal. Sums, products and compositions of continuous functions are continuous, and so are
quotients where the denominator is not $0$. That covers almost everything met in practice:

- a **polynomial** in $x$ and $y$ is continuous on all of $\mathbb{R}^2$;
- a **rational function** is continuous wherever its denominator is not $0$;
- a composition $g(f(x, y))$ is continuous wherever $f$ is continuous and $g$ is continuous at the value of $f$.

::::example[Where a function is continuous]
Where are $f(x, y) = \dfrac{x + y}{x^2 + y^2 - 4}$ and $g(x, y) = \ln(x + y) + e^{xy}$ continuous?

:::solution
$f$ is a rational function, continuous except on the circle $x^2 + y^2 = 4$.

$g$ is a sum of compositions of continuous functions, continuous where the logarithm is defined:
the half-plane $x + y > 0$.
:::
::::

::::example[Repairing a function at the origin]
Is $f$ continuous at $(0, 0)$, where $f(x, y) = \dfrac{xy^2}{x^2 + y^2}$ for $(x, y) \ne (0, 0)$ and $f(0, 0) = 0$? And what if the formula is $\dfrac{xy}{x^2 + y^2}$?

:::solution
For the first, the limit at the origin was shown to be $0$, which is the assigned value: $f$ is continuous on the whole plane.

For the second, the limit does not exist, so no value at the origin makes the function continuous
there. It is continuous everywhere else.
:::
::::

### Three variables

Everything above extends word for word. $\lim_{(x, y, z) \to (a, b, c)} f(x, y, z) = L$ means $f$ is
close to $L$ at all points close to $(a, b, c)$, with distance measured in space, and paths now run
in space. The function $\frac{1}{x^2 + y^2 + z^2 - 1}$ is continuous except on the unit sphere.

:::equations{#limits}
- *Limit*: $|f(x, y) - L| < \varepsilon$ when $0 < \sqrt{(x - a)^2 + (y - b)^2} < \delta$.
- *Two-path test*: two paths with different limits mean no limit.
- *Polar form at the origin*: $x = r\cos\theta$, $y = r\sin\theta$, $r \to 0^+$, with a bound free of $\theta$.
- *Continuity*: $\lim_{(x, y) \to (a, b)} f(x, y) = f(a, b)$.
:::

## Further reading

- [Wikipedia — Function of several real variables](https://en.wikipedia.org/wiki/Function_of_several_real_variables) — domains, graphs and limits in general form.
- [Wikipedia — Level set](https://en.wikipedia.org/wiki/Level_set) — level curves and surfaces in any dimension.
- [Wikipedia — Contour line](https://en.wikipedia.org/wiki/Contour_line) — how a topographic map reads steepness from spacing.
