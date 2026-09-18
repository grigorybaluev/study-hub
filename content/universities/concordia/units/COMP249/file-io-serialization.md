---
title: File I/O and serialization
order: 6
status: detailed
weeks: [6]
notes: ["COMP 249 course outline (Winter 2026): week 6, ch. 10, File I/O & Serialization"]
introduces: [file-io]
requires:
  - {concept: exception-handling, strength: hard}
  - {concept: string, strength: hard}
  - {concept: iteration, strength: hard}
  - {concept: class-and-object, strength: soft}
reinforces: []
---

A program that forgets everything when it ends is a calculator. Files make data outlive
the run: text files a person can read and edit, and binary files that store whole
objects exactly. Java exposes both through **streams**, and the checked
`FileNotFoundException` / `IOException` of the previous unit are the reason every file
program has a `try` in it.

## Streams and the java.io picture

> **Definition.** A **stream** is a sequence of data flowing from a source or to a
> destination — a file, the keyboard, the network. An **input stream** is read from, an
> **output stream** written to; a **text stream** carries characters, a **binary
> stream** raw bytes. Java's I/O classes are small pieces that wrap one another: a
> `FileWriter` knows how to put characters in a file, a `PrintWriter` around it adds
> `println` and `printf`. `System.out` and `System.in` are streams that were opened for
> you.

The classes this unit uses, all in `java.io` except `Scanner`:

| purpose | class | key methods |
|---|---|---|
| write text | `PrintWriter` (over a file name, or a `FileWriter` for append) | `print`, `println`, `printf`, `close` |
| read text by token or line | `Scanner` over a `File` | `next`, `nextInt`, `nextLine`, `hasNext…` |
| read text by line | `BufferedReader` over a `FileReader` | `readLine` (returns `null` at the end), `close` |
| write objects | `ObjectOutputStream` over a `FileOutputStream` | `writeObject`, `close` |
| read objects | `ObjectInputStream` over a `FileInputStream` | `readObject`, `close` |
| the file itself | `File` | `exists`, `getName`, `delete`, `length` |

## Writing text: PrintWriter

Opening a `PrintWriter` on a file name *creates or truncates* the file. Output is
buffered: it reaches the file when the stream is flushed or **closed** — forget
`close()` and the file may stay empty. Opening throws `FileNotFoundException` (a checked
exception: the directory may not exist, the file may be locked), so the open goes in a
try or the method declares `throws`. To *append* instead of overwrite, wrap a
`FileWriter` opened with `true`: `new PrintWriter(new FileWriter("log.txt", true))`.

```sim
id: java-249-printwriter
custom: true
engine: java
code: |
  import java.io.*;
  public class Main {
      public static void main(String[] args) {
          String[] names = {"Ana", "Bo", "Cy"};
          int[] marks = {78, 91, 64};
          PrintWriter out = null;
          try {
              out = new PrintWriter("marks.txt");
              for (int i = 0; i < names.length; i++)
                  out.printf("%s %d%n", names[i], marks[i]);
              out.println("-- end --");
              System.out.println("wrote " + names.length + " lines");
          } catch (FileNotFoundException e) {
              System.out.println("cannot open: " + e.getMessage());
          } finally {
              if (out != null) out.close();
          }
      }
  }
note: 'Watch the Files panel: marks.txt appears empty when the writer is opened and fills only at close() in the finally block — that is the buffer. Comment out the close and the file stays empty at the end of the run. Then change the open to new PrintWriter(new FileWriter("marks.txt", true)) and run twice.'
```

## Reading text: Scanner and BufferedReader

A `Scanner` reads a file exactly as it reads the keyboard: `next()`, `nextInt()`,
`nextLine()`, and the `hasNext…` tests that make the read-until-the-end loop. It needs a
`File` object rather than a name (`new Scanner(new File("marks.txt"))`) and throws
`FileNotFoundException` if the file is missing. `BufferedReader` is the line-oriented
alternative: `readLine()` returns the next line without its newline, or **`null`** at the
end of the file, which gives the idiom `while ((line = in.readLine()) != null)`. Its
methods throw `IOException`. Either way, close the reader when done.

```sim
id: java-249-read-file
custom: true
engine: java
code: |
  import java.io.*;
  import java.util.Scanner;
  public class Main {
      public static void main(String[] args) {
          try {
              Scanner in = new Scanner(new File("marks.txt"));
              int count = 0, total = 0, best = -1;
              String bestName = "";
              while (in.hasNext()) {
                  String name = in.next();
                  if (!in.hasNextInt()) { in.nextLine(); continue; }
                  int mark = in.nextInt();
                  count++; total += mark;
                  if (mark > best) { best = mark; bestName = name; }
              }
              in.close();
              System.out.printf("%d students, average %.1f, best %s (%d)%n", count, (double) total / count, bestName, best);
              BufferedReader lines = new BufferedReader(new FileReader("marks.txt"));
              String line; int n = 0;
              while ((line = lines.readLine()) != null) n++;
              lines.close();
              System.out.println(n + " lines");
              new Scanner(new File("nowhere.txt"));
          } catch (FileNotFoundException e) {
              System.out.println("missing file: " + e.getMessage());
          } catch (IOException e) {
              System.out.println("read error: " + e.getMessage());
          }
      }
  }
files:
  marks.txt: |
    Ana 78
    Bo 91
    Cy 64
    -- end --
note: 'The file is seeded on the right; the token loop skips the trailer line because the next token is not an int. The same file is then counted line by line with BufferedReader. The last open fails on purpose — FileNotFoundException is a subclass of IOException, so its catch must come first: swap them and read the compiler error.'
```

The `File` class describes a path without opening it: `f.exists()` before reading avoids
an exception when the file is optional, `f.delete()` removes it, `f.getName()` gives the
name. Both readers stop at the end of data, so a loop must test `hasNext…` or `null`; a
`nextInt()` on a file with no more tokens is `NoSuchElementException`, on a word instead
of a number `InputMismatchException`.

## Binary files and serialization

Text files store `"91"` as two characters; binary files store the `int` as its four
bytes, and — more usefully — an entire object graph. **Serialization** turns an object
into a byte sequence that `ObjectOutputStream.writeObject` writes and
`ObjectInputStream.readObject` reconstructs, fields, nested objects and all.

> **Definition.** A class is **serializable** when it implements the marker interface
> `Serializable` (no methods to write). Its fields must be serializable too, or marked
> `transient` to be skipped. `readObject` returns an `Object` and must be cast back;
> it declares `IOException` and `ClassNotFoundException`. Reading past the last object
> gives `EOFException`. Writing a non-serializable object throws
> `NotSerializableException` naming the class.

```sim
id: java-249-serialization
custom: true
engine: java
code: |
  import java.io.*;
  import java.util.ArrayList;
  class Student implements Serializable {
      private String name; private int mark;
      Student(String name, int mark) { this.name = name; this.mark = mark; }
      public String toString() { return name + ":" + mark; }
  }
  public class Main {
      public static void main(String[] args) throws IOException, ClassNotFoundException {
          ArrayList<Student> roster = new ArrayList<>();
          roster.add(new Student("Ana", 78)); roster.add(new Student("Bo", 91));
          ObjectOutputStream out = new ObjectOutputStream(new FileOutputStream("roster.dat"));
          out.writeObject(roster);
          out.writeObject(new Student("Cy", 64));
          out.close();
          ObjectInputStream in = new ObjectInputStream(new FileInputStream("roster.dat"));
          ArrayList<Student> back = (ArrayList<Student>) in.readObject();
          Student extra = (Student) in.readObject();
          System.out.println(back + " " + extra);
          System.out.println(back.get(0) == roster.get(0));
          Student ghost = (Student) in.readObject();
          in.close();
      }
  }
note: 'main declares the checked exceptions instead of catching them. The whole list comes back as new objects with the same contents — the identity test prints false. The third read runs past the end of the stream: EOFException, and the close() after it never runs — which is what finally is for. Remove "implements Serializable" from Student and the first writeObject throws NotSerializableException.'
```

> **Key insight.** Every file program has the same skeleton: open (may fail — checked
> exception), loop until the data ends (`hasNext`, `null`, or `EOFException`), close in
> all cases (`finally`). Text streams are for people and other programs; object streams
> are for this program's own state, and a class opts in with `Serializable`.

## Further reading

- [The Java Tutorials — Basic I/O](https://docs.oracle.com/javase/tutorial/essential/io/index.html) — Streams, readers and writers, and the object streams.
- [The Java Tutorials — Object Streams](https://docs.oracle.com/javase/tutorial/essential/io/objectstreams.html) — Serialization with the `Serializable` contract.
