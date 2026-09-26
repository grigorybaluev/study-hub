---
title: Language design and implementation
order: 1
status: detailed
weeks: [1]
introduces: [language-implementation]
requires:
  - {concept: function-definition, strength: soft}
reinforces: []
---

Why a programmer should know more than one language, the criteria for judging a language,
the forces that shaped the languages we have, and the three ways a language is made to run:
compilation, interpretation, and the hybrids in between.

## Why study programming languages

Most programmers learn one language first and then see every problem through it. A course on
languages in general pays off in five ways:

- **More ways to express an idea.** A programmer who has met recursion over lists, pattern
  matching or message passing will reach for them even in a language that only half supports
  them.
- **Better choices.** Picking C for a device driver and Python for a data-cleaning script is a
  judgement that needs knowledge of both.
- **Faster learning.** A new language is mostly a new combination of old ideas: scope rules,
  a type system, a memory model, a concurrency model. Knowing the ideas makes the syntax the
  only new thing.
- **Understanding costs.** Knowing that a Python list is an array of pointers, or that a
  recursive call takes a stack frame, explains why some programs are slow.
- **Using the languages you know better.** Features you never used start to make sense once
  you have seen what problem they solve.

## Application domains

Languages were first designed for one kind of work, and their features still show it.

| Domain | What it needs | Language that grew up there |
|---|---|---|
| Scientific computing | fast floating-point arithmetic over large arrays | Fortran |
| Business data processing | decimal numbers, records, formatted reports | COBOL |
| Artificial intelligence | symbols and linked lists rather than numbers | Lisp |
| Systems programming | efficiency and direct access to memory and hardware | C |
| The web | markup, scripting, general-purpose back ends | HTML, JavaScript, PHP, Java |

## Judging a language

:::definition[Evaluation criteria]
**Readability** is how easily a program can be read and understood. **Writability** is how
easily a program can be written for a given task. **Reliability** is how well programs behave
as specified in all conditions. **Cost** is the total cost of the language over a program's
life: training, writing, compiling, running and maintaining.
:::

### What makes a language readable

- **Simplicity.** A small set of features, one way to do each thing, and little *operator
  overloading* (the same symbol meaning several things; `+` is both addition and string
  concatenation in Java).
- **Orthogonality.** A small set of primitive constructs that combine in every sensible way,
  with no exceptions that depend on context. C's `static` is a counter-example: on a local
  variable it changes the *lifetime*, on a global or a function it changes the *visibility*.
- **Adequate data types.** A language without a boolean type forces `flag = 1`, which says
  less than `done = true`.
- **Syntax that carries meaning.** Words like `while` and `class` say what they do; closing a
  block with `end if` says more than a bare `}`.

### What makes a language writable

Simplicity and orthogonality again, plus **abstraction** (defining a structure or operation
once and using it without its details: functions, classes, generics) and **expressivity**
(convenient ways to say common things, such as `for x in items` instead of an index loop).
Expressivity can go too far: APL does a lot in a line of special symbols, and a line of APL is
very hard for anyone else to read.

### What makes a language reliable

- **Type checking**: finding operations applied to the wrong kind of value, preferably before
  the program runs.
- **Exception handling**: catching run-time errors and recovering.
- **Limited aliasing**: *aliasing* is two names for the same memory cell. Pointers in C make
  aliasing easy, and a change through one name silently changes the other.
- Readability and writability: a program written in an unnatural way is more likely to be
  wrong.

Beyond these four criteria come **portability** (moving a program to another system
unchanged), **generality** (range of applications) and **well-definedness** (a complete,
precise, standardised definition of the language).

A compiled language with type checking finds some mistakes before the program ever runs.
Run the program below, read the compiler's message, then fix the call so that it compiles.

```sim
id: c-348-type-check
custom: true
engine: c
code: |
  #include <stdio.h>

  struct point { int x, y; };

  int main(void) {
      struct point p = {3, 4};
      int n = p;          // a struct is not an int
      printf("%d\n", n);
      return 0;
  }
note: 'The program does not compile, so nothing runs: type checking rejected line 7 before execution. Change line 7 to int n = p.x; and run it again.'
```

### Trade-offs

The criteria pull against each other, and every language settles the conflicts differently.

| Trade-off | Example |
|---|---|
| Reliability vs cost of execution | Java checks every array index at run time: safer, slightly slower. C does not check. |
| Readability vs writability | APL's many operators make programs short to write and hard to read. |
| Writability (flexibility) vs reliability | C's pointers can do anything with memory, including the wrong thing. |

## What shaped the languages we have

### The computer's architecture

Almost all computers follow the **von Neumann architecture**: program and data live in the
same memory, separate from the CPU, and instructions and data travel between them one piece
at a time. The CPU runs the **fetch–execute cycle** forever:

:::algorithm[Fetch–execute cycle]
**Input:** a program in memory and a program counter pointing at its first instruction.

1. Fetch the instruction the program counter points at.
2. Increment the program counter.
3. Decode the instruction.
4. Execute it, then repeat from step 1.
:::

**Imperative** languages mirror this machine: a *variable* models a memory cell, an
*assignment* models moving a value into a cell, and *iteration* is cheap because the cycle
itself is a loop. Functional languages start instead from mathematics and pay a price on this
hardware; that is one reason imperative languages dominate.

### Programming methodologies

- 1950s and early 1960s: small programs, machine efficiency first.
- Late 1960s: programmer efficiency; **structured programming** (no jumps into the middle of
  things), top-down design, stepwise refinement.
- Late 1970s: from process-oriented to data-oriented design; **data abstraction** (lists,
  trees, maps that hide their representation).
- Mid 1980s: **object-oriented programming**: data abstraction plus inheritance and
  dynamic binding.

Each shift created demand for languages that support the new way of working.

## Language categories

| Category | Programs are | Examples |
|---|---|---|
| Imperative | variables, assignments and loops that change state step by step; includes object-oriented and scripting languages | C, Java, Python, C++, Go |
| Functional | applications of functions to arguments, without changing state | Lisp, Scheme, Clojure, Haskell, F# |
| Logic | facts and rules; the system infers answers to queries | Prolog |
| Markup/programming hybrid | a markup language extended with some programming | XSLT, JSTL |

The next unit follows how these categories arose, language by language.

## How a language is made to run

A processor runs only its own machine code. A program in any other language must either be
translated into machine code or be run by another program.

### Compilation

:::definition[Compiler]
A **compiler** translates a whole program in a high-level (source) language into machine
code before it runs. Translation is slow; the resulting program runs fast.
:::

Compilation happens in phases:

1. **Lexical analysis** groups the characters of the source into tokens: names, numbers,
   operators, keywords.
2. **Syntax analysis** checks the tokens against the language's grammar and builds a
   **parse tree**.
3. **Semantic analysis** checks meaning (declared names, matching types), using a **symbol
   table** of every name and its type, and produces intermediate code.
4. **Code generation** (after optional optimisation) produces machine code for one specific
   processor.

The machine code of your program is not yet runnable: it calls library functions such as
`printf` that live elsewhere. **Linking** combines your code with the library code into one
**load module** (executable image), and **loading** places it in memory to run. *Static
linking* copies the libraries into the executable before it runs; *dynamic linking* leaves
them out and connects the shared library when the program starts.

### Pure interpretation

:::definition[Interpreter]
An **interpreter** is a program that reads the source program and carries out its
statements directly, without translating it to machine code first.
:::

An interpreter is easy to port (only the interpreter must be rebuilt for a new machine) and
gives good error messages in terms of the source, but runs programs 10 to 100 times slower
than compiled code, because every statement is decoded again each time it runs. Pure
interpretation is now rare for general-purpose languages; early JavaScript and PHP were the
notable examples.

### Hybrid systems: bytecode and virtual machines

:::definition[Bytecode]
**Bytecode** is an intermediate language, simpler than the source and not tied to any real
processor, that a compiler produces and a **virtual machine** (itself a program, usually
written in C) then interprets.
:::

Hybrid systems translate once into bytecode, which is much faster to interpret than source.
Java compiles to bytecode for the Java Virtual Machine; Python compiles each imported module
to bytecode (`.pyc` files) that its interpreter runs; Erlang compiles to `.beam` files for its
BEAM virtual machine. One bytecode file runs on every machine that has the virtual machine.

### Just-in-time compilation

A **just-in-time (JIT)** system starts like a hybrid, but compiles each function's bytecode to
real machine code the first time the function is called, and keeps the machine code for later
calls. A JIT is a delayed compiler: modern JVMs and .NET use one, which is why a long-running
Java program ends up nearly as fast as C.

### Preprocessors

A **preprocessor** rewrites the source text just before compilation. The C preprocessor
expands directives such as `#include`, which pastes the contents of a file in place, and
`#define`, which substitutes text. The compiler never sees the directives, only the rewritten
program. The preprocessor is covered in detail with C.

| Method | Translation | Speed of the running program | Portability | Examples |
|---|---|---|---|---|
| Compilation | all at once, to machine code | fastest | recompile per machine | C, C++, Fortran |
| Pure interpretation | none | slowest (10–100×) | the interpreter is ported once | early JavaScript, shell scripts |
| Hybrid (bytecode + VM) | once, to bytecode | medium | bytecode runs on any VM | Python, early Java |
| JIT | bytecode, then machine code per function when first called | close to compiled | as hybrid | Java (HotSpot), C#, JavaScript engines |

## Programming environments

A **programming environment** is the collection of tools used to build software: an editor,
compiler or interpreter, debugger, build tool and version control. It can be a set of
separate command-line tools (the UNIX tradition: `gcc`, `make`, `gdb`) or an integrated
development environment (Eclipse, Visual Studio, VS Code) that wraps the same tools in one
window.

::::exercise[Classify]
For each statement, name the criterion (readability, writability, reliability, cost,
portability, well-definedness) it is mainly about.

1. The language has a precise international standard.
2. Every array access is checked against the array's bounds.
3. The same program runs unchanged on Linux and Windows.
4. A free compiler is available for every platform.
5. The keyword `static` means different things in different places.

:::solution
1. Well-definedness. 2. Reliability (at some cost of execution speed). 3. Portability.
4. Cost (of the implementation system). 5. Readability: a lack of orthogonality.
:::
::::

::::exercise[True or false?]
1. Static linking loads libraries into the program while it runs.
2. A preprocessor runs just after the program is compiled.
3. A JIT compiler translates each function to machine code when it is first called.
4. Python programs are purely interpreted, line by line from the source.

:::solution
1. False: that is dynamic linking; static linking copies the libraries in before the program
   runs. 2. False: just *before* compilation. 3. True. 4. False: Python compiles modules to
   bytecode and interprets the bytecode, a hybrid system.
:::
::::

:::insight
Every language is a set of trade-offs between readability, writability, reliability and cost,
made for some kind of work on some kind of machine. How it runs (compiled, interpreted,
bytecode, JIT) is a separate choice with its own trade-off between speed of translation, speed
of execution and portability.
:::

## Further reading

- [Programming language implementation](https://en.wikipedia.org/wiki/Programming_language_implementation) — compilers, interpreters and the hybrids, with more examples.
- [Compilers: Principles, Techniques, and Tools (the "Dragon Book") — Wikipedia summary](https://en.wikipedia.org/wiki/Compilers:_Principles,_Techniques,_and_Tools) — where the compilation phases come from.
- [Just-in-time compilation](https://en.wikipedia.org/wiki/Just-in-time_compilation) — how JITs decide what to compile.
