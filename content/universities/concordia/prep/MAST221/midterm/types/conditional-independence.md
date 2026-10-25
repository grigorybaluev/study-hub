---
title: Conditional probability and independence
order: 3
asks: conditional probabilities, chains without replacement, independent trials, independence checks
units: [conditional-probability-bayes]
---

## Logic

$P(A\mid B)=P(A\cap B)/P(B)$: zoom into $B$. Read backwards it is the multiplication rule, a chain of
conditional fractions, which is how anything sequential is computed. Independence is the special case where
the chain does not change: $P(A\cap B)=P(A)P(B)$.

## Pattern

:::steps[Conditioning and independence]
1. "Given …": identify the conditioning event $B$; compute $P(A\cap B)$ and $P(B)$.
2. Sequential, without replacement: $P(A_1)P(A_2\mid A_1)P(A_3\mid A_1\cap A_2)\cdots$.
3. Independent trials: multiply. "In any order": multiply by the number of orders, $\binom nk$.
4. "At least one" in $n$ trials: $1-P(\text{none})=1-(1-p)^n$.
5. To check independence: compare $P(A\cap B)$ with $P(A)P(B)$.
:::

## Traps

:::caution[Traps]
- $P(A\mid B)\neq P(B\mid A)$ in general.
- Mutually exclusive events (with positive probabilities) are dependent.
- "A hit followed by two misses" is one order; "two misses and a hit" allows any order.
- Pairwise independence of three events does not give $P(A\cap B\cap C)=P(A)P(B)P(C)$.
:::

## Worked problems

::::exercise[Independent trials]
A player scores with probability 0.6 on each attempt, independently. In 4 attempts, find (a)
$P(\text{exactly 2 scores})$; (b) $P(\text{at least one score})$; (c) $P(\text{the first score is on the
3rd attempt})$.

:::solution
(a) $\binom42(0.6)^2(0.4)^2=6\cdot0.0576=0.3456$. (b) $1-0.4^4=0.9744$. (c) $0.4\cdot0.4\cdot0.6=0.096$.
:::
::::

:::note[Pattern at work]
(a) is step 3 with $\binom42=6$ orders; (b) is the complement shortcut of step 4; (c) is one fixed order, so
no binomial coefficient.
:::

::::exercise[Without replacement, and a check of independence]
(a) An urn has 4 red and 6 blue balls; 3 are drawn without replacement. Find $P(\text{red, red, blue in that
order})$ and $P(\text{exactly 2 red})$. (b) $P(A)=0.3$, $P(B)=0.4$, $P(A\cup B)=0.58$. Are $A$ and $B$
independent? Mutually exclusive?

:::solution
(a) $\frac4{10}\cdot\frac39\cdot\frac68=\frac1{10}$. There are 3 positions for the blue ball, each with the
same product, so $P(\text{exactly 2 red})=\frac3{10}$, which agrees with
$\binom42\binom61/\binom{10}3=\frac{36}{120}$.

(b) $P(A\cap B)=0.3+0.4-0.58=0.12=0.3\times0.4$: independent. Not mutually exclusive, since
$P(A\cap B)=0.12\neq0$.
:::
::::

:::note[Pattern at work]
(a): the chain (step 2) and the counting of type 1 agree, which is a free check. (b): get $P(A\cap B)$ from
the addition rule, then run the test of step 5.
:::
