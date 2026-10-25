---
title: Rules of probability
order: 2
asks: '"or", "neither", "exactly one", "at least one"; three events'
units: [probability-rules]
---

## Logic

Two events split $S$ into four regions, three events into eight. The given numbers ($P(A)$, $P(B)$,
$P(A\cap B)$, …) determine every region, and every question in words ("only", "exactly one", "neither",
"at least one does not") is a sum of regions. Fill the Venn diagram from the inside out.

## Pattern

:::steps[Region by region]
1. Translate the words into set notation.
2. Fill the innermost region first ($A\cap B$, or $A\cap B\cap C$), then subtract outwards.
3. Use $P(A\cup B)=P(A)+P(B)-P(A\cap B)$ and $P(A')=1-P(A)$.
4. Check that every region is $\ge0$ and that they add up to 1.
:::

## Traps

:::caution[Traps]
- "$A$ or $B$" is inclusive: it includes "both".
- "At least one does not occur" $=1-P(\text{both})$, not $1-P(\text{at least one})$.
- Adding $P(A)+P(B)$ for events that overlap.
- "Exactly one" $=P(A\cup B)-P(A\cap B)$, not $P(A)+P(B)$.
:::

## Worked problems

::::exercise[Two events]
$P(A)=0.4$, $P(B)=0.5$, $P(A\cap B)=0.15$. Find the probability of: (a) $A$ or $B$; (b) neither; (c)
exactly one; (d) $A$ but not $B$; (e) at least one does not occur.

:::solution
(a) $0.4+0.5-0.15=0.75$. (b) $1-0.75=0.25$. (c) $0.75-0.15=0.60$. (d) $0.4-0.15=0.25$.
(e) $1-P(A\cap B)=0.85$.
:::
::::

:::note[Pattern at work]
The regions: both 0.15, only $A$ 0.25, only $B$ 0.35, neither 0.25 (total 1). Every answer is a sum of
these four numbers. (e) is the "at least one does not" trap.
:::

::::exercise[Three newspapers]
In a survey, 60 % read paper A, 50 % read B, 40 % read C; 30 % read A and B, 20 % read A and C, 15 % read B
and C, and 10 % read all three. Find the probability that a person reads (a) at least one; (b) none;
(c) exactly one.

:::solution
(a) $0.6+0.5+0.4-0.3-0.2-0.15+0.1=0.95$. (b) $0.05$.

(c) From the centre outwards: only A $=0.6-0.3-0.2+0.1=0.20$; only B $=0.5-0.3-0.15+0.1=0.15$; only C
$=0.4-0.2-0.15+0.1=0.15$. Exactly one: $0.50$.
:::
::::

:::note[Pattern at work]
Step 2: "only A" subtracts both pairwise overlaps and adds back the triple, which was subtracted twice.
Check: the pairs-only regions are 0.2, 0.1 and 0.05; with the singles 0.5 and the triple 0.1 the total is
0.95, matching (a).
:::
