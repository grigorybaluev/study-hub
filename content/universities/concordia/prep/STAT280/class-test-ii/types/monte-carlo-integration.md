---
title: Monte Carlo integration
order: 10
asks: an integral as an expected value, sample mean against hit-or-miss, boxes, standard errors, infinite ranges
units: [monte-carlo-integration]
---

## Logic

An integral is an expected value in disguise, so a sample mean estimates it. There are two ways to set it up. The
**sample mean** method averages $g$ at uniform points. **Hit-or-miss** throws points into a box around the graph
and counts the fraction under the curve. Both are unbiased and both have error $\propto1/\sqrt n$, and the sample
mean method is never the worse one, because it keeps the height of $g$ and not just a yes or no. For infinite
ranges, sample from a density $f$ and average $g/f$.

## Pattern

:::steps[Write the integral as an expected value]
1. **Sample mean** on $[a,b]$: $\int_a^bg=(b-a)\,E[g(U)]$. In R: `(b - a) * mean(g(runif(n, a, b)))`.
2. Its standard error: `(b - a) * sd(g(u)) / sqrt(n)`.
3. **Hit-or-miss** for $0\le g\le c$: `u <- runif(n, a, b)`, `v <- runif(n, 0, c)`, then `(b - a) * c * mean(v < g(u))`.
4. Its standard error: `(b - a) * c * sqrt(p * (1 - p) / n)` with `p` the fraction under the curve.
5. A multiple integral over a box: uniform in each coordinate, times the volume of the box. A region's volume: the box's volume times the fraction inside.
6. An infinite range: choose a density $f$ you can sample, positive wherever $g\ne0$, and average $g(X)/f(X)$. If $g=h\cdot f$ for a known density, the integral is simply $E[h(X)]$.
:::

## Traps

:::caution[Traps]
- The factor $(b-a)$ is the reciprocal of the uniform density. Forgetting it is the most common mistake; on $[0,1]$ it is invisible.
- In hit-or-miss the box must contain the graph: $c$ at least the maximum of $g$, and $g\ge0$.
- `runif(n, a, b)` gives the points; the estimate averages **g of the points**, not the points.
- For a smooth function of one variable, `integrate()` is far more accurate. Monte Carlo pays off in many dimensions and on awkward regions.
- With $g/f$ unbounded the variance may be infinite: the estimate jumps, and the standard error cannot be trusted. Choose $f$ with $g/f$ bounded.
- `rexp(n, 2)` has density $2e^{-2x}$: the 2 in front counts when you match $g$ to a density.
:::

## Worked problems

::::exercise[Two ways to the same integral]
Let $\theta=\int_0^2e^{-x}\,dx$. (a) Find $\theta$ exactly. (b) Estimate it by the sample mean method with
$n=10\,000$, with a standard error. (c) Estimate it by hit-or-miss in the box $[0,2]\times[0,1]$, with a standard
error. (d) Which is better, and by what factor would $n$ have to grow to make the other one match it?

:::solution
(a) $\theta=1-e^{-2}\approx0.8647$.

```r
set.seed(185)
n <- 10000
u <- runif(n, 0, 2)
g <- exp(-u)
est1 <- 2 * mean(g)                      # sample mean: (b - a) mean(g(U))
se1 <- 2 * sd(g) / sqrt(n)
v <- runif(n, 0, 1)                      # a height in the box, whose area is 2
hit <- v < exp(-u)
p <- mean(hit)
est2 <- 2 * p                            # hit-or-miss: area of box x fraction
se2 <- 2 * sqrt(p * (1 - p) / n)
round(c(exact = 1 - exp(-2), sample.mean = est1, hit.or.miss = est2), 4)
##       exact sample.mean hit.or.miss
##      0.8647      0.8675      0.8736
round(c(se1, se2, (se2 / se1)^2), 4)
## [1] 0.0049 0.0099 4.1650
```

(d) Exactly, one draw of the sample mean method has variance $4\operatorname{Var}(e^{-U})\approx0.234$, and one
draw of hit-or-miss has $4p(1-p)\approx0.982$. So hit-or-miss needs about 4 times the draws for the same error.
:::
::::

:::note[Pattern at work]
Steps 1 to 4. The two estimates have the same mean, since $E[1_{V<g(U)}\mid U]=g(U)$ here. Hit-or-miss adds the
randomness of $V$ on top, so its variance is the larger one.
:::

::::exercise[Over a box and over a region]
(a) Estimate $\int_0^1\int_0^2xy^2\,dy\,dx$, and give its exact value. (b) Estimate the volume under the paraboloid
$z=1-x^2-y^2$ above the plane $z=0$, whose exact value is $\frac\pi2$, in two ways.

:::solution
(a) Exactly: $\frac12\cdot\frac83=\frac43$. The box has area 2.

(b) The region sits in the box $[-1,1]^2\times[0,1]$, of volume 4. Hit-or-miss counts points under the surface. The
sample mean method averages the height, set to 0 outside the disc, over the square of area 4.

```r
set.seed(196)
n <- 100000
x <- runif(n, 0, 1)
y <- runif(n, 0, 2)
2 * mean(x * y^2)                        # exact: 4/3
## [1] 1.333011
x <- runif(n, -1, 1)
y <- runif(n, -1, 1)
z <- runif(n, 0, 1)
4 * mean(z <= 1 - x^2 - y^2)             # hit-or-miss in three coordinates
## [1] 1.56244
4 * mean(pmax(1 - x^2 - y^2, 0))         # sample mean in two
## [1] 1.56464
pi / 2
## [1] 1.570796
```
:::
::::

:::note[Pattern at work]
Step 5. The box's measure is the factor in front, and `pmax(..., 0)` is the height of the graph, with 0 outside
the disc. The second line needs one coordinate less, which is the sample mean advantage again.
:::

::::exercise[Infinite ranges]
Write each as an expected value, and estimate it. (a) $\int_0^\infty x^2e^{-2x}\,dx$. (b)
$\int_{-\infty}^\infty\cos(x)\,e^{-x^2/2}\,dx$, whose exact value is $\sqrt{2\pi}\,e^{-1/2}$. (c)
$\int_0^\infty xe^{-x^2/2}\,dx$, using a sample from the exponential density $e^{-x}$.

:::solution
(a) $2e^{-2x}$ is the density of $X\sim$ exponential with rate 2, so the integral is $\frac12E[X^2]$. Since
$E[X^2]=\operatorname{Var}(X)+(E[X])^2=\frac14+\frac14=\frac12$, the value is $\frac14$.

(b) $\frac1{\sqrt{2\pi}}e^{-x^2/2}$ is the standard normal density, so the integral is $\sqrt{2\pi}\,E[\cos Z]$.

(c) With $f(x)=e^{-x}$ the ratio is $g/f=xe^{x-x^2/2}$, which is bounded. The exact value is 1.

```r
set.seed(207)
n <- 100000
X <- rexp(n, rate = 2)
0.5 * mean(X^2)                          # exact: 1/4
## [1] 0.2543382
Z <- rnorm(n)
sqrt(2 * pi) * mean(cos(Z))
## [1] 1.517602
sqrt(2 * pi) * exp(-1/2)
## [1] 1.520347
Y <- rexp(n)
w <- Y * exp(-Y^2 / 2) / dexp(Y)         # g(Y) / f(Y)
c(estimate = mean(w), std.error = sd(w) / sqrt(n))
##    estimate   std.error
## 0.999999042 0.002336859
```
:::
::::

:::note[Pattern at work]
Step 6. (a) and (b) spot a density inside the integrand, and what is left over is $h$. (c) imposes the sampling density,
so it divides by that density and checks that the ratio stays bounded. Its integrand is itself a density, which is
why the value is 1.
:::
