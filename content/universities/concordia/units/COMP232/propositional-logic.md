---
title: Propositional logic
order: 1
status: detailed
notes: ["Lecture slides main1, pp. 5-31"]
introduces: [propositional-logic]
requires: []
reinforces: []
---

Propositions, the connectives that combine them, truth tables, and the logical equivalences
that let you rewrite a compound proposition without a table.

## Propositions and connectives

> **Definition.** A **proposition** is a declarative sentence that is either true or false,
> but not both. Its **truth value** is T (1) or F (0).

"7 < 4" is a proposition (false); "What time is it?" is not a sentence of that kind, and
"$x < 4$" is not a proposition because its value depends on $x$. Propositions get names
$p, q, r, \dots$ and are combined with **connectives**:

| connective | symbol | true when |
|---|---|---|
| negation | $\lnot p$ | $p$ is false |
| disjunction (inclusive or) | $p \lor q$ | at least one is true |
| conjunction | $p \land q$ | both are true |
| exclusive or | $p \oplus q$ | exactly one is true |
| conditional | $p \to q$ | *not* ($p$ true and $q$ false) |
| biconditional | $p \leftrightarrow q$ | both have the same value |

In $p \to q$, $p$ is the **hypothesis** (antecedent) and $q$ the **conclusion**. The
conditional is the one to be careful with: it is *true* whenever the hypothesis is false.
English has many phrasings for it — "$q$ if $p$", "$p$ only if $q$", "$q$ whenever $p$",
"$p$ is sufficient for $q$", "$q$ is necessary for $p$" — all mean $p \to q$.

## Truth tables

A **truth table** lists the value of a compound proposition for every assignment of values
to its variables: $2^n$ rows for $n$ variables. Build it column by column, naming
intermediate sub-expressions.

> **Definition.** A compound proposition is a **tautology** if it is true in every row
> ($p \lor \lnot p$), a **contradiction** if false in every row ($p \land \lnot p$), and a
> **contingency** otherwise ($p \lor q$).

## Logical equivalence

> **Definition.** $p$ and $q$ are **logically equivalent**, $p \equiv q$, if they have the
> same truth table — equivalently, if $p \leftrightarrow q$ is a tautology.

Two equivalences worth memorising, both checkable by a four-row table:

- $p \to q \;\equiv\; \lnot p \lor q$ — a conditional is a disjunction in disguise.
- $(p \to q) \land (q \to p) \;\equiv\; p \leftrightarrow q$.

A truth table also decides whether a claimed equivalence is *false*: one row where the two
columns differ is enough.

## The basic laws

| law | form |
|---|---|
| identity | $p \land T \equiv p$, $p \lor F \equiv p$ |
| domination | $p \lor T \equiv T$, $p \land F \equiv F$ |
| idempotent | $p \lor p \equiv p$, $p \land p \equiv p$ |
| double negation | $\lnot\lnot p \equiv p$ |
| commutative | $p \lor q \equiv q \lor p$, $p \land q \equiv q \land p$ |
| associative | $(p \lor q) \lor r \equiv p \lor (q \lor r)$, same for $\land$ |
| distributive | $p \lor (q \land r) \equiv (p \lor q) \land (p \lor r)$, $p \land (q \lor r) \equiv (p \land q) \lor (p \land r)$ |
| De Morgan | $\lnot(p \lor q) \equiv \lnot p \land \lnot q$, $\lnot(p \land q) \equiv \lnot p \lor \lnot q$ |
| negation | $p \lor \lnot p \equiv T$, $p \land \lnot p \equiv F$ |
| absorption | $p \lor (p \land q) \equiv p$, $p \land (p \lor q) \equiv p$ |

With these you can prove an equivalence by rewriting instead of tabulating:

> **Example.** $p \lor (p \land q) \equiv (p \land T) \lor (p \land q) \equiv p \land (T \lor q)
> \equiv p \land T \equiv p$ — identity, distributive, domination, identity.

Bracket everything; precedence conventions are a source of errors.

## Converse, inverse, contrapositive

For $p \to q$: the **converse** is $q \to p$, the **inverse** is $\lnot p \to \lnot q$, and the
**contrapositive** is $\lnot q \to \lnot p$.

> **Theorem.** $p \to q \equiv \lnot q \to \lnot p$. Neither the converse nor the inverse is
> equivalent to $p \to q$.
>
> *Why.* $p \to q \equiv \lnot p \lor q \equiv q \lor \lnot p \equiv \lnot(\lnot q) \lor \lnot p \equiv \lnot q \to \lnot p$.

> **Example.** "If you are a CS student, you can take COMP 232." Contrapositive: "If you
> cannot take COMP 232, you are not a CS student" (same claim). Converse: "If you can take
> COMP 232, you are a CS student" (a different claim, and false).

> **Key insight.** Everything in propositional logic reduces to truth tables, but the laws
> are what make it usable: $p \to q \equiv \lnot p \lor q$ plus De Morgan turn any statement
> about implications into one about and/or/not, and the contrapositive is the only rewrite of
> an implication that preserves its meaning.

**Equations**

- *Conditional as disjunction*: $p \to q \equiv \lnot p \lor q$.
- *Contrapositive*: $p \to q \equiv \lnot q \to \lnot p$.
- *De Morgan*: $\lnot(p \land q) \equiv \lnot p \lor \lnot q$, $\lnot(p \lor q) \equiv \lnot p \land \lnot q$.
