---
title: Antiderivatives
order: 3
status: detailed
notes: ["Lecture 3 handout — learning/Slides/Lecture3.pdf (Stewart 4.9: definition, table of antiderivatives, linearity rules)"]
weeks: [2]
textbook: "Stewart, Calculus: Early Transcendentals, 4.9"
introduces: [antiderivative]
requires:
  - {concept: derivative, strength: hard}
  - {concept: trigonometric-functions, strength: hard}
reinforces: []
---

Differentiation run backwards. Given $f$, which functions $F$ have $F' = f$? The answer
is a whole family, one member per constant, and a table of the standard ones is read
straight off the derivative table. This lecture has nothing to do with area yet — the
connection to the definite integral is the fundamental theorem of the next lecture.

## Definition

:::definition[Antiderivative]
A function $F$ is an **antiderivative** of $f$ on an interval $I$ if $F'(x) = f(x)$ for every $x \in I$.
:::

::::theorem[All antiderivatives on an interval]
If $F$ is one antiderivative of $f$ on an interval $I$, then every antiderivative of $f$ on
$I$ has the form $F(x) + C$ for some constant $C$.

:::proof
If $G$ is another antiderivative, then $(G - F)' = f - f = 0$ on $I$. By the mean value
theorem, a function with zero derivative on an interval is constant there, so $G - F = C$.
:::
::::

The "on an interval" matters: $\ln|x|$ is an antiderivative of $1/x$ on $(0, \infty)$ and
on $(-\infty, 0)$ separately, and the two constants need not agree.

```sim
id: calc-antiderivative-family
controls:
  - {id: C, label: "Constant C", min: -3, max: 3, step: 0.25, default: 0, decimals: 2}
  - {id: x0, label: "Point x₀", min: -3, max: 3, step: 0.1, default: 1, decimals: 1}
note: 'f(x) = cos x (top) and the family F(x) = sin x + C (bottom). Move C: the curve slides vertically but the tangent slope at x₀ stays equal to f(x₀) — the whole family answers the same question.'
```

```python
# Every antiderivative F(x) = sin x + C of f(x) = cos x has the same slope at x₀:
# the constant moves the curve up and down, never its tangent direction.
from math import sin, cos

x0, h = 1.0, 1e-6                                        # the sim's default x₀ = 1
for C in (-2, 0, 1.5):
    F = lambda x: sin(x) + C
    slope = (F(x0 + h) - F(x0 - h)) / (2*h)             # numerical F'(x₀)
    print(f'C = {C:>4}: F(x0) = {F(x0):.3f}, F\'(x0) = {slope:.3f}')
print('f(x0) = cos 1 =', round(cos(x0), 3))
# Output:
#   C =   -2: F(x0) = -1.159, F'(x0) = 0.540
#   C =    0: F(x0) = 0.841, F'(x0) = 0.540
#   C =  1.5: F(x0) = 2.341, F'(x0) = 0.540
#   f(x0) = cos 1 = 0.54
```

:::insight
Antidifferentiation is *not* unique, but it is unique up to a constant. Geometrically the
family $F + C$ is one curve slid up and down: every member has the same slope $f(x)$ at every
$x$, so the curves never cross.
:::

## Table of antiderivatives

Each line is a derivative formula read right to left. The factor $k$ inside is handled by
dividing by $k$ — the chain rule in reverse.

| $f(x)$ | an antiderivative $F(x)$ |
|---|---|
| $x^n\ (n \ne -1)$ | $\dfrac{x^{n+1}}{n+1}$ |
| $\dfrac{1}{x}$ | $\ln\lvert x\rvert$ |
| $e^{kx}$ | $\dfrac{1}{k}e^{kx}$ |
| $a^{kx}\ (a > 0,\ a \ne 1)$ | $\dfrac{a^{kx}}{k\ln a}$ |
| $\sin kx$ | $-\dfrac{1}{k}\cos kx$ |
| $\cos kx$ | $\dfrac{1}{k}\sin kx$ |
| $\sec^2 kx$ | $\dfrac{1}{k}\tan kx$ |
| $\csc^2 kx$ | $-\dfrac{1}{k}\cot kx$ |
| $\dfrac{1}{\sqrt{1 - k^2x^2}}$ | $\dfrac{1}{k}\sin^{-1} kx$ |
| $\dfrac{1}{1 + k^2x^2}$ | $\dfrac{1}{k}\tan^{-1} kx$ |

:::caution
The power rule fails at $n = -1$: $x^{-1}$ has antiderivative $\ln|x|$, not
$x^0/0$. And $\sec^2$ goes to $\tan$, $\csc^2$ to $-\cot$ — the minus sign is on the
co-functions.
:::

## Linearity rules

Because differentiation is linear, so is antidifferentiation. If $F' = f$ and $G' = g$:

- **constant multiple** — $kf$ has antiderivative $kF$;
- **negative** — $-f$ has antiderivative $-F$;
- **sum / difference** — $f \pm g$ has antiderivative $F \pm G$.

::::example[A sum, term by term]
Find all antiderivatives of $f(x) = 3x^2 - 2\sin 2x + \dfrac{4}{x}$.

:::solution
Term by term:

$$
F(x) = x^3 + \cos 2x + 4\ln|x| + C .
$$

Check by differentiating: $3x^2 - 2\sin 2x + 4/x$ ✓. One constant $C$ suffices for the whole
sum — three separate constants would just add up to one.
:::
::::

::::example[An initial-value problem]
A particle has acceleration $a(t) = 6t$, initial velocity $v(0) = 2$ and initial position
$s(0) = 1$. Find its position $s(t)$.

:::solution
Antidifferentiate once: $v(t) = 3t^2 + C_1$, and $v(0) = 2$ gives $C_1 = 2$. Again:
$s(t) = t^3 + 2t + C_2$, and $s(0) = 1$ gives $C_2 = 1$, so

$$
s(t) = t^3 + 2t + 1 .
$$

Each antidifferentiation introduces one constant, and each initial condition fixes one.
:::
::::

:::note
Not every function has an *elementary* antiderivative: $e^{-x^2}$, $\sin(x^2)$
and $\sin x / x$ all have antiderivatives (the fundamental theorem will construct
them) but none can be written with the functions in the table.
:::

:::equations
- $F' = f \Rightarrow$ every antiderivative is $F + C$ (on an interval)
- $\displaystyle x^n \to \frac{x^{n+1}}{n+1}\ (n \ne -1)$, $\ \frac{1}{x} \to \ln|x|$, $\ e^{kx} \to \frac{e^{kx}}{k}$
- $\sin kx \to -\dfrac{\cos kx}{k}$, $\ \cos kx \to \dfrac{\sin kx}{k}$, $\ \dfrac{1}{1+k^2x^2} \to \dfrac{\tan^{-1}kx}{k}$
:::

## Further reading

- [Paul's Online Notes — Indefinite Integrals](https://tutorial.math.lamar.edu/Classes/CalcI/IndefiniteIntegrals.aspx) — Antiderivatives and the constant of integration, with the "differentiate to check" habit.
- [Paul's Online Notes — Computing Indefinite Integrals](https://tutorial.math.lamar.edu/Classes/CalcI/ComputingIndefiniteIntegrals.aspx) — The basic table in use.
