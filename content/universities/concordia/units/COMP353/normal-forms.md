---
title: Normal forms
order: 8
status: detailed
weeks: [6]
introduces: [normalization]
requires:
  - {concept: functional-dependency, strength: hard}
  - {concept: relational-model, strength: hard}
reinforces: []
---

A **normal form** is a guarantee: a schema in it cannot show a certain kind of
redundancy. The forms are nested — 1NF, 2NF, 3NF, BCNF, each stricter — and each is
a condition on the FDs of a single relation. This unit checks a schema against them,
decomposes into BCNF (always lossless, not always dependency-preserving) and
synthesises 3NF (always both, at the price of a little redundancy), and gives the
chase, the general test for losslessness.

## The four normal forms

Throughout, $R$ is a relation schema with FDs $F$; a **prime** attribute is one that
belongs to some candidate key; a **partial** dependency has a *proper* subset of a
key on the left; a **transitive** dependency $X \to A$ has neither a superkey nor a
part of a key on the left.

> **Definition.**
> - **1NF**: every attribute is atomic — true of every relation by the model.
> - **2NF**: 1NF, and no non-prime attribute depends on a proper part of a candidate
>   key (no partial dependencies).
> - **3NF**: for every non-trivial FD $X \to A$ in $F^+$, either $X$ is a superkey or
>   $A$ is prime. (Equivalently: 2NF and no non-prime attribute depends transitively on
>   a key.)
> - **BCNF** (Boyce–Codd): for every non-trivial FD $X \to A$ in $F^+$, $X$ is a
>   superkey. BCNF drops 3NF's escape clause for prime attributes, which is exactly
>   the case where 3NF still allows redundancy.

Each form implies the previous one. The escape clause is what makes them differ:
`Booking(street, city, zip)` with `street city → zip` and `zip → city` has keys
`{street, city}` and `{street, zip}`; `zip → city` violates BCNF (`zip` is not a
superkey) but not 3NF (`city` is prime) — and it stores the city once per address in
that zip, the redundancy 3NF tolerates.

```sim
id: db-353-normal-form-check
custom: true
engine: db
mode: normal-form
name: R
attributes: A B C D E
fds: ["AB -> C", "C -> B", "A -> D"]
ops: ["check"]
note: "Keys first (ABE and ACE — E is on no right-hand side), then every FD is judged: A → D has a proper part of a key on the left and D is non-prime, a partial dependency, so the schema is only in 1NF; C → B has B prime, which 3NF forgives and BCNF does not. Edit the FDs to {AB → C, C → B} alone: keys AB and AC, in 3NF but not BCNF — the zip-code situation."
```

## Decomposition into BCNF

> **Definition.** **BCNF decomposition**: while some $R_i$ has an FD $X \to Y$ (in the
> projection of $F$) with $X$ not a superkey of $R_i$, replace $R_i$ by $R_i \cap X^+$
> and $X \cup (R_i - X^+)$. Each split is lossless (the pieces share $X$, a superkey
> of the first), so the result is a lossless decomposition into BCNF schemas. It need
> not be dependency-preserving: an FD may end up spanning two pieces.

The deck's example (DB06, slide 6): $R = ABCDE$ with $F = \{A \to B, C \to D\}$ — the
key is $ACE$; $A \to B$ violates BCNF, so split into $A^+ = AB$ and $ACDE$; in $ACDE$,
$C \to D$ violates, split into $CD$ and $ACE$. Result: $AB, CD, ACE$, lossless and,
here, also dependency-preserving.

```sim
id: db-353-bcnf
custom: true
engine: db
mode: normal-form
name: R
attributes: A B C D E
fds: ["A -> B", "C -> D"]
ops: ["bcnf"]
note: "The deck's example: two splits, three relations, every FD inside one piece. Now change the FDs to {AB → C, C → B} (the zip-code shape): BCNF decomposition on C → B gives CB and AC — and AB → C now spans both relations, so it is no longer enforceable without a join. That loss is the price of BCNF; 3NF synthesis below refuses to pay it."
```

## 3NF synthesis

> **Definition.** **3NF synthesis**: compute a canonical cover $G$ of $F$; for each
> FD $X \to A$ in $G$ create a relation $XA$ (merging FDs with the same left side);
> drop a relation contained in another; if no relation contains a candidate key of $R$,
> add one relation holding a key. The result is in 3NF, dependency-preserving by
> construction (each FD of $G$ sits in its own relation) and lossless (the key relation
> or a relation containing a key makes the chase succeed).

The deck's example (DB06, slides 8–11): $R = ABCDE$ with $F = \{BD \to E, C \to B,
CE \to A\}$ gives $BDE$, $BC$, $ACE$; none of them contains the key $CD$, so the
relation $CD$ is added to make the join lossless. The last slide's example, $R = ABC$
with $\{A \to B, C \to B\}$, shows the other trap: 3NF synthesis yields $AB$, $CB$ and
the key relation $AC$; each piece is in BCNF, but the decomposition would not have
been found by asking for BCNF alone.

```sim
id: db-353-3nf-synthesis
custom: true
engine: db
mode: normal-form
name: R
attributes: A B C D E
fds: ["BD -> E", "C -> B", "CE -> A"]
ops: ["threenf"]
note: "One relation per FD of the canonical cover — BDE, BC, ACE — then the key test: the candidate key CD is inside none of them, so CD is added to make the join lossless. Press 'which normal form?' first to see why R itself is only in 1NF (C → B is a partial dependency on the key CD), and 'decompose into BCNF' to compare: BCNF splits differently and may lose an FD."
```

## The chase test

For decompositions into more than two pieces, losslessness is decided by the
**chase** (deck DB06, slides 13–15):

> **Definition.** Build a **tableau** with one row per $R_i$ and one column per
> attribute of $R$: in row $i$, write the unsubscripted symbol $a$ for each attribute of
> $R_i$ and a distinct subscripted $b_{ij}$ elsewhere. Repeatedly apply the FDs: when
> two rows agree on the left side of $X \to Y$, make them agree on $Y$ too, replacing a
> subscripted symbol by an unsubscripted one when possible (or by the other subscripted
> one). If some row becomes entirely unsubscripted, the decomposition is lossless;
> if the chase stops without one, it is lossy — and the final tableau is a
> counter-example instance whose join contains a spurious tuple.

```sim
id: db-353-chase
custom: true
engine: db
mode: decomposition
attributes: A B C D
fds: ["A -> B", "A -> C", "C -> D"]
decomposition: "AB; AC; CD"
ops: ["chase"]
note: "The deck's example, three pieces, so the two-piece closure test does not apply. Rows 1 and 2 agree on A, so B and then C are copied between them; rows 1, 2 and 3 then agree on C, so D is copied — row 1 is clean: lossless. Now chase the decomposition AB; BC; CD with the same FDs: only C → D fires and no row ever clears — lossy, and the final tableau is the instance that proves it."
```

**Equations**

- *3NF*: every non-trivial $X \to A \in F^+$ has $X$ a superkey or $A$ prime. *BCNF*: $X$ a superkey. Hierarchy: BCNF ⊂ 3NF ⊂ 2NF ⊂ 1NF.
- *BCNF split* on a violating $X \to Y$ in $R_i$: $R_i \to (R_i \cap X^+),\ (X \cup (R_i - X^+))$ — lossless since the pieces meet in $X$, a key of the first.
- *3NF synthesis*: $\{XA : X \to A \in G\}$ (merged by $X$), minus contained schemas, plus a key of $R$ if none contains one.
- *Chase*: apply FDs to the tableau until no change; lossless iff a row is all unsubscripted.

> **Key insight.** Normal forms are conditions on left-hand sides: 3NF lets an FD
> have a non-superkey left side only when the right side is prime, BCNF never. BCNF
> decomposition always gives a lossless result and sometimes loses an FD; 3NF
> synthesis keeps every FD and loses nothing, and settles for the small redundancy
> 3NF permits. The chase is the referee for losslessness in every case.

## Further reading

- [Ullman & Widom — ch. 3.3–3.5](http://infolab.stanford.edu/~ullman/fcdb.html) — BCNF, the chase and 3NF as in the decks.
- [Codd, "Further Normalization of the Data Base Relational Model" (1971)](https://forum.thethirdmanifesto.com/wp-content/uploads/asgarosforum/887/Codd-Further-Normalization.pdf) — Where 2NF and 3NF were first defined, with the anomalies that motivated them.
