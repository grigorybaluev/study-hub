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
A **vector space** is a set $V$ with an addition $\mathbf u + \mathbf v \in V$ and a scalar multiplication $c\,\mathbf v \in V$
(for $\mathbf u, \mathbf v \in V$ and $c \in \mathbb R$) such that, for all $\mathbf u, \mathbf v, \mathbf w \in V$ and all $c, d \in \mathbb R$:

1. $\mathbf u + \mathbf v = \mathbf v + \mathbf u$;
2. $(\mathbf u + \mathbf v) + \mathbf w = \mathbf u + (\mathbf v + \mathbf w)$;
3. there is a **zero vector** $\mathbf 0 \in V$ with $\mathbf v + \mathbf 0 = \mathbf v$ for all $\mathbf v$;
4. each $\mathbf v$ has a **negative** $-\mathbf v \in V$ with $\mathbf v + (-\mathbf v) = \mathbf 0$;
5. $c(\mathbf u + \mathbf v) = c\,\mathbf u + c\,\mathbf v$;
6. $(c + d)\mathbf v = c\,\mathbf v + d\,\mathbf v$;
7. $c(d\,\mathbf v) = (cd)\mathbf v$;
8. $1\,\mathbf v = \mathbf v$.

The elements of $V$ are called **vectors**, whatever they are.
:::

The first sentence hides two requirements, **closure**: the sum and the scalar multiple must land
back in $V$.

### Examples

| Space | Vectors | Zero vector |
|---|---|---|
| $\mathbb R^n$ | $n$-tuples of reals | $(0, \dots, 0)$ |
| $\mathcal P_n$ | polynomials of degree at most $n$ | the zero polynomial |
| $\mathcal P$ | all polynomials | the zero polynomial |
| $\mathbb R^{m \times n}$ | $m \times n$ matrices | the zero matrix |
| $\mathcal F(\mathbb R)$ | all functions $\mathbb R \to \mathbb R$ | the function that is $0$ everywhere |

In $\mathcal F(\mathbb R)$ the operations are point by point: $(f + g)(x) = f(x) + g(x)$ and $(cf)(x) = c\,f(x)$.

::::example[A vector space with strange operations]
Let $V = (0, \infty)$ with $x \oplus y = xy$ and $c \odot x = x^c$. Show that $V$ is a vector space and find its zero vector.

:::solution
The sum and the power of positive numbers are positive, so $V$ is closed. Rules 1 and 2 are those of
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

(b) Rule 8 fails: $1 \odot (0, 1) = (0, 0) \neq (0, 1)$. One failing rule is enough.
:::
::::

### What follows from the rules

These look obvious in $\mathbb R^n$. The point is that they hold in every vector space, using only the rules.

::::theorem[Consequences of the axioms]
In a vector space $V$, for $\mathbf v \in V$ and $c \in \mathbb R$:

1. the zero vector is unique, and each vector has exactly one negative;
2. $0\,\mathbf v = \mathbf 0$ and $c\,\mathbf 0 = \mathbf 0$;
3. $(-1)\mathbf v = -\mathbf v$;
4. if $c\,\mathbf v = \mathbf 0$, then $c = 0$ or $\mathbf v = \mathbf 0$.

:::proof
1. If $\mathbf 0$ and $\mathbf 0'$ are both zero vectors, then $\mathbf 0 = \mathbf 0 + \mathbf 0' = \mathbf 0'$. If $\mathbf a$ and $\mathbf b$ are both negatives of $\mathbf v$,
   then $\mathbf a = \mathbf a + (\mathbf v + \mathbf b) = (\mathbf a + \mathbf v) + \mathbf b = \mathbf b$.
2. $0\,\mathbf v = (0 + 0)\mathbf v = 0\,\mathbf v + 0\,\mathbf v$; adding $-(0\,\mathbf v)$ to both sides gives $\mathbf 0 = 0\,\mathbf v$. In the same way
   $c\,\mathbf 0 = c(\mathbf 0 + \mathbf 0) = c\,\mathbf 0 + c\,\mathbf 0$ gives $c\,\mathbf 0 = \mathbf 0$.
3. $\mathbf v + (-1)\mathbf v = 1\,\mathbf v + (-1)\mathbf v = (1 - 1)\mathbf v = 0\,\mathbf v = \mathbf 0$, so $(-1)\mathbf v$ is the negative of $\mathbf v$.
4. If $c \neq 0$, then $\mathbf v = 1\,\mathbf v = \frac1c(c\,\mathbf v) = \frac1c\,\mathbf 0 = \mathbf 0$.
:::
::::

## Subspaces

### Definition and test

:::definition[Subspace]
A **subspace** of a vector space $V$ is a subset $W \subseteq V$ that is itself a vector space under the same
operations.
:::

Most of the rules are inherited: $\mathbf u + \mathbf v = \mathbf v + \mathbf u$ does not stop being true in a smaller set. What can
fail is that the operations leave $W$.

::::theorem[Subspace test]
A subset $W$ of a vector space $V$ is a subspace if and only if

1. $\mathbf 0 \in W$;
2. if $\mathbf u, \mathbf v \in W$, then $\mathbf u + \mathbf v \in W$;
3. if $\mathbf v \in W$ and $c \in \mathbb R$, then $c\,\mathbf v \in W$.

:::proof
($\Rightarrow$) A subspace is closed by definition, and its zero vector $\mathbf 0_W$ is the one of $V$: pick any $\mathbf w \in W$, then
$\mathbf 0_W = 0\,\mathbf w = \mathbf 0$ by the consequences of the axioms.

($\Leftarrow$) Rules 1, 2 and 5–8 hold in $W$ because they hold in $V$. Rule 3 is condition 1. Rule 4: for $\mathbf v \in W$,
the negative $-\mathbf v = (-1)\mathbf v$ is in $W$ by condition 3.
:::
::::

:::steps[Testing a subset]
1. Does $W$ contain the zero vector of $V$? If not, stop: it is not a subspace.
2. Is $W$ a span, or the solution set of a homogeneous system? Then it is a subspace (shown below).
3. Otherwise take arbitrary $\mathbf u, \mathbf v \in W$ and $c \in \mathbb R$, write what membership means, and check $\mathbf u + \mathbf v$ and $c\,\mathbf v$.
4. If a closure seems to fail, give specific vectors that leave $W$.
:::

::::example[Three subspaces]
Show that each is a subspace: (a) $W_0 = \{(x, y, z) : x + 2y - z = 0\}$ in $\mathbb R^3$; (b) the symmetric matrices in $\mathbb R^{2 \times 2}$;
(c) $W_2 = \{p \in \mathcal P_2 : p(1) = 0\}$.

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

:::theorem[Spans are subspaces]
For vectors $\mathbf v_0, \dots, \mathbf v_{k-1}$ in $V$, the span $\mathrm{span}\{\mathbf v_0, \dots, \mathbf v_{k-1}\}$ is a subspace of $V$, and every subspace containing
those vectors contains their span. It is the smallest subspace that contains them.
:::

:::proof
$\mathbf 0 = 0\,\mathbf v_0 + \cdots + 0\,\mathbf v_{k-1}$ is in the span. A sum of two combinations is a combination (add the coefficients),
and a multiple of a combination is a combination (scale the coefficients). A subspace containing the
$\mathbf v_i$ is closed under sums and multiples, so it contains every combination of them.
:::

:::theorem[Kernel, column space and row space are subspaces]
For an $m \times n$ matrix $A$: $\ker(A)$ is a subspace of $\mathbb R^n$, $\mathrm{col}(A)$ is a subspace of $\mathbb R^m$, and $\mathrm{row}(A)$ is a subspace of $\mathbb R^n$.
:::

The kernel is closed under sums and multiples by the earlier theorem, and the other two are spans.

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
Vectors $\mathbf v_0, \dots, \mathbf v_{k-1}$ of $V$ are **linearly independent** if

$$
c_0\mathbf v_0 + \cdots + c_{k-1}\mathbf v_{k-1} = \mathbf 0 \quad\text{only when}\quad c_0 = \cdots = c_{k-1} = 0 .
$$

Otherwise they are **linearly dependent**. An infinite set is independent if each of its finite subsets is.
:::

The zero on the right is the zero **of $V$**: the zero polynomial, the zero matrix, the zero function. An
equation between polynomials means the coefficients agree, which gives a homogeneous system, and
the system is solved in the usual way. As in $\mathbb R^n$, dependent means that one of the vectors is a combination
of the others.

::::example[Independence of polynomials]
Are $p_0 = 1 + x$, $p_1 = x + x^2$ and $p_2 = 1 + 2x + x^2$ independent in $\mathcal P_2$? And $q_0 = 1 + x$, $q_1 = 1 - x$, $q_2 = x^2$?

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
- *Subspace test*: $\mathbf 0 \in W$; $\mathbf u, \mathbf v \in W \Rightarrow \mathbf u + \mathbf v \in W$; $\mathbf v \in W \Rightarrow c\,\mathbf v \in W$.
- *Always subspaces*: spans; $\ker(A)$; $\mathrm{col}(A)$; $\mathrm{row}(A)$; intersections of subspaces.
- *Never subspaces*: anything without $\mathbf 0$, such as the solutions of $A\mathbf x = \mathbf b$ with $\mathbf b \neq \mathbf 0$.
- *Rules*: $0\,\mathbf v = \mathbf 0$, $c\,\mathbf 0 = \mathbf 0$, $(-1)\mathbf v = -\mathbf v$; $c\,\mathbf v = \mathbf 0 \Rightarrow c = 0$ or $\mathbf v = \mathbf 0$.
- *Independent*: $\sum_i c_i\mathbf v_i = \mathbf 0$ forces every $c_i = 0$, with $\mathbf 0$ the zero of $V$.
:::

## Further reading

- [3Blue1Brown — Abstract vector spaces](https://www.3blue1brown.com/lessons/abstract-vector-spaces) — functions as vectors, and why the axioms are a list of rules.
- [Vector space (Wikipedia)](https://en.wikipedia.org/wiki/Vector_space) — the definition and many more examples.
- [SageMath free modules](https://doc.sagemath.org/html/en/reference/modules/sage/modules/free_module.html) — `span`, `basis`, `dimension`, and membership with `in`.
