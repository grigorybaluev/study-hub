---
title: Basis, dimension, coordinates and transition matrices
order: 8
status: detailed
weeks: [8]
introduces:
  - {concept: basis-dimension, perspective: "coordinate vectors relative to a basis and the transition matrix between two bases"}
requires:
  - {concept: vector-space, strength: hard}
  - {concept: linear-independence, strength: hard}
  - {concept: linear-combination-span, strength: hard}
  - {concept: matrix-inverse, strength: hard}
  - {concept: matrix-rank, strength: hard}
  - {concept: computer-algebra-system, strength: soft}
reinforces:
  - {concept: matrix-rank, perspective: "bases of the column space, row space and kernel, and rank plus nullity as a count of dimensions"}
---

A spanning set reaches everything, and an independent set has no waste. A **basis** is both: a set just
large enough to describe every vector, in exactly one way. All bases of a space have the same size,
and that size is the **dimension**. Once a basis is chosen, each vector is a list of numbers, its
**coordinates**, so any finite-dimensional space can be handled in $\mathbb R^n$ with the tools of the first
half of the course. Different bases give different coordinates, and a **transition matrix** converts
from one to the other.

Indices start at $0$, as in Sage: a basis is $B = \{\mathbf b_0, \dots, \mathbf b_{n-1}\}$.

## Basis

### Definition

:::definition[Basis]
Let $V$ be a vector space. A (possibly infinite) set of vectors $S \subseteq V$ is a **basis** of $V$ if $S$ is linearly independent
and $V = \mathrm{span}(S)$.
:::

A basis need not be finite, but almost every space in this course has a finite one.

| Space | Standard basis | Size |
|---|---|---|
| $\mathbb R^n$ | $\mathbf e_0, \dots, \mathbf e_{n-1}$ | $n$ |
| $\mathbb P_n(\mathbb R)$ | $1, x, x^2, \dots, x^n$ | $n + 1$ |
| $\mathbb R^{2 \times 2}$ | $\begin{bmatrix} 1 & 0 \\ 0 & 0 \end{bmatrix}, \begin{bmatrix} 0 & 1 \\ 0 & 0 \end{bmatrix}, \begin{bmatrix} 0 & 0 \\ 1 & 0 \end{bmatrix}, \begin{bmatrix} 0 & 0 \\ 0 & 1 \end{bmatrix}$ | $4$ |

The space $\mathbb P(\mathbb R)$ of all polynomials has no finite basis: finitely many polynomials have a highest degree,
and nothing above it is in their span.

::::theorem[Unique representation]
$\{\mathbf b_0, \dots, \mathbf b_{n-1}\}$ is a basis of $V$ if and only if every $\mathbf v \in V$ can be written as $\mathbf v = c_0\mathbf b_0 + \cdots + c_{n-1}\mathbf b_{n-1}$ in
exactly one way.

:::proof
($\Rightarrow$) Spanning gives at least one way. If $\sum_i c_i\mathbf b_i = \sum_i d_i\mathbf b_i$, then $\sum_i (c_i - d_i)\mathbf b_i = \mathbf 0$, and independence
gives $c_i = d_i$ for every $i$.

($\Leftarrow$) Every vector is a combination, so the set spans. The vector $\mathbf 0$ has the one way $\sum_i 0\,\mathbf b_i$, so
$\sum_i c_i\mathbf b_i = \mathbf 0$ forces all $c_i = 0$, which is independence.
:::
::::

### All bases have the same size

::::theorem[Spanning sets limit independent sets]
If $V$ is spanned by $n$ vectors, then any set of more than $n$ vectors in $V$ is linearly dependent.

:::proof
Let $V = \mathrm{span}(\mathbf v_0, \dots, \mathbf v_{n-1})$ and take $\mathbf w_0, \dots, \mathbf w_{k-1}$ in $V$ with $k > n$. Each is a combination,
$\mathbf w_j = \sum_i a_{i,j}\mathbf v_i$. The $n \times k$ matrix $A = [a_{i,j}]$ has more columns than rows, so $A\mathbf c = \mathbf 0$ has a solution
$\mathbf c \neq \mathbf 0$. Then

$$
\sum_{j} c_j\mathbf w_j = \sum_{j} c_j \sum_{i} a_{i,j}\mathbf v_i = \sum_{i} \Bigl(\sum_{j} a_{i,j}c_j\Bigr)\mathbf v_i = \mathbf 0 ,
$$

a dependence among the $\mathbf w_j$.
:::
::::

::::corollary[All bases have the same size]
If a vector space has a basis of $n$ vectors, then every basis has exactly $n$ vectors.

:::proof
Let $B$ and $C$ be bases, with $n$ and $k$ vectors. $B$ spans and $C$ is independent, so $k \le n$. Exchanging
the roles gives $n \le k$.
:::
::::

:::definition[Dimension]
Let $V$ be a vector space.

1. If $V = \{\mathbf 0\}$, the space with only the zero vector, then $\dim(V) = 0$ (its basis is empty).
2. If $V$ has a basis $B = \{\mathbf b_0, \dots, \mathbf b_{n-1}\}$, then $V$ is **finite-dimensional** and $\dim(V) = n$.
3. Otherwise $V$ is **infinite-dimensional**.
:::

The corollary above is what makes case 2 well defined: every basis gives the same $n$. The theorem before it gives
one more bound: if $V = \mathrm{span}(\mathbf v_0, \dots, \mathbf v_{n-1})$, then $\dim(V) \le n$, because a basis is an independent set.

So $\dim \mathbb R^n = n$, $\dim \mathbb P_n(\mathbb R) = n + 1$ and $\dim \mathbb R^{m \times n} = mn$, while $\mathbb P(\mathbb R)$ and $\mathcal F(\mathbb R)$ are infinite-dimensional.

:::caution[The dimension of P_n]
$\mathbb P_n(\mathbb R)$ has dimension $n + 1$, not $n$: the basis $1, x, \dots, x^n$ includes the constant. $\mathbb P_2(\mathbb R)$ is $3$-dimensional.
:::

### Shrinking, extending, counting

:::lemma[Adding a vector outside the span]
If $S$ is an independent set and $\mathbf v \notin \mathrm{span}(S)$, then $S \cup \{\mathbf v\}$ is independent.
:::

:::proof
In a relation $c\,\mathbf v + \sum_i c_i\mathbf s_i = \mathbf 0$, a nonzero $c$ would make $\mathbf v$ a combination of $S$. So $c = 0$, and then all
$c_i = 0$ since $S$ is independent.
:::

::::theorem[Shrinking and extending to a basis]
Let $V$ be finite-dimensional.

1. Any finite spanning set of $V$ contains a basis.
2. Any independent set in $V$ can be extended to a basis.

:::proof
1. If the set is dependent, one vector is a combination of the others, and removing it does not change the
   span. Repeat until the set is independent.
2. If an independent set does not span, add a vector outside its span; the lemma keeps it independent.
   This stops, since an independent set has at most $\dim V$ vectors.
:::
::::

::::theorem[Counting is enough]
Let $\dim V = n$.

1. $n$ independent vectors in $V$ form a basis.
2. $n$ vectors that span $V$ form a basis.
3. If $W$ is a subspace of $V$, then $\dim W \le n$, and $\dim W = n$ only when $W = V$.

:::proof
1. If they did not span, extending would give a basis with more than $n$ vectors.
2. If they were dependent, shrinking would give a basis with fewer than $n$ vectors.
3. A basis of $W$ is an independent set in $V$, so it has at most $n$ vectors, and if it has $n$ it is a basis of $V$ by 1.
:::
::::

So once the dimension is known, only **one** of the two conditions needs checking. Three polynomials in $\mathbb P_2(\mathbb R)$
are a basis as soon as they are independent.

## Finding a basis

### The spaces of a matrix

The RREF of $A$ gives bases of all three of its spaces. Row operations change the column space, so a basis
of $\mathrm{col}(A)$ must be read from the **original** columns; they do not change the row space.

:::steps[Bases of the three spaces of a matrix]
1. Compute the RREF of $A$ and note the pivot columns.
2. $\mathrm{col}(A)$: the columns of the **original** $A$ in the pivot positions.
3. $\mathrm{row}(A)$: the nonzero rows of the RREF.
4. $\ker(A)$: solve $A\mathbf x = \mathbf 0$ with one parameter per free variable; the vector multiplying each parameter is a basis vector.
:::

:::theorem[Dimensions of the three spaces]
For an $m \times n$ matrix of rank $r$: $\dim \mathrm{col}(A) = \dim \mathrm{row}(A) = r$ and $\dim \ker(A) = n - r$.
:::

The dimension of $\ker(A)$ is called the **nullity** of $A$, so rank plus nullity is $n$, the number of columns.

::::example[Bases from one row reduction]
Find bases of the column space, row space and kernel of $A = \begin{bmatrix} 1 & 2 & 0 & 3 \\ 2 & 4 & 1 & 8 \\ 1 & 2 & 1 & 5 \end{bmatrix}$.

:::solution
The RREF is $\begin{bmatrix} 1 & 2 & 0 & 3 \\ 0 & 0 & 1 & 2 \\ 0 & 0 & 0 & 0 \end{bmatrix}$, with pivots in columns $0$ and $2$. So the rank is $2$.

Column space: columns $0$ and $2$ of $A$, that is, $(1, 2, 1)$ and $(0, 1, 1)$.

Row space: $(1, 2, 0, 3)$ and $(0, 0, 1, 2)$.

Kernel: $x_1 = s$ and $x_3 = t$ are free, $x_0 = -2s - 3t$ and $x_2 = -2t$, so

$$
\mathbf x = s\,(-2, 1, 0, 0) + t\,(-3, 0, -2, 1) .
$$

The kernel has dimension $2$, and $2 + 2 = 4$ columns.
:::
::::

```python
A = matrix(QQ, [[1, 2, 0, 3], [2, 4, 1, 8], [1, 2, 1, 5]])
A.rref()                                # [1 2 0 3; 0 0 1 2; 0 0 0 0]
A.pivots()                              # (0, 2)
[A.column(j) for j in A.pivots()]       # [(1, 2, 1), (0, 1, 1)]: basis of col(A)
A.rref().rows()[:A.rank()]              # [(1, 2, 0, 3), (0, 0, 1, 2)]: basis of row(A)
A.right_kernel(basis='pivot').basis()   # [(-2, 1, 0, 0), (-3, 0, -2, 1)]: basis of ker(A)
```

:::caution[Other correct bases]
`A.right_kernel().basis()` without `basis='pivot'` prints a different basis of the same kernel, reduced to echelon
form. A subspace has many bases, so check an answer by the dimension and by $A\mathbf x = \mathbf 0$, not by comparing lists.
:::

### Subspaces given by a condition

Write out what the condition says about a general element, solve, and pull out one vector per free parameter.

::::example[A basis of a polynomial subspace]
Find a basis and the dimension of $W = \{p \in \mathbb P_2(\mathbb R) : p(1) = 0\}$.

:::solution
Let $p = a + bx + cx^2$. Then $p(1) = a + b + c = 0$, so $a = -b - c$ with $b, c$ free, and

$$
p = (-b - c) + bx + cx^2 = b\,(x - 1) + c\,(x^2 - 1) .
$$

So $x - 1$ and $x^2 - 1$ span $W$. They are independent (neither is a multiple of the other), and $\dim W = 2$.
:::
::::

::::example[Extending to a basis of R^3]
Extend the independent set $\{(1, 1, 0), (0, 1, 1)\}$ to a basis of $\mathbb R^3$.

:::solution
Put the two vectors and then $\mathbf e_0, \mathbf e_1, \mathbf e_2$ in the columns of a matrix. These five vectors span, and the pivot columns of the
RREF are a basis that keeps as many early columns as possible. The pivots fall in columns $0$, $1$, $2$, so the
third vector is $\mathbf e_0$: the set $\{(1, 1, 0), (0, 1, 1), (1, 0, 0)\}$ is a basis.
:::
::::

```python
vs = [vector(QQ, [1, 1, 0]), vector(QQ, [0, 1, 1])]
M = column_matrix(vs + identity_matrix(QQ, 3).columns())
M.pivots()                              # (0, 1, 2)
```

## Coordinates

### Coordinate vectors

A basis is **ordered** from here on: $B = (\mathbf b_0, \dots, \mathbf b_{n-1})$, since the positions of the coefficients matter.

:::definition[Coordinate vector]
Let $B = \{\mathbf b_0, \dots, \mathbf b_{n-1}\}$ be an ordered basis of $V$. For $\mathbf v \in V$, with its unique representation
$\mathbf v = c_0\mathbf b_0 + \cdots + c_{n-1}\mathbf b_{n-1}$, the **coordinate vector of $\mathbf v$ in the basis $B$** is the column

$$
[\mathbf v]_{B} = \begin{bmatrix} c_0 \\ c_1 \\ \vdots \\ c_{n-1} \end{bmatrix} \in \mathbb R^n .
$$
:::

Unique representation is what makes this well defined. For the standard basis of $\mathbb R^n$, $[\mathbf v]_{B} = \mathbf v$.

In $\mathbb R^n$, put the basis vectors in the columns of a matrix $P_{B}$. Then $\mathbf v = P_{B}\,[\mathbf v]_{B}$, and $P_{B}$ is invertible, so

$$
[\mathbf v]_{B} = P_{B}^{-1}\,\mathbf v .
$$

::::example[Coordinates in the plane]
Find $[\mathbf v]_{B}$ for $\mathbf v = (5, 1)$ and $B = ((1, 1), (1, -1))$.

:::solution
Solve $c_0(1, 1) + c_1(1, -1) = (5, 1)$, that is, $c_0 + c_1 = 5$ and $c_0 - c_1 = 1$. So $c_0 = 3$, $c_1 = 2$, and $[\mathbf v]_{B} = (3, 2)$.
:::
::::

::::example[Coordinates of a polynomial]
Find the coordinates of $p = 3 + 2x + x^2$ relative to $C = (1, \ 1 + x, \ (1 + x)^2)$.

:::solution
Since $(1 + x)^2 = 1 + 2x + x^2$, we get $p = 2 \cdot 1 + 0 \cdot (1 + x) + 1 \cdot (1 + x)^2$. So $[p]_{C} = (2, 0, 1)$.
:::
::::

The sliders below choose a basis of the plane and a vector. The skewed grid is the one the basis draws,
and the coordinates count steps along it.

```sim
id: la-change-of-basis
controls:
  - {id: b0x, label: "b₀ first entry", min: -2, max: 2, step: 0.1, default: 1, decimals: 1}
  - {id: b0y, label: "b₀ second entry", min: -2, max: 2, step: 0.1, default: 1, decimals: 1}
  - {id: b1x, label: "b₁ first entry", min: -2, max: 2, step: 0.1, default: 1, decimals: 1}
  - {id: b1y, label: "b₁ second entry", min: -2, max: 2, step: 0.1, default: -1, decimals: 1}
  - {id: vx, label: "v first entry", min: -5, max: 5, step: 0.5, default: 5, decimals: 1}
  - {id: vy, label: "v second entry", min: -5, max: 5, step: 0.5, default: 1, decimals: 1}
note: 'The defaults are the example above: b₀ = (1, 1), b₁ = (1, −1), v = (5, 1). The vector v never changes when the basis does; only its coordinates do. Walk c₀ steps along b₀ (blue) and then c₁ steps along b₁ (gold) to reach v. When b₀ and b₁ fall on one line the determinant of [b₀ b₁] is 0, they are no longer a basis, and most vectors have no coordinates.'
```

```python
P = column_matrix(QQ, [[1, 1], [1, -1]])
v = vector(QQ, [5, 1])
P.inverse() * v                         # (3, 2)
P.solve_right(v)                        # (3, 2): the same, without forming the inverse
```

### Coordinates are faithful

::::theorem[The coordinate map is linear and bijective]
Let $B$ be a basis of an $n$-dimensional space $V$. The map $V \to \mathbb R^n$, $\mathbf v \mapsto [\mathbf v]_{B}$ is a bijection with

$$
[\mathbf u + \mathbf v]_{B} = [\mathbf u]_{B} + [\mathbf v]_{B} , \qquad [c\,\mathbf v]_{B} = c\,[\mathbf v]_{B} .
$$

Consequently, vectors of $V$ are independent (or span $V$) exactly when their coordinate vectors are independent (or span $\mathbb R^n$).

:::proof
If $\mathbf u = \sum_i a_i\mathbf b_i$ and $\mathbf v = \sum_i c_i\mathbf b_i$, then $\mathbf u + \mathbf v = \sum_i (a_i + c_i)\mathbf b_i$ and $c\,\mathbf v = \sum_i (cc_i)\mathbf b_i$. It is
injective and surjective because each list of coefficients gives exactly one vector. A relation $\sum_j d_j\mathbf w_j = \mathbf 0$ in
$V$ becomes $\sum_j d_j[\mathbf w_j]_{B} = \mathbf 0$ in $\mathbb R^n$, and back, so the same coefficients work on both sides.
:::
::::

For instance, the three polynomials of degree five in the previous unit lie in $U = \mathrm{span}(x^5, x^2, 1)$, and relative to the
basis $\{x^5, x^2, 1\}$ of $U$ their coordinate vectors are $(7, -4, 3)$, $(2, 5, 0)$ and $(8, -23, 6)$. The matrix with these columns has
no pivot in its third column, so the coordinate vectors are dependent in $\mathbb R^3$, and the polynomials are dependent in $U$,
and so in $\mathbb P_5(\mathbb R)$.

This is the justification for the coefficient lists of the previous unit: a question about polynomials or matrices
is answered in $\mathbb R^n$ by passing to coordinates relative to the standard basis.

## Transition matrices

### Changing the basis

Let $B$ and $C$ be two bases of the same space. Knowing $[\mathbf v]_{B}$, how is $[\mathbf v]_{C}$ found? Write
$\mathbf v = \sum_j c_j\mathbf b_j$ and apply the coordinate map for $C$, which is linear:

$$
[\mathbf v]_{C} = \sum_j c_j\,[\mathbf b_j]_{C} = \bigl[\, [\mathbf b_0]_{C} \ \cdots \ [\mathbf b_{n-1}]_{C} \,\bigr]\,[\mathbf v]_{B} .
$$

:::definition[Transition matrix]
The **transition matrix** (or change-of-basis matrix) from $B$ to $C$ is the matrix whose columns are the
$C$-coordinates of the vectors of $B$:

$$
P_{B \to C} = \bigl[\, [\mathbf b_0]_{C} \ \ [\mathbf b_1]_{C} \ \cdots \ [\mathbf b_{n-1}]_{C} \,\bigr] .
$$
:::

::::theorem[Properties of the transition matrix]
$P_{B \to C}$ is the unique matrix with $[\mathbf v]_{C} = P_{B \to C}\,[\mathbf v]_{B}$ for all $\mathbf v$. It is invertible, and

$$
\bigl(P_{B \to C}\bigr)^{-1} = P_{C \to B} .
$$

:::proof
The formula is the computation above. If $Q$ also has this property, then taking $\mathbf v = \mathbf b_j$, whose $B$-coordinates are $\mathbf e_j$,
shows that column $j$ of $Q$ is $[\mathbf b_j]_{C}$. For the inverse, $P_{C \to B}\,P_{B \to C}$ sends $[\mathbf v]_{B}$ to
itself for every $\mathbf v$, and every vector of $\mathbb R^n$ is some $[\mathbf v]_{B}$, so the product is $I_n$.
:::
::::

:::caution[Read the arrow from B to C]{#read-the-arrow-right-to-left}
$P_{B \to C}$ takes $B$-coordinates in and gives $C$-coordinates out, and its columns are the **old** basis vectors (of $B$)
written in the **new** basis $C$. Writing the new vectors in the old basis gives the inverse, $P_{C \to B}$. In a product the
matrices act right to left: $P_{C \to D}\,P_{B \to C} = P_{B \to D}$. Check the direction on one vector before trusting a result.
:::

### Computing it

If the bases are given in $\mathbb R^n$ (or by coordinates relative to some third basis, such as the standard one), put
them in the columns of $P_{B}$ and $P_{C}$. Then $P_{C}[\mathbf v]_{C} = \mathbf v = P_{B}[\mathbf v]_{B}$, so

$$
P_{B \to C} = P_{C}^{-1}\,P_{B} .
$$

:::steps[Computing a transition matrix]
1. Write both bases as columns: $P_{B}$ and $P_{C}$ (for polynomials or matrices, use coefficient lists in the standard basis).
2. Row reduce $[\,P_{C} \mid P_{B}\,]$ to $[\,I_n \mid P_{B \to C}\,]$, or compute $P_{C}^{-1}P_{B}$.
3. Check: for one basis vector or one sample vector, $P_{B \to C}[\mathbf v]_{B}$ must equal $[\mathbf v]_{C}$.
:::

::::example[From one basis of the plane to another]
Let $B = ((1, 1), (1, -1))$ and $C = ((2, 1), (1, 1))$. Find $P_{B \to C}$ and use it on $\mathbf v = (5, 1)$.

:::solution
$$
P_{B \to C} = P_{C}^{-1}P_{B} = \begin{bmatrix} 1 & -1 \\ -1 & 2 \end{bmatrix}\begin{bmatrix} 1 & 1 \\ 1 & -1 \end{bmatrix} = \begin{bmatrix} 0 & 2 \\ 1 & -3 \end{bmatrix} .
$$

Column $0$ says $(1, 1) = 0\,(2, 1) + 1\,(1, 1)$, and column $1$ says $(1, -1) = 2\,(2, 1) - 3\,(1, 1)$. Both are correct.

We found $[\mathbf v]_{B} = (3, 2)$, so $[\mathbf v]_{C} = P_{B \to C}(3, 2) = (4, -3)$. Check: $4\,(2, 1) - 3\,(1, 1) = (5, 1)$.
:::
::::

```python
PB = column_matrix(QQ, [[1, 1], [1, -1]])
PC = column_matrix(QQ, [[2, 1], [1, 1]])
P = PC.inverse() * PB
P                                       # [0 2; 1 -3]
PC.augment(PB).rref()                   # [1 0 0 2; 0 1 1 -3]: the same P on the right
P * vector(QQ, [3, 2])                  # (4, -3)
PC * vector(QQ, [4, -3])                # (5, 1): back to v
```

::::example[Is it a basis, and what are the coordinates?]
Is $B = \{x^2, \ 2x^2 - x, \ 3x^2 + 2x + 1\}$ a basis of $\mathbb P_2(\mathbb R)$? If so, write $p = 6x^2 - 5x + 4$ as a linear combination of the vectors of $B$.

:::solution
Pass to coordinates relative to $E = \{1, x, x^2\}$: $[x^2]_E = (0, 0, 1)$, $[2x^2 - x]_E = (0, -1, 2)$, $[3x^2 + 2x + 1]_E = (1, 2, 3)$, and
$[p]_E = (4, -5, 6)$. The matrix with the first three as columns has determinant $1 \neq 0$, so they are three independent
vectors in the $3$-dimensional space $\mathbb P_2(\mathbb R)$: a basis.

Solve $a\,x^2 + b\,(2x^2 - x) + c\,(3x^2 + 2x + 1) = 6x^2 - 5x + 4$. The constant terms give $c = 4$, the $x$ terms $-b + 2c = -5$, so
$b = 13$, and the $x^2$ terms $a + 2b + 3c = 6$, so $a = -32$. Hence

$$
6x^2 - 5x + 4 = -32\,x^2 + 13\,(2x^2 - x) + 4\,(3x^2 + 2x + 1), \qquad [p]_B = \begin{bmatrix} -32 \\ 13 \\ 4 \end{bmatrix} .
$$

Check the $x^2$ coefficient: $-32 + 26 + 12 = 6$.
:::
::::

```python
A = column_matrix(QQ, [[0, 0, 1], [0, -1, 2], [1, 2, 3]])   # columns: [x^2]_E, [2x^2 - x]_E, [3x^2 + 2x + 1]_E
A.det()                                                     # 1: a basis
A.solve_right(vector(QQ, [4, -5, 6]))                       # (-32, 13, 4) = [p]_B
```

::::example[Between two bases of polynomials]
In $\mathbb P_2(\mathbb R)$, let $S = (1, x, x^2)$ and $C = (1, \ 1 + x, \ (1 + x)^2)$. Find both transition matrices and use one on $p = 3 + 2x + x^2$.

:::solution
The vectors of $C$ are easy to write in the standard basis $S$, which gives the columns of $P_{C \to S}$:

$$
P_{C \to S} = \begin{bmatrix} 1 & 1 & 1 \\ 0 & 1 & 2 \\ 0 & 0 & 1 \end{bmatrix} , \qquad P_{S \to C} = \bigl(P_{C \to S}\bigr)^{-1} = \begin{bmatrix} 1 & -1 & 1 \\ 0 & 1 & -2 \\ 0 & 0 & 1 \end{bmatrix} .
$$

Then $[p]_{C} = P_{S \to C}(3, 2, 1) = (2, 0, 1)$, the coordinates found by hand above.
:::
::::

```python
PSC = column_matrix(QQ, [[1, 0, 0], [1, 1, 0], [1, 2, 1]])
PCS = PSC.inverse()
PCS                                     # [1 -1 1; 0 1 -2; 0 0 1]
PCS * vector(QQ, [3, 2, 1])             # (2, 0, 1)
```

:::insight
A vector does not change when the basis does: only its description does. A basis is a choice of
language, coordinates are what the vector is called in that language, and a transition matrix is the
dictionary between two languages.
:::

:::equations
- *Basis*: independent and spanning, $V = \mathrm{span}(S)$; every vector is a unique combination.
- *Dimension*: $\dim\{\mathbf 0\} = 0$; $n$ for a basis of $n$ vectors; $V = \mathrm{span}(\mathbf v_0, \dots, \mathbf v_{n-1}) \Rightarrow \dim(V) \le n$.
- *Dimensions*: $\dim \mathbb R^n = n$, $\dim \mathbb P_n(\mathbb R) = n + 1$, $\dim \mathbb R^{m \times n} = mn$.
- *Rank and nullity*: $\dim \mathrm{col}(A) = \dim \mathrm{row}(A) = r$, $\dim \ker(A) = n - r$.
- *Coordinates in R^n*: $\mathbf v = P_{B}[\mathbf v]_{B}$, $[\mathbf v]_{B} = P_{B}^{-1}\mathbf v$.
- *Transition*: $[\mathbf v]_{C} = P_{B \to C}[\mathbf v]_{B}$ with columns $[\mathbf b_j]_{C}$; $P_{B \to C} = P_{C}^{-1}P_{B}$; $(P_{B \to C})^{-1} = P_{C \to B}$.
:::

## Further reading

- [3Blue1Brown — Change of basis](https://www.3blue1brown.com/lessons/change-of-basis) — translating between two coordinate systems, drawn.
- [Change of basis (Wikipedia)](https://en.wikipedia.org/wiki/Change_of_basis) — the transition matrix in general.
- [SageMath matrix methods](https://doc.sagemath.org/html/en/reference/matrices/sage/matrix/matrix2.html) — `pivots`, `right_kernel`, `solve_right`, `inverse`.
