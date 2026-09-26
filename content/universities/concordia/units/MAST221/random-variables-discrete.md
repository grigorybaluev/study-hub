---
title: Random variables and discrete distributions
order: 4
status: detailed
weeks: [3]
introduces: [random-variable, probability-mass-function, cumulative-distribution-function]
requires:
  - {concept: probability, strength: hard}
  - {concept: function, strength: hard}
  - {concept: event, strength: soft}
reinforces: []
---

Toss a coin three times and the sample space is a list of letter strings: $HHT$, $THT$, … Most
questions about the experiment are not about the strings but about a number read off each of
them: how many heads, on which toss the first head came. A **random variable** is that number,
made precise as a function on the sample space. Once the outcomes are numbers, the whole
probability model of the experiment fits in one table (the probability mass function) or one
graph (the distribution function), and the rest of the course is about those two objects.

## Random variables

### A number attached to every outcome

:::definition[Random variable]
A **random variable** is a function $X : S \to \mathbb{R}$ that assigns a real number $X(s)$ to
every outcome $s$ of the sample space. It is **discrete** when it takes finitely many or countably
many values — in particular whenever $S$ itself is finite or countably infinite.
:::

When it is clear what $S$ is, we write $X$ instead of $X(s)$. Capital letters name the random
variable; lower-case letters name the values it takes, as in $X = x$.

::::example[Three tosses]
Toss a coin three times, with sample space

$$
\begin{aligned}
S = \{&HHH,\ HHT,\ HTH,\ HTT, \\
      &THH,\ THT,\ TTH,\ TTT\}.
\end{aligned}
$$

Define
$X(s)$ = the number of heads in $s$, and $Y(s)$ = the toss on which the first head appears, with
$Y(TTT) = 0$. Tabulate both random variables.

:::solution
| $s$ | $HHH$ | $HHT$ | $HTH$ | $HTT$ | $THH$ | $THT$ | $TTH$ | $TTT$ |
|---|---|---|---|---|---|---|---|---|
| $X(s)$ | 3 | 2 | 2 | 1 | 2 | 1 | 1 | 0 |
| $Y(s)$ | 1 | 1 | 1 | 1 | 2 | 2 | 3 | 0 |

Two different functions on the same sample space: every experiment carries as many random
variables as there are questions to ask about it.
:::
::::

### Values of $X$ are events

A statement about the value of $X$ picks out the outcomes for which it is true, so it is an
event, and it has a probability. For the three tosses,

$$
\{X = 2\} = \{HHT, HTH, THH\}
\qquad
\{1 < X \le 3\} = \{HHH, HHT, HTH, THH\}.
$$

We write $P(X = 2)$ for $P(\{s \in S : X(s) = 2\})$, and similarly for any range of values.

::::proposition[The level sets of $X$ partition $S$]
The events $E_x = \{s \in S : X(s) = x\}$, one for each value $x$ of $X$, are mutually exclusive
and their union is $S$.

:::proof
Every outcome $s$ lies in $E_{X(s)}$, so the union is $S$. An outcome cannot lie in two of them,
$E_x$ and $E_{x'}$ with $x \ne x'$, because $X(s)$ has a single value: that is what it means for
$X$ to be a function.
:::
::::

:::insight
A random variable adds no new randomness: all the chance is in which outcome occurs, and $X$ only
relabels the outcomes by numbers. Everything we compute about $X$ is a probability of an event in
$S$.
:::

## The probability mass function

### Definition and properties

:::definition[Probability mass function]
The **probability mass function** (pmf) of a discrete random variable $X$ is

$$
p(x) = P(X = x)
$$

for every real $x$. It is zero except at the countably many values $X$ takes. It is also
called the *probability distribution* and written $f(x)$; $p_X(x)$ is used when several random
variables are around.
:::

::::theorem[What makes a pmf]
A function $p$ is the pmf of some discrete random variable exactly when

1. $p(x) \ge 0$ for every $x$, and
2. $\displaystyle\sum_{x} p(x) = 1$, the sum over the values where $p(x) > 0$.

:::proof
For a pmf, (1) holds because probabilities are non-negative, and (2) because the events
$\{X = x\}$ partition $S$ (the proposition above), so their probabilities add up to $P(S) = 1$.
Conversely, a function with (1) and (2) is the pmf of the random variable $X(s) = s$ on the
sample space made of its values, each value $x$ given probability $p(x)$.
:::
::::

::::example[The pmf of the number of heads]
With $X$ = the number of heads in three tosses of a fair coin, find $p(x)$ and check that it
sums to 1.

:::solution
Count the outcomes in each level set of the table above, each outcome having probability $1/8$:

| $x$ | 0 | 1 | 2 | 3 |
|---|---|---|---|---|
| $p(x)$ | $1/8$ | $3/8$ | $3/8$ | $1/8$ |

and $1/8 + 3/8 + 3/8 + 1/8 = 1$. The outcomes of $S$ are equally likely; the values of $X$ are
not.
:::
::::

::::example[Finding the constant]
For which $c$ is $p(x) = c\,x$, $x = 1, 2, 3, 4$, a pmf? What is then $P(X \ge 3)$?

:::solution
The values are non-negative for $c \ge 0$, and they must sum to 1:
$c(1 + 2 + 3 + 4) = 10c = 1$, so $c = 1/10$. Then $P(X \ge 3) = p(3) + p(4) = 7/10$.
:::
::::

::::example[Tossing until the first head]
Toss a fair coin until a head appears, and let $X$ be the number of tosses. Find the pmf of $X$.

:::solution
The sample space $S = \{H, TH, TTH, TTTH, \dots\}$ is countably infinite, and $X(H) = 1$,
$X(TH) = 2$, $X(TTH) = 3$, … The outcome with $k - 1$ tails and then a head has probability
$(1/2)^k$, so

$$
p(k) = \frac{1}{2^k}, \qquad k = 1, 2, 3, \dots
$$

It sums to 1 as a geometric series:

$$
\sum_{k=1}^{\infty} \frac{1}{2^k} = \lim_{n \to \infty} \sum_{k=1}^{n} \frac{1}{2^k} = \lim_{n \to \infty} \left(1 - \frac{1}{2^n}\right) = 1.
$$
:::
::::

:::insight
A pmf is a list of non-negative weights that add up to 1. Any such list is a legitimate
probability model; which list fits an experiment is decided by counting, by symmetry or by data.
:::

## The distribution function

### Definition and properties

:::definition[Distribution function]
The **(cumulative) distribution function** of $X$ is

$$
F(x) = P(X \le x) = \sum_{t \le x} p(t), \qquad -\infty < x < \infty .
$$

It is defined for every real $x$, not only at the values $X$ takes.
:::

::::theorem[Properties of a distribution function]
1. $0 \le F(x) \le 1$, $\displaystyle\lim_{x \to -\infty} F(x) = 0$ and $\displaystyle\lim_{x \to \infty} F(x) = 1$.
2. $F$ is non-decreasing: $a < b$ implies $F(a) \le F(b)$.
3. $P(a < X \le b) = F(b) - F(a)$ for $a < b$.

:::proof
(3) first: the event $\{X \le b\}$ is the union of the mutually exclusive events $\{X \le a\}$
and $\{a < X \le b\}$, so $F(b) = F(a) + P(a < X \le b)$. (2) follows because the probability in
(3) is non-negative. For (1), $F(x)$ is a probability; as $x \to \infty$ the sum defining $F(x)$
takes in every value of $X$ and tends to $\sum_x p(x) = 1$, and as $x \to -\infty$ it takes in
none of them.
:::
::::

For a discrete variable $F$ is a **step function**: flat between the values of $X$, with a jump of
height $p(x)$ at each value $x$. At the jump the function takes the upper value (it is continuous
from the right), because $F(x)$ includes $P(X = x)$. Reading it backwards gives the pmf:

$$
p(x) = F(x) - \lim_{t \to x^-} F(t),
\qquad
p(k) = F(k) - F(k-1) \text{ when the values are integers.}
$$

::::example[Distribution function of the number of heads]
For $X$ = the number of heads in three tosses, write out $F(x)$ for all real $x$ and use it to
find $P(0 < X \le 2)$.

:::solution
Adding the pmf from the left,

$$
F(x) = \begin{cases} 0, & x < 0, \\ 1/8, & 0 \le x < 1, \\ 4/8, & 1 \le x < 2, \\ 7/8, & 2 \le x < 3, \\ 1, & x \ge 3. \end{cases}
$$

So $F(-1) = 0$, $F(1.5) = 1/2$ and $F(4) = 1$. Then

$$
P(0 < X \le 2) = F(2) - F(0) = \frac{7}{8} - \frac{1}{8} = \frac{3}{4},
$$

the same as $p(1) + p(2)$.
:::
::::

::::example[Tossing until the first head, again]
Find $F(n) = P(X \le n)$ for the number of tosses until the first head, and the probability that
more than 5 tosses are needed.

:::solution
$F(n) = \sum_{k=1}^{n} 2^{-k} = 1 - 2^{-n}$ for $n = 1, 2, \dots$ (and $F$ is constant between the
integers). So $P(X > 5) = 1 - F(5) = 2^{-5} = 1/32$ — the same as "the first five tosses are all
tails", as it should be.
:::
::::

:::equations
- *pmf*: $p(x) = P(X = x)$, with $p(x) \ge 0$ and $\sum_x p(x) = 1$.
- *Distribution function*: $F(x) = P(X \le x) = \sum_{t \le x} p(t)$.
- *Intervals*: $P(a < X \le b) = F(b) - F(a)$.
- *Back to the pmf*: $p(k) = F(k) - F(k - 1)$ for integer values.
:::

```sim
id: rv-pmf-cdf
controls:
  - {id: ex, label: "experiment (0: heads in n tosses, 1: sum of two dice, 2: tosses until the first head)", min: 0, max: 2, step: 1, default: 0, decimals: 0}
  - {id: n, label: "n tosses (experiment 0)", min: 1, max: 8, step: 1, default: 3, decimals: 0}
  - {id: x, label: x, min: -1, max: 12, step: 0.5, default: 1.5, decimals: 1}
note: "Top: the pmf, with the bars at values ≤ x in green. Bottom: the distribution function, a step with a jump of height p(x) at every value; the open circles are the left limits, the filled ones the values F(x) themselves. F(x) is the total height of the green bars. Move x between two integers and nothing changes; cross an integer and F jumps by that bar."
```

```python
# The pmf and distribution function of a discrete random variable, built from the
# sample space: enumerate the outcomes, apply X, and collect the probabilities.
import itertools
from fractions import Fraction
from collections import Counter

S = [''.join(s) for s in itertools.product('HT', repeat=3)]   # 8 equally likely outcomes
X = lambda s: s.count('H')                                      # number of heads

pmf = Counter()
for s in S:
    pmf[X(s)] += Fraction(1, len(S))
print({x: str(p) for x, p in sorted(pmf.items())})             # {0: '1/8', 1: '3/8', 2: '3/8', 3: '1/8'}

def F(x):
    return sum(p for v, p in pmf.items() if v <= x)

for x in [-1, 0, 1.5, 2, 4]:
    print(f'F({x}) = {F(x)}')
print('P(0 < X <= 2) =', F(2) - F(0))                          # 3/4
```

:::caution
For a discrete variable, "$<$" and "$\le$" are different events: $P(X < b) = F(b) - p(b)$, and
$P(a \le X \le b) = F(b) - F(a) + p(a)$. Before subtracting two values of $F$, check which
endpoints the question includes.
:::

:::insight
The pmf and the distribution function carry the same information: $F$ is the running total of
$p$, and $p$ is the jump sizes of $F$. The pmf is easier to read; $F$ is the one that will survive
the passage to continuous random variables in the next unit.
:::

## Further reading

- [Random variable](https://en.wikipedia.org/wiki/Random_variable), [Probability mass function](https://en.wikipedia.org/wiki/Probability_mass_function) and [Cumulative distribution function](https://en.wikipedia.org/wiki/Cumulative_distribution_function) — Wikipedia.
- [Seeing Theory — Probability Distributions](https://seeing-theory.brown.edu/probability-distributions/index.html) — interactive pmfs and distribution functions (Brown University).
- [OpenStax Introductory Statistics — 4.1 Probability Distribution Function for a Discrete Random Variable](https://openstax.org/books/introductory-statistics/pages/4-1-probability-distribution-function-pdf-for-a-discrete-random-variable) — more worked tables.
