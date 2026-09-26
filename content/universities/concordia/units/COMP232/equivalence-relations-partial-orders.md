---
title: Equivalence relations and partial orders
order: 11
status: detailed
introduces: []
requires:
  - {concept: relation, strength: hard}
  - {concept: set, strength: hard}
  - {concept: modular-arithmetic, strength: soft}
reinforces:
  - {concept: relation, perspective: "equivalence classes and partitions; posets, Hasse diagrams, total and lexicographic orders, bounds"}
---

The two most important kinds of relation on a set: those that behave like "equals" and
those that behave like "less than or equal".

## Equivalence relations

:::definition[Equivalence relation]
A relation on $A$ is an **equivalence relation** if it is reflexive,
symmetric and transitive.
:::

"Have the same parents" on people is one; so is congruence modulo $5$ on the integers,
$i\,M\,j \iff i \equiv j \pmod 5$.

:::definition[Equivalence class]
The **equivalence class** of $a$ is $[a] = \{b \mid (a, b) \in R\}$; any
member of a class is a **representative** of it.
:::

For $M$: $[0] = \{\dots, -5, 0, 5, 10, \dots\}$, $[1] = \{\dots, -4, 1, 6, \dots\}$, up to $[4]$,
and $[0] = [5] = [-10]$.

::::theorem[Classes partition the set]
For an equivalence relation the following are equivalent: $a\,R\,b$;
$[a] = [b]$; $[a] \cap [b] \ne \varnothing$. Hence two classes are either identical or
disjoint, and the distinct classes form a **partition** of $A$. Conversely every partition
of $A$ is the set of classes of some equivalence relation.

:::proof
If $a\,R\,b$ and $c \in [b]$, then $a\,R\,b$ and $b\,R\,c$ give $a\,R\,c$ by transitivity, so
$[b] \subseteq [a]$; by symmetry $[a] \subseteq [b]$. $[a] = [b]$ implies a common element
because $a \in [a]$ by reflexivity. And a common element $c$ gives $a\,R\,c$ and $b\,R\,c$, so
$a\,R\,b$ by symmetry and transitivity. For the converse, relate two elements when they lie
in the same block of the partition; that relation is reflexive, symmetric and transitive,
and its classes are the blocks.
:::
::::

So "equivalence relation on $A$" and "partition of $A$" are the same information.

## Partial orders

:::definition[Partial order]
A relation on $A$ is a **partial order** if it is reflexive, antisymmetric
and transitive; $(A, R)$ is then a **poset**. We write $a \preccurlyeq b$ for $(a, b) \in R$ and
$a \prec b$ when also $a \ne b$.
:::

$\le$ on numbers and $\subseteq$ on sets are partial orders.

:::definition[Comparable, total order]
Elements $a, b$ are **comparable** if $a \preccurlyeq b$ or $b \preccurlyeq a$; a poset in which
every pair is comparable is a **total order** ($\le$ on $\mathbb N$; not $\subseteq$).
:::

### Hasse diagrams

The graph of a poset is cluttered by the loops (reflexivity) and the shortcut arcs
(transitivity). Remove both, and draw $b$ above $a$ whenever $a \prec b$; the remaining lines
are the **Hasse diagram**. For $(\mathcal P(\{1,2,3\}), \subseteq)$ it is a cube with
$\varnothing$ at the bottom and $\{1,2,3\}$ on top. A total order draws as a single vertical
line. The course prerequisite structure of the BCompSc core is a poset, and its Hasse
diagram is the usual "sequence" chart.

### Lexicographic order

:::definition[Lexicographic order]
A partial order on letters extends to words as dictionary order: on $A \times B$,
$(a_1, b_1) \prec (a_2, b_2)$ iff $a_1 \prec a_2$, or $a_1 = a_2$ and $b_1 \prec b_2$; on strings,
compare position by position and let a proper prefix come first.
:::

## Extreme elements and bounds

In a poset $(A, \preccurlyeq)$, with $B \subseteq A$:

| term | meaning |
|---|---|
| minimal / maximal | no element strictly below / above it |
| least / greatest | below / above *every* element |
| upper / lower bound of $B$ | above / below every element of $B$ |
| least upper bound / greatest lower bound | the smallest upper bound / largest lower bound |

A poset can have several minimal elements or none, and likewise for the others; a least
element, when it exists, is the unique minimal one.

::::example[Prerequisites as a poset]
In the Hasse diagram of the COMP core courses, identify the minimal and maximal elements and
the least upper bound of $\{$COMP 232, COMP 249$\}$.

:::solution
The courses with no prerequisite are the minimal elements, the courses nothing depends on are
maximal, and the least upper bound of $\{$COMP 232, COMP 249$\}$ is the first course requiring
both.
:::
::::

:::insight
Reflexive + transitive plus *symmetric* gives an equivalence — a way to
say "same as" that partitions the set. Reflexive + transitive plus *antisymmetric* gives a
partial order — a way to say "before" that need not compare everything, which is exactly
the shape of prerequisites, subsets and divisibility.
:::
