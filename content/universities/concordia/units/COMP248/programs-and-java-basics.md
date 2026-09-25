---
title: Programs and Java basics
order: 1
status: detailed
weeks: [1]
introduces: [variables-and-expressions]
requires: []
reinforces: []
---

What a program is and how Java runs one; the shape of a Java program; variables, primitive
types and the arithmetic rules that decide what `7 / 2` means.

## From problem to program

The course objectives put it in order: *develop an algorithm* for a simple problem, then
*write a complete Java program* given the algorithm, then be able to *describe the output*
of a program someone else wrote. Programming is the middle step; the first and last are
thinking.

> **Definition.** An **algorithm** is a finite sequence of unambiguous steps that solves a
> problem for every valid input. A **program** is an algorithm written in a language a
> computer can execute.

Two habits from day one: write the steps in plain words before writing code, and trace a
program by hand — one line at a time, keeping a table of every variable — before trusting
what it prints. The interactive examples in these units do the trace for you; do it
yourself first and check.

## How Java runs a program

Java source (`Hello.java`) is **compiled** by `javac` into **bytecode** (`Hello.class`),
which the **Java Virtual Machine** (`java Hello`) executes. The bytecode is the same on
every machine; only the JVM is platform-specific — that is what "write once, run anywhere"
means. The compiler catches many mistakes before the program runs (a **compile-time
error**); others only appear while running (a **run-time error**); and a program that
compiles, runs and prints the wrong thing has a **logic error**, the kind you find by
tracing.

```java
// Hello.java — the smallest complete program
public class Hello {
    public static void main(String[] args) {
        System.out.println("Hello, COMP 248");
    }
}
```

Every program is a **class** with the same name as its file. Execution starts in
`main`; the `public static void main(String[] args)` line is a header you copy exactly
for now (each word gets its meaning in the units on methods and classes). Statements end
with `;`, braces `{ }` group statements into a **block**, and indentation is for the
reader — the compiler ignores it, so keep it consistent anyway.

> **Note.** `System.out.println(x)` prints `x` and moves to the next line;
> `System.out.print(x)` prints and stays on the line. Comments are `// to end of line` or
> `/* between markers */`. The outline lists "internal code documentation" as a graded
> skill: a comment says *why*, the code already says *what*.

```sim
id: java-hello
custom: true
engine: java
code: |
  public class Hello {
      public static void main(String[] args) {
          System.out.print("Hello, ");
          System.out.println("COMP 248");
          System.out.println(2 + 3);
          System.out.println("2 + 3");
      }
  }
note: 'A complete program. Press ▶ Run, then ◀ Back to step through it and watch the console fill one statement at a time. Edit the code (✎ Edit) and run again — try removing a semicolon to see a compile error.'
```

## Variables and primitive types

> **Definition.** A **variable** is a named location in memory holding one value of a
> declared **type**. A **declaration** `int count;` creates it; an **assignment**
> `count = 3;` stores a value; `int count = 3;` does both (**initialisation**).

Java is **statically typed**: the type is fixed at declaration, and the compiler refuses
a value of the wrong type. The primitive types you use in this course:

| type | holds | example | size |
|---|---|---|---|
| `int` | whole numbers, about ±2.1 billion | `42`, `-7` | 32 bits |
| `long` | whole numbers, about ±9.2 quintillion | `42L` | 64 bits |
| `double` | real numbers, ~15–16 significant digits | `3.14`, `1e-9` | 64 bits |
| `float` | real numbers, ~7 significant digits | `3.14f` | 32 bits |
| `boolean` | `true` or `false` | `true` | 1 bit |
| `char` | one character (Unicode) | `'A'`, `'\n'` | 16 bits |

`byte` and `short` exist but are rare. A **literal** is a value written in the source:
`42` is an `int`, `42.0` a `double`, `'4'` a `char`, `"42"` a `String` (not primitive — the
next unit). Names (**identifiers**) start with a letter, are case-sensitive, and by
convention are `lowerCamelCase` for variables, `UpperCamelCase` for classes and
`ALL_CAPS` for constants. A variable declared `final` cannot be reassigned:

```java
final double TAX_RATE = 0.14975;   // a named constant: one place to change it
int items = 3;
double price = 9.99;
boolean onSale = false;
char grade = 'A';
```

> **Caution.** A local variable has no value until you assign one — the compiler rejects
> reading it ("might not have been initialized"). And `=` is *assignment*, not equality:
> `x = x + 1` is a valid instruction meaning "add one to x", not an equation.

## Arithmetic expressions

The operators are `+ - * / %`, with the usual precedence: `*`, `/`, `%` before `+`, `-`,
equal precedence evaluated left to right, parentheses to override. Two rules make Java
arithmetic different from a calculator:

> **Definition — Integer division.** When *both* operands are integers, `/` discards the
> fractional part (truncates toward zero) and `%` gives the remainder: `7 / 2` is `3`,
> `7 % 2` is `1`, `-7 / 2` is `-3`. For every non-zero `b`, `a == (a / b) * b + a % b`.

> **Definition — Promotion.** In a mixed expression the "smaller" operand is converted to
> the "larger" type before the operation: `int` with `double` gives `double`, so
> `7 / 2.0` is `3.5`. The conversion happens per operation, not per expression:
> `1 / 2 * 2.0` is `0.0` because `1 / 2` was computed first, as integers.

A **cast** converts explicitly: `(int) 3.99` is `3` (truncation, not rounding),
`(double) 7 / 2` is `3.5` because the cast binds tighter than `/`. Assigning a `double`
to an `int` variable without a cast is a compile error ("possible lossy conversion") —
Java lets you widen silently but never narrow silently. Integer arithmetic also
**overflows** silently: `Integer.MAX_VALUE + 1` wraps around to the most negative `int`.

```sim
id: java-int-division
custom: true
engine: java
code: |
  int total = 17, people = 4;
  System.out.println(total / people);
  System.out.println(total % people);
  System.out.println(total / (double) people);
  System.out.println((double) (total / people));
  double avg = total / people;
  System.out.println("avg = " + avg);
  System.out.println((int) 3.99 + " " + (int) -3.99);
  System.out.println(1 / 2 * 2.0);
note: 'Integer division, remainder, promotion and casts. The variable avg is a double but holds 4.0, because 17 / 4 was already computed as an int before the assignment. Change people to 0 and run again.'
```

## Assignment operators, increment and decrement

`x += 3` means `x = x + 3`; the same for `-=`, `*=`, `/=`, `%=`. `x++` and `x--` add or
subtract one. Used as statements they are just shorthand; used inside a larger
expression, `x++` yields the *old* value and `++x` the new one — write them on their own
line until that distinction is second nature.

```sim
id: java-increment
custom: true
engine: java
code: |
  int x = 5;
  x += 3;
  x *= 2;
  System.out.println(x);
  int a = x++;
  int b = ++x;
  System.out.println(a + " " + b + " " + x);
  int big = 2147483647;
  big++;
  System.out.println(big);
note: 'Step through and watch the Variables panel — the highlighted value is the one that just changed. The last lines show int overflow: the largest int plus one wraps to the smallest.'
```

> **Key insight.** Every expression in Java has a *type* decided at compile time from the
> types of its operands, and the type decides the operation: `/` on two ints is integer
> division, `+` on a String is concatenation. Reading a program means reading types as much
> as values.

**Equations**

- *Integer division and remainder*: for integers $a$ and $b \neq 0$, $a = (a / b) \cdot b + a \% b$, with $a / b$ truncated toward zero, so $a \% b$ has the sign of $a$.
- *Promotion order*: $\texttt{int} \to \texttt{long} \to \texttt{float} \to \texttt{double}$ — an operation on two types works in the wider of the two.
- *Range of `int`*: $-2^{31} \le x \le 2^{31} - 1$, i.e. $-2\,147\,483\,648$ to $2\,147\,483\,647$; overflow wraps modulo $2^{32}$.

## Further reading

- [The Java Tutorials — Language Basics](https://docs.oracle.com/javase/tutorial/java/nutsandbolts/index.html) — Oracle's own walk through variables, primitive types, operators and expressions.
- [Java Language Specification — Chapter 4, Types, Values, and Variables](https://docs.oracle.com/javase/specs/jls/se8/html/jls-4.html) — The formal definition of the primitive types and their ranges (Java 8, the version the course targets).
- [Java Language Specification — §15.17 Multiplicative Operators](https://docs.oracle.com/javase/specs/jls/se8/html/jls-15.html#jls-15.17) — The exact rules for integer division and remainder.
