---
title: "Erlang basics: single assignment, pattern matching, and functions in modules"
order: 16
status: detailed
weeks: [12]
introduces: [pattern-matching]
requires:
  - {concept: functional-programming, strength: hard}
  - {concept: recursion, strength: hard}
  - {concept: higher-order-function, strength: soft}
reinforces:
  - {concept: functional-programming, perspective: "Erlang: variables bound once, and clauses chosen by matching"}
  - {concept: higher-order-function, perspective: "Erlang: fun … end, the lists module and list comprehensions"}
  - {concept: recursion, perspective: "Erlang: accumulators and tail calls that run in constant space"}
  - {concept: modular-programming, perspective: "Erlang: modules, -export and -import, erlc and erl"}
---

Erlang as a functional language built for systems that must not stop: the shell and the BEAM
virtual machine, values and variables that are bound once, pattern matching as the way to take data
apart, tuples, lists, maps and records, and functions written as clauses in modules.

## A language for systems that keep running

Erlang was designed at Ericsson in the late 1980s for telephone switches: systems with huge numbers
of simultaneous connections that must keep working when parts of them fail. It has been open source
since 1998 and runs services with millions of users (WhatsApp is the best-known example). Its two
strengths are **massive concurrency** — hundreds of thousands of lightweight processes — and **fault
tolerance**. This unit covers the sequential language; the next one covers the processes.

Like Java, Erlang compiles to bytecode for a virtual machine, the **BEAM** (`.erl` sources become
`.beam` files). Other languages run on the BEAM too, notably Elixir. There are two ways to run
Erlang code:

- the interactive shell, **Eshell** (`erl`), which reads expressions and prints their values;
- compiled modules, built with `erlc` and started with `erl`.

Erlang is functional, like Clojure, but its syntax is not Lisp's. Arithmetic is written as usual,
`2 * 4`, and function calls look like C's: `area(Shape)`.

## Values and variables

In the shell, every expression ends with a **full stop** (and a newline). Forgetting it is the most
common beginner's mistake: the shell just waits for more input. The basic values:

- **Integers** of any size: there is no overflow, only more digits.
- **Floats**, stored as doubles. `/` always gives a float; `div` and `rem` divide integers.
- **Atoms**: constants that stand for themselves, written in lower case (`ok`, `error`, `celsius`),
  or in single quotes when they contain other characters (`'New York'`). `true` and `false` are atoms.
- **Strings** in double quotes. They are lists of character codes, so `"abc"` is `[97,98,99]`, and
  the shell prints a list of printable codes as a string.

A **variable** starts with a capital letter or `_`, and can be bound **only once**. `Speed = 88`
binds `Speed`. After that, `Speed = 90` does not change anything: it fails, because `=` is not an
assignment (see below).

```sim
id: erl-348-shell
custom: true
engine: erl
shell: |
  2 + 3 * 4.
  7 / 2.
  7 div 2.
  1000000 * 1000000 * 1000000.
  celsius.
  {temperature, 21.5, celsius}.
  Speed = 88.
  Speed + 12.
  Speed = 90.
  speed = 88.
note: 'Integers never overflow. Speed = 90 fails because Speed is already 88: a variable is bound once. speed (lower case) is an atom, not a variable, so speed = 88 compares the atom speed with 88 and fails as well.'
```

## Pattern matching

:::definition[Pattern matching]
A **pattern** is a term that may contain unbound variables. **Matching** a value against a pattern
succeeds when the value has the pattern's shape and agrees with its constants and already-bound
variables; the unbound variables are then bound to the corresponding parts of the value. When the
match fails, nothing is bound.
:::

`Pattern = Expression` is Erlang's **match operator**. It evaluates the right-hand side and matches
the value against the pattern on the left. With a single unbound variable on the left this looks like
assignment; with a structure on the left it takes a value apart in one step:

- `{sensor, Where, Value} = Reading` binds `Where` and `Value` if `Reading` is a three-element tuple
  whose first element is the atom `sensor`.
- `_` matches anything and binds nothing: it marks a part you do not need.
- If the value does not fit, the match raises `no match of right hand side value …`.

```sim
id: erl-348-matching
custom: true
engine: erl
shell: |
  Reading = {sensor, "roof", 21.5}.
  {sensor, Where, Value} = Reading.
  Where.
  Value.
  {sensor, _, Temp} = Reading.
  {alarm, _, _} = Reading.
  [First | Rest] = [3, 1, 4, 1, 5].
  First.
  Rest.
  [A, B | _] = Rest.
  {A, B}.
  "ro" ++ Tail = "roof".
  Tail.
note: 'The atom sensor in the pattern must equal the first element of the tuple, so {alarm, _, _} = Reading fails. [First | Rest] splits a list into its head and its tail; [A, B | _] takes the first two elements of Rest and ignores the rest. A string is a list, so "ro" ++ Tail matches a prefix.'
```

Matching is everywhere in Erlang: in `=`, in choosing which clause of a function runs, in `case`
expressions, and in receiving messages. It replaces most of the field access and `if` tests of other
languages.

## Data structures

**Tuples** hold a fixed number of values: `{sensor, "roof", 21.5}`. They play the part of C structs,
but the fields have no names, only positions. By convention, the first element is an atom that says
what the tuple is (a **tag**), so functions can match on it. `element(2, T)` reads a field by position.

**Lists** hold any number of values of any type: `[3, 1, 4]`, `[ok, "two", {3}]`. A list is a head
and a tail: `[H | T]` builds one (put `H` in front of `T`) and, as a pattern, takes one apart. The
`lists` module has the usual functions: `lists:reverse/1`, `lists:sort/1`, `lists:append/2`,
`lists:delete/2`, `lists:split/2`, `lists:nth/2` and many more.

**Maps** associate keys with values: `#{dune => 3, emma => 1}`. `=>` adds or replaces a key; `:=`
only updates a key that is already there (and fails otherwise). Like everything in Erlang, a map
never changes: an update returns a new map. The `maps` module reads and transforms them
(`maps:get/2,3`, `maps:put/3`, `maps:keys/1`, `maps:to_list/1`).

**Records** give names to the fields of a tuple. They are declared in a module (or in a header file,
`.hrl`, pulled in with `-include("book.hrl").`, much like a C header), with optional default values:

:::syntax[Records]
```erlang
-record(Name, {Field1, Field2 = Default, …}).   % declaration, in a module or .hrl file

#Name{Field1 = Expr, …}                          % create a record
Expr#Name.Field                                  % read a field
Expr#Name{Field = Expr, …}                       % a copy with some fields changed
#Name{Field = Pattern, …} = Expr                 % match fields in a pattern
```

- A record is compiled into a tuple whose first element is the record name, and that tuple is what
  the shell prints.
- Fields left out when creating take their default; a field with no default is the atom `undefined`.
:::

In the module below, `-record(book, {title, author, available = true})` declares a book whose
`available` field defaults to `true`, so `#book{title = "Dune", author = "Herbert"}` is the tuple
`{book,"Dune","Herbert",true}`.

```sim
id: erl-348-records-maps
custom: true
engine: erl
code: |
  -module(library).
  -export([new_book/2, borrow/1, title/1]).
  -record(book, {title, author, available = true}).

  new_book(Title, Author) -> #book{title = Title, author = Author}.

  borrow(B = #book{available = true}) -> {ok, B#book{available = false}};
  borrow(#book{}) -> {error, already_out}.

  title(#book{title = T}) -> T.
shell: |
  B = library:new_book("Dune", "Herbert").
  {ok, Out} = library:borrow(B).
  library:borrow(Out).
  library:title(Out).
  Stock = #{dune => 3, emma => 1}.
  maps:get(dune, Stock).
  Stock#{emma := 0}.
  Stock#{ulysses => 2}.
  Stock.
note: 'The first clause of borrow only matches a book whose available field is true; a borrowed book falls through to the second clause. B = #book{…} in the head both checks the record and names the whole value. The map updates each return a new map: Stock itself never changes.'
```

## Functions

A function is one or more **clauses**, each a head (the name and a pattern for each parameter) and a
body. Clauses are separated by semicolons, and the whole function ends with a full stop. A call runs
the **first clause whose patterns match** the arguments (and whose guard is true); if none matches,
the call fails with `function_clause`.

:::syntax[Function clauses]
```erlang
name(Pattern1, …) when Guard -> Expr1, Expr2, …, ExprN;
name(Pattern1, …) -> …;
name(Pattern1, …) -> ….
```

- Commas separate the expressions of a body; the value of the last one is the function's value.
  There is no `return`.
- Semicolons separate clauses; the full stop ends the function.
- A **guard** (`when …`) adds a test the patterns cannot express: comparisons, arithmetic, type tests
  such as `is_integer(X)`. A comma in a guard means *and*, a semicolon *or*.
- The number of parameters is part of the name: `area/1` and `area/2` are different functions.
  Functions of different arities are separate definitions, each ended by a full stop.
:::

```sim
id: erl-348-functions
custom: true
engine: erl
code: |
  -module(shapes).
  -export([area/1, perimeter/1, total_area/1, count/1]).

  area({square, Side}) -> Side * Side;
  area({rect, W, H}) -> W * H;
  area({circle, R}) -> 3.14159 * R * R.

  perimeter({square, Side}) -> 4 * Side;
  perimeter({rect, W, H}) when W > 0, H > 0 -> 2 * (W + H).

  total_area(Shapes) -> total_area(Shapes, 0).

  total_area([], Acc) -> Acc;
  total_area([S | Rest], Acc) -> total_area(Rest, Acc + area(S)).

  count([]) -> 0;
  count([_ | Rest]) -> 1 + count(Rest).
shell: |
  shapes:area({rect, 3, 4}).
  shapes:area({circle, 1}).
  shapes:perimeter({rect, -1, 2}).
  shapes:total_area([{square, 2}, {rect, 1, 5}]).
  shapes:count([a, b, c]).
  shapes:total_area([], 0).
note: 'Each call runs the first clause that matches. perimeter({rect, -1, 2}) matches no clause because of the guard. Step through count: the frames pile up, because 1 + count(Rest) still has work to do after the call. total_area/2 passes the running total along, so its recursive call is the last thing it does and the frame is reused. total_area/2 is not exported, so the shell cannot call it.'
```

### Recursion, accumulators and tail calls

Erlang has no loops: repetition is recursion, usually over a list with a clause for `[]` and a
clause for `[H | T]`. `count/1` above is **body recursive**: after the recursive call returns it
still has to add 1, so every call keeps a frame. `total_area/2` carries the partial result in an
extra parameter, an **accumulator**, and its recursive call is the **last** thing it does, a **tail
call**. Erlang reuses the frame for a tail call, so a tail-recursive function runs in constant
space, however long the list — which is how a server can loop forever (next unit). A wrapper with
fewer parameters, like `total_area/1`, supplies the accumulator's starting value.

### Printing

`io:format/2` (or its synonym `io:fwrite/2`) prints like C's `printf`, with `~` instead of `%` and
the values in a list: `~w` writes a term, `~p` writes it the way the shell prints it (strings as
strings, long terms on several lines), `~s` writes a string or atom as text, `~.2f` a float with two
decimals, and `~n` a newline. A string printed with `~w` comes out as its list of character codes.
Printing returns the atom `ok`.

## Functions as values

`fun (Params) -> Body end` is an anonymous function; it can have several clauses, like a named one.
`fun area/1` refers to an existing function. The `lists` module supplies the higher-order functions:
`lists:map/2`, `lists:filter/2`, `lists:foldl/3` (Clojure's `reduce`) and `lists:foreach/2`, which
applies a function for its side effect. **List comprehensions** combine a map and a filter:
`[Expr || X <- List, Condition]`.

```sim
id: erl-348-funs
custom: true
engine: erl
shell: |
  Double = fun(X) -> 2 * X end.
  lists:map(Double, [1, 2, 3]).
  lists:filter(fun(X) -> X rem 2 =:= 0 end, lists:seq(1, 10)).
  lists:foldl(fun(X, Sum) -> X + Sum end, 0, [1, 2, 3, 4]).
  [X * X || X <- lists:seq(1, 6), X rem 2 =:= 1].
  Greet = fun(Name) -> io:format("hello, ~s~n", [Name]) end.
  lists:foreach(Greet, ["Ada", "Alan"]).
  io:format("~w and ~p~n", ["hi", "hi"]).
  MakeAdder = fun(N) -> fun(X) -> X + N end end.
  (MakeAdder(10))(5).
note: 'lists:foldl passes each element and the running total to the fun. foreach and io:format return ok after printing. ~w writes the string "hi" as its character codes, ~p as a string. MakeAdder returns a closure that remembers N.'
```

## Modules

Code lives in **modules**, one per file: the module `shapes` is `shapes.erl`. Lines starting with a
dash are **attributes**:

- `-module(shapes).` names the module.
- `-export([area/1, perimeter/1]).` lists the functions other modules may call, by name and arity.
  Everything else is private to the module.
- `-import(lists, [map/2]).` lets the module write `map(F, L)` instead of `lists:map(F, L)`. It does
  not load or grant anything — any exported function can be called with its module prefix — and most
  Erlang code prefers the prefix, which shows where each function comes from.

A function in another module is called with the module name and a colon, `shapes:area(S)`. Modules
are found on the **code path**, a list of directories holding `.beam` files that includes the current
directory. `erl -pa Dir` (or `code:add_patha(Dir)` in the shell) adds a directory, much like a Java
class path entry; the `ERL_LIBS` environment variable names extra library roots, whose applications'
`ebin` directories are added.

```bash
erlc shapes.erl                               # compile: writes shapes.beam
erl -noshell -s shapes main -s init stop      # run shapes:main(), then stop the VM
erl -noshell -run shapes main input.txt -s init stop   # -run passes arguments as strings
```

In the shell, `c(shapes).` compiles and loads a module in one step.

::::exercise[What does the shell print?]
```erlang
{X, Y} = {ok, [1, 2]}.
[H | T] = Y.
T.
Z = {X, H}.
{ok, H} = Z.
length(Y) + H.
{error, _} = Z.
```

:::solution
```text
{ok,[1,2]}
[1,2]
[2]
{ok,1}
{ok,1}
3
** exception error: no match of right hand side value {ok,1}
```

A match returns the value of its right-hand side. `{ok, H} = Z` succeeds because `H` is already 1,
which agrees with `Z`; it binds nothing new. The last match fails because `Z` is tagged `ok`.
:::
::::

::::exercise[Clauses and guards]
Write a function `size_class/1` that returns `small` for a number below 10, `large` for any other
number, and `not_a_number` for anything that is not a number. Then write `sum/1` for a list of
numbers with an accumulator, so that its recursive call is a tail call.

:::solution
```erlang
size_class(N) when is_number(N), N < 10 -> small;
size_class(N) when is_number(N) -> large;
size_class(_) -> not_a_number.

sum(L) -> sum(L, 0).
sum([], Acc) -> Acc;
sum([H | T], Acc) -> sum(T, Acc + H).
```

The clauses are tried in order, so the second one only sees numbers of 10 or more. `sum/2` does all
its work before the recursive call, which is therefore the last thing it does.
:::
::::

:::insight
Erlang binds each variable once and takes data apart by pattern matching: in `=`, in the clauses of
a function, in `case` and in `receive`. Tuples tagged with atoms, lists split into head and tail, maps
and records carry the data; functions are clauses chosen by matching, and loops are recursion, with
tail calls that run in constant space.
:::

## Further reading

- [Erlang: getting started](https://www.erlang.org/doc/system/getting_started.html) — the official tutorial, from the shell to modules.
- [Learn You Some Erlang for Great Good!](https://learnyousomeerlang.com/content) — a free book; the chapters on syntax in functions and recursion fit this unit.
- [Pattern matching](https://en.wikipedia.org/wiki/Pattern_matching) — the idea across languages.
- [Erlang reference manual: records](https://www.erlang.org/doc/system/ref_man_records.html) — declaration, creation, access and matching.
