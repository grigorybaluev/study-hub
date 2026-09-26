---
title: "C debugging and profiling: gdb, valgrind and memory errors"
order: 7
status: detailed
weeks: [4]
introduces: [debugging]
requires:
  - {concept: dynamic-memory-allocation, strength: hard}
  - {concept: pointers, strength: hard}
reinforces:
  - {concept: dynamic-memory-allocation, perspective: "the bugs manual memory management makes, and the tools that find them"}
---

Why C programs fail in ways Java programs cannot, and the working habits and tools that find
the failures: compiler warnings, a debugger with breakpoints and stack traces, and a memory
checker that reports invalid accesses and leaks.

## Why C is error-prone

Four features that give C its speed also make its bugs hard to see:

- **No bounds checking.** An index past the end of an array reads or writes the neighbouring
  memory.
- **Manual memory management.** Every `malloc` needs one `free`, at the right time.
- **Raw pointers.** A pointer can hold any address, valid or not, and nothing checks it
  until the hardware refuses.
- **Low-level strings.** Every string needs its terminator and a large enough buffer.

The worst property of these bugs is that the program often *seems to work*: the invalid read
returns some number, the overwritten byte belonged to a variable that is not used until much
later. The crash, if it comes, comes far from the cause.

:::steps[Finding problems in C programs]
1. Compile with warnings (`gcc -Wall`) and fix every warning as soon as it appears.
2. When the program misbehaves, compile a debug build (`-g`) and run it under a debugger.
3. When it compiles and runs, run it under a memory checker to find the errors that do not
   crash (yet).
4. Test systematically: unit tests for each function, run again after every change.
:::

## Debugging with gdb

`gdb` is the GNU debugger. It needs a program compiled with **`-g`**, which stores the symbol
table (variable names, types, line numbers) in the executable; without it, the debugger can
only show addresses.

```text
gcc -Wall -g -o prog prog.c
gdb ./prog
```

| Command | Does |
|---|---|
| `break 31` or `break copy` | stop before line 31, or at the start of function `copy` |
| `run` | start the program (with arguments after it) |
| `next` | run one line, stepping *over* calls |
| `step` | run one line, stepping *into* calls |
| `continue` | run until the next breakpoint |
| `print x`, `print *p`, `print a[2]` | show a value |
| `backtrace` (`bt`) | show the stack trace: which functions called which |
| `watch x` | stop whenever `x` changes |
| `quit` | leave |

IDEs (Eclipse, VS Code, CLion) wrap `gdb` in a graphical view with the same buttons: step over,
step into, continue, a Variables panel and a call-stack panel. The stepper on these pages works
the same way.

### Reading a crash

When a program dies with a *segmentation fault*, run it in `gdb`; it stops at the faulting
instruction, and `backtrace` shows the chain of calls. Read it from the top (the innermost call)
downwards until you reach your own code: that line, and the values of its variables, point at
the cause.

```text
Program received signal SIGSEGV, Segmentation fault.
0x00007ffff7e4a3e2 in __strcat_avx2 () from /lib/x86_64-linux-gnu/libc.so.6
(gdb) bt
#0  0x00007ffff7e4a3e2 in __strcat_avx2 () from /lib/x86_64-linux-gnu/libc.so.6
#1  0x0000555555555189 in join (a=0x555555556004 "left ", b=0x0) at join.c:8
#2  0x00005555555551d4 in main () at join.c:17
```

Frame #0 is inside the C library, which is almost never where the bug is. Frame #1 is the
first line of our code, and it shows the culprit directly: `b=0x0`, a `NULL` string handed to
`strcat`.

```sim
id: c-348-null-crash
custom: true
engine: c
code: |
  #include <stdio.h>
  #include <stdlib.h>
  #include <string.h>

  char *join(const char *a, const char *b) {
      char *out = malloc(64);
      strcpy(out, a);
      strcat(out, b);           /* b must be a string */
      return out;
  }

  char *lookup(int key) {
      return key == 1 ? "right" : NULL;   /* no match: NULL */
  }

  int main(void) {
      char *s = join("left ", lookup(2));
      printf("%s\n", s);
      free(s);
      return 0;
  }
note: 'Run it: the program stops on line 8. Step back one step and read the Memory panel, as you would read a backtrace: join''s b is NULL, and it came from lookup(2) in main. Fix lookup, or make join check its arguments.'
```

:::remark
Print statements (`printf("here\n")`) are a quick check for toy programs, but they change the
program, their output is buffered (and lost if the program crashes), and they cannot show you
the stack. In a large program, learn to use the debugger.
:::

## Checking memory with valgrind

A debugger shows the state of a program; a **memory checker** watches every memory access while
the program runs and reports the ones that are wrong, whether or not they crash. On Linux the
standard free tool is **valgrind**'s memcheck:

```text
gcc -Wall -g -o prog prog.c
valgrind --leak-check=yes ./prog
```

Valgrind runs the program on a simulated processor, 10 to 50 times slower, and prints a report
with a stack trace for every error. The Memory check panel of the stepper reports the same
kinds of error.

| Report | Means |
|---|---|
| `Invalid read of size 4` … `0 bytes after a block of size 16 alloc'd` | reading one element past the end of a heap array (an off-by-one) |
| `Invalid write of size 1` … `inside a block of size 8 free'd` | writing through a dangling pointer, after `free` |
| `Invalid free()` / `double free` | freeing something twice, or something that did not come from `malloc` |
| `Address 0x0 is not stack'd, malloc'd or (recently) free'd` | dereferencing `NULL` |
| `Conditional jump or move depends on uninitialised value(s)` | a decision based on memory that was never written |
| `definitely lost` | a leaked block: no pointer to it remains |
| `indirectly lost` | a block reachable only from a lost block (the rest of a leaked list) |
| `still reachable` | not freed, but a pointer to it still exists at exit |

### Out-of-bounds access

```sim
id: c-348-off-by-one
custom: true
engine: c
code: |
  #include <stdio.h>
  #include <stdlib.h>

  int main(void) {
      int n = 4;
      int *a = malloc(n * sizeof *a);
      for (int i = 0; i < n; i++)
          a[i] = i + 1;
      int sum = 0;
      for (int i = 0; i <= n; i++)     /* <= : one element too many */
          sum += a[i];
      printf("sum = %d\n", sum);
      free(a);
      return 0;
  }
note: 'The program prints a sum and exits normally: nothing crashed. The Memory check still reports an invalid read on line 11, 0 bytes after the 16-byte block, which is exactly a[4]. Change <= to < and the report is clean.'
```

### Use after free and double free

```sim
id: c-348-use-after-free
custom: true
engine: c
code: |
  #include <stdio.h>
  #include <stdlib.h>

  int main(void) {
      int *score = malloc(sizeof *score);
      *score = 90;
      int *alias = score;          /* two pointers to one block */
      free(score);
      printf("%d\n", *alias);      /* use after free */
      free(alias);                 /* double free */
      return 0;
  }
note: 'alias still holds the address after free, and reading through it gives garbage instead of 90: the allocator has already written its own bookkeeping into the freed block. The second free aborts the program, as glibc does. Setting score = NULL after free would not help alias: every copy of a pointer dangles.'
```

### Leaks

At exit, valgrind prints a **heap summary**: how many blocks are still allocated, and for each
leaked block where it was allocated.

```text
==4217== HEAP SUMMARY:
==4217==     in use at exit: 48 bytes in 3 blocks
==4217==   total heap usage: 4 allocs, 1 frees, 1,072 bytes allocated
==4217==
==4217== 48 (16 direct, 32 indirect) bytes in 1 blocks are definitely lost in loss record 3 of 3
==4217==    at 0x483B7F3: malloc (vg_replace_malloc.c:309)
==4217==    by 0x109186: push (list.c:10)
==4217==    by 0x1091D5: main (list.c:27)
```

The allocation site (`push`, line 10) is where the block was made, not where the bug is; the bug
is wherever the last pointer to it was lost.

```sim
id: c-348-leak
custom: true
engine: c
code: |
  #include <stdio.h>
  #include <string.h>
  #include <stdlib.h>

  void greet(const char *name) {
      char *msg = malloc(strlen(name) + 8);
      strcpy(msg, "Hello, ");
      strcat(msg, name);
      printf("%s\n", msg);
      /* missing: free(msg); */
  }

  int main(void) {
      greet("Ada");
      greet("Grace");
      greet("Alan");
      return 0;
  }
note: 'Each call leaks one block, so three are definitely lost at exit, all allocated on line 6. Add free(msg); at the end of greet: the summary becomes 3 allocs, 3 frees.'
```

## Profiling for speed

**Profiling** also means measuring where a program spends its time. `gprof` counts calls and
time per function (compile with `-pg`, run, then `gprof prog gmon.out`), and valgrind's
`callgrind` tool counts instructions per line. Optimise only what the profile shows is slow: a
naive recursive Fibonacci spends nearly all its time recomputing the same values, which a
profile makes obvious and a table of computed values fixes.

::::exercise[Read the report]
A program prints the right answer, and valgrind reports:

```text
Invalid write of size 1
   at 0x4C31E7D: strcpy (vg_replace_strmem.c:512)
   by 0x10918B: save_name (names.c:14)
 Address 0x4a4b045 is 0 bytes after a block of size 5 alloc'd
   at 0x483B7F3: malloc (vg_replace_malloc.c:309)
   by 0x109172: save_name (names.c:13)
```

Line 13 is `char *copy = malloc(strlen(name));` and line 14 is `strcpy(copy, name);`. What is the
bug, and why did the program still print the right answer?

:::solution
The block is one byte too small: `strlen` does not count the terminator, so `strcpy` writes the
`'\0'` just past the end ("0 bytes after a block of size 5": `name` has 5 characters). Allocate
`strlen(name) + 1`. The program worked by luck: the byte after the block happened to be unused
padding. The next allocation, or a different allocator, could put live data there.
:::
::::

::::exercise[Which tool?]
For each situation, would you reach first for compiler warnings, the debugger or valgrind?

1. The program crashes with a segmentation fault every time.
2. The program works, but its memory use grows the longer it runs.
3. A function returns garbage because it was called before it was declared.
4. The output is right on your machine and wrong on the lab machine.

:::solution
1. The debugger: run it, then `backtrace` at the crash. 2. Valgrind: the leak summary shows
which allocations are never freed. 3. Compiler warnings: `-Wall` reports the implicit
declaration. 4. Valgrind first: a result that changes between machines usually comes from an
uninitialised value or an invalid access, which valgrind reports even when the output looks
right.
:::
::::

:::insight
In C the absence of a crash proves nothing. Warnings catch mistakes before the program runs, the
debugger explains the crashes, and a memory checker finds the silent errors — reads past the
end, use after free, leaks — that would otherwise surface months later somewhere else.
:::

## Further reading

- [Debugging with GDB](https://sourceware.org/gdb/current/onlinedocs/gdb/) — the GDB manual; start with "A Sample GDB Session".
- [Valgrind quick start](https://valgrind.org/docs/manual/quick-start.html) — running memcheck and reading its output.
- [Valgrind memcheck manual](https://valgrind.org/docs/manual/mc-manual.html) — every error message explained.
- [AddressSanitizer](https://clang.llvm.org/docs/AddressSanitizer.html) — the compiler-built alternative (`-fsanitize=address`), much faster than valgrind.
