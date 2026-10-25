---
title: Discrete random variables
order: 5
asks: a pmf, its constant, the distribution function, probabilities
units: [random-variables-discrete]
---

## Logic

A pmf lists lumps of mass $p(x)$ that add to 1. The distribution function $F(x)=P(X\le x)$ accumulates the
lumps into a staircase. Every probability question is "which lumps?"

## Pattern

:::steps[Lumps of mass]
1. Constant: set $\sum_xp(x)=1$ and solve. Check that every $p(x)\ge0$.
2. A pmf from an experiment: each value of $X$ is an event; find its probability with types 1–3.
3. $F(x)$: a running total, written as a piecewise function for all real $x$.
4. Probabilities: list the values that qualify, paying attention to $<$ against $\le$.
:::

## Traps

:::caution[Traps]
- $P(X<3)\neq P(X\le3)$ when 3 is a possible value.
- $F$ is defined between the values too: it is flat there, not undefined.
- $P(a<X\le b)=F(b)-F(a)$ includes $b$ and excludes $a$.
:::

## Worked problems

::::exercise[A constant and a staircase]
$p(x)=c(x^2+1)$ for $x=0,1,2,3$. Find $c$, the distribution function, $P(1\le X<3)$ and $P(X>1)$.

:::solution
$c(1+2+5+10)=18c=1$, so $c=\frac1{18}$ and $p=\frac1{18},\frac2{18},\frac5{18},\frac{10}{18}$.

$F(x)=0$ for $x<0$; $\frac1{18}$ for $0\le x<1$; $\frac3{18}$ for $1\le x<2$; $\frac8{18}$ for $2\le x<3$;
$1$ for $x\ge3$.

$P(1\le X<3)=p(1)+p(2)=\frac7{18}$; $P(X>1)=1-F(1)=\frac{15}{18}=\frac56$.
:::
::::

:::note[Pattern at work]
Steps 1, 3 and 4. $F$ is written for every real $x$, with the jumps at the values; "$<3$" excludes the lump
at 3.
:::

::::exercise[A pmf from an experiment]
Two defective and three good items are tested one at a time, in random order, until the first defective is
found. $X$ = the number of tests. Find the pmf of $X$.

:::solution
$p(1)=\frac25$; $p(2)=\frac35\cdot\frac24=\frac3{10}$; $p(3)=\frac35\cdot\frac24\cdot\frac23=\frac15$;
$p(4)=\frac35\cdot\frac24\cdot\frac13\cdot1=\frac1{10}$.

So $p=0.4, 0.3, 0.2, 0.1$ for $x=1,2,3,4$, with total 1. $X=5$ is impossible: with only 3 good items, a
defective appears by test 4.
:::
::::

:::note[Pattern at work]
Step 2: each $\{X=k\}$ is "$k-1$ good, then a defective", computed with the chain of type 3. The total of 1
confirms that no case is missing. (This pmf comes back in type 8.)
:::
