---
title: Motion in space, arc length and curvature
order: 10
status: detailed
weeks: [8]
introduces: [curvature]
requires:
  - {concept: vector-function, strength: hard}
  - {concept: cross-product, strength: soft}
reinforces:
  - {concept: arc-length, perspective: "of space curves"}
---

Read $\mathbf{r}(t)$ as the position of a moving particle at time $t$, and the derivatives of the last
unit become physics: $\mathbf{r}'(t)$ is the velocity and $\mathbf{r}''(t)$ the acceleration. The length
of the velocity is the speed, and adding up the speed gives the distance travelled, which is the arc
length of the curve. Then one geometric question remains: how sharply does the curve bend? The answer
does not depend on how fast the particle moves. It is the curvature, the rate at which the direction
turns per unit of distance.

## Velocity and acceleration

### Definitions

:::definition[Velocity, speed and acceleration]
For a particle with position $\mathbf{r}(t)$ at time $t$:

- the **velocity** is $\mathbf{v}(t) = \mathbf{r}'(t)$;
- the **speed** is the number $|\mathbf{v}(t)| = |\mathbf{r}'(t)|$;
- the **acceleration** is $\mathbf{a}(t) = \mathbf{v}'(t) = \mathbf{r}''(t)$.
:::

The velocity is tangent to the path and points in the direction of motion. The acceleration need not
be tangent: it also records a change of direction.

::::example[A particle on a space curve]
A particle has position $\mathbf{r}(t) = \langle 3t,\ 3t^2,\ 2t^3 \rangle$. Find its velocity, speed and acceleration, and their values at $t = 1$.

:::solution
Differentiating,

$$
\mathbf{v}(t) = \langle 3,\ 6t,\ 6t^2 \rangle ,
\qquad
\mathbf{a}(t) = \langle 0,\ 6,\ 12t \rangle .
$$

The speed simplifies, because the expression under the root is a perfect square:

$$
|\mathbf{v}(t)| = \sqrt{9 + 36t^2 + 36t^4} = 3\sqrt{(1 + 2t^2)^2} = 3(1 + 2t^2) .
$$

At $t = 1$: $\mathbf{v} = \langle 3, 6, 6 \rangle$, speed $9$, and $\mathbf{a} = \langle 0, 6, 12 \rangle$.
:::
::::

::::example[Uniform circular motion]
A particle moves on a circle of radius $R$ with $\mathbf{r}(t) = \langle R\cos\omega t,\ R\sin\omega t \rangle$, $\omega > 0$. Find its speed and its acceleration.

:::solution
$\mathbf{v}(t) = \langle -R\omega\sin\omega t,\ R\omega\cos\omega t \rangle$, so the speed is the constant $R\omega$. Differentiating again,

$$
\mathbf{a}(t) = \langle -R\omega^2\cos\omega t,\ -R\omega^2\sin\omega t \rangle = -\omega^2\,\mathbf{r}(t) .
$$

The speed never changes, yet the acceleration is not zero: it points at the centre, with length
$R\omega^2$. It is all spent on turning.
:::
::::

### From acceleration to position

Integrating goes the other way, one constant vector at each step. With $\mathbf{v}(t_0)$ and
$\mathbf{r}(t_0)$ known,

$$
\mathbf{v}(t) = \mathbf{v}(t_0) + \int_{t_0}^t \mathbf{a}(u)\,du ,
\qquad
\mathbf{r}(t) = \mathbf{r}(t_0) + \int_{t_0}^t \mathbf{v}(u)\,du .
$$

::::example[Position from the acceleration]
Find $\mathbf{r}(t)$ if $\mathbf{a}(t) = \langle 6t,\ 2,\ e^t \rangle$, $\mathbf{v}(0) = \langle 1, 0, -1 \rangle$ and $\mathbf{r}(0) = \langle 0, 1, 3 \rangle$.

:::solution
Integrating, $\mathbf{v}(t) = \langle 3t^2, 2t, e^t \rangle + \mathbf{C}$. At $t = 0$,
$\langle 0, 0, 1 \rangle + \mathbf{C} = \langle 1, 0, -1 \rangle$, so $\mathbf{C} = \langle 1, 0, -2 \rangle$:

$$
\mathbf{v}(t) = \langle 3t^2 + 1,\ 2t,\ e^t - 2 \rangle .
$$

Integrating again, $\mathbf{r}(t) = \langle t^3 + t,\ t^2,\ e^t - 2t \rangle + \mathbf{D}$. At $t = 0$,
$\langle 0, 0, 1 \rangle + \mathbf{D} = \langle 0, 1, 3 \rangle$, so $\mathbf{D} = \langle 0, 1, 2 \rangle$:

$$
\mathbf{r}(t) = \langle t^3 + t,\ t^2 + 1,\ e^t - 2t + 2 \rangle .
$$
:::
::::

### Force

**Newton's second law** says that a force $\mathbf{F}(t)$ on a particle of mass $m$ produces the
acceleration $\mathbf{F}(t) = m\,\mathbf{a}(t)$. So a known path gives the force, and a known force
gives the path by the two integrations above. In uniform circular motion, the force is
$\mathbf{F} = -m\omega^2\mathbf{r}$, directed toward the centre: the **centripetal force**.

### Projectile motion

A projectile under gravity alone has constant acceleration $\mathbf{a} = \langle 0, -g \rangle$, with
$g \approx 9.8\ \text{m/s}^2$. Launched at time $0$ from height $h$, with speed $v_0$ at angle $\alpha$
above the horizontal, it has $\mathbf{v}(0) = \langle v_0\cos\alpha,\ v_0\sin\alpha \rangle$, and two
integrations give the following.

:::proposition[Position of a projectile]
$$
x(t) = (v_0\cos\alpha)\,t , \qquad y(t) = h + (v_0\sin\alpha)\,t - \frac12 g t^2 .
$$
:::

:::steps[Solving a projectile problem]
1. Write the initial velocity in components.
2. Integrate $\mathbf{a}$ twice with the initial values, or use the formulas above.
3. Landing: solve $y(t) = 0$ and keep the positive root; the range is $x$ at that time.
4. Highest point: solve $y'(t) = 0$ and evaluate $y$ there.
5. Speed at impact: $|\mathbf{v}|$ at the landing time.
:::

::::example[Thrown from a roof]
A ball is thrown from a height of $10$ m at $30$ m/s, at $30°$ above the horizontal. Find the highest point, the time and distance of the landing, and the speed at impact. Use $g = 9.8$.

:::solution
$\mathbf{v}(0) = \langle 15\sqrt{3},\ 15 \rangle$, so $x(t) = 15\sqrt{3}\,t$ and $y(t) = 10 + 15t - 4.9t^2$.

Highest point: $y'(t) = 15 - 9.8t = 0$ at $t \approx 1.53$ s, where $y \approx 21.48$ m.

Landing: $4.9t^2 - 15t - 10 = 0$ has the positive root

$$
t = \frac{15 + \sqrt{225 + 196}}{9.8} = \frac{15 + \sqrt{421}}{9.8} \approx 3.62 \text{ s} ,
$$

and then $x = 15\sqrt{3}\,t \approx 94.2$ m.

Impact: $\mathbf{v} = \langle 15\sqrt{3},\ 15 - 9.8t \rangle \approx \langle 25.98,\ -20.52 \rangle$, with speed about $33.1$ m/s.
:::
::::

```sim
id: projectile-motion
controls:
  - {id: v0, label: Launch speed v₀ (m/s), min: 5, max: 40, step: 1, default: 30, decimals: 0}
  - {id: alpha, label: Launch angle α (degrees), min: 5, max: 85, step: 1, default: 30, decimals: 0}
  - {id: h, label: Height h (m), min: 0, max: 30, step: 1, default: 10, decimals: 0}
  - {id: t, label: Fraction of the flight, min: 0, max: 1, step: 0.01, default: 0.3, decimals: 2}
note: 'The yellow arrow is the velocity, tangent to the path; the red arrow is the constant acceleration. The defaults are the example above. Only the vertical component of the velocity changes.'
```

:::equations{#motion}
- *Velocity*: $\mathbf{v}(t) = \mathbf{r}'(t)$.
- *Speed*: $|\mathbf{v}(t)| = |\mathbf{r}'(t)|$.
- *Acceleration*: $\mathbf{a}(t) = \mathbf{r}''(t)$.
- *Newton's second law*: $\mathbf{F} = m\,\mathbf{a}$.
- *Projectile*: $x = (v_0\cos\alpha)t$, $y = h + (v_0\sin\alpha)t - \frac12 gt^2$.
:::

## Arc length

### The length of a space curve

The length of a plane curve is $\int_a^b \sqrt{x'(t)^2 + y'(t)^2}\,dt$. A third coordinate adds one
more square under the root, and the same limit of inscribed polygons gives the formula.

:::definition[Length of a space curve]
If $\mathbf{r}'$ is continuous on $[a, b]$ and the curve is traversed exactly once as $t$ goes from
$a$ to $b$, its **length** is

$$
L = \int_a^b |\mathbf{r}'(t)|\,dt = \int_a^b \sqrt{x'(t)^2 + y'(t)^2 + z'(t)^2}\,dt .
$$
:::

So length is the integral of the speed: the distance travelled.

::::example[The length of a curve with a perfect square]
Find the length of $\mathbf{r}(t) = \langle 3t, 3t^2, 2t^3 \rangle$ from $t = 0$ to $t = 1$.

:::solution
The speed was $3(1 + 2t^2)$, so

$$
L = \int_0^1 3(1 + 2t^2)\,dt = \left[ 3t + 2t^3 \right]_0^1 = 5 .
$$
:::
::::

::::example[One turn of a helix]
Find the length of one turn of $\mathbf{r}(t) = \langle 3\cos t, 3\sin t, 4t \rangle$.

:::solution
$\mathbf{r}'(t) = \langle -3\sin t, 3\cos t, 4 \rangle$ and $|\mathbf{r}'(t)| = \sqrt{9 + 16} = 5$, a constant. One turn is $0 \le t \le 2\pi$, so

$$
L = \int_0^{2\pi} 5\,dt = 10\pi .
$$
:::
::::

:::caution[Most curves have no closed form]
Curves chosen for an exercise make the root simplify, through a perfect square or $\cos^2 + \sin^2 = 1$.
Most do not: the length of $\langle t, t^2, t^3 \rangle$ on $[0, 1]$ is $\int_0^1 \sqrt{1 + 4t^2 + 9t^4}\,dt$,
which has no elementary antiderivative. Its value, about $1.863$, comes from a numerical rule. If the
root does not simplify, recheck the derivatives first.
:::

### The arc length function

A curve has many parametrizations, and the length does not depend on the one chosen. That makes
length itself a natural parameter.

:::definition[Arc length function]
For a smooth curve $\mathbf{r}(t)$, $a \le t \le b$, the **arc length function** is

$$
s(t) = \int_a^t |\mathbf{r}'(u)|\,du ,
$$

the length of the piece from $\mathbf{r}(a)$ to $\mathbf{r}(t)$. By the fundamental theorem of
calculus, $\dfrac{ds}{dt} = |\mathbf{r}'(t)|$.
:::

:::steps[Reparametrizing by arc length]
1. Compute $s(t) = \int_a^t |\mathbf{r}'(u)|\,du$.
2. Solve for $t$ in terms of $s$.
3. Substitute into $\mathbf{r}(t)$ to get $\mathbf{r}(t(s))$.
4. Check: the new curve has speed $1$.
:::

::::example[A helix by arc length]
Reparametrize $\mathbf{r}(t) = \langle 3\cos t, 3\sin t, 4t \rangle$ by arc length from $t = 0$, in the direction of increasing $t$.

:::solution
$s(t) = \int_0^t 5\,du = 5t$, so $t = \frac{s}{5}$ and

$$
\mathbf{r}(s) = \left\langle 3\cos\frac{s}{5},\ 3\sin\frac{s}{5},\ \frac{4s}{5} \right\rangle .
$$

Check: $|\mathbf{r}'(s)| = \sqrt{\frac{9}{25}\sin^2\frac{s}{5} + \frac{9}{25}\cos^2\frac{s}{5} + \frac{16}{25}} = 1$.

The point reached after walking $5\pi$ along the curve is $\mathbf{r}(5\pi) = \langle -3, 0, 4\pi \rangle$.
:::
::::

:::insight
Arc length is the integral of the speed. Parametrizing by arc length removes the speed from the
description, leaving only the shape: that is why the next definition uses $s$.
:::

:::equations{#arc-length}
- *Length*: $L = \int_a^b |\mathbf{r}'(t)|\,dt$.
- *Arc length function*: $s(t) = \int_a^t |\mathbf{r}'(u)|\,du$.
- *Rate of the arc length*: $\dfrac{ds}{dt} = |\mathbf{r}'(t)|$.
:::

## Curvature

### How fast the direction turns

The unit tangent $\mathbf{T}$ records only the direction of a curve. On a straight line it never
changes. On a tight bend it changes quickly per metre walked. To measure the shape and not the speed
of the walker, its rate of change is taken with respect to arc length.

:::definition[Curvature]
The **curvature** of a smooth curve is

$$
\kappa = \left| \frac{d\mathbf{T}}{ds} \right| ,
$$

the magnitude of the rate of change of the unit tangent with respect to arc length.
:::

Since $\mathbf{T}$ is usually a function of $t$, the chain rule $\frac{d\mathbf{T}}{dt} = \frac{d\mathbf{T}}{ds}\frac{ds}{dt}$ gives a formula that needs no reparametrization:

$$
\kappa(t) = \frac{|\mathbf{T}'(t)|}{|\mathbf{r}'(t)|} .
$$

::::example[The curvature of a circle]
Find the curvature of a circle of radius $R$.

:::solution
Take $\mathbf{r}(t) = \langle R\cos t, R\sin t \rangle$. Then $|\mathbf{r}'(t)| = R$,
$\mathbf{T}(t) = \langle -\sin t, \cos t \rangle$ and $|\mathbf{T}'(t)| = 1$. So

$$
\kappa = \frac{1}{R} .
$$

A small circle has large curvature, a large circle small curvature. A line is the limit: $\mathbf{T}$
is constant and $\kappa = 0$.
:::
::::

### The cross-product formula

Computing $\mathbf{T}'$ means differentiating a quotient with a square root. The next formula avoids
that: it needs only $\mathbf{r}'$ and $\mathbf{r}''$.

::::theorem[Curvature from the first two derivatives]
$$
\kappa(t) = \frac{|\mathbf{r}'(t) \times \mathbf{r}''(t)|}{|\mathbf{r}'(t)|^3} .
$$

:::proof
Write $\mathbf{r}' = v\,\mathbf{T}$ with $v = |\mathbf{r}'| = \frac{ds}{dt}$. By the product rule,
$\mathbf{r}'' = v'\,\mathbf{T} + v\,\mathbf{T}'$. Crossing with $\mathbf{r}' = v\,\mathbf{T}$, and using
$\mathbf{T} \times \mathbf{T} = \mathbf{0}$,

$$
\mathbf{r}' \times \mathbf{r}'' = v^2\,(\mathbf{T} \times \mathbf{T}') .
$$

$\mathbf{T}$ has constant length $1$, so $\mathbf{T}'$ is perpendicular to $\mathbf{T}$, and therefore
$|\mathbf{T} \times \mathbf{T}'| = |\mathbf{T}|\,|\mathbf{T}'| = |\mathbf{T}'|$. Hence
$|\mathbf{r}' \times \mathbf{r}''| = v^2|\mathbf{T}'|$, and

$$
\kappa = \frac{|\mathbf{T}'|}{v} = \frac{|\mathbf{r}' \times \mathbf{r}''|}{v^3} .
$$
:::
::::

::::example[The curvature of a space curve]
Find the curvature of $\mathbf{r}(t) = \langle 3t, 3t^2, 2t^3 \rangle$, and its value at $t = 0$ and $t = 1$.

:::solution
With $\mathbf{r}' = \langle 3, 6t, 6t^2 \rangle$ and $\mathbf{r}'' = \langle 0, 6, 12t \rangle$,

$$
\mathbf{r}' \times \mathbf{r}'' = \langle 36t^2,\ -36t,\ 18 \rangle = 18\langle 2t^2, -2t, 1 \rangle ,
$$

of length $18\sqrt{4t^4 + 4t^2 + 1} = 18(1 + 2t^2)$. So

$$
\kappa(t) = \frac{18(1 + 2t^2)}{27(1 + 2t^2)^3} = \frac{2}{3(1 + 2t^2)^2} ,
$$

with $\kappa(0) = \frac23$ and $\kappa(1) = \frac{2}{27}$: the curve straightens out as it leaves the origin.
:::
::::

::::example[The curvature of a helix]
Find the curvature of $\mathbf{r}(t) = \langle 3\cos t, 3\sin t, 4t \rangle$.

:::solution
$\mathbf{r}' = \langle -3\sin t, 3\cos t, 4 \rangle$ and $\mathbf{r}'' = \langle -3\cos t, -3\sin t, 0 \rangle$, so

$$
\mathbf{r}' \times \mathbf{r}'' = \langle 12\sin t,\ -12\cos t,\ 9 \rangle ,
\qquad
|\mathbf{r}' \times \mathbf{r}''| = \sqrt{144 + 81} = 15 .
$$

So $\kappa = \frac{15}{125} = \frac{3}{25}$, constant, and smaller than the $\frac13$ of the circle below
it: climbing stretches the bend.
:::
::::

### Plane curves

For a plane curve, embed it in space with $z = 0$. The cross product then has only a $\mathbf{k}$
component, and the theorem becomes two formulas.

:::proposition[Curvature of a plane curve]
For a parametric curve $x = x(t)$, $y = y(t)$,

$$
\kappa = \frac{|x'y'' - y'x''|}{\left( x'^2 + y'^2 \right)^{3/2}} ,
$$

and for a graph $y = f(x)$, taking $x$ as the parameter,

$$
\kappa(x) = \frac{|f''(x)|}{\left( 1 + f'(x)^2 \right)^{3/2}} .
$$
:::

::::example[An ellipse at its vertices]
Find the curvature of the ellipse $\mathbf{r}(t) = \langle 3\cos t, 2\sin t \rangle$ at the ends of its axes.

:::solution
$x' = -3\sin t$, $y' = 2\cos t$, $x'' = -3\cos t$, $y'' = -2\sin t$, so

$$
x'y'' - y'x'' = 6\sin^2 t + 6\cos^2 t = 6 ,
\qquad
\kappa(t) = \frac{6}{\left( 9\sin^2 t + 4\cos^2 t \right)^{3/2}} .
$$

At $t = 0$, the end of the long axis: $\kappa = \frac{6}{8} = \frac34$. At $t = \frac{\pi}{2}$, the end of
the short axis: $\kappa = \frac{6}{27} = \frac29$. The ellipse bends most at the tips of its long axis.
:::
::::

::::example[Where a hyperbola bends most]
Find the point of $y = \frac1x$, $x > 0$, with the largest curvature.

:::solution
$f' = -\frac{1}{x^2}$ and $f'' = \frac{2}{x^3}$, so

$$
\kappa(x) = \frac{2/x^3}{\left( 1 + 1/x^4 \right)^{3/2}} = \frac{2x^3}{(x^4 + 1)^{3/2}} .
$$

Maximizing $\ln\kappa = \ln 2 + 3\ln x - \frac32\ln(x^4 + 1)$, set the derivative to zero:

$$
\frac{3}{x} - \frac{6x^3}{x^4 + 1} = 0 \quad\Longleftrightarrow\quad x^4 + 1 = 2x^4 \quad\Longleftrightarrow\quad x = 1 .
$$

The sharpest point is the vertex $(1, 1)$, where $\kappa = \frac{2}{2^{3/2}} = \frac{1}{\sqrt{2}}$.
:::
::::

### The osculating circle

:::definition[Osculating circle]
At a point of a curve with $\kappa > 0$, the **osculating circle** is the circle that lies on the
concave side, is tangent to the curve there, and has the same curvature. Its radius is the **radius
of curvature** $\rho = \frac{1}{\kappa}$.
:::

For example, $y = x^2$ has $\kappa(0) = 2$, so its osculating circle at the origin has radius
$\frac12$ and centre $\left(0, \frac12\right)$. It is the best-fitting circle, as the tangent line is
the best-fitting line.

```sim
id: curvature-circle
controls:
  - {id: curve, label: "Curve (0: ellipse, 1: parabola y = x², 2: hyperbola y = 1/x, 3: sine y = sin x)", min: 0, max: 3, step: 1, default: 0, decimals: 0}
  - {id: u, label: Position along the curve, min: 0, max: 1, step: 0.005, default: 0.1, decimals: 3}
note: 'The red circle is the osculating circle; it has radius 1/κ and is tangent at the point. The arrows are T and N. The lower panel plots κ along the curve. Check the two examples: on the ellipse κ runs between 2/9 and 3/4, and on the hyperbola the peak is at (1, 1) with κ ≈ 0.707.'
```

```python
# Curvature from the cross product, checked on the helix: 3/25 at every t.
import numpy as np

def curvature(r1, r2):
    return np.linalg.norm(np.cross(r1, r2)) / np.linalg.norm(r1)**3

for t in (0.0, 1.0, 2.5):
    r1 = np.array([-3*np.sin(t), 3*np.cos(t), 4.0])
    r2 = np.array([-3*np.cos(t), -3*np.sin(t), 0.0])
    print(round(curvature(r1, r2), 6))     # 0.12 each time
```

## The moving frame

### Normal and binormal vectors

$\mathbf{T}$ has constant length, so $\mathbf{T}'$ is perpendicular to $\mathbf{T}$. Its direction,
the direction in which the curve is turning, gives a second vector, and the cross product a third.

:::definition[Principal normal and binormal]
Where $\mathbf{T}'(t) \ne \mathbf{0}$, the **principal unit normal** is

$$
\mathbf{N}(t) = \frac{\mathbf{T}'(t)}{|\mathbf{T}'(t)|} ,
$$

and the **binormal** is $\mathbf{B}(t) = \mathbf{T}(t) \times \mathbf{N}(t)$.
:::

The three are mutually perpendicular unit vectors, a right-handed frame that travels along the curve
(the **TNB frame**). Two planes through a point of the curve take their names from it: the **normal
plane**, spanned by $\mathbf{N}$ and $\mathbf{B}$, is perpendicular to the curve (its normal is
$\mathbf{T}$); the **osculating plane**, spanned by $\mathbf{T}$ and $\mathbf{N}$, is the plane the
curve bends in, and its normal is $\mathbf{B}$.

::::example[The frame of a helix]
Find $\mathbf{T}$, $\mathbf{N}$ and $\mathbf{B}$ for $\mathbf{r}(t) = \langle 3\cos t, 3\sin t, 4t \rangle$, and the normal and osculating planes at $t = \frac{\pi}{2}$.

:::solution
The speed is $5$, so $\mathbf{T} = \left\langle -\frac35\sin t,\ \frac35\cos t,\ \frac45 \right\rangle$.
Then $\mathbf{T}' = \left\langle -\frac35\cos t,\ -\frac35\sin t,\ 0 \right\rangle$ has length $\frac35$, so

$$
\mathbf{N} = \langle -\cos t,\ -\sin t,\ 0 \rangle ,
\qquad
\mathbf{B} = \mathbf{T} \times \mathbf{N} = \left\langle \frac45\sin t,\ -\frac45\cos t,\ \frac35 \right\rangle .
$$

$\mathbf{N}$ points straight at the axis of the helix.

At $t = \frac{\pi}{2}$ the point is $(0, 3, 2\pi)$, with $\mathbf{T} = \left\langle -\frac35, 0, \frac45 \right\rangle$ and $\mathbf{B} = \left\langle \frac45, 0, \frac35 \right\rangle$.

Normal plane, with normal $\langle -3, 0, 4 \rangle$: $-3x + 4(z - 2\pi) = 0$, that is $-3x + 4z = 8\pi$.

Osculating plane, with normal $\langle 4, 0, 3 \rangle$: $4x + 3(z - 2\pi) = 0$, that is $4x + 3z = 6\pi$.
:::
::::

### Tangential and normal components of acceleration

Differentiating $\mathbf{v} = v\,\mathbf{T}$ splits the acceleration into a part along the motion and
a part across it. Since $\mathbf{T}' = |\mathbf{T}'|\,\mathbf{N} = \kappa v\,\mathbf{N}$,

$$
\mathbf{a} = v'\,\mathbf{T} + v\,\mathbf{T}' = v'\,\mathbf{T} + \kappa v^2\,\mathbf{N} .
$$

The acceleration always lies in the osculating plane; it has no component along $\mathbf{B}$.

:::theorem[Components of acceleration]
$\mathbf{a} = a_T\,\mathbf{T} + a_N\,\mathbf{N}$, where

$$
a_T = v' = \frac{\mathbf{r}'(t) \cdot \mathbf{r}''(t)}{|\mathbf{r}'(t)|} ,
\qquad
a_N = \kappa v^2 = \frac{|\mathbf{r}'(t) \times \mathbf{r}''(t)|}{|\mathbf{r}'(t)|} .
$$
:::

$a_T$ changes the speed, and $a_N$ changes the direction. A car taking a bend feels $a_N = \kappa v^2$:
twice the speed needs four times the sideways force, and a tighter bend needs more still.

::::example[Splitting an acceleration]
For $\mathbf{r}(t) = \langle 3t, 3t^2, 2t^3 \rangle$ find $a_T$ and $a_N$, and check the split at $t = 1$.

:::solution
From the earlier work, $|\mathbf{r}'| = 3(1 + 2t^2)$ and $|\mathbf{r}' \times \mathbf{r}''| = 18(1 + 2t^2)$, and $\mathbf{r}' \cdot \mathbf{r}'' = 36t + 72t^3 = 36t(1 + 2t^2)$. So

$$
a_T = \frac{36t(1 + 2t^2)}{3(1 + 2t^2)} = 12t ,
\qquad
a_N = \frac{18(1 + 2t^2)}{3(1 + 2t^2)} = 6 .
$$

Check at $t = 1$: $a_T^2 + a_N^2 = 144 + 36 = 180$ and $|\mathbf{a}(1)|^2 = |\langle 0, 6, 12 \rangle|^2 = 180$.

In the frame at $t = 1$, $\mathbf{T} = \left\langle \frac13, \frac23, \frac23 \right\rangle$ and $\mathbf{N} = \left\langle -\frac23, -\frac13, \frac23 \right\rangle$, and indeed $12\mathbf{T} + 6\mathbf{N} = \langle 0, 6, 12 \rangle$.
:::
::::

:::caution[The speed is differentiated, not the velocity]
$a_T$ is the derivative of the number $v = |\mathbf{r}'|$, which is not $|\mathbf{r}''|$. In uniform
circular motion $|\mathbf{r}''| = R\omega^2$ but $a_T = 0$: the whole acceleration is normal.
:::

:::insight
Velocity carries the speed, curvature carries the shape, and the acceleration combines them:
$\mathbf{a} = v'\,\mathbf{T} + \kappa v^2\,\mathbf{N}$. Every formula of this unit reduces to
$\mathbf{r}'$, $\mathbf{r}''$, one dot product and one cross product.
:::

:::equations{#curvature}
- *Definition*: $\kappa = \left| \dfrac{d\mathbf{T}}{ds} \right| = \dfrac{|\mathbf{T}'(t)|}{|\mathbf{r}'(t)|}$.
- *Cross-product form*: $\kappa = \dfrac{|\mathbf{r}' \times \mathbf{r}''|}{|\mathbf{r}'|^3}$.
- *Graph*: $\kappa = \dfrac{|f''(x)|}{(1 + f'(x)^2)^{3/2}}$.
- *Plane parametric curve*: $\kappa = \dfrac{|x'y'' - y'x''|}{(x'^2 + y'^2)^{3/2}}$.
- *Normal and binormal*: $\mathbf{N} = \dfrac{\mathbf{T}'}{|\mathbf{T}'|}$, $\mathbf{B} = \mathbf{T} \times \mathbf{N}$.
- *Tangential component*: $a_T = \dfrac{\mathbf{r}' \cdot \mathbf{r}''}{|\mathbf{r}'|}$.
- *Normal component*: $a_N = \dfrac{|\mathbf{r}' \times \mathbf{r}''|}{|\mathbf{r}'|} = \kappa v^2$.
:::

## Further reading

- [Wikipedia — Curvature](https://en.wikipedia.org/wiki/Curvature) — plane and space curves, and the osculating circle.
- [Wikipedia — Frenet–Serret formulas](https://en.wikipedia.org/wiki/Frenet%E2%80%93Serret_formulas) — how the moving frame turns, with torsion as the third ingredient.
- [Wikipedia — Projectile motion](https://en.wikipedia.org/wiki/Projectile_motion) — range and maximum height in closed form.
