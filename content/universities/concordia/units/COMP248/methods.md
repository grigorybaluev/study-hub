---
title: Methods
order: 7
status: detailed
weeks: [8]
notes: ["COMP 248 course outline (Fall 2016): week 8, Defining Classes (methods, parameters, return values); lab exercise 4; assignment 3 due"]
introduces: [function-definition]
requires:
  - {concept: iteration, strength: hard}
  - {concept: array, strength: soft}
reinforces: []
---

Breaking a program into named pieces: defining static methods, passing arguments,
returning results, what a method can and cannot change in its caller, and using `main`
as a test driver.

## Why methods

`main` grows until nobody can read it. A **method** names a piece of work so it can be
written once, tested once, and called wherever needed — the first tool of program design. The methods in this unit are `static`: they belong to the class, need
no object, and are called by name from `main` or from each other. Instance methods, the
ones that belong to an object, come with classes in the next unit.

## Defining and calling

:::definition
A **method definition** has a **header** — return type, name,
**parameter list** — and a **body**. A **call** `name(arguments)` runs the body with
each parameter initialised from the corresponding argument, and the call *evaluates to*
the value given by `return`.
:::

:::syntax[Static method]
```java
public static <return type> <name>(<type> <param>, <type> <param>, …) {
    <statements>
    return <expression>;
}
```

- `<return type>` is the type of the value the call produces, or `void` for none.
- The parameter list may be empty, `()`; each parameter is a type and a name, like a declaration.
- `return <expression>;` ends the call with that value; its type must fit `<return type>`. A
  `void` method uses `return;` (or none) to end.
- A call is `<name>(<arguments>)`, with one argument per parameter, in order.
:::

```java
public static double average(int a, int b) {   // header: returns double, takes two ints
    return (a + b) / 2.0;                       // body ends by returning a value
}

public static void printLine(int width) {       // void: does something, returns nothing
    for (int i = 0; i < width; i++) System.out.print("-");
    System.out.println();
}
```

`average(70, 85)` is an expression of type `double`; `printLine(20);` is a statement.
A non-`void` method must `return` on every path — a method that returns inside an `if`
needs a `return` after it too — and `return` in a `void` method just leaves early. A
method is defined once, outside every other method but inside the class, in any order.

```sim
id: java-method-calls
custom: true
engine: java
code: |
  static int max3(int a, int b, int c) {
      int m = a;
      if (b > m) m = b;
      if (c > m) m = c;
      return m;
  }
  static boolean isEven(int n) {
      return n % 2 == 0;
  }
  static void report(int n) {
      System.out.println(n + " is " + (isEven(n) ? "even" : "odd"));
  }
  int big = max3(4, 9, 7);
  report(big);
  report(max3(-2, -8, -5));
note: 'Step into max3 and watch the Variables panel grow a second frame with its own a, b, c, m — and shrink back when it returns. report calls isEven inside its own body: three frames deep.'
```

## Parameters, arguments and scope

Each call gets a fresh set of **local variables**: the parameters plus anything declared
in the body. They exist only during the call, are invisible to the caller, and can reuse
names the caller uses — a parameter `n` in `isEven` is unrelated to a variable `n` in
`main`. There are no global variables in this course; the only way in is a parameter and
the only way out is `return`. Arguments are matched to parameters **by position**, and
each must be assignable to its parameter's type (an `int` argument to a `double`
parameter is fine; the reverse is a compile error).

:::definition[Pass by value]
Java copies the *value* of each argument into the
parameter. For a primitive that is the number itself, so the method cannot change the
caller's variable. For an array (or any object) the value is the *reference*, so the
method works on the caller's array and can change its elements — but reassigning the
parameter to a new array changes nothing outside.
:::

```sim
id: java-pass-by-value
custom: true
engine: java
code: |
  static void tryToDouble(int n) {
      n = n * 2;
  }
  static void doubleAll(int[] a) {
      for (int i = 0; i < a.length; i++) a[i] *= 2;
  }
  static void replace(int[] a) {
      a = new int[] {0, 0, 0};
  }
  int x = 21;
  tryToDouble(x);
  System.out.println("x = " + x);
  int[] v = {1, 2, 3};
  doubleAll(v);
  System.out.println(Arrays.toString(v));
  replace(v);
  System.out.println(Arrays.toString(v));
note: 'Three calls, one rule. n is a copy of 21; a in doubleAll is a copy of the reference #1, so writing through it changes v; a in replace is pointed at a new array #2 and v never knows. Watch the #ids as you step.'
```

::::exercise[What does this print?]
```java
public class F {
    static int f(int n) {
        n = n + 10;
        return n * 2;
    }
    public static void main(String[] args) {
        int n = 1;
        int r = f(n) + f(f(n));
        System.out.println(n + " " + r);
    }
}
```

:::solution
```text
1 86
```

Each call gets its own `n`, a copy of the argument, so `main`'s `n` stays 1. `f(1)` is
`(1 + 10) · 2 = 22`, and `f(f(1)) = f(22) = (22 + 10) · 2 = 64`, so `r` is 22 + 64 = 86.
:::
::::

## Returning results, not printing them

A method that *computes* should return the value and let the caller decide what to do
with it; a method that *prints* is a dead end — you cannot add two printed averages. The
split "compute in methods, print in main" is what makes methods testable: call
`average(70, 85)` and compare the result to 77.5. Boolean-returning methods
(**predicates**) such as `isEven`, `isLeapYear`, `isValid` read well in conditions and
name the rule in one place.

## main as a test driver

Until you have a class to test, `main` is where you *drive* your methods: call each with
easy inputs whose answers you know (`max3(1, 2, 3)`, then `max3(3, 2, 1)`, then equal
values), print the result next to the expected value, and only then use the method in the
real program. When a method is wrong, the trace table is the same tool as for loops, one
frame at a time.

```sim
id: java-method-driver
custom: true
engine: java
code: |
  static boolean isLeapYear(int y) {
      return y % 4 == 0 && (y % 100 != 0 || y % 400 == 0);
  }
  static int daysIn(int month, int year) {
      if (month == 2) return isLeapYear(year) ? 29 : 28;
      if (month == 4 || month == 6 || month == 9 || month == 11) return 30;
      return 31;
  }
  System.out.println(isLeapYear(2000) + " expected true");
  System.out.println(isLeapYear(1900) + " expected false");
  System.out.println(isLeapYear(2024) + " expected true");
  System.out.println(daysIn(2, 2023) + " expected 28");
  System.out.println(daysIn(2, 2024) + " expected 29");
  System.out.println(daysIn(9, 2024) + " expected 30");
note: 'A driver: each line states the expected answer beside the actual one. Break the leap-year rule (drop the || y % 400 == 0) and see which lines disagree.'
```

:::insight
A method is a contract: given these parameters, it returns this
value, and touches nothing else it was not handed. Primitives go in as copies; arrays go
in as references to the caller's data. Keep computing and printing apart, and `main`
becomes the place where you check the contract holds.
:::

:::equations
- *Call as an expression*: if $f$ has header `T f(P1 a, P2 b)`, then `f(x, y)` has type $T$ and the body runs with $a = x$, $b = y$ (copies); the call's value is whatever `return` yields.
- *Leap year*: $y$ is a leap year iff $4 \mid y \land (100 \nmid y \lor 400 \mid y)$.
:::

## Further reading

- [The Java Tutorials — Defining Methods](https://docs.oracle.com/javase/tutorial/java/javaOO/methods.html) — Headers, parameters and the return statement.
- [The Java Tutorials — Passing Information to a Method or a Constructor](https://docs.oracle.com/javase/tutorial/java/javaOO/arguments.html) — Oracle's statement of pass-by-value for primitives and references.
