---
title: Relations
order: 10
status: detailed
introduces: [relation]
requires:
  - {concept: set, strength: hard}
  - {concept: function, strength: hard}
  - {concept: matrix, strength: soft}
  - {concept: graph, strength: soft}
reinforces: []
---

Binary relations as the generalisation of functions, their representations as graphs and
matrices, the four properties (reflexive, symmetric, antisymmetric, transitive),
composition and powers, and the reflexive, symmetric and transitive closures.

## From functions to relations

A function assigns exactly one element of $B$ to each element of $A$. Many assignments in
software break that rule both ways — a student may take no course or several — so we need
something more general. Since a function is a set of pairs $\{(x, f(x))\} \subseteq A \times B$:

:::definition[Binary relation]
A **binary relation** from $A$ to $B$ is any subset $R \subseteq A \times B$.
We write $(a, b) \in R$ or $a\,R\,b$. If $A = B$, $R$ is a relation **on** $A$.
:::

Examples: *Registered* $\subseteq$ students $\times$ courses; *is-neighbour-of* on countries;
$<$ and $>$ on the reals, e.g. $L = \{(a, b) \mid a < b\}$.

### Representations

For finite sets, a relation from $A$ to $B$ is a **table** or a **graph**: one node per
element, an arc from $a$ to $b$ when $(a, b) \in R$ (a relation on $A$ gives a directed graph
on $A$, loops allowed). It is also an $m \times n$ **matrix** $M_R$ with $m_{ij} = 1$ iff
$(a_i, b_j) \in R$.

## Properties of a relation on a set

:::definition[Reflexive, symmetric, antisymmetric, transitive]
A relation $R$ on $A$ is

| property | condition | matrix / graph signature |
|---|---|---|
| reflexive | $\forall a\,(a, a) \in R$ | all $1$ on the diagonal; a loop at every node |
| symmetric | $(a, b) \in R \to (b, a) \in R$ | $M_R$ symmetric; every arc has a reverse arc |
| antisymmetric | $(a, b) \in R \land a \ne b \to (b, a) \notin R$ | $m_{ij} = 1,\ i \ne j \Rightarrow m_{ji} = 0$ |
| transitive | $(a, b), (b, c) \in R \to (a, c) \in R$ | no simple visual test |
:::

$\le$ on $\mathbb Z$ is reflexive, antisymmetric and transitive; $=$ is symmetric;
*is-a-sibling-of* is symmetric but not antisymmetric; *is-a-parent-of* is antisymmetric but
neither reflexive nor transitive; *is-an-ancestor-of* and divisibility are transitive.

:::caution
Symmetric and antisymmetric are not opposites — a relation can be both (only loops) or neither.
:::

## Combining relations

Relations from $A$ to $B$ are sets, so $\cup$, $\cap$ and $-$ apply; on matrices,
$M_{R \cup S} = M_R \lor M_S$ and $M_{R \cap S} = M_R \land M_S$ entry-wise.

:::definition[Composite and inverse]
For $R$ from $A$ to $B$ and $S$ from $B$ to $C$, the **composite**
$S \circ R$ from $A$ to $C$ contains $(a, c)$ iff some $b$ has $(a, b) \in R$ and $(b, c) \in S$
— first $R$, then $S$. The **inverse** is $R^{-1} = \{(b, a) \mid (a, b) \in R\}$.
:::

Composition is not commutative and may exist in one order only (*Registered* then
*ExamDates* relates students to exam dates; the reverse composite does not exist).
$M_{S \circ R} = M_R \odot M_S$, the Boolean matrix product (ordinary product with nonzero
entries replaced by $1$); $M_{R^{-1}} = M_R^{\mathsf T}$.

:::definition[Powers]
For $R$ on $A$, $R^1 = R$ and $R^n = R^{n-1} \circ R$; $a\,R^n\,b$ iff the graph has a path of
exactly $n$ arcs from $a$ to $b$.
:::

::::theorem[Transitivity and powers]
$R$ is transitive iff $R^n \subseteq R$ for all $n \ge 1$.

:::proof
If $R^n \subseteq R$ for all $n$, then in particular $R^2 \subseteq R$, which is transitivity.
Conversely, if $R$ is transitive, induct on $n$: $R^1 = R$; and if $R^n \subseteq R$, a pair in
$R^{n+1} = R^n \circ R$ comes from $(a, b) \in R$ and $(b, c) \in R^n \subseteq R$, so
$(a, c) \in R$ by transitivity.
:::
::::

## Closures

:::definition[Closure]
The **reflexive** (symmetric, transitive) **closure** of $R$ is the smallest relation that
contains $R$ and has the property.
:::

- Reflexive closure: $R \cup \Delta$ with $\Delta = \{(a, a) \mid a \in A\}$ — set the diagonal to $1$.
- Symmetric closure: $R \cup R^{-1}$ — $M_R \lor M_R^{\mathsf T}$.
- Transitive closure: the **connectivity relation** $R^* = R \cup R^2 \cup R^3 \cup \cdots$, all
  pairs joined by a path of any length (*parent* $\to$ *ancestor*).

::::theorem[Finite transitive closure]
On a finite set of $n$ elements, $R^* = R \cup R^2 \cup \cdots \cup R^n$.

:::proof
A shortest path from $a$ to $b$ never revisits a node, so it has at most $n$ arcs.
:::
::::

:::insight
A relation is a set of pairs, so it can be pictured as a directed graph
and computed with as a 0/1 matrix; the four properties are patterns in that picture,
composition is Boolean matrix multiplication, and a closure is "add the fewest pairs that
make the pattern appear".
:::
