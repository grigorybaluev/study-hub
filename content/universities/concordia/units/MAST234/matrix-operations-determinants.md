---
title: Matrix multiplication, special matrices and determinants
order: 4
status: detailed
weeks: [4]
introduces: []
requires:
  - {concept: matrix, strength: hard}
  - {concept: vector, strength: hard}
  - {concept: dot-product, strength: hard}
  - {concept: linear-combination-span, strength: hard}
  - {concept: linear-independence, strength: hard}
  - {concept: matrix-rank, strength: soft}
  - {concept: mathematical-induction, strength: soft}
  - {concept: computer-algebra-system, strength: soft}
reinforces:
  - {concept: matrix, perspective: "the matrix product read by entries, columns and rows; its algebra and what fails (commutativity, cancellation); diagonal, identity and triangular matrices; the transpose"}
  - {concept: matrix-inverse, perspective: "the two-sided inverse: uniqueness and the inverse of a product"}
  - {concept: determinant, perspective: "cofactor expansion as a recursive definition, triangular matrices, row operations, and det A ≠ 0 exactly when the rows are independent"}
---

Multiplying a matrix by a vector gave a linear combination of its columns. Multiplying by a
whole matrix does that once per column, and most facts about the product follow from this
reading: associativity and distributivity hold, while commutativity and cancellation do not.
The unit then names the matrices whose products are easy (diagonal, identity, triangular),
turns rows into columns with the transpose, defines the inverse, and gives a first definition
of the determinant, the number that says whether the rows of a square matrix are independent.

Indices start at $0$, as in Sage: the entries of an $m \times n$ matrix are $a_{i,j}$ with
$0 \le i \le m - 1$ and $0 \le j \le n - 1$.

## Matrix multiplication

### Rows times columns

:::definition[Matrix product]
For an $m \times n$ matrix $A$ and an $n \times l$ matrix $B$, the **product** $AB$ is the $m \times l$
matrix whose $(i, j)$ entry is the dot product of row $i$ of $A$ with column $j$ of $B$:

$$
(AB)_{i,j} = \mathbf r_i \cdot \mathbf c_j = a_{i,0}\,b_{0,j} + a_{i,1}\,b_{1,j} + \cdots + a_{i,n-1}\,b_{n-1,j} = \sum_{k=0}^{n-1} a_{i,k}\,b_{k,j} .
$$
:::

The dot product needs two vectors of the same length, so $AB$ is defined only when **the number
of columns of $A$ equals the number of rows of $B$**. The outer sizes give the size of the result:
$(m \times n)(n \times l) = m \times l$. In particular $A^2 = AA$ is defined exactly when $A$ is square,
and is then square of the same size.

::::example[A product by hand]
Compute $AB$ for $A = \begin{bmatrix} 1 & 3 & 5 \\ 7 & 9 & 11 \end{bmatrix}$ and $B = \begin{bmatrix} 0 & 2 \\ 4 & 6 \\ 8 & 10 \end{bmatrix}$.

:::solution
$A$ is $2 \times 3$ and $B$ is $3 \times 2$, so $AB$ is $2 \times 2$. Each entry is a row of $A$ dotted with a
column of $B$:

$$
AB = \begin{bmatrix} (1, 3, 5)\cdot(0, 4, 8) & (1, 3, 5)\cdot(2, 6, 10) \\ (7, 9, 11)\cdot(0, 4, 8) & (7, 9, 11)\cdot(2, 6, 10) \end{bmatrix} = \begin{bmatrix} 52 & 70 \\ 124 & 178 \end{bmatrix} .
$$
:::
::::

```python
A = matrix(QQ, [[1, 3, 5], [7, 9, 11]])
B = matrix(QQ, [[0, 2], [4, 6], [8, 10]])
r0, r1 = vector(A[0, :]), vector(A[1, :])        # rows of A
c0, c1 = vector(B[:, 0]), vector(B[:, 1])        # columns of B
matrix(QQ, [[r0.dot_product(c0), r0.dot_product(c1)],
            [r1.dot_product(c0), r1.dot_product(c1)]])   # [52 70; 124 178]
A * B                                            # the same
```

One entry never needs the whole product: $(AB)_{i,j}$ uses only row $i$ of $A$ and column $j$ of $B$.

::::example[One entry of a large product]
$A$ is $7 \times 3$ with row $3$ equal to $(-1, 1, 4)$, and $B$ is $3 \times 7$ with column $4$ equal to
$(2, 1, 1)$. Find the $(3, 4)$ entry of $AB$.

:::solution
$(AB)_{3,4} = (-1, 1, 4) \cdot (2, 1, 1) = -2 + 1 + 4 = 3$. The other $48$ entries are not needed.
:::
::::

### Column by column, row by row

Grouping the dot products by column of $B$, or by row of $A$, gives two more readings:

$$
AB = A\,[\,\mathbf c_0 \ \mathbf c_1 \ \cdots \ \mathbf c_{l-1}\,] = [\,A\mathbf c_0 \ \ A\mathbf c_1 \ \cdots \ A\mathbf c_{l-1}\,] ,
\qquad
AB = \begin{bmatrix} \mathbf r_0 \\ \vdots \\ \mathbf r_{m-1} \end{bmatrix} B = \begin{bmatrix} \mathbf r_0 B \\ \vdots \\ \mathbf r_{m-1} B \end{bmatrix} .
$$

Column $j$ of $AB$ is $A$ times column $j$ of $B$, and $A\mathbf c_j$ is a linear combination of the
columns of $A$ with the entries of $\mathbf c_j$ as coefficients. Likewise row $i$ of $AB$ is a
combination of the rows of $B$.

:::remark[Recall: column space, row space]
The **column space** $\mathrm{col}(A)$ is the span of the columns of $A$; the **row space**
$\mathrm{row}(A)$ is the span of its rows.
:::

::::theorem[Products stay in the column space]
For an $m \times n$ matrix $A$ and an $n \times l$ matrix $B$,

$$
\mathrm{col}(AB) \subseteq \mathrm{col}(A) \qquad \mathrm{row}(AB) \subseteq \mathrm{row}(B) .
$$

:::proof
Every column of $AB$ is a linear combination of the columns of $A$. An element of $\mathrm{col}(AB)$
is a linear combination of those columns, hence a combination of combinations of the columns of
$A$, which is again a combination of the columns of $A$. The row statement is the same argument
with rows of $B$.
:::
::::

### The algebra of products

:::theorem[Properties of the matrix product]
For $A, C \in \mathbb R^{m \times n}$, $B, D \in \mathbb R^{n \times l}$, $E \in \mathbb R^{l \times k}$ and $s \in \mathbb R$:

1. $A(B + D) = AB + AD$ and $A(sB) = s(AB)$: multiplying on the left by $A$ is linear;
2. $(A + C)B = AB + CB$ and $(sA)B = s(AB)$: multiplying on the right by $B$ is linear;
3. $A(BE) = (AB)E$: the product is **associative**.
:::

:::proof
Take property 1. Write $B = [\,\mathbf b_0 \ \cdots \ \mathbf b_{l-1}\,]$ and $D = [\,\mathbf d_0 \ \cdots \ \mathbf d_{l-1}\,]$ and use the
column reading, then linearity of $A\mathbf x$:

$$
\begin{aligned}
A(B + D) &= [\,A(\mathbf b_0 + \mathbf d_0) \ \cdots \ A(\mathbf b_{l-1} + \mathbf d_{l-1})\,] \\
  &= [\,A\mathbf b_0 + A\mathbf d_0 \ \cdots \ A\mathbf b_{l-1} + A\mathbf d_{l-1}\,] \\
  &= [\,A\mathbf b_0 \ \cdots \ A\mathbf b_{l-1}\,] \\
  &\quad + [\,A\mathbf d_0 \ \cdots \ A\mathbf d_{l-1}\,] \\
  &= AB + AD .
\end{aligned}
$$

For associativity compare entries: both $(A(BE))_{i,j}$ and $((AB)E)_{i,j}$ equal the double sum
$\sum_{k}\sum_{p} a_{i,k}\,b_{k,p}\,e_{p,j}$, summed in the two possible orders.
:::

```python
A = matrix(QQ, [[1, 3, 5], [7, 9, 11]])
B = matrix(QQ, [[0, 2], [4, 6], [8, 10]])
C = matrix(QQ, [[5, 4, 3, 2], [6, 7, 5, 4]])
(A * B) * C == A * (B * C)       # True; both are [680 698 506 384; 1688 1742 1262 960]
```

### What does not hold

:::caution[The product is not commutative]
Even when $AB$ and $BA$ are both defined, they are usually different. With the $2 \times 3$ matrix $A$
and $3 \times 2$ matrix $B$ above, $AB$ is $2 \times 2$ and $BA$ is $3 \times 3$. Even for two square
matrices of the same size:

$$
\begin{bmatrix} 1 & 2 \\ 3 & 4 \end{bmatrix}\begin{bmatrix} 5 & 6 \\ 7 & 8 \end{bmatrix} = \begin{bmatrix} 19 & 22 \\ 43 & 50 \end{bmatrix}
\qquad
\begin{bmatrix} 5 & 6 \\ 7 & 8 \end{bmatrix}\begin{bmatrix} 1 & 2 \\ 3 & 4 \end{bmatrix} = \begin{bmatrix} 23 & 34 \\ 31 & 46 \end{bmatrix} .
$$

So the order of factors matters: $(A + B)^2 = A^2 + AB + BA + B^2$, not $A^2 + 2AB + B^2$.
:::

:::caution[A zero product does not need a zero factor]
For numbers, $ab = 0$ forces $a = 0$ or $b = 0$. For matrices it does not:

$$
\begin{bmatrix} 1 & 2 \\ 3 & 6 \end{bmatrix}\begin{bmatrix} -2 & 10 \\ 1 & -5 \end{bmatrix} = \begin{bmatrix} 0 & 0 \\ 0 & 0 \end{bmatrix}
\qquad
\begin{bmatrix} 1 & 1 \\ -1 & -1 \end{bmatrix}^2 = \begin{bmatrix} 0 & 0 \\ 0 & 0 \end{bmatrix} .
$$

The columns of the second factor lie in the kernel of the first. As a consequence, $AB = AC$
does not allow cancelling $A$.
:::

:::insight
Read $AB$ as "$A$ applied to each column of $B$". Linearity and associativity carry over from
numbers; commutativity and cancellation do not, and the counterexamples are small.
:::

## Special matrices

### Diagonal matrices

:::definition[Square and diagonal matrices]
A matrix is **square** if it is $n \times n$. A square matrix $D$ is **diagonal** if its only nonzero
entries are on the main diagonal: $d_{i,j} = 0$ whenever $i \neq j$.
:::

::::theorem[Multiplying by a diagonal matrix]
Let $A$ be $n \times n$ and $D$ diagonal $n \times n$.
1. $DA$ is $A$ with row $i$ scaled by $d_{i,i}$.
2. $AD$ is $A$ with column $j$ scaled by $d_{j,j}$.

:::proof
Only one term of each sum survives, because $d_{i,k} = 0$ for $k \neq i$:

$$
(DA)_{i,j} = \sum_{k=0}^{n-1} d_{i,k}\,a_{k,j} = d_{i,i}\,a_{i,j} \qquad (AD)_{i,j} = \sum_{k=0}^{n-1} a_{i,k}\,d_{k,j} = a_{i,j}\,d_{j,j} .
$$
:::
::::

```python
A = matrix(QQ, 3, 3, [1] * 9)                    # all ones
D = diagonal_matrix(QQ, [1, 2, 3])
D * A                                            # rows scaled: [1 1 1; 2 2 2; 3 3 3]
A * D                                            # columns scaled: [1 2 3; 1 2 3; 1 2 3]
```

### The identity matrix

:::definition[Kronecker delta, identity matrix]
The **Kronecker delta** is $\delta_{i,j} = 1$ if $i = j$ and $\delta_{i,j} = 0$ if $i \neq j$. The $n \times n$
**identity matrix** $I_n$ has $(i, j)$ entry $\delta_{i,j}$: ones on the diagonal, zeros elsewhere.
:::

::::theorem[The identity is the neutral element]
$I_n A = A I_n = A$ for every $n \times n$ matrix $A$, and $I_n$ is the only $n \times n$ matrix with this property.

:::proof
$I_n$ is diagonal with every $d_{i,i} = 1$, so by the previous theorem it scales every row (and
column) by $1$. If $E$ also satisfies $EA = AE = A$ for all $A$, then $E = E I_n = I_n$, using the
property of $E$ with $A = I_n$ and the property of $I_n$ with $A = E$.
:::
::::

### Triangular matrices

:::definition[Upper and lower triangular]
A square matrix $A$ is **upper triangular** if $a_{i,j} = 0$ whenever $i > j$ (only zeros below the
diagonal), and **lower triangular** if $a_{i,j} = 0$ whenever $i < j$ (only zeros above it). A diagonal
matrix is both.
:::

::::theorem[Triangular matrices are closed under sums and products]
If $A, B \in \mathbb R^{n \times n}$ are both upper triangular, so are $A + B$ and $AB$; the same holds for
lower triangular.

:::proof
For sums, entry by entry: $0 + 0 = 0$ below the diagonal. For the product, let $i > j$ and split the
sum at $k = i$:

$$
(AB)_{i,j} = \sum_{k=0}^{i-1} \underbrace{a_{i,k}}_{k < i:\ 0}\, b_{k,j} + \sum_{k=i}^{n-1} a_{i,k}\, \underbrace{b_{k,j}}_{k \ge i > j:\ 0} = 0 .
$$

The lower triangular case is the same with the inequalities reversed.
:::
::::

:::equations
- *Diagonal factor*: $(DA)_{i,j} = d_{i,i}a_{i,j}$ (rows scaled), $(AD)_{i,j} = a_{i,j}d_{j,j}$ (columns scaled).
- *Identity*: $(I_n)_{i,j} = \delta_{i,j}$; $I_nA = AI_n = A$.
- *Triangular*: upper means $a_{i,j} = 0$ for $i > j$; sums and products of upper triangular matrices are upper triangular.
:::

## The transpose

:::definition[Transpose]
The **transpose** of an $m \times n$ matrix $A$ is the $n \times m$ matrix $A^{\mathrm T}$ with entries
$(A^{\mathrm T})_{i,j} = a_{j,i}$: the rows of $A$ become the columns of $A^{\mathrm T}$.
:::

For example $\begin{bmatrix} 1 & 2 & 3 \\ 4 & 5 & 6 \end{bmatrix}^{\mathrm T} = \begin{bmatrix} 1 & 4 \\ 2 & 5 \\ 3 & 6 \end{bmatrix}$. Transposing twice gives $A$ back, and
$(A + B)^{\mathrm T} = A^{\mathrm T} + B^{\mathrm T}$.

::::theorem[Transpose of a product]
For an $m \times n$ matrix $A$ and an $n \times l$ matrix $B$, $(AB)^{\mathrm T} = B^{\mathrm T} A^{\mathrm T}$.

:::proof
Both sides are $l \times m$. Compare the $(i, j)$ entries:

$$
\big((AB)^{\mathrm T}\big)_{i,j} = (AB)_{j,i} = \sum_{k=0}^{n-1} a_{j,k}\,b_{k,i} = \sum_{k=0}^{n-1} (B^{\mathrm T})_{i,k}\,(A^{\mathrm T})_{k,j} = (B^{\mathrm T} A^{\mathrm T})_{i,j} .
$$

The last sum is row $i$ of $B^{\mathrm T}$ dotted with column $j$ of $A^{\mathrm T}$.
:::
::::

:::caution[The transpose of a product reverses the order]
The order reverses. $A^{\mathrm T} B^{\mathrm T}$ is usually not even defined: for the $2 \times 3$ matrix $A$ and
$3 \times 2$ matrix $B$ above, $A^{\mathrm T}B^{\mathrm T}$ is $3 \times 3$, while $(AB)^{\mathrm T}$ is $2 \times 2$.
:::

```python
A = matrix(QQ, [[1, 3, 5], [7, 9, 11]])
B = matrix(QQ, [[0, 2], [4, 6], [8, 10]])
(A * B).transpose()                              # [52 124; 70 178]
B.transpose() * A.transpose()                    # the same
```

## The inverse of a matrix

:::definition[Invertible matrix]
An $n \times n$ matrix $A$ is **invertible** (or **nonsingular**) if there is an $n \times n$ matrix $B$ with
$AB = BA = I_n$. Then $B$ is the **inverse** of $A$, written $A^{-1}$. A matrix with no inverse is
**singular** (noninvertible).
:::

::::theorem[The inverse is unique]
An invertible matrix has exactly one inverse.

:::proof
Suppose $AB = BA = I_n$ and $AC = CA = I_n$. By associativity,

$$
C = I_n C = (BA)C = B(AC) = B I_n = B .
$$
:::
::::

::::theorem[Inverse of a product]
If $A, B \in \mathbb R^{n \times n}$ are invertible, then $AB$ is invertible and $(AB)^{-1} = B^{-1}A^{-1}$.

:::proof
Check both products with associativity:

$$
(B^{-1}A^{-1})(AB) = B^{-1}(A^{-1}A)B = B^{-1}I_nB = I_n \qquad (AB)(B^{-1}A^{-1}) = A(BB^{-1})A^{-1} = AA^{-1} = I_n .
$$
:::
::::

The order reverses, as for the transpose: to undo "first $B$, then $A$", undo $A$ first. The next
unit asks when an inverse exists and how to compute it.

:::remark
A matrix with a zero product $AB = 0$, $B \neq 0$, is never invertible: multiplying by $A^{-1}$ on the
left would give $B = 0$. So both examples of zero products above involve singular matrices.
:::

## Determinants

### A recursive definition

The determinant assigns a number to every square matrix. It can be characterised as the only
function $\mathbb R^{n \times n} \to \mathbb R$ with four properties:

1. $\det(I_n) = 1$;
2. swapping two rows ($\mathbf r_j \leftrightarrow \mathbf r_k$) changes the sign;
3. scaling one row by $c$ ($c\,\mathbf r_j \to \mathbf r_j$) multiplies the determinant by $c$;
4. adding a multiple of one row to another ($\mathbf r_j + c\,\mathbf r_k \to \mathbf r_j$) does not change it.

Deriving a formula from these rules takes a while. Instead, here is the formula; that it has the
four properties is stated below without proof.

:::definition[Minor, cofactor]
For an $n \times n$ matrix $A$, the **minor matrix** $A_{ij}$ is the $(n-1) \times (n-1)$ matrix left after
deleting row $i$ and column $j$. Its determinant $\det(A_{ij})$ is the $(i, j)$ **minor**, and
$C_{i,j} = (-1)^{i+j}\det(A_{ij})$ is the $(i, j)$ **cofactor**.
:::

The signs $(-1)^{i+j}$ form a checkerboard starting with $+$ at $(0, 0)$.

:::definition[Determinant]
For $A = [a]$, $\det(A) = a$; for $A = \begin{bmatrix} a & b \\ c & d \end{bmatrix}$, $\det(A) = ad - bc$. For an $n \times n$ matrix, the
**cofactor expansion along row $i$** is

$$
\det(A) = \sum_{j=0}^{n-1} a_{i,j}\,C_{i,j} = \sum_{j=0}^{n-1} a_{i,j}\,(-1)^{i+j}\det(A_{ij}) ,
$$

and the **cofactor expansion along column $j$** is $\det(A) = \sum_{i=0}^{n-1} a_{i,j}\,C_{i,j}$.
:::

:::theorem[Every expansion gives the same value]
For an $n \times n$ matrix, the cofactor expansions along every row and along every column are equal.
:::

The definition is **recursive**: an $n \times n$ determinant is a combination of $(n-1) \times (n-1)$
determinants, down to the $2 \times 2$ formula. Since any row or column may be used, choose the one
with the most zeros.

::::example[A 4 × 4 determinant]
Compute $\det(A)$ for $A = \begin{bmatrix} 1 & 0 & -2 & 4 \\ 2 & 3 & 0 & 0 \\ 1 & 2 & 5 & 7 \\ 0 & 3 & 0 & 1 \end{bmatrix}$.

:::solution
Row $1$ has two zeros. Expanding along it, with signs $-, +, -, +$:

$$
\det(A) = -2\det\begin{bmatrix} 0 & -2 & 4 \\ 2 & 5 & 7 \\ 3 & 0 & 1 \end{bmatrix} + 3\det\begin{bmatrix} 1 & -2 & 4 \\ 1 & 5 & 7 \\ 0 & 0 & 1 \end{bmatrix} .
$$

In the first $3 \times 3$ matrix expand down column $0$ (entries $0, 2, 3$, signs $+, -, +$); in the second
along row $2$ (entries $0, 0, 1$, signs $+, -, +$):

$$
\begin{aligned}
\det(A) &= -2\,\Big( -2\det\begin{bmatrix} -2 & 4 \\ 0 & 1 \end{bmatrix} + 3\det\begin{bmatrix} -2 & 4 \\ 5 & 7 \end{bmatrix} \Big) \\
  &\quad + 3\det\begin{bmatrix} 1 & -2 \\ 1 & 5 \end{bmatrix} \\
  &= -2\big( -2(-2) + 3(-34) \big) + 3(7) \\
  &= -2(-98) + 21 = 217 .
\end{aligned}
$$
:::
::::

```python
A = matrix(QQ, [[1, 0, -2, 4], [2, 3, 0, 0], [1, 2, 5, 7], [0, 3, 0, 1]])
A10 = A[[0, 2, 3], [1, 2, 3]]                    # minor matrix: delete row 1, column 0
A11 = A[[0, 2, 3], [0, 2, 3]]                    # delete row 1, column 1
2 * (-1)^(1+0) * det(A10) + 3 * (-1)^(1+1) * det(A11)   # 217: expansion along row 1
det(A), A.determinant()                          # (217, 217)
M = matrix(QQ, 4, 4, [1..16])
det(M[[1, 2, 3], [0, 1, 3]])                     # the (0, 2) minor of M: 0
```

### Triangular matrices and row operations

::::theorem[Determinant of a triangular matrix]
If $A$ is $n \times n$ triangular, $\det(A) = a_{0,0}\,a_{1,1} \cdots a_{n-1,n-1}$, the product of its diagonal entries.

:::proof
For upper triangular $A$, by induction on $n$. For $n = 1$, $\det[a] = a$. Assume the statement
for $k \times k$ matrices and let $A$ be $(k+1) \times (k+1)$. Expand along column $0$, where every entry
below $a_{0,0}$ is $0$:

$$
\det(A) = \sum_{i=0}^{k} a_{i,0}\,(-1)^{i}\det(A_{i0}) = a_{0,0}\det(A_{00}) .
$$

$A_{00}$ is $A$ without its first row and column: upper triangular, $k \times k$, with diagonal
$a_{1,1}, \dots, a_{k,k}$. By the hypothesis $\det(A_{00}) = a_{1,1} \cdots a_{k,k}$, so
$\det(A) = a_{0,0}\,a_{1,1} \cdots a_{k,k}$. For lower triangular $A$, expand along row $0$ instead.
:::
::::

In particular $\det(I_n) = 1$ and the determinant of a diagonal matrix is the product of its
diagonal.

:::theorem[Row operations and the determinant]
Let $B$ come from the $n \times n$ matrix $A$ by one row operation.
1. Scaling a row, $c\,\mathbf r_i \to \mathbf r_i$: $\det(B) = c\det(A)$.
2. Swapping two rows, $\mathbf r_i \leftrightarrow \mathbf r_j$: $\det(B) = -\det(A)$.
3. Adding a multiple of a row, $\mathbf r_i + c\,\mathbf r_j \to \mathbf r_i$: $\det(B) = \det(A)$.

Together with $\det(I_n) = 1$, these are the four properties above.
:::

This gives a faster way to compute a determinant than cofactor expansion: row reduce to a
triangular matrix, keep track of the swaps and scalings, and multiply the diagonal.

### What the determinant detects

::::theorem[Independent rows]
For an $n \times n$ matrix $A$, the rows of $A$ are linearly independent if and only if $\det(A) \neq 0$.

:::proof
A row operation with $c \neq 0$ multiplies the determinant by $c$, $-1$ or $1$: never by $0$. So row
equivalent matrices have determinants that are both zero or both nonzero, and $\det(A) \neq 0$
exactly when $\det(R) \neq 0$ for the RREF $R$ of $A$.

If the rows are independent, $R$ has a pivot in every row; being square, $R = I_n$, and
$\det(R) = 1 \neq 0$. If the rows are dependent, $R$ has a row of zeros, and expanding along that
row gives $\det(R) = 0$.
:::
::::

::::theorem[Determinant of the transpose]
For every $n \times n$ matrix $A$, $\det(A^{\mathrm T}) = \det(A)$.

:::proof
(Sketch.) Row $i$ of $A^{\mathrm T}$ is column $i$ of $A$, and the minors match: $(A^{\mathrm T})_{ij} = (A_{ji})^{\mathrm T}$.
So the expansion of $\det(A^{\mathrm T})$ along row $i$ is the expansion of $\det(A)$ along column $i$,
and by induction on $n$ the two agree.
:::
::::

Consequently everything said about rows holds for columns: the columns of a square matrix are
independent exactly when $\det(A) \neq 0$, and column operations change the determinant as row
operations do.

:::insight
The determinant is one number that answers the question of the previous unit for a square
matrix: are the rows (equivalently, the columns) independent? Cofactor expansion defines it,
triangular matrices make it easy, and row operations change it in three predictable ways.
:::

:::equations{#det}
- *Cofactor expansion along row $i$*: $\det(A) = \sum_{j} a_{i,j}\,(-1)^{i+j}\det(A_{ij})$; along a column, the same with the roles of $i$ and $j$ exchanged.
- *$2 \times 2$*: $\det\begin{bmatrix} a & b \\ c & d \end{bmatrix} = ad - bc$.
- *Triangular*: $\det(A) = a_{0,0}\,a_{1,1} \cdots a_{n-1,n-1}$.
- *Row operations*: scale by $c$ multiplies by $c$; a swap changes the sign; adding a multiple of a row changes nothing.
- *Independence*: rows (or columns) independent $\iff \det(A) \neq 0$; $\det(A^{\mathrm T}) = \det(A)$.
:::

## Further reading

- [Paul's Online Notes — Matrix Arithmetic & Operations](https://tutorial.math.lamar.edu/Classes/LinAlg/MatrixArithmetic.aspx) — sizes, products and the transpose, with many small examples.
- [Paul's Online Notes — The Determinant Function](https://tutorial.math.lamar.edu/Classes/LinAlg/DeterminantFunction.aspx) — minors, cofactors and expansion.
- [3Blue1Brown — Matrix multiplication as composition](https://www.3blue1brown.com/lessons/matrix-multiplication) — why the product is defined the way it is, and why order matters.
