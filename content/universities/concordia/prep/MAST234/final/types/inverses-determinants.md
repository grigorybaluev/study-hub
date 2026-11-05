---
title: Inverses and determinants
order: 2
asks: invert a matrix, find one-sided inverses, compute or use a determinant, find when a matrix is invertible
units: [matrix-operations-determinants, matrix-inverse]
method: inverting-a-matrix
---

## Logic

A square matrix is invertible exactly when any one of the items of the invertible matrix theorem holds: rank $n$, RREF $I_n$, $\det\neq0$,
independent columns. The same row reduction computes the inverse. A matrix that is not square has at most one-sided inverses: a right
inverse when the rows are independent (wide matrices), a left inverse when the columns are independent (tall matrices).

## Pattern

:::steps[Invertible or not]
1. Square? If not, look for a one-sided inverse: right inverse $\iff\mathrm{rank}(A)=m$, left inverse $\iff\mathrm{rank}(A)=n$.
2. Compute $\det(A)$ or the rank. With a parameter, solve $\det(A)=0$.
3. Row reduce $[\,A\mid I_n\,]$. The right block is $A^{-1}$ when the left block is $I_n$.
4. Check $AA^{-1}=I_n$. For a square matrix one side is enough.
:::

:::steps[Rules for determinants]
1. $\det(AB)=\det(A)\det(B)$, $\det(A^{\mathrm T})=\det(A)$, $\det(A^{-1})=\frac{1}{\det(A)}$.
2. For $n\times n$: $\det(cA)=c^n\det(A)$.
3. A row swap flips the sign, scaling a row scales $\det$, adding a multiple of a row changes nothing.
4. A triangular matrix: the product of the diagonal.
:::

## In Sage

```python
A = matrix(QQ, [[1, 2, 0], [0, 1, 1], [1, 0, 2]])
det(A), A.rank(), A.is_invertible()     # (4, 3, True)
A.inverse()                             # [1/2 -1 1/2; 1/4 1/2 -1/4; -1/4 1/2 1/4]
A.augment(identity_matrix(3)).rref()    # [I | inverse]
A * A.inverse() == identity_matrix(3)   # True
```

## Traps

:::caution[Traps]
- $\det(A+B)\neq\det(A)+\det(B)$, and $\det(2A)=2^n\det(A)$, not $2\det(A)$.
- A right inverse is not unique, and for a matrix that is not square "the inverse" makes no sense.
- `matrix([[2, 4], [1, 3]])` has integer entries, and `echelon_form()` then avoids fractions and gives a different matrix. Write `matrix(QQ, ...)`.
- $(AB)^{-1}=B^{-1}A^{-1}$ and $(AB)^{\mathrm T}=B^{\mathrm T}A^{\mathrm T}$: the order reverses.
:::

## Worked problems

::::exercise[Using the rules]
$A$ and $B$ are $3\times3$ with $\det(A)=3$ and $\det(B)=-2$. Find $\det(2A^{-1}B^{\mathrm T})$, and decide whether $AB$ is invertible.

:::solution
$\det(2A^{-1}B^{\mathrm T})=2^3\cdot\frac13\cdot(-2)=-\frac{16}{3}$. And $\det(AB)=-6\neq0$, so $AB$ is invertible.
:::
::::

:::note[Pattern at work]
Only the rules are needed, and the scalar picks up the power $n=3$. A numeric test in Sage confirms it: take any matrices with these determinants.

```python
A = diagonal_matrix(QQ, [3, 1, 1])
B = diagonal_matrix(QQ, [-2, 1, 1])
det(2 * A.inverse() * B.transpose())    # -16/3
```
:::

::::exercise[A parameter]
For which $k$ is $A=\begin{bmatrix}1&k\\k&4\end{bmatrix}$ invertible? Find $A^{-1}$ when $k=1$.

:::solution
$\det(A)=4-k^2$, which is $0$ for $k=\pm2$. So $A$ is invertible for every other $k$. For $k=1$: $A^{-1}=\frac13\begin{bmatrix}4&-1\\-1&1\end{bmatrix}$.

```python
k = var('k')
solve(det(matrix(SR, [[1, k], [k, 4]])) == 0, k)     # [k == -2, k == 2]
matrix(QQ, [[1, 1], [1, 4]]).inverse()               # [4/3 -1/3; -1/3 1/3]
```
:::
::::

:::note[Pattern at work]
Step 2 with a parameter: the determinant is a formula, and its roots are the only bad values.
:::

::::exercise[All right inverses]
Find every right inverse of $A=\begin{bmatrix}1&1&0\\0&1&1\end{bmatrix}$. Does $A$ have a left inverse?

:::solution
The rank is $2=m$, so right inverses exist. Row reducing $[\,A\mid I_2\,]$ gives $\left[\begin{array}{ccc|cc}1&0&-1&1&-1\\0&1&1&0&1\end{array}\right]$. Column $j$ of $B$ solves $A\mathbf x=\mathbf e_j$, with free variable $x_2$:

$$
B=\begin{bmatrix}1+s&-1+t\\-s&1-t\\s&t\end{bmatrix} , \qquad s,t\in\mathbb R .
$$

No left inverse: the rank is $2<3=n$, since a wide matrix has dependent columns.

```python
A = matrix(QQ, [[1, 1, 0], [0, 1, 1]])
A.augment(identity_matrix(2)).rref()    # [1 0 -1 1 -1; 0 1 1 0 1]
s, t = var('s, t')
B = matrix(SR, [[1 + s, -1 + t], [-s, 1 - t], [s, t]])
A * B                                   # [1 0; 0 1] for all s, t
```
:::
::::

:::note[Pattern at work]
Step 1: one free variable for each of the two systems gives two parameters in $B$.
:::
