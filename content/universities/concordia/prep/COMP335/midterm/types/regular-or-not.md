---
title: Regular or not?
order: 8
asks: pumping-lemma proofs, closure arguments, traps (finite, unary)
units: [pumping-lemma-regular, regular-closure-decision]
method: regular-or-not
---

## Logic

First decide, then prove. Regular: bounded memory suffices (a finite language, counting mod $k$,
bounded counts, simple patterns), so build a machine or expression, or use closure. Not regular: an
unbounded count must be compared ($a^nb^n$, $ww^R$, squares, primes), so use the pumping lemma, or
closure plus a known non-regular language.

## Pattern

:::steps[A pumping proof]
1. "Assume $L$ is regular; let $m$ be the pumping constant."
2. Choose $w\in L$ with $|w|\ge m$, starting with $m$ copies of one letter (so $y$ lies inside that
   block).
3. "Any split $w = xyz$ with $|xy|\le m$, $|y|\ge 1$ has $y = a^k$, $1\le k\le m$."
4. Pick $i$ (usually 0 or 2) and show $xy^iz\notin L$ for every such $k$.
5. "This contradicts the lemma, so $L$ is not regular."
:::

## Traps

:::caution[Traps]
- $w$ must be expressed in terms of $m$, and must be in $L$.
- You don't choose the split. Argue for all $k$ from 1 to $m$.
- Pumping can't prove regularity. A finite language is regular, even $\{a^nb^n : n\le 1000\}$.
- Unary languages: $\{a^n : n$ even$\}$ is regular; $\{a^{n^2}\}$ is not. Look at the gaps between
  consecutive lengths.
- A star of something can be regular: check what $L^*$ actually contains before trying to pump it.
:::

## Worked problems

::::exercise[Two pumping proofs]
Show that these are not regular: (a) $\{a^nb^{2n} : n\ge 0\}$; (b) $\{a^n : n$ is a perfect square$\}$.

:::solution
(a) Assume it is regular, with constant $m$. Take $w = a^mb^{2m}\in L$. Since $|xy|\le m$, $y = a^k$
with $1\le k\le m$. Pump with $i = 0$: $a^{m-k}b^{2m}$ has $2m\neq 2(m-k)$, so it is not in $L$.
Contradiction: not regular.

(b) Take $w = a^{m^2}$, so $y = a^k$ with $1\le k\le m$. Pump with $i = 2$: the length becomes
$m^2 + k$, and $m^2 < m^2 + k \le m^2 + m < m^2 + 2m + 1 = (m+1)^2$, so $m^2 + k$ lies strictly
between two consecutive squares. Not a square, so not regular.
:::
::::

:::note[Pattern at work]
In both, step 2 put $y$ inside one block. Step 4 had to work for every $k\le m$: in (b) the bound
$k\le m$ is exactly what keeps $m^2 + k$ below the next square.
:::

## Drill

::::exercise[Decide first]
Regular or not? (a) $\{a^nb^m : n + m$ is even$\}$; (b) $\{a^nb^m : n\neq m\}$;
(c) $\{a^nb^n : n\le 1000\}$; (d) $\{ww : w\in\{a,b\}^*\}$.

:::solution
(a) Regular: remember the parity and whether a $b$ has been seen (4 states), or use
$(aa)^*(bb)^* + a(aa)^*b(bb)^*$.

(b) Not regular: its complement intersected with $a^*b^*$ is $\{a^nb^n\}$. Complement and intersection
preserve regularity, so if (b) were regular, $a^nb^n$ would be too.

(c) Regular: finite.

(d) Not regular: take $w = a^mba^mb$; $y = a^k$ inside the first block; pumping with $i = 0$ gives
$a^{m-k}ba^mb$, which is not of the form $ww$.

Classify by memory: a parity is bounded, a finite set is bounded, while "=", "≠" and "copy" need an
unbounded comparison. For (b), pumping directly is awkward (pumped strings can still satisfy
$n\neq m$), and closure is the clean route.
:::
::::
