---
title: One random variable
order: 2
asks: a pmf or density, its constant, F(x) for every real x, interval and conditional probabilities
units: [random-variables-discrete, continuous-random-variables]
---

## Logic

A pmf lists lumps of mass that add to 1, and a density is a smear with total area 1. The distribution function
$F(x)=P(X\le x)$ is the mass to the left of $x$: a staircase for lumps, a continuous curve for a smear. Every
question is "which mass?"

## Pattern

:::steps[Total 1, then running total]
1. Constant: set the total to 1 (add the pieces of a piecewise $f$), then check that $f\ge0$.
2. $F$: 0 before the support, 1 after it, and each piece starts from the mass to its left.
3. Intervals: $P(a<X\le b)=F(b)-F(a)$. Discrete: watch $<$ against $\le$.
4. Conditional on an event about $X$: for $a\ge b$, $P(X>a\mid X>b)=\frac{P(X>a)}{P(X>b)}$.
5. From $F$ back: $f=F'$, or the jumps of a staircase.
:::

## Traps

:::caution[Traps]
- $f(x)$ is not a probability, and it can exceed 1.
- A piecewise $F$ that forgets the earlier mass: check continuity at the joins and $F=1$ at the end.
- A staircase is defined between its jumps too: it is flat there.
:::

## Worked problems

::::exercise[The larger of two dice]
Two dice are rolled and $X$ is the larger number shown. Find $F$, the pmf and $P(2<X\le4)$.

:::solution
$X\le k$ means both dice show at most $k$, so $P(X\le k)=\frac{k^2}{36}$ for $k=1,\dots,6$. As a function of
every real $x$: $F(x)=0$ for $x<1$; $F(x)=\frac{k^2}{36}$ for $k\le x<k+1$, $k=1,\dots,5$; $F(x)=1$ for $x\ge6$.

The jumps give the pmf: $p(k)=\frac{k^2-(k-1)^2}{36}=\frac{2k-1}{36}$ for $k=1,\dots,6$.

$P(2<X\le4)=F(4)-F(2)=\frac{16-4}{36}=\frac13$.
:::
::::

:::note[Pattern at work]
Here $F$ is easier than the pmf, so find $F$ first and read the pmf from its jumps (step 5). This pmf comes back
in type 4.
:::

::::exercise[A triangle-shaped density]
$f(x)=cx$ for $0<x\le1$, $f(x)=\frac c2(3-x)$ for $1<x\le3$, and 0 elsewhere. Find $c$, $F(x)$ and
$P(X>2\mid X>1)$.

:::solution
The area is $\frac c2+c=\frac{3c}2$, so $c=\frac23$.

$F(x)=0$ for $x\le0$; $F(x)=\frac{x^2}3$ for $0<x\le1$. The second piece starts from $F(1)=\frac13$:
$F(x)=\frac13+\int_1^x\frac{3-t}3\,dt=x-\frac{x^2}6-\frac12$ for $1<x\le3$; and $F(x)=1$ for $x>3$. Check:
$F(3)=3-\frac32-\frac12=1$.

$P(X>2)=1-F(2)=1-\frac56=\frac16$ and $P(X>1)=\frac23$, so $P(X>2\mid X>1)=\frac{1/6}{2/3}=\frac14$.
:::
::::

:::note[Pattern at work]
Steps 1, 2 and 4. Both formulas give $\frac13$ at the join, which is the continuity check. This density comes
back in type 4.
:::
