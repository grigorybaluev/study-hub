---
title: Sets
order: 5
status: detailed
notes: ["Lecture slides main2, pp. 1-19"]
introduces: [set]
requires:
  - {concept: propositional-logic, strength: hard}
  - {concept: predicate-logic, strength: soft}
reinforces: []
---

Naive set theory as computer science uses it: notation, the operations, the identities and
how to prove them, and how a computer stores a set as a bit string.

## Notation

A **set** is a collection of objects, its **members**. Specify one by listing
($\{0, 1\}$), by listing with a pattern ($\{\dots, -1, 0, 1, \dots\}$), or by **set-builder
notation** $\{x \mid P(x)\}$.

> **Definition.**
> $x \in A$ — $x$ is a member of $A$; $x \notin A \iff \lnot(x \in A)$.
> $A \subseteq B \iff \forall x\,(x \in A \to x \in B)$;
> $A = B \iff A \subseteq B \land B \subseteq A$;
> $A \subset B \iff A \subseteq B \land A \ne B$ (proper subset).
> $\varnothing$ has no members; $U$, the universal set, has everything under discussion.

A set with exactly $k$ distinct elements is **finite** with **cardinality** $|A| = k$;
otherwise it is **infinite** (the primes, for instance).

**Power set and product.** $\mathcal P(A)$ is the set of all subsets of $A$;
$\mathcal P(\{1, 2, 3\})$ has $8$ members including $\varnothing$ and $\{1, 2, 3\}$.
$A \times B = \{(a, b) \mid a \in A,\ b \in B\}$ is the set of ordered pairs — $(1, x) \ne (x, 1)$.

## Operations

| operation | definition |
|---|---|
| union | $A \cup B = \{x \mid x \in A \lor x \in B\}$ |
| intersection | $A \cap B = \{x \mid x \in A \land x \in B\}$ |
| difference | $A - B = \{x \mid x \in A \land x \notin B\}$ |
| complement | $\overline A = U - A$ |

Venn diagrams picture these. $A$ and $B$ are **disjoint** if $A \cap B = \varnothing$; a
collection of non-empty, pairwise disjoint sets whose union is $A$ is a **partition** of $A$.

Useful containments: $A \cap B \subseteq A \subseteq A \cup B$, and $\subseteq$ is transitive.

## Set identities

Every propositional law has a set twin, because each set operation is a logical connective
applied to membership:

| law | identity |
|---|---|
| identity | $A \cup \varnothing = A$, $A \cap U = A$ |
| domination | $A \cup U = U$, $A \cap \varnothing = \varnothing$ |
| idempotent | $A \cup A = A$, $A \cap A = A$ |
| complement | $\overline{\overline A} = A$, $A \cup \overline A = U$, $A \cap \overline A = \varnothing$ |
| commutative, associative, distributive | as for $\lor$ / $\land$ |
| De Morgan | $\overline{A \cup B} = \overline A \cap \overline B$, $\overline{A \cap B} = \overline A \cup \overline B$ |
| difference | $A - B = A \cap \overline B$ |

Three ways to prove an identity: an **element proof** (set-builder notation plus logical
equivalences), an **algebraic proof** (chain of known identities), or a membership table.

> **Example.** $A \cup (B - A) = A \cup B$.
> *Element proof:* $\{x \mid x \in A \lor (x \in B \land x \notin A)\}
> = \{x \mid (x \in A \lor x \in B) \land (x \in A \lor x \notin A)\}
> = \{x \mid (x \in A \lor x \in B) \land T\} = A \cup B$.
> *Algebraic proof:* $A \cup (B \cap \overline A) = (A \cup B) \cap (A \cup \overline A) = (A \cup B) \cap U = A \cup B$.

## Computer representation

Fix an order $a_1, \dots, a_k$ on a finite universe $U$. Any subset $T \subseteq U$ is a
**bit string** of length $k$: bit $i$ is $1$ iff $a_i \in T$. With $U = \{a, e, i, o, u\}$:
$01101$ is $\{e, i, u\}$, $11111$ is $U$, $00000$ is $\varnothing$. Then $\cup$, $\cap$ and
complement are bitwise or, and, not — single machine instructions, which is why this
representation is fast.

> **Key insight.** Sets are logic with membership as the atomic proposition: $\cup$ is $\lor$,
> $\cap$ is $\land$, complement is $\lnot$, $\subseteq$ is $\to$. Every set identity is a
> propositional law, every set proof is a logic proof, and a bit string is just the truth
> table of "is it in the set?".
