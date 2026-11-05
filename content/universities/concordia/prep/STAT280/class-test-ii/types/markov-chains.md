---
title: Markov chains
order: 9
asks: a transition matrix from words, one simulated path, n-step probabilities, the long-run distribution
units: [simulating-random-variables]
---

## Logic

The next state depends only on the current one, so a chain is one matrix: row $i$ of $P$ is the distribution of
the next state given state $i$. Simulation draws from the current row, again and again. Matrix powers give the
$n$-step probabilities. In the long run, a chain in which every state reaches every other and which has no
periodic cycle forgets its start: every row of $P^n$ tends to the stationary distribution $\pi$, with $\pi P=\pi$.

## Pattern

:::steps[From words to the long run]
1. Name the states. Write row $i$ from the sentence "from $i$, the next state is ...". Check that every row sums to 1: `rowSums(P)`.
2. Simulate: a loop with `path[t + 1] <- sample(1:k, 1, prob = P[path[t], ])`, the row of the **current** state.
3. Two steps: `P %*% P`. Its entry $(i,j)$ is $\sum_kp_{ik}p_{kj}$, the sum over the state in between.
4. $n$ steps: multiply $n$ times. A start distribution $p_0$ moves to $p_0P^n$.
5. Stationary by hand: solve $\pi P=\pi$ with $\sum_i\pi_i=1$. Drop one equation of $\pi P=\pi$, since one is redundant, and use the sum instead.
6. Stationary in R: the eigenvector of `t(P)` for the eigenvalue 1, scaled to sum to 1; or the long-run proportions `table(path) / length(path)`.
:::

## Traps

:::caution[Traps]
- `P^2` in R squares each entry. The matrix product is `P %*% P`.
- **Rows** sum to 1, not columns. `P[s, ]` is the row of state `s`; `P[, s]` is a column, and it is not a distribution.
- $\pi P=\pi$ has $\pi$ as a row vector on the left. So the eigenvector is that of the **transpose**, `t(P)`, not of `P`.
- `sample(1:k, 1, prob = ...)` needs the `1`: forgetting it draws a whole permutation.
- `eigen()` scales its vectors to length 1, not to sum 1, and may flip the sign. Divide by the sum.
- A chain may have a stationary distribution and still not converge: with $p_{12}=p_{21}=1$ the rows of $P^n$ keep swapping.
:::

## Worked problems

::::exercise[A machine by hand]
A machine that works today works tomorrow with probability 0.9. A broken machine is repaired by tomorrow with
probability 0.4. (a) Write $P$. (b) It works today: find the probability that it works in two days. (c) Find the
long-run fraction of days it works. (d) It earns 200 dollars on a working day and loses 50 on a broken day. Find
the long-run mean per day.

:::solution
(a) With states work, broken: $P=\begin{pmatrix}0.9&0.1\\0.4&0.6\end{pmatrix}$.

(b) Through the state in between: $0.9\cdot0.9+0.1\cdot0.4=0.85$.

(c) $\pi P=\pi$ gives $0.9\pi_1+0.4\pi_2=\pi_1$, so $0.4\pi_2=0.1\pi_1$ and $\pi_1=4\pi_2$. With
$\pi_1+\pi_2=1$: $\pi=(0.8,0.2)$.

(d) $0.8\cdot200-0.2\cdot50=150$ dollars a day.

```r
P <- matrix(c(0.9, 0.1,
              0.4, 0.6), nrow = 2, byrow = TRUE)
P %*% P
##      [,1] [,2]
## [1,] 0.85 0.15
## [2,] 0.60 0.40
Pn <- diag(2)
for (k in 1:40) Pn <- Pn %*% P
round(Pn, 4)                       # every row is close to pi
##      [,1] [,2]
## [1,]  0.8  0.2
## [2,]  0.8  0.2
sum(c(0.8, 0.2) * c(200, -50))
## [1] 150
```
:::
::::

:::note[Pattern at work]
Steps 1, 3 and 5. For two states one equation and the sum settle $\pi$. The long-run mean is an expected value
under $\pi$.
:::

::::exercise[Three states, and three routes to the long run]
A walker moves between three rooms in a row. From an end room, it stays with probability 0.5 and moves to the
middle otherwise. From the middle, it stays with probability 0.5 and moves to each end with probability 0.25.
(a) Write $P$ and find $\pi$ by hand. (b) Write a function for a path and estimate $\pi$ by simulation. (c) Check
it with `eigen()`. (d) What is the difference between `P^2` and `P %*% P`?

:::solution
(a) $P=\begin{pmatrix}0.5&0.5&0\\0.25&0.5&0.25\\0&0.5&0.5\end{pmatrix}$. By symmetry $\pi_1=\pi_3$. The first
column of $\pi P=\pi$ gives $0.5\pi_1+0.25\pi_2=\pi_1$, so $\pi_2=2\pi_1$. The total $4\pi_1=1$ gives
$\pi=(0.25,0.5,0.25)$.

```r
P <- matrix(c(0.50, 0.50, 0.00,
              0.25, 0.50, 0.25,
              0.00, 0.50, 0.50), nrow = 3, byrow = TRUE)
rowSums(P)
## [1] 1 1 1
walk <- function(P, start, steps) {
  path <- numeric(steps + 1)                   # storage first
  path[1] <- start
  for (t in 1:steps) {
    path[t + 1] <- sample(1:nrow(P), 1, prob = P[path[t], ])
  }
  path
}
set.seed(174)
path <- walk(P, 1, 50000)
round(table(path) / length(path), 3)           # exact: 0.25, 0.50, 0.25
## path
##     1     2     3
## 0.252 0.498 0.250
e <- eigen(t(P))
round(e$values, 4)
## [1] 1.0 0.5 0.0
v <- e$vectors[, 1]
round(v / sum(v), 4)
## [1] 0.25 0.50 0.25
P^2                                            # each entry squared
##        [,1] [,2]   [,3]
## [1,] 0.2500 0.25 0.0000
## [2,] 0.0625 0.25 0.0625
## [3,] 0.0000 0.25 0.2500
P %*% P                                        # the two-step probabilities
##       [,1] [,2]  [,3]
## [1,] 0.375  0.5 0.125
## [2,] 0.250  0.5 0.250
## [3,] 0.125  0.5 0.375
```

(d) `P^2` squares each entry, and its rows no longer sum to 1, so it is not a transition matrix. `P %*% P` is the
matrix product.
:::
::::

:::note[Pattern at work]
Steps 2, 5 and 6 agree, which is the point: the simulation, the algebra and the eigenvector are three routes to
the same $\pi$. The Markov map draws them side by side.
:::
