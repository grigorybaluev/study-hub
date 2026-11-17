---
title: What a function sees and returns
order: 5
asks: the values of variables after a call, default arguments, a global variable read inside a function, a function returning a named list
units: [flow-control-functions]
---

## Logic

A call runs the body in a fresh **local environment** holding the arguments. An assignment inside the body (`x <-`)
creates or changes a **local** variable and never touches a global variable of the same name. A name the body
reads but has not assigned locally is looked up where the function was **defined** (lexical scoping), usually the
global environment, and at the moment of the call. A function returns one object, the value of `return()` or of the
last expression; several results go back as a **named list**.

## Pattern

:::steps[Predicting the values after some calls]
1. Go through the calls in order, keeping a small table of the global variables.
2. For each call, match the arguments: by name first, then by position; a missing argument takes its default.
3. Run the body with its own table of local variables. A name not in it is read from the global table **now**.
4. The result is the last value (or `return()`); assign it as the code says. The global table changes only through assignments at the top level.
5. For "return several things": `list(name1 = ..., name2 = ...)`, read with `res$name1` or `res[["name1"]]`.
:::

## Traps

:::caution[Traps]
- `x <- ...` inside a function makes a local `x`; the global `x` is unchanged after the call.
- `x <- x + n` inside a function reads the **global** `x` on the right (no local one exists yet), then creates a local one.
- A free variable is read at call time: change the global after defining the function and the next call sees the new value.
- Lexical, not dynamic: a function defined at the top level does not see the local variables of the function that calls it.
- A missing argument with no default is an error only when the body uses it.
- `return(a, b)` is an error; return `list(a = a, b = b)` or `c(a = a, b = b)` (the latter only for values of one type).
- `<<-` assigns in the enclosing environment, which for a top-level function is the global one. Avoid it.
:::

## Worked problems

::::exercise[Local, default, global]
Give the values of `p`, `q` and `k` after this code, and explain.

```r
k <- 4
h <- function(m, k = 1) {
  k <- m * k
  k + 1
}
p <- h(5)
q <- h(5, 3)
```

:::solution
In `h(5)` the default `k = 1` is used: the local `k` becomes $5\cdot1=5$ and the result is 6. In `h(5, 3)` the
local `k` is $5\cdot3=15$ and the result 16. Both assignments to `k` are local to the call, so the global `k` is
still 4.

```r
p
## [1] 6
q
## [1] 16
k
## [1] 4
```
:::
::::

:::note[Pattern at work]
Step 2 for the default, step 3 for the local `k`, step 4 for the unchanged global table.
:::

::::exercise[A free variable]
Give `r1`, `r2`, `r3` and `amt`, and explain how R finds `rate`.

```r
rate <- 0.1
grow <- function(x) {
  x <- x * (1 + rate)
  x
}
amt <- 100
r1 <- grow(amt)
rate <- 0.2
r2 <- grow(amt)
wrapper <- function() {
  rate <- 0.5
  grow(100)
}
r3 <- wrapper()
```

:::solution
`rate` is not assigned inside `grow`, so it is looked up where `grow` was defined, the global environment, at the
time of the call. `r1` uses 0.1 and gives 110; after `rate <- 0.2`, `r2` gives 120. `wrapper()` has a local
`rate` of 0.5, but `grow` was not defined inside `wrapper`, so it does not see it: `r3` is also 120. `amt` is
still 100, because the `x <-` inside `grow` changes only the local copy.

```r
c(r1 = r1, r2 = r2, r3 = r3, amt = amt)
##  r1  r2  r3 amt 
## 110 120 120 100 
```
:::
::::

:::note[Pattern at work]
Step 3: a name not in the local table is read from where the function was defined, at the moment of the call.
That gives the change between `r1` and `r2` and no change for `r3`.
:::

::::exercise[Several results in a list]
Write `describe(v, cut = 10)` that returns a list with `n` (the number of values), `mean`, `above` (the values
strictly greater than `cut`) and `share` (the proportion of values above `cut`). Call it with and without `cut`.

:::solution
```r
describe <- function(v, cut = 10) {
  above <- v[v > cut]
  list(n = length(v), mean = mean(v), above = above, share = length(above) / length(v))
}
v <- c(4, 12, 9, 15, 10, 21)
res <- describe(v)
res$above
## [1] 12 15 21
res[["share"]]
## [1] 0.5
str(describe(v, cut = 14))
## List of 4
##  $ n    : int 6
##  $ mean : num 11.8
##  $ above: num [1:2] 15 21
##  $ share: num 0.333
```

`v > cut` is a logical vector; `v[v > cut]` keeps the values, and `mean(v > cut)` would give the share directly.
`10` itself is not counted, because "strictly greater" is `>`.
:::
::::

:::note[Pattern at work]
Step 5: four results of different lengths can only go back together as a list. The default `cut = 10` is step 2.
:::
