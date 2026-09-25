---
title: Linear independence, homogeneous systems and the kernel
order: 3
status: detailed
weeks: [3]
introduces: [linear-independence]
requires:
  - {concept: linear-combination-span, strength: hard}
  - {concept: matrix-rank, strength: hard}
  - {concept: linear-system, strength: hard}
  - {concept: computer-algebra-system, strength: soft}
reinforces:
  - {concept: matrix-rank, perspective: "the kernel (null space): pivots decide whether it is only the zero vector"}
---

When is a set of vectors *redundant* — could one of them be built from the others? The question
turns into a homogeneous linear system, $A\mathbf c = \mathbf 0$, and the answer is read off the
pivots of the RREF. The solutions of that system form the **kernel** of $A$, which also describes
every solution of $A\mathbf x = \mathbf b$ once one solution is known.

## Linear independence

:::definition[Linear independence, linear dependence]
Vectors $\mathbf v_0, \mathbf v_1, \dots, \mathbf v_{k-1} \in \mathbb R^n$ are **linearly independent** if the
only solution of

$$
c_0 \mathbf v_0 + c_1 \mathbf v_1 + \cdots + c_{k-1} \mathbf v_{k-1} = \mathbf 0
$$

is the trivial one, $c_0 = c_1 = \cdots = c_{k-1} = 0$. Otherwise they are **linearly dependent**:
some *nontrivial* combination (not all $c_i$ zero) gives the zero vector.
:::

::::example[Two and three vectors in $\mathbb R^2$]
Let $\mathbf u = [1, 0]$, $\mathbf v = [0, 1]$ and $\mathbf w = [2, -5]$. Is $\{\mathbf u, \mathbf v\}$ independent?
Is $\{\mathbf u, \mathbf v, \mathbf w\}$?

:::solution
$c_0 \mathbf u + c_1 \mathbf v = [c_0, c_1]$, which is $\mathbf 0$ only for $c_0 = c_1 = 0$: $\{\mathbf u, \mathbf v\}$ is
independent.

For the three vectors, $c_0 = -2$, $c_1 = 5$, $c_2 = 1$ works:
$-2[1, 0] + 5[0, 1] + [2, -5] = [0, 0]$. A nontrivial solution exists, so $\{\mathbf u, \mathbf v, \mathbf w\}$ is
dependent. Spotting such a combination by eye does not scale; the next example does it
systematically.
:::
::::

### Deciding with row reduction

The equation $c_0 \mathbf v_0 + \cdots + c_{k-1} \mathbf v_{k-1} = \mathbf 0$ is the homogeneous system
$A\mathbf c = \mathbf 0$ with $A = [\,\mathbf v_0 \ \mathbf v_1 \ \cdots \ \mathbf v_{k-1}\,]$ — the vectors as columns. So:
put the vectors in the columns, row reduce, and look for free variables.

::::example[Three vectors in $\mathbb R^3$]
Are $\mathbf v_0 = [3, 7, 4]$, $\mathbf v_1 = [-4, 2, 2]$, $\mathbf v_2 = [0, 17, 11]$ linearly independent?

:::solution
With the vectors as columns,

$$
A = \begin{bmatrix} 3 & -4 & 0 \\ 7 & 2 & 17 \\ 4 & 2 & 11 \end{bmatrix} \sim \begin{bmatrix} 1 & 0 & 2 \\ 0 & 1 & 3/2 \\ 0 & 0 & 0 \end{bmatrix} .
$$

Column $2$ has no pivot, so $c_2 = t$ is free and $\mathbf c = t\,[-2, -\tfrac32, 1]$. Taking $t = 1$:
$-2\mathbf v_0 - \tfrac32 \mathbf v_1 + \mathbf v_2 = \mathbf 0$, a nontrivial combination — the vectors are
**dependent**.
:::
::::

```python
v0 = vector(QQ, [3, 7, 4]); v1 = vector(QQ, [-4, 2, 2]); v2 = vector(QQ, [0, 17, 11])
A = column_matrix(QQ, [v0, v1, v2])
A.rref()                          # [1 0 2; 0 1 3/2; 0 0 0]
t = var('t')
general_solution = vector(SR, [-2*t, -3/2*t, t])
A * general_solution              # (0, 0, 0) for every t
-2*v0 - 3/2*v1 + 1*v2             # (0, 0, 0): the nontrivial combination
```

::::example[Independence depending on a parameter]
For which $t$ are $(1, 5, t)$, $(1, 0, 1)$, $(0, 1, 1)$ linearly independent?

:::solution
With a symbol in the matrix, `rref()` cannot decide what is zero, so reduce by hand:

$$
\begin{bmatrix} 1 & 1 & 0 \\ 5 & 0 & 1 \\ t & 1 & 1 \end{bmatrix} \sim \begin{bmatrix} 1 & 0 & \tfrac15 \\ 0 & 1 & -\tfrac15 \\ 0 & 0 & \tfrac{6 - t}{5} \end{bmatrix} .
$$

If $t = 6$ the last column has no pivot: a free variable, so nontrivial solutions — **dependent**.
If $t \neq 6$, divide the last row by $\tfrac{6-t}{5}$ to get a pivot in every column: only the
trivial solution — **independent**.
:::
::::

```python
t = var('t')
A = column_matrix(SR, [vector(SR, [1, 5, t]), vector(QQ, [1, 0, 1]), vector(QQ, [0, 1, 1])])
A.add_multiple_of_row(1, 0, -5)   # the by-hand reduction, one operation per line
A.add_multiple_of_row(2, 0, -t)
A.rescale_row(1, -1/5)
A.add_multiple_of_row(0, 1, -1)
A.add_multiple_of_row(2, 1, t - 1)
A                                 # last row: [0, 0, -1/5*t + 6/5]
```

::::exercise[A set containing the zero vector]
True or false: any set of vectors that contains $\mathbf 0$ is linearly dependent.

:::solution
True. If $\mathbf v_i = \mathbf 0$, take $c_i = 1$ and every other coefficient $0$: the combination is
$1 \cdot \mathbf 0 = \mathbf 0$ and it is nontrivial.
:::
::::

### What dependence means

::::theorem[Dependence means one vector is redundant]
$\{\mathbf v_0, \dots, \mathbf v_{k-1}\} \subset \mathbb R^n$ is linearly dependent if and only if at least one $\mathbf v_i$ is a
linear combination of the others.

:::proof
Dependence gives $c_0 \mathbf v_0 + \cdots + c_{k-1} \mathbf v_{k-1} = \mathbf 0$ with some $c_i \neq 0$. Move that term to
the other side and divide by $-c_i$:

$$
\mathbf v_i = -\frac{1}{c_i} \sum_{j \neq i} c_j \mathbf v_j .
$$

Conversely, if $\mathbf v_i = \sum_{j \neq i} a_j \mathbf v_j$, then $\sum_{j \neq i} a_j \mathbf v_j - \mathbf v_i = \mathbf 0$ is a
nontrivial combination (the coefficient of $\mathbf v_i$ is $-1$).
:::
::::

::::theorem[Dependent rows and zero rows]
The rows of a matrix $A$ are linearly dependent if and only if the RREF of $A$ has a row of zeros.

:::proof
($\Rightarrow$, the direction proved in the lecture.) Reordering rows does not change dependence,
so by the previous theorem we may assume the last row is a combination of the others,
$\mathbf r_{m-1} = c_0 \mathbf r_0 + \cdots + c_{m-2} \mathbf r_{m-2}$. The row operations
$-c_j \mathbf r_j + \mathbf r_{m-1} \to \mathbf r_{m-1}$ for $j = 0, \dots, m-2$ turn the last row into $\mathbf 0$; reducing the
other rows then gives the RREF with a zero last row.
:::
::::

::::corollary[More rows than columns]
If an $m \times n$ matrix has $m > n$, its rows are linearly dependent.

:::proof
There are at most $\min(m, n) = n$ pivots, one per nonzero row of the RREF. With $m > n$ rows, some
row of the RREF has no pivot, so it is a zero row, and the previous theorem applies.
:::
::::

:::insight
Linear independence is a statement about a homogeneous system: put the vectors in the columns,
row reduce, and the vectors are independent exactly when no column is free.
:::

## Homogeneous systems and the kernel

:::definition[Homogeneous system]
A **homogeneous linear system** has the form $A\mathbf x = \mathbf 0$. It is always consistent: $\mathbf x = \mathbf 0$
is a solution.
:::

::::theorem[Nontrivial solutions and dependent columns]
For an $m \times n$ matrix $A$, the system $A\mathbf x = \mathbf 0$ has nontrivial solutions if and only if the
columns of $A$ are linearly dependent.

:::proof
With $A = [\,\mathbf c_0 \ \cdots \ \mathbf c_{n-1}\,]$, the column reading gives
$A\mathbf x = x_0 \mathbf c_0 + \cdots + x_{n-1} \mathbf c_{n-1}$, so $A\mathbf x = \mathbf 0$ has a nontrivial solution exactly when
some nontrivial combination of the columns is $\mathbf 0$ — the definition of dependence.
:::
::::

::::corollary[Independent columns and pivots]
The columns of $A$ are linearly independent if and only if every column of the RREF of $A$ has a
pivot.

:::proof
$A\mathbf x = \mathbf 0$ has only the trivial solution exactly when it has no free variables, and the free
variables are the columns of the RREF without a pivot.
:::
::::

Since there are at most $\min(m, n)$ pivots, a matrix with **more columns than rows** ($n > m$) always
has a column without a pivot: its columns are dependent and $A\mathbf x = \mathbf 0$ has infinitely many
solutions.

:::definition[Kernel (null space)]
The set of all solutions of $A\mathbf x = \mathbf 0$ is the **kernel** of $A$, written $\ker(A)$, also called the
**null space**, $\operatorname{null}(A)$.
:::

::::example[Computing a kernel]
Find $\ker(A)$ for $A = \begin{bmatrix} 1 & 2 & -3 \\ -5 & 3 & 0 \end{bmatrix}$.

:::solution
Row reduce $A$ itself — the augmented column of $[A \mid \mathbf 0]$ is all zeros and stays zero under
every row operation, so it can be left out:

$$
A \sim \begin{bmatrix} 1 & 0 & -\tfrac{9}{13} \\ 0 & 1 & -\tfrac{15}{13} \end{bmatrix} .
$$

$x_2 = t$ is free, and $\ker(A) = \{\, t\,[\tfrac{9}{13}, \tfrac{15}{13}, 1] : t \in \mathbb R \,\}$ — a line through the origin
in $\mathbb R^3$.
:::
::::

```python
A = matrix(QQ, [[1, 2, -3], [-5, 3, 0]])
A.rref()                          # [1 0 -9/13; 0 1 -15/13]
t = var('t')
general_solution = vector(SR, [9/13*t, 15/13*t, t])
A * general_solution              # (0, 0) for every t: the kernel is this line
```

### The kernel and the solutions of $A\mathbf x = \mathbf b$

::::theorem[The kernel is closed under addition and scaling]
If $\mathbf u, \mathbf v \in \ker(A)$ then $\mathbf u + \mathbf v \in \ker(A)$ and $c\,\mathbf u \in \ker(A)$ for every $c \in \mathbb R$.

:::proof
By linearity, $A(\mathbf u + \mathbf v) = A\mathbf u + A\mathbf v = \mathbf 0 + \mathbf 0 = \mathbf 0$ and $A(c\mathbf u) = c(A\mathbf u) = c\,\mathbf 0 = \mathbf 0$.
:::
::::

::::theorem[All solutions from one]
Let $\mathbf u$ be a solution of $A\mathbf x = \mathbf b$. Then

1. $\mathbf u + \mathbf v$ is a solution for every $\mathbf v \in \ker(A)$;
2. if $\mathbf w$ is another solution, $\mathbf w - \mathbf u \in \ker(A)$;
3. so the solutions are exactly $\{\, \mathbf u + \mathbf v : \mathbf v \in \ker(A) \,\}$.

:::proof
1. $A(\mathbf u + \mathbf v) = A\mathbf u + A\mathbf v = \mathbf b + \mathbf 0 = \mathbf b$.
2. $A(\mathbf w - \mathbf u) = A\mathbf w - A\mathbf u = \mathbf b - \mathbf b = \mathbf 0$.
3. By 2, every solution is $\mathbf w = \mathbf u + (\mathbf w - \mathbf u)$ with $\mathbf w - \mathbf u \in \ker(A)$, and by 1 every such
   sum is a solution.
:::
::::

The free-variables example of the first unit had exactly this shape: a particular solution plus
arbitrary multiples of kernel vectors.

::::theorem[Row equivalence and the kernel]
Two $m \times n$ matrices $A$ and $B$ are row equivalent if and only if $\ker(A) = \ker(B)$.

:::proof
($\Rightarrow$) $A \sim B$ means they have the same RREF, and the kernel is read off the RREF alone,
so $\ker(A) = \ker(B)$. The converse is also true; the lecture states it without proof.
:::
::::

::::exercise[From the lecture]
Compute the kernel of
$A = \begin{bmatrix} 1 & 3 & -2 & 0 \\ 3 & 10 & -7 & 1 \\ -5 & -5 & 3 & 7 \end{bmatrix}$.

:::solution
$$
A \sim \begin{bmatrix} 1 & 0 & 0 & -2 \\ 0 & 1 & 0 & 0 \\ 0 & 0 & 1 & -1 \end{bmatrix} ,
$$

so $x_3 = t$ is free and $x_0 = 2t$, $x_1 = 0$, $x_2 = t$:
$\ker(A) = \{\, t\,[2, 0, 1, 1] : t \in \mathbb R \,\}$. Check: $A\,[2, 0, 1, 1]^T = \mathbf 0$.
:::
::::

:::insight
The kernel is everything $A$ sends to zero. It decides uniqueness: a consistent system
$A\mathbf x = \mathbf b$ has exactly one solution when $\ker(A) = \{\mathbf 0\}$ (a pivot in every column), and
otherwise one particular solution plus the whole kernel.
:::

:::equations
- *Independence*: $c_0\mathbf v_0 + \cdots + c_{k-1}\mathbf v_{k-1} = \mathbf 0 \Rightarrow$ all $c_i = 0$ — test with the vectors as columns: a pivot in every column.
- *Kernel*: $\ker(A) = \{\, \mathbf x : A\mathbf x = \mathbf 0 \,\}$ — closed under $+$ and scalar multiples.
- *All solutions*: $\{\, \mathbf u + \mathbf v : \mathbf v \in \ker(A) \,\}$ for one solution $\mathbf u$ of $A\mathbf x = \mathbf b$.
- *Counting*: more rows than columns $\Rightarrow$ dependent rows; more columns than rows $\Rightarrow$ dependent columns.
:::

## Further reading

- [Nicholson, *Linear Algebra with Applications*, §5.2](https://lyryx.com/linear-algebra-applications/) — independence and dimension.
- [SageMath matrix methods](https://doc.sagemath.org/html/en/reference/matrices/sage/matrix/matrix2.html) — `right_kernel`, `rref`, `rank`.
