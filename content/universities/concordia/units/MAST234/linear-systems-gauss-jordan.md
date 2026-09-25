---
title: Linear systems and the Gauss–Jordan method
order: 1
status: detailed
weeks: [1]
introduces:
  - {concept: computer-algebra-system, perspective: "SageMath as the course's calculator: exact matrices over QQ, symbolic entries over SR"}
requires:
  - {concept: linear-system, strength: hard}
  - {concept: matrix, strength: hard}
reinforces:
  - {concept: linear-system, perspective: "row equivalence, uniqueness of the reduced row echelon form, Gauss–Jordan in SageMath"}
  - {concept: matrix, perspective: "augmented matrices"}
---

Review of solving linear systems, now with the matrix machinery made explicit: augmented
matrices, the three elementary row operations, row echelon and reduced row echelon form,
free variables, and doing all of it in SageMath.

## Linear equations and linear systems

A **linear equation** in the unknowns $x_0, \dots, x_{n-1}$ is $a_0 x_0 + \cdots + a_{n-1} x_{n-1} = b$
with constant coefficients. A **linear system** is a collection of $m$ such equations; a
**solution** is one choice of values for the unknowns that satisfies all $m$ equations at once.
(The course indexes from $0$ throughout, matching SageMath.)

:::definition[Consistent and inconsistent systems]
A system is **consistent** if it has at least one solution and
**inconsistent** if it has none.
:::

In $\mathbb R^2$ each equation is a line, so two equations can meet in one point (unique
solution), be parallel (no solution), or coincide (infinitely many solutions). These are the only
three possibilities for any linear system, however large.

::::example[Checking a solution]
Is $(1, 3, 2)$ a solution of the system
$3x - 2y + 5z = 7$, $\;x + 4y - 3z = 7$, $\;6x - 4y + 2z = -2$, $\;x + 2y + z = 9$?

:::solution
Substitute into every equation: $3 - 6 + 10 = 7$, $\;1 + 12 - 6 = 7$, $\;6 - 12 + 4 = -2$,
$\;1 + 6 + 2 = 9$. All four hold, so yes. In Sage the equations are objects and `.subs()` does
the substitution (the code below).
:::
::::

```python
x, y, z = var("x,y,z")
eq0 = 3*x - 2*y + 5*z == 7
eq0.subs(x==1, y==3, z==2)      # 7 == 7
```

A triangular system is solved by working upward: the last equation gives $x_2$, the one above
gives $x_1$, and so on. Sage lets you do this by manipulating the equations themselves —
`(eq1 - eq2)/4` is again an equation.

## Matrix form and the augmented matrix

Collecting the coefficients turns the system into $A\mathbf x = \mathbf b$: $A$ is the
$m \times n$ **coefficient matrix**, $\mathbf x$ the column of unknowns, $\mathbf b$ the
column of right-hand sides. Since elimination only ever touches the numbers, we work with the
**augmented matrix** $[A \mid \mathbf b]$, which is $A$ with $\mathbf b$ glued on as a last column.

```python
A = matrix(QQ, [[3,2,-5],[0,4,1],[0,0,-2]])
b = vector(QQ, [-1,14,-4])
M = A.augment(b)                 # the augmented matrix [A | b]
```

`QQ` means the entries are exact rational numbers; use `SR` (the symbolic ring) when entries
are symbols.

## Elementary row operations and row equivalence

Two systems are **equivalent** if they have the same solution set. Three operations on the
rows of an augmented matrix produce an equivalent system every time:

| operation | notation | SageMath |
|---|---|---|
| swap rows $j$ and $k$ | $\mathbf r_j \leftrightarrow \mathbf r_k$ | `A.swap_rows(j, k)` |
| scale a row by $c \ne 0$ | $c\,\mathbf r_j \to \mathbf r_j$ | `A.rescale_row(j, c)` |
| add a multiple of one row to another | $c\,\mathbf r_j + \mathbf r_k \to \mathbf r_k$ | `A.add_multiple_of_row(k, j, c)` |

These methods modify the matrix in place, so make a copy first (`B = copy(A)`) if you want to
keep the original.

:::definition[Row equivalence]
$A$ and $B$ are **row equivalent**, written $A \sim B$, if one can be turned
into the other by finitely many elementary row operations.
:::

Every row operation is reversible (swap again, scale by $1/c$, subtract the multiple), so row
equivalence is symmetric.

::::theorem[Row operations preserve the solution set]
If $[A \mid \mathbf b] \sim [B \mid \mathbf c]$ then $A\mathbf x = \mathbf b$ and $B\mathbf x = \mathbf c$ are
equivalent systems.

:::proof
A solution of the original system satisfies every row-equation, hence any scalar multiple of a
row and any sum of two rows. So it satisfies every system reachable by row operations, and
reversibility gives the converse.
:::
::::

## Row echelon and reduced row echelon form

:::definition[Row echelon form, reduced row echelon form]
A matrix is in **row echelon form** if all-zero rows are at the bottom and
each row's first nonzero entry (its **pivot**) sits strictly to the right of the pivot above it.
It is in **reduced row echelon form (RREF)** if additionally every pivot is $1$ and every
other entry in a pivot column is $0$.
:::

An augmented matrix in echelon form is solved by back substitution; in reduced form the
solution can simply be read off. A matrix has many echelon forms but only one reduced one:

:::theorem[Uniqueness of the reduced row echelon form]
Two matrices are row equivalent if and only if they have the same reduced row
echelon form. In particular the RREF of a matrix is unique.
:::

:::steps[The Gauss–Jordan algorithm]
1. Find the leftmost column with a nonzero entry; swap that entry's row to the top.
2. Scale the top row so its pivot is $1$.
3. Use the top row to clear every other entry of the pivot column.
4. Repeat on the rows below (and, for the reduced form, clear above each new pivot too).
:::

```python
A = matrix(QQ, [[0,0,-3,6,-3],[2,-4,1,0,5],[1,-2,2,-3,4]])
B = copy(A)
B.swap_rows(0, 1)
B.rescale_row(0, 1/2)
B.add_multiple_of_row(2, 0, -1)
B.rescale_row(1, -1/3)
B.add_multiple_of_row(0, 1, -1/2)
B.add_multiple_of_row(2, 1, -3/2)
B == A.rref()                    # True: the by-hand reduction matches Sage's rref()
```

:::note
Do a long reduction in a single cell, adding one line at a time, and `show()` the
result after each step. It is faster and less error-prone than one cell per operation.
:::

## Free variables and infinitely many solutions

When the RREF has fewer pivots than unknowns, some columns have no pivot. The unknowns in
those columns are **free variables**: they can take any value, and the pivot variables are
then determined by them.

::::example[Free variables]
Solve $A\mathbf x = \mathbf b$ for

$$
A = \begin{bmatrix} 1 & -2 & -1 & 3 \\ 2 & -4 & 1 & 0 \\ 1 & -2 & 2 & -3 \end{bmatrix} \qquad \mathbf b = (1, 5, 4) .
$$

:::solution
The RREF of $[A \mid \mathbf b]$ encodes $x_0 - 2x_1 + x_3 = 2$ and $x_2 - 2x_3 = 1$. Columns $1$
and $3$ carry no pivot, so $x_1, x_3$ are free and

$$
\mathbf x = \begin{bmatrix} 2 + 2x_1 - x_3 \\ x_1 \\ 1 + 2x_3 \\ x_3 \end{bmatrix}
= \begin{bmatrix} 2 \\ 0 \\ 1 \\ 0 \end{bmatrix} + x_1 \begin{bmatrix} 2 \\ 1 \\ 0 \\ 0 \end{bmatrix} + x_3 \begin{bmatrix} -1 \\ 0 \\ 2 \\ 1 \end{bmatrix} .
$$
:::
::::

```python
x1, x3 = var("x1,x3")
sol = vector(SR, [2 + 2*x1 - x3, x1, 1 + 2*x3, x3])
A * sol                          # (1, 5, 4) for every x1, x3
sol.subs(x1 == pi, x3 == sqrt(2))
```

Multiplying $A$ by the symbolic solution vector returns $\mathbf b$ identically — a one-line
check that the parametrisation is right.

## When consistency depends on a parameter

If the augmented matrix contains symbols, `rref()` cannot decide which expressions are zero,
so reduce by hand with the row-operation methods and stop at echelon form. A row of the shape
$[\,0 \; \cdots \; 0 \mid e\,]$ then says: the system is consistent exactly when $e = 0$.

::::example[Consistency depending on parameters]
For which $(a, b)$ is the system with augmented matrix
$\begin{bmatrix} -1 & 2 & b \\ 2 & 0 & -5 \\ 1 & 2a & -1 \end{bmatrix}$ consistent?

:::solution
Reduce by hand to echelon form: the last row becomes $0 = -\tfrac12 (a+1)(2b-5) + b - 1$, so the
system has a solution only for $(a, b)$ on that curve; `solve(eqn, a, b)` returns it as
$a = 3/(2b - 5)$. Picking $b = 4$ gives $a = 1$, and `rref()` of the numeric matrix confirms a
unique solution.
:::
::::

:::insight
Row operations never change the solution set, and the reduced row echelon
form is unique — so "solve the system" means "compute the RREF and read it": pivot columns are
determined variables, non-pivot columns are free, and a pivot in the augmented column means
inconsistent.
:::

:::equations
- *Augmented matrix*: $[A \mid \mathbf b]$ — the coefficient matrix with the right-hand side as an extra column.
- *Row equivalence*: $A \sim B$ — reachable by elementary row operations; same RREF.
- *Free variables*: $\#\text{free} = n - \#\text{pivots}$ — unknowns in non-pivot columns.
:::

## Further reading

- [SageMath matrix methods](https://doc.sagemath.org/html/en/reference/matrices/sage/matrix/matrix2.html) — `rref`, `augment`, `swap_rows`, `rescale_row`, `add_multiple_of_row`.
