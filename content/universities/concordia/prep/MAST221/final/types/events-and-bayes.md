---
title: Events, counting and Bayes
order: 1
asks: counting, the rules, "given that", trees and "which case was it?"
units: [sample-spaces-events, probability-rules, conditional-probability-bayes]
method: computing-a-probability
---

## Logic

Weeks 1–2 in one type. With equally likely outcomes, probability is counting. Otherwise it is bookkeeping: add
the pieces, take the complement, zoom into the given event, split into cases. When the result depends on a case
(which coin, which machine), draw a tree. Total probability adds the branches, and Bayes is one branch over that
total.

## Pattern

:::steps[Set up, then apply one rule]
1. Name the events. Translate the words: "at least one" is a complement, "given" is a conditional.
2. Counting: $\frac{\#\text{ways to get }A}{\#\text{ways in total}}$, unordered over unordered.
3. "Given $B$": $P(A\mid B)=\frac{P(A\cap B)}{P(B)}$. If $A\subseteq B$, the top is just $P(A)$.
4. Cases: a tree with $P(B_i)$ first and $P(A\mid B_i)$ second; $P(A)=\sum_iP(B_i)P(A\mid B_i)$.
5. Backwards: $P(B_r\mid A)=\frac{P(B_r)P(A\mid B_r)}{P(A)}$.
:::

## Traps

:::caution[Traps]
- $P(A\mid B)\neq P(B\mid A)$: the "given" goes underneath.
- Mutually exclusive events with positive probabilities are dependent.
- "At least one does not occur" is $1-P(\text{both})$.
- Results that are independent inside each case need not be independent overall: see the second problem.
:::

## Worked problems

::::exercise[A committee]
A committee of 3 is chosen at random from 5 women and 4 men. Find (a) $P(\text{exactly 2 women})$; (b)
$P(\text{at least one man})$; (c) $P(\text{exactly 2 women}\mid\text{at least one man})$.

:::solution
(a) $\frac{\binom52\binom41}{\binom93}=\frac{40}{84}=\frac{10}{21}$.

(b) $1-P(\text{no man})=1-\frac{\binom53}{84}=\frac{74}{84}=\frac{37}{42}$.

(c) "Exactly 2 women" means exactly 1 man, which lies inside "at least one man", so the top is the probability
from (a): $\frac{40/84}{74/84}=\frac{20}{37}$.
:::
::::

:::note[Pattern at work]
Steps 2 and 3. Part (b) is the complement shortcut, and in (c) the intersection is the smaller event, so nothing
new has to be counted.
:::

::::exercise[Two heads in a row]
A bag holds two fair coins and one coin with heads on both sides. A coin is drawn at random and tossed twice,
and both tosses show heads. Find (a) the probability that it is the two-headed coin; (b) the probability that a
third toss of the same coin also shows heads.

:::solution
(a) Let $D$ = the two-headed coin. The tree has $P(D)=\frac13$, $P(HH\mid D)=1$ and
$P(D')=\frac23$, $P(HH\mid D')=\frac14$, so $P(HH)=\frac13+\frac16=\frac12$ and
$P(D\mid HH)=\frac{1/3}{1/2}=\frac23$.

(b) Split by the coin, using the updated probabilities: $\frac23\cdot1+\frac13\cdot\frac12=\frac56$.
:::
::::

:::note[Pattern at work]
Steps 4 and 5, then total probability again with the posteriors as the new first level. Given the coin the tosses
are independent, but without knowing it they are not: two heads raise the chance of a third from $\frac23$ to
$\frac56$.
:::
