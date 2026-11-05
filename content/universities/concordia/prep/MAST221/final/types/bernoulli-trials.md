---
title: Independent trials
order: 10
asks: discrete uniform, Bernoulli, binomial, geometric, negative binomial; which one is it, then compute
units: [discrete-distributions]
---

## Logic

One experiment, independent trials with the same $\theta$, and three questions about it. How many successes in
$n$ trials? Binomial. On which trial does the first success come? Geometric. On which trial does the $k$-th success
come? Negative binomial. What is fixed tells you which: a binomial fixes the trials and counts successes, and the
waiting distributions fix the successes and count trials.

## Pattern

:::steps[Recognise, then read off]
1. Check the set-up: independent trials, two outcomes, constant $\theta$. Define "success" for this question.
2. Fixed $n$, counting successes: $b(x;n,\theta)=\binom nx\theta^x(1-\theta)^{n-x}$, with $\mu=n\theta$ and
   $\sigma^2=n\theta(1-\theta)$.
3. Waiting for the first success: $g(x;\theta)=\theta(1-\theta)^{x-1}$ for $x=1,2,\dots$, with $\mu=\frac1\theta$ and
   $\sigma^2=\frac{1-\theta}{\theta^2}$. Also $P(X>m)=(1-\theta)^m$.
4. Waiting for the $k$-th success: $b^*(x;k,\theta)=\binom{x-1}{k-1}\theta^k(1-\theta)^{x-k}$ for $x=k,k+1,\dots$,
   with $\mu=\frac k\theta$ and $\sigma^2=\frac{k(1-\theta)}{\theta^2}$.
5. "At least" and "at most": use the complement when it has fewer terms.
6. A stage can itself be a trial: find the probability of the stage first, then use it as $\theta$.
:::

## Traps

:::caution[Traps]
- The negative binomial coefficient is $\binom{x-1}{k-1}$: the last trial is fixed as a success, so only the first
  $x-1$ are arranged.
- The "success" is whatever is being waited for, even if it is a failure in the story.
- The geometric here counts trials, so it starts at $x=1$ and $\mu=\frac1\theta$. Some books count failures instead.
- Geometric memory: $P(X>m+n\mid X>m)=P(X>n)$, so past failures do not change the wait.
- Sampling without replacement from a small lot is not binomial: see type 11.
:::

## Worked problems

::::exercise[One stream of trials]
Each request to a server succeeds with probability 0.8, independently. Find (a) the probability that exactly 8 of 10
requests succeed; (b) that at least 9 of 10 succeed; (c) the mean and variance of the number of successes in 10;
(d) that the first failure is on request 4; (e) that the second failure is on request 6; (f) the mean and variance
of the number of requests up to the third failure.

:::solution
(a) $\binom{10}8(0.8)^8(0.2)^2\approx0.3020$.

(b) $\binom{10}9(0.8)^9(0.2)+(0.8)^{10}\approx0.2684+0.1074=0.3758$.

(c) $\mu=8$, $\sigma^2=10(0.8)(0.2)=1.6$.

(d) Waiting for a failure, so $\theta=0.2$: $(0.8)^3(0.2)=0.1024$.

(e) Negative binomial with $k=2$, $\theta=0.2$: $\binom51(0.2)^2(0.8)^4\approx0.0819$.

(f) $k=3$, $\theta=0.2$: $\mu=\frac3{0.2}=15$, $\sigma^2=\frac{3(0.8)}{0.04}=60$.
:::
::::

:::note[Pattern at work]
Steps 2, 3 and 4 on the same trials. In (a)–(c) a success is a working request with $\theta=0.8$; in (d)–(f) what is
waited for is a failure, so $\theta=0.2$ (the "success" trap).
:::

::::exercise[Parameters from moments, and memory]
(a) A binomial $X$ has $\mu=6$ and $\sigma^2=4.2$. Find $n$ and $\theta$. (b) A geometric $X$ has $\theta=0.3$. Find
$P(X>5\mid X>2)$. (c) $X$ is discrete uniform on $1,\dots,10$. Find $\mu$ and $\sigma^2$.

:::solution
(a) $\frac{\sigma^2}\mu=1-\theta=0.7$, so $\theta=0.3$ and $n=\frac6{0.3}=20$.

(b) By memorylessness this is $P(X>3)=(0.7)^3=0.343$. Directly: $\frac{(0.7)^5}{(0.7)^2}$.

(c) $\mu=\frac{k+1}2=\frac{11}2$ and $\sigma^2=\frac{k^2-1}{12}=\frac{99}{12}=\frac{33}4$.
:::
::::

:::note[Pattern at work]
(a) divides the two formulas of step 2. (b) uses $P(X>m)=(1-\theta)^m$ from step 3.
:::

::::exercise[A sampling plan]
Items are defective with probability 0.1, independently. A shipment is accepted if a sample of 5 holds at most 1
defective. Find (a) the probability of acceptance; (b) the probability that 4 independent shipments are all
accepted; (c) the expected number of shipments up to and including the first rejection.

:::solution
(a) With $X$ binomial($5$, $0.1$): $P(X\le1)=(0.9)^5+5(0.1)(0.9)^4=0.59049+0.32805=0.91854$.

(b) $(0.91854)^4\approx0.712$.

(c) Each shipment is a trial with "rejected" probability $\theta=1-0.91854=0.08146$. The wait is geometric, so
$\mu=\frac1\theta\approx12.3$.
:::
::::

:::note[Pattern at work]
Step 6: a binomial inside a geometric. The first answer becomes the $\theta$ of the next layer.
:::
