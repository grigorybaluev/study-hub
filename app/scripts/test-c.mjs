// Fixture tests for the C-subset interpreter (app/src/sims/c.js). Run: node scripts/test-c.mjs
// Expected outputs of the ordinary programs were produced by compiling them with clang on x86-64.
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const src = readFileSync(new URL('../src/sims/c.js', import.meta.url), 'utf8');
const sandbox = { window: {}, console, module: { exports: {} } };
vm.runInNewContext(src, sandbox);
const C = sandbox.window.C;

const cases = [
 {
  "name": "integer arithmetic and conversions",
  "code": "#include <stdio.h>\nint main(void) {\n    int a = 7, b = 2;\n    printf(\"%d %d %d\\n\", a / b, a % b, -7 / 2);\n    printf(\"%d\\n\", -7 % 2);\n    double d = a / b;\n    printf(\"%f %f\\n\", d, (double) a / b);\n    int big = 2147483647;\n    printf(\"%d\\n\", big + 1);\n    unsigned int u = 0;\n    u = u - 1;\n    printf(\"%u %d\\n\", u, (int) u);\n    char c = 'A' + 2;\n    printf(\"%c %d\\n\", c, c);\n    int i = 3.99;\n    float f = 3.14;\n    double g = i;\n    printf(\"%d : %.2f : %1.3f\\n\", i, f, g);\n    printf(\"%d %d\\n\", 5 > 3, 5 == 3);\n    printf(\"%d\\n\", 1 << 10);\n    printf(\"%x %o %X\\n\", 255, 8, 3054);\n    return 0;\n}",
  "expect": "3 1 -3\n-1\n3.000000 3.500000\n-2147483648\n4294967295 -1\nC 67\n3 : 3.14 : 3.000\n1 0\n1024\nff 10 BEE\n"
 },
 {
  "name": "sizes on x86-64",
  "code": "#include <stdio.h>\nstruct a { char c; int i; };\nstruct b { char c; double d; char e; };\nstruct c { int x; float y; };\nint main(void) {\n    printf(\"%zu %zu %zu %zu\\n\", sizeof(char), sizeof(short), sizeof(int), sizeof(long));\n    printf(\"%zu %zu %zu\\n\", sizeof(float), sizeof(double), sizeof(long double));\n    printf(\"%zu %zu\\n\", sizeof(int *), sizeof(char *));\n    printf(\"%zu %zu %zu\\n\", sizeof(struct a), sizeof(struct b), sizeof(struct c));\n    int arr[10];\n    double m[3][4];\n    printf(\"%zu %zu %zu\\n\", sizeof arr, sizeof arr / sizeof arr[0], sizeof m);\n    return 0;\n}",
  "expect": "1 2 4 8\n4 8 16\n8 8\n8 24 8\n40 10 96\n"
 },
 {
  "name": "printf formats",
  "code": "#include <stdio.h>\nint main(void) {\n    printf(\"[%5d][%-5d][%05d][%+d][% d]\\n\", 42, 42, 42, 42, 42);\n    printf(\"[%8.3f][%-8.2f][%.0f][%.0f][%.1f]\\n\", 3.14159, 2.5, 0.5, 1.5, 0.25);\n    printf(\"[%e][%.2e][%E]\\n\", 12345.678, 0.000123, 1e10);\n    printf(\"[%g][%g][%g][%g][%g]\\n\", 100000.0, 1000000.0, 0.0001, 0.00001, 3.0);\n    printf(\"[%s][%10s][%-10s][%.3s]\\n\", \"hi\", \"right\", \"left\", \"abcdef\");\n    printf(\"[%c%c%c][%%][%ld][%lu]\\n\", 'a', 98, 'c', 9000000000L, 18446744073709551615UL);\n    printf(\"[%.2f][%.3f][%.2f]\\n\", 2.675, 1.0005, 1e6 / 3);\n    printf(\"[%hhd][%hd][%lld]\\n\", (char) 300, (short) 70000, -5LL);\n    return 0;\n}",
  "expect": "[   42][42   ][00042][+42][ 42]\n[   3.142][2.50    ][0][2][0.2]\n[1.234568e+04][1.23e-04][1.000000E+10]\n[100000][1e+06][0.0001][1e-05][3]\n[hi][     right][left      ][abc]\n[abc][%][9000000000][18446744073709551615]\n[2.67][1.000][333333.33]\n[44][4464][-5]\n"
 },
 {
  "name": "scope, shadowing and static locals",
  "code": "#include <stdio.h>\nint a = 3;\nint counter(void) {\n    static int n = 0;\n    n++;\n    return n;\n}\nint shadow(void) {\n    int a = 5;\n    return a;\n}\nint main(void) {\n    printf(\"%d %d %d\\n\", a, shadow(), a);\n    counter(); counter();\n    printf(\"%d\\n\", counter());\n    {\n        int a = 10;\n        printf(\"%d\\n\", a);\n    }\n    printf(\"%d\\n\", a);\n    return 0;\n}",
  "expect": "3 5 3\n3\n10\n3\n"
 },
 {
  "name": "pass by value and by pointer",
  "code": "#include <stdio.h>\nvoid swapv(int a, int b) { int t = a; a = b; b = t; }\nvoid swapp(int *a, int *b) { int t = *a; *a = *b; *b = t; }\nint main(void) {\n    int x = 5, y = 7;\n    swapv(x, y);\n    printf(\"%d %d\\n\", x, y);\n    swapp(&x, &y);\n    printf(\"%d %d\\n\", x, y);\n    return 0;\n}",
  "expect": "5 7\n7 5\n"
 },
 {
  "name": "pointers and aliasing",
  "code": "#include <stdio.h>\nint main(void) {\n    int a = 7;\n    int *p = &a;\n    int **pp = &p;\n    printf(\"%d %d %d\\n\", a, *p, **pp);\n    a = 9;\n    printf(\"%d %d\\n\", a, *p);\n    *p = 11;\n    printf(\"%d %d\\n\", a, *p);\n    **pp = 13;\n    printf(\"%d\\n\", a);\n    printf(\"%d\\n\", p == &a);\n    return 0;\n}",
  "expect": "7 7 7\n9 9\n11 11\n13\n1\n"
 },
 {
  "name": "const pointers that compile",
  "code": "#include <stdio.h>\nint main(void) {\n    int a = 3;\n    int const b = 5;\n    int c = 7;\n    int * const p1 = &a;\n    int const * p2 = &b;\n    int const * const p3 = &b;\n    *p1 = 4;\n    p2 = &c;\n    printf(\"%d %d %d %d\\n\", *p1, *p2, *p3, a);\n    return 0;\n}",
  "expect": "4 7 5 4\n"
 },
 {
  "name": "assigning through a pointer to const does not compile",
  "code": "int main(void) {\n    int b = 5;\n    int const *p = &b;\n    *p = 7;\n    return 0;\n}",
  "error": "read-only variable is not assignable",
  "errLine": 4
 },
 {
  "name": "moving a constant pointer does not compile",
  "code": "int main(void) {\n    int a = 1, c = 2;\n    int * const p = &a;\n    p = &c;\n    return 0;\n}",
  "error": "cannot assign to variable 'p' with const-qualified type 'int *const'",
  "errLine": 4
 },
 {
  "name": "pointer arithmetic over an array",
  "code": "#include <stdio.h>\nint main(void) {\n    int arr[5] = {1, 3, 5, 7, 11};\n    int *p = arr;\n    printf(\"%d %d %d\\n\", *p, *(p + 1), *(p + 2));\n    printf(\"%d\\n\", *p + 1);\n    p += 4;\n    printf(\"%d %ld\\n\", *p, p - arr);\n    int sum = 0;\n    for (int *q = arr; q < arr + 5; q++) sum += *q;\n    printf(\"%d\\n\", sum);\n    printf(\"%d\\n\", 2[arr]);\n    return 0;\n}",
  "expect": "1 3 5\n2\n11 4\n27\n5\n"
 },
 {
  "name": "arrays passed to functions, 2-D arrays",
  "code": "#include <stdio.h>\nfloat average(float list[], int size) {\n    float sum = 0;\n    for (int i = 0; i < size; i++) sum += list[i];\n    return sum / size;\n}\nint main(void) {\n    float numbers[5] = {1, 2.5, 9, 11.5, 23.5};\n    printf(\"%.1f\\n\", average(numbers, 5));\n    int grid[2][3] = {{1, 2, 3}, {4, 5, 6}};\n    int total = 0;\n    for (int r = 0; r < 2; r++)\n        for (int c = 0; c < 3; c++) total += grid[r][c] * (r + 1);\n    printf(\"%d %d\\n\", total, grid[1][2]);\n    int part[6] = {9, 8};\n    printf(\"%d %d %d\\n\", part[0], part[1], part[5]);\n    return 0;\n}",
  "expect": "9.5\n36 6\n9 8 0\n"
 },
 {
  "name": "recursion",
  "code": "#include <stdio.h>\nlong factorial(int n) {\n    if (n == 0) return 1;\n    return n * factorial(n - 1);\n}\nint fib(int n) { return n < 2 ? n : fib(n - 1) + fib(n - 2); }\nint main(void) {\n    printf(\"%ld %ld\\n\", factorial(5), factorial(20));\n    printf(\"%d\\n\", fib(10));\n    return 0;\n}",
  "expect": "120 2432902008176640000\n55\n"
 },
 {
  "name": "strings",
  "code": "#include <stdio.h>\n#include <string.h>\n#include <stdlib.h>\nint main(void) {\n    char s[20] = \"abc\";\n    printf(\"%zu %zu\\n\", strlen(s), sizeof s);\n    strcat(s, \"def\");\n    printf(\"%s %zu\\n\", s, strlen(s));\n    char t[20];\n    strcpy(t, s);\n    t[0] = 'X';\n    printf(\"%s %s\\n\", s, t);\n    printf(\"%d %d %d\\n\", strcmp(\"apple\", \"apple\"), strcmp(\"apple\", \"apricot\") < 0, strcmp(\"b\", \"a\") > 0);\n    char *d = strdup(\"copy\");\n    d[0] = 'C';\n    printf(\"%s\\n\", d);\n    free(d);\n    char name[] = {'h', 'i', '\\0'};\n    printf(\"%s %zu\\n\", name, sizeof name);\n    printf(\"%c\\n\", \"hello\"[1]);\n    char line[] = \"a,bb,,ccc\";\n    for (char *tok = strtok(line, \",\"); tok != NULL; tok = strtok(NULL, \",\")) printf(\"[%s]\", tok);\n    printf(\"\\n\");\n    return 0;\n}",
  "expect": "3 20\nabcdef 6\nabcdef Xbcdef\n0 1 1\nCopy\nhi 3\ne\n[a][bb][ccc]\n"
 },
 {
  "name": "structs, typedef and ->",
  "code": "#include <stdio.h>\n#include <string.h>\ntypedef struct {\n    char name[16];\n    int age;\n    double gpa;\n} Student;\nstruct point { int x, y; };\nvoid birthday(Student *s) { s->age++; }\nstruct point move(struct point p, int dx) { p.x += dx; return p; }\nint main(void) {\n    Student s = {\"Ada\", 20, 3.9};\n    birthday(&s);\n    printf(\"%s %d %.1f\\n\", s.name, s.age, s.gpa);\n    Student t = s;\n    strcpy(t.name, \"Bob\");\n    printf(\"%s %s\\n\", s.name, t.name);\n    struct point p = {1, 2}, q;\n    q = move(p, 10);\n    printf(\"%d %d %d\\n\", p.x, q.x, q.y);\n    struct point *pp = &q;\n    pp->y = 99;\n    printf(\"%d %d\\n\", q.y, (*pp).y);\n    Student class[2] = {{\"Cy\", 19, 3.1}, {.age = 22, .name = \"Di\"}};\n    printf(\"%s %d %.1f\\n\", class[1].name, class[1].age, class[1].gpa);\n    return 0;\n}",
  "expect": "Ada 21 3.9\nAda Bob\n1 11 2\n99 99\nDi 22 0.0\n"
 },
 {
  "name": "malloc, realloc and free",
  "code": "#include <stdio.h>\n#include <stdlib.h>\nint main(void) {\n    int n = 4;\n    int *buf = (int *) malloc(n * sizeof(int));\n    if (buf == NULL) return 1;\n    for (int i = 0; i < n; i++) buf[i] = i * 10;\n    buf = realloc(buf, 2 * n * sizeof(int));\n    for (int i = n; i < 2 * n; i++) buf[i] = i * 10;\n    for (int i = 0; i < 2 * n; i++) printf(\"%d \", buf[i]);\n    printf(\"\\n\");\n    int *z = calloc(3, sizeof(int));\n    printf(\"%d %d %d\\n\", z[0], z[1], z[2]);\n    free(buf);\n    free(z);\n    return 0;\n}",
  "report": {
   "leaks": 0,
   "allocs": 3,
   "frees": 3
  },
  "expect": "0 10 20 30 40 50 60 70 \n0 0 0\n"
 },
 {
  "name": "a linked list on the heap",
  "code": "#include <stdio.h>\n#include <stdlib.h>\nstruct node { int value; struct node *next; };\nstruct node *push(struct node *head, int v) {\n    struct node *n = malloc(sizeof(struct node));\n    n->value = v;\n    n->next = head;\n    return n;\n}\nint main(void) {\n    struct node *head = NULL;\n    for (int i = 1; i <= 3; i++) head = push(head, i * i);\n    for (struct node *p = head; p != NULL; p = p->next) printf(\"%d \", p->value);\n    printf(\"\\n\");\n    while (head) { struct node *next = head->next; free(head); head = next; }\n    return 0;\n}",
  "report": {
   "leaks": 0,
   "allocs": 3,
   "frees": 3
  },
  "expect": "9 4 1 \n"
 },
 {
  "name": "leaked list: one block definitely lost, the rest indirectly",
  "code": "#include <stdlib.h>\nstruct node { int value; struct node *next; };\nint main(void) {\n    struct node *a = malloc(sizeof(struct node));\n    a->next = malloc(sizeof(struct node));\n    a->next->next = NULL;\n    return 0;\n}",
  "expect": "",
  "report": {
   "leaks": 2,
   "kinds": [
    "definitely lost",
    "indirectly lost"
   ]
  }
 },
 {
  "name": "control flow: switch, do-while, ternary, break/continue",
  "code": "#include <stdio.h>\nint main(void) {\n    for (int i = 0; i < 6; i++) {\n        switch (i) {\n            case 0: printf(\"zero \"); break;\n            case 1:\n            case 2: printf(\"small \"); break;\n            case 4: printf(\"four \"); continue;\n            default: printf(\"other \");\n        }\n        printf(\"| \");\n    }\n    printf(\"\\n\");\n    int k = 10;\n    do { k -= 3; } while (k > 0);\n    printf(\"%d %s\\n\", k, k < 0 ? \"negative\" : \"not\");\n    int n = 0;\n    while (1) { if (++n == 4) break; }\n    printf(\"%d\\n\", n);\n    return 0;\n}",
  "expect": "zero | small | small | other | four other | \n-2 negative\n4\n"
 },
 {
  "name": "the preprocessor: macros and conditionals",
  "code": "#include <stdio.h>\n#define SIZE 3\n#define SQUARE(x) ((x) * (x))\n#define BAD_SQUARE(x) x * x\n#define DEBUG\n#ifndef NULL\n#define NULL 0\n#endif\nint main(void) {\n    int a[SIZE] = {1, 2, 3};\n    printf(\"%d %d\\n\", SQUARE(1 + 2), BAD_SQUARE(1 + 2));\n    printf(\"%zu\\n\", sizeof a / sizeof a[0]);\n#ifdef DEBUG\n    printf(\"debug on\\n\");\n#else\n    printf(\"debug off\\n\");\n#endif\n#if SIZE > 2\n    printf(\"big\\n\");\n#endif\n    return 0;\n}",
  "expect": "9 5\n3\ndebug on\nbig\n"
 },
 {
  "name": "function pointers and qsort",
  "code": "#include <stdio.h>\n#include <stdlib.h>\nint cmp(const void *a, const void *b) { return *(const int *) a - *(const int *) b; }\nint twice(int x) { return 2 * x; }\nint apply(int (*f)(int), int v) { return f(v); }\nint main(void) {\n    int v[6] = {5, 2, 9, 1, 7, 3};\n    qsort(v, 6, sizeof(int), cmp);\n    for (int i = 0; i < 6; i++) printf(\"%d \", v[i]);\n    printf(\"\\n%d\\n\", apply(twice, 21));\n    int (*g)(int) = twice;\n    printf(\"%d\\n\", g(4));\n    return 0;\n}",
  "expect": "1 2 3 5 7 9 \n42\n8\n"
 },
 {
  "name": "enums, VLAs and variadic functions",
  "code": "#include <stdio.h>\n#include <stdarg.h>\nenum color { RED, GREEN = 5, BLUE };\nint sum(int count, ...) {\n    va_list ap;\n    va_start(ap, count);\n    int s = 0;\n    for (int i = 0; i < count; i++) s += va_arg(ap, int);\n    va_end(ap);\n    return s;\n}\nint main(void) {\n    printf(\"%d %d %d\\n\", RED, GREEN, BLUE);\n    int n = 4;\n    int squares[n];\n    for (int i = 0; i < n; i++) squares[i] = i * i;\n    printf(\"%d %zu\\n\", squares[3], sizeof squares);\n    printf(\"%d\\n\", sum(4, 1, 2, 3, 4));\n    return 0;\n}",
  "expect": "0 5 6\n9 16\n10\n"
 },
 {
  "name": "scanf from standard input",
  "stdin": "12 3.5 word\n",
  "code": "#include <stdio.h>\nint main(void) {\n    int n; double d; char w[10];\n    int got = scanf(\"%d %lf %s\", &n, &d, w);\n    printf(\"%d: %d %.2f %s\\n\", got, n * 2, d, w);\n    return 0;\n}",
  "expect": "3: 24 3.50 word\n"
 },
 {
  "name": "multi-file program with a guarded header",
  "files": {
   "geometry.h": "#ifndef GEOMETRY_H\n#define GEOMETRY_H\nstruct rect { int w, h; };\nint area(struct rect r);\n#endif",
   "geometry.c": "#include \"geometry.h\"\nstatic int times(int a, int b) { return a * b; }\nint area(struct rect r) { return times(r.w, r.h); }"
  },
  "code": "#include <stdio.h>\n#include \"geometry.h\"\n#include \"geometry.h\"\nint main(void) {\n    struct rect r = {3, 4};\n    printf(\"%d\\n\", area(r));\n    return 0;\n}",
  "expect": "12\n"
 },
 {
  "name": "a header without a guard, included twice",
  "files": {
   "point.h": "struct point { int x, y; };"
  },
  "code": "#include \"point.h\"\n#include \"point.h\"\nint main(void) { return 0; }",
  "error": "redefinition"
 },
 {
  "name": "calling a static function from another file",
  "files": {
   "helper.c": "static int secret(void) { return 42; }"
  },
  "code": "int secret(void);\nint main(void) { return secret(); }",
  "error": "undefined reference"
 },
 {
  "name": "extern variable defined in another file",
  "files": {
   "counter.c": "int count = 5;\nvoid bump(void) { count++; }"
  },
  "code": "#include <stdio.h>\nextern int count;\nvoid bump(void);\nint main(void) { bump(); bump(); printf(\"%d\\n\", count); return 0; }",
  "expect": "7\n"
 },
 {
  "name": "NULL dereference crashes",
  "code": "#include <stdio.h>\nint main(void) {\n    int *p = NULL;\n    printf(\"before\\n\");\n    *p = 3;\n    printf(\"after\\n\");\n    return 0;\n}",
  "expect": "before\n",
  "runtime": "SIGSEGV",
  "errLine": 5
 },
 {
  "name": "double free aborts and is reported",
  "code": "#include <stdlib.h>\nint main(void) {\n    int *p = malloc(8);\n    free(p);\n    free(p);\n    return 0;\n}",
  "runtime": "SIGABRT",
  "reportErr": [
   "double free"
  ]
 },
 {
  "name": "off-by-one read past a heap block",
  "code": "#include <stdio.h>\n#include <stdlib.h>\nint main(void) {\n    int *a = malloc(4 * sizeof(int));\n    for (int i = 0; i < 4; i++) a[i] = i;\n    int s = 0;\n    for (int i = 0; i <= 4; i++) s += a[i];\n    printf(\"%d\\n\", s);\n    free(a);\n    return 0;\n}",
  "expect": "6\n",
  "reportErr": [
   "Invalid read of size 4 at line 7: address",
   "0 bytes after a block of size 16"
  ]
 },
 {
  "name": "use after free is reported",
  "code": "#include <stdio.h>\n#include <stdlib.h>\nint main(void) {\n    int *p = malloc(sizeof(int));\n    *p = 10;\n    free(p);\n    *p = 20;\n    return 0;\n}",
  "reportErr": [
   "Invalid write of size 4 at line 7",
   "inside a block of size 4 free'd at line 6"
  ]
 },
 {
  "name": "a missing terminator runs into the neighbour",
  "code": "#include <stdio.h>\nint main(void) {\n    char a[3] = {'a', 'b', 'c'};\n    char b[4] = \"xyz\";\n    printf(\"%s\\n\", b);\n    return 0;\n}",
  "expect": "xyz\n"
 },
 {
  "name": "writing to a string literal crashes",
  "code": "int main(void) {\n    char *s = \"hello\";\n    s[0] = 'H';\n    return 0;\n}",
  "runtime": "SIGSEGV"
 },
 {
  "name": "integer division by zero",
  "code": "int main(void) { int z = 0; return 5 / z; }",
  "runtime": "SIGFPE"
 },
 {
  "name": "implicit declaration warning",
  "code": "#include <stdio.h>\nint main(void) {\n    printf(\"%d\\n\", helper(4));\n    return 0;\n}\nint helper(int x) { return x + 1; }",
  "warn": "implicit declaration of function",
  "expect": "5\n"
 },
 {
  "name": "missing header warning",
  "code": "int main(void) {\n    printf(\"hi\\n\");\n    return 0;\n}",
  "warn": "include the header <stdio.h>",
  "expect": "hi\n"
 },
 {
  "name": "undeclared identifier",
  "code": "int main(void) { return y; }",
  "error": "use of undeclared identifier 'y'"
 },
 {
  "name": "snippet without main",
  "code": "int x = 6;\nint y = x * 7;\nprintf(\"%d\\n\", y);",
  "expect": "42\n"
 },
 {
  "name": "command-line arguments",
  "args": [
   "one",
   "two"
  ],
  "code": "#include <stdio.h>\nint main(int argc, char *argv[]) {\n    printf(\"%d\\n\", argc);\n    for (int i = 1; i < argc; i++) printf(\"%s\\n\", argv[i]);\n    return 0;\n}",
  "expect": "3\none\ntwo\n"
 },
 {
  "name": "a variable in its own initializer, and brace elision",
  "code": "#include <stdio.h>\n#include <stdlib.h>\nstruct A { int x; int y[2]; };\nstruct B { int k; struct A a; };\nint main(void) {\n    int *p = malloc(sizeof *p * 3);\n    p[0] = 1;\n    int m[2][3] = {1, 2, 3, 4, 5, 6};\n    struct A a = {1, 2, 3};\n    struct A b = {1, {2, 3}};\n    struct B c = {7, 8, 9, 10};\n    struct A d = {.y = {5, 6}, .x = 4};\n    int q[] = {[3] = 9, 1};\n    printf(\"%d %d %d %d %d %d %d %d %zu\\n\", m[1][2], m[0][1], a.y[1], b.y[0], c.a.y[1], d.x, d.y[1], q[4], sizeof q / sizeof q[0]);\n    free(p);\n    return 0;\n}",
  "expect": "6 2 3 2 10 4 6 1 5\n"
 },
 {
  "name": "rounding that carries into a new digit, and the # flag",
  "code": "#include <stdio.h>\nint main(void) {\n    printf(\"%.2f %.0f %.2f %g %.1f %.3e\\n\", 9.996, 9.6, 99.999, 9.9999999, 0.95, 9.9996);\n    printf(\"%#06x %#o %#X\\n\", 31, 8, 255);\n    return 0;\n}",
  "expect": "10.00 10 100.00 10 0.9 1.000e+01\n0x001f 010 0XFF\n"
 },
 {
  "name": "UTF-8 text in strings",
  "code": "#include <stdio.h>\n#include <string.h>\nint main(void) {\n    char s[] = \"café\";\n    printf(\"%s has %zu bytes → ok\\n\", s, strlen(s));\n    return 0;\n}",
  "expect": "café has 5 bytes → ok\n"
 },
 {
  "name": "a snippet whose functions use its globals",
  "code": "int count = 0;\nvoid inc(void) { count++; }\ninc();\ninc();\nprintf(\"%d\\n\", count);",
  "expect": "2\n"
 },
 {
  "name": "exit() keeps live blocks reachable; globals named std… are shown",
  "code": "#include <stdlib.h>\nint students = 3;\nint main(void) { int *p = malloc(8); exit(0); }",
  "report": {
   "leaks": 0,
   "reachable": 1
  },
  "statics": [
   "students"
  ]
 },
 {
  "name": "a block-scope extern names the global",
  "code": "#include <stdio.h>\nint x = 1;\nint main(void) {\n    int x = 100;\n    { extern int x; printf(\"%d \", x); }\n    printf(\"%d\\n\", x);\n    return 0;\n}",
  "expect": "1 100\n"
 },
 {
  "name": "an implicit declaration that conflicts with the definition",
  "code": "#include <stdio.h>\nint main(void) {\n    printf(\"%.1f\\n\", average(3, 4));\n    return 0;\n}\ndouble average(int a, int b) { return (a + b) / 2.0; }",
  "error": "conflicting types for 'average'",
  "errLine": 6
 },
 {
  "name": "returning the address of a local warns",
  "code": "int *f(void) { int x = 1; return &x; }\nint main(void) { int *p = f(); return 0; }",
  "warn": "address of stack memory associated with local variable 'x' returned"
 },
 {
  "name": "a copy that runs past a heap block is reported at the first byte outside",
  "code": "#include <stdlib.h>\n#include <string.h>\nint main(void) {\n    char *s = malloc(5);\n    strcpy(s, \"hello\");\n    free(s);\n    return 0;\n}",
  "reportErr": [
   "Invalid write of size 1 at line 5: address",
   "0 bytes after a block of size 5"
  ]
 },
 {
  "name": "bit operations and unsigned wrap",
  "code": "#include <stdio.h>\nint main(void) {\n    unsigned char c = 250;\n    c += 10;\n    printf(\"%d\\n\", c);\n    int x = 0xF0;\n    printf(\"%d %d %d %d\\n\", x & 0x3C, x | 1, x ^ 0xFF, ~0);\n    printf(\"%d %d\\n\", -16 >> 2, 1 << 31);\n    unsigned int m = 1u << 31;\n    printf(\"%u\\n\", m >> 4);\n    printf(\"%d\\n\", (-1 < 1u));\n    return 0;\n}",
  "expect": "4\n48 241 15 -1\n-4 -2147483648\n134217728\n0\n"
 }
];

let failed = 0;
for (const c of cases) {
  const r = C.run(c.code, c.stdin || '', { files: c.files, args: c.args, maxSteps: 20000 });
  const problems = [];
  if (c.expect !== undefined && r.out !== c.expect) problems.push('output ' + JSON.stringify(r.out) + ' expected ' + JSON.stringify(c.expect));
  if (c.error) { if (!r.error || r.error.kind !== 'compile' || !r.error.message.includes(c.error)) problems.push('expected compile error containing ' + JSON.stringify(c.error) + ', got ' + JSON.stringify(r.error)); else if (c.errLine && r.error.line !== c.errLine) problems.push('error on line ' + r.error.line + ', expected ' + c.errLine); }
  else if (c.runtime) { if (!r.error || r.error.name !== c.runtime) problems.push('expected ' + c.runtime + ', got ' + JSON.stringify(r.error)); else if (c.errLine && r.error.line !== c.errLine) problems.push('crash on line ' + r.error.line + ', expected ' + c.errLine); }
  else if (r.error) problems.push('unexpected error ' + JSON.stringify(r.error));
  if (c.warn && !r.warnings.some(w => w.msg.includes(c.warn))) problems.push('expected a warning containing ' + JSON.stringify(c.warn) + ', got ' + JSON.stringify(r.warnings));
  const msgs = r.report ? r.report.errors.map(e => e.msg).join('\n') : '';
  for (const s of c.reportErr || []) if (!msgs.includes(s)) problems.push('memory check lacks ' + JSON.stringify(s) + ': ' + msgs);
  if (c.report) {
    const L = r.report && r.report.leaks;
    if (!L) problems.push('no leak report');
    else {
      if (c.report.leaks !== undefined && L.lost.length !== c.report.leaks) problems.push('lost blocks ' + L.lost.length + ', expected ' + c.report.leaks);
      if (c.report.allocs !== undefined && L.allocs !== c.report.allocs) problems.push('allocs ' + L.allocs + ', expected ' + c.report.allocs);
      if (c.report.frees !== undefined && L.frees !== c.report.frees) problems.push('frees ' + L.frees + ', expected ' + c.report.frees);
      for (const k of c.report.kinds || []) if (!L.lost.some(b => b.kind === k)) problems.push('no ' + k + ' block');
      if (c.report.reachable !== undefined && L.reachable.length !== c.report.reachable) problems.push('reachable blocks ' + L.reachable.length + ', expected ' + c.report.reachable);
    }
  }
  if (!r.error && !r.trace.length) problems.push('empty trace');
  const lastStep = r.trace[r.trace.length - 1];
  for (const n of c.statics || []) if (!lastStep || !lastStep.statics.some(v => v.name === n)) problems.push('static data lacks ' + n);
  if (problems.length) { failed++; console.log('FAIL ' + c.name + '\n  ' + problems.join('\n  ')); }
}
console.log(`${cases.length - failed}/${cases.length} passed`);
if (failed) process.exit(1);
