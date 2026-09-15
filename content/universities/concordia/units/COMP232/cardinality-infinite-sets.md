---
title: Cardinality of infinite sets
order: 12
status: detailed
notes: ["cardinality-infinite-sets handout"]
introduces: [countability]
requires:
  - {concept: function, strength: hard}
  - {concept: proof-techniques, strength: hard}
  - {concept: set, strength: hard}
reinforces: []
---

Comparing the sizes of infinite sets with bijections: countable sets, the surprising ones
that are countable, and Cantor's argument that the reals are not.

## Same size

> **Definition.** $|A| = |B|$ iff there is a bijection $A \to B$. If there is a surjection
> $A \to B$ then $|A| \ge |B|$. A set is **countable** if it is finite or has the same
> cardinality as $\mathbb Z^+$; otherwise it is **uncountable**. A countably infinite set has
> cardinality $\aleph_0$ ("aleph null").

For finite sets this agrees with counting; for infinite sets it is the definition.

## Countable sets

> **Example.** The odd positive integers $O$ are countable: $f(n) = 2n - 1$ is a bijection
> $\mathbb Z^+ \to O$. Injective: $2n - 1 = 2m - 1 \Rightarrow n = m$. Surjective: for odd $t$,
> $k = (t + 1)/2$ is a positive integer with $f(k) = t$.

> **Example.** $\mathbb Z$ is countable: $f(n) = 2n + 1$ for $n \ge 0$, $f(n) = -2(n + 1)$ for
> $n < 0$ is a bijection $\mathbb Z \to \mathbb Z^+$.

> **Example.** $\mathbb Z^+ \times \mathbb Z^+$ is countable. Lay the pairs out in a table and
> walk the diagonals: $(1,1), (1,2), (2,1), (1,3), (2,2), (3,1), \dots$ — pairs in increasing
> order of $i + j$, and lexicographic within a diagonal. Mapping each pair to its position is a
> bijection with $\mathbb Z^+$.

> **Example.** $\mathbb Q^+$ is countable: treat $i/j$ as the pair $(i, j)$, list as above,
> and skip any fraction equal to one already listed.

An infinite subset of a countable set, and a countable union of countable sets, are countable.

## The reals are uncountable

> **Theorem (Cantor).** $\mathbb R$ is uncountable.
>
> *Proof by diagonalization.* Suppose $\mathbb R$ were countable; then so is $[0, 1]$, listed
> as $r_1, r_2, \dots$ with decimal expansions $r_i = 0.d_{i1} d_{i2} d_{i3} \dots$. Build
> $r = 0.d_1 d_2 d_3 \dots$ with $d_i = 1$ if $d_{ii} \ne 1$ and $d_i = 2$ if $d_{ii} = 1$. Then
> $r \in [0, 1]$ but differs from every $r_j$ in the $j$-th digit, so it is not in the list —
> contradicting that the list contained all of $[0, 1]$.

Other uncountable sets: the power set of any infinite set, and the set of all infinite
binary strings (the same argument, with bits).

> **Key insight.** "Same size" for infinite sets means "there is a bijection", and it
> produces two tiers: everything you can list ($\mathbb Z$, $\mathbb Q$, pairs, programs) is
> countable, and anything that can be diagonalized against ($\mathbb R$, infinite bit strings,
> all languages over an alphabet) is not. The gap between the two is why some problems have
> no algorithm.
