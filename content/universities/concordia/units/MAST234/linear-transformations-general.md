---
title: Linear transformations of general vector spaces
order: 9
status: detailed
weeks: [9]
introduces: []
requires:
  - {concept: vector-space, strength: hard}
  - {concept: basis-dimension, strength: hard}
  - {concept: linear-transformation, strength: hard}
  - {concept: linear-independence, strength: hard}
  - {concept: matrix-inverse, strength: hard}
  - {concept: determinant, strength: soft}
  - {concept: computer-algebra-system, strength: soft}
reinforces:
  - {concept: linear-transformation, perspective: "on abstract vector spaces: kernel, image, matrix representation with respect to bases, operators and similar matrices"}
  - {concept: matrix-rank, perspective: "the rank-nullity theorem for linear maps"}
---

The definition of a linear transformation uses only addition and scaling, so it makes sense between any
two vector spaces: differentiation is a linear map on polynomials, the transpose is a linear map on
matrices. Every linear map has a **kernel** and an **image**, and the **rank–nullity theorem** ties their
dimensions together. Once a basis is chosen on each side, coordinates turn the map into a matrix, so the
tools of the first half of the course apply to all of these maps. A different choice of bases gives a
different matrix for the same map, and for a map of a space into itself the two matrices are **similar**.

Indices start at $0$, as in Sage.

## Linear maps between vector spaces

### Definition and examples

:::definition[Linear map between vector spaces]
Let $V$ and $W$ be vector spaces. A function $T : V \to W$ is **linear** if, for all $\mathbf u, \mathbf v \in V$ and $c \in \mathbb R$,

$$
T(\mathbf u + \mathbf v) = T(\mathbf u) + T(\mathbf v) \qquad\text{and}\qquad T(c\,\mathbf v) = c\,T(\mathbf v) .
$$

A linear map of a space into itself, $T : V \to V$, is called a **linear operator**.
:::

As in $\mathbb R^n$, linearity gives $T(\mathbf 0_V) = \mathbf 0_W$ and $T\bigl(\sum_i c_i\mathbf v_i\bigr) = \sum_i c_i\,T(\mathbf v_i)$.

| Map | Rule | Why it is linear |
|---|---|---|
| differentiation $D : \mathcal P_3 \to \mathcal P_2$ | $p \mapsto p'$ | $(p + q)' = p' + q'$, $(cp)' = cp'$ |
| evaluation $E : \mathcal P_2 \to \mathbb R$ | $p \mapsto p(2)$ | $(p + q)(2) = p(2) + q(2)$ |
| integration $J : \mathcal P_2 \to \mathcal P_3$ | $p \mapsto \int_0^x p(t)\,dt$ | the integral splits over sums and scalars |
| transpose $\mathbb R^{m \times n} \to \mathbb R^{n \times m}$ | $M \mapsto M^{\mathrm T}$ | $(M + N)^{\mathrm T} = M^{\mathrm T} + N^{\mathrm T}$ |
| trace $\mathrm{tr} : \mathbb R^{n \times n} \to \mathbb R$ | $M \mapsto \sum_i m_{i,i}$ | sums of diagonal entries add |
| coordinates $V \to \mathbb R^n$ | $\mathbf v \mapsto [\mathbf v]_{\mathcal B}$ | shown in the last unit |

::::example[Three maps that are not linear]
Show that these are not linear: $\det : \mathbb R^{2 \times 2} \to \mathbb R$; $S : \mathcal P_2 \to \mathcal P_2$, $S(p) = p + 1$; and $Q : \mathcal P_1 \to \mathcal P_2$, $Q(p) = p^2$.

:::solution
$\det(2I_2) = 4$, but $2\det(I_2) = 2$.

$S(0) = 1$ is not the zero polynomial.

$Q(2) = 4$, but $2\,Q(1) = 2$.
:::
::::

:::theorem[A linear map is fixed by a basis]
Let $\mathbf b_0, \dots, \mathbf b_{n-1}$ be a basis of $V$ and let $\mathbf w_0, \dots, \mathbf w_{n-1}$ be any vectors of $W$. There is exactly one linear
map $T : V \to W$ with $T(\mathbf b_i) = \mathbf w_i$ for every $i$, namely $T\bigl(\sum_i c_i\mathbf b_i\bigr) = \sum_i c_i\mathbf w_i$.
:::

:::proof
Each vector is a unique combination of the basis, so this rule is well defined, and it is linear because coefficients
add and scale. Any linear $T$ with these values satisfies the rule, by linearity, so it is the only one.
:::

## Kernel and image

### Definitions

:::definition[Kernel and image of a linear map]
For a linear map $T : V \to W$, the **kernel** is the set of vectors sent to zero, and the **image** is the set of values:

$$
\ker(T) = \{\, \mathbf v \in V : T(\mathbf v) = \mathbf 0 \,\} , \qquad \mathrm{im}(T) = \{\, T(\mathbf v) : \mathbf v \in V \,\} .
$$

Their dimensions are the **nullity** and the **rank** of $T$.
:::

For $T(\mathbf v) = A\mathbf v$ these are $\ker(A)$ and $\mathrm{col}(A)$.

::::theorem[Kernel and image are subspaces]
For linear $T : V \to W$, $\ker(T)$ is a subspace of $V$ and $\mathrm{im}(T)$ is a subspace of $W$.

:::proof
$T(\mathbf 0) = \mathbf 0$ puts $\mathbf 0$ in both. If $T(\mathbf u) = T(\mathbf v) = \mathbf 0$, then $T(\mathbf u + \mathbf v) = \mathbf 0$ and $T(c\,\mathbf v) = c\,\mathbf 0 = \mathbf 0$.
And $T(\mathbf u) + T(\mathbf v) = T(\mathbf u + \mathbf v)$ and $c\,T(\mathbf v) = T(c\,\mathbf v)$ are again values of $T$.
:::
::::

::::theorem[Injective means trivial kernel]
A linear map $T$ is injective if and only if $\ker(T) = \{\mathbf 0\}$.

:::proof
If $T$ is injective and $T(\mathbf v) = \mathbf 0 = T(\mathbf 0)$, then $\mathbf v = \mathbf 0$. Conversely, if the kernel is trivial and $T(\mathbf u) = T(\mathbf v)$, then
$T(\mathbf u - \mathbf v) = \mathbf 0$, so $\mathbf u - \mathbf v = \mathbf 0$.
:::
::::

So injectivity of a linear map is one equation, $T(\mathbf v) = \mathbf 0$, rather than a statement about all pairs.

::::example[Kernel and image of differentiation]
Find $\ker(D)$ and $\mathrm{im}(D)$ for $D : \mathcal P_3 \to \mathcal P_2$, $D(p) = p'$.

:::solution
$p' = 0$ exactly when $p$ is constant, so $\ker(D)$ is the set of constants, with basis $\{1\}$ and nullity $1$.

Every $q \in \mathcal P_2$ is the derivative of an antiderivative, which has degree at most $3$. So $\mathrm{im}(D) = \mathcal P_2$, of rank $3$.
$D$ is surjective and not injective.
:::
::::

::::example[Evaluating at two points]
Let $T : \mathcal P_2 \to \mathbb R^2$, $T(p) = (p(0), p(1))$. Find the kernel and the image.

:::solution
Write $p = a + bx + cx^2$. Then $T(p) = (a, \ a + b + c)$. The kernel requires $a = 0$ and $b + c = 0$, so $p = b(x - x^2)$, with basis
$\{x - x^2\}$. The nullity is $1$.

For the image, take any $(u, v)$: the polynomial $p = u + (v - u)x$ has $T(p) = (u, v)$. So $\mathrm{im}(T) = \mathbb R^2$, of rank $2$.
:::
::::

## The rank–nullity theorem

### Statement and proof

::::theorem[Rank–nullity theorem]
If $T : V \to W$ is linear and $V$ is finite-dimensional, then

$$
\dim \ker(T) + \dim \mathrm{im}(T) = \dim V .
$$

:::proof
Take a basis $\mathbf k_0, \dots, \mathbf k_{r-1}$ of $\ker(T)$ and extend it to a basis $\mathbf k_0, \dots, \mathbf k_{r-1}, \mathbf u_0, \dots, \mathbf u_{s-1}$ of $V$, so $\dim V = r + s$. It is enough
to show that $T(\mathbf u_0), \dots, T(\mathbf u_{s-1})$ is a basis of $\mathrm{im}(T)$.

They span: for any $\mathbf v = \sum_i a_i\mathbf k_i + \sum_j c_j\mathbf u_j$, we get $T(\mathbf v) = \sum_j c_j\,T(\mathbf u_j)$, because $T(\mathbf k_i) = \mathbf 0$.

They are independent: if $\sum_j c_j\,T(\mathbf u_j) = \mathbf 0$, then $T\bigl(\sum_j c_j\mathbf u_j\bigr) = \mathbf 0$, so $\sum_j c_j\mathbf u_j$ is in the kernel, that is,
$\sum_j c_j\mathbf u_j = \sum_i a_i\mathbf k_i$ for some $a_i$. The whole set is a basis of $V$, so all the coefficients are $0$.
:::
::::

In both examples above, the count works: $1 + 3 = 4 = \dim \mathcal P_3$ and $1 + 2 = 3 = \dim \mathcal P_2$.

The dimension of $V$ is shared out: what the kernel takes, the image loses. Finding one of the two numbers gives the other.

::::corollary[Dimension limits injective and surjective maps]
Let $T : V \to W$ be linear, with $V$ and $W$ finite-dimensional.

1. If $\dim V > \dim W$, then $T$ is not injective.
2. If $\dim V < \dim W$, then $T$ is not surjective.
3. If $\dim V = \dim W$, then $T$ is injective if and only if it is surjective.

:::proof
1. $\dim \ker(T) = \dim V - \dim \mathrm{im}(T) \ge \dim V - \dim W > 0$.
2. $\dim \mathrm{im}(T) \le \dim V < \dim W$.
3. $\ker(T) = \{\mathbf 0\}$ $\iff$ $\dim \mathrm{im}(T) = \dim V = \dim W$ $\iff$ $\mathrm{im}(T) = W$.
:::
::::

:::caution[The theorem counts the domain]
Rank plus nullity is the dimension of the **domain**, not of the codomain. For $E : \mathcal P_2 \to \mathbb R$, $E(p) = p(2)$, the
image has dimension $1$, so the kernel has dimension $3 - 1 = 2$, not $1 - 1 = 0$.
:::

:::definition[Isomorphism]
A bijective linear map is an **isomorphism**, and two spaces joined by one are **isomorphic**.
:::

The coordinate map shows that every $n$-dimensional space is isomorphic to $\mathbb R^n$: $\mathcal P_3$, $\mathbb R^{2 \times 2}$ and $\mathbb R^4$ are the same
space under different names, as far as linear algebra can tell.

## The matrix of a linear map

### Definition

Let $T : V \to W$ be linear, with $\mathcal B = (\mathbf b_0, \dots, \mathbf b_{n-1})$ a basis of $V$ and $\mathcal C$ a basis of $W$. Take any $\mathbf v$ with
$[\mathbf v]_{\mathcal B} = (c_0, \dots, c_{n-1})$. Linearity of $T$ and of the coordinate map gives

$$
[T(\mathbf v)]_{\mathcal C} = \Bigl[\, \sum_j c_j\,T(\mathbf b_j) \Bigr]_{\mathcal C} = \sum_j c_j\,[T(\mathbf b_j)]_{\mathcal C} .
$$

The right side is a matrix times $[\mathbf v]_{\mathcal B}$.

:::definition[Matrix of a linear map]
The **matrix of $T$ relative to $\mathcal B$ and $\mathcal C$** has as column $j$ the $\mathcal C$-coordinates of $T(\mathbf b_j)$:

$$
[T]_{\mathcal C \leftarrow \mathcal B} = \bigl[\, [T(\mathbf b_0)]_{\mathcal C} \ \ [T(\mathbf b_1)]_{\mathcal C} \ \cdots \ [T(\mathbf b_{n-1})]_{\mathcal C} \,\bigr] .
$$
:::

:::theorem[The matrix does the work of the map]
For all $\mathbf v \in V$: $[T(\mathbf v)]_{\mathcal C} = [T]_{\mathcal C \leftarrow \mathcal B}\,[\mathbf v]_{\mathcal B}$, and this matrix is the only one with that property.
:::

The standard matrix is the case of the standard bases, and a transition matrix is the case of the identity map:
$P_{\mathcal C \leftarrow \mathcal B} = [\mathrm{id}]_{\mathcal C \leftarrow \mathcal B}$.

:::steps[Finding the matrix of a linear map]
1. Apply $T$ to each vector $\mathbf b_j$ of the domain basis.
2. Write each result in coordinates relative to $\mathcal C$.
3. Put these coordinate vectors in as columns, in order.
4. Check on one vector: $[T]_{\mathcal C \leftarrow \mathcal B}[\mathbf v]_{\mathcal B}$ must equal $[T(\mathbf v)]_{\mathcal C}$.
:::

::::example[Differentiation as a matrix]
Find the matrix of $D : \mathcal P_3 \to \mathcal P_2$ relative to the standard bases $(1, x, x^2, x^3)$ and $(1, x, x^2)$, and use it on $p = 2 - x + 4x^3$.

:::solution
$D(1) = 0$, $D(x) = 1$, $D(x^2) = 2x$ and $D(x^3) = 3x^2$ have coordinates $(0, 0, 0)$, $(1, 0, 0)$, $(0, 2, 0)$ and $(0, 0, 3)$:

$$
[D] = \begin{bmatrix} 0 & 1 & 0 & 0 \\ 0 & 0 & 2 & 0 \\ 0 & 0 & 0 & 3 \end{bmatrix} .
$$

With $[p] = (2, -1, 0, 4)$, we get $[D]\,[p] = (-1, 0, 12)$, that is, $p' = -1 + 12x^2$, which is the correct derivative.
:::
::::

```python
Dm = matrix(QQ, [[0, 1, 0, 0], [0, 0, 2, 0], [0, 0, 0, 3]])
Dm * vector(QQ, [2, -1, 0, 4])          # (-1, 0, 12)
Dm.rank()                               # 3: the rank of D
Dm.right_kernel().basis()               # [(1, 0, 0, 0)]: the constant polynomial 1

R.<x> = QQ[]
p = 2 - x + 4*x^3
p.derivative()                          # 12*x^2 - 1
```

::::example[A matrix with a basis that is not standard]
For $T : \mathcal P_2 \to \mathbb R^2$, $T(p) = (p(0), p(1))$, find the matrix relative to $\mathcal B = (1, x, x^2)$ and $\mathcal C = ((1, 1), (1, -1))$.

:::solution
$T(1) = (1, 1)$, $T(x) = (0, 1)$ and $T(x^2) = (0, 1)$. In $\mathcal C$-coordinates, $(1, 1)$ is $(1, 0)$, and $(0, 1) = \tfrac12(1, 1) - \tfrac12(1, -1)$
is $(\tfrac12, -\tfrac12)$. So

$$
[T]_{\mathcal C \leftarrow \mathcal B} = \begin{bmatrix} 1 & \tfrac12 & \tfrac12 \\ 0 & -\tfrac12 & -\tfrac12 \end{bmatrix} .
$$

Its rank is $2$, and its kernel is spanned by $(0, 1, -1)$, the polynomial $x - x^2$ found above.
:::
::::

```python
PC = column_matrix(QQ, [[1, 1], [1, -1]])
images = [vector(QQ, [1, 1]), vector(QQ, [0, 1]), vector(QQ, [0, 1])]    # T(1), T(x), T(x^2)
M = column_matrix([PC.solve_right(w) for w in images])
M                                       # [1 1/2 1/2; 0 -1/2 -1/2]
M.right_kernel().basis()                # [(0, 1, -1)]
```

### Kernel, image and composition through the matrix

Coordinates are a bijection that respects the operations, so everything can be read from the matrix.

:::theorem[Reading kernel and image from the matrix]
Let $M = [T]_{\mathcal C \leftarrow \mathcal B}$. Then $\mathbf v \in \ker(T)$ exactly when $[\mathbf v]_{\mathcal B} \in \ker(M)$, and $\mathbf w \in \mathrm{im}(T)$ exactly when
$[\mathbf w]_{\mathcal C} \in \mathrm{col}(M)$. In particular the rank of $T$ is $\mathrm{rank}(M)$ and the nullity of $T$ is the nullity of $M$.
:::

:::theorem[Matrix of a composition]
If $T : U \to V$ and $S : V \to W$ are linear, with bases $\mathcal B$, $\mathcal C$, $\mathcal D$, then

$$
[S \circ T]_{\mathcal D \leftarrow \mathcal B} = [S]_{\mathcal D \leftarrow \mathcal C}\,[T]_{\mathcal C \leftarrow \mathcal B} .
$$
:::

::::example[A map on matrices]
Let $T : \mathbb R^{2 \times 2} \to \mathbb R^{2 \times 2}$, $T(M) = M - M^{\mathrm T}$. Find its matrix relative to the standard basis, and describe its kernel and image.

:::solution
On the standard basis in the order $E_{0,0}, E_{0,1}, E_{1,0}, E_{1,1}$: $T(E_{0,0}) = 0$, $T(E_{0,1}) = E_{0,1} - E_{1,0}$, $T(E_{1,0}) = E_{1,0} - E_{0,1}$ and $T(E_{1,1}) = 0$. So

$$
[T] = \begin{bmatrix} 0 & 0 & 0 & 0 \\ 0 & 1 & -1 & 0 \\ 0 & -1 & 1 & 0 \\ 0 & 0 & 0 & 0 \end{bmatrix} .
$$

The rank is $1$, so the nullity is $3$. The kernel is $\{M : M = M^{\mathrm T}\}$, the symmetric matrices, and the image is
spanned by $\begin{bmatrix} 0 & 1 \\ -1 & 0 \end{bmatrix}$, the skew-symmetric matrices.
:::
::::

```python
E = [matrix(QQ, 2, 2, {(i, j): 1}) for i in range(2) for j in range(2)]
T = lambda M: M - M.transpose()
Tm = column_matrix(QQ, [T(B).list() for B in E])     # .list() reads a matrix row by row
Tm                                      # [0 0 0 0; 0 1 -1 0; 0 -1 1 0; 0 0 0 0]
Tm.rank(), Tm.right_kernel().dimension()             # (1, 3)
```

## Operators and similar matrices

### Changing the basis of an operator

For an operator $T : V \to V$, one basis is used on both sides, and $[T]_{\mathcal B}$ means $[T]_{\mathcal B \leftarrow \mathcal B}$. A good choice of
basis can make this matrix much simpler, so it matters how it changes.

::::theorem[Change of basis for an operator]
Let $\mathcal B$ and $\mathcal C$ be bases of $V$ and $P = P_{\mathcal B \leftarrow \mathcal C}$. Then

$$
[T]_{\mathcal C} = P^{-1}\,[T]_{\mathcal B}\,P .
$$

:::proof
Read the product from right to left on $[\mathbf v]_{\mathcal C}$: $P$ turns it into $[\mathbf v]_{\mathcal B}$, then $[T]_{\mathcal B}$ turns that into $[T(\mathbf v)]_{\mathcal B}$,
and $P^{-1} = P_{\mathcal C \leftarrow \mathcal B}$ turns that into $[T(\mathbf v)]_{\mathcal C}$. So the product does the work of $[T]_{\mathcal C}$, and that matrix is unique.
:::
::::

:::definition[Similar matrices]
Square matrices $A$ and $B$ are **similar** if $B = P^{-1}AP$ for some invertible matrix $P$.
:::

So two matrices of one operator are similar. Conversely, similar matrices are matrices of one operator in two
different bases. Anything that depends only on the operator must therefore agree for similar matrices.

::::theorem[What similar matrices share]
If $A$ and $B$ are similar, then $\det(A) = \det(B)$, $\mathrm{tr}(A) = \mathrm{tr}(B)$ and $\mathrm{rank}(A) = \mathrm{rank}(B)$.

:::proof
$\det(P^{-1}AP) = \det(P)^{-1}\det(A)\det(P) = \det(A)$.

For the trace, first $\mathrm{tr}(XY) = \sum_{i,j} x_{i,j}y_{j,i} = \mathrm{tr}(YX)$, and then $\mathrm{tr}(P^{-1}(AP)) = \mathrm{tr}((AP)P^{-1}) = \mathrm{tr}(A)$.

The rank is the rank of the operator, whichever basis is used.
:::
::::

:::caution[The converse is false]
Equal determinant, trace and rank do not make two matrices similar. $I_2$ and $\begin{bmatrix} 1 & 1 \\ 0 & 1 \end{bmatrix}$ share all three, but the
only matrix similar to $I_2$ is $P^{-1}I_2P = I_2$ itself. These checks can only prove that matrices are **not** similar.
:::

::::example[A better basis]
Let $T(x, y) = (3x + y, \ 2y)$ on $\mathbb R^2$, and $\mathcal C = ((1, 0), (1, -1))$. Find $[T]_{\mathcal C}$.

:::solution
The standard matrix is $A = \begin{bmatrix} 3 & 1 \\ 0 & 2 \end{bmatrix}$, and $P = \begin{bmatrix} 1 & 1 \\ 0 & -1 \end{bmatrix}$ has the vectors of $\mathcal C$ as columns. Then

$$
[T]_{\mathcal C} = P^{-1}AP = \begin{bmatrix} 1 & 1 \\ 0 & -1 \end{bmatrix}\begin{bmatrix} 3 & 1 \\ 0 & 2 \end{bmatrix}\begin{bmatrix} 1 & 1 \\ 0 & -1 \end{bmatrix} = \begin{bmatrix} 3 & 0 \\ 0 & 2 \end{bmatrix} .
$$

Directly: $T(1, 0) = 3\,(1, 0)$ and $T(1, -1) = (2, -2) = 2\,(1, -1)$. In this basis $T$ only stretches each axis. The trace
is $5$ and the determinant is $6$ in both matrices. Finding such a basis is the subject of the last two units.
:::
::::

The sliders below choose a basis $(\mathbf b_0, \mathbf b_1)$ of unit vectors, for the same map $T$. Read each column of $[T]_{\mathcal B}$ as the
coordinates of $T(\mathbf b_j)$ on the skewed grid. The matrix changes, but its trace and determinant do not.

```sim
id: la-similar-matrices
controls:
  - {id: th0, label: "Angle of b₀ (degrees)", min: 0, max: 175, step: 5, default: 30, decimals: 0}
  - {id: th1, label: "Angle of b₁ (degrees)", min: 0, max: 175, step: 5, default: 100, decimals: 0}
note: 'T has standard matrix A = [3 1; 0 2]. Blue and gold: b₀, b₁ and the grid they draw. Dashed: T(b₀), T(b₁). The title shows [T]_B = P⁻¹AP with P = [b₀ b₁]. Try b₀ at 0° and b₁ at 135°: each T(bⱼ) lies along its bⱼ, and the matrix is diagonal, as in the example. Equal angles give no basis.'
```

```python
A = matrix(QQ, [[3, 1], [0, 2]])
P = column_matrix(QQ, [[1, 0], [1, -1]])
B = P.inverse() * A * P
B                                       # [3 0; 0 2]
A.trace(), B.trace(), det(A), det(B)    # (5, 5, 6, 6)
A.is_similar(B)                         # True
```

:::insight
A linear map is one thing; its matrix depends on the bases. The rank, the determinant and the trace belong
to the map, and the entries belong to the choice of bases, so a good basis is one in which the entries are simple.
:::

:::equations
- *Kernel and image*: $\ker(T) = \{\mathbf v : T(\mathbf v) = \mathbf 0\}$, $\mathrm{im}(T) = \{T(\mathbf v)\}$; injective $\iff \ker(T) = \{\mathbf 0\}$.
- *Rank–nullity*: $\dim \ker(T) + \dim \mathrm{im}(T) = \dim V$ (the domain).
- *Matrix*: column $j$ of $[T]_{\mathcal C \leftarrow \mathcal B}$ is $[T(\mathbf b_j)]_{\mathcal C}$; $[T(\mathbf v)]_{\mathcal C} = [T]_{\mathcal C \leftarrow \mathcal B}[\mathbf v]_{\mathcal B}$.
- *Matrix of a composition*: $[S \circ T]_{\mathcal D \leftarrow \mathcal B} = [S]_{\mathcal D \leftarrow \mathcal C}[T]_{\mathcal C \leftarrow \mathcal B}$.
- *Change of basis*: $[T]_{\mathcal C} = P^{-1}[T]_{\mathcal B}P$ with $P = P_{\mathcal B \leftarrow \mathcal C}$.
- *Similar*: $B = P^{-1}AP$; equal $\det$, $\mathrm{tr}$, rank.
:::

## Further reading

- [Rank–nullity theorem (Wikipedia)](https://en.wikipedia.org/wiki/Rank%E2%80%93nullity_theorem) — the theorem and its proofs.
- [Transformation matrix (Wikipedia)](https://en.wikipedia.org/wiki/Transformation_matrix) — matrices of linear maps, in the plane and beyond.
- [Matrix similarity (Wikipedia)](https://en.wikipedia.org/wiki/Matrix_similarity) — what similar matrices share.
