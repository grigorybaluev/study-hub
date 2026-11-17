---
title: Trace it, fix it, sort it
order: 6
asks: the logical error in a short loop and a corrected version, the vector after one pass of bubble sort, whether it is sorted, a loop rewritten as one vector expression
units: [programming-practice, flow-control-functions]
---

## Logic

A logical error gives a wrong answer with no message, so it is found by **tracing**: run the code by hand on a small
input and compare each step with what it should be. Bubble sort compares neighbours from left to right and swaps them
when they are out of order; one pass carries the largest value to the end, but the rest may still be unsorted, so a
vector of length $n$ may need up to $n-1$ passes. A loop that applies the same arithmetic to every element is one
**vector expression** in R: shorter, clearer, and faster.

## Pattern

:::steps[Reading short code]
1. Say in words what the code should compute, and work it out for a tiny input.
2. Trace: one column per variable, one row per pass of the loop. The first row that differs from step 1 shows the bug.
3. Fix the cause (the wrong line) and test again on the tiny input and on an edge case (length 1, negative values, empty).
4. For a sorting pass: write the vector after each comparison, swapping only when the left value is larger.
5. To vectorise: replace `x[i]` by `x` and drop the loop and the storage vector; `if` on one element becomes `ifelse()` or a logical index; running totals become `cumsum()`.
:::

## Traps

:::caution[Traps]
- Starting a running maximum at 0 fails when every value is negative; start at `x[1]`, or `-Inf`.
- `1:length(x)` on an empty vector runs twice (`1:0`); use `seq_along(x)`.
- In a swap, saving the left value first matters: `x[i] <- x[i + 1]; x[i + 1] <- x[i]` copies one value twice.
- One pass of bubble sort fixes the **last** position only; "sorted after one pass" is true only by luck.
- `if (x > 0)` on a whole vector is an error (R 4.2+); the vector version is `ifelse(x > 0, ..., ...)`.
:::

## Worked problems

::::exercise[Two silent bugs]
Each function runs without an error but is wrong. Find the logical error by tracing, and fix it.

```r
mean.abs.dev <- function(x) {        # should give the mean distance of the values from their mean
  m <- mean(x)
  s <- 0
  for (i in 1:length(x)) s <- s + (x[i] - m)
  s / length(x)
}
my.max <- function(x) {              # should give the largest value
  best <- 0
  for (v in x) if (v > best) best <- v
  best
}
```

:::solution
```r
mean.abs.dev(c(1, 2, 6))
## [1] 0
my.max(c(-3, -7, -1))
## [1] 0
```

`mean.abs.dev`: for $1,2,6$ the mean is 3 and the distances are $2,1,3$, so the answer should be 2. The trace adds
$-2$, $-1$, $+3$: the deviations without the distance, which always sum to 0. The missing piece is `abs()`.
`my.max`: for $-3,-7,-1$ no value beats the starting 0, so 0 comes back, a value not even in the vector. Start from
the first value.

```r
mean.abs.dev <- function(x) {
  m <- mean(x)
  s <- 0
  for (i in seq_along(x)) s <- s + abs(x[i] - m)
  s / length(x)
}
my.max <- function(x) {
  best <- x[1]
  for (v in x[-1]) if (v > best) best <- v
  best
}
mean.abs.dev(c(1, 2, 6))
## [1] 2
my.max(c(-3, -7, -1))
## [1] -1
mean(abs(c(1, 2, 6) - mean(c(1, 2, 6))))   # the one-line version
## [1] 2
```
:::
::::

:::note[Pattern at work]
Step 1 gives the answers to aim for (2 and −1), step 2 shows where the trace leaves them, step 3 fixes the line and
tests a negative-only vector, the edge case behind the second bug.
:::

::::exercise[One pass of bubble sort]
Give `x` after this code. Is it sorted? How many passes would sort it, and how would you finish the job?

```r
x <- c(9, 4, 6, 1, 7)
for (i in 1:(length(x) - 1)) {
  if (x[i] > x[i + 1]) {
    temp <- x[i]
    x[i] <- x[i + 1]
    x[i + 1] <- temp
  }
}
```

:::solution
Comparisons from left to right:

| $i$ | compare | swap? | `x` after |
|---|---|---|---|
| 1 | 9, 4 | yes | 4 9 6 1 7 |
| 2 | 9, 6 | yes | 4 6 9 1 7 |
| 3 | 9, 1 | yes | 4 6 1 9 7 |
| 4 | 9, 7 | yes | 4 6 1 7 9 |

```r
x
## [1] 4 6 1 7 9
```

The 9 was carried to the end, but $6>1$, so the vector is not sorted. Each pass puts the next largest value in
place, so at most $n-1=4$ passes are needed; here the 1 moves one place left per pass, so it takes three. Repeat
the pass until one makes no swap:

```r
bubble.sort <- function(x) {
  n <- length(x)
  if (n < 2) return(x)
  repeat {
    swapped <- FALSE
    for (i in 1:(n - 1)) {
      if (x[i] > x[i + 1]) {
        temp <- x[i]; x[i] <- x[i + 1]; x[i + 1] <- temp
        swapped <- TRUE
      }
    }
    if (!swapped) break
  }
  x
}
bubble.sort(c(9, 4, 6, 1, 7))
## [1] 1 4 6 7 9
bubble.sort(5)
## [1] 5
```
:::
::::

:::note[Pattern at work]
Step 4, one row per comparison. The `temp` variable is the swap trap avoided, and the `n < 2` guard is the edge case
of step 3: without it, `1:(n - 1)` is `1:0` for one value.
:::

::::exercise[Without the loops]
Rewrite each loop as vector code, and say why the vector version is preferred.

```r
x <- c(-2, 0.5, 3, -1, 4)
y <- numeric(length(x))
for (i in seq_along(x)) y[i] <- 2 * x[i]^3 - x[i] + 4
z <- numeric(length(x))
for (i in seq_along(x)) if (x[i] > 0) z[i] <- sqrt(x[i]) else z[i] <- 0
s <- numeric(length(x))
s[1] <- x[1]
for (i in 2:length(x)) s[i] <- s[i - 1] + x[i]
```

:::solution
```r
y; z; s
## [1] -10.00   3.75  55.00   3.00 128.00
## [1] 0.0000000 0.7071068 1.7320508 0.0000000 2.0000000
## [1] -2.0 -1.5  1.5  0.5  4.5
y2 <- 2 * x^3 - x + 4                    # arithmetic is element by element
z2 <- ifelse(x > 0, sqrt(abs(x)), 0)     # abs() only avoids a warning from sqrt() of negatives
s2 <- cumsum(x)                          # a running total
identical(y, y2); identical(z, z2); identical(s, s2)
## [1] TRUE
## [1] TRUE
## [1] TRUE
```

The vector version is one line instead of three, says what is computed rather than how, needs no storage vector and
index, and runs the loop in compiled code inside R instead of interpreting each pass, so it is usually much faster.
:::
::::

:::note[Pattern at work]
Step 5 three times: `x[i]` becomes `x`, an `if` on one element becomes `ifelse()`, and the running total becomes
`cumsum()`. Type 9 measures the speed difference with `system.time()`.
:::
