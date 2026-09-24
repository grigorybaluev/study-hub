This page is the design doc for **theory-kind unit pages**: courses whose `courses/<CODE>.md`
says `pages: theory` — COMP 335 (formal languages and automata) and COMP 232 (discrete maths).
A theory page is a math page plus four blocks for machines, runs, procedures and practice.
Everything on the [math page](#/design/math) applies here unchanged: definitions, theorems and
collapsed proofs, examples with collapsed solutions, dense-line spacing, and display math that
breaks instead of scrolling. This page only adds what theory needs. Change the styles in
`app/src/styles/base.css` (`.blk-algorithm`, `.blk-machine`, `.blk-trace`, `.blk-exercise`),
check this page in both themes and at phone width, and add a line to the change log.

## The rules

### The four theory blocks

| Block | Use it for | Instead of |
|---|---|---|
| `machine` | one concrete automaton or grammar: its tuple, then its transition table (or rules) | a `definition` — a definition says what *every* DFA is; a machine is *one* DFA |
| `trace` | a run of a machine on one input, or one derivation, as a chain of configurations ending in the verdict | prose "read a, go to q₁, read b…" inside an example |
| `algorithm` | a named procedure: **Input**, **Output**, numbered steps | `steps`, which is for a method of solving (how to attack a problem), not a construction |
| `exercise` | a question from the slides, an assignment or an exam, with its answer in a nested `solution` | an `example` — an example teaches, an exercise tests |

The general blocks keep their meaning: a `definition` introduces a class of objects (a DFA, a
regular language), a `theorem` states a fact about all of them, and an `example` works one through.

### A table and its diagram

A machine can be shown two ways: its transition table and its state diagram. Put a table and
an ```` ```automaton ```` block directly next to each other (only blank lines between) and the page
shows them as **two views of one machine** — side by side on a wide screen, and on a phone behind
a *Table | Diagram* switch. This works inside `machine`, `example`, `exercise` and `solution`
blocks alike. The diagram is the simulator's drawing without its controls:

```yaml
machine: dfa-prefix-ab          # a machine from the simulator's library, or inline:
type: dfa
states: q0, q1, q2              # "q0 60 120, …" places them; bare ids get a row (≤ 4) or a circle
start: q0
finals: [q2]
trans: "q0 a q1; q0 b q0; q1 a q1; q1 b q2; q2 a q1; q2 b q0"
```

Keep a simulator block (```` ```sim ````) for the one place in a part where the reader should
*run* the machine; everywhere else a static diagram is enough.

### Writing each block

- **machine** — the title names the machine and its language (`M₁: strings with prefix ab`). The
  tuple goes first, on one line if it fits. The transition table follows directly, one row per
  state, with `→` marking the initial state and `*` the final states. If a simulator shows the
  same machine, put its block right after the machine, not somewhere else in the part.
- **trace** — one configuration per step, joined by $\vdash$ for machines and $\Rightarrow$ for
  derivations, in a single display. The verdict ends the chain: **accept** / **reject**, or the
  derived string. The page breaks a long chain at $\vdash$ / $\Rightarrow$ on a phone.
- **algorithm** — **Input** and **Output** on their own lines (end the Input line with a `\` for
  the line break), then a numbered list. Each step
  starts with a verb. Loops are a step that says "repeat from step n".
- **exercise** — the title says where the question comes from. The question stands alone; the
  nested `:::solution` is collapsed, so the reader can try first. Nesting needs one more colon on
  the outer block: `::::exercise` around `:::solution`.

## Specimens

### A machine and its run

:::machine[M₁: strings with prefix $ab$]
$M_1 = (\{q_0, q_1, q_2, q_3\},\ \{a, b\},\ \delta,\ q_0,\ \{q_2\})$ with

| $\delta$ | $a$ | $b$ |
|---|---|---|
| $\to q_0$ | $q_1$ | $q_3$ |
| $q_1$ | $q_3$ | $q_2$ |
| $*\,q_2$ | $q_2$ | $q_2$ |
| $q_3$ | $q_3$ | $q_3$ |

```automaton
machine: dfa-prefix-ab
```

$q_3$ is a trap: once the prefix is wrong, nothing can repair it.
:::

:::trace[$M_1$ on $abba$]
$$
(q_0, abba) \vdash (q_1, bba) \vdash (q_2, ba) \vdash (q_2, a) \vdash (q_2, \lambda) \qquad \textbf{accept}
$$
:::

:::trace[$M_1$ on $ba$]
$$
(q_0, ba) \vdash (q_3, a) \vdash (q_3, \lambda) \qquad \textbf{reject}
$$
:::

```sim
id: fa-intro
custom: true
mode: run
machines:
- dfa-prefix-ab
machine: dfa-prefix-ab
input: abba
multi: |-
  abba
  ba
  ab
  λ
note: 'Specimen copy of the COMP 335 simulator on M₁, to check the machine block, the trace and the simulator read well together.'
verified: [interface, content]
```

### A derivation

:::trace[$S \to aSb \mid \lambda$ derives $aabb$]
$$
S \Rightarrow aSb \Rightarrow aaSbb \Rightarrow aabb
$$
:::

### A construction

:::algorithm[Subset construction]
**Input:** an NFA $N = (Q, \Sigma, \delta, q_0, F)$.\
**Output:** a DFA $D$ with $L(D) = L(N)$.

1. Start with the state $\{q_0\}^{*}$, the set of states reachable from $q_0$ by $\lambda$-moves.
2. Take a set $S$ of $N$-states that has not been expanded, and a symbol $\sigma \in \Sigma$.
3. Compute $S' = \bigcup_{q \in S} \delta^*(q, \sigma)$ — every state reachable by reading $\sigma$
   (with $\lambda$-moves before and after).
4. Add the transition $S \xrightarrow{\sigma} S'$ to $D$, and $S'$ as a new state if it is new.
5. Repeat from step 2 until every set has a transition on every symbol.
6. Make final every set that contains a final state of $N$.
:::

:::theorem[NFAs and DFAs accept the same languages]
For every NFA $N$ there is a DFA $D$ with $L(D) = L(N)$.
:::

### Practice

::::exercise[From the slides]
Is $L = \{a^n b^n : n \ge 0\}$ regular? Justify.

:::solution
No. Suppose it were, with pumping length $p$. Take $w = a^p b^p \in L$. Any split $w = xyz$ with
$|xy| \le p$ and $|y| \ge 1$ has $y = a^k$ for some $k \ge 1$, so

$$
xy^2z = a^{p + k} b^p \notin L ,
$$

contradicting the pumping lemma. So $L$ is not regular.
:::
::::

::::exercise[Design]
Give a DFA over $\{a, b\}$ for the strings that **end** in $ab$.

:::solution
Remember how much of $ab$ has just been read: $q_0$ (nothing useful), $q_1$ (just read $a$),
$q_2$ (just read $ab$, final).

| $\delta$ | $a$ | $b$ |
|---|---|---|
| $\to q_0$ | $q_1$ | $q_0$ |
| $q_1$ | $q_1$ | $q_2$ |
| $*\,q_2$ | $q_1$ | $q_0$ |

```automaton
type: dfa
states: q0 60 150, q1 220 150, q2 380 150
start: q0
finals: [q2]
trans: "q0 a q1; q0 b q0; q1 a q1; q1 b q2; q2 a q1; q2 b q0"
curves: {"q2|q0": 60, "q2|q1": -30, "q1|q2": -30}
```
:::
::::

### An example with both views

::::example[A DFA for an even number of $a$'s]
Build a DFA over $\{a, b\}$ accepting the strings with an even number of $a$'s.

:::solution
Two states remember the parity of the $a$'s read so far; $b$ never changes it.

| $\delta$ | $a$ | $b$ |
|---|---|---|
| $\to *\,e$ | $o$ | $e$ |
| $o$ | $e$ | $o$ |

```automaton
type: dfa
states: e, o
start: e
finals: [e]
trans: "e a o; o a e; e b e; o b o"
```
:::
::::

### A long run on a phone

A worst case for width — the page breaks it at $\vdash$ when it does not fit:

:::trace[$M_1$ on $abbabbaa$]
$$
(q_0, abbabbaa) \vdash (q_1, bbabbaa) \vdash (q_2, babbaa) \vdash (q_2, abbaa) \vdash (q_2, bbaa) \vdash (q_2, baa) \vdash (q_2, aa) \vdash (q_2, a) \vdash (q_2, \lambda) \qquad \textbf{accept}
$$
:::

## Change log

- 2026-09-24: a table next to an ```` ```automaton ```` diagram renders as two views — side by
  side on desktop, a Table | Diagram switch on a phone — in machine, example and exercise blocks.
- 2026-09-24: first version (#111): `pages: theory` inherits the math design and adds `machine`,
  `trace`, `algorithm` and `exercise`; `\vdash` is a break point for long traces.
