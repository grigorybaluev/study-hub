---
title: Loops
order: 4
status: detailed
weeks: [4]
notes: ["COMP 248 course outline (Fall 2016): week 4, Flow of Control (Iteration); lab exercise 2; assignment 1 due"]
introduces: [iteration]
requires:
  - {concept: selection, strength: hard}
reinforces: []
---

The three loop statements — `while`, `do`-`while`, `for` — the two ways a loop knows when
to stop, and tracing a loop by hand so off-by-one and infinite loops stop being mysteries.

## while

:::definition
A **loop** repeats a block of statements (the **body**) as long as a
boolean **condition** holds. `while (cond) { body }` tests the condition *before* each
pass; if it is false the first time, the body never runs.
:::

:::syntax[while loop]
```java
while (<condition>) {
    <body>
}
```

- `<condition>` is tested before every pass, including the first; the loop ends the first time
  it is `false`.
- `<body>` must change something the condition reads, or the loop never ends.
:::

```java
int n = 1;
while (n <= 5) {          // condition
    System.out.println(n);
    n++;                  // progress toward making the condition false
}
```

```output
1
2
3
4
5
```

Every loop has three parts that must agree: **initialisation** before the loop, the
**condition**, and an **update** inside the body. Forget the update and the condition
never changes — an **infinite loop**, which is what a program that "hangs" is doing.

Two idioms cover most loops in this course:

- **Counter-controlled**: the number of passes is known before the loop starts (`n` from
  1 to 5; each of `count` items).
- **Sentinel-controlled**: the loop reads values until a special value (the **sentinel**,
  such as `-1` or an empty line) says stop. The number of passes is unknown; the read
  happens before the test.

```sim
id: java-sentinel-loop
custom: true
engine: java
code: |
  Scanner in = new Scanner(System.in);
  int sum = 0, count = 0;
  int mark = in.nextInt();
  while (mark != -1) {
      sum += mark;
      count++;
      mark = in.nextInt();
  }
  System.out.println("read " + count + " marks, sum " + sum);
  if (count > 0) System.out.println("average " + (double) sum / count);
stdin: "70 85 92 60 -1"
note: 'A sentinel-controlled loop — the "read, test, process, read again" shape. Step through and watch mark and the Input. Remove the -1 from the input to see what happens when the sentinel never comes; put -1 first to see why the average is guarded.'
```

## do-while

:::syntax[do-while loop]
```java
do {
    <body>
} while (<condition>);
```

- `<body>` runs once before the first test, then again for as long as `<condition>` is `true`.
- The semicolon after `while (<condition>)` is required.
:::

`do { body } while (cond);` tests *after* the body, so the body runs at least once. That
is exactly the shape of input validation — ask, then check, then ask again if needed:

```java
int age;
do {
    System.out.print("Age (0-120): ");
    age = in.nextInt();
} while (age < 0 || age > 120);
```

Note the semicolon after the closing `while (…)`. Anything a `do`-`while` can do a
`while` can do with duplicated setup; use `do` when "at least once" is the natural
description.

## for

When a loop counts, `for` gathers its three parts in the header:

:::syntax[for loop]
```java
for (<init>; <condition>; <update>) {
    <body>
}
```

- `<init>` runs once, before the first test; a counter declared here exists only in the loop.
- `<condition>` is tested before every pass; the loop ends the first time it is `false`.
- `<update>` runs after every pass, before the next test.
:::

```java
for (int i = 0; i < 10; i++) {     // init; condition; update
    System.out.println(i);
}
```

`i` is declared in the header and exists only inside the loop. Counting down
(`i = 10; i > 0; i--`), stepping by two (`i += 2`), or counting from 1 are all just
different headers. The body may not modify `i` — it can, but nobody reading the header
will expect it. `for` and `while` are interchangeable; the header is the whole
difference, and the reader's expectation with it.

```sim
id: java-for-trace
custom: true
engine: java
code: |
  int n = 5;
  int sum = 0;
  for (int i = 1; i <= n; i++) {
      sum += i;
      System.out.println("i = " + i + ", sum = " + sum);
  }
  System.out.println("1 + ... + " + n + " = " + sum);
  int fact = 1;
  for (int k = n; k >= 1; k--) fact *= k;
  System.out.println(n + "! = " + fact);
note: 'A hand trace made visible — every step shows i and sum before the highlighted line runs. Notice that i disappears from the Variables panel once its loop ends. Change <= to < and predict the output before running.'
```

## Tracing and the off-by-one error

Write a **trace table**: one column per variable, one row per pass through the loop,
plus the values *after* the loop exits. Every exam includes "what does this print" for a
loop, and the table is how you answer it without guessing. The commonest mistake it
catches is the **off-by-one error**: `i < n` versus `i <= n`, starting at 0 versus 1,
`length()` versus `length() - 1`. Ask two questions of every loop: what is the first
value of the counter, and what is the last value for which the body runs?

```java
int k = 1, total = 0;
while (total < 10) {
    total += k;
    k += 2;
}
System.out.println(k + " " + total);
```

:::trace[The loop above]
| pass | test `total < 10` | `total` after the body | `k` after the body |
|---|---|---|---|
| before | — | 0 | 1 |
| 1 | `0 < 10` true | 1 | 3 |
| 2 | `1 < 10` true | 4 | 5 |
| 3 | `4 < 10` true | 9 | 7 |
| 4 | `9 < 10` true | 16 | 9 |
| — | `16 < 10` **false**: the loop ends | 16 | 9 |

Printed: `9 16`. The loop stops only when the test fails, so `total` overshoots 10: the sums of
odd numbers are the squares 1, 4, 9, 16.
:::

```sim
id: java-off-by-one
custom: true
engine: java
code: |
  String word = "loop";
  for (int i = 0; i < word.length(); i++) {
      System.out.print(word.charAt(i) + " ");
  }
  System.out.println();
  int count = 0;
  for (int i = 1; i <= 10; i++) {
      if (i % 3 == 0) count++;
  }
  System.out.println("multiples of 3 up to 10: " + count);
  for (int i = 0; i <= word.length(); i++) {
      System.out.print(word.charAt(i));
  }
note: 'The first loop is right. The last one runs one pass too many — step to the end and read the exception. Fix the condition, then change the second loop to count multiples of 3 up to 9 and check by hand first.'
```

::::exercise[What does this print?]
```java
int count = 0;
for (int i = 10; i > 0; i -= 3) {
    count++;
    System.out.print(i + " ");
}
System.out.println("| " + count);
```

:::solution
```text
10 7 4 1 | 4
```

`i` takes the values 10, 7, 4, 1; the next update makes it −2, the test `i > 0` fails, and the
loop has run 4 passes.
:::
::::

## Choosing the loop

| you know… | use |
|---|---|
| how many passes, before starting | `for` |
| a stopping condition that changes in the body | `while` |
| the body must run once before any test | `do`-`while` |

:::insight
Iteration is deciding *how often* statements run, and a loop is only
three things: where the counter starts, when it stops, and how it moves. Trace it by
hand before you run it; when the output is wrong, the trace table shows the pass on
which it went wrong.
:::

:::equations
- *Passes of a counting loop*: `for (int i = a; i < b; i++)` runs $b - a$ times (when $b > a$); with `<=` it runs $b - a + 1$ times.
- *Sum the loop above computes*: $\sum_{i=1}^{n} i = \frac{n(n+1)}{2}$ — a check for the trace, and a hint that some loops are formulas.
:::

## Further reading

- [The Java Tutorials — The while and do-while Statements](https://docs.oracle.com/javase/tutorial/java/nutsandbolts/while.html) — Both forms with examples.
- [The Java Tutorials — The for Statement](https://docs.oracle.com/javase/tutorial/java/nutsandbolts/for.html) — Header, scope of the counter, and the enhanced form used later with arrays.
