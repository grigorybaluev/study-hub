---
title: Nested queries and views
order: 10
status: detailed
weeks: [8]
introduces: []
requires:
  - {concept: sql, strength: hard}
  - {concept: relational-algebra, strength: soft}
  - {concept: predicate-logic, strength: soft}
reinforces:
  - {concept: sql, perspective: "subqueries producing scalars, tuples and relations; EXISTS, IN, ANY, ALL; correlated subqueries; views and their updatability"}
---

A query's result is a relation, so it can appear wherever a relation can — inside
another query. **Subqueries** let a condition ask "is this value in that set?", "does
any tuple exist?", "greater than all of those?"; **views** give a query a name and
let it stand in for a table. Both are the SQL forms of the quantifiers logic supplies.

## Subqueries that produce one value

A query returning a single row with a single column is a **scalar**, usable where a
constant is: `SELECT name FROM MovieExec WHERE cert = (SELECT producerC FROM Movie
WHERE title = 'Star Wars')` — the producer of one movie, without a join. If the inner
query returns more than one row the comparison is an error; if it returns none, the
comparison is with `NULL` and no row qualifies.

## Conditions on relations: IN, EXISTS, ANY, ALL

> **Definition.** With `R` a subquery: `x IN R` is true when `x` equals some tuple of
> `R` (`NOT IN` its negation); `EXISTS R` is true when `R` is not empty; `x > ALL R`
> when `x` exceeds every value of `R` (`= ALL`, `< ALL` … likewise); `x > ANY R` (also
> written `SOME`) when it exceeds at least one. A tuple in parentheses, `(title, year)
> IN (SELECT title, year FROM …)`, compares whole tuples.

```sim
id: db-353-subqueries
custom: true
engine: db
mode: sql
tables:
  Movie: |
    title year length studioName producerC
    'Star Wars' 1977 124 Fox 12345
    'Empire Strikes Back' 1980 127 Fox 12345
    'Alien' 1979 117 Fox 34567
    'Pretty Woman' 1990 119 Disney 67890
    'Mighty Ducks' 1991 104 Disney 67890
  MovieExec: |
    name cert netWorth
    'George Lucas' 12345 200000000
    'Ridley S.' 34567 90000000
    'Jeffrey K.' 67890 8000000
    'Ted Turner' 23456 1250000000
  StarsIn: |
    title year starName
    'Star Wars' 1977 'Harrison Ford'
    'Empire Strikes Back' 1980 'Harrison Ford'
    'Pretty Woman' 1990 'Julia Roberts'
query: |
  SELECT name FROM MovieExec
  WHERE cert IN (SELECT producerC FROM Movie WHERE year >= 1980);
note: "Executives who produced a movie of 1980 or later — the subquery is a set of certificate numbers. Rewrite it with EXISTS (a correlated subquery over Movie), then find the executive richer than every producer with netWorth > (SELECT MAX(netWorth) FROM MovieExec WHERE cert IN (SELECT producerC FROM Movie)) — the deck's > ALL, which SQLite does not have — and the movies without a listed star with (title, year) NOT IN (SELECT title, year FROM StarsIn)."
```

## Correlated subqueries

A subquery may mention an attribute of the *outer* query; it is then evaluated once
per outer tuple, with that tuple's values plugged in — **correlated**. "Titles used
for more than one movie" (deck DB09, slides 13–14): for each movie `Old`, does a
movie with the same title and a later year exist? Attributes resolve to the nearest
enclosing query that has them, so tuple variables (`Old`, `New`) are the tool for
saying which `year` is meant. A simple (uncorrelated) subquery is evaluated once; a
correlated one is the SQL form of a join with a condition, and often the optimizer
turns it into one.

```sim
id: db-353-correlated
custom: true
engine: db
mode: sql
tables:
  Movie: |
    title year length studioName
    'King Kong' 1933 100 RKO
    'King Kong' 1976 134 Paramount
    'King Kong' 2005 187 Universal
    'Alien' 1979 117 Fox
    'Star Wars' 1977 124 Fox
query: |
  SELECT title, year FROM Movie Old
  WHERE EXISTS (SELECT * FROM Movie New WHERE New.title = Old.title AND New.year > Old.year);
note: "For each outer movie the inner query looks for a later movie with the same title; a movie qualifies if one exists — the two older King Kongs. The references to Old are what make it correlated. The deck writes the same with year < ANY (SELECT year FROM Movie WHERE title = Old.title); SQLite, which runs this page, has no ANY/ALL, so use year < (SELECT MAX(year) ...) instead. The longest movie of each studio: WHERE length >= (SELECT MAX(length) FROM Movie M2 WHERE M2.studioName = Old.studioName)."
```

## Views

> **Definition.** `CREATE VIEW V AS <query>` defines a **view**: a relation that is
> not stored but recomputed from its query whenever it is used. A view can be queried
> like a table, used inside other views, and given attribute names (`CREATE VIEW
> MovieProd(movieTitle, prodName) AS …`). Views define the **external** level of the
> three-level architecture: they hide attributes and tables from users who should not
> see them, and they give a stable interface when the base tables change.

The DBMS answers a query on a view by substituting the view's definition — the query
tree of the view replaces the view's name, and the optimizer flattens the result. So
a view costs nothing to define and exactly the underlying join to use (**materialized**
views, which are stored and maintained, are a different trade-off).

```sim
id: db-353-views
custom: true
engine: db
mode: sql
tables:
  Movie: |
    title year length studioName producerC
    'Star Wars' 1977 124 Fox 12345
    'Alien' 1979 117 Fox 34567
    'Pretty Woman' 1990 119 Disney 67890
    'Gone With the Wind' 1939 231 MGM 23456
  MovieExec: |
    name cert netWorth
    'George Lucas' 12345 200000000
    'Ridley S.' 34567 90000000
    'Jeffrey K.' 67890 8000000
    'David S.' 23456 50000000
query: |
  CREATE VIEW FoxMovie AS SELECT title, year FROM Movie WHERE studioName = 'Fox';
  CREATE VIEW MovieProd(movieTitle, prodName) AS
    SELECT title, name FROM Movie, MovieExec WHERE producerC = cert;
  SELECT prodName FROM MovieProd WHERE movieTitle = 'Gone With the Wind';
note: "Two views — a selection and a join with renamed attributes — then a query on the second that reads like a one-table query. Query FoxMovie, join it with MovieProd on the title, and insert a new Fox movie into Movie: the view shows it at once, because it is recomputed on every use."
```

## Updating views

Inserting into, deleting from or updating a view means changing the base tables so
that the view shows the change; that is possible only when the change has one
obvious meaning (deck DB09, slides 23–29). The standard's **updatable** views are
selections and projections of a **single** table, defined without `DISTINCT`,
aggregation or grouping, whose projection keeps enough attributes that a new tuple can
be built (attributes left out become `NULL` or their default). An insert into
`FoxMovie` then inserts a `Movie` tuple — with `studioName` `NULL`, so the new tuple
does not even appear in the view unless the definition is written `WHERE studioName =
'Fox'` and the system enforces `WITH CHECK OPTION`. A view over a join or with
aggregation is not updatable: there is no unique way to change the base tables.
Instead-of **triggers** (next unit) let a designer specify one.

**Equations**

- *Quantifiers as SQL*: $\exists t \in R: C(t)$ is `EXISTS (SELECT * FROM R WHERE C)`; $\forall t \in R: x > t.a$ is `x > ALL (SELECT a FROM R)`; $x \in \pi_a(R)$ is `x IN (SELECT a FROM R)`.
- *View use*: `SELECT … FROM V WHERE …` evaluates as `SELECT … FROM (V's query) WHERE …`.

> **Key insight.** A subquery is a relation built on the spot, and `IN`, `EXISTS`,
> `ANY`, `ALL` are the quantifiers that turn it into a condition — correlated when it
> looks at the outer tuple. A view is a subquery with a name; using it is free, updating
> it is possible only when the change to the base table is unambiguous.

## Further reading

- [Ullman & Widom — ch. 6.3 and 8.1](http://infolab.stanford.edu/~ullman/fcdb.html) — Subqueries and views as in the deck.
- [SQLite — CREATE VIEW](https://www.sqlite.org/lang_createview.html) — The engine on this page treats views as read-only; INSTEAD OF triggers are how it updates them.
