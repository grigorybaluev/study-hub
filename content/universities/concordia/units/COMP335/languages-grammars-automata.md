---
title: Languages, grammars and automata
order: 2
status: detailed
weeks: [1]
introduces: [formal-language, grammar, automaton]
requires:
  - {concept: set, strength: hard}
  - {concept: function, strength: soft}
reinforces: []
---

The three central objects of the course: alphabets, strings and languages (with their
operations); grammars as generators of languages; automata as abstract machines that
recognise them.

## Alphabets & Strings

### Alphabets and strings

:::definition[Alphabet and string]
An **alphabet** $\Sigma$ is a finite set of characters/symbols. A **string** (sentence) is a finite sequence of symbols from $\Sigma$. We use small letters for alphabet symbols.
Over $\Sigma = \{a, b, c, \dots, z\}$: “cat”, “dog”, “house”. Over $\Sigma = \{a, b\}$: $a$, $ab$, $abba$, $baba$, $aaabbbaabab$. We write $u = ab$, $v = bbbaaa$, $w = abba$.
:::

### Operations on strings

For $w = a_1 a_2 \cdots a_n$ and $v = b_1 b_2 \cdots b_m$:

| Operation | Definition | Example |
|---|---|---|
| **Concatenation** | $wv = a_1 \cdots a_n b_1 \cdots b_m$ | $abba \cdot bbbaaa = abbabbbaaa$ |
| **Reverse** | $w^R = a_n \cdots a_2 a_1$ | $(ababaaabbb)^R = bbbaaababa$ |
| **Length** | $\|w\| = n$ | $\|abba\| = 4$, $\|aa\| = 2$, $\|a\| = 1$ |
| Length of a concatenation | $\|uv\| = \|u\| + \|v\|$ | $u = aab$, $v = abaab$: $\|uv\| = \|aababaab\| = 8 = 3 + 5$ |
| **Power** | $w^n = \underbrace{ww\cdots w}_{n}$, $\; w^0 = \lambda$ | $(abba)^2 = abbaabba$, $(abba)^0 = \lambda$ |

:::definition[Empty string]
The **empty string** $\lambda$ is the string with no symbols: $|\lambda| = 0$, and $\lambda w = w \lambda = w$ (e.g. $\lambda\,abba = abba\,\lambda = abba$).
:::

### Substrings, prefixes, suffixes

A **substring** of $w$ is a subsequence of *consecutive* symbols of $w$. For $w = abbab$: $ab$, $abba$, $b$, $bbab$ are substrings. Writing $w = uv$, $u$ is a **prefix** and $v$ a **suffix**:

| Prefixes of $abbab$ | Suffixes of $abbab$ |
|---|---|
| $\lambda,\ a,\ ab,\ abb,\ abba,\ abbab$ | $abbab,\ bbab,\ bab,\ ab,\ b,\ \lambda$ |

### Σ* and Σ⁺

:::definition[$\Sigma^*$ and $\Sigma^+$]
$$\Sigma^* = \text{the set of all possible strings over } \Sigma, \qquad \Sigma^+ = \Sigma^* - \{\lambda\}$$
For $\Sigma = \{a,b\}$: $\Sigma^* = \{\lambda, a, b, aa, ab, ba, bb, aaa, aab, \dots\}$ and $\Sigma^+ = \{a, b, aa, ab, ba, bb, aaa, aab, \dots\}$.
:::

```sim
id: string-tool
custom: true
mode: tool
kind: strings
defaults:
  u: abba
  v: bbbaaa
note: Every string operation on the strings you type. Defaults reproduce the examples above (abba, bbbaaa). Try u = abbab to see the prefix / suffix / substring lists, or an empty u for λ.
...
```

```python
# Python strings already implement concatenation (+), power (*), reverse (slicing) and
# slicing for prefixes/suffixes. Σ* is generated length by length with
# itertools.product.
u, v = "abba", "bbbaaa"
LAMBDA = ""                                  # the empty string

print(u + v, len(u + v) == len(u) + len(v))  # abbabbbaaa True
print(u[::-1])                               # reverse: abba -> abba (a palindrome!)
print("ababaaabbb"[::-1])                    # bbbaaababa
print(u * 2, repr(u * 0))                    # abbaabba ''   (w^2 and w^0 = λ)
print(LAMBDA + u == u + LAMBDA == u)         # True

w = "abbab"
prefixes   = [w[:i] for i in range(len(w) + 1)]
suffixes   = [w[i:] for i in range(len(w) + 1)]
substrings = sorted({w[i:j] for i in range(len(w)) for j in range(i + 1, len(w) + 1)} | {LAMBDA}, key=len)
print(prefixes, suffixes, substrings, sep="\n")

# Σ* enumerated by length (it is infinite; we stop at length 2)
from itertools import product
sigma_star = [''.join(p) for n in range(3) for p in product("ab", repeat=n)]
print(sigma_star)                            # ['', 'a', 'b', 'aa', 'ab', 'ba', 'bb']
```

:::insight
Strings are finite sequences; λ is the empty one (length 0, neutral for concatenation). Σ* is the infinite set of all strings over Σ — every language will be a subset of it.
:::

:::equations
- *Concatenation & reverse*: $wv = a_1 \cdots a_n b_1 \cdots b_m, \qquad w^R = a_n \cdots a_2 a_1$ — For w = a₁…aₙ and v = b₁…bₘ.
- *Length*: $|uv| = |u| + |v|, \qquad |\lambda| = 0$ — Length adds under concatenation.
- *Powers and closures*: $w^n = \underbrace{w w \cdots w}_{n}, \quad w^0 = \lambda, \qquad \Sigma^+ = \Sigma^* - \{\lambda\}$ — Σ* contains λ; Σ⁺ does not.
:::

## Languages & Operations on Languages

### Languages

:::definition[Language]
Given an alphabet $\Sigma$, any subset of $\Sigma^*$ is called a **language**.
Examples of languages over $\{a,b\}$: $\varnothing$, $\{\lambda\}$, $\Sigma^*$, $\{a, aa, aab\}$, $\{\lambda, abba, baba, aa, ab, aaaaaa\}$, and the infinite language
 $$L = \{a^n b^n : n \ge 0\} = \{\lambda, ab, aabb, aaabbb, \dots\}, \qquad aabb \in L, \quad abb \notin L.$$
:::

:::note[Two meanings of $|\cdot|$]
$|w|$ is the *length* of a string; $|L|$ is the *size* of a set. So $|\{\lambda\}| = 1$ while $|\lambda| = 0$; $|\varnothing| = 0$. Note also $\varnothing \ne \{\lambda\}$: the empty language has no strings, the second has one (the empty string).
:::

### Standard set operations

Languages are sets, so the usual operations apply:
 $$\begin{gathered} \{a, ab, aaaa\} \cup \{bb, ab\} = \{a, ab, bb, aaaa\} \\[4pt] \{a, ab, aaaa\} \cap \{bb, ab\} = \{ab\} \\[4pt] \{a, ab, aaaa\} - \{bb, ab\} = \{a, aaaa\} \end{gathered}$$

**Complement:** $\bar L = \Sigma^* - L$, e.g. $\overline{\{a, ba\}} = \{\lambda, b, aa, ab, bb, aaa, \dots\}$.

### Reverse and concatenation

:::definition[Reverse and concatenation of languages]
$$L^R = \{\, w^R : w \in L \,\}, \qquad L_1 L_2 = \{\, xy : x \in L_1,\ y \in L_2 \,\}$$
- $\{ab, aab, baba\}^R = \{ba, baa, abab\}$; $\quad \{a^n b^n : n \ge 0\}^R = \{b^n a^n : n \ge 0\}$.
- $\{a, ab, bab\}\{b, aa\} = \{ab, aaa, abb, abaa, babb, babaa\}$.
:::

### Powers, star closure, positive closure

:::definition[Powers and closures]
$$
L^n = \underbrace{L L \cdots L}_{n}, \qquad L^0 = \{\lambda\}, \qquad L^* = L^0 \cup L^1 \cup L^2 \cup \cdots, \qquad L^+ = L^1 \cup L^2 \cup \cdots
$$
- $\{a,b\}^3 = \{a,b\}\{a,b\}\{a,b\} = \{aaa, aab, aba, abb, baa, bab, bba, bbb\}$; $\quad \{a, bb, aaa\}^0 = \{\lambda\}$.
- For $L = \{a^n b^n : n \ge 0\}$: $L^2 = \{a^n b^n a^m b^m : n, m \ge 0\}$, e.g. $aabbaaabbb \in L^2$.
- The star and plus closures of $\{a, bb\}$, grouped by the number of factors:

  $$
  \begin{aligned} \{a, bb\}^* &= \{\lambda,\ a, bb,\ aa, abb, bba, bbbb, \\ &\qquad aaa, aabb, abba, abbbb, \dots\} \\ \{a, bb\}^+ &= \{a, bb,\ aa, abb, bba, bbbb, \\ &\qquad aaa, aabb, abba, abbbb, \dots\} \end{aligned}
  $$
:::

::::exercise[Closure and star]
When is $L^+ = L^* - \{\lambda\}$?

:::solution
Exactly when $\lambda \notin L$. Every string of $L^+$ is a string of $L^*$, and the only string
that can be in $L^*$ but not in $L^+$ is $\lambda$ (from $L^0$). If $\lambda \in L$, then
$\lambda \in L^1 \subseteq L^+$ as well, and removing it from $L^*$ removes a string that $L^+$ has.
:::
::::

```sim
id: language-tool
custom: true
mode: tool
kind: languages
defaults:
  L1: a, bb
  L2: b, aa
  n: '4'
note: Finite languages typed as comma-separated strings (λ for the empty string). Defaults show {a, bb}* and {a, bb}⁺ truncated at length 4. Try L₁ = a, ab, bab and L₂ = b, aa for the concatenation example, or L₁ = a, ab, aaaa and L₂ = bb, ab for the set operations.
...
```

```python
# Concatenation, powers and (truncated) star closure implemented directly from the
# definitions; the examples reproduce the ones above.
from itertools import product

def concat(L1, L2):
    return {x + y for x in L1 for y in L2}

def power(L, n):
    result = {""}                       # L^0 = {λ}
    for _ in range(n):
        result = concat(result, L)
    return result

def star(L, max_len):
    """L* restricted to strings of length <= max_len (L* itself is infinite)."""
    out, layer = {""}, {""}
    while True:
        layer = {w for w in concat(layer, L) if len(w) <= max_len}
        if not layer or layer <= out:
            return out
        out |= layer

L1, L2 = {"a", "ab", "aaaa"}, {"bb", "ab"}
print(L1 | L2, L1 & L2, L1 - L2)                    # union, intersection, difference
print({w[::-1] for w in {"ab", "aab", "baba"}})      # reverse: {'ba', 'baa', 'abab'}
print(sorted(concat({"a", "ab", "bab"}, {"b", "aa"}), key=len))
print(sorted(power({"a", "b"}, 3)))                  # 8 strings of length 3
print(sorted(star({"a", "bb"}, 4), key=len))         # λ, a, bb, aa, abb, bba, bbbb, aaa, ...
plus = star({"a", "bb"}, 4) - {""}                   # L+ = L* - {λ} because λ ∉ L
print(sorted(plus, key=len))
```

:::insight
A language is a set of strings, so ∪, ∩, − and complement come for free; the new operations are concatenation L₁L₂, powers Lⁿ, and the closures L* (all finite concatenations, including λ) and L⁺ (at least one factor).
:::

:::equations
- *Concatenation of languages*: $L_1 L_2 = \{\, xy : x \in L_1,\ y \in L_2 \,\}$ — Every string of L₁ followed by every string of L₂.
- *Powers*: $L^0 = \{\lambda\}, \qquad L^{n} = L^{n-1} L$ — Recursive definition of Lⁿ.
- *Closures*: $\begin{gathered} L^* = \bigcup_{n \ge 0} L^n, \qquad L^+ = \bigcup_{n \ge 1} L^n \\[4pt] L^+ = L^* - \{\lambda\} \iff \lambda \notin L \end{gathered}$ — Star always contains λ; plus contains λ only if L does.
:::

## Grammars, Derivations & L(G)

### Grammars generate languages

A grammar is a set of **production rules** that rewrite *variables* into strings of variables and *terminals*. Example: a fragment of English.

:::machine[$G_1$: a fragment of English]
```text
sentence    → noun_phrase predicate
noun_phrase → article noun
predicate   → verb
article     → a | the
noun        → cat | dog
verb        → runs | walks
```
:::

:::trace[Deriving “the dog walks” in $G_1$]
$$
\text{sentence} \Rightarrow \text{noun\_phrase predicate} \Rightarrow \text{noun\_phrase verb} \Rightarrow \text{article noun verb} \Rightarrow \text{the noun verb} \Rightarrow \text{the dog verb} \Rightarrow \text{the dog walks}
$$
:::

Similarly “a cat runs”. The language of this grammar is the 8 sentences $\{$“a cat runs”, “a cat walks”, “the cat runs”, “the cat walks”, “a dog runs”, “a dog walks”, “the dog runs”, “the dog walks”$\}$.

**Notation.** In a rule such as $\text{noun} \to \text{cat}$, the left-hand side is a **variable** and $\text{cat}$ is a **terminal**.

### Another example: S → aSb, S → λ

::::example[What does $S \to aSb \mid \lambda$ derive?]
Derive $ab$ and $aabb$ from $S \to aSb$, $S \to \lambda$, and find the language of the grammar.

:::solution
$$
S \Rightarrow aSb \Rightarrow ab \qquad S \Rightarrow aSb \Rightarrow aaSbb \Rightarrow aabb
$$

Each use of $S \to aSb$ adds one $a$ on the left and one $b$ on the right, and $S \to \lambda$ ends
the derivation: $S \Rightarrow aSb \Rightarrow aaSbb \Rightarrow aaaSbbb \Rightarrow aaabbb$, and so on.
The language is $L = \{\, a^n b^n : n \ge 0 \,\}$.
:::
::::

### Formal definition

:::definition[Grammar]
A grammar is $G = (V, T, S, P)$ where $V$ is the set of **variables**, $T$ the set of **terminal symbols**, $S \in V$ the **start variable**, and $P$ the set of **production rules**.
For the example: $V = \{S\}$, $T = \{a, b\}$, $P = \{S \to aSb,\ S \to \lambda\}$.
- A **sentential form** is a string that may contain variables and terminals: in $S \Rightarrow aSb \Rightarrow aaSbb \Rightarrow aaaSbbb \Rightarrow aaabbb$ the first four are sentential forms; the last one (terminals only) is a **sentence**.
- We write $S \overset{*}{\Rightarrow} aaabbb$ instead of spelling out the whole derivation. In general $w_1 \overset{*}{\Rightarrow} w_n$ if $w_1 \Rightarrow w_2 \Rightarrow \dots \Rightarrow w_n$; by default $w \overset{*}{\Rightarrow} w$ (zero steps). So $S \overset{*}{\Rightarrow} \lambda$, $S \overset{*}{\Rightarrow} ab$, $S \overset{*}{\Rightarrow} aabb$, $aaSbb \overset{*}{\Rightarrow} aaaaaSbbbbb$.
:::

:::definition[Language of a grammar]
For a grammar $G$ with start variable $S$,

$$
L(G) = \{\, w : S \overset{*}{\Rightarrow} w \,\}, \quad w \text{ a string of terminals}.
$$
:::

### Second grammar example

::::example[A second grammar]
Find $L(G)$ for $G$: $\; S \to Ab, \quad A \to aAb, \quad A \to \lambda$.

:::solution
Some derivations:

$$
S \Rightarrow Ab \Rightarrow b \qquad S \Rightarrow Ab \Rightarrow aAbb \Rightarrow abb \qquad S \Rightarrow Ab \Rightarrow aAbb \Rightarrow aaAbbb \Rightarrow aabbb
$$

$A$ derives $a^n b^n$ exactly as $S$ did in the previous grammar, and $S \to Ab$ appends one more
$b$. In general $S \overset{*}{\Rightarrow} a^n b^n b$, so $L(G) = \{\, a^n b^n b : n \ge 0 \,\}$.
:::
::::

```sim
id: derivation
custom: true
mode: derive
grammar: anbn
target: aabb
note: 'JFLAP-style derivation: choose a grammar and a target string, then step through the leftmost derivation (Step ▶) or animate it (▶ Play, with speed control). The variable about to be rewritten is underlined; a string outside L(G) is reported as not derivable. Try aab on the first grammar, or “the dog walks” on the English grammar.'
```

```python
# A tiny brute-force parser: breadth-first search over sentential forms, always
# expanding the leftmost variable — the same idea the simulator uses. It finds S ⇒ aSb
# ⇒ aaSbb ⇒ aabb and reports None for strings outside L(G).
from collections import deque

def derive(rules, start, target):
    """Breadth-first search for a leftmost derivation start =>* target.
    rules: list of (lhs, rhs) with rhs a tuple of symbols; variables are the lhs symbols."""
    variables = {lhs for lhs, _ in rules}
    queue, seen = deque([((start,), [(start,)])]), {(start,)}
    while queue:
        form, path = queue.popleft()
        if form == target:
            return path
        terminals = [s for s in form if s not in variables]
        if len(terminals) > len(target):            # can only grow -> prune
            continue
        i = next((k for k, s in enumerate(form) if s in variables), None)
        if i is None:
            continue
        for lhs, rhs in rules:
            if lhs == form[i]:
                nf = form[:i] + rhs + form[i+1:]
                if nf not in seen:
                    seen.add(nf); queue.append((nf, path + [nf]))
    return None

G1 = [("S", ("a", "S", "b")), ("S", ())]                       # S -> aSb | λ
G2 = [("S", ("A", "b")), ("A", ("a", "A", "b")), ("A", ())]    # S -> Ab, A -> aAb | λ

print("  =>  ".join("".join(f) or "λ" for f in derive(G1, "S", tuple("aabb"))))
print([("".join(f) or "λ") for f in derive(G2, "S", tuple("aabbb"))])
print(derive(G1, "S", tuple("aab")))                            # None: aab ∉ L(G1)
```

:::note[A convenient notation]
Rules with the same left-hand side are combined with $|$: $\; A \to aAb \mid \lambda$, $\; \text{article} \to a \mid \text{the}$.
:::

:::insight
A derivation is a sequence of rewriting steps S ⇒ … ⇒ w, each replacing one variable by the right-hand side of a rule; L(G) is the set of all terminal strings reachable this way. The same language can have many grammars — and many derivations of the same string.
:::

:::equations
- *Grammar*: $G = (V, T, S, P)$ — Variables, terminals, start variable, productions.
- *Derivation relation*: $w_1 \overset{*}{\Rightarrow} w_n \iff w_1 \Rightarrow w_2 \Rightarrow \dots \Rightarrow w_n \quad (\text{and } w \overset{*}{\Rightarrow} w)$ — Zero or more derivation steps.
- *Language of a grammar*: $L(G) = \{\, w \in T^* : S \overset{*}{\Rightarrow} w \,\}$ — All terminal strings derivable from S.
- *The two example grammars*: $\begin{gathered} S \to aSb \mid \lambda \quad\Rightarrow\quad L(G) = \{a^n b^n : n \ge 0\} \\[4pt] S \to Ab,\ A \to aAb \mid \lambda \quad\Rightarrow\quad L(G) = \{a^n b^n b : n \ge 0\} \end{gathered}$ — The two grammars of the examples.
:::

