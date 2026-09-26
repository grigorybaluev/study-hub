---
title: "Functional programming: pure functions, side effects and higher-order functions"
order: 13
status: detailed
weeks: [10]
introduces: [functional-programming, higher-order-function]
requires:
  - {concept: recursion, strength: hard}
  - {concept: programming-paradigms, strength: hard}
  - {concept: function-definition, strength: hard}
reinforces: []
---

What a function is in mathematics and what most languages call a function instead, why side
effects make programs hard to reason about and to run in parallel, and the tools functional
languages build on pure functions: functions as values, composition, map, filter and reduce,
recursion, and immutable data.

## Two traditions

Imperative languages were designed around the von Neumann machine: variables are memory cells,
assignment moves values into them, loops repeat. Efficiency on that hardware came first.
**Functional** languages start from mathematics instead: a program is a set of functions, and
running it means applying functions to arguments. Their theory is solid and old — Alonzo
Church's **lambda calculus** of the 1930s — and they care less about the machine underneath.

In the lambda calculus, a function is written with its parameter and the mapping, without a name:

$$\lambda x.\; x \cdot x \cdot x$$

is the function that cubes its argument. Applying it to 2 gives 8. Lisp, and after it every
functional language, turned this into syntax: Clojure writes it `(fn [x] (* x x x))`.

## Functions and procedures

:::definition[Mathematical function]
A **function** maps each value of its domain to exactly one value of its range. That is all it
does: given the same input, it produces the same output, and nothing else happens.
:::

What C, Java and Python call functions are, strictly, **procedures**: they may read and change
state outside themselves and do things besides returning a value.

:::definition[Side effect and pure function]
A **side effect** is anything a function does besides computing its result from its arguments:
changing a global or an argument, printing, reading input, writing a file. A **pure function**
has no side effects and depends only on its arguments, so a call can always be replaced by its
value. That property is called **referential transparency**.
:::

A C "function" that is not a function:

```sim
id: c-348-side-effects
custom: true
engine: c
code: |
  #include <stdio.h>

  int scale = 4;                 /* state outside the function */

  int calc(int x) {
      scale = scale * 2;         /* side effect: changes the global */
      return x * scale;
  }

  int pure_calc(int x, int s) {  /* depends on its arguments only */
      return x * s;
  }

  int main(void) {
      printf("%d\n", calc(10));
      printf("%d\n", calc(10));  /* same call, different answer */
      printf("%d %d\n", pure_calc(10, 8), pure_calc(10, 8));
      printf("%d\n", calc(1) - calc(1));   /* which call runs first? */
      return 0;
  }
note: 'calc(10) gives 80 and then 160: the result depends on hidden state, which each call changes. In the last line the answer depends on which of the two calls C evaluates first, and the C standard does not say. pure_calc(10, 8) is 80 every time, anywhere in the program.'
```

Side effects cause three problems:

1. **Hidden changes.** `scale` changes without its name appearing at the call site, so every other
   use of `scale` becomes hard to trust.
2. **No referential transparency.** `calc(10)` cannot be replaced by a value, so you cannot reason
   about it the way you reason about an equation.
3. **Order matters.** When calls change shared state, the order of evaluation changes the result;
   without side effects, independent calls can be evaluated in any order — or at the same time.

That last point is the practical motivation today: functions that do not share mutable state can
run on many cores at once without locks. Correctness is the other: pure code can be tested and
proved one function at a time.

## Functions as values

:::definition[First-class and higher-order functions]
A language has **first-class functions** when functions are values like any other: they can be
stored in variables and data structures, passed as arguments and returned as results. A
**higher-order function** takes a function as an argument or returns one.
:::

C can pass a pointer to a function, but only to a function already defined with a matching
prototype; it cannot create a new function at run time. The standard library's sort shows the
ceremony:

```c
void qsort(void *base, size_t n, size_t size, int (*compar)(const void *, const void *));
```

and the Unix `signal` function, which takes and returns a function pointer, is famous for being
unreadable:

```c
void (*signal(int sig, void (*handler)(int)))(int);
```

Python and Clojure need none of that: `sorted(words, key=len)`, `(sort-by count words)`.

### Composition

:::definition[Function composition]
The **composition** of $f$ and $g$ is the function $h = f \circ g$ with $h(x) = f(g(x))$: apply $g$,
then $f$. For $f(x) = x + 2$ and $g(x) = 3x$, $(f \circ g)(x) = 3x + 2$.
:::

Composition takes two functions and *returns a new function*, which is not the same as the C call
`f(g(2))`: there, `g(2)` is just evaluated first and its value passed on. Clojure's `comp` builds
the function itself:

```sim
id: clj-348-composition
custom: true
engine: clj
code: |
  (defn f [x] (+ x 2))
  (defn g [x] (* 3 x))
  (def h (comp f g))
  (h 5)
  (map h [0 1 2])
  ((comp str inc) 41)
note: 'h is a new function built from f and g, stored like any value. (h 5) evaluates (g 5) = 15, then (f 15) = 17. Step through and watch the frames for g and f appear inside the call to h.'
```

### Apply-to-all: map, filter and reduce

Because processing every element of a collection is so common, functional languages provide
higher-order functions that do the looping for you:

| Function | Takes | Gives |
|---|---|---|
| `map` | a function $f$ and a sequence | the sequence of $f$ applied to each element: $(f\,x_1, f\,x_2, \dots)$ |
| `filter` | a predicate $p$ and a sequence | the elements for which $p$ is true |
| `reduce` | a function of two arguments, (a start value,) a sequence | one value: $f(\dots f(f(x_1, x_2), x_3) \dots)$ |

```sim
id: clj-348-map-filter-reduce
custom: true
engine: clj
code: |
  (map (fn [x] (* x x)) [2 3 4])
  (filter odd? (range 10))
  (reduce + [1 2 3 4])
  (reduce + (map (fn [x] (* x x)) (filter odd? (range 10))))
  (reduce (fn [acc w] (assoc acc w (count w))) {} ["tea" "coffee"])
note: 'The fourth form is the whole pipeline: keep the odd numbers below 10, square them, add them up — no loop and no variable changes. Step inside reduce to see each call of + with the running total.'
```

The same pipeline in Python, once with a generator expression and once with `map` and `filter`:

```python
print(sum(x * x for x in range(10) if x % 2 == 1))
print(sum(map(lambda x: x * x, filter(lambda x: x % 2, range(10)))))
```

```output
165
165
```

## Recursion instead of loops

A loop needs a variable that changes. Without assignment, repetition is done by **recursion**: a
function that calls itself on a smaller problem until a base case. Functional languages rely on it,
and give ways to avoid writing it by hand (map, filter, reduce) and to make it cheap (tail calls,
which the next units show in Clojure as `recur`).

## Immutable data

Functional data structures are **immutable**: "adding" to a list returns a new list and leaves the
old one alone. That keeps global state from changing under anyone's feet, and makes sharing data
between threads safe. Copying a million-element list for every change would be hopeless, so the
new version *shares* almost all of its structure with the old one — the Clojure units show how.

## How pure is a language?

A **pure** functional language (Haskell) has no side effects in ordinary code at all; input and
output are handled through its type system. Most functional languages are **hybrids**: Lisp,
Clojure, Erlang, F# and Scala encourage pure functions and immutable data but allow side effects
where needed (printing, controlled mutable references). Imperative languages have gone the other
way: Java, Python, JavaScript and C++ all added lambdas, `map` and `filter`.

::::exercise[Pure or not?]
Which of these functions are pure? For the others, name the side effect or the hidden input.

```python
def area(r):
    return 3.14159 * r * r

def log_area(r):
    print("computing")
    return 3.14159 * r * r

total = 0
def add_to_total(x):
    global total
    total += x
    return total

def append_one(xs):
    xs.append(1)
    return xs

import random
def roll():
    return random.randint(1, 6)
```

:::solution
Only `area` is pure. `log_area` prints (a side effect, although its result is fine).
`add_to_total` changes a global and depends on it. `append_one` changes its argument, which the
caller can see. `roll` depends on hidden state (the random generator) and changes it: two calls
with the same (no) arguments give different results.
:::
::::

::::exercise[Compose and pipe]
Using only `map`, `filter` and `reduce` (and small anonymous functions), write a Clojure
expression for the sum of the cubes of the even numbers from 1 to 10. What is its value?

:::solution
```text
(reduce + (map (fn [x] (* x x x)) (filter even? (range 1 11))))
```

It keeps 2, 4, 6, 8, 10, cubes them (8, 64, 216, 512, 1000) and adds them: 1800.
:::
::::

:::insight
A mathematical function maps inputs to an output and does nothing else. Programs built from such
functions can be reasoned about like equations and run in any order or in parallel. Functional
languages supply the tools that make this practical: functions as values, composition, map /
filter / reduce, recursion and immutable data that shares structure.
:::

## Further reading

- [Functional programming](https://en.wikipedia.org/wiki/Functional_programming) — history, purity and the main languages.
- [Lambda calculus](https://en.wikipedia.org/wiki/Lambda_calculus) — the formal system behind it.
- [Clojure: higher-order functions](https://clojure.org/guides/higher_order_functions) — map, filter, reduce, comp and partial in Clojure.
- [Functional programming HOWTO (Python)](https://docs.python.org/3/howto/functional.html) — the same ideas in Python.
