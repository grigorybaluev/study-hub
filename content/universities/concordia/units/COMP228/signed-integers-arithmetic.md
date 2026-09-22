---
title: Signed integers and integer arithmetic
order: 3
status: detailed
weeks: [2, 3]
notes: ["Lecture 2, slides 6–13: negative numbers, sign-magnitude, finite storage and ranges, nine's and ten's complement, one's and two's complement, excess-N", "Lecture 2, slide 14 and Lecture 3, slides 5–6: multiplication by shifting and adding, Booth's algorithm, division", "Lecture 3, slides 2–4 and 7: carry versus overflow, sign extension, the most negative number, subtraction as addition, fixed point"]
textbook: ""
introduces: []
requires:
  - {concept: number-representation, strength: hard}
reinforces:
  - {concept: number-representation, perspective: "complements, carry versus overflow, shift-and-add and Booth multiplication, restoring division"}
---

Binary has digits for 0 and 1 and nothing for a minus sign, and a CPU has a fixed number of
wires per number. Both facts shape how negative integers are stored and what happens when a
result does not fit. This unit builds the representations up from the naive one to two's
complement, then runs the four arithmetic operations through it.

## Fixed width

A CPU's word size is the number of wires it dedicates to one number. On an 8-bit machine the
value 5 is stored as $00000101$: leading zeros pad every number to the width, and there is
no way to add a ninth wire when a result needs one. That sets a **range** for every
representation, and any operation whose true result lies outside the range produces a wrong
answer that the hardware must at least flag.

## Where to put the sign

**Sign-magnitude** stores the sign as a separate bit — 0 for positive, 1 for negative — in
front of the magnitude: on 8 bits, $+13$ is $0\,0001101$ and $-13$ is $1\,0001101$. It is the
obvious design and the first "data structure" decision of the course: which end does the sign
go on? It has two flaws. Zero has two forms ($0000\,0000$ and $1000\,0000$), and an adder has
to look at both signs and decide whether to add or subtract magnitudes.

The complement idea removes the special cases by making negation itself an arithmetic
operation. The lecture introduces it in base 10 first. **Nine's complement** of a 6-digit
number replaces every digit $d$ by $9 - d$: $000001 \to 999998$. Adding a number and its
nine's complement gives $999999$, so treating $999999$ as zero makes the complement behave
like a negative — except that zero again has two forms, and a carry off the top has to be
wrapped around and added back in. **Ten's complement** adds one after complementing:
$000005 \to 999995$, and the odometer picture makes the wrap-around natural — turn a
six-digit counter back five clicks from $000000$ and it reads $999995$.

In binary the same two steps are **one's complement** (flip every bit) and **two's
complement** (flip every bit, then add one).

> **Example — −45 on 8 bits.** $45 = 00101101$. One's complement flips every bit:
> $11010010$. Two's complement adds one: $11010011$. Check: $11010011 + 00101101 = 1\,00000000$,
> and dropping the carry off the top leaves zero.

```sim
id: arch-228-signed-representations
custom: true
engine: arch
mode: signed
value: -45
bits: 8
note: "The same value in all four representations, with the range each one covers. Sign-magnitude and one's complement both have two zeros; two's complement has one, and its range is lopsided (−128 to +127). Try −128: the sign-magnitude and one's-complement rows show a dash because the value does not exist there. Excess-127 is the trick floating-point exponents use in a later unit."
```

Two's complement wins because addition needs no special case at all: add the bit patterns
as unsigned numbers, throw away the carry off the top, and the result is correct whenever it
fits. There is a single zero, the range on $n$ bits is $-2^{n-1} \dots 2^{n-1} - 1$, and the
top bit still says the sign. The price is the lopsided range: $-2^{n-1}$ exists but
$+2^{n-1}$ does not, so negating the most negative number gives itself.

**Excess-N** (biased) representation stores $x + N$ as an unsigned number, usually with
$N = 2^{n-1} - 1$ so the range is nearly symmetric. Its virtue is that unsigned order is the
same as signed order, which is why exponents of floating-point numbers use it; its cost is
that every addition has to subtract the bias back out.

**Sign extension** is what happens when a two's-complement number is moved to a wider word:
copy the sign bit into all the new positions. $-45$ on 16 bits is $11111111\,11010011$; a
positive number gets zeros. Multiplication below depends on doing this correctly.

## Adding, and the two ways of being wrong

Binary addition is the school algorithm with the four-line table: each column adds two bits
and a carry-in and produces a sum bit and a carry-out. Two different things can go wrong,
and they have different names.

- **Carry** ($C$) is the carry out of the top column. For *unsigned* numbers it means the
  result did not fit: $200 + 100$ on 8 bits gives $00101100 = 44$ with $C = 1$.
- **Overflow** ($V$) is when the carry *into* the sign column differs from the carry *out* of
  it — equivalently, when two operands of the same sign produce a result of the other sign.
  For *signed* numbers it means the result did not fit: $100 + 100$ on 8 bits gives
  $11001000 = -56$ with $V = 1$ and $C = 0$.

Which flag matters depends on how the program interprets the bits; the adder computes both
and lets the program decide.

```sim
id: arch-228-signed-overflow
custom: true
engine: arch
mode: add
a: 100
b: 100
bits: 8
note: "The carry ripples column by column; at the end the four flags are computed. 100 + 100 = 200 does not fit in signed 8 bits: the sum comes out as −56 with V = 1, while C = 0 — the carry out of the top is fine, it is the carry into the sign bit that went wrong. Read the same bits as unsigned and the story flips: 200 + 100 = 300 does not fit in 8 bits either, but there it is C = 1 that reports it and V is irrelevant. Try 100 + 27 (fits: V = 0) and −100 + −100 (overflows the other way)."
```

**Subtraction** is addition with the second operand negated, and negation is flip-and-add-one
— so $A - B$ is $A + \bar B + 1$, and the $+1$ is supplied free by feeding a 1 into the
carry-in of the adder. No subtractor circuit is needed.

```sim
id: arch-228-signed-subtract
custom: true
engine: arch
mode: add
a: 5
b: 3
bits: 4
op: sub
note: "5 − 3 as 5 + (¬3) + 1: the bits of B are flipped and the carry-in is set to 1, then the same adder runs. The result 0010 is right; the carry out is 1, which for a subtraction means 'no borrow'. Try 3 − 5 to see a negative result (1110 = −2) with C = 0."
```

## Multiplying

In base 10, multiplying by 10 shifts the digits one place left; in base 2, multiplying by 2
shifts the bits. Since a multiplier bit is either 0 or 1, each partial product is either
nothing or the multiplicand shifted left by that bit's position, and multiplication is
**shift and add**. An $n$-bit by $n$-bit product needs $2n$ bits.

> **Example — 13 × 11.** $1101 \times 1011$: multiplier bits 0, 1 and 3 are set, so add
> $1101$, $11010$ and $1101000$: $13 + 26 + 104 = 143 = 10001111_2$.

```sim
id: arch-228-signed-multiply
custom: true
engine: arch
mode: multiply
a: 13
b: 11
bits: 4
note: "One partial product per multiplier bit, each the multiplicand shifted left by the bit's position, or zero when the bit is 0. The sum needs eight bits. Negative operands are handled by multiplying magnitudes and fixing the sign afterwards — try −13 × 11."
```

Signs complicate shift-and-add: the lecture's four cases are positive × positive (as is),
negative × positive (sign-extend the partial products correctly), positive × negative (swap
the operands), negative × negative (negate both). **Booth's algorithm** removes the cases
and, as a bonus, handles runs of ones cheaply: a run such as $01111 = 10000 - 00001$ costs one
subtraction and one addition instead of four additions. It scans the multiplier one bit at a
time with the previous bit alongside: on a $10$ pair subtract the multiplicand, on $01$ add
it, on $00$ or $11$ do nothing, then shift the whole accumulator–multiplier pair right one
place keeping the sign.

```sim
id: arch-228-signed-booth
custom: true
engine: arch
mode: multiply
a: -3
b: 7
bits: 4
algo: booth
note: "The table shows the accumulator A, the multiplier Q and the extra bit Q₋₁ after each step. The multiplier 0111 is one run of ones: Booth subtracts M once (on the 10 pair) and adds it once (on the 01 pair) — two operations instead of three additions — and the signs take care of themselves because everything is two's complement. A:Q at the end is the 8-bit product −21."
```

## Dividing

The course divides positive by positive and settles signs afterwards. **Restoring division**
is long division in binary: shift the dividend left one bit into a remainder register, try
subtracting the divisor; if the result went negative, put it back (restore) and write a
quotient bit of 0, otherwise keep it and write 1.

```sim
id: arch-228-signed-divide
custom: true
engine: arch
mode: divide
a: 13
b: 3
bits: 4
note: "Four iterations for four quotient bits: shift, trial subtraction, keep or restore. The remainder register A has one extra bit so the trial can go negative. 13 = 3 × 4 + 1: quotient 0100, remainder 0001."
```

**Fixed-point** arithmetic is the cheap way to have fractions: agree that the point sits a
fixed number of bits from the right, do ordinary integer arithmetic, and remember where the
point is. It is as fast as integer math and exact within its range; the alternative, moving
the point per number, is the next unit.

**Equations**

- *Two's complement of $x$ on $n$ bits*: $\bar x + 1 = 2^n - x$; range $-2^{n-1} \dots 2^{n-1} - 1$.
- *Excess-N*: store $x + N$; with $N = 2^{n-1} - 1$ on 8 bits, $-45 \to 82 = 01010010$.
- *Flags after $A + B$*: $C$ = carry out of the top bit; $V$ = carry into the top bit $\oplus$ carry out of it; $N$ = top bit of the result; $Z$ = result is zero.
- *Subtraction*: $A - B = A + \bar B + 1$.
- *Shift-and-add*: $A \times B = \sum_{i : b_i = 1} A \cdot 2^i$; an $n \times n$ product needs $2n$ bits.

> **Key insight.** Two's complement turns "subtract" into "add the complement" and lets a single
> adder serve both signs — the whole reason it won. What it cannot do is make a result fit:
> the carry and overflow flags exist because the hardware can only report that the
> interpretation the program chose has run out of bits.

## Further reading

- [Two's complement](https://en.wikipedia.org/wiki/Two%27s_complement) — the representation, its arithmetic and the most-negative-number quirk.
- [Signed number representations](https://en.wikipedia.org/wiki/Signed_number_representations) — sign-magnitude, one's complement, excess-N side by side.
- [Booth's multiplication algorithm](https://en.wikipedia.org/wiki/Booth%27s_multiplication_algorithm) — the run-of-ones trick with worked examples.
- [Division algorithm](https://en.wikipedia.org/wiki/Division_algorithm#Restoring_division) — restoring and non-restoring division.
