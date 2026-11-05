---
title: Complex numbers
order: 10
status: detailed
weeks: [10]
introduces: [complex-numbers]
requires:
  - {concept: trigonometric-functions, strength: soft}
  - {concept: polar-coordinates, strength: soft}
  - {concept: matrix, strength: soft}
  - {concept: computer-algebra-system, strength: soft}
reinforces:
  - {concept: linear-transformation, perspective: "multiplication by a complex number as a rotation and scaling of the plane"}
---

The equation $x^2 + 1 = 0$ has no real solution, and neither does the characteristic equation of a rotation,
which is coming in the next unit. Adding one new number $i$ with $i^2 = -1$ repairs this completely: in the
**complex numbers** every polynomial equation has a solution. Complex numbers are also points of the plane,
and multiplying by one of them is a rotation combined with a scaling, so they fit the linear algebra of the
previous units naturally.

## The complex numbers

### Definition

:::definition[Complex number]
A **complex number** is an expression $z = a + bi$ with $a, b \in \mathbb R$, where $i$ is a symbol with $i^2 = -1$. The set of all
of them is $\mathbb C$. The number $a = \mathrm{Re}(z)$ is the **real part** and $b = \mathrm{Im}(z)$ is the **imaginary part** (a real number,
without the $i$). Two complex numbers are equal when both parts are equal.
:::

A real number $a$ is the complex number $a + 0i$, and $bi = 0 + bi$ is called **purely imaginary**. The number $a + bi$ is drawn
as the point $(a, b)$ of the **complex plane**, with the real axis horizontal and the imaginary axis vertical.

### Arithmetic

Add and multiply as with polynomials in $i$, replacing $i^2$ by $-1$:

$$
(a + bi) + (c + di) = (a + c) + (b + d)i , \qquad (a + bi)(c + di) = (ac - bd) + (ad + bc)i .
$$

These operations obey the familiar rules: commutative, associative, distributive, with $0$ and $1$ as usual. Addition and
real scaling are those of $\mathbb R^2$, so $\mathbb C$ is a real vector space of dimension $2$ with basis $(1, i)$. What $\mathbb R^2$ does not
have is the product.

::::example[A product]
Compute $(2 + 3i)(1 - 4i)$.

:::solution
$$
(2 + 3i)(1 - 4i) = 2 - 8i + 3i - 12i^2 = 2 - 5i + 12 = 14 - 5i .
$$
:::
::::

### Conjugate, modulus and division

:::definition[Conjugate and modulus]
For $z = a + bi$, the **conjugate** is $\bar z = a - bi$ (the reflection in the real axis) and the **modulus** is $|z| = \sqrt{a^2 + b^2}$
(the distance from $0$).
:::

The product of a number with its conjugate is real and not negative:

$$
z\,\bar z = (a + bi)(a - bi) = a^2 + b^2 = |z|^2 .
$$

This is what makes division work. To divide, multiply above and below by the conjugate of the denominator, which turns the
denominator into a positive real number.

$$
\frac{1}{z} = \frac{\bar z}{|z|^2} \quad (z \neq 0), \qquad \frac{w}{z} = \frac{w\,\bar z}{|z|^2} .
$$

::::example[A quotient]
Write $\dfrac{3 + i}{1 - 2i}$ in the form $a + bi$.

:::solution
$$
\frac{3 + i}{1 - 2i} = \frac{(3 + i)(1 + 2i)}{(1 - 2i)(1 + 2i)} = \frac{3 + 6i + i - 2}{1 + 4} = \frac{1 + 7i}{5} = \frac15 + \frac75 i .
$$
:::
::::

::::theorem[Rules for conjugates and moduli]
For $z, w \in \mathbb C$:

1. $\overline{z + w} = \bar z + \bar w$, $\overline{zw} = \bar z\,\bar w$, and $\bar{\bar z} = z$;
2. $z$ is real if and only if $\bar z = z$;
3. $\mathrm{Re}(z) = \frac{z + \bar z}{2}$ and $\mathrm{Im}(z) = \frac{z - \bar z}{2i}$;
4. $|zw| = |z|\,|w|$, $|\bar z| = |z|$, and $|z + w| \le |z| + |w|$.

:::proof
For $\overline{zw} = \bar z\,\bar w$: with $z = a + bi$, $w = c + di$, both sides equal $(ac - bd) - (ad + bc)i$. For the modulus of a
product: $|zw|^2 = zw\,\overline{zw} = z\bar z\,w\bar w = |z|^2|w|^2$. The inequality is the triangle inequality in the plane. The other parts are direct
computations.
:::
::::

Sage knows $i$ as `I`.

```python
z = 2 + 3*I
w = 1 - 4*I
z * w                                   # -5*I + 14
(3 + I) / (1 - 2*I)                     # 7/5*I + 1/5
z.real(), z.imag()                      # (2, 3)
z.conjugate()                           # -3*I + 2
abs(z)                                  # sqrt(13)
z * z.conjugate()                       # 13
```

:::caution[The imaginary part is real]
$\mathrm{Im}(2 + 3i)$ is $3$, not $3i$. And $|2 + 3i| = \sqrt{13}$, not $\sqrt{2^2 + (3i)^2}$: the $i$ never enters the modulus.
:::

## Polar form

### Modulus and argument

A point of the plane can also be given by its distance from the origin and its angle.

:::definition[Polar form]
A nonzero $z = a + bi$ can be written $z = r(\cos\theta + i\sin\theta)$ with $r = |z|$. Any such angle $\theta$ is an **argument** of $z$, and the one in
$(-\pi, \pi]$ is the **principal argument**. It satisfies $\cos\theta = \frac{a}{r}$ and $\sin\theta = \frac{b}{r}$.
:::

:::definition[Euler's notation]
For real $\theta$, $e^{i\theta}$ stands for $\cos\theta + i\sin\theta$. So the polar form is $z = r e^{i\theta}$, and $\overline{r e^{i\theta}} = r e^{-i\theta}$.
:::

::::example[Finding the polar form]
Write $1 + i$ and $-\sqrt3 + i$ in polar form.

:::solution
$|1 + i| = \sqrt2$, and the point $(1, 1)$ is at angle $\frac{\pi}{4}$, so $1 + i = \sqrt2\,e^{i\pi/4}$.

$|-\sqrt3 + i| = 2$, with $\cos\theta = -\frac{\sqrt3}{2}$ and $\sin\theta = \frac12$, so $\theta = \frac{5\pi}{6}$ and $-\sqrt3 + i = 2\,e^{5\pi i/6}$.
:::
::::

:::caution[Check the quadrant]
$\arctan(b/a)$ gives an angle in $(-\frac{\pi}{2}, \frac{\pi}{2})$, which is wrong when $a < 0$. For $-\sqrt3 + i$ it gives $-\frac{\pi}{6}$, the argument of $\sqrt3 - i$. Find
the quadrant from the signs of $a$ and $b$, or use `arg(z)` in Sage.
:::

### Multiplying in polar form

::::theorem[Multiplication in polar form]
$\bigl(r_0 e^{i\theta_0}\bigr)\bigl(r_1 e^{i\theta_1}\bigr) = r_0 r_1\,e^{i(\theta_0 + \theta_1)}$: multiply the moduli and add the arguments.

:::proof
$$
(\cos\theta_0 + i\sin\theta_0)(\cos\theta_1 + i\sin\theta_1) = (\cos\theta_0\cos\theta_1 - \sin\theta_0\sin\theta_1) + i(\sin\theta_0\cos\theta_1 + \cos\theta_0\sin\theta_1) ,
$$

which is $\cos(\theta_0 + \theta_1) + i\sin(\theta_0 + \theta_1)$ by the angle addition formulas.
:::
::::

So multiplying by $w = r e^{i\theta}$ rotates the whole plane by $\theta$ and scales it by $r$. Multiplying by $i = e^{i\pi/2}$ is a quarter turn.

In the sliders below, the triangle with corners $0$, $1$, $z$ turns into the triangle $0$, $w$, $wz$: the same shape, rotated and scaled.

```sim
id: la-complex-multiply
controls:
  - {id: zr, label: "Re z", min: -3, max: 3, step: 0.1, default: 1.5, decimals: 1}
  - {id: zi, label: "Im z", min: -3, max: 3, step: 0.1, default: 1, decimals: 1}
  - {id: r, label: "|w|", min: 0, max: 2, step: 0.05, default: 1.2, decimals: 2}
  - {id: th, label: "arg w (degrees)", min: -180, max: 180, step: 5, default: 60, decimals: 0}
note: 'Blue: z and the triangle 0, 1, z. Gold: w. Green: the product wz and the triangle 0, w, wz, which is the first triangle rotated by arg w and scaled by |w|. The title checks |wz| = |w||z| and arg(wz) = arg w + arg z (up to a full turn). With |w| = 1 the map is a pure rotation; arg w = 90° and |w| = 1 is multiplication by i.'
```

```python
w = 2 * exp(I * pi / 3)                 # modulus 2, argument pi/3
z = 1 + I
abs(w * z).n(), (abs(w) * abs(z)).n()   # (2.82842712474619, 2.82842712474619)
arg(1 + I)                              # 1/4*pi
arg(-sqrt(3) + I).n()                   # 2.61799387799149, which is 5*pi/6
```

The same fact in matrix form: with $w = a + bi$ and $z = x + yi$, we have $wz = (ax - by) + (bx + ay)i$. So multiplication by $w$ is the linear map of the plane

$$
\begin{bmatrix} x \\ y \end{bmatrix} \longmapsto \begin{bmatrix} a & -b \\ b & a \end{bmatrix}\begin{bmatrix} x \\ y \end{bmatrix} , \qquad \begin{bmatrix} a & -b \\ b & a \end{bmatrix} = r\begin{bmatrix} \cos\theta & -\sin\theta \\ \sin\theta & \cos\theta \end{bmatrix} ,
$$

a rotation matrix scaled by $r$.

### Powers and roots

:::theorem[De Moivre's formula]
For every integer $n$: $\bigl(r e^{i\theta}\bigr)^n = r^n e^{in\theta}$, that is, $(\cos\theta + i\sin\theta)^n = \cos n\theta + i\sin n\theta$.
:::

For positive $n$ this is the multiplication rule applied $n$ times.

::::example[A high power]
Compute $(1 + i)^{10}$.

:::solution
$(1 + i)^{10} = (\sqrt2)^{10}\,e^{10\pi i/4} = 32\,e^{5\pi i/2} = 32\,e^{i\pi/2} = 32i$, after removing a full turn from the angle.
:::
::::

:::theorem[The n-th roots of a complex number]
A nonzero $w = r e^{i\theta}$ has exactly $n$ distinct $n$-th roots:

$$
z_k = r^{1/n}\,e^{i(\theta + 2\pi k)/n} , \qquad k = 0, 1, \dots, n - 1 .
$$

They lie on a circle of radius $r^{1/n}$, equally spaced at angles of $\frac{2\pi}{n}$.
:::

:::proof
Let $z = s\,e^{i\phi}$. Then $z^n = s^n e^{in\phi}$ equals $w$ exactly when $s^n = r$ and $n\phi = \theta + 2\pi k$ for an integer $k$. The values
$k = 0, \dots, n - 1$ give different points, and any other $k$ repeats one of them.
:::

::::example[The cube roots of 8i]
Find all $z$ with $z^3 = 8i$.

:::solution
$8i = 8\,e^{i\pi/2}$, so the roots have modulus $2$ and arguments $\frac{\pi}{6}$, $\frac{\pi}{6} + \frac{2\pi}{3} = \frac{5\pi}{6}$ and $\frac{\pi}{6} + \frac{4\pi}{3} = \frac{3\pi}{2}$:

$$
z_0 = 2\,e^{i\pi/6} = \sqrt3 + i , \qquad z_1 = 2\,e^{5\pi i/6} = -\sqrt3 + i , \qquad z_2 = 2\,e^{3\pi i/2} = -2i .
$$

Check: $(-2i)^3 = -8i^3 = 8i$.
:::
::::

```python
(1 + I)^10                              # 32*I
CC(8*I).nth_root(3, all=True)           # sqrt(3) + i, -sqrt(3) + i, -2i in floating point
```

## Polynomials and the fundamental theorem

### Every polynomial has a root

A quadratic with real coefficients and negative discriminant now has two roots: for $x^2 - 4x + 13 = 0$,

$$
x = \frac{4 \pm \sqrt{16 - 52}}{2} = \frac{4 \pm 6i}{2} = 2 \pm 3i .
$$

The remarkable fact is that no further numbers are ever needed.

:::theorem[Fundamental theorem of algebra]
Every polynomial of degree $n \ge 1$ with complex coefficients has at least one root in $\mathbb C$.
:::

The proof needs tools from analysis and is not given here. Its consequence is the one used in practice.

::::corollary[Complete factorization]
A polynomial of degree $n \ge 1$ with leading coefficient $a$ factors over $\mathbb C$ as

$$
p(x) = a\,(x - z_0)(x - z_1)\cdots(x - z_{n-1}) .
$$

Counting each root as often as its factor appears, it has exactly $n$ roots.

:::proof
By the theorem, $p$ has a root $z_0$. Dividing by $x - z_0$ leaves no remainder, so $p(x) = (x - z_0)\,q(x)$ with $\deg q = n - 1$. Repeat with $q$.
:::
::::

:::definition[Multiplicity of a root]
The **multiplicity** of a root $z$ of $p$ is the number of times the factor $x - z$ appears in the complete factorization.
:::

::::theorem[Conjugate roots]
If $p$ has **real** coefficients and $p(z) = 0$, then $p(\bar z) = 0$. So the non-real roots of a real polynomial come in conjugate pairs.

:::proof
Let $p(x) = \sum_k a_k x^k$ with real $a_k$. By the rules for conjugates,

$$
p(\bar z) = \sum_k a_k \bar z^{\,k} = \sum_k \overline{a_k z^k} = \overline{\sum_k a_k z^k} = \overline{p(z)} = \bar 0 = 0 .
$$
:::
::::

:::corollary[Real polynomials of odd degree]
A polynomial with real coefficients and odd degree has at least one real root.
:::

The non-real roots pair off, and an odd count cannot be made of pairs.

::::example[Factoring a cubic]
Find all the roots of $p(x) = x^3 - 5x^2 + 17x - 13$, and factor it over $\mathbb R$ and over $\mathbb C$.

:::solution
Trying the divisors of $13$: $p(1) = 1 - 5 + 17 - 13 = 0$. Dividing by $x - 1$ gives $p(x) = (x - 1)(x^2 - 4x + 13)$, and the quadratic has
the roots $2 \pm 3i$ found above. So the roots are $1$, $2 + 3i$, $2 - 3i$, a conjugate pair and one real root, and over $\mathbb C$:

$$
p(x) = (x - 1)\bigl(x - (2 + 3i)\bigr)\bigl(x - (2 - 3i)\bigr) .
$$

Over $\mathbb R$ the factorization stops at $(x - 1)(x^2 - 4x + 13)$.
:::
::::

```python
R.<x> = QQ[]
p = x^3 - 5*x^2 + 17*x - 13
p.factor()                              # (x - 1) * (x^2 - 4*x + 13)
p.roots(QQbar)                          # [(1, 1), (2 - 3*I, 1), (2 + 3*I, 1)]: (root, multiplicity)
```

### Why linear algebra needs this

Everything done so far with matrices over $\mathbb R$ works over $\mathbb C$: complex scalars, vectors in $\mathbb C^n$, row reduction, determinants. Only
the arithmetic of the entries changes.

::::example[A complex matrix]
Find the determinant and the inverse of $A = \begin{bmatrix} 1 & i \\ -i & 2 \end{bmatrix}$.

:::solution
$\det A = 1 \cdot 2 - (i)(-i) = 2 + i^2 = 2 - 1 = 1$. By the formula for $2 \times 2$ inverses, $A^{-1} = \begin{bmatrix} 2 & -i \\ i & 1 \end{bmatrix}$.
:::
::::

```python
A = matrix(QQbar, [[1, I], [-I, 2]])
det(A)                                  # 1
A.inverse()                             # [2 -I; I 1]
```

The characteristic polynomial of a real matrix can have non-real roots. By the fundamental theorem, an $n \times n$ matrix has
exactly $n$ eigenvalues in $\mathbb C$, counted with multiplicity, and by the conjugate roots theorem the non-real ones of a real
matrix come in pairs.

:::insight
Complex numbers are the plane with a product. Their addition is that of vectors; their multiplication is rotation and
scaling. They give every polynomial a full set of roots, and this is what linear algebra needs from them.
:::

:::equations
- *Product*: $(a + bi)(c + di) = (ac - bd) + (ad + bc)i$.
- *Conjugate*: $z\bar z = |z|^2$; $\frac{w}{z} = \frac{w\bar z}{|z|^2}$; $\overline{zw} = \bar z\,\bar w$; $|zw| = |z||w|$.
- *Polar form*: $z = r(\cos\theta + i\sin\theta) = re^{i\theta}$; multiply the moduli, add the arguments.
- *De Moivre*: $(re^{i\theta})^n = r^n e^{in\theta}$.
- *n-th roots*: $r^{1/n}e^{i(\theta + 2\pi k)/n}$, $k = 0, \dots, n - 1$.
- *Fundamental theorem*: degree $n$ means $n$ roots in $\mathbb C$, with multiplicity; a real polynomial's non-real roots come in conjugate pairs.
:::

## Further reading

- [Complex number (Wikipedia)](https://en.wikipedia.org/wiki/Complex_number) — the arithmetic, the plane and the polar form.
- [Fundamental theorem of algebra (Wikipedia)](https://en.wikipedia.org/wiki/Fundamental_theorem_of_algebra) — the statement and several proofs.
- [SageMath algebraic numbers](https://doc.sagemath.org/html/en/reference/number_fields/sage/rings/qqbar.html) — `QQbar`, where the roots of polynomials are exact.
