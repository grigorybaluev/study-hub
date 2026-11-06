---
title: Linear or not, and the standard matrix
order: 3
asks: decide whether a map is linear, find its standard matrix, compose maps, describe a geometric map
units: [linear-transformations-rn]
---

## Logic

A map is linear exactly when it respects sums and scalar multiples, and then it is multiplication by the matrix whose columns are the images of
the standard basis. So all the information sits in $n$ vectors. Composition is the matrix product, with the map applied first on the right.

## Pattern

:::steps[From a rule to a matrix]
1. Quick filter: $T(\mathbf 0)=\mathbf 0$? Is each entry a linear expression with no constant term and no products of variables?
2. To prove linearity, check both properties on arbitrary vectors. To disprove it, give one numeric failure.
3. Columns: $A=[\,T(\mathbf e_0)\ \cdots\ T(\mathbf e_{n-1})\,]$.
4. Images known on another basis: $A\,P=[\,T(\mathbf b_0)\ \cdots\,]$, so $A=[\,T(\mathbf b_0)\ \cdots\,]\,P^{-1}$.
5. Composition: $S\circ T$ has matrix $[S][T]$.
:::

## In Sage

```python
x, y, c, u0, u1, v0, v1 = var('x, y, c, u0, u1, v0, v1')
T(x, y) = (x + 2*y, 3*x)
bool(T(u0 + v0, u1 + v1) == T(u0, u1) + T(v0, v1))    # True
bool(T(c*v0, c*v1) == c*T(v0, v1))                    # True
A = column_matrix(QQ, [T(1, 0), T(0, 1)])
A                                                     # [1 2; 3 0]
```

Testing the two properties symbolically is a check, and `bool(...)` returning `False` only means Sage could not show equality: then give a numeric counterexample.

## Traps

:::caution[Traps]
- $T(\mathbf 0)=\mathbf 0$ does not prove linearity: $(x,y)\mapsto(x^2,y)$ passes it.
- A constant term makes a map affine, not linear.
- Columns, not rows: `column_matrix` for the images of the basis. A formula written out gives rows, and the two readings must agree.
- $S\circ T$ means $T$ first, and its matrix is $[S][T]$.
:::

## Worked problems

::::exercise[Two formulas]
Is $T(x,y)=(x+y,\ xy)$ linear? And $S(x,y,z)=(x-z,\ 2y)$? Find the standard matrix of the linear one.

:::solution
$T$ is not linear: $T(2,2)=(4,4)$ but $2\,T(1,1)=(4,2)$.

$S$ is linear, since each entry is a linear expression with no constant term. $S(\mathbf e_0)=(1,0)$, $S(\mathbf e_1)=(0,2)$, $S(\mathbf e_2)=(-1,0)$, so

$$
A=\begin{bmatrix}1&0&-1\\0&2&0\end{bmatrix} .
$$

```python
x, y, z = var('x, y, z')
T(x, y) = (x + y, x*y)
T(2, 2), 2*T(1, 1)                       # ((4, 4), (4, 2))
S(x, y, z) = (x - z, 2*y)
column_matrix(QQ, [S(1, 0, 0), S(0, 1, 0), S(0, 0, 1)])      # [1 0 -1; 0 2 0]
```
:::
::::

:::note[Pattern at work]
Step 1 flags the product $xy$, step 2 turns it into a numeric failure. Step 3 for $S$.
:::

::::exercise[Images of another basis]
A linear map has $T(1,1)=(2,0)$ and $T(1,-1)=(0,4)$. Find its standard matrix and $T(3,1)$.

:::solution
With $P=\begin{bmatrix}1&1\\1&-1\end{bmatrix}$ and $Q=\begin{bmatrix}2&0\\0&4\end{bmatrix}$ (the images as columns), $AP=Q$, so

$$
A=QP^{-1}=\begin{bmatrix}1&1\\2&-2\end{bmatrix} .
$$

Then $T(3,1)=A(3,1)=(4,4)$. Without $A$: $(3,1)=2\,(1,1)+1\,(1,-1)$, so $T(3,1)=2\,(2,0)+(0,4)=(4,4)$.

```python
P = column_matrix(QQ, [[1, 1], [1, -1]])
Q = column_matrix(QQ, [[2, 0], [0, 4]])
A = Q * P.inverse()
A                                       # [1 1; 2 -2]
A * vector(QQ, [3, 1])                  # (4, 4)
```
:::
::::

:::note[Pattern at work]
Step 4: a linear map is fixed by its values on **any** basis. The second computation uses linearity directly, and it is a free check.
:::

::::exercise[A reflection and a composition]
Find the standard matrix of the reflection $F$ in the line $y=2x$. What does $F$ followed by the projection onto the $x$-axis do to $(5,0)$?

:::solution
The unit vector along the line is $\mathbf u=\frac{1}{\sqrt5}(1,2)$, and a reflection is $\mathbf v\mapsto2(\mathbf v\cdot\mathbf u)\mathbf u-\mathbf v$. Applying this to $\mathbf e_0$ and $\mathbf e_1$:

$$
F=\frac15\begin{bmatrix}-3&4\\4&3\end{bmatrix} .
$$

Check: $F(1,2)=(1,2)$, and $F(2,-1)=(-2,1)$. The projection has matrix $\begin{bmatrix}1&0\\0&0\end{bmatrix}$, so the composition has matrix $\begin{bmatrix}1&0\\0&0\end{bmatrix}F$, and it sends $(5,0)$ to $(-3,0)$.

```python
u = vector(QQ, [1, 2])
F = column_matrix(QQ, [2*(e.dot_product(u)/u.dot_product(u))*u - e for e in identity_matrix(QQ, 2).columns()])
F                                       # [-3/5 4/5; 4/5 3/5]
Pr = matrix(QQ, [[1, 0], [0, 0]])
Pr * F * vector(QQ, [5, 0])             # (-3, 0)
```
:::
::::

:::note[Pattern at work]
Step 3 with a geometric rule, then step 5: the reflection is applied first, so its matrix is on the right, next to the vector.
:::
