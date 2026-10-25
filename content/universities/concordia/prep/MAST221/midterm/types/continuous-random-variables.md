---
title: Continuous random variables
order: 6
asks: a density's constant, probabilities, F(x), conditional probabilities, piecewise densities
units: [continuous-random-variables]
---

## Logic

A density is mass per unit length; probability is area under $f$. The constant makes the total area 1.
$F(x)$ is the area to the left of $x$, so it is an integral with a variable upper limit, defined piece by
piece for every real $x$.

## Pattern

:::steps[Area under the curve]
1. Constant: $\int f=1$ over the support (add the pieces).
2. $P(a<X<b)=\int_a^bf$; split at the break points of a piecewise $f$.
3. $F(x)$: for each piece, the integral from the left end of that piece up to $x$, plus all the mass to the
   left of the piece. Then 0 before the support and 1 after it.
4. Conditional: $P(X>a\mid X>b)=\frac{P(X>a)}{P(X>b)}$ for $a\ge b$ (since $\{X>a\}\subseteq\{X>b\}$).
5. From $F$ to $f$: differentiate; probabilities as $F(b)-F(a)$.
:::

## Traps

:::caution[Traps]
- $f(x)$ is not a probability; it can be larger than 1.
- In a piecewise $F$, forgetting to add the mass of the earlier pieces (check that $F$ is continuous at the
  joins).
- Integrating over the whole real line when $f=0$ outside the support: integrate only where $f$ is nonzero.
- Check: $F(\text{right end})=1$.
:::

## Worked problems

::::exercise[Constant, probability, conditional]
$f(x)=cx(2-x)$ for $0\le x\le2$, and 0 elsewhere. Find $c$, $P(X\le\frac12)$, $F(x)$ and
$P(X>1\mid X>\frac12)$.

:::solution
$\int_0^2(2x-x^2)\,dx=4-\frac83=\frac43$, so $c=\frac34$.

$P(X\le\frac12)=\frac34\left[x^2-\frac{x^3}3\right]_0^{1/2}=\frac34\cdot\frac5{24}=\frac5{32}$.

$F(x)=0$ for $x<0$; $\frac34\left(x^2-\frac{x^3}3\right)$ for $0\le x\le2$; $1$ for $x>2$. Check:
$F(2)=\frac34\left(4-\frac83\right)=1$.

$P(X>1)=\frac12$ (the density is symmetric about 1), so
$P(X>1\mid X>\frac12)=\frac{1/2}{1-5/32}=\frac{16}{27}$.
:::
::::

:::note[Pattern at work]
Steps 1–4 in order. Symmetry gave $P(X>1)$ for free; the conditional is "the smaller event over the larger
one".
:::

::::exercise[A piecewise density]
$f(x)=0.25$ for $-1<x\le0$, $f(x)=0.25+cx$ for $0<x\le1$, and 0 elsewhere. Find $c$, $F(x)$ and
$P(X>0.5\mid X>0)$.

:::solution
Total: $0.25+\left(0.25+\frac c2\right)=1$, so $c=1$.

$F(x)=0$ for $x\le-1$; $0.25(x+1)$ for $-1<x\le0$; $0.25+0.25x+\frac{x^2}2$ for $0<x\le1$; $1$ for $x>1$.
The second piece starts from $F(0)=0.25$, the mass already accumulated; check
$F(1)=0.25+0.25+0.5=1$.

$F(0.5)=0.25+0.125+0.125=0.5$, so $P(X>0.5\mid X>0)=\frac{1-0.5}{1-0.25}=\frac23$.
:::
::::

:::note[Pattern at work]
The trap of step 3: the piece on $(0,1]$ adds $F(0)=0.25$ from the left. Continuity at the join ($x=0$:
both formulas give 0.25) is the check.
:::
