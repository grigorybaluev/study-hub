---
title: Eigenvalues and eigenvectors
order: 11
status: detailed
weeks: [11]
introduces:
  - {concept: eigenvalue, perspective: "characteristic polynomial, eigenspaces, eigenvectors of matrices and of linear operators"}
requires:
  - {concept: determinant, strength: hard}
  - {concept: linear-transformation, strength: hard}
  - {concept: linear-independence, strength: hard}
  - {concept: vector-space, strength: hard}
  - {concept: matrix-inverse, strength: soft}
  - {concept: complex-numbers, strength: hard}
  - {concept: computer-algebra-system, strength: soft}
reinforces: []
---

A matrix usually turns a vector to a new direction. But most matrices have a few special directions that they do
not turn: a vector along such a direction comes out as a multiple of itself. These are the **eigenvectors**, and
the multiples are the **eigenvalues**. Along these directions, a matrix is as simple as a number. This unit finds them
through the **characteristic polynomial**, collects them into **eigenspaces**, meets the complex eigenvalues
that the last unit prepared for, and carries everything over to linear operators on any vector space.

Indices start at $0$, as in Sage.

## Vectors that are only scaled

### Definition

:::definition[Eigenvalue and eigenvector]
Let $A$ be an $n \times n$ matrix. A **nonzero** vector $\mathbf v$ is an **eigenvector** of $A$ if

$$
A\mathbf v = \lambda\,\mathbf v
$$

for some scalar $\lambda$, and this $\lambda$ is the **eigenvalue** of $\mathbf v$.
:::

The zero vector is excluded because $A\mathbf 0 = \lambda\mathbf 0$ holds for every $\lambda$ and says nothing. The scalar $\lambda = 0$ is allowed: it
means $A\mathbf v = \mathbf 0$ with $\mathbf v \neq \mathbf 0$.

::::example[Checking an eigenvector]
Let $A = \begin{bmatrix} 4 & 1 \\ 2 & 3 \end{bmatrix}$. Are $\mathbf u = (1, 1)$, $\mathbf v = (1, -2)$ and $\mathbf w = (1, 0)$ eigenvectors?

:::solution
$A\mathbf u = (5, 5) = 5\,\mathbf u$: yes, with eigenvalue $5$. $A\mathbf v = (2, -4) = 2\,\mathbf v$: yes, with eigenvalue $2$.

$A\mathbf w = (4, 2)$ is not a multiple of $(1, 0)$: no.
:::
::::

Checking is one product. Note that any nonzero multiple of an eigenvector is an eigenvector for the same eigenvalue: $A(c\,\mathbf v) = c\,A\mathbf v = \lambda(c\,\mathbf v)$.
What is special is the line through $\mathbf v$, and the map stretches that line by $\lambda$.

### Seeing them in the plane

| Map | Eigenvalues | Eigenvectors |
|---|---|---|
| scaling by $k$ | $k$ | every nonzero vector |
| projection onto the $x$-axis | $1$ and $0$ | the $x$-axis; the $y$-axis |
| reflection in the line $y = x$ | $1$ and $-1$ | along $(1, 1)$; along $(1, -1)$ |
| shear $\begin{bmatrix} 1 & k \\ 0 & 1 \end{bmatrix}$, $k \neq 0$ | $1$ | only the $x$-axis |
| rotation by $t$, $t$ not a multiple of $\pi$ | none that are real | none that are real |

In the sliders below, $\mathbf v$ runs around the unit circle while $A\mathbf v$ runs around an ellipse. At most angles the two arrows point
in different directions. Eigenvectors are the angles where they line up.

```sim
id: la-eigen-directions
controls:
  - {id: a, label: "a (top left)", min: -3, max: 4, step: 0.1, default: 4, decimals: 1}
  - {id: b, label: "b (top right)", min: -3, max: 3, step: 0.1, default: 1, decimals: 1}
  - {id: c, label: "c (bottom left)", min: -3, max: 3, step: 0.1, default: 2, decimals: 1}
  - {id: d, label: "d (bottom right)", min: -3, max: 4, step: 0.1, default: 3, decimals: 1}
  - {id: th, label: "Angle of v (degrees)", min: 0, max: 360, step: 1, default: 20, decimals: 0}
note: 'A = [a b; c d]. Blue: a unit vector v at the chosen angle. Gold: Av. The defaults are the example above. Turn the angle until v and Av lie on one dashed line: at 45° the arrows agree with λ = 5, and at about −63° (297°) with λ = 2. A negative eigenvalue shows as Av pointing the opposite way. Set b = −1 and c = 1 with a = d = 0, a rotation: no dashed lines remain, and Av is never along v.'
```

## The characteristic polynomial

### From eigenvectors to a determinant

The equation $A\mathbf v = \lambda\mathbf v$ has two unknowns, $\lambda$ and $\mathbf v$. To remove $\mathbf v$, rewrite it as a homogeneous system:

$$
A\mathbf v = \lambda\mathbf v \iff (A - \lambda I_n)\mathbf v = \mathbf 0 .
$$

A nonzero solution exists exactly when $A - \lambda I_n$ is not invertible, and that is a condition on $\lambda$ alone:

$$
\lambda \text{ is an eigenvalue of } A \iff \det(A - \lambda I_n) = 0 .
$$

:::definition[Characteristic polynomial]
The **characteristic polynomial** of an $n \times n$ matrix $A$ is $p_A(\lambda) = \det(\lambda I_n - A)$. It has degree $n$ and leading coefficient $1$, and its
roots are the eigenvalues of $A$.
:::

The equation $\det(A - \lambda I_n) = 0$ has the same roots, since the two determinants differ at most by a sign $(-1)^n$. Sage uses
$\det(\lambda I_n - A)$.

:::steps[Finding eigenvalues and eigenvectors]
1. Compute $p_A(\lambda)$, and solve $p_A(\lambda) = 0$: these are the eigenvalues.
2. For each eigenvalue $\lambda$, row reduce $A - \lambda I_n$.
3. Solve $(A - \lambda I_n)\mathbf v = \mathbf 0$ with free parameters. The nonzero solutions are the eigenvectors.
4. Check one: $A\mathbf v$ must equal $\lambda\mathbf v$.
:::

For a $2 \times 2$ matrix the polynomial needs no determinant: $p_A(\lambda) = \lambda^2 - \mathrm{tr}(A)\,\lambda + \det(A)$.

::::example[A 2 × 2 matrix]
Find the eigenvalues and eigenvectors of $A = \begin{bmatrix} 4 & 1 \\ 2 & 3 \end{bmatrix}$.

:::solution
$\mathrm{tr}(A) = 7$ and $\det(A) = 10$, so $p_A(\lambda) = \lambda^2 - 7\lambda + 10 = (\lambda - 5)(\lambda - 2)$.

For $\lambda = 5$: $A - 5I = \begin{bmatrix} -1 & 1 \\ 2 & -2 \end{bmatrix} \sim \begin{bmatrix} 1 & -1 \\ 0 & 0 \end{bmatrix}$, so $x_0 = x_1$ and the eigenvectors are $t\,(1, 1)$, $t \neq 0$.

For $\lambda = 2$: $A - 2I = \begin{bmatrix} 2 & 1 \\ 2 & 1 \end{bmatrix} \sim \begin{bmatrix} 1 & \tfrac12 \\ 0 & 0 \end{bmatrix}$, so $x_0 = -\frac12 x_1$ and the eigenvectors are $t\,(1, -2)$, $t \neq 0$.
:::
::::

```python
A = matrix(QQ, [[4, 1], [2, 3]])
A.charpoly()                                # x^2 - 7*x + 10
A.charpoly().factor()                       # (x - 5) * (x - 2)
A.eigenvalues()                             # [5, 2]
A.eigenvectors_right()                      # [(5, [(1, 1)], 1), (2, [(1, -2)], 1)]
(A - 5*identity_matrix(2)).right_kernel().basis()     # [(1, 1)]
```

Each entry of `eigenvectors_right()` is a triple: the eigenvalue, a basis of its eigenspace, and its multiplicity.

:::caution[Right and left eigenvectors in Sage]
`A.eigenvectors_right()` solves $A\mathbf v = \lambda\mathbf v$, the convention of this course. `A.eigenvectors_left()` solves $\mathbf v A = \lambda\mathbf v$, which gives
different vectors. Always write `_right`.
:::

### Quick facts

::::theorem[Eigenvalues of a triangular matrix]
The eigenvalues of a triangular matrix are its diagonal entries.

:::proof
$\lambda I_n - A$ is also triangular, and the determinant of a triangular matrix is the product of its diagonal, so $p_A(\lambda) = \prod_i (\lambda - a_{i,i})$.
:::
::::

:::caution[Row operations change eigenvalues]
Eigenvalues cannot be read from the RREF or the echelon form of $A$: row operations preserve the kernel and the rank, but they do not preserve
eigenvalues. Only the triangular form you started with counts. $\begin{bmatrix} 4 & 1 \\ 2 & 3 \end{bmatrix}$ reduces to $I_2$, which has only the eigenvalue $1$.
:::

::::theorem[Zero as an eigenvalue]
$A$ is invertible if and only if $0$ is not an eigenvalue of $A$.

:::proof
$0$ is an eigenvalue $\iff$ $A\mathbf v = \mathbf 0$ has a nonzero solution $\iff$ $A$ is not invertible.
:::
::::

This adds one more line to the invertible matrix theorem.

::::theorem[Eigenvalues of powers and inverses]
If $A\mathbf v = \lambda\mathbf v$, then $A^k\mathbf v = \lambda^k\mathbf v$ for every $k \ge 1$. If $A$ is also invertible, then $A^{-1}\mathbf v = \frac{1}{\lambda}\mathbf v$.

:::proof
$A^2\mathbf v = A(\lambda\mathbf v) = \lambda A\mathbf v = \lambda^2\mathbf v$, and so on by induction. Multiplying $A\mathbf v = \lambda\mathbf v$ by $\frac{1}{\lambda}A^{-1}$ gives $\frac{1}{\lambda}\mathbf v = A^{-1}\mathbf v$.
:::
::::

::::theorem[Trace, determinant and eigenvalues]
Let $\lambda_0, \dots, \lambda_{n-1}$ be the eigenvalues of $A$ in $\mathbb C$, each counted with multiplicity. Then

$$
\lambda_0 + \lambda_1 + \cdots + \lambda_{n-1} = \mathrm{tr}(A) , \qquad \lambda_0\lambda_1\cdots\lambda_{n-1} = \det(A) .
$$

:::proof
By the fundamental theorem of algebra, $p_A(\lambda) = (\lambda - \lambda_0)\cdots(\lambda - \lambda_{n-1})$. Setting $\lambda = 0$ gives $\det(-A) = (-1)^n\prod_i\lambda_i$, and $\det(-A) = (-1)^n\det(A)$. For the
sum, the coefficient of $\lambda^{n-1}$ on the right is $-\sum_i\lambda_i$. On the left, in the expansion of $\det(\lambda I_n - A)$, terms in $\lambda^{n-1}$ come only from the
product of the diagonal entries $\prod_i(\lambda - a_{i,i})$, so the coefficient is $-\mathrm{tr}(A)$.
:::
::::

This is a free check on a computation: in the example, $5 + 2 = 7$ and $5 \cdot 2 = 10$.

::::theorem[Similar matrices have the same characteristic polynomial]
If $B = P^{-1}AP$, then $p_B = p_A$, so $A$ and $B$ have the same eigenvalues, with the same multiplicities.

:::proof
$\lambda I_n - P^{-1}AP = P^{-1}(\lambda I_n - A)P$, and the determinants agree as for any similar matrices.
:::
::::

## Eigenspaces and multiplicities

### The eigenspace of an eigenvalue

:::definition[Eigenspace]
The **eigenspace** of an eigenvalue $\lambda$ is $E_\lambda = \ker(A - \lambda I_n)$: all the eigenvectors for $\lambda$ together with $\mathbf 0$.
:::

It is a kernel, so it is a subspace, and a basis comes from the free variables as usual.

:::definition[Algebraic and geometric multiplicity]
The **algebraic multiplicity** of $\lambda$ is its multiplicity as a root of $p_A$. The **geometric multiplicity** of $\lambda$ is $\dim E_\lambda$.
:::

::::theorem[Geometric is at most algebraic]
For every eigenvalue, $1 \le$ geometric multiplicity $\le$ algebraic multiplicity.

:::proof
$\lambda$ is an eigenvalue, so $E_\lambda$ contains a nonzero vector, and its dimension $g$ is at least $1$. Extend a basis of $E_\lambda$ to a basis $\mathcal B$ of $\mathbb R^n$. The
first $g$ columns of the matrix of $\mathbf v \mapsto A\mathbf v$ relative to $\mathcal B$ are $\lambda\mathbf e_0, \dots, \lambda\mathbf e_{g-1}$, so this similar matrix has the block form $\begin{bmatrix} \lambda I_g & C \\ 0 & D \end{bmatrix}$. Its
characteristic polynomial is $(x - \lambda)^g\,p_D(x)$, so $\lambda$ is a root of multiplicity at least $g$.
:::
::::

::::example[A repeated eigenvalue with a full eigenspace]
Find the eigenvalues and eigenspaces of $A = \begin{bmatrix} 3 & 1 & 1 \\ 1 & 3 & 1 \\ 1 & 1 & 3 \end{bmatrix}$.

:::solution
Note that $A - 2I_3$ has all entries $1$, so its rank is $1$, and $\lambda = 2$ is an eigenvalue with a $2$-dimensional eigenspace. In full,

$$
p_A(\lambda) = \lambda^3 - 9\lambda^2 + 24\lambda - 20 = (\lambda - 2)^2(\lambda - 5) .
$$

For $\lambda = 2$: $x_0 + x_1 + x_2 = 0$, so $E_2 = \mathrm{span}\{(-1, 1, 0), (-1, 0, 1)\}$. Algebraic and geometric multiplicity are both $2$.

For $\lambda = 5$: $A - 5I_3 \sim \begin{bmatrix} 1 & 0 & -1 \\ 0 & 1 & -1 \\ 0 & 0 & 0 \end{bmatrix}$, so $E_5 = \mathrm{span}\{(1, 1, 1)\}$.

Check: $2 + 2 + 5 = 9 = \mathrm{tr}(A)$ and $2 \cdot 2 \cdot 5 = 20 = \det(A)$.
:::
::::

```python
A = matrix(QQ, [[3, 1, 1], [1, 3, 1], [1, 1, 3]])
A.charpoly().factor()                       # (x - 5) * (x - 2)^2
A.eigenvectors_right()                      # [(5, [(1, 1, 1)], 1), (2, [(1, 0, -1), (0, 1, -1)], 2)]
(A - 2*identity_matrix(3)).right_kernel().dimension()      # 2
A.trace(), det(A)                           # (9, 20)
```

Sage's basis of $E_2$ differs from the one above, and both are correct: they span the same plane.

::::example[A repeated eigenvalue with a small eigenspace]
Find the multiplicities of the eigenvalue of $A = \begin{bmatrix} 3 & 1 \\ 0 & 3 \end{bmatrix}$.

:::solution
$A$ is triangular, so $p_A(\lambda) = (\lambda - 3)^2$ and the algebraic multiplicity of $3$ is $2$. But $A - 3I = \begin{bmatrix} 0 & 1 \\ 0 & 0 \end{bmatrix}$ has rank $1$, so $E_3 = \mathrm{span}\{(1, 0)\}$
and the geometric multiplicity is $1$.
:::
::::

## Complex eigenvalues

### Rotations

The rotation by $\frac{\pi}{2}$ has $p(\lambda) = \lambda^2 + 1$, with roots $\pm i$. No real vector stays on its line, but over $\mathbb C$ there are eigenvectors, found by the
same steps with complex arithmetic. By the conjugate roots theorem, the non-real eigenvalues of a real matrix come in pairs, and
the eigenvectors pair up too: taking the conjugate of $A\mathbf v = \lambda\mathbf v$ gives $A\bar{\mathbf v} = \bar\lambda\,\bar{\mathbf v}$, since $A$ is real.

::::example[A real matrix with complex eigenvalues]
Find the eigenvalues and eigenvectors of $A = \begin{bmatrix} 1 & -2 \\ 1 & 3 \end{bmatrix}$.

:::solution
$p_A(\lambda) = \lambda^2 - 4\lambda + 5$, so $\lambda = \frac{4 \pm \sqrt{-4}}{2} = 2 \pm i$.

For $\lambda = 2 + i$: $A - \lambda I = \begin{bmatrix} -1 - i & -2 \\ 1 & 1 - i \end{bmatrix}$. The second row says $x_0 + (1 - i)x_1 = 0$ (the first row is a multiple of it). With $x_1 = 1$:
$\mathbf v = (-1 + i, \ 1)$.

Check: $A\mathbf v = (-3 + i, \ 2 + i)$, and $(2 + i)(-1 + i) = -3 + i$, $(2 + i) \cdot 1 = 2 + i$.

For $\lambda = 2 - i$, take the conjugate: $\bar{\mathbf v} = (-1 - i, \ 1)$.
:::
::::

```python
A = matrix(QQ, [[1, -2], [1, 3]])
A.charpoly()                                # x^2 - 4*x + 5
A.eigenvalues()                             # [2 - 1*I, 2 + 1*I]
for lam, vs, m in A.eigenvectors_right():
    print(lam, vs[0], m)                    # 2 + 1*I  (1, -0.5...? - 0.5...?*I)  1, and the conjugate pair
```

Sage scales each vector so that its first entry is $1$. For $\lambda = 2 + i$ it prints $(1, -\frac12 - \frac12 i)$, which is our $(-1 + i, \ 1)$ divided by $-1 + i$.

:::note
These numbers are exact elements of `QQbar`, the field of algebraic numbers, even when they print as decimals ending in `?`.
:::

## Eigenvalues of a linear operator

### Definition

:::definition[Eigenvalue of a linear operator]
Let $T : V \to V$ be a linear operator. A nonzero $\mathbf v \in V$ is an **eigenvector** of $T$ with **eigenvalue** $\lambda$ if $T(\mathbf v) = \lambda\mathbf v$. The eigenspace is $E_\lambda = \ker(T - \lambda\,\mathrm{id})$.
:::

If $V$ is finite-dimensional and $\mathcal B$ is a basis, then coordinates turn the equation into $[T]_{\mathcal B}[\mathbf v]_{\mathcal B} = \lambda[\mathbf v]_{\mathcal B}$. So the eigenvalues of $T$ are those of the matrix $[T]_{\mathcal B}$,
for any basis (similar matrices share them), and the eigenvectors of $T$ are the vectors whose coordinates are eigenvectors of the matrix.

:::steps[Eigenvalues of an operator]
1. Choose a basis $\mathcal B$ of $V$ and find $[T]_{\mathcal B}$.
2. Find the eigenvalues and eigenvectors of this matrix.
3. Translate each eigenvector back: its entries are the coefficients on $\mathcal B$.
:::

::::example[The transpose as an operator]
Find the eigenvalues and eigenspaces of $T : \mathbb R^{2 \times 2} \to \mathbb R^{2 \times 2}$, $T(M) = M^{\mathrm T}$.

:::solution
On the standard basis in the order $E_{0,0}, E_{0,1}, E_{1,0}, E_{1,1}$, the transpose swaps the two middle basis vectors:

$$
[T] = \begin{bmatrix} 1 & 0 & 0 & 0 \\ 0 & 0 & 1 & 0 \\ 0 & 1 & 0 & 0 \\ 0 & 0 & 0 & 1 \end{bmatrix} , \qquad p(\lambda) = (\lambda - 1)^3(\lambda + 1) .
$$

$E_1$ has dimension $3$ and consists of the $M$ with $M^{\mathrm T} = M$: the symmetric matrices. $E_{-1}$ has dimension $1$ and consists of the
$M$ with $M^{\mathrm T} = -M$: the multiples of $\begin{bmatrix} 0 & 1 \\ -1 & 0 \end{bmatrix}$.
:::
::::

```python
Tm = matrix(QQ, [[1, 0, 0, 0], [0, 0, 1, 0], [0, 1, 0, 0], [0, 0, 0, 1]])
Tm.charpoly().factor()                      # (x + 1) * (x - 1)^3
(Tm + identity_matrix(4)).right_kernel().basis()      # [(0, 1, -1, 0)]
```

::::example[Differentiation has one eigenvalue]
Find the eigenvalues of $D : \mathcal P_2 \to \mathcal P_2$, $D(p) = p'$.

:::solution
In the basis $(1, x, x^2)$, $[D] = \begin{bmatrix} 0 & 1 & 0 \\ 0 & 0 & 2 \\ 0 & 0 & 0 \end{bmatrix}$, which is triangular with zeros on the diagonal. The only eigenvalue is $0$, with algebraic multiplicity $3$, and $E_0$ is the set of
constant polynomials, of dimension $1$.
:::
::::

:::note[Infinite dimensions]
On the space of smooth functions, $D(e^{kx}) = k\,e^{kx}$, so every real number is an eigenvalue of $D$. There is no matrix here, and no characteristic polynomial; the definition still works.
:::

:::insight
An eigenvector is a direction on which $A$ acts as a number. The polynomial $\det(\lambda I_n - A)$ finds the numbers, each kernel $\ker(A - \lambda I_n)$
finds the directions, and the same two steps work for any operator once it is written as a matrix.
:::

:::equations
- *Eigenpair*: $A\mathbf v = \lambda\mathbf v$, $\mathbf v \neq \mathbf 0$.
- *Characteristic polynomial*: $p_A(\lambda) = \det(\lambda I_n - A)$; for $2 \times 2$: $\lambda^2 - \mathrm{tr}(A)\lambda + \det(A)$.
- *Eigenspace*: $E_\lambda = \ker(A - \lambda I_n)$; $1 \le \dim E_\lambda \le$ algebraic multiplicity.
- *Sum and product*: $\sum_i\lambda_i = \mathrm{tr}(A)$, $\prod_i\lambda_i = \det(A)$.
- *Powers and inverse*: $A^k$ has $\lambda^k$; $A^{-1}$ has $\frac{1}{\lambda}$; invertible $\iff$ $0$ is not an eigenvalue.
- *Real matrix*: non-real eigenvalues and eigenvectors come in conjugate pairs.
:::

## Further reading

- [3Blue1Brown — Eigenvectors and eigenvalues](https://www.3blue1brown.com/lessons/eigenvalues) — why they are the axes of a transformation.
- [Eigenvalues and eigenvectors (Wikipedia)](https://en.wikipedia.org/wiki/Eigenvalues_and_eigenvectors) — the definitions and many examples.
- [SageMath matrix methods](https://doc.sagemath.org/html/en/reference/matrices/sage/matrix/matrix2.html) — `charpoly`, `eigenvalues`, `eigenvectors_right`.
