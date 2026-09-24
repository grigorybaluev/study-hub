---
title: Multivariate, marginal and conditional distributions
order: 6
status: detailed
weeks: [4]
textbook: "Miller & Miller, John E. Freund's Mathematical Statistics with Applications, 8e, 3.5-3.7"
notes: ["Doedel, Probability and Statistics lecture notes (Concordia), pp. 82–100: joint pmf and joint distribution function of the three-toss pair (number of heads, toss of the first head), independence, conditional pmfs", "Doedel, pp. 150–166: joint densities, marginal densities, independence of e^(−x−y), conditional densities"]
introduces: [joint-distribution]
requires:
  - {concept: random-variable, strength: hard}
  - {concept: probability-mass-function, strength: hard}
  - {concept: probability-density-function, strength: hard}
  - {concept: conditional-probability, strength: hard}
  - {concept: multiple-integral, strength: hard}
reinforces: []
---

One experiment usually produces several numbers at once: the number of heads and the toss of the
first head, a person's height and weight, the arrival times of two buses. To ask how they relate
— does one tell us anything about the other? — we need their **joint distribution**, which
assigns probabilities to statements about both at the same time. From it we can recover each
variable on its own (the **marginals**), restrict one variable by the value of the other (the
**conditionals**), and say precisely what it means for the two to be unrelated
(**independence**). Everything here is the conditional probability and independence of unit 3,
applied to the events $\{X = x\}$ and $\{Y = y\}$.

## Joint distributions

### Two discrete random variables

:::definition[Joint probability mass function]
For discrete random variables $X$ and $Y$ on the same sample space, the **joint pmf** is

$$
p(x, y) = P(X = x,\ Y = y),
$$

the probability that $X = x$ **and** $Y = y$. It satisfies $p(x, y) \ge 0$ and
$\sum_x \sum_y p(x, y) = 1$.
:::

::::example[Three tosses]
Toss a fair coin three times; let $X$ = the number of heads and $Y$ = the toss of the first head
($Y = 0$ for $TTT$). Tabulate $p(x, y)$.

:::solution
Each of the 8 outcomes gives one pair $(X, Y)$: $HHH \to (3,1)$, $HHT \to (2,1)$, $HTH \to (2,1)$,
$HTT \to (1,1)$, $THH \to (2,2)$, $THT \to (1,2)$, $TTH \to (1,3)$, $TTT \to (0,0)$. Collecting
them:

| | $y = 0$ | $y = 1$ | $y = 2$ | $y = 3$ |
|---|---|---|---|---|
| $x = 0$ | $1/8$ | 0 | 0 | 0 |
| $x = 1$ | 0 | $1/8$ | $1/8$ | $1/8$ |
| $x = 2$ | 0 | $2/8$ | $1/8$ | 0 |
| $x = 3$ | 0 | $1/8$ | 0 | 0 |

The eight entries add up to 1. The cells are the events $\{X = x, Y = y\}$, which partition $S$
just as the level sets of one random variable do.
:::
::::

### The joint distribution function

:::definition[Joint distribution function]
$F(x, y) = P(X \le x,\ Y \le y)$ for all real $x, y$. In the discrete case it is
$\sum_{s \le x} \sum_{t \le y} p(s, t)$, the total of the table north-west of $(x, y)$.
:::

::::proposition[Probability of a rectangle]
For $a_1 < b_1$ and $a_2 < b_2$,

$$
\begin{aligned}
&P(a_1 < X \le b_1,\ a_2 < Y \le b_2) \\
  &= F(b_1, b_2) - F(a_1, b_2) \\
  &\quad - F(b_1, a_2) + F(a_1, a_2).
\end{aligned}
$$

:::proof
Let $A = \{X \le a_1, Y \le b_2\}$ and $B = \{X \le b_1, Y \le a_2\}$, both inside
$\{X \le b_1, Y \le b_2\}$. The rectangle is what remains of $\{X \le b_1, Y \le b_2\}$ after
removing $A \cup B$, and $A \cap B = \{X \le a_1, Y \le a_2\}$. By the addition rule,

$$
\begin{aligned}
P(\text{rectangle}) &= F(b_1, b_2) \\
  &\quad - \big[F(a_1, b_2) + F(b_1, a_2) \\
  &\qquad - F(a_1, a_2)\big].
\end{aligned}
$$
:::
::::

::::example[A rectangle in the three-toss table]
Find $P(1 < X \le 3,\ 1 < Y \le 3)$ both from the table and from $F$.

:::solution
From the table, the cells with $x \in \{2, 3\}$ and $y \in \{2, 3\}$ hold only $p(2, 2) = 1/8$.
From $F$: $F(3,3) = 1$, $F(1,3) = P(X \le 1) = 4/8$, $F(3,1) = P(Y \le 1) = 5/8$ and
$F(1,1) = p(0,0) + p(1,1) = 2/8$, so

$$
1 - \frac48 - \frac58 + \frac28 = \frac18 .
$$
:::
::::

### Two continuous random variables

:::definition[Joint probability density]
$X$ and $Y$ are **jointly continuous** with **joint density** $f(x, y)$ when, for every region $A$
of the plane,

$$
P\big((X, Y) \in A\big) = \iint_A f(x, y)\,dx\,dy .
$$

A joint density satisfies $f \ge 0$ and $\iint_{\mathbb{R}^2} f = 1$ (the total volume under the
surface is 1). Its joint distribution function is
$F(x, y) = \int_{-\infty}^{y}\int_{-\infty}^{x} f(s, t)\,ds\,dt$, and
$f = \dfrac{\partial^2 F}{\partial x\,\partial y}$ where $f$ is continuous.
:::

::::example[Two exponential waiting times]
Let $f(x, y) = e^{-x-y}$ for $x > 0$, $y > 0$ and $0$ otherwise. Find $F$ and
$P(1 < X \le 2,\ 0 < Y \le 1)$.

:::solution
For $x, y > 0$,

$$
F(x, y) = \int_0^y \int_0^x e^{-s} e^{-t}\,ds\,dt = (1 - e^{-x})(1 - e^{-y}),
$$

and $F = 0$ if $x \le 0$ or $y \le 0$. Differentiating in $x$ and then in $y$ gives back
$e^{-x}e^{-y}$. The rectangle has probability

$$
\int_0^1 \int_1^2 e^{-x-y}\,dx\,dy = (e^{-1} - e^{-2})(1 - e^{-1}) \approx 0.147 .
$$
:::
::::

::::example[A density on the unit square]
Let $f(x, y) = x + y$ for $0 < x < 1$, $0 < y < 1$ and $0$ otherwise. Check that it is a joint
density and find $P(X \le \frac12,\ Y \le \frac12)$.

:::solution
$f \ge 0$, and $\int_0^1\int_0^1 (x + y)\,dx\,dy = \frac12 + \frac12 = 1$. Over the lower-left
quarter,

$$
\int_0^{1/2}\int_0^{1/2} (x + y)\,dx\,dy = 2 \cdot \frac12 \cdot \frac18 = \frac18,
$$

less than the quarter the area would suggest: the density is smallest near the origin.
:::
::::

:::note
Everything extends to $n$ random variables $X_1, \dots, X_n$: a joint pmf
$p(x_1, \dots, x_n)$ or a joint density $f(x_1, \dots, x_n)$, with sums or $n$-fold integrals.
:::

## Marginal distributions

### Summing or integrating out the other variable

:::definition[Marginal distribution]
The **marginal pmf** of $X$ is $p_X(x) = \sum_y p(x, y)$, the row totals of the joint table; the
**marginal density** of a jointly continuous $X$ is

$$
f_X(x) = \int_{-\infty}^{\infty} f(x, y)\,dy ,
$$

and similarly for $Y$ with the roles swapped. The marginal distribution of $X$ is just the
distribution of $X$ on its own.
:::

::::proposition[Marginals are the distributions of X and Y]
$p_X(x) = P(X = x)$, and the marginal distribution function is $F_X(x) = F(x, \infty)$.

:::proof
The events $\{X = x, Y = y\}$ for the different $y$ are mutually exclusive and their union is
$\{X = x\}$, so their probabilities add to $P(X = x)$. Letting $y \to \infty$ in
$F(x, y) = P(X \le x, Y \le y)$ removes the condition on $Y$. The continuous case is the same with
the sum replaced by an integral.
:::
::::

::::example[Marginals of the three-toss table]
Find $p_X$ and $p_Y$.

:::solution
Row totals: $p_X(0), \dots, p_X(3) = 1/8,\ 3/8,\ 3/8,\ 1/8$ — the pmf of the number of heads from
unit 4. Column totals: $p_Y(0), \dots, p_Y(3) = 1/8,\ 4/8,\ 2/8,\ 1/8$. The marginals are written
in the margins of the table, hence the name.
:::
::::

::::example[Marginals of the continuous examples]
Find the marginal densities for $f(x, y) = e^{-x-y}$ and for $f(x, y) = x + y$ on the unit square.

:::solution
For $e^{-x-y}$: $f_X(x) = \int_0^\infty e^{-x-y}\,dy = e^{-x}$ for $x > 0$, and likewise
$f_Y(y) = e^{-y}$. For $x + y$: $f_X(x) = \int_0^1 (x + y)\,dy = x + \frac12$ on $(0,1)$, and
$f_Y(y) = y + \frac12$.
:::
::::

:::caution
The marginals do not determine the joint distribution. The table of two fair coins tossed
separately and the table of one coin whose result is copied twice have the same marginals
($\frac12, \frac12$ each) but different joint pmfs. Going from joint to marginal loses information.
:::

## Independence and conditional distributions

### Independent random variables

:::definition[Independent random variables]
$X$ and $Y$ are **independent** if the events $\{X = x\}$ and $\{Y = y\}$ are independent for
all $x, y$, that is,

$$
p(x, y) = p_X(x)\,p_Y(y) \quad \text{for all } x, y,
$$

and, for jointly continuous variables, $f(x, y) = f_X(x)\,f_Y(y)$ for all $x, y$.
:::

::::theorem[Independence factors the distribution function]
If $X$ and $Y$ are independent, then $F(x, y) = F_X(x)\,F_Y(y)$ for all $x, y$.

:::proof
In the discrete case,

$$
F(x, y) = \sum_{s \le x}\sum_{t \le y} p_X(s)\,p_Y(t) = \Big(\sum_{s \le x} p_X(s)\Big)\Big(\sum_{t \le y} p_Y(t)\Big) = F_X(x)\,F_Y(y).
$$

In the continuous case the double integral of $f_X(s)f_Y(t)$ splits into a product of two single
integrals in the same way.
:::
::::

::::example[Is the three-toss pair independent?]
Decide whether $X$ (the number of heads) and $Y$ (the toss of the first head) are independent.

:::solution
One cell is enough to break independence: $p(2, 1) = 2/8$, while
$p_X(2)\,p_Y(1) = \frac38 \cdot \frac48 = \frac{3}{16} \ne \frac14$. They are dependent — an
early first head leaves more tosses in which to collect heads. (Even more directly:
$p(0, 1) = 0$ but $p_X(0)p_Y(1) > 0$.)
:::
::::

::::example[Independent waiting times]
Are $X$ and $Y$ with joint density $e^{-x-y}$ ($x, y > 0$) independent? And with $x + y$ on the
unit square?

:::solution
$e^{-x-y} = e^{-x}\,e^{-y} = f_X(x)\,f_Y(y)$ everywhere (both sides are $0$ off the quadrant), so
the waiting times are independent. For $x + y$: $(x + \frac12)(y + \frac12) \ne x + y$, for
example at $(0, 0)$ the product is $\frac14$ and the density is $0$, so they are dependent.
:::
::::

### Conditional distributions

Conditioning on $\{Y = y\}$ restricts the sample space to one column of the joint table. The
column's entries, divided by the column total, are the new probabilities of the values of $X$.

:::definition[Conditional distribution]
If $p_Y(y) > 0$, the **conditional pmf** of $X$ given $Y = y$ is

$$
p(x \mid y) = P(X = x \mid Y = y) = \frac{p(x, y)}{p_Y(y)} .
$$

For jointly continuous variables with $f_Y(y) > 0$, the **conditional density** is
$f(x \mid y) = f(x, y)/f_Y(y)$, and $P(a < X \le b \mid Y = y) = \int_a^b f(x \mid y)\,dx$.
:::

::::proposition[Conditionals and independence]
For fixed $y$, $p(x \mid y)$ is a pmf in $x$ (and $f(x \mid y)$ a density). $X$ and $Y$ are
independent exactly when $p(x \mid y) = p_X(x)$ for every $y$ with $p_Y(y) > 0$: learning $Y$
does not change the distribution of $X$.

:::proof
$p(x \mid y) \ge 0$, and $\sum_x p(x \mid y) = p_Y(y)/p_Y(y) = 1$. The equation
$p(x, y)/p_Y(y) = p_X(x)$ is the independence condition divided by $p_Y(y)$.
:::
::::

::::example[Conditioning in the three-toss table]
Find $P(X = 2 \mid Y = 1)$, $P(Y = 1 \mid X = 2)$ and the whole conditional pmf of $X$ given
$Y = 1$.

:::solution
$P(X = 2 \mid Y = 1) = \frac{2/8}{4/8} = \frac12$ and $P(Y = 1 \mid X = 2) = \frac{2/8}{3/8} = \frac23$
— the same numerator, different denominators. Given $Y = 1$ (the first toss is a head), column
$y = 1$ rescaled by $p_Y(1) = 4/8$ gives

$$
p(1 \mid 1) = \tfrac14 \qquad p(2 \mid 1) = \tfrac12 \qquad p(3 \mid 1) = \tfrac14 ,
$$

the distribution of $1 +{}$ (heads in the last two tosses), as it should be.
:::
::::

::::example[A conditional density]
For $f(x, y) = x + y$ on the unit square, find $f(x \mid y)$ and $P(X \le \frac12 \mid Y = 1)$.

:::solution
$f(x \mid y) = \dfrac{x + y}{y + \frac12}$ for $0 < x < 1$. At $y = 1$ it is $\frac23(x + 1)$, and

$$
P\!\left(X \le \tfrac12 \mid Y = 1\right) = \int_0^{1/2} \tfrac23 (x + 1)\,dx = \tfrac23\left(\tfrac18 + \tfrac12\right) = \tfrac{5}{12} .
$$

Unconditionally $P(X \le \frac12) = \int_0^{1/2}(x + \frac12)\,dx = \frac38$: knowing $Y = 1$ moves
probability towards small $x$, because the conditional density $x + 1$ is flatter, relative to
its size, than the marginal $x + \frac12$.
:::
::::

:::equations
- *Joint pmf*: $p(x, y) = P(X = x, Y = y)$; joint density: $P((X,Y) \in A) = \iint_A f$.
- *Rectangle*: $P(a_1 < X \le b_1, a_2 < Y \le b_2) = F(b_1,b_2) - F(a_1,b_2) - F(b_1,a_2) + F(a_1,a_2)$.
- *Marginals*: $p_X(x) = \sum_y p(x, y)$ and $f_X(x) = \int f(x, y)\,dy$.
- *Independence*: $p(x, y) = p_X(x)p_Y(y)$, or $f(x, y) = f_X(x)f_Y(y)$, for all $x, y$.
- *Conditional*: $p(x \mid y) = p(x, y)/p_Y(y)$ and $f(x \mid y) = f(x, y)/f_Y(y)$.
:::

```sim
id: joint-pmf
controls:
  - {id: ex, label: "pair (0: heads and first head, 1: first roll and sum of two four-sided dice, 2: toss 1 and tosses 2–3)", min: 0, max: 2, step: 1, default: 0, decimals: 0}
  - {id: y, label: "condition on Y = y", min: 0, max: 8, step: 1, default: 1, decimals: 0}
note: "Left: the joint pmf, rows x, columns y; the yellow frame is the column Y = y. Right: the marginal pmf of X (grey) against the conditional pmf of X given Y = y (green) — the framed column divided by its total. Where every green bar matches its grey bar for every y, the pair is independent: try pair 2. Pair 1 is the four-sided-die exercise: given the sum, the first roll is spread evenly over the rolls that can produce it."
```

```python
# Joint, marginal and conditional pmfs of the three-toss pair, from the outcomes.
import itertools
from fractions import Fraction
from collections import Counter

S = [''.join(s) for s in itertools.product('HT', repeat=3)]
X = lambda s: s.count('H')                 # number of heads
Y = lambda s: s.find('H') + 1              # toss of the first head, 0 if none

joint = Counter((X(s), Y(s)) for s in S)
p = {xy: Fraction(c, len(S)) for xy, c in joint.items()}
pX, pY = Counter(), Counter()
for (x, y), v in p.items():
    pX[x] += v
    pY[y] += v

print('p_X:', {x: str(v) for x, v in sorted(pX.items())})
print('p_Y:', {y: str(v) for y, v in sorted(pY.items())})

independent = all(p.get((x, y), 0) == pX[x] * pY[y] for x in pX for y in pY)
print('independent:', independent)                                  # False

y = 1
print(f'p(x | Y={y}):', {x: str(p.get((x, y), 0) / pY[y]) for x in sorted(pX)})
```

:::insight
The joint distribution is the whole story; marginals and conditionals are two ways of reading it —
adding up a row, or rescaling a column. Independence is the special case where every column,
rescaled, looks the same as the marginal, so reading $Y$ first tells you nothing about $X$.
:::

## Further reading

- [Joint probability distribution](https://en.wikipedia.org/wiki/Joint_probability_distribution), [Marginal distribution](https://en.wikipedia.org/wiki/Marginal_distribution) and [Conditional probability distribution](https://en.wikipedia.org/wiki/Conditional_probability_distribution) — Wikipedia.
- [Seeing Theory — Probability Distributions](https://seeing-theory.brown.edu/probability-distributions/index.html) — includes a joint-distribution view.
