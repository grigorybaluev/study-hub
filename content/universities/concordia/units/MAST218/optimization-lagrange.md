---
title: Optimisation and Lagrange multipliers
order: 14
status: detailed
weeks: [11, 12]
introduces:
  - multivariable-optimization
  - lagrange-multipliers
  - {concept: hessian-matrix, perspective: "the matrix of second partials behind the second-derivative test"}
requires:
  - {concept: partial-derivative, strength: hard}
  - {concept: gradient, strength: hard}
  - {concept: extrema, strength: soft}
reinforces: []
---

Finding the largest and smallest values of a function is what calculus is most often used for. In
one variable, the candidates are the points where the derivative is $0$. In several variables they
are the points where the gradient is $\mathbf{0}$, and the surface is flat there. Three things change.
A flat point can be a saddle, which is neither a maximum nor a minimum, and a test with second
derivatives tells them apart. On a region, the boundary is now a whole curve and must be searched
too. And when the point is tied to a constraint, the method of Lagrange multipliers replaces
elimination with a geometric condition: the level curve of $f$ just touches the constraint.

## Local extrema and critical points

### Definitions

:::definition[Local maximum and minimum]
$f(x, y)$ has a **local maximum** at $(a, b)$ if $f(x, y) \le f(a, b)$ at all points $(x, y)$ near
$(a, b)$, that is, on some disk around it. The value $f(a, b)$ is a **local maximum value**. A
**local minimum** has $f(x, y) \ge f(a, b)$ instead. Both are **local extrema**.
:::

If the inequality holds on the whole domain, the extremum is **absolute** (or global).

::::theorem[At a local extremum the gradient vanishes]
If $f$ has a local extremum at $(a, b)$ and its first partial derivatives exist there, then
$f_x(a, b) = 0$ and $f_y(a, b) = 0$.

:::proof
The one-variable function $g(x) = f(x, b)$ has a local extremum at $x = a$, so $g'(a) = 0$, and
$g'(a) = f_x(a, b)$. The same argument with $h(y) = f(a, y)$ gives $f_y(a, b) = 0$.
:::
::::

Geometrically, if the graph has a tangent plane at a local extremum, the plane is horizontal.

:::definition[Critical point and saddle point]
A point $(a, b)$ in the domain is a **critical point** of $f$ if $\nabla f(a, b) = \mathbf{0}$ or if a
first partial derivative does not exist there. A critical point at which every disk around it
contains points where $f$ is larger and points where $f$ is smaller is a **saddle point**.
:::

So every local extremum is at a critical point, but not every critical point is an extremum.
$f(x, y) = x^2 - y^2$ has $\nabla f = \mathbf{0}$ at the origin, where the surface rises along the
$x$-axis and falls along the $y$-axis: a saddle.

### The second-derivative test

Near a critical point, the first partials vanish, so the shape of the surface is set by the second
partials. They are collected in a matrix.

:::definition[Hessian matrix]
The **Hessian** of $f$ at a point is the symmetric matrix of its second partial derivatives

$$
H = \begin{pmatrix} f_{xx} & f_{xy} \\ f_{xy} & f_{yy} \end{pmatrix} ,
$$

and its determinant is the **discriminant** $D = \det H = f_{xx}f_{yy} - f_{xy}^2$.
:::

::::theorem[Second-derivative test]
Suppose the second partials of $f$ are continuous near $(a, b)$ and $\nabla f(a, b) = \mathbf{0}$. Let
$D = f_{xx}(a, b)f_{yy}(a, b) - f_{xy}(a, b)^2$.

1. If $D > 0$ and $f_{xx}(a, b) > 0$: $f(a, b)$ is a **local minimum**.
2. If $D > 0$ and $f_{xx}(a, b) < 0$: $f(a, b)$ is a **local maximum**.
3. If $D < 0$: $(a, b)$ is a **saddle point**.
4. If $D = 0$: the test gives no information.

:::proof
Here is the idea. Near the critical point, with steps $h$ and $k$ and all partials at $(a, b)$,

$$
f(a + h, b + k) - f(a, b) \approx \frac12\left( f_{xx}h^2 + 2f_{xy}hk + f_{yy}k^2 \right) .
$$

If $f_{xx} \ne 0$, completing the square turns the bracket into

$$
f_{xx}\left( h + \frac{f_{xy}}{f_{xx}}k \right)^2 + \frac{D}{f_{xx}}k^2 .
$$

If $D > 0$, both terms have the sign of $f_{xx}$: the difference has that one sign for every step,
which gives a minimum or a maximum. If $D < 0$, the two terms have opposite signs, so some steps
increase $f$ and others decrease it: a saddle. In matrix language, $D > 0$ with $f_{xx} > 0$ says that
$H$ is positive definite, and $D < 0$ that $H$ is indefinite.
:::
::::

:::steps[Finding and classifying critical points]
1. Compute $f_x$ and $f_y$.
2. Solve $f_x = 0$ and $f_y = 0$ together. Factor and split into cases; never divide by something that can be $0$.
3. Add any points where a partial does not exist.
4. Compute $f_{xx}$, $f_{yy}$, $f_{xy}$ and $D$ as functions.
5. Evaluate $D$ and $f_{xx}$ at each critical point and read off its type.
6. Give the value of $f$ at each extremum.
:::

::::example[One saddle and one minimum]
Find and classify the critical points of $f(x, y) = x^3 + y^2 - 6xy$.

:::solution
$f_x = 3x^2 - 6y = 0$ and $f_y = 2y - 6x = 0$. The second gives $y = 3x$, and the first then gives
$3x^2 - 18x = 3x(x - 6) = 0$. So the critical points are $(0, 0)$ and $(6, 18)$.

$f_{xx} = 6x$, $f_{yy} = 2$, $f_{xy} = -6$, so $D = 12x - 36$.

| Point | $D$ | $f_{xx}$ | Type | Value |
|---|---|---|---|---|
| $(0, 0)$ | $-36$ | $0$ | saddle | $0$ |
| $(6, 18)$ | $36$ | $36$ | local minimum | $-108$ |

There is no absolute minimum: along $y = 0$, $f = x^3 \to -\infty$ as $x \to -\infty$.
:::
::::

::::example[Four critical points from a product]
Find and classify the critical points of $f(x, y) = xy(3 - x - y)$.

:::solution
$f = 3xy - x^2y - xy^2$, so

$$
f_x = y(3 - 2x - y) = 0 ,
\qquad
f_y = x(3 - x - 2y) = 0 .
$$

Each equation splits, so there are four cases.

- $y = 0$ and $x = 0$: the point $(0, 0)$.
- $y = 0$ and $3 - x - 2y = 0$: the point $(3, 0)$.
- $3 - 2x - y = 0$ and $x = 0$: the point $(0, 3)$.
- $3 - 2x - y = 0$ and $3 - x - 2y = 0$: subtracting gives $x = y$, so $(1, 1)$.

$f_{xx} = -2y$, $f_{yy} = -2x$, $f_{xy} = 3 - 2x - 2y$, so $D = 4xy - (3 - 2x - 2y)^2$.

At $(0, 0)$, $(3, 0)$ and $(0, 3)$: $D = -9$, so all three are saddles. At $(1, 1)$: $D = 4 - 1 = 3 > 0$
and $f_{xx} = -2 < 0$, a local maximum with value $1$.
:::
::::

::::example[When the test says nothing]
Show that $D = 0$ at the origin for $x^4 + y^4$, $-x^4 - y^4$ and $x^4 - y^4$, yet they behave differently.

:::solution
All second partials of each vanish at the origin, so $D = 0$ in all three cases. But the first has a
minimum there (it is positive elsewhere), the second a maximum, and the third a saddle (positive on
the $x$-axis, negative on the $y$-axis). With $D = 0$, go back to the function itself.
:::
::::

```sim
id: critical-point-types
controls:
  - {id: A, label: "f_xx", min: -4, max: 4, step: 0.1, default: 2, decimals: 1}
  - {id: B, label: "f_xy", min: -4, max: 4, step: 0.1, default: 1, decimals: 1}
  - {id: C, label: "f_yy", min: -4, max: 4, step: 0.1, default: 2, decimals: 1}
note: 'The surface z = ½(f_xx x² + 2 f_xy xy + f_yy y²) is what any function looks like near a critical point with these second partials. Raise f_xy until D = f_xx f_yy − f_xy² turns negative: the bowl tips over into a saddle, and the contours change from ellipses to hyperbolas. At D = 0 the surface is a trough, a case the test cannot decide.'
```

:::caution[Check the sign of $D$ first]
$f_{xx}$ decides between a maximum and a minimum only when $D > 0$. If $D < 0$ the point is a saddle
whatever $f_{xx}$ is. And $f_{xx} = 0$ with $D > 0$ cannot occur, because then $D = -f_{xy}^2 \le 0$.
:::

### Applied problems

:::steps[A maximum or minimum in words]
1. Name the variables, and write the quantity to optimize.
2. Use the constraints to reduce it to a function of two variables.
3. Find the critical points in the region that makes sense.
4. Justify the answer with the second-derivative test or with the geometry.
:::

::::example[The cheapest open box]
A rectangular box without a lid must hold $32$ m³. Find the dimensions that use the least material.

:::solution
With base $x$ by $y$ and height $z$, the material is $S = xy + 2xz + 2yz$, subject to $xyz = 32$.
Substituting $z = \frac{32}{xy}$,

$$
S(x, y) = xy + \frac{64}{y} + \frac{64}{x} , \qquad x, y > 0 .
$$

$S_x = y - \frac{64}{x^2} = 0$ and $S_y = x - \frac{64}{y^2} = 0$. So $x^2y = 64 = xy^2$, and dividing
(both are positive) gives $x = y$, then $x^3 = 64$. The only critical point is $x = y = 4$, with
$z = 2$ and $S = 48$.

$S_{xx} = \frac{128}{x^3} = 2$, $S_{yy} = 2$, $S_{xy} = 1$, so $D = 3 > 0$: a local minimum. $S$ grows
without bound as $x$ or $y$ approaches $0$ or $\infty$, so it is the absolute one. The box is
$4 \times 4 \times 2$ m.
:::
::::

::::example[The closest point of a plane]
Find the point of the plane $x + y + 2z = 9$ closest to $(2, 1, -1)$.

:::solution
Minimize the square of the distance, which has the same minimizer and no root. With $z = \frac{9 - x - y}{2}$,

$$
d^2 = (x - 2)^2 + (y - 1)^2 + \left( \frac{9 - x - y}{2} + 1 \right)^2 .
$$

Setting both partials to $0$ gives a linear system with solution $x = \frac{10}{3}$, $y = \frac73$. Then
$z = \frac53$ and $d^2 = \frac{32}{3}$. The discriminant is $6 > 0$ with positive $f_{xx}$, a minimum.

The formula for the distance from a point to a plane agrees: $\frac{|2 + 1 - 2 - 9|}{\sqrt{6}} = \frac{8}{\sqrt{6}}$, and $\frac{64}{6} = \frac{32}{3}$.
:::
::::

:::equations{#extrema}
- *Critical point*: $f_x = 0$ and $f_y = 0$, or a partial does not exist.
- *Discriminant*: $D = f_{xx}f_{yy} - f_{xy}^2 = \det H$.
- *Local minimum*: $D > 0$, $f_{xx} > 0$.
- *Local maximum*: $D > 0$, $f_{xx} < 0$.
- *Saddle point*: $D < 0$.
:::

## Absolute extrema on a region

### The extreme value theorem

A function on an open set, or on an unbounded one, may have no largest value. On the right kind of set it must.

:::definition[Closed and bounded sets]
A set in the plane is **closed** if it contains all of its boundary points, and **bounded** if it
fits inside some disk.
:::

:::theorem[Extreme value theorem in two variables]
If $f$ is continuous on a closed bounded set $R$, then $f$ attains an absolute maximum value and an
absolute minimum value on $R$.
:::

The extreme values occur at a critical point inside $R$, or on the boundary. That makes the search finite.

:::steps[Absolute extrema on a closed bounded region]
1. Find the critical points in the interior of $R$ and evaluate $f$ there. No classification is needed.
2. Find the extreme values on the boundary: parametrize each piece and treat it as a one-variable problem, or use Lagrange multipliers.
3. Include the corners of the boundary.
4. Compare: the largest value in the list is the absolute maximum, the smallest the absolute minimum.
:::

::::example[On a triangle]
Find the absolute extrema of $f(x, y) = x^2 + 2y^2 - 2x - 4y$ on the triangle with vertices $(0, 0)$, $(3, 0)$, $(0, 3)$.

:::solution
Interior: $f_x = 2x - 2 = 0$ and $f_y = 4y - 4 = 0$ give $(1, 1)$, which is inside, with $f(1, 1) = -3$.

Edge $y = 0$, $0 \le x \le 3$: $f = x^2 - 2x$, with a critical point at $x = 1$. Values: $f(1, 0) = -1$, and the ends $f(0, 0) = 0$, $f(3, 0) = 3$.

Edge $x = 0$, $0 \le y \le 3$: $f = 2y^2 - 4y$, with a critical point at $y = 1$. Values: $f(0, 1) = -2$, and the end $f(0, 3) = 6$.

Edge $x + y = 3$: put $y = 3 - x$, so $f = 3x^2 - 10x + 6$, with a critical point at $x = \frac53$. Value: $f\left(\frac53, \frac43\right) = -\frac73$.

The list is $-3, -1, 0, 3, -2, 6, -\frac73$. The absolute maximum is $6$ at $(0, 3)$ and the absolute minimum is $-3$ at $(1, 1)$.
:::
::::

:::caution[Common omissions]
Corners are candidates even when no derivative vanishes there. A critical point outside the region is
not a candidate. And classification by $D$ is not needed here: the comparison decides.
:::

## Lagrange multipliers

### The idea

Maximize $f(x, y)$ subject to a constraint $g(x, y) = k$. The point can move only along the curve
$g = k$. Walking along it crosses the level curves of $f$, and $f$ is still rising while the crossing
is at an angle. The largest value is reached where the curve no longer crosses but just touches a
level curve of $f$. There the two curves share a tangent, so their normals are parallel, and the
normals are the gradients.

:::theorem[Lagrange multipliers]
If $f$ has an extreme value on the curve $g(x, y) = k$ at a point where $\nabla g \ne \mathbf{0}$, and
both are differentiable, then at that point

$$
\nabla f = \lambda\,\nabla g
$$

for some number $\lambda$, called a **Lagrange multiplier**.
:::

The argument is one line. Along a parametrization $\mathbf{r}(t)$ of the constraint, $f(\mathbf{r}(t))$
has an extremum, so $\nabla f \cdot \mathbf{r}' = 0$. Since $\nabla g \cdot \mathbf{r}' = 0$ too, both
gradients are perpendicular to the same tangent, which makes them parallel.

:::steps[The method of Lagrange multipliers]
1. Write the system: $f_x = \lambda g_x$, $f_y = \lambda g_y$ (and $f_z = \lambda g_z$), and $g = k$.
2. Solve it for the points. Eliminate $\lambda$, and split into cases rather than dividing by something that may be $0$.
3. Evaluate $f$ at every point found.
4. If the constraint set is closed and bounded, the largest value is the maximum and the smallest is the minimum.
:::

::::example[A product on an ellipse]
Find the extreme values of $f(x, y) = xy$ on the ellipse $x^2 + 4y^2 = 8$.

:::solution
The system is

$$
y = 2\lambda x , \qquad x = 8\lambda y , \qquad x^2 + 4y^2 = 8 .
$$

Multiply the first by $4y$ and the second by $x$: both right sides become $8\lambda xy$, so
$4y^2 = x^2$. Then $x^2 + x^2 = 8$, so $x = \pm 2$ and $y = \pm 1$, all four sign pairs.

$f = 2$ at $(2, 1)$ and $(-2, -1)$; $f = -2$ at $(2, -1)$ and $(-2, 1)$. The ellipse is closed and
bounded, so the maximum is $2$ and the minimum is $-2$.
:::
::::

```sim
id: lagrange-constraint
controls:
  - {id: prob, label: "Problem (0: xy on x² + 4y² = 8, 1: x + 2y on x² + y² = 5, 2: x² + 2y² − 2x on x² + y² = 4)", min: 0, max: 2, step: 1, default: 0, decimals: 0}
  - {id: t, label: Position t on the constraint (degrees), min: 0, max: 360, step: 1, default: 30, decimals: 0}
note: 'Top: level curves of f and the constraint in red. The yellow arrow is ∇f, and the green one is ∇g. Bottom: the value of f as the point goes round the constraint. Move t to a peak or a valley of the lower curve: the level curve there touches the constraint without crossing it, and the two arrows line up.'
```

### Three variables and a surface

With $g(x, y, z) = k$ a surface, the same condition $\nabla f = \lambda\,\nabla g$ holds, and there are four equations in $x$, $y$, $z$, $\lambda$.

::::example[The largest product under a budget]
Maximize $f(x, y, z) = xyz$ for positive $x$, $y$, $z$ subject to $x + 2y + 3z = 18$.

:::solution
$yz = \lambda$, $xz = 2\lambda$, $xy = 3\lambda$. Multiply them by $x$, $y$ and $z$ respectively: each left side is then $xyz$, so

$$
\lambda x = 2\lambda y = 3\lambda z .
$$

Since $\lambda = yz > 0$, cancel it: $x = 2y = 3z$. The constraint becomes $3x = 18$, so $x = 6$, $y = 3$, $z = 2$, with $f = 36$ and $\lambda = 6$.

$f$ is $0$ on the edge of the region $x, y, z \ge 0$ of the plane and positive inside, so this one point is the maximum.
:::
::::

::::example[Nearest and farthest points of a sphere]
Find the points of the sphere $x^2 + y^2 + z^2 = 9$ closest to and farthest from $(4, 2, -4)$.

:::solution
Use the square of the distance, $f = (x - 4)^2 + (y - 2)^2 + (z + 4)^2$. The system is

$$
x - 4 = \lambda x , \qquad y - 2 = \lambda y , \qquad z + 4 = \lambda z .
$$

$\lambda = 1$ is impossible (the first equation would read $-4 = 0$), so $x = \frac{4}{1 - \lambda}$, $y = \frac{2}{1 - \lambda}$, $z = \frac{-4}{1 - \lambda}$. The constraint gives $\frac{36}{(1 - \lambda)^2} = 9$, so $1 - \lambda = \pm 2$.

The points are $(2, 1, -2)$ with $f = 9$ and $(-2, -1, 2)$ with $f = 81$. So the closest point is at distance $3$ and the farthest at distance $9$. Both lie on the line through the origin and the given point, as the geometry demands.
:::
::::

### Two constraints

Two constraints $g = k$ and $h = c$ together cut out a curve in space. At an extremum, $\nabla f$ is
perpendicular to that curve, and so are $\nabla g$ and $\nabla h$. So $\nabla f$ lies in the plane of
the two gradients.

:::proposition[Lagrange with two constraints]
At an extreme value of $f$ on $g = k$, $h = c$, where $\nabla g$ and $\nabla h$ are not parallel,

$$
\nabla f = \lambda\,\nabla g + \mu\,\nabla h .
$$
:::

::::example[The highest point of a tilted ellipse]
The plane $x + y + z = 1$ cuts the cylinder $x^2 + y^2 = 8$ in an ellipse. Find its highest and lowest points.

:::solution
Extremize $f = z$ with $g = x^2 + y^2$ and $h = x + y + z$:

$$
0 = 2\lambda x + \mu , \qquad 0 = 2\lambda y + \mu , \qquad 1 = \mu .
$$

So $2\lambda x = 2\lambda y = -1$, which forces $\lambda \ne 0$ and then $x = y$. The cylinder gives
$2x^2 = 8$, so $x = y = \pm 2$, and the plane gives $z = 1 - x - y$.

The points are $(2, 2, -3)$ and $(-2, -2, 5)$. The highest point has $z = 5$ and the lowest $z = -3$.
:::
::::

### Using Lagrange on a boundary

Lagrange multipliers replace the parametrization in step 2 of the region method.

::::example[On a disk]
Find the absolute extrema of $f(x, y) = x^2 + 2y^2 - 2x$ on the disk $x^2 + y^2 \le 4$.

:::solution
Interior: $f_x = 2x - 2 = 0$, $f_y = 4y = 0$ give $(1, 0)$, inside the disk, with $f = -1$.

Boundary, $x^2 + y^2 = 4$: the system is $2x - 2 = 2\lambda x$, $4y = 2\lambda y$. The second reads $2y(2 - \lambda) = 0$.

- If $y = 0$: $x = \pm 2$, with $f(2, 0) = 0$ and $f(-2, 0) = 8$.
- If $\lambda = 2$: $2x - 2 = 4x$, so $x = -1$ and $y = \pm\sqrt{3}$, with $f = 1 + 6 + 2 = 9$.

The values are $-1, 0, 8, 9$. The absolute maximum is $9$ at $(-1, \pm\sqrt{3})$ and the absolute minimum is $-1$ at $(1, 0)$.
:::
::::

:::caution[Cases, and what the answer is]
Dividing $2y(2 - \lambda) = 0$ by $y$ would lose the points with $y = 0$, and dividing by $2 - \lambda$
would lose the others. And $\lambda$ is not the answer: the answer is the points and the values of $f$ there.
:::

:::caution[The condition on the gradient of g]
The theorem needs $\nabla g \ne \mathbf{0}$. To minimize $f = x$ on the cusp curve $y^2 = x^3$: the
minimum is at $(0, 0)$, but $\nabla g = \mathbf{0}$ there and the system
$1 = -3\lambda x^2$, $0 = 2\lambda y$ has no solution on the curve. A point where the constraint has
no tangent must be checked by hand.
:::

:::remark
$\lambda$ has a meaning: it is the rate at which the optimal value changes as the constraint level
$k$ changes. In the budget example, the maximum of $xyz$ on $x + 2y + 3z = k$ is $\frac{k^3}{162}$,
whose derivative at $k = 18$ is $6$, which is $\lambda$. In economics this is a shadow price.
:::

```python
# The disk example: solve the Lagrange system, then compare values.
from sympy import symbols, solve

x, y, lam = symbols('x y lam', real=True)
f = x**2 + 2*y**2 - 2*x
system = [2*x - 2 - 2*lam*x, 4*y - 2*lam*y, x**2 + y**2 - 4]
for s in solve(system, [x, y, lam], dict=True):
    print(s[x], s[y], f.subs(s))
print('inside:', f.subs({x: 1, y: 0}))     # -1
```

:::insight
The candidates for an extremum come from three places: flat points inside, touching points on a
constraint, and corners. The method does nothing more than list them; the comparison of values
gives the answer.
:::

:::equations{#lagrange}
- *One constraint*: $\nabla f = \lambda\,\nabla g$, with $g = k$.
- *Two constraints*: $\nabla f = \lambda\,\nabla g + \mu\,\nabla h$, with $g = k$, $h = c$.
:::

## Further reading

- [Wikipedia — Second partial derivative test](https://en.wikipedia.org/wiki/Second_partial_derivative_test) — the two-variable test and its matrix form.
- [Wikipedia — Hessian matrix](https://en.wikipedia.org/wiki/Hessian_matrix) — definiteness and critical points in any dimension.
- [Wikipedia — Lagrange multiplier](https://en.wikipedia.org/wiki/Lagrange_multiplier) — the method, its proof, and the meaning of the multiplier.
- [Wikipedia — Extreme value theorem](https://en.wikipedia.org/wiki/Extreme_value_theorem) — why closed and bounded matter.
