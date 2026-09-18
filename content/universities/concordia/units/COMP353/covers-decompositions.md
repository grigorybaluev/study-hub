---
title: Canonical covers and decompositions
order: 7
status: detailed
weeks: [5]
notes: ["Deck DB05, Schema Refinement — Minimal Bases: slides 2–3 the cost of closures, covers; 4–6 canonical cover (minimal basis) and the algorithm; 7–19 the worked example on R(A, B, C, D, E, H) with F = {A → B, DE → A, BC → E, AC → E, BCD → A, AED → B}; 20–21 several canonical covers are possible; 22–24 dealing with redundancy by decomposing Star(name, address, phone); 25–26 decomposition and spurious tuples; 27–28 lossless-join decomposition and the test; 29–30 dependency-preserving decomposition"]
textbook: "Ullman & Widom, A First Course in Database Systems, 3e, ch. 3.2–3.4"
introduces: []
requires:
  - {concept: functional-dependency, strength: hard}
  - {concept: relational-algebra, strength: soft}
reinforces:
  - {concept: functional-dependency, perspective: "canonical covers as the minimal form of a set of FDs; decomposition of a schema and its two quality criteria, lossless join and dependency preservation"}
---

A set of FDs can say the same thing in many ways — with redundant FDs, with
attributes on the left that add nothing. Before a schema is split to remove
redundancy, the FDs themselves are reduced to a **canonical cover**, and then every
split is judged by two questions: can the original be recovered by joining the pieces
(**lossless**), and can every FD still be checked without joining (**dependency
preserving**)?

## Canonical covers

> **Definition.** A **canonical cover** (minimal basis) $G$ of $F$ is a set of FDs
> equivalent to $F$ ($G^+ = F^+$) such that every FD in $G$ has a single attribute on
> the right, no FD has an **extraneous** attribute on the left (removing it would
> change $G^+$), and no FD is **redundant** (removing it would change $G^+$). It is
> the smallest description of the same constraints; it is not unique.

The algorithm is three passes, each justified by closures (deck DB05, slides 4–6):
1. **split** every right-hand side into single attributes (decomposition rule);
2. **left reduction**: for each FD $X \to A$ and each attribute $B \in X$, if $A \in
   (X - B)^+$ under the current set, drop $B$ from the left side;
3. **redundancy**: for each FD $X \to A$, if $A \in X^+$ computed *without* that FD,
   drop it. Finally, merge FDs with the same left side.

```sim
id: db-353-canonical-cover
custom: true
engine: db
mode: fd-cover
attributes: A B C D E H
fds: ["A -> B", "DE -> A", "BC -> E", "AC -> E", "BCD -> A", "AED -> B"]
ops: ["cover"]
note: "The deck's example, twenty steps. Left reduction finds one extraneous attribute: in AED → B, A is implied by ED (ED⁺ = ABDE), so the FD shrinks to ED → B. The redundancy pass then drops AC → E (A → B and BC → E give it), BCD → A and ED → B. Three FDs remain: G = {A → B, DE → A, BC → E}. A different order of checks can give a different cover (slide 20)."
```

Two remarks the deck makes: the order in which FDs are examined can change the
answer — for $R(A, B, C)$ with $F = \{A \to B, B \to C, C \to A, A \to C, B \to A,
C \to B\}$ both $\{A \to B, B \to C, C \to A\}$ and $\{A \to B, B \to A, B \to C,
C \to B\}$ are canonical covers — and left reduction must come *before* the
redundancy pass, or a redundant FD may survive because of an attribute that was about
to be removed.

## Decomposition

> **Definition.** A **decomposition** of a relation schema $R$ is a set of schemas
> $R_1, \dots, R_k$ with $R_1 \cup \dots \cup R_k = R$; an instance $r$ of $R$ is stored
> as the projections $\pi_{R_i}(r)$. The purpose is to remove redundancy: `Star(name,
> address, phone)` with `name → address` becomes `S1(name, address)` and `S2(name,
> phone)`, and each address is stored once.

Splitting can lose information. Joining the pieces back always returns *at least* the
original tuples, and it may return more — **spurious tuples** — when the shared
attributes do not identify the rows (deck DB05, slides 25–26): `R(A, B, C)` with
$(1, 2, 3), (4, 2, 5)$ split into $(A, B)$ and $(B, C)$ joins back to four tuples,
two of them invented.

> **Definition.** A decomposition of $R$ into $R_1, \dots, R_k$ is **lossless-join** with
> respect to $F$ if for every instance $r$ satisfying $F$, $\pi_{R_1}(r) \bowtie \dots
> \bowtie \pi_{R_k}(r) = r$. For two pieces the test is a closure: the decomposition
> is lossless iff $R_1 \cap R_2 \to R_1$ or $R_1 \cap R_2 \to R_2$ is in $F^+$ — the
> common attributes must be a superkey of one of the pieces. For more pieces the
> **chase** of the next unit decides it.

```sim
id: db-353-lossless
custom: true
engine: db
mode: decomposition
attributes: name address phone
fds: ["name -> address"]
decomposition: "name, address; name, phone"
ops: ["chase"]
note: "Star split into (name, address) and (name, phone): the shared attribute name determines address, so name is a key of the first piece and the join is lossless — the tableau's second row loses its subscript in one step. Now test the bad split from the deck: attributes A B C, no FDs, decomposition AB, BC — nothing ever equates, the decomposition is lossy."
```

## Dependency preservation

Losslessness says the *data* survive; a second criterion says the *constraints* do.
After a decomposition each FD of $F$ must be enforced on inserts, and an FD whose
attributes are spread over two pieces can be checked only by joining them — on every
update, which defeats the purpose.

> **Definition.** The **projection** of $F$ onto $R_i$, $\pi_{R_i}(F)$, is the set of
> FDs $X \to Y$ in $F^+$ with $X, Y \subseteq R_i$. A decomposition is
> **dependency-preserving** if $(\pi_{R_1}(F) \cup \dots \cup \pi_{R_k}(F))^+ = F^+$ —
> every FD of $F$ follows from FDs that live inside single pieces. The deck's example
> (slides 29–30): $R(A, B, C, D)$ with $F = \{A \to B, B \to C, C \to D, A \to D\}$
> decomposed into $R_1(A, B)$, $R_2(B, C)$, $R_3(C, D)$ preserves every FD — $A \to D$
> is implied by the chain — while $R(A, B, C)$ with $\{A \to B, B \to C\}$ split into
> $(A, B)$ and $(A, C)$ does not: $B \to C$ needs both pieces.

```sim
id: db-353-dependency-preservation
custom: true
engine: db
mode: decomposition
attributes: A B C D
fds: ["A -> B", "B -> C", "C -> D", "A -> D"]
decomposition: "AB; BC; CD"
ops: ["preserve"]
note: "For each FD the projected closure is computed: closure steps may only use attributes inside one piece at a time. A → D is not inside any piece, yet A → B in AB, B → C in BC and C → D in CD chain to it: preserved. Now test A B C with A → B, B → C and the decomposition AB; AC — B → C is lost, and the chase would still say lossless: the two criteria are independent."
```

**Equations**

- *Canonical cover*: single attributes on the right; $B \in X$ is extraneous in $X \to A$ iff $A \in (X - B)^+_G$; $X \to A$ is redundant iff $A \in X^+_{G - \{X \to A\}}$.
- *Lossless join, two pieces*: $R_1 \cap R_2 \to R_1 \in F^+$ or $R_1 \cap R_2 \to R_2 \in F^+$.
- *Dependency preservation*: $\big(\bigcup_i \pi_{R_i}(F)\big)^+ = F^+$; to test $X \to Y$, iterate $Z \leftarrow Z \cup ((Z \cap R_i)^+ \cap R_i)$ from $Z = X$ and check $Y \subseteq Z$.

> **Key insight.** Reduce the FDs to a canonical cover first — every later algorithm
> takes it as input. Then judge any decomposition by two independent tests: the join
> must give back exactly the original (lossless), and every FD must live inside one
> piece or follow from ones that do (dependency-preserving). The normal forms of the
> next unit are decompositions that pass these tests by construction, or as nearly as
> possible.

## Further reading

- [Ullman & Widom — ch. 3.2–3.4](http://infolab.stanford.edu/~ullman/fcdb.html) — Minimal bases, projecting FDs, lossless joins and dependency preservation.
- [Silberschatz, Korth & Sudarshan — Database System Concepts, ch. 7](https://www.db-book.com/) — The same material with the canonical-cover algorithm stated as pseudocode.
