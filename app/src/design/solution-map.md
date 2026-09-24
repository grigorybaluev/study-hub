This page is the design doc for **solution maps** (#91): a worked solution shown step by step beside
the method graph it follows, so each step is seen as a choice in a method, not only as algebra. It
is rendered by the same code as a real unit. To change the design, change
`app/src/components/SolutionMap.tsx` and the `.solmap` rules in `app/src/styles/base.css`, check this
page in both themes and at phone width, and add a line to the change log at the bottom.

## The rules

### Two pieces: a method graph and a solution

A **method graph** is a flowchart for choosing a method, written once and shared by every task that
uses it. It lives in `content/methods/<id>.yaml` (CC BY-SA, like all content) and reaches the app in
`graph.json` under `methods`:

```yaml
id: integration-technique
title: Choosing an integration technique
description: One or two sentences on the idea behind the order of the questions.
start: simplify                       # the entry node
nodes:
  - {id: simplify, kind: decision, label: "Can it be simplified?"}
  - {id: by-parts, kind: method, label: "Integrate by parts", concept: integration-by-parts}
  - {id: done, kind: end, label: "Antiderivative found"}
edges:
  - {from: simplify, to: rewrite, label: "yes"}   # a decision's edges are its answers
  - {from: by-parts, to: basic}                   # other edges carry no label
```

| Node kind | Is | Drawn |
|---|---|---|
| `decision` | a question; each outgoing edge is one answer (`yes`, `no`, or a word) | amber |
| `method` | a technique to apply; it leads to the next question or to an end | green |
| `end` | where a solution stops | blue, thicker border |

A node may name a `concept` (it must exist). Labels are plain text (Unicode, no LaTeX) and short:
they are wrapped at about 22 characters.

A **solution map** is a fenced block placed where the worked example belongs in a unit:

```yaml
id: parts-x-exp                  # unique on the page
method: integration-technique    # a graph from content/methods/
task: 'Evaluate $\int x e^x\,dx$.'
steps:
  - node: simplify
    answer: no                   # required at a decision: which edge the solution takes
    text: 'Nothing to expand or cancel.'
  - node: by-parts
    text: '$u = x$, $dv = e^x\,dx$ …'
verified: []                     # the two hand checks of #93, as for sims
```

Write LaTeX strings in single quotes, so backslashes stay as typed.

### What lint checks

- The method graph: slug ids, known kinds, one `start`, a decision has at least two answers and they
  differ, an end has no way out, a method leads somewhere, concepts exist, every node is reachable.
- The solution: the first step is at `start`, every next step follows an edge (at a decision, the
  edge whose label is the step's `answer`), and the last step is at an end. So the highlighted
  path is always a real walk through the method.

### How it reads

- The task is on top. Steps are revealed one at a time (**Next**, **Back**, **Show all**,
  **Reset**); a revealed step can be clicked to return to it.
- Each step names its node (and the answer taken, at a decision) above its text.
- The graph shows the path walked so far in the accent colour; the current node has a heavy
  border; the rest of the graph stays visible but faint, so the alternatives not taken are always
  in view.
- Beside the steps when the column is at least 620 px wide, below them otherwise. The graph fits
  the width and grows in height rather than shrinking its text.

## Specimens

### Integration by parts

```solution-map
id: parts-x-exp
method: integration-technique
task: 'Evaluate $\displaystyle\int x e^{x}\,dx$.'
steps:
  - node: simplify
    answer: no
    text: 'Nothing to expand, cancel or rewrite.'
  - node: basic
    answer: no
    text: '$x e^x$ is not in the table.'
  - node: sub
    answer: no
    text: 'The derivative of $x$ is $1$ and of $e^x$ is $e^x$: neither turns the rest into $du$.'
  - node: product
    answer: yes
    text: 'A polynomial, $x$, times $e^x$.'
  - node: by-parts
    text: '$u = x$, $dv = e^x\,dx$, so $du = dx$, $v = e^x$ and $\int x e^x\,dx = x e^x - \int e^x\,dx$.'
  - node: basic
    answer: yes
    text: 'What is left, $\int e^x\,dx$, is a table form.'
  - node: table
    text: '$\int x e^x\,dx = x e^x - e^x + C = (x - 1)e^x + C$.'
  - node: done
    text: 'Check: $\frac{d}{dx}\big[(x - 1)e^x\big] = e^x + (x - 1)e^x = x e^x$.'
note: 'The same method graph serves the next specimen: only the answers differ.'
```

### Partial fractions, with the same method graph

```solution-map
id: partial-fractions-rational
method: integration-technique
task: 'Evaluate $\displaystyle\int \frac{5x - 4}{x^2 - x - 2}\,dx$.'
steps:
  - node: simplify
    answer: no
    text: 'The numerator has lower degree than the denominator: no division, nothing cancels.'
  - node: basic
    answer: no
    text: 'Not a table form.'
  - node: sub
    answer: no
    text: 'The derivative of $x^2 - x - 2$ is $2x - 1$, not a multiple of $5x - 4$.'
  - node: product
    answer: no
    text: 'A quotient, not a product of a polynomial and a transcendental function.'
  - node: rational
    answer: yes
    text: 'A polynomial over a polynomial.'
  - node: partial-fractions
    text: '$x^2 - x - 2 = (x - 2)(x + 1)$ and $5x - 4 = A(x + 1) + B(x - 2)$; $x = 2$ gives $A = 2$, $x = -1$ gives $B = 3$.'
  - node: basic
    answer: yes
    text: '$\int \Big(\frac{2}{x - 2} + \frac{3}{x + 1}\Big)dx$: both terms are $\int du/u$.'
  - node: table
    text: '$= 2\ln\lvert x - 2\rvert + 3\ln\lvert x + 1\rvert + C$.'
  - node: done
    text: 'Differentiating gives back $\frac{2}{x-2} + \frac{3}{x+1} = \frac{5x - 4}{x^2 - x - 2}$.'
```

### A convergence test

```solution-map
id: harmonic-like
method: series-convergence-test
task: 'Does $\displaystyle\sum_{n=1}^{\infty} \frac{n}{n^2 + 1}$ converge?'
steps:
  - node: terms
    answer: yes
    text: '$\frac{n}{n^2 + 1} \to 0$, so the divergence test says nothing.'
  - node: known
    answer: no
    text: 'Neither geometric nor a $p$-series as written.'
  - node: alternating
    answer: no
    text: 'All terms are positive.'
  - node: powers
    answer: no
    text: 'No factorials or $n$-th powers; the ratio test would give $L = 1$ anyway.'
  - node: like
    answer: yes
    text: 'For large $n$, $\frac{n}{n^2 + 1} \approx \frac{1}{n}$, the harmonic series.'
  - node: comparison
    text: '$\displaystyle\lim_{n\to\infty} \frac{n/(n^2 + 1)}{1/n} = \lim_{n\to\infty} \frac{n^2}{n^2 + 1} = 1$, a finite positive limit, and $\sum 1/n$ diverges.'
  - node: verdict
    text: 'The series **diverges**, even though its terms tend to 0.'
```

### A proof strategy

```solution-map
id: even-square
method: proof-strategy
task: 'Prove: if $n^2$ is even, then $n$ is even.'
steps:
  - node: indexed
    answer: no
    text: 'It is about one integer $n$; no chain from $n$ to $n + 1$.'
  - node: split
    answer: no
    text: 'The hypothesis "$n^2$ is even" does not split into cases.'
  - node: forward
    answer: no
    text: '$n^2 = 2k$ gives no handle on $n$ itself: $n = \sqrt{2k}$ is not something to compute with.'
  - node: negation
    answer: yes
    text: '$\lnot q$ is "$n$ is odd", that is $n = 2i + 1$: concrete.'
  - node: contrapositive
    text: 'Assume $n = 2i + 1$. Then $n^2 = 4i^2 + 4i + 1 = 2(2i^2 + 2i) + 1$ is odd, which is $\lnot p$.'
  - node: proved
    text: 'Since $p \to q \equiv \lnot q \to \lnot p$: if $n^2$ is even, $n$ is even.'
```

## Across the courses

The same block serves any course where solving a task starts with choosing a method. One method
graph per kind of task; each specimen below walks one path through it.

### Probability: which distribution (MAST 221)

```solution-map
id: third-basket
method: which-distribution
task: 'A player makes 70 % of her free throws, independently. What is the probability that her third basket comes on her fifth attempt?'
steps:
  - node: fixed
    answer: no
    text: 'The number of attempts is what is random; it is not fixed in advance.'
  - node: events
    answer: no
    text: 'We count attempts, not events in a stretch of time.'
  - node: waiting
    answer: yes
    text: 'Attempts until the third success.'
  - node: first
    answer: no
    text: '$k = 3$, not the first success.'
  - node: negative-binomial
    text: '$b^*(5; 3, 0.7) = \binom{4}{2}(0.7)^3(0.3)^2 = 6 \cdot 0.343 \cdot 0.09 \approx 0.185$.'
  - node: model
    text: 'On average she needs $k/\theta = 3/0.7 \approx 4.3$ attempts for three baskets.'
```

### Linear algebra: solving Ax = b (MAST 234)

```solution-map
id: two-equations
method: linear-system
task: 'Solve $x + 2y - z = 1$, $2x + 4y + z = 5$.'
steps:
  - node: square
    answer: no
    text: 'Two equations, three unknowns: $A$ is $2 \times 3$.'
  - node: reduce
    text: '$R_2 - 2R_1$ turns $\left[\begin{smallmatrix} 1 & 2 & -1 & 1 \\ 2 & 4 & 1 & 5 \end{smallmatrix}\right]$ into $\left[\begin{smallmatrix} 1 & 2 & -1 & 1 \\ 0 & 0 & 3 & 3 \end{smallmatrix}\right]$.'
  - node: contradiction
    answer: no
    text: 'The last row says $3z = 3$: no contradiction.'
  - node: free
    answer: yes
    text: 'Pivots in the $x$ and $z$ columns; $y$ is free.'
  - node: parametrise
    text: '$y = t$, $z = 1$, $x = 1 - 2t + z = 2 - 2t$: $(x, y, z) = (2, 0, 1) + t(-2, 1, 0)$.'
  - node: solved
    text: 'Check: $(2 - 2t) + 2t - 1 = 1$ and $2(2 - 2t) + 4t + 1 = 5$ for every $t$ — a line of solutions.'
```

### Multivariable calculus: extrema of f(x, y) (MAST 218)

```solution-map
id: cubic-critical-point
method: extrema-two-variables
task: 'Classify the critical point $(1, 0)$ of $f(x, y) = x^3 - 3x + y^2$.'
steps:
  - node: constraint
    answer: no
    text: 'No constraint.'
  - node: region
    answer: no
    text: 'Local behaviour at a point, not extreme values over a region.'
  - node: critical
    text: '$f_x = 3x^2 - 3 = 0$ and $f_y = 2y = 0$ give the critical points $(1, 0)$ and $(-1, 0)$.'
  - node: second
    answer: 'D > 0, f_xx > 0'
    text: '$f_{xx} = 6x$, $f_{yy} = 2$, $f_{xy} = 0$, so at $(1, 0)$: $D = 6 \cdot 2 - 0 = 12 > 0$ and $f_{xx} = 6 > 0$.'
  - node: minimum
    text: 'A local minimum, $f(1, 0) = -2$. (At $(-1, 0)$, $D = -12 < 0$: a saddle point.)'
```

### Theory of computation: is it regular? (COMP 335)

```solution-map
id: an-bn
method: regular-or-not
task: 'Is $L = \{a^n b^n \mid n \ge 0\}$ regular?'
steps:
  - node: finite
    answer: no
    text: 'One string for every $n$.'
  - node: describe
    answer: no
    text: '$a^*b^*$ is too big; any automaton would have to remember $n$.'
  - node: closure
    answer: no
    text: 'No obvious construction from regular pieces.'
  - node: counting
    answer: yes
    text: 'The number of $b$s must equal the number of $a$s: unbounded counting.'
  - node: pumping
    text: 'Take $s = a^p b^p$. Any split $s = xyz$ with $|xy| \le p$, $|y| \ge 1$ has $y = a^k$, $k \ge 1$, and $xy^2z = a^{p+k}b^p \notin L$.'
  - node: not-regular
    text: 'No pumping length works, so $L$ is not regular.'
```

### Algorithms: a divide-and-conquer recurrence (COMP 352)

```solution-map
id: recurrence-n-squared
method: divide-and-conquer-recurrence
task: 'Solve $T(n) = 2\,T(n/2) + n^2$.'
steps:
  - node: form
    answer: yes
    text: '$a = 2$, $b = 2$, $f(n) = n^2$.'
  - node: compare
    answer: polynomially larger
    text: '$n^{\log_2 2} = n$, and $n^2 = n^{1 + 1}$ is larger by a power of $n$.'
  - node: regularity
    answer: yes
    text: '$2 f(n/2) = 2 \cdot \frac{n^2}{4} = \tfrac12 n^2$, so $c = \tfrac12$ works.'
  - node: root
    text: '$T(n) = \Theta(n^2)$: the work at the top level dominates.'
  - node: solved
    text: 'The levels of the tree cost $n^2, \tfrac12 n^2, \tfrac14 n^2, \dots$, a geometric series bounded by $2n^2$.'
```

### Databases: normalising to BCNF (COMP 353)

```solution-map
id: bcnf-abc
method: bcnf-decomposition
task: 'Normalise $R(A, B, C)$ with $A \to B$ and $B \to C$ to BCNF.'
steps:
  - node: keys
    text: '$A^+ = ABC$, so $A$ is the key; $B^+ = BC$.'
  - node: violation
    answer: yes
    text: '$B \to C$ has $B^+ = BC \ne ABC$: $B$ is not a superkey.'
  - node: split
    text: 'Split on $B \to C$: $R_1(B, C) = B^+$ and $R_2(A, B) = B \cup (R - B^+)$.'
  - node: keys
    text: 'In $R_1$ the key is $B$; in $R_2$ the key is $A$.'
  - node: violation
    answer: no
    text: '$B \to C$ lives in $R_1$ and $A \to B$ in $R_2$, each with a key on the left.'
  - node: bcnf
    text: 'Both pieces are in BCNF, and both dependencies are preserved.'
```

## Change log

- 2026-09-24: six more method graphs and specimens, one per course: distributions (MAST 221),
  linear systems (MAST 234), extrema (MAST 218), regularity (COMP 335), recurrences (COMP 352),
  BCNF (COMP 353). Layout: a method no question leads to sits in the question column; ends wrap
  two per row (#91).
- 2026-09-24: first version (#91): method graphs in `content/methods/`, the `solution-map` block,
  lint of the walk, the stepped view beside a Cytoscape graph; three method graphs and four
  specimens.
