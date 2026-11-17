---
title: A sequence by a loop
order: 3
asks: a function returning the first n terms of a recursive sequence, a default argument, a while loop that counts steps, what happens when the loop never stops
units: [flow-control-functions]
---

## Logic

A recursive sequence gives each term from the one before, so it is a loop: **`for`** when the number of terms is
known ("the first $n$ terms"), **`while`** when the loop runs until something happens ("until it reaches 1"). The
function pre-allocates the result, sets the first term, and fills term $i$ from term $i-1$. A `while` loop stops
only if its condition eventually becomes `FALSE`; if the sequence can never make it false, the loop runs forever.

## Pattern

:::steps[A recursive sequence in R]
1. Write the first few terms by hand: they are the test of the code.
2. `for` and the first $n$ terms: `a <- numeric(n)`, `a[1] <- a1`, then `for (i in seq_len(n)[-1])` (or `2:n` guarded by `if (n > 1)`), with the rule written on `a[i - 1]`.
3. A case rule ("if even … otherwise …") is `if (a %% 2 == 0) … else …`: `%%` is the remainder.
4. A default argument goes in the header: `function(n, a1 = 2)`; the caller may leave it out.
5. `while` and counting: the current value in one variable, a counter set to 0 before the loop and increased once per step, the condition saying when to **continue**.
6. Ask whether the condition can stay `TRUE` forever, and add a cap (`count < max.iter`) when it can.
:::

## Traps

:::caution[Traps]
- `for (i in 2:n)` with `n = 1` runs for `i = 2` and then `i = 1`: `2:1` counts down. Guard it, or use `seq_len(n)[-1]`.
- `c(a, new)` inside the loop works but copies the vector each time; pre-allocate with `numeric(n)`.
- A `while` condition says when to **go on**: "until $a = 1$" is `while (a != 1)`.
- Count the steps, not the terms: the counter goes up once for each new value.
- `%%` is the remainder (`7 %% 2` is 1), `%/%` the whole-number quotient (`7 %/% 2` is 3).
- A condition that can never become `FALSE` is an infinite loop, and R gives no warning; it just runs.
:::

## Worked problems

::::exercise[Divide by three or add four]
A sequence starts at $a_1=5$ and follows

$$
a_{n+1}=\begin{cases}a_n/3, & \text{if } a_n \text{ is divisible by } 3,\\ a_n+4, & \text{otherwise.}\end{cases}
$$

From 5 it runs 5, 9, 3, 1, 5, 9, 3, 1, …. (a) Write `next.seq(n)` returning the first $n$ terms. (b) Add the
argument `a1` with default 5. (c) With a `while` loop, count the steps the sequence starting at 7 needs to reach 1.
(d) What happens with the start 4? And what if the loop of (c) were written `while (a != 0)`?

:::solution
```r
next.seq <- function(n, a1 = 5) {         # (a) and (b) together: a1 defaults to 5
  a <- numeric(n)
  a[1] <- a1
  for (i in seq_len(n)[-1]) {              # nothing at all when n is 1
    if (a[i - 1] %% 3 == 0) {
      a[i] <- a[i - 1] / 3
    } else {
      a[i] <- a[i - 1] + 4
    }
  }
  a
}
next.seq(8)
## [1] 5 9 3 1 5 9 3 1
next.seq(6, a1 = 7)
## [1]  7 11 15  5  9  3
next.seq(1)
## [1] 5

a <- 7                                     # (c)
count <- 0
while (a != 1) {
  a <- if (a %% 3 == 0) a / 3 else a + 4
  count <- count + 1
}
count
## [1] 6
```

(c) By hand: 7, 11, 15, 5, 9, 3, 1, so six steps. (d) From 4 the sequence is 4, 8, 12, 4, 8, 12, …: it cycles
without ever reaching 1, so `while (a != 1)` never stops. With `while (a != 0)` no start ever stops: dividing a
positive number by 3 or adding 4 keeps it positive, so $a$ is never 0. A safe loop caps the steps:

```r
a <- 4
count <- 0
while (a != 1 && count < 100) {
  a <- if (a %% 3 == 0) a / 3 else a + 4
  count <- count + 1
}
c(a = a, count = count)                    # stopped by the cap, not by reaching 1
##     a count 
##     8   100 
```
:::
::::

:::note[Pattern at work]
Step 1 gives the test values, step 2 the `for` loop over a pre-allocated vector, step 3 the case rule with `%%`.
Steps 5 and 6 are (c) and (d): the condition says when to go on, and a sequence that cycles without the stopping
value needs a cap. In the capped loop `&&` is right, because both sides are single values.
:::

::::exercise[The first year above a target]
Savings start at 1000 and grow by 6 % a year, plus a deposit of 200 at the end of each year. Write a loop that finds
the first year in which the savings exceed 3000, and return the year with the amount.

:::solution
```r
first.year <- function(start = 1000, rate = 0.06, deposit = 200, target = 3000) {
  amount <- start
  year <- 0
  while (amount <= target) {             # go on while the target is not yet exceeded
    amount <- amount * (1 + rate) + deposit
    year <- year + 1
  }
  c(year = year, amount = round(amount, 2))
}
first.year()
##   year amount 
##    7.0 3182.4 
first.year(target = 900)                 # already above: the loop body never runs
##   year amount 
##      0   1000 
```

By hand, year 1 gives $1000\cdot1.06+200=1260$ and year 2 gives $1260\cdot1.06+200=1535.6$, so the loop is checked
on the first two steps before trusting the answer.
:::
::::

:::note[Pattern at work]
Step 5 with "exceed" turned around: the loop goes on while the amount is **at most** the target. Step 1 checks the
first two years by hand, and the second call shows a `while` loop that runs zero times.
:::

::::exercise[How many times does it run?]
Say how many times each loop body runs, then check.

```r
n <- 0; for (i in 1:0) n <- n + 1; n
n <- 0; for (i in seq_len(0)) n <- n + 1; n
n <- 0; for (i in seq(1, 10, by = 3)) n <- n + 1; n
n <- 0; i <- 10; while (i > 1) { i <- i / 2; n <- n + 1 }; n
```

:::solution
```r
n <- 0; for (i in 1:0) n <- n + 1; n
## [1] 2
n <- 0; for (i in seq_len(0)) n <- n + 1; n
## [1] 0
n <- 0; for (i in seq(1, 10, by = 3)) n <- n + 1; n
## [1] 4
n <- 0; i <- 10; while (i > 1) { i <- i / 2; n <- n + 1 }; n
## [1] 4
```

`1:0` is the two values 1 and 0, so twice. `seq_len(0)` is empty, so never. `seq(1, 10, by = 3)` is 1, 4, 7, 10:
four times. Halving 10 gives 5, 2.5, 1.25, 0.625, and the loop stops once `i` is no longer above 1: four times.
:::
::::

:::note[Pattern at work]
The first trap and step 5: write out the values the loop runs over, or the values the condition sees, before
counting.
:::
