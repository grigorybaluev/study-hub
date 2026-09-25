---
title: Methods of proof
order: 4
status: detailed
introduces: [proof-techniques]
requires:
  - {concept: logical-inference, strength: hard}
  - {concept: propositional-logic, strength: hard}
  - {concept: predicate-logic, strength: soft}
reinforces: []
---

What a proof is, and the four basic shapes: direct, indirect (contrapositive), by
contradiction, and by cases.

## Why proofs, and what they are

Proofs are how mathematics establishes truth, but software has the same need: "the program
meets its specification", "the system cannot deadlock", "the output stays in range". The
slides list the Mars probe, Y2K and the Denver airport baggage system as expensive
consequences of not checking. Full formal proofs of large systems are impractical; proving
small critical components, and reasoning in the style of a proof about the rest, is not.

:::definition[Theorem, axiom, proof]
A **theorem** is a statement that can be proved true. An **axiom** is a
statement accepted as basically true (any proposition is true or false, not both). A
**proof** of $s$ is a finite sequence $s_1, \dots, s_n = s$ in which each step is an axiom,
a definition, an assumption of the theorem, a previously proved theorem, or derived from
earlier steps by a rule of inference.
:::

:::definition[Even and odd]
An integer $m$ is **even** iff $m = 2i$ for some integer $i$, and **odd** iff $m = 2i + 1$
for some integer $i$.
:::

## Direct proof

To prove $p \Rightarrow q$: assume $p$ and derive $q$ through a chain of inferences
$p \Rightarrow q_1 \Rightarrow \cdots \Rightarrow q$.

::::proposition[Squares of even numbers]
If $n$ is even then $n^2$ is even.

:::proof
Suppose $n = 2i$. Then $n^2 = 4i^2 = 2(2i^2)$, and $2i^2$ is an integer, so $n^2$ is even.
:::
::::

## Indirect proof (contrapositive)

Since $p \Rightarrow q \equiv \lnot q \Rightarrow \lnot p$, prove the contrapositive
directly instead.

::::proposition[Even squares come from even numbers]
If $n^2$ is even then $n$ is even.

:::proof
Contrapositive: if $n$ is odd then $n^2$ is odd. Suppose $n = 2i + 1$; then

$$
n^2 = 4i^2 + 4i + 1 = 2(2i^2 + 2i) + 1,
$$

which is odd.
:::
::::

An "if and only if" needs both directions: $p \Rightarrow q$ *and* $q \Rightarrow p$. The two
propositions together prove "$n$ is even $\iff n^2$ is even".

## Proof by contradiction

Uses the contradiction rule $(\lnot p \to F) \to p$.

- To prove $p$: assume $\lnot p$ and derive a contradiction.
- To prove $p \Rightarrow q$: assume $p \land \lnot q$ and derive a contradiction, because
  $(p \land \lnot q \to F) \equiv (p \to q)$.

::::theorem[The square root of 2]
$\sqrt 2$ is irrational.

:::proof
Suppose $\sqrt 2 = a/b$ with $a, b$ integers having no common factor. Then $2b^2 = a^2$, so
$a^2$ is even, so $a$ is even, $a = 2i$; then $2b^2 = 4i^2$, $b^2 = 2i^2$, so $b$ is even too —
a common factor $2$, contradiction.
:::
::::

::::proposition[An odd linear form]
If $3n + 2$ is odd then $n$ is odd.

:::proof
Assume $3n + 2$ odd and $n$ even, $n = 2k$. Then $3n + 2 = 6k + 2 = 2(3k + 1)$ is even —
contradicting the assumption.
:::
::::

## Proof by cases

To prove $C$ from $A_1 \lor \cdots \lor A_k$, prove $A_i \Rightarrow C$ for each $i$ (the
cases rule of inference).

::::proposition[Max plus min]
$\max(x, y) + \min(x, y) = x + y$ for all real $x, y$.

:::proof
Case $x \ge y$: the sum is $x + y$. Case $x < y$: the sum is $y + x$. Either way the
identity holds.
:::
::::

:::insight
Choosing the method is choosing which statement to *assume*: direct
assumes $p$; contrapositive assumes $\lnot q$; contradiction assumes $p \land \lnot q$ and
aims for anything false; cases assumes each alternative in turn. The chain of steps is
the same kind of object in all four — inference rules applied to definitions.
:::
