---
title: Vectors, span, and the rank of a matrix
order: 2
status: detailed
notes: ["Lecture notebook Week02.ipynb"]
weeks: [2]
textbook: "Nicholson, Linear Algebra with Applications (Lyryx open text), 1.2, 2.1-2.3"
introduces: [linear-combination-span, matrix-rank]
requires:
  - {concept: vector, strength: hard}
  - {concept: matrix, strength: hard}
  - {concept: dot-product, strength: hard}
  - {concept: linear-system, strength: hard}
  - {concept: computer-algebra-system, strength: hard}
reinforces:
  - {concept: vector, perspective: "arithmetic in R^n, component-wise"}
  - {concept: dot-product, perspective: "as the row reading of Ax"}
  - {concept: matrix, perspective: "linearity of Ax; the row and column readings of a matrix-vector product"}
---

Vectors and matrices as objects with arithmetic, three ways to read a matrix–vector product,
and the idea that turns $A\mathbf x = \mathbf b$ into a question about span — which leads to
the column space and the rank of a matrix.

## Vectors in $\mathbb R^n$

A vector in $\mathbb R^n$ is an ordered list of $n$ real numbers, written as a row
$[x_0, \dots, x_{n-1}]$ or as a column. Both carry the same information; the context decides
which is convenient. Sage displays vectors as rows but treats them as columns wherever a
product needs it:

```python
x0, x1, x2 = var("x0,x1,x2")
x = vector(SR, [x0, x1, x2])
A = matrix(QQ, [[1,2,3],[4,5,6]])
A * x                            # (x0 + 2*x1 + 3*x2, 4*x0 + 5*x1 + 6*x2)
(A * x).column()                 # the same, displayed as a column
```

## Arithmetic in $\mathbb R^n$ and in $\mathbb R^{m \times n}$

Addition and scalar multiplication are **component-wise**: $\mathbf u + \mathbf v$ adds
matching entries, $c\,\mathbf u$ scales every entry. There is a zero vector, every vector has a
negative $-\mathbf x = (-1)\mathbf x$, and scalar multiplication distributes both ways:
$(c + d)\mathbf v = c\mathbf v + d\mathbf v$ and $c(\mathbf u + \mathbf v) = c\mathbf u + c\mathbf v$.

Exactly the same holds for $m \times n$ matrices, which form the set $\mathbb R^{m \times n}$:
equality, sum and scalar multiple are entry-wise, there is a zero matrix and a negative, and
the distributive laws hold. Sage checks such identities symbolically:

```python
c, d = var("c,d")
u = vector(SR, var("u0,u1,u2")); v = vector(SR, var("v0,v1,v2"))
(c + d)*v == c*v + d*v           # True
c*(u + v) == c*u + c*v           # True
```

## The dot product

> **Definition.** For $\mathbf u, \mathbf v \in \mathbb R^n$,
> $\mathbf u \cdot \mathbf v = \sum_{i=0}^{n-1} u_i v_i$ — two vectors in, one scalar out.

In Sage: `u.dot_product(v)`.

## Linearity of matrix–vector multiplication

Multiplying on the left by a fixed matrix $A \in \mathbb R^{m \times n}$ is a **linear**
operation: $A(\mathbf u + \mathbf v) = A\mathbf u + A\mathbf v$ and $A(c\mathbf v) = c(A\mathbf v)$.
This is the property that will define linear transformations later in the course.

## Linear combinations and span

> **Definition.** A **linear combination** of $\mathbf v_0, \dots, \mathbf v_{k-1}$ is any sum
> $c_0 \mathbf v_0 + \cdots + c_{k-1} \mathbf v_{k-1}$ with real coefficients. Their **span**,
> $\operatorname{span}(\mathbf v_0, \dots, \mathbf v_{k-1})$, is the set of all such sums.

Geometrically, the span of two non-parallel vectors in $\mathbb R^3$ is the plane through the
origin containing both; the span of one nonzero vector is a line.

## Three ways to read $A\mathbf x$

The entry-wise formula for $A\mathbf x$ is easy to compute with but hides why it is the right
definition. Two regroupings explain it.

**Row reading.** Write $A$ as a stack of row vectors $\mathbf r_0, \dots, \mathbf r_{m-1}$.
Then entry $i$ of $A\mathbf x$ is the dot product $\mathbf r_i \cdot \mathbf x$:
$$A\mathbf x = \begin{bmatrix} \mathbf r_0 \cdot \mathbf x \\ \vdots \\ \mathbf r_{m-1} \cdot \mathbf x \end{bmatrix}.$$

**Column reading.** Write $A = [\,\mathbf c_0 \; \cdots \; \mathbf c_{n-1}\,]$ by columns. Then
$$A\mathbf x = x_0 \mathbf c_0 + x_1 \mathbf c_1 + \cdots + x_{n-1} \mathbf c_{n-1}:$$
the product is the linear combination of the columns whose coefficients are the entries of
$\mathbf x$.

```python
A = matrix(QQ, [[1,2],[3,4],[5,6]]); x = vector(QQ, [7,-13])
r0 = vector(A[0,:]); c0 = vector(A[:,0]); c1 = vector(A[:,1])   # rows and columns of A
A*x == vector([vector(A[i,:]).dot_product(x) for i in range(3)])  # row reading
A*x == x[0]*c0 + x[1]*c1                                          # column reading
```

## $A\mathbf x = \mathbf b$ as a question about span

With the column reading, $A\mathbf x = \mathbf b$ asks: can $\mathbf b$ be written as a linear
combination of the columns of $A$? That is, is $\mathbf b \in \operatorname{span}(\mathbf c_0, \dots, \mathbf c_{n-1})$?

> **Definition.** The **column space** $\operatorname{col}(A)$ is the span of the columns of
> $A$ (a subset of $\mathbb R^m$); the **row space** $\operatorname{row}(A)$ is the span of the
> rows (a subset of $\mathbb R^n$).

> **Theorem.** $A\mathbf x = \mathbf b$ is consistent if and only if $\mathbf b \in \operatorname{col}(A)$.
> It is consistent for *every* $\mathbf b \in \mathbb R^m$ if and only if the columns of $A$
> span all of $\mathbb R^m$.

> **Example.** Is $[-1, 3, 7]$ a linear combination of $[4, 2, 7]$ and $[3, 1, 4]$? Put the two
> vectors as columns of $A$, augment with $\mathbf b$, and reduce:

```python
b = vector(QQ, [-1,3,7])
A = column_matrix(QQ, [[4,2,7],[3,1,4]])
A.augment(b).rref()              # [1 0 5; 0 1 -7; 0 0 0]  ->  b = 5 c0 - 7 c1
```

## The rank of a matrix

> **Definition.** The **rank** of $A \in \mathbb R^{m \times n}$ is the number of pivots (leading
> $1$s) in its reduced row echelon form — equivalently, the number of nonzero rows of the RREF.

Row equivalent matrices have the same RREF, so row operations never change the rank; and each
row and each column holds at most one pivot, so $\operatorname{rank}(A) \le \min(m, n)$. Sage
computes it with `rank(A)` or `A.rank()`.

Rank can depend on a parameter: replacing the top-left entry of a rank-$3$ matrix by a symbol
$u$ and reducing by hand shows the rank jumps to $4$ for every $u \ne 0$ — the original $u = 0$
was the special case.

> **Theorem.** If $\operatorname{rank}(A) = r$, the system $A\mathbf x = \mathbf b$ has exactly
> $n - r$ free variables.
>
> *Why.* Free variables are the non-pivot columns, and the pivot columns number $r$.

This is the first form of the rank–nullity theorem; the word *nullity* arrives with the null
space in the next unit.

> **Key insight.** Read $A\mathbf x$ column-wise and every question about solving a system
> becomes a question about span: consistency means $\mathbf b$ lies in the column space, and the
> rank counts how many directions the columns actually contribute — the rest are free variables.

**Equations**

- *Dot product*: $\mathbf u \cdot \mathbf v = \sum_i u_i v_i$ — scalar output.
- *Column reading*: $A\mathbf x = \sum_j x_j \mathbf c_j$ — a linear combination of the columns.
- *Consistency*: $A\mathbf x = \mathbf b$ solvable $\iff \mathbf b \in \operatorname{col}(A)$.
- *Free variables*: $n - \operatorname{rank}(A)$.

## Further reading

- [Nicholson, *Linear Algebra with Applications*, §1.2, §2.1–2.3](https://lyryx.com/linear-algebra-applications/) — matrix–vector products, span, rank.
