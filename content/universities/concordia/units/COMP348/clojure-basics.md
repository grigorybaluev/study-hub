---
title: "Clojure basics: forms, the REPL, truthiness, and persistent data structures"
order: 14
status: detailed
weeks: [11]
introduces: []
requires:
  - {concept: functional-programming, strength: hard}
  - {concept: collections, strength: soft}
reinforces:
  - {concept: functional-programming, perspective: "Clojure: a Lisp on the JVM, where every form returns a value and data never changes"}
  - {concept: dictionary, perspective: "Clojure maps: keywords as keys, and immutable updates"}
  - {concept: tree, perspective: "persistent vectors: an index tree whose updates copy one path"}
---

Clojure as a modern Lisp: code made of forms in prefix notation, the REPL, values of every
expression including `if` and `println`, truthy and falsey values, and the four persistent data
structures — maps, vectors, lists and sets — that never change and still update cheaply.

## A Lisp on the JVM

Clojure (Rich Hickey, 2007) is a modern dialect of Lisp: its syntax is Lisp's cleaned up, with
vectors, maps and sets added as literals. It compiles to Java bytecode and runs on the Java
Virtual Machine, so it inherits the JVM's portability, speed and libraries (any Java class can be
used from Clojure). And like functional languages in general, it was designed for concurrency on
multi-core machines, with immutable data and a small set of safe ways to share state.

## Forms and prefix notation

:::definition[Form]
A Clojure program is a sequence of **forms** (expressions). A form is either a literal value
(`42`, `"text"`, `:key`), a symbol (`x`, `+`), or a list in parentheses whose **first element is
the operation** and whose remaining elements are its arguments: `(+ 2 2)`.
:::

- Operations are **prefix**: `(+ 2 2)`, not `2 + 2`, and `+` is an ordinary function, so it takes
  any number of arguments: `(+ 1 2 3 4)`.
- Elements are separated by whitespace. **Commas are whitespace too**: `{:a 1, :b 2}` is the same
  as `{:a 1 :b 2}`, and people add them only for readability.
- Nested forms are evaluated from the inside out: each inner form is replaced by its value, and
  the value is passed to the form around it.
- Comments start with `;`.

To write $3 + 2 \cdot 4 - 1$: `(- (+ 3 (* 2 4)) 1)`. The inner `(* 2 4)` becomes 8, then `(+ 3 8)`
becomes 11, then `(- 11 1)` gives 10.

```sim
id: clj-348-prefix
custom: true
engine: clj
code: |
  (- (+ 3 (* 2 4)) 1)
  (+ 1 2 3 4)
  (/ 10 4)
  (/ 10 4.0)
  (= 1 1)
  (not (= 2 1))
note: 'Step through the first form and watch each inner form turn into its value. (/ 10 4) is the exact ratio 5/2, not 2 or 2.5: dividing integers that do not divide evenly gives a ratio.'
```

### The REPL

The **REPL** (read–eval–print loop) reads one form, evaluates it, prints its value and waits for
the next. It is the normal way to explore Clojure: `clj` (or `lein repl`) starts one. The value
the REPL prints is *not* output the program produced: it is just the REPL showing you the result.

### Every form has a value

Every Clojure expression returns a value, including those that other languages treat as
statements. A function returns the value of the last form in its body; there is no `return`.

- `(println "hi")` prints `hi` and returns `nil`, the value "nothing" (like `null`).
- `(def x 42)` binds the name `x` in the current namespace and returns the var `#'user/x`.
- `(if test then else)` returns the value of the branch it took, or `nil` if the test is false
  and there is no else.

### Basic types

Integers are 64-bit `long`s (overflow is an error, not a wrap-around), floating-point numbers are
`double`s, integer division that does not come out even gives a **ratio**, strings are Java
strings in double quotes, characters are written `\a`, `true` and `false` are booleans, and `nil` is
nothing. Types are never declared; they are the types of the values.

## Names and functions

`(def name value)` binds a name to a value in the current namespace. It looks like a variable, but
a Clojure program does not change it afterwards: it is a label for a value.

:::syntax[fn and defn]
```clojure
(fn [<params>] <body>)          ; an anonymous function
(def <name> (fn [<params>] <body>))
(defn <name> [<params>] <body>)  ; the same, in one step
```

- The body is one or more forms; the function returns the value of the last one.
- An anonymous function is called by putting it first in a list: `((fn [] "hello"))`.
:::

```clojure
(defn hello [] "hello world")
(defn cube [x] (* x x x))
```

## Choosing: if, do and when

:::syntax[if, do, when]
```clojure
(if <test> <then> <else>)      ; <else> is optional: nil when missing
(do <form> <form> … <form>)    ; runs the forms in order, returns the last value
(when <test> <form> … <form>)  ; an if with an implied do and no else
```

- `if` takes exactly one form per branch. To do several things in a branch, wrap them in `do`.
- `when` returns `nil` when the test is false.
:::

### Truthy and falsey

In a test, **only `nil` and `false` are false** ("falsey"). Everything else is true ("truthy"),
including `0`, the empty string and the empty list. Because every form has a value, even forms
that print can appear in a test:

```sim
id: clj-348-truthy
custom: true
engine: clj
code: |
  (if (> 5 0) "positive" "negative")
  (if (< 5 0) "negative")
  (if (> 5 0) (do (println "looks good") "positive") (do (println "looks bad") "negative"))
  (when (> 5 0) (println "looks good") "positive")
  (if (if (println "boo") "woo") "truthy" "falsey")
  (if 0 "0 is truthy" "0 is falsey")
note: 'The fifth form is a puzzle. The inner if tests (println "boo"), which prints boo and returns nil — falsey — so the inner if returns nil, and the outer if takes its else branch: "falsey". The last line shows that 0 is truthy, unlike in C.'
```

## Data structures

Clojure has four built-in collection types, each with a literal syntax:

| Type | Literal | Like |
|---|---|---|
| map | `{:john "professor" :sue "doctor"}` | Python's dict |
| vector | `[1 2 3]` | Python's list (indexed) |
| list | `'(1 2 3)` | a linked list |
| set | `#{1 2 3}` | Python's set |

### Maps and keywords

Keys of a map can be anything, but are usually **keywords**: names that start with a colon,
`:john`. A keyword is a constant that stands for itself (faster to compare than a string). Maps
can hold any values, including functions and other maps.

```sim
id: clj-348-maps
custom: true
engine: clj
code: |
  (def jobs {:john "professor" :sue "doctor" :ahmed "astronaut"})
  (get jobs :sue)
  (get jobs :Sue)
  (get jobs :bill "not found")
  (:john jobs)
  (def nested {:a "eh" :b {:dog "fido" :cat "fluffy"}})
  (get-in nested [:b :cat])
  (def actions {:greet (fn [] (println "hello")) :part (fn [] (println "bye"))})
  ((get actions :greet))
  (keys jobs)
note: 'get returns nil for a missing key (keywords are case-sensitive) unless you give a default. A keyword is also a function that looks itself up: (:john jobs). The map of functions is a dispatch table: (get actions :greet) returns a function, and the outer parentheses call it.'
```

### Vectors and lists

A **vector** `[1 2 3]` is an indexed sequence: `(get v 0)` is the first element, and `get` returns
`nil` past the end. A **list** `(1 2 3)` must be **quoted** when written as data, `'(1 2 3)`,
because an unquoted list is a form to evaluate: `(1 2 3)` tries to call `1` as a function. The
quote says "do not evaluate this". That is Lisp's **code as data**: a program is itself made of
lists, and `'(+ 2 2)` is a list of a symbol and two numbers.

Lists have no indexing: `get` does not work on them, and `nth` walks the list, which takes time
proportional to the index. A vector finds any element in (almost) constant time.

### Sets

A set `#{1 2 "dog"}` holds distinct values; the `#` distinguishes it from a map. `(set coll)`
builds one from any collection and drops duplicates. `get`, a keyword used as a function, and
`contains?` test membership. Sets and large maps print in the order of their internal hash
table, not in the order you wrote them.

## Immutability

Clojure's data structures never change. Functions that "modify" one return a **new** structure and
leave the original as it was: `conj` adds an element (at the front of a list, where that is cheap,
and at the end of a vector), `assoc` sets a key or an index, `dissoc` removes a key.

```sim
id: clj-348-immutable
custom: true
engine: clj
code: |
  (def foo1 '(1 2 3))
  (conj foo1 0)
  foo1
  (def foo2 (conj foo1 0))
  foo2
  (conj [1 2 3] 4)
  (def v [1 2 3])
  (assoc v 1 "dog")
  v
  (assoc {:a 1} :b 2)
note: 'Every REPL line after conj or assoc shows the original unchanged: foo1 is still (1 2 3), v is still [1 2 3]. To keep a new version you give it a name of its own (foo2).'
```

### How new versions stay cheap

Copying a whole collection on every change would waste memory and time. Clojure's structures are
**persistent**: a new version shares almost everything with the old one. A vector is stored as a
tree whose leaves hold the elements; to change element $i$, Clojure copies only the nodes on the
path from the root to the leaf holding $i$ and points the copies at the unchanged subtrees. The
old root still sees the old version, the new root the new one.

```sim
id: ds-348-persistent-vector
custom: true
engine: ds
mode: persistent-vector
data: [1, 2, 3, 4, 5, 6, 7, 8]
ops: ["get 5", "assoc 2 9"]
note: 'A miniature with two elements per leaf and two children per node. get 5 follows the path from the root. assoc 2 9 copies three nodes (blue) and shares the other four with v0, which still holds 3 at index 2. Try assoc on another index, or conj.'
```

A path in a balanced tree has length $\log_b n$ for $b$ children per node. Clojure uses $b = 32$,
so even a vector of a billion elements is only 6 levels deep: an update copies at most 6 small
nodes, and a lookup follows at most 6 pointers — not quite the $O(1)$ of an array, but close.

::::exercise[What does the REPL print?]
```clojure
(def xs [10 20 30])
(def ys (conj xs 40))
(def m {:a 1 :b 2})
(assoc m :a (get ys 3))
[xs (count ys) (:a m) (if (get m :c) "yes" "no")]
```

:::solution
```text
#'user/xs
#'user/ys
#'user/m
{:a 40, :b 2}
[[10 20 30] 4 1 "no"]
```

Each `def` prints its var. `(get ys 3)` is 40, so `assoc` returns a new map with `:a` 40 — but
`m` is unchanged, so `(:a m)` is still 1. `xs` is unchanged by `conj`. `(get m :c)` is `nil`,
which is falsey.
:::
::::

:::insight
Clojure code is data: lists whose first element is the operation. Every form has a value, only
`nil` and `false` are falsey, and collections never change — updates return new versions that
share almost all of their structure with the old ones, which is what makes immutability affordable.
:::

## Further reading

- [Clojure: learn — syntax](https://clojure.org/guides/learn/syntax) — literals, forms and evaluation.
- [Clojure: data structures](https://clojure.org/reference/data_structures) — maps, vectors, lists, sets and their performance.
- [Understanding Clojure's persistent vectors](https://hypirion.com/musings/understanding-persistent-vector-pt-1) — the 32-way tree in detail.
