---
title: "C functions and program structure: scope, static and extern, headers"
order: 4
status: detailed
weeks: [3]
introduces: [scope, modular-programming]
requires:
  - {concept: c-programming, strength: hard}
  - {concept: function-definition, strength: hard}
  - {concept: recursion, strength: soft}
reinforces:
  - {concept: recursion, perspective: "C: one stack frame per call"}
---

C as a procedural language: defining and declaring functions, why the compiler needs a
prototype before a call, where a name is visible and how long it lives, and how a program is
split into files that are compiled separately and linked, with headers as their interfaces.

## Procedural programming

C is **imperative**: a program is a sequence of statements that change the program's state,
telling the computer *how* to reach a result (a **declarative** language such as SQL says only
*what* result is wanted). It is also **procedural**: the logic is divided into procedures —
C calls them functions — that can be called from anywhere. A C program is `main` plus any
number of other functions, none of which belongs to a class. Object-oriented languages also
have functions (methods), but couple them to the data they operate on; C keeps data and
functions apart.

## Defining and declaring functions

:::syntax[Function definition]
```c
<return type> <name>(<type> <param>, <type> <param>, …) {
    <statements>
}
```

- `<return type>` is the type of the value returned with `return <expression>;`, or `void`.
- A parameter list of `(void)` means "no parameters"; an empty list `()` in older C means
  "unspecified", which turns off argument checking.
- The values passed in a call are the **actual parameters** (arguments); the names in the
  definition are the **formal parameters**. Each argument's value is copied into its
  parameter.
:::

The compiler reads a file once, top to bottom. When it meets a call, it must already know the
function's parameter types and return type, to check the arguments and to know what size of
value comes back. If the definition is further down the file, a **prototype** (a declaration)
at the top gives that information:

:::syntax[Prototype]
```c
<return type> <name>(<parameter types>);
```

- A prototype has the header of the function and a `;` instead of a body; parameter names are
  optional (`long factorial(int);`).
- It must agree with the definition. `main` needs none.
:::

Without a prototype, older compilers assume the function returns `int` and warn about an
**implicit declaration**; C99 and later compilers warn loudly, and recent ones (clang, gcc 14)
reject it. Never rely on the guess: if the function really returns a `double`, the guess and
the definition conflict.

```sim
id: c-348-prototype
custom: true
engine: c
code: |
  #include <stdio.h>

  int main(void) {
      printf("%.1f\n", average(3, 4));
      return 0;
  }

  double average(int a, int b) {
      return (a + b) / 2.0;
  }
note: 'The call on line 4 comes before any declaration of average, so the compiler assumes average returns int; the definition on line 8 then contradicts that, and the program does not compile. Add the prototype double average(int a, int b); after the #include and run again.'
```

### Recursion and the call stack

A C function can call itself. Each call gets its own **stack frame** holding its parameters
and local variables, so the calls do not interfere; the frames disappear in reverse order as
the calls return.

```sim
id: c-348-factorial
custom: true
engine: c
code: |
  #include <stdio.h>

  long factorial(int n) {
      if (n == 0)
          return 1;
      return n * factorial(n - 1);
  }

  int main(void) {
      long f = factorial(4);
      printf("4! = %ld\n", f);
      return 0;
  }
note: 'Step until the stack holds five frames of factorial, each with its own n from 4 down to 0, and note that the addresses of n go down: the stack grows toward lower addresses. Then step on and watch the frames come off one by one.'
```

## Scope and lifetime

:::definition[Scope and lifetime]
The **scope** of a name is the part of the program where it can be used. The **lifetime** of
a variable is how long its memory exists while the program runs. A **local** variable,
declared inside a function or block, is visible from its declaration to the end of that block
and lives only while the block runs. A **global** variable, declared outside every function,
is visible from its declaration to the end of the file and lives for the whole run.
:::

When a local variable has the same name as a global, the local **shadows** the global inside
its scope: the name refers to the nearest declaration. Global variables start at zero; local
variables start with whatever the memory held (garbage) until assigned.

```sim
id: c-348-scope
custom: true
engine: c
code: |
  #include <stdio.h>

  int a = 3;          /* global */
  int total;          /* global: starts at 0 */

  int f(void) {
      int a = 5;      /* shadows the global a */
      return a;
  }

  int main(void) {
      int b;          /* local: starts as garbage */
      printf("main sees %d, f returns %d, main sees %d\n", a, f(), a);
      {
          int a = 10; /* shadows it in this block only */
          printf("inner block: %d\n", a);
      }
      printf("total = %d\n", total);
      b = 1;
      return b - 1;
  }
note: 'Step into f and look at the Memory panel: the global a (Static data) and f''s a (stack) are two variables. Before line 19, b shows ? — it holds leftover bytes, not zero.'
```

### Visibility across files: extern and static

A program usually spans several files. By default, a global variable or a function is
**visible to the whole program**: another file can use it after declaring it. Two keywords
change that.

:::definition[extern and static]
**`extern`** declares a variable that is *defined in another file*: it reserves no memory, it
only tells the compiler the name and type. **`static`** on a global variable or a function
makes it visible *only inside its own file*, like `private` in Java. **`static`** on a *local*
variable keeps it alive for the whole run, so it keeps its value between calls, while its name
stays local to the function.
:::

| Declaration | Where it is visible | How long it lives |
|---|---|---|
| global `int x;` | the whole program (other files declare it `extern int x;`) | the whole run |
| global `static int x;` | this file only | the whole run |
| local `int x;` | this block only | while the block runs |
| local `static int x;` | this block only | the whole run; initialised once |
| function `void f(void)` | the whole program | — |
| function `static void f(void)` | this file only | — |

The two meanings of `static` — lifetime for locals, visibility for globals — are the standard
example of a keyword that is not orthogonal.

```sim
id: c-348-static-local
custom: true
engine: c
code: |
  #include <stdio.h>

  int count_global = 0;

  int next_global(void) {
      return ++count_global;
  }

  int next_static(void) {
      static int count = 0;     /* initialised once, before the first call */
      return ++count;
  }

  int next_local(void) {
      int count = 0;            /* a new variable on every call */
      return ++count;
  }

  int main(void) {
      for (int i = 0; i < 3; i++)
          printf("%d %d %d\n", next_global(), next_static(), next_local());
      count_global = 100;       /* anyone can change the global... */
      printf("%d\n", next_global());
      return 0;
  }
note: 'The static local lives in Static data, next to the global, and is listed as next_static.count. It counts like the global, but main cannot reach it by name: try adding count = 100; to main.'
```

## Programs in several files

Real programs are split into files by purpose (input/output, database access, graphics), each
compiled separately into an object file and then **linked** into one executable. Only the
files that change need recompiling. A small program can be compiled and linked in one command:

```text
gcc -Wall -o app main.c stats.c
```

Exactly one of the files defines `main`. Large projects use a build tool (`make` with a
`makefile`, or CMake) to track which files need recompiling.

### Header files

A file that calls functions from `stats.c` needs their prototypes. Copying the prototypes into
every caller works, but must be repeated in every file and updated in every file when a
function changes. Instead, `stats.c` gets a **header file**, `stats.h`, containing the
prototypes (and any type definitions) that other files may use: its **API**. Every file that
uses the module includes it, and so does `stats.c` itself, so the compiler checks that the
definitions match the header.

- `#include "stats.h"` uses quotes: search next to the source file first. Angle brackets
  are for system headers. A header elsewhere is named by a path (`"../lib/stats.h"`) or found
  with `gcc -I <folder>`.
- A header declares; it does not define. Functions that are only helpers inside `stats.c` are
  declared `static` and left out of the header, so no other file can call them.

### Header guards

Headers include other headers, so a header can easily be pasted into the same file twice. A
duplicated prototype is harmless, but a duplicated `struct` definition is an error. A **header
guard** makes the second inclusion empty:

:::syntax[Header guard]
```c
#ifndef STATS_H
#define STATS_H

/* the declarations */

#endif
```

- The first time, `STATS_H` is undefined, so everything up to `#endif` is kept and `STATS_H`
  becomes defined. The second time, `#ifndef` is false and the whole header is skipped.
- `#pragma once` at the top of a header does the same on most compilers, but is not standard C.
:::

Step through this three-file program. The stepper shows each file as a tab and switches to the
file that is running.

```sim
id: c-348-multifile
custom: true
engine: c
code: |
  #include <stdio.h>
  #include "stats.h"
  #include "stats.h"      /* included twice on purpose: the guard makes it harmless */

  int main(void) {
      int marks[] = {72, 85, 90, 64};
      struct summary s = summarize(marks, 4);
      printf("min %d, max %d, mean %.2f\n", s.min, s.max, s.mean);
      return 0;
  }
files:
  stats.h: |
    #ifndef STATS_H
    #define STATS_H

    struct summary { int min, max; double mean; };

    struct summary summarize(const int *values, int n);

    #endif
  stats.c: |
    #include "stats.h"

    static int sum(const int *values, int n) {    /* private to this file */
        int total = 0;
        for (int i = 0; i < n; i++)
            total += values[i];
        return total;
    }

    struct summary summarize(const int *values, int n) {
        struct summary s = {values[0], values[0], 0};
        for (int i = 1; i < n; i++) {
            if (values[i] < s.min) s.min = values[i];
            if (values[i] > s.max) s.max = values[i];
        }
        s.mean = (double) sum(values, n) / n;
        return s;
    }
note: 'Three experiments: delete the #ifndef, #define and #endif lines of stats.h (the struct is then defined twice); call sum from main (it is static in stats.c, so the linker cannot find it); remove #include "stats.h" from main.c.'
```

### Compiler warnings

`gcc -Wall` turns on the common warnings. With a forgotten header, the typical one is
`implicit declaration of function 'summarize'`: the compiler did not know the function and
guessed. Treat every warning as a bug, and fix it before running the program.

::::exercise[What does this print?]
```c
#include <stdio.h>

int x = 1;

void g(void) {
    static int x = 10;
    x++;
    printf("%d ", x);
}

int main(void) {
    int x = 100;
    g();
    g();
    {
        extern int x;
        printf("%d ", x);
    }
    printf("%d\n", x);
    return 0;
}
```

:::solution
```text
11 12 1 100
```

`g`'s static `x` starts at 10 and keeps its value, so the calls print 11 and 12. Inside the
inner block, `extern int x;` refers to the global `x`, which is 1. The last line is back in
`main`'s scope, where the local `x` is 100.
:::
::::

::::exercise[What does this print?]
```c
#include <stdio.h>
#define WIDTH 5

#ifndef WIDTH
#define WIDTH 80
#endif

#if !defined(HEIGHT)
#define HEIGHT (WIDTH * 2)
#endif

int main(void) {
    printf("%d %d\n", WIDTH, HEIGHT);
    return 0;
}
```

:::solution
```text
5 10
```

`WIDTH` is already defined when `#ifndef WIDTH` is reached, so the default of 80 is skipped.
`#if !defined(HEIGHT)` is the long form of `#ifndef HEIGHT`; `HEIGHT` is not defined, so it
becomes `(WIDTH * 2)`, which expands to `(5 * 2)`. This "define it only if nobody has" pattern
lets a header provide defaults that a file or a compiler flag (`-DWIDTH=120`) can override.
:::
::::

:::insight
In C, a name's scope, a variable's lifetime and a function's visibility are all set by where it
is declared and by `static` and `extern`. A module is a `.c` file of definitions plus a guarded
`.h` file of declarations: the header is the interface, `static` hides everything else.
:::

## Further reading

- [cppreference: scope](https://en.cppreference.com/w/c/language/scope) — block, file, function and prototype scope.
- [cppreference: storage-class specifiers](https://en.cppreference.com/w/c/language/storage_duration) — `static`, `extern`, `auto`, and storage duration versus linkage.
- [The GNU C Preprocessor: once-only headers](https://gcc.gnu.org/onlinedocs/cpp/Once-Only-Headers.html) — header guards and `#pragma once`.
- [GNU make manual](https://www.gnu.org/software/make/manual/make.html) — building multi-file programs.
