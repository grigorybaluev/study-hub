---
title: Monte Carlo estimates and their error
order: 5
asks: an expected value or a probability as an average, the standard error, a 95 % interval, how many draws
units: [monte-carlo-pseudorandom]
---

## Logic

An expected value is estimated by a sample mean, and a probability is the expected value of an indicator, so it
is estimated by a proportion. The law of large numbers says the estimate settles on the truth. The central limit
theorem gives its accuracy: the standard error is $s/\sqrt n$, so four times the draws halve the error.

## Pattern

:::steps[Estimate, error, interval]
1. Say what is estimated: $\mu=E(X)$, or $P(A)=E(1_A)$.
2. Generate $n$ independent copies in one vector expression.
3. Estimate: `mean(x)` for $E(X)$, `mean(x > a)` for $P(X>a)$.
4. Standard error: `sd(x) / sqrt(n)`. For a proportion $\hat p$, `sd()` of the logical vector gives $\sqrt{\hat p(1-\hat p)}$ up to a factor that is essentially 1.
5. 95 % interval: `mean(x) + c(-1.96, 1.96) * sd(x) / sqrt(n)`.
6. How many draws: for a half-width $w$, solve $1.96\,s/\sqrt n=w$, so $n=(1.96\,s/w)^2$, rounded up. For a proportion with no pilot, use $s=\tfrac12$, the worst case.
:::

## Traps

:::caution[Traps]
- $s/\sqrt n$ is the error of the estimate. $s$ alone is the spread of the single draws, and it does not shrink with $n$.
- The error falls like $1/\sqrt n$, not $1/n$: one more correct digit costs 100 times the draws.
- `max()` of two vectors is one number. For $\max(U_1,U_2)$ on many pairs, use `pmax()`; for the minimum, `pmin()`.
- `var(U1 + U2)` needs the two vectors to be independent draws. `U1 + U1` is $2U_1$, with variance 4 times, not 2 times.
- An interval says how far off the estimate is likely to be; it does not replace a check against an exact value when one is available.
:::

## Worked problems

::::exercise[The smaller of two uniforms]
Let $X=\min(U_1,U_2)$ for independent uniforms on $(0,1)$. (a) Find $E(X)$ and $\operatorname{Var}(X)$ exactly.
(b) Estimate $E(X)$ with a standard error and a 95 % interval, from $n=10\,000$ draws. (c) Estimate
$P(U_1U_2<0.5)$, whose exact value is $\tfrac12+\tfrac12\ln2$, with its standard error.

:::solution
(a) $P(X>x)=(1-x)^2$, so the density is $2(1-x)$ on $(0,1)$. Then $E(X)=\frac13$, $E(X^2)=\frac16$, and
$\operatorname{Var}(X)=\frac16-\frac19=\frac1{18}$. So the standard error should be near
$\sqrt{1/18}/100\approx0.00236$.

```r
set.seed(74)
n <- 10000
U1 <- runif(n)
U2 <- runif(n)
X <- pmin(U1, U2)
mean(X)                                # exact: 1/3
## [1] 0.3315304
sd(X) / sqrt(n)                        # compare with 0.00236
## [1] 0.00236695
mean(X) + c(-1.96, 1.96) * sd(X) / sqrt(n)
## [1] 0.3268912 0.3361696
hit <- U1 * U2 < 0.5
mean(hit)                              # exact: 0.8466
## [1] 0.8432
sd(hit) / sqrt(n)                      # sqrt(p (1 - p) / n), about 0.0036
## [1] 0.003636303
0.5 + 0.5 * log(2)
## [1] 0.8465736
```
:::
::::

:::note[Pattern at work]
Steps 1 to 5, with `pmin()` for the trap, and the exact value from a short distribution argument as the check.
(c) is the same recipe on an indicator: `mean()` and `sd()` work directly on a logical vector.
:::

::::exercise[How many draws?]
(a) A pilot run of 400 draws gives $s=2.4$. Find its standard error, and the number of draws for a 95 % half-width
of $0.05$. (b) By what factor must $n$ grow to cut the error by 3? (c) How many draws guarantee a half-width of
$0.01$ for a probability, whatever its value?

:::solution
(a) $2.4/\sqrt{400}=0.12$. Then $n=(1.96\times2.4/0.05)^2=94.08^2\approx8851.05$, so 8852 draws.

(b) By $3^2=9$, because the error falls like $1/\sqrt n$.

(c) The worst case is $p=\tfrac12$, where $s=\tfrac12$: $n=(1.96\times0.5/0.01)^2=98^2=9604$.

```r
2.4 / sqrt(400)
## [1] 0.12
ceiling((1.96 * 2.4 / 0.05)^2)
## [1] 8852
(1.96 * 0.5 / 0.01)^2
## [1] 9604
```
:::
::::

:::note[Pattern at work]
Step 6. Solve for $n$ and round **up**. The proportion needs no pilot, since $p(1-p)\le\tfrac14$.
:::
