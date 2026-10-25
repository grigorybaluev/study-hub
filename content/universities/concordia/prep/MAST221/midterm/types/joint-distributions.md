---
title: Joint distributions
order: 7
asks: a valid joint density, probabilities of regions, marginals, independence, conditionals
units: [multivariate-distributions]
---

## Logic

The mass now lives on the plane. A probability is a sum or a double integral over a region, a marginal
squashes the mass onto one axis, and independence means the joint is the product of the marginals
everywhere. Almost every mistake is a wrong limit, so draw the support and the region first.

## Pattern

:::steps[Mass on the plane]
1. Sketch the support (where $f>0$) and the event's region inside it.
2. Valid: $f\ge0$ and $\iint f=1$ (or the table adds to 1).
3. $P(\text{region})$: choose the order of integration with the simplest limits; the inner limits may depend
   on the outer variable.
4. Marginal $f_X(x)=\int f(x,y)\,dy$ over the $y$-range at that $x$; state the range of $x$.
5. Independence: check $f(x,y)=f_X(x)f_Y(y)$ for all $x,y$. A support that is not a rectangle means
   dependent, at once.
6. Conditional: $f(x\mid y)=f(x,y)/f_Y(y)$, for $y$ with $f_Y(y)>0$.
:::

## Traps

:::caution[Traps]
- Using $\int_0^1$ for a marginal when the support is a triangle: the limits depend on $x$.
- Calling the variables independent because the formula "looks like" a product, e.g. $f=2$ on a triangle.
- Discrete independence: one cell with $p(x,y)\neq p_X(x)p_Y(y)$ is enough to show dependence.
- A marginal is a function of one variable; no $y$ may be left in $f_X$.
:::

## Worked problems

::::exercise[A joint table]
For $y=0$: $p(0,0)=0.1$, $p(1,0)=0.3$, $p(2,0)=0.1$; for $y=1$: $p(0,1)=0.2$, $p(1,1)=0.1$, $p(2,1)=0.2$.
Find the marginals, check independence, find $p(x\mid Y=1)$ and $P(X+Y\le1)$.

:::solution
$p_X=0.3, 0.4, 0.3$ (for $x=0,1,2$); $p_Y=0.5, 0.5$. Then $p(0,0)=0.1$ but $p_X(0)p_Y(0)=0.15$: dependent.

$p(x\mid1)=\frac{0.2}{0.5},\frac{0.1}{0.5},\frac{0.2}{0.5}=0.4, 0.2, 0.4$.

$P(X+Y\le1)=p(0,0)+p(1,0)+p(0,1)=0.6$.
:::
::::

:::note[Pattern at work]
One failing cell settles dependence (step 5). The conditional is the $y=1$ column rescaled to total 1. The
region $X+Y\le1$ is a list of cells.
:::

::::exercise[On the unit square]
$f(x,y)=c(x+2y)$ for $0<x<1$, $0<y<1$. Find $c$, both marginals, whether $X$ and $Y$ are independent, and
$P(X>Y)$.

:::solution
$\iint(x+2y)=\frac12+1=\frac32$, so $c=\frac23$.

$f_X(x)=\frac23\int_0^1(x+2y)\,dy=\frac23(x+1)$ for $0<x<1$; $f_Y(y)=\frac23\left(\frac12+2y\right)=\frac13(1+4y)$
for $0<y<1$.

$f_Xf_Y=\frac29(x+1)(1+4y)$, which is not $\frac23(x+2y)$ (at a point near $(0,0)$: about $\frac29$ against
0). Not independent.

$P(X>Y)=\int_0^1\int_0^x\frac23(x+2y)\,dy\,dx=\frac23\int_0^12x^2\,dx=\frac49$.
:::
::::

:::note[Pattern at work]
Step 4 on a rectangle: constant limits. Step 5: one point where the product fails is enough. Step 3: the
region $y<x$ gives the inner limits 0 to $x$.
:::

::::exercise[On a triangle]
$f(x,y)=2$ for $0<y<x<1$. Find the marginals, decide independence, find $f(y\mid x)$ and $P(X+Y<1)$.

:::solution
$f_X(x)=\int_0^x2\,dy=2x$ ($0<x<1$); $f_Y(y)=\int_y^12\,dx=2(1-y)$ ($0<y<1$). Dependent: the support is a
triangle, and at $(0.2, 0.8)$ the joint is 0 but $f_Xf_Y>0$.

$f(y\mid x)=\frac2{2x}=\frac1x$ for $0<y<x$: given $X=x$, $Y$ is uniform on $(0,x)$.

The region is $y<x$ and $x+y<1$, so $y<\frac12$ and $y<x<1-y$:
$\int_0^{1/2}\int_y^{1-y}2\,dx\,dy=\int_0^{1/2}2(1-2y)\,dy=\frac12$.
:::
::::

:::note[Pattern at work]
The sketch of step 1 made every limit visible: the marginals' limits depend on the other variable, and
putting $y$ outside makes the region a single integral. The shortcut of step 5: a non-rectangular support
means dependent. The random-variables map walks this density through every arrow.
:::
