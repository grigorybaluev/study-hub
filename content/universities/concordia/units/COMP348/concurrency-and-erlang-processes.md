---
title: "Concurrency: race conditions, locks, deadlock, and Erlang's processes and messages"
order: 17
status: detailed
weeks: [13]
introduces: [concurrency, message-passing]
requires:
  - {concept: pattern-matching, strength: hard}
  - {concept: recursion, strength: hard}
  - {concept: functional-programming, strength: soft}
reinforces:
  - {concept: pattern-matching, perspective: "receive: choosing a message from the mailbox by matching"}
  - {concept: recursion, perspective: "a server is a tail-recursive loop that carries its state as an argument"}
---

Why concurrent programs are hard to get right when threads share memory — race conditions, critical
regions, locks, deadlock and livelock — and Erlang's alternative: lightweight processes that share
nothing and communicate only by messages, with `spawn`, `!`, `receive`, timeouts and registered names.

## Concurrency and parallelism

:::definition[Concurrency and parallelism]
A program is **concurrent** when it consists of several independent threads of control that may be
scheduled in any interleaving: their steps can overlap in time. It is **parallel** when steps actually
execute at the same moment, on several cores.
:::

A web server that handles each client in its own thread is concurrent even on a single core: the
scheduler hands the core to one thread after another, and each client is served as if it had the
machine to itself. The point is organisation — each client's logic is written as a simple sequence.
Summing a billion numbers by giving a quarter to each of four cores is parallel: the point is speed,
and it needs the hardware. Parallel execution implies overlapping threads, so parallel programs are
concurrent, but a concurrent program may never run two steps at the same instant.

## The trouble with shared data

What goes wrong in concurrent programs almost always involves **data that more than one thread can
write**. Two threads that each keep to their own data, or that only read a shared table, can run in any
interleaving and give the same result. The moment one of them writes what the other reads, the
interleaving starts to matter.

### Race conditions

A statement such as `balance = balance + 50` looks like one step, but the machine does it in three:
read `balance` into a register, add 50, write the register back. The operating system can switch
threads between any two of them, triggered by a timer it does not coordinate with your code.

:::definition[Race condition]
A **race condition** occurs when the result of a program depends on the order in which the steps of
concurrent threads happen to interleave. The code that reads and updates the shared data is a
**critical region** (or critical section): at most one thread at a time may be inside it.
:::

The simulations below are a small model, not Erlang: each thread runs a few instructions over shared
variables, and the schedule (a string of thread names) says who runs each step. Thread A deposits 50
and thread B withdraws 30 from a balance of 100, each with a read, an arithmetic step and a write.

```sim
id: erl-348-race
custom: true
engine: erl
mode: shared
shared: {balance: 100}
threads:
  A: ["a = balance", "a = a + 50", "balance = a"]
  B: ["b = balance", "b = b - 30", "balance = b"]
schedule: ABABAB
note: 'Both threads read 100 before either writes. A writes 150, then B overwrites it with 70: the deposit is lost. With the schedule AAABBB the result would be 120. The program is the same; only the interleaving differs.'
```

### Locks

The classic fix is a **lock** (a mutex): a thread takes the lock before entering the critical region
and releases it on the way out. A thread that finds the lock taken **blocks** until it is released,
so the critical regions of different threads can no longer interleave.

A lock is itself shared data, so taking it must not be interruptible: "see that the lock is free,
then mark it taken" in two steps could let two threads both see it free. Processors therefore provide
an **atomic** instruction (test-and-set, or compare-and-swap) that checks and changes a memory word
in one indivisible step; the operating system and the thread libraries build locks on it. In Java a
`synchronized` method takes the lock of its object; in C, POSIX threads offer `pthread_mutex_lock`.

```sim
id: erl-348-lock
custom: true
engine: erl
mode: shared
shared: {balance: 100}
threads:
  A: ["lock m", "a = balance", "a = a + 50", "balance = a", "unlock m"]
  B: ["lock m", "b = balance", "b = b - 30", "balance = b", "unlock m"]
schedule: ABABABABAB
note: 'The same alternating schedule, but B finds the lock taken and waits until A has written its result and unlocked. B then reads 150, and the balance ends at 120.'
```

### Deadlock and livelock

Locks solve the race and create new problems. With many locks, a program can **deadlock**: thread A
holds lock X and waits for lock Y, while thread B holds Y and waits for X. Neither can continue, ever.
A transfer between two accounts, written so that each thread locks its source account first, is
enough:

```sim
id: erl-348-deadlock
custom: true
engine: erl
mode: shared
shared: {checking: 100, savings: 200}
threads:
  A: ["lock checking", "lock savings", "checking = checking - 10", "savings = savings + 10", "unlock savings", "unlock checking"]
  B: ["lock savings", "lock checking", "savings = savings - 20", "checking = checking + 20", "unlock checking", "unlock savings"]
schedule: ABAB
note: 'A takes checking, B takes savings, and each then waits for the lock the other holds. Taking locks in one agreed order (always checking before savings) makes this impossible.'
```

In a **livelock**, threads are not blocked but make no progress: they keep releasing and retrying locks
to let each other through, like two people stepping aside in a corridor in the same direction. And
a correct program still pays for its locks: while a thread waits at a lock its core does nothing, and
the more threads contend for the same lock, the more of the machine sits idle. Adding cores to a
program that is mostly waiting for one lock does not make it faster.

## Message passing

:::definition[Message passing]
In **message passing**, concurrent processes share no memory. Each process has a **mailbox**, a queue
of messages sent to it; a process communicates only by sending a message (a copy of some data) to
another process and by taking messages from its own mailbox.
:::

Sending is **asynchronous**: the sender appends the message to the receiver's mailbox and goes on;
the receiver looks at its mailbox when it is ready. With no memory shared, two processes cannot corrupt
each other's data, so the lost update of the first simulation cannot happen and there are no locks to
take. Message passing does not remove every concurrency problem, though:

- **Order across senders is not fixed.** Messages from one sender arrive in the order they were sent,
  but messages from two senders can interleave either way, so a program must not depend on it.
- **Processes can still deadlock.** If process A sends a request to B and waits for B's reply while B
  sends a request to A and waits for A's reply, both wait forever. A process can also wait for a
  message from a process that has crashed.

The usual defences are a timeout on every wait for a reply (below) and designs where requests flow in
one direction, for example clients calling a server that never calls them back.

## Erlang processes

Erlang's concurrency is message passing. Its **processes** are not operating-system processes or
threads: the BEAM creates and schedules them itself, and a new one takes a few kilobytes of memory, so a
program can run hundreds of thousands of them. The operating system sees only the handful of threads the BEAM
runs them on. Three primitives do all the work:

:::syntax[spawn, send and receive]
```erlang
Pid = spawn(Module, Function, Args)     % start Module:Function(Args...) in a new process
Pid = spawn(fun() -> … end)             % or run a fun
Pid ! Message                            % send: append Message to Pid's mailbox
receive                                  % take the first message that matches a clause
    Pattern1 [when Guard1] -> Body1;
    Pattern2 [when Guard2] -> Body2
after Milliseconds ->                    % optional: give up waiting
    BodyT
end
```

- `spawn` returns the new process's **pid** (process identifier) at once; the new process runs
  concurrently. Nothing guarantees whether the parent or the child runs first.
- `self()` is the pid of the running process. A process that wants an answer sends its own pid in the
  message, so the receiver knows where to reply.
- `Pid ! Message` never blocks and returns `Message`. Any term can be a message; by convention it is a
  tuple tagged with an atom.
:::

The module below is a process that turns text into capitals, and the shell talks to it:

```sim
id: erl-348-spawn
custom: true
engine: erl
code: |
  -module(shouter).
  -export([start/0, loop/0]).

  start() -> spawn(shouter, loop, []).

  loop() ->
      receive
          {From, Text} ->
              From ! {self(), string:uppercase(Text)},
              loop();
          stop ->
              io:format("shouter stopping~n")
      end.
shell: |
  S = shouter:start().
  S ! {self(), "hello"}.
  receive {S, Reply} -> Reply end.
  S ! stop.
note: 'Step through and watch the lanes: the message lands in the shouter''s mailbox, the shouter takes it, and its reply lands in the shell''s mailbox. The shell''s receive matches only a reply tagged with S, the shouter''s pid. loop() calls itself as its last action, so it waits for the next message; stop ends it.'
```

### Selective receive

`receive` does not simply take the oldest message. It looks at the messages in arrival order and takes
the **first one that matches any of its clauses**. Messages that match no clause stay in the mailbox,
in order, for a later `receive`. A process can therefore handle urgent messages first, or wait for one
particular reply while other messages pile up.

```sim
id: erl-348-selective
custom: true
engine: erl
shell: |
  self() ! {low, "tidy desk"}, self() ! {high, "fix outage"}, self() ! {low, "answer mail"}.
  receive {high, Job} -> Job end.
  receive {low, Job2} -> Job2 end.
  flush().
note: 'Step to the first receive: it skips {low, "tidy desk"} (dashed) and takes {high, "fix outage"}. The low messages keep their order. flush() is a shell command that prints and removes whatever is left.'
```

### Servers: receive loops with state

A process that should handle many messages calls itself after each one: a **receive loop**. Its state
is an argument of the loop, and each message produces the next state, passed in the recursive call.
Because the call is a tail call, the loop runs forever in constant space. The account server below
holds a balance, and every deposit or withdrawal is one message, handled one at a time: the race of
the first simulation cannot happen.

**Registering** a pid under a name saves passing it around: `register(Name, Pid)` makes `Name ! Msg`
work anywhere in the system; `whereis(Name)` returns the pid (or `undefined`), `unregister(Name)`
removes the name, and `registered()` lists all names.

```sim
id: erl-348-server
custom: true
engine: erl
code: |
  -module(account).
  -export([start/1, loop/1, deposit/1, balance/0]).

  start(Initial) ->
      register(account, spawn(account, loop, [Initial])).

  loop(Balance) ->
      receive
          {deposit, Amount} ->
              loop(Balance + Amount);
          {withdraw, Amount} when Amount =< Balance ->
              loop(Balance - Amount);
          {withdraw, _} ->
              io:format("refused: not enough money~n"),
              loop(Balance);
          {balance, From} ->
              From ! {balance, Balance},
              loop(Balance)
      end.

  deposit(Amount) -> account ! {deposit, Amount}, ok.

  balance() ->
      account ! {balance, self()},
      receive
          {balance, B} -> B
      after 1000 -> timeout
      end.
shell: |
  account:start(100).
  account:deposit(50).
  account ! {withdraw, 500}.
  account ! {withdraw, 30}.
  account:balance().
  is_pid(whereis(account)).
note: 'The server''s frame always shows one call of loop/1: each tail call replaces the frame with the new Balance. The guard refuses a withdrawal larger than the balance. deposit/1 and balance/0 hide the messages behind ordinary functions, as real Erlang code does.'
```

### Timeouts

A `receive` with no matching message waits forever. If the message may never come — the other process
crashed, or a network link is down — add `after T ->`: when no matching message has arrived within
`T` milliseconds, the `after` body runs instead. `after 0` checks the mailbox without waiting.

```sim
id: erl-348-timeout
custom: true
engine: erl
shell: |
  receive {reply, R} -> R after 500 -> no_reply end.
  W = spawn(fun() -> receive go -> io:format("got go~n") after 200 -> io:format("gave up~n") end end).
  timer:sleep(300).
  is_process_alive(W).
note: 'Nobody sends the shell a reply, so after half a second it gets no_reply. The spawned process waits 200 ms for go, gives up while the shell is sleeping, and ends. The clock in the Processes panel is virtual: it jumps forward while every process waits.'
```

### When a process crashes

A process that fails — a bad match, a division by zero, an explicit `erlang:error/1` — dies alone:
its memory is its own, so no other process is left with half-updated data. The runtime reports the
crash, and messages sent to the dead process are silently dropped. That is why a caller waiting for a
reply should use a timeout.

```sim
id: erl-348-crash
custom: true
engine: erl
code: |
  -module(till).
  -export([start/0, loop/1]).

  start() -> spawn(till, loop, [0]).

  loop(Total) ->
      receive
          {sale, Price} when Price > 0 -> loop(Total + Price);
          {sale, Price} -> erlang:error({bad_price, Price});
          {total, From} -> From ! {total, Total}, loop(Total)
      end.
shell: |
  T = till:start().
  T ! {sale, 20}.
  T ! {sale, -5}, timer:sleep(10).
  is_process_alive(T).
  T ! {total, self()}.
  receive {total, Sum} -> Sum after 100 -> no_answer end.
note: 'A negative price makes the till process fail; the shell and everything else keep running. The last request goes to a dead process, so no answer comes, and the timeout turns an endless wait into no_answer.'
```

Erlang builds its fault tolerance on this. Processes can be **linked**, so that one learns when the
other dies, and a **supervisor** process restarts workers that crash. The motto is "let it crash":
rather than defending against every error inside a process, let a failed process die and restart it
in a known good state.

::::exercise[Which message is taken?]
A process's mailbox holds, oldest first, `{b, 1}`, `{a, 2}` and `{b, 3}`. It evaluates
`receive {a, X} -> X end` and then `receive {b, Y} -> Y end`. What are `X` and `Y`, and what is left
in the mailbox? Check your answer by typing this into the shell:

```erlang
self() ! {b, 1}, self() ! {a, 2}, self() ! {b, 3}.
receive {a, X} -> X end.
receive {b, Y} -> Y end.
flush().
```

:::solution
```text
{b,3}
2
1
Shell got {b,3}
ok
```

The first `receive` skips `{b, 1}` and takes `{a, 2}`, so `X` is 2. The second takes the oldest `b`
message, `{b, 1}`, so `Y` is 1. `{b, 3}` is left. (The first line is the value of the last send.)
:::
::::

::::exercise[Counting the outcomes of a race]
Two threads each increment a shared counter `x`, initially 0, as three steps: read `x` into a local,
add 1 to the local, write the local back to `x`. Which final values of `x` are possible, and which
interleavings produce them? How would a lock change the answer? How would an Erlang counter process
change it?

:::solution
`x` ends at 2 when one thread's three steps all come before the other thread's read (for example
AAABBB, or BBBAAA). It ends at 1 whenever both threads read before either writes (for example ABABAB,
AABABB): both read 0 and both write 1, so one increment is lost. No other value is possible.

With a lock around the three steps, the critical regions cannot overlap, so only the first kind of
interleaving can happen and `x` is always 2. With a counter process that holds `x` as its loop state
and receives `increment` messages, the two increments are two messages handled one after the other,
so the result is always 2, with no lock.
:::
::::

:::insight
Threads that share memory need locks to avoid race conditions, and locks bring deadlock, livelock and
waiting. Erlang avoids shared memory altogether: lightweight processes own their data and cooperate
only through messages, received selectively by pattern matching. A server is a tail-recursive receive
loop whose state is its argument, timeouts guard against waiting forever, and a crash stays inside the
process that crashed.
:::

## Further reading

- [Concurrency (computer science)](https://en.wikipedia.org/wiki/Concurrency_(computer_science)) — concurrency, parallelism, race conditions and deadlock.
- [Erlang: concurrent programming](https://www.erlang.org/doc/system/conc_prog.html) — processes, message passing, registered names and timeouts in the official tutorial.
- [Learn You Some Erlang: the hitchhiker's guide to concurrency](https://learnyousomeerlang.com/the-hitchhikers-guide-to-concurrency) — spawn, send and receive, and the chapters after it on links and supervisors.
- [Actor model](https://en.wikipedia.org/wiki/Actor_model) — the theory behind processes and mailboxes.
