---
title: Discrete distributions in R
order: 6
asks: which of d, p, q, r; Bernoulli and binomial from uniforms; Poisson counts and the Poisson process; discrete inversion
units: [simulating-random-variables]
method: generating-a-random-variable
---

## Logic

Every standard distribution has four functions: `d` for the probability at a point, `p` for the cumulative
probability, `q` for the quantile, `r` for random draws. By hand, a Bernoulli trial is a uniform compared with
$p$, a binomial is a sum of such trials, and any finite distribution is a lookup in its cumulative
probabilities: the value whose interval contains the uniform.

## Pattern

:::steps[Translate the question into a function]
1. $P(X=x)$: `dbinom(x, size, prob)`, `dpois(x, lambda)`.
2. $P(X\le x)$: `pbinom(x, size, prob)`, `ppois(x, lambda)`.
3. $P(X>x)$: `1 - pbinom(x, ...)`. $P(a\le X\le b)$: `pbinom(b, ...) - pbinom(a - 1, ...)`.
4. The smallest $x$ with $P(X\le x)\ge q$: `qbinom(q, size, prob)`.
5. $n$ random values: `rbinom(n, size, prob)`, `rpois(n, lambda)`.
:::

:::steps[Discrete draws from uniforms]
1. Bernoulli: `runif(n) < p` gives `TRUE` with probability $p$; `sum()` counts the successes.
2. Binomial: `replicate(n, sum(runif(size) < prob))`.
3. Finite table: `cum <- cumsum(probs)`, then `values[findInterval(u, cum) + 1]`, or simply `sample(values, n, replace = TRUE, prob = probs)`.
4. Poisson process on $[0,L]$: draw $N$ with `rpois(1, lambda * L)`, then `sort(runif(N, 0, L))`. Or add exponential gaps: `cumsum(rexp(k, lambda))`.
:::

## Traps

:::caution[Traps]
- $P(X<3)$ for a discrete $X$ is `pbinom(2, ...)`, not `pbinom(3, ...)`.
- $P(a\le X\le b)$ subtracts `pbinom(a - 1, ...)`: subtracting `pbinom(a, ...)` loses the value $a$.
- In `rbinom(n, size, prob)`, `n` is how many values you want and `size` is the number of trials. `rbinom(5, 10, 0.3)` returns 5 counts.
- `findInterval(u, cum)` starts at 0, so add 1 to use it as an index.
- The rate of a Poisson process scales with the interval: 3 per hour over 2 hours is `rpois(1, 6)`.
- `prob` in `sample()` is in the same order as the values, and the first argument must be a vector: `sample(5, 1)` samples from `1:5`.
:::

## Worked problems

::::exercise[Which function?]
$X$ is Binomial with 12 trials and $p=0.3$, and $Y$ is Poisson with mean 2.5. Write the R expression and give the
value of (a) $P(X=4)$; (b) $P(X\le4)$; (c) $P(X>4)$; (d) $P(2\le X\le5)$; (e) the 90th percentile of $X$;
(f) $P(Y=0)$; (g) $P(Y\ge3)$.

:::solution
```r
dbinom(4, size = 12, prob = 0.3)                              # (a)
## [1] 0.2311397
pbinom(4, size = 12, prob = 0.3)                              # (b)
## [1] 0.7236555
1 - pbinom(4, size = 12, prob = 0.3)                          # (c)
## [1] 0.2763445
pbinom(5, 12, 0.3) - pbinom(1, 12, 0.3)                       # (d)
## [1] 0.7971262
qbinom(0.9, size = 12, prob = 0.3)                            # (e)
## [1] 6
dpois(0, lambda = 2.5)                                        # (f) exp(-2.5)
## [1] 0.082085
1 - ppois(2, lambda = 2.5)                                    # (g)
## [1] 0.4561869
```
:::
::::

:::note[Pattern at work]
The first list, in order. (c), (d) and (g) are the discrete traps: "$>4$" leaves out 4, "$2\le X$" subtracts up
to 1, and "$\ge3$" means one minus "$\le2$".
:::

::::exercise[Inversion by hand]
$X$ takes the values $1, 2, 3, 5$ with probabilities $0.2, 0.5, 0.1, 0.2$. (a) Which values do the uniforms
$0.15, 0.62, 0.71, 0.93$ give? (b) Write the two-line generator and one line with `sample()`. (c) Find $E(X)$ and
check it by simulation.

:::solution
(a) The cumulative probabilities are $0.2, 0.7, 0.8, 1$, which cut $(0,1)$ into four intervals whose widths are
the probabilities. So $0.15$ gives 1, $0.62$ gives 2, $0.71$ gives 3, and $0.93$ gives 5.

(c) $E(X)=0.2+1+0.3+1=2.5$.

```r
values <- c(1, 2, 3, 5)
probs <- c(0.2, 0.5, 0.1, 0.2)
cum <- cumsum(probs)
values[findInterval(c(0.15, 0.62, 0.71, 0.93), cum) + 1]
## [1] 1 2 3 5
set.seed(86)
x <- values[findInterval(runif(100000), cum) + 1]
mean(x)
## [1] 2.50055
y <- sample(values, 100000, replace = TRUE, prob = probs)
mean(y)
## [1] 2.49505
```
:::
::::

:::note[Pattern at work]
Step 3 of the second list. The interval's width is the value's probability, which is why a uniform falls in it
with exactly that chance. `sample()` is the one-line version, and the inversion is what it means.
:::

::::exercise[Arrivals at a desk]
People arrive as a Poisson process at 3 per hour. (a) Simulate the arrival times over a 2-hour shift. (b) Find
$P(\text{nobody in the first 20 minutes})$ exactly, and estimate it by simulation, once from the counts and once
from the gaps.

:::solution
(b) In 20 minutes the mean count is $3\times\frac13=1$, so $P(N=0)=e^{-1}\approx0.3679$. The first gap is
exponential with rate 3, and $P(\text{gap}>\frac13)=e^{-1}$ too.

```r
set.seed(99)
N <- rpois(1, 3 * 2)                     # (a) how many in 2 hours
round(sort(runif(N, 0, 2)), 2)           # where they fall
## [1] 0.23 1.07 1.34 1.37 1.93 1.99
exp(-1)
## [1] 0.3678794
in.first <- function() {
  times <- runif(rpois(1, 6), 0, 2)
  sum(times < 1/3)
}
mean(replicate(20000, in.first()) == 0)  # from the counts
## [1] 0.3679
mean(rexp(20000, rate = 3) > 1/3)        # from the first gap
## [1] 0.3725
```
:::
::::

:::note[Pattern at work]
Step 4 of the second list, both ways. The trap is the rate: the count over 2 hours has mean 6, and the count over
20 minutes has mean 1.
:::
