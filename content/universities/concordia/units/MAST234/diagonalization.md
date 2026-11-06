---
title: Diagonalizable matrices and dynamical systems
order: 12
status: detailed
weeks: [12]
introduces: [diagonalization]
requires:
  - {concept: eigenvalue, strength: hard}
  - {concept: basis-dimension, strength: hard}
  - {concept: linear-independence, strength: hard}
  - {concept: matrix-inverse, strength: hard}
  - {concept: linear-transformation, strength: hard}
  - {concept: complex-numbers, strength: soft}
  - {concept: computer-algebra-system, strength: soft}
reinforces:
  - {concept: eigenvalue, perspective: "a basis of eigenvectors as the condition for diagonalizability"}
---

A diagonal matrix is the easiest kind there is: it scales each coordinate by its own number, and its powers are
computed entry by entry. A matrix is **diagonalizable** when it is a diagonal matrix in disguise, that is, when
some basis makes it diagonal. The last unit found what that basis must be: a basis of eigenvectors. This unit says
exactly when one exists, what it buys (powers of a matrix in closed form), how it is done numerically, and
why it answers the central question about a **linear dynamical system**: where does $\mathbf x_{k+1} = A\mathbf x_k$ go in the long run?

Indices start at $0$, as in Sage.

## Diagonalizable matrices

### Definition

:::definition[Diagonalizable matrix]
An $n \times n$ matrix $A$ is **diagonalizable** if $A = PDP^{-1}$ for some invertible matrix $P$ and diagonal matrix $D$; that is, if $A$ is
similar to a diagonal matrix.
:::

::::theorem[Diagonalization theorem]
An $n \times n$ matrix $A$ is diagonalizable if and only if it has $n$ linearly independent eigenvectors. In that case $A = PDP^{-1}$, where the columns of
$P$ are the eigenvectors, and the entries of $D$ are the eigenvalues, **in the same order**.

:::proof
Let $P = [\,\mathbf p_0 \ \cdots \ \mathbf p_{n-1}\,]$ and $D = \mathrm{diag}(\lambda_0, \dots, \lambda_{n-1})$. Compare the two products column by column:

$$
AP = [\,A\mathbf p_0 \ \cdots \ A\mathbf p_{n-1}\,] , \qquad PD = [\,\lambda_0\mathbf p_0 \ \cdots \ \lambda_{n-1}\mathbf p_{n-1}\,] .
$$

So $AP = PD$ says exactly that $A\mathbf p_j = \lambda_j\mathbf p_j$ for every $j$. $P$ is invertible exactly when its columns are independent, and then
$AP = PD$ is the same as $A = PDP^{-1}$. If $A = PDP^{-1}$, the columns of $P$ are therefore independent eigenvectors, none of them zero. If $A$ has $n$ independent
eigenvectors, placing them in $P$ gives $A = PDP^{-1}$.
:::
::::

In the language of the operators unit: $P$ is the transition matrix from the eigenvector basis to the standard basis, and $D$ is the matrix of $\mathbf v \mapsto A\mathbf v$
relative to the eigenvector basis, where each basis vector is only scaled.

::::example[Diagonalizing a 2 × 2 matrix]
Diagonalize $A = \begin{bmatrix} 4 & 1 \\ 2 & 3 \end{bmatrix}$.

:::solution
From the last unit, the eigenvalues are $5$ and $2$, with eigenvectors $(1, 1)$ and $(1, -2)$. So

$$
P = \begin{bmatrix} 1 & 1 \\ 1 & -2 \end{bmatrix} , \qquad D = \begin{bmatrix} 5 & 0 \\ 0 & 2 \end{bmatrix} , \qquad P^{-1} = \frac13\begin{bmatrix} 2 & 1 \\ 1 & -1 \end{bmatrix} .
$$

Check $AP = PD$: both are $\begin{bmatrix} 5 & 2 \\ 5 & -4 \end{bmatrix}$.
:::
::::

```python
A = matrix(QQ, [[4, 1], [2, 3]])
D, P = A.eigenmatrix_right()
D                                       # [5 0; 0 2]
P                                       # [1 1; 1 -2]
P * D * P.inverse() == A                # True
A.is_diagonalizable()                   # True
```

:::caution[Keep the columns in order]
Column $j$ of $P$ must be an eigenvector for entry $j$ of $D$. Swapping two eigenvalues in $D$ without swapping the columns of $P$ gives a wrong factorization.
$P$ and $D$ are not unique: the order is free, and each eigenvector can be scaled. Only the pairing matters.
:::

## When is a matrix diagonalizable?

### Distinct eigenvalues

::::theorem[Eigenvectors for distinct eigenvalues are independent]
If $\mathbf v_0, \dots, \mathbf v_{k-1}$ are eigenvectors of $A$ with distinct eigenvalues $\lambda_0, \dots, \lambda_{k-1}$, then they are linearly independent.

:::proof
Suppose not, and let $m$ be the smallest number such that $\mathbf v_0, \dots, \mathbf v_m$ are dependent. Then $\mathbf v_0, \dots, \mathbf v_{m-1}$ are independent (for $m = 1$, a single nonzero vector) and

$$
\mathbf v_m = c_0\mathbf v_0 + \cdots + c_{m-1}\mathbf v_{m-1} .
$$

Applying $A$ gives $\lambda_m\mathbf v_m = \sum_i c_i\lambda_i\mathbf v_i$, and multiplying the first equation by $\lambda_m$ gives $\lambda_m\mathbf v_m = \sum_i c_i\lambda_m\mathbf v_i$. Subtracting,

$$
\mathbf 0 = \sum_{i=0}^{m-1} c_i(\lambda_i - \lambda_m)\mathbf v_i .
$$

By independence, $c_i(\lambda_i - \lambda_m) = 0$, and since the eigenvalues are distinct, every $c_i = 0$. Then $\mathbf v_m = \mathbf 0$, which an eigenvector is not.
:::
::::

:::corollary[Distinct eigenvalues suffice]
An $n \times n$ matrix with $n$ distinct eigenvalues is diagonalizable.
:::

### Repeated eigenvalues

Distinct eigenvalues are sufficient, not necessary: $I_2$ has a repeated eigenvalue and is already diagonal. With a repeated eigenvalue, the question is
whether its eigenspace is large enough.

::::theorem[Diagonalizable when the multiplicities agree]
A real or complex $n \times n$ matrix whose characteristic polynomial factors completely is diagonalizable if and only if, for every eigenvalue, the geometric multiplicity equals the algebraic multiplicity.

:::proof
Let the distinct eigenvalues have geometric multiplicities $g_j$ and algebraic multiplicities $a_j$, so $g_j \le a_j$ and $\sum_j a_j = n$. Join bases of all the eigenspaces. This joined set is
independent: in a relation, group the terms by eigenspace into $\mathbf w_0 + \cdots + \mathbf w_{s-1} = \mathbf 0$. Any nonzero $\mathbf w_j$ would be an eigenvector, and those are independent by the last theorem, so
every $\mathbf w_j = \mathbf 0$, and then all coefficients vanish within each eigenspace basis. So there are $n$ independent eigenvectors exactly when $\sum_j g_j = n$, that is, exactly when every $g_j = a_j$.
:::
::::

:::steps[Diagonalizing a matrix]
1. Find the eigenvalues and their algebraic multiplicities from $p_A(\lambda)$.
2. For each eigenvalue, find a basis of $E_\lambda = \ker(A - \lambda I_n)$.
3. If some $\dim E_\lambda$ is smaller than the algebraic multiplicity, stop: $A$ is not diagonalizable.
4. Otherwise put all the basis vectors in the columns of $P$, and the matching eigenvalues in $D$.
5. Check: $AP = PD$.
:::

```solution-map
id: diagonalize-repeated-eigenvalue
method: diagonalizable
task: 'Is $A = \begin{bmatrix} 4 & 0 & 1 \\ 2 & 3 & 2 \\ 1 & 0 & 4 \end{bmatrix}$ diagonalizable?'
steps:
  - node: polynomial
    text: 'Expanding along column $1$: $p_A(\lambda) = (\lambda - 3)\bigl((\lambda - 4)^2 - 1\bigr) = (\lambda - 3)^2(\lambda - 5)$. The eigenvalue $3$ has multiplicity $2$, and $5$ has multiplicity $1$.'
  - node: real
    answer: yes
    text: 'All the eigenvalues are real.'
  - node: distinct
    answer: no
    text: 'Only two distinct eigenvalues for a $3 \times 3$ matrix, so the shortcut does not apply.'
  - node: eigenspaces
    text: '$A - 3I_3 = \begin{bmatrix} 1 & 0 & 1 \\ 2 & 0 & 2 \\ 1 & 0 & 1 \end{bmatrix}$ has rank $1$, so $\dim E_3 = 3 - 1 = 2$, with basis $(1, 0, -1)$, $(0, 1, 0)$.'
  - node: enough
    answer: yes
    text: 'The geometric multiplicity of $3$ is $2$, equal to the algebraic one. For $\lambda = 5$ both are $1$.'
  - node: diagonalize
    text: '$E_5$ is spanned by $(1, 2, 1)$. Take $P = \begin{bmatrix} 1 & 0 & 1 \\ 0 & 1 & 2 \\ -1 & 0 & 1 \end{bmatrix}$ and $D = \mathrm{diag}(3, 3, 5)$.'
  - node: yes-diag
    text: 'Three independent eigenvectors: $A = PDP^{-1}$.'
```

::::example[Two matrices that cannot be diagonalized]
Show that $J = \begin{bmatrix} 3 & 1 \\ 0 & 3 \end{bmatrix}$ and $K = \begin{bmatrix} 2 & 1 & 0 \\ 0 & 2 & 0 \\ 0 & 0 & 3 \end{bmatrix}$ are not diagonalizable.

:::solution
$J$ has the single eigenvalue $3$ of algebraic multiplicity $2$, and $\dim E_3 = 1$. There are not two independent eigenvectors.

$K$ is triangular, with eigenvalues $2, 2, 3$. $K - 2I_3$ has rank $2$, so $\dim E_2 = 1 < 2$.

For $J$ there is also a one-line argument: if $J = PDP^{-1}$, the diagonal of $D$ would be $3, 3$, so $D = 3I_2$, and then $J = P(3I_2)P^{-1} = 3I_2$, which it is not.
:::
::::

```python
J = matrix(QQ, [[3, 1], [0, 3]])
J.is_diagonalizable()                   # False
K = matrix(QQ, [[2, 1, 0], [0, 2, 0], [0, 0, 3]])
(K - 2*identity_matrix(3)).right_kernel().dimension()    # 1
```

:::caution[eigenmatrix_right does not refuse]
For a matrix that is not diagonalizable, `eigenmatrix_right()` still returns a pair, with a zero column in `P`. `J.eigenmatrix_right()` gives $P = \begin{bmatrix} 1 & 0 \\ 0 & 0 \end{bmatrix}$, which is not
invertible. Check `P.is_invertible()` or the multiplicities before you use the result.
:::

### Real and complex

A real matrix can fail over $\mathbb R$ for a second reason: it may not have enough real eigenvalues. The matrix $\begin{bmatrix} 1 & -2 \\ 1 & 3 \end{bmatrix}$ has the eigenvalues $2 \pm i$. It has no real eigenvectors, so it
is not diagonalizable over $\mathbb R$, but its two eigenvalues are distinct, so it is diagonalizable over $\mathbb C$, with a complex $P$ and $D$.

:::caution[is_diagonalizable looks only at the base field]
Over `QQ`, Sage answers a narrower question: are there enough eigenvectors with **rational** entries? `matrix(QQ, [[2, 1], [1, 1]]).is_diagonalizable()` returns `False`, although the eigenvalues
$\frac{3 \pm \sqrt5}{2}$ are real and distinct. For the honest answer over $\mathbb C$, change the ring first.
:::

```python
B = matrix(QQ, [[2, 1], [1, 1]])
B.is_diagonalizable()                           # False: no rational eigenvalues
B.change_ring(QQbar).is_diagonalizable()        # True
C = matrix(QQ, [[1, -2], [1, 3]])
C.change_ring(QQbar).is_diagonalizable()        # True: over C, with eigenvalues 2 - I and 2 + I
```

### Diagonalizable operators

:::definition[Diagonalizable operator]
A linear operator $T : V \to V$ on a finite-dimensional space is **diagonalizable** if $V$ has a basis of eigenvectors of $T$. Relative to such a basis, $[T]_{\mathcal B}$ is diagonal.
:::

Equivalently, $[T]_{\mathcal C}$ is a diagonalizable matrix for one basis $\mathcal C$, and then for every basis.

::::example[The transpose, in a basis of eigenvectors]
Diagonalize $T(M) = M^{\mathrm T}$ on $\mathbb R^{2 \times 2}$, and show that differentiation on $\mathcal P_2$ is not diagonalizable.

:::solution
The eigenspaces of $T$ are the symmetric matrices (dimension $3$) and the skew-symmetric matrices (dimension $1$). Together they give the basis

$$
\mathcal B = \left( \begin{bmatrix} 1 & 0 \\ 0 & 0 \end{bmatrix}, \begin{bmatrix} 0 & 0 \\ 0 & 1 \end{bmatrix}, \begin{bmatrix} 0 & 1 \\ 1 & 0 \end{bmatrix}, \begin{bmatrix} 0 & 1 \\ -1 & 0 \end{bmatrix} \right) , \qquad [T]_{\mathcal B} = \mathrm{diag}(1, 1, 1, -1) .
$$

$D$ on $\mathcal P_2$ has the single eigenvalue $0$ of algebraic multiplicity $3$, with $\dim E_0 = 1$. So it is not diagonalizable.
:::
::::

## Powers of a matrix

### The formula

If $A = PDP^{-1}$, the inner factors cancel in a product: $A^2 = PDP^{-1}PDP^{-1} = PD^2P^{-1}$, and in general

$$
A^k = P\,D^k\,P^{-1} , \qquad D^k = \mathrm{diag}(\lambda_0^k, \dots, \lambda_{n-1}^k) .
$$

This gives every power in closed form, for the cost of one diagonalization.

::::example[A formula for every power]
Find $A^k$ for $A = \begin{bmatrix} 4 & 1 \\ 2 & 3 \end{bmatrix}$.

:::solution
$$
A^k = \begin{bmatrix} 1 & 1 \\ 1 & -2 \end{bmatrix}\begin{bmatrix} 5^k & 0 \\ 0 & 2^k \end{bmatrix}\frac13\begin{bmatrix} 2 & 1 \\ 1 & -1 \end{bmatrix} = \frac13\begin{bmatrix} 2\cdot 5^k + 2^k & 5^k - 2^k \\ 2\cdot 5^k - 2\cdot 2^k & 5^k + 2\cdot 2^k \end{bmatrix} .
$$

For $k = 1$ this gives $\frac13\begin{bmatrix} 12 & 3 \\ 6 & 9 \end{bmatrix} = A$, and for $k = 2$ it gives $\begin{bmatrix} 18 & 7 \\ 14 & 11 \end{bmatrix} = A^2$.
:::
::::

```python
k = var('k')
A = matrix(QQ, [[4, 1], [2, 3]])
D, P = A.eigenmatrix_right()
Dk = diagonal_matrix(SR, [5^k, 2^k])
Ak = P * Dk * P.inverse()
Ak.subs(k == 2)                         # [18 7; 14 11]
A^2                                     # [18 7; 14 11]
```

## Numerical diagonalization

### Floating point

Exact fields are fine for small matrices with small entries. For measured data, or for large matrices, everything is done in floating point, and Sage's ring for this is `RDF`.

```python
A = matrix(RDF, [[4, 1], [2, 3]])
A.eigenvalues()                         # [5.0, 2.0]
D, P = A.eigenmatrix_right()
P                                       # columns are unit vectors: (0.7071, 0.7071) and (-0.4472, 0.8944)
```

Two things change. Eigenvectors are normalized to length $1$, so they look different from the exact ones, though they span the same lines. And equalities hold only approximately: a value
printed as `1e-16` means $0$.

:::caution[Repeated eigenvalues are fragile]
Changing an entry of $\begin{bmatrix} 3 & 1 \\ 0 & 3 \end{bmatrix}$ from $0$ to $10^{-10}$ moves the eigenvalues from $3, 3$ to $3 \pm 10^{-5}$: a change $100\,000$ times larger than the one made, and the perturbed matrix is diagonalizable.
In floating point, "is it diagonalizable?" cannot be answered reliably when eigenvalues nearly coincide.
:::

Numerical software does not compute the characteristic polynomial, whose roots are very sensitive to rounding. It uses iterations on the matrix itself. The simplest of them shows the idea.

### The power method

Multiplying a vector by $A$ again and again strengthens the component along the eigenvector whose eigenvalue is largest in absolute value.

:::steps[The power method]
1. Start with a vector $\mathbf x$ that has a component along the dominant eigenvector (a random vector almost surely has).
2. Replace $\mathbf x$ by $A\mathbf x$, divided by its length so that it does not overflow.
3. Estimate the eigenvalue by the **Rayleigh quotient** $\dfrac{\mathbf x \cdot A\mathbf x}{\mathbf x \cdot \mathbf x}$.
4. Repeat until the estimate settles.
:::

It converges when one eigenvalue is strictly largest in absolute value, and the error shrinks like $|\lambda_1/\lambda_0|^k$, where $\lambda_1$ is the next largest. For the matrix above that ratio is $\frac25$.

```python
A = matrix(RDF, [[4, 1], [2, 3]])
x = vector(RDF, [1, 0])
for k in range(30):
    y = A * x
    x = y / y.norm()
x                                       # (0.7071..., 0.7071...), the direction of (1, 1)
x.dot_product(A * x) / x.dot_product(x)  # 5.0 up to rounding
```

## Linear dynamical systems

### From powers to behaviour

:::definition[Linear dynamical system]
A **linear (discrete) dynamical system** is a sequence of states $\mathbf x_0, \mathbf x_1, \mathbf x_2, \dots$ in $\mathbb R^n$ with $\mathbf x_{k+1} = A\mathbf x_k$ for a fixed $n \times n$ matrix $A$. So $\mathbf x_k = A^k\mathbf x_0$.
:::

Suppose $A$ is diagonalizable, with eigenvectors $\mathbf v_i$ and eigenvalues $\lambda_i$. Write the start in the eigenvector basis, $\mathbf x_0 = c_0\mathbf v_0 + \cdots + c_{n-1}\mathbf v_{n-1}$. Each term evolves on its own:

$$
\mathbf x_k = c_0\lambda_0^k\,\mathbf v_0 + c_1\lambda_1^k\,\mathbf v_1 + \cdots + c_{n-1}\lambda_{n-1}^k\,\mathbf v_{n-1} .
$$

The coefficient vector is $\mathbf c = P^{-1}\mathbf x_0$. The size of each $|\lambda_i|$ decides the fate of its term: it dies if $|\lambda_i| < 1$, stays if $|\lambda_i| = 1$ and grows if $|\lambda_i| > 1$.

:::theorem[Long-term behaviour]
Let $A$ be diagonalizable.

1. If every $|\lambda_i| < 1$, then $\mathbf x_k \to \mathbf 0$ from every start.
2. If $|\lambda_0| > |\lambda_i|$ for all $i \neq 0$ and $c_0 \neq 0$, then for large $k$, $\mathbf x_k \approx c_0\lambda_0^k\,\mathbf v_0$: the state lines up with $\mathbf v_0$ and grows or shrinks by the factor $\lambda_0$ at each step.
3. If $\lambda_0 = 1$ and all the other $|\lambda_i| < 1$, then $\mathbf x_k \to c_0\mathbf v_0$, a steady state.
:::

::::example[Migration between two cities]
Each year, $10\,\%$ of the people in city $U$ move to city $W$, and $20\,\%$ of those in $W$ move to $U$. In units of a hundred people, the start is $(3, 9)$. Find the populations after $k$ years, and in the long run.

:::solution
$$
\mathbf x_{k+1} = A\mathbf x_k , \qquad A = \begin{bmatrix} 0.9 & 0.2 \\ 0.1 & 0.8 \end{bmatrix} .
$$

$\mathrm{tr}(A) = 1.7$ and $\det(A) = 0.7$, so $p_A(\lambda) = \lambda^2 - 1.7\lambda + 0.7 = (\lambda - 1)(\lambda - 0.7)$. Eigenvectors: $(2, 1)$ for $\lambda = 1$ and $(1, -1)$ for $\lambda = 0.7$.

Solving $c_0(2, 1) + c_1(1, -1) = (3, 9)$ gives $c_0 = 4$ and $c_1 = -5$. So

$$
\mathbf x_k = 4\,(2, 1) - 5\,(0.7)^k\,(1, -1) \longrightarrow (8, 4) .
$$

The second term dies, and the populations settle at $800$ and $400$. The total, $12$ hundred, never changes: the columns of $A$ add to $1$.
:::
::::

```python
A = matrix(QQ, [[9/10, 2/10], [1/10, 8/10]])
A.eigenvectors_right()                  # [(1, [(1, 1/2)], 1), (7/10, [(1, -1)], 1)]
x0 = vector(QQ, [3, 9])
P = column_matrix(QQ, [[2, 1], [1, -1]])
P.solve_right(x0)                       # (4, -5)
(A^50 * x0).n(digits=6)                 # (8.00000, 4.00000)
```

::::example[A population in two stages]
A population has juveniles and adults. Each adult produces $3$ juveniles per period, half of the juveniles become adults, and half of the adults survive. Find the long-term growth rate and the age structure.

:::solution
With $\mathbf x_k = (\text{juveniles}, \text{adults})$,

$$
A = \begin{bmatrix} 0 & 3 \\ 0.5 & 0.5 \end{bmatrix} , \qquad p_A(\lambda) = \lambda^2 - 0.5\lambda - 1.5 = (\lambda - 1.5)(\lambda + 1) .
$$

The dominant eigenvalue is $1.5$, with eigenvector $(2, 1)$. The other is $-1$, with eigenvector $(3, -1)$. Here $|{-1}| < 1.5$, so the second term becomes negligible next to the first, although it does not die: the
population grows by $50\,\%$ per period, with two juveniles per adult.
:::
::::

::::example[Fibonacci numbers]
Find a formula for $F_k$, where $F_0 = 0$, $F_1 = 1$, $F_{k+1} = F_k + F_{k-1}$.

:::solution
Let $\mathbf x_k = (F_{k+1}, F_k)$. Then $\mathbf x_{k+1} = A\mathbf x_k$ with $A = \begin{bmatrix} 1 & 1 \\ 1 & 0 \end{bmatrix}$ and $\mathbf x_0 = (1, 0)$. Here $p_A(\lambda) = \lambda^2 - \lambda - 1$, with roots $\varphi = \frac{1 + \sqrt5}{2}$ and $\psi = \frac{1 - \sqrt5}{2}$, and the eigenvectors are $(\varphi, 1)$ and $(\psi, 1)$.

Solving $c_0(\varphi, 1) + c_1(\psi, 1) = (1, 0)$ gives $c_0 = \frac{1}{\sqrt5}$ and $c_1 = -\frac{1}{\sqrt5}$, and the second entry of $\mathbf x_k$ is

$$
F_k = \frac{\varphi^k - \psi^k}{\sqrt5} .
$$

Since $|\psi| < 1$, the term $\psi^k$ dies, and consecutive Fibonacci numbers grow by the factor $\varphi \approx 1.618$.
:::
::::

```python
A = matrix(QQ, [[1, 1], [1, 0]])
A^10                                    # [89 55; 55 34]: F_11, F_10; F_10, F_9
phi, psi = (1 + sqrt(5))/2, (1 - sqrt(5))/2
((phi^10 - psi^10) / sqrt(5)).expand()  # 55
```

The sliders below fix two eigendirections, $(2, 1)$ and $(1, -1)$, and let you choose their eigenvalues. Each dot is one step of $\mathbf x_{k+1} = A\mathbf x_k$. Watch how the size of each eigenvalue decides the path.

```sim
id: la-dynamics
controls:
  - {id: l0, label: "λ₀, along (2, 1)", min: -1.4, max: 1.4, step: 0.05, default: 1, decimals: 2}
  - {id: l1, label: "λ₁, along (1, −1)", min: -1.4, max: 1.4, step: 0.05, default: 0.7, decimals: 2}
  - {id: x0, label: "Start, first entry", min: -10, max: 10, step: 0.5, default: 3, decimals: 1}
  - {id: y0, label: "Start, second entry", min: -10, max: 10, step: 0.5, default: 9, decimals: 1}
  - {id: k, label: "Steps k", min: 0, max: 30, step: 1, default: 10, decimals: 0}
note: 'The defaults are the migration example: the dots slide along the direction (1, −1) to the steady state (8, 4) on the line through (2, 1). Make both |λ| below 1 and every path falls into the origin. Make one |λ| above 1 and the path leaves the frame along its eigenline. A negative eigenvalue makes the path jump from side to side of the other eigenline. Starting exactly on an eigenline keeps the state on it for ever.'
```

:::insight
In the eigenvector basis, a diagonalizable matrix is $n$ independent one-dimensional problems: each coordinate is multiplied by its own number. Powers, long-term behaviour and stability can all be read from those $n$ numbers.
:::

:::equations
- *Diagonalization*: $A = PDP^{-1}$; columns of $P$ are eigenvectors, $D$ has the matching eigenvalues; $AP = PD$.
- *Condition*: $n$ independent eigenvectors. With all the eigenvalues in the field, $n$ distinct ones are enough, and in general geometric $=$ algebraic multiplicity for each eigenvalue.
- *Powers*: $A^k = PD^kP^{-1}$.
- *Dynamics*: $\mathbf x_k = A^k\mathbf x_0 = \sum_i c_i\lambda_i^k\mathbf v_i$, with $\mathbf c = P^{-1}\mathbf x_0$.
- *Long term*: all $|\lambda_i| < 1$ gives $\mathbf x_k \to \mathbf 0$; a dominant $\lambda_0$ gives $\mathbf x_k \approx c_0\lambda_0^k\mathbf v_0$.
- *Power method*: $\mathbf x \leftarrow A\mathbf x / \lVert A\mathbf x \rVert$; Rayleigh quotient $\frac{\mathbf x \cdot A\mathbf x}{\mathbf x \cdot \mathbf x}$.
:::

## Further reading

- [Diagonalizable matrix (Wikipedia)](https://en.wikipedia.org/wiki/Diagonalizable_matrix) — the conditions and the applications.
- [Power iteration (Wikipedia)](https://en.wikipedia.org/wiki/Power_iteration) — the method, with a proof of convergence.
- [SageMath matrix methods](https://doc.sagemath.org/html/en/reference/matrices/sage/matrix/matrix2.html) — `eigenmatrix_right`, `is_diagonalizable`, `diagonalization`.
