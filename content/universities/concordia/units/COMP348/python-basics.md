---
title: "Python basics: dynamic types, strings, lists and what they cost"
order: 8
status: detailed
weeks: [4]
introduces: [python-programming, dynamic-typing]
requires:
  - {concept: variables-and-expressions, strength: hard}
  - {concept: language-implementation, strength: soft}
reinforces:
  - {concept: string, perspective: "Python: immutable str, negative indices and slicing"}
  - {concept: algorithm-analysis, perspective: "what list operations cost when a list is a dynamic array of references"}
---

A second language after C: Python's design goals, values that carry their own types, names that
are references to objects, strings and slicing, lists that grow, and what each list operation
costs once you know how lists are built.

## What Python is

Python is a high-level, general-purpose language first released in 1991 by Guido van Rossum. It
is **interpreted** in the hybrid sense of the first unit: the interpreter (usually CPython,
written in C) compiles each file to bytecode and runs the bytecode. Python 3 (2008) broke
compatibility with Python 2 (whose `print "x"` is now `print("x")`); only Python 3 is used today.

Python's design goals are written down as the *Zen of Python* (type `import this` in the
interpreter to read it). Its main points: readable code matters more than short code; explicit is
better than implicit; simple beats complex; there should be one obvious way to do a thing; errors
should not pass silently. What that means in practice:

- **Indentation is syntax.** Blocks are marked by indentation, not braces, so every program is
  laid out the same way.
- **No declarations.** A variable is created by assigning to it; types are not written.
- **Garbage collection.** Memory is managed for you (the subject of a later unit).
- **Everything is an object**, including numbers, functions and classes.
- A large standard library: "batteries included".

The interactive interpreter (type `python3` in a terminal; leave with `quit()` or Ctrl-D) reads
one statement at a time and prints the value of each expression, which makes it the quickest
way to try things.

## Names, objects and dynamic typing

:::definition[Dynamic typing]
In a **dynamically typed** language, types belong to **values**, not to variables, and are
checked when an operation runs. A variable can hold a value of one type and later a value of
another. In a **statically typed** language (C, Java), each variable has a declared type and the
compiler checks operations before the program runs.
:::

In Python, a variable is a **name bound to an object**. Assignment never copies an object; it
makes the name refer to it. `type(x)` gives the type of the object `x` refers to.

```python
x = 26          # x refers to an int object
print(type(x))
x = "twenty-six"   # now x refers to a str object; the int is unaffected
print(type(x))
y = [1, 2]
z = y           # z and y now refer to the same list
z.append(3)
print(y)
```

```output
<class 'int'>
<class 'str'>
[1, 2, 3]
```

```sim
id: py-348-names
custom: true
engine: py
code: |
  x = 26
  x = "twenty-six"
  y = [1, 2]
  z = y
  z.append(3)
  w = y[:]
  w.append(4)
  print(y, z, w)
  print(y is z, y is w, y == z)
note: 'Watch the arrows. z = y adds a second arrow to the same list (refs 2), so the append through z shows up in y. y[:] builds a new list; w changes alone. is asks whether two names refer to the same object; == asks whether the values are equal.'
```

**Duck typing** follows from this: a function works with any object that supports the operations
it uses ("if it walks like a duck and quacks like a duck, it is a duck"). `len(x)` works for
strings, lists, dicts and any class that defines `__len__`; no interface has to be declared.
The price is that a type error is found only when the line runs:

```python
def total(items):
    return sum(items)

print(total([1, 2, 3]), total((4, 5)), total({6, 7}))
print(total("abc"))     # fails only now, when sum meets a str
```

```output
6 9 13
Traceback (most recent call last):
  File "main.py", line 5, in <module>
    print(total("abc"))     # fails only now, when sum meets a str
          ^^^^^^^^^^^^
  File "main.py", line 2, in total
    return sum(items)
           ^^^^^^^^^^
TypeError: unsupported operand type(s) for +: 'int' and 'str'
```

## Numbers

Python has `int` and `float` and no type keywords: `n = 26`, `r = 768.56`.

- An **`int` has no size limit.** CPython stores every int as an array of 30-bit digits, as long as
  the number needs, and does its arithmetic in software (slower than C, but never overflowing).
  `2 ** 100` is exact. The small ints from −5 to 256 are created once and shared.
- A **`float` is a C `double`**: 64 bits, about 16 significant digits, with the usual rounding
  (`0.1 + 0.2` prints `0.30000000000000004`).
- `/` always gives a `float` (`7 / 2` is `3.5`); `//` is floor division (`-7 // 2` is `-4`, not
  C's `-3`) and `%` takes the sign of the divisor.
- `True` and `False` are the integers 1 and 0 in disguise: `True + True == 2`.

```python
print(2 ** 100)
print(7 / 2, 7 // 2, -7 // 2, -7 % 3)
print(0.1 + 0.2, round(2.675, 2), 10 / 5)
```

```output
1267650600228229401496703205376
3.5 3 -4 2
0.30000000000000004 2.67 2.0
```

(`round(2.675, 2)` gives 2.67 because 2.675 is stored as 2.67499999…; the same trap as in C.)

## Strings

After C's character arrays, Python's strings are simple. A `str` is an immutable sequence of
Unicode characters, written in single or double quotes (no difference), with the usual escape
sequences (`\n`, `\t`, `\\`).

| Form | Meaning |
|---|---|
| `'dog'`, `"dog"` | the same string |
| `r"C:\new"` | a **raw** string: backslashes are ordinary characters (for paths and regular expressions) |
| `"""…"""` | a multi-line string; the line breaks are part of it |
| `f"{name} is {age}"` | an **f-string**: expressions in braces are evaluated and inserted, with an optional format such as `{price:.2f}` |
| `a + b`, `a * 3` | concatenation, repetition |
| `len(s)`, `c in s` | length, substring test |

### Indexing and slicing

Strings (and lists, and tuples) are **sequences**: `s[i]` is the character at index `i`,
counting from 0, and a negative index counts from the end: `s[-1]` is the last character.
Unlike C, Python checks indices: `s[99]` raises `IndexError`.

:::syntax[Slice]
```python
<sequence>[<start>:<stop>:<step>]
```

- The slice runs from `start` **included** to `stop` **excluded**, so `s[2:4]` is `s[2]` and
  `s[3]`, and its length is `stop − start`.
- An omitted `start` means the beginning, an omitted `stop` the end; `s[:]` is a copy of the
  whole sequence.
- Negative values count from the end; out-of-range values are clipped, never an error.
- `step` takes every `step`-th element; a negative step goes backwards (`s[::-1]` reverses).
:::

```sim
id: py-348-slicing
custom: true
engine: py
code: |
  s = "bigdog"
  print(s[1], s[-2])
  print(s[2:4], s[2:], s[:4], s[-2:])
  print(s[2:-2], s[2:2], s[2:44])
  print(s[::2], s[::-1])
  t = s[:2] + "G" + s[3:]   # strings are immutable: build a new one
  print(s, t)
  s[2] = "G"                # TypeError
note: 'Predict each line before stepping. s[2:44] is not an error: slices clip to the string. The last line fails because a str cannot be changed in place; t shows the way to get a changed copy.'
```

Common string methods return new strings: `upper()`, `lower()`, `strip()`, `replace(a, b)`,
`split(sep)`, `sep.join(list)`, `find(sub)`, `startswith(p)`, `count(sub)`.

## Lists

:::definition[List]
A **list** is a mutable sequence of references to objects of any types, written
`[4, 6, 7, 99]`. It supports indexing and slicing like a string, and can also be changed in
place.
:::

```python
mixed = [4, 93, "bigdog", 2]          # no generics: any mix of types
nested = [1, 2, 8, ["foo", "boo"], [12, 9]]
nested[4] = 16                        # replace one element
nested[1:3] = ["do", "not"]           # replace a slice
print(nested)
```

```output
[1, 'do', 'not', ['foo', 'boo'], 16]
```

| Method | Does |
|---|---|
| `lst.append(x)` | add `x` at the end |
| `lst.extend(other)` | add every element of `other` at the end |
| `lst.insert(i, x)` | insert `x` before position `i` |
| `lst.remove(x)` | remove the first element equal to `x` (`ValueError` if none) |
| `lst.pop()`, `lst.pop(i)` | remove and return the last element, or element `i` |
| `lst.index(x)`, `lst.count(x)` | position of the first `x`; number of `x` |
| `lst.sort()`, `lst.reverse()` | reorder in place (and return `None`) |
| `sorted(lst)`, `lst[::-1]` | a new sorted list; a new reversed list |

:::caution
`sort()` and `reverse()` change the list and return `None`, so `lst = lst.sort()` loses the list.
And `[[0] * 3] * 2` builds a list holding the *same* inner list twice: changing one row changes
both. Build rows separately: `[[0] * 3 for _ in range(2)]`.
:::

```sim
id: py-348-list-aliasing
custom: true
engine: py
code: |
  grid = [[0] * 3] * 2
  grid[0][0] = 5
  print(grid)
  rows = [[0] * 3 for _ in range(2)]
  rows[0][0] = 5
  print(rows)
note: 'grid is a list of two arrows to one inner list, so changing grid[0] also changes grid[1]. The comprehension runs [0] * 3 twice and builds two inner lists.'
```

## How lists are built, and what operations cost

A Python list is not a linked list. CPython stores it as a **dynamic array of pointers**: one
contiguous block of references, each pointing at an element object somewhere on the heap. That
explains every cost:

| Operation | Cost | Why |
|---|---|---|
| `lst[i]`, `lst[i] = x` | $O(1)$ | compute the address of slot `i` |
| `lst.append(x)` | $O(1)$ amortized | usually a free slot is waiting at the end; when the block is full, a larger one is allocated and every pointer copied ($O(n)$), but that happens rarely |
| `lst.insert(0, x)`, `lst.pop(0)` | $O(n)$ | every pointer after the position moves by one |
| `x in lst` | $O(n)$ | a scan from the start |

The block grows by a fraction of its size (about 1/8 in CPython) plus a little, not one slot at
a time, so $n$ appends cause only $O(\log n)$ reallocations and cost $O(n)$ in total. Building a
list by inserting at the front instead costs $1 + 2 + \dots + n = O(n^2)$: for a million
elements, about $5 \times 10^{11}$ pointer moves.

```sim
id: py-348-list-costs
controls:
  - {id: n, label: "number of elements added", min: 1000, max: 100000, step: 1000, default: 20000, decimals: 0}
note: 'The top panel counts the pointer copies of each append: nearly all cost 1, with rare spikes when the array is full and moves to a larger block. The bottom panel is the total work to build the list: appends grow linearly, inserts at the front quadratically. Double n and see how each total changes.'
```

```python
# the same count in Python: pointer moves when building a list of n elements
def append_cost(n):
    allocated, size, moves = 0, 0, 0
    for _ in range(n):
        if size == allocated:                                  # full: move to a bigger block
            moves += size
            m = size + 1
            allocated = (m + (m >> 3) + 6) & ~3               # CPython 3.11's growth rule
        moves += 1; size += 1
    return moves

def insert_front_cost(n):
    return sum(k + 1 for k in range(n))                        # shift k pointers, write one

for n in (1_000, 10_000, 100_000):
    print(n, append_cost(n), insert_front_cost(n))
```

None of this means `insert` is wrong; on small lists nobody can measure the difference. It means
that when a program slows down sharply as its input grows, the cause is often an operation that
is linear in disguise.

::::exercise[What does this print?]
```python
a = [1, 2, 3]
b = a
a = a + [4]
b.append(5)
c = "hello"
d = c.upper()
print(a, b, c, d, c[-3:], c[1:4:2])
```

:::solution
```text
[1, 2, 3, 4] [1, 2, 3, 5] hello HELLO llo el
```

`a + [4]` builds a *new* list and rebinds `a` to it, so `b` still refers to the original list,
which then gets the 5. `upper()` returns a new string; `c` is unchanged. `c[-3:]` is the last
three characters, and `c[1:4:2]` takes indices 1 and 3.
:::
::::

::::exercise[Which is faster, and by how much?]
Two ways to reverse a list of `n` items into a new list: (A) `out = []` then
`for x in data: out.insert(0, x)`; (B) `out = []` then `for x in reversed(data): out.append(x)`.
How does the running time of each grow with `n`?

:::solution
(A) is $O(n^2)$: each `insert(0, x)` shifts every pointer already in `out`, so the total is
$1 + 2 + \dots + n$. (B) is $O(n)$: each append is $O(1)$ amortized. For $n = 100\,000$, (A)
does about 5 billion pointer moves and (B) about 900 000 (100 000 writes plus the copies at each resize, about 9 per append on average). `data[::-1]` does
the same as (B) in one step.
:::
::::

:::insight
In Python every value is an object and every variable is a reference to one: assignment shares,
slicing copies, and `is` tests sharing. Types are checked on the values as the program runs. A
list is an array of references, so indexing and appending are cheap, and inserting or removing
anywhere but the end is linear.
:::

## Further reading

- [The Python Tutorial: an informal introduction](https://docs.python.org/3/tutorial/introduction.html) — numbers, strings and lists at the interpreter prompt.
- [Python data model: objects, values and types](https://docs.python.org/3/reference/datamodel.html#objects-values-and-types) — identity, type and value; mutable and immutable.
- [Time complexity of CPython operations](https://wiki.python.org/moin/TimeComplexity) — the cost of every list, deque, dict and set operation.
- [PEP 20: The Zen of Python](https://peps.python.org/pep-0020/) — the design principles in full.
