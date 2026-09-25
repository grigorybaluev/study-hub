---
title: Recursive definitions
order: 9
status: detailed
introduces:
  - {concept: recursion, perspective: "recursively defined functions, sequences and sets; Fibonacci; properties proved by induction"}
requires:
  - {concept: mathematical-induction, strength: hard}
  - {concept: function, strength: hard}
reinforces: []
---

Defining a function, a sequence or a set by base cases plus a rule that refers to smaller
instances — and proving facts about such definitions by induction.

## Recursive definitions of functions

When no closed formula for $f(n)$ is at hand, define it in two parts.

:::definition[Recursive definition]
A definition of $f$ is **recursive** (also **inductive**) when it gives (1) explicit values for
small $n$, and (2) for every other $n$, $f(n)$ in terms of $f(m)$ for smaller $m$.
:::

Any function can be given recursively: $\text{fac}(0) = 1$, $\text{fac}(n) = n \cdot \text{fac}(n-1)$;
$\text{add}(m, 0) = m$, $\text{add}(m, n) = 1 + \text{add}(m, n-1)$.

::::example[Rabbits]
A pair of rabbits at least two months old produces a new pair every month. Starting from one
newborn pair, how many pairs are there after $n$ months?

:::solution
$$
f(0) = 0 \qquad f(1) = 1 \qquad f(n) = f(n-1) + f(n-2) \ \text{ for } n \ge 2 :
$$

every pair alive last month is still alive, and every pair alive two months ago has bred. The
values $0, 1, 1, 2, 3, 5, 8, 13, 21, \dots$ are the **Fibonacci sequence**.
:::
::::

## Recursively defined sets

Sets are defined the same way: a base clause and a closure clause.

:::definition[Well-formed formulae]
The well-formed formulae (wff) of propositional logic: (1) $T$, $F$ and variables
$p, q, r, \dots$ are wff; (2) if $a$ and $b$ are wff then $(\lnot a)$, $(a \lor b)$,
$(a \land b)$, $(a \to b)$, $(a \leftrightarrow b)$ are wff. Nothing else is.
:::

This is what a parser checks. Recursion is central to software: recursive components are
concise and easy to verify, and induction is the natural tool to prove them correct — the
base cases match the basis step, the recursive rule matches the inductive step.

## Proving properties of recursive definitions

::::example[A sequence of multiples of 4]
Let $b_1 = 4$, $b_2 = 12$ and $b_k = b_{k-1} + b_{k-2}$ for $k \ge 3$. Prove $4 \mid b_n$ for all
$n \ge 1$.

:::solution
Basis: $4 \mid 4$ and $4 \mid 12$. Strong inductive step: if $4$ divides $b_{n-1}$ and $b_{n-2}$,
it divides their sum $b_n$.
:::
::::

::::example[Cassini's identity]
Prove $f_{n+1} f_{n-1} - f_n^2 = (-1)^n$ for the Fibonacci numbers, $n \ge 1$.

:::solution
Basis $n = 1$: $f_2 f_0 - f_1^2 = 1 \cdot 0 - 1 = -1$. Step: assume it for $n$. Using
$f_{n+2} = f_{n+1} + f_n$,

$$
f_{n+2} f_n - f_{n+1}^2 = f_{n+1} f_n + f_n^2 - f_{n+1}^2 = f_n^2 - f_{n+1}(f_{n+1} - f_n) = f_n^2 - f_{n+1} f_{n-1},
$$

since $f_{n+1} - f_n = f_{n-1}$. That is $-(f_{n+1} f_{n-1} - f_n^2) = -(-1)^n = (-1)^{n+1}$.
:::
::::

:::insight
A recursive definition and an inductive proof are the same structure
seen from two sides: base cases and a step. Whenever something is defined recursively,
its properties are proved by (usually strong) induction on the same parameter.
:::
