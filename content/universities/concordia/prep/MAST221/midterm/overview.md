---
title: The big picture
---

## One idea, two layers

The first six weeks build probability in two layers, and both rest on one idea: **probability is an
amount of mass, spread over the possible outcomes, with total mass 1.** Every rule is bookkeeping for
that mass.

- **Events** (weeks 1–2): the sample space, events as subsets, the rules, conditioning (zoom into a
  smaller world), independence, splitting into cases (total probability) and turning the cases around
  (Bayes).
- **Random variables** (weeks 3–6): a number attached to each outcome. Its distribution says where the
  mass sits: lumps (a pmf) or a smear (a density), on a line or, for two variables, on a plane. Then the
  summaries: the mean (balance point), the variance (spread), and Chebyshev's bound.

:::insight[The pictures to keep in mind]
- **Probability is area** in a Venn diagram where $S$ has area 1. Adding two areas counts the overlap
  twice, so subtract it once.
- **Conditioning is zooming in.** Given $B$, the world shrinks to $B$, and everything is measured as a
  fraction of $B$.
- **Bayes reverses a tree.** The tree runs cause → result; Bayes asks "result seen, which cause?" It is
  one branch's share of the total.
- **The mean is the balance point** of the mass; the variance is how far the mass sits from it.
:::

The **Map** tab draws both layers as forms of the mass with an operation on each arrow: multiply, add
or integrate, divide, differentiate. The same triangle (joint → marginal → conditional → back) appears on
both maps.

## Sample spaces, events and counting

Week 1 · [Sample spaces and events](/unit/MAST221/sample-spaces-events)

The **sample space** $S$ is the set of all possible outcomes; an **event** is a subset of $S$. Events
combine like sets: $A\cup B$ ("$A$ or $B$", inclusive), $A\cap B$ ("both"), $A'$ ("not $A$"). They are
**mutually exclusive** if $A\cap B=\varnothing$. Listing $S$ carefully, with labelled objects
($M_1, M_2, W_1$), is half of every early problem.

With equally likely outcomes, $P(A)=\frac{n(A)}{n(S)}$, so probability becomes counting:

| Tool | Use it for |
|---|---|
| multiplication principle | $k$ steps with $n_1, n_2,\dots$ choices give $n_1n_2\cdots$ outcomes (two dice: 36) |
| $_nP_r=\frac{n!}{(n-r)!}$ | ordered selections without repetition |
| $\binom{n}{r}=\frac{n!}{r!(n-r)!}$ | unordered selections: $P(\text{2 hearts in 5 cards})=\binom{13}{2}\binom{39}{3}/\binom{52}{5}$ |
| a chain of fractions | sequential draws without replacement: $\frac{10}{49}\cdot\frac{9}{48}$ |

## The rules of probability

Weeks 1–2 · [Probability of an event and its rules](/unit/MAST221/probability-rules)

Three axioms: $P(A)\ge0$, $P(S)=1$, and $P$ adds over mutually exclusive events. Everything else
follows:

- $P(A')=1-P(A)$, so "at least one" $=1-P(\text{none})$;
- $P(\varnothing)=0$, and $A\subseteq B$ gives $P(A)\le P(B)$;
- the **addition rule** $P(A\cup B)=P(A)+P(B)-P(A\cap B)$; for three events, $+$ singles $-$ pairs
  $+$ the triple (inclusion–exclusion).

:::steps[Work region by region]
1. Two events cut $S$ into four regions: $A\cap B$, $A\cap B'$, $A'\cap B$, $A'\cap B'$.
2. Fill the overlap first, then subtract outwards: only $A$ $=P(A)-P(A\cap B)$.
3. Read the question as a sum of regions: exactly one $=P(A\cup B)-P(A\cap B)$; neither
   $=1-P(A\cup B)$; at least one does not happen $=1-P(A\cap B)$.
:::

## Conditional probability and independence

Week 2 · [Conditional probability, independence and Bayes' theorem](/unit/MAST221/conditional-probability-bayes)

$$P(A\mid B)=\frac{P(A\cap B)}{P(B)},\qquad P(B)>0.$$

Given $B$, only the part of $A$ inside $B$ survives, measured as a fraction of $B$. $P(\cdot\mid B)$ is a
probability in its own right, so $P(A'\mid B)=1-P(A\mid B)$; but $P(A\mid B)+P(A\mid B')$ need not be 1.
Read backwards it is the **multiplication rule**, a chain:
$P(A\cap B\cap C)=P(A)\,P(B\mid A)\,P(C\mid A\cap B)$. This is how draws without replacement are computed.

**Independence**: $P(A\cap B)=P(A)P(B)$, equivalently $P(A\mid B)=P(A)$: learning $B$ tells you nothing
about $A$. Then $A, B'$ and $A', B$ and $A', B'$ are independent too. For three or more events every
sub-collection must multiply: pairwise is not enough.

:::caution[Independent is not mutually exclusive]
Disjoint events with positive probabilities are never independent: if $A$ happens, $B$ certainly did not.
Independent trials multiply: $P(\text{hit, miss, miss})=p(1-p)^2$, and in any order $\binom31p(1-p)^2$.
:::

## Total probability and Bayes

Week 2 · [Conditional probability, independence and Bayes' theorem](/unit/MAST221/conditional-probability-bayes)

If $B_1,\dots,B_k$ partition $S$ (exactly one happens: the cases, causes, machines, urns), then

$$P(A)=\sum_iP(B_i)P(A\mid B_i)\quad\text{(forwards)},\qquad P(B_r\mid A)=\frac{P(B_r)P(A\mid B_r)}{\sum_iP(B_i)P(A\mid B_i)}\quad\text{(backwards)}.$$

Draw the tree: the first level is the case, the second the observation. Multiply along the branches, add
the branches that end in $A$; Bayes is one product divided by that sum.

:::note[Base rates matter]
A test that catches 95 % of cases, with 4 % false positives, for a condition that 1 % of people have,
gives only about a 19 % chance of the condition after a positive result: most positives come from the
large healthy group. The events map walks this example arrow by arrow.
:::

## Random variables and their distributions

Weeks 3–4 · [Random variables and discrete distributions](/unit/MAST221/random-variables-discrete),
[Continuous random variables and densities](/unit/MAST221/continuous-random-variables)

A random variable $X$ attaches a number to every outcome. Its values split $S$ into events $\{X=x\}$, so
everything from weeks 1–2 still applies.

**Discrete**: lumps of mass $p(x)=P(X=x)$ at separate points; to find a constant, make the lumps add to 1.
$F(x)=P(X\le x)$ is a staircase that jumps by $p(x)$ at each value, and $<$ versus $\le$ matters.

**Continuous**: mass smeared along the line with density $f(x)$. Probability is area,
$P(a<X\le b)=\int_a^bf$. A single point has zero area, so $<$ and $\le$ do not matter, and $f(x)$ itself
is not a probability (it can exceed 1). $F(x)=\int_{-\infty}^xf$ rises continuously from 0 to 1, and
$f=F'$. Piecewise densities integrate piece by piece, and $F$ is defined for **every** real $x$.

| | Discrete: pmf $p(x)$ | Continuous: density $f(x)$ |
|---|---|---|
| valid if | $p(x)\ge0$, $\sum p(x)=1$ | $f(x)\ge0$, $\int_{-\infty}^{\infty}f=1$ |
| probability | $\sum_{x\in A}p(x)$; a point can carry mass | $\int_a^bf$; every point has mass 0 |
| distribution function | $\sum_{t\le x}p(t)$, a staircase | $\int_{-\infty}^xf$, continuous; $f=F'$ |
| mean | $\sum x\,p(x)$ | $\int x\,f(x)\,dx$ |

## Two random variables: joint, marginal, conditional

Week 4 · [Multivariate, marginal and conditional distributions](/unit/MAST221/multivariate-distributions)

Now the mass sits on a plane: a table $p(x,y)$ or a surface $f(x,y)$ over a region.
$P((X,Y)\in A)$ is the sum over the cells in $A$, or the double integral over $A$. **Draw the region
before writing limits.**

- **Marginal** = squash the mass onto one axis: sum a row or a column, or integrate out the other
  variable over its range at that point, $f_X(x)=\int f(x,y)\,dy$.
- **Independent** if the joint is the product of the marginals at every point. A support that is not a
  rectangle ($0<y<x<1$) means they cannot be independent.
- **Conditional** = one slice, rescaled to total 1: $f(x\mid y)=\frac{f(x,y)}{f_Y(y)}$, the same as
  $P(A\mid B)$ with variables.

## Expectation, variance and Chebyshev

Weeks 5–6 · [Expected value, moments and Chebyshev's theorem](/unit/MAST221/expectation-moments)

The mean $\mu=E[X]$ is the balance point: $\sum x\,p(x)$ or $\int x f(x)\,dx$. For a function of $X$ do
not find the distribution of $g(X)$: weight $g$ by the same mass, $E[g(X)]=\sum g(x)p(x)$ or
$\int g(x)f(x)\,dx$. Linearity: $E[aX+b]=aE[X]+b$. A symmetric density has its mean at the centre of
symmetry. Moments: $\mu_r'=E[X^r]$ about the origin, $\mu_r=E[(X-\mu)^r]$ about the mean.

The variance $\sigma^2=E[(X-\mu)^2]$ is the average squared distance from the balance point. Compute it
as $\sigma^2=E[X^2]-\mu^2$, which must come out $\ge0$. $\operatorname{Var}(aX+b)=a^2\sigma^2$: shifting
does not change the spread, and scaling squares.

**Chebyshev**: for any distribution, $P(|X-\mu|\ge k\sigma)\le\frac1{k^2}$, i.e.
$P(|X-\mu|<k\sigma)\ge1-\frac1{k^2}$. At least 75 % of the mass lies within $2\sigma$ and at least 89 %
within $3\sigma$. It is guaranteed, and usually far from the exact value.

## How it fits together

:::insight[Four ideas hold the course so far]
- **One rule set, two scales.** The rules of weeks 1–2 (complement, addition, conditioning,
  independence) apply unchanged to events like $\{X\le3\}$ or $\{X+Y<1\}$.
- **Sum ↔ integral** is the only difference between the discrete and continuous columns. Learn a formula
  once and translate it.
- **Conditioning everywhere**: $P(A\mid B)$, $P(X>a\mid X>b)$, $f(x\mid y)$ are all "the joint over the
  given", which shrinks the world to what is known.
- **Independence everywhere** means "the joint factors": $P(A)P(B)$ for events, $p_Xp_Y$ or $f_Xf_Y$ for
  variables.
:::

What you can solve now:

- list sample spaces and events; count with permutations and combinations;
- "or", "and", "neither", "exactly one", "at least one" from given probabilities;
- conditional probabilities, chains without replacement, independent trials;
- total probability and Bayes from a tree;
- constants, probabilities and distribution functions for pmfs and densities;
- joint probabilities over regions, marginals, independence checks, conditionals;
- means, variances, $E[g(X)]$, and Chebyshev bounds.

Not on this midterm: moment-generating functions (week 7), product moments and covariance, and the
named distributions (binomial, Poisson, normal, …), which come later.
