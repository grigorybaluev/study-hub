---
title: Logical indexing, data frames, lists and data I/O
order: 4
status: detailed
weeks: [3]
introduces: [data-frame]
requires:
  - {concept: r-programming, strength: hard}
  - {concept: vectorized-operations, strength: hard}
reinforces:
  - {concept: boolean-indexing, perspective: "filtering rows of a data frame"}
  - {concept: file-io, perspective: "reading and writing data files in R"}
  - {concept: propositional-logic, perspective: "Boolean operators on R vectors"}
---

Relational and logical operators for filtering, data frames and lists as containers, and
reading and writing data files.

## Logical operations in R

### Logical values are numbers too

Logical vectors were introduced with filtering (`x[cond]`). Two conversion rules make them much
more useful than a yes/no flag:

- in **arithmetic**, `TRUE` becomes 1 and `FALSE` becomes 0, so `sum()` of a logical vector
  counts the `TRUE`s and `mean()` gives their proportion;
- in a **logical operation**, a number is read as `FALSE` when it is 0 and as `TRUE` otherwise.

`any()` asks whether at least one element is `TRUE`; `all()` asks whether every element is.

```r
passed <- c(TRUE, FALSE, TRUE, TRUE, FALSE)
sum(passed)            # how many TRUE
## [1] 3
mean(passed)           # proportion of TRUE
## [1] 0.6
scores <- c(3, 0, -2, 0, 7)
scores & TRUE          # 0 counts as FALSE, any other number as TRUE
## [1]  TRUE FALSE  TRUE FALSE  TRUE
any(scores < 0)
## [1] TRUE
all(scores >= 0)
## [1] FALSE
```

### The operators, element by element

`!`, `&` and `|` are vectorised: they work element by element and return a vector of the same
length. `xor(a, b)` is the *exclusive or*: true when exactly one of the two is true (the plain `|`
is the *inclusive* or, true also when both are).

```r
x <- c(TRUE, TRUE, FALSE)
y <- c(TRUE, FALSE, FALSE)
x & y                  # element by element
## [1]  TRUE FALSE FALSE
x | y
## [1]  TRUE  TRUE FALSE
xor(x, y)              # exactly one of the two
## [1] FALSE  TRUE FALSE
```

:::note[Boolean algebra and sets]
Read `A` and `B` as sets of cases where a statement holds. Then `A & B` is the intersection
$A \cap B$, `A | B` is the union $A \cup B$, and `!A` is the complement $A^c$. De Morgan's laws
carry over word for word:

$$
!(A\ \&\ B) = \,!A \mid\, !B \qquad !(A \mid B) = \,!A\ \&\ !B
$$
:::

### Short-circuit operators: && and ||

`&&` and `||` look like `&` and `|` but differ in two ways:

1. they take **one** value on each side, not a vector (R 4.3 and later stop with an error if a side
   has length greater than one);
2. they evaluate **left to right and stop as soon as the answer is known**. If the left side of
   `&&` is `FALSE`, the whole expression is `FALSE` and the right side is never run; likewise
   for a `TRUE` on the left of `||`.

This *short-circuit evaluation* is what makes a guard like `length(v) > 0 && v[1] > 2` safe: the
right side is only evaluated when it makes sense. Use `&&` and `||` in `if()` conditions, and `&`
and `|` to build logical vectors for filtering.

```r
v <- numeric(0)
length(v) > 0 && v[1] > 2       # the right side is never evaluated
## [1] FALSE
safe.log <- function(z) if (is.numeric(z) && z > 0) log(z) else NA
safe.log(100)
## [1] 4.60517
safe.log("a")                   # is.numeric("a") is FALSE, so z > 0 is skipped
## [1] NA
c(TRUE, FALSE) && TRUE          # && wants a single value
## Error: 'length = 2' in coercion to 'logical(1)'
```

The truth table of the previous unit can be checked mechanically: build `A` and `B` so that
together they list the four cases, and compare both sides of each law with `identical()`.

```r
A <- c(TRUE, TRUE, FALSE, FALSE)
B <- c(TRUE, FALSE, TRUE, FALSE)
identical(!(A & B), !A | !B)          # De Morgan
## [1] TRUE
identical(!(A | B), !A & !B)
## [1] TRUE
identical(xor(A, B), (A | B) & !(A & B))
## [1] TRUE
```

### Testing equality of computed numbers

Relational operators (`<`, `>`, `<=`, `>=`, `==`, `!=`) compare exactly. Because numbers are
stored in binary with a limited number of digits, two computations that are equal on paper can
differ in the last bit, and `==` then says `FALSE`.

:::caution[Never test computed decimals with ==]
Compare with a tolerance instead: `isTRUE(all.equal(x, y))` (relative tolerance about
$1.5 \times 10^{-8}$), or `abs(x - y) < tol` with a tolerance you choose. `all.equal()` returns a
description of the difference, not `FALSE`, when the values differ, so wrap it in `isTRUE()`
before using it in `if()`.
:::

```r
0.1 + 0.2 == 0.3
## [1] FALSE
all.equal(0.1 + 0.2, 0.3)
## [1] TRUE
isTRUE(all.equal(0.1 + 0.2, 0.3))     # safe inside if()
## [1] TRUE
abs((0.1 + 0.2) - 0.3) < 1e-9
## [1] TRUE
```

:::insight
Logical vectors are the glue of R: comparisons make them, `&`, `|`, `!` combine them, `[ ]`
filters with them, and `sum()`/`mean()` count with them. The double forms `&&` and `||` are for
single conditions and stop early.
:::

## Data frames

### Case-by-variable data

Most data sets have several measurements per observation. Stored as a table with **one row per
observation (case)** and **one column per variable**, this layout is called *case-by-variable*
format, and R's container for it is the **data frame**.

:::definition[Data frame]
A table whose columns are vectors of the same length, each with a name. Different columns may
hold different types (numbers, strings, logical values, factors); within a column the type is
the same.
:::

`data.frame()` builds one from named vectors. `str()` shows the structure (type and first values
of each column), `dim()`, `nrow()` and `ncol()` the size, `names()` the column names, and
`head()` the first rows.

```r
plants <- data.frame(
  species = c("fern", "cactus", "ivy", "fern", "ivy"),
  height  = c(31, 12, 45, 27, 52),
  watered = c(TRUE, FALSE, TRUE, TRUE, FALSE)
)
plants
##   species height watered
## 1    fern     31    TRUE
## 2  cactus     12   FALSE
## 3     ivy     45    TRUE
## 4    fern     27    TRUE
## 5     ivy     52   FALSE
str(plants)
## 'data.frame':	5 obs. of  3 variables:
##  $ species: chr  "fern" "cactus" "ivy" "fern" ...
##  $ height : num  31 12 45 27 52
##  $ watered: logi  TRUE FALSE TRUE TRUE FALSE
dim(plants)
## [1] 5 3
names(plants)
## [1] "species" "height"  "watered"
```

### Extracting rows, columns and cells

A data frame is indexed like a matrix, `df[rows, columns]`, where either index may be a
position, a name, a logical vector, or left empty for "all". A single column is also reached by
name with `$`.

```r
plants$height                 # one column, as a vector
## [1] 31 12 45 27 52
plants[2, ]                   # one row, still a data frame
##   species height watered
## 2  cactus     12   FALSE
plants[4, "height"]           # one cell
## [1] 27
plants[plants$height > 30, ]
##   species height watered
## 1    fern     31    TRUE
## 3     ivy     45    TRUE
## 5     ivy     52   FALSE
plants[plants$species == "fern" & plants$watered, c("species", "height")]
##   species height
## 1    fern     31
## 4    fern     27
subset(plants, height > 30, select = c(species, height))
##   species height
## 1    fern     31
## 3     ivy     45
## 5     ivy     52
```

The last three lines are the same query written three ways. `subset()` is often the most
readable: its condition and column list are evaluated inside the data frame, so the column names
can be written bare.

:::caution
Inside `[ ]` the condition must name the data frame (`plants$height > 30`), because
`height` alone is not an object in the workspace. Only functions such as `subset()` and `with()`
look the names up inside the data frame for you.
:::

### Adding and summarising columns

Assigning to a new name with `$` adds a column; the right-hand side is usually computed from
existing columns, so the whole column is produced in one vectorised step. `with(df, expr)`
evaluates `expr` with the columns visible by name, and `tapply(x, group, f)` applies `f` to `x`
separately for each level of `group`.

```r
plants$height.m <- plants$height / 100     # a new column from an old one
plants$tall <- plants$height > 40
head(plants, 3)
##   species height watered height.m  tall
## 1    fern     31    TRUE     0.31 FALSE
## 2  cactus     12   FALSE     0.12 FALSE
## 3     ivy     45    TRUE     0.45  TRUE
mean(plants$height[plants$species == "ivy"])
## [1] 48.5
with(plants, tapply(height, species, mean))    # mean height per species
## cactus   fern    ivy 
##   12.0   29.0   48.5 
```

:::insight
A data frame is a set of equal-length named columns. Pick rows with a logical condition, columns
with names, and derive new columns with vectorised expressions: no loops needed.
:::

## Lists

### A container for anything

A **list** is an ordered collection whose elements can be objects of any type and length:
numbers, strings, vectors, data frames, functions, even other lists. Elements are usually named.

- `lst$name` or `lst[["name"]]` returns the **element** itself;
- `lst["name"]` returns a **smaller list** containing that element;
- `names(lst)` lists the names, `length(lst)` counts the elements, `str(lst)` summarises them.

```r
trip <- list(city = "Montreal", days = 4, costs = c(120, 85, 60))
trip
## $city
## [1] "Montreal"
## 
## $days
## [1] 4
## 
## $costs
## [1] 120  85  60
## 
trip$costs
## [1] 120  85  60
trip[["days"]]         # the element itself
## [1] 4
trip["days"]           # a list that contains it
## $days
## [1] 4
## 
trip$total <- sum(trip$costs)
names(trip)
## [1] "city"  "days"  "costs" "total"
str(trip)
## List of 4
##  $ city : chr "Montreal"
##  $ days : num 4
##  $ costs: num [1:3] 120 85 60
##  $ total: num 265
```

### Data frames are lists; functions return lists

A data frame is a special list: its elements are the columns, and all of them have the same
length. That is why `$`, `[[ ]]` and `length()` behave on a data frame as they do on a list.

Since an R function returns a single object, a function with several results packs them into a
named list. Most of R's statistical functions do this: the result of `t.test()`, for instance, is
a list whose parts can be extracted by name.

```r
is.list(plants)
## [1] TRUE
length(plants)          # number of columns
## [1] 5
plants[["species"]]
## [1] "fern"   "cactus" "ivy"    "fern"   "ivy"   
spread <- function(x) list(min = min(x), max = max(x), range = diff(range(x)))
s <- spread(plants$height)
s$range
## [1] 40
test <- t.test(plants$height)     # many built-in functions return lists
names(test)
##  [1] "statistic"   "parameter"   "p.value"     "conf.int"    "estimate"   
##  [6] "null.value"  "stderr"      "alternative" "method"      "data.name"  
test$conf.int
## [1] 13.91339 52.88661
## attr(,"conf.level")
## [1] 0.95
```

:::insight
Use `[[ ]]` or `$` to get *what is inside* a list, and `[ ]` to get a *sub-list*. When a function
has to return several things, return a named list.
:::

## Data input and output

### The working directory

File names without a folder are read from and written to the **working directory**. `getwd()`
shows it and `setwd("path")` changes it; RStudio also has *Session > Set Working Directory*. In
paths, use forward slashes (`"C:/data/study"`), even on Windows: a single backslash starts an
escape sequence in an R string, so a Windows-style path would need every backslash doubled.

### Saving objects as R code: dump() and source()

`dump("name", "file.R")` writes the R code that recreates an object into a text file;
`source("file.R")` runs that file later and brings the object back (replacing any object of the
same name). `dump(c("a", "b"), "file.R")` saves several objects, and
`dump(list = ls(), "all.R")` saves everything in the workspace.

```r
setwd(tempdir())                   # a scratch folder for these examples
heights <- c(172, 181, 165)
dump("heights", "heights.R")       # writes R code that recreates the object
readLines("heights.R")
## [1] "heights <-"       "c(172, 181, 165)"
rm(heights)
exists("heights")
## [1] FALSE
source("heights.R")                # runs that code again
heights
## [1] 172 181 165
```

### Sending output to a file: sink()

`sink("file.txt")` redirects everything R would print to the console into a file, until
`sink()` with no argument switches it back.

```r
sink("heights-summary.txt")        # from now on, output goes to the file
summary(heights)
sink()                             # back to the console
readLines("heights-summary.txt")
## [1] "   Min. 1st Qu.  Median    Mean 3rd Qu.    Max. "
## [2] "  165.0   168.5   172.0   172.7   176.5   181.0 "
```

### Binary workspace files: save() and load()

The objects of a session live in the **global environment**, the *workspace*. It can be saved
as a binary **workspace image**:

- `save.image("file.RData")` saves the whole workspace (on quitting, R offers to save it as
  `.RData` in the working directory and reloads it next time it starts there);
- `save(a, b, file = "file.RData")` saves only the named objects;
- `load("file.RData")` restores them, **overwriting** objects with the same names.

```r
w <- 1:3
save(heights, w, file = "two.RData")
rm(heights, w)
load("two.RData")
c(exists("heights"), exists("w"))
## [1] TRUE TRUE
```

:::note[Text or binary?]
`dump()` files are plain R code: readable, and usable by anyone with a text editor. `.RData` files
are compact and keep every attribute exactly, but only R can read them. Neither replaces a script:
keeping the commands that produce your objects is what makes the work reproducible.
:::

### Reading and writing tables

Data frames are exchanged with other programs as text tables.

| Function | Reads / writes | Default separator |
|---|---|---|
| `read.table(file, header = TRUE)` | any delimited text | white space |
| `read.csv(file)` | comma-separated values | `,` (header on by default) |
| `write.csv(df, file, row.names = FALSE)` | a data frame to CSV | `,` |
| `write.table(df, file)` | a data frame to text | space |

`header = TRUE` says that the first line holds the column names. `row.names = FALSE` stops
`write.csv()` from adding a column of row numbers.

```r
write.csv(plants, "plants.csv", row.names = FALSE)
readLines("plants.csv", n = 3)
## [1] "\"species\",\"height\",\"watered\",\"height.m\",\"tall\""
## [2] "\"fern\",31,TRUE,0.31,FALSE"                             
## [3] "\"cactus\",12,FALSE,0.12,FALSE"                          
back <- read.csv("plants.csv")
str(back)
## 'data.frame':	5 obs. of  5 variables:
##  $ species : chr  "fern" "cactus" "ivy" "fern" ...
##  $ height  : int  31 12 45 27 52
##  $ watered : logi  TRUE FALSE TRUE TRUE FALSE
##  $ height.m: num  0.31 0.12 0.45 0.27 0.52
##  $ tall    : logi  FALSE FALSE TRUE FALSE TRUE
```

```r
writeLines(c("x y z", "4 10 2", "7 12 5", "1 8 9"), "xyz.dat")
xyz <- read.table("xyz.dat", header = TRUE)
xyz
##   x  y z
## 1 4 10 2
## 2 7 12 5
## 3 1  8 9
xyz$y
## [1] 10 12  8
xyz[3, 1]
## [1] 1
```

:::insight
Know where R reads and writes (`getwd()`), save *objects* with `dump()`/`save()`, save
*printed output* with `sink()`, and move *tables* in and out with `read.csv()`/`write.csv()` or
`read.table()`.
:::

## Further reading

- [R documentation: Logic](https://stat.ethz.ch/R-manual/R-devel/library/base/html/Logic.html) — `!`, `&`, `|`, `xor`, `&&` and `||`, with the rules for length and evaluation.
- [R documentation: all.equal](https://stat.ethz.ch/R-manual/R-devel/library/base/html/all.equal.html) — comparing numbers up to a tolerance.
- [R documentation: data.frame](https://stat.ethz.ch/R-manual/R-devel/library/base/html/data.frame.html) — creating data frames and how columns are converted.
- [R documentation: read.table](https://stat.ethz.ch/R-manual/R-devel/library/utils/html/read.table.html) — `read.table`, `read.csv` and their many options.
- [R documentation: save](https://stat.ethz.ch/R-manual/R-devel/library/base/html/save.html) — `save`, `save.image` and `load`.
