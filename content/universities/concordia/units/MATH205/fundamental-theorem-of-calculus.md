---
title: The fundamental theorem of calculus
order: 4
status: detailed
weeks: [2]
introduces: [fundamental-theorem-of-calculus]
requires:
  - {concept: integral, strength: hard}
  - {concept: antiderivative, strength: hard}
  - {concept: continuity, strength: hard}
reinforces: []
---

Lectures 2 and 3 built two things that look unrelated: a limit of sums (the definite
integral) and the reverse of differentiation (the antiderivative). The fundamental
theorem says they are the same thing seen from two sides — which is why "integrate" ends
up meaning "find an antiderivative and subtract".

## The mean value theorem for integrals

::::theorem[Mean value theorem for integrals]
If $f$ is continuous on $[a, b]$, then for some $c \in [a, b]$

$$
f(c) = \frac{1}{b - a}\int_a^b f(x)\,dx .
$$

:::proof
By the comparison property, $m(b-a) \le \int_a^b f \le M(b-a)$, where $m$ and $M$ are the
minimum and maximum of $f$ on $[a, b]$. So the average lies between the minimum and the
maximum, and by the intermediate value theorem it is a value $f(c)$.
:::
::::

In words: a continuous function attains its average value somewhere. This is the lemma that
makes Part I work.

## Part I — the accumulation function is an antiderivative

Fix the lower limit and let the upper limit move:
$$g(x) = \int_a^x f(t)\,dt, \qquad a \le x \le b .$$
$g(x)$ is "the area accumulated so far". Note the dummy variable $t$ inside; $x$ is the
upper limit and is *not* free to be reused as the variable of integration.

::::theorem[Fundamental theorem of calculus, Part I]
If $f$ is continuous on $[a, b]$, then $g(x) = \int_a^x f(t)\,dt$ is continuous on $[a, b]$,
differentiable on $(a, b)$, and $g'(x) = f(x)$.

:::proof
$g(x + h) - g(x) = \int_x^{x+h} f(t)\,dt$ (additivity), and by the mean value theorem for
integrals this equals $h\,f(c)$ for some $c$ between $x$ and $x + h$. Divide by $h$ and let
$h \to 0$: $c \to x$, and continuity gives $f(c) \to f(x)$.
:::
::::

::::example[Differentiating an accumulation function]
Find $\dfrac{d}{dx}\displaystyle\int_0^x \sqrt{1 + t^3}\,dt$ and $\dfrac{d}{dx}\displaystyle\int_1^{x^2} \cos t\,dt$.

:::solution
By Part I, directly: $\dfrac{d}{dx}\displaystyle\int_0^x \sqrt{1 + t^3}\,dt = \sqrt{1 + x^3}$. No
integration is performed; the theorem does it. With a composite upper limit, add the chain
rule:

$$
\frac{d}{dx}\int_1^{x^2} \cos t\,dt = \cos(x^2)\cdot 2x .
$$
:::
::::

```sim
id: calc-ftc-accumulation
controls:
  - {id: x, label: "Upper limit x", min: 0, max: 6.28, step: 0.02, default: 2, decimals: 2}
note: 'Top: f(t) = 1.2 + sin t with the accumulated region from 0 to x. Bottom: g(x) = ∫₀ˣ f(t) dt with its tangent at x. Drag x and watch the slope of g track the height of f — that is g′(x) = f(x).'
```

```python
# FTC part 1: g(x) = ∫₀ˣ f(t) dt accumulates area, and its slope at x is f(x).
from math import sin, cos

f = lambda t: 1.2 + sin(t)
g = lambda x: 1.2*x + 1 - cos(x)                         # the antiderivative with g(0) = 0

def area(a, b, n=1000):                                  # Simpson's rule, as a check on g
    h = (b - a) / n
    return h/3 * (f(a) + f(b) + sum((4 if i % 2 else 2) * f(a + i*h) for i in range(1, n)))

x, h = 2.0, 1e-6                                         # the sim's default x = 2
print(f'g(2) = {g(x):.3f}, shaded area = {area(0, x):.3f}')
print(f"g'(2) = {(g(x + h) - g(x - h)) / (2*h):.3f}, f(2) = {f(x):.3f}")
# Output:
#   g(2) = 3.816, shaded area = 3.816
#   g'(2) = 2.109, f(2) = 2.109
```

:::insight
Part I is an *existence* theorem: every continuous function has an antiderivative, namely its
accumulation function — even $e^{-t^2}$, which has no elementary one.
:::

## Part II — evaluate with any antiderivative

::::theorem[Fundamental theorem of calculus, Part II]
If $f$ is continuous on $[a, b]$ and $F$ is *any* antiderivative of $f$ there, then

$$
\int_a^b f(x)\,dx = F(b) - F(a) .
$$

:::proof
By Part I, $g(x) = \int_a^x f$ is an antiderivative, so $F = g + C$. Then
$F(b) - F(a) = g(b) - g(a) = \int_a^b f - 0$. The constant cancels — which is why the definite
integral never carries a $+C$.
:::
::::

Notation: $F(b) - F(a)$ is written $\big[F(x)\big]_a^b$ or $F(x)\big|_a^b$.

::::example[Two integrals in one line each]
Evaluate $\displaystyle\int_0^2 x^2\,dx$ and $\displaystyle\int_0^{\pi} \sin x\,dx$.

:::solution
$$
\int_0^2 x^2\,dx = \left[\frac{x^3}{3}\right]_0^2 = \frac{8}{3} - 0 = \frac{8}{3}
\qquad
\int_0^{\pi} \sin x\,dx = \big[-\cos x\big]_0^{\pi} = -\cos\pi - (-\cos 0) = 2
$$

The first is the limit of Riemann sums from lecture 1, now in one line.
:::
::::

:::caution
Part II needs $f$ continuous on the *whole* interval.
$\int_{-1}^{1} x^{-2}\,dx \ne \big[-1/x\big]_{-1}^{1} = -2$ — a positive function cannot
have a negative integral. The integrand blows up at $0$; this is an improper integral
(lecture 13), and it diverges.
:::

## Differentiation and integration as inverse processes

The two parts together:

:::equations
- $\displaystyle\frac{d}{dx}\int_a^x f(t)\,dt = f(x)$ — differentiate an integral and get the integrand back
- $\displaystyle\int_a^b F'(x)\,dx = F(b) - F(a)$ — integrate a derivative and get the net change of $F$
- $\displaystyle\frac{1}{b-a}\int_a^b f(x)\,dx = f(c)$ for some $c \in [a,b]$ (MVT for integrals)
:::

Each operation undoes the other, up to the constant that differentiation forgets.

## Further reading

- [Paul's Online Notes — Computing Definite Integrals](https://tutorial.math.lamar.edu/Classes/CalcI/ComputingDefiniteIntegrals.aspx) — Part II in practice, including the continuity trap.
- [Paul's Online Notes — Definition of the Definite Integral](https://tutorial.math.lamar.edu/Classes/CalcI/DefnOfDefiniteIntegral.aspx) — Its last section states Part I with the chain-rule variant.
