---
title: "Python programs: control flow, functions, scope and modules"
order: 10
status: detailed
weeks: [6]
introduces: []
requires:
  - {concept: python-programming, strength: hard}
  - {concept: function-definition, strength: hard}
  - {concept: scope, strength: hard}
  - {concept: modular-programming, strength: soft}
reinforces:
  - {concept: scope, perspective: "Python: local, enclosing, global and built-in names; global and nonlocal"}
  - {concept: parameter-passing, perspective: "Python: every argument is a reference to an object"}
  - {concept: modular-programming, perspective: "Python: modules imported at run time, namespaces, packages"}
---

How a Python program is put together: blocks by indentation, loops and conditions, functions
with default and keyword arguments, how names are looked up, and modules — imported and run at
run time, each with its own namespace — and packages of modules.

## Blocks by indentation

A Python block is the set of lines indented under a header that ends in a colon. There are no
braces; the block ends where the indentation ends. Four spaces per level is the convention, and
tabs and spaces must not be mixed in one file.

Besides making every program look the same, indentation removes a classic C bug: adding a second
statement under an `if` without braces.

```c
if (total > 100)
    discount = 5;
    shipping = 0;      /* looks conditional, always runs */
```

In Python the layout *is* the structure, so what you see is what runs.

## Control flow

```python
x = 15
if x < 0:
    print("negative")
elif x < 10:
    print("small")
else:
    print("large")

n = 10
while n > 1:           # no parentheses needed around the condition
    n = n // 2
print(n)

for animal in ["cat", "dog"]:    # for walks any sequence or iterable
    print("Animal is", animal)
for k in range(4, 20, 5):        # range(start, stop, step): stop excluded
    print(k, end=" ")
print()
```

```output
large
1
Animal is cat
Animal is dog
4 9 14 19 
```

- There is no C-style `for (i = 0; …)`: `for k in range(n)` counts, and `for x in items` walks
  the items directly. `enumerate(items)` gives `(index, item)` pairs; `zip(a, b)` pairs two
  sequences.
- `break` and `continue` work as in C. A loop can have an `else` block, which runs when the loop
  ends *without* `break`: useful for searches.
- There is no `switch` in older Python; use `if`/`elif` chains (Python 3.10 added `match`).

### Truth values and boolean operators

`False`, `None`, `0`, `0.0`, `""`, and empty containers are **falsy**; everything else is
**truthy**. `not` binds tighter than `and`, which binds tighter than `or`. `and` and `or`
**short-circuit** and return one of their operands, not necessarily `True`/`False`:
`name or "anonymous"` gives `name` if it is non-empty and `"anonymous"` otherwise. `None` is
Python's "no value", tested with `is None`. Comparisons chain: `0 < x < 10`.

## Functions

:::syntax[def]
```python
def <name>(<param>, <param>=<default>, *<args>, <kwonly>=<default>, **<kwargs>):
    """Optional docstring: the first string in the body."""
    <body>
    return <expression>
```

- No parameter or return types; any value can be passed and returned.
- A function without `return` (or with a bare `return`) returns `None`.
- `*args` collects extra positional arguments into a tuple, `**kwargs` extra keyword arguments
  into a dict; parameters after `*args` can only be passed by keyword.
- `help(f)` shows the docstring.
:::

A call can pass arguments by position or by name: `foo(3, thing=7)`. Positional arguments come
first; then keyword arguments, in any order. A parameter with a default can be left out; once a
parameter has a default, every positional parameter after it needs one too
(`def f(n, x=2, m)` is a syntax error: `f(3, 4)` could not tell `x` from `m`).

```sim
id: py-348-arguments
custom: true
engine: py
code: |
  def order(item, qty=1, *extras, gift=False, **notes):
      print(item, qty, extras, gift, notes)

  order("tea")
  order("tea", 3)
  order("cake", 2, "candles", "card", gift=True)
  order(qty=5, item="scones", note="warm")
  order("tea", item="coffee")
note: 'Match each call to the parameters before stepping. The last call gives item two values, by position and by name, and stops with TypeError.'
```

### Passing arguments: references to objects

Every Python argument is a reference to an object, passed by value: the parameter becomes a
new name for the caller's object. So a function can **change a mutable argument** (append to a
list, set a key in a dict) and the caller sees it, but **rebinding** the parameter to a new
object changes nothing for the caller. This is the same rule as Java's for object references, and
as C's for a pointer passed to a function.

```sim
id: py-348-pass-reference
custom: true
engine: py
code: |
  def add_bonus(scores):
      scores.append(10)          # changes the caller's list

  def reset(scores):
      scores = []                # rebinds the local name only

  def bump(n):
      n = n + 1                  # ints are immutable: a new int
      return n

  marks = [70, 85]
  add_bonus(marks)
  reset(marks)
  count = 5
  bump(count)
  print(marks, count, bump(count))
note: 'In add_bonus the parameter scores is a second arrow to marks'' list. In reset, scores = [] points that arrow at a new list, which disappears when the function returns. An int cannot be changed, so bump can only return a new one.'
```

### Default values are evaluated once

A default is computed once, when `def` runs, and the same object is reused on every call. With
a mutable default this surprises everyone once:

```sim
id: py-348-mutable-default
custom: true
engine: py
code: |
  def append_to(item, bucket=[]):
      bucket.append(item)
      return bucket

  print(append_to(1))
  print(append_to(2))      # the same list as the first call!

  def append_safe(item, bucket=None):
      if bucket is None:
          bucket = []          # a new list on every call
      bucket.append(item)
      return bucket

  print(append_safe(1), append_safe(2))
note: 'The function object append_to holds its default list (look for it among the objects): both calls append to that one list. Use None as the default and create the list inside.'
```

### Functions are objects

A `def` creates a function object and binds its name to it, so functions can be assigned,
stored in containers and passed around: `f = print; f("hi")`. `lambda x: x * 2` makes a small
unnamed function; `sorted(words, key=len)` passes one. (Functional programming, later in the
course, builds on this.)

## Scope: how Python finds a name

Python looks up a name in four places, in order (**LEGB**):

1. **Local**: names assigned in the current function (parameters included);
2. **Enclosing**: the locals of the functions the current one is nested in;
3. **Global**: names assigned at the top level of the current module;
4. **Built-in**: `print`, `len`, `range`, …

The compiler decides which names are local by looking at the whole function: **any assignment
to a name anywhere in a function makes it local everywhere in that function**. Reading a global
works; assigning to it creates a local instead, unless the function declares `global name`
(`nonlocal name` does the same for an enclosing function's variable).

```sim
id: py-348-global
custom: true
engine: py
code: |
  dog = "house"

  def read():
      return dog               # reads the global

  def shadow():
      dog = "bone"             # a new local; the global is untouched
      return dog

  def update():
      global dog
      dog = "bone"             # writes the global

  def broken():
      print(dog)               # dog is local here (assigned below)...
      dog = "cat"              # ...so this read fails

  print(read(), shadow(), dog)
  update()
  print(dog)
  broken()
note: 'shadow''s frame gets its own dog; update''s does not, because of the global declaration. broken fails with UnboundLocalError: the assignment on line 16 makes dog local for the whole function, so line 15 reads a local that has no value yet.'
```

Each module has its own global namespace, so two modules can both have a variable `count`
without conflict: unlike C, a Python global is global to its module only. `dir()` lists the
names of the current namespace; `dir(module)` those of a module.

## Modules

:::definition[Module]
A **module** is a file of Python code, `name.py`. `import name` makes its functions, classes and
variables available as `name.function`, `name.variable`. A program is a main script plus the
modules it imports.
:::

`import` looks like C's `#include`, but works completely differently:

| C `#include` | Python `import` |
|---|---|
| pastes the text of a header at compile time | runs at **run time**, as a statement |
| the file is compiled into the caller | the module is compiled separately, to bytecode |
| included again in every file that includes it | executed **once**, the first time it is imported; later imports reuse it |
| declarations only | runs all of the module's top-level code |

When `import geometry` runs for the first time, Python:

1. **finds** `geometry.py` on the search path `sys.path`: the folder of the main script first,
   then the folders in the `PYTHONPATH` environment variable, then the standard library;
2. **compiles** it to bytecode and caches it in `__pycache__/geometry.cpython-311.pyc`, reused
   while the source is unchanged (the main script itself is not cached);
3. **executes** its top-level code, which mostly defines functions and variables, creating the
   module object and its namespace.

:::syntax[import]
```python
import geometry                 # use geometry.area(...)
import geometry as geo          # use geo.area(...)
from geometry import area, PI   # use area(...) directly; the whole module still runs
from geometry import *          # every public name: convenient, but hides where names come from
```
:::

### Running a module as a script

Every module has a variable `__name__`. In the module Python was started with, it is
`"__main__"`; in an imported module, it is the module's name. So a file can serve as both a
library and a program:

```python
if __name__ == "__main__":
    import sys
    main(sys.argv[1:])        # sys.argv[0] is the script's name
```

The block runs when the file is executed directly and is skipped when the file is imported.

```sim
id: py-348-modules
custom: true
engine: py
code: |
  import geometry
  import geometry                  # already loaded: nothing runs again
  from geometry import circle_area as area
  from shapes import square

  print(geometry.circle_area(2), area(1))
  print(square.perimeter(3), __name__)
files:
  geometry.py: |
    PI = 3.14159

    def circle_area(r):
        return PI * r * r

    print("geometry loaded, __name__ =", __name__)

    if __name__ == "__main__":
        print("run as a script: a quick self-test")
        print(circle_area(1))
  shapes/__init__.py: |
    # marks shapes/ as a package
  shapes/square.py: |
    def perimeter(side):
        return 4 * side
note: 'geometry.py prints once, with __name__ = geometry, so its self-test block is skipped; the second import finds the module already loaded. shapes is a package: a folder with __init__.py, whose modules are named with a dot.'
```

### Packages

A **package** is a folder of modules with an `__init__.py` file (it may be empty, or run
package-level set-up). Modules inside are named with dots: `import shapes.square`,
`from shapes import square`. `__all__ = ["a", "b"]` in `__init__.py` lists what
`from shapes import *` imports.

::::exercise[What does this print?]
```python
level = 1

def outer():
    level = 2
    def inner():
        nonlocal level
        level += 1
        return level
    print(inner(), inner(), level)

def f(a, b=[], *rest, **kw):
    b.append(a)
    return len(b), rest, kw

outer()
print(level, f(1), f(2, [], 3, x=4), f(5))
```

:::solution
```text
3 4 4
1 (1, (), {}) (1, (3,), {'x': 4}) (2, (), {})
```

`inner` changes `outer`'s `level` through `nonlocal`: 3, then 4, and `outer` then sees 4; the
global `level` stays 1. `f(1)` appends to the shared default list (length 1); `f(2, [], 3, x=4)`
uses a fresh list, puts 3 in `rest` and `x` in `kw`; `f(5)` appends to the shared default again,
which now has two elements.
:::
::::

::::exercise[Import order]
A file `config.py` contains `print("config")` and `DEBUG = True`. The main script is
`import config`, then `from config import DEBUG`, then `import config as c`, then `print(DEBUG, c.DEBUG)`.
How many times is `config` printed, and what is the last line?

:::solution
`config` is printed once: the first import runs the module; the other two find it already
loaded and only bind names. The last line is `True True`. (Editing `config.py` while the program
runs changes nothing either: the module is not re-read.)
:::
::::

:::insight
Python decides structure by indentation, finds names by LEGB with assignment making a name local,
passes every argument as a reference to an object, and evaluates defaults once. A module is run
once, when first imported, and gives its names their own namespace: import is a run-time act, not
a textual paste.
:::

## Further reading

- [The Python Tutorial: more control flow tools](https://docs.python.org/3/tutorial/controlflow.html) — `if`, `for`, `range`, and functions with default, keyword and arbitrary arguments.
- [The Python Tutorial: modules](https://docs.python.org/3/tutorial/modules.html) — the search path, compiled files, `__name__`, and packages.
- [Execution model: naming and binding](https://docs.python.org/3/reference/executionmodel.html#naming-and-binding) — the exact scope rules, `global` and `nonlocal`.
