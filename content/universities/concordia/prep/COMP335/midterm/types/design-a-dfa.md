---
title: Designing a DFA
order: 2
asks: substrings, counting mod k, "A or B but not both", finite sets
units: [finite-automata]
method: description-to-minimal-dfa
---

## Logic

A state is a memory. Ask "what do I need to know about the prefix read so far to decide the rest?"
Each distinct answer is a state. Substring patterns: remember how much of the pattern you have just
seen (the longest suffix that is a prefix of the pattern). Counts: remember the count mod $k$.
Combinations of conditions: remember the pair.

## Pattern

:::steps[Design a DFA]
1. Write the meaning of each state in words before drawing it.
2. Draw one move per state and symbol. If a move means "the string can never be accepted now", send
   it to a trap.
3. Final states = the meanings that satisfy the condition.
4. "$A$ or $B$ but not both", "$A$ and not $B$": either think about the shape of the strings
   directly, or build the product of the two DFAs and choose the final pairs.
5. Test: $\lambda$, the shortest accepted string, and one near miss.
:::

## Traps

:::caution[Traps]
- A missing move means the DFA is incomplete. On a test, draw the trap state or say "all missing
  moves go to a trap".
- Substring DFA, on a mismatch: don't go back to the start blindly. Reading $a$ after $a$ still
  counts as having seen the first letter of $ab$.
- Is $\lambda$ in $L$? Then the start state is final.
- "Contains $x$" stays accepted forever (a final state with self-loops); "ends with $x$" can leave
  the final state.
:::

## Worked problems

::::exercise[Two quick designs]
Over $\{a,b\}$: (a) strings ending in $ab$; (b) strings with $(2n_a(w) + n_b(w)) \bmod 3 = 1$.

:::solution
(a) Remember how much of $ab$ was just read: $q_0$ none, $q_1$ "the last symbol was $a$", $q_2$ "the
last two symbols were $ab$" (final).

```automaton
type: dfa
states: q0 60 120, q1 210 120, q2 360 120
start: q0
finals: q2
trans: q0 b q0; q0 a q1; q1 a q1; q1 b q2; q2 a q1; q2 b q0
curves: {"q2|q0": -95}
```

(b) Remember the value mod 3: state $i$ means $(2n_a + n_b) \bmod 3 = i$. An $a$ adds 2, a $b$ adds
1. Start in 0 ($\lambda$ gives 0); the final state is 1.

| State | $a$ (+2) | $b$ (+1) |
|---|---|---|
| → 0 | 2 | 1 |
| ∗ 1 | 0 | 2 |
| 2 | 1 | 0 |

Checks for (a): $ab$, $bab$ and $aab$ are accepted; $aba$ and $\lambda$ are not. For (b): $b$ gives
1, accepted; $aa$ gives $4 \bmod 3 = 1$, accepted; $a$ gives 2, rejected.
:::
::::

:::note[Pattern at work]
Step 1 named the memory: "progress through $ab$" and "a value mod 3". The mismatch trap in (a): on
$a$ from $q_1$, stay in $q_1$, because that new $a$ may start $ab$.
:::

::::exercise[One but not both]
Give a DFA over $\{a,b\}$ for $L = \{w : w$ contains $ab$ or $ba$, but not both$\}$.

:::solution
Think about the shape. Containing $ab$ but not $ba$ means that once a $b$ appears no $a$ may follow,
and the string must start with $a$: $w\in a^+b^+$. Symmetrically, containing $ba$ but not $ab$ means
$w\in b^+a^+$. So $L = a^+b^+\cup b^+a^+$: exactly two runs.

```automaton
type: dfa
states: s 50 140, A1 170 70, A2 300 70, B1 170 210, B2 300 210, D 430 140
start: s
finals: A2, B2
trans: s a A1; s b B1; A1 a A1; A1 b A2; A2 b A2; A2 a D; B1 b B1; B1 a B2; B2 a B2; B2 b D; D a,b D
```

Meanings: A1 "in the first run, of $a$'s"; A2 "in the second run, of $b$'s" (final); B1 and B2 the
same with the letters swapped; D a third run started (trap). Checks: $ab$, $aabbb$ and $ba$ are
accepted; $aba$, $a$ and $\lambda$ are not.
:::
::::

:::note[Pattern at work]
Step 4: instead of a 9-state product, describing the strings directly gave 6 states. A product DFA
would also be correct; minimising it would give the same machine.
:::
