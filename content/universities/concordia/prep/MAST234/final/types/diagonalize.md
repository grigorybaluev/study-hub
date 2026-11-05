---
title: Diagonalize, or show that it is impossible
order: 12
asks: decide whether a matrix or operator is diagonalizable, and find P and D
units: [diagonalization]
method: diagonalizable
---

## Logic

Diagonalizable means having a basis of eigenvectors. With $n$ distinct eigenvalues the answer is yes at once. With a repeated eigenvalue, compare its algebraic multiplicity with the dimension of its eigenspace: if they agree for every eigenvalue
the answer is yes, and if one falls short the answer is no. Over $\mathbb R$, a non-real eigenvalue is also a no.

## Pattern

:::steps[Diagonalizable?]
1. Find the eigenvalues with their algebraic multiplicities.
2. All real? If not, it is not diagonalizable over $\mathbb R$ (it may be over $\mathbb C$).
3. $n$ distinct eigenvalues: yes. Skip to step 5.
4. For each repeated $\lambda$: $\dim E_\lambda=n-\mathrm{rank}(A-\lambda I)$. A shortfall means no.
5. Put bases of the eigenspaces in the columns of $P$, and the matching eigenvalues in $D$, in the same order.
6. Check: $AP=PD$.
:::

## In Sage

```python
A = matrix(QQ, [[7, -4], [2, 1]])
D, P = A.eigenmatrix_right()
D, P                                    # ([5 0; 0 3], [1 1; 1/2 1])
P.is_invertible()                       # True
A * P == P * D                          # True
A.is_diagonalizable()                   # True
```

## Traps

:::caution[Traps]
- `A.is_diagonalizable()` over `QQ` means "with **rational** eigenvectors". For an honest answer, use `A.change_ring(QQbar).is_diagonalizable()`.
- `eigenmatrix_right()` does not refuse a matrix that cannot be diagonalized: it returns a $P$ with a zero column. Check `P.is_invertible()`.
- A repeated eigenvalue does not mean "not diagonalizable": $I_n$ is diagonal. Compare the multiplicities.
- The pairing: column $j$ of $P$ goes with entry $j$ of $D$.
- Invertible and diagonalizable are unrelated: $\begin{bmatrix}1&1\\0&1\end{bmatrix}$ is invertible and not diagonalizable, and $\begin{bmatrix}1&0\\0&0\end{bmatrix}$ is the other way round.
:::

## Worked problems

::::exercise[Distinct eigenvalues]
Diagonalize $A=\begin{bmatrix}7&-4\\2&1\end{bmatrix}$.

:::solution
$\mathrm{tr}(A)=8$ and $\det(A)=15$, so $p_A(\lambda)=\lambda^2-8\lambda+15=(\lambda-5)(\lambda-3)$.

$\lambda=5$: $A-5I=\begin{bmatrix}2&-4\\2&-4\end{bmatrix}$, so $\mathbf v=(2,1)$. $\lambda=3$: $A-3I=\begin{bmatrix}4&-4\\2&-2\end{bmatrix}$, so $\mathbf v=(1,1)$.

$$
P=\begin{bmatrix}2&1\\1&1\end{bmatrix} , \qquad D=\begin{bmatrix}5&0\\0&3\end{bmatrix} , \qquad P^{-1}=\begin{bmatrix}1&-1\\-1&2\end{bmatrix} .
$$

Sage scales the first eigenvector differently, $(1,\frac12)$, which is the same line.
:::
::::

:::note[Pattern at work]
Steps 1, 3, 5: two distinct eigenvalues, so no multiplicity check is needed.
:::

```solution-map
id: upper-triangular-not-diagonalizable
method: diagonalizable
task: 'Is $A=\begin{bmatrix}2&1&0\\0&2&1\\0&0&3\end{bmatrix}$ diagonalizable?'
steps:
  - node: polynomial
    text: '$A$ is triangular: the eigenvalues are $2$ (algebraic multiplicity $2$) and $3$ (multiplicity $1$).'
  - node: real
    answer: yes
    text: 'All real.'
  - node: distinct
    answer: no
    text: 'Only two distinct eigenvalues for a $3\times3$ matrix.'
  - node: eigenspaces
    text: '$A-2I=\begin{bmatrix}0&1&0\\0&0&1\\0&0&1\end{bmatrix}$ has rank $2$, so $\dim E_2=3-2=1$.'
  - node: enough
    answer: no
    text: 'Geometric multiplicity $1$, algebraic multiplicity $2$: one eigenvector short.'
  - node: not-diag
    text: 'There are at most two independent eigenvectors, so $A$ is not diagonalizable.'
```

::::exercise[A parameter]
For which $a$ is $A=\begin{bmatrix}2&a&0\\0&2&0\\0&0&3\end{bmatrix}$ diagonalizable?

:::solution
The eigenvalues are $2,2,3$. $A-2I=\begin{bmatrix}0&a&0\\0&0&0\\0&0&1\end{bmatrix}$ has rank $2$ if $a\neq0$ and rank $1$ if $a=0$. So $\dim E_2=2$ only for $a=0$, and $A$ is diagonalizable exactly when $a=0$, when it is already diagonal.

```python
A = lambda a: matrix(QQ, [[2, a, 0], [0, 2, 0], [0, 0, 3]])
A(0).is_diagonalizable(), A(5).is_diagonalizable()    # (True, False)
(A(5) - 2*identity_matrix(3)).rank()                  # 2
```
:::
::::

:::note[Pattern at work]
Step 4 with a parameter: the rank of $A-\lambda I$ changes at the special value, so handle it as a separate case.
:::

::::exercise[Real or complex]
Is $B=\begin{bmatrix}1&-1\\1&1\end{bmatrix}$ diagonalizable over $\mathbb R$? Over $\mathbb C$? And $C=\begin{bmatrix}2&1\\1&1\end{bmatrix}$?

:::solution
$p_B(\lambda)=\lambda^2-2\lambda+2$, with roots $1\pm i$. So $B$ is not diagonalizable over $\mathbb R$; its eigenvalues are distinct, so it is diagonalizable over $\mathbb C$.

$p_C(\lambda)=\lambda^2-3\lambda+1$, with roots $\frac{3\pm\sqrt5}{2}$, which are real and distinct. So $C$ is diagonalizable over $\mathbb R$, although not with rational entries.

```python
B = matrix(QQ, [[1, -1], [1, 1]])
C = matrix(QQ, [[2, 1], [1, 1]])
B.is_diagonalizable(), C.is_diagonalizable()          # (False, False): both only say "not over QQ"
B.change_ring(QQbar).is_diagonalizable()              # True
C.change_ring(QQbar).is_diagonalizable()              # True
```
:::
::::

:::note[Pattern at work]
The field matters. Sage's `False` for $C$ would be a wrong answer to the real question, and looking at the eigenvalues decides it.
:::
