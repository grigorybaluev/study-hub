---
title: "Garbage collection: mark and sweep, conservative collection, reference counting"
order: 12
status: detailed
weeks: [9]
introduces: [garbage-collection]
requires:
  - {concept: dynamic-memory-allocation, strength: hard}
  - {concept: python-programming, strength: soft}
  - {concept: graph-traversal, strength: soft}
reinforces: []
---

How a language can free heap memory by itself: the reachability idea, the mark-and-sweep
algorithm and its refinements, how a collector can even be bolted onto C, and the reference
counting that CPython uses, with the cycles it cannot see.

## Why collect garbage

C has three kinds of storage: **static** (globals) and **automatic** (locals on the stack) are
managed by the compiler, while **dynamic** storage from `malloc` is the programmer's job. In a
large program that job is hard: thousands of objects, several pointers to the same object from
different parts of the code, containers holding references internally. Free too late and memory
leaks; free too early and a dangling pointer corrupts something else.

:::definition[Garbage collection]
**Garbage collection** is automatic reclamation of heap memory: the language's run-time system
finds the objects the program can no longer use and frees them. Most languages in wide use today
have it (Java, Python, JavaScript, Go, C#, Clojure, Erlang). Rust and Swift are notable
exceptions: they manage memory with ownership rules or automatic reference counting instead of a
tracing collector.
:::

A collector cannot know what the program *will* use, so it frees what the program *cannot* use:
objects it has no way to reach.

:::definition[Root set and reachability]
The **root set** is every reference the program can use directly: global variables and the
variables in the frames on the call stack (plus registers). An object is **reachable** if it is
referred to by a root, or by a reachable object. Unreachable objects are garbage.
:::

## Mark and sweep

The basic **tracing** collector works in two phases over the heap. Each object has a mark bit.

:::algorithm[Mark and sweep]
**Input:** the root set and the heap of allocated objects.\
**Output:** every unreachable object freed.

1. **Mark.** Clear every mark. Mark each object referred to by a root, and put it on a work
   list. While the work list is not empty, take an object from it, and mark (and add to the work
   list) every unmarked object it refers to.
2. **Sweep.** Walk through every object in the heap. Free each unmarked one; the marked ones
   survive (and are unmarked again for the next collection).
:::

The mark phase is a graph traversal (depth- or breadth-first) from the roots; it touches only
live objects. The sweep touches every object in the heap.

```sim
id: ds-348-mark-sweep
custom: true
engine: ds
mode: mark-sweep
roots:
  foo: main.foo
  boo: baz.boo
objects:
  foo: [cust1, cust2]
  cust1: []
  cust2: [cust1]
  boo: [anim1, anim2]
  anim1: []
  anim2: [anim1]
  old: [older]
  older: [old]
ops: ["collect", "drop boo", "collect"]
note: 'main.foo is a global and baz.boo a local of the running function baz. The first collection marks everything reachable from them and frees only old and older, which point at each other but at nothing from a root. Then baz returns (drop boo): its frame goes, the animals become unreachable, and the next collection frees them.'
```

### When the collector runs

Collecting takes time from the program, so a collector does not run continuously. Usually the
allocator triggers it when free memory runs low (or after a number of allocations); some systems
also run it on a timer. A naive mark and sweep **stops the world**: the program pauses for the
whole collection, which for a large heap can be noticeable.

### Refinements

- **Tri-colour marking** (white = not yet seen, grey = seen but its references not yet followed,
  black = done) lets the mark phase run in small increments, interleaved with the program, with
  a rule that stops the program from hiding a white object behind a black one.
- **Generational** collection uses the observation that most objects die young. New objects are
  allocated in a small young generation, collected often and cheaply; objects that survive a few
  collections are promoted to an old generation, collected rarely. Java, .NET and CPython's cycle
  collector are generational.
- **Copying** collectors move the live objects into a fresh area, which compacts the heap and
  makes freeing everything else free; they need to update every pointer, which only works when
  the collector knows where all pointers are.

## Garbage collection for C: a conservative collector

C's compiler does not record which words in memory are pointers, so a tracing collector cannot
know what refers to what. The **Boehm–Demers–Weiser collector** works anyway, as a library:

1. It replaces `malloc` with its own allocator, which records the address and size of every
   block.
2. To mark, it scans the roots it can find without the compiler's help — the stack, the static
   data, the registers — and treats **any word whose value lies inside an allocated block as a
   pointer** to that block. It then scans those blocks the same way.
3. It sweeps the unmarked blocks.

:::definition[Conservative collection]
A **conservative** collector treats every value that *could* be a pointer as one. It never frees
a live block (no false negatives: every real pointer is also a value in range), but it may keep a
dead block alive because some integer happens to look like its address. That false retention is
a temporary leak: it lasts until the integer changes or its frame is popped.
:::

On a 64-bit machine the heap occupies a tiny part of the address space, so a random integer rarely
looks like a heap address, and false retention is rare. The collector is a black box to the
compiler, and it gives up the precision a copying or generational collector needs; that, and
the unpredictable pauses, are why systems code (operating systems, database engines) keeps
manual memory management.

## Reference counting

CPython uses a different, non-tracing strategy as its main mechanism.

:::definition[Reference counting]
In **reference counting**, every object stores the number of references to it. Each assignment,
argument pass or container insertion that creates a reference increments the count; each one
that goes away (a name rebound or deleted, a frame popped, a container freed) decrements it. When
a count reaches zero, the object is freed at once, and the counts of the objects it referred to
drop in turn.
:::

Reference counting frees memory as soon as it becomes garbage, spreads the work evenly instead of
pausing, and is simple. It has two costs: every assignment updates counts (a real overhead, and a
problem for threads), and it **cannot free cycles**. Two objects that refer to each other keep
each other's count at 1 even when nothing else can reach them. CPython therefore also has a
tracing **cycle collector** (module `gc`) that runs from time to time, or on demand with
`gc.collect()`.

```sim
id: py-348-refcount
custom: true
engine: py
code: |
  import gc, sys

  class Node:
      def __init__(self, name):
          self.name = name
          self.other = None

  a = [1, 2, 3]
  b = a                      # a second reference: count 2
  print(sys.getrefcount(a))  # getrefcount adds one for its own argument
  del b                      # back to 1
  c = Node("c")
  d = Node("d")
  c.other = d                # d: referred to by the name d and by c
  d.other = c                # c: by the name c and by d
  del c, d                   # both counts drop to 1, never to 0
  print("collected:", gc.collect())
  a = None                   # the list's count reaches 0: freed at once
note: 'Follow the refs number on each object. del c, d removes the names but the two Nodes still point at each other: they stay, dashed, unreachable. gc.collect() traces from the roots, finds them unreachable and frees them. Setting a to None frees the list immediately, with no collection needed.'
```

The same cycle, seen by a collector that only counts:

```sim
id: ds-348-refcount-cycle
custom: true
engine: ds
mode: mark-sweep
counting: true
roots:
  head: main.head
objects:
  head: [n1]
  n1: [n2]
  n2: [n3]
  n3: [n1]
ops: ["drop head", "collect"]
note: 'With counting: true each object shows its reference count. Dropping the root main.head frees the head object at once (its count reaches 0), and n1 drops to 1. n1, n2 and n3 then keep one reference each, from one another, so counting frees nothing more. Only the tracing collection that follows sees that no root reaches them.'
```

| Strategy | Frees garbage | Pauses | Cycles | Cost |
|---|---|---|---|---|
| manual (`free`) | when told | none | the programmer's problem | bugs: leaks, dangling pointers, double frees |
| mark and sweep | at each collection | whole collection (less with incremental or generational) | handled | work proportional to the live objects (mark) plus the heap (sweep) |
| conservative (Boehm) | at each collection | yes | handled | may retain some garbage |
| reference counting | immediately | none | not handled alone | an update on every assignment |

::::exercise[Which objects are freed?]
A program has a global `cache` referring to object A, which refers to B. The running function
`load` has a local `tmp` referring to C, which refers to D; D refers back to C. Object E refers to
A, and nothing refers to E. `load` now returns. Which objects does a mark-and-sweep collection
free? Which would pure reference counting free, and when?

:::solution
Mark and sweep: after `load` returns, the roots are only `cache`. Marking reaches A and B. C, D
and E are unmarked and freed. Reference counting: when `load` returns, `tmp` disappears, so C's
count drops from 2 to 1 (D still refers to it); C and D keep each other alive and are never freed
without the cycle collector. E's count is 0 — it was freed as soon as its last reference
disappeared, earlier — and freeing E dropped A's count from 2 to 1, which keeps A alive through
`cache`.
:::
::::

::::exercise[True or false?]
1. A conservative collector can free a block that is still in use.
2. Mark and sweep touches every object in the heap at each collection.
3. In CPython, an object with no references is freed at the next `gc.collect()`.
4. Adding a garbage collector to a C program needs a special compiler.

:::solution
1. False: it only errs the other way, keeping garbage whose address some integer happens to
   match. 2. True of the sweep phase (the mark phase touches only live objects). 3. False: it is
   freed immediately, when its count reaches zero; `gc.collect()` is for cycles. 4. False: the
   Boehm collector is a library that replaces `malloc` and scans memory conservatively.
:::
::::

:::insight
A garbage collector frees what the program can no longer reach. Tracing collectors find the
reachable objects from the roots and sweep the rest, cycles included; reference counting frees
each object the moment its count hits zero, but needs a tracing collector for cycles. Knowing
which one a language uses explains its pauses, its costs and its leaks.
:::

## Further reading

- [Tracing garbage collection](https://en.wikipedia.org/wiki/Tracing_garbage_collection) — marking, tri-colour marking, generational and copying collectors.
- [A garbage collector for C and C++ (Boehm–Demers–Weiser)](https://www.hboehm.info/gc/) — the conservative collector and how to use it.
- [gc — garbage collector interface](https://docs.python.org/3/library/gc.html) — CPython's cycle collector and its generations.
- [Reference counting](https://en.wikipedia.org/wiki/Reference_counting) — the technique, its costs and the cycle problem.
