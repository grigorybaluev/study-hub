---
title: Error detection and correction
order: 5
status: detailed
weeks: [4]
notes: ["Lecture 4, slides 2–3: bit error rate, detection by redundancy — parity, checksums, CRC", "Lecture 4, slide 4: correction — retransmission, two-dimensional parity, Hamming codes, Reed–Solomon in outline", "Lecture 4, slide 5: Hamming distance and Gray codes"]
textbook: ""
introduces: [error-correcting-codes]
requires:
  - {concept: number-representation, strength: hard}
reinforces: []
---

Bits flip. A cosmic ray, a weak cell in a memory chip, noise on a cable or a scratch on a
disc turns a 0 into a 1, and the probability per bit — the **bit error rate** — is small but
never zero, so the more bits a system moves the more certain it is that some of them are
wrong. Two questions follow: how does the receiver *know* a word is damaged, and can it
*repair* the word without asking for it again? Both are answered by sending a little more
than the data.

## Detecting: spend one bit

> **Definition — parity.** A **parity bit** is appended to a data word so that the total
> number of 1s is even (even parity) or odd (odd parity). A receiver counts the 1s; a wrong
> count means at least one bit flipped.

One parity bit catches every single-bit error and, more generally, every error that flips an
odd number of bits — but two flips cancel and pass unnoticed, and even when it fires it says
nothing about *which* bit went wrong.

```sim
id: arch-228-errors-parity
custom: true
engine: arch
mode: parity
data: "1101001"
kind: even
flip: 4
note: "Seven data bits have four 1s, so even parity appends a 0. A flip in transit makes the count odd and the receiver's check fails — but the same failure would come from flipping any of the eight positions, so parity can only report, not locate. Set the flip to blank for a clean transmission, or switch to odd parity."
```

Stronger detection buys more coverage with more bits. A **checksum** adds up the words of a
block and appends the sum, catching most multi-bit errors; a **cyclic redundancy check**
(CRC) treats the block as a polynomial and appends the remainder of a division, catching
every burst of errors up to the CRC's width — a CRC-32 misses nothing shorter than 33 bits
in a row. All of these still only detect.

## Correcting: locate the bit

If the sender can be asked again, detection is enough: keep requesting until a clean copy
arrives. Storage cannot be asked again, and neither can a broadcast, so the receiver needs to
find the bad bit itself — and in binary, finding it *is* fixing it, since the only repair is
to flip it back.

**Two-dimensional parity** arranges the data in a grid and computes a parity bit for every
row and every column. A single flip breaks exactly one row check and one column check, and
the bad bit sits at their intersection.

```sim
id: arch-228-errors-parity-2d
custom: true
engine: arch
mode: parity
data: "1101 1010 0111"
flip: "2,1"
note: "Three rows of four bits get a parity bit each, then every column gets one too (including the column of parity bits). After the flip, row 2 and column 1 both fail and the receiver flips the bit where they cross. The cost is one extra bit per row and per column; two flips in the same row would confuse it."
```

**Hamming codes** do the same job with fewer redundant bits by making every parity bit
cover a cleverly chosen subset of positions. Number the positions of the code word from 1;
put parity bits at the powers of two (1, 2, 4, 8, …) and data bits everywhere else; let parity
bit $2^i$ cover every position whose binary index has bit $i$ set. Then when one bit flips,
the set of parity checks that fail is exactly the binary index of the flipped position —
the checks *spell out* where the error is.

> **Example — four data bits.** Data $1101$ goes into positions 3, 5, 6, 7; positions 1, 2
> and 4 are parity. $p_1$ covers positions 1, 3, 5, 7; $p_2$ covers 2, 3, 6, 7; $p_4$ covers
> 4, 5, 6, 7. Each is chosen to make its group's parity even. If position 5 then flips,
> $p_1$ and $p_4$ fail and $p_2$ passes: $1 + 4 = 5$.

```sim
id: arch-228-errors-hamming
custom: true
engine: arch
mode: hamming
data: "1101"
flip: 5
note: "The coverage rows show which positions each parity bit checks; a data bit in position 5 (binary 101) is covered by p1 and p4 and nothing else. After the flip those two checks fail and their sum names the position. Try any flip from 1 to 7 — including the parity positions themselves — and the syndrome always points at it. Eight data bits need four parity bits, twelve positions in all."
```

Four data bits cost three parity bits here, but the ratio improves fast: $r$ parity bits
serve up to $2^r - r - 1$ data bits, so 11 data bits need 4 and 26 need 5. Hamming codes
still fix only one flip per word; codes that repair several bits in a word — Reed–Solomon,
used in CDs, DVDs and QR codes — rest on the same idea with more algebra.

## Hamming distance and Gray codes

The number of bit positions in which two words differ is their **Hamming distance**, and it
matters even when nothing goes wrong. Counting from 3 to 4 in binary changes three bits at
once, $011 \to 100$; from 7 to 8, four. Real bits do not all change at exactly the same
instant, so a counter passing from 7 to 8 briefly shows values that are neither — a problem
for anything that reads it mid-transition, such as a rotary encoder on a shaft.

> **Definition — Gray code.** An ordering of the $2^n$ binary words in which consecutive
> words differ in exactly one bit (and, in the reflected form, so do the last and the first).

The reflected Gray code is built by doubling: take the list for $n - 1$ bits, append the
same list reversed, prefix the first half with 0 and the second with 1. Equivalently, the
Gray code of $b$ is $b \oplus (b \gg 1)$.

```sim
id: arch-228-errors-gray
custom: true
engine: arch
mode: gray
bits: 4
note: "The reflect-and-prefix construction, one bit width at a time, then the table: consecutive binary values differ in up to four bits (0111 → 1000), consecutive Gray codes always in exactly one. The price is that Gray code is not positional — you cannot add two Gray numbers by the usual rules — so it is used at the boundary (encoders, some counters) and converted."
```

**Equations**

- *Parity bit*: $p = d_1 \oplus d_2 \oplus \cdots \oplus d_k$ (even); odd parity is the complement.
- *Hamming code size*: $r$ parity bits suffice when $2^r \ge k + r + 1$ for $k$ data bits; the syndrome is $\sum_{\text{failing } p_{2^i}} 2^i$.
- *Hamming distance*: $d(a, b) = $ number of 1s in $a \oplus b$; a code detects $t$ errors if its minimum distance exceeds $t$, corrects $t$ if it exceeds $2t$.
- *Gray code*: $g = b \oplus (b \gg 1)$; back again with $b_i = g_i \oplus b_{i+1}$ from the top bit down.

> **Key insight.** Redundancy is the only defence against flipped bits, and the question is
> always how much information the extra bits carry: one parity bit says "something is
> wrong", a grid of them says "in this row and this column", and a Hamming code's checks are
> arranged to spell out the address of the fault in binary.

## Further reading

- [Parity bit](https://en.wikipedia.org/wiki/Parity_bit) — one bit, and the two-dimensional extension.
- [Hamming code](https://en.wikipedia.org/wiki/Hamming_code) — the position-numbering construction and the general (2^r − 1, 2^r − r − 1) family.
- [Hamming distance](https://en.wikipedia.org/wiki/Hamming_distance) — the metric behind every code's error budget.
- [Gray code](https://en.wikipedia.org/wiki/Gray_code) — reflected codes, encoders, and conversion formulas.
