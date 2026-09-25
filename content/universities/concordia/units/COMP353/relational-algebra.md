---
title: Relational algebra
order: 9
status: detailed
weeks: [7]
introduces: [relational-algebra]
requires:
  - {concept: relational-model, strength: hard}
  - {concept: set, strength: hard}
  - {concept: sql, strength: soft}
reinforces: []
---

SQL is what you type; relational algebra is what a query *is*: a handful of
operators on relations that produce relations, so that expressions nest like
arithmetic and an optimizer can rewrite them. Every block on this page evaluates an
expression one operator at a time, showing each intermediate relation.

## Set operators on relations

> **Definition.** Two relations are **union-compatible** when they have the same
> number of attributes with the same domains (in order). For compatible instances
> $r, s$: $r \cup s$ has the tuples in either, $r \cap s$ the tuples in both, $r - s$
> the tuples of $r$ not in $s$. As sets, duplicates never appear; the attribute names
> of the result are those of $r$.

## Projection, selection, product

> **Definition.** **Projection** $\pi_{A_1, \dots, A_k}(r)$ keeps only the listed
> attributes of each tuple (removing duplicate tuples as a set). **Selection**
> $\sigma_C(r)$ keeps the tuples satisfying condition $C$, a boolean combination of
> comparisons between attributes and constants. **Cartesian product** $r \times s$
> pairs every tuple of $r$ with every tuple of $s$; attributes with the same name are
> disambiguated as $R.A$ and $S.A$; $|r \times s| = |r| \cdot |s|$.

```sim
id: db-353-ra-basics
custom: true
engine: db
mode: ra
tables:
  movie: |
    title year length filmType studioName
    'Star Wars' 1977 124 color Fox
    'Mighty Ducks' 1991 104 color Disney
    "Wayne's World" 1992 95 color Paramount
    'Alien' 1979 117 color Fox
    'Gone With the Wind' 1939 231 color MGM
expr: "π(title, year; σ(studioName = 'Fox' and length >= 100; movie))"
note: "The deck's first query — title and year of every Fox movie of at least 100 minutes — evaluated inside-out: the selection keeps two tuples, the projection keeps two columns. Try π(studioName; movie) and watch the duplicate Fox disappear (set semantics); then σ(length > 200 or year < 1950; movie). The Greek letters and the words project/select are both accepted."
```

## Joins

> **Definition.** The **theta-join** $r \bowtie_C s$ is $\sigma_C(r \times s)$: the
> pairs of tuples satisfying $C$. An **equi-join** is a theta-join whose condition is
> a conjunction of equalities. The **natural join** $r \bowtie s$ pairs tuples that
> agree on *all* attributes with the same name and keeps one copy of those attributes;
> when the relations share no attribute it is the Cartesian product.

A join is where the shape of the schema matters: `Movie ⋈ StarsIn` on `(title, year)`
reassembles a movie with its stars; a self-join needs **renaming**, $\rho_{S(A_1,
\dots)}(r)$, to give the second copy distinct attribute names (`ρ_{M2}(movie)` to pair
movies of the same studio).

```sim
id: db-353-ra-joins
custom: true
engine: db
mode: ra
tables:
  movie: |
    title year length studioName
    'Star Wars' 1977 124 Fox
    'Empire Strikes Back' 1980 127 Fox
    'Alien' 1979 117 Fox
    'Pretty Woman' 1990 119 Disney
  starsIn: |
    title year starName
    'Star Wars' 1977 'Carrie Fisher'
    'Star Wars' 1977 'Mark Hamill'
    'Empire Strikes Back' 1980 'Carrie Fisher'
    'Alien' 1979 'Sigourney Weaver'
    'Pretty Woman' 1990 'Julia Roberts'
expr: "π(starName, studioName; σ(length > 120; movie ⋈ starsIn))"
note: "The natural join pairs on title and year (the shared attributes) and keeps them once; the product movie × starsIn would have 4 × 5 = 20 rows with both copies — evaluate it to compare. Theta-join in function form: join(movie.title = starsIn.title and movie.year = starsIn.year; movie, starsIn). Stars who appeared with Carrie Fisher: join starsIn with a renamed copy of itself on the movie."
```

## Bag semantics

SQL keeps duplicates, so the algebra is also defined on **bags** (deck DB07, slides
31–45): projection without duplicate elimination is faster (no sort), and
aggregation needs the multiplicities. On bags with multiplicities $m$ (in $r$) and
$n$ (in $s$): union gives $m + n$, intersection $\min(m, n)$, difference
$\max(0, m - n)$; selection, product and join treat each copy separately. The
`bag: true` key of a block switches the evaluator.

```sim
id: db-353-ra-bags
custom: true
engine: db
mode: ra
bag: true
tables:
  r: |
    A B
    1 2
    1 2
    3 4
  s: |
    A B
    1 2
    3 4
    3 4
    5 6
expr: "r ∪ s"
note: "Bag union: (1, 2) appears 2 + 1 times, (3, 4) 1 + 2 times. Evaluate r ∩ s (min: 1 and 1) and r − s (max(0, 2 − 1) = one (1, 2), no (3, 4)), then π(A; r) — three tuples, duplicates kept. Turn bag off in the block and every result collapses to a set."
```

## Expressing constraints

An algebra expression can *state* a rule as well as ask a question (slides 46–56): a
constraint is "$E = \emptyset$" or "$E_1 \subseteq E_2$". Referential integrity of
`StarsIn` toward `Movie`: $\pi_{title, year}(StarsIn) \subseteq \pi_{title,
year}(Movie)$. A functional dependency `name → address` on `Star`: join `Star` with a
renamed copy on `name`, select the pairs whose addresses differ, and require the
result empty — $\sigma_{S1.address \ne S2.address}(\rho_{S1}(Star) \bowtie_{S1.name =
S2.name} \rho_{S2}(Star)) = \emptyset$. A domain constraint: $\sigma_{gender \ne 'F'
\land gender \ne 'M'}(Star) = \emptyset$.

## "For all" queries and division

The algebra has no universal quantifier, so "students enrolled in *every* sport" is
answered by subtraction: form all (student, sport) pairs that *should* exist,
subtract the ones that do, and the students left over are the ones missing a sport;
subtract those from all students. The **division** operator packages this:

> **Definition.** For $r(X, Y)$ and $s(Y)$, $r \div s$ is the set of $X$-values $x$
> such that $(x, y) \in r$ for **every** $y \in s$. In terms of the other operators,
> $r \div s = \pi_X(r) - \pi_X\big((\pi_X(r) \times s) - r\big)$ — the deck's
> "for all" strategy, written once.

```sim
id: db-353-ra-division
custom: true
engine: db
mode: ra
tables:
  enrolled: |
    student sport
    Joe Hockey
    Joe Football
    Joe Soccer
    Sue Hockey
    Sue Soccer
    Ann Hockey
    Ann Football
    Ann Soccer
  sport: |
    sport
    Hockey
    Football
    Soccer
expr: "enrolled ÷ sport"
note: "Joe and Ann are enrolled in all three sports; Sue misses Football. Now evaluate the long form step by step — π(student; enrolled) − π(student; (π(student; enrolled) × sport) − enrolled) — and match each intermediate relation to the description: the product is every pair that should exist, the difference the pairs that do not, and the students in it are the ones to exclude."
```

**Equations**

- *Joins*: $r \bowtie_C s = \sigma_C(r \times s)$; natural join equates all shared attributes and projects one copy out.
- *Bag operators*: $m + n$ (union), $\min(m, n)$ (intersection), $\max(0, m - n)$ (difference).
- *Division*: $r \div s = \pi_X(r) - \pi_X\big((\pi_X(r) \times s) - r\big)$ with $X = \mathrm{attrs}(r) - \mathrm{attrs}(s)$.
- *Independent operators*: $\{\sigma, \pi, \times, \cup, -, \rho\}$ suffice; $\cap$, $\bowtie$ and $\div$ are abbreviations.

> **Key insight.** Six operators — select, project, product, union, difference,
> rename — generate everything; joins and division are abbreviations, and SQL's
> `SELECT L FROM R₁, …, Rₙ WHERE C` is exactly $\pi_L(\sigma_C(R_1 \times \dots \times
> R_n))$. Thinking in the algebra is thinking in the intermediate relations, which is
> what the evaluator on this page shows and what an optimizer reorders.

## Further reading

- [Ullman & Widom — ch. 2.4 and 5.1](http://infolab.stanford.edu/~ullman/fcdb.html) — The set and bag versions of the algebra with the movie schema.
- [Codd, "Relational Completeness of Data Base Sublanguages" (1972)](https://forum.thethirdmanifesto.com/wp-content/uploads/asgarosforum/887/Codd-Relational-Completeness.pdf) — Why the algebra and the calculus have the same power, and where division comes from.
