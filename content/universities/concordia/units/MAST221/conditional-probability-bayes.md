---
title: Conditional probability, independence and Bayes' theorem
order: 3
status: detailed
weeks: [2]
notes: ["Notes Lec 3 (Wed 16 Sep 2026) p.1: independence survives complements, with the proof", "Notes Lec 3 p.2: conditional probabilities satisfy the postulates; the three-event multiplication rule", "Notes Lec 3 p.3: the law of total probability with the proof; Bayes' theorem not yet covered in class"]
textbook: "Miller & Miller, John E. Freund's Mathematical Statistics with Applications, 8e, 2.6-2.8"
introduces: [conditional-probability, independence, bayes-theorem]
requires:
  - {concept: probability, strength: hard}
  - {concept: inclusion-exclusion, strength: soft}
  - {concept: counting, strength: soft}
reinforces: []
---

"What is the probability that a student passes the midterm?" has no single answer until we
say *which* students: everyone enrolled, those who came to the tutorials, those who did the
assignments. A probability is always relative to a sample space, and **conditioning** is the
act of swapping that sample space for a smaller one in the middle of a problem. This unit
builds everything on that one move: what $P(A \mid B)$ means and how to compute it, how to
chain conditional probabilities to get joint ones, what it means for the move to change
nothing (independence), and how to reason through an intermediate stage forwards (total
probability) and backwards (Bayes).

## Conditioning is a change of sample space

### A two-way table

Eighty students took a course. Cross-classify them by whether they attended the tutorials
($T$) and whether they passed the midterm ($M$):

|  | passed $M$ | failed $M'$ | total |
|---|---|---|---|
| attended tutorials $T$ | 30 | 10 | 40 |
| did not attend $T'$ | 15 | 25 | 40 |
| total | 45 | 35 | 80 |

Pick one of the 80 at random: $P(M) = 45/80 = 0.5625$. Now pick at random among the
*tutorial-goers* only. The sample space is the top row — 40 students — and 30 of them passed:

$$
P(M \mid T) = \frac{n(T \cap M)}{n(T)} = \frac{30}{40} = 0.75.
$$

Divide the numerator and the denominator by $n(S) = 80$ and the same quotient reads
$P(T \cap M)/P(T) = 0.375/0.5$: a ratio of two probabilities on the *original* sample space.
That ratio is the definition.

```sim
id: cond-table
controls:
  - {id: tg, label: "n(T ∩ M)", min: 0, max: 60, step: 1, default: 30, decimals: 0}
  - {id: tp, label: "n(T ∩ M′)", min: 0, max: 60, step: 1, default: 10, decimals: 0}
  - {id: ug, label: "n(T′ ∩ M)", min: 0, max: 60, step: 1, default: 15, decimals: 0}
  - {id: up, label: "n(T′ ∩ M′)", min: 0, max: 60, step: 1, default: 25, decimals: 0}
  - {id: cond, label: "condition on (0: nothing, 1: T, 2: T′)", min: 0, max: 2, step: 1, default: 1, decimals: 0}
note: "The four cells are the students table. Conditioning on T keeps only the top row lit: P(M | T) counts the passes among those 40 alone. Set the last slider to 2 for P(M | T′) = 15/40, or to 0 to get back the unconditional P(M) = 45/80. Empty a row to see why the definition needs P(T) ≠ 0."
```

```python
# Conditioning on a row of the two-way table: count inside the reduced sample space,
# or divide the two probabilities on the original one; the answers agree.
from fractions import Fraction as F

n = {('T', 'M'): 30, ('T', "M'"): 10, ("T'", 'M'): 15, ("T'", "M'"): 25}   # the sim's defaults
total = sum(n.values())                                                    # 80

def row(r): return sum(v for (a, _), v in n.items() if a == r)

print('P(M)      =', F(n[('T', 'M')] + n[("T'", 'M')], total))            # 9/16 = 45/80
print('P(M | T)  =', F(n[('T', 'M')], row('T')))                          # 3/4  = 30/40
print('          =', F(n[('T', 'M')], total) / F(row('T'), total))        # 3/4  via P(T∩M)/P(T)
print("P(M | T') =", F(n[("T'", 'M')], row("T'")))                        # 3/8  = 15/40
```

### The definition

:::definition[Conditional probability]
For events $A$ and $B$ in a sample space $S$ with
$P(A) \neq 0$, the conditional probability of $B$ given $A$ is

$$
P(B \mid A) = \frac{P(A \cap B)}{P(A)}.
$$

The table motivated it with equally likely students, but the definition does not need
equally likely outcomes.
:::

In a Venn diagram, conditioning on $B$ throws away everything outside $B$; what is left of
$A$ is $A \cap B$, and it is measured against the new whole, $B$.

::::example[A weighted die]
A die is weighted so that face $k$ comes up with probability
$k/21$ (the weights $1, 2, \dots, 6$ sum to 21). Let $A$ = "more than 3" $= \{4, 5, 6\}$ and
$B$ = "even" $= \{2, 4, 6\}$. Find $P(B \mid A)$.

:::solution
$P(A) = 15/21$, $P(B) = 12/21$ and $A \cap B = \{4, 6\}$ has probability $10/21$, so

$$
P(B \mid A) = \frac{P(A \cap B)}{P(A)} = \frac{10/21}{15/21} = \frac{10}{15} = \frac23.
$$

The reduced-sample-space check: inside $A$ the faces 4, 5, 6 keep their relative weights
$4 : 5 : 6$, and the even ones account for $4 + 6 = 10$ of the 15. Same answer, no formula —
and notice $P(B \mid A) = 2/3 > P(B) = 4/7$: learning that the roll was high makes "even"
more likely, because 6 carries the most weight.
:::
::::

::::example[One direction only]
A courier dispatches 70 % of parcels on the day they are
received, and 56 % of all parcels are both dispatched the same day and delivered the next.
Find $P(\text{next day} \mid \text{same day})$ and $P(\text{same day} \mid \text{next day})$.

:::solution
$P(\text{next day} \mid \text{same day}) = 0.56/0.70 = 0.80$. The reverse,
$P(\text{same day} \mid \text{next day})$, cannot be found from these two numbers: it needs
$P(\text{next day})$, the overall next-day rate. Keep this asymmetry in mind — Bayes'
theorem is the tool that supplies the missing piece.
:::
::::

```sim
id: cond-venn
controls:
  - {id: pA, label: P(A), min: 0, max: 1, step: 0.01, default: 0.4, decimals: 2}
  - {id: pB, label: P(B), min: 0, max: 1, step: 0.01, default: 0.5, decimals: 2}
  - {id: pAB, label: "P(A ∩ B)", min: 0, max: 1, step: 0.01, default: 0.15, decimals: 2}
  - {id: given, label: "given (0: nothing, 1: B, 2: A)", min: 0, max: 2, step: 1, default: 1, decimals: 0}
note: "The yellow outline is the reduced sample space; everything outside it is greyed out and the box S is no longer the whole. P(A | B) is the share of B taken up by A ∩ B. Switch to 'given A' to see that P(B | A) is a different number with the same numerator — the two conditionals only agree when P(A) = P(B)."
```

```python
# Same intersection, two different reduced sample spaces: P(A | B) and P(B | A)
# share the numerator P(A ∩ B) and differ in what it is measured against.
pA, pB, pAB = 0.4, 0.5, 0.15                        # the sim's defaults

print('P(A | B) =', round(pAB / pB, 3))             # 0.3   — A ∩ B as a share of B
print('P(B | A) =', round(pAB / pA, 3))             # 0.375 — the same region as a share of A
print("regions: A∩B' =", round(pA - pAB, 2), " A'∩B =", round(pB - pAB, 2),
      " A'∩B' =", round(1 - pA - pB + pAB, 2))      # 0.25, 0.35, 0.25

# the weighted die: P(k) = k/21, A = {4,5,6}, B = even
from fractions import Fraction as F
P = lambda E: sum(F(k, 21) for k in E)
A, B = {4, 5, 6}, {2, 4, 6}
print('die: P(B | A) =', P(A & B) / P(A), ' P(B) =', P(B))   # 2/3 against 4/7
```

### A conditional probability is a probability

::::proposition[Conditional probabilities satisfy the postulates]
Fix $B$ with $P(B) \neq 0$. Then $P(\,\cdot \mid B)$ is a probability measure in its own right:

1. $P(A \mid B) \ge 0$;
2. $P(B \mid B) = 1$;
3. for mutually exclusive $A_1, A_2, \dots$, $P(A_1 \cup A_2 \cup \cdots \mid B) = P(A_1 \mid B) + P(A_2 \mid B) + \cdots$.

:::proof
The lecture checked the three postulates (Notes Lec 3 p.2).

1. $P(A \cap B) \ge 0$ and $P(B) > 0$, so the quotient is non-negative.
2. $P(B \mid B) = P(B \cap B)/P(B) = P(B)/P(B) = 1$: the new sample space is the certain event.
3. The pieces $A_i \cap B$ are again mutually exclusive, so

$$
\begin{aligned}
&P(A_1 \cup A_2 \cup \cdots \mid B) \\
  &= \frac{P\big((A_1 \cap B) \cup (A_2 \cap B) \cup \cdots\big)}{P(B)} \\
  &= P(A_1 \mid B) + P(A_2 \mid B) + \cdots
\end{aligned}
$$
:::
::::

So every rule of the previous unit — complements, the addition rule, inclusion–exclusion —
holds with "$\mid B$" appended to every term.

:::note[A bound without the intersection (Notes Lec 3 p.3)]
$P(A \cup B) \ge 1 - P(A') - P(B')$, because $P(A \cup B) = 1 - P(A' \cap B')$ and
$P(A' \cap B') \le P(A') + P(B')$ by the addition rule. Bounds of this kind (Bonferroni's)
are what you reach for when $P(A \cap B)$ is unknown.
:::

:::caution
Rules about the *condition* do not carry over. Does $P(B \mid A) + P(B \mid A') = 1$? Only by
accident: if the four regions $A \cap B$, $A \cap B'$, $A' \cap B$, $A' \cap B'$ have
probabilities $0.3, 0.2, 0.3, 0.2$, then $P(B \mid A) + P(B \mid A') = 0.6 + 0.6 = 1.2$. The
events $A$ and $A'$ are two different sample spaces, and nothing ties the two fractions
together.
:::

## Chaining: the multiplication rule

Multiply the definition through by $P(A)$ and it becomes a way to compute joint
probabilities in stages: the probability that both happen is the probability of the first
times the probability of the second *given* the first.

::::theorem[Multiplication rule]
If $P(A) \neq 0$,

$$
P(A \cap B) = P(A)\,P(B \mid A),
$$

and by symmetry $P(A \cap B) = P(B)\,P(A \mid B)$ when $P(B) \neq 0$.

:::proof
Multiply both sides of $P(B \mid A) = P(A \cap B)/P(A)$ by $P(A)$.
:::
::::

For three events the rule chains: write $A \cap B \cap C = (A \cap B) \cap C$ and apply the
rule twice (Notes Lec 3 p.2).

:::corollary[Three events]
Provided $P(A \cap B) \neq 0$,

$$
P(A \cap B \cap C) = P(A \cap B)\,P(C \mid A \cap B) = P(A)\,P(B \mid A)\,P(C \mid A \cap B).
$$

The same pattern extends to $k$ events by induction — one more conditional factor per event.
:::

::::example[An urn, with and without replacement]
An urn holds 3 red and 7 blue balls; two are drawn. Find the probability that both are red,
without and with replacement.

:::solution
*Without replacement:* $P(\text{red, red}) = \frac{3}{10} \cdot \frac{2}{9} = \frac{1}{15}$
— the second factor is a conditional probability, computed on the 9 balls that remain.
*With replacement:* $\frac{3}{10} \cdot \frac{3}{10} = \frac{9}{100}$. The order of the two
events is a convenience, not a requirement: the probability that the *first* ball was red
given that the *second* is red is also $\tfrac29$.
:::
::::

::::example[Faulty sticks]
A batch of 12 USB sticks contains 4 faulty ones; three are taken out in succession. What is
the probability that all three are faulty?

:::solution
$$
\frac{4}{12} \cdot \frac{3}{11} \cdot \frac{2}{10} = \frac{24}{1320} = \frac{1}{55}.
$$

Each factor is conditioned on everything drawn before it.
:::
::::

```sim
id: draw-replacement
controls:
  - {id: N, label: items N, min: 2, max: 100, step: 1, default: 10, decimals: 0}
  - {id: d, label: special items d, min: 1, max: 20, step: 1, default: 3, decimals: 0}
  - {id: n, label: draws n, min: 1, max: 5, step: 1, default: 2, decimals: 0}
note: "Each bar is the probability that the next draw is special, given every earlier draw was: without replacement the numerator and denominator both drop by one per draw (3/10, then 2/9), with replacement nothing changes. The legend multiplies the bars — the multiplication rule chained n times. Defaults are the urn; N = 12, d = 4, n = 3 is the faulty-sticks example (1/55); N = 52, d = 4 is a deck of cards with its aces."
```

```python
# Each draw's factor is conditioned on every earlier draw; with replacement nothing
# changes. The sim's defaults are the urn; N = 12, d = 4, n = 3 is the faulty sticks.
from fractions import Fraction
def all_special(N, d, n, replace=False):
    """P(all n draws special) by the chained multiplication rule."""
    p = Fraction(1)
    for i in range(n):
        p *= Fraction(d, N) if replace else Fraction(d - i, N - i)
    return p
print(all_special(10, 3, 2), all_special(10, 3, 2, replace=True))   # 1/15 9/100
print(all_special(12, 4, 3))                                         # 1/55
```

## Independence

Informally, $A$ and $B$ are independent when learning that one happened does not change the
probability of the other: $P(B \mid A) = P(B)$. Put that into the multiplication rule and the
joint probability becomes a plain product, $P(A \cap B) = P(A)P(B)$. The product form is the
one we take as the definition: it is symmetric in $A$ and $B$, and it still makes sense when
$P(A)$ or $P(B)$ is zero.

:::definition[Independence]
$A$ and $B$ are **independent** if and only if

$$
P(A \cap B) = P(A)\,P(B).
$$

Otherwise they are **dependent**.
:::

::::proposition[The informal versions agree]
If $P(A) \neq 0$ and $P(B) \neq 0$, then $P(B \mid A) = P(B)$ holds exactly when
$P(A \mid B) = P(A)$, and exactly when $A$ and $B$ are independent.

:::proof
(Notes Lec 3 p.3.) $P(B \mid A) = P(B)$ says $P(A \cap B)/P(A) = P(B)$, i.e.
$P(A \cap B) = P(A)P(B)$; dividing that by $P(B)$ instead gives $P(A \cap B)/P(B) = P(A)$,
i.e. $P(A \mid B) = P(A)$. Whichever event you condition on, the other is unmoved.
:::
::::

::::example[Two dice]
Roll two fair dice (36 equally likely pairs). Let $A$ = "the first die is even"
($P(A) = \tfrac12$), $B$ = "the sum is 7" ($P(B) = \tfrac{6}{36}$) and $C$ = "the sum is 8"
($P(C) = \tfrac{5}{36}$). Are $A$ and $B$ independent? $A$ and $C$?

:::solution
$A \cap B = \{(2,5), (4,3), (6,1)\}$ has probability $\tfrac{3}{36} = \tfrac12 \cdot \tfrac{6}{36}$:
$A$ and $B$ are independent — a sum of 7 can be reached from any first roll, so the first
die's parity says nothing about it.

$A \cap C = \{(2,6), (4,4), (6,2)\}$ has probability $\tfrac{3}{36}$, but
$P(A)P(C) = \tfrac{5}{72} \neq \tfrac{6}{72}$: dependent — a sum of 8 needs both dice even or
both odd, and there are three even-even pairs against two odd-odd ones.
:::
::::

```sim
id: independence-check
controls:
  - {id: pA, label: P(A), min: 0, max: 1, step: 0.005, default: 0.5, decimals: 3}
  - {id: pB, label: P(B), min: 0, max: 1, step: 0.005, default: 0.2, decimals: 3}
  - {id: pAB, label: "P(A ∩ B)", min: 0, max: 1, step: 0.005, default: 0.1, decimals: 3}
note: "Three tests of the same fact, side by side: P(A∩B) against P(A)·P(B), P(A|B) against P(A), P(B|A) against P(B). Independence is one equation, so all three pairs agree or none does. The defaults are an independent pair; nudge P(A∩B) to 0.15 or 0.05 and every comparison breaks at once. Mutually exclusive events with positive probabilities (P(A∩B) = 0) are always dependent — one happening rules the other out."
```

```python
# Independence is one equation, P(A∩B) = P(A)·P(B); the two conditional forms follow.
from fractions import Fraction as F
from itertools import product
from math import comb

def check(pA, pB, pAB):
    return pAB == pA * pB, pAB / pB, pAB / pA         # independent?, P(A|B), P(B|A)

print(*check(F(1, 2), F(1, 5), F(1, 10)))             # True 1/2 1/5: P(A|B) = P(A), P(B|A) = P(B)
print(*check(F(1, 2), F(1, 5), F(3, 20)))             # False 3/4 3/10: nudge P(A∩B) to 0.15 and all three break

# the two-dice example: A = first die even, B = sum 7, C = sum 8
S = list(product(range(1, 7), repeat=2))
P = lambda E: F(sum(1 for w in S if E(w)), 36)
A = lambda w: w[0] % 2 == 0
B = lambda w: w[0] + w[1] == 7
C = lambda w: w[0] + w[1] == 8
print('A, B:', P(lambda w: A(w) and B(w)) == P(A) * P(B))    # True  — independent
print('A, C:', P(lambda w: A(w) and C(w)) == P(A) * P(C))    # False — 3/36 against 5/72

# independent shots: a make with probability 0.7, three shots, exactly two makes
p, n, k = F(7, 10), 3, 2
print(p**k * (1 - p)**(n - k))                        # make, make, miss in that order: 147/1000
print(comb(n, k) * p**k * (1 - p)**(n - k))           # two makes in any order: 441/1000
```

### Independence survives complements

The theorem the lecture proved in full (Notes Lec 3 p.1):

::::theorem[Complements of independent events]
If $A$ and $B$ are independent, then so are (1) $A$ and $B'$, (2) $A'$ and $B$,
(3) $A'$ and $B'$.

:::proof
**(1)** $A$ splits into the two disjoint pieces $A = (A \cap B') \cup (A \cap B)$, so
$P(A) = P(A \cap B') + P(A)P(B)$ by independence, hence

$$
P(A \cap B') = P(A) - P(A)P(B) = P(A)\,[1 - P(B)] = P(A)\,P(B').
$$

**(2)** is the same argument with the roles swapped.

**(3)** By De Morgan and the addition rule,

$$
P(A' \cap B') = 1 - P(A \cup B) = 1 - [P(A) + P(B) - P(A)P(B)] = P(A') - P(B)\,[1 - P(A)] = P(A')\,[1 - P(B)] = P(A')\,P(B').
$$
:::
::::

Read the other way: if $A$ and $B$ are dependent, so are $A$ and $B'$ — dependence cannot be
removed by looking at the complement.

### More than two events

:::definition[Independence of k events]
Events $A_1, \dots, A_k$ are independent if and only if the probability of
the intersection of *any* 2, 3, …, $k$ of them is the product of their probabilities.
:::

For three events that is four equations, not one. In one direction, from the notes: if $A$,
$B$, $C$ are independent then so are $A$ and $B \cap C$, since
$P(A \cap (B \cap C)) = P(A)P(B)P(C) = P(A)\,P(B \cap C)$.

::::example[Pairwise is not enough]
Toss two fair coins and let $A$ = "first is heads", $B$ = "second is heads", $C$ = "the two
coins agree". Are $A$, $B$, $C$ independent?

:::solution
Each has probability $\tfrac12$, and each pair intersects in one of the four outcomes
($\tfrac14 = \tfrac12 \cdot \tfrac12$), so any two are independent — yet $A \cap B \cap C$ is
the single outcome $HH$, with probability $\tfrac14 \neq \tfrac18$. So the three are not
independent. Knowing any one of the three tells you nothing; knowing two tells you the third.
:::
::::

::::example[Free throws]
A free-throw shooter makes 70 % of her shots, each independent of the last. Find the
probability of three makes in a row, of two makes then a miss, and of two makes and a miss in
any order.

:::solution
When independence is given, joint probabilities are just products. Three makes in a row:
$0.7^3 = 0.343$. Two makes then a miss, in that order: $0.7 \cdot 0.7 \cdot 0.3 = 0.147$. Two
makes and a miss *in any order*: three times that, one term per position of the miss,
$0.441$. That factor of three is the seed of the binomial distribution later in the course.
:::
::::

## Through a partition: forwards and backwards

Many probabilities are reached through an intermediate stage: first one of several things
happens, then the outcome depends on which. Going forwards through the stage is the law of
total probability; going backwards — from the outcome to the stage — is Bayes' theorem.

### Forwards

:::definition[Partition]
Events $B_1, \dots, B_k$ form a **partition** of $S$ when they are pairwise mutually
exclusive and their union is $S$ (Notes Lec 3 p.3).
:::

::::theorem[Law of total probability]
If $B_1, \dots, B_k$ partition $S$ and every $P(B_i) \neq 0$, then for any event $A$

$$
P(A) = \sum_{i=1}^{k} P(B_i)\,P(A \mid B_i).
$$

:::proof
(As in the notes.)

$$
A = A \cap S = A \cap (B_1 \cup \cdots \cup B_k) = (A \cap B_1) \cup \cdots \cup (A \cap B_k),
$$

and these pieces are mutually exclusive because the $B_i$ are. So $P(A) = \sum_i P(A \cap B_i)$,
and the multiplication rule turns each term into $P(B_i)\,P(A \mid B_i)$.
:::
::::

::::example[Fog]
A flight is delayed by fog on 20 % of mornings. It leaves on time with probability 0.9 when
the morning is clear and 0.4 when it is foggy. How likely is it to leave on time?

:::solution
With $A$ = "on time" and $F$ = "fog", $F$ and $F'$ partition the mornings:

$$
P(A) = P(A \cap F) + P(A \cap F') = P(F)\,P(A \mid F) + P(F')\,P(A \mid F') = 0.2 \cdot 0.4 + 0.8 \cdot 0.9 = 0.80.
$$
:::
::::

::::example[Three mills]
A bakery buys 50 % of its flour from mill 1, 30 % from mill 2 and 20 % from mill 3. The
fraction of batches below specification is 2 % at mill 1, 5 % at mill 2 and 10 % at mill 3.
How likely is a batch picked at random to be below spec?

:::solution
$$
P(A) = 0.5 \cdot 0.02 + 0.3 \cdot 0.05 + 0.2 \cdot 0.10 = 0.010 + 0.015 + 0.020 = 0.045.
$$
:::
::::

```sim
id: total-prob-tree
controls:
  - {id: p1, label: "P(B₁)", min: 0, max: 1, step: 0.01, default: 0.5, decimals: 2}
  - {id: p2, label: "P(B₂)  (B₃ takes the rest)", min: 0, max: 1, step: 0.01, default: 0.3, decimals: 2}
  - {id: q1, label: "P(A | B₁)", min: 0, max: 1, step: 0.01, default: 0.02, decimals: 2}
  - {id: q2, label: "P(A | B₂)", min: 0, max: 1, step: 0.01, default: 0.05, decimals: 2}
  - {id: q3, label: "P(A | B₃)", min: 0, max: 1, step: 0.01, default: 0.1, decimals: 2}
note: "The tree of the three mills: the first level is the partition (which mill), the second the conditional probability of a below-spec batch. Each green leaf is a product P(Bᵢ)·P(A | Bᵢ); P(A) is their sum, because the leaves are the disjoint pieces A ∩ Bᵢ. Set P(B₁) = 0.2, P(B₂) = 0.8, P(A|B₁) = 0.4, P(A|B₂) = 0.9 for the fog example (0.80), with the third branch empty."
```

```python
# Law of total probability: add the A-leaves of the tree, one product per branch.
def total(prior, likelihood):
    leaves = [p * q for p, q in zip(prior, likelihood)]   # P(B_i)·P(A | B_i) = P(A ∩ B_i)
    return leaves, sum(leaves)

leaves, pA = total([0.5, 0.3, 0.2], [0.02, 0.05, 0.10])  # the three mills (the sim's defaults)
print([round(x, 3) for x in leaves], round(pA, 3))       # [0.01, 0.015, 0.02] 0.045
print(round(total([0.2, 0.8], [0.4, 0.9])[1], 2))        # the fog example: 0.8
```

### Backwards

Now reverse the question: a batch turns out to be below spec — which mill did it come from?
We know $P(A \mid B_3)$ and want $P(B_3 \mid A)$, the courier's asymmetry again. The
definition of $P(B_3 \mid A)$ needs $P(A \cap B_3)$ and $P(A)$, and we now have both: the
multiplication rule gives the numerator, the law of total probability the denominator.

::::theorem[Bayes' theorem]
If $B_1, \dots, B_k$ partition $S$ with every $P(B_i) \neq 0$, and $P(A) \neq 0$, then for
each $r$

$$
P(B_r \mid A) = \frac{P(B_r)\,P(A \mid B_r)}{\sum_{i=1}^{k} P(B_i)\,P(A \mid B_i)}.
$$

:::proof
$P(B_r \mid A) = P(A \cap B_r)/P(A)$; expand the numerator by the multiplication rule and the
denominator by total probability.
:::
::::

In the tree: the probability that $A$ was reached along branch $r$ is that branch's leaf
divided by the sum of all the $A$-leaves.

::::example[Three mills, backwards]
A batch is below spec. How likely is it to have come from mill 3?

:::solution
$$
P(B_3 \mid A) = \frac{0.2 \cdot 0.10}{0.010 + 0.015 + 0.020} = \frac{0.020}{0.045} \approx 0.44.
$$

Mill 3 supplies a fifth of the flour but is behind almost half of the bad batches: the
**prior** $P(B_3) = 0.20$ has been updated by the evidence to the **posterior** 0.44,
while mill 1's share drops from 0.50 to $0.010/0.045 \approx 0.22$.
:::
::::

```sim
id: bayes-posterior
controls:
  - {id: p1, label: "P(B₁)", min: 0, max: 1, step: 0.01, default: 0.5, decimals: 2}
  - {id: p2, label: "P(B₂)  (B₃ takes the rest)", min: 0, max: 1, step: 0.01, default: 0.3, decimals: 2}
  - {id: q1, label: "P(A | B₁)", min: 0, max: 1, step: 0.01, default: 0.02, decimals: 2}
  - {id: q2, label: "P(A | B₂)", min: 0, max: 1, step: 0.01, default: 0.05, decimals: 2}
  - {id: q3, label: "P(A | B₃)", min: 0, max: 1, step: 0.01, default: 0.1, decimals: 2}
  - {id: r, label: "spell out P(Bᵣ | A) for r", min: 1, max: 3, step: 1, default: 3, decimals: 0}
note: "Same sliders as the tree. Yellow bars are the prior P(Bᵢ), green bars the posterior P(Bᵢ | A); the posteriors always sum to 1 because the Bᵢ still partition the reduced sample space A. A cause whose conditional P(A | Bᵢ) is above the overall P(A) gains probability, one below loses. Make all three P(A | Bᵢ) equal and the posterior collapses onto the prior — A then carries no information about the cause."
```

```python
# Bayes over a partition: the posterior of each cause is its A-leaf divided by the
# sum of all A-leaves (the law of total probability).
def posterior(prior, likelihood):
    """prior[i] = P(B_i), likelihood[i] = P(A | B_i)."""
    joint = [p * q for p, q in zip(prior, likelihood)]
    pA = sum(joint)
    return [j / pA for j in joint], pA

post, pA = posterior([0.5, 0.3, 0.2], [0.02, 0.05, 0.10])   # the sim's defaults
print(round(pA, 3), [round(x, 3) for x in post])            # 0.045 [0.222, 0.333, 0.444]
print(round(sum(post), 10))                                 # 1.0 — the posteriors are a distribution
post, _ = posterior([0.5, 0.3, 0.2], [0.05, 0.05, 0.05])
print([round(x, 3) for x in post])                          # [0.5, 0.3, 0.2] — equal likelihoods: posterior = prior
```

### Base rates

::::example[A screening test]
A condition affects 0.2 % of a population. A screening test detects it in 95 % of those who
have it (sensitivity) and comes back negative for 98 % of those who do not (specificity).
Someone tests positive. How likely are they to have the condition?

:::solution
$$
P(D \mid +) = \frac{0.002 \cdot 0.95}{0.002 \cdot 0.95 + 0.998 \cdot 0.02} = \frac{0.0019}{0.0019 + 0.01996} \approx 0.087.
$$

Nine positives in ten are false alarms, with a test that is right 95–98 % of the time. The
reason is the base rate: the healthy group is five hundred times larger than the affected
one, so its 2 % of false positives (about 19 960 per million) swamps the 95 % of true
positives (about 1 900 per million).
:::
::::

```sim
id: rare-disease
controls:
  - {id: prev, label: "prevalence P(D)", min: 0.0001, max: 0.05, step: 0.0001, default: 0.002, decimals: 4}
  - {id: sens, label: "sensitivity P(+ | D)", min: 0.5, max: 1, step: 0.005, default: 0.95, decimals: 3}
  - {id: spec, label: "specificity P(− | D′)", min: 0.5, max: 1, step: 0.005, default: 0.98, decimals: 3}
note: "A million people sorted by truth and by test result (log scale, or the affected would be invisible). P(D | +) is the red 'test positive' bar measured against the blue one next to it. At the defaults the false positives outnumber the true positives ten to one. Raise the prevalence to 0.05 and the same test becomes useful; raise the specificity to 0.999 and it becomes useful even at 0.2 % — false positives, not missed cases, are what a screening test for a rare condition has to fight."
```

```python
# The screening test as counts per million people, then as Bayes with two causes.
prev, sens, spec, pop = 0.002, 0.95, 0.98, 1_000_000        # the sim's defaults

D = prev * pop                     # 2 000 have the condition
tp = D * sens                      # 1 900 true positives
fp = (pop - D) * (1 - spec)        # 19 960 false positives
print(round(tp), round(fp), round(tp / (tp + fp), 3))       # 1900 19960 0.087 — P(D | +)

def ppv(prev, sens=0.95, spec=0.98):
    return prev * sens / (prev * sens + (1 - prev) * (1 - spec))
print(round(ppv(0.05), 3), round(ppv(0.002, spec=0.999), 3))  # 0.714 0.656 — higher base rate or specificity
```

:::equations
- *Conditional probability*: $P(B \mid A) = P(A \cap B)/P(A)$, $P(A) \neq 0$; $P(\,\cdot \mid B)$ satisfies the postulates.
- *Multiplication rule*: $P(A \cap B) = P(A)P(B \mid A) = P(B)P(A \mid B)$; $P(A \cap B \cap C) = P(A)P(B \mid A)P(C \mid A \cap B)$.
- *Independence*: $P(A \cap B) = P(A)P(B)$ ⟺ $P(B \mid A) = P(B)$ ⟺ $P(A \mid B) = P(A)$; then $A, B'$ and $A', B$ and $A', B'$ are independent too. For $k$ events, every sub-collection must multiply.
- *Total probability*: $P(A) = \sum_i P(B_i)P(A \mid B_i)$ over a partition $B_1, \dots, B_k$.
- *Bayes*: $P(B_r \mid A) = P(B_r)P(A \mid B_r) \big/ \sum_i P(B_i)P(A \mid B_i)$.
:::

:::caution
Bayes' theorem itself is two lines from the definition and beyond dispute. What it consumes
is a set of **prior** probabilities $P(B_i)$, and those are an input: the base rate of the
condition, the mills' shares. Reasoning backwards from an effect to its cause is only as
good as the base rates it starts from — which is why every screening decision starts by
asking how common the condition is.
:::

:::insight
Conditioning replaces the sample space; every formula in this unit is the
old probability rules applied inside the new, smaller space and then rescaled by its
probability. Independence is the special case where the rescaling changes nothing, and
Bayes' theorem is nothing more than the definition of $P(B_r \mid A)$ with both numerator
and denominator expanded by the multiplication rule.
:::

## Further reading

- [Conditional probability](https://en.wikipedia.org/wiki/Conditional_probability) and [Independence (probability theory)](https://en.wikipedia.org/wiki/Independence_(probability_theory)) — Wikipedia, including the pairwise-vs-mutual distinction.
- [Bayes' theorem](https://en.wikipedia.org/wiki/Bayes%27_theorem) — Wikipedia; its drug-testing example is the screening computation with other numbers.
- [Base rate fallacy](https://en.wikipedia.org/wiki/Base_rate_fallacy) — why the screening result surprises people, and the natural-frequency presentation used in the last sim.
