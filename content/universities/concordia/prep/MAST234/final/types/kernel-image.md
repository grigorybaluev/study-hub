---
title: Kernel, image and rank–nullity
order: 8
asks: find bases of the kernel and image of a linear map, use rank–nullity to count dimensions
units: [basis-coordinates-transition, linear-transformations-general]
---

## Logic

The kernel is what $T$ sends to zero, the image is what $T$ reaches, and rank–nullity says that the dimension of the domain is shared between them. For a map between polynomial or
matrix spaces there are two ways in: solve $T(\mathbf v)=\mathbf 0$ directly from the rule, or pass to the matrix and translate the answer back. Either way, finish by checking the count.

## Pattern

:::steps[Kernel and image]
1. Write the general vector of $V$ with its coefficients, or the matrix $A$ of $T$ relative to bases.
2. Kernel: solve $T(\mathbf v)=\mathbf 0$. A basis comes from the free parameters.
3. Image: apply $T$ to a basis of $V$; the results span the image. Keep the pivot columns of $A$.
4. Translate coordinates back into polynomials or matrices.
5. Check: $\dim\ker(T)+\dim\mathrm{im}(T)=\dim V$.
:::

## In Sage

```python
A = matrix(QQ, [[0, 0, 2, 0], [0, 0, 0, 6], [0, 0, 0, 0], [0, 0, 0, 0]])   # p -> p'' on P_3
A.rank()                                # 2
A.right_kernel(basis='pivot').basis()   # [(1, 0, 0, 0), (0, 1, 0, 0)]: the polynomials 1 and x
[A.column(j) for j in A.pivots()]       # [(2, 0, 0, 0), (0, 6, 0, 0)]: the polynomials 2 and 6x
A.ncols() - A.rank()                    # 2, the nullity
```

For a map on matrices, read each matrix as a list of entries with `.list()` and build the matrix of $T$ column by column:

```python
E = [matrix(QQ, 2, 2, {(i, j): 1}) for i in range(2) for j in range(2)]    # the standard basis
Am = matrix(QQ, [[1, 1], [0, 1]])
T = lambda M: M * Am - Am * M
Tm = column_matrix(QQ, [T(B).list() for B in E])
Tm.rank(), Tm.right_kernel().dimension()     # (2, 2)
```

## Traps

:::caution[Traps]
- Rank plus nullity is the dimension of the **domain**.
- A basis of the image lives in $W$ and a basis of the kernel lives in $V$. Do not mix them up, even when $V=W$.
- Columns of the RREF are not in the image. Use the original columns.
- The answer is a set of polynomials or matrices, not of coordinate columns: translate back.
:::

## Worked problems

::::exercise[The second derivative]
Find bases of the kernel and the image of $T:\mathcal P_3\to\mathcal P_3$, $T(p)=p''$, and check rank–nullity.

:::solution
$p''=0$ exactly when $p=a+bx$, so $\ker(T)=\mathcal P_1$ with basis $1,x$.

The images of the standard basis are $0$, $0$, $2$, $6x$, so $\mathrm{im}(T)=\mathrm{span}\{2,6x\}=\mathcal P_1$, with basis $1,x$.

Check: $2+2=4=\dim\mathcal P_3$. Here kernel and image are the same subspace, which is allowed.
:::
::::

:::note[Pattern at work]
Step 2 from the rule, step 3 from the images of a basis. The matrix in the Sage block above gives the same answer in coordinates.
:::

::::exercise[A map on matrices]
Let $A=\begin{bmatrix}1&1\\0&1\end{bmatrix}$ and $T:\mathbb R^{2\times2}\to\mathbb R^{2\times2}$, $T(M)=MA-AM$. Find bases of the kernel and the image.

:::solution
For $M=\begin{bmatrix}a&b\\c&d\end{bmatrix}$, multiplying out gives $T(M)=\begin{bmatrix}-c&a-d\\0&c\end{bmatrix}$.

Kernel: $c=0$ and $a=d$, so $M=aI_2+b\begin{bmatrix}0&1\\0&0\end{bmatrix}$. A basis is $I_2$, $\begin{bmatrix}0&1\\0&0\end{bmatrix}$, and the nullity is $2$.

Image: the outputs are $c\begin{bmatrix}-1&0\\0&1\end{bmatrix}+(a-d)\begin{bmatrix}0&1\\0&0\end{bmatrix}$, so these two matrices are a basis, and the rank is $2$.

Check: $2+2=4$.

```python
a, b, c, d = var('a, b, c, d')
M = matrix(SR, [[a, b], [c, d]])
Am = matrix(SR, [[1, 1], [0, 1]])
M * Am - Am * M                         # [-c, a - d; 0, c]
```
:::
::::

:::note[Pattern at work]
A symbolic matrix does step 1 in one line. Note that the kernel and the image here share the matrix $\begin{bmatrix}0&1\\0&0\end{bmatrix}$.
:::

::::exercise[Counting only]
(a) $T:\mathbb R^5\to\mathbb R^3$ is surjective. What is its nullity? (b) A $4\times7$ matrix has rank $3$. Find the dimensions of its kernel and its column space. (c) Can a linear map $\mathcal P_3\to\mathbb R^{2\times2}$ have kernel $\{0\}$ without being surjective?

:::solution
(a) The rank is $3$, so the nullity is $5-3=2$.

(b) $\dim\ker=7-3=4$ and $\dim\mathrm{col}=3$.

(c) No: both spaces have dimension $4$, so a trivial kernel forces rank $4$, which is surjective.
:::
::::

:::note[Pattern at work]
No computation: the theorem and its corollary do everything, which is why the dimensions are worth writing first.
:::
