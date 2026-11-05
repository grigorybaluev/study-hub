---
title: Efficient code
order: 3
asks: a loop rewritten as one vector expression, why growing a vector is slow, counting operations, reading system.time()
units: [programming-practice]
---

## Logic

R runs vector operations in compiled code, so one vector expression beats a loop over the elements, and a loop
that grows its result copies everything on every pass. A better algorithm beats both. Before any of this, the
code must be correct and the slow part must be measured: about 90 % of the time sits in about 10 % of the code.

## Pattern

:::steps[Making it faster, in order of payoff]
1. Correct first, and keep a slow version to compare with: `identical(fast(x), slow(x))`.
2. Measure: `system.time(expr)` for one expression, `Rprof()` to find the bottleneck in a whole program.
3. Choose a better algorithm: Horner's rule, binary search, merge sort.
4. Vectorise: replace the loop by vector arithmetic, logical indexing or `sum`, `cumsum`, `pmax`, `ifelse`, `rowSums`.
5. If a loop stays, pre-allocate: `res <- numeric(n)`, never `res <- c(res, new)`.
6. Last resort: move the remaining bottleneck to compiled code.
:::

## Traps

:::caution[Traps]
- `max(a, b)` is one number; `pmax(a, b)` compares element by element. The same goes for `min` and `pmin`.
- `if (x > 0)` tests one value; `ifelse(x > 0, a, b)` handles a whole vector.
- `system.time()` reports user, system and elapsed time. Elapsed is the wall clock; the ratio between two versions is what matters, not the numbers.
- Optimised code hides errors: test it again after every change.
- Sorting first pays off only when many searches follow.
:::

## Worked problems

::::exercise[Replace the loops]
Rewrite each without a loop, and state what it prints.

```r
total <- 0
for (k in 1:30) if (k %% 3 == 0) total <- total + k^2
total

x <- c(4, -2, 7, 0, -5)
y <- numeric(5)
for (i in 1:5) if (x[i] < 0) y[i] <- 0 else y[i] <- x[i]
y

best <- numeric(5)
best[1] <- x[1]
for (i in 2:5) best[i] <- max(best[i - 1], x[i])
best
```

:::solution
```text
[1] 3465
[1] 4 0 7 0 0
[1] 4 4 7 7 7
```

```r
k <- 1:30
sum(k[k %% 3 == 0]^2)            # keep the multiples of 3, then square and add
## [1] 3465
pmax(x, 0)                       # or ifelse(x < 0, 0, x)
## [1] 4 0 7 0 0
cummax(x)                        # the running maximum
## [1] 4 4 7 7 7
```
:::
::::

:::note[Pattern at work]
Step 4, three ways: logical indexing and `sum`, an element-wise `pmax`, and a cumulative function. Each answer
is shorter and clearer as well as faster, which is the usual outcome.
:::

::::exercise[Counting operations]
(a) Evaluate $2x^3-5x+4$ at $x=3$ by Horner's rule, step by step, from the coefficients `c(4, -5, 0, 2)`. How
many multiplications does it use, and how many does the term-by-term sum use if each power is computed as
repeated multiplication? (b) What is the greatest number of comparisons a binary search needs in a sorted list
of 5000 names? (c) A program makes 5000 look-ups in that list. Compare the scan and the binary search,
roughly.

:::solution
(a) Nest it: $4+x(-5+x(0+2x))$. Start from the last coefficient: $2$, then $2\cdot3+0=6$, then $6\cdot3-5=13$,
then $13\cdot3+4=43$. That is 3 multiplications, one per step. Term by term, $x^3$ takes 2 and the factor 2
takes 1, then $-5x$ takes 1: 4 here, and the gap grows quickly with the degree.

```r
horner <- function(x, coef) {
  total <- coef[length(coef)]
  for (p in (length(coef) - 1):1) total <- total * x + coef[p]
  total
}
horner(3, c(4, -5, 0, 2))
## [1] 43
2 * 3^3 - 5 * 3 + 4
## [1] 43
ceiling(log2(5000 + 1))          # the most a binary search can need
## [1] 13
```

(b) At most $\lceil\log_2(5000+1)\rceil=13$ comparisons, because each one halves what is left.

(c) A scan needs about 2500 comparisons per look-up on average, so about $12.5$ million; the binary search at
most $5000\times13=65\,000$, plus the cost of sorting once.
:::
::::

:::note[Pattern at work]
Step 3: a better algorithm changes the count itself, which no tuning can do. The check against the direct
formula is step 1.
:::

::::exercise[Reading a timing]
The same computation is timed in three versions. Name the three techniques, explain the order, and say which
number to compare.

```r
n <- 30000
a <- runif(n)
system.time({ s1 <- c(); for (k in 1:n) s1 <- c(s1, a[k] * 2) })
##    user  system elapsed
##   2.062   1.429   3.524
system.time({ s2 <- numeric(n); for (k in 1:n) s2[k] <- a[k] * 2 })
##    user  system elapsed
##   0.005   0.000   0.005
system.time(s3 <- a * 2)
##    user  system elapsed
##       0       0       0
identical(s1, s3) && identical(s2, s3)
## [1] TRUE
```

:::solution
The first version grows the vector: every `c(s1, new)` copies the whole result, so the work grows like $n^2$.
The second pre-allocates, so each pass writes one value. The third is vectorised: the loop runs in compiled code.
Compare `elapsed`, the wall-clock time, and read the ratios, since the numbers themselves change with the
machine. The last line is the check that all three agree.
:::
::::

:::note[Pattern at work]
Steps 2, 4 and 5 in one table. The biggest single gain is to stop growing the vector.
:::
