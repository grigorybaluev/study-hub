---
title: Newton's method by hand and in R
order: 4
asks: the derivative and the first iterations by hand, a newton() function with a while loop and a tolerance, what the tolerance does, when the method fails
units: [flow-control-functions]
---

## Logic

Newton's method replaces the curve by its tangent at the current guess and moves to where the tangent crosses zero:

$$
x_{n+1}=x_n-\frac{f(x_n)}{f'(x_n)}.
$$

Near a simple root each step roughly doubles the number of correct digits. The loop stops when two consecutive
guesses are closer than a **tolerance**: $|x_{n+1}-x_n|<\text{tol}$. A smaller tolerance asks for more digits and
costs a few more steps. The method can fail: where $f'(x_n)=0$ the tangent is flat, and from a poor start it can
jump away or cycle, so a cap on the steps keeps the loop finite.

## Pattern

:::steps[Newton's method]
1. Differentiate: write $f'(x)$ next to $f(x)$, and the update with both filled in.
2. By hand: $f(x_0)$, $f'(x_0)$, $x_1$; then the same from $x_1$. Keep fractions or 5–6 digits.
3. In R: `f` and `df` as functions, then a loop that computes the next guess, compares it with the current one, and moves on.
4. `while (abs(x.new - x) >= tol)`: the condition says when to go **on**, the opposite of the stopping rule.
5. Add a step counter and a cap, and `stop()` when the derivative is 0.
6. Check: `f(root)` should be about 0.
:::

## Traps

:::caution[Traps]
- The update is a **minus**, and $f$ is on top: $x-f/f'$, not $x-f'/f$.
- The loop needs a first difference to test, so compute one step before `while`, or start with `x.new <- x + 2 * tol`, or use `repeat` with `break`.
- Stopping when $|x_{n+1}-x_n|<\text{tol}$ does not promise that $x_{n+1}$ is within tol of the root, only that the steps have become small (near a simple root the two are close).
- `tol = 1e-6` is $10^{-6}$; `10^-6` also works, but `10e-6` is $10^{-5}$.
- A while loop with no cap runs forever when the iterates cycle.
- A different start can find a different root.
:::

## Worked problems

::::exercise[The square root of 5]
Let $f(x)=x^2-5$. (a) Give $f'(x)$ and Newton's update, and compute $x_1$ and $x_2$ from $x_0=2$. (b) Write
`newton(f, df, x0, tol)` with a `while` loop, stopping when $|x_{n+1}-x_n|<\text{tol}$ and returning the last
approximation. (c) How many steps do `tol = 1e-3` and `tol = 1e-6` take from 2?

:::solution
(a) $f'(x)=2x$, so $x_{n+1}=x_n-\dfrac{x_n^2-5}{2x_n}$.

$$
x_1=2-\frac{4-5}{4}=2.25,\qquad
x_2=2.25-\frac{5.0625-5}{4.5}=2.25-0.013889=2.236111.
$$

The root is $\sqrt5=2.236068$, so $x_2$ already has four correct decimals.

```r
newton <- function(f, df, x0, tol) {       # (b)
  x <- x0
  x.new <- x - f(x) / df(x)                # one step before the first test
  while (abs(x.new - x) >= tol) {          # go on while the step is not yet small
    x <- x.new
    x.new <- x - f(x) / df(x)
  }
  x.new
}
f <- function(x) x^2 - 5
df <- function(x) 2 * x
newton(f, df, 2, 1e-6)
## [1] 2.236068
print(newton(f, df, 2, 1e-6), digits = 10)
## [1] 2.236067977
sqrt(5)
## [1] 2.236068
```

(c) A version that also counts:

```r
newton.count <- function(f, df, x0, tol, max.iter = 100) {
  x <- x0
  for (k in 1:max.iter) {
    d <- df(x)
    if (d == 0) stop("zero derivative at x = ", x)
    x.new <- x - f(x) / d
    if (abs(x.new - x) < tol) return(list(root = x.new, steps = k))
    x <- x.new
  }
  warning("no convergence in ", max.iter, " steps")
  list(root = x.new, steps = max.iter)
}
newton.count(f, df, 2, 1e-3)$steps
## [1] 3
newton.count(f, df, 2, 1e-6)$steps
## [1] 4
```

A thousand times smaller tolerance costs one more step here, because each step near the root squares the error.
:::
::::

:::note[Pattern at work]
Steps 1 and 2 by hand, then step 3 with the one step before `while` (the second trap), and step 4 turning
"stop when the step is small" into "go on while it is not". Step 5 is the counting version.
:::

::::exercise[Two roots, two starts]
$g(x)=e^x-3x$ has two roots. Run Newton's method from $x_0=0$ and from $x_0=2$, and check each answer.

:::solution
$g'(x)=e^x-3$.

```r
g <- function(x) exp(x) - 3 * x
dg <- function(x) exp(x) - 3
r1 <- newton(g, dg, 0, 1e-8)
r2 <- newton(g, dg, 2, 1e-8)
c(r1, r2)
## [1] 0.6190613 1.5121346
g(c(r1, r2))                       # both about 0
## [1] -2.220446e-16 -8.881784e-16
```

By hand from 0: $g(0)=1$, $g'(0)=-2$, so $x_1=0-\frac{1}{-2}=0.5$. The tangent at each start points toward the root
on its own side, and the two starts find different roots.
:::
::::

:::note[Pattern at work]
Step 6, checking `g(root)`, and the last trap: the start chooses the root.
:::

::::exercise[When Newton fails]
(a) What happens with $f(x)=x^2-5$ from $x_0=0$? (b) With $h(x)=x^3-2x+2$ from $x_0=0$, compute $x_1$ and $x_2$ by
hand. What does the plain `newton()` do?

:::solution
(a) $f'(0)=0$: the tangent is flat and never crosses zero. In R, $x_1=0-(-5)/0$ is `Inf` and $x_2$ is
`Inf/Inf`, which is `NaN`; the plain `newton()` then stops with "missing value where TRUE/FALSE needed", because
`abs(NaN - Inf) >= tol` is `NA`. The counting version stops at once with its own message:

```r
newton.count(f, df, 0, 1e-6)
## Error: zero derivative at x = 0
```

(b) $h'(x)=3x^2-2$. From 0: $x_1=0-\frac{2}{-2}=1$. From 1: $h(1)=1$, $h'(1)=1$, $x_2=1-1=0$. The iterates
cycle 0, 1, 0, 1, … and the step stays 1, so the plain `newton()` never stops. The capped version gives up:

```r
h <- function(x) x^3 - 2 * x + 2
dh <- function(x) 3 * x^2 - 2
res <- newton.count(h, dh, 0, 1e-6, max.iter = 20)
## Warning message: no convergence in 20 steps
res$steps
## [1] 20
```
:::
::::

:::note[Pattern at work]
Step 5 earns its place: the zero-derivative check turns (a) into a clear error, and the cap turns the cycle of (b)
into a warning instead of a loop that never ends.
:::
