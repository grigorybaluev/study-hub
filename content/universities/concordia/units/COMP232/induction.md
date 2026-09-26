---
title: Proof strategies and mathematical induction
order: 8
status: detailed
introduces: [mathematical-induction]
requires:
  - {concept: proof-techniques, strength: hard}
  - {concept: modular-arithmetic, strength: soft}
reinforces: []
---

How to choose a proof approach, two classic proofs by cases and contradiction, and
mathematical induction in its ordinary and strong forms.

## Choosing a strategy

There is no mechanical rule for which method to use, but there is a checklist.

:::steps[Looking for a proof]
1. Write the statement precisely.
2. Try forward (direct) reasoning.
3. Try the contrapositive.
4. Try backward reasoning: find a $q$ you *can* prove with $q \Rightarrow p$.
5. Look for natural cases.
6. Adapt a proof you have seen.
7. For a conjecture, look for a counter-example before a proof.
:::

::::proposition[Squares modulo 4]
The square of any integer has the form $4k$ or $4k + 1$.

:::proof
By cases. By the division algorithm $n = 4q + s$ with $s \in \{0, 1, 2, 3\}$. Squaring each case
gives $16q^2$, $16q^2 + 8q + 1$, $16q^2 + 16q + 4$ and $16q^2 + 24q + 9$ — of the form $4k$,
$4k+1$, $4k$ and $4k+1$ respectively.
:::
::::

::::theorem[Euclid]
There are infinitely many primes.

:::proof
By contradiction. Suppose not, and let $p_1, \dots, p_n$ be all of them. Then
$m = p_1 p_2 \cdots p_n + 1$ exceeds every prime, so it is composite and some $p_i$ divides it —
but $m \bmod p_i = 1$. Contradiction.
:::
::::

::::proposition[No prime triplets beyond 3, 5, 7]
No $n > 3$ makes $n$, $n + 2$ and $n + 4$ all prime.

:::proof
By contradiction. A prime $n > 3$ has $n \bmod 3 \in \{1, 2\}$. If it is $1$, then $3$ divides
$n + 2$; if it is $2$, then $3$ divides $n + 4$. Either number is larger than $3$, so it is not
prime.
:::
::::

## Mathematical induction

Induction is the proof technique for anything indexed by integers: program correctness by
the number of loop iterations, properties of strings by length, algorithm complexity,
theorems about graphs and trees.

:::steps[Proof by induction of P(n) for all n ≥ c]
1. **Basis step.** Show $P(c)$.
2. **Inductive step.** Show $P(n) \to P(n + 1)$ for every $n \ge c$: assume $P(n)$ (the
   inductive hypothesis) and derive $P(n + 1)$.
:::

::::example[A geometric sum]
Prove $1 + a + a^2 + \cdots + a^n = \dfrac{a^{n+1} - 1}{a - 1}$ for $a \ne 1$ and $n \ge 1$.

:::solution
Basis $n = 1$: $\frac{a^2 - 1}{a - 1} = a + 1$. Step: add $a^{n+1}$ to both sides of the
hypothesis:

$$
\frac{a^{n+1} - 1}{a - 1} + a^{n+1} = \frac{a^{n+1} - 1 + a^{n+2} - a^{n+1}}{a - 1} = \frac{a^{n+2} - 1}{a - 1} .
$$
:::
::::

::::example[A divisibility]
Prove $6 \mid n^3 - n$ for $n \ge 1$.

:::solution
Basis: $1^3 - 1 = 0$. Step:

$$
(n+1)^3 - (n+1) = (n^3 - n) + 3n(n + 1);
$$

the first term is divisible by $6$ by hypothesis, the second by $3$ and by $2$ (one of $n$,
$n+1$ is even).
:::
::::

::::example[An inequality]
Prove $2^n > n^2$ for $n > 4$.

:::solution
Basis $n = 5$: $32 > 25$. Step, using $n > 3$ and then the hypothesis:

$$
(n+1)^2 = n^2 + 2n + 1 < n^2 + 3n < n^2 + n^2 < 2^n + 2^n = 2^{n+1} .
$$
:::
::::

::::example[A bound on a sum]
Prove $\sum_{k=1}^{n} 1/k^2 < 2 - 1/n$ for $n > 1$.

:::solution
Basis $n = 2$: $1 + \frac14 < \frac32$. Step: add $1/(n+1)^2$ to both sides of the hypothesis;
it remains to check $2 - \frac1n + \frac{1}{(n+1)^2} < 2 - \frac{1}{n+1}$, which after clearing
denominators is $n(n+1) + n < (n+1)^2$, i.e. $n^2 + 2n < n^2 + 2n + 1$ — true.
:::
::::

## Strong induction

Sometimes $P(n + 1)$ does not follow from $P(n)$ alone but does follow from
$P(c) \land P(c + 1) \land \cdots \land P(n)$. **Strong (generalized) induction** allows exactly
that as the hypothesis; the basis step is unchanged.

::::theorem[Existence of prime factorisations]
Every integer $n \ge 2$ is a prime or a product of primes.

:::proof
By strong induction. Basis: $2$ is prime. Step: if $n + 1$ is not prime then $n + 1 = ab$
with $2 \le a, b \le n$; by the strong hypothesis each of $a, b$ is a prime or a product of
primes, hence so is $n + 1$.
:::
::::

::::theorem[Counting subsets]
An $n$-element set has $2^n$ subsets.

:::proof
Basis $n = 0$: the empty set has one subset. Step: write $T = S \cup \{a\}$ with $|S| = n$;
each subset $X$ of $S$ yields two subsets of $T$, $X$ and $X \cup \{a\}$, all distinct, and
every subset of $T$ arises this way — $2 \cdot 2^n$ in all.
:::
::::

:::caution
Write the hypothesis $P(n)$ and the goal $P(n+1)$ down explicitly before computing anything;
most failed induction proofs never state what they are trying to reach.
:::

:::insight
Induction proves an infinite family of statements with two finite pieces
of work; the inductive step is itself a direct proof of an implication, and strong
induction is the same idea with a larger hypothesis.
:::
