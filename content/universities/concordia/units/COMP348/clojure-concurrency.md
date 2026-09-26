---
title: "Clojure concurrency: futures, atoms, agents and software transactional memory"
order: 17
status: detailed
weeks: [13]
introduces: []
requires:
  - {concept: functional-programming, strength: hard}
  - {concept: concurrency, strength: hard}
reinforces:
  - {concept: concurrency, perspective: "Clojure: immutable values plus reference types — atoms, agents and refs — instead of locks"}
---

Clojure's answer to shared state without locks: immutable values shared freely between threads,
and three reference types for the state that must change — atoms for independent updates, agents
for asynchronous ones, and refs changed together inside transactions that retry instead of
blocking.

## The Clojure way

Erlang shares nothing and passes messages. Clojure takes a different route. Its data is
immutable, so any number of threads can read the same list or map at once: nobody can change it
under them. Each thread that "modifies" a value builds its own new version.

Some problems still need **shared, changing state**: a counter all threads increment, two bank
accounts that must stay consistent. For those, Clojure has **reference types**: a reference points
at an immutable value, and the reference is changed — atomically — to point at a new value. The
language takes care of the synchronisation; the programmer never takes a lock.

| Reference | Changes | Update | Blocks the caller? |
|---|---|---|---|
| atom | one value, independently | `swap!`, `reset!` | yes, until the update is done |
| agent | one value, asynchronously | `send` | no: the update happens later, in another thread |
| ref | several values together | `alter`, `ref-set` inside `dosync` | yes, and the transaction may retry |

All three are read with `deref`, written `@r`.

## Futures: running code in another thread

A **future** runs a body in another thread and returns at once. Dereferencing the future gives the
body's value, waiting for it if it is not finished yet. Futures are the simplest way to start
threads in Clojure (Java's threads work too).

```clojure
(def slow-sum (future (Thread/sleep 2000) (reduce + (range 1 101))))
@slow-sum   ; waits until the 2 seconds are up, then returns 5050
```

## Atoms

:::definition[Atom]
An **atom** holds one value that can be replaced atomically: an update is guaranteed to complete
before any other thread sees or changes the atom. `(atom v)` creates one, `@a` reads it,
`(swap! a f args…)` replaces its value by `(f current args…)`, and `(reset! a v)` replaces it by `v`.
:::

`swap!` does not lock. It reads the current value, computes the new one with `f`, and then
**compares and sets**: if the atom still holds the value it read, it stores the new one; if another
thread changed the atom in the meantime, `swap!` throws its result away and **retries** with the
new current value. The update function may therefore run more than once, so it must be pure.

```sim
id: clj-348-atoms
custom: true
engine: clj
code: |
  (def counter (atom 0))
  (defn slow-add [v n]
    (Thread/sleep 5)              ; a slow update makes the threads overlap
    (+ v n))
  (def f1 (future (swap! counter slow-add 10)))
  (def f2 (future (swap! counter slow-add 20)))
  @f1
  @f2
  @counter
note: 'Two threads update the same atom. Both read 0 and start computing; whichever finishes second finds that the atom has changed, so its swap! retries from the new value (see the notes in the REPL panel). The result is always 30: no update is lost, and nobody took a lock.'
```

Atoms are enough for most shared state: one atom can hold a whole map, updated at once with
`swap!`. What an atom cannot do is change *two* references consistently.

## Agents

An **agent** also holds one value, but updates are **asynchronous**: `(send ag f args…)` queues the
update and returns immediately; the agent's own thread applies the queued functions one at a time,
in order. `(await ag)` blocks until the queued updates are done. Agents suit slow updates that the
caller does not need to wait for, such as writing a log.

```sim
id: clj-348-agents
custom: true
engine: clj
code: |
  (def log (agent []))
  (defn record! [entry]
    (send log conj entry)      ; queue the update and return at once
    nil)
  (record! "started")
  (record! "working")
  (println "main thread carries on")
  (await log)
  @log
note: 'send returns at once: the main thread goes on to print while the agent thread applies the queued conj calls, one at a time and in the order they were sent. await waits until the queue is empty, so @log sees both entries.'
```

## Refs and software transactional memory

Moving money between two accounts changes two values, and both changes must happen or neither: a
thread that sees one without the other sees money appear or vanish. Databases solve this with
**transactions**; Clojure borrows the idea for memory.

:::definition[Software transactional memory]
In **software transactional memory** (STM), a **transaction** is a block of reads and updates of
refs that takes effect atomically: other threads see all of its updates or none, as if transactions
ran one at a time. In Clojure, `(ref v)` creates a ref, `(dosync …)` runs a transaction, and inside
it `(alter r f args…)` and `(ref-set r v)` update refs.
:::

Clojure's STM is **optimistic**: a transaction does not lock anything. It runs, working on its own
view of the refs, and at the end tries to **commit**. If another transaction has committed a change
to one of the refs it used since it started, it is **rolled back** and retried from the beginning
with the new values. Like `swap!`'s function, the body of a transaction may run several times, so
it must not have side effects (no printing, no I/O). `alter` outside a transaction is an error.

```sim
id: clj-348-stm
custom: true
engine: clj
code: |
  (def checking (ref 100))
  (def savings (ref 200))
  (defn transfer [from to amount]
    (dosync
      (alter from - amount)
      (Thread/sleep 5)             ; widen the window for conflicts
      (alter to + amount)))
  (def ts (doall (map (fn [_] (future (transfer checking savings 10))) (range 3))))
  (doseq [t ts] @t)
  [@checking @savings]
  (+ @checking @savings)
  (alter checking inc)
note: 'Three transfers run at once. Transactions that conflict are retried (the REPL panel shows the retries), but every committed transaction moves 10 from one ref to the other at once, so the total is 300 at every moment. The last line calls alter outside dosync and fails: No transaction running.'
```

In practice, `dosync` with `alter` is for coordinated changes across several refs. When the state
fits in one value, an atom holding a map is simpler and faster.

::::exercise[Which reference type?]
For each piece of shared state, choose an atom, an agent or refs.

1. A cache of computed results that any thread may add to.
2. The inventory of a warehouse and the orders waiting for it, which must stay consistent.
3. A log that many threads append to, where nobody needs to wait for the write.

:::solution
1. An atom holding a map: `(swap! cache assoc k v)`; each addition is independent.
2. Refs changed in one `dosync`: taking stock and filling an order must happen together or not at
   all.
3. An agent: `(send log conj entry)` returns at once and the agent applies the appends in order.
:::
::::

::::exercise[Why must swap! functions be pure?]
A programmer writes `(swap! counter (fn [v] (println "adding") (inc v)))` and sees `adding` printed
more times than `swap!` was called. Explain.

:::solution
When two threads update the atom at the same time, one of them finds, at the compare-and-set, that
the atom changed after it read it. It discards its result and runs the function again on the new
value. Each retry runs the `println` again. Side effects in `swap!` functions (and in transactions)
can happen more than once; keep them pure and do the printing after the update.
:::
::::

:::insight
Clojure makes shared state safe by sharing only immutable values and changing references to them
atomically: atoms retry a single update, agents apply updates asynchronously in order, and refs
change together inside transactions that retry on conflict. There are no locks to forget, but the
functions that compute updates must be pure, because they may run more than once.
:::

## Further reading

- [Clojure: atoms](https://clojure.org/reference/atoms), [agents](https://clojure.org/reference/agents) and [refs and transactions](https://clojure.org/reference/refs) — the reference types in their own documentation.
- [Software transactional memory](https://en.wikipedia.org/wiki/Software_transactional_memory) — the idea and its implementations.
- [Clojure: concurrent programming](https://clojure.org/about/concurrent_programming) — why Clojure avoids locks.
