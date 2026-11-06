---
title: Grammars and PDAs, both ways
order: 8
asks: construct an NPDA from a grammar, and a grammar from an NPDA
units: [pushdown-automata, cfg-normal-forms]
---

## Logic

Both directions are recipes; see arrows 1, 3, 4 and 5 on the [context-free map](/prep/COMP335/final/map). Grammar to machine: the stack holds the part
of a sentential form that is still to be expanded. Machine to grammar: a variable $(q_iAq_j)$ means "from $q_i$ to $q_j$, with $A$ gone from the stack".

## Pattern

:::steps[Grammar to NPDA]
1. $q_0$: $\lambda, z \to Sz$ into $q_1$.
2. In $q_1$, one move $\lambda, A \to x$ for each rule $A \to x$.
3. In $q_1$, one move $a, a \to \lambda$ for each terminal.
4. $\lambda, z \to z$ from $q_1$ into the final state $q_2$.
:::

:::steps[NPDA to grammar]
1. Check the form: one final state $q_f$, entered with an empty stack, and every move pushes 0 or 2 symbols.
2. A pop move $(q_j, \lambda) \in \delta(q_i, a, A)$ gives $(q_iAq_j) \to a$.
3. A push move $(q_j, BC) \in \delta(q_i, a, A)$ gives $(q_iAq_k) \to a(q_jBq_l)(q_lCq_k)$ for all states $q_k$, $q_l$.
4. Start variable $(q_0zq_f)$. Remove the useless variables, and rename the rest.
:::

## Traps

:::caution[Traps]
- Grammar to NPDA: the right side is pushed with its leftmost symbol on top.
- A machine that pushes one symbol must be rewritten first.
- For a move with $a = \lambda$, the rule has no terminal.
- Counting: $|Q|^2$ rules for each push move.
- Do not read off a grammar by intuition if the question says "use the construction".
:::

## Worked problems

::::exercise[Both directions]
(a) Construct the NPDA for $S \to aSB \mid b$, $\;B \to c$, and trace $abc$. (b) Convert this NPDA to a grammar.

| From | Read | Pop | To | Push |
|---|---|---|---|---|
| $q_0$ | $a$ | $z$ | $q_1$ | $Az$ |
| $q_1$ | $a$ | $A$ | $q_1$ | $AA$ |
| $q_1$ | $b$ | $A$ | $q_1$ | $\lambda$ |
| $q_1$ | $\lambda$ | $z$ | $q_2$ | $\lambda$ |

:::solution
(a) The moves are $\lambda, z \to Sz$ from $q_0$ to $q_1$; then in $q_1$: $\lambda, S \to aSB$, $\;\lambda, S \to b$, $\;\lambda, B \to c$,
$\;a, a \to \lambda$, $\;b, b \to \lambda$, $\;c, c \to \lambda$; and $\lambda, z \to z$ from $q_1$ to $q_2$. The derivation
$S \Rightarrow aSB \Rightarrow abB \Rightarrow abc$ becomes
$$(q_0, abc, z) \vdash (q_1, abc, Sz) \vdash (q_1, abc, aSBz) \vdash (q_1, bc, SBz) \vdash (q_1, bc, bBz) \vdash (q_1, c, Bz) \vdash (q_1, c, cz) \vdash (q_1, \lambda, z) \vdash (q_2, \lambda, z).$$

This grammar is in Greibach normal form, so a shorter machine also works: in $q_1$, the moves $a, S \to SB$, $\;b, S \to \lambda$, $\;c, B \to \lambda$.

(b) The form is right: $q_2$ is final and entered with an empty stack, and the pushes have two symbols or none. There are two pop moves and two push moves, so $2 + 2 \cdot 9 = 20$ rules.
$$(q_1Aq_1) \to b, \qquad (q_1zq_2) \to \lambda,$$
$$(q_0zq_k) \to a\,(q_1Aq_l)(q_lzq_k), \qquad (q_1Aq_k) \to a\,(q_1Aq_l)(q_lAq_k) \quad\text{for all } q_k, q_l.$$

Only triples that can finish survive. These are $(q_1Aq_1)$, $(q_1zq_2)$ and the start $(q_0zq_2)$:
$$(q_0zq_2) \to a\,(q_1Aq_1)(q_1zq_2), \qquad (q_1Aq_1) \to a\,(q_1Aq_1)(q_1Aq_1) \mid b, \qquad (q_1zq_2) \to \lambda .$$

Renamed, with $(q_1zq_2)$ gone: $S \to aX$, $\;X \to aXX \mid b$. It generates $ab$, $aabb$, $aababb$, and so on.
:::
::::

:::note[Pattern at work]
In (b), the 20 rules are not all written down in a real answer. Write the general form, then keep only the variables that can finish and can be reached.
:::

## Drill

::::exercise[Counting]
(a) A grammar has 5 rules and 3 terminals. How many moves does the NPDA of the construction have? (b) An NPDA in the special form has 4 states, 3 pop moves and 2 push moves. How many rules does the construction
give? (c) What does $(q_2Aq_5) \Rightarrow^* w$ say about the machine?

:::solution
(a) $5 + 3 + 2 = 10$: one per rule, one per terminal, the start and the finish.

(b) $3 + 2 \cdot 4^2 = 35$.

(c) Reading $w$, the machine can go from $q_2$ to $q_5$ with the net effect of removing $A$ from the stack, leaving everything below it unchanged.
:::
::::
