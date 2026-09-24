---
title: Partial fractions
order: 11
status: detailed
notes: ["Lecture 11 handout — learning/Slides/Lecture11.pdf (Stewart 7.4: polynomials and roots, proper and improper fractions, the four cases)"]
weeks: [6]
textbook: "Stewart, Calculus: Early Transcendentals, 7.4"
introduces: [partial-fractions]
requires:
  - {concept: substitution-rule, strength: hard}
  - {concept: function, strength: soft}
reinforces: []
---

Every rational function can be integrated in closed form. The method is algebra, not
calculus: factor the denominator, split the fraction into pieces with one factor each,
and integrate the pieces — each of which is a logarithm, a power, or an arctangent.

## Polynomials and their roots

> **Definition.** $P_n(x) = a_n x^n + a_{n-1}x^{n-1} + \dots + a_1 x + a_0$ with $a_n \ne 0$ is a **polynomial of degree $n$**. A number $b$ is a **root** if $P_n(b) = 0$; then $P_n(x) = (x - b)\,P_{n-1}(x)$. The root has **multiplicity $m$** if $P_n(x) = (x - b)^m P_{n-m}(x)$ with $P_{n-m}(b) \ne 0$; multiplicity 1 is a **simple root**.

> **Statement.** Every real polynomial factors into linear factors $ax + b$ and irreducible quadratic factors $ax^2 + bx + c$ (discriminant $b^2 - 4ac < 0$), counted with multiplicity.

Irreducible quadratics cannot be avoided: $x^2 + 1$ has no real root.

## Rational functions

> **Definition.** A **rational function** is a quotient of polynomials $\dfrac{P_n(x)}{Q_m(x)}$. It is **proper** if $n < m$ and **improper** if $n \ge m$.

An improper fraction must first be reduced by polynomial long division:
$$\frac{P_n(x)}{Q_m(x)} = S_{n-m}(x) + \frac{R(x)}{Q_m(x)}, \qquad \deg R < m .$$
The polynomial part $S$ integrates term by term; only the proper remainder needs the
method below.

## The decomposition

> **Statement.** A proper rational function $\dfrac{P(x)}{Q(x)}$ is a sum of **partial fractions** of the two shapes $\dfrac{A}{(ax + b)^i}$ and $\dfrac{Ax + B}{(ax^2 + bx + c)^i}$, one group per factor of $Q$.

The four cases, by what $Q$ contains:

**Case I — distinct linear factors.** $Q(x) = (a_1x + b_1)(a_2x + b_2)\cdots(a_mx + b_m)$:
$$\frac{P(x)}{Q(x)} = \frac{A_1}{a_1x + b_1} + \frac{A_2}{a_2x + b_2} + \dots + \frac{A_m}{a_mx + b_m}.$$

**Case II — a repeated linear factor** $(ax + b)^r$ contributes $r$ terms:
$$\frac{A_1}{ax + b} + \frac{A_2}{(ax + b)^2} + \dots + \frac{A_r}{(ax + b)^r}.$$

**Case III — a distinct irreducible quadratic** $ax^2 + bx + c$ contributes one term with a
linear numerator: $\dfrac{Ax + B}{ax^2 + bx + c}$.

**Case IV — a repeated irreducible quadratic** $(ax^2 + bx + c)^r$ contributes
$$\frac{A_1x + B_1}{ax^2 + bx + c} + \frac{A_2x + B_2}{(ax^2 + bx + c)^2} + \dots + \frac{A_rx + B_r}{(ax^2 + bx + c)^r}.$$

The unknown constants are found by the **method of undetermined coefficients**: put
the right-hand side over the common denominator $Q$, equate numerators, and either
compare coefficients of each power of $x$ or plug in convenient values of $x$ (the roots
of $Q$ kill all but one term — the "cover-up" shortcut for Case I).

```sim
id: calc-partial-fractions
controls:
  - {id: a, label: "Root a", min: -3, max: 3, step: 0.25, default: 1, decimals: 2}
  - {id: b, label: "Root b", min: -3, max: 3, step: 0.25, default: -2, decimals: 2}
note: 'The rational function 1/((x − a)(x − b)) (white) and its two partial fractions A/(x − a) and B/(x − b) with A = 1/(a − b), B = −A. The two simple poles add up to the original curve everywhere. When a = b the decomposition changes shape — Case II, with a 1/(x − a)² term.'
```

```python
# 1/((x − a)(x − b)) = A/(x − a) + B/(x − b) with A = 1/(a − b), B = −A (distinct roots).
import sympy as sp

x = sp.symbols('x')
for a, b in ((1, -2), (3, 3)):                           # the sim's default a = 1, b = −2; then a repeated root
    print(sp.apart(1 / ((x - a)*(x - b)), x))
# Output:
#   -1/(3*(x + 2)) + 1/(3*(x - 1))
#   (x - 3)**(-2)
```

> **Example — Case I.** $\displaystyle\int \frac{x + 5}{x^2 + x - 2}\,dx = \int \frac{x + 5}{(x - 1)(x + 2)}\,dx$. Write $\dfrac{x + 5}{(x-1)(x+2)} = \dfrac{A}{x - 1} + \dfrac{B}{x + 2}$, so $x + 5 = A(x + 2) + B(x - 1)$. At $x = 1$: $6 = 3A$, $A = 2$; at $x = -2$: $3 = -3B$, $B = -1$. Hence the integral is $2\ln|x - 1| - \ln|x + 2| + C$.

> **Example — Case II.** $\dfrac{x}{(x + 1)^2} = \dfrac{A}{x + 1} + \dfrac{B}{(x + 1)^2}$ gives $x = A(x + 1) + B$; comparing coefficients, $A = 1$, $B = -1$. So $\displaystyle\int \frac{x\,dx}{(x + 1)^2} = \ln|x + 1| + \frac{1}{x + 1} + C$.

> **Example — Case III.** $\dfrac{2x^2 - x + 4}{x^3 + 4x} = \dfrac{2x^2 - x + 4}{x(x^2 + 4)} = \dfrac{A}{x} + \dfrac{Bx + C}{x^2 + 4}$. Numerators: $2x^2 - x + 4 = A(x^2 + 4) + (Bx + C)x$, so $A + B = 2$, $C = -1$, $4A = 4$: $A = 1$, $B = 1$, $C = -1$. Then
> $\displaystyle\int \Big(\frac{1}{x} + \frac{x - 1}{x^2 + 4}\Big)dx = \ln|x| + \frac12\ln(x^2 + 4) - \frac12\tan^{-1}\frac{x}{2} + C$ — the quadratic piece splits into a $u = x^2 + 4$ substitution and an arctangent.

> **Caution.** Three routine slips: forgetting long division when the fraction is
> improper; writing a constant instead of $Ax + B$ over a quadratic; and giving a
> repeated factor only one term. Count the unknowns — there must be exactly $\deg Q$ of
> them.

> **Note.** The integrals that appear are always of three kinds: $\int \frac{dx}{ax + b} = \frac1a\ln|ax + b|$, $\int \frac{dx}{(ax + b)^i} = \frac{(ax + b)^{1 - i}}{a(1 - i)}$ for $i \ge 2$, and, after completing the square, $\int \frac{dx}{u^2 + k^2} = \frac1k\tan^{-1}\frac{u}{k}$ together with $\int \frac{u\,du}{u^2 + k^2} = \frac12\ln(u^2 + k^2)$.

**Equations**

- improper $\Rightarrow$ divide first: $\dfrac{P}{Q} = S + \dfrac{R}{Q}$, $\ \deg R < \deg Q$
- $(ax+b)^r \to \displaystyle\sum_{i=1}^{r}\frac{A_i}{(ax+b)^i}$, $\quad (ax^2+bx+c)^r \to \displaystyle\sum_{i=1}^{r}\frac{A_ix + B_i}{(ax^2+bx+c)^i}$

## Further reading

- [Paul's Online Notes — Partial Fractions](https://tutorial.math.lamar.edu/Classes/CalcII/PartialFractions.aspx) — The case table and several fully worked decompositions, including a repeated quadratic.
