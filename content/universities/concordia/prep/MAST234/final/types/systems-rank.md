---
title: Linear systems, rank and the kernel
order: 1
asks: solve a system, decide consistency (with a parameter), find the rank, describe all the solutions
units: [linear-systems-gauss-jordan, vectors-span-rank, homogeneous-systems-linear-dependence]
method: linear-system
---

## Logic

One row reduction of the augmented matrix answers everything. A pivot in the last column means no
solution. Otherwise each non-pivot column of $A$ is a free variable, and the solutions are one particular
solution plus the kernel. The rank counts the pivots, and the column reading says that a system is consistent
exactly when $\mathbf b$ is a combination of the columns.

## Pattern

:::steps[One reduction]
1. Form $[\,A\mid\mathbf b\,]$ and compute its RREF.
2. A row $[\,0\ \cdots\ 0\mid c\,]$ with $c\neq0$: inconsistent. Stop.
3. Pivot columns are basic variables, the others are free. Number of free variables $=n-\mathrm{rank}(A)$.
4. Write the solutions as $\mathbf x=\mathbf x_p+s\,\mathbf k_0+t\,\mathbf k_1+\cdots$, with the $\mathbf k_i$ a basis of $\ker(A)$.
5. Check one solution in the original system.
:::

## In Sage

```python
A = matrix(QQ, [[1, 2, 1], [2, 5, 3], [1, 3, 2]])
b = vector(QQ, [4, 9, 5])
A.augment(b).rref()                     # [1 0 -1 2; 0 1 1 1; 0 0 0 0]
A.rank(), A.augment(b).rank()           # (2, 2): equal, so consistent
A.solve_right(b)                        # (2, 1, 0): one particular solution
A.right_kernel().basis()                # [(1, -1, 1)]
```

`matrix(QQ, ...)` keeps exact fractions. Use `SR` only when the entries contain a variable.

## Traps

:::caution[Traps]
- `A.kernel()` is the left kernel in Sage. The kernel of this course is `A.right_kernel()`.
- `A.solve_right(b)` returns **one** solution and hides the free variables. The full answer needs the kernel too.
- `rref()` over `SR` treats a parameter as if it were never zero, so it can hide the special values. With a parameter, do the row
  operations one at a time.
- Rows and columns count from $0$ in Sage.
:::

## Worked problems

::::exercise[A system with a free variable]
Solve $x_0+2x_1+x_2=4$, $\ 2x_0+5x_1+3x_2=9$, $\ x_0+3x_1+2x_2=5$.

:::solution
The RREF of the augmented matrix is $\begin{bmatrix}1&0&-1&2\\0&1&1&1\\0&0&0&0\end{bmatrix}$. There is no pivot in the last column, so it is consistent.
$x_2=t$ is free, $x_0=2+t$, $x_1=1-t$:

$$
\mathbf x=(2,1,0)+t\,(1,-1,1) , \qquad t\in\mathbb R .
$$

The rank is $2$, and the $1$ free variable agrees with $n-r=3-2$.
:::
::::

:::note[Pattern at work]
Steps 2–4: no bad row, one non-pivot column, one parameter. The vector $(1,-1,1)$ is exactly what `A.right_kernel()` prints.
:::

::::exercise[A parameter]
For which $k$ is the system $x+y+z=1$, $\ x+2y+3z=2$, $\ x+3y+5z=k$ consistent? Give the solutions for that $k$.

:::solution
Subtract row $0$ from rows $1$ and $2$, then twice the new row $1$ from row $2$:

$$
\left[\begin{array}{ccc|c}1&1&1&1\\1&2&3&2\\1&3&5&k\end{array}\right]\sim\left[\begin{array}{ccc|c}1&1&1&1\\0&1&2&1\\0&0&0&k-3\end{array}\right] .
$$

The last row is bad unless $k=3$. For $k=3$: $z=t$, $y=1-2t$, $x=t$, that is $\mathbf x=(0,1,0)+t\,(1,-2,1)$.

```python
k = var('k')
M = matrix(SR, [[1, 1, 1, 1], [1, 2, 3, 2], [1, 3, 5, k]])
M.add_multiple_of_row(1, 0, -1)         # row 1 gets row 1 - row 0
M.add_multiple_of_row(2, 0, -1)
M.add_multiple_of_row(2, 1, -2)
M                                       # last row: 0 0 0 k - 3
M.subs(k == 3).change_ring(QQ).rref()   # [1 0 -1 0; 0 1 2 1; 0 0 0 0]
```
:::
::::

:::note[Pattern at work]
Row operations by hand on an `SR` matrix keep the entry $k-3$ visible. Calling `rref()` on it would divide by $k-3$ and report a pivot, and the special value would vanish.
:::
