---
title: Getting started with R
order: 1
status: detailed
notes: ["Lecture 1 · slides 1–13", "Lecture 1 · slides 14–20", "Lecture 2 · slides 3–10, 18", "Lecture 2 · slides 11–17"]
weeks: [1]
textbook: "Braun & Murdoch, A First Course in Statistical Programming with R, 3e, 1-2"
introduces: [r-programming]
requires: []
reinforces:
  - {concept: variables-and-expressions, perspective: "in R"}
  - {concept: function-definition, perspective: "defining and calling R functions"}
---

What statistical programming is, the R and RStudio environment, and using R as a
calculator with objects and the global environment.

## Statistical Programming, R & RStudio

### What this course is about

A first introduction to statistical programming in **R**. Topics covered:

- basic programming concepts: data structures, flow-control statements, functions, …
- data manipulation methods;
- visualisation tools;
- good programming practices;
- more advanced topics: numerical linear algebra, statistical simulation, numerical optimisation.

Being an introductory course, no previous experience with programming nor statistics is required. Statistical programming is a key component of modern data science — machine learning, computer simulation, signal processing, neural networks, AI all rest on it.

> **Definition — Computer programming.** — giving instructions to computers: what calculations to do, what to display, etc.
>  **Statistical programming** — performing computations that aid in statistical analysis: statistical graphics, numerical techniques, data manipulation, summarisation and display of data, simulation techniques.

### A little bit of history

R is open-source software based on the **S** language, developed at Bell Labs in 1976 primarily by John Chambers. In 1993 Robert Gentleman and Ross Ihaka jointly developed R and made it open source in 1995. **S-Plus** is the commercial version of S (marketed by IBM); since R is also based on S, most of what we cover applies to S-Plus too.

### Installation

- **R** (4.4.1) from `https://www.r-project.org/`
- **RStudio Desktop** (free version) from `https://rstudio.com/products/rstudio/download/` (textbook §1.6)

R can be used without RStudio, but R must already be installed in order to use RStudio.

### The console, RStudio and R Markdown

R is based on a **command-line interface**, the *console*, where the user types commands to execute. A menu-based interface (like a browser) is friendly but offers limited possibilities; a command line is *open ended*.

**RStudio** is an Integrated Development Environment (IDE). The console is one of its panels (three in total); the Help panel in the bottom-right corner is very useful — explore the IDE!

**R Markdown** lets you write documents containing chunks of R code and LaTeX formulas (`https://rmarkdown.rstudio.com/`). Recommended but not mandatory; beyond the course it is a great tool for reproducible research.

### Font conventions used in the slides (and on these pages)

Output is indicated with the `##` prefix; user input is given without any prefix:

```r
"Hello World!"
## [1] "Hello World!"
```

The number `[1]` indicates that this is the first (here: the only) element of the output for the given command.

> **Key insight.** R is a command-line language: you type commands into the console and R prints results prefixed (in these notes) by ##. RStudio wraps that console in an IDE with an editor, environment pane and help pane.

```r
# The very first command: R prints the value of an expression.
"Hello World!"
## [1] "Hello World!"

# Everything after # is a comment and is ignored by R.
# Ask for help on any function with ? :
?mean          # opens the help page for mean() in the Help panel
```

The ## lines are R's output, shown as comments so the whole block can be pasted into the console. [1] marks the index of the first element on that output line.

## Using R as a Calculator

### Basic operations

Mathematical expressions are evaluated with the usual operators: addition `+`, subtraction `-`, multiplication `*`, division `/`, exponentiation `^`. Type the expression, hit return, and R evaluates it:

```r
(1+1)*1.2 - 4/5^2
## [1] 2.24
```

### Multiple outputs and the [k] labels

Many commands return several values; each output line is labelled with the index of its first element:

```r
70:10
##  [1] 70 69 68 67 66 65 64 63 62 61 60 59 58 57 56 55 54 53 52 51 50 49 48 47 46
## [26] 45 44 43 42 41 40 39 38 37 36 35 34 33 32 31 30 29 28 27 26 25 24 23 22 21
## [51] 20 19 18 17 16 15 14 13 12 11 10
```

`a:b` produces all the integers from `a` to `b` (here in decreasing order); `[26]` and `[51]` mark the 26th and 51st elements.

### Comments and parentheses

Everything after a `#` is a comment and is ignored by R.

```r
5:(2*3 + 10)   # 5:16 gives the same output
##  [1]  5  6  7  8  9 10 11 12 13 14 15 16
(7:10) + pi    # pi is stored as a constant
## [1] 10.14159 11.14159 12.14159 13.14159
```

Parentheses ensure that `:`, `*` and `+` are carried out in the order we want. Without them:

```r
5:2*3 + 10
## [1] 25 22 19 16
5:2
## [1] 5 4 3 2
```

R first built `5:2`, then multiplied each number by 3 and added 10.

> **Definition — Order of operations.** (computed left to right within a level):
> 1. `( )`
> 2. `^`
> 3. `*` and `/`
> 4. `+` and `-`
> The parentheses in `(7:10) + pi` were not required. We used them anyway: they help others read the code quickly, and it is easy to forget one of R's precedence rules. **Recommendation: use parentheses whenever you are unsure (or even when you think you are right!).**

### Integer division and remainder

```r
31 %% 7      # remainder of 31/7, i.e. 31 (mod 7)
## [1] 3
31 %/% 7     # integer part of 31/7
## [1] 4
```

### Special functions

- exponentials and logarithms: `exp()`, `log()`, `log2()`, `log10()`;
- trigonometric functions: `cos()`, `sin()`, `tan()` and their inverses `acos()`, `asin()`, `atan()`;
- `abs()`, `sqrt()`, `sign()`, …

For a complete list, type `?S4groupGeneric`.

> **Key insight.** The colon operator binds tighter than * and +, but R's precedence rules are easy to misremember — parenthesise anything you are unsure about. %% gives the remainder and %/% the integer quotient.

> **Caution.** 5:2*3 + 10 is (5:2)*3 + 10, not 5:(2*3 + 10). When an expression mixes :, ^, * and +, write the parentheses explicitly.

**Equations**

- *Precedence*: $(\ )\ \succ\ \hat{}\ \succ\ *,\ /\ \succ\ +,\ -$ — Highest to lowest; equal levels are evaluated left to right.
- *Integer division & remainder*: $31 = 4 \cdot 7 + 3 \quad\Rightarrow\quad 31\ \%/\%\ 7 = 4,\qquad 31\ \%\%\ 7 = 3$ — a %/% b is the quotient, a %% b the remainder (a mod b).

```sim
id: r-precedence
controls:
  - {id: a, label: 'a in  a:b*c + d', min: 1, max: 9, step: 1, default: 5, decimals: 0}
  - {id: b, label: b, min: 1, max: 9, step: 1, default: 2, decimals: 0}
  - {id: c, label: c, min: 1, max: 5, step: 1, default: 3, decimals: 0}
  - {id: d, label: d, min: 0, max: 20, step: 1, default: 10, decimals: 0}
note: 'Compares a:b*c + d (as R reads it: (a:b)*c + d) with a:(b*c + d). With the defaults this is the slide example 5:2*3 + 10 = 25 22 19 16 versus 5:16.'
```

```r
# R as a calculator
(1+1)*1.2 - 4/5^2
## [1] 2.24

# Sequences and the [k] labels
70:10                       # decreasing sequence of 61 numbers
5:(2*3 + 10)                # 5:16
## [1]  5  6  7  8  9 10 11 12 13 14 15 16
(7:10) + pi                 # pi is a built-in constant
## [1] 10.14159 11.14159 12.14159 13.14159

# Order of operations: ':' is applied before '*' and '+'
5:2*3 + 10
## [1] 25 22 19 16

# Remainder and integer division
31 %% 7
## [1] 3
31 %/% 7
## [1] 4

# Special functions
exp(1); log(100); log10(100); log2(8)
## [1] 2.718282
## [1] 4.60517
## [1] 2
## [1] 3
sqrt(2); abs(-3.5); sign(-3.5); cos(pi)
## [1] 1.414214
## [1] 3.5
## [1] -1
## [1] -1
```

Every example from the "calculator" slides in one script. Note that several commands can share a line if separated by ; and that log() is the natural logarithm.

## Objects & the Global Environment

### Assignment

Results of computations are stored in the **global environment** with the assignment operator `<-` (a left arrow formed by `<` and `-`):

```r
my_result <- sqrt(2) + cos(pi/8)
```

This performs the operation and assigns the result to an *object* (or variable) named `my_result`, but does not display it. To show it, type the object's name:

```r
my_result
## [1] 2.338093
```

### Choosing names

> **Definition.**  A valid name
> - must consist of letters, digits, `.` and `_`;
> - cannot begin with `_` or a digit;
> - cannot be a reserved word (`TRUE`, `NULL`, `if`, `function`, … — see `?Reserved`).
> Breaking the rules gives an error:

```r
if <- atan(2/3)
## Error: unexpected assignment in "if <-"
_invalid.name <- 23^23
## Error: unexpected input in "_"
```

Moreover, **R is case sensitive**:

```r
a.name <- 1
A.Name
## Error: object 'A.Name' not found
x <- 1:10
sum(x)
## [1] 55
SUM(x)
## Error in SUM(x): could not find function "SUM"
SUM <- sum      # now SUM is a copy of the function sum
SUM(x)
## [1] 55
```

### Example 2.1 — applying a formula

> **Example.**
> An individual takes out a loan today of $P$ at a monthly interest rate $i$, to be paid back in $n$ monthly instalments of size $R$, beginning one month from now. Given $P$, $n$ and $i$,
>  $$R = P\,\frac{i}{1 - (1+i)^{-n}} .$$

```r
i <- 0.01
n <- 10
P <- 1500
R <- P * i / (1 - (1 + i)^(-n))
R
## [1] 158.3731
```

### Listing objects

Check the top-right (Environment) pane of RStudio, or use `objects()` — equivalently `ls()`:

```r
objects()
## [1] "a.name"    "i"         "my_result" "n"         "P"         "R"
```

### Saving your work

When you quit R/RStudio (`q()` or the ✕ button) the objects in the workspace are lost unless you save. Options:

1. save the **workspace** (“Save” button in the Environment pane) — restored automatically next session if you work in the same folder / working directory (`getwd()`, `setwd()`, `?setwd`);
2. save the **command history** (top-right pane);
3. **R scripts** (top-left pane) — *recommended*: `File > New File > R Script`. Commands can be executed line-wise or selection-wise (cursor on the line, or select lines, then “Run”); the script can be saved and reused later.

> **Key insight.** x <- value stores; typing x shows. Names are case sensitive and may not start with a digit or underscore. Keep your work in an R script rather than relying on the saved workspace.

**Equations**

- *Loan instalment (Example 2.1)*: $R = P\,\frac{i}{1-(1+i)^{-n}}$ — P = 1500, i = 0.01, n = 10 gives R = 158.3731.

```sim
id: r-loan
controls:
  - {id: P, label: Loan P, min: 500, max: 20000, step: 100, default: 1500, decimals: 0}
  - {id: i, label: Monthly rate i, min: 0.001, max: 0.03, step: 0.001, default: 0.01, decimals: 3}
  - {id: n, label: Instalments n, min: 1, max: 60, step: 1, default: 10, decimals: 0}
note: 'R = P·i / (1 − (1+i)^(−n)) from Example 2.1, and how the instalment falls as n grows for the chosen P and i. Defaults reproduce the slide: R = 158.37.'
```

```r
# Assignment stores a value without printing it
my_result <- sqrt(2) + cos(pi/8)
my_result
## [1] 2.338093

# Example 2.1: monthly instalment for a loan
i <- 0.01                      # monthly interest rate
n <- 10                        # number of instalments
P <- 1500                      # amount borrowed
R <- P * i / (1 - (1 + i)^(-n))
R
## [1] 158.3731

# What is in the global environment?
objects()                      # same as ls()
## [1] "i"         "my_result" "n"         "P"         "R"

# R is case sensitive
x <- 1:10
sum(x)
## [1] 55
SUM <- sum                     # functions are objects too: copy sum under a new name
SUM(x)
## [1] 55

getwd()                        # current working directory (use setwd() to change it)
```

Assignments, the loan example and the objects()/ls() listing from the slides, plus the SUM <- sum trick showing that functions are ordinary objects.

## Writing & Calling Functions

### Functions in R

A function is a group of commands designed to perform a certain task. Most of the work in R is done through functions — `cos`, for instance, computes the cosine of a number or of a list of numbers. We can also define our own:

```r
add.3.to <- function(input){
  output <- input + 3
  return(output)
}
add.3.to(10)
## [1] 13
```

> **Definition — General format.**

```r
fun_name <- function(input_args){
  command 1
  command 2
  ...
  return(output)
}
```

- `fun_name`: the name of the user-defined function;
- `input_args`: a list of input arguments separated by commas, such as `arg1, arg2`;
- the commands go on different lines, or on one line separated by semicolons;
- `return(output)`: the desired output.

Like in math, a function is a mapping $(\text{arg}_1, \dots, \text{arg}_n) \mapsto \text{output}$, where the output is produced by a finite sequence of R commands in the function's body. *Note:* a function might not terminate — interrupt it with `Ctrl`+`C`.

> **Example — Exercises.** Create the functions $$x \mapsto \cos(x) - \sqrt{\log_2(x)} \qquad\text{and}\qquad (x,y,z) \mapsto x^2 + y^2 + z^2$$ and verify that they correctly apply the desired formulas. (Solutions in the R example below.)

### Default arguments — the q function

```r
q
## function (save = "default", status = 0, runLast = TRUE)
## .Internal(quit(save, status, runLast))
## <bytecode: 0x7fe17b9e5fc0>
## <environment: namespace:base>
```

`q` has three arguments, `save`, `status` and `runLast`, each with a default value (`"default"`, `0`, `TRUE`). `q()` calls it with all defaults. We can override them:

- `q("no")` and `q(save = "no")` both quit without saving — the first argument is given, the rest keep their defaults. Two unnamed arguments would go to `save` and `status`, in that order.
- To set only a particular argument, name it: `q(runLast = FALSE)` — the same as `q( , , FALSE)`.

> **Note — = versus <- inside a call.** `q(runLast <- FALSE)` is quite different from `q(runLast = FALSE)`: the arrow first assigns `FALSE` to an object named `runLast`, then passes the *value* `FALSE` as the *first* argument — i.e. `q(save = FALSE)`, probably not what you wanted. Use `=` to set arguments, and use named arguments whenever a function has many arguments or you are using uncommon ones: less risk of a wrong argument, and more readable code.

> **Key insight.** fun <- function(args){ body; return(output) }. Arguments are matched by position unless named; defaults fill in whatever you leave out. Inside a call, = sets an argument while <- performs an assignment and passes the value positionally.

> **Caution.** q(runLast <- FALSE) silently becomes q(save = FALSE). Always use = for arguments inside function calls.

**Equations**

- *Exercise 1*: $f(x) = \cos(x) - \sqrt{\log_2(x)}$ — Needs x > 0 and log2(x) ≥ 0, i.e. x ≥ 1, for a real result.
- *Exercise 2*: $g(x,y,z) = x^2 + y^2 + z^2$ — Three input arguments, one output.

```sim
id: r-function-plot
controls:
  - {id: xmax, label: "Plot f(x) = cos(x) \u2212 \u221Alog\u2082(x) for 1 \u2264 x \u2264", min: 2, max: 40, step: 1, default: 10, decimals: 0}
note: The function from Exercise 1, evaluated on a vector of x-values — exactly what f(seq(1, xmax, length.out = 400)) returns in R, since cos, sqrt and log2 are all vectorised.
...
```

```r
# A first user-defined function
add.3.to <- function(input){
  output <- input + 3
  return(output)
}
add.3.to(10)
## [1] 13

# Exercise 1:  x -> cos(x) - sqrt(log2(x))
f <- function(x){
  return(cos(x) - sqrt(log2(x)))
}
f(1)                     # cos(1) - sqrt(0)
## [1] 0.5403023
f(4)                     # cos(4) - sqrt(2)
## [1] -2.067875

# Exercise 2:  (x, y, z) -> x^2 + y^2 + z^2
sum.of.squares <- function(x, y, z){
  return(x^2 + y^2 + z^2)
}
sum.of.squares(1, 2, 3)
## [1] 14
sum.of.squares(z = 3, x = 1, y = 2)   # named arguments can be given in any order
## [1] 14

# Default arguments: look at the definition of q
q
## function (save = "default", status = 0, runLast = TRUE)
## .Internal(quit(save, status, runLast))

# A function of our own with a default value
power <- function(x, p = 2){ return(x^p) }
power(3)                 # p takes its default
## [1] 9
power(3, 3)              # positional
## [1] 27
power(p = 3, x = 3)      # named
## [1] 27
```

The add.3.to example, both exercises from the slides (with checks), and a small function with a default argument mirroring how q(save, status, runLast) works.

## Further reading

- [The R Project for Statistical Computing](https://www.r-project.org/) — Download R (the slides recommend 4.4.1).
- [RStudio Desktop](https://posit.co/download/rstudio-desktop/) — The free IDE used in the course.
- [R Markdown](https://rmarkdown.rstudio.com/) — Documents mixing R code, output and LaTeX — recommended for assignments and reproducible research.
- [Textbook: A First Course in Statistical Programming with R (Braun & Murdoch)](https://www.cambridge.org/core/books/first-course-in-statistical-programming-with-r/) — Cambridge University Press; the 2nd edition is freely available as an eBook through the Concordia Library.
- [R documentation — Arithmetic operators](https://stat.ethz.ch/R-manual/R-devel/library/base/html/Arithmetic.html) — Official reference for +, -, *, /, ^, %% and %/%.
- [R documentation — function](https://stat.ethz.ch/R-manual/R-devel/library/base/html/function.html) — Formal reference for function definition and argument matching.
