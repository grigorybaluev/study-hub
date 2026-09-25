---
title: Finite automata
order: 3
status: detailed
weeks: [2]
introduces: [dfa, nfa, dfa-minimization]
requires:
  - {concept: formal-language, strength: hard}
  - {concept: automaton, strength: hard}
  - {concept: graph, strength: soft}
  - {concept: relation, strength: soft}
reinforces: []
---

Deterministic and non-deterministic finite accepters, the languages they accept, the
subset construction showing NFAs and DFAs are equivalent, and DFA minimisation.

## What is an Automaton? Running a Finite Accepter

### The abstract model

:::definition[Automaton, finite accepter]
An **automaton** is an abstract model of a digital computer: an **input file** (tape) read symbol by symbol, a **control unit** with a finite number of internal states, possibly a **storage** with an unlimited number of cells, and an **output**.
- The input file, the storage and the output are strings, over the same or different alphabets. The automaton can detect the end of the input (an end-of-file condition).
- The **transition function** describes how the control unit moves from one internal state to another. A **configuration** is the particular state of the control unit (plus tape/storage contents).
- In a **deterministic** automaton, if the input, the storage content and the internal state are known, the next move is predictable. Otherwise it is **non-deterministic**.
- An **accepter** is an automaton whose output is only “yes” or “no”; a **transducer** can produce strings of symbols.
A **finite accepter** (finite automaton) reads a string and outputs “accept” or “reject”. It has no storage — only the finitely many states.
:::

### The first example

The transition graph below has an *initial state* $q_0$ (incoming arrow), *states* $q_0, \dots, q_5$, *transitions* labelled by input symbols, and a *final / accept state* $q_4$ (double circle).

:::trace[Accepting $abba$]
$$
(q_0, abba) \vdash (q_1, bba) \vdash (q_2, ba) \vdash (q_3, a) \vdash (q_4, \lambda) \qquad \textbf{accept}
$$

Input finished in a final state.
:::

:::trace[Rejecting $aba$]
$$
(q_0, aba) \vdash (q_1, ba) \vdash (q_2, a) \vdash (q_5, \lambda) \qquad \textbf{reject}
$$

Input finished, but $q_5$ is not final. $q_5$ is a *trap state*: once there, every symbol loops back to $q_5$.
:::

:::trace[Rejecting $\lambda$]
$$
(q_0, \lambda) \qquad \textbf{reject}
$$

Nothing to read; the automaton stays in $q_0$, which is not final.
:::

:::machine[$M$: $L(M) = \{a^n b : n \ge 0\}$]
$q_0$ loops on $a$, $q_0 \xrightarrow{b} q_1$ (final), $q_1 \xrightarrow{a,b} q_2$, and $q_2$ is a trap.

| $\delta$ | $a$ | $b$ |
|---|---|---|
| $\to q_0$ | $q_0$ | $q_1$ |
| $*\,q_1$ | $q_2$ | $q_2$ |
| $q_2$ | $q_2$ | $q_2$ |

```automaton
machine: dfa-anb
```
:::

:::trace[$M$ on $aab$ and on $bab$]
$$
(q_0, aab) \vdash (q_0, ab) \vdash (q_0, b) \vdash (q_1, \lambda) \qquad \textbf{accept}
$$

$$
(q_0, bab) \vdash (q_1, ab) \vdash (q_2, b) \vdash (q_2, \lambda) \qquad \textbf{reject}
$$
:::

Use the simulator to replay these runs symbol by symbol — or type any other input.

```sim
id: fa-intro
custom: true
mode: run
machines:
- dfa-abba
- dfa-anb
machine: dfa-abba
input: abba
multi: |-
  abba
  aba
  λ
  abbab
note: The accepter above. Step ▶ moves the read head one symbol (the current state and the transition taken are shown in red); ▶ Play animates the run at the chosen speed; ◀ Back rewinds. Change the input (e.g. aba, bab) or use "Multiple run…" to test several strings at once, like JFLAP.
...
```

```python
# Running a finite accepter by hand: follow the edge labelled with each symbol and
# print the walk; accept iff the last state is final. The two machines of the sim.
def expand(spec):
    """'q0 a q1; q4 a,b q5' -> {('q0','a'): 'q1', ('q4','a'): 'q5', ('q4','b'): 'q5'}"""
    delta = {}
    for part in spec.split(';'):
        p, syms, q = part.split()
        for c in syms.split(','):
            delta[(p, c)] = q
    return delta

abba = expand('q0 a q1; q0 b q5; q1 b q2; q1 a q5; q2 b q3; q2 a q5; q3 a q4; q3 b q5; q4 a,b q5; q5 a,b q5')
anb  = expand('q0 a q0; q0 b q1; q1 a,b q2; q2 a,b q2')

def run(delta, finals, w, state='q0'):
    walk = state
    for c in w:
        state = delta[(state, c)]
        walk += f' -{c}-> {state}'
    return walk, state in finals

for w in ['abba', 'aba', '', 'abbab']:                     # the sim's "Multiple run" list
    walk, ok = run(abba, {'q4'}, w)
    print(f"{w or 'λ':>6}: {walk:<40} {'accept' if ok else 'reject'}")
for w in ['aab', 'bab']:                                   # the aⁿb machine
    walk, ok = run(anb, {'q1'}, w)
    print(f"{w:>6}: {walk:<40} {'accept' if ok else 'reject'}")
# abba: q0 -a-> q1 -b-> q2 -b-> q3 -a-> q4 accept; aba ends in the trap q5; λ stays in q0: reject
```

:::insight
A finite accepter is a labelled graph plus a read head. Follow the edge labelled with each input symbol; when the input is exhausted, "accept" iff you are in a final state. Everything else about DFAs is a formalisation of this walk.
:::

## DFA: Formal Definition & the Extended Transition Function

### Formal definition

:::definition[Deterministic finite accepter (DFA)]
A **deterministic finite accepter** (DFA) is $M = (Q, \Sigma, \delta, q_0, F)$ where

- $Q$ — a finite set of **states**;
- $\Sigma$ — the **alphabet** (finite set of input symbols);
- $\delta : Q \times \Sigma \to Q$ — the **transition function**;
- $q_0 \in Q$ — the **initial state**;
- $F \subseteq Q$ — the set of **final states**.
:::

:::machine[The running example: $L(M) = \{abba\}$]
$M = (\{q_0, \dots, q_5\},\ \{a, b\},\ \delta,\ q_0,\ \{q_4\})$ with

| $\delta$ | $a$ | $b$ |
|---|---|---|
| $\to q_0$ | $q_1$ | $q_5$ |
| $q_1$ | $q_5$ | $q_2$ |
| $q_2$ | $q_5$ | $q_3$ |
| $q_3$ | $q_4$ | $q_5$ |
| $*\,q_4$ | $q_5$ | $q_5$ |
| $q_5$ | $q_5$ | $q_5$ |

```automaton
machine: dfa-abba
```
:::

Every row has exactly one entry per symbol — that is what *deterministic* means, and why the graph and the table carry the same information.

### The extended transition function δ*

:::definition[Extended transition function $\delta^*$]
$\delta^* : Q \times \Sigma^* \to Q$; $\;\delta^*(q, w)$ is the state reached from $q$ after reading the whole string $w$.
Examples on the running DFA: $\delta^*(q_0, ab) = q_2$, $\;\delta^*(q_0, abba) = q_4$, $\;\delta^*(q_0, abbbaa) = q_5$.
:::

:::remark[Observation]
$\delta^*(q, w) = q'$ exactly when there is a *walk* from $q$ to $q'$ with label $w = \sigma_1 \sigma_2 \cdots \sigma_k$. E.g. there is a walk from $q_0$ to $q_5$ with label $abbbaa$.
:::

:::definition[Recursive definition of $\delta^*$]
 $$\delta^*(q, \lambda) = q, \qquad \delta^*(q, w\sigma) = \delta\big(\delta^*(q, w), \sigma\big).$$
Reading: to process $w\sigma$, first process $w$ (reaching $q_1 = \delta^*(q, w)$), then take one more step $\delta(q_1, \sigma) = q'$.
:::

::::example[Unfolding the recursion]
Compute $\delta^*(q_0, ab)$ on the running DFA from the recursive definition.

:::solution
$$\begin{gathered} \delta^*(q_0, ab) = \delta\big(\delta^*(q_0, a), b\big) = \delta\big(\delta(\delta^*(q_0, \lambda), a), b\big) \\[4pt] = \delta\big(\delta(q_0, a), b\big) = \delta(q_1, b) = q_2 . \end{gathered}$$
:::
::::

```sim
id: fa-dfa
custom: true
mode: run
machines:
- dfa-abba
- dfa-lambda-ab-abba
machine: dfa-abba
input: abbbaa
multi: |-
  ab
  abba
  abbbaa
  λ
note: 'Watch δ* being built up: after each Step ▶ the status line shows δ*(q₀, prefix) = current state and the trace q₀ —a→ q₁ —b→ …. The second automaton in the menu is the same graph with F = {q₀, q₂, q₄}, accepting {λ, ab, abba}.'
```

```python
# The transition function is a dictionary keyed by (state, symbol); δ* is the loop
# that applies it symbol by symbol; accept iff the final state is in F. Outputs: q2,
# q4, q5, q0.
# A DFA as a Python dictionary: the transition TABLE of the running example
delta = {
    ('q0','a'): 'q1', ('q0','b'): 'q5',
    ('q1','a'): 'q5', ('q1','b'): 'q2',
    ('q2','a'): 'q5', ('q2','b'): 'q3',
    ('q3','a'): 'q4', ('q3','b'): 'q5',
    ('q4','a'): 'q5', ('q4','b'): 'q5',
    ('q5','a'): 'q5', ('q5','b'): 'q5',
}
q0, F = 'q0', {'q4'}

def delta_star(q, w):
    """δ*(q, λ) = q ;  δ*(q, wσ) = δ(δ*(q, w), σ)   — written as a loop."""
    for sigma in w:
        q = delta[(q, sigma)]
    return q

def accepts(w):
    return delta_star(q0, w) in F

for w in ["ab", "abba", "abbbaa", ""]:
    print(f"δ*(q0, {w or 'λ'}) = {delta_star(q0, w)}   accept: {accepts(w)}")
```

:::insight
δ is one step, δ* is a whole string: δ*(q, λ) = q and δ*(q, wσ) = δ(δ*(q, w), σ). The simulator's "Extended transition function" line shows δ*(q₀, prefix read so far) after every step.
:::

:::equations
- *DFA*: $M = (Q, \Sigma, \delta, q_0, F), \qquad \delta : Q \times \Sigma \to Q$ — A total function: exactly one next state for each (state, symbol).
- *Extended transition function*: $\delta^*(q, \lambda) = q, \qquad \delta^*(q, w\sigma) = \delta\big(\delta^*(q, w), \sigma\big)$ — Defined by recursion on the length of the input.
- *Examples on the running DFA*: $\delta^*(q_0, ab) = q_2, \qquad \delta^*(q_0, abba) = q_4, \qquad \delta^*(q_0, abbbaa) = q_5$ — Walks from q₀ with the given labels.
:::

## Languages Accepted by DFAs & Regular Languages

### The language of a DFA

:::definition[Language accepted by a DFA]
Given a DFA $M = (Q, \Sigma, \delta, q_0, F)$, the **language accepted by $M$** is the set of all strings that drive $M$ to a final state:
 $$L(M) = \{\, w \in \Sigma^* : \delta^*(q_0, w) \in F \,\}.$$
The language *rejected* by $M$ is $\overline{L(M)} = \{\, w \in \Sigma^* : \delta^*(q_0, w) \notin F \,\}$.
- Running example: $L(M) = \{abba\}$ — the only walk from $q_0$ to $q_4$ has label $abba$.
- Same graph with $F = \{q_0, q_2, q_4\}$: $L(M) = \{\lambda, ab, abba\}$.
:::

### More examples

| DFA (in the simulator) | $L(M)$ | Idea |
|---|---|---|
| $q_0 \circlearrowleft a$, $q_0 \xrightarrow{b} q_1$ (final), $q_1 \xrightarrow{a,b} q_2$, $q_2 \circlearrowleft a,b$ | $\{a^n b : n \ge 0\}$ | any number of $a$'s, then exactly one $b$; $q_2$ is a **trap state** |
| $q_0 \xrightarrow{a} q_1 \xrightarrow{b} q_2$ (final, loops on $a,b$); $q_0 \xrightarrow{b} q_3$, $q_1 \xrightarrow{a} q_3$, $q_3 \circlearrowleft a,b$ | all strings with prefix $ab$ | once $ab$ has been read, anything goes |
| states $\lambda, 0, 00$ (final) and $001$ | strings without the substring $001$ | the state remembers the longest suffix read that is a prefix of $001$; reaching state $001$ is fatal (trap) |
| $q_0 \xrightarrow{a} q_2 \circlearrowleft b$, $q_2 \xrightarrow{a} q_3$ (final) $\circlearrowleft a$, $q_3 \xrightarrow{b} q_2$; $q_0 \xrightarrow{b} q_4$ (trap) | $\{awa : w \in \{a,b\}^*\}$ | must start with $a$; final iff the last symbol read is $a$ (and $\|w\| \ge 2$) |

### Regular languages

:::definition[Regular language]
A language $L$ is **regular** if there is a DFA $M$ such that $L = L(M)$. All regular languages form a *family*.
Examples of regular languages (each has a DFA — all of them are in the simulator): $\{abba\}$, $\{\lambda, ab, abba\}$, $\{a^n b : n \ge 0\}$, all strings with prefix $ab$, all strings with suffix $ab$, all strings without substring $001$, $\{awa : w \in \{a,b\}^*\}$.
:::

```sim
id: fa-gallery
custom: true
mode: run
machines:
- dfa-anb
- dfa-prefix-ab
- dfa-no-001
- dfa-awa
- dfa-abba
- dfa-lambda-ab-abba
- dfa-10star
machine: dfa-no-001
input: '01001'
multi: |-
  0
  00
  0100
  001
  1001
  λ
note: All the example DFAs of this unit. Pick one, run a string step by step, or open "Multiple run…" to test a whole list (λ = empty string). For the 001 automaton, watch how the state name always equals the longest suffix of the input that is a prefix of 001.
...
```

```python
# Two of the example DFAs as nested dictionaries, each cross-checked against a direct
# Python test of the language property. The trap states keep the tables total.
def make_dfa(table, start, finals):
    """table: {state: {symbol: next_state}}  (total: every state has every symbol)."""
    def accepts(w):
        q = start
        for sigma in w:
            q = table[q][sigma]
        return q in finals
    return accepts

# L = { w : w does not contain the substring 001 }
no_001 = make_dfa({
    'λ':   {'0': '0',   '1': 'λ'},
    '0':   {'0': '00',  '1': 'λ'},
    '00':  {'0': '00',  '1': '001'},
    '001': {'0': '001', '1': '001'},        # trap state
}, start='λ', finals={'λ', '0', '00'})

# L = { awa : w in {a,b}* }
awa = make_dfa({
    'q0': {'a': 'q2', 'b': 'q4'},
    'q2': {'a': 'q3', 'b': 'q2'},
    'q3': {'a': 'q3', 'b': 'q2'},
    'q4': {'a': 'q4', 'b': 'q4'},           # trap state
}, start='q0', finals={'q3'})

for w in ['', '0', '0100', '001', '1001', '000100']:
    print(f"{w or 'λ':>7}: {'accept' if no_001(w) else 'reject'}   (brute force: {'001' not in w})")
for w in ['aa', 'aba', 'abba', 'ab', 'ba', 'a']:
    print(f"{w:>7}: {'accept' if awa(w) else 'reject'}   (brute force: {len(w) >= 2 and w[0] == 'a' and w[-1] == 'a'})")
```

:::note[There are languages that are not regular]
Example: $L = \{a^n b^n : n \ge 0\}$. As we will learn later, there is no DFA for this and (infinitely) many other languages — intuitively, a DFA has finitely many states and cannot count an unbounded number of $a$'s.
:::

:::note[Important note on DFAs]
In some references (including our book), the transition function of a DFA is required to be a *total* function. As a result, a **trap state** is required — in particular when the complement of a language is derived by swapping final and non-final states: without a trap state, strings that “fall off” the graph would be neither accepted by $M$ nor by its complement.
:::

:::insight
L(M) is the set of strings whose walk from q₀ ends in F. "Regular" just means "some DFA accepts it". Design DFAs by asking what the state must remember (e.g. the longest suffix matching a prefix of 001), and always add a trap state to keep δ total.
:::

:::caution
A DFA can only remember finitely many things. {aⁿbⁿ : n ≥ 0} needs to remember how many a's were read — unboundedly many possibilities — so no DFA accepts it (the proof comes later via the pigeonhole principle).
:::

:::equations
- *Language accepted*: $L(M) = \{\, w \in \Sigma^* : \delta^*(q_0, w) \in F \,\}$ — Strings whose walk from q₀ ends in a final state.
- *Language rejected*: $\overline{L(M)} = \{\, w \in \Sigma^* : \delta^*(q_0, w) \notin F \,\}$ — Because δ is total, every string is either accepted or rejected.
- *Regular language*: $L \text{ regular} \iff \exists \text{ DFA } M:\ L = L(M)$ — Definition.
:::

## Non-deterministic Finite Accepters

### Formal definition

:::definition[Non-deterministic finite accepter (NFA)]
An NFA is $M = (Q, \Sigma, \delta, q_0, F)$ exactly like a DFA, except for the transition function:
 $$\delta : Q \times (\Sigma \cup \{\lambda\}) \to 2^Q .$$
So $\delta(q, a)$ is a *set* of states — possibly several (a **choice**), possibly none (**no transition**) — and there may be **λ-transitions** that change state without reading input.
:::

### Choices, hanging, acceptance

::::example[Choices and hanging]
The NFA over $\{a\}$ has $q_0 \xrightarrow{a} q_1$ and $q_0 \xrightarrow{a} q_3$ — two choices on $a$ —
then $q_1 \xrightarrow{a} q_2$ (final); $q_2$ and $q_3$ have no transitions.

```automaton
machine: nfa-aa
```

Does it accept $aa$? $a$? $aaa$? What is its language?

:::solution
On $aa$: the *first choice* $q_0 \to q_1 \to q_2$ consumes all the input and ends in a final state,
so this computation accepts. The *second choice* $q_0 \to q_3$ has no transition on the second
$a$: the automaton **hangs**, so that computation rejects. One accepting computation is enough:
**$aa$ is accepted**.

On $a$: both computations consume the input but end in $q_1$ or $q_3$, neither final — **rejected**.
On $aaa$: both computations hang — **rejected**. Hence $L = \{aa\}$.
:::
::::

:::definition[Acceptance by an NFA]
An NFA $M$ **accepts** $w$ if there is at least one computation of $M$ that consumes all of $w$ and ends in a final state. $M$ **rejects** $w$ if *no* computation accepts it: every computation either consumes all input and ends in a non-final state, or cannot consume the input (hangs).
:::

### Null (λ) transitions

$q_0 \xrightarrow{a} q_1 \xrightarrow{\lambda} q_2 \xrightarrow{a} q_3$: on a λ-transition the read head does not move. $aa$ is accepted ($q_0 \to q_1 \to q_2$ without reading $\to q_3$); $aaa$ is rejected (the automaton hangs in $q_3$). Again $L = \{aa\}$.

:::note[More NFA examples (all in the simulator)]
- $q_0 \xrightarrow{a} q_1 \xrightarrow{b} q_2$ (final) $\xrightarrow{\lambda} q_3 \xrightarrow{\lambda} q_0$: $L = \{ab, abab, ababab, \dots\} = \{ab\}^+$.
- $q_0$ (final) $\xrightarrow{1} q_1 \xrightarrow{0} q_0$, plus $q_1 \xrightarrow{0,1} q_2$ and $q_0 \xrightarrow{\lambda} q_2$: $L(M) = \{\lambda, 10, 1010, \dots\} = \{10\}^*$; $q_2$ is redundant. Here $\delta(q_0, 1) = \{q_1\}$, $\delta(q_1, 0) = \{q_0, q_2\}$, $\delta(q_0, \lambda) = \{q_0, q_2\}$, $\delta(q_2, 1) = \varnothing$.
- The simplest automata: a single non-final state accepts $\varnothing$; a single final state accepts $\{\lambda\}$. (The symbol $\lambda$ never appears on the input tape.)
- NFAs are interesting because they express languages more easily than DFAs: $L = \{a\}$ needs only $q_0 \xrightarrow{a} q_1$ as an NFA, but a DFA also needs a trap state $q_2$ for the missing transitions.
:::

### Extended transition function and language

:::definition[Extended transition function and language of an NFA]
$\delta^*(q_i, w)$ is the *set* of states $q_j$ such that there is a walk from $q_i$ to $q_j$ with label $w$ (λ-edges contribute nothing to the label). The language of an NFA is
 $$L(M) = \{\, w \in \Sigma^* : \delta^*(q_0, w) \cap F \ne \varnothing \,\}.$$
:::

::::example[$\delta^*$ of an NFA]
The NFA has $q_0 \xrightarrow{a} q_1 \xrightarrow{b} q_2 \xrightarrow{\lambda} q_3 \xrightarrow{\lambda} q_0$, $q_1 \xrightarrow{a} q_4$, $q_1 \xrightarrow{a} q_5$ and $F = \{q_0, q_5\}$.

```automaton
machine: nfa-abstar-aa
```

Compute $\delta^*(q_0, w)$ for $w = a, aa, ab, abaa, aba$, and find $L(M)$.

:::solution
 $$\delta^*(q_0, a) = \{q_1\}, \qquad \delta^*(q_0, aa) = \{q_4, q_5\}, \qquad \delta^*(q_0, ab) = \{q_2, q_3, q_0\}$$ $$\delta^*(q_0, abaa) = \{q_4, q_5\} \ni q_5 \in F \Rightarrow abaa \in L(M), \qquad \delta^*(q_0, aba) = \{q_1\} \Rightarrow aba \notin L(M)$$
Overall $L(M) = \{ab\}^* \cup \{ab\}^*\{aa\}$.
:::
::::

```sim
id: fa-nfa
custom: true
mode: run
machines:
- nfa-aa
- nfa-lambda-aa
- nfa-abplus
- nfa-10star
- nfa-abstar-aa
- nfa-empty
- nfa-lambda-only
machine: nfa-aa
input: aaa
multi: |-
  aa
  a
  aaa
  λ
note: 'All computations are followed in parallel: red states are the current set δ*(q₀, prefix), the configuration boxes list each live branch with its remaining input, and a greyed ✕ state is a branch that just hung. λ-transitions are followed automatically (the closure). Try aaa on the first NFA to watch both branches die, and abaa vs aba on the six-state NFA.'
```

```python
# The set-of-states simulation of an NFA: keep the set of all states any computation
# could be in, close it under λ-moves after every symbol, and accept iff the final set
# meets F. Reproduces δ*(q₀, aa) = {q4, q5}, δ*(q₀, ab) = {q0, q2, q3}, etc.
# NFA with λ-transitions as a dictionary of sets;  '' stands for λ
delta = {
    ('q0','a'): {'q1'}, ('q1','b'): {'q2'}, ('q2',''): {'q3'}, ('q3',''): {'q0'},
    ('q1','a'): {'q4', 'q5'},
}
q0, F = 'q0', {'q0', 'q5'}

def closure(states):
    """λ-closure: everything reachable by λ-moves only."""
    stack, out = list(states), set(states)
    while stack:
        q = stack.pop()
        for p in delta.get((q, ''), set()):
            if p not in out:
                out.add(p); stack.append(p)
    return out

def delta_star(w):
    current = closure({q0})
    for sigma in w:
        current = closure({p for q in current for p in delta.get((q, sigma), set())})
        if not current:                      # every computation hangs
            break
    return current

def accepts(w):
    return bool(delta_star(w) & F)

for w in ['a', 'aa', 'ab', 'abaa', 'aba', '']:
    print(f"δ*(q0, {w or 'λ'}) = {sorted(delta_star(w))}   accept: {accepts(w)}")
```

:::insight
An NFA accepts w if SOME computation consumes all of w and ends in F; it rejects only if EVERY computation fails (ends non-final or hangs). The simulator tracks all computations at once as a set of states — that set is δ*(q₀, prefix), and it is exactly what the subset construction turns into a single DFA state.
:::

:::caution
Non-determinism is not randomness: the machine does not "pick" a branch. To decide acceptance you must consider every branch, and one accepting branch is enough. Also, δ*(q, w) for an NFA is a set — it may be empty (all branches hung).
:::

:::equations
- *NFA transition function*: $\delta : Q \times (\Sigma \cup \{\lambda\}) \to 2^Q$ — A set of next states, possibly empty; λ-moves allowed.
- *Language of an NFA*: $L(M) = \{\, w \in \Sigma^* : \delta^*(q_0, w) \cap F \ne \varnothing \,\}$ — Some walk labelled w from q₀ ends in a final state.
- *The six-state NFA*: $\begin{gathered} \delta^*(q_0, a) = \{q_1\}, \quad \delta^*(q_0, aa) = \{q_4, q_5\}, \quad \delta^*(q_0, ab) = \{q_2, q_3, q_0\} \\[4pt] L(M) = \{ab\}^* \cup \{ab\}^*\{aa\} \end{gathered}$ — Values of δ* on the six-state NFA.
:::

## Equivalence of NFAs and DFAs — the Subset Construction

### Equivalent automata

:::definition[Equivalent automata]
An FA $M_1$ is **equivalent** to an FA $M_2$ if $L(M_1) = L(M_2)$ — both accept the same language.
Example: the NFA $M_1$ with $q_0 \xrightarrow{1} q_1 \xrightarrow{0} q_0$ ($q_0$ final) and the DFA $M_2$ with the extra trap state $q_2$ both accept $\{10\}^*$. (Both are in the simulator on the previous pages.)
:::

### NFAs accept exactly the regular languages

We prove: languages accepted by NFAs $=$ regular languages ($=$ languages accepted by DFAs). That is, NFAs and DFAs have the same computing power.

- **Step 1.** Every DFA is trivially an NFA (each $\delta(q,a)$ is a one-element set), so any language accepted by a DFA is accepted by an NFA.
- **Step 2.** Any NFA can be converted into an equivalent DFA (below), so any language accepted by an NFA is accepted by a DFA.

### The NFA → DFA conversion algorithm

Given an NFA $M$ with states $Q = \{q_0, q_1, q_2, \dots\}$, the DFA $M'$ has states labelled by elements of the *powerset* of $Q$: $\varnothing, \{q_0\}, \{q_1\}, \{q_0, q_1\}, \dots$

:::algorithm[NFA → DFA conversion (subset construction)]
**Input:** an NFA $M$ with states $Q = \{q_0, q_1, \dots\}$.\
**Output:** a DFA $M'$ with $L(M') = L(M)$, whose states are sets of states of $M$.

1. Make $\{q_0\}$ the initial state of $M'$.
2. For every state $\{q_i, q_j, \dots, q_m\}$ of $M'$ and every symbol $a$, compute from the NFA

   $$
   \delta^*(q_i, a) \cup \delta^*(q_j, a) \cup \dots \cup \delta^*(q_m, a) = \{q_{i'}, q_{j'}, \dots, q_{m'}\}
   $$

   and add the transition $\delta'\big(\{q_i, \dots, q_m\}, a\big) = \{q_{i'}, \dots, q_{m'}\}$, creating the
   target state if it is new.
3. Repeat step 2 until no more transitions can be added.
4. Mark as final every state of $M'$ that contains a final state of the NFA.
5. If the NFA accepts $\lambda$, mark $\{q_0\}$ as final as well.
:::

::::example[A conversion]
Convert to a DFA the NFA $M$ with $q_0 \xrightarrow{a} q_1$ (final), $q_1 \circlearrowleft a$,
$q_1 \xrightarrow{\lambda} q_2$, $q_2 \xrightarrow{b} q_0$.

```automaton
machine: nfa-conv
```

:::solution
- Initial DFA state $\{q_0\}$.
- $\delta^*(q_0, a) = \{q_1, q_2\}$, so $\delta'(\{q_0\}, a) = \{q_1, q_2\}$; $\;\delta^*(q_0, b) = \varnothing$, so $\delta'(\{q_0\}, b) = \varnothing$.
- $\delta^*(q_1, a) \cup \delta^*(q_2, a) = \{q_1, q_2\}$ and $\delta^*(q_1, b) \cup \delta^*(q_2, b) = \{q_0\}$.
- $\varnothing$ goes to $\varnothing$ on $a$ and $b$ (the trap state).
- $q_1 \in F$, so $\{q_1, q_2\}$ is final. The NFA does not accept $\lambda$, so $\{q_0\}$ stays non-final.

The result, a 3-state DFA $M'$ with $L(M') = L(M)$:

| $\delta'$ | $a$ | $b$ |
|---|---|---|
| $\to \{q_0\}$ | $\{q_1, q_2\}$ | $\varnothing$ |
| $*\,\{q_1, q_2\}$ | $\{q_1, q_2\}$ | $\{q_0\}$ |
| $\varnothing$ | $\varnothing$ | $\varnothing$ |

```automaton
type: dfa
states: q0 70 90, q12 250 90, empty 70 230
start: q0
finals: [q12]
trans: "q0 a q12; q0 b empty; q12 a q12; q12 b q0; empty a,b empty"
```
:::
::::

### Theorem and proof idea

::::theorem[The subset construction is correct]
If the conversion algorithm applied to an NFA $M$ yields the DFA $M'$, then $L(M) = L(M')$.

:::proof
 show $L(M) \subseteq L(M')$ and $L(M') \subseteq L(M)$. For the first, take $w = \sigma_1 \sigma_2 \cdots \sigma_k \in L(M)$, so $M$ has a walk $q_0 \xrightarrow{\sigma_1} \cdots \xrightarrow{\sigma_k} q_f$ with $q_f \in F$. More generally one proves, **by induction on $|v|$**, that whenever $M$ has a walk $q_0 \xrightarrow{v} q_m$, the DFA has a walk $\{q_0\} \xrightarrow{v} \{q_m, \dots\}$ (a state containing $q_m$). Basis $|v| = 1$: this is step 2 of the algorithm. Induction step $v = v'\sigma_{k+1}$: by hypothesis $\{q_0\} \xrightarrow{v'} \{q_d, \dots\}$, and step 2 adds $\{q_d, \dots\} \xrightarrow{\sigma_{k+1}} \{q_e, \dots\}$. Since $q_f$ is final, the DFA state $\{q_f, \dots\}$ is marked final by step 4, so $w \in L(M')$. The other inclusion is similar.
:::
::::

```sim
id: fa-convert
custom: true
mode: convert
machines:
- nfa-conv
- nfa-10star-m1
- nfa-10star
- nfa-abplus
- nfa-lambda-aa
- nfa-aa
- nfa-abstar-aa
machine: nfa-conv
note: 'The four-step algorithm animated: each Step ▶ computes one δ*(…, a) (the NFA states involved light up on the left, the new DFA state/transition on the right) and appends the line to the log; steps 3–4 mark the final states. ▶ Play runs it automatically. The first NFA is the worked example; the others convert the NFAs of the previous page.'
```

```python
# The algorithm step by step. Output: δ′({q0}, a) = {q1,q2}, δ′({q0}, b) =
# ∅, δ′({q1,q2}, a) = {q1,q2}, δ′({q1,q2}, b) = {q0}, ∅ loops; final = [{q1,q2}].
# Subset construction for an NFA given as delta[(state, symbol)] -> set ('' = λ)
delta = {('q0','a'): {'q1'}, ('q1','a'): {'q1'}, ('q1',''): {'q2'}, ('q2','b'): {'q0'}}
q0, F, alphabet = 'q0', {'q1'}, ['a', 'b']

def closure(S):
    stack, out = list(S), set(S)
    while stack:
        q = stack.pop()
        for p in delta.get((q, ''), set()):
            if p not in out: out.add(p); stack.append(p)
    return out

def move(S, a):                       # δ*(S, a) = closure( ∪ δ(q, a) ) over q in closure(S)
    return frozenset(closure({p for q in closure(S) for p in delta.get((q, a), set())}))

start = frozenset({q0})               # step 1
states, trans, todo = {start}, {}, [start]
while todo:                           # step 2: repeat until nothing new
    S = todo.pop()
    for a in alphabet:
        T = move(S, a)
        trans[(S, a)] = T
        if T not in states: states.add(T); todo.append(T)
finals = {S for S in states if S & F}                    # step 3
if closure({q0}) & F: finals.add(start)                  # step 4

name = lambda S: '{' + ','.join(sorted(S)) + '}' if S else '∅'
for (S, a), T in sorted(trans.items(), key=lambda kv: (name(kv[0][0]), kv[0][1])):
    print(f"δ'({name(S)}, {a}) = {name(T)}")
print("final:", [name(S) for S in finals])
```

:::insight
The DFA state after reading w is precisely the set δ*(q₀, w) of NFA states — the subset construction just pre-computes the set-of-states simulation for every reachable set. At most 2^|Q| DFA states can appear; usually far fewer are reachable.
:::

:::equations
- *Equivalence*: $M_1 \equiv M_2 \iff L(M_1) = L(M_2)$ — Same language, possibly very different graphs.
- *Step 2 of the algorithm*: $\delta'\big(\{q_i, \dots, q_m\}, a\big) = \delta^*(q_i, a) \cup \dots \cup \delta^*(q_m, a)$ — Union of the NFA moves (with λ-closure) of every member.
- *Example*: $\begin{gathered} \delta'(\{q_0\}, a) = \{q_1, q_2\}, \quad \delta'(\{q_0\}, b) = \varnothing \\[4pt] \delta'(\{q_1, q_2\}, a) = \{q_1, q_2\}, \quad \delta'(\{q_1, q_2\}, b) = \{q_0\}, \quad F' = \{\{q_1, q_2\}\} \end{gathered}$ — The resulting DFA.
:::

## DFA Minimisation

### Two kinds of waste

- **Inaccessible states** — states with no walk from $q_0$: they can simply be removed.
- **Equivalent (indistinguishable) states** — states that behave identically on every possible continuation of the input: they can be merged.

:::definition[Indistinguishable states]
Two states $p, q$ are **indistinguishable** if for all $w \in \Sigma^*$:
 $$\delta^*(p, w) \in F \;\text{implies}\; \delta^*(q, w) \in F, \qquad\text{and}\qquad \delta^*(p, w) \notin F \;\text{implies}\; \delta^*(q, w) \notin F .$$
Otherwise they are **distinguishable** (some $w$ leads one to $F$ and the other outside $F$). Indistinguishability is an equivalence relation; its classes are the states of the minimal DFA.
:::

### Identifying equivalent states (the mark procedure)

:::algorithm[Mark: find the indistinguishable states]
**Input:** a DFA $M$ without inaccessible states.\
**Output:** the partition of its states into classes of indistinguishable states.

1. Split the states into two blocks: non-final and final (they are distinguished by $w = \lambda$).
2. For each pair of states $p, q$ in a block and each symbol $a$: if $\delta(p, a)$ and $\delta(q, a)$ lie
   in *different* blocks, then $p$ and $q$ are distinguishable — split the block accordingly.
3. Repeat step 2 until no block splits.
:::

### The minimisation algorithm

:::algorithm[DFA minimisation]
**Input:** a DFA $M$.\
**Output:** a DFA $M'$ with $L(M') = L(M)$ and as few states as possible.

1. Remove the inaccessible states.
2. Find the classes of indistinguishable states of $M$ (procedure *mark*, above).
3. For each class $\{q_i, q_j, \dots, q_k\}$, create one state of $M'$, labelled $i, j, \dots, k$.
4. For each transition $\delta(q_r, a) = q_p$, add the transition between the classes of $q_r$ and $q_p$
   (a transition inside a class becomes a loop).
5. The initial state of $M'$ is the class whose label contains $0$; its final states are the classes
   that contain a final state of $M$.
:::

::::example[Minimising a DFA]
Minimise the DFA with $q_0 \xrightarrow{a} q_1$ (final), $q_0 \xrightarrow{b} q_2$, $q_1 \circlearrowleft a$,
$q_1 \xrightarrow{b} q_2$, $q_2 \xrightarrow{a} q_1$, $q_2 \xrightarrow{b} q_0$, and $q_3 \circlearrowleft a$, $q_3 \xrightarrow{b} q_2$.

```automaton
machine: dfa-min
```

:::solution
- *Inaccessible:* nothing enters $q_3$ — remove it.
- *Partition:* $\{q_0, q_2\}$ (non-final), $\{q_1\}$ (final). On $a$ both $q_0$ and $q_2$ go to $q_1$; on
  $b$ they go to $q_2$ and $q_0$ — both in the same block. Nothing splits, so $q_0 \equiv q_2$.
- *Result:* two states, $0{,}2$ (initial) and $1$ (final). The language: strings over $\{a, b\}$ ending in $a$.

| $\delta'$ | $a$ | $b$ |
|---|---|---|
| $\to 0{,}2$ | $1$ | $0{,}2$ |
| $*\,1$ | $1$ | $0{,}2$ |

```automaton
type: dfa
states: q02 70 100, q1 250 100
start: q02
finals: [q1]
trans: "q02 a q1; q02 b q02; q1 a q1; q1 b q02"
```
:::
::::

```sim
id: fa-minimize
custom: true
mode: minimize
machines:
- dfa-min
- dfa-abba
- dfa-lambda-ab-abba
- dfa-prefix-ab
- dfa-no-001
- dfa-awa
- dfa-10star
- dfa-anb
machine: dfa-min
note: 'Step ▶ walks through the algorithm: inaccessible states are greyed and removed, then the current partition is shown by colouring the states block by block after every refinement round; the last step draws the minimal DFA M′. The first DFA is the worked example; try the others — e.g. the {abba} DFA is already minimal, while the prefix-ab DFA is too.'
```

```python
# The same procedure the simulator animates. Output: removed q3; classes {q0,q2} and
# {q1}; transitions 0,2 —a→ 1, 0,2 —b→ 0,2, 1 —a→ 1, 1 —b→ 0,2; initial 0,2; final [1]
# — the worked example DFA.
# DFA minimisation: remove inaccessible states, then partition refinement
table = {'q0': {'a':'q1','b':'q2'}, 'q1': {'a':'q1','b':'q2'}, 'q2': {'a':'q1','b':'q0'}, 'q3': {'a':'q3','b':'q2'}}
start, F, alphabet = 'q0', {'q1'}, ['a', 'b']

# step 0: accessible states only
reach, todo = {start}, [start]
while todo:
    q = todo.pop()
    for a in alphabet:
        if table[q][a] not in reach: reach.add(table[q][a]); todo.append(table[q][a])
print("removed:", sorted(set(table) - reach))                       # ['q3']

# step 1: refine {non-final, final} until stable
blocks = [b for b in (reach - F, reach & F) if b]
while True:
    index = {q: i for i, b in enumerate(blocks) for q in b}
    new = []
    for b in blocks:
        groups = {}
        for q in b:
            groups.setdefault(tuple(index[table[q][a]] for a in alphabet), set()).add(q)
        new += groups.values()
    if len(new) == len(blocks): break
    blocks = new
print("equivalence classes:", [sorted(b) for b in blocks])          # [['q0','q2'], ['q1']]

# steps 2–5: the reduced DFA
label = {q: ','.join(sorted(x[1:] for x in b)) for b in blocks for q in b}
for b in blocks:
    q = next(iter(b))
    for a in alphabet:
        print(f"{label[q]:>4} --{a}--> {label[table[q][a]]}")
print("initial:", label[start], "  final:", sorted({label[q] for q in F & reach}))
```

:::insight
Minimise in two moves: drop what cannot be reached, then merge states that no input string can tell apart. Refining the partition from {non-final, final} until it is stable finds exactly the indistinguishability classes; the minimal DFA is unique up to renaming.
:::

:::equations
- *Indistinguishable states*: $\begin{gathered} p \equiv q \iff \forall w \in \Sigma^*: \\[4pt] \delta^*(p,w) \in F \iff \delta^*(q,w) \in F \end{gathered}$ — No continuation w separates p from q.
- *Refinement test*: if $p, q$ are in the same block but $\delta(p,a)$ and $\delta(q,a)$ are in different blocks, then $p$ and $q$ are distinguishable — split the block, and repeat until stable.
- *Worked example*: $\begin{gathered} q_3 \text{ inaccessible}, \qquad q_0 \equiv q_2 \\[4pt] M' :\quad \{0{,}2\} \xrightarrow{a} \{1\}, \quad \{0{,}2\} \xrightarrow{b} \{0{,}2\}, \quad \{1\} \xrightarrow{a} \{1\}, \quad \{1\} \xrightarrow{b} \{0{,}2\} \end{gathered}$ — The result of the minimisation.
:::

