---
title: Regular languages
order: 4
status: detailed
weeks: [3]
introduces:
  - regular-expression
  - regular-grammar
  - {concept: language-closure-properties, perspective: "union, concatenation, star, reversal, complement and intersection of regular languages, each by a construction on automata"}
requires:
  - {concept: regular-language, strength: hard}
  - {concept: dfa, strength: hard}
  - {concept: nfa, strength: hard}
  - {concept: grammar, strength: hard}
  - {concept: proof-techniques, strength: soft}
reinforces:
  - {concept: regular-language, perspective: "three equivalent descriptions: finite automata, regular expressions and regular grammars"}
---

Regular languages are closed under the set operations, and they have two more descriptions
besides finite automata: regular expressions and regular grammars. Each description can be
converted into the others, so all three describe exactly the same class of languages.

## NFAs with a Single Final State

### The normal form

Several constructions below glue automata together at their final state. They are easier to
state when that final state is unique, and it always can be.

:::theorem[One final state is enough]
For every NFA $M$ there is an NFA $M'$ with exactly one final state and $L(M') = L(M)$.
:::

:::algorithm[Reduce to a single final state]
**Input:** an NFA $M = (Q, \Sigma, \delta, q_0, F)$.\
**Output:** an NFA $M'$ with one final state $q_f$ and $L(M') = L(M)$.

1. Add a new state $q_f$.
2. Add a λ-transition from every state of $F$ to $q_f$.
3. Make the states of $F$ non-final and $q_f$ the only final state.
4. If $F$ was empty, $q_f$ gets no incoming transitions at all: $M'$ still accepts $\varnothing$.
:::

A computation of $M$ ending in some final state $p$ becomes a computation of $M'$ that takes
one more λ-move $p \to q_f$, which reads nothing; so the accepted strings do not change.

::::example[Merging two final states]
The NFA below accepts $L(a + bb^*(a + \lambda))$. It has two final states, $q_1$ and $q_2$. Give an equivalent NFA with one final state.

```automaton
type: nfa
states: q0 60 120, q1 220 60, q2 220 180
start: q0
finals: [q1, q2]
trans: "q0 a q1; q0 b q2; q2 b q2; q2 a q1"
```

:::solution
Add $q_f$, a λ-edge into it from $q_1$ and from $q_2$, and keep $q_f$ as the only final state.

```automaton
type: nfa
states: q0 60 120, q1 220 60, q2 220 180, qf 380 120
start: q0
finals: [qf]
trans: "q0 a q1; q0 b q2; q2 b q2; q2 a q1; q1 λ qf; q2 λ qf"
```
:::
::::

## Closure under Set Operations

### The theorem

:::theorem[Closure of the regular languages]
If $L_1$ and $L_2$ are regular, then so are
$$L_1 \cup L_2, \qquad L_1 L_2, \qquad L_1^*, \qquad L_1^R, \qquad \overline{L_1}, \qquad L_1 \cap L_2 .$$
:::

Every proof is a construction. Take NFAs $M_1$ and $M_2$ with $L(M_1) = L_1$ and
$L(M_2) = L_2$, each with a single final state, and build an automaton for the new language
out of them. The running examples use

$$L_1 = \{a^n b : n \ge 0\}, \qquad L_2 = \{ba\}.$$

```automaton
machine: rl-m1
```

```automaton
machine: rl-m2
```

### Union

:::algorithm[NFA for $L_1 \cup L_2$]
**Input:** NFAs $M_1$, $M_2$ with single final states.\
**Output:** an NFA for $L_1 \cup L_2$.

1. Add a new initial state $s$ with λ-transitions to the initial states of $M_1$ and $M_2$.
2. Add a new final state $f$ with λ-transitions into it from the final states of $M_1$ and $M_2$.
3. Make the old final states non-final.
:::

From $s$ the automaton guesses which machine to run; a string reaches $f$ exactly when one of
them accepts it.

::::example[$\{a^n b\} \cup \{ba\}$]
Build the union NFA for the running example.

:::solution
```automaton
machine: rl-union
```

It accepts $aab$ (through the upper branch) and $ba$ (through the lower one), and nothing else
reaches $f$.
:::
::::

### Concatenation

:::algorithm[NFA for $L_1 L_2$]
**Input:** NFAs $M_1$, $M_2$ with single final states.\
**Output:** an NFA for $L_1 L_2$.

1. Add a λ-transition from the final state of $M_1$ to the initial state of $M_2$.
2. Make the final state of $M_1$ non-final. The initial state is that of $M_1$, the final state that of $M_2$.
:::

::::example[$\{a^n b\}\{ba\}$]
Build the concatenation NFA, and describe the language.

:::solution
```automaton
machine: rl-concat
```

$$L_1 L_2 = \{a^n b : n \ge 0\}\{ba\} = \{a^n bba : n \ge 0\}.$$
:::
::::

### Star

:::algorithm[NFA for $L_1^*$]
**Input:** an NFA $M_1$ with a single final state.\
**Output:** an NFA for $L_1^*$.

1. Add a new initial state $s$ and a new final state $f$.
2. Add λ-transitions $s \to$ (initial state of $M_1$) and (final state of $M_1$) $\to f$.
3. Add a λ-transition from the final state of $M_1$ back to its initial state, to run $M_1$ again.
4. Add a λ-transition $s \to f$, so that $\lambda \in L_1^*$.
:::

A string $w = w_1 w_2 \cdots w_k$ with every $w_i \in L_1$ is accepted by running $M_1$ once
per piece and taking the back edge between pieces; $k = 0$ uses the edge $s \to f$.

::::example[$\{a^n b\}^*$]
Build the star NFA for $L_1$.

:::solution
```automaton
machine: rl-star
```

It accepts $\lambda$, $b$, $ab$, $abb$, $aabab$, …: any sequence of blocks $a^n b$.
:::
::::

:::caution
The new states $s$ and $f$ are not decoration. Making the old initial state final instead, to
accept $\lambda$, can accept too much: if $M_1$ has transitions back into its initial state, a
string that stops half-way through a block would then be accepted.
:::

### Reversal

:::algorithm[NFA for $L_1^R$]
**Input:** an NFA $M_1$ with a single final state.\
**Output:** an NFA for $L_1^R$.

1. Reverse the direction of every transition.
2. Make the old initial state final and the old final state initial.
:::

A walk from $q_0$ to $q_f$ labelled $w$ becomes a walk from $q_f$ to $q_0$ labelled $w^R$. This
is where the single final state is needed: an automaton has only one initial state.

::::example[$\{a^n b\}^R$]
Reverse the NFA for $L_1$.

:::solution
```automaton
machine: rl-reverse
```

$$L_1^R = \{b a^n : n \ge 0\}.$$
:::
::::

### Complement

:::algorithm[DFA for $\overline{L_1}$]
**Input:** a DFA $M_1$ for $L_1$, with a transition on every symbol from every state.\
**Output:** a DFA for $\overline{L_1} = \Sigma^* - L_1$.

1. Make every final state non-final and every non-final state final.
:::

:::caution
This works for a **DFA** only. In an NFA a string can have one computation ending in a final
state and another ending in a non-final one; swapping would accept it in both automata. And the
DFA must be complete: a string on which it hangs is in $\overline{L_1}$, so the missing
transitions must first go to an explicit trap state, which then becomes final.
:::

::::example[$\overline{\{a^n b\}}$]
Give a DFA for $\{a, b\}^* - \{a^n b : n \ge 0\}$.

:::solution
Complete the DFA for $L_1$ with a trap state $t$:

| $\delta$ | $a$ | $b$ |
|---|---|---|
| $\to q_0$ | $q_0$ | $q_1$ |
| $*\,q_1$ | $t$ | $t$ |
| $t$ | $t$ | $t$ |

and swap final and non-final states:

| $\delta$ | $a$ | $b$ |
|---|---|---|
| $\to *\,q_0$ | $q_0$ | $q_1$ |
| $q_1$ | $t$ | $t$ |
| $*\,t$ | $t$ | $t$ |

```automaton
machine: rl-complement
```
:::
::::

### Intersection

No new construction is needed. By De Morgan's law

$$L_1 \cap L_2 = \overline{\overline{L_1} \cup \overline{L_2}},$$

and the right-hand side uses only complement and union, under which the regular languages are
already closed. For example $\{a^n b : n \ge 0\} \cap \{ab, ba\} = \{ab\}$ is regular.

:::insight
Every closure proof has the same shape: take automata for the given languages and wire them
into an automaton for the new one. Union, concatenation and star need λ-moves and a single final
state; complement needs a complete DFA; intersection comes for free from De Morgan's law. (A
direct construction also exists: run both DFAs in parallel on pairs of states.)
:::

:::equations
- *Closure*: $L_1, L_2$ regular $\Rightarrow$ $L_1 \cup L_2,\; L_1 L_2,\; L_1^*,\; L_1^R,\; \overline{L_1},\; L_1 \cap L_2$ regular.
- *De Morgan*: $L_1 \cap L_2 = \overline{\overline{L_1} \cup \overline{L_2}}$.
- *Running examples*: $\begin{gathered} \{a^n b\}\{ba\} = \{a^n bba\}, \qquad \{a^n b\}^R = \{b a^n\} \\[4pt] \{a^n b\} \cap \{ab, ba\} = \{ab\} \end{gathered}$
:::

## Regular Expressions

### Definition

A regular expression is a formula that names a language, built from single symbols with three
operators: $+$ (union), concatenation, and $^*$ (star). For example $(a + bc)^*$ names

$$\{a, bc\}^* = \{\lambda, a, bc, aa, abc, bca, bcbc, aaa, \dots\}.$$

:::definition[Regular expression]
Over an alphabet $\Sigma$:
- **Primitive** regular expressions: $\varnothing$, $\lambda$, and $a$ for every $a \in \Sigma$.
- If $r_1$ and $r_2$ are regular expressions, so are $r_1 + r_2$, $\;r_1 r_2$, $\;r_1^*$ and $(r_1)$.
- Nothing else is a regular expression.
:::

:::definition[Language of a regular expression]
$L(r)$ is defined by recursion on $r$:
$$L(\varnothing) = \varnothing, \qquad L(\lambda) = \{\lambda\}, \qquad L(a) = \{a\},$$
$$L(r_1 + r_2) = L(r_1) \cup L(r_2), \qquad L(r_1 r_2) = L(r_1)\,L(r_2), \qquad L(r_1^*) = (L(r_1))^*, \qquad L((r_1)) = L(r_1).$$
:::

Precedence, as in arithmetic: star binds tightest, then concatenation, then $+$. So
$a + bc^*$ means $a + (b(c^*))$.

::::example[Unfolding the definition]
Find $L((a + b)a^*)$.

:::solution
$$
\begin{aligned}
L((a + b)a^*) &= L((a + b))\; L(a^*) = L(a + b)\; (L(a))^* \\
&= (\{a\} \cup \{b\})\,\{a\}^* = \{a, b\}\{\lambda, a, aa, aaa, \dots\} \\
&= \{a, aa, aaa, \dots, b, ba, baa, \dots\}.
\end{aligned}
$$
Either symbol, followed by any number of $a$'s.
:::
::::

### Reading and writing regular expressions

| Regular expression $r$ | $L(r)$ |
|---|---|
| $(a + bc)^*(c + \varnothing)$ | $\{c, ac, bcc, aac, abcc, bcac, \dots\}$: blocks $a$ and $bc$, then a final $c$ |
| $(a + b)^*(a + bb)$ | strings over $\{a, b\}$ ending in $a$ or in $bb$ |
| $(aa)^*(bb)^*b$ | $\{a^{2n} b^{2m+1} : n, m \ge 0\}$ |
| $(0 + 1)^*00(0 + 1)^*$ | binary strings with at least two consecutive $0$'s |
| $(1 + 01)^*(0 + \lambda)$ | binary strings with no two consecutive $0$'s |

:::note
$\varnothing$ in a regular expression is the empty *language*, not the empty string: $r\varnothing$
names $L(r)\varnothing = \varnothing$, and $r + \varnothing$ names $L(r)$. So
$(a + bc)^*(c + \varnothing)$ is just $(a + bc)^*c$. By contrast $\varnothing^* = \lambda$,
since the star of any language contains $\lambda$.
:::

::::exercise[No two consecutive 0's]
Explain why $(1 + 01)^*(0 + \lambda)$ describes exactly the binary strings with no two
consecutive $0$'s.

:::solution
In such a string, every $0$ except possibly a last one is followed by a $1$. So the string
splits into blocks $1$ and $01$, possibly followed by one final $0$ — which is what
$(1 + 01)^*(0 + \lambda)$ says. Conversely, gluing blocks $1$ and $01$ never puts two $0$'s
side by side, and the final $0$ follows either nothing or a block ending in $1$.
:::
::::

### Equivalent regular expressions

:::definition[Equivalent regular expressions]
$r_1$ and $r_2$ are **equivalent**, written $r_1 \equiv r_2$, if $L(r_1) = L(r_2)$.
:::

The same language usually has many expressions. For the strings with no two consecutive $0$'s,

$$r_1 = (1 + 01)^*(0 + \lambda) \qquad \text{and} \qquad r_2 = (1^*011^*)^*(0 + \lambda) + 1^*(0 + \lambda)$$

are equivalent: $L(r_1) = L(r_2)$.

:::caution
Equivalence is a statement about languages, so it cannot be settled by looking at the symbols.
To show $r_1 \not\equiv r_2$, one string in one language and not the other is enough. To show
$r_1 \equiv r_2$, argue both inclusions (or, later in the course, compare minimal DFAs).
:::

```sim
id: rl-regex
custom: true
mode: regex
defaults:
  r1: (1+01)*(0+λ)
  r2: (1*011*)*(0+λ)+1*(0+λ)
  n: '6'
presets:
- r1: (a+bc)*(c+∅)
- r1: (a+b)*(a+bb)
- r1: (aa)*(bb)*b
- r1: (0+1)*00(0+1)*
- r1: (1+01)*(0+λ)
  r2: (1*011*)*(0+λ)+1*(0+λ)
- r1: (1+01)*(0+λ)
  r2: (1+01)*
- r1: (a+b)*
  r2: a*b*
note: 'Type one or two regular expressions. The tester shows how the expression was parsed, lists its language up to a length, and compares two expressions string by string; the first string that separates them is a proof that they are not equivalent.'
```

```python
# Output: [a, b, aa, ba, aaa, baa]; the two expressions agree up to length 10; (1+01)* alone differs on 0.
# Python's re module writes union as | and has no ∅ (so leave ∅ out); translate, then list and compare
# languages string by string. Agreement up to a length is evidence, not a proof.
import re
from itertools import product

def to_re(r):
    return re.compile(r.replace('+', '|').replace('λ', '') )

def language(r, alphabet, n):
    pat = to_re(r)
    return [''.join(t) for k in range(n + 1) for t in product(alphabet, repeat=k)
            if pat.fullmatch(''.join(t))]

def compare(r1, r2, alphabet, n):
    p1, p2 = to_re(r1), to_re(r2)
    for k in range(n + 1):
        for t in product(alphabet, repeat=k):
            w = ''.join(t)
            if bool(p1.fullmatch(w)) != bool(p2.fullmatch(w)):
                return f"differ on {w or 'λ'}"
    return f"agree up to length {n}"

print(language('(a+b)a*', 'ab', 3))
print(compare('(1+01)*(0+λ)', '(1*011*)*(0+λ)+1*(0+λ)', '01', 10))
print(compare('(1+01)*(0+λ)', '(1+01)*', '01', 10))
```

:::equations
- *Language of a regular expression*: $\begin{gathered} L(r_1 + r_2) = L(r_1) \cup L(r_2), \qquad L(r_1 r_2) = L(r_1)L(r_2) \\[4pt] L(r_1^*) = (L(r_1))^*, \qquad L(\varnothing) = \varnothing, \qquad L(\lambda) = \{\lambda\} \end{gathered}$
- *Equivalence*: $r_1 \equiv r_2 \iff L(r_1) = L(r_2)$.
:::

## Regular Expressions Describe Exactly the Regular Languages

:::theorem[Regular expressions and regular languages]
The languages described by regular expressions are exactly the regular languages:
1. for every regular expression $r$, $L(r)$ is regular;
2. for every regular language $L$, there is a regular expression $r$ with $L(r) = L$.
:::

### Part 1: from an expression to an automaton

::::theorem[Every regular expression names a regular language]
For every regular expression $r$, the language $L(r)$ is regular.

:::proof
By induction on the structure of $r$.

*Basis.* The primitive expressions name regular languages; each has an NFA: one non-final
state for $\varnothing$, one final initial state for $\{\lambda\}$, and $q_0 \xrightarrow{a} q_1$
with $q_1$ final for $\{a\}$.

*Inductive step.* Assume $L(r_1)$ and $L(r_2)$ are regular. By definition
$$L(r_1 + r_2) = L(r_1) \cup L(r_2), \qquad L(r_1 r_2) = L(r_1)L(r_2), \qquad L(r_1^*) = (L(r_1))^*,$$
and the regular languages are closed under union, concatenation and star, so all three are
regular. Finally $L((r_1)) = L(r_1)$ is regular by assumption.
:::
::::

The proof is also an algorithm: build the three basic NFAs for the symbols, then combine them
with the union, concatenation and star constructions, following the parse of $r$.

::::example[An NFA for $(a + b)a^*$]
Build an NFA for $(a + b)a^*$ by following the proof.

:::solution
Union of the NFAs for $a$ and $b$, then concatenation with the star of the NFA for $a$:

```automaton
type: nfa
states: s 40 150, a0 150 70, a1 260 70, b0 150 230, b1 260 230, m 370 150, t 470 150, c0 580 150, c1 690 150, f 800 150
start: s
finals: [f]
trans: "s λ a0; s λ b0; a0 a a1; b0 b b1; a1 λ m; b1 λ m; m λ t; t λ c0; c0 a c1; c1 λ c0; c1 λ f; t λ f"
curves: {"c1|c0": 40, "t|f": 120}
```

The automaton is large and full of λ-moves, but it is correct by construction. A hand-made NFA
would use two states: $q_0 \xrightarrow{a, b} q_1$ with a loop $a$ on the final state $q_1$.
:::
::::

```sim
id: rl-re-nfa
custom: true
mode: regex
nfa: true
defaults:
  r1: (a+b)a*
  n: '4'
  w: baa
presets:
- r1: (a+b)a*
- r1: ab*+b
- r1: (ab)*
- r1: (a+λ)b*
note: 'The NFA of the proof, built for any expression you type: each symbol gets two states, a union is stacked between a new initial and final state, a concatenation is joined by a λ-edge, and a star is wrapped with a back edge and a skip edge.'
```

```python
# Output: 10 states, 9 λ-edges; accepts a, b, ba, baa (not λ, ab, aab).
# The inductive construction: one small NFA per symbol, combined by union, concatenation
# and star. Every piece keeps a single final state; '' stands for λ.
from itertools import count
fresh = count()

def sym(a):
    p, q = next(fresh), next(fresh)
    return (p, q, [(p, a, q)])

def alt(A, B):
    s, f = next(fresh), next(fresh)
    return (s, f, A[2] + B[2] + [(s, '', A[0]), (s, '', B[0]), (A[1], '', f), (B[1], '', f)])

def cat(A, B):
    return (A[0], B[1], A[2] + B[2] + [(A[1], '', B[0])])

def star(A):
    s, f = next(fresh), next(fresh)
    return (s, f, A[2] + [(s, '', A[0]), (A[1], '', f), (A[1], '', A[0]), (s, '', f)])

def accepts(M, w):
    start, final, edges = M
    def closure(S):
        S, todo = set(S), list(S)
        while todo:
            p = todo.pop()
            for x, a, q in edges:
                if x == p and a == '' and q not in S:
                    S.add(q); todo.append(q)
        return S
    cur = closure({start})
    for c in w:
        cur = closure({q for p in cur for x, a, q in edges if x == p and a == c})
    return final in cur

M = cat(alt(sym('a'), sym('b')), star(sym('a')))         # (a + b) a*
states = {p for p, _, q in M[2]} | {q for p, _, q in M[2]}
print(len(states), 'states,', sum(a == '' for _, a, _ in M[2]), 'λ-edges')
print([w for w in ['', 'a', 'b', 'ba', 'baa', 'ab', 'aab'] if accepts(M, w)])
```

### Part 2: generalized transition graphs

For the other direction, take an NFA $M$ for $L$ with a single final state. The idea is to
remove its states one at a time, recording on the edges the regular expression for everything
that could have happened in the removed state.

:::definition[Generalized transition graph]
A **generalized transition graph** (GTG) is a transition graph whose edges are labelled with
regular expressions. A walk from the initial to a final state whose labels are $r_1, \dots, r_k$
accepts every string of $L(r_1 r_2 \cdots r_k)$.
:::

Every NFA is already a GTG: an edge with several symbols $a, b$ gets the label $a + b$, and a
λ-edge gets the label $\lambda$.

### Removing a state

:::algorithm[State elimination]
**Input:** a GTG, a state $q$ that is neither initial nor final.\
**Output:** an equivalent GTG without $q$.

1. Let $e$ be the label of the loop on $q$ ($e = \varnothing$, so $e^* = \lambda$, if there is none).
2. For every pair of states $q_i \xrightarrow{a} q$ and $q \xrightarrow{b} q_j$ (possibly $q_i = q_j$), add the edge $q_i \xrightarrow{a e^* b} q_j$.
3. If $q_i \to q_j$ already has a label $c$, join the two: $c + a e^* b$.
4. Delete $q$ and its edges.
:::

In the general picture, $q_i \xrightarrow{a} q \xrightarrow{b} q_j$, $q_j \xrightarrow{c} q \xrightarrow{d} q_i$ and a loop $e$ on $q$, removing $q$ leaves

$$q_i \xrightarrow{a e^* b} q_j, \qquad q_j \xrightarrow{c e^* d} q_i, \qquad q_i \circlearrowleft a e^* d, \qquad q_j \circlearrowleft c e^* b .$$

Repeat until only the initial state $q_0$ and the final state $q_f$ are left.

:::theorem[Reading off the expression]
If the two-state GTG has the loop $r_1$ on $q_0$, the edge $q_0 \xrightarrow{r_2} q_f$, the edge
$q_f \xrightarrow{r_3} q_0$ and the loop $r_4$ on $q_f$, then
$$r = r_1^*\, r_2\, (r_4 + r_3 r_1^* r_2)^*$$
satisfies $L(r) = L(M)$.
:::

Read it as: loop at $q_0$, cross to $q_f$; then any number of times either loop at $q_f$ or go
back to $q_0$, loop there, and cross again.

::::example[From an NFA to a regular expression]
Find a regular expression for the NFA below.

```automaton
machine: rl-elim
```

:::solution
As a GTG, the edge $q_1 \to q_2$ is labelled $a + b$. Remove $q_1$: its loop is $e = b$; it has
one incoming edge $q_0 \xrightarrow{b} q_1$ and two outgoing ones, $q_1 \xrightarrow{a} q_0$ and
$q_1 \xrightarrow{a + b} q_2$. This gives

```automaton
type: nfa
states: q0 80 120, q2 360 120
start: q0
finals: [q2]
trans: "q0 bb*a q0; q0 bb*(a+b) q2; q2 b q2"
```

Now $r_1 = bb^*a$, $r_2 = bb^*(a + b)$, $r_3 = \varnothing$, $r_4 = b$, and since
$r_3 = \varnothing$ the formula simplifies to $r_1^* r_2 r_4^*$:

$$r = (bb^*a)^*\, bb^*(a + b)\, b^* .$$
:::
::::

:::insight
The two halves of the theorem are two algorithms. Expression → NFA follows the parse tree and
uses the closure constructions; NFA → expression eliminates states and accumulates their loops
as stars. The expressions it produces are correct but rarely the shortest.
:::

:::equations
- *Removing $q$ with loop $e$*: $q_i \xrightarrow{a} q \xrightarrow{b} q_j \;\leadsto\; q_i \xrightarrow{a e^* b} q_j$ (joined by $+$ to an existing label).
- *Two-state GTG*: $r = r_1^*\, r_2\, (r_4 + r_3 r_1^* r_2)^*$ — loops $r_1$ at $q_0$ and $r_4$ at $q_f$; $r_2$ forward, $r_3$ back.
- *Worked example*: $r = (bb^*a)^*\, bb^*(a + b)\, b^*$.
:::

## Linear, Right-Linear and Left-Linear Grammars

### Linear grammars

Recall a grammar $G = (V, T, S, P)$: variables $V$, terminals $T$, a start variable $S$ and
productions $P$.

:::definition[Linear grammar]
A grammar is **linear** if every production has at most one variable on its right-hand side.
:::

$S \to aSb \mid \lambda$ and $S \to Ab,\ A \to aAb \mid \lambda$ are linear. So is

$$S \to A, \qquad A \to aB \mid \lambda, \qquad B \to Ab,$$

which generates $\{a^n b^n : n \ge 0\}$. The grammar $S \to SS \mid \lambda \mid aSb \mid bSa$
is **not** linear, because of $S \to SS$; it generates the strings with as many $a$'s as $b$'s.

### Right- and left-linear grammars

:::definition[Right-linear and left-linear grammars]
With $A, B$ variables and $x$ a string of terminals (possibly $\lambda$), a grammar is
- **right-linear** if all its productions have the form $A \to xB$ or $A \to x$;
- **left-linear** if all its productions have the form $A \to Bx$ or $A \to x$.
:::

In a right-linear grammar the one variable is always at the right end, so a derivation grows
the string left to right, like an automaton reading it. $S \to abS \mid a$ is right-linear;
$S \to Aab,\ A \to Aab \mid B,\ B \to a$ is left-linear.

:::definition[Regular grammar]
A **regular grammar** is a grammar that is right-linear or left-linear.
:::

:::caution
Every regular grammar is linear, but not every linear grammar is regular.
$S \to A,\ A \to aB \mid \lambda,\ B \to Ab$ is linear, yet it mixes $A \to aB$ (variable on the
right) with $B \to Ab$ (variable on the left), and its language $\{a^n b^n\}$ is not regular. A
regular grammar keeps the variable on the **same** side in every production.
:::

::::example[Two regular grammars for one language]
Find $L(G_1)$ and $L(G_2)$ for $G_1: S \to abS \mid a$ (right-linear) and
$G_2: S \to Aa,\ A \to Aab \mid \lambda$ (left-linear).

:::solution
$G_1$ produces $ab$ some number of times, then stops with $a$:
$S \Rightarrow abS \Rightarrow ababS \Rightarrow ababa$. $G_2$ builds the string from the right:
$S \Rightarrow Aa \Rightarrow Aaba \Rightarrow Aababa \Rightarrow ababa$. Both give
$$L(G_1) = L(G_2) = L((ab)^*a).$$
:::
::::

## Regular Grammars Generate Exactly the Regular Languages

:::theorem[Regular grammars and regular languages]
The languages generated by regular grammars are exactly the regular languages:
1. every regular grammar generates a regular language;
2. every regular language is generated by some regular grammar.
:::

### Part 1a: a right-linear grammar gives an NFA

Let each variable be a state. A production $V_i \to a_1 \cdots a_m V_j$ says "from $V_i$, read
$a_1 \cdots a_m$ and continue in $V_j$", which is a chain of transitions.

:::algorithm[Right-linear grammar → NFA]
**Input:** a right-linear grammar $G$ with variables $V_0$ (start), $V_1, \dots$\
**Output:** an NFA $M$ with $L(M) = L(G)$.

1. Make a state for every variable, with $V_0$ initial, plus one new final state $V_F$.
2. For every production $V_i \to a_1 a_2 \cdots a_m V_j$, add a path $V_i \xrightarrow{a_1} \cdot \xrightarrow{a_2} \cdots \xrightarrow{a_m} V_j$ through $m - 1$ new intermediate states (a λ-edge if $m = 0$).
3. For every production $V_i \to a_1 a_2 \cdots a_m$, add such a path from $V_i$ to $V_F$.
:::

A derivation $V_0 \Rightarrow x_1 V_{i_1} \Rightarrow x_1 x_2 V_{i_2} \Rightarrow \cdots \Rightarrow x_1 \cdots x_k$
corresponds step for step to a walk $V_0 \to V_{i_1} \to V_{i_2} \to \cdots \to V_F$ labelled
$x_1 x_2 \cdots x_k$, and back, so $L(M) = L(G)$.

::::example[From a right-linear grammar to an NFA]
Build an NFA for $G: S \to aA \mid B,\ A \to aaB,\ B \to bB \mid a$, and find $L(G)$.

:::solution
States $S, A, B, V_F$, and one intermediate state $x$ for the two symbols of $A \to aaB$:

| Production | Transitions |
|---|---|
| $S \to aA$ | $S \xrightarrow{a} A$ |
| $S \to B$ | $S \xrightarrow{\lambda} B$ |
| $A \to aaB$ | $A \xrightarrow{a} x \xrightarrow{a} B$ |
| $B \to bB$ | loop $b$ on $B$ |
| $B \to a$ | $B \xrightarrow{a} V_F$ |

```automaton
machine: rl-grammar-nfa
```

The derivation $S \Rightarrow aA \Rightarrow aaaB \Rightarrow aaabB \Rightarrow aaaba$ is the
walk $S \to A \to x \to B \to B \to V_F$ on $aaaba$. Reading the two routes from $S$ to $V_F$,
$$L(G) = L(M) = L(aaab^*a + b^*a).$$
:::
::::

### Part 1b: a left-linear grammar, by reversal

A left-linear grammar builds its string from the right end. Reversing every right-hand side
turns it into a right-linear grammar for the reversed language.

:::algorithm[Left-linear grammar → right-linear grammar for the reverse]
**Input:** a left-linear grammar $G$.\
**Output:** a right-linear grammar $G'$ with $L(G') = L(G)^R$.

1. Replace every production $A \to B a_1 a_2 \cdots a_k$ by $A \to a_k \cdots a_2 a_1 B$, i.e. $A \to Bv$ by $A \to v^R B$.
2. Replace every production $A \to a_1 a_2 \cdots a_k$ by $A \to a_k \cdots a_2 a_1$, i.e. $A \to v$ by $A \to v^R$.
:::

::::theorem[Left-linear grammars generate regular languages]
If $G$ is left-linear, then $L(G)$ is regular.

:::proof
Build $G'$ as above. A derivation in $G'$ is a derivation in $G$ with every string reversed, so
$L(G') = L(G)^R$. $G'$ is right-linear, so $L(G')$ is regular by Part 1a. The regular languages
are closed under reversal, hence $L(G) = (L(G)^R)^R = L(G')^R$ is regular.
:::
::::

### Part 2: an NFA gives a right-linear grammar

Now run Part 1a backwards: states become variables and transitions become productions.

:::algorithm[NFA → right-linear grammar]
**Input:** an NFA $M = (Q, \Sigma, \delta, q_0, F)$.\
**Output:** a right-linear grammar $G$ with $L(G) = L(M)$.

1. Make a variable for every state; $q_0$ is the start variable.
2. For every transition $q \xrightarrow{a} p$ (with $a \in \Sigma$ or $a = \lambda$), add the production $q \to a p$.
3. For every final state $q_f$, add the production $q_f \to \lambda$.
:::

Every production has the form $A \to xB$ or $A \to \lambda$, so $G$ is right-linear, hence
regular. An accepting walk $q_0 \xrightarrow{a_1} q_{i_1} \cdots \xrightarrow{a_n} q_f$ is the derivation
$q_0 \Rightarrow a_1 q_{i_1} \Rightarrow \cdots \Rightarrow a_1 \cdots a_n q_f \Rightarrow a_1 \cdots a_n$.

::::example[From an NFA to a grammar]
The NFA below accepts $L(ab^*ab(b^*ab)^*)$. Give a right-linear grammar for it.

```automaton
machine: rl-nfa-grammar
```

:::solution
One production per transition, and $q_3 \to \lambda$ for the final state:
$$q_0 \to aq_1, \qquad q_1 \to bq_1 \mid aq_2, \qquad q_2 \to bq_3, \qquad q_3 \to q_1 \mid \lambda .$$
For example $abab \in L$:

$$q_0 \Rightarrow aq_1 \Rightarrow abq_1 \Rightarrow abaq_2 \Rightarrow ababq_3 \Rightarrow abab .$$
:::
::::

```sim
id: rl-derive
custom: true
mode: derive
grammars:
- rl-g1
- rl-g2
- rl-right
- rl-left
- rl-nfa-g
- rl-linear
grammar: rl-g2
target: ababa
note: 'The grammars of this unit. A left-linear grammar grows its string from the right end, so its derivations keep one variable at the far left; the last grammar is linear but not regular, and generates aⁿbⁿ.'
```

```python
# Output: S ⇒ Aab ⇒ Aabab ⇒ Babab ⇒ aabab; the reversed rules S → baA, A → baA | B, B → a
# derive babaa, which is aabab reversed.
# Leftmost derivations by breadth-first search, and the left-linear → right-linear
# conversion: reversing every right-hand side generates the reversed language.
from collections import deque

def derive(rules, start, target):
    queue, seen = deque([[start]]), {start}
    while queue:
        path = queue.popleft(); form = path[-1]
        if form == target:
            return path
        i = next((k for k, c in enumerate(form) if c.isupper()), None)
        if i is None or not target.startswith(form[:i]) or sum(not c.isupper() for c in form) > len(target):
            continue
        for lhs, rhs in rules:
            if lhs == form[i]:
                nf = form[:i] + rhs + form[i + 1:]
                if nf not in seen and len(nf) <= len(target) + 2:
                    seen.add(nf); queue.append(path + [nf])
    return None

def reverse_rules(rules):   # A → Bv becomes A → v^R B ;  A → v becomes A → v^R
    return [(A, rhs[1:][::-1] + rhs[0] if rhs[:1].isupper() else rhs[::-1]) for A, rhs in rules]

G = [('S', 'Aab'), ('A', 'Aab'), ('A', 'B'), ('B', 'a')]   # left-linear, L = a(ab)+
print(' ⇒ '.join(derive(G, 'S', 'aabab')))
R = reverse_rules(G)
print(R)                                                    # right-linear, generates L(G)^R
print(' ⇒ '.join(derive(R, 'S', 'babaa')), '  aabab reversed')
```

:::insight
Three descriptions, one class. Finite automata recognise, regular expressions denote, and
regular grammars generate — and the constructions of this unit convert any one of them into any
other. A right-linear grammar is an NFA written as rules: a variable is a state, a production
is a transition, $A \to \lambda$ marks a final state.
:::

:::equations
- *Right-linear → NFA*: $V_i \to a_1 \cdots a_m V_j$ becomes a path $V_i \xrightarrow{a_1 \cdots a_m} V_j$; $V_i \to a_1 \cdots a_m$ a path to $V_F$.
- *Left-linear → right-linear*: $A \to Bv$ becomes $A \to v^R B$ and $A \to v$ becomes $A \to v^R$, generating $L(G)^R$.
- *NFA → right-linear*: $q \xrightarrow{a} p$ becomes $q \to ap$; a final $q_f$ gets $q_f \to \lambda$.
- *Worked examples*: $\begin{gathered} S \to aA \mid B,\; A \to aaB,\; B \to bB \mid a \;:\; L = L(aaab^*a + b^*a) \\[4pt] L(G_1) = L(G_2) = L((ab)^*a) \end{gathered}$
:::
