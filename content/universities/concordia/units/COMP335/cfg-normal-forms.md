---
title: Simplification of CFGs and normal forms
order: 8
status: detailed
weeks: [8]
introduces: [grammar-normal-forms]
requires:
  - {concept: context-free-grammar, strength: hard}
  - {concept: parse-tree, strength: soft}
reinforces:
  - {concept: parsing, perspective: "the CYK algorithm: membership in cubic time, from a table over the substrings of w"}
---

A context-free grammar may have any right-hand side at all, which makes grammars easy to write and
hard to reason about. This unit cleans a grammar without changing its language: first it removes
the productions that do nothing, then it puts every remaining production into a fixed shape. The
two shapes are **Chomsky normal form**, in which every derivation tree is binary, and **Greibach
normal form**, in which every step writes exactly one terminal. Chomsky normal form leads straight
to a cubic parsing algorithm, and both forms make the proofs of the next units much shorter.

## Transforming a Grammar

### Equivalent grammars

Two grammars are **equivalent** if they generate the same language. Every transformation here
replaces a grammar by an equivalent one, with one exception: a grammar with no $\lambda$-productions
cannot generate $\lambda$. So the results are stated for $L - \{\lambda\}$, and $\lambda$ is handled
separately at the end.

### The substitution rule

The basic move is to replace a variable by what it can become.

:::theorem[Substitution rule]
Let $G$ contain a production $A \to x_1 B x_2$ with $A \ne B$, and let $B \to y_1 \mid y_2 \mid \cdots \mid y_n$
be all the productions of $B$. Replacing $A \to x_1 B x_2$ by
$$A \to x_1 y_1 x_2 \mid x_1 y_2 x_2 \mid \cdots \mid x_1 y_n x_2$$
gives an equivalent grammar.
:::

The new rules do in one step what the old ones did in two. In the other direction, any derivation
that used $A \to x_1 B x_2$ later rewrote that $B$ by some $B \to y_i$, and that pair of steps can be
done at once.

::::example[Substituting a variable]
In $S \to aB \mid Bb$, $B \to c \mid aS$, substitute for $B$ in the rules of $S$.

:::solution
Each rule that mentions $B$ turns into two:
$$S \to ac \mid aaS \mid cb \mid aSb, \qquad B \to c \mid aS .$$
The rules of $B$ are still there, but nothing refers to $B$ any more. It has become useless, and the
next part removes such variables.
:::
::::

### Three kinds of rule to remove

| Rule | Example | Why remove it |
|---|---|---|
| useless | a rule with a variable that never finishes, or that $S$ never reaches | it contributes no string |
| $\lambda$-production | $A \to \lambda$ | it shrinks sentential forms, so search has no bound |
| unit-production | $A \to B$ | it does not change the length, and can form cycles |

:::insight
Every transformation here is a substitution in disguise: a derivation that went through the
removed rule is shortened to one that does not. The language stays the same because derivations are
merged, never deleted.
:::

:::equations
- *Substitution*: $A \to x_1 B x_2$ with $B \to y_1 \mid \cdots \mid y_n$ becomes $A \to x_1 y_1 x_2 \mid \cdots \mid x_1 y_n x_2$.
:::

## Useless Productions

### Useful variables

:::definition[Useful variable]
A variable $A$ of $G$ is **useful** if some $w \in L(G)$ has a derivation through it:
$$S \overset{*}{\Rightarrow} xAy \overset{*}{\Rightarrow} w, \qquad x, y \in (V \cup T)^*.$$
Otherwise $A$ is **useless**. A production is useless if it contains a useless variable.
:::

A variable can be useless in two ways, and each has its own test: it may never finish (no terminal
string comes out of it), or it may never be reached from $S$.

:::algorithm[Remove useless productions]
**Input:** a context-free grammar $G$ with $L(G) \ne \varnothing$.\
**Output:** an equivalent grammar with no useless variable.

1. Find the **generating** variables. Start with the variables that have a rule whose right-hand side is all terminals (or $\lambda$).
2. Add every variable with a rule whose right-hand side contains only terminals and generating variables. Repeat until nothing changes.
3. Delete every other variable and every production that mentions one.
4. Draw the **dependency graph** of what is left: an edge $A \to B$ when $B$ occurs on the right of a rule of $A$.
5. Delete every variable that cannot be reached from $S$, with its productions.
:::

::::example[Removing useless productions]
Clean $S \to aS \mid AB \mid C$, $\;A \to aA \mid b$, $\;B \to bB$, $\;C \to cD \mid c$, $\;D \to dD$, $\;E \to eC$.

:::solution
**Generating.** Round 1: $A$ (rule $A \to b$) and $C$ (rule $C \to c$). Round 2: $S$ (rule $S \to C$)
and $E$ (rule $E \to eC$). Round 3: nothing new. $B$ and $D$ never finish, because each of their rules
contains the variable itself. Delete them and the rules $S \to AB$ and $C \to cD$:
$$S \to aS \mid C, \qquad A \to aA \mid b, \qquad C \to c, \qquad E \to eC .$$

**Reachable.** The dependency graph, with each edge labelled by the rule that makes it:

```automaton
type: nfa
states: S 60 150, C 220 150, A 380 60, E 380 150
start: S
trans: "S aS S; S C C; A aA A; E eC C"
```

Only $S$ and $C$ can be reached from $S$, so $A$ and $E$ go:
$$S \to aS \mid C, \qquad C \to c .$$
The language is $L(a^*c)$, as it was from the start.
:::
::::

:::caution[Generating first, reachable second]
The order matters. In $S \to AB \mid a$, $\;A \to b$, $\;B \to bB$, all three variables are reachable, so
testing reachability first deletes nothing. Testing generating then removes $B$ and the rule
$S \to AB$, and leaves $A$ unreachable but still in the grammar. Done the right way round,
the result is $S \to a$.
:::

:::insight
A useful variable is one that lies on a route from $S$ to a terminal string, which is why there are
two tests. The first looks from the terminals up, the second looks from $S$ down, and they are the
same two searches as for useful states of a finite automaton.
:::

:::equations
- *Useful*: $S \overset{*}{\Rightarrow} xAy \overset{*}{\Rightarrow} w$ with $w \in T^*$.
- *Order*: generating variables first, reachable variables second.
:::

## $\lambda$-Productions

### Nullable variables

:::definition[Nullable variable]
A variable $A$ is **nullable** if $A \overset{*}{\Rightarrow} \lambda$.
:::

A $\lambda$-production can be avoided by deciding, at the moment a nullable variable is written,
whether it will vanish. So every rule is copied with each subset of its nullable variables left out.

:::algorithm[Remove $\lambda$-productions]
**Input:** a context-free grammar $G$.\
**Output:** a grammar $G'$ with no $\lambda$-production and $L(G') = L(G) - \{\lambda\}$.

1. Mark every $A$ with a rule $A \to \lambda$.
2. Mark every $A$ with a rule whose right-hand side consists only of marked variables. Repeat until nothing changes. The marked variables are the nullable ones.
3. For each production $A \to x$, add every rule obtained by deleting some of the nullable variables in $x$.
4. Delete every $\lambda$-production, including any that step 3 has just created.
:::

::::example[Removing $\lambda$-productions]
Remove the $\lambda$-productions from
$S \to ABa \mid bC$, $\;A \to aA \mid \lambda$, $\;B \to bB \mid C$, $\;C \to cC \mid \lambda$.

:::solution
**Nullable.** Round 1: $A$ and $C$, from their $\lambda$-rules. Round 2: $B$, from $B \to C$. Then
nothing: $S$ has a terminal in each rule.

**Copies.** $S \to ABa$ has two nullable variables, so it gives four rules. $S \to bC$ gives two.
$A \to aA$ and $C \to cC$ give two each, and $B \to bB$ gives two. $B \to C$ would give $B \to C$ and
$B \to \lambda$, and the second is dropped.

$$S \to ABa \mid Aa \mid Ba \mid a \mid bC \mid b, \quad A \to aA \mid a, \quad B \to bB \mid b \mid C, \quad C \to cC \mid c .$$

$S$ is not nullable, so $\lambda$ was not in the language and nothing is lost.
:::
::::

:::remark
If $S$ is nullable, then $\lambda \in L(G)$ and the algorithm loses exactly that string. To keep it,
clean the grammar, then add a new start variable with $S_0 \to S \mid \lambda$. Every normal form below
allows this one exception, and from here on "a grammar for $L$" means a grammar for $L - \{\lambda\}$.
:::

:::caution[Copy every subset]
For a right-hand side with $k$ nullable variables, there are up to $2^k$ copies. The usual slip is to
delete all the nullable variables at once, or one at a time, and forget the mixed cases. In
$S \to AB$ with both nullable, the copies are $S \to AB \mid A \mid B$, not just $S \to AB$.
:::

:::insight
Removing $\lambda$-productions moves the decision earlier. In the old grammar a variable is written
down and later erased. In the new grammar it is never written.
:::

:::equations
- *Nullable*: $A \overset{*}{\Rightarrow} \lambda$; found by a fixed point starting from the rules $A \to \lambda$.
- *$\lambda$-free copies*: delete every subset of the nullable variables of each right-hand side.
:::

## Unit-Productions

### Following chains

:::definition[Unit-production]
A **unit-production** is a rule $A \to B$ with $A, B \in V$: one variable on each side.
:::

A chain of unit-productions only renames. So find every pair with $A \overset{*}{\Rightarrow} B$ by unit
steps alone, and copy the real rules of $B$ up to $A$.

:::algorithm[Remove unit-productions]
**Input:** a context-free grammar $G$ with no $\lambda$-production.\
**Output:** an equivalent grammar with no unit-production.

1. Draw a graph with an edge $A \to B$ for each unit-production. Find every pair $(A, B)$, $A \ne B$, with a path from $A$ to $B$.
2. Delete all the unit-productions.
3. For each such pair and each remaining rule $B \to y$, add $A \to y$.
:::

Rules of the form $A \to A$ can be dropped at once, and a cycle such as $B \to C$, $C \to B$ causes no
trouble, since the pairs are found on the graph and not by rewriting.

::::example[Removing unit-productions]
Remove the unit-productions from $S \to aA \mid B$, $\;A \to a$, $\;B \to C \mid bS$, $\;C \to B \mid cc$.

:::solution
The unit-productions are $S \to B$, $B \to C$ and $C \to B$, so the pairs are
$(S, B)$, $(S, C)$, $(B, C)$ and $(C, B)$. The non-unit rules are $S \to aA$, $A \to a$, $B \to bS$ and
$C \to cc$. Copying up:

| Variable | Own rules | From | Result |
|---|---|---|---|
| $S$ | $aA$ | $B$: $bS$; $C$: $cc$ | $S \to aA \mid bS \mid cc$ |
| $A$ | $a$ | | $A \to a$ |
| $B$ | $bS$ | $C$: $cc$ | $B \to bS \mid cc$ |
| $C$ | $cc$ | $B$: $bS$ | $C \to cc \mid bS$ |

Now $B$ and $C$ cannot be reached from $S$, and the useless-production step removes them, leaving
$S \to aA \mid bS \mid cc$, $A \to a$.
:::
::::

### The order of the three steps

:::steps[Cleaning a grammar]
1. Remove the $\lambda$-productions.
2. Remove the unit-productions.
3. Remove the useless productions.
:::

:::theorem[Clean grammars]
Every context-free language not containing $\lambda$ is generated by a grammar with no useless
productions, no $\lambda$-productions and no unit-productions.
:::

:::caution[Why that order]
Each step can create work for a later one, never for an earlier one. Removing $\lambda$-productions
can **create** unit-productions: $S \to AC$ with $C$ nullable gives $S \to A$. Removing unit-productions
can create useless variables, as $B$ and $C$ above. So $\lambda$ first, unit second, useless last.
:::

::::exercise[The whole cleanup]
Clean $S \to AB \mid bC$, $\;A \to aA \mid \lambda$, $\;B \to bB \mid D$, $\;C \to cC$, $\;D \to A \mid b$, $\;E \to aE \mid a$.

:::solution
**$\lambda$.** Nullable, by rounds: $A$, then $D$ (rule $D \to A$), then $B$, then $S$. The copies give
$$S \to AB \mid A \mid B \mid bC, \quad A \to aA \mid a, \quad B \to bB \mid b \mid D,$$
$$C \to cC, \quad D \to A \mid b, \quad E \to aE \mid a .$$
Since $S$ is nullable, the string $\lambda$ was in the language and has been lost.

**Unit.** Pairs: $(S, A)$, $(S, B)$, $(S, D)$, $(B, D)$, $(B, A)$, $(D, A)$. Copying up:
$$S \to AB \mid bC \mid aA \mid a \mid bB \mid b, \quad A \to aA \mid a, \quad B \to bB \mid b \mid aA \mid a,$$
$$C \to cC, \quad D \to aA \mid a \mid b, \quad E \to aE \mid a .$$

**Useless.** $C$ never finishes, so $C$ and $S \to bC$ go. Then $D$ and $E$ cannot be reached:
$$S \to AB \mid aA \mid a \mid bB \mid b, \quad A \to aA \mid a, \quad B \to bB \mid b \mid aA \mid a .$$
The language is $L(a^*b^*a^*) - \{\lambda\}$.
:::
::::

:::insight
After the cleanup every rule either makes a form longer or adds a terminal, and every variable is
used. That is the assumption of the search bound $2|w|$ from the last unit, so cleaning a grammar
proves that membership is decidable for all context-free languages.
:::

:::equations
- *Unit removal*: for $A \overset{*}{\Rightarrow} B$ by unit steps, each non-unit $B \to y$ gives $A \to y$.
- *Cleaning order*: $\lambda$-productions, then unit-productions, then useless productions.
:::

## Chomsky Normal Form

### Definition

:::definition[Chomsky normal form]
A context-free grammar is in **Chomsky normal form** (CNF) if every production is of the form
$$A \to BC \qquad\text{or}\qquad A \to a, \qquad A, B, C \in V, \quad a \in T .$$
:::

A derivation tree of a grammar in Chomsky normal form is a binary tree above its leaves. A string
of length $n$ has a derivation of exactly $2n - 1$ steps: $n - 1$ steps of the form $A \to BC$ grow the
form to $n$ variables, and $n$ steps of the form $A \to a$ turn them into terminals.

### Conversion

:::algorithm[Conversion to Chomsky normal form]
**Input:** a context-free grammar $G$ with $\lambda \notin L(G)$.\
**Output:** an equivalent grammar in Chomsky normal form.

1. Remove the $\lambda$-productions and then the unit-productions.
2. For each terminal $a$ that occurs in a right-hand side of length at least 2, add a new variable $T_a$ with the rule $T_a \to a$, and replace $a$ by $T_a$ in those right-hand sides.
3. Replace each rule $A \to C_1 C_2 \cdots C_n$ with $n \ge 3$ by a chain of new variables: $A \to C_1 V_1$, $V_1 \to C_2 V_2$, …, $V_{n - 2} \to C_{n - 1} C_n$.
:::

:::theorem[Chomsky normal form exists]
For every context-free grammar $G$ with $\lambda \notin L(G)$ there is an equivalent grammar in Chomsky
normal form.
:::

Step 2 leaves right-hand sides that are either one terminal or a string of variables. Step 3 only cuts
a long rule into pieces that are used in sequence. Removing useless productions first is not needed
for correctness, but it keeps the result smaller.

::::example[Converting to CNF]
Convert $S \to aSB \mid ab$, $\;B \to bcB \mid a$ to Chomsky normal form.

:::solution
There are no $\lambda$-productions and no unit-productions.

**Terminals.** Add $T_a \to a$, $T_b \to b$, $T_c \to c$ and replace the terminals in the long rules:
$$S \to T_a S B \mid T_a T_b, \qquad B \to T_b T_c B \mid a .$$
The rule $B \to a$ is already in the right form, and stays.

**Long rules.** $S \to T_a S B$ has three symbols, so $S \to T_a V_1$ with $V_1 \to SB$. Likewise
$B \to T_b T_c B$ becomes $B \to T_b V_2$ with $V_2 \to T_c B$.

$$S \to T_a V_1 \mid T_a T_b, \quad V_1 \to SB, \quad B \to T_b V_2 \mid a, \quad V_2 \to T_c B,$$
$$T_a \to a, \quad T_b \to b, \quad T_c \to c .$$

A check on $aaba$: seven steps, which is $2 \cdot 4 - 1$.

$$S \Rightarrow T_a V_1 \Rightarrow a V_1 \Rightarrow a S B \Rightarrow a T_a T_b B \Rightarrow a a T_b B \Rightarrow aab B \Rightarrow aaba$$
:::
::::

::::exercise[Two more rules]
Convert $S \to aS \mid bT \mid a$, $\;T \to bT \mid cc$ to Chomsky normal form.

:::solution
No long rules appear here, so only terminals need replacing:
$$S \to T_a S \mid T_b T \mid a, \quad T \to T_b T \mid T_c T_c, \quad T_a \to a, \quad T_b \to b, \quad T_c \to c .$$
:::
::::

:::caution[What CNF does not allow]
$A \to a$ and $A \to BC$ are the only forms. $A \to aB$ is not allowed (a terminal next to a variable),
$A \to B$ is not allowed (a unit), $A \to BCD$ is not allowed (too long), and $A \to \lambda$ is not
allowed, apart from the exception for $S_0$ when $\lambda$ is in the language.
:::

:::insight
Chomsky normal form makes every step a split in two. So a string of length $n$ can only come from
two shorter strings, and that recursion on substrings is what the next algorithm tabulates. In a later
unit the same binary shape turns a long string into a tall tree and gives the pumping lemma.
:::

:::equations
- *CNF rules*: $A \to BC$ or $A \to a$.
- *Derivation length in CNF*: a string of length $n$ takes exactly $2n - 1$ steps.
:::

## The CYK Membership Algorithm

### A table of substrings

Take a grammar in Chomsky normal form and a string $w = a_1 a_2 \cdots a_n$. Write $w_{ij}$ for the
substring $a_i \cdots a_j$, and let
$$V_{ij} = \{A \in V : A \overset{*}{\Rightarrow} w_{ij}\}.$$
Then $w \in L(G)$ exactly when $S \in V_{1n}$. Each set is computed from shorter ones: $A$ derives
$w_{ij}$ when a rule $A \to BC$ splits it into a part that $B$ derives and a part that $C$ derives.

:::algorithm[CYK membership test]
**Input:** a grammar $G$ in Chomsky normal form and a string $w = a_1 \cdots a_n$.\
**Output:** whether $w \in L(G)$.

1. For each $i$, set $V_{ii} = \{A : A \to a_i \text{ is a rule}\}$.
2. For lengths $\ell = 2, 3, \dots, n$ and each start $i$, with $j = i + \ell - 1$: for each split point $k$ with $i \le k < j$, and each rule $A \to BC$ with $B \in V_{ik}$ and $C \in V_{k + 1, j}$, put $A$ in $V_{ij}$.
3. Accept exactly when $S \in V_{1n}$.
:::

There are about $n^2 / 2$ sets, and each takes at most $n$ splits, so for a fixed grammar the running time
is proportional to $n^3$. The name comes from its three discoverers, Cocke, Younger and Kasami.

::::example[A CYK table]
The grammar below generates the non-empty strings with equal numbers of $a$'s and $b$'s:
$$S \to SS \mid AB \mid BA \mid AX \mid BY, \quad X \to SB, \quad Y \to SA, \quad A \to a, \quad B \to b .$$
Decide whether $aabbab$ is in the language.

:::solution
Each row is one length, and the column is the start position $i$. So the row of length 3 and the
column $i = 2$ holds $V_{24}$, the variables that derive $w_{24} = abb$.

| Length | $i = 1$ | $i = 2$ | $i = 3$ | $i = 4$ | $i = 5$ | $i = 6$ |
|---|---|---|---|---|---|---|
| 1 | $A$ | $A$ | $B$ | $B$ | $A$ | $B$ |
| 2 | $\varnothing$ | $S$ | $\varnothing$ | $S$ | $S$ | |
| 3 | $\varnothing$ | $X$ | $\varnothing$ | $X$ | | |
| 4 | $S$ | $S$ | $\varnothing$ | | | |
| 5 | $Y$ | $X$ | | | | |
| 6 | $S$ | | | | | |

Some of the entries, worked out:
- $V_{23} = \{S\}$: $w_{23} = ab$ splits as $a \mid b$ with $A \in V_{22}$, $B \in V_{33}$, and $S \to AB$.
- $V_{24} = \{X\}$: $abb$ splits as $ab \mid b$ with $S \in V_{23}$, $B \in V_{44}$, and $X \to SB$. The other split, $a \mid bb$, has $V_{34} = \varnothing$.
- $V_{14} = \{S\}$: $aabb$ splits as $a \mid abb$ with $A \in V_{11}$, $X \in V_{24}$, and $S \to AX$.
- $V_{16} = \{S\}$: $S \to SS$ with $S \in V_{14}$ and $S \in V_{56}$, and also $S \to AX$ with $A \in V_{11}$ and $X \in V_{26}$.

$S \in V_{16}$, so $aabbab \in L(G)$, which agrees with the count of three $a$'s and three $b$'s.
:::
::::

```python
# CYK: T[i][j] is the set of variables that derive w[i..j]; the grammar is in CNF, written
# as (A, B, C) for A -> BC and (A, a) for A -> a. w must not be empty: lambda is a separate test.
def cyk(rules, start, w):
    n = len(w)
    T = [[set() for _ in range(n)] for _ in range(n)]
    for i, c in enumerate(w):
        T[i][i] = {r[0] for r in rules if len(r) == 2 and r[1] == c}
    for length in range(2, n + 1):
        for i in range(n - length + 1):
            j = i + length - 1
            for k in range(i, j):
                for r in rules:
                    if len(r) == 3 and r[1] in T[i][k] and r[2] in T[k + 1][j]:
                        T[i][j].add(r[0])
    return start in T[0][n - 1]

equal = [("S", "S", "S"), ("S", "A", "B"), ("S", "B", "A"), ("S", "A", "X"), ("S", "B", "Y"),
         ("X", "S", "B"), ("Y", "S", "A"), ("A", "a"), ("B", "b")]
print([w for w in ["aabbab", "abba", "aabab", "bbaa", "ab", "aab"] if cyk(equal, "S", w)])
```

```output
['aabbab', 'abba', 'bbaa', 'ab']
```

:::remark
The table does more than answer yes or no. Keeping, for each entry, the rule and split that put it
there gives a derivation tree, so CYK is also a parser. And a variable that appears in a cell through
two different rule and split pairs is a sign that the grammar is ambiguous on that substring: here
$V_{16}$ has two.
:::

:::insight
CYK is dynamic programming over substrings. Exhaustive search grows sentential forms from $S$ and
explores an exponential tree; CYK works bottom-up from the input, and there are only quadratically
many substrings to think about.
:::

:::equations
- *CYK sets*: $V_{ij} = \{A : A \overset{*}{\Rightarrow} w_{ij}\}$, and $w \in L(G) \iff S \in V_{1n}$.
- *CYK recurrence*: $A \in V_{ij}$ when $A \to BC$, $B \in V_{ik}$, $C \in V_{k + 1, j}$ for some $i \le k < j$.
- *CYK cost*: proportional to $|w|^3$ for a fixed grammar.
:::

## Greibach Normal Form

### Definition

:::definition[Greibach normal form]
A context-free grammar is in **Greibach normal form** (GNF) if every production is of the form
$$A \to a B_1 B_2 \cdots B_k, \qquad a \in T, \quad B_1, \dots, B_k \in V, \quad k \ge 0 .$$
:::

Every step of a derivation writes exactly one terminal, on the left, so a string of length $n$ takes
exactly $n$ steps. An s-grammar is a grammar in this form with the extra uniqueness condition.

Some grammars are close to the form already, and need only the trick of step 2 of the CNF
conversion. For $S \to abAc \mid b$, $\;A \to cA \mid a$, the terminals after the first position are
replaced:
$$S \to a T_b A T_c \mid b, \quad A \to cA \mid a, \quad T_b \to b, \quad T_c \to c .$$

What stands in the way in general is a right-hand side that starts with a variable, and the worst
case of that is a variable that starts with itself.

### Removing left recursion

:::definition[Left recursion]
A grammar is **left-recursive** in $A$ if it has a rule $A \to A\alpha$. A leftmost derivation can then
apply the rule forever without writing a single terminal.
:::

The rules $A \to A\alpha \mid \beta$ generate $\beta\alpha^n$: one $\beta$ on the left, then any number of
$\alpha$'s. The same strings can be built from the left, with a new variable for the repeating part.

:::theorem[Removing left recursion]
Let $A \to A\alpha_1 \mid \cdots \mid A\alpha_r$ be the left-recursive rules of $A$ and
$A \to \beta_1 \mid \cdots \mid \beta_s$ the others. With a new variable $B$, the rules
$$A \to \beta_i \mid \beta_i B, \qquad B \to \alpha_j \mid \alpha_j B$$
for all $i$ and $j$ generate the same language.
:::

::::example[Left recursion in a list]
Remove the left recursion from $A \to Ab \mid Ac \mid a \mid d$.

:::solution
Here $\alpha_1 = b$, $\alpha_2 = c$, $\beta_1 = a$, $\beta_2 = d$:
$$A \to a \mid d \mid aB \mid dB, \qquad B \to b \mid c \mid bB \mid cB .$$
Both grammars generate $(a + d)(b + c)^*$, and this result happens to be in Greibach normal form.
:::
::::

### From CNF to GNF

:::theorem[Greibach normal form exists]
For every context-free grammar $G$ with $\lambda \notin L(G)$ there is an equivalent grammar in Greibach
normal form.
:::

The proof is a procedure. Number the variables $A_1, \dots, A_m$ of a grammar in Chomsky normal form.

:::algorithm[Conversion to Greibach normal form]
**Input:** a grammar in Chomsky normal form with variables $A_1, \dots, A_m$.\
**Output:** an equivalent grammar in Greibach normal form.

1. For $i = 1, \dots, m$, make every rule $A_i \to A_j \gamma$ satisfy $j \ge i$: while some rule has $j < i$, substitute the rules of $A_j$ for that $A_j$.
2. Remove the left recursion of each rule $A_i \to A_i \gamma$, with a new variable $B_i$.
3. Now the rules of $A_m$ start with a terminal. Working down from $i = m - 1$ to $1$, substitute into each rule $A_i \to A_j \gamma$ with $j > i$, so that it starts with a terminal too.
4. Substitute into the rules of the new variables $B_i$ in the same way.
:::

::::example[A small conversion]
Convert $S \to AB$, $\;A \to SA \mid a$, $\;B \to b$ to Greibach normal form, in the order $S, A, B$.

:::solution
**Order.** $S \to AB$ is fine. $A \to SA$ starts with an earlier variable, so substitute for $S$:
$$A \to ABA \mid a .$$
**Left recursion.** Here $\alpha = BA$ and $\beta = a$. With a new variable $C$:
$$A \to a \mid aC, \qquad C \to BA \mid BAC .$$
**Back-substitution.** $B \to b$ and the rules of $A$ now start with a terminal. Substitute $A$ into
$S \to AB$ and $B$ into the rules of $C$:

$$S \to aB \mid aCB, \quad A \to a \mid aC, \quad C \to bA \mid bAC, \quad B \to b .$$

The original grammar generates $L(a(ba)^*b)$, and so does this one. For example
$$S \Rightarrow aCB \Rightarrow abAB \Rightarrow abaB \Rightarrow abab,$$
four steps for four symbols.
:::
::::

| | Chomsky normal form | Greibach normal form |
|---|---|---|
| Rules | $A \to BC$, $A \to a$ | $A \to a B_1 \cdots B_k$ |
| Steps for $\lvert w \rvert = n$ | $2n - 1$ | $n$ |
| Conversion | short and mechanical | long; the result can be much larger |
| Used for | CYK, the pumping lemma | a PDA reading one symbol per move |

:::insight
The two normal forms answer two different needs. Chomsky normal form fixes the **shape of the tree**,
which is what proofs and table-filling want. Greibach normal form fixes the **order of the input**:
one terminal per step, left to right, which is what a machine reading its input wants.
:::

:::equations
- *GNF rules*: $A \to a B_1 \cdots B_k$ with $k \ge 0$.
- *Derivation length in GNF*: a string of length $n$ takes exactly $n$ steps.
- *Left recursion*: $A \to A\alpha \mid \beta$ becomes $A \to \beta \mid \beta B$, $B \to \alpha \mid \alpha B$.
:::
