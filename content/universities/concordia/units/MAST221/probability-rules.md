---
title: Probability of an event and its rules
order: 2
status: detailed
weeks: [1, 2]
introduces: [probability, inclusion-exclusion]
requires:
  - {concept: sample-space, strength: hard}
  - {concept: event, strength: hard}
  - {concept: counting, strength: soft}
reinforces: []
---

Assigning probabilities to events (classical, empirical), the axioms, and the rules that
follow: complements, monotonicity, addition rule and inclusion-exclusion.

## Theoretical Probability

### Two approaches to probability

There are two basic approaches to assigning probabilities to events:

- **Theoretical** — uses basic assumptions and a reasoning process.
- **Empirical** — determined by experimentation: we assign probabilities to events based on the results of actual experiments.

We first consider the theoretical approach.

### The equally likely assumption

:::definition[Equally likely outcomes]
The **equally likely assumption** means that all simple events have the same probability. If there are $n$ simple events, each has probability $1/n$. This is a **theoretical probability**.
:::

:::definition[Probability of an event]
The **probability of an event** is the sum of the probabilities of the simple events that constitute the event. Under the equally likely assumption, the probability of a compound event is the number of elements in the event divided by the number of elements of the sample space:

$$
P(E) = \frac{n(E)}{n(S)}
$$

(Also written $P(A) = \dfrac{n(m)}{n(S)}$, with $n(m)$ the number of favourable outcomes.)
:::

### Steps for finding the probability of an event $E$

:::steps[Finding P(E)]
1. Set up an appropriate sample space $S$ for the experiment.
2. Assign acceptable probabilities to the simple events in $S$ (theoretically or empirically).
3. To obtain the probability of an arbitrary event $E$, *add* the probabilities of the simple events in $E$.
:::

::::example[sum of 7]
Find the probability of a sum of 7 when two dice are rolled.

:::solution
Look back at the 36-outcome sample space: $n(S) = 36$. Six of these 36 possibilities give a sum of 7:

$$
E = \{(1,6),\ (6,1),\ (2,5),\ (5,2),\ (4,3),\ (3,4)\}
$$

The outcome $(1,6)$ is different from $(6,1)$: $(1,6)$ means a one on the first die and a six on the second, while $(6,1)$ is a six on the first and a one on the second. The answer is

$$
P(E) = \frac{n(E)}{n(S)} = \frac{6}{36} = \frac{1}{6}.
$$
:::
::::

::::example[at least one head]
Toss two coins. Find the probability of at least one head appearing.

:::solution
“At least one head” is interpreted as “one head or two heads”. This is a theoretical probability.
- **Step 1:** the sample space is $\{HH, HT, TH, TT\}$ — four possible outcomes.
- **Step 2:** how many outcomes are in the event “at least one head”? Three: $\{HH, HT, TH\}$.
- **Step 3:** $P(E) = \dfrac{n(E)}{n(S)} = \dfrac{3}{4} = 0.75 = 75\%$.
:::
::::

:::note
Step 3 is why the sample space must be chosen with equally likely outcomes: “add the probabilities of the simple events” only collapses to “count and divide” when each simple event has the same probability $1/n(S)$.
:::

:::equations
- *Equally likely simple events*: $P(e_i) = \frac{1}{n} \quad (i = 1,\dots,n)$ — n = n(S) simple events, each with the same probability.
- *Probability of an event*: $P(E) = \sum_{e_i \in E} P(e_i) = \frac{n(E)}{n(S)}$ — Sum of the simple events in E; equals the counting ratio under the equally likely assumption.
- *Sum of 7 with two dice*: $P(\text{sum}=7) = \frac{6}{36} = \frac{1}{6}$ — (1,6),(6,1),(2,5),(5,2),(3,4),(4,3).
- *At least one head, two coins*: $P(\ge 1\ H) = \frac{3}{4} = 0.75$ — {HH, HT, TH} out of {HH, HT, TH, TT}.
:::

```sim
id: coin-event-grid
controls:
  - {id: k, label: Number of coins tossed k, min: 1, max: 5, step: 1, default: 2, decimals: 0}
  - {id: m, label: 'Event E: at least m heads', min: 0, max: 5, step: 1, default: 1, decimals: 0}
note: 'The 2^k equally likely outcomes of tossing k coins (Step 1), with the outcomes belonging to E highlighted (Step 2). P(E) = n(E)/n(S) (Step 3). The default is the classic case: two coins, at least one head → 3/4. m = 0 gives the certain event (P = 1); m > k gives the impossible event (P = 0).'
```

```python
# Fraction keeps the answers exact (6/36 → 1/6), as fractions.
from fractions import Fraction
import itertools

S = list(itertools.product(range(1, 7), repeat=2))   # Step 1: sample space, 36 equally likely outcomes

def P(event):                                          # Steps 2–3: count and divide
    return Fraction(sum(1 for s in S if event(s)), len(S))

print('P(sum = 7)  =', P(lambda s: s[0] + s[1] == 7))     # 1/6
print('P(sum = 11) =', P(lambda s: s[0] + s[1] == 11))    # 1/18
print('P(double)   =', P(lambda s: s[0] == s[1]))         # 1/6

coins = ['HH', 'HT', 'TH', 'TT']
print('P(at least one H) =', Fraction(sum('H' in c for c in coins), len(coins)))  # 3/4
```

:::insight
Theoretical probability = counting: $P(E) = n(E)/n(S)$, valid only when the simple events of $S$ are equally likely. Always list $S$ first, then count the outcomes in $E$.
:::

## Empirical Probability & Simulation

### Relative frequency

:::definition[Relative frequency]
If we conduct an experiment $n$ times and event $E$ occurs with frequency $f(E)$, then the ratio

$$
\frac{f(E)}{n}
$$

is called the **relative frequency** or **approximate empirical probability** of the occurrence of event $E$ in $n$ trials.
:::

Empirical probability relies upon the *long-run* relative frequency of an event.

- Out of the last 1000 statistics students, 150 received an A. Thus the empirical probability that a student receives an A is $150/1000 = 0.15$.
- The batting average of a major-league ball player can be interpreted as the probability that he gets a hit on a given time at bat.

### Theoretical versus empirical probability

What does it mean to say that the probability of getting a sum of 7 upon rolling two dice is $1/6$? This is the **long-range probability** or **theoretical probability**, based upon the assumption that all possible rolls are equally likely. It is calculated *without* doing an experiment.

The theoretical probability of an event should be close to the **experimental probability** if the experiment is repeated a great number of times. If you rolled two dice a great number of times, in the long run the proportion of times a sum of 7 came up would be approximately $1/6$.

### Simulation and empirical probabilities

::::example[Simulating 100 rolls of two dice]
We can use the random-number feature of a graphing calculator to simulate 100 rolls of two dice. Determine the empirical probabilities of the following events and compare them with the theoretical probabilities:
- (A) $E_1$ = a sum of 7 turns up;
- (B) $E_2$ = a sum of 11 turns up.

:::solution
A graphing calculator can select a random integer from 1 to 6; each of the six integers is equally likely. By selecting a random integer from 1 to 6 and adding it to a second random integer from 1 to 6, we simulate rolling two dice and recording the sum:

`randInt(1,6)+randInt(1,6)` → one roll (e.g. 6).   `randInt(1,6,100)+randInt(1,6,100)→L1` → 100 rolls stored in list $L_1$: `{6 6 3 12 9 6 6 …}`

Plotting a histogram of $L_1$, an outcome of 7 is the highest bar; it occurs 20 times out of 100. Therefore

- empirical $P(E_1) = 20/100 = 0.20$; theoretical $P(E_1) = 6/36 \approx 0.167$;
- empirical $P(E_2) = 6/100 = 0.06$; theoretical $P(E_2) = 2/36 \approx 0.056$.

If you simulate this experiment on your own calculator, you should *not* expect to get the same empirical probabilities.
:::
::::

:::note
Run the simulation below several times at $n = 100$ and watch the empirical values jump around the theoretical ones; then push $n$ to a few thousand and watch them settle. That settling is the “long-run” in “long-run relative frequency”.
:::

:::equations
- *Relative frequency*: $P(E) \approx \frac{f(E)}{n}$ — f(E) = number of trials in which E occurred, out of n trials.
- *Long-run interpretation*: $\frac{f(E)}{n} \;\longrightarrow\; P(E) \quad \text{as } n \to \infty$ — Relative frequency approaches the theoretical probability for many repetitions.
- *The 100-roll simulation*: $\hat P(E_1) = \tfrac{20}{100} = 0.20 \quad\text{vs}\quad \tfrac{6}{36} \approx 0.167$ and $\hat P(E_2) = \tfrac{6}{100} = 0.06 \quad\text{vs}\quad \tfrac{2}{36} \approx 0.056$ — One particular run; yours will differ.
:::

```sim
id: empirical-dice
controls:
  - {id: n, label: Number of rolls n, min: 5, max: 1000, step: 5, default: 100, decimals: 0}
note: Bars are the histogram of simulated sums (like the calculator's L₁); the markers are the theoretical expected counts n·P(sum). Press Update to re-roll with the same n — at n = 5 or 10 the empirical P(7) is all over the place; at n = 1000 it stays close to 0.167.
...
```

```python
# NumPy plays the role of the calculator's randInt. Increasing n shows the relative
# frequencies converging to 1/6 and 1/18.
import numpy as np

rng = np.random.default_rng()

def simulate(n):
    """randInt(1,6,n) + randInt(1,6,n) -> L1"""
    L1 = rng.integers(1, 7, n) + rng.integers(1, 7, n)
    return L1

for n in (100, 1000, 100_000):
    L1 = simulate(n)
    p7  = np.mean(L1 == 7)      # relative frequency f(E1)/n
    p11 = np.mean(L1 == 11)     # relative frequency f(E2)/n
    print(f'n={n:>7}:  P(E1=sum 7) ~ {p7:.3f} (theory {6/36:.3f})   '
          f'P(E2=sum 11) ~ {p11:.3f} (theory {2/36:.3f})')
```

:::insight
Empirical probability = relative frequency $f(E)/n$ from real (or simulated) trials. It fluctuates from run to run, but as $n$ grows it approaches the theoretical probability — which is what the theoretical number means in the first place.
:::

## Properties of Probability, Complements & ∅

### Some properties of probability

:::proposition[Properties of probability]
$$
0 \le P(E) \le 1
\qquad
P(E_1) + P(E_2) + P(E_3) + \dots = 1
$$

In particular, for an event $A$: $\;P(A) \ge 0$, $\;0 \le P(A) \le 1$, and for the simple events $A_1, \dots, A_n$ of $S$: $P(A_1) + P(A_2) + \dots + P(A_n) = 1$.
- The **first property** states that the probability of any event will always be a number between 0 and 1 (inclusive). If $P(E) = 0$, we say that $E$ is an **impossible event**. If $P(E) = 1$, we call $E$ a **certain event**. (Some have said that there are two certainties in life: death and taxes.)
- The **second property** states that the sum of the probabilities of all simple events of the sample space must equal 1.
:::

### Consequence 1 — complements

::::corollary[Complement rule]
Let $A'$ denote the complement of $A$ (everything in $S$ that is not in $A$). Then $P(A') = 1 - P(A)$ — often the fastest way to compute “at least one …” probabilities.

:::proof
Since $A$ and $A'$ are mutually exclusive and together fill $S$,

$$
S = A \cup A' \;\Rightarrow\; P(S) = P(A \cup A') \;\Rightarrow\; P(A) + P(A') = 1 .
$$
:::
::::

### Consequence 2 — the empty event

::::corollary[The empty event]
$P(\varnothing) = 0$.

:::proof
$S = S \cup \varnothing$, and $S$, $\varnothing$ are mutually exclusive, so

$$
P(S) = P(S) + P(\varnothing).
$$

But $P(S) = 1$, hence $1 = 1 + P(\varnothing) \;\Rightarrow\; P(\varnothing) = 0$.
:::
::::

:::note
These two derivations use only “probabilities of mutually exclusive events add” — the additivity rule that the counting formula $P(E) = n(E)/n(S)$ makes obvious, and which the next unit turns into the general addition rule.
:::

:::equations
- *Range*: $0 \le P(E) \le 1$ — P(E) = 0: impossible event; P(E) = 1: certain event.
- *Total probability*: $\sum_i P(E_i) = 1 \quad\text{over all simple events } E_i \text{ of } S$ — Equivalent to P(S) = 1.
- *Complement*: $S = A \cup A' \;\Rightarrow\; P(A) + P(A') = 1$ — A and A′ are mutually exclusive and exhaustive.
- *Empty event*: $S = S \cup \varnothing \;\Rightarrow\; P(S) = P(S) + P(\varnothing) \;\Rightarrow\; P(\varnothing) = 0$ — Uses P(S) = 1.
:::

```sim
id: complement-rule
controls:
  - {id: k, label: Number of coins tossed k, min: 1, max: 10, step: 1, default: 2, decimals: 0}
note: 'A = "at least one head" and A′ = "no heads" are complements, so the two bars always fill the whole interval [0, 1]: P(A) + P(A′) = 1. P(A′) = (1/2)^k is easy to count, so P(A) = 1 − (1/2)^k comes for free.'
```

```python
# Checking the properties on the two-dice sample space (complements add to 1, P(∅) =
# 0, P(S) = 1), then a stacked bar chart: for every event, P(A) and P(A′) together
# fill the interval [0, 1].
from fractions import Fraction
import itertools
import matplotlib.pyplot as plt

S = list(itertools.product(range(1, 7), repeat=2))
P = lambda ev: Fraction(sum(1 for s in S if ev(s)), len(S))

A      = lambda s: s[0] + s[1] >= 10          # sum at least 10
A_comp = lambda s: not A(s)                    # complement A'

print('P(A)  =', P(A))                         # 6/36 = 1/6
print("P(A') =", P(A_comp))                    # 30/36 = 5/6
print("P(A) + P(A') =", P(A) + P(A_comp))      # 1
print('P(empty) =', P(lambda s: False))         # 0
print('P(S)     =', P(lambda s: True))          # 1

# Visualise P(A) + P(A') = 1 for several events A
events = {'sum >= 10': A,
          'sum = 7':   lambda s: s[0] + s[1] == 7,
          'doubles':   lambda s: s[0] == s[1],
          'first = 6': lambda s: s[0] == 6}
names = list(events)
pA  = [float(P(ev)) for ev in events.values()]
pAc = [1 - p for p in pA]
plt.barh(names, pA,  color='seagreen', label='P(A)')
plt.barh(names, pAc, left=pA, color='lightgray', label="P(A') = 1 - P(A)")
plt.xlim(0, 1); plt.xlabel('probability'); plt.legend(loc='lower right')
plt.title("Every bar has total length 1: P(A) + P(A') = 1")
plt.show()
```

:::insight
Probabilities live in $[0, 1]$, the whole sample space has probability 1, and probabilities of mutually exclusive events add. Everything else — $P(A') = 1 - P(A)$, $P(\varnothing) = 0$, the addition rule — is derived from these.
:::

## Counting with Venn Diagrams

### Four regions

Two events $A$, $B$ in a sample space $S$ split $S$ into **four mutually exclusive regions** (draw the Venn diagram):

| Region | Meaning |
|---|---|
| $A \cap B'$ | in $A$ only |
| $A \cap B$ | in both |
| $A' \cap B$ | in $B$ only |
| $A' \cap B'$ | in neither (outside both circles) |

Because the regions do not overlap, counts simply add up:

:::proposition[Counting with the four regions]
$$
n(A) = n(A \cap B') + n(A \cap B)
\qquad
n(B) = n(A' \cap B) + n(A \cap B)
$$

$$
n(A \cup B) = n(A \cap B') + n(A \cap B) + n(A' \cap B) = n(A) + n(B) - n(A \cap B)
$$

$$
n(A' \cap B') = n(S) - n(A \cup B)
$$

The third line is the key one: adding $n(A)$ and $n(B)$ counts the overlap $A \cap B$ *twice*, so it is subtracted once.
:::

### Mutually exclusive events

If $A$ and $B$ are mutually exclusive (the circles do not touch), then $n(A \cap B) = 0$ and

$$
n(A \cup B) = n(A) + n(B).
$$

### Two set identities

:::proposition[Two set identities]
- **3(a)** $\;(A \cap B) \cup (A \cap B') = A$ — the two halves of $A$ (inside $B$ and outside $B$) reassemble $A$.
- **3(c)** $\;A \cup (A' \cap B) = A \cup B$ — $A$ together with “the part of $B$ not already in $A$” is exactly $A \cup B$. Moreover $A$ and $A' \cap B$ are *mutually exclusive*, which is what makes this identity useful for probabilities on the next page.
:::

:::equations
- *Count of A, of B*: $n(A) = n(A\cap B') + n(A\cap B)$ and $n(B) = n(A'\cap B) + n(A\cap B)$ — Each set is the union of its two disjoint pieces.
- *Count of the union*: $n(A\cup B) = n(A) + n(B) - n(A\cap B)$ — Overlap counted twice → subtract once.
- *Neither*: $n(A'\cap B') = n(S) - n(A\cup B)$ — Everything outside both circles.
- *Mutually exclusive*: $A\cap B = \varnothing \;\Rightarrow\; n(A\cup B) = n(A) + n(B)$ — No overlap to correct for.
- *Identities 3(a), 3(c)*: $(A\cap B)\cup(A\cap B') = A$ and $A\cup(A'\cap B) = A\cup B$ — Used in the proofs of the next part.
:::

```sim
id: venn-counts
controls:
  - {id: nS, label: n(S), min: 20, max: 200, step: 5, default: 100, decimals: 0}
  - {id: nA, label: n(A), min: 0, max: 200, step: 5, default: 40, decimals: 0}
  - {id: nB, label: n(B), min: 0, max: 200, step: 5, default: 50, decimals: 0}
  - {id: nAB, label: "n(A \u2229 B)", min: 0, max: 200, step: 5, default: 15, decimals: 0}
note: The four region counts are computed from your sliders with the identities above. Some slider combinations are impossible (e.g. n(A∩B) > n(A), or n(A∪B) > n(S)); the title then says exactly which value was adjusted and why. Set n(A∩B) = 0 to see the mutually exclusive case.
...
```

```python
# Python sets make the Venn bookkeeping concrete: & is ∩, | is ∪, − is "and not". The
# asserts check identities 3(a) and 3(c) on a real sample space.
# Two-dice example: A = "first die is even", B = "sum is 7"
import itertools
S = list(itertools.product(range(1, 7), repeat=2))
A = {s for s in S if s[0] % 2 == 0}
B = {s for s in S if s[0] + s[1] == 7}

nA, nB, nAB = len(A), len(B), len(A & B)
print('n(A) =', nA, ' n(B) =', nB, ' n(A∩B) =', nAB)
print('n(A∪B) via set  =', len(A | B))
print('n(A∪B) via rule =', nA + nB - nAB)
print("n(A'∩B') =", len(S) - len(A | B))
# identities 3(a) and 3(c)
Sset = set(S)
assert (A & B) | (A - B) == A
assert A | ((Sset - A) & B) == A | B
print('identities 3(a), 3(c) hold')
```

:::insight
Split $S$ into the four disjoint regions and everything becomes bookkeeping. The overlap $A \cap B$ is inside both $n(A)$ and $n(B)$, so $n(A \cup B) = n(A) + n(B) - n(A \cap B)$; when $A$ and $B$ are mutually exclusive the correction term is 0.
:::

## The Addition Rule & Monotonicity

### From counts to probabilities

Every counting identity becomes a probability identity after dividing by $n(S)$, because $P(E) = n(E)/n(S)$. Start from identity 3(c), $A \cup (A' \cap B) = A \cup B$, where $A$ and $A' \cap B$ are mutually exclusive:

$$
\frac{n\big(A \cup (A' \cap B)\big)}{n(S)} = \frac{n(A \cup B)}{n(S)}
\quad\Longrightarrow\quad
\frac{n(A)}{n(S)} + \frac{n(A' \cap B)}{n(S)} = \frac{n(A \cup B)}{n(S)}
$$

:::lemma
$$
P(A) + P(A' \cap B) = P(A \cup B)
$$
:::

### Theorem 1 — monotonicity

::::theorem[Monotonicity]
If $A$ and $B$ are two events in a sample space $S$ and $A \subset B$, then $P(A) \le P(B)$.

:::proof
Since $A \subset B$, we can write $B = A \cup (A' \cap B)$ (the small circle $A$ inside the big circle $B$, plus the ring around it), and the two pieces are mutually exclusive. Therefore

$$
P(B) = P\big(A \cup (A' \cap B)\big) = P(A) + P(A' \cap B).
$$

Since $P(A' \cap B) \ge 0$ (probabilities are never negative), $P(B) \ge P(A)$.
:::
::::

### Theorem 2 — the addition rule

::::theorem[Addition rule]
$$
P(A \cup B) = P(A) + P(B) - P(A \cap B)
$$

:::proof
*Via the three regions.* From the counting part,

$$
n(A \cup B) = n(A \cap B') + n(A \cap B) + n(A' \cap B).
$$

Divide by $n(S)$:

$$
P(A \cup B) = P(A \cap B') + P(A \cap B) + P(A' \cap B).
$$

Now use $P(A \cap B') = P(A) - P(A \cap B)$ and $P(A' \cap B) = P(B) - P(A \cap B)$ (each from identity 3(a) applied to $A$ and to $B$):

$$
\begin{aligned}
P(A \cup B) &= \big[P(A) - P(A \cap B)\big] + P(A \cap B) \\
  &\quad + \big[P(B) - P(A \cap B)\big] \\
  &= P(A) + P(B) - P(A \cap B).
\end{aligned}
$$

*Via identity 3(c).* $P(A \cup B) = P(A) + P(A' \cap B)$ by the lemma above, and $P(A' \cap B) = P(B) - P(A \cap B)$; substituting gives the same formula.
:::
::::

:::corollary[Mutually exclusive events]
If $A$ and $B$ are mutually exclusive, $P(A \cap B) = 0$ and the rule reduces to $P(A \cup B) = P(A) + P(B)$ — the additivity used above.
:::

:::equations
- *Disjoint decomposition of a union*: $P(A) + P(A'\cap B) = P(A\cup B)$ — A and A′∩B are mutually exclusive and their union is A∪B (identity 3(c)).
- *Theorem 1 (monotonicity)*: $A \subset B \;\Rightarrow\; P(A) \le P(B)$ — Because P(B) = P(A) + P(A′∩B) and P(A′∩B) ≥ 0.
- *Theorem 2 (addition rule)*: $P(A\cup B) = P(A) + P(B) - P(A\cap B)$ — General rule for the probability of "A or B".
- *Mutually exclusive case*: $A\cap B = \varnothing \;\Rightarrow\; P(A\cup B) = P(A) + P(B)$ — Overlap term vanishes.
:::

```sim
id: prob-union
controls:
  - {id: pA, label: P(A), min: 0, max: 1, step: 0.01, default: 0.4, decimals: 2}
  - {id: pB, label: P(B), min: 0, max: 1, step: 0.01, default: 0.5, decimals: 2}
  - {id: pAB, label: "P(A \u2229 B)", min: 0, max: 1, step: 0.01, default: 0.15, decimals: 2}
note: The Venn regions show P(A∩B′), P(A∩B), P(A′∩B), P(A′∩B′). If the sliders describe an impossible situation (P(A∩B) > min(P(A), P(B)) or P(A∪B) > 1) the title says which value was adjusted and why. Compare "P(A) + P(B)" with the correct P(A∪B) in the title — the difference is exactly the overlap.
...
```

```python
# Theorem 2 and the disjoint decomposition agree with the direct count of A ∪ B;
# Theorem 1 is checked on a genuine subset pair C ⊂ D.
from fractions import Fraction
import itertools

S = list(itertools.product(range(1, 7), repeat=2))
P = lambda E: Fraction(len(E), len(S))

A = {s for s in S if s[0] % 2 == 0}         # first die even
B = {s for s in S if s[0] + s[1] == 7}      # sum is 7
C = {s for s in S if s[0] + s[1] >= 10}     # sum >= 10  (C ⊂ D below)
D = {s for s in S if s[0] + s[1] >= 8}

print('P(A∪B) direct  =', P(A | B))
print('P(A)+P(B)-P(A∩B) =', P(A) + P(B) - P(A & B))       # Theorem 2
print('P(A)+P(A\'∩B)    =', P(A) + P(B - A))               # disjoint decomposition
print('C ⊂ D:', C <= D, ' P(C) =', P(C), '<= P(D) =', P(D))  # Theorem 1
```

:::caution
$P(A \cup B) = P(A) + P(B)$ is only true when $A$ and $B$ are mutually exclusive. For overlapping events you must subtract $P(A \cap B)$ — forgetting this can even give a "probability" greater than 1.
:::


:::insight
$P(A \cup B) = P(A) + P(B) - P(A \cap B)$: "or" means add, but subtract the overlap so it is not counted twice. Both proofs are just the Venn-region counts divided by $n(S)$.
:::

## Inclusion–Exclusion for Three Events

### The formula

::::theorem[Inclusion–exclusion for three events]
If $A$, $B$ and $C$ are three events in a sample space $S$, then

$$
\begin{aligned}
P(A \cup B \cup C) &= P(A) + P(B) + P(C) \\
  &\quad - P(A \cap B) - P(A \cap C) \\
  &\quad - P(B \cap C) \\
  &\quad + P(A \cap B \cap C).
\end{aligned}
$$

Add the singles, subtract the pairs (each pairwise overlap was counted twice), add back the triple (it was added three times, then subtracted three times, so it has to go back in once).

:::proof
The derivation, in four steps.

**Step 1.** Treat $B \cup C$ as a single event and apply the two-event addition rule:

$$
P\big[A \cup (B \cup C)\big] = P(A) + P(B \cup C) - P\big[A \cap (B \cup C)\big].
$$

**Step 2.** Expand $P(B \cup C)$ with the addition rule again:

$$
\begin{aligned}
&P(A \cup B \cup C) \\
  &= P(A) + P(B) + P(C) - P(B \cap C) \\
  &\quad - P\big[A \cap (B \cup C)\big].
\end{aligned}
$$

**Step 3.** Distribute the intersection over the union, $A \cap (B \cup C) = (A \cap B) \cup (A \cap C)$, and apply the addition rule to *these* two events:

$$
\begin{aligned}
&P\big[(A \cap B) \cup (A \cap C)\big] \\
  &= P(A \cap B) + P(A \cap C) \\
  &\quad - P\big((A \cap B) \cap (A \cap C)\big) \\
  &= P(A \cap B) + P(A \cap C) \\
  &\quad - P(A \cap B \cap C),
\end{aligned}
$$

because $(A \cap B) \cap (A \cap C) = A \cap B \cap C$.

**Step 4.** Substitute Step 3 into Step 2:

$$
\begin{aligned}
&P(A \cup B \cup C) \\
  &= P(A) + P(B) + P(C) - P(B \cap C) \\
  &\quad - \big[P(A \cap B) + P(A \cap C) \\
  &\qquad - P(A \cap B \cap C)\big] \\
  &= P(A) + P(B) + P(C) \\
  &\quad - P(A \cap B) - P(A \cap C) \\
  &\quad - P(B \cap C) + P(A \cap B \cap C).
\end{aligned}
$$
:::
::::

### Reading it off the Venn diagram

Three circles cut $S$ into $8$ regions (7 inside the circles plus the outside). Count how many times each region inside the union is counted by the right-hand side:

| Region | singles | − pairs | + triple | net |
|---|---|---|---|---|
| in exactly one set | $+1$ | $0$ | $0$ | $1$ |
| in exactly two sets | $+2$ | $-1$ | $0$ | $1$ |
| in all three sets | $+3$ | $-3$ | $+1$ | $1$ |

Every region of $A \cup B \cup C$ ends up counted exactly once — which is what a correct formula for $P(A \cup B \cup C)$ must do.

:::note
The same pattern continues for $n$ events (alternating sums over all $k$-fold intersections) — the general *inclusion–exclusion principle*. Week 1 stops at three events.
:::

:::equations
- *Three-event addition rule*: $P(A\cup B\cup C) = P(A)+P(B)+P(C) - P(A\cap B) - P(A\cap C) - P(B\cap C) + P(A\cap B\cap C)$ — Inclusion–exclusion for three events.
- *Distributive law*: $A\cap(B\cup C) = (A\cap B)\cup(A\cap C)$ — Needed to expand the last term in Step 1.
- *Key intermediate step*: $P\big[(A\cap B)\cup(A\cap C)\big] = P(A\cap B) + P(A\cap C) - P(A\cap B\cap C)$ — Two-event rule; (A∩B)∩(A∩C) = A∩B∩C.
:::

```sim
id: incl-excl-3
controls:
  - {id: step, label: "Terms included (1: singles, 2: \u2212 pairs, 3: + triple)", min: 1, max: 3, step: 1, default: 1, decimals: 0}
note: Each of the 7 regions inside A ∪ B ∪ C shows how many times it has been counted so far. After the singles the overlaps are over-counted (2 or 3); subtracting the pairs fixes the two-way overlaps but wipes out the centre (0); adding the triple back makes every region count exactly once.
...
```

```python
# The formula is checked exactly (with Fractions) on one hand-picked triple and on
# 1000 random triples, then a bar chart shows the counting argument: after singles /
# minus pairs / plus triple, every region is counted exactly once.
from fractions import Fraction
import itertools
import matplotlib.pyplot as plt

S = list(itertools.product(range(1, 7), repeat=2))
P = lambda E: Fraction(len(E), len(S))

A = {s for s in S if s[0] % 2 == 0}          # first die even
B = {s for s in S if s[0] + s[1] == 7}       # sum is 7
C = {s for s in S if s[1] >= 5}              # second die is 5 or 6

lhs = P(A | B | C)
rhs = (P(A) + P(B) + P(C)
       - P(A & B) - P(A & C) - P(B & C)
       + P(A & B & C))
print('P(A∪B∪C) direct         =', lhs)
print('inclusion-exclusion side =', rhs)
assert lhs == rhs

# brute-force check on many random triples of events
import random
for _ in range(1000):
    X, Y, Z = ({s for s in S if random.random() < 0.5} for _ in range(3))
    assert P(X | Y | Z) == P(X)+P(Y)+P(Z)-P(X&Y)-P(X&Z)-P(Y&Z)+P(X&Y&Z)
print('formula verified on 1000 random triples')

# Visualise WHY it works: how many times each region is counted after each stage
regions = ['in exactly 1 set', 'in exactly 2 sets', 'in all 3 sets']
stages  = {'singles':  [1, 2, 3],
           '- pairs':  [1, 1, 0],
           '+ triple': [1, 1, 1]}
x = range(len(regions)); w = 0.27
for i, (name, counts) in enumerate(stages.items()):
    plt.bar([xi + (i - 1) * w for xi in x], counts, width=w, label=f'after {name}')
plt.axhline(1, color='k', ls='--', lw=1)
plt.xticks(list(x), regions); plt.ylabel('times counted'); plt.legend()
plt.title('Inclusion-exclusion: every region ends up counted exactly once')
plt.show()
```

:::insight
Inclusion–exclusion for three events is nothing new: it is the two-event addition rule applied twice, plus the distributive law $A \cap (B \cup C) = (A \cap B) \cup (A \cap C)$. The sign pattern +singles −pairs +triple makes every region count exactly once.
:::

## Further reading

- [Seeing Theory — Basic Probability](https://seeing-theory.brown.edu/basic-probability/index.html) — Interactive visual introduction to sample spaces, events and expectation (Brown University).
- [Seeing Theory — Basic Probability (chance events)](https://seeing-theory.brown.edu/basic-probability/index.html) — Flip coins / roll dice interactively and watch the empirical frequencies converge.
- [OpenStax Introductory Statistics — 3.3 Two Basic Rules of Probability](https://openstax.org/books/introductory-statistics/pages/3-3-two-basic-rules-of-probability) — The addition rule with worked examples, including the mutually exclusive case.
- [Wikipedia — Inclusion–exclusion principle](https://en.wikipedia.org/wiki/Inclusion%E2%80%93exclusion_principle) — The general n-event version and its combinatorial proof.
