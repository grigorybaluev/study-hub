---
title: Floating point and text
order: 4
status: detailed
weeks: [2, 3]
notes: ["Lecture 2, slides 15–16: sign, exponent and mantissa, the hidden one, the special cases zero, denormal, infinity and NaN, what arithmetic has to do", "Lecture 3, slide 8: 0.1 + 0.2, comparison with a tolerance, the 32- and 64-bit formats", "Lecture 3, slides 9–10: everything else as numbers — vectors, text, images, sound; the text encodings from Morse to UTF-8"]
textbook: ""
introduces: [floating-point, character-encoding]
requires:
  - {concept: number-representation, strength: hard}
reinforces: []
---

Fixed-point arithmetic keeps the binary point in one place and pays for it with range: a
number that needs many bits before the point leaves few for after it. Floating point moves
the point per number, the way scientific notation does, and lets one 32-bit word hold both
the mass of an electron and the mass of the sun — at the price of a precision that is
relative, not absolute. The second half of this unit is the other half of the deck's
question "what else is a number?": text.

## Sign, exponent, mantissa

Write a binary number in scientific notation and it always starts with a 1: $101.101_2$ is
$1.01101 \times 2^2$, $0.00111_2$ is $1.11 \times 2^{-3}$. A floating-point format stores three
things and squeezes them into a fixed number of bits:

- the **sign**, one bit, as in sign-magnitude;
- the **exponent**, in excess-N so that unsigned comparison orders the values correctly;
- the **mantissa** (or significand): the digits after the leading 1. Since every non-zero
  binary number starts with a 1, that bit is not stored at all — the **hidden bit** — and the
  mantissa field holds only the fraction part.

> **Definition — IEEE 754 encoding.** With $e$ exponent bits and $m$ mantissa bits, a normal
> number $\pm 1.f \times 2^{x}$ is stored as sign $s$, exponent field $E = x + (2^{e-1} - 1)$,
> mantissa field $M = f$ truncated or rounded to $m$ bits; its value is
> $(-1)^s \times 1.M \times 2^{E - \text{bias}}$. The standard 32-bit format has $e = 8$,
> $m = 23$ (bias 127); the 64-bit format $e = 11$, $m = 52$ (bias 1023).

The lecture works in a small "mystery" format with a 5-bit exponent (bias 15) and a 10-bit
mantissa to keep the bit strings short; it is in fact the standard's half-precision format.

> **Example — 5.625 in the 5/10 format.** $5.625 = 101.101_2 = 1.01101 \times 2^2$. Sign 0.
> Exponent $2 + 15 = 17 = 10001$. Mantissa: the bits after the leading 1, padded to ten:
> $0110100000$. Stored: `0 10001 0110100000`.

```sim
id: arch-228-float-encode
custom: true
engine: arch
mode: float
value: "5.625"
exp: 5
mant: 10
note: "Binary expansion, normalisation, biasing the exponent, dropping the hidden one — one step each, then the three fields and a read-back. 5.625 is exact because its fraction terminates within ten bits. Try 0.1: the mantissa is cut off and rounded, and the read-back shows the value that was actually stored."
```

Reading a stored pattern back is the same recipe reversed: split the fields, un-bias the
exponent, put the hidden 1 in front of the mantissa.

```sim
id: arch-228-float-decode
custom: true
engine: arch
mode: float
bits: "1 01110 1000000000"
exp: 5
mant: 10
note: "Decoding: sign 1, exponent 01110 = 14, minus the bias 15 gives −1, significand 1.1 — so the value is −1.5 × 2⁻¹ = −0.75. Change the bits to 0 00000 0000000001 for the smallest denormal, or 0 11111 0000000000 for infinity."
```

## The special cases

Four bit patterns are reserved so that the format can say things ordinary numbers cannot:

- **Zero**: exponent and mantissa all 0. The hidden-1 rule would make zero unrepresentable
  otherwise. The sign bit still counts, so $-0$ exists.
- **Denormal** (subnormal): exponent all 0, mantissa not all 0. The hidden bit is taken as 0
  and the exponent fixed at $1 - \text{bias}$, which fills the gap between zero and the
  smallest normal number at reduced precision.
- **Infinity**: exponent all 1, mantissa all 0, with sign. The result of overflow or of
  dividing by zero.
- **NaN** (not a number): exponent all 1, mantissa not all 0. The result of $\infty - \infty$
  or $0/0$; a NaN is never equal to anything, including itself.

## What arithmetic costs

Adding two floating-point numbers is not one adder step. The hidden ones have to be put back,
the smaller exponent's mantissa shifted right until the two points line up (losing bits off
the end), the signed significands added, the result normalised so it starts with a 1 again,
rounded back to the mantissa width, and re-packed. Multiplication is easier — multiply
mantissas, add exponents — which is one reason floating-point units are large.

```sim
id: arch-228-float-add
custom: true
engine: arch
mode: float-add
a: 0.1
b: 0.2
exp: 8
mant: 23
note: "0.1 + 0.2 in single precision: unpack, align (the smaller exponent's significand shifts right one place), add, renormalise, round, pack. Neither input is exactly representable, the sum picks up a rounding error of its own, and the result is not the stored 0.3 — which is why comparing floating-point values with == is a bug and a tolerance is used instead."
```

The lecture's list of peculiarities follows from this: fractions that terminate in one base
need not in another; precision and rounding make results slightly inexact; equality tests
fail; and there is a largest integer above which consecutive integers can no longer be told
apart (for doubles, $2^{53}$).

```sim
id: arch-228-float-overflow
custom: true
engine: arch
mode: float
value: "70000"
exp: 5
mant: 10
note: "70000 needs an exponent of 16, and the 5-bit field with bias 15 tops out at 15 (the all-ones pattern is reserved for infinity), so the encoder reports an overflow and stores +∞. Try 65504, the largest half-precision value, and 65520, which rounds up past it."
```

## Everything else is numbers too

A vector is a few floating-point numbers side by side — `(3.0, 4.0, 5.0)` in single precision
is twelve bytes, `40400000 40800000 40A00000` in hex. An image is a grid of pixels, each a
small vector of red, green and blue intensities; a sound is a list of samples of a waveform;
a video is many images plus sound. Text is a table from characters to numbers.

> **Definition — character encoding.** A **character encoding** assigns each character a
> number (its code point) and a way of writing that number in bytes. **ASCII** uses one byte
> per character with the high bit clear — 128 codes for the Latin letters, digits,
> punctuation and control characters. **Unicode** assigns code points to every script, and
> **UTF-8** writes them in one to four bytes so that the ASCII characters keep their
> single-byte forms.

The lecture's list of systems — Morse code, ITA-2 teleprinter code, ASCII, BCD and EBCDIC on
IBM machines, the ISO-8859 family, UCS-2/UTF-16, UTF-8 — is a history of the same idea with
more and more characters. Two are worth knowing: ASCII, because the course's assembly
programs write bytes to the screen by their ASCII codes (`'A'` is 65, a newline 10), and
UTF-8, because it is what nearly all text on the web is stored in.

```sim
id: arch-228-text-bytes
custom: true
engine: arch
mode: text
text: "Ok, ça va? €5"
note: "Each character to its code point, then to bytes. The ASCII characters take one byte with the high bit 0; ç (U+00E7) takes two bytes and € (U+20AC) three, with the leading bits of each byte marking how long the sequence is — that self-description is what lets UTF-8 be read from any starting point. Type your own text into the box."
```

**Equations**

- *Value of a normal number*: $(-1)^s \times 1.M \times 2^{E - \text{bias}}$, bias $= 2^{e-1} - 1$.
- *Formats*: half 1/5/10 (bias 15), single 1/8/23 (bias 127), double 1/11/52 (bias 1023).
- *Denormal*: $(-1)^s \times 0.M \times 2^{1 - \text{bias}}$.
- *Relative precision*: about $2^{-m}$ — one part in $2^{23} \approx 8 \times 10^6$ for singles, $2^{52} \approx 4.5 \times 10^{15}$ for doubles.
- *UTF-8 lengths*: code points below $2^7$ take 1 byte, below $2^{11}$ 2, below $2^{16}$ 3, otherwise 4.

> **Key insight.** Floating point trades absolute precision for range by storing a number as a
> fraction and a scale; every oddity — the missing 0.1, the failed equality, the largest safe
> integer — is that trade showing through. Text, images and sound are the same lesson from
> the other side: the hardware never sees a character or a colour, only an agreed encoding.

## Further reading

- [IEEE 754](https://en.wikipedia.org/wiki/IEEE_754) — the standard, its formats and rounding modes.
- [Half-precision floating-point format](https://en.wikipedia.org/wiki/Half-precision_floating-point_format) — the 5/10 format used throughout the lecture, with its exact largest and smallest values.
- [Floating-point arithmetic — accuracy problems](https://en.wikipedia.org/wiki/Floating-point_arithmetic#Accuracy_problems) — why 0.1 + 0.2 is not 0.3.
- [UTF-8](https://en.wikipedia.org/wiki/UTF-8) — the byte layout and why it won.
