---
title: Series
order: 15
status: detailed
notes: ["Lecture 15 handout — learning/Slides/Lecture15.pdf (Stewart 11.2: partial sums, convergence, geometric, telescoping and harmonic series, divergence test)"]
weeks: [8]
textbook: "Stewart, Calculus: Early Transcendentals, 11.2"
introduces: [series]
requires:
  - {concept: sequence, strength: hard}
  - {concept: limit, strength: hard}
reinforces: []
---

An infinite sum has no meaning until one is assigned: it is the *limit of the running
totals*. That single definition, plus the geometric series as the one family whose sum
is known exactly, is the whole lecture — and the test for divergence at the end is the
first of the convergence tests.

## Definition

> **Definition.** A **series** is a sum of infinitely many terms, $\displaystyle\sum_{n=1}^{\infty} a_n = a_1 + a_2 + a_3 + \dots$; $a_n$ is its **$n$-th term**.

> **Definition.** The **$n$-th partial sum** is $S_n = \displaystyle\sum_{i=1}^{n} a_i$, and $\{S_n\}$ is the **sequence of partial sums**.

> **Definition.** If $\{S_n\}$ converges to $L$, the series **converges** and its **sum** is $L$: $\displaystyle\sum_{n=1}^{\infty} a_n = \lim_{n \to \infty} S_n = L$. If $\{S_n\}$ diverges, the series **diverges**.

> **Key insight.** Two different sequences live inside every series: the *terms* $a_n$ and
> the *partial sums* $S_n$. Convergence of the series is about $S_n$. Confusing the two is
> the source of the most common wrong answer in the course — see the divergence test.

## Geometric series

> **Definition.** A **geometric series** has the form $\displaystyle\sum_{n=1}^{\infty} ar^{n-1} = a + ar + ar^2 + \dots$; $r$ is the **common ratio**.

The partial sum has a closed form: $S_n - rS_n = a - ar^n$, so $S_n = \dfrac{a(1 - r^n)}{1 - r}$
for $r \ne 1$. Since $r^n \to 0$ exactly when $|r| < 1$:

> **Theorem.** For $a \ne 0$, $\displaystyle\sum_{n=1}^{\infty} ar^{n-1} = \frac{a}{1 - r}$ if $|r| < 1$, and the series diverges if $|r| \ge 1$. (For $r \ge 1$ it diverges to $\pm\infty$ with the sign of $a$; for $r \le -1$ the partial sums oscillate without settling.)

```sim
id: calc-geometric-series
controls:
  - {id: a, label: "First term a", min: -2, max: 2, step: 0.1, default: 1, decimals: 1}
  - {id: r, label: "Ratio r", min: -1.5, max: 1.5, step: 0.05, default: 0.5, decimals: 2}
  - {id: n, label: "Terms shown n", min: 1, max: 30, step: 1, default: 12, decimals: 0}
note: 'Terms a rⁿ⁻¹ (bars) and partial sums Sₙ (line). With |r| < 1 the partial sums settle at a/(1 − r), shown dashed. Push r past 1 and they run away; at r = −1 they hop between a and 0 forever — divergent although bounded.'
```

> **Example.** $\displaystyle\sum_{n=1}^{\infty} \frac{2}{3^n} = \frac{2}{3} + \frac{2}{9} + \dots$ has $a = \tfrac23$, $r = \tfrac13$: sum $= \dfrac{2/3}{1 - 1/3} = 1$.
> $0.\overline{27} = \dfrac{27}{100} + \dfrac{27}{100^2} + \dots = \dfrac{27/100}{1 - 1/100} = \dfrac{27}{99} = \dfrac{3}{11}$ — every repeating decimal is a geometric series.

> **Caution.** Check where the series *starts* before using $a/(1 - r)$: $a$ is the first
> term actually present. $\sum_{n=3}^{\infty} 2^{-n} = \frac{1/8}{1 - 1/2} = \frac14$, not $2$.

## Telescoping and harmonic series

> **Definition.** A **telescoping series** is one whose terms collapse in the partial sum, the model being $\displaystyle\sum_{n=1}^{\infty}\frac{1}{n(n+1)}$.

Partial fractions give $\dfrac{1}{n(n+1)} = \dfrac1n - \dfrac{1}{n+1}$, so
$S_n = \big(1 - \tfrac12\big) + \big(\tfrac12 - \tfrac13\big) + \dots + \big(\tfrac1n - \tfrac{1}{n+1}\big) = 1 - \dfrac{1}{n+1} \to 1$. The sum is $1$.

> **Definition.** The **harmonic series** is $\displaystyle\sum_{n=1}^{\infty}\frac{1}{n} = 1 + \frac12 + \frac13 + \dots$.

It diverges, although its terms go to $0$. One proof groups the terms:
$1 + \tfrac12 + (\tfrac13 + \tfrac14) + (\tfrac15 + \dots + \tfrac18) + \dots$, and each bracket
exceeds $\tfrac12$, so $S_{2^k} > 1 + \tfrac{k}{2} \to \infty$. (The integral test of the next
lecture gives a second proof.)

## The divergence test

> **Theorem.** If $\displaystyle\sum_{n=1}^{\infty} a_n$ converges, then $\lim_{n \to \infty} a_n = 0$.

*Why:* $a_n = S_n - S_{n-1}$, and both partial sums tend to the same $L$.

> **Theorem (divergence test).** If $\lim_{n \to \infty} a_n \ne 0$, or the limit does not exist, then $\displaystyle\sum a_n$ **diverges**.

> **Caution.** The converse is false. $a_n \to 0$ does **not** imply convergence — the
> harmonic series is the standard counterexample. The divergence test can only ever
> say "diverges"; when $a_n \to 0$ it says nothing, and a real test is needed.

> **Example.** $\displaystyle\sum \frac{n^2}{5n^2 + 4}$ diverges: the terms tend to $\tfrac15 \ne 0$. $\quad\displaystyle\sum (-1)^n$ diverges: the terms have no limit.

### Algebra of convergent series

If $\sum a_n$ and $\sum b_n$ converge, so do $\sum ca_n$ and $\sum(a_n \pm b_n)$, with
sums $c\sum a_n$ and $\sum a_n \pm \sum b_n$. Changing or dropping finitely many terms
never affects *whether* a series converges (only its sum).

**Equations**

- $\displaystyle\sum_{n=1}^{\infty} a_n = \lim_{n\to\infty} S_n$, $\ S_n = a_1 + \dots + a_n$
- geometric: $\displaystyle\sum_{n=1}^{\infty} ar^{n-1} = \frac{a}{1 - r}$ for $|r| < 1$, $\ S_n = \dfrac{a(1 - r^n)}{1 - r}$
- $\sum a_n$ converges $\Rightarrow a_n \to 0$; $\ a_n \not\to 0 \Rightarrow \sum a_n$ diverges

## Further reading

- [Paul's Online Notes — Series: The Basics](https://tutorial.math.lamar.edu/Classes/CalcII/Series_Basics.aspx) — Partial sums, index shifts, and the algebra of series.
- [Paul's Online Notes — Special Series](https://tutorial.math.lamar.edu/Classes/CalcII/Series_Special.aspx) — Geometric, telescoping and harmonic series worked in detail.
