---
title: Input and output — polling, interrupts and DMA
order: 13
status: detailed
weeks: [11]
notes: ["Lecture 11, slides 14–15: I/O controllers on the bus, memory-mapped and separate address spaces, the three kinds of I/O", "Lecture 11, slide 16: programmed I/O and the polling loop, the polling-rate trade-off", "Lecture 11, slide 17: what happens on an interrupt, the interrupt service routine", "Lecture 11, slide 18: the DMA controller and its three transfer modes"]
textbook: ""
introduces: [io-and-interrupts]
requires:
  - {concept: cpu-organization, strength: hard}
reinforces: []
---

A keyboard, a screen, a disk and a network card all connect to the CPU the same way memory
does: through a **controller** with address lines, data lines and control lines on the bus.
The difference is what the addresses mean. Reading a memory address gives back what was
stored there; reading a controller's address gives back the state of the device — which
key is down, whether the disk is ready — and writing to one issues a command. The question
this unit answers is how the CPU finds out that a device needs attention, and the three
answers — ask repeatedly, be told, or let the device help itself to memory — are three
different divisions of labour.

## Devices as addresses

An I/O controller can share the memory bus and a slice of the memory address space
(**memory-mapped I/O**, the 6502's way: the output port at `$F000` in this course's
simulator is exactly that), or sit on a separate bus with its own address space and its own
instructions (x86's `in` and `out`). Either way, a **device driver** talks to the hardware by
reading and writing a handful of registers at known addresses: a status register, a data
register, a command register.

## Programmed I/O: polling

The simplest driver treats the device like memory and nothing else. To wait for a key, it
reads the status register in a loop until the "key pressed" bit appears, then reads the data
register:

```c
while (!key_pressed()) { /* nothing, or other work */ }
handle_key();
```

This is **polling**, and the loop's frequency is the **polling rate**. It is the easiest I/O
to write and to build, and it has a built-in trade-off: poll often and events are noticed
quickly but the CPU spends its time asking; poll rarely and the CPU is free but events wait,
and two events between polls look like one — the second is lost.

```sim
id: arch-228-io-polling
custom: true
engine: arch
mode: io
kind: polling
rate: 5
events: "2 6 7 14 21"
note: "Red triangles are device events; the CPU row shows work, P for a poll of the status register, and svc for servicing an event. Polling every five cycles catches the events at 2 and 14 with a delay, misses one of the pair at 6 and 7 outright, and spends a fifth of its time asking. Set the rate to 1 for zero latency at the cost of never working; to 10 to see more events lost."
```

## Interrupts

Instead of the CPU asking, the device tells. A controller has an **interrupt line** to the
CPU, and raising it sets an interrupt-request flag inside the processor. The control unit
checks that flag between instructions, and when it is set — and interrupts are not masked —
it performs a subroutine call that no program wrote:

1. finish the current instruction;
2. save the program counter (on the stack, or in a dedicated register) and the status
   flags;
3. set the interrupt-disable flag so a second interrupt cannot pile on;
4. load PC with the address of the **interrupt service routine** (ISR), found at a fixed
   place — on the 6502, the vector at `$FFFE`–`$FFFF`.

The ISR, part of the device's driver, deals with the device, clears the request, and ends
with a *return from interrupt* that restores the flags and PC. The interrupted program
continues with no idea anything happened — provided the ISR saved and restored every
register it touched.

```sim
id: arch-228-io-interrupt-cpu
custom: true
engine: arch
mode: cpu
interrupt_at: 4
program: |2
      CLI             ; allow interrupts
      LDA #1
      STA $40
      LDA #2          ; the IRQ arrives after this instruction
      STA $41
      LDA #3
      STA $42
      BRK
  irq:                ; the interrupt service routine
      PHA             ; save what we touch
      INC $50         ; count the event
      PLA             ; restore it
      RTI             ; flags and PC come back from the stack
note: "The main program stores 1, 2, 3 to memory; an interrupt arrives after its fourth instruction, with 2 in A. Watch the stack pane: the CPU pushes the return address and the flags, jumps to irq, and the ISR saves A, counts the event at $50 and restores A before RTI pops everything back. The main program then finishes exactly as if nothing had happened — A still holds 2 when the STA at $41 runs."
```

```sim
id: arch-228-io-interrupt-timeline
custom: true
engine: arch
mode: io
kind: interrupt
events: "2 6 7 14 21"
service: 3
note: "The same five events under interrupt-driven I/O: each is noticed the moment the current instruction ends, the ISR runs for three cycles, and nothing is polled or lost — the two events at 6 and 7 queue up and are serviced back to back. The cost is the ISR's cycles plus the context switch, paid only when something actually happens."
```

## Direct memory access

Copying a block from a disk controller into memory by interrupts still means the CPU moves
every word itself. A **DMA controller** is a device whose job is to do that copying: told a
source, a destination and a length through its own registers, it transfers the data over the
memory bus on its own and raises an interrupt when it is done or has failed. Drivers for
disks, network cards and graphics cards all lean on it. Since the controller and the CPU
share one bus, the controller's use of it has to be arranged, and there are three modes:

- **Block transfer** (burst): the controller takes the bus exclusively until the transfer is
  complete. Fastest for the transfer, but the CPU cannot touch memory meanwhile.
- **Cycle stealing**: the controller takes one bus cycle at a time, freezing the CPU for
  that cycle. The transfer takes longer and the CPU slows down a little, but it keeps
  running and the end time is predictable.
- **Interleaved** (transparent): the controller uses only the cycles in which the CPU is
  not accessing memory. No slowdown at all, but the transfer finishes whenever the CPU
  happens to leave enough gaps.

```sim
id: arch-228-io-dma
custom: true
engine: arch
mode: io
kind: dma
dma: block
words: 6
cpu_access: "1101"
note: "Six words to copy while the CPU wants the bus on three cycles out of four. In block mode the DMA controller finishes in six straight cycles and the CPU stalls (×) whenever it needed memory in that window. Switch to stealing — one cycle in two, the CPU loses those — and to interleaved, where the transfer only uses the CPU's idle cycles: no stalls, but it takes until the pattern has left six gaps."
```

**Equations**

- *Polling cost*: with period $p$ cycles, the CPU spends $1/p$ of its time polling, and an event waits up to $p$ cycles; two events within one period are seen as one.
- *Interrupt cost*: per event, the context switch (save PC and flags, vector, restore) plus the ISR's cycles; no cost while idle.
- *DMA modes*: block — transfer time $= n$ cycles, CPU stalled throughout; cycle stealing — $\approx 2n$ cycles, CPU loses $n$; interleaved — CPU loses nothing, time depends on its idle cycles.

> **Key insight.** Devices are addresses, and the three I/O strategies differ in who spends
> cycles finding out that something happened: the CPU by asking (polling), the device by
> telling (interrupts), or a third party doing the whole job (DMA). Interrupts are the one
> that changes the CPU itself — an unrequested subroutine call that every operating system
> is built on.

## Further reading

- [Memory-mapped I/O and port-mapped I/O](https://en.wikipedia.org/wiki/Memory-mapped_I/O_and_port-mapped_I/O) — devices as addresses, the two address-space designs.
- [Polling (computer science)](https://en.wikipedia.org/wiki/Polling_(computer_science)) — programmed I/O and its trade-offs.
- [Interrupt](https://en.wikipedia.org/wiki/Interrupt) — the mechanism, vectors, masking and service routines.
- [Direct memory access](https://en.wikipedia.org/wiki/Direct_memory_access) — controllers and the burst, cycle-stealing and transparent modes.
