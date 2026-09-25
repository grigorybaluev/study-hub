---
title: Product moments, linear combinations and conditional expectation
order: 9
status: detailed
weeks: [8]
introduces: [covariance, conditional-expectation]
requires:
  - {concept: joint-distribution, strength: hard}
  - {concept: expected-value, strength: hard}
  - {concept: variance, strength: hard}
reinforces:
  - {concept: expected-value, perspective: "of linear combinations"}
  - {concept: variance, perspective: "of linear combinations"}
---

Unit 7 summarised one random variable by its mean and variance. With two or more, a new question
appears: do they move together? The **covariance** measures that — the expected product of the
two deviations from the means — and it is exactly the extra term that appears in the variance of
a sum. This unit computes means and variances of **linear combinations** such as $X + Y$ or an
average of $n$ measurements, which is the arithmetic behind all of statistics, and then defines
the **conditional expectation**: the mean of $X$ once the value of $Y$ is known.

## Product moments and covariance

### Expected values of functions of two variables

The rule for $E[g(X)]$ extends to two variables with the same proof, summing or integrating
against the joint distribution:

$$
E[g(X, Y)] = \sum_x\sum_y g(x, y)\,p(x, y)
\qquad
E[g(X, Y)] = \iint g(x, y)\,f(x, y)\,dx\,dy .
$$

With $g(x, y) = x + y$ the double sum splits into $E[X] + E[Y]$ — **always**, whether or not $X$
and $Y$ are independent.

:::definition[Product moments and covariance]
The **product moments** of $X$ and $Y$ are $\mu'_{r,s} = E[X^r Y^s]$. The **covariance** is the
product moment about the means,

$$
\operatorname{cov}(X, Y) = \sigma_{XY} = E\big[(X - \mu_X)(Y - \mu_Y)\big].
$$
:::

The product $(x - \mu_X)(y - \mu_Y)$ is positive when both values are above their means or both
below, and negative when one is above and the other below. So $\sigma_{XY} > 0$ when large values
of $X$ tend to come with large values of $Y$, and $\sigma_{XY} < 0$ when they come with small ones.

::::theorem[Computing formula]
$$
\sigma_{XY} = E[XY] - \mu_X\,\mu_Y .
$$

:::proof
Expand the product and use linearity, the means being constants:

$$
\begin{aligned}
&E[XY - \mu_Y X - \mu_X Y + \mu_X\mu_Y] \\
  &= E[XY] - \mu_Y\mu_X - \mu_X\mu_Y + \mu_X\mu_Y \\
  &= E[XY] - \mu_X\mu_Y .
\end{aligned}
$$
:::
::::

::::theorem[Independence gives zero covariance]
If $X$ and $Y$ are independent, then $E[XY] = E[X]\,E[Y]$, and hence $\sigma_{XY} = 0$.

:::proof
Discrete case, factoring the joint pmf by independence:

$$
E[XY] = \sum_x\sum_y x\,y\,p_X(x)\,p_Y(y) = \Big(\sum_x x\,p_X(x)\Big)\Big(\sum_y y\,p_Y(y)\Big) = E[X]\,E[Y].
$$

The continuous case factors the double integral in the same way.
:::
::::

::::example[Zero covariance without independence]
$(X, Y)$ takes the five values $(1, 8)$, $(3, 8)$, $(2, 6)$, $(2, 10)$, $(2, 8)$, each with
probability $\frac15$. Show that $\sigma_{XY} = 0$ but $X$ and $Y$ are dependent.

:::solution
$E[X] = \frac{1 + 3 + 2 + 2 + 2}{5} = 2$, $E[Y] = \frac{8 + 8 + 6 + 10 + 8}{5} = 8$ and
$E[XY] = \frac{8 + 24 + 12 + 20 + 16}{5} = 16$, so $\sigma_{XY} = 16 - 2 \cdot 8 = 0$. But
$P(X = 1, Y = 6) = 0$ while $P(X = 1)\,P(Y = 6) = \frac15 \cdot \frac15 \ne 0$: dependent. The
points form a plus sign, symmetric about $(2, 8)$ — no linear trend, but knowing $X \ne 2$ pins
$Y$ down to 8.
:::
::::

::::example[Covariance in the three-toss table]
With $X$ = the number of heads and $Y$ = the toss of the first head ($Y = 0$ for $TTT$), find
$\sigma_{XY}$.

:::solution
From the marginals of unit 6, $E[X] = \frac32$ and $E[Y] = 0 \cdot \frac18 + 1 \cdot \frac48 + 2 \cdot \frac28 + 3 \cdot \frac18 = \frac{11}{8}$.
Summing $xy\,p(x, y)$ over the table,

$$
E[XY] = \frac{3 + 4 + 1 + 4 + 2 + 3}{8} = \frac{17}{8}
\qquad
\sigma_{XY} = \frac{17}{8} - \frac32 \cdot \frac{11}{8} = \frac{1}{16} .
$$

Slightly positive — driven by the outcome $TTT$, which has the fewest heads and was coded $Y = 0$,
the smallest value. Among the other seven outcomes, an early first head goes with more heads.
:::
::::

::::example[A continuous covariance]
For $f(x, y) = x + y$ on the unit square, find $\sigma_{XY}$.

:::solution
By symmetry $\mu_X = \mu_Y = \int_0^1 x\,(x + \frac12)\,dx = \frac13 + \frac14 = \frac{7}{12}$, and

$$
E[XY] = \int_0^1\int_0^1 xy(x + y)\,dx\,dy = \frac13 \cdot \frac12 + \frac12 \cdot \frac13 = \frac13
\qquad
\sigma_{XY} = \frac13 - \frac{49}{144} = -\frac{1}{144} .
$$
:::
::::

:::caution
$\sigma_{XY} = 0$ does **not** imply independence: covariance detects only a *linear* tendency.
Independence implies zero covariance, not the other way round.
:::

## Moments of linear combinations

### Means and variances of sums

::::theorem[Linear combinations]
For random variables $X_1, \dots, X_n$ and constants $a_1, \dots, a_n$, with $Y = \sum_i a_i X_i$:

$$
E[Y] = \sum_{i=1}^{n} a_i\,E[X_i]
\qquad
\operatorname{Var}(Y) = \sum_{i=1}^{n} a_i^2 \operatorname{Var}(X_i) + 2\sum_{i < j} a_i a_j \operatorname{cov}(X_i, X_j).
$$

:::proof
The mean is linearity. For the variance, $Y - E[Y] = \sum_i a_i (X_i - \mu_i)$, and squaring a sum
gives the squares plus twice every cross product:

$$
\begin{aligned}
\big(Y - E[Y]\big)^2 &= \sum_i a_i^2 (X_i - \mu_i)^2 \\
  &\quad + 2\sum_{i<j} a_i a_j (X_i - \mu_i)(X_j - \mu_j) .
\end{aligned}
$$

Taking expected values term by term gives the formula.
:::
::::

::::corollary[Independent summands]
If $X_1, \dots, X_n$ are independent, $\operatorname{Var}\big(\sum_i a_i X_i\big) = \sum_i a_i^2 \operatorname{Var}(X_i)$.
In particular $\operatorname{Var}(X + Y) = \operatorname{Var}(X - Y) = \operatorname{Var}(X) + \operatorname{Var}(Y)$ for independent $X, Y$.

:::proof
Every covariance term vanishes by the previous part. For $X - Y$ the coefficient of $\operatorname{Var}(Y)$ is $(-1)^2 = 1$.
:::
::::

::::corollary[The average of n measurements]
If $X_1, \dots, X_n$ are independent, each with mean $\mu$ and variance $\sigma^2$, their average
$\bar X = \frac1n\sum_i X_i$ has

$$
E[\bar X] = \mu
\qquad
\operatorname{Var}(\bar X) = \frac{\sigma^2}{n} .
$$

:::proof
Take $a_i = \frac1n$: the mean is $n \cdot \frac{\mu}{n}$ and the variance is $n \cdot \frac{\sigma^2}{n^2}$.
:::
::::

### Correlation

:::definition[Correlation coefficient]
$\rho = \dfrac{\sigma_{XY}}{\sigma_X\,\sigma_Y}$, when $\sigma_X, \sigma_Y > 0$. It is the covariance
of the standardised variables $X/\sigma_X$ and $Y/\sigma_Y$, so it does not depend on the units of
measurement.
:::

::::theorem[Correlation is between −1 and 1]
$-1 \le \rho \le 1$.

:::proof
By the linear-combinations theorem with $a_1 = \frac{1}{\sigma_X}$ and $a_2 = \pm\frac{1}{\sigma_Y}$,

$$
0 \le \operatorname{Var}\!\left(\frac{X}{\sigma_X} \pm \frac{Y}{\sigma_Y}\right) = 1 + 1 \pm 2\rho = 2(1 \pm \rho),
$$

so $1 + \rho \ge 0$ and $1 - \rho \ge 0$.
:::
::::

::::example[Variance of a combination]
$\operatorname{Var}(X) = 2$, $\operatorname{Var}(Y) = 3$ and $\operatorname{cov}(X, Y) = 1$. Find
$\operatorname{Var}(3X + 4Y - 5)$ and $\rho$.

:::solution
The constant drops out:

$$
\operatorname{Var}(3X + 4Y - 5) = 9 \cdot 2 + 16 \cdot 3 + 2 \cdot 3 \cdot 4 \cdot 1 = 18 + 48 + 24 = 90 .
$$

And $\rho = \frac{1}{\sqrt{2}\sqrt{3}} \approx 0.41$.
:::
::::

::::example[How many exam scores to average]
Each student's exam score has mean 65 and standard deviation 5, independently of the others. How
many students must write so that, by Chebyshev's theorem, their average lies between 60 and 70
with probability at least 0.8?

:::solution
$\bar X$ has mean 65 and variance $25/n$. Chebyshev's theorem in the form
$P(|\bar X - \mu| \ge c) \le \operatorname{Var}(\bar X)/c^2$ (take $k = c/\sigma$) gives

$$
P\big(|\bar X - 65| \ge 5\big) \le \frac{25/n}{25} = \frac1n ,
$$

which is at most $0.2$ once $n \ge 5$. Averaging shrinks the spread by $\sqrt n$; this is why
averages are more reliable than single measurements.
:::
::::

```sim
id: covariance-scatter
controls:
  - {id: rho, label: "correlation ρ", min: -1, max: 1, step: 0.05, default: 0.6, decimals: 2}
  - {id: sx, label: σ_X, min: 0.5, max: 3, step: 0.1, default: 1, decimals: 1}
  - {id: sy, label: σ_Y, min: 0.5, max: 3, step: 0.1, default: 1, decimals: 1}
  - {id: n, label: sample size, min: 20, max: 1000, step: 10, default: 300, decimals: 0}
note: "Random draws of (X, Y) with the chosen standard deviations and correlation. Dotted lines are the sample means; green points have a positive product (x − x̄)(y − ȳ) (top-right and bottom-left quadrants), red points a negative one. The covariance is the average of those products, so it is positive when green dominates. Change σ_X and watch the covariance scale while r stays put. The second title line is the variance of X + Y from the formula."
```

```python
# Covariance and correlation of simulated data against the model values,
# and the variance of X + Y from the formula.
import numpy as np

rng = np.random.default_rng(1)
rho, sx, sy, n = 0.6, 1.0, 2.0, 5000
cov = [[sx**2, rho * sx * sy], [rho * sx * sy, sy**2]]
X, Y = rng.multivariate_normal([0, 0], cov, size=n).T

print('sample cov :', np.cov(X, Y)[0, 1], ' model:', rho * sx * sy)
print('sample r   :', np.corrcoef(X, Y)[0, 1], ' model:', rho)
print('Var(X + Y) :', np.var(X + Y, ddof=1), ' formula:', sx**2 + sy**2 + 2 * rho * sx * sy)

# Zero covariance, yet dependent: the plus-sign example.
pts = np.array([(1, 8), (3, 8), (2, 6), (2, 10), (2, 8)])
x, y = pts.T
print('cov of the plus sign:', np.mean(x * y) - x.mean() * y.mean())       # 0.0
```

:::caution
$\operatorname{Var}(X - Y)$ is $\operatorname{Var}(X) + \operatorname{Var}(Y) - 2\sigma_{XY}$, with a plus
between the variances: subtracting a random quantity adds uncertainty, it never cancels it.
:::

:::insight
Means of linear combinations are always easy (linearity); variances need the covariances, and
independence is what makes them disappear. That single fact — $\operatorname{Var}(\bar X) = \sigma^2/n$ —
is why taking more measurements works.
:::

## Conditional expectation

### The mean given the value of the other variable

:::definition[Conditional expectation and conditional variance]
The **conditional expectation** of $u(X)$ given $Y = y$ is its expected value under the conditional
distribution of unit 6:

$$
E[u(X) \mid y] = \sum_x u(x)\,p(x \mid y)
\qquad\text{or}\qquad
\int_{-\infty}^{\infty} u(x)\,f(x \mid y)\,dx .
$$

With $u(x) = x$ it is the **conditional mean** $\mu_{X \mid y} = E[X \mid y]$, and the **conditional
variance** is $\sigma^2_{X \mid y} = E[X^2 \mid y] - \mu_{X \mid y}^2$.
:::

::::theorem[Law of total expectation]
$$
E[X] = \sum_y E[X \mid y]\,p_Y(y)
\qquad\text{or}\qquad
E[X] = \int_{-\infty}^{\infty} E[X \mid y]\,f_Y(y)\,dy .
$$

The overall mean is the average of the conditional means, weighted by how likely each condition is.

:::proof
Discrete case, with $p(x \mid y)\,p_Y(y) = p(x, y)$:

$$
\sum_y E[X \mid y]\,p_Y(y) = \sum_y\sum_x x\,p(x \mid y)\,p_Y(y) = \sum_x x\sum_y p(x, y) = \sum_x x\,p_X(x) = E[X].
$$

It is the law of total probability of unit 3, applied to every value of $X$ at once.
:::
::::

::::example[Conditional means in the three-toss table]
Find $E[X \mid Y = y]$ for each $y$, the conditional variance given $Y = 1$, and check the law of
total expectation.

:::solution
Given $Y = 1$, unit 6 found $p(x \mid 1) = \frac14, \frac12, \frac14$ for $x = 1, 2, 3$, so

$$
E[X \mid 1] = 2
\qquad
E[X^2 \mid 1] = \tfrac14 + 2 + \tfrac94 = \tfrac92
\qquad
\sigma^2_{X \mid 1} = \tfrac92 - 4 = \tfrac12 .
$$

The other columns: $Y = 0$ is $TTT$, so $E[X \mid 0] = 0$; $Y = 2$ is $THH$ or $THT$, so
$E[X \mid 2] = \frac32$; $Y = 3$ is $TTH$, so $E[X \mid 3] = 1$. Weighting by $p_Y$:

$$
0 \cdot \tfrac18 + 2 \cdot \tfrac48 + \tfrac32 \cdot \tfrac28 + 1 \cdot \tfrac18 = \tfrac{8 + 3 + 1}{8} = \tfrac32 = E[X]. \checkmark
$$
:::
::::

::::example[A continuous conditional mean]
For $f(x, y) = x + y$ on the unit square, find $E[X \mid y]$.

:::solution
With $f(x \mid y) = \dfrac{x + y}{y + \frac12}$ from unit 6,

$$
E[X \mid y] = \frac{\int_0^1 x(x + y)\,dx}{y + \frac12} = \frac{\frac13 + \frac{y}{2}}{y + \frac12} = \frac{2 + 3y}{3(1 + 2y)}, \qquad 0 < y < 1 .
$$

It falls from $\frac23$ at $y = 0$ to $\frac59$ at $y = 1$: the larger $Y$, the smaller the
conditional mean of $X$ — consistent with the negative covariance found above.
:::
::::

:::equations
- *Covariance*: $\sigma_{XY} = E[(X - \mu_X)(Y - \mu_Y)] = E[XY] - \mu_X\mu_Y$; independence gives $0$.
- *Correlation*: $\rho = \sigma_{XY}/(\sigma_X\sigma_Y)$, $-1 \le \rho \le 1$.
- *Linear combination*: $E[\sum a_i X_i] = \sum a_i\mu_i$.
- *Its variance*: $\operatorname{Var}(\sum a_i X_i) = \sum a_i^2\sigma_i^2 + 2\sum_{i<j} a_i a_j \sigma_{ij}$.
- *Average*: $E[\bar X] = \mu$ and $\operatorname{Var}(\bar X) = \sigma^2/n$ for independent measurements.
- *Conditional mean*: $E[X \mid y] = \sum_x x\,p(x \mid y)$ and $E[X] = \sum_y E[X \mid y]\,p_Y(y)$.
:::

:::insight
The conditional mean $E[X \mid y]$ is the best prediction of $X$ once $y$ is known, a function of
$y$; averaging those predictions over $Y$ returns the plain mean. Regression, in statistics and in
machine learning, is the business of estimating $E[X \mid y]$ from data.
:::

## Further reading

- [Covariance](https://en.wikipedia.org/wiki/Covariance) and [Pearson correlation coefficient](https://en.wikipedia.org/wiki/Pearson_correlation_coefficient) — Wikipedia, including the zero-correlation-but-dependent pictures.
- [Variance — sum of correlated variables](https://en.wikipedia.org/wiki/Variance#Sum_of_correlated_variables) — Wikipedia.
- [Conditional expectation](https://en.wikipedia.org/wiki/Conditional_expectation) and [Law of total expectation](https://en.wikipedia.org/wiki/Law_of_total_expectation) — Wikipedia.
- [Seeing Theory — Regression Analysis](https://seeing-theory.brown.edu/regression-analysis/index.html) — correlation and conditional means on scatter plots.
