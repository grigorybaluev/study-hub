---
title: Boolean algebra and logic gates
order: 6
status: detailed
weeks: [3, 4]
notes: ["Lecture 3, slides 11–14: digital logic, the AND/OR/NOT gates, transistors as switches, truth tables as specifications", "Lecture 4, slides 6–9: Boolean algebra, its laws, an algebraic simplification, building gates from transistors", "Lecture 4, slides 10–15: NAND, NOR and XOR, a circuit from an equation, sum-of-products and product-of-sums, universal gates, the adder truth tables"]
textbook: ""
introduces: [boolean-algebra, digital-logic]
requires:
  - {concept: propositional-logic, strength: soft}
reinforces: []
---

Every representation in the units so far — two's complement, IEEE 754, Hamming codes — is
a way of writing information as 0s and 1s. This unit is about *operating* on them. The
mathematics is Boolean algebra, the same two-valued logic as COMP 232's propositions with
$0$ and $1$ in place of false and true; the physics is a transistor used as a switch; the
bridge between them is the logic gate. By the end, a truth table can be turned into a
circuit by a fixed procedure.

## Signals, switches and gates

A wire carries a signal or it does not — 1 or 0. To compute with signals we need components
whose output is a function of their inputs, and the simplest are the three **logic gates**
that implement the three Boolean operations:

- **AND** ($x \cdot y$, $x \land y$, or just $xy$): output 1 only when every input is 1.
- **OR** ($x + y$, $x \lor y$): output 1 when any input is 1.
- **NOT** ($\bar x$, $x'$, $\lnot x$): one input, output the opposite.

Inside, a gate is a few transistors used as switches; the lecture builds NOT and NAND from
them and leaves the semiconductor physics to another course. What matters here is the
contract: a gate is a Boolean function in hardware, and its behaviour is completely described
by a **truth table** listing the output for each combination of inputs.

Three more gates are cheap to build and constantly useful: **NAND** (AND then NOT), **NOR**
(OR then NOT), and **XOR** ($x \oplus y$), which is 1 when an odd number of inputs are 1 —
for two inputs, when they differ.

## Boolean algebra

> **Definition.** **Boolean algebra** is the set $\{0, 1\}$ with the operations AND, OR and
> NOT, obeying the laws below. Precedence is NOT, then AND, then OR, so $x + yz$ means
> $x + (y \cdot z)$; parentheses override.

| law | AND form | OR form |
|---|---|---|
| commutative | $xy = yx$ | $x + y = y + x$ |
| associative | $x(yz) = (xy)z$ | $x + (y + z) = (x + y) + z$ |
| distributive | $x(y + z) = xy + xz$ | $x + yz = (x + y)(x + z)$ |
| identity | $x \cdot 1 = x$ | $x + 0 = x$ |
| annihilation | $x \cdot 0 = 0$ | $x + 1 = 1$ |
| idempotence | $xx = x$ | $x + x = x$ |
| absorption | $x(x + y) = x$ | $x + xy = x$ |
| complement | $x \bar x = 0$ | $x + \bar x = 1$ |
| double negation | $\bar{\bar x} = x$ | |
| De Morgan | $\overline{xy} = \bar x + \bar y$ | $\overline{x + y} = \bar x \, \bar y$ |

The second distributive law has no counterpart in ordinary algebra and is what makes
Boolean simplification feel strange at first. The laws come in pairs because swapping AND
with OR and 0 with 1 turns any true identity into another true identity — **duality**.

> **Example — simplifying.** Show that $\bar x y + x y + x \bar y = x + y$. Group the first
> two terms: $\bar x y + x y = (\bar x + x) y = 1 \cdot y = y$ (distributive, complement,
> identity). Then $y + x \bar y = (y + x)(y + \bar y) = (x + y) \cdot 1 = x + y$ (the second
> distributive law, complement, identity). Three of the four minterms of two variables
> collapse to two literals — and a circuit for $x + y$ is one gate instead of five.

Simplification is worth the effort because every operation in the expression becomes a
gate: fewer terms, fewer gates, less silicon and less delay.

## From truth table to circuit and back

A Boolean expression turns into a circuit mechanically: draw a gate for the outermost
operation, feed it gates for its operands, and so on down to the input wires. The lecture's
recipe is to start from the result and follow the order of operations in reverse.

```sim
id: arch-228-gates-circuit
custom: true
engine: arch
mode: circuit
expr: "x + y z"
inputs: {x: 0, y: 1, z: 1}
note: "The expression x + yz drawn as gates: an AND for yz, an OR that takes x and the AND's output. Wires carrying a 1 are red; stepping evaluates one gate at a time from the inputs to F. Click x, y or z in the toolbar to toggle it and watch the values propagate — with x = 1 the OR is satisfied whatever the AND says."
```

The other direction — from a table to an expression — is where the algebra earns its place.
Given any truth table, two standard forms always work:

- **Sum of products** (minterms): for every row whose output is 1, write the AND of all the
  variables, each complemented if it is 0 in that row — a **minterm**, which is 1 on exactly
  that row. OR the minterms together.
- **Product of sums** (maxterms): for every row whose output is 0, write the OR of all the
  variables, each complemented if it is 1 in that row — a **maxterm**, which is 0 on exactly
  that row. AND the maxterms together.

> **Example — XOR.** $x \oplus y$ is 1 on the rows $01$ and $10$, so its sum of products is
> $\bar x y + x \bar y$; it is 0 on $00$ and $11$, so its product of sums is
> $(x + y)(\bar x + \bar y)$. Both are XOR; the first is the usual way to build it.

```sim
id: arch-228-gates-truth-table
custom: true
engine: arch
mode: truth-table
expr: "A B + Cin (A ⊕ B)"
vars: [A, B, Cin]
note: "The carry-out of a full adder as a truth table, one row per step, then its two normal forms: the minterms of the five rows where the output is 1, and the maxterms of the three rows where it is 0. Type any expression — juxtaposition is AND, + is OR, an apostrophe negates (x'), ⊕ or ^ is XOR — and the table and forms follow."
```

Both normal forms have a regular circuit shape: a row of NOT gates, a row of ANDs (or ORs),
one big OR (or AND). That regularity is why they matter for hardware even when they are not
the smallest expression.

## Universal gates

De Morgan's laws say an OR is an AND with all the inputs and the output inverted, and an AND
is an OR treated the same way. Since a NAND with both inputs tied together is a NOT, and a
NOT followed by NAND is an OR, **NAND alone can build every gate** — it is a *universal* gate,
and so is NOR. Chip makers exploit this: a design expressed in NAND gates needs one kind of
component, and a sum of products maps onto NAND gates directly (the AND row and the OR gate
both become NANDs, and the two inversions between them cancel).

```sim
id: arch-228-gates-nand
custom: true
engine: arch
mode: circuit
expr: "x ⊕ y"
gates: nand
inputs: {x: 1, y: 0}
note: "The same XOR rewritten with NAND gates only: four of them, sharing the first NAND's output. Every AND, OR and NOT in a circuit can be replaced this way, so a chip needs one kind of gate. Toggle the inputs to confirm it is still XOR — F is 1 exactly when x and y differ."
```

## The adder as a specification

The unit closes where the next one begins. Adding two bits gives a sum and a carry; the
**half adder** table is $S = x \oplus y$, $C = xy$. Adding two bits *and* a carry-in — one
column of a multi-bit addition — is the **full adder**: $S = x \oplus y \oplus c_{in}$,
$C_{out} = xy + c_{in}(x \oplus y)$. Both are truth tables that the procedures above turn
into gates, and the next unit chains them into the arithmetic of the last three units.

**Equations**

- *Minterm of row $r$*: AND of every variable, complemented where the row has a 0; *maxterm*: OR of every variable, complemented where the row has a 1.
- *Sum of products*: $F = \sum_{\text{rows with } F = 1} \text{minterm}$; *product of sums*: $F = \prod_{\text{rows with } F = 0} \text{maxterm}$.
- *De Morgan*: $\overline{xy} = \bar x + \bar y$, $\overline{x + y} = \bar x \bar y$.
- *NAND as NOT / AND / OR*: $\overline{xx} = \bar x$; $xy = \overline{\overline{xy}}$; $x + y = \overline{\bar x \, \bar y}$.
- *Half adder*: $S = x \oplus y$, $C = xy$; *full adder*: $S = x \oplus y \oplus c$, $C_{out} = xy + c(x \oplus y)$.

> **Key insight.** A truth table is a specification, a Boolean expression is a design, and a
> gate circuit is the implementation — and the three are mechanically interconvertible. The
> normal forms guarantee that *any* table has a circuit; the laws let you make it smaller;
> De Morgan lets you build the whole thing from one kind of gate.

## Further reading

- [Boolean algebra](https://en.wikipedia.org/wiki/Boolean_algebra) — the laws, duality and the connection to propositional logic.
- [Logic gate](https://en.wikipedia.org/wiki/Logic_gate) — symbols, truth tables and how gates are built from transistors.
- [Canonical normal form](https://en.wikipedia.org/wiki/Canonical_normal_form) — minterms, maxterms, sum of products and product of sums.
- [NAND logic](https://en.wikipedia.org/wiki/NAND_logic) — every gate from NAND alone.
