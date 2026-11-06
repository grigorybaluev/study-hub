---
title: Designing, testing and debugging
order: 2
asks: the four steps of writing a program, a top-down outline, finding a bug by hand, edge cases, which debugging tool
units: [programming-practice]
---

## Logic

A program is written in four moves: understand the problem on a specific case, find a general idea, translate
it into code, check it. Large problems are cut top-down, into a few steps that each get cut again. A bug is
fixed in five moves, and most of the work is making it happen on demand. Most bugs sit at the edges of the
legal input: empty, length one, ties, zero.

## Pattern

:::steps[Finding a bug in a short function]
1. Choose an input small enough to do by hand, and write the answer you expect.
2. Trace the code on it: one column per variable, one row per pass.
3. The first row that differs from your expectation holds the bug. Fix the cause, not the symptom.
4. Test the input that failed, then the edge cases: `numeric(0)`, length 1, equal values, 0.
5. Look for the same mistake elsewhere; add `stopifnot()` for what the function assumes.
:::

:::steps[Which tool for which bug]
1. An error deep in nested calls: `traceback()` right after it shows the calls, innermost first.
2. No error, but a wrong value: print inside with `cat()` or `print()`, or stop inside with `browser()`.
3. Every call of one function: `debug(f)`, until `undebug(f)`. At the `Browse>` prompt, `n` runs the next line, `c` continues, `Q` quits.
4. A wrong result that comes and goes: `set.seed()` at the start, a fresh session, the smallest input that still fails.
5. Bad input arriving silently: `stopifnot(...)` on entry turns it into an immediate error.
:::

## Traps

:::caution[Traps]
- `1:length(x)` on an empty `x` is `1:0`, which runs twice, with the values 1 and 0. Use `seq_along(x)`.
- `length(x):2` counts **down** when the length is below 2, so a loop meant to be skipped still runs.
- `x[i:(i + k)]` holds $k+1$ values, not $k$: an off-by-one in a window or a slice.
- Reading past the end of a vector gives `NA`, not an error, and `NA` then spreads silently.
- `0 / 0` is `NaN`, again with no error. Equal values or an empty vector usually cause it.
- `traceback()` says **where** an error happened, not **why**.
:::

## Worked problems

::::exercise[A window that is one too wide]
`moving.sum(x, k)` should return the sums of every $k$ consecutive values of `x`. Find what it prints, name the
bug, fix it, and say what input is still unsafe.

```r
moving.sum <- function(x, k) {
  out <- numeric(length(x) - k + 1)
  for (i in 1:length(out)) out[i] <- sum(x[i:(i + k)])
  out
}
moving.sum(1:5, 2)
```

:::solution
```text
[1]  6  9 12 NA
```

By hand, the answer should be `3 5 7 9`. The first pass already differs: `x[1:3]` holds three values, not two.
The window has $k+1$ values, and the last pass reads `x[6]`, which is `NA`. The cause is the end of the window.

```r
moving.sum <- function(x, k) {
  stopifnot(k >= 1, k <= length(x))     # the input the function assumes
  out <- numeric(length(x) - k + 1)
  for (i in seq_along(out)) out[i] <- sum(x[i:(i + k - 1)])
  out
}
moving.sum(1:5, 2)
## [1] 3 5 7 9
moving.sum(1:5, 5)                      # the largest legal window
## [1] 15
moving.sum(7, 1)                        # length one
## [1] 7
```

Unsafe before the check: $k$ larger than the length. With `k = 6` on `1:5`, `out` has length 0, so
`1:length(out)` is `1:0` and the loop still runs. The `stopifnot()` line and `seq_along()` close both doors.
:::
::::

:::note[Pattern at work]
Steps 1 to 3 found the bug on the first pass of the trace, and the `NA` was only a symptom of it. Step 4 tests
the edges: the largest window, and a vector of length one. Step 5 adds the assumption to the function.
:::

::::exercise[Top-down: the longest run]
Write an outline, then a function `longest.run(x)` for the length of the longest run of ones in a 0/1 vector.
Say which inputs you test it on. Then estimate the mean longest run of heads in 20 fair coin flips.

:::solution
Understand: for `1 1 0 1 1 1 0` the answer is 3. The outline, kept as comments:

```r
longest.run <- function(x) {
  # 1. walk along x, keeping the length of the current run
  # 2. remember the largest length seen so far
  best <- 0
  current <- 0
  for (v in x) {
    current <- if (v == 1) current + 1 else 0     # step 1
    best <- max(best, current)                    # step 2
  }
  best
}
longest.run(c(1, 1, 0, 1, 1, 1, 0))
## [1] 3
longest.run(numeric(0))            # edge: empty
## [1] 0
longest.run(c(0, 0))               # edge: no ones
## [1] 0
longest.run(c(1, 1, 1))            # edge: the run reaches the end
## [1] 3
set.seed(52)
mean(replicate(10000, longest.run(sample(0:1, 20, replace = TRUE))))
## [1] 3.7104
```

`for (v in x)` over an empty vector does not run at all, so the empty case needs no special code.
:::
::::

:::note[Pattern at work]
The four steps of writing a program: a specific case by hand, the idea (a running count), the translation, the
check. The check uses the edges (empty, none, run at the end). The function then becomes one repetition for
`replicate()`, as in type 1.
:::

::::exercise[Which tool?]
Name the tool or the first move for each case. (a) `report(d)` stops with an error from a function you
did not write. (b) A function returns a plausible number that is wrong, with no error. (c) A simulation gives
a wrong answer once in about fifty runs. (d) A function quietly returns `NaN` when all its inputs are equal.

:::solution
(a) `traceback()` straight after the error, to see which of your calls led there. (b) `browser()` inside the
function, or `cat()` of the intermediate values, or a trace by hand against an input you can check. (c) Make it
reproducible: `set.seed()` in a loop over seeds until the failure appears, then keep that seed. (d) Decide what
the function assumes, and put it on entry: `stopifnot(max(x) > min(x))`.
:::
::::

:::note[Pattern at work]
The second list of steps, in order. The tool follows from the symptom: an error message, a wrong value, a bug
that comes and goes, a silent failure.
:::
