---
title: Pseudorandom numbers
order: 4
asks: a congruential generator by hand, its period, seeds, runif(), sample(), integers from uniforms
units: [monte-carlo-pseudorandom]
---

## Logic

A computer follows a rule, so its "random" numbers are a deterministic sequence that merely passes for
independent uniforms. The simplest rule is $x_n=b\,x_{n-1}\bmod m$ with $u_n=x_n/m$. Each value depends only on
the one before it, so the first repeat starts a cycle. The seed picks the starting point, which is why the same
seed gives the same numbers.

## Pattern

:::steps[A congruential generator by hand]
1. Write $x_0$, the seed, and multiply by $b$. Keep the remainder after dividing by $m$.
2. Repeat until a value comes back: the **period** is the number of steps between the two appearances.
3. Period $m-1$ means every value from 1 to $m-1$ appears: the longest possible.
4. If the sequence hits 0 it stays at 0, because $b\cdot0=0$. That happens when $m$ divides a power of $b$, and a prime $m$ prevents it.
5. Divide by $m$ for the uniforms: $u_n=x_n/m$.
:::

:::steps[Uniforms in R]
1. `set.seed(k)` fixes the starting point: the same seed gives the same sequence, and it continues from there.
2. `runif(n, min, max)` gives $n$ uniforms on $(\text{min},\text{max})$, by default on $(0,1)$.
3. `sample(x, size, replace, prob)` draws from a finite set: without replacement by default, so `sample(x)` permutes `x`.
4. Integers 1 to $k$ from a uniform: `ceiling(k * u)`, or `floor(k * u) + 1`.
:::

## Traps

:::caution[Traps]
- `round(10 * u)` gives 0 to 10, and the two end values come up half as often as the others. Use `ceiling()`.
- `%%` is the remainder in R; `%/%` is integer division.
- The period is the length of the cycle, not the number of values you listed.
- A long period alone does not make a good generator: test the mean ($\tfrac12$), the variance ($\tfrac1{12}$), the histogram, and the correlation of successive values.
- `set.seed()` is not a random number: calling it before **every** draw returns the same value each time.
:::

## Worked problems

::::exercise[Three small generators]
Take $x_0=1$. Find the sequence and the period for (a) $b=5$, $m=13$; (b) $b=6$, $m=13$; (c) $b=6$, $m=16$.
Give the first three uniforms of (b).

:::solution
(a) $5,\ 25\bmod13=12,\ 60\bmod13=8,\ 40\bmod13=1$: back at 1 after 4 steps, so the period is 4.

(b) $6, 10, 8, 9, 2, 12, 7, 3, 5, 4, 11, 1$: period 12, the longest possible, since $m-1=12$. The first three
uniforms are $\frac6{13}\approx0.462$, $\frac{10}{13}\approx0.769$, $\frac8{13}\approx0.615$.

(c) $6,\ 36\bmod16=4,\ 24\bmod16=8,\ 48\bmod16=0$, then 0 for ever: 16 divides $6^4$.

```r
mcg <- function(n, b, m, seed) {
  x <- numeric(n)
  for (k in 1:n) {
    seed <- (b * seed) %% m       # the rule; the seed variable carries the state
    x[k] <- seed
  }
  x
}
mcg(5, b = 5, m = 13, seed = 1)
## [1]  5 12  8  1  5
mcg(13, b = 6, m = 13, seed = 1)
##  [1]  6 10  8  9  2 12  7  3  5  4 11  1  6
mcg(6, b = 6, m = 16, seed = 1)
## [1] 6 4 8 0 0 0
round(mcg(3, b = 6, m = 13, seed = 1) / 13, 3)
## [1] 0.462 0.769 0.615
```
:::
::::

:::note[Pattern at work]
Steps 1 to 5 of the first list. Reduce after each multiplication, so the numbers stay small by hand. (b) is
step 3, (c) is step 4: a modulus that is a power of 2 and an even multiplier end at 0.
:::

::::exercise[Seeds]
What does this print?

```r
set.seed(7)
a <- runif(2)
b <- runif(2)
set.seed(7)
d <- runif(4)
identical(a, d[1:2])
identical(b, d[3:4])
identical(a, b)
set.seed(7); p <- runif(1)
set.seed(7); q <- runif(1)
p == q
```

:::solution
```text
[1] TRUE
[1] TRUE
[1] FALSE
[1] TRUE
```

A seed fixes the whole sequence. `a` is its first two values, `b` the next two, and `d` the first four. Setting
the same seed again restarts it, so `p` and `q` are equal.
:::
::::

:::note[Pattern at work]
The first step of the second list. No number had to be known: only that the sequence is one fixed list, read
from the start after each `set.seed(7)`.
:::

::::exercise[A fair die from uniforms]
(a) Which of these give a fair die: `ceiling(6 * u)`, `round(6 * u)`, `floor(6 * u) + 1`, `round(6 * u) + 1`?
(b) Write one line for a die with $P(6)=0.5$ and the other faces equally likely. (c) Write one line for a random
permutation of the letters `a` to `e`.

:::solution
(a) `ceiling(6 * u)` and `floor(6 * u) + 1`: each of 1 to 6 gets an interval of width $\tfrac16$ for `u`.
`round(6 * u)` gives 0 to 6 with half-width ends, and `round(6 * u) + 1` gives 1 to 7, again with half-width
ends.

```r
set.seed(63)
u <- runif(60000)
table(ceiling(6 * u))
##
##     1     2     3     4     5     6
## 10018  9963 10003 10034  9965 10017
table(round(6 * u))
##
##     0     1     2     3     4     5     6
##  5017  9950 10045  9996 10028  9927  5037
loaded <- sample(1:6, 60000, replace = TRUE, prob = c(0.1, 0.1, 0.1, 0.1, 0.1, 0.5))
round(table(loaded) / 60000, 3)
## loaded
##     1     2     3     4     5     6
## 0.101 0.101 0.100 0.098 0.099 0.501
sample(letters[1:5])
## [1] "e" "b" "c" "d" "a"
```

(b) The `prob` vector must have one entry per face, and here the five other faces share $0.5$ equally.
(c) `sample(letters[1:5])`: without `replace`, a sample of the whole set is a permutation.
:::
::::

:::note[Pattern at work]
Steps 3 and 4 of the second list. Width of the interval is the probability, which is the whole idea behind
turning uniforms into anything else.
:::
