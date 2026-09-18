---
title: SQL queries
order: 2
status: detailed
weeks: [1, 2]
notes: ["Deck DB01: slides 36–43 SELECT-FROM-WHERE, the WHERE clause; 44–57 products and joins, join in SQL, joining relations; 58–62 aggregation operators; 63–72 grouping, nulls in aggregation, HAVING; 73 ORDER BY. Deck DB08, More on SQL Queries: slides 2–6 the SELECT clause (renaming, expressions, constants); 7–10 string comparison, LIKE and escapes; 11 ordering; 12–13 products and joins; 14–20 union, intersection, difference, duplicate elimination, UNION ALL. Silberschatz ch. 4 deck: basic structure, set operations, aggregate functions, joined relations"]
textbook: "Ullman & Widom, A First Course in Database Systems, 3e, ch. 6.1–6.4"
introduces: [sql]
requires:
  - {concept: database-system, strength: hard}
  - {concept: set, strength: soft}
  - {concept: propositional-logic, strength: soft}
reinforces: []
---

SQL is a language for saying *which* rows and columns you want, not how to find them.
One statement shape — `SELECT … FROM … WHERE …` — covers projection, selection and
joins; two clauses more — `GROUP BY` and `HAVING` — cover aggregation. Every block on
this page runs against a real SQLite database seeded with the movie tables the decks
use; edit the query and press Run.

## SELECT–FROM–WHERE

> **Definition.** `SELECT L FROM R WHERE C` returns, for every tuple of relation `R`
> satisfying condition `C`, the attributes listed in `L` (`*` means all). The result is
> a relation — in SQL a **bag**: duplicates are kept unless `SELECT DISTINCT` is used.
> Keywords are case-insensitive; string literals are in single quotes and are
> case-sensitive.

The condition may compare attributes and constants with `=`, `<>`, `<`, `<=`, `>`,
`>=`, combine comparisons with `AND`, `OR`, `NOT`, and test strings against a pattern
with `LIKE`: `%` matches any string, `_` any single character (`'Star %'`; to match a
literal `%` declare an escape, `LIKE 'x10\%' ESCAPE '\'`). The `SELECT` list may
rename with `AS`, compute expressions (`length / 60 AS hours`), and even output a
constant. `ORDER BY a, b DESC` sorts the result — the only way to get an order, since
a relation has none.

```sim
id: db-353-select-where
custom: true
engine: db
mode: sql
tables:
  Movie: |
    title year length filmType studioName producerC
    'Star Wars' 1977 124 color Fox 12345
    'Empire Strikes Back' 1980 127 color Fox 12345
    'Mighty Ducks' 1991 104 color Disney 67890
    "Wayne's World" 1992 95 color Paramount 99999
    'Alien' 1979 117 color Fox 12345
    'Gone With the Wind' 1939 231 color MGM 23456
    'Pretty Woman' 1990 119 color Disney 67890
query: |
  SELECT title, year, length / 60.0 AS hours, 'long' AS note
  FROM Movie
  WHERE studioName = 'Fox' AND length >= 120
  ORDER BY year DESC;
note: "Projection (the SELECT list, with an expression and a constant), selection (WHERE) and sorting. Try WHERE title LIKE 'S%' OR title LIKE '%s', then SELECT DISTINCT studioName FROM Movie — without DISTINCT the bag keeps every Fox twice. Wayne's World has an apostrophe: write it as 'Wayne''s World'."
```

## Products and joins

Listing several relations in `FROM` forms their **Cartesian product** — every tuple of
the first paired with every tuple of the second — and the `WHERE` clause keeps the
pairs that belong together: `FROM Movie, StarsIn WHERE Movie.title = StarsIn.title AND
Movie.year = StarsIn.year`. Attributes present in both relations must be qualified
with the relation name; a **tuple variable** (`Movie m, StarsIn s`) shortens that and
is required when a relation is joined with itself. The same query reads more clearly
with an explicit `JOIN … ON`, and `NATURAL JOIN` pairs on all attributes with the same
name (unit 9 defines these as algebra).

```sim
id: db-353-joins
custom: true
engine: db
mode: sql
tables:
  Movie: |
    title year length studioName
    'Star Wars' 1977 124 Fox
    'Empire Strikes Back' 1980 127 Fox
    'Alien' 1979 117 Fox
    'Pretty Woman' 1990 119 Disney
    'Mighty Ducks' 1991 104 Disney
  StarsIn: |
    title year starName
    'Star Wars' 1977 'Carrie Fisher'
    'Star Wars' 1977 'Mark Hamill'
    'Star Wars' 1977 'Harrison Ford'
    'Empire Strikes Back' 1980 'Carrie Fisher'
    'Empire Strikes Back' 1980 'Mark Hamill'
    'Alien' 1979 'Sigourney Weaver'
    'Pretty Woman' 1990 'Julia Roberts'
    'Pretty Woman' 1990 'Richard Gere'
  MovieStar: |
    name gender birthdate
    'Carrie Fisher' F 1956
    'Mark Hamill' M 1951
    'Harrison Ford' M 1942
    'Sigourney Weaver' F 1949
    'Julia Roberts' F 1967
    'Richard Gere' M 1949
query: |
  SELECT s.starName, m.title, m.studioName
  FROM Movie m, StarsIn s
  WHERE m.title = s.title AND m.year = s.year AND m.studioName = 'Fox';
note: "Without the two equalities the product has 5 × 8 = 40 rows — run SELECT COUNT(*) FROM Movie, StarsIn to see it. Rewrite the query as Movie NATURAL JOIN StarsIn WHERE studioName = 'Fox', then add MovieStar to find the female stars of Fox movies (join on starName = name). A self-join: pairs of stars who appeared in the same movie, with s1.starName < s2.starName to avoid duplicates and mirror pairs."
```

## Aggregation and grouping

> **Definition.** The **aggregation operators** `SUM`, `AVG`, `MIN`, `MAX` and `COUNT`
> apply to a column of the result and produce one value; `COUNT(*)` counts tuples,
> `COUNT(DISTINCT a)` distinct values. **`GROUP BY a`** partitions the tuples that pass
> the `WHERE` into groups with equal `a`, and the `SELECT` list may then contain only
> the grouping attributes and aggregates, one output row per group. **`HAVING C`**
> filters *groups* by a condition on aggregates, after grouping — `WHERE` filters
> tuples before it.

Two rules about `NULL` (deck DB01, slides 66–69): a `NULL` in a grouping attribute
forms its own group and is counted by `COUNT(*)`, but `NULL` values are **ignored** by
`SUM`, `AVG`, `MIN`, `MAX` and `COUNT(a)` — so on `R(A, B)` with tuples (null, 1),
(2, null), (null, null), the query `SELECT A, SUM(B) FROM R GROUP BY A` returns two
groups, `(null, 1)` and `(2, null)`, and `COUNT(*)` on the null group says 2 while
`COUNT(B)` says 1.

```sim
id: db-353-aggregation
custom: true
engine: db
mode: sql
tables:
  Movie: |
    title year length studioName
    'Star Wars' 1977 124 Fox
    'Empire Strikes Back' 1980 127 Fox
    'Alien' 1979 117 Fox
    'Pretty Woman' 1990 119 Disney
    'Mighty Ducks' 1991 104 Disney
    'Gone With the Wind' 1939 231 MGM
    'Untitled' 2001 - Fox
query: |
  SELECT studioName, COUNT(*) AS movies, COUNT(length) AS timed,
         SUM(length) AS total, AVG(length) AS average, MIN(year) AS first
  FROM Movie
  GROUP BY studioName
  HAVING COUNT(*) >= 2
  ORDER BY total DESC;
note: "One row per studio that passes the HAVING clause. Fox has 4 movies but only 3 with a known length — COUNT(*) versus COUNT(length) — and its SUM and AVG ignore the NULL. Move the condition COUNT(*) >= 2 into WHERE and read the error; replace it with WHERE year > 1975 to see filtering before grouping."
```

## Set operations and duplicates

Two queries with compatible results combine with **`UNION`**, **`INTERSECT`** and
**`EXCEPT`** (the difference). These three follow **set** semantics — they eliminate
duplicates, even ones inside a single operand — whereas `SELECT` alone keeps a bag;
`UNION ALL` (and `INTERSECT ALL`, `EXCEPT ALL` where supported) keep the bag
semantics, in which a tuple appearing $m$ times in one operand and $n$ times in the
other appears $m + n$ times in the union, $\min(m, n)$ times in the intersection and
$\max(0, m - n)$ times in the difference (deck DB08, slides 18–20).

```sim
id: db-353-set-ops
custom: true
engine: db
mode: sql
tables:
  Movie: |
    title year studioName
    'Star Wars' 1977 Fox
    'Alien' 1979 Fox
    'Pretty Woman' 1990 Disney
    'Mighty Ducks' 1991 Disney
  StarsIn: |
    title year starName
    'Star Wars' 1977 'Carrie Fisher'
    'Star Wars' 1977 'Mark Hamill'
    'Alien' 1979 'Sigourney Weaver'
    'Pretty Woman' 1990 'Julia Roberts'
query: |
  SELECT title, year FROM Movie WHERE studioName = 'Fox'
  UNION
  SELECT title, year FROM StarsIn WHERE starName LIKE '%Roberts';
note: "Titles that are Fox movies or star someone named Roberts, as a set. Replace UNION by INTERSECT, by EXCEPT, and then try SELECT title FROM StarsIn UNION ALL SELECT title FROM Movie — Star Wars appears three times, because UNION ALL keeps the bag and StarsIn lists two of its stars. Movies with no star at all: SELECT title FROM Movie EXCEPT SELECT title FROM StarsIn."
```

**Equations**

- *Bag semantics*: in $R \cup_{ALL} S$ a tuple with multiplicities $m, n$ has $m + n$; in $R \cap_{ALL} S$, $\min(m, n)$; in $R -_{ALL} S$, $\max(0, m - n)$.
- *Grouping*: `SELECT g, agg(a) FROM R WHERE C GROUP BY g HAVING H` = filter tuples by $C$ → partition by $g$ → filter groups by $H$ → one row per group.

> **Key insight.** Read every SQL query in the order the system evaluates it — `FROM`
> (the product), `WHERE` (keep pairs), `GROUP BY` (partition), `HAVING` (keep groups),
> `SELECT` (output), `ORDER BY` (sort) — and remember which clauses are bags and
> which are sets. The rest of the course's SQL adds nesting and updates to this frame.

## Further reading

- [SQLite — SELECT](https://www.sqlite.org/lang_select.html) — The exact grammar the examples on this page run against, with the evaluation order drawn out.
- [Ullman & Widom — ch. 6](http://infolab.stanford.edu/~ullman/fcdb.html) — The textbook chapter behind decks DB01 and DB08.
