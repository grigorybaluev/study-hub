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

### A repeated variable in a tall tree

In a finite automaton a long input repeats a state. In a grammar in Chomsky normal form, a long
string has a tall derivation tree, and on a long path of that tree a variable must repeat.

Say $A$ occurs twice on a path, the upper occurrence above the lower one. The picture splits the
string in five:

```text
                S
              / | \
             /  A  \         the upper A derives  v x y
            /  /|\  \
           /  / A \  \       the lower A derives    x
          /  /  |  \  \
         u  v   x   y  z
```

The part of the tree between the two $A$'s can be cut out, which replaces the upper subtree by the
lower one: that gives $uxz$. Or it can be copied, plugging another copy of itself at the lower $A$:
that gives $uv^2xy^2z$, and so on.

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
Let $L$ be an infinite context-free language. Then there is an integer $m \ge 1$ such that every
$w \in L$ with $|w| \ge m$ can be written as
$$w = uvxyz \qquad\text{with}\qquad |vxy| \le m, \qquad |vy| \ge 1,$$
so that
$$uv^ixy^iz \in L \qquad\text{for every } i = 0, 1, 2, \dots$$

:::proof
Take a grammar for $L - \{\lambda\}$ in Chomsky normal form, with $k$ variables, and let $m = 2^k$. In a
binary tree whose longest path has $h$ edges, the yield has at most $2^{h - 1}$ symbols here, since the last
edge of a path goes from a variable to a single terminal. So if $|w| \ge 2^k$, then $h \ge k + 1$: the
longest path has at least $k + 1$ variables.

Go up from the leaf of a longest path. Among the first $k + 1$ variables met, one, say $A$, repeats by the
pigeonhole principle. Take the repetition as low as possible, and cut $w$ as in the picture.

The upper $A$ has height at most $k + 1$, because the path chosen is a longest one, so $|vxy| \le 2^k = m$.
The upper $A$ uses a rule $A \to BC$, and the lower $A$ lies under one of the two children; the other
child derives at least one terminal, since CNF has no $\lambda$-rules. So $|vy| \ge 1$.

Finally, $A \overset{*}{\Rightarrow} vAy$ and $A \overset{*}{\Rightarrow} x$, so the middle of the tree can be
removed or repeated any number of times, and $S \overset{*}{\Rightarrow} uv^ixy^iz$ for every $i \ge 0$.
:::
::::

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
- *Bound from the grammar*: $m = 2^k$ for a CNF grammar with $k$ variables.
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
Assume it is, with pumping integer $m$. Take $w = a^m b^m c^m$, so $|w| = 3m \ge m$.

Let $w = uvxyz$ with $|vxy| \le m$ and $|vy| \ge 1$. The window is shorter than a whole block plus one
symbol, so it cannot touch all three blocks: it misses the $a$'s or it misses the $c$'s.

Take $i = 0$. Then $uxz$ is shorter than $w$ by $|vy| \ge 1$ symbols, and every removed symbol came from
the block or two blocks that the window touches. A block the window misses still has $m$ symbols, and
some touched block now has fewer than $m$. So the three counts in $uxz$ are not all equal, and
$uxz \notin L$. This contradicts the lemma, so $L$ is not context-free.
:::
::::

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

### Copies: $\{ww\}$

A useful fact first. A string $ss$ that contains both letters has at least four **blocks** (maximal runs
of one letter). And if it has exactly four, then it has the form $a^p b^q a^p b^q$ or $b^q a^p b^q a^p$.
Indeed, if $s$ has $t \ge 2$ blocks, then $ss$ has $2t$ of them, or $2t - 1$ if the two blocks at the middle
merge. Merging needs $s$ to start and end with the same letter, which needs $t \ge 3$.

::::example[$\{ww\}$ is not context-free]
Prove that $L = \{ww : w \in \{a, b\}^*\}$ is not context-free.

:::solution
Assume it is, with integer $m$. Take $w = a^m b^m a^m b^m$, which is $ss$ for $s = a^m b^m$. Pump with $i = 0$. The
window has at most $m$ symbols, so it lies inside two neighbouring blocks, and $uxz$ is $w$ with a few
symbols removed from those blocks.

If a block disappears entirely, $uxz$ has at most three blocks and still has both letters, so it is not
of the form $ss$.

Otherwise $uxz = a^p b^q a^r b^t$ with all four exponents positive, and it can only be in $L$ with $p = r$
and $q = t$. But exactly the blocks the window touches have shrunk:
- window in the first two blocks: $r = t = m$, and $p < m$ or $q < m$;
- window in the middle two blocks: $p = t = m$, and $q < m$ or $r < m$;
- window in the last two blocks: $p = q = m$, and $r < m$ or $t < m$.

Each case gives $p \ne r$ or $q \ne t$. So $uxz \notin L$, and $L$ is not context-free.
:::
::::

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
- *$ww$*: $w = a^m b^m a^m b^m$; $i = 0$ shrinks only neighbouring blocks.
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

**Membership.** Is $w \in L(G)$? Convert $G$ to Chomsky normal form and run CYK, in time proportional to
$|w|^3$ for a fixed grammar. The case $w = \lambda$ is a separate test: is $S$ nullable?

**Emptiness.** Is $L(G) = \varnothing$? Run the first step of the useless-production algorithm: $L(G)$ is empty
exactly when $S$ is not generating.

**Finiteness.** Is $L(G)$ finite? Clean the grammar, so that it has no useless, $\lambda$- or
unit-productions, and draw the dependency graph on its variables. Then $L(G)$ is infinite exactly when
the graph has a cycle.

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
