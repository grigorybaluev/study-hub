---
title: Conditioning and multivariate draws
order: 8
asks: a distribution given an event, sums of draws, independent columns, correlated normals, Cholesky, a joint table
units: [simulating-random-variables]
method: generating-a-random-variable
---

## Logic

To condition on an event, simulate without the condition and keep what satisfies it: the kept draws have exactly
the conditional distribution, and the fraction kept is the probability of the event. To build a vector,
independent components are simulated one at a time. Dependence must be built in: a correlated pair is a mix of
independent normals, and a joint table is a single draw of a **cell**.

## Pattern

:::steps[Simulating several variables]
1. Conditional on $A$: `x[cond]`, for example `z[z > 1 & z < 2]`. The acceptance rate estimates $P(A)$.
2. Functions of draws: put $k$ draws in each row of a matrix, then `rowSums(Z^2)`, `pmax(...)`, `apply(...)`. A chi-square with $k$ degrees of freedom is the sum of $k$ squared standard normals.
3. Independent components: one generator per column, side by side.
4. Two correlated standard normals: $X=Z_1$, $Y=\rho Z_1+\sqrt{1-\rho^2}\,Z_2$. Then rescale: $\mu+\sigma\times$ each.
5. A covariance matrix: `R <- chol(Sigma)`, then `sweep(Z %*% R, 2, mu, "+")`, where $\Sigma=R^{\mathsf T}R$ and `Z` holds independent standard normals.
6. A joint table: draw a cell with `sample()` and read its row and column. Or draw $X$ from its marginal, then $Y$ from the conditional row.
:::

## Traps

:::caution[Traps]
- Rejection for rare events wastes almost everything: the kept fraction is $P(A)$.
- `length(kept)` is random, so do not assume a fixed sample size afterwards.
- $\sqrt{1-\rho^2}$, not $1-\rho$: otherwise the variance of $Y$ is no longer 1.
- `chol()` returns the **upper** triangular $R$ with $R^{\mathsf T}R=\Sigma$, so the product is `Z %*% R`, with `Z` on the left.
- `sd` is a standard deviation while `Sigma` holds variances: a variance of 9 means `sd = 3`.
- `as.vector()` lists a matrix **column by column**, so read the cell's row and column with `row()` and `col()`, in the same order.
:::

## Worked problems

::::exercise[Given an event]
(a) Two dice are rolled and the sum is at least 9. Find $P(\text{first die}=6)$ by counting, and by simulation.
(b) $(U_1,U_2)$ is uniform on the unit square. Simulate it given $U_1+U_2<1$, and estimate the acceptance rate and
$E(U_1\mid U_1+U_2<1)$, whose exact value is $\frac13$.

:::solution
(a) Ten of the 36 outcomes have a sum of at least 9, and in four of them the first die is 6 (with $3,4,5,6$ on the
second die). So the answer is $\frac4{10}$.

```r
set.seed(141)
d1 <- sample(1:6, 100000, replace = TRUE)
d2 <- sample(1:6, 100000, replace = TRUE)
keep <- d1 + d2 >= 9
mean(keep)                       # exact: 10/36 = 0.2778
## [1] 0.27968
mean(d1[keep] == 6)              # exact: 0.4
## [1] 0.3973827
U1 <- runif(100000)
U2 <- runif(100000)
inside <- U1 + U2 < 1
mean(inside)                     # the area of the triangle, 1/2
## [1] 0.49938
mean(U1[inside])                 # exact: 1/3
## [1] 0.3319268
```

Keep both coordinates with the same logical vector, so that pairs stay together.
:::
::::

:::note[Pattern at work]
Step 1 twice. `mean(keep)` is the acceptance rate, which estimates the probability of the event, and the mean of
the kept values estimates the conditional mean.
:::

::::exercise[A correlated pair]
$X$ has mean 5 and variance 4, $Y$ has mean 1 and variance 9, the two are jointly normal, and their correlation is
$\rho=-0.6$. (a) Write $X$ and $Y$ from independent standard normals. (b) Find $\Sigma$ and its Cholesky factor by
hand. (c) Simulate them both ways.

:::solution
(a) $\sqrt{1-\rho^2}=0.8$, so $X=5+2Z_1$ and $Y=1+3(-0.6Z_1+0.8Z_2)$.

(b) The covariance is $\rho\sigma_X\sigma_Y=-0.6\cdot2\cdot3=-3.6$. With $R$ upper triangular and
$R^{\mathsf T}R=\Sigma$: $r_{11}=\sqrt4=2$, then $r_{12}=-3.6/2=-1.8$, then $r_{22}=\sqrt{9-1.8^2}=\sqrt{5.76}=2.4$.

```r
set.seed(152)
n <- 100000
Z1 <- rnorm(n)
Z2 <- rnorm(n)
X <- 5 + 2 * Z1
Y <- 1 + 3 * (-0.6 * Z1 + 0.8 * Z2)
c(mean(X), mean(Y), var(X), var(Y), cor(X, Y))
## [1]  5.0007113  0.9888394  4.0152436  9.0587545 -0.5999564
Sigma <- matrix(c(4, -3.6, -3.6, 9), nrow = 2)
R <- chol(Sigma)
R
##      [,1] [,2]
## [1,]    2 -1.8
## [2,]    0  2.4
Z <- matrix(rnorm(2 * n), ncol = 2)
XY <- sweep(Z %*% R, 2, c(5, 1), "+")
colMeans(XY)
## [1] 5.0040104 0.9946146
var(XY)
##           [,1]      [,2]
## [1,]  4.005061 -3.626452
## [2,] -3.626452  9.089656
```
:::
::::

:::note[Pattern at work]
Steps 4 and 5 give the same distribution. The hand computation of $R$ is two square roots and a division, and
$R^{\mathsf T}R=\Sigma$ checks it: $1.8^2+2.4^2=9$.
:::

::::exercise[A joint table]
$(X,Y)$ has the table below. Simulate it by drawing a cell, then find $P(Y=3\mid X=1)$ from the table and from the
simulation.

| | $Y=1$ | $Y=2$ | $Y=3$ |
|---|---|---|---|
| $X=0$ | 0.15 | 0.25 | 0.10 |
| $X=1$ | 0.05 | 0.15 | 0.30 |

:::solution
From the table, $P(X=1)=0.5$, so $P(Y=3\mid X=1)=0.30/0.5=0.6$.

```r
joint <- matrix(c(0.15, 0.25, 0.10,
                  0.05, 0.15, 0.30), nrow = 2, byrow = TRUE)
set.seed(163)
n <- 100000
cells <- sample(6, n, replace = TRUE, prob = as.vector(joint))
X <- row(joint)[cells] - 1        # row 1 is X = 0
Y <- col(joint)[cells]            # column 1 is Y = 1
round(table(X, Y) / n, 3)
##    Y
## X       1     2     3
##   0 0.152 0.250 0.101
##   1 0.049 0.147 0.300
mean(Y[X == 1] == 3)              # exact: 0.6
## [1] 0.6047116
```
:::
::::

:::note[Pattern at work]
Step 6. A table is one finite distribution over its cells, so the discrete tools of type 6 apply. The conditional
probability then uses step 1: keep the draws with $X=1$.
:::
