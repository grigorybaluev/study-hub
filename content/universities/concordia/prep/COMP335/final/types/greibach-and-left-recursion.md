---
title: Greibach normal form and left recursion
order: 6
asks: remove left recursion; recognise and reach Greibach normal form
units: [cfg-normal-forms]
---

## Logic

In Greibach normal form every step writes one terminal, on the left: $A \to aB_1 \cdots B_k$. What blocks this form is a
right side that starts with a variable, and the worst case is left recursion, where a variable starts with itself. Substitution
moves terminals to the front; the left-recursion rule turns $A \to A\alpha \mid \beta$ into a right-recursive pair of rules.

## Pattern

:::steps[Reaching GNF on a small grammar]
1. Remove left recursion: $A \to A\alpha_j \mid \beta_i$ becomes $A \to \beta_i \mid \beta_i B$ and $B \to \alpha_j \mid \alpha_j B$.
2. Substitute: replace a leading variable by each of its right sides.
3. Replace each terminal that is not in first position by $T_a$, with $T_a \to a$.
4. Check: every right side is one terminal followed by variables only.
:::

## Traps

:::caution[Traps]
- In $A \to \beta \mid \beta B$, the bare $\beta$ is needed, because no $\lambda$-rule is allowed.
- The new rules of $B$ can start with a variable: they may need substitution too.
- GNF allows $A \to a$ with $k = 0$, but not $A \to \lambda$.
- A string of length $n$ takes exactly $n$ steps in GNF, against $2n - 1$ in CNF.
:::

## Worked problems

::::exercise[To Greibach normal form]
Convert $S \to Sa \mid Ab \mid c$, $\;A \to b$ to Greibach normal form.

:::solution
**Left recursion.** $\alpha = a$; $\beta_1 = Ab$, $\beta_2 = c$. With a new variable $B$:
$$S \to Ab \mid c \mid AbB \mid cB, \qquad B \to a \mid aB .$$

**Substitution.** Replace the leading $A$ by $b$:
$$S \to bb \mid c \mid bbB \mid cB .$$

**Later terminals.** Replace the second $b$ by $T_b$. The variable $A$ is no longer used.
$$S \to bT_b \mid c \mid bT_bB \mid cB, \qquad B \to a \mid aB, \qquad T_b \to b .$$

Both grammars generate $L((bb + c)a^*)$.
:::
::::

:::note[Pattern at work]
Each step fixed one obstacle: step 1 removed the $S$ at the front, step 2 the $A$, and step 3 the terminal in second place.
:::

## Drill

::::exercise[In the form or not]
Which are in GNF? (a) $S \to aSb \mid a$; (b) $S \to aAB \mid b$, $\;A \to c$, $\;B \to bA$; (c) $S \to AB$, $\;A \to a$, $\;B \to b$;
(d) $S \to a \mid aS \mid \lambda$.

:::solution
(a) No: a terminal stands in last place. (b) Yes. (c) No: the right side of $S$ starts with a variable (it is in CNF). (d) No:
$\lambda$-rule.
:::
::::
