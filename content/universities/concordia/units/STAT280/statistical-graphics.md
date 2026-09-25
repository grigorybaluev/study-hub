---
title: Programming statistical graphics
order: 5
status: detailed
weeks: [4]
introduces: [data-visualization]
requires:
  - {concept: r-programming, strength: hard}
  - {concept: data-frame, strength: soft}
reinforces: []
---

Base R graphics for exploring data: bar charts, histograms, box plots, scatter plots,
and customising and combining plots.

## Graphics systems in R

R has more than one way to draw. This unit uses **base graphics**, the oldest system, which
works like pen on paper: each command adds ink to the current picture, and what has been drawn
stays drawn (you can draw over it, or start a new page, but not move it). Two other systems are
worth knowing by name:

- **grid** graphics keeps the pieces of a figure as objects that can be changed after drawing;
  the **lattice** and **ggplot2** packages build their high-level plots on it;
- interactive and 3-D graphics come from further packages.

All of them are *device independent*: the same commands draw on the screen, into a PDF or into a
PNG file, with small differences in how each device renders them.

:::definition[High-level and low-level plotting functions]
A **high-level** function (`barplot()`, `hist()`, `boxplot()`, `plot()`, …) draws a complete
plot on a new page: axes, labels and data. A **low-level** function (`points()`, `lines()`,
`text()`, `legend()`, …) adds to the plot that is already there.
:::

## High-level plots

### Bar charts and dot charts

Both show **one number per category**: the bar's length, or the dot's position, is the value.
`barplot()` takes a vector (one bar each) or a matrix (one group of bars per column, stacked
unless `beside = TRUE`). `table()` turns a categorical vector into counts ready to plot.
`dotchart()` shows the same numbers as dots along one axis.

```r
cyl <- table(mtcars$cyl)            # cars in mtcars by number of cylinders
cyl
## 
##  4  6  8 
## 11  7 14 
barplot(cyl, xlab = "Cylinders", ylab = "Number of cars",
        main = "Cars by cylinder count")
VADeaths                            # a matrix: rows are age groups
##       Rural Male Rural Female Urban Male Urban Female
## 50-54       11.7          8.7       15.4          8.4
## 55-59       18.1         11.7       24.3         13.6
## 60-64       26.9         20.3       37.0         19.3
## 65-69       41.0         30.9       54.6         35.1
## 70-74       66.0         54.3       71.1         50.0
barplot(VADeaths, beside = TRUE, legend.text = TRUE, ylim = c(0, 80),
        ylab = "Deaths per 1000", main = "Virginia death rates, 1940")
dotchart(VADeaths, xlim = c(0, 75), xlab = "Deaths per 1000")
```

Each argument changes one thing: `beside = TRUE` puts a column's bars next to each other instead
of stacking them, `legend.text = TRUE` adds a legend from the row names, `ylim` leaves room for
it, and `main`, `xlab`, `ylab` set the title and axis labels. In the dot chart the axis starts at
zero so that the groups' rates can be compared as proportions.

### Pie charts

A pie chart splits a disk into slices whose angles are proportional to the values.

```r
budget <- c(Rent = 45, Food = 20, Transport = 10, Savings = 15, Other = 10)
pie(budget, main = "Monthly budget (%)")
```

Pie charts are common in the press but statisticians avoid them: comparing slices means
comparing angles and areas, which people judge poorly (see *Choosing a graphic* below). The same
five numbers are easier to compare as a bar or dot chart.

### Histograms

:::definition[Histogram]
A bar chart of a **distribution**: the range of the data is cut into intervals (*bins*), and each
bar shows how many observations fall in its bin. With equal-width bins the height is the count;
with unequal widths the **area** must be proportional to the count, so the height becomes a
density (count per unit of $x$).
:::

`hist(x)` draws one; the object it returns records the `breaks` and `counts` it used.

```r
set.seed(280)
x <- rnorm(200, mean = 50, sd = 10)
h <- hist(x, main = "200 normal values")
h$breaks
##  [1] 20 25 30 35 40 45 50 55 60 65 70 75
h$counts
##  [1]  2  2  7 26 34 35 44 26 16  7  1
nclass.Sturges(x)                   # ceiling(log2(200) + 1)
## [1] 9
```

By default R aims for about $\lceil \log_2 n + 1 \rceil$ bins (*Sturges' rule*): 9 here for
$n = 200$. It then moves the break points to round numbers, which is why 11 bars appear. For large
samples Sturges' rule gives too few bins: the number should grow like $n^{1/3}$ rather than
$\log_2 n$. `breaks = "Scott"` and `breaks = "FD"` (Freedman–Diaconis) use rules of that kind.

```r
big <- rnorm(10000)
nclass.Sturges(big)
## [1] 15
nclass.scott(big)
## [1] 45
nclass.FD(big)
## [1] 57
hist(big, breaks = "Scott", main = "Scott's rule, n = 10000")
```

With `freq = FALSE` the histogram is drawn on the **density** scale (total bar area 1), so a
density curve can be laid over it with `curve(…, add = TRUE)`.

```r
hist(x, freq = FALSE, main = "Density scale")    # bar areas sum to 1
curve(dnorm(x, mean = 50, sd = 10), add = TRUE)  # the true density on top
```

### Box plots

A box plot summarises a distribution in five numbers and flags unusual values.

:::steps[Constructing a box plot]
1. Draw a line at the **median**.
2. Split the data at the median into a lower and an upper half, each including the median, and
   draw the box from the median of the lower half (lower quartile, or *hinge*) to the median of
   the upper half (upper quartile). Its length is the **interquartile range** (IQR); about half the
   data lie inside the box.
3. Draw each **whisker** from the box out to the most extreme observation that lies within
   $1.5 \times \text{IQR}$ of the box.
4. Plot any observation beyond the whiskers individually, as a possible **outlier**.
:::

For normal-shaped data about 99 % of observations fall between the whiskers, so points outside
deserve a look. `fivenum()` gives the minimum, hinges, median and maximum, and
`boxplot.stats()` gives exactly what `boxplot()` will draw.

```r
y <- c(2, 4, 4, 5, 6, 7, 8, 9, 10, 24)
fivenum(y)                    # min, lower hinge, median, upper hinge, max
## [1]  2.0  4.0  6.5  9.0 24.0
IQR(y)
## [1] 4.5
boxplot.stats(y)$stats        # what boxplot() draws: whisker, box, median, box, whisker
## [1]  2.0  4.0  6.5  9.0 10.0
boxplot.stats(y)$out          # beyond 1.5 box lengths: drawn as points
## [1] 24
boxplot(y, horizontal = TRUE)
```

Here the box runs from 4 to 9 (IQR 5), so the upper whisker may reach $9 + 7.5 = 16.5$: it stops
at 10, the largest value within that limit, and 24 is drawn as an outlier.

Box plots shine when **comparing groups**, each with a reasonable number of observations. The
*formula* `y ~ group` reads "y depending on group", and `data =` names the data frame that holds
both columns:

```r
boxplot(Sepal.Width ~ Species, data = iris, boxwex = 0.5,
        ylab = "Sepal width (cm)", main = "Iris sepal width by species")
```

### Scatter plots

A scatter plot draws the points $(x_i, y_i)$ to show the **relationship** between two
measurements. `plot(x, y)`, or the formula form `plot(y ~ x, data = df)`, draws one. The `type`
argument chooses what is drawn: `"p"` points (the default), `"l"` lines joining the points in
order, `"b"` both, `"n"` nothing (just the frame, to be filled with low-level functions).
`pairs()` draws the scatter plot of every pair of columns of a data frame.

```r
plot(mpg ~ wt, data = mtcars, xlab = "Weight (1000 lb)",
     ylab = "Miles per gallon", main = "Heavier cars use more fuel")
cor(mtcars$mpg, mtcars$wt)
## [1] -0.8676594
t <- seq(0, 2 * pi, length.out = 100)
plot(t, sin(t), type = "l")          # a line through the points, in order
pairs(mtcars[, c("mpg", "wt", "hp")])   # every pair of columns
```

### QQ plots

A **quantile–quantile plot** compares two distributions by plotting the sorted values of one
against the sorted values (quantiles) of the other.

- Two samples of equal size: plot $(x_{(i)}, y_{(i)})$, the $i$-th smallest of each. With unequal
  sizes, R shrinks the larger sample to matching quantiles.
- One sample against a model: plot the sorted data against the model's quantiles at the
  probabilities $(i - \frac{1}{2})/n$, spread evenly between 0 and 1. `qqnorm()` does this for the
  normal distribution and `qqline()` adds a reference line.

:::insight[Reading a QQ plot]
Points near a straight line: the distributions have the same shape (a line other than $y = x$
only means a change of location or scale). Curvature at one end: skewness. An S shape with the
ends pulled away from the line: tails heavier (or lighter) than the model.
:::

```r
(1:5 - 0.5) / 5                      # probabilities for 5 sorted values
## [1] 0.1 0.3 0.5 0.7 0.9
set.seed(3)
z <- rnorm(300)
qqnorm(z, main = "Normal data"); qqline(z)
e <- rexp(300)
qqnorm(z, main = "Normal data"); qqline(z)
e <- rexp(300)
qqnorm(e, main = "Right-skewed data"); qqline(e)
w <- rt(300, df = 3)
qqnorm(e, main = "Right-skewed data"); qqline(e)
w <- rt(300, df = 3)
qqnorm(w, main = "Heavy tails"); qqline(w)
qqplot(z, 5 + 2 * z, main = "A linear change: still a straight line")
qqnorm(w, main = "Heavy tails"); qqline(w)
qqplot(z, 5 + 2 * z, main = "A linear change: still a straight line")
```

## Choosing a high-level graphic

Two questions narrow the choice:

| The data are… | Use |
|---|---|
| single values, one per category | bar chart, dot chart (pie chart, rarely) |
| a distribution of one variable | histogram, box plot, QQ plot |
| pairs of values | scatter plot |

The second question is **the audience**. A box plot or a QQ plot needs more explanation than a
histogram; for a general audience a simpler plot may communicate better.

Beyond that, good choices follow from how people **decode** a graph. We judge **positions** and
**lengths** well, **angles** and **slopes** less well, and **areas** and **volumes** poorly. Colour
separates groups well, but nobody reads quantities accurately from it, and a noticeable share of
people (far more men than women) are partly colour-blind.

:::caution[Make every channel tell the same story]
A bar is read by its end position, its length *and* its area, so a bar chart should start at zero:
otherwise the three disagree. When zero is meaningless for the data, use a dot chart, where only
position carries the value. Prefer palettes designed for colour-blind readers (the
**RColorBrewer** package has sequential, diverging and qualitative ones).
:::

## Low-level graphics functions

### The plot region and the margins

Base graphics divides the page into the **plot region**, where data are drawn in data
coordinates, and four **margins** around it, numbered clockwise from the bottom (1 = bottom,
2 = left, 3 = top, 4 = right). Text in the margins is positioned by **lines** counted outward from
the plot region: tick labels usually sit on line 1 and axis titles on line 3.

```r
par(mar = c(5, 5, 5, 5) + 0.1)       # four margins, in lines of text
plot(c(0, 10), c(0, 100), type = "n", xlab = "", ylab = "")
text(5, 80, "Plot region")
points(5, 40)
text(5, 40, "(5, 40)", pos = 1)
mtext(paste("Margin", 1:4), side = 1:4, line = 3)
mtext(paste("Line", 0:4), side = 1, line = 0:4, at = 2, cex = 0.6)
```

### Adding to a plot

| Function | Adds |
|---|---|
| `points(x, y)` | points |
| `lines(x, y)` | connected line segments |
| `text(x, y, labels)` | text at data coordinates |
| `abline(a, b)`, `abline(h = y)`, `abline(v = x)`, `abline(fit)` | the line $y = a + bx$, a horizontal or vertical line, a fitted regression line |
| `segments()`, `arrows()`, `polygon()`, `symbols()` | segments, arrows, filled shapes, circles and squares |
| `legend(position, legend, …)` | a legend |
| `title()`, `mtext()`, `axis()`, `box()` | titles, text in a margin, an axis, a frame |

`pch` sets the plotting symbol (1 an open circle, 16 a filled dot, or a character such as
`"f"`), `lty` the line type, `col` the colour, and `cex` the size.

:::example[Two groups on one scatter plot]
Grades against hours of study for two groups: a different symbol per group, a least-squares line
per group (`lm()` fits it and `abline()` draws it), a pass mark, a legend, and a label on the best
grade.
:::

```r
study <- data.frame(
  hours = c(2, 5, 1, 8, 6, 3, 7, 4),
  grade = c(58, 74, 52, 91, 80, 66, 85, 70),
  group = c("A", "B", "A", "B", "B", "A", "B", "A")
)
plot(grade ~ hours, data = study, pch = ifelse(group == "A", 1, 16),
     xlab = "Hours studied", ylab = "Grade")
fitA <- lm(grade ~ hours, data = study, subset = group == "A")
fitB <- lm(grade ~ hours, data = study, subset = group == "B")
coef(fitA)
## (Intercept)       hours 
##        46.0         6.2 
coef(fitB)
## (Intercept)       hours 
##        46.1         5.6 
abline(fitA, lty = 2)
abline(fitB, lty = 1)
abline(h = 60, col = "grey")               # a pass mark
legend("topleft", legend = c("Group A", "Group B"), pch = c(1, 16), lty = c(2, 1))
best <- which.max(study$grade)
text(study$hours[best], study$grade[best], "best", pos = 1)
```

### Graphical parameters and devices

`par()` sets parameters that apply to the following plots:

- `mfrow = c(m, n)`: an $m \times n$ grid of plots, filled row by row (`mfcol` fills by column);
- `mar = c(bottom, left, top, right)`: margins in lines, `oma` the outer margins around the grid;
- `cex`: character expansion (1.5 is 50 % larger), with `cex.axis`, `cex.lab`, `cex.main` for parts;
- `las`: orientation of tick labels.

`par("name")` reads a setting; `par(name = value)` sets it and invisibly returns the old values,
so they can be restored afterwards.

```r
old <- par(mfrow = c(1, 2), cex = 0.9)   # two plots side by side
hist(x, main = "Histogram")
boxplot(x, main = "Box plot")
par(old)                                 # restore the previous settings
par("mfrow")
## [1] 1 1
```

Plots can also go straight to a file. Open a **device**, draw, then close it with `dev.off()`:

```r
png("histogram.png", width = 800, height = 600)   # or pdf("histogram.pdf")
hist(x)
dev.off()                                          # writes the file
```

`pdf()` and `svg()` give vector files that scale without blurring; `png()` and `jpeg()` give
bitmaps. On screen, R opens a suitable device by itself.

:::example[Custom axes on a log scale]
The areas of the world's land masses (`islands`) range over five orders of magnitude, so the
histogram is drawn for $\log_{10}$ of the areas. Suppressing the default axes (`axes = FALSE`)
and drawing a new one with `axis()` labels the ticks in the original units.
:::

```r
hist(log10(islands), breaks = "Scott", axes = FALSE, xlab = "Area (sq. miles)",
     main = "Land masses, log scale")
axis(1, at = 1:5, labels = 10^(1:5))     # label the log axis in original units
axis(2)
box()
```

:::insight
Build a figure in layers: a high-level function draws the frame and the data, low-level
functions add points, lines, text and legends on top, and `par()` controls the layout and style of
everything that follows.
:::

## Further reading

- [R documentation: plot.default](https://stat.ethz.ch/R-manual/R-devel/library/graphics/html/plot.default.html) — the `type`, `pch`, `xlim` and label arguments of `plot()`.
- [R documentation: par](https://stat.ethz.ch/R-manual/R-devel/library/graphics/html/par.html) — every graphical parameter.
- [R documentation: hist](https://stat.ethz.ch/R-manual/R-devel/library/graphics/html/hist.html) — breaks, rules for the number of bins, and the returned object.
- [R documentation: boxplot.stats](https://stat.ethz.ch/R-manual/R-devel/library/grDevices/html/boxplot.stats.html) — how hinges, whiskers and outliers are computed.
- [ColorBrewer](https://colorbrewer2.org/) — palettes that stay distinguishable for colour-blind readers.
