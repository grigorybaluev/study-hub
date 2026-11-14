---
title: Coordinates and transition matrices
order: 7
asks: find coordinates relative to a basis, build a transition matrix, convert between two bases
units: [basis-coordinates-transition]
---

## Logic

Coordinates are the solution of one linear system, and a transition matrix is that system solved for all the basis vectors at once. Its columns are the **old** basis vectors written in
the **new** basis. If both bases are known in standard coordinates, one product or one row reduction gives it.

## Pattern

:::steps[Converting coordinates]
1. Write both bases as columns in standard coordinates: $P_{B}$ and $P_{C}$.
2. Coordinates: $[\mathbf v]_{B}=P_{B}^{-1}\mathbf v$.
3. Transition: $P_{B \to C}=P_{C}^{-1}P_{B}$, or the right block of the RREF of $[\,P_{C}\mid P_{B}\,]$.
4. Convert: $[\mathbf v]_{C}=P_{B \to C}[\mathbf v]_{B}$.
5. Check: rebuild $\mathbf v$ from $[\mathbf v]_{C}$.
:::

## In Sage

```python
PB = column_matrix(QQ, [[1, 2], [3, 7]])
PC = column_matrix(QQ, [[1, 1], [2, 3]])
P = PC.inverse() * PB                   # transition matrix from B to C
P                                       # [-1 -5; 1 4]
PC.augment(PB).rref()                   # [1 0 -1 -5; 0 1 1 4]: the same P on the right
v = vector(QQ, [4, 9])
PB.solve_right(v)                       # (1, 1): coordinates in B
P * PB.solve_right(v)                   # (-6, 5): coordinates in C
PC * vector(QQ, [-6, 5])                # (4, 9): rebuilt
```

## Traps

:::caution[Traps]
- The direction. $P_{B \to C}$ eats $B$-coordinates. Test it on $\mathbf b_0$: it must return the $C$-coordinates of $\mathbf b_0$.
- $P_{B}^{-1}P_{C}$ is the opposite direction, and it is the inverse of the matrix you want.
- Coordinates depend on the order of the basis. Swapping two basis vectors swaps two coordinates.
- A vector and its coordinates are different objects: $[\mathbf v]_{B}$ lives in $\mathbb R^n$, $\mathbf v$ lives in $V$.
:::

## Worked problems

::::exercise[Two bases of the plane]
Let $B=((1,2),(3,7))$, $C=((1,1),(2,3))$ and $\mathbf v=(4,9)$. Find $[\mathbf v]_{B}$, $P_{B \to C}$ and $[\mathbf v]_{C}$.

:::solution
$c_0(1,2)+c_1(3,7)=(4,9)$ gives $[\mathbf v]_{B}=(1,1)$.

$$
P_{B \to C}=\begin{bmatrix}1&2\\1&3\end{bmatrix}^{-1}\begin{bmatrix}1&3\\2&7\end{bmatrix}=\begin{bmatrix}3&-2\\-1&1\end{bmatrix}\begin{bmatrix}1&3\\2&7\end{bmatrix}=\begin{bmatrix}-1&-5\\1&4\end{bmatrix} .
$$

So $[\mathbf v]_{C}=(-1-5,\ 1+4)=(-6,5)$. Check: $-6\,(1,1)+5\,(2,3)=(4,9)$.

```python
PB = column_matrix(QQ, [[1, 2], [3, 7]])
PC = matrix(QQ, [[1, 2], [1, 3]])       # entered by rows: columns (1, 1) and (2, 3)
P = PC.inverse() * PB
P                                       # [-1 -5; 1 4]
P * vector(QQ, [1, 1])                  # (-6, 5)
```
:::
::::

:::note[Pattern at work]
Steps 2–5 in order, and the check is one line. Note how the two ways of entering a basis differ: `column_matrix` lists columns, `matrix` lists rows.
:::

::::exercise[Polynomials]
In $\mathbb P_2(\mathbb R)$, let $S=(1,x,x^2)$ and $C=(1+x,\ x+x^2,\ 1+x^2)$. Find $P_{S \to C}$ and the $C$-coordinates of $p=2+4x+6x^2$.

:::solution
$P_{C \to S}$ is immediate: its columns are the coefficient lists $(1,1,0)$, $(0,1,1)$, $(1,0,1)$. Inverting,

$$
P_{S \to C}=\frac12\begin{bmatrix}1&1&-1\\-1&1&1\\1&-1&1\end{bmatrix} .
$$

Then $[p]_{C}=P_{S \to C}(2,4,6)=(0,4,2)$. Check: $4(x+x^2)+2(1+x^2)=2+4x+6x^2$.

```python
PSC = column_matrix(QQ, [[1, 1, 0], [0, 1, 1], [1, 0, 1]])
PSC.inverse()                           # [1/2 1/2 -1/2; -1/2 1/2 1/2; 1/2 -1/2 1/2]
PSC.inverse() * vector(QQ, [2, 4, 6])   # (0, 4, 2)
```
:::
::::

:::note[Pattern at work]
The direction that is easy to write down is the one with the standard basis on the left of the arrow. Its inverse gives the other direction.
:::

::::exercise[Reading a transition matrix]
Given $P_{B \to C}=\begin{bmatrix}2&1\\1&1\end{bmatrix}$ and $C=((1,0),(1,1))$, find the basis $B$.

:::solution
The columns give $[\mathbf b_0]_{C}=(2,1)$ and $[\mathbf b_1]_{C}=(1,1)$. So $\mathbf b_0=2\,(1,0)+(1,1)=(3,1)$ and $\mathbf b_1=(1,0)+(1,1)=(2,1)$.

```python
PC = column_matrix(QQ, [[1, 0], [1, 1]])
P = matrix(QQ, [[2, 1], [1, 1]])
PC * P                                  # columns (3, 1) and (2, 1)
```
:::
::::

:::note[Pattern at work]
The formula read the other way: $P_{B}=P_{C}\,P_{B \to C}$.
:::
