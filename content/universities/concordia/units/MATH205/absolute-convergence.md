---
title: Absolute convergence and the ratio and root tests
order: 19
status: detailed
notes: ["Lecture 19 handout — learning/Slides/Lecture19.pdf (Stewart 11.6: absolute and conditional convergence, ratio test, root test, Riemann's rearrangement theorem)"]
weeks: [10]
textbook: "Stewart, Calculus: Early Transcendentals, 11.6"
introduces:
  - {concept: convergence-tests, perspective: "absolute versus conditional convergence, and the ratio and root tests"}
requires:
  - {concept: series, strength: hard}
  - {concept: limit, strength: hard}
reinforces: []
---

For series with terms of any sign, the cleanest route is to drop the signs: if the
series of absolute values converges, so does the original. That is *absolute*
convergence, and it is the setting for the two tests that will matter most for power
series — ratio and root — which compare a series with a geometric one. The lecture
ends with a warning about what conditionally convergent series can do.

## Absolute and conditional convergence

> **Definition.** $\sum a_n$ is **absolutely convergent** if $\sum |a_n|$ converges.

Properties:

1. Absolutely convergent $\Rightarrow$ convergent. (Since $0 \le a_n + |a_n| \le 2|a_n|$, the
   series $\sum (a_n + |a_n|)$ converges by comparison, and $\sum a_n$ is its difference with $\sum |a_n|$.)
2. If $\sum a_n$ and $\sum b_n$ converge absolutely, so does $\sum(\alpha a_n + \beta b_n)$ for any constants $\alpha, \beta$.
3. Rearranging the terms of an absolutely convergent series gives an absolutely convergent series with the *same* sum.

> **Definition.** $\sum a_n$ is **conditionally convergent** if it converges but $\sum |a_n|$ diverges.

> **Example.** $\displaystyle\sum \frac{(-1)^{n-1}}{n^2}$ is absolutely convergent ($\sum 1/n^2$ converges). $\displaystyle\sum \frac{(-1)^{n-1}}{n}$ is conditionally convergent: it converges by the alternating series test, but the absolute values form the harmonic series. $\displaystyle\sum \frac{\cos n}{n^2}$ converges absolutely by comparison with $\sum 1/n^2$ — the sign pattern of $\cos n$ is irregular and no alternating test applies, but absolute convergence does not care.

## The ratio test

> **Theorem (ratio test).** Let $L = \displaystyle\lim_{n \to \infty}\left|\frac{a_{n+1}}{a_n}\right|$.
> (i) If $L < 1$, $\sum a_n$ is absolutely convergent (hence convergent).
> (ii) If $L > 1$ or $L = \infty$, $\sum a_n$ diverges.
> (iii) If $L = 1$, the test is **inconclusive**.

*Why.* If $L < 1$, then eventually $|a_{n+1}| \le r|a_n|$ for some $r$ with $L < r < 1$, so
$|a_n|$ is dominated by a geometric series with ratio $r$. If $L > 1$ the terms eventually
grow, so $a_n \not\to 0$.

```sim
id: calc-ratio-test
controls:
  - {id: k, label: "Power k in nᵏ", min: 0, max: 4, step: 1, default: 2, decimals: 0}
  - {id: r, label: "Base r in rⁿ", min: 1, max: 4, step: 0.1, default: 2, decimals: 1}
note: 'aₙ = nᵏ/rⁿ. Top: the ratios aₙ₊₁/aₙ = ((n+1)/n)ᵏ · (1/r) start above 1 for large k but settle at L = 1/r. Bottom: the partial sums. For r > 1 the exponential wins over any power and the series converges; at r = 1 the ratio limit is 1 and the test says nothing — the series is Σ nᵏ, plainly divergent.'
```

```python
# Ratio test for aₙ = nᵏ/rⁿ: aₙ₊₁/aₙ = ((n + 1)/n)ᵏ / r → 1/r.
k, r = 2, 2                                              # the sim's defaults
a = lambda n: n**k / r**n
print([round(a(n + 1) / a(n), 3) for n in (1, 2, 5, 10, 30)])   # starts above 1, settles at 1/r = 0.5
print(round(sum(a(n) for n in range(1, 200)), 4))        # Σ n²/2ⁿ = 6
# Output:
#   [2.0, 1.125, 0.72, 0.605, 0.534]
#   6.0
```

> **Example.** $\displaystyle\sum \frac{n^3}{3^n}$: $\left|\frac{a_{n+1}}{a_n}\right| = \frac{(n+1)^3}{3^{n+1}}\cdot\frac{3^n}{n^3} = \frac13\Big(1 + \frac1n\Big)^3 \to \frac13 < 1$. Converges.
> $\displaystyle\sum \frac{n^n}{n!}$: $\frac{a_{n+1}}{a_n} = \frac{(n+1)^{n+1}}{(n+1)!}\cdot\frac{n!}{n^n} = \Big(\frac{n+1}{n}\Big)^n \to e > 1$. Diverges.
> $\displaystyle\sum \frac{x^n}{n!}$ for any fixed $x$: $\left|\frac{a_{n+1}}{a_n}\right| = \frac{|x|}{n+1} \to 0$. Converges absolutely for every $x$ — the exponential series.

> **Caution.** Both $\sum 1/n$ and $\sum 1/n^2$ have ratio limit $1$; one diverges, the other
> converges. When $L = 1$, switch tests — usually to comparison with a $p$-series. The
> ratio test shines on factorials and $n$-th powers, where the ratio simplifies.

## The root test

> **Theorem (root test).** Let $L = \displaystyle\lim_{n \to \infty}\sqrt[n]{|a_n|}$.
> (i) If $L < 1$, $\sum a_n$ converges absolutely. (ii) If $L > 1$ or $L = \infty$, it diverges. (iii) If $L = 1$, the test is inconclusive.

Same idea, same geometric comparison, useful when $a_n$ is an $n$-th power of something
simple.

> **Example.** $\displaystyle\sum \Big(\frac{2n + 3}{3n + 2}\Big)^n$: $\sqrt[n]{|a_n|} = \dfrac{2n + 3}{3n + 2} \to \dfrac23 < 1$. Converges.

## Rearranging the terms

> **Theorem (Riemann).** (i) A rearrangement of an absolutely convergent series converges to the same sum.
> (ii) If $\sum a_n$ is conditionally convergent and $L$ is *any* real number, its terms can be rearranged so that the new series converges to $L$ — or diverges to $\infty$, to $-\infty$, or simply diverges.

```sim
id: calc-rearrangement
controls:
  - {id: L, label: "Target sum L", min: -1, max: 3, step: 0.05, default: 1.5, decimals: 2}
note: 'The alternating harmonic series 1 − 1/2 + 1/3 − … sums to ln 2 ≈ 0.693 in its natural order (dashed). Rearranged greedily — add positive terms until the running total exceeds L, then negative ones until it drops below, repeat — the same terms converge to L instead. The positive terms alone diverge, so there is always enough left to overshoot.'
```

```python
# Riemann's rearrangement: the terms of 1 − 1/2 + 1/3 − … (sum ln 2) reordered
# greedily converge to any chosen L instead.
from math import log

def rearranged(L, N=400):
    pos, neg, s = 1, 2, 0.0
    for _ in range(N):
        if s <= L:
            s += 1 / pos; pos += 2                       # next unused positive term
        else:
            s -= 1 / neg; neg += 2                       # next unused negative term
    return s

natural = sum((-1)**(i + 1) / i for i in range(1, 401))
print(f'natural order, 400 terms: {natural:.4f} (ln 2 = {log(2):.4f})')
for L in (1.5, 0, -1):                                   # the sim's default L = 1.5
    print(f'rearranged toward {L}: {rearranged(L):.4f}')
# Output:
#   natural order, 400 terms: 0.6919 (ln 2 = 0.6931)
#   rearranged toward 1.5: 1.5001
#   rearranged toward 0: -0.0008
#   rearranged toward -1: -0.9658
```

> **Key insight.** Addition of infinitely many numbers is *not* commutative unless the
> series converges absolutely. This is why the tests that prove absolute convergence
> are the ones worth having: they license the algebra — reordering, regrouping,
> multiplying series — that power series will rely on.

**Equations**

- $\sum |a_n|$ converges $\Rightarrow \sum a_n$ converges
- ratio: $\displaystyle\lim\left|\frac{a_{n+1}}{a_n}\right| = L$; root: $\displaystyle\lim\sqrt[n]{|a_n|} = L$ — $L < 1$ converges absolutely, $L > 1$ diverges, $L = 1$ no information
- conditionally convergent $\Rightarrow$ rearrangeable to any sum

## Further reading

- [Paul's Online Notes — Absolute Convergence](https://tutorial.math.lamar.edu/Classes/CalcII/AbsoluteConvergence.aspx) — Absolute versus conditional, with the rearrangement warning.
- [Paul's Online Notes — Ratio Test](https://tutorial.math.lamar.edu/Classes/CalcII/RatioTest.aspx) and [Root Test](https://tutorial.math.lamar.edu/Classes/CalcII/RootTest.aspx) — Proofs from the geometric series and the inconclusive cases.
