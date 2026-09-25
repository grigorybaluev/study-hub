This page is the design doc for **programming-kind unit pages**: courses whose `courses/<CODE>.md`
says `pages: programming`, planned for COMP 248 (Java), COMP 249 (object-oriented programming),
COMP 348 (programming languages) and COMP 352 (data structures and algorithms). The real unit
renderer draws it, so what you see here is what every programming unit looks like. To change the
design, change the styles in `app/src/styles/base.css` (`.blk-syntax`, `.code-output`,
`.pages-programming`, and the shared `.blk` rules), check this page in both themes and at phone
width, and add a line to the change log at the bottom.

## The rules

### What a programming page is made of

A programming unit teaches **constructs** (a loop, a class, a stack), shows them in **code**, and
lets the reader **run** them. Prose carries the explanation; blocks mark what the reader will look
for again. The container syntax is the same as on the [math page](#/design/math): `:::name[Title]`
… `:::`, and a nested block gets one colon less than the block around it (`::::exercise` around
`:::solution`).

| Block | Use it for | Title |
|---|---|---|
| `definition` | a term: what a loop, a reference, an interface *is* | the term |
| `syntax` | the general form of a construct, then what each part means | the construct (`for` loop) |
| `example` | a worked problem: code written and explained | what it does |
| `trace` | a hand trace: one row per step, one column per variable, and the output | the code or call traced |
| `algorithm` | a named procedure in pseudocode: **Input**, **Output**, numbered steps | its name |
| `exercise` | a question to try (exam-style, "what does this print"), answer in a nested `solution` | where it comes from |
| `solution` | the answer, nested in an exercise or example. **Collapsed** until opened | — |
| `steps` | a method for writing or debugging code, as a numbered list | the method |
| `note`, `remark` | an aside that is not needed on first reading | optional |
| `caution` | a common bug and how to avoid it | optional |
| `insight` | the one idea of a part, at its end | — |

`theorem`, `proof` and `equations` stay available for the analysis in COMP 352 (a running-time
bound and its argument). `machine` is for theory pages only.

### definition or syntax?

A **definition** says what something *is*, in words. A **syntax** block shows how it is *written*:
a code block with the general form, using placeholders in angle brackets, then a list with one
line per part. A construct usually gets both, definition first. Never put a concrete program in a
syntax block: that is an example.

### Code

- Every fence names its language: ```` ```java ````, ```` ```python ````, ```` ```r ````, ```` ```c ````,
  ```` ```sql ````, ```` ```text ```` for anything else. Lint warns about a bare ```` ``` ```` on
  programming pages.
- A code block shows **one idea**, short enough to read without scrolling (about 25 lines). A
  longer program belongs in a sim, where the reader can step through it.
- Keep lines to about 80 characters. A longer line scrolls inside its box; the page never scrolls.
- Comments explain *why*, not *what*: `// progress toward making the condition false`, not
  `// increment n`.
- Put what a program prints in an ```` ```output ```` fence **directly after** its code block (only
  blank lines between). It renders attached under the code, with an *Output* label, so code and
  output read as one unit. Lint warns about an output fence that does not follow a code block.
  For R, printed values can instead be `##` lines inside the code block, as R Markdown does.

### Interactive examples

- **Java stepper** (```` ```sim ```` with `engine: java`) when the point is *execution*: the order in
  which statements run, how variables change, what a call stack looks like. The reader should be
  asked to predict something and then check it: "change `<=` to `<` and predict the output".
- **Data-structure visualiser** (`engine: ds`) when the point is the *state* of a structure after
  each operation: stacks, lists, trees, heaps, hash tables, sorting.
- **Plotly sim** (a registry id) when the point is a *quantity*: growth rates, running times,
  load factors.
- A static code block with its output is enough when nothing changes over time.
- A code block placed **directly after** a sim is that sim's code. It collapses under the sim as
  *Show … code*, whatever its language (Python, Java, R, …).

### Parts

- `##` is a **part** (one topic), `###` a **sub-part**. Nothing deeper.
- Inside a part, in this order: motivation (prose) → definition → syntax → a minimal example with
  its output → the interactive example → a trace or an exercise → caution / insight.
- The unit ends with `## Further reading`: the language documentation first, then tutorials.

## Specimens

### Definition and syntax

:::definition[Loop]
A **loop** repeats a block of statements (the **body**) while a boolean **condition** holds. Every
loop needs three things that agree with each other: an **initialisation** before it, the
**condition**, and an **update** that eventually makes the condition false.
:::

:::syntax[for loop]
```java
for (<init>; <condition>; <update>) {
    <body>
}
```

- `<init>` runs once, before the first test; a variable declared here exists only in the loop.
- `<condition>` is tested before every pass; the loop ends the first time it is `false`.
- `<update>` runs after every pass, before the next test.
- `<body>` may be a single statement without braces, but braces prevent bugs.
:::

### Code and its output

A minimal example, and exactly what it prints:

```java
int sum = 0;
for (int i = 1; i <= 4; i++) {
    sum += i;                        // running total
    System.out.println("i = " + i + ", sum = " + sum);
}
```

```output
i = 1, sum = 1
i = 2, sum = 3
i = 3, sum = 6
i = 4, sum = 10
```

A long line scrolls inside its own box, never the page:

```java
System.out.println(String.format("%-12s %8.2f %8.2f %8.2f", name, subtotal, subtotal * TAX_RATE, subtotal * (1 + TAX_RATE)));
```

### Stepping through code

```sim
id: spec-java-for-trace
custom: true
engine: java
code: |
  int n = 4;
  int sum = 0;
  for (int i = 1; i <= n; i++) {
      sum += i;
  }
  System.out.println("1 + ... + " + n + " = " + sum);
note: 'Specimen copy of a COMP 248 stepper, to check its spacing against the blocks around it. Predict the value of i after the loop ends, then step to the end and check.'
```

### A hand trace

:::trace[The loop above, with n = 4]
| pass | `i` | condition `i <= 4` | `sum` after the body |
|---|---|---|---|
| 1 | 1 | true | 1 |
| 2 | 2 | true | 3 |
| 3 | 3 | true | 6 |
| 4 | 4 | true | 10 |
| — | 5 | **false**: the loop ends | 10 |

Printed: `1 + ... + 4 = 10`. The counter ends at 5, one past the last pass.
:::

### Pseudocode

:::algorithm[Binary search]
**Input:** a sorted array $A[0..n-1]$ and a key $k$.\
**Output:** an index $i$ with $A[i] = k$, or $-1$ if $k$ is not in $A$.

1. Set $lo \leftarrow 0$ and $hi \leftarrow n - 1$.
2. While $lo \le hi$: set $mid \leftarrow \lfloor (lo + hi)/2 \rfloor$.
3. If $A[mid] = k$, return $mid$.
4. If $A[mid] < k$, set $lo \leftarrow mid + 1$; otherwise set $hi \leftarrow mid - 1$. Repeat from step 2.
5. Return $-1$.
:::

The search space halves at each pass, so at most $\lceil \log_2 (n+1) \rceil$ passes run: $O(\log n)$.

### A sim with its code

```sim
id: r-binary-search
controls:
  - {id: n, label: "length of the sorted list", min: 2, max: 1000, step: 1, default: 100, decimals: 0}
  - {id: pct, label: "target position (%)", min: 0, max: 100, step: 1, default: 30, decimals: 0}
note: 'Specimen: a Plotly sim followed directly by a Java block, which collapses under it as its code.'
```

```java
static int binarySearch(int[] a, int key) {
    int lo = 0, hi = a.length - 1;
    while (lo <= hi) {
        int mid = (lo + hi) >>> 1;          // no overflow for large lo + hi
        if (a[mid] == key) return mid;
        if (a[mid] < key) lo = mid + 1; else hi = mid - 1;
    }
    return -1;
}
```

### A data structure, operation by operation

```sim
id: spec-ds-stack
custom: true
engine: ds
mode: stack
data: [3, 8]
capacity: 4
ops: ["push 5", "top", "pop", "push 9"]
note: 'Specimen copy of a COMP 352 visualiser, to check its spacing on a programming page.'
```

### Practice

::::exercise[What does this print?]
```java
int x = 10;
while (x > 1) {
    x = x / 2;
    System.out.print(x + " ");
}
```

:::solution
`5 2 1 `: integer division truncates, so 10 → 5 → 2 → 1, and the loop stops when `x > 1` fails
with `x = 1`. The last value printed is the one that ends the loop.
:::
::::

### Method and asides

:::steps[Tracing a loop by hand]
1. Write one column per variable the loop reads or changes, plus one for the output.
2. Fill in the row for the state just before the first test.
3. For each pass: test the condition, run the body, write the new row.
4. Stop at the first failed test, and write the final values: they are what the code after the
   loop sees.
:::

:::note
`for` and `while` can express the same loops. Choose `for` when the loop counts, so the reader
finds the whole plan in the header.
:::

:::caution
`for (int i = 0; i <= a.length; i++)` runs one pass too many and ends with an
`ArrayIndexOutOfBoundsException`. The last valid index is `a.length - 1`.
:::

:::insight
Every loop is an initialisation, a condition and an update that agree. Check the first and the
last pass by hand, and the off-by-one bugs go away.
:::

## Change log

- 2026-09-25: first version (#131): `syntax` block for the general form of a construct; `trace`,
  `algorithm` and `exercise` reused from theory with programming meanings; ```` ```output ````
  fences attach under their code; the code block after a sim collapses as *Show … code* in any
  language; programming pages get line-height 1.7 and slightly smaller code; lint warns about
  fences without a language and misplaced output fences.
