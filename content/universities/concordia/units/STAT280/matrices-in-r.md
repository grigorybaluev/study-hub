---
title: Vectors and matrices in R
order: 11
status: detailed
weeks: [11]
introduces:
  - {concept: matrix-decomposition, perspective: "the LU decomposition behind solve()"}
requires:
  - {concept: r-programming, strength: hard}
  - {concept: vectorized-operations, strength: hard}
reinforces:
  - {concept: matrix, perspective: "computing with matrices in R"}
  - {concept: matrix-inverse, perspective: "solve() in R"}
  - {concept: determinant, perspective: "det() in R"}
  - {concept: linear-system, perspective: "solving numerically in R"}
  - {concept: floating-point, perspective: "why x = A⁻¹b is less accurate than solving directly"}
---

Constructing and indexing matrices, matrix multiplication, inversion, and solving linear
systems in R.

## Linear algebra on a computer

Linear algebra studies vector spaces and linear maps. Vectors are written as columns of numbers
and linear maps as matrices: applying a map is multiplying a vector by its matrix, and composing
maps is multiplying matrices. Its most important use is **solving systems of linear equations**,
written as one matrix equation:

$$
\begin{aligned} 3x_1 - 4x_2 &= 6 \\ x_1 + 2x_2 &= -3 \end{aligned}
\qquad\Longleftrightarrow\qquad
A\mathbf x = \mathbf b, \quad A = \begin{pmatrix} 3 & -4 \\ 1 & 2 \end{pmatrix}, \quad \mathbf b = \begin{pmatrix} 6 \\ -3 \end{pmatrix}
$$

Statistics uses it everywhere: regression, smoothing, simulation (the Cholesky factor of the simulation
units). On a computer, two questions come first: is the answer **accurate** (rounding error), and
is it **efficient**? Both often mean computing differently formula: we will
see that $\mathbf x = A^{-1}\mathbf b$ is the wrong way to solve $A\mathbf x = \mathbf b$. R calls the
well-tested LAPACK library for this work.

## Matrices as R objects

### How matrices are stored

R's numeric vectors and matrices match the mathematical objects closely. R does not distinguish
row and column vectors (a matrix with one row or one column does, when it matters). A matrix is a
**vector with a dimension attribute**: the numbers are stored in one sequence, **column by
column**, and `dim` says how to fold them into rows and columns. Changing `dim` refolds the same
numbers.

```r
A <- matrix(1:6, nrow = 2)       # filled column by column
A
##      [,1] [,2] [,3]
## [1,]    1    3    5
## [2,]    2    4    6
attributes(A)                    # just a dimension attribute on a vector
## $dim
## [1] 2 3
## 
as.vector(A)
## [1] 1 2 3 4 5 6
matrix(1:6, nrow = 2, byrow = TRUE)
##      [,1] [,2] [,3]
## [1,]    1    2    3
## [2,]    4    5    6
dim(A) <- c(3, 2)                # same six numbers, new shape
A
##      [,1] [,2]
## [1,]    1    4
## [2,]    2    5
## [3,]    3    6
```

### Constructing matrices

`matrix(data, nrow, ncol)` folds a vector (`byrow = TRUE` fills row by row); `cbind()` and
`rbind()` bind vectors as columns or rows; `diag()` makes identity and diagonal matrices;
`outer(x, y, f)` builds the matrix with entries $f(x_i, y_j)$.

:::example[Hilbert matrices]
The $n \times n$ Hilbert matrix has $(i, j)$ entry $1/(i + j - 1)$. It is easy to build with
`outer()`, and numerically notorious, as we will see.
:::

```r
H4 <- 1 / (outer(1:4, 1:4, "+") - 1)     # Hilbert matrix: entry (i, j) is 1/(i + j - 1)
round(H4, 4)
##        [,1]   [,2]   [,3]   [,4]
## [1,] 1.0000 0.5000 0.3333 0.2500
## [2,] 0.5000 0.3333 0.2500 0.2000
## [3,] 0.3333 0.2500 0.2000 0.1667
## [4,] 0.2500 0.2000 0.1667 0.1429
diag(3)                                  # identity
##      [,1] [,2] [,3]
## [1,]    1    0    0
## [2,]    0    1    0
## [3,]    0    0    1
diag(c(2, 5))                            # diagonal matrix from a vector
##      [,1] [,2]
## [1,]    2    0
## [2,]    0    5
matrix(0, nrow = 2, ncol = 3)
##      [,1] [,2] [,3]
## [1,]    0    0    0
## [2,]    0    0    0
```

### Indexing, names, and drop

Indexing works as for data frames: `X[i, j]` is one entry, `X[i, ]` row $i$, `X[, j]` column $j$.
A single row or column comes back as a plain vector, losing its matrix shape; `drop = FALSE`
keeps it a $1 \times n$ or $n \times 1$ matrix. Rows and columns can have names (`rownames()`,
`colnames()`, `dimnames()`), usable as indices.

```r
x <- 1:4
X <- cbind(x, x2 = x^2)          # columns named after their arguments
X
##      x x2
## [1,] 1  1
## [2,] 2  4
## [3,] 3  9
## [4,] 4 16
X[3, 2]
## x2 
##  9 
X[3, ]                           # a row: the result is a plain vector ...
##  x x2 
##  3  9 
X[3, , drop = FALSE]             # ... unless drop = FALSE keeps it a 1 x 2 matrix
##      x x2
## [1,] 3  9
rownames(X) <- c("a", "b", "c", "d")
X[, "x2"]
##  a  b  c  d 
##  1  4  9 16 
X$x2
## Error: $ operator is invalid for atomic vectors
```

:::caution[No dollar-sign access for matrices]
A data frame is a list of columns, so `df$name` works. A matrix is a single vector with a
dimension attribute, so `$` fails; use `X[, "name"]`.
:::

### Matrix properties

`dim()` gives the numbers of rows and columns, `diag()` the diagonal, `det()` the determinant,
and `t()` the transpose $M^{\mathsf T}$. There is no built-in trace, but it is one line: the sum of
the diagonal.

```r
M <- matrix(c(4, 2, 0,
              1, 3, 5,
              2, 0, 6), nrow = 3, byrow = TRUE)
dim(M)
## [1] 3 3
diag(M)
## [1] 4 3 6
trace <- function(S) sum(diag(S))
trace(M)
## [1] 13
det(M)
## [1] 80
det(t(M))                        # a matrix and its transpose have the same determinant
## [1] 80
```

### Triangular matrices

`lower.tri(M)` and `upper.tri(M)` return logical matrices marking the entries below or above
the diagonal (`diag = TRUE` includes the diagonal). Used as an index, they select or overwrite
one triangle.

```r
lower.tri(M)                     # TRUE strictly below the diagonal
##       [,1]  [,2]  [,3]
## [1,] FALSE FALSE FALSE
## [2,]  TRUE FALSE FALSE
## [3,]  TRUE  TRUE FALSE
L <- M
L[upper.tri(M)] <- 0             # keep the diagonal and below
L
##      [,1] [,2] [,3]
## [1,]    4    0    0
## [2,]    1    3    0
## [3,]    2    0    6
M[lower.tri(M)]                  # the entries below the diagonal, column by column
## [1] 1 2 0
```

## Matrix arithmetic

### Element by element

`+`, `-`, `*`, `/` and `^` act **element by element**, exactly as for vectors, so the two matrices
must have the same dimensions. Multiplying by a number scales every entry.

```r
2 * X
##   x x2
## a 2  2
## b 4  8
## c 6 18
## d 8 32
X + X
##   x x2
## a 2  2
## b 4  8
## c 6 18
## d 8 32
X * X                            # element by element, NOT the matrix product
##    x  x2
## a  1   1
## b  4  16
## c  9  81
## d 16 256
t(X) + X
## Error: non-conformable arrays
```

### The matrix product

:::definition[Matrix product]
For $A$ of size $m \times n$ and $B$ of size $n \times p$, the product $AB$ is the $m \times p$
matrix with entries $(AB)_{ij} = \sum_{k=1}^{n} a_{ik} b_{kj}$. It represents applying $B$ first,
then $A$. The inner dimensions must **conform**: the columns of $A$ must match the rows of $B$.
:::

R's operator for it is `%*%`. `crossprod(X, Y)` computes $X^{\mathsf T} Y$ (and `crossprod(X)`
computes $X^{\mathsf T} X$) without building the transpose as a separate object, which saves memory
and time for large matrices. `tcrossprod(X)` computes $X X^{\mathsf T}$.

```r
t(X) %*% X                       # (2 x 4) times (4 x 2) gives 2 x 2
##      x  x2
## x   30 100
## x2 100 354
X %*% X
## Error: non-conformable arguments
crossprod(X)                     # the same as t(X) %*% X, without forming t(X)
##      x  x2
## x   30 100
## x2 100 354
dim(X %*% t(X))                  # tcrossprod(X) computes this one
## [1] 4 4
```

:::caution[* is not %*%]
`X * Y` multiplies matching entries; `X %*% Y` is the matrix product. Both exist for good
reasons, and mixing them up gives wrong answers without an error whenever the dimensions happen
to allow both.
:::

## Inverting matrices and solving systems

### The inverse

:::definition[Inverse]
The inverse of a square $n \times n$ matrix $A$ is the matrix $A^{-1}$ with $AA^{-1} = I$. Column
$j$ of $A^{-1}$ solves the system $A\mathbf x = \mathbf e_j$, so finding $A^{-1}$ means solving
$n$ linear systems. It exists exactly when $\det A \ne 0$.
:::

`solve(A)` returns $A^{-1}$; `solve(A, b)` solves $A\mathbf x = \mathbf b$. The product $BB^{-1}$
computed below is the identity only up to rounding: an entry of order $10^{-16}$ is "numerically
zero". For a singular matrix R reports the failure.

```r
B <- matrix(c(2, 1,
              1, 3), nrow = 2, byrow = TRUE)
Binv <- solve(B)
Binv
##      [,1] [,2]
## [1,]  0.6 -0.2
## [2,] -0.2  0.4
B %*% Binv
##               [,1] [,2]
## [1,]  1.000000e+00    0
## [2,] -1.110223e-16    1
S <- matrix(c(1, 2,
              2, 4), nrow = 2, byrow = TRUE)   # second row = 2 x first row
det(S)
## [1] 0
solve(S)
## Error: Lapack routine dgesv: system is exactly singular: U[2,2] = 0
```

:::caution[Don't invert to solve]
To solve $A\mathbf x = \mathbf b$, call `solve(A, b)`, not `solve(A) %*% b`. Computing $A^{-1}$ solves
$n$ systems to answer one question, and every extra operation adds rounding error.
:::

### The LU decomposition

The standard way to solve a system is to factor $A$ into matrices that make solving easy.

:::definition[LU decomposition]
$A = LU$, where $L$ is **lower triangular with 1s on the diagonal** and $U$ is **upper
triangular**. Each entry of $A$ is a sum $a_{ij} = \sum_k l_{ik} u_{kj}$ in which the known zeros
and ones leave a single unknown, so the entries of $L$ and $U$ can be found one at a time.
:::

:::example[Factoring a 3 × 3 matrix]
For

$$
A = \begin{pmatrix} 2 & 1 & 1 \\ 4 & 3 & 3 \\ 8 & 7 & 9 \end{pmatrix}
$$

go column by column. Column 1: $u_{11} = a_{11} = 2$, then $l_{21} = a_{21}/u_{11} = 2$ and
$l_{31} = 8/2 = 4$. Column 2: $u_{12} = a_{12} = 1$; $a_{22} = l_{21}u_{12} + u_{22}$ gives
$u_{22} = 3 - 2 = 1$; $a_{32} = l_{31}u_{12} + l_{32}u_{22}$ gives $l_{32} = (7 - 4)/1 = 3$.
Column 3: $u_{13} = 1$, $u_{23} = 3 - 2 \cdot 1 = 1$, $u_{33} = 9 - 4 \cdot 1 - 3 \cdot 1 = 2$. So

$$
L = \begin{pmatrix} 1 & 0 & 0 \\ 2 & 1 & 0 \\ 4 & 3 & 1 \end{pmatrix} \qquad U = \begin{pmatrix} 2 & 1 & 1 \\ 0 & 1 & 1 \\ 0 & 0 & 2 \end{pmatrix}
$$
:::

The same procedure in R, for any size:

```r
lu.decompose <- function(A) {
  # Doolittle: A = L U, L unit lower triangular, U upper triangular (no pivoting)
  n <- nrow(A)
  L <- diag(n)
  U <- matrix(0, n, n)
  for (j in 1:n) {
    for (i in 1:j)                       # column j of U, from the top down
      U[i, j] <- A[i, j] - sum(L[i, seq_len(i - 1)] * U[seq_len(i - 1), j])
    if (j < n) for (i in (j + 1):n)      # column j of L, below the diagonal
      L[i, j] <- (A[i, j] - sum(L[i, seq_len(j - 1)] * U[seq_len(j - 1), j])) / U[j, j]
  }
  list(L = L, U = U)
}
A <- matrix(c(2, 1, 1,
              4, 3, 3,
              8, 7, 9), nrow = 3, byrow = TRUE)
f <- lu.decompose(A)
f
## $L
##      [,1] [,2] [,3]
## [1,]    1    0    0
## [2,]    2    1    0
## [3,]    4    3    1
## 
## $U
##      [,1] [,2] [,3]
## [1,]    2    1    1
## [2,]    0    1    1
## [3,]    0    0    2
## 
f$L %*% f$U                          # gives A back
##      [,1] [,2] [,3]
## [1,]    2    1    1
## [2,]    4    3    3
## [3,]    8    7    9
```

### Forward elimination and back substitution

With $A = LU$, the system $A\mathbf x = \mathbf b$ is $L(U\mathbf x) = \mathbf b$. Put $\mathbf y = U\mathbf x$ and
solve two triangular systems:

:::steps[Solving A x = b with an LU decomposition]
1. **Forward elimination**: solve $L\mathbf y = \mathbf b$ from the top. The first equation contains
   only $y_1$; each later one has one new unknown once the earlier ones are known.
2. **Back substitution**: solve $U\mathbf x = \mathbf y$ from the bottom. The last equation contains
   only $x_n$; work upwards.
:::

:::example[Solving with the factors]
For $\mathbf b = (4, 10, 24)^{\mathsf T}$: forward, $y_1 = 4$, $y_2 = 10 - 2 \cdot 4 = 2$,
$y_3 = 24 - 4 \cdot 4 - 3 \cdot 2 = 2$. Back, $x_3 = 2/2 = 1$, $x_2 = (2 - 1)/1 = 1$,
$x_1 = (4 - 1 - 1)/2 = 1$.
:::

```r
forward.sub <- function(L, b) {
  # solve L y = b, L lower triangular, from the first equation down
  y <- numeric(length(b))
  for (i in seq_along(b))
    y[i] <- (b[i] - sum(L[i, seq_len(i - 1)] * y[seq_len(i - 1)])) / L[i, i]
  y
}
back.sub <- function(U, y) {
  # solve U x = y, U upper triangular, from the last equation up
  n <- length(y)
  x <- numeric(n)
  for (i in n:1) {
    later <- seq_len(n - i) + i            # indices i+1, ..., n (none when i = n)
    x[i] <- (y[i] - sum(U[i, later] * x[later])) / U[i, i]
  }
  x
}
b <- c(4, 10, 24)
y <- forward.sub(f$L, b)
y
## [1] 4 2 2
back.sub(f$U, y)
## [1] 1 1 1
forwardsolve(f$L, b)                 # R's built-in versions
## [1] 4 2 2
backsolve(f$U, forwardsolve(f$L, b))
## [1] 1 1 1
solve(A, b)
## [1] 1 1 1
```

Solving the $n \times n$ system is reduced to one equation in one unknown at a time. `solve()`
works this way, with one refinement: it reorders the rows as it goes (**partial pivoting**), which
avoids dividing by zero and keeps rounding error small. Once $A$ is factored, each new right-hand
side costs only the two cheap triangular solves.

```sim
id: r-lu-steps
controls:
  - {id: step, label: "step", min: 0, max: 15, step: 1, default: 0, decimals: 0}
note: "The worked example, one entry at a time: steps 1–9 fill U and L column by column, 10–12 are forward elimination for y, and 13–15 back substitution for x. The highlighted cell is the one computed at that step, and the title shows the one-unknown equation that gives it. Every equation uses only entries already filled in."
```

### Accuracy: direct solve versus the inverse

Hilbert matrices are close to singular, which magnifies rounding error. With a known solution of
all ones, compare the two ways of solving:

```r
H8 <- 1 / (outer(1:8, 1:8, "+") - 1)
x.true <- rep(1, 8)
b8 <- H8 %*% x.true
x1 <- solve(H8, b8)                  # solve the system directly
x2 <- solve(H8) %*% b8               # invert, then multiply
c(direct = max(abs(x1 - x.true)), via.inverse = max(abs(x2 - x.true)))
##       direct  via.inverse 
## 4.386696e-07 5.718321e-06 
```

Both lose digits on this difficult matrix, but going through the inverse loses about ten times
more.

:::example[A polynomial through given points]
The cubic $c_0 + c_1 x + c_2 x^2 + c_3 x^3$ through $(1, 3)$, $(2, 1)$, $(3, 4)$, $(4, 2)$ has
coefficients solving $V\mathbf c = \mathbf y$, where row $i$ of $V$ is $(1, x_i, x_i^2, x_i^3)$ (a
*Vandermonde matrix*).
:::

```r
xs <- c(1, 2, 3, 4)
ys <- c(3, 1, 4, 2)
V <- outer(xs, 0:3, "^")             # row i is (1, x_i, x_i^2, x_i^3)
V
##      [,1] [,2] [,3] [,4]
## [1,]    1    1    1    1
## [2,]    1    2    4    8
## [3,]    1    3    9   27
## [4,]    1    4   16   64
coefs <- solve(V, ys)
coefs
## [1]  20.000000 -27.833333  12.500000  -1.666667
V %*% coefs                          # the cubic passes through all four points
##      [,1]
## [1,]    3
## [2,]    1
## [3,]    4
## [4,]    2
```

:::insight
A matrix is a vector folded by its `dim` attribute. Arithmetic operators work entry by entry;
`%*%` and `crossprod()` do the matrix product. To solve $A\mathbf x = \mathbf b$, use `solve(A, b)`,
which factors $A = LU$ and solves two triangular systems; forming $A^{-1}$ is slower and less
accurate.
:::

## Further reading

- [R documentation: matrix](https://stat.ethz.ch/R-manual/R-devel/library/base/html/matrix.html) — constructing matrices, `byrow`, `dimnames`.
- [R documentation: solve](https://stat.ethz.ch/R-manual/R-devel/library/base/html/solve.html) — inverses and linear systems via LAPACK.
- [R documentation: crossprod](https://stat.ethz.ch/R-manual/R-devel/library/base/html/crossprod.html) — $X^{\mathsf T}Y$ and $XY^{\mathsf T}$ without explicit transposes.
- [LU decomposition (Wikipedia)](https://en.wikipedia.org/wiki/LU_decomposition) — existence, pivoting, and the Doolittle algorithm.
- [LAPACK Users' Guide](https://www.netlib.org/lapack/lug/) — the library behind R's linear algebra.
