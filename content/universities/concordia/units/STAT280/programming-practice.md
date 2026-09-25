---
title: "Programming practice: replication, debugging and efficiency"
order: 7
status: detailed
weeks: [6, 7]
introduces: []
requires:
  - {concept: iteration, strength: hard}
  - {concept: function-definition, strength: hard}
reinforces:
  - {concept: iteration, perspective: "replicate() instead of loops"}
  - {concept: function-definition, perspective: "guidelines, debugging, efficiency"}
  - {concept: sorting-algorithms, perspective: "bubble sort and merge sort written in R"}
  - {concept: recursion, perspective: "merge sort calling itself on each half"}
  - {concept: algorithm-analysis, perspective: "timing R code and choosing faster algorithms"}
---

Repeating computations with replicate(), programming guidelines, debugging and
maintaining code, and writing efficient R.

## Repeating a computation: replicate()

Simulation means doing the same random experiment many times and looking at the pattern of
results. `replicate(n, expr)` evaluates the expression `expr` **n times** (a fresh evaluation each
time, so random numbers differ) and collects the results:

- if each evaluation returns one number, the result is a vector of length `n`;
- if each returns a vector of length $k$, the result is a $k \times n$ matrix, one column per
  repetition.

:::example[Rolling two dice]
Write one experiment as a function with no arguments, then replicate it. The proportion of sums
equal to 7 estimates the probability $6/36 \approx 0.167$.
:::

```r
set.seed(280)
roll.two <- function() sum(sample(1:6, size = 2, replace = TRUE))
roll.two()
## [1] 8
replicate(10, roll.two())          # ten independent calls
##  [1] 4 5 8 7 7 7 4 4 4 5
sums <- replicate(10000, roll.two())
mean(sums == 7)                    # compare with 6/36 = 0.1667
## [1] 0.1735
```

The second call below replicates "the mean of 25 standard normal values" 1000 times: the spread
of those means is close to the theory's $1/\sqrt{25} = 0.2$.

```r
replicate(3, sample(1:6, 2))       # each call returns 2 values: a 2 x 3 matrix
##      [,1] [,2] [,3]
## [1,]    6    4    5
## [2,]    1    6    2
means <- replicate(1000, mean(rnorm(25)))
sd(means)                          # compare with 1/sqrt(25) = 0.2
## [1] 0.2012946
```

The same thing as a `for` loop needs a vector created in advance and an index:

```r
means2 <- numeric(1000)
for (k in 1:1000) means2[k] <- mean(rnorm(25))
sd(means2)
## [1] 0.1943571
```

:::note[replicate() and the apply family]
`replicate()` repeats one expression. Its relative `sapply(x, f)` calls `f` once **for each
element** of `x` and simplifies the results to a vector or matrix. Both hide the loop's
bookkeeping (the index, the storage vector), which removes a common source of bugs.
:::

```r
sapply(1:6, function(n) sum(1:n))           # one call per element of 1:6
## [1]  1  3  6 10 15 21
sapply(c(a = 4, b = 9, c = 16), sqrt)
## a b c 
## 2 3 4 
```

## Programming guidelines

:::steps[Writing a program]
1. **Understand the problem.** Work a specific case by hand, not so small that it is trivial.
2. **Work out a general idea** for solving it.
3. **Translate** the idea into a detailed implementation.
4. **Check**: does it work? Is it good enough? If not, go back to step 2.
:::

:::example[Sorting a vector]
*Understand:* sorting 5, 2, 9, 1, 7 should give 1, 2, 5, 7, 9.

*Idea:* walk along the vector comparing neighbours and swap any pair that is out of order.
One pass does not sort the vector, but it always carries the largest value to the end. So repeat
the pass on all but the last element, then all but the last two, and so on. This is the
**bubble sort**.

*Implement:* the one delicate step is the swap. Assigning `x[k] <- x[k + 1]` first would destroy
the old `x[k]`, so save it in a temporary variable before overwriting it.
:::

```r
bubble <- function(x) {
  # sort x into increasing order by swapping neighbours that are out of order
  for (last in length(x):2) {          # after each pass, x[last] is in its place
    for (k in 1:(last - 1)) {
      if (x[k] > x[k + 1]) {
        tmp <- x[k]                    # keep x[k] before overwriting it
        x[k] <- x[k + 1]
        x[k + 1] <- tmp
      }
    }
  }
  x
}
bubble(c(5, 2, 9, 1, 7))
## [1] 1 2 5 7 9
bubble(c(3, 1))
## [1] 1 3
bubble(4)
## Error: missing value where TRUE/FALSE needed
```

*Check* found a bug: a vector of length 1 stops with an error. Tests on "normal" inputs passed; the
failure is at an **edge case**. The cause is that `length(x):2` counts *down* when the length is
below 2:

```r
length(4):2           # the loop runs with last = 1 and then last = 2
## [1] 1 2
```

The fix does not need a new design, only a special case at the start:

```r
bubble <- function(x) {
  # sort x into increasing order by swapping neighbours that are out of order
  if (length(x) < 2) return(x)         # nothing to sort
  for (last in length(x):2) {
    for (k in 1:(last - 1)) {
      if (x[k] > x[k + 1]) {
        tmp <- x[k]
        x[k] <- x[k + 1]
        x[k + 1] <- tmp
      }
    }
  }
  x
}
bubble(4)
## [1] 4
bubble(numeric(0))
## numeric(0)
bubble(c(2, 2, 1))
## [1] 1 2 2
```

### Top-down design

The key to a large program is to break it into pieces small enough to solve. **Top-down
design** works like outlining an essay:

1. write the whole program as a few (1–5) steps;
2. expand each step into a few smaller steps;
3. continue until every step is a line of code.

Writing the outline as numbered comments and expanding them one at a time keeps the design
visible in the finished code.

:::example[Merge sort, designed top down]
Bubble sort is fine for short vectors but slow for long ones. **Merge sort** is faster:

1. split the vector into two halves;
2. sort each half;
3. merge the two sorted halves by repeatedly taking the smaller of their two front elements.

Step 2 can use merge sort itself: this is **recursion**. While designing, assume the function
you are writing already works; the recursion ends because vectors of length 0 or 1 are returned
as they are. Each call has its own local variables, so the calls do not interfere.
:::

```r
merge.sort <- function(x) {
  # 1. sort x by splitting, sorting the halves, and merging
  n <- length(x)
  if (n < 2) return(x)                     # 1.1 short vectors are already sorted
  half <- n %/% 2
  left  <- merge.sort(x[1:half])           # 1.2 sort each half (recursively)
  right <- merge.sort(x[(half + 1):n])
  result <- numeric(n)                     # 1.3 merge: repeatedly take the smaller front
  i <- 1
  j <- 1
  for (k in 1:n) {
    take.left <- j > length(right) || (i <= length(left) && left[i] <= right[j])
    if (take.left) {
      result[k] <- left[i]
      i <- i + 1
    } else {
      result[k] <- right[j]
      j <- j + 1
    }
  }
  result
}
merge.sort(c(8, 3, 6, 1, 9, 2, 7))
## [1] 1 2 3 6 7 8 9
set.seed(1)
v <- runif(1000)
identical(merge.sort(v), sort(v))        # check against a trusted version
## [1] TRUE
identical(bubble(v), sort(v))
## [1] TRUE
```

Comparing a new function with a trusted one (`sort()`) on a large random input is a strong test.

## Debugging and maintenance

A **bug** is an error in a program; **debugging** is finding and removing it.

:::steps[Five steps for fixing a bug]
1. **Recognise that a bug exists.**
2. **Make it reproducible.**
3. **Identify its cause.**
4. **Fix it, and test.**
5. **Look for similar errors elsewhere.**
:::

### Recognising a bug

A crash is easy to notice; a wrong answer for some inputs is not. Split programs into small
functions with documented inputs and outputs, check inside each function that its inputs are
what it assumes, and test with inputs whose correct output you can see at a glance. Test the
**edge cases**, the inputs on the border between legal and illegal: empty vectors, length one,
ties, zero, very large and very small values. When correctness matters, write a slow version you
are sure of and check the fast one against it.

:::example[A bug with no error message]
`rescale()` maps values linearly onto $[0, 1]$. When all values are equal it divides 0 by 0 and
quietly returns `NaN`, which may surface much later in a program.
:::

```r
rescale <- function(x) (x - min(x)) / (max(x) - min(x))
rescale(c(10, 15, 30))
## [1] 0.00 0.25 1.00
rescale(c(5, 5, 5))            # no error, but a useless answer
## [1] NaN NaN NaN
```

Checking the assumptions on entry turns the silent failure into an immediate, explicit one:

```r
rescale <- function(x) {
  # map x linearly onto [0, 1]; needs at least two different values
  stopifnot(is.numeric(x), length(x) > 0, max(x) > min(x))
  (x - min(x)) / (max(x) - min(x))
}
rescale(c(10, 15, 30))
## [1] 0.00 0.25 1.00
rescale(c(5, 5, 5))
## Error: max(x) > min(x) is not TRUE
```

### Making it reproducible

A bug you can trigger at will can be tracked down; one that appears at random is very hard to
fix. Simplify: start a fresh R session and reduce the input until the bug still appears. A
common cause of "random" wrong answers is a misspelled name that happens to match some other
existing variable. For programs that simulate, `set.seed()` at the start makes every run
identical.

### Finding the cause

**Read the error message.** When an error happens deep inside nested calls, `traceback()`
(typed right after the error) lists the stack of calls that led to it, innermost first:

```r
spread <- function(x) diff(range(x))
rescale <- function(x) (x - min(x)) / spread(x)
summarise.scores <- function(scores) round(100 * rescale(scores))
summarise.scores(c("52", "70"))
## Error in x - min(x) : non-numeric argument to binary operator
traceback()
## 2: rescale(scores)
## 1: summarise.scores(c("52", "70"))
```

`traceback()` shows **where** the error happened, not **why**, and many bugs raise no error at all.
To look inside a running function:

- print intermediate values with `cat("in rescale, x =", x, "\n")` or `print(x)`;
- put `browser()` in the body: execution pauses there, and you can inspect or change local
  variables and run any command. At the `Browse>` prompt, `n` runs the next line, `c` continues
  normally, and `Q` quits;
- `debug(f)` enters the browser at the start of every call of `f`, until `undebug(f)`;
- simulate the function by hand, writing down every variable as it changes. Where R's
  behaviour differs from yours, you have found either the bug or a misunderstanding of R.

### Fixing, and looking for more

Fix the cause without creating a new problem, then test again, including the input that
revealed the bug and the edge cases around it. Finally, look for the same mistake elsewhere:
if you made it once, you may well have made it twice.

:::insight
Most bugs live at the edges: empty input, a single element, equal values. Test those first,
check assumptions with `stopifnot()`, and when something fails, make it reproducible before
trying to fix it.
:::

## Efficient programming

Making a program faster is **optimisation**. It is always a trade-off: optimised code takes time
to write and is often harder to read, and errors hide more easily in it. Get the code correct
first.

### Learn your tools

R works on whole vectors in compiled code, so a vectorised operation is far faster than an R loop
over the elements. Growing a vector inside a loop is worse still, because every `c(s, new)`
copies the whole vector into a new, longer one.

```r
n <- 3e4
a <- rnorm(n)
b <- rnorm(n)
system.time({ s1 <- c(); for (k in 1:n) s1 <- c(s1, a[k] + b[k]) })   # grow
##    user  system elapsed 
##   2.255   1.905   4.375 
system.time({ s2 <- numeric(n); for (k in 1:n) s2[k] <- a[k] + b[k] })  # preallocate
##    user  system elapsed 
##   0.008   0.000   0.009 
system.time(s3 <- a + b)                                                # vectorise
##    user  system elapsed 
##       0       0       0 
identical(s1, s3) && identical(s2, s3)
## [1] TRUE
```

Pre-allocating the result makes the loop hundreds of times faster, and the vectorised
`a + b` is faster again (and the clearest of the three). The exact times depend on the machine;
the ratios are what matter.

### Use efficient algorithms

A better algorithm can matter more than any tuning.

:::example[Evaluating a polynomial: Horner's rule]
Evaluating $c_1 + c_2 x + c_3 x^2 + \dots + c_m x^{m-1}$ term by term computes a power for every
term. Nesting the terms,

$$
c_1 + x\bigl(c_2 + x\bigl(c_3 + \dots + x\,c_m\bigr)\bigr),
$$

needs only one multiplication and one addition per coefficient. Both functions are vectorised
in `x`, so they are timed on two million points.
:::

```r
direct.poly <- function(x, coef) {
  # coef[1] + coef[2] x + ... + coef[m] x^(m-1)
  total <- 0
  for (p in seq_along(coef)) total <- total + coef[p] * x^(p - 1)
  total
}
horner <- function(x, coef) {
  # the same polynomial, nested: c1 + x (c2 + x (c3 + ...))
  total <- coef[length(coef)]
  for (p in (length(coef) - 1):1) total <- total * x + coef[p]
  total
}
coef <- c(2, -1, 0, 3, 5, 1)
direct.poly(2, coef)
## [1] 136
horner(2, coef)
## [1] 136
xs <- seq(-5, 5, length.out = 2e6)
system.time(direct.poly(xs, coef))
##    user  system elapsed 
##   0.259   0.027   0.297 
system.time(horner(xs, coef))
##    user  system elapsed 
##   0.042   0.004   0.049 
```

:::example[Finding a name in a list]
To find one name in an unsorted list, you check names one by one: on average half the list. If
the list is **sorted**, check the middle name, keep the half that must contain the target, and
repeat (the bisection idea again). That takes at most $\lceil \log_2 n \rceil$ comparisons: 17 for a
list of 100 000, against tens of thousands for the scan.
:::

```r
linear.search <- function(sorted, target) {
  comparisons <- 0
  for (k in seq_along(sorted)) {
    comparisons <- comparisons + 1
    if (sorted[k] == target) break
  }
  comparisons
}
binary.search <- function(sorted, target) {
  lo <- 1
  hi <- length(sorted)
  comparisons <- 0
  while (lo <= hi) {
    mid <- (lo + hi) %/% 2
    comparisons <- comparisons + 1
    if (sorted[mid] == target) break
    if (sorted[mid] < target) lo <- mid + 1 else hi <- mid - 1
  }
  comparisons
}
names.sorted <- 1:100000                 # stand-ins for an alphabetical list
linear.search(names.sorted, 73514)
## [1] 73514
binary.search(names.sorted, 73514)
## [1] 17
ceiling(log2(100000))                    # the most binary search can need
## [1] 17
```

For $n$ look-ups the difference is roughly $n^2/2$ against $n \log_2 n$ comparisons, which is the
difference between feasible and infeasible for large $n$. Sorting first costs time once, and it
pays off when many searches follow.

### Measure before optimising

`system.time(expr)` reports how long an expression took: *user* time spent on the task itself,
*system* time spent by the operating system on its behalf, and *elapsed* wall-clock time. Measure
first, because the time a program takes is an upper bound on what optimisation can save.

A rule of thumb says that about 90 % of the running time is spent in about 10 % of the code,
the **bottlenecks**. Speeding those up gives most of the gain without touching the rest. A
**profiler** finds them by recording where the time goes; R's is `Rprof()`.

### Be willing to use other tools

R is not the fastest language for raw loops: C, C++ and Fortran compile to machine code, and
R's own vector operations are fast precisely because they are written in them. A good pattern is
to write everything in R, find the bottlenecks that remain too slow, and move only those to a
compiled language (the **Rcpp** package makes this practical).

:::caution[Optimise with care]
"Premature optimization is the root of all evil" (Donald Knuth). In order: **make it right**,
**make it fast enough**, then **make sure it is still right**.
:::

:::insight
Before optimising, measure. Then, in order of payoff: choose a better algorithm, vectorise,
pre-allocate, and only as a last resort move a bottleneck to compiled code.
:::

## Further reading

- [R documentation: lapply, sapply, replicate](https://stat.ethz.ch/R-manual/R-devel/library/base/html/lapply.html) — the apply family, including `replicate()`.
- [R documentation: browser](https://stat.ethz.ch/R-manual/R-devel/library/base/html/browser.html) — commands available at the `Browse>` prompt.
- [Hadley Wickham, *Advanced R*: Debugging](https://adv-r.hadley.nz/debugging.html) — `traceback()`, `browser()` and RStudio's debugger.
- [Hadley Wickham, *Advanced R*: Improving performance](https://adv-r.hadley.nz/perf-improve.html) — vectorisation, avoiding copies, and profiling.
- [Horner's method (Wikipedia)](https://en.wikipedia.org/wiki/Horner%27s_method) — polynomial evaluation with the fewest operations.
