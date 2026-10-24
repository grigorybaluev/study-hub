---
title: The big picture
---

## One question

Weeks 1–5 answer one question: **which languages can a machine with a fixed, finite memory
recognise?** The answer is the **regular languages**. There are four descriptions of them that look
different, an algorithm to convert each into each other, a list of operations that keep a language
regular, and a way to prove that a language is *not* regular. Week 6 starts the next level:
context-free grammars, which can count.

:::insight[The picture to keep in mind]
A DFA is a **reader with a finite number of moods**. It reads the input once, left to right, and can
never go back. Its state is everything it remembers about what it has read so far. So designing a
DFA means deciding *what you need to remember*: the last two symbols, a count mod 3, whether $ab$
has appeared yet. A language is regular exactly when finitely many such memories are enough.
$a^nb^n$ needs to remember $n$, which is unbounded, so it is not regular.
:::

The four descriptions are the DFA, the NFA, the regular expression and the regular grammar. Every
conversion between them is an algorithm you can run by hand: the **Map** tab draws all of them.

## Foundations: sets, strings, languages

Week 1 · [Mathematical preliminaries](/unit/COMP335/math-preliminaries),
[Languages, grammars, automata](/unit/COMP335/languages-grammars-automata)

**Sets and proofs.** $\cup, \cap, -$, complement, the powerset $2^S$ with $|2^S| = 2^{|S|}$, and
$A\times B$. Three proof tools: induction, contradiction, and the pigeonhole principle ($n+1$ objects
in $n$ boxes put two in one box). The pigeonhole principle comes back in week 5 as the engine of the
pumping lemma.

**Strings.** An alphabet $\Sigma$ is a finite set of symbols; $\lambda$ is the empty string, with
$|\lambda| = 0$. The reverse satisfies $(uv)^R = v^Ru^R$. $\Sigma^*$ is all strings, including
$\lambda$; $\Sigma^+ = \Sigma^* - \{\lambda\}$.

**Languages** are sets of strings, so set operations apply, plus concatenation
$L_1L_2 = \{xy : x\in L_1, y\in L_2\}$, powers $L^n$, and the star
$L^* = L^0\cup L^1\cup L^2\cup\cdots$, with $L^+ = L^1\cup L^2\cup\cdots$.
**Grammars** $G = (V, T, S, P)$ generate languages by derivations: $L(G) = \{w\in T^* : S\overset{*}{\Rightarrow} w\}$.

| Fact | Why it trips people up |
|---|---|
| $L^0 = \{\lambda\}$, even for $L = \varnothing$ | so $\varnothing^* = \{\lambda\}$, not $\varnothing$ |
| $\varnothing L = \varnothing$, but $\{\lambda\}L = L$ | $\varnothing$ and $\{\lambda\}$ are different languages |
| $L^+ = L^* - \{\lambda\}$ only if $\lambda\notin L$ | if $\lambda\in L$ then $L^+ = L^*$ |
| $(L_1L_2)^R = L_2^RL_1^R$ | the order flips, as for strings |
| $\overline{L} = \Sigma^* - L$ | the complement is taken inside $\Sigma^*$ |

## Deterministic finite accepters

Week 2 · [Finite automata](/unit/COMP335/finite-automata)

$M = (Q, \Sigma, \delta, q_0, F)$ with $\delta: Q\times\Sigma\to Q$ **total**: exactly one move for
every state and symbol. The extended function is $\delta^*(q,\lambda) = q$,
$\delta^*(q, wa) = \delta(\delta^*(q, w), a)$, and $L(M) = \{w : \delta^*(q_0, w)\in F\}$. A language
is **regular** if some DFA accepts it.

:::steps[Designing a DFA]
1. Decide what must be remembered; each possibility is a state.
2. Write the moves: one per state and symbol.
3. Final states are the memories that mean "accept".
4. Add a **trap state** for "already failed", so that $\delta$ is total.
5. Test a few strings in and out, including $\lambda$.
:::

```automaton
type: dfa
states: q0 60 120, q1 210 120, q2 360 120
start: q0
finals: q2
trans: q0 b q0; q0 a q1; q1 a q1; q1 b q2; q2 a q1; q2 b q0
curves: {"q2|q0": -95}
```

Strings ending in $ab$. $q_0$: no progress, $q_1$: the last symbol was $a$, $q_2$: the last two
symbols were $ab$.

**Combining.** "$A$ and $B$", "$A$ or $B$", "$A$ but not $B$": run two DFAs in parallel, as a
product DFA whose states are pairs. Complement: swap final and non-final states, but only in a
**complete** DFA.

## Non-deterministic finite accepters

Week 2 · [Finite automata](/unit/COMP335/finite-automata)

$\delta: Q\times(\Sigma\cup\{\lambda\})\to 2^Q$: zero, one or several moves, and $\lambda$-moves that
read nothing. $w$ is accepted if **some** computation ends in a final state:
$\delta^*(q_0, w)\cap F\neq\varnothing$. Picture it as a machine that clones itself at every choice;
a clone with no move dies. NFAs are much easier to design: they "guess" where the interesting part
starts.

**Subset construction (NFA → DFA).** Track all the clones at once: a DFA state is the *set* of NFA
states you could be in. Start with the $\lambda$-closure of $\{q_0\}$; from a set $S$ on $a$, take
every state reachable by $a$ from $S$, then its $\lambda$-closure. A set is final if it contains an
NFA final state. Only reachable sets are built (at most $2^{|Q|}$). So NFAs and DFAs have exactly the
same power.

## DFA minimisation

Week 2 · [Finite automata](/unit/COMP335/finite-automata)

Two states are **indistinguishable** if no string separates them: $\delta^*(p, w)$ and
$\delta^*(q, w)$ are both final or both non-final for every $w$. Such states have the same future and
can be merged.

:::steps[The mark procedure]
1. Remove unreachable states.
2. Mark every pair (final, non-final).
3. Repeat: mark $(p, q)$ if some symbol sends it to an already marked pair.
4. Stop when a full pass marks nothing; the unmarked pairs merge into classes.
:::

The minimal DFA is unique up to renaming, which gives a test for equality of regular languages.

## Regular expressions

Week 3 · [Regular languages](/unit/COMP335/regular-languages)

Built from $\varnothing$, $\lambda$ and single symbols with $r_1 + r_2$ (union), $r_1r_2$
(concatenation) and $r^*$ (star). Precedence: star, then concatenation, then $+$, so $ab^* + c$
means $(a(b^*)) + c$.

To write one, describe the strings as a shape ("blocks of $b$ or $ab$", "a prefix, then the
pattern, then anything") and translate each piece; check a short string that must be in and one that
must not.

Useful identities: $(a^*b^*)^* = (a+b)^*$, $(ab)^*a = a(ba)^*$, $r^*r^* = r^*$, $(r^*)^* = r^*$,
$\varnothing^* = \lambda$. But $a^* + b^* \neq (a+b)^*$.

**Expression → NFA.** Each piece has a small NFA, and $+$, concatenation and $^*$ glue NFAs
together with $\lambda$-moves.
**NFA → expression: state elimination.** Turn the NFA into a generalized transition graph (edges
labelled by expressions, one initial and one final state) and remove states one at a time: every
path $p \to k \to q$ through the removed state $k$ adds $r_{pq} + r_{pk}r_{kk}^*r_{kq}$. With only
the initial state $i$ and the final state $f$ left, $r = r_{ii}^*r_{if}(r_{ff} + r_{fi}r_{ii}^*r_{if})^*$.

## Regular grammars

Week 3 · [Regular languages](/unit/COMP335/regular-languages)

**Right-linear**: every rule is $A \to xB$ or $A \to x$ with $x\in T^*$, so the variable is always at
the right end. **Left-linear**: $A \to Bx$ or $A \to x$. A regular grammar is one or the other, never a
mix; both generate exactly the regular languages.

- NFA → right-linear grammar: one variable per state; an edge $q_i \xrightarrow{a} q_j$ becomes
  $V_i \to aV_j$, and each final state gets $V_f \to \lambda$.
- Right-linear grammar → NFA: the reverse, with a new final state for rules $A \to x$.
- Left-linear: reverse every right-hand side, which gives a right-linear grammar for $L^R$. Build that
  NFA, then reverse it.

:::caution[Mixing gives only a linear grammar]
$S \to aA$, $A \to Sb \mid \lambda$ mixes a right-linear and a left-linear rule. It generates
$\{a^{n+1}b^n\}$, which is not regular.
:::

**Fixed-point theorem.** $X = \alpha X + \beta$ with $\lambda\notin L(\alpha)$ has the unique solution
$X = \alpha^*\beta$. It solves a right-linear grammar for a regular expression, one variable at a time.

## Closure properties and decision algorithms

Week 4 · [Closure and decisions](/unit/COMP335/regular-closure-decision)

If $L_1, L_2$ are regular, so are $L_1\cup L_2$, $L_1\cap L_2$, $L_1L_2$, $L_1^*$, $\overline{L_1}$,
$L_1^R$, $L_1 - L_2$, $h(L_1)$ for a homomorphism $h$ (replace each symbol by a string), and the
quotients $L_1/L_2 = \{x : xy\in L_1 \text{ for some } y\in L_2\}$ (right) and its left version.

Two uses. (1) Prove $L$ regular by building it from regular pieces with these operations. (2) Prove
$L$ *not* regular: if $L\cap R$ (with $R$ regular) is a known non-regular language, then $L$ cannot be
regular. Example: $\{w : n_a(w) = n_b(w)\}\cap a^*b^* = \{a^nb^n\}$.

Given a DFA, these questions have algorithms:

- **membership**: run the DFA on $w$;
- **emptiness**: is a final state reachable from $q_0$?
- **finiteness**: $L$ is infinite iff some cycle lies on a path from $q_0$ to a final state;
- **equality**: minimise both DFAs and compare, or test whether
  $(L_1\cap\overline{L_2})\cup(\overline{L_1}\cap L_2)$ is empty.

## The pumping lemma: where regular stops

Week 5 · [The pumping lemma](/unit/COMP335/pumping-lemma-regular)

:::theorem[Pumping lemma for regular languages]
If $L$ is regular, there is an $m$ such that every $w\in L$ with $|w|\ge m$ splits as $w = xyz$ with
$|xy|\le m$ and $|y|\ge 1$, and $xy^iz\in L$ for every $i\ge 0$.
:::

**Why it is true.** A DFA with $m$ states reading a string of length $\ge m$ visits $m+1$ states, so
by the pigeonhole principle it repeats one. The input read between the two visits is a loop: you can
go round it zero times or many times, and the machine can't tell the difference.

**Use it as a game** to show $L$ is not regular. The opponent picks $m$. You pick $w\in L$ with
$|w|\ge m$ (usually $w = a^m\ldots$, so that $y$ is forced inside the first block). The opponent picks
any split with $|xy|\le m$, $|y| = k\ge 1$. You pick $i$ (often 0 or 2) with $xy^iz\notin L$, for
every possible $k$.

:::caution[What the lemma cannot do]
It only proves non-regularity. A language that pumps can still be non-regular, and a finite language
is always regular, however strange it looks. To prove regularity, build a DFA, an NFA, an expression
or a grammar, or use closure. Common slips: a $w$ that depends on a specific $m$ ($a^5b^5$); choosing
the split yourself; pumping into a string that is still in $L$; forgetting that $y$ can have any
length from 1 to $m$.
:::

## Context-free grammars

Week 6 · [Context-free grammars](/unit/COMP335/context-free-grammars)

Rules $A\to x$ with any $x\in(V\cup T)^*$. Now one variable can grow on both sides at once, which is
how a grammar counts: $S\to aSb\mid\lambda$ gives $a^nb^n$; $S\to aSa\mid bSb\mid\lambda$ gives
$ww^R$; $S\to (S)\mid SS\mid\lambda$ gives balanced parentheses. Every regular language is
context-free, but not the other way round.

**Derivations and trees.** A leftmost derivation always replaces the leftmost variable. A derivation
tree shows the structure and forgets the order. A grammar is **ambiguous** if some string has two
different trees (equivalently, two leftmost derivations). Example: $E\to E+E\mid E*E\mid a$ on
$a+a*a$.

## How it fits together

:::insight[Three ideas hold the whole course so far]
- **Finite memory is the whole story.** A DFA's states, a regular expression's star and a
  right-linear grammar's variables are all a finite set of situations. The pumping lemma is what
  finite memory can't do.
- **Pick the representation that makes the job easy, then convert.** Complement and intersection:
  DFA. Union, concatenation and star: NFA or expression. Reversal: NFA or grammar. Decisions: a
  minimal DFA.
- **Two ways to prove "not regular".** The pumping lemma directly, or closure to reduce to a language
  already known to be non-regular ($a^nb^n$ is the usual target).
:::

What you can solve now:

- prove or disprove identities about sets, strings and languages;
- design a DFA or NFA for a described language, and complete it with a trap state;
- convert NFA → DFA (subset construction) and minimise a DFA (mark procedure);
- write and read regular expressions; convert an expression to an NFA and an NFA to an expression;
- give right- and left-linear grammars, and convert grammars ↔ NFAs;
- show a language is regular (construction or closure) or not regular (pumping lemma or closure);
- decide emptiness, finiteness and equality; write simple context-free grammars.
