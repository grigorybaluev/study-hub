---
title: Clean a grammar
order: 4
asks: nullable variables, unit pairs, useless variables, in the right order
units: [cfg-normal-forms]
---

## Logic

Three mechanical procedures, each a small fixed-point computation. Each removes a kind of rule and keeps the language,
except for $\lambda$. The only thinking is the **order**, because each step can make work for a later step and
never for an earlier one.

## Pattern

:::steps[The three steps]
1. **$\lambda$-rules.** Nullable set, by rounds: rules $A \to \lambda$, then rules whose right side is all nullable. Copy each rule with every subset of its nullable variables deleted. Delete the $\lambda$-rules.
2. **Unit rules.** Graph of the rules $A \to B$; find all pairs with a path. Delete the unit rules, and copy each remaining $B \to y$ up to $A$.
3. **Useless rules.** Generating set, by rounds, and delete the rest. Then reachable from $S$, and delete the rest.
:::

## Traps

:::caution[Traps]
- Order: $\lambda$, unit, useless. And inside step 3: generating, then reachable.
- A right side with $k$ nullable variables can give $2^k$ copies: do not forget the mixed ones.
- A variable with no rules at all, or whose every rule contains itself, is not generating.
- If $S$ is nullable, $\lambda$ is lost; say so, and add $S_0 \to S \mid \lambda$ if needed.
- Do not stop after one round of a fixed point.
:::

## Worked problems

::::exercise[A full cleanup]
Clean $S \to ABc \mid D$, $\;A \to aA \mid \lambda$, $\;B \to bB \mid A$, $\;C \to cC$, $\;D \to Cd \mid Ab$, $\;E \to a$.

:::solution
**$\lambda$-rules.** Nullable: $A$, then $B$ (from $B \to A$). $S$ and $D$ are not nullable, since their rules
contain terminals or $C$ or $D$.

$$S \to ABc \mid Ac \mid Bc \mid c \mid D, \quad A \to aA \mid a, \quad B \to bB \mid b \mid A,$$
$$C \to cC, \quad D \to Cd \mid Ab \mid b, \quad E \to a .$$

**Unit rules.** $S \to D$ and $B \to A$, so the pairs are $(S, D)$ and $(B, A)$.

$$S \to ABc \mid Ac \mid Bc \mid c \mid Cd \mid Ab \mid b, \quad B \to bB \mid b \mid aA \mid a, \quad D \to Cd \mid Ab \mid b,$$

and $A$, $C$, $E$ keep their rules.

**Useless rules.** Generating: everything but $C$, whose only rule contains $C$. So $S \to Cd$, $D \to Cd$ and $C$ go. Reachable
from $S$: $A$ and $B$. So $D$ and $E$ go.

$$S \to ABc \mid Ac \mid Bc \mid c \mid Ab \mid b, \quad A \to aA \mid a, \quad B \to bB \mid b \mid aA \mid a .$$

The language is $L(a^*b^*a^*c + a^*b)$, and $\lambda$ was never in it.
:::
::::

:::note[Pattern at work]
$D$ was reachable and generating at the start, and only became useless after the unit step copied its rules into $S$.
That is why the useless step comes last.
:::

## Drill

::::exercise[Which variables?]
In $S \to AB \mid CA$, $\;A \to a$, $\;B \to BC \mid AB$, $\;C \to aB \mid b$, find (a) the generating variables,
(b) the useful variables after removing the rest, (c) the nullable variables.

:::solution
(a) $A$ and $C$ in round 1, $S$ in round 2 (rule $S \to CA$). $B$ is not generating: each of its rules contains $B$.

(b) Delete $B$ and every rule with it: $S \to CA$, $\;A \to a$, $\;C \to b$. All three are reachable.

(c) None: there is no $\lambda$-rule to start from.
:::
::::
