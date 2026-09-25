---
title: Vectors
order: 2
status: detailed
weeks: [1]
requires:
  - {concept: r-programming, strength: hard}
reinforces:
  - {concept: array, perspective: "R vectors"}
introduces: [vectorized-operations, factor, boolean-indexing]
---

Numeric, character and logical vectors, factors, vector arithmetic and recycling, and
basic subsetting.

## Numeric Vectors

### Creating vectors

A **numeric vector** is an *ordered* list of numbers: $(1,2,3)$ is not the same as $(2,1,3)$. The **combine** function `c` assembles a vector from its components:

```r
c(1,2,3)
## [1] 1 2 3
x.Vec <- c(1,2,3)
x.Vec
## [1] 1 2 3
```

A sequence “from a to b” is `a:b`. Two or more vectors are concatenated with `c` as well:

```r
x <- 1:10
y <- c(12,11)
z <- c(x,y)
z
##  [1]  1  2  3  4  5  6  7  8  9 10 12 11
c(z, 25:50)
##  [1]  1  2  3  4  5  6  7  8  9 10 12 11 25 26 27 28 29 30 31 32 33 34 35 36 37
## [26] 38 39 40 41 42 43 44 45 46 47 48 49 50
```

### Extracting elements

If `x` is a vector, `x[i]` extracts its $i$-th component:

```r
z[11]
## [1] 12
z[1:3]
## [1] 1 2 3
z[-1]              # everything except the 1st
##  [1]  2  3  4  5  6  7  8  9 10 12 11
z[1,3,5]
## Error in z[1, 3, 5]: incorrect number of dimensions
z[c(1,3,5)]        # this is how to pick several elements
## [1] 1 3 5
z[-c(1,2)]         # remove several at once
## [1]  3  4  5  6  7  8  9 10 12 11
z[c(-1,2)]
## Error: only 0's may be mixed with negative subscripts
z[0.5]
## numeric(0)
```

Negative and positive subscripts cannot be mixed. `numeric(0)` is a numeric vector of length 0 — an *empty vector*.

### Vector arithmetic and recycling

Arithmetic on vectors is done **component-wise**:

```r
x <- 1:10
y <- 11:20
x + y
##  [1] 12 14 16 18 20 22 24 26 28 30
x * y
##  [1]  11  24  39  56  75  96 119 144 171 200
x * 4
##  [1]  4  8 12 16 20 24 28 32 36 40
x^4
##  [1]     1    16    81   256   625  1296  2401  4096  6561 10000
```

When the vectors have different lengths, the shorter one is extended by **recycling**:

```r
z <- c(2,4)
x^z              # exponents 2,4,2,4,...
##  [1]     1    16     9   256    25  1296    49  4096    81 10000
```

R warns if the longer length is not a multiple of the shorter one, because that is often a symptom of a bug:

```r
x <- 1:4
y <- c(1,2,3)
x^y
## Warning in x^y: longer object length is not a multiple of shorter object length
## [1]  1  4 27  4
```

### Simple patterns: seq and rep

```r
seq(1, 21, by = 2)              # odd numbers up to 21
##  [1]  1  3  5  7  9 11 13 15 17 19 21
rep(1:3, 3)
## [1] 1 2 3 1 2 3 1 2 3
rep(3, 4)
## [1] 3 3 3 3
rep(seq(10, 2, by = -3.5), 2)
## [1] 10.0  6.5  3.0 10.0  6.5  3.0
rep(3:1, each = 3)              # repeats each element 3 times
## [1] 3 3 3 2 2 2 1 1 1
rep(3:1, length.out = 10)       # repeat until total length is 10
##  [1] 3 2 1 3 2 1 3 2 1 3
seq(0, 1, length.out = 11)      # 11 equispaced numbers from 0 to 1
##  [1] 0.0 0.1 0.2 0.3 0.4 0.5 0.6 0.7 0.8 0.9 1.0
```

If `by` is omitted it is 1; `by` can be negative or non-integer. (Exercise from the slides: which commands produce `3 2 1 3 2 1 3 2 1 3 2 1` and `3 6 9 … 30`? — `rep(3:1, 4)` and `seq(3, 30, by = 3)`.)

### Random patterns: sample

```r
sample(1:6, size = 15, replace = TRUE)     # 15 tosses of a die
##  [1] 4 6 1 3 5 5 2 5 5 4 3 1 3 4 6
sample(0:1, size = 15, replace = TRUE)     # a coin (heads = 0, tails = 1)
##  [1] 0 1 0 1 1 0 0 1 0 0 0 1 0 1 0
```

> **Key insight.** Everything in R is vectorised: x + y, x^y, cos(x) act element by element, and a shorter operand is recycled. Index with [ ] using positive positions, negative exclusions or ranges — but never a mix of positive and negative.

> **Caution.** z[1,3,5] is an error (that syntax is for matrices); use z[c(1,3,5)]. And a recycling *warning* is only issued when the lengths are not multiples — x^c(2,4) on a length-10 x recycles silently, which may or may not be what you meant.

**Equations**

- *Component-wise arithmetic*: $(x_1,\dots,x_n) \circ (y_1,\dots,y_n) = (x_1 \circ y_1,\ \dots,\ x_n \circ y_n)\quad \circ \in \{+,-,*,/,\hat{}\}$ — Applies to every operator and to functions like cos, sqrt, log.
- *Recycling*: $x^{z},\quad z = (2,4) \;\Rightarrow\; (x_1^2,\ x_2^4,\ x_3^2,\ x_4^4,\ \dots)$ — The shorter vector is repeated to match the longer one.

```sim
id: r-recycling
controls:
  - {id: nx, label: 'length(x)  where x = 1:nx', min: 1, max: 12, step: 1, default: 10, decimals: 0}
  - {id: nz, label: 'length(z)  where z = 1:nz', min: 1, max: 6, step: 1, default: 2, decimals: 0}
note: Shows how x + z pairs each element of x with an element of the shorter z, recycling z as needed. When length(x) is not a multiple of length(z), R issues the "longer object length is not a multiple" warning (shown in the title).
...
```

All the vector examples from Lectures 2–3. set.seed() is not in the slides but makes the sample() output reproducible so you can compare runs.

```r
# Creating and combining
x.Vec <- c(1, 2, 3)
x <- 1:10
y <- c(12, 11)
z <- c(x, y)
z
##  [1]  1  2  3  4  5  6  7  8  9 10 12 11

# Extracting elements
z[11]; z[1:3]; z[-1]; z[c(1, 3, 5)]; z[-c(1, 2)]
length(z)
## [1] 12

# Component-wise arithmetic and recycling
x + 11:20
x * 4
x^c(2, 4)                     # exponents recycled: 2,4,2,4,...
##  [1]     1    16     9   256    25  1296    49  4096    81 10000
(1:4)^c(1, 2, 3)              # lengths 4 and 3 -> warning
## Warning: longer object length is not a multiple of shorter object length
## [1]  1  4 27  4

# Patterns
seq(1, 21, by = 2)
rep(1:3, 3)
rep(3:1, each = 3)
rep(3:1, length.out = 10)
seq(0, 1, length.out = 11)
rep(3:1, 4)                   # 3 2 1 3 2 1 3 2 1 3 2 1
seq(3, 30, by = 3)            # 3 6 9 ... 30

# Random vectors
set.seed(280)                                  # makes the "random" draws reproducible
sample(1:6, size = 15, replace = TRUE)         # 15 die tosses
sample(0:1, size = 15, replace = TRUE)         # 15 coin tosses (0 = heads, 1 = tails)
```

## Character Vectors & Factors

### Character vectors

Vectors whose components are character strings are **character vectors**; they are manipulated just like numeric vectors:

```r
movies <- c("The Matrix", "Men in Black")
songs  <- c("Imagine", "O Canada", "Stairway to Heaven")
numbers <- c(1, 10)
movies.and.songs <- c(movies, songs)
movies.and.songs
## [1] "The Matrix"         "Men in Black"       "Imagine"
## [4] "O Canada"           "Stairway to Heaven"
```

They can be *mixed* with numbers — but then everything becomes a string:

```r
songs.and.numbers <- c(songs, numbers)
songs.and.numbers[4]
## [1] "1"
```

### Empty vectors and conversion

```r
v <- numeric(0)      # empty numeric vector
w <- character(0)    # empty character vector
c(v, w)
## character(0)
as.character(numbers)
## [1] "1"  "10"
as.numeric(movies)
## Warning: NAs introduced by coercion
## [1] NA NA
```

Numeric vectors can be converted into character vectors, but not vice versa (unless the strings look like numbers). Try `numeric(n)` and `character(n)` with $n \ne 0$: you get $n$ zeros / $n$ empty strings.

### substr and paste

`substr(x, start, stop)` extracts substrings; `paste` combines character vectors element by element (adding a space by default):

```r
substr(songs, 1, 4)
## [1] "Imag" "O Ca" "Stai"
paste(movies, c("II"))
## [1] "The Matrix II"   "Men in Black II"
paste(c("I like", "I love"), movies)
## [1] "I like The Matrix"   "I love Men in Black"
pets <- c("cat", "dog")
paste(pets, "s", sep = "")                          # sep: separator, here none
## [1] "cats" "dogs"
paste(c("I have a", "but not a"), pets, collapse = ", ")   # collapse: join into ONE string
## [1] "I have a cat, but not a dog"
```

Check out `paste0` as well (`paste` with `sep = ""`).

### Factors

Factors store character vectors by organising them into **levels** — efficient for datasets with repeated entries, because each string is encoded as an integer:

```r
class.grades <- c("A", "A+", "B", "A", "B", "B")
class.grades <- factor(class.grades)
class.grades
## [1] A  A+ B  A  B  B
## Levels: A A+ B
as.numeric(class.grades)      # the integer codes (same as as.integer)
## [1] 1 2 3 1 3 3
levels(class.grades)
## [1] "A"  "A+" "B"
```

Changing the levels relabels the data — e.g. promote all A's to A+'s:

```r
levels(class.grades)[1] <- "A+"
levels(class.grades)
## [1] "A+" "B"
class.grades
## [1] A+ A+ B  A+ B  B
## Levels: A+ B
as.integer(class.grades)
## [1] 1 1 2 1 2 2
```

A factor may contain levels that do not occur in the data; control them with the `levels` argument. The levels vector can also be indexed by the codes to build a new character vector:

```r
new.grades <- factor(c("A", "B", "A", "C"), levels = c("A", "B", "C", "D", "F"))
new.grades
## [1] A B A C
## Levels: A B C D F
as.numeric(new.grades)
## [1] 1 2 1 3
levels(new.grades)[c(1,2,5,2)]
## [1] "A" "B" "F" "B"
```

> **Key insight.** A vector holds one type: mix strings and numbers and the numbers become strings. A factor is a character vector stored as integer codes plus a levels vector — change the levels and every observation is relabelled at once.

> **Caution.** as.numeric(factor) returns the level codes (1, 2, 3, …), not the original strings converted to numbers. To recover the labels use as.character(f) or levels(f)[f].

```r
movies  <- c("The Matrix", "Men in Black")
songs   <- c("Imagine", "O Canada", "Stairway to Heaven")
numbers <- c(1, 10)

c(movies, songs)                     # character vectors combine like numeric ones
c(songs, numbers)[4]                 # numbers are coerced to strings
## [1] "1"
as.character(numbers)
## [1] "1"  "10"
as.numeric(movies)                   # cannot go the other way
## Warning: NAs introduced by coercion
## [1] NA NA
numeric(3); character(2)             # non-empty "empty" vectors
## [1] 0 0 0
## [1] "" ""

# substr and paste
substr(songs, 1, 4)
## [1] "Imag" "O Ca" "Stai"
paste(movies, "II")
paste(c("I like", "I love"), movies)
pets <- c("cat", "dog")
paste(pets, "s", sep = "")
## [1] "cats" "dogs"
paste0(pets, "s")                    # same thing
paste(c("I have a", "but not a"), pets, collapse = ", ")
## [1] "I have a cat, but not a dog"

# Factors
class.grades <- factor(c("A", "A+", "B", "A", "B", "B"))
class.grades
## [1] A  A+ B  A  B  B
## Levels: A A+ B
as.integer(class.grades)
## [1] 1 2 3 1 3 3
levels(class.grades)[1] <- "A+"      # promote every A to A+
class.grades
## [1] A+ A+ B  A+ B  B
## Levels: A+ B
table(class.grades)                  # counts per level
## class.grades
## A+  B
##  3  3

new.grades <- factor(c("A", "B", "A", "C"), levels = c("A", "B", "C", "D", "F"))
as.numeric(new.grades)
## [1] 1 2 1 3
levels(new.grades)[c(1, 2, 5, 2)]
## [1] "A" "B" "F" "B"
```

The character-vector and factor examples from Lecture 3. table() is not on the slides but is the most common thing to do with a factor.

## Logical Vectors & Subsetting

### Logical values

Commands like `is.integer()` return logical values `TRUE` or `FALSE`; vectors of such values are **logical vectors**.

```r
class(pi)
## [1] "numeric"
is.integer(pi)
## [1] FALSE
class(is.integer(pi))
## [1] "logical"
```

### Relational operators

Logical vectors are usually created with `==` (equal), `!=` (not equal) and the inequalities `>=`, `>`, `<=`, `<`. They work component-wise:

```r
Numbers <- 1:5
Numbers == 4
## [1] FALSE FALSE FALSE  TRUE FALSE
Numbers != 4
## [1]  TRUE  TRUE  TRUE FALSE  TRUE
Numbers >= 4
## [1] FALSE FALSE FALSE  TRUE  TRUE
char.vector <- c("a", "A", "b")
char.vector == "a"               # case-sensitive search
## [1]  TRUE FALSE FALSE
tolower(char.vector) == "a"      # case-insensitive search
## [1]  TRUE  TRUE FALSE
```

### Boolean algebra

Complex conditions are built with `!` (not), `&` (and), `|` (or), defined by the **truth table**:

| A | B | !A | !B | A & B | A \| B |
|---|---|---|---|---|---|
| TRUE | TRUE | FALSE | FALSE | TRUE | TRUE |
| TRUE | FALSE | FALSE | TRUE | FALSE | TRUE |
| FALSE | TRUE | TRUE | FALSE | FALSE | TRUE |
| FALSE | FALSE | TRUE | TRUE | FALSE | FALSE |

### Extracting subvectors

Logical vectors are extremely useful for extracting subvectors: `x[cond]` keeps the elements where `cond` is `TRUE`.

```r
dice.tossings <- sample(1:6, size = 8, replace = TRUE)   # simulate 8 tosses
dice.tossings
## [1] 5 2 2 5 3 5 1 4
at.least.3 <- dice.tossings >= 3
at.least.3
## [1]  TRUE FALSE FALSE  TRUE  TRUE  TRUE FALSE  TRUE
dice.tossings[at.least.3]
## [1] 5 5 3 5 4
between.2.and.4 <- dice.tossings >= 2 & dice.tossings <= 4
dice.tossings[between.2.and.4]
## [1] 2 2 3 4
```

To find *for which indices* a condition holds, use `which()`:

```r
not.5.nor.6 <- !(dice.tossings == 5 | dice.tossings == 6)
which(not.5.nor.6)
## [1] 2 3 5 7 8
```

> **Key insight.** A comparison on a vector gives a logical vector of the same length; putting that logical vector inside [ ] filters the original. Combine conditions with & and |, negate with !, and use which() when you need positions instead of values.

> **Caution.** & and | are vectorised (element-wise). The double forms && and || work on a single TRUE/FALSE only and are meant for if-conditions — do not use them to filter vectors.

```sim
id: r-logical-filter
controls:
  - {id: n, label: Number of die tosses, min: 4, max: 30, step: 1, default: 8, decimals: 0}
  - {id: lo, label: "Keep tosses \u2265", min: 1, max: 6, step: 1, default: 2, decimals: 0}
  - {id: hi, label: "\u2026 and \u2264", min: 1, max: 6, step: 1, default: 4, decimals: 0}
note: dice.tossings <- sample(1:6, n, replace = TRUE), then the logical vector cond <- dice.tossings >= lo & dice.tossings <= hi. Green bars are the elements kept by dice.tossings[cond]; the title lists which(cond). Press Update to re-sample. If you set the lower bound above the upper one, cond is FALSE everywhere and the result is numeric(0) — just as R would return.
...
```

Relational operators, the truth table built with cbind(), and logical subsetting with which(). The last two lines show the very common trick of summing a logical vector to count TRUEs.

```r
class(pi); is.integer(pi); class(is.integer(pi))
## [1] "numeric"
## [1] FALSE
## [1] "logical"

Numbers <- 1:5
Numbers == 4
Numbers != 4
Numbers >= 4
char.vector <- c("a", "A", "b")
char.vector == "a"                     # case sensitive
tolower(char.vector) == "a"            # case insensitive

# Truth table, generated in R
A <- c(TRUE, TRUE, FALSE, FALSE)
B <- c(TRUE, FALSE, TRUE, FALSE)
cbind(A, B, notA = !A, notB = !B, AandB = A & B, AorB = A | B)
##          A     B  notA  notB AandB  AorB
## [1,]  TRUE  TRUE FALSE FALSE  TRUE  TRUE
## [2,]  TRUE FALSE FALSE  TRUE FALSE  TRUE
## [3,] FALSE  TRUE  TRUE FALSE FALSE  TRUE
## [4,] FALSE FALSE  TRUE  TRUE FALSE FALSE

# Subsetting with logical vectors
set.seed(4)
dice.tossings <- sample(1:6, size = 8, replace = TRUE)
dice.tossings
at.least.3 <- dice.tossings >= 3
dice.tossings[at.least.3]
dice.tossings[dice.tossings >= 2 & dice.tossings <= 4]
which(!(dice.tossings == 5 | dice.tossings == 6))

# Logical vectors also count: TRUE is 1, FALSE is 0
sum(dice.tossings >= 3)                # how many tosses were at least 3
mean(dice.tossings >= 3)               # proportion of tosses at least 3
```

## Further reading

- [R documentation — seq](https://stat.ethz.ch/R-manual/R-devel/library/base/html/seq.html) — All the ways to build sequences (by, length.out, along.with).
- [R documentation — sample](https://stat.ethz.ch/R-manual/R-devel/library/base/html/sample.html) — Random sampling with and without replacement.
- [R documentation — paste](https://stat.ethz.ch/R-manual/R-devel/library/base/html/paste.html) — sep vs collapse, and paste0.
- [R documentation — factor](https://stat.ethz.ch/R-manual/R-devel/library/base/html/factor.html) — levels, labels and ordered factors.
