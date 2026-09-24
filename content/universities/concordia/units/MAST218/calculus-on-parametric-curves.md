---
title: Calculus on parametric curves
order: 2
status: detailed
notes: ["Lecture 3 · Wed 16 Sep 2026 · p.1 (second-order derivative, length proposition)", "Lecture 3 · p.2 (length vs distance, surface area, examples 1–2)", "Lecture 3 · p.3 (sphere about the y-axis; sketching method S1–S3)", "Lecture 3 · p.4 (loop example: table, tangents, direction, sketch)", "Lecture 3 · p.5 (length and area of the loop; translations)"]
weeks: [2]
textbook: "Stewart, Multivariable Calculus, 9e, 10.2"
introduces:
  - {concept: arc-length, perspective: "of a parametric curve, traced exactly once"}
  - distance-travelled
  - surface-area
  - surface-of-revolution
requires:
  - {concept: parametric-curve, strength: hard}
  - {concept: derivative, strength: hard}
  - {concept: integral, strength: hard}
  - {concept: substitution-rule, strength: soft}
reinforces:
  - {concept: derivative, perspective: "second derivative and concavity along a parametric curve"}
---

The rest of single-variable calculus carried over to a curve $x = f(t),\ y = g(t)$: the
second derivative and concavity, arc length (and when the integral is a distance
instead), the area of a surface of revolution, a three-step method for sketching, and
loops — curves that cross themselves — with their length and area.

## The second-order derivative

### From $y'$ to $y''$

For $y = F(x)$ the second derivative is $y'' = (y')' = F''(x) = \dfrac{d^2y}{dx^2}$. On a
parametric curve we already have the first derivative as a function of $t$,
$y'(x) = \dfrac{dy/dt}{dx/dt}$, and it is *that* function we differentiate again — with
respect to $x$, which means the same trick a second time:

:::definition[Second derivative on a parametric curve]
$$\frac{d^2y}{dx^2} = \big(y'(x)\big)' = \frac{d\big(y'\big)/dt}{dx/dt} = \frac{\dfrac{d}{dt}\!\left(\dfrac{y'(t)}{x'(t)}\right)}{x'(t)} .$$
Differentiate the *slope expression* with respect to $t$, then divide by $x'(t)$ once
more. It is **not** $y''(t)/x''(t)$.
:::

::::example[The second derivative]
$C:\ x(t) = 2t + 3,\quad y(t) = t^3 - t$. Find $\dfrac{d^2y}{dx^2}$.

:::solution
**Step 1 — first derivative.** $x'(t) = 2$, $y'(t) = 3t^2 - 1$, so
 $$y'(x) = \frac{dy}{dx} = \frac{dy/dt}{dx/dt} = \frac{3t^2 - 1}{2}.$$
**Step 2 — differentiate that with respect to $t$, divide by $x'(t)$ again.**
 $$\frac{d^2y}{dx^2} = \frac{d\big(y'\big)/dt}{dx/dt} = \frac{\dfrac{d}{dt}\!\left(\dfrac{3t^2-1}{2}\right)}{2} = \frac{3t}{2}.$$
:::
::::

### Concavity

Exactly as for $y = F(x)$: where $\dfrac{d^2y}{dx^2} > 0$ the curve is **concave upward**,
where it is $< 0$ **concave downward** — but the answer comes out as a condition on
$t$, not on $x$.

::::example[Where is it concave up?]
For the curve above, find the values of $t$ for which $C$ is concave up
and concave down.

:::solution
$$\text{up: } \frac{3t}{2} > 0 \Rightarrow t > 0,\quad t \in (0, \infty); \qquad \text{down: } \frac{3t}{2} < 0 \Rightarrow t < 0,\quad t \in (-\infty, 0).$$
At $t = 0$ (the point $(3, 0)$) the concavity changes — an inflection point.
:::
::::

```sim
id: param-concavity
controls:
  - {id: t0, label: "Parameter t\u2080", min: -1.5, max: 1.5, step: 0.05, default: 0.8, decimals: 2}
note: 'The curve x = 2t + 3, y = t³ − t with the tangent at t₀. The two colours are the sign of d²y/dx² = 3t/2: red where t < 0 (concave down), green where t > 0 (concave up). Slide through t₀ = 0 to see the tangent cross the curve at the inflection point (3, 0).'
```

```python
import sympy as sp

t = sp.symbols('t', real=True)
x = 2*t + 3
y = t**3 - t

dydx = sp.diff(y, t) / sp.diff(x, t)                       # (3t² − 1)/2
d2ydx2 = sp.simplify(sp.diff(dydx, t) / sp.diff(x, t))     # divide by x'(t) a second time: 3t/2
print('dy/dx   =', sp.simplify(dydx))                      # 3*t**2/2 - 1/2
print('d²y/dx² =', d2ydx2)                                 # 3*t/2
print('concave up where', sp.solve(d2ydx2 > 0, t))         # 0 < t

t0 = sp.Rational(4, 5)                                     # the slider's default t₀ = 0.8
print('t0 = 0.8: point', (x.subs(t, t0), y.subs(t, t0)),
      ' slope', dydx.subs(t, t0), ' d²y/dx²', d2ydx2.subs(t, t0))   # (23/5, -36/125)  slope 23/50  d²y/dx² 6/5 → concave up
```

:::caution
Both divisions are by $x'(t)$. Students who write $y''(t)/x''(t)$ get
$6t/0$ here — undefined — when the true answer is the perfectly finite $3t/2$.
:::

:::equations
- *Second derivative on a parametric curve*: $\dfrac{d^2y}{dx^2} = \dfrac{d(y'(x))/dt}{dx/dt}$ where $y'(x) = \dfrac{y'(t)}{x'(t)}$ — differentiate the slope with respect to $t$, divide by $x'(t)$ again; requires $x'(t) \neq 0$.
- *Concavity*: $\dfrac{d^2y}{dx^2} > 0 \Rightarrow$ concave up, $< 0 \Rightarrow$ concave down — as a condition on $t$.
- *Example*: $x = 2t + 3,\ y = t^3 - t \Rightarrow y' = \dfrac{3t^2 - 1}{2},\ y'' = \dfrac{3t}{2}$ — up for $t > 0$, down for $t < 0$.
:::

## Length of a parametric curve

### The proposition

:::theorem[Length of a parametric curve]
Let $C:\ x = f(t),\ y = g(t),\ \alpha \le t \le \beta$, such that
1. $f'$ and $g'$ are continuous, and $f'^2 + g'^2 > 0$ (the particle never stops);
2. $C$ is traced out **exactly once** as $t$ increases from $\alpha$ to $\beta$.

Then the **length** of $C$ is
 $$L = \int_\alpha^\beta \sqrt{\left(\frac{dx}{dt}\right)^2 + \left(\frac{dy}{dt}\right)^2}\,dt = \int_\alpha^\beta \sqrt{x'(t)^2 + y'(t)^2}\,dt .$$
:::

The integrand is the speed of the moving point, so the integral adds up "speed × time"
— distance. For the graph of a function, $y = f(x)$ parametrised by $x$ itself
($x = t$, $x' = 1$), the same formula collapses to the one from MATH 205:
 $$L = \int_a^b \sqrt{1 + \left(\frac{dy}{dx}\right)^2}\,dx .$$

:::note[Length versus distance]
If the particle moves along $C$ *more than once*
in $[\alpha, \beta]$, then $\displaystyle\int_\alpha^\beta \sqrt{x'^2 + y'^2}\,dt$ is the
**distance travelled** by the particle, which is larger than the length of $C$. The
formula always measures the trip; whether the trip equals the curve is condition 2.
:::

::::example[The circle of radius 3]
Find the length of the circle $x = 3\cos t,\ y = 3\sin t,\ 0 \le t \le 2\pi$ (traced once, counter-clockwise from $(3, 0)$). What does the same integral give for $0 \le t \le 6\pi$?

:::solution
$$L = \int_0^{2\pi} \sqrt{(-3\sin t)^2 + (3\cos t)^2}\,dt = \int_0^{2\pi} \sqrt{9}\,dt = \int_0^{2\pi} 3\,dt = \boxed{6\pi} \quad(= 2\pi r\ ✓).$$
With $0 \le t \le 6\pi$ the same integral gives $18\pi$: three laps — a distance, not
the length:
 $$L \neq \int_0^{6\pi} \sqrt{x'(t)^2 + y'(t)^2}\,dt = 18\pi .$$
:::
::::

```sim
id: param-length-distance
controls:
  - {id: T, label: "Upper limit T (turns of 2\u03C0)", min: 0.05, max: 3, step: 0.05, default: 1, decimals: 2}
note: 'The circle x = 3cos t, y = 3sin t. The integral ∫₀ᵀ √(x′² + y′²) dt = 3T is the length of the arc traced while T ≤ 2π — and the distance travelled once the particle goes round again. At T = 2π it is 6π; at T = 6π it is 18π although the curve has not changed.'
```

```python
import sympy as sp

t, T = sp.symbols('t T', positive=True)
x, y = 3*sp.cos(t), 3*sp.sin(t)
speed = sp.simplify(sp.sqrt(sp.diff(x, t)**2 + sp.diff(y, t)**2))   # 3
print('speed =', speed)

trip = sp.integrate(speed, (t, 0, T))                  # ∫₀ᵀ 3 dt = 3T
for turns in (1, 3):                                   # the slider counts turns of 2π
    print(f'T = {turns}·2π:', trip.subs(T, 2*sp.pi*turns))   # 6π (the length), then 18π (distance travelled)
```

## Area of a surface of revolution

Rotate the curve about an axis and a surface appears; its area is the arc-length
integrand weighted by the circumference $2\pi \cdot (\text{radius})$ of the circle each
point sweeps out.

:::definition[Area of a surface of revolution]
With the same hypotheses as the length proposition:

1. if $C$ is rotated about the **$x$-axis**, the area of the resulting surface is
 $$S = 2\pi \int_\alpha^\beta y(t)\,\sqrt{x'(t)^2 + y'(t)^2}\,dt, \qquad y(t) \ge 0 ;$$
2. if $C$ is rotated about the **$y$-axis**,
 $$S = 2\pi \int_\alpha^\beta x(t)\,\sqrt{x'(t)^2 + y'(t)^2}\,dt, \qquad x(t) \ge 0 .$$
The radius is the distance from the axis: $y$ when spinning about the $x$-axis, $x$
when spinning about the $y$-axis — hence the sign conditions.
:::

::::example[The sphere]
Find the surface area of a sphere of radius 3 as a surface of revolution — once about the $x$-axis and once about the $y$-axis.

:::solution
$C:\ x = 3\cos t,\ y = 3\sin t,\ 0 \le t \le \pi$ — the **upper** semicircle, so
$y(t) \ge 0$ and it is traced once. Rotating about the $x$-axis gives a sphere of
radius 3:
 $$S = 2\pi \int_0^{\pi} 3\sin t \cdot \sqrt{9}\,dt = 2\pi \cdot 9 \int_0^\pi \sin t\,dt = 2\pi \cdot 9 \cdot \big[-\cos t\big]_0^{\pi} = 2\pi \cdot 9 \cdot 2 = \boxed{36\pi} .$$
This is $4\pi r^2$ with $r = 3$ — the formula for the surface of the sphere ✓.
**The same sphere about the $y$-axis.** Take the **right** semicircle,
$-\tfrac{\pi}{2} \le t \le \tfrac{\pi}{2}$, so that $x(t) \ge 0$:
 $$S = 2\pi \int_{-\pi/2}^{\pi/2} 3\cos t \cdot 3\,dt = 18\pi\,\big[\sin t\big]_{-\pi/2}^{\pi/2} = 36\pi\ ✓.$$
:::
::::

```sim
id: param-surface-revolution
controls:
  - {id: tmax, label: "Rotate the arc 0 \u2264 t \u2264 (\u00D7\u03C0)", min: 0.05, max: 1, step: 0.05, default: 1, decimals: 2}
note: 'The upper semicircle x = 3cos t, y = 3sin t (red) spun about the x-axis (yellow). S = 2π ∫ y(t)·3 dt grows with the arc; at the full semicircle it is 36π = 4π·3². Drag to rotate the 3-D view.'
```

```python
import sympy as sp

t, a = sp.symbols('t a', positive=True)
x, y = 3*sp.cos(t), 3*sp.sin(t)
speed = sp.simplify(sp.sqrt(sp.diff(x, t)**2 + sp.diff(y, t)**2))   # 3

S = sp.integrate(2*sp.pi * y * speed, (t, 0, a))        # rotate the arc 0 ≤ t ≤ a about the x-axis
print('S(a) =', sp.simplify(S))                         # 18π(1 − cos a)
print('a = π  :', S.subs(a, sp.pi))                     # 36π = 4π·3², the whole sphere
print('a = π/2:', S.subs(a, sp.pi/2))                   # 18π, a hemisphere

S_y = sp.integrate(2*sp.pi * x * speed, (t, -sp.pi/2, sp.pi/2))    # right semicircle about the y-axis
print('about the y-axis:', S_y)                         # 36π again
```

:::caution
Using the full circle $0 \le t \le 2\pi$ about the $x$-axis is wrong
twice over: $y(t)$ is negative on half of it, and the lower half sweeps out the same
sphere again. Choose the half of the curve on the non-negative side of the axis.
:::

:::equations
- *Length*: $L = \displaystyle\int_\alpha^\beta \sqrt{x'(t)^2 + y'(t)^2}\,dt$ — $C$ traced exactly once, $f', g'$ continuous, $f'^2 + g'^2 > 0$; otherwise the integral is the distance travelled.
- *Cartesian special case*: $L = \displaystyle\int_a^b \sqrt{1 + \left(\tfrac{dy}{dx}\right)^2}\,dx$ — parametrise $y = f(x)$ by $x$ itself.
- *Surface about the $x$-axis*: $S = 2\pi\displaystyle\int_\alpha^\beta y(t)\sqrt{x'^2 + y'^2}\,dt$, $y \ge 0$ — radius $= y$.
- *Surface about the $y$-axis*: $S = 2\pi\displaystyle\int_\alpha^\beta x(t)\sqrt{x'^2 + y'^2}\,dt$, $x \ge 0$ — radius $= x$.
- *Circle and sphere of radius 3*: $L = \int_0^{2\pi} 3\,dt = 6\pi$, $S = 2\pi\int_0^\pi 9\sin t\,dt = 36\pi$ — matching $2\pi r$ and $4\pi r^2$.
:::

## A method for sketching parametric curves

The lecture wrote down, as "Method 2", the procedure to sketch a curve when eliminating
the parameter is impossible or unhelpful:

:::steps
**S1 — Table of values.** Tabulate $t \mid x \mid y$ for the special values of $t$:
the endpoints of $I$ (or $t \to \pm\infty$, the *limiting values*), the $t$ where
$x = 0$ and where $y = 0$ (intercepts), and any $t$ found in S2. Check for
**symmetry**: if $t \mapsto (x, y)$ and $-t \mapsto (-x, y)$ the curve is symmetric
about the $y$-axis; $-t \mapsto (x, -y)$ about the $x$-axis; $-t \mapsto (-x, -y)$ about the
origin.
**S2 — Direction of motion.** The signs of the derivatives:
$x'(t) > 0 \Rightarrow$ moving right ($\rightarrow$), $x'(t) < 0 \Rightarrow$ left ($\leftarrow$);
$y'(t) > 0 \Rightarrow$ up ($\uparrow$), $y'(t) < 0 \Rightarrow$ down ($\downarrow$). The $t$ where
$x' = 0$ (vertical tangents) and $y' = 0$ (horizontal tangents) go into the table.
**S3 — Concavity.** The sign of $\dfrac{d^2y}{dx^2}$, computed as in the first part.
:::

The three steps answer the three questions a sketch has to get right: *where* the curve
goes, *which way* it is traced, and *how it bends*.

## Loops

:::definition[Loop]
A **loop** is a curve that crosses itself: there are two different
parameter values $t_1 \neq t_2$ with $\big(x(t_1), y(t_1)\big) = \big(x(t_2), y(t_2)\big)$.
:::

The self-intersection point is found by solving that pair of equations for $t_1 \ne t_2$;
it belongs in the S1 table because it is where the sketch must cross.

::::example[A loop]
Sketch $C:\ x(t) = 3t - t^3,\ y(t) = 3 - t^2,\ t \in \mathbb{R}$.

:::solution
**Intercepts.** $x = 0 \Rightarrow 3t - t^3 = t(3 - t^2) = 0 \Rightarrow t = 0$ (then $y = 3$) or
$t = \pm\sqrt{3}$ (then $y = 0$). $\;y = 0 \Rightarrow 3 - t^2 = 0 \Rightarrow t = \pm\sqrt{3}$ — the
same two values, and both give $(0, 0)$: **the curve passes through the origin twice**.
**The loop, by the definition.** $t_1 \neq t_2$ with
 $$\begin{cases} 3t_1 - t_1^3 = 3t_2 - t_2^3 \\ 3 - t_1^2 = 3 - t_2^2 \end{cases} \;\Rightarrow\; t_1^2 = t_2^2 \Rightarrow t_1 = -t_2 \ (\text{since } t_1 \neq t_2).$$
Substituting $t_1 = -t_2$ into the first: $-3t_2 + t_2^3 = 3t_2 - t_2^3 \Rightarrow 6t_2 - 2t_2^3 = 0
\Rightarrow t_2 = 0$ (rejected: then $t_1 = t_2$) or $t_2 = \pm\sqrt{3}$. So the crossing is at
$t = \pm\sqrt 3$, the point $(0, 0)$, and the loop is the piece $-\sqrt3 \le t \le \sqrt3$.
**S1 — table.**

| $t$ | $x$ | $y$ | |
|---|---|---|---|
| $-\infty$ | $+\infty$ | $-\infty$ | start, 4th quadrant |
| $-\sqrt3$ | $0$ | $0$ | origin, first pass |
| $-1$ | $-2$ | $2$ | vertical tangent |
| $0$ | $0$ | $3$ | horizontal tangent (top) |
| $1$ | $2$ | $2$ | vertical tangent |
| $\sqrt3$ | $0$ | $0$ | origin, second pass |
| $+\infty$ | $-\infty$ | $-\infty$ | end, 3rd quadrant |

**Symmetry.** $-t \mapsto (-x, y)$: the curve is symmetric about the $y$-axis.
**S2 — direction.** $x'(t) = 3 - 3t^2 = 3(1 - t^2)$: zero at $t = \pm 1$ (vertical
tangents, VT). $y'(t) = -2t$: zero at $t = 0$ (horizontal tangent, HT).
 $$x' > 0 \Leftrightarrow 1 - t^2 > 0 \Leftrightarrow t \in (-1, 1)\ (\rightarrow); \qquad x' < 0 \Leftrightarrow t \in (-\infty, -1) \cup (1, \infty)\ (\leftarrow);$$
 $$y' > 0 \Leftrightarrow t < 0\ (\uparrow); \qquad y' < 0 \Leftrightarrow t > 0\ (\downarrow).$$
So the particle comes in from the lower right moving up and left, crosses the origin
at $t = -\sqrt3$, turns at $(-2, 2)$, moves right over the top $(0, 3)$, turns at
$(2, 2)$, comes back through the origin at $t = \sqrt3$ moving down and left, and leaves
to the lower left.
:::
::::

```sim
id: param-loop
controls:
  - {id: T, label: "Trace up to t =", min: -2.3, max: 2.3, step: 0.05, default: 2.3, decimals: 2}
note: 'The curve x = 3t − t³, y = 3 − t² traced from t = −2.3. The arrow is the direction of motion (signs of x′ and y′ in the legend); yellow is the double point t = ±√3, blue the vertical tangents t = ±1 and the horizontal tangent t = 0. The shaded loop is −√3 ≤ t ≤ √3. Stop at T = −1, 0, 1 to see each tangent.'
```

```python
import sympy as sp

t = sp.symbols('t', real=True)
x, y = 3*t - t**3, 3 - t**2
s3 = sp.sqrt(3)

# self-intersection: t1 ≠ t2 with the same point
t1, t2 = sp.symbols('t1 t2', real=True)
sols = sp.solve([x.subs(t, t1) - x.subs(t, t2), y.subs(t, t1) - y.subs(t, t2)], [t1, t2], dict=True)
crossings = [s for s in sols if t2 in s and s[t1] != s[t2]]
print(crossings)                                             # t1 = ±√3, t2 = ∓√3

print('VT at t =', sp.solve(sp.diff(x, t), t), ' HT at t =', sp.solve(sp.diff(y, t), t))   # [-1, 1]  [0]
area = sp.integrate(y * sp.diff(x, t), (t, -s3, s3))
print('area =', area, '≈', round(float(area), 2))           # 24√3/5 ≈ 8.31
speed = sp.sqrt(sp.diff(x, t)**2 + sp.diff(y, t)**2)
print('length ≈', round(float(sp.Integral(speed, (t, -s3, s3)).evalf()), 2))   # ≈ 10.74 (no closed form)
```

:::insight
A loop is not a new kind of object — it is the ordinary sketching
method plus one more entry in the table, the self-intersection, found from
$t_1 \neq t_2$ with the same $(x, y)$. Once the two parameter values of the crossing are
known, the loop is the parameter interval between them, and every integral over the
loop uses those limits.
:::

### Length and area of the loop

With the crossing at $t = \pm\sqrt3$ the loop is traced exactly once for
$-\sqrt3 \le t \le \sqrt3$, so the length proposition applies with those limits:
 $$\text{length(loop)} = \int_{-\sqrt3}^{\sqrt3} \sqrt{(3 - 3t^2)^2 + (-2t)^2}\,dt .$$
The integrand does not simplify (it is $\sqrt{9t^4 - 14t^2 + 9}$), so this one is left as
an integral or evaluated numerically ($\approx 10.74$).

The area enclosed is the parametric area formula from the previous unit with the loop's
limits:
 $$\text{area(loop)} = \int_{-\sqrt3}^{\sqrt3} y(t)\,x'(t)\,dt \qquad\text{or}\qquad \int_{-\sqrt3}^{\sqrt3} x(t)\,y'(t)\,dt ,$$
the two differing by orientation (one comes out negative), so take the absolute value:
 $$\int_{-\sqrt3}^{\sqrt3} (3 - t^2)(3 - 3t^2)\,dt = \int_{-\sqrt3}^{\sqrt3} \big(9 - 12t^2 + 3t^4\big)\,dt = \Big[9t - 4t^3 + \tfrac35 t^5\Big]_{-\sqrt3}^{\sqrt3} = \frac{24\sqrt3}{5} \approx 8.31 .$$

### Translating the curve

Adding constants shifts the picture without changing its shape: $x = 3t - t^3 + 1$,
$y = 3 - t^2$ is the same loop moved one unit right; $x = 3t - t^3 + 1$, $y = 3 - t^2 + 2$
moves it right and up, with the double point now at $(1, 2)$. Every $t$-value in the
table — the tangents, the crossing — is unchanged; only the $(x, y)$ columns shift.

:::equations
- *Self-intersection*: solve $\big(x(t_1), y(t_1)\big) = \big(x(t_2), y(t_2)\big)$ with $t_1 \neq t_2$ — for $x = 3t - t^3$, $y = 3 - t^2$: $t_1 = -t_2 = \mp\sqrt3$, point $(0, 0)$.
- *Tangents of the example*: VT where $x' = 3(1 - t^2) = 0 \Rightarrow t = \pm 1$ at $(\pm 2, 2)$; HT where $y' = -2t = 0 \Rightarrow t = 0$ at $(0, 3)$.
- *Loop length*: $\displaystyle\int_{-\sqrt3}^{\sqrt3} \sqrt{(3 - 3t^2)^2 + 4t^2}\,dt \approx 10.74$ — no elementary antiderivative.
- *Loop area*: $\displaystyle\left|\int_{-\sqrt3}^{\sqrt3} y\,x'\,dt\right| = \left|\int_{-\sqrt3}^{\sqrt3} x\,y'\,dt\right| = \frac{24\sqrt3}{5}$.
:::

## Further reading

- [Paul's Online Notes — Tangents with Parametric Equations](https://tutorial.math.lamar.edu/Classes/CalcII/ParaTangent.aspx) — Includes the second derivative $\frac{d^2y}{dx^2} = \frac{d(dy/dx)/dt}{dx/dt}$ and a concavity example.
- [Paul's Online Notes — Arc Length with Parametric Equations](https://tutorial.math.lamar.edu/Classes/CalcII/ParaArcLength.aspx) — The length formula with the "traced exactly once" condition spelled out, and a circle example.
- [Paul's Online Notes — Surface Area with Parametric Equations](https://tutorial.math.lamar.edu/Classes/CalcII/ParaSurfaceArea.aspx) — Both axes of rotation, with the sphere as the worked example.
- [Paul's Online Notes — Parametric Equations and Curves](https://tutorial.math.lamar.edu/Classes/CalcII/ParametricEqn.aspx) — Sketching with a table and direction of motion, including a self-intersecting example.
