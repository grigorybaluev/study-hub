---
title: Flow control and functions
order: 6
status: detailed
weeks: [5]
introduces: []
requires:
  - {concept: r-programming, strength: hard}
reinforces:
  - {concept: selection, perspective: "in R"}
  - {concept: iteration, perspective: "in R"}
  - {concept: function-definition, perspective: "in R"}
---

Conditional execution, for and while loops, and writing functions to manage complexity.

## Programming styles

A program is a set of instructions, and there are two broad ways to write them. **Imperative**
programs (R, Python, C) spell out the steps the computer must take; **declarative** ones (HTML,
SQL) describe the result and leave the steps to the system. Within the imperative style a program
can be *procedural* (a sequence of steps), *modular* (split into self-contained packages),
*object-oriented* (organised around operations on complex objects) or *functional* (built from
functions without side effects), and R supports all of these. This unit is about the procedural
core: statements that decide **what runs** and **how many times**.

## Loops with a known number of steps: for()

:::definition[for loop]
`for (name in vector) { commands }` sets `name` to each element of `vector` in turn and runs
the commands once for each. The braces group several commands into one; for a single command
they may be left out.
:::

:::example[A recurrence]
The Lucas numbers start 2, 1 and continue with each term the sum of the two before it. Create a
vector of the right length first, set the first two terms, then let the loop fill in the rest.
:::

```r
lucas <- numeric(10)             # 10 zeros, filled in below
lucas[1] <- 2
lucas[2] <- 1
for (k in 3:10) lucas[k] <- lucas[k - 1] + lucas[k - 2]
lucas
##  [1]  2  1  3  4  7 11 18 29 47 76
```

Inside a loop, results are not printed automatically; `cat()` (or `print()`) shows them.

```r
balance <- 1000                  # deposit 1000, earn 4% a year
for (year in 1:5) {
  balance <- balance * 1.04
  cat("year", year, ":", round(balance, 2), "\n")
}
## year 1 : 1040 
## year 2 : 1081.6 
## year 3 : 1124.86 
## year 4 : 1169.86 
## year 5 : 1216.65 
```

### Fixed-point iteration

Many equations can be rearranged into the form $x = g(x)$, a **fixed-point problem**: the
unknown appears on both sides. Guess $x_0$, compute $x_1 = g(x_0)$, then $x_2 = g(x_1)$, and so on;
if the sequence settles down, its limit solves the equation.

:::example[The interest rate hidden in a loan offer]
A loan of 9000 is repaid in 12 monthly payments of 800. The monthly rate $i$ satisfies the
annuity equation, which multiplied by $i/9000$ becomes a fixed-point problem:

$$
9000 = 800\,\frac{1 - (1+i)^{-12}}{i} \qquad\Longrightarrow\qquad i = \frac{800\,\bigl(1 - (1+i)^{-12}\bigr)}{9000}
$$
:::

```r
i <- 0.01                              # first guess for the monthly rate
for (step in 1:500) i <- 800 * (1 - (1 + i)^(-12)) / 9000
i
## [1] 0.01007142
800 * (1 - (1 + i)^(-12)) / i          # check: the payments are worth 9000 today
## [1] 9000
```

The rate is about 1.007 % a month. This iteration creeps towards the answer slowly, which is why
it runs for hundreds of steps.

:::note[When does it converge?]
If $|g'(x)| < 1$ near the solution and the start is close enough, the iteration converges, and
the smaller $|g'|$, the faster. Here $g'$ is just below 1 at the solution, so each step removes
only a small part of the error. A `for` loop needs the number of steps in advance; the `while`
loop below stops when the answer is good enough instead.
:::

## Choosing what runs: if() and else

:::definition[if statement]
`if (condition) { commands }` runs the commands only when `condition` is `TRUE`;
`if (condition) { A } else { B }` runs `A` when it is `TRUE` and `B` otherwise. The condition must
be a **single** `TRUE` or `FALSE` (a number is accepted, with 0 as `FALSE`); `NA` is an error.
:::

Chains of `else if` choose among several cases, testing the conditions in order:

```r
temp <- 23
if (temp > 25) {
  advice <- "shorts"
} else if (temp > 10) {
  advice <- "a light jacket"
} else {
  advice <- "a coat"
}
advice
## [1] "a light jacket"
```

:::caution[Where to put else]
At the console, R runs a line as soon as it is complete. Written as `if (…) {…}` on one line and
`else {…}` on the next, the first line is already a finished statement, and the `else` becomes a
syntax error. Put `else` on the same line as the closing brace: `} else {`.
:::

`if` is also an expression with a value, so a short function can simply return it. For a
**vector** of conditions, use the vectorised `ifelse(test, yes, no)`, which picks from `yes` or
`no` element by element:

```r
letter <- function(score) {
  if (score >= 85) "A" else if (score >= 70) "B" else if (score >= 50) "C" else "F"
}
letter(91)
## [1] "A"
letter(64)
## [1] "C"
scores <- c(91, 64, 45, 77)
ifelse(scores >= 50, "pass", "fail")        # vectorised: one answer per element
## [1] "pass" "pass" "fail" "pass"
if (scores >= 50) "pass"                    # if() needs a single TRUE/FALSE
## Error: the condition has length > 1
```

## Loops with an unknown number of steps

### while()

:::definition[while loop]
`while (condition) { commands }` checks the condition; if it is `TRUE` the commands run and the
condition is checked again, and so on until it is `FALSE`. If it is `FALSE` at the start, the
commands never run.
:::

:::example[Collatz steps]
Halve an even number, send an odd one to $3n + 1$, and count the steps until reaching 1. Nobody
knows in advance how many steps a starting value needs, so the loop runs until the condition
fails.
:::

```r
n <- 27
steps <- 0
while (n != 1) {
  n <- if (n %% 2 == 0) n / 2 else 3 * n + 1
  steps <- steps + 1
}
steps
## [1] 111
```

A `while` loop is also the natural way to collect "all values below a bound":

```r
powers <- 1
while (3 * powers[length(powers)] < 1000) powers <- c(powers, 3 * powers[length(powers)])
powers
## [1]   1   3   9  27  81 243 729
```

:::caution[Growing a vector one element at a time]
`powers <- c(powers, new)` builds a new, longer vector at every step. For a few elements that
is fine; for thousands it becomes very slow. When the final length is known, create the vector
at full length first (`numeric(n)`) and fill it in.
:::

### Newton's method

To solve $f(x) = 0$, replace $f$ near the current guess by its tangent line,
$f(x) \approx f(x_{n-1}) + f'(x_{n-1})(x - x_{n-1})$, and take the point where the tangent crosses
zero as the next guess:

$$
x_n = x_{n-1} - \frac{f(x_{n-1})}{f'(x_{n-1})}
$$

Started close enough to a root, the iteration converges very fast (the number of correct digits
roughly doubles each step). Started far away, or near a point where $f' = 0$, it can wander off
or fail.

:::example[A root of x³ − 2x − 5]
Iterate until $|f(x)|$ is below a tolerance. Only the current value is needed, so no step counter
is required.
:::

```r
f <- function(x) x^3 - 2 * x - 5
f.prime <- function(x) 3 * x^2 - 2
x <- 2                                 # starting guess
while (abs(f(x)) > 1e-10) {
  x <- x - f(x) / f.prime(x)
  cat(format(x, digits = 12), "\n")
}
## 2.1 
## 2.0945681211 
## 2.0945514817 
## 2.09455148154 
x
## [1] 2.094551
```

Four steps from $x_0 = 2$ give the root $2.0945514815\ldots$ to eleven digits.

### repeat, break and next

`repeat { commands }` loops forever; a `break` inside it (usually `if (condition) break`) is the
way out. `break` also ends a `for` or `while` loop early, and `next` skips the rest of the current
pass and goes on to the next one.

The Newton loop above computed $f(x)$ in two places; with `repeat` the test sits in the middle,
after $f(x)$ is known, and the duplication disappears:

```r
x <- 2
repeat {
  fx <- f(x)
  if (abs(fx) < 1e-10) break           # the only way out
  x <- x - fx / f.prime(x)
}
x
## [1] 2.094551
```

```r
total <- 0
for (k in 1:10) {
  if (k %% 3 == 0) next                # skip multiples of 3
  total <- total + k
}
total
## [1] 37
```

:::note[Use them sparingly]
A loop whose only exit is the test at the top is the easiest to read. `repeat`, `break` and `next`
are worth it when they remove duplicated code or awkward flags, as above.
:::

:::example[Bisection]
If $f$ is continuous and $f(a)$, $f(b)$ have opposite signs, a root lies between them. Evaluate
$f$ at the midpoint, keep the half that still has a sign change, and repeat until the interval is
short enough. Each step halves the interval, so from length 1 it takes 20 steps to get below
$10^{-6}$ ($2^{-20} \approx 9.5 \times 10^{-7}$).
:::

```r
lo <- 2; hi <- 3                       # f(2) < 0 < f(3)
iterations <- 0
lo <- 2; hi <- 3                       # f(2) < 0 < f(3)
iterations <- 0
repeat {
  mid <- (lo + hi) / 2
  if (f(lo) * f(mid) <= 0) hi <- mid else lo <- mid
  iterations <- iterations + 1
  if (hi - lo < 1e-6) break
}
c(root = (lo + hi) / 2, iterations = iterations)
##       root iterations 
##   2.094552  20.000000 
```

Bisection is slower than Newton's method but cannot fail once a sign change is bracketed.

:::insight
Use `for` when the number of passes is known, `while` when a condition decides, and `repeat`
with `break` when the natural test sits in the middle of the loop. `if`/`else` chooses between
blocks for a single condition; `ifelse()` chooses element by element.
:::

## Managing complexity with functions

### What a function is

Real programs are too long to hold in one's head. **Functions** break them into self-contained
pieces with a clear purpose: inputs go in, a result comes out, and once a function is tested the
details can be forgotten.

:::definition[Parts of an R function]
A function is an object with three parts:

- the **header** `function(arguments)`, which names the inputs (possibly none) and their defaults;
- the **body**, one statement or several in braces, which computes the result: the value of
  `return(…)`, or else the value of the last statement evaluated;
- the **environment** where the function was defined, which is where it looks for any name that
  is not one of its own.
:::

:::example[The value of regular savings]
Depositing a payment $R$ at the end of each year for $n$ years at interest rate $i$ accumulates
to

$$
R(1+i)^{n-1} + \dots + R(1+i) + R = R\,\frac{(1+i)^n - 1}{i}
$$
:::

```r
future.value <- function(payment, rate, years) {
  # value after `years` end-of-year deposits of `payment` at interest `rate`
  payment * ((1 + rate)^years - 1) / rate
}
future.value(500, 0.03, 20)
## [1] 13435.19
future.value(years = 20, rate = 0.03, payment = 500)
## [1] 13435.19
future.value(500, c(0.02, 0.03, 0.04), 20)     # vectorised for free
## [1] 12148.68 13435.19 14889.04
```

Arguments are matched by name first, then by position. Because the body uses only vectorised
operations, a vector of rates gives a vector of answers with no extra code.

### Default arguments

A default value in the header is used whenever the caller leaves that argument out. Since
functions are objects, their parts can be inspected: `formals()` lists the arguments and their
defaults, and `body()` returns the code.

```r
future.value <- function(payment, rate = 0.03, years = 10) {
  payment * ((1 + rate)^years - 1) / rate
}
future.value(500)                  # rate and years take their defaults
## [1] 5731.94
future.value(500, years = 20)
## [1] 13435.19
formals(future.value)$rate
## [1] 0.03
body(future.value)
## {
##     payment * ((1 + rate)^years - 1)/rate
## }
```

:::note[Naming]
A function's name should say what it does (`var()`, `median()`, `future.value()`). A misleading
name, such as calling this function `interest.rate()`, makes every program that uses it harder to
understand. The same goes for argument names.
:::

### Checking inputs: stop() and stopifnot()

A function should refuse input that makes its result meaningless. `stop("message")` ends the
call with an error; `stopifnot(condition)` does the same whenever the condition is not all
`TRUE`, with an automatic message.

:::example[The sieve of Eratosthenes]
To list the primes up to $n$: start with the candidates $2, \dots, n$. The smallest candidate is
prime, so move it to the list of primes and cross out all its multiples (including itself). Repeat
until no candidates remain.
:::

```r
sieve <- function(n) {
  # all primes up to n, by crossing out multiples
  if (n < 2) stop("n should be at least 2")
  candidates <- 2:n
  primes <- c()
  while (length(candidates) > 0) {
    p <- candidates[1]                               # smallest survivor is prime
    primes <- c(primes, p)
    candidates <- candidates[candidates %% p != 0]   # cross out its multiples
  }
  primes
}
sieve(40)
##  [1]  2  3  5  7 11 13 17 19 23 29 31 37
sieve(1)
## Error: n should be at least 2
```

A function may define **another function inside it**. The helper below, `cross.out()`, has its
own argument `p` but finds `candidates` in its environment: the body of `sieve2()` where it was
defined.

```r
sieve2 <- function(n) {
  stopifnot(n >= 2)
  candidates <- 2:n
  primes <- c()
  cross.out <- function(p) candidates[candidates %% p != 0]   # sees `candidates`
  while (length(candidates) > 0) {
    p <- candidates[1]
    primes <- c(primes, p)
    candidates <- cross.out(p)
  }
  primes
}
sieve2(40)
##  [1]  2  3  5  7 11 13 17 19 23 29 31 37
sieve2(0)
## Error: n >= 2 is not TRUE
```

### Scope of variables

:::definition[Scope]
The *scope* of a variable is the part of the program where its name is recognised. A variable
created inside a function is **local**: it exists only while that call runs and is invisible
elsewhere, so two functions can each have their own `x` without interfering. A variable created
at the console is **global**, visible from any function that does not have a local one of the
same name.
:::

```r
x <- 100
f <- function() {
  x <- 1          # a new local x
  g()             # g changes its own x, not this one
  x
}
g <- function() {
  x <- 2
}
f()
## [1] 1
x                 # the global x is untouched
## [1] 100
h <- function() x + 1     # no local x: found in the global environment
h()
## [1] 101
```

Local variables are what make functions trustworthy: while writing one you only have to think
about its own names, and nothing else in the program can change them behind your back.

:::caution
A function that quietly reads a global variable (like `h()` above) gives different answers when
that variable changes. Pass everything a function needs as an argument.
:::

:::note[Comments and editing]
Start every function with a comment saying what it computes and what its arguments mean:
everything after `#` is ignored by R and is for the reader, including yourself a few weeks later.
`fix(name)` opens a function in an editor to correct it, and creates a new one if the name does
not exist yet.
:::

:::insight
A function is a header (the inputs and their defaults), a body (the computation, with its last
value returned) and an environment (where it finds everything else). Check the inputs with
`stop()` or `stopifnot()`, and keep the variables local.
:::

## Further reading

- [R documentation: Control](https://stat.ethz.ch/R-manual/R-devel/library/base/html/Control.html) — `if`, `else`, `for`, `while`, `repeat`, `break` and `next`.
- [R documentation: ifelse](https://stat.ethz.ch/R-manual/R-devel/library/base/html/ifelse.html) — vectorised conditional selection.
- [R documentation: stopifnot](https://stat.ethz.ch/R-manual/R-devel/library/base/html/stopifnot.html) — asserting conditions on inputs.
- [Newton's method (Wikipedia)](https://en.wikipedia.org/wiki/Newton%27s_method) — derivation, convergence and failure cases.
- [Hadley Wickham, *Advanced R*: Functions](https://adv-r.hadley.nz/functions.html) — arguments, lazy evaluation and lexical scoping in depth.
