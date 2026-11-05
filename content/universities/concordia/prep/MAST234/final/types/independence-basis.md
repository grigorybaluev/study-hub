---
title: Independence, span, basis and dimension
order: 6
asks: test independence, decide whether a set spans or is a basis, find a basis and the dimension of a span
units: [vector-spaces-subspaces, basis-coordinates-transition]
method: linear-independence-test
---

## Logic

Everything becomes a question about pivots once the vectors are columns of numbers. Polynomials and matrices enter through their coefficient lists. A pivot in
every column means independent, a pivot in every row means they span, and the original vectors in the pivot positions are a basis of the span. If the dimension is known, half of the work disappears.

## Pattern

:::steps[Columns and pivots]
1. Write the vectors as coefficient lists in a fixed order, and make them the columns of $M$.
2. More vectors than the dimension: dependent. Fewer: they cannot span.
3. As many vectors as the dimension: $\det(M)\neq0$ means a basis.
4. Otherwise compute the RREF. Rank $=$ number of vectors: independent. Rank $=$ dimension: spanning.
5. A dependence relation is a kernel vector of $M$. A basis of the span is the set of pivot columns of the original $M$.
:::

## In Sage

```python
M = column_matrix(QQ, [[1, 1, 0], [1, 0, 1], [0, 1, 1]])    # 1 + x, 1 + x^2, x + x^2 in P_2
det(M)                                  # -2: a basis of P_2
N = column_matrix(QQ, [[1, 2, 0, 1], [2, 4, 1, 3], [0, 0, 1, 1], [1, 1, 1, 1]])
N.rank(), N.pivots()                    # (3, (0, 1, 3))
N.right_kernel().basis()                # [(1, -1/2, 1/2, 0)]: the coefficients of a dependence
```

To test whether $\mathbf b$ lies in the span, compare ranks: `M.rank() == M.augment(b).rank()`.

## Traps

:::caution[Traps]
- `matrix(QQ, [u, v])` puts vectors in the **rows** and `column_matrix` in the columns. For the pivot method, use columns.
- The basis of the span is made of original vectors, not columns of the RREF.
- For $\mathcal P_n$, each list has $n+1$ entries, and the zero coefficients must be written.
- Rows of the RREF give a basis of the **row** space, and it is a different kind of answer: read which space the question names.
- A set containing $\mathbf 0$ is always dependent.
:::

## Worked problems

```solution-map
id: four-vectors-independent
method: linear-independence-test
task: 'Are $(1,0,1,0)$, $(0,1,0,1)$, $(1,1,0,0)$ and $(0,0,1,2)$ independent in $\mathbb R^4$?'
steps:
  - node: count
    answer: no
    text: 'Four vectors with four entries each.'
  - node: obvious
    answer: no
    text: 'No zero vector, and no vector is a multiple of another.'
  - node: square
    answer: yes
    text: 'Four vectors in $\mathbb R^4$: the matrix of columns is square.'
  - node: det
    text: 'The determinant of the matrix with these columns is $-1$ (`det(column_matrix(QQ, [...]))`).'
  - node: nonzero
    answer: yes
    text: 'A nonzero determinant.'
  - node: independent
    text: 'They are independent, and so they are a basis of $\mathbb R^4$.'
```

::::exercise[A basis by counting]
Show that $1+x$, $1+x^2$, $x+x^2$ is a basis of $\mathcal P_2$, and write $p=3+x+2x^2$ in it.

:::solution
Their coefficient lists are the columns of $M=\begin{bmatrix}1&1&0\\1&0&1\\0&1&1\end{bmatrix}$, and $\det(M)=-2\neq0$. Three independent vectors in dimension $3$ form a basis.

Solving $M\mathbf c=(3,1,2)$ gives $\mathbf c=(1,2,0)$: indeed $(1+x)+2(1+x^2)=3+x+2x^2$.

```python
M = column_matrix(QQ, [[1, 1, 0], [1, 0, 1], [0, 1, 1]])
M.solve_right(vector(QQ, [3, 1, 2]))    # (1, 2, 0)
```
:::
::::

:::note[Pattern at work]
Step 3: the number of vectors equals the dimension, so no spanning check is needed.
:::

::::exercise[A basis of a span]
Let $\mathbf v_0=(1,2,0,1)$, $\mathbf v_1=(2,4,1,3)$, $\mathbf v_2=(0,0,1,1)$, $\mathbf v_3=(1,1,1,1)$. Find a basis of their span and a dependence relation.

:::solution
With these vectors as columns, the RREF has pivots in columns $0$, $1$ and $3$, so the rank is $3$ and $\mathbf v_0,\mathbf v_1,\mathbf v_3$ is a basis of the span.

The non-pivot column gives the relation: $\mathbf v_2=-2\mathbf v_0+\mathbf v_1$, as a direct check shows: $-2(1,2,0,1)+(2,4,1,3)=(0,0,1,1)$.

```python
N = column_matrix(QQ, [[1, 2, 0, 1], [2, 4, 1, 3], [0, 0, 1, 1], [1, 1, 1, 1]])
N.pivots()                              # (0, 1, 3)
N.right_kernel().basis()                # [(1, -1/2, 1/2, 0)]: v0 - 1/2 v1 + 1/2 v2 = 0
```
:::
::::

:::note[Pattern at work]
Step 5. Column $2$ of the RREF holds the coefficients of $\mathbf v_2$ on the pivot columns, which is why the columns are the right place for the vectors.
:::

::::exercise[A parameter]
For which $k$ are $(1,2,k)$, $(0,1,1)$, $(k,0,1)$ dependent?

:::solution
The determinant of the matrix with these columns is $1+2k-k^2$, so they are dependent for $k=1\pm\sqrt2$.

```python
k = var('k')
M = column_matrix(SR, [[1, 2, k], [0, 1, 1], [k, 0, 1]])
det(M).expand()                         # -k^2 + 2*k + 1
solve(det(M) == 0, k)                   # [k == -sqrt(2) + 1, k == sqrt(2) + 1]
```
:::
::::

:::note[Pattern at work]
Step 3 with a parameter: a determinant is safe with a variable in it, unlike `rref()`.
:::
