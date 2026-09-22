---
title: "What a computer is: the von Neumann model and the layers below a program"
order: 1
status: detailed
weeks: [1]
notes: ["Lecture 1, slides 3–8: why study hardware, the four jobs of a computer, the stored-program model, hardware/software equivalence", "Lecture 1, slides 9–11: reading a spec sheet, units and prefixes, standards bodies", "Lecture 1, slides 12–22: from calculating clocks to multicore and the cloud", "Lecture 1, slides 23–30: the layer hierarchy from user programs to digital logic"]
textbook: ""
introduces: [von-neumann-architecture]
requires: []
reinforces: []
---

Everything a program does ends up as signals on wires. This course walks down from the Java
you wrote in COMP 248 to those wires and back up again, and the first lecture draws the map:
what the parts of a computer are, how they have been built over eighty years, and which layers
sit between a `System.out.println` and a transistor.

## Four jobs and one model

Strip any computer down and it does four things: it performs arithmetic and logic, it stores
data and results, it moves data in and out, and it follows instructions that decide what to do
next. A machine that keeps its *instructions* in the same memory as its data — so that a
program is just more data, loadable and replaceable — is a **stored-program computer**, and
the arrangement that almost every computer since the 1940s has followed is named after John
von Neumann.

> **Definition — the von Neumann model.** Three hardware systems — a central processing unit
> (CPU), a main memory, and an input/output system — connected so that instructions are
> fetched from memory and executed one after another, with a single data path between the CPU
> and memory carrying both instructions and data.

That single path is also the model's famous weakness, the **von Neumann bottleneck**: no
matter how fast the CPU, it can only consume instructions and data as fast as the one path
delivers them. Most of what has been added since — separate buses, floating-point units,
caches — widens or bypasses that path without abandoning the model. Machines that keep
instructions and data on separate buses (**Harvard architecture**) or that hand work to
special-purpose processors are the departures.

> **Key insight.** Hardware and software are interchangeable in what they can compute, and
> differ only in cost: hardware is fast and fixed, software is flexible and slow. Video codecs
> live in hardware for speed; emulators and virtual machines run whole other computers in
> software for flexibility. Anything one can do, the other can do.

## Reading a spec sheet

A laptop advertisement is a list of the four jobs in disguise: a processor with so many cores
at so many gigahertz and so many megabytes of cache (compute), so many gigabytes of DDR5
memory (storage while running), a solid-state drive (storage while off), a display, a camera,
a keyboard and a radio (input and output). Reading it needs the units:

- A **bit** is the unit of data; eight bits make a **byte**, four a **nybble**, and a **word**
  is however many bits the CPU works with at once. Case matters: `b` is bits, `B` is bytes.
- **Hertz** counts events per second; a 4 GHz clock ticks four billion times a second.
- **Watts** measure power draw.
- Prefixes are ambiguous. In the decimal SI system kilo is 1000; in the binary system kibi is
  1024, and the two are close enough that people mix them: a "gigabyte" of memory is usually
  $2^{30}$ bytes, a "gigabyte" of disk usually $10^9$. In this course sizes in bits and bytes
  use binary prefixes — 1 KB means 1024 bytes.

Standards bodies (IEEE, ISO, ANSI, ITU, Ecma, IANA) are where the definitions of such things
live, which matters when one of them (IEEE 754 floating point, in a later unit) decides how
every computer stores a decimal number.

## Eighty years in five generations

The lecture's history is a story of what the switches were made of.

1. **Mechanical calculators** (1640s–1940s): gears and levers that could add or multiply but
   not be programmed — Schickard's calculating clock, Pascal's Pascaline, Babbage's difference
   engine and his never-built analytical engine, Hollerith's punched-card tabulators.
2. **Vacuum tubes** (1940s–50s): no moving parts, so signals changed faster; programmed at
   first by patch panels and punched cards, then by programs stored in memory — the point
   where the von Neumann model appears. Room-sized, hot, fragile; ENIAC, then the first
   mass-produced IBM 650.
3. **Transistors** (from 1947): smaller, cooler, no warm-up, far more reliable. The switch
   that made digital electronics practical.
4. **Integrated circuits** (1960s–70s): many transistors on one chip, then the IBM 360, the
   DEC PDP series, the Cray-1.
5. **Very large scale integration** (from 1980): more than ten thousand components per chip
   makes a whole processor fit on one. The 4-bit Intel 4004, the 8080/8086 line that today's
   PCs descend from, the MOS 6502 that put computing in homes (and that this course uses as
   its model CPU), and ARM for low-power devices.

**Moore's law** — the observation that transistor counts double every two years — held for
decades and is now running into physics: heat, materials, lithography. The response has been
parallelism: multiple cores on one die sharing memory, each with its own ALU and registers,
and programs written as several threads (COMP 346 takes that up). The same story scales up
to supercomputers with a million processors, to the machines behind chess engines and
question-answering systems, and to **computing as a service**, where hardware is rented by
the hour at four levels of control — on-site, infrastructure, platform, software — with the
price rising as more is managed for you.

## The hierarchy

The lecture's organising picture for the whole course is a stack of layers, each with a
contract to the layer below. Reading it top to bottom:

| layer | what lives there | where you meet it |
|---|---|---|
| user programs | the applications people run | COMP 248 |
| high-level language | C, Java, Python — portable, descriptive of intent, compiled down | COMP 248, COMP 348 |
| assembly language | one text line per machine instruction; tied to one CPU and OS | this course's assignments (x86, Linux) |
| system software | the operating system: loads and schedules programs, offers system calls | COMP 346 |
| machine code | the bytes the control unit decodes — the instruction set architecture (ISA) | this course |
| control unit | digital logic that turns each instruction into control signals over registers | this course |
| digital logic | gates built from switches; feedback makes memory | this course |

Two terms the layers help separate: **computer organisation** is the parts (which registers,
which buses, which gates), **computer architecture** is their arrangement and the contract
the programmer sees. A machine-code listing makes the middle layers concrete: each assembly
line such as `LDA #$48` becomes a fixed sequence of bytes at a fixed address, and the control
unit needs nothing but those bytes.

```sim
id: arch-228-overview-first-program
custom: true
engine: arch
mode: cpu
program: |2
      LDA #$48       ; 'H'
      STA $F000      ; the memory-mapped output port
      LDA #$49       ; 'I'
      STA $F000
      LDA #$21       ; '!'
      STA $F000
      BRK
note: "A first look at the CPU that the course builds up to. The listing shows the machine-code bytes next to each assembly line — A9 48 is 'load the accumulator with $48' — and stepping runs one instruction at a time while the registers and memory panes change. Storing to $F000 stands in for the character-output routine of a real machine; the three bytes come out as HI! in the output pane."
```

```sim
id: arch-228-overview-layers
custom: true
engine: arch
mode: text
text: "HI!"
note: "The same three characters one layer down: a program deals in characters, the machine in numbers, the wires in bits. Each character is a code point, each code point a byte, each byte eight signals — the encoding is the subject of a later unit, the point here is that nothing but bits ever reaches the hardware."
```

**Equations**

- *Binary prefixes*: $2^{10} = 1024$ (kibi), $2^{20}$ (mebi), $2^{30}$ (gibi) are 2.4 %, 4.9 %, 7.4 % larger than the decimal $10^3$, $10^6$, $10^9$.
- *Word sizes*: a $w$-bit word takes $2^w$ distinct values; 8 bits give 256, 32 bits about $4.3 \times 10^9$, 64 bits about $1.8 \times 10^{19}$.

> **Key insight.** The stored-program idea is what makes a computer general: the program is
> data, so the same hardware runs anything. Every layer of the hierarchy exists to let people
> write that data in a form closer to how they think, and every layer below translates it one
> step closer to signals on wires.

## Further reading

- [Von Neumann architecture](https://en.wikipedia.org/wiki/Von_Neumann_architecture) — the model, the bottleneck, and the Harvard alternative.
- [Stored-program computer](https://en.wikipedia.org/wiki/Stored-program_computer) — the history behind the idea.
- [Binary prefix](https://en.wikipedia.org/wiki/Binary_prefix) — why a kilobyte is two different sizes.
- [Moore's law](https://en.wikipedia.org/wiki/Moore%27s_law) — the trend and its limits.
