---
title: "Python data structures: stacks, queues, dictionaries, tuples and sets"
order: 9
status: detailed
weeks: [5]
introduces: []
requires:
  - {concept: python-programming, strength: hard}
  - {concept: hash-table, strength: soft}
  - {concept: stack, strength: soft}
  - {concept: queue, strength: soft}
reinforces:
  - {concept: collections, perspective: "Python's built-in containers and when to use each"}
  - {concept: dictionary, perspective: "Python dict: a hash table that keeps insertion order"}
  - {concept: set, perspective: "Python set: hashing, membership and set algebra"}
  - {concept: stack, perspective: "a Python list used from its end"}
  - {concept: queue, perspective: "collections.deque, and why a list makes a slow queue"}
---

Python's built-in containers beyond the list: using a list as a stack, why a list makes a poor
queue and a `deque` a good one, dictionaries and the hash table behind them, tuples and sequence
unpacking, and sets.

## Stacks and queues from lists

A list used only at its end is a **stack** (last in, first out): `append` pushes and `pop()` pops,
both $O(1)$.

```python
stack = ["foo", "boo"]
stack.append("bat")
stack.append("bar")
print(stack.pop(), stack)
```

```output
bar ['foo', 'boo', 'bat']
```

A **queue** (first in, first out) takes from the front: `pop(0)`. That gives the right answer
and the wrong cost: the list is an array, so removing its first element shifts every other
pointer down by one, $O(n)$ per call.

:::definition[deque]
A **deque** (double-ended queue, from `collections`) supports adding and removing at both ends in
$O(1)$: `append`, `appendleft`, `pop`, `popleft`. CPython builds it as a doubly linked list of
fixed-size blocks, so either end can grow or shrink without moving the rest.
:::

```sim
id: py-348-deque
custom: true
engine: py
code: |
  from collections import deque
  line = deque(["ana", "ben"])
  line.append("cy")          # join at the back
  line.append("dee")
  first = line.popleft()     # leave from the front
  print(first, line)
  line.appendleft("vip")     # jump the queue
  line.rotate(1)             # move the last to the front
  print(line, len(line))
  print(line[0], line[-1])
note: 'Each call changes the deque in place (watch its object on the right). Indexing a deque works, but it is O(n) in the middle: use a deque for its ends and a list when you need random access or slicing.'
```

| Operation | list | deque |
|---|---|---|
| add or remove at the end | $O(1)$ | $O(1)$ |
| add or remove at the front | $O(n)$ | $O(1)$ |
| `x[i]` in the middle | $O(1)$ | $O(n)$ |
| slicing | yes | no |

## Dictionaries

:::definition[Dictionary]
A **dict** maps **keys** to **values**. Keys are unique and must be *hashable*: immutable values
such as `int`, `str` or a `tuple` of those. Lists and dicts cannot be keys. Since Python 3.7 a
dict remembers the order in which keys were first inserted.
:::

:::syntax[dict]
```python
d = {<key>: <value>, <key>: <value>}   # {} is an empty dict
d[<key>]                   # the value; KeyError if the key is missing
d[<key>] = <value>         # add, or replace the value of an existing key
del d[<key>]               # remove; KeyError if missing
<key> in d                 # is the key present?
d.get(<key>, <default>)    # the value, or default (None) if missing: no error
```

- `d.keys()`, `d.values()`, `d.items()` are live **views**: they change when the dict changes.
  `for k, v in d.items():` walks the pairs in insertion order.
- `d.pop(k)`, `d.update(other)`, `d.setdefault(k, v)`, `d.clear()`, `len(d)`.
:::

```sim
id: py-348-dict
custom: true
engine: py
code: |
  location = {"joe": "Montreal", "sue": "Toronto"}
  location["mo"] = "Tokyo"         # add
  location["sue"] = "Ottawa"        # replace
  del location["joe"]
  print(location)
  print(location.get("zed"), location.get("zed", "unknown"))
  counts = {}
  for word in "to be or not to be".split():
      counts[word] = counts.get(word, 0) + 1
  for word, n in counts.items():
      print(word, n)
  print(location["zed"])
note: 'counts.get(word, 0) + 1 is the counting idiom: a missing word counts as 0. The last line uses [] on a missing key and stops with KeyError: zed, which get would have avoided.'
```

### How a dict is built: a hash table

A dict is a **hash table**. A **hash function** turns each key into a number (`hash(key)`); the
number, reduced modulo the table size, picks a slot. Looking up a key hashes it, goes to that
slot and compares; that is why lookup, insertion and deletion take $O(1)$ time on average,
whatever the number of entries. The average hides three costs:

- computing the hash of the key (for a long string, proportional to its length);
- **collisions**: two keys that land on the same slot. CPython uses *open addressing*: it probes
  other slots in a pseudo-random sequence until it finds the key or an empty slot;
- **resizing**: when the table is about two-thirds full, it is rebuilt at a larger size, which
  re-inserts every key ($O(n)$ once in a while, $O(1)$ amortized).

Keys must be immutable because the slot depends on the key's hash: if a list could be a key and
then changed, it would sit in the slot of its old hash and never be found again. The hashing
itself can be stepped through (with integer keys and $h(k) = k \bmod 13$):

```sim
id: ds-348-dict-hashing
custom: true
engine: ds
mode: hash-table
scheme: linear
buckets: 13
data: [18, 41, 22, 44]
ops: ["insert 31", "find 44", "find 5"]
note: 'Open addressing, as in a Python dict (which probes pseudo-randomly rather than linearly). 44 hashes to 5, which 18 already holds, so it goes to the next free slot; find(44) follows the same path. find(5) stops at an empty slot: the key is absent.'
```

## Tuples

:::definition[Tuple]
A **tuple** is an immutable sequence, written with commas (the parentheses are optional except
where they are needed for grouping): `"Joe", 43, "Montreal"`. It supports indexing, slicing, `in`
and `len`, but not assignment to its elements.
:::

- `()` is the empty tuple; a one-element tuple needs a trailing comma: `("boo",)` or `"boo",`.
  `("boo")` is just a string in parentheses.
- Tuples usually hold a fixed number of **heterogeneous** items (a record, like a C struct
  without names); lists usually hold any number of **homogeneous** items.
- A tuple can contain mutable objects. The tuple cannot change which objects it holds, but a
  list inside it can still be changed.
- Being immutable (when their items are), tuples are hashable, so they can be dict keys and set
  elements: `grid[(row, col)]`.

```sim
id: py-348-tuples
custom: true
engine: py
code: |
  person = "Joe", 43, "Montreal"
  scores = [78.7, 26.33, 99.99]
  both = person, scores          # a tuple of a tuple and a list
  scores[1] = 0.0                # visible through both
  print(both)
  name, age, city = person       # sequence unpacking
  print(age)
  first, *rest = [1, 2, 3, 4]    # starred target takes the rest
  a, b = 1, 2
  a, b = b, a                    # swap without a temporary
  print(first, rest, a, b)
  m, n = person                  # three values, two names
note: 'both holds two arrows: to the person tuple and to the scores list, so the change to scores shows up in both. The last line raises ValueError: too many values to unpack.'
```

**Sequence unpacking** assigns the elements of any sequence to several names at once, and fails
with `ValueError` if the counts differ (unless one target is starred). `a, b = b, a` builds the
tuple `(b, a)` first, then unpacks it, which is why it swaps.

## Sets

:::definition[Set]
A **set** is an unordered collection of distinct hashable values, written `{1, 2, 3}`. `set()`
is the empty set, because `{}` is an empty dict.
:::

A set is a hash table with keys and no values, so membership (`x in s`), `add` and `remove` are
$O(1)$ on average, and adding an element that is already there does nothing. The set algebra
has operators:

| Expression | Result |
|---|---|
| `a \| b`, `a.union(b)` | elements in either |
| `a & b`, `a.intersection(b)` | elements in both |
| `a - b`, `a.difference(b)` | elements in `a` but not `b` |
| `a ^ b` | elements in exactly one |
| `a <= b`, `a.issubset(b)` | every element of `a` is in `b` |

```sim
id: py-348-sets
custom: true
engine: py
code: |
  seen = set()
  for n in [3, 1, 4, 1, 5, 9, 2, 6, 5, 3]:
      seen.add(n)              # duplicates are ignored
  print(seen, len(seen))
  odd = {1, 3, 5, 7, 9}
  print(seen & odd, seen - odd, seen | {10})
  print(4 in seen, 7 in seen)
  unique = sorted(set("mississippi"))
  print(unique)
  seen.add([8])                # a list is not hashable
note: 'A set prints in the order of its hash table, not insertion order (for small ints that happens to be ascending). sorted(set(...)) is the idiom for distinct values in order. The last line fails: TypeError, unhashable type list.'
```

## Choosing a container

| Need | Use | Because |
|---|---|---|
| an ordered, changeable sequence | `list` | $O(1)$ index and append |
| a fixed record, or a dict key made of several parts | `tuple` | immutable, hashable |
| a queue, or adding at both ends | `deque` | $O(1)$ at both ends |
| lookup by key | `dict` | $O(1)$ average lookup |
| distinct values, fast membership | `set` | $O(1)$ average `in` |

Strings, lists, tuples and ranges are **sequences** (ordered, indexable). Lists, dicts and sets
are **mutable**; strings, tuples and numbers are **immutable**.

::::exercise[What does this print?]
```python
inventory = {"apple": 3, "pear": 0}
inventory["plum"] = inventory.get("plum", 0) + 2
inventory["apple"] += 1
pair = ("fig", [1])
pair[1].append(2)
basket = {"apple", "fig"} | {k for k, v in inventory.items() if v > 0}
print(inventory, pair, sorted(basket), len(basket))
```

:::solution
```text
{'apple': 4, 'pear': 0, 'plum': 2} ('fig', [1, 2]) ['apple', 'fig', 'plum'] 3
```

`get` returns 0 for the missing `plum`, so it becomes 2; `apple` goes to 4. The tuple cannot
change which list it holds, but the list itself grows. The set comprehension keeps the keys with
a positive count (`apple`, `plum`), and the union with `{"apple", "fig"}` has three distinct
elements.
:::
::::

::::exercise[Pick the structure]
A program reads a million user ids from a log, one per line, and must report how many distinct
ids there are, then serve requests in the order they arrived. Which containers would you use,
and what would go wrong with a list for each job?

:::solution
A `set` for the distinct ids: `add` and `in` are $O(1)$ on average, so the whole pass is
$O(n)$. With a list, each `if uid not in ids` scans the list, $O(n^2)$ in total: about
$5 \times 10^{11}$ comparisons for a million ids. A `deque` for the requests: `append` at the
back, `popleft` at the front, both $O(1)$. A list's `pop(0)` shifts every remaining element, so
serving all requests would again be $O(n^2)$.
:::
::::

:::insight
Python's containers differ in what they make cheap. Lists are arrays: cheap at the end and by
index. Deques are linked blocks: cheap at both ends. Dicts and sets are hash tables: cheap lookup
by key, which is why their keys must be immutable. Tuples are immutable records that can serve as
keys.
:::

## Further reading

- [The Python Tutorial: data structures](https://docs.python.org/3/tutorial/datastructures.html) — list methods, stacks and queues, tuples, sets and dictionaries.
- [collections.deque](https://docs.python.org/3/library/collections.html#collections.deque) — the full deque API.
- [Time complexity of CPython operations](https://wiki.python.org/moin/TimeComplexity) — costs of list, deque, dict and set operations.
- [How CPython's dict works (dictobject.c comments)](https://github.com/python/cpython/blob/main/Objects/dictobject.c) — the probing and resizing rules in the implementation's own words.
