---
title: Predicates and quantifiers
order: 2
status: detailed
introduces: [predicate-logic]
requires:
  - {concept: propositional-logic, strength: hard}
reinforces: []
---

Statements with variables become propositions either by substituting a value or by
quantifying; how to negate, nest and translate quantified statements.

## Predicates

"$x^2 \ge x + 2$" is not a proposition — its truth depends on $x$.

:::definition[Predicate]
A **propositional function** (predicate) $P(x)$ is a statement with a variable $x$; it
becomes a proposition when a value is substituted. The **universe of discourse** is the set
of values the variable may take; it must always be stated or clear.
:::

With $P(x)$: $x^2 \ge x + 2$ over the integers, $P(5)$ is true and $P(0)$ is false.

## Quantifiers

The second way to turn $P(x)$ into a proposition is to say *how generally* it holds.

:::definition[Quantifiers]
- $\forall x\, P(x)$ — "for all $x$": true when $P(x)$ holds for every $x$ in the universe.
- $\exists x\, P(x)$ — "there exists $x$": true when $P(x)$ holds for at least one $x$.
:::

Over the integers, $\forall x\,(x^2 \ge x)$ is true, $\forall x\,(x^2 \ge x + 2)$ is false
($x = 0$), $\exists x\,(x^2 \ge x + 2)$ is true ($x = 4$).

### Universal conditionals

"Every integer is rational" is $\forall x\,(x \in \mathbb Z \to x \in \mathbb Q)$.
The conditional is how $\forall$ restricts a property to part of the universe. The
notations $P(x) \Rightarrow Q(x)$ and $P(x) \Leftrightarrow Q(x)$ are shorthand for
$\forall x\,(P(x) \to Q(x))$ and $\forall x\,(P(x) \leftrightarrow Q(x))$ — an **implicit** quantifier.

:::caution
"All CS students have an account" is $\forall s\,(\text{cs}(s) \to \text{acct}(s))$,
not $\forall s\,(\text{cs}(s) \land \text{acct}(s))$ — the second says everyone is a CS student.
"Some CS students dance" is $\exists s\,(\text{cs}(s) \land \text{dance}(s))$, not
$\exists s\,(\text{cs}(s) \to \text{dance}(s))$ — the second is true as soon as one non-CS
student exists. Rule of thumb: $\forall$ goes with $\to$, $\exists$ goes with $\land$.
:::

## Negating quantifiers

::::theorem[Negating quantifiers]
$$
\lnot \forall x\, P(x) \equiv \exists x\, \lnot P(x)
\qquad
\lnot \exists x\, P(x) \equiv \forall x\, \lnot P(x)
$$

:::proof
$\forall x\, P(x)$ is false exactly when some $x$ makes $P(x)$ false, which is
$\exists x\, \lnot P(x)$. The second is the first applied to $\lnot P$, then negated on both sides.
:::
::::

"Not all Canadians are good drivers" means "some Canadian is not a good driver"; "no pig can
fly" means "for every pig, it cannot fly". Push the negation inward one quantifier at a time,
flipping each.

::::example[Translating and negating]
With $P(x)$: "$x$ is a professor", $Q(x)$: "$x$ is ignorant", $R(x)$: "$x$ is vain", translate
"No professor is ignorant" and "All ignorant people are vain".

:::solution
$$
\lnot\exists x\,(P(x) \land Q(x)) \equiv \forall x\,(\lnot P(x) \lor \lnot Q(x))
\qquad
\forall x\,(Q(x) \to R(x))
$$
:::
::::

## Several variables and nested quantifiers

A predicate in two variables, $R(x, y)$, needs two quantifiers to become a proposition, read
left to right. **Order matters** between different quantifiers:

- $\forall x\, \exists y\,(x < y)$ over the integers: "every integer has a larger one" — true.
- $\exists y\, \forall x\,(x < y)$: "some integer exceeds all integers" — false.

Quantifiers of the *same* kind commute: $\forall x \forall y \equiv \forall y \forall x$, and
likewise for $\exists$. A partially quantified expression such as $\forall x\, R(x, y)$ is
still a propositional function of $y$.

### Quantifiers and connectives

:::proposition[Distributing quantifiers]
$\exists$ distributes over $\lor$ and $\forall$ over $\land$:

$$
\exists x\,(P(x) \lor Q(x)) \equiv \exists x\, P(x) \lor \exists x\, Q(x)
\qquad
\forall x\,(P(x) \land Q(x)) \equiv \forall x\, P(x) \land \forall x\, Q(x)
$$
:::

:::caution
The other two combinations fail: "some students speak Spanish and some speak Italian" is not
"some student speaks both".
:::

## Translation

:::steps[English to logic]
1. Name the universe(s).
2. Name the predicates.
3. Decide which quantifier each phrase hides: "some", "there are", "at least one" → $\exists$; "every", "all", "no" → $\forall$ or $\lnot\exists$.
4. Assemble, pairing $\forall$ with $\to$ and $\exists$ with $\land$.
:::

::::example[A unique id]
Translate "Every student is assigned a unique id", with $\text{id}(n, s)$: "$n$ is the id of
$s$". What happens if the first two quantifiers are swapped?

:::solution
$$
\forall s\, \exists n\, \big[\,\text{id}(n, s) \land \forall t\,(s \ne t \to \lnot \text{id}(n, t))\,\big]
$$

Swapping the first two quantifiers gives $\exists n\, \forall s\, \text{id}(n, s)$: all
students share one id.
:::
::::

::::example[Nobody is right all the time]
Translate "Nobody is right all the time" and push the negation inward.

:::solution
$$
\lnot \exists x\, \forall t\, \text{right}(x, t) \equiv \forall x\, \exists t\, \lnot\text{right}(x, t)
$$

— "everyone is sometimes wrong".
:::
::::

:::equations
- *Negation*: $\lnot\forall x P(x) \equiv \exists x \lnot P(x)$; $\lnot\exists x P(x) \equiv \forall x \lnot P(x)$.
- *Order*: $\forall x \exists y\, R(x,y) \not\equiv \exists y \forall x\, R(x,y)$.
:::

:::insight
A quantified statement is a proposition about a *universe*; keep the
universe explicit, pair $\forall$ with $\to$ and $\exists$ with $\land$, negate by flipping
quantifiers inward, and never swap $\forall$ with $\exists$.
:::
