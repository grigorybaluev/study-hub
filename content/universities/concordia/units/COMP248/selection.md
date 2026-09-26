---
title: Selection
order: 3
status: detailed
weeks: [3]
notes: ["COMP 248 course outline (Fall 2016): week 3, Flow of Control 1 (Selection); lab exercise 1"]
introduces: [selection]
requires:
  - {concept: variables-and-expressions, strength: hard}
  - {concept: string, strength: soft}
reinforces: []
---

Boolean expressions, `if` / `else` and the chains and nests they form, `switch`, and how
to turn the cases of a problem into conditions.

## Boolean expressions

:::definition
A **boolean expression** evaluates to `true` or `false`. The
**relational operators** `< <= > >= == !=` compare two numbers (or two chars); the
**logical operators** `&&` (and), `||` (or), `!` (not) combine booleans.
:::

Precedence, high to low: `!`, then arithmetic, then relational, then `==` / `!=`, then
`&&`, then `||`. So `x > 0 && x < 10` needs no parentheses, but write them whenever a
reader would hesitate. Two rules with consequences:

- **Short-circuit evaluation.** `a && b` does not evaluate `b` when `a` is false; `a || b`
  does not evaluate `b` when `a` is true. `n != 0 && total / n > 5` is safe precisely
  because the division is skipped when `n` is zero.
- **A range is two comparisons.** `0 < x < 10` is a compile error (the first comparison
  yields a boolean, which cannot be compared to 10); write `0 < x && x < 10`.

Booleans are values: `boolean passed = mark >= 50;` stores the answer, and
`if (passed)` reads better than `if (passed == true)`.

## if, else and chains

:::syntax[if, else if, else]
```java
if (<condition>) {
    <statements>
} else if (<condition>) {
    <statements>
} else {
    <statements>
}
```

- Each `<condition>` is a boolean expression, in parentheses.
- The conditions are tested top to bottom; the first one that is `true` runs its block, and the
  rest are skipped.
- `else if` parts are optional and may repeat; the final `else` is optional and runs when no
  condition held.
:::

```java
if (mark >= 50) {
    System.out.println("pass");
} else {
    System.out.println("fail");
}
```

The braces are optional when a branch is a single statement, and leaving them out is the
most common source of bugs in this course: an indented second line *looks* inside the
`if` but is not. Always use braces. An **else-if chain** tests conditions in order and
runs the first branch whose condition holds — so the order matters and the conditions
need not be mutually exclusive:

```java
if (mark >= 80)      letter = 'A';
else if (mark >= 65) letter = 'B';
else if (mark >= 50) letter = 'C';
else                 letter = 'F';
```

Reversing the order (`>= 50` first) would give every passing mark a `C`. A **nested if**
is an `if` inside a branch; when both an inner and an outer `if` lack an `else`, an
`else` attaches to the *nearest* `if` — the **dangling else** — which braces make explicit.

```sim
id: java-else-if-chain
custom: true
engine: java
code: |
  int mark = 72;
  char letter;
  if (mark >= 80) {
      letter = 'A';
  } else if (mark >= 65) {
      letter = 'B';
  } else if (mark >= 50) {
      letter = 'C';
  } else {
      letter = 'F';
  }
  boolean honours = letter == 'A' && mark >= 90;
  System.out.println(mark + " -> " + letter + ", honours: " + honours);
note: 'Step through and notice which conditions are evaluated — after mark >= 65 succeeds, the remaining tests are skipped. Set mark to 95, 50, 49; then move the >= 50 test to the top and see what breaks.'
```

## Comparing doubles, chars and strings

`==` is exact. For `double`, arithmetic rounding makes exact equality unreliable —
`0.1 + 0.2 == 0.3` is `false` — so compare with a tolerance:
`Math.abs(a - b) < 1e-9`. For `char`, `==` and `<` work on the character codes, so
`'a' <= c && c <= 'z'` tests for a lowercase letter. For `String`, use `equals`,
`equalsIgnoreCase`, or `compareTo` (negative when the receiver sorts first); `==` on
strings compares identity, not content.

```sim
id: java-comparisons
custom: true
engine: java
code: |
  double a = 0.1 + 0.2;
  System.out.println(a == 0.3);
  System.out.println(Math.abs(a - 0.3) < 1e-9);
  char c = 'q';
  System.out.println('a' <= c && c <= 'z');
  String answer = "Yes";
  System.out.println(answer.equals("yes") + " " + answer.equalsIgnoreCase("yes"));
  System.out.println("Zebra".compareTo("apple") < 0);
  int n = 0;
  System.out.println(n != 0 && 10 / n > 1);
note: 'Three comparisons that catch people out — doubles, case, and uppercase sorting before lowercase in compareTo — and short-circuit && guarding a division by zero. Swap the two operands of the last && and run again.'
```

## switch

When one value is matched against several constants, `switch` reads better than a chain:

:::syntax[switch]
```java
switch (<expression>) {
    case <constant>:
        <statements>
        break;
    case <constant>:
    case <constant>:
        <statements>
        break;
    default:
        <statements>
}
```

- `<expression>` is an `int`, `char` or `String` (or an enum).
- Each `case` label is a constant; control jumps to the matching label and runs until a `break`.
- Stacked labels share one body; `default` runs when no label matches.
:::

```java
switch (day) {
    case "sat":
    case "sun":
        System.out.println("weekend");
        break;
    case "fri":
        System.out.println("almost");
        break;
    default:
        System.out.println("weekday");
}
```

The subject can be an `int`, `char` or `String`; the labels must be constants. Control
jumps to the matching label and then **falls through** every following statement until a
`break` — so stacked labels share a body, and a forgotten `break` runs the next case too.
`default` catches everything else. What `switch` cannot do is a range test (`mark >= 80`)
— that stays an if-chain.

```sim
id: java-switch-fallthrough
custom: true
engine: java
code: |
  char grade = 'B';
  switch (grade) {
      case 'A':
          System.out.println("excellent");
      case 'B':
          System.out.println("good");
      case 'C':
          System.out.println("pass");
          break;
      default:
          System.out.println("see the instructor");
  }
  int units = 3;
  String label = units == 1 ? "unit" : "units";
  System.out.println(units + " " + label);
note: 'Two breaks are missing on purpose — ''B'' prints three lines. Add them and try ''D''. The last lines show the conditional operator, a one-expression if/else.'
```

## The conditional operator

:::syntax[Conditional operator]
```java
<condition> ? <value if true> : <value if false>
```

- The whole thing is an *expression*: it yields one of the two values, so it can sit inside an
  assignment, a call or a `println`.
- Both values must have compatible types.
:::

An if/else that produces a value: `max = x > y ? x : y;` is idiomatic; anything longer than
one line belongs in an `if`.

::::exercise[What does this print?]
```java
int x = 5, y = 12;
if (x > 3)
    if (y < 10)
        System.out.println("A");
else
    System.out.println("B");
System.out.println(x > 3 && y < 10 || x == 5 ? "C" : "D");
```

:::solution
```text
B
C
```

The indentation lies: the `else` belongs to the nearest `if`, `y < 10`, not to `x > 3`. Since
`x > 3` holds and `y < 10` does not, the inner `else` prints `B`. On the last line `&&` binds
tighter than `||`: `(true && false) || true` is `true`, so the conditional yields `"C"`.
:::
::::

## Designing the conditions

The lab problems ("classify a triangle", "compute shipping by weight band", "validate a
date") are exercises in listing cases before writing code: write down every case, check
they cover all inputs and do not overlap, order them from most to least specific, and only
then translate each into a condition. An else-if chain whose last branch is a plain
`else` is a guarantee that no input falls through.

:::insight
Selection is deciding *which* statements run. Every decision is a
boolean expression; the shape of the code — chain, nest, switch — should mirror the
shape of the cases, and braces plus a final `else` are what keep it honest.
:::

:::equations
- *De Morgan's laws*, the way you rewrite negated conditions: $\lnot(p \land q) \equiv \lnot p \lor \lnot q$ and $\lnot(p \lor q) \equiv \lnot p \land \lnot q$ — so `!(x < 0 || x > 9)` is `x >= 0 && x <= 9`.
- *Tolerance comparison*: treat doubles $a$ and $b$ as equal when $|a - b| < \varepsilon$ for a small $\varepsilon$ such as $10^{-9}$.
:::

## Further reading

- [The Java Tutorials — The if-then and if-then-else Statements](https://docs.oracle.com/javase/tutorial/java/nutsandbolts/if.html) — Oracle's introduction, with the brace convention.
- [The Java Tutorials — The switch Statement](https://docs.oracle.com/javase/tutorial/java/nutsandbolts/switch.html) — Fall-through explained with a worked example.
- [Java Language Specification — §15.23–15.24 Conditional-And / Conditional-Or](https://docs.oracle.com/javase/specs/jls/se8/html/jls-15.html#jls-15.23) — The formal statement of short-circuit evaluation.
