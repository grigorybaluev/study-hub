---
title: Writing x86-64 assembly on Linux
order: 11
status: detailed
weeks: [7, 9, 10]
notes: ["Lecture 7, slides 9–14: what assembly is, assembling and linking, the exit program, sections and labels, the disassembly, the write system call", "Lecture 10, slide 5: the two-sum Java program to be translated", "Course outline, unit 2: the assignments' subset — data movement, arithmetic, branching, loops, subroutines, the 32-bit system-call convention"]
textbook: ""
introduces: []
requires:
  - {concept: assembly-language, strength: hard}
  - {concept: selection, strength: soft}
  - {concept: iteration, strength: soft}
  - {concept: recursion, strength: soft}
reinforces:
  - {concept: assembly-language, perspective: "writing x86-64 Linux programs: system calls, loops over arrays, subroutines and the stack"}
---

The 6502 was the model for how a CPU works; the assignments are written for the machine on
your desk. Its instruction set, x86-64, is bigger and messier — sixteen registers with four
names each, hundreds of instructions, memory operands with base, index, scale and
displacement — but the shape of a program is the one the previous unit described:
instructions in sequence, flags set by the ALU, branches that test them, a stack for calls.
This unit writes real programs, runs them instruction by instruction, and ends with a
translation of a Java loop.

## Assembling and linking

An assembly file is text, one instruction per line, with labels for addresses the programmer
does not want to compute. An **assembler** (NASM, in this course) turns it into an object
file of machine code; a **linker** places that code at an address and produces the program
the operating system can load. The operating system needs two things from us: to know where
the code is — the `.text` section — and where to start, which is the label `_start`, declared
`global` so the linker can see it. Data goes in `.data` (initialised) or `.bss` (reserved,
zeroed); the code section is read-only and the data section cannot be executed.

Assembly is tied to a CPU *and* an operating system, because anything beyond arithmetic —
printing, reading, stopping — is done by asking the OS through a **system call**: put a call
number and its arguments in agreed registers and execute `syscall`. On 64-bit Linux the
number goes in `rax` and the arguments in `rdi`, `rsi`, `rdx`; `exit` is call 60, `write` is
call 1, `read` is call 0.

```sim
id: arch-228-x86-exit
custom: true
engine: arch
mode: x86
program: |
  section .text
  global _start
  _start:
      mov eax, 60        ; system call 60 is exit (writing eax clears the top of rax)
      mov edi, 7         ; exit status
      syscall
note: "The smallest complete program: two register loads and a system call. It does nothing visible except end the process with status 7, which a shell shows with echo $?. Stepping shows each register change; the last step names the call the kernel performed. Assembled, the three lines become 12 bytes — a mov of a 32-bit immediate into eax or edi is five bytes, syscall two; writing the 32-bit half clears the upper half, which is why the 64-bit register need not be named."
```

## Registers and operands

The general-purpose registers are `rax rbx rcx rdx rsi rdi rbp rsp` and `r8`–`r15`, 64 bits
each. Each can also be addressed as its low 32, 16 or 8 bits (`eax`, `ax`, `al`; `r8d`,
`r8w`, `r8b`), and the first four also as bits 8–15 (`ah`, `bh`, `ch`, `dh`). Writing a 32-bit
half zeroes the upper half; writing 16 or 8 bits leaves the rest alone. `rsp` is the stack
pointer.

An operand is a register, an immediate constant, or a memory reference in square brackets:
`[label]`, `[rbx]`, `[rbx + rcx*8 + 16]` — a base, an index scaled by 1, 2, 4 or 8, and a
displacement, which is exactly what indexing into an array of 8-byte values needs. When
neither operand is a register the size must be spelled out (`byte`, `word`, `dword`,
`qword`). Most instructions take two operands, destination first: `add rax, rbx` is
`rax ← rax + rbx`.

```sim
id: arch-228-x86-write
custom: true
engine: arch
mode: x86
program: |
  section .data
  msg:  db "System hardware", 10
  len:  equ $ - msg
  section .text
  global _start
  _start:
      mov rax, 1         ; write
      mov rdi, 1         ; file descriptor 1: standard output
      mov rsi, msg       ; address of the first byte
      mov rdx, len       ; how many bytes
      syscall
      mov rax, 60
      xor rdi, rdi       ; the idiom for rdi = 0
      syscall
note: "A string in the data section, its length computed by the assembler (the current address $ minus the label), and a write call with the three arguments in rdi, rsi, rdx. The data pane shows the bytes and their ASCII; stdout fills after the first syscall. xor rdi, rdi is how assembly programs zero a register — shorter than mov rdi, 0 and it sets the flags."
```

## Flags, comparisons and branches

The ALU sets `ZF` (zero), `SF` (sign), `CF` (carry) and `OF` (overflow) after arithmetic;
`cmp a, b` computes `a − b`, keeps only the flags, and a conditional jump reads them. The
mnemonics encode the comparison: `je`/`jne` (equal or not, from ZF), `jl`/`jg` for signed
less/greater (from SF and OF), `jb`/`ja` for unsigned below/above (from CF). `jmp` is
unconditional. A loop is a label, a body, a compare and a backward branch.

The lecture translates a small Java program: two nested loops over a five-element array
looking for a pair of elements that sum to a target, breaking out of both loops when found.
In assembly the labelled `break` is just a jump.

```sim
id: arch-228-x86-two-sum
custom: true
engine: arch
mode: x86
program: |
  section .data
  nums:   dq 4, 9, 15, 26, 33
  target: dq 41
  count:  dq 5
  section .text
  global _start
  _start:
      mov rcx, 0             ; i
  outer:
      mov rdx, 0             ; j
  inner:
      cmp rcx, rdx
      je next                ; skip i == j
      mov rax, [nums + rcx*8]
      add rax, [nums + rdx*8]
      cmp rax, [target]
      je found               ; break out of both loops
  next:
      inc rdx
      cmp rdx, [count]
      jl inner
      inc rcx
      cmp rcx, [count]
      jl outer
  found:
      mov rax, 60
      mov rdi, rcx           ; exit status = i
      syscall
note: "The Java two-sum search as two counted loops. The array is five 8-byte values, so element i is at nums + i*8 — the scaled-index addressing mode does the multiplication. Each cmp sets the flags and the next jump reads them; the step text says which comparison was true. The pair is found at i = 2 (15 + 26 = 41), and the program exits with 2 in rdi. Change the target to 100 to see both loops run to the end."
```

## Subroutines and the stack

`call label` pushes the address of the next instruction and jumps; `ret` pops it and jumps
back. `push` and `pop` move 8-byte values through `rsp`, which grows downward. Arguments and
results travel in registers by convention, and a subroutine that needs a register the caller
was using saves it on the stack and restores it before returning.

The assignment program below is the author's own first submission: a greatest-common-divisor
by repeated subtraction, followed by a routine that prints a number in decimal by dividing by
ten and pushing the remainder digits into a buffer from the right. It uses the *32-bit*
Linux convention the assignments allow — call number in `eax`, arguments in `ebx`, `ecx`,
`edx`, `int 0x80` instead of `syscall`, `exit` is 1 and `write` is 4 — and the 8-bit
registers `al`, `bl`, `cl`, `ah`, with `div cl` dividing the 16-bit `ax` and leaving the
quotient in `al` and the remainder in `ah`.

```sim
id: arch-228-x86-gcd
custom: true
engine: arch
mode: x86
steps: 2000
program: |
  section .text
  global _start
  _start:
      mov al, [num1]
      mov bl, [num2]
  gcd_loop:
      cmp al, bl
      je  gcd_done
      ja  a_greater
      sub bl, al
      jmp gcd_loop
  a_greater:
      sub al, bl
      jmp gcd_loop
  gcd_done:
      mov [output], al
      mov al, [num1]
      call print_num
      mov al, [num2]
      call print_num
      mov al, [output]
      call print_num
  exit:
      mov eax, 1              ; 32-bit convention: exit is 1
      mov ebx, 0
      int 0x80
  print_num:                  ; prints al in decimal, then a newline
      mov cl, 10
      mov esi, numstringend
      sub esi, 1
      mov [esi], cl           ; the newline goes last
  print_num_loop:
      cmp al, 0
      jz print_done
      mov ah, 0
      div cl                  ; ax / 10: quotient in al, remainder in ah
      sub esi, 1
      add ah, 48              ; digit to its ASCII code
      mov [esi], ah
      jmp print_num_loop
  print_done:
      mov eax, 4              ; write
      mov ebx, 1
      mov ecx, esi            ; first digit
      mov edx, numstringend
      sub edx, esi            ; length
      int 0x80
      ret
  section .bss
  numstring:    resb 4
  numstringend:
  output:       resb 1
  section .data
  num1:   db 51
  num2:   db 85
note: "gcd(51, 85) by Euclid's subtraction, then three calls to print_num, which builds the decimal digits right to left in a 4-byte buffer and writes them. Watch the stack pane at each call and ret, and stdout collect 51, 85 and 17. The routine reuses al as its argument, so the caller reloads it before every call — the kind of bookkeeping that registers force on you and variables hide."
```

**Equations**

- *64-bit system call*: number in `rax`, arguments in `rdi, rsi, rdx`; `exit` = 60, `write` = 1, `read` = 0; `syscall`.
- *32-bit system call*: number in `eax`, arguments in `ebx, ecx, edx`; `exit` = 1, `write` = 4, `read` = 3; `int 0x80`.
- *Memory operand*: `[base + index × scale + displacement]`, scale ∈ {1, 2, 4, 8}.
- *Compare and branch*: `cmp a, b` sets flags from `a − b`; `je` ZF, `jl` SF ≠ OF, `jb` CF.
- *Call and return*: `call` = push next address, jump; `ret` = pop into the instruction pointer.

> **Key insight.** Assembly has no variables, no types and no structure — only registers,
> memory cells, flags and jumps — and every construct of a high-level language is a pattern
> built from those: a loop is a label and a backward branch, an `if` a compare and a forward
> one, a method call a push and a jump. Seeing the patterns is what makes the compiler's
> output readable and its costs visible.

## Further reading

- [x86-64](https://en.wikipedia.org/wiki/X86-64) — the architecture and its register set.
- [x86 assembly language](https://en.wikipedia.org/wiki/X86_assembly_language) — syntax, operands and the common instructions.
- [NASM](https://en.wikipedia.org/wiki/Netwide_Assembler) — the assembler the assignments use.
- [System call](https://en.wikipedia.org/wiki/System_call) — how a user program asks the kernel for services.
