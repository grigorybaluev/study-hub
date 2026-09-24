---
title: Area between curves and average value
order: 8
status: detailed
notes: ["Lecture 8 handout — learning/Slides/Lecture8.pdf (Stewart 6.1: area between curves in x and in y; 6.5: average value, mean value theorem for integrals)"]
weeks: [3]
textbook: "Stewart, Calculus: Early Transcendentals, 6.1 and 6.5"
introduces: []
requires:
  - {concept: integral, strength: hard}
  - {concept: fundamental-theorem-of-calculus, strength: hard}
reinforces:
  - {concept: integral, perspective: "the area between two curves, and the average value of a function with the mean value theorem for integrals"}
---

Two direct uses of the definite integral. The first generalises "area under a curve" to
"area between two curves", which is where the sign of the integrand starts to matter;
the second answers "what is the average of a function over an interval?" and revisits
the mean value theorem for integrals from lecture 4.

## Area between curves

Slice the region between $y = f(x)$ (top) and $y = g(x)$ (bottom) into thin vertical
strips of width $\Delta x$. Each strip is nearly a rectangle of height $f(x_i^*) - g(x_i^*)$,
so the area is a Riemann-sum limit:

::::proposition[Area between curves]
1. If $f$ and $g$ are continuous and $f(x) \ge g(x)$ on $[a, b]$, the area between the curves
   from $x = a$ to $x = b$ is $A = \displaystyle\int_a^b \big[f(x) - g(x)\big]\,dx$.
2. Without the ordering assumption, $A = \displaystyle\int_a^b \big|f(x) - g(x)\big|\,dx$ — in
   practice, find where the curves cross, split the interval there, and put the upper curve
   first on each piece.
3. For a region bounded on the left and right by $x = g(y)$ and $x = f(y)$ between $y = c$ and
   $y = d$, use horizontal strips: $A = \displaystyle\int_c^d \big|f(y) - g(y)\big|\,dy$.

:::proof
Each strip is nearly a rectangle of height $|f(x_i^*) - g(x_i^*)|$ and width $\Delta x$, so the
area is the limit of $\sum |f(x_i^*) - g(x_i^*)|\,\Delta x$ — the integral in 2, which is the
integral in 1 when $f \ge g$. For 3, the same argument with strips of height $\Delta y$.
:::
::::

```sim
id: calc-area-between
controls:
  - {id: b, label: "Right edge b", min: 0.1, max: 3.14, step: 0.02, default: 2.2, decimals: 2}
note: 'The region between y = cos x and y = sin x from 0 to b. The curves cross at π/4; past it sin x is on top, so the integrand |sin x − cos x| switches which curve comes first. The title shows the two pieces added.'
```

```python
# Area between cos x and sin x on [0, b]: split at the crossing π/4 so the
# integrand is always top minus bottom.
from math import sin, cos, pi, sqrt

def area(b):
    c = pi/4
    A1 = sin(min(b, c)) + cos(min(b, c)) - 1             # ∫ (cos − sin) on [0, min(b, π/4)]
    A2 = sqrt(2) - cos(b) - sin(b) if b > c else 0       # ∫ (sin − cos) on [π/4, b]
    return A1, A2

A1, A2 = area(2.2)                                       # the sim's default b = 2.2
print(f'{A1:.4f} + {A2:.4f} = {A1 + A2:.4f}')
print(f'whole [0, π]: {sum(area(pi)):.4f}  (= 2√2)')
# Output:
#   0.4142 + 1.1942 = 1.6084
#   whole [0, π]: 2.8284  (= 2√2)
```

::::example[Curves that cross]
Find the area between $y = \sin x$ and $y = \cos x$ from $0$ to $\pi/2$.

:::solution
They cross where $\tan x = 1$, i.e. $x = \pi/4$. On $[0, \pi/4]$ cosine is on top, on
$[\pi/4, \pi/2]$ sine is:

$$
\begin{aligned}
A &= \int_0^{\pi/4}(\cos x - \sin x)\,dx + \int_{\pi/4}^{\pi/2}(\sin x - \cos x)\,dx \\
  &= \big[\sin x + \cos x\big]_0^{\pi/4} + \big[-\cos x - \sin x\big]_{\pi/4}^{\pi/2} \\
  &= (\sqrt2 - 1) + (\sqrt2 - 1) = 2\sqrt2 - 2 .
\end{aligned}
$$
:::
::::

::::example[Integrate in $y$]
Find the area of the region bounded by $y = x - 1$ and $y^2 = 2x + 6$.

:::solution
Solve both for $x$: the right curve is $x = y + 1$, the left curve $x = \tfrac12 y^2 - 3$; they
meet where $y + 1 = \tfrac12 y^2 - 3$, i.e. $y = -2$ and $y = 4$. So

$$
A = \int_{-2}^{4}\Big[(y + 1) - \big(\tfrac12 y^2 - 3\big)\Big]dy = \int_{-2}^4\Big(-\tfrac12 y^2 + y + 4\Big)dy = 18 .
$$

Vertical strips would need two integrals (the lower boundary switches from the parabola to
the line at $x = -1$); horizontal strips need one.
:::
::::

:::caution
$\int_a^b (f - g)\,dx$ with the curves in the wrong order gives a negative
"area". A negative answer to an area question means the order or the crossing points
were missed — recheck before moving on.
:::

## Average value of a function

The average of $n$ numbers is their sum over $n$. For a function on $[a, b]$, sample it at
$n$ points spaced $\Delta x = (b - a)/n$ apart, average the samples, and rewrite
$\frac{1}{n} = \frac{\Delta x}{b - a}$: the average is $\frac{1}{b-a}\sum f(x_i^*)\Delta x$, a
Riemann sum. In the limit:

:::definition[Average value]
The **average value** of $f$ on $[a, b]$ is

$$
f_{\text{av}} = \frac{1}{b - a}\int_a^b f(x)\,dx .
$$
:::

:::theorem[Mean value theorem for integrals]
If $f$ is continuous on $[a, b]$, there is a $c \in [a, b]$ with $f(c) = f_{\text{av}}$, i.e.
$\displaystyle\int_a^b f(x)\,dx = f(c)\,(b - a)$. (Proved in lecture 4.)
:::

Geometrically: a rectangle of height $f(c)$ on the base $[a, b]$ has exactly the area
under the curve — the part of the curve above the line $y = f_{\text{av}}$ balances the
part below.

```sim
id: calc-average-value
controls:
  - {id: b, label: "Right edge b", min: 0.5, max: 4, step: 0.05, default: 3, decimals: 2}
note: 'f(x) = x² on [0, b]. The dashed rectangle has height f_av = b²/3 and the same area as the region under the parabola; the marked point c = b/√3 is where f(c) = f_av, as the mean value theorem promises.'
```

```python
# Average value of f(x) = x² on [0, b] is b²/3, attained at c = b/√3 (mean value theorem).
from fractions import Fraction as F
from math import sqrt

b = 3                                                    # the sim's default
fav = F(b**3, 3) / b                                     # (1/b) ∫₀ᵇ x² dx
c = b / sqrt(3)
print('f_av =', fav, ' c =', round(c, 3), ' f(c) =', round(c**2, 3))
# Output:
#   f_av = 3  c = 1.732  f(c) = 3.0
```

::::example[An average and where it is attained]
Find the average value of $f(x) = 1 + x^2$ on $[-1, 2]$, and every $c$ where $f(c) = f_{\text{av}}$.

:::solution
$$
f_{\text{av}} = \frac{1}{3}\int_{-1}^{2}(1 + x^2)\,dx = \frac{1}{3}\Big[x + \tfrac{x^3}{3}\Big]_{-1}^{2} = \frac{1}{3}\cdot 6 = 2 .
$$

It is attained where $1 + c^2 = 2$, i.e. $c = 1$ — and the other root, $c = -1$, is also in
the interval.
:::
::::

:::insight
The average value is the height that makes a rectangle out of the
region. Later this becomes the expected value of a continuous random variable: the
integral of $x$ against a density is exactly a weighted average of this kind.
:::

:::equations
- $A = \displaystyle\int_a^b \big|f(x) - g(x)\big|\,dx$ (vertical strips), $\ A = \displaystyle\int_c^d \big|f(y) - g(y)\big|\,dy$ (horizontal strips)
- $f_{\text{av}} = \dfrac{1}{b-a}\displaystyle\int_a^b f(x)\,dx = f(c)$ for some $c \in [a, b]$
:::

## Further reading

- [Paul's Online Notes — Area Between Curves](https://tutorial.math.lamar.edu/Classes/CalcI/AreaBetweenCurves.aspx) — Vertical and horizontal strips, with the crossing-point bookkeeping.
- [Paul's Online Notes — Average Function Value](https://tutorial.math.lamar.edu/Classes/CalcI/AvgFcnValue.aspx) — Definition and the mean value theorem for integrals.
