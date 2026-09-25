---
title: Datalog and object data models
order: 12
status: detailed
weeks: [11, 12]
introduces: [datalog]
requires:
  - {concept: relational-algebra, strength: hard}
  - {concept: predicate-logic, strength: hard}
  - {concept: recursion, strength: soft}
  - {concept: class-and-object, strength: soft}
reinforces:
  - {concept: entity-relationship-model, perspective: "the object-oriented alternative to E/R design: ODL classes with attributes, relationships with inverses and multiplicity, and inheritance"}
---

The algebra composes operators; **Datalog** writes the same queries as logical
**rules** — "a movie is long *if* it is a movie *and* its length is at least 100" —
and gains one thing the algebra lacks: recursion, so that "reachable by train" is a
two-line program. The second half of the unit turns to design again, this time in the
object-oriented style: **ODL** classes with relationships and inheritance, the
alternative to E/R diagrams.

## Rules

> **Definition.** A Datalog **rule** has the form `head ← body`: the **head** is an
> atom $p(X_1, \dots, X_n)$, the **body** a list of **subgoals** — relational atoms
> $q(\dots)$, possibly negated (`NOT q(…)`), and arithmetic comparisons — read as a
> conjunction. Variables (capitalised) are universally quantified over the rule;
> constants are quoted or numeric. A **program** is a set of rules; the relations that
> appear only in bodies are the **extensional database (EDB)**, stored tables; those
> defined by rules are the **intensional database (IDB)**, computed.

`longMovie(T, Y) ← movie(T, Y, L, S), L >= 100` says: for every assignment of the
variables making every subgoal true, the head is true. Variables that appear only in
the body are *local* (existentially quantified in effect — "there is some length");
the head's are *global*. Two equivalent readings (deck DB11, slides 6–9): try every
assignment of values to variables, or every assignment of tuples to the subgoals.

## The algebra as rules

Every algebra operator is a rule or two (slides 11–18): projection drops variables
from the head, selection adds comparisons, product and join share (or do not share)
variables between subgoals, union is two rules with the same head, intersection two
subgoals, difference a positive and a negated subgoal:

```sim
id: db-353-datalog-algebra
custom: true
engine: db
mode: datalog
tables:
  movie: |
    title year length studio
    'Star Wars' 1977 124 Fox
    'Alien' 1979 117 Fox
    'Pretty Woman' 1990 119 Disney
    'Mighty Ducks' 1991 104 Disney
    'Short One' 1995 80 Fox
  starsIn: |
    title year star
    'Star Wars' 1977 'Carrie Fisher'
    'Alien' 1979 'Sigourney Weaver'
    'Pretty Woman' 1990 'Julia Roberts'
program: |
  longMovie(T, Y) :- movie(T, Y, L, S), L >= 100.
  foxStar(N) :- starsIn(T, Y, N), movie(T, Y, L, 'Fox').
  hasStar(T, Y) :- starsIn(T, Y, N).
  unstarred(T) :- movie(T, Y, L, S), NOT hasStar(T, Y).
note: "Four rules, three operators: a selection with projection, a join (T and Y shared between the subgoals, a constant in place of the studio), and a difference through negation — via the helper hasStar, because a variable may not appear only in a negated subgoal. Each round reports what each rule derives; without recursion one round does it and the next confirms the fixpoint. Write unstarred with NOT starsIn(T, Y, N2) directly and the evaluator refuses the rule as unsafe."
```

> **Definition.** A rule is **safe** when every variable of the head, of a negated
> subgoal and of a comparison also appears in a **positive** relational subgoal. An
> unsafe rule such as `p(X, Y) ← r(X)` would have infinitely many answers; the
> evaluator refuses it.

## Recursion and the fixpoint

An IDB predicate may appear in its own body. `reach(X, Y) ← train(X, Y)` and
`reach(X, Y) ← reach(X, Z), train(Z, Y)` define reachability — the transitive
closure, which no finite algebra expression computes (deck DB11, slides 20–24). The
meaning is the **least fixpoint**: start with every IDB relation empty, apply all the
rules to the current relations to derive new tuples, repeat until a round adds
nothing. The evaluator on this page applies the rules in order within a round, each
rule seeing the tuples derived just before it, which converges to the same fixpoint
in fewer rounds than the strictly simultaneous version.

Negation and recursion mix only under **stratification**: a predicate may be negated
in a rule only if it is fully computed before the rule's own predicate — so
`followUp(X, Y) ← sequelOf(X, Y)`, `followUp(X, Y) ← sequelOf(X, Z), followUp(Z, Y)`
is fine, and a rule negating its own predicate has no sensible meaning.

```sim
id: db-353-datalog-recursion
custom: true
engine: db
mode: datalog
tables:
  train: |
    from to
    Montreal Ottawa
    Ottawa Toronto
    Toronto Windsor
    Montreal Quebec
  sequelOf: |
    movie sequel
    'Rocky' 'Rocky II'
    'Rocky II' 'Rocky III'
    'Rocky III' 'Rocky IV'
program: |
  reach(X, Y) :- train(X, Y).
  reach(X, Y) :- reach(X, Z), train(Z, Y).
  farFromMontreal(Y) :- reach('Montreal', Y), NOT train('Montreal', Y).
  followUp(X, Y) :- sequelOf(X, Y).
  followUp(X, Y) :- sequelOf(X, Z), followUp(Z, Y).
note: "Two transitive closures, one round at a time: reach grows by one hop per round until Windsor is reached, followUp until Rocky IV follows Rocky. The negated rule uses only train (EDB) and reach (already complete), so the program is stratified. Add train(Windsor, Montreal) to the table for a cycle — the fixpoint still exists, with every city reaching every other."
```

## Object data models: ODL

The relational model has one structure; the **object-oriented** view has classes,
objects with identity, complex types, relationships between objects and inheritance.
**ODL** (Object Definition Language, from the ODMG standard) is a text notation for
such a design — the OO counterpart of an E/R diagram, which can likewise be converted
to relations.

> **Definition.** An ODL **class** declares a name and its **properties**: **attributes**
> (values of a type — primitives, records `Struct`, enumerations `enum`, and the
> collection types `Set`, `Bag`, `List`, `Array`, `Dictionary` of any type),
> **relationships** to other classes, each with an **inverse** declared in the other
> class (`relationship Set<Star> stars inverse Star::starredIn`), and **methods**. A
> **key** is declared with `(key attr)`; a class **extends** another to inherit its
> properties, and may extend several.

Multiplicity comes from the types: a relationship declared `Set<Movie>` on one side
and `Studio` (a single object) on the other is many-one; `Set` on both sides is
many-many; single on both, one-one. Where E/R attaches attributes to relationships,
ODL forces a new class; where E/R has isa hierarchies with possible multiple
membership, ODL has single-object-per-class inheritance, and a `CartoonMurderMystery`
must be declared as a class extending both.

```
class Movie (key (title, year)) {
    attribute string title;
    attribute integer year;
    attribute integer length;
    attribute enum Film {color, blackAndWhite} filmType;
    relationship Set<Star> stars inverse Star::starredIn;
    relationship Studio ownedBy inverse Studio::owns;
};
class Star (key name) {
    attribute string name;
    attribute Struct Addr {string street, string city} address;
    relationship Set<Movie> starredIn inverse Movie::stars;
};
class Studio (key name) {
    attribute string name;
    relationship Set<Movie> owns inverse Movie::ownedBy;
};
class Cartoon extends Movie {
    relationship Set<Star> voices;
};
```

Converting ODL to relations follows the E/R rules with two additions: a non-atomic
attribute is flattened (`street`, `city` become attributes) or, if it is a collection,
becomes a separate relation keyed by the class's key; a relationship is stored once,
on the "many" side or as its own relation, never in both classes.

```sim
id: db-353-odl-as-relations
custom: true
engine: db
mode: sql
query: |
  CREATE TABLE Movie (title TEXT, year INT, length INT, filmType TEXT, studioName TEXT, PRIMARY KEY (title, year));
  CREATE TABLE Star (name TEXT PRIMARY KEY, street TEXT, city TEXT);
  CREATE TABLE StarsIn (title TEXT, year INT, name TEXT, PRIMARY KEY (title, year, name));
  CREATE TABLE Cartoon (title TEXT, year INT, PRIMARY KEY (title, year));
  CREATE TABLE Voices (title TEXT, year INT, name TEXT, PRIMARY KEY (title, year, name));
  SELECT name AS relation FROM sqlite_master WHERE type = 'table';
note: "The ODL design above as relations: the Struct address is flattened into Star, the many-many relationship stars/starredIn becomes StarsIn stored once, the many-one ownedBy is folded into Movie as studioName, and the subclass Cartoon keeps only the superclass key plus its own relationship. Insert a movie and its cartoon tuple, then query Movie NATURAL JOIN Cartoon."
```

**Equations**

- *Rule semantics*: $p(\bar{X}) \leftarrow q_1, \dots, q_n$ means $\forall \bar{X}, \bar{Z}: (q_1 \land \dots \land q_n) \Rightarrow p(\bar{X})$, with the local variables $\bar{Z}$ existential in effect.
- *Fixpoint*: $IDB_0 = \emptyset$; $IDB_{i+1} = IDB_i \cup \mathrm{rules}(EDB, IDB_i)$; stop when $IDB_{i+1} = IDB_i$.
- *Algebra in Datalog*: $\pi$ = fewer head variables; $\sigma$ = comparison subgoals; $\times$ / $\bowtie$ = two subgoals with disjoint / shared variables; $\cup$ = two rules; $-$ = a negated subgoal.

> **Key insight.** A Datalog rule is a conjunctive query whose variables do the work of
> joins, and a program's meaning is the smallest set of facts closed under its rules —
> which is what lets it express recursion the algebra cannot. ODL is the object-oriented
> way to say what E/R diagrams say, and ends up as relations by the same mapping.

## Further reading

- [Ullman & Widom — ch. 5.3–5.4 and 4.9](http://infolab.stanford.edu/~ullman/fcdb.html) — Datalog rules, recursion and stratification; ODL and its translation to relations.
- [Abiteboul, Hull & Vianu — Foundations of Databases, ch. 12](http://webdam.inria.fr/Alice/) — Datalog semantics (least fixpoint, stratified negation) in full, freely available.
