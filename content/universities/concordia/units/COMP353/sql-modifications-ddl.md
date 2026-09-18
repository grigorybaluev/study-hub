---
title: SQL modifications and schema definition
order: 3
status: detailed
weeks: [2]
notes: ["Deck DB01: slides 74–79 INSERT (values and query results); 80–83 DELETE; 84–85 UPDATE; 86–88 CREATE TABLE and DROP TABLE; 89–90 data types, dates and times; 91–92 ALTER TABLE across vendors; 93–95 attribute properties, NOT NULL and DEFAULT. Deck DB10: slides 2–4 user-defined domains"]
textbook: "Ullman & Widom, A First Course in Database Systems, 3e, ch. 6.5–6.6, 7.1"
introduces: []
requires:
  - {concept: sql, strength: hard}
reinforces:
  - {concept: sql, perspective: "the data-manipulation statements INSERT, DELETE and UPDATE, and the data-definition statements CREATE, DROP and ALTER TABLE with types, defaults and NOT NULL"}
---

Queries read; the three **modification** statements write — and the schema they write
into is itself created by SQL. This unit is the rest of the everyday language: insert
rows (by value or from a query), delete and update the rows a condition selects,
create and change tables with typed, constrained columns.

## INSERT

> **Definition.** `INSERT INTO R(a₁, …, aₙ) VALUES (v₁, …, vₙ)` adds one tuple; the
> attribute list may be omitted when values are given for every attribute in the
> table's declared order, and attributes left out receive `NULL` (or their default).
> `INSERT INTO R(…) SELECT …` adds every tuple of a query result — the way a table is
> filled from other tables.

The subtle case from the deck (slides 77–79): inserting the result of a query *into a
table the query reads*. SQL evaluates the whole query first and inserts afterwards, so
the statement cannot feed itself; the example builds a `Studio` list from the studios
named in `Movie` that are not yet in `Studio`.

```sim
id: db-353-insert
custom: true
engine: db
mode: sql
tables:
  Movie: |
    title year length studioName
    'Star Wars' 1977 124 Fox
    'Pretty Woman' 1990 119 Disney
    'Mighty Ducks' 1991 104 Disney
    'Wayne''s World' 1992 95 Paramount
  Studio: |
    name address
    Fox Hollywood
query: |
  INSERT INTO Movie(title, year, studioName) VALUES ('Alien', 1979, 'Fox');
  INSERT INTO Studio
    SELECT DISTINCT studioName, NULL FROM Movie
    WHERE studioName NOT IN (SELECT name FROM Studio);
  SELECT * FROM Studio;
note: "The first INSERT leaves length NULL. The second inserts every studio mentioned in Movie that Studio does not know yet — the subquery is evaluated once, before any row is added, so Fox is not duplicated. Run the second statement again: nothing new. Then insert a tuple with values in the wrong order and see the type the column keeps."
```

## DELETE and UPDATE

> **Definition.** `DELETE FROM R WHERE C` removes every tuple satisfying `C` (all
> tuples when `WHERE` is omitted — the table stays, empty). `UPDATE R SET a₁ = e₁, …
> WHERE C` changes the listed attributes of every tuple satisfying `C`; the
> expressions may use the tuple's current values (`SET netWorth = netWorth * 1.1`).

The condition may involve a subquery, and the same "evaluate first, then act" rule
applies: `DELETE FROM Exec WHERE cert# NOT IN (SELECT producerC# FROM Movie)`
removes executives who produced nothing, and the subquery is computed before the
first deletion.

```sim
id: db-353-delete-update
custom: true
engine: db
mode: sql
tables:
  MovieExec: |
    name cert netWorth
    'George Lucas' 12345 200000000
    'Ted Turner' 23456 1250000000
    'Jeffrey K.' 67890 8000000
    'Nobody' 11111 5000
  Movie: |
    title year producerC
    'Star Wars' 1977 12345
    'Pretty Woman' 1990 67890
query: |
  UPDATE MovieExec SET netWorth = netWorth * 1.1 WHERE netWorth < 10000000;
  DELETE FROM MovieExec WHERE cert NOT IN (SELECT producerC FROM Movie);
  SELECT * FROM MovieExec;
note: "Two executives are below ten million and get the raise; then everyone who produced no movie goes. Step back to see the table after each statement. Delete with no WHERE and the table survives, empty; DROP TABLE would remove the table itself."
```

## Defining and changing the schema

> **Definition.** `CREATE TABLE R (a₁ type₁ [constraints], …, [table constraints])`
> declares a relation; `DROP TABLE R` removes it with all its data. Column types
> include `INT`/`INTEGER`, `REAL`/`FLOAT`, `DECIMAL(n, d)` (`n` digits, `d` after the
> point), `CHAR(n)` (fixed length, padded), `VARCHAR(n)` (up to `n`), `BIT(n)`,
> `BOOLEAN`, `DATE` ('yyyy-mm-dd') and `TIME` ('hh:mm:ss'). A column may be declared
> `NOT NULL` and given a `DEFAULT` value used when an insert omits it.

Schemas evolve: `ALTER TABLE R ADD a type` adds a column (`NULL` or the default in
existing rows), `ALTER TABLE R DROP a` removes one; the exact syntax differs between
MySQL, SQL Server and Oracle (deck DB01, slide 92), and so does the set of types —
SQLite, which runs these pages, accepts any type name and stores values dynamically.
SQL also allows a **domain**, a named type with a default and checks, reused by
several columns: `CREATE DOMAIN MovieDomain AS VARCHAR(50)`.

```sim
id: db-353-ddl
custom: true
engine: db
mode: sql
query: |
  CREATE TABLE MovieStar (
      name      VARCHAR(30) NOT NULL,
      address   VARCHAR(255),
      gender    CHAR(1) DEFAULT '?',
      birthdate DATE
  );
  INSERT INTO MovieStar(name, birthdate) VALUES ('Carrie Fisher', '1956-10-21');
  INSERT INTO MovieStar VALUES ('Mark Hamill', '456 Oak Rd.', 'M', '1951-09-25');
  ALTER TABLE MovieStar ADD phone CHAR(16);
  SELECT * FROM MovieStar;
note: "An empty database, a table from scratch. The first insert names only two columns: address becomes NULL, gender takes its default. ALTER TABLE adds a column that is NULL in existing rows. Now insert a star without a name — NOT NULL refuses it — and finish with DROP TABLE MovieStar."
```

> **Key insight.** Modification statements select with the same `WHERE` a query uses
> and apply their change to every selected tuple at once, subqueries evaluated first;
> the schema is data too, created and altered by statements, with each column's type,
> nullability and default declared where the column is.

## Further reading

- [SQLite — Data types](https://www.sqlite.org/datatype3.html) — Why the engine on this page accepts every SQL type name, and what it does with them.
- [Ullman & Widom — ch. 6.5, 7.1](http://infolab.stanford.edu/~ullman/fcdb.html) — Modifications and schema definition as in the decks.
