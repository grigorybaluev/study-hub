---
title: Special continuous distributions
order: 11
status: detailed
weeks: [11, 12]
textbook: "Miller & Miller, John E. Freund's Mathematical Statistics with Applications, 8e, 6"
notes: ["Doedel, Probability and Statistics lecture notes (Concordia), pp. 187–195: the uniform and exponential random variables, memorylessness and the failing device", "Doedel, pp. 196–205: the standard and general normal random variables, the table of Φ, standardisation", "Doedel, pp. 206–212: the chi-square random variable and its moment-generating function", "Miller & Miller 6.3–6.4 and 6.6–6.7: the gamma and beta families and the normal approximations (not in Doedel's notes)"]
introduces: [continuous-uniform-distribution, exponential-distribution, gamma-distribution, chi-square-distribution, beta-distribution, normal-distribution, normal-approximation]
requires:
  - {concept: probability-density-function, strength: hard}
  - {concept: improper-integral, strength: hard}
  - {concept: integration-by-parts, strength: hard}
  - {concept: substitution-rule, strength: hard}
  - {concept: moment-generating-function, strength: soft}
  - {concept: binomial-distribution, strength: soft}
  - {concept: poisson-distribution, strength: soft}
reinforces: []
---

The continuous counterpart of unit 10: a few densities with parameters that fit so many
situations that their properties are worth deriving once. The **uniform** spreads probability
evenly over an interval; the **gamma** family, with the **exponential** and the **chi-square** as
special cases, models waiting times and sums of squares; the **beta** family lives on $(0, 1)$ and
models proportions; and the **normal** density, the bell curve, describes sums and averages of many
small independent effects — which is why it can stand in for the binomial and the Poisson when
their parameters are large.

## The uniform distribution

### Equal density over an interval

:::definition[Uniform distribution]
$X$ is **uniform** on $(\alpha, \beta)$ when

$$
u(x; \alpha, \beta) = \frac{1}{\beta - \alpha} \ \text{ for } \alpha < x < \beta, \ \text{ and } 0 \text{ elsewhere.}
$$

Its distribution function rises linearly: $F(x) = \dfrac{x - \alpha}{\beta - \alpha}$ on $(\alpha, \beta)$.
The pointer of unit 5 is uniform on $(0, 1)$.
:::

::::proposition[Uniform mean and variance]
$\mu = \dfrac{\alpha + \beta}{2}$ and $\sigma^2 = \dfrac{(\beta - \alpha)^2}{12}$.

:::proof
$\mu = \frac{1}{\beta - \alpha}\int_\alpha^\beta x\,dx = \frac{\beta^2 - \alpha^2}{2(\beta - \alpha)} = \frac{\alpha + \beta}{2}$.
Similarly $E[X^2] = \frac{\beta^3 - \alpha^3}{3(\beta - \alpha)} = \frac{\alpha^2 + \alpha\beta + \beta^2}{3}$,
and subtracting $\mu^2$ leaves $\frac{\alpha^2 - 2\alpha\beta + \beta^2}{12}$.
:::
::::

::::example[A bus every 20 minutes]
A bus comes every 20 minutes and you arrive at a random time. Find the probability of waiting more
than 15 minutes, and the mean and standard deviation of the wait.

:::solution
The wait is uniform on $(0, 20)$: $P(X > 15) = \frac{5}{20} = 0.25$, $\mu = 10$ minutes and
$\sigma = \frac{20}{\sqrt{12}} \approx 5.8$ minutes.
:::
::::

## The gamma, exponential and chi-square distributions

### The gamma function

:::definition[Gamma function]
For $\alpha > 0$, $\displaystyle\Gamma(\alpha) = \int_0^\infty y^{\alpha - 1} e^{-y}\,dy$.
:::

::::proposition[Properties of the gamma function]
$\Gamma(\alpha) = (\alpha - 1)\,\Gamma(\alpha - 1)$ for $\alpha > 1$; $\Gamma(1) = 1$, so
$\Gamma(n) = (n - 1)!$ for positive integers $n$; and $\Gamma(\frac12) = \sqrt\pi$.

:::proof
Integrate by parts with $u = y^{\alpha - 1}$, $dv = e^{-y}dy$: the boundary term
$\big[-y^{\alpha-1}e^{-y}\big]_0^\infty$ vanishes and what remains is
$(\alpha - 1)\int_0^\infty y^{\alpha - 2}e^{-y}\,dy$. $\Gamma(1) = \int_0^\infty e^{-y}dy = 1$, and
induction gives $(n - 1)!$. $\Gamma(\frac12) = \sqrt\pi$ is cited; it is the normal integral
below in disguise (substitute $y = z^2/2$).
:::
::::

### The gamma family

:::definition[Gamma distribution]
$X$ has the **gamma distribution** with parameters $\alpha > 0$ (shape) and $\beta > 0$ (scale) when

$$
g(x; \alpha, \beta) = \frac{1}{\beta^\alpha\,\Gamma(\alpha)}\,x^{\alpha - 1}e^{-x/\beta} \ \text{ for } x > 0, \ \text{ and } 0 \text{ elsewhere.}
$$

(Substituting $y = x/\beta$ turns its integral into $\Gamma(\alpha)/\Gamma(\alpha) = 1$.)
:::

::::theorem[Gamma moments]
$$
\mu'_r = \frac{\beta^r\,\Gamma(\alpha + r)}{\Gamma(\alpha)}
\qquad
\mu = \alpha\beta
\qquad
\sigma^2 = \alpha\beta^2
\qquad
M_X(t) = (1 - \beta t)^{-\alpha},\ t < \tfrac1\beta .
$$

:::proof
$$
E[X^r] = \frac{1}{\beta^\alpha\Gamma(\alpha)}\int_0^\infty x^{\alpha + r - 1}e^{-x/\beta}\,dx = \frac{\beta^{\alpha + r}\,\Gamma(\alpha + r)}{\beta^\alpha\,\Gamma(\alpha)},
$$

by the substitution $y = x/\beta$. With $r = 1$ and $\Gamma(\alpha + 1) = \alpha\Gamma(\alpha)$,
$\mu = \alpha\beta$; with $r = 2$, $\mu'_2 = \alpha(\alpha + 1)\beta^2$ and $\sigma^2 = \alpha\beta^2$.
The mgf is the same integral with $e^{-x/\beta}$ replaced by $e^{-x(1/\beta - t)}$.
:::
::::

### Exponential: α = 1

:::definition[Exponential distribution]
The gamma distribution with $\alpha = 1$ and $\beta = \theta$ is the **exponential distribution**,

$$
g(x; \theta) = \frac1\theta\,e^{-x/\theta}, \ x > 0
\qquad
F(x) = 1 - e^{-x/\theta},
$$

with $\mu = \theta$ and $\sigma^2 = \theta^2$. Doedel writes it with the rate $\lambda = 1/\theta$:
$f(x) = \lambda e^{-\lambda x}$. The density $e^{-x}$ of units 5–8 is the case $\theta = 1$.
:::

::::theorem[The exponential distribution is memoryless]
For $x, \Delta x > 0$: $P(X > x + \Delta x \mid X > x) = P(X > \Delta x)$.

:::proof
$P(X > x) = 1 - F(x) = e^{-x/\theta}$, and $\{X > x + \Delta x\} \subset \{X > x\}$, so

$$
P(X > x + \Delta x \mid X > x) = \frac{P(X > x + \Delta x)}{P(X > x)} = \frac{e^{-(x + \Delta x)/\theta}}{e^{-x/\theta}} = e^{-\Delta x/\theta} = P(X > \Delta x).
$$
:::
::::

If $X$ is the lifetime of a device, a device that has worked for $x$ hours is as good as new: the
chance it lasts another $\Delta x$ does not depend on its age. That fits electronic parts that fail
from sudden external shocks, and fits hearts or car engines, which wear out, very badly.

::::example[Waiting for a call]
Calls reach a help desk with exponential gaps averaging 5 minutes. What is the probability of
waiting more than 10 minutes? If 10 minutes have already passed without a call, what is the
probability of waiting 10 more?

:::solution
$\theta = 5$: $P(X > 10) = e^{-10/5} = e^{-2} \approx 0.135$. By memorylessness the second answer is
the same, $0.135$.
:::
::::

:::note
The exponential and the Poisson describe one process. If events occur at random at an average rate
of $\lambda$ per unit time, the number in a unit interval is Poisson($\lambda$) and the gap between
consecutive events is exponential with mean $\theta = 1/\lambda$. The waiting time until the $k$-th
event is gamma with $\alpha = k$, $\beta = 1/\lambda$ — the continuous twin of the negative binomial.
:::

### Chi-square: β = 2

:::definition[Chi-square distribution]
The gamma distribution with $\alpha = \frac{\nu}{2}$ and $\beta = 2$ is the **chi-square
distribution** with $\nu$ **degrees of freedom**; so $\mu = \nu$, $\sigma^2 = 2\nu$ and
$M_X(t) = (1 - 2t)^{-\nu/2}$.
:::

Its importance comes from the normal distribution: the next part shows that the square of a
standard normal variable is chi-square with $\nu = 1$, so by the product rule for mgfs the sum of
squares of $\nu$ independent standard normals is chi-square with $\nu$ degrees of freedom. That sum
is how sample variances behave, and the chi-square tables are used in statistics courses for tests
and intervals.

## The beta distribution

### Densities on the unit interval

:::definition[Beta distribution]
$X$ has the **beta distribution** with parameters $\alpha, \beta > 0$ when

$$
f(x; \alpha, \beta) = \frac{\Gamma(\alpha + \beta)}{\Gamma(\alpha)\,\Gamma(\beta)}\,x^{\alpha - 1}(1 - x)^{\beta - 1} \ \text{ for } 0 < x < 1, \ \text{ and } 0 \text{ elsewhere.}
$$
:::

::::proposition[Beta mean and variance]
$$
\mu = \frac{\alpha}{\alpha + \beta}
\qquad
\sigma^2 = \frac{\alpha\beta}{(\alpha + \beta)^2(\alpha + \beta + 1)} .
$$

:::proof
The constant makes the density integrate to 1, which says
$\int_0^1 x^{\alpha - 1}(1 - x)^{\beta - 1}dx = \frac{\Gamma(\alpha)\Gamma(\beta)}{\Gamma(\alpha + \beta)}$
(cited). Then $E[X]$ is the same integral with $\alpha + 1$ in place of $\alpha$:

$$
E[X] = \frac{\Gamma(\alpha + \beta)}{\Gamma(\alpha)\Gamma(\beta)}\cdot\frac{\Gamma(\alpha + 1)\Gamma(\beta)}{\Gamma(\alpha + \beta + 1)} = \frac{\alpha}{\alpha + \beta},
$$

using $\Gamma(z + 1) = z\Gamma(z)$ twice. $E[X^2]$ goes the same way with $\alpha + 2$.
:::
::::

::::example[A density met before]
Identify $f(x) = 6x(1 - x)$ on $(0, 1)$ from unit 5 as a beta density and find its variance.

:::solution
$x^{\alpha-1}(1-x)^{\beta-1}$ with $\alpha = \beta = 2$, and $\frac{\Gamma(4)}{\Gamma(2)\Gamma(2)} = \frac{3!}{1 \cdot 1} = 6$.
So $\mu = \frac12$ and $\sigma^2 = \frac{2 \cdot 2}{4^2 \cdot 5} = \frac{1}{20}$. With
$\alpha = \beta = 1$ the beta is the uniform on $(0, 1)$.
:::
::::

```sim
id: gamma-beta-shapes
controls:
  - {id: fam, label: "family (0: gamma, 1: beta)", min: 0, max: 1, step: 1, default: 0, decimals: 0}
  - {id: alpha, label: α, min: 0.5, max: 10, step: 0.5, default: 2, decimals: 1}
  - {id: beta, label: β, min: 0.5, max: 10, step: 0.5, default: 1, decimals: 1}
note: "Gamma: α sets the shape (α ≤ 1 is highest at 0, α > 1 rises then falls, large α looks like a bell), β stretches the axis; α = 1 gives the exponential and β = 2 the chi-square with ν = 2α degrees of freedom. Beta: everything lives on (0, 1); α = β is symmetric, α = β = 1 is flat, α = β = 2 is the 6x(1 − x) of unit 5, and α < 1 or β < 1 pushes mass against an end."
```

```python
# Gamma and beta densities with scipy.stats; note scipy's gamma takes the shape a = alpha
# and scale = beta, which matches Miller & Miller's parametrisation.
import numpy as np
from scipy import stats

for a, b in [(1, 2), (2, 1), (5, 1), (1.5, 2)]:
    g = stats.gamma(a, scale=b)
    print(f'gamma(alpha={a}, beta={b}): mean {g.mean():.3f} = alpha*beta, var {g.var():.3f} = alpha*beta^2')

print('exponential, theta = 5: P(X > 10) =', stats.expon(scale=5).sf(10))          # e^-2
print('chi-square(4) is gamma(2, 2):', stats.chi2(4).mean(), stats.gamma(2, scale=2).mean())

bt = stats.beta(2, 2)
print('beta(2, 2): pdf at 0.5 =', bt.pdf(0.5), '(6x(1-x) gives 1.5), var =', bt.var())  # 0.05
```

## The normal distribution

### The bell curve

:::definition[Normal distribution]
$X$ has the **normal distribution** with parameters $\mu$ and $\sigma > 0$ when

$$
n(x; \mu, \sigma) = \frac{1}{\sigma\sqrt{2\pi}}\,e^{-\frac12\left(\frac{x - \mu}{\sigma}\right)^2}, \qquad -\infty < x < \infty .
$$

The case $\mu = 0$, $\sigma = 1$ is the **standard normal** distribution, usually called $Z$, with
distribution function $\Phi(z) = \int_{-\infty}^{z} \frac{1}{\sqrt{2\pi}}e^{-t^2/2}\,dt$.
:::

The curve is symmetric about $\mu$, has inflection points at $\mu \pm \sigma$ and tails that fall off
faster than any exponential. $\Phi$ has no formula in elementary functions: its values come from a
table or software.

::::theorem[Normal mean, variance and mgf]
$$
M_X(t) = e^{\mu t + \frac12\sigma^2 t^2}
\qquad
E[X] = \mu
\qquad
\operatorname{Var}(X) = \sigma^2 .
$$

:::proof
For the standard normal, complete the square in the exponent:

$$
E[e^{tZ}] = \int_{-\infty}^{\infty} \frac{1}{\sqrt{2\pi}}e^{tz - z^2/2}\,dz = e^{t^2/2}\int_{-\infty}^{\infty} \frac{1}{\sqrt{2\pi}}e^{-(z - t)^2/2}\,dz = e^{t^2/2},
$$

the last integral being the area under a shifted standard normal curve. Since $X = \mu + \sigma Z$
(next theorem), $M_X(t) = e^{\mu t}M_Z(\sigma t) = e^{\mu t + \sigma^2 t^2/2}$ by unit 8. Then
$M'_X(0) = \mu$ and $M''_X(0) = \sigma^2 + \mu^2$.
:::
::::

::::theorem[Standardisation]
If $X$ is normal with parameters $\mu$ and $\sigma$, then $Z = \dfrac{X - \mu}{\sigma}$ is standard normal, and

$$
P(a < X \le b) = \Phi\!\left(\frac{b - \mu}{\sigma}\right) - \Phi\!\left(\frac{a - \mu}{\sigma}\right).
$$

:::proof
For any $c$, substitute $z = (x - \mu)/\sigma$, $dx = \sigma\,dz$:

$$
P\!\left(\frac{X - \mu}{\sigma} \le c\right) = P(X \le \mu + c\sigma) = \int_{-\infty}^{\mu + c\sigma} \frac{1}{\sigma\sqrt{2\pi}}e^{-\frac12\left(\frac{x-\mu}{\sigma}\right)^2}dx = \int_{-\infty}^{c} \frac{1}{\sqrt{2\pi}}e^{-z^2/2}\,dz = \Phi(c).
$$
:::
::::

So one table, of $\Phi$, serves every normal distribution. It usually lists $\Phi(z)$ for $z \ge 0$
(or only $z \le 0$); the other half comes from the symmetry $\Phi(-z) = 1 - \Phi(z)$.

::::theorem[The square of a standard normal is chi-square]
$Z^2$ has the chi-square distribution with one degree of freedom.

:::proof
$E[e^{tZ^2}] = \int \frac{1}{\sqrt{2\pi}}e^{-\frac12 z^2(1 - 2t)}\,dz$. With
$\hat\sigma = (1 - 2t)^{-1/2}$ the integrand is $\hat\sigma$ times a normal density with standard
deviation $\hat\sigma$, so the integral is $\hat\sigma = (1 - 2t)^{-1/2}$ for $t < \frac12$: the
chi-square mgf with $\nu = 1$. By uniqueness (unit 8), $Z^2$ is chi-square.
:::
::::

::::example[Standard normal probabilities]
For standard normal $Z$ find $P(-1 \le Z \le 1)$ and $P(|Z| \le 0.5)$.

:::solution
$P(-1 \le Z \le 1) = \Phi(1) - \Phi(-1) = 2\Phi(1) - 1 = 2(0.8413) - 1 \approx 0.683$, and
$P(|Z| \le 0.5) = 2\Phi(0.5) - 1 = 2(0.6915) - 1 \approx 0.383$.
:::
::::

::::example[A general normal]
$X$ is normal with $\mu = 1.5$ and $\sigma = 2.5$. Find $P(X \ge 0.5)$ and $P(|X - \mu| \le 0.5)$.

:::solution
Standardise: $0.5$ becomes $z = \frac{0.5 - 1.5}{2.5} = -0.4$, so

$$
P(X \ge 0.5) = 1 - \Phi(-0.4) = \Phi(0.4) \approx 0.655
\qquad
P(|X - \mu| \le 0.5) = 2\Phi(0.2) - 1 \approx 0.159 .
$$
:::
::::

```sim
id: normal-standardize
controls:
  - {id: mu, label: μ, min: -5, max: 5, step: 0.1, default: 1.5, decimals: 1}
  - {id: sigma, label: σ, min: 0.3, max: 4, step: 0.1, default: 2.5, decimals: 1}
  - {id: a, label: a, min: -10, max: 10, step: 0.1, default: 0.5, decimals: 1}
  - {id: b, label: b, min: -10, max: 10, step: 0.1, default: 10, decimals: 1}
note: "Top: the density of X with the area over (a, b] shaded. Bottom: the standard normal with the area over the standardised interval — the same number, read from one table of Φ. The defaults are P(X ≥ 0.5) for μ = 1.5, σ = 2.5 (b = 10 is 3.4σ above the mean, as good as infinity). Set μ = 0, σ = 1, a = −2, b = 2 for the 95 % of the 68–95–99.7 rule."
```

```python
# Normal probabilities by standardising, against scipy's normal distribution.
from scipy import stats

mu, sigma = 1.5, 2.5
Phi = stats.norm.cdf                       # the standard normal distribution function

print('P(X >= 0.5)       :', 1 - Phi((0.5 - mu) / sigma), stats.norm(mu, sigma).sf(0.5))
print('P(|X - mu| <= 0.5):', Phi(0.5 / sigma) - Phi(-0.5 / sigma))
for k in (1, 2, 3):                        # the 68-95-99.7 rule, against Chebyshev's 1 - 1/k^2
    print(f'within {k} sigma: {2 * Phi(k) - 1:.4f}   (Chebyshev guarantees {1 - 1 / k**2:.4f})')
```

:::caution
Standardise before looking anything up: $P(X \le 3)$ for $\mu = 1.5$, $\sigma = 2.5$ is
$\Phi(0.6)$, not $\Phi(3)$. And the second parameter is the **standard deviation** here; some books
and software write $N(\mu, \sigma^2)$ with the variance instead.
:::

## Normal approximations

### To the binomial and to the Poisson

:::theorem[Normal approximation to the binomial]
If $X$ is binomial($n$, $\theta$), then as $n \to \infty$ the distribution of

$$
Z = \frac{X - n\theta}{\sqrt{n\theta(1 - \theta)}}
$$

approaches the standard normal. (Cited; it is the de Moivre–Laplace theorem, a special case of the
central limit theorem, since $X$ is a sum of $n$ independent Bernoulli variables.)
:::

A common rule: use it when both $n\theta$ and $n(1 - \theta)$ exceed 5. Because $X$ takes only
integer values while the normal curve is continuous, each probability $b(x)$ is matched with the
area under the curve from $x - \frac12$ to $x + \frac12$ — the **continuity correction**:

$$
P(X \le k) \approx \Phi\!\left(\frac{k + \frac12 - n\theta}{\sqrt{n\theta(1 - \theta)}}\right).
$$

:::theorem[Normal approximation to the Poisson]
If $X$ is Poisson($\lambda$), then $\dfrac{X - \lambda}{\sqrt\lambda}$ approaches the standard normal as
$\lambda \to \infty$. (Cited.)
:::

::::example[Twelve tosses, approximated]
Approximate $P(X \le 5)$ for the number of heads in 12 tosses (exactly $0.387$ in unit 10).

:::solution
$n\theta = 6$ and $\sqrt{n\theta(1 - \theta)} = \sqrt3 \approx 1.732$. With the continuity correction,

$$
P(X \le 5) \approx \Phi\!\left(\frac{5.5 - 6}{1.732}\right) = \Phi(-0.29) \approx 0.386,
$$

remarkably close for $n = 12$. Without it, $\Phi\!\left(\frac{5 - 6}{1.732}\right) = \Phi(-0.58) \approx 0.282$ —
badly off.
:::
::::

::::example[A hundred tosses]
Approximate the probability of at least 60 heads in 100 tosses of a fair coin.

:::solution
$\mu = 50$, $\sigma = 5$. "At least 60" is $X \ge 60$, which in the continuous picture starts at
$59.5$:

$$
P(X \ge 60) \approx 1 - \Phi\!\left(\frac{59.5 - 50}{5}\right) = 1 - \Phi(1.9) \approx 0.029 .
$$

The exact binomial value is $0.028$.
:::
::::

::::example[Customers, with a larger rate]
Customers arrive as a Poisson count with $\lambda = 25$ per hour. Approximate $P(X \le 20)$.

:::solution
$$
P(X \le 20) \approx \Phi\!\left(\frac{20.5 - 25}{5}\right) = \Phi(-0.9) \approx 0.184,
$$

against the exact Poisson value $0.185$.
:::
::::

:::equations
- *Uniform*: $1/(\beta - \alpha)$ on $(\alpha, \beta)$, with $\mu = (\alpha + \beta)/2$ and $\sigma^2 = (\beta - \alpha)^2/12$.
- *Gamma*: $x^{\alpha-1}e^{-x/\beta}/(\beta^\alpha\Gamma(\alpha))$, with $\mu = \alpha\beta$, $\sigma^2 = \alpha\beta^2$ and $M(t) = (1 - \beta t)^{-\alpha}$.
- *Exponential*: $\frac1\theta e^{-x/\theta}$, with $\mu = \theta$ and $\sigma^2 = \theta^2$; memoryless.
- *Chi-square*: gamma with $\alpha = \nu/2$ and $\beta = 2$, so $\mu = \nu$ and $\sigma^2 = 2\nu$.
- *Beta*: $\mu = \alpha/(\alpha + \beta)$ and $\sigma^2 = \alpha\beta/((\alpha+\beta)^2(\alpha+\beta+1))$.
- *Normal*: $P(a < X \le b) = \Phi((b - \mu)/\sigma) - \Phi((a - \mu)/\sigma)$ and $M(t) = e^{\mu t + \sigma^2t^2/2}$.
- *Binomial by normal*: $P(X \le k) \approx \Phi\big((k + \frac12 - n\theta)/\sqrt{n\theta(1 - \theta)}\big)$.
:::

```sim
id: normal-approx-binomial
controls:
  - {id: n, label: trials n, min: 5, max: 200, step: 1, default: 12, decimals: 0}
  - {id: p, label: "success probability θ", min: 0.05, max: 0.95, step: 0.05, default: 0.5, decimals: 2}
  - {id: k, label: k, min: 0, max: 200, step: 1, default: 5, decimals: 0}
note: "The binomial pmf as bars of width 1, the green ones summing to P(X ≤ k), under the normal curve with the same mean and standard deviation. The continuity correction integrates the curve up to the yellow line k + ½, the right edge of the last green bar. The defaults are the twelve tosses. Push θ to 0.05 with n = 20 (nθ = 1) and the bell cannot follow the skewed bars."
```

```python
# Exact binomial P(X <= k) against the normal approximation with and without the
# continuity correction.
import numpy as np
from scipy import stats

for n, theta, k in [(12, 0.5, 5), (100, 0.5, 59), (20, 0.05, 1)]:
    mu, sd = n * theta, np.sqrt(n * theta * (1 - theta))
    exact = stats.binom.cdf(k, n, theta)
    corrected = stats.norm.cdf((k + 0.5 - mu) / sd)
    raw = stats.norm.cdf((k - mu) / sd)
    print(f'n={n:3d} theta={theta:4} k={k:2d}: exact {exact:.4f}  corrected {corrected:.4f}  uncorrected {raw:.4f}')

print('Poisson(25), P(X <= 20):', stats.poisson.cdf(20, 25), 'normal:', stats.norm.cdf(-0.9))
```

:::insight
The normal curve keeps reappearing because sums of many independent pieces look normal whatever
the pieces are — the central limit theorem that the next statistics course starts from. A binomial
count is such a sum, and so, in the limit, is a Poisson count; the continuity correction is the
price of drawing a smooth curve over integer bars.
:::

## Further reading

- [Normal distribution](https://en.wikipedia.org/wiki/Normal_distribution), [Gamma distribution](https://en.wikipedia.org/wiki/Gamma_distribution), [Exponential distribution](https://en.wikipedia.org/wiki/Exponential_distribution), [Chi-squared distribution](https://en.wikipedia.org/wiki/Chi-squared_distribution) and [Beta distribution](https://en.wikipedia.org/wiki/Beta_distribution) — Wikipedia; mind the two parametrisations (scale or rate) of the gamma and the exponential.
- [Continuity correction](https://en.wikipedia.org/wiki/Continuity_correction) — Wikipedia.
- [Seeing Theory — Probability Distributions](https://seeing-theory.brown.edu/probability-distributions/index.html) — the continuous families with sliders, and the central limit theorem.
- [OpenStax Introductory Statistics — Chapter 6: The Normal Distribution](https://openstax.org/books/introductory-statistics/pages/6-introduction) — the standard normal table in use.
