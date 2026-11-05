---
title: Linear combinations
order: 8
asks: the mean and variance of a combination, the covariance of two combinations, averages, sums of indicators
units: [covariance-conditional-expectation]
---

## Logic

The mean of a combination is always the same combination of the means. The variance is what you get by squaring a
sum: a square term for each variable and a cross term for each pair. So the variance needs the covariances, and
independence removes them. This gives the $\sigma^2/n$ of an average, and it finds the moments of a count that is
hard to describe directly, by writing the count as a sum of 0–1 indicators.

## Pattern

:::steps[Squares and cross terms]
1. Write $Y=\sum_ia_iX_i+b$. The constant $b$ moves the mean and disappears from the variance.
2. $E[Y]=\sum_ia_i\mu_i+b$, always.
3. $\operatorname{Var}(Y)=\sum_ia_i^2\sigma_i^2+2\sum_{i<j}a_ia_j\sigma_{ij}$; independent: the second sum is 0.
4. Two combinations: expand like a product,
   $\operatorname{cov}(\sum_ia_iX_i,\sum_jb_jX_j)=\sum_i\sum_ja_ib_j\operatorname{cov}(X_i,X_j)$, with
   $\operatorname{cov}(X_i,X_i)=\sigma_i^2$.
5. Average of $n$ independent copies: $E[\bar X]=\mu$, $\operatorname{Var}(\bar X)=\frac{\sigma^2}n$.
6. A count: $X=\sum_iX_i$ with $X_i=1$ when item $i$ is counted. With $p_i=P(X_i=1)$: $E[X_i]=p_i$,
   $\sigma_i^2=p_i(1-p_i)$ and $E[X_iX_j]=P(\text{both})$.
:::

## Traps

:::caution[Traps]
- $\operatorname{Var}(X-Y)=\sigma_X^2+\sigma_Y^2-2\sigma_{XY}$: the variances add, and only the covariance term
  changes sign.
- The coefficients are squared in the first sum and appear with their signs in the second.
- The cross term has a factor 2, and each pair counts once.
- $\operatorname{Var}(X+X)=4\sigma^2$, not $2\sigma^2$: the two copies are not independent.
- Standard deviations do not add; variances do, when the terms are independent.
:::

## Worked problems

::::exercise[From the table]
For the table of type 3, with $\mu_X=0.9$, $\mu_Y=1.6$, $\sigma_X^2=0.49$, $\sigma_Y^2=0.24$ and $\sigma_{XY}=-0.04$,
find the mean and variance of $2X-3Y+1$, and $\operatorname{Var}(X+Y)$.

:::solution
$E[2X-3Y+1]=1.8-4.8+1=-2$.

$\operatorname{Var}(2X-3Y+1)=4(0.49)+9(0.24)+2(2)(-3)(-0.04)=1.96+2.16+0.48=4.6$.

$\operatorname{Var}(X+Y)=0.49+0.24+2(-0.04)=0.65$.
:::
::::

:::note[Pattern at work]
Steps 2 and 3. The cross term has the coefficients with their signs: $2\cdot(-3)$ times a negative covariance
gives a positive term.
:::

::::exercise[Three variables]
$X_1,X_2,X_3$ have means $2,-1,3$ and variances $1,2,4$, with $\sigma_{12}=-\frac12$, $\sigma_{13}=1$, $\sigma_{23}=0$.
Find the mean and variance of $Y=X_1-2X_2+X_3$, and $\operatorname{cov}(X_1+X_2,\,X_1-X_3)$.

:::solution
$E[Y]=2+2+3=7$.

The squares give $1+4(2)+4=13$. The cross terms give
$2\left[(1)(-2)\left(-\frac12\right)+(1)(1)(1)+(-2)(1)(0)\right]=2(1+1)=4$. So $\operatorname{Var}(Y)=17$.

$\operatorname{cov}(X_1+X_2,\,X_1-X_3)=\sigma_1^2-\sigma_{13}+\sigma_{12}-\sigma_{23}=1-1-\frac12-0=-\frac12$.
:::
::::

:::note[Pattern at work]
Three pairs, each counted once, with its pair of coefficients. Step 4 is ordinary expansion of a product, with
$\operatorname{cov}(X_1,X_1)=\sigma_1^2$.
:::

::::exercise[Matching letters]
$n$ letters go at random into $n$ addressed envelopes, one each. $X$ is the number that reach the right envelope.
Find $E[X]$ and $\operatorname{Var}(X)$ for $n\ge2$.

:::solution
Let $X_i=1$ if letter $i$ is right, so $X=\sum_iX_i$. Then $E[X_i]=\frac1n$, and $E[X]=n\cdot\frac1n=1$.

$\sigma_i^2=\frac1n\left(1-\frac1n\right)$. For $i\neq j$, $E[X_iX_j]=P(\text{both right})=\frac1{n(n-1)}$, so
$\sigma_{ij}=\frac1{n(n-1)}-\frac1{n^2}=\frac1{n^2(n-1)}$.

There are $\binom n2$ pairs, so

$$\operatorname{Var}(X)=n\cdot\frac1n\left(1-\frac1n\right)+2\binom n2\frac1{n^2(n-1)}=1-\frac1n+\frac1n=1.$$
:::
::::

:::note[Pattern at work]
Step 6. The pmf of $X$ is messy, yet the mean and the variance both come out as 1 for every $n$. The indicators are
dependent, so the covariances matter. The binomial and hypergeometric moments come from the same method.
:::

::::exercise[How many measurements]
A filling machine puts mean 500 ml and standard deviation 8 ml into each bottle, independently. How many bottles
must be averaged so that, by Chebyshev's theorem, $P(|\bar X-500|\ge2)\le0.05$?

:::solution
$\operatorname{Var}(\bar X)=\frac{64}n$. Chebyshev's theorem in the form $P(|\bar X-\mu|\ge c)\le\frac{\operatorname{Var}(\bar X)}{c^2}$
gives $\frac{64/n}4=\frac{16}n\le0.05$, so $n\ge320$.
:::
::::

:::note[Pattern at work]
Step 5, then type 4, with $c=2$ in place of $k\sigma$. Chebyshev's theorem knows nothing about the shape, so it
asks for many bottles: type 13 shows that if the fills are normal, 62 are enough.
:::
