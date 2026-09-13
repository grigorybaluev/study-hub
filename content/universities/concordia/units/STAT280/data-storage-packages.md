---
title: Data storage, special values and packages
order: 3
status: detailed
notes: ["Lecture 3 · slides 10–12 · Lecture 4 · slide 4", "Lecture 4 · slides 2–3", "Lecture 4 · slides 12–15", "Lecture 4 · slides 16–18"]
weeks: [2]
textbook: "Braun & Murdoch, A First Course in Statistical Programming with R, 3e, 2"
introduces: [missing-data]
requires:
  - {concept: r-programming, strength: hard}
reinforces:
  - {concept: floating-point, perspective: "round-off error seen from R"}
  - {concept: matrix, perspective: "matrices and arrays as R data structures"}
---

How R stores numbers (floating point and round-off), missing and special values, dates,
and using packages, libraries and repositories.

## Matrices

### Creating and indexing a matrix

A matrix is a 2-D array. `matrix()` fills it **column by column** by default:

```r
A <- matrix(1:8, nrow = 2, ncol = 4); A
##      [,1] [,2] [,3] [,4]
## [1,]    1    3    5    7
## [2,]    2    4    6    8
A[1,2]      # entry in position (1,2)
## [1] 3
A[3]        # 3rd entry, counting down the columns from left to right
## [1] 3
A[1, ]      # 1st row
## [1] 1 3 5 7
A[ ,3]      # 3rd column
## [1] 5 6
```

So there are two ways to address an entry: the pair `[row, col]`, or a single index `[k]` that runs down the first column, then the second, and so on (*column-major* order).

### Matrix operations

```r
B <- matrix(1:4, nrow = 2, ncol = 2)
B
##      [,1] [,2]
## [1,]    1    3
## [2,]    2    4
t(B)          # transpose
##      [,1] [,2]
## [1,]    1    2
## [2,]    3    4
B + B         # matrix sum
##      [,1] [,2]
## [1,]    2    6
## [2,]    4    8
B %*% A       # matrix multiplication BA  (2x2 times 2x4)
##      [,1] [,2] [,3] [,4]
## [1,]    7   15   23   31
## [2,]   10   22   34   46
B * B         # ENTRY-wise multiplication
##      [,1] [,2]
## [1,]    1    9
## [2,]    4   16
B^2           # ENTRY-wise power (same as B * B, NOT B %*% B)
##      [,1] [,2]
## [1,]    1    9
## [2,]    4   16
```

### rbind and cbind

Another convenient way to create matrices is by stacking vectors by rows (top to bottom) or by columns (left to right); the rows or columns then carry the vectors' names:

```r
v1 <- c(1,2,3)
v2 <- c(5,6,7)
rbind(v1, v2)
##    [,1] [,2] [,3]
## v1    1    2    3
## v2    5    6    7
cbind(v1, v2)
##      v1 v2
## [1,]  1  5
## [2,]  2  6
## [3,]  3  7
```

> **Key insight.** matrix() fills column by column and a single index A[k] walks down the columns. * and ^ are entry-wise; the linear-algebra product is %*%. rbind/cbind stack vectors into a matrix and keep their names as dimnames.

> **Caution.** B^2 is NOT the matrix square. B^2 squares each entry; B %*% B is the matrix product. The same goes for B * B versus B %*% B.

**Equations**

- *Matrix product (B is 2×2, A is 2×4)*: $(BA)_{ij} = \sum_{k=1}^{2} B_{ik} A_{kj},\qquad \texttt{B \%*\% A}$ — Inner dimensions must agree: ncol(B) = nrow(A).
- *Entry-wise operations*: $(B * B)_{ij} = B_{ij}^2 = (B\hat{}2)_{ij}$ — Every arithmetic operator acts element by element, like on vectors.
- *Column-major single index*: $A[k] = A[\,(k-1) \bmod n_{\text{row}} + 1,\ \lfloor (k-1)/n_{\text{row}} \rfloor + 1\,]$ — k = 3 in a 2-row matrix is row 1, column 2 — hence A[3] = 3.

```sim
id: r-matrix-index
controls:
  - {id: nrow, label: nrow, min: 1, max: 5, step: 1, default: 2, decimals: 0}
  - {id: ncol, label: ncol, min: 1, max: 6, step: 1, default: 4, decimals: 0}
  - {id: k, label: 'Single index k in A[k]', min: 1, max: 30, step: 1, default: 3, decimals: 0}
note: 'A <- matrix(1:(nrow*ncol), nrow, ncol) is filled column by column, so A[k] walks down each column in turn. The highlighted cell is A[k]; the title gives the equivalent A[i, j]. Defaults reproduce the slide: A[3] = 3 = A[1, 2]. An index beyond nrow·ncol returns NA, exactly as in R.'
```

```r
A <- matrix(1:8, nrow = 2, ncol = 4); A
##      [,1] [,2] [,3] [,4]
## [1,]    1    3    5    7
## [2,]    2    4    6    8
A[1, 2]; A[3]; A[1, ]; A[, 3]
dim(A); nrow(A); ncol(A)
## [1] 2 4
## [1] 2
## [1] 4
matrix(1:8, nrow = 2, byrow = TRUE)     # fill by rows instead
##      [,1] [,2] [,3] [,4]
## [1,]    1    2    3    4
## [2,]    5    6    7    8

B <- matrix(1:4, nrow = 2, ncol = 2)
t(B)                                    # transpose
B + B                                   # matrix sum
B %*% A                                 # matrix product BA (2x4)
##      [,1] [,2] [,3] [,4]
## [1,]    7   15   23   31
## [2,]   10   22   34   46
B * B                                   # entry-wise product
B^2                                     # entry-wise power
B %*% B                                 # the actual matrix square
##      [,1] [,2]
## [1,]    7   15
## [2,]   10   22

v1 <- c(1, 2, 3); v2 <- c(5, 6, 7)
rbind(v1, v2)
cbind(v1, v2)
```

Lecture 3's matrix examples plus dim()/byrow = TRUE and the true matrix square B %*% B, to contrast with the entry-wise B^2 on the slide.

## Arrays

### Arrays

Beyond vectors (1-D) and matrices (2-D), R has **arrays** — “multi-dimensional tables” (numeric ones are also called *tensors*). The `dim` argument specifies the dimensions:

```r
Letters.array <- array(letters, dim = c(2,2,2))   # a 2 x 2 x 2 "cubic" array
Letters.array
## , , 1
##
##      [,1] [,2]
## [1,] "a"  "c"
## [2,] "b"  "d"
##
## , , 2
##
##      [,1] [,2]
## [1,] "e"  "g"
## [2,] "f"  "h"
```

Like `matrix()`, `array()` fills the first dimension fastest: `a, b` go down column 1 of slice 1, `c, d` down column 2, then the second slice.

### Extracting elements

Elements are extracted like in vectors or matrices — one index per dimension, and an empty index keeps everything along that dimension:

```r
Letters.array[2,2,1]     # 0-D section (a single entry)
## [1] "d"
Letters.array[2,2, ]     # 1-D section (a vector)
## [1] "d" "h"
Letters.array[2, , ]     # 2-D section (a matrix)
##      [,1] [,2]
## [1,] "b"  "f"
## [2,] "d"  "h"
Letters.array[8]         # the array indexed as a vector
## [1] "h"
```

> **Key insight.** An array is a vector plus a dim attribute. Give one index per dimension (blank = all) to take entries, vectors or matrices out of it; a single index treats it as the underlying vector, first dimension varying fastest.

```r
Letters.array <- array(letters, dim = c(2, 2, 2))
Letters.array
dim(Letters.array)
## [1] 2 2 2

Letters.array[2, 2, 1]        # entry            -> "d"
Letters.array[2, 2, ]         # vector           -> "d" "h"
Letters.array[2, , ]          # matrix (2 x 2)
Letters.array[8]              # as a vector      -> "h"
Letters.array[, , 2]          # the whole second slice
##      [,1] [,2]
## [1,] "e"  "g"
## [2,] "f"  "h"

# An array is just a vector with a dim attribute
v <- 1:24
dim(v) <- c(2, 3, 4)          # now a 2 x 3 x 4 numeric array
v[2, 3, 4]
## [1] 24
```

The letters array from the slides, every kind of section, and the dim<- trick that shows an array is a vector wearing a dim attribute.

## Floating Point & Round-off Error

### Round-off error

Computations in R are done in **finite-precision arithmetic** using a binary representation; numbers stored in memory are *floating-point numbers*. This introduces round-off errors:

```r
n <- 1:3
sin(pi*n)
## [1]  1.224647e-16 -2.449294e-16  3.673940e-16
```

Mathematically all three are 0. The accumulation of such errors can cause real problems: computational errors due to round-off led to real-world accidents, including the wrong pricing of stock-market indices and erroneous computation of missile trajectories (see the MathWorld link below).

### Equivalent formulas, different results (Example 2.2)

The standard formula for the **sample variance** of $x_1, \dots, x_n$ is
 $$s^2 = \frac{1}{n-1}\sum_{i=1}^{n}(x_i - \bar x)^2, \qquad \bar x = \frac{1}{n}\sum_{i=1}^{n} x_i .$$

These are computed by `var()` and `mean()`:

```r
x <- runif(10, min = 0, max = 10)    # 10 values between 0 and 10
n <- length(x)
var(x)
## [1] 6.89739
sum( (x - mean(x))^2 ) / (n-1)
## [1] 6.89739
```

An algebraically equivalent formula, the **one-pass formula**, is
 $$s^2 = \frac{1}{n-1}\Big(\sum_{i=1}^{n} x_i^2 - n\,\bar x^2\Big)$$

(show that they are equivalent!):

```r
(sum(x^2) - n*mean(x)^2) / (n-1)
## [1] 6.89739
```

If we add a large constant $A$ to each $x_i$, $s^2$ should not change. However…

```r
A <- 1.e10
x <- x + A
var(x)
## [1] 6.89739
sum( (x - mean(x))^2 ) / (n-1)
## [1] 6.89739
(sum(x^2) - n*mean(x)^2) / (n-1)
## [1] 14563.56
```

The one-pass formula subtracts two huge, nearly equal numbers ($\sum x_i^2 \approx n\bar x^2 \approx 10^{21}$) and the difference is dominated by round-off noise. The two-pass formula subtracts the mean *first*, so it only ever handles numbers of size ~10.

> **Note — Take-home message:.** be careful about *what* you compute. Round-off errors might lead to false discoveries!

> **Key insight.** Doubles carry about 16 significant digits. Subtracting two nearly equal large numbers throws most of them away (catastrophic cancellation) — which is exactly what the one-pass variance formula does when the data have a large mean. Prefer formulas that centre first.

> **Caution.** Never test floating-point results with ==; sin(pi) == 0 is FALSE. Use all.equal() or compare with a tolerance: abs(x - y) < 1e-8.

**Equations**

- *Two-pass (standard) variance*: $s^2 = \frac{1}{n-1}\sum_{i=1}^{n}(x_i-\bar x)^2$ — What var() computes; subtracts the mean before squaring.
- *One-pass variance*: $s^2 = \frac{1}{n-1}\Big(\sum_{i=1}^{n} x_i^2 - n\bar x^2\Big)$ — Algebraically identical; numerically fragile when |x̄| is large.
- *Why they agree on paper*: $\begin{gathered} \sum (x_i-\bar x)^2 = \sum x_i^2 - 2\bar x\sum x_i + n\bar x^2 \\[4pt] = \sum x_i^2 - 2n\bar x^2 + n\bar x^2 = \sum x_i^2 - n\bar x^2 \end{gathered}$ — Expand the square and use Σxᵢ = n x̄.

```sim
id: r-roundoff
controls:
  - {id: logA, label: 'Shift A = 10^k, k =', min: 0, max: 16, step: 0.5, default: 10, decimals: 1}
note: A fixed sample of 10 values in [0, 10] is shifted by A = 10^k and both formulas are evaluated in double precision (the same arithmetic R uses). The two-pass formula stays at the true variance; the one-pass formula degrades and eventually returns 0 or nonsense once n·x̄² ≈ 10^(2k) swallows the ~10 units of real information.
...
```

```r
# Round-off: these should all be exactly 0
n <- 1:3
sin(pi * n)
## [1]  1.224647e-16 -2.449294e-16  3.673940e-16
sin(pi) == 0
## [1] FALSE
all.equal(sin(pi), 0)          # the right way to compare floating-point numbers
## [1] TRUE

# Example 2.2: two formulas for the sample variance
set.seed(1)
x <- runif(10, min = 0, max = 10)
n <- length(x)
two.pass <- function(x) sum((x - mean(x))^2) / (length(x) - 1)
one.pass <- function(x) (sum(x^2) - length(x) * mean(x)^2) / (length(x) - 1)

c(var(x), two.pass(x), one.pass(x))      # all agree

A <- 1e10
x <- x + A                               # shift every observation by 10^10
c(var(x), two.pass(x), one.pass(x))      # one.pass is now garbage
## [1]     6.89739     6.89739 14563.56   (values depend on the random sample)

# How the damage grows with the size of the shift
shifts <- 10^(0:12)
sapply(shifts, function(A) one.pass(x - 1e10 + A))
```

The sin(pi*n) demonstration, all.equal() as the safe comparison, and Example 2.2 written as two small functions so the shift experiment is one line. The final sapply shows the one-pass error increasing with the shift A.

## Missing Values, Inf, NaN & Dates

### Missing values and other special values

Sometimes the user asks R to perform operations that are mathematically ill-defined or that produce only partial output:

```r
a.vector <- numeric(0)       # empty vector
some.indices <- c(1,3,6)
a.vector[some.indices] <- 1  # assigning to positions 1, 3, 6 of an empty vector...
a.vector
## [1]  1 NA  1 NA NA  1     # ...fills the gaps with NA (not available)
x <- 0:9
y <- rep(c(0,1), each = 5)
x/y
##  [1] NaN Inf Inf Inf Inf   5   6   7   8   9
```

$0/0$ is `NaN` (*not a number*); $1/0, 2/0, \dots$ are `Inf`.

### Identifying missing values

```r
is.na(a.vector)
## [1] FALSE  TRUE FALSE  TRUE  TRUE FALSE
a.vector[is.na(a.vector)]      # extracts the NA values
## [1] NA NA NA
a.vector[!is.na(a.vector)]     # extracts the non-NA values
## [1] 1 1 1
```

`Inf` and `NaN` are identified with `is.infinite()` and `is.nan()`. Identifying missing values is really important in **data cleaning**.

### Dates and time

Dates and times are among the most difficult types of data to work with on computers. `date()`, `Sys.Date()` and `Sys.time()` give the current date and time (many formats exist; see `?strptime`):

```r
date()
## [1] "Sun Sep 15 22:04:55 2024"
Sys.Date()
## [1] "2024-09-15"
Sys.time()
## [1] "2024-09-15 22:08:29 EDT"
```

> **Key insight.** NA means "missing", NaN means "undefined result", Inf/−Inf mean overflow or division of a non-zero by zero. Test for them with is.na() (which is also TRUE for NaN), is.nan() and is.infinite() — never with == NA.

> **Caution.** x == NA is always NA, never TRUE. Use is.na(x). Also note that most summaries propagate NA: mean(c(1, NA)) is NA unless you pass na.rm = TRUE.

```r
a.vector <- numeric(0)
a.vector[c(1, 3, 6)] <- 1
a.vector
## [1]  1 NA  1 NA NA  1

x <- 0:9
y <- rep(c(0, 1), each = 5)
x / y
##  [1] NaN Inf Inf Inf Inf   5   6   7   8   9

is.na(a.vector)
a.vector[is.na(a.vector)]
a.vector[!is.na(a.vector)]
is.nan(x / y); is.infinite(x / y)
is.na(NaN)                      # TRUE: NaN counts as missing too
## [1] TRUE

# NA propagates through summaries unless removed
mean(a.vector)
## [1] NA
mean(a.vector, na.rm = TRUE)
## [1] 1
sum(is.na(a.vector))            # how many missing values?
## [1] 3

# Dates and times
date()
Sys.Date()
Sys.time()
Sys.Date() + 30                 # dates support arithmetic (30 days later)
format(Sys.Date(), "%d %B %Y")  # see ?strptime for the format codes
```

The NA / NaN / Inf examples from the slides, the na.rm = TRUE idiom for summaries, and a taste of date arithmetic and formatting.

## Further reading

- [R documentation — matrix](https://stat.ethz.ch/R-manual/R-devel/library/base/html/matrix.html) — matrix(), byrow, dimnames.
- [R documentation — matmult (%*%)](https://stat.ethz.ch/R-manual/R-devel/library/base/html/matmult.html) — Matrix multiplication and the crossprod shortcuts.
- [MathWorld — Roundoff Error](https://mathworld.wolfram.com/RoundoffError.html) — The historical examples referenced on the slide (Patriot missile, Vancouver stock index, …).
- [R FAQ 7.31 — Why doesn't R think these numbers are equal?](https://cran.r-project.org/doc/FAQ/R-FAQ.html#Why-doesn_0027t-R-think-these-numbers-are-equal_003f) — The canonical explanation of floating-point comparison in R.
- [R documentation — NA](https://stat.ethz.ch/R-manual/R-devel/library/base/html/NA.html) — NA, is.na and how missing values propagate.
- [R documentation — strptime (date formats)](https://stat.ethz.ch/R-manual/R-devel/library/base/html/strptime.html) — The %Y-%m-%d style format codes mentioned on the slide.
