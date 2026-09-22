---
title: The control unit and the instruction cycle
order: 10
status: detailed
weeks: [8]
notes: ["Lecture 8, slides 5–6: what the control unit takes in and puts out; the instruction register; fetch in RTN", "Lecture 8, slides 7–9: the 6502 instruction set by group, a transfer instruction cycle by cycle", "Lecture 8, slides 10–11: the addressing modes, a direct load cycle by cycle", "Lecture 8, slides 12–14: the stack and register addressing, branching and subroutines, pipelining"]
textbook: ""
introduces: [assembly-language]
requires:
  - {concept: cpu-organization, strength: hard}
  - {concept: stack, strength: soft}
reinforces: []
---

The datapath can move values wherever a script of register transfers says. What writes the
script? The **control unit**: combinational logic that reads the current instruction and a
cycle counter and asserts, cycle by cycle, exactly the load, enable and ALU signals the
instruction needs. This unit follows one instruction from the byte in memory to the
transfers it causes, on the course's model machine, the 6502 — and then looks at what an
instruction set has to contain for programs to loop, decide and call.

## Inputs and outputs of the control unit

The control unit's inputs are the **instruction register** (IR), which holds the instruction
being executed; a cycle counter driven by the clock, so the same instruction can do
different things on its first, second and third cycle; the status flags, for conditional
instructions; and external signals such as reset and interrupts. Its outputs are every
control line in the machine: each register's load and enable, memory's read and write, the
ALU's operation select. Hardwired control units compute these with fixed logic;
microprogrammed ones look them up in a small internal memory, which makes the instruction
set changeable.

Before any of that can happen the instruction must reach the IR, and that is the same for
every instruction. In RTN, on the 6502, the **fetch** is:

- `PC → MAR`, `PC + 1 → PC` — the program counter names the next instruction byte and
  advances;
- `M[MAR] → MDR`, `MDR → IR` — the byte arrives and the control unit can begin decoding.

On the 6502 the address is two bytes and the program counter two registers (`PCH → ABH,
PCL → ABL`), but the shape is the same. What follows the fetch depends on the instruction.

## Instructions and their encoding

Machine code is **variable width** on the 6502: the first byte is always the opcode, and 0,
1 or 2 operand bytes follow depending on the instruction and its addressing mode. The
instruction set, grouped the way the lecture groups it:

| group | instructions |
|---|---|
| load, store, transfer | `LDA LDX LDY STA STX STY TAX TAY TXA TYA TSX TXS` |
| stack | `PHA PLA PHP PLP` |
| arithmetic and logic | `ADC SBC CMP CPX CPY AND ORA EOR BIT ASL LSR ROL ROR INC DEC INX INY DEX DEY` |
| flow control | `JMP JSR RTS` and the branches `BEQ BNE BPL BMI BCC BCS BVC BVS` |
| flags | `CLC SEC CLI SEI CLD SED CLV` |
| interrupts | `BRK RTI` |
| nothing | `NOP` |

There is no need to memorise the table; what matters is that each mnemonic and addressing
mode pair has its own opcode byte, and the control unit's decoder is a truth table from that
byte to a sequence of transfers.

> **Example — `TXA`, transfer X to A.** Fetch: `PC → MAR, PC + 1 → PC`; `MDR → IR`. The
> control signals for opcode `8A` become valid on the next clock. Execute: `X → A`, then
> reset the cycle counter so the next fetch starts. Three cycles, no memory access beyond
> the fetch — an *implied* addressing instruction.

```sim
id: arch-228-control-micro
custom: true
engine: arch
mode: cpu
micro: true
program: |2
      LDX #7
      TXA
      LDA $0300
      BRK
      .org $0300
  val: .byte $2A
note: "Each step is one register transfer, and the side panel shows MAR, MDR and IR alongside the programmer's registers. Every instruction starts with the same two fetch steps; then TXA executes in one transfer, while LDA $0300 spends two more cycles fetching its two address bytes and one reading the operand before the load. Count the cycles: the addressing mode is most of the cost."
```

## Addressing modes

An instruction's operand can be given in several ways, and the ways are the **addressing
modes**. Each is a different sequence of transfers between the fetch and the execute:

- **Implied**: no operand; the instruction names its registers (`TXA`, `INX`, `CLC`).
- **Immediate**: the operand *is* the next byte (`LDA #5`): one more fetch.
- **Direct** (absolute, or zero page when the address is one byte): the next byte(s) are
  the *address* of the operand (`LDA $0300`): fetch the address bytes into MAR — the 6502
  parks the low byte in a temporary register while the high byte arrives — then read.
- **Indexed**: the instruction carries the start of an array and a register holds the
  offset (`LDA table,X`): add before reading. This is how loops walk arrays.
- **Indirect**: the instruction carries the address of a place in memory that holds the
  address of the operand — the lecture's treasure map: first fetch the map, then follow it
  (`JMP ($0400)`, and the zero-page forms `(zp,X)` and `(zp),Y`, the latter combining a
  pointer with an index).

```sim
id: arch-228-control-addressing
custom: true
engine: arch
mode: cpu
program: |2
      LDA #5          ; immediate: the operand is in the instruction
      LDA count       ; direct: the operand's address is in the instruction
      LDX #2
      LDA table,X     ; indexed: base address in the instruction, offset in X
      LDY #1
      LDA (ptr),Y     ; indirect indexed: pointer in zero page, then an offset
      BRK
      .org $0010
  ptr:   .word table
      .org $0300
  count: .byte 9
  table: .byte 10, 20, 30, 40
note: "The same instruction, LDA, with four addressing modes, one per step. The step text names the effective address each mode computes: 'table,X' adds X to the base; '(ptr),Y' first reads the two-byte pointer at $10, then adds Y. Watch A take 5, 9, 30 and 20 in turn. The listing shows that immediate and zero-page forms are two bytes, absolute forms three."
```

## The stack

Registers run out, so every architecture sets aside a region of memory as a **stack**: a
last-in-first-out store with a **stack pointer** register holding the address of the top.
The 6502's stack lives in page 1 ($0100–$01FF), grows downward, and has dedicated push and
pop instructions that use **register addressing** — the address is in a register, here S,
with a post-decrement on push and a pre-increment on pop. The stack is what makes
subroutines and recursion possible: it is where return addresses and saved registers go.

## Branching and subroutines

Instructions run in sequence because the fetch increments PC. Everything else a program
does — `if`, `while`, `for`, method calls — is a change to PC, and there are four kinds:

1. an **unconditional jump** loads PC with a new address;
2. a **conditional branch** loads it only if a flag has a given value — `BNE` branches when
   Z = 0, `BCC` when C = 0, and so on; the flags were set by a preceding ALU operation, so
   `CMP` followed by a branch is how a comparison is compiled;
3. a **jump to subroutine** saves the return address — on a link register or, on the 6502,
   pushed onto the stack — before jumping;
4. a **return** pops it back into PC.

```sim
id: arch-228-control-subroutine
custom: true
engine: arch
mode: cpu
program: |2
      LDA #0
      LDX #0
  loop:
      CLC
      ADC data,X      ; running total in A
      INX
      CPX #4
      BNE loop        ; Z = 0 while X != 4
      JSR double      ; call: push the return address, jump
      STA result
      BRK
  double:
      ASL A           ; A = 2A
      RTS             ; pop the return address, continue after the JSR
  data:   .byte 3, 5, 7, 9
  result: .byte 0
note: "A counted loop and a subroutine call. CPX sets Z when X reaches 4, BNE stops branching, and the total 24 goes to the subroutine: JSR pushes the return address on the stack (watch S drop from $FF to $FD and the stack pane fill), RTS pops it, and the doubled value 48 lands in result. The same four ideas — jump, conditional branch, call, return — are every control structure in COMP 248 compiled."
```

Interrupts, in a later unit, are a fifth case: an external signal that makes the control
unit perform a subroutine call the program did not write.

## Pipelining

An instruction takes several cycles, and during most of them parts of the CPU are idle: the
adder waits while an address is fetched, memory waits while the ALU works. **Pipelining**
overlaps the phases of consecutive instructions — fetching the next while the current one
executes — so that, in the steady state, one instruction completes per cycle even though
each takes several. Modern CPUs lean on it heavily, deep enough that guessing which way a
branch will go became necessary, and that guessing is where the Spectre and Meltdown
vulnerabilities came from.

**Equations**

- *Fetch*: `PC → MAR; PC + 1 → PC; M[MAR] → MDR; MDR → IR`.
- *Instruction length* (6502): 1 byte implied/accumulator, 2 bytes immediate/zero-page/relative, 3 bytes absolute/indirect.
- *Effective address*: immediate — none; direct — the operand bytes; indexed — base + X (or Y); indirect — M[pointer].
- *Push*: `M[$0100 + S] ← v; S ← S − 1`; *pop*: `S ← S + 1; v ← M[$0100 + S]`.
- *Branch*: `PC ← PC + offset` if the tested flag matches, else fall through.

> **Key insight.** An instruction is a name for a script of register transfers, and the
> control unit is the decoder that turns the opcode byte plus a cycle count into that
> script. Addressing modes are the part of the script that finds the operand; jumps,
> branches, calls and returns are the part that rewrites the program counter — and that is
> all a machine needs to run any program.

## Further reading

- [Control unit](https://en.wikipedia.org/wiki/Control_unit) — hardwired and microprogrammed control.
- [Instruction cycle](https://en.wikipedia.org/wiki/Instruction_cycle) — fetch, decode, execute.
- [Addressing mode](https://en.wikipedia.org/wiki/Addressing_mode) — the general catalogue, with the 6502's forms among them.
- [MOS Technology 6502 — registers and instruction set](https://en.wikipedia.org/wiki/MOS_Technology_6502#Registers) — the real machine the examples run on.
- [Instruction pipelining](https://en.wikipedia.org/wiki/Instruction_pipelining) — overlapping the cycle across instructions.
