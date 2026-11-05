---
title: The normal distribution
order: 13
asks: standardise and read Φ, percentiles, finding μ and σ, sums, differences and averages of normals
units: [continuous-distributions]
---

## Logic

Every normal is a shifted and stretched standard normal, so one table of $\Phi$ serves them all. Forwards: from a value
to $z$ to a probability. Backwards: from a probability to $z$ to a value. Independent normals stay normal under
linear combinations, so a question about a difference or an average is one standardisation away.

## Pattern

:::steps[Standardise, then use Φ]
1. Forwards: $z=\frac{x-\mu}\sigma$, then $P(X\le x)=\Phi(z)$, $P(X>x)=1-\Phi(z)$ and $P(a<X\le b)=\Phi(z_b)-\Phi(z_a)$.
2. Negative $z$: $\Phi(-z)=1-\Phi(z)$. Symmetric intervals: $P(|Z|<z)=2\Phi(z)-1$.
3. Backwards: find $z$ with $\Phi(z)$ equal to the given area, then $x=\mu+z\sigma$.
4. Unknown $\mu$ or $\sigma$: each given probability gives one equation $x=\mu+z\sigma$.
5. Combinations of independent normals: the result is normal, with mean $\sum a_i\mu_i$ and variance $\sum a_i^2\sigma_i^2$.
   So $\bar X$ of $n$ has standard deviation $\frac\sigma{\sqrt n}$.
6. Compare two variables: $P(X>Y)=P(X-Y>0)$, one normal variable.
:::

## Traps

:::caution[Traps]
- Divide by $\sigma$, not $\sigma^2$. When a problem gives a variance, take the root first.
- Variances add; standard deviations do not. $X-Y$ has variance $\sigma_X^2+\sigma_Y^2$ when they are independent.
- $\bar X$ has $\frac\sigma{\sqrt n}$, but a total of $n$ has $\sigma\sqrt n$.
- A sum of $n$ copies is not $nX$: the variance is $n\sigma^2$, not $n^2\sigma^2$.
- Draw the curve and shade the area, to catch a wrong tail.
:::

## Worked problems

The values needed are given in each problem.

::::exercise[Both directions]
$X$ is normal with $\mu=70$ and $\sigma=8$. Find $P(62<X<86)$, and the value that only the top 10 % exceed. Use
$\Phi(1)=0.8413$, $\Phi(2)=0.9772$, $\Phi(1.28)=0.8997$.

:::solution
$z=\frac{62-70}8=-1$ and $z=\frac{86-70}8=2$, so $P=\Phi(2)-\Phi(-1)=0.9772-(1-0.8413)=0.8185$.

The top 10 % starts where $\Phi(z)\approx0.90$, so $z\approx1.28$ and $x=70+1.28(8)\approx80.2$.
:::
::::

:::note[Pattern at work]
Steps 1–3. The first part goes from values to an area, and the second from an area to a value.
:::

::::exercise[Find the parameters]
For a normal $X$, 15.87 % of the values fall below 40 and 2.28 % lie above 70. Find $\mu$ and $\sigma$. Use
$\Phi(1)=0.8413$, $\Phi(2)=0.9772$.

:::solution
$\Phi(z)=0.1587$ gives $z=-1$, and $\Phi(z)=0.9772$ gives $z=2$. So $40=\mu-\sigma$ and $70=\mu+2\sigma$. Subtracting,
$3\sigma=30$: $\sigma=10$ and $\mu=50$.
:::
::::

:::note[Pattern at work]
Step 4: two areas give two values of $z$, and so two linear equations.
:::

::::exercise[Sums, differences and averages]
(a) $X$ is normal with $\mu=100$, $\sigma=6$, and $Y$ is normal with $\mu=90$, $\sigma=8$, independently. Find
$P(X>Y)$. (b) Measurements are normal with $\mu=50$, $\sigma=12$. Find $P(X>53.6)$ for one measurement and
$P(\bar X>53.6)$ for the average of 16. (c) The filling machine of type 8 is normal with $\sigma=8$ ml: how many
bottles make $P(|\bar X-500|\ge2)\le0.05$? Use $\Phi(0.3)=0.6179$, $\Phi(1)=0.8413$, $\Phi(1.2)=0.8849$,
$\Phi(1.96)=0.975$.

:::solution
(a) $D=X-Y$ is normal with mean 10 and variance $36+64=100$, so $\sigma_D=10$. $P(D>0)=1-\Phi(-1)=\Phi(1)=0.8413$.

(b) One measurement: $z=\frac{3.6}{12}=0.3$, so $P=1-0.6179=0.3821$. The average has $\sigma_{\bar X}=\frac{12}4=3$, so
$z=1.2$ and $P=1-0.8849=0.1151$.

(c) $\bar X$ has $\sigma_{\bar X}=\frac8{\sqrt n}$, and we need $\frac2{8/\sqrt n}\ge1.96$, so $\sqrt n\ge7.84$ and
$n\ge61.47$: 62 bottles.
:::
::::

:::note[Pattern at work]
Steps 5 and 6. In (a) the standard deviations 6 and 8 give 10, not 14. In (b) the same value is far less surprising
for one measurement than for an average. In (c) knowing the shape cuts the 320 bottles of Chebyshev's theorem to 62.
:::

::::exercise[Back to the chi-square]
$Z$ is standard normal. Find $P(Z^2<3.84)$, and the mean and variance of $Z_1^2+Z_2^2+Z_3^2$ for independent standard
normals. Use $\Phi(1.96)=0.975$.

:::solution
$Z^2<3.84$ means $|Z|<1.96$, so $P=2(0.975)-1=0.95$.

$Z^2$ is chi-square with $\nu=1$, so the sum of three is chi-square with $\nu=3$, with $\mu=3$ and $\sigma^2=6$.
:::
::::

:::note[Pattern at work]
An event about $Z^2$ is an event about $|Z|$, and the mgf rule of type 6 adds the degrees of freedom.
:::
