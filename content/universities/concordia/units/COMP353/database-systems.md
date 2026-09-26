---
title: Database systems
order: 1
status: detailed
weeks: [1]
introduces: [database-system]
requires:
  - {concept: set, strength: soft}
  - {concept: file-io, strength: soft}
reinforces: []
---

A program that stores its records in files owns them: their layout, their consistency,
their safety when two users write at once. A **database management system** takes
that ownership away from every application and gives it to one piece of software with
a language for asking questions. This unit is the vocabulary — data model, schema,
instance, the three levels, the DBMS's parts — before the language itself starts next
week.

## Databases and the DBMS

> **Definition.** A **database** is a collection of data that exists over a long period,
> is organised so that it can be searched, and is shared by many users and programs. A
> **database management system (DBMS)** is the software that manages it: it lets users
> create databases and specify their schema, query and modify the data through a query
> language, store very large amounts of data over a long time with controlled access,
> and keep the data safe and consistent — **durability** against failures, **isolation**
> between simultaneous users, **atomicity** of each transaction.

Before databases, a **file processing system** gave each application its own files:
customer lists in one program, invoices in another. The disadvantages are the reasons
databases exist: **redundancy** (the same address stored twice)
and hence **inconsistency** (updated in one place only); programs tied to the file
formats, so every change to a layout breaks code; no controlled concurrent access; no
standard way to ask an unanticipated question; no integrity rules enforced anywhere.
A database centralises the data once, enforces the rules once, and hides the storage
behind a schema.

The course covers three aspects of the field: **modelling and design** (E/R diagrams,
the relational model, functional dependencies and normal forms — units 4–8),
**database programming** (SQL, relational algebra, Datalog — units 2–3 and 9–12), and
DBMS implementation only in outline (this unit). A quick test: the
main source of a database's *design* is the requirements of the users, not the DBMS.

## Data models and the relational model

> **Definition.** A **data model** is a collection of concepts for describing data,
> its relationships and the constraints on it, plus the operations allowed. In the
> **relational model** data is organised in **relations** — tables with named
> columns (**attributes**) and rows (**tuples**); a relational database schema is a set
> of relation names, each with its set of attributes: `Movie(title, year, length,
> studioName)`. The user never sees how a table is stored.

Older models (hierarchical, network) exposed pointers; object-oriented and
object-relational models add classes and inheritance (unit 12); the relational model
is the one every major vendor implements and the one this course uses. Its strength is
that a query is a statement about the tables' contents, not a navigation.

## Three levels of abstraction

The objectives of a DBMS pull in opposite directions — simple enough for an untrained
user, powerful enough to run complex transactions efficiently — and the resolution is
to describe the data at three levels, each with its own schema:

| level | schema | who sees it | says |
|---|---|---|---|
| **external** | views | each user or application | the part of the data this user needs, in the shape they want |
| **conceptual** (logical) | the database schema | the designer / DBA | the tables, their attributes and constraints — the outcome of design, the focus of the course |
| **internal** (physical) | storage structures | the DBMS | files, blocks, byte offsets, indexes |

> **Definition.** The **schema** is the structure of the data (the relations and their
> attributes), fixed when the database is designed; an **instance** is the current
> content — the tuples in the tables right now. **Data independence** is the ability to
> change a schema at one level without changing the level above: **physical**
> independence lets the DBA add an index or move a file with no change to the
> conceptual schema; **logical** independence lets the conceptual schema change (a new
> attribute) without breaking the views built on it.

```sim
id: db-353-three-levels
custom: true
engine: db
mode: sql
tables:
  Employee: |
    sin name address salary healthCard
    123456789 'Ann Lee' '12 Pine Av.' 61000 'HC-4411'
    234567890 'Bo Chan' '7 Oak Rd.' 58000 'HC-9013'
    345678901 'Cy Diaz' '33 Elm St.' 72500 'HC-2288'
query: |
  CREATE VIEW Directory AS SELECT name, address FROM Employee;
  CREATE VIEW Payroll AS SELECT sin, salary FROM Employee;
  SELECT * FROM Directory;
note: "The conceptual schema is the Employee table; the two views are external schemas — one user sees names and addresses, another SINs and salaries, neither sees the whole. Run SELECT * FROM Payroll, then add a column with ALTER TABLE Employee ADD phone TEXT and query the views again: they still work, which is logical data independence."
```

## Architecture of a DBMS

Three kinds of input reach the system: **queries** (from users and programs),
**modifications** (insert, delete, update) and **schema modifications** (from the
DBA). Inside, three components handle them:

- The **query processor** parses a statement, chooses a plan (an **optimizer** picks
  among equivalent orders of operations using statistics about the data), and executes
  it against the storage manager.
- The **storage manager** moves data between disk and the buffers in memory, knows
  where each relation lives, and maintains the indexes; the **metadata** (the schema
  itself) is stored in the database too, in the **data dictionary**.
- The **transaction manager** groups operations into **transactions** that are
  executed as a unit — all or nothing (atomicity), invisible to each other while in
  progress (isolation), and permanent once committed (durability) — using **logs** to
  recover from crashes and **locks** to control concurrent access.

Around it, the users: naive users through forms and applications,
application programmers through embedded SQL, specialised users, and the DBA who owns
the schema, the access rights and the physical organisation.

## Database languages

A DBMS provides a **data-definition language (DDL)** for the schema — `CREATE TABLE`
and its constraints — and a **data-manipulation language (DML)** for the instance —
queries and modifications. Commercially the two are one language, **SQL** (IBM, 1976;
standards SQL-86, SQL-92 "SQL2", SQL:1999 "SQL3" and later); the theory behind it is
**relational algebra** (unit 9) and the logic-based **Datalog** (unit 12), which are
the abstract query languages the course uses to reason about what SQL does.

```sim
id: db-353-first-query
custom: true
engine: db
mode: sql
tables:
  Movie: |
    title year length filmType studioName
    'Star Wars' 1977 124 color Fox
    'Mighty Ducks' 1991 104 color Disney
    "Wayne's World" 1992 95 color Paramount
    'Alien' 1979 117 color Fox
    'Gone With the Wind' 1939 231 color MGM
query: |
  SELECT title, year FROM Movie WHERE studioName = 'Fox';
note: "The whole shape of SQL in one statement: what to output (SELECT), from where (FROM), which rows (WHERE). The result is itself a table. Change the condition to length > 110, or to year < 1980 AND studioName <> 'Fox', and read the result — next week builds the rest of the language on this."
```

> **Key insight.** A database separates *what* the data is (the schema) from *how* it is
> stored, and a DBMS is the one program allowed to touch the storage; every user
> works at the logical level through a query language, and the three-level
> architecture is what lets the physical layer change without anyone noticing.

## Further reading

- [SQLite — Architecture](https://www.sqlite.org/arch.html) — A real query processor, storage manager and transaction manager, in the engine that powers the examples on these pages.
