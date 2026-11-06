---
title: Write a grammar
order: 2
asks: give a context-free grammar for a described language
units: [context-free-grammars]
---

## Logic

A context-free rule can add symbols on both sides of a variable at once, and that is how a grammar keeps two
parts in step. So work from the outside in: what does one step add on the outside, and what is left in the
middle? Independent parts get their own variables, and a union gets one start rule per case.

## Pattern

:::steps[A grammar from a description]
1. Split a union first: $S \to S_1 \mid S_2$. "Or", "$\ne$" and "more than" are all unions of simpler cases.
2. Split a sequence: $S \to AB$, where the parts do not depend on each other.
3. Matched parts: $S \to aSb$; for a ratio, $S \to aSbb$; for a mirror image, $S \to aSa \mid bSb$.
4. Choose the base case: $\lambda$, or what stands in the middle.
5. Test $\lambda$, the shortest strings, and one string that must be out.
:::

## Traps

:::caution[Traps]
- Which blocks are tied together? In $a^i b^{i + k} c^k$, the $b$'s split into two independent halves.
- $\{a^i b^j : i \ne j\}$ is two cases, and each needs at least one extra letter.
- A grammar that generates too much is wrong even if every string you need is there.
- Two tied counts must be **nested** or **adjacent**. If they cross, as in $a^i b^j c^i d^j$, no grammar exists.
:::

## Worked problems

::::exercise[Three grammars]
Give grammars for (a) $\{a^i b^j c^k : j = i + k\}$; (b) $\{a^i b^j c^k : i = j \text{ or } j \le k\}$;
(c) $\{w \in \{a, b\}^* : n_a(w) > n_b(w)\}$.

:::solution
(a) Split the $b$'s into the ones tied to the $a$'s and the ones tied to the $c$'s:
$$S \to AB, \qquad A \to aAb \mid \lambda, \qquad B \to bBc \mid \lambda .$$

(b) A union of two cases. In the second, each $b$ is paired with a $c$, and extra $c$'s can stand in the middle:
$$S \to XC \mid AY, \quad X \to aXb \mid \lambda, \quad C \to cC \mid \lambda, \quad A \to aA \mid \lambda, \quad Y \to bYc \mid C .$$

(c) Let $E$ generate the strings with equal counts. A string with a surplus of $a$'s is a balanced part, an $a$,
then either a balanced part or another string with a surplus:
$$S \to EaE \mid EaS, \qquad E \to aEbE \mid bEaE \mid \lambda .$$
:::
::::

:::note[Pattern at work]
In (a), step 2 looks wrong at first, since the $b$'s form one block. But the block has a place where the $a$
part stops and the $c$ part starts, and nothing else depends on it. In (b), step 1 does most of the work.
:::

## Drill

::::exercise[Five quick grammars]
Give grammars for (a) $\{a^{2n} b^n\}$; (b) $\{xcy : x, y \in \{a, b\}^*, |x| = |y|\}$;
(c) $\{a^i b^j c^k : i \ne k\}$; (d) $\{a^n b^m c^m d^n\}$; (e) $\{a^i b^j c^k : i = j \text{ or } i = k\}$.

:::solution
(a) $S \to aaSb \mid \lambda$.

(b) $S \to XSX \mid c$, $\;X \to a \mid b$: the letters are not tied, only the lengths.

(c) Peel $a \ldots c$ pairs, then at least one extra letter on one side:
$S \to aSc \mid P \mid Q$, $\;P \to aP \mid aB$, $\;Q \to Qc \mid Bc$, $\;B \to bB \mid \lambda$.

(d) Nested: $S \to aSd \mid T$, $\;T \to bTc \mid \lambda$.

(e) $S \to XC \mid Y$, $\;X \to aXb \mid \lambda$, $\;C \to cC \mid \lambda$, $\;Y \to aYc \mid B$, $\;B \to bB \mid \lambda$.
:::
::::
