---
title: The big picture
---

## One idea, two halves

Weeks 6–10 rest on one idea: **to learn about a random quantity, simulate it many times and average.** Everything
else is either how to write that repetition well, or how to get the random numbers it needs.

- **Programming practice** (weeks 6–7): repeat an experiment with `replicate()`, design a program top-down, find and
  fix bugs, and make slow code fast.
- **Simulation** (weeks 8–10): pseudorandom uniforms, every other distribution built from them, Markov chains one
  step at a time, and integrals written as expected values.

:::insight[The pictures to keep in mind]
- **A probability is a width.** A uniform falls in an interval of width $p$ with probability $p$. Bernoulli trials,
  discrete inversion and `sample()` are all this one fact.
- **The inverse transform reads a graph sideways.** A uniform height on the vertical axis of $F$ is carried across
  to the curve and down to $x$.
- **Rejection is throwing darts.** Points uniform under a curve have $x$-coordinates with that curve as their
  density.
- **An integral is an average.** The area under $g$ on $[a,b]$ is the width times the mean height.
- **The error is $s/\sqrt m$.** Four times the draws halve it, whatever the dimension.
:::

The **Map** tab draws this as three maps: from a target distribution to the R code that draws from it, from a
question to an estimate with its error, and the routes from a transition matrix to the long run.

## Repeating a computation

Week 6 · [Programming practice](/unit/STAT280/programming-practice)

`replicate(n, expr)` evaluates `expr` again $n$ times and collects the results: a vector if each result is one
number, a $k\times n$ matrix if each is a vector of length $k$. `sapply(x, f)` calls `f` once for each element of
`x`. Both hide the index and the storage vector of a loop.

```r
set.seed(6)
pair.sum <- function() sum(sample(1:4, 2, replace = TRUE))    # two four-sided dice
s <- replicate(10000, pair.sum())
mean(s == 5)                         # exact: 4/16 = 0.25
## [1] 0.2479
dim(replicate(5, sample(1:4, 2)))    # 2 values each time, one column per repetition
## [1] 2 5
sapply(1:5, function(k) k * (k + 1) / 2)
## [1]  1  3  6 10 15
```

## Designing and debugging

Weeks 6–7 · [Programming practice](/unit/STAT280/programming-practice)

:::steps[Writing a program, and fixing one]
1. **Write**: understand the problem on a specific case, find a general idea, translate it, check it.
2. **Large problems**: top-down. Cut the program into a few steps, and cut each step again until it is one line of code.
3. **Debug**: recognise the bug, make it reproducible, find the cause, fix it and test, look for similar errors.
:::

Sorting is the worked case: bubble sort swaps neighbours in repeated passes, and merge sort splits the vector, sorts
the halves recursively and merges them by taking the smaller front element. Test the **edge cases** first: empty
input, length one, ties, zero. `stopifnot()` turns silent nonsense into an immediate error, `traceback()` shows the
calls that led to an error, and `browser()` and `debug()` stop inside a function. `set.seed()` makes a simulation
repeat exactly, so that a bug that comes and goes can be caught.

## Efficient programming

Week 7 · [Programming practice](/unit/STAT280/programming-practice)

Correct first, then measure, then speed up what is actually slow: about 90 % of the time sits in about 10 % of the
code. `system.time()` measures one expression and `Rprof()` a whole program. In order of payoff: a better algorithm
(Horner's rule, binary search with at most $\lceil\log_2(n+1)\rceil$ comparisons, merge sort), vectorised code, a
pre-allocated result, and only last of all compiled code. Growing a vector with `c()` in a loop copies it on every
pass.

## Monte Carlo and pseudorandom numbers

Week 8 · [Monte Carlo simulation and pseudorandom numbers](/unit/STAT280/monte-carlo-pseudorandom)

To estimate $\mu=E(X)$, generate $m$ independent copies and take their mean. A probability is the mean of an
indicator, so it is estimated by a proportion. The law of large numbers gives convergence, and the central limit
theorem gives the 95 % interval $\bar X\pm1.96\,s/\sqrt m$.

```r
set.seed(8)
m <- 10000
X <- pmax(runif(m), runif(m))             # the larger of two uniforms
mean(X)                                   # exact: 2/3
## [1] 0.6675151
sd(X) / sqrt(m)                           # its standard error
## [1] 0.002354671
mean(X) + c(-1.96, 1.96) * sd(X) / sqrt(m)
## [1] 0.6628999 0.6721303
```

Uniforms come from a deterministic rule. The multiplicative congruential generator is
$x_n=b\,x_{n-1}\bmod m$ with $u_n=x_n/m$. It is periodic, with period at most $m-1$; the seed $x_0$ picks the start.
R's default is the Mersenne Twister, reached through `runif()` and `sample()`, and `set.seed()` fixes its start.

## From uniforms to any distribution

Week 9 · [Simulating random variables and Markov chains](/unit/STAT280/simulating-random-variables)

| You have | Method | In R |
|---|---|---|
| a named distribution | call its generator | `rbinom`, `rpois`, `rexp`, `rnorm`, … |
| a yes/no with probability $p$ | compare a uniform with $p$ | `runif(n) < p` |
| a finite table | look up the cumulative probabilities | `sample(v, n, TRUE, p)` |
| an invertible $F$ | $X=F^{-1}(U)$ | `Finv(runif(n))` |
| a condition | simulate, keep what satisfies it | `x[x > a]` |
| a sum of squares, a maximum | combine draws | `rowSums(Z^2)`, `pmax(a, b)` |
| a covariance matrix | Cholesky factor | `Z %*% chol(Sigma)` |

Each distribution has four functions: `d` for $P(X=x)$ or the density, `p` for $F$, `q` for the quantile, `r` for
draws. For example, a Poisson process with rate $\lambda$ on $[0,L]$ has a Poisson($\lambda L$) number of points placed
uniformly, or equivalently independent exponential gaps.

## Markov chains

Week 9 · [Simulating random variables and Markov chains](/unit/STAT280/simulating-random-variables)

Row $i$ of $P$ is the distribution of the next state given state $i$, so each row sums to 1. A path is simulated by
drawing from the row of the current state. $P^n$ holds the $n$-step probabilities, computed with `%*%`. For a chain
in which every state reaches every other and which does not cycle, all rows of $P^n$ tend to the stationary
distribution $\pi$, with $\pi P=\pi$, and $\pi_j$ is also the long-run fraction of time in state $j$. It is an
eigenvector of the transpose, for the eigenvalue 1.

## Monte Carlo integration and advanced methods

Week 10 · [Monte Carlo integration and advanced simulation](/unit/STAT280/monte-carlo-integration)

$$\int_a^bg(x)\,dx=(b-a)\,E[g(U)]\approx(b-a)\,\frac1n\sum_{i=1}^ng(U_i).$$

The standard error is $(b-a)\,s_g/\sqrt n$. **Hit-or-miss** instead counts the fraction of points of a box that fall
under the graph, and it is never more accurate than this **sample mean** estimate. Over a box in several
dimensions, multiply by the volume of the box. On an infinite range, sample from a density $f$ and average $g/f$,
keeping that ratio bounded.

For a density with no usable $F$, or known only up to a constant, there are two tools:

| | Rejection | Importance sampling |
|---|---|---|
| idea | keep proposals that fall under the target | keep every proposal, with a weight |
| needs | an envelope density $f$ and $k$ with $k\,g\le f$ | a density $f$; weights $w=g/f$ |
| result | a plain sample from $g$ | weighted averages under $g$ |
| cost | a fraction $1-k$ of proposals is thrown away | a weighted sample, not a plain one |
| best for | a sample to plot or to reuse | means, and rare events |

## How it fits together

:::insight[Four ideas hold these weeks together]
- **One experiment, many times.** A function for one repetition, `replicate()`, then `mean()`. Every simulation in
  the course has this shape, or its vectorised form.
- **Uniforms are the raw material.** Compare them, invert through them, reject with them, or sum them: all the other
  generators reduce to `runif()`.
- **Everything is an expected value.** A probability, an integral, a volume or a long-run mean is $E[Y]$ for some
  $Y$ you can simulate. So the estimate is a mean, and the error is $s/\sqrt n$.
- **Check against what you know.** An exact mean, a trusted function, an edge case, a second method. In debugging and
  in simulation, this is the same habit.
:::

What you can solve now:

- turn an experiment into a function, repeat it, and read the shape of what comes back;
- trace a short function by hand, find the bug, list the edge cases, and choose the debugging tool;
- replace a loop by a vector expression, and count the operations of two algorithms;
- run a congruential generator by hand and find its period;
- give an estimate with a standard error and an interval, and the number of draws for a target accuracy;
- translate a question into `d`, `p`, `q` or `r`, and generate from a table;
- go from a density to a generator by inversion, and from a target to a box or an envelope;
- condition by rejection, and build correlated normals;
- write a transition matrix, simulate a path, and find $P^n$ and $\pi$;
- write an integral as an expected value, by the sample mean and by hit-or-miss, and estimate it.

Not on this test: weeks 1–5 as topics in their own right, though vectors, functions and loops are used all the
time, and computational linear algebra (weeks 11–12), which comes after it.
