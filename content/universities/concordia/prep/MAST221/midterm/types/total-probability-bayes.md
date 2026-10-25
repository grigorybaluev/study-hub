---
title: Total probability and Bayes
order: 4
asks: cases or causes, then "given the result, which case?"
units: [conditional-probability-bayes]
method: computing-a-probability
---

## Logic

When the result depends on which case you are in (machine, urn, health status), draw a tree with the cases
first. Total probability adds the branches that end in the observed result. Bayes turns it around: given the
result, the probability of a case is its branch divided by that total. On the events map this is the route
tree → regions → one event → conditional: multiply, add, divide.

## Pattern

:::steps[Tree, then Bayes]
1. Name the cases $B_1,\dots,B_k$ (they must partition $S$) and the result $A$.
2. Write $P(B_i)$ on the first branches and $P(A\mid B_i)$ on the second.
3. $P(A)=\sum_iP(B_i)P(A\mid B_i)$.
4. $P(B_r\mid A)=\frac{P(B_r)P(A\mid B_r)}{P(A)}$.
5. Two stages (move a ball, then draw): the first draw is the case, the second is the result.
:::

## Traps

:::caution[Traps]
- Mixing up $P(A\mid B)$ and $P(B\mid A)$: the question's "given" is the condition.
- Forgetting that the second stage changes with the case: after a transfer, urn 2 has one more ball.
- Ignoring the base rate: a rare case stays fairly unlikely even after a positive result.
- The posteriors must add to 1, which makes a good check.
:::

## Worked problems

::::exercise[Three machines]
Machines $M_1, M_2, M_3$ make 50 %, 30 % and 20 % of the output, with defect rates 2 %, 3 % and 5 %. (a) What
is the probability that an item is defective? (b) Given a defective item, what is the probability that
$M_3$ made it?

:::solution
(a) $P(D)=0.5(0.02)+0.3(0.03)+0.2(0.05)=0.010+0.009+0.010=0.029$.

(b) $P(M_3\mid D)=\frac{0.010}{0.029}=\frac{10}{29}\approx0.345$. Also $P(M_1\mid D)=\frac{10}{29}$ and
$P(M_2\mid D)=\frac9{29}$, which add to 1.
:::
::::

:::note[Pattern at work]
Steps 2–4. $M_3$ makes only 20 % of the items but 34.5 % of the defectives: its high defect rate pulls the
posterior up.
:::

::::exercise[A screening test, and a two-stage urn]
(a) A condition affects 1 % of people. A test is positive for 95 % of those who have it and for 4 % of those
who do not. Find $P(\text{condition}\mid\text{positive})$. (b) Urn 1 has 3 red and 2 blue balls; urn 2 has
2 red and 4 blue. One ball is moved from urn 1 to urn 2, then a ball is drawn from urn 2. Find
$P(\text{red})$, and $P(\text{the moved ball was red}\mid\text{the drawn ball is red})$.

:::solution
(a) $P(+)=0.01(0.95)+0.99(0.04)=0.0095+0.0396=0.0491$, so $P(C\mid +)=\frac{0.0095}{0.0491}\approx0.193$.

(b) The case is the colour moved. If red is moved (probability $\frac35$), urn 2 has 3 red of 7; if blue
($\frac25$), 2 red of 7. $P(R)=\frac35\cdot\frac37+\frac25\cdot\frac27=\frac9{35}+\frac4{35}=\frac{13}{35}$,
and $P(\text{moved red}\mid R)=\frac{9/35}{13/35}=\frac9{13}$.
:::
::::

:::note[Pattern at work]
(a) is the base-rate trap: the 4 % false positives among 99 % healthy people outnumber the true positives
four to one (the events map walks it arrow by arrow). (b) is step 5: the first stage is the case, and the
second-stage fractions use 7 balls, not 6.
:::
