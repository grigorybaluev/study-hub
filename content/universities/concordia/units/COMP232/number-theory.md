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

:::definition[Divides]
For integers $a \ne 0$ and $b$, $a \mid b$ ("$a$ divides $b$") iff
$b = ac$ for some integer $c$. Equivalently $a$ is a factor of $b$, or $b$ is a multiple of $a$.
:::

::::theorem[Properties of divisibility]
For integers $a, b, c$:

1. if $a \mid b$ and $a \mid c$ then $a \mid (b + c)$;
2. if $a \mid b$ then $a \mid bc$;
3. if $a \mid b$ and $b \mid c$ then $a \mid c$.

:::proof
Write $b = as$ for an integer $s$.

1. With $c = at$: $b + c = a(s + t)$.
2. $bc = a(sc)$.
3. With $c = bt$: $c = a(st)$.
:::
::::

## Primes and factorisation

:::definition[Prime and composite]
A **prime** is a positive integer with exactly two positive factors, $1$ and itself; a
positive integer $> 1$ that is not prime is **composite**.
:::

:::theorem[Fundamental theorem of arithmetic]
Every positive integer is a product of primes in exactly one way, up to order:
$780 = 2^2 \cdot 3 \cdot 5 \cdot 13$. (Existence is proved by strong induction in the
induction unit.)
:::

::::theorem[A small factor]
A composite $n$ has a prime factor $\le \sqrt n$.

:::proof
Write $n = ab$ with $1 < a \le b$. If $a > \sqrt n$ then $ab > \sqrt n \cdot \sqrt n = n$, a
contradiction; so $a \le \sqrt n$, and any prime factor of $a$ is a prime factor of $n$ no
larger than $\sqrt n$.
:::
::::

::::example[Testing for primality]
Is $311$ prime? Is $253$?

:::solution
$\sqrt{311} \approx 17.6$, and none of $2, 3, 5, 7, 11, 13, 17$ divides $311$, so it is prime.
$253 = 11 \cdot 23$ is composite. Trial division is fine at this size; factoring numbers with
hundreds of digits is not, and RSA encryption rests on that difficulty.
:::
::::

## gcd and lcm

:::definition[gcd, lcm, coprime]
$\gcd(a, b)$ is the largest common factor of $a$ and $b$, $\operatorname{lcm}(a, b)$ the smallest
positive common multiple. $a$ and $b$ are **coprime** (relatively prime) if $\gcd(a, b) = 1$:
$6$ and $25$ are, $6$ and $27$ are not, and any two distinct primes are.
:::

From factorisations, take each prime to the *minimum* exponent for the gcd and the
*maximum* for the lcm.

::::theorem[gcd times lcm]
$ab = \gcd(a, b) \cdot \operatorname{lcm}(a, b)$ for positive integers $a, b$.

:::proof
For each prime, the exponent on the right is $\min(a_i, b_i) + \max(a_i, b_i) = a_i + b_i$,
the exponent on the left.
:::
::::

::::example[780 and 550]
Find $\gcd(780, 550)$ and $\operatorname{lcm}(780, 550)$.

:::solution
$780 = 2^2 \cdot 3 \cdot 5 \cdot 13$ and $550 = 2 \cdot 5^2 \cdot 11$, so

$$
\gcd(780, 550) = 2 \cdot 5 = 10
\qquad
\operatorname{lcm}(780, 550) = 2^2 \cdot 3 \cdot 5^2 \cdot 11 \cdot 13 = 42900,
$$

and indeed $780 \cdot 550 = 10 \cdot 42900$.
:::
::::

## Division algorithm and modular arithmetic

:::theorem[Division algorithm]
For an integer $a$ and positive integer $d$ there are unique integers $q$ (quotient) and $r$
(remainder) with $a = dq + r$ and $0 \le r < d$.
:::

:::definition[mod and congruence]
$a \bmod m$ is the remainder of the division algorithm, always in $[0, m)$.
$a \equiv b \pmod m$ ("$a$ is congruent to $b$ modulo $m$") iff $m \mid (a - b)$ —
equivalently, $a$ and $b$ have the same remainder mod $m$.
:::

For example $30 \bmod 7 = 2$, $-22 \bmod 6 = 2$ (since $-22 = -4 \cdot 6 + 2$), and
$-3 \bmod 7 = 4$.

::::example[Round-robin scheduling]
Jobs $1, 2, 3, \dots$ are assigned in turn to processors $1, \dots, 5$. Which processor gets job $i$?

:::solution
Processor $(i \bmod 5) + 1$ — up to a shift in where the cycle starts, the remainder is what
cycles.
:::
::::

## The Euclidean algorithm

Computing $\gcd$ by factoring is expensive; the Euclidean algorithm never factors.

::::theorem[Euclid's step]
If $n = qd + r$, then $\gcd(n, d) = \gcd(d, r)$.

:::proof
Any common divisor of $n$ and $d$ divides $r = n - qd$, and any common divisor of $d$ and $r$
divides $n = qd + r$. So the two pairs have the same common divisors, and the same greatest one.
:::
::::

Repeating the step, the remainders strictly decrease, so they reach $0$; the last nonzero
remainder is the gcd.

```python
def gcd(a, b):
    while b != 0:
        a, b = b, a % b
    return a
```

::::example[gcd(18, 13)]
Compute $\gcd(18, 13)$ with the Euclidean algorithm.

:::solution
$$
18 = 13 \cdot 1 + 5 \qquad 13 = 5 \cdot 2 + 3 \qquad 5 = 3 \cdot 1 + 2 \qquad 3 = 2 \cdot 1 + 1 \qquad 2 = 1 \cdot 2 + 0
$$

The last nonzero remainder is $1$: $18$ and $13$ are coprime.
:::
::::

:::equations
- *Division algorithm*: $a = dq + r$, $0 \le r < d$.
- *gcd–lcm*: $ab = \gcd(a, b) \cdot \operatorname{lcm}(a, b)$.
- *Euclid step*: $\gcd(n, d) = \gcd(d,\ n \bmod d)$.
:::

:::insight
The division algorithm is the engine: it defines $\bmod$, it makes
congruence an equivalence on the integers, and iterating it *is* the Euclidean algorithm —
the fast way to a gcd and, later, to modular inverses in cryptography.
:::
