---
title: Pushdown automata
order: 9
status: detailed
weeks: [9]
introduces: [pushdown-automaton]
requires:
  - {concept: context-free-grammar, strength: hard}
  - {concept: nfa, strength: hard}
  - {concept: stack, strength: soft}
  - {concept: grammar-normal-forms, strength: soft}
reinforces:
  - {concept: context-free-grammar, perspective: "the languages that a finite control with one stack accepts"}
---

Regular languages have a machine, the finite automaton, and context-free languages have one too. A
finite automaton forgets everything but its state, so it cannot count. Give it a stack and it can:
push on the way in, pop on the way out. This **pushdown automaton** accepts exactly the context-free
languages, as long as it is non-deterministic. That last condition is new. For finite automata
non-determinism added no power; here it does.

## The Machine

### A finite control and a stack

A pushdown automaton has three parts: an input read once from left to right, a finite control
as in an NFA, and a stack of unbounded height. At each move it looks at its state, the top of the
stack, and possibly the next input symbol. Then it changes state and replaces the top of the
stack by a string.

:::definition[Non-deterministic pushdown automaton]
A **non-deterministic pushdown automaton** (NPDA) is a tuple $M = (Q, \Sigma, \Gamma, \delta, q_0, z, F)$
where
- $Q$ is a finite set of states, with initial state $q_0$ and final states $F \subseteq Q$;
- $\Sigma$ is the input alphabet and $\Gamma$ the stack alphabet;
- $z \in \Gamma$ is the stack start symbol, the only symbol on the stack at the beginning;
- $\delta : Q \times (\Sigma \cup \{\lambda\}) \times \Gamma \to$ finite subsets of $Q \times \Gamma^*$ is the transition function.
:::

An entry $(p, x) \in \delta(q, a, b)$ means: in state $q$, read $a$ from the input (or nothing, if
$a = \lambda$), **pop** the top symbol $b$, **push** the string $x$, and go to state $p$. The leftmost
symbol of $x$ ends up on top. In a diagram this move is an edge from $q$ to $p$ labelled
$a, b \to x$.

Every move pops exactly one symbol, and the four effects on the stack all come from the choice of $x$:

| Label | Effect | Stack before | Stack after |
|---|---|---|---|
| $a, b \to cb$ | push $c$ | $bu$ | $cbu$ |
| $a, b \to c$ | replace $b$ by $c$ | $bu$ | $cu$ |
| $a, b \to \lambda$ | pop $b$ | $bu$ | $u$ |
| $a, b \to b$ | leave the stack alone | $bu$ | $bu$ |

:::caution[Every move pops, and an empty stack stops the machine]
There is no move on an empty stack, because $\delta$ needs a top symbol. And there is no move that
"pops nothing": some diagrams write $a, \lambda \to c$ for "push $c$ whatever is on top", but that is
a shorthand for one move $a, x \to cx$ for each $x \in \Gamma$. In a proof or a transition table, use
the full form.
:::

### Configurations and acceptance

:::definition[Instantaneous description]
An **instantaneous description** of an NPDA is a triple $(q, w, u)$: the state $q$, the unread part $w$
of the input, and the stack $u$ with its top on the left. One move is written
$$(q, aw, bu) \vdash (p, w, xu) \qquad\text{when } (p, x) \in \delta(q, a, b),$$
and $\vdash^*$ means any number of moves.
:::

:::definition[Language of an NPDA]
The language **accepted by final state** by $M$ is
$$L(M) = \{w \in \Sigma^* : (q_0, w, z) \vdash^* (p, \lambda, u),\ p \in F\}.$$
:::

Two conditions must hold at the same time: the input is used up, and the state is final. The stack
contents $u$ can be anything. As for an NFA, $w$ is accepted if **some** computation does this; a computation that
gets stuck, or finishes in a non-final state, says nothing. So $w$ is rejected only when **every**
computation fails.

:::remark
Acceptance can also be defined by **empty stack**: the input is used up and the stack is empty, whatever
the state. Each kind of machine can be converted to the other, so both define the same class of
languages. The conversion to a grammar below uses a machine that does both at once.
:::

### The first machine

:::machine[M₁: $\{a^n b^n : n \ge 0\}$]
$M_1 = (Q,\ \{a, b\},\ \{a, z\},\ \delta,\ q_0,\ z,\ F)$ with $Q = \{q_0, q_1, q_2, q_3\}$, $F = \{q_0, q_3\}$ and

| From | Read | Pop | To | Push |
|---|---|---|---|---|
| $q_0$ | $a$ | $z$ | $q_1$ | $az$ |
| $q_1$ | $a$ | $a$ | $q_1$ | $aa$ |
| $q_1$ | $b$ | $a$ | $q_2$ | $\lambda$ |
| $q_2$ | $b$ | $a$ | $q_2$ | $\lambda$ |
| $q_2$ | $\lambda$ | $z$ | $q_3$ | $z$ |

```automaton
type: nfa
states: q0 60 120, q1 210 120, q2 360 120, q3 510 120
start: q0
finals: [q0, q3]
trans: "q0 a,z→az q1; q1 a,a→aa q1; q1 b,a→λ q2; q2 b,a→λ q2; q2 λ,z→z q3"
```

$q_1$ pushes one $a$ per $a$ read, and $q_2$ pops one per $b$. When $z$ shows again, the counts agree.
$q_0$ is final for the string $\lambda$.
:::

:::trace[M₁ on $aabb$]
$$
(q_0, aabb, z) \vdash (q_1, abb, az) \vdash (q_1, bb, aaz) \vdash (q_2, b, az) \vdash (q_2, \lambda, z) \vdash (q_3, \lambda, z) \qquad \textbf{accept}
$$
:::

:::trace[M₁ on $aab$]
$$
(q_0, aab, z) \vdash (q_1, ab, az) \vdash (q_1, b, aaz) \vdash (q_2, \lambda, az) \qquad \textbf{reject}
$$
:::

In the second run the input is finished in the non-final state $q_2$, and no move exists for $\lambda$
with $a$ on top. On $abb$ the machine reaches $(q_2, b, z)$ and then $(q_3, b, z)$: it is final, but the
input is not used up, and there is no move left.

```sim
id: pda-stack-aabb
custom: true
engine: ds
mode: stack
data: [z]
capacity: 4
ops: ["push a", "push a", "pop", "pop"]
note: "The stack of M₁ during its run on aabb, starting from the stack start symbol z. Each a pushes, each b pops, and z shows again at the end, which is when M₁ moves to its final state."
```

:::insight
The stack is unbounded memory with a restriction: only the top can be seen, and whatever is below
comes back only after the top is removed. That makes it perfect for matching things in reverse order
(the last thing opened is the first thing closed) and useless for comparing things in the same order.
:::

:::equations
- *NPDA*: $M = (Q, \Sigma, \Gamma, \delta, q_0, z, F)$ with $\delta : Q \times (\Sigma \cup \{\lambda\}) \times \Gamma \to$ finite subsets of $Q \times \Gamma^*$.
- *One move*: $(q, aw, bu) \vdash (p, w, xu)$ when $(p, x) \in \delta(q, a, b)$.
- *Acceptance by final state*: $(q_0, w, z) \vdash^* (p, \lambda, u)$ with $p \in F$.
:::

## Designing an NPDA

### What the stack holds

As a DFA's states record what must be remembered, a PDA's stack records what must be matched later.

:::steps[Designing a pushdown automaton]
1. Say what the stack holds at each moment: unmatched $a$'s, the first half of the string, the surplus of one letter.
2. Give one state per **phase** of the string (reading $a$'s, reading $b$'s, finished).
3. Write the push moves of the first phase and the pop moves of the second.
4. Use $z$ on top as the test for "everything is matched", with a move such as $\lambda, z \to z$ into a final state.
5. Where the phase change cannot be seen in the input, let the machine **guess** with a $\lambda$-move.
6. Trace a string in $L$, a string that is one symbol short, and $\lambda$.
:::

### A marked middle

:::machine[M₂: $\{wcw^R : w \in \{a, b\}^*\}$]
Let $x$ stand for any symbol of $\Gamma = \{a, b, z\}$, so each line with $x$ is three moves.

| From | Read | Pop | To | Push |
|---|---|---|---|---|
| $q_0$ | $a$ | $x$ | $q_0$ | $ax$ |
| $q_0$ | $b$ | $x$ | $q_0$ | $bx$ |
| $q_0$ | $c$ | $x$ | $q_1$ | $x$ |
| $q_1$ | $a$ | $a$ | $q_1$ | $\lambda$ |
| $q_1$ | $b$ | $b$ | $q_1$ | $\lambda$ |
| $q_1$ | $\lambda$ | $z$ | $q_2$ | $z$ |

```automaton
type: nfa
states: q0 70 120, q1 240 120, q2 410 120
start: q0
finals: [q2]
trans: "q0 a,x→ax|b,x→bx q0; q0 c,x→x q1; q1 a,a→λ|b,b→λ q1; q1 λ,z→z q2"
```
:::

:::trace[M₂ on $abcba$]
$$
(q_0, abcba, z) \vdash (q_0, bcba, az) \vdash (q_0, cba, baz) \vdash (q_1, ba, baz) \vdash (q_1, a, az) \vdash (q_1, \lambda, z) \vdash (q_2, \lambda, z) \qquad \textbf{accept}
$$
:::

The stack holds the first half with its last letter on top, which is the order in which the second
half must arrive. There is exactly one move to take at every point, so no guessing is needed.

### Guessing the middle

Without the marker $c$, the machine cannot see where the middle is. It guesses: replace the $c$ move
by a $\lambda$-move.

:::machine[M₃: $\{ww^R : w \in \{a, b\}^*\}$]
Change one line of M₂: $q_0, \lambda, x \to q_1, x$ takes the place of $q_0, c, x \to q_1, x$.

```automaton
type: nfa
states: q0 70 120, q1 240 120, q2 410 120
start: q0
finals: [q2]
trans: "q0 a,x→ax|b,x→bx q0; q0 λ,x→x q1; q1 a,a→λ|b,b→λ q1; q1 λ,z→z q2"
```
:::

At each point of the first half, the machine can go on pushing or switch to popping. One input has
many computations, and one good one is enough.

::::example[All the guesses on $abba$]
List the computations of M₃ on $abba$ according to where the machine switches to $q_1$.

:::solution
| Switch after | Configuration after the switch | What happens |
|---|---|---|
| $\lambda$ | $(q_1, abba, z)$ | only $\lambda, z \to z$ fits; stuck in $q_2$ with input left |
| $a$ | $(q_1, bba, az)$ | $b$ against top $a$: stuck |
| $ab$ | $(q_1, ba, baz)$ | matches $b$, matches $a$, reaches $q_2$: **accept** |
| $abb$ | $(q_1, a, bbaz)$ | $a$ against top $b$: stuck |
| $abba$ | $(q_1, \lambda, abbaz)$ | input used, but $q_1$ is not final and no move fits |

One accepting computation is enough:
$$(q_0, abba, z) \vdash (q_0, bba, az) \vdash (q_0, ba, baz) \vdash (q_1, ba, baz) \vdash (q_1, a, az) \vdash (q_1, \lambda, z) \vdash (q_2, \lambda, z).$$
On $abab$ all the guesses get stuck, so it is rejected.
:::
::::

### Counting a surplus

The stack need not hold the input. For equal numbers of $a$'s and $b$'s, it holds the surplus so far:
only $a$'s or only $b$'s, never a mix.

:::machine[M₄: $\{w \in \{a, b\}^* : n_a(w) = n_b(w)\}$]
| From | Read | Pop | To | Push | Meaning |
|---|---|---|---|---|---|
| $q_0$ | $a$ | $z$ | $q_0$ | $az$ | a surplus of $a$ starts |
| $q_0$ | $b$ | $z$ | $q_0$ | $bz$ | a surplus of $b$ starts |
| $q_0$ | $a$ | $a$ | $q_0$ | $aa$ | the surplus grows |
| $q_0$ | $b$ | $b$ | $q_0$ | $bb$ | the surplus grows |
| $q_0$ | $a$ | $b$ | $q_0$ | $\lambda$ | cancels one $b$ |
| $q_0$ | $b$ | $a$ | $q_0$ | $\lambda$ | cancels one $a$ |
| $q_0$ | $\lambda$ | $z$ | $q_1$ | $z$ | nothing left over |

```automaton
type: nfa
states: q0 170 120, q1 340 120
start: q0
finals: [q1]
trans: "q0 a,z→az|b,z→bz|a,a→aa|b,b→bb|a,b→λ|b,a→λ q0; q0 λ,z→z q1"
```
:::

:::trace[M₄ on $abba$]
$$
(q_0, abba, z) \vdash (q_0, bba, az) \vdash (q_0, ba, z) \vdash (q_0, a, bz) \vdash (q_0, \lambda, z) \vdash (q_1, \lambda, z) \qquad \textbf{accept}
$$
:::

::::exercise[Two $b$'s for each $a$]
Give a PDA for $\{a^n b^{2n} : n \ge 0\}$ with no choice at any point.

:::solution
Push two symbols for each $a$, and pop one for each $b$:

| From | Read | Pop | To | Push |
|---|---|---|---|---|
| $q_0$ | $a$ | $z$ | $q_1$ | $aaz$ |
| $q_1$ | $a$ | $a$ | $q_1$ | $aaa$ |
| $q_1$ | $b$ | $a$ | $q_2$ | $\lambda$ |
| $q_2$ | $b$ | $a$ | $q_2$ | $\lambda$ |
| $q_2$ | $\lambda$ | $z$ | $q_3$ | $z$ |

with final states $q_0$ and $q_3$. For example
$(q_0, abb, z) \vdash (q_1, bb, aaz) \vdash (q_2, b, az) \vdash (q_2, \lambda, z) \vdash (q_3, \lambda, z)$.
:::
::::

::::exercise[Between one and two]
Give an NPDA for $\{a^n b^m : n \le m \le 2n\}$.

:::solution
Each $a$ can be worth one or two $b$'s, so let the machine guess at each $a$. Two moves share the same
read and pop, which is where the non-determinism is:

| From | Read | Pop | To | Push |
|---|---|---|---|---|
| $q_0$ | $a$ | $z$ | $q_0$ | $az$ or $aaz$ |
| $q_0$ | $a$ | $a$ | $q_0$ | $aa$ or $aaa$ |
| $q_0$ | $b$ | $a$ | $q_1$ | $\lambda$ |
| $q_1$ | $b$ | $a$ | $q_1$ | $\lambda$ |
| $q_0$ | $\lambda$ | $z$ | $q_2$ | $z$ |
| $q_1$ | $\lambda$ | $z$ | $q_2$ | $z$ |

with final state $q_2$. After $n$ $a$'s the stack can hold any number of $a$'s from $n$ to $2n$, and the
$b$'s must use them up exactly.
:::
::::

::::exercise[Guessing which condition]
Describe an NPDA for $\{a^i b^j c^k : i = j \text{ or } j = k\}$.

:::solution
The first move is a guess between two machines, by $\lambda$-moves from the start state. **Branch 1**
checks $i = j$: push the $a$'s, pop them on the $b$'s, then read any number of $c$'s with $z$ on top.
**Branch 2** checks $j = k$: read the $a$'s without touching the stack, push the $b$'s, pop them on
the $c$'s. Each branch has its own states and its own final state. This is the general way to take a
union of two NPDAs, and nothing like it works for a deterministic machine.
:::
::::

:::insight
Design in three layers: the stack says what is owed, the states say which phase the string is in,
and a $\lambda$-move stands for any decision that the input does not announce. A question to ask of any
machine with a guess: if the guess is wrong, is the run sure to fail?
:::

:::equations
- *Stack contents*: $a^n b^n$: the $a$'s still unmatched; $wcw^R$, $ww^R$: the first half; $n_a = n_b$: the surplus.
- *Guess the middle*: replace the marker move $c, x \to x$ by $\lambda, x \to x$.
:::

## NPDAs and Context-Free Grammars

### The theorem

:::theorem[NPDAs accept exactly the context-free languages]
A language is context-free if and only if some NPDA accepts it.
:::

Both directions are constructions, and both can be asked for by hand.

### From a grammar to an NPDA

The machine carries out a leftmost derivation on its stack. The input read so far, followed by the
stack, is always a sentential form. A variable on top is replaced by a right-hand side, a guess; a
terminal on top must match the next input symbol.

:::algorithm[CFG to NPDA]
**Input:** a context-free grammar $G = (V, T, S, P)$.\
**Output:** an NPDA $M$ with $L(M) = L(G)$, three states $q_0, q_1, q_2$, and final state $q_2$.

1. Start: $\delta(q_0, \lambda, z) = \{(q_1, Sz)\}$.
2. For each production $A \to x$: add $(q_1, x)$ to $\delta(q_1, \lambda, A)$.
3. For each terminal $a$: add $(q_1, \lambda)$ to $\delta(q_1, a, a)$.
4. Finish: $\delta(q_1, \lambda, z) = \{(q_2, z)\}$.
:::

::::example[From a grammar to an NPDA]
Build the NPDA for $S \to aSc \mid B$, $\;B \to bB \mid \lambda$, and run it on $abc$.

:::solution
| From | Read | Pop | To | Push | Source |
|---|---|---|---|---|---|
| $q_0$ | $\lambda$ | $z$ | $q_1$ | $Sz$ | start |
| $q_1$ | $\lambda$ | $S$ | $q_1$ | $aSc$ | $S \to aSc$ |
| $q_1$ | $\lambda$ | $S$ | $q_1$ | $B$ | $S \to B$ |
| $q_1$ | $\lambda$ | $B$ | $q_1$ | $bB$ | $B \to bB$ |
| $q_1$ | $\lambda$ | $B$ | $q_1$ | $\lambda$ | $B \to \lambda$ |
| $q_1$ | $a$ | $a$ | $q_1$ | $\lambda$ | match |
| $q_1$ | $b$ | $b$ | $q_1$ | $\lambda$ | match |
| $q_1$ | $c$ | $c$ | $q_1$ | $\lambda$ | match |
| $q_1$ | $\lambda$ | $z$ | $q_2$ | $z$ | finish |

```automaton
type: nfa
states: q0 70 120, q1 260 120, q2 450 120
start: q0
finals: [q2]
trans: "q0 λ,z→Sz q1; q1 λ,S→aSc|λ,S→B|λ,B→bB|λ,B→λ|a,a→λ|b,b→λ|c,c→λ q1; q1 λ,z→z q2"
```

The leftmost derivation $S \Rightarrow aSc \Rightarrow aBc \Rightarrow abBc \Rightarrow abc$ becomes this
computation. Read the consumed input and the stack together, and the sentential forms appear:

$$(q_0, abc, z) \vdash (q_1, abc, Sz) \vdash (q_1, abc, aScz) \vdash (q_1, bc, Scz) \vdash (q_1, bc, Bcz) \vdash (q_1, bc, bBcz) \vdash (q_1, c, Bcz) \vdash (q_1, c, cz) \vdash (q_1, \lambda, z) \vdash (q_2, \lambda, z)$$
:::
::::

:::remark
If the grammar is in Greibach normal form the machine is even shorter. A rule $A \to ax$ becomes the
single move $(q_1, x) \in \delta(q_1, a, A)$: read $a$ and replace $A$ at the same time. No terminal is
ever pushed, and each move after the first reads one input symbol.
:::

### From an NPDA to a grammar

The other direction is harder, because a stack symbol's life spans many moves. The idea: let one
variable stand for a whole **episode** in which one stack symbol is removed.

First the machine is put in a special form.

:::steps[Preparing an NPDA for conversion]
1. Make the stack never empty before the end: a new bottom symbol goes under $z$, and is removed only at the end.
2. Make one final state $q_f$, entered only with an empty stack: from each old final state, a $\lambda$-move goes to a state that pops everything, and then to $q_f$.
3. Make every move push either nothing or two symbols. A move that replaces $A$ by one symbol $B$ becomes two moves through a new state, one pushing $CB$ for a new symbol $C$ and one popping $C$. A longer string goes through a chain of new states.
:::

:::algorithm[NPDA to CFG]
**Input:** an NPDA in the special form, with final state $q_f$.\
**Output:** a grammar $G$ with $L(G) = L(M)$.

1. Take as variables all the triples $(q_i A q_j)$. Its meaning: $M$ can go from state $q_i$ to state $q_j$ while reading some string, with the net effect of removing $A$ from the stack.
2. The start variable is $(q_0 z q_f)$.
3. For each move $(q_j, \lambda) \in \delta(q_i, a, A)$, add $(q_i A q_j) \to a$.
4. For each move $(q_j, BC) \in \delta(q_i, a, A)$ and **all** states $q_k, q_l$, add $(q_i A q_k) \to a\,(q_j B q_l)(q_l C q_k)$.
:::

Here $a$ may be $\lambda$. Step 4 is the heart of it. To get rid of $A$, the machine reads $a$ and replaces
$A$ by $BC$. It must then get rid of $B$, which ends in some state $q_l$, and then get rid of $C$
starting from $q_l$. Since $q_l$ and $q_k$ are not known, every combination is written down, and most of
them turn out to be useless.

::::example[From an NPDA to a grammar]
Convert this NPDA for $\{a^n b^n : n \ge 1\}$. It is in the special form: $q_2$ is its one final state,
the stack is empty exactly when it gets there, and each move pushes two symbols or none.

| From | Read | Pop | To | Push |
|---|---|---|---|---|
| $q_0$ | $a$ | $z$ | $q_0$ | $Az$ |
| $q_0$ | $a$ | $A$ | $q_0$ | $AA$ |
| $q_0$ | $b$ | $A$ | $q_1$ | $\lambda$ |
| $q_1$ | $b$ | $A$ | $q_1$ | $\lambda$ |
| $q_1$ | $\lambda$ | $z$ | $q_2$ | $\lambda$ |

:::solution
**Pop moves** (step 3) give three rules:
$$(q_0 A q_1) \to b, \qquad (q_1 A q_1) \to b, \qquad (q_1 z q_2) \to \lambda .$$
**Push moves** (step 4) give nine rules each, one for every pair $q_k, q_l$, for 21 rules in all. For
the first push move:
$$(q_0 z q_k) \to a\,(q_0 A q_l)(q_l z q_k) \quad\text{for all } q_k, q_l .$$
Now remove the useless variables. The only generating triples are those with a rule that ends: the
three above, and what can be built on them. What survives is
$$(q_0 z q_2) \to a\,(q_0 A q_1)(q_1 z q_2),$$
$$(q_0 A q_1) \to a\,(q_0 A q_1)(q_1 A q_1) \mid b,$$
$$(q_1 A q_1) \to b, \qquad (q_1 z q_2) \to \lambda .$$
Rename $S = (q_0 z q_2)$, $X = (q_0 A q_1)$, $Y = (q_1 A q_1)$, $Z = (q_1 z q_2)$:
$$S \to aXZ, \quad X \to aXY \mid b, \quad Y \to b, \quad Z \to \lambda .$$
This generates $a \cdot a^k b \, b^k$, which is $\{a^n b^n : n \ge 1\}$. The derivation of $aabb$ follows
the run of the machine, with the stack read as the string of variables:
$$S \Rightarrow aXZ \Rightarrow aaXYZ \Rightarrow aabYZ \Rightarrow aabbZ \Rightarrow aabb$$
$$(q_0, aabb, z) \vdash (q_0, abb, Az) \vdash (q_0, bb, AAz) \vdash (q_1, b, Az) \vdash (q_1, \lambda, z) \vdash (q_2, \lambda, \lambda)$$
:::
::::

:::caution[Check the moves before writing triples]
Step 3 applies only to moves that push nothing, and step 4 only to moves that push exactly two
symbols. A move such as $(q_1, A) \in \delta(q_0, a, A)$ must first be rewritten. And in step 4 the middle
state $q_l$ runs over **all** states, even if the answer looks obvious: leaving some out can lose
strings, and the extra rules are cleaned up afterwards anyway.
:::

:::insight
Both constructions rest on one reading of the stack. Going from a grammar to a machine, the stack is
the part of a sentential form that is still to be expanded. Going from a machine to a grammar, each
triple is a promise: "from this state, this symbol will be gone by that state". Both directions say
that a stack is the same thing as nested, independent sub-tasks, and that is what a context-free
grammar describes.
:::

:::equations
- *CFG to NPDA*: $\delta(q_0, \lambda, z) = \{(q_1, Sz)\}$; $A \to x$ gives $(q_1, x) \in \delta(q_1, \lambda, A)$; $(q_1, \lambda) \in \delta(q_1, a, a)$; $\delta(q_1, \lambda, z) = \{(q_2, z)\}$.
- *NPDA to CFG, pop*: $(q_j, \lambda) \in \delta(q_i, a, A)$ gives $(q_i A q_j) \to a$.
- *NPDA to CFG, push*: $(q_j, BC) \in \delta(q_i, a, A)$ gives $(q_i A q_k) \to a\,(q_j B q_l)(q_l C q_k)$ for all $q_k, q_l$.
- *Start variable*: $(q_0 z q_f)$.
:::

```python
# An NPDA simulator: breadth-first search over configurations (state, position, stack). The stack
# is capped because a lambda-move can push forever; the cap is ample for short test strings.
from collections import deque

def accepts(moves, start, finals, w, z="z", cap=None):
    cap = cap or 2 * len(w) + 8
    seen, queue = set(), deque([(start, 0, z)])
    while queue:
        q, i, stack = queue.popleft()
        if (q, i, stack) in seen:
            continue
        seen.add((q, i, stack))
        if i == len(w) and q in finals:
            return True
        if not stack:
            continue                                   # no move on an empty stack
        for (p, a, top, r, push) in moves:
            if p == q and top == stack[0] and (a == "" or w[i:i + 1] == a):
                new = push + stack[1:]
                if len(new) <= cap:
                    queue.append((r, i + len(a), new))
    return False

X = "abz"
M3 = [("q0", s, x, "q0", s + x) for s in "ab" for x in X]
M3 += [("q0", "", x, "q1", x) for x in X]
M3 += [("q1", "a", "a", "q1", ""), ("q1", "b", "b", "q1", ""), ("q1", "", "z", "q2", "z")]
print([w for w in ["", "aa", "abba", "abab", "aba", "baab"] if accepts(M3, "q0", {"q2"}, w)])
```

```output
['', 'aa', 'abba', 'baab']
```

## Deterministic Pushdown Automata

### Definition

:::definition[Deterministic pushdown automaton]
A **deterministic pushdown automaton** (DPDA) is a PDA $M = (Q, \Sigma, \Gamma, \delta, q_0, z, F)$ such
that for all $q \in Q$, $a \in \Sigma \cup \{\lambda\}$ and $b \in \Gamma$:
1. $\delta(q, a, b)$ contains at most one element;
2. if $\delta(q, \lambda, b)$ is not empty, then $\delta(q, c, b)$ is empty for every $c \in \Sigma$.
:::

:::definition[Deterministic context-free language]
A language is **deterministic context-free** if some DPDA accepts it.
:::

The second condition is the one to watch: a $\lambda$-move is allowed, but it must not compete with a
reading move on the same state and stack top. A DPDA is unlike a DFA in two respects: it may have
$\lambda$-moves, and missing moves are allowed.

M₁ and M₂ are deterministic. M₃ is not: in $q_0$ the move $\lambda, a \to a$ competes with $a, a \to aa$.
M₄ as drawn is not either, since $\lambda, z \to z$ competes with $a, z \to az$, but its language is still
deterministic: a version that remembers in its state whether the stack is at $z$ needs no such move.

### Non-determinism adds power

Every DPDA is an NPDA, so every deterministic context-free language is context-free. For finite automata
the two classes of machines were equal. For pushdown automata they are not.

::::theorem[DPDAs are weaker than NPDAs]
$L = \{a^n b^n : n \ge 0\} \cup \{a^n b^{2n} : n \ge 0\}$ is context-free but not deterministic context-free.

:::proof
$L$ is context-free: $S \to X \mid Y$, $\;X \to aXb \mid \lambda$, $\;Y \to aYbb \mid \lambda$.

Suppose a DPDA $M$ accepts $L$. Because $M$ is deterministic, on input $a^n b^{2n}$ it first runs exactly as
on $a^n b^n$, reaches a final state, and then continues to another final state while reading $n$ more $b$'s.

Build an NPDA from two copies of $M$. In the second copy, change every move that reads $b$ into a move that
reads $c$, and keep the final states only there. Add a $\lambda$-move from each final state of the first
copy to the matching state of the second copy.

On $a^n b^n c^n$ with $n \ge 1$, the new machine follows $M$ up to the final state reached after $a^n b^n$, jumps,
and reads $c^n$ as $M$ would have read $b^n$. So it accepts. Conversely, if it accepts $a^i b^j c^k$ with
$k \ge 1$, then $a^i b^j$ and $a^i b^{j + k}$ are both in $L$, and that forces $j = i$ and $k = i$.

So the intersection of the new machine's language with the regular language $L(a^*b^*c^+)$ is
$\{a^n b^n c^n : n \ge 1\}$. A context-free language intersected with a regular language is context-free, and
$\{a^n b^n c^n : n \ge 1\}$ is not, as the next unit proves. This is a contradiction.
:::
::::

The language $\{ww^R\}$ is also context-free and not deterministic, for the same reason as the guess in
M₃: a deterministic machine cannot know where the middle is.

### Why determinism still matters

:::remark
Deterministic context-free languages are the ones parsed in practice. A DPDA runs in time proportional to
the input, every deterministic context-free language has an unambiguous grammar, and the LL and LR
grammars used by parser generators describe subclasses of these languages. Programming languages are designed
to be deterministic so that compilers can parse them in one pass.
:::

| Machine | Non-determinism adds power? | Why |
|---|---|---|
| finite automaton | no | a set of states is still a finite thing to track |
| pushdown automaton | **yes** | a set of stacks cannot be kept on one stack |
| Turing machine | no | a tape can hold a list of all the computations (a later unit) |

:::caution[Regular $\subsetneq$ deterministic context-free $\subsetneq$ context-free]
Both inclusions are proper: $a^n b^n$ separates the first pair, and $ww^R$ the second. A multiple-choice
statement such as "every context-free language is accepted by a DPDA" is false, though "every regular
language is accepted by a DPDA" is true: use the DFA and leave the stack alone.
:::

:::insight
The subset construction works because the set of states an NFA could be in is itself a state of a finite
machine. For an NPDA, the set of possible situations includes a set of possible stacks, and one stack
cannot hold that. So determinism, which was free for finite automata, costs real power here.
:::

:::equations
- *DPDA*: $|\delta(q, a, b)| \le 1$, and $\delta(q, \lambda, b) \ne \varnothing \Rightarrow \delta(q, c, b) = \varnothing$ for all $c \in \Sigma$.
- *Hierarchy*: regular $\subsetneq$ deterministic context-free $\subsetneq$ context-free.
- *Not deterministic*: $\{ww^R\}$, $\{a^n b^n\} \cup \{a^n b^{2n}\}$.
:::
