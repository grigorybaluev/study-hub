---
title: Left and right inverses; invertible matrices
order: 5
status: detailed
weeks: [5]
introduces: []
requires:
  - {concept: matrix, strength: hard}
  - {concept: linear-system, strength: hard}
  - {concept: linear-combination-span, strength: hard}
  - {concept: linear-independence, strength: hard}
  - {concept: matrix-rank, strength: hard}
  - {concept: determinant, strength: soft}
  - {concept: computer-algebra-system, strength: soft}
reinforces:
  - {concept: matrix-inverse, perspective: "left and right inverses of rectangular matrices; when a square matrix is invertible and how rank, determinant and RREF detect it"}
---

The previous unit defined the inverse of a square matrix through two products, $AB = I_n$ and
$BA = I_n$. Asking for only one of them makes sense for any matrix, square or not, and gives a
**right inverse** or a **left inverse**. Each is computed by row reduction, and each exists
exactly when one of the questions of the earlier units has a yes answer: do the columns span,
are they independent? For a square matrix the two questions coincide, a one-sided inverse is
automatically two-sided, and the result is a long list of equivalent ways to say "invertible".

Indices start at $0$, as in Sage: the columns of a matrix $B$ with $m$ columns are
$\mathbf b_0, \dots, \mathbf b_{m-1}$.

## Right inverses

### Definition

:::definition[Right inverse]
A **right inverse** of an $m \times n$ matrix $A$ is an $n \times m$ matrix $B$ with $AB = I_m$.
:::

The sizes are forced: $AB$ must be defined and square of size $m$.

::::example[Two right inverses of one matrix]
Find right inverses of $A = \begin{bmatrix} 1 & 0 & 1 \\ 0 & 1 & 1 \end{bmatrix}$.

:::solution
$A$ is $2 \times 3$, so a right inverse is $3 \times 2$. Both of these work:

$$
\begin{bmatrix} 1 & 0 & 1 \\ 0 & 1 & 1 \end{bmatrix}\begin{bmatrix} 1 & 0 \\ 0 & 1 \\ 0 & 0 \end{bmatrix} = I_2
\qquad
\begin{bmatrix} 1 & 0 & 1 \\ 0 & 1 & 1 \end{bmatrix}\begin{bmatrix} 0 & 1 \\ -1 & 2 \\ 1 & -1 \end{bmatrix} = I_2 .
$$
:::
::::

```python
A = matrix(QQ, [[1, 0, 1], [0, 1, 1]])
B = matrix(QQ, [[1, 0], [0, 1], [0, 0]])
C = matrix(QQ, [[0, 1], [-1, 2], [1, -1]])
A * B, A * C                                     # both [1 0; 0 1]
```

:::caution[A right inverse need not be unique]
The square inverse is unique, but the example above has two different right inverses, and in
fact infinitely many. "The" right inverse makes no sense for a matrix that is not square.
:::

### Computing a right inverse

Read $AB$ column by column. With $B = [\,\mathbf b_0 \ \mathbf b_1 \ \cdots \ \mathbf b_{m-1}\,]$,

$$
AB = [\,A\mathbf b_0 \ \ A\mathbf b_1 \ \cdots \ A\mathbf b_{m-1}\,] = I_m = [\,\mathbf e_0 \ \ \mathbf e_1 \ \cdots \ \mathbf e_{m-1}\,] ,
$$

where $\mathbf e_j$ is column $j$ of $I_m$: a $1$ in position $j$ and zeros elsewhere. So $B$ is a right
inverse exactly when each column $\mathbf b_j$ solves the system $A\mathbf x = \mathbf e_j$. The $m$ systems share
the coefficient matrix $A$, so they are solved together by row reducing one augmented matrix.

:::steps[Computing a right inverse]
1. Form $[\,A \mid I_m\,]$, the matrix $A$ with $m$ extra columns.
2. Compute its RREF.
3. If a row is zero on the $A$ side and nonzero on the $I_m$ side, some system is inconsistent and $A$ has no right inverse.
4. Otherwise read off the general solution of $A\mathbf x = \mathbf e_j$ from the left block and column $j$ of the right block, for each $j$; these are the columns of $B$.
:::

::::example[All right inverses of a 2 × 3 matrix]
Find every right inverse of $A = \begin{bmatrix} 2 & 0 & 4 \\ 0 & 3 & 5 \end{bmatrix}$.

:::solution
Row reduce $[\,A \mid I_2\,]$:

$$
\left[\begin{array}{ccc|cc} 2 & 0 & 4 & 1 & 0 \\ 0 & 3 & 5 & 0 & 1 \end{array}\right]
\sim
\left[\begin{array}{ccc|cc} 1 & 0 & 2 & \tfrac12 & 0 \\ 0 & 1 & \tfrac53 & 0 & \tfrac13 \end{array}\right] .
$$

The left block has pivots in columns $0$ and $1$, so each system has one free variable, $x_2$.
For $A\mathbf x = \mathbf e_0$ (right-block column $0$) set $x_2 = s$; for $A\mathbf x = \mathbf e_1$ (column $1$) set $x_2 = t$:

$$
\mathbf b_0 = \begin{bmatrix} \tfrac12 - 2s \\ -\tfrac53 s \\ s \end{bmatrix}
\qquad
\mathbf b_1 = \begin{bmatrix} -2t \\ \tfrac13 - \tfrac53 t \\ t \end{bmatrix} .
$$

The right inverses of $A$ are exactly the matrices

$$
B = \begin{bmatrix} \tfrac12 - 2s & -2t \\ -\tfrac53 s & \tfrac13 - \tfrac53 t \\ s & t \end{bmatrix}, \qquad s, t \in \mathbb R .
$$

Each choice of the two parameters gives one; $s = 4$, $t = -3$ gives
$\begin{bmatrix} -\tfrac{15}{2} & 6 \\ -\tfrac{20}{3} & \tfrac{16}{3} \\ 4 & -3 \end{bmatrix}$.
:::
::::

```python
A = matrix(QQ, [[2, 0, 4], [0, 3, 5]])
aug = A.augment(identity_matrix(2))
aug.rref()                                       # [1 0 2 1/2 0; 0 1 5/3 0 1/3]
s, t = var('s, t')
b_0 = vector(SR, [1/2 - 2*s, -5/3*s, s])
b_1 = vector(SR, [-2*t, 1/3 - 5/3*t, t])
B = column_matrix([b_0, b_1])
A * B                                            # [1 0; 0 1] for every s, t
B.subs(s == 4, t == -3)                          # [-15/2 6; -20/3 16/3; 4 -3]
```

### When a right inverse exists

::::theorem[Right inverses and spanning columns]
An $m \times n$ matrix $A$ has a right inverse if and only if the columns of $A$ span $\mathbb R^m$. If $B$ is
a right inverse, then $\mathbf x = B\mathbf u$ solves $A\mathbf x = \mathbf u$ for every $\mathbf u \in \mathbb R^m$.

:::proof
The columns of $A$ span $\mathbb R^m$ exactly when $A\mathbf x = \mathbf u$ is consistent for every $\mathbf u \in \mathbb R^m$.

($\Rightarrow$) Let $B$ be a right inverse. For any $\mathbf u$, associativity gives

$$
A(B\mathbf u) = (AB)\mathbf u = I_m\mathbf u = \mathbf u ,
$$

so $B\mathbf u$ is a solution, every system is consistent, and the columns span $\mathbb R^m$.

($\Leftarrow$) If the columns span $\mathbb R^m$, then in particular each $A\mathbf x = \mathbf e_j$ has a solution $\mathbf b_j$, and
$B = [\,\mathbf b_0 \ \cdots \ \mathbf b_{m-1}\,]$ is a right inverse.
:::
::::

::::corollary[Right inverses and independent rows]
An $m \times n$ matrix $A$ has a right inverse if and only if its rows are linearly independent.

:::proof
The rows are independent exactly when the RREF of $A$ has no zero row, that is, a pivot in every
row. A pivot in every row is exactly the condition for $A\mathbf x = \mathbf u$ to be consistent for every
$\mathbf u \in \mathbb R^m$, which by the theorem means a right inverse exists.
:::
::::

::::corollary[Tall matrices have no right inverse]
If $m > n$ (more rows than columns), an $m \times n$ matrix has no right inverse.

:::proof
Each pivot of the RREF sits in its own row and its own column, so there are at most
$\min(m, n) = n < m$ pivots. Some row has no pivot, and the columns cannot span $\mathbb R^m$.
:::
::::

In rank terms: a right inverse exists exactly when $\mathrm{rank}(A) = m$, the number of rows.

## Left inverses

### Definition

:::definition[Left inverse]
A **left inverse** of an $m \times n$ matrix $A$ is an $n \times m$ matrix $B$ with $BA = I_n$.
:::

::::example[Two left inverses of one matrix]
Find left inverses of $A = \begin{bmatrix} 1 & 0 \\ 0 & 1 \\ 1 & 1 \end{bmatrix}$.

:::solution
$A$ is $3 \times 2$, so a left inverse is $2 \times 3$. Both of these work:

$$
\begin{bmatrix} 1 & 0 & 0 \\ 0 & 1 & 0 \end{bmatrix}\begin{bmatrix} 1 & 0 \\ 0 & 1 \\ 1 & 1 \end{bmatrix} = I_2
\qquad
\begin{bmatrix} 0 & -1 & 1 \\ 1 & 2 & -1 \end{bmatrix}\begin{bmatrix} 1 & 0 \\ 0 & 1 \\ 1 & 1 \end{bmatrix} = I_2 .
$$
:::
::::

Every matrix in this example is the transpose of one in the first right-inverse example. That is
no accident: transposing $BA = I_n$ gives $A^{\mathrm T}B^{\mathrm T} = I_n^{\mathrm T} = I_n$, because the transpose reverses
products.

:::theorem[Left inverses are transposed right inverses]
$B$ is a left inverse of $A$ if and only if $B^{\mathrm T}$ is a right inverse of $A^{\mathrm T}$.
:::

So a left inverse is computed by finding a right inverse of $A^{\mathrm T}$ and transposing it.

::::example[All left inverses of a 3 × 2 matrix]
Find every left inverse of $A = \begin{bmatrix} 2 & 0 \\ 0 & 3 \\ 4 & 5 \end{bmatrix}$.

:::solution
$A^{\mathrm T} = \begin{bmatrix} 2 & 0 & 4 \\ 0 & 3 & 5 \end{bmatrix}$ is the matrix of the last right-inverse example. Transposing its right
inverses gives the left inverses of $A$:

$$
B = \begin{bmatrix} \tfrac12 - 2s & -\tfrac53 s & s \\ -2t & \tfrac13 - \tfrac53 t & t \end{bmatrix}, \qquad s, t \in \mathbb R .
$$
:::
::::

```python
A = column_matrix(QQ, [[2, 0, 4], [0, 3, 5]])    # columns given: A is 3 x 2
s, t = var('s, t')
B_transpose = column_matrix(SR, [[1/2 - 2*s, -5/3*s, s],
                                 [-2*t, 1/3 - 5/3*t, t]])   # right inverses of A^T
B = B_transpose.transpose()
B * A                                            # [1 0; 0 1]
```

### When a left inverse exists

Everything about right inverses now transfers through the transpose, with rows and columns
exchanged.

::::theorem[Left inverses and spanning rows]
An $m \times n$ matrix $A$ has a left inverse if and only if the rows of $A$ span $\mathbb R^n$.

:::proof
$A$ has a left inverse exactly when $A^{\mathrm T}$ has a right inverse, which happens exactly when the
columns of $A^{\mathrm T}$ span $\mathbb R^n$. The columns of $A^{\mathrm T}$ are the rows of $A$.
:::
::::

::::corollary[Wide matrices have no left inverse]
If $n > m$ (more columns than rows), an $m \times n$ matrix has no left inverse.

:::proof
$A^{\mathrm T}$ is $n \times m$ with more rows than columns, so it has no right inverse, and $A$ has no left
inverse.
:::
::::

A left inverse says nothing about whether a system can be solved, but it does say how many
solutions there are.

::::theorem[A left inverse gives uniqueness]
Let $B$ be a left inverse of the $m \times n$ matrix $A$. If $A\mathbf x = \mathbf b$ is consistent, it has exactly one
solution, namely $\mathbf x = B\mathbf b$.

:::proof
Let $\mathbf u$ and $\mathbf v$ both solve the system, so $A\mathbf u = A\mathbf v = \mathbf b$. Multiply on the left by $B$:

$$
(BA)\mathbf u = (BA)\mathbf v = B\mathbf b \;\Longrightarrow\; I_n\mathbf u = I_n\mathbf v = B\mathbf b \;\Longrightarrow\; \mathbf u = \mathbf v = B\mathbf b .
$$
:::
::::

:::caution[A left inverse does not make every system consistent]
With $A = \begin{bmatrix} 1 & 0 \\ 0 & 1 \\ 1 & 1 \end{bmatrix}$ and its left inverse $B = \begin{bmatrix} 1 & 0 & 0 \\ 0 & 1 & 0 \end{bmatrix}$, take $\mathbf b = (0, 0, 1)$.
Then $B\mathbf b = (0, 0)$, but $A(0, 0) = (0, 0, 0) \neq \mathbf b$: the system $A\mathbf x = \mathbf b$ has no solution at all.
$B\mathbf b$ is the solution only when there is one, so check it by computing $A(B\mathbf b)$.
:::

::::theorem[Left inverses and independent columns]
An $m \times n$ matrix $A$ has a left inverse if and only if its columns are linearly independent.

:::proof
The columns are independent exactly when $A\mathbf x = \mathbf 0$ has only the solution $\mathbf x = \mathbf 0$.

($\Rightarrow$) $A\mathbf x = \mathbf 0$ is always consistent ($\mathbf x = \mathbf 0$ solves it), so by the previous theorem its
only solution is $B\mathbf 0 = \mathbf 0$.

($\Leftarrow$) If the columns of $A$ are independent, the rows of $A^{\mathrm T}$ are, so $A^{\mathrm T}$ has a right inverse
$C$ with $A^{\mathrm T}C = I_n$. Transposing, $C^{\mathrm T}A = I_n$, and $C^{\mathrm T}$ is a left inverse of $A$.
:::
::::

In rank terms: a left inverse exists exactly when $\mathrm{rank}(A) = n$, the number of columns.

:::insight
A right inverse is about **existence** (every system has a solution: the columns span); a left
inverse is about **uniqueness** (no system has two: the columns are independent). Tall matrices
can have only the second, wide matrices only the first.
:::

## Invertible square matrices

### One-sided inverses of a square matrix

For a square matrix, the inverse of the previous unit is a matrix that is both a left and a right
inverse. Three questions follow: can a square matrix have a left inverse but no right inverse, or
the other way round, and can its left and right inverses differ? The answer to all three is no.

::::theorem[One-sided inverses of square matrices]
Let $A$ be $n \times n$.
1. If $A$ has a left inverse, it has a right inverse.
2. If $A$ has a right inverse, it has a left inverse.
3. If $B$ is a left inverse and $C$ a right inverse of $A$, then $B = C$, and this matrix is $A^{-1}$.

:::proof
1. A left inverse makes the columns independent, so the RREF of $A$ has a pivot in every
   column. $A$ is square, so the RREF is $I_n$, which also has a pivot in every row: the columns
   span $\mathbb R^n$ and $A$ has a right inverse.
2. If $C$ is a right inverse of $A$, then $C^{\mathrm T}$ is a left inverse of $A^{\mathrm T}$. By (1), $A^{\mathrm T}$ has a right
   inverse $D$, and $D^{\mathrm T}$ is a left inverse of $A$.
3. By associativity,

   $$
   C = I_nC = (BA)C = B(AC) = BI_n = B .
   $$
:::
::::

So for a square matrix it is enough to check **one** of $AB = I_n$ and $BA = I_n$; the other follows.

### The invertible matrix theorem

Collecting what was proved about left and right inverses, and adding the determinant from the
previous unit, gives one list.

:::theorem[Invertible matrix theorem]
For an $n \times n$ matrix $A$, the following are equivalent: if one is true, all are.

1. $A$ is invertible.
2. $A$ has a right inverse.
3. $A$ has a left inverse.
4. $A\mathbf x = \mathbf b$ is consistent for every $\mathbf b \in \mathbb R^n$; that is, $\mathrm{col}(A) = \mathbb R^n$.
5. $A\mathbf x = \mathbf 0$ has only the solution $\mathbf x = \mathbf 0$; that is, $\ker(A) = \{\mathbf 0\}$.
6. $\mathrm{rank}(A) = n$.
7. The RREF of $A$ is $I_n$.
8. The rows of $A$ are linearly independent.
9. The columns of $A$ are linearly independent.
10. The rows of $A$ span $\mathbb R^n$.
11. $\det(A) \neq 0$.
:::

Items 2, 4, 8 are the right-inverse conditions, items 3, 9, 10 the left-inverse ones, and the
theorem on one-sided inverses joins the two groups. Item 11 is the determinant test of the
previous unit.

::::corollary[Solving with the inverse]
If $A$ is invertible, the system $A\mathbf x = \mathbf b$ has exactly one solution, $\mathbf x = A^{-1}\mathbf b$.

:::proof
$A(A^{-1}\mathbf b) = I_n\mathbf b = \mathbf b$, so $A^{-1}\mathbf b$ is a solution. Every solution is one particular solution
plus an element of the kernel (unit 3), and $\ker(A) = \{\mathbf 0\}$, so there is no other.
:::
::::

### Computing the inverse by row reduction

The inverse of a square matrix is in particular a right inverse, so the method of the first part
computes it. Since the RREF of an invertible $A$ is $I_n$, there are no free variables, and the
solutions of the $n$ systems are simply the columns of the right block.

:::theorem[Inverse by row reduction]
For an invertible $n \times n$ matrix $A$, the RREF of $[\,A \mid I_n\,]$ is $[\,I_n \mid A^{-1}\,]$.
:::

::::example[Inverting a 4 × 4 matrix]
Find the inverse of $A = \begin{bmatrix} 5 & 1 & -2 & 0 \\ 2 & -1 & 0 & -1 \\ -1 & -1 & 0 & 0 \\ 1 & 1 & -2 & -4 \end{bmatrix}$.

:::solution
Row reduce $[\,A \mid I_4\,]$:

$$
\left[\begin{array}{cccc|cccc}
5 & 1 & -2 & 0 & 1 & 0 & 0 & 0 \\
2 & -1 & 0 & -1 & 0 & 1 & 0 & 0 \\
-1 & -1 & 0 & 0 & 0 & 0 & 1 & 0 \\
1 & 1 & -2 & -4 & 0 & 0 & 0 & 1
\end{array}\right]
$$

to

$$
\left[\begin{array}{cccc|cccc}
1 & 0 & 0 & 0 & \tfrac1{16} & \tfrac14 & -\tfrac14 & -\tfrac1{16} \\
0 & 1 & 0 & 0 & -\tfrac1{16} & -\tfrac14 & -\tfrac34 & \tfrac1{16} \\
0 & 0 & 1 & 0 & -\tfrac38 & \tfrac12 & -1 & -\tfrac18 \\
0 & 0 & 0 & 1 & \tfrac3{16} & -\tfrac14 & \tfrac14 & -\tfrac3{16}
\end{array}\right] .
$$

The left block is $I_4$, so $A$ is invertible and the right block is $A^{-1}$. Checking $AA^{-1} = I_4$
is enough, since a one-sided inverse of a square matrix is two-sided.
:::
::::

```python
A = matrix(QQ, [[5, 1, -2, 0], [2, -1, 0, -1], [-1, -1, 0, 0], [1, 1, -2, -4]])
aug_rref = A.augment(identity_matrix(4)).rref()
A_inv = aug_rref[[0, 1, 2, 3], [4, 5, 6, 7]]     # the right 4 x 4 block
A_inv            # [1/16 1/4 -1/4 -1/16; -1/16 -1/4 -3/4 1/16; -3/8 1/2 -1 -1/8; 3/16 -1/4 1/4 -3/16]
A * A_inv == identity_matrix(4), A_inv * A == identity_matrix(4)   # (True, True)
A.inverse() == A_inv                             # True
```

:::caution[When the left block is not the identity]
If the left block of the RREF is not $I_n$, then $A$ is not invertible (item 7), and the right block
is not an inverse of anything. For $A = \begin{bmatrix} 1 & 2 \\ 2 & 4 \end{bmatrix}$,

$$
\left[\begin{array}{cc|cc} 1 & 2 & 1 & 0 \\ 2 & 4 & 0 & 1 \end{array}\right]
\sim
\left[\begin{array}{cc|cc} 1 & 2 & 0 & \tfrac12 \\ 0 & 0 & 1 & -\tfrac12 \end{array}\right] :
$$

the zero row on the left against a nonzero row on the right makes the systems inconsistent.
:::

:::insight
For a square matrix, one row reduction answers both questions at once: the left block says
whether $A$ is invertible, and when it is, the right block is the inverse.
:::

:::equations
- *Right inverse*: $AB = I_m$; exists $\iff$ columns span $\mathbb R^m$ $\iff$ rows independent $\iff$ $\mathrm{rank}(A) = m$; then $A(B\mathbf u) = \mathbf u$.
- *Left inverse*: $BA = I_n$; exists $\iff$ columns independent $\iff$ rows span $\mathbb R^n$ $\iff$ $\mathrm{rank}(A) = n$; a consistent $A\mathbf x = \mathbf b$ has the one solution $B\mathbf b$.
- *Transpose*: $B$ is a left inverse of $A$ $\iff$ $B^{\mathrm T}$ is a right inverse of $A^{\mathrm T}$.
- *Square*: one-sided inverse $\Rightarrow$ two-sided; $A$ invertible $\iff \det(A) \neq 0$; $\mathbf x = A^{-1}\mathbf b$.
- *Computing*: $[\,A \mid I_n\,] \sim [\,I_n \mid A^{-1}\,]$.
:::

## Further reading

- [MIT 18.06 — Multiplication and inverse matrices](https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/resources/lecture-3-multiplication-and-inverse-matrices/) — the column reading of the product and Gauss–Jordan on $[\,A \mid I\,]$, in one lecture.
- [3Blue1Brown — Inverse matrices, column space and null space](https://www.3blue1brown.com/lessons/inverse-matrices) — what invertibility means geometrically.
- [SageMath matrix methods](https://doc.sagemath.org/html/en/reference/matrices/sage/matrix/matrix2.html) — `augment`, `rref`, `inverse`, `solve_right`, `solve_left`.
