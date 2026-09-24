---
title: Expected value, moments and Chebyshev's theorem
order: 7
status: detailed
weeks: [5, 6]
textbook: "Miller & Miller, John E. Freund's Mathematical Statistics with Applications, 8e, 4.1-4.4"
notes: ["Doedel, Probability and Statistics lecture notes (Concordia), pp. 101–109 and 163–170: expectation of discrete and continuous variables and of functions of them; the die, the toss-until-heads and the betting examples; the broken stick", "Doedel, pp. 108–109 and 169–170: variance and standard deviation", "Doedel, pp. 181–185: Markov's and Chebyshev's inequalities; the e^(−x) and exchange-rate examples"]
introduces: [expected-value, variance, moment, chebyshev-inequality]
requires:
  - {concept: random-variable, strength: hard}
  - {concept: probability-mass-function, strength: hard}
  - {concept: probability-density-function, strength: hard}
  - {concept: integral, strength: hard}
  - {concept: series, strength: soft}
reinforces: []
---

A distribution is a whole table or curve; often we want one or two numbers that summarise it.
Where is it centred? How spread out is it? The **expected value** answers the first: the average
of the values, each weighted by its probability — the long-run average over many repetitions.
The **variance** answers the second: the expected squared distance from that centre. Both are
instances of **moments**, expected values of powers of $X$. And **Chebyshev's theorem** shows that
the two numbers alone already bound how much probability can lie far from the centre, whatever
the distribution.

## Expected value

### A weighted average

:::definition[Expected value]
The **expected value** (or **mean**) of a random variable $X$ is

$$
E[X] = \sum_x x\,p(x) \quad \text{(discrete)}
\qquad
E[X] = \int_{-\infty}^{\infty} x\,f(x)\,dx \quad \text{(continuous)},
$$

provided the sum or integral converges absolutely. It is also written $\mu$ or $\mu_X$.
:::

If the experiment is repeated many times, the value $x$ turns up in a share of about $p(x)$ of
the repetitions, so the average of the observed values is about $\sum_x x\,p(x)$. The expected
value need not be a value $X$ can take.

::::example[A die]
Find the expected value of the roll of a fair die.

:::solution
$$
E[X] = 1 \cdot \tfrac16 + 2 \cdot \tfrac16 + \dots + 6 \cdot \tfrac16 = \frac{1}{6}\sum_{k=1}^{6} k = \frac{21}{6} = \frac72 .
$$

No roll shows 3.5; it is the balance point of the six equal weights.
:::
::::

::::example[Tossing until the first head]
Find the expected number of tosses until the first head, with $p(k) = 2^{-k}$.

:::solution
$$
E[X] = \sum_{k=1}^{\infty} \frac{k}{2^k} = \frac12 + \frac24 + \frac38 + \frac{4}{16} + \dots = 2 .
$$

The partial sums are $0.5,\ 1,\ 1.375,\ 1.625, \dots$ and approach 2. (The value follows from
$\sum_{k \ge 1} k\,r^{k-1} = \frac{1}{(1-r)^2}$, the derivative of the geometric series, at
$r = \frac12$: $E[X] = \frac12 \cdot 4 = 2$.)
:::
::::

::::example[Continuous means]
Find $E[X]$ for the pointer ($f = 1$ on $(0, 1]$) and for $f(x) = e^{-x}$, $x > 0$.

:::solution
Pointer: $E[X] = \int_0^1 x\,dx = \frac12$. Exponential, integrating by parts:

$$
E[X] = \int_0^{\infty} x e^{-x}\,dx = \Big[-(x + 1)e^{-x}\Big]_0^{\infty} = 1 .
$$
:::
::::

:::caution
The expected value can fail to exist. For $f(x) = 1/x^2$ on $x > 1$ (a valid density), the
integral $\int_1^\infty x \cdot x^{-2}\,dx = \int_1^\infty \frac{dx}{x}$ diverges: there is no
mean. Heavy tails, where large values are too likely, are the reason.
:::

## Expected value of a function of X

### The rule and linearity

::::theorem[Expected value of g(X)]
For a function $g$,

$$
E[g(X)] = \sum_x g(x)\,p(x) \quad \text{(discrete)}
\qquad
E[g(X)] = \int_{-\infty}^{\infty} g(x)\,f(x)\,dx \quad \text{(continuous)},
$$

provided the sum or integral converges absolutely. There is no need to find the distribution of
$Y = g(X)$ first.

:::proof
Discrete case. $Y = g(X)$ is a random variable whose value $y$ occurs exactly when $X$ takes one of
the values $x$ with $g(x) = y$. So $P(Y = y) = \sum_{x : g(x) = y} p(x)$ and

$$
E[Y] = \sum_y y \sum_{x:\,g(x) = y} p(x) = \sum_y \sum_{x:\,g(x) = y} g(x)\,p(x) = \sum_x g(x)\,p(x),
$$

the last sum regrouping the $x$ by their value of $g$. The continuous case is cited.
:::
::::

::::corollary[Linearity]
For constants $a, b$ and functions $g_1, g_2$:

$$
E[aX + b] = a\,E[X] + b
\qquad
E[g_1(X) + g_2(X)] = E[g_1(X)] + E[g_2(X)].
$$

:::proof
Apply the theorem and split the sum: $\sum_x (a x + b)\,p(x) = a\sum_x x\,p(x) + b\sum_x p(x) = aE[X] + b$.
The second identity splits the same way; for densities, split the integral.
:::
::::

::::example[A fair entry fee]
A game pays $k^2$ dollars when a fair die shows $k$. What entry fee makes the game break even in
the long run?

:::solution
With $g(k) = k^2$,

$$
E[X^2] = \frac{1^2 + 2^2 + \dots + 6^2}{6} = \frac{1}{6} \cdot \frac{6 \cdot 7 \cdot 13}{6} = \frac{91}{6} \approx 15.17 ,
$$

so about 15.17 dollars. Note that $E[X^2] = 15.17 \ne (E[X])^2 = 12.25$: expectation does not
commute with non-linear functions.
:::
::::

::::example[A broken stick]
A stick of length 1 is broken at a point $X$ chosen uniformly on $(0, 1)$. Find the expected
length of the piece that contains the point $\frac13$.

:::solution
If $X < \frac13$ the piece containing $\frac13$ is the right one, of length $1 - X$; otherwise it
is the left one, of length $X$. So $g(x) = 1 - x$ on $(0, \frac13)$ and $g(x) = x$ on
$[\frac13, 1)$, and

$$
E[g(X)] = \int_0^{1/3} (1 - x)\,dx + \int_{1/3}^{1} x\,dx = \frac{5}{18} + \frac{8}{18} = \frac{13}{18} \approx 0.72 .
$$

More than $\frac12$: the point $\frac13$ is more likely to land in the longer piece.
:::
::::

:::insight
$E$ is linear: constants factor out and sums split. That is almost always the fastest route to a
mean, and it will carry over to several random variables in unit 9.
:::

## Moments and variance

### Moments

:::definition[Moments]
The **$r$-th moment about the origin** of $X$ is $\mu'_r = E[X^r]$, and the **$r$-th moment about
the mean** is $\mu_r = E[(X - \mu)^r]$, for $r = 0, 1, 2, \dots$ So $\mu'_1 = \mu$, $\mu_0 = 1$ and
$\mu_1 = 0$.
:::

### Variance and standard deviation

:::definition[Variance and standard deviation]
The **variance** of $X$ is the second moment about the mean,

$$
\sigma^2 = \operatorname{Var}(X) = E\big[(X - \mu)^2\big],
$$

the expected squared distance from the mean. Its square root $\sigma$ is the **standard
deviation**, measured in the same units as $X$.
:::

::::theorem[Computing formula]
$$
\sigma^2 = \mu'_2 - \mu^2 = E[X^2] - (E[X])^2 .
$$

:::proof
Expand the square and use linearity, with $\mu$ a constant:

$$
E\big[(X - \mu)^2\big] = E[X^2] - 2\mu\,E[X] + \mu^2 = E[X^2] - 2\mu^2 + \mu^2 = E[X^2] - \mu^2 .
$$
:::
::::

::::corollary[Variance of a linear function]
$\operatorname{Var}(aX + b) = a^2 \operatorname{Var}(X)$, and so the standard deviation of $aX + b$ is $|a|\,\sigma$.

:::proof
$aX + b$ has mean $a\mu + b$, so its deviation from the mean is $a(X - \mu)$, and
$E[a^2 (X - \mu)^2] = a^2 \sigma^2$. Shifting by $b$ moves the distribution without spreading it.
:::
::::

::::example[Variance of a die]
Find the variance and the standard deviation of a fair die.

:::solution
From the entry-fee example, $E[X^2] = \frac{91}{6}$, so

$$
\sigma^2 = \frac{91}{6} - \left(\frac72\right)^2 = \frac{182 - 147}{12} = \frac{35}{12} \approx 2.92
\qquad
\sigma \approx 1.71 .
$$
:::
::::

::::example[Variance of the exponential density]
Find $\sigma^2$ for $f(x) = e^{-x}$, $x > 0$.

:::solution
By parts twice, $E[X^2] = \int_0^\infty x^2 e^{-x}\,dx = \Big[-(x^2 + 2x + 2)e^{-x}\Big]_0^\infty = 2$,
so $\sigma^2 = 2 - 1^2 = 1$ and $\sigma = 1$.
:::
::::

:::note
The third moment about the mean measures lopsidedness: $\mu_3 / \sigma^3$ is the **skewness**,
zero for a symmetric distribution, positive when the long tail is on the right (as for $e^{-x}$,
whose skewness is 2).
:::

## Chebyshev's theorem

### A bound from the mean and the variance alone

A small $\sigma$ should mean the values stay close to $\mu$. The two theorems below make that
quantitative using nothing but $\mu$ and $\sigma$ — no other knowledge of the distribution.

::::theorem[Markov's inequality]
If $X \ge 0$ and $c > 0$, then

$$
P(X \ge c) \le \frac{E[X]}{c} .
$$

:::proof
For a density (the discrete case replaces integrals by sums), drop the part of the integral below
$c$ and use $x \ge c$ on what remains:

$$
E[X] = \int_0^\infty x f(x)\,dx \ \ge\ \int_c^\infty x f(x)\,dx \ \ge\ c\int_c^\infty f(x)\,dx = c\,P(X \ge c).
$$
:::
::::

::::theorem[Chebyshev's theorem]
If $X$ has mean $\mu$ and standard deviation $\sigma > 0$, then for every $k > 0$

$$
P\big(|X - \mu| \ge k\sigma\big) \le \frac{1}{k^2}
\qquad\text{equivalently}\qquad
P\big(|X - \mu| < k\sigma\big) \ge 1 - \frac{1}{k^2} .
$$

:::proof
Apply Markov's inequality to the non-negative variable $Y = (X - \mu)^2$, whose mean is
$\sigma^2$, with $c = k^2\sigma^2$:

$$
P\big(|X - \mu| \ge k\sigma\big) = P\big((X - \mu)^2 \ge k^2\sigma^2\big) \le \frac{\sigma^2}{k^2\sigma^2} = \frac{1}{k^2} .
$$
:::
::::

So at least $75\,\%$ of the probability lies within two standard deviations of the mean, and at
least $8/9 \approx 89\,\%$ within three — for **every** distribution with a variance.

::::example[How sharp is Markov?]
For $f(x) = e^{-x}$, $x > 0$ (mean 1), compare Markov's bound with the truth for $c = 1$ and $c = 10$.

:::solution
Markov gives $P(X \ge 1) \le 1$ and $P(X \ge 10) \le 0.1$. The true values are
$P(X \ge 1) = e^{-1} \approx 0.37$ and $P(X \ge 10) = e^{-10} \approx 0.000045$. The bounds are
correct but very loose: they must hold for every non-negative distribution with mean 1, including
far less well-behaved ones.
:::
::::

::::example[An exchange rate]
Over a certain period the value of the Canadian dollar in US dollars is a random variable with
mean $\mu = 0.98$ and standard deviation $\sigma = 0.05$. What can be said about the probability
that it lies between 0.88 and 1.08?

:::solution
The interval is $\mu \pm 2\sigma$, so with $k = 2$,

$$
P(0.88 < X < 1.08) = P(|X - \mu| < 2\sigma) \ge 1 - \frac14 = 0.75 .
$$

At least 75 %, whatever the actual distribution of the rate.
:::
::::

:::equations
- *Mean*: $\mu = E[X] = \sum_x x\,p(x)$ or $\int x f(x)\,dx$.
- *Function of X*: $E[g(X)] = \sum_x g(x)\,p(x)$ or $\int g(x) f(x)\,dx$; $E[aX + b] = aE[X] + b$.
- *Moments*: $\mu'_r = E[X^r]$ and $\mu_r = E[(X - \mu)^r]$.
- *Variance*: $\sigma^2 = E[(X - \mu)^2] = E[X^2] - \mu^2$; $\operatorname{Var}(aX + b) = a^2\sigma^2$.
- *Markov*: $P(X \ge c) \le E[X]/c$ for $X \ge 0$.
- *Chebyshev*: $P(|X - \mu| \ge k\sigma) \le 1/k^2$.
:::

```sim
id: chebyshev-bound
controls:
  - {id: dist, label: "distribution (0: die, 1: uniform, 2: exponential, 3: normal, 4: the extreme three-point case)", min: 0, max: 4, step: 1, default: 3, decimals: 0}
  - {id: k, label: k, min: 1, max: 5, step: 0.05, default: 2, decimals: 2}
note: "The green curve is the true probability of landing at least k standard deviations from the mean; the dashed yellow curve is Chebyshev's 1/k². Green never rises above yellow — that is the theorem — and for the everyday distributions it stays far below (normal at k = 2: 0.046 against 0.25). Distribution 4 puts probability 1/8 at ±2 and 3/4 at 0: at k = 2 the two curves meet, so 1/k² cannot be improved without knowing more than μ and σ."
```

```python
# Chebyshev's bound 1/k^2 against the true tail probability P(|X - mu| >= k sigma)
# for a few distributions, via scipy.stats.
import numpy as np
from scipy import stats

dists = {
    'uniform(0,1)': stats.uniform(0, 1),
    'exponential':  stats.expon(),
    'normal':       stats.norm(),
}
for k in [1.5, 2, 3]:
    row = [f'k = {k}: bound {1 / k**2:.3f}']
    for name, d in dists.items():
        mu, sd = d.mean(), d.std()
        tail = d.cdf(mu - k * sd) + d.sf(mu + k * sd)
        row.append(f'{name} {tail:.4f}')
    print(' | '.join(row))

# The die is discrete: count the faces far from the mean.
faces = np.arange(1, 7)
mu, sd = faces.mean(), faces.std()       # 3.5 and sqrt(35/12)
print('die, k = 1.4:', np.mean(np.abs(faces - mu) >= 1.4 * sd))   # 1/3: the faces 1 and 6
```

:::caution
Chebyshev's bound says nothing for $k \le 1$ (the bound is $\ge 1$), and for a known distribution
it is usually far from the truth. Use it when only $\mu$ and $\sigma$ are known; when the
distribution is known, compute the probability directly.
:::

:::insight
The mean locates a distribution and the variance measures its spread, and Chebyshev turns that
informal reading into a guarantee: probability can be far from $\mu$ only at the price of a large
$\sigma$.
:::

## Further reading

- [Expected value](https://en.wikipedia.org/wiki/Expected_value), [Variance](https://en.wikipedia.org/wiki/Variance) and [Moment (mathematics)](https://en.wikipedia.org/wiki/Moment_(mathematics)) — Wikipedia.
- [Chebyshev's inequality](https://en.wikipedia.org/wiki/Chebyshev%27s_inequality) — Wikipedia, including the three-point distribution that attains the bound.
- [Law of the unconscious statistician](https://en.wikipedia.org/wiki/Law_of_the_unconscious_statistician) — the name usually given to the rule for $E[g(X)]$.
