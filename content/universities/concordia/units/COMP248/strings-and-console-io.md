---
title: Strings and console I/O
order: 2
status: detailed
weeks: [2]
notes: ["COMP 248 course outline (Fall 2016): week 2, Java Basics (continued)"]
introduces: [string]
requires:
  - {concept: variables-and-expressions, strength: hard}
reinforces: []
---

Text as `String` objects and the methods that work on them, reading input with `Scanner`,
formatted output with `printf`, and the input → compute → output shape of a first program.

## Strings are objects

:::definition
A **String** is an object holding an immutable sequence of characters.
A string literal is written in double quotes (`"COMP 248"`); a `char` literal in single
quotes (`'C'`). `String` is a class, not a primitive type, which is why its name is
capitalised and why it has **methods** called with a dot.
:::

:::syntax[Calling a method on an object]
```java
<object>.<method>(<arguments>)
```

- `<object>` is a variable (or expression) that refers to an object, such as a `String`.
- `<method>` is one of the methods its class defines; the parentheses are required even when
  there are no arguments: `s.length()`.
- `<arguments>` are separated by commas, in the order and types the method expects.
- The call is an expression: its value is what the method returns, used like any other value.
:::

**Immutable** means no method changes a string in place: `s.toUpperCase()` *returns a new
string* and leaves `s` alone, so you must assign the result if you want to keep it. The
`+` operator on a string is **concatenation**, and it converts the other operand to text —
which interacts with left-to-right evaluation:

```java
System.out.println("Total: " + 2 + 3);     // left to right: "Total: 2", then + 3
System.out.println("Total: " + (2 + 3));   // parentheses: int addition first
System.out.println(2 + 3 + " items");      // 2 + 3 is int addition before any string
```

```output
Total: 23
Total: 5
5 items
```

**Escape sequences** write characters that cannot be typed directly: `\n` newline, `\t`
tab, `\"` a quote inside a string, `\\` a backslash. The empty string `""` has length 0
and is not the same as `null` (no string at all — next units).

## The methods you use every week

| call | result |
|---|---|
| `s.length()` | number of characters (parentheses: it is a method) |
| `s.charAt(i)` | the `char` at index `i`, counting from **0** to `length() - 1` |
| `s.substring(a, b)` | characters from index `a` up to but not including `b` |
| `s.substring(a)` | from `a` to the end |
| `s.indexOf("x")` | index of the first `"x"`, or `-1` if absent |
| `s.equals(t)` | `true` if the two strings have the same characters |
| `s.equalsIgnoreCase(t)` | same, ignoring case |
| `s.compareTo(t)` | negative, zero or positive as `s` sorts before, equal to, after `t` |
| `s.toUpperCase()`, `s.toLowerCase()` | a new string in that case |
| `s.trim()` | a new string without leading and trailing whitespace |
| `s.contains("x")`, `s.startsWith("x")` | `true` / `false` |

:::caution
Compare strings with `equals`, never `==`. `==` asks whether two variables
refer to the *same object*; two strings built at different times can be equal in content
and still be different objects, so `input == "yes"` is usually `false` even when the
user typed yes. (The reason is the subject of the arrays-of-objects unit.)
:::

```sim
id: java-string-methods
custom: true
engine: java
code: |
  String s = "  Object-Oriented Programming ";
  s = s.trim();
  System.out.println(s.length());
  System.out.println(s.charAt(0) + "" + s.charAt(s.length() - 1));
  int dash = s.indexOf("-");
  System.out.println(s.substring(0, dash).toUpperCase());
  System.out.println(s.substring(dash + 1, dash + 9));
  String a = "yes", b = "y" + "es", c = new String("yes");
  System.out.println(a.equals(c) + " " + (a == c) + " " + a.equals(b));
  System.out.println("apple".compareTo("banana"));
note: 'Indices start at 0 and substring''s second argument is exclusive. The last lines show equals versus ==: equal content, but c is a different object.'
```

## Reading input with Scanner

Console input goes through a `Scanner` attached to `System.in`. It needs an import above
the class, and one object created once:

```java
import java.util.Scanner;

public class Average {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        System.out.print("Enter two marks: ");
        int m1 = in.nextInt();
        int m2 = in.nextInt();
        System.out.println("Average: " + (m1 + m2) / 2.0);
        in.close();
    }
}
```

```output
Enter two marks: 70 85
Average: 77.5
```

The user typed `70 85` after the prompt: `print` left the cursor on the prompt's line.

`nextInt()`, `nextDouble()` and `next()` skip whitespace and read one **token**;
`nextLine()` reads everything up to the end of the current line, *including an empty rest
of a line*. The classic trap: after `nextInt()` the newline the user pressed is still
waiting, so a following `nextLine()` returns `""`. Consume it with an extra `nextLine()`.
Typing letters where a number is expected raises an `InputMismatchException` and stops
the program — validation is a loop, next units.

```sim
id: java-scanner-trap
custom: true
engine: java
code: |
  Scanner in = new Scanner(System.in);
  int age = in.nextInt();
  in.nextLine();
  String name = in.nextLine();
  System.out.println(name + " is " + age);
  System.out.println("Next year: " + (age + 1));
stdin: |
  19
  Ada Lovelace
note: 'The Input box is what the user would type. Delete the in.nextLine(); line and run again — name becomes the empty rest of the first line. Then put letters in place of 19 to see the InputMismatchException.'
```

## Formatted output

`System.out.printf(format, values…)` prints the format string with each `%` **specifier**
replaced by the next value: `%d` an integer, `%f` a real, `%.2f` a real with two
decimals, `%s` a string, `%c` a char, `%n` a newline. A width goes before the dot —
`%8.2f` right-aligns in 8 columns, `%-10s` left-aligns a string — which is how tables
line up. `String.format` uses the same specifiers and returns the string instead of
printing it.

:::syntax[printf and a format specifier]
```java
System.out.printf(<format>, <value1>, <value2>, …);
%[-][<width>][.<precision>]<conversion>
```

- `<format>` is a string; each specifier in it is replaced by the next value, in order.
- `<conversion>` is `d` (integer), `f` (real), `s` (string), `c` (char); `%n` is a newline and
  `%%` a percent sign.
- `<width>` is the minimum number of columns; `-` left-aligns within them.
- `.<precision>` is the number of decimals for `f`.
:::

```sim
id: java-printf
custom: true
engine: java
code: |
  double pen = 1.5, notebook = 4.25, backpack = 39.9;
  double total = pen + notebook + backpack;
  final double TAX = 0.14975;
  System.out.printf("%-10s%8s%n", "item", "price");
  System.out.printf("%-10s%8.2f%n", "pen", pen);
  System.out.printf("%-10s%8.2f%n", "notebook", notebook);
  System.out.printf("%-10s%8.2f%n", "backpack", backpack);
  System.out.printf("%-10s%8.2f%n", "total", total);
  System.out.printf("tax %.3f%% = %.2f%n", TAX * 100, total * TAX);
  System.out.println("tax = " + total * TAX);
note: 'Width and precision line the table up; %% prints a literal percent sign. Compare the last two lines — println prints the double as it is, printf rounds to what the reader needs. Change %8.2f to %8.3f or %-10s to %10s and run again.'
```

::::exercise[What does this print?]
```java
String w = "programming";
System.out.println(w.substring(3, 7) + w.indexOf("m") + w.charAt(w.length() - 1));
System.out.println(1 + 2 + "3" + 4 + 5);
```

:::solution
```text
gram6g
3345
```

`substring(3, 7)` is the characters at indices 3 to 6, `gram`; the first `m` is at index 6;
the last character is `g`. On the second line `1 + 2` is int addition (3); from then on every
`+` has a string on its left, so 4 and 5 are appended as text.
:::
::::

## The shape of a first program

Almost every early assignment has the same three parts: **input** (prompt, read, and
store in well-named variables), **compute** (expressions, using named constants for fixed
numbers), **output** (formatted, with units). Write the prompt so the user knows what to
type, echo what was read when the output is not obvious, and keep the computation
separate from the printing so each can be checked on its own.

:::insight
A `String` is your first object: a value with behaviour attached, used
through methods rather than operators. `length()`, `charAt`, `substring` and `equals`
are the vocabulary; zero-based indices and immutability are the rules; `equals` versus
`==` is the trap.
:::

:::equations
- *Valid indices*: for a string $s$ of length $n$, `charAt(i)` is defined for $0 \le i \le n - 1$; `substring(a, b)` returns the characters at indices $a, \dots, b - 1$ and requires $0 \le a \le b \le n$.
- *Concatenation is left-associative*: $\texttt{"x" + 1 + 2}$ is $\texttt{"x12"}$ while $\texttt{1 + 2 + "x"}$ is $\texttt{"3x"}$.
:::

## Further reading

- [The Java Tutorials — Strings](https://docs.oracle.com/javase/tutorial/java/data/strings.html) — Creating strings, methods, and the immutability rule.
- [Class String (Java 8 API)](https://docs.oracle.com/javase/8/docs/api/java/lang/String.html) — The full method list; look up what you need rather than memorising.
- [Class Scanner (Java 8 API)](https://docs.oracle.com/javase/8/docs/api/java/util/Scanner.html) — `nextInt`, `nextLine`, `hasNextInt` and the token rules.
- [Class Formatter — format string syntax](https://docs.oracle.com/javase/8/docs/api/java/util/Formatter.html#syntax) — Everything `printf` accepts.
