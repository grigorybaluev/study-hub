---
title: Closure properties and decision algorithms for regular languages
order: 5
status: detailed
weeks: [4]
introduces: [language-decision-problems]
requires:
  - {concept: regular-language, strength: hard}
  - {concept: dfa, strength: hard}
  - {concept: nfa, strength: soft}
  - {concept: regular-expression, strength: hard}
  - {concept: regular-grammar, strength: hard}
reinforces:
  - {concept: language-closure-properties, perspective: "beyond the set operations: the product construction, difference, homomorphism and the right and left quotients"}
  - {concept: regular-grammar, perspective: "a regular grammar as a system of language equations, solved by the fixed-point theorem into a regular expression"}
---

The regular languages are closed under more than the set operations: under difference, under
replacing every symbol by a string, and under cutting off the suffixes or prefixes that belong
to another regular language. Because a regular language is always given by a finite object (a
DFA, an NFA, a regular expression or a regular grammar), the basic questions about it — is
$w$ in it, is it empty, is it finite, is it equal to another one — can all be answered by an
algorithm. A last tool turns a regular grammar directly into a regular expression by solving
equations between languages.

## Intersection and Difference

### Running two DFAs in parallel

The previous unit got intersection for free from De Morgan's law. A direct construction runs
both DFAs at once: the new automaton remembers a pair of states, one from each machine, and
moves both on every symbol.

:::algorithm[Product construction for $L(M_1) \cap L(M_2)$]
**Input:** DFAs $M_1 = (Q, \Sigma, \delta_1, q_0, F_1)$ and $M_2 = (P, \Sigma, \delta_2, p_0, F_2)$.\
**Output:** a DFA $\widehat{M} = (Q \times P, \Sigma, \widehat{\delta}, (q_0, p_0), \widehat{F})$ with $L(\widehat{M}) = L(M_1) \cap L(M_2)$.

1. Take as states the pairs $(q_i, p_j)$ and as initial state $(q_0, p_0)$.
2. Move both components on every symbol: $\widehat{\delta}((q_i, p_j), a) = (q_k, p_l)$ where $\delta_1(q_i, a) = q_k$ and $\delta_2(p_j, a) = p_l$.
3. Make a pair final when **both** components are final: $\widehat{F} = \{(q_i, p_j) : q_i \in F_1 \text{ and } p_j \in F_2\}$.
:::

By induction on $|w|$, $\widehat{\delta}^*((q_0, p_0), w) = (\delta_1^*(q_0, w), \delta_2^*(p_0, w))$,
so $\widehat{M}$ accepts $w$ exactly when both machines do. In practice only the pairs reachable
from $(q_0, p_0)$ are built, and there are usually far fewer than $|Q| \cdot |P|$.

::::example[$L(ab^*) \cap L(a^*b)$]
Build the product DFA for $L_1 = L(ab^*)$ and $L_2 = L(a^*b)$, and read off $L_1 \cap L_2$.

:::solution
DFAs for the two languages, with missing transitions going to an implicit trap. $M_1$ for
$L(ab^*)$:

| $\delta_1$ | $a$ | $b$ |
|---|---|---|
| $\to q_0$ | $q_1$ | — |
| $*\,q_1$ | — | $q_1$ |

```automaton
type: dfa
states: q0 60 120, q1 220 120
start: q0
finals: [q1]
trans: "q0 a q1; q1 b q1"
```

$M_2$ for $L(a^*b)$:

| $\delta_2$ | $a$ | $b$ |
|---|---|---|
| $\to p_0$ | $p_0$ | $p_1$ |
| $*\,p_1$ | — | — |

```automaton
type: dfa
states: p₀ 60 120, p₁ 220 120
start: p₀
finals: [p₁]
trans: "p₀ a p₀; p₀ b p₁"
```

Write $ij$ for the pair $(q_i, p_j)$. From $00$, reading $a$ moves $M_1$ to $q_1$ and keeps $M_2$
in $p_0$; reading $b$ then moves both to their final states. Every other move sends one of the
two machines into its trap, and the pair dies with it.

| $\widehat{\delta}$ | $a$ | $b$ |
|---|---|---|
| $\to 00$ | $10$ | — |
| $10$ | — | $11$ |
| $*\,11$ | — | — |

```automaton
type: dfa
states: 00 60 120, 10 220 120, 11 380 120
start: 00
finals: [11]
trans: "00 a 10; 10 b 11"
```

$$L_1 \cap L_2 = \{ab\}.$$
:::
::::

### Difference

:::theorem[Closure under difference]
If $L_1$ and $L_2$ are regular, so is $L_1 - L_2$.
:::

Write the difference with operations already known to be safe:

$$L_1 - L_2 = L_1 \cap \overline{L_2}.$$

For the product construction this means one change: complete both DFAs with their traps, then
make a pair final when its first component is final and its second is **not**.

::::example[$L(ab^*) - L(a^*b)$]
Find $L_1 - L_2$ for the languages of the previous example.

:::solution
Complete $M_1$ with a trap $q_2$ and $M_2$ with a trap $p_2$. The reachable pairs are

| $\widehat{\delta}$ | $a$ | $b$ |
|---|---|---|
| $\to 00$ | $10$ | $21$ |
| $*\,10$ | $20$ | $11$ |
| $11$ | $22$ | $12$ |
| $*\,12$ | $22$ | $12$ |
| $20$ | $20$ | $21$ |
| $21$ | $22$ | $22$ |
| $22$ | $22$ | $22$ |

with final states $10$ and $12$ ($q_1$ final, $p_j$ not). A pair with first component $q_2$ can
never become final, so drop those pairs to see the useful part:

```automaton
type: dfa
states: 00 60 120, 10 200 120, 11 340 120, 12 480 120
start: 00
finals: [10, 12]
trans: "00 a 10; 10 b 11; 11 b 12; 12 b 12"
```

$$L_1 - L_2 = L(a + abbb^*) .$$

Every string of $ab^*$ is also in $a^*b$ except $a$ itself and the strings with two or more
$b$'s.
:::
::::

:::insight
The product construction is the workhorse of this unit. Choosing which pairs are final gives
intersection (both final), union (either final), difference (first final, second not) or
symmetric difference (exactly one final) — and the decision algorithms below run it to compare
two languages.
:::

:::equations
- *Product*: $\widehat{\delta}((q_i, p_j), a) = (\delta_1(q_i, a), \delta_2(p_j, a))$, start $(q_0, p_0)$, $\widehat{F} = F_1 \times F_2$.
- *Difference*: $L_1 - L_2 = L_1 \cap \overline{L_2}$; finals $F_1 \times (P - F_2)$ on complete DFAs.
- *Worked example*: $L(ab^*) \cap L(a^*b) = \{ab\}, \qquad L(ab^*) - L(a^*b) = L(a + abbb^*)$.
:::

## Homomorphism

### Replacing symbols by strings

:::definition[Homomorphism]
Let $\Sigma$ and $\Gamma$ be alphabets. A **homomorphism** is a function $h : \Sigma \to \Gamma^*$.
It extends to strings symbol by symbol,
$$h(a_1 a_2 \cdots a_n) = h(a_1)\, h(a_2) \cdots h(a_n),$$
and to languages string by string: the **homomorphic image** of $L$ is $h(L) = \{h(w) : w \in L\}$.
:::

A homomorphism substitutes a fixed string for each symbol; it may lengthen strings, and if some
$h(a) = \lambda$ it erases that symbol.

::::example[Images of a string and a language]
Let $\Sigma = \{a, b\}$, $\Gamma = \{a, b, c\}$, $h(a) = ab$ and $h(b) = bbc$. Find $h(aba)$ and
$h(L)$ for $L = \{aa, aba\}$.

:::solution
Substitute symbol by symbol:
$$h(aba) = h(a)\,h(b)\,h(a) = ab \cdot bbc \cdot ab = abbbcab,$$
$$h(L) = \{h(aa), h(aba)\} = \{abab,\ abbbcab\}.$$
:::
::::

### Closure under homomorphism

::::theorem[Closure under homomorphism]
If $L \subseteq \Sigma^*$ is regular and $h$ is a homomorphism on $\Sigma$, then $h(L)$ is regular.

:::proof
Take a regular expression $r$ with $L(r) = L$, and let $h(r)$ be the expression obtained by
replacing every symbol $a$ of $r$ by the expression $(h(a))$. By induction on the structure of
$r$: for a symbol, $L(h(a)) = \{h(a)\} = h(\{a\})$; and $h$ commutes with the three operators,
$$h(L_1 \cup L_2) = h(L_1) \cup h(L_2), \qquad h(L_1 L_2) = h(L_1)\, h(L_2), \qquad h(L_1^*) = h(L_1)^*,$$
because $h$ works one symbol at a time. So $L(h(r)) = h(L(r)) = h(L)$, and $h(L)$ is denoted by a
regular expression.
:::
::::

::::example[Applying a homomorphism to an expression]
Let $r = (a + b^*)(aa)^*$, $h(a) = dbcc$ and $h(b) = bdc$. Give a regular expression for $h(L(r))$.

:::solution
Replace each symbol by its image:
$$h(r) = \big(dbcc + (bdc)^*\big)\,(dbcc\,dbcc)^* .$$
:::
::::

:::insight
The proof never builds an automaton: a regular expression is a recipe made of symbols, and a
homomorphism acts on symbols, so it can be applied to the recipe itself. (On an automaton the
same idea replaces each edge labelled $a$ by a path spelling $h(a)$.)
:::

:::equations
- *Homomorphism*: $h(a_1 \cdots a_n) = h(a_1) \cdots h(a_n)$, $\quad h(L) = \{h(w) : w \in L\}$.
- *On expressions*: replace every symbol $a$ by $(h(a))$; $\;h$ commutes with $+$, concatenation and $^*$.
- *Worked example*: $h(aba) = abbbcab$; $\;h\big((a + b^*)(aa)^*\big) = (dbcc + (bdc)^*)(dbccdbcc)^*$.
:::

## Quotients

### Right quotient

:::definition[Right quotient]
Let $L_1$ and $L_2$ be languages over the same alphabet. The **right quotient** of $L_1$ by $L_2$
is
$$L_1 / L_2 = \{x : xy \in L_1 \text{ for some } y \in L_2\}.$$
:::

$L_1 / L_2$ keeps the prefixes of strings of $L_1$ that can be completed by a string of $L_2$:
it cuts an $L_2$-suffix off the end.

::::example[A right quotient]
Find $L_1 / L_2$ for $L_1 = \{a^n b^m : n \ge 1, m \ge 0\} \cup \{ba\}$ and
$L_2 = \{b^m : m \ge 1\}$.

:::solution
A string $x$ is in the quotient when $x b^m \in L_1$ for some $m \ge 1$. The string $ba$ ends
in $a$, so it never has a suffix in $L_2$ and contributes nothing. A string $a^n b^k \in L_1$ with
$k \ge 1$ gives the prefixes $a^n b^{k - m}$ for $1 \le m \le k$, which are all the strings
$a^n b^j$ with $n \ge 1$, $j \ge 0$. So
$$L_1 / L_2 = \{a^n b^m : n \ge 1, m \ge 0\}.$$
:::
::::

### Closure under right quotient

::::theorem[Closure under right quotient]
If $L_1$ and $L_2$ are regular, then $L_1 / L_2$ is regular.

:::proof
Let $M = (Q, \Sigma, \delta, q_0, F)$ be a DFA for $L_1$. Keep its states and transitions and
change only the final states: a state $q_i$ becomes final when **some** string of $L_2$ leads
from it to a final state of $M$,
$$\widehat{F} = \{q_i \in Q : \delta^*(q_i, y) \in F \text{ for some } y \in L_2\}.$$
The DFA $\widehat{M} = (Q, \Sigma, \delta, q_0, \widehat{F})$ accepts $x$ exactly when
$\delta^*(q_0, x) = q_i$ with $q_i \in \widehat{F}$, that is, when $xy \in L_1$ for some
$y \in L_2$. So $L(\widehat{M}) = L_1 / L_2$.
:::
::::

The proof needs one more thing: deciding, for each $q_i$, whether such a $y$ exists. Let $M_i$ be
$M$ with $q_i$ as initial state. Then $L(M_i)$ is the set of strings leading from $q_i$ to a
final state, and $q_i \in \widehat{F}$ exactly when
$$L(M_i) \cap L_2 \ne \varnothing .$$
That is a product construction followed by the emptiness test of the next part, so $\widehat{F}$
can be computed, and $\widehat{M}$ is an actual DFA, not just one that exists.

:::algorithm[DFA for $L_1 / L_2$]
**Input:** a DFA $M = (Q, \Sigma, \delta, q_0, F)$ for $L_1$, and a DFA for $L_2$.\
**Output:** a DFA for $L_1 / L_2$.

1. For each state $q_i$, form $M_i$: the DFA $M$ with initial state $q_i$.
2. Build the product of $M_i$ and the DFA for $L_2$, and test whether its language $L(M_i) \cap L_2$ is empty.
3. Make $q_i$ final if it is not empty.
4. Keep $q_0$ and every transition of $M$ unchanged.
:::

::::example[A right quotient by a DFA]
Find $L(r_1) / L(r_2)$ for $r_1 = a^*baa^*$ and $r_2 = ab^*$.

:::solution
A DFA for $L(r_1)$, with missing transitions going to an implicit trap:

```automaton
type: dfa
states: q0 60 120, q1 220 120, q2 380 120
start: q0
finals: [q2]
trans: "q0 a q0; q0 b q1; q1 a q2; q2 a q2"
```

Test each state against the strings $ab^k$ of $L(r_2)$:
- from $q_0$, $a$ stays in $q_0$, $ab$ reaches $q_1$, and $ab^k$ with $k \ge 2$ dies: never final;
- from $q_1$, $a$ reaches $q_2$: final;
- from $q_2$, $a$ stays in $q_2$: final.

So $\widehat{F} = \{q_1, q_2\}$:

```automaton
type: dfa
states: q0 60 120, q1 220 120, q2 380 120
start: q0
finals: [q1, q2]
trans: "q0 a q0; q0 b q1; q1 a q2; q2 a q2"
```

$$L(r_1) / L(r_2) = L(a^*ba^*).$$

Directly: every string of $L(r_1)$ ends in $a$, so the only usable suffix of $L(r_2)$ is $a$
itself, and removing one final $a$ from $a^*baa^*$ leaves $a^*ba^*$.
:::
::::

### Left quotient

:::definition[Left quotient]
The **left quotient** of $L_1$ by $L_2$ is
$$L_2 \backslash L_1 = \{y : xy \in L_1 \text{ for some } x \in L_2\}.$$
:::

The operands are written in the opposite order: $L_2 \backslash L_1$ takes the strings of $L_1$
that have a prefix in $L_2$ and cuts that prefix off.

::::theorem[Closure under left quotient]
If $L_1$ and $L_2$ are regular, then $L_2 \backslash L_1$ is regular.

:::proof
Reverse everything. $xy \in L_1$ with $x \in L_2$ holds exactly when
$y^R x^R \in L_1^R$ with $x^R \in L_2^R$, that is, when $y^R \in L_1^R / L_2^R$. So
$$L_2 \backslash L_1 = \big(L_1^R / L_2^R\big)^R,$$
and the right-hand side uses reversal and right quotient only, both of which keep a language
regular.
:::
::::

:::remark
A direct construction also works: take a DFA for $L_1$, find every state that some $x \in L_2$
leads to from $q_0$, and start an NFA in all of them at once (a new initial state with λ-moves
to each).
:::

:::insight
Both quotients change only *where* a computation may start or stop, never how the machine
moves. The right quotient moves the finish line back to every state from which an $L_2$-suffix
can still reach it; the left quotient moves the start forward past an $L_2$-prefix.
:::

:::equations
- *Right quotient*: $L_1 / L_2 = \{x : \exists y \in L_2,\ xy \in L_1\}$; finals $\widehat{F} = \{q_i : L(M_i) \cap L_2 \ne \varnothing\}$.
- *Left quotient*: $L_2 \backslash L_1 = \{y : \exists x \in L_2,\ xy \in L_1\} = (L_1^R / L_2^R)^R$.
- *Worked examples*: $\{a^n b^m : n \ge 1\} \cup \{ba\}$ over $\{b^m : m \ge 1\}$ gives $\{a^n b^m : n \ge 1, m \ge 0\}$; $\;L(a^*baa^*) / L(ab^*) = L(a^*ba^*)$.
:::

## Deciding Questions about Regular Languages

### Standard representations

A regular language is usually infinite, so an algorithm cannot be handed the language itself.
It is handed a finite description instead.

:::definition[Standard representation]
A regular language is in a **standard representation** when it is given by a DFA, an NFA, a
regular expression or a regular grammar.
:::

The previous units convert any of these four into any other by an algorithm, so "we are given a
regular language $L$" means "we are given one of them", and an algorithm may first convert it
into whichever form suits it — usually a DFA.

### Membership

:::algorithm[Is $w \in L$?]
**Input:** a regular language $L$ in a standard representation, a string $w$.\
**Output:** whether $w \in L$.

1. Convert the representation of $L$ into a DFA $M$.
2. Run $M$ on $w$.
3. Answer yes if the run ends in a final state, no otherwise.
:::

The run takes $|w|$ steps; a DFA never hangs or branches, so it always gives an answer.

### Emptiness

:::algorithm[Is $L = \varnothing$?]
**Input:** a regular language $L$ in a standard representation.\
**Output:** whether $L$ is empty.

1. Convert the representation of $L$ into a DFA $M$.
2. Mark the states reachable from $q_0$ (a graph search along the transitions).
3. Answer "empty" if no final state is marked, "not empty" otherwise.
:::

A string is accepted exactly when it labels a walk from $q_0$ to a final state, so $L \ne \varnothing$
exactly when such a walk exists.

### Finiteness

:::algorithm[Is $L$ finite?]
**Input:** a regular language $L$ in a standard representation.\
**Output:** whether $L$ is finite.

1. Convert the representation of $L$ into a DFA $M$.
2. Keep only the states that lie on some walk from $q_0$ to a final state (reachable from $q_0$, and some final state reachable from them).
3. Answer "infinite" if the remaining graph has a cycle, "finite" otherwise.
:::

A cycle on the way from $q_0$ to a final state can be taken any number of times, and every lap
gives a new, longer accepted string. Without such a cycle every accepting walk visits each state
at most once, so accepted strings are shorter than $|Q|$, and there are finitely many of them.

:::caution
Step 2 matters. A cycle in a trap state, or in a part of the machine that is never reached,
repeats nothing that gets accepted: the complete DFA for $\{ab\}$ has a loop on its trap, yet the
language has one string.
:::

::::example[Two finiteness tests]
Decide whether $L(ab^*) \cap L(a^*b)$ and $L(ab^*) - L(a^*b)$ are finite, using the product DFAs
built in the first part.

:::solution
The useful part of the intersection DFA is the path $00 \xrightarrow{a} 10 \xrightarrow{b} 11$:
no cycle, so the language is finite (it is $\{ab\}$). The useful part of the difference DFA has
the loop $12 \xrightarrow{b} 12$ between $q_0$ and a final state, so the language is infinite
($a$, $abb$, $abbb$, …).
:::
::::

### Equality

:::algorithm[Is $L_1 = L_2$?]
**Input:** regular languages $L_1$ and $L_2$ in standard representations.\
**Output:** whether $L_1 = L_2$.

1. Build a DFA for $L_3 = (L_1 \cap \overline{L_2}) \cup (\overline{L_1} \cap L_2)$: the product of complete DFAs, with a pair final when exactly one component is final.
2. Test $L_3$ for emptiness.
3. Answer "equal" if $L_3 = \varnothing$, "not equal" otherwise.
:::

$L_3$ is the **symmetric difference**, the strings in exactly one of the two languages. It is
regular by closure, and it is empty exactly when $L_1 - L_2 = \varnothing$ and $L_2 - L_1 = \varnothing$,
that is, when $L_1 \subseteq L_2$ and $L_2 \subseteq L_1$. When it is not empty, any accepted string
is a witness that tells the languages apart.

::::example[$L(ab^*)$ against $L(a^*b)$]
Are $L(ab^*)$ and $L(a^*b)$ equal?

:::solution
No. The first part already found $L(ab^*) - L(a^*b) = L(a + abbb^*) \ne \varnothing$, so the
symmetric difference is not empty. The shortest witness is $a$: it is in $L(ab^*)$ and not in
$L(a^*b)$.
:::
::::

:::insight
Every question here reduces to a question about a graph: is there a walk (membership,
emptiness), is there a cycle on it (finiteness), and equality is emptiness of a product. They
are decidable because a DFA is finite. The same questions for larger classes of languages will
not all be so easy, and some will turn out to have no algorithm at all.
:::

:::equations
- *Membership*: run a DFA on $w$, $|w|$ steps.
- *Emptiness*: $L \ne \varnothing \iff$ a final state is reachable from $q_0$.
- *Finiteness*: $L$ infinite $\iff$ a cycle lies on some walk from $q_0$ to a final state.
- *Equality*: $L_1 = L_2 \iff (L_1 \cap \overline{L_2}) \cup (\overline{L_1} \cap L_2) = \varnothing$.
:::

## The Fixed-Point Theorem

### Language equations

A right-linear grammar can be read as a system of equations between languages. Let each variable
stand for the set of strings it derives; a production $A \to aB$ says that $a$ followed by
anything $B$ derives is something $A$ derives. Collecting the productions of each variable,
with $+$ for union,
$$S \to 0A \mid 1S \mid \lambda \qquad\text{becomes}\qquad S = 0A + 1S + \lambda .$$
The grammar's language is the value of $S$ in the solution. The variable $S$ appears on both
sides; the following theorem solves an equation of exactly this shape.

::::theorem[Fixed-point theorem]
Let $\alpha$ and $\beta$ be regular expressions with $\lambda \notin L(\alpha)$. Then the
equation
$$X = \alpha X + \beta$$
has exactly one solution,
$$X = \alpha^* \beta .$$

:::proof
*It is a solution.* Substitute: $\alpha\,\alpha^*\beta + \beta = (\alpha\alpha^* + \lambda)\,\beta = \alpha^*\beta$.

*It is the only one.* Let $X$ be any solution. Since $X \supseteq \beta$ and $X \supseteq \alpha X$,
induction gives $X \supseteq \alpha^k \beta$ for every $k$, so $X \supseteq \alpha^*\beta$.
Suppose $X$ had a string outside $\alpha^*\beta$, and take a shortest one, $w$. It is not in
$\beta$, so $w \in \alpha X$: $w = uv$ with $u \in L(\alpha)$, $v \in X$. Because
$\lambda \notin L(\alpha)$, $u$ is not empty and $v$ is shorter than $w$; so $v \in \alpha^*\beta$
by the choice of $w$, and then $w = uv \in \alpha\,\alpha^*\beta \subseteq \alpha^*\beta$ — a
contradiction.
:::
::::

:::caution
The condition $\lambda \notin L(\alpha)$ is what makes the solution unique. With $\alpha = \lambda$
the equation $X = X + \beta$ holds for every $X \supseteq L(\beta)$; $\alpha^*\beta$ is then only
the smallest solution. This result is also known as **Arden's rule**.
:::

### From a regular grammar to a regular expression

:::algorithm[Solve a right-linear grammar]
**Input:** a right-linear grammar with start variable $S$.\
**Output:** a regular expression for its language.

1. Write one equation per variable: its productions joined by $+$, with $\lambda$ for a production $A \to \lambda$.
2. Pick a variable $X$ other than $S$. Gather its equation into the form $X = \alpha X + \beta$, where $\beta$ may mention other variables.
3. Replace it by $X = \alpha^*\beta$, and substitute this for $X$ in every other equation.
4. Repeat from step 2 until only the equation for $S$ is left, then solve it the same way: $S = \alpha^*\beta$ with $\beta$ free of variables.
:::

In a grammar whose productions all begin with a terminal, $\alpha$ never contains $\lambda$, so
each step is justified by the theorem.

::::example[Counting zeros modulo three]
Find a regular expression for the grammar
$$S \to 0A \mid 1S \mid \lambda, \qquad A \to 0B \mid 1A, \qquad B \to 0S \mid 1B .$$

:::solution
The equations are
$$S = 0A + 1S + \lambda, \qquad A = 0B + 1A, \qquad B = 0S + 1B .$$

Solve for $B$: here $\alpha = 1$ and $\beta = 0S$, so $B = 1^*0S$.

Substitute into $A$: $A = 01^*0S + 1A$, so $\alpha = 1$, $\beta = 01^*0S$ and $A = 1^*01^*0S$.

Substitute into $S$:
$$S = 01^*01^*0S + 1S + \lambda = (01^*01^*0 + 1)\,S + \lambda,$$
so $\alpha = 01^*01^*0 + 1$, $\beta = \lambda$, and
$$S = (01^*01^*0 + 1)^* .$$

The variables count the $0$'s read so far modulo 3 ($S$: 0, $A$: 1, $B$: 2), so the language is
the set of binary strings whose number of $0$'s is a multiple of three — which the expression
says too: $1$'s anywhere, $0$'s in groups of three.
:::
::::

::::exercise[Parities of $a$ and $b$]
Find a regular expression for the grammar
$$S \to aA \mid bB, \qquad A \to aS \mid bC, \qquad B \to aC \mid bS \mid \lambda, \qquad C \to aB \mid bA,$$
and compare the effort with converting it to an NFA and eliminating states.

:::solution
Each variable records the parities of the $a$'s and $b$'s read so far ($S$: even, even; $A$:
odd $a$; $B$: odd $b$; $C$: both odd), and only $B$ can stop, so the language is the strings
with an even number of $a$'s and an odd number of $b$'s. The equations:
$$S = aA + bB, \quad A = aS + bC, \quad B = aC + bS + \lambda, \quad C = aB + bA .$$

$C$ has no loop: substitute $C = aB + bA$ directly.
$A = aS + baB + bbA$, so $A = (bb)^*(aS + baB)$.
$B = aaB + abA + bS + \lambda$; substituting $A$ and gathering the $B$ terms,
$$B = \big(aa + ab(bb)^*ba\big)B + \big(ab(bb)^*a + b\big)S + \lambda,$$
so with $P = \big(aa + ab(bb)^*ba\big)^*$,
$$B = P\,\big((ab(bb)^*a + b)\,S + \lambda\big).$$
Finally $S = aA + bB = a(bb)^*aS + \big(a(bb)^*ba + b\big)B$. Write $Q = a(bb)^*ba + b$ and
$R = ab(bb)^*a + b$, so that $B = P(RS + \lambda)$; substituting and gathering,
$$S = \big(a(bb)^*a + QPR\big)^*\, QP .$$

Both methods do the same bookkeeping — eliminating a variable is eliminating a state — and give
correct but long expressions; the order of elimination decides how long.
:::
::::

:::remark
A left-linear grammar gives equations of the form $X = X\alpha + \beta$, whose solution is
$X = \beta\alpha^*$ by the mirror-image argument.
:::

:::insight
The fixed-point theorem is state elimination written in algebra. A variable is a state, the
term $\alpha X$ is its loop, and $X = \alpha^*\beta$ says "loop any number of times, then leave" —
exactly the $e^*$ that elimination puts on every path through a removed state.
:::

:::equations
- *Fixed point*: $X = \alpha X + \beta,\ \lambda \notin L(\alpha) \;\Rightarrow\; X = \alpha^*\beta$ (unique); left-linear: $X = X\alpha + \beta \Rightarrow X = \beta\alpha^*$.
- *Grammar → equations*: $A \to aB \mid b \mid \lambda$ becomes $A = aB + b + \lambda$.
- *Worked example*: $S = (01^*01^*0 + 1)^*$, the binary strings with a multiple of three $0$'s.
:::
