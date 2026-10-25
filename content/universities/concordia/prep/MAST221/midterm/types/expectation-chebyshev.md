---
title: Expectation, variance and Chebyshev
order: 8
asks: E[X], E[g(X)], the variance, linear changes, Chebyshev bounds
units: [expectation-moments]
method: expectation-and-variance
---

## Logic

$E[X]$ is the balance point of the mass, and $E[g(X)]$ weights $g$ by the same mass. The variance measures
the spread around the mean; compute it with the shortcut $E[X^2]-\mu^2$. Chebyshev turns $\mu$ and $\sigma$
alone into a guaranteed bound for any distribution.

## Pattern

:::steps[Balance point and spread]
1. $\mu=\sum x\,p(x)$ or $\int xf(x)\,dx$ (use symmetry when you can).
2. $E[X^2]$ the same way, then $\sigma^2=E[X^2]-\mu^2$.
3. Linear changes: $E[aX+b]=a\mu+b$, $\operatorname{Var}(aX+b)=a^2\sigma^2$.
4. Chebyshev: write the interval as $\mu\pm k\sigma$, then $P(|X-\mu|<k\sigma)\ge1-\frac1{k^2}$; or solve
   $1-\frac1{k^2}=$ the target for $k$.
:::

## Traps

:::caution[Traps]
- $E[X^2]\neq(E[X])^2$; $E[1/X]\neq1/E[X]$.
- $\operatorname{Var}(aX+b)=a^2\sigma^2$: the $b$ disappears and $a$ is squared
  ($\operatorname{Var}(-X)=\operatorname{Var}(X)$).
- Chebyshev needs an interval symmetric about $\mu$; for $k\le1$ it says nothing.
- A variance that comes out negative means an arithmetic error.
:::

## Worked problems

::::exercise[Discrete and continuous]
(a) For $X$ with $p=0.4, 0.3, 0.2, 0.1$ on $1, 2, 3, 4$ (the testing problem of type 5), find $E[X]$,
$\operatorname{Var}(X)$, $E[3X-1]$ and $\operatorname{Var}(3X-1)$. (b) For $f(x)=\frac34x(2-x)$ on $[0,2]$
(type 6), find $\mu$ and $\sigma^2$.

:::solution
(a) $E[X]=0.4+0.6+0.6+0.4=2$; $E[X^2]=0.4+1.2+1.8+1.6=5$; $\operatorname{Var}(X)=5-4=1$; $E[3X-1]=5$;
$\operatorname{Var}(3X-1)=9$.

(b) The density is symmetric about 1, so $\mu=1$.
$E[X^2]=\frac34\int_0^2(2x^3-x^4)\,dx=\frac34\left(8-\frac{32}5\right)=\frac65$, so
$\sigma^2=\frac65-1=\frac15$.
:::
::::

:::note[Pattern at work]
Steps 1–3. Symmetry replaced one integral. The linear-change rules gave $E[3X-1]$ and
$\operatorname{Var}(3X-1)$ without a new pmf.
:::

::::exercise[Chebyshev both ways]
$X$ has $\mu=50$ and $\sigma=5$ (the distribution is unknown). (a) Give a lower bound for $P(40<X<60)$.
(b) Find an interval centred at 50 that contains $X$ with probability at least 0.96.

:::solution
(a) 40 to 60 is $\mu\pm2\sigma$, so $k=2$ and $P(40<X<60)\ge1-\frac14=0.75$.

(b) $1-\frac1{k^2}=0.96$ gives $k=5$, so $\mu\pm5\sigma$: the interval $(25, 75)$.
:::
::::

:::note[Pattern at work]
Step 4 in both directions: from the interval to $k$ to the bound, and from the target to $k$ to the
interval. The bound holds for every distribution with this mean and standard deviation, which is its point.
:::
