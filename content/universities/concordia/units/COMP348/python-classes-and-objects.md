---
title: "Python classes, and how objects and methods are really built"
order: 11
status: detailed
weeks: [8]
introduces: []
requires:
  - {concept: python-programming, strength: hard}
  - {concept: class-and-object, strength: hard}
  - {concept: inheritance, strength: soft}
  - {concept: pointers, strength: soft}
reinforces:
  - {concept: class-and-object, perspective: "Python: explicit self, class versus instance attributes; an object as a struct plus a shared table of functions"}
  - {concept: inheritance, perspective: "Python: super(), multiple inheritance and the method resolution order"}
  - {concept: polymorphism, perspective: "operator overloading with special methods, and duck typing"}
---

Object-oriented programming the Python way — explicit `self`, class attributes shared by every
instance, `__init__`, special methods for operators, inheritance and `super()` — and what any
object-oriented language does underneath: objects are structs, methods are ordinary functions,
and `obj.method()` is `Class.method(obj)`.

## Defining and using a class

:::syntax[class]
```python
class <Name>(<Base>, …):
    <class attribute> = <value>

    def __init__(self, <params>):
        self.<attribute> = <value>

    def <method>(self, <params>):
        <body>
```

- `(<Base>, …)` is optional; with no base the class inherits from `object`.
- Every method's first parameter is the object it is called on, by convention named `self`.
  Inside a method, attributes are always reached through it: `self.x`.
- `<Name>(<args>)` creates an object (there is no `new`) and calls `__init__` on it with `args`.
:::

```sim
id: py-348-class-basics
custom: true
engine: py
code: |
  class Account:
      bank = "Northside"                 # class attribute: one, shared

      def __init__(self, owner, balance=0):
          self.owner = owner             # instance attributes: one set per object
          self.balance = balance

      def deposit(self, amount):
          self.balance += amount
          return self.balance

  a = Account("Ada", 100)
  b = Account("Bob")
  a.deposit(50)
  Account.deposit(b, 20)                 # the same call, written out
  print(a.owner, a.balance, b.balance, a.bank, b.bank)
note: 'Step into __init__: self is an arrow to the new, still empty object, and each self.x = … adds an attribute to it. a.deposit(50) and Account.deposit(b, 20) are the same kind of call: the method is a function in the class, and the object is its first argument.'
```

### Why self is explicit

Java and C++ also pass the object to every method; they just hide it (`this`). A method is stored
once, in the class, not in every object, so when it runs it needs to be told which object to work
on. Python makes that argument visible: `a.deposit(50)` is shorthand for
`Account.deposit(a, 50)`. `self` is only a convention, not a keyword, but always use it.

### Class attributes and instance attributes

Names assigned in the class body (outside methods) are **class attributes**: they belong to the
class object and are shared by all instances. Names assigned through `self` (usually in
`__init__`) are **instance attributes**: each object has its own. Reading `obj.name` looks in the
object first, then in its class; **assigning** `obj.name = …` always creates or changes an
attribute on the object, which then hides the class attribute for that object only.

```sim
id: py-348-class-vs-instance
custom: true
engine: py
code: |
  class Counter:
      created = 0            # shared count of objects
      tags = []              # a shared, mutable class attribute: a trap

      def __init__(self):
          Counter.created += 1
          self.value = 0     # per object

  c1 = Counter()
  c2 = Counter()
  c1.value = 5
  c1.created = 99            # makes an instance attribute that hides the class one
  c1.tags.append("x")        # changes the one list every object shares
  print(Counter.created, c1.created, c2.created)
  print(c2.tags, c1.value, c2.value)
note: 'Look at the class object: created and tags live there once. c1.created = 99 adds a new attribute to c1 alone; c2 still reads the class attribute. c1.tags.append does not assign, so it changes the shared list, and c2 sees it: give each object its own list in __init__.'
```

Because Python is dynamic, attributes can also be added to an object at any time
(`a.nickname = "A"`), and even to a class. It is legal, and a good way to write code nobody can
follow; define every attribute in `__init__`.

### Constructors

A class has one `__init__`. Different ways of building an object use default arguments
(`def __init__(self, owner, balance=0)`), or ordinary methods that create and return an object.
A subclass's `__init__` must call its parent's, or the parent's instance attributes never get
created.

### Visibility by convention

Python has no `private` or `public`: every attribute can be read and changed by anyone holding
the object. A leading underscore (`self._balance`) is the convention for "internal: do not touch
from outside". (Two leading underscores make Python rename the attribute to include the class
name, which prevents accidental clashes in subclasses, not access.)

## Special methods and operators

Python calls methods with double-underscore names ("dunder" methods) for the built-in operations.
Defining them lets a class work with operators and built-in functions:

| Method | Used by |
|---|---|
| `__init__(self, …)` | `Class(…)`, after the object is created |
| `__str__(self)`, `__repr__(self)` | `str(obj)` and `print(obj)`; `repr(obj)` and the interpreter |
| `__add__`, `__sub__`, `__mul__`, … | `obj + other`, `obj - other`, `obj * other` |
| `__eq__`, `__lt__`, … | `==`, `<`, … |
| `__len__`, `__getitem__`, `__contains__` | `len(obj)`, `obj[k]`, `x in obj` |
| `__iter__` | `for x in obj` |

```sim
id: py-348-dunder
custom: true
engine: py
code: |
  class Money:
      def __init__(self, cents):
          self.cents = cents
      def __add__(self, other):
          return Money(self.cents + other.cents)
      def __mul__(self, k):
          return Money(self.cents * k)
      def __eq__(self, other):
          return self.cents == other.cents
      def __lt__(self, other):
          return self.cents < other.cents
      def __repr__(self):
          return f"${self.cents // 100}.{self.cents % 100:02d}"

  price = Money(1999)
  total = price * 3 + Money(1)
  print(total, total == Money(5998), sorted([Money(5), Money(2)]))
  print(price + 5)
note: 'price * 3 calls price.__mul__(3); + then calls __add__ on the result. sorted works because Money defines __lt__. The last line fails inside __add__: an int has no cents attribute (AttributeError).'
```

## Inheritance

```python
class Animal:
    def __init__(self, name):
        self.name = name
    def speak(self):
        return "..."
    def describe(self):
        return f"{self.name} says {self.speak()}"

class Dog(Animal):
    def __init__(self, name, tricks):
        super().__init__(name)           # run Animal's __init__ on this object
        self.tricks = tricks
    def speak(self):                     # overrides Animal.speak
        return "woof"

print(Dog("Rex", ["sit"]).describe(), Animal("Gen").describe())
```

```output
Rex says woof Gen says ...
```

`describe` is inherited, and inside it `self.speak()` finds `Dog.speak` for a dog: methods are
looked up on the object's class at call time (**dynamic binding**). `super()` finds the next class
in line. Python allows **multiple inheritance** (`class C(A, B)`); the order in which classes are
searched is the **method resolution order**, `C.__mro__`, which puts every class before its
bases and keeps the left-to-right order of bases. It is powerful and confusing; single
inheritance plus composition is usually clearer.

```sim
id: py-348-inheritance
custom: true
engine: py
code: |
  class Base:
      def hello(self):
          return "Base"
  class Left(Base):
      def hello(self):
          return "Left>" + super().hello()
  class Right(Base):
      def hello(self):
          return "Right>" + super().hello()
  class Both(Left, Right):
      def hello(self):
          return "Both>" + super().hello()

  print(Both().hello())
  print([c.__name__ for c in Both.__mro__])
note: 'The MRO is Both, Left, Right, Base, object. super() in Left goes to Right, not Base, because it follows the MRO of the object (a Both), not Left''s own base. Step through and watch the frames stack up.'
```

## How objects and methods are really built

Logically, an object "contains" its data and its methods. No implementation does that: machine
code knows nothing of classes, so the compiler or interpreter builds them out of simpler parts.

1. **Data.** An object's instance variables are stored together, like a C `struct`: a block of
   memory with one field per attribute.
2. **Methods.** A method is an ordinary function, compiled once and stored with the program's
   code. Copying function pointers into every object would repeat the same pointers in millions
   of objects, so instead the **class** is a separate structure holding one pointer per method
   (a *method table*), and each object holds a pointer to its class.
3. **Which object?** A function in the table does not know which object it was called on, so the
   object is passed as a hidden first argument: `this` in Java and C++, the explicit `self` in
   Python. `fido.getName()` is compiled to `Dog.getName(fido)`.

Inheritance adds one step: a subclass's table starts as a copy of its parent's, with overridden
entries replaced, which is how `obj.speak()` finds the right function at run time. The same idea
can be written by hand in C:

```sim
id: c-348-oop-in-c
custom: true
engine: c
code: |
  #include <stdio.h>

  typedef struct Dog Dog;
  typedef struct {                        /* the "class": a table of methods */
      const char *name;
      const char *(*speak)(Dog *self);
  } DogClass;

  struct Dog {                            /* the "object": data plus its class */
      const DogClass *cls;
      const char *name;
      int age;
  };

  const char *bark(Dog *self) { return "woof"; }
  const char *yap(Dog *self)  { return self->age < 2 ? "yip" : "yap"; }

  const DogClass DOG   = {"Dog", bark};
  const DogClass PUPPY = {"Puppy", yap};  /* a "subclass": one entry overridden */

  int main(void) {
      Dog rex = {&DOG, "Rex", 5};
      Dog bit = {&PUPPY, "Bit", 1};
      Dog *pack[] = {&rex, &bit};
      for (int i = 0; i < 2; i++) {
          Dog *d = pack[i];
          printf("%s the %s says %s\n", d->name, d->cls->name, d->cls->speak(d));
      }
      return 0;
  }
note: 'Each Dog holds a pointer to its class; the class holds a function pointer. d->cls->speak(d) is what d.speak() means in a language with classes: find the method in the object''s class, then call it with the object as the first argument. That is dynamic binding, done by hand.'
```

Real languages add more (inheritance chains, interfaces, JIT caches), and Python stores
attributes in a dictionary per object rather than a fixed struct, but the model is the same.

::::exercise[What does this print?]
```python
class Shape:
    count = 0
    def __init__(self, name):
        self.name = name
        Shape.count += 1
    def area(self):
        return 0
    def __str__(self):
        return f"{self.name}: {self.area()}"

class Square(Shape):
    def __init__(self, side):
        super().__init__("square")
        self.side = side
    def area(self):
        return self.side ** 2

class Blob(Shape):
    pass

shapes = [Square(3), Blob("blob"), Square(1)]
shapes[1].count = 10
print([str(s) for s in shapes], Shape.count, shapes[1].count, shapes[2].count)
```

:::solution
```text
['square: 9', 'blob: 0', 'square: 1'] 3 10 3
```

`__str__` is inherited, and `self.area()` finds each object's own `area`: `Square.area` for the
squares, `Shape.area` for the blob. Each `__init__` increments the class attribute, so
`Shape.count` is 3. `shapes[1].count = 10` creates an instance attribute on the blob alone; the
last square still reads the class attribute, 3.
:::
::::

:::insight
A Python class is an object holding shared attributes and methods; an instance holds its own
attributes and a link to its class. Reading an attribute looks in the instance, then the class
and its bases in MRO order; assigning always writes to the instance. Underneath every
object-oriented language, objects are structs, methods are functions in a per-class table, and
the object is passed to them as the first argument.
:::

## Further reading

- [The Python Tutorial: classes](https://docs.python.org/3/tutorial/classes.html) — namespaces, class and instance variables, inheritance and private variables.
- [Data model: special method names](https://docs.python.org/3/reference/datamodel.html#special-method-names) — every dunder method and when Python calls it.
- [The Python 2.3 method resolution order](https://docs.python.org/3/howto/mro.html) — how the MRO is computed (the C3 algorithm).
- [Virtual method table](https://en.wikipedia.org/wiki/Virtual_method_table) — how C++ and Java implement dynamic binding.
