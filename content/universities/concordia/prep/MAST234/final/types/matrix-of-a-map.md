---
title: The matrix of a linear map; similar matrices
order: 9
asks: find the matrix of a map relative to given bases, change the basis of an operator, compare similar matrices
units: [linear-transformations-general]
---

## Logic

Column $j$ of the matrix is the image of the $j$-th domain basis vector, written in coordinates of the codomain basis. For an operator, changing the basis conjugates the matrix: $P^{-1}AP$. Similar
matrices share everything that belongs to the operator, and so they can only be told apart by a difference in one of those values.

## Pattern

:::steps[Matrix relative to bases]
1. Apply $T$ to each vector of the domain basis $\mathcal B$.
2. Write each result in $\mathcal C$-coordinates: by inspection, or by solving with $P_{\mathcal C}$.
3. Those are the columns of $[T]_{\mathcal C\leftarrow\mathcal B}$.
4. Check on one vector: $[T]_{\mathcal C\leftarrow\mathcal B}[\mathbf v]_{\mathcal B}=[T(\mathbf v)]_{\mathcal C}$.
:::

:::steps[Changing the basis of an operator]
1. $P=P_{\mathcal B\leftarrow\mathcal C}$: the new basis vectors, in the old coordinates, as columns.
2. $[T]_{\mathcal C}=P^{-1}[T]_{\mathcal B}P$.
3. Check: trace and determinant are unchanged.
:::

## In Sage

```python
A = matrix(QQ, [[1, 1, 0], [0, 2, 2], [0, 0, 3]])     # T(p) = p + (x + 1) p' on P_2, basis 1, x, x^2
P = column_matrix(QQ, [[1, 0, 0], [1, 1, 0], [1, 2, 1]])   # 1, 1 + x, (1 + x)^2 in the old basis
P.inverse() * A * P                     # [1 0 0; 0 2 0; 0 0 3]
A.trace(), det(A), A.rank()             # (6, 6, 3)
A.is_similar(diagonal_matrix(QQ, [1, 2, 3]))   # True
```

A polynomial ring gives the images without any hand computation:

```python
R.<x> = QQ[]
T = lambda p: p + (x + 1) * p.derivative()
[T(p).padded_list(3) for p in [R(1), x, x^2]]   # the columns: [1, 0, 0], [1, 2, 0], [0, 2, 3]
```

## Traps

:::caution[Traps]
- Coordinates of the **images** in $\mathcal C$ go in the columns, not the images themselves.
- $P^{-1}AP$, with $P$ holding the new basis in old coordinates. $PAP^{-1}$ goes the other way.
- `p.list()` drops trailing zeros: $x$ gives `[0, 1]`. Use `p.padded_list(3)` to get a list of length $3$.
- Equal trace, determinant and rank do not prove that two matrices are similar. A difference in any of them proves that they are not.
:::

## Worked problems

::::exercise[A map between different spaces]
Find the matrix of $T:\mathcal P_1\to\mathbb R^3$, $T(p)=(p(0),p(1),p(2))$ relative to $\mathcal B=(1,x)$ and the standard basis. Then find its matrix relative to $\mathcal B'=(1+x,\ 1-x)$.

:::solution
$T(1)=(1,1,1)$ and $T(x)=(0,1,2)$, so $[T]=\begin{bmatrix}1&0\\1&1\\1&2\end{bmatrix}$.

For $\mathcal B'$: $T(1+x)=(1,2,3)$ and $T(1-x)=(1,0,-1)$, so the matrix is $\begin{bmatrix}1&1\\2&0\\3&-1\end{bmatrix}$. This equals $[T]\,P$ with $P=\begin{bmatrix}1&1\\1&-1\end{bmatrix}$, the new basis in old coordinates.

```python
A = column_matrix(QQ, [[1, 1, 1], [0, 1, 2]])
P = column_matrix(QQ, [[1, 1], [1, -1]])
A * P                                   # [1 1; 2 0; 3 -1]
```
:::
::::

:::note[Pattern at work]
The domain basis changes the columns. Since $W$ keeps its basis, only one factor $P$ appears; the two-sided formula is for an operator.
:::

::::exercise[An operator in two bases]
Let $T:\mathcal P_2\to\mathcal P_2$, $T(p)=p+(x+1)p'$. Find $[T]$ relative to $(1,x,x^2)$ and relative to $\mathcal C=(1,\ 1+x,\ (1+x)^2)$.

:::solution
$T(1)=1$, $T(x)=x+(x+1)=1+2x$, and $T(x^2)=x^2+2x(x+1)=2x+3x^2$, so

$$
A=\begin{bmatrix}1&1&0\\0&2&2\\0&0&3\end{bmatrix} .
$$

In $\mathcal C$: $T(1)=1$, $T(1+x)=2(1+x)$, $T((1+x)^2)=3(1+x)^2$, so $[T]_{\mathcal C}=\mathrm{diag}(1,2,3)$. The trace is $6$ and the determinant is $6$ in both.
:::
::::

:::note[Pattern at work]
Both ways of changing the basis agree: images of the new basis directly, or $P^{-1}AP$ as in the Sage block. The vectors of $\mathcal C$ are eigenvectors of $T$, which is why the result is diagonal.
:::

::::exercise[Similar or not?]
Decide whether $A=\begin{bmatrix}1&2\\0&3\end{bmatrix}$ is similar to $B=\begin{bmatrix}2&0\\1&2\end{bmatrix}$, and to $C=\begin{bmatrix}3&0\\0&1\end{bmatrix}$.

:::solution
$\det(A)=3$ and $\det(B)=4$: not similar.

$A$ has distinct eigenvalues $1$ and $3$, so it is diagonalizable, with $D=\mathrm{diag}(3,1)=C$ for a suitable order of the eigenvectors. So $A$ and $C$ are similar.

```python
A = matrix(QQ, [[1, 2], [0, 3]])
B = matrix(QQ, [[2, 0], [1, 2]])
C = diagonal_matrix(QQ, [3, 1])
A.is_similar(B), A.is_similar(C)        # (False, True)
```
:::
::::

:::note[Pattern at work]
One invariant that differs is a complete "no". A "yes" needs a real reason: here, both are diagonal in eigenvector bases.
:::
