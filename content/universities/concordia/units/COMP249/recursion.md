---
title: Recursion
order: 7
status: detailed
weeks: [7]
notes: ["COMP 249 course outline (Winter 2026): week 7, ch. 11, Recursion"]
introduces:
  - {concept: recursion, perspective: "methods that call themselves in Java: the call stack, base cases, tracing, and the recursive versions of loops, searches and string algorithms"}
requires:
  - {concept: function-definition, strength: hard}
  - {concept: iteration, strength: hard}
  - {concept: array, strength: soft}
  - {concept: string, strength: soft}
reinforces: []
---

A method may call itself. That is all recursion is mechanically — but it changes how
problems are solved: instead of a loop that grinds through every case, a method handles
the smallest case directly and otherwise hands a *smaller* version of the problem to a
fresh copy of itself. COMP 232 met recursion as a way to define sequences; here it is a
way to write methods, and the call stack is what makes it work.

## A method that calls itself

> **Definition.** A **recursive method** contains a call to itself. To terminate it needs
> one or more **base cases** — inputs it answers without recursing — and every
> **recursive case** must call the method on an input strictly closer to a base case.
> Each call gets its own frame on the call stack with its own parameters and locals;
> the frames pile up during the descent and are popped as each call returns.

```sim
id: java-249-recursion-factorial
custom: true
engine: java
code: |
  public class Main {
      static long factorial(int n) {
          if (n <= 1) return 1;               // base case
          long rest = factorial(n - 1);       // smaller problem
          return n * rest;                    // combine
      }
      static int sumDigits(int n) {
          if (n < 10) return n;
          return n % 10 + sumDigits(n / 10);
      }
      public static void main(String[] args) {
          System.out.println(factorial(5));
          System.out.println(sumDigits(4713));
      }
  }
note: 'Step into factorial(5) and watch five frames stack up in the Variables panel, each with its own n; then watch them unwind as rest gets a value in each. sumDigits does the same with the last digit peeled off each time. Delete the base case of factorial and see what happens to the stack.'
```

Trace a recursive call the way the stepper does: write the call, then the call it makes,
indented, until a base case answers; then fill answers in from the innermost call
outward. Two questions decide correctness — *does every path reach a base case?* and *is
the recursive call's input smaller?* A method that recurses on the same input, or has
no base case, descends until the stack is exhausted: **`StackOverflowError`**.

## Thinking recursively

The design move is to assume the method already works for smaller inputs and ask only
how to build the answer for this input from that. For a string: `reverse(s)` is
`reverse(s minus its first character) + first character`; the base case is the empty (or
one-character) string. For an array: the sum of `a[i..]` is `a[i]` plus the sum of
`a[i+1..]`, with base case "past the end", which is why recursive array methods usually
carry an index parameter — a public wrapper starts it at `0` and a private helper does
the work.

```sim
id: java-249-recursion-strings-arrays
custom: true
engine: java
code: |
  public class Main {
      static String reverse(String s) {
          if (s.length() <= 1) return s;
          return reverse(s.substring(1)) + s.charAt(0);
      }
      static boolean isPalindrome(String s) {
          if (s.length() <= 1) return true;
          if (s.charAt(0) != s.charAt(s.length() - 1)) return false;
          return isPalindrome(s.substring(1, s.length() - 1));
      }
      static int sum(int[] a) { return sum(a, 0); }
      private static int sum(int[] a, int i) {
          if (i == a.length) return 0;
          return a[i] + sum(a, i + 1);
      }
      static int max(int[] a, int i) {
          if (i == a.length - 1) return a[i];
          int rest = max(a, i + 1);
          return a[i] > rest ? a[i] : rest;
      }
      public static void main(String[] args) {
          System.out.println(reverse("stressed"));
          System.out.println(isPalindrome("racecar") + " " + isPalindrome("racecars"));
          int[] data = {4, 9, 2, 7};
          System.out.println(sum(data) + " " + max(data, 0));
      }
  }
note: 'Four shapes of the same idea: peel one character, peel both ends, walk an index to the end, combine on the way back. Trace max(data, 0) by hand first — the comparison happens after the recursive call returns. Rewrite reverse to build the string on the way down instead (an accumulator parameter).'
```

## Recursion versus iteration

Any recursion can be rewritten as a loop (with an explicit stack if need be), and any
loop as recursion. The recursive form wins when the problem is *itself* recursive — a
directory containing directories, an expression containing expressions, the nested
structures of later units — or when the solution divides the input, as **binary
search** does: look at the middle, then search only the half that can contain the
target. Its recursion depth is only about $\log_2 n$, so no stack worry.

The iterative form wins for plain counting: a recursive `sum` of a million-element array
overflows the stack where a loop would not, and each call costs a frame. The
Fibonacci numbers show the other trap: the direct recursion recomputes the same values
exponentially many times.

```sim
id: java-249-binary-search-fib
custom: true
engine: java
code: |
  public class Main {
      static int calls = 0;
      static int binarySearch(int[] a, int target, int lo, int hi) {
          calls++;
          if (lo > hi) return -1;
          int mid = (lo + hi) / 2;
          if (a[mid] == target) return mid;
          if (target < a[mid]) return binarySearch(a, target, lo, mid - 1);
          return binarySearch(a, target, mid + 1, hi);
      }
      static int fib(int n) {
          calls++;
          if (n < 2) return n;
          return fib(n - 1) + fib(n - 2);
      }
      static int fibLoop(int n) {
          int a = 0, b = 1;
          for (int i = 0; i < n; i++) { int next = a + b; a = b; b = next; }
          return a;
      }
      public static void main(String[] args) {
          int[] sorted = {2, 5, 8, 12, 16, 23, 38, 56, 72, 91};
          System.out.println("23 at index " + binarySearch(sorted, 23, 0, sorted.length - 1) + " after " + calls + " calls");
          calls = 0;
          System.out.println("fib(12) = " + fib(12) + " after " + calls + " calls");
          System.out.println("fibLoop(12) = " + fibLoop(12));
      }
  }
note: 'Binary search halves the range: three or four calls for ten elements. The recursive fib makes hundreds of calls for n = 12 because fib(10), fib(9), … are recomputed again and again; the loop does twelve additions. Raise fib to 14 and compare the call count — the step budget runs out around 16.'
```

**Equations**

- *Factorial*: $n! = n \cdot (n-1)!$ with $0! = 1$ — the recursive case and the base case, read straight into code.
- *Recursion depth of binary search*: at most $\lfloor \log_2 n \rfloor + 1$ calls for $n$ elements, since each call halves the range.
- *Calls made by the naive Fibonacci*: $C(n) = C(n-1) + C(n-2) + 1$, which grows like $\phi^n$ — exponential, versus $n$ steps for the loop.

> **Key insight.** Trust the recursive call. Write the base case, make the call on a
> strictly smaller input, combine — and let the call stack keep every partial result in
> its own frame. Tracing the frames, as the stepper shows them, is how to convince
> yourself a recursion is right before running it.

## Further reading

- [The Java Tutorials — Defining Methods](https://docs.oracle.com/javase/tutorial/java/javaOO/methods.html) — Method calls and the call stack, the mechanism recursion relies on.
- [Sedgewick & Wayne — Recursion](https://introcs.cs.princeton.edu/java/23recursion/) — Towers of Hanoi, gcd, and the case for and against recursion, with code.
