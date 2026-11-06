---
title: Design a pushdown automaton
order: 7
asks: give an NPDA or DPDA; trace a run; decide whether a machine is deterministic
units: [pushdown-automata]
---

## Logic

The stack holds **what is still owed**. States hold the phase of the string. A $\lambda$-move stands for any decision that
the input does not announce. Every move pops one symbol, so write each move in full: read, pop, push.

## Pattern

:::steps[A PDA in six steps]
1. Say what the stack holds at each moment, in one sentence.
2. Give one state per phase: reading $a$'s, reading $b$'s, finished.
3. Write the push moves, with one version for each possible top symbol.
4. Write the pop moves.
5. $z$ on top means everything is matched: use $\lambda, z \to z$ into a final state. If $\lambda \in L$, make the start state final.
6. Where the middle or the case cannot be seen in the input, guess by a $\lambda$-move, and check that a wrong guess cannot be accepted.
:::

## Traps

:::caution[Traps]
- Acceptance needs **both**: all the input read, and a final state.
- No move exists on an empty stack, so popping $z$ too early kills the run.
- $a, \lambda \to c$ is only a shorthand: in a formal answer, write $a, x \to cx$ for each stack symbol $x$.
- The leftmost symbol of a pushed string is the new top.
- Deterministic means at most one move, **and** no $\lambda$-move beside a reading move on the same state and top.
- Making the start state final accepts $\lambda$, and also every string that ends there: check it.
:::

## Worked problems

::::exercise[Two machines]
Give (a) a DPDA for $\{a^i b^j c^k : k = i + j\}$, and (b) an NPDA for $\{w \in \{a, b\}^* : n_a(w) > n_b(w)\}$. Trace $abcc$ on the first and $baa$ on the
second.

:::solution
(a) The stack holds one mark for each letter still owed a $c$. Push an $a$ for each $a$ and for each $b$; pop on $c$. States: $q_1$ reading $a$'s, $q_2$ reading $b$'s, $q_3$
reading $c$'s, $q_4$ finished.

| From | Read | Pop | To | Push |
|---|---|---|---|---|
| $q_0$ | $a$ | $z$ | $q_1$ | $az$ |
| $q_0$ | $b$ | $z$ | $q_2$ | $az$ |
| $q_1$ | $a$ | $a$ | $q_1$ | $aa$ |
| $q_1$ | $b$ | $a$ | $q_2$ | $aa$ |
| $q_2$ | $b$ | $a$ | $q_2$ | $aa$ |
| $q_1$ | $c$ | $a$ | $q_3$ | $\lambda$ |
| $q_2$ | $c$ | $a$ | $q_3$ | $\lambda$ |
| $q_3$ | $c$ | $a$ | $q_3$ | $\lambda$ |
| $q_3$ | $\lambda$ | $z$ | $q_4$ | $z$ |

```automaton
type: nfa
states: q0 70 130, q1 230 130, q2 390 130, q3 390 280, q4 550 280
start: q0
finals: [q0, q4]
trans: "q0 a,z→az q1; q0 b,z→az q2; q1 a,a→aa q1; q1 b,a→aa q2; q2 b,a→aa q2; q1 c,a→λ q3; q2 c,a→λ q3; q3 c,a→λ q3; q3 λ,z→z q4"
curves: {"q0|q2": -70}
```

The final states are $q_0$ (for $\lambda$) and $q_4$.

$$(q_0, abcc, z) \vdash (q_1, bcc, az) \vdash (q_2, cc, aaz) \vdash (q_3, c, az) \vdash (q_3, \lambda, z) \vdash (q_4, \lambda, z) \qquad \textbf{accept}$$

(b) The stack holds the surplus, only $a$'s or only $b$'s. A letter on top of the same letter or on $z$ pushes, and a different letter cancels. Accept if an $a$ is on top after the
input.

| From | Read | Pop | To | Push |
|---|---|---|---|---|
| $q_0$ | $a$ | $z$ | $q_0$ | $az$ |
| $q_0$ | $b$ | $z$ | $q_0$ | $bz$ |
| $q_0$ | $a$ | $a$ | $q_0$ | $aa$ |
| $q_0$ | $b$ | $b$ | $q_0$ | $bb$ |
| $q_0$ | $a$ | $b$ | $q_0$ | $\lambda$ |
| $q_0$ | $b$ | $a$ | $q_0$ | $\lambda$ |
| $q_0$ | $\lambda$ | $a$ | $q_1$ | $a$ |

with final state $q_1$. A jump to $q_1$ before the end of the input cannot be accepted, because $q_1$ has no move.

$$(q_0, baa, z) \vdash (q_0, aa, bz) \vdash (q_0, a, z) \vdash (q_0, \lambda, az) \vdash (q_1, \lambda, az) \qquad \textbf{accept}$$
:::
::::

:::note[Pattern at work]
Step 1 wrote the machine in each case. In (a) the $b$ moves push the same symbol as the $a$ moves, because all that matters is how many $c$'s are owed.
:::

## Drill

::::exercise[Deterministic or not?]
Does each language have a DPDA? (a) $\{a^n c b^n\}$; (b) $\{ww^R\}$; (c) $\{a^n b^{2n}\}$; (d) $\{a^n b^n\} \cup \{a^n c^n\}$; (e) $\{a^n b^n\} \cup \{a^n b^{2n}\}$.

:::solution
(a) Yes. (b) No: the middle is not marked. (c) Yes: push two symbols per $a$. (d) Yes: the first letter after the $a$'s announces which case applies. (e) No: after $n$ $b$'s
the machine would have to accept and also carry on, and that leads to a machine for $a^n b^n c^n$.
:::
::::
