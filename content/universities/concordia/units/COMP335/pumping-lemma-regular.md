---
title: Pumping lemma for regular languages
order: 6
status: detailed
weeks: [5]
introduces: [pumping-lemma-regular]
requires:
  - {concept: regular-language, strength: hard}
  - {concept: dfa, strength: hard}
  - {concept: proof-techniques, strength: hard}
reinforces:
  - {concept: proof-techniques, perspective: "proof by contradiction with the pigeonhole principle"}
---

Not every language is regular. A finite automaton has a fixed, finite number of states, and
that is all the memory it has; a language that needs to count without bound cannot be
recognised by one. The pumping lemma turns this into a tool: every long enough string of a
regular language contains a piece that can be repeated, or removed, without leaving the language.
To show that a language is **not** regular, find a long string where no piece can be repeated.

## Non-regular Languages

### Finite memory

The regular languages so far — $L(a^*b)$, $L(b^*c + a)$, $L(b + c(a + b)^*)$ — can be recognised
while remembering only a bounded amount about the input. Two languages that look just as simple
cannot:

$$\{a^n b^n : n \ge 0\}, \qquad \{vv^R : v \in \{a, b\}^*\}.$$

To accept $a^n b^n$, a machine must remember $n$ while it reads the $a$'s, and $n$ can be any
number; to accept $vv^R$ it must remember all of $v$ to check it against the second half. A DFA
with $m$ states can only be in $m$ different situations, so it cannot tell apart more than $m$
different prefixes.

### Why a tool is needed

To prove that $L$ is regular, one DFA (or expression, or grammar) is enough. To prove that $L$ is
**not** regular, one must rule out **every** DFA, of every size — no case analysis can do that
directly. The pumping lemma does it at once: it states a property that every regular language has,
so a language without the property cannot be regular.

:::insight
Regularity is shown by a construction, non-regularity by a contradiction. The contradiction
always comes from the same place: a long input forces a DFA to repeat a state, and a repeated
state is a loop that the DFA cannot count.
:::

:::equations
- *Regular*: $L(a^*b)$, $L(b^*c + a)$, $L(b + c(a + b)^*)$, every finite language.
- *Not regular*: $\{a^n b^n : n \ge 0\}$, $\{vv^R : v \in \{a, b\}^*\}$ — proved below.
:::

## The Pigeonhole Principle on DFA Walks

### A long string repeats a state

Recall the pigeonhole principle: if more than $m$ objects are put into $m$ boxes, some box
holds at least two. In a DFA, the states visited are the boxes.

:::theorem[Long walks repeat a state]
Let $M$ be a DFA with $m$ states, and $w$ a string with $|w| \ge m$. Then the walk of $w$ in $M$
visits some state at least twice.
:::

Reading $w$ takes $|w|$ transitions, and a walk of $|w|$ transitions visits $|w| + 1 \ge m + 1$
states, counting the start. There are only $m$ states, so one is visited twice: the
transitions' endpoints are the pigeons and the states are the pigeonholes.

::::example[A repeated state]
The DFA below accepts the strings over $\{a, b\}$ that contain $aa$. Find the walk of $abaa$ and
the first state it repeats.

```automaton
type: dfa
states: q0 60 120, q1 220 120, q2 380 120
start: q0
finals: [q2]
trans: "q0 a q1; q0 b q0; q1 b q0; q1 a q2; q2 a,b q2"
curves: {"q0|q1": -30, "q1|q0": -30}
```

:::solution
The DFA has $m = 3$ states and $|abaa| = 4 \ge 3$, so some state must repeat:

$$(q_0, abaa) \vdash (q_1, baa) \vdash (q_0, aa) \vdash (q_1, a) \vdash (q_2, \lambda) \qquad \textbf{accept}$$

The first repeated state is $q_0$: the walk leaves it on $a$, comes back on $b$, and goes on.
The piece $ab$ read between the two visits is a loop at $q_0$.
:::
::::

Short strings need not repeat anything: $aa$ walks $q_0 \to q_1 \to q_2$ with three different
states. The guarantee starts at length $m$.

:::insight
A repeated state is a loop in the walk, and a DFA does not know how many times it has gone round
a loop. Going round it zero times, or twice, or a hundred times, ends in the same state — the
whole pumping lemma is this one observation.
:::

:::equations
- *Pigeonhole*: $|w| \ge m$ states $\Rightarrow$ the walk of $w$ visits $|w| + 1 > m$ states $\Rightarrow$ one repeats.
- *Worked example*: $abaa$ walks $q_0\, q_1\, q_0\, q_1\, q_2$; the loop at $q_0$ reads $ab$.
:::

## The Pumping Lemma

### Statement

::::theorem[Pumping lemma for regular languages]
Let $L$ be an infinite regular language. Then there is an integer $m \ge 1$ such that every
$w \in L$ with $|w| \ge m$ can be written as
$$w = xyz \qquad\text{with}\qquad |xy| \le m, \qquad |y| \ge 1,$$
so that
$$w_i = xy^iz \in L \qquad\text{for every } i = 0, 1, 2, \dots$$

:::proof
Since $L$ is regular, some DFA $M$ accepts it; let $m$ be its number of states. Take $w \in L$
with $|w| \ge m$ (there is one, because $L$ is infinite). By the pigeonhole principle the walk
of $w$ repeats a state; let $q$ be the **first** state that repeats. Cut $w$ at the two visits to
$q$:
- $x$ is read from $q_0$ to the first visit of $q$;
- $y$ is read from the first visit of $q$ to the second — a loop at $q$;
- $z$ is the rest, read from $q$ to a final state.

The loop is not empty, so $|y| \ge 1$. Up to the second visit of $q$, no state other than $q$
repeats, so the walk of $xy$ visits at most $m + 1$ states and $|xy| \le m$. Finally, the loop
can be taken any number of times: $x$ leads to $q$, each copy of $y$ leads from $q$ back to $q$,
and $z$ leads from $q$ to a final state. So $M$ accepts $xz$, $xyz$, $xyyz$, $xyyyz$, … — every
$xy^iz$ is in $L$.
:::
::::

In the example above, $m = 3$ and $w = abaa$ splits as $x = \lambda$, $y = ab$, $z = aa$: the
strings $aa$, $abaa$, $ababaa$, … all contain $aa$.

:::remark
The lemma also holds, trivially, for a finite language: take $m$ larger than its longest
string, and there is no $w$ to check. And if it holds with some $m$, it holds with every larger
$m$, since the same splits still satisfy $|xy| \le m$.
:::

:::caution
The pumping lemma is a **necessary** condition, not a sufficient one. Every regular language
satisfies it, but some non-regular languages satisfy it too. It can prove that a language is not
regular; it can never prove that a language is regular.
:::

### Using it

The lemma has four alternating quantifiers: **there is** an $m$, **for every** long $w$,
**there is** a split, **for every** $i$. To contradict it, all four flip, and it helps to read the
proof as a game against an opponent who wants $L$ to look regular.

:::steps[Proving that $L$ is not regular]
1. Assume $L$ is regular. Since it is infinite, the pumping lemma applies, with some $m$ that the **opponent** picks.
2. **You** pick one string $w \in L$ with $|w| \ge m$. It may depend on $m$.
3. The **opponent** picks any split $w = xyz$ with $|xy| \le m$ and $|y| \ge 1$. You must handle every such split.
4. **You** pick one $i \ge 0$ for which $xy^iz \notin L$.
5. This contradicts the lemma, so $L$ is not regular.
:::

The choice of $w$ does most of the work. A good $w$ puts its first $m$ symbols all equal, so that
$|xy| \le m$ pins $y$ down to a block of that symbol whatever split the opponent picks.

:::insight
The constraint $|xy| \le m$ is the lever. Without it the opponent could choose $y$ anywhere in
$w$; with it, $y$ lies inside the first $m$ symbols, so a string that begins with $a^m$ forces
$y = a^k$ for some $1 \le k \le m$, and the proof only has to deal with that one shape.
:::

:::equations
- *Pumping lemma*: $\exists m\ \forall w \in L,\ |w| \ge m\ \exists\, w = xyz,\ |xy| \le m,\ |y| \ge 1\ \forall i \ge 0:\ xy^iz \in L$.
- *Negation (non-regular)*: $\forall m\ \exists w \in L,\ |w| \ge m\ \forall\, w = xyz,\ |xy| \le m,\ |y| \ge 1\ \exists i \ge 0:\ xy^iz \notin L$.
:::

## Proving Languages Non-Regular

### $a^n b^n$

::::example[$\{a^n b^n\}$ is not regular]
Prove that $L = \{a^n b^n : n \ge 0\}$ is not regular.

:::solution
Assume $L$ is regular. It is infinite, so the pumping lemma applies; let $m$ be its integer.

Pick $w = a^m b^m$: it is in $L$ and $|w| = 2m \ge m$.

Take any split $w = xyz$ with $|xy| \le m$ and $|y| \ge 1$. The first $m$ symbols of $w$ are all
$a$, so $y = a^k$ for some $k \ge 1$.

Pump up with $i = 2$:
$$xy^2z = a^{m + k} b^m .$$
It has $k \ge 1$ more $a$'s than $b$'s, so $xy^2z \notin L$ — contradicting the lemma. So $L$ is
not regular.
:::
::::

### $vv^R$

::::example[$\{vv^R\}$ is not regular]
Prove that $L = \{vv^R : v \in \{a, b\}^*\}$, the even-length palindromes, is not regular.

:::solution
Assume $L$ is regular, with pumping-lemma integer $m$ ($L$ is infinite).

Pick $w = a^m b^m b^m a^m = vv^R$ with $v = a^m b^m$; $|w| = 4m \ge m$.

Any split with $|xy| \le m$ and $|y| \ge 1$ has $y = a^k$, $k \ge 1$, inside the first block of
$a$'s. Pump up with $i = 2$:
$$xy^2z = a^{m + k} b^{2m} a^m .$$
Its reverse is $a^m b^{2m} a^{m + k}$, a different string, so it is not a palindrome and not in
$L$ — a contradiction. So $L$ is not regular.
:::
::::

### $a^n b^l c^{n + l}$

::::example[$\{a^n b^l c^{n + l}\}$ is not regular]
Prove that $L = \{a^n b^l c^{n + l} : n, l \ge 0\}$ is not regular.

:::solution
Assume $L$ is regular, with pumping-lemma integer $m$ ($L$ is infinite).

Pick $w = a^m b^m c^{2m}$: here $n = l = m$, so $w \in L$, and $|w| = 4m \ge m$.

Again $|xy| \le m$ forces $y = a^k$ with $k \ge 1$. This time pump **down**, with $i = 0$:
$$xy^0z = xz = a^{m - k} b^m c^{2m} .$$
It would need $(m - k) + m = 2m$ $c$'s, but $k \ge 1$, so $xz \notin L$ — a contradiction. So $L$
is not regular. (Pumping up with $i = 2$ works as well.)
:::
::::

### $a^{n!}$

::::example[$\{a^{n!}\}$ is not regular]
Prove that $L = \{a^{n!} : n \ge 0\}$ is not regular.

:::solution
Assume $L$ is regular, with pumping-lemma integer $m$; by the remark above, take $m \ge 2$.

Pick $w = a^{m!}$; $|w| = m! \ge m$.

Every symbol is $a$, so any split has $y = a^k$ with $1 \le k \le m$ (from $|y| \ge 1$ and
$|xy| \le m$). Pump up with $i = 2$:
$$xy^2z = a^{m! + k} .$$
For this to be in $L$, $m! + k$ would have to be a factorial. But
$$m! < m! + k \le m! + m < m! + m \cdot m! = (m + 1)!,$$
where the last step uses $m < m \cdot m!$, true for $m \ge 2$. So $m! + k$ lies strictly between
two consecutive factorials and is not one: $xy^2z \notin L$, a contradiction. So $L$ is not
regular.
:::
::::

:::caution
The bound needs $m \ge 2$. With $m = 1$ and $k = 1$, $m! + k = 2 = 2!$, and $a^2$ **is** in $L$.
This does not break the proof: the opponent's $m$ can always be replaced by a larger one, so the
proof may assume $m \ge 2$ — but it has to say so.
:::

### Choosing $w$

::::exercise[A choice of $w$ that fails]
To prove $L = \{vv^R : v \in \{a, b\}^*\}$ non-regular, someone picks $w = a^{2m}$ (which is
$vv^R$ with $v = a^m$). Why does the proof not go through?

:::solution
The opponent chooses the split. For $m \ge 2$ they can take $x = \lambda$, $y = aa$,
$z = a^{2m - 2}$; then
$$xy^iz = a^{2m + 2(i - 1)}$$
has even length for every $i$, and every string of $a$'s of even length is in $L$. No $i$ leaves
$L$, so there is no contradiction. The lemma is not violated by this $w$ — which does not mean
$L$ is regular, only that $w$ was a poor choice. The string $a^m b^m b^m a^m$ works because its
middle cannot follow a change in the first block.
:::
::::

:::insight
All four proofs have the same skeleton: a $w$ that starts with $m$ copies of one symbol, a $y$
forced into that block, and a pumped string that breaks the one equation the language imposes
— $a$'s against $b$'s, the two halves of a palindrome, $a$'s and $b$'s against $c$'s, or a length
against the gaps between factorials.
:::

:::equations
- *$a^n b^n$*: $w = a^m b^m$, $y = a^k$, $\;xy^2z = a^{m + k} b^m \notin L$.
- *$vv^R$*: $w = a^m b^{2m} a^m$, $\;xy^2z = a^{m + k} b^{2m} a^m \notin L$.
- *$a^n b^l c^{n + l}$*: $w = a^m b^m c^{2m}$, $\;xz = a^{m - k} b^m c^{2m} \notin L$.
- *$a^{n!}$*: $w = a^{m!}$, $\;m! < m! + k < (m + 1)!$ for $m \ge 2$, so $xy^2z \notin L$.
:::
