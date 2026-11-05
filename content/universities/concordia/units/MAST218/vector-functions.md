---
title: Vector functions and space curves
order: 9
status: detailed
weeks: [7]
introduces: [vector-function]
requires:
  - {concept: vector, strength: hard}
  - {concept: parametric-curve, strength: hard}
  - {concept: derivative, strength: hard}
reinforces: []
---

So far a curve has been a pair of parametric equations in the plane. A vector function does the same
thing in any dimension: one number $t$ goes in and a vector comes out. Drawn from the origin, those
vectors point at a moving point, and the point traces a curve in space. Limits, derivatives and
integrals of a vector function are taken one component at a time, so the calculus of one variable
applies unchanged. What is new is the geometry: the derivative is a vector tangent to the curve.

## Vector functions

### Definition

:::definition[Vector function]
A **vector-valued function**, or **vector function**, is a function $\mathbf{r}: I \to V_n$ with
$I \subseteq \mathbb{R}$: its domain is a set of real numbers and its range is a set of vectors. For
$n = 3$,

$$
\mathbf{r}(t) = \langle f(t), g(t), h(t) \rangle = f(t)\,\mathbf{i} + g(t)\,\mathbf{j} + h(t)\,\mathbf{k} ,
$$

and for $n = 2$, $\mathbf{r}(t) = \langle f(t), g(t) \rangle = f(t)\,\mathbf{i} + g(t)\,\mathbf{j}$.
The real-valued functions $f, g, h$ are the **component functions** of $\mathbf{r}$.
:::

The domain of $\mathbf{r}$ is the set of all $t$ for which every component is defined, so it is the
intersection of the domains of the components.

::::example[The domain of a vector function]
Find the domain of $\mathbf{r}(t) = \left\langle \sqrt{4 - t},\ \ln(t + 1),\ \dfrac{1}{t - 1} \right\rangle$.

:::solution
The square root needs $t \le 4$, the logarithm needs $t > -1$, and the fraction needs $t \ne 1$.
All three together:

$$
(-1, 1) \cup (1, 4] .
$$
:::
::::

### Limits and continuity

:::definition[Limit of a vector function]
If $\mathbf{r}(t) = \langle f(t), g(t), h(t) \rangle$, then

$$
\lim_{t \to a} \mathbf{r}(t) = \left\langle \lim_{t \to a} f(t),\ \lim_{t \to a} g(t),\ \lim_{t \to a} h(t) \right\rangle ,
$$

provided the three limits on the right exist.
:::

Geometrically, $\lim_{t \to a} \mathbf{r}(t) = \mathbf{L}$ with $\mathbf{L} \ne \mathbf{0}$ means that
the length and the direction of $\mathbf{r}(t)$ approach the length and the direction of $\mathbf{L}$
as $t \to a$.

::::example[A limit, component by component]
Find $\displaystyle\lim_{t \to 0} \left\langle \frac{\sin 3t}{t},\ \frac{e^{2t} - 1}{t},\ t^2 + 1 \right\rangle$.

:::solution
Take each limit separately. The first two are of the form $\frac00$, and l'Hôpital's rule gives
$\lim_{t \to 0} 3\cos 3t = 3$ and $\lim_{t \to 0} 2e^{2t} = 2$. The third is $1$. So the limit is
$\langle 3, 2, 1 \rangle$.
:::
::::

:::definition[Continuous vector function]
$\mathbf{r}$ is **continuous** at $a$ if $\lim_{t \to a} \mathbf{r}(t) = \mathbf{r}(a)$.
:::

Written out in components, this says $\lim_{t \to a} f(t) = f(a)$, $\lim_{t \to a} g(t) = g(a)$ and
$\lim_{t \to a} h(t) = h(a)$. So $\mathbf{r}$ is continuous at $a$ exactly when $f$, $g$ and $h$ all are.

## Space curves

### The curve traced by a vector function

:::definition[Space curve]
Let $\mathbf{r}(t) = \langle f(t), g(t), h(t) \rangle$ be continuous on $I$. The set of points

$$
C = \{ (f(t), g(t), h(t)) : t \in I \}
$$

is a **space curve**, and $x = f(t)$, $y = g(t)$, $z = h(t)$ are its **parametric equations**, with
parameter $t$.
:::

So $\mathbf{r}(t) = \overrightarrow{OP}$ is the **position vector** of the point
$P(f(t), g(t), h(t))$ on $C$. As $t$ runs through $I$, the tip of $\mathbf{r}(t)$ moves along the
curve, and the direction of increasing $t$ gives the curve an orientation, as for plane curves.

The first examples are already familiar.

:::proposition[Line and segment as vector functions]
The line through $P_0$ in the direction $\mathbf{v} = \langle a, b, c \rangle$ is
$\mathbf{r}(t) = \mathbf{r}_0 + t\mathbf{v} = \langle x_0 + ta,\ y_0 + tb,\ z_0 + tc \rangle$, $t \in \mathbb{R}$.

The segment from $P_0$ to $P_1$ is $\mathbf{r}(t) = (1 - t)\,\mathbf{r}_0 + t\,\mathbf{r}_1$,
$0 \le t \le 1$, that is, $x = (1 - t)x_0 + tx_1$, $y = (1 - t)y_0 + ty_1$, $z = (1 - t)z_0 + tz_1$.
:::

### Curves on surfaces

To see the shape of a space curve, look for a surface that contains it. Any equation in $x$, $y$, $z$
that the components satisfy for every $t$ is such a surface.

::::example[A helix]
Describe the curve $\mathbf{r}(t) = \langle 2\cos t,\ 2\sin t,\ t \rangle$.

:::solution
The first two components satisfy $x^2 + y^2 = 4\cos^2 t + 4\sin^2 t = 4$ for every $t$, so the curve
lies on the circular cylinder of radius $2$ around the $z$-axis. As $t$ grows, the point $(x, y)$ goes
round the circle counterclockwise while $z = t$ climbs steadily. The curve is a spiral on the
cylinder, a **helix**, and each full turn raises it by $2\pi$.
:::
::::

::::example[A spiral on a cone]
Show that $\mathbf{r}(t) = \langle t\cos t,\ t\sin t,\ t \rangle$, $t \ge 0$, lies on a cone.

:::solution
$x^2 + y^2 = t^2\cos^2 t + t^2\sin^2 t = t^2 = z^2$, so every point lies on the circular cone
$x^2 + y^2 = z^2$. The radius of the spiral grows with its height.
:::
::::

In the other direction, a curve often comes as the intersection of two surfaces, and the work is to
parametrize it.

:::steps[Parametrizing the intersection of two surfaces]
1. Start from the surface that involves only two variables, usually a cylinder.
2. Parametrize that curve: $x^2 + y^2 = r^2$ gives $x = r\cos t$, $y = r\sin t$; a graph $y = g(x)$ gives $x = t$, $y = g(t)$.
3. Solve the other equation for the remaining variable in terms of $t$.
4. Check by substituting back into both equations.
:::

::::example[A cylinder cut by a plane]
Find a vector function for the curve in which the cylinder $x^2 + y^2 = 4$ meets the plane $y + z = 3$.

:::solution
The cylinder gives $x = 2\cos t$, $y = 2\sin t$, and the plane gives $z = 3 - y = 3 - 2\sin t$:

$$
\mathbf{r}(t) = \langle 2\cos t,\ 2\sin t,\ 3 - 2\sin t \rangle , \qquad 0 \le t \le 2\pi .
$$

It is a closed curve, an ellipse tilted with the plane. Check: $x^2 + y^2 = 4$ and $y + z = 3$ for
every $t$.
:::
::::

::::example[A paraboloid cut by a plane]
Find a vector function for the curve in which $z = x^2 + y^2$ meets the plane $y = 2x$.

:::solution
The plane is a graph over the $x$-axis, so take $x = t$, $y = 2t$. Then $z = t^2 + 4t^2 = 5t^2$:

$$
\mathbf{r}(t) = \langle t,\ 2t,\ 5t^2 \rangle , \qquad t \in \mathbb{R} ,
$$

a parabola in the plane $y = 2x$.
:::
::::

:::caution[A parametrization is not unique]
The same curve has many vector functions. $\langle 2\cos 3t, 2\sin 3t, 3 - 2\sin 3t \rangle$ traces the
ellipse above three times faster, and $\langle 2\sin t, 2\cos t, 3 - 2\cos t \rangle$ traces it the other
way. Any of them is correct unless a direction or a start is prescribed.
:::

## The derivative

### Definition and computation

:::definition[Derivative of a vector function]
The **derivative** of $\mathbf{r}$ is

$$
\mathbf{r}'(t) = \frac{d\mathbf{r}}{dt} = \lim_{h \to 0} \frac{\mathbf{r}(t + h) - \mathbf{r}(t)}{h} ,
$$

provided the limit exists.
:::

The numerator is a vector from $P(t)$ to the nearby point $P(t + h)$, along a secant of the curve.
Dividing by $h$ rescales it, and as $h \to 0$ the secant turns into the tangent.

::::theorem[A vector function is differentiated component by component]
If $\mathbf{r}(t) = \langle f(t), g(t), h(t) \rangle$ with $f, g, h$ differentiable, then

$$
\mathbf{r}'(t) = \langle f'(t), g'(t), h'(t) \rangle = f'(t)\,\mathbf{i} + g'(t)\,\mathbf{j} + h'(t)\,\mathbf{k} .
$$

:::proof
Subtracting and dividing go component by component, so the first component of $\frac{\mathbf{r}(t + u) - \mathbf{r}(t)}{u}$ is

$$
\frac{f(t + u) - f(t)}{u} \to f'(t) \quad\text{as } u \to 0 ,
$$

and the other two behave the same way. A limit of a vector function is taken component by component, which gives the formula.
:::
::::

Differentiating again gives the **second derivative**,
$\mathbf{r}''(t) = \dfrac{d^2\mathbf{r}}{dt^2} = \langle f''(t), g''(t), h''(t) \rangle$.

::::example[First and second derivatives]
Find $\mathbf{r}'(t)$ and $\mathbf{r}''(t)$ for $\mathbf{r}(t) = \langle t^3,\ e^{2t},\ t\sin t \rangle$.

:::solution
Each component is an ordinary derivative, the third by the product rule:

$$
\mathbf{r}'(t) = \langle 3t^2,\ 2e^{2t},\ \sin t + t\cos t \rangle ,
\qquad
\mathbf{r}''(t) = \langle 6t,\ 4e^{2t},\ 2\cos t - t\sin t \rangle .
$$
:::
::::

### Tangent vectors and tangent lines

:::definition[Tangent vector and tangent line]
Let $C$ be the curve of $\mathbf{r}(t)$. If $\mathbf{r}'(t)$ exists and is not $\mathbf{0}$, it is a
**tangent vector** to $C$ at $P(t)$. The **tangent line** to $C$ at $P(t_0)$ is the line through
$P(t_0)$ parallel to $\mathbf{r}'(t_0)$:

$$
\mathbf{L}(s) = \mathbf{r}(t_0) + s\,\mathbf{r}'(t_0) , \qquad s \in \mathbb{R} .
$$

The **unit tangent vector** is $\mathbf{T}(t) = \dfrac{\mathbf{r}'(t)}{|\mathbf{r}'(t)|}$.
:::

In parametric form the tangent line is $x = x_0 + s f'(t_0)$, $y = y_0 + s g'(t_0)$,
$z = z_0 + s h'(t_0)$. The new letter $s$ is there because $t_0$ is a fixed number by now, and the
line needs a parameter of its own.

:::definition[Smooth curve]
A curve is **smooth** on an interval if $\mathbf{r}'$ is continuous there and $\mathbf{r}'(t) \ne \mathbf{0}$.
It has no corners or cusps there, and it has a tangent line at every point.
:::

::::example[A tangent line in space]
Find the unit tangent vector and the tangent line of $\mathbf{r}(t) = \langle t^2 + 1,\ 4\sqrt{t},\ \ln t \rangle$ at $t = 1$.

:::solution
The point is $\mathbf{r}(1) = \langle 2, 4, 0 \rangle$. Differentiating,

$$
\mathbf{r}'(t) = \left\langle 2t,\ \frac{2}{\sqrt{t}},\ \frac1t \right\rangle ,
\qquad
\mathbf{r}'(1) = \langle 2, 2, 1 \rangle ,
\qquad
|\mathbf{r}'(1)| = \sqrt{4 + 4 + 1} = 3 .
$$

So $\mathbf{T}(1) = \left\langle \frac23, \frac23, \frac13 \right\rangle$, and the tangent line is

$$
x = 2 + 2s \qquad y = 4 + 2s \qquad z = s .
$$
:::
::::

::::example[The tangent to a helix]
Find the tangent line of $\mathbf{r}(t) = \langle 2\cos t, 2\sin t, t \rangle$ at $t = \frac{\pi}{2}$.

:::solution
$\mathbf{r}\left(\frac{\pi}{2}\right) = \left\langle 0, 2, \frac{\pi}{2} \right\rangle$ and
$\mathbf{r}'(t) = \langle -2\sin t, 2\cos t, 1 \rangle$, so $\mathbf{r}'\left(\frac{\pi}{2}\right) = \langle -2, 0, 1 \rangle$.
The tangent line is

$$
x = -2s \qquad y = 2 \qquad z = \frac{\pi}{2} + s .
$$

The tangent has the same length $\sqrt{5}$ at every $t$: the helix is climbed at constant speed.
:::
::::

```sim
id: space-curve-tangent
controls:
  - {id: curve, label: "Curve (0: helix, 1: spiral on a cone, 2: twisted cubic, 3: ellipse on a cylinder)", min: 0, max: 3, step: 1, default: 0, decimals: 0}
  - {id: u, label: Position along the curve, min: 0, max: 1, step: 0.005, default: 0.125, decimals: 3}
note: 'The position vector r(t) runs from the origin to the point; the yellow arrow is r′(t), drawn from the point along the tangent line. The curves are those of this unit, and the twisted cubic is r(t) = ⟨t, t², t³⟩. Watch the length of r′(t) in the title: constant on the helix, changing on the others. Drag the plot to turn it.'
```

```python
# The tangent line of the first example, with sympy.
from sympy import symbols, Matrix, sqrt, log

t, s = symbols('t s', positive=True)
r = Matrix([t**2 + 1, 4*sqrt(t), log(t)])
v = r.diff(t).subs(t, 1)
print(v.T, v.norm())                 # Matrix([[2, 2, 1]]) 3
print((r.subs(t, 1) + s*v).T)        # Matrix([[2*s + 2, 2*s + 4, s]])
```

### The angle between two curves

:::definition[Angle of intersection of two curves]
The **angle of intersection** of two curves at a common point is the angle between their tangent
vectors there.
:::

:::steps[The angle where two curves meet]
1. Give the curves different parameters, $\mathbf{r}_1(t)$ and $\mathbf{r}_2(s)$, and solve $\mathbf{r}_1(t) = \mathbf{r}_2(s)$.
2. Differentiate each curve at its own parameter value.
3. Use $\cos\theta = \dfrac{\mathbf{r}_1'(t) \cdot \mathbf{r}_2'(s)}{|\mathbf{r}_1'(t)|\,|\mathbf{r}_2'(s)|}$.
:::

::::example[Two curves crossing]
Show that $\mathbf{r}_1(t) = \langle 1 + t, t^2, t^3 \rangle$ and $\mathbf{r}_2(s) = \langle 2s, s^2, 2 - s \rangle$ meet at one point, and find the angle there.

:::solution
The middle components give $t^2 = s^2$, so $s = t$ or $s = -t$.

If $s = t$, the first components give $1 + t = 2t$, so $t = 1$; the third gives $1 = 2 - 1$, which
holds. If $s = -t$, the first gives $1 + t = -2t$, so $t = -\frac13$ and $s = \frac13$, but the third
would need $-\frac{1}{27} = \frac53$. So the only common point is $(2, 1, 1)$, at $t = s = 1$.

The tangents there are $\mathbf{r}_1'(1) = \langle 1, 2, 3 \rangle$ and $\mathbf{r}_2'(1) = \langle 2, 2, -1 \rangle$, so

$$
\cos\theta = \frac{2 + 4 - 3}{\sqrt{14} \cdot 3} = \frac{1}{\sqrt{14}} , \qquad \theta \approx 74.5° .
$$
:::
::::

:::caution[Two curves, two parameters]
Solving $\mathbf{r}_1(t) = \mathbf{r}_2(t)$ with one letter asks whether two moving points collide at
the same time. Curves can cross at different times, as two roads cross, so the question of whether
they intersect needs $t$ and $s$.
:::

### Differentiation rules

The rules of one-variable calculus carry over, with one rule for each kind of product.

::::theorem[Differentiation rules for vector functions]
Let $\mathbf{r}(t)$, $\mathbf{s}(t)$ be differentiable vector functions, $c$ a constant and $a(t)$ a
differentiable real-valued function. Then

1. $\dfrac{d}{dt}[\mathbf{r}(t) + \mathbf{s}(t)] = \mathbf{r}'(t) + \mathbf{s}'(t)$;
2. $\dfrac{d}{dt}[c\,\mathbf{r}(t)] = c\,\mathbf{r}'(t)$;
3. $\dfrac{d}{dt}[a(t)\,\mathbf{r}(t)] = a'(t)\,\mathbf{r}(t) + a(t)\,\mathbf{r}'(t)$;
4. $\dfrac{d}{dt}[\mathbf{r}(t) \cdot \mathbf{s}(t)] = \mathbf{r}'(t) \cdot \mathbf{s}(t) + \mathbf{r}(t) \cdot \mathbf{s}'(t)$;
5. $\dfrac{d}{dt}[\mathbf{r}(t) \times \mathbf{s}(t)] = \mathbf{r}'(t) \times \mathbf{s}(t) + \mathbf{r}(t) \times \mathbf{s}'(t)$;
6. $\dfrac{d}{dt}[\mathbf{r}(a(t))] = \mathbf{r}'(a(t))\,a'(t)$ (chain rule).

:::proof
Each follows from the matching rule for numbers, applied in components. For rule 4, write
$\mathbf{r} = \langle r_1, r_2, r_3 \rangle$ and $\mathbf{s} = \langle s_1, s_2, s_3 \rangle$. Then

$$
\frac{d}{dt}\sum_{i=1}^3 r_is_i = \sum_{i=1}^3 (r_i's_i + r_is_i') = \mathbf{r}' \cdot \mathbf{s} + \mathbf{r} \cdot \mathbf{s}' .
$$

Rule 5 goes the same way, with each component of the cross product a difference of two products.
:::
::::

::::example[The product rules at work]
For $\mathbf{r}(t) = \langle t, t^2, 1 \rangle$ and $\mathbf{s}(t) = \langle 1, t, t^3 \rangle$, find the derivatives of $\mathbf{r} \cdot \mathbf{s}$ and $\mathbf{r} \times \mathbf{s}$.

:::solution
Directly, $\mathbf{r} \cdot \mathbf{s} = t + t^3 + t^3 = t + 2t^3$, with derivative $1 + 6t^2$. By rule 4,
with $\mathbf{r}' = \langle 1, 2t, 0 \rangle$ and $\mathbf{s}' = \langle 0, 1, 3t^2 \rangle$:

$$
\mathbf{r}' \cdot \mathbf{s} + \mathbf{r} \cdot \mathbf{s}' = (1 + 2t^2) + (t^2 + 3t^2) = 1 + 6t^2 .
$$

For the cross product,

$$
\mathbf{r} \times \mathbf{s} = \langle t^5 - t,\ 1 - t^4,\ 0 \rangle ,
\qquad
\frac{d}{dt}(\mathbf{r} \times \mathbf{s}) = \langle 5t^4 - 1,\ -4t^3,\ 0 \rangle ,
$$

and rule 5 gives the same vector.
:::
::::

:::caution[Keep the order in rule 5]
The cross product is not commutative, so the factors in rule 5 stay in their places: the first factor
stays first in both terms. Writing $\mathbf{s} \times \mathbf{r}'$ for $\mathbf{r}' \times \mathbf{s}$ flips a sign.
:::

The dot product rule gives a result used again and again: a vector of constant length is always
perpendicular to its own derivative.

::::theorem[Constant length means perpendicular to the derivative]
If $|\mathbf{r}(t)| = c$ for all $t$, then $\mathbf{r}(t) \cdot \mathbf{r}'(t) = 0$ for all $t$.

:::proof
$\mathbf{r}(t) \cdot \mathbf{r}(t) = |\mathbf{r}(t)|^2 = c^2$ is constant, so its derivative is $0$. By
rule 4, that derivative is $2\,\mathbf{r}(t) \cdot \mathbf{r}'(t)$.
:::
::::

Geometrically, a curve on a sphere centred at the origin has its tangent perpendicular to the radius
at every point. For instance $\mathbf{r}(t) = \langle 3\cos t, 3\sin t, 4 \rangle$ has
$|\mathbf{r}(t)| = 5$, and $\mathbf{r} \cdot \mathbf{r}' = -9\cos t\sin t + 9\sin t\cos t + 0 = 0$.
The next unit applies the theorem to $\mathbf{T}(t)$, which has length $1$.

:::insight
The derivative of a vector function is computed like three ordinary derivatives and read as one
geometric object: a vector along the tangent. The product rules need no new ideas, only care with the
order in a cross product.
:::

:::equations{#vector-derivative}
- *Derivative*: $\mathbf{r}'(t) = \langle f'(t), g'(t), h'(t) \rangle$.
- *Unit tangent*: $\mathbf{T}(t) = \dfrac{\mathbf{r}'(t)}{|\mathbf{r}'(t)|}$.
- *Tangent line at $t_0$*: $\mathbf{L}(s) = \mathbf{r}(t_0) + s\,\mathbf{r}'(t_0)$.
- *Dot product rule*: $(\mathbf{r} \cdot \mathbf{s})' = \mathbf{r}' \cdot \mathbf{s} + \mathbf{r} \cdot \mathbf{s}'$.
- *Cross product rule*: $(\mathbf{r} \times \mathbf{s})' = \mathbf{r}' \times \mathbf{s} + \mathbf{r} \times \mathbf{s}'$.
- *Chain rule*: $\frac{d}{dt}\mathbf{r}(a(t)) = \mathbf{r}'(a(t))\,a'(t)$.
:::

## Integrals

### Definite and indefinite integrals

:::definition[Definite integral of a vector function]
The definite integral of a continuous vector function $\mathbf{r}(t) = \langle f(t), g(t), h(t) \rangle$ is

$$
\int_a^b \mathbf{r}(t)\,dt = \left\langle \int_a^b f(t)\,dt,\ \int_a^b g(t)\,dt,\ \int_a^b h(t)\,dt \right\rangle .
$$
:::

:::theorem[Fundamental theorem of calculus for vector functions]
If $\mathbf{r}$ is continuous and $\mathbf{R}$ is an antiderivative of $\mathbf{r}$, that is,
$\mathbf{R}'(t) = \mathbf{r}(t)$, then

$$
\int_a^b \mathbf{r}(t)\,dt = \mathbf{R}(t)\Big|_a^b = \mathbf{R}(b) - \mathbf{R}(a) .
$$
:::

The indefinite integral is the family of all antiderivatives, $\int \mathbf{r}(t)\,dt = \mathbf{R}(t) + \mathbf{C}$,
where the constant $\mathbf{C}$ is a **vector**: one constant per component.

::::example[A definite integral]
Evaluate $\displaystyle\int_0^1 \langle 2t,\ 3t^2,\ \cos \pi t \rangle\,dt$.

:::solution
Integrate each component:

$$
\left\langle t^2,\ t^3,\ \frac{\sin \pi t}{\pi} \right\rangle \Big|_0^1 = \langle 1, 1, 0 \rangle .
$$
:::
::::

::::example[Recovering a vector function from its derivative]
Find $\mathbf{r}(t)$ if $\mathbf{r}'(t) = \langle 2t, \cos t, e^{-t} \rangle$ and $\mathbf{r}(0) = \langle 1, 0, 2 \rangle$.

:::solution
Integrating, $\mathbf{r}(t) = \langle t^2, \sin t, -e^{-t} \rangle + \mathbf{C}$. At $t = 0$,
$\langle 0, 0, -1 \rangle + \mathbf{C} = \langle 1, 0, 2 \rangle$, so $\mathbf{C} = \langle 1, 0, 3 \rangle$ and

$$
\mathbf{r}(t) = \langle t^2 + 1,\ \sin t,\ 3 - e^{-t} \rangle .
$$
:::
::::

:::caution[The constant is not the initial value]
$\mathbf{C}$ is not $\mathbf{r}(0)$ in general: above, the antiderivative of $e^{-t}$ is $-1$ at $t = 0$,
so the third component of $\mathbf{C}$ is $3$, not $2$. Always substitute the initial value of $t$ into
the antiderivative and solve for $\mathbf{C}$.
:::

:::insight
Integration undoes differentiation component by component, and the one thing to remember is the
constant vector. Given a derivative and one position, the whole curve is determined: the next unit uses
this to go from acceleration to position.
:::

:::equations{#vector-integral}
- *Definite integral*: $\int_a^b \mathbf{r}\,dt = \left\langle \int_a^b f\,dt,\ \int_a^b g\,dt,\ \int_a^b h\,dt \right\rangle$.
- *Fundamental theorem*: $\int_a^b \mathbf{r}(t)\,dt = \mathbf{R}(b) - \mathbf{R}(a)$, where $\mathbf{R}' = \mathbf{r}$.
- *Indefinite integral*: $\int \mathbf{r}(t)\,dt = \mathbf{R}(t) + \mathbf{C}$, with $\mathbf{C}$ a constant vector.
:::

## Further reading

- [Wikipedia — Vector-valued function](https://en.wikipedia.org/wiki/Vector-valued_function) — components, derivatives and the product rules.
- [Wikipedia — Helix](https://en.wikipedia.org/wiki/Helix) — the standard space curve and where it appears.
- [Wikipedia — Twisted cubic](https://en.wikipedia.org/wiki/Twisted_cubic) — the curve $\langle t, t^2, t^3 \rangle$.
