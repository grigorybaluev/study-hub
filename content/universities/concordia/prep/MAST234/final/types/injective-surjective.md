---
title: Injective, surjective, bijective
order: 4
asks: decide whether a linear map is injective, surjective or bijective, with a witness when it is not
units: [linear-transformations-rn, linear-transformations-general]
method: injective-surjective
---

## Logic

For a linear map there is no need to compare pairs of inputs: injective means the kernel is $\{\mathbf 0\}$. Both questions become one rank. Before
computing anything, compare the dimensions, because rank–nullity may settle the answer. When the two dimensions are equal, the two properties stand or fall together.

## Pattern

:::steps[Classifying a linear map]
1. Write the two dimensions: $T:V\to W$ with $\dim V=n$, $\dim W=m$.
2. $n>m$: not injective. $n<m$: not surjective. $n=m$: one check is enough.
3. Find the matrix of $T$ and its rank $r$. Injective $\iff r=n$; surjective $\iff r=m$.
4. A square matrix: $\det\neq0$ gives bijective at once.
5. A "no" needs a witness: a nonzero $\mathbf v$ with $T(\mathbf v)=\mathbf 0$, or a $\mathbf b$ for which $A\mathbf x=\mathbf b$ is inconsistent.
:::

## In Sage

```python
A = matrix(QQ, [[1, -1, 0], [0, 1, -1], [-1, 0, 1]])
n, m = A.ncols(), A.nrows()
r = A.rank()
r == n, r == m                          # (False, False): neither
A.right_kernel().basis()                # [(1, 1, 1)]: a witness for "not injective"
A.augment(vector(QQ, [1, 0, 0])).rank() # 3, larger than r: (1, 0, 0) is not reached
```

## Traps

:::caution[Traps]
- Injective means rank $=n$, the **domain** dimension. Surjective means rank $=m$, the **codomain** dimension. Do not swap them.
- $n=m$ does not mean bijective: it only means that one property implies the other.
- For polynomial or matrix spaces, the sizes are the dimensions: $\mathcal P_2\to\mathbb R^2$ is a map from dimension $3$ to dimension $2$.
- A witness for "not surjective" must be checked: show that the system really is inconsistent.
:::

## Worked problems

::::exercise[A square matrix of rank 2]
Classify $T(x,y,z)=(x-y,\ y-z,\ z-x)$ on $\mathbb R^3$.

:::solution
The entries add to $0$ in every output, so the rows of the matrix are dependent. The rank is $2$: $T$ is neither injective nor surjective.

Witnesses: $T(1,1,1)=\mathbf 0$. And every output $(a,b,c)$ has $a+b+c=0$, so $(1,0,0)$ is not reached.
:::
::::

:::note[Pattern at work]
Step 2: $n=m=3$, so one check settles both. Step 5: both witnesses come from the structure, and the commands above confirm them.
:::

```solution-map
id: evaluation-map-classified
method: injective-surjective
task: 'Classify $T:\mathcal P_2\to\mathbb R^2$, $T(p)=(p(0),p(1))$.'
steps:
  - node: one-to-one
    text: 'Suppose $T(p)=T(q)$. Then $p-q$ vanishes at $0$ and at $1$, so $p-q=c\,x(x-1)$ for a constant $c$. Nothing forces $c=0$.'
  - node: injective
    answer: no
    text: 'The dimensions already say so: $3>2$.'
  - node: collision
    text: '$p=x-x^2$ and $q=0$ are different, and $T(p)=T(q)=(0,0)$.'
  - node: onto
    text: 'Take any $(u,v)\in\mathbb R^2$ and try a polynomial of degree at most $1$: $p=u+(v-u)x$.'
  - node: surjective
    answer: yes
    text: '$p(0)=u$ and $p(1)=v$, and $p$ lies in the domain $\mathcal P_2$.'
  - node: classified
    text: 'Surjective, not injective. Rank–nullity agrees: $1+2=3$.'
```

::::exercise[A parameter]
For which $k$ is $T(x,y)=(x+ky,\ kx+4y)$ bijective? For the others, find the kernel and the image.

:::solution
$\det\begin{bmatrix}1&k\\k&4\end{bmatrix}=4-k^2$, so $T$ is bijective for $k\neq\pm2$.

For $k=2$: $A=\begin{bmatrix}1&2\\2&4\end{bmatrix}$, with $\ker=\mathrm{span}\{(-2,1)\}$ and image $\mathrm{span}\{(1,2)\}$.

For $k=-2$: $A=\begin{bmatrix}1&-2\\-2&4\end{bmatrix}$, with $\ker=\mathrm{span}\{(2,1)\}$ and image $\mathrm{span}\{(1,-2)\}$.

```python
A2 = matrix(QQ, [[1, 2], [2, 4]])
A2.right_kernel().basis()               # [(1, -1/2)]: the same line as (-2, 1)
[A2.column(j) for j in A2.pivots()]     # [(1, 2)]
```
:::
::::

:::note[Pattern at work]
Step 4, then a separate case for each bad value of the parameter. Sage scales its kernel vector differently, and it spans the same line.
:::
