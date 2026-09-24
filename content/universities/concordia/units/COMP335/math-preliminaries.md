---
title: Mathematical preliminaries
order: 1
status: detailed
notes: ["Lecture 1 · slides 5–17", "Lecture 1 · slides 18–28", "Lecture 1 · slides 29–40"]
weeks: [1]
textbook: "Linz & Rodger, An Introduction to Formal Languages and Automata, 7e, 1.1"
introduces:
  - {concept: graph, perspective: "transition graphs of automata"}
  - {concept: tree, perspective: "derivation trees"}
requires:
  - {concept: set, strength: hard}
  - {concept: function, strength: hard}
  - {concept: relation, strength: hard}
  - {concept: proof-techniques, strength: hard}
  - {concept: mathematical-induction, strength: soft}
reinforces: [set, function, relation, proof-techniques, mathematical-induction]
---

Review of the discrete-mathematics toolkit the course relies on: sets and set
operations, functions and relations, graphs and trees, and proof techniques (induction,
contradiction, pigeonhole).

## Sets

### Sets and their representations

:::definition[Set]
A **set** is a collection of elements (objects). $A = \{1, 2, 3\}$, $B = \{\text{train}, \text{bus}, \text{bicycle}, \text{airplane}\}$. Membership: $1 \in A$, $\text{ship} \notin B$.
- Finite set, listed or abbreviated: $C = \{a, b, c, \dots, k\}$.
- Infinite set: $S = \{2, 4, 6, \dots\}$, or by a property: $S = \{\, j : j > 0 \text{ and } j = 2k \text{ for some } k > 0 \,\} = \{\, j : j \text{ is nonnegative and even} \,\}$.
- **Universal set** $U$: all possible elements, e.g. $U = \{1, \dots, 10\}$.
:::

### Set operations

With $A = \{1,2,3\}$ and $B = \{2,3,4,5\}$ (Venn diagrams on the slides):

| Operation | Result |
|---|---|
| Union $A \cup B$ | $\{1,2,3,4,5\}$ |
| Intersection $A \cap B$ | $\{2,3\}$ |
| Difference $A - B$ | $\{1\}$ |
| Difference $B - A$ | $\{4,5\}$ |
| Complement $\bar A$ (with $U = \{1,\dots,7\}$) | $\{4,5,6,7\}$, and $\bar{\bar A} = A$ |

Example of complements: over the integers, $\overline{\{\text{even integers}\}} = \{\text{odd integers}\}$.

:::theorem[De Morgan's laws]
$$\overline{A \cup B} = \bar A \cap \bar B, \qquad \overline{A \cap B} = \bar A \cup \bar B$$
:::

### The empty set, subsets, disjoint sets

The **empty (null) set** is $\varnothing = \{\}$, and for any set $S$:
 $$\begin{gathered} S \cup \varnothing = S, \qquad S \cap \varnothing = \varnothing, \qquad S - \varnothing = S \\[4pt] \varnothing - S = \varnothing, \qquad \bar{\varnothing} = U \end{gathered}$$

- **Subset:** $A \subseteq B$ if every element of $A$ is in $B$ — $\{1,2,3\} \subseteq \{1,2,3,4,5\}$. **Proper subset** $A \subset B$: also $A \ne B$.
- **Disjoint sets:** $A \cap B = \varnothing$, e.g. $\{1,2,3\}$ and $\{5,6\}$.
- **Cardinality / size** of a finite set: $|A|$ = number of elements; $|\{2,5,7\}| = 3$.

### Powersets and Cartesian products

:::definition[Powerset]
The **powerset** $2^S$ of $S$ is the set of *all subsets* of $S$. For $S = \{a,b,c\}$:

$$
\begin{aligned} 2^S = \big\{\, &\varnothing, \{a\}, \{b\}, \{c\}, \\ &\{a,b\}, \{a,c\}, \{b,c\}, \{a,b,c\} \,\big\}, \end{aligned} \qquad |2^S| = 2^{|S|} = 8.
$$
:::

:::definition[Cartesian product]
The **Cartesian product** $A \times B$ is the set of ordered pairs. For $A = \{2,4\}$, $B = \{2,3,5\}$:
 $$A \times B = \{(2,2), (2,3), (2,5), (4,2), (4,3), (4,5)\}, \qquad |A \times B| = |A|\cdot|B| = 6.$$
Generalises to more than two sets: $A \times B \times \dots \times Z$.
:::

```sim
id: set-tool
custom: true
mode: tool
kind: sets
defaults:
  A: 1, 2, 3
  B: 2, 3, 4, 5
  U: 1, 2, 3, 4, 5, 6, 7
note: 'Type comma-separated elements. The defaults are the slide examples: A = {1,2,3}, B = {2,3,4,5}, U = {1,…,7}. Try A = a, b, c to see the 8-element powerset, or A = 2, 4 and B = 2, 3, 5 for the Cartesian product.'
```

```python
# Python sets map one-to-one onto the notation: | ∪, & ∩, − difference. The powerset
# is built with combinations of every size; product gives the Cartesian product.
from itertools import product, combinations

A, B = {1, 2, 3}, {2, 3, 4, 5}
U = set(range(1, 8))

print(A | B, A & B, A - B, B - A)          # union, intersection, differences
print(U - A)                                # complement of A w.r.t. U
print(U - (A | B) == (U - A) & (U - B))     # De Morgan: True

S = {'a', 'b', 'c'}
powerset = [set(c) for r in range(len(S) + 1) for c in combinations(sorted(S), r)]
print(len(powerset), powerset)              # 8 subsets

print(list(product({2, 4}, {2, 3, 5})))     # A x B, 6 ordered pairs
```

:::insight
Languages are sets of strings, so every set operation on this page (∪, ∩, −, complement, powerset, product) reappears later as an operation on languages — and the powerset 2^Q is exactly the state set of the DFA produced from an NFA.
:::

:::equations
- *De Morgan*: $\overline{A \cup B} = \bar A \cap \bar B, \qquad \overline{A \cap B} = \bar A \cup \bar B$ — Complement swaps union and intersection.
- *Sizes*: $|2^S| = 2^{|S|}, \qquad |A \times B| = |A|\cdot|B|$ — Powerset and Cartesian product of finite sets.
:::

## Functions, Relations & Graphs

### Functions

:::definition[Function: total and partial]
A function $f : A \to B$ maps elements of the **domain** $A$ to elements of the **codomain** $B$; the set of values actually taken, $\{f(x) : x \in A\}$, is the **range**. If $f$ is defined on all of $A$ it is a **total function**; otherwise it is a **partial function**.
On the slide: $A = \{1,2,3,4,5\}$, $B = \{a,b,c,d\}$, $f(1) = a$, …; element 4 of the domain has no image, so $f$ is partial. (Keep this in mind: the transition function of a DFA is *total* in our textbook; an NFA's is not.)
:::

### Relations

:::definition[Relation, equivalence relation]
Given a set $A$, a **relation** $R$ on $A$ is a subset $R \subseteq A \times A$ (also written $R \subseteq A^2$): $R = \{(x_1,y_1), (x_2,y_2), \dots\}$, and we write $x_i \, R \, y_i$. Example: the relation “$>$” over $\mathbb{N}$ is the set of all pairs $(x,y)$ with $x > y$.
An **equivalence relation** is
- **reflexive**: $x \, R \, x$;
- **symmetric**: $x \, R \, y \Rightarrow y \, R \, x$;
- **transitive**: $x \, R \, y$ and $y \, R \, z \Rightarrow x \, R \, z$.
Example: equality “$=$” satisfies $x = x$; $x = y \Rightarrow y = x$; $x = y$ and $y = z \Rightarrow x = z$.
:::

:::definition[Equivalence class]
For an equivalence relation $R$ on $A$, the **equivalence class** of $x$ is $[x]_R = \{\, y : x \, R \, y \,\}$.
:::

::::example[Equivalence classes]
Find the equivalence classes of the relation on $\{1,2,3,4\}$

$$
\begin{aligned} R = \{&(1,1), (2,2), (1,2), (2,1), \\ &(3,3), (4,4), (3,4), (4,3)\} . \end{aligned}
$$

:::solution
$1$ is related to $1$ and $2$, and $3$ to $3$ and $4$, so the classes are $[1]_R = [2]_R = \{1,2\}$
and $[3]_R = [4]_R = \{3,4\}$. (DFA minimisation, later in the course, is exactly "find the
equivalence classes of indistinguishable states".)
:::
::::

### Graphs

:::definition[Directed graph, walk, path, cycle]
A **directed graph** $G = \langle V, E \rangle$ has nodes (vertices) $V$ and edges $E \subseteq V \times V$. Slide example: $V = \{a,b,c,d,e\}$ and

$$
\begin{aligned} E = \{&(a,b), (b,c), (b,e), (c,a), \\ &(c,e), (d,c), (e,b), (e,d)\}. \end{aligned}
$$
 A **labelled graph** attaches a label to every edge — a finite automaton is a labelled directed graph.

- A **walk** is a sequence of adjacent edges, e.g. $(e,d), (d,c), (c,a)$.
- A **path** is a walk in which no edge is repeated; a **simple path** repeats no node.
- A **cycle** is a walk from a node (the base) back to itself; in a **simple cycle** only the base node is repeated.
- **Trees** have no cycles: root, parent / child, leaves, levels (root at level 0) and height (the deepest level; the slide tree has height 3).
:::

```sim
id: graph-tool
custom: true
mode: graph
defaults:
  set: 1, 2, 3, 4
  rel: 1 1, 2 2, 1 2, 2 1, 3 3, 4 4, 3 4, 4 3
  nodes: a, b, c, d, e
  edges: a b, b c, b e, c a, c e, d c, e b, e d
  walk: e d c a
note: 'Left: the slide relation R on {1,2,3,4} drawn as a graph; the tool checks reflexive / symmetric / transitive and lists the equivalence classes [1]_R = {1,2}, [3]_R = {3,4} — remove a pair (e.g. "2 1") to see which property breaks. Right: the slide graph G = ⟨V,E⟩; type a sequence of nodes to see whether it is a walk, path, simple path, cycle or simple cycle (try e d c a, then a b c a, then b e b c a).'
```

```python
# The three properties of an equivalence relation checked mechanically on the slide
# relation, its equivalence classes, and a check that a sequence of edges is a walk
# (edges exist and are adjacent).
# An equivalence relation given as a set of pairs (slide example)
R = {(1,1), (2,2), (1,2), (2,1), (3,3), (4,4), (3,4), (4,3)}
A = {1, 2, 3, 4}

reflexive  = all((x, x) in R for x in A)
symmetric  = all((y, x) in R for (x, y) in R)
transitive = all((x, z) in R for (x, y) in R for (y2, z) in R if y == y2)
print(reflexive, symmetric, transitive)            # True True True

def eq_class(x):
    return {y for (a, y) in R if a == x}
print(eq_class(1), eq_class(3))                    # {1, 2} {3, 4}

# A directed graph and a walk check
E = {('a','b'), ('b','c'), ('b','e'), ('c','a'), ('c','e'), ('d','c'), ('e','b'), ('e','d')}
walk = [('e','d'), ('d','c'), ('c','a')]
print(all(e in E for e in walk) and all(walk[i][1] == walk[i+1][0] for i in range(len(walk)-1)))  # True
```

:::insight
Automata are labelled directed graphs, a run of an automaton is a walk whose labels spell the input, and "indistinguishable states" is an equivalence relation whose classes become the states of the minimal DFA — the whole course leans on these definitions.
:::

:::equations
- *Relation*: $R \subseteq A \times A, \qquad x \, R \, y \iff (x,y) \in R$ — A relation is a set of ordered pairs.
- *Equivalence class*: $[x]_R = \{\, y : x \, R \, y \,\}$ — All elements related to x; classes partition A.
:::

## Proof Techniques & the Pigeonhole Principle

### Proof by induction

:::definition[Proof by induction]
We have statements $P_1, P_2, \dots$. If we know that **$P_1$ is true** (the *basis*) and that **for any $k$, $P_k$ implies $P_{k+1}$** (the *inductive step*), then we conclude that every $P_i$ is true: $\forall i\; P(i)$.
:::

::::example[A sum by induction]
Prove that $0 + 1 + 2 + \dots + n = \dfrac{n(n+1)}{2}$ for every $n \ge 0$.

:::solution
*Basis* ($n = 0$): the left side is $0$, the right side is $0 \cdot 1 / 2 = 0$. ✓
*Inductive step*: assume it holds for $n = k$. Then
 $$\begin{gathered} 0 + 1 + \dots + k + (k+1) = \frac{k(k+1)}{2} + (k+1) \\[4pt] = \frac{k(k+1) + 2(k+1)}{2} = \frac{(k+1)(k+2)}{2}, \end{gathered}$$
which is the formula for $n = k+1$. ✓ Hence it holds for all $n$.
:::
::::

### Proof by contradiction

:::definition[Proof by contradiction]
To prove that a statement $P$ is true: assume $P$ is false, derive an incorrect conclusion, therefore $P$ must be true.
:::

::::theorem[$\sqrt 2$ is irrational]
$\sqrt 2$ is not rational.

:::proof
Assume by contradiction that it is rational, i.e. $\sqrt 2 = \dfrac{n}{m}$ where $n$ and $m$ have no
common factors. Then

$$
\begin{aligned}
\sqrt 2 = \frac{n}{m} &\;\Rightarrow\; 2m^2 = n^2 \\
  &\;\Rightarrow\; n^2 \text{ is even, so } n = 2k \\
  &\;\Rightarrow\; 2m^2 = 4k^2 \;\Rightarrow\; m^2 = 2k^2 \\
  &\;\Rightarrow\; m^2 \text{ is even, so } m = 2p .
\end{aligned}
$$

Thus $2$ is a common factor of both $m$ and $n$ — **contradiction**.
:::
::::

### The pigeonhole principle

:::theorem[Pigeonhole principle]
If $n$ pigeons (objects) are put into $m$ pigeonholes (boxes) with $n > m$, then some pigeonhole contains at least two pigeons. Equivalently: if $n + 1$ objects are put into $n$ boxes, at least one box contains 2 or more objects.
:::

::::example[Five points in a square]
Show that among any 5 points inside a square of side 2 cm, some two are at distance at most $\sqrt 2$ cm.

:::solution
Cut the square into four $1 \times 1$ boxes. Five points in four boxes: by the pigeonhole
principle two of them share a box, and no two points of a unit box are farther apart than its
diagonal, $\sqrt 2$.
:::
::::

```sim
id: proofs-demo
custom: true
mode: proofs
n: 8
note: 'Left: induction as falling dominoes — the basis P(0) is checked first, then each Step ▶ (or ▶ Play with speed control) applies the inductive step P(k) ⇒ P(k+1) with the actual arithmetic shown. Right: the pigeonhole example — five random points in the 2 cm square always leave two in the same 1 cm box, hence at distance ≤ √2; re-draw as often as you like.'
```

```python
# A numeric sanity check of the induction formula, and the pigeonhole example: with 5
# points and 4 unit boxes some box holds two points, whose distance cannot exceed the
# box diagonal √2.
# Checking the induction claim numerically (not a proof — a sanity check)
for n in range(0, 20):
    assert sum(range(n + 1)) == n * (n + 1) // 2
print("0+1+...+n = n(n+1)/2 holds for n = 0..19")

# Pigeonhole: 5 random points in a 2x2 square -> two share a 1x1 quadrant
import random, math
pts = [(random.uniform(0, 2), random.uniform(0, 2)) for _ in range(5)]
boxes = {}
for (x, y) in pts:
    boxes.setdefault((int(x), int(y)), []).append((x, y))
crowded = next(b for b in boxes.values() if len(b) >= 2)
(x1, y1), (x2, y2) = crowded[0], crowded[1]
print("two points in one box, distance =", round(math.dist((x1, y1), (x2, y2)), 3), "<= sqrt(2) =", round(math.sqrt(2), 3))
```

:::insight
Induction proves a statement for every n from a basis and a step; contradiction proves P by showing ¬P is impossible; pigeonhole is the counting argument behind the later proof that {aⁿbⁿ} is not regular (more strings than states forces two of them into the same state).
:::

:::equations
- *Induction*: $P(1) \;\wedge\; \big(\forall k:\; P(k) \Rightarrow P(k+1)\big) \;\Longrightarrow\; \forall i\; P(i)$ — Basis plus inductive step.
- *Sum formula*: $0 + 1 + 2 + \dots + n = \frac{n(n+1)}{2}$ — The induction example on the slides.
- *Pigeonhole*: $\begin{gathered} n \text{ objects in } m \text{ boxes},\quad n > m \\[4pt] \Rightarrow\quad \text{some box holds at least 2 objects} \end{gathered}$ — Used later to prove non-regularity.
:::

