---
title: Computing with Turing machines
order: 12
asks: transducers on unary numbers, combining machines, Turing's thesis, equivalent variants
units: [turing-machines]
---

## Logic

As a transducer, a Turing machine leaves its output on the tape, with the head on the first symbol, so one machine can be followed by another. Large machines are built from blocks.
Turing's thesis says this is all of mechanical computation, and the variants say the same thing from another side: extra tapes, heads or guesses change the speed, not the power.

## Pattern

:::steps[Computing a function]
1. Fix the encoding: $n$ as $1^n$, a pair as $1^x 0 1^y$.
2. Describe the change to the tape in words, for example "turn the $0$ into a $1$ and erase the last $1$".
3. Write the sweeps.
4. End by walking left to the blank and stepping right, so that the head is on the first symbol of the output.
5. To combine machines, rename the states and send the moves into the final state of the first to the initial state of the second.
:::

## Traps

:::caution[Traps]
- Output position: $q_0 w \vdash^* q_f\, f(w)$ means that the head is on the first symbol of the output.
- $0$ in unary is the empty string: the input for $(0, y)$ starts with the separator.
- The thesis is **not a theorem**, and it cannot be proved.
- "A multi-tape machine is more powerful" is false, while "faster" can be true.
- A PDA with two stacks equals a Turing machine; a PDA with one stack does not.
:::

## Worked problems

::::exercise[Adding one more]
Give a Turing machine for $f(x, y) = x + y + 1$ on input $1^x 0 1^y$, and trace $1011$. Then say how to get $g(x, y) = x + y + 2$ with no new table.

:::solution
Turn the $0$ into a $1$: the tape then holds $x + 1 + y$ ones. Then walk back to the start.

| $\delta$ | $1$ | $0$ | $\square$ |
|---|---|---|---|
| $\to q_0$ | $q_0, 1, R$ | $q_1, 1, L$ | |
| $q_1$ | $q_1, 1, L$ | | $q_2, \square, R$ |
| $*\,q_2$ | | | |

$$q_0\,1011 \vdash 1\,q_0\,011 \vdash q_1\,1111 \vdash q_1\,\square 1111 \vdash q_2\,1111$$

So $1 + 2 + 1 = 4$. For $g$, compose this machine with the successor machine: rename the states of the successor machine, and redirect the moves into $q_2$ to its initial state.
:::
::::

:::note[Pattern at work]
Step 4 is what allows step 5: the head ends where the next machine expects to start.
:::

## Drill

::::exercise[True or false]
(a) Every algorithm can be carried out by a Turing machine, and this has been proved. (b) A non-deterministic Turing machine accepts languages that no deterministic one accepts. (c) A Turing machine with a
tape that is infinite in only one direction is as powerful as the standard one. (d) Adding a second tape can make a machine faster. (e) A computable function must be defined for all inputs.
(f) A pushdown automaton with two stacks accepts every language that a Turing machine accepts.

:::solution
(a) False: this is the thesis, a claim that can't be proved, since "algorithm" in the informal sense is not a mathematical notion. (b) False: a deterministic machine searches all computations. (c) True. (d) True, and it does not change what can be
computed. (e) False: the definition asks for a machine that works on the domain of $f$. (f) True: the two stacks are the tape on each side of the head.
:::
::::
