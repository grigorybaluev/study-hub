---
title: Functions
order: 6
status: detailed
introduces: [function]
requires:
  - {concept: set, strength: hard}
  - {concept: predicate-logic, strength: soft}
  - {concept: proof-techniques, strength: soft}
reinforces: []
---

Functions as assignments between sets: one-to-one, onto, bijections, inverses, composition,
and the floor and ceiling functions that computing constantly needs.

## Definition

:::definition[Function]
A **function** $f : A \to B$ assigns to each element of $A$ exactly one
element of $B$. $A$ is the **domain**, $B$ the **codomain**; $f(a)$ is the **image** of $a$
and $a$ a **preimage** of $f(a)$; the **range** is $\{f(a) \mid a \in A\}$.
:::

Three things specify a function: domain, codomain, and the rule — given as a table when the
domain is finite (an arrow diagram) or as an expression, possibly by cases. The arrow in
$f : A \to B$ is not the conditional; the symbol is overloaded.

For $S \subseteq A$, $f(S) = \{f(s) \mid s \in S\}$. Functions with codomain $\mathbb R$ can be
added and multiplied pointwise.

The **graph** of $f$ is the set of pairs $\{(a, f(a)) \mid a \in A\} \subseteq A \times B$: a
function *is* a special subset of a product, which is how relations will generalise it.

## One-to-one, onto, bijection

:::definition[One-to-one, onto, bijection]
$f$ is **one-to-one** (injective) if distinct inputs have distinct outputs:
$\forall x \forall y\,(x \ne y \to f(x) \ne f(y))$. $f$ is **onto** (surjective) if every
element of the codomain is hit: $\forall y \exists x\,(f(x) = y)$. A function that is both is
a **bijection** (one-to-one correspondence).
:::

Whether these hold depends on the domain and codomain, not just the formula:

| $f$ | one-to-one | onto |
|---|---|---|
| $f(n) = 2n + 1$, $\mathbb N \to \mathbb N$ | yes | no (even numbers are missed) |
| $f(x) = x^2$, $\mathbb Z \to \mathbb N$ | no ($f(-1) = f(1)$) | no ($2$ is missed) |
| $f(x) = 2x + 1$, $\mathbb R \to \mathbb R$ | yes | yes — a bijection |

Strictly increasing or decreasing functions $\mathbb R \to \mathbb R$ are one-to-one. The
identity $i_A(x) = x$ is a bijection; so is ASCII, characters $\to \{0, \dots, 255\}$.

::::example[A function on pairs]
Is $f(m, n) = (m + n, m - n)$ on $\mathbb Z \times \mathbb Z$ one-to-one? Onto?

:::solution
One-to-one: if $f(m_1, n_1) = f(m_2, n_2)$, adding and subtracting the two equations gives
$m_1 = m_2$ and $n_1 = n_2$. Not onto: a preimage of $(a, b)$ would need $m = (a + b)/2$, not an
integer for $(1, 2)$. On $\mathbb R \times \mathbb R$ the same formula is a bijection.
:::
::::

::::example[Integers onto naturals]
Find a bijection $\mathbb Z \to \mathbb N$.

:::solution
$f(n) = 2n$ for $n \ge 0$ and $f(n) = -(2n + 1)$ for $n < 0$ — non-negatives go to evens,
negatives to odds.
:::
::::

:::caution
One-to-one and onto are statements about the domain and codomain as well as the formula:
change either set and the answer can change.
:::

## Inverse and composition

:::definition[Inverse]
If $f : A \to B$ is a bijection, its **inverse** $f^{-1} : B \to A$ is
defined by $f^{-1}(b) = a \iff f(a) = b$. A function is **invertible** iff it is a bijection.
:::

:::definition[Composition]
For $g : A \to B$ and $f : B \to C$, the **composition** $f \circ g : A \to C$
is $(f \circ g)(a) = f(g(a))$ — first $g$, then $f$. It exists only when the codomain of $g$
is the domain of $f$.
:::

For an invertible $f$: $f^{-1} \circ f = i_A$ and $f \circ f^{-1} = i_B$.

::::example[Composition is not commutative]
For $f(x) = (x + 1)^2$ and $g(x) = 2x + 3$ on $\mathbb Z$, find $f \circ g$ and $g \circ f$.

:::solution
$$
(f \circ g)(x) = (2x + 4)^2
\qquad
(g \circ f)(x) = 2(x + 1)^2 + 3 .
$$

They differ. And $g \circ f$ may not even exist: item $\to$ barcode $\to$ price composes one
way only.
:::
::::

## Floor and ceiling

:::definition[Floor and ceiling]
$\lfloor x \rfloor$ is the largest integer $\le x$; $\lceil x \rceil$ the smallest integer
$\ge x$. So $\lfloor 3.6 \rfloor = 3$, $\lfloor -3.4 \rfloor = -4$, $\lceil -3.4 \rceil = -3$.
:::

:::proposition[Floor and ceiling rules]
For all real $x$ and integer $m$:

- $x - 1 < \lfloor x \rfloor \le x \le \lceil x \rceil < x + 1$;
- $\lceil -x \rceil = -\lfloor x \rfloor$ and $\lfloor -x \rfloor = -\lceil x \rceil$;
- $\lfloor x + m \rfloor = \lfloor x \rfloor + m$ and $\lceil x + m \rceil = \lceil x \rceil + m$.
:::

::::example[Words and cents]
How many words are needed to store $n$ bytes at $k$ bytes per word? How do you round an
amount $x$ to the nearest cent?

:::solution
$\lceil n/k \rceil$ words. To the nearest cent: $\lfloor 100x + 0.5 \rfloor / 100$.
:::
::::

:::insight
One-to-one and onto are statements *with quantifiers* about the domain
and codomain — change either set and the answer can change. A bijection is exactly a
function you can run backwards, and that is what will make "same size" meaningful for
infinite sets.
:::
