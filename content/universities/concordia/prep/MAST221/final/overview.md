---
title: The big picture
---

## One idea, four layers

The whole course rests on one idea: **probability is an amount of mass, spread over the possible outcomes,
with total mass 1.** It builds on that in four layers.

- **Events** (weeks 1–2): sample spaces, the rules, conditioning, independence, total probability, Bayes.
- **Random variables** (weeks 3–6): mass on numbers, as lumps (a pmf) or a smear (a density), on a line or on
  a plane; then the mean, the variance and Chebyshev's bound.
- **Tools** (weeks 7–8): the moment-generating function, covariance and correlation, linear combinations,
  conditional expectation.
- **Named distributions** (weeks 9–12): the patterns of mass that keep coming back, each with its situation,
  its parameters and its formulas, and how they turn into one another.

The first two layers are compressed here, because the [weeks 1–6 guide](/prep/MAST221/midterm) covers them in
full. The last two layers are the new material and most of this guide.

:::insight[The pictures to keep in mind]
- **Conditioning is zooming in.** Given $B$, or $Y=y$, the world shrinks, and everything is measured inside it.
- **The mean is the balance point** of the mass; the variance is how far the mass sits from it.
- **The mgf is a storage device.** All the moments sit in one function, and adding independent variables
  becomes multiplying functions.
- **Covariance is the cross term.** It is what appears when you square a sum, and independence removes it.
- **A conditional mean is a prediction.** Averaging the predictions gives back the plain mean.
- **Most named distributions are one experiment seen from different sides.** Independent trials give the
  discrete family, and letting the trials become very many and very rare gives the Poisson and the continuous
  waiting times.
:::

The **Map** tab has four maps. The first two are the events map and the random-variables map. The third,
*moments and sums*, is weeks 7–8. The fourth, *the named distributions*, is the family tree of weeks 9–12.

## Weeks 1–6 on one page

Weeks 1–2 · [Sample spaces and events](/unit/MAST221/sample-spaces-events), [Probability of an event and its rules](/unit/MAST221/probability-rules), [Conditional probability, independence and Bayes' theorem](/unit/MAST221/conditional-probability-bayes)

Events are subsets of $S$. Equally likely outcomes turn probability into counting. The rules are the
complement, the addition rule $P(A\cup B)=P(A)+P(B)-P(A\cap B)$, the conditional
$P(A\mid B)=\frac{P(A\cap B)}{P(B)}$, and the multiplication rule read from it. Independence means
$P(A\cap B)=P(A)P(B)$. For a partition $B_1,\dots,B_k$, total probability adds the branches of a tree, and Bayes
is one branch over that total.

Weeks 3–6 · [Random variables and discrete distributions](/unit/MAST221/random-variables-discrete), [Continuous random variables and densities](/unit/MAST221/continuous-random-variables), [Multivariate, marginal and conditional distributions](/unit/MAST221/multivariate-distributions), [Expected value, moments and Chebyshev's theorem](/unit/MAST221/expectation-moments)

| | Discrete: pmf $p(x)$ | Continuous: density $f(x)$ |
|---|---|---|
| valid if | $p(x)\ge0$, $\sum p(x)=1$ | $f(x)\ge0$, $\int f=1$ |
| distribution function | $\sum_{t\le x}p(t)$, a staircase | $\int_{-\infty}^xf$, continuous; $f=F'$ |
| marginal | $p_X(x)=\sum_yp(x,y)$ | $f_X(x)=\int f(x,y)\,dy$ |
| conditional | $p(x\mid y)=\frac{p(x,y)}{p_Y(y)}$ | $f(x\mid y)=\frac{f(x,y)}{f_Y(y)}$ |
| expected value | $E[g(X)]=\sum g(x)p(x)$ | $E[g(X)]=\int g(x)f(x)\,dx$ |

The variance is $\sigma^2=E[X^2]-\mu^2$, with $\operatorname{Var}(aX+b)=a^2\sigma^2$. Chebyshev's theorem gives
$P(|X-\mu|<k\sigma)\ge1-\frac1{k^2}$ for any distribution.

## Moment-generating functions

Week 7 · [Moment-generating functions](/unit/MAST221/moment-generating-functions)

$$M_X(t)=E[e^{tX}]=\sum_xe^{tx}p(x)\quad\text{or}\quad\int e^{tx}f(x)\,dx,$$

when this is finite on an open interval around 0. It is one more $E[g(X)]$, with $g(x)=e^{tx}$. Three facts carry
all its uses:

- **It stores the moments.** $M_X(t)=1+\mu_1't+\mu_2'\frac{t^2}{2!}+\dots$, so $\mu_r'=M_X^{(r)}(0)$. In
  particular $\mu=M'(0)$ and $\sigma^2=M''(0)-M'(0)^2$.
- **It handles linear changes and sums.** $M_{a+bX}(t)=e^{at}M_X(bt)$, and for independent $X$ and $Y$,
  $M_{X+Y}(t)=M_X(t)M_Y(t)$.
- **It identifies the distribution.** Two mgfs that agree on an open interval around 0 come from the same
  distribution. So to find the distribution of a sum: multiply the mgfs, then recognise the product.

## Product moments, covariance and correlation

Week 8 · [Product moments, linear combinations and conditional expectation](/unit/MAST221/covariance-conditional-expectation)

With two variables, $E[g(X,Y)]=\sum\sum g(x,y)p(x,y)$ or $\iint g(x,y)f(x,y)\,dx\,dy$. The product moments are
$E[X^rY^s]$. The covariance asks whether the two variables move together:

$$\sigma_{XY}=E[(X-\mu_X)(Y-\mu_Y)]=E[XY]-\mu_X\mu_Y,\qquad\rho=\frac{\sigma_{XY}}{\sigma_X\sigma_Y},\qquad-1\le\rho\le1.$$

Independence gives $\sigma_{XY}=0$. The converse fails, because covariance only sees a linear tendency.

## Linear combinations

Week 8 · [Product moments, linear combinations and conditional expectation](/unit/MAST221/covariance-conditional-expectation)

For $Y=\sum_ia_iX_i$,

$$E[Y]=\sum_ia_i\mu_i,\qquad\operatorname{Var}(Y)=\sum_ia_i^2\sigma_i^2+2\sum_{i<j}a_ia_j\sigma_{ij}.$$

The mean needs nothing, not even independence. The variance needs the covariances, and independence removes
them. For $n$ independent measurements with mean $\mu$ and variance $\sigma^2$, the average has
$E[\bar X]=\mu$ and $\operatorname{Var}(\bar X)=\sigma^2/n$, which is why taking more measurements works.

Writing a count as a sum of 0–1 indicators turns these two formulas into a way of finding means and variances
without any pmf. That is how the binomial and hypergeometric moments come out.

## Conditional expectation

Week 8 · [Product moments, linear combinations and conditional expectation](/unit/MAST221/covariance-conditional-expectation)

$E[X\mid y]$ is the mean of the conditional distribution: the same sum or integral, weighted by $p(x\mid y)$
or $f(x\mid y)$. It is a function of $y$, the best prediction of $X$ once $y$ is known. The conditional variance
is $\sigma^2_{X\mid y}=E[X^2\mid y]-(E[X\mid y])^2$. Averaging the predictions gives the **law of total
expectation**,

$$E[X]=\sum_yE[X\mid y]\,p_Y(y)\quad\text{or}\quad\int E[X\mid y]\,f_Y(y)\,dy,$$

which is total probability applied to every value of $X$ at once. In a two-stage model it gives the mean
without ever writing the joint distribution.

## The special discrete distributions

Weeks 9–10 · [Special discrete distributions](/unit/MAST221/discrete-distributions)

The skill is recognising the situation, then reading off the formula. $\theta$ is the probability of success on
one trial.

| The situation | The distribution |
|---|---|
| $k$ equally likely values | discrete uniform |
| one trial, success or failure | Bernoulli($\theta$) |
| successes in a fixed number $n$ of independent trials | binomial($n,\theta$) |
| the trial on which the first success comes | geometric($\theta$) |
| the trial on which the $k$-th success comes | negative binomial($k,\theta$) |
| successes in $n$ draws **without replacement** from $N$ items, $M$ of them successes | hypergeometric($n,N,M$) |
| rare events counted over a stretch of time or space, at mean $\lambda$ | Poisson($\lambda$) |
| counts in $k$ classes over $n$ independent trials | multinomial($n,\theta_1,\dots,\theta_k$) |

The family holds together: a binomial is a sum of independent Bernoullis, a negative binomial is a sum of
independent geometrics, a Poisson is the limit of a binomial with $n$ large and $\theta$ small, a hypergeometric
is close to a binomial when the sample is a small part of the lot, and a multinomial with two classes is a
binomial. The geometric is memoryless: $P(X>m+n\mid X>m)=P(X>n)$.

## The special continuous distributions

Weeks 11–12 · [Special continuous distributions](/unit/MAST221/continuous-distributions)

| The situation | The distribution |
|---|---|
| any value in an interval, equally spread | uniform($\alpha,\beta$) |
| the gap between random events; a lifetime with no ageing | exponential($\theta$), mean $\theta$ |
| the wait for the $k$-th event; a positive skewed quantity | gamma($\alpha,\beta$), $\alpha$ shape, $\beta$ scale |
| a sum of squares of $\nu$ independent standard normals | chi-square($\nu$) |
| a proportion on $(0,1)$ | beta($\alpha,\beta$) |
| sums and averages of many small independent effects | normal($\mu,\sigma$) |

The gamma family holds three of them: the exponential is $\alpha=1$, $\beta=\theta$, and the chi-square is
$\alpha=\nu/2$, $\beta=2$. The Poisson and the exponential describe one process: if events occur at an average
rate $\lambda$, the count in a unit interval is Poisson($\lambda$), the gap between events is exponential with
mean $1/\lambda$, and the wait for the $k$-th event is gamma with $\alpha=k$, $\beta=1/\lambda$.

Two integrals do most of the work, because a density must integrate to 1:

$$\int_0^\infty x^{\alpha-1}e^{-x/\beta}\,dx=\beta^\alpha\,\Gamma(\alpha),\qquad\int_0^1x^{\alpha-1}(1-x)^{\beta-1}\,dx=\frac{\Gamma(\alpha)\Gamma(\beta)}{\Gamma(\alpha+\beta)}.$$

## The normal distribution and its approximations

Weeks 11–12 · [Special continuous distributions](/unit/MAST221/continuous-distributions)

**Standardise first**: if $X$ is normal with mean $\mu$ and standard deviation $\sigma$, then
$Z=\frac{X-\mu}{\sigma}$ is standard normal, so one table of $\Phi$ serves every normal, with
$\Phi(-z)=1-\Phi(z)$. Independent normals stay normal under sums: the means add and the **variances** add.

The binomial and the Poisson approach the normal: for a binomial with $n\theta$ and $n(1-\theta)$ both above 5,
or a Poisson with large $\lambda$, use the normal with the same mean and variance. A count takes integer values,
so each value $k$ is matched with the area from $k-\frac12$ to $k+\frac12$: the **continuity correction**.

## How it fits together

:::insight[Five ideas hold the course]
- **One rule set, at every scale.** The rules of weeks 1–2 apply unchanged to $\{X\le3\}$, $\{X+Y<1\}$ and
  $\{\bar X>53\}$.
- **Sum ↔ integral** is the only difference between the discrete and continuous columns. The same is true of
  every tool of weeks 7–8.
- **Conditioning everywhere**: $P(A\mid B)$, $f(x\mid y)$ and $E[X\mid y]$ are all "inside the smaller world", and
  averaging over the cases gives back the whole: total probability, total expectation.
- **Independence everywhere** means factoring: the joint factors, $E[XY]$ factors, the mgf of a sum factors, and
  the covariances disappear.
- **Three ways to reach a distribution**: a special case (set a parameter), a sum of independent pieces
  (multiply the mgfs), a limit (large $n$, small $\theta$, large $\lambda$).
:::

What you can solve now:

- everything of weeks 1–6: events, trees, densities, joint distributions, means, Chebyshev;
- mgfs: find one, read the moments from it, name the distribution from it;
- the distribution of a linear change or an independent sum, by the mgf;
- covariance, correlation, and the mean and variance of any linear combination;
- conditional means and variances, and the mean of a two-stage model;
- recognising a situation as a named distribution, and computing with it;
- gamma and beta integrals on sight, memoryless waits, the Poisson–gamma link;
- normal probabilities and percentiles, and the normal approximations with their corrections.
