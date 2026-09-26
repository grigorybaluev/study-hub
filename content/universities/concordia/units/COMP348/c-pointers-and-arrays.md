---
title: "C pointers and arrays: addresses, aliasing and pass by value"
order: 5
status: detailed
weeks: [3]
introduces: [pointers, parameter-passing]
requires:
  - {concept: c-programming, strength: hard}
  - {concept: array, strength: hard}
  - {concept: scope, strength: soft}
reinforces:
  - {concept: object-reference, perspective: "C pointers as explicit references: Java's references without the arithmetic"}
---

The feature that most separates C from Java: variables that hold addresses. Taking and
following addresses, two names for one variable, the three kinds of `const` pointer, arrays
as contiguous memory walked by pointer arithmetic, and why C passes everything by value.

## Addresses and pointers

Every variable occupies bytes in memory, and every byte has a number, its **address**. In Java
you never see addresses; in C you can store one in a variable.

:::definition[Pointer]
A **pointer** is a variable whose value is the address of another value. It is declared with
a `*` before its name: `int *p;` declares `p` as a pointer to an `int`. The **address-of
operator** `&` gives the address of a variable; the **dereference operator** `*` gives the
value at the address a pointer holds.
:::

:::syntax[Pointer declaration and use]
```c
<type> *<name>;          // p holds the address of a <type>
<name> = &<variable>;    // store the variable's address in p
*<name>                  // the value p points at; can be read or assigned
```

- The `*` in a declaration belongs to the name: `int *p, q;` declares a pointer `p` and a
  plain `int q`.
- `NULL` (from `stdio.h` or `stdlib.h`) is the address 0, which points at nothing.
  Dereferencing it crashes the program with a *segmentation fault*.
- `*x` is illegal when `x` is not a pointer; `&p` of a pointer `p` is legal and gives a
  pointer to a pointer (`int **`).
:::

```sim
id: c-348-pointer-basics
custom: true
engine: c
code: |
  #include <stdio.h>

  int main(void) {
      int a = 42;
      int *p = &a;       /* p holds a's address */
      int **pp = &p;     /* pp holds p's address */
      printf("a = %d, *p = %d, **pp = %d\n", a, *p, **pp);
      *p = 17;           /* writes a, through p */
      printf("a = %d\n", a);
      p = NULL;
      printf("p is now NULL\n");
      printf("%d\n", *p);   /* crash */
      return 0;
  }
note: 'Compare the value of p with the address column of a: they are the same number, and the Memory panel names the target (→ a). The last printf dereferences NULL and the program stops with a segmentation fault, after the three lines before it were printed.'
```

## Aliasing

When a pointer holds the address of a variable, the variable has two names: its own and `*p`.

:::definition[Aliasing]
**Aliasing** is the situation where one memory location can be reached through two or more
names. A change through one name is visible through all the others.
:::

```c
#include <stdio.h>

int main(void) {
    int a = 7;
    int *ptr = &a;
    printf("%d %d\n", a, *ptr);
    a = 9;                       /* change a directly */
    printf("%d %d\n", a, *ptr);
    *ptr = 11;                   /* change a through the pointer */
    printf("%d %d\n", a, *ptr);
    return 0;
}
```

```output
7 7
9 9
11 11
```

Aliasing is what makes pointers useful (a function can change the caller's variable) and what
makes them dangerous (a variable can change without its name appearing in the statement that
changed it). It is one of the reliability criteria of language design.

## const and pointers

`const` can apply to the pointer, to what it points at, or to both. Read the declaration from
the name outward: the `const` right before the name applies to the pointer itself.

| Declaration | Read as | Can move `p`? | Can write `*p`? |
|---|---|---|---|
| `int *p` | pointer to int | yes | yes |
| `int * const p = &a` | constant pointer to int | no | yes |
| `const int *p` or `int const *p` | pointer to constant int | yes | no |
| `int const * const p = &b` | constant pointer to constant int | no | no |

A constant pointer must be initialised when it is declared, because it can never be assigned
afterwards. A pointer to a constant may point at a variable that is not constant; it only
promises not to change it through this pointer. That is why library functions that only read
a string take `const char *`.

```sim
id: c-348-const-pointers
custom: true
engine: c
code: |
  #include <stdio.h>

  int main(void) {
      int a = 3;
      int const b = 5;
      int c = 7;
      int * const p1 = &a;          /* constant pointer to int */
      int const * p2 = &b;          /* pointer to constant int */
      int const * const p3 = &b;    /* both */
      *p1 = 4;                      /* fine: the int is not const */
      p2 = &c;                      /* fine: the pointer is not const */
      printf("%d %d %d\n", *p1, *p2, *p3);
      return 0;
  }
note: 'It compiles and prints 4 7 5. Now try each forbidden line, one at a time: p1 = &c; (moves a constant pointer), *p2 = 9; (writes through a pointer to const), p3 = &a; and *p3 = 9;. Each one stops the compiler with the reason.'
```

## Arrays

:::definition[Array]
An **array** is a fixed number of elements of one type, stored **contiguously**: element `i`
is at the array's address plus `i` times the element size. An array of `n` elements has
indices 0 to `n − 1`.
:::

```c
int scores[5];                           /* 5 ints, contents undefined */
float weights[4] = {10.0, 20.0, 100.0, 0.001};
int grid[10][20];                        /* 10 rows of 20 ints, row after row */
int counts[26] = {0};                    /* missing initialisers are 0 */
int n = 8; double work[n];               /* C99: size set at run time */
```

`sizeof` of an array is its size in bytes, so `sizeof scores / sizeof scores[0]` is its number
of elements.

:::caution
C does **not** check array bounds. `scores[5]` on a 5-element array reads or writes whatever is
in the next bytes — often another variable — and the program carries on with junk or a
corrupted neighbour. The classic cause is the off-by-one loop `for (i = 0; i <= n; i++)`.
Checking indices is the programmer's job.
:::

```sim
id: c-348-no-bounds
custom: true
engine: c
code: |
  #include <stdio.h>

  int main(void) {
      int guard = 1234;
      int values[3] = {10, 20, 30};
      for (int i = 0; i <= 3; i++)   /* one pass too many */
          values[i] = 0;
      printf("guard = %d\n", guard);
      return 0;
  }
note: 'Look at the addresses: values[3] would be the 4 bytes after values[2], and that is where guard lives. The loop zeroes guard without ever naming it. A real compiler may lay the variables out differently, or add a stack protector that aborts with stack smashing detected; Java would have thrown ArrayIndexOutOfBoundsException at i = 3.'
```

## Pointer arithmetic

Adding an integer to a pointer moves it by that many *elements*, not bytes: if `p` points at an
`int`, `p + 1` is the address 4 bytes further. Because an array is contiguous, a pointer can
walk through it.

:::definition[Array–pointer equivalence]
In almost every expression, an array's name stands for the address of its first element, so
`arr` is `&arr[0]`, and `arr[i]` means exactly `*(arr + i)`. The exceptions are `sizeof arr`
(the whole array) and `&arr` (the address of the whole array).
:::

```sim
id: c-348-pointer-arithmetic
custom: true
engine: c
code: |
  #include <stdio.h>

  int main(void) {
      int arr[5] = {1, 3, 5, 7, 11};
      int *ptr = &arr[0];            /* same as ptr = arr; */
      printf("%d %d %d\n", *ptr, *(ptr + 1), *(ptr + 2));
      printf("%d\n", *ptr + 1);      /* dereference first, then add */
      int sum = 0;
      for (int *q = arr; q < arr + 5; q++)
          sum += *q;
      ptr = ptr + 4;
      printf("sum %d, last %d, index %ld\n", sum, *ptr, ptr - arr);
      return 0;
  }
note: 'Watch q in the Memory panel: its value goes up by 4 each pass (one int), and its target moves from arr[0] to arr[4]. When the loop ends q points one past the end of arr, which is allowed as long as it is not dereferenced.'
```

`*(ptr + 1)` is the next element; `*ptr + 1` is the first element plus one. Subtracting two
pointers into the same array gives the number of elements between them.

## Passing arguments

### C passes by value

:::definition[Pass by value and pass by reference]
In **pass by value**, the function receives a copy of each argument; changing the parameter
changes only the copy. In **pass by reference**, the function receives the caller's variable
itself; changing the parameter changes the caller's variable. C always passes by value.
:::

So a function cannot change a caller's variable directly:

```sim
id: c-348-swap
custom: true
engine: c
code: |
  #include <stdio.h>

  void swap_values(int a, int b) {     /* gets copies */
      int temp = a;
      a = b;
      b = temp;
  }

  void swap_pointers(int *a, int *b) { /* gets copies of two addresses */
      int temp = *a;
      *a = *b;
      *b = temp;
  }

  int main(void) {
      int first = 5, second = 7;
      swap_values(first, second);
      printf("after swap_values:   %d %d\n", first, second);
      swap_pointers(&first, &second);
      printf("after swap_pointers: %d %d\n", first, second);
      return 0;
  }
note: 'In swap_values, a and b are new variables in a new frame: swapping them leaves first and second alone. In swap_pointers, a and b point at first and second (the Memory panel shows → first, → second), so *a = *b writes main''s variables.'
```

Passing a pointer *looks* like pass by reference: the function can change what the pointer
points at. Strictly it is still pass by value — the function gets a copy of the address, and
assigning a new address to the parameter changes nothing for the caller. True pass by reference
exists in C++ (`void swap(int &a, int &b)`). Java behaves like C here: object references are
passed by value, so a method can change an object's contents but not make the caller's variable
refer to another object.

This is also why `scanf("%d", &n)` needs the `&`: `scanf` must write into `n`, so it needs
`n`'s address.

### Arrays as parameters

An array argument is passed as the address of its first element. The function therefore works
on the caller's array (no copy is made) and cannot know its length, which must be passed
separately. In a parameter list, `int values[]` and `int *values` mean the same thing.

```sim
id: c-348-array-param
custom: true
engine: c
code: |
  #include <stdio.h>

  double average(const int values[], int n) {
      printf("inside: sizeof values = %zu\n", sizeof values);   /* a pointer! */
      int sum = 0;
      for (int i = 0; i < n; i++)
          sum += values[i];
      return (double) sum / n;
  }

  void scale(int *values, int n, int factor) {
      for (int i = 0; i < n; i++)
          values[i] *= factor;       /* writes the caller's array */
  }

  int main(void) {
      int marks[4] = {60, 70, 80, 90};
      printf("outside: sizeof marks = %zu\n", sizeof marks);
      printf("average %.1f\n", average(marks, 4));
      scale(marks, 4, 2);
      printf("marks[0] is now %d\n", marks[0]);
      return 0;
  }
note: 'sizeof gives 16 in main (4 ints) and 8 inside average (one pointer), so the length must travel as a separate argument. const int values[] promises that average will not change the array: try adding values[0] = 0; to it.'
```

::::exercise[What does this print?]
```c
#include <stdio.h>

void f(int *p, int q) {
    *p = *p + q;
    q = q * 10;
    p = &q;
    *p = 99;
}

int main(void) {
    int a = 1, b = 2;
    f(&a, b);
    printf("%d %d\n", a, b);
    return 0;
}
```

:::solution
```text
3 2
```

`*p = *p + q` writes `a`, making it 3. `q` is a copy of `b`, so `q = q * 10` does not touch
`b`. `p = &q` changes only the local copy of the pointer, so `*p = 99` writes `q`, not `a`.
:::
::::

::::exercise[What does this print?]
```c
#include <stdio.h>

int main(void) {
    int v[] = {4, 8, 15, 16, 23, 42};
    int *p = v + 2;
    printf("%d %d %d %ld\n", *p, p[1], *(p - 2) + 1, (v + 5) - p);
    return 0;
}
```

:::solution
```text
15 16 5 3
```

`p` points at `v[2]`, which is 15. `p[1]` is `*(p + 1)`, which is `v[3]` = 16. `*(p - 2)` is
`v[0]` = 4, plus 1. `(v + 5) - p` counts the elements from `v[2]` to `v[5]`: 3.
:::
::::

:::insight
A pointer is a number that names a place in memory. Arrays are contiguous and their names act
as pointers to their first element, so indexing is pointer arithmetic. C copies every argument;
to let a function change something, give it the address.
:::

## Further reading

- [cppreference: pointer declaration](https://en.cppreference.com/w/c/language/pointer) — pointer types, `const` placement and null pointers.
- [cppreference: array declaration](https://en.cppreference.com/w/c/language/array) — initialisation, VLAs, and conversion of arrays to pointers.
- [comp.lang.c FAQ, section 6: arrays and pointers](https://c-faq.com/aryptr/index.html) — the classic answers to "is an array a pointer?".
