---
title: Normal approximations
order: 14
asks: a binomial or Poisson probability by the normal, with the continuity correction
units: [continuous-distributions]
method: exact-or-normal-approximation
---

## Logic

A binomial with large $n$ is a sum of many independent pieces, so it looks normal, and a Poisson with large $\lambda$
does too. Use the normal with the **same mean and variance**. A count takes only integer values, so the value $k$ owns
the strip from $k-\frac12$ to $k+\frac12$, and the question must be turned into strips before standardising.

## Pattern

:::steps[Check, correct, standardise]
1. Check the condition: binomial, $n\theta$ and $n(1-\theta)$ both above 5 (a common rule); Poisson, large $\lambda$.
2. Moments: binomial $\mu=n\theta$, $\sigma=\sqrt{n\theta(1-\theta)}$; Poisson $\mu=\lambda$, $\sigma=\sqrt\lambda$.
3. Continuity correction: use the table below to rewrite the event with half-integers.
4. Standardise and read $\Phi$.
5. Say that the answer is approximate.
:::

| The count | Becomes |
|---|---|
| $X\le k$ | $X<k+\frac12$ |
| $X<k$ | $X<k-\frac12$ |
| $X\ge k$ | $X>k-\frac12$ |
| $X>k$ | $X>k+\frac12$ |
| $X=k$ | $k-\frac12<X<k+\frac12$ |
| $a\le X\le b$ | $a-\frac12<X<b+\frac12$ |

## Traps

:::caution[Traps]
- $X<k$ and $X\le k$ are different events for a count, so they get different corrections.
- $\sigma$ is the root of the variance: $\sqrt{n\theta(1-\theta)}$, not $n\theta(1-\theta)$.
- $n$ large with $\theta$ near 0 fails the condition: that is the Poisson's case, not the normal's.
- A continuous $X$ gets no correction: no half-integers for a normal, an exponential or a gamma.
- Far out in a tail, or with a skewed count, the approximation can be off by a large share of a small number.
:::

## Worked problems

::::exercise[Two hundred trials]
$X$ is binomial with $n=200$, $\theta=0.3$. Approximate (a) $P(X\ge70)$; (b) $P(55\le X\le65)$; (c) $P(X=60)$. Use
$\Phi(0.077)=0.5307$, $\Phi(0.85)=0.8023$, $\Phi(1.47)=0.9292$.

:::solution
$n\theta=60$ and $n(1-\theta)=140$, so the condition holds. $\mu=60$ and $\sigma=\sqrt{42}\approx6.48$.

(a) $P(X>69.5)$: $z=\frac{9.5}{6.48}\approx1.47$, so $P\approx1-0.9292=0.0708$. The exact value is $0.0728$.

(b) $P(54.5<X<65.5)$: $z=\pm\frac{5.5}{6.48}\approx\pm0.85$, so $P\approx2(0.8023)-1=0.6046$. The exact value is $0.6039$.

(c) $P(59.5<X<60.5)$: $z=\pm\frac{0.5}{6.48}\approx\pm0.077$, so $P\approx2(0.5307)-1=0.0614$. The exact value is $0.0615$.
:::
::::

:::note[Pattern at work]
Steps 1–4 with three rows of the table. Part (c) shows why the correction exists: without it, $P(X=60)$ would be 0.
:::

::::exercise[A large Poisson]
$X$ is Poisson with $\lambda=36$. Approximate $P(30\le X<40)$. Use $\Phi(0.58)=0.7190$, $\Phi(1.08)=0.8599$.

:::solution
$\mu=36$ and $\sigma=6$. "From 30, and below 40" is $29.5<X<39.5$: $z=\frac{-6.5}6\approx-1.08$ and
$z=\frac{3.5}6\approx0.58$.

$P\approx\Phi(0.58)-\Phi(-1.08)=0.7190-(1-0.8599)=0.5789$. The exact value is $0.5884$.
:::
::::

:::note[Pattern at work]
The two ends get different corrections: $X\ge30$ starts at 29.5, and $X<40$ stops at 39.5, since 40 is excluded. The
Poisson's $\sigma$ is $\sqrt\lambda$.
:::

::::exercise[Overbooking]
A flight has 100 seats and sells 105 tickets. Each passenger shows up with probability 0.9, independently. Approximate
the probability that someone is left without a seat. Use $\Phi(1.95)=0.9744$.

:::solution
$X$ = the number who show up, binomial with $n=105$, $\theta=0.9$. $n\theta=94.5$ and $n(1-\theta)=10.5$, so the
condition holds. $\sigma=\sqrt{9.45}\approx3.07$.

"Someone is left out" is $X\ge101$, which becomes $X>100.5$: $z=\frac{6}{3.07}\approx1.95$, so
$P\approx1-0.9744=0.0256$. The exact value is about $0.0167$.
:::
::::

:::note[Pattern at work]
The whole pattern, starting from words. The rule of step 1 is met, yet the estimate is half as large again as the
truth: $\theta=0.9$ makes the count skewed and this is its far tail, which is the last trap. Say "approximately", and
compute exactly when you can.
:::
