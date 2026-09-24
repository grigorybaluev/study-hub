---
title: Special discrete distributions
order: 10
status: detailed
weeks: [9, 10]
textbook: "Miller & Miller, John E. Freund's Mathematical Statistics with Applications, 8e, 5"
notes: ["Doedel, Probability and Statistics lecture notes (Concordia), pp. 118–129: the Bernoulli and binomial random variables, the recurrence for binomial probabilities, the mean and variance through a sum of Bernoulli trials, the 12-toss and 12-roll tables", "Doedel, pp. 130–137: the Poisson random variable as a limit of the binomial, its recurrence, the customers-per-hour and wire-defect examples, binomial against Poisson tables", "Miller & Miller 5.5–5.6 and 5.8: negative binomial, geometric, hypergeometric and multinomial distributions (not in Doedel's notes)"]
introduces: [discrete-uniform-distribution, bernoulli-distribution, binomial-distribution, geometric-distribution, negative-binomial-distribution, hypergeometric-distribution, poisson-distribution, multinomial-distribution]
requires:
  - {concept: probability-mass-function, strength: hard}
  - {concept: expected-value, strength: hard}
  - {concept: counting, strength: hard}
  - {concept: series, strength: hard}
  - {concept: moment-generating-function, strength: soft}
reinforces: []
---

A handful of experiments come up so often that their distributions have names: counting
successes in repeated independent trials, waiting for the first (or the $k$-th) success, drawing
without replacement from a finite lot, counting rare events in a stretch of time. Each is a
pmf with one or two **parameters**, and for each we derive the mean and the variance once, so
that later problems only have to recognise the situation and read off the formula. Throughout,
$\theta$ is the probability of success on a single trial (Doedel writes $p$).

## Discrete uniform and Bernoulli

### Equally likely values

:::definition[Discrete uniform distribution]
$X$ has the **discrete uniform distribution** on $x_1, \dots, x_k$ when $f(x_i) = \dfrac1k$ for each
$i$.
:::

::::proposition[Mean and variance on 1, …, k]
If the values are $1, 2, \dots, k$, then $\mu = \dfrac{k + 1}{2}$ and $\sigma^2 = \dfrac{k^2 - 1}{12}$.

:::proof
$\mu = \frac1k\sum_{i=1}^{k} i = \frac1k\cdot\frac{k(k+1)}{2}$. And
$E[X^2] = \frac1k\sum i^2 = \frac{(k+1)(2k+1)}{6}$, so

$$
\sigma^2 = \frac{(k+1)(2k+1)}{6} - \frac{(k+1)^2}{4} = \frac{(k+1)\big(2(2k+1) - 3(k+1)\big)}{12} = \frac{(k+1)(k-1)}{12} .
$$
:::
::::

A die is the case $k = 6$: $\mu = \frac72$ and $\sigma^2 = \frac{35}{12}$, as in unit 7.

### One trial

:::definition[Bernoulli distribution]
A **Bernoulli trial** has two outcomes, success and failure. The random variable $X = 1$ for a
success and $X = 0$ for a failure has the **Bernoulli distribution** with parameter $\theta$:

$$
f(x; \theta) = \theta^x (1 - \theta)^{1 - x}, \qquad x = 0, 1 .
$$
:::

::::proposition[Bernoulli mean and variance]
$\mu = \theta$ and $\sigma^2 = \theta(1 - \theta)$.

:::proof
$E[X] = 1 \cdot \theta + 0 \cdot (1 - \theta) = \theta$, and $X^2 = X$ (since $0^2 = 0$, $1^2 = 1$),
so $E[X^2] = \theta$ and $\sigma^2 = \theta - \theta^2$.
:::
::::

A fair coin ($\theta = \frac12$) has variance $\frac14$, the largest possible; "a six" on a die
($\theta = \frac16$) has variance $\frac{5}{36}$. When $\theta$ is small, $\sigma^2 \approx \theta$.

## The binomial distribution

### Successes in n independent trials

Perform $n$ independent Bernoulli trials with the same $\theta$ and record the results as a
string, say $100011001010$ for $n = 12$. By independence that particular string has probability
$\theta^5(1 - \theta)^7$ — five factors $\theta$ for the ones, seven factors $1 - \theta$ for the
zeros. Every string with five ones has the same probability, and there are $\binom{12}{5}$ of them.

:::definition[Binomial distribution]
The number $X$ of successes in $n$ independent trials, each a success with probability $\theta$,
has the **binomial distribution**

$$
b(x; n, \theta) = \binom{n}{x}\,\theta^x (1 - \theta)^{n - x}, \qquad x = 0, 1, \dots, n .
$$
:::

::::theorem[Binomial mean, variance and mgf]
$$
\mu = n\theta
\qquad
\sigma^2 = n\theta(1 - \theta)
\qquad
M_X(t) = \big(1 + \theta(e^t - 1)\big)^n .
$$

:::proof
Write $X = X_1 + \dots + X_n$ where $X_i$ is 1 if trial $i$ succeeds: $X_i$ are independent
Bernoulli($\theta$). By unit 9, $E[X] = \sum E[X_i] = n\theta$ and, the $X_i$ being independent,
$\operatorname{Var}(X) = \sum \operatorname{Var}(X_i) = n\theta(1 - \theta)$. Each $X_i$ has mgf
$(1 - \theta) + \theta e^t$, and the mgf of an independent sum is the product (unit 8). That the
probabilities add to 1 is the binomial theorem: $\sum_x b(x; n, \theta) = (\theta + 1 - \theta)^n = 1$.
:::
::::

:::note
To compute a whole table, use the ratio of consecutive terms instead of factorials:

$$
b(x + 1; n, \theta) = b(x; n, \theta)\cdot\frac{n - x}{x + 1}\cdot\frac{\theta}{1 - \theta},
\qquad
b(0; n, \theta) = (1 - \theta)^n .
$$

It is cheap and numerically stable, and it shows the pmf rising while the ratio exceeds 1 and
falling after — the peak is near $n\theta$.
:::

::::example[Twelve tosses]
A fair coin is tossed 12 times. Find $P(X = 6)$ and $P(X \le 5)$ for the number of heads.

:::solution
$\theta = \frac12$, so every string has probability $2^{-12} = \frac{1}{4096}$:

$$
P(X = 6) = \binom{12}{6}\frac{1}{4096} = \frac{924}{4096} \approx 0.226
\qquad
P(X \le 5) = \frac{1 + 12 + 66 + 220 + 495 + 792}{4096} = \frac{1586}{4096} \approx 0.387 .
$$

The mean is 6 and the variance 3. Even the most likely count, exactly half heads, happens less
than a quarter of the time.
:::
::::

::::example[Twelve rolls of a die]
A die is rolled 12 times and $X$ counts the sixes. Find $P(X = 5)$, $P(X \le 5)$, the mean and the
variance.

:::solution
$\theta = \frac16$: $P(X = 5) = \binom{12}{5}\left(\frac16\right)^5\left(\frac56\right)^7 \approx 0.028$,
and summing the table from $x = 0$ to $5$, $P(X \le 5) \approx 0.992$. The mean is
$12 \cdot \frac16 = 2$ and the variance $12 \cdot \frac16 \cdot \frac56 = \frac53$.
:::
::::

## Waiting for successes: geometric and negative binomial

### The trial on which the k-th success comes

Instead of fixing the number of trials and counting successes, fix the number of successes and
count the trials. The $k$-th success comes on trial $x$ exactly when trial $x$ is a success and
the first $x - 1$ trials contain $k - 1$ successes.

:::definition[Negative binomial and geometric distributions]
The trial $X$ on which the $k$-th success occurs has the **negative binomial distribution**

$$
b^*(x; k, \theta) = \binom{x - 1}{k - 1}\,\theta^k (1 - \theta)^{x - k}, \qquad x = k, k + 1, \dots
$$

The case $k = 1$, the trial of the first success, is the **geometric distribution**
$g(x; \theta) = \theta(1 - \theta)^{x - 1}$, $x = 1, 2, \dots$
:::

::::theorem[Means and variances]
$$
\text{geometric: } \mu = \frac1\theta,\ \ \sigma^2 = \frac{1 - \theta}{\theta^2}
\qquad
\text{negative binomial: } \mu = \frac{k}{\theta},\ \ \sigma^2 = \frac{k(1 - \theta)}{\theta^2} .
$$

:::proof
Geometric mean: with $q = 1 - \theta$ and $\sum_{x \ge 1} x q^{x-1} = \frac{1}{(1 - q)^2}$ (the
derivative of the geometric series),

$$
E[X] = \theta\sum_{x=1}^{\infty} x\,q^{x - 1} = \frac{\theta}{\theta^2} = \frac1\theta .
$$

The variance follows the same way from the second derivative (or from the mgf
$\theta e^t / (1 - q e^t)$). The waiting time for the $k$-th success is the sum of $k$ independent
geometric waiting times — one for each success after the previous one — so its mean and variance
are $k$ times the geometric ones.
:::
::::

::::example[Tossing until the first head]
Tossing a fair coin until the first head is the geometric distribution with $\theta = \frac12$.
Check the mean found in unit 7.

:::solution
$g(x; \frac12) = \frac12\left(\frac12\right)^{x-1} = 2^{-x}$, the pmf of unit 4, and
$\mu = 1/\theta = 2$, $\sigma^2 = \frac{1/2}{1/4} = 2$.
:::
::::

::::example[The third basket]
A player makes 70 % of her free throws, independently. What is the probability that her third
basket comes on her fifth attempt? How many attempts does she need on average for three baskets?

:::solution
$$
b^*(5; 3, 0.7) = \binom{4}{2}(0.7)^3(0.3)^2 = 6 \cdot 0.343 \cdot 0.09 \approx 0.185 .
$$

On average $k/\theta = 3/0.7 \approx 4.3$ attempts.
:::
::::

:::note
The geometric distribution is **memoryless**: $P(X > m + n \mid X > m) = (1-\theta)^{m+n}/(1-\theta)^m = P(X > n)$.
After $m$ failures, the wait for the first success starts afresh — a coin has no memory of its
losing streak.
:::

## The hypergeometric distribution

### Drawing without replacement

A lot of $N$ items contains $M$ "successes" (say defective items). Draw $n$ of them **without
replacement**. The draws are not independent — each removes an item — so the count of successes
is not binomial. Count instead: all $\binom{N}{n}$ samples are equally likely, and the ones with
exactly $x$ successes choose $x$ of the $M$ and $n - x$ of the other $N - M$.

:::definition[Hypergeometric distribution]
$$
h(x; n, N, M) = \frac{\binom{M}{x}\binom{N - M}{n - x}}{\binom{N}{n}}, \qquad x = 0, 1, \dots, n,\ x \le M,\ n - x \le N - M .
$$
:::

::::theorem[Hypergeometric mean and variance]
$$
\mu = \frac{nM}{N}
\qquad
\sigma^2 = \frac{nM(N - M)(N - n)}{N^2(N - 1)} .
$$

:::proof
Mean: write $X = X_1 + \dots + X_n$, $X_i = 1$ if draw $i$ is a success. Each draw on its own is
equally likely to be any of the $N$ items, so $E[X_i] = M/N$ and $E[X] = nM/N$. The variance uses
the same decomposition, with the covariances of unit 9: the draws are negatively correlated, which
produces the factor $\frac{N - n}{N - 1} < 1$ (details in Miller & Miller 5.6).
:::
::::

::::example[Inspecting a lot]
A lot of 20 items contains 5 defectives. Four are chosen at random for inspection. Find the
probability that exactly one is defective, and compare with the binomial answer.

:::solution
$$
h(1; 4, 20, 5) = \frac{\binom51\binom{15}{3}}{\binom{20}{4}} = \frac{5 \cdot 455}{4845} \approx 0.470 .
$$

The binomial with $\theta = \frac{5}{20}$ (as if drawing with replacement) gives
$4 \cdot 0.25 \cdot 0.75^3 \approx 0.422$: a sample of 4 from 20 is too large a fraction of the
lot for the binomial to be accurate.
:::
::::

```sim
id: hypergeom-binomial
controls:
  - {id: N, label: population size N, min: 10, max: 500, step: 5, default: 20, decimals: 0}
  - {id: frac, label: share of successes M/N, min: 0.05, max: 0.95, step: 0.05, default: 0.25, decimals: 2}
  - {id: n, label: sample size n, min: 1, max: 10, step: 1, default: 4, decimals: 0}
note: "Green bars: the hypergeometric pmf (without replacement); red markers: the binomial with θ = M/N (with replacement). The means agree always; the hypergeometric variance is smaller by the factor (N − n)/(N − 1). The defaults are the lot of 20 with 5 defectives. Raise N with n fixed and the two pmfs merge — sampling a small fraction of a large population is almost like sampling with replacement."
```

```python
# Hypergeometric against binomial for the lot of 20 with 5 defectives.
from scipy import stats

N, M, n = 20, 5, 4
h = stats.hypergeom(N, M, n)            # scipy's order: population, successes, draws
b = stats.binom(n, M / N)
for x in range(n + 1):
    print(x, round(h.pmf(x), 4), round(b.pmf(x), 4))
print('variances:', h.var(), b.var(), 'ratio', h.var() / b.var(), '= (N-n)/(N-1) =', (N - n) / (N - 1))
```

:::caution
The binomial needs independent trials with a constant $\theta$. Drawing without replacement
violates both; use the hypergeometric, or the binomial only as an approximation when $n$ is a small
fraction of $N$ (a common rule: $n \le N/20$).
:::

## The Poisson distribution

### Rare events

Count events that happen at random over a stretch of time or space: customers arriving in an hour,
defects along a wire. Cut the stretch into $n$ tiny pieces, each containing an event with small
probability $\theta$, independently. The count is binomial with $n$ large and $\theta$ small, and
its mean $\lambda = n\theta$ is what we actually know.

:::definition[Poisson distribution]
$X$ has the **Poisson distribution** with parameter $\lambda > 0$ when

$$
p(x; \lambda) = \frac{\lambda^x e^{-\lambda}}{x!}, \qquad x = 0, 1, 2, \dots
$$

These add to 1 because $\sum_x \lambda^x / x! = e^{\lambda}$. Unlike the binomial, there is no
upper limit on $x$.
:::

::::theorem[Poisson limit of the binomial]
If $n \to \infty$ and $\theta \to 0$ with $n\theta = \lambda$ fixed, then
$b(x; n, \theta) \to p(x; \lambda)$ for every $x$.

:::proof
With $\theta = \lambda/n$,

$$
\begin{aligned}
b(x; n, \theta) &= \frac{n(n-1)\cdots(n-x+1)}{n^x}\cdot\frac{\lambda^x}{x!} \\
  &\quad \cdot\left(1 - \frac{\lambda}{n}\right)^{n}\left(1 - \frac{\lambda}{n}\right)^{-x} .
\end{aligned}
$$

As $n \to \infty$ the first factor and the last tend to 1 ($x$ is fixed), and
$\left(1 - \frac{\lambda}{n}\right)^n \to e^{-\lambda}$.
:::
::::

::::theorem[Poisson mean and variance]
$\mu = \lambda$ and $\sigma^2 = \lambda$.

:::proof
From the mgf $e^{\lambda(e^t - 1)}$, as computed in unit 8. (It also matches the binomial:
$n\theta = \lambda$ and $n\theta(1 - \theta) \to \lambda$ as $\theta \to 0$.)
:::
::::

::::example[Customers]
Customers arrive at a counter at an average of six per hour, as a Poisson count. Find the
probability of 0, 1 and 2 arrivals in an hour, and of more than 2.

:::solution
$\lambda = 6$: $p(0) = e^{-6} \approx 0.0025$, $p(1) = 6e^{-6} \approx 0.0149$,
$p(2) = 18e^{-6} \approx 0.0446$, so

$$
P(X > 2) = 1 - (0.0025 + 0.0149 + 0.0446) \approx 0.938 .
$$

Successive terms follow from $p(x + 1) = p(x)\cdot\frac{\lambda}{x + 1}$.
:::
::::

::::example[Defects in wire]
Defects occur along a wire at an average of one per 10 metres. What is the probability that a
12-metre roll has no defect? Exactly one? That of five rolls, two have exactly one defect and
three have none?

:::solution
For 12 metres $\lambda = 1.2$: $p(0) = e^{-1.2} \approx 0.3012$ and $p(1) = 1.2e^{-1.2} \approx 0.3614$.
The five rolls are independent, and each falls in one of three classes — one defect, none, two or
more — so the count is multinomial (last part of this unit) with the third class empty:

$$
\binom52 (0.3614)^2 (0.3012)^3 \approx 0.036 .
$$
:::
::::

```sim
id: binomial-poisson
controls:
  - {id: n, label: trials n, min: 1, max: 200, step: 1, default: 12, decimals: 0}
  - {id: p, label: "success probability θ", min: 0.01, max: 0.99, step: 0.01, default: 0.5, decimals: 2}
note: "Green bars: the binomial pmf; red markers: the Poisson pmf with the same mean λ = nθ. The defaults (n = 12, θ = 0.5, λ = 6) fit badly: the binomial's variance 3 is half the Poisson's 6. Try n = 60, θ = 0.1 (better), then n = 200, θ = 0.01 (almost exact) — the three cases from Doedel's tables. Large n and small θ is what the limit theorem asks for."
```

```python
# Binomial(n, theta) against Poisson(n * theta): the largest gap between the pmfs
# as n grows with the mean held at 6, and then with a small mean.
import numpy as np
from scipy import stats

for n, theta in [(12, 0.5), (60, 0.1), (600, 0.01), (200, 0.01)]:
    lam = n * theta
    k = np.arange(0, n + 1)
    gap = np.max(np.abs(stats.binom.pmf(k, n, theta) - stats.poisson.pmf(k, lam)))
    print(f'n={n:4d} theta={theta:<5} lambda={lam:4.1f}  largest gap {gap:.4f}')

print('customers, P(X > 2):', stats.poisson.sf(2, 6))                # 0.938
```

## The multinomial distribution

### More than two outcomes per trial

:::definition[Multinomial distribution]
In $n$ independent trials, each ending in one of $k$ outcomes with probabilities
$\theta_1, \dots, \theta_k$ ($\sum_i \theta_i = 1$), let $X_i$ count the trials with outcome $i$.
Then

$$
f(x_1, \dots, x_k; n, \theta_1, \dots, \theta_k) = \frac{n!}{x_1!\,x_2!\cdots x_k!}\,\theta_1^{x_1}\theta_2^{x_2}\cdots\theta_k^{x_k},
\qquad x_1 + \dots + x_k = n .
$$
:::

The coefficient counts the strings with $x_1$ letters of the first kind, $x_2$ of the second, and
so on; $k = 2$ is the binomial. Each $X_i$ on its own is binomial($n$, $\theta_i$), so
$E[X_i] = n\theta_i$ and $\operatorname{Var}(X_i) = n\theta_i(1 - \theta_i)$, and the counts are negatively
correlated: $\operatorname{cov}(X_i, X_j) = -n\theta_i\theta_j$ (they must add to $n$).

::::example[Ten rolls]
A die is rolled 10 times. What is the probability of exactly 3 ones, 4 even numbers and 3 threes
or fives?

:::solution
Three outcome classes with $\theta = \frac16, \frac12, \frac13$:

$$
\frac{10!}{3!\,4!\,3!}\left(\frac16\right)^3\left(\frac12\right)^4\left(\frac13\right)^3 = \frac{4200}{93312} \approx 0.045 .
$$
:::
::::

:::equations
- *Uniform on 1..k*: $\mu = (k+1)/2$ and $\sigma^2 = (k^2 - 1)/12$.
- *Bernoulli*: $\mu = \theta$ and $\sigma^2 = \theta(1 - \theta)$.
- *Binomial*: $b(x; n, \theta) = \binom{n}{x}\theta^x(1 - \theta)^{n-x}$, with $\mu = n\theta$ and $\sigma^2 = n\theta(1 - \theta)$.
- *Geometric*: $g(x; \theta) = \theta(1 - \theta)^{x - 1}$, with $\mu = 1/\theta$ and $\sigma^2 = (1 - \theta)/\theta^2$.
- *Negative binomial*: $b^*(x; k, \theta) = \binom{x-1}{k-1}\theta^k(1 - \theta)^{x-k}$, with $\mu = k/\theta$.
- *Hypergeometric*: $h(x; n, N, M) = \binom{M}{x}\binom{N-M}{n-x}/\binom{N}{n}$, with $\mu = nM/N$.
- *Poisson*: $p(x; \lambda) = \lambda^x e^{-\lambda}/x!$, with $\mu = \sigma^2 = \lambda$.
- *Multinomial*: $\frac{n!}{x_1!\cdots x_k!}\theta_1^{x_1}\cdots\theta_k^{x_k}$.
:::

:::insight
Most of these distributions are one experiment seen from different sides: independent Bernoulli
trials. Count the successes in $n$ trials — binomial; count the trials until $k$ successes —
negative binomial; let the trials become many and the successes rare — Poisson. Only the
hypergeometric breaks independence, by drawing from a finite lot.
:::

## Further reading

- [Binomial distribution](https://en.wikipedia.org/wiki/Binomial_distribution), [Poisson distribution](https://en.wikipedia.org/wiki/Poisson_distribution), [Hypergeometric distribution](https://en.wikipedia.org/wiki/Hypergeometric_distribution), [Negative binomial distribution](https://en.wikipedia.org/wiki/Negative_binomial_distribution) and [Multinomial distribution](https://en.wikipedia.org/wiki/Multinomial_distribution) — Wikipedia, each with its mgf and the relations between them.
- [Seeing Theory — Probability Distributions](https://seeing-theory.brown.edu/probability-distributions/index.html) — the binomial, geometric and Poisson pmfs with sliders.
- [OpenStax Introductory Statistics — Chapter 4](https://openstax.org/books/introductory-statistics/pages/4-introduction) — binomial, geometric, hypergeometric and Poisson with applied examples.
