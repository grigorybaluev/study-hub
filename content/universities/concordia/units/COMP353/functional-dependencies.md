---
title: Functional dependencies
order: 6
status: detailed
weeks: [4, 5]
introduces: [functional-dependency]
requires:
  - {concept: relational-model, strength: hard}
  - {concept: set, strength: hard}
  - {concept: proof-techniques, strength: soft}
reinforces: []
---

A key says "these attributes determine the whole tuple". A **functional dependency**
says the same thing about *any* set of attributes and *any* other — `title, year →
length`, `SIN → name` — and once a designer writes down what determines what, the
schema's redundancy becomes a computable property. This unit is the calculus of FDs:
what they mean, how to derive new ones, and the closure algorithm that answers "does
this FD follow?" in a few lines.

## Definition and meaning

> **Definition.** For a relation schema $R$ and attribute sets $X, Y \subseteq R$, the
> **functional dependency** $X \to Y$ holds on $R$ if in every legal instance, any two
> tuples that agree on all attributes of $X$ also agree on all attributes of $Y$ —
> "$X$ functionally determines $Y$". An FD is a statement about *all* instances the
> designer allows, not about one table; an instance can only *violate* an FD, never
> prove it.

Keys are the special case $K \to R$: $K$ is a superkey exactly when $K$ determines
every attribute. $X \to Y$ is **trivial** when $Y \subseteq X$ (`title, year → title`).
FDs come from the meaning of the data: on `Movie(title, year, length, filmType,
studioName, starName)`, `title year → length filmType studioName` holds (a movie has one
length), but `title year → starName` does not (several stars).

Why they matter (slides 10–14): a schema that packs two facts into one relation —
`Star(name, address, phone)` where a star has one address but several phones — repeats
the address once per phone. **Redundancy** brings the **anomalies**: an *update* must
change every copy, a *deletion* of the last phone loses the address, an *insertion*
of an address needs a phone. The FD `name → address` together with `name ↛ phone` is
exactly the diagnosis, and splitting into `(name, address)` and `(name, phone)` the
cure — the theme of units 7 and 8.

## Implication and Armstrong's axioms

> **Definition.** A set $F$ of FDs **implies** $X \to Y$ (written $F \models X \to Y$) if
> every instance satisfying all of $F$ satisfies $X \to Y$. The **closure** $F^+$ is
> the set of all FDs implied by $F$. Two sets $F$ and $G$ are **equivalent** (each
> **covers** the other) when $F^+ = G^+$.

FDs are derived with **Armstrong's axioms** (1974), which are sound (derive only
implied FDs) and complete (derive all of them):

- **Reflexivity**: if $Y \subseteq X$ then $X \to Y$ (the trivial FDs).
- **Augmentation**: if $X \to Y$ then $XZ \to YZ$ for any $Z$.
- **Transitivity**: if $X \to Y$ and $Y \to Z$ then $X \to Z$.

From these follow the rules used in practice: **union** ($X \to Y$ and $X \to Z$ give
$X \to YZ$), **decomposition** ($X \to YZ$ gives $X \to Y$ and $X \to Z$ — so every
set of FDs can be written with single attributes on the right), and
**pseudotransitivity** ($X \to Y$ and $WY \to Z$ give $WX \to Z$). The deck's hidden-FD
example: from $F = \{A \to B, A \to C, CG \to H, CG \to I, B \to H\}$ one derives
$A \to H$ (transitivity), $CG \to HI$ (union) and $AG \to I$ (pseudotransitivity).

## Attribute closure

Deriving by axioms is a search; the practical tool is the **closure of a set of
attributes**:

> **Definition.** Given $F$ and $X \subseteq R$, the **attribute closure** $X^+$ is the
> set of all attributes $A$ such that $F \models X \to A$. Algorithm: start with
> $X^+ = X$; while some FD $Y \to Z$ in $F$ has $Y \subseteq X^+$ and $Z \not\subseteq
> X^+$, add $Z$ to $X^+$. Then $F \models X \to Y$ **if and only if** $Y \subseteq X^+$,
> and $X$ is a superkey if and only if $X^+ = R$.

```sim
id: db-353-closure
custom: true
engine: db
mode: fd-closure
attributes: A B C D E H
fds: ["AB -> C", "BC -> AD", "D -> E", "CH -> B"]
x: AB
ops: ["closure AB"]
note: "The deck's example R(A, B, C, D, E, H). Starting from AB, the FDs fire one after another — AB → C, then BC → AD, then D → E — and stop at ABCDE: H is never reached, so AB is not a superkey. Try D (only DE), CH (everything: a superkey), and use the second box to test whether F implies AB → E or D → A."
```

The closure algorithm runs in time polynomial in $|F|$ and $|R|$ — each pass adds at
least one attribute — where listing $F^+$ would be exponential (slide 31): a schema
with $n$ attributes has $2^n$ candidate left-hand sides. Every later question is
reduced to closures: whether an FD is implied, whether a set is a superkey, which sets
are keys, whether one set of FDs covers another (check each FD of the second against
the first).

```sim
id: db-353-keys
custom: true
engine: db
mode: fd-keys
attributes: A B C D E H
fds: ["AB -> C", "BC -> AD", "D -> E", "CH -> B"]
ops: ["keys"]
note: "Candidate keys by closure: H appears on no right-hand side, so every key contains it; the search then tries H with subsets of the other attributes, smallest first, skipping supersets of keys already found. CH and ABH are the candidate keys of the deck's schema. Test ABCH yourself — a superkey, but not minimal."
```

## Reasoning about instances

An instance **satisfies** an FD when no pair of its tuples violates it; the instance
satisfies $F$ when it satisfies every FD in $F$, and then it satisfies every FD in
$F^+$ too. Seeing whether an instance violates $X \to Y$ is a query: group by $X$ and
count distinct $Y$.

```sim
id: db-353-fd-violation
custom: true
engine: db
mode: sql
tables:
  Movie: |
    title year length studioName starName
    'Star Wars' 1977 124 Fox 'Carrie Fisher'
    'Star Wars' 1977 124 Fox 'Mark Hamill'
    'Star Wars' 1977 124 Fox 'Harrison Ford'
    'Alien' 1979 117 Fox 'Sigourney Weaver'
    'King Kong' 1933 100 RKO 'Fay Wray'
    'King Kong' 1976 134 Paramount 'Jessica Lange'
query: |
  SELECT title, year, COUNT(DISTINCT length) AS lengths, COUNT(DISTINCT starName) AS stars
  FROM Movie GROUP BY title, year;
note: "One group per (title, year): lengths is 1 everywhere, so the instance satisfies title year → length; stars is 3 for Star Wars, so title year → starName is violated — a movie has several stars, and repeating the length once per star is the redundancy FDs are meant to catch. Change a length of one Star Wars row and query again."
```

**Equations**

- *FD*: $X \to Y$ holds iff $\forall t, u$: $t[X] = u[X] \Rightarrow t[Y] = u[Y]$; trivial iff $Y \subseteq X$; $K$ superkey iff $K \to R$.
- *Armstrong*: reflexivity $Y \subseteq X \Rightarrow X \to Y$; augmentation $X \to Y \Rightarrow XZ \to YZ$; transitivity $X \to Y,\ Y \to Z \Rightarrow X \to Z$.
- *Closure test*: $F \models X \to Y \iff Y \subseteq X^+$; $X^+$ computed by adding the right side of every FD whose left side is inside the current set, until no change.

> **Key insight.** An FD is a promise about every instance; Armstrong's axioms
> generate everything the promises imply; and the attribute closure turns "does $F$
> imply $X \to Y$?" into a mechanical, polynomial-time check that the rest of design
> theory calls in a loop.

## Further reading

- [Ullman & Widom — ch. 3.1–3.2](http://infolab.stanford.edu/~ullman/fcdb.html) — FDs, rules and the closure algorithm with the same schema.
- [Armstrong, "Dependency Structures of Data Base Relationships" (1974)](https://dl.acm.org/doi/10.5555/647503.723890) — The original axioms.
