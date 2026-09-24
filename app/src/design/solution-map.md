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

## Change log

- 2026-09-24: first version (#91): method graphs in `content/methods/`, the `solution-map` block,
  lint of the walk, the stepped view beside a Cytoscape graph; three method graphs and four
  specimens.
