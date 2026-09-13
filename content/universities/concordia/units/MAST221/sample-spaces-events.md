---
title: Sample spaces and events
order: 1
status: detailed
notes: ["Slides 1–3 · Notes Lec 1 (Wed 9 Sep 2026) p.1", "Slides 3–8"]
weeks: [1]
textbook: "Miller & Miller, John E. Freund's Mathematical Statistics with Applications, 8e, 2.1-2.3"
introduces: [sample-space, event]
requires:
  - {concept: set, strength: hard}
reinforces:
  - {concept: set, perspective: "set operations on events"}
---

Random experiments, sample spaces, and events as subsets, with the set operations used
to combine them.

## Random Experiments & Sample Spaces

### Random experiment

> **Definition.** A **random experiment** is a process or activity which produces a number of possible outcomes. The outcomes cannot be predicted with absolute certainty.
> Standard examples from the slides and the lecture:
> - **Example 1 — two coins.** Flip two coins and observe the possible outcomes of heads and tails. (In the notes: *coin flipping*, with $X$ = number of heads.)
> - **Example 2 — marbles.** Select two marbles *without replacement* from a bag containing 1 white, 1 red and 2 green marbles.
> - **Example 3 — two dice.** Roll two dice and observe the *sum* of the points on the top faces.
> - **A die.** One die has $S = \{1, 2, \dots, 6\}$: $6^1 = 6$ outcomes. Two dice: $6^2 = 36$ outcomes.
> All of the above are considered **experiments**.

### Sample space

> **Definition.** The **sample space** $S$ is the set (list) of *all possible outcomes* of the experiment: $$S = \{e_1, e_2, e_3, \dots\}$$ Each $e_i$ is an **element of $S$**, also called a **sample point**.
> The outcomes listed in a sample space must be
> - **mutually exclusive** — distinct and non-overlapping: two events having *no elements in common* (in a Venn diagram, two circles that do not touch);
> - **exhaustive** — including *all* possibilities (together they fill up $S$).

> **Example — a card.** The experiment is to select a card from an ordinary deck of playing cards (no jokers). The sample space consists of the 52 cards: 13 clubs, 13 spades, 13 hearts and 13 diamonds.

> **Example — drivers.** The experiment is to select a driver randomly from all drivers in the age category 18–25. The sample space is the set of *all drivers aged 18–25*. (Events for this experiment are on the next page.)

> **Note.** Choosing the sample space is a modelling decision. For two dice you can take $S$ = the 36 ordered pairs $(i,j)$, or $S$ = the 11 possible sums $\{2,\dots,12\}$. Both are valid sample spaces, but only the first one has *equally likely* outcomes — which is what makes the counting formula of Unit 2 work.

> **Key insight.** Write S so that its outcomes are mutually exclusive (no overlap) and exhaustive (nothing missing). Whenever you can, choose S so that its outcomes are equally likely — e.g. ordered pairs for two dice, not sums.

**Equations**

- *Sample space*: $S = \{e_1, e_2, e_3, \dots\}$ — Set of all possible outcomes; each eᵢ is a sample point.
- *Number of outcomes for k dice*: $n(S) = 6^k \qquad (6^1 = 6,\ 6^2 = 36)$ — Each die has 6 faces; the outcomes multiply.

```sim
id: sample-space-tree
controls:
  - {id: faces, label: 'Outcomes per trial (2 = coin, 6 = die)', min: 2, max: 6, step: 1, default: 2, decimals: 0}
  - {id: trials, label: Number of trials (coins / dice), min: 1, max: 4, step: 1, default: 2, decimals: 0}
note: 'A tree diagram of the sample space: each level is one trial, each leaf is one outcome (sample point). n(S) = (outcomes per trial)^(trials) — 2 coins give 4 leaves, 2 dice give 36, 3 dice already give 216.'
```

```python
import itertools
import matplotlib.pyplot as plt

# Sample spaces for the standard experiments
two_coins = [a + b for a in 'HT' for b in 'HT']                  # ['HH','HT','TH','TT']
two_dice  = list(itertools.product(range(1, 7), repeat=2))        # 36 ordered pairs (i, j)
dice_sums = sorted({i + j for i, j in two_dice})                  # [2, 3, ..., 12]
marbles   = list(itertools.combinations(['W', 'R', 'G1', 'G2'], 2))  # without replacement

print(len(two_coins), two_coins)
print(len(two_dice), 'ordered pairs, e.g.', two_dice[:3], '...')
print('possible sums:', dice_sums)
print(len(marbles), 'marble pairs:', marbles)

# Visualise a sample space as a tree diagram (here: two coins)
def tree(outcomes, trials, ax):
    leaves = list(itertools.product(outcomes, repeat=trials))
    ys = {(): 0.5}                                       # y-position of every node
    for lvl in range(1, trials + 1):
        nodes = sorted({leaf[:lvl] for leaf in leaves})
        for k, node in enumerate(nodes):
            ys[node] = 1 - (k + 0.5) / len(nodes)
    for node, y in ys.items():
        if node:                                         # draw branch from parent
            ax.plot([len(node) - 1, len(node)], [ys[node[:-1]], y], color='saddlebrown')
            ax.text(len(node) + 0.05, y, node[-1], va='center')
    for leaf in leaves:                                  # label the sample points
        ax.text(trials + 0.35, ys[leaf], ''.join(map(str, leaf)), va='center', fontweight='bold')
    ax.set_title(f'n(S) = {len(outcomes)}^{trials} = {len(leaves)} outcomes'); ax.axis('off')

fig, ax = plt.subplots(figsize=(5, 3))
tree('HT', 2, ax)          # try tree(range(1, 7), 2, ax) for two dice
plt.show()
```

Enumerating sample spaces with itertools (product for ordered outcomes, combinations for selection without replacement), then drawing the sample space as the tree diagram from the slides.

## Events — Simple & Compound

### Events

> **Definition.** An **event** is a subset of the sample space. An event can be classified as
> - a **simple event** — a subset which contains *exactly one* element of the sample space; or
> - a **compound event** — a subset of *two or more* elements.

> **Example — a card.** Select a card from an ordinary 52-card deck.
> - A **simple** event: the selected card is the two of clubs.
> - A **compound** event: the selected card is red. There are 26 red cards, so there are 26 simple events comprising this compound event.

> **Example 2 — drivers.** Select a driver randomly from all drivers aged 18–25. Identify the sample space, a simple event and a compound event.
> **Solution.** The sample space is the set of all drivers aged 18–25. A simple event is “Joe Smith”. A compound event is “all drivers age 23”.

### Example — describe the sample space for rolling two dice

> **Example.**
> You can use a **tree diagram** to determine the sample space. There are six outcomes on the first die, $\{1,2,3,4,5,6\}$, represented by six branches starting from the “tree trunk”. For *each* of these there are six outcomes for the second die, represented by six further branches. Therefore there are $6 \times 6 = 36$ outcomes.
> Sample space of all possible outcomes when two dice are tossed:

| (1,1) | (1,2) | (1,3) | (1,4) | (1,5) | (1,6) |
|---|---|---|---|---|---|
| (2,1) | (2,2) | (2,3) | (2,4) | (2,5) | (2,6) |
| (3,1) | (3,2) | (3,3) | (3,4) | (3,5) | (3,6) |
| (4,1) | (4,2) | (4,3) | (4,4) | (4,5) | (4,6) |
| (5,1) | (5,2) | (5,3) | (5,4) | (5,5) | (5,6) |
| (6,1) | (6,2) | (6,3) | (6,4) | (6,5) | (6,6) |

The pair $(i,j)$ means $i$ on the *first* die and $j$ on the *second*. So $(1,6)$ and $(6,1)$ are **different** outcomes — this matters when we count in the next unit.

In this sample space, “the first die shows 3” is a compound event with 6 elements (row 3 of the table); “the sum is 7” is a compound event with 6 elements (the anti-diagonal); “double six” $= \{(6,6)\}$ is a simple event.

> **Key insight.** Events are sets, so everything you know about sets (subsets, unions, intersections, complements) applies to events. A simple event is a single outcome; the probability of any event will be built up from the simple events it contains.

**Equations**

- *Event as a subset*: $E \subseteq S,\qquad \text{simple: } |E| = 1,\quad \text{compound: } |E| \ge 2$ — An event is a subset of the sample space.
- *Multiplication (tree) principle*: $n(S) = 6 \cdot 6 = 36 \quad\text{for two dice}$ — Six branches for the first die, six more for each of them.

```sim
id: dice-sum-grid
controls:
  - {id: sum, label: 'Event E: sum of the two dice equals', min: 2, max: 12, step: 1, default: 7, decimals: 0}
note: The 6 × 6 grid is the sample space from the slide (row = first die, column = second die). Highlighted cells are the outcomes making up the compound event "sum = k". Note that (1,6) and (6,1) are separate cells.
...
```

```python
import itertools

S = list(itertools.product(range(1, 7), repeat=2))   # the 36 ordered pairs

# Events are subsets of S
first_is_3 = [(i, j) for (i, j) in S if i == 3]          # compound, 6 outcomes
sum_is_7   = [(i, j) for (i, j) in S if i + j == 7]      # compound, 6 outcomes
double_six = [(i, j) for (i, j) in S if (i, j) == (6, 6)]  # simple, 1 outcome

print('first die is 3:', first_is_3)
print('sum is 7      :', sum_is_7)
print('double six    :', double_six)
```

Events as list comprehensions over the sample space — the code mirrors the set-builder notation E = {(i,j) ∈ S : condition}.

## Further reading

- [OpenStax Introductory Statistics — Ch. 3 Probability Topics](https://openstax.org/books/introductory-statistics/pages/3-introduction) — Free textbook chapter covering the same terminology: experiments, sample spaces, events.
