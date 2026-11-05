---
title: Conditional expectation
order: 9
asks: E[X | y], the conditional variance, the law of total expectation, two-stage models
units: [covariance-conditional-expectation]
---

## Logic

Once $Y=y$ is known, $X$ has a conditional distribution, and $E[X\mid y]$ is simply its mean: a function of $y$,
the best prediction of $X$. Averaging those predictions over $Y$ gives back $E[X]$. So a two-stage model
("first $N$, then given $N$ …") gives its mean directly, without the joint distribution.

## Pattern

:::steps[Slice, weight, average]
1. Get the conditional: $p(x\mid y)=\frac{p(x,y)}{p_Y(y)}$ or $f(x\mid y)=\frac{f(x,y)}{f_Y(y)}$, with its range. A
   two-stage model gives it to you.
2. $E[X\mid y]=\sum_xx\,p(x\mid y)$ or $\int x\,f(x\mid y)\,dx$. If the conditional is a named distribution, read off
   its mean.
3. $\sigma^2_{X\mid y}=E[X^2\mid y]-(E[X\mid y])^2$.
4. Total expectation: $E[X]=\sum_yE[X\mid y]\,p_Y(y)$ or $\int E[X\mid y]\,f_Y(y)\,dy$. It works for any $g(X)$, so
   it also gives $E[X^2]$, and then the variance of $X$.
5. Check: the result agrees with $E[X]$ found from the marginal.
:::

## Traps

:::caution[Traps]
- $E[X\mid y]$ depends on $y$, not on $x$, and it has a range.
- Dividing by the wrong marginal: the given variable's marginal goes underneath.
- The limits of the conditional are those of the slice at that $y$.
- The average of the conditional **variances** is not the variance of $X$: it leaves out the spread of the
  conditional means. Use step 4 on $E[X^2]$ instead.
:::

## Worked problems

::::exercise[The table a third time]
For the table of type 3, find $E[X\mid Y=1]$, $E[X\mid Y=2]$ and $\sigma^2_{X\mid2}$, and check total expectation.

:::solution
$p(x\mid1)=\frac14,\frac12,\frac14$, so $E[X\mid1]=\frac12+\frac12=1$.

$p(x\mid2)=\frac13,\frac12,\frac16$, so $E[X\mid2]=\frac12+\frac13=\frac56$.

$E[X^2\mid2]=\frac12+\frac46=\frac76$, so $\sigma^2_{X\mid2}=\frac76-\frac{25}{36}=\frac{17}{36}$.

Check: $0.4(1)+0.6\left(\frac56\right)=0.4+0.5=0.9=\mu_X$.
:::
::::

:::note[Pattern at work]
Steps 2–5, one row at a time. Each row of the table has its own mean, and their weighted average is the mean of
the whole table.
:::

::::exercise[The triangle a third time]
For $f(x,y)=8xy$ on $0<y<x<1$, find $E[Y\mid x]$ and $\sigma^2_{Y\mid x}$, then $E[Y]$ by total expectation.

:::solution
From type 3, $f(y\mid x)=\frac{2y}{x^2}$ for $0<y<x$. So

$E[Y\mid x]=\int_0^xy\cdot\frac{2y}{x^2}\,dy=\frac{2x}3$ and $E[Y^2\mid x]=\int_0^xy^2\cdot\frac{2y}{x^2}\,dy=\frac{x^2}2$, for $0<x<1$.

$\sigma^2_{Y\mid x}=\frac{x^2}2-\frac{4x^2}9=\frac{x^2}{18}$.

$E[Y]=\int_0^1\frac{2x}3\cdot4x^3\,dx=\frac23\cdot\frac45=\frac8{15}$, the value found from $f_Y$ in type 7.
:::
::::

:::note[Pattern at work]
Steps 2–4. The prediction rises with $x$, which matches the positive covariance of type 7. The integral in the last
line is $\frac23E[X]$: a conditional mean that is linear in $x$ makes step 4 one line.
:::

::::exercise[Two stages]
(a) A die is rolled, and then a fair coin is tossed as many times as the die shows. $Y$ is the number of heads.
Find $E[Y]$ and $P(Y=0)$. (b) $X$ is uniform on $(0,1)$, and given $X=x$, $Y$ is uniform on $(0,x)$. Find $E[Y]$ and
$\operatorname{Var}(Y)$.

:::solution
(a) Let $N$ be the number on the die. Given $N=n$, $Y$ is binomial with $n$ and $\frac12$, so $E[Y\mid n]=\frac n2$. Then
$E[Y]=\frac12E[N]=\frac12\cdot\frac72=\frac74$.

Total probability: $P(Y=0)=\frac16\sum_{n=1}^6\left(\frac12\right)^n=\frac16\cdot\frac{63}{64}=\frac{21}{128}$.

(b) $E[Y\mid x]=\frac x2$, so $E[Y]=\frac12E[X]=\frac14$. For the variance use step 4 on $Y^2$:
$E[Y^2\mid x]=\frac{x^2}3$, so $E[Y^2]=\frac13E[X^2]=\frac19$ and
$\operatorname{Var}(Y)=\frac19-\frac1{16}=\frac7{144}$.
:::
::::

:::note[Pattern at work]
Neither answer needs the joint or the marginal of $Y$: the conditional is a named distribution, so step 2 is free,
and step 4 does the rest. In (b) the conditional variance $\frac{x^2}{12}$ averages to $\frac1{36}$, which is less
than $\frac7{144}$, as the last trap says.
:::
