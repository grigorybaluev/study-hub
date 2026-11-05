---
title: Linear transformations of R^n
order: 6
status: detailed
weeks: [6]
introduces:
  - {concept: linear-transformation, perspective: "maps R^n -> R^m: domain, codomain, range; every linear map is multiplication by a matrix; composition is matrix multiplication"}
requires:
  - {concept: matrix, strength: hard}
  - {concept: vector, strength: hard}
  - {concept: function, strength: hard}
  - {concept: linear-combination-span, strength: hard}
  - {concept: linear-independence, strength: hard}
  - {concept: matrix-rank, strength: hard}
  - {concept: matrix-inverse, strength: hard}
  - {concept: determinant, strength: soft}
  - {concept: trigonometric-functions, strength: soft}
  - {concept: computer-algebra-system, strength: soft}
reinforces: []
---

So far a matrix has been a table of numbers and a system of equations in disguise. This unit
turns it into a **function**: a matrix takes a vector in and gives a vector out. The functions
that arise this way are exactly the ones that respect addition and scaling, the **linear
transformations**. The two pictures, function and matrix, are one object: composing functions is
multiplying matrices, and the questions "are the columns independent?" and "do they span?" become
"is the function injective?" and "is it surjective?".

Indices start at $0$, as in Sage: the standard basis of $\mathbb R^n$ is $\mathbf e_0, \dots, \mathbf e_{n-1}$ and a vector
is $\mathbf v = (v_0, \dots, v_{n-1})$.

## Functions between sets

### Domain, codomain and image

A function is written with its two sets and its rule:

$$
f : X \longrightarrow Y, \qquad x \longmapsto f(x) .
$$

The words *transformation*, *map* and *mapping* all mean the same thing.

:::definition[Domain, codomain, image]
For $T : X \to Y$, the set $X$ is the **domain** and $Y$ is the **codomain**. The **image** (or **range**)
of $T$ is the set of values that are actually reached:

$$
T(X) = \{\, T(x) : x \in X \,\} = \{\, y \in Y : y = T(x) \text{ for some } x \in X \,\} .
$$
:::

The codomain is part of the description of the function; the image is something to be worked
out, and it can be smaller.

::::example[Image of a parabola and of a plane]
Find the image of $f : \mathbb R \to \mathbb R$, $f(x) = x^2 + 1$, and of $g : \mathbb R^2 \to \mathbb R$, $g(x, y) = 2x - y + 4$.

:::solution
Since $x^2 \ge 0$ and $x^2$ takes every value in $[0, \infty)$, the image of $f$ is $[1, \infty)$, smaller
than the codomain $\mathbb R$.

For $g$, take any $c \in \mathbb R$ and look for a point that reaches it. The point $(\tfrac{c-4}{2}, 0)$ does:
$g(\tfrac{c-4}{2}, 0) = (c - 4) + 4 = c$. So the image of $g$ is all of $\mathbb R$.
:::
::::

### Injective, surjective, bijective

:::definition[Injective, surjective, bijective]
A function $T : X \to Y$ is

1. **injective** (one-to-one) if $T(x_0) = T(x_1)$ only when $x_0 = x_1$: different inputs give different outputs;
2. **surjective** (onto) if $T(X) = Y$: every element of the codomain is reached;
3. **bijective** if it is both.
:::

To show that a function is **not** injective, give two different inputs with one output; to show
that it is **not** surjective, give one element of the codomain that nothing reaches. To show that it
**is** injective or surjective takes an argument about arbitrary elements.

::::example[Classifying three functions]
Classify $f(x) = x^2 + 1$, $g(x, y) = 2x - y + 4$ and the quarter turn $T : \mathbb R^2 \to \mathbb R^2$, $T(x, y) = (y, -x)$.

:::solution
$f$ is not injective, since $f(-2) = f(2) = 5$, and not surjective, since $0$ is not in the image.

$g$ is surjective (shown above) but not injective: $g(0, 0) = g(1, 2) = 4$.

$T$ is bijective. Injective: if $T(x_0, y_0) = T(x_1, y_1)$ then $(y_0, -x_0) = (y_1, -x_1)$, so $y_0 = y_1$ and $x_0 = x_1$.
Surjective: for any $(a, b)$, the input $(-b, a)$ gives $T(-b, a) = (a, b)$.
:::
::::

## Linear transformations

### The definition

:::definition[Linear transformation]
A function $T : \mathbb R^n \to \mathbb R^m$ is a **linear transformation** if, for all $\mathbf u, \mathbf v \in \mathbb R^n$ and $c \in \mathbb R$,

1. $T(\mathbf u + \mathbf v) = T(\mathbf u) + T(\mathbf v)$, and
2. $T(c\,\mathbf v) = c\,T(\mathbf v)$.
:::

In words: adding or scaling before applying $T$ gives the same result as adding or scaling after.
Two consequences are used constantly.

::::theorem[Linear maps fix zero and preserve combinations]
If $T$ is linear, then $T(\mathbf 0) = \mathbf 0$, and for all vectors $\mathbf v_0, \dots, \mathbf v_{k-1}$ and scalars $c_0, \dots, c_{k-1}$,

$$
T(c_0 \mathbf v_0 + \cdots + c_{k-1} \mathbf v_{k-1}) = c_0\,T(\mathbf v_0) + \cdots + c_{k-1}\,T(\mathbf v_{k-1}) .
$$

:::proof
$T(\mathbf 0) = T(0\,\mathbf 0) = 0\,T(\mathbf 0) = \mathbf 0$ by property 2. For the combination, apply property 1 repeatedly to split the
sum into $k$ terms, then property 2 to pull out each scalar.
:::
::::

### Testing a formula

To prove linearity, take arbitrary vectors and check both properties. To disprove it, one numeric
failure is enough, and the fastest thing to try is $T(\mathbf 0)$.

::::example[Three formulas tested]
Decide whether each is linear: $h(x) = x^2$; $g(x, y) = 2x - y + 4$; $T(x, y) = (2x + y, \ x - 3y)$.

:::solution
$h$ is not linear: $h(1 + 1) = 4$ but $h(1) + h(1) = 2$.

$g$ is not linear: $g(0, 0) = 4 \neq 0$. A linear function plus a constant like this is called **affine**.

$T$ is linear. Let $\mathbf u = (u_0, u_1)$, $\mathbf v = (v_0, v_1)$ and $c \in \mathbb R$. Then

$$
T(\mathbf u + \mathbf v) = \bigl(2(u_0 + v_0) + (u_1 + v_1), \ (u_0 + v_0) - 3(u_1 + v_1)\bigr) = T(\mathbf u) + T(\mathbf v) ,
$$

$$
T(c\,\mathbf v) = (2cv_0 + cv_1, \ cv_0 - 3cv_1) = c\,(2v_0 + v_1, \ v_0 - 3v_1) = c\,T(\mathbf v) .
$$
:::
::::

Sage does the same algebra if the inputs are symbolic.

```python
x, y, c, u0, u1, v0, v1 = var('x, y, c, u0, u1, v0, v1')
T(x, y) = (2*x + y, x - 3*y)
bool(T(u0 + v0, u1 + v1) == T(u0, u1) + T(v0, v1))   # True: additive
bool(T(c*v0, c*v1) == c*T(v0, v1))                   # True: homogeneous

g(x, y) = 2*x - y + 4
bool(g(u0 + v0, u1 + v1) == g(u0, u1) + g(v0, v1))   # False: not additive
g(0, 0)                                              # 4
```

:::caution[T(0) = 0 is necessary, not sufficient]
A map with $T(\mathbf 0) \neq \mathbf 0$ is certainly not linear, but passing this test proves nothing. The map
$T(x, y) = (x^2, y)$ sends $\mathbf 0$ to $\mathbf 0$ and still fails: $T(2, 0) = (4, 0)$, while $2\,T(1, 0) = (2, 0)$.
:::

## Every linear map is a matrix

### Multiplying by a matrix is linear

:::theorem[Matrix transformations are linear]
For an $m \times n$ matrix $A$, the function $T : \mathbb R^n \to \mathbb R^m$, $T(\mathbf v) = A\mathbf v$ is linear.
:::

This is the rule $A(\mathbf u + \mathbf v) = A\mathbf u + A\mathbf v$, $A(c\,\mathbf v) = c\,A\mathbf v$ of the matrix product. The
surprise is the converse: there are no other linear maps.

### The standard basis

:::definition[Standard basis]
The **standard basis** of $\mathbb R^n$ is $\{\mathbf e_0, \mathbf e_1, \dots, \mathbf e_{n-1}\}$, where $\mathbf e_i$ has a $1$ in position $i$ and $0$
in every other position. Every vector is a unique combination of them:

$$
\mathbf v = (v_0, v_1, \dots, v_{n-1}) = v_0\,\mathbf e_0 + v_1\,\mathbf e_1 + \cdots + v_{n-1}\,\mathbf e_{n-1} = \sum_{i=0}^{n-1} v_i\,\mathbf e_i .
$$
:::

For a matrix with columns $\mathbf c_0, \dots, \mathbf c_{n-1}$, the product $A\mathbf e_i$ is the combination with coefficient $1$ on
$\mathbf c_i$ and $0$ elsewhere, so $A\mathbf e_i = \mathbf c_i$: multiplying by $\mathbf e_i$ picks out column $i$.

### The standard matrix

::::theorem[The standard matrix of a linear map]
For every linear $T : \mathbb R^n \to \mathbb R^m$ there is exactly one $m \times n$ matrix $A$ with $T(\mathbf v) = A\mathbf v$ for all
$\mathbf v \in \mathbb R^n$, namely

$$
A = \bigl[\, T(\mathbf e_0) \ \ T(\mathbf e_1) \ \cdots \ T(\mathbf e_{n-1}) \,\bigr] .
$$

:::proof
Let $A$ be this matrix and $\mathbf v = \sum_i v_i\,\mathbf e_i$. Using the column reading of $A\mathbf v$, and then the linearity of $T$,

$$
A\mathbf v = \sum_{i=0}^{n-1} v_i\,T(\mathbf e_i) = T\Bigl(\sum_{i=0}^{n-1} v_i\,\mathbf e_i\Bigr) = T(\mathbf v) .
$$

For uniqueness, if $B$ also has $T(\mathbf v) = B\mathbf v$ for all $\mathbf v$, then column $i$ of $B$ is $B\mathbf e_i = T(\mathbf e_i)$, which is
column $i$ of $A$.
:::
::::

$A$ is called the **standard matrix** of $T$, or the matrix of $T$ with respect to the standard basis.
A linear map is fixed by what it does to the $n$ vectors $\mathbf e_i$; everything else follows by linearity.

:::steps[Finding the standard matrix]
1. Apply $T$ to $\mathbf e_0, \dots, \mathbf e_{n-1}$.
2. Put the results in as columns, in that order.
3. Check on one more vector: $A\mathbf v$ should equal $T(\mathbf v)$.
:::

::::example[From a formula to a matrix]
Find the standard matrix of $T : \mathbb R^3 \to \mathbb R^2$, $T(x, y, z) = (x - 2z, \ 3y + z)$.

:::solution
$T(\mathbf e_0) = (1, 0)$, $T(\mathbf e_1) = (0, 3)$ and $T(\mathbf e_2) = (-2, 1)$, so

$$
A = \begin{bmatrix} 1 & 0 & -2 \\ 0 & 3 & 1 \end{bmatrix} .
$$

The rows repeat the coefficients of the formula, which is the quick way to read $A$ when the formula
is written out. Check with $\mathbf v = (1, 1, 1)$: $A\mathbf v = (-1, 4) = T(1, 1, 1)$.
:::
::::

```python
x, y, z = var('x, y, z')
T(x, y, z) = (x - 2*z, 3*y + z)
A = column_matrix(QQ, [T(1, 0, 0), T(0, 1, 0), T(0, 0, 1)])
A                                    # [1 0 -2; 0 3 1]
A * vector(QQ, [1, 1, 1])            # (-1, 4)
T(1, 1, 1)                           # (-1, 4)
```

### A gallery of the plane

Each map below is read off from where $\mathbf e_0$ and $\mathbf e_1$ go. A rotation by $t$ sends $\mathbf e_0$ to $(\cos t, \sin t)$ and
$\mathbf e_1$ to $(-\sin t, \cos t)$.

| Map | Matrix | $\det$ |
|---|---|---|
| rotation by $t$ | $\begin{bmatrix} \cos t & -\sin t \\ \sin t & \cos t \end{bmatrix}$ | $1$ |
| reflection in the $x$-axis | $\begin{bmatrix} 1 & 0 \\ 0 & -1 \end{bmatrix}$ | $-1$ |
| reflection in the line $y = x$ | $\begin{bmatrix} 0 & 1 \\ 1 & 0 \end{bmatrix}$ | $-1$ |
| projection onto the $x$-axis | $\begin{bmatrix} 1 & 0 \\ 0 & 0 \end{bmatrix}$ | $0$ |
| scaling by $k$ | $\begin{bmatrix} k & 0 \\ 0 & k \end{bmatrix}$ | $k^2$ |
| horizontal shear by $k$ | $\begin{bmatrix} 1 & k \\ 0 & 1 \end{bmatrix}$ | $1$ |

The sliders below are the four entries of $A$. The two arrows are its columns, and the filled shape is
the image of the unit square; the rest of the grid follows, because every point is a combination of
$\mathbf e_0$ and $\mathbf e_1$. Try to reproduce each row of the table.

```sim
id: la-matrix-square
controls:
  - {id: a, label: "a (top left)", min: -3, max: 3, step: 0.1, default: 1.5, decimals: 1}
  - {id: b, label: "b (top right)", min: -3, max: 3, step: 0.1, default: 0.5, decimals: 1}
  - {id: c, label: "c (bottom left)", min: -3, max: 3, step: 0.1, default: 0, decimals: 1}
  - {id: d, label: "d (bottom right)", min: -3, max: 3, step: 0.1, default: 1, decimals: 1}
note: 'A = [a b; c d]. Blue: Ae₀ = (a, c), the first column. Gold: Ae₁ = (b, d), the second column. Straight lines stay straight and evenly spaced, and the origin stays put. The area of the filled parallelogram is |det A|; when det A = 0 the plane collapses onto a line or a point, so the map cannot be injective. When det A < 0 the small triangle shows that the square has been flipped over.'
```

```python
a, b, c, d = 1.5, 0.5, 0, 1
A = matrix(QQ, [[a, b], [c, d]])
A * vector(QQ, [1, 0]), A * vector(QQ, [0, 1])       # the columns: (3/2, 0) and (1/2, 1)
det(A)                                               # 3/2, the area of the image of the unit square
```

## Composition

### Doing one map after another

::::theorem[Composition of linear maps]
If $T : \mathbb R^n \to \mathbb R^m$ and $S : \mathbb R^m \to \mathbb R^l$ are linear, then $S \circ T : \mathbb R^n \to \mathbb R^l$, $\mathbf v \mapsto S(T(\mathbf v))$, is linear.
If $T$ has standard matrix $A$ and $S$ has standard matrix $B$, then $S \circ T$ has standard matrix $BA$.

:::proof
For $\mathbf u, \mathbf v \in \mathbb R^n$ and $c \in \mathbb R$, the linearity of $T$ and then of $S$ gives

$$
S(T(\mathbf u + \mathbf v)) = S(T(\mathbf u) + T(\mathbf v)) = S(T(\mathbf u)) + S(T(\mathbf v)) ,
$$

and in the same way $S(T(c\,\mathbf v)) = S(c\,T(\mathbf v)) = c\,S(T(\mathbf v))$. For the matrix, associativity of the product gives

$$
S(T(\mathbf v)) = B(A\mathbf v) = (BA)\mathbf v ,
$$

and the standard matrix is unique.
:::
::::

This is the reason the matrix product is defined the way it is. The sizes fit too:
$(l \times m)(m \times n) = l \times n$, a map from $\mathbb R^n$ to $\mathbb R^l$.

:::caution[The first map is written on the right]
$S \circ T$ means $T$ first, and its matrix is $BA$ with $T$'s matrix $A$ on the right, next to the vector.
Since matrices do not commute, the order matters.
:::

::::example[Rotate, then reflect, or the other way round]
Let $R$ be the rotation by $\frac{\pi}{2}$ and $F$ the reflection in the line $y = x$. Find the matrices of $F \circ R$ and $R \circ F$.

:::solution
$R$ has matrix $\begin{bmatrix} 0 & -1 \\ 1 & 0 \end{bmatrix}$ and $F$ has matrix $\begin{bmatrix} 0 & 1 \\ 1 & 0 \end{bmatrix}$. Then

$$
F \circ R : \begin{bmatrix} 0 & 1 \\ 1 & 0 \end{bmatrix}\begin{bmatrix} 0 & -1 \\ 1 & 0 \end{bmatrix} = \begin{bmatrix} 1 & 0 \\ 0 & -1 \end{bmatrix}
\qquad
R \circ F : \begin{bmatrix} 0 & -1 \\ 1 & 0 \end{bmatrix}\begin{bmatrix} 0 & 1 \\ 1 & 0 \end{bmatrix} = \begin{bmatrix} -1 & 0 \\ 0 & 1 \end{bmatrix} .
$$

The first is the reflection in the $x$-axis, the second the reflection in the $y$-axis.
:::
::::

::::example[The angle addition formulas]
Rotating by $t$ and then by $s$ is rotating by $s + t$. Write out what this says about matrices.

:::solution
The composition has the product as its matrix, and it is also the rotation by $s + t$. A standard matrix is unique, so

$$
\begin{bmatrix} \cos(s + t) & -\sin(s + t) \\ \sin(s + t) & \cos(s + t) \end{bmatrix} = \begin{bmatrix} \cos s & -\sin s \\ \sin s & \cos s \end{bmatrix}\begin{bmatrix} \cos t & -\sin t \\ \sin t & \cos t \end{bmatrix} .
$$

Comparing the first column gives $\cos(s + t) = \cos s \cos t - \sin s \sin t$ and $\sin(s + t) = \sin s \cos t + \cos s \sin t$.
:::
::::

```python
s, t = var('s, t')
R(u) = matrix(SR, [[cos(u), -sin(u)], [sin(u), cos(u)]])
R(s) * R(t)     # first column: (cos(s)*cos(t) - sin(s)*sin(t), cos(t)*sin(s) + cos(s)*sin(t))
```

## Injective and surjective linear maps

### Reading the matrix

Injective and surjective are statements about the systems $A\mathbf x = \mathbf b$, so the answers are the ones
already known for columns.

::::theorem[Injective, surjective and the columns]
Let $T : \mathbb R^n \to \mathbb R^m$ be linear with standard matrix $A$.

1. $T$ is injective $\iff$ $A\mathbf x = \mathbf 0$ has only the solution $\mathbf 0$ $\iff$ the columns of $A$ are independent $\iff$ $\mathrm{rank}(A) = n$.
2. $T$ is surjective $\iff$ the columns of $A$ span $\mathbb R^m$ $\iff$ $\mathrm{rank}(A) = m$.
3. $T$ is bijective $\iff$ $m = n$ and $A$ is invertible.

:::proof
1. If $T$ is injective and $A\mathbf x = \mathbf 0 = A\mathbf 0$, then $\mathbf x = \mathbf 0$. Conversely, if $\mathbf 0$ is the only solution and
   $A\mathbf u = A\mathbf v$, then $A(\mathbf u - \mathbf v) = \mathbf 0$, so $\mathbf u = \mathbf v$. The remaining equivalences are the ones for
   independent columns.
2. $T$ is surjective exactly when $A\mathbf x = \mathbf b$ is consistent for every $\mathbf b \in \mathbb R^m$, which is what it means
   for the columns to span $\mathbb R^m$, and this needs a pivot in every row.
3. Both hold exactly when $\mathrm{rank}(A) = n$ and $\mathrm{rank}(A) = m$, which forces $m = n$, and then $A$ is
   invertible by the invertible matrix theorem. The converse is the same theorem.
:::
::::

The size of $A$ can settle a question before any computing. Since $\mathrm{rank}(A) \le \min(m, n)$:

- if $n > m$ (the domain is bigger), $T$ cannot be injective;
- if $n < m$ (the codomain is bigger), $T$ cannot be surjective.

:::steps[Injective or surjective from the matrix]
1. Find the standard matrix $A$, of size $m \times n$.
2. Compute the rank (the number of pivots in the RREF).
3. Rank $= n$: injective. Rank $= m$: surjective. Both: bijective.
4. For a "not injective" answer, give a nonzero vector of $\ker(A)$; for "not surjective", give a $\mathbf b$ for which $A\mathbf x = \mathbf b$ is inconsistent.
:::

::::example[A tall, a wide and a square matrix]
Classify $T_0(x, y) = (x + y, \ x - y, \ 2y)$, $T_1(x, y, z) = (x + z, \ y - z)$ and $T_2(x, y) = (x + 2y, \ 2x + 4y)$.

:::solution
$T_0 : \mathbb R^2 \to \mathbb R^3$ has $A_0 = \begin{bmatrix} 1 & 1 \\ 1 & -1 \\ 0 & 2 \end{bmatrix}$, of rank $2$. It is injective, and it cannot be surjective.

$T_1 : \mathbb R^3 \to \mathbb R^2$ has $A_1 = \begin{bmatrix} 1 & 0 & 1 \\ 0 & 1 & -1 \end{bmatrix}$, of rank $2$. It is surjective, and it cannot be injective:
$T_1(-1, 1, 1) = (0, 0)$.

$T_2 : \mathbb R^2 \to \mathbb R^2$ has $A_2 = \begin{bmatrix} 1 & 2 \\ 2 & 4 \end{bmatrix}$, of rank $1$. It is neither: $T_2(-2, 1) = (0, 0)$, and
every output has second entry twice the first, so $(1, 0)$ is not reached.
:::
::::

```python
A0 = matrix(QQ, [[1, 1], [1, -1], [0, 2]])
A1 = matrix(QQ, [[1, 0, 1], [0, 1, -1]])
A2 = matrix(QQ, [[1, 2], [2, 4]])
A0.rank(), A1.rank(), A2.rank()          # (2, 2, 1)
A1 * vector(QQ, [-1, 1, 1])              # (0, 0)
A2.augment(vector(QQ, [1, 0])).rref()    # [1 2 0; 0 0 1]: a pivot in the last column, inconsistent
```

::::example[Every rotation is bijective]
Show that the rotation by $t$ is bijective, for every $t$, and find its inverse.

:::solution
The matrix is square with $\det = \cos^2 t + \sin^2 t = 1 \neq 0$, so it is invertible and the map is bijective.
Undoing a rotation by $t$ is rotating by $-t$, and indeed

$$
\begin{bmatrix} \cos t & -\sin t \\ \sin t & \cos t \end{bmatrix}^{-1} = \begin{bmatrix} \cos t & \sin t \\ -\sin t & \cos t \end{bmatrix} = \begin{bmatrix} \cos(-t) & -\sin(-t) \\ \sin(-t) & \cos(-t) \end{bmatrix} .
$$
:::
::::

### The inverse of a linear map

::::theorem[The inverse of a bijective linear map]
If $T : \mathbb R^n \to \mathbb R^n$ is bijective with standard matrix $A$, then its inverse function is linear, with standard matrix $A^{-1}$.

:::proof
The map $S(\mathbf v) = A^{-1}\mathbf v$ is linear, and $S(T(\mathbf v)) = A^{-1}A\mathbf v = \mathbf v$ and $T(S(\mathbf v)) = AA^{-1}\mathbf v = \mathbf v$, so $S$ is the inverse of $T$.
:::
::::

:::insight
A linear map and its matrix are the same thing seen twice. Composition is the product, the inverse
map is the inverse matrix, injective is "independent columns", and surjective is "spanning columns".
:::

:::equations
- *Linear*: $T(\mathbf u + \mathbf v) = T(\mathbf u) + T(\mathbf v)$ and $T(c\,\mathbf v) = c\,T(\mathbf v)$; hence $T(\mathbf 0) = \mathbf 0$.
- *Standard matrix*: $A = [\,T(\mathbf e_0) \ \cdots \ T(\mathbf e_{n-1})\,]$, $T(\mathbf v) = A\mathbf v$.
- *Rotation by t*: $\begin{bmatrix} \cos t & -\sin t \\ \sin t & \cos t \end{bmatrix}$.
- *Composition*: $S \circ T$ has matrix $BA$ ($T$'s matrix on the right).
- *Injective*: $\mathrm{rank}(A) = n$. *Surjective*: $\mathrm{rank}(A) = m$. *Bijective*: $m = n$ and $\det(A) \neq 0$.
:::

## Further reading

- [3Blue1Brown — Linear transformations and matrices](https://www.3blue1brown.com/lessons/linear-transformations) — the columns as the images of the basis vectors, drawn.
- [3Blue1Brown — Matrix multiplication as composition](https://www.3blue1brown.com/lessons/matrix-multiplication) — why the product is defined as it is.
- [SageMath symbolic functions](https://doc.sagemath.org/html/en/reference/calculus/sage/symbolic/callable.html) — `T(x, y) = (…)` and how to evaluate it.
