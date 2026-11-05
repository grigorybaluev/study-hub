---
title: Repeating an experiment
order: 1
asks: one experiment as a function, replicate() and sapply(), the shape of the result, a loop rewritten
units: [programming-practice]
---

## Logic

A simulation is one random experiment repeated many times. Write the experiment once, as a function or an
expression that returns its result, and let `replicate()` do the repeating. The shape of the result follows
from what one repetition returns: one number gives a vector, $k$ numbers give a $k\times n$ matrix with one
**column** per repetition. `sapply()` is the same idea when each call needs a different input.

## Pattern

:::steps[One experiment, then many]
1. Write **one** repetition and test it by itself: `one <- function() ...`, then `one()` a few times.
2. Decide what one repetition returns: a number, a logical, or a vector of length $k$.
3. Repeat: `res <- replicate(n, one())`. The result is a vector of length $n$, or a $k\times n$ matrix.
4. Summarise: `mean(res)` for an expected value, `mean(res == 7)` or `mean(res > a)` for a probability.
5. A different input on each call: `sapply(values, f)`, one call per element.
:::

## Traps

:::caution[Traps]
- `replicate(5, x)` with `x <- runif(1)` already computed repeats **one** value. The random call has to be inside the expression.
- A vector result comes back as columns: `replicate(1000, runif(3))` has `dim` 3 and 1000, not 1000 and 3.
- `replicate(n, f)` without the brackets does not call `f`: write `f()`.
- `sample(1:6, 2)` draws without replacement, so it cannot give a double. Two dice need `replace = TRUE`.
- The loop version needs its storage first, `res <- numeric(n)`, and `res[k] <-` inside the loop.
:::

## Worked problems

::::exercise[What comes back?]
Give the length or the dimensions of each result, or the result itself when it does not depend on the seed.

```r
a <- replicate(6, sum(sample(1:6, 2, replace = TRUE)))
b <- replicate(6, sample(1:6, 2, replace = TRUE))
d <- sapply(1:4, function(k) k^2 - 1)
e <- sapply(1:3, function(k) c(k, 10 * k))
length(a)
dim(b)
d
e
```

:::solution
```text
[1] 6
[1] 2 6
[1]  0  3  8 15
     [,1] [,2] [,3]
[1,]    1    2    3
[2,]   10   20   30
```

`a`: each repetition is one number, so a vector of length 6. `b`: each repetition is 2 numbers, so a
$2\times 6$ matrix. `d`: one number per element of `1:4`. `e`: each call returns 2 numbers, so `sapply()`
also builds a matrix with one column per element.
:::
::::

:::note[Pattern at work]
Step 2 decides everything: read what one repetition returns, and the shape follows. Nothing here needs a
random number to be known.
:::

::::exercise[At least one six]
Four dice are rolled. Write a function for one game that returns whether at least one six appears, estimate
the probability from 10 000 games, compare with the exact value, and rewrite the repetition as a `for` loop.

:::solution
Exactly, $P(\text{at least one six})=1-(5/6)^4\approx0.5177$.

```r
one.game <- function() any(sample(1:6, 4, replace = TRUE) == 6)
set.seed(41)
wins <- replicate(10000, one.game())
mean(wins)                     # exact: 1 - (5/6)^4
## [1] 0.518
1 - (5/6)^4
## [1] 0.5177469
wins2 <- logical(10000)        # the same with a loop: storage first
for (k in 1:10000) wins2[k] <- one.game()
mean(wins2)
## [1] 0.5175
```

`any()` turns the four comparisons into one logical, and the mean of a logical vector is the proportion of
`TRUE`.
:::
::::

:::note[Pattern at work]
Steps 1, 3 and 4. The function has no arguments and returns one logical, so `replicate()` gives a logical
vector. The loop needs two extra things, the storage and the index, which is exactly the bookkeeping
`replicate()` hides.
:::

::::exercise[A fresh value on every call]
What does this print, and why are the two lines different?

```r
set.seed(5)
x <- rnorm(1)
length(unique(replicate(4, x)))
length(unique(replicate(4, rnorm(1))))
```

:::solution
```text
[1] 1
[1] 4
```

`replicate()` evaluates its expression again each time. The expression `x` is a stored value, so all four
results are the same number. The expression `rnorm(1)` makes a new draw each time, so all four differ.
:::
::::

:::note[Pattern at work]
The first trap: the randomness must live inside the repeated expression.
:::
