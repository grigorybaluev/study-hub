---
title: "C memory, structs and strings: stack, heap, malloc and free"
order: 6
status: detailed
weeks: [3]
introduces: [dynamic-memory-allocation]
requires:
  - {concept: pointers, strength: hard}
  - {concept: c-programming, strength: hard}
  - {concept: scope, strength: soft}
reinforces:
  - {concept: string, perspective: "C: char arrays ending in '\\0', and string.h"}
---

Grouping data in structs, the three ways C sets memory aside (static, automatic on the stack,
dynamic on the heap), asking for heap memory with `malloc` and giving it back with `free`, and
strings as character arrays that end in a null character.

## Structs

C has no classes, but it can group values of different types into one.

:::definition[Struct]
A **struct** is a composite type made of named **members** of any types, laid out one after
another in memory. It is like a class with fields and no methods.
:::

:::syntax[struct]
```c
struct <tag> {
    <type> <member>;
    <type> <member>;
};                                /* note the semicolon */

struct <tag> <variable>;          /* declares a variable of that type */
<variable>.<member>               /* a member of a struct */
<pointer>-><member>               /* a member of the struct a pointer points at: (*p).member */
typedef struct <tag> <Name>;      /* lets you write <Name> instead of struct <tag> */
```

- A struct definition sets aside no memory; it describes a type. Definitions usually go in
  headers so that every file can use the type.
- Assigning one struct to another copies every member; passing a struct to a function copies
  it too. Pass a pointer to avoid the copy or to let the function change the original.
:::

```sim
id: c-348-structs
custom: true
engine: c
code: |
  #include <stdio.h>
  #include <string.h>

  typedef struct {
      char name[10];
      int age;
      double gpa;
  } Student;

  void birthday(Student *s) {
      s->age++;                      /* same as (*s).age++ */
  }

  int main(void) {
      Student a = {"Ada", 20, 3.7};
      Student b = a;                 /* a full copy */
      strcpy(b.name, "Bob");
      birthday(&a);
      printf("%s %d %.1f\n", a.name, a.age, a.gpa);
      printf("%s %d\n", b.name, b.age);
      printf("sizeof(Student) = %zu\n", sizeof(Student));
      return 0;
  }
note: 'After line 16, a and b are separate copies: changing b.name leaves a alone. Inside birthday, s shows → a. The size is 24, not 10 + 4 + 8 = 22: see padding below.'
```

### Padding

The compiler places each member at an address that is a multiple of its own size (its
**alignment**), because the processor reads aligned values faster, and pads the whole struct to
a multiple of its largest alignment. `sizeof` includes the padding:

| struct | members | sizeof |
|---|---|---|
| `{ char c; int i; }` | 1 byte, 3 padding, 4 | 8 |
| `{ char c; double d; char e; }` | 1, 7 padding, 8, 1, 7 padding | 24 |
| `{ double d; char c; char e; }` | 8, 1, 1, 6 padding | 16 |

Ordering members from largest to smallest wastes the least space. Never compute a struct's size
by adding up its members; use `sizeof`.

## Three kinds of storage

Java objects all come from `new` and disappear when nothing refers to them. C has three kinds
of storage, and knowing which one a variable uses tells you how long it lives.

:::definition[Static, automatic and dynamic storage]
**Static** storage is set aside when the program is built and lasts for the whole run: global
variables and `static` locals. **Automatic** storage is set aside on the **stack** when a
function is called and released when it returns: parameters and ordinary local variables.
**Dynamic** storage comes from the **heap** when the program asks for it, at any time, and
lasts until the program explicitly gives it back.
:::

### The stack

Each call pushes a **stack frame** holding the function's parameters, its local variables and
the address to return to; the return pops it. Automatic storage is what makes recursion work
(each call has its own locals) and saves memory (only the running functions have frames). The
frame at the bottom of the stack is `main`'s: it is the first pushed and the last popped.

### The process's memory

Every running program sees one range of **logical addresses**, from 0 to its maximum, laid out
like this (the operating system and hardware map these to physical memory; the program never
sees physical addresses):

| Region | Holds | Grows |
|---|---|---|
| stack (high addresses) | frames of the running functions | down, toward lower addresses |
| (unused) | the gap between stack and heap | |
| heap | dynamically allocated blocks | up |
| static data | globals, `static` locals, string literals | fixed size |
| code (low addresses) | the machine code | fixed size |
| address 0 | nothing: `NULL` | |

Touching an address outside the program's valid regions makes the operating system stop the
program with a **segmentation fault**. The addresses in the stepper follow the same layout, with
small numbers so that they stay readable.

## The heap: malloc and free

`<stdlib.h>` declares the allocation functions. Unlike Java's `new`, they are ordinary library
functions, not part of the language.

:::syntax[Allocation functions]
```c
void *malloc(size_t size);                 /* size bytes, contents undefined */
void *calloc(size_t count, size_t size);   /* count × size bytes, all zero */
void *realloc(void *p, size_t size);       /* resize the block p points at */
void free(void *p);                        /* give the block back */
```

- Each returns a `void *`, a pointer to no particular type, which converts to any object
  pointer: `int *buf = malloc(10 * sizeof(int));`. The cast `(int *)` is optional in C.
- Compute sizes with `sizeof`, never with numbers: `malloc(n * sizeof *buf)`.
- When there is no memory, they return `NULL`. Check before using the result.
- `realloc` may move the block: it allocates a new one, copies the old contents and frees the
  old one, so always use the pointer it returns. If it fails it returns `NULL` and leaves the
  old block alone.
- `free` only accepts a pointer that came from these functions, and each block exactly once.
  `free(NULL)` does nothing.
:::

```sim
id: c-348-malloc
custom: true
engine: c
code: |
  #include <stdio.h>
  #include <stdlib.h>

  int main(void) {
      int n = 3;
      int *squares = malloc(n * sizeof *squares);
      if (squares == NULL) {
          fprintf(stderr, "out of memory\n");
          return 1;
      }
      for (int i = 0; i < n; i++)
          squares[i] = i * i;
      n = 6;
      int *bigger = realloc(squares, n * sizeof *bigger);
      if (bigger == NULL) { free(squares); return 1; }
      squares = bigger;
      for (int i = 3; i < n; i++)
          squares[i] = i * i;
      for (int i = 0; i < n; i++)
          printf("%d ", squares[i]);
      printf("\n");
      free(squares);
      squares = NULL;       /* no dangling pointer left behind */
      return 0;
  }
note: 'Block #1 is created on line 6 with three ? cells (malloc does not initialise). realloc on line 14 makes block #2, copies the three values and frees #1. The Memory check at the end shows 2 allocs, 2 frees: nothing leaked.'
```

:::definition[Memory leak and dangling pointer]
A **memory leak** is a heap block that is never freed, usually because the last pointer to it
was lost. A few leaks cost nothing, but a leak inside a function that runs repeatedly will
exhaust the memory of a long-running program. A **dangling pointer** points at memory that has
been freed (or at a local of a function that has returned); using it reads or corrupts memory
that belongs to someone else.
:::

C has no garbage collector: every `malloc` needs exactly one `free`. The operating system
reclaims everything when the program ends, but relying on that is bad practice, and large
programs with careless memory management become impossible to maintain.

### Heap or stack?

A function's locals disappear when it returns, so a function that builds something for its
caller must put it on the heap and return the pointer; the caller then owns it and must free
it. Returning the address of a local is a classic bug.

```sim
id: c-348-heap-vs-stack
custom: true
engine: c
code: |
  #include <stdio.h>
  #include <stdlib.h>

  int *make_range_heap(int n) {
      int *r = malloc(n * sizeof *r);
      for (int i = 0; i < n; i++) r[i] = i + 1;
      return r;                       /* the block outlives the call */
  }

  int *make_range_stack(void) {
      int r[3] = {1, 2, 3};
      return r;                       /* the array dies when the function returns */
  }

  void scribble(void) {
      int junk[3] = {-7, -7, -7};
      junk[0] = junk[1];
  }

  int main(void) {
      int *good = make_range_heap(3);
      int *bad = make_range_stack();
      scribble();                     /* reuses the same stack bytes */
      printf("good: %d %d %d\n", good[0], good[1], good[2]);
      printf("bad:  %d %d %d\n", bad[0], bad[1], bad[2]);
      free(good);
      return 0;
  }
note: 'The compiler warns on line 12. After make_range_stack returns, bad points at a dead stack slot (the Memory panel says so). scribble''s frame then lands on the same addresses and overwrites them, so bad now reads -7s. The Memory check reports the reads through the dangling pointer.'
```

### Linked structures

`malloc` plus structs that point at structs gives linked lists and trees of any size:

```sim
id: c-348-linked-list
custom: true
engine: c
code: |
  #include <stdio.h>
  #include <stdlib.h>

  typedef struct node {
      int value;
      struct node *next;
  } Node;

  Node *push(Node *head, int value) {
      Node *n = malloc(sizeof *n);
      n->value = value;
      n->next = head;
      return n;
  }

  void free_list(Node *head) {
      while (head != NULL) {
          Node *next = head->next;     /* save it before freeing head */
          free(head);
          head = next;
      }
  }

  int main(void) {
      Node *list = NULL;
      for (int i = 1; i <= 3; i++)
          list = push(list, i * 10);
      for (Node *p = list; p != NULL; p = p->next)
          printf("%d ", p->value);
      printf("\n");
      free_list(list);
      return 0;
  }
note: 'Each push adds a block; the newest block''s next points at the previous one. Delete the call free_list(list); and run again: the Memory check reports one block definitely lost (the head) and two indirectly lost (reachable only from the lost head).'
```

## Strings

C has no string type. A string is a sequence of characters in a `char` array, ended by the
**null character** `'\0'` (the byte 0). Every string function relies on the terminator to know
where the string ends.

:::definition[C string]
A **string** in C is an array of `char` whose last used element is `'\0'`. Its **length** is
the number of characters before the terminator, so a string of length `n` needs `n + 1` bytes.
A **string literal** such as `"dog"` is a read-only array of 4 bytes, `'d' 'o' 'g' '\0'`,
created by the compiler in static storage.
:::

```c
char a[] = "dog";              /* an array of 4 chars, a writable copy of the literal */
char b[10] = "dog";            /* 10 chars: "dog" then 7 more '\0' */
char c[4] = {'d', 'o', 'g', '\0'};
const char *d = "dog";         /* a pointer to the read-only literal itself */
char *e;                       /* a pointer to nothing yet: NOT an empty string */
char f[] = "";                 /* an empty string: one '\0', length 0 */
```

`a[0] = 'f';` is fine; `d[0] = 'f';` writes to a read-only literal and crashes (which is why
`d` should be `const char *`). Declaring a `char *` sets aside no characters at all.

`<string.h>` declares the string functions. None of them allocates memory or checks sizes: the
destination must already be big enough.

| Function | Does |
|---|---|
| `strlen(s)` | number of characters before `'\0'` |
| `strcpy(dst, src)`, `strncpy(dst, src, n)` | copy `src` into `dst` (at most `n` chars) |
| `strcat(dst, src)`, `strncat(dst, src, n)` | append `src` at the end of `dst` |
| `strcmp(a, b)`, `strncmp(a, b, n)` | negative, 0 or positive as `a` sorts before, equal to or after `b` |
| `strchr(s, c)`, `strstr(s, t)` | pointer to the first `c` or the first `t` in `s`, or `NULL` |
| `strdup(s)` | a copy of `s` in a new heap block (free it) |
| `strtok(s, delims)` | split `s` into tokens, one call per token |

The `n` versions stop after `n` characters and are safer, with one trap: `strncpy` does not add
the terminator when the source is `n` characters or longer.

Comparing strings with `==` compares their addresses, not their characters: use `strcmp`.

### Concatenating safely

Appending one string to another needs a destination with room for both plus the terminator. A
function that does this once, correctly, is better than getting it right at every call site:

```sim
id: c-348-concat
custom: true
engine: c
code: |
  #include <stdio.h>
  #include <stdlib.h>
  #include <string.h>

  /* returns a new heap string holding a followed by b; the caller frees it */
  char *concat(const char *a, const char *b) {
      size_t len_a = strlen(a), len_b = strlen(b);
      char *result = malloc(len_a + len_b + 1);    /* + 1 for the '\0' */
      if (result == NULL) return NULL;
      strcpy(result, a);
      strcat(result, b);
      return result;
  }

  int main(void) {
      char *s = concat("data ", "science");
      printf("%s (%zu chars)\n", s, strlen(s));
      free(s);
      return 0;
  }
note: 'Block #1 holds exactly 13 bytes: 12 characters and the terminator. Remove the + 1 and run again: strcat writes the terminator one byte past the block, and the Memory check reports an invalid write — the kind of bug that seems to work until another variable lands on that byte.'
```

::::exercise[What is wrong?]
```c
char *copy_upper(const char *s) {
    char buffer[64];
    int i;
    for (i = 0; s[i] != '\0'; i++)
        buffer[i] = toupper(s[i]);
    return buffer;
}
```

:::solution
Two bugs. `buffer` is a local array, so the returned pointer dangles as soon as the function
returns; allocate the result with `malloc(strlen(s) + 1)` and let the caller free it. And the
loop never writes the terminator: add `buffer[i] = '\0';` after it. (A third problem: strings
of 64 characters or more overflow `buffer`, which the `malloc` version also fixes.)
:::
::::

::::exercise[Sample exam question]
Arrays and structures are said to be ______ entities, in that they keep the same size for the
whole run of a program: (a) dynamic, (b) automatic, (c) register, (d) static.

:::solution
(d) static: the compiler knows their size. (Their *storage* may still be automatic, on the
stack; "static" here is about size, which cannot change once they exist. Memory whose size is
chosen at run time comes from `malloc`.)
:::
::::

:::insight
Every C variable lives in one of three places, and the place decides its lifetime: static
storage for the whole run, the stack until its function returns, the heap until `free`. The
heap is the only one you manage yourself — one `free` per `malloc`, never a pointer to freed
memory — and a string is just bytes that must end in `'\0'`.
:::

## Further reading

- [cppreference: struct declaration](https://en.cppreference.com/w/c/language/struct) — members, initialisation and alignment.
- [cppreference: dynamic memory management](https://en.cppreference.com/w/c/memory) — `malloc`, `calloc`, `realloc`, `free`.
- [cppreference: null-terminated byte strings](https://en.cppreference.com/w/c/string/byte) — every `string.h` function and its traps.
- [Data structure alignment](https://en.wikipedia.org/wiki/Data_structure_alignment) — why padding exists.
