---
title: NFAs and the subset construction
order: 3
asks: small NFAs, δ* with λ-moves, NFA → DFA
units: [finite-automata]
---

## Logic

An NFA may guess: "this $a$ is the start of the ending". That makes designs small. The subset
construction removes the guessing by tracking every state the NFA could be in. The DFA's state is
that set.

## Pattern

:::steps[Subset construction]
1. $\lambda$-closure first: $E(S)$ = all states reachable from $S$ by $\lambda$-moves alone
   (including $S$ itself).
2. Start state: $E(\{q_0\})$.
3. For each new set $S$ and symbol $a$: $E\big(\bigcup_{q\in S}\delta(q,a)\big)$. Write each result
   in a table; a new set becomes a new row.
4. Final: every set that contains an NFA final state.
5. $\varnothing$ is a legitimate state (the trap): include it if it appears.
:::

## Traps

:::caution[Traps]
- Forgetting the $\lambda$-closure after the move, or of the start state.
- An NFA accepts if *some* path accepts; a hanging path doesn't reject the string.
- $\delta^*(q, w)$ is a set. "Accepted" means it meets $F$.
- "An NFA with at most $k$ states" questions: use the guess (a branch) to save states. Don't build a
  DFA.
:::

## Worked problems

::::exercise[The second symbol from the end]
Give a 3-state NFA for $L = \{w\in\{a,b\}^* :$ the second symbol from the end is $a\}$, and convert
it to a DFA.

:::solution
The NFA guesses which $a$ is the second from the end: $q_0$ loops on everything,
$q_0\xrightarrow{a}q_1\xrightarrow{a,b}q_2$ (final).

```automaton
type: nfa
states: q0 60 100, q1 200 100, q2 340 100
start: q0
finals: q2
trans: q0 a,b q0; q0 a q1; q1 a,b q2
```

| DFA state | $a$ | $b$ |
|---|---|---|
| → $\{q_0\}$ | $\{q_0,q_1\}$ | $\{q_0\}$ |
| $\{q_0,q_1\}$ | $\{q_0,q_1,q_2\}$ | $\{q_0,q_2\}$ |
| ∗ $\{q_0,q_1,q_2\}$ | $\{q_0,q_1,q_2\}$ | $\{q_0,q_2\}$ |
| ∗ $\{q_0,q_2\}$ | $\{q_0,q_1\}$ | $\{q_0\}$ |

4 DFA states, and $\varnothing$ never appears because $q_0$ is always present. The four states mean
"the last two symbols were $bb$, $ba$, $aa$, $ab$", which is exactly what a DFA has to remember.
:::
::::

:::note[Pattern at work]
Steps 2–4 in one table. Reading the result back (each set = "the last two symbols") checks it. For
"the $k$-th symbol from the end" the DFA needs $2^k$ states: the classic case where an NFA is
exponentially smaller.
:::

::::exercise[With a λ-move]
NFA: $\delta(q_0, a) = \{q_0, q_1\}$, $\delta(q_1,\lambda) = \{q_2\}$, $\delta(q_2, b) = \{q_2\}$,
start $q_0$, $F = \{q_2\}$. (a) Compute $\delta^*(q_0, aab)$. (b) Convert it to a DFA. (c) What is
$L$?

:::solution
(a) $\{q_0\}\xrightarrow{a}\{q_0,q_1\}$, closure $\{q_0,q_1,q_2\}$; $\xrightarrow{a}$ the same set
again; $\xrightarrow{b}\{q_2\}$. $\delta^*(q_0, aab) = \{q_2\}$, which meets $F$: accepted.

(b)

| DFA state | $a$ | $b$ |
|---|---|---|
| → $\{q_0\}$ | $\{q_0,q_1,q_2\}$ | $\varnothing$ |
| ∗ $\{q_0,q_1,q_2\}$ | $\{q_0,q_1,q_2\}$ | $\{q_2\}$ |
| ∗ $\{q_2\}$ | $\varnothing$ | $\{q_2\}$ |
| $\varnothing$ | $\varnothing$ | $\varnothing$ |

(c) $L = a^+b^* = aa^*b^*$: at least one $a$, then any number of $b$'s.
:::
::::

:::note[Pattern at work]
Step 1 matters at every move: after reading $a$ the NFA can be in $q_1$, and so, for free, in
$q_2$. Without the closure, $\{q_0,q_1\}$ would wrongly be non-final and $a$ would be rejected.
:::
