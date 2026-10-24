---
title: Sets, strings and languages
order: 1
asks: prove or disprove identities; count strings; λ and ∅
units: [math-preliminaries, languages-grammars-automata]
---

## Logic

Languages are sets, so a claim is false if one example breaks it, and true if you can show "⊆ both
ways" or argue directly about a string. The tiny languages $\varnothing$, $\{\lambda\}$, $\{a\}$,
$\{b\}$ and $\{a,b\}$ break almost every false claim.

## Pattern

:::steps[Prove or disprove]
1. Try the claim on $\varnothing$, $\{\lambda\}$ and single letters. If it fails, that is your
   counterexample: say which string is in one side and not the other.
2. If it survives, prove it: take an arbitrary $w$ in the left side, write what that means
   ($w = xy$ with …), and show $w$ is in the right side. Then the other direction.
3. For a "for all $n$" claim, use induction (as for $|2^S| = 2^{|S|}$).
:::

## Traps

:::caution[Traps]
- $\varnothing^* = \{\lambda\}$; $\varnothing L = \varnothing$; $\{\lambda\}L = L$.
- $L^+ = L^* - \{\lambda\}$ fails when $\lambda\in L$.
- $(L_1\cup L_2)^* \neq L_1^*\cup L_2^*$: the left side mixes, e.g. $ab$.
- $A\times B = A\times C \Rightarrow B = C$ fails for $A = \varnothing$.
- $L^2 = LL$ is not $\{ww : w\in L\}$: the two factors are chosen independently.
:::

## Worked problems

::::exercise[True or false]
Prove or give a counterexample. (a) $L^*L^* = L^*$. (b) $(L_1\cup L_2)^* = L_1^*\cup L_2^*$.
(c) If $\lambda\in L$, then $L^+ = L^*$. (d) $(L_1L_2)^R = L_1^RL_2^R$. (e) For sets,
$A\times B = B\times A$ implies $A = B$.

:::solution
(a) True. ⊇: $w = w\lambda$ with $\lambda\in L^*$. ⊆: $w = xy$ with $x, y\in L^*$; each is a
concatenation of strings from $L$, so $xy$ is too.

(b) False. $L_1 = \{a\}$, $L_2 = \{b\}$: $ab\in(L_1\cup L_2)^*$, but $ab\notin a^*\cup b^*$.

(c) True. $L^+\subseteq L^*$ always. Conversely $\lambda\in L = L^1\subseteq L^+$, and every other
string of $L^*$ lies in some $L^n$ with $n\ge 1$.

(d) False. $L_1 = \{a\}$, $L_2 = \{b\}$: $(L_1L_2)^R = \{ba\}$ but $L_1^RL_2^R = \{ab\}$. The correct
rule is $(L_1L_2)^R = L_2^RL_1^R$.

(e) False. $A = \varnothing$, $B = \{1\}$: both products are $\varnothing$.
:::
::::

:::note[Pattern at work]
Every false claim fell to step 1 with one-letter languages or $\varnothing$. The true claims were
proved by taking an arbitrary string and unfolding the definitions (step 2).
:::

## Drill

::::exercise[Multiple choice]
(i) How many strings of length at most 2 are there over $\{a,b\}$? (ii) For $L = \{a, ab\}$, how
many strings are in $L^2$? (iii) $\{\lambda\}^* = ?$ (iv) For $|S| = 3$, $|2^S| = ?$

:::solution
(i) $1 + 2 + 4 = 7$ ($\lambda$ counts). (ii) 4: $aa$, $aab$, $aba$, $abab$, all different; if two
products coincided, $|L^2|$ would be smaller than $|L|^2$. (iii) $\{\lambda\}$. (iv) 8.
:::
::::
