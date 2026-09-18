// Fixture tests for the Java-subset interpreter (app/src/sims/java.js). Run: node scripts/test-java.mjs
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const src = readFileSync(new URL('../src/sims/java.js', import.meta.url), 'utf8');
const sandbox = { window: {}, console, performance, module: { exports: {} } };
vm.runInNewContext(src, sandbox);
const JAVA = sandbox.window.JAVA;

const cases = [];
const t = (name, code, expect, opts = {}) => cases.push({ name, code, expect, ...opts });

t('arithmetic and int semantics', `
int a = 7, b = 2;
System.out.println(a / b);
System.out.println(a % b);
System.out.println(a / 2.0);
System.out.println(1 + 2 + "x" + 1 + 2);
System.out.println(Integer.MAX_VALUE + 1);
System.out.println((int) 3.99);
System.out.println((double) 7 / 2);
double d = 0.1 + 0.2;
System.out.println(d);
System.out.println(10.0 / 4);
System.out.println(1e7);
System.out.println(100.0 / 3);
`, `3\n1\n3.5\n3x12\n-2147483648\n3\n3.5\n0.30000000000000004\n2.5\n1.0E7\n33.333333333333336\n`);

t('chars and casts', `
char c = 'A';
c++;
System.out.println(c);
System.out.println(c + 1);
System.out.println((char) (c + 1));
System.out.println('a' + 'b');
System.out.println("" + 'a' + 'b');
int code = 'z';
System.out.println(code);
`, `B\n67\nC\n195\nab\n122\n`);

t('strings', `
String s = "Hello, World";
System.out.println(s.length());
System.out.println(s.charAt(4));
System.out.println(s.substring(7));
System.out.println(s.substring(0, 5).toUpperCase());
System.out.println(s.indexOf("World"));
String a = "hi", b = "h" + "i";
String c = new String("hi");
System.out.println(a.equals(c));
System.out.println(a == c);
System.out.println(a.equals(b));
System.out.println("apple".compareTo("banana") < 0);
System.out.printf("%5.2f|%-4d|%s%n", 3.14159, 42, "ok");
System.out.printf("%,d %05d %.1f%%%n", 1234567, 42, 99.5);
`, `12\no\nWorld\nHELLO\n7\ntrue\nfalse\ntrue\ntrue\n 3.14|42  |ok\n1,234,567 00042 99.5%\n`);

t('selection', `
int n = 15;
if (n % 15 == 0) System.out.println("FizzBuzz");
else if (n % 3 == 0) System.out.println("Fizz");
else System.out.println(n);
char grade = 'B';
switch (grade) {
  case 'A': System.out.println("excellent");
  case 'B': System.out.println("good");
  case 'C': System.out.println("fair"); break;
  default: System.out.println("?");
}
String day = "sat";
switch (day) { case "sat": case "sun": System.out.println("weekend"); break; default: System.out.println("weekday"); }
System.out.println(n > 10 ? "big" : "small");
boolean ok = n > 0 && 10 / n > 0;
System.out.println(ok);
`, `FizzBuzz\ngood\nfair\nweekend\nbig\nfalse\n`);

t('loops', `
int sum = 0;
for (int i = 1; i <= 10; i++) sum += i;
System.out.println(sum);
int k = 1;
while (k < 100) k *= 2;
System.out.println(k);
int j = 0;
do { j++; } while (j < 0);
System.out.println(j);
for (int r = 1; r <= 3; r++) {
  for (int c = 1; c <= 3; c++) {
    if (c == 2) continue;
    System.out.print(r * c + " ");
  }
  System.out.println();
}
outer:
for (int i = 0; i < 3; i++) { if (i == 1) break; System.out.println("i=" + i); }
`, ``, { expectError: 'compile' });

t('loops (no label)', `
int sum = 0;
for (int i = 1; i <= 10; i++) sum += i;
System.out.println(sum);
int j = 0;
do { j++; } while (j < 0);
System.out.println(j);
for (int i = 0; i < 3; i++) { if (i == 1) break; System.out.println("i=" + i); }
int count = 0;
for (int i = 0; i < 5; i++) for (int m = 0; m < i; m++) count++;
System.out.println(count);
`, `55\n1\ni=0\n10\n`);

t('arrays', `
int[] a = {5, 3, 8, 1};
int max = a[0];
for (int i = 1; i < a.length; i++) if (a[i] > max) max = a[i];
System.out.println(max);
int[] b = new int[3];
b[0] = 9;
System.out.println(b[1] + " " + b.length);
int[] c = a;
c[0] = 100;
System.out.println(a[0]);
double[][] g = new double[2][3];
g[1][2] = 1.5;
System.out.println(g[1][2] + " " + g.length + " " + g[0].length);
String[] names = new String[2];
System.out.println(names[0]);
int total = 0;
for (int x : a) total += x;
System.out.println(total);
`, `8\n0 3\n100\n1.5 2 3\nnull\n112\n`);

t('arrays (Arrays.toString)', `
int[] a = {5, 3, 8, 1};
int[] c = a;
c[0] = 100;
System.out.println(a[0]);
System.out.println(Arrays.toString(a));
char[] cs = "abc".toCharArray();
System.out.println(cs.length + "" + cs[2]);
`, `100\n[100, 3, 8, 1]\n3c\n`);

t('methods in a snippet', `
static int square(int x) { return x * x; }
static double average(int[] xs) {
  int sum = 0;
  for (int x : xs) sum += x;
  return (double) sum / xs.length;
}
static void swap(int a, int b) { int t = a; a = b; b = t; }
System.out.println(square(7));
int[] data = {1, 2, 4};
System.out.println(average(data));
int p = 1, q = 2;
swap(p, q);
System.out.println(p + " " + q);
System.out.println(Math.max(square(2), 3) + Math.abs(-2));
`, `49\n2.3333333333333335\n1 2\n6\n`);

t('overloading and recursion', `
static int f(int n) { return n <= 1 ? 1 : n * f(n - 1); }
static String describe(int x) { return "int " + x; }
static String describe(double x) { return "double " + x; }
static String describe(String x) { return "String " + x; }
System.out.println(f(5));
System.out.println(describe(3));
System.out.println(describe(3.0));
System.out.println(describe("3"));
System.out.println(describe('c'));
`, `120\nint 3\ndouble 3.0\nString 3\nint 99\n`);

t('classes, constructors, references', `
public class Demo {
  public static void main(String[] args) {
    Point p = new Point(1, 2);
    Point q = p;
    q.x = 10;
    System.out.println(p.x + " " + p);
    Point r = new Point(10, 2);
    System.out.println(p == r);
    System.out.println(p.equals(r));
    System.out.println(p.distanceTo(new Point(13, 6)));
    Counter.bump(); Counter.bump();
    System.out.println(Counter.count);
    Point none = null;
    System.out.println(none == null);
    System.out.println(none.x);
  }
}
class Point {
  int x, y;
  Point(int x, int y) { this.x = x; this.y = y; }
  Point() { this(0, 0); }
  double distanceTo(Point o) { return Math.sqrt(Math.pow(x - o.x, 2) + Math.pow(y - o.y, 2)); }
  public boolean equals(Point o) { return o != null && x == o.x && y == o.y; }
  public String toString() { return "(" + x + ", " + y + ")"; }
}
class Counter { static int count = 0; static void bump() { count++; } }
`, `10 (10, 2)\nfalse\ntrue\n5.0\n2\ntrue\n`, { expectError: 'runtime', errorName: 'NullPointerException' });

t('encapsulation with getters/setters', `
class BankAccount {
  private String owner;
  private double balance;
  private static int created = 0;
  public BankAccount(String owner, double initial) { this.owner = owner; balance = initial; created++; }
  public void deposit(double amt) { if (amt > 0) balance += amt; }
  public boolean withdraw(double amt) { if (amt > balance) return false; balance -= amt; return true; }
  public double getBalance() { return balance; }
  public static int getCreated() { return created; }
}
public class Main {
  public static void main(String[] args) {
    BankAccount acc = new BankAccount("Ana", 100);
    acc.deposit(50);
    System.out.println(acc.withdraw(500));
    System.out.println(acc.getBalance());
    new BankAccount("Bo", 0);
    System.out.println(BankAccount.getCreated());
  }
}
`, `false\n150.0\n2\n`);

t('scanner', `
Scanner sc = new Scanner(System.in);
int n = sc.nextInt();
double x = sc.nextDouble();
String w = sc.next();
sc.nextLine();
String line = sc.nextLine();
System.out.println(n * 2 + " " + x + " " + w + " [" + line + "]");
int sum = 0;
while (sc.hasNextInt()) sum += sc.nextInt();
System.out.println(sum);
`, `84 2.5 word [a whole line]\n6\n`, { stdin: '42 2.5 word\na whole line\n1 2 3\n' });

t('runtime errors: division by zero', `int x = 5 / 0;`, ``, { expectError: 'runtime', errorName: 'ArithmeticException' });
t('runtime errors: array index', `int[] a = new int[3]; a[3] = 1;`, ``, { expectError: 'runtime', errorName: 'ArrayIndexOutOfBoundsException' });
t('runtime errors: parse', `int n = Integer.parseInt("12a");`, ``, { expectError: 'runtime', errorName: 'NumberFormatException' });
t('runtime errors: input mismatch', `Scanner sc = new Scanner(System.in); int n = sc.nextInt();`, ``, { stdin: 'abc', expectError: 'runtime', errorName: 'InputMismatchException' });
t('infinite loop is stopped', `int i = 0; while (true) i++;`, ``, { expectError: 'runtime', errorName: 'StepLimit' });
t('compile errors: lossy conversion', `int x = 3.5;`, ``, { expectError: 'compile', errorText: 'lossy' });
t('compile errors: missing semicolon', `int x = 3\nSystem.out.println(x);`, ``, { expectError: 'compile', errorText: "';' expected" });
t('compile errors: undefined variable', `System.out.println(y);`, ``, { expectError: 'compile', errorText: 'cannot find symbol' });
t('compile errors: uninitialised', `int x; System.out.println(x);`, ``, { expectError: 'compile', errorText: 'might not have been initialized' });
t('compile errors: final', `final int N = 3; N = 4;`, ``, { expectError: 'compile', errorText: 'final variable' });
t('compile errors: string == int', `if ("a" == 1) System.out.println(1);`, ``, { expectError: 'compile', errorText: 'incomparable' });

t('trace shape', `
int x = 1;
x = x + 1;
System.out.println(x);
`, `2\n`, { check: r => {
  const lines = r.trace.map(s => s.line);
  if (JSON.stringify(lines) !== JSON.stringify([2, 3, 4, null])) return 'lines ' + JSON.stringify(lines);
  const v = r.trace[2].frames[0].vars;
  if (JSON.stringify(v) !== JSON.stringify([['x', '2']])) return 'vars ' + JSON.stringify(v);
  if (r.trace[2].outLen !== 0 || r.trace[3].outLen !== 2) return 'outLen ' + r.trace.map(s => s.outLen);
  return null;
} });

t('aliasing shown in variables', `
int[] a = {1, 2};
int[] b = a;
b[0] = 9;
System.out.println(a[0]);
`, `9\n`, { check: r => {
  const v = r.trace[3].frames[0].vars;
  return v[0][1] === '#1 [9, 2]' && v[1][1] === '#1 [9, 2]' ? null : JSON.stringify(v);
} });

t('loop variable leaves scope', `
int n = 0;
for (int i = 0; i < 2; i++) n += i;
System.out.println(n);
`, `1\n`, { check: r => {
  const inLoop = r.trace.find(s => s.line === 3 && s.frames[0].vars.some(v => v[0] === 'i'));
  const after = r.trace.find(s => s.line === 4);
  const names = after.frames[0].vars.map(v => v[0]);
  return inLoop && JSON.stringify(names) === '["n"]' ? null : `after-loop vars ${JSON.stringify(names)}, i seen in loop: ${!!inLoop}`;
} });

// regressions from the first code review
t('shift operators', `System.out.println((1 << 3) + " " + (-16 >> 2) + " " + (-16 >>> 28) + " " + (1L << 40));`, `8 -4 15 1099511627776\n`);
t('String parameters keep identity', `
static boolean same(String x, String y) { return x == y; }
String a = "hi";
System.out.println(same(a, a) + " " + same(a, new String("hi")) + " " + same("hi", "hi"));
`, `true false true\n`);
t('compound += on Strings', `
String s = "";
for (int i = 1; i <= 3; i++) s += i;
s += 'x';
s += 2.5;
System.out.println(s);
`, `123x2.5\n`);
t('static initialisers see their class', `
public class Main { public static void main(String[] args) { System.out.println(Cfg.y + " " + Cfg.t.length + " " + Cfg.V); } }
class Cfg {
  static int x = 5;
  static int y = x + 1;
  static int[] t;
  static { t = new int[3]; }
  static int V = mk();
  static int mk() { return x * 10; }
}
`, `6 3 50\n`);
t('three fields in one declaration', `
class P { int a, b = 2, c; P() { a = 1; c = 3; } }
public class Main { public static void main(String[] args) { P p = new P(); System.out.println(p.a + p.b + p.c); } }
`, `6\n`);
t('negative byte/short literals and MIN_VALUE', `
byte b = -1; short s = -5; char c = 65;
int m = -2147483648;
System.out.println(b + " " + s + " " + c + " " + m + " " + (m == Integer.MIN_VALUE));
`, `-1 -5 A -2147483648 true\n`);
t('++ wraps at MAX_VALUE', `int big = Integer.MAX_VALUE; big++; int small = Integer.MIN_VALUE; small--; System.out.println(big + " " + small);`, `-2147483648 2147483647\n`);
t('array of objects starts as nulls', `
class P { int v = 1; }
public class Main { public static void main(String[] args) {
  P[] ps = new P[2]; ps[0] = new P();
  System.out.println((ps[1] == null) + " " + ps[0].v);
  System.out.println(ps[1].v);
} }
`, `true 1\n`, { expectError: 'runtime', errorName: 'NullPointerException' });
t('String method arity is a compile error', `String s = "ab"; s.indexOf();`, ``, { expectError: 'compile', errorText: 'cannot be applied' });
t('String replace with one argument', `String s = "ab"; s.replace("a");`, ``, { expectError: 'compile', errorText: 'cannot be applied' });
t('printf %e with a String', `System.out.printf("%e", "text");`, ``, { expectError: 'runtime', errorName: 'IllegalFormatConversionException' });
t('printf %e and %x', `System.out.printf("%.2e %x%n", 12345.678, 255);`, `1.23e+04 ff\n`);
t('2147483648 alone is an error', `int m = 2147483648;`, ``, { expectError: 'compile', errorText: 'too large' });


// ── COMP 249 material (#67): inheritance, interfaces, exceptions, generics, collections, files ──
t('inheritance: fields, super(), dispatch, toString', `
class Animal {
  protected String name;
  public Animal(String name) { this.name = name; }
  public String speak() { return "..."; }
  public String toString() { return name + " says " + speak(); }
}
class Dog extends Animal {
  public Dog(String name) { super(name); }
  public String speak() { return "Woof"; }
  public void fetch() { System.out.println(name + " fetches"); }
}
public class Main { public static void main(String[] args) {
  Animal a = new Dog("Rex");
  System.out.println(a);
  Dog d = (Dog) a; d.fetch();
  System.out.println(a instanceof Dog);
  System.out.println(a.getClass().getName());
} }`, `Rex says Woof\nRex fetches\ntrue\nDog\n`);

t('static type: subclass method not visible through a superclass reference', `
class A { void hi() {} }
class B extends A { void bye() {} }
public class Main { public static void main(String[] args) { A x = new B(); x.bye(); } }`, ``, { expectError: 'compile', errorText: 'cannot find symbol: method bye()' });

t('abstract class: cannot instantiate; missing override', `
abstract class Shape { abstract double area(); }
class Sq extends Shape { }
public class Main { public static void main(String[] args) { } }`, ``, { expectError: 'compile', errorText: 'Sq is not abstract and does not override abstract method area()' });

t('abstract instantiation', `
abstract class Shape { abstract double area(); }
public class Main { public static void main(String[] args) { Shape s = new Shape(); } }`, ``, { expectError: 'compile', errorText: 'Shape is abstract; cannot be instantiated' });

t('polymorphic array and super.method', `
abstract class Shape {
  abstract double area();
  public String describe() { return getClass().getName() + " with area " + area(); }
}
class Circle extends Shape { double r; Circle(double r) { this.r = r; } double area() { return 3 * r * r; } }
class Rect extends Shape { double w, h; Rect(double w, double h) { this.w = w; this.h = h; } double area() { return w * h; }
  public String describe() { return "Rect: " + super.describe(); } }
public class Main { public static void main(String[] args) {
  Shape[] shapes = { new Circle(1), new Rect(2, 3) };
  double total = 0;
  for (Shape s : shapes) { System.out.println(s.describe()); total += s.area(); }
  System.out.println(total);
} }`, `Circle with area 3.0\nRect: Rect with area 6.0\n9.0\n`);

t('overloading is static, overriding is dynamic', `
class A { String who() { return "A"; } }
class B extends A { String who() { return "B"; } }
public class Main {
  static String pick(A a) { return "pick(A):" + a.who(); }
  static String pick(B b) { return "pick(B):" + b.who(); }
  public static void main(String[] args) { A a = new B(); System.out.println(pick(a)); B b = new B(); System.out.println(pick(b)); }
}`, `pick(A):B\npick(B):B\n`);

t('implicit super() needs a no-arg constructor', `
class P { P(int x) {} }
class C extends P { C() { } }
public class Main { public static void main(String[] args) { new C(); } }`, ``, { expectError: 'compile', errorText: 'cannot be applied' });

t('ClassCastException on a bad downcast', `
class A {} class B extends A {} class C extends A {}
public class Main { public static void main(String[] args) { A a = new C(); B b = (B) a; } }`, ``, { expectError: 'runtime', errorName: 'ClassCastException' });

t('interface with default method and interface-typed variable', `
interface Greeter { String greet(); default String twice() { return greet() + greet(); } }
class Hi implements Greeter { public String greet() { return "hi "; } }
public class Main { public static void main(String[] args) { Greeter g = new Hi(); System.out.println(g.twice()); System.out.println(g instanceof Greeter); } }`, `hi hi \ntrue\n`);

t('interface not implemented', `
interface Shape { double area(); }
class Sq implements Shape { }
public class Main { public static void main(String[] args) {} }`, ``, { expectError: 'compile', errorText: 'does not override abstract method area()' });

t('Comparable and Collections.sort', `
import java.util.*;
class Student implements Comparable<Student> {
  String name; int grade;
  Student(String n, int g) { name = n; grade = g; }
  public int compareTo(Student o) { return grade - o.grade; }
  public String toString() { return name + "(" + grade + ")"; }
}
public class Main { public static void main(String[] args) {
  ArrayList<Student> list = new ArrayList<>();
  list.add(new Student("Ann", 90)); list.add(new Student("Bob", 70)); list.add(new Student("Cy", 80));
  Collections.sort(list);
  System.out.println(list);
  list.sort((a, b) -> b.name.compareTo(a.name));
  System.out.println(list);
  System.out.println(Collections.max(list));
} }`, `[Bob(70), Cy(80), Ann(90)]\n[Cy(80), Bob(70), Ann(90)]\n[Ann(90)]\n`.replace('[Ann(90)]', 'Ann(90)'));

t('try/catch/finally order and ArithmeticException caught', `
int[] a = {1, 2};
try {
  System.out.println("before");
  System.out.println(a[0] / 0);
  System.out.println("not reached");
} catch (ArithmeticException e) {
  System.out.println("caught: " + e.getMessage());
} finally {
  System.out.println("finally");
}
System.out.println("after");
`, `before\ncaught: / by zero\nfinally\nafter\n`);

t('catch order: subclass first; multi-catch; uncaught propagates with message', `
public class Main {
  static int parse(String s) { return Integer.parseInt(s); }
  public static void main(String[] args) {
    try { parse("x"); } catch (NumberFormatException | NullPointerException e) { System.out.println("bad: " + e.getMessage()); }
    try { int[] b = new int[2]; b[5] = 1; } catch (RuntimeException e) { System.out.println(e); }
    parse("y");
  }
}`, `bad: For input string: "x"\nArrayIndexOutOfBoundsException: Index 5 out of bounds for length 2\n`, { expectError: 'runtime', errorName: 'NumberFormatException' });

t('user exception, checked, throws and catch', `
class InsufficientFundsException extends Exception {
  private double amount;
  public InsufficientFundsException(double amount) { super("need " + amount + " more"); this.amount = amount; }
  public double getAmount() { return amount; }
}
class Account {
  private double balance = 100;
  public void withdraw(double x) throws InsufficientFundsException {
    if (x > balance) throw new InsufficientFundsException(x - balance);
    balance -= x;
  }
}
public class Main { public static void main(String[] args) {
  Account acc = new Account();
  try { acc.withdraw(30); acc.withdraw(100); System.out.println("no"); }
  catch (InsufficientFundsException e) { System.out.println(e.getMessage() + " / " + e.getAmount()); }
} }`, `need 30.0 more / 30.0\n`);

t('checked exception must be caught or declared', `
class MyEx extends Exception { MyEx(String m) { super(m); } }
public class Main {
  static void risky() throws MyEx { throw new MyEx("boom"); }
  public static void main(String[] args) { risky(); }
}`, ``, { expectError: 'compile', errorText: 'unreported exception MyEx' });

t('unchecked exception needs no declaration; finally runs before propagation', `
public class Main {
  static void f() { try { throw new IllegalArgumentException("bad arg"); } finally { System.out.println("cleanup"); } }
  public static void main(String[] args) { f(); }
}`, `cleanup\n`, { expectError: 'runtime', errorName: 'IllegalArgumentException', errorText: 'bad arg' });

t('rethrow and nested try', `
public class Main {
  public static void main(String[] args) {
    try {
      try { throw new RuntimeException("inner"); }
      catch (RuntimeException e) { System.out.println("1:" + e.getMessage()); throw e; }
      finally { System.out.println("inner finally"); }
    } catch (Exception e) { System.out.println("2:" + e.getMessage()); }
  }
}`, `1:inner\ninner finally\n2:inner\n`);

t('generic class Pair<K,V> and generic method', `
class Pair<K, V> {
  private K key; private V value;
  public Pair(K k, V v) { key = k; value = v; }
  public K getKey() { return key; } public V getValue() { return value; }
  public String toString() { return "(" + key + ", " + value + ")"; }
}
public class Main {
  static <T> void printAll(T[] items) { for (T x : items) System.out.print(x + " "); System.out.println(); }
  static <T extends Comparable<T>> T maxOf(T a, T b) { return a.compareTo(b) >= 0 ? a : b; }
  public static void main(String[] args) {
    Pair<String, Integer> p = new Pair<>("age", 30);
    int n = p.getValue() + 1;
    System.out.println(p + " " + n + " " + p.getKey().length());
    Integer[] nums = {3, 1, 2}; printAll(nums);
    System.out.println(maxOf("pear", "apple") + " " + maxOf(3, 7));
  }
}`, `(age, 30) 31 3\n3 1 2 \npear 7\n`);

t('ArrayList<Integer>: boxing, remove(int) vs remove(Object), for-each, type check', `
import java.util.ArrayList;
ArrayList<Integer> xs = new ArrayList<>();
xs.add(10); xs.add(20); xs.add(30); xs.add(1, 15);
System.out.println(xs + " size " + xs.size());
xs.remove(1);
xs.remove(Integer.valueOf(30));
System.out.println(xs);
int sum = 0; for (int x : xs) sum += x;
System.out.println(sum + " " + xs.contains(20) + " " + xs.indexOf(20) + " " + xs.get(0));
xs.add("no");
`, `[10, 15, 20, 30] size 4\n[10, 20]\n30 true 1 10\n`, { expectError: 'compile', errorText: 'String cannot be converted to Integer' });

t('Integer cache: == compares references', `
Integer a = 127, b = 127, c = 128, d = 128;
System.out.println((a == b) + " " + (c == d) + " " + c.equals(d) + " " + (c == 128));
`, `true false true true\n`);

t('HashMap word count in Java iteration order; entrySet; getOrDefault', `
import java.util.*;
String text = "the cat and the dog and the bird";
HashMap<String, Integer> counts = new HashMap<>();
for (String w : text.split(" ")) counts.put(w, counts.getOrDefault(w, 0) + 1);
System.out.println(counts);
for (Map.Entry<String, Integer> e : counts.entrySet()) if (e.getValue() > 1) System.out.println(e.getKey() + "=" + e.getValue());
System.out.println(counts.containsKey("cat") + " " + counts.get("fish") + " " + counts.keySet().size());
`, `{the=3, and=2, cat=1, bird=1, dog=1}\nthe=3\nand=2\ntrue null 5\n`);

t('TreeMap sorted; HashSet dedupe in Java order', `
import java.util.*;
TreeMap<String, Integer> tm = new TreeMap<>();
tm.put("pear", 3); tm.put("apple", 1); tm.put("fig", 2);
System.out.println(tm + " " + tm.firstKey());
HashSet<Integer> set = new HashSet<>();
int[] data = {5, 3, 5, 17, 1, 3};
for (int x : data) set.add(x);
System.out.println(set + " " + set.size() + " " + set.contains(17));
`, `{apple=1, fig=2, pear=3} apple\n[17, 1, 3, 5] 4 true\n`);

t('iterator remove vs ConcurrentModificationException', `
import java.util.*;
ArrayList<Integer> xs = new ArrayList<>(List.of(1, 2, 3, 4));
Iterator<Integer> it = xs.iterator();
while (it.hasNext()) if (it.next() % 2 == 0) it.remove();
System.out.println(xs);
for (Integer x : xs) if (x == 3) xs.remove(x);
`, `[1, 3]\n`, { expectError: 'runtime', errorName: 'ConcurrentModificationException' });

t('LinkedList as queue and stack; Stack class', `
import java.util.*;
LinkedList<String> q = new LinkedList<>();
q.add("a"); q.add("b"); q.addFirst("z");
System.out.println(q + " " + q.removeFirst() + " " + q.getLast() + " " + q.size());
Stack<Integer> st = new Stack<>();
st.push(1); st.push(2); st.push(3);
System.out.println(st.pop() + " " + st.peek() + " " + st);
`, `[z, a, b] z b 2\n3 2 [1, 2]\n`);

t('inner class reads outer field; static nested class; anonymous class captures a local', `
import java.util.*;
public class Main {
  private int counter = 0;
  class Ticker { void tick() { counter++; } }
  static class Point { int x, y; Point(int x, int y) { this.x = x; this.y = y; } public String toString() { return "(" + x + "," + y + ")"; } }
  interface Op { int apply(int v); }
  public static void main(String[] args) {
    Main m = new Main();
    Main.Ticker t = m.new Ticker();
    t.tick(); t.tick();
    System.out.println(m.counter);
    Point p = new Point(1, 2); System.out.println(p);
    final int k = 10;
    Op add = new Op() { public int apply(int v) { return v + k; } };
    System.out.println(add.apply(5));
    ArrayList<String> names = new ArrayList<>(List.of("bob", "Al", "cy"));
    Collections.sort(names, new Comparator<String>() { public int compare(String a, String b) { return a.length() - b.length(); } });
    System.out.println(names);
  }
}`, `2\n(1,2)\n15\n[Al, cy, bob]\n`);

t('enum with switch, values, ordinal', `
enum Day { MON, TUE, WED }
public class Main { public static void main(String[] args) {
  Day d = Day.TUE;
  switch (d) { case MON: System.out.println("start"); break; case TUE: System.out.println("second"); break; default: System.out.println("other"); }
  for (Day x : Day.values()) System.out.print(x + ":" + x.ordinal() + " ");
  System.out.println();
  System.out.println(d == Day.TUE);
} }`, `second\nMON:0 TUE:1 WED:2 \ntrue\n`);

t('recursion: factorial, fibonacci, stack overflow', `
public class Main {
  static long fact(int n) { return n <= 1 ? 1 : n * fact(n - 1); }
  static int fib(int n) { return n < 2 ? n : fib(n - 1) + fib(n - 2); }
  static int forever(int n) { return forever(n + 1); }
  public static void main(String[] args) { System.out.println(fact(10) + " " + fib(10)); forever(0); }
}`, `3628800 55\n`, { expectError: 'runtime', errorName: 'StackOverflowError' });

t('file I/O: PrintWriter buffers until close; Scanner reads it back; missing file', `
import java.io.*;
import java.util.*;
public class Main { public static void main(String[] args) {
  try {
    PrintWriter out = new PrintWriter("scores.txt");
    out.println("Ann 90"); out.println("Bob 75");
    out.close();
    Scanner in = new Scanner(new File("scores.txt"));
    int total = 0;
    while (in.hasNext()) { String name = in.next(); int s = in.nextInt(); total += s; System.out.println(name + " -> " + s); }
    in.close();
    System.out.println("total " + total);
    new Scanner(new File("missing.txt"));
  } catch (FileNotFoundException e) { System.out.println("no file: " + e.getMessage()); }
} }`, `Ann -> 90\nBob -> 75\ntotal 165\nno file: missing.txt (No such file or directory)\n`, { check: r => r.files && Object.values(r.files).some(f => f['scores.txt'] === 'Ann 90\nBob 75\n') ? null : 'file contents not recorded' });

t('file I/O without try: unreported FileNotFoundException', `
import java.io.*;
public class Main { public static void main(String[] args) { PrintWriter out = new PrintWriter("a.txt"); } }`, ``, { expectError: 'compile', errorText: 'unreported exception FileNotFoundException' });

t('serialization round trip', `
import java.io.*;
class Person implements Serializable { String name; int age; Person(String n, int a) { name = n; age = a; } public String toString() { return name + "/" + age; } }
public class Main { public static void main(String[] args) throws IOException, ClassNotFoundException {
  ObjectOutputStream oos = new ObjectOutputStream(new FileOutputStream("p.dat"));
  oos.writeObject(new Person("Zed", 40)); oos.close();
  ObjectInputStream ois = new ObjectInputStream(new FileInputStream("p.dat"));
  Person p = (Person) ois.readObject(); ois.close();
  System.out.println(p);
} }`, `Zed/40\n`);

t('linked structure: hand-built node list with generics', `
class Node<T> { T data; Node<T> next; Node(T d, Node<T> n) { data = d; next = n; } }
class MyList<T> {
  private Node<T> head; private int size;
  void addFront(T x) { head = new Node<>(x, head); size++; }
  T get(int i) { Node<T> cur = head; for (int k = 0; k < i; k++) cur = cur.next; return cur.data; }
  int size() { return size; }
  public String toString() { StringBuilder sb = new StringBuilder("["); for (Node<T> c = head; c != null; c = c.next) { sb.append(c.data); if (c.next != null) sb.append(", "); } return sb.append("]").toString(); }
}
public class Main { public static void main(String[] args) {
  MyList<String> l = new MyList<>(); l.addFront("c"); l.addFront("b"); l.addFront("a");
  System.out.println(l + " " + l.size() + " " + l.get(1).toUpperCase());
} }`, `[a, b, c] 3 B\n`);

t('user Iterable works in for-each; lambda Comparator; Map.forEach', `
import java.util.*;
class Range implements Iterable<Integer> {
  int lo, hi; Range(int lo, int hi) { this.lo = lo; this.hi = hi; }
  public Iterator<Integer> iterator() {
    return new Iterator<Integer>() { int cur = lo; public boolean hasNext() { return cur < hi; } public Integer next() { return cur++; } };
  }
}
public class Main { public static void main(String[] args) {
  for (int x : new Range(1, 4)) System.out.print(x + " ");
  System.out.println();
  String[] words = {"kiwi", "fig", "banana"};
  Arrays.sort(words, (a, b) -> a.length() - b.length());
  System.out.println(Arrays.toString(words));
  TreeMap<String, Integer> m = new TreeMap<>(); m.put("b", 2); m.put("a", 1);
  m.forEach((k, v) -> System.out.println(k + "->" + v));
} }`, `1 2 3 \n[fig, kiwi, banana]\na->1\nb->2\n`);

t('printStackTrace and uncaught user exception name', `
class OopsException extends RuntimeException { OopsException(String m) { super(m); } }
public class Main {
  static void deep() { throw new OopsException("deep trouble"); }
  public static void main(String[] args) { try { deep(); } catch (OopsException e) { e.printStackTrace(); } deep(); }
}`, `OopsException: deep trouble\n\tat deep()\n\tat main(String[])\n`, { expectError: 'runtime', errorName: 'OopsException', errorText: 'deep trouble' });

t('protected/private access and final method', `
class A { private int secret = 1; protected int prot = 2; final void locked() {} }
class B extends A { int peek() { return prot; } }
public class Main { public static void main(String[] args) { B b = new B(); System.out.println(b.peek()); System.out.println(b.secret); } }`, `2\n`, { expectError: 'compile', errorText: 'secret has private access in A' });

t('override with weaker access is rejected', `
class A { public void f() {} }
class B extends A { void f() {} }
public class Main { public static void main(String[] args) {} }`, ``, { expectError: 'compile', errorText: 'weaker access' });

t('this(...) chaining and instanceof pattern', `
class Box { int w, h; Box() { this(1, 1); } Box(int w, int h) { this.w = w; this.h = h; } }
public class Main { public static void main(String[] args) {
  Box b = new Box(); System.out.println(b.w + b.h);
  Object o = "hello";
  if (o instanceof String s) System.out.println(s.length());
} }`, `2\n5\n`);

t('equals/hashCode override drives HashSet and contains', `
import java.util.*;
class Point {
  int x, y; Point(int x, int y) { this.x = x; this.y = y; }
  public boolean equals(Object o) { if (!(o instanceof Point)) return false; Point p = (Point) o; return x == p.x && y == p.y; }
  public int hashCode() { return 31 * x + y; }
  public String toString() { return "(" + x + "," + y + ")"; }
}
public class Main { public static void main(String[] args) {
  HashSet<Point> s = new HashSet<>();
  s.add(new Point(1, 2)); s.add(new Point(1, 2)); s.add(new Point(2, 1));
  ArrayList<Point> l = new ArrayList<>(); l.add(new Point(3, 3));
  System.out.println(s.size() + " " + s.contains(new Point(2, 1)) + " " + l.contains(new Point(3, 3)) + " " + (l.get(0) == new Point(3, 3)));
} }`, `2 true true false\n`);

t('interface-typed list, nested generics, wildcard param', `
import java.util.*;
public class Main {
  static double sum(List<? extends Number> xs) { double s = 0; for (Number n : xs) s += n.doubleValue(); return s; }
  public static void main(String[] args) {
    List<Integer> xs = new ArrayList<>();
    xs.add(4); xs.add(9);
    Map<String, List<Integer>> groups = new HashMap<>();
    groups.put("a", xs);
    groups.get("a").add(1);
    System.out.println(groups + " " + sum(xs));
    xs.remove(Integer.valueOf(9));
    System.out.println(xs);
  }
}`, `{a=[4, 9, 1]} 14.0\n[4, 1]\n`);

t('unboxing null is a NullPointerException', `
Integer i = null;
int x = i;
`, ``, { expectError: 'runtime', errorName: 'NullPointerException' });

t('finally with return overrides; exception from a constructor unwinds frames', `
public class Main {
  static int f() { try { throw new RuntimeException("x"); } finally { return 7; } }
  static class Bad { Bad() { throw new IllegalStateException("cannot build"); } }
  public static void main(String[] args) {
    System.out.println(f());
    try { new Bad(); } catch (IllegalStateException e) { System.out.println("caught " + e.getMessage()); }
    System.out.println("done");
  }
}`, `7\ncaught cannot build\ndone\n`, { check: r => r.trace[r.trace.length - 1].frames.length === 1 ? null : 'frames not unwound: ' + r.trace[r.trace.length - 1].frames.map(f => f.name).join(',') });

t('exception thrown inside a lambda comparator propagates', `
import java.util.*;
ArrayList<String> xs = new ArrayList<>(List.of("b", "a"));
xs.sort((p, q) -> { if (p.equals("a")) throw new IllegalArgumentException("no a"); return p.compareTo(q); });
`, ``, { expectError: 'runtime', errorName: 'IllegalArgumentException', errorText: 'no a' });

t('variables panel shows the runtime class of a polymorphic reference', `
class Animal { String n = "x"; }
class Dog extends Animal { }
public class Main { public static void main(String[] args) { Animal a = new Dog(); int k = 0; } }`, ``, { check: r => { const last = r.trace[r.trace.length - 1]; const v = last.frames[0].vars.find(x => x[0] === 'a'); return v && v[1].startsWith('Dog#') ? null : 'got ' + JSON.stringify(last.frames); } });

t('FileWriter append mode and BufferedReader readLine to null', `
import java.io.*;
public class Main { public static void main(String[] args) throws IOException {
  PrintWriter w = new PrintWriter(new FileWriter("log.txt")); w.println("one"); w.close();
  PrintWriter w2 = new PrintWriter(new FileWriter("log.txt", true)); w2.println("two"); w2.close();
  BufferedReader r = new BufferedReader(new FileReader("log.txt"));
  String line; int n = 0;
  while ((line = r.readLine()) != null) { n++; System.out.println(n + ": " + line); }
  r.close();
} }`, `1: one\n2: two\n`);

t('forgetting close loses buffered output', `
import java.io.*;
public class Main { public static void main(String[] args) throws IOException {
  PrintWriter w = new PrintWriter("x.txt"); w.println("lost");
  BufferedReader r = new BufferedReader(new FileReader("x.txt"));
  System.out.println(r.readLine());
} }`, `null\n`);

t('snippet with try/catch and a helper that throws', `
static int safeDiv(int a, int b) { if (b == 0) throw new ArithmeticException("division by zero: " + a + "/" + b); return a / b; }
try { System.out.println(safeDiv(6, 3)); System.out.println(safeDiv(1, 0)); }
catch (ArithmeticException e) { System.out.println("error: " + e.getMessage()); }
`, `2\nerror: division by zero: 1/0\n`);

t('StringBuilder and String.valueOf', `
StringBuilder sb = new StringBuilder();
for (int i = 0; i < 3; i++) sb.append(i).append(',');
sb.deleteCharAt(sb.length() - 1);
System.out.println(sb.reverse() + " " + String.valueOf(3.5) + " " + sb.length());
`, `2,1,0 3.5 5\n`);

t('static counter shared across instances; static method via class', `
class Counter { static int made = 0; int id; Counter() { made++; id = made; } static int count() { return made; } }
public class Main { public static void main(String[] args) { new Counter(); Counter c = new Counter(); System.out.println(Counter.count() + " " + c.id + " " + Counter.made); } }`, `2 2 2\n`);

t('super field access and shadowing warning-free', `
class A { int v = 1; int get() { return v; } }
class B extends A { int v = 2; int both() { return v + super.v + super.get(); } }
public class Main { public static void main(String[] args) { B b = new B(); A a = b; System.out.println(b.both() + " " + b.v + " " + a.v + " " + a.get()); } }`, `4 2 1 1\n`);

t('PriorityQueue orders on poll; ArrayDeque as stack', `
import java.util.*;
PriorityQueue<Integer> pq = new PriorityQueue<>();
pq.add(5); pq.add(1); pq.add(3);
System.out.print(pq.poll() + " " + pq.peek() + " | ");
ArrayDeque<String> st = new ArrayDeque<>();
st.push("a"); st.push("b");
System.out.println(st.pop() + st.peek() + " " + st.size());
`, `1 3 | ba 1\n`);

t('interface constant, static method, Comparator object', `
import java.util.*;
interface Limits { int MAX = 3; static boolean ok(int x) { return x <= MAX; } }
class ByLen implements Comparator<String> { public int compare(String a, String b) { return a.length() - b.length(); } }
public class Main { public static void main(String[] args) {
  System.out.println(Limits.MAX + " " + Limits.ok(5));
  String[] w = {"ccc", "a", "bb"}; Arrays.sort(w, new ByLen()); System.out.println(String.join("-", w));
} }`, `3 false\na-bb-ccc\n`);

t('generic method with bounded type rejects a non-Comparable', `
class Thing {}
public class Main {
  static <T extends Comparable<T>> T bigger(T a, T b) { return a.compareTo(b) > 0 ? a : b; }
  public static void main(String[] args) { System.out.println(bigger(2, 9)); bigger(new Thing(), new Thing()); }
}`, `9\n`, { expectError: 'compile' });


t('a null returned from a typed method does not leak its static type onto null literals', `
public class Main {
  static Integer maybe() { return null; }
  public static void main(String[] args) { Integer a = maybe(); String s = null; int x = null; }
}`, ``, { expectError: 'compile', errorText: '<null> cannot be converted to int' });

t('unterminated generic arguments in outer.new is a compile error, not a hang', `
public class Main { class In {} public static void main(String[] args) { Main m = new Main(); Main.In i = m.new In<(); } }`, ``, { expectError: 'compile' });


t('type arguments of a user generic class are checked on calls', `
class Box<T> { private T item; void set(T x) { item = x; } T get() { return item; } }
public class Main { public static void main(String[] args) { Box<Integer> b = new Box<>(); b.set(41); int n = b.get() + 1; System.out.println(n); b.set("no"); } }`, ``, { expectError: 'compile', errorText: 'String cannot be converted to Integer' });

t('a catch of a superclass before its subclass is a compile error, before anything runs', `
public class Main { public static void main(String[] args) { System.out.println("x"); try { int a = 1 / 0; } catch (RuntimeException e) { } catch (ArithmeticException e) { } } }`, ``, { expectError: 'compile', errorText: 'has already been caught' });

t('abstract instantiation is refused before the program runs', `
abstract class S { }
public class Main { public static void main(String[] args) { System.out.println("printed?"); S s = new S(); } }`, ``, { expectError: 'compile', errorText: 'S is abstract; cannot be instantiated' });

t('a private nested class is not visible outside its outer class', `
class Bank { private static class Account { } }
public class Main { public static void main(String[] args) { new Bank.Account(); } }`, ``, { expectError: 'compile', errorText: 'Account has private access in Bank' });

t('a local captured by a lambda must be effectively final', `
interface F { int f(int x); }
public class Main { public static void main(String[] args) { int k = 1; F g = x -> x + k; k = 2; System.out.println(g.f(1)); } }`, ``, { expectError: 'compile', errorText: 'effectively final' });

t('return; in a void method; Map.get of a missing key unboxes to a NullPointerException', `
import java.util.*;
public class Main {
  static void f(int x) { if (x > 0) return; System.out.println("non-positive"); }
  public static void main(String[] args) { f(1); f(0); Map<String, Integer> m = new HashMap<>(); int n = m.get("cow"); }
}`, `non-positive\n`, { expectError: 'runtime', errorName: 'NullPointerException' });

t('a T-typed local in a bounded generic method accepts the argument type', `
class Thing implements Comparable<Thing> { int v; Thing(int v) { this.v = v; } public int compareTo(Thing o) { return v - o.v; } }
public class Main {
  static <T extends Comparable<T>> T maxOf(T[] items) { T best = items[0]; for (T x : items) if (x.compareTo(best) > 0) best = x; return best; }
  public static void main(String[] args) { Thing[] ts = { new Thing(3), new Thing(9), new Thing(4) }; System.out.println(maxOf(ts).v); }
}`, `9\n`);


t('qualified generic types, Map.computeIfAbsent, and a user class named Entry', `
import java.util.*;
class Book<E> { class Page { E text; Page(E t) { text = t; } } Page make(E t) { return new Page(t); } }
class Entry { String key; int value; Entry(String k, int v) { key = k; value = v; } public String toString() { return key + ":" + value; } }
public class Main { public static void main(String[] args) {
  Book<String> b = new Book<>();
  Book<String>.Page p = b.make("hello");
  Map<String, List<Integer>> m = new TreeMap<>();
  m.computeIfAbsent("a", k -> new ArrayList<>()).add(1);
  m.computeIfAbsent("a", k -> new ArrayList<>()).add(2);
  List<Entry> es = new ArrayList<>(); es.add(new Entry("x", 7));
  System.out.println(p.text + " " + m + " " + es);
} }`, `hello {a=[1, 2]} [x:7]\n`);

let pass = 0, fail = 0;
for (const c of cases) {
  const r = JAVA.run(c.code, c.stdin || '', { maxSteps: 4000 });
  let problem = null;
  if (c.expectError) {
    if (!r.error) problem = 'expected a ' + c.expectError + ' error, got none';
    else if (r.error.kind !== c.expectError) problem = `expected ${c.expectError} error, got ${r.error.kind}: ${r.error.message}`;
    else if (c.errorName && r.error.name !== c.errorName) problem = `expected ${c.errorName}, got ${r.error.name}: ${r.error.message}`;
    else if (c.errorText && !r.error.message.includes(c.errorText)) problem = `expected message containing ${JSON.stringify(c.errorText)}, got ${JSON.stringify(r.error.message)}`;
    if (!problem && c.expect && !r.out.startsWith(c.expect)) problem = `output before the error\n  expected ${JSON.stringify(c.expect)}\n  got      ${JSON.stringify(r.out)}`;
  } else if (r.error) problem = `unexpected ${r.error.kind} error (line ${r.error.line}): ${r.error.name || ''} ${r.error.message}`;
  else if (r.out !== c.expect) problem = `output\n  expected ${JSON.stringify(c.expect)}\n  got      ${JSON.stringify(r.out)}`;
  if (!problem && c.check) problem = c.check(r);
  if (problem) { fail++; console.log(`✗ ${c.name}: ${problem}`); } else pass++;
}
console.log(`${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
