---
title: Decidability and undecidability
order: 12
status: detailed
weeks: [12, 13]
introduces: [universal-turing-machine, decidability, halting-problem]
requires:
  - {concept: turing-machine, strength: hard}
  - {concept: church-turing-thesis, strength: soft}
  - {concept: proof-techniques, strength: hard}
  - {concept: countability, strength: soft}
reinforces:
  - {concept: language-decision-problems, perspective: "which decision problems have no algorithm at all, for each language class"}
---

A Turing machine is a finite object, so it can be written down as a string and given to another Turing
machine. This one observation gives both the best and the worst news of the course. The good news is the
**universal machine**, one fixed machine that runs every other: the idea behind the stored-program computer.
The bad news is that a machine can then be asked about itself, and the same self-reference that gives
Cantor's diagonal argument gives problems that no machine can solve. The most famous is the **halting
problem**. By Turing's thesis, those problems have no algorithm in any language, on any computer.

## Machines as Data

### Encoding a Turing machine

To feed a machine to a machine, write it as a string. Any fixed scheme will do. Here is one over $\{0, 1\}$:
number the states $q_1, q_2, \dots$ with $q_1$ initial and $q_2$ the only final state, number the tape symbols $a_1, a_2, \dots$, and number the
directions $L = 1$, $R = 2$. The move $\delta(q_i, a_j) = (q_k, a_l, D_m)$ is written
$$1^i\, 0\, 1^j\, 0\, 1^k\, 0\, 1^l\, 0\, 1^m,$$
and the moves are joined by $00$. Write $\langle M \rangle$ for the code of $M$.

::::example[Encoding a machine]
With $a_1 = a$ and $a_2 = b$, encode the machine with $\delta(q_1, a) = (q_3, b, R)$ and
$\delta(q_3, b) = (q_1, a, L)$.

:::solution
The first move is $(1, 1, 3, 2, 2)$, written $1\,0\,1\,0\,111\,0\,11\,0\,11$. The second is $(3, 2, 1, 1, 1)$, written
$111\,0\,11\,0\,1\,0\,1\,0\,1$. Joined by $00$:
$$\langle M \rangle = 101011101101100111011010101 .$$
:::
::::

Whether a string is a valid code can be checked by an algorithm: it has the right shape, and no pair
$(q_i, a_j)$ appears twice.

### Machines can be listed

List all binary strings by length, and within a length in dictionary order: $\lambda, 0, 1, 00, 01, \dots$. Skip those
that are not valid codes. This gives a list $M_1, M_2, M_3, \dots$ containing every Turing machine.

:::theorem[Turing machines are countable]
The set of all Turing machines is countable.
:::

The same holds for DFAs, grammars and programs in any language. Each is a finite string over a finite
alphabet, and there are only countably many of those.

:::insight
A machine and its input are both strings, so there is no real line between program and data. Everything that
follows comes from this: a machine can run a code it was given, and it can also be given its own code.
:::

:::equations
- *Encoding a move*: $\delta(q_i, a_j) = (q_k, a_l, D_m)$ is $1^i\,0\,1^j\,0\,1^k\,0\,1^l\,0\,1^m$, with $00$ between moves.
- *Machines are countable*: valid codes are a subset of $\{0, 1\}^*$, which can be listed by length.
:::

## The Universal Turing Machine

### One machine to run them all

:::definition[Universal Turing machine]
A **universal Turing machine** $M_u$ takes as input $\langle M \rangle w$, the code of a Turing machine $M$
followed by a string $w$, and simulates $M$ on $w$: it halts in a final state exactly when $M$ accepts $w$,
and it loops exactly when $M$ loops.
:::

:::theorem[A universal Turing machine exists]
There is a universal Turing machine.
:::

The easiest description has three tapes, which is allowed since a multi-tape machine can be simulated by
a standard one.

:::algorithm[The universal machine]
**Input:** $\langle M \rangle$ on tape 1, $w$ on tape 2.\
**Output:** the behaviour of $M$ on $w$.

1. Write the code of the initial state on tape 3.
2. Read the symbol under the head of tape 2.
3. Search tape 1 for the move whose state matches tape 3 and whose symbol matches the one just read.
4. If there is no such move, halt: in a final state if tape 3 holds a final state of $M$, and otherwise in a non-final state.
5. Otherwise write the new symbol on tape 2, move its head as the move says, and write the new state on tape 3.
6. Repeat from step 2.
:::

Tape 1 is the program, tape 2 the memory, and tape 3 the program counter. This is a stored-program computer,
described on paper before one was built: **hardware that is fixed, and software that is data**.

:::insight
A universal machine makes the question "what can a computer do?" into one question, not one per program. It also
means "does $M$ accept $w$?" can always be **watched**: run it, and wait. What it cannot do is promise that the
wait will end.
:::

:::equations
- *Universal machine*: $M_u$ on $\langle M \rangle w$ behaves as $M$ on $w$.
- *Three tapes*: code of $M$, tape of $M$, current state of $M$.
:::

## Recursive and Recursively Enumerable Languages

### Accepting against deciding

A Turing machine can fail to answer by looping, which creates two grades of solvability.

:::definition[Recursively enumerable language]
A language $L$ is **recursively enumerable** if some Turing machine accepts it: on $w \in L$ it halts in a
final state, and on $w \notin L$ it halts in a non-final state or loops.
:::

:::definition[Recursive language]
A language $L$ is **recursive** if some Turing machine accepts it and **halts on every input**.
:::

:::definition[Decidable problem]
A yes/no problem is **decidable** if some Turing machine halts on every instance with the right answer.
Equivalently, the language of encoded yes-instances is recursive. Otherwise the problem is **undecidable**.
:::

So a recursive language has a **membership algorithm**, and a recursively enumerable language only has a
procedure that confirms every member. Every recursive language is recursively enumerable, and the next parts
show that the inclusion is proper.

The name comes from another view: $L$ is recursively enumerable exactly when some machine can list its strings
one after another. To list $L$ from an accepter, run it on the 1st string for 1 step, then on the first two
strings for 2 steps, and so on, and print each string that is accepted. This interleaving, called
**dovetailing**, keeps a loop on one string from blocking the others.

### Complements

::::theorem[Complement of a recursive language]
If $L$ is recursive, then so is $\overline{L}$.

:::proof
Let $M$ accept $L$ and halt on every input. Make a machine $M'$ with a new final state $q_{yes}$. The old final
states become non-final, and every missing move from a non-final state of $M$ goes to $q_{yes}$. Then $M'$ halts
on every input, and it accepts exactly what $M$ rejects.
:::
::::

::::theorem[Both sides recursively enumerable]
If $L$ and $\overline{L}$ are both recursively enumerable, then $L$ is recursive.

:::proof
Let $M_1$ accept $L$ and $M_2$ accept $\overline{L}$. On input $w$, run them in turns: one step of $M_1$, one step of
$M_2$, and so on. Every $w$ lies in $L$ or in $\overline{L}$, so one of them halts in a final state. Answer yes if it
is $M_1$ and no if it is $M_2$.
:::
::::

The second theorem gives a sharp corollary, used below.

:::theorem[One side only]
If $L$ is recursively enumerable and not recursive, then $\overline{L}$ is not recursively enumerable.
:::

One machine is not enough for this. Running $M$ to "see if it rejects" does not work, because it may loop, and
that is why the proof above needs a machine for each side.

| Operation | Recursive | Recursively enumerable |
|---|---|---|
| union, intersection | yes | yes |
| concatenation, star | yes | yes |
| complement | yes | **no** |

:::insight
"Recursively enumerable" is one-sided: "yes" comes in finite time, and "no" may never come. "Recursive" is
two-sided. So decidability is exactly the case in which both "yes" and "no" can be confirmed in finite time.
:::

:::equations
- *Recursive*: a Turing machine accepts $L$ and halts on every input.
- *Recursively enumerable*: a Turing machine accepts $L$, and may loop on strings outside $L$.
- *Two sides*: $L$ and $\overline{L}$ recursively enumerable $\iff L$ recursive.
:::

## Languages That No Machine Accepts

### A counting argument

Turing machines are countable. Languages are not.

:::theorem[More languages than machines]
Over any non-empty alphabet $\Sigma$, the set of all languages is uncountable. So there are languages that are
not recursively enumerable.
:::

A language over $\Sigma$ is a subset of the countably infinite set $\Sigma^*$, so the languages form the powerset
of a countable set, which is uncountable. Countably many machines cannot cover uncountably many languages. In
fact, almost no language is accepted by any machine.

### The diagonal language

Counting says that such languages exist. The diagonal argument builds one. List the strings $w_1, w_2, \dots$ of
$\{0, 1\}^*$ and the machines $M_1, M_2, \dots$, and fill a table with a 1 at row $i$ and column $j$ when $M_i$ accepts
$w_j$. The values below are only for illustration.

| | $w_1$ | $w_2$ | $w_3$ | $w_4$ | $\cdots$ |
|---|---|---|---|---|---|
| $M_1$ | **1** | 0 | 1 | 1 | |
| $M_2$ | 1 | **0** | 0 | 1 | |
| $M_3$ | 0 | 1 | **1** | 0 | |
| $M_4$ | 0 | 0 | 1 | **0** | |
| $\vdots$ | | | | | $\ddots$ |

::::theorem[A language that is not recursively enumerable]
The **diagonal language** $L_d = \{w_i : w_i \notin L(M_i)\}$ is not recursively enumerable.

:::proof
Suppose $L_d = L(M_k)$ for some $k$. Ask whether $w_k \in L_d$. By the definition of $L_d$, $w_k \in L_d$ means
$w_k \notin L(M_k)$. By the assumption, $w_k \in L_d$ means $w_k \in L(M_k)$. These contradict each other, so no
$M_k$ accepts $L_d$.
:::
::::

Each row of the table is a language. Flipping the diagonal gives a row that differs from row $i$ at column $i$,
for every $i$, so it is not in the table at all.

Its complement, $\overline{L_d} = \{w_i : w_i \in L(M_i)\}$, **is** recursively enumerable: given $w$, find the $i$ with
$w = w_i$, build $M_i$, and run it on $w$ with the universal machine. So $\overline{L_d}$ is recursively enumerable and
not recursive, since a recursive language has a recursive complement. This already proves that the two classes
are different.

:::insight
Every undecidability proof in this unit is the same trick: assume a machine that knows about all machines,
and ask it about itself. The contradiction comes from the diagonal, where a row is compared with its own
column.
:::

:::equations
- *Counting*: machines are countable, languages over $\Sigma$ are uncountable.
- *Diagonal language*: $L_d = \{w_i : w_i \notin L(M_i)\}$ is not recursively enumerable.
:::

## The Halting Problem

### Statement

:::definition[Halting problem]
The **halting problem**: given the code $\langle M \rangle$ of a Turing machine and a string $w$, does $M$ halt on
$w$?
:::

It is a practical question: does this program terminate on this input? A tool that answered it would find
every infinite loop. The universal machine cannot answer it: if $M$ has been running for a million steps, it
may halt at the next step, or never.

### Proof of undecidability

::::theorem[The halting problem is undecidable]
No Turing machine decides the halting problem.

:::proof
Suppose a machine $H$ does: on input $\langle M \rangle w$, it always halts, and it answers yes if $M$ halts on $w$
and no otherwise.

Build a machine $D$ from $H$ as follows. On input $\langle M \rangle$:
1. copy the input, to make $\langle M \rangle \langle M \rangle$;
2. run $H$ on it, to learn whether $M$ halts on its own code;
3. if $H$ says yes, enter an infinite loop;
4. if $H$ says no, halt.

So $D$ halts on $\langle M \rangle$ exactly when $M$ does not halt on $\langle M \rangle$. Now take $M = D$ itself:
$D$ halts on $\langle D \rangle$ exactly when $D$ does not halt on $\langle D \rangle$. This is a contradiction, so $H$
does not exist.
:::
::::

The same proof in a programming language, for a hypothetical function `halts`:

```python
def halts(program, data):
    ...                      # assumed to always return True or False, and to be right

def d(program):
    if halts(program, program):
        while True:          # halts says it stops, so loop forever
            pass
    return                   # halts says it loops, so stop

d(d)                         # does this call stop? Either answer is wrong.
```

If `halts(d, d)` returns `True`, then `d(d)` loops, and the answer was wrong. If it returns `False`, then `d(d)`
stops, and the answer was wrong again. There is nothing to repair here: the assumption of a correct `halts` is
what fails.

### Where it sits

:::theorem[The halting problem is recursively enumerable]
The language $L_H = \{\langle M \rangle w : M \text{ halts on } w\}$ is recursively enumerable and not recursive.
:::

To accept $L_H$, simulate $M$ on $w$ with the universal machine, and accept if the simulation halts. If $M$ does
not halt, this machine does not halt either, which is allowed. Together with the last part, this says that
$\overline{L_H}$, "does $M$ run forever on $w$?", is not even recursively enumerable: there is no way to confirm
all the non-halting cases.

:::caution[What the theorem does not say]
It does not say that the halting of one particular program cannot be determined. For a given machine, some proof
may settle it. It says there is no **single** algorithm that works for **all** machines and inputs. And a problem
with finitely many instances is always decidable: a table of the answers exists, whether or not anyone knows it.
:::

:::insight
The proof never looks inside $H$. It works against any candidate at all, because whatever it says about $D$,
$D$ was built to do the opposite. This is why more memory, more speed or a better language would not help.
:::

:::equations
- *Halting language*: $L_H = \{\langle M \rangle w : M \text{ halts on } w\}$, recursively enumerable, not recursive.
- *Diagonal machine*: $D$ halts on $\langle M \rangle \iff M$ does not halt on $\langle M \rangle$.
- *Complement of halting*: $\overline{L_H}$ is not recursively enumerable.
:::

## Reductions

### Reusing one undecidable problem

The diagonal argument is needed only once. Other problems are shown undecidable by comparing them with the halting
problem.

:::definition[Reduction]
A problem $A$ **reduces** to a problem $B$ if there is an algorithm that turns every instance $a$ of $A$ into an
instance $b$ of $B$ such that the answer to $a$ is yes exactly when the answer to $b$ is yes.
:::

:::theorem[Reductions carry undecidability]
If $A$ reduces to $B$ and $B$ is decidable, then $A$ is decidable. So if $A$ is undecidable and reduces to $B$, then
$B$ is undecidable.
:::

To decide $A$: convert the instance, and ask the decider of $B$.

:::steps[Proving that a problem $B$ is undecidable]
1. Assume a decider for $B$.
2. Take an arbitrary instance $\langle M \rangle w$ of the halting problem.
3. Build from it, by an algorithm, an instance of $B$. Usually this is a new machine $M'$ that runs $M$ on $w$ as its first step.
4. Show that the answer for $M'$ is yes exactly when $M$ halts on $w$.
5. Then the assumed decider would decide the halting problem, which is impossible.
:::

:::caution[The direction of a reduction]
Reduce **from** the known undecidable problem **to** the new one. A reduction from $B$ to the halting problem shows
nothing about $B$: every recursively enumerable problem reduces to it, the easy ones included. And the building of
$M'$ only needs to write down its code. The reduction never runs $M$, so it cannot loop.
:::

### Worked reductions

::::example[The state-entry problem]
Show that this problem is undecidable: given $M$, a state $q$ of $M$ and a string $w$, does $M$ ever enter $q$ when
run on $w$?

:::solution
Reduce from the halting problem. Given $\langle M \rangle w$, build $M'$: add a new state $q_h$, and for each state $p$
and symbol $a$ with no move, add a move from $p$ on $a$ to $q_h$. Then $M'$ does what $M$ does until the moment
$M$ would halt, and at that moment enters $q_h$. So $M$ halts on $w$ exactly when $M'$ enters $q_h$ on $w$. A decider
for the state-entry problem would decide halting.
:::
::::

::::example[The blank-tape halting problem]
Show that this problem is undecidable: given $M$, does $M$ halt when started on a blank tape?

:::solution
Given $\langle M \rangle w$, build $M_w$: it writes $w$ on the tape, returns to the first symbol, and then runs $M$. Writing
a fixed string takes $|w|$ extra states, and $M_w$ is easy to build from $\langle M \rangle$ and $w$. On a blank tape, $M_w$
halts exactly when $M$ halts on $w$. A decider for the blank-tape problem would decide halting.
:::
::::

::::example[Does $M$ accept anything?]
Show that this problem is undecidable: given $M$, is $L(M) = \varnothing$?

:::solution
Given $\langle M \rangle w$, build $M'$: on input $x$, ignore $x$, run $M$ on $w$, and accept if that halts. If $M$ halts on
$w$, then $L(M') = \Sigma^*$; otherwise $L(M') = \varnothing$. So $M$ halts on $w$ exactly when $L(M') \ne \varnothing$.
A decider for emptiness would decide halting, after flipping its answer.
:::
::::

The same machine $M'$ answers many questions at once, since its language is $\Sigma^*$ or $\varnothing$:

- "Is $L(M)$ finite?" is undecidable, since $\varnothing$ is finite and $\Sigma^*$ is not.
- "Is $L(M_1) = L(M_2)$?" is undecidable: take for $M_2$ a machine with an empty language, and this is the emptiness question.
- "Is $L(M)$ regular?" is undecidable: change $M'$ so that, after $M$ halts on $w$, it accepts $x$ when $x \in \{a^n b^n\}$. Then $L(M')$ is $\{a^n b^n\}$, which is not regular, or $\varnothing$, which is.

:::remark
All these are cases of one general theorem. **Rice's theorem** says that every non-trivial property of the
**language** of a Turing machine is undecidable; non-trivial means that some machines have it and others do not.
It applies to properties of $L(M)$, not to properties of the machine's code.
:::

::::exercise[Decidable or not?]
For each problem, say whether it is decidable. (a) Given $M$, does $M$ have more than ten states? (b) Given $M$ and
$w$, does $M$ halt on $w$ within $1000$ steps? (c) Given $M$, does $M$ halt on the blank tape? (d) Given $M$, does $M$
accept $ab$? (e) Given $M$, does $M$ accept every string? (f) Given a DFA $D$, is $L(D) = \Sigma^*$?

:::solution
(a) Decidable: count the states in the code. A property of the code, not of the language.

(b) Decidable: simulate 1000 steps with the universal machine. A bound on the steps removes the danger of looping.

(c) Undecidable: the blank-tape halting problem.

(d) Undecidable: reduce from halting. $M'$ runs $M$ on $w$ whatever its input, and then accepts, so $M'$ accepts $ab$
exactly when $M$ halts on $w$.

(e) Undecidable: the same $M'$ accepts every string exactly when $M$ halts on $w$.

(f) Decidable: complement the DFA and test emptiness. What is undecidable for one class can be easy for another.
:::
::::

:::insight
A reduction hides the question inside a machine: "run $M$ on $w$ first, then do something". Whatever the new
question is, it can only see the second part if the first part ends. So asking about the machine's language
amounts to asking whether $M$ halts on $w$.
:::

:::equations
- *Reduction*: an algorithm from instances of $A$ to instances of $B$ preserving the answer.
- *Direction*: known undecidable $A$ reduces to the new problem $B$.
- *Standard machine*: $M'$ on $x$ runs $M$ on $w$, then accepts, so $L(M')$ is $\Sigma^*$ or $\varnothing$.
:::

## What Can Be Decided

### Questions about machines and grammars

The answer depends on the class of the object the question is about.

| Question | DFA | CFG or NPDA | Turing machine |
|---|---|---|---|
| Is $w \in L$? | decidable | decidable | undecidable |
| Is $L$ empty? | decidable | decidable | undecidable |
| Is $L$ finite? | decidable | decidable | undecidable |
| Is $L = \Sigma^*$? | decidable | undecidable | undecidable |
| Is $L_1 = L_2$? | decidable | undecidable | undecidable |
| Is $L_1 \cap L_2$ empty? | decidable | undecidable | undecidable |

Reading across a row: the more powerful the descriptions, the fewer questions about them can be answered.

The undecidable entries for grammars are reached through a problem about strings.

:::remark
In **Post's correspondence problem**, an instance is a finite list of pairs of strings $(u_i, v_i)$, and the question
is whether some sequence of indices gives the same string on both sides: $u_{i_1} \cdots u_{i_k} = v_{i_1} \cdots v_{i_k}$.
It looks like a puzzle about dominoes, and it is undecidable. Reductions from it show that ambiguity of a grammar,
equality of two context-free languages and emptiness of their intersection are all undecidable.
:::

### The hierarchy

Every class of the course fits into one chain, and each step is proper.

| Class | Machine | Grammar | In the next class but not this one |
|---|---|---|---|
| finite | | | $a^*$ |
| regular | DFA, NFA | right- or left-linear (type 3) | $a^n b^n$ |
| deterministic context-free | DPDA | LR grammars | $ww^R$, $a^n b^n \cup a^n b^{2n}$ |
| context-free | NPDA | context-free (type 2) | $a^n b^n c^n$, $ww$ |
| context-sensitive | linear-bounded automaton | context-sensitive (type 1) | exists by diagonalization |
| recursive | TM that always halts | | $L_H$, $\overline{L_d}$ |
| recursively enumerable | TM | unrestricted (type 0) | $\overline{L_H}$, $L_d$ |
| all languages | | | |

:::remark
Two rows were not a topic of this course. An **unrestricted grammar** allows any rule $u \to v$ with $u$ not empty, and it
generates exactly the recursively enumerable languages. A **context-sensitive grammar** requires $|u| \le |v|$, and it
generates the languages of a **linear-bounded automaton**, a Turing machine confined to the part of the tape where
its input was written.
:::

:::caution[Reading the hierarchy]
A language in a class is also in every larger class, so "$a^n b^n$ is not regular" and "$a^n b^n$ is recursive"
are both true. To place a language exactly, show it belongs to a class, by a machine, a grammar or closure, and show
it does not belong to the next smaller class, by a pumping lemma, closure, or a reduction.
:::

:::insight
The course has one story. Memory defines a class: finite, then a stack, then a tape. Each class has a machine,
a grammar and closure properties, and each one ends at a language that can be proved out of reach. With the
Turing machine, the boundary stops being about a particular device: what lies beyond it cannot be computed at all.
:::

:::equations
- *The chain*: regular $\subsetneq$ deterministic CF $\subsetneq$ CF $\subsetneq$ context-sensitive $\subsetneq$ recursive $\subsetneq$ recursively enumerable $\subsetneq$ all languages.
- *Separating witnesses*: $a^n b^n$, $ww^R$, $a^n b^n c^n$, one by diagonalization, $L_H$, $\overline{L_H}$.
:::
