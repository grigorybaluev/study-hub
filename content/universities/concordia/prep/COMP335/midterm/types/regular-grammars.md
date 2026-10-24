---
title: Regular grammars
order: 6
asks: right- and left-linear grammars, grammar ↔ NFA
units: [regular-languages, regular-closure-decision]
---

## Logic

A right-linear grammar is an NFA written as rules: a variable is a state, $A\to aB$ is an edge, and
$A\to\lambda$ makes $A$ final. Left-linear grammars generate the string from right to left, so they
correspond to the NFA of the reverse language.

## Pattern

:::steps[Grammars and NFAs]
1. Right-linear: draw (or imagine) the DFA or NFA, then write $V_i\to aV_j$ for every edge and
   $V_f\to\lambda$ for every final state.
2. Left-linear: write a right-linear grammar for $L^R$, then reverse every right-hand side
   ($A\to aB$ becomes $A\to Ba$). Or build directly: the variable stands for "everything to the left".
3. Grammar → NFA: a state per variable, an edge per rule; rules $A\to x$ (no variable) go to a new
   final state, through middle states if $|x| > 1$.
4. Check by deriving one string.
:::

## Traps

:::caution[Traps]
- Mixing right- and left-linear rules gives a linear grammar that may not be regular.
- $A\to Ba$ in a "right-linear" answer is a type error. Check every rule's shape.
- Forgetting $\lambda$: if $\lambda\in L$, you need $S\to\lambda$ (or a final start state).
- Left-linear means *reverse*, not "mirror the letters": $(a+b)^*ab$ reversed is $ba(a+b)^*$.
:::

## Worked problems

::::exercise[Both kinds of grammar]
(a) A right-linear grammar for $\{w\in\{a,b\}^* : n_a(w)$ is even$\}$. (b) A left-linear and a
right-linear grammar for $(a+b)^*ab$.

:::solution
(a) The DFA has two states, $S$ (even, final) and $A$ (odd): $S\to aA\mid bS\mid\lambda$,
$A\to aS\mid bA$.

(b) Right-linear: $S\to aS\mid bS\mid ab$. Left-linear (the variable holds the part on the left):
$S\to Tab$, $T\to Ta\mid Tb\mid\lambda$. Derivation: $S\Rightarrow Tab\Rightarrow Tbab\Rightarrow bab$.
:::
::::

:::note[Pattern at work]
(a) is step 1 on a 2-state DFA. In (b), the left-linear grammar grows to the left: "anything, then
$ab$" is $Tab$ with $T$ generating anything.
:::

::::exercise[From a grammar to an NFA, and a non-example]
(a) Convert $S\to aA\mid b$, $A\to bS\mid a$ to an NFA and describe $L$. (b) Is $S\to aA$,
$A\to Sb\mid\lambda$ a regular grammar? What does it generate?

:::solution
(a) States $S$, $A$ and a new final $F$: $S\xrightarrow{a}A$, $S\xrightarrow{b}F$, $A\xrightarrow{b}S$,
$A\xrightarrow{a}F$. $L = (ab)^*(b + aa)$.

```automaton
type: nfa
states: S 60 110, A 210 110, F 360 110
start: S
finals: F
trans: S a A; A b S; S b F; A a F
curves: {"S|F": 70}
```

(b) No: $S\to aA$ is right-linear but $A\to Sb$ is left-linear, so the grammar is only linear. It
generates $S\Rightarrow aA\Rightarrow a$, or $S\Rightarrow aA\Rightarrow aSb\Rightarrow aaAb\Rightarrow aab$,
and so on: $\{a^{n+1}b^n : n\ge 0\}$, which is not regular.
:::
::::

:::note[Pattern at work]
Step 3 for (a), with $F$ collecting the rules without a variable. (b) is the mixing trap: each rule
looks harmless, but together they count.
:::

::::exercise[Solve a grammar with the fixed-point theorem]
Find a regular expression for $S\to 0A\mid 1S\mid\lambda$, $A\to 0B\mid 1A$, $B\to 0S\mid 1B$.

:::solution
As equations: $S = 0A + 1S + \lambda$, $A = 0B + 1A$, $B = 0S + 1B$.

- $B = 1B + 0S$, so $B = 1^*0S$.
- $A = 1A + 01^*0S$, so $A = 1^*01^*0S$.
- $S = 01^*01^*0S + 1S + \lambda = (01^*01^*0 + 1)S + \lambda$, so $S = (01^*01^*0 + 1)^*$.

The strings whose number of 0's is a multiple of 3.
:::
::::
