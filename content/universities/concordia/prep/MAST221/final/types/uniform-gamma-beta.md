---
title: Uniform, exponential, gamma, chi-square and beta
order: 12
asks: recognise a density and its constant, gamma and beta integrals, memoryless waits, the Poisson link
units: [continuous-distributions]
---

## Logic

Each density is a shape with a constant in front, and the constant is exactly what makes the area 1. So a shape you
recognise gives its constant, its moments and any integral of that form with no integration. The exponential, the
gamma and the chi-square are one family, and the gamma family is the continuous side of the Poisson process.

## Pattern

:::steps[Recognise the shape]
1. $x^{\alpha-1}e^{-x/\beta}$ on $(0,\infty)$ is a gamma: the constant is $\frac1{\beta^\alpha\Gamma(\alpha)}$,
   $\mu=\alpha\beta$, $\sigma^2=\alpha\beta^2$.
2. $x^{\alpha-1}(1-x)^{\beta-1}$ on $(0,1)$ is a beta: the constant is $\frac{\Gamma(\alpha+\beta)}{\Gamma(\alpha)\Gamma(\beta)}$,
   $\mu=\frac\alpha{\alpha+\beta}$, $\sigma^2=\frac{\alpha\beta}{(\alpha+\beta)^2(\alpha+\beta+1)}$.
3. Special cases of the gamma: exponential is $\alpha=1$, $\beta=\theta$, with $P(X>x)=e^{-x/\theta}$; chi-square is
   $\alpha=\frac\nu2$, $\beta=2$, with $\mu=\nu$, $\sigma^2=2\nu$.
4. An integral in one of these shapes equals the inverse of its constant.
5. Memoryless exponential: $P(X>a+b\mid X>a)=P(X>b)$.
6. Poisson link: with events at rate $\lambda$, the wait $T$ for the $k$-th event is gamma($k,\frac1\lambda$), and
   $T>t$ means at most $k-1$ events by time $t$. So $P(T>t)$ is a Poisson sum, with mean $\lambda t$.
7. Uniform on $(\alpha,\beta)$: a probability is a length over the whole length, with $\mu=\frac{\alpha+\beta}2$ and
   $\sigma^2=\frac{(\beta-\alpha)^2}{12}$.
:::

## Traps

:::caution[Traps]
- $\beta$ in the gamma is a scale, so $e^{-3x}$ means $\beta=\frac13$. Rate $\lambda$ and mean $\theta$ are inverses.
- $\alpha$ is one more than the power of $x$: $x^2$ means $\alpha=3$. In the beta the same holds for $1-x$.
- $\Gamma(n)=(n-1)!$, not $n!$. Half-integers go down to $\Gamma(\frac12)=\sqrt\pi$.
- Memorylessness belongs to the exponential and the geometric only.
- The same letters mean different things: $\alpha,\beta$ are the ends of the uniform and the parameters of the gamma
  and the beta.
:::

## Worked problems

::::exercise[Recognise the density]
(a) $f(x)=cx^2e^{-3x}$ for $x>0$: find $c$, $\mu$ and $\sigma^2$. (b) $f(x)=cx(1-x)^3$ on $(0,1)$: find $c$, $\mu$, $\sigma^2$
and $P(X<\frac12)$. (c) Evaluate $\int_0^\infty x^4e^{-x/2}\,dx$ and $\int_0^1x^3(1-x)^2\,dx$ without integrating by parts.

:::solution
(a) A gamma with $\alpha=3$, $\beta=\frac13$: $c=\frac1{(1/3)^3\,\Gamma(3)}=\frac{27}2$, $\mu=1$, $\sigma^2=\frac13$.

(b) A beta with $\alpha=2$, $\beta=4$: $c=\frac{\Gamma(6)}{\Gamma(2)\Gamma(4)}=\frac{120}6=20$, $\mu=\frac26=\frac13$,
$\sigma^2=\frac{2\cdot4}{6^2\cdot7}=\frac2{63}$.

For $P(X<\frac12)$, substitute $u=1-x$: $20\int_{1/2}^1(1-u)u^3\,du=20\left[\frac{u^4}4-\frac{u^5}5\right]_{1/2}^1=20\left(\frac1{20}-\frac3{320}\right)=\frac{13}{16}$.

(c) $\alpha=5$, $\beta=2$: $2^5\,\Gamma(5)=32\cdot24=768$. And $\alpha=4$, $\beta=3$:
$\frac{\Gamma(4)\Gamma(3)}{\Gamma(7)}=\frac{6\cdot2}{720}=\frac1{60}$.
:::
::::

:::note[Pattern at work]
Steps 1, 2 and 4. Read $\alpha$ and $\beta$ off the shape, then everything else is a formula. Only $P(X<\frac12)$ needed
an actual integral.
:::

::::exercise[Lifetimes]
A part's lifetime $T$ is exponential with mean 4 years. Find (a) $P(T>6)$; (b) $P(T>6\mid T>2)$; (c) the median; (d) the
probability that two independent parts both last beyond 3 years.

:::solution
(a) $e^{-6/4}=e^{-1.5}\approx0.223$.

(b) By memorylessness this is $P(T>4)=e^{-1}\approx0.368$.

(c) $e^{-m/4}=\frac12$ gives $m=4\ln2\approx2.77$ years.

(d) $(e^{-3/4})^2=e^{-3/2}\approx0.223$.
:::
::::

:::note[Pattern at work]
Steps 3 and 5. The median is below the mean of 4, since the density is skewed to the right. In (d) the earlier failure
time has $P(\min>t)=e^{-t/2}$: it is exponential again, with mean 2.
:::

::::exercise[The third call]
Calls arrive at random at a rate of 2 per minute. $T$ is the time, in minutes, of the third call. Find the mean and
variance of $T$, and $P(T>2)$ in two ways.

:::solution
$T$ is gamma with $\alpha=3$, $\beta=\frac12$: $\mu=\frac32$, $\sigma^2=\frac34$.

Through the Poisson: $T>2$ means at most 2 calls in the first 2 minutes, a count with mean 4, so
$P(T>2)=e^{-4}\left(1+4+\frac{4^2}2\right)=13e^{-4}\approx0.238$.

Through the gamma: the density is $4x^2e^{-2x}$, and integrating by parts twice,
$P(T>2)=\int_2^\infty4x^2e^{-2x}\,dx=13e^{-4}$.
:::
::::

:::note[Pattern at work]
Step 6. The same event seen two ways: "the wait is long" and "few calls arrived". The Poisson sum avoids the integral.
:::

::::exercise[A uniform from its moments]
$X$ is uniform on $(\alpha,\beta)$ with $\mu=5$ and $\sigma^2=3$. Find $\alpha$, $\beta$ and $P(X>6\mid X>4)$.

:::solution
$\frac{(\beta-\alpha)^2}{12}=3$ gives $\beta-\alpha=6$, and $\frac{\alpha+\beta}2=5$ gives $\alpha=2$, $\beta=8$.

$P(X>6\mid X>4)=\frac{2/6}{4/6}=\frac12$.
:::
::::

:::note[Pattern at work]
Step 7. Given $X>4$, $X$ is uniform on $(4,8)$. The uniform is not memoryless: $P(X>2+4\mid X>4)$ is not $P(X>2)=1$.
:::
