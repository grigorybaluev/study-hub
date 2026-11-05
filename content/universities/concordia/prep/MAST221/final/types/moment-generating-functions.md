---
title: Moment-generating functions
order: 5
asks: find M(t) and where it exists; moments by derivatives or from the series; name a distribution from its mgf
units: [moment-generating-functions]
---

## Logic

$M_X(t)=E[e^{tX}]$ is one more expected value, with $g(x)=e^{tx}$. Its Maclaurin coefficients are the moments, so
every moment comes from one function, by differentiating at 0 or by reading a series. And because an mgf that
exists near 0 identifies its distribution, a formula you recognise tells you the distribution at once.

## Pattern

:::steps[Build it, then use it]
1. Write the sum or integral with $e^{tx}$ inside, over the support.
2. Close it: a geometric or exponential series, the binomial theorem, a gamma-type integral, or completing the
   square. Keep the range of $t$ that makes it converge.
3. Check: $M(0)=1$.
4. Moments by derivatives: $\mu_r'=M^{(r)}(0)$, so $\mu=M'(0)$ and $\sigma^2=M''(0)-M'(0)^2$.
5. Moments from a series: expand $M(t)$ around 0; the coefficient of $t^r$ is $\mu_r'/r!$, so multiply by $r!$.
6. Backwards: a finite sum $\sum_xp(x)e^{tx}$ is the pmf itself, read off term by term. Any other form: match it
   with the mgf column of the [table](/prep/MAST221/final/table).
:::

## Traps

:::caution[Traps]
- The coefficient of $t^r$ is $\mu_r'/r!$, not $\mu_r'$.
- $M''(0)$ is $E[X^2]$, not the variance.
- An mgf comes with a range: $\frac1{1-t}$ is only valid for $t<1$.
- A density on the whole line with $|x|$ in it splits at 0, and each half has its own convergence condition.
- Not every distribution has an mgf: $f(x)=1/x^2$ on $x>1$ has none.
:::

## Worked problems

::::exercise[An mgf from a series]
$p(x)=\frac1{2^{x+1}}$ for $x=0,1,2,\dots$ Find $M_X(t)$ and where it exists, then $\mu$ and $\sigma^2$.

:::solution
$M_X(t)=\sum_{x=0}^\infty e^{tx}\frac1{2^{x+1}}=\frac12\sum_{x=0}^\infty\left(\frac{e^t}2\right)^x=\frac12\cdot\frac1{1-e^t/2}=\frac1{2-e^t}$,
a geometric series that converges for $e^t<2$, that is $t<\ln2$. Check: $M(0)=1$.

$M'(t)=\frac{e^t}{(2-e^t)^2}$ and $M''(t)=\frac{e^t}{(2-e^t)^2}+\frac{2e^{2t}}{(2-e^t)^3}$, so
$\mu=M'(0)=1$, $E[X^2]=M''(0)=1+2=3$ and $\sigma^2=3-1=2$.
:::
::::

:::note[Pattern at work]
Steps 1–4. The sum closes as a geometric series, and the condition on $t$ is the condition for that series.
:::

::::exercise[A density on the whole line]
$f(x)=\frac12e^{-|x|}$ for all real $x$. Find $M_X(t)$, then $E[X^2]$, $E[X^3]$ and $E[X^4]$ from its series.

:::solution
Split at 0:
$M_X(t)=\frac12\int_{-\infty}^0e^{(1+t)x}\,dx+\frac12\int_0^\infty e^{-(1-t)x}\,dx=\frac12\left(\frac1{1+t}+\frac1{1-t}\right)=\frac1{1-t^2}$
for $-1<t<1$.

The series is $1+t^2+t^4+\dots$, so the coefficient of $t^2$ is 1, of $t^3$ is 0, and of $t^4$ is 1. Multiplying by
$r!$: $E[X^2]=2$, $E[X^3]=0$, $E[X^4]=24$. So $\mu=0$ (the density is symmetric) and $\sigma^2=2$.
:::
::::

:::note[Pattern at work]
Steps 2 and 5. Each half needs its own condition, $t>-1$ and $t<1$. Reading a series is far quicker here than
four derivatives.
:::

::::exercise[From M back to the distribution]
Name the distribution, with its parameters, and give the mean and the variance:
(a) $M(t)=0.2+0.5e^t+0.3e^{3t}$; (b) $M(t)=\left(\frac14+\frac34e^t\right)^8$; (c) $M(t)=e^{2t+3t^2}$;
(d) $M(t)=(1-2t)^{-3}$, for which also find $E[X^3]$.

:::solution
(a) A finite sum: $P(X=0)=0.2$, $P(X=1)=0.5$, $P(X=3)=0.3$. $\mu=0.5+0.9=1.4$, $E[X^2]=0.5+2.7=3.2$ and
$\sigma^2=3.2-1.96=1.24$.

(b) Binomial with $n=8$, $\theta=\frac34$: $\mu=6$, $\sigma^2=8\cdot\frac34\cdot\frac14=\frac32$.

(c) Normal: matching $\mu t+\frac12\sigma^2t^2$ gives $\mu=2$, $\sigma^2=6$. The $t^2$ coefficient is half the
variance.

(d) Gamma with $\alpha=3$, $\beta=2$, which is the chi-square with $\nu=6$: $\mu=6$, $\sigma^2=12$. The series is
$1+6t+24t^2+80t^3+\dots$, so $E[X^3]=3!\cdot80=480$. Check with the gamma moments:
$\frac{2^3\,\Gamma(6)}{\Gamma(3)}=\frac{8\cdot120}2=480$.
:::
::::

:::note[Pattern at work]
Step 6. Uniqueness is what makes this a proof and not a guess. In (c) the factor $\frac12$ is the trap, and in (d)
the factor $3!$ is.
:::
