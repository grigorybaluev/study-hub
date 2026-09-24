---
title: Valid arguments, rules of inference and fallacies
order: 3
status: detailed
notes: ["Lecture slides main1, pp. 66-80"]
introduces: [logical-inference]
requires:
  - {concept: propositional-logic, strength: hard}
  - {concept: predicate-logic, strength: hard}
reinforces: []
---

What makes an argument valid, the named inference rules that are used in every proof,
their versions for quantified statements, and the classic mistakes.

## Valid arguments

:::definition[Valid argument]
An **argument** is a list of **premises** followed by a **conclusion** ($\therefore$). It is
**valid** when the conclusion is true whenever all premises are true — by logical form alone,
regardless of what the propositions say.
:::

::::example[Coffee]
"If I drink coffee, I feel sick. I am drinking coffee. Therefore I feel sick." Is the
argument valid? Is $p \to q,\; q \to p \;\therefore\; p \lor q$?

:::solution
The form is $p \to q,\; p \;\therefore\; q$. In every row of the truth table where both
premises are true, $q$ is true: valid. By contrast $p \to q,\; q \to p \;\therefore\; p \lor q$
is invalid — the row $p = q = F$ makes both premises true and the conclusion false.
:::
::::

## Rules of inference

:::definition[Rule of inference]
A **rule of inference** is a valid argument form used often enough to have a name. Each
corresponds to a tautology $A \to B$: "if $A$ holds, conclude $B$".
:::

| rule | form | tautology |
|---|---|---|
| addition | $p \;\therefore\; p \lor q$ | $p \to (p \lor q)$ |
| simplification | $p \land q \;\therefore\; p$ | $(p \land q) \to p$ |
| conjunction | $p,\; q \;\therefore\; p \land q$ | |
| modus ponens | $p \to q,\; p \;\therefore\; q$ | $[p \land (p \to q)] \to q$ |
| modus tollens | $p \to q,\; \lnot q \;\therefore\; \lnot p$ | $[\lnot q \land (p \to q)] \to \lnot p$ |
| hypothetical syllogism | $p \to q,\; q \to r \;\therefore\; p \to r$ | |
| disjunctive syllogism | $p \lor q,\; \lnot p \;\therefore\; q$ | |
| contradiction rule | $\lnot p \to F \;\therefore\; p$ | $(\lnot p \to F) \to p$ |
| proof by cases | $p \lor q,\; p \to r,\; q \to r \;\therefore\; r$ | |

The contradiction rule is the basis of proof by contradiction; the cases rule of proof by
cases.

::::example[The trophy]
Premises: (1) if it does not rain or it is not foggy, the demonstration goes on and the race
is held; (2) if the race is held, a trophy is awarded; (3) no trophy was awarded. Show it
rained.

:::solution
With $p$ = rain, $q$ = fog, $r$ = demonstration, $s$ = race, $t$ = trophy, the premises are
$(\lnot p \lor \lnot q) \to (r \land s)$, $s \to t$ and $\lnot t$.

1. From $s \to t$ and $\lnot t$, modus tollens gives $\lnot s$.
2. Addition gives $\lnot s \lor \lnot r \equiv \lnot(r \land s)$.
3. Modus tollens on (1) gives $\lnot(\lnot p \lor \lnot q) \equiv p \land q$.
4. Simplification gives $p$: it rained.
:::
::::

## Rules for quantified statements

| rule | form |
|---|---|
| universal instantiation | $\forall x\, P(x) \;\therefore\; P(c)$ for any $c$ in the universe |
| universal generalization | $P(c)$ for an *arbitrary* $c \;\therefore\; \forall x\, P(x)$ |
| existential instantiation | $\exists x\, P(x) \;\therefore\; P(c)$ for *some* $c$ |
| existential generalization | $P(c)$ for some $c \;\therefore\; \exists x\, P(x)$ |
| universal modus ponens | $\forall x\,(P(x) \to Q(x)),\; P(c) \;\therefore\; Q(c)$ |
| universal modus tollens | $\forall x\,(P(x) \to Q(x)),\; \lnot Q(c) \;\therefore\; \lnot P(c)$ |

"Arbitrary" in universal generalization means nothing was assumed about $c$ beyond
membership in the universe — the usual shape of a proof that starts "let $n$ be any integer".

## Fallacies

:::definition[Fallacy]
A **fallacy** is an invalid argument form that looks like a rule of inference.
:::

:::caution
- **Converse error**: $p \to q$ and $q$, "therefore $p$". (The butler has blood on his hands;
  if he did it he would; so he did it.)
- **Inverse error**: $p \to q$ and $\lnot p$, "therefore $\lnot q$".
- **Begging the question**: a step that assumes the statement being proved.
:::

:::insight
A proof is a chain of inference rules. If a step is not one of the named
rules (or a known equivalence, definition, or earlier theorem), it is either a hidden
fallacy or a gap — the two fallacies above are exactly the converse and inverse that
propositional logic already told you are not equivalent to $p \to q$.
:::
