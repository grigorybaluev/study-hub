---
title: Monte Carlo simulation and pseudorandom numbers
order: 8
status: detailed
weeks: [8]
introduces: [monte-carlo-simulation, pseudorandom-number-generation]
requires:
  - {concept: probability, strength: hard}
  - {concept: iteration, strength: hard}
  - {concept: random-variable, strength: soft}
reinforces:
  - {concept: probability, perspective: "empirical estimation by simulation"}
  - {concept: continuous-uniform-distribution, perspective: "simulated with runif()"}
  - {concept: modular-arithmetic, perspective: "congruential random number generators"}
---

The Monte Carlo idea and how pseudorandom numbers are generated and used in R.

## Why simulate?

Much of statistics comes down to **expected values** and **quantiles** of random variables:

- a *p-value* is the probability, under the null hypothesis, of data at least as extreme as those
  observed: the expected value of an indicator that is 1 for "as extreme" and 0 otherwise;
- the *bias* of an estimator is its expected value minus the quantity it estimates;
- a *confidence interval* is built from quantiles of the distribution of a pivotal quantity such
  as $(\bar X - \mu)/(s/\sqrt n)$.

Simple cases have formulas or large-sample approximations. The others need the computer, and the
most general computer method is simulation.

## The Monte Carlo method

:::definition[Monte Carlo estimate]
To approximate $\mu = E(X)$, generate $m$ independent copies $X_1, \dots, X_m$ of $X$ and use the
sample mean

$$
\bar X = \frac{1}{m} \sum_{i=1}^{m} X_i
$$

as the estimate. A probability is the special case where $X$ is an indicator: $P(A)$ is estimated
by the proportion of simulated cases in which $A$ happened.
:::

Two theorems say why and how well this works:

- the **law of large numbers**: $\bar X \to \mu$ as $m \to \infty$;
- the **central limit theorem**: for large $m$, $\bar X$ is approximately normal with mean $\mu$ and
  variance $\sigma^2/m$, where $\sigma^2 = \operatorname{Var}(X)$ is itself estimated by the sample
  variance $s^2 = \frac{1}{m-1}\sum (X_i - \bar X)^2$.

So the estimate comes with an error bar: $\bar X \pm 1.96\, s/\sqrt m$ is an approximate 95 %
confidence interval for $\mu$. The error shrinks like $1/\sqrt m$: **four times the simulations
halve the error**.

:::example[The largest of three uniform numbers]
Let $X = \max(U_1, U_2, U_3)$ with the $U_i$ independent and uniform on $(0, 1)$. Then
$P(X \le x) = x^3$, so $X$ has density $3x^2$ and $E(X) = \int_0^1 3x^3\,dx = 3/4$. The simulation
estimates it, with an interval, from 10 000 draws. `pmax()` takes the element-wise maximum of
vectors.
:::

```r
set.seed(2026)
m <- 10000
X <- pmax(runif(m), runif(m), runif(m))     # the largest of three uniforms
mean(X)                                     # exact value: 3/4
## [1] 0.7487292
s <- sd(X)
s
## [1] 0.1953139
mean(X) + c(-1.96, 1.96) * s / sqrt(m)      # approximate 95% confidence interval
## [1] 0.7449011 0.7525574
```

The running mean shows the law of large numbers at work: it wanders early and settles near 0.75.

```r
running <- cumsum(X) / seq_along(X)         # the estimate after 1, 2, ..., m draws
running[c(10, 100, 1000, 10000)]
## [1] 0.7718187 0.7581181 0.7586796 0.7487292
```

:::insight
Simulate the random variable many times and average: the average estimates the expected value,
the proportion estimates the probability, and $s/\sqrt m$ says how far off the estimate is likely
to be.
:::

## Generating pseudorandom numbers

### Deterministic numbers that look random

A computer follows instructions, so it cannot produce truly random numbers by itself. It
produces **pseudorandom** numbers instead: a sequence computed by a fixed rule, which to someone who
does not know the rule is unpredictable and passes statistical tests of randomness. Picture two
people: the programmer, who knows the numbers are determined, and the user, to whom they look
random. Often both are the same person.

Everything starts from **uniform** numbers on $(0, 1)$; the next unit turns them into any other
distribution.

### The multiplicative congruential generator

:::definition[Multiplicative congruential generator]
Choose a large integer modulus $m$, a multiplier $b < m$, and a starting integer $x_0$ between 1 and
$m - 1$, the **seed**. Then for $n = 1, 2, \dots$

$$
x_n = b\,x_{n-1} \bmod m \qquad u_n = \frac{x_n}{m}
$$

The $u_n$ lie between 0 and 1 and serve as the uniform pseudorandom numbers.
:::

Since $x_n$ depends only on $x_{n-1}$, the first repeated value makes the whole sequence repeat:
the sequence is **periodic**, and its period is at most $m - 1$. Knowing one $u_n$ does not
reveal the next if $b$ and $m$ are secret, but anyone who sees a whole cycle can predict
everything. So $m$ must be very large, and $b$ must be chosen so that the period is as long as
possible.

:::example[Small generators, good and bad]
With $m = 11$ and $b = 2$ the sequence visits all ten values 1, …, 10 before repeating: the
longest possible period. With $b = 3$ it cycles after only five. With $m = 1000$ and $b = 10$ the
sequence hits 0 and stays there, because $m$ divides a power of $b$. A prime modulus avoids that
failure.
:::

```r
mcg <- function(n, b, m, seed) {
  # n steps of the multiplicative congruential generator x <- b x mod m
  x <- numeric(n)
  for (k in 1:n) {
    seed <- (b * seed) %% m
    x[k] <- seed
  }
  x
}
mcg(12, b = 2, m = 11, seed = 1)
##  [1]  2  4  8  5 10  9  7  3  6  1  2  4
round(mcg(12, b = 2, m = 11, seed = 1) / 11, 3)
##  [1] 0.182 0.364 0.727 0.455 0.909 0.818 0.636 0.273 0.545 0.091 0.182 0.364
mcg(12, b = 3, m = 11, seed = 1)          # a shorter cycle
##  [1] 3 9 5 4 1 3 9 5 4 1 3 9
mcg(5, b = 10, m = 1000, seed = 7)        # m is a power of b: the sequence reaches 0 and stays there
## [1]  70 700   0   0   0
```

A generator worth using has a huge prime modulus. The pair $b = 7^5 = 16807$ and
$m = 2^{31} - 1$ (a prime) is a classic "minimal standard" generator, and its output already
behaves like uniform numbers: the right mean and variance, equal counts in equal intervals, and no
correlation between one value and the next.

```r
M <- 2^31 - 1
u <- mcg(10000, b = 16807, m = M, seed = 42) / M
head(u)
## [1] 0.0003287075 0.5245871020 0.7354235322 0.2633055408 0.3762239713
## [6] 0.1962858258
c(mean = mean(u), var = var(u))           # compare with 1/2 and 1/12 = 0.0833
##       mean        var 
## 0.49602653 0.08356339 
table(cut(u, breaks = seq(0, 1, 0.1)))    # about 1000 in each tenth
## 
##   (0,0.1] (0.1,0.2] (0.2,0.3] (0.3,0.4] (0.4,0.5] (0.5,0.6] (0.6,0.7] (0.7,0.8] 
##      1052       987      1004       996      1025       978      1012       995 
## (0.8,0.9]   (0.9,1] 
##       975       976 
cor(u[-1], u[-length(u)])                 # successive values: correlation near 0
## [1] 0.005428808
```

:::caution[Always test a generator]
Plausible-looking constants can give a poor generator. Checking the mean, the variance, the
histogram and the dependence between successive values is the minimum before trusting one.
:::

### runif() and set.seed()

R's built-in generator (the *Mersenne Twister* by default) uses a different rule with a period of
$2^{19937} - 1$. `runif(n, min = a, max = b)` returns `n` uniform numbers on $(a, b)$, by default
$(0, 1)$. If no seed has been set, R builds one from the clock and process when it first needs one,
so every session gives different numbers.

There are two reasons to choose the seed:

- **unpredictable** numbers: take the seed from an outside source once (such as the clock), then
  let the rule run. Re-seeding from the clock before every number would give long runs of equal
  values on a fast machine;
- **reproducible** numbers: fix the seed with `set.seed(k)`. The same seed gives the same
  sequence, which is what you want for debugging and for results others can check.

```r
runif(4)                          # four numbers on (0, 1)
## [1] 0.7172714 0.9593862 0.2221487 0.4246376
runif(3, min = -1, max = 1)       # three on (-1, 1)
## [1] -0.49110818  0.04334521  0.70453324
set.seed(99)
runif(3)
## [1] 0.5847119 0.1137817 0.6842647
set.seed(99)
runif(3)                          # the same three again
## [1] 0.5847119 0.1137817 0.6842647
```

## Estimating with uniform numbers

Independent uniform vectors can be treated as independent random variables, and quantities
involving them estimated by averages. In each line the comment gives the exact value, for
comparison.

```r
set.seed(5)
U1 <- runif(1e5)
U2 <- runif(1e5)
mean(U1 + U2 <= 1.2)            # exact: 1 - 0.8^2 / 2 = 0.68
## [1] 0.68095
mean(U1 + U2)                   # exact: 1
## [1] 0.9960807
var(U1 + U2)                    # exact: 1/6
## [1] 0.1684928
var(U1) + var(U2)
## [1] 0.1673822
4 * mean(U1^2 + U2^2 <= 1)      # the quarter disc has area pi/4
## [1] 3.14112
```

The last line estimates $\pi$: a point uniform in the unit square falls inside the quarter disc
$x^2 + y^2 \le 1$ with probability equal to its area, $\pi/4$. It also shows that
$\operatorname{Var}(U_1 + U_2) = \operatorname{Var}(U_1) + \operatorname{Var}(U_2)$ for independent
variables.

### Sampling from a finite set: sample()

`sample(x, size, replace = FALSE, prob = NULL)` draws `size` elements of the vector `x`: without
replacement by default (so `sample(x)` is a random permutation), with replacement if
`replace = TRUE`, and with unequal probabilities if `prob` is given.

```r
set.seed(8)
sample(1:10)                     # a random permutation
##  [1]  4  7  2  9 10  8  3  5  1  6
sample(1:100, 5)                 # 5 numbers without replacement
## [1] 50  3  6 86 52
dice <- sample(1:6, 6000, replace = TRUE)
table(dice)
## dice
##    1    2    3    4    5    6 
## 1022  980  993 1023 1008  974 
sample(c("H", "T"), 10, replace = TRUE, prob = c(0.7, 0.3))   # a biased coin
##  [1] "T" "H" "H" "H" "H" "H" "H" "T" "H" "H"
```

:::caution[Turning uniforms into integers]
To get the integers 1 to 10 from uniforms, use `ceiling(10 * u)`: each integer then gets an
interval of width 1. `round(10 * u)` gives 0 to 10, with 0 and 10 only getting intervals of width
$\tfrac12$, so they come up half as often as the rest:
:::

```r
set.seed(10)
table(round(runif(10000, 0, 10)))     # 0 and 10 get half the share of the others
## 
##    0    1    2    3    4    5    6    7    8    9   10 
##  527  982  985  999 1069  953  974  962  986 1052  511 
table(ceiling(runif(10000, 0, 10)))   # 1 to 10, equally likely
## 
##    1    2    3    4    5    6    7    8    9   10 
##  988  951 1009 1061 1031 1013  982  976  978 1011 
```

:::insight
A pseudorandom generator is a deterministic rule, $x_n = b\,x_{n-1} \bmod m$ in its simplest
form, whose output passes for independent uniforms. `set.seed()` makes it repeatable, and
`runif()` and `sample()` are the building blocks of every simulation.
:::

## Further reading

- [Monte Carlo method (Wikipedia)](https://en.wikipedia.org/wiki/Monte_Carlo_method) — history, the basic estimate, and its many uses.
- [Lehmer random number generator (Wikipedia)](https://en.wikipedia.org/wiki/Lehmer_random_number_generator) — the multiplicative congruential generator, and how to choose $m$ and $b$.
- [R documentation: Random](https://stat.ethz.ch/R-manual/R-devel/library/base/html/Random.html) — R's generators, `set.seed()` and `RNGkind()`.
- [R documentation: sample](https://stat.ethz.ch/R-manual/R-devel/library/base/html/sample.html) — sampling with and without replacement, and with weights.
