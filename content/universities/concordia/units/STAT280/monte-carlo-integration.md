---
title: Monte Carlo integration and advanced simulation
order: 10
status: detailed
weeks: [10]
introduces: [monte-carlo-integration]
requires:
  - {concept: integral, strength: hard}
  - {concept: expected-value, strength: hard}
  - {concept: monte-carlo-simulation, strength: hard}
  - {concept: random-variate-generation, strength: hard}
reinforces:
  - {concept: variance, perspective: "of a Monte Carlo estimate"}
  - {concept: multiple-integral, perspective: "estimated by simulation over a box"}
  - {concept: bayes-theorem, perspective: "posterior densities known only up to a constant"}
---

Estimating integrals by simulation and more advanced simulation techniques such as
importance and rejection sampling.

## Integrals as expected values

Simulation can compute things that have nothing random about them. The bridge is that an integral
can be written as an expected value, and an expected value can be estimated by a sample mean
(the law of large numbers).

:::theorem[Monte Carlo integration]
Let $g$ be integrable on $[a, b]$ and $U_1, \dots, U_n$ independent and uniform on $[a, b]$, with
density $1/(b-a)$. Then

$$
E\bigl[g(U)\bigr] = \int_a^b g(u)\,\frac{1}{b-a}\,du
\qquad\Longrightarrow\qquad
\int_a^b g(x)\,dx \approx (b-a)\,\frac{1}{n}\sum_{i=1}^{n} g(U_i)
$$
:::

On $[0, 1]$ the factor $b - a$ is 1 and the integral is simply the average of $g$ at uniform
points:

```r
set.seed(10)
u <- runif(100000)
mean(u^3)                          # exact: 1/4
## [1] 0.2483135
```

### The error of the estimate

The estimate is a sample mean, so the central limit theorem gives its accuracy: the standard
error is $(b-a)\,s_g/\sqrt n$, where $s_g$ is the standard deviation of the $g(U_i)$. As for any
Monte Carlo estimate, the error shrinks like $1/\sqrt n$.

:::example[The integral of √x from 1 to 4]
Exactly, $\int_1^4 \sqrt x\,dx = \frac23\bigl(4^{3/2} - 1\bigr) = \frac{14}{3}$. The estimate, its
standard error and a 95 % interval:
:::

```r
a <- 1; b <- 4
u <- runif(100000, min = a, max = b)
g <- sqrt(u)
est <- (b - a) * mean(g)
se <- (b - a) * sd(g) / sqrt(length(g))
c(estimate = est, std.error = se)
##    estimate   std.error 
## 4.663274707 0.002688752 
est + c(-1.96, 1.96) * se          # exact: 14/3 = 4.6667
## [1] 4.658005 4.668545
integrate(sqrt, 1, 4)              # R's deterministic numerical integration
## 4.666667 with absolute error < 5.2e-14
```

For a smooth function of one variable, `integrate()` (deterministic quadrature) is far more
accurate. Monte Carlo pays off in **many dimensions** and on **awkward regions**, where grid
methods need impossibly many points while the $1/\sqrt n$ rate does not depend on the dimension.

A small function packages the method:

```r
mc.int <- function(g, a, b, n = 1e5) {
  # Monte Carlo estimate of the integral of g over [a, b], with its standard error
  gu <- g(runif(n, a, b))
  c(estimate = (b - a) * mean(gu), std.error = (b - a) * sd(gu) / sqrt(n))
}
set.seed(11)
mc.int(sin, 0, pi)                 # exact: 2
##    estimate   std.error 
## 1.997033040 0.003056585 
mc.int(function(x) exp(-x^2 / 2) / sqrt(2 * pi), -1.96, 1.96)   # exact: 0.95
##    estimate   std.error 
## 0.949567245 0.001401843 
```

### Multiple integrals

With independent uniforms in each coordinate the same argument works in any dimension:

$$
\int_0^1\!\!\int_0^1 g(x, y)\,dx\,dy \approx \frac1n \sum_{i=1}^n g(U_i, V_i)
$$

and over a box $[a_1, b_1] \times [a_2, b_2]$ the average is multiplied by the box's area
$(b_1 - a_1)(b_2 - a_2)$, the reciprocal of the uniform joint density.

:::example[An integral with no closed form]
$\int_0^1\!\int_0^1 e^{xy}\,dx\,dy$ has no elementary antiderivative, but expanding $e^{xy}$ as a
power series and integrating term by term gives $\sum_{k \ge 1} \frac{1}{k \cdot k!}$, which
checks the simulation.
:::

```r
set.seed(12)
U <- runif(100000)
V <- runif(100000)
mean(exp(U * V))                   # the integral of exp(xy) over the unit square
## [1] 1.317795
sum(1 / (1:15 * factorial(1:15)))  # its exact value, from the series
## [1] 1.317902
```

:::example[Volume of a region]
The volume of a region is the integral of its indicator. Draw points uniformly in a box that
contains the region; the volume is the box's volume times the fraction of points inside. For the
unit ball in the cube $[-1, 1]^3$ (volume 8):
:::

```r
set.seed(13)
n <- 1e6
pts <- matrix(runif(3 * n, -1, 1), ncol = 3)     # uniform in the cube [-1, 1]^3
inside <- rowSums(pts^2) <= 1
8 * mean(inside)                   # cube volume times the fraction inside
## [1] 4.188664
4 * pi / 3
## [1] 4.18879
```

### Other sampling densities

Uniform points are not required. If $X$ has density $f$, positive wherever $g$ is non-zero, then

$$
E\!\left[\frac{g(X)}{f(X)}\right] = \int \frac{g(x)}{f(x)}\, f(x)\,dx = \int g(x)\,dx
$$

so the integral is estimated by the average of $g(X_i)/f(X_i)$. This handles **infinite ranges**,
where no uniform distribution exists.

:::example[An integral over an infinite range]
$\int_0^\infty e^{-x^2/2}\,dx = \sqrt{\pi/2}$. Sample $X$ from the exponential density
$f(x) = e^{-x}$ and average $g(X)/f(X)$.
:::

```r
set.seed(14)
X <- rexp(100000)                  # density f(x) = exp(-x) on [0, Inf)
w <- exp(-X^2 / 2) / dexp(X)       # g(X) / f(X)
mean(w)                            # the integral of exp(-x^2/2) over [0, Inf)
## [1] 1.252838
sqrt(pi / 2)
## [1] 1.253314
```

:::caution[When the ratio is unbounded]
If $g/f$ can be arbitrarily large, its variance may be infinite. The estimate still converges,
but slowly and erratically: most runs **underestimate**, a rare huge value corrects it, and the
reported standard error cannot be trusted. Below, $g(x) = x^{-0.8}$ on $(0, 1)$ with uniform
sampling; the integral is 5, and $g^2$ is not integrable. Choose $f$ so that $g/f$ is roughly
constant, and certainly bounded.
:::

```r
set.seed(15)
runs <- replicate(8, {
  gu <- runif(10000)^(-0.8)                 # g(x) = x^(-0.8): its integral on (0, 1) is 5
  c(estimate = mean(gu), std.error = sd(gu) / 100)
})
round(runs, 2)                              # one column per run of 10 000
##           [,1] [,2] [,3] [,4] [,5] [,6] [,7] [,8]
## estimate  5.03 4.43 4.67 4.48 5.41 4.62 4.35 4.20
## std.error 0.85 0.24 0.41 0.22 0.87 0.51 0.21 0.29
```

```sim
id: r-mc-integral
controls:
  - {id: g, label: "integral: 1 x³ · 2 √x · 3 sin x · 4 x^(−0.8)", min: 1, max: 4, step: 1, default: 2, decimals: 0}
  - {id: logn, label: "log₁₀ of the number of points n", min: 2, max: 5, step: 0.1, default: 4, decimals: 1}
note: "The running estimate (b − a)·mean(g(Uᵢ)) with its 95 % band, against the exact value. For the first three the band shrinks steadily like 1/√n and covers the truth. Choose 4, x^(−0.8) on (0, 1): the estimate runs low and then jumps whenever a point lands very near 0, and the band itself jumps. This is what infinite variance looks like."
```

## Rejection sampling

The last unit could only generate distributions with an invertible $F$, or conditional versions of
known ones. General-purpose methods reach much further. A typical target is a **posterior density
known only up to a constant**: with a Binomial($n$, $p$) observation $x$ and a prior belief that $p$
is near 0.3, Bayes' theorem gives

$$
f(p \mid x) \;\propto\; e^{-(p - 0.3)^2 / (2 \cdot 0.05^2)}\; p^{x} (1-p)^{n-x}, \qquad 0 < p < 1
$$

whose normalising constant is an integral nobody wants to compute.

### Under a box

If $(X, Y)$ is uniform on the region under the graph of a density $g$, then $X$ has density $g$.
So: draw points uniformly in a box around the graph, and keep the $x$-coordinates of those that
fall **under the curve**.

:::example[The Beta(2, 2) density]
$g(x) = 6x(1-x)$ on $[0, 1]$ has maximum $1.5$, so the box is $[0, 1] \times [0, 1.5]$. The area
under $g$ is 1 and the box's area is 1.5, so two thirds of the points are accepted.
:::

```r
set.seed(16)
U1 <- runif(100000)                    # x-coordinate in [0, 1]
U2 <- runif(100000, 0, 1.5)            # height in [0, 1.5], the density's maximum
X <- U1[U2 < 6 * U1 * (1 - U1)]        # keep the points under the curve
length(X) / 100000                     # acceptance rate: 1/1.5
## [1] 0.66902
c(mean = mean(X), var = var(X))        # Beta(2, 2): 0.5 and 0.05
##       mean        var 
## 0.50038597 0.04994948 
```

### The general method

A box needs a bounded target on a bounded range. In general, replace the box by any density $f$
we can sample from (the **envelope**), and find a constant $k$ with $k\,g(x) \le f(x)$ for all $x$.

:::steps[Rejection sampling]
1. Draw $X$ from $f$ and $U$ uniform on $(0, 1)$, independently.
2. If $U f(X) < k\,g(X)$, **accept**: output $X$.
3. Otherwise **reject** it and go back to step 1.
:::

The point $(X, U f(X))$ is uniform under the graph of $f$; accepting only points under $k\,g$ leaves
points uniform under $k\,g$, whose $x$-coordinates have density $g$. Each proposal is accepted with
probability $k$ (the area under $k\,g$ over the area under $f$), so a $k$ close to 1, an envelope
that hugs the target, wastes little. Since $g$ may be known only up to a constant, $k$ need not be
known either: it is estimated by the acceptance rate.

:::example[A wavy density]
Target $h(x) = e^{-x^2/2}\bigl(1 + \sin^2 3x\bigr)$, known up to a constant. Because
$1 + \sin^2 3x \le 2$, the function $k h(x) = \varphi(x)\,(1 + \sin^2 3x)/2$ stays below the
standard normal density $\varphi$, which is the envelope. Vectorised, all proposals are drawn at
once and the accepted ones kept.
:::

```r
h <- function(x) exp(-x^2 / 2) * (1 + sin(3 * x)^2)   # target, up to a constant
kh <- function(x) dnorm(x) * (1 + sin(3 * x)^2) / 2   # k h(x) <= dnorm(x) everywhere
set.seed(17)
Y <- rnorm(200000)                       # proposals from f = dnorm
U <- runif(200000)
X <- Y[U * dnorm(Y) < kh(Y)]             # accept when U f(Y) < k h(Y)
acc <- length(X) / 200000
acc                                      # exact: 0.75
## [1] 0.751435
c(mean = mean(X), var = var(X))
##        mean         var 
## 0.001831376 0.999872324 
```

The acceptance rate estimates $k$, which turns $k h$ into the normalised target for plotting over
the histogram:

```r
hist(X, breaks = 60, freq = FALSE, main = "Rejection sample")
curve(kh(x) / acc, add = TRUE)                     # the normalised target density
curve(dnorm(x) / acc, add = TRUE, lty = 2)         # the envelope f / k
```

```sim
id: r-rejection
controls:
  - {id: n, label: "number of proposals", min: 200, max: 5000, step: 100, default: 1500, decimals: 0}
  - {id: c, label: "envelope looseness c (k·h scaled down by c)", min: 1, max: 3, step: 0.1, default: 1, decimals: 1}
note: "Left: proposals Y from the normal envelope, each lifted to a uniform height under f(Y). The green ones fall under k·h and are kept. Right: the kept values follow the wavy target density. Raise c to make the envelope needlessly loose: the kept values still have the right distribution, but the acceptance rate drops to 75 %/c."
```

## Importance sampling

### Weighted averages

A **weighted average** $\bar x_w = \sum w_i x_i \big/ \sum w_i$ counts each observation in
proportion to its weight; the ordinary mean is the case of equal weights. Importance sampling
draws a sample from a convenient density and attaches weights that make weighted averages behave
like averages under the target.

:::steps[Importance sampling]
1. Choose a density $f$ that is easy to sample from.
2. Draw $x_1, \dots, x_n$ from $f$.
3. Compute the weights $w_i = g(x_i)/f(x_i)$.
4. Estimate $E[h(X)]$ for $X \sim g$ by the weighted average $\sum w_i h(x_i) \big/ \sum w_i$.
:::

Why it works: $w_i$ is proportional to the probability that a rejection sampler would have
accepted $x_i$, so each draw contributes to the weighted average what it would contribute, on
average, to a rejection sample. Nothing is thrown away, no bound $k$ is needed, and neither $g$
nor $f$ has to be normalised, since dividing by $\sum w_i$ takes care of the scaling. The price is
that a weighted sample is less convenient than a plain one (it cannot be drawn as a histogram
directly, for instance), so rejection sampling is often preferred when it is efficient.

```r
set.seed(18)
Y <- rnorm(200000)
W <- h(Y) / dnorm(Y)                  # importance weights g / f
m <- weighted.mean(Y, W)
m
## [1] 0.001304898
weighted.mean((Y - m)^2, W)           # variance under the target
## [1] 1.000965
```

The mean and variance agree with the rejection sample above.

### Rare events

Importance sampling is at its best for **rare events**, where plain simulation almost never sees
the event. To estimate $P(Z > 4)$ for a standard normal $Z$, propose from $f(y) = e^{-(y-4)}$ on
$(4, \infty)$ (4 plus an exponential), which always lands in the event, and average
$g/f = \varphi(y) / f(y)$:

```r
pnorm(4, lower.tail = FALSE)          # exact P(Z > 4)
## [1] 3.167124e-05
set.seed(19)
z <- rnorm(100000)
mean(z > 4)                           # plain Monte Carlo: almost never happens
## [1] 2e-05
Y <- 4 + rexp(100000)                 # proposals that always land beyond 4
W <- dnorm(Y) / dexp(Y - 4)           # weights g / f
mean(W)                               # importance sampling estimate
## [1] 3.187261e-05
sd(W) / sqrt(100000)                  # its standard error
## [1] 1.212487e-07
```

Plain Monte Carlo saw the event twice in 100 000 draws; the importance-sampling estimate is within
1 % of the exact value, with a standard error about 250 times smaller than the probability itself.

```sim
id: r-importance-tail
controls:
  - {id: c, label: "threshold c in P(Z > c)", min: 1, max: 6, step: 0.1, default: 4, decimals: 1}
  - {id: logn, label: "log₁₀ of draws per run", min: 2, max: 4.5, step: 0.1, default: 4, decimals: 1}
note: "Twelve independent runs of each method, shown as estimate ÷ exact value (1 is perfect). At c = 1 both work. From c = 3 upward, plain Monte Carlo mostly sees no event and reports 0, then occasionally a huge overestimate. Importance sampling stays within a few percent at every c, because every proposal lands in the event and carries a small weight."
```

:::insight
Write the integral as an expected value, then simulate and average: uniform points for bounded
ranges, other densities for infinite ones, with $g/f$ kept bounded. To sample from a density known
only up to a constant, accept proposals under an envelope (rejection), or keep them all with weights
$g/f$ (importance sampling).
:::

## Further reading

- [Monte Carlo integration (Wikipedia)](https://en.wikipedia.org/wiki/Monte_Carlo_integration) — the estimator, its variance, and variance-reduction ideas.
- [Rejection sampling (Wikipedia)](https://en.wikipedia.org/wiki/Rejection_sampling) — the envelope condition, efficiency, and adaptive variants.
- [Importance sampling (Wikipedia)](https://en.wikipedia.org/wiki/Importance_sampling) — choosing the proposal, and self-normalised weights.
- [R documentation: integrate](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/integrate.html) — deterministic numerical integration for comparison.
