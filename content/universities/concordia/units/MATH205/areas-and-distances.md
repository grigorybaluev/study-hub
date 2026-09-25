---
title: Areas and distances
order: 1
status: detailed
weeks: [1]
introduces: [riemann-sum]
requires:
  - {concept: limit, strength: hard}
  - {concept: function, strength: hard}
reinforces: []
---

Two questions that look unrelated — *how big is the region under a curve?* and *how far
did a moving object go?* — turn out to have the same answer: chop the interval into small
pieces, pretend the function is constant on each piece, add up, and let the pieces shrink.
The sum is a **Riemann sum**; the limit is the integral of the next lecture.

## The area problem

Take a continuous function $f \ge 0$ on $[a, b]$ and the region $S$ under its graph. No
formula from geometry applies to a curved top edge, so we approximate. Cut $[a, b]$ into
$n$ equal subintervals of width
$$\Delta x = \frac{b - a}{n},$$
with endpoints $x_0 = a,\ x_1 = a + \Delta x,\ \dots,\ x_n = b$. In each subinterval
$[x_{i-1}, x_i]$ pick a **sample point** $x_i^*$ and build the rectangle of height
$f(x_i^*)$. The $n$ rectangles together have area
$$A_n = f(x_1^*)\,\Delta x + f(x_2^*)\,\Delta x + \dots + f(x_n^*)\,\Delta x .$$

:::definition[Area under a curve]
The **area** of the region under the graph of a continuous $f \ge 0$ from $a$ to $b$ is the
limit of the approximating sums:

$$
A = \lim_{n \to \infty} A_n = \lim_{n \to \infty} \big(f(x_1^*)\,\Delta x + \dots + f(x_n^*)\,\Delta x\big).
$$
:::

The choice of sample point does not matter in the limit. Three standard choices:

- **left endpoints** $x_i^* = x_{i-1}$ — for an increasing $f$ the rectangles sit under the
  curve, so $L_n \le A$;
- **right endpoints** $x_i^* = x_i$ — for an increasing $f$ the rectangles poke above, so
  $R_n \ge A$;
- **midpoints** $x_i^* = \tfrac12(x_{i-1} + x_i)$ — usually the most accurate of the three.

```sim
id: calc-riemann-sums
controls:
  - {id: n, label: "Rectangles n", min: 1, max: 40, step: 1, default: 6, decimals: 0}
  - {id: rule, label: "Sample point (0 left, 1 right, 2 midpoint)", min: 0, max: 2, step: 1, default: 0, decimals: 0}
note: 'The region under y = x² on [0, 2] has area 8/3 ≈ 2.6667. Left endpoints underestimate, right endpoints overestimate, and the two are squeezed together as n grows; midpoints land close even for small n.'
```

```python
# Riemann sums for y = x² on [0, 2] (exact area 8/3): left endpoints undershoot,
# right endpoints overshoot, midpoints land close; all three meet as n grows.
def riemann(f, a, b, n, rule):
    dx = (b - a) / n
    shift = {'left': 0, 'right': dx, 'mid': dx / 2}[rule]
    return sum(f(a + i*dx + shift) for i in range(n)) * dx

f = lambda x: x**2
for n in (6, 60, 600):                                   # the sim's default is n = 6, left endpoints
    print(n, *(f'{rule} {riemann(f, 0, 2, n, rule):.4f}' for rule in ('left', 'right', 'mid')))
print('exact', round(8/3, 4))
# Output:
#   6 left 2.0370 right 3.3704 mid 2.6481
#   60 left 2.6004 right 2.7337 mid 2.6665
#   600 left 2.6600 right 2.6733 mid 2.6667
#   exact 2.6667
```

:::insight
For an increasing function the true area is squeezed: $L_n \le A \le R_n$,
and $R_n - L_n = \big(f(b) - f(a)\big)\Delta x \to 0$. That is *why* the limit exists — the
under- and over-estimates are forced together.
:::

## Sigma notation

Sums with many terms are written with $\Sigma$:
$$\sum_{i=1}^{n} a_i = a_1 + a_2 + \dots + a_n ,$$
and the area sum becomes $A_n = \sum_{i=1}^n f(x_i^*)\,\Delta x$.

Finite sums obey the same rules as ordinary addition:

- **sum / difference** — $\sum (a_i \pm b_i) = \sum a_i \pm \sum b_i$;
- **constant multiple** — $\sum c\,a_i = c \sum a_i$;
- **constant value** — $\sum_{i=1}^n c = cn$.

Three closed forms make "compute the limit by hand" possible:

:::equations
- $\displaystyle\sum_{i=1}^{n} i = \frac{n(n+1)}{2}$
- $\displaystyle\sum_{i=1}^{n} i^2 = \frac{n(n+1)(2n+1)}{6}$
- $\displaystyle\sum_{i=1}^{n} i^3 = \left(\frac{n(n+1)}{2}\right)^2$
:::

::::example[Area under $y = x^2$ by right endpoints]
Find the area under $y = x^2$ on $[0, 2]$ as the limit of the right-endpoint sums $R_n$.

:::solution
Here $\Delta x = 2/n$ and $x_i = 2i/n$, so

$$
R_n = \sum_{i=1}^n \left(\frac{2i}{n}\right)^2 \frac{2}{n} = \frac{8}{n^3}\sum_{i=1}^n i^2 = \frac{8}{n^3}\cdot\frac{n(n+1)(2n+1)}{6} .
$$

As $n \to \infty$ the fraction $\frac{(n+1)(2n+1)}{n^2} \to 2$, so $A = \frac{8}{6}\cdot 2 = \frac{8}{3}$.
:::
::::

## The distance problem

If an object moves with known velocity $v(t)$, the distance it covers in a short time
$\Delta t$ is about $v(t_i^*)\,\Delta t$ — "speed times time" as if the speed were
constant. Adding the pieces gives exactly a Riemann sum, so **distance travelled is the
area under the velocity graph**.

::::example[Total rainfall from a rate]
A rainfall rate is recorded in cm/h over a day, piecewise constant on the intervals 0–2 h
(0.5), 2–4 h (0.3), 4–9 h (1.0), 9–12 h (2.5), 12–20 h (1.5), 20–24 h (0.6). How much rain
fell in the day?

:::solution
The total is the sum of *rate × duration* over the pieces:

$$
0.5\cdot2 + 0.3\cdot2 + 1.0\cdot5 + 2.5\cdot3 + 1.5\cdot8 + 0.6\cdot4 = 28.6 \text{ cm}.
$$

On the graph of the rate this is the area of six rectangles — a Riemann sum where the
function really is constant on each piece, so no limit is needed.
:::
::::

:::note
The same recipe — *rate × small interval, add, refine* — will reappear for
volumes, work, average values and probabilities. Whenever a quantity accumulates at a
varying rate, its total is a Riemann-sum limit.
:::

## Further reading

- [Paul's Online Notes — Area Problem](https://tutorial.math.lamar.edu/Classes/CalcI/AreaProblem.aspx) — Left, right and midpoint rectangles with the same squeeze argument.
- [Paul's Online Notes — Summation Notation](https://tutorial.math.lamar.edu/Classes/CalcI/SummationNotation.aspx) — The three closed-form sums and the algebra of $\Sigma$.
