---
title: "C basics: programs, the preprocessor, types and printf"
order: 3
status: detailed
weeks: [2]
introduces: [c-programming]
requires:
  - {concept: selection, strength: hard}
  - {concept: iteration, strength: hard}
  - {concept: language-implementation, strength: soft}
reinforces:
  - {concept: variables-and-expressions, perspective: "C: type sizes set by the machine, unsigned types, silent conversions and overflow"}
---

What a C program looks like next to Java, how `gcc` turns it into an executable, what the
preprocessor does before the compiler sees anything, C's basic types and their sizes, and how
`printf` formats output.

## A first program

A small C program looks much like Java: statements end in `;`, blocks sit in braces, `if`,
`while` and `for` are written the same way. The differences are what is missing: there are no
classes, and `main` belongs to nothing.

```c
#include <stdio.h>

int main(int argc, char *argv[]) {
    printf("Hello, world\n");
    return 0;
}
```

```output
Hello, world
```

:::definition[main]
Execution starts at the function **`main`**. It returns an `int` to the program that started
it: 0 means success, any other value an error. Its two optional parameters are the number of
command-line words (`argc`) and the words themselves (`argv`, an array of strings; `argv[0]`
is the program's own name).
:::

```sim
id: c-348-argv
custom: true
engine: c
args: ["red", "green"]
code: |
  #include <stdio.h>

  int main(int argc, char *argv[]) {
      printf("%d words on the command line\n", argc);
      for (int i = 0; i < argc; i++)
          printf("argv[%d] = %s\n", i, argv[i]);
      return argc > 2 ? 1 : 0;
  }
note: 'This block runs as ./a.out red green. Step through and watch argv in the Memory panel: an array of pointers to strings. The exit code at the end is 1, because argc is 3.'
```

## From source to executable

`gcc hello.c` produces an executable named `a.out`; `gcc -o hello hello.c` names it `hello`;
`./hello` runs it. Behind that one command are four steps:

| Step | Tool | Input → output |
|---|---|---|
| Preprocess | `cpp` | `hello.c` → expanded source text (headers pasted in, macros replaced) |
| Compile | `cc1` | expanded source → assembly |
| Assemble | `as` | assembly → object file `hello.o` (machine code with unresolved names) |
| Link | `ld` | object files + libraries → executable |

`gcc -E hello.c` stops after preprocessing and prints the result, which is a good way to see
what the preprocessor did. Always add **`-Wall`** (all warnings): C compiles many mistakes
with only a warning, and a warning ignored today is a crash tomorrow.

```text
gcc -Wall -o hello hello.c
./hello
```

## The preprocessor

:::definition[Preprocessor directive]
A line starting with `#` is a **directive** for the C preprocessor, `cpp`, which rewrites the
source text before compilation. Directives are not C: the compiler never sees them, only the
text they produce.
:::

Three kinds of directive cover nearly all use.

:::syntax[Directives]
```c
#include <header.h>          // paste a standard header here
#include "myfile.h"          // paste one of your own files here
#define NAME replacement     // replace NAME by the text everywhere after this line
#define NAME(a, b) text      // a macro with parameters
#ifndef NAME                 // keep the lines up to #endif only if NAME is not defined
#endif
```

- `<header.h>` is searched for in the system folders (`/usr/include` on Linux); `"myfile.h"`
  is searched for first next to the source file.
- `#define` does **textual** substitution: no types, no evaluation, no checking.
- `#ifdef`, `#ifndef`, `#if`, `#else` and `#endif` include or drop lines, which is how the same
  source builds with or without debugging code, and how headers protect themselves from being
  included twice.
:::

Because a macro is only text, its arguments are pasted in as text. That is why careful macros
put parentheses around every parameter and around the whole body:

```sim
id: c-348-macros
custom: true
engine: c
code: |
  #include <stdio.h>
  #define LIMIT 3
  #define SQUARE(x) ((x) * (x))
  #define BAD_SQUARE(x) x * x
  #define DEBUG

  int main(void) {
      int n = LIMIT + 1;
      printf("%d %d\n", SQUARE(n + 1), BAD_SQUARE(n + 1));
  #ifdef DEBUG
      printf("debug: n = %d\n", n);
  #endif
      return 0;
  }
note: 'Predict both numbers before running. BAD_SQUARE(n + 1) expands to n + 1 * n + 1, which is 4 + 4 + 1. Delete the #define DEBUG line and run again: the debug line is gone from the program, not skipped at run time.'
```

:::caution
A macro argument with a side effect runs as many times as the parameter appears:
`SQUARE(i++)` becomes `((i++) * (i++))`, which increments `i` twice and is undefined behaviour.
Use a function when you need an argument evaluated once.
:::

### Headers and the standard library

C's standard library is small, because C was built to write an operating system. Each part
has a header that **declares** its functions: `stdio.h` (input and output), `stdlib.h`
(memory allocation, conversions, random numbers, `exit`), `string.h` (string functions),
`math.h` (maths; link with `-lm` on Linux), `time.h`, `ctype.h` (character tests). `man 3
printf` on Linux shows the documentation of a library function.

A header is needed because the compiler reads a file once, top to bottom, and must know a
function's parameter and return types before a call to it. `#include <stdio.h>` pastes in the
declaration of `printf`; without it, the compiler guesses and warns.

```sim
id: c-348-missing-header
custom: true
engine: c
code: |
  int main(void) {
      printf("%d\n", 6 * 7);
      return 0;
  }
note: 'It runs, but read the warning above the code: the compiler had to guess what printf is. Add #include <stdio.h> as the first line and the warning disappears.'
```

## Basic types

:::definition[Primitive types]
C's primitive types are the ones the processor handles directly: **integers** (`char`,
`short`, `int`, `long`, `long long`, each `signed` by default or `unsigned`) and
**floating-point** numbers (`float`, `double`, `long double`). `char` is a one-byte integer
that usually holds a character code. C99's `<stdbool.h>` adds `bool` with `true` and `false`;
before that, 0 meant false and anything else true.
:::

Unlike Java, where an `int` is always 4 bytes, C leaves sizes to the machine. The standard
only promises `sizeof(short) ≤ sizeof(int) ≤ sizeof(long)` (with `short` at least 2 bytes and
`long` at least 4) and `float ≤ double ≤ long double`. The **`sizeof`** operator gives the size
in bytes, of a type (`sizeof(int)`, parentheses required) or of a variable (`sizeof n`).

```c
#include <stdio.h>

int main(void) {
    printf("char %zu, short %zu, int %zu, long %zu, long long %zu\n",
           sizeof(char), sizeof(short), sizeof(int), sizeof(long), sizeof(long long));
    printf("float %zu, double %zu, long double %zu, pointer %zu\n",
           sizeof(float), sizeof(double), sizeof(long double), sizeof(int *));
    return 0;
}
```

```output
char 1, short 2, int 4, long 8, long long 8
float 4, double 8, long double 16, pointer 8
```

These are the sizes on 64-bit Linux and macOS; on 64-bit Windows a `long` is 4 bytes. Code
that stores 10 000 000 000 in an `int` compiles everywhere and is wrong everywhere: a 4-byte
`int` holds −2 147 483 648 to 2 147 483 647. Signed overflow is undefined behaviour in C;
unsigned arithmetic wraps around modulo 2ⁿ.

| Type (64-bit Linux) | Bytes | Range |
|---|---|---|
| `char` / `unsigned char` | 1 | −128 to 127 / 0 to 255 |
| `short` / `unsigned short` | 2 | −32 768 to 32 767 / 0 to 65 535 |
| `int` / `unsigned int` | 4 | −2 147 483 648 to 2 147 483 647 / 0 to 4 294 967 295 |
| `long` / `unsigned long` | 8 | about ±9.2 × 10¹⁸ / 0 to about 1.8 × 10¹⁹ |
| `float` | 4 | about ±3.4 × 10³⁸, 6–7 significant digits |
| `double` | 8 | about ±1.8 × 10³⁰⁸, 15–16 significant digits |

### Conversions

C converts between numeric types silently. Assigning a floating-point value to an integer
drops the fraction (truncation toward zero); dividing two integers gives an integer; mixing an
integer with a `double` converts the integer first.

```sim
id: c-348-conversions
custom: true
engine: c
code: |
  #include <stdio.h>

  int main(void) {
      float f = 3.14;
      int i = f;                 // the fraction is dropped
      double d = i;              // 3.0
      printf("%d : %.2f : %1.3f\n", i, f, d);
      int a = 7, b = 2;
      printf("%d %f %f\n", a / b, (double) a / b, a / 2.0);
      unsigned char c = 250;
      c = c + 10;                // wraps modulo 256
      printf("%d\n", c);
      int big = 2147483647;
      printf("%d\n", big + 1);   // signed overflow: undefined, usually wraps
      return 0;
  }
note: 'Step to line 11 and watch c go from 250 to 4 in the Memory panel. (double) a / b converts a before dividing; (double) (a / b) would give 3.000000.'
```

### Constants

A constant can be a `const` variable, which has a type and is checked by the compiler, or a
`#define`, which is only text:

```c
const double PI = 3.14159;     // typed, visible to the debugger
#define MAX_STUDENTS 40        // replaced before compilation; usable as an array size anywhere
```

## Formatted output with printf

:::syntax[printf]
```c
printf(<format string>, <value>, <value>, …);
```

- The format string is printed as is, except that each **conversion** starting with `%` is
  replaced by the next value, formatted as the conversion says.
- `printf` does not check that the values match the conversions: `%d` with a `double`
  prints garbage (`-Wall` warns).
- `printf` returns the number of characters it printed.
:::

| Conversion | Prints | Conversion | Prints |
|---|---|---|---|
| `%d`, `%i` | `int` in decimal | `%ld`, `%lld` | `long`, `long long` |
| `%u` | `unsigned` | `%zu` | a `size_t` (what `sizeof` gives) |
| `%x`, `%X`, `%o` | hexadecimal, octal | `%c` | one character |
| `%f` | `double`, 6 decimals | `%e`, `%g` | scientific; shortest of `%f`/`%e` |
| `%s` | a string | `%p` | a pointer (an address) |
| `%%` | a percent sign | | |

Between `%` and the letter come optional **flags** (`-` left-justify, `0` pad with zeros, `+`
always show the sign), a **width** (minimum characters) and a **precision** (`.2` = two
decimals for `%f`, at most two characters for `%s`). Escape sequences write characters you
cannot type in a string: `\n` newline, `\t` tab, `\\` backslash, `\"` quote, `\0` the null
character.

```sim
id: c-348-printf
custom: true
engine: c
code: |
  #include <stdio.h>

  int main(void) {
      int n = 42;
      double x = 3.14159;
      printf("[%d] [%5d] [%-5d] [%05d] [%+d]\n", n, n, n, n, n);
      printf("[%f] [%.2f] [%8.3f] [%e] [%g]\n", x, x, x, x, x);
      printf("[%x] [%X] [%o] [%c] [%s] [%.3s]\n", 255, 255, 8, 'A', "text", "abcdef");
      int chars = printf("%s\n", "done");
      printf("%d characters\n", chars);
      return 0;
  }
note: 'Each pair of brackets shows the exact width. Change %5d to %2d: a width is a minimum, so 42 still prints in full.'
```

### Error messages go to stderr

`printf` writes to **standard output**, which is **buffered**: text collects in memory and
reaches the screen when the buffer fills, at a newline on a terminal, or when the program
ends. If the program crashes first, buffered text is lost. Error messages should go to
**standard error**, which is unbuffered:

```c
fprintf(stderr, "cannot open %s\n", filename);
```

## Reading input with scanf

`scanf` is `printf` in reverse: it reads text, converts it according to the format, and stores
the results. It needs the *address* of each variable (written `&n`), because it must change
the caller's variables; addresses are the subject of the pointers unit.

```sim
id: c-348-scanf
custom: true
engine: c
stdin: "5 7\n"
code: |
  #include <stdio.h>

  int main(void) {
      int a, b;
      printf("Enter two integers: ");
      int got = scanf("%d %d", &a, &b);
      printf("\nread %d values: %d + %d = %d\n", got, a, b, a + b);
      return 0;
  }
note: 'Edit the Input box below the code and run again. With the input 5 x, scanf stops at x, returns 1, and b keeps whatever garbage it held: check the ? in the Memory panel before line 6 runs.'
```

::::exercise[What does this print?]
```c
#include <stdio.h>
#define TWICE(x) x + x

int main(void) {
    int k = 5 / 2 * 2;
    double d = 5 / 2;
    printf("%d %.1f %d\n", k, d, TWICE(3) * 10);
    return 0;
}
```

:::solution
```text
4 2.0 33
```

`5 / 2` is integer division, 2, so `k` is 4. `d` is assigned the integer 2, converted to
2.0: the division happened before the conversion. `TWICE(3) * 10` becomes `3 + 3 * 10` = 33.
:::
::::

::::exercise[Sample exam question]
`sizeof(values) / sizeof(double)` is typically used to find (a) the size of an array, (b) the
number of elements in an array, (c) the size of one element, (d) the number of bytes in a
double. Assume `values` is an array of `double`.

:::solution
(b). `sizeof(values)` is the size of the whole array in bytes and `sizeof(double)` the size of
one element; their quotient is the number of elements. This only works on the array itself:
passed to a function, the array becomes a pointer and `sizeof` gives the pointer's size.
:::
::::

:::insight
C is small and close to the machine: sizes depend on the hardware, numbers convert silently,
the preprocessor edits your text before the compiler sees it, and `printf` trusts you to match
its conversions. Compile with `-Wall` and read every warning.
:::

## Further reading

- [cppreference: C language](https://en.cppreference.com/w/c/language) — the language reference, with each type's rules.
- [cppreference: printf](https://en.cppreference.com/w/c/io/fprintf) — every conversion, flag and length modifier.
- [The GNU C Preprocessor manual](https://gcc.gnu.org/onlinedocs/cpp/) — directives, macros and their pitfalls.
- [GCC option summary](https://gcc.gnu.org/onlinedocs/gcc/Option-Summary.html) — including `-Wall`, `-E`, `-o` and `-g`.
