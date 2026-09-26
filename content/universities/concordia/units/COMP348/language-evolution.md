---
title: Language evolution and paradigms
order: 2
status: detailed
weeks: [1]
introduces: [programming-paradigms]
requires:
  - {concept: language-implementation, strength: soft}
reinforces: []
---

From machine code to Python: the languages that introduced the ideas every later language
reuses, grouped into the paradigms they founded — imperative, functional, logic and
object-oriented.

## Before high-level languages

### Machine code and assembly

A processor understands **machine code**: binary instructions, each an operation number
followed by its operands. **Assembly language** gives each instruction a mnemonic, one line
per instruction:

```text
0100 0001 0110    ADD   R1, R6     ; R1 ← R1 + R6
0010 0010 0001    STORE R2, R1     ; R2 ← R1
```

Programming this way (roughly 1940–1953) was slow and fragile: code was hard to read and to
change, every formula had to be broken into single instructions by hand, and early machines
lacked even an indexing mechanism, so walking through an array meant modifying the program's
own instructions. Assembly had little influence on the design of later languages, which were
invented precisely to get away from it.

## The first high-level languages

### Fortran (1957): compiled numerical code

**Fortran** (FORmula TRANslation) was designed for the IBM 704, the first machine with
hardware for indexing and floating point. Its compiler took 18 person-years to write and the
code it produced was within a factor of two of hand-written machine code, which convinced
people that compiling was practical. Fortran I had names of up to six characters, a counting
loop (`DO`), formatted I/O and subprograms, but no type declarations: variables starting with
`I` to `N` were integers and all others were reals. Fortran II (1958) added separate
compilation; Fortran IV (1962) finally added explicit type declarations; it became the first
standardised language (ANSI, 1966).

```text
C     AVERAGE OF THREE READINGS
      INTEGER N
      REAL A, B, C, AVG
      READ (5, 100) A, B, C
  100 FORMAT (3F6.2)
      AVG = (A + B + C) / 3.0
      WRITE (6, 200) AVG
  200 FORMAT (8H AVERAGE, F8.2)
      STOP
      END
```

Because every variable's type and storage were fixed before running, Fortran compilers could
optimise aggressively. Few later languages copied Fortran's syntax, but it changed for good
how computers were used.

### Lisp (1958): functional programming

**Lisp** (LISt Processing) was designed by John McCarthy at MIT for artificial-intelligence
research, which needed symbols rather than numbers and lists rather than arrays. Lisp has two
kinds of data, **atoms** and **lists** (which contain atoms or other lists), and its syntax
comes from the lambda calculus: every expression is a list whose first element is the
function. Repetition is done by recursion and conditional expressions, not loops and
assignment. Here is a function that counts the atoms at the top level of a list:

```text
; count the elements of a list
(DEFUN LEN (L)
  (COND ((NULL L) 0)               ; empty list: length 0
        (T (+ 1 (LEN (CDR L))))))  ; otherwise 1 + length of the rest
```

`CAR` is the head of a list and `CDR` the rest; `COND` takes test–result pairs and returns the
result of the first true test (`T` is always true). Lisp pioneered functional programming;
Common Lisp and Scheme are its modern dialects, **Clojure** is a modern Lisp for the JVM, and
Erlang, ML, Haskell and F# are functional languages with different syntax.

### ALGOL 60: structured programming and BNF

**ALGOL** (ALGOrithmic Language) was designed by an international committee to be independent
of any machine. ALGOL 60 formalised the idea of a data type, allowed names of any length and
arrays of any dimension, introduced compound statements (`begin … end`) with block structure,
and nested `if … else if`. It was the standard way to publish algorithms for 20 years, and
nearly every later imperative language, C included, descends from it. It was also the first
language whose syntax was defined formally, in **BNF** (Backus–Naur form):

```text
<identifier> ::= <letter> | <identifier> <letter> | <identifier> <digit>
```

An identifier is a letter, or an identifier followed by a letter or a digit: a recursive rule
that describes names of any length. BNF (and its extended forms) is still how language
grammars are written. ALGOL itself never succeeded commercially.

### COBOL (1960): code for business

**COBOL** (COmmon Business-Oriented Language) was designed by computer makers and the US
Department of Defense to look like English, so that managers could read it. It separates the
description of data (`DATA DIVISION`, with records and decimal fields) from the
`PROCEDURE DIVISION`, and has over 300 reserved words (C has 32):

```text
       PROCEDURE DIVISION.
           ADD PRICE TO TOTAL.
           MULTIPLY TOTAL BY TAX-RATE GIVING TAX.
           DISPLAY "TOTAL WITH TAX: " TAX.
           STOP RUN.
```

Being wordy did not make COBOL easy to write, but its records and decimal arithmetic made it
the language of banking systems, many of which still run.

## Dynamic languages and data abstraction

### APL and SNOBOL: dynamic typing

**APL** (a concise language of array operators) and **SNOBOL** (for string patterns) were the
first *dynamic* languages: variables have no declared type; a variable gets its type, and its
storage, when a value is assigned. Much of the work that a compiler does in advance happens at
run time instead. Few people use either today, but dynamic typing returned in Python, Ruby
and JavaScript.

### Simula 67: classes

**Simula 67**, designed in Norway for simulation and based on ALGOL 60, introduced
**classes**, **objects** and **inheritance**, and **coroutines** (subprograms that can suspend
and resume). It was the first clear form of object-oriented programming and the main model
for C++.

## Languages from the 1970s

### C (1972): systems programming

**C** was designed by Dennis Ritchie at Bell Labs to write the UNIX operating system, growing
out of the languages BCPL and B (and ALGOL 68). It has a powerful set of operators and direct
access to memory through pointers, but weak type checking (early C did not even check the
arguments of a function call). C was not innovative in itself; it spread with UNIX through the
universities and with free compilers, and it is used far beyond systems work. C++, Java, C#
and even Python's syntax descend from it.

### Prolog (early 1970s): logic programming

**Prolog** (PROgramming in LOGic) is not procedural at all: a program is a set of **facts**
and **rules**, and running it means asking a **query** that the system answers by logical
inference.

```text
parent(ana, ben).
parent(ben, cleo).
parent(ben, dan).
grandparent(X, Z) :- parent(X, Y), parent(Y, Z).
sibling(X, Y)     :- parent(P, X), parent(P, Y), X \= Y.

?- grandparent(ana, dan).
true.
?- sibling(cleo, W).
W = dan.
```

`:-` reads "if", and a comma reads "and". The programmer states *what* is true; Prolog works
out *how* to find an answer. Prolog is comparatively slow and has few application areas
(expert systems, parsing, matching problems like the family tree above), but it is the model
of **declarative** programming, which SQL also follows.

### Smalltalk: everything is an object

**Smalltalk**, developed at Xerox PARC in the 1970s (Smalltalk-80 was the first major
release), took Simula's classes to maturity: data abstraction, inheritance and dynamic binding,
with *everything* an object, even integers, and all computation done by sending messages to
objects. It grew up with the first graphical desktops and gave software engineering the idea
of design patterns.

## Object-oriented languages today

- **C++** (Bjarne Stroustrup, Bell Labs, from 1980) is C plus Simula's classes: very fast code,
  a large and complex language because it supports both procedural and object-oriented
  styles. Standards: C++11, C++14, C++17 and later.
- **Java** (Sun, early 1990s) started from C++ for embedded devices, where portability
  mattered, and removed its unsafe parts: no `struct`, no pointer arithmetic, no explicit
  pointers (only references), fewer automatic conversions. Everything, even `main`, lives in
  a class. Java compiles to bytecode for the Java Virtual Machine, with JIT compilation, and
  comes with huge standard libraries.

## Dynamic languages today

From the 1990s, **dynamic languages** such as Python, Ruby and Lua let a running program change
its types and classes and even add code to itself. They are flexible and quick to write in,
but usually slower, and fewer mistakes are caught before the program runs.

## The family tree

| Idea | Introduced by | Passed on to |
|---|---|---|
| compiling to fast machine code | Fortran | every compiled language |
| functions, recursion, lists, code as data | Lisp | Scheme, Clojure, Erlang, ML, Haskell |
| block structure, BNF | ALGOL 60 | Pascal, C, Java, and nearly every imperative language |
| dynamic typing | APL, SNOBOL | Python, Ruby, JavaScript |
| classes and inheritance | Simula 67 | C++, Java, Smalltalk |
| everything is an object, messages | Smalltalk | Objective-C, Ruby, Python |
| systems programming with pointers | C | C++, Go, Rust |
| facts, rules, queries | Prolog | Datalog, SQL-style declarative querying |

Two streams of object orientation came from the two pioneers: Simula led to C++ and Java,
Smalltalk to Objective-C and Ruby.

## Paradigms

:::definition[Programming paradigm]
A **paradigm** is a style of programming defined by what a program is made of and how it
computes. **Imperative** programs change state with assignments, step by step, telling the
machine *how*; **object-oriented** programs are imperative programs organised as objects that
combine data with the operations on it; **functional** programs apply functions to values
without changing state; **logic** programs state facts and rules and let the system infer
answers. Functional and logic programming are **declarative**: they say *what* is wanted.
:::

Many languages mix paradigms: Python is imperative and object-oriented with functional
features; Clojure is functional with a few controlled ways to change state. This course
follows four languages that sit in different places: C (imperative, procedural), Python
(imperative, object-oriented, dynamic), Clojure (functional, a Lisp) and Erlang (functional,
built for concurrency).

::::exercise[Which language?]
1. Which of these is *not* an imperative language: Smalltalk, COBOL, Prolog, Python?
2. Which language first had its syntax defined in BNF?
3. Which language introduced classes and inheritance?
4. In Fortran I, what type does a variable named `KOUNT` have, and `TOTAL`?
5. Which early languages were dynamically typed?

:::solution
1. Prolog: a Prolog program states facts and rules, not steps. Smalltalk, COBOL and Python
   all change state step by step. 2. ALGOL 60. 3. Simula 67. 4. `KOUNT` starts with `K`
   (between `I` and `N`), so it is an integer; `TOTAL` is a real. 5. APL and SNOBOL.
:::
::::

::::exercise[Read the Prolog]
Add the fact `parent(ana, eva).` to the program above. What are all the answers to
`?- sibling(X, Y).`?

:::solution
The pairs of different children of the same parent: `ben` and `eva` (children of `ana`), and
`cleo` and `dan` (children of `ben`), each in both orders: (ben, eva), (eva, ben), (cleo,
dan), (dan, cleo). The rule `X \= Y` stops a child being its own sibling.
:::
::::

:::insight
Every modern language is a recombination of a few old ideas: compiled numeric code from
Fortran, recursion over lists from Lisp, block structure from ALGOL, dynamic typing from APL,
classes from Simula, pointers from C, rules from Prolog. Recognising them is the fastest way
into a new language.
:::

## Further reading

- [History of programming languages](https://en.wikipedia.org/wiki/History_of_programming_languages) — a timeline with the languages above and many more.
- [Programming paradigm](https://en.wikipedia.org/wiki/Programming_paradigm) — the main paradigms and how languages combine them.
- [Backus–Naur form](https://en.wikipedia.org/wiki/Backus%E2%80%93Naur_form) — the notation, with ALGOL's own examples.
