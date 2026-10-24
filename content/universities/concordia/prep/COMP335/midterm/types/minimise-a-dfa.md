---
title: Minimising a DFA
order: 4
asks: the mark procedure, unreachable states, describe the language
units: [finite-automata]
---

## Logic

Two states are equivalent when they have the same future: every continuation leads both to accept or
both to reject. The mark procedure finds the pairs that some string can tell apart, working
backwards from the empty string (final against non-final). What is never marked can be merged.

## Pattern

:::steps[The mark procedure]
1. Remove unreachable states (search from $q_0$).
2. Make the table of pairs; mark every (final, non-final) pair.
3. Repeat until nothing changes: for an unmarked pair $(p, q)$, if some symbol sends it to a marked
   pair (of different states), mark $(p, q)$.
4. Unmarked pairs are equivalent; group them into classes. Each class is one state of the minimal
   DFA.
5. Describe the language using the meanings of the classes.
:::

## Traps

:::caution[Traps]
- The DFA must be complete before you start: add the trap state.
- One pass is not enough. Repeat until a full pass marks nothing.
- An unreachable state can look "equivalent" to others. Delete it first.
- Pairs that move to the same state, or to the pair itself, give no information.
:::

## Worked problems

::::exercise[Seven states down to three]
Minimise the DFA over $\{a,b\}$ with start 0, $F = \{2, 5\}$ and moves 0: $a\to 1$, $b\to 3$;
1: $a\to 4$, $b\to 2$; 2: $a\to 4$, $b\to 3$; 3: $a\to 4$, $b\to 0$; 4: $a\to 1$, $b\to 5$;
5: $a\to 1$, $b\to 0$; 6: $a\to 2$, $b\to 6$. Describe the language.

:::solution
**Step 1.** Nothing moves into 6, so delete it.

**Step 2.** Mark every pair with exactly one of 2, 5 in it: (0, 2), (0, 5), (1, 2), (1, 5), (2, 3),
(2, 4), (3, 5), (4, 5).

**Step 3.** Check the unmarked pairs.

- (0, 1): on $b$ it goes to (3, 2), marked, so mark it. Likewise (0, 4) on $b$ goes to (3, 5);
  (1, 3) on $b$ to (2, 0); (3, 4) on $b$ to (0, 5). Mark all four.
- (0, 3): on $a$ to (1, 4), on $b$ to (3, 0). (1, 4): on $a$ to (4, 1), on $b$ to (2, 5).
  (2, 5): on $a$ to (4, 1), on $b$ to (3, 0).
- Second pass: these three pairs lead only to each other, so nothing new is marked.

Classes: $\{0, 3\}$, $\{1, 4\}$, $\{2, 5\}$. Their meanings are "no progress", "the last symbol was
$a$" and "the last two symbols were $ab$": $L$ = the strings ending in $ab$.

```automaton
type: dfa
states: 03 60 120, 14 210 120, 25 360 120
start: "03"
finals: "25"
trans: 03 b 03; 03 a 14; 14 a 14; 14 b 25; 25 a 14; 25 b 03
curves: {"25|03": -95}
```
:::
::::

:::note[Pattern at work]
Step 1 removed the state that would have confused the table. Step 3 needed a second pass to confirm
that the three remaining pairs are stable. Step 5 (meanings) turned the classes into a one-line
description, which is what "describe the language" questions want.
:::
