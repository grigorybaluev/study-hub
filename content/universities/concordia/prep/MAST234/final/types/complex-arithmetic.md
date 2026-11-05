---
title: Complex numbers
order: 10
asks: compute with complex numbers, convert to polar form, find powers and roots, find all the roots of a polynomial
units: [complex-numbers]
---

## Logic

Sums and products are easiest in the form $a+bi$; powers and roots are easiest in polar form, because multiplying multiplies the moduli and adds the arguments. Dividing means multiplying by the conjugate. A polynomial of degree $n$ has
exactly $n$ roots in $\mathbb C$, and the non-real roots of a real polynomial come in conjugate pairs, so one complex root gives a quadratic factor.

## Pattern

:::steps[Choosing the form]
1. Sum, product, quotient: stay with $a+bi$. For a quotient, multiply above and below by the conjugate of the denominator.
2. High power or root: go to polar form. $r=|z|$, and find $\theta$ from the quadrant.
3. Power: $r^ne^{in\theta}$. Remove full turns from the angle.
4. $n$-th roots: modulus $r^{1/n}$, arguments $\frac{\theta+2\pi k}{n}$ for $k=0,\dots,n-1$.
5. Polynomial: find a root, divide, repeat; use the conjugate of a known root when the coefficients are real.
:::

## In Sage

```python
z = 1 + 2*I
w = 3 - I
z / w                                   # 7/10*I + 1/10
abs(z), z.conjugate(), z.real(), z.imag()    # (sqrt(5), -2*I + 1, 1, 2)
arg(-1 - I)                             # -3/4*pi
(-1 - I)^6                              # -8*I
CC(-16).nth_root(4, all=True)           # the four fourth roots, in floating point
R.<x> = QQ[]
(x^3 - 4*x^2 + 6*x - 4).roots(QQbar)    # [(2, 1), (1 - 1*I, 1), (1 + 1*I, 1)]
```

`I` is the imaginary unit. `CC` works in floating point, while `QQbar` is exact.

## Traps

:::caution[Traps]
- The quadrant: $\arctan(b/a)$ is wrong when $a<0$. For $-1-i$ the argument is $-\frac{3\pi}{4}$, not $\frac{\pi}{4}$.
- $\mathrm{Im}(a+bi)=b$, without the $i$.
- There are $n$ $n$-th roots, not one, and they are equally spaced. Do not stop at the obvious one.
- Conjugate pairs need **real** coefficients: $x-i$ alone is a polynomial with one non-real root.
- Sage also knows the imaginary unit as `i`, until a loop such as `for i in range(3)` reassigns it. Write `I`.
:::

## Worked problems

::::exercise[A quotient and a high power]
Write $\dfrac{1+2i}{3-i}$ in the form $a+bi$, and compute $(-1-i)^6$.

:::solution
$$
\frac{1+2i}{3-i}=\frac{(1+2i)(3+i)}{(3-i)(3+i)}=\frac{3+i+6i-2}{10}=\frac{1}{10}+\frac{7}{10}i .
$$

$-1-i$ has modulus $\sqrt2$ and argument $-\frac{3\pi}{4}$, so $(-1-i)^6=8\,e^{-9\pi i/2}=8\,e^{-i\pi/2}=-8i$, after adding two full turns to the angle.
:::
::::

:::note[Pattern at work]
Step 1 for the quotient, steps 2–3 for the power. Multiplying six times is possible and slower.
:::

::::exercise[Fourth roots]
Find all $z$ with $z^4=-16$.

:::solution
$-16=16\,e^{i\pi}$, so the roots have modulus $2$ and arguments $\frac{\pi}{4}$, $\frac{3\pi}{4}$, $\frac{5\pi}{4}$, $\frac{7\pi}{4}$:

$$
z=\sqrt2\,(1+i), \quad \sqrt2\,(-1+i), \quad \sqrt2\,(-1-i), \quad \sqrt2\,(1-i) .
$$

```python
R.<x> = QQ[]
(x^4 + 16).roots(QQbar)                 # four simple roots, approximately +-1.414 +- 1.414*I
```
:::
::::

:::note[Pattern at work]
Step 4: four roots, a quarter turn apart on a circle of radius 2, and in two conjugate pairs, since $x^4+16$ has real coefficients.
:::

::::exercise[A polynomial from one root]
Show that $1+i$ is a root of $p(x)=x^3-4x^2+6x-4$, and find the other roots.

:::solution
$(1+i)^2=2i$ and $(1+i)^3=-2+2i$, so $p(1+i)=(-2+2i)-8i+6+6i-4=0$.

The coefficients are real, so $1-i$ is also a root, and $(x-1-i)(x-1+i)=x^2-2x+2$ divides $p$. Dividing: $p(x)=(x-2)(x^2-2x+2)$. The third root is $2$.

```python
R.<x> = QQ[]
p = x^3 - 4*x^2 + 6*x - 4
p.factor()                              # (x - 2) * (x^2 - 2*x + 2)
```
:::
::::

:::note[Pattern at work]
Step 5: one complex root of a real polynomial gives a real quadratic factor, which leaves a smaller polynomial.
:::
