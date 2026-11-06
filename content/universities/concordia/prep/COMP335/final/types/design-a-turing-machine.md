---
title: Design a Turing machine
order: 11
asks: give a Turing machine for a language; trace a run; read a transition table
units: [turing-machines]
---

## Logic

Write the algorithm first, then the table. The usual program is a loop: mark a symbol, sweep to its partner, mark that, sweep back. The finite control remembers a bounded
amount, one letter or the phase; everything that grows stays on the tape. A missing move is a rejection, so only the right cases need moves.

## Pattern

:::steps[A Turing machine in five steps]
1. State the algorithm in one or two sentences: what is marked, and in what order.
2. Give one state per task: find the next symbol, go back, check the rest.
3. Write the moves; a symbol passed over is written back unchanged.
4. Define the end of the loop, and what the tape must look like then.
5. Trace a string in $L$, one a symbol short, and one a symbol long.
:::

## Traps

:::caution[Traps]
- The definition has **no stay move**, and the head must move at every step.
- The tape is two-way infinite here: there is no left end to bump into, so use a marker or a blank to find the start.
- The machine must stop in a final state. Reading the whole input is not required, and not enough.
- No moves leave a final state.
- A looping machine does not reject: it gives no answer.
- $\delta(q, a) = (p, b, R)$ writes $b$ **before** moving.
:::

## Worked problems

::::exercise[Marking in pairs]
Give a Turing machine for $\{a^n b^{2n} : n \ge 1\}$, and trace $abb$ and $ab$.

:::solution
Cross off one $a$ as $x$ and two $b$'s as $y$, then go back. When no $a$ is left, only $y$'s may remain.

| $\delta$ | $a$ | $b$ | $x$ | $y$ | $\square$ |
|---|---|---|---|---|---|
| $\to q_0$ | $q_1, x, R$ | | | $q_4, y, R$ | |
| $q_1$ | $q_1, a, R$ | $q_2, y, R$ | | $q_1, y, R$ | |
| $q_2$ | | $q_3, y, L$ | | | |
| $q_3$ | $q_3, a, L$ | | $q_0, x, R$ | $q_3, y, L$ | |
| $q_4$ | | | | $q_4, y, R$ | $q_5, \square, L$ |
| $*\,q_5$ | | | | | |

$$q_0\,abb \vdash x\,q_1\,bb \vdash xy\,q_2\,b \vdash x\,q_3\,yy \vdash q_3\,xyy \vdash x\,q_0\,yy \vdash xy\,q_4\,y \vdash xyy\,q_4\,\square \vdash xy\,q_5\,y \qquad \textbf{accept}$$

$$q_0\,ab \vdash x\,q_1\,b \vdash xy\,q_2\,\square \qquad \textbf{reject}$$

On $ab$ the second $b$ is missing, so $q_2$ reads a blank and has no move.
:::
::::

:::note[Pattern at work]
Each state is one task of step 2: $q_1$ finds the first $b$, $q_2$ the second, $q_3$ goes back, $q_4$ checks the rest. Step 5's "one symbol short" is what the trace of $ab$ tests.
:::

::::exercise[Equal counts without a stack]
Give a Turing machine for $\{w \in \{a, b\}^* : n_a(w) = n_b(w)\}$.

:::solution
Cross off the first letter that is left, remembering it in the state, then find one of the other letter and cross it off too. Go back to the left end, which is marked by a blank.

| $\delta$ | $a$ | $b$ | $x$ | $\square$ |
|---|---|---|---|---|
| $\to q_0$ | $q_1, x, R$ | $q_2, x, R$ | $q_0, x, R$ | $q_4, \square, L$ |
| $q_1$ | $q_1, a, R$ | $q_3, x, L$ | $q_1, x, R$ | |
| $q_2$ | $q_3, x, L$ | $q_2, b, R$ | $q_2, x, R$ | |
| $q_3$ | $q_3, a, L$ | $q_3, b, L$ | $q_3, x, L$ | $q_0, \square, R$ |
| $*\,q_4$ | | | | |

$$q_0\,ab \vdash x\,q_1\,b \vdash q_3\,xx \vdash q_3\,\square xx \vdash q_0\,xx \vdash x\,q_0\,x \vdash xx\,q_0\,\square \vdash x\,q_4\,x \qquad \textbf{accept}$$
:::
::::

## Drill

::::exercise[Read the table]
For the machine of the first problem: (a) which state is the machine in after three moves on $aabbbb$, and what is on the tape? (b) What happens on $b$? (c) On $aab$?

:::solution
(a) After $q_0\,aabbbb \vdash x\,q_1\,abbbb \vdash xa\,q_1\,bbbb \vdash xay\,q_2\,bbb$, the state is $q_2$ and the tape is $xaybbb$.

(b) $q_0$ has no move on $b$: it halts at once, and rejects.

(c) $q_0\,aab \vdash x\,q_1\,ab \vdash xa\,q_1\,b \vdash xay\,q_2\,\square$, and $q_2$ has no move on the blank: rejected.
:::
::::
