This page is the design doc for **math-kind unit pages**: MATH, MAST, COMP 232 and COMP 335 — every
course whose `courses/<CODE>.md` says `pages: math`. It is rendered by the same code as a real unit,
so what you see here is what every math unit looks like. To change the design, change the styles in
`app/src/styles/base.css` (the `.blk` rules and `.pages-math`), check this page in both themes and at
phone width, and add a line to the change log at the bottom.

## The rules

### Blocks

A unit body is prose plus **blocks**. A block is a fenced container:

```markdown
:::definition[Riemann sum]
Text, inline math $x_i^*$, and display math on as many lines as it needs:

$$
\sum_{i=1}^{n} f(x_i^*)\,\Delta x
$$
:::
```

The name after `:::` says what the block is; the text in brackets is its title (optional). To nest
a block, give the **outer** one more colons than the inner (`::::theorem` around `:::proof`), and
close each with the same number of colons it opened with.

| Block | Use it for | Title |
|---|---|---|
| `definition` | introducing a concept or a term | the term |
| `theorem`, `lemma`, `proposition`, `corollary` | a statement that is proved or cited | its name, if it has one |
| `proof` | the argument; nested in its statement, or right after it. **Collapsed** until opened | — |
| `example` | a worked problem | what it computes |
| `solution` | the worked answer, nested in its example. **Collapsed** until opened, so an example can be tried first | — |
| `steps` | a method or algorithm, as a numbered list | the method |
| `note`, `remark` | an aside that is not needed on first reading | optional |
| `caution` | a common mistake and how to avoid it | optional |
| `insight` | the one idea of a part, at its end | — |
| `equations` | the part's formulas, one per line, with a word each | — |

Lint rejects any other name.

### Parts

- `##` is a **part** (one topic), `###` a **sub-part**. Nothing deeper: a fourth level is a sign the
  part should be split.
- Inside a part, in this order: motivation (prose) → definitions → statements with their proofs →
  examples → the interactive example with its Python code → caution / insight.
- The unit ends with `## Further reading`.

### Math

- Inline math for symbols inside a sentence; **display math** for anything with a fraction, a sum,
  an integral or more than one relation. In a block, display math may span lines.
- **Line spacing follows the math.** A paragraph or list item whose inline math is taller than a
  line (a fraction, sum, integral, limit, root or nested script) automatically gets 20 % more line
  spacing, so stacked symbols do not touch the lines above and below.
- **A display never scrolls sideways.** When it is wider than the column, it breaks — never in the
  middle of a formula, only at these points, in this order:
  1. between independent formulas, written with `\qquad` (or `\quad`) between them: each goes on
     its own centred line (a relation such as `\Longrightarrow` standing alone between two formulas
     starts the next line);
  2. then before each relation of a chain (`=`, `\le`, `\Rightarrow`, …), aligned on the relation.

  So write independent formulas side by side with `\qquad`, and chains on one line: the page puts
  them on one line when there is room and breaks them when there is not (on a phone, or in a
  narrow block). An `aligned` you wrote yourself also breaks each row before its `&=` when a
  row is too wide. A formula with no break point at all is shrunk (to 75 % at most) before it
  would scroll; if that is not enough, split it by hand with `aligned`.
- Never a bare `$` in prose (write "75 dollars").

## Specimens

### Definition

:::definition[Definite integral]
Let $f$ be defined on $[a, b]$, split into $n$ subintervals of width $\Delta x = \frac{b-a}{n}$ with
sample points $x_i^* \in [x_{i-1}, x_i]$. If the limit exists and is the same for every choice of
sample points, then

$$
\int_a^b f(x)\,dx \;=\; \lim_{n\to\infty} \sum_{i=1}^{n} f\!\left(x_i^*\right)\Delta x ,
$$

and $f$ is called **integrable** on $[a,b]$.
:::

### Statement with its proof

::::theorem[Comparison test]
Suppose $0 \le a_n \le b_n$ for all $n \ge N$.

1. If $\displaystyle\sum_{n=1}^{\infty} b_n$ converges, then $\displaystyle\sum_{n=1}^{\infty} a_n$ converges.
2. If $\displaystyle\sum_{n=1}^{\infty} a_n$ diverges, then $\displaystyle\sum_{n=1}^{\infty} b_n$ diverges.

:::proof
The partial sums $s_k = \sum_{n=N}^{k} a_n$ and $t_k = \sum_{n=N}^{k} b_n$ are increasing, and
$s_k \le t_k$ for every $k$. In case 1, $t_k \le T = \sum_{n \ge N} b_n$, so $(s_k)$ is increasing and
bounded above by $T$, hence convergent by the monotone sequence theorem. Case 2 is the contrapositive
of case 1 with the roles read backwards.
:::
::::

:::corollary
If $0 \le a_n \le C\,r^n$ with $0 < r < 1$, then $\sum a_n$ converges.
:::

### Example with its solution

::::example[A partial-fraction integral]
Evaluate $\displaystyle\int \frac{5x - 4}{x^2 - x - 2}\,dx$.

:::solution
The denominator factors as $(x-2)(x+1)$, so

$$
\frac{5x-4}{(x-2)(x+1)} = \frac{A}{x-2} + \frac{B}{x+1}
\quad\Longrightarrow\quad
5x - 4 = A(x+1) + B(x-2).
$$

Setting $x = 2$ gives $A = 2$; setting $x = -1$ gives $B = 3$. Therefore

$$
\begin{aligned}
\int \frac{5x - 4}{x^2 - x - 2}\,dx
  &= \int \left( \frac{2}{x-2} + \frac{3}{x+1} \right) dx \\
  &= 2\ln\lvert x - 2\rvert + 3\ln\lvert x + 1\rvert + C .
\end{aligned}
$$
:::
::::

### Method

:::steps[Choosing an integration technique]
1. Simplify the integrand first: expand, cancel, use an identity.
2. Is part of it the derivative of another part? Substitute $u = g(x)$.
3. A product of a polynomial and $e^{x}$, $\sin x$, $\ln x$? Integrate by parts, $\int u\,dv = uv - \int v\,du$.
4. A rational function? Divide if $\deg P \ge \deg Q$, then partial fractions.
5. $\sqrt{a^2 - x^2}$, $\sqrt{a^2 + x^2}$, $\sqrt{x^2 - a^2}$? Trigonometric substitution.
:::

### Asides

:::note
The sample points $x_i^*$ may be left endpoints, right endpoints or midpoints; for an integrable $f$
the limit does not depend on the choice.
:::

:::caution
$\displaystyle\frac{d^2y}{dx^2} \neq \frac{y''(t)}{x''(t)}$ on a parametric curve. Differentiate the
slope $\frac{dy}{dx}$ with respect to $t$, then divide by $x'(t)$ once more.
:::

:::insight
A series converges exactly when its partial sums do; every test in this chapter is a way to bound or
compare partial sums without computing them.
:::

### Dense display math

A worst case for width: a matrix, cases and a chain side by side, separated by `\qquad`. On a wide
screen it may fit on one line; otherwise each formula takes its own centred line, and on a phone
the chain also breaks before its `=` signs.

$$
A = \begin{pmatrix} 2 & -1 & 0 \\ -1 & 2 & -1 \\ 0 & -1 & 2 \end{pmatrix},
\qquad
f(x) = \begin{cases} \dfrac{\sin x}{x}, & x \neq 0, \\[4pt] 1, & x = 0, \end{cases}
\qquad
\lim_{x\to 0}\frac{1-\cos x}{x^2} = \lim_{x\to 0}\frac{\sin x}{2x} = \frac12 .
$$

Inline, the same density (this paragraph gets the wider line spacing): the Maclaurin series $\sin x = \sum_{n=0}^{\infty} \frac{(-1)^n x^{2n+1}}{(2n+1)!}$
converges for every $x$, while $\frac{1}{1-x} = \sum_{n=0}^{\infty} x^n$ needs $\lvert x\rvert < 1$ and
$\int_1^{\infty} x^{-p}\,dx = \frac{1}{p-1}$ needs $p > 1$.

### Interactive example and its code

```sim
id: calc-riemann-sums
controls:
  - {id: n, label: "Rectangles n", min: 1, max: 40, step: 1, default: 6, decimals: 0}
  - {id: rule, label: "Sample point (0 left, 1 right, 2 midpoint)", min: 0, max: 2, step: 1, default: 0, decimals: 0}
note: 'Specimen copy of the MATH 205 sim, to check its spacing against the blocks around it.'
verified: [interface, content]
```

```python
def riemann(f, a, b, n, shift=0.0):
    dx = (b - a) / n
    return sum(f(a + (i + shift) * dx) for i in range(n)) * dx

print(round(riemann(lambda x: x * x, 0, 2, 6), 4))   # 2.037 (left endpoints)
```

### Formula summary

:::equations
- *Riemann sum*: $\sum_{i=1}^{n} f(x_i^*)\,\Delta x$, $\Delta x = \frac{b-a}{n}$.
- *FTC*: $\frac{d}{dx}\int_a^x f(t)\,dt = f(x)$ and $\int_a^b f(x)\,dx = F(b) - F(a)$.
- *By parts*: $\int u\,dv = uv - \int v\,du$.
:::

## Change log

- 2026-09-23: proofs and solutions collapsed by default; paragraphs with tall inline math get 20 %
  more line spacing; display math breaks at independent-formula and relation points, centred,
  instead of scrolling sideways, shrinking to 75 % only when it has no break point; a one-line
  `$$…$$` now renders as a display (it rendered as inline math before) (#89, owner review of the
  first version).
- 2026-09-23: first version (#89): containers replace `> **Label.**` callouts; theorem-type blocks
  violet, definitions blue; proofs as an indented rule ending in ∎; solutions nested in examples
  under a dashed divider; math pages get line-height 1.75 and more room around display math.
