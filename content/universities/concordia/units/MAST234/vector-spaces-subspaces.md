---
title: General vector spaces and subspaces
order: 7
status: detailed
weeks: [7]
introduces:
  - {concept: vector-space, perspective: "the axioms, with polynomials and functions as vectors; subspaces"}
requires:
  - {concept: vector, strength: hard}
  - {concept: matrix, strength: hard}
  - {concept: linear-combination-span, strength: hard}
  - {concept: linear-independence, strength: hard}
  - {concept: linear-system, strength: soft}
  - {concept: computer-algebra-system, strength: soft}
reinforces:
  - {concept: linear-independence, perspective: "in abstract vector spaces such as polynomial spaces"}
  - {concept: linear-combination-span, perspective: "the span of a set as the smallest subspace containing it"}
---

Everything done so far with vectors in $\mathbb R^n$ used only two operations, addition and scaling, and
a short list of rules they obey. Polynomials can be added and scaled by the same rules, and so can
matrices and functions. This unit takes the rules themselves as the definition: a **vector space** is
any set with two operations that obey them. Whatever is proved from the rules then holds for all of
these objects at once. Inside a vector space sit smaller ones, the **subspaces**, and most of the sets
met so far (kernels, column spaces, spans) turn out to be subspaces.

Indices start at $0$, as in Sage. Scalars are real numbers until the unit on complex numbers.

## From R^n to vector spaces

### Polynomials as vectors

Take two polynomials of degree at most $2$ and add them:

$$
(1 + 2x + 3x^2) + (4 - x^2) = 5 + 2x + 2x^2 .
$$

Coefficient by coefficient, this is $(1, 2, 3) + (4, 0, -1) = (5, 2, 2)$ in $\mathbb R^3$. Scaling behaves the same way.
A polynomial is not a list of numbers, but for adding and scaling it might as well be. That is the
point of the definition below: it does not say what a vector **is**, only how vectors behave.

### The definition

:::definition[Vector space]
A (real) **vector space** is a set $V$ with a rule $+$ for addition, which combines two vectors of $V$ into a
vector, and a rule $\cdot$ for scalar multiplication, which combines a real number and a vector of $V$ into a
vector, such that for all $\mathbf u, \mathbf v, \mathbf w \in V$ and all scalars $c, d \in \mathbb R$:

1. $\mathbf u + \mathbf v \in V$: $V$ is **closed under addition**;
2. $c\,\mathbf v \in V$: $V$ is **closed under scalar multiplication**;
3. $\mathbf u + \mathbf v = \mathbf v + \mathbf u$: addition is commutative;
4. $(\mathbf u + \mathbf v) + \mathbf w = \mathbf u + (\mathbf v + \mathbf w)$: addition is associative;
5. there is a vector $\mathbf 0 \in V$ with $\mathbf v + \mathbf 0 = \mathbf v$ for all $\mathbf v \in V$: the **additive identity**, or zero vector;
6. for every $\mathbf v \in V$ there is a vector $-\mathbf v \in V$ with $\mathbf v + (-\mathbf v) = \mathbf 0$: the **additive inverse** of $\mathbf v$;
7. $c(\mathbf u + \mathbf v) = c\,\mathbf u + c\,\mathbf v$: scalar multiplication distributes over vector addition;
8. $(c + d)\mathbf v = c\,\mathbf v + d\,\mathbf v$: a second distributive rule;
9. $(cd)\mathbf v = c(d\,\mathbf v)$: scalar multiplication is associative;
10. $1\,\mathbf v = \mathbf v$: $1$ is the multiplicative identity.

The elements of $V$ are called **vectors**, whatever they are.
:::

Axioms 1 and 2 are the two **closure** axioms: the sum and the scalar multiple must land back in $V$. They are
the ones that fail most often, because the other eight are rules of arithmetic that a set of familiar
objects usually inherits.

:::remark
The scalars do not have to be real numbers. Rational numbers, or complex numbers, work just as well: what
matters is that the scalars form a **field**, a set of numbers in which one can always add, subtract,
multiply, and divide by anything except $0$. Complex scalars come back in the unit on complex numbers.
:::

### Examples

| Space | Vectors | Zero vector |
|---|---|---|
| $\mathbb R^n$ | $n$-tuples of reals | $(0, \dots, 0)$ |
| $\mathbb R^{m \times n}$ | $m \times n$ matrices | the zero matrix |
| $\mathbb P_n(\mathbb R)$ | polynomials of degree at most $n$, with real coefficients | the zero polynomial |
| $\mathbb P(\mathbb R)$ | all polynomials | the zero polynomial |
| $C[a, b]$ | continuous functions on the closed interval $[a, b]$ | the constant function $0$ |
| $\mathcal F(\mathbb R)$ | all functions $\mathbb R \to \mathbb R$ | the function that is $0$ everywhere |

Matrices are added and scaled entry by entry, exactly like vectors of $\mathbb R^{mn}$ laid out in a grid. That
matrices can also be **multiplied** plays no part in $\mathbb R^{m \times n}$ being a vector space. Polynomials are added and
scaled coefficient by coefficient:

$$
(a_nx^n + \cdots + a_0) + (b_nx^n + \cdots + b_0) = (a_n + b_n)x^n + \cdots + (a_0 + b_0), \qquad c\,(a_nx^n + \cdots + a_0) = ca_nx^n + \cdots + ca_0 .
$$

In $C[a, b]$ and $\mathcal F(\mathbb R)$ the operations are point by point: $(f + g)(x) = f(x) + g(x)$ and $(cf)(x) = c\,f(x)$. A sum of
continuous functions is continuous and a multiple of one is continuous, so $C[a, b]$ is closed; its zero vector is
the constant function $0$, the additive inverse of $f$ is $(-1)f$, and the other axioms are the usual arithmetic of
functions. $\mathbb R^n$, $\mathbb R^{m \times n}$ and $\mathbb P_n(\mathbb R)$ are **finite-dimensional**, while $C[a, b]$ is **infinite-dimensional**: the
next unit makes this precise.

::::example[Checking all ten axioms for P₂(ℝ)]
Show that $\mathbb P_2(\mathbb R) = \{a_2x^2 + a_1x + a_0 : a_0, a_1, a_2 \in \mathbb R\}$ is a vector space.

:::solution
Take $p = p_2x^2 + p_1x + p_0$, $q = q_2x^2 + q_1x + q_0$, $r = r_2x^2 + r_1x + r_0$ and scalars $a, b$.

1. $p + q = (p_2 + q_2)x^2 + (p_1 + q_1)x + (p_0 + q_0)$ has degree at most $2$, so it is in $\mathbb P_2(\mathbb R)$.
2. $a\,p = ap_2x^2 + ap_1x + ap_0 \in \mathbb P_2(\mathbb R)$.
3. $p + q = q + p$, because $p_i + q_i = q_i + p_i$ for each coefficient.
4. $(p + q) + r = p + (q + r)$, because $(p_i + q_i) + r_i = p_i + (q_i + r_i)$.
5. The zero polynomial $0x^2 + 0x + 0$ is the additive identity: $p + 0 = p$.
6. The additive inverse of $p$ is $-p_2x^2 - p_1x - p_0$: the sum has all coefficients $0$.
7. $a(p + q) = a\,p + a\,q$, because $a(p_i + q_i) = ap_i + aq_i$.
8. $(a + b)p = a\,p + b\,p$, because $(a + b)p_i = ap_i + bp_i$.
9. $(ab)p = a(b\,p)$, because $(ab)p_i = a(bp_i)$.
10. $1\,p = p$.

Every axiom comes down to the same rule for real numbers, applied coefficient by coefficient. The same argument
works for every $\mathbb P_n(\mathbb R)$.
:::
::::

Sage can check the identities with symbolic coefficients:

```python
p0, p1, p2, q0, q1, q2, a, b = var('p0 p1 p2 q0 q1 q2 a b')
p = p2*x^2 + p1*x + p0
q = q2*x^2 + q1*x + q0
(p + q).simplify_full()          # (p2 + q2)*x^2 + (p1 + q1)*x + p0 + q0
bool(a*(p + q) == a*p + a*q)     # True: axiom 7
bool((a*b)*p == a*(b*p))         # True: axiom 9
```

::::example[A vector space with strange operations]
Let $V = (0, \infty)$ with $x \oplus y = xy$ and $c \odot x = x^c$. Show that $V$ is a vector space and find its zero vector.

:::solution
The sum and the power of positive numbers are positive, so $V$ is closed (axioms 1 and 2). Axioms 3 and 4 are those of
multiplication. The zero vector is the number $1$, because $x \oplus 1 = x$, and the negative of $x$ is $\frac{1}{x}$, because
$x \oplus \frac1x = 1$. The other rules are the laws of exponents:

$$
c \odot (x \oplus y) = (xy)^c = x^c y^c , \qquad (c + d) \odot x = x^{c+d} = x^c x^d , \qquad c \odot (d \odot x) = (x^d)^c = x^{cd} , \qquad 1 \odot x = x .
$$

The number $0$ is not in $V$, and the zero vector is not the number $0$.
:::
::::

::::example[Two sets that are not vector spaces]
Why does each of these fail? (a) Polynomials of degree exactly $2$, with the usual operations. (b) $\mathbb R^2$ with the usual
addition and the scaling $c \odot (x, y) = (cx, 0)$.

:::solution
(a) It is not closed: $(x^2 + x) + (-x^2) = x$ has degree $1$. It also has no zero vector.

(b) Axiom 10 fails: $1 \odot (0, 1) = (0, 0) \neq (0, 1)$. One failing axiom is enough.
:::
::::

### What follows from the rules

These look obvious in $\mathbb R^n$. The point is that they hold in every vector space, using only the rules.

These five results follow from the axioms alone, one step at a time.

::::theorem[Zero times a vector]
For every vector $\mathbf v$ in a vector space $V$, $0\,\mathbf v = \mathbf 0$.

:::proof
$0\,\mathbf v = (0 + 0)\mathbf v = 0\,\mathbf v + 0\,\mathbf v$ by axiom 8. Add the additive inverse of $0\,\mathbf v$ to both sides and use associativity:
$\mathbf 0 = 0\,\mathbf v + 0\,\mathbf v + (-0\,\mathbf v) = 0\,\mathbf v + \mathbf 0 = 0\,\mathbf v$.
:::
::::

::::theorem[A scalar times the zero vector]
For every scalar $c$, $c\,\mathbf 0 = \mathbf 0$.

:::proof
$\mathbf 0 = \mathbf 0 + \mathbf 0$, so $c\,\mathbf 0 = c\,\mathbf 0 + c\,\mathbf 0$ by axiom 7. Adding the additive inverse of $c\,\mathbf 0$ to both sides gives
$\mathbf 0 = c\,\mathbf 0 + \mathbf 0 = c\,\mathbf 0$.
:::
::::

::::theorem[The additive inverse is (−1)v]
In every vector space, the additive inverse of $\mathbf v$ is the scalar multiple $(-1)\mathbf v$.

:::proof
By axiom 10 and axiom 8, $\mathbf v + (-1)\mathbf v = 1\,\mathbf v + (-1)\mathbf v = (1 + (-1))\mathbf v = 0\,\mathbf v = \mathbf 0$, using the first result.
:::
::::

::::theorem[The additive inverse is unique]
Each $\mathbf v \in V$ has exactly one additive inverse.

:::proof
Suppose $\mathbf v + \mathbf u = \mathbf 0$ and $\mathbf v + \mathbf w = \mathbf 0$. Then, by commutativity and associativity,
$\mathbf u = \mathbf u + \mathbf 0 = \mathbf u + (\mathbf v + \mathbf w) = (\mathbf u + \mathbf v) + \mathbf w = (\mathbf v + \mathbf u) + \mathbf w = \mathbf 0 + \mathbf w = \mathbf w$.
:::
::::

::::theorem[A product is zero only through a zero factor]
If $c\,\mathbf v = \mathbf 0$, then $c = 0$ or $\mathbf v = \mathbf 0$.

:::proof
If $c = 0$ there is nothing to show. If $c \neq 0$, multiply by $\frac1c$ and use axiom 9, axiom 10 and the second result:
$\mathbf v = 1\,\mathbf v = \left(\tfrac1c\,c\right)\mathbf v = \tfrac1c(c\,\mathbf v) = \tfrac1c\,\mathbf 0 = \mathbf 0$.
:::
::::

The zero vector is unique too: if $\mathbf 0$ and $\mathbf 0'$ are both additive identities, then $\mathbf 0 = \mathbf 0 + \mathbf 0' = \mathbf 0'$.

## Subspaces

### Definition and test

:::definition[Subspace]
Let $V$ be a vector space. A subset $U \subseteq V$ is a **subspace** of $V$ if

1. the zero vector is in $U$: $\mathbf 0 \in U$;
2. $U$ is closed under addition: if $\mathbf u, \mathbf v \in U$, then $\mathbf u + \mathbf v \in U$;
3. $U$ is closed under scalar multiplication: if $\mathbf u \in U$ and $c \in \mathbb R$, then $c\,\mathbf u \in U$.
:::

::::theorem[A subspace is a vector space]
Every subspace $U$ of a vector space $V$ is itself a vector space, with the operations of $V$.

:::proof
$U$ is closed under addition and scalar multiplication (axioms 1 and 2) and contains $\mathbf 0$ (axiom 5) by definition. For
$\mathbf u \in U$, the additive inverse $-\mathbf u = (-1)\mathbf u$ is in $U$ because $U$ is closed under scalar multiplication (axiom 6).
The remaining axioms are rules of arithmetic for the two operations; they hold for all vectors of $V$, so in
particular for the vectors of $U$.
:::
::::

Conversely, a subset that is a vector space under the operations of $V$ satisfies the three conditions: it is
closed, and its zero vector is $0\,\mathbf u = \mathbf 0$ for any $\mathbf u$ in it. So the three conditions are exactly "a vector
space inside $V$".

:::steps[Testing a subset]
1. Does $U$ contain the zero vector of $V$? If not, stop: it is not a subspace.
2. Is $U$ a span, or the solution set of a homogeneous system? Then it is a subspace (shown below).
3. Otherwise take arbitrary $\mathbf u, \mathbf v \in U$ and $c \in \mathbb R$, write what membership means, and check $\mathbf u + \mathbf v$ and $c\,\mathbf v$.
4. If a closure seems to fail, give specific vectors that leave $U$.
:::

::::example[Three subspaces]
Show that each is a subspace: (a) $W_0 = \{(x, y, z) : x + 2y - z = 0\}$ in $\mathbb R^3$; (b) the symmetric matrices in $\mathbb R^{2 \times 2}$;
(c) $W_2 = \{p \in \mathbb P_2(\mathbb R) : p(1) = 0\}$.

:::solution
(a) $W_0$ is the kernel of $\begin{bmatrix} 1 & 2 & -1 \end{bmatrix}$. Directly: $(0, 0, 0)$ satisfies the equation, and if $\mathbf u, \mathbf v$ do, then
$(u_0 + v_0) + 2(u_1 + v_1) - (u_2 + v_2) = 0 + 0$ and $cv_0 + 2cv_1 - cv_2 = c \cdot 0$.

(b) $0^{\mathrm T} = 0$, and if $A^{\mathrm T} = A$ and $B^{\mathrm T} = B$, then $(A + B)^{\mathrm T} = A^{\mathrm T} + B^{\mathrm T} = A + B$ and $(cA)^{\mathrm T} = cA^{\mathrm T} = cA$.

(c) The zero polynomial vanishes at $1$. If $p(1) = q(1) = 0$, then $(p + q)(1) = p(1) + q(1) = 0$ and $(cp)(1) = c\,p(1) = 0$.
:::
::::

::::example[Four sets that are not subspaces]
Why does each fail? (a) $\{(x, y) : x + y = 1\}$; (b) $\{(x, y) : x \ge 0, \ y \ge 0\}$; (c) $\{(x, y) : xy = 0\}$; (d) the invertible matrices in $\mathbb R^{2 \times 2}$.

:::solution
(a) $(0, 0)$ is not in it. (d) The zero matrix is not invertible, so again the zero vector is missing.

(b) It contains the zero vector and is closed under addition, but not under scaling: $(1, 0)$ is in it and
$-1\,(1, 0) = (-1, 0)$ is not.

(c) It is the two axes. It is closed under scaling but not under addition: $(1, 0) + (0, 1) = (1, 1)$ has $xy = 1$.
:::
::::

```solution-map
id: singular-matrices-subspace
method: is-it-a-subspace
task: 'Is $W = \{A \in \mathbb R^{2 \times 2} : \det A = 0\}$ a subspace of $\mathbb R^{2 \times 2}$?'
steps:
  - node: zero
    answer: yes
    text: 'The zero matrix has determinant $0$, so it is in $W$.'
  - node: recognise
    answer: no
    text: 'The condition $\det A = 0$ is not a linear equation in the entries: $ad - bc = 0$ is quadratic.'
  - node: closure
    text: 'Scaling is fine, since $\det(cA) = c^2\det A = 0$. For sums there is no rule: $\det(A + B)$ is not $\det A + \det B$.'
  - node: closed
    answer: no
    text: 'A formula that does not split suggests looking for a counterexample.'
  - node: counterexample
    text: 'Take $A = \begin{bmatrix} 1 & 0 \\ 0 & 0 \end{bmatrix}$ and $B = \begin{bmatrix} 0 & 0 \\ 0 & 1 \end{bmatrix}$, both of determinant $0$. Then $A + B = I_2$ has determinant $1$.'
  - node: not-subspace
    text: '$W$ is not closed under addition, so it is not a subspace.'
```

:::caution[Containing zero is not enough]
Failing the zero test proves "not a subspace" at once, but passing it proves nothing: the sets in (b) and (c)
above both contain $\mathbf 0$. The zero test is a filter, not a proof.
:::

The sliders below build a set in the plane. A line $y = mx + k$ is a subspace of $\mathbb R^2$ exactly when it goes
through the origin; move $k$ away from $0$ and watch sums and multiples of points on the line leave it.

```sim
id: la-subspace-line
controls:
  - {id: m, label: "Slope m", min: -2, max: 2, step: 0.1, default: 0.5, decimals: 1}
  - {id: k, label: "Offset k", min: -2, max: 2, step: 0.1, default: 1, decimals: 1}
  - {id: s, label: "u at x = s", min: -3, max: 3, step: 0.1, default: 1, decimals: 1}
  - {id: t, label: "v at x = t", min: -3, max: 3, step: 0.1, default: 2, decimals: 1}
  - {id: c, label: "Scalar c", min: -2, max: 2, step: 0.1, default: 2, decimals: 1}
note: 'W is the line y = mx + k; u and v are two of its points. The green points are u + v and c·u: filled when they stay on W, hollow red when they leave it. With k = 0 they stay for every choice of the sliders. With k ≠ 0 the line misses the origin, and u + v lies on the line y = mx + 2k instead.'
```

### Subspaces already met

:::definition[Span]
Given vectors $\mathbf v_0, \mathbf v_1, \dots, \mathbf v_{n-1}$ of a vector space $V$, their **span** is the set of all their linear combinations:

$$
\mathrm{span}(\mathbf v_0, \mathbf v_1, \dots, \mathbf v_{n-1}) = \{c_0\mathbf v_0 + c_1\mathbf v_1 + \cdots + c_{n-1}\mathbf v_{n-1} : c_0, c_1, \dots, c_{n-1} \in \mathbb R\} .
$$
:::

::::theorem[Spans are subspaces]
For vectors $\mathbf v_0, \dots, \mathbf v_{n-1}$ of $V$, the span $U = \mathrm{span}(\mathbf v_0, \dots, \mathbf v_{n-1})$ is a subspace of $V$. Every subspace containing
those vectors contains their span, so it is the smallest subspace that contains them.

:::proof
1. $0\,\mathbf v_0 + 0\,\mathbf v_1 + \cdots + 0\,\mathbf v_{n-1} = \mathbf 0$, so $\mathbf 0 \in U$.
2. $(c_0\mathbf v_0 + \cdots + c_{n-1}\mathbf v_{n-1}) + (d_0\mathbf v_0 + \cdots + d_{n-1}\mathbf v_{n-1}) = (c_0 + d_0)\mathbf v_0 + \cdots + (c_{n-1} + d_{n-1})\mathbf v_{n-1}$ is again a linear
   combination, so it is in $U$.
3. $d\,(c_0\mathbf v_0 + \cdots + c_{n-1}\mathbf v_{n-1}) = (dc_0)\mathbf v_0 + \cdots + (dc_{n-1})\mathbf v_{n-1}$ is in $U$.

A subspace that contains the $\mathbf v_i$ is closed under sums and multiples, so it contains every combination of them.
:::
::::

:::theorem[Kernel, column space and row space are subspaces]
For an $m \times n$ matrix $A$: $\ker(A) = \{\mathbf v \in \mathbb R^n : A\mathbf v = \mathbf 0\}$ is a subspace of $\mathbb R^n$, $\mathrm{col}(A)$ is a subspace of $\mathbb R^m$, and
$\mathrm{row}(A)$ is a subspace of $\mathbb R^n$.
:::

The kernel contains $\mathbf 0$ and is closed under sums and multiples by the theorem of the unit on homogeneous
systems, and the other two are spans. For a linear transformation $T : \mathbb R^n \to \mathbb R^m$, the kernel
$\ker(T) = \{\mathbf v \in \mathbb R^n : T(\mathbf v) = \mathbf 0\}$ is $\ker(A)$ for the matrix $A$ of $T$ in the standard basis, so it is a subspace of $\mathbb R^n$.

::::theorem[The image of a linear transformation is a subspace]
For a linear transformation $T : \mathbb R^n \to \mathbb R^m$, the image $T(\mathbb R^n) = \{T(\mathbf x) : \mathbf x \in \mathbb R^n\}$ is a subspace of $\mathbb R^m$.

:::proof
1. $T(\mathbf 0) = T(0\,\mathbf v) = 0\,T(\mathbf v) = \mathbf 0$, so $\mathbf 0 \in T(\mathbb R^n)$.
2. If $\mathbf u = T(\mathbf x)$ and $\mathbf v = T(\mathbf y)$, then $\mathbf u + \mathbf v = T(\mathbf x) + T(\mathbf y) = T(\mathbf x + \mathbf y) \in T(\mathbb R^n)$.
3. If $\mathbf v = T(\mathbf x)$ and $c \in \mathbb R$, then $c\,\mathbf v = c\,T(\mathbf x) = T(c\,\mathbf x) \in T(\mathbb R^n)$.
:::
::::

Another proof: everything in the image is $A\mathbf x$, a linear combination of the columns of $A$, so the image is
$\mathrm{col}(A)$, a span. The proof above is worth knowing because it uses only linearity: the same three lines show
that the image of a linear map between any two vector spaces is a subspace of the codomain, and the same
holds for the kernel in the domain.

:::caution[Solutions of a non-homogeneous system]
The solution set of $A\mathbf x = \mathbf b$ with $\mathbf b \neq \mathbf 0$ is **not** a subspace, since $A\mathbf 0 = \mathbf 0 \neq \mathbf b$. It is a subspace shifted away
from the origin: one solution plus the kernel.
:::

::::theorem[Intersections of subspaces]
If $U$ and $W$ are subspaces of $V$, so is $U \cap W$. The union $U \cup W$ usually is not.

:::proof
$\mathbf 0$ is in both. If $\mathbf u, \mathbf v$ are in both, then $\mathbf u + \mathbf v$ and $c\,\mathbf v$ are in both. For the union, the two axes of
$\mathbb R^2$ were the failing example (c) above.
:::
::::

A subspace of $\mathbb R^n$ given by equations can be turned into a span by solving the system, and that is
how Sage handles it.

```python
A = matrix(QQ, [[1, 2, -1]])
W = A.right_kernel()                 # the subspace x + 2y - z = 0 of QQ^3
W.basis()                            # [(1, 0, 1), (0, 1, 2)]
W.dimension()                        # 2
vector(QQ, [3, -1, 1]) in W          # True: 3 - 2 - 1 = 0
vector(QQ, [1, 1, 1]) in W           # False
```

:::caution[kernel and right_kernel in Sage]
Sage's `A.kernel()` is the **left** kernel, the solutions of $\mathbf x A = \mathbf 0$. The kernel of this course, the
solutions of $A\mathbf x = \mathbf 0$, is `A.right_kernel()`.
:::

## Span and independence in a vector space

### The definitions carry over

The definitions from $\mathbb R^n$ use only sums and multiples, so they apply word for word. A **linear
combination** of $\mathbf v_0, \dots, \mathbf v_{k-1} \in V$ is any $c_0\mathbf v_0 + \cdots + c_{k-1}\mathbf v_{k-1}$, and their **span** is the set of all of them.

:::definition[Independence in a vector space]
A set of vectors $\{\mathbf v_0, \mathbf v_1, \dots, \mathbf v_{n-1}\}$ in a vector space $V$ is **linearly independent** if the only solution of

$$
c_0\mathbf v_0 + c_1\mathbf v_1 + \cdots + c_{n-1}\mathbf v_{n-1} = \mathbf 0
$$

is the trivial solution $c_0 = c_1 = \cdots = c_{n-1} = 0$. Otherwise the set is **linearly dependent**. An infinite set is
independent if each of its finite subsets is.
:::

The zero on the right is the zero **of $V$**: the zero polynomial, the zero matrix, the zero function. An
equation between polynomials means the coefficients agree, which gives a homogeneous system, and
the system is solved in the usual way. As in $\mathbb R^n$, dependent means that one of the vectors is a combination
of the others.

::::example[Independence of polynomials]
Are $p_0 = 1 + x$, $p_1 = x + x^2$ and $p_2 = 1 + 2x + x^2$ independent in $\mathbb P_2(\mathbb R)$? And $q_0 = 1 + x$, $q_1 = 1 - x$, $q_2 = x^2$?

:::solution
Set $c_0p_0 + c_1p_1 + c_2p_2 = 0$ and compare the coefficients of $1$, $x$ and $x^2$:

$$
c_0 + c_2 = 0, \qquad c_0 + c_1 + 2c_2 = 0, \qquad c_1 + c_2 = 0 .
$$

The coefficient matrix has the coefficient lists of $p_0, p_1, p_2$ as its columns, and its rank is $2$. There is a free
variable, so the set is dependent. Taking $c_2 = -1$ gives $c_0 = c_1 = 1$, that is, $p_2 = p_0 + p_1$.

For $q_0, q_1, q_2$ the matrix of coefficient lists has determinant $-2 \neq 0$, so only the zero solution exists and
the set is independent.
:::
::::

```python
P = column_matrix(QQ, [[1, 1, 0], [0, 1, 1], [1, 2, 1]])   # columns: coefficients of p0, p1, p2
P.rank()                                                   # 2: dependent
P.right_kernel().basis()                                   # [(1, 1, -1)]: p0 + p1 - p2 = 0
Q = column_matrix(QQ, [[1, 1, 0], [1, -1, 0], [0, 0, 1]])  # columns: coefficients of q0, q1, q2
det(Q)                                                     # -2: independent
```

::::example[Three polynomials of degree five]
Are $p_0 = 7x^5 - 4x^2 + 3$, $p_1 = 2x^5 + 5x^2$ and $p_2 = 8x^5 - 23x^2 + 6$ linearly independent in $\mathbb P_5(\mathbb R)$?

:::solution
Set $c_0p_0 + c_1p_1 + c_2p_2 = 0$, the zero polynomial, and compare coefficients. The powers $x^4$, $x^3$ and $x$ do not
occur, so three equations remain:

$$
x^5:\ 7c_0 + 2c_1 + 8c_2 = 0, \qquad x^2:\ -4c_0 + 5c_1 - 23c_2 = 0, \qquad 1:\ 3c_0 + 6c_2 = 0 .
$$

The last gives $c_0 = -2c_2$, then the first gives $c_1 = 3c_2$, and the second holds: $8c_2 + 15c_2 - 23c_2 = 0$. So
$(c_0, c_1, c_2) = t(-2, 3, 1)$ for every $t$: infinitely many solutions, and the polynomials are **dependent**. With $t = 1$,
$p_2 = 2p_0 - 3p_1$.
:::
::::

```python
R.<x> = QQ[]
p0, p1, p2 = 7*x^5 - 4*x^2 + 3, 2*x^5 + 5*x^2, 8*x^5 - 23*x^2 + 6
M = column_matrix(QQ, [p.padded_list(6) for p in (p0, p1, p2)])   # columns: coefficients of 1, x, ..., x^5
M.right_kernel().basis()                                          # [(1, -3/2, -1/2)]: a multiple of (-2, 3, 1)
p2 == 2*p0 - 3*p1                                                 # True
```

::::example[Independence of matrices]
Are $M_0 = \begin{bmatrix} 1 & 0 \\ 0 & 1 \end{bmatrix}$, $M_1 = \begin{bmatrix} 0 & 1 \\ 1 & 0 \end{bmatrix}$ and $M_2 = \begin{bmatrix} 1 & 1 \\ 0 & 0 \end{bmatrix}$ independent in $\mathbb R^{2 \times 2}$?

:::solution
Read each matrix as a list of four entries. Setting $c_0M_0 + c_1M_1 + c_2M_2 = 0$ gives, entry by entry,
$c_0 + c_2 = 0$, $c_1 + c_2 = 0$, $c_1 = 0$ and $c_0 = 0$. So $c_0 = c_1 = 0$, then $c_2 = 0$: independent.
:::
::::

::::example[Independence of functions]
Show that $\sin x$ and $\cos x$ are independent in $\mathcal F(\mathbb R)$, and that $1$, $\cos 2x$ and $\cos^2 x$ are dependent.

:::solution
Suppose $a \sin x + b \cos x = 0$ for **all** $x$. At $x = 0$ this gives $b = 0$, and at $x = \frac{\pi}{2}$ it gives $a = 0$.

For the second set, the identity $\cos 2x = 2\cos^2 x - 1$ says $1 \cdot 1 + 1 \cdot \cos 2x - 2 \cdot \cos^2 x = 0$ for all $x$, with
coefficients that are not all $0$.
:::
::::

:::caution[Functions: one point is not enough]
The equation must hold for every $x$. Plugging in a few values gives conditions that the coefficients must
satisfy. If they force all coefficients to be $0$, independence is proved; if they do not, nothing is proved
yet, and a dependence needs an identity valid for all $x$.
:::

:::insight
A vector space is defined by what can be done with its elements, not by what they are. Polynomials
and matrices are handled by writing down their coefficients and working in $\mathbb R^n$, and a subspace is a
subset that the operations cannot leave.
:::

:::equations
- *Subspace*: $\mathbf 0 \in U$; $\mathbf u, \mathbf v \in U \Rightarrow \mathbf u + \mathbf v \in U$; $\mathbf u \in U \Rightarrow c\,\mathbf u \in U$.
- *Axioms*: ten, with closure under $+$ and under scalars as axioms 1 and 2; additive identity $\mathbf 0$ (5), additive inverse $-\mathbf v$ (6).
- *Always subspaces*: spans; $\ker(A)$; $\mathrm{col}(A)$; $\mathrm{row}(A)$; the image $T(\mathbb R^n)$; intersections of subspaces.
- *Never subspaces*: anything without $\mathbf 0$, such as the solutions of $A\mathbf x = \mathbf b$ with $\mathbf b \neq \mathbf 0$.
- *Rules*: $0\,\mathbf v = \mathbf 0$, $c\,\mathbf 0 = \mathbf 0$, $(-1)\mathbf v = -\mathbf v$; $c\,\mathbf v = \mathbf 0 \Rightarrow c = 0$ or $\mathbf v = \mathbf 0$.
- *Independent*: $\sum_i c_i\mathbf v_i = \mathbf 0$ forces every $c_i = 0$, with $\mathbf 0$ the zero of $V$.
:::

## Further reading

- [3Blue1Brown — Abstract vector spaces](https://www.3blue1brown.com/lessons/abstract-vector-spaces) — functions as vectors, and why the axioms are a list of rules.
- [Vector space (Wikipedia)](https://en.wikipedia.org/wiki/Vector_space) — the definition and many more examples.
- [SageMath free modules](https://doc.sagemath.org/html/en/reference/modules/sage/modules/free_module.html) — `span`, `basis`, `dimension`, and membership with `in`.
