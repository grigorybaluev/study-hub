---
title: Sequences
order: 14
status: detailed
notes: ["Lecture 14 handout — learning/Slides/Lecture14.pdf (Stewart 11.1: definition, bounded and monotonic sequences, convergence, limit rules, monotone convergence theorem)"]
weeks: [8]
textbook: "Stewart, Calculus: Early Transcendentals, 11.1"
introduces: [sequence]
requires:
  - {concept: limit, strength: hard}
  - {concept: function, strength: hard}
reinforces: []
---

The second half of the course is about adding infinitely many numbers. Before a sum can
be infinite, a *list* must be: a sequence is a function whose domain is the integers, and
"converges" means what it did for functions, with $n \to \infty$ instead of $x \to \infty$.

## What a sequence is

> **Definition.** A **sequence** is an ordered list of infinitely many real numbers $a_1, a_2, a_3, \dots$, written $\{a_n\}$ or $\{a_n\}_{n=1}^{\infty}$. Equivalently it is a function $f$ on the integers from some starting point onward, with $a_n = f(n)$.

Three ways to specify one: list the first few terms when the pattern is clear
($1, \tfrac12, \tfrac14, \tfrac18, \dots$); give a formula for the general term
($a_n = 2^{1-n}$); or give a **recursion** ($a_1 = 1$, $a_{n+1} = a_n/2$). The Fibonacci
numbers $f_{n+1} = f_n + f_{n-1}$ are the classic recursive example with no simple
closed form to start from.

Sequences combine term by term: $\{a_n\} \pm \{b_n\} = \{a_n \pm b_n\}$, $k\{a_n\} = \{ka_n\}$,
$\{a_n\}\{b_n\} = \{a_nb_n\}$, and $\{a_n\}/\{b_n\} = \{a_n/b_n\}$ when no $b_n$ is $0$.

## Bounded and monotonic sequences

> **Definition.** $\{a_n\}$ is **bounded above** by $M$ if $a_n \le M$ for all $n$, **bounded below** by $L$ if $a_n \ge L$ for all $n$, and **bounded** if both — then $|a_n| \le K = \max\{|L|, |M|\}$. The smallest upper bound is the **least upper bound**; the largest lower bound the **greatest lower bound**. It is **unbounded** if for every $A > 0$ some term has $|a_n| > A$.

> **Definition.** $\{a_n\}$ is **increasing** if $a_{n+1} > a_n$ for all $n$, **decreasing** if $a_{n+1} < a_n$ for all $n$, **monotonic** if either. It is **alternating** if $a_n a_{n+1} < 0$ for all $n$ — the signs flip every step.

> **Theorem.** If $a_n = f(n)$ for a differentiable $f$ on $[1, \infty)$, then $\{a_n\}$ is decreasing when $f'(x) < 0$ there and increasing when $f'(x) > 0$.

Two other ways to test monotonicity: check the sign of $a_{n+1} - a_n$, or, for positive
terms, compare $a_{n+1}/a_n$ with $1$.

> **Example.** $a_n = \dfrac{n}{n^2 + 1}$. With $f(x) = x/(x^2 + 1)$, $f'(x) = \dfrac{1 - x^2}{(x^2 + 1)^2} < 0$ for $x > 1$, so the sequence is decreasing from $n = 1$ on. It is bounded below by $0$ and above by $a_1 = \tfrac12$.

## Convergence

> **Definition.** $\{a_n\}$ **converges to $L$**, written $\lim_{n \to \infty} a_n = L$, if for every $\varepsilon > 0$ there is an integer $N$ such that $|a_n - L| < \varepsilon$ for all $n \ge N$. Otherwise it **diverges**: to $\infty$ if $a_n \to \infty$, to $-\infty$ if $a_n \to -\infty$, or simply diverges if there is no limit at all.

```sim
id: calc-sequence-limit
controls:
  - {id: eps, label: "Tolerance ε", min: 0.02, max: 1, step: 0.02, default: 0.2, decimals: 2}
note: 'The sequence aₙ = 1 + 2(−1)ⁿ/n and the band L ± ε around L = 1. Shrink ε: the first index N after which every term stays inside the band moves right, but such an N always exists — that is the definition of convergence. The terms alternate around the limit, so the sequence is neither monotonic nor eventually one-sided.'
```

```python
# aₙ = 1 + 2(−1)ⁿ/n → 1: for every ε there is an N with |aₙ − 1| = 2/n < ε for all n ≥ N.
from math import floor

a = lambda n: 1 + 2*(-1)**n / n
print([round(a(n), 3) for n in range(1, 9)])             # alternates around the limit 1
for eps in (0.2, 0.05, 0.02):                            # the sim's default ε = 0.2
    N = floor(2 / eps) + 1
    assert all(abs(a(n) - 1) < eps for n in range(N, N + 1000))
    print(f'ε = {eps}: N = {N}')
# Output:
#   [-1.0, 2.0, 0.333, 1.5, 0.6, 1.333, 0.714, 1.25]
#   ε = 0.2: N = 11
#   ε = 0.05: N = 41
#   ε = 0.02: N = 101
```

> **Theorem.** If $\lim_{x \to \infty} f(x) = L$ and $a_n = f(n)$, then $\lim_{n \to \infty} a_n = L$.

So everything known about limits of functions at infinity — including l'Hôpital's rule
— transfers to sequences by writing $n$ as $x$. The converse fails: $a_n = \sin(n\pi) = 0$
for all $n$ converges, but $\sin(\pi x)$ has no limit.

### Limit rules

If $\{a_n\}$ and $\{b_n\}$ converge and $k$ is a constant:

1. $\lim(a_n \pm b_n) = \lim a_n \pm \lim b_n$
2. $\lim k a_n = k\lim a_n$
3. $\lim a_n b_n = \lim a_n\cdot\lim b_n$
4. $\lim \dfrac{a_n}{b_n} = \dfrac{\lim a_n}{\lim b_n}$ if $\lim b_n \ne 0$
5. $\lim a_n^p = \big(\lim a_n\big)^p$ if $p > 0$ and $a_n > 0$
6. if $a_n \le b_n$ eventually, then $\lim a_n \le \lim b_n$
7. **squeeze**: if $a_n \le b_n \le c_n$ eventually and $\lim a_n = \lim c_n = L$, then $\lim b_n = L$

> **Theorem.** If $\lim |a_n| = 0$ then $\lim a_n = 0$. (Squeeze between $-|a_n|$ and $|a_n|$.)

> **Theorem.** If $\lim a_n = L$ and $f$ is continuous at $L$ (and defined at every $a_n$), then $\lim f(a_n) = f(L)$ — limits pass through continuous functions.

> **Example.** $a_n = \dfrac{(-1)^n}{n}$: $|a_n| = 1/n \to 0$, so $a_n \to 0$. $\quad a_n = r^n$: converges to $0$ for $|r| < 1$, to $1$ for $r = 1$, and diverges otherwise. $\quad a_n = \dfrac{\ln n}{n}$: by l'Hôpital on $\ln x / x$, the limit is $0$.

## Bounded monotonic sequences converge

> **Theorem.** Every convergent sequence is bounded.

> **Theorem (monotone convergence).** If $\{a_n\}$ is bounded above and (eventually) increasing, it converges; if bounded below and (eventually) decreasing, it converges.

> **Key insight.** This is the one theorem that proves convergence *without knowing the
> limit*. An increasing sequence that cannot pass $M$ has nowhere to go but up to its
> least upper bound. It is the tool for recursive sequences, and, next lecture, for
> series with positive terms — whose partial sums are automatically increasing.

> **Example.** $a_1 = \sqrt2$, $a_{n+1} = \sqrt{2 + a_n}$. Induction shows $a_n < 2$ and $a_{n+1} > a_n$, so the sequence converges to some $L$. Passing to the limit in the recursion, $L = \sqrt{2 + L}$, so $L^2 - L - 2 = 0$ and $L = 2$.

**Equations**

- $a_n \to L$: $\forall\varepsilon > 0\ \exists N:\ n \ge N \Rightarrow |a_n - L| < \varepsilon$
- $\lim_{x\to\infty} f(x) = L \Rightarrow \lim_{n\to\infty} f(n) = L$
- $r^n \to 0$ for $|r| < 1$; bounded + monotonic $\Rightarrow$ convergent

## Further reading

- [Paul's Online Notes — Sequences](https://tutorial.math.lamar.edu/Classes/CalcII/Sequences.aspx) — Limits of sequences via the function rule and the squeeze theorem.
- [Paul's Online Notes — More on Sequences](https://tutorial.math.lamar.edu/Classes/CalcII/MoreSequences.aspx) — Bounded, monotonic, and the monotone convergence theorem with a recursive example.
