---
title: Context-free grammars and languages
order: 7
status: detailed
weeks: [6]
introduces: [context-free-grammar, parse-tree, parsing]
requires:
  - {concept: grammar, strength: hard}
  - {concept: regular-grammar, strength: soft}
  - {concept: tree, strength: soft}
  - {concept: proof-techniques, strength: soft}
reinforces: []
---

A regular grammar keeps its one variable at the end of the string, so it can only grow in one
direction, and that is why it cannot count. Lift the restriction: let a production put anything
on its right-hand side. A variable can now grow on both sides at once and keep two distant parts
of a string in step. The languages generated this way are the **context-free languages**. They
are the first class beyond the regular languages, and the class in which programming languages
are described.

## Context-Free Grammars

### From regular to context-free

In a right-linear grammar every production has the form $A \to xB$ or $A \to x$. The grammar for
$a^n b^n$ of the earlier units breaks this form, and it is the simplest grammar that does:
$S \to aSb \mid \lambda$. Each use of the rule writes one $a$ on the left and one $b$ on the right,
so the two counts cannot drift apart. No finite automaton can do this, as the pumping lemma showed.

:::definition[Context-free grammar]
A grammar $G = (V, T, S, P)$ is **context-free** if every production has the form
$$A \to x, \qquad A \in V, \quad x \in (V \cup T)^* .$$
:::

:::definition[Context-free language]
A language $L$ is **context-free** if there is a context-free grammar $G$ with $L = L(G)$.
:::

The left-hand side is one variable and nothing else. That is what the name means: $A$ may be
rewritten wherever it stands, whatever is around it, so the rewriting does not depend on the
**context**.

:::theorem[Regular languages are context-free]
Every regular language is context-free, and the inclusion is proper.
:::

A right-linear grammar is already context-free, so every regular language is context-free. The
language $\{a^n b^n : n \ge 0\}$ is context-free and not regular, so the inclusion is proper.

### Reading a grammar

::::example[What does this grammar generate?]
Find $L(G)$ for $G$: $\; S \to aSc \mid B, \quad B \to bBc \mid \lambda$.

:::solution
Each use of $S \to aSc$ pairs one $a$ with one $c$; then $S \to B$ switches to the inner part, and
each use of $B \to bBc$ pairs one $b$ with one $c$. The derivation

$$S \Rightarrow aSc \Rightarrow aBc \Rightarrow abBcc \Rightarrow abcc$$

shows the shape: all the $a$'s, then all the $b$'s, then as many $c$'s as $a$'s and $b$'s together.

$$L(G) = \{a^n b^m c^{n + m} : n, m \ge 0\}.$$
:::
::::

```sim
id: cfg-derive
custom: true
mode: derive
grammars:
- anbn
- anbnb
- rl-linear
- english
grammar: anbn
target: aaabbb
note: 'Leftmost derivations by search. The first three grammars generate the same kind of matched counts; the third is linear, with its one variable moving between the two sides. A string outside the language is reported as not derivable: try aab.'
```

```python
# Every string of length at most n that a context-free grammar generates, by breadth-first
# search over sentential forms. It is a check for a grammar you have just written: compare
# the list with the language you meant. Forms longer than n + 4 are cut off, so raise that
# margin for a grammar with many nullable variables. Output:
# ['', 'ac', 'bc', 'aacc', 'abcc', 'bbcc']
# ['', 'ab', 'ba', 'aabb', 'abab', 'abba', 'baab', 'baba', 'bbaa']
from collections import deque

def language(rules, start, n):
    """rules: dict variable -> list of right-hand sides, written as strings."""
    out, seen, queue = set(), {start}, deque([start])
    while queue:
        form = queue.popleft()
        i = next((k for k, c in enumerate(form) if c in rules), None)
        if i is None:                                  # no variable left: a sentence
            out.add(form)
            continue
        for rhs in rules[form[i]]:
            new = form[:i] + rhs + form[i + 1:]
            terminals = sum(c not in rules for c in new)
            if terminals <= n and len(new) <= n + 4 and new not in seen:
                seen.add(new)
                queue.append(new)
    return sorted(out, key=lambda w: (len(w), w))

print(language({"S": ["aSc", "B"], "B": ["bBc", ""]}, "S", 4))
print(language({"S": ["aSbS", "bSaS", ""]}, "S", 4))
```

### Patterns for writing a grammar

A grammar is written from the outside in: ask what is added on the outside at each step, and
what is left in the middle.

:::steps[Writing a context-free grammar]
1. Look for **matched parts**, and write one rule that adds both at once: $S \to aSb$, or $S \to aSbb$ for twice as many.
2. Look for **independent parts** in sequence, and give each its own variable: $S \to AB$.
3. Split a **union** into one start rule per case: $S \to S_1 \mid S_2$.
4. Fill the **middle** with the base case: $\lambda$, or whatever may stand between the matched parts.
5. Test $\lambda$, the shortest strings, and a string that must not be generated.
:::

| Language | Grammar | Pattern |
|---|---|---|
| $\{a^n c b^n : n \ge 0\}$ | $S \to aSb \mid c$ | matched pair around a middle |
| palindromes over $\{a, b\}$ | $S \to aSa \mid bSb \mid a \mid b \mid \lambda$ | mirror image |
| balanced brackets | $S \to (S)S \mid \lambda$ | one bracket pair, then the rest |
| $\{a^n b^m c^{n + m}\}$ | $S \to aSc \mid B$, $B \to bBc \mid \lambda$ | nested matching |
| $\{a^i b^j : i \le j \le 2i\}$ | $S \to aSb \mid aSbb \mid \lambda$ | each step chooses a ratio |

::::exercise[Unequal counts]
Give a grammar for $L = \{a^i b^j : i \ne j\}$.

:::solution
A string of $L$ has either more $a$'s or more $b$'s. Take the matched core $T \to aTb \mid \lambda$
and put at least one extra letter on one side:
$$S \to AT \mid TB, \qquad T \to aTb \mid \lambda, \qquad A \to aA \mid a, \qquad B \to bB \mid b .$$
$AT$ gives $a^{k + n} b^n$ with $k \ge 1$, and $TB$ gives $a^n b^{n + k}$. The string $\lambda$ and
every $a^n b^n$ are not generated, as required.
:::
::::

::::exercise[Strings that are not palindromes]
Give a grammar for the strings over $\{a, b\}$ that are **not** palindromes.

:::solution
Peel matching letters from both ends. A non-palindrome is a palindromic shell around one mismatched
pair, with anything in between:
$$S \to aSa \mid bSb \mid aTb \mid bTa, \qquad T \to aT \mid bT \mid \lambda .$$
The complement of a language is not usually this easy: there is no such trick for the complement of
every context-free language.
:::
::::

### Proving that a grammar is right

To prove $L(G) = L$, prove two inclusions. Everything generated is in $L$: follow the rules.
Everything in $L$ is generated: induct on the length of the string.

::::example[Equal numbers of $a$'s and $b$'s]
Prove that $S \to aSbS \mid bSaS \mid \lambda$ generates $L = \{w \in \{a, b\}^* : n_a(w) = n_b(w)\}$.

:::solution
**$L(G) \subseteq L$.** Each rule adds one $a$ and one $b$, or nothing, so every sentential form has
as many $a$'s as $b$'s.

**$L \subseteq L(G)$.** Induct on $|w|$. If $|w| = 0$, use $S \to \lambda$. Otherwise suppose $w$ starts
with $a$ (the other case is symmetric), and read $w$ from the left, keeping the difference
$d = n_a - n_b$ of the prefix read so far. It starts at $1$ after the first symbol, ends at $0$, and
changes by $1$ at each step, so there is a first prefix with $d = 0$. That prefix ends in $b$ and has
the form $axb$, so $w = axby$. Both $x$ and $y$ have equal counts and are shorter than $w$, so by
induction $S \overset{*}{\Rightarrow} x$ and $S \overset{*}{\Rightarrow} y$. Then

$$S \Rightarrow aSbS \overset{*}{\Rightarrow} axbS \overset{*}{\Rightarrow} axby = w .$$
:::
::::

:::insight
The left-hand side of a context-free production is one variable, so each variable derives its part
of the string on its own, and the parts only meet by being written next to each other. That gives
a grammar its power, matched pairs at any depth, and also its limit: it can match one thing with
one other thing, but not three counts together.
:::

:::equations
- *Context-free rule*: $A \to x$ with $A \in V$ and $x \in (V \cup T)^*$.
- *Regular inside context-free*: regular $\subsetneq$ context-free, witness $\{a^n b^n\}$.
- *Grammar patterns*: $S \to aSb$ (matched), $S \to AB$ (sequence), $S \to S_1 \mid S_2$ (union).
:::

## Derivations

### Leftmost and rightmost

A sentential form with several variables can be rewritten in several orders. Take

$$S \to XY, \qquad X \to aXb \mid \lambda, \qquad Y \to cY \mid \lambda .$$

:::definition[Leftmost and rightmost derivations]
A derivation is **leftmost** if every step rewrites the leftmost variable of the sentential form, and
**rightmost** if every step rewrites the rightmost variable.
:::

:::trace[Leftmost derivation of $abc$]
$$
S \Rightarrow XY \Rightarrow aXbY \Rightarrow abY \Rightarrow abcY \Rightarrow abc
$$
:::

:::trace[Rightmost derivation of $abc$]
$$
S \Rightarrow XY \Rightarrow XcY \Rightarrow Xc \Rightarrow aXbc \Rightarrow abc
$$
:::

The two use the same productions in a different order. The order is a detail of the writing: both
describe the same structure, and that structure is a tree.

### Derivation trees

:::definition[Derivation tree]
A **derivation tree** (or parse tree) of $G = (V, T, S, P)$ is an ordered tree in which
- the root is labelled $S$;
- every interior node is labelled by a variable;
- every leaf is labelled by a terminal or by $\lambda$, and a $\lambda$ leaf has no sibling;
- a node labelled $A$ with children $x_1, \dots, x_n$ from left to right requires a production $A \to x_1 \cdots x_n$ in $P$.

The **yield** of the tree is its leaves read from left to right, with $\lambda$ dropped.
:::

Both derivations above have this one tree, with yield $abc$:

```text
          S
        /   \
       X     Y
     / | \   | \
    a  X  b  c  Y
       |        |
       λ        λ
```

Stop a derivation early and the tree has variables among its leaves: it is a **partial derivation
tree**, and its yield is a sentential form. After three steps of the leftmost derivation the yield
is $abY$.

:::theorem[Trees and derivations]
For a context-free grammar $G$ and a string $w \in T^*$: $w \in L(G)$ if and only if $G$ has a
derivation tree with yield $w$. Each tree corresponds to exactly one leftmost derivation and exactly
one rightmost derivation.
:::

To read the leftmost derivation off a tree, always expand the leftmost node that has not been
expanded yet. There is no choice left, so the tree fixes the derivation. The other way round, each
step of a derivation adds the children of one node.

:::insight
A derivation is a sequence and a tree is a structure. Many derivations can share a tree, since they
only differ in the order of independent steps. A tree is the real object, and a **leftmost**
derivation is a way to write down a tree as a line of text.
:::

:::equations
- *Leftmost derivation*: every step rewrites the leftmost variable; one per tree.
- *Yield*: leaves of the tree from left to right, $\lambda$ dropped.
:::

## Parsing

### Exhaustive search

So far a grammar has been used to generate strings. **Parsing** is the opposite direction: given
$G$ and $w$, find a derivation of $w$, or report that there is none. The basic question inside it is
the **membership** problem: is $w \in L(G)$?

The direct method is top-down: list every sentential form that one step can produce, then every
form that two steps can produce, and so on, discarding the forms that can no longer become $w$.

::::example[Exhaustive search on a small grammar]
Parse $w = abb$ with $S \to SS \mid aS \mid b$, using leftmost derivations. A form is discarded if its
terminals before the first variable disagree with $w$, or if it is longer than $w$ (no rule here
makes a form shorter).

:::solution
| Round | New forms kept | Discarded |
|---|---|---|
| 1 | $SS$, $aS$ | $b$ (a sentence, not $w$) |
| 2 | $SSS$, $aSS$ (twice) | $bS$, $aaS$, $ab$ |
| 3 | $abS$ (twice) | forms of length 4; those starting $aa$ or $b$ |
| 4 | $abb$ | |

Round 4 reaches $w$, and following the forms back gives the derivation
$$S \Rightarrow SS \Rightarrow aSS \Rightarrow abS \Rightarrow abb .$$
Note the two copies of $aSS$ in round 2, one from $SS$ and one from $aS$: this grammar has two
derivations of $abb$, a warning for the next part.
:::
::::

Search can run forever on a string not in the language if $G$ has rules that do not grow the form.
The bound below removes that danger; the next unit shows that those rules can always be removed.

:::theorem[Termination of exhaustive search]
If $G$ has no productions $A \to \lambda$ and none of the form $A \to B$, then exhaustive search
decides $w \in L(G)$ within $2|w|$ rounds.
:::

Every other rule either lengthens the sentential form or adds a terminal. A form longer than $w$, or
with more terminals than $w$, can be thrown away, so each surviving derivation has at most $|w|$
steps of each kind.

The price is exponential: with $k$ rules there can be $k^r$ forms in round $r$, so

$$k + k^2 + \cdots + k^{2|w|} = O(k^{2|w|}) .$$

:::remark
There are better algorithms. In the next unit, the CYK algorithm decides membership for any
context-free grammar in time proportional to $|w|^3$, once the grammar is in Chomsky normal form.
:::

### S-grammars

For some grammars the search has no choice to make at all.

:::definition[S-grammar]
A context-free grammar is an **s-grammar** (simple grammar) if every production has the form
$A \to ax$ with $a \in T$ and $x \in V^*$, and every pair $(A, a)$ occurs in at most one production.
:::

With the leftmost variable $A$ and the next input symbol $a$ known, at most one rule applies. Parsing
is one pass over $w$ with $|w|$ steps.

:::trace[$S \to aSB \mid c$, $B \to b$ parses $aacbb$ without a choice]
$$
S \Rightarrow aSB \Rightarrow aaSBB \Rightarrow aacBB \Rightarrow aacbB \Rightarrow aacbb
$$
:::

Real compilers need more general grammars than s-grammars, but the same idea, choosing the rule from
the next symbol, is behind the fast parsers they use (the LL and LR families).

:::insight
Parsing is search, and the cost of parsing is the cost of the choices. An s-grammar has no choices
and parses in linear time; a general grammar searched naively takes exponential time; between the
two, a normal form and a table bring the cost down to cubic.
:::

:::equations
- *Exhaustive search bound*: no $A \to \lambda$, no $A \to B$ $\Rightarrow$ at most $2|w|$ rounds, cost $O(k^{2|w|})$.
- *S-grammar*: $A \to ax$ with $x \in V^*$, each pair $(A, a)$ at most once; parsing takes $|w|$ steps.
:::

## Ambiguity

### Two trees for one string

:::definition[Ambiguous grammar]
A context-free grammar $G$ is **ambiguous** if some $w \in L(G)$ has two or more different derivation
trees. Equivalently, $w$ has two different leftmost derivations, or two different rightmost
derivations.
:::

Different derivations alone prove nothing: the leftmost and rightmost derivations of $abc$ above are
different, and the tree is the same. Ambiguity means different **trees**.

Why it matters: a tree is how a compiler reads a program, so two trees can mean two meanings.

::::example[An ambiguous subtraction]
Show that $E \to E - E \mid a$ is ambiguous, and find what the two trees compute for $5 - 3 - 1$.

:::solution
The string $a - a - a$ has two leftmost derivations:

$$E \Rightarrow E - E \Rightarrow E - E - E \Rightarrow a - E - E \Rightarrow a - a - E \Rightarrow a - a - a$$

$$E \Rightarrow E - E \Rightarrow a - E \Rightarrow a - E - E \Rightarrow a - a - E \Rightarrow a - a - a$$

In the first the left operand of the top minus is itself a subtraction, in the second the right
operand is. Here are the trees:

```text
        E                 E
      / | \             / | \
     E  -  E           E  -  E
   / | \   |           |   / | \
  E  -  E  a           a  E  -  E
  |     |                 |     |
  a     a                 a     a
```

The left tree reads $(5 - 3) - 1 = 1$ and the right tree reads $5 - (3 - 1) = 3$.
:::
::::

### Removing ambiguity

An ambiguous grammar can often be replaced by an unambiguous grammar for the same language. The
trick is to give each level of structure its own variable, so that only one tree fits.

For the subtraction, let the right operand be a variable that cannot contain a minus:

$$E \to E - T \mid T, \qquad T \to a .$$

The grammar generates the same strings, and now $a - a - a$ has one tree, the left one. The rule
$E \to E - T$ recurses on the **left**, so subtraction associates to the left.

The same layering gives precedence. For $+$, $*$ and brackets:

$$E \to E + T \mid T, \qquad T \to T * F \mid F, \qquad F \to (E) \mid a .$$

An $E$ is a sum of terms, a $T$ is a product of factors, and a factor is an atom or a bracket. A $+$
cannot appear inside a term without brackets, so $*$ binds tighter than $+$.

:::trace[The only leftmost derivation of $a + a * a$]
$$
E \Rightarrow E + T \Rightarrow T + T \Rightarrow F + T \Rightarrow a + T \Rightarrow a + T * F \Rightarrow a + F * F \Rightarrow a + a * F \Rightarrow a + a * a
$$
:::

::::example[The dangling else]
Let $S \to \texttt{if}\ c\ \texttt{then}\ S \mid \texttt{if}\ c\ \texttt{then}\ S\ \texttt{else}\ S \mid x$. Show
that it is ambiguous, and repair it so that an `else` belongs to the nearest `if`.

:::solution
The string `if c then if c then x else x` has two trees: the `else` can belong to the inner `if` or
to the outer one. Split statements into **matched** ones ($M$, every `if` has its `else`) and
**unmatched** ones ($U$):
$$S \to M \mid U, \qquad M \to \texttt{if}\ c\ \texttt{then}\ M\ \texttt{else}\ M \mid x,$$
$$U \to \texttt{if}\ c\ \texttt{then}\ S \mid \texttt{if}\ c\ \texttt{then}\ M\ \texttt{else}\ U .$$
Only a matched statement can stand between `then` and `else`, so an `else` can never skip an open
`if`. The string now has one tree, with the `else` on the inner `if`.
:::
::::

### Inherent ambiguity

Not every ambiguous grammar has an unambiguous replacement.

:::definition[Inherently ambiguous language]
A context-free language is **inherently ambiguous** if every grammar that generates it is ambiguous.
:::

The standard witness is $L = \{a^i b^j c^k : i = j \text{ or } j = k\}$. It is a union, so a grammar
comes at once:
$$S \to XC \mid AY, \quad X \to aXb \mid \lambda, \quad C \to cC \mid \lambda, \quad A \to aA \mid \lambda, \quad Y \to bYc \mid \lambda .$$
A string $a^n b^n c^n$ belongs to both halves and has one tree through $XC$ and another through $AY$.
The fact, which takes much more work to prove, is that this overlap cannot be avoided by any grammar.

:::caution[Three different claims]
"This derivation differs from that one" says nothing. "This grammar is ambiguous" is a claim about a
grammar: show one string with two trees. "This language is inherently ambiguous" is a claim about
every grammar of the language, and is far stronger. And there is no algorithm that decides whether a
given grammar is ambiguous, a fact that comes back in the last unit.
:::

:::insight
Ambiguity belongs to a grammar, not to a language, unless the language is inherently ambiguous. The
cure is structure: one variable per level of precedence, recursion on the side of the association,
and a separate variable for each situation that must not be confused.
:::

:::equations
- *Ambiguous*: some $w$ has two trees, equivalently two leftmost derivations.
- *Layered expressions*: $E \to E + T \mid T$, $T \to T * F \mid F$, $F \to (E) \mid a$.
- *Inherently ambiguous*: $\{a^i b^j c^k : i = j \text{ or } j = k\}$.
:::

## Grammars and Programming Languages

### Backus-Naur form

Programming languages are defined by context-free grammars, usually written in **Backus-Naur form**
(BNF): variables are names in angle brackets, $::=$ stands for $\to$, $\mid$ separates the
alternatives, and terminals are the keywords and symbols of the language.

```text
<statement>  ::= <name> = <expression> ;
              |  while ( <expression> ) <statement>
              |  { <statements> }
<statements> ::= <statement> <statements>  |  λ
<expression> ::= <expression> + <term>  |  <term>
<term>       ::= <name>  |  <number>  |  ( <expression> )
```

This is an ordinary context-free grammar with long variable names: `<expression>` and `<term>` are
the $E$ and $T$ of the last part. Brackets, blocks and nested statements are the matched pairs of
this unit, and they are the reason regular expressions cannot describe a programming language,
even if they can describe its individual words.

### Syntax and semantics

A grammar decides what is **syntactically** correct, and not all of what makes a program acceptable.
The line `int x = "hello";` fits the grammar of many languages and is still rejected, because the
types do not match. Rules such as "a name must be declared before it is used" compare two distant
parts of a program in a way that no context-free grammar can express, and compilers check them in a
separate phase, after parsing.

:::insight
A compiler splits its work by language class: regular expressions for the words of the program,
a context-free grammar for its structure, and ordinary code for everything beyond. Each stage uses
the weakest tool that is enough, because the weaker the class, the faster and simpler the recogniser.
:::

:::equations
- *BNF*: $::=$ for $\to$, $\mid$ for alternatives, $\langle\text{name}\rangle$ for a variable.
- *Syntax against semantics*: syntax is what a grammar can check; types and declarations are not.
:::
