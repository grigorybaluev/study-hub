// Fixture tests for the Clojure-subset evaluator (app/src/sims/clj.js). Run: node scripts/test-clj.mjs
// Expected transcripts (the output, then "⇒ value" for each top-level form) were produced by Clojure 1.12.
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const src = readFileSync(new URL('../src/sims/clj.js', import.meta.url), 'utf8');
const sandbox = { window: {}, console, module: { exports: {} } };
vm.runInNewContext(src, sandbox);
const CLJ = sandbox.window.CLJ;

const cases = [
 {
  "name": "arithmetic, ratios, doubles, prefix notation",
  "code": "(+ 2 2)\n(- (+ 3 (* 2 4)) 1)\n(/ 10 4)\n(/ 2 1)\n(* 1.5 2)\n(/ 1.0 3)\n(quot 7 2) (rem -7 2) (mod -7 2)\n(= 1 1) (= 2 1) (not true)\n(max 3 9 4) (inc 41) (dec 0)\n(+ 0.1 0.2) 1e10 0.0001 1234567.0 12345678.0",
  "expect": "⇒ 4\n⇒ 10\n⇒ 5/2\n⇒ 2\n⇒ 3.0\n⇒ 0.3333333333333333\n⇒ 3\n⇒ -1\n⇒ 1\n⇒ true\n⇒ false\n⇒ false\n⇒ 9\n⇒ 42\n⇒ -1\n⇒ 0.30000000000000004\n⇒ 1.0E10\n⇒ 1.0E-4\n⇒ 1234567.0\n⇒ 1.2345678E7\n"
 },
 {
  "name": "return values of if, do, when and printing",
  "code": "(if (> 5 0) \"positive\" \"negative\")\n(if (< 5 0) \"negative\")\n(if (> 5 0) (do (println \"looks good\") \"positive\") (do (println \"looks bad\") \"negative\"))\n(when (> 5 0) (println \"looks good\") \"positive\")\n(if (if (println \"boo\") \"woo\") \"truthy\" \"falsey\")\n(print \"woo\" \"hoo\")\n(nil? nil) (nil? \"boo\")\n(if 0 \"0 is truthy\" \"0 is falsey\")\n(if \"\" \"empty string is truthy\" \"falsey\")",
  "expect": "⇒ \"positive\"\n⇒ nil\nlooks good\n⇒ \"positive\"\nlooks good\n⇒ \"positive\"\nboo\n⇒ \"falsey\"\nwoo hoo⇒ nil\n⇒ true\n⇒ false\n⇒ \"0 is truthy\"\n⇒ \"empty string is truthy\"\n"
 },
 {
  "name": "def, fn, defn, docstrings, arity, closures",
  "code": "(def x 42)\n(def hello (fn [] \"hello world\"))\n(hello)\n((fn [] \"hello world\"))\n(defn square \"Squares a number.\" [n] (* n n))\n(square 7)\n(defn greet ([] (greet \"world\")) ([who] (str \"hello, \" who)))\n(greet)\n(greet \"Ada\")\n(defn sum-all [& nums] (apply + nums))\n(sum-all 1 2 3 4)\n(defn make-adder [n] (fn [x] (+ x n)))\n(def add5 (make-adder 5))\n(add5 10)\n(map (make-adder 1) [1 2 3])\n(#(* % %) 6)\n(#(+ %1 %2) 3 4)",
  "expect": "⇒ #'user/x\n⇒ #'user/hello\n⇒ \"hello world\"\n⇒ \"hello world\"\n⇒ #'user/square\n⇒ 49\n⇒ #'user/greet\n⇒ \"hello, world\"\n⇒ \"hello, Ada\"\n⇒ #'user/sum-all\n⇒ 10\n⇒ #'user/make-adder\n⇒ #'user/add5\n⇒ 15\n⇒ (2 3 4)\n⇒ 36\n⇒ 7\n"
 },
 {
  "name": "maps, keywords, vectors, lists, sets",
  "code": "(def jobs {:john \"professor\" :sue \"doctor\" :ahmed \"astronaut\"})\n(get jobs :sue)\n(get jobs :Sue)\n(get jobs :bill \"not found\")\n(:john jobs)\n(def nest {:a \"eh\" :b {:dog \"fido\" :cat \"fluffy\"}})\n(get-in nest [:b :cat])\n(keys jobs) (vals jobs) (contains? jobs :sue)\n(def funcs {:f1 (fn [] (println \"func1\")) :f2 (fn [] (println \"func2\"))})\n((get funcs :f2))\n(def things [\"dog\" 2 (fn [] \"do something\")])\n(get things 0) (get things 10)\n'(1 2 3) (list 1 \"two\" [1 2 3])\n(nth '(1 2 3) 1)\n#{1 2 \"dog\" \"cat\"}\n(set '(1 1 2 2))\n(set [\"dog\" \"cat\" \"dog\"])\n(get #{1 2 3 :a} 3) (:a #{1 2 3 :a}) (contains? #{1 2 3} 2)\n{:a 1 :b 2 :c 3 :d 4 :e 5 :f 6 :g 7 :h 8 :i 9}\n(hash-map :x 1 :y 2 :z 3)",
  "expect": "⇒ #'user/jobs\n⇒ \"doctor\"\n⇒ nil\n⇒ \"not found\"\n⇒ \"professor\"\n⇒ #'user/nest\n⇒ \"fluffy\"\n⇒ (:john :sue :ahmed)\n⇒ (\"professor\" \"doctor\" \"astronaut\")\n⇒ true\n⇒ #'user/funcs\nfunc2\n⇒ nil\n⇒ #'user/things\n⇒ \"dog\"\n⇒ nil\n⇒ (1 2 3)\n⇒ (1 \"two\" [1 2 3])\n⇒ 2\n⇒ #{\"dog\" 1 2 \"cat\"}\n⇒ #{1 2}\n⇒ #{\"dog\" \"cat\"}\n⇒ 3\n⇒ :a\n⇒ true\n⇒ {:e 5, :g 7, :c 3, :h 8, :b 2, :d 4, :f 6, :i 9, :a 1}\n⇒ {:y 2, :z 3, :x 1}\n"
 },
 {
  "name": "immutability: conj and assoc return new values",
  "code": "(def foo1 '(1 2 3))\n(conj foo1 0)\nfoo1\n(def foo2 (conj foo1 0))\nfoo2\n(conj [1 2 3] 0)\n(def v [1 2 3])\n(assoc v 1 \"dog\")\nv\n(def m {:a 1})\n(assoc m :b 2)\n(dissoc (assoc m :b 2) :a)\nm\n(update {:count 1} :count inc)\n(assoc-in {:a {:b 1}} [:a :c] 2)",
  "expect": "⇒ #'user/foo1\n⇒ (0 1 2 3)\n⇒ (1 2 3)\n⇒ #'user/foo2\n⇒ (0 1 2 3)\n⇒ [1 2 3 0]\n⇒ #'user/v\n⇒ [1 \"dog\" 3]\n⇒ [1 2 3]\n⇒ #'user/m\n⇒ {:a 1, :b 2}\n⇒ {:b 2}\n⇒ {:a 1}\n⇒ {:count 2}\n⇒ {:a {:b 1, :c 2}}\n"
 },
 {
  "name": "sequence functions and laziness",
  "code": "(first [4 6 2 1]) (rest [4 6 2 1]) (last [4 6 2 1])\n(cons 3 [4 2 5 2])\n(take 2 [4 3 6 7]) (drop 2 [4 3 6 7])\n(take-while even? [2 4 5 6 7]) (drop-while even? [2 4 5 6 7])\n(take-while #(< % 5) [3 1 4 6 7])\n(some even? [3 4 5 6 7]) (some even? [3 5 7])\n(concat [1 6 7] '(23 24))\n(sort [4 5 2 7]) (sort [\"d\" \"ab\" \"a\"]) (sort #(> %1 %2) [3 1 4 6 7])\n(vector '(1 2 3 4)) (into [] '(1 2 3 4))\n(map inc [1 2 3]) (filter odd? (range 10)) (reduce + [1 2 3 4 5])\n(reduce (fn [acc x] (conj acc (* x x))) [] [1 2 3])\n(first (range 1000000))\n(take 5 (iterate #(* 2 %) 1))\n(take 3 (repeat \"x\"))\n(mapv #(* 10 %) [1 2 3])\n(frequencies \"mississippi\")\n(group-by even? [1 2 3 4 5])\n(distinct [1 2 1 3 2])\n(apply max [3 8 2])\n((partial + 10) 5)\n((comp inc #(* 2 %)) 5)\n(for [x (range 4) :when (odd? x)] (* x x))",
  "expect": "⇒ 4\n⇒ (6 2 1)\n⇒ 1\n⇒ (3 4 2 5 2)\n⇒ (4 3)\n⇒ (6 7)\n⇒ (2 4)\n⇒ (5 6 7)\n⇒ (3 1 4)\n⇒ true\n⇒ nil\n⇒ (1 6 7 23 24)\n⇒ (2 4 5 7)\n⇒ (\"a\" \"ab\" \"d\")\n⇒ (7 6 4 3 1)\n⇒ [(1 2 3 4)]\n⇒ [1 2 3 4]\n⇒ (2 3 4)\n⇒ (1 3 5 7 9)\n⇒ 15\n⇒ [1 4 9]\n⇒ 0\n⇒ (1 2 4 8 16)\n⇒ (\"x\" \"x\" \"x\")\n⇒ [10 20 30]\n⇒ {\\m 1, \\i 4, \\s 4, \\p 2}\n⇒ {false [1 3 5], true [2 4]}\n⇒ (1 2 3)\n⇒ 8\n⇒ 15\n⇒ 11\n⇒ (1 9)\n"
 },
 {
  "name": "recursion, loop/recur and destructuring",
  "code": "(defn flip [numbers] (if (empty? numbers) [] (conj (flip (rest numbers)) (first numbers))))\n(flip [1 2 3 4])\n(defn sum [items] (if (empty? items) 0 (+ (first items) (sum (rest items)))))\n(sum [1 2 3 4 5])\n(defn sum-loop [items] (loop [xs items acc 0] (if (empty? xs) acc (recur (rest xs) (+ acc (first xs))))))\n(sum-loop (range 1 101))\n(defn fact ([n] (fact n 1)) ([n acc] (if (zero? n) acc (recur (dec n) (* acc n)))))\n(fact 20)\n(let [[a b & more] [1 2 3 4 5]] [a b more])\n(let [{:keys [name age]} {:name \"Ada\" :age 36}] (str name \" is \" age))\n(defn count-down [n] (when (pos? n) (println n) (recur (dec n))))\n(count-down 3)",
  "expect": "⇒ #'user/flip\n⇒ [4 3 2 1]\n⇒ #'user/sum\n⇒ 15\n⇒ #'user/sum-loop\n⇒ 5050\n⇒ #'user/fact\n⇒ 2432902008176640000\n⇒ [1 2 (3 4 5)]\n⇒ \"Ada is 36\"\n⇒ #'user/count-down\n3\n2\n1\n⇒ nil\n"
 },
 {
  "name": "namespaces, privacy and clojure.string",
  "code": "(ns myproj.core (:require [clojure.string :as str]))\n(str/upper-case \"abc\")\n(str/trim \"   abc \")\n(str/join \", \" [1 2 3])\n(defn- helper [y] (* y y y))\n(helper 3)\n(defn public-api [x] (helper x))\n(public-api 2)",
  "expect": "⇒ nil\n⇒ \"ABC\"\n⇒ \"abc\"\n⇒ \"1, 2, 3\"\n⇒ #'myproj.core/helper\n⇒ 27\n⇒ #'myproj.core/public-api\n⇒ 8\n"
 },
 {
  "name": "atoms, futures, agents and refs",
  "code": "(def my-atom (atom 4))\n(deref my-atom)\n@my-atom\n(swap! my-atom + 4)\n(reset! my-atom 0)\n(def counter (atom 0))\n(def workers (doall (map (fn [_] (future (swap! counter inc))) (range 5))))\n(doseq [w workers] @w)\n@counter\n(def my-agent (agent 4))\n(await (send my-agent + 2))\n@my-agent\n(def account1 (ref 100))\n(def account2 (ref 200))\n(dosync (alter account1 - 10) (alter account2 + 10))\n[@account1 @account2]\n(def my-future (future (Thread/sleep 50) (println \"boo hoo\") 44.5))\n@my-future",
  "expect": "⇒ #'user/my-atom\n⇒ 4\n⇒ 4\n⇒ 8\n⇒ 0\n⇒ #'user/counter\n⇒ #'user/workers\n⇒ nil\n⇒ 5\n⇒ #'user/my-agent\n⇒ nil\n⇒ 6\n⇒ #'user/account1\n⇒ #'user/account2\n⇒ 210\n⇒ [90 210]\n⇒ #'user/my-future\nboo hoo\n⇒ 44.5\n"
 },
 {
  "name": "errors: arity, unresolved symbol, class cast, divide by zero, overflow, no transaction",
  "code": "(defn f [a b] (+ a b))\n(f 1)",
  "error": "ArityException",
  "message": "Wrong number of args (1) passed to: user/f"
 },
 {
  "name": "unresolved symbol is a compile error",
  "code": "(+ undefined-thing 1)",
  "error": "RuntimeException",
  "message": "Unable to resolve symbol: undefined-thing in this context",
  "syntax": true
 },
 {
  "name": "adding a string to a number",
  "code": "(+ 1 \"2\")",
  "error": "ClassCastException"
 },
 {
  "name": "integer division by zero",
  "code": "(/ 1 0)",
  "error": "ArithmeticException",
  "message": "Divide by zero"
 },
 {
  "name": "long overflow",
  "code": "(* 9223372036854775807 2)",
  "error": "ArithmeticException",
  "message": "long overflow"
 },
 {
  "name": "alter outside a transaction",
  "code": "(def r (ref 1))\n(alter r inc)",
  "error": "IllegalStateException",
  "message": "No transaction running"
 },
 {
  "name": "a slow swap! function interleaves, and swap! retries",
  "code": "(def a (atom 0))\n(defn slow-add [v n] (Thread/sleep 5) (+ v n))\n(def f1 (future (swap! a slow-add 10)))\n(def f2 (future (swap! a slow-add 20)))\n@f1 @f2 @a",
  "lastValue": "30",
  "note": "swap! retry"
 },
 {
  "name": "transactions retry when they conflict",
  "code": "(def acc (ref 0))\n(defn slow-inc [v] (Thread/sleep 5) (inc v))\n(def ts (doall (map (fn [_] (future (dosync (alter acc slow-inc)))) (range 3))))\n(doseq [t ts] @t)\n@acc",
  "lastValue": "3",
  "note": "transaction retry"
 },
 {
  "name": "review regressions: syntax-quote macros, redefining a var, :while, lazy for",
  "code": "(defmacro unless [c & body] `(if ~c nil (do ~@body)))\n(unless false (println \"ran\") 1)\n(def x 1)\n(def x (inc x))\nx\n(for [x [1 5 2] :while (< x 3)] x)\n(for [x (range) :while (< x 3)] x)\n(take 3 (for [x (range)] (* x x)))\n(doseq [x [1 5 2] :while (< x 3)] (println x))\n(for [x [1 2] y [10 20] :when (odd? x)] (+ x y))\n",
  "expect": "⇒ #'user/unless\nran\n⇒ 1\n⇒ #'user/x\n⇒ #'user/x\n⇒ 2\n⇒ (1)\n⇒ (0 1 2)\n⇒ (0 1 4)\n1\n⇒ nil\n⇒ (11 21)\n"
 },
 {
  "name": "review regressions: printing through threads, future errors, commute, lazy concat/distinct/zipmap, destructuring, ##Inf, compare, lazy-seq",
  "code": "(println (map (fn [x] (Thread/sleep 5) x) [1 2]))\n(println (map deref [(future (Thread/sleep 50) 1) (future 2)]))\n(def f (future (/ 1 0)))\n(+ 1 2)\n(def r (ref 0))\n(def ts (doall (map (fn [_] (future (dosync (commute r inc)))) (range 3))))\n(doseq [t ts] @t)\n@r\n(take 3 (concat [1] (range)))\n(take 3 (distinct (range)))\n(zipmap [:a :b :c] (range))\n(let [[a b] (range)] [a b])\n(let [[x & xs] (iterate inc 5)] [x (take 2 xs)])\n(let [{:keys [a b] :or {b 7}} {:a 1}] [a b])\n(/ 1.0 0)\n(compare \"a\" \"c\")\n(compare \\a \\d)\n(compare :a :c)\n(name :a/b)\n(defn nat [n] (lazy-seq (cons n (nat (inc n)))))\n(take 3 (nat 0))\n",
  "expect": "(1 2)\n⇒ nil\n(1 2)\n⇒ nil\n⇒ #'user/f\n⇒ 3\n⇒ #'user/r\n⇒ #'user/ts\n⇒ nil\n⇒ 3\n⇒ (1 0 1)\n⇒ (0 1 2)\n⇒ {:a 0, :b 1, :c 2}\n⇒ [0 1]\n⇒ [5 (6 7)]\n⇒ [1 7]\n⇒ ##Inf\n⇒ -2\n⇒ -3\n⇒ -2\n⇒ \"b\"\n⇒ #'user/nat\n⇒ (0 1 2)\n"
 },
 {
  "name": "a lazy cell is realized once even when two threads force it",
  "code": "(def xs (map (fn [x] (println \"computing\" x) (* x 10)) [1 2]))\n(def a (future (doall xs)))\n(def b (future (doall xs)))\n@a @b (count xs)",
  "lastValue": "2",
  "outputCount": [
   "computing 1",
   1
  ]
 },
 {
  "name": "commute does not make transactions retry",
  "code": "(def r (ref 0))\n(def ts (doall (map (fn [_] (future (dosync (commute r inc)))) (range 3))))\n(doseq [t ts] @t)\n@r",
  "lastValue": "3",
  "noNote": "retry"
 },
 {
  "name": "the step view never realizes an infinite sequence",
  "code": "(def nats (iterate inc 0))\n(take 3 nats)",
  "lastValue": "(0 1 2)"
 }
];

let failed = 0;
for (const c of cases) {
  const r = CLJ.run(c.code, { maxSteps: 200000 });
  let t = '', at = 0;
  for (const x of r.results) { t += r.out.slice(at, x.outAt) + '⇒ ' + x.value + '\n'; at = x.outAt; }
  t += r.out.slice(at);
  const problems = [];
  if (c.expect !== undefined && t !== c.expect) problems.push('transcript\n' + t + '   expected\n' + c.expect);
  if (c.error) { if (!r.error || r.error.cls !== c.error) problems.push('expected ' + c.error + ', got ' + JSON.stringify(r.error)); else { if (c.message && r.error.message !== c.message) problems.push('message ' + JSON.stringify(r.error.message)); if (c.syntax && r.error.kind !== 'syntax') problems.push('expected a compile error'); } }
  else if (r.error) problems.push('unexpected error ' + JSON.stringify(r.error));
  if (c.lastValue && (!r.results.length || r.results[r.results.length - 1].value !== c.lastValue)) problems.push('last value ' + (r.results.length ? r.results[r.results.length - 1].value : 'none') + ', expected ' + c.lastValue);
  if (c.note && !r.notes.some(n => n.s.includes(c.note))) problems.push('no note containing ' + c.note);
  if (c.noNote && r.notes.some(n => n.s.includes(c.noNote))) problems.push('unexpected note containing ' + c.noNote);
  if (c.outputCount && r.out.split(c.outputCount[0]).length - 1 !== c.outputCount[1]) problems.push(JSON.stringify(c.outputCount[0]) + ' printed ' + (r.out.split(c.outputCount[0]).length - 1) + ' times');
  if (!r.error && !r.trace.length) problems.push('empty trace');
  if (problems.length) { failed++; console.log('FAIL ' + c.name + '\n  ' + problems.join('\n  ')); }
}
console.log(`${cases.length - failed}/${cases.length} passed`);
if (failed) process.exit(1);
