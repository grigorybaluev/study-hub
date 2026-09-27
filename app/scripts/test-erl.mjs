// Fixture tests for the Erlang stepper (app/src/sims/erl.js). Run: node scripts/test-erl.mjs
// Expected transcripts (the output, then each shell result) were produced by Erlang/OTP 29 (erl -oldshell);
// pids are compared as <PID>, and a module that does not compile as its first error.
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const src = readFileSync(new URL('../src/sims/erl.js', import.meta.url), 'utf8');
const sandbox = { window: {}, console, module: { exports: {} } };
vm.runInNewContext(src, sandbox);
const ERL = sandbox.window.ERL;

const cases = [
 {
  "name": "numbers and arithmetic",
  "shell": "2 + 3 * 4.\n10 / 4.\n10 div 4.\n-7 rem 2.\n2 * 3.5.\n1/3.\n0.1 + 0.2.\n3.0e10.\n1.0e-5.\n123456789 * 987654321 * 1000000007.\n1.5e300 * 1.0e10.\n100000.0.\n1234567.0.\n16#FF.\n$a.\n5 == 5.0.\n5 =:= 5.0.\n1 < a.\n{1,2} < [1].\nabs(-3).\n",
  "expect": "14\n2.5\n2\n-1\n7.0\n0.3333333333333333\n0.30000000000000004\n3.0e10\n1.0e-5\n121932631966163686788446883\n** exception error: an error occurred when evaluating an arithmetic expression\n     in operator  */2\n        called as 1.5e300 * 1.0e10\n1.0e5\n1234567.0\n255\n97\ntrue\nfalse\ntrue\ntrue\n3\n"
 },
 {
  "name": "atoms, tuples, lists, strings",
  "shell": "hello.\n'Hello world'.\n{point, 3, 4}.\nelement(2, {a, b, c}).\ntuple_size({a, b, c}).\n[1, 2 | [3]].\n\"abc\".\n[72, 105].\n[1, \"two\", three].\n\"abc\" ++ \"def\".\n[1,2,3,2] -- [2].\nlength([a, b, c]).\nhd([1,2,3]).\ntl([1,2,3]).\n[].\n\"\".\n[$h, $i].\nis_atom(ok).\nis_list(\"x\").\natom_to_list(hello).\nlist_to_atom(\"hi there\").\n",
  "expect": "hello\n'Hello world'\n{point,3,4}\nb\n3\n[1,2,3]\n\"abc\"\n\"Hi\"\n[1,\"two\",three]\n\"abcdef\"\n[1,3,2]\n3\n1\n[2,3]\n[]\n[]\n\"hi\"\ntrue\ntrue\n\"hello\"\n'hi there'\n"
 },
 {
  "name": "pattern matching in the shell",
  "shell": "X = 5.\nX = 5.\nX = 6.\n{A, B} = {1, 2}.\nA + B.\n[H | T] = [10, 20, 30].\nH.\nT.\n{ok, Val} = {error, oops}.\n[First, Second | _] = \"hello\".\nFirst.\n{_, _, Z} = {1, 2, 3}.\nZ.\nPoint = {point, 1, 2}.\n{point, PX, PY} = Point.\nPX * PY.\nY.\n",
  "expect": "5\n5\n** exception error: no match of right hand side value 6\n{1,2}\n3\n[10,20,30]\n10\n[20,30]\n** exception error: no match of right hand side value {error,oops}\n\"hello\"\n104\n{1,2,3}\n3\n{point,1,2}\n{point,1,2}\n2\n* 1:1: variable 'Y' is unbound\n"
 },
 {
  "name": "errors in the shell",
  "shell": "1/0.\n1 div 0.\na + 1.\n-foo.\nfoo(.\n{1, Y}.\nZ = 3, Z + W.\nfun(A) -> A + B end.\nZ.\n1.5e300 * 1.0e10.\n0.0001. 0.001. 1000000.0. 10000.0. 123456.0. 1.0e21. 0.0025. -0.0.\nthrow(oops).\nerror(my_reason).\nexit(bye).\ncatch throw(oops).\n",
  "expect": "** exception error: an error occurred when evaluating an arithmetic expression\n     in operator  '/'/2\n        called as 1 / 0\n** exception error: an error occurred when evaluating an arithmetic expression\n     in operator  div/2\n        called as 1 div 0\n** exception error: an error occurred when evaluating an arithmetic expression\n     in operator  +/2\n        called as a + 1\n** exception error: an error occurred when evaluating an arithmetic expression\n     in operator  -/1\n        called as - foo\n* 1:5: syntax error before: '.'\n* 1:5: variable 'Y' is unbound\n* 1:12: variable 'W' is unbound\n* 1:15: variable 'B' is unbound\n* 1:1: variable 'Z' is unbound\n** exception error: an error occurred when evaluating an arithmetic expression\n     in operator  */2\n        called as 1.5e300 * 1.0e10\n0.0001\n0.001\n1.0e6\n1.0e4\n123456.0\n1.0e21\n0.0025\n-0.0\n** exception throw: oops\n** exception error: my_reason\n** exception exit: bye\noops\n"
 },
 {
  "name": "module: functions, guards, recursion",
  "code": "-module(geo).\n-export([area/1, fact/1, len/1, sum/1, classify/1, max_of/1]).\n\narea({square, Side}) -> Side * Side;\narea({rectangle, W, H}) -> W * H;\narea({circle, R}) -> 3.14159 * R * R.\n\nfact(0) -> 1;\nfact(N) when N > 0 -> N * fact(N - 1).\n\nlen([]) -> 0;\nlen([_ | T]) -> 1 + len(T).\n\nsum(L) -> sum(L, 0).\nsum([], Acc) -> Acc;\nsum([H | T], Acc) -> sum(T, Acc + H).\n\nclassify(N) when N < 0 -> negative;\nclassify(0) -> zero;\nclassify(N) when is_integer(N) -> positive.\n\nmax_of([H | T]) -> max_of(T, H).\nmax_of([], M) -> M;\nmax_of([H | T], M) when H > M -> max_of(T, H);\nmax_of([_ | T], M) -> max_of(T, M).\n",
  "shell": "geo:area({square, 4}).\ngeo:area({circle, 1.0}).\ngeo:area({triangle, 1, 2}).\ngeo:fact(10).\ngeo:fact(30).\ngeo:fact(-1).\ngeo:len(\"hello\").\ngeo:sum([1,2,3,4]).\ngeo:sum(1, 2).\ngeo:classify(-5).\ngeo:classify(7).\ngeo:classify(2.5).\ngeo:max_of([3, 9, 2]).\ngeo:nosuch(1).\nnosuch:f(1).\n",
  "expect": "16\n3.14159\n** exception error: no function clause matching geo:area({triangle,1,2}) (geo.erl:4)\n3628800\n265252859812191058636308480000000\n** exception error: no function clause matching geo:fact(-1) (geo.erl:8)\n5\n10\n** exception error: undefined function geo:sum/2\nnegative\npositive\n** exception error: no function clause matching geo:classify(2.5) (geo.erl:18)\n9\n** exception error: undefined function geo:nosuch/1\n** exception error: undefined function nosuch:f/1\n"
 },
 {
  "name": "funs, lists module, comprehensions",
  "shell": "Double = fun(X) -> 2 * X end.\nDouble(21).\nlists:map(Double, [1, 2, 3]).\nlists:filter(fun(X) -> X rem 2 =:= 0 end, lists:seq(1, 10)).\nlists:foldl(fun(X, Acc) -> X + Acc end, 0, [1, 2, 3, 4]).\nlists:foldr(fun(X, Acc) -> [X | Acc] end, [], [a, b, c]).\nlists:reverse([1, 2, 3]).\nlists:sort([3, 1, 2]).\nlists:sort(fun(A, B) -> A > B end, [3, 1, 2]).\nlists:sum([1, 2, 3]).\nlists:max([4, 9, 2]).\nlists:nth(2, [a, b, c]).\nlists:member(b, [a, b, c]).\nlists:zip([1, 2], [a, b]).\nlists:append([[1], [2, 3]]).\nlists:flatten([1, [2, [3, 4]]]).\nlists:keyfind(bob, 1, [{alice, 30}, {bob, 25}]).\nlists:seq(10, 1, -3).\nlists:split(2, [a, b, c, d]).\nlists:duplicate(3, x).\nlists:all(fun(X) -> X > 0 end, [1, 2]).\nlists:any(fun(X) -> X > 5 end, [1, 2]).\n[X * X || X <- [1, 2, 3, 4], X > 2].\n[{X, Y} || X <- [1, 2], Y <- [a, b]].\n[X || {X, ok} <- [{1, ok}, {2, error}, {3, ok}]].\nAdder = fun(N) -> fun(X) -> X + N end end.\nAdd5 = Adder(5).\nAdd5(10).\nF = fun(0) -> zero; (N) when N > 0 -> positive; (_) -> negative end.\n[F(-1), F(0), F(3)].\nFact = fun Fact(0) -> 1; Fact(N) -> N * Fact(N - 1) end.\nDouble(1, 2).\n",
  "expect": "#Fun<>\n42\n[2,4,6]\n[2,4,6,8,10]\n10\n[a,b,c]\n[3,2,1]\n[1,2,3]\n[3,2,1]\n6\n9\nb\ntrue\n[{1,a},{2,b}]\n[1,2,3]\n[1,2,3,4]\n{bob,25}\n[10,7,4,1]\n{[a,b],[c,d]}\n[x,x,x]\ntrue\nfalse\n[9,16]\n[{1,a},{1,b},{2,a},{2,b}]\n[1,3]\n#Fun<>\n#Fun<>\n15\n#Fun<>\n[negative,zero,positive]\n#Fun<>\n** exception error: interpreted function with arity 1 called with two arguments\n"
 },
 {
  "name": "case, if, try, maps, records-free",
  "shell": "Grade = fun(S) -> if S >= 90 -> a; S >= 80 -> b; true -> c end end.\n[Grade(95), Grade(85), Grade(10)].\nDescribe = fun(T) -> case T of {ok, V} -> {got, V}; {error, R} when is_atom(R) -> {failed, R}; _ -> unknown end end.\nDescribe({ok, 42}).\nDescribe({error, timeout}).\nDescribe(what).\ncase 5 of 1 -> one end.\nif 1 > 2 -> yes end.\ntry 1 / 0 catch error:badarith -> divided_by_zero end.\ntry throw(boom) catch throw:X -> {caught, X} end.\ntry exit(stop) catch exit:R -> {exit, R} end.\ntry error(bad) catch C:R -> {C, R} end.\ntry 10 of N when N > 5 -> big; _ -> small catch _:_ -> error end.\nM = #{name => \"Ada\", age => 36}.\nmaps:get(name, M).\nmaps:get(email, M, none).\nM#{age := 37}.\nM#{email => \"ada@example.org\"}.\n#{name := Name} = M.\nName.\nmaps:keys(M).\nmaps:to_list(M).\nmaps:put(x, 1, #{}).\nmaps:find(age, M).\nmaps:is_key(zzz, M).\nmap_size(M).\nmaps:get(email, M).\n",
  "expect": "#Fun<>\n[a,b,c]\n#Fun<>\n{got,42}\n{failed,timeout}\nunknown\n** exception error: no case clause matching 5\n** exception error: no true branch found when evaluating an if expression\ndivided_by_zero\n{caught,boom}\n{exit,stop}\n** exception error: bad\nbig\n#{name => \"Ada\",age => 36}\n\"Ada\"\nnone\n#{name => \"Ada\",age => 37}\n#{name => \"Ada\",age => 36,email => \"ada@example.org\"}\n#{name => \"Ada\",age => 36}\n\"Ada\"\n[name,age]\n[{name,\"Ada\"},{age,36}]\n#{x => 1}\n{ok,36}\nfalse\n2\n** exception error: bad key: email\n     in function  maps:get/2\n        called as maps:get(email,#{name => \"Ada\",age => 36})\n        *** argument 1: not present in map\n"
 },
 {
  "name": "io:format",
  "shell": "io:format(\"hello~n\").\nio:format(\"~p ~p~n\", [atom, \"string\"]).\nio:format(\"~w~n\", [\"string\"]).\nio:format(\"~s is ~b years~n\", [\"Ada\", 36]).\nio:format(\"~.2f~n\", [3.14159]).\nio:format(\"~5b|~-5b|~n\", [42, 42]).\nio:format(\"~p~n\", [[{a, 1}, {b, [1, 2]}]]).\nio:format(\"~c~c~n\", [$o, $k]).\nio:format(\"~~ tilde~n\").\nio:format(\"~p~n\", [#{k => v}]).\nio:format(\"~s~n\", [hello]).\nio:format(\"~p ~p~n\", [1]).\n",
  "expect": "hello\nok\natom \"string\"\nok\n[115,116,114,105,110,103]\nok\nAda is 36 years\nok\n3.14\nok\n   42|42   |\nok\n[{a,1},{b,[1,2]}]\nok\nok\nok\n~ tilde\nok\n#{k => v}\nok\nhello\nok\n** exception error: bad argument\n     in function  io:format/2\n        called as io:format(\"~p ~p~n\",[1])\n        *** argument 1: wrong number of arguments\n"
 },
 {
  "name": "processes: ping-pong, counter server, registered names",
  "code": "-module(proc).\n-export([echo/0, counter/1, start_counter/0, ask/2, pinger/2, ponger/0, crash/0]).\n\necho() ->\n    receive\n        {From, Msg} -> From ! {self(), Msg}, echo();\n        stop -> io:format(\"echo stopping~n\")\n    end.\n\ncounter(N) ->\n    receive\n        {inc, By} -> counter(N + By);\n        {get, From} -> From ! {count, N}, counter(N);\n        stop -> {stopped, N}\n    end.\n\nstart_counter() ->\n    Pid = spawn(proc, counter, [0]),\n    register(counter, Pid),\n    Pid.\n\nask(Server, Msg) ->\n    Server ! {Msg, self()},\n    receive\n        {count, N} -> N\n    after 1000 -> timeout\n    end.\n\npinger(0, Ponger) ->\n    Ponger ! finished,\n    io:format(\"pinger done~n\");\npinger(N, Ponger) ->\n    Ponger ! {ping, self()},\n    receive\n        pong -> io:format(\"pinger got pong~n\")\n    end,\n    pinger(N - 1, Ponger).\n\nponger() ->\n    receive\n        finished -> io:format(\"ponger done~n\");\n        {ping, From} -> io:format(\"ponger got ping~n\"), From ! pong, ponger()\n    end.\n\ncrash() -> 1 / 0.\n",
  "shell": "E = spawn(proc, echo, []).\nis_pid(E).\nE ! {self(), hello}.\nreceive {E, Reply} -> Reply end.\nE ! stop.\ntimer:sleep(10).\nis_process_alive(E).\nC = proc:start_counter().\ncounter ! {inc, 5}.\ncounter ! {inc, 2}.\nproc:ask(counter, get).\nwhereis(counter) =:= C.\nPo = spawn(proc, ponger, []).\nPi = spawn(proc, pinger, [2, Po]), timer:sleep(50).\nself() ! first, self() ! second, self() ! {third, 3}.\nreceive second -> got_second end.\nflush().\nreceive X -> X after 100 -> nothing end.\nS = self().\nspawn(fun() -> S ! {child, 6 * 7} end).\nreceive {child, V} -> V end.\nnobody ! hi.\n",
  "expect": "<PID>\ntrue\n{<PID>,hello}\nhello\necho stopping\nstop\nok\nfalse\n<PID>\n{inc,5}\n{inc,2}\n7\ntrue\n<PID>\nponger got ping\npinger got pong\nponger got ping\npinger got pong\npinger done\nponger done\nok\n{third,3}\ngot_second\nShell got first\nShell got {third,3}\nok\nnothing\n<PID>\n<PID>\n42\n** exception error: bad argument\n     in operator  !/2\n        called as nobody ! hi\n"
 },
 {
  "name": "pretty printing long terms",
  "shell": "lists:seq(1,30).\nlists:seq(1,60).\n[{alice,30},{bob,25},{carol,41},{dave,19},{eve,33},{frank,50},{grace,28}].\n{a_long_atom_name,another_long_atom_name,yet_another_long_atom,and_one_more_atom_here}.\n#{name => \"Ada Lovelace\", born => 1815, field => mathematics, known_for => \"the first program\"}.\n\"a very long string that goes on and on and on and on past the eighty column limit of the shell\".\n[[1,2,3],[4,5,6],[7,8,9],[10,11,12],[13,14,15],[16,17,18],[19,20,21],[22,23,24]].\nio:format(\"~p~n\", [lists:seq(1,30)]).\nio:format(\"result: ~p~n\", [[{alice,30},{bob,25},{carol,41},{dave,19},{eve,33},{frank,50},{grace,28}]]).\n{ok, [{temperature, 21.5}, {humidity, 40}, {wind, {12, north}}, {rain, false}], \"station one\"}.\n[{1,2},{3,4}|tail].\nlists:seq(1,40) ++ foo.\n[lists:seq(1,10), lists:seq(1,35)].\n{lists:seq(1,40)}.\n{point, lists:seq(1, 25), lists:seq(1, 25)}.\n[[a, b], [c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, r, s, t, u, v, w, x, y, z, aa, bb, cc, dd]].\n",
  "expect": "[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,\n 23,24,25,26,27,28,29|...]\n[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,\n 23,24,25,26,27,28,29|...]\n[{alice,30},\n {bob,25},\n {carol,41},\n {dave,19},\n {eve,33},\n {frank,50},\n {grace,28}]\n{a_long_atom_name,another_long_atom_name,\n                  yet_another_long_atom,and_one_more_atom_here}\n#{name => \"Ada Lovelace\",field => mathematics,born => 1815,\n  known_for => \"the first program\"}\n\"a very long string that goes on and on and on and on past the eighty column limit of the shell\"\n[[1,2,3],\n [4,5,6],\n [7,8,9],\n \"\\n\\v\\f\",\n [13,14,15],\n [16,17,18],\n [19,20,21],\n [22,23,24]]\n[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,\n 29,30]\nok\nresult: [{alice,30},\n         {bob,25},\n         {carol,41},\n         {dave,19},\n         {eve,33},\n         {frank,50},\n         {grace,28}]\nok\n{ok,[{temperature,21.5},\n     {humidity,40},\n     {wind,{12,north}},\n     {rain,false}],\n    \"station one\"}\n[{1,2},{3,4}|tail]\n[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,\n 23,24,25,26,27,28,29|...]\n[[1,2,3,4,5,6,7,8,9,10],\n [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,\n  23,24,25,26,27|...]]\n{[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,\n  23,24,25,26,27,28|...]}\n{point,[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,\n        21,22,23,24,25],\n       [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,\n        23,24,25]}\n[[a,b],\n [c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z,aa,bb,cc|...]]\n"
 },
 {
  "name": "unbound in module",
  "code": "-module(m1).\n-export([f/1]).\nf(X) ->\n    Y = X + 1,\n    Y + Z.\n",
  "shell": "ok.\n",
  "expect": "COMPILE: m1.erl:5:9: variable 'Z' is unbound\n"
 },
 {
  "name": "undefined local function",
  "code": "-module(m2).\n-export([f/1]).\nf(X) -> helper(X) + 1.\n",
  "shell": "ok.\n",
  "expect": "COMPILE: m2.erl:3:9: function helper/1 undefined\n"
 },
 {
  "name": "exported but undefined",
  "code": "-module(m3).\n-export([f/1, g/0]).\nf(X) -> X.\n",
  "shell": "ok.\n",
  "expect": "COMPILE: m3.erl:2:2: function g/0 undefined\n"
 },
 {
  "name": "syntax error in module",
  "code": "-module(m4).\n-export([f/1]).\nf(X) -> X + .\n",
  "shell": "ok.\n",
  "expect": "COMPILE: m4.erl:3:13: syntax error before: '.'\n"
 },
 {
  "name": "missing end",
  "code": "-module(m5).\n-export([f/1]).\nf(X) ->\n    case X of\n        1 -> one\n    .\n",
  "shell": "ok.\n",
  "expect": "COMPILE: m5.erl:6:5: syntax error before: '.'\n"
 },
 {
  "name": "records in a module",
  "code": "-module(m6).\n-export([new/2, older/1, name/1]).\n-record(person, {name, age = 0, email}).\nnew(N, A) -> #person{name = N, age = A}.\nolder(P = #person{age = A}) -> P#person{age = A + 1}.\nname(#person{name = N}) -> N.\n",
  "shell": "P = m6:new(\"Ada\", 36).\nm6:older(P).\nm6:name(P).\nelement(1, P).\n",
  "expect": "{person,\"Ada\",36,undefined}\n{person,\"Ada\",37,undefined}\n\"Ada\"\nperson\n"
 },
 {
  "name": "a tail-recursive server handles many messages",
  "code": "-module(tc).\n-export([loop/1, count_down/1, len/1]).\nloop(N) ->\n    receive\n        {add, X} -> loop(N + X);\n        {get, From} -> From ! {total, N}, loop(N)\n    end.\ncount_down(0) -> done;\ncount_down(N) -> count_down(N - 1).\nlen([]) -> 0;\nlen([_ | T]) -> 1 + len(T).\n",
  "shell": "P = spawn(tc, loop, [0]).\nlists:foreach(fun(_) -> P ! {add, 1} end, lists:seq(1, 1500)).\nP ! {get, self()}, receive {total, T} -> T end.\ntc:count_down(3000).\ntc:len(lists:seq(1, 200)).\n",
  "expect": "<PID>\nok\n1500\ndone\n200\n"
 },
 {
  "name": "review: try-of, shadowing, catch forms, fun refs",
  "shell": "try 1 of X -> throw(a) catch throw:a -> caught end.\nX = 1, F = fun(X) -> X * 2 end, F(5).\nY = 1, [Y || Y <- [1,2,3]].\ntry error(x) catch error:R:S -> R end.\ncatch exit(x).\ncatch throw(t).\nlists:map(fun erlang:abs/1, [-1, 2]).\nlists:map(fun lists:reverse/1, [[1, 2]]).\ntry nomod:f() catch error:undef -> caught end.\nround(-2.5). round(-0.5). round(2.5). round(7).\n#{age => 1, name => 2} < #{age => 2, name => 1}.\n",
  "expect": "** exception throw: a\n10\n[1,2,3]\nx\n{'EXIT',x}\nt\n[1,2]\n[[2,1]]\ncaught\n-3\n-1\n3\n7\ntrue\n"
 },
 {
  "name": "review: bad arguments to BIFs",
  "shell": "tuple_size(3).\nelement(1.0, {a}).\nelement(5, {a}).\nsetelement(5, {a}, b).\n1 band 1.0.\nbnot 1.5.\natom_to_list(5).\ninteger_to_list(a).\nhd([]).\nlength(a).\nlist_to_atom(5).\nabs(a).\nmaps:put(a, 1, x).\nnot 3.\n",
  "expect": "** exception error: bad argument\n     in function  tuple_size/1\n        called as tuple_size(3)\n        *** argument 1: not a tuple\n** exception error: bad argument\n     in function  element/2\n        called as element(1.0,{a})\n        *** argument 1: not an integer\n** exception error: bad argument\n     in function  element/2\n        called as element(5,{a})\n        *** argument 1: out of range\n** exception error: bad argument\n     in function  setelement/3\n        called as setelement(5,{a},b)\n        *** argument 1: out of range\n** exception error: an error occurred when evaluating an arithmetic expression\n     in operator  band/2\n        called as 1 band 1.0\n** exception error: an error occurred when evaluating an arithmetic expression\n     in operator  bnot/1\n        called as bnot 1.5\n** exception error: bad argument\n     in function  atom_to_list/1\n        called as atom_to_list(5)\n        *** argument 1: not an atom\n** exception error: bad argument\n     in function  integer_to_list/1\n        called as integer_to_list(a)\n        *** argument 1: not an integer\n** exception error: bad argument\n     in function  hd/1\n        called as hd([])\n        *** argument 1: not a nonempty list\n** exception error: bad argument\n     in function  length/1\n        called as length(a)\n        *** argument 1: not a list\n** exception error: bad argument\n     in function  list_to_atom/1\n        called as list_to_atom(5)\n        *** argument 1: not a list\n** exception error: bad argument\n     in function  abs/1\n        called as abs(a)\n        *** argument 1: not a number\n** exception error: bad map: x\n     in function  maps:put/3\n        called as maps:put(a,1,x)\n        *** argument 3: not a map\n** exception error: bad argument\n     in operator  not/1\n        called as not 3\n"
 },
 {
  "name": "review: register, error reasons, format, escapes, f()",
  "shell": "register(foo, 5).\nregister(foo, self()), register(foo, self()).\nP = spawn(fun() -> ok end), timer:sleep(5), register(bar, P).\nunregister(nobody).\nQ = spawn(fun() -> receive stop -> ok end end), register(baz, Q), baz ! stop, timer:sleep(10), R2 = spawn(fun() -> receive _ -> ok end end), register(baz, R2).\nlists:member(baz, registered()).\nerror(badarg).\nerror({badmatch, 1}).\nerror({case_clause, x}).\nerror(if_clause).\nerror(badarith).\nerror({badkey, k}).\nio:format(\"~f~n\", [1]).\nio:format(\"~s~n\", [5]).\nio:format(\"~e~n\", [1.0]).\nio:format(\"~tp ~ts~n\", [abc, \"h\\x{e9}llo\"]).\n\"\\e[0m \\x41\\x{42} \\101 \\s\\d\".\n$\\n.\nA1 = 1.\nf(A1).\nA1 = 2.\nf().\nA1.\n",
  "expect": "** exception error: bad argument\n     in function  register/2\n        called as register(foo,5)\n        *** argument 2: not a pid or port\n** exception error: bad argument\n     in function  register/2\n        called as register(foo,<PID>)\n        *** argument 2: this process or port already has a name\n** exception error: bad argument\n     in function  register/2\n        called as register(bar,<PID>)\n        *** argument 2: the pid does not refer to an existing process\n** exception error: bad argument\n     in function  unregister/1\n        called as unregister(nobody)\n        *** argument 1: not a pid\ntrue\ntrue\n** exception error: bad argument\n** exception error: no match of right hand side value 1\n** exception error: no case clause matching x\n** exception error: no true branch found when evaluating an if expression\n** exception error: an error occurred when evaluating an arithmetic expression\n** exception error: bad key: k\n** exception error: bad argument\n     in function  io:format/2\n        called as io:format(\"~f~n\",[1])\n        *** argument 2: element 1 must be of type float\n** exception error: bad argument\n     in function  io:format/2\n        called as io:format(\"~s~n\",[5])\n        *** argument 2: element 1 must be of type string\n1.00000e+0\nok\nabc héllo\nok\n[27,91,48,109,32,65,66,32,65,32,32,127]\n10\n1\nok\n2\nok\n* 1:1: variable 'A1' is unbound\n"
 },
 {
  "name": "review: tail calls in orelse, module scope",
  "code": "-module(n).\n-export([member/2, app/1, f/0, fac/1]).\nmember(_, []) -> false;\nmember(X, [H | T]) -> X =:= H orelse member(X, T).\napp(F) -> F().\nhelper() -> secret.\nhidden() -> ok.\nf() -> n:hidden().\nfac(0) -> 1;\nfac(N) -> N * fac(N - 1).\n",
  "shell": "n:member(0, lists:seq(1, 400)).\nn:member(7, lists:seq(1, 400)).\nn:app(fun() -> helper() end).\nn:f().\nn:fac(20).\n",
  "expect": "false\ntrue\n** exception error: undefined shell command helper/0\n** exception error: undefined function n:hidden/0\n2432902008176640000\n"
 },
 {
  "name": "review: unsafe variable in a module",
  "code": "-module(u).\n-export([f/1]).\nf(X) ->\n    case X of 1 -> Y = a; 2 -> ok end,\n    Y.\n",
  "shell": "ok.\n",
  "expect": "COMPILE: u.erl:5:5: variable 'Y' unsafe in 'case' (line 4, column 5)\n"
 },
 {
  "name": "selective receive leaves the unmatched message in the mailbox",
  "shell": "self() ! {other, 1}, self() ! wanted.\nreceive wanted -> ok end.\n",
  "skipped": true
 },
 {
  "name": "an endless loop stops at the step limit",
  "code": "-module(inf).\n-export([spin/0]).\nspin() -> spin().\n",
  "shell": "inf:spin().\n",
  "error": "steps"
 },
 {
  "name": "deep non-tail recursion stops with a clear message",
  "code": "-module(d).\n-export([len/1]).\nlen([]) -> 0;\nlen([_ | T]) -> 1 + len(T).\n",
  "shell": "d:len(lists:seq(1, 1000)).\nok.\n",
  "valueIncludes": "not tail calls"
 },
 {
  "name": "shared: an interleaving loses an update",
  "mode": "shared",
  "shared": {
   "balance": 100
  },
  "threads": {
   "A": [
    "t = balance",
    "t = t + 50",
    "balance = t"
   ],
   "B": [
    "u = balance",
    "u = u - 30",
    "balance = u"
   ]
  },
  "schedule": "ABABAB",
  "final": {
   "balance": 70
  }
 },
 {
  "name": "shared: a lock keeps both updates",
  "mode": "shared",
  "shared": {
   "balance": 100
  },
  "threads": {
   "A": [
    "lock m",
    "t = balance",
    "t = t + 50",
    "balance = t",
    "unlock m"
   ],
   "B": [
    "lock m",
    "u = balance",
    "u = u - 30",
    "balance = u",
    "unlock m"
   ]
  },
  "schedule": "ABAB",
  "final": {
   "balance": 120
  }
 },
 {
  "name": "shared: a schedule of multi-letter names",
  "mode": "shared",
  "shared": {
   "balance": 100
  },
  "threads": {
   "T1": [
    "a = balance",
    "a = a + 50",
    "balance = a"
   ],
   "T2": [
    "b = balance",
    "b = b - 30",
    "balance = b"
   ]
  },
  "schedule": "T1 T2 T1 T2 T1 T2",
  "final": {
   "balance": 70
  }
 },
 {
  "name": "shared: two locks taken in opposite orders deadlock",
  "mode": "shared",
  "shared": {
   "a": 1,
   "b": 2
  },
  "threads": {
   "A": [
    "lock x",
    "lock y",
    "a = a + b",
    "unlock y",
    "unlock x"
   ],
   "B": [
    "lock y",
    "lock x",
    "b = a + b",
    "unlock x",
    "unlock y"
   ]
  },
  "schedule": "ABAB",
  "deadlock": true
 }
];

const norm = s => s.replace(/<0\.\d+\.0>/g, '<PID>').replace(/#Fun<[^>]*>/g, '#Fun<>');
let failed = 0;
for (const c of cases) {
  const problems = [];
  if (c.mode === 'shared') {
    const r = ERL.runShared(c);
    if (c.final && JSON.stringify(r.final) !== JSON.stringify(c.final)) problems.push('final ' + JSON.stringify(r.final));
    if (!!c.deadlock !== r.deadlock) problems.push('deadlock ' + r.deadlock);
  } else {
    const r = ERL.run({ code: c.code || '', shell: c.shell, maxSteps: 20000 });
    let t = '';
    if (r.error && r.error.kind === 'compile') t = 'COMPILE: ' + r.error.message + '\n';
    else { let at = 0; for (const x of r.results) { t += r.out.slice(at, x.outAt) + x.value + '\n'; at = x.outAt; } t += r.out.slice(at); }
    t = norm(t);
    if (c.expect !== undefined && t !== c.expect) problems.push('transcript\n' + t + '   expected\n' + c.expect);
    if (c.error && !(r.error && r.error.message.includes(c.error))) problems.push('expected an error mentioning ' + c.error + ', got ' + JSON.stringify(r.error));
    if (!c.error && r.error && r.error.kind !== 'compile') problems.push('unexpected error ' + JSON.stringify(r.error));
    if (c.valueIncludes && !r.results.some(x => x.value.includes(c.valueIncludes))) problems.push('no result mentioning ' + c.valueIncludes);
    if (c.skipped && !r.trace.some(s => s.view.procs.some(p => p.skipped > 0))) problems.push('no step shows a skipped message');
    if (!r.trace.length && !(r.error && r.error.kind === 'compile')) problems.push('empty trace');
  }
  if (problems.length) { failed++; console.log('FAIL ' + c.name + '\n  ' + problems.join('\n  ')); }
}
console.log(`${cases.length - failed}/${cases.length} passed`);
if (failed) process.exit(1);
