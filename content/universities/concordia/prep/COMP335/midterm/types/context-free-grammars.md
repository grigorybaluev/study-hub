---
title: Context-free grammars
order: 9
asks: write a grammar, derive a string, show ambiguity
units: [context-free-grammars]
---

## Logic

A context-free rule can put symbols on both sides of a variable at once. That is how it keeps two
parts in step ($a^n\ldots b^n$), which no finite automaton can do. Design by asking "what is added on
the outside at each step?"

## Pattern

:::steps[Grammars, derivations, ambiguity]
1. Matched counts: $S\to aSb\mid\lambda$, and scale it ($aSbb$ for $a^nb^{2n}$).
2. Mirror images: $S\to aSa\mid bSb\mid$ (the middle: $\lambda$, $a$, $b$).
3. Concatenation of independent parts: $S\to AB$ with a grammar for each part.
4. Derivation: write each sentential form; leftmost means always expand the leftmost variable.
5. Ambiguity: show two different trees (or two leftmost derivations) for one string.
:::

## Traps

:::caution[Traps]
- Check the base case: should $\lambda$ be generated?
- Two different derivations are not ambiguity if they give the same tree (only the order differs).
- A grammar can be ambiguous while the language also has an unambiguous grammar.
:::

## Worked problems

::::exercise[Grammars, derivations, ambiguity]
(a) Give grammars for $\{a^nb^{2n} : n\ge 0\}$ and for the palindromes over $\{a,b\}$. (b) Give a
leftmost derivation of $abba$ from the palindrome grammar. (c) Show that $E\to E+E\mid E*E\mid a$ is
ambiguous.

:::solution
(a) $S\to aSbb\mid\lambda$; $S\to aSa\mid bSb\mid a\mid b\mid\lambda$.

(b) $S\Rightarrow aSa\Rightarrow abSba\Rightarrow abba$ (the last step uses $S\to\lambda$).

(c) $a+a*a$ has two leftmost derivations:

- $E\Rightarrow E+E\Rightarrow a+E\Rightarrow a+E*E\Rightarrow a+a*E\Rightarrow a+a*a$ (the tree is
  $a+(a*a)$);
- $E\Rightarrow E*E\Rightarrow E+E*E\Rightarrow a+E*E\Rightarrow a+a*E\Rightarrow a+a*a$ (the tree is
  $(a+a)*a$).

Two different trees for one string, so the grammar is ambiguous.
:::
::::

:::note[Pattern at work]
Steps 1–2 give both grammars directly. For (c), the two derivations differ in the first rule used
($+$ against $*$ at the root), so the trees really are different.
:::
