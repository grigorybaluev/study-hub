---
title: The memory hierarchy and caches
order: 12
status: detailed
weeks: [10, 11]
notes: ["Lecture 10, slides 6–9: the hierarchy from registers to tertiary storage, SRAM, DRAM and the ROM family, building a memory from chips", "Lecture 10, slides 10–12 and Lecture 11, slides 5–8: why cache, hits and misses, hit rate and effective access time, locality, blocks and offsets", "Lecture 10, slides 13–17 and Lecture 11, slides 9–13: direct-mapped, fully associative and set-associative caches, eviction policies, the MMU", "Lecture 11, slide 3: endianness"]
textbook: ""
introduces: [memory-hierarchy]
requires:
  - {concept: cpu-organization, strength: hard}
reinforces: []
---

A register answers in one clock cycle; main memory takes twenty or more; a disk takes
microseconds to milliseconds, tens of thousands of cycles. Fast memory is expensive, so
there is little of it, and the art of the memory system is arranging things so that the
data a program is about to use is almost always in the fast, small level. This unit goes
down the hierarchy, looks at what the levels are made of, and works through the cache — the
level that does the most to hide memory's slowness from the CPU — with the arithmetic that
says how well it is doing.

## The levels

| level | access time | size | made of |
|---|---|---|---|
| registers | 1 cycle | tens to hundreds of bytes | flip-flops in the CPU |
| cache | a few cycles | kilobytes to megabytes | SRAM on the CPU die |
| main memory | tens of cycles | gigabytes | DRAM modules |
| secondary storage | microseconds to milliseconds | terabytes | SSD, hard disk |
| tertiary storage | seconds and up | unbounded | tape, removable media |

Two things distinguish the cache from the others: it is *transparent* — programs address
main memory and never mention the cache, which the hardware manages on their behalf — and
its speed comes from being built from the same technology as the CPU.

## What memory is made of

**Static RAM** stores each bit in a latch, as in the sequential-circuits unit: fast, but
four to six transistors per bit and volatile. **Dynamic RAM** stores a bit as charge on a
capacitor with one transistor to fill or drain it: far denser and cheaper, but the charge
leaks and every cell has to be **refreshed** periodically, and it is slower. The variants
whose names fill catalogues — SDRAM, DDR, GDDR, LPDDR, HBM — differ in how they are clocked
and connected, not in the cell. **ROM** keeps its contents without power: programmed at
manufacture (ROM), once electrically (PROM), erasable by ultraviolet light (EPROM) or
electrically (EEPROM), and in blocks with better write endurance (flash), which is what
solid-state drives are made of.

Memory chips come in fixed sizes, and a system's memory is an arrangement of them: chips
side by side to widen the data path, rows of chips with a decoder on the high address bits
to deepen it — the arithmetic of the datapath unit's simulator. Eight 256 K × 1 chips sharing
address lines make a 256 K × 8 memory; sixteen 64 K × 4 chips make 256 K × 8 the other way.

### Which byte comes first

Memory is usually **byte-addressable** while the CPU's word is wider, so a 32-bit value
occupies four consecutive addresses and someone has to decide the order. **Big-endian**
puts the most significant byte at the lowest address, so a memory dump reads like the
number; **little-endian** puts the least significant byte first, so that bit 0 of the value
is in byte 0 and a value can be widened in place. x86 is little-endian, network protocols
are big-endian, and the two-sum program's `rcx*8` stepped over eight-byte words for exactly
this reason.

```sim
id: arch-228-memory-endian
custom: true
engine: arch
mode: endian
value: "0A1B2C3D"
address: "$200"
note: "One 32-bit value, two layouts. Big-endian stores 0A at the lowest address and reads naturally in a dump; little-endian stores 3D there, so the low byte is at the low address. Both are internally consistent — trouble starts only when data written on one convention is read on the other, which is why file formats and network protocols specify theirs."
```

## The cache

A **cache** is a small fast memory that holds copies of the main-memory blocks the CPU has
used recently. A memory access that finds its data there is a **hit**; one that does not is
a **miss**, and the block is fetched from main memory into the cache — evicting another if
the cache is full — before the CPU gets its data. Dirty blocks (modified since they were
loaded) are written back to main memory when evicted.

> **Definition — effective access time.** With hit rate $h$, hit time $t_h$ and miss
> penalty $t_m$ (the time to fetch the block and deliver the data),
> $$\text{EAT} = h \cdot t_h + (1 - h) \cdot t_m.$$

Caching works because programs have **locality of reference**: they reuse the same data
soon after using it (temporal), use data near what they just used (spatial), and walk
through memory in order (sequential). Fetching a whole **block** of several consecutive
words on a miss serves spatial locality: the low address bits become an **offset** within
the block, and the rest identify the block. Bigger blocks exploit more locality but mean
fewer blocks in the cache and a longer refill.

### Three ways to map blocks to lines

The mapping decides where in the cache a given memory block may live, and how the cache
checks whether it is there.

- **Direct-mapped**: block $b$ goes to line $b \bmod L$. The address splits into a **tag**
  (which of the many blocks that share this line it is), a line index, and the offset. One
  comparison per access, cheap hardware — but two blocks that map to the same line evict
  each other even when the rest of the cache is empty.
- **Fully associative**: a block may go in any line, so the address is just tag and offset,
  and the cache compares the tag against *every* line at once — associative memory,
  expensive but with no mapping conflicts.
- **Set-associative**: the compromise. The cache is divided into sets that are direct-mapped
  by index, and each set holds $n$ lines searched associatively — an $n$-way cache. The
  address is tag, set, offset.

```sim
id: arch-228-memory-cache-direct
custom: true
engine: arch
mode: cache
kind: direct
lines: 4
block: 4
bits: 8
trace: "3 7 11 3 19 7 35 3"
note: "Four lines of four words, eight-bit addresses split into a 4-bit tag, a 2-bit line index and a 2-bit offset. Each access shows its split, the line it must use and hit or miss. Addresses 3, 19 and 35 all map to line 0 (blocks 0, 4 and 8) and keep evicting one another even though line 3 stays empty all along: two hits in eight."
```

```sim
id: arch-228-memory-cache-full
custom: true
engine: arch
mode: cache
kind: full
lines: 4
block: 4
bits: 8
policy: fifo
trace: "3 7 11 3 19 7 35 3"
note: "The same trace in a fully associative cache: any block may use any line, so the first four distinct blocks all fit and the tag is compared against every line at once. Now something must decide which line to evict when the cache is full — here first-in-first-out, which throws out block 0 just before it is needed again."
```

### Eviction

A direct-mapped cache has no choice: the line the block maps to is the line it evicts. An
associative cache must choose, and the policy matters: **FIFO** evicts the block that has
been resident longest; **LRU** (least recently used) evicts the one untouched for longest,
which follows temporal locality best but costs bookkeeping per access; **random** is cheap
and surprisingly reasonable. The theoretical optimum — evict the block whose next use is
furthest in the future — cannot be built, because it needs to know the future, but it is the
yardstick the others are measured against.

```sim
id: arch-228-memory-cache-set
custom: true
engine: arch
mode: cache
kind: set
lines: 4
ways: 2
block: 4
bits: 8
policy: lru
trace: "3 7 11 3 19 7 35 3"
note: "Two sets of two ways: the address now splits as tag, one set bit, offset. Blocks 0, 4 and 8 all fall in set 0 but the set has two lines, and LRU keeps the recently reused block 0 while evicting the other. By the seventh access three blocks are fighting over two ways and block 0 loses anyway: all three mappings end this trace with two hits, because associativity only helps when the working set fits. Try the trace 3 7 3 11 3 19 3 instead: LRU keeps the block that keeps coming back and scores three hits, while FIFO and the direct-mapped cache score two."
```

## Beyond the cache

Between the CPU and main memory sits the **memory management unit**, which rewrites the
addresses the CPU emits — from MAR — using tables of its own, so that a program's addresses
need not be the physical ones. That is what makes virtual memory possible, and COMP 346
picks it up: main memory as a cache for the disk, the same small-fast-versus-big-slow idea
one level down.

**Equations**

- *Effective access time*: $\text{EAT} = h \, t_h + (1 - h) \, t_m$.
- *Address split* with $2^o$-word blocks and $2^i$ lines (or sets): offset $= o$ low bits; index $= i$ middle bits (none if fully associative); tag $=$ the rest.
- *Direct mapping*: line $= \text{block} \bmod L$; *set-associative*: set $= \text{block} \bmod S$, any of $n$ ways within it.
- *Chips*: a $B \times N$ memory from $A \times W$ chips needs $(B/A) \cdot (N/W)$ chips and a $\log_2(B/A)$-to-$(B/A)$ decoder on the chip-enable lines.

> **Key insight.** Every level of the hierarchy is the same bargain: a small fast store
> holding what a big slow one is most likely to be asked for next. Locality makes the bargain
> pay, the mapping decides how flexibly blocks can be placed, and the eviction policy decides
> what to give up — and the whole thing is invisible to the program, which is why a cache can
> be added, enlarged or redesigned without changing any software.

## Further reading

- [Memory hierarchy](https://en.wikipedia.org/wiki/Memory_hierarchy) — the levels and their trade-offs.
- [CPU cache](https://en.wikipedia.org/wiki/CPU_cache) — associativity, replacement policies and the address split, with worked figures.
- [Cache replacement policies](https://en.wikipedia.org/wiki/Cache_replacement_policies) — FIFO, LRU, random and the optimal policy.
- [Endianness](https://en.wikipedia.org/wiki/Endianness) — byte order and where each convention is used.
- [Dynamic random-access memory](https://en.wikipedia.org/wiki/Dynamic_random-access_memory) — the one-transistor cell and refresh.
