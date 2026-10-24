---
title: Regular expressions
order: 5
asks: write, read and compare expressions; NFA ↔ expression
units: [regular-languages]
---

## Logic

A regular expression describes the shape of the strings: blocks that repeat, an optional piece, a
fixed beginning or end. Find the building block (the piece that repeats), write it, then add what
goes before and after. For a condition like "no $X$", describe what is allowed instead.

## Pattern

:::steps[Write, convert, check]
1. List a few strings in $L$ and a few just outside it.
2. Find the repeating block (e.g. "each $a$ comes with a $b$": the block is $b$ or $ab$), then the
   start and end exceptions.
3. Test $\lambda$ and the near misses against your expression.
4. NFA → expression: make one initial state and one separate final state, then eliminate the others
   with $r_{pq} + r_{pk}r_{kk}^*r_{kq}$.
5. Expression → NFA: build from the inside out: a symbol, then $+$ (a new start with
   $\lambda$-moves), concatenation ($\lambda$ from the first final to the second start), star (a
   loop back plus a $\lambda$ bypass).
:::

## Traps

:::caution[Traps]
- Precedence: $ab^*$ is $a(b^*)$, not $(ab)^*$.
- Does the expression produce $\lambda$ when it should (or shouldn't)?
- $(a+b)^*$, "anything", is often too big: check that the forbidden strings can't sneak in through it.
- $a^* + b^*\neq(a+b)^*$; $(ab)^*\neq a^*b^*$; $(a^*b^*)^* = (a+b)^*$.
- When eliminating a state, don't forget its self-loop (the $r_{kk}^*$).
:::

## Worked problems

::::exercise[Write the expression]
Over $\{a,b\}$: (a) every $a$ is immediately followed by $b$; (b) an even number of $b$'s; (c) no
two consecutive $a$'s.

:::solution
(a) The blocks are $b$ or $ab$: $(b + ab)^*$. Check: $\lambda$, $bab$ and $abb$ are in; $a$ and $ba$
are not.

(b) $a$'s anywhere, $b$'s in pairs: $a^*(ba^*ba^*)^*$. Check: $bb$, $abab$ and $\lambda$ are in; $b$
is not.

(c) Every $a$ except possibly a final one is followed by $b$: $(b + ab)^*(\lambda + a)$. Check: $a$,
$aba$ and $bab$ are in; $aa$ is not.
:::
::::

:::note[Pattern at work]
Step 2: a block, then the end exception. (c) is (a) plus "may end in a single $a$". Each answer was
tested against the near misses ($a$, $b$, $aa$), and checked by computer against every string up to
length 9.
:::

::::exercise[State elimination]
Find a regular expression for the NFA with start $q_0$, final $q_2$, and edges $q_0\xrightarrow{a}q_1$,
$q_1\xrightarrow{b}q_1$, $q_1\xrightarrow{a}q_2$, $q_2\xrightarrow{b}q_1$.

```automaton
type: nfa
states: q0 60 110, q1 210 110, q2 360 110
start: q0
finals: q2
trans: q0 a q1; q1 b q1; q1 a q2; q2 b q1
```

:::solution
Eliminate $q_1$ (loop $b$). Its paths are $q_0\to q_1\to q_2$, giving $ab^*a$, and
$q_2\to q_1\to q_2$, giving $bb^*a$ (a new loop on $q_2$). That leaves $q_0\xrightarrow{ab^*a}q_2$
with the loop $bb^*a$ on $q_2$:

$$r = ab^*a\,(bb^*a)^*$$
:::
::::

:::note[Pattern at work]
Step 4: each path through the eliminated state picks up its loop as $b^*$. The edge $q_2\to q_1$
produced a self-loop on $q_2$, which becomes the final star.
:::

## Drill

::::exercise[Multiple choice]
Which are equal to $(a+b)^*$? (i) $(a^*b^*)^*$ (ii) $a^* + b^*$ (iii) $(a + ba)^*b^*$. Which
expression equals $(ab)^*a$? (iv) $a(ba)^*$ (v) $(aba)^*$.

:::solution
(i) Yes. (ii) No ($ab$ is missing). (iii) No: $bba$ is missing, since a $b$ that is not at the end
must be followed by an $a$; two $b$'s in a row before an $a$ break it. (iv) Yes. (v) No ($a$ alone is
in $(ab)^*a$ but not in $(aba)^*$).

"Not equal" needs one string in one side only. "Equal" needs a reason: a way to split every string
into the blocks.
:::
::::
