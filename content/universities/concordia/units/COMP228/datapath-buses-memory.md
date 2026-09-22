---
title: The datapath — buses, register-transfer notation and memory
order: 9
status: detailed
weeks: [7, 8]
notes: ["Lecture 7, slide 2: organisation versus architecture, what is still missing", "Lecture 7, slides 5–6: registers and an ALU on a bus, load and enable, register-transfer notation", "Lecture 7, slides 7–8: memory as an array of registers behind a decoder, the chip's signals, MAR and MDR", "Lecture 8, slides 3–4: the simplified block diagram, the real 6502's registers and buses, why a 16-bit address on an 8-bit machine is two registers"]
textbook: ""
introduces: [cpu-organization]
requires:
  - {concept: sequential-circuit, strength: hard}
  - {concept: digital-logic, strength: hard}
reinforces: []
---

Registers hold values and an ALU computes with them; what is missing is the wiring that moves
a value from a register to the ALU and back, and the language for saying which move happens
when. The lecture's own phrasing: **computer organisation** is the components built so far,
**computer architecture** is the decisions about how they are glued together. This unit
does the gluing — a bus, a notation for transfers over it, and a memory that hangs off it
through two special registers.

## A bus

Wire every register's output to every other register's input and the diagram becomes a
thicket. Instead, run one bundle of wires — a **bus**, as wide as the word — past every
component, and let each component either *drive* the bus, *read* the bus, or ignore it.

- Each register's output passes through a tri-state buffer controlled by its **enable**
  line: enabled, the register drives its value onto the bus; disabled, it is disconnected.
- Each register's input is the bus, gated by its **load** line: at the clock edge, a register
  whose load is asserted captures whatever is on the bus.
- Only one enable may be active at a time — two drivers on one bus is the fire from the
  previous unit — while any number of loads may be.

The lecture's highway picture fits: one road, many on-ramps and exits, every car visible to
every exit, and traffic control deciding who merges and who leaves. The ALU joins the same
bus with two input latches (its left and right operands must be captured on separate
cycles, since the bus carries one value at a time) and its own output enable.

## Register-transfer notation

Listing which control lines are 0 and 1 for every step is exact but unreadable. **Register-
transfer notation** (RTN) writes what the signals *achieve*: `R1 → R2` (or `R2 ← R1`) means
"R1's enable and R2's load, everything else off, for one clock cycle". A transfer with an
operation, `ACC ← ACC + R1`, takes three cycles on a single bus: `ACC → LHS`, `R1 → RHS`,
then `ALU(+) → ACC` with the ALU's operation select set to add. One bus, one value per cycle,
so RTN steps are also a count of cycles.

```sim
id: arch-228-datapath-rtn
custom: true
engine: arch
mode: rtn
program: |
  R1 → R2
  ACC ← ACC + R1
  R3 ← R2 - R1
regs: {ACC: 5, R1: 3, R2: 0, R3: 0}
note: "Each transfer becomes one or more bus cycles. The green box is the register whose enable drives the bus, the blue box the one whose load captures it, and the bus itself turns red while it carries a value. A two-operand transfer costs three cycles: the operands go to the ALU's LHS and RHS latches one at a time, then the ALU result comes back. Edit the transfers in the box and run again."
```

## Memory

A **memory** is an array of register-like cells with a decoder in front. The address bits
feed the decoder; the decoder's one active output selects a cell; the cell's load and
enable are the chip's write and read signals ANDed with that selection. From outside, a
memory chip has:

- **address lines** $A_{m-1} \dots A_0$ — $m$ of them select $2^m$ locations;
- **data lines** $DQ_{n-1} \dots DQ_0$ — the chip's internal bus, brought out;
- **output enable** (OE) — drive the addressed cell onto the data lines (a read);
- **write enable** (R/$\bar W$) — load the addressed cell from the data lines (a write);
- **chip enable** (CE) — ignore every other input when this chip is not the one addressed,
  so several chips can share the lines.

The widths are independent: a chip with 15 address lines and 8 data lines holds
$2^{15} = 32\,768$ bytes, and a wider memory is built from several such chips. How many
chips, arranged how, is a small design problem the next lecture returns to; the simulator
below does the arithmetic.

```sim
id: arch-228-datapath-chips
custom: true
engine: arch
mode: memory-chips
chip: 8x4
memory: 32x8
address: 21
note: "A 32-location, 8-bit memory from 8×4 chips: two chips side by side give the eight data bits, four rows of them give the 32 addresses. The chip's three address lines go to every chip; the memory's two extra address bits go through a 2-to-4 decoder whose outputs are the chip-enable lines, so one row answers. Address 21 = 10101: the top two bits pick row 2, the low three bits pick location 5 inside each of its chips."
```

## MAR and MDR

The CPU talks to memory through two registers that sit on its bus and are wired to the
chip's lines:

- the **memory address register** (MAR), whose output is connected to the address lines;
- the **memory data register** (MDR), connected to the data lines, so a value can go either
  way.

A read is two RTN steps: `MAR ← address`, then `MDR ← M[MAR]` — memory's output enable with
MDR's load. A write: `MAR ← address`, `MDR ← value`, then `M[MAR] ← MDR` — MDR's buffer onto
the data lines with memory's write enable. Everything else the CPU does with memory is built
from those two sequences.

```sim
id: arch-228-datapath-memory-access
custom: true
engine: arch
mode: rtn
program: |
  R1 → MAR
  M[MAR] → MDR
  MDR → ACC
  ACC ← ACC + R2
  ACC → MDR
  R3 → MAR
  MDR → M[MAR]
regs: {R1: "$20", R2: 7, R3: "$21"}
memory: {"$20": 35, "$21": 0}
note: "Read the byte at $20 into ACC, add 7, and write the 42 to $21 — the whole trip through MAR and MDR, nine bus cycles for three lines of a high-level program. Memory reads and writes bypass the bus: they happen over the address and data lines drawn to the memory box, which lights up while the chip is selected. Note the order at the end: MDR must hold the value before MAR is pointed at the destination, because the write uses both at once."
```

## The picture so far, and the real thing

With load and enable hidden (every register has both) and arrows for data flow — inbound on
D, outbound through a tri-state on Q — the block diagram of the lecture's toy CPU is small:
ACC, R1 and R2 on a bus with an ALU and its two input latches, plus MAR and MDR to memory.
The block diagram of a real processor, the 1975 MOS 6502 the course adopts as its model, is
the same drawing with more registers: an accumulator A, index registers X and Y, a stack
pointer S, and the program counter — held as two 8-bit halves, PCL and PCH — together with
an address bus register split the same way. The split is the price of addressing $2^{16}$
bytes on an 8-bit machine: every address is two bytes, so every address register is two
registers, and the fetch–execute cycle of the next unit moves them one at a time.

**Equations**

- *One bus cycle*: exactly one enable active, any loads; `X → Y` = enable$_X$ ∧ load$_Y$.
- *ALU transfer on one bus*: `D ← X op Y` costs three cycles (`X → LHS`, `Y → RHS`, `ALU → D`).
- *Memory size*: $m$ address lines × $n$ data lines = $2^m$ locations of $n$ bits.
- *Read*: `MAR ← addr; MDR ← M[MAR]`; *write*: `MAR ← addr; MDR ← v; M[MAR] ← MDR`.

> **Key insight.** A bus turns "move this value there" into a pattern of enable and load
> signals held for one clock edge, and RTN is the shorthand for those patterns. Memory is
> just more registers behind a decoder, reached through MAR and MDR — so the CPU's entire
> life, fetching and executing instructions, is going to be a script of transfers like the
> ones above.

## Further reading

- [Bus (computing)](https://en.wikipedia.org/wiki/Bus_(computing)) — buses, tri-state drivers and arbitration.
- [Register transfer language](https://en.wikipedia.org/wiki/Register_transfer_language) — the notation and how control units are described with it.
- [Memory address register](https://en.wikipedia.org/wiki/Memory_address_register) and [Memory buffer register](https://en.wikipedia.org/wiki/Memory_buffer_register) — MAR and MDR.
- [MOS Technology 6502](https://en.wikipedia.org/wiki/MOS_Technology_6502) — the processor whose organisation the course follows.
