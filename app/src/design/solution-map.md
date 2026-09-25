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

- The task is on top, then the controls bar (**Back**, **Next**, **Show all**, **Reset** and the
  step count), then the solution. Steps are revealed one at a time; a revealed step can be
  clicked to return to it.
- Each step names its node (and the answer taken, at a decision) above its text.
- The graph shows the path walked so far in the accent colour; the current node has a heavy
  border; the rest of the graph stays visible but faint, so the alternatives not taken are always
  in view.
- Beside the steps when the column is at least 620 px wide, below them otherwise. The graph fits
  the width and grows in height rather than shrinking its text.

## Specimens

The gallery of #120: one method graph per kind of task, course by course, each with one worked
example that walks one path through it. A specimen moves into its unit by cut-and-paste of the
block; the method graph stays in `content/methods/` and is shared.

## MATH 203: Differential and Integral Calculus I

### Evaluating a limit

```solution-map
id: limit-rationalise
method: evaluating-a-limit
task: 'Evaluate $\displaystyle\lim_{x \to 4} \frac{\sqrt{x} - 2}{x - 4}$.'
steps:
  - node: substitute
    answer: no
    text: 'At $x = 4$ both the numerator and the denominator are $0$.'
  - node: form
    answer: 0/0
    text: 'The form $0/0$: a common factor is hiding.'
  - node: repair
    answer: a square root
    text: 'The zero in the numerator comes from $\sqrt{x} - 2$.'
  - node: rationalise
    text: '$\dfrac{\sqrt{x} - 2}{x - 4} \cdot \dfrac{\sqrt{x} + 2}{\sqrt{x} + 2} = \dfrac{x - 4}{(x - 4)(\sqrt{x} + 2)} = \dfrac{1}{\sqrt{x} + 2}$ for $x \ne 4$.'
  - node: substitute
    answer: yes
    text: '$\frac{1}{\sqrt{x} + 2}$ is continuous at $x = 4$.'
  - node: value
    text: '$\frac{1}{\sqrt{4} + 2} = \frac14$.'
  - node: found
    text: '$\displaystyle\lim_{x \to 4} \frac{\sqrt{x} - 2}{x - 4} = \frac14$. Factoring $x - 4 = (\sqrt{x} - 2)(\sqrt{x} + 2)$ is the same cancellation.'
```

### Absolute extrema of f(x)

```solution-map
id: cubic-on-interval
method: absolute-extrema
task: 'Find the absolute maximum and minimum of $f(x) = x^3 - 3x^2 + 1$ on $[-\tfrac12, 4]$.'
steps:
  - node: closed
    answer: yes
    text: 'A polynomial is continuous and $[-\tfrac12, 4]$ is closed and bounded, so both extremes exist.'
  - node: critical
    text: '$f''(x) = 3x^2 - 6x = 3x(x - 2)$ is zero at $x = 0$ and $x = 2$, both inside the interval.'
  - node: candidates
    text: '$f(-\tfrac12) = \tfrac18$, $f(0) = 1$, $f(2) = -3$, $f(4) = 17$.'
  - node: found
    text: 'Absolute maximum $17$ at $x = 4$; absolute minimum $-3$ at $x = 2$. The local maximum at $x = 0$ is not the absolute one.'
```

## MATH 204: Vectors and Matrices

### Computing a determinant

```solution-map
id: det-row-reduce
method: computing-a-determinant
task: 'Compute $\det A$ for $A = \begin{pmatrix} 2 & 1 & 3 \\ 4 & 2 & 7 \\ -2 & 5 & 1 \end{pmatrix}$.'
steps:
  - node: size
    answer: 3×3 or larger
    text: '$A$ is $3 \times 3$.'
  - node: triangular
    answer: no
    text: 'The entries below the diagonal are not zero.'
  - node: zero
    answer: no
    text: 'No zero row or column, and no two rows are proportional.'
  - node: sparse
    answer: no
    text: 'There is not a single zero in $A$.'
  - node: reduce
    text: '$R_2 - 2R_1$ and $R_3 + R_1$ leave $\det$ unchanged and give the rows $(2, 1, 3)$, $(0, 0, 1)$, $(0, 6, 4)$. Swapping $R_2$ and $R_3$ flips the sign.'
  - node: triangular
    answer: yes
    text: 'Now $\begin{pmatrix} 2 & 1 & 3 \\ 0 & 6 & 4 \\ 0 & 0 & 1 \end{pmatrix}$ is upper triangular.'
  - node: diagonal
    text: '$\det A = -(2 \cdot 6 \cdot 1) = -12$, the minus sign from the swap.'
  - node: found
    text: 'Check by cofactors along row 1: $2(2 - 35) - 1(4 + 14) + 3(20 + 4) = -66 - 18 + 72 = -12$.'
```

## MATH 205: Differential and Integral Calculus II

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

### Choosing a volume method

```solution-map
id: shells-between-curves
method: volume-method
task: 'The region between $y = x$ and $y = x^2$ for $0 \le x \le 1$ is rotated about the $y$-axis. Find the volume.'
steps:
  - node: solid
    answer: revolution
    text: 'A solid of revolution about the $y$-axis.'
  - node: strips
    answer: parallel
    text: 'Vertical strips run from $y = x^2$ up to $y = x$, with one formula for the height, $x - x^2$. Vertical is parallel to the $y$-axis.'
  - node: shells
    text: '$V = \displaystyle\int_0^1 2\pi x\,(x - x^2)\,dx = 2\pi\Big(\frac13 - \frac14\Big) = \frac{\pi}{6}$.'
  - node: found
    text: 'Check with washers in $y$: $\pi\displaystyle\int_0^1 \big((\sqrt{y})^2 - y^2\big)\,dy = \pi\Big(\frac12 - \frac13\Big) = \frac{\pi}{6}$.'
```

### Does an improper integral converge?

```solution-map
id: improper-comparison
method: improper-integral-convergence
task: 'Does $\displaystyle\int_1^\infty \frac{2 + \sin x}{x^2}\,dx$ converge?'
steps:
  - node: kind
    answer: one bad end
    text: 'The upper limit is $\infty$; the integrand is continuous on $[1, \infty)$.'
  - node: antiderivative
    answer: no
    text: '$\int \frac{\sin x}{x^2}\,dx$ has no elementary antiderivative.'
  - node: compare
    text: '$0 < \frac{2 + \sin x}{x^2} \le \frac{3}{x^2}$, and $\int_1^\infty \frac{3}{x^2}\,dx = 3$ converges ($p = 2 > 1$).'
  - node: verdict
    text: 'It **converges**, to a value between $\int_1^\infty \frac{1}{x^2}\,dx = 1$ and $3$.'
```

### Limit of a sequence

```solution-map
id: nested-roots
method: limit-of-a-sequence
task: 'Find the limit of the sequence $a_1 = 1$, $a_{n+1} = \sqrt{2 + a_n}$.'
steps:
  - node: function
    answer: no
    text: 'It is given by a recursion, not by a formula in $n$.'
  - node: trapped
    answer: no
    text: 'No obvious pair of bounds with a common limit.'
  - node: monotone
    answer: yes
    text: 'By induction $a_n < 2$ (if $a_n < 2$, then $a_{n+1} < \sqrt{4} = 2$), and $a_{n+1}^2 - a_n^2 = 2 + a_n - a_n^2 = (2 - a_n)(1 + a_n) > 0$, so it increases.'
  - node: mct
    text: 'So it converges, and its limit satisfies $L = \sqrt{2 + L}$: $L^2 - L - 2 = (L - 2)(L + 1) = 0$, and $L = 2$ since the terms are positive.'
  - node: found
    text: '$a_n \to 2$; the terms run $1, 1.732, 1.932, 1.983, \dots$'
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

### Interval of convergence

```solution-map
id: interval-endpoints
method: interval-of-convergence
task: 'Find the interval of convergence of $\displaystyle\sum_{n=1}^{\infty} \frac{(x - 3)^n}{n\,2^n}$.'
steps:
  - node: ratio
    text: '$\left|\dfrac{a_{n+1}}{a_n}\right| = \dfrac{|x - 3|}{2}\cdot\dfrac{n}{n + 1} \to \dfrac{|x - 3|}{2}$, which is less than $1$ when $|x - 3| < 2$.'
  - node: radius
    answer: finite
    text: '$R = 2$ around $a = 3$: it converges on $(1, 5)$ and diverges outside $[1, 5]$.'
  - node: left
    text: 'At $x = 1$: $\sum \frac{(-2)^n}{n\,2^n} = \sum \frac{(-1)^n}{n}$, the alternating harmonic series, converges.'
  - node: right
    text: 'At $x = 5$: $\sum \frac{1}{n}$, the harmonic series, diverges.'
  - node: interval
    text: 'The interval of convergence is $[1, 5)$.'
```

### Finding a power series for f

```solution-map
id: log-series
method: power-series-for-f
task: 'Find a power series for $f(x) = \ln(1 + x)$ centred at $0$.'
steps:
  - node: geometric
    answer: no
    text: '$\ln(1 + x)$ is not a quotient.'
  - node: calculus
    answer: yes
    text: '$f''(x) = \dfrac{1}{1 + x} = \dfrac{1}{1 - (-x)}$ is.'
  - node: term-by-term
    text: '$\dfrac{1}{1 + x} = \displaystyle\sum_{n=0}^\infty (-1)^n x^n$ for $|x| < 1$. Integrating, $\ln(1 + x) = C + \displaystyle\sum_{n=0}^\infty \frac{(-1)^n x^{n+1}}{n + 1}$, and $x = 0$ gives $C = \ln 1 = 0$.'
  - node: series
    text: '$\ln(1 + x) = x - \frac{x^2}{2} + \frac{x^3}{3} - \cdots$ for $-1 < x \le 1$; the endpoint $x = 1$ converges by the alternating series test.'
```

## MAST 218: Multivariable Calculus I

### Setting up a polar area

```solution-map
id: circle-outside-cardioid
method: polar-area
task: 'Find the area inside $r = 3\sin\theta$ and outside $r = 1 + \sin\theta$.'
steps:
  - node: curves
    answer: two
    text: 'Between a circle and a cardioid.'
  - node: intersect
    text: '$3\sin\theta = 1 + \sin\theta$ gives $\sin\theta = \tfrac12$: $\theta = \tfrac{\pi}{6}$ and $\tfrac{5\pi}{6}$. The curves also meet at the pole, which is not on the edge of this region.'
  - node: between
    text: 'The circle is outside on $[\tfrac{\pi}{6}, \tfrac{5\pi}{6}]$: $A = \dfrac12\displaystyle\int_{\pi/6}^{5\pi/6} \big(9\sin^2\theta - (1 + \sin\theta)^2\big)\,d\theta = \dfrac12\displaystyle\int_{\pi/6}^{5\pi/6} (3 - 4\cos 2\theta - 2\sin\theta)\,d\theta$.'
  - node: area
    text: '$A = \tfrac12\big(2\pi + 2\sqrt{3} - 2\sqrt{3}\big) = \pi$. By symmetry about $\theta = \tfrac{\pi}{2}$, the integral over $[\tfrac{\pi}{6}, \tfrac{\pi}{2}]$ alone is $\pi$, half of $2\pi$.'
```

### Identifying a quadric surface

```solution-map
id: two-sheets
method: quadric-surface
task: 'Identify the surface $4x^2 - y^2 + 2z^2 + 4 = 0$.'
steps:
  - node: standard
    text: 'Move the constant and divide by $-4$: $\dfrac{y^2}{4} - x^2 - \dfrac{z^2}{2} = 1$.'
  - node: squared
    answer: three
    text: '$x$, $y$ and $z$ are all squared.'
  - node: signs
    answer: two minus, = 1
    text: 'One plus, two minus, and $1$ on the right.'
  - node: two-sheets
    text: 'A hyperboloid of two sheets around the $y$-axis. The traces confirm it: $y = k$ gives $x^2 + \frac{z^2}{2} = \frac{k^2}{4} - 1$, empty for $|k| < 2$, the gap between the sheets.'
```

### Does a two-variable limit exist?

```solution-map
id: parabola-path
method: two-variable-limit
task: 'Does $\displaystyle\lim_{(x, y) \to (0, 0)} \frac{x y^2}{x^2 + y^4}$ exist?'
steps:
  - node: substitute
    answer: no
    text: '$0/0$ at the origin.'
  - node: paths
    text: 'Along either axis $f = 0$. Along $y = mx$: $\dfrac{m^2 x^3}{x^2 + m^4 x^4} = \dfrac{m^2 x}{1 + m^4 x^2} \to 0$. Along $x = y^2$: $\dfrac{y^4}{2y^4} = \dfrac12$.'
  - node: disagree
    answer: yes
    text: 'Every line gives $0$; the parabola gives $\tfrac12$.'
  - node: dne
    text: 'The limit does not exist. The lines alone suggested $0$: agreeing paths never prove that a limit exists.'
```

### Extrema of f(x, y)

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

## MAST 221: Applied Probability

### Computing a probability

```solution-map
id: positive-test
method: computing-a-probability
task: 'A disease affects 1 % of a population. A test detects it in 95 % of those who have it and gives a false positive for 2 % of those who do not. Someone tests positive: how likely is it that they have the disease?'
steps:
  - node: equally
    answer: no
    text: 'The outcomes are not equally likely.'
  - node: complement
    answer: no
    text: 'Nothing like "at least one".'
  - node: union
    answer: no
    text: 'One event, not a union.'
  - node: stages
    answer: yes
    text: 'Two stages: having the disease or not, then the test result.'
  - node: reverse
    answer: yes
    text: 'We observe the effect (a positive test) and ask about the cause.'
  - node: bayes
    text: '$P(D \mid +) = \dfrac{0.95 \cdot 0.01}{0.95 \cdot 0.01 + 0.02 \cdot 0.99} = \dfrac{0.0095}{0.0293} \approx 0.32$; the denominator is $P(+)$ by total probability.'
  - node: found
    text: 'About $0.32$: most positives are false, because the healthy group is 99 times larger.'
```

### Finding E[X] and Var(X)

```solution-map
id: hat-matches
method: expectation-and-variance
task: '$n \ge 2$ people leave their hats at a party and get them back in random order. Find the mean and variance of the number $X$ who get their own hat.'
steps:
  - node: named
    answer: no
    text: 'Not binomial: the matches are not independent.'
  - node: sum
    answer: yes
    text: '$X = I_1 + \dots + I_n$, where $I_i = 1$ when person $i$ gets their own hat.'
  - node: linearity
    text: '$E[I_i] = \frac1n$, so $E[X] = 1$. For $i \ne j$, $E[I_i I_j] = \frac{1}{n(n - 1)}$, so $\operatorname{Cov}(I_i, I_j) = \frac{1}{n(n - 1)} - \frac{1}{n^2} = \frac{1}{n^2(n - 1)}$ and $\operatorname{Var}(X) = n \cdot \frac1n\big(1 - \frac1n\big) + n(n - 1) \cdot \frac{1}{n^2(n - 1)} = 1$.'
  - node: found
    text: '$E[X] = \operatorname{Var}(X) = 1$ for every $n \ge 2$, as for a Poisson(1) variable, which is the limit of $X$ as $n \to \infty$.'
```

### Choosing a discrete distribution

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

### Exact or normal approximation

```solution-map
id: sixty-heads
method: exact-or-normal-approximation
task: 'A fair coin is tossed 100 times. Approximate the probability of at least 60 heads.'
steps:
  - node: exact
    answer: no
    text: 'The exact answer is a sum of 41 binomial terms.'
  - node: large
    answer: yes
    text: '$n\theta = n(1 - \theta) = 50$.'
  - node: moments
    text: '$\mu = 50$, $\sigma^2 = 25$, $\sigma = 5$.'
  - node: correction
    text: '"At least 60" starts where the bar over 60 starts, at 59.5: $P(X \ge 60) \approx P(Y \ge 59.5)$.'
  - node: standardise
    text: '$z = \frac{59.5 - 50}{5} = 1.9$, and $1 - \Phi(1.9) = 1 - 0.9713 = 0.0287$.'
  - node: answer
    text: 'About $0.029$, approximately; the exact binomial value is $0.0284$.'
```

## MAST 234: Linear Algebra and Applications I

### Solving Ax = b

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

### Testing linear independence

```solution-map
id: one-to-nine
method: linear-independence-test
task: 'Are $(1, 2, 3)$, $(4, 5, 6)$ and $(7, 8, 9)$ linearly independent?'
steps:
  - node: count
    answer: no
    text: 'Three vectors in $\mathbb{R}^3$.'
  - node: obvious
    answer: no
    text: 'None is zero or a multiple of another.'
  - node: square
    answer: yes
    text: 'Three vectors, three entries each.'
  - node: det
    text: '$\det\begin{pmatrix} 1 & 4 & 7 \\ 2 & 5 & 8 \\ 3 & 6 & 9 \end{pmatrix} = 1(45 - 48) - 4(18 - 24) + 7(12 - 15) = -3 + 24 - 21 = 0$.'
  - node: nonzero
    answer: no
    text: 'The determinant is $0$.'
  - node: dependent
    text: 'Dependent: $(1, 2, 3) - 2(4, 5, 6) + (7, 8, 9) = (0, 0, 0)$.'
```

### Is A invertible, and what is A⁻¹?

```solution-map
id: triangular-inverse
method: inverting-a-matrix
task: 'Is $A = \begin{pmatrix} 1 & 2 & 0 \\ 0 & 1 & 3 \\ 0 & 0 & 1 \end{pmatrix}$ invertible? If so, find $A^{-1}$.'
steps:
  - node: square
    answer: yes
    text: '$3 \times 3$.'
  - node: test
    text: 'Upper triangular, so $\det A = 1 \cdot 1 \cdot 1 = 1$.'
  - node: nonzero
    answer: yes
    text: '$\det A = 1 \ne 0$.'
  - node: size
    answer: no
    text: 'Not $2 \times 2$.'
  - node: gauss-jordan
    text: 'In $[A \mid I]$, $R_2 - 3R_3$ clears the $3$, then $R_1 - 2R_2$ clears the $2$, leaving $A^{-1} = \begin{pmatrix} 1 & -2 & 6 \\ 0 & 1 & -3 \\ 0 & 0 & 1 \end{pmatrix}$.'
  - node: inverse
    text: 'Check one entry: row 1 of $A$ times column 3 of $A^{-1}$ is $6 - 6 + 0 = 0$; all nine give $AA^{-1} = I$.'
```

### Is W a subspace?

```solution-map
id: square-condition
method: is-it-a-subspace
task: 'Is $W = \{(x, y, z) : x + y = z^2\}$ a subspace of $\mathbb{R}^3$?'
steps:
  - node: zero
    answer: yes
    text: '$0 + 0 = 0^2$.'
  - node: recognise
    answer: no
    text: 'The condition is not linear: $z^2$.'
  - node: closure
    text: 'Take $u = (1, 0, 1)$, which is in $W$, and $c = 2$.'
  - node: closed
    answer: no
    text: '$2u = (2, 0, 2)$ has $x + y = 2$ but $z^2 = 4$.'
  - node: counterexample
    text: '$u = (1, 0, 1) \in W$ but $2u \notin W$.'
  - node: not-subspace
    text: 'Not a subspace, although it contains $0$: containing the zero vector is necessary, not sufficient.'
```

### Is A diagonalizable?

```solution-map
id: defective-two-by-two
method: diagonalizable
task: 'Is $A = \begin{pmatrix} 5 & -1 \\ 1 & 3 \end{pmatrix}$ diagonalizable?'
steps:
  - node: polynomial
    text: '$\det(A - \lambda I) = (5 - \lambda)(3 - \lambda) + 1 = \lambda^2 - 8\lambda + 16 = (\lambda - 4)^2$: $\lambda = 4$ with algebraic multiplicity 2.'
  - node: real
    answer: yes
    text: 'The one eigenvalue, $4$, is real.'
  - node: distinct
    answer: no
    text: 'One eigenvalue, repeated.'
  - node: eigenspaces
    text: '$A - 4I = \begin{pmatrix} 1 & -1 \\ 1 & -1 \end{pmatrix}$ has rank 1, so its null space, spanned by $(1, 1)$, has dimension 1.'
  - node: enough
    answer: no
    text: 'Geometric multiplicity 1, algebraic multiplicity 2.'
  - node: not-diag
    text: 'Not diagonalizable: $\mathbb{R}^2$ has no basis of eigenvectors of $A$.'
```

## COMP 232: Mathematics for Computer Science

### Equivalence or tautology?

```solution-map
id: conditional-distributes
method: equivalence-or-tautology
task: 'Show that $(p \to q) \land (p \to r) \equiv p \to (q \land r)$.'
steps:
  - node: falsify
    answer: no
    text: 'Making the right side false needs $p$ true and $q$ or $r$ false; then one conditional on the left is false too.'
  - node: laws
    answer: yes
    text: 'Both sides are conditionals from the same $p$: rewrite them as disjunctions.'
  - node: chain
    text: '$(\lnot p \lor q) \land (\lnot p \lor r) \equiv \lnot p \lor (q \land r) \equiv p \to (q \land r)$, by the conditional law, distributivity, and the conditional law again.'
  - node: holds
    text: 'Equivalent, without the 8-row truth table.'
```

### Choosing a proof strategy

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

### Injective, surjective, bijective?

```solution-map
id: two-x-plus-three
method: injective-surjective
task: 'Is $f : \mathbb{Z} \to \mathbb{Z}$, $f(x) = 2x + 3$, injective, surjective, bijective?'
steps:
  - node: one-to-one
    text: '$2a + 3 = 2b + 3 \Rightarrow 2a = 2b \Rightarrow a = b$.'
  - node: injective
    answer: yes
    text: 'Injective.'
  - node: onto
    text: '$2x + 3 = y$ gives $x = \frac{y - 3}{2}$.'
  - node: surjective
    answer: no
    text: 'For even $y$, $\frac{y - 3}{2}$ is not an integer.'
  - node: missed
    text: '$y = 4$: $2x + 3 = 4$ needs $x = \frac12 \notin \mathbb{Z}$.'
  - node: classified
    text: 'Injective, not surjective, so not bijective. The same formula as a map $\mathbb{R} \to \mathbb{R}$ is a bijection: the domain matters.'
```

### Classifying a relation

```solution-map
id: divides
method: classifying-a-relation
task: 'Classify the relation $a \mid b$ ("$a$ divides $b$") on the positive integers.'
steps:
  - node: reflexive
    answer: yes
    text: '$a = 1 \cdot a$.'
  - node: transitive
    answer: yes
    text: '$b = ka$ and $c = lb$ give $c = (lk)a$.'
  - node: symmetric
    answer: no
    text: '$2 \mid 4$ but $4 \nmid 2$.'
  - node: antisymmetric
    answer: yes
    text: '$b = ka$ and $a = lb$ give $a = lka$, so $lk = 1$ and, for positive integers, $k = l = 1$: $a = b$.'
  - node: hasse
    text: 'The primes sit just above $1$; $6$ sits above $2$ and $3$; an edge joins $a$ to $b$ when $a \mid b$ with nothing in between.'
  - node: classified
    text: 'A partial order, not a total one: neither $2 \mid 3$ nor $3 \mid 2$.'
```

### Countable or not?

```solution-map
id: binary-sequences
method: countable-or-not
task: 'Is the set of infinite binary sequences countable?'
steps:
  - node: finite
    answer: no
    text: 'There are infinitely many.'
  - node: listable
    answer: no
    text: 'Every attempt at a first, second, third … sequence seems to leave some out.'
  - node: built
    answer: no
    text: 'Not a finite product: each sequence has infinitely many coordinates.'
  - node: diagonal
    text: 'Given any list $s_1, s_2, \dots$, define $d$ by $d_n = 1 - s_n(n)$. Then $d$ differs from $s_n$ in position $n$, for every $n$, so $d$ is not on the list.'
  - node: uncountable
    text: 'Uncountable: no list holds every sequence.'
```

## COMP 335: Introduction to Theoretical Computer Science

### From a description to a minimal DFA

```solution-map
id: second-to-last-one
method: description-to-minimal-dfa
task: 'Build a minimal DFA over $\{0, 1\}$ for the strings whose second-to-last symbol is $1$.'
steps:
  - node: direct
    answer: no
    text: 'A DFA must remember the last two symbols; guessing is easier to write.'
  - node: easier
    answer: NFA
    text: 'An NFA can guess which $1$ is the second-to-last symbol.'
  - node: nfa
    text: '$q_0$ loops on $0$ and $1$; $q_0 \xrightarrow{1} q_1$; $q_1 \xrightarrow{0,\,1} q_2$, which accepts.'
  - node: subset
    text: '$A = \{q_0\}$, $B = \{q_0, q_1\}$, $C = \{q_0, q_2\}$, $D = \{q_0, q_1, q_2\}$. On $0$: $A \to A$, $B \to C$, $C \to A$, $D \to C$. On $1$: $A \to B$, $B \to D$, $C \to B$, $D \to D$. $C$ and $D$ accept.'
  - node: minimise
    text: 'Accepting $\{C, D\}$ against $\{A, B\}$. $C$ and $D$ split on $0$ ($C \to A$ rejects, $D \to C$ accepts); $A$ and $B$ split on $1$ ($A \to B$ rejects, $B \to D$ accepts). No two states merge.'
  - node: minimal
    text: 'Four states, one for each possible pair of last two symbols: exactly what must be remembered.'
```

### Is a language regular?

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

### Is a language context-free?

```solution-map
id: abc-equal
method: context-free-or-not
task: 'Is $L = \{a^n b^n c^n \mid n \ge 0\}$ context-free?'
steps:
  - node: grammar
    answer: no
    text: 'A stack can match the $a$s with the $b$s, but then the count is gone before the $c$s.'
  - node: closure
    answer: no
    text: '$L = \{a^n b^n c^m\} \cap \{a^m b^n c^n\}$, an intersection of two CFLs, and CFLs are not closed under intersection.'
  - node: matching
    answer: yes
    text: 'Three equal counts.'
  - node: pumping
    text: 'Take $s = a^p b^p c^p$. Since $|vxy| \le p$, $vxy$ touches at most two of the three letters, so $uv^2xy^2z$ raises at least one count and at most two.'
  - node: not-cfl
    text: 'Every split fails: $L$ is not context-free.'
```

### Decidable or not?

```solution-map
id: halts-on-empty
method: decidable-or-not
task: 'Is $\mathit{HALT}_\varepsilon = \{\langle M \rangle : M \text{ halts on the empty input}\}$ decidable?'
steps:
  - node: algorithm
    answer: no
    text: 'Simulating $M$ on $\varepsilon$ answers "yes" when it halts, but never answers when it runs forever.'
  - node: about-tms
    answer: yes
    text: 'It asks what an arbitrary TM does on one input.'
  - node: reduce
    text: 'From $\langle M, w \rangle$ build $M_w$: erase the input, write $w$, run $M$. $M_w$ halts on $\varepsilon$ exactly when $M$ halts on $w$, so a decider for $\mathit{HALT}_\varepsilon$ would decide the halting problem.'
  - node: undecidable
    text: 'Undecidable, though recognisable: simulate, and accept if it halts.'
```

## COMP 352: Data Structures and Algorithms

### Big-O of a piece of code

```solution-map
id: doubling-inner-loop
method: big-o-of-code
task: 'Find the order of growth of `for (int i = 1; i <= n; i++) for (int j = 1; j < i; j *= 2) count++;`'
steps:
  - node: recursive
    answer: no
    text: 'Two loops, no calls.'
  - node: nesting
    answer: nested
    text: 'The $j$ loop runs inside the $i$ loop.'
  - node: dependent
    answer: yes
    text: 'The inner loop runs while $j < i$.'
  - node: sum
    text: '$j$ doubles, so for each $i$ the inner loop runs $\lceil \log_2 i \rceil$ times. The total $\sum_{i=1}^{n} \lceil \log_2 i \rceil$ is at most $n \lceil \log_2 n \rceil$, and its last $n/2$ terms alone are at least $\log_2 n - 1$ each.'
  - node: bound
    text: '$\Theta(n \log n)$.'
```

### Divide-and-conquer recurrence

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

### Choosing a data structure

```solution-map
id: print-queue
method: choosing-a-data-structure
task: 'A print server receives jobs at any time and always prints the waiting job with the fewest pages next. What should hold the waiting jobs?'
steps:
  - node: access
    answer: min or max
    text: 'The next job is the one with the fewest pages, whenever it arrived.'
  - node: heap
    text: 'A min-heap keyed by page count: `insert` and `removeMin` in $O(\log n)$, `min` in $O(1)$.'
  - node: chosen
    text: 'A sorted list would make `insert` $O(n)$, an unsorted one `removeMin`; the heap makes both $O(\log n)$.'
```

### Choosing a sorting algorithm

```solution-map
id: stable-by-last-name
method: choosing-a-sorting-algorithm
task: 'Sort 1 000 000 student records by last name. They are sorted by first name now, and students with the same last name must stay in that order.'
steps:
  - node: keys
    answer: no
    text: 'Names are strings of varying length.'
  - node: small
    answer: no
    text: 'A million records, in no particular order by last name.'
  - node: stable
    answer: yes
    text: 'Equal last names must keep their first-name order.'
  - node: merge
    text: 'Merge sort takes from the left run on ties, so it is stable: $O(n \log n)$ with $O(n)$ extra space.'
  - node: sorted
    text: 'Merge sort. Heap sort and the usual in-place quick sort are not stable.'
```

### Choosing a graph algorithm

```solution-map
id: fastest-routes
method: choosing-a-graph-algorithm
task: 'Travel times in minutes on two-way roads: A–B 4, A–C 1, C–B 2, B–D 1, C–D 5. Find the fastest routes from A.'
steps:
  - node: asked
    answer: shortest paths
    text: 'Fastest routes from one vertex to all the others.'
  - node: weighted
    answer: yes
    text: 'Each road has a travel time.'
  - node: dag
    answer: no
    text: 'Two-way roads make cycles.'
  - node: negative
    answer: no
    text: 'Travel times are positive.'
  - node: dijkstra
    text: 'Settle A (0), then C (1). Through C, B improves from 4 to 3 and D gets 6. Settle B (3); through B, D improves to 4. Settle D (4).'
  - node: done
    text: 'A 0; C 1; B 3 via C; D 4 via C and B.'
```

## COMP 353: Databases

### Writing a SQL query

```solution-map
id: students-per-course
method: writing-a-sql-query
task: 'Given `Course(cid, title)` and `Enrolled(sid, cid, grade)`, list every course with its number of students, including courses with none.'
steps:
  - node: tables
    answer: no
    text: 'Titles are in `Course`, enrolments in `Enrolled`.'
  - node: join
    text: 'Join on `cid`.'
  - node: unmatched
    answer: yes
    text: 'A course with no students has no row in `Enrolled` and would vanish from an inner join.'
  - node: outer
    text: '`Course c LEFT JOIN Enrolled e ON e.cid = c.cid`.'
  - node: groups
    answer: yes
    text: 'One count per course.'
  - node: group-by
    text: '`GROUP BY c.cid, c.title` with `COUNT(e.sid)`, which skips the NULLs of an unmatched course and gives 0; `COUNT(*)` would give 1.'
  - node: others
    answer: no
    text: 'No row is compared with other rows.'
  - node: select
    text: '`SELECT c.cid, c.title, COUNT(e.sid) AS students FROM Course c LEFT JOIN Enrolled e ON e.cid = c.cid GROUP BY c.cid, c.title;`'
  - node: query
    text: 'Test it with a course that has no enrolments: it must appear with 0.'
```

### From an E/R diagram to relations

```solution-map
id: employees-projects
method: er-to-relations
task: 'Translate: entity sets `Employee(eid, name)` and `Project(pid, title)`; a weak entity set `Dependent(dname, age)` owned by `Employee`; a many-to-many relationship `WorksOn` between `Employee` and `Project` with attribute `hours`.'
steps:
  - node: next
    answer: entity
    text: '`Employee`.'
  - node: entity
    text: '`Employee(eid, name)`, key `eid`.'
  - node: next
    answer: entity
    text: '`Project`.'
  - node: entity
    text: '`Project(pid, title)`, key `pid`.'
  - node: next
    answer: weak entity
    text: '`Dependent` has only a partial key, `dname`.'
  - node: weak
    text: '`Dependent(eid, dname, age)`, key `(eid, dname)`; `eid` references `Employee`.'
  - node: next
    answer: 'M : N'
    text: '`WorksOn`.'
  - node: many-many
    text: '`WorksOn(eid, pid, hours)`, key `(eid, pid)`; each is a foreign key.'
  - node: next
    answer: none left
    text: 'The relationship that owns `Dependent` needs no relation of its own: it is the foreign key `eid`.'
  - node: schema
    text: 'Four relations: `Employee`, `Project`, `Dependent`, `WorksOn`.'
```

### Which normal form is R in?

```solution-map
id: transitive-dependency
method: which-normal-form
task: 'Which normal form is $R(A, B, C, D)$ in, with $AB \to C$ and $C \to D$?'
steps:
  - node: keys
    text: '$(AB)^+ = ABCD$, while $A^+ = A$ and $B^+ = B$: $AB$ is the only key, and $A$, $B$ are the prime attributes.'
  - node: bcnf-test
    answer: no
    text: '$C \to D$ with $C^+ = CD$: $C$ is not a superkey.'
  - node: third-test
    answer: no
    text: '$D$ is not prime.'
  - node: second-test
    answer: no
    text: '$A$ and $B$, the parts of the key, determine only themselves.'
  - node: second
    text: '2NF, not 3NF: $D$ depends on the key only through $C$. Splitting into $R_1(A, B, C)$ and $R_2(C, D)$ reaches BCNF.'
```

### Normalising to BCNF

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

## COMP 248: Object-Oriented Programming I

### Choosing a control structure

```solution-map
id: read-until-valid
method: choosing-a-control-structure
task: 'Read an integer from the keyboard until the user enters one between 1 and 10.'
steps:
  - node: repeat
    answer: yes
    text: 'The prompt repeats after every bad entry.'
  - node: known
    answer: no
    text: 'Nobody knows how many bad entries will come.'
  - node: once
    answer: yes
    text: 'There is nothing to test until one number has been read.'
  - node: do-while
    text: '`do { System.out.print("Enter 1-10: "); n = keyboard.nextInt(); } while (n < 1 || n > 10);`'
  - node: code
    text: 'Trace: the inputs $0$, $12$, $7$ run the body three times and leave $n = 7$.'
```

## COMP 249: Object-Oriented Programming II

### Handling an exception

```solution-map
id: load-config
method: handling-an-exception
task: 'A method `loadConfig(String path)` opens a file with `new Scanner(new File(path))` and parses its `key=value` lines. How should it handle what can go wrong?'
steps:
  - node: checked
    answer: yes
    text: '`FileNotFoundException` is checked.'
  - node: useful
    answer: no
    text: '`loadConfig` cannot know whether its caller wants defaults, a retry or an error message.'
  - node: declare
    text: '`throws FileNotFoundException` in the header.'
  - node: resources
    answer: yes
    text: 'The `Scanner` must be closed whether parsing succeeds or not.'
  - node: finally
    text: '`try (Scanner in = new Scanner(new File(path))) { … }` closes it on every path.'
  - node: own
    answer: yes
    text: 'A malformed line is not a missing file, and no standard exception says "bad configuration".'
  - node: custom
    text: '`class ConfigException extends Exception`, thrown with the line number; `loadConfig` declares it too.'
  - node: handled
    text: 'The caller catches `FileNotFoundException` and `ConfigException` separately and decides what to do.'
```

### Choosing a collection

```solution-map
id: word-counts
method: choosing-a-collection
task: 'Count how often each word occurs in a text, then print the words in alphabetical order with their counts.'
steps:
  - node: key
    answer: yes
    text: 'Each word (the key) has a count (the value).'
  - node: map-order
    answer: yes
    text: 'The output is alphabetical.'
  - node: tree-map
    text: '`Map<String, Integer> counts = new TreeMap<>();` and, for each word, `counts.merge(word, 1, Integer::sum);`.'
  - node: chosen
    text: 'Iterating over `counts.entrySet()` gives the words in order. A `HashMap` would count just as well but print in no useful order.'
```

## STAT 280: Introduction to Statistical Programming

### Generating a random variable

```solution-map
id: rejection-quadratic
method: generating-a-random-variable
task: 'Generate a sample from the density $f(x) = \tfrac32(1 - x^2)$ on $[0, 1]$.'
steps:
  - node: builtin
    answer: no
    text: 'Not a named distribution with an `r…` function.'
  - node: invertible
    answer: no
    text: '$F(x) = \tfrac32\big(x - \tfrac{x^3}{3}\big)$: solving $F(x) = u$ means solving a cubic.'
  - node: envelope
    answer: yes
    text: '$f \le \tfrac32$ on $[0, 1]$: take $g$ the Unif(0, 1) density and $c = \tfrac32$.'
  - node: reject
    text: 'Keep $Y$ when $U \le \frac{f(Y)}{c\,g(Y)} = 1 - Y^2$; on average $1/c = 2/3$ of the proposals are kept. In R: `y <- runif(n); u <- runif(n); x <- y[u <= 1 - y^2]`.'
  - node: sample
    text: '`hist(x, freq = FALSE); curve(1.5 * (1 - x^2), add = TRUE)`: the histogram should follow the curve.'
```

## Change log

- 2026-09-24: the gallery of #120: 36 more method graphs, one worked specimen each; the page is
  now ordered by course, with the earlier specimens moved into their courses.
- 2026-09-24: six more method graphs and specimens, one per course: distributions (MAST 221),
  linear systems (MAST 234), extrema (MAST 218), regularity (COMP 335), recurrences (COMP 352),
  BCNF (COMP 353). Layout: a method no question leads to sits in the question column; ends wrap
  two per row; the controls bar moves between the task and the solution (#91).
- 2026-09-24: first version (#91): method graphs in `content/methods/`, the `solution-map` block,
  lint of the walk, the stepped view beside a Cytoscape graph; three method graphs and four
  specimens.
