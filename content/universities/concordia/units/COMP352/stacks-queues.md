---
title: Stacks, queues and deques
order: 3
status: detailed
weeks: [3]
introduces: [abstract-data-type, stack, queue]
requires:
  - {concept: array, strength: hard}
  - {concept: interface, strength: hard}
  - {concept: exception-handling, strength: soft}
  - {concept: algorithm-analysis, strength: hard}
  - {concept: generics, strength: soft}
reinforces: []
---

A stack lets you add and remove at one end; a queue adds at one end and removes at the
other. Two operations each, and they are the two most used structures in computing —
the method-call stack, the undo history, the print queue, breadth-first search. This
unit states them as abstract data types, builds each on an array, and meets the first
analysis surprise of the course: an array that doubles when full costs $O(1)$ per
operation *on average*, though a single operation may cost $O(n)$.

## Abstract data types

> **Definition.** An **abstract data type (ADT)** is a model of a data structure that
> specifies the data stored, the operations on it, and what happens on error — not how
> any of it is implemented. In Java an ADT is an **interface**; the classes that
> implement it are the concrete data structures, and a program written against the
> interface can swap one for another.

The separation is the point: the analysis of "push" belongs to the *implementation*
(array or linked list), while the *meaning* of push belongs to the ADT and never
changes.

## The stack ADT

> **Definition.** A **stack** stores objects in **last-in, first-out (LIFO)** order.
> Main operations: `push(e)` inserts `e`; `pop()` removes and returns the most recently
> inserted element. Auxiliary: `top()` returns it without removing, `size()`,
> `isEmpty()`. Popping an empty stack throws `EmptyStackException`.

Direct uses: page-visited history, undo, the run-time stack of method calls (each call
pushes a frame with its locals and return address; each return pops it — recursion is
just a deep stack). Indirect: an auxiliary structure inside other algorithms, as below.

An **array-based stack** keeps the elements in `S[0..t]` with `t` the index of the top,
`−1` when empty: `push` increments `t` and stores, `pop` reads `S[t]` and decrements.
Every operation is $O(1)$; the space is the array's capacity $N$, fixed at creation, so
a push onto a full array must fail (`FullStackException`) — or grow, as the last
section discusses.

```sim
id: ds-352-array-stack
custom: true
engine: ds
mode: stack
data: [3, 8]
capacity: 4
ops: ["push 5", "push 1", "top", "pop", "push 9", "push 4"]
note: "t marks the top; push and pop touch only S[t] and t, whatever the size — O(1). The last push finds the array full: the fixed-capacity version throws. Pop until empty and pop once more to see the other exception."
```

## Stack applications

**Parentheses matching.** Scan the text; push every opening bracket; on a closing one,
pop and check that it matches — if the stack is empty or the pair is wrong, the text
is malformed; at the end the stack must be empty. One pass, $O(n)$. HTML tag matching
is the same algorithm with tag names.

**Evaluating an infix expression** uses two stacks, one for numbers and one for
operators: read left to right; push numbers; before pushing an operator, apply every
operator on the stack of higher or equal precedence (`doOp` pops two numbers and one
operator and pushes the result); at the end drain the operator stack. `14 − 3 * 2 + 7`
evaluates to 15 because `*` binds tighter than `−`.

**Spans.** The span of `X[i]` is the number of consecutive elements up to and
including `X[i]` that are no larger than it. The obvious algorithm scans back from each
`i`: $O(n^2)$. With a stack of indices of "visible" elements (each index pushed once
and popped at most once), the total is $O(n)$ — the amortised argument of the last
section, applied to an algorithm.

```sim
id: java-352-stack-applications
custom: true
engine: java
code: |
  import java.util.*;
  public class Main {
      static boolean matched(String s) {
          Deque<Character> st = new ArrayDeque<>();
          String open = "([{", close = ")]}";
          for (char c : s.toCharArray()) {
              if (open.indexOf(c) >= 0) st.push(c);
              else if (close.indexOf(c) >= 0) {
                  if (st.isEmpty()) return false;
                  if (open.indexOf(st.pop()) != close.indexOf(c)) return false;
              }
          }
          return st.isEmpty();
      }
      static int[] spans(int[] x) {                  // O(n): each index is pushed and popped at most once
          int n = x.length;
          int[] s = new int[n];
          Deque<Integer> st = new ArrayDeque<>();
          for (int i = 0; i < n; i++) {
              while (!st.isEmpty() && x[st.peek()] <= x[i]) st.pop();
              s[i] = st.isEmpty() ? i + 1 : i - st.peek();
              st.push(i);
          }
          return s;
      }
      public static void main(String[] args) {
          System.out.println(matched("(a[b]{c})") + " " + matched("([)]") + " " + matched("(("));
          int[] x = {6, 3, 4, 5, 2};
          System.out.println(Arrays.toString(spans(x)));
      }
  }
note: 'Step through matched("([)]"): the pop returns [ when ) arrives, the wrong pair. In spans, watch the stack hold only the indices still "visible" from the right; x = 6 3 4 5 2 gives spans 1 1 2 3 1. Change the last value to 7 and the whole stack empties at once — the popping is what makes the total linear.'
```

## The queue ADT

> **Definition.** A **queue** stores objects in **first-in, first-out (FIFO)** order:
> `enqueue(e)` inserts at the rear, `dequeue()` removes and returns the element at the
> front; auxiliary `first()`, `size()`, `isEmpty()`; dequeuing an empty queue throws
> `EmptyQueueException`. Uses: waiting lines, shared-resource access, multiprogramming
> (round robin: dequeue a process, run it for a slice, enqueue it again).

An array-based queue cannot simply keep the front at index 0 — dequeue would shift
everything, $O(n)$. Instead the array is used **circularly**: `f` is the index of the
front element and `sz` the number of elements; the rear position is `r = (f + sz) mod N`,
and both `enqueue` (store at `r`) and `dequeue` (read `Q[f]`, `f ← (f + 1) mod N`) are
$O(1)$. Indices wrap around the end of the array, which is what the modulo does; a
queue is full when `sz = N`.

```sim
id: ds-352-circular-queue
custom: true
engine: ds
mode: queue
data: [5, 3, 7]
capacity: 5
ops: ["dequeue", "dequeue", "enqueue 9", "enqueue 4", "enqueue 6", "first"]
note: "f and r chase each other around the array. After two dequeues the front is at index 2; the three enqueues fill 3, 4 and then wrap to 0. The front-to-back list under the array is what the queue means; the array is how it is stored. Enqueue twice more to hit the full condition."
```

## Deques

> **Definition.** A **double-ended queue (deque)** supports insertion and removal at
> both ends: `addFirst`, `addLast`, `removeFirst`, `removeLast`, with `first`, `last`,
> `size`, `isEmpty`. A stack is a deque used at one end; a queue is a deque used with
> `addLast` and `removeFirst` — the **adapter pattern**: implement the smaller ADT by
> translating each of its methods into a deque call.

Java's `java.util.ArrayDeque` is the class to use for all three in practice (the legacy
`Stack` class is discouraged). The circular array supports every deque operation in
$O(1)$; the doubly linked list of the next unit does too.

## Growable arrays and amortised analysis

When a push meets a full array, the fixed-size version throws; the useful version
replaces the array with a bigger one and copies. Two policies (slides 29–34):

- **Incremental**: grow by a constant $c$ each time. Over $n$ pushes the array is
  replaced $k = n/c$ times, copying $c, 2c, \dots, kc$ elements: total
  $c(1 + 2 + \dots + k) = c\,k(k+1)/2 = O(n^2/c) = O(n^2)$. Each push costs $O(n)$ on
  average.
- **Doubling**: replace the array with one twice the size. Over $n$ pushes there are
  only $\log_2 n$ replacements, copying $1 + 2 + 4 + \dots + 2^{k} = 2^{k+1} - 1 < 2n$
  elements in total. So $n$ pushes cost $O(n)$: each push is $O(1)$ **amortised** —
  the occasional expensive copy is paid for by the cheap pushes that preceded it.

> **Definition.** The **amortised running time** of an operation is its total cost over
> a sequence of operations divided by the length of the sequence — a worst-case
> average over the sequence, not a probabilistic one. Doubling gives push an $O(1)$
> amortised bound although its worst single cost is $O(n)$.

```sim
id: ds-growable-array
controls:
  - {id: n, label: "number of pushes", min: 8, max: 2000, step: 8, default: 200, decimals: 0}
  - {id: c, label: "increment c (incremental policy)", min: 1, max: 64, step: 1, default: 8, decimals: 0}
note: "Top: the cost of each push (log scale) — spikes at every replacement, ever rarer with doubling and evenly spaced with the increment. Bottom: the running average per push, which settles near 3 for doubling and keeps climbing for the incremental policy, however large c is."
```

```sim
id: ds-352-stack-doubling
custom: true
engine: ds
mode: stack
data: [1, 2]
capacity: 2
grow: doubling
ops: ["push 3", "push 4", "push 5", "push 6", "push 7", "push 8", "push 9"]
note: "The array doubles at pushes 3, 5 and 9; the running total in the description counts one step per push plus one per element copied. Seven pushes cost 7 + (2 + 4 + 8) = 21 steps — less than 3 per push, and the ratio never exceeds 3 however long you continue."
```

**Equations**

- *Incremental growth*: total cost of $n$ pushes $\approx n + c\,\frac{k(k+1)}{2}$ with $k = n/c$, so $\Theta(n^2/c)$ — $O(n)$ amortised per push.
- *Doubling*: copies $\sum_{i=0}^{k} 2^i = 2^{k+1} - 1 < 2n$, total $T(n) \le 3n$ — $O(1)$ amortised per push.
- *Circular queue*: rear $r = (f + \mathit{sz}) \bmod N$; after a dequeue $f \leftarrow (f + 1) \bmod N$.

> **Key insight.** An ADT fixes the meaning of the operations; the array fixes the
> costs. Stack and queue are both $O(1)$ per operation on an array once the queue is
> circular — and when the array must grow, *double* it, so that the total work over any
> sequence of pushes stays linear.

## Further reading

- [Goodrich, Tamassia & Goldwasser — Stacks, Queues and Deques (ch. 6 slides)](https://www.cs.uic.edu/~jbell/CourseNotes/DataStructures/StacksQueues.html) — The ADTs, array implementations and applications in the same order.
- [Java API — ArrayDeque](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/ArrayDeque.html) — The class that plays stack, queue and deque in real programs, with its amortised guarantees.
