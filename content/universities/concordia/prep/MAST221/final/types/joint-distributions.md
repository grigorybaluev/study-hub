---
title: Joint distributions
order: 3
asks: a joint table or density, regions, marginals, independence, conditionals
units: [multivariate-distributions]
---

## Logic

The mass sits on a plane. A probability is a sum or a double integral over a region, a marginal squashes the mass
onto one axis, a conditional is one slice rescaled to total 1, and independence means the joint is the product
of the marginals everywhere. Almost every mistake is a wrong limit, so draw the support first. The table and the
triangle below return in types 7, 8 and 9.

## Pattern

:::steps[Mass on the plane]
1. Sketch the support and the event's region.
2. Constant: $\iint f=1$ over the support, or the table adds to 1.
3. $P(\text{region})$: pick the order with the simplest limits; inner limits may depend on the outer variable.
4. Marginal: $f_X(x)=\int f(x,y)\,dy$ over the $y$-range **at that $x$**; state the range of $x$.
5. Independence: compare the joint with the product of the marginals. A support that is not a rectangle means
   dependent at once.
6. Conditional: $f(y\mid x)=\frac{f(x,y)}{f_X(x)}$, with its range.
:::

## Traps

:::caution[Traps]
- Constant limits on a support that is not a rectangle.
- A marginal must have no other variable left in it, and it needs its own range.
- One failing cell is enough to show dependence.
- A joint that looks like a product, such as $8xy$ on a triangle, is not independent: the support does not factor.
:::

## Worked problems

::::exercise[The table]
$X$ and $Y$ have this joint pmf:

| | $x=0$ | $x=1$ | $x=2$ |
|---|---|---|---|
| $y=1$ | 0.1 | 0.2 | 0.1 |
| $y=2$ | 0.2 | 0.3 | 0.1 |

Find the marginals, decide independence, and find $p(x\mid Y=2)$ and $P(X+Y\le2)$.

:::solution
$p_X=0.3, 0.5, 0.2$ for $x=0,1,2$ and $p_Y=0.4, 0.6$ for $y=1,2$. Since $p(0,1)=0.1$ but
$p_X(0)p_Y(1)=0.12$, they are dependent.

$p(x\mid2)=\frac{0.2}{0.6},\frac{0.3}{0.6},\frac{0.1}{0.6}=\frac13,\frac12,\frac16$.

$P(X+Y\le2)=p(0,1)+p(1,1)+p(0,2)=0.1+0.2+0.2=0.5$.
:::
::::

:::note[Pattern at work]
Step 5 needs only one failing cell, and step 6 is one row rescaled. The region is a list of cells.
:::

::::exercise[The triangle]
$f(x,y)=cxy$ for $0<y<x<1$, and 0 elsewhere. Find $c$, both marginals, $f(y\mid x)$ and $P(Y<\frac X2)$.

:::solution
$\int_0^1\int_0^xxy\,dy\,dx=\int_0^1\frac{x^3}2\,dx=\frac18$, so $c=8$.

$f_X(x)=\int_0^x8xy\,dy=4x^3$ for $0<x<1$, and $f_Y(y)=\int_y^18xy\,dx=4y(1-y^2)$ for $0<y<1$. The support is a
triangle, so $X$ and $Y$ are dependent.

$f(y\mid x)=\frac{8xy}{4x^3}=\frac{2y}{x^2}$ for $0<y<x$.

$P(Y<\frac X2)=\int_0^1\int_0^{x/2}8xy\,dy\,dx=\int_0^1x^3\,dx=\frac14$.
:::
::::

:::note[Pattern at work]
The sketch gives every limit: $y$ from 0 to $x$ at a fixed $x$, and $x$ from $y$ to 1 at a fixed $y$. In the last
part the region stays inside the support, so only the upper limit changes.
:::
