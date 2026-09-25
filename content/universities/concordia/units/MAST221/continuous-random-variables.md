---
title: Continuous random variables and densities
order: 5
status: detailed
weeks: [3, 4]
introduces: [probability-density-function]
requires:
  - {concept: random-variable, strength: hard}
  - {concept: integral, strength: hard}
  - {concept: improper-integral, strength: hard}
reinforces:
  - {concept: random-variable, perspective: "continuous case"}
  - {concept: cumulative-distribution-function, perspective: "as an integral of the density"}
---

Spin a pointer and read off where it stops; measure a waiting time, a length, a temperature.
The possible values fill an interval, the sample space is uncountable, and the pmf of the last
unit breaks down: every single value has probability zero, yet some intervals are likelier than
others. The fix is to describe probability not point by point but as **area under a curve**, the
density. Sums over values become integrals, and the distribution function, which never needed
the pmf in its definition, carries over unchanged.

## Continuous random variables

### The pointer

A pointer pivots at the centre of a dial and is spun; it stops at the angle $2\pi\theta$ with
$\theta \in (0, 1]$. Take $S = (0, 1]$, let every stopping point be "equally likely", and let
$X(\theta) = \theta$. Equally likely now means that the probability of landing in an interval is
proportional to its length:

$$
P\!\left(0 < X \le \tfrac13\right) = \tfrac13
\qquad
P\!\left(\tfrac13 < X \le \tfrac12\right) = \tfrac16 .
$$

And a single point? $P(X = \frac12) \le P(\frac12 - h < X \le \frac12) = h$ for every $h > 0$, so
$P(X = \frac12) = 0$. Every individual value has probability zero, so no list of point
probabilities can describe $X$; the description has to be through intervals.

### Densities

:::definition[Probability density function]
A random variable $X$ is **continuous** when there is a function $f$, its **probability density
function** (density), such that for all $a \le b$

$$
P(a < X \le b) = \int_a^b f(x)\,dx .
$$

The probability of an interval is the area under the graph of $f$ over it.
:::

::::theorem[What makes a density]
A function $f$ is the density of some continuous random variable exactly when

1. $f(x) \ge 0$ for all $x$, and
2. $\displaystyle\int_{-\infty}^{\infty} f(x)\,dx = 1$.

:::proof
For a density, (1) is needed because a negative value would make the integral over a small
interval around that point negative; (2) is $P(-\infty < X < \infty) = P(S) = 1$. Conversely,
any $f$ with (1) and (2) defines a distribution function $F(x) = \int_{-\infty}^x f(t)\,dt$ with
the properties of the next part, and a random variable with that distribution.
:::
::::

::::proposition[Single points have probability zero]
If $X$ is continuous, then $P(X = a) = 0$ for every $a$. Consequently

$$
P(a < X \le b) = P(a \le X \le b) = P(a < X < b) = P(a \le X < b).
$$

:::proof
For every $h > 0$, $P(X = a) \le P(a - h < X \le a) = \int_{a-h}^{a} f(x)\,dx$, and the integral
tends to $\int_a^a f(x)\,dx = 0$ as $h \to 0$. Adding or removing an endpoint changes an
interval's probability by $P(X = a) = 0$.
:::
::::

::::example[Finding the constant]
For which $c$ is $f(x) = c\,x(1 - x)$ on $0 < x < 1$ (and $0$ elsewhere) a density? Find
$P(X \le \frac13)$.

:::solution
$f \ge 0$ on $(0,1)$ when $c > 0$, and

$$
\int_0^1 c\,x(1 - x)\,dx = c\left(\frac12 - \frac13\right) = \frac{c}{6} = 1
\quad\Longrightarrow\quad c = 6 .
$$

Then

$$
P\!\left(X \le \tfrac13\right) = \int_0^{1/3} 6x(1 - x)\,dx = \Big[\,3x^2 - 2x^3\,\Big]_0^{1/3} = \frac13 - \frac{2}{27} = \frac{7}{27} \approx 0.26 .
$$
:::
::::

::::example[An exponential density]
Let $f(x) = e^{-x}$ for $x > 0$ and $0$ for $x \le 0$. Check that $f$ is a density and find
$P(0 < X \le 1)$, $P(X > 1)$ and $P(1 < X \le 2)$.

:::solution
$f \ge 0$ and $\int_0^\infty e^{-x}\,dx = \lim_{b \to \infty}(1 - e^{-b}) = 1$. The lower limit
may be $0$ instead of $-\infty$ because $f$ vanishes on the negative axis. Then

$$
P(0 < X \le 1) = 1 - e^{-1} \approx 0.63
\qquad
P(X > 1) = e^{-1} \approx 0.37
\qquad
P(1 < X \le 2) = e^{-1} - e^{-2} \approx 0.23 .
$$
:::
::::

:::caution
$f(x)$ is **not** a probability, and it can be larger than 1: the uniform density on
$(0, \frac12)$ is $f(x) = 2$ there. Only areas under $f$ are probabilities. Near a point,
$P(x < X \le x + \Delta x) \approx f(x)\,\Delta x$: the density is probability *per unit length*.
:::

## The distribution function of a continuous variable

### Integral and derivative

The definition $F(x) = P(X \le x)$ from the discrete case applies word for word. What changes is
how $F$ is computed.

:::definition[Distribution function of a continuous variable]
If $X$ has density $f$, its distribution function is

$$
F(x) = P(X \le x) = \int_{-\infty}^{x} f(t)\,dt, \qquad -\infty < x < \infty .
$$
:::

::::theorem[Density and distribution function]
If $X$ has density $f$ and distribution function $F$, then

1. $F$ is continuous, non-decreasing, $F(-\infty) = 0$ and $F(\infty) = 1$;
2. $P(a < X \le b) = F(b) - F(a)$;
3. $f(x) = F'(x)$ wherever $f$ is continuous.

:::proof
(2) is the additivity of the integral: $\int_{-\infty}^{b} f = \int_{-\infty}^{a} f + \int_a^b f$.
(3) is the fundamental theorem of calculus applied to $F(x) = \int_{-\infty}^x f(t)\,dt$. For (1),
$F$ is non-decreasing because its increments $\int_a^b f$ are non-negative, continuous because
those increments shrink to $0$ with $b - a$, and its limits are $\int_{-\infty}^{-\infty} f = 0$
and $\int_{-\infty}^{\infty} f = 1$.
:::
::::

::::example[The pointer]
Write out $F$ and $f$ for the pointer, and find $P(\frac13 < X \le \frac12)$ from each.

:::solution
From $P(0 < X \le x) = x$ on $(0, 1]$:

$$
F(x) = \begin{cases} 0, & x \le 0, \\ x, & 0 < x \le 1, \\ 1, & 1 < x, \end{cases}
\qquad
f(x) = F'(x) = \begin{cases} 1, & 0 < x \le 1, \\ 0, & \text{otherwise.} \end{cases}
$$

$F(\frac12) - F(\frac13) = \frac16$, and $\int_{1/3}^{1/2} 1\,dx = \frac16$ — the shaded area under
the flat density. ($F$ has corners at $0$ and $1$, where $f$ jumps; there $f$ may be given either
value without changing any probability.)
:::
::::

::::example[A triangular density]
Let $f(x) = 1 - |x|$ for $-1 < x < 1$ and $0$ elsewhere. Find $F$, and $P(|X| \le \frac12)$.

:::solution
Integrate piece by piece, starting from the left, where $F = 0$:

$$
F(x) = \begin{cases} 0, & x \le -1, \\ \tfrac12 (x + 1)^2, & -1 < x \le 0, \\ 1 - \tfrac12 (1 - x)^2, & 0 < x \le 1, \\ 1, & x > 1. \end{cases}
$$

(On $(0, 1]$: $F(x) = F(0) + \int_0^x (1 - t)\,dt = \frac12 + x - \frac{x^2}{2}$, which is the same
expression.) Then

$$
P\!\left(|X| \le \tfrac12\right) = F\!\left(\tfrac12\right) - F\!\left(-\tfrac12\right) = \frac78 - \frac18 = \frac34 .
$$
:::
::::

::::example[A family of densities]
For a positive integer $n$ let $f(x) = c\,x^n(1 - x^n)$ on $[0, 1]$ and $0$ elsewhere. Find $c$,
the distribution function, and what happens to $P(X \le \frac12)$ as $n$ grows.

:::solution
$\int_0^1 (x^n - x^{2n})\,dx = \frac{1}{n+1} - \frac{1}{2n+1} = \frac{n}{(n+1)(2n+1)}$, so

$$
c = \frac{(n+1)(2n+1)}{n}
\qquad
F(x) = c\left(\frac{x^{n+1}}{n+1} - \frac{x^{2n+1}}{2n+1}\right), \quad 0 \le x \le 1 .
$$

For large $n$, $c \approx 2n$ and $F(\frac12) \approx 2n \cdot \frac{(1/2)^{n+1}}{n} = \frac{1}{2^n} \to 0$:
the mass piles up near $x = 1$. The density's peak grows with $n$ while the total area stays 1.
:::
::::

:::equations
- *Density*: $P(a < X \le b) = \int_a^b f(x)\,dx$, with $f \ge 0$ and $\int_{-\infty}^{\infty} f = 1$.
- *Points*: $P(X = a) = 0$, so the endpoints of an interval do not matter.
- *Distribution function*: $F(x) = \int_{-\infty}^{x} f(t)\,dt$ and $f = F'$.
- *Intervals*: $P(a < X \le b) = F(b) - F(a)$.
:::

```sim
id: density-area
controls:
  - {id: dens, label: "density (0: pointer, 1: e^(−x), 2: triangle, 3: c·xⁿ(1 − xⁿ))", min: 0, max: 3, step: 1, default: 1, decimals: 0}
  - {id: a, label: a, min: -1.5, max: 4, step: 0.05, default: 1, decimals: 2}
  - {id: b, label: b, min: -1.5, max: 4, step: 0.05, default: 2, decimals: 2}
  - {id: n, label: "n (density 3)", min: 1, max: 16, step: 1, default: 2, decimals: 0}
note: "Top: the density, with the area over (a, b] shaded. Bottom: the distribution function, with the yellow bar F(b) − F(a) — the same number as the shaded area. The defaults are the e^(−x) example, P(1 < X ≤ 2) ≈ 0.23. Pick density 3 and raise n to watch the mass move towards 1 while the area stays 1."
```

```python
# A density, its distribution function, and an interval probability, three ways:
# integrating f, subtracting values of F, and simulating.
import numpy as np
from scipy import integrate, stats

f = lambda x: np.exp(-x) * (x > 0)          # the density e^(-x), x > 0
F = lambda x: (1 - np.exp(-x)) * (x > 0)    # its distribution function

a, b = 1, 2
area, _ = integrate.quad(f, a, b)
print(f'integral of f over (a, b]: {area:.4f}')         # 0.2325
print(f'F(b) - F(a):               {F(b) - F(a):.4f}')   # 0.2325

rng = np.random.default_rng(0)
x = rng.exponential(size=100_000)                       # draws from this density
print(f'share of draws in (a, b]:  {np.mean((x > a) & (x <= b)):.4f}')

# The same distribution in scipy.stats: expon has pdf e^(-x) on x > 0.
print(stats.expon.cdf(b) - stats.expon.cdf(a))
```

:::insight
Every formula of the discrete case survives with $\sum_x p(x)$ replaced by $\int f(x)\,dx$, and the
distribution function is the bridge: it is defined the same way for both kinds of random variable,
and $P(a < X \le b) = F(b) - F(a)$ holds for both.
:::

## Further reading

- [Probability density function](https://en.wikipedia.org/wiki/Probability_density_function) — Wikipedia, including densities that exceed 1.
- [Seeing Theory — Probability Distributions](https://seeing-theory.brown.edu/probability-distributions/index.html) — continuous densities and their distribution functions, interactively.
- [OpenStax Introductory Statistics — 5.1 Continuous Probability Functions](https://openstax.org/books/introductory-statistics/pages/5-1-continuous-probability-functions) — probability as area, with worked examples.
