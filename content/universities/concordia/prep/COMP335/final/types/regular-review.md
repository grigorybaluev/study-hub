---
title: The regular half, in one pass
order: 1
asks: design and convert finite automata; expressions and grammars; closure; regular or not
units: [finite-automata, regular-languages, regular-closure-decision, pumping-lemma-regular]
method: regular-or-not
---

## Logic

This guide covers all thirteen weeks, and regular languages often come back as the first step of a larger
question. The [midterm guide](/prep/COMP335/midterm/types) has a full type for each
skill below, with its own worked problems. This page is the checklist that sends you there.

The one idea is **finite memory**. To design, decide what must be remembered, and each possibility is a
state. To prove "not regular", show that infinitely many different things must be remembered.

## Pattern

:::steps[What to be able to do without notes]
1. Design a DFA by saying what each state remembers, and an NFA by letting it guess. Complete a DFA with a trap state.
2. Convert: subset construction, state elimination, NFA to right-linear grammar and back. The [conversion map](/prep/COMP335/final/map) has each arrow.
3. Minimise: remove unreachable states, mark (final, non-final), propagate, merge.
4. Use closure: build $L$ from regular pieces, or intersect with a regular language to reach a known non-regular one.
5. Pump: $w = xyz$, $|xy| \le m$, $|y| \ge 1$, and choose $i$ with $xy^iz \notin L$.
:::

## Traps

:::caution[Traps]
- Complement needs a **complete** DFA; never swap the final states of an NFA.
- $\lambda$-closure at the start and after every move.
- $ab^* \ne (ab)^*$, and $a^* + b^* \ne (a + b)^*$.
- A finite language is always regular, however strange it looks.
- The pumping lemma can never prove that a language is regular.
:::

## Worked problems

::::exercise[Four questions in one]
Let $L$ be the strings over $\{a, b\}$ in which every $a$ is followed immediately by a $b$. (a) Give a DFA.
(b) Give a regular expression. (c) Give a right-linear grammar. (d) Is $\{w \in L : n_a(w) = n_b(w)\}$ regular?

:::solution
(a) Remember whether an $a$ is waiting for its $b$: $q_0$ (nothing is owed, final), $q_1$ (an $a$ was just
read), and a trap $q_2$ for $aa$.

| $\delta$ | $a$ | $b$ |
|---|---|---|
| $\to *\,q_0$ | $q_1$ | $q_0$ |
| $q_1$ | $q_2$ | $q_0$ |
| $q_2$ | $q_2$ | $q_2$ |

```automaton
type: dfa
states: q0 60 120, q1 220 120, q2 380 120
start: q0
finals: [q0]
trans: "q0 a q1; q0 b q0; q1 b q0; q1 a q2; q2 a,b q2"
curves: {"q0|q1": -30, "q1|q0": -30}
```

(b) Blocks of $b$ or $ab$: $(b + ab)^*$.

(c) One rule per edge of the useful part: $Q_0 \to aQ_1 \mid bQ_0 \mid \lambda$, $\;Q_1 \to bQ_0$.

(d) Every $a$ in $L$ has its own $b$, so $n_a = n_b$ means that there are no other $b$'s: the language is
$(ab)^*$, which is regular. A condition on counts is not automatically a reason to pump: look at what
the language contains first.
:::
::::

:::note[Pattern at work]
Part (d) is a language that looks like counting: two counts are compared, but the rest of the definition has
already fixed them.
:::

## Drill

::::exercise[Regular or not, quickly]
Regular or not? (a) $\{a^n b^m : n + m \le 100\}$; (b) $\{a^n b^m : n \ge m\}$; (c) $\{w : n_a(w)$ is even and
$n_b(w)$ is odd$\}$; (d) $\{a^{2n} : n \ge 0\}$; (e) $\{a^{n^2}\}$.

:::solution
(a) Regular: finite. (b) Not regular: pump $a^m b^m$ down, with $i = 0$. (c) Regular: a product of two parity
DFAs, four states. (d) Regular: $(aa)^*$. (e) Not regular: the gaps between squares grow.
:::
::::
