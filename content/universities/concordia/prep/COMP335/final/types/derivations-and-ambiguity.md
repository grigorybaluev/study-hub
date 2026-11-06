---
title: Derivations, trees and ambiguity
order: 3
asks: leftmost and rightmost derivations, derivation trees, show or remove ambiguity, s-grammars
units: [context-free-grammars]
---

## Logic

A derivation is a sequence and a tree is a structure. Many derivations can share a tree, but a tree has exactly one
leftmost derivation. Ambiguity is therefore a statement about **trees**: one string with two of them. To remove it,
force one structure: one variable per level, and recursion on one side only.

## Pattern

:::steps[Showing ambiguity]
1. Find a string where a rule can be applied in two orders or at two levels: a repeated operator, two sides that can both grow.
2. Write two **leftmost** derivations that differ at some step, or draw two trees.
3. To repair: give each level its own variable, and let one side be recursive.
4. Check that the new grammar generates the same language, and that the string now has one tree.
:::

## Traps

:::caution[Traps]
- A leftmost and a rightmost derivation that differ prove nothing: they can have the same tree.
- "Ambiguous grammar" is not "inherently ambiguous language".
- The rounds of exhaustive search are bounded by $2|w|$ only with no $\lambda$-rules and no unit rules.
- There is no algorithm that decides whether a grammar is ambiguous, so a proof has to show a string.
:::

## Worked problems

::::exercise[A grammar with two sides]
Let $G$: $S \to aS \mid Sb \mid c$. (a) What is $L(G)$? (b) Show that $G$ is ambiguous. (c) Give an unambiguous
grammar for $L(G)$, and its leftmost derivation of $aacb$.

:::solution
(a) $L(G) = L(a^* c b^*)$: every step adds an $a$ on the left or a $b$ on the right.

(b) The string $acb$ has two leftmost derivations:
$$S \Rightarrow aS \Rightarrow aSb \Rightarrow acb, \qquad S \Rightarrow Sb \Rightarrow aSb \Rightarrow acb .$$
They give two trees: in the first the root uses $S \to aS$, in the second $S \to Sb$.

(c) Fix the order: all the $a$'s first, then all the $b$'s.
$$S \to aS \mid T, \qquad T \to Tb \mid c .$$
$$S \Rightarrow aS \Rightarrow aaS \Rightarrow aaT \Rightarrow aaTb \Rightarrow aacb$$
:::
::::

:::note[Pattern at work]
Step 1 found the place where two sides can both grow. Step 3 made one side finish first, by giving it its own
variable.
:::

## Drill

::::exercise[True or false]
(a) Two different derivations of a string prove that the grammar is ambiguous. (b) $S \to SS \mid a$ is ambiguous.
(c) $L(S \to SS \mid a)$ is inherently ambiguous. (d) In an s-grammar, every string has one leftmost derivation.
(e) The grammar $S \to AB$, $A \to a$, $B \to b$ is ambiguous, because $S \Rightarrow AB \Rightarrow aB \Rightarrow ab$
and $S \Rightarrow AB \Rightarrow Ab \Rightarrow ab$ differ.

:::solution
(a) False: the two can have the same tree.

(b) True: $aaa$ has two trees, split as $a \cdot aa$ and as $aa \cdot a$.

(c) False: the language is $a^+$, and $S \to aS \mid a$ is unambiguous.

(d) True: at each step the variable and the next input symbol leave at most one rule.

(e) False: one derivation is leftmost and the other rightmost, and the tree is the same. There is one tree.
:::
::::
