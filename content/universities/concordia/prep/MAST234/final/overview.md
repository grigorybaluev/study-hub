---
title: The big picture
---

## One idea, seen three times

Linear algebra studies what can be done with **adding and scaling**, and it has one working method: turn the question into columns of numbers and row reduce.
The course says this three times, each time about something more general.

- **Matrices and systems** (weeks 1–5): a system $A\mathbf x=\mathbf b$ is a question about the columns of $A$. Pivots decide whether it has a solution and how many. Rank, kernel, inverses and determinants are all ways of reading this.
- **Spaces and maps** (weeks 6–9): the same ideas without the numbers. A vector space is anything that can be added and scaled, a basis turns it into $\mathbb R^n$, and a linear map turns into a matrix.
- **Eigenvalues** (weeks 10–12): the best choice of basis. Complex numbers make sure that the eigenvalues exist, and a basis of eigenvectors makes a map diagonal, so its powers and its long-term behaviour can be read off.

:::insight[The pictures to keep in mind]
- **A matrix is its columns.** $A\mathbf x$ is a combination of the columns, and $A\mathbf e_j$ is column $j$.
- **Existence and uniqueness are two questions.** Spanning columns give at least one solution, and independent columns give at most one. Only a square matrix can have both.
- **A basis is a language.** Coordinates are what a vector is called in it, and a transition matrix is the dictionary.
- **A map does not depend on the basis; its matrix does.** Rank, determinant, trace and eigenvalues belong to the map.
- **An eigenvector is a direction on which the map is a number.** In a basis of eigenvectors, everything is $n$ separate one-dimensional problems.
:::

The **Map** tab draws these as two conversion maps: from a description of a subspace to coordinates, and from the rule of a linear map to its powers. Every arrow says how it is done by hand and in Sage.

## Working in SageMath

The outline says that the final is written in SageMath, so each problem type shows the commands next to the mathematics. These are the ones that do most of the work.

| Task | Command |
|---|---|
| a matrix with exact entries | `A = matrix(QQ, [[1, 2], [3, 4]])` |
| vectors as columns | `column_matrix(QQ, [[1, 2], [3, 4]])` |
| a vector, a variable | `vector(QQ, [1, 2])`, `k = var('k')` |
| add a column | `A.augment(b)` |
| RREF, pivots, rank | `A.rref()`, `A.pivots()`, `A.rank()` |
| solve one system | `A.solve_right(b)` |
| kernel, image | `A.right_kernel().basis()`, `[A.column(j) for j in A.pivots()]` |
| determinant, inverse, trace | `det(A)`, `A.inverse()`, `A.trace()` |
| identity, diagonal | `identity_matrix(3)`, `diagonal_matrix(QQ, [1, 2])` |
| a map from a formula | `T(x, y) = (x + y, 2*x)` after `x, y = var('x, y')` |
| polynomials | `R.<x> = QQ[]`, `p.derivative()`, `p.factor()`, `p.padded_list(3)` |
| complex numbers | `I`, `z.conjugate()`, `abs(z)`, `arg(z)`, `p.roots(QQbar)` |
| characteristic polynomial | `A.charpoly()`, `A.charpoly().factor()` |
| eigenvalues and eigenvectors | `A.eigenvalues()`, `A.eigenvectors_right()` |
| diagonalize | `D, P = A.eigenmatrix_right()`, `A.is_diagonalizable()` |
| display | `show(A)`, and `.n()` for a decimal |

:::caution[Five habits that prevent wrong answers]
- Write `matrix(QQ, ...)`, not `matrix(...)`, and `SR` only when there is a variable in the matrix.
- Write `right_kernel` and `eigenvectors_right`: the default in Sage is the left version.
- With a parameter, do not call `rref()`: it assumes that the parameter never makes a pivot zero. Use `det`, or row operations one at a time.
- `is_diagonalizable()` over `QQ` looks only for rational eigenvectors. For the true answer, use `A.change_ring(QQbar)`.
- A computation is not an explanation. Write what the output means: "rank $3$, so a pivot in every column, so independent".
:::

## Systems, rank and the kernel

Weeks 1–3 · [Systems and Gauss–Jordan](/unit/MAST234/linear-systems-gauss-jordan), [Vectors, span and rank](/unit/MAST234/vectors-span-rank), [Independence and the kernel](/unit/MAST234/homogeneous-systems-linear-dependence)

Row operations do not change the solutions, and the RREF is unique, so everything can be read from it. The **rank** $r$ is the number of pivots. The system $A\mathbf x=\mathbf b$ is consistent exactly when $\mathbf b$ is in the column space, there are $n-r$
free variables, and all the solutions are one solution plus the kernel. Vectors are **independent** when the only combination giving zero is the trivial one: a pivot in every column.

## Matrices, determinants and inverses

Weeks 4–5 · [Multiplication and determinants](/unit/MAST234/matrix-operations-determinants), [Inverses](/unit/MAST234/matrix-inverse)

The product is defined so that $(AB)\mathbf x=A(B\mathbf x)$. It is associative, but it does not commute or cancel. A **right inverse** exists when the columns span, a **left inverse** when the columns are independent, and for a square matrix these are the same, which gives
the invertible matrix theorem: invertible, rank $n$, RREF $I_n$, independent columns, spanning columns, $\det\neq0$, and (from week 11) $0$ is not an eigenvalue.

## Linear transformations of R^n

Week 6 · [Linear transformations of R^n](/unit/MAST234/linear-transformations-rn)

A linear map respects sums and multiples. Each one is multiplication by a unique matrix, whose columns are $T(\mathbf e_j)$, and composition is the matrix product, with the first map on the right. Injective means independent columns (rank $n$), surjective means spanning columns (rank $m$).

## Vector spaces and subspaces

Week 7 · [General vector spaces and subspaces](/unit/MAST234/vector-spaces-subspaces)

The rules of addition and scaling become the definition, so polynomials, matrices and functions are vectors. A **subspace** contains $\mathbf 0$ and is closed under sums and multiples. Spans, kernels and column spaces always are subspaces, and an equation with a constant term or a square usually gives none.

## Basis, dimension, coordinates

Week 8 · [Basis, dimension, coordinates and transition matrices](/unit/MAST234/basis-coordinates-transition)

A **basis** is independent and spanning, so every vector is a unique combination of it. All bases have the same size, the **dimension**. Coordinates relative to a basis turn the space into $\mathbb R^n$, faithfully, and $P_{\mathcal C\leftarrow\mathcal B}$ converts between two bases. Its columns are the old basis
written in the new one.

## Linear maps of general spaces

Week 9 · [Linear transformations of general vector spaces](/unit/MAST234/linear-transformations-general)

The **kernel** and the **image** are subspaces, and **rank–nullity** says that their dimensions add up to the dimension of the domain. With bases on both sides, a map has a matrix whose columns are the images of the basis in coordinates. For an operator, a change of basis gives $P^{-1}AP$: a **similar** matrix, with the same
determinant, trace, rank and eigenvalues.

## Complex numbers

Week 10 · [Complex numbers](/unit/MAST234/complex-numbers)

$\mathbb C$ is the plane with a product: multiply the moduli and add the arguments. Dividing uses the conjugate, and powers and roots use the polar form. By the fundamental theorem of algebra, a polynomial of degree $n$ has $n$ roots in $\mathbb C$, and the non-real roots of a real polynomial come in conjugate pairs.

## Eigenvalues and eigenvectors

Week 11 · [Eigenvalues and eigenvectors](/unit/MAST234/eigenvalues-eigenvectors)

$A\mathbf v=\lambda\mathbf v$ with $\mathbf v\neq\mathbf 0$. The eigenvalues are the roots of $\det(\lambda I-A)$, and $E_\lambda=\ker(A-\lambda I)$. The eigenvalues add to the trace and multiply to the determinant. Geometric multiplicity is at most algebraic multiplicity, and for an operator the same steps run on its matrix.

## Diagonalization and dynamics

Week 12 · [Diagonalizable matrices and dynamical systems](/unit/MAST234/diagonalization)

$A=PDP^{-1}$ exactly when there are $n$ independent eigenvectors: $n$ distinct eigenvalues guarantee them, and otherwise every eigenspace must be as large as the algebraic multiplicity. Then $A^k=PD^kP^{-1}$, and the solution of $\mathbf x_{k+1}=A\mathbf x_k$ is $\sum_ic_i\lambda_i^k\mathbf v_i$, in which the largest $|\lambda_i|$ wins.
Numerically, eigenvalues come from iteration (the power method is the simplest), not from the characteristic polynomial.

## How it fits together

:::insight[Four ideas hold the course together]
- **Everything is a row reduction.** Independence, span, basis, kernel, image, coordinates, transition matrices and eigenvectors are all systems of linear equations.
- **Choose the basis that makes the question easy.** The standard basis for computing, an eigenbasis for powers.
- **Count first.** Dimensions and rank–nullity often settle a question before any computing starts.
- **The invertible matrix theorem is the hub.** Nearly every yes-or-no question about a square matrix is one of its items.
:::

What you can solve now:

- solve systems, with and without parameters, and describe all the solutions;
- compute and use inverses, one-sided inverses and determinants;
- test linearity, find standard matrices, compose maps, classify maps as injective or surjective;
- decide whether a set is a subspace; find bases and dimensions; extend independent sets;
- find coordinates, transition matrices, kernels and images, matrices of linear maps and similar matrices;
- compute with complex numbers, in both forms, and find all the roots of a polynomial;
- find eigenvalues and eigenspaces, diagonalize, compute powers, and describe where a system is heading.
