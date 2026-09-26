// Fixture tests for the Python-subset interpreter (app/src/sims/py.js). Run: node scripts/test-py.mjs
// Expected outputs of the ordinary programs were produced by running them with CPython 3.11.
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const src = readFileSync(new URL('../src/sims/py.js', import.meta.url), 'utf8');
const sandbox = { window: {}, console, module: { exports: {} } };
vm.runInNewContext(src, sandbox);
const PY = sandbox.window.PY;

const cases = [
 {
  "name": "numbers and division",
  "code": "print(7 / 2, 7 // 2, -7 // 2, 7 % 3, -7 % 3, 7 % -3)\nprint(2 ** 100)\nprint(0.1 + 0.2, 1 / 3, 1e16, 1e-5, 123456789.0, 3.0, -0.0)\nprint(10 / 5, type(10 / 5), int(3.99), int(-3.99), round(2.5), round(3.5), round(2.675, 2))\nprint(float('1.5'), int('42'), int('ff', 16), abs(-3), divmod(17, 5), pow(2, 10, 1000))\nprint(True + True, 5 > 3 > 1, 1 < 3 > 2, 0.1 + 0.2 == 0.3)\nprint(max(3, 7, 5), min([4, 2, 9]), sum([1, 2, 3]), sum([0.5, 0.25]))",
  "expect": "3.5 3 -4 1 2 -2\n1267650600228229401496703205376\n0.30000000000000004 0.3333333333333333 1e+16 1e-05 123456789.0 3.0 -0.0\n2.0 <class 'float'> 3 -3 2 4 2.67\n1.5 42 255 3 (3, 2) 24\n2 True True False\n7 2 6 0.75\n"
 },
 {
  "name": "strings",
  "code": "s = \"bigdog\"\nprint(s[1], s[-2], s[2:4], s[2:], s[:4], s[-2:], s[2:-2], s[2:2], s[2:44], s[::-1], s[::2])\nprint(\"big\" + \"dog\", \"big\" * 3, len(s), \"dog\" in s)\nt = s[:2] + \"G\" + s[3:]\nprint(t, s.upper(), \" pad \".strip() + \"|\", \"a,b,,c\".split(\",\"), \"a b  c\".split())\nprint(\"-\".join([\"x\", \"y\", \"z\"]), s.replace(\"g\", \"G\"), s.find(\"dog\"), s.count(\"g\"), s.startswith(\"big\"))\nprint(repr(\"it's\"), repr('say \"hi\"'), repr(\"tab\\there\"), str(3.0), repr([1, \"a\", 2.5, None, True]))\npath = r\"C:\\new\\data\"\nprint(path, len(path))\nprint(\"\"\"Roses\nare red\"\"\")\nprint(f\"{3.14159:.2f} {42:5d}|{'x':>4}|{'y':<3}|{7:03d} {1234567:,} {0.25:.0%} {255:x} {255:#b}\")\nname, n = \"Ada\", 3\nprint(f\"{name!r} has {n} item{'s' if n != 1 else ''}\", f\"{n=}\", \"{} + {} = {}\".format(2, 3, 5), \"{1}{0}\".format(\"a\", \"b\"))\nprint(\"%d items cost %.2f (%s)\" % (3, 9.5, \"ok\"), \"%5s|%-5s|\" % (\"r\", \"l\"))",
  "expect": "i o gd gdog bigd og gd  gdog godgib bgo\nbigdog bigbigbig 6 True\nbiGdog BIGDOG pad| ['a', 'b', '', 'c'] ['a', 'b', 'c']\nx-y-z biGdoG 3 2 True\n\"it's\" 'say \"hi\"' 'tab\\there' 3.0 [1, 'a', 2.5, None, True]\nC:\\new\\data 11\nRoses\nare red\n3.14    42|   x|y  |007 1,234,567 25% ff 0b11111111\n'Ada' has 3 items n=3 2 + 3 = 5 ba\n3 items cost 9.50 (ok)     r|l    |\n"
 },
 {
  "name": "lists: mutability, aliasing, methods",
  "code": "a = [4, 6, 7, 99]\nb = a\nb.append(100)\nc = a[:]\nc.append(1)\nprint(a, b, c, a is b, a is c, a == a[:])\nmixed = [4, 93, \"bigdog\", 2]\nnested = [1, 2, 8, [\"foo\", \"boo\"], [12, 9]]\nnested[4] = 16\nnested[1:3] = [\"do\", \"not\"]\nprint(mixed, nested)\nx = [3, 1, 2]\nx.insert(1, 10); x.extend([7, 7]); x.remove(7)\nprint(x, x.pop(), x.pop(0), x.index(2), x.count(7))\nx.sort(); print(x); x.reverse(); print(x)\nprint(sorted([\"pear\", \"Fig\", \"apple\"]), sorted([\"pear\", \"Fig\", \"apple\"], key=str.lower), sorted([3, 1, 2], reverse=True))\nprint([n * n for n in range(6) if n % 2 == 0], [[r * c for c in range(3)] for r in range(2)])\nm = [[0] * 2] * 2\nm[0][0] = 5\nprint(m)",
  "expect": "[4, 6, 7, 99, 100] [4, 6, 7, 99, 100] [4, 6, 7, 99, 100, 1] True False True\n[4, 93, 'bigdog', 2] [1, 'do', 'not', ['foo', 'boo'], 16]\n[10, 1, 2] 7 3 2 0\n[1, 2, 10]\n[10, 2, 1]\n['Fig', 'apple', 'pear'] ['apple', 'Fig', 'pear'] [3, 2, 1]\n[0, 4, 16] [[0, 0, 0], [0, 1, 2]]\n[[5, 0], [5, 0]]\n"
 },
 {
  "name": "tuples, sets, dicts",
  "code": "t1 = \"Joe\", 43, \"Montreal\"\nl1 = [78.7, 26.33, 99.99]\nboth = t1, l1\nl1[1] = 0.0\nprint(both)\none = \"boo\",\nprint(one, (), type(one).__name__)\na, b, c = t1\nprint(b)\nfirst, *rest = [1, 2, 3, 4]\nprint(first, rest)\nx, y = 1, 2\nx, y = y, x\nprint(x, y)\ns = {3, 1, 2, 3}\nprint(s, len(s), 2 in s, {1, 2} | {2, 3}, {1, 2} & {2, 3}, {1, 2} - {2, 3}, set())\nd = {\"joe\": \"Montreal\", \"Sue\": \"Toronto\"}\nd[\"Mo\"] = \"Tokyo\"\ndel d[\"joe\"]\nprint(d, d.get(\"zz\"), d.get(\"zz\", \"none\"), \"Mo\" in d, len(d))\nprint(list(d.keys()), list(d.values()), list(d.items()))\nprint(d.keys(), d.values(), d.items())\ncounts = {}\nfor w in \"the cat the hat the\".split():\n    counts[w] = counts.get(w, 0) + 1\nprint(counts, {k: v for k, v in counts.items() if v > 1})\nd2 = dict(a=1, b=2); d2.update({\"c\": 3}); print(d2, d2.pop(\"a\"), d2)",
  "expect": "(('Joe', 43, 'Montreal'), [78.7, 0.0, 99.99])\n('boo',) () tuple\n43\n1 [2, 3, 4]\n2 1\n{1, 2, 3} 3 True {1, 2, 3} {2} {1} set()\n{'Sue': 'Toronto', 'Mo': 'Tokyo'} None none True 2\n['Sue', 'Mo'] ['Toronto', 'Tokyo'] [('Sue', 'Toronto'), ('Mo', 'Tokyo')]\ndict_keys(['Sue', 'Mo']) dict_values(['Toronto', 'Tokyo']) dict_items([('Sue', 'Toronto'), ('Mo', 'Tokyo')])\n{'the': 3, 'cat': 1, 'hat': 1} {'the': 3}\n{'b': 2, 'c': 3} 1 {'b': 2, 'c': 3}\n"
 },
 {
  "name": "errors from containers",
  "code": "d = {\"a\": 1}\ntry:\n    d[\"zz\"]\nexcept KeyError as e:\n    print(\"KeyError\", e)\ntry:\n    [1, 2][5]\nexcept IndexError as e:\n    print(e)\ntry:\n    s = \"abc\"; s[0] = \"X\"\nexcept TypeError as e:\n    print(e)\ntry:\n    {[1, 2]}\nexcept TypeError as e:\n    print(e)\ntry:\n    m, n = (1, 2, 3)\nexcept ValueError as e:\n    print(e)\ntry:\n    int(\"4.5\")\nexcept ValueError as e:\n    print(e)\ntry:\n    \"a\" + 1\nexcept TypeError as e:\n    print(e)",
  "expect": "KeyError 'zz'\nlist index out of range\n'str' object does not support item assignment\nunhashable type: 'list'\ntoo many values to unpack (expected 2)\ninvalid literal for int() with base 10: '4.5'\ncan only concatenate str (not \"int\") to str\n"
 },
 {
  "name": "deque, stack and queue",
  "code": "from collections import deque\nstack = [\"foo\", \"boo\"]\nstack.append(\"bat\"); stack.append(\"bar\")\nprint(stack.pop(), stack)\nq = deque([\"foo\", \"boo\"])\nq.append(\"bat\"); q.append(\"bar\")\nprint(q.popleft(), q)\nq.appendleft(\"x\"); q.rotate(1)\nprint(q, len(q))\nfrom collections import OrderedDict\nod = OrderedDict()\nod[\"one\"] = 1; od[\"three\"] = 3\nfor k, v in od.items():\n    print(k, v)",
  "expect": "bar ['foo', 'boo', 'bat']\nfoo deque(['boo', 'bat', 'bar'])\ndeque(['bar', 'x', 'boo', 'bat']) 4\none 1\nthree 3\n"
 },
 {
  "name": "control flow",
  "code": "total = 0\nfor i in range(10):\n    if i == 7:\n        break\n    if i % 2:\n        continue\n    total += i\nelse:\n    print(\"no break\")\nprint(total)\nfor i in range(3):\n    pass\nelse:\n    print(\"loop ended normally\", i)\nn = 5\nwhile n > 0:\n    n -= 2\nprint(n)\nx = 15\nif x < 0:\n    print(\"neg\")\nelif x < 10:\n    print(\"small\")\nelse:\n    print(\"big\")\nprint(list(range(4, 8)), list(range(4, 20, 5)), list(range(5, 0, -2)))\nprint(0 or \"default\", \"\" and \"x\", None or 0 or [], 3 and 4)\nfor i, w in enumerate([\"a\", \"b\"], 1):\n    print(i, w)\nfor p, q in zip(\"ab\", [1, 2, 3]):\n    print(p, q)",
  "expect": "12\nloop ended normally 2\n-1\nbig\n[4, 5, 6, 7] [4, 9, 14, 19] [5, 3, 1]\ndefault  [] 4\n1 a\n2 b\na 1\nb 2\n"
 },
 {
  "name": "functions: defaults, keywords, *args, **kwargs",
  "code": "def foo(num, text=\"test\", thing=43.5):\n    print(num, text, thing)\nfoo(1)\nfoo(2, \"x\")\nfoo(3, thing=7)\ndef total(*nums, scale=1, **opts):\n    return sum(nums) * scale, opts\nprint(total(1, 2, 3), total(4, scale=2, verbose=True))\ndef append_to(item, bucket=[]):\n    bucket.append(item)\n    return bucket\nprint(append_to(1), append_to(2))\ndef better(item, bucket=None):\n    if bucket is None:\n        bucket = []\n    bucket.append(item)\n    return bucket\nprint(better(1), better(2))\nboo = foo\nboo(9)\nsq = lambda x: x * x\nprint(sq(5), list(map(sq, [1, 2, 3])), list(filter(lambda v: v > 1, [0, 1, 2, 3])))\ndef f():\n    pass\nprint(f())",
  "expect": "1 test 43.5\n2 x 43.5\n3 test 7\n(6, {}) (8, {'verbose': True})\n[1, 2] [1, 2]\n[1] [2]\n9 test 43.5\n25 [1, 4, 9] [2, 3]\nNone\n"
 },
 {
  "name": "scope: global, nonlocal, closures",
  "code": "dog = \"house\"\ndef read():\n    return dog\ndef write_local():\n    dog = \"bone\"\n    return dog\ndef write_global():\n    global dog\n    dog = \"bone\"\nprint(read(), write_local(), dog)\nwrite_global()\nprint(dog)\ndef counter():\n    count = 0\n    def inc():\n        nonlocal count\n        count += 1\n        return count\n    return inc\nc1 = counter(); c2 = counter()\nprint(c1(), c1(), c2())\ndef make_multiplier(k):\n    return lambda x: x * k\ntriple = make_multiplier(3)\nprint(triple(7))\nx = 10\ndef broken():\n    print(x)\n    x = 5\ntry:\n    broken()\nexcept UnboundLocalError as e:\n    print(\"UnboundLocalError:\", e)",
  "expect": "house bone house\nbone\n1 2 1\n21\nUnboundLocalError: cannot access local variable 'x' where it is not associated with a value\n"
 },
 {
  "name": "classes: class and instance variables",
  "code": "class Foo:\n    x = 43\n    def __init__(self):\n        self.stuff = \"stuff\"\n    def get_x(self):\n        return self.x\na = Foo(); b = Foo()\nprint(a.get_x(), Foo.get_x(a), a.stuff)\nFoo.x = 50\nprint(a.x, b.x)\na.x = 7\nprint(a.x, b.x, Foo.x)\na.y = \"flop\"\nprint(a.y, hasattr(b, \"y\"))\nclass Counter:\n    count = 0\n    def __init__(self):\n        Counter.count += 1\nCounter(); Counter()\nprint(Counter.count)\nclass Shared:\n    items = []\n    def add(self, v):\n        self.items.append(v)\ns1 = Shared(); s2 = Shared(); s1.add(1)\nprint(s2.items)",
  "expect": "43 43 stuff\n50 50\n7 50 50\nflop False\n2\n[1]\n"
 },
 {
  "name": "inheritance, super, dunder methods",
  "code": "class Animal:\n    def __init__(self, name):\n        self.name = name\n    def speak(self):\n        return \"...\"\n    def __str__(self):\n        return f\"{self.name} says {self.speak()}\"\nclass Dog(Animal):\n    def __init__(self, name, tricks):\n        super().__init__(name)\n        self.tricks = tricks\n    def speak(self):\n        return \"woof\"\nclass Puppy(Dog):\n    def speak(self):\n        return super().speak() + \"!\"\nfor a in [Animal(\"gen\"), Dog(\"rex\", []), Puppy(\"bit\", [\"sit\"])]:\n    print(a)\nprint(isinstance(Puppy(\"p\", []), Animal), issubclass(Dog, Puppy), [c.__name__ for c in Puppy.__mro__])\nclass Vec:\n    def __init__(self, x, y):\n        self.x, self.y = x, y\n    def __add__(self, other):\n        return Vec(self.x + other.x, self.y + other.y)\n    def __mul__(self, k):\n        return Vec(self.x * k, self.y * k)\n    def __eq__(self, other):\n        return (self.x, self.y) == (other.x, other.y)\n    def __repr__(self):\n        return f\"Vec({self.x}, {self.y})\"\n    def __len__(self):\n        return 2\nv = Vec(1, 2) + Vec(3, 4)\nprint(v, v * 2, v == Vec(4, 6), len(v), [v])\nclass A:\n    def who(self): return \"A\"\nclass B(A):\n    def who(self): return \"B\" + super().who()\nclass C(A):\n    def who(self): return \"C\" + super().who()\nclass D(B, C):\n    def who(self): return \"D\" + super().who()\nprint(D().who(), [k.__name__ for k in D.__mro__])",
  "expect": "gen says ...\nrex says woof\nbit says woof!\nTrue False ['Puppy', 'Dog', 'Animal', 'object']\nVec(4, 6) Vec(8, 12) True 2 [Vec(4, 6)]\nDBCA ['D', 'B', 'C', 'A', 'object']\n"
 },
 {
  "name": "exceptions",
  "code": "def divide(a, b):\n    try:\n        r = a / b\n    except ZeroDivisionError:\n        print(\"cannot divide by zero\")\n        return None\n    else:\n        print(\"ok\")\n        return r\n    finally:\n        print(\"done\")\nprint(divide(1, 2))\nprint(divide(1, 0))\nclass InsufficientFunds(Exception):\n    pass\ndef withdraw(balance, amount):\n    if amount > balance:\n        raise InsufficientFunds(f\"need {amount - balance} more\")\n    return balance - amount\ntry:\n    withdraw(10, 25)\nexcept InsufficientFunds as e:\n    print(type(e).__name__, e, e.args)\ntry:\n    raise ValueError(\"bad\")\nexcept (TypeError, ValueError) as e:\n    print(\"caught\", repr(e))\ntry:\n    try:\n        1 / 0\n    except ZeroDivisionError:\n        raise\nexcept ArithmeticError as e:\n    print(\"outer\", e)",
  "expect": "ok\ndone\n0.5\ncannot divide by zero\ndone\nNone\nInsufficientFunds need 15 more ('need 15 more',)\ncaught ValueError('bad')\nouter division by zero\n"
 },
 {
  "name": "an uncaught exception stops the program",
  "code": "print(\"start\")\nd = {}\nprint(d[\"missing\"])\nprint(\"never\")",
  "expect": "start\n",
  "runtime": "KeyError",
  "errLine": 3
 },
 {
  "name": "recursion and memo",
  "code": "def fact(n):\n    return 1 if n == 0 else n * fact(n - 1)\nmemo = {}\ndef fib(n):\n    if n < 2:\n        return n\n    if n not in memo:\n        memo[n] = fib(n - 1) + fib(n - 2)\n    return memo[n]\nprint(fact(20), fib(60))",
  "expect": "2432902008176640000 1548008755920\n"
 },
 {
  "name": "modules, __name__ and packages",
  "files": {
   "geometry.py": "PI = 3.14159\ndef area(r):\n    return PI * r * r\ndef _helper():\n    return \"hidden\"\nprint(\"loading geometry as\", __name__)\nif __name__ == \"__main__\":\n    print(\"run directly\")\n",
   "shapes/__init__.py": "from shapes.square import side_area",
   "shapes/square.py": "def side_area(s):\n    return s * s\n"
  },
  "code": "import geometry\nimport geometry\nfrom geometry import area as a\nfrom shapes import side_area\nprint(geometry.area(2), a(1), geometry.PI, side_area(3))\nprint(__name__)\nimport math, sys\nprint(math.sqrt(16), math.floor(2.7), sys.argv[0])",
  "expect": "loading geometry as geometry\n12.56636 3.14159 3.14159 9\n__main__\n4.0 2 main.py\n"
 },
 {
  "name": "comprehensions and generator expressions",
  "code": "words = [\"apple\", \"bob\", \"kayak\", \"tree\"]\nprint([w for w in words if w == w[::-1]])\nprint({w: len(w) for w in words})\nprint({len(w) for w in words})\nprint(sum(x * x for x in range(5)))\nprint(max(words, key=len), sorted(words, key=lambda w: (len(w), w)))\nmatrix = [[1, 2], [3, 4]]\nprint([x for row in matrix for x in row], list(zip(*matrix)))",
  "expect": "['bob', 'kayak']\n{'apple': 5, 'bob': 3, 'kayak': 5, 'tree': 4}\n{3, 4, 5}\n30\napple ['bob', 'tree', 'apple', 'kayak']\n[1, 2, 3, 4] [(1, 3), (2, 4)]\n"
 },
 {
  "name": "equality and identity",
  "code": "a = [1, 2]\nb = [1, 2]\nc = a\nprint(a == b, a is b, a is c, None is None)\nx = 256; y = 256\nprint(x is y)\nt = (1, [2, 3])\nt[1].append(4)\nprint(t)\ntry:\n    t[0] = 9\nexcept TypeError as e:\n    print(e)",
  "expect": "True False True True\nTrue\n(1, [2, 3, 4])\n'tuple' object does not support item assignment\n"
 },
 {
  "name": "reference counts and gc.collect",
  "code": "import gc, sys\na = [1, 2]\nb = a\nprint(sys.getrefcount(a))\ndel b\nprint(sys.getrefcount(a))\nclass Node:\n    pass\nn1 = Node(); n2 = Node()\nn1.other = n2; n2.other = n1\ndel n1, n2\nprint(gc.collect())",
  "expect": "3\n2\n2\n"
 },
 {
  "name": "input() and a syntax error",
  "stdin": "Ada\n5\n",
  "code": "name = input(\"Name: \")\nn = int(input())\nprint(f\"{name} x{n * 2}\")",
  "expect": "Name: Ada\n5\nAda x10\n"
 },
 {
  "name": "syntax error is reported",
  "code": "def f(:\n    pass",
  "syntax": "SyntaxError"
 },
 {
  "name": "indentation error is reported",
  "code": "if True:\nprint(\"x\")",
  "syntax": "IndentationError"
 },
 {
  "name": "NameError",
  "code": "print(undefined_name)",
  "runtime": "NameError"
 },
 {
  "name": "review regressions: iterators, hashing, slices, formats, temporaries",
  "code": "class Node:\n    def __init__(self, v):\n        self.v = v\nnodes = [Node(i) for i in range(3)]\npair = [Node(10), Node(11)]\nprint([n.v for n in nodes], [p.v for p in pair])\nclass C:\n    def __init__(self): self.n = 0\n    def inc(self):\n        self.n += 1\n        return self.n\nm = C().inc\nprint(m(), m())\ndef make():\n    return [1, 2]\nx = make()\nit = iter([1, 2, 3]); next(it)\nprint(list(it), [v for v in iter(range(3))], list(map(str, iter([4, 5]))))\nclass P:\n    def __init__(self, v): self.v = v\n    def __eq__(self, o): return self.v == o.v\n    def __hash__(self): return hash(self.v)\nprint(len({P(1), P(1)}), P(1) in {P(1)})\nclass Q(P):\n    def __eq__(self, o): return True\ntry:\n    {Q(1)}\nexcept TypeError as e:\n    print(e)\na = [1, 2, 3]; a[-1:-1] = [9]; b = [1, 2, 3]; b[5:5] = [7]\nprint(a, b, f\"{2.0:.3}\", f\"{1234.5:.3}\", f\"{0.5:.2}\")\ndef f(): ...\nprint(f())\nfor q in [Node(5), Node(6)]:\n    print(q.v)\n",
  "expect": "[0, 1, 2] [10, 11]\n1 2\n[2, 3] [0, 1, 2] ['4', '5']\n1 True\nunhashable type: 'Q'\n[1, 2, 9, 3] [1, 2, 3, 7] 2.0 1.23e+03 0.5\nNone\n5\n6\n"
 },
 {
  "name": "package submodules",
  "files": {
   "shapes/__init__.py": "# package",
   "shapes/circle.py": "def area(r):\n    return 3 * r * r\n"
  },
  "code": "import shapes.circle\nprint(shapes.circle.area(2))\nfrom shapes import circle\nprint(circle.area(1))",
  "expect": "12\n3\n"
 },
 {
  "name": "a module-level exception keeps a frame list for the traceback",
  "code": "x = 1\nprint(1 / 0)",
  "runtime": "ZeroDivisionError",
  "errLine": 2,
  "stackArray": true
 },
 {
  "name": "a syntax error in an imported module names that module",
  "files": {
   "bad.py": "def f(:\n    pass"
  },
  "code": "import bad",
  "syntax": "SyntaxError",
  "errFile": 1
 },
 {
  "name": "CPython set order for int sets: literals, loops, operators",
  "code": "seen = set()\nfor n in [3, 1, 4, 1, 5, 9, 2, 6, 5, 3]:\n    seen.add(n)\nodd = {1, 3, 5, 7, 9}\nprint(seen, seen & odd, seen - odd, seen | {10}, {3, 1, 2, 3})\nprint({100, 5, 64, 33, 8, 1}, {-1, -5, 3, 0}, set(range(20, 0, -3)), {17, 9, 1, 25})\nprint({x * 7 for x in range(12)})",
  "expect": "{1, 2, 3, 4, 5, 6, 9} {1, 3, 5, 9} {2, 4, 6} {1, 2, 3, 4, 5, 6, 9, 10} {1, 2, 3}\n{64, 33, 1, 100, 5, 8} {0, 3, -1, -5} {2, 5, 8, 11, 14, 17, 20} {17, 1, 25, 9}\n{0, 35, 70, 7, 42, 77, 14, 49, 21, 56, 28, 63}\n"
 },
 {
  "name": "while/else and walrus",
  "code": "data = [3, 5, 8, 1]\ni = 0\nwhile i < len(data):\n    if data[i] > 6:\n        print(\"found\", data[i])\n        break\n    i += 1\nelse:\n    print(\"none\")\nif (n := len(data)) > 3:\n    print(n)",
  "expect": "found 8\n4\n"
 }
];

let failed = 0;
for (const c of cases) {
  const r = PY.run(c.code, c.stdin || '', { files: c.files, args: c.args, maxSteps: 20000 });
  const problems = [];
  if (c.expect !== undefined && r.out !== c.expect) problems.push('output ' + JSON.stringify(r.out) + '\n   expected ' + JSON.stringify(c.expect));
  if (c.syntax) { if (!r.error || r.error.name !== c.syntax) problems.push('expected ' + c.syntax + ', got ' + JSON.stringify(r.error)); else if (c.errFile !== undefined && r.error.file !== c.errFile) problems.push('error in file ' + r.error.file + ', expected ' + c.errFile); }
  else if (c.runtime) { if (!r.error || r.error.name !== c.runtime) problems.push('expected ' + c.runtime + ', got ' + JSON.stringify(r.error)); else if (c.errLine && r.error.line !== c.errLine) problems.push('error on line ' + r.error.line + ', expected ' + c.errLine); }
  else if (r.error) problems.push('unexpected error ' + JSON.stringify(r.error));
  if (!r.error && !r.trace.length) problems.push('empty trace');
  if (c.stackArray && !(r.error && Array.isArray(r.error.stack))) problems.push('error.stack is not an array of frames');
  if (problems.length) { failed++; console.log('FAIL ' + c.name + '\n  ' + problems.join('\n  ')); }
}
console.log(`${cases.length - failed}/${cases.length} passed`);
if (failed) process.exit(1);
