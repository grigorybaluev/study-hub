---
title: Import a file, then plot it
order: 2
asks: read a CSV into a data frame, a new column, a scatter plot with colours, symbols, labels and title, a reference line, a legend
units: [data-frames-lists-io, statistical-graphics]
---

## Logic

`read.csv()` (or `read.table()` with `header = TRUE, sep = ","`) turns a file into a data frame, after which the
problem is type 1. A plot is built in layers: **one** high-level call (`plot`, `hist`, `boxplot`, `barplot`)
opens the plot and sets the axes; low-level calls (`abline`, `points`, `lines`, `text`, `legend`) draw on it and
never change the axes. Every visual choice is an argument with a fixed name.

## Pattern

:::steps[Import and plot]
1. Import: `d <- read.csv("file.csv")`, or `read.table("file.csv", header = TRUE, sep = ",")`. Check with `str(d)` or `head(d)`.
2. Derived columns: as in type 1, `d$new <- d$a - d$b`.
3. Open the plot: `plot(x, y, ...)`, the horizontal variable first. "$y$ against $x$" means `plot(x, y)`.
4. Style it with arguments: `pch` (symbol), `col` (colour), `cex` (size), `xlab`, `ylab`, `main`, `xlim`, `ylim`, `type`.
5. Add lines: `abline(a = 0, b = 1)` for $y=a+bx$, `abline(h = c)`, `abline(v = c)`; `lty` (line type), `lwd` (width).
6. Legend last: one entry per layer, with the same `col`, `pch` and `lty` as the layer, and `NA` or 0 where a layer has no symbol or line.
:::

| argument | means | common values |
|---|---|---|
| `pch` | point symbol | 1 open circle (default), 16 or 19 solid circle, 17 solid triangle, 15 solid square, 4 cross |
| `lty` | line type | 1 solid, 2 dashed, 3 dotted, 0 none; or `"dashed"`, `"dotted"` |
| `type` | how points are joined | `"p"` points, `"l"` lines, `"b"` both, `"n"` nothing (axes only) |
| `col` | colour | `"blue"`, `"red"`, `2`, `"grey40"` |
| `lwd`, `cex` | line width, symbol size | 1 is normal, 2 is twice |
| `main`, `xlab`, `ylab` | title, axis labels | strings |

## Traps

:::caution[Traps]
- `plot(y, x)` swaps the axes: the first argument is horizontal.
- A second `plot()` call starts a new plot and wipes the first. Add with `points()` or `lines()`.
- `abline(0, 1)` is $y = x$: intercept first, then slope.
- Points added later outside the first plot's range are cut off: set `xlim`/`ylim` in the first call.
- `abline()` never widens the axes either. When every point lies well above $y=x$, the axes may not reach the line at all and `abline(0, 1)` draws nothing visible: give both axes one range, such as `xlim = c(0, 30), ylim = c(0, 30)`.
- In `legend()`, the vectors line up entry by entry. A points-only entry gets `lty = 0` (or `NA`), a line-only entry gets `pch = NA`.
- `read.csv("temps.csv")` looks in the working directory (`getwd()`); a file elsewhere needs its path.
- `header = TRUE` is the default for `read.csv()` but not for `read.table()`.
:::

## Worked problems

::::exercise[Sleep on weekdays and weekends]
A file `sleep.csv` holds the average hours of sleep of six people, on weekdays and at weekends. The first row
holds the column names and the values are separated by commas:

```text
Person,Weekday,Weekend
1,6.5,8.0
2,7.0,7.5
3,5.5,8.5
4,8.0,8.0
5,6.0,9.0
6,7.5,7.0
```

(a) Import it as `sleep`. (b) Add a column `Extra`, the extra hours slept at weekends. (c) Plot weekend sleep against
weekday sleep with solid green triangles, both axes from 5 to 10, axis labels and the title "Weekday vs weekend sleep". (d) Add the
line $y=x$ as a grey dotted line. (e) Add a legend naming the triangles "People" and the line "Same sleep". (f) Who
sleeps less at weekends?

:::solution
To run this, first make the file:

```r
writeLines(c("Person,Weekday,Weekend", "1,6.5,8.0", "2,7.0,7.5", "3,5.5,8.5",
             "4,8.0,8.0", "5,6.0,9.0", "6,7.5,7.0"), "sleep.csv")
```

```r
sleep <- read.csv("sleep.csv")                 # (a)
str(sleep)
## 'data.frame':	6 obs. of  3 variables:
##  $ Person : int  1 2 3 4 5 6
##  $ Weekday: num  6.5 7 5.5 8 6 7.5
##  $ Weekend: num  8 7.5 8.5 8 9 7
sleep$Extra <- sleep$Weekend - sleep$Weekday   # (b)
sleep$Extra
## [1]  1.5  0.5  3.0  0.0  3.0 -0.5
plot(sleep$Weekday, sleep$Weekend,             # (c) "weekend against weekday": weekday is x
     pch = 17, col = "darkgreen",
     xlim = c(5, 10), ylim = c(5, 10),
     xlab = "Weekday sleep (hours)", ylab = "Weekend sleep (hours)",
     main = "Weekday vs weekend sleep")
abline(a = 0, b = 1, col = "grey40", lty = 3)  # (d) y = 0 + 1 x
legend("bottomright",                          # (e)
       legend = c("People", "Same sleep"),
       col = c("darkgreen", "grey40"),
       pch = c(17, NA), lty = c(0, 3))
sleep$Person[sleep$Extra < 0]                  # (f)
## [1] 6
```

`read.table("sleep.csv", header = TRUE, sep = ",")` gives the same data frame. A point above the line slept more
at weekends; person 4 sits on the line and person 6 below it, which (f) confirms.
:::
::::

:::note[Pattern at work]
Steps 1 to 6 in order, one line each. The legend repeats each layer's own `pch`, `lty` and `col`, with `NA` for
the symbol the line does not have and `lty = 0` for the line the points do not have.
:::

::::exercise[Two series on one plot]
Monthly mean temperatures (°C) of two cities are in `m1` and `m2`. Draw both as lines with points against the month
number, the first in blue, the second in red and dashed, on one plot with room for both, and add a legend.

```r
m1 <- c(-10, -8, -2, 6, 13, 18, 21, 20, 15, 8, 2, -6)
m2 <- c(5, 6, 9, 12, 16, 20, 23, 23, 20, 15, 10, 6)
```

:::solution
```r
month <- 1:12
plot(month, m1, type = "b", pch = 16, col = "blue",
     ylim = range(m1, m2),          # room for both series
     xlab = "Month", ylab = "Mean temperature (°C)", main = "Two climates")
lines(month, m2, type = "b", pch = 1, col = "red", lty = 2)
abline(h = 0, col = "grey60")
legend("topleft", legend = c("City 1", "City 2"),
       col = c("blue", "red"), pch = c(16, 1), lty = c(1, 2))
range(m1, m2)
## [1] -10  23
```

Without `ylim`, the axes are set by `m1` alone (−10 to 21), and the second city's highest values, 23, fall off the top.
:::
::::

:::note[Pattern at work]
Step 3 opens the plot with the first series and sets the range for both (the trap of the cut-off points); step 5
adds the second series with `lines()`, not a second `plot()`.
:::

::::exercise[Read the plotting code]
Describe what this draws, without running it.

```r
x <- c(2, 4, 6, 8)
plot(x, x^2, type = "l", lwd = 2, main = "Squares")
points(x, x^2, pch = 4, col = "red")
abline(v = 5, lty = 2)
text(5, 50, "x = 5", pos = 4)
```

:::solution
A thick black line through $(2,4),(4,16),(6,36),(8,64)$, titled "Squares", with the axes labelled `x` and `x^2`
(the expressions themselves). Red crosses mark the four points. A vertical dashed line stands at $x=5$, and the text
"x = 5" is written at $(5,50)$, to its right (`pos = 4`).
:::
::::

:::note[Pattern at work]
One high-level call (step 3) and four layers on top of it (steps 4 and 5). The default axis labels are the
expressions passed, which is why a test asks for `xlab` and `ylab`.
:::
