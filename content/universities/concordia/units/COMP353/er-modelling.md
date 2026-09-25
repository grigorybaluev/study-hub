---
title: Entity-relationship modelling
order: 4
status: detailed
weeks: [3]
introduces: [entity-relationship-model]
requires:
  - {concept: database-system, strength: hard}
  - {concept: set, strength: soft}
  - {concept: relation, strength: soft}
reinforces: []
---

Before a table exists, someone decided what the things are and how they connect. The
**entity-relationship model** is the notation for that decision — boxes for kinds of
things, diamonds for connections, ovals for the facts recorded about each — and its
diagram is what the relational schema of the next unit is derived from.

## Entities, relationships, attributes

Design runs from requirements collection through **conceptual design** (the E/R
diagram), **logical design** (the relational schema) and **physical design**
(indexes, storage). The E/R model (Chen, 1976) is the standard graphical language for
the first step.

> **Definition.** An **entity** is a distinguishable real-world object; an **entity
> set** is a collection of similar entities, drawn as a rectangle (`Movies`, `Stars`,
> `Studios`). An **attribute** is a property of the entities of a set, drawn as an
> oval attached to it (`title`, `year`); attributes are atomic (a single value of a
> primitive type — no lists, no records). A **relationship** is an association among
> entities of two or more sets, drawn as a diamond connected to the sets (`Stars-in`
> between `Movies` and `Stars`); a **relationship set** is the collection of such
> associations — a set of tuples, one per associated group of entities.

```sim
id: db-353-er-movies
custom: true
engine: db
mode: er
er:
  entities:
    Movies: {attrs: ['title*', 'year*', 'length', 'filmType']}
    Stars: {attrs: ['name*', 'address']}
    Studios: {attrs: ['name*', 'address']}
  relationships:
    - {name: Stars-in, between: [Movies, Stars]}
    - {name: Owns, between: [Movies, Studios], arrow: [Studios]}
  layout: {Movies: [50, 25], Stars: [15, 70], Studios: [85, 70]}
note: "The deck's running example: three entity sets, a many-many relationship (no arrows) and a many-one one — the arrow into Studios says a movie is owned by at most one studio. Underlined attributes are keys. Press convert to relations to see, one element at a time, the schema this diagram becomes (unit 5 explains the rules)."
```

## Multiplicity

> **Definition.** A binary relationship between `E` and `F` is **many-many** when an
> entity of either set may be associated with any number of the other; **many-one**
> from `E` to `F` when each `E` entity is associated with at most one `F` entity —
> drawn with an arrow into `F`; **one-one** when the arrow goes both ways. A *rounded*
> arrowhead means *exactly* one (**referential integrity**: the associated entity must
> exist). Multiplicity is the first constraint a diagram states, and the one that most
> shapes the relational schema.

`Owns` is many-one from `Movies` to `Studios`: many movies, one owner each.
`Presidents` between `Studios` and `Execs` is one-one. A **multiway** relationship
connects three or more sets — `Contracts` among `Stars`, `Movies` and `Studios` — and
an arrow into one of them means: for each choice of entities from the *other* sets
there is at most one entity of that set. Any $n$-ary relationship can be replaced by a
connecting entity set and $n$ binary many-one relationships (slides 26–28), which some
notations require.

An attribute may hang off a relationship (`salary` on `Contracts`); it can always be
moved into a new or existing entity set (a `Salaries` set with a many-one relationship),
which is what a relational schema does with it. When an entity set appears twice in a
relationship — `Sequel-of` between `Movies` and `Movies` — the two lines carry
**roles** (`original`, `sequel`) to tell them apart.

## Subclasses: isa

> **Definition.** An **isa** relationship (a triangle) makes one entity set a
> **subclass** of another: `Cartoons isa Movies`. A cartoon *is* a movie — it has every
> attribute and relationship of `Movies` — and in addition its own (`Voices` to
> `Stars`). In E/R an entity may belong to several subclasses at once (a
> `MurderMystery` cartoon), unlike object-oriented inheritance where an object has one
> most-specific class (slide 31).

## Constraints

Everything said so far except multiplicity is structure; **constraints** add the
rules the real world imposes (slides 32–45):

- **Keys.** A **superkey** is a set of attributes whose values determine the entity
  uniquely; a **key** (candidate key) is a minimal superkey; the designer picks one as
  the **primary key**. For `Movies`, `title` alone fails (remakes), `{title, year}`
  works; for `Stars`, `name` is usually accepted; for `Studios`, `name`. Criteria for
  choosing among candidates: small, stable, never null, meaningful to users.
- **Single-value constraints**: an attribute has at most one value (atomicity), and a
  many-one relationship gives each entity at most one partner — with "at most" meaning
  possibly none unless the rounded arrow demands existence.
- **Referential integrity**: the entity referred to across a relationship must exist —
  a movie's owning studio is a real studio.
- **Domain constraints**: a `length` is a positive integer, a `gender` is F or M.
- **Degree constraints**: a bound on how many relationships an entity takes part in (a
  star in at most ten movies).

```sim
id: db-353-er-keys
custom: true
engine: db
mode: sql
tables:
  Movie: |
    title year studioName
    'King Kong' 1933 RKO
    'King Kong' 1976 Paramount
    'King Kong' 2005 Universal
    'Alien' 1979 Fox
query: |
  SELECT title, COUNT(*) AS remakes FROM Movie GROUP BY title HAVING COUNT(*) > 1;
note: "Why title alone is not a key: three King Kongs. Run SELECT title, year, COUNT(*) FROM Movie GROUP BY title, year HAVING COUNT(*) > 1 — empty, so {title, year} is a superkey of this instance (a key is a design decision about all possible instances, not a property of one)."
```

## Weak entity sets

> **Definition.** A **weak entity set** (double rectangle) has no key of its own: its
> key is made of some of its attributes plus the key(s) of entity set(s) it is
> connected to by **supporting relationships** (double diamonds), which must be
> many-one from the weak set and require existence. A `Crews` set numbered 1, 2, 3
> *within* a studio is identified by `(number, studio name)` through the supporting
> relationship `Unit-of`.

Weak entity sets arise from part-of hierarchies (a species within a genus, a crew
within a studio) and from connecting entity sets that replace multiway relationships
(`Contracts` identified by the star, the movie and the studio it connects).

```sim
id: db-353-er-weak
custom: true
engine: db
mode: er
er:
  entities:
    Studios: {attrs: ['name*', 'address']}
    Crews: {attrs: ['number*'], weak: true}
    Movies: {attrs: ['title*', 'year*']}
    Cartoons: {attrs: []}
    Stars: {attrs: ['name*']}
  relationships:
    - {name: Unit-of, between: [Crews, Studios], arrow: [Studios], supporting: true}
    - {name: Voices, between: [Cartoons, Stars]}
  isa: [{sub: Cartoons, super: Movies}]
  layout: {Studios: [20, 25], Crews: [20, 75], Movies: [65, 25], Cartoons: [65, 75], Stars: [92, 75]}
note: "A weak entity set (double box) with its supporting relationship (double diamond, arrow into Studios), and an isa subclass with its own relationship. Convert to relations: Crews gets the studio's name into its key; Cartoons gets the key of Movies plus nothing of its own; Unit-of needs no relation at all."
```

Design principles (slides 52–53): model the reality faithfully, avoid redundancy (every
fact in one place), keep the design simple (do not introduce an entity set for what is
an attribute), and choose the right element — an attribute when the thing has no
further structure, an entity set when it has attributes of its own or takes part in
relationships.

> **Key insight.** An E/R diagram records three decisions: which things are entity
> sets, which connections are relationships and with what multiplicity, and which
> attribute sets are keys. Get those right and the relational schema is mechanical;
> get multiplicity or keys wrong and no later step can repair it.

## Further reading

- [Ullman & Widom — ch. 4](http://infolab.stanford.edu/~ullman/fcdb.html) — The E/R model with the same movie examples.
- [Chen, "The Entity-Relationship Model — Toward a Unified View of Data" (1976)](https://dl.acm.org/doi/10.1145/320434.320440) — The original paper; still readable in an afternoon.
