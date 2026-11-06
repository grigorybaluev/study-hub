---
title: Product moments, covariance and correlation
order: 7
asks: E[XY] from a table or a density, the covariance, the correlation, uncorrelated against independent
units: [covariance-conditional-expectation]
---

## Logic

$E[g(X,Y)]$ weights $g$ by the joint mass, so $E[XY]$ is one double sum or integral. The covariance compares it
with what independence would give: $\sigma_{XY}=E[XY]-\mu_X\mu_Y$. Its sign says whether large values go together,
and $\rho$ rescales it to a number from $-1$ to 1 that has no units.

## Pattern

:::steps[Three moments, then subtract]
1. Means $\mu_X$, $\mu_Y$ from the marginals, or directly from the joint.
2. $E[XY]=\sum\sum xy\,p(x,y)$ or $\iint xy\,f(x,y)\,dx\,dy$ over the support, with the same limits as always.
3. $\sigma_{XY}=E[XY]-\mu_X\mu_Y$.
4. $\sigma_X^2$, $\sigma_Y^2$ from the marginals, then $\rho=\frac{\sigma_{XY}}{\sigma_X\sigma_Y}$.
5. Independent means $\sigma_{XY}=0$. If $\sigma_{XY}\neq0$, they are dependent. If $\sigma_{XY}=0$, nothing is
   decided yet.
:::

## Traps

:::caution[Traps]
- Zero covariance does not give independence: it only rules out a linear tendency.
- $E[XY]=E[X]E[Y]$ is a result of independence, so do not use it on a joint that has not been shown independent.
- A $\rho$ outside $[-1,1]$, or $\sigma_X^2<0$, means an arithmetic error.
- $\operatorname{cov}(aX+b,cY+d)=ac\,\sigma_{XY}$: shifts drop out and scales multiply. $\rho$ keeps its size, and
  its sign changes when $ac<0$.
:::

## Worked problems

::::exercise[The table again]
For the table of type 3, find $\sigma_{XY}$ and $\rho$.

:::solution
From the marginals, $\mu_X=0.5+0.4=0.9$ and $\mu_Y=0.4+1.2=1.6$.

Only cells with $x\neq0$ contribute to $E[XY]$: $1\cdot1(0.2)+2\cdot1(0.1)+1\cdot2(0.3)+2\cdot2(0.1)=1.4$.

$\sigma_{XY}=1.4-0.9(1.6)=-0.04$.

$E[X^2]=0.5+0.8=1.3$, so $\sigma_X^2=1.3-0.81=0.49$. $E[Y^2]=0.4+2.4=2.8$, so $\sigma_Y^2=2.8-2.56=0.24$.

$\rho=\frac{-0.04}{\sqrt{0.49}\sqrt{0.24}}\approx-0.117$.
:::
::::

:::note[Pattern at work]
Steps 1–4 on a table. A nonzero covariance proves dependence on its own (step 5), while a zero would have proved
nothing.
:::

::::exercise[The triangle again]
For $f(x,y)=8xy$ on $0<y<x<1$ (type 3), find $\sigma_{XY}$ and $\rho$.

:::solution
With $f_X(x)=4x^3$: $\mu_X=\frac45$ and $E[X^2]=\frac23$, so $\sigma_X^2=\frac23-\frac{16}{25}=\frac2{75}$.

With $f_Y(y)=4y(1-y^2)$: $\mu_Y=\frac43-\frac45=\frac8{15}$ and $E[Y^2]=1-\frac23=\frac13$, so
$\sigma_Y^2=\frac13-\frac{64}{225}=\frac{11}{225}$.

$E[XY]=\int_0^1\int_0^x8x^2y^2\,dy\,dx=\int_0^1\frac83x^5\,dx=\frac49$.

$\sigma_{XY}=\frac49-\frac45\cdot\frac8{15}=\frac49-\frac{32}{75}=\frac4{225}$.

$\rho=\frac{4/225}{\sqrt{(2/75)(11/225)}}=\frac{2\sqrt{66}}{33}\approx0.492$.
:::
::::

:::note[Pattern at work]
Step 2 uses the limits of the sketch, 0 to $x$. The positive sign fits the picture: on the triangle, a large $X$
leaves more room for a large $Y$.
:::

::::exercise[Uncorrelated, not independent]
$X$ takes the values $-1,0,1$ with probability $\frac13$ each, and $Y=X^2$. Find $\sigma_{XY}$. Are $X$ and $Y$
independent?

:::solution
$\mu_X=0$ and $E[XY]=E[X^3]=\frac{-1+0+1}3=0$, so $\sigma_{XY}=0-0=0$.

They are not independent, since $Y$ is a function of $X$: $P(X=0,Y=1)=0$ but
$P(X=0)P(Y=1)=\frac13\cdot\frac23=\frac29$.
:::
::::

:::note[Pattern at work]
Step 5. A perfect but symmetric (not linear) relationship gives zero covariance, and one failing cell then settles
independence.
:::
