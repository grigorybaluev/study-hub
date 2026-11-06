---
title: Is it a subspace?
order: 5
asks: decide whether a subset of a vector space is a subspace, with a proof or a counterexample
units: [vector-spaces-subspaces]
method: is-it-a-subspace
---

## Logic

A subset is a subspace when the operations cannot leave it. Three checks do it: the zero vector, sums, multiples. A linear condition (homogeneous
equations in the coordinates) always gives a subspace; a constant term, a product of unknowns, an inequality or a square almost never does.

## Pattern

:::steps[Three checks]
1. Name the ambient space and its zero vector.
2. Is $\mathbf 0$ in the set? If not, stop.
3. Read the condition. Linear and homogeneous, or a span: it is a subspace, say so and name the matrix or the span.
4. Otherwise take arbitrary $\mathbf u,\mathbf v$ in the set and $c\in\mathbb R$, and write what membership means for each.
5. If a closure breaks, find numbers that show it: one counterexample is a complete answer.
:::

## In Sage

Sage helps most in looking for a counterexample, and in checking the algebra of a closure.

```python
# Is {(x, y): x^2 = y^2} closed under addition?
inW = lambda v: v[0]^2 == v[1]^2
u, v = vector(QQ, [1, 1]), vector(QQ, [1, -1])
inW(u), inW(v), inW(u + v)              # (True, True, False)

# Is {p in P_2 : p(0) = p(1)} closed under addition? Symbolic coefficients:
x = var('x')
a0, a1, a2, b0, b1, b2 = var('a0, a1, a2, b0, b1, b2')
p(x) = a0 + a1*x + a2*x^2
q(x) = b0 + b1*x + b2*x^2
((p + q)(0) - (p + q)(1)).expand()      # -a1 - a2 - b1 - b2, which is 0 when a1 + a2 = b1 + b2 = 0
```

## Traps

:::caution[Traps]
- Containing $\mathbf 0$ does not prove anything: the first quadrant and the two axes both contain it.
- Closure under addition alone is not enough: the first quadrant has it, and fails for $c=-1$.
- $\mathbf u,\mathbf v$ must be **arbitrary**: an example of closure is not a proof, while an example of failure is.
- The zero of a space of matrices is the zero matrix, and the zero of a function space is the zero function.
- The solutions of $A\mathbf x=\mathbf b$ with $\mathbf b\neq\mathbf 0$ are never a subspace.
:::

## Worked problems

::::exercise[Four subsets]
Which are subspaces? (a) $\{(x,y,z):x=2y\}$ in $\mathbb R^3$; (b) $\{(x,y):x^2=y^2\}$ in $\mathbb R^2$; (c) $\{A\in\mathbb R^{2\times2}:\mathrm{tr}(A)=0\}$; (d) $\{p\in\mathcal P_2:p(0)=1\}$.

:::solution
(a) Yes: it is the kernel of $\begin{bmatrix}1&-2&0\end{bmatrix}$.

(b) No: $(1,1)$ and $(1,-1)$ are in it, and their sum $(2,0)$ is not.

(c) Yes: the zero matrix has trace $0$; $\mathrm{tr}(A+B)=\mathrm{tr}(A)+\mathrm{tr}(B)=0$ and $\mathrm{tr}(cA)=c\,\mathrm{tr}(A)=0$.

(d) No: the zero polynomial has $p(0)=0\neq1$.
:::
::::

:::note[Pattern at work]
(a) is step 3, (d) is step 2, (c) is step 4, and (b) is step 5: the square in the condition is the warning sign.
:::

```solution-map
id: equal-values-subspace
method: is-it-a-subspace
task: 'Is $W=\{p\in\mathcal P_2:p(0)=p(1)\}$ a subspace of $\mathcal P_2$? Find its dimension.'
steps:
  - node: zero
    answer: yes
    text: 'The zero polynomial has $p(0)=p(1)=0$.'
  - node: recognise
    answer: yes
    text: 'Write $p=a+bx+cx^2$. The condition $a=a+b+c$ says $b+c=0$: one homogeneous linear equation in the coefficients.'
  - node: known
    text: 'So $W$ corresponds to the kernel of $\begin{bmatrix}0&1&1\end{bmatrix}$, and $p=a+b(x-x^2)$ shows that $W=\mathrm{span}\{1,\ x-x^2\}$.'
  - node: subspace
    text: '$W$ is a subspace, of dimension $2$.'
```

::::exercise[Sums and intersections]
Let $U=\{(x,y,z):x+y+z=0\}$ and $W=\{(x,y,z):x-y=0\}$ in $\mathbb R^3$. Find a basis of $U\cap W$. Is $U\cup W$ a subspace?

:::solution
$U\cap W$ is the solution set of both equations: the kernel of $\begin{bmatrix}1&1&1\\1&-1&0\end{bmatrix}$. With $z$ free, $x=y=-\frac z2$, so a basis is $(1,1,-2)$.

$U\cup W$ is not a subspace: $(1,-1,0)\in U$ and $(1,1,1)\in W$, and their sum $(2,0,1)$ is in neither.

```python
M = matrix(QQ, [[1, 1, 1], [1, -1, 0]])
M.right_kernel().basis()                # [(1, 1, -2)]
```
:::
::::

:::note[Pattern at work]
An intersection stacks the equations, so it is one kernel. For the union, pick a vector from each set outside the other: step 5.
:::
