---
title: Moment-generating functions
order: 8
status: detailed
weeks: [7]
introduces: [moment-generating-function]
requires:
  - {concept: expected-value, strength: hard}
  - {concept: moment, strength: hard}
  - {concept: taylor-series, strength: hard}
  - {concept: integration-by-parts, strength: soft}
reinforces: []
---

Every moment $E[X^r]$ is a sum or an integral of its own, and computing the first few one by one
gets tedious. The **moment-generating function** packs all of them into a single function of an
auxiliary variable $t$: its Maclaurin coefficients are the moments, so they come out by
differentiating at $t = 0$. Beyond saving work, the moment-generating function turns out to
identify a distribution completely, and it turns sums of independent random variables into
products — the two facts behind most of the special distributions in units 10 and 11.

## The moment-generating function

### Definition

:::definition[Moment-generating function]
The **moment-generating function** (mgf) of a random variable $X$ is

$$
M_X(t) = E\big[e^{tX}\big] = \sum_x e^{tx}\,p(x) \quad\text{or}\quad \int_{-\infty}^{\infty} e^{tx} f(x)\,dx ,
$$

where it exists. We use it when it is finite for all $t$ in some open interval around $0$.
Always $M_X(0) = E[1] = 1$.
:::

### Why it generates moments

::::theorem[Moments are the Maclaurin coefficients]
If $M_X(t)$ exists on an interval around $0$, then

$$
M_X(t) = 1 + \mu'_1\,t + \mu'_2\,\frac{t^2}{2!} + \dots + \mu'_r\,\frac{t^r}{r!} + \dots
$$

:::proof
Substitute the Maclaurin series of the exponential and take expected values term by term (allowed
when the mgf exists near $0$):

$$
E\big[e^{tX}\big] = E\left[1 + tX + \frac{t^2 X^2}{2!} + \dots\right] = 1 + t\,E[X] + \frac{t^2}{2!}E[X^2] + \dots
$$
:::
::::

::::corollary[Moments by differentiation]
$$
\mu'_r = E[X^r] = \frac{d^r M_X(t)}{dt^r}\bigg|_{t = 0} .
$$

In particular $\mu = M'_X(0)$ and $\sigma^2 = M''_X(0) - \big(M'_X(0)\big)^2$.

:::proof
The coefficient of $t^r$ in a power series is the $r$-th derivative at $0$ divided by $r!$
(Taylor's theorem); by the theorem that coefficient is $\mu'_r / r!$.
:::
::::

::::example[Three coin tosses]
Let $X$ be the number of heads in three tosses, $p(x) = \binom{3}{x}\frac18$ for $x = 0, 1, 2, 3$.
Find $M_X(t)$ and use it for the mean and variance.

:::solution
$$
M_X(t) = \frac18\sum_{x=0}^{3} \binom{3}{x} e^{tx} = \frac18\big(1 + 3e^t + 3e^{2t} + e^{3t}\big) = \frac{(1 + e^t)^3}{8},
$$

by the binomial theorem. Differentiating,

$$
M'_X(t) = \frac38 (1 + e^t)^2 e^t
\qquad
M''_X(t) = \frac34 (1 + e^t) e^{2t} + \frac38 (1 + e^t)^2 e^t ,
$$

so $\mu = M'_X(0) = \frac32$, $\mu'_2 = M''_X(0) = \frac32 + \frac32 = 3$ and
$\sigma^2 = 3 - \frac94 = \frac34$.
:::
::::

::::example[The exponential density]
Find the mgf of $f(x) = e^{-x}$, $x > 0$, and all its moments.

:::solution
$$
M_X(t) = \int_0^\infty e^{tx} e^{-x}\,dx = \int_0^\infty e^{-(1 - t)x}\,dx = \frac{1}{1 - t}, \qquad t < 1 .
$$

For $|t| < 1$ this is the geometric series $1 + t + t^2 + \dots = \sum_r r!\,\frac{t^r}{r!}$, so
$\mu'_r = r!$: mean 1, $E[X^2] = 2$, variance 1, as found by parts in unit 7 — with no
integration by parts at all.
:::
::::

::::example[The Poisson pmf]
Let $p(k) = e^{-\lambda}\lambda^k / k!$, $k = 0, 1, 2, \dots$ (the Poisson distribution of unit 10).
Find its mgf, mean and variance.

:::solution
$$
M_X(t) = \sum_{k=0}^{\infty} e^{tk}\,e^{-\lambda}\frac{\lambda^k}{k!} = e^{-\lambda}\sum_{k=0}^{\infty}\frac{(\lambda e^t)^k}{k!} = e^{-\lambda}e^{\lambda e^t} = e^{\lambda(e^t - 1)} .
$$

Then $M'_X(t) = \lambda e^t M_X(t)$ and $M''_X(t) = \lambda e^t M_X(t) + (\lambda e^t)^2 M_X(t)$, so

$$
\mu = M'_X(0) = \lambda
\qquad
\mu'_2 = M''_X(0) = \lambda + \lambda^2
\qquad
\sigma^2 = \lambda + \lambda^2 - \lambda^2 = \lambda .
$$

Computing $\sum_k k^2 e^{-\lambda}\lambda^k/k!$ directly is possible but fiddly; the mgf does it
with two derivatives.
:::
::::

```sim
id: mgf-taylor
controls:
  - {id: dist, label: "distribution (0: heads in 3 tosses, 1: Poisson, 2: exponential, 3: standard normal)", min: 0, max: 3, step: 1, default: 0, decimals: 0}
  - {id: lam, label: "λ (Poisson)", min: 0.5, max: 6, step: 0.5, default: 2, decimals: 1}
  - {id: r, label: "degree of the Maclaurin polynomial", min: 1, max: 6, step: 1, default: 2, decimals: 0}
note: "The white curve is M(t); the dashed green curve is its Maclaurin polynomial built from the moments μ′₁, …, μ′ᵣ (the formula in the corner). At degree 1 it is the tangent line at t = 0, whose slope is the mean; each extra moment makes it hug M(t) further from 0. For the exponential, M(t) blows up at t = 1 and no polynomial follows it there."
```

```python
# Moments from a moment-generating function by symbolic differentiation (sympy).
import sympy as sp

t, lam = sp.symbols('t lambda', positive=True)
mgfs = {
    'heads in 3 tosses': (1 + sp.exp(t))**3 / 8,
    'exponential':       1 / (1 - t),
    'Poisson':           sp.exp(lam * (sp.exp(t) - 1)),
}
for name, M in mgfs.items():
    m1 = sp.simplify(sp.diff(M, t).subs(t, 0))
    m2 = sp.simplify(sp.diff(M, t, 2).subs(t, 0))
    print(f'{name}: mean {m1}, E[X^2] {m2}, variance {sp.simplify(m2 - m1**2)}')

# The Maclaurin coefficients are mu'_r / r!:
print(sp.series(1 / (1 - t), t, 0, 5))      # 1 + t + t**2 + t**3 + t**4: mu'_r = r!
```

:::caution
The coefficient of $t^r$ in $M_X(t)$ is $\mu'_r / r!$, not $\mu'_r$: read off $E[X^3]$ from the
$t^3$ coefficient and multiply by $3! = 6$. And the moments are about the origin; subtract
$\mu^2$ to get the variance.
:::

## Properties

### Linear changes, sums and uniqueness

::::theorem[Linear changes of variable]
For constants $a$ and $b \ne 0$:

$$
M_{X + a}(t) = e^{at} M_X(t)
\qquad
M_{bX}(t) = M_X(bt)
\qquad
M_{(X + a)/b}(t) = e^{at/b} M_X\!\left(\frac{t}{b}\right) .
$$

:::proof
Each is a line of algebra inside the expectation: $E[e^{t(X + a)}] = e^{at}E[e^{tX}]$,
$E[e^{t(bX)}] = E[e^{(bt)X}]$, and the third combines the two.
:::
::::

::::theorem[Sums of independent random variables]
If $X$ and $Y$ are independent, then $M_{X + Y}(t) = M_X(t)\,M_Y(t)$.

:::proof
Discrete case: independence factors the joint pmf, and the double sum factors with it,

$$
E\big[e^{t(X + Y)}\big] = \sum_x\sum_y e^{tx}e^{ty}\,p_X(x)\,p_Y(y) = \Big(\sum_x e^{tx}p_X(x)\Big)\Big(\sum_y e^{ty}p_Y(y)\Big).
$$

For densities the double integral factors the same way. By induction the mgf of a sum of $n$
independent variables is the product of their $n$ mgfs.
:::
::::

:::theorem[Uniqueness]
If two random variables have moment-generating functions that exist and agree on an open interval
around $0$, they have the same distribution. (Cited; the proof uses the theory of Laplace
transforms.)
:::

Together, these two theorems give a way to find the distribution of a sum without convolving
pmfs: multiply the mgfs, then recognise the product.

::::example[Six tosses from two sets of three]
$X_1$ and $X_2$ are the numbers of heads in two independent sets of three tosses. What is the
distribution of $X_1 + X_2$?

:::solution
$M_{X_1 + X_2}(t) = \frac{(1 + e^t)^3}{8}\cdot\frac{(1 + e^t)^3}{8} = \frac{(1 + e^t)^6}{64}$, which
by the same computation as before is the mgf of $p(x) = \binom{6}{x}\frac{1}{64}$, the number of
heads in six tosses. By uniqueness, that is the distribution of the sum — as common sense says.
:::
::::

::::example[A linear change]
$X$ has density $e^{-x}$, $x > 0$. Find the mgf and the mean of $Y = 2X + 1$.

:::solution
$M_Y(t) = e^{t}M_X(2t) = \dfrac{e^{t}}{1 - 2t}$ for $t < \frac12$. Differentiating,
$M'_Y(t) = \dfrac{e^t}{1 - 2t} + \dfrac{2e^t}{(1 - 2t)^2}$, so $E[Y] = M'_Y(0) = 1 + 2 = 3$ — the
same as $2E[X] + 1$.
:::
::::

:::equations
- *Definition*: $M_X(t) = E[e^{tX}]$, with $M_X(0) = 1$.
- *Moments*: $M_X(t) = \sum_r \mu'_r\,t^r/r!$ and $\mu'_r = M_X^{(r)}(0)$.
- *Mean and variance*: $\mu = M'_X(0)$ and $\sigma^2 = M''_X(0) - M'_X(0)^2$.
- *Linear change*: $M_{(X + a)/b}(t) = e^{at/b} M_X(t/b)$.
- *Independent sum*: $M_{X + Y}(t) = M_X(t)\,M_Y(t)$.
:::

:::caution
Not every distribution has an mgf. For $f(x) = 1/x^2$ on $x > 1$, $E[e^{tX}] = \infty$ for every
$t > 0$ — it has no mean either. The uniqueness theorem needs the mgf to exist on an interval
around $0$, not just at $t = 0$.
:::

:::insight
The mgf is a bookkeeping device: it stores all the moments as the coefficients of one series,
and it converts the hard operation on distributions — adding independent variables — into the easy
one on functions, multiplication.
:::

## Further reading

- [Moment-generating function](https://en.wikipedia.org/wiki/Moment-generating_function) — Wikipedia, with a table of mgfs of common distributions.
- [Characteristic function (probability theory)](https://en.wikipedia.org/wiki/Characteristic_function_(probability_theory)) — the variant $E[e^{itX}]$, which exists for every distribution.
