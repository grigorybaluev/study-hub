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

Indices start at $0$, as in Sage: a basis is $\mathcal B = \{\mathbf b_0, \dots, \mathbf b_{n-1}\}$.

## Basis

### Definition

:::definition[Basis]
A **basis** of a vector space $V$ is a set of vectors in $V$ that is linearly independent and spans $V$.
:::

| Space | Standard basis | Size |
|---|---|---|
| $\mathbb R^n$ | $\mathbf e_0, \dots, \mathbf e_{n-1}$ | $n$ |
| $\mathcal P_n$ | $1, x, x^2, \dots, x^n$ | $n + 1$ |
| $\mathbb R^{2 \times 2}$ | $\begin{bmatrix} 1 & 0 \\ 0 & 0 \end{bmatrix}, \begin{bmatrix} 0 & 1 \\ 0 & 0 \end{bmatrix}, \begin{bmatrix} 0 & 0 \\ 1 & 0 \end{bmatrix}, \begin{bmatrix} 0 & 0 \\ 0 & 1 \end{bmatrix}$ | $4$ |

The space $\mathcal P$ of all polynomials has no finite basis: finitely many polynomials have a highest degree,
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
Let $V = \mathrm{span}\{\mathbf v_0, \dots, \mathbf v_{n-1}\}$ and take $\mathbf w_0, \dots, \mathbf w_{k-1}$ in $V$ with $k > n$. Each is a combination,
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
Let $\mathcal B$ and $\mathcal C$ be bases, with $n$ and $k$ vectors. $\mathcal B$ spans and $\mathcal C$ is independent, so $k \le n$. Exchanging
the roles gives $n \le k$.
:::
::::

:::definition[Dimension]
The **dimension** of $V$, written $\dim V$, is the number of vectors in a basis. The space $\{\mathbf 0\}$ has dimension $0$
(its basis is empty). A space with no finite basis is **infinite-dimensional**.
:::

So $\dim \mathbb R^n = n$, $\dim \mathcal P_n = n + 1$ and $\dim \mathbb R^{m \times n} = mn$, while $\mathcal P$ and $\mathcal F(\mathbb R)$ are infinite-dimensional.

:::caution[The dimension of P_n]
$\mathcal P_n$ has dimension $n + 1$, not $n$: the basis $1, x, \dots, x^n$ includes the constant. $\mathcal P_2$ is $3$-dimensional.
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

So once the dimension is known, only **one** of the two conditions needs checking. Three polynomials in $\mathcal P_2$
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
Find a basis and the dimension of $W = \{p \in \mathcal P_2 : p(1) = 0\}$.

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

A basis is **ordered** from here on: $\mathcal B = (\mathbf b_0, \dots, \mathbf b_{n-1})$, since the positions of the coefficients matter.

:::definition[Coordinate vector]
If $\mathbf v = c_0\mathbf b_0 + \cdots + c_{n-1}\mathbf b_{n-1}$, the **coordinate vector** of $\mathbf v$ relative to $\mathcal B$ is

$$
[\mathbf v]_{\mathcal B} = (c_0, \dots, c_{n-1}) \in \mathbb R^n .
$$
:::

Unique representation is what makes this well defined. For the standard basis of $\mathbb R^n$, $[\mathbf v]_{\mathcal B} = \mathbf v$.

In $\mathbb R^n$, put the basis vectors in the columns of a matrix $P_{\mathcal B}$. Then $\mathbf v = P_{\mathcal B}\,[\mathbf v]_{\mathcal B}$, and $P_{\mathcal B}$ is invertible, so

$$
[\mathbf v]_{\mathcal B} = P_{\mathcal B}^{-1}\,\mathbf v .
$$

::::example[Coordinates in the plane]
Find $[\mathbf v]_{\mathcal B}$ for $\mathbf v = (5, 1)$ and $\mathcal B = ((1, 1), (1, -1))$.

:::solution
Solve $c_0(1, 1) + c_1(1, -1) = (5, 1)$, that is, $c_0 + c_1 = 5$ and $c_0 - c_1 = 1$. So $c_0 = 3$, $c_1 = 2$, and $[\mathbf v]_{\mathcal B} = (3, 2)$.
:::
::::

::::example[Coordinates of a polynomial]
Find the coordinates of $p = 3 + 2x + x^2$ relative to $\mathcal C = (1, \ 1 + x, \ (1 + x)^2)$.

:::solution
Since $(1 + x)^2 = 1 + 2x + x^2$, we get $p = 2 \cdot 1 + 0 \cdot (1 + x) + 1 \cdot (1 + x)^2$. So $[p]_{\mathcal C} = (2, 0, 1)$.
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
Let $\mathcal B$ be a basis of an $n$-dimensional space $V$. The map $V \to \mathbb R^n$, $\mathbf v \mapsto [\mathbf v]_{\mathcal B}$ is a bijection with

$$
[\mathbf u + \mathbf v]_{\mathcal B} = [\mathbf u]_{\mathcal B} + [\mathbf v]_{\mathcal B} , \qquad [c\,\mathbf v]_{\mathcal B} = c\,[\mathbf v]_{\mathcal B} .
$$

Consequently, vectors of $V$ are independent (or span $V$) exactly when their coordinate vectors are independent (or span $\mathbb R^n$).

:::proof
If $\mathbf u = \sum_i a_i\mathbf b_i$ and $\mathbf v = \sum_i c_i\mathbf b_i$, then $\mathbf u + \mathbf v = \sum_i (a_i + c_i)\mathbf b_i$ and $c\,\mathbf v = \sum_i (cc_i)\mathbf b_i$. It is
injective and surjective because each list of coefficients gives exactly one vector. A relation $\sum_j d_j\mathbf w_j = \mathbf 0$ in
$V$ becomes $\sum_j d_j[\mathbf w_j]_{\mathcal B} = \mathbf 0$ in $\mathbb R^n$, and back, so the same coefficients work on both sides.
:::
::::

This is the justification for the coefficient lists of the previous unit: a question about polynomials or matrices
is answered in $\mathbb R^n$ by passing to coordinates relative to the standard basis.

## Transition matrices

### Changing the basis

Let $\mathcal B$ and $\mathcal C$ be two bases of the same space. Knowing $[\mathbf v]_{\mathcal B}$, how is $[\mathbf v]_{\mathcal C}$ found? Write
$\mathbf v = \sum_j c_j\mathbf b_j$ and apply the coordinate map for $\mathcal C$, which is linear:

$$
[\mathbf v]_{\mathcal C} = \sum_j c_j\,[\mathbf b_j]_{\mathcal C} = \bigl[\, [\mathbf b_0]_{\mathcal C} \ \cdots \ [\mathbf b_{n-1}]_{\mathcal C} \,\bigr]\,[\mathbf v]_{\mathcal B} .
$$

:::definition[Transition matrix]
The **transition matrix** (or change-of-basis matrix) from $\mathcal B$ to $\mathcal C$ is the matrix whose columns are the
$\mathcal C$-coordinates of the vectors of $\mathcal B$:

$$
P_{\mathcal C \leftarrow \mathcal B} = \bigl[\, [\mathbf b_0]_{\mathcal C} \ \ [\mathbf b_1]_{\mathcal C} \ \cdots \ [\mathbf b_{n-1}]_{\mathcal C} \,\bigr] .
$$
:::

::::theorem[Properties of the transition matrix]
$P_{\mathcal C \leftarrow \mathcal B}$ is the unique matrix with $[\mathbf v]_{\mathcal C} = P_{\mathcal C \leftarrow \mathcal B}\,[\mathbf v]_{\mathcal B}$ for all $\mathbf v$. It is invertible, and

$$
\bigl(P_{\mathcal C \leftarrow \mathcal B}\bigr)^{-1} = P_{\mathcal B \leftarrow \mathcal C} .
$$

:::proof
The formula is the computation above. If $Q$ also has this property, then taking $\mathbf v = \mathbf b_j$, whose $\mathcal B$-coordinates are $\mathbf e_j$,
shows that column $j$ of $Q$ is $[\mathbf b_j]_{\mathcal C}$. For the inverse, $P_{\mathcal B \leftarrow \mathcal C}\,P_{\mathcal C \leftarrow \mathcal B}$ sends $[\mathbf v]_{\mathcal B}$ to
itself for every $\mathbf v$, and every vector of $\mathbb R^n$ is some $[\mathbf v]_{\mathcal B}$, so the product is $I_n$.
:::
::::

:::caution[Read the arrow right to left]
$P_{\mathcal C \leftarrow \mathcal B}$ takes $\mathcal B$-coordinates in and gives $\mathcal C$-coordinates out, and its columns are the **old** basis vectors
written in the **new** basis. Writing the new vectors in the old basis gives the inverse. Check the direction on
one vector before trusting a result.
:::

### Computing it

If the bases are given in $\mathbb R^n$ (or by coordinates relative to some third basis, such as the standard one), put
them in the columns of $P_{\mathcal B}$ and $P_{\mathcal C}$. Then $P_{\mathcal C}[\mathbf v]_{\mathcal C} = \mathbf v = P_{\mathcal B}[\mathbf v]_{\mathcal B}$, so

$$
P_{\mathcal C \leftarrow \mathcal B} = P_{\mathcal C}^{-1}\,P_{\mathcal B} .
$$

:::steps[Computing a transition matrix]
1. Write both bases as columns: $P_{\mathcal B}$ and $P_{\mathcal C}$ (for polynomials or matrices, use coefficient lists in the standard basis).
2. Row reduce $[\,P_{\mathcal C} \mid P_{\mathcal B}\,]$ to $[\,I_n \mid P_{\mathcal C \leftarrow \mathcal B}\,]$, or compute $P_{\mathcal C}^{-1}P_{\mathcal B}$.
3. Check: for one basis vector or one sample vector, $P_{\mathcal C \leftarrow \mathcal B}[\mathbf v]_{\mathcal B}$ must equal $[\mathbf v]_{\mathcal C}$.
:::

::::example[From one basis of the plane to another]
Let $\mathcal B = ((1, 1), (1, -1))$ and $\mathcal C = ((2, 1), (1, 1))$. Find $P_{\mathcal C \leftarrow \mathcal B}$ and use it on $\mathbf v = (5, 1)$.

:::solution
$$
P_{\mathcal C \leftarrow \mathcal B} = P_{\mathcal C}^{-1}P_{\mathcal B} = \begin{bmatrix} 1 & -1 \\ -1 & 2 \end{bmatrix}\begin{bmatrix} 1 & 1 \\ 1 & -1 \end{bmatrix} = \begin{bmatrix} 0 & 2 \\ 1 & -3 \end{bmatrix} .
$$

Column $0$ says $(1, 1) = 0\,(2, 1) + 1\,(1, 1)$, and column $1$ says $(1, -1) = 2\,(2, 1) - 3\,(1, 1)$. Both are correct.

We found $[\mathbf v]_{\mathcal B} = (3, 2)$, so $[\mathbf v]_{\mathcal C} = P_{\mathcal C \leftarrow \mathcal B}(3, 2) = (4, -3)$. Check: $4\,(2, 1) - 3\,(1, 1) = (5, 1)$.
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

::::example[Between two bases of polynomials]
In $\mathcal P_2$, let $\mathcal S = (1, x, x^2)$ and $\mathcal C = (1, \ 1 + x, \ (1 + x)^2)$. Find both transition matrices and use one on $p = 3 + 2x + x^2$.

:::solution
The vectors of $\mathcal C$ are easy to write in the standard basis $\mathcal S$, which gives the columns of $P_{\mathcal S \leftarrow \mathcal C}$:

$$
P_{\mathcal S \leftarrow \mathcal C} = \begin{bmatrix} 1 & 1 & 1 \\ 0 & 1 & 2 \\ 0 & 0 & 1 \end{bmatrix} , \qquad P_{\mathcal C \leftarrow \mathcal S} = \bigl(P_{\mathcal S \leftarrow \mathcal C}\bigr)^{-1} = \begin{bmatrix} 1 & -1 & 1 \\ 0 & 1 & -2 \\ 0 & 0 & 1 \end{bmatrix} .
$$

Then $[p]_{\mathcal C} = P_{\mathcal C \leftarrow \mathcal S}(3, 2, 1) = (2, 0, 1)$, the coordinates found by hand above.
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
- *Basis*: independent and spanning; every vector is a unique combination.
- *Dimensions*: $\dim \mathbb R^n = n$, $\dim \mathcal P_n = n + 1$, $\dim \mathbb R^{m \times n} = mn$.
- *Rank and nullity*: $\dim \mathrm{col}(A) = \dim \mathrm{row}(A) = r$, $\dim \ker(A) = n - r$.
- *Coordinates in R^n*: $\mathbf v = P_{\mathcal B}[\mathbf v]_{\mathcal B}$, $[\mathbf v]_{\mathcal B} = P_{\mathcal B}^{-1}\mathbf v$.
- *Transition*: $[\mathbf v]_{\mathcal C} = P_{\mathcal C \leftarrow \mathcal B}[\mathbf v]_{\mathcal B}$ with columns $[\mathbf b_j]_{\mathcal C}$; $P_{\mathcal C \leftarrow \mathcal B} = P_{\mathcal C}^{-1}P_{\mathcal B}$; $(P_{\mathcal C \leftarrow \mathcal B})^{-1} = P_{\mathcal B \leftarrow \mathcal C}$.
:::

## Further reading

- [3Blue1Brown — Change of basis](https://www.3blue1brown.com/lessons/change-of-basis) — translating between two coordinate systems, drawn.
- [Change of basis (Wikipedia)](https://en.wikipedia.org/wiki/Change_of_basis) — the transition matrix in general.
- [SageMath matrix methods](https://doc.sagemath.org/html/en/reference/matrices/sage/matrix/matrix2.html) — `pivots`, `right_kernel`, `solve_right`, `inverse`.
