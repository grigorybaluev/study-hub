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

let pass = 0, fail = 0;
for (const c of cases) {
  const r = JAVA.run(c.code, c.stdin || '', { maxSteps: 2000 });
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
