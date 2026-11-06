---
title: Turing machines
order: 11
status: detailed
weeks: [11, 12]
introduces: [turing-machine, church-turing-thesis]
requires:
  - {concept: dfa, strength: hard}
  - {concept: pushdown-automaton, strength: soft}
  - {concept: function, strength: soft}
reinforces: []
---

Three machines so far, and each one was limited by its memory: a finite automaton has only its states,
and a pushdown automaton can only look at the top of a stack. Yet $\{a^n b^n c^n\}$ has an obvious
algorithm: cross off one $a$, one $b$ and one $c$, and repeat. What that algorithm uses is a memory it can
walk around in, reading and overwriting. A **Turing machine** is a finite control with exactly such a
memory, an unbounded tape. It looks barely stronger than a PDA, and yet nobody has found a computation it
cannot carry out.

## The Standard Turing Machine

### A tape instead of a stack

A Turing machine has a tape of cells, unbounded in both directions, and a read-write head on one cell.
At the start the tape holds the input, every other cell holds the blank $\square$, and the head is on the
first input symbol. At each move the machine reads the cell under the head, writes a symbol there,
moves one cell left or right, and changes state.

:::definition[Turing machine]
A **Turing machine** is a tuple $M = (Q, \Sigma, \Gamma, \delta, q_0, \square, F)$ where
- $Q$ is a finite set of states, with initial state $q_0$ and final states $F \subseteq Q$;
- $\Gamma$ is the tape alphabet, $\square \in \Gamma$ is the blank, and $\Sigma \subseteq \Gamma - \{\square\}$ is the input alphabet;
- $\delta : Q \times \Gamma \to Q \times \Gamma \times \{L, R\}$ is a **partial** function, the transition function.
:::

An entry $\delta(q, a) = (p, b, R)$ means: in state $q$ reading $a$, write $b$, move right, go to $p$. In a
diagram the edge from $q$ to $p$ is labelled $a \to b, R$.

Three features separate this from the earlier machines:

- There is no separate input. The tape holds the input, the working memory and in the end the output.
- The machine is **deterministic**: at most one move for each state and symbol.
- The machine **halts** when no move is defined. No move is defined for a final state, so reaching one stops the machine.

:::definition[Instantaneous description of a Turing machine]
An **instantaneous description** is a string $x_1\, q\, x_2$: the tape from the leftmost to the rightmost
non-blank cell is $x_1 x_2$ (extended with blanks as far as the head needs), the state is $q$, and the head
is on the first symbol of $x_2$. One move is written $\vdash$, and $\vdash^*$ means any number of moves.
:::

:::machine[T₁: swap every letter]
$T_1 = (\{q_0, q_1\},\ \{a, b\},\ \{a, b, \square\},\ \delta,\ q_0,\ \square,\ \{q_1\})$ with

| $\delta$ | $a$ | $b$ | $\square$ |
|---|---|---|---|
| $\to q_0$ | $q_0, b, R$ | $q_0, a, R$ | $q_1, \square, L$ |
| $*\,q_1$ | | | |

```automaton
type: nfa
states: q0 90 120, q1 280 120
start: q0
finals: [q1]
trans: "q0 a→b,R|b→a,R q0; q0 □→□,L q1"
```
:::

:::trace[T₁ on $ab$]
$$
q_0\,ab \vdash b\,q_0\,b \vdash ba\,q_0\,\square \vdash b\,q_1\,a \qquad \textbf{halt in } q_1
$$
:::

### Three outcomes

A finite automaton reads its input and stops. A Turing machine can go back, so it may never stop. On a given
input there are three possible outcomes:

| Outcome | Meaning |
|---|---|
| halts in a final state | the input is **accepted** |
| halts in a non-final state | no move is left: the input is **rejected** |
| never halts | the machine **loops**: it gives no answer at all |

:::machine[T₂: a machine that can loop]
| $\delta$ | $a$ | $b$ | $\square$ |
|---|---|---|---|
| $\to q_0$ | $q_1, a, R$ | $q_1, b, R$ | |
| $q_1$ | $q_0, a, L$ | $q_0, b, L$ | $q_2, \square, L$ |
| $*\,q_2$ | | | |

```automaton
type: nfa
states: q0 70 120, q1 260 120, q2 450 120
start: q0
finals: [q2]
trans: "q0 a→a,R|b→b,R q1; q1 a→a,L|b→b,L q0; q1 □→□,L q2"
```
:::

On $a$ the machine halts in $q_2$. On $\lambda$ it halts at once in $q_0$, and rejects. On any input of
two or more letters it walks one cell right and one cell left forever:

:::trace[T₂ on $ab$]
$$
q_0\,ab \vdash a\,q_1\,b \vdash q_0\,ab \vdash a\,q_1\,b \vdash \cdots \qquad \textbf{loops}
$$
:::

:::caution[Looping is not rejecting]
A machine that loops on $w$ does not accept $w$, but it does not say so either: at no moment can an
observer tell whether it will halt later. This difference between "says no" and "never answers" did not
exist before this unit, and the whole of the next unit is about it.
:::

:::insight
The tape removes the limits of the stack and the input at once: the machine can reread, overwrite and
walk over its memory. Everything else in its definition is more modest than a PDA: it is deterministic,
it has one move per state and symbol, and each move changes a single cell.
:::

:::equations
- *Turing machine*: $M = (Q, \Sigma, \Gamma, \delta, q_0, \square, F)$ with partial $\delta : Q \times \Gamma \to Q \times \Gamma \times \{L, R\}$.
- *One move right*: $x\,q\,ay \vdash xb\,p\,y$ when $\delta(q, a) = (p, b, R)$.
- *One move left*: $xc\,q\,ay \vdash x\,p\,cby$ when $\delta(q, a) = (p, b, L)$.
:::

## Turing Machines as Language Accepters

### Acceptance

:::definition[Language accepted by a Turing machine]
The language accepted by $M$ is
$$L(M) = \{w \in \Sigma^* : q_0 w \vdash^* x_1\, q_f\, x_2,\ q_f \in F\}.$$
:::

Nothing is said about the strings that are not accepted: on those, $M$ may halt in a non-final state, or
loop. And $w$ does not need to be read in full. As soon as the machine halts in a final state, it accepts.

:::remark
Some definitions take $w \in \Sigma^+$, because an empty input leaves the head on a blank tape. Only the
string $\lambda$ is affected, and a machine can test for it in its first move, so the class of languages
does not change.
:::

### Every regular language

A DFA is a Turing machine that only moves right and never changes the tape. A move on the blank to a new
final state marks the end of the input.

:::machine[T₃: strings of $a$'s of even length]
| $\delta$ | $a$ | $\square$ |
|---|---|---|
| $\to q_0$ | $q_1, a, R$ | $q_2, \square, L$ |
| $q_1$ | $q_0, a, R$ | |
| $*\,q_2$ | | |

```automaton
type: nfa
states: q0 70 120, q1 260 120, q2 70 250
start: q0
finals: [q2]
trans: "q0 a→a,R q1; q1 a→a,R q0; q0 □→□,L q2"
```
:::

:::trace[T₃ on $aa$ and on $aaa$]
$$
q_0\,aa \vdash a\,q_1\,a \vdash aa\,q_0\,\square \vdash a\,q_2\,a \qquad \textbf{accept}
$$

$$
q_0\,aaa \vdash a\,q_1\,aa \vdash aa\,q_0\,a \vdash aaa\,q_1\,\square \qquad \textbf{reject}
$$
:::

### Marking symbols

The standard technique on a tape is to overwrite a symbol with a marker once it has been dealt with. Here is
the algorithm from the introduction.

:::machine[T₄: $\{a^n b^n c^n : n \ge 1\}$]
The markers $x$, $y$, $z$ stand for a crossed-off $a$, $b$, $c$.

| $\delta$ | $a$ | $b$ | $c$ | $x$ | $y$ | $z$ | $\square$ |
|---|---|---|---|---|---|---|---|
| $\to q_0$ | $q_1, x, R$ | | | | $q_4, y, R$ | | |
| $q_1$ | $q_1, a, R$ | $q_2, y, R$ | | | $q_1, y, R$ | | |
| $q_2$ | | $q_2, b, R$ | $q_3, z, L$ | | | $q_2, z, R$ | |
| $q_3$ | $q_3, a, L$ | $q_3, b, L$ | | $q_0, x, R$ | $q_3, y, L$ | $q_3, z, L$ | |
| $q_4$ | | | | | $q_4, y, R$ | $q_4, z, R$ | $q_5, \square, L$ |
| $*\,q_5$ | | | | | | | |

```automaton
type: nfa
states: q0 70 130, q1 270 130, q2 470 130, q3 270 300, q4 70 300, q5 70 440
start: q0
finals: [q5]
trans: "q0 a→x,R q1; q1 a→a,R|y→y,R q1; q1 b→y,R q2; q2 b→b,R|z→z,R q2; q2 c→z,L q3; q3 a→a,L|b→b,L|y→y,L|z→z,L q3; q3 x→x,R q0; q0 y→y,R q4; q4 y→y,R|z→z,R q4; q4 □→□,L q5"
```

Each state has one job:

- $q_0$: at the leftmost symbol not yet crossed off. An $a$ starts a new round; a $y$ means no $a$ is left.
- $q_1$: an $a$ has just been crossed off; go right to the first $b$ and cross it off.
- $q_2$: go right to the first $c$ and cross it off.
- $q_3$: go back to the rightmost $x$.
- $q_4$: no $a$ is left; check that only $y$'s and $z$'s remain, up to the blank.
:::

:::trace[T₄ on $abc$]
$$
q_0\,abc \vdash x\,q_1\,bc \vdash xy\,q_2\,c \vdash x\,q_3\,yz \vdash q_3\,xyz \vdash x\,q_0\,yz \vdash xy\,q_4\,z \vdash xyz\,q_4\,\square \vdash xy\,q_5\,z \qquad \textbf{accept}
$$
:::

:::trace[T₄ on $aabc$]
$$
q_0\,aabc \vdash x\,q_1\,abc \vdash xa\,q_1\,bc \vdash xay\,q_2\,c \vdash xa\,q_3\,yz \vdash x\,q_3\,ayz \vdash q_3\,xayz \vdash x\,q_0\,ayz \vdash xx\,q_1\,yz \vdash xxy\,q_1\,z \qquad \textbf{reject}
$$
:::

In the second run an $a$ has no $b$ left to pair with: $q_1$ reads $z$, no move is defined, and the machine
halts in a non-final state. Every wrong shape ends this way, because a missing move is a rejection.

:::steps[Designing a Turing machine]
1. Write the algorithm in words first: what is marked, and in what order.
2. Give one state per **task**: find the next unmarked symbol, go back, check the rest.
3. Write the moves of each task. A symbol that is passed over is written back unchanged.
4. Decide when the loop ends, and what must be true of the tape then.
5. Leave the wrong cases undefined: a missing move rejects.
6. Trace a string in $L$ and strings that are one symbol short and one symbol long.
:::

::::exercise[A language that needs a copy]
Design a Turing machine for $\{wcw : w \in \{a, b\}^*\}$, which is not context-free. Trace $acb$.

:::solution
Cross off the first letter of the left part, remembering it in the **state**, go past $c$ to the first
letter not crossed off on the right, and compare. $x$ marks a done letter on the left, $y$ on the right.

| $\delta$ | $a$ | $b$ | $c$ | $x$ | $y$ | $\square$ |
|---|---|---|---|---|---|---|
| $\to q_0$ | $q_1, x, R$ | $q_2, x, R$ | $q_6, c, R$ | | | |
| $q_1$ | $q_1, a, R$ | $q_1, b, R$ | $q_3, c, R$ | | | |
| $q_2$ | $q_2, a, R$ | $q_2, b, R$ | $q_4, c, R$ | | | |
| $q_3$ | $q_5, y, L$ | | | | $q_3, y, R$ | |
| $q_4$ | | $q_5, y, L$ | | | $q_4, y, R$ | |
| $q_5$ | $q_5, a, L$ | $q_5, b, L$ | $q_5, c, L$ | $q_0, x, R$ | $q_5, y, L$ | |
| $q_6$ | | | | | $q_6, y, R$ | $q_7, \square, L$ |
| $*\,q_7$ | | | | | | |

$q_1$ and $q_3$ remember an $a$, $q_2$ and $q_4$ remember a $b$. This is the finite control's memory at work: the
tape holds the string, the state holds one letter of it.

$$q_0\,acb \vdash x\,q_1\,cb \vdash xc\,q_3\,b \qquad \textbf{reject}$$

The machine remembers $a$, finds $b$, and no move is defined.
:::
::::

:::insight
A Turing machine program is a set of small loops: sweep right to a target, change it, sweep back. The finite
control remembers a bounded amount, one letter or which phase is running, and everything that grows goes
on the tape. Marking replaces the stack's rule of "last in, first out" by free access, and that is what
lets it compare a block with a block in the same order.
:::

:::equations
- *Language of a TM*: $L(M) = \{w : q_0 w \vdash^* x_1\, q_f\, x_2,\ q_f \in F\}$.
- *TM outcomes*: halt in $F$ (accept), halt elsewhere (reject), or never halt (loop).
- *Regular as TM*: DFA moves, always right, tape unchanged, a blank move to a final state.
:::

## Turing Machines as Transducers

### Computing a function

A Turing machine can also compute: the output is what is on the tape when it halts.

:::definition[Turing-computable function]
A function $f$ with domain $D$ is **Turing-computable** if there is a Turing machine $M$ such that for
every $w \in D$,
$$q_0 w \vdash^* q_f\, f(w), \qquad q_f \in F .$$
:::

So the machine halts in a final state with $f(w)$ on the tape and the head on its first symbol. Numbers are
usually written in **unary**: the number $n$ is $1^n$, and a pair $(x, y)$ is $1^x 0 1^y$.

:::machine[T₅: the successor $n \mapsto n + 1$]
| $\delta$ | $1$ | $\square$ |
|---|---|---|
| $\to q_0$ | $q_0, 1, R$ | $q_1, 1, L$ |
| $q_1$ | $q_1, 1, L$ | $q_2, \square, R$ |
| $*\,q_2$ | | |

```automaton
type: nfa
states: q0 90 120, q1 280 120, q2 470 120
start: q0
finals: [q2]
trans: "q0 1→1,R q0; q0 □→1,L q1; q1 1→1,L q1; q1 □→□,R q2"
```
:::

:::trace[T₅ on $11$: 2 becomes 3]
$$
q_0\,11 \vdash 1\,q_0\,1 \vdash 11\,q_0\,\square \vdash 1\,q_1\,11 \vdash q_1\,111 \vdash q_1\,\square 111 \vdash q_2\,111
$$
:::

The last two moves are the usual way to end: walk left to the blank, then step back onto the first symbol.

### Addition

To compute $x + y$ from $1^x 0 1^y$: turn the $0$ into a $1$, which gives $x + y + 1$ ones, and erase the last one.

:::machine[T₆: the adder $(x, y) \mapsto x + y$]
| $\delta$ | $1$ | $0$ | $\square$ |
|---|---|---|---|
| $\to q_0$ | $q_0, 1, R$ | $q_1, 1, R$ | |
| $q_1$ | $q_1, 1, R$ | | $q_2, \square, L$ |
| $q_2$ | $q_3, \square, L$ | | |
| $q_3$ | $q_3, 1, L$ | | $q_4, \square, R$ |
| $*\,q_4$ | | | |

```automaton
type: nfa
states: q0 70 120, q1 220 120, q2 370 120, q3 520 120, q4 670 120
start: q0
finals: [q4]
trans: "q0 1→1,R q0; q0 0→1,R q1; q1 1→1,R q1; q1 □→□,L q2; q2 1→□,L q3; q3 1→1,L q3; q3 □→□,R q4"
```
:::

:::trace[T₆ on $1101$: $2 + 1 = 3$]
$$
q_0\,1101 \vdash 1\,q_0\,101 \vdash 11\,q_0\,01 \vdash 111\,q_1\,1 \vdash 1111\,q_1\,\square \vdash 111\,q_2\,1 \vdash 11\,q_3\,1 \vdash 1\,q_3\,11 \vdash q_3\,111 \vdash q_3\,\square 111 \vdash q_4\,111
$$
:::

### Copying

A copy needs marks again. Replace the ones by $x$, then bring back one $x$ at a time, writing a $1$ at the far
right for each.

:::machine[T₇: the copier $1^n \mapsto 1^n 0 1^n$]
| $\delta$ | $1$ | $0$ | $x$ | $\square$ |
|---|---|---|---|---|
| $\to q_0$ | $q_0, x, R$ | | | $q_1, 0, L$ |
| $q_1$ | $q_1, 1, L$ | $q_1, 0, L$ | $q_2, 1, R$ | $q_3, \square, R$ |
| $q_2$ | $q_2, 1, R$ | $q_2, 0, R$ | | $q_1, 1, L$ |
| $*\,q_3$ | | | | |

```automaton
type: nfa
states: q0 90 130, q1 280 130, q2 470 130, q3 280 280
start: q0
finals: [q3]
trans: "q0 1→x,R q0; q0 □→0,L q1; q1 1→1,L|0→0,L q1; q1 x→1,R q2; q2 1→1,R|0→0,R q2; q2 □→1,L q1; q1 □→□,R q3"
```
:::

:::trace[T₇ on $1$]
$$
q_0\,1 \vdash x\,q_0\,\square \vdash q_1\,x0 \vdash 1\,q_2\,0 \vdash 10\,q_2\,\square \vdash 1\,q_1\,01 \vdash q_1\,101 \vdash q_1\,\square 101 \vdash q_3\,101
$$
:::

::::exercise[Subtraction that stops at zero]
Design a Turing machine for $f(x, y) = \max(x - y, 0)$, with input $1^x 0 1^y$. Trace $1101$.

:::solution
Cancel in pairs: erase one $1$ at the left end and one at the right end, and repeat. If the right part runs out
first, one erased $1$ was too many, and it is put back by turning the $0$ into a $1$. If the left part runs out
first, erase what is left.

| $\delta$ | $1$ | $0$ | $\square$ |
|---|---|---|---|
| $\to q_0$ | $q_1, \square, R$ | $q_5, \square, R$ | |
| $q_1$ | $q_1, 1, R$ | $q_1, 0, R$ | $q_2, \square, L$ |
| $q_2$ | $q_3, \square, L$ | $q_4, 1, L$ | |
| $q_3$ | $q_3, 1, L$ | $q_3, 0, L$ | $q_0, \square, R$ |
| $q_4$ | $q_4, 1, L$ | | $q_6, \square, R$ |
| $q_5$ | $q_5, \square, R$ | | $q_6, \square, L$ |
| $*\,q_6$ | | | |

$$q_0\,1101 \vdash q_1\,101 \vdash 1\,q_1\,01 \vdash 10\,q_1\,1 \vdash 101\,q_1\,\square \vdash 10\,q_2\,1 \vdash 1\,q_3\,0 \vdash q_3\,10 \vdash q_3\,\square 10 \vdash q_0\,10 \vdash q_1\,0 \vdash 0\,q_1\,\square \vdash q_2\,0 \vdash q_4\,\square 1 \vdash q_6\,1$$

The output is $1$, so $2 - 1 = 1$.
:::
::::

:::insight
A machine that always leaves its head at the start of its output can be followed by another machine that
expects its head at the start of its input. That convention, which looks like a detail in each table, is
what allows machines to be chained.
:::

:::equations
- *Turing-computable*: $q_0 w \vdash^* q_f\, f(w)$ for every $w$ in the domain.
- *Unary encoding*: $n$ as $1^n$; a pair as $1^x 0 1^y$.
- *Adder idea*: $1^x 0 1^y \to 1^{x + y + 1}$, then erase one $1$.
:::

## Combining Turing Machines

### Machines as building blocks

Writing every machine as a table soon stops being practical. Instead, treat a finished machine as a
subroutine.

:::algorithm[Composing two Turing machines]
**Input:** $M_1$ computing $f$ and $M_2$ computing $g$, each ending with the head on its output.\
**Output:** a machine computing $g \circ f$.

1. Rename the states of $M_2$ so that they differ from those of $M_1$.
2. Take all the moves of both machines.
3. Redirect every move of $M_1$ into a final state, so that it enters the initial state of $M_2$ instead.
4. The final states of the new machine are those of $M_2$.
:::

::::example[Doubling by composition]
Build a machine for $n \mapsto 2n$ from the copier and the adder.

:::solution
Run $T_7$ then $T_6$: the copier sends $1^n$ to $1^n 0 1^n$, which is the input of the adder for the pair
$(n, n)$. Rename the states of $T_6$ to $p_0, \dots, p_4$, and redirect the move into $q_3$:
$$\delta(q_1, \square) = (p_0, \square, R).$$
There are 3 states of the copier and 5 of the adder. On $111$ the combined machine ends with $111111$ and its
head on the first $1$: $3$ becomes $6$.
:::
::::

### Block diagrams

A larger machine is drawn as a diagram of blocks. A block can also decide: it can halt in one of two
states, and each leads to a different block.

The absolute difference $|x - y|$ of two numbers is three blocks and one test:

```text
              ┌─────────┐  x ≥ y   ┌──────────┐
  1ˣ 0 1ʸ ──► │ compare │ ───────► │ subtract │ ──► halt
              └────┬────┘          └──────────┘
                   │ x < y              ▲
                   ▼                    │
              ┌─────────┐               │
              │  swap   │ ──────────────┘
              └─────────┘
```

Loops are allowed as well. For multiplication $x \cdot y$, keep $y$ on the tape, and run an adder once for each
$1$ of $x$. Each block is a table like those above, but once the blocks are trusted, nobody needs to write the
final table.

### Levels of description

From now on, a Turing machine can be described at three levels:

| Level | What is given | Used for |
|---|---|---|
| table | every move | small machines, and proofs that they work |
| block diagram | machines and how they are connected | machines built from known parts |
| algorithm in words | the steps, and how the tape is used | anything larger |

A description in words is acceptable as soon as it is clear that each step could be turned into blocks: find
the first unmarked symbol, compare two blocks, copy a block.

:::insight
Composition is why a tiny instruction set is enough. A computer has an adder and a loop; so does a Turing
machine, built by hand. A Turing machine is simple to reason about, and it pays for that with long
programs, not with weaker ones.
:::

:::equations
- *Composition*: send the moves into the final states of $M_1$ to the initial state of $M_2$, with states renamed.
- *Doubling*: $1^n \to 1^n 0 1^n \to 1^{2n}$, copier then adder.
:::

## Turing's Thesis

### What is an algorithm?

Everything built so far suggests that a Turing machine can do whatever a computer can do. That claim is stated as a thesis:

:::definition[Turing's thesis]
**Turing's thesis** (also the **Church-Turing thesis**): any computation that can be carried out by mechanical
means can be performed by some Turing machine.
:::

:::definition[Algorithm]
An **algorithm** for a function $f$ is a Turing machine that, on every input in the domain of $f$, halts with
the correct answer.
:::

The thesis is not a theorem, and it cannot be proved, because "carried out by mechanical means" is not a
mathematical notion. It is a proposal: take the Turing machine as the definition of mechanical computation. The
evidence for it:

- Anything a digital computer can do can be done by a Turing machine, with a tape standing in for memory.
- Nobody has found a problem that an algorithm, in the informal sense, solves and a Turing machine cannot.
- Many models were proposed independently, among them recursive functions, the lambda calculus, Post systems and random-access machines, and all of them have turned out to be equivalent to the Turing machine.

The thesis has a practical side: to show that a Turing machine for a problem exists, it is enough to give an
algorithm in any clear form. And it has a stronger side: if no Turing machine can solve a problem, then no
computer program can either.

:::insight
The thesis turns a statement about tapes into a statement about computation in general. Without it the next
unit would be a curiosity about one machine. With it, a problem that no Turing machine solves is a problem
that no one can solve by any program, whatever the language or the hardware.
:::

:::equations
- *Turing's thesis*: mechanical computation $=$ what a Turing machine can do; a definition backed by evidence, not a theorem.
:::

## Variants of the Model

### Adding features adds nothing

A good test of the model: does a natural extension make it stronger? Each machine below accepts the same
languages as the standard machine, and each is shown by a simulation.

| Variant | What changes | How the standard machine simulates it |
|---|---|---|
| stay-option | the head may also stay put, $\delta$ to $\{L, R, S\}$ | a stay becomes a right move, then a left move through a new state |
| semi-infinite tape | the tape has a left end | fold the two-way tape in half: two tracks, one for each side of the start cell |
| multi-track tape | each cell holds a tuple of symbols | a new tape alphabet of tuples |
| multiple tapes | $k$ tapes and heads, one move on all of them | $k$ tracks on one tape, with a mark for each head position, and a sweep for each move |
| multi-dimensional tape | the head moves on a grid | write each cell as its coordinates and contents on a list |
| non-deterministic | $\delta$ gives a set of moves | try all computations, breadth-first, keeping the list of configurations on the tape |

The last row is the important one. A non-deterministic machine accepts if **some** computation does. A
deterministic machine can list all the configurations reachable in one step, then two, and so on, and halt if
it finds an accepting one. This can be exponentially slower, but it computes the same thing.

A PDA with **two** stacks is also equivalent to a Turing machine: one stack holds the tape to the left of the
head and the other the tape to the right. So the step from one stack to two is the entire step from
context-free to everything computable.

:::caution[Faster is not stronger]
All these simulations can cost a lot of time, and the theory of complexity is about exactly that. For the
question of **which languages can be accepted**, time does not count, so a machine that is only faster gives
nothing new.
:::

```python
# A Turing machine simulator; the step limit stands in for "it may loop". The tape is a dict
# from cell number to symbol, so it grows in both directions; "_" is the blank.
def run(delta, finals, w, limit=10_000):
    tape, head, q = dict(enumerate(w)), 0, "q0"
    for _ in range(limit):
        key = (q, tape.get(head, "_"))
        if key not in delta:                           # no move: the machine halts
            return "accept" if q in finals else "reject"
        q, tape[head], move = delta[key]
        head += 1 if move == "R" else -1
    return "no answer yet"

def table(rows):
    """'q0 a x R q1' means delta(q0, a) = (q1, x, R)."""
    return {(q, s): (p, w, m) for q, s, w, m, p in map(str.split, rows)}

T4 = table(["q0 a x R q1", "q0 y y R q4", "q1 a a R q1", "q1 b y R q2", "q1 y y R q1",
            "q2 b b R q2", "q2 c z L q3", "q2 z z R q2", "q3 a a L q3", "q3 b b L q3",
            "q3 x x R q0", "q3 y y L q3", "q3 z z L q3", "q4 y y R q4", "q4 z z R q4",
            "q4 _ _ L q5"])
for w in ["abc", "aabbcc", "aabbc", "abcabc"]:
    print(w, run(T4, {"q5"}, w))
```

```output
abc accept
aabbcc accept
aabbc reject
abcabc reject
```

:::insight
Nothing added to the Turing machine has changed what it can do. Tapes, tracks, heads and guesses change how
long a computation takes, never whether it can be done. That is the mathematical reason for trusting the
thesis: the model does not depend on its details.
:::

:::equations
- *Equivalent variants*: stay-option, semi-infinite tape, multi-track, multi-tape, multi-dimensional, non-deterministic.
- *Two stacks*: PDA with two stacks $=$ Turing machine, one stack on each side of the head.
:::
