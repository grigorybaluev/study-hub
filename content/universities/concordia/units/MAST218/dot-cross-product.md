---
title: Dot product and cross product
order: 7
status: outline
weeks: [4]
introduces: []
requires:
  - {concept: vector, strength: hard}
reinforces:
  - {concept: dot-product, perspective: "component formula, algebraic rules, the parallelogram identity and the angle formula a · b = |a||b| cos θ"}
  - cross-product
---

Two ways to multiply vectors. The dot product turns two vectors into a number that measures how
much they point the same way: lengths, angles and perpendicularity all come from it. The cross
product (normals, areas, volumes) follows once it has been taught.

## The dot product

### Definition

:::definition[Dot product]
For $\mathbf{a} = \langle a_1, a_2, \dots, a_n \rangle$ and $\mathbf{b} = \langle b_1, b_2, \dots, b_n \rangle$,
the **dot product** (also inner or scalar product) is the number

$$
\mathbf{a} \cdot \mathbf{b} = a_1b_1 + a_2b_2 + \dots + a_nb_n .
$$
:::

::::example[A dot product in space]
Compute $\langle 2, -1, 3 \rangle \cdot \langle -1, 4, 5 \rangle$.

:::solution
Multiply matching components and add:

$$
2 \cdot (-1) + (-1) \cdot 4 + 3 \cdot 5 = -2 - 4 + 15 = 9 .
$$
:::
::::

The result is a scalar, not a vector. So $\mathbf{a} \cdot \mathbf{0} = 0$ (a number), and an
expression such as $(\mathbf{a} \cdot \mathbf{b}) \cdot \mathbf{c}$ is meaningless: the bracket is
already a number, and a number cannot be dotted with a vector.

### Properties

::::proposition[Rules of the dot product]
For vectors $\mathbf{a}, \mathbf{b}, \mathbf{c}$ in $V_n$ and a scalar $c$:

1. $\mathbf{a} \cdot \mathbf{a} = a_1^2 + a_2^2 + \dots + a_n^2 = |\mathbf{a}|^2$;
2. $c(\mathbf{a} \cdot \mathbf{b}) = (c\mathbf{a}) \cdot \mathbf{b} = \mathbf{a} \cdot (c\mathbf{b})$;
3. $\mathbf{a} \cdot \mathbf{b} = \mathbf{b} \cdot \mathbf{a}$;
4. $\mathbf{a} \cdot (\mathbf{b} + \mathbf{c}) = \mathbf{a} \cdot \mathbf{b} + \mathbf{a} \cdot \mathbf{c}$;
5. $(\mathbf{a} + \mathbf{b}) \cdot \mathbf{c} = \mathbf{a} \cdot \mathbf{c} + \mathbf{b} \cdot \mathbf{c}$.

:::proof
Each rule holds in every component, because it holds for numbers. For rule 4, the $i$-th term
of $\mathbf{a} \cdot (\mathbf{b} + \mathbf{c})$ is $a_i(b_i + c_i) = a_ib_i + a_ic_i$; summing over
$i$ gives $\mathbf{a} \cdot \mathbf{b} + \mathbf{a} \cdot \mathbf{c}$. Rule 1 is the length formula
squared, and rule 5 follows from rules 3 and 4.
:::
::::

Rule 1 links the dot product to length, and rules 2–5 let a dot product of sums be expanded like
a product of brackets in algebra.

::::example[The parallelogram identity]
Expand $|\mathbf{a} + \mathbf{b}|^2$ and $|\mathbf{a} - \mathbf{b}|^2$, and add them.

:::solution
By rule 1, a squared length is a dot product with itself; expand with rules 3–5:

$$
|\mathbf{a} + \mathbf{b}|^2 = (\mathbf{a} + \mathbf{b}) \cdot (\mathbf{a} + \mathbf{b}) = |\mathbf{a}|^2 + 2\,\mathbf{a} \cdot \mathbf{b} + |\mathbf{b}|^2 ,
$$

and in the same way

$$
|\mathbf{a} - \mathbf{b}|^2 = |\mathbf{a}|^2 - 2\,\mathbf{a} \cdot \mathbf{b} + |\mathbf{b}|^2 .
$$

Adding, the middle terms cancel:

$$
|\mathbf{a} + \mathbf{b}|^2 + |\mathbf{a} - \mathbf{b}|^2 = 2|\mathbf{a}|^2 + 2|\mathbf{b}|^2 .
$$

$\mathbf{a} + \mathbf{b}$ and $\mathbf{a} - \mathbf{b}$ are the two diagonals of the parallelogram
on $\mathbf{a}$ and $\mathbf{b}$: the squares of the diagonals add up to the squares of the four
sides.
:::
::::

### The angle between two vectors

The angle $\theta$ between nonzero vectors $\mathbf{a}$ and $\mathbf{b}$ is the angle between them
when they are drawn from the same tail, taken in $0 \le \theta \le \pi$.

::::theorem[Geometric form of the dot product]
For nonzero vectors $\mathbf{a}$ and $\mathbf{b}$ with angle $\theta$ between them,

$$
\mathbf{a} \cdot \mathbf{b} = |\mathbf{a}|\,|\mathbf{b}| \cos\theta .
$$

:::proof
Draw $\mathbf{a}$ and $\mathbf{b}$ from one tail. The third side of the triangle they span is
$\mathbf{a} - \mathbf{b}$, and the law of cosines gives

$$
|\mathbf{a} - \mathbf{b}|^2 = |\mathbf{a}|^2 + |\mathbf{b}|^2 - 2|\mathbf{a}|\,|\mathbf{b}| \cos\theta .
$$

The expansion in the last example gives $|\mathbf{a} - \mathbf{b}|^2 = |\mathbf{a}|^2 - 2\,\mathbf{a} \cdot \mathbf{b} + |\mathbf{b}|^2$.
Comparing the two, $\mathbf{a} \cdot \mathbf{b} = |\mathbf{a}|\,|\mathbf{b}| \cos\theta$. (If the
vectors are parallel the triangle is flat, and both sides are $\pm|\mathbf{a}|\,|\mathbf{b}|$.)
:::
::::

The component formula is easy to compute, and the geometric formula says what the number means:
the dot product is positive when the angle is acute, zero when it is a right angle, and negative
when it is obtuse.

:::caution[The angle between two vectors is at most $\pi$]
The angle between two vectors is never more than $\pi$. $\cos\theta$ is decreasing on $[0, \pi]$,
so the sign and size of $\mathbf{a} \cdot \mathbf{b}$ pin $\theta$ down exactly; an angle such as
$\frac{3\pi}{2}$ would make the formula ambiguous.
:::

:::equations{#dot}
- *Definition*: $\mathbf{a} \cdot \mathbf{b} = a_1b_1 + \dots + a_nb_n$, a scalar.
- *Length*: $\mathbf{a} \cdot \mathbf{a} = |\mathbf{a}|^2$.
- *Parallelogram identity*: $|\mathbf{a} + \mathbf{b}|^2 + |\mathbf{a} - \mathbf{b}|^2 = 2|\mathbf{a}|^2 + 2|\mathbf{b}|^2$.
- *Angle*: $\mathbf{a} \cdot \mathbf{b} = |\mathbf{a}|\,|\mathbf{b}| \cos\theta$, $0 \le \theta \le \pi$.
:::

## Further reading

- [Paul's Online Notes — Dot Product](https://tutorial.math.lamar.edu/Classes/CalcII/DotProduct.aspx) — the component and angle forms, with the proof by the law of cosines.
- [Wikipedia — Dot product](https://en.wikipedia.org/wiki/Dot_product) — the algebraic and geometric definitions and why they agree.
