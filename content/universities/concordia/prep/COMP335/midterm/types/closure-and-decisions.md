---
title: Closure properties and decisions
order: 7
asks: show regular by closure; homomorphism, quotient; new operations like chop(L)
units: [regular-closure-decision]
---

## Logic

Regular languages are closed under $\cup$, $\cap$, $-$, complement, concatenation, star, reversal,
homomorphism and quotients. So building $L$ from regular pieces proves it regular, with no machine
needed. In reverse: if $L$ were regular, $L\cap R$ would be too, so a non-regular $L\cap R$ proves $L$
non-regular. For a new operation (chop, prefix, …), modify a DFA for $L$.

## Pattern

:::steps[Closure and decisions]
1. Write $L$ as an expression of known regular languages and operations; name each closure property
   you use.
2. For a new operation, describe how to change a DFA (or NFA) for $L$: which states become final,
   which edges are added.
3. For a homomorphism, substitute $h(a)$ for every $a$ in an expression for $L$.
4. For a quotient $L_1/L_2$, ask: which $x$ can be completed by some $y\in L_2$ to a string of $L_1$?
5. Decisions: emptiness (a reachable final state?), finiteness (a cycle on a path from the start to a
   final state?), equality (minimise and compare).
:::

## Traps

:::caution[Traps]
- Closure goes one way: $L_1\cup L_2$ regular does not make $L_1$ regular ($L_1 = a^nb^n$,
  $L_2 = \Sigma^*$).
- A subset of a regular language need not be regular ($a^nb^n\subseteq a^*b^*$).
- Regular languages are not closed under infinite unions: every language is a union of singletons.
- Finiteness: a cycle that can't reach a final state doesn't make $L$ infinite.
:::

## Worked problems

::::exercise[Using closure]
(a) Show that $L = \{w\in\{a,b\}^* : n_a(w)$ is even and $w$ does not end in $b\}$ is regular.
(b) Let $h(a) = ab$, $h(b) = \lambda$. Find $h(L(a^*b^*))$. (c) Find $L(a^*ba^*)/L(a^*b)$. (d) Show
that $\mathrm{prefix}(L) = \{x : xy\in L$ for some $y\}$ is regular when $L$ is.

:::solution
(a) $L = L_1\cap\overline{L_2}$, with $L_1$ the language of the 2-state DFA "$n_a$ even" and
$L_2 = L((a+b)^*b)$. Both are regular, and the regular languages are closed under complement and
intersection. So $L$ is regular.

(b) Substitute into the expression: $h(a)^*h(b)^* = (ab)^*\lambda^*$, so $h(L) = L((ab)^*)$.

(c) $y\in a^*b$ ends in $b$, so $xy\in a^*ba^*$ must end with its only $b$: $xy = a^kb$, $y = a^jb$,
and $x = a^{k-j}$. $L(a^*ba^*)/L(a^*b) = L(a^*)$.

(d) Take a DFA for $L$ and make every state from which some final state is reachable final. Then $x$
is accepted exactly when it can be completed to a string of $L$. A DFA exists, so $\mathrm{prefix}(L)$
is regular.
:::
::::

:::note[Pattern at work]
(a) is step 1, naming each closure property. (d) is step 2, the template for every "new operation"
question (chop, suffix, half): change a DFA and argue that it accepts exactly the new language.
:::

::::exercise[Closure against regularity]
Show that $L = \{w\in\{a,b\}^* : n_a(w) = n_b(w)\}$ is not regular, assuming $\{a^nb^n\}$ is not.

:::solution
Suppose $L$ were regular. $L(a^*b^*)$ is regular, so $L\cap L(a^*b^*)$ would be regular. But
$L\cap L(a^*b^*) = \{a^nb^n : n\ge 0\}$, which is not regular. Contradiction, so $L$ is not regular.
:::
::::

:::note[Pattern at work]
Intersect with a regular "shape filter" ($a^*b^*$) that leaves a known non-regular language. This is
often faster than pumping directly.
:::
