---
title: Eigenvalues and eigenvectors
order: 11
asks: find eigenvalues, eigenvectors and multiplicities of a matrix or an operator, use their properties
units: [eigenvalues-eigenvectors]
---

## Logic

Two steps: the roots of the characteristic polynomial are the eigenvalues, and the kernel of $A-\lambda I$ for each one gives the eigenvectors. Trace and determinant check the result at no cost. For an operator, take its matrix relative to any basis and translate the
eigenvectors back. Facts about $A^k$, $A^{-1}$ or a polynomial in $A$ follow from one eigenvector equation, with no new computation.

## Pattern

:::steps[Two steps and a check]
1. Compute $p_A(\lambda)=\det(\lambda I-A)$ and factor it. A triangular matrix: read the diagonal.
2. For each $\lambda$: row reduce $A-\lambda I$ and solve. The free parameters give a basis of $E_\lambda$.
3. Record both multiplicities.
4. Check: the eigenvalues add to $\mathrm{tr}(A)$ and multiply to $\det(A)$; and $A\mathbf v=\lambda\mathbf v$ for one vector.
5. An operator: translate each eigenvector into the original space.
:::

## In Sage

```python
A = matrix(QQ, [[2, 1, 1], [1, 2, 1], [0, 0, 1]])
A.charpoly()                            # x^3 - 5*x^2 + 7*x - 3
A.charpoly().factor()                   # (x - 3) * (x - 1)^2
A.eigenvalues()                         # [3, 1, 1]: repeated as often as the multiplicity
A.eigenvectors_right()                  # [(3, [(1, 1, 0)], 1), (1, [(1, 0, -1), (0, 1, -1)], 2)]
(A - identity_matrix(3)).right_kernel().dimension()     # 2: the geometric multiplicity of 1
A.trace(), det(A)                       # (5, 3)
```

Each triple in `eigenvectors_right()` is (eigenvalue, basis of the eigenspace, **algebraic** multiplicity). The geometric multiplicity is the length of the list in the middle.

## Traps

:::caution[Traps]
- The zero vector is never an eigenvector, but $0$ can be an eigenvalue.
- Row reduction of $A$ changes the eigenvalues. Only row reduce $A-\lambda I$, for one $\lambda$ at a time.
- If the kernel of $A-\lambda I$ comes out as $\{\mathbf 0\}$, then $\lambda$ is wrong.
- `eigenvectors_right`, not `eigenvectors_left`.
- `A.eigenvalues()` on a real matrix may return complex values: they come in conjugate pairs. Sage shows them in `QQbar`, with `?` after a rounded decimal, and they are exact.
:::

## Worked problems

::::exercise[A 3 × 3 matrix with a repeated eigenvalue]
Find the eigenvalues, eigenspaces and multiplicities of $A=\begin{bmatrix}2&1&1\\1&2&1\\0&0&1\end{bmatrix}$.

:::solution
Expanding along the last row: $p_A(\lambda)=(\lambda-1)\bigl((\lambda-2)^2-1\bigr)=(\lambda-1)^2(\lambda-3)$.

$\lambda=3$: $A-3I=\begin{bmatrix}-1&1&1\\1&-1&1\\0&0&-2\end{bmatrix}$ gives $x_2=0$, $x_0=x_1$, so $E_3=\mathrm{span}\{(1,1,0)\}$.

$\lambda=1$: $A-I=\begin{bmatrix}1&1&1\\1&1&1\\0&0&0\end{bmatrix}$ has rank $1$, so $x_0+x_1+x_2=0$, and $E_1=\mathrm{span}\{(-1,1,0),(-1,0,1)\}$.

Multiplicities: for $3$, algebraic and geometric are both $1$; for $1$, both are $2$. Check: $3+1+1=5=\mathrm{tr}(A)$ and $3\cdot1\cdot1=3=\det(A)$.
:::
::::

:::note[Pattern at work]
Step 1 with a zero-rich row; step 4 catches arithmetic errors for free. Sage's basis of $E_1$ differs from this one, and both span the same plane.
:::

::::exercise[Complex eigenvalues]
Find the eigenvalues of $A=\begin{bmatrix}0&-1\\1&1\end{bmatrix}$ and an eigenvector for each. What is $A^6$?

:::solution
$p_A(\lambda)=\lambda^2-\lambda+1$, so $\lambda=\frac{1\pm i\sqrt3}{2}=e^{\pm i\pi/3}$.

For $\lambda=\frac{1+i\sqrt3}{2}$: row $0$ of $A-\lambda I$ says $-\lambda x_0-x_1=0$, so $\mathbf v=(1,-\lambda)$. For the conjugate: $\bar{\mathbf v}=(1,-\bar\lambda)$.

Both eigenvalues satisfy $\lambda^6=1$, and $A$ is diagonalizable over $\mathbb C$ since they are distinct, so $A^6=I_2$.

```python
A = matrix(QQ, [[0, -1], [1, 1]])
A.charpoly()                            # x^2 - x + 1
A.eigenvalues()                         # [0.50000...? - 0.86602...?*I, 0.50000...? + 0.86602...?*I]
A^6                                     # [1 0; 0 1]
```
:::
::::

:::note[Pattern at work]
Step 2 over $\mathbb C$ needs only one equation, since the rows of $A-\lambda I$ are dependent. The polar form of the eigenvalues then gives the power.
:::

::::exercise[An operator]
Find the eigenvalues and eigenvectors of $T:\mathcal P_2\to\mathcal P_2$, $T(p)=p+(x+1)p'$.

:::solution
Relative to $(1,x,x^2)$, $T$ has the triangular matrix $\begin{bmatrix}1&1&0\\0&2&2\\0&0&3\end{bmatrix}$, so the eigenvalues are $1,2,3$.

The kernels give the coordinates $(1,0,0)$, $(1,1,0)$, $(1,2,1)$, that is, the polynomials $1$, $1+x$, $(1+x)^2$.

Check: $T((1+x)^2)=(1+x)^2+2(1+x)^2=3(1+x)^2$.

```python
A = matrix(QQ, [[1, 1, 0], [0, 2, 2], [0, 0, 3]])
A.eigenvectors_right()                  # [(3, [(1, 2, 1)], 1), (2, [(1, 1, 0)], 1), (1, [(1, 0, 0)], 1)]
```
:::
::::

:::note[Pattern at work]
Step 5: the vectors Sage prints are coordinates, and the answer is polynomials.
:::

::::exercise[Using one eigenpair]
$A$ is invertible and $A\mathbf v=3\mathbf v$. Find the eigenvalue for $\mathbf v$ of $A^2+2A-I$ and of $A^{-1}$.

:::solution
$(A^2+2A-I)\mathbf v=9\mathbf v+6\mathbf v-\mathbf v=14\mathbf v$, so the eigenvalue is $14$. And $A^{-1}\mathbf v=\frac13\mathbf v$, so the eigenvalue is $\frac13$.
:::
::::

:::note[Pattern at work]
Apply the matrix to $\mathbf v$ term by term. There is no matrix to compute.
:::
