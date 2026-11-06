---
title: Rejection and importance sampling
order: 11
asks: a box or an envelope, the constant k, the acceptance rate, weights g/f, rare events
units: [monte-carlo-integration]
method: generating-a-random-variable
---

## Logic

When $F$ cannot be inverted, or the density is known only up to a constant, propose from something easy and
correct for the difference. **Rejection** throws proposals under an envelope and keeps those that also fall under
the target: the kept $x$-values have the target density exactly. **Importance sampling** keeps every proposal, with
a weight $g/f$. Rejection gives a plain sample, while importance sampling wastes nothing and handles rare events.

## Pattern

:::steps[Rejection]
1. A bounded target on a bounded range: the box. Find the maximum $c$ of $g$ on $[a,b]$, draw `x <- runif(n, a, b)` and `y <- runif(n, 0, c)`, and keep `x[y < g(x)]`.
2. In general: choose an envelope density $f$ you can sample from, and find $k$ with $k\,g(x)\le f(x)$ for all $x$. The largest $k$ is the minimum of $f/g$, where $g/f$ peaks.
3. Draw $X$ from $f$ and $U$ uniform, and accept when $U\,f(X)<k\,g(X)$.
4. If $g$ is a normalised density, the acceptance rate is $k$. For the box, it is the area under $g$ over the area of the box: $\frac1{c(b-a)}$ for a density.
5. Check: the rate, then `mean(x)` and `var(x)` against the exact values.
:::

:::steps[Importance sampling]
1. Draw $x_1,\dots,x_n$ from a density $f$ that is easy to sample.
2. Weights $w_i=g(x_i)/f(x_i)$, where $g$ may be known only up to a constant.
3. Mean under $g$: `weighted.mean(h(x), w)`, that is $\sum w_ih(x_i)/\sum w_i$.
4. A rare event with a normalised $g$: propose only inside the event, and take `mean(w)`, with standard error `sd(w) / sqrt(n)`.
:::

## Traps

:::caution[Traps]
- The bound is also often written the other way round, as $g\le Mf$, so that $k=1/M$. Either way, the acceptance rate is the area under the target over the area under the envelope.
- $k\,g\le f$ must hold **everywhere** on the support of $g$, and $f$ must be positive wherever $g$ is.
- A $k$ that is too small still gives the right distribution, but more proposals are wasted. A $k$ that is too large gives the wrong distribution.
- The accepted sample is shorter than the proposals: `length(x)` is random, and `length(x) / n` estimates the rate.
- `U` and the proposal must be independent draws of the same length.
- `weighted.mean()` divides by the sum of the weights, which is what you want when $g$ is not normalised. For a normalised $g$, the plain `mean(w * h(x))` is the other option.
:::

## Worked problems

::::exercise[Under a box]
$g(x)=12x^2(1-x)$ on $[0,1]$. (a) Find its maximum and the acceptance rate of a box sampler. (b) Write the sampler
and check the mean $\frac35$ and the variance $\frac1{25}$.

:::solution
(a) $g'(x)=12(2x-3x^2)=0$ at $x=\frac23$, where $g(\frac23)=12\cdot\frac49\cdot\frac13=\frac{16}9$. The box
$[0,1]\times[0,\frac{16}9]$ has area $\frac{16}9$, and the area under $g$ is 1, so the rate is $\frac9{16}=0.5625$.

```r
g <- function(x) 12 * x^2 * (1 - x)
set.seed(218)
n <- 100000
x <- runif(n)
y <- runif(n, 0, 16/9)
kept <- x[y < g(x)]
length(kept) / n                     # exact: 9/16 = 0.5625
## [1] 0.56621
c(mean = mean(kept), var = var(kept))
##       mean        var
## 0.60035666 0.03998536
```
:::
::::

:::note[Pattern at work]
Step 1 needs one derivative, for the top of the box. Step 4 gives the rate before any code runs, and step 5 checks
both numbers.
:::

::::exercise[An exponential envelope]
The half-normal density is $g(x)=\sqrt{2/\pi}\,e^{-x^2/2}$ for $x>0$, and the envelope is $f(x)=e^{-x}$. (a) Find
the largest $k$ with $k\,g\le f$. (b) Simplify the acceptance test. (c) Simulate it, and compare the rate and the
mean with the exact values $k$ and $\sqrt{2/\pi}$.

:::solution
(a) $\frac gf=\sqrt{2/\pi}\,e^{x-x^2/2}$, and the exponent is largest at $x=1$, where it equals $\frac12$. So
$\max\frac gf=\sqrt{2e/\pi}\approx1.3155$ and $k=\sqrt{\pi/(2e)}\approx0.7602$.

(b) $U\,f(X)<k\,g(X)$ becomes $U<k\,g(X)/f(X)=e^{x-x^2/2-1/2}=e^{-(x-1)^2/2}$.

```r
set.seed(229)
n <- 200000
X <- rexp(n)
U <- runif(n)
kept <- X[U < exp(-(X - 1)^2 / 2)]
length(kept) / n                     # exact: k
## [1] 0.759455
sqrt(pi / (2 * exp(1)))
## [1] 0.7601735
mean(kept)                           # exact: sqrt(2 / pi)
## [1] 0.7961053
sqrt(2 / pi)
## [1] 0.7978846
```
:::
::::

:::note[Pattern at work]
Step 2: maximise $g/f$, and $k$ is the reciprocal. In step 3 the constants cancel, which leaves a one-line test.
Here the rate gives $k$ directly, because $g$ is normalised.
:::

::::exercise[Weights and a rare event]
(a) A density is known up to a constant: $g(x)\propto e^{-x}(1+x^2)$ on $x>0$. Using proposals from the exponential
density $e^{-x}$, estimate its mean, whose exact value is $\frac73$. (b) Estimate $P(Z>3)$ for a standard normal,
plainly and with proposals $3+$ an exponential with rate 3, and compare the standard errors.

:::solution
(a) The weight is $g/f=1+x^2$: not bounded, but its variance under $f$ is finite. The exact mean is
$\int_0^\infty x(1+x^2)e^{-x}\,dx\big/\int_0^\infty(1+x^2)e^{-x}\,dx=\frac{1+6}{1+2}=\frac73$.

(b) Every proposal lands in the event, with $f(y)=3e^{-3(y-3)}$ for $y>3$, and $\varphi/f$ is bounded there.

```r
set.seed(240)
n <- 100000
X <- rexp(n)
w <- 1 + X^2
weighted.mean(X, w)                     # exact: 7/3
## [1] 2.31475
pnorm(3, lower.tail = FALSE)            # the exact tail
## [1] 0.001349898
z <- rnorm(n)
hit <- z > 3
c(estimate = mean(hit), std.error = sd(hit) / sqrt(n))
##     estimate    std.error
## 0.0015800000 0.0001255993
Y <- 3 + rexp(n, rate = 3)
W <- dnorm(Y) / dexp(Y - 3, rate = 3)
c(estimate = mean(W), std.error = sd(W) / sqrt(n))
##     estimate    std.error
## 1.350541e-03 6.602045e-07
```
:::
::::

:::note[Pattern at work]
(a) is steps 1 to 3 of the second list: no constant is needed, because dividing by the sum of the weights removes
it. (b) is step 4: the plain estimate rests on the few draws that reached the event, while every proposal lands in
it, and the standard error shrinks by a factor of about 190.
:::
