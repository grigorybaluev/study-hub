---
title: Sample spaces, events and counting
order: 1
asks: list S and events; count with combinations; draws without replacement
units: [sample-spaces-events, probability-rules]
method: computing-a-probability
---

## Logic

With equally likely outcomes, $P(A)=n(A)/n(S)$, so the work is counting. Small experiments: list $S$,
labelling the objects. Large ones: count, with combinations when order does not matter, or with a chain of
fractions for sequential draws without replacement.

## Pattern

:::steps[Count it]
1. Decide: does order matter? With or without replacement?
2. Small $S$: list it, labelling objects that look alike ($R_1, R_2$). Check $n(S)$ with a formula.
3. Large $S$: $P(A)=\frac{\#\text{ways to get }A}{\#\text{ways in total}}$, using $\binom nr$ for both.
4. Sequential ("the next card", "on the $k$-th test"): multiply conditional fractions, or count positions.
:::

## Traps

:::caution[Traps]
- Unlabelled objects make outcomes that look equally likely but are not ("two reds" against "one of each").
- Ordered counting on top of the fraction with unordered counting below.
- "Given that the first three were hearts": the deck now has 49 cards and 10 hearts.
- "The last defective is found on test 5" means a defective at position 5 and exactly the others before it.
:::

## Worked problems

::::exercise[List it]
A box holds two red balls $R_1, R_2$ and two blue balls $B_1, B_2$. Two are drawn without replacement.
$A$ = "both the same colour", $B$ = "at least one red". List $S$, $A$, $B$, $A\cap B$, $A\cup B$, $A'$ and
find their probabilities.

:::solution
$S=\{R_1R_2, R_1B_1, R_1B_2, R_2B_1, R_2B_2, B_1B_2\}$: $n(S)=\binom42=6$, all equally likely.

$A=\{R_1R_2, B_1B_2\}$; $B=S-\{B_1B_2\}$ (5 outcomes); $A\cap B=\{R_1R_2\}$; $A\cup B=S$;
$A'=\{R_1B_1, R_1B_2, R_2B_1, R_2B_2\}$.

$P(A)=\frac13$, $P(B)=\frac56$, $P(A\cap B)=\frac16$, $P(A\cup B)=1$, $P(A')=\frac23$. Check:
$\frac13+\frac56-\frac16=1$.
:::
::::

:::note[Pattern at work]
Step 2: labelling the balls makes the 6 outcomes equally likely. Without labels, "2 red / 2 blue / mixed"
would look like 3 outcomes, but "mixed" is 4 of the 6.
:::

::::exercise[Count it]
(a) Five cards from a standard deck: find $P(\text{exactly 2 hearts})$. (b) Cards are dealt one at a time.
If the first 3 are hearts, what is the probability that the next 2 are also hearts? (c) Three defective
items are among 8, tested one at a time in random order. What is the probability that the last defective is
found on the 5th test?

:::solution
(a) Choose 2 of the 13 hearts and 3 of the 39 others:
$\frac{\binom{13}2\binom{39}3}{\binom{52}5}=\frac{78\cdot9139}{2598960}\approx0.2743$.

(b) 49 cards are left, 10 of them hearts: $\frac{10}{49}\cdot\frac9{48}=\frac{15}{392}\approx0.0383$.

(c) All $\binom83=56$ sets of positions for the defectives are equally likely. "The last at 5" means
position 5 plus 2 of positions 1–4: $\binom42=6$ sets. $P=\frac6{56}=\frac3{28}$.
:::
::::

:::note[Pattern at work]
(a) is step 3 (unordered over unordered). (b) is step 4 with the updated deck. (c) counts positions, which
avoids a long chain of fractions.
:::
