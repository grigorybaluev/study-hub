---
title: "Clojure functions and programs: arity, closures, sequences, recursion and namespaces"
order: 15
status: detailed
weeks: [11]
introduces: []
requires:
  - {concept: functional-programming, strength: hard}
  - {concept: higher-order-function, strength: hard}
  - {concept: recursion, strength: hard}
reinforces:
  - {concept: higher-order-function, perspective: "Clojure: passing and returning functions, closures, the core sequence library"}
  - {concept: recursion, perspective: "Clojure: recursion as the only loop, and recur for constant stack space"}
  - {concept: modular-programming, perspective: "Clojure: namespaces, require, and private functions"}
---

Writing real Clojure: functions with documentation and several arities, functions passed in and
returned (closures), the core sequence functions and lazy sequences, recursion as the only way to
loop and `recur` to do it in constant stack space, and namespaces to organise a program.

## Functions in full

:::syntax[defn]
```clojure
(defn <name>
  "Docstring: one summary line, then details."
  [<params>]
  <body forms>)

(defn <name>
  ([<p1>] <body>)            ; one-argument version
  ([<p1> <p2>] <body>))      ; two-argument version
```

- The docstring is shown by `(doc <name>)` (in a program, after `(require '[clojure.repl :refer [doc]])`)
  and by documentation generators.
- A function's number of parameters is its **arity**. A function can have several arities; Clojure
  picks the one matching the number of arguments. Only the count matters, not the types (unlike
  Java's overloading).
- One arity can call another, which is how default values are written.
- `[a b & more]` collects any extra arguments into the sequence `more` (**variadic**).
:::

```sim
id: clj-348-arity
custom: true
engine: clj
code: |
  (defn greet
    "Returns a greeting; the name defaults to world."
    ([] (greet "world"))
    ([who] (str "hello, " who)))
  (greet)
  (greet "Ada")
  (defn total [& nums] (apply + nums))
  (total 1 2 3 4)
  (greet "Ada" "Grace")
note: 'The zero-argument arity calls the one-argument arity with a default. apply spreads a sequence into arguments: (apply + [1 2 3 4]) is (+ 1 2 3 4). The last call has no two-argument arity and fails with an ArityException.'
```

## Passing and returning functions

Functions are values, so they are passed without any special syntax: the receiving function just
calls its parameter. Small functions passed to others are usually anonymous, written with `fn` or
with the shorthand `#(…)`, in which `%` is the argument (`%1`, `%2`, … when there are several).

```clojure
(defn apply-twice [f x] (f (f x)))
(apply-twice #(* 2 %) 5)          ; 20
(map #(+ %1 %2) [1 2 3] [10 20 30]) ; (11 22 33)
```

### Closures

A function can also *return* a function, usually an anonymous one written as the last form of its
body. The returned function remembers the variables that were in scope where it was created.

:::definition[Closure]
A **closure** is a function together with the bindings of the variables it uses from the scope
where it was defined. Each call to the outer function creates a new closure with its own values.
:::

```sim
id: clj-348-closures
custom: true
engine: clj
code: |
  (defn make-account [balance]
    (fn [amount] (+ balance amount)))
  (def ada (make-account 100))
  (def bob (make-account 5))
  (ada 50)
  (bob 50)
  (defn multiplier [k] #(* k %))
  (map (multiplier 3) [1 2 3])
note: 'make-account returns a new function each time, and each remembers its own balance: ada adds to 100, bob to 5. Step into (ada 50): the frame shows amount = 50, and balance comes from the closure.'
```

Clojure has no objects in the Java sense, and closures play part of their role: a closure is a
function with private data fixed at creation, as a method is code with an object's fields.

## The core sequence functions

Clojure's standard library works on **sequences**: lists, vectors, maps, sets, strings and lazy
sequences all present themselves as a sequence of elements.

| Function | Example | Value |
|---|---|---|
| `first`, `rest`, `last` | `(rest [4 6 2 1])` | `(6 2 1)` |
| `cons` | `(cons 3 [4 2])` | `(3 4 2)` |
| `take`, `drop` | `(take 2 [4 3 6 7])` | `(4 3)` |
| `take-while`, `drop-while` | `(take-while even? [2 4 5 6])` | `(2 4)` |
| `some` | `(some even? [3 4 5])` | `true` (the first truthy result), or `nil` |
| `concat` | `(concat [1 6] '(23 24))` | `(1 6 23 24)` |
| `sort`, `sort-by` | `(sort #(> %1 %2) [3 1 4])` | `(4 3 1)` |
| `into` | `(into [] '(1 2 3))` | `[1 2 3]` |
| `map`, `filter`, `reduce` | `(reduce + (map inc [1 2 3]))` | `9` |
| `frequencies`, `group-by` | `(frequencies "abca")` | `{\a 2, \b 1, \c 1}` |

`(vector '(1 2 3))` makes a vector with *one* element, the list; `into` pours the elements of one
collection into another.

### Lazy sequences

Many sequence functions (`map`, `filter`, `range`, `take`, `iterate`) return **lazy** sequences:
nothing is computed until an element is needed, and then only as much as needed. That is why
`(first (range 1000000))` answers instantly while `(last (range 1000000))` walks the whole range,
and why infinite sequences are possible: `(iterate #(* 2 %) 1)` is every power of two, of which
`take` asks for a few.

```sim
id: clj-348-lazy
custom: true
engine: clj
code: |
  (def powers (iterate #(* 2 %) 1))
  (take 6 powers)
  (first (range 1000000))
  (take-while #(< % 100) (map #(* % %) (range)))
  (take 3 (filter even? (map inc (range))))
note: 'powers is infinite, but defining it costs nothing: the Evaluation panel shows it as (… ) until elements are taken. (range) with no arguments counts forever; take and take-while stop the pipeline after the elements they need.'
```

## Recursion and recur

Clojure has no `for` or `while` loop that changes a variable. Repetition is recursion: a function
calls itself on a smaller problem, a base case stops it, and the results are combined as the calls
return. Nothing is shared between the calls except their arguments and return values.

```sim
id: clj-348-recursion
custom: true
engine: clj
code: |
  (defn my-count [xs]
    (if (empty? xs)
      0
      (inc (my-count (rest xs)))))
  (my-count [:a :b :c :d])
  (defn total [items]
    (loop [xs items acc 0]
      (if (empty? xs)
        acc
        (recur (rest xs) (+ acc (first xs))))))
  (total [1 2 3 4 5])
note: 'my-count is ordinary recursion: the frames stack up four deep before the base case returns 0, and each inc runs on the way back. total uses loop/recur: recur jumps back to loop with new values, so there is only ever one frame, and the accumulator acc plays the role of C''s running sum.'
```

Each ordinary recursive call takes a stack frame, so deep recursion ends in a `StackOverflowError`
— with the JVM's default stack, after a few thousand calls. The JVM does not optimise tail calls, so Clojure provides
**`recur`**: when the recursive call is the last thing a function (or a `loop`) does — a **tail
call** — `recur` jumps back to the start with new arguments, like a `while` loop, in constant stack
space. `recur` must be in tail position; the compiler rejects it anywhere else.

A value that a loop would initialise once and then update (a running total) becomes an extra
parameter: `loop` sets it up, `recur` passes the updated value, or a second arity of the function
supplies the starting value.

## Programs: namespaces and libraries

Clojure code is organised into **namespaces**, like Java packages. A file starts with `ns`; the
namespace `myproj.core` lives in `myproj/core.clj`. The REPL starts in the namespace `user`.

:::syntax[ns and require]
```clojure
(ns myproj.report
  (:require [clojure.string :as str]           ; str/join, str/upper-case
            [myproj.stats :refer [mean]])      ; mean usable without a prefix
  (:import java.util.Date))                    ; a Java class
```

- A library is loaded once, however many namespaces require it (no header guards needed).
- Functions are called with the namespace (or alias) and a slash: `(str/upper-case "a")`.
- Everything is public by default. `defn-` (or `^:private`) makes a function private to its
  namespace.
- Java classes are used directly: `(Date.)` creates an object, `(.getTime (Date.))` calls a method,
  `(Math/sqrt 2)` calls a static method.
- Real projects are built with Leiningen or the Clojure CLI (`deps.edn`), which manage the class path.
:::

```sim
id: clj-348-namespaces
custom: true
engine: clj
code: |
  (ns report.core
    (:require [clojure.string :as str]))
  (defn- shout [s] (str (str/upper-case s) "!"))
  (defn headline [words]
    (shout (str/join " " words)))
  (headline ["clojure" "is" "a" "lisp"])
  (str/trim "   padded   ")
note: 'After the ns form the current namespace is report.core, so the defs print as #''report.core/…. shout is private: another namespace could call headline but not shout.'
```

::::exercise[What does the REPL print?]
```clojure
(defn step ([n] (step n 0)) ([n acc] (if (zero? n) acc (recur (dec n) (+ acc n)))))
(step 4)
(def inc-all (partial map inc))
(inc-all [1 2 3])
(let [f (fn [k] #(+ % k)) g (f 10)] (g 5))
(reduce (fn [m w] (assoc m w (count w))) {} ["ab" "c"])
```

:::solution
```text
#'user/step
10
#'user/inc-all
(2 3 4)
15
{"ab" 2, "c" 1}
```

`(step 4)` uses the second arity with `acc` 0 and adds 4 + 3 + 2 + 1. `partial` fixes the first
argument of `map`. `(f 10)` returns a closure that adds 10, so `(g 5)` is 15. The `reduce` builds a
map from each word to its length.
:::
::::

:::insight
Clojure programs are built from small functions: several arities for defaults, functions passed and
returned freely, closures holding private data. The sequence library and lazy sequences replace
most loops; the rest are recursion, with `recur` when the call is in tail position. Namespaces
group the functions, and `defn-` keeps helpers private.
:::

## Further reading

- [Clojure: learn — functions](https://clojure.org/guides/learn/functions) — arity, variadic functions, anonymous functions and apply.
- [Clojure: sequences](https://clojure.org/reference/sequences) — the seq abstraction, laziness and the core functions.
- [Clojure: namespaces](https://clojure.org/reference/namespaces) — ns, require, refer and aliases.
- [ClojureDocs](https://clojuredocs.org/) — every core function with community examples.
