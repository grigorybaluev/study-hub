---
title: The big picture
---

## One idea, three scenes

The whole course has one habit of thought: **describe an object in the form that makes the question
easy, then do calculus on it.** The objects change, and the calculus stays the single-variable
calculus already known.

- **Curves in the plane** (weeks 1–4): the same curve can be Cartesian, parametric or polar, or a conic in standard form. Slopes, areas and lengths are integrals and derivatives in the parameter.
- **Geometry in space** (weeks 4–7): vectors, with two products. Lines and planes are a point plus a direction or a normal. Quadric surfaces are read from signs and slices.
- **Several variables** (weeks 7–12): a function with one input and a vector output draws a curve in space, and a function with several inputs and one output draws a surface. Partial derivatives and the gradient carry all the rates, tangent planes and extrema.

:::insight[The pictures to keep in mind]
- **A parameter is a clock.** A curve is a point moving in time, so $\frac{dy}{dx}$ is a ratio of two rates.
- **Normals and directions swap through the cross product.** Two directions give a normal, and two normals give a direction.
- **A surface is a stack of slices.** Traces of a quadric and level curves of $f(x, y)$ are the same idea.
- **The gradient points uphill.** It crosses the level curves at right angles, and it is long where they are close.
- **At an extreme point, nothing can improve.** So inside the region the gradient is $\mathbf{0}$, and on a constraint it has nothing left along the constraint.
:::

The **Map** tab has three maps, one per scene: the forms of a plane curve, lines and planes in space,
and functions of several variables. Each arrow there is one operation, with its steps and its trap.

## Parametric curves

Weeks 1–2 · [Parametric curves](/unit/MAST218/parametric-curves), [Calculus on parametric curves](/unit/MAST218/calculus-on-parametric-curves)

$x = f(t)$, $y = g(t)$ traces a curve with a direction. Eliminate $t$ for the shape, then keep $t$ for
the calculus:

$$\frac{dy}{dx} = \frac{y'(t)}{x'(t)}, \qquad \frac{d^2y}{dx^2} = \frac{\frac{d}{dt}\left(\frac{dy}{dx}\right)}{x'(t)}, \qquad A = \left|\int y\,x'(t)\,dt\right|, \qquad L = \int \sqrt{x'^2 + y'^2}\,dt.$$

The second derivative is the classic trap: it is a derivative of the slope, not a ratio of second
derivatives.

## Polar coordinates and conic sections

Weeks 3–4 · [Polar coordinates](/unit/MAST218/polar-coordinates), [Polar areas and curves](/unit/MAST218/polar-areas-and-curves), [Conic sections](/unit/MAST218/conic-sections)

Polar form replaces $x$ and $y$ with a distance and an angle. Circles through the pole, cardioids,
limaçons and roses are simple there. Areas use sectors, $A = \frac12\int r^2\,d\theta$, and the work is
in the limits. Sketch first.

Conics come in three forms. The **standard form** shows the centre and the numbers $a$, $b$, $c$. The
**general form** turns into it by completing squares. The **polar form** $r = \frac{ed}{1 \pm e\cos\theta}$
puts a focus at the pole, and $e$ names the curve.

| | Ellipse | Hyperbola | Parabola |
|---|---|---|---|
| defined by | sum of distances to two foci | difference of distances to two foci | equal distance to a focus and a directrix |
| equation | $\frac{x^2}{a^2} + \frac{y^2}{b^2} = 1$ | $\frac{x^2}{a^2} - \frac{y^2}{b^2} = 1$ | $y^2 = 4px$ |
| $c$ | $c^2 = a^2 - b^2$ | $c^2 = a^2 + b^2$ | focus at distance $p$ |
| eccentricity | $e < 1$ | $e > 1$ | $e = 1$ |

## Vectors in space

Weeks 4–5 · [Coordinates and vectors](/unit/MAST218/vectors-3d), [Dot and cross product](/unit/MAST218/dot-cross-product)

A vector is a length and a direction. The **dot product** is a number that measures alignment:
$\mathbf{a} \cdot \mathbf{b} = |\mathbf{a}|\,|\mathbf{b}|\cos\theta$. It gives angles, tests
perpendicularity and gives projections. The **cross product** is a vector perpendicular to both factors
with length $|\mathbf{a}|\,|\mathbf{b}|\sin\theta$, the area of the parallelogram.

## Lines, planes and quadric surfaces

Weeks 5, 7 · [Lines, planes and quadric surfaces](/unit/MAST218/lines-planes-surfaces)

A line is $\mathbf{r} = \mathbf{r}_0 + t\mathbf{v}$. A plane is $\mathbf{n} \cdot (\mathbf{r} - \mathbf{r}_0) = 0$.
Most problems ask for the missing vector, and the cross product produces it. Position questions are
substitutions, and distances are projections onto a normal. In space, two lines can also be
**skew**: not parallel and not meeting.

Quadrics are the surfaces of degree two. A missing variable means a cylinder. A linear variable means a
paraboloid. All squares with right side $1$ means an ellipsoid or a hyperboloid, depending on the
number of minus signs. All squares with right side $0$ means a cone.

## Vector functions and space curves

Weeks 7–8 · [Vector functions](/unit/MAST218/vector-functions), [Motion, arc length and curvature](/unit/MAST218/motion-arc-length-curvature)

$\mathbf{r}(t) = \langle f(t), g(t), h(t) \rangle$ is a parametric curve in space, and all calculus is done
component by component. Then $\mathbf{r}'$ is the velocity, tangent to the path, $|\mathbf{r}'|$ the speed,
and $\mathbf{r}''$ the acceleration. Adding up the speed gives the length. Curvature is the turning per
unit of distance:

$$L = \int_a^b |\mathbf{r}'(t)|\,dt, \qquad \kappa = \frac{|\mathbf{r}' \times \mathbf{r}''|}{|\mathbf{r}'|^3}, \qquad \mathbf{a} = v'\,\mathbf{T} + \kappa v^2\,\mathbf{N}.$$

## Functions of several variables

Week 9 · [Functions of several variables, limits and continuity](/unit/MAST218/multivariable-functions-limits)

$z = f(x, y)$ has a domain that is a region, a graph that is a surface, and level curves that make a
contour map. Limits are the one place where something truly new happens: a point can be approached
along infinitely many paths. Two paths with different values show that no limit exists. A proof that a limit
exists needs an inequality.

## Partial derivatives and the chain rule

Weeks 9–10 · [Partial derivatives, tangent planes and the chain rule](/unit/MAST218/partial-derivatives-chain-rule)

Freeze all variables but one and differentiate. The partials at a point are the slopes of the tangent
plane, $z = f(a, b) + f_x(a, b)(x - a) + f_y(a, b)(y - b)$, which is also the linear approximation. The
chain rule adds one product for each path through the tree. Implicit differentiation is a consequence:
$\frac{\partial z}{\partial x} = -\frac{F_x}{F_z}$.

## The gradient

Week 11 · [Directional derivatives and the gradient](/unit/MAST218/gradient-directional-derivatives)

$\nabla f = \langle f_x, f_y \rangle$ packs every first-order fact. The rate in the direction of a unit
vector is $D_{\mathbf{u}}f = \nabla f \cdot \mathbf{u}$, the fastest increase is along $\nabla f$ at the rate
$|\nabla f|$, and $\nabla f$ is perpendicular to level sets. That last fact gives tangent planes to
surfaces $F(x, y, z) = k$, with normal $\nabla F$.

## Optimisation

Weeks 11–12 · [Optimisation and Lagrange multipliers](/unit/MAST218/optimization-lagrange)

Critical points solve $\nabla f = \mathbf{0}$, and $D = f_{xx}f_{yy} - f_{xy}^2$ sorts them. On a closed
bounded region, compare the critical values with the boundary. On a constraint $g = k$, solve
$\nabla f = \lambda\,\nabla g$ with $g = k$ and compare the values of $f$.

## How it fits together

:::insight[Four ideas hold the course together]
- **One variable at a time.** Components for vector functions, partials for functions of several variables: both reduce to single-variable calculus.
- **Perpendicular is the workhorse.** A dot product of $0$ tests it, a cross product builds it, and gradients are perpendicular to level sets.
- **Linear pieces describe smooth objects.** Tangent lines to curves, tangent planes to surfaces, and the linear approximation are one idea.
- **Extremes come from a short list.** Flat points, touching points, corners: list them, then compare the values.
:::

What you can solve by the end:

- sketch and differentiate parametric and polar curves; find areas and lengths;
- put a conic into standard form or read a polar conic;
- compute with vectors: angles, projections, cross products, areas;
- build lines and planes; decide relative position; find distances and angles;
- classify quadric surfaces and describe their traces;
- differentiate and integrate vector functions; find tangents, lengths, curvature and components of acceleration;
- find domains, level curves and limits of functions of two variables;
- compute partials, tangent planes, differentials and chain rules;
- use the gradient for rates, directions and tangent planes;
- classify critical points, and find absolute and constrained extrema.
