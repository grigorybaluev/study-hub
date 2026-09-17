---
title: Trigonometric substitution
order: 10
status: detailed
notes: ["Lecture 10 handout — learning/Slides/Lecture10.pdf (Stewart 7.3: the three substitutions with their θ-ranges and identities)"]
weeks: [5]
textbook: "Stewart, Calculus: Early Transcendentals, 7.3"
introduces: [trigonometric-substitution]
requires:
  - {concept: substitution-rule, strength: hard}
  - {concept: trigonometric-integrals, strength: hard}
  - {concept: trigonometric-functions, strength: hard}
reinforces: []
---

Roots of quadratics — $\sqrt{a^2 - x^2}$, $\sqrt{a^2 + x^2}$, $\sqrt{x^2 - a^2}$ — block every
technique so far. The fix is a substitution that runs *backwards* compared with lecture
6: instead of $u = g(x)$, set $x = g(\theta)$ for a trigonometric $g$ chosen so that a
Pythagorean identity turns the radicand into a perfect square.

## The three substitutions

| expression | substitution | range of $\theta$ | identity used |
|---|---|---|---|
| $\sqrt{a^2 - x^2}$ | $x = a\sin\theta$ | $-\frac{\pi}{2} \le \theta \le \frac{\pi}{2}$ | $1 - \sin^2\theta = \cos^2\theta$ |
| $\sqrt{a^2 + x^2}$ | $x = a\tan\theta$ | $-\frac{\pi}{2} < \theta < \frac{\pi}{2}$ | $1 + \tan^2\theta = \sec^2\theta$ |
| $\sqrt{x^2 - a^2}$ | $x = a\sec\theta$ | $0 \le \theta < \frac{\pi}{2}$ or $\pi \le \theta < \frac{3\pi}{2}$ | $\sec^2\theta - 1 = \tan^2\theta$ |

With $x = a\sin\theta$, for instance, $\sqrt{a^2 - x^2} = \sqrt{a^2\cos^2\theta} = a|\cos\theta| = a\cos\theta$
— the absolute value drops *because* $\theta$ is restricted to where $\cos\theta \ge 0$.
That restriction is also what makes the substitution invertible ($\theta = \sin^{-1}(x/a)$),
which is required by the substitution rule.

> **Key insight.** This is an *inverse* substitution: $x$ is defined in terms of the new
> variable, $dx = g'(\theta)\,d\theta$ is computed from it, and at the end $\theta$ must
> be converted back to $x$. Draw the **reference triangle** for that last step: for
> $x = a\sin\theta$ the triangle has opposite side $x$, hypotenuse $a$, adjacent side
> $\sqrt{a^2 - x^2}$, and every trigonometric function of $\theta$ can be read off it.

## Worked cases

> **Example — $\sqrt{a^2 - x^2}$.** $\displaystyle\int \frac{\sqrt{9 - x^2}}{x^2}\,dx$. Let $x = 3\sin\theta$, $dx = 3\cos\theta\,d\theta$, $\sqrt{9 - x^2} = 3\cos\theta$:
> $\displaystyle\int \frac{3\cos\theta}{9\sin^2\theta}\,3\cos\theta\,d\theta = \int \cot^2\theta\,d\theta = \int(\csc^2\theta - 1)\,d\theta = -\cot\theta - \theta + C$.
> From the triangle, $\cot\theta = \dfrac{\sqrt{9 - x^2}}{x}$ and $\theta = \sin^{-1}\dfrac{x}{3}$, so the answer is $-\dfrac{\sqrt{9 - x^2}}{x} - \sin^{-1}\dfrac{x}{3} + C$.

> **Example — $\sqrt{a^2 + x^2}$.** $\displaystyle\int \frac{dx}{x^2\sqrt{x^2 + 4}}$. Let $x = 2\tan\theta$, $dx = 2\sec^2\theta\,d\theta$, $\sqrt{x^2 + 4} = 2\sec\theta$:
> $\displaystyle\int \frac{2\sec^2\theta}{4\tan^2\theta\cdot 2\sec\theta}\,d\theta = \frac14\int\frac{\sec\theta}{\tan^2\theta}\,d\theta = \frac14\int\frac{\cos\theta}{\sin^2\theta}\,d\theta = -\frac{1}{4\sin\theta} + C = -\frac{\sqrt{x^2 + 4}}{4x} + C$.

> **Example — a definite integral: the area of a quarter disc.** $\displaystyle\int_0^{a}\sqrt{a^2 - x^2}\,dx$ with $x = a\sin\theta$: the limits become $\theta = 0$ and $\theta = \pi/2$, and
> $\displaystyle\int_0^{\pi/2} a\cos\theta\cdot a\cos\theta\,d\theta = a^2\int_0^{\pi/2}\cos^2\theta\,d\theta = a^2\Big[\frac{\theta}{2} + \frac{\sin 2\theta}{4}\Big]_0^{\pi/2} = \frac{\pi a^2}{4}$ ✓.
> The $\cos^2\theta$ integral is the "both even" case of the previous lecture — trigonometric substitution almost always hands a trigonometric integral to the previous lecture's methods.

```sim
id: calc-trig-sub
controls:
  - {id: x1, label: "Upper limit x₁", min: 0, max: 2, step: 0.02, default: 1.2, decimals: 2}
note: 'The integral of √(4 − x²) from 0 to x₁, with x = 2 sin θ. The value 2θ + 2 sin θ cos θ splits into a circular sector of angle θ (orange, area 2θ) and a right triangle (blue, area x₁·y₁/2): the substitution is literally measuring the region in polar terms.'
```

## Completing the square

An expression like $\sqrt{x^2 + 2x + 5}$ is not in the table until the square is completed:
$x^2 + 2x + 5 = (x + 1)^2 + 4$. Then $u = x + 1$ first, and $u = 2\tan\theta$ second.

> **Caution.** Two things go wrong most often: forgetting to convert $dx$ (it is
> $g'(\theta)\,d\theta$, never just $d\theta$), and returning a final answer in $\theta$.
> Convert the limits when the integral is definite; otherwise use the triangle.

**Equations**

- $x = a\sin\theta \Rightarrow \sqrt{a^2 - x^2} = a\cos\theta,\ dx = a\cos\theta\,d\theta$
- $x = a\tan\theta \Rightarrow \sqrt{a^2 + x^2} = a\sec\theta,\ dx = a\sec^2\theta\,d\theta$
- $x = a\sec\theta \Rightarrow \sqrt{x^2 - a^2} = a\tan\theta,\ dx = a\sec\theta\tan\theta\,d\theta$

## Further reading

- [Paul's Online Notes — Trig Substitutions](https://tutorial.math.lamar.edu/Classes/CalcII/TrigSubstitutions.aspx) — All three substitutions with the sign discussion for $\sec$ and examples that need completing the square.
