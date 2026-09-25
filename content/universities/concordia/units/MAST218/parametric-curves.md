---
title: Parametric curves
order: 1
status: detailed
weeks: [1]
introduces: [parametric-curve]
requires:
  - {concept: derivative, strength: hard}
  - {concept: integral, strength: hard}
  - {concept: chain-rule, strength: soft}
reinforces: []
---

Curves described by parametric equations, sketching them, and the first calculus along
them: tangent lines and areas.

## Parametric Equations & Parametric Curves

### Why a parameter?

Not every curve in the plane can be written as $y = F(x)$ (or as $x = F(y)$). Consider an equation like
 $$x^2 + 2^{x+1} + x\ln(4y+1) = y \quad ???$$

There is no way to isolate $y$ here, so we cannot describe the curve as the graph of a function. The way out is to describe **both** the $x$ and $y$ coordinates as functions of a *third* variable, called the **parameter**.

:::definition[Parametric equations]
$$\begin{cases} x = f(t) \\ y = g(t) \end{cases} \qquad t \in I$$
These are the *parametric equations*; $t$ is the *parameter*; $I$ is the *parameter interval*. $I$ can be all of $\mathbb{R}$ or any subset of $\mathbb{R}$ (typically an interval such as $[a,b]$ or $[0,\infty)$).
:::

### The parametric curve

For each value of $t$ we obtain one point $(x,y) = \big(f(t),\, g(t)\big)$. As $t$ varies over $I$, the set of **all** these points is the *graph* of the parametric equations — it is called the **parametric curve**.

A useful way to think about it: $(x,y) = (f(t), g(t))$ is a **particle** that moves along the curve, and $t$ is time. The **direction of motion** — the direction in which the curve is traced out as $t$ increases — is indicated on a sketch with an **arrow**. This orientation is part of the information a parametric curve carries; a plain Cartesian equation does not have it.

### Initial point, terminal point, limiting values

- If $I = [a,b]$ is a closed interval, then the **initial point** is $(x,y) = (f(a), g(a))$ and the **terminal point** is $(x,y) = (f(b), g(b))$.
- If $I = \mathbb{R} = (-\infty,\infty)$ (or any unbounded interval), there are no endpoints, so instead we compute the **limiting values**: $$\text{“initial”: } \Big(\lim_{t\to-\infty} f(t),\ \lim_{t\to-\infty} g(t)\Big), \qquad \text{“terminal”: } \Big(\lim_{t\to+\infty} f(t),\ \lim_{t\to+\infty} g(t)\Big).$$ These tell us where the curve “comes from” and where it “goes to”.

::::example[Initial point and limiting values]
For $x = t^2,\ y = \sqrt{t},\ t \in [0,\infty)$, find the initial point and where the curve goes as $t \to \infty$.

:::solution
- *Initial point* ($t = 0$): $(x,y) = (f(0), g(0)) = (0, 0)$.
- *Terminal behaviour* ($t \to \infty$): $\displaystyle\lim_{t\to\infty} x(t) = \lim_{t\to\infty} t^2 = \infty$ and $\displaystyle\lim_{t\to\infty} y(t) = \lim_{t\to\infty}\sqrt{t} = \infty$, so the curve starts at the origin and runs off to infinity in the first quadrant.
- (Extra check, not needed for the example: eliminating $t$ gives $t = \sqrt{x}$, so $y = \sqrt{\sqrt{x}} = x^{1/4}$ for $x \ge 0$ — a slowly rising root curve.)
:::
::::

```sim
id: param-particle
controls:
  - {id: tmax, label: Current time t, min: 0, max: 4, step: 0.02, default: 1.5, decimals: 2}
note: 'The curve is Example 1: x = t², y = √t. Drag t forward and watch the particle trace the path from the initial point (0,0) outward — the arrow marks the direction of motion.'
```

```python
# Plotting a parametric curve numerically: build an array of t values, compute x(t)
# and y(t), and plot y against x. The arrow shows the direction of increasing t.
import numpy as np
import matplotlib.pyplot as plt

# Example 1: x = t^2, y = sqrt(t), t in [0, inf)
t = np.linspace(0, 4, 400)
x, y = t**2, np.sqrt(t)

plt.plot(x, y, lw=2)
plt.plot(x[0], y[0], 'go', label='initial point (t=0) = (0,0)')
# direction of motion: arrow at the middle of the curve
i = 200
plt.annotate('', xy=(x[i+5], y[i+5]), xytext=(x[i], y[i]),
             arrowprops=dict(arrowstyle='->', lw=2))
plt.xlabel('x = t^2'); plt.ylabel('y = sqrt(t)')
plt.legend(); plt.grid(alpha=.3); plt.axis('equal')
plt.show()
```

:::note
The particle picture is the one to keep in mind for the whole course: a parametric curve is a *path* with a *starting point*, a *direction*, and possibly a *speed* — three things a Cartesian equation cannot express.
:::

:::insight
A parametric curve is the set of points (f(t), g(t)) traced out as t runs through I. Unlike y = F(x), it also carries an orientation (the direction of motion as t increases) and endpoints (or limiting values when I is unbounded).
:::

:::equations
- *Parametric equations*: $x = f(t),\quad y = g(t),\quad t \in I$ — t is the parameter; I ⊆ ℝ is the parameter interval.
- *Initial & terminal points (I = [a, b])*: $P_{\text{init}} = \big(f(a),\,g(a)\big)$ and $P_{\text{term}} = \big(f(b),\,g(b)\big)$ — Plug the two ends of the parameter interval into both equations.
- *Limiting values (I = ℝ)*: $\Big(\lim_{t\to-\infty} f(t),\ \lim_{t\to-\infty} g(t)\Big)$ and $\Big(\lim_{t\to\infty} f(t),\ \lim_{t\to\infty} g(t)\Big)$ — Where the curve comes from and where it goes when there are no endpoints.
:::

## Sketching Parametric Curves

### The two-step recipe

:::steps
**S1 — Cartesian equation.** When possible, a Cartesian (or *rectangular*) equation can be obtained by **eliminating the parameter** from the pair of parametric equations. Solve one equation for $t$ and substitute into the other (or use an identity that removes $t$, e.g. $\sin^2 t + \cos^2 t = 1$ for circles).
**S2 — Direction of motion.** Find how the curve is traced as $t$ increases: compute the initial/terminal points (or the limiting values as $t \to \pm\infty$) and mark the direction with an arrow.
:::

### Example — a line

::::example[A line]
Sketch $C:\ x = t - 2,\ y = -2t + 3,\ t \in \mathbb{R}$, with its direction of motion.

:::solution
First note the ranges: $\operatorname{Range}(x) = \operatorname{Range}(f) = \mathbb{R}$ and $\operatorname{Range}(y) = \operatorname{Range}(g) = \mathbb{R}$ — nothing restricts $x$ or $y$.
**S1.** From $x = t - 2$ we get $t = x + 2$. Substituting, $$y = -2t + 3 = -2(x+2) + 3 = -2x - 1 .$$ So the curve lies on the line $y = -2x - 1$. (Quick check: $t = 0$ gives $(x,y) = (-2, 3)$, and indeed $-2(-2) - 1 = 3$ ✓.)
**S2.** Limiting values:
- $t \to -\infty$: $\displaystyle\lim_{t\to-\infty} x(t) = \lim_{t\to-\infty}(t-2) = -\infty$, $\quad \displaystyle\lim_{t\to-\infty} y(t) = \lim_{t\to-\infty}(-2t+3) = +\infty$ — the curve comes from the *upper-left*.
- $t \to +\infty$: $\displaystyle\lim_{t\to\infty} x(t) = +\infty$, $\quad \displaystyle\lim_{t\to\infty} y(t) = -\infty$ — the curve goes to the *lower-right*.
So the whole line $y = -2x-1$ is traced **from upper-left to lower-right**; the arrow on the sketch points down and to the right.
:::
::::

::::example[The same line, restricted]
Sketch the same curve for $0 \le t \le 5$.

:::solution
Now the curve is only a *segment* of the line:
- $t = 0 \;\Rightarrow\; (x,y) = (-2,\ 3)$ — initial point $A$;
- $t = 5 \;\Rightarrow\; (x,y) = (3,\ -7)$ — terminal point $B$.
The curve is the segment from $A(-2,3)$ to $B(3,-7)$, traversed from $A$ toward $B$.
:::
::::

### A more general parametric equation of a line

Take a line through two points $(x_1, y_1)$ and $(x_2, y_2)$. Its point–slope equation is
 $$y - y_1 = \frac{y_2 - y_1}{x_2 - x_1}\,(x - x_1) \quad\Longleftrightarrow\quad \frac{y - y_1}{y_2 - y_1} = \frac{x - x_1}{x_2 - x_1} .$$

Call the common value of these two fractions $t$. Then $y - y_1 = t\,(y_2 - y_1)$ and $x - x_1 = t\,(x_2 - x_1)$, i.e.

:::definition[Parametric equations of the line through $(x_1,y_1)$ and $(x_2,y_2)$]
$$\begin{cases} x = x_1 + t\,(x_2 - x_1) \\ y = y_1 + t\,(y_2 - y_1) \end{cases}\qquad t \in \mathbb{R}$$
This is the *set of parametric equations of the line*. It is the workhorse for lines in this course and is developed further in the next unit.
:::

```sim
id: param-line
controls:
  - {id: tmin, label: "Parameter start t\u2081", min: -3, max: 6, step: 0.1, default: 0, decimals: 1}
  - {id: tmax, label: "Parameter end t\u2082", min: -3, max: 6, step: 0.1, default: 5, decimals: 1}
note: 'This is the example line x = t − 2, y = −2t + 3 (dashed, all of ℝ). The solid part is the piece traced as t runs from t₁ to t₂: A is the initial point (t = t₁), B the terminal point (t = t₂), and the arrow shows the direction of motion. Defaults reproduce the example: t = 0 → (−2, 3), t = 5 → (3, −7). Set t₁ > t₂ and the same segment is traced the other way — the arrow flips.'
```

```python
# SymPy does both steps of the recipe symbolically: solve for t and substitute (S1),
# then take limits at ±∞ (S2).
import sympy as sp

t, x, y = sp.symbols('t x y')
xt = t - 2
yt = -2*t + 3

# S1: eliminate the parameter
t_of_x = sp.solve(sp.Eq(x, xt), t)[0]         # t = x + 2
cartesian = sp.simplify(yt.subs(t, t_of_x))    # y = -2x - 1
print('Cartesian equation: y =', cartesian)

# S2: direction of motion from the limits
for lim in (-sp.oo, sp.oo):
    print(f't -> {lim}: x -> {sp.limit(xt, t, lim)}, y -> {sp.limit(yt, t, lim)}')

# restricted domain 0 <= t <= 5: initial & terminal points
print('t=0 ->', (xt.subs(t, 0), yt.subs(t, 0)))
print('t=5 ->', (xt.subs(t, 5), yt.subs(t, 5)))
```

:::insight
Sketching = (S1) kill the parameter to recognise the shape, then (S2) put the arrow on it using endpoints or limits. Restricting the parameter interval cuts out a piece of the same curve.
:::

:::equations
- *S1 — eliminate the parameter (line example)*: $x = t-2 \;\Rightarrow\; t = x+2 \;\Rightarrow\; y = -2(x+2)+3 = -2x-1$ — Solve one parametric equation for t, substitute into the other.
- *S2 — direction from limits*: $\lim_{t\to-\infty}(x,y) = (-\infty,+\infty),\qquad \lim_{t\to+\infty}(x,y) = (+\infty,-\infty)$ — Upper-left → lower-right, so the arrow points down-right.
- *Line through two points*: $x = x_1 + t(x_2-x_1),\quad y = y_1 + t(y_2-y_1),\quad t\in\mathbb{R}$ — Obtained by setting both fractions of the two-point form equal to t.
:::

## Lines & Graphs of Functions

### Line through two points — the standard parametrisation

Let $C:\ x = f(t),\ y = g(t),\ t \in I$ be a line through $A(x_1, y_1)$ and $B(x_2, y_2)$. From the previous part,

:::definition[Line through two points]
$$\begin{cases} x = x_1 + t\,(x_2 - x_1) \\ y = y_1 + t\,(y_2 - y_1) \end{cases}\qquad t\in\mathbb{R}$$
Two values of $t$ are worth memorising:
- $t = 0 \;\Rightarrow\; x = x_1,\ y = y_1$, i.e. the point $A$;
- $t = 1 \;\Rightarrow\; x = x_2,\ y = y_2$, i.e. the point $B$.
So as $t$ increases the line is traced **from $A$ toward $B$**. Restricting to $0 \le t \le 1$ gives exactly the segment $AB$; $t\in\mathbb{R}$ gives the whole line.
:::

### Graph of a function

Any graph $y = F(x)$ is already “almost parametric”: just let $x$ itself be the parameter.
 $$y = F(x) \;\longrightarrow\; x = t,\quad y = F(t).$$

Likewise for a curve given as $x = F(y)$:
 $$x = F(y) \;\longrightarrow\; y = t,\quad x = F(t).$$

### Method 2 for a line: slope–intercept form

Alternatively, write the line through $A$ and $B$ as $y = a x + b$ and determine $a, b$ from the two points:
 $$\begin{cases} y_1 = a x_1 + b \\ y_2 = a x_2 + b \end{cases}\;\Rightarrow\; a, b = \dots$$

Then parametrise it as a graph, in either of two ways:

:::definition[A line as a graph, two ways]
$$x = t \;\Rightarrow\; y = a t + b \qquad\text{or}\qquad y = t \;\Rightarrow\; t = a x + b \;\Rightarrow\; x = \frac{t - b}{a}.$$
Both describe the same line, but with different parametrisations (different “speeds” and, for the second one, a different meaning of $t$). This is a general fact: **a curve has many parametrisations**.
:::

```sim
id: param-two-points
controls:
  - {id: x1, label: "x\u2081", min: -5, max: 5, step: 0.5, default: -2, decimals: 1}
  - {id: y1, label: "y\u2081", min: -5, max: 5, step: 0.5, default: 3, decimals: 1}
  - {id: x2, label: "x\u2082", min: -5, max: 5, step: 0.5, default: 3, decimals: 1}
  - {id: y2, label: "y\u2082", min: -5, max: 5, step: 0.5, default: -1, decimals: 1}
  - {id: t, label: Parameter t, min: -1, max: 2, step: 0.05, default: 0.5, decimals: 2}
note: The particle sits at x₁ + t(x₂ − x₁), y₁ + t(y₂ − y₁). Check that t = 0 lands on A and t = 1 lands on B; values outside [0, 1] continue along the same line.
...
```

```python
# A tiny helper that turns two points into the parametric functions x(t), y(t). Note
# that t = 0.5 is the midpoint of AB.
import numpy as np

def line_through(A, B):
    """Return x(t), y(t) for the line through A and B (t=0 -> A, t=1 -> B)."""
    (x1, y1), (x2, y2) = A, B
    return (lambda t: x1 + t*(x2 - x1)), (lambda t: y1 + t*(y2 - y1))

x, y = line_through((-2, 3), (3, -7))
for t in (0, 0.5, 1):
    print(f't={t}: ({x(t)}, {y(t)})')
# t=0: (-2, 3)   t=0.5: (0.5, -2.0)   t=1: (3, -7)
```

:::note
Which one to use? The two-point form is best when you know two points (and you want $A$ at $t=0$, $B$ at $t=1$). The $x = t$ form is best when you already have $y$ as a function of $x$.
:::

:::insight
In the two-point form the parameter t measures the fraction of the way from A to B: t = 0 is A, t = 1 is B. Any graph y = F(x) is parametrised by x = t, y = F(t).
:::

:::equations
- *Two-point form*: $x = x_1 + t(x_2-x_1),\quad y = y_1 + t(y_2-y_1)$ — t = 0 → A(x₁,y₁), t = 1 → B(x₂,y₂).
- *Graph of a function*: $y = F(x)\ \Rightarrow\ x = t,\ y = F(t) \qquad\qquad x = F(y)\ \Rightarrow\ y = t,\ x = F(t)$ — Use the independent variable itself as the parameter.
- *Slope–intercept line, two ways*: $x = t,\ y = at+b \qquad\text{or}\qquad y = t,\ x = \tfrac{t-b}{a}$ — Same line, two different parametrisations.
:::

## Circles

### The basic circle

::::example[The basic circle]
Identify and sketch the curve $x = 2\cos t,\ y = 2\sin t,\ 0 \le t \le 2\pi$, with its direction of motion.

:::solution
**S1 (Cartesian equation).** We cannot solve for $t$ nicely, but we do not need to: use the identity $\boxed{\sin^2\alpha + \cos^2\alpha = 1 \text{ for all } \alpha}$. From the equations, $\cos t = \dfrac{x}{2}$ and $\sin t = \dfrac{y}{2}$, so
 $$\Big(\frac{x}{2}\Big)^2 + \Big(\frac{y}{2}\Big)^2 = 1 \quad\Longleftrightarrow\quad x^2 + y^2 = 4 ,$$
a **circle** with centre $(0,0)$ and radius $2$.
**S2 (direction).** Make a table of values:

| $t$ | $x = 2\cos t$ | $y = 2\sin t$ | point |
|---|---|---|---|
| $0$ | $2$ | $0$ | $(2,0)$ — initial point |
| $\pi/2$ | $0$ | $2$ | $(0,2)$ |
| $\pi$ | $-2$ | $0$ | $(-2,0)$ |
| $3\pi/2$ | $0$ | $-2$ | $(0,-2)$ |
| $2\pi$ | $2$ | $0$ | $(2,0)$ — back to the start |

The particle starts at $(2,0)$ and goes through $(0,2)$, $(-2,0)$, $(0,-2)$: it moves **counter-clockwise**, once around, and ends where it began.
:::
::::

**Recall** the Cartesian forms of a circle:

:::definition[Cartesian equation of a circle]
$$x^2 + y^2 = r^2 \;\to\; \text{centre } (0,0),\ \text{radius } r\;\qquad (x-a)^2 + (y-b)^2 = r^2 \;\to\; \text{centre } (a,b),\ \text{radius } r.$$
:::

### Changing the speed

::::example[Faster]
Describe the curve $x = 2\cos(2t),\ y = 2\sin(2t),\ 0 \le t \le 2\pi$.

:::solution
Cartesian equation: $\cos 2t = x/2,\ \sin 2t = y/2 \Rightarrow (x/2)^2 + (y/2)^2 = 1 \Rightarrow x^2 + y^2 = 4$ — the *same circle* as before. But now $0 \le t \le 2\pi \Rightarrow 0 \le 2t \le 4\pi$. Substituting $u = 2t$ gives $x = 2\cos u,\ y = 2\sin u,\ 0 \le u \le 4\pi$: the previous system, but running through **two full turns**. “Faster speed.”
In general, for $n > 1$, $$x = r\cos(nt),\quad y = r\sin(nt),\quad 0 \le t \le 2\pi \qquad\text{goes counter-clockwise } n \text{ times.}$$
:::
::::

::::example[Slower]
Describe the curve $x = 2\cos(t/2),\ y = 2\sin(t/2),\ 0 \le t \le 2\pi$.

:::solution
Here $u = t/2$ runs over $0 \le u \le \pi$, so $x = 2\cos u,\ y = 2\sin u$ with $0 \le u \le \pi$ traces only **half of the circle** (the upper half, from $(2,0)$ counter-clockwise to $(-2,0)$). “Slower speed.”
:::
::::

### Reversing the direction — clockwise

::::example[Clockwise]
Describe the curve $x = 2\cos t,\ y = -2\sin t,\ 0 \le t \le 2\pi$.

:::solution
$\cos t = x/2,\ \sin t = -y/2 \Rightarrow (x/2)^2 + (-y/2)^2 = 1 \Rightarrow x^2 + y^2 = 4$: the same circle again. Table: $t = 0 \to (2,0)$, $t = \pi/2 \to (0,-2)$, $t = \pi \to (-2,0)$, $t = 3\pi/2 \to (0,2)$. This time the motion is **clockwise**.
:::
::::

### All the ways to parametrise $x^2 + y^2 = r^2$

:::definition[Parametrisations of a circle]
$$\begin{cases} x = \pm\, r\cos t \\ y = \pm\, r\sin t \end{cases} \qquad\text{or}\qquad \begin{cases} x = \pm\, r\sin t \\ y = \pm\, r\cos t \end{cases} \qquad 0 \le t \le 2\pi \quad\text{(full circle)}$$
The **traditional** choice is $x = r\cos t,\ y = r\sin t,\ 0 \le t \le 2\pi$ (start at $(r,0)$, counter-clockwise). The signs and the swap of $\sin/\cos$ change only the starting point and the direction, never the circle.
:::

### Translating the centre

For $(x-a)^2 + (y-b)^2 = r^2$, apply the same trick to $x - a$ and $y - b$:

:::definition[Circle with centre $(a,b)$]
$$\begin{cases} x - a = r\cos t \\ y - b = r\sin t \end{cases} \quad\Longleftrightarrow\quad \begin{cases} x = a + r\cos t \\ y = b + r\sin t \end{cases}\qquad 0 \le t \le 2\pi \quad !$$
:::

### Example — drawing a smiley face 🙂

::::example[A smiley face]
Build a smiley face out of parametric circles: a face of radius 3 centred at $(3,3)$, two small eyes at $(2,4)$ and $(4,4)$, and a smiling mouth.

:::solution
- **Face:** centre $(3,3)$, $r = 3$, initial point $(6,3)$: $$x - 3 = 3\cos t,\ y - 3 = 3\sin t \;\Longleftrightarrow\; x = 3 + 3\cos t,\ y = 3 + 3\sin t,\quad 0 \le t \le 2\pi .$$
- **Left eye:** $(a,b) = (2,4)$, $r = 0.1$: $\;x - 2 = 0.1\cos t,\ y - 4 = 0.1\sin t,\ 0 \le t \le 2\pi$.
- **Right eye:** $(a,b) = (4,4)$, $r = 0.1$: $\;x - 4 = 0.1\cos t,\ y - 4 = 0.1\sin t,\ 0 \le t \le 2\pi$.
- **Mouth:** the *lower half* of the circle with $(a,b) = (3,3)$, $r = 1$ — restrict the parameter to $\pi \le t \le 2\pi$: $$x - 3 = 1\cdot\cos t,\ y - 3 = 1\cdot\sin t,\qquad \pi \le t \le 2\pi .$$
Every piece is the same template $x = a + r\cos t,\ y = b + r\sin t$; only $(a,b)$, $r$ and the $t$-interval change. Run the simulation below to see it drawn.
:::
::::

```sim
id: param-circle
controls:
  - {id: a, label: Centre a, min: -4, max: 4, step: 0.5, default: 0, decimals: 1}
  - {id: b, label: Centre b, min: -4, max: 4, step: 0.5, default: 0, decimals: 1}
  - {id: r, label: Radius r, min: 0.5, max: 4, step: 0.5, default: 2, decimals: 1}
  - {id: n, label: Speed multiplier n, min: 0.25, max: 3, step: 0.25, default: 1, decimals: 2}
  - {id: dir, label: "Direction (+1 CCW, \u22121 CW)", min: -1, max: 1, step: 2, default: 1, decimals: 0}
  - {id: tmax, label: "Current t (\xD7 \u03C0)", min: 0, max: 2, step: 0.02, default: 1.25, decimals: 2}
note: x = a + r cos(nt), y = b + dir · r sin(nt). Drag "Current t" to trace the path from t = 0. Try n = 2 (two laps in one 2π interval), n = 0.5 (only half a circle), and dir = −1 (clockwise).
...
```

```python
# One helper for the template x = a + r cos t, y = b + r sin t; the parameter interval
# [t0, t1] picks out a full circle or just an arc (the mouth is the lower half, π ≤ t
# ≤ 2π).
import numpy as np
import matplotlib.pyplot as plt

def circle(a, b, r, t0=0, t1=2*np.pi, n=400):
    """Parametric circle x = a + r cos t, y = b + r sin t on [t0, t1]."""
    t = np.linspace(t0, t1, n)
    return a + r*np.cos(t), b + r*np.sin(t)

# The smiley face
plt.plot(*circle(3, 3, 3),                    lw=2, label='face  (3,3), r=3')
plt.plot(*circle(2, 4, 0.1),                  lw=2, label='left eye  (2,4), r=0.1')
plt.plot(*circle(4, 4, 0.1),                  lw=2, label='right eye (4,4), r=0.1')
plt.plot(*circle(3, 3, 1, np.pi, 2*np.pi),    lw=2, label='mouth (3,3), r=1, pi<=t<=2pi')
plt.axis('equal'); plt.grid(alpha=.3); plt.legend(fontsize=8)
plt.show()
```

:::insight
Everything about a circle is controlled by four knobs: the centre (a, b) shifts it, r scales it, the sign of the sine term (or swapping sin/cos) sets the direction, and the multiplier n in cos(nt), sin(nt) sets how many times (or what fraction of a turn) you go around for 0 ≤ t ≤ 2π.
:::

:::equations
- *Why it is a circle*: $\cos t = \tfrac{x}{r},\ \sin t = \tfrac{y}{r} \;\Rightarrow\; \Big(\tfrac{x}{r}\Big)^2 + \Big(\tfrac{y}{r}\Big)^2 = 1 \;\Leftrightarrow\; x^2 + y^2 = r^2$ — Uses sin²α + cos²α = 1 for all α.
- *General circle, centre (a,b), radius r*: $x = a + r\cos t,\quad y = b + r\sin t,\quad 0 \le t \le 2\pi$ — Counter-clockwise, starting at (a + r, b).
- *Speed & direction*: $x = r\cos(nt),\ y = r\sin(nt)\ \text{(n turns CCW)}\;\qquad x = r\cos t,\ y = -r\sin t\ \text{(clockwise)}$ — n = 2 → twice around; n = ½ → half a circle; a minus sign on y reverses the direction.
:::

## Worked Example: The Smiley Face

A drawing exercise closes the circles discussion: build a smiley face out of parametric circles. It is a compact test of everything in the previous topic.

| Piece | Centre $(a,b)$ | Radius $r$ | Parametric equations | $t$-interval |
|---|---|---|---|---|
| Face | $(3,3)$ | $3$ | $x = 3 + 3\cos t,\ y = 3 + 3\sin t$ | $0 \le t \le 2\pi$ |
| Left eye | $(2,4)$ | $0.1$ | $x - 2 = 0.1\cos t,\ y - 4 = 0.1\sin t$ | $0 \le t \le 2\pi$ |
| Right eye | $(4,4)$ | $0.1$ | $x - 4 = 0.1\cos t,\ y - 4 = 0.1\sin t$ | $0 \le t \le 2\pi$ |
| Mouth | $(3,3)$ | $1$ | $x - 3 = \cos t,\ y - 3 = \sin t$ | $\pi \le t \le 2\pi$ |

Why does $\pi \le t \le 2\pi$ give the mouth? At $t = \pi$ the point is $(3-1,\,3) = (2,3)$ (left corner of the mouth); as $t$ increases to $3\pi/2$ the point is $(3,\,3-1) = (3,2)$ (bottom of the smile); at $t = 2\pi$ it is $(4,3)$ (right corner). So the lower half is traced left → bottom → right — a smile.

```sim
id: param-smiley
controls:
  - {id: prog, label: "Drawing progress (\xD7 2\u03C0)", min: 0, max: 1, step: 0.01, default: 1, decimals: 2}
note: All four pieces are drawn simultaneously as t advances from 0. Watch that the mouth only starts appearing once t passes π (progress 0.5).
...
```

```python
# The four pieces of the smiley as (a, b, r, t-interval) for x = a + r cos t, y = b + r sin t.
# At drawing progress p the parameter has reached T = p·2π; a piece shows the part of
# its interval below T, so the mouth (π ≤ t ≤ 2π) only appears once p passes 0.5.
from math import cos, sin, pi

pieces = {'face': (3, 3, 3, 0, 2*pi), 'left eye': (2, 4, 0.1, 0, 2*pi),
          'right eye': (4, 4, 0.1, 0, 2*pi), 'mouth': (3, 3, 1, pi, 2*pi)}

def point(a, b, r, t):
    return (round(a + r*cos(t), 3) + 0.0, round(b + r*sin(t), 3) + 0.0)

for p in (0.25, 0.5, 0.75, 1.0):                           # the progress slider (default 1)
    T = p * 2*pi
    drawn = [name for name, (a, b, r, t0, t1) in pieces.items() if T > t0]
    print(f'p = {p}: t reaches {p*2:.1f}π, drawn: {drawn}')

a, b, r, _, _ = pieces['mouth']
for t, where in ((pi, 'left corner'), (3*pi/2, 'bottom'), (2*pi, 'right corner')):
    print(f'mouth at t = {t/pi:.1f}π: {point(a, b, r, t)}  {where}')  # (2,3), (3,2), (4,3): a smile
```

:::note
Change the interval to $0 \le t \le \pi$ and you get the upper half instead — a frown. The interval is as much a part of the curve as the equations.
:::

## Tangent Lines to Parametric Curves

### From Cartesian to parametric

For a curve $y = F(x)$ we already know how to compute $y'$, $y''$, areas and lengths. All of these can be **extended to parametric curves**. The two descriptions of the same curve $C$ are

- $C:\ y = F(x)$ — the *Cartesian equation*;
- $C:\ x = f(t),\ y = g(t),\ t \in I$ — the *parametric equations*.

### The slope formula

For $y = F(x)$ the slope is $y' = \dfrac{dy}{dx} = F'(x)$. On the parametric curve, $y$ and $x$ are linked through $t$: since $g(t) = F\big(f(t)\big)$, the **chain rule** gives
 $$g'(t) = F'\big(f(t)\big)\cdot f'(t) \qquad\text{i.e.}\qquad \frac{dy}{dt} = \frac{dy}{dx}\cdot\frac{dx}{dt}.$$

Dividing by $dx/dt$ (when it is non-zero):

:::definition[Slope of the tangent line]
$$\frac{dy}{dx} = \frac{dy/dt}{dx/dt} = \frac{y'(t)}{x'(t)}$$
The **slope of the tangent line** of $C$ at the point $(x_0, y_0) = \big(f(t_0), g(t_0)\big)$ is
 $$\left.\frac{dy}{dx}\right|_{(x_0,y_0)} = \left.\frac{y'(t)}{x'(t)}\right|_{t = t_0}.$$
**Equation of the tangent line** to $C$ at $(x_0, y_0)$ — the usual point–slope form:
 $$y - y_0 = \left.\frac{dy}{dx}\right|_{(x_0,y_0)} (x - x_0).$$
:::

### Horizontal and vertical tangents

:::proposition[Horizontal and vertical tangents]
- **Horizontal tangent line:** $\dfrac{dy}{dx} = 0$ with $dx \neq 0$, i.e. $\;y'(t) = 0$ **and** $x'(t) \neq 0$.
- **Vertical tangent line:** $\dfrac{dy}{dx} = \pm\infty$, i.e. $\;x'(t) = 0$ **and** $y'(t) \neq 0$.
:::

:::remark
If $x'(t_0) = 0$ *and* $y'(t_0) = 0$ at the same time, the formula gives $0/0$ and says
nothing. Then examine the limit

$$
\lim_{t\to t_0}\frac{y'(t)}{x'(t)}
$$

to decide what the tangent does.
:::

### Worked example — two methods

::::example[Tangent line, two methods]
$C:\ x(t) = 1 + \sqrt[3]{t},\quad y(t) = e^{t^3}$. Find the equation of the tangent line to $C$ at the point $(2, e)$.

:::solution
**Method 1 — parametric formula.** First find $t_0$ from the point $(x_0,y_0) = (2, e)$:
 $$\begin{cases} 1 + \sqrt[3]{t} = 2 \\ e^{t^3} = e \end{cases} \;\Rightarrow\; \begin{cases} \sqrt[3]{t} = 1 \Rightarrow \boxed{t = 1} \\ e^{1} = e\ ✓ \end{cases} \qquad t_0 = 1 .$$
Now the slope:
 $$\text{Slope} = \left.\frac{dy/dt}{dx/dt}\right|_{t=1} = \left.\frac{y'(t)}{x'(t)}\right|_{t=1} = \left.\frac{e^{t^3}\cdot 3t^2}{\tfrac13\, t^{\frac13 - 1}}\right|_{t=1} = \frac{3e}{1/3} = \underline{\underline{9e}} .$$
(Here $x'(t) = \tfrac13 t^{-2/3}$ because $\sqrt[3]{t} = t^{1/3}$.)
**Method 2 — Cartesian equation.** Eliminate $t$: $x = 1 + \sqrt[3]{t} \Rightarrow x - 1 = \sqrt[3]{t} \Rightarrow (x-1)^3 = t$, so
 $$y = e^{\left((x-1)^3\right)^3} = e^{(x-1)^9} .$$
Then
 $$\text{Slope} = \frac{dy}{dx} = y'(x)\Big|_{(2,e)} = e^{(x-1)^9}\cdot 9(x-1)^8\Big|_{x=2} = 9e\ ✓$$
**Tangent line** (either method): $\boxed{\,y - e = 9e\,(x - 2)\,}$.
:::
::::

```sim
id: param-tangent
controls:
  - {id: t0, label: "Parameter t\u2080", min: -1.2, max: 1.2, step: 0.02, default: 1, decimals: 2}
note: 'The curve x = 1 + ∛t, y = e^{t³} from the example, with the tangent line at t₀. At t₀ = 1 the point is (2, e) and the slope is 9e ≈ 24.5. At t₀ = 0 the formula needs care: y′(0) = 0 while x′(t) = ⅓t^(−2/3) blows up, so dy/dx = y′/x′ = 9t^(8/3)e^(t³) → 0 — a horizontal tangent at (1, 1), which the Cartesian form y = e^((x−1)^9) confirms (slope 9(x−1)^8 e^(…) = 0 at x = 1).'
```

```python
# Both methods, done symbolically. SymPy confirms the slope 9e twice —
# from y′(t)/x′(t) at t₀ = 1, and from the Cartesian form y = e^{(x−1)^9}.
import sympy as sp

t, x = sp.symbols('t x', real=True)
xt = 1 + sp.cbrt(t)
yt = sp.exp(t**3)

# Method 1: parametric slope y'(t)/x'(t) at the t0 giving (2, e)
t0 = sp.solve(sp.Eq(xt, 2), t)[0]                 # t0 = 1
slope1 = sp.simplify(sp.diff(yt, t) / sp.diff(xt, t)).subs(t, t0)
print('t0 =', t0, '  slope (M1) =', slope1)      # 9*E

# Method 2: Cartesian equation y = e^{(x-1)^9}
y_cart = sp.exp((x - 1)**9)
slope2 = sp.diff(y_cart, x).subs(x, 2)
print('slope (M2) =', slope2)                    # 9*E

x0, y0 = 2, sp.E
print('tangent: y - e =', slope1, '* (x - 2)')
```

:::note
Sometimes it is not easy (or not possible) to find the Cartesian equation — then you *must* use Method 1. That is the whole point of the parametric slope formula.
:::

:::insight
dy/dx = y′(t)/x′(t): differentiate each coordinate with respect to t, then divide. To use it at a point, first solve for the t₀ that produces that point. Horizontal tangent ⇔ y′ = 0 (with x′ ≠ 0); vertical tangent ⇔ x′ = 0 (with y′ ≠ 0).
:::

:::caution
A common mistake is to declare a horizontal tangent whenever y′(t) = 0. You must also check x′(t) ≠ 0 — if both derivatives vanish, the quotient is 0/0 and you need the limit of y′(t)/x′(t) as t → t₀ to decide.
:::

:::equations
- *Chain rule*: $\frac{dy}{dt} = \frac{dy}{dx}\cdot\frac{dx}{dt}$ — Because g(t) = F(f(t)) ⇒ g′(t) = F′(f(t))·f′(t).
- *Slope of the tangent*: $\frac{dy}{dx} = \frac{dy/dt}{dx/dt} = \frac{y'(t)}{x'(t)},\qquad \left.\frac{dy}{dx}\right|_{(x_0,y_0)} = \left.\frac{y'(t)}{x'(t)}\right|_{t=t_0}$ — Valid where x′(t) ≠ 0.
- *Tangent line at (x₀, y₀)*: $y - y_0 = \left.\frac{dy}{dx}\right|_{(x_0,y_0)}\,(x - x_0)$ — Point–slope form with the parametric slope.
- *Horizontal / vertical tangents*: $\text{H: } y'(t)=0,\ x'(t)\neq 0 \qquad\qquad \text{V: } x'(t)=0,\ y'(t)\neq 0$ — If both vanish, look at lim y′(t)/x′(t) as t → t₀.
- *Example: slope at (2, e)*: $\left.\frac{e^{t^3}\cdot 3t^2}{\tfrac13 t^{-2/3}}\right|_{t=1} = 9e$ — x = 1 + ∛t, y = e^{t³}; the point (2, e) corresponds to t₀ = 1.
:::

## Areas Under Parametric Curves

### Recall: area under $y = f(x)$

If $y = f(x) \ge 0$ is continuous on $a \le x \le b$, the area between the curve and the $x$-axis is
 $$A = \int_a^b \big(f(x) - 0\big)\,dx = \int_a^b y\,dx .$$

### Parametric version — substitution

Let $C:\ x = f(t),\ y = g(t),\ \alpha \le t \le \beta$, with $f'$ and $g'$ continuous. In $\int y\,dx$ use the substitution $x = f(t)$ (and $y \to g(t)$):

- $x = f(t) \;\Rightarrow\; dx = f'(t)\,dt$;
- the limits: $x = a = f(t) \Rightarrow t = \alpha$ or $\beta$; $\;x = b = f(t) \Rightarrow t = \beta$ or $\alpha$ (which one depends on the direction of motion).

:::definition[Area under a parametric curve]
$$A = \int_\alpha^\beta g(t)\,f'(t)\,dt \qquad\text{or}\qquad A = \int_\beta^\alpha g(t)\,f'(t)\,dt \qquad\Big(\text{equivalently } A = \int y(t)\,x'(t)\,dt\Big)$$
Use whichever order of limits makes $A \ge 0$: the lower limit is the $t$ that gives $x = a$, the upper limit the $t$ that gives $x = b$.
:::

### The other orientation: $x = f(y)$

If the region is described by $x = f(y) \ge 0$ for $c \le y \le d$ (area between the curve and the $y$-axis), then $A = \displaystyle\int_{y=c}^{y=d} x\,dy$, and the same substitution $y = g(t) \Rightarrow dy = g'(t)\,dt$ gives

:::definition[Area beside a parametric curve]
$$A = \int_\alpha^\beta x(t)\,y'(t)\,dt \qquad\text{or}\qquad \int_\beta^\alpha x(t)\,y'(t)\,dt .$$
:::

### Example — a quarter of the circle

::::example[A quarter of the circle]
For the circle $x = 2\cos t,\ y = 2\sin t$, find the area of the quarter disc in the first quadrant, once as $\int y\,dx$ and once as $\int x\,dy$.

:::solution
**As $\int y\,dx$.** Here $x$ runs from $0$ to $2$. Since $x = 0 \Leftrightarrow t = \pi/2$ and $x = 2 \Leftrightarrow t = 0$, and $dx = x'(t)\,dt = -2\sin t\,dt$:
 $$A_1 = \int_{x=0}^{x=2} y\,dx = \int_{t=\pi/2}^{t=0} y(t)\,x'(t)\,dt = \int_{\pi/2}^{0} 2\sin t\,(-2\sin t)\,dt = -4\int_{\pi/2}^{0}\sin^2 t\,dt = 4\int_{0}^{\pi/2}\sin^2 t\,dt .$$
With the half-angle identity $\sin^2 t = \dfrac{1 - \cos 2t}{2}$:
 $$A_1 = 4\int_0^{\pi/2}\frac{1-\cos 2t}{2}\,dt = 2\left[\,t - \frac{\sin 2t}{2}\,\right]_0^{\pi/2} = 2\cdot\frac{\pi}{2} = \pi .$$
So the quarter has area $\pi$ and the whole circle has $A = 4\pi$ — which matches $\pi r^2 = \pi\cdot 2^2$ ✓.
**As $\int x\,dy$.** The region $A_2$ between the same arc and the $y$-axis, for $0 \le y \le 2$. Now $y = 0 \Leftrightarrow t = 0$, $y = 2 \Leftrightarrow t = \pi/2$ and $dy = y'(t)\,dt = 2\cos t\,dt$:
 $$A_2 = \int_{y=0}^{y=2} x\,dy = \int_0^{\pi/2} x(t)\,y'(t)\,dt = \int_0^{\pi/2} 2\cos t\cdot 2\cos t\,dt = 4\int_0^{\pi/2}\cos^2 t\,dt = \dots = \pi .$$
Same quarter-disc, same answer — as it must be.
:::
::::

```sim
id: param-area
controls:
  - {id: tcur, label: "Upper parameter t (\xD7 \u03C0/2)", min: 0.02, max: 1, step: 0.02, default: 1, decimals: 2}
note: The shaded region is under the arc x = 2 cos t, y = 2 sin t from t = 0 up to the chosen t, i.e. between the arc and the x-axis. The running value is ∫ y(t) x′(t) dt (taken with the correct orientation); at t = π/2 it equals π.
...
```

```python
# The two integrals. Note the reversed limits (π/2 → 0) in A1: they
# come from converting the x-limits 0 → 2 into t-limits, and the negative x′(t) makes
# the result positive.
import sympy as sp

t = sp.symbols('t', real=True)
x = 2*sp.cos(t)
y = 2*sp.sin(t)

# A1 = int_{x=0}^{x=2} y dx  ->  t from pi/2 (x=0) down to 0 (x=2)
A1 = sp.integrate(y * sp.diff(x, t), (t, sp.pi/2, 0))
# A2 = int_{y=0}^{y=2} x dy  ->  t from 0 (y=0) up to pi/2 (y=2)
A2 = sp.integrate(x * sp.diff(y, t), (t, 0, sp.pi/2))

print('A1 =', sp.simplify(A1))   # pi
print('A2 =', sp.simplify(A2))   # pi
print('full circle =', 4*A1)     # 4*pi  (= pi * r^2 with r = 2)
```

:::note
Bookkeeping tip: the sign takes care of itself if you always put the $t$ that gives the *lower* $x$-limit (or $y$-limit) at the bottom of the integral. In $A_1$ that forced the order $\pi/2 \to 0$, and the negative $x'(t)$ then flipped it back to a positive area.
:::

:::insight
Area on a parametric curve is just the substitution x = f(t) inside ∫ y dx: replace y by g(t), dx by f′(t) dt, and convert the x-limits into t-limits (watch the direction of motion).
:::

:::equations
- *Area under y = f(x)*: $A = \int_a^b y\,dx$ — f(x) ≥ 0, continuous on [a, b].
- *Parametric area (under the curve)*: $A = \int_\alpha^\beta g(t)\,f'(t)\,dt = \int y(t)\,x'(t)\,dt$ — Substitution x = f(t), dx = f′(t) dt; order of limits chosen so A ≥ 0.
- *Parametric area (beside the curve, x = f(y))*: $A = \int_c^d x\,dy = \int_\alpha^\beta x(t)\,y'(t)\,dt$ — Same idea with the roles of x and y swapped.
- *Quarter circle*: $A_1 = 4\int_0^{\pi/2}\sin^2 t\,dt = 2\Big[t - \tfrac{\sin 2t}{2}\Big]_0^{\pi/2} = \pi$ — Full circle 4π = π·2², as expected.
:::

## Further reading

- [Paul's Online Notes — Parametric Equations and Curves](https://tutorial.math.lamar.edu/Classes/CalcII/ParametricEqn.aspx) — Many fully worked sketching examples with direction of motion, with direction of motion.
- [Paul's Online Notes — Parametric Equations and Curves](https://tutorial.math.lamar.edu/Classes/CalcII/ParametricEqn.aspx) — More examples of eliminating the parameter and finding the direction of motion.
- [Paul's Online Notes — Parametric Equations and Curves](https://tutorial.math.lamar.edu/Classes/CalcII/ParametricEqn.aspx) — Includes examples of parametrising a segment between two points.
- [Paul's Online Notes — Parametric Equations (circle & ellipse examples)](https://tutorial.math.lamar.edu/Classes/CalcII/ParametricEqn.aspx) — Discusses how changing to cos(nt), sin(nt) changes the number of traversals.
- [Paul's Online Notes — Tangents with Parametric Equations](https://tutorial.math.lamar.edu/Classes/CalcII/ParaTangent.aspx) — The dy/dx = (dy/dt)/(dx/dt) formula with horizontal/vertical tangent examples, plus the second derivative.
- [Paul's Online Notes — Area with Parametric Equations](https://tutorial.math.lamar.edu/Classes/CalcII/ParaArea.aspx) — Derivation of A = ∫ g(t) f′(t) dt and a discussion of the orientation of the limits.
