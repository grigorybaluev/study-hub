---
title: Powers and dynamical systems
order: 13
asks: find a formula for the powers of a matrix, solve a linear recurrence, describe the long-term behaviour of a system
units: [diagonalization]
---

## Logic

Once $A=PDP^{-1}$, only the diagonal is raised to the power. In the eigenvector basis, each coordinate of a state is multiplied by its own eigenvalue at each step, so the eigenvalues with the largest absolute value decide what
happens in the long run: terms with $|\lambda|<1$ die, and a dominant eigenvalue gives both the growth rate and the limiting direction.

## Pattern

:::steps[From a system to its future]
1. Write the system as $\mathbf x_{k+1}=A\mathbf x_k$: name the state, and fill the matrix from the rules.
2. Find the eigenvalues and eigenvectors of $A$.
3. Solve $\mathbf x_0=c_0\mathbf v_0+\cdots+c_{n-1}\mathbf v_{n-1}$, that is, $\mathbf c=P^{-1}\mathbf x_0$.
4. Write $\mathbf x_k=c_0\lambda_0^k\mathbf v_0+\cdots+c_{n-1}\lambda_{n-1}^k\mathbf v_{n-1}$.
5. Let $k\to\infty$: keep the terms that survive, and state the limit, the growth rate or the direction.
:::

## In Sage

```python
A = matrix(QQ, [[8/10, 3/10], [2/10, 7/10]])
A.eigenvectors_right()                  # [(1, [(1, 2/3)], 1), (1/2, [(1, -1)], 1)]
P = column_matrix(QQ, [[3, 2], [1, -1]])
x0 = vector(QQ, [1/2, 1/2])
P.solve_right(x0)                       # (1/5, -1/10)
(A^40 * x0).n(digits=6)                 # (0.600000, 0.400000)
x = lambda n: (1/5) * vector(QQ, [3, 2]) - (1/10) * (1/2)^n * vector(QQ, [1, -1])
x(0) == x0, x(1) == A * x0              # (True, True)
```

`A^k` with a numeric `k` is immediate, which makes the formula easy to test against the matrix.

## Traps

:::caution[Traps]
- $A^k=PD^kP^{-1}$, and $P^{-1}$ is on the right. For the state, $\mathbf c=P^{-1}\mathbf x_0$ is computed once.
- A term with $|\lambda|=1$ does not die. With $\lambda=-1$ it flips sign at every step, and the state keeps oscillating.
- "Dominant" means largest in absolute value, so $-3$ beats $2$.
- If $c_0=0$, the dominant eigenvalue never appears: check the coefficient.
- Fill the matrix so that the columns say where each part **goes**: in a transfer model, each column adds to $1$.
:::

## Worked problems

::::exercise[A formula for the powers]
Find $A^k$ for $A=\begin{bmatrix}7&-4\\2&1\end{bmatrix}$.

:::solution
With $P=\begin{bmatrix}2&1\\1&1\end{bmatrix}$ and $D=\mathrm{diag}(5,3)$:

$$
A^k=\begin{bmatrix}2&1\\1&1\end{bmatrix}\begin{bmatrix}5^k&0\\0&3^k\end{bmatrix}\begin{bmatrix}1&-1\\-1&2\end{bmatrix}=\begin{bmatrix}2\cdot5^k-3^k&-2\cdot5^k+2\cdot3^k\\5^k-3^k&-5^k+2\cdot3^k\end{bmatrix} .
$$

For $k=1$ this gives $A$.

```python
A = matrix(QQ, [[7, -4], [2, 1]])
k = var('k')
P = column_matrix(QQ, [[2, 1], [1, 1]])
Ak = P * diagonal_matrix(SR, [5^k, 3^k]) * P.inverse()
Ak.subs(k == 3)                         # [223 -196; 98 -71]
A^3                                     # [223 -196; 98 -71]
```
:::
::::

:::note[Pattern at work]
Only $D$ carries the $k$. The test at a small $k$ takes one line.
:::

::::exercise[Market shares]
Each month, $20\,\%$ of the customers of brand $X$ move to brand $Y$, and $30\,\%$ of those of $Y$ move to $X$. Both start with half of the market. Find the shares after $k$ months and in the long run.

:::solution
$\mathbf x_{k+1}=A\mathbf x_k$ with $A=\begin{bmatrix}0.8&0.3\\0.2&0.7\end{bmatrix}$. The trace is $1.5$ and the determinant is $0.5$, so the eigenvalues are $1$ and $\frac12$, with eigenvectors $(3,2)$ and $(1,-1)$.

Solving $c_0(3,2)+c_1(1,-1)=(\frac12,\frac12)$ gives $c_0=\frac15$ and $c_1=-\frac{1}{10}$. So

$$
\mathbf x_k=\frac15(3,2)-\frac{1}{10}\Bigl(\frac12\Bigr)^k(1,-1)\longrightarrow(0.6,\ 0.4) .
$$
:::
::::

:::note[Pattern at work]
Steps 1–5 in order; the commands above carry them out. $\lambda=1$ gives the steady state, and $\lambda=\frac12$ says how fast the difference dies.
:::

::::exercise[A recurrence]
Find a formula for $a_k$ when $a_0=0$, $a_1=1$ and $a_{k+1}=a_k+2a_{k-1}$.

:::solution
Let $\mathbf x_k=(a_{k+1},a_k)$, so $A=\begin{bmatrix}1&2\\1&0\end{bmatrix}$ and $\mathbf x_0=(1,0)$. Then $p_A(\lambda)=\lambda^2-\lambda-2=(\lambda-2)(\lambda+1)$, with eigenvectors $(2,1)$ and $(-1,1)$.

Solving $c_0(2,1)+c_1(-1,1)=(1,0)$ gives $c_0=\frac13$ and $c_1=-\frac13$. The second entry of $\mathbf x_k$ is

$$
a_k=\frac{2^k-(-1)^k}{3} .
$$

The term $(-1)^k$ neither grows nor dies, but $2^k$ dominates it: the ratio of consecutive terms tends to $2$.

```python
A = matrix(QQ, [[1, 2], [1, 0]])
[(A^k * vector(QQ, [1, 0]))[1] for k in range(8)]     # [0, 1, 1, 3, 5, 11, 21, 43]
[(2^k - (-1)^k) / 3 for k in range(8)]                # [0, 1, 1, 3, 5, 11, 21, 43]
```
:::
::::

:::note[Pattern at work]
Step 1 is the only new idea: stack two consecutive terms in one state vector. The formula is then tested against the matrix for eight values.
:::
