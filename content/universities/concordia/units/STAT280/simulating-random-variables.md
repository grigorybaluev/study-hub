---
title: Simulating random variables and Markov chains
order: 9
status: detailed
weeks: [9]
introduces: [random-variate-generation, markov-chain]
requires:
  - {concept: random-variable, strength: hard}
  - {concept: cumulative-distribution-function, strength: hard}
  - {concept: conditional-probability, strength: hard}
  - {concept: matrix, strength: hard}
  - {concept: binomial-distribution, strength: soft}
  - {concept: normal-distribution, strength: soft}
  - {concept: joint-distribution, strength: soft}
reinforces:
  - pseudorandom-number-generation
  - {concept: bernoulli-distribution, perspective: "simulated by comparing a uniform with p"}
  - {concept: poisson-distribution, perspective: "counts and the Poisson process, simulated"}
  - {concept: exponential-distribution, perspective: "simulated by inverting the CDF"}
  - {concept: eigenvalue, perspective: "the stationary distribution as an eigenvector"}
---

Generating draws from specific discrete and continuous distributions, multivariate
generation, and simulating Markov chains.

## Distributions in R: d, p, q, r

Every standard distribution in R comes as four functions sharing a name, with a one-letter
prefix saying what they compute:

| Prefix | Computes | Binomial | Poisson | Exponential | Normal |
|---|---|---|---|---|---|
| `d` | density $f(x)$, or $P(X = x)$ for a discrete variable | `dbinom` | `dpois` | `dexp` | `dnorm` |
| `p` | distribution function $F(x) = P(X \le x)$ | `pbinom` | `ppois` | `pexp` | `pnorm` |
| `q` | quantile: the smallest $x$ with $F(x) \ge p$ | `qbinom` | `qpois` | `qexp` | `qnorm` |
| `r` | random draws | `rbinom` | `rpois` | `rexp` | `rnorm` |

The same pattern covers `unif`, `geom`, `nbinom`, `hyper`, `gamma`, `beta`, `chisq`, `t`, `f` and
more. The parameters are named as in the help pages: `size` and `prob` for the binomial, `lambda`
for the Poisson, `rate` for the exponential, `mean` and `sd` for the normal.

```r
dbinom(3, size = 8, prob = 0.25)       # P(X = 3) for X ~ Binomial(8, 0.25)
## [1] 0.2076416
pbinom(3, size = 8, prob = 0.25)       # P(X <= 3)
## [1] 0.8861847
qbinom(0.9, size = 8, prob = 0.25)     # smallest x with P(X <= x) >= 0.9
## [1] 4
set.seed(9)
rbinom(5, size = 8, prob = 0.25)       # five random values
## [1] 1 0 1 1 2
```

The rest of the unit shows how such draws can be made from uniform numbers, and how to check that a
simulated sample has the right distribution.

## Discrete random variables

### Bernoulli trials

:::definition[Bernoulli random variable]
A trial with two outcomes, success with probability $p$ and failure with probability $1 - p$.
Coded as 1 and 0 it is a Bernoulli random variable, with mean $p$ and variance $p(1-p)$.
:::

To simulate one, draw a uniform $U$ and call the trial a success when $U < p$: that happens with
probability exactly $p$. Comparing a whole vector of uniforms with $p$ simulates many trials at
once, and `sum()` counts the successes.

:::example[Free throws]
A player makes each free throw with probability 0.75, independently. Simulate ten attempts, then
check the mean and variance on many.
:::

```r
set.seed(1)
shots <- runif(10) < 0.75          # each shot goes in with probability 0.75
shots
##  [1]  TRUE  TRUE  TRUE FALSE  TRUE FALSE FALSE  TRUE  TRUE  TRUE
sum(shots)                         # baskets made
## [1] 7
many <- runif(100000) < 0.75
c(mean = mean(many), var = var(many))    # compare with p = 0.75 and p(1 - p) = 0.1875
##      mean       var 
## 0.7491900 0.1879062 
```

### Binomial random variables

:::definition[Binomial random variable]
The number $X$ of successes in $n$ independent Bernoulli($p$) trials, with

$$
P(X = x) = \binom{n}{x} p^x (1-p)^{n-x}, \qquad x = 0, 1, \dots, n
$$

mean $np$ and variance $np(1-p)$.
:::

:::example[Process control]
A machine makes 20 items an hour, each defective with probability 0.1, independently. The process
is flagged when an hour has more than 4 defectives. Simulate 24 hours and see which are flagged.
:::

```r
set.seed(28)
defects <- rbinom(24, size = 20, prob = 0.1)    # defective items in each of 24 hours
defects
##  [1] 0 0 2 4 0 3 0 4 2 4 3 2 2 3 2 1 1 2 5 2 1 1 4 1
any(defects > 4)
## [1] TRUE
which(defects > 4)
## [1] 19
1 - pbinom(4, 20, 0.1)             # chance that a given hour has more than 4
## [1] 0.0431745
```

A binomial draw is literally a sum of Bernoulli draws, which gives a generator in one line. It is
far slower than `rbinom()` for large `size`, but it agrees with the exact distribution:

```r
rbinom.sum <- function(n, size, prob) {
  # each value is the number of successes among `size` Bernoulli(prob) trials
  replicate(n, sum(runif(size) < prob))
}
set.seed(2)
x <- rbinom.sum(10000, size = 20, prob = 0.3)
c(mean = mean(x), var = var(x))          # compare with 20(0.3) = 6 and 20(0.3)(0.7) = 4.2
##     mean      var 
## 6.001600 4.193617 
mean(x <= 4)
## [1] 0.2346
pbinom(4, 20, 0.3)
## [1] 0.2375078
```

### Poisson random variables

:::definition[Poisson random variable]
A count $X \in \{0, 1, 2, \dots\}$ with

$$
P(X = x) = \frac{e^{-\lambda}\lambda^x}{x!}
$$

and mean and variance both equal to $\lambda$, the *rate*. It is the limit of Binomial($n, p_n$) as
$n \to \infty$ with $n p_n \to \lambda$: split a time interval into many tiny pieces, each holding
an event with a small probability, and count the events.
:::

Poisson variables are the standard first model for counts: emails in an hour, accidents in a
year, typos on a page.

```r
dpois(2, lambda = 4)          # exactly 2 emails in an hour when the mean is 4
## [1] 0.1465251
ppois(2, lambda = 4)          # at most 2
## [1] 0.2381033
qpois(0.95, lambda = 4)       # 95th percentile
## [1] 8
set.seed(3)
emails <- rpois(8, lambda = 4)
emails
## [1] 2 6 3 3 4 4 2 3
big <- rpois(100000, lambda = 4)
c(mean = mean(big), var = var(big))   # both close to 4
##    mean     var 
## 3.99679 4.00936 
```

### The Poisson process

A **homogeneous Poisson process** with rate $\lambda$ scatters random points on a line (or in the
plane) so that

1. the number of points in a set is Poisson, with mean $\lambda \times$ (size of the set);
2. the counts in non-overlapping sets are independent.

On an interval $[0, L]$ it can be simulated in two steps: draw the number of points
$N \sim \text{Poisson}(\lambda L)$, then place $N$ points independently and uniformly on $[0, L]$.

```r
set.seed(4)
lambda <- 2; len <- 5
N <- rpois(1, lambda * len)           # how many points in [0, len]
times <- sort(runif(N, min = 0, max = len))
N
## [1] 10
round(times, 2)
##  [1] 0.37 1.30 1.39 1.43 1.47 3.62 3.77 4.07 4.53 4.75
```

To check property 1, simulate many realisations and count the points in a sub-interval of length
1.5: the counts should follow Poisson($2 \times 1.5 = 3$).

```r
count.in <- function(a, b, lambda = 2, len = 5) {
  N <- rpois(1, lambda * len)
  P <- runif(N, 0, len)
  sum(a <= P & P <= b)
}
set.seed(5)
counts <- replicate(10000, count.in(1, 2.5))      # an interval of length 1.5
c(mean = mean(counts), var = var(counts))          # Poisson(2 * 1.5): both near 3
##     mean      var 
## 3.022000 3.031819 
round(rbind(simulated = table(factor(counts, levels = 0:8)) / 10000,
            poisson   = dpois(0:8, 3)), 3)
##               0     1     2     3     4     5     6     7     8
## simulated 0.049 0.150 0.220 0.224 0.165 0.104 0.053 0.023 0.007
## poisson   0.050 0.149 0.224 0.224 0.168 0.101 0.050 0.022 0.008
```

## Continuous random variables

### The inversion method

::::theorem[Inverse transform]
Let $F$ be a continuous, strictly increasing distribution function and $U$ uniform on $(0, 1)$.
Then $X = F^{-1}(U)$ has distribution function $F$.

:::proof
$P(X \le x) = P(F^{-1}(U) \le x) = P(U \le F(x)) = F(x)$, because $F$ is increasing and
$P(U \le u) = u$ for $0 \le u \le 1$.
:::
::::

So any distribution whose $F$ can be inverted can be generated from uniforms.

:::example[Exponential variables]
The exponential distribution with rate $\lambda$ models waiting times with a constant failure
rate: lifetimes of components, service times. $F(t) = 1 - e^{-\lambda t}$ for $t \ge 0$, with density
$\lambda e^{-\lambda t}$, mean $1/\lambda$ and variance $1/\lambda^2$. Solving $u = 1 - e^{-\lambda t}$
for $t$ gives

$$
T = -\frac{\log(1 - U)}{\lambda}
$$
:::

```r
pexp(1, rate = 0.5)              # P(T <= 1) when the mean is 2
## [1] 0.3934693
qexp(0.5, rate = 0.5)            # the median, log(2)/0.5
## [1] 1.386294
set.seed(6)
U <- runif(100000)
T.inv <- -log(1 - U) / 0.5        # inversion by hand
T.r <- rexp(100000, rate = 0.5)   # R's generator
c(mean(T.inv), mean(T.r))         # both near 1/rate = 2
## [1] 2.006098 2.001135
c(var(T.inv), var(T.r))           # both near 1/rate^2 = 4
## [1] 4.056350 4.038885
mean(T.inv <= 1)
## [1] 0.3942
```

```sim
id: r-inverse-transform
controls:
  - {id: rate, label: "rate λ", min: 0.1, max: 5, step: 0.1, default: 0.5, decimals: 1}
  - {id: n, label: "number of draws", min: 100, max: 10000, step: 100, default: 2000, decimals: 0}
note: "Left: a uniform U is read on the vertical axis, carried across to the CDF and down to T = F⁻¹(U) (six draws shown). Evenly spread heights give values of T that bunch up where F is steep, which is where the density is high. Right: the histogram of all n draws against the exponential density λe^(−λt)."
```

The gaps between successive points of a Poisson process with rate $\lambda$ are independent
exponentials with rate $\lambda$, which gives a second way to simulate the process: add up
exponential waiting times.

```r
set.seed(7)
gaps <- rexp(10, rate = 2)       # waiting times between events
round(cumsum(gaps), 2)           # the event times of a rate-2 Poisson process
##  [1] 0.02 0.84 1.69 2.10 2.37 3.68 4.06 6.19 6.30 6.32
```

### Inversion for discrete distributions

The same idea works for a discrete distribution with values $v_1 < v_2 < \dots$: return the first
value whose cumulative probability exceeds $U$. `findInterval(u, cum)` counts how many cumulative
probabilities are at most `u`, so adding 1 gives the index of the value.

```r
values <- c(0, 1, 2, 3)
probs  <- c(0.1, 0.4, 0.3, 0.2)
cum <- cumsum(probs)
cum
## [1] 0.1 0.5 0.8 1.0
set.seed(8)
u <- runif(10)
values[findInterval(u, cum) + 1]      # first value whose cumulative prob exceeds u
##  [1] 1 1 2 2 1 2 1 3 2 2
big <- values[findInterval(runif(100000), cum) + 1]
table(big) / 100000
## big
##       0       1       2       3 
## 0.10007 0.39930 0.29998 0.20065 
```

### Normal random variables

:::definition[Normal density]
$$
f(x) = \frac{1}{\sigma\sqrt{2\pi}}\, e^{-(x-\mu)^2/(2\sigma^2)}
$$

with mean $\mu$ and variance $\sigma^2$; the standard normal has $\mu = 0$ and $\sigma = 1$.
:::

$F$ has no closed-form inverse, so `rnorm()` uses other methods (by default, inversion with an
accurate numerical approximation of $F^{-1}$).

```r
qnorm(0.975)                           # the familiar 1.96
## [1] 1.959964
pnorm(1.96) - pnorm(-1.96)
## [1] 0.9500042
qnorm(0.9, mean = 100, sd = 15)        # 90th percentile of N(100, 15^2)
## [1] 119.2233
set.seed(9)
round(rnorm(5, mean = 100, sd = 15), 1)
## [1]  88.5  87.8  97.9  95.8 106.5
```

### Conditional distributions by rejection

To simulate from a distribution **conditioned on an event**, simulate from the unconditional
distribution and throw away the draws outside the event. What is kept has exactly the
conditional distribution. The price is waste: the fraction kept equals the probability of the
event, so rare events need many draws.

```r
set.seed(10)
z <- rnorm(100000)
kept <- z[z > 1 & z < 2]              # condition on 1 < Z < 2 by rejection
length(kept) / 100000                 # the acceptance rate ...
## [1] 0.13489
pnorm(2) - pnorm(1)                   # ... is the probability of the condition
## [1] 0.1359051
mean(kept)
## [1] 1.38055
```

:::example[Chi-square variables]
A chi-square variable with $k$ degrees of freedom has the distribution of $Z_1^2 + \dots + Z_k^2$
for independent standard normals, with mean $k$ and variance $2k$. Put $k$ normals in each row of a
matrix and sum the rows.
:::

```r
set.seed(11)
Z <- matrix(rnorm(3 * 100000), ncol = 3)
chisq3 <- rowSums(Z^2)                 # sum of 3 squared standard normals
c(mean = mean(chisq3), var = var(chisq3))   # chi-square(3): 3 and 6
##     mean      var 
## 2.991833 5.975210 
mean(chisq3 > qchisq(0.95, df = 3))         # about 0.05
## [1] 0.0492
```

## Multivariate random numbers

### Independent components

When the components of a random vector are independent, each is simulated on its own, with any
distribution, and the results are put side by side.

```r
set.seed(12)
n <- 100000
height <- rnorm(n, mean = 170, sd = 8)
eyes <- sample(c("brown", "blue", "green"), n, replace = TRUE, prob = c(0.6, 0.3, 0.1))
head(data.frame(height = round(height, 1), eyes))
##   height  eyes
## 1  158.2 brown
## 2  182.6 brown
## 3  162.3 brown
## 4  162.6  blue
## 5  154.0 green
## 6  167.8 brown
cor(height, eyes == "blue")            # independent: near 0
## [1] -0.002391992
```

### Dependent components

Dependence has to be built in. For two standard normals with correlation $\rho$, start from
independent $Z_1, Z_2$ and set

$$
X = Z_1 \qquad Y = \rho Z_1 + \sqrt{1 - \rho^2}\, Z_2
$$

Then $\operatorname{Var}(Y) = \rho^2 + (1 - \rho^2) = 1$ and $\operatorname{Cov}(X, Y) = \rho$.

```r
set.seed(13)
rho <- 0.8
Z1 <- rnorm(n)
Z2 <- rnorm(n)
X <- Z1
Y <- rho * Z1 + sqrt(1 - rho^2) * Z2
c(sd(X), sd(Y), cor(X, Y))            # 1, 1 and rho
## [1] 0.9984269 1.0011022 0.7990026
```

```sim
id: covariance-scatter
controls:
  - {id: rho, label: "correlation ρ", min: -0.95, max: 0.95, step: 0.05, default: 0.8, decimals: 2}
  - {id: sx, label: "σ_X", min: 0.5, max: 2, step: 0.1, default: 1, decimals: 1}
  - {id: sy, label: "σ_Y", min: 0.5, max: 2, step: 0.1, default: 1, decimals: 1}
  - {id: n, label: "number of pairs", min: 50, max: 2000, step: 50, default: 500, decimals: 0}
note: "Pairs built exactly as above, X = σ_X Z₁ and Y = σ_Y(ρZ₁ + √(1 − ρ²) Z₂), from independent standard normals. At ρ = 0 the cloud is round. As |ρ| grows it narrows along a line, and the sample correlation tracks the ρ you chose."
```

The general version uses a matrix square root of the covariance matrix. If $\Sigma = R^{\mathsf T} R$
(the **Cholesky factor** $R$ from `chol()`, upper triangular) and $\mathbf Z$ is a row of
independent standard normals, then $\boldsymbol\mu + \mathbf Z R$ has mean $\boldsymbol\mu$ and covariance
$R^{\mathsf T} R = \Sigma$. With many rows at once, `Z %*% R` transforms them all, and `sweep()` adds
the mean to every row. (`MASS::mvrnorm()` packages the same idea.)

```r
Sigma <- matrix(c(4, 3, 3, 9), nrow = 2)     # variances 4 and 9, covariance 3
mu <- c(10, 20)
R <- chol(Sigma)                  # upper triangular, t(R) %*% R equals Sigma
R
##      [,1]     [,2]
## [1,]    2 1.500000
## [2,]    0 2.598076
t(R) %*% R
##      [,1] [,2]
## [1,]    4    3
## [2,]    3    9
set.seed(14)
Z <- matrix(rnorm(2 * n), ncol = 2)
XY <- sweep(Z %*% R, 2, mu, "+")  # each row is one draw of (X, Y)
colMeans(XY)
## [1]  9.990925 20.001712
var(XY)
##          [,1]     [,2]
## [1,] 3.993698 3.004004
## [2,] 3.004004 9.000906
```

:::example[A discrete joint distribution]
For a pair $(X, Y)$ given by a table of joint probabilities, draw a **cell** of the table with
`sample()` and read $X$ from its row and $Y$ from its column. `as.vector()` lists a matrix
column by column, and `row()`, `col()` give each cell's row and column number in the same order.
:::

```r
joint <- matrix(c(0.10, 0.20, 0.05,
                  0.25, 0.15, 0.25), nrow = 2, byrow = TRUE,
                dimnames = list(X = c("0", "1"), Y = c("0", "1", "2")))
joint
##    Y
## X      0    1    2
##   0 0.10 0.20 0.05
##   1 0.25 0.15 0.25
set.seed(15)
cells <- sample(6, n, replace = TRUE, prob = as.vector(joint))   # pick a cell
Xs <- row(joint)[cells] - 1           # its row gives X ...
Ys <- col(joint)[cells] - 1           # ... and its column gives Y
round(table(X = Xs, Y = Ys) / n, 3)
##    Y
## X       0     1     2
##   0 0.101 0.198 0.050
##   1 0.247 0.152 0.252
```

## Markov chains

### Transition probabilities

:::definition[Markov chain]
A sequence of random states $X_0, X_1, X_2, \dots$ from a set $\{1, \dots, k\}$ in which the next
state depends only on the current one:

$$
P(X_{t+1} = j \mid X_t = i, X_{t-1}, \dots, X_0) = P(X_{t+1} = j \mid X_t = i) = p_{ij}
$$

The **transition matrix** $P = (p_{ij})$ has row $i$ equal to the distribution of the next state
given the current state $i$, so its entries are non-negative and **each row sums to 1**
(a *stochastic matrix*).
:::

:::example[Weather]
Each day is sunny, cloudy or rainy, and tomorrow depends only on today, as in the matrix below.
A sunny day is followed by another sunny day with probability 0.6.
:::

```r
states <- c("sunny", "cloudy", "rainy")
P <- matrix(c(0.6, 0.3, 0.1,
              0.3, 0.4, 0.3,
              0.2, 0.4, 0.4), nrow = 3, byrow = TRUE,
            dimnames = list(today = states, tomorrow = states))
P
##         tomorrow
## today    sunny cloudy rainy
##   sunny    0.6    0.3   0.1
##   cloudy   0.3    0.4   0.3
##   rainy    0.2    0.4   0.4
rowSums(P)                        # every row is a probability distribution
##  sunny cloudy  rainy 
##      1      1      1 
```

### Simulating a path

Starting from a state, repeatedly draw the next state from the row of the current one:

```r
simulate.chain <- function(P, start, steps) {
  path <- character(steps + 1)
  path[1] <- start
  for (t in 1:steps) {
    path[t + 1] <- sample(colnames(P), 1, prob = P[path[t], ])   # row of the current state
  }
  path
}
set.seed(16)
simulate.chain(P, "sunny", 14)
##  [1] "sunny"  "cloudy" "cloudy" "rainy"  "cloudy" "sunny"  "sunny"  "sunny" 
##  [9] "cloudy" "sunny"  "sunny"  "sunny"  "sunny"  "sunny"  "cloudy"
```

### Several steps ahead

The probability of going from $i$ to $j$ in two steps sums over the intermediate state:
$\sum_k p_{ik} p_{kj}$, which is the $(i, j)$ entry of $P^2$. In general the $n$-step transition
probabilities are the entries of $P^n$.

```r
P2 <- P %*% P                     # two-step transition probabilities
round(P2, 3)
##         tomorrow
## today    sunny cloudy rainy
##   sunny   0.47   0.34  0.19
##   cloudy  0.36   0.37  0.27
##   rainy   0.32   0.38  0.30
P2["sunny", "rainy"]
## [1] 0.19
Pn <- diag(3)
for (k in 1:30) Pn <- Pn %*% P    # thirty steps: every row is (almost) the same
round(Pn, 4)
##       tomorrow
##         sunny cloudy  rainy
##   [1,] 0.3934 0.3607 0.2459
##   [2,] 0.3934 0.3607 0.2459
##   [3,] 0.3934 0.3607 0.2459
```

After thirty steps every row of $P^n$ is the same: the chain has forgotten where it started.

```sim
id: r-markov-weather
controls:
  - {id: start, label: "today: 1 sunny · 2 cloudy · 3 rainy", min: 1, max: 3, step: 1, default: 3, decimals: 0}
  - {id: n, label: "days ahead t", min: 0, max: 20, step: 1, default: 5, decimals: 0}
note: "The probability of each weather t days ahead, which is the row of Pᵗ for today's state. Whatever the start, the three curves settle onto the stationary distribution (dotted) within about a week: the chain forgets where it started. Compare the value at t = 2 with the P2 matrix in the R output."
```

### The stationary distribution

:::definition[Stationary distribution]
A probability row vector $\pi$ with $\pi P = \pi$: if today's state has distribution $\pi$, so does
tomorrow's. For a chain in which every state can reach every other and the chain does not cycle
periodically, $\pi$ is unique, every row of $P^n$ tends to $\pi$, and the long-run proportion of time
spent in state $j$ is $\pi_j$.
:::

Transposing, $P^{\mathsf T} \pi^{\mathsf T} = \pi^{\mathsf T}$: $\pi$ is an **eigenvector of
$P^{\mathsf T}$ for the eigenvalue 1**, scaled to sum to 1. The simulation, the matrix power and
the eigenvector give the same answer; exactly, it is $\pi = (24, 22, 15)/61$.

```r
set.seed(17)
long <- simulate.chain(P, "rainy", 50000)
round(table(long)[states] / length(long), 4)       # long-run proportions
## long
##  sunny cloudy  rainy 
## 0.3883 0.3630 0.2487 
e <- eigen(t(P))                  # stationary: pi P = pi, i.e. t(P) pi = pi
e$values
## [1] 1.00000000 0.37320508 0.02679492
stat <- Re(e$vectors[, 1])
round(stat / sum(stat), 4)
## [1] 0.3934 0.3607 0.2459
```

:::insight
Uniform numbers are the raw material: compare with $p$ for a Bernoulli trial, invert $F$ for a
continuous variable, look up cumulative probabilities for a discrete one, reject to condition,
and combine independent draws to build dependence. A Markov chain is simulated one step at a
time from the row of its current state, and its long-run behaviour is read from $P^n$ or from the
eigenvector of $P^{\mathsf T}$ for eigenvalue 1.
:::

## Further reading

- [R documentation: Distributions](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/Distributions.html) — the d/p/q/r functions for every distribution in base R.
- [Inverse transform sampling (Wikipedia)](https://en.wikipedia.org/wiki/Inverse_transform_sampling) — the method, with discrete and continuous cases.
- [Poisson point process (Wikipedia)](https://en.wikipedia.org/wiki/Poisson_point_process) — properties and simulation of the process on the line and in the plane.
- [Markov chain (Wikipedia)](https://en.wikipedia.org/wiki/Markov_chain) — transition matrices, stationary distributions and convergence.
