---
title: The fundamental theorem of calculus
order: 4
status: detailed
notes: ["Lecture 4 handout — learning/Slides/Lecture4.pdf (Stewart 5.3: mean value theorem for integrals, FTC parts I and II, inverse processes)"]
weeks: [2]
textbook: "Stewart, Calculus: Early Transcendentals, 5.3"
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

> **Theorem (MVT for integrals).** If $f$ is continuous on $[a, b]$, then for some $c \in [a, b]$: $f(c) = \dfrac{1}{b - a}\displaystyle\int_a^b f(x)\,dx$.

In words: a continuous function attains its average value somewhere. The proof is the
comparison property $m(b-a) \le \int_a^b f \le M(b-a)$ plus the intermediate value
theorem — the average lies between the minimum and the maximum of $f$, so it is a value
of $f$. This is the lemma that makes Part I work.

## Part I — the accumulation function is an antiderivative

Fix the lower limit and let the upper limit move:
$$g(x) = \int_a^x f(t)\,dt, \qquad a \le x \le b .$$
$g(x)$ is "the area accumulated so far". Note the dummy variable $t$ inside; $x$ is the
upper limit and is *not* free to be reused as the variable of integration.

> **Theorem (FTC, Part I).** If $f$ is continuous on $[a, b]$, then $g(x) = \int_a^x f(t)\,dt$ is continuous on $[a, b]$, differentiable on $(a, b)$, and $g'(x) = f(x)$.

*Why.* $g(x + h) - g(x) = \int_x^{x+h} f(t)\,dt$ (additivity), and by the MVT for
integrals this equals $h\,f(c)$ for some $c$ between $x$ and $x + h$. Divide by $h$ and
let $h \to 0$: $c \to x$ and continuity gives $f(c) \to f(x)$.

> **Key insight.** Part I is an *existence* theorem: every continuous function has an
> antiderivative, namely its accumulation function — even $e^{-t^2}$, which has no
> elementary one.

```sim
id: calc-ftc-accumulation
controls:
  - {id: x, label: "Upper limit x", min: 0, max: 6.28, step: 0.02, default: 2, decimals: 2}
note: 'Top: f(t) = 1.2 + sin t with the accumulated region from 0 to x. Bottom: g(x) = ∫₀ˣ f(t) dt with its tangent at x. Drag x and watch the slope of g track the height of f — that is g′(x) = f(x).'
```

> **Example.** $\dfrac{d}{dx}\displaystyle\int_0^x \sqrt{1 + t^3}\,dt = \sqrt{1 + x^3}$. No integration is performed; the theorem does it.
> With a composite upper limit, chain rule: $\dfrac{d}{dx}\displaystyle\int_1^{x^2} \cos t\,dt = \cos(x^2)\cdot 2x$.

## Part II — evaluate with any antiderivative

> **Theorem (FTC, Part II).** If $f$ is continuous on $[a, b]$ and $F$ is *any* antiderivative of $f$ there, then $\displaystyle\int_a^b f(x)\,dx = F(b) - F(a)$.

*Why.* By Part I, $g(x) = \int_a^x f$ is an antiderivative, so $F = g + C$. Then
$F(b) - F(a) = g(b) - g(a) = \int_a^b f - 0$. The constant cancels — which is why the
definite integral never carries a $+C$.

Notation: $F(b) - F(a)$ is written $\big[F(x)\big]_a^b$ or $F(x)\big|_a^b$.

> **Example.** $\displaystyle\int_0^2 x^2\,dx = \left[\frac{x^3}{3}\right]_0^2 = \frac{8}{3} - 0 = \frac{8}{3}$ — the limit of Riemann sums from lecture 1, now in one line.
> $\displaystyle\int_0^{\pi} \sin x\,dx = \big[-\cos x\big]_0^{\pi} = -\cos\pi - (-\cos 0) = 1 + 1 = 2$.

> **Caution.** Part II needs $f$ continuous on the *whole* interval.
> $\int_{-1}^{1} x^{-2}\,dx \ne \big[-1/x\big]_{-1}^{1} = -2$ — a positive function cannot
> have a negative integral. The integrand blows up at $0$; this is an improper integral
> (lecture 13), and it diverges.

## Differentiation and integration as inverse processes

The two parts together:

**Equations**

- $\displaystyle\frac{d}{dx}\int_a^x f(t)\,dt = f(x)$ — differentiate an integral and get the integrand back
- $\displaystyle\int_a^b F'(x)\,dx = F(b) - F(a)$ — integrate a derivative and get the net change of $F$
- $\displaystyle\frac{1}{b-a}\int_a^b f(x)\,dx = f(c)$ for some $c \in [a,b]$ (MVT for integrals)

Each operation undoes the other, up to the constant that differentiation forgets.

## Further reading

- [Paul's Online Notes — Computing Definite Integrals](https://tutorial.math.lamar.edu/Classes/CalcI/ComputingDefiniteIntegrals.aspx) — Part II in practice, including the continuity trap.
- [Paul's Online Notes — Definition of the Definite Integral](https://tutorial.math.lamar.edu/Classes/CalcI/DefnOfDefiniteIntegral.aspx) — Its last section states Part I with the chain-rule variant.
