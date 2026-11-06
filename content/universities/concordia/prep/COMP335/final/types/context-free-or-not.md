---
title: Context-free or not?
order: 9
asks: pumping-lemma proofs with a case analysis, closure arguments, deciding first
units: [cfl-properties]
method: context-free-or-not
---

## Logic

First decide, then prove. A stack can tie pairs of blocks **in sequence or nested**, in reverse order. So three tied blocks, crossing pairs, a copy in the same
order, and numeric conditions such as squares are not context-free. To prove "not context-free", use the pumping lemma or intersect with a regular language.

## Pattern

:::steps[A pumping proof with a window]
1. "Assume $L$ is context-free, and let $m$ be the pumping constant."
2. Choose $w \in L$ in terms of $m$, with every block of length at least $m$.
3. "Let $w = uvxyz$ with $|vxy| \le m$ and $|vy| \ge 1$." The window $vxy$ touches at most two neighbouring blocks.
4. List the positions of the window. In each, name what $v$ and $y$ can contain.
5. For each case, choose $i$ (0 or 2) and show that $uv^ixy^iz \notin L$.
6. "This contradicts the lemma, so $L$ is not context-free."
:::

## Traps

:::caution[Traps]
- The window can be **anywhere**: unlike the regular lemma, there is no "at the start".
- One of $v$ and $y$ may be empty: write the argument in terms of $|vy| \ge 1$.
- A $v$ or $y$ that straddles two letters breaks the order of the blocks under $i = 2$; say so, or use $i = 0$.
- The string $w$ must be chosen so that **no** window survives: $a^m b a^m b$ fails for $\{ww\}$.
- Regular proof habits do not carry over: "$y = a^k$" is not enough now.
:::

## Worked problems

::::exercise[Two proofs and a decision]
(a) Prove that $\{a^i b^j c^i d^j\}$ is not context-free. (b) Prove that $\{a^n b^{n^2}\}$ is not context-free. (c) Is $\{a^i b^j c^k : i = j \text{ or } i = k\}$ context-free?

:::solution
(a) Assume it is, with constant $m$. Take $w = a^m b^m c^m d^m$. The window touches at most two neighbouring blocks, so it misses at least one block of each pair: it cannot
contain symbols from both the $a$'s and the $c$'s, because the $b$ block lies between them, and likewise for the $b$'s and the $d$'s. Pump with $i = 0$. At least one symbol is
removed, say from the $a$'s: then the $c$'s are untouched, and the two counts differ. The same goes for each other block. So $uxz \notin L$.

(b) Assume it is, with constant $m$. Take $w = a^m b^{m^2}$.

- If $v$ or $y$ contains both letters, $uv^2xy^2z$ is not in $a^*b^*$.
- If $vy$ has only $a$'s, or only $b$'s, then pumping with $i = 0$ changes one count and not the other, so the equation fails.
- Otherwise $v = a^s$ and $y = b^t$ with $s, t \ge 1$ and $s + t \le m$. Take $i = 2$: the counts become $m + s$ and $m^2 + t$. But $(m + s)^2 = m^2 + 2ms + s^2 > m^2 + t$, because
  $t < m \le 2ms$. So the equation fails.

(c) Yes, it is a union with nested parts: $S \to XC \mid Y$, $\;X \to aXb \mid \lambda$, $\;C \to cC \mid \lambda$, $\;Y \to aYc \mid B$, $\;B \to bB \mid \lambda$.
:::
::::

:::note[Pattern at work]
In (a), step 4 did not need a list of positions, because every position fails for the same reason. In (b), the case of $v$ in the $a$'s and $y$ in the $b$'s is the
one a stack could survive for a linear equation, so it needs the inequality.
:::

## Drill

::::exercise[Decide first]
Context-free or not? (a) $\{a^n b^n a^n\}$; (b) $\{a^n b^m c^m d^n\}$; (c) $\{a^p : p \text{ prime}\}$; (d) $\{ww^R\}$; (e) $\{a^{2^n}\}$;
(f) $\{a^n b^m : m \le n\}$; (g) $\{w \in \{a, b, c\}^* : n_a(w) = n_b(w) = n_c(w)\}$.

:::solution
(a) Not: three tied blocks; take $w = a^m b^m a^m$. (b) Context-free: nested. (c) Not: over one letter, context-free means regular. (d) Context-free: mirror. (e) Not: unary with growing
gaps. (f) Context-free: $S \to aSb \mid aS \mid \lambda$. (g) Not: intersect with $L(a^*b^*c^*)$.
:::
::::
