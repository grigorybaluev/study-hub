---
title: Integers and division
order: 7
status: detailed
notes: ["Lecture slides main2, pp. 55-71", "Euclidean-algorithm handout"]
introduces: [modular-arithmetic]
requires:
  - {concept: proof-techniques, strength: hard}
  - {concept: function, strength: soft}
  - {concept: predicate-logic, strength: soft}
reinforces: []
---

Divisibility, primes and factorisation, gcd and lcm, the division algorithm, modular
arithmetic and congruences, and the Euclidean algorithm — the number theory behind data
structures, random numbers and encryption.

## Divisibility

> **Definition.** For integers $a \ne 0$ and $b$, $a \mid b$ ("$a$ divides $b$") iff
> $b = ac$ for some integer $c$. Equivalently $a$ is a factor of $b$, or $b$ is a multiple of $a$.

> **Theorem.** For integers $a, b, c$: (1) if $a \mid b$ and $a \mid c$ then $a \mid (b + c)$;
> (2) if $a \mid b$ then $a \mid bc$; (3) if $a \mid b$ and $b \mid c$ then $a \mid c$.

## Primes and factorisation

A **prime** is a positive integer with exactly two positive factors, $1$ and itself; a
positive integer $> 1$ that is not prime is **composite**.

> **Theorem (fundamental theorem of arithmetic).** Every positive integer is a product of
> primes in exactly one way, up to order: $780 = 2^2 \cdot 3 \cdot 5 \cdot 13$.

> **Theorem.** A composite $n$ has a factor $\le \sqrt n$ (factors come in pairs $k, n/k$).

So to test $311$: $\sqrt{311} \approx 17.6$, and none of $2, 3, 5, 7, 11, 13, 17$ divides it —
prime. For $253$: $11 \cdot 23$. Trial division is fine here; factoring numbers with hundreds
of digits is not, and RSA encryption rests on that difficulty.

## gcd and lcm

$\gcd(a, b)$ is the largest common factor, $\operatorname{lcm}(a, b)$ the smallest common
multiple. From factorisations, take each prime to the *minimum* exponent for the gcd and the
*maximum* for the lcm: $\gcd(780, 550) = 2 \cdot 5 = 10$,
$\operatorname{lcm}(780, 550) = 2^2 \cdot 3 \cdot 5^2 \cdot 11 \cdot 13 = 42900$.

> **Theorem.** $ab = \gcd(a, b) \cdot \operatorname{lcm}(a, b)$, because
> $\min(a_i, b_i) + \max(a_i, b_i) = a_i + b_i$ for each prime exponent.

$a$ and $b$ are **coprime** (relatively prime) if $\gcd(a, b) = 1$: $6$ and $25$ are, $6$ and
$27$ are not, and any two distinct primes are.

## Division algorithm and modular arithmetic

> **Theorem (division algorithm).** For an integer $a$ and positive integer $d$ there are
> unique integers $q$ (quotient) and $r$ (remainder) with $a = dq + r$ and $0 \le r < d$.

$a \bmod m$ is that remainder, always in $[0, m)$: $30 \bmod 7 = 2$, $-22 \bmod 6 = 2$
(since $-22 = -4 \cdot 6 + 2$), $-3 \bmod 7 = 4$.

> **Example.** Round-robin scheduling of jobs $1, 2, 3, \dots$ on processors $1..5$: job $i$
> goes to processor $(i \bmod 5) + 1$.

> **Definition.** $a \equiv b \pmod m$ ("$a$ is congruent to $b$ modulo $m$") iff $m \mid (a - b)$
> — equivalently $a$ and $b$ have the same remainder mod $m$.

## The Euclidean algorithm

Computing $\gcd$ by factoring is expensive; the Euclidean algorithm never factors:

```python
def gcd(a, b):
    while b != 0:
        a, b = b, a % b
    return a
```

> **Example.** $\gcd(18, 13)$: $18 = 13 \cdot 1 + 5$, $13 = 5 \cdot 2 + 3$, $5 = 3 \cdot 1 + 2$,
> $3 = 2 \cdot 1 + 1$, $2 = 1 \cdot 2 + 0$; the last nonzero remainder is $1$.
>
> *Why it works.* Write $n = qd + r$. If $r = 0$ then $\gcd(n, d) = d$. If $r > 0$ then any
> common divisor of $n$ and $d$ divides $r = n - qd$, and any common divisor of $d$ and $r$
> divides $n$; so $\gcd(n, d) = \gcd(d, r)$, and the remainders strictly decrease to $0$.

> **Key insight.** The division algorithm is the engine: it defines $\bmod$, it makes
> congruence an equivalence on the integers, and iterating it *is* the Euclidean algorithm —
> the fast way to a gcd and, later, to modular inverses in cryptography.

**Equations**

- *Division algorithm*: $a = dq + r$, $0 \le r < d$.
- *gcd–lcm*: $ab = \gcd(a, b) \cdot \operatorname{lcm}(a, b)$.
- *Euclid step*: $\gcd(n, d) = \gcd(d,\ n \bmod d)$.
