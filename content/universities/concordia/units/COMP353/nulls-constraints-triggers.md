---
title: Null values, outer joins, constraints and triggers
order: 11
status: detailed
weeks: [9, 10]
notes: ["Deck DB10, More on SQL — Null values, Triggers: slides 5–13 NULL, arithmetic on nulls, three-valued logic and its truth tables, the laws that fail; 14–22 joins in SQL, natural joins, outer joins (left, right, full); 23–29 constraints: keys, UNIQUE, PRIMARY KEY; 30–42 foreign keys, referential integrity and the policies (reject, cascade, set null); 43–50 attribute-based and tuple-based CHECK constraints, naming constraints; 51–52 assertions; 53–67 triggers: event-condition-action, AFTER/BEFORE, REFERENCING OLD/NEW, row-level and statement-level, examples"]
textbook: "Ullman & Widom, A First Course in Database Systems, 3e, ch. 6.1.6, 6.3.8, 7"
introduces: []
requires:
  - {concept: sql, strength: hard}
  - {concept: relational-model, strength: hard}
  - {concept: propositional-logic, strength: soft}
reinforces:
  - {concept: sql, perspective: "NULL and three-valued logic, outer joins, key and foreign-key constraints with their referential policies, CHECK constraints, assertions, and triggers as event-condition-action rules"}
---

Two things the algebra ignores and real databases cannot: values that are missing,
and rules the data must obey. SQL's `NULL` needs a third truth value; keys, foreign
keys and checks are declared with the schema and enforced on every change; and
**triggers** run a piece of SQL whenever something happens — the mechanism for every
rule the declarative constraints cannot express.

## NULL and three-valued logic

`NULL` stands for a value that is unknown, inapplicable or withheld. Arithmetic with
`NULL` yields `NULL`; a comparison with `NULL` yields neither true nor false but
**unknown**, and so `WHERE` — which keeps a tuple only when the condition is *true* —
drops every tuple for which the condition is unknown. To test for a null, write
`IS NULL` / `IS NOT NULL`; `x = NULL` is always unknown.

> **Definition.** **Three-valued logic**: with true $= 1$, false $= 0$, unknown $=
> \tfrac12$, `AND` is the minimum, `OR` the maximum, `NOT` is $1 - x$. So `unknown AND
> false = false`, `unknown OR true = true`, `unknown AND true = unknown`. Laws that
> fail: `x OR NOT x` is not always true, and `x = x` is unknown for a null $x$.

```sim
id: db-353-nulls
custom: true
engine: db
mode: sql
tables:
  Movie: |
    title year length studioName
    'Star Wars' 1977 124 Fox
    'Untitled 1' 2001 - Fox
    'Untitled 2' 2002 90 -
    'Alien' 1979 117 Fox
query: |
  SELECT title, length,
         length > 100 AS gt100,
         length > 100 OR length <= 100 AS tautology,
         studioName = 'Fox' OR studioName IS NULL AS foxOrUnknown
  FROM Movie;
note: "SQLite shows unknown as NULL in a boolean column. The 'tautology' column is NULL for the movie with no length: x OR NOT x is not always true under three-valued logic. Now run SELECT * FROM Movie WHERE length > 100 OR length <= 100 — Untitled 1 is dropped, because WHERE keeps only true. And SELECT COUNT(*), COUNT(length), AVG(length) FROM Movie: the null is counted by COUNT(*) and ignored by the rest."
```

## Outer joins

An inner join loses the tuples that have no partner — a star in no movie, a movie
with no studio tuple. **Outer joins** keep them, padding the missing side with
`NULL`: `R LEFT OUTER JOIN S` keeps every `R` tuple, `RIGHT` every `S` tuple, `FULL`
both. With `NATURAL` or `ON`, as for inner joins; SQL2 also spells the inner join
`R JOIN S ON C` and the product `R CROSS JOIN S`.

```sim
id: db-353-outer-join
custom: true
engine: db
mode: sql
tables:
  Movie: |
    title year studioName
    'Star Wars' 1977 Fox
    'Alien' 1979 Fox
    'Pretty Woman' 1990 Disney
    'Indie Film' 2010 -
  Studio: |
    name address
    Fox Hollywood
    Disney Burbank
    MGM 'Culver City'
query: |
  SELECT title, name, address
  FROM Movie LEFT OUTER JOIN Studio ON studioName = name;
note: "Every movie survives; Indie Film gets NULLs for the studio. Change LEFT to RIGHT — SQLite ≥ 3.39 supports it — and MGM appears with no movie; FULL OUTER JOIN shows both. The inner join, FROM Movie JOIN Studio ON studioName = name, drops Indie Film and MGM alike."
```

## Keys and foreign keys

> **Definition.** `PRIMARY KEY` on one or more attributes declares the key: values
> unique, `NULL` not allowed; a table has one. `UNIQUE` declares another candidate key:
> values unique, but `NULL`s permitted (and not compared). A **foreign key**, `FOREIGN
> KEY (a) REFERENCES S(b)`, declares **referential integrity**: every non-null value of
> `a` must occur as a `b` in `S`, where `b` is `S`'s primary key or `UNIQUE`.

Referential integrity can be broken from either side: inserting a referencing tuple
whose value does not exist (always rejected), and deleting or updating the referenced
tuple. For the second, a **policy** is chosen per foreign key (deck DB10, slides
34–42): `ON DELETE/UPDATE NO ACTION` (the default: reject the change), `CASCADE`
(delete or update the referencing tuples too), `SET NULL` (disconnect them). A
studio whose president retires might `SET NULL` its `presC#`; deleting an executive
who is a president then blanks the studio's field rather than failing.

```sim
id: db-353-foreign-keys
custom: true
engine: db
mode: sql
query: |
  PRAGMA foreign_keys = ON;
  CREATE TABLE MovieExec (name TEXT, cert INT PRIMARY KEY, netWorth INT);
  CREATE TABLE Studio (
      name TEXT PRIMARY KEY,
      address TEXT,
      presC INT REFERENCES MovieExec(cert) ON DELETE SET NULL ON UPDATE CASCADE
  );
  INSERT INTO MovieExec VALUES ('George Lucas', 12345, 200000000), ('Jeffrey K.', 67890, 8000000);
  INSERT INTO Studio VALUES ('Fox', 'Hollywood', 12345), ('Disney', 'Burbank', 67890);
  INSERT INTO Studio VALUES ('MGM', 'Culver City', 11111);
note: "The last insert fails: 11111 is nobody's certificate — referential integrity refuses a dangling reference. Then run DELETE FROM MovieExec WHERE cert = 12345 and look at Fox's presC (set to NULL by the policy), and UPDATE MovieExec SET cert = 1 WHERE cert = 67890 to see the cascade reach Disney. Change SET NULL to NO ACTION and the delete is refused instead."
```

## Checks and assertions

An **attribute-based check** — `gender CHAR(1) CHECK (gender IN ('F', 'M'))` — is
tested whenever that attribute gets a value (insert or update of it), not when the
world changes elsewhere: `CHECK (presC IN (SELECT cert FROM MovieExec))` is *not* a
foreign key, because deleting the executive does not re-test the studio. A
**tuple-based check**, written as a table constraint, may relate several attributes of
the same tuple (`CHECK (gender = 'F' OR name NOT LIKE 'Ms.%')`) and is tested on
every insert and update of the table. Constraints can be named (`CONSTRAINT
positiveWorth CHECK (netWorth > 0)`) so they can be dropped or replaced with `ALTER
TABLE`. An **assertion** is a schema-level constraint over any tables — "the average
net worth of executives never drops below a million" — tested on every relevant
change; it is in the standard but implemented by almost no system, which is where
triggers come in.

## Triggers

> **Definition.** A **trigger** is an **event–condition–action** rule: `CREATE
> TRIGGER name AFTER|BEFORE INSERT|DELETE|UPDATE [OF a] ON R [REFERENCING OLD/NEW ROW
> AS …] [FOR EACH ROW] [WHEN (condition)] action`. The event is a modification of
> `R`; `FOR EACH ROW` fires once per affected tuple with the old and new versions
> available (`OLD.a`, `NEW.a`), otherwise once per statement with the old and new
> *tables*; the action is any sequence of SQL statements, which may undo the change
> or raise an error.

The deck's example (slides 55–63): after an update of `netWorth` on `MovieExec`, if
the new value is smaller than the old, put it back — a constraint "net worth never
decreases" that no `CHECK` can state, because it compares two versions of a tuple.
Row-level triggers see each tuple; a statement-level trigger sees the whole change
and can, for instance, refuse a bulk update that would lower the average. `BEFORE`
triggers can fix a value before it is stored; `INSTEAD OF` triggers on a view
define what an insertion into a non-updatable view should do.

```sim
id: db-353-trigger
custom: true
engine: db
mode: sql
tables:
  MovieExec: |
    name cert netWorth
    'George Lucas' 12345 200000000
    'Jeffrey K.' 67890 8000000
query: |
  CREATE TRIGGER NetWorthTrigger
  AFTER UPDATE OF netWorth ON MovieExec
  FOR EACH ROW
  WHEN NEW.netWorth < OLD.netWorth
  BEGIN
      UPDATE MovieExec SET netWorth = OLD.netWorth WHERE cert = NEW.cert;
  END;
  UPDATE MovieExec SET netWorth = 1000 WHERE cert = 12345;
  UPDATE MovieExec SET netWorth = 9000000 WHERE cert = 67890;
  SELECT * FROM MovieExec;
note: "The first update tries to lower a net worth: the trigger fires after the change and restores the old value, so the table shows 200000000 unchanged; the second raises it and passes. SQLite's syntax puts OLD and NEW without a REFERENCING clause and needs a BEGIN … END block. Replace the action with SELECT RAISE(ABORT, 'net worth may not decrease') to refuse the statement instead of undoing it."
```

**Equations**

- *Three-valued logic*: $x \land y = \min(x, y)$, $x \lor y = \max(x, y)$, $\lnot x = 1 - x$ with unknown $= \tfrac12$; `WHERE` keeps only $1$.
- *Outer join*: $R ⟕ S = (R \bowtie S) \cup \{(r, \text{nulls}) : r \in R \text{ has no partner}\}$; right and full likewise.
- *Referential integrity*: $\pi_a(R) - \{\text{null}\} \subseteq \pi_b(S)$, maintained by NO ACTION, CASCADE or SET NULL.

> **Key insight.** `NULL` makes every condition three-valued, and `WHERE`, joins and
> aggregates each have a rule for it; keys and foreign keys are declared once and
> enforced by the system with a chosen policy; `CHECK` covers what one tuple can
> tell, and a trigger covers everything else by running SQL when an event occurs.

## Further reading

- [SQLite — CREATE TRIGGER](https://www.sqlite.org/lang_createtrigger.html) — The trigger dialect that runs on this page, with `RAISE` and `INSTEAD OF`.
- [Ullman & Widom — ch. 7](http://infolab.stanford.edu/~ullman/fcdb.html) — Keys, foreign keys, checks, assertions and triggers as in the deck.
