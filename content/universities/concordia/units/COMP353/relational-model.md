---
title: The relational model and E/R-to-relational design
order: 5
status: detailed
weeks: [3, 4]
introduces: [relational-model]
requires:
  - {concept: entity-relationship-model, strength: hard}
  - {concept: set, strength: hard}
  - {concept: relation, strength: soft}
reinforces: []
---

The relational model has one structure — the relation — and every entity set,
relationship and subclass of an E/R diagram becomes one (or, sometimes, none). This
unit states the model precisely and then applies the conversion rules: entity set to
relation, relationship to relation with the keys of what it connects, weak entity set
with borrowed keys, and three ways to flatten an isa hierarchy.

## Relations

> **Definition.** A **relation** has a **schema** — a name and a set of **attributes**,
> each with a **domain** (type): `Movie(title, year, length, filmType)` — and an
> **instance**, a set of **tuples** each giving one value per attribute. Drawn as a
> table, attributes are column headings and tuples rows; but as a *set*, a relation
> has no order of rows and no duplicate rows, and the order of columns is a matter of
> the schema, not of the data. A **relational database schema** is a set of relation
> schemas; an instance of it is an instance of each.

Attributes are atomic: a relation is in **first normal form** by definition — no
attribute holds a set, list or record (that is why a star's several addresses become
several tuples or another relation). Keys carry over from E/R: a **key** of a relation
is a minimal set of attributes no two tuples agree on, underlined in the schema.

The model's strength (deck DB03, slide 6) is that its query languages — relational
algebra and SQL — are simple to state and to reason about, and a query optimizer can
rewrite an expression into any equivalent one.

## From E/R to relations

The conversion is a set of rules applied element by element (deck DB03, slides 8–23):

1. **Entity set** `E` with attributes $a_1 \dots a_n$ → relation `E(a₁, …, aₙ)` with
   the same key. (`Movies(title, year, length, filmType)`.)
2. **Relationship set** `R` connecting $E_1 \dots E_k$ → relation `R` whose attributes
   are the key attributes of every $E_i$ plus `R`'s own attributes; attributes with
   the same name in different sets are **renamed** (`Sequel-of(originalTitle,
   originalYear, sequelTitle, sequelYear)`). The **key** of `R`: all the key attributes
   when `R` is many-many; for a **many-one** relationship, only the key of the "many"
   side, since that entity determines the rest — and the relation may then be merged
   into the "many" entity set's relation (`Movies(title, year, length, filmType,
   studioName)` absorbs `Owns`). One-one: either side's key.
3. **Weak entity set** `W` → relation with `W`'s own attributes plus the key attributes
   of the supporting entity sets (borrowed through the supporting relationships); the
   supporting relationships themselves get **no** relation — everything they would
   contain is already in `W`. (`Crews(number, studioName)`, and `Unit-of` disappears.)

```sim
id: db-353-er-to-relations
custom: true
engine: db
mode: er
er:
  entities:
    Movies: {attrs: ['title*', 'year*', 'length', 'filmType']}
    Stars: {attrs: ['name*', 'address']}
    Studios: {attrs: ['name*', 'address']}
    Crews: {attrs: ['number*'], weak: true}
  relationships:
    - {name: Stars-in, between: [Movies, Stars]}
    - {name: Owns, between: [Movies, Studios], arrow: [Studios]}
    - {name: Unit-of, between: [Crews, Studios], arrow: [Studios], supporting: true}
    - {name: Sequel-of, between: [Movies, Movies], roles: [original, sequel], arrow: [original]}
  layout: {Movies: [30, 25], Stars: [12, 75], Studios: [70, 75], Crews: [92, 25]}
ops: ["convert"]
note: "Every rule in turn: entity sets first, then the weak set with the studio name borrowed into its key, then each relationship — Stars-in keeps all four key attributes, Owns keeps only the movie's (many-one), Sequel-of renames the two copies of Movies' key by role, Unit-of produces nothing. Underlined attributes are keys. Take an arrow off Owns and convert again."
```

The relation for a many-one relationship is a design choice: separate, or merged into
the relation of the "many" side. Merging saves a join and a relation but forces `NULL`s
in the added attributes for entities that take part in no relationship — the reason a
*many-many* relationship can never be merged (it would repeat the entity's tuples).

## isa hierarchies

An isa hierarchy — `Cartoons isa Movies`, `MurderMysteries isa Movies` — can become
relations in three ways (slides 24–30), each with a cost:

| approach | relations | a cartoon murder mystery is | cost |
|---|---|---|---|
| **E/R style** | one per entity set: `Movies(title, year, length, filmType)`, `Cartoons(title, year)`, `MurderMysteries(title, year, weapon)`; subclass relations hold the superclass key plus own attributes | a tuple in all three | joins to reassemble an object |
| **object-oriented** | one per *subtree* (possible class combination): `Movies`, `MoviesC`, `MoviesMM`, `MoviesCMM`, each with every attribute of its combination | exactly one tuple, in `MoviesCMM` | many relations; queries must union them |
| **nulls** | one wide relation with every attribute of every subclass; inapplicable attributes are `NULL` | one tuple, `weapon` set, other subclass attributes `NULL` | nulls everywhere; cannot tell "not a cartoon" from "unknown" |

A quick test from the deck: with `E1 = {a1, a2}` and `E2 = {b1, b2}`, a many-one
relationship from `E1` to `E2` can contain `(a1, b1), (a2, b1)` but not
`(a1, b1), (a1, b2)`.

```sim
id: db-353-isa-styles
custom: true
engine: db
mode: sql
tables:
  Movies: |
    title year length
    'Roger Rabbit' 1988 104
    'Star Wars' 1977 124
    'Alien' 1979 117
  Cartoons: |
    title year
    'Roger Rabbit' 1988
  MurderMysteries: |
    title year weapon
    'Roger Rabbit' 1988 'dip'
    'Alien' 1979 'xenomorph'
query: |
  SELECT m.title, m.length, c.title IS NOT NULL AS cartoon, mm.weapon
  FROM Movies m
  LEFT JOIN Cartoons c ON c.title = m.title AND c.year = m.year
  LEFT JOIN MurderMysteries mm ON mm.title = m.title AND mm.year = m.year;
note: "The E/R-style relations, reassembled: an outer join per subclass (unit 11) puts the object back together, with NULL for subclasses a movie is not in. Roger Rabbit is in both. Compare with the nulls approach: one table Movies(title, year, length, weapon, isCartoon) needs no join but cannot distinguish 'no weapon' from 'not a murder mystery'."
```

**Equations**

- *Key of a relationship relation*: many-many → the union of the connected keys; many-one from $E$ to $F$ → the key of $E$; one-one → either key.
- *Weak entity set* $W$ supported by $S$: attributes $= \mathrm{attrs}(W) \cup \mathrm{key}(S)$, key $= \mathrm{key\text{-}attrs}(W) \cup \mathrm{key}(S)$.

> **Key insight.** A relation is a set of tuples over named attributes; an E/R diagram
> converts to relations by a rule per element, and the only judgement calls are where
> to put a many-one relationship and how to flatten isa — both trade joins against
> nulls.

## Further reading

- [Ullman & Widom — ch. 2.2 and 4.5–4.6](http://infolab.stanford.edu/~ullman/fcdb.html) — The relational model and the E/R-to-relational rules, with the same examples.
- [Codd, "A Relational Model of Data for Large Shared Data Banks" (1970)](https://dl.acm.org/doi/10.1145/362384.362685) — Where relations, normal form and the algebra come from.
