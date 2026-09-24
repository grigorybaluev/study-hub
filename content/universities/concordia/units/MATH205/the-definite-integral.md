---
title: The definite integral
order: 2
status: detailed
notes: ["Lecture 2 handout — learning/Slides/Lecture2.pdf (Stewart 5.2: partition, Riemann sum, norm, definition, integrability, properties)"]
weeks: [1]
textbook: "Stewart, Calculus: Early Transcendentals, 5.2"
introduces: [integral]
requires:
  - {concept: riemann-sum, strength: hard}
  - {concept: limit, strength: hard}
  - {concept: continuity, strength: hard}
reinforces: []
---

The area recipe of lecture 1 is turned into a definition that does not need $f \ge 0$,
equal subintervals, or any particular sample points. The result — the **definite
integral** — is a number attached to a function and an interval, with a short list of
algebraic properties that do most of the routine work.

## Partitions and Riemann sums

:::definition[Partition]
A **partition** of $[a, b]$ is a finite set of points $P = \{x_0, x_1, \dots, x_n\}$ with $a = x_0 < x_1 < \dots < x_n = b$. The subintervals $[x_{i-1}, x_i]$ have widths $\Delta x_i = x_i - x_{i-1}$, not necessarily equal.
:::

:::definition[Riemann sum]
**Sample points** are any $x_i^* \in [x_{i-1}, x_i]$, one per subinterval. The **Riemann sum**
of $f$ for $P$ and these sample points is

$$
S_P = \sum_{i=1}^{n} f(x_i^*)\,\Delta x_i .
$$
:::

:::definition[Norm of a partition]
The **norm** of the partition is its widest piece: $\lVert P \rVert = \max_i \Delta x_i$.
:::

Letting the norm go to zero is the honest version of "$n \to \infty$": it forces *every*
subinterval to shrink, not just the average one.

## The definite integral

:::definition[Definite integral]
The **definite integral of $f$ from $a$ to $b$** is

$$
\int_a^b f(x)\,dx = \lim_{\lVert P \rVert \to 0} \sum_{i=1}^{n} f(x_i^*)\,\Delta x_i ,
$$

provided the limit exists and is the same for every choice of partitions and sample points.
Then $f$ is **integrable** on $[a, b]$.
:::

Vocabulary: $f$ is the *integrand*, $a$ and $b$ the *limits of integration*, $dx$ the
*variable of integration* — a dummy name, so $\int_a^b f(x)\,dx = \int_a^b f(t)\,dt$.

:::theorem[Integrability]
If $f$ is continuous on $[a, b]$, or has only finitely many jump discontinuities there, then
$f$ is integrable on $[a, b]$.
:::

::::example[$\int_0^2 x^2\,dx$ from the definition]
Compute $\int_0^2 x^2\,dx$ from the definition, with equal subintervals and right endpoints.
Would other sample points change the answer?

:::solution
This is the limit computed in lecture 1: $R_n \to \frac{8}{3}$. Because $x^2$ is continuous it
is integrable, so any other sample points give the same limit — that is what "integrable"
guarantees.
:::
::::

```sim
id: calc-signed-area
controls:
  - {id: b, label: "Upper limit b", min: 0, max: 6.28, step: 0.02, default: 4.5, decimals: 2}
note: 'The integral of sin x from 0 to b equals 1 − cos b. The green region counts positively, the red one negatively; at b = 2π the two cancel exactly and the integral is 0 although the shaded area is 4.'
```

```python
# ∫₀ᵇ sin x dx = 1 − cos b counts area below the axis as negative; the unsigned
# area adds the two pieces with their signs removed.
from math import sin, cos, pi

def signed(b): return 1 - cos(b)
def unsigned(b): return signed(min(b, pi)) + (cos(b) + 1 if b > pi else 0)   # positive hump + |negative part|

for b in (4.5, pi, 2*pi):                                # the sim's default is b = 4.5
    print(f'b = {b:.4f}: integral {signed(b):.4f}, unsigned area {unsigned(b):.4f}')
# Output:
#   b = 4.5000: integral 1.2108, unsigned area 2.7892
#   b = 3.1416: integral 2.0000, unsigned area 2.0000
#   b = 6.2832: integral 0.0000, unsigned area 4.0000
```

:::insight[Signed area]
Where $f < 0$ the terms $f(x_i^*)\,\Delta x_i$ are negative, so the integral counts area
*below* the axis with a minus sign:

$$
\int_a^b f\,dx = (\text{area above}) - (\text{area below}).
$$

The integral is a net quantity; the geometric area is $\int_a^b |f|\,dx$.
:::

## Properties of the definite integral

::::proposition[Properties of the definite integral]
1. **Reversing the limits.** $\displaystyle\int_b^a f(x)\,dx = -\int_a^b f(x)\,dx$ — every $\Delta x_i$ changes sign.
2. **Zero width.** $\displaystyle\int_a^a f(x)\,dx = 0$.
3. **Constant.** $\displaystyle\int_a^b c\,dx = c\,(b - a)$ — a rectangle.
4. **Linearity.** $\displaystyle\int_a^b \big(f(x) \pm g(x)\big)\,dx = \int_a^b f(x)\,dx \pm \int_a^b g(x)\,dx$ and $\displaystyle\int_a^b c f(x)\,dx = c\int_a^b f(x)\,dx$.
5. **Additivity over adjacent intervals.** $\displaystyle\int_a^c f(x)\,dx + \int_c^b f(x)\,dx = \int_a^b f(x)\,dx$, for any $c$ — even one outside $[a, b]$, thanks to property 1.
6. **Comparison.**
   (a) if $f(x) \ge 0$ on $[a, b]$ then $\int_a^b f\,dx \ge 0$;
   (b) if $f(x) \ge g(x)$ on $[a, b]$ then $\int_a^b f\,dx \ge \int_a^b g\,dx$;
   (c) if $m \le f(x) \le M$ on $[a, b]$ then $m(b - a) \le \int_a^b f\,dx \le M(b - a)$.

:::proof
Each follows from the Riemann sums: reversing the limits flips the sign of every
$\Delta x_i$; a zero-width interval has only zero-width pieces; sums of $f \pm g$ and $cf$ split
term by term; a partition of $[a, b]$ through $c$ splits the sum in two; and a sum of
non-negative (or ordered, or bounded) terms keeps that property in the limit.
:::
::::

::::example[Bounding an integral without computing it]
Bound $\int_0^1 e^{-x^2}\,dx$ above and below without evaluating it.

:::solution
On $[0, 1]$ the integrand lies between $e^{-1}$ and $1$, so by 6(c)

$$
0.37 \approx e^{-1} \le \int_0^1 e^{-x^2}\,dx \le 1 .
$$

(The true value is $\approx 0.747$.) Comparison bounds are the tool for integrals with no
elementary antiderivative — this one has none.
:::
::::

:::caution
There is no "product rule" for integrals: $\int f g \ne \int f \cdot \int g$.
Linearity covers sums and constant multiples only.
:::

:::equations
- $\displaystyle\int_a^b f(x)\,dx = \lim_{\lVert P \rVert \to 0}\sum_{i=1}^n f(x_i^*)\,\Delta x_i$
- equal widths: $\Delta x = \dfrac{b-a}{n}$, right endpoints $x_i = a + i\,\Delta x$
- $\displaystyle\int_a^b f\,dx = \int_a^c f\,dx + \int_c^b f\,dx$; $\ m(b-a) \le \int_a^b f\,dx \le M(b-a)$
:::

## Further reading

- [Paul's Online Notes — Definition of the Definite Integral](https://tutorial.math.lamar.edu/Classes/CalcI/DefnOfDefiniteIntegral.aspx) — The limit definition, a worked limit, and the property list with proofs.
