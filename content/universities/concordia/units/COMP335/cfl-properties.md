---
title: Properties of context-free languages
order: 10
status: detailed
weeks: [10]
introduces: [pumping-lemma-cfl]
requires:
  - {concept: context-free-grammar, strength: hard}
  - {concept: grammar-normal-forms, strength: soft}
  - {concept: pumping-lemma-regular, strength: soft}
  - {concept: pushdown-automaton, strength: soft}
reinforces:
  - {concept: language-closure-properties, perspective: "for context-free languages"}
  - {concept: language-decision-problems, perspective: "for context-free languages"}
---

The last two units showed what a stack can do. This unit shows where it stops. A long string of a
context-free language has a tall derivation tree, a tall tree repeats a variable, and a repeated
variable gives **two** pieces that can be pumped together. That is the pumping lemma for
context-free languages, and it shows that $\{a^n b^n c^n\}$ is out of reach. The unit then asks the same
questions as for regular languages, with different answers: which operations keep a language
context-free, and which questions about a grammar have an algorithm.

## The Pumping Lemma for Context-Free Languages

### Why a stack cannot count twice

To accept $a^n b^n c^n$, a machine must compare the $a$'s with the $b$'s and then the $b$'s with the
$c$'s. A stack can do the first comparison, but it uses the count up in doing so. Likewise $\{ww\}$ asks
for the first half in the same order, and a stack gives it back reversed. To turn this intuition into
proofs, one needs what the regular pumping lemma gave: a property of all languages in the class.

### A repeated variable in a derivation

In a finite automaton a long input repeats a state. In a grammar, a long string repeats a **variable**: some
variable $A$ appears inside its own derivation, $A \overset{*}{\Rightarrow} vAy$, and that piece of the derivation can be left
out or repeated.

::::example[A repeated variable, pumped]
Take the grammar $S \to AB$, $A \to aBb$, $B \to Sb \mid b$ and the string $abbabbbb$. Find a variable that repeats in its
derivation, and the strings that the repetition gives.

:::solution
A derivation:
$$
S \Rightarrow AB \Rightarrow aBbB \Rightarrow abbB \Rightarrow abbSb \Rightarrow abbABb \Rightarrow abbaBbBb \Rightarrow abbabbBb \Rightarrow abbabbbb .
$$
The last $B$ of $abbB$ derives $Sb \Rightarrow ABb \Rightarrow aBbBb \Rightarrow aBbbb$, which contains $B$ again. So the derivation splits into
$$
S \overset{*}{\Rightarrow} abbB, \qquad B \overset{*}{\Rightarrow} aBbbb, \qquad B \Rightarrow b .
$$
The middle piece can be used any number of times: $S \overset{*}{\Rightarrow} abb\,(a)^i B\,(bbb)^i \Rightarrow abb\,(a)^i\, b\,(bbb)^i$. With $i = 0$ this is
$abbb$, with $i = 1$ the original $abbabbbb$, with $i = 2$ the string $abbaabbbbbbb$; all of them are in $L(G)$.
:::
::::

In general, cut the tree at two occurrences of the same variable $A$ on one path, the upper occurrence above the
lower one. The picture splits the string in five:

```text
                S
              / | \
             /  A  \         the upper A derives  v x y
            /  /|\  \
           /  / A \  \       the lower A derives    x
          /  /  |  \  \
         u  v   x   y  z
```

So $S \overset{*}{\Rightarrow} uAz$, $A \overset{*}{\Rightarrow} vAy$ and $A \overset{*}{\Rightarrow} x$, with $w = uvxyz$. From these three pieces:

$$
S \overset{*}{\Rightarrow} uAz \overset{*}{\Rightarrow} uxz = uv^0xy^0z, \qquad
S \overset{*}{\Rightarrow} uAz \overset{*}{\Rightarrow} uvAyz \overset{*}{\Rightarrow} uvvAyyz \overset{*}{\Rightarrow} \cdots \overset{*}{\Rightarrow} uv^ixy^iz .
$$

Whenever $w = uvxyz \in L(G)$ arises this way, every $uv^ixy^iz$, $i \ge 0$, is in $L(G)$ too.

::::example[Pumping in a concrete tree]
In $S \to aSb \mid c$, take $w = aacbb$. Find a repeated variable and pump.

:::solution
The derivation $S \Rightarrow aSb \Rightarrow aaSbb \Rightarrow aacbb$ has $S$ at three levels. Take the first
and second occurrences: the upper one derives $acb$ and the lower one derives $c$. So
$$u = a, \quad v = a, \quad x = c, \quad y = b, \quad z = b .$$
Then $uxz = acb$, $\;uv^2xy^2z = aaacbbb$, and every $uv^ixy^iz = a^{i + 1} c\, b^{i + 1}$ is in the
language. Note that $v$ and $y$ grow **together**: that is exactly how a context-free language keeps
two counts in step.
:::
::::

::::theorem[Pumping lemma for context-free languages]
Let $L$ be an infinite context-free language. Then there is an integer $m \ge 1$ such that for any string $w \in L$
with $|w| \ge m$ we can write
$$w = uvxyz \qquad\text{with}\qquad |vxy| \le m, \qquad |vy| \ge 1,$$
so that
$$uv^ixy^iz \in L \qquad\text{for all } i \ge 0 .$$

:::proof
Take a grammar $G$ for $L - \{\lambda\}$ with **no unit-productions and no $\lambda$-productions** (the simplification unit
removes them). Say $G$ has $k$ variables and its longest right-hand side has $f$ symbols; $f \ge 2$, since otherwise
$L$ would be finite. Let $m = f^{k+1}$.

*A long string repeats a variable.* If no variable occurred twice on any path from the root of a derivation tree,
every path would have at most $k$ variables, the tree would have height at most $k$, and its yield at most
$f^k < m$ symbols. So in the tree of a string $w$ with $|w| \ge m$, some variable repeats on a path.

*The last repeated variable.* Take a longest path of the tree. Among its lowest $k + 1$ variables two are equal, by the
pigeonhole principle; call that variable $A$, the **last repeated variable**, and cut the tree at its two
occurrences as in the picture. Then $S \overset{*}{\Rightarrow} uAz$, $A \overset{*}{\Rightarrow} vAy$, $A \overset{*}{\Rightarrow} x$ and $w = uvxyz$, so every
$uv^ixy^iz$ is in $L$.

*Observation: $|vxy| \le m$.* The upper $A$ is among the lowest $k + 1$ variables of a longest path, so its subtree has
height at most $k + 1$, and its yield $vxy$ has at most $f^{k+1} = m$ symbols.

*Observation: $|vy| \ge 1$.* Since there are no unit- and no $\lambda$-productions, no step of a derivation shortens the
sentential form, and a step that keeps the length replaces a variable by a terminal. So $A \overset{+}{\Rightarrow} vAy$ cannot end
at the lone variable $A$: $vy \ne \lambda$.
:::
::::

:::remark
The slides take $m = (\text{number of productions}) \times (\text{longest right-hand side}) + 1$. Using the lemma never needs
the value of $m$, only its existence; the value $f^{k+1}$ above is the one the argument justifies step by step. In
Chomsky normal form every tree is binary ($f = 2$) and the same argument gives $m = 2^k$: a tree whose longest path
has $n$ edges yields at most $2^{n-1}$ symbols.
:::

| | Regular | Context-free |
|---|---|---|
| Split | $w = xyz$ | $w = uvxyz$ |
| Pumped | $xy^iz$ | $uv^ixy^iz$ |
| Length bound | $\lvert xy \rvert \le m$: at the **start** of $w$ | $\lvert vxy \rvert \le m$: **anywhere** in $w$ |
| Non-empty | $\lvert y \rvert \ge 1$ | $\lvert vy \rvert \ge 1$: one of $v$, $y$ may be empty |
| Source | a repeated state | a repeated variable |

:::caution[The window can be anywhere]
In the regular lemma, $|xy| \le m$ pinned the pumped part to the start of $w$, so one case was enough.
Here $vxy$ is a window of at most $m$ symbols that the opponent can place **anywhere**. Every position of
the window must be handled, and that makes a case analysis unavoidable. And like its regular cousin,
this lemma can never prove that a language **is** context-free.
:::

:::insight
The window $|vxy| \le m$ is the lever now. It is short, so it cannot reach two blocks that are more
than $m$ symbols apart. Choose $w$ with long blocks, and $v$ and $y$ together touch at most two
neighbouring blocks. A language that ties together three blocks, or two far-apart blocks, then breaks.
:::

:::equations
- *CFL pumping lemma*: $\exists m\ \forall w \in L,\ |w| \ge m\ \exists\, w = uvxyz,\ |vxy| \le m,\ |vy| \ge 1\ \forall i \ge 0:\ uv^ixy^iz \in L$.
- *Where it comes from*: no unit- or $\lambda$-productions; the last repeated variable $A$ gives $S \overset{*}{\Rightarrow} uAz$, $A \overset{*}{\Rightarrow} vAy$, $A \overset{*}{\Rightarrow} x$.
- *The two observations*: $|vxy| \le m$ because $A$ is the last repeated variable; $|vy| \ge 1$ because there are no unit- or $\lambda$-productions.
:::

## Proving Languages Not Context-Free

### The game

:::steps[Proving that $L$ is not context-free]
1. Assume $L$ is context-free. It is infinite, so the lemma applies, with an $m$ that the **opponent** picks.
2. **You** pick one $w \in L$ with $|w| \ge m$, written in terms of $m$, with blocks of length at least $m$.
3. The **opponent** picks any split $w = uvxyz$ with $|vxy| \le m$ and $|vy| \ge 1$.
4. List where the window $vxy$ can lie. For **each** case, **you** pick an $i$ (usually 0 or 2) with $uv^ixy^iz \notin L$.
5. This contradicts the lemma, so $L$ is not context-free.
:::

### $a^n b^n c^n$

::::example[$\{a^n b^n c^n\}$ is not context-free]
Prove that $L = \{a^n b^n c^n : n \ge 0\}$ is not context-free.

:::solution
Assume for contradiction that $L$ is context-free. It is infinite, so the pumping lemma applies; let $m$ be its integer.
Pick $w = a^m b^m c^m \in L$, with $|w| = 3m \ge m$. Write $w = uvxyz$ with $|vxy| \le m$ and $|vy| \ge 1$. We examine every
possible location of $vxy$ in $w$, and pump with $i = 2$.

**Case 1: $vxy$ is within $a^m$.** Then $v$ and $y$ consist of $a$'s only, $k = |vy| \ge 1$ of them, and
$uv^2xy^2z = a^{m + k} b^m c^m \notin L$.

**Cases 2 and 3: $vxy$ is within $b^m$, or within $c^m$.** The same: one count grows and the other two stay $m$.

**Case 4: $vxy$ overlaps $a^m$ and $b^m$.**
- $v$ contains only $a$'s ($k_1$ of them) and $y$ only $b$'s ($k_2$), $k_1 + k_2 \ge 1$: $uv^2xy^2z = a^{m + k_1} b^{m + k_2} c^m \notin L$, since the
  $c$'s are still $m$.
- $v$ contains both $a$'s and $b$'s, $v = a^{k_1}b^{k_2}$: then $v^2 = a^{k_1}b^{k_2}a^{k_1}b^{k_2}$ puts an $a$ after a $b$, and
  $uv^2xy^2z = a^m b^{k_2} a^{k_1} b^{m + k} c^m \notin L$ (with $k = |y|$), because it is not even of the form $a^*b^*c^*$.
- $y$ contains both $a$'s and $b$'s: the same as the previous possibility.

**Case 5: $vxy$ overlaps $b^m$ and $c^m$.** The same as case 4.

There are no other cases: $|vxy| \le m$, so $vxy$ cannot overlap $a^m$, $b^m$ and $c^m$ at the same time. In every case
$uv^2xy^2z \notin L$, which contradicts the pumping lemma. So $L$ is not context-free.
:::
::::

Pumping down works as well: with $i = 0$, the window misses the $a$'s or the $c$'s, a block it misses keeps $m$
symbols, and a block it touches loses some, so the counts of $uxz$ are not all equal.

The same proof covers every language that ties three blocks: $\{a^n b^{2n} c^{3n}\}$, for example.

### $a^i b^j c^k$ with $i < j < k$

::::example[Pumping in both directions]
Prove that $L = \{a^i b^j c^k : i < j < k\}$ is not context-free.

:::solution
Assume it is, with integer $m$. Take $w = a^m b^{m + 1} c^{m + 2}$. The window cannot touch both the
$a$'s and the $c$'s, because the $b$ block between them has $m + 1$ symbols.

**The window misses the $c$'s.** Take $i = 2$, which adds at least one symbol, an $a$ or a $b$. If some
$b$ is added, the $b$ count reaches at least $m + 2$, which is not below the $m + 2$ $c$'s. If only
$a$'s are added, the $a$ count reaches at least $m + 1$, which is not below the $m + 1$ $b$'s. In each
case $uv^2xy^2z \notin L$.

**The window misses the $a$'s.** Take $i = 0$. If a $b$ is removed, the $b$
count is at most $m$, which is not above the $m$ $a$'s. If only $c$'s are removed, the $c$ count is at
most $m + 1$, which is not above the $m + 1$ $b$'s. So $uxz \notin L$.

Every case fails, so $L$ is not context-free.
:::
::::

### Copies: $\{vv\}$

The language of copies, $\{vv : v \in \{a, b\}^*\}$ (also written $\{ww\}$), looks like $\{ww^R\}$, which is context-free. The proof
needs a fact about **blocks**, the maximal runs of one letter. If $s$ has $t$ blocks, then $ss$ has $2t$ of them, or
$2t - 1$ if the two blocks at the middle merge, which happens when $s$ starts and ends with the same letter. So if
$ss$ starts with $a$ and ends with $b$, then $s$ does too, $t$ is even, nothing merges, and **the number of blocks of $ss$ is
a multiple of $4$**. If it is exactly $4$, then $s = a^p b^q$ and $ss = a^p b^q a^p b^q$.

::::example[$\{vv\}$ is not context-free]
Prove that $L = \{vv : v \in \{a, b\}^*\}$ is not context-free.

:::solution
Assume for contradiction that $L$ is context-free, with integer $m$. Pick $w = a^m b^m a^m b^m \in L$ (it is $vv$ with
$v = a^m b^m$). Write $w = uvxyz$ with $|vxy| \le m$ and $|vy| \ge 1$, and pump with $i = 2$. The pumped string still starts
with $a$ and ends with $b$.

**Case 1: $vxy$ is within the first $a^m$.** $v = a^{k_1}$, $y = a^{k_2}$, $k_1 + k_2 \ge 1$: $uv^2xy^2z = a^{m + k_1 + k_2} b^m a^m b^m$. It has four
blocks, and its first and third blocks differ, so it is not $a^p b^q a^p b^q$: $uv^2xy^2z \notin L$.

**Case 2: $v$ is in the first $a^m$ and $y$ in the first $b^m$.** $v = a^{k_1}$, $y = b^{k_2}$: $uv^2xy^2z = a^{m + k_1} b^{m + k_2} a^m b^m$, again four
blocks with $p \neq r$ or $q \neq t$: not in $L$.

**Case 3: $v$ overlaps the first $a^m b^m$, $y$ is in the first $b^m$.** $v = a^{k_1}b^{k_2}$, $y = b^{k_3}$:
$uv^2xy^2z = a^m b^{k_2} a^{k_1} b^{m + k_3} a^m b^m$. Doubling $v$ added two blocks, so it has $6$ blocks, not a multiple of $4$: not in $L$.

**Case 4: $v$ is in the first $a^m$, $y$ overlaps the first $a^m b^m$.** Similar to case 3.

**The other cases.** $vxy$ within one of the other blocks $b^m$, $a^m$, $b^m$ is like case 1. $vxy$ overlapping the
middle $b^m a^m$ or the last $a^m b^m$ is like cases 2, 3 and 4. There are no others: since $|vxy| \le m$, the window
cannot overlap three blocks, and so only $v$ or $y$, not both, can contain a block boundary.

In every case $uv^2xy^2z \notin L$: with four blocks, pumping enlarged one or two neighbouring blocks and left the
block two places away as it was; with six, the count is not a multiple of $4$. This contradicts the lemma, so $L$
is not context-free.
:::
::::

Pumping down also works, and needs fewer cases: with $i = 0$ blocks can only shrink or disappear, so $uxz$ has at most
four blocks, and the blocks the window touched no longer match their partners two places away.

::::exercise[A string that pumps in $\{ww\}$]
To prove $\{ww\}$ not context-free, someone picks $w = a^m b a^m b$. Show that the proof does not go through,
for $m \ge 3$.

:::solution
The opponent chooses the split: put the window around the first $b$,
$$u = a^{m - 1}, \quad v = a, \quad x = b, \quad y = a, \quad z = a^{m - 1} b .$$
Then $|vxy| = 3 \le m$, and
$$uv^ixy^iz = a^{m - 1 + i}\, b\, a^{m - 1 + i}\, b,$$
which is $ss$ with $s = a^{m - 1 + i} b$, for every $i$. No $i$ leaves $L$, so this $w$ gives no contradiction.
The string $a^m b^m a^m b^m$ works because a window cannot reach two matching blocks at once: they are
more than $m$ symbols apart.
:::
::::

### A unary language

::::example[$\{a^{n^2}\}$ is not context-free]
Prove that $L = \{a^{n^2} : n \ge 0\}$ is not context-free.

:::solution
Assume it is, with integer $m$. Take $w = a^{m^2}$. Every symbol is $a$, so the position of the window does
not matter: only $k = |vy|$ does, and $1 \le k \le m$. Pump with $i = 2$:
$$uv^2xy^2z = a^{m^2 + k}, \qquad m^2 < m^2 + k \le m^2 + m < (m + 1)^2 .$$
The length lies strictly between two consecutive squares, so the string is not in $L$.
:::
::::

:::remark
Over a one-letter alphabet, every context-free language is in fact regular. So a unary language that is
not regular is not context-free either, and the proof above is the regular proof with a new name
for the same gap.
:::

::::example[$\{a^{n!}\}$ is not context-free]
Prove that $L = \{a^{n!} : n \ge 0\}$ is not context-free.

:::solution
Assume for contradiction that $L$ is context-free, with integer $m$; we may take $m \ge 2$. Pick $w = a^{m!} \in L$. Write
$w = uvxyz$ with $|vxy| \le m$ and $|vy| \ge 1$. There is only one case: every symbol is $a$, so $v = a^{k_1}$, $y = a^{k_2}$, and
$k = k_1 + k_2$ satisfies $1 \le k \le m$. Pump with $i = 2$: $uv^2xy^2z = a^{m! + k}$. Since $m \ge 2$,
$$
m! < m! + k \le m! + m < m! + m \cdot m! = m!\,(1 + m) = (m + 1)! .
$$
So $m! + k$ lies strictly between two consecutive factorials, $a^{m! + k} \notin L$, and this contradicts the lemma.
:::
::::

::::example[$\{a^{n^2} b^n\}$ is not context-free]
Prove that $L = \{a^{n^2} b^n : n \ge 0\}$ is not context-free.

:::solution
Assume for contradiction that $L$ is context-free, with integer $m$. Pick $w = a^{m^2} b^m \in L$ and write $w = uvxyz$ with
$|vxy| \le m$ and $|vy| \ge 1$.

**$v$ or $y$ contains both letters.** Pumping up ($i = 2$) puts an $a$ after a $b$, so the string is not even in $a^*b^*$.

**Only $a$'s are touched** ($vxy$ within $a^{m^2}$), $k = |vy| \ge 1$: $uxz = a^{m^2 - k} b^m$, and $m^2 - k \ne m^2$, so $uxz \notin L$.

**Only $b$'s are touched:** $uxz = a^{m^2} b^{m - k}$, and $m^2 \ne (m - k)^2$: not in $L$.

**The hardest case: $v = a^{k_1}$ is in the $a$'s and $y = b^{k_2}$ in the $b$'s, with $k_1, k_2 \ge 1$** (and $k_1 + k_2 \le m$).
Pump down: $uv^0xy^0z = a^{m^2 - k_1} b^{m - k_2}$. It would be in $L$ only if $m^2 - k_1 = (m - k_2)^2$. But
$$
(m - k_2)^2 \le (m - 1)^2 = m^2 - 2m + 1 < m^2 - m \le m^2 - k_1 ,
$$
using $k_2 \ge 1$, $m \ge 2$ and $k_1 \le m$ (for $m = 1$, both $k$'s cannot be $\ge 1$). So $(m - k_2)^2 < m^2 - k_1$, and $uxz \notin L$.

Every case contradicts the lemma, so $L$ is not context-free. Pumping **up** in the hardest case would not do: it
adds $k_1$ $a$'s and $k_2$ $b$'s, and it takes more care to show that the result is not of the form $a^{n^2}b^n$.
:::
::::

### Closure as a shortcut

As for regular languages, a language can be reduced to one already known. If $L$ were context-free, then
so would $L \cap R$ for any regular $R$, as the next part shows.

::::example[Three equal counts]
Prove that $L = \{w \in \{a, b, c\}^* : n_a(w) = n_b(w) = n_c(w)\}$ is not context-free.

:::solution
Suppose it is. Then $L \cap L(a^*b^*c^*)$ is context-free, because a context-free language intersected with
a regular one stays context-free. But this intersection is $\{a^n b^n c^n : n \ge 0\}$, which is not
context-free. So $L$ is not. Pumping $L$ directly works as well, but this proof takes two lines and no
cases.
:::
::::

:::insight
All these proofs use one fact: the window is shorter than a long block. So $v$ and $y$ can touch two
neighbouring blocks at most, and any condition that ties a third block, or a block far away, breaks when
they are pumped. Two neighbouring blocks tied together, as in $a^n b^n$, are exactly what can survive.
:::

:::equations
- *$a^n b^n c^n$*: $w = a^m b^m c^m$; the window misses a block; $i = 0$ unbalances the counts.
- *$i < j < k$*: $w = a^m b^{m + 1} c^{m + 2}$; pump up if the window misses the $c$'s, down if it misses the $a$'s.
- *$vv$*: $w = a^m b^m a^m b^m$; $i = 2$; four blocks with one pair unmatched, or six blocks (not a multiple of $4$).
- *Factorial lengths, $a^{n!}$*: $w = a^{m!}$; $i = 2$; $m! < m! + k < (m + 1)!$.
- *A square against a count, $a^{n^2}b^n$*: $w = a^{m^2}b^m$; $i = 0$; hardest case $(m - k_2)^2 < m^2 - k_1$.
- *$a^{n^2}$*: $w = a^{m^2}$; $m^2 < m^2 + k < (m + 1)^2$.
:::

## Closure Properties

### Closed under the grammar operations

:::theorem[Closure of context-free languages]
If $L_1$ and $L_2$ are context-free, so are $L_1 \cup L_2$, $L_1 L_2$, $L_1^*$, $L_1^R$, and $h(L_1)$ for every
homomorphism $h$.
:::

Each one is a change to a grammar. Let $G_1$ and $G_2$ have start variables $S_1$ and $S_2$ and no variable in
common, and let $S$ be a new start variable.

| Operation | New rules |
|---|---|
| union | $S \to S_1 \mid S_2$ |
| concatenation | $S \to S_1 S_2$ |
| star | $S \to S_1 S \mid \lambda$ |
| reversal | reverse every right-hand side |
| homomorphism | replace every terminal $a$ by the string $h(a)$ |

::::example[Building a grammar by closure]
Give a grammar for $\{a^n b^n c^k d^k : n, k \ge 0\}^*$ by closure.

:::solution
$P \to aPb \mid \lambda$ gives $a^n b^n$ and $Q \to cQd \mid \lambda$ gives $c^k d^k$. Concatenation gives
$R \to PQ$, and star gives $S \to RS \mid \lambda$.
:::
::::

### Not closed under intersection or complement

:::theorem[Non-closure of context-free languages]
Context-free languages are **not** closed under intersection or under complement.
:::

**Intersection.** Both of these are context-free, each with a matched pair and a free block:
$$L_1 = \{a^n b^n c^k : n, k \ge 0\}, \qquad L_2 = \{a^k b^n c^n : n, k \ge 0\}.$$
Their intersection is $\{a^n b^n c^n\}$, which is not.

**Complement.** If context-free languages were closed under complement, De Morgan's law would give
intersection as well, since closure under union is known:
$$L_1 \cap L_2 = \overline{\overline{L_1} \cup \overline{L_2}} .$$

There is also a direct witness.

::::example[A complement that crosses the line]
Show that the complement of $\{ww : w \in \{a, b\}^*\}$ is context-free, although $\{ww\}$ is not.

:::solution
A string is not of the form $ww$ when its length is odd, or when its two halves differ at some position.
Take
$$S \to O \mid AB \mid BA, \quad O \to XXO \mid X, \quad A \to XAX \mid a, \quad B \to XBX \mid b, \quad X \to a \mid b .$$
$O$ gives the strings of odd length. $A$ gives odd strings with $a$ at the centre, and $B$ odd strings with
$b$ at the centre. A string from $AB$, with $p$ letters on each side of the $a$ and $q$ on each side of the
$b$, has length $2(p + q + 1)$, so each half has $p + q + 1$ letters. The $a$ is at position $p + 1$ of the
first half and the $b$ is at position $p + 1$ of the second half: a mismatch. And any mismatch can be
written this way, because the letters in between can be split freely.
:::
::::

:::caution[Closure is one-way]
"$L_1$ and $L_2$ are context-free, so $L_1 \cap L_2$ is context-free" is false. But "$L_1 \cap L_2$ is not
context-free" does not give any information about $L_1$ and $L_2$ either: both were context-free above. And
a subset of a context-free language can be anything, since every language over $\Sigma$ is a subset of
the regular language $\Sigma^*$.
:::

### Intersection with a regular language

:::theorem[Closure under regular intersection]
If $L_1$ is context-free and $L_2$ is regular, then $L_1 \cap L_2$ is context-free.
:::

Two stacks cannot be merged, which is why two PDAs cannot run in parallel. But a DFA has no stack, so a PDA
and a DFA can: the product construction of the regular unit works on the states, and the stack
belongs to the PDA alone.

:::algorithm[Product of an NPDA and a DFA]
**Input:** an NPDA $M_1$ with states $Q$ and a DFA $M_2$ with states $P$.\
**Output:** an NPDA $M$ with $L(M) = L(M_1) \cap L(M_2)$.

1. Take the pairs $(q, p)$ as states, and $(q_0, p_0)$ as initial state.
2. For each move $a, b \to x$ of $M_1$ from $q$ to $q'$ with $a \in \Sigma$, and each $p$: add a move $a, b \to x$ from $(q, p)$ to $(q', \delta_2(p, a))$.
3. For each move $\lambda, b \to x$ of $M_1$ from $q$ to $q'$, and each $p$: add a move $\lambda, b \to x$ from $(q, p)$ to $(q', p)$. The DFA does not move.
4. Make $(q, p)$ final when $q$ and $p$ are both final.
:::

::::example[A PDA with a parity]
Intersect M₁ of the last unit, for $\{a^n b^n\}$, with the DFA for an even number of $a$'s, whose states are
$e$ and $o$.

:::solution
Starting from $(q_0, e)$, the reachable moves are:

| From | Read | Pop | To | Push |
|---|---|---|---|---|
| $(q_0, e)$ | $a$ | $z$ | $(q_1, o)$ | $az$ |
| $(q_1, o)$ | $a$ | $a$ | $(q_1, e)$ | $aa$ |
| $(q_1, e)$ | $a$ | $a$ | $(q_1, o)$ | $aa$ |
| $(q_1, e)$ | $b$ | $a$ | $(q_2, e)$ | $\lambda$ |
| $(q_1, o)$ | $b$ | $a$ | $(q_2, o)$ | $\lambda$ |
| $(q_2, e)$ | $b$ | $a$ | $(q_2, e)$ | $\lambda$ |
| $(q_2, o)$ | $b$ | $a$ | $(q_2, o)$ | $\lambda$ |
| $(q_2, e)$ | $\lambda$ | $z$ | $(q_3, e)$ | $z$ |
| $(q_2, o)$ | $\lambda$ | $z$ | $(q_3, o)$ | $z$ |

The final states are $(q_0, e)$ and $(q_3, e)$, and the machine accepts $\{a^n b^n : n \text{ even}\}$.
:::
::::

::::example[A product that cuts a language down]
$L_1 = \{w_1 w_2 : |w_1| = |w_2|,\ w_1 \in \{a, b\}^*,\ w_2 \in \{c, d\}^*\}$ is context-free and $L_2 = \{a, c\}^*$ is regular. Describe
the NPDA for $L_1 \cap L_2$ that the product construction gives, and the language it accepts.

:::solution
An NPDA $M_1$ for $L_1$: in a first state it pushes one symbol for each $a$ or $b$ read; a $\lambda$-move goes to a second
state, which pops one symbol for each $c$ or $d$; it accepts when the bottom of the stack shows. The DFA $M_2$ for
$\{a, c\}^*$ has one accepting state $p_0$ with loops on $a$ and $c$ (and a trap state for $b$ and $d$). In the product, a move
of $M_1$ on $a$ or $c$ keeps the DFA in $p_0$, a move on $b$ or $d$ sends it to the trap, and the $\lambda$-moves leave it in place.
So the product only accepts strings without $b$'s and $d$'s: $L_1 \cap L_2 = \{a^n c^n : n \ge 0\}$, context-free as the theorem says.
:::
::::

::::example[Regular closure proves a language context-free]
Show that $L = \{a^n b^n : n \ge 0,\ n \ne 100\}$ is context-free.

:::solution
$\{a^n b^n : n \ge 0\}$ is context-free. $\{a^{100}b^{100}\}$ is finite, so regular, and its complement
$L_1 = L((a + b)^*) - \{a^{100}b^{100}\}$ is regular too. By regular closure,
$$
\{a^n b^n : n \ge 0\} \cap L_1 = \{a^n b^n : n \ge 0,\ n \ne 100\}
$$
is context-free. Writing a grammar directly would be awkward; closure does it in one line.
:::
::::

### Comparing the classes

| Operation | Regular | Deterministic CF | Context-free |
|---|---|---|---|
| union | yes | no | yes |
| concatenation | yes | no | yes |
| star | yes | no | yes |
| homomorphism | yes | no | yes |
| reversal | yes | no | yes |
| intersection | yes | no | no |
| intersection with regular | yes | yes | yes |
| complement | yes | **yes** | **no** |

Complement is the striking row: a deterministic machine can be turned round, with care, and a
non-deterministic one cannot. It gives another route to "not deterministic". The complement of
$\{a^n b^n c^n\}$ over $\{a, b, c\}$ is context-free, as a union of three simple pieces: strings outside
$L(a^*b^*c^*)$, strings with $i \ne j$, and strings with $j \ne k$. It cannot be deterministic, since its
complement would then be context-free.

:::insight
The operations that keep a language context-free are the ones a grammar can do by rewriting its rules:
they place independent pieces side by side. Intersection and complement instead need two conditions to
hold of one string at once, and that would take two stacks. Keep one stack and one finite memory, and it
works: that is regular intersection.
:::

:::equations
- *Grammar closure*: $S \to S_1 \mid S_2$; $\;S \to S_1 S_2$; $\;S \to S_1 S \mid \lambda$.
- *Not closed*: $\{a^n b^n c^k\} \cap \{a^k b^n c^n\} = \{a^n b^n c^n\}$.
- *Complement gives intersection*: $L_1 \cap L_2 = \overline{\overline{L_1} \cup \overline{L_2}}$.
- *Regular intersection*: states $Q \times P$, the stack belongs to the PDA, and $\lambda$-moves leave the DFA where it is.
:::

## Decision Algorithms

### What can be decided

A context-free language is given by a grammar or an NPDA, both finite objects, so the questions of the
regular unit can be asked again.

**Membership.** Is $w \in L(G)$? Two membership algorithms (parsers) are known from the earlier units: **exhaustive
search parsing**, which terminates for a grammar with no unit- and no $\lambda$-productions, and the **CYK** algorithm:
convert $G$ to Chomsky normal form and fill the table, in time proportional to $|w|^3$ for a fixed grammar. The case
$w = \lambda$ is a separate test: is $S$ nullable?

**Emptiness.** Is $L(G) = \varnothing$? 1. Remove the useless variables. 2. Check whether the start variable $S$ is useless.
$L(G)$ is empty exactly when it is, that is, when $S$ is not generating.

**Finiteness.** Is $L(G)$ infinite?

1. Remove the useless variables.
2. Remove the unit- and $\lambda$-productions.
3. Draw the **dependency graph** of the variables: an edge $A \to B$ when $B$ occurs on the right side of a rule of $A$.
4. If the graph has a loop (a cycle), $L(G)$ is infinite; otherwise it is finite.

If removing unit- and $\lambda$-productions leaves new useless variables, remove those too: the graph must be drawn for a
grammar with none of the three.

::::example[A loop in the dependency graph]
Decide whether $S \to AB$, $A \to aCb \mid a$, $B \to bB \mid bb$, $C \to cBS$ generates an infinite language.

:::solution
Every variable is useful, and there are no unit- or $\lambda$-productions. The dependency graph has the edges $S \to A$,
$S \to B$, $A \to C$, $B \to B$, $C \to B$, $C \to S$. It has loops, $S \to A \to C \to S$ and $B \to B$, so $L(G)$ is infinite. The first loop
pumps directly:
$$
S \Rightarrow AB \Rightarrow aCbB \Rightarrow acBSbB \overset{*}{\Rightarrow} acbbSbbb ,
$$
so $S \overset{*}{\Rightarrow} (acbb)^i S (bbb)^i$ for every $i$, and each of these forms finishes to a different string.
:::
::::

::::example[Emptiness and finiteness]
Decide emptiness and finiteness for
(a) $S \to AB$, $\;A \to aA \mid a$, $\;B \to bB$;
(b) $S \to AB$, $\;A \to aB \mid a$, $\;B \to b \mid c$;
(c) $S \to AB$, $\;A \to aB \mid a$, $\;B \to bA \mid b$.

:::solution
(a) Generating: $A$ only, since $B$ never finishes, and so $S$ never does. $L(G) = \varnothing$.

(b) All variables are useful. The graph has edges $S \to A$, $S \to B$, $A \to B$: no cycle, so $L(G)$ is finite.
It is $\{ab, ac, abb, abc, acb, acc\}$.

(c) All variables are useful, and the graph has the cycle $A \to B \to A$. So $L(G)$ is infinite: the rules
give $A \Rightarrow aB \Rightarrow abA$, which pumps $(ab)^k$.
:::
::::

A cycle means $A \overset{*}{\Rightarrow} xAy$ for some strings $x, y$, and in a clean grammar $xy \ne \lambda$. So
$A$ pumps and the language is infinite. Without a cycle no variable repeats on a path, so derivation trees
have bounded height, and only finitely many such trees exist.

### What cannot be decided

Other natural questions have no algorithm at all. The proofs need the last unit, so here are the facts:

| Question | Regular | Context-free |
|---|---|---|
| Is $w \in L$? | decidable | decidable |
| Is $L$ empty? | decidable | decidable |
| Is $L$ finite? | decidable | decidable |
| Is $L = \Sigma^*$? | decidable | **undecidable** |
| Is $L_1 = L_2$? | decidable | **undecidable** |
| Is $L_1 \cap L_2$ empty? | decidable | **undecidable** |
| Is the grammar ambiguous? | | **undecidable** |

The dividing line is the one from the closure table. For a DFA, equality reduces to emptiness by product and
complement, and those operations are not available for context-free languages.

:::insight
Membership, emptiness and finiteness only ask about what a single grammar can derive, and a clean grammar
makes that visible. Equality asks about two languages at once and needs a comparison that this class
cannot express. It is the same wall as non-closure under intersection and complement, seen from the
algorithmic side.
:::

:::equations
- *CFG emptiness*: $L(G) = \varnothing \iff S$ is not generating.
- *CFG finiteness*: in a clean grammar, $L(G)$ is infinite $\iff$ the dependency graph has a cycle.
- *CFG membership*: CNF, then CYK; $\lambda \in L(G) \iff S$ is nullable.
:::
