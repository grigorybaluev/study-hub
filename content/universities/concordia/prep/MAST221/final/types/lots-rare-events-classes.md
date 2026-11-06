---
title: Finite lots, rare events, several classes
order: 11
asks: hypergeometric, Poisson and its binomial limit, multinomial; which one is it, then compute
units: [discrete-distributions]
---

## Logic

Three situations that break the plain binomial. Drawing **without replacement** breaks independence: the
hypergeometric. Trials that are very many and very rare leave only the mean $\lambda$ to know: the Poisson.
Trials with **more than two outcomes** need the multinomial.

## Pattern

:::steps[Which break?]
1. Without replacement from $N$ items, $M$ of them successes, $n$ drawn:
   $h(x;n,N,M)=\frac{\binom Mx\binom{N-M}{n-x}}{\binom Nn}$, with $\mu=\frac{nM}N$ and
   $\sigma^2=\frac{nM(N-M)(N-n)}{N^2(N-1)}$.
2. A count of random events in a stretch of time or space: $p(x;\lambda)=\frac{\lambda^xe^{-\lambda}}{x!}$, with
   $\mu=\sigma^2=\lambda$. Scale $\lambda$ to the stretch asked about.
3. A binomial with $n$ large and $\theta$ small: use the Poisson with $\lambda=n\theta$.
4. A hypergeometric with $n$ a small part of $N$ (a common rule: $n\le N/20$): use the binomial with
   $\theta=\frac MN$.
5. $k$ classes: $\frac{n!}{x_1!\cdots x_k!}\theta_1^{x_1}\cdots\theta_k^{x_k}$ with $\sum x_i=n$. Each $X_i$ alone is
   binomial($n,\theta_i$), and $\operatorname{cov}(X_i,X_j)=-n\theta_i\theta_j$.
:::

## Traps

:::caution[Traps]
- The hypergeometric has the same mean as the binomial with $\theta=\frac MN$, and a smaller variance, by the factor
  $\frac{N-n}{N-1}$.
- A Poisson rate must match the stretch: 0.3 per page means $\lambda=1.5$ for 5 pages.
- The Poisson has no upper limit on $x$, so "at least" questions go through the complement.
- Multinomial classes must cover everything: add an "other" class if the question leaves one out, and the $x_i$ must
  total $n$.
- Multinomial counts are dependent, since they total $n$. The covariance is negative.
:::

## Worked problems

::::exercise[A small lot]
A lot of 12 chips holds 5 faulty ones. A sample of 4 is drawn without replacement. Find the probability of exactly 2
faulty chips, and the mean and variance of the number of faulty chips. Compare with the binomial.

:::solution
$h(2;4,12,5)=\frac{\binom52\binom72}{\binom{12}4}=\frac{10\cdot21}{495}=\frac{14}{33}\approx0.424$.

$\mu=\frac{4\cdot5}{12}=\frac53$ and $\sigma^2=\frac{4\cdot5\cdot7\cdot8}{144\cdot11}=\frac{70}{99}\approx0.707$.

The binomial with $\theta=\frac5{12}$ gives $\binom42\left(\frac5{12}\right)^2\left(\frac7{12}\right)^2\approx0.354$, the
same mean, and variance $\frac{35}{36}\approx0.972$.
:::
::::

:::note[Pattern at work]
Step 1. The sample is a third of the lot, so step 4 does not apply, and the binomial is well off. The variance ratio
is $\frac{70/99}{35/36}=\frac8{11}=\frac{N-n}{N-1}$, as the first trap says.
:::

::::exercise[Rare events]
(a) A text has 0.3 misprints per page on average, as a Poisson count. Find the probability of at least 2 misprints in
5 pages, and in 10 pages. (b) In a batch of 500 items each is faulty with probability 0.004, independently. Estimate
the probability of at most 1 faulty item.

:::solution
(a) In 5 pages $\lambda=1.5$: $1-p(0)-p(1)=1-2.5e^{-1.5}\approx0.442$. In 10 pages $\lambda=3$:
$1-4e^{-3}\approx0.801$.

(b) $\lambda=500(0.004)=2$: $P(X\le1)\approx e^{-2}(1+2)=3e^{-2}\approx0.406$. The exact binomial value is $0.4055$.
:::
::::

:::note[Pattern at work]
(a) is step 2: $\lambda$ scales with the stretch, and the complement has only two terms. (b) is step 3: the exact sum
would need powers of 0.996, and the limit needs only $\lambda$.
:::

::::exercise[Three classes]
Each of 8 customers independently picks plan A, B or C with probabilities 0.5, 0.3, 0.2. Let $X_1,X_2,X_3$ be the
counts. Find $P(X_1=4,X_2=3,X_3=1)$, $\operatorname{cov}(X_1,X_2)$ and $\operatorname{Var}(X_1+X_2)$.

:::solution
$\frac{8!}{4!\,3!\,1!}(0.5)^4(0.3)^3(0.2)=280(0.0625)(0.027)(0.2)=0.0945$.

$\operatorname{cov}(X_1,X_2)=-8(0.5)(0.3)=-1.2$.

$\operatorname{Var}(X_1+X_2)=8(0.5)(0.5)+8(0.3)(0.7)+2(-1.2)=2+1.68-2.4=1.28$.

Check: $X_1+X_2=8-X_3$, so the variance is $\operatorname{Var}(X_3)=8(0.2)(0.8)=1.28$.
:::
::::

:::note[Pattern at work]
Step 5, then type 8. The negative covariance makes $X_1+X_2$ less variable than two independent counts would be, and
the check confirms it through the third class.
:::
