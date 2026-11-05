---
title: Expectation, variance and Chebyshev
order: 4
asks: E[X], E[g(X)], the variance, linear changes, Chebyshev in both directions
units: [expectation-moments]
method: expectation-and-variance
---

## Logic

$E[X]$ is the balance point of the mass, and $E[g(X)]$ weights $g$ by the same mass, with no new distribution.
The variance is the average squared distance from the mean. Chebyshev's theorem turns $\mu$ and $\sigma$ alone
into a guarantee for every distribution.

## Pattern

:::steps[Balance point and spread]
1. $\mu=\sum x\,p(x)$ or $\int xf(x)\,dx$; use symmetry when you can.
2. $E[X^2]$ the same way, then $\sigma^2=E[X^2]-\mu^2$.
3. Linear changes: $E[aX+b]=a\mu+b$, $\operatorname{Var}(aX+b)=a^2\sigma^2$.
4. Chebyshev: write the interval as $\mu\pm k\sigma$, so $P(|X-\mu|<k\sigma)\ge1-\frac1{k^2}$; or solve
   $1-\frac1{k^2}=$ the target for $k$.
:::

## Traps

:::caution[Traps]
- $E[X^2]\neq(E[X])^2$ and $E[1/X]\neq1/E[X]$.
- $\operatorname{Var}(aX+b)=a^2\sigma^2$: the $b$ goes and the $a$ is squared.
- Chebyshev needs an interval symmetric about $\mu$; for $k\le1$ it says nothing.
- A negative variance means an arithmetic error.
:::

## Worked problems

::::exercise[Two familiar distributions]
(a) For the larger of two dice, $p(k)=\frac{2k-1}{36}$ on $1,\dots,6$ (type 2), find $E[X]$,
$\operatorname{Var}(X)$ and $E[1/X]$. (b) For the triangle-shaped density of type 2, find $\mu$, $\sigma^2$ and
$\operatorname{Var}(3X-1)$.

:::solution
(a) $E[X]=\frac{1+6+15+28+45+66}{36}=\frac{161}{36}\approx4.47$ and
$E[X^2]=\frac{1+12+45+112+225+396}{36}=\frac{791}{36}$, so
$\sigma^2=\frac{791}{36}-\left(\frac{161}{36}\right)^2=\frac{2555}{1296}\approx1.97$.

$E[1/X]=\sum_k\frac1k\cdot\frac{2k-1}{36}=\frac1{36}\left(12-\sum_k\frac1k\right)=\frac1{36}\left(12-\frac{49}{20}\right)=\frac{191}{720}\approx0.265$,
which is not $\frac1\mu\approx0.224$.

(b) $\mu=\int_0^1x\cdot\frac23x\,dx+\int_1^3x\cdot\frac{3-x}3\,dx=\frac29+\frac{10}9=\frac43$, and
$E[X^2]=\int_0^1x^2\cdot\frac23x\,dx+\int_1^3x^2\cdot\frac{3-x}3\,dx=\frac16+2=\frac{13}6$, so
$\sigma^2=\frac{13}6-\frac{16}9=\frac7{18}$ and $\operatorname{Var}(3X-1)=9\cdot\frac7{18}=\frac72$.
:::
::::

:::note[Pattern at work]
Steps 1–3. In (a), $g(x)=\frac1x$ is weighted by the same pmf, and the result differs from $\frac1\mu$. In (b), a
piecewise density integrates piece by piece, as in type 2.
:::

::::exercise[Chebyshev both ways]
$X$ has $\mu=120$ and $\sigma=8$, with an unknown distribution. (a) Bound $P(100<X<140)$ from below. (b) Find an
interval centred at 120 that contains $X$ with probability at least 0.99.

:::solution
(a) 100 to 140 is $120\pm20$, so $k=\frac{20}8=2.5$ and $P\ge1-\frac1{6.25}=0.84$.

(b) $1-\frac1{k^2}=0.99$ gives $k=10$, so the interval is $120\pm80$, that is $(40,200)$.
:::
::::

:::note[Pattern at work]
Step 4 in both directions. The price of covering every distribution is a wide interval: for a normal $X$, type 13
would give about $120\pm21$ for the same 0.99.
:::
