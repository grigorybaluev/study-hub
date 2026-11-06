---
title: The big picture
---

## One question

The whole course answers one question: **what can a machine compute with a given kind of memory?** Finite memory gives
the regular languages. One stack gives the context-free languages. A tape gives everything that can be computed at all.
For each class there is a machine, a grammar, a list of operations that stay inside it, and a way to prove that a
language is outside. And at the end there are problems that no machine solves, because a machine can be asked about
itself.

:::insight[The picture to keep in mind]
Each class is the previous one plus a better memory. A DFA remembers one of finitely many things. A PDA adds a stack, which
gives unbounded memory, but only the top is visible, so it can match things in reverse order. A Turing machine can walk
over its memory, and then the limit is no longer memory: it is that a machine may run forever, and no one can always tell.
:::

| Memory | Machine | Grammar | Class | First language outside |
|---|---|---|---|---|
| finite | DFA, NFA | regular | regular | $a^nb^n$ |
| one stack, no guess | DPDA | | deterministic context-free | $ww^R$ |
| one stack | NPDA | context-free | context-free | $a^nb^nc^n$, $ww$ |
| a tape, always stops | decider | | recursive | the halting language $L_H$ |
| a tape | Turing machine | unrestricted | recursively enumerable | $\overline{L_H}$ |

The **Map** tab has three maps: conversions for context-free languages, a ladder of all the classes with the proofs that
separate them, and the regular conversions from the midterm.

## The regular half

Weeks 1–5 · [Finite automata](/unit/COMP335/finite-automata),
[Regular languages](/unit/COMP335/regular-languages),
[Closure and decisions](/unit/COMP335/regular-closure-decision),
[The pumping lemma](/unit/COMP335/pumping-lemma-regular)

Four descriptions of one class: DFA, NFA, regular expression, regular grammar, with an algorithm from each to each. Regular languages are
closed under every set operation, concatenation, star, reversal and homomorphism, and every basic question about them
is decidable. The pumping lemma proves non-regularity. The [midterm guide](/prep/COMP335/midterm) has all of this in detail.

## Context-free grammars

Week 6 · [Context-free grammars](/unit/COMP335/context-free-grammars)

Rules $A\to x$ with any $x\in(V\cup T)^*$. A variable can grow on both sides at once, which is how a grammar keeps two parts in
step: $S\to aSb\mid\lambda$ gives $a^nb^n$. To write a grammar, work from the outside in: matched parts in one rule, independent parts as separate
variables, a union as one start rule per case.

A **leftmost derivation** rewrites the leftmost variable at each step; a **derivation tree** records the structure and forgets the
order. A grammar is **ambiguous** if a string has two trees, and that is a property of the grammar, unless the language is **inherently ambiguous**.
Layers of variables remove ambiguity: $E\to E+T\mid T$, $T\to T*F\mid F$, $F\to (E)\mid a$.

**Parsing** decides membership and finds a derivation. Exhaustive search is exponential, and terminates only without
$\lambda$- and unit rules. An **s-grammar** has no choices and parses in $|w|$ steps.

## Simplification and normal forms

Week 8 · [Simplification of CFGs and normal forms](/unit/COMP335/cfg-normal-forms)

:::steps[Cleaning a grammar]
1. **$\lambda$-rules**: find the nullable variables, and copy each rule with every subset of them deleted.
2. **Unit rules**: find the pairs $A\overset{*}{\Rightarrow}B$, and copy the non-unit rules of $B$ up to $A$.
3. **Useless rules**: keep the generating variables, then the ones reachable from $S$.
:::

**Chomsky normal form**: $A\to BC$ or $A\to a$. Replace terminals by $T_a$, cut long rules with new variables. Every tree is
binary, and a string of length $n$ takes $2n-1$ steps. **CYK** fills a table over all substrings, so membership takes time proportional to $|w|^3$.

**Greibach normal form**: $A\to aB_1\cdots B_k$. One terminal per step. Reaching it takes substitution and the removal of left recursion:
$A\to A\alpha\mid\beta$ becomes $A\to\beta\mid\beta B$, $B\to\alpha\mid\alpha B$.

## Pushdown automata

Week 9 · [Pushdown automata](/unit/COMP335/pushdown-automata)

$M=(Q,\Sigma,\Gamma,\delta,q_0,z,F)$ with $\delta:Q\times(\Sigma\cup\{\lambda\})\times\Gamma\to$ finite subsets of $Q\times\Gamma^*$. Each move reads a symbol or
nothing, pops the top and pushes a string. The machine accepts if **some** computation uses up the input and ends in a final state.

```automaton
type: nfa
states: q0 70 120, q1 240 120, q2 410 120
start: q0
finals: [q2]
trans: "q0 a,x→ax|b,x→bx q0; q0 λ,x→x q1; q1 a,a→λ|b,b→λ q1; q1 λ,z→z q2"
```

Even-length palindromes, $\{ww^R\}$: push the first half, **guess** the middle with a $\lambda$-move, and pop the second half. The $x$ stands for any
stack symbol.

**Theorem.** NPDAs accept exactly the context-free languages. Grammar to machine: the stack carries out a leftmost derivation. Machine to grammar: a
variable $(q_iAq_j)$ stands for a stretch of the run that removes $A$.

**Determinism costs power.** A DPDA has at most one move, and no $\lambda$-move beside a reading move on the same state and top. Regular $\subsetneq$
deterministic context-free $\subsetneq$ context-free: $ww^R$ and $a^nb^n\cup a^nb^{2n}$ need the guess.

## The limits of context-free languages

Week 10 · [Properties of context-free languages](/unit/COMP335/cfl-properties)

:::theorem[Pumping lemma for context-free languages]
If $L$ is an infinite context-free language, there is an $m$ such that every $w\in L$ with $|w|\ge m$ splits as $w=uvxyz$ with $|vxy|\le m$ and $|vy|\ge 1$, and
$uv^ixy^iz\in L$ for every $i\ge 0$.
:::

**Why it is true.** A long string has a tall tree in Chomsky normal form, and a tall tree repeats a variable on a path. The part between the two occurrences
can be removed or repeated.

**Use it as a game.** Pick $w$ with blocks of length at least $m$. The window $vxy$ can be anywhere, but it touches at most two neighbouring blocks. Cover every
position. Classics: $a^nb^nc^n$, $ww$, $a^{n^2}$, $a^ib^jc^k$ with $i<j<k$.

**Closure.** Closed under $\cup$, concatenation, star, reversal, homomorphism, and $\cap$ with a **regular** language. Not closed under $\cap$ or complement:
$\{a^nb^nc^k\}\cap\{a^kb^nc^n\}=\{a^nb^nc^n\}$.

**Decisions.** Membership (CYK), emptiness (is $S$ generating?) and finiteness (a cycle in the clean grammar) have algorithms. Equality and ambiguity do not.

## Turing machines

Weeks 11–12 · [Turing machines](/unit/COMP335/turing-machines)

$M=(Q,\Sigma,\Gamma,\delta,q_0,\square,F)$ with partial $\delta:Q\times\Gamma\to Q\times\Gamma\times\{L,R\}$. Read the cell, write, move, change state. A tape replaces
the input and the stack at once. On an input the machine accepts (halts in $F$), rejects (halts elsewhere), or **loops**.

**Programs.** Mark a symbol, sweep to its partner, mark it, sweep back. The state remembers a bounded amount, and everything else stays on the tape. Numbers are written
in unary, $1^n$, and a transducer ends with the head on the first symbol of its output, so machines can be **combined**: rename the states, and send the end of
one to the start of the next.

**Turing's thesis.** Any computation that can be carried out by mechanical means can be performed by some Turing machine. It is not a theorem, and it is supported by every
equivalent model found so far. Multi-tape, multi-dimensional, semi-infinite and non-deterministic machines accept the same languages. So does a PDA with two stacks.

## Decidability

Weeks 12–13 · [Decidability and undecidability](/unit/COMP335/decidability)

A Turing machine is a string, so machines are countable, and a **universal machine** can run any of them. There are uncountably many languages, so some have no machine.

A language is **recursive** if a machine accepts it and always halts, and **recursively enumerable** if a machine accepts it and may loop outside it. If $L$ and $\overline{L}$ are
both recursively enumerable, $L$ is recursive.

:::theorem[The halting problem is undecidable]
No Turing machine decides, given $\langle M\rangle$ and $w$, whether $M$ halts on $w$.
:::

**Why it is true.** Given a decider $H$, build $D$: on $\langle M\rangle$, ask $H$ about $M$ on its own code, and do the opposite. Then $D$ on $\langle D\rangle$ halts exactly when
it does not.

**Reductions.** To show $B$ undecidable, turn each halting instance into an instance of $B$. The standard machine $M'$ runs $M$ on $w$ first, so that its language is
$\Sigma^*$ or $\varnothing$. State entry, blank-tape halting, emptiness, finiteness and equality for Turing machines all fall this way.

:::caution[What it does not say]
The theorem is about one algorithm for all instances. One particular program can still be analysed, and a bounded question ("within 1000 steps", "at most ten states") is decidable.
What is undecidable for Turing machines can be easy for DFAs.
:::

## How it fits together

:::insight[Three ideas hold the course together]
- **The same four questions at each level.** Which machine? Which grammar? Which operations stay inside? What cannot it do?
- **Pick the representation that makes the job easy, then convert.** Membership: CNF and CYK. Union: a grammar. Intersection with a regular language: a PDA. Complement: a DFA.
- **Impossibility has a pattern.** A long input forces a repeat, in a state or in a tree: that is pumping. A machine run on its own code forces a contradiction: that is the
  diagonal. Everything else reduces to those.
:::

What you can solve now:

- design a DFA, an NFA, a grammar, an NPDA or a Turing machine for a described language, and trace it;
- convert between all the regular representations, and between grammars and PDAs;
- clean a grammar, put it in Chomsky or Greibach normal form, and run CYK;
- show or remove ambiguity;
- show that a language is not regular, or not context-free, by pumping or by closure;
- use closure and the decision algorithms for regular and context-free languages;
- write Turing machines as tables, as blocks and in words, and compute with them;
- prove the halting problem undecidable, and reduce it to other problems;
- place a language exactly in the hierarchy.
