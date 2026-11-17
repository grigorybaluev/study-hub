---
title: The big picture
---

## Two halves

The test asks for R written and read by hand, and for simulation.

- **Programming with R** (weeks 3–7): data frames, a file imported and plotted, loops and functions for a recursive
  sequence, Newton's method, what a function sees and returns, and short code traced, fixed and made faster.
- **Simulation** (weeks 6–10), below.

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
- **The error is $s/\sqrt n$.** Four times the draws halve it, whatever the dimension.
:::

The **Map** tab draws this as three maps: from a target distribution to the R code that draws from it, from a
question to an estimate with its error, and the routes from a transition matrix to the long run.

## Programming with R by hand

Weeks 3–7 · [Data frames and data I/O](/unit/STAT280/data-frames-lists-io) ·
[Statistical graphics](/unit/STAT280/statistical-graphics) · [Flow control and functions](/unit/STAT280/flow-control-functions)

A data frame is a list of equal-length columns. `d$x` is one column as a vector, a condition such as `d$x > 80` is a
logical vector with one value per row, and `d[cond, ]` keeps the rows where it is `TRUE`. A new column is an
assignment, and arithmetic on columns works row by row, with no loop.

```r
d <- data.frame(name = c("Ana", "Ben", "Cy"), t1 = c(70, 85, 62), t2 = c(80, 75, 90))
d$avg <- (d$t1 + d$t2) / 2
d$name[d$avg >= 76]
## [1] "Ben" "Cy" 
d[d$t1 > d$t2, ]
##   name t1 t2 avg
## 2  Ben 85 75  80
```

A file comes in with `read.csv("file.csv")`. A plot is one high-level call that sets the axes, then layers on top of
it: `plot(x, y, pch = 16, col = "blue", xlab = , ylab = , main = )`, then `abline(a = 0, b = 1, lty = 2)`, `points()`,
`lines()`, `text()`, and a `legend()` that repeats each layer's `col`, `pch` and `lty`.

A loop that builds a sequence pre-allocates, sets the first term and fills term $i$ from term $i-1$. `for` runs a
known number of times; `while` runs until its condition fails, which might be never. Newton's method is such a
loop: $x_{n+1}=x_n-f(x_n)/f'(x_n)$ until two guesses differ by less than a tolerance.

```r
f <- function(x) x^3 - 10
df <- function(x) 3 * x^2
x <- 2
x.new <- x - f(x) / df(x)
while (abs(x.new - x) >= 1e-8) {
  x <- x.new
  x.new <- x - f(x) / df(x)
}
x.new                                # the cube root of 10
## [1] 2.154435
```

A function runs in its own environment. An assignment inside it is local, so a global variable of the same name is
unchanged after the call; a name it only reads is found where the function was defined, at the time of the call.
It returns one object, so several results go back as a named list. Short code is read by **tracing**: a column per
variable, a row per pass, compared with what it should compute; the first row that differs holds the bug.

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

To estimate $\mu=E(X)$, generate $n$ independent copies and take their mean. A probability is the mean of an
indicator, so it is estimated by a proportion. The law of large numbers gives convergence, and the central limit
theorem gives the 95 % interval $\bar X\pm1.96\,s/\sqrt n$.

```r
set.seed(8)
n <- 10000
X <- pmax(runif(n), runif(n))             # the larger of two uniforms
mean(X)                                   # exact: 2/3
## [1] 0.6675151
sd(X) / sqrt(n)                           # its standard error
## [1] 0.002354671
mean(X) + c(-1.96, 1.96) * sd(X) / sqrt(n)
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
| cost | a fraction $1-k$ of proposals is thrown away, for a normalised $g$ | a weighted sample, not a plain one |
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

- pick rows and columns of a data frame, add a column, and keep the rows that meet a condition;
- import a CSV file, plot one column against another with symbols, colours, labels, a reference line and a legend;
- write a function for the first $n$ terms of a recursive sequence, and a `while` loop that counts the steps to a value;
- run Newton's method by hand for two steps, write it in R with a tolerance, and say when it fails;
- say what a function returns and which variables it changes, and return several results as a list;
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

Not on this test: computational linear algebra (weeks 11–12), which comes after it.
