---
title: Proof strategies and mathematical induction
order: 8
status: detailed
notes: ["Lecture slides main3, pp. 1-21"]
introduces: [mathematical-induction]
requires:
  - {concept: proof-techniques, strength: hard}
  - {concept: modular-arithmetic, strength: soft}
reinforces: []
---

How to choose a proof approach, two classic proofs by cases and contradiction, and
mathematical induction in its ordinary and strong forms.

## Choosing a strategy

There is no mechanical rule for which method to use, but there is a checklist: write the
statement precisely; try forward (direct) reasoning; try the contrapositive; try backward
reasoning (find a $q$ you *can* prove with $q \Rightarrow p$); look for natural cases; adapt
a proof you have seen; and for a conjecture, look for a counter-example before a proof.

> **Example (cases).** The square of any integer has the form $4k$ or $4k + 1$. By the
> division algorithm $n = 4q + s$ with $s \in \{0, 1, 2, 3\}$; squaring each case gives
> $16q^2$, $16q^2 + 8q + 1$, $16q^2 + 16q + 4$, $16q^2 + 24q + 9$ — of the form $4k$, $4k+1$,
> $4k$, $4k+1$ respectively.

> **Example (contradiction).** There are infinitely many primes. Suppose not, and let
> $p_1, \dots, p_n$ be all of them. Then $m = p_1 p_2 \cdots p_n + 1$ exceeds every prime, so it
> is composite and some $p_i$ divides it — but $m \bmod p_i = 1$. Contradiction (Euclid).

> **Example (contradiction).** No $n > 3$ makes $n, n+2, n+4$ all prime: a prime $n > 3$ has
> $n \bmod 3 \in \{1, 2\}$, and then $3$ divides $n + 2$ or $n + 4$.

## Mathematical induction

To prove $P(n)$ for all integers $n \ge c$:

> **Steps.**
> 1. **Basis step.** Show $P(c)$.
> 2. **Inductive step.** Show $P(n) \to P(n + 1)$ for every $n \ge c$: assume $P(n)$ (the
>    inductive hypothesis) and derive $P(n + 1)$.

Induction is the proof technique for anything indexed by integers: program correctness by
the number of loop iterations, properties of strings by length, algorithm complexity,
theorems about graphs and trees.

> **Example.** $1 + a + a^2 + \cdots + a^n = \dfrac{a^{n+1} - 1}{a - 1}$ for $a \ne 1$, $n \ge 1$.
> Basis $n = 1$: $\frac{a^2 - 1}{a - 1} = a + 1$. Step: add $a^{n+1}$ to both sides of the
> hypothesis; $\frac{a^{n+1} - 1}{a - 1} + a^{n+1} = \frac{a^{n+2} - 1}{a - 1}$.

> **Example.** $6 \mid n^3 - n$ for $n \ge 1$. Basis: $0$. Step:
> $(n+1)^3 - (n+1) = (n^3 - n) + 3n(n + 1)$; the first term is divisible by $6$ by hypothesis,
> the second by $3$ and by $2$ (one of $n, n+1$ is even).

> **Example.** $2^n > n^2$ for $n > 4$. Basis $n = 5$: $32 > 25$. Step: $(n+1)^2 = n^2 + 2n + 1
> < n^2 + 3n < n^2 + n^2 < 2^n + 2^n = 2^{n+1}$, using $n > 3$.

> **Example.** $\sum_{k=1}^{n} 1/k^2 < 2 - 1/n$ for $n > 1$: the inductive step is an
> inequality between rational functions of $n$ after adding $1/(n+1)^2$ to both sides.

## Strong induction

Sometimes $P(n + 1)$ does not follow from $P(n)$ alone but does follow from
$P(c) \land P(c + 1) \land \cdots \land P(n)$. **Strong (generalized) induction** allows exactly
that as the hypothesis; the basis step is unchanged.

> **Example.** Every integer $n \ge 2$ is a prime or a product of primes. Basis: $2$. Step:
> if $n + 1$ is not prime then $n + 1 = ab$ with $2 \le a, b \le n$; by the strong hypothesis
> each of $a, b$ is a prime or a product of primes, hence so is $n + 1$.

> **Example.** An $n$-element set has $2^n$ subsets. Basis $n = 0$: one subset. Step: write
> $T = S \cup \{a\}$; each subset $X$ of $S$ yields two subsets of $T$, $X$ and $X \cup \{a\}$,
> all distinct — $2 \cdot 2^n$.

> **Key insight.** Induction proves an infinite family of statements with two finite pieces
> of work; the inductive step is itself a direct proof of an implication, and strong
> induction is the same idea with a larger hypothesis. Write the hypothesis and the goal
> $P(n+1)$ down explicitly before computing anything.
