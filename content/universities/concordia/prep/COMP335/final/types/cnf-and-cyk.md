---
title: Chomsky normal form and CYK
order: 5
asks: convert to CNF; fill a CYK table; decide membership
units: [cfg-normal-forms]
---

## Logic

In Chomsky normal form every rule is $A \to BC$ or $A \to a$, so every string splits into two shorter strings. CYK
tabulates exactly that: for each substring, the set of variables that derive it, from the shortest substrings
up. There is no search and no guessing, only a table.

## Pattern

:::steps[Convert, then fill the table]
1. Clean the grammar: $\lambda$-rules, then unit rules.
2. For each terminal in a right side of length 2 or more, add $T_a \to a$ and replace it.
3. Cut each right side longer than 2 with new variables $V_i$.
4. CYK, row 1: for each position, the variables with a rule to that letter.
5. Row of length $\ell$: for each start and each of the $\ell - 1$ splits, combine the left cell with the right cell through the rules $A \to BC$.
6. Accept if $S$ is in the last cell.
:::

## Traps

:::caution[Traps]
- $A \to aB$ and $A \to B$ are not in CNF; $A \to a$ needs no $T_a$.
- A string of length $n$ takes exactly $2n - 1$ steps in CNF, which makes a fast check.
- CYK needs CNF. Run it on anything else and the table means nothing.
- Try **every** split of a substring, not just the first that gives something.
- An empty cell is a result, and it stops many later combinations: write $\varnothing$.
- $w = \lambda$ is not a CYK question: ask whether $S$ is nullable.
:::

## Worked problems

::::exercise[Convert and test]
Let $G$: $S \to aSS \mid b$. (a) Convert it to Chomsky normal form. (b) Use CYK to decide whether $aabbb$ and $abab$ are in $L(G)$.

:::solution
(a) There are no $\lambda$- or unit rules. Terminals: $S \to T_a S S \mid b$, $\;T_a \to a$. Long rule:
$$S \to T_a V \mid b, \qquad V \to SS, \qquad T_a \to a .$$

(b) For $aabbb$, with a row per length and a column per start position:

| Length | $i = 1$ | $i = 2$ | $i = 3$ | $i = 4$ | $i = 5$ |
|---|---|---|---|---|---|
| 1 | $T_a$ | $T_a$ | $S$ | $S$ | $S$ |
| 2 | $\varnothing$ | $\varnothing$ | $V$ | $V$ | |
| 3 | $\varnothing$ | $S$ | $\varnothing$ | | |
| 4 | $\varnothing$ | $V$ | | | |
| 5 | $S$ | | | | |

For example $V_{24}$, for $abb$: the split $a \mid bb$ gives $T_a$ and $V$, so $S \to T_a V$ puts $S$ there. And $V_{25}$,
for $abbb$: the split $abb \mid b$ gives $S$ and $S$, so $V \to SS$ puts $V$ there. In the last cell, $T_a$ with $V$ gives
$S$, so $aabbb \in L(G)$.

For $abab$, row 1 is $T_a, S, T_a, S$. Row 2 is empty: no rule has right side $T_aS$ or $ST_a$. Then rows 3 and 4 are empty as
well, since every split uses an empty cell or a pair with no rule. So $abab \notin L(G)$.
:::
::::

:::note[Pattern at work]
Steps 2 and 3 took one line each. In (b), the empty cells are what make the table quick: a split with an empty side can be
skipped.
:::

## Drill

::::exercise[Quick checks]
(a) Is $S \to AB \mid a$, $\;A \to BB$, $\;B \to b$ in CNF? (b) How many steps does a CNF grammar need for a string of length 6? (c) In a table for a string of
length 5, how many cells are there? (d) A cell $V_{13}$ uses which pairs of cells?

:::solution
(a) Yes. (b) $2 \cdot 6 - 1 = 11$. (c) $5 + 4 + 3 + 2 + 1 = 15$. (d) $V_{11}$ with $V_{23}$, and $V_{12}$ with $V_{33}$.
:::
::::
