---
title: Combinational circuits — decoders, multiplexers, adders and the ALU
order: 7
status: detailed
weeks: [5]
notes: ["Lecture 5, slides 3–6: recap of gates, normal forms, the seven-segment display as a many-output truth table, minterm circuits", "Lecture 5, slides 7–8: decoders and multiplexers", "Lecture 5, slides 9–10: chaining full adders, bus-width notation", "Lecture 5, slides 11–14: the ALU, its operations and status flags"]
textbook: ""
introduces: []
requires:
  - {concept: digital-logic, strength: hard}
  - {concept: boolean-algebra, strength: hard}
reinforces:
  - {concept: digital-logic, perspective: "minterm circuits, decoders, multiplexers, the ripple-carry adder and the ALU as building blocks"}
---

A **combinational circuit** is one whose outputs depend only on its present inputs — no
memory, no clock, just gates. The previous unit showed that any truth table has one. This
unit builds the four that a CPU is assembled from: a decoder to pick one of many, a
multiplexer to choose one of many, an adder that chains one-bit adders into a word, and the
arithmetic logic unit that wraps the adder with everything else the instruction set needs.
Each is boxed up as a block with labelled inputs and outputs, so that the datapath of the
following units can be drawn without showing a single gate.

## Many outputs, one method

A circuit can have several outputs; each is just its own truth table over the same inputs.
The lecture's example is a seven-segment digit display: four input bits code a digit 0–9,
seven outputs say which segments light, and each segment's column is a Boolean function to
be written as a sum of products and built as a row of ANDs into an OR. The regular shape of
a minterm circuit — inverters, then one AND per 1-row, then an OR — means the method scales
to any number of outputs without new ideas.

## Decoders

> **Definition.** An $n$-to-$2^n$ **decoder** takes an $n$-bit input and activates exactly one
> of $2^n$ output lines — the one whose index is the input's value.

Each output is a single minterm: $D_5$ in a 3-to-8 decoder is $A_2 \bar A_1 A_0$. Decoders
turn a *number* into a *selection*, which is what an address does: a memory chip's row
decoder takes the address bits and enables the one row of cells they name. The control unit
uses the same trick to turn an opcode into "this instruction, and no other".

```sim
id: arch-228-combinational-decoder
custom: true
engine: arch
mode: decoder
n: 3
input: 5
note: "Three input lines, eight output lines, one of them high. The side table is the full truth table with the active row lit; the highlighted output's AND gate is named in the step text. Change the input to see the selection move — this is exactly how an address picks one memory row."
```

## Multiplexers

> **Definition.** A $2^n$-to-1 **multiplexer** (mux) has $2^n$ data inputs, $n$ select lines
> and one output; the output copies the data input whose index is on the select lines.

Inside, a mux is a decoder of the select lines, an AND of each data line with its decoder
output, and an OR of the ANDs: $Y = \sum_i D_i \cdot m_i(S)$. It is the hardware form of
"choose one source", and the datapath uses it wherever a register can be loaded from more
than one place.

```sim
id: arch-228-combinational-mux
custom: true
engine: arch
mode: mux
n: 2
select: 2
data: "0 1 1 0"
note: "Four data lines, two select lines, one output. S = 10 routes D₂ to Y; the step text spells out the sum-of-products inside. Change the select value, or the data bits, and Y follows — a mux is a switch whose position is a number."
```

## From one bit to a word

The full adder of the last unit handles one column. A $w$-bit adder is $w$ of them side by
side, each carry-out wired to the next column's carry-in — a **ripple-carry adder**, so
called because the carry ripples from bit 0 upward and the top sum bit is not valid until
it has arrived. The diagram of four chained boxes is already too busy to draw at every use,
so the lecture introduces the convention of one thick line labelled with its width in place
of $w$ parallel wires, and a single "4-bit adder" box with $A$, $B$, $C_{in}$ in and $X$,
$C_{out}$ out.

```sim
id: arch-228-combinational-adder
custom: true
engine: arch
mode: adder
a: "1011"
b: "0110"
cin: 0
note: "Four full adders, bit 0 on the right. Stepping runs them in the order the carry arrives; each step names the adder's three inputs and its two outputs, and the side table highlights the matching row of the full-adder truth table. 11 + 6 = 17 does not fit in four bits: the sum reads 0001 with a carry out of 1."
```

The ripple delay grows with the width — a 64-bit add waits for 64 carries — which is why
real adders predict carries ahead; the principle stays the same.

## The arithmetic logic unit

> **Definition.** The **ALU** is a combinational circuit with two $w$-bit inputs $A$ and $B$,
> an operation-select input, a $w$-bit result $X$, and a set of **status flags** describing
> the result.

The typical operations are addition and subtraction; bit-wise AND, OR and XOR; the one-input
operations increment, decrement, negate and complement; and shifts. Multiplication and
division may or may not be there depending on the architecture. Subtraction reuses the
adder with $B$ complemented and a carry-in of 1, as the arithmetic unit showed; the logic
operations are $w$ parallel gates; a mux picks which result reaches $X$.

The four common flags are computed from the result at no extra cost:

- **N** (negative): the top bit of $X$.
- **Z** (zero): every bit of $X$ NORed together.
- **C** (carry): the carry out of the top bit — an unsigned overflow, or the bit to chain
  into a wider addition.
- **V** (overflow): the carry into the sign bit differs from the carry out of it — a signed
  overflow.

```sim
id: arch-228-combinational-alu
custom: true
engine: arch
mode: alu
a: 9
b: 12
bits: 8
op: sub
note: "The ALU as a block: A and B in, the operation on the side, X and the four flags out. 9 − 12 gives −3 with N = 1 and C = 0 (a borrow), and the step text explains how a compare instruction would use exactly these flags. Switch the operation to add, and, xor or shl; try 100 + 100 for V = 1."
```

The flags are how a program makes decisions. `if (a < b)` has no gate that computes "less
than"; the ALU computes $a - b$, throws the difference away, and the *sign* of the result —
N, corrected by V when the subtraction overflowed — answers the question. Every conditional
branch in the assembly units is a flag test after an ALU operation.

**Equations**

- *Decoder output*: $D_k = $ the minterm of $k$, e.g. $D_5 = A_2 \bar A_1 A_0$.
- *Multiplexer*: $Y = \sum_{i=0}^{2^n - 1} D_i \, m_i(S)$, where $m_i$ is the $i$-th minterm of the select lines.
- *Ripple-carry adder*: $S_i = A_i \oplus B_i \oplus C_i$, $C_{i+1} = A_i B_i + C_i(A_i \oplus B_i)$, $C_0 = C_{in}$.
- *Flags*: $N = X_{w-1}$; $Z = \overline{X_{w-1} + \cdots + X_0}$; $C = C_w$; $V = C_{w-1} \oplus C_w$.
- *Signed less-than after $A - B$*: $N \oplus V$; *unsigned less-than*: $\bar C$.

> **Key insight.** Four combinational blocks — decode, select, add, and an ALU that is
> "add plus a mux" — are enough to compute anything an instruction asks for. What they cannot
> do is remember: the next unit adds feedback, and with it registers, and with those a
> machine that can hold state from one instruction to the next.

## Further reading

- [Binary decoder](https://en.wikipedia.org/wiki/Binary_decoder) and [Multiplexer](https://en.wikipedia.org/wiki/Multiplexer) — the two selection circuits.
- [Adder (electronics)](https://en.wikipedia.org/wiki/Adder_(electronics)) — ripple-carry and carry-lookahead adders.
- [Arithmetic logic unit](https://en.wikipedia.org/wiki/Arithmetic_logic_unit) — operations, status outputs, and how the flags drive branches.
- [Seven-segment display](https://en.wikipedia.org/wiki/Seven-segment_display) — the classic many-output truth table.
