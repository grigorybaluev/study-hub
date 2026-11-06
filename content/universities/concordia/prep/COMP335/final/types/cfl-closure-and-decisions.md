---
title: Closure and decisions for context-free languages
order: 10
asks: closure and non-closure, intersection with a regular language, emptiness and finiteness
units: [cfl-properties]
---

## Logic

Grammars can put pieces side by side, so the context-free languages are closed under union, concatenation, star, reversal and homomorphism. Two conditions on one string
would take two stacks, so they are not closed under intersection or complement. The exception is a regular condition: a DFA needs no stack, so intersection with a regular
language is safe.

## Pattern

:::steps[Closure and decision questions]
1. To show $L$ context-free, write it with known pieces and name each closure property; a regular condition on a context-free language counts.
2. To show $L$ not context-free, intersect it with a regular $R$ to reach a known language such as $a^nb^nc^n$.
3. To answer "is the class closed under this?", look for a counterexample: the pair $\{a^nb^nc^k\}$, $\{a^kb^nc^n\}$ settles intersection.
4. Emptiness: run the generating test; $L$ is empty when $S$ is not generating.
5. Finiteness: clean the grammar, draw the dependency graph, and look for a cycle.
:::

## Traps

:::caution[Traps]
- Regular is closed under $\cap$ and complement; context-free is not; deterministic context-free is closed under complement, but not under $\cap$ or $\cup$.
- Closure goes one way: $L_1 \cap L_2$ not being context-free says nothing against $L_1$ and $L_2$.
- A subset or a superset of a context-free language can be anything: $a^nb^nc^n \subseteq \Sigma^*$.
- Finiteness needs a clean grammar first: a cycle through a useless variable proves nothing.
- $L_1 = L_2$ and $L = \Sigma^*$ are **undecidable** for grammars, not just hard.
:::

## Worked problems

::::exercise[Closure and decisions]
(a) Show that $\{a^n b^n : n \text{ is not a multiple of } 3\}$ is context-free. (b) Show that $L = \{w \in \{a, b\}^* : w$ has as many $a$'s as $b$'s, and its length is a multiple of $4\}$ is context-free.
(c) Decide emptiness and finiteness for $S \to aA \mid bB$, $\;A \to aB \mid b$, $\;B \to c \mid cS$.

:::solution
(a) It is $\{a^n b^n\} \cap R$, where $R$ is the set of strings whose length is not a multiple of $3$. Since $2n$ is a multiple of $3$ exactly when $n$ is, this picks out the right strings. $R$ is regular, so the
intersection is context-free.

(b) The first condition gives a context-free language, the second a regular one, and $L$ is the intersection.

(c) $B$ is generating (rule $B \to c$), then $A$, then $S$: the language is not empty. The grammar is clean, and the dependency graph has the cycle $S \to B \to S$, so the
language is infinite: $S \Rightarrow bB \Rightarrow bcS$ repeats.
:::
::::

:::note[Pattern at work]
Step 1 is why (a) needs no machine: the regular condition is handled by the closure property, and that is a complete proof.
:::

## Drill

::::exercise[True or false]
(a) The union of two context-free languages is context-free. (b) The complement of a context-free language is never context-free. (c) If $L$ is context-free and $R$ is regular, $L - R$ is context-free.
(d) If $L$ is context-free and $R$ is regular, $R - L$ is context-free. (e) Every subset of a regular language is context-free. (f) The intersection of two deterministic context-free languages is context-free.

:::solution
(a) True. (b) False: the complement of a regular language is regular, hence context-free. (c) True: $L - R = L \cap \overline{R}$, and $\overline{R}$ is regular. (d) False in general: with $R = \Sigma^*$ this would
be the complement of $L$. (e) False: $\{a^n b^n c^n\}$ is a subset of $L(a^*b^*c^*)$. (f) False: $\{a^n b^n c^k\}$ and $\{a^k b^n c^n\}$ are both deterministic.
:::
::::
