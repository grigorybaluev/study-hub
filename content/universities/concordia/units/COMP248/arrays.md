---
title: Arrays of primitive types
order: 6
status: detailed
weeks: [6, 7]
notes: ["COMP 248 course outline (Fall 2016): weeks 6–7, Arrays of primitive types; practical midterm exam in the week-7 lab; assignment 2 due"]
introduces: [array]
requires:
  - {concept: iteration, strength: hard}
reinforces: []
---

One variable for many values: declaring and creating arrays, indexing and traversal, the
standard array algorithms, why two array variables can name the same array, and
two-dimensional arrays.

## Declaring, creating, indexing

> **Definition.** An **array** is a fixed-size sequence of elements of one type, stored
> together and accessed by an integer **index** from `0` to `length - 1`.

```java
int[] marks = new int[5];          // 5 ints, all 0
marks[0] = 78;                     // index, not position: first element is 0
marks[4] = 91;                     // last valid index is length - 1
double[] prices = {1.5, 4.25, 39.9};   // initialiser: size from the list
System.out.println(marks.length);  // 5 — a field, no parentheses (unlike String.length())
```

The type is `int[]`; `new int[5]` creates the array and fills it with the type's default
(`0`, `0.0`, `false`, `'\0'`); the size is fixed once created. Indexing outside `0 …
length - 1` is a run-time error, `ArrayIndexOutOfBoundsException`, and the message tells
you the index and the length — read it. The index can be any `int` expression, which is
what makes arrays and loops inseparable.

## Traversal

The counting loop `for (int i = 0; i < a.length; i++)` visits every index and is the
form to use when the index matters (position, neighbours, writing into the array). The
**enhanced for** `for (int x : a)` visits every *value* in order and is the form to use
when it does not — it cannot modify the elements or tell you where it is.

```sim
id: java-array-basics
custom: true
engine: java
code: |
  int[] marks = new int[5];
  marks[0] = 78; marks[1] = 64; marks[2] = 91; marks[3] = 55; marks[4] = 83;
  int sum = 0;
  for (int i = 0; i < marks.length; i++) {
      sum += marks[i];
  }
  System.out.println("average " + (double) sum / marks.length);
  int above = 0;
  for (int m : marks) {
      if (m >= 70) above++;
  }
  System.out.println(above + " of " + marks.length + " at or above 70");
  System.out.println(marks[5]);
note: 'The Variables panel shows the whole array at each step. The last line indexes one past the end — read the exception message, then fix it to marks.length - 1.'
```

## The standard algorithms

Every array problem in the course is one of these or a combination; know them cold.

| task | shape |
|---|---|
| sum / average | accumulator over `a[i]` |
| maximum and *where* it is | `max = a[0]; maxAt = 0;` then update both on `a[i] > max` |
| count matching | count accumulator with an `if` |
| linear search | flag or `while (i < a.length && a[i] != target) i++` |
| reverse in place | swap `a[i]` with `a[a.length - 1 - i]` for `i < a.length / 2` |
| shift / insert / delete | move elements one step, from the end when inserting |
| copy | a new array and a loop — *not* `b = a` (next part) |

A **partially filled array** is an array created larger than needed plus an `int count`
of how many slots are in use; every loop over it runs to `count`, not `length`. That is
how a program reads "up to 100 values" from a Scanner.

```sim
id: java-array-algorithms
custom: true
engine: java
code: |
  int[] a = {12, 7, 31, 7, 19, 4};
  int max = a[0], maxAt = 0;
  for (int i = 1; i < a.length; i++) {
      if (a[i] > max) { max = a[i]; maxAt = i; }
  }
  System.out.println("max " + max + " at index " + maxAt);
  int i = 0;
  while (i < a.length && a[i] != 7) i++;
  System.out.println(i < a.length ? "first 7 at " + i : "no 7");
  for (int k = 0; k < a.length / 2; k++) {
      int t = a[k]; a[k] = a[a.length - 1 - k]; a[a.length - 1 - k] = t;
  }
  System.out.println(Arrays.toString(a));
note: 'Maximum with position, linear search that stops early, and an in-place reverse. Step through the reverse and watch the two ends of the array swap toward the middle; change a.length / 2 to a.length and see the array reverse twice.'
```

## Arrays are references

An array variable does not *contain* the elements; it holds a **reference** to the array
object. So `int[] b = a;` copies the reference, not the elements: `a` and `b` are two
names for one array, and `b[0] = 99` changes what `a[0]` reads. To copy, create a new
array and copy element by element (or use `Arrays.copyOf`). The same fact explains why a
method that receives an array can change its elements — the parameter refers to the
caller's array — which is the subject of the methods unit.

```sim
id: java-array-aliasing
custom: true
engine: java
code: |
  int[] a = {1, 2, 3};
  int[] b = a;
  int[] c = new int[a.length];
  for (int i = 0; i < a.length; i++) c[i] = a[i];
  b[0] = 99;
  c[1] = -5;
  System.out.println(Arrays.toString(a));
  System.out.println(Arrays.toString(b));
  System.out.println(Arrays.toString(c));
  System.out.println((a == b) + " " + (a == c) + " " + Arrays.equals(a, c));
note: 'Look at the #ids in the Variables panel — a and b share #1, c is #2. Writing through b changes a; writing to c does not. == on arrays compares identity; Arrays.equals compares contents.'
```

## Two-dimensional arrays

A table is an array of arrays: `double[][] grid = new double[3][4];` has 3 **rows** of 4
**columns**, `grid[r][c]` is one cell, `grid.length` is the number of rows and
`grid[r].length` the number of columns in row `r`. Row-by-row processing is a nested loop
with `r` outside and `c` inside; column sums swap them. Rows can have different lengths
(a "ragged" array) because each row is its own array.

```sim
id: java-2d-array
custom: true
engine: java
code: |
  int[][] t = { {5, 3, 8}, {2, 9, 1}, {7, 4, 6} };
  for (int r = 0; r < t.length; r++) {
      int rowSum = 0;
      for (int c = 0; c < t[r].length; c++) rowSum += t[r][c];
      System.out.println("row " + r + " sum " + rowSum);
  }
  int diag = 0;
  for (int i = 0; i < t.length; i++) diag += t[i][i];
  System.out.println("diagonal " + diag);
  int[][] g = new int[2][3];
  g[1][2] = 1;
  System.out.println(g.length + " rows, " + g[0].length + " columns");
note: 'Row sums with the row index outside and the column index inside. Add a column-sum loop with the two loops swapped, and print t[1] on its own — it is an ordinary int[].'
```

> **Key insight.** An array turns "many variables" into one variable plus an index, and
> the index is what a loop counts. The two facts to carry forward: valid indices are
> `0 … length - 1`, and an array variable is a reference — assignment shares, it does not
> copy.

**Equations**

- *Valid indices*: $0 \le i \le n - 1$ for an array of length $n$; the mirror of index $i$ is $n - 1 - i$, which is why the in-place reverse loops while $i < \lfloor n/2 \rfloor$.
- *Two-dimensional size*: `new T[r][c]` holds $r \cdot c$ elements, visited by a nested loop of $r \cdot c$ passes; the main diagonal of a square table is $t[i][i]$.

## Further reading

- [The Java Tutorials — Arrays](https://docs.oracle.com/javase/tutorial/java/nutsandbolts/arrays.html) — Creation, initialisers, copying, and multidimensional arrays.
- [Class Arrays (Java 8 API)](https://docs.oracle.com/javase/8/docs/api/java/util/Arrays.html) — `toString`, `equals`, `copyOf`, `sort`, `fill`: the helpers used above.
