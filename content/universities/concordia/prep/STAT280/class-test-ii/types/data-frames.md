---
title: Data frames by hand
order: 1
asks: extract rows and columns, a summary of one column, a new column, rows that meet a condition, a smaller data frame
units: [data-frames-lists-io]
---

## Logic

A data frame is a list of columns of equal length: one row per case, one column per variable. `d$x` is one column
as an ordinary vector, so everything from vectors works on it: `mean(d$x)`, `d$x[2:5]`, `d$x > 80`. `d[rows, cols]`
picks a block, and either index may be numbers, names, or a logical vector. A **condition** is a logical vector
with one value per row; put it in the row slot and keep the comma. A new column is an assignment to a name that
does not exist yet.

## Pattern

:::steps[Any data frame question]
1. Say what comes back: one value, a vector, or a smaller data frame.
2. One column: `d$x`. A block of rows of one column: `d$x[rows]` or `d[rows, "x"]`.
3. A summary: the function on the column, `mean(d$x)`, `max(d$x)`, `sum(d$x > 80)` (how many), `mean(d$x > 80)` (what share).
4. A new column: `d$z <- ...` with an expression of whole columns. No loop: arithmetic on columns is row by row.
5. Rows that meet a condition: `d[cond, ]` for whole rows, `d$name[cond]` for one column of them.
6. Check on the first row by hand.
:::

## Traps

:::caution[Traps]
- `d[cond]` with no comma selects **columns**, and usually fails with "undefined columns selected". Rows need `d[cond, ]`.
- `=` assigns, `==` compares. `d$x = 80` overwrites the column.
- `&` and `|` work element by element and are what a condition needs; `&&` and `||` take one value only (an error on vectors in R 4.3 and later).
- "At least 80" is `>= 80`; "strictly greater" is `>`.
- `length(d)` is the number of **columns**; the number of rows is `nrow(d)`.
- `d[, "x"]` gives a vector, `d["x"]` gives a one-column data frame.
- `mean(d)` on a whole data frame is not the mean of anything: it warns and gives `NA`. Use `colMeans()` on numeric columns, or `rowMeans()` across them.
:::

## Worked problems

::::exercise[A week at a café]
The data frame `cafe` holds the cups of coffee and tea sold on seven days. Write one R command for each part.

```r
cafe <- data.frame(
  Day = c("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"),
  Coffee = c(42, 38, 45, 40, 51, 63, 58),
  Tea = c(18, 25, 21, 30, 24, 19, 27)
)
```

(a) The tea sold on days 3 to 6. (b) The mean number of coffees per day. (c) A new column `Total`, the cups of both
sold each day. (d) The days on which at least 75 cups were sold. (e) A new data frame of the days on which tea sold
better than half the coffee. (f) The day with the most coffee.

:::solution
```r
cafe$Tea[3:6]                         # (a) or cafe[3:6, "Tea"]
## [1] 21 30 24 19
mean(cafe$Coffee)                     # (b)
## [1] 48.14286
cafe$Total <- cafe$Coffee + cafe$Tea  # (c) column arithmetic is row by row
cafe$Day[cafe$Total >= 75]            # (d) "at least" is >=
## [1] "Fri" "Sat" "Sun"
strong.tea <- cafe[cafe$Tea > cafe$Coffee / 2, ]   # (e) the comma keeps whole rows
strong.tea
##   Day Coffee Tea Total
## 2 Tue     38  25    63
## 4 Thu     40  30    70
cafe$Day[which.max(cafe$Coffee)]      # (f)
## [1] "Sat"
```

Check (c) on Monday: $42+18=60$. In (d) the condition `cafe$Total >= 75` is seven `TRUE`/`FALSE` values, one per
day, and it picks from `cafe$Day`, which has the same seven positions.
:::
::::

:::note[Pattern at work]
Step 1 decides the shape: (a) and (d) are vectors, (b) one number, (e) a data frame, so (e) is the only one with
`[cond, ]`. Step 4 adds the column without a loop, and step 5 is the same condition used in two ways.
:::

::::exercise[Say what comes back]
Without running it, say what each line returns, then check.

```r
d <- data.frame(g = c("a", "b", "a", "b"), x = c(3, 8, 5, 1))
nrow(d)
length(d)
d[2, ]
d[d$x > 2, "g"]
d$x > 2
sum(d$x > 2)
mean(d$x[d$g == "a"])
d[order(d$x), ]
```

:::solution
```r
nrow(d)
## [1] 4
length(d)
## [1] 2
d[2, ]
##   g x
## 2 b 8
d[d$x > 2, "g"]
## [1] "a" "b" "a"
d$x > 2
## [1]  TRUE  TRUE  TRUE FALSE
sum(d$x > 2)
## [1] 3
mean(d$x[d$g == "a"])
## [1] 4
d[order(d$x), ]
##   g x
## 4 b 1
## 1 a 3
## 3 a 5
## 2 b 8
```

`nrow` counts rows (4), `length` counts columns (2). `d[2, ]` is the second row as a one-row data frame.
`d$x > 2` is a logical vector; `sum()` of it counts the `TRUE`s, so 3 values exceed 2. `d$x[d$g == "a"]` keeps
3 and 5, mean 4. `order(d$x)` gives the row numbers from the smallest `x` up: 4, 1, 3, 2.
:::
::::

:::note[Pattern at work]
Step 1 on every line: the comma decides between a data frame (`d[2, ]`) and a vector (`d[cond, "g"]`), and a
condition counted with `sum()` or averaged with `mean()` gives a number.
:::

::::exercise[Averages across columns]
Add a column `Mean` to `cafe` holding the mean of the coffee and tea sold each day in two ways, then list the days
whose mean is above the overall mean of that column.

:::solution
```r
cafe$Mean <- (cafe$Coffee + cafe$Tea) / 2
cafe$Mean2 <- rowMeans(cafe[, c("Coffee", "Tea")])   # the same, for any number of columns
identical(cafe$Mean, cafe$Mean2)
## [1] TRUE
cafe$Day[cafe$Mean > mean(cafe$Mean)]
## [1] "Fri" "Sat" "Sun"
```

`mean(cafe$Mean)` is a single number, and `cafe$Mean > ` that number compares every row with it, since R recycles
a length-one value.
:::
::::

:::note[Pattern at work]
Step 4 with `rowMeans()`, which averages across the columns of each row, where `colMeans()` would average down
each column. Step 5 uses a condition whose right side is one number.
:::
