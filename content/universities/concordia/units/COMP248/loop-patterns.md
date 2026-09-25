---
title: Nested loops and loop patterns
order: 5
status: detailed
weeks: [5]
notes: ["COMP 248 course outline (Fall 2016): week 5, Flow of Control (Iteration, continued); lab exercise 3"]
introduces: []
requires:
  - {concept: iteration, strength: hard}
  - {concept: string, strength: soft}
reinforces:
  - {concept: iteration, perspective: "nested loops, accumulators, searching, digit and character loops"}
---

Loops inside loops, and the handful of shapes — accumulate, count, extreme, search — that
almost every loop in a first course is an instance of.

## Nested loops

A loop body can contain another loop. The inner loop runs to completion for *every* pass
of the outer one, so a `rows × cols` table costs `rows · cols` passes of the inner body.
The outer counter is constant while the inner one moves — reading nested loops means
holding that picture:

```java
for (int row = 1; row <= 3; row++) {
    for (int col = 1; col <= 4; col++) {
        System.out.print(row * col + "\t");
    }
    System.out.println();            // end of one row
}
```

```output
1	2	3	4
2	4	6	8
3	6	9	12
```

Anything that depends on the outer counter — the number of stars in a triangle's row,
the starting column of the inner loop — becomes an inner-loop bound that is an expression
rather than a constant.

```sim
id: java-nested-triangle
custom: true
engine: java
code: |
  int n = 4;
  for (int row = 1; row <= n; row++) {
      for (int s = 1; s <= n - row; s++) System.out.print(" ");
      for (int star = 1; star <= 2 * row - 1; star++) System.out.print("*");
      System.out.println();
  }
  int passes = 0;
  for (int i = 1; i <= n; i++)
      for (int j = 1; j <= i; j++)
          passes++;
  System.out.println("inner body ran " + passes + " times");
note: 'Two inner loops per row, with bounds that depend on row. Step through one row and watch s and star start over while row holds. Change the second star bound to row for a right-angled triangle.'
```

## Accumulator patterns

Most loops maintain one variable across passes. Name the pattern and the code writes
itself:

| pattern | before the loop | in the body |
|---|---|---|
| **sum** | `int sum = 0;` | `sum += x;` |
| **count** | `int count = 0;` | `if (cond) count++;` |
| **product** | `int prod = 1;` | `prod *= x;` |
| **maximum** | `int max = first value;` | `if (x > max) max = x;` |
| **average** | sum and count | divide *after* the loop, guarding count 0 |
| **build a string** | `String out = "";` | `out += piece;` |

The initial value is the whole trick: a sum starts at 0, a product at 1, and a maximum
at the *first element* (or `Integer.MIN_VALUE`), never at 0 — an all-negative list would
report a maximum of 0.

## Searching with a flag

To decide whether *any* element satisfies something, start with `boolean found = false;`,
set it to `true` in the body when the condition holds, and never set it back. `break`
leaves the loop early once the answer is known; `continue` skips to the next pass. Both
are fine in short loops and confusing in long ones — a `while` with `!found` in its
condition says the same thing without them.

```sim
id: java-search-flag
custom: true
engine: java
code: |
  Scanner in = new Scanner(System.in);
  int target = in.nextInt();
  boolean found = false;
  int position = -1, checked = 0;
  while (in.hasNextInt() && !found) {
      int x = in.nextInt();
      checked++;
      if (x == target) {
          found = true;
          position = checked;
      }
  }
  System.out.println(found ? "found at position " + position : "not found");
  System.out.println("values checked: " + checked);
stdin: "8  3 8 15 8 2"
note: 'The first input is the target, the rest the list. The loop stops at the first match because !found is part of the condition. Change the target to 2 (last) and 9 (absent) and compare checked.'
```

## Loops over digits and characters

Two loops recur in labs and exams. The **digit loop** peels a number from the right:
`n % 10` is the last digit and `n / 10` drops it, so `while (n > 0)` visits every digit
(reverse a number, sum digits, count digits, test for a palindrome). The **character
loop** walks a string with `charAt(i)` for `i` from `0` to `length() - 1` (count vowels,
check for a digit, build the reversed string).

```sim
id: java-digits-and-chars
custom: true
engine: java
code: |
  int n = 4072, digitSum = 0, reversed = 0;
  while (n > 0) {
      int d = n % 10;
      digitSum += d;
      reversed = reversed * 10 + d;
      n /= 10;
  }
  System.out.println("digit sum " + digitSum + ", reversed " + reversed);
  String s = "Programming";
  int vowels = 0;
  for (int i = 0; i < s.length(); i++) {
      char c = Character.toLowerCase(s.charAt(i));
      if (c == 'a' || c == 'e' || c == 'i' || c == 'o' || c == 'u') vowels++;
  }
  System.out.println(vowels + " vowels in " + s);
note: 'Step through the digit loop and watch d, reversed and n — n is consumed, which is why the original is gone at the end (copy it first if you need it). Note that 4072 reversed is 2704: the leading zero of "2704" would vanish from any number.'
```

## Reading a loop you did not write

The outline's third objective — describe the output of someone else's program — is
mostly loops.

:::steps[Reading a loop you did not write]
1. Identify the loop variable and its start, stop and step.
2. Find the accumulators and their initial values.
3. Run a trace table for two or three passes.
4. Look for the two things that break the pattern: an `if` inside the body, and a `break`.
5. For nested loops, trace the inner loop fully for the first outer pass, then ask what
   changes on the second.
:::

::::exercise[What does this print?]
```java
int total = 0;
for (int i = 1; i <= 3; i++) {
    for (int j = i; j <= 3; j++) {
        total += j;
    }
    System.out.print(total + " ");
}
```

:::solution
```text
6 11 14
```

The inner loop starts at the outer counter. For `i = 1` it adds 1 + 2 + 3 (total 6), for
`i = 2` it adds 2 + 3 (11), and for `i = 3` just 3 (14). `total` is never reset, so each printed
value includes the earlier rows.
:::
::::

:::insight
A loop is a pattern plus a stopping rule. Recognise the pattern —
accumulate, count, extreme, search — and the only decisions left are the initial value
and the bound; nesting just runs one pattern inside another.
:::

:::equations
- *Cost of nesting*: a body inside `for (i < m)` inside `for (j < n)` runs $m \cdot n$ times; a triangular inner bound `j <= i` gives $\sum_{i=1}^{m} i = \frac{m(m+1)}{2}$ passes.
- *Digit peeling*: for $n \ge 0$, the last decimal digit is $n \bmod 10$ and the rest is $\lfloor n / 10 \rfloor$; the reverse $r$ is built by $r \leftarrow 10r + d$.
:::

## Further reading

- [The Java Tutorials — Branching Statements](https://docs.oracle.com/javase/tutorial/java/nutsandbolts/branch.html) — `break` and `continue`, including the labelled forms you should not need yet.
- [Class Character (Java 8 API)](https://docs.oracle.com/javase/8/docs/api/java/lang/Character.html) — `isDigit`, `isLetter`, `toLowerCase` and friends for character loops.
