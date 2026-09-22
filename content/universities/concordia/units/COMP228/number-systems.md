---
title: "Number systems: positional numerals and conversion between bases"
order: 2
status: detailed
weeks: [2]
notes: ["Lecture 2, slides 2–3: positional notation with fractional parts, conversion by division and multiplication", "Lecture 2, slides 4–5: why binary, fast conversion between binary, octal and hexadecimal"]
textbook: ""
introduces: [number-representation]
requires: []
reinforces: []
---

A computer stores a number as a row of wires that are either on or off, so every number a
program uses has to be written in base 2 sooner or later. This unit is about the writing:
what a positional numeral means in any base, how to move a value from one base to another
digit by digit, and why programmers read binary through the shorthand of octal and
hexadecimal.

## Positional notation

> **Definition.** In base $b$ the numeral $d_n d_{n-1} \dots d_1 d_0 . d_{-1} d_{-2} \dots$
> stands for $\sum_i d_i \, b^{\,i}$: each digit is weighted by a power of the base, with
> negative powers to the right of the point. The digits run from $0$ to $b - 1$.

Base 10 is the familiar case: $2\,047 = 2 \cdot 10^3 + 0 \cdot 10^2 + 4 \cdot 10 + 7$, and
$0.375 = 3 \cdot 10^{-1} + 7 \cdot 10^{-2} + 5 \cdot 10^{-3}$. Nothing in the definition
prefers ten. In base 5 the numeral $312.4_5$ is $3 \cdot 25 + 1 \cdot 5 + 2 + 4/5 = 82.8_{10}$;
in base 2 the numeral $1011.01_2$ is $8 + 2 + 1 + \tfrac14 = 11.25_{10}$. Expanding by place
value is how any numeral is read *into* decimal, and the subscript says which base is meant.

Binary is what hardware speaks because a wire has two clean states and every switch since
the relay has been happiest with two. Two-valued digits also make arithmetic trivially small:
the whole addition table is $0 + 0 = 0$, $0 + 1 = 1 + 0 = 1$, $1 + 1 = 10$.

## From decimal to another base

Going the other way — from a decimal value to base $b$ — splits at the point. The integer
part is peeled off by repeated division: dividing by $b$ leaves the last digit as the
remainder, and the quotient is the numeral with that digit removed, so keep dividing and read
the remainders from the last one back to the first. The fractional part is peeled off by
repeated multiplication: multiplying by $b$ moves the point one place right, and the integer
part that appears is the next digit; keep the fraction and continue.

> **Example — 22.625 to binary.** Integer part: $22 = 2 \cdot 11 + 0$, $11 = 2 \cdot 5 + 1$,
> $5 = 2 \cdot 2 + 1$, $2 = 2 \cdot 1 + 0$, $1 = 2 \cdot 0 + 1$; remainders read backwards give
> $10110$. Fraction: $0.625 \times 2 = 1.25$ → 1, $0.25 \times 2 = 0.5$ → 0, $0.5 \times 2 = 1.0$
> → 1, and the fraction is now 0. So $22.625_{10} = 10110.101_2$.

```sim
id: arch-228-numbers-convert
custom: true
engine: arch
mode: convert
value: "22.625"
from: 10
to: 2
note: "Repeated division for the integer part (read the remainders from the bottom up), repeated multiplication for the fraction (read the integer parts from the top down). Change the target base to 8 or 16, or put a base-2 numeral in with 'from base' 2 to see the place-value expansion that reads it back into decimal."
```

Not every fraction terminates. $0.1_{10}$ is a finite decimal but in binary the multiplication
never reaches zero — $0.1 \times 2 = 0.2$, $0.4$, $0.8$, $1.6$, $1.2$, $0.4$ again — and the
digits repeat forever: $0.0\overline{0011}_2$. A computer with a fixed number of bits has to
cut it off, which is the seed of the round-off error that floating-point arithmetic lives with.

```sim
id: arch-228-numbers-nonterminating
custom: true
engine: arch
mode: convert
value: "0.1"
from: 10
to: 2
note: "The fraction cycles through 0.2, 0.4, 0.8, 0.6 and never hits zero, so the binary expansion repeats; the stepper truncates after twelve digits and says so. The same happens to 1/3 in decimal — which fractions terminate depends on the base, not on the number."
```

## Between binary, octal and hexadecimal

Converting between two bases that are both powers of two needs no arithmetic at all. Since
$8 = 2^3$, one octal digit is exactly three binary digits; since $16 = 2^4$, one hexadecimal
digit is exactly four. To convert, replace each digit by its bit pattern, then regroup the
bits — three or four at a time, outward from the point — into digits of the target base.
Hexadecimal digits beyond 9 are the letters A–F for ten to fifteen.

> **Example.** $2\,6\,5_8 = 010\;110\;101_2$; regrouping the same bits in fours from the right,
> $0\,1011\,0101 = \mathrm{B5}_{16}$. Check through decimal: $2 \cdot 64 + 6 \cdot 8 + 5 = 181 = 11 \cdot 16 + 5$.

```sim
id: arch-228-numbers-fast
custom: true
engine: arch
mode: convert
value: "265"
from: 8
to: 16
fast: true
note: "Each octal digit becomes three bits, the bit string is regrouped four at a time from the point, and each group becomes one hex digit — no division anywhere. Set 'to base' to 2 to stop after the first step, or convert from 16 to 8 to regroup the other way (the leading zeros the regrouping adds are harmless)."
```

This is why hexadecimal is the programmer's way of writing binary: a byte is two hex digits,
a 32-bit word eight, and each digit can be turned into its four bits in one's head. Memory
dumps, colour codes, machine-code listings and network addresses are all hex for that reason;
octal survives in Unix file permissions, where three bits per digit match the three
permission flags.

**Equations**

- *Place value*: $(d_n \dots d_0 . d_{-1} \dots)_b = \sum_i d_i b^{\,i}$.
- *Integer to base $b$*: repeat $n = b \cdot q + r$; the remainders $r$ are the digits, last one first.
- *Fraction to base $b$*: repeat $f \cdot b = d + f'$; the integer parts $d$ are the digits, first one first.
- *Power-of-two bases*: one base-$2^k$ digit = $k$ bits; $\mathrm{FF}_{16} = 11111111_2 = 377_8 = 255_{10}$.

> **Key insight.** A numeral is a recipe, not a number: $11.25$, $1011.01_2$ and $\mathrm{B.4}_{16}$
> name the same value. Conversion just re-expresses the recipe in another base's powers, and
> whether a fraction terminates is a property of the base — the reason a computer cannot
> hold one tenth exactly.

## Further reading

- [Positional notation](https://en.wikipedia.org/wiki/Positional_notation) — the general definition and its history.
- [Binary number](https://en.wikipedia.org/wiki/Binary_number) — arithmetic and conversion, with the repeating-fraction cases.
- [Hexadecimal](https://en.wikipedia.org/wiki/Hexadecimal) — why programmers write bits four at a time.
