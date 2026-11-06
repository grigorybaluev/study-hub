---
title: Linear changes and sums by the mgf
order: 6
asks: the distribution of a + bX or of an independent sum; recognise the product of mgfs
units: [moment-generating-functions, discrete-distributions, continuous-distributions]
---

## Logic

Adding independent variables is hard for pmfs and densities and easy for mgfs: they multiply. So the route to
the distribution of a sum is to go up to the mgf, multiply, and come back down by recognising the result. The
uniqueness theorem is what allows the step down.

## Pattern

:::steps[Up, multiply, down]
1. Write the mgf of each piece, and state that the pieces are independent.
2. Linear change: $M_{a+bX}(t)=e^{at}M_X(bt)$.
3. Independent sum: $M_{X+Y}(t)=M_X(t)M_Y(t)$. For a combination, $M_{\sum a_iX_i}(t)=\prod_iM_{X_i}(a_it)$.
4. Simplify, then match the result with a known mgf. Name the distribution and its parameters, and say "by
   uniqueness".
:::

| Independent pieces | Their sum |
|---|---|
| binomial($n_i,\theta$), the same $\theta$ | binomial($\sum n_i,\theta$) |
| negative binomial($k_i,\theta$), the same $\theta$ | negative binomial($\sum k_i,\theta$) |
| Poisson($\lambda_i$) | Poisson($\sum\lambda_i$) |
| gamma($\alpha_i,\beta$), the same $\beta$ | gamma($\sum\alpha_i,\beta$) |
| $n$ exponentials with mean $\theta$ | gamma($n,\theta$) |
| chi-square($\nu_i$) | chi-square($\sum\nu_i$) |
| normal($\mu_i,\sigma_i$) | normal with mean $\sum\mu_i$ and variance $\sum\sigma_i^2$ |

## Traps

:::caution[Traps]
- Multiplying mgfs needs independence. $X+X=2X$ has $M_{2X}(t)=M_X(2t)$, not $M_X(t)^2$.
- A multiple leaves some families: $2X$ is not Poisson, since $e^{\lambda(e^{2t}-1)}$ is not a Poisson mgf.
- Binomials with different $\theta$ do not add to a binomial, nor gammas with different $\beta$ to a gamma.
- In the normal row the variances add, not the standard deviations.
:::

## Worked problems

::::exercise[Two Poisson streams]
$X_1$ and $X_2$ are independent Poisson variables with means 2 and 3, and $S=X_1+X_2$. Find (a) the distribution of
$S$; (b) $P(S=2)$; (c) $P(X_1=1\mid S=2)$.

:::solution
(a) $M_S(t)=e^{2(e^t-1)}e^{3(e^t-1)}=e^{5(e^t-1)}$, the mgf of a Poisson with mean 5. By uniqueness, $S$ is Poisson(5).

(b) $P(S=2)=\frac{5^2e^{-5}}{2!}=12.5e^{-5}\approx0.0842$.

(c) $\{X_1=1,S=2\}$ is $\{X_1=1,X_2=1\}$, so
$P(X_1=1\mid S=2)=\frac{(2e^{-2})(3e^{-3})}{12.5e^{-5}}=\frac6{12.5}=0.48$.
:::
::::

:::note[Pattern at work]
Steps 1, 3 and 4. Part (c) goes back to the events rule: the joint over the given. The answer equals
$\binom21\cdot\frac25\cdot\frac35$: given the total, each event belongs to the first stream with probability
$\frac25$, independently.
:::

::::exercise[A combination of normals]
$X$ is normal with $\mu=1$, $\sigma=2$, and $Y$ is normal with $\mu=3$, $\sigma=1$, independently. Find the
distribution of $W=2X-Y+1$.

:::solution
$M_X(s)=e^{s+2s^2}$ and $M_Y(s)=e^{3s+s^2/2}$. Then

$$M_W(t)=e^tM_X(2t)M_Y(-t)=e^t\cdot e^{2t+8t^2}\cdot e^{-3t+t^2/2}=e^{\frac{17}2t^2}.$$

This is the normal mgf with mean 0 and variance 17, so $W$ is normal with $\mu=0$ and $\sigma=\sqrt{17}$.
:::
::::

:::note[Pattern at work]
Steps 2 and 3: $-Y$ means evaluating $M_Y$ at $-t$. The mean and the variance also follow from type 8, but only the
mgf shows that $W$ is **normal**.
:::

::::exercise[Exponentials into a chi-square]
$X_1,\dots,X_4$ are independent exponentials with mean 3, and $S=X_1+X_2+X_3+X_4$. Find the distribution of $S$, its
mean and variance, and the distribution of $\frac23S$.

:::solution
$M_S(t)=(1-3t)^{-4}$: gamma with $\alpha=4$, $\beta=3$, so $\mu=12$ and $\sigma^2=36$.

$M_{2S/3}(t)=M_S\left(\frac23t\right)=(1-2t)^{-4}$: gamma with $\alpha=4$, $\beta=2$, which is the chi-square with
$\nu=8$.
:::
::::

:::note[Pattern at work]
Step 3, then step 2 with $b=\frac23$. Scaling a gamma changes only $\beta$, so the right scale turns it into a
chi-square. On the family-tree map this is exponential → gamma → chi-square.
:::
