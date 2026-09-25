---
title: Eigenvalues, eigenvectors and matrix decompositions
order: 12
status: detailed
weeks: [12]
introduces:
  - {concept: eigenvalue, perspective: "computed numerically with eigen()"}
requires:
  - {concept: matrix, strength: hard}
  - {concept: determinant, strength: hard}
  - {concept: linear-system, strength: hard}
reinforces:
  - {concept: matrix-decomposition, perspective: "SVD, Cholesky and QR in R"}
  - {concept: diagonalization, perspective: "a symmetric matrix rebuilt from its eigenvectors"}
  - {concept: matrix-rank, perspective: "low-rank approximation with the SVD"}
---

Computing eigenvalues and eigenvectors and other matrix decompositions in R, and what
they are used for.

## Eigenvalues and eigenvectors

:::definition[Eigenvalue and eigenvector]
A number $\lambda$ and a non-zero vector $\mathbf v$ with $A\mathbf v = \lambda\mathbf v$: the matrix
acts on the direction of $\mathbf v$ as pure scaling by $\lambda$. An $n \times n$ matrix has $n$
eigenvalues, counted with multiplicity, possibly complex.
:::

`eigen(A)` returns a list: `$values`, sorted from largest to smallest, and `$vectors`, whose
column $j$ is an eigenvector for the $j$-th value, scaled to length 1.

```r
S <- matrix(c(4, 1, 1,
              1, 3, 0,
              1, 0, 2), nrow = 3, byrow = TRUE)
e <- eigen(S)
e
## eigen() decomposition
## $values
## [1] 4.879385 2.652704 1.467911
## 
## $vectors
##           [,1]       [,2]       [,3]
## [1,] 0.8440296  0.2931284  0.4490988
## [2,] 0.4490988 -0.8440296 -0.2931284
## [3,] 0.2931284  0.4490988 -0.8440296
## 
v1 <- e$vectors[, 1]
S %*% v1                          # the same as ...
##          [,1]
## [1,] 4.118346
## [2,] 2.191326
## [3,] 1.430286
e$values[1] * v1                  # ... lambda1 times v1
## [1] 4.118346 2.191326 1.430286
```

### What the eigenvalues tell

Two identities are quick checks on any computation: the **sum** of the eigenvalues is the trace,
and their **product** is the determinant. For a **symmetric** matrix more is true: the eigenvalues
are real, and the eigenvectors can be chosen orthonormal, so with $V$ the matrix of eigenvectors
and $\Lambda$ the diagonal matrix of eigenvalues

$$
V^{\mathsf T} V = I \qquad A = V \Lambda V^{\mathsf T}
$$

```r
c(sum(e$values), sum(diag(S)))    # sum of eigenvalues = trace
## [1] 9 9
c(prod(e$values), det(S))         # product of eigenvalues = determinant
## [1] 19 19
V <- e$vectors
round(crossprod(V), 10)           # V^T V = I: orthonormal eigenvectors
##      [,1] [,2] [,3]
## [1,]    1    0    0
## [2,]    0    1    0
## [3,]    0    0    1
V %*% diag(e$values) %*% t(V)     # S rebuilt from its eigen-decomposition
##      [,1]          [,2]          [,3]
## [1,]    4  1.000000e+00  1.000000e+00
## [2,]    1  3.000000e+00 -3.774758e-15
## [3,]    1 -3.774758e-15  2.000000e+00
```

The rebuilt matrix has entries like $-3.8 \times 10^{-15}$ where $S$ has zeros: rounding error,
numerically zero.

A matrix that is not symmetric may have complex eigenvalues. A rotation by 90° leaves no real
direction unchanged, and R reports the eigenvalues $\pm i$:

```r
rot <- matrix(c(0, -1,
                1,  0), nrow = 2, byrow = TRUE)   # rotation by 90 degrees
eigen(rot)$values                 # no real direction is left unchanged
## [1] 0+1i 0-1i
```

:::example[The hat matrix of regression]
In least-squares regression with design matrix $X$ (a column of ones and the predictor), the
fitted values are $H\mathbf y$ with $H = X(X^{\mathsf T}X)^{-1}X^{\mathsf T}$. $H$ is a **projection**
($H^2 = H$), and a projection's eigenvalues can only be 0 or 1, since $H\mathbf v = \lambda\mathbf v$
implies $\lambda^2 \mathbf v = \lambda \mathbf v$. The number of 1s, which is also the trace, is the
number of columns of $X$.
:::

```r
X <- cbind(1, c(1, 2, 4, 5))       # a column of ones and one predictor
H <- X %*% solve(crossprod(X)) %*% t(X)
round(H, 3)
##       [,1] [,2] [,3]  [,4]
## [1,]  0.65 0.45 0.05 -0.15
## [2,]  0.45 0.35 0.15  0.05
## [3,]  0.05 0.15 0.35  0.45
## [4,] -0.15 0.05 0.45  0.65
round(eigen(H)$values, 10)         # only 0s and 1s: H is a projection
## [1] 1 1 0 0
sum(diag(H))                       # trace = number of columns of X
## [1] 2
```

:::note[Stationary distributions again]
The Markov chain unit found a chain's stationary distribution as the eigenvector of $P^{\mathsf T}$
for eigenvalue 1: another use of `eigen()`.
:::

## The singular value decomposition

:::definition[Singular value decomposition]
Any $m \times n$ matrix can be written

$$
A = U D V^{\mathsf T}
$$

where $D$ is diagonal with entries $d_1 \ge d_2 \ge \dots \ge 0$, the **singular values**, and $U$
and $V$ have orthonormal columns ($U^{\mathsf T}U = I$, $V^{\mathsf T}V = I$; for square $U$ and $V$
this means $U^{-1} = U^{\mathsf T}$ and $V^{-1} = V^{\mathsf T}$).
:::

Since $A^{\mathsf T}A = V D U^{\mathsf T} U D V^{\mathsf T} = V D^2 V^{\mathsf T}$, the squared singular
values are the eigenvalues of $A^{\mathsf T}A$, and the columns of $V$ are its eigenvectors.
`svd(A)` returns `$d`, `$u` and `$v`.

```r
s <- svd(X)
s$d                               # singular values
## [1] 7.0133283 0.9017909
s$u                               # 4 x 2, orthonormal columns
##           [,1]        [,2]
## [1,] 0.1744062  0.78713563
## [2,] 0.3122151  0.50251538
## [3,] 0.5878331 -0.06672511
## [4,] 0.7256421 -0.35134535
s$v                               # 2 x 2, orthogonal
##           [,1]       [,2]
## [1,] 0.2566679  0.9664996
## [2,] 0.9664996 -0.2566679
s$u %*% diag(s$d) %*% t(s$v)      # X again
##      [,1] [,2]
## [1,]    1    1
## [2,]    1    2
## [3,]    1    4
## [4,]    1    5
s$d^2
## [1] 49.1867732  0.8132268
eigen(crossprod(X))$values        # squared singular values are eigenvalues of X^T X
## [1] 49.1867732  0.8132268
```

For a square invertible matrix the SVD gives the inverse at once, since inverting a diagonal
matrix only takes reciprocals: $A^{-1} = V D^{-1} U^{\mathsf T}$. The SVD is also a stable way to
solve linear systems.

```r
sv <- svd(S)
Sinv <- sv$v %*% diag(1 / sv$d) %*% t(sv$u)    # inverse from the SVD
round(Sinv %*% S, 10)
##      [,1] [,2] [,3]
## [1,]    1    0    0
## [2,]    0    1    0
## [3,]    0    0    1
```

:::example[Low-rank approximation]
Keeping only the largest $k$ singular values gives the best approximation of $A$ by a matrix of
rank $k$ (in the least-squares sense). Test scores of five students on four tests are nearly "a
student's ability times a test's difficulty", a rank-1 matrix: the first singular value dwarfs
the others, and the rank-1 approximation is off by less than one point everywhere. This idea is
the basis of principal component analysis and of many compression and recommendation methods.
:::

```r
scores <- matrix(c(80, 72, 91, 65,
                   78, 70, 88, 64,
                   42, 37, 47, 33,
                   61, 55, 69, 49,
                   90, 81, 100, 72), nrow = 5, byrow = TRUE)   # 5 students x 4 tests
sd5 <- svd(scores)
round(sd5$d, 2)                   # one singular value dominates
## [1] 311.60   1.39   1.07   0.53
rank1 <- sd5$d[1] * sd5$u[, 1] %*% t(sd5$v[, 1])   # the best rank-1 approximation
round(rank1, 1)
##      [,1] [,2]  [,3] [,4]
## [1,] 80.4 72.2  90.5 64.9
## [2,] 78.3 70.3  88.1 63.2
## [3,] 41.6 37.3  46.7 33.5
## [4,] 61.1 54.9  68.7 49.3
## [5,] 89.5 80.4 100.7 72.3
max(abs(scores - rank1))
## [1] 0.7971585
```

## The Cholesky decomposition

:::definition[Positive definite matrix and Cholesky factor]
A symmetric matrix $A$ is **positive definite** when $\mathbf x^{\mathsf T} A \mathbf x > 0$ for every
$\mathbf x \ne \mathbf 0$, equivalently when all its eigenvalues are positive. Covariance matrices of
non-degenerate random vectors are the main example. Such a matrix has a unique **Cholesky
decomposition** $A = U^{\mathsf T} U$ with $U$ upper triangular with positive diagonal, a kind of
square root of $A$.
:::

`chol(A)` returns $U$; `chol2inv(U)` returns $A^{-1}$ computed from it, more stably than by
general-purpose elimination.

```r
U <- chol(S)                      # upper triangular with U^T U = S
round(U, 4)
##      [,1]   [,2]    [,3]
## [1,]    2 0.5000  0.5000
## [2,]    0 1.6583 -0.1508
## [3,]    0 0.0000  1.3143
crossprod(U)                      # U^T U gives S back
##      [,1] [,2] [,3]
## [1,]    4    1    1
## [2,]    1    3    0
## [3,]    1    0    2
chol2inv(U)                       # the inverse of S, from U
##            [,1]        [,2]        [,3]
## [1,]  0.3157895 -0.10526316 -0.15789474
## [2,] -0.1052632  0.36842105  0.05263158
## [3,] -0.1578947  0.05263158  0.57894737
solve(S)
##            [,1]        [,2]        [,3]
## [1,]  0.3157895 -0.10526316 -0.15789474
## [2,] -0.1052632  0.36842105  0.05263158
## [3,] -0.1578947  0.05263158  0.57894737
```

To solve $A\mathbf x = \mathbf b$ with $A = U^{\mathsf T}U$, solve two triangular systems, as with LU:
first $U^{\mathsf T}\mathbf y = \mathbf b$ (lower triangular: `forwardsolve()`), then $U\mathbf x = \mathbf y$
(upper triangular: `backsolve()`).

```r
b <- c(1, 2, 3)
y <- forwardsolve(t(U), b)        # step 1: U^T y = b
backsolve(U, y)                   # step 2: U x = y
## [1] -0.3684211  0.7894737  1.6842105
solve(S, b)
## [1] -0.3684211  0.7894737  1.6842105
```

For a matrix that is not positive definite the factorisation breaks down, which makes `chol()` a
practical test of positive definiteness:

```r
chol(matrix(c(1, 2,
              2, 1), 2))          # eigenvalues 3 and -1: not positive definite
## Error: the leading minor of order 2 is not positive
```

:::note[Where else Cholesky appears]
The multivariate normal simulation of the random-variables unit used this factor: if the rows of
$Z$ are independent standard normals, the rows of $ZU$ have covariance $U^{\mathsf T}U = \Sigma$.
:::

## The QR decomposition

:::definition[QR decomposition]
Any $m \times n$ matrix $A$ with $m \ge n$ can be written $A = QR$, where $Q$ ($m \times n$) has
orthonormal columns and $R$ ($n \times n$) is upper triangular. It exists for non-square
matrices too.
:::

`qr(A)` returns a compact object (class `"qr"`) holding both factors; `qr.Q()` and `qr.R()`
extract them.

```r
q <- qr(X)
Q <- qr.Q(q)
R <- qr.R(q)
round(Q, 4)
##      [,1]    [,2]
## [1,] -0.5 -0.6325
## [2,] -0.5 -0.3162
## [3,] -0.5  0.3162
## [4,] -0.5  0.6325
round(R, 4)
##      [,1]    [,2]
## [1,]   -2 -6.0000
## [2,]    0  3.1623
Q %*% R                           # X again
##      [,1] [,2]
## [1,]    1    1
## [2,]    1    2
## [3,]    1    4
## [4,]    1    5
round(crossprod(Q), 10)           # orthonormal columns
##      [,1] [,2]
## [1,]    1    0
## [2,]    0    1
```

For a square system, $QR\mathbf x = \mathbf b$ becomes $R\mathbf x = Q^{\mathsf T}\mathbf b$ after
multiplying by $Q^{\mathsf T}$: a triangular system, solved by back substitution. For a tall
matrix the same steps give the **least-squares** solution, the $\boldsymbol\beta$ minimising
$\lVert \mathbf y - X\boldsymbol\beta \rVert^2$. This is how `lm()` fits regressions, without ever
forming $X^{\mathsf T}X$. `qr.solve()` does it in one call.

```r
x <- c(1, 2, 4, 5)
y <- c(2.1, 3.9, 8.2, 9.8)
qr.solve(cbind(1, x), y)          # least-squares line: intercept and slope
##         x 
## 0.09 1.97 
backsolve(R, t(Q) %*% y)          # the same, by hand: R beta = Q^T y
##      [,1]
## [1,] 0.09
## [2,] 1.97
coef(lm(y ~ x))
## (Intercept)           x 
##        0.09        1.97 
```

## Conditioning

:::definition[Condition number]
The ratio $\kappa(A) = d_1 / d_n$ of the largest to the smallest singular value. It measures how
much relative errors in the data can be magnified in the solution of $A\mathbf x = \mathbf b$. Roughly,
$\log_{10} \kappa$ digits of accuracy are lost; with about 16 digits in double precision, a
condition number near $10^{16}$ means no correct digits at all.
:::

`kappa(A)` estimates it quickly; `kappa(A, exact = TRUE)` computes it from the SVD. Hilbert
matrices are the classic bad case: the condition number grows about thirtyfold with each extra
row, so by $n = 8$ some ten digits are gone (which is why the previous unit's $8 \times 8$ Hilbert
system came back with errors near $10^{-7}$ instead of $10^{-16}$).

```r
sapply(2:8, function(n) kappa(1 / (outer(1:n, 1:n, "+") - 1), exact = TRUE))
## [1] 1.928147e+01 5.240568e+02 1.551374e+04 4.766073e+05 1.495106e+07
## [6] 4.753674e+08 1.525758e+10
kappa(S, exact = TRUE)
## [1] 3.324033
```

:::caution[A small determinant is not the warning sign]
Scaling a matrix by 0.1 multiplies an $n \times n$ determinant by $10^{-n}$ but leaves the
condition number unchanged. Judge how trustworthy a solution is by $\kappa$, not by $\det A$.
:::

## Other matrix operations

### Outer products

`outer(x, y, f)` applies `f` to every pair $(x_i, y_j)$ and returns the matrix of results; the
default `f` is multiplication, also written `x %o% y`. Any vectorised function of two arguments
works, including one written on the spot.

```r
outer(1:4, 1:5)                   # a multiplication table
##      [,1] [,2] [,3] [,4] [,5]
## [1,]    1    2    3    4    5
## [2,]    2    4    6    8   10
## [3,]    3    6    9   12   15
## [4,]    4    8   12   16   20
v <- c(2, 7, 3)
outer(v, v, "-")                  # every pairwise difference
##      [,1] [,2] [,3]
## [1,]    0   -5   -1
## [2,]    5    0    4
## [3,]    1   -4    0
outer(1:3, 1:2, function(i, j) 10 * i + j)
##      [,1] [,2]
## [1,]   11   12
## [2,]   21   22
## [3,]   31   32
```

### Kronecker products

`kronecker(A, B)` (or `A %x% B`) replaces each entry $a_{ij}$ of $A$ by the block $a_{ij}B$. It
appears in the covariance matrices of repeated measurements and in some regression designs.

```r
kronecker(diag(2), matrix(1:4, 2))   # a copy of the 2 x 2 matrix per entry of I
##      [,1] [,2] [,3] [,4]
## [1,]    1    3    0    0
## [2,]    2    4    0    0
## [3,]    0    0    1    3
## [4,]    0    0    2    4
```

### apply()

`apply(M, margin, f)` applies a function to each row (`margin = 1`) or each column
(`margin = 2`) of a matrix, without writing the loop. When `f` returns a vector, the results come
back as **columns**, so a row-wise result appears transposed. `rowSums()`, `colSums()`,
`rowMeans()` and `colMeans()` are faster built-ins for the most common cases.

```r
scores
##      [,1] [,2] [,3] [,4]
## [1,]   80   72   91   65
## [2,]   78   70   88   64
## [3,]   42   37   47   33
## [4,]   61   55   69   49
## [5,]   90   81  100   72
apply(scores, 1, mean)            # 1: over rows (per student)
## [1] 77.00 75.00 39.75 58.50 85.75
apply(scores, 2, max)             # 2: over columns (per test)
## [1]  90  81 100  72
apply(scores, 2, function(col) col - mean(col))   # a function of your own
##       [,1] [,2] [,3]  [,4]
## [1,]   9.8    9   12   8.4
## [2,]   7.8    7    9   7.4
## [3,] -28.2  -26  -32 -23.6
## [4,]  -9.2   -8  -10  -7.6
## [5,]  19.8   18   21  15.4
rowMeans(scores)                  # fast built-ins for the common cases
## [1] 77.00 75.00 39.75 58.50 85.75
```

:::insight
Every decomposition turns a hard problem into easy ones: `eigen()` into scalings along
eigenvectors, `svd()` into rotations and a diagonal (and low-rank approximations), `chol()` into
two triangular solves for positive definite matrices, and `qr()` into a triangular solve that
also gives least squares. `kappa()` says how much to trust the answers.
:::

## Further reading

- [R documentation: eigen](https://stat.ethz.ch/R-manual/R-devel/library/base/html/eigen.html) — eigenvalues and eigenvectors, and the `symmetric` argument.
- [R documentation: svd](https://stat.ethz.ch/R-manual/R-devel/library/base/html/svd.html) — the singular value decomposition.
- [R documentation: qr](https://stat.ethz.ch/R-manual/R-devel/library/base/html/qr.html) — QR decomposition, `qr.solve()` and friends.
- [R documentation: kappa](https://stat.ethz.ch/R-manual/R-devel/library/base/html/kappa.html) — estimating the condition number.
- [Singular value decomposition (Wikipedia)](https://en.wikipedia.org/wiki/Singular_value_decomposition) — geometry, properties, and applications such as low-rank approximation.
