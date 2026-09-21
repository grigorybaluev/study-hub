---
title: Conditional probability, independence and Bayes' theorem
order: 3
status: detailed
weeks: [2]
notes: ["Textbook §2.6 (Examples 15–21) · Notes Lec 3 (Wed 16 Sep 2026) p.2: Ex. 2.17, 2.18, the three-event multiplication rule", "Notes Lec 3 p.1: the theorem that independence survives complements, with the proof · p.3: Ex. 2.21, 2.27, 2.34 · Textbook §2.7 (Examples 22–24)", "Notes Lec 3 p.3: the law of total probability with the proof · Textbook §2.8 (Examples 25–26)", "Textbook §2.8 (Theorem 13, Examples 27–28) — Bayes' theorem was not yet in the lecture notes"]
textbook: "Miller & Miller, John E. Freund's Mathematical Statistics with Applications, 8e, 2.6-2.8"
introduces: [conditional-probability, independence, bayes-theorem]
requires:
  - {concept: probability, strength: hard}
  - {concept: inclusion-exclusion, strength: soft}
  - {concept: counting, strength: soft}
reinforces: []
---

"The probability that a lawyer earns more than 75 000 dollars" has no single answer: it depends on
which lawyers we are talking about — all graduates, those licensed, those in practice. Every
probability is relative to a sample space, and **conditioning** is the act of changing that
sample space in the middle of a problem. This unit follows the textbook's order: what
$P(A \mid B)$ means and how to compute it, the multiplication rule that turns it around,
independence as the case where conditioning changes nothing, and finally the two theorems
that let us compute a probability through intermediate stages (total probability) and reason
backwards from an effect to its cause (Bayes).

## Conditional probability

### A reduced sample space

The textbook's opening example is a table of 50 car dealers, classified by how long they have
been in business and by the quality of their warranty service:

|  | good service $G$ | poor service $G'$ | total |
|---|---|---|---|
| in business 10 years or more, $T$ | 16 | 4 | 20 |
| in business less than 10 years, $T'$ | 10 | 20 | 30 |
| total | 26 | 24 | 50 |

Pick a dealer at random (all 50 equally likely): $P(G) = 26/50 = 0.52$. Now pick at random
among the *established* dealers only. The sample space has shrunk to the top row — 20
dealers — and 16 of them give good service:

$$P(G \mid T) = \frac{n(T \cap G)}{n(T)} = \frac{16}{20} = 0.80.$$

Dividing numerator and denominator by $n(S) = 50$ rewrites this in terms of probabilities on
the *original* sample space, $P(G \mid T) = P(T \cap G)/P(T) = 0.32/0.40$, and that quotient
is the definition.

```sim
id: cond-table
controls:
  - {id: tg, label: "n(T ∩ G)", min: 0, max: 40, step: 1, default: 16, decimals: 0}
  - {id: tp, label: "n(T ∩ G′)", min: 0, max: 40, step: 1, default: 4, decimals: 0}
  - {id: ug, label: "n(T′ ∩ G)", min: 0, max: 40, step: 1, default: 10, decimals: 0}
  - {id: up, label: "n(T′ ∩ G′)", min: 0, max: 40, step: 1, default: 20, decimals: 0}
  - {id: cond, label: "condition on (0: nothing, 1: T, 2: T′)", min: 0, max: 2, step: 1, default: 1, decimals: 0}
note: "The four cells are the textbook's dealer table. Conditioning on T keeps only the top row lit: P(G | T) counts good-service dealers among those 20 alone. Set the last slider to 2 for P(G | T′) = 10/30 (Example 16), or to 0 to get back the unconditional P(G) = 26/50. Make one row empty to see why the definition needs P(T) ≠ 0."
```

> **Definition — conditional probability.** For events $A$ and $B$ in a sample space $S$ with
> $P(A) \neq 0$, the conditional probability of $B$ given $A$ is
> $$P(B \mid A) = \frac{P(A \cap B)}{P(A)}.$$
> Nothing in the definition needs equally likely outcomes; the table only motivated it.

The Venn-diagram picture: given $B$, the region outside $B$ is discarded, and what is left of
$A$ is $A \cap B$, measured against the new whole, $B$.

```sim
id: cond-venn
controls:
  - {id: pA, label: P(A), min: 0, max: 1, step: 0.01, default: 0.4, decimals: 2}
  - {id: pB, label: P(B), min: 0, max: 1, step: 0.01, default: 0.5, decimals: 2}
  - {id: pAB, label: "P(A ∩ B)", min: 0, max: 1, step: 0.01, default: 0.15, decimals: 2}
  - {id: given, label: "given (0: nothing, 1: B, 2: A)", min: 0, max: 2, step: 1, default: 1, decimals: 0}
note: "The yellow outline is the reduced sample space; everything outside it is greyed out and the box S is no longer the whole. P(A | B) is the share of B taken up by A ∩ B. Switch to 'given A' to see that P(B | A) is a different number with the same numerator — the two conditionals only agree when P(A) = P(B)."
```

> **Example — a loaded die (textbook Example 17).** A die shows 1, 2, 3, 4, 5, 6 with
> probabilities $\tfrac29, \tfrac19, \tfrac29, \tfrac19, \tfrac29, \tfrac19$. Let $A$ = "more
> than 3" and $B$ = "a perfect square", so $A = \{4, 5, 6\}$, $B = \{1, 4\}$ and
> $A \cap B = \{4\}$. Then $P(B) = \tfrac29 + \tfrac19 = \tfrac13$, while
> $$P(B \mid A) = \frac{P(A \cap B)}{P(A)} = \frac{1/9}{4/9} = \frac14.$$
> Check it the "reduced sample space" way: inside $A$ the odd face 5 is twice as likely as
> each even face, so the weights are $v, 2v, v$ with $4v = 1$, and the square 4 has
> probability $\tfrac14$. Same answer, no formula.

> **Example — shipping (Example 18).** $P(\text{ready on time}) = 0.80$ and
> $P(\text{ready and delivered on time}) = 0.72$, so
> $P(D \mid R) = 0.72/0.80 = 0.90$. The reverse, $P(R \mid D)$, cannot be found from these two
> numbers alone — it needs $P(D)$. Keep this asymmetry in mind for Bayes' theorem.

### Conditional probabilities are probabilities

Exercise 2.17, worked in class (Notes Lec 3 p.2): fix $B$ with $P(B) \neq 0$; then
$P(\,\cdot \mid B)$ satisfies the three postulates.

- $P(A \mid B) \ge 0$, because $P(A \cap B) \ge 0$ and $P(B) > 0$.
- $P(B \mid B) = P(B \cap B)/P(B) = 1$: the new sample space is certain.
- For mutually exclusive $A_1, A_2, \dots$ the union rule holds too:
  $P(A_1 \cup A_2 \cup \cdots \mid B) = P((A_1 \cap B) \cup (A_2 \cap B) \cup \cdots)/P(B) = P(A_1 \mid B) + P(A_2 \mid B) + \cdots$,
  since the $A_i \cap B$ are again mutually exclusive.

So every rule of the previous unit — complements, the addition rule, inclusion–exclusion —
holds with "$\mid B$" appended to each term. What does *not* hold is any rule about the
condition itself. Exercise 2.18: is $P(B \mid A) + P(B \mid A') = 1$? Sometimes. With the four
regions of a Venn diagram each of probability $\tfrac14$,
$P(B \mid A) + P(B \mid A') = \tfrac{1/4}{1/2} + \tfrac{1/4}{1/2} = 1$; make the regions
unequal and it fails — $A$ and $A'$ are different sample spaces, and there is no reason the two
fractions should add up to anything in particular.

> **Note — Ex. 2.34 (Notes Lec 3 p.3).** $P(A \cup B) \ge 1 - P(A') - P(B')$. Proof:
> $P(A \cup B) = 1 - P(A' \cap B')$ and $P(A' \cap B') \le P(A') + P(B')$ by the addition
> rule. This kind of bound (Bonferroni) is what you reach for when the intersection is unknown.

## The multiplication rule

Multiply the definition by $P(A)$ and the conditional probability becomes a tool for
computing joint probabilities in stages.

> **Theorem 9 — multiplication rule.** If $P(A) \neq 0$,
> $$P(A \cap B) = P(A)\,P(B \mid A),$$
> and by symmetry $P(A \cap B) = P(B)\,P(A \mid B)$ when $P(B) \neq 0$.

> **Example — two aces (Example 20).** Draw two cards from a deck.
> *Without replacement:* $P(\text{ace, ace}) = \frac{4}{52} \cdot \frac{3}{51} = \frac1{221}$ —
> the second factor is a conditional probability, computed on the 51-card deck that remains.
> *With replacement:* $\frac{4}{52} \cdot \frac{4}{52} = \frac1{169}$. The textbook adds that the
> temporal order is a convenience, not a requirement: the probability that the first card was
> an ace given that the second is an ace is also $\tfrac{3}{51}$.

```sim
id: draw-replacement
controls:
  - {id: N, label: items N, min: 2, max: 100, step: 1, default: 52, decimals: 0}
  - {id: d, label: special items d, min: 1, max: 20, step: 1, default: 4, decimals: 0}
  - {id: n, label: draws n, min: 1, max: 5, step: 1, default: 2, decimals: 0}
note: "Each bar is the probability that the next draw is special, given every earlier draw was: without replacement the numerator and denominator both drop by one per draw (4/52, then 3/51), with replacement nothing changes. The legend multiplies the bars — the multiplication rule chained n times. Defaults give the two-aces example; N = 100, d = 15, n = 2 is the shape of the television-set example, N = 20, d = 5, n = 3 the fuses (1/114)."
```

For three events the rule chains: write $A \cap B \cap C = (A \cap B) \cap C$ and apply
Theorem 9 twice (Notes Lec 3 p.2, textbook Theorem 10). Provided $P(A \cap B) \neq 0$,

$$P(A \cap B \cap C) = P(A \cap B)\,P(C \mid A \cap B) = P(A)\,P(B \mid A)\,P(C \mid A \cap B).$$

> **Example — fuses (Example 21).** 20 fuses, 5 defective, 3 drawn without replacement. All
> three defective: $\frac{5}{20} \cdot \frac{4}{19} \cdot \frac{3}{18} = \frac{1}{114}$. Each
> factor is conditioned on everything before it. The same pattern extends to $k$ events by
> induction (Exercise 2.19 does four).

```python
from fractions import Fraction
def all_special(N, d, n, replace=False):
    """P(all n draws special) by the chained multiplication rule."""
    p = Fraction(1)
    for i in range(n):
        p *= Fraction(d, N) if replace else Fraction(d - i, N - i)
    return p
print(all_special(52, 4, 2), all_special(52, 4, 2, replace=True))   # 1/221 1/169
print(all_special(20, 5, 3))                                         # 1/114
```

## Independence

Informally, $A$ and $B$ are independent when knowing that one happened does not change the
probability of the other: $P(B \mid A) = P(B)$. Substituting that into the multiplication rule
gives $P(A \cap B) = P(A) P(B)$, and the textbook takes the product form as the definition —
it is symmetric, and it still makes sense when $P(A) = 0$ or $P(B) = 0$.

> **Definition — independence.** $A$ and $B$ are **independent** if and only if
> $$P(A \cap B) = P(A)\,P(B).$$
> Otherwise they are **dependent**.

> **Example — three coins (Example 22).** Eight equally likely outcomes. $A$ = "heads on the
> first two tosses" $= \{HHH, HHT\}$, $B$ = "tail on the third" $= \{HHT, HTT, THT, TTT\}$,
> $C$ = "exactly two tails" $= \{HTT, THT, TTH\}$.
> $P(A)P(B) = \tfrac14 \cdot \tfrac12 = \tfrac18 = P(A \cap B)$: independent.
> $P(B)P(C) = \tfrac12 \cdot \tfrac38 = \tfrac{3}{16} \neq \tfrac14 = P(B \cap C)$: dependent —
> a tail on the third toss makes "exactly two tails" more likely.

```sim
id: independence-check
controls:
  - {id: pA, label: P(A), min: 0, max: 1, step: 0.005, default: 0.25, decimals: 3}
  - {id: pB, label: P(B), min: 0, max: 1, step: 0.005, default: 0.5, decimals: 3}
  - {id: pAB, label: "P(A ∩ B)", min: 0, max: 1, step: 0.005, default: 0.125, decimals: 3}
note: "Three tests of the same fact, side by side: P(A∩B) against P(A)·P(B), P(A|B) against P(A), P(B|A) against P(B). Independence is one equation, so all three pairs agree or none does. The defaults are A and B of the three-coin example; set P(A) = 0.5, P(B) = 0.375, P(A∩B) = 0.25 for the dependent pair B, C. Mutually exclusive events with positive probabilities (P(A∩B) = 0) are always dependent."
```

Exercise 2.21 (Notes Lec 3 p.3) shows the two informal versions agree: if $P(B \mid A) = P(B)$
and $P(B) \neq 0$, then $P(A \cap B)/P(A) = P(B)$ gives $P(A \cap B)/P(B) = P(A)$, i.e.
$P(A \mid B) = P(A)$.

### Independence survives complements

The theorem the lecture built up in full (Notes Lec 3 p.1; textbook Theorem 11 and
Exercise 2.22):

> **Theorem.** If $A$ and $B$ are independent, then so are (1) $A$ and $B'$, (2) $A'$ and $B$,
> (3) $A'$ and $B'$.

**Proof of (1).** $A$ splits into the two disjoint pieces $A = (A \cap B') \cup (A \cap B)$, so
$P(A) = P(A \cap B') + P(A)P(B)$ by independence, hence

$$P(A \cap B') = P(A) - P(A)P(B) = P(A)\,[1 - P(B)] = P(A)\,P(B').$$

(2) is the same argument with the roles swapped. **Proof of (3).** By De Morgan and the
addition rule,

$$P(A' \cap B') = 1 - P(A \cup B) = 1 - [P(A) + P(B) - P(A)P(B)] = P(A') - P(B)\,[1 - P(A)] = P(A')\,[1 - P(B)] = P(A')\,P(B'). \qquad \blacksquare$$

Contrapositive (Exercise 2.23): if $A$ and $B$ are dependent, so are $A$ and $B'$.

### More than two events

> **Definition.** Events $A_1, \dots, A_k$ are independent if and only if the probability of
> the intersection of *any* 2, 3, …, $k$ of them is the product of their probabilities.

For three events that is four equations, not one: the three pairwise products *and*
$P(A \cap B \cap C) = P(A)P(B)P(C)$. The textbook's Example 23 has three events each of
probability $\tfrac12$ with every pairwise intersection of probability $\tfrac14$ but
$P(A \cap B \cap C) = \tfrac14 \neq \tfrac18$: pairwise independent, not independent. The
reverse failure is possible too (Exercise 2.24). Exercise 2.27, from the notes: if $A$, $B$, $C$
are independent then $A$ and $B \cap C$ are independent, since
$P(A \cap (B \cap C)) = P(A)P(B)P(C) = P(A)\,P(B \cap C)$.

When independence *is* given, joint probabilities are just products (Example 24): three
heads in three tosses, $(\tfrac12)^3 = \tfrac18$; four sixes then a non-six in five rolls,
$(\tfrac16)^4 \cdot \tfrac56 = \tfrac{5}{7776}$. The order matters in the second one — "four
sixes and a non-six in any order" is five times as likely, one term per position of the
non-six. This is the seed of the binomial distribution later in the course.

```python
from fractions import Fraction
from math import comb
p, n, k = Fraction(3, 4), 3, 1          # a hit with probability 3/4, three shots, exactly one hit
print(p**k * (1 - p)**(n - k))          # hit then two misses, in that order: 3/64
print(comb(n, k) * p**k * (1 - p)**(n - k))   # one hit in any order: 9/64
```

## The law of total probability

Often an outcome is reached through an intermediate stage with several alternatives, and we
know the probability of the outcome *within* each alternative.

> **Example — the strike (Example 25).** A job is delayed by a strike with probability 0.60;
> it finishes on time with probability 0.85 if there is no strike and 0.35 if there is. With
> $A$ = "on time" and $B$ = "strike",
> $$P(A) = P(A \cap B) + P(A \cap B') = P(B)\,P(A \mid B) + P(B')\,P(A \mid B') = 0.60 \cdot 0.35 + 0.40 \cdot 0.85 = 0.55.$$

The general statement uses a **partition** of $S$: events $B_1, \dots, B_k$ that are pairwise
mutually exclusive and whose union is $S$ (Notes Lec 3 p.3).

> **Theorem 12 — total probability (rule of elimination).** If $B_1, \dots, B_k$ partition $S$
> and every $P(B_i) \neq 0$, then for any event $A$
> $$P(A) = \sum_{i=1}^{k} P(B_i)\,P(A \mid B_i).$$

**Proof (as in the notes).** $A = A \cap S = A \cap (B_1 \cup \cdots \cup B_k) = (A \cap B_1) \cup \cdots \cup (A \cap B_k)$,
and these pieces are mutually exclusive because the $B_i$ are. So $P(A) = \sum_i P(A \cap B_i)$,
and the multiplication rule turns each term into $P(B_i)\,P(A \mid B_i)$. $\blacksquare$

> **Example — rental cars (Example 26).** A firm rents 60 % of its cars from agency 1, 30 %
> from agency 2, 10 % from agency 3; the proportions needing an oil change are 9 %, 20 %, 6 %.
> $$P(A) = 0.60 \cdot 0.09 + 0.30 \cdot 0.20 + 0.10 \cdot 0.06 = 0.054 + 0.060 + 0.006 = 0.12.$$

```sim
id: total-prob-tree
controls:
  - {id: p1, label: "P(B₁)", min: 0, max: 1, step: 0.01, default: 0.6, decimals: 2}
  - {id: p2, label: "P(B₂)  (B₃ takes the rest)", min: 0, max: 1, step: 0.01, default: 0.3, decimals: 2}
  - {id: q1, label: "P(A | B₁)", min: 0, max: 1, step: 0.01, default: 0.09, decimals: 2}
  - {id: q2, label: "P(A | B₂)", min: 0, max: 1, step: 0.01, default: 0.2, decimals: 2}
  - {id: q3, label: "P(A | B₃)", min: 0, max: 1, step: 0.01, default: 0.06, decimals: 2}
note: "The tree of the rental-car example: the first level is the partition (which agency), the second the conditional probabilities of an oil change. Each green leaf is a product P(Bᵢ)·P(A | Bᵢ); P(A) is their sum, because the leaves are the disjoint pieces A ∩ Bᵢ. Set P(B₁) = 0.6, P(B₂) = 0.4, P(A|B₁) = 0.35, P(A|B₂) = 0.85 for the strike example (0.55), with the third branch empty."
```

## Bayes' theorem

Now reverse the question. Given that a delivered car needs an oil change, what is the
probability it came from agency 2? We know $P(A \mid B_2)$ and want $P(B_2 \mid A)$ — the
asymmetry from the shipping example, resolved by supplying $P(A)$ through the theorem above.

> **Theorem 13 — Bayes' theorem.** If $B_1, \dots, B_k$ partition $S$ with every
> $P(B_i) \neq 0$, and $P(A) \neq 0$, then for each $r$
> $$P(B_r \mid A) = \frac{P(B_r)\,P(A \mid B_r)}{\sum_{i=1}^{k} P(B_i)\,P(A \mid B_i)}.$$

**Proof.** $P(B_r \mid A) = P(A \cap B_r)/P(A)$ by definition; the numerator is
$P(B_r)\,P(A \mid B_r)$ by the multiplication rule and the denominator is Theorem 12.
$\blacksquare$ In tree language: the probability that $A$ was reached along branch $r$ is
that branch's leaf divided by the sum of all the $A$-leaves.

> **Example — rental cars again (Example 27).**
> $$P(B_2 \mid A) = \frac{0.30 \cdot 0.20}{0.054 + 0.060 + 0.006} = \frac{0.060}{0.120} = 0.5.$$
> Agency 2 supplies 30 % of the cars but half of the ones that need an oil change: the
> **prior** $P(B_2) = 0.30$ has been updated by the evidence to the **posterior** 0.50.

```sim
id: bayes-posterior
controls:
  - {id: p1, label: "P(B₁)", min: 0, max: 1, step: 0.01, default: 0.6, decimals: 2}
  - {id: p2, label: "P(B₂)  (B₃ takes the rest)", min: 0, max: 1, step: 0.01, default: 0.3, decimals: 2}
  - {id: q1, label: "P(A | B₁)", min: 0, max: 1, step: 0.01, default: 0.09, decimals: 2}
  - {id: q2, label: "P(A | B₂)", min: 0, max: 1, step: 0.01, default: 0.2, decimals: 2}
  - {id: q3, label: "P(A | B₃)", min: 0, max: 1, step: 0.01, default: 0.06, decimals: 2}
  - {id: r, label: "spell out P(Bᵣ | A) for r", min: 1, max: 3, step: 1, default: 2, decimals: 0}
note: "Same sliders as the tree. Yellow bars are the prior P(Bᵢ), green bars the posterior P(Bᵢ | A); the posteriors always sum to 1 because the Bᵢ still partition the reduced sample space A. A cause whose conditional P(A | Bᵢ) is above the overall P(A) gains probability, one below loses. Make all three P(A | Bᵢ) equal and the posterior collapses onto the prior — A then carries no information about the cause."
```

> **Example — a rare disease (Example 28).** A disease affects 0.01 % of a population. A test
> is positive for 98 % of carriers and for 3 % of non-carriers. For a person who tests
> positive,
> $$P(D' \mid +) = \frac{0.9999 \cdot 0.03}{0.0001 \cdot 0.98 + 0.9999 \cdot 0.03} = \frac{0.029997}{0.000098 + 0.029997} \approx 0.997.$$
> Almost every positive result is a false alarm, even with a good test, because the healthy
> group is ten thousand times larger than the sick one. Counting people makes this obvious:
> in a million, 100 are sick and about 98 test positive; of the 999 900 healthy, about
> 29 997 test positive.

```sim
id: rare-disease
controls:
  - {id: prev, label: "prevalence P(D)", min: 0.0001, max: 0.05, step: 0.0001, default: 0.0001, decimals: 4}
  - {id: sens, label: "sensitivity P(+ | D)", min: 0.5, max: 1, step: 0.005, default: 0.98, decimals: 3}
  - {id: spec, label: "specificity P(− | D′)", min: 0.5, max: 1, step: 0.005, default: 0.97, decimals: 3}
note: "A million people sorted by truth and by test result (log scale, or the sick would be invisible). P(D | +) is the red 'test positive' bar measured against the blue one next to it. At the textbook's numbers the false positives outnumber the true positives 300 to 1. Raise the prevalence to 0.05 and the same test becomes useful; raise the specificity to 0.999 and it becomes useful even for the rare disease — false positives, not missed cases, are what a screening test for a rare condition has to fight."
```

```python
def posterior(prior, likelihood):
    """Bayes over a partition: prior[i] = P(B_i), likelihood[i] = P(A | B_i)."""
    joint = [p * q for p, q in zip(prior, likelihood)]
    pA = sum(joint)
    return [j / pA for j in joint], pA
post, pA = posterior([0.6, 0.3, 0.1], [0.09, 0.20, 0.06])
print(round(pA, 3), [round(x, 3) for x in post])         # 0.12 [0.45, 0.5, 0.05]
post, _ = posterior([0.0001, 0.9999], [0.98, 0.03])
print(round(post[1], 3))                                  # 0.997 — P(no disease | positive)
```

The textbook closes with a warning that is worth repeating: the *theorem* is beyond dispute
— it is two lines from the definition — but the *prior* probabilities $P(B_i)$ it consumes
are an input, and arguments about Bayesian reasoning are arguments about where those come
from. Reasoning "from effect to cause" is only as good as the causes' base rates.

**Equations**

- *Conditional probability*: $P(B \mid A) = P(A \cap B)/P(A)$, $P(A) \neq 0$; the postulates hold for $P(\,\cdot \mid B)$.
- *Multiplication rule*: $P(A \cap B) = P(A)P(B \mid A) = P(B)P(A \mid B)$; $P(A \cap B \cap C) = P(A)P(B \mid A)P(C \mid A \cap B)$.
- *Independence*: $P(A \cap B) = P(A)P(B)$ ⟺ $P(B \mid A) = P(B)$ ⟺ $P(A \mid B) = P(A)$; then $A, B'$ and $A', B$ and $A', B'$ are independent too. For $k$ events, every sub-collection must multiply.
- *Total probability*: $P(A) = \sum_i P(B_i)P(A \mid B_i)$ over a partition $B_1, \dots, B_k$.
- *Bayes*: $P(B_r \mid A) = P(B_r)P(A \mid B_r) \big/ \sum_i P(B_i)P(A \mid B_i)$.

> **Key insight.** Conditioning replaces the sample space; every formula in this unit is the
> old probability rules applied inside the new, smaller space and then rescaled by its
> probability. Independence is the special case where the rescaling changes nothing, and
> Bayes' theorem is nothing more than the definition of $P(B_r \mid A)$ with both numerator
> and denominator expanded by the multiplication rule.

## Further reading

- Miller & Miller, *John E. Freund's Mathematical Statistics with Applications*, 8e, §2.6–2.8 — Examples 15–28 and Exercises 17–34 are the ones the lecture worked from.
- [Conditional probability](https://en.wikipedia.org/wiki/Conditional_probability) and [Independence (probability theory)](https://en.wikipedia.org/wiki/Independence_(probability_theory)) — Wikipedia, including the pairwise-vs-mutual distinction.
- [Bayes' theorem](https://en.wikipedia.org/wiki/Bayes%27_theorem) — Wikipedia; the drug-testing example there is the rare-disease computation with different numbers.
- [Base rate fallacy](https://en.wikipedia.org/wiki/Base_rate_fallacy) — why the rare-disease result surprises people, and the natural-frequency presentation used in the last sim.
