---
title: Decidable or not?
order: 13
asks: recursive and recursively enumerable, the halting proof, reductions
units: [decidability]
method: decidable-or-not
---

## Logic

Decidable means that an algorithm always stops with the right answer. Questions about DFAs and about what a grammar can derive are usually decidable. Questions about what an arbitrary Turing machine **does**
are usually not, and the proof is a reduction from the halting problem: build a machine that runs $M$ on $w$ first, so that the new question can only be answered by knowing whether that stops.

## Pattern

:::steps[Classifying a problem]
1. Is the object a DFA, a grammar or a machine? Check the table of questions on the [Table](/prep/COMP335/final/table) tab.
2. Does the question bound the search (a step limit, a property of the code)? Then simulate or read the code: decidable.
3. Is it about the **language or behaviour** of an arbitrary Turing machine? Reduce from halting.
4. For a reduction: from $\langle M \rangle w$, build $M'$: on any input, run $M$ on $w$, then do something that makes the answer yes.
5. Say why the answer for $M'$ is yes exactly when $M$ halts on $w$.
:::

## Traps

:::caution[Traps]
- Direction: reduce the **known** undecidable problem to the new one.
- The reduction only builds $M'$. It never runs $M$.
- "Undecidable" is about one algorithm for all instances, not about one instance.
- A problem with finitely many instances is always decidable.
- Recursively enumerable does not mean decidable: $L_H$ is the example.
- Its complement is not even recursively enumerable: $L$ and $\overline{L}$ both recursively enumerable would make $L$ decidable.
:::

## Worked problems

::::exercise[Reductions]
Show that these are undecidable: (a) given $M$, does $M$ accept at least two strings? (b) given $M$, does $M$ halt on at least one input? For (b), also show that the set of such machines is recursively enumerable.

:::solution
(a) Given $\langle M \rangle w$, build $M'$: on input $x$, run $M$ on $w$, then accept. If $M$ halts on $w$, then $L(M') = \Sigma^*$, which has at least two strings. Otherwise $L(M') = \varnothing$. So a decider for
this problem would decide halting.

(b) The same $M'$: it halts on every input if $M$ halts on $w$, and on no input otherwise. To accept the set, dovetail: run $M$ on the first string for one step, on the first two strings for two steps, and so on,
and accept when any run halts. If $M$ halts on some input, this finds it.
:::
::::

::::exercise[The same words, two answers]
Let $D$ be a DFA and $G$ a context-free grammar. (a) Is "$L(G) \subseteq L(D)$?" decidable? (b) Is "$L(D) \subseteq L(G)$?" decidable?

:::solution
(a) Decidable. $L(G) \subseteq L(D)$ exactly when $L(G) \cap \overline{L(D)} = \varnothing$. The complement of $L(D)$ is regular, the intersection with a context-free language is context-free, and emptiness is
decidable for grammars.

(b) Undecidable. If $D$ accepts $\Sigma^*$, the question is "is $L(G) = \Sigma^*$?", which is undecidable.
:::
::::

:::note[Pattern at work]
In the first problem, step 4 gave one machine, and each question only had to look at it. In the second, step 1 turned the question into closure plus a known row of the table.
:::

## Drill

::::exercise[Classify]
Decidable or not? (a) Does $M$ halt on $w$ within $n$ steps? (b) Is $L(M)$ finite? (c) Does the DFA $D$ accept an even-length string? (d) Is the grammar $G$ ambiguous? (e) Do $G_1$, $G_2$ generate the same language?
(f) Does $M$ have a state with no incoming move? (g) Does $M$ enter state $q$ on input $w$? (h) Is $w \in L(G)$?

:::solution
(a) Decidable: simulate $n$ steps. (b) Undecidable: Rice's theorem, or the machine $M'$. (c) Decidable: product with a parity DFA, then emptiness. (d) Undecidable. (e) Undecidable.
(f) Decidable: read the code. (g) Undecidable: the state-entry problem. (h) Decidable: CYK.
:::
::::
