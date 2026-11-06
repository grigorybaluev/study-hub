---
title: Place the language
order: 14
asks: identify the smallest class of a language, across the whole course
units: [decidability, cfl-properties, pumping-lemma-regular]
---

## Logic

To identify the class of a language, ask what memory it needs, then prove both sides: that it belongs to the class, and that it does not belong to the next smaller class. Most traps come from a language that
looks harder than it is.

## Pattern

:::steps[Placing a language]
1. Simplify it first. Is it really a condition on counts, or does the definition fix them? Is it finite? Is it all of $\Sigma^*$?
2. Ask what must be remembered: a bounded amount (regular); pairs of counts in sequence or nested, in reverse order (context-free); no guess needed (deterministic); three tied counts, crossing pairs or a copy (decidable); the behaviour of a machine (above that).
3. Prove membership with a machine, a grammar, closure or an algorithm.
4. Prove exclusion from the next smaller class with a pumping lemma, closure, a reduction or a diagonal argument.
:::

## Traps

:::caution[Traps]
- Being in a class means being in every larger class: "$a^nb^n$ is decidable" is true.
- $\Sigma^*$ is regular and contains every language: size says nothing about complexity.
- Counting modulo $k$ needs no stack.
- $\{ww : |w| \le 5\}$ is finite, so regular.
- $\{a^n b^n\}$ over a one-letter alphabet is a different problem: $\{a^n a^n\}$ is $(aa)^*$.
- $\{xy : |x| = |y|\}$ is just the even-length strings: the condition has no content.
:::

## Worked problems

::::exercise[Looks can deceive]
Give the smallest class of the course that contains each language, and the reason. (a) $\{a^n a^n : n \ge 0\}$. (b) $\{xy : x, y \in \{a, b\}^*, |x| = |y|\}$. (c) $\{a^n b^m : n + m \text{ is even}\}$. (d) $\{w w^R w : w \in \{a, b\}^*\}$.
(e) $\{\langle M \rangle : M \text{ halts on } \lambda\}$.

:::solution
(a) Regular: it is $(aa)^*$.

(b) Regular: any string of even length can be cut in the middle, so this is $((a + b)(a + b))^*$.

(c) Regular: two bits of memory. The two counts are not compared, only their parity.

(d) Not context-free, but decidable: an algorithm can try every possible $|w|$. Pumping $a^m b^{2m} a^{2m} b^m$ breaks it, as the window cannot reach all three copies.

(e) Recursively enumerable and undecidable: it is the blank-tape halting problem. Simulate and wait for one side, and reduce from halting for the other.
:::
::::

:::note[Pattern at work]
Step 1 settled (a), (b) and (c) before any machine was drawn. An intimidating definition can hide a language this simple.
:::

## Drill

::::exercise[Ten languages]
For each, name the smallest class among regular, deterministic context-free, context-free, recursive, recursively enumerable, or "not recursively enumerable". (a) $\{a^n b^m : n \ne m\}$. (b) $\{wcw^R\}$. (c) $\{ww^R\}$.
(d) $\{a^n b^n c^n\}$. (e) $\{a^n b^n : n \le 10^6\}$. (f) $\{ww\}$. (g) $\{\langle G \rangle : L(G) \ne \varnothing\}$ for grammars $G$. (h) $\{\langle M \rangle w : M \text{ halts on } w\}$. (i) $\{\langle M \rangle w : M \text{ loops on } w\}$.
(j) The strings over $\{a, b\}$ containing $abba$.

:::solution
(a) Deterministic context-free: count, and accept if the counts differ at the end. (b) Deterministic context-free. (c) Context-free: the middle must be guessed. (d) Recursive. (e) Regular: finite. (f) Recursive.
(g) Recursive: the emptiness test is an algorithm. (h) Recursively enumerable. (i) Not recursively enumerable. (j) Regular.
:::
::::
