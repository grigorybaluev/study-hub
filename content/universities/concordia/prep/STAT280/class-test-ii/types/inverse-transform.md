---
title: The inverse transform
order: 7
asks: from a density to F, from F to its inverse, one line of R, and a check against the exact mean
units: [simulating-random-variables]
method: generating-a-random-variable
---

## Logic

If $U$ is uniform on $(0,1)$ and $F$ is a continuous, increasing distribution function, then $X=F^{-1}(U)$ has
distribution function $F$. So a density becomes a generator in three steps of algebra: integrate to get $F$,
solve $u=F(x)$ for $x$, and feed in uniforms. The proof is one line:
$P(F^{-1}(U)\le x)=P(U\le F(x))=F(x)$.

## Pattern

:::steps[Density to generator]
1. Check that $f$ is a density: $f\ge0$ and the total is 1 over the support.
2. Integrate from the left end of the support: $F(x)=\int f$. Check that $F$ reaches 1 at the right end.
3. Set $u=F(x)$ and solve for $x$. Keep the root that lies in the support.
4. Write one line of R: `x <- Finv(runif(n))`.
5. Check: `mean(x)` and `var(x)` against the exact values, or a histogram against $f$.
6. Piecewise $F$: invert each piece on its own range of $u$, and join them with `ifelse()`.
:::

## Traps

:::caution[Traps]
- $F$ is the **integral** of $f$, and it must include the mass to the left of each piece.
- Solving $u=x^2/4$ gives $x=\pm2\sqrt u$: on $(0,2)$ only the plus sign is in the support.
- `log()` in R is the natural logarithm, which is what inverting $e^{-\lambda x}$ needs.
- $-\log(1-U)/\lambda$ and $-\log(U)/\lambda$ are both exponential, since $1-U$ is uniform too. They are not the same numbers from one `u`, but they have the same distribution.
- Inversion needs a closed form for $F^{-1}$. For the normal there is none, so use `rnorm()`, or another method.
- `dexp` and `rexp` take the **rate**, not the mean: a mean of 4 is `rate = 0.25`.
:::

## Worked problems

::::exercise[A rising density]
$f(x)=x/2$ for $0<x<2$. Find $F$, the generator, $E(X)$ and $\operatorname{Var}(X)$. What value does $u=0.25$ give?
Write the R code and check.

:::solution
$F(x)=\int_0^x\frac t2\,dt=\frac{x^2}4$ for $0<x<2$, and $F(2)=1$. Solving $u=\frac{x^2}4$ gives $x=2\sqrt u$ (the
positive root, since $x>0$). So $u=0.25$ gives $x=1$: only a quarter of the mass lies below the midpoint of
$(0,2)$, because the density rises.

$E(X)=\int_0^2\frac{x^2}2\,dx=\frac43$, $E(X^2)=\int_0^2\frac{x^3}2\,dx=2$, so
$\operatorname{Var}(X)=2-\frac{16}9=\frac29$.

```r
set.seed(108)
x <- 2 * sqrt(runif(100000))
c(mean = mean(x), var = var(x))         # exact: 4/3 and 2/9 = 0.2222
##      mean       var
## 1.3323213 0.2232318
mean(x <= 1)                            # exact: F(1) = 1/4
## [1] 0.25103
```
:::
::::

:::note[Pattern at work]
Steps 1 to 5. The root is chosen by the support in step 3, and $F(1)=\frac14$ is a third check for free.
:::

::::exercise[A long tail]
$f(x)=3x^{-4}$ for $x\ge1$. Find $F$, the generator, the median, $E(X)$ and $P(X>2)$, and check them.

:::solution
$F(x)=\int_1^x3t^{-4}\,dt=1-x^{-3}$ for $x\ge1$. Solving $u=1-x^{-3}$ gives $x=(1-u)^{-1/3}$. The median is at
$u=\frac12$: $2^{1/3}\approx1.26$. $E(X)=\int_1^\infty3x^{-3}\,dx=\frac32$, and
$P(X>2)=1-F(2)=2^{-3}=\frac18$.

```r
set.seed(119)
u <- runif(100000)
x <- (1 - u)^(-1/3)
c(mean = mean(x), median = median(x), tail = mean(x > 2))
##     mean   median     tail
## 1.499230 1.259992 0.123110
c(1.5, 2^(1/3), 1/8)                    # the exact values
## [1] 1.500000 1.259921 0.125000
```
:::
::::

:::note[Pattern at work]
The same steps on an infinite support. The left end of the support is 1, not 0, and the check $F(\infty)=1$
replaces $F(\text{right end})=1$.
:::

::::exercise[A piecewise density]
$f(x)=x$ for $0<x\le1$ and $f(x)=2-x$ for $1<x<2$. Find $F$ and its inverse, and write the generator with
`ifelse()`. Check that the mean is 1 and the variance $\frac16$, the same as for the sum of two uniforms.

:::solution
For $0<x\le1$: $F(x)=\frac{x^2}2$, which reaches $\frac12$ at $x=1$. For $1<x<2$:
$F(x)=\frac12+\int_1^x(2-t)\,dt=1-\frac{(2-x)^2}2$, which reaches 1 at $x=2$.

Invert each piece on its range of $u$. For $u\le\frac12$: $x=\sqrt{2u}$. For $u>\frac12$: $(2-x)^2=2(1-u)$, so
$x=2-\sqrt{2(1-u)}$, the root below 2.

```r
Finv <- function(u) ifelse(u <= 0.5, sqrt(2 * u), 2 - sqrt(2 * (1 - u)))
Finv(c(0.125, 0.5, 0.875))
## [1] 0.5 1.0 1.5
set.seed(130)
x <- Finv(runif(100000))
c(mean = mean(x), var = var(x))          # exact: 1 and 1/6 = 0.1667
##      mean       var
## 1.0002395 0.1671373
y <- runif(100000) + runif(100000)       # the same distribution, another way
c(mean = mean(y), var = var(y))
##      mean       var
## 1.0004659 0.1662509
```
:::
::::

:::note[Pattern at work]
Step 6. The second piece of $F$ starts from the mass $\frac12$ on its left, and the join $F(1)=\frac12$ tells
which piece of the inverse to use. The last two lines show a second route: combine draws you already have.
:::
