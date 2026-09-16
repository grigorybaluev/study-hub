---
title: Catch-up and review
order: 11
kind: review
status: detailed
weeks: [13]
notes: ["COMP 248 course outline (Fall 2016): week 13, Catch Up and/or Review; final exam covers all material, 40%"]
introduces: []
requires: []
reinforces: [variables-and-expressions, string, selection, iteration, array, function-definition, class-and-object, object-reference]
---

The last week recaps everything for the final, which covers the whole term. Nothing new;
the units above are the material. What to be able to do, per unit:

- **Programs and Java basics** — declare typed variables; predict `int` versus `double`
  arithmetic, promotion, casts and overflow.
- **Strings and console I/O** — `length`, `charAt`, `substring`, `indexOf`, `equals`;
  read with `Scanner` (and the `nextLine` trap); format with `printf`.
- **Selection** — write and read `if`/`else` chains and `switch` with fall-through;
  short-circuit `&&`/`||`; compare doubles and strings correctly.
- **Loops** and **loop patterns** — trace any `for`/`while`/`do` by hand with a table;
  recognise sum / count / max / search; nested loops; digit and character loops.
- **Arrays** — indices `0 … length - 1`; the standard algorithms; aliasing on
  assignment; 2-D traversal.
- **Methods** — headers, calls as expressions, pass by value for primitives and
  references, `main` as a driver.
- **Defining classes** — fields, constructors, `this`, `private` with accessors and
  mutators, `toString`.
- **References and arrays of objects** — draw the boxes and arrows; `null`; `==` versus
  `equals`; objects as parameters; arrays of `null`s.
- **More on classes** — `static` fields and methods, overloading, wrappers, `import`.

One program that touches all of it — trace it before running it, then compare:

```sim
id: java-review-capstone
custom: true
engine: java
code: |
  import java.util.Scanner;
  public class Gradebook {
      public static void main(String[] args) {
          Scanner in = new Scanner(System.in);
          Student[] roster = new Student[10];
          int count = 0;
          while (in.hasNext() && count < roster.length) {
              String name = in.next();
              int mark = in.nextInt();
              roster[count++] = new Student(name, mark);
          }
          Student best = roster[0];
          for (int i = 1; i < count; i++)
              if (roster[i].getMark() > best.getMark()) best = roster[i];
          System.out.printf("%d students, average %.1f%n", count, Student.average(roster, count));
          System.out.println("best: " + best);
          for (int i = 0; i < count; i++) System.out.println(roster[i]);
      }
  }
  class Student {
      private String name; private int mark;
      Student(String name, int mark) { this.name = name; this.mark = Math.max(0, Math.min(100, mark)); }
      int getMark() { return mark; }
      char letter() { return mark >= 80 ? 'A' : mark >= 65 ? 'B' : mark >= 50 ? 'C' : 'F'; }
      static double average(Student[] s, int n) {
          int sum = 0;
          for (int i = 0; i < n; i++) sum += s[i].mark;
          return n == 0 ? 0 : (double) sum / n;
      }
      public String toString() { return String.format("%-6s%4d %c", name, mark, letter()); }
  }
note: 'Scanner loop into a partially filled array of objects, a maximum by alias, a static method over the array, printf and toString, a clamped constructor. Add a student with mark 120 to the input and see the constructor clamp it.'
stdin: |
  Ana 78
  Bo 91
  Cy 64
  Dee 49
```
