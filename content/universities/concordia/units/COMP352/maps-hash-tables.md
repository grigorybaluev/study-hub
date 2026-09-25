---
title: Maps, hash tables and dictionaries
order: 7
status: detailed
weeks: [7]
introduces: [dictionary, hash-table]
requires:
  - {concept: array, strength: hard}
  - {concept: abstract-data-type, strength: hard}
  - {concept: linked-list, strength: hard}
  - {concept: algorithm-analysis, strength: hard}
  - {concept: modular-arithmetic, strength: soft}
  - {concept: probability, strength: soft}
reinforces: []
---

"Find the value for this key" is the operation behind every lookup — a student number
to a record, a word to its count. A list answers it in $O(n)$. A hash table answers it
in $O(1)$ on average by turning the key into an array index, and this unit is about
how that is done and what goes wrong when two keys land on the same index.

## The map ADT

> **Definition.** A **map** stores entries (key, value) with **unique keys**:
> `get(k)` returns the value for `k` or `null`; `put(k, v)` inserts, or replaces the
> value and returns the old one; `remove(k)`; `size()`, `isEmpty()`; and the views
> `keySet()`, `values()`, `entrySet()`. A **dictionary** is the same without
> uniqueness: several entries may share a key, so it has `find(k)`, `findAll(k)`,
> `insert(k, v)` and `remove(e)` by entry.

A map on an **unsorted list** (a log file) implements `put` by appending in $O(1)$ —
but only after checking the key is absent, which is $O(n)$ — and `get` and `remove`
by scanning, $O(n)$. Fine for small maps or write-mostly ones; not for lookups.

## Hash functions

> **Definition.** A **hash table** for keys of some type is an array (the **bucket
> array**) of size $N$ together with a **hash function** $h$ mapping each key to an
> integer in $[0, N-1]$. The entry with key $k$ is stored at index $h(k)$. When two
> keys hash to the same index they **collide**, and a collision-handling scheme decides
> where the second one goes.

$h$ is built in two stages. The **hash code** turns a key of any type into an integer:
for an `int`, itself; for a `double`, its bits; for a string, *not* the sum of its
characters (which makes "stop", "pots", "tops" collide) but **polynomial
accumulation**, $x_0 a^{k-1} + x_1 a^{k-2} + \dots + x_{k-1}$ for a constant $a$ such
as 33, 37, 39 or 41, computed by Horner's rule in one pass with overflow ignored
(experiments on 50,000 English words give under 7 collisions for these constants).
The **compression function** then maps the code into $[0, N-1]$: **division**,
$y \bmod N$ with $N$ prime, or the better **MAD** (multiply-add-divide),
$((ay + b) \bmod p) \bmod N$ with $p > N$ prime and $a, b$ random, which spreads
codes that share a pattern.

## Collisions: separate chaining

> **Definition.** **Separate chaining** makes each bucket a small list (or list-based
> map) of the entries that hash there. `get(k)` hashes to the bucket and scans it;
> `put` and `remove` do the same. The **load factor** $\alpha = n / N$ is the average
> bucket length; with a good hash function the expected cost of each operation is
> $O(\lceil \alpha \rceil)$, so keeping $\alpha < 1$ (say $N \ge 2n$) gives $O(1)$
> expected time. The worst case — every key in one bucket — is $O(n)$.

```sim
id: ds-352-hash-chaining
custom: true
engine: ds
mode: hash-table
scheme: chaining
buckets: 13
data: [18, 41, 22, 44, 59, 32, 31, 73]
ops: ["insert 25", "find 44", "find 12", "remove 41", "find 54"]
note: "h(k) = k mod 13. Keys that collide (18 and 44, 31 and 44 too: all ≡ 5) chain in one bucket; a lookup scans that chain only. Insert a few keys that are multiples of 13 to watch a single bucket grow — the worst case a bad hash function or a bad table size produces. Try string keys such as cat: the polynomial hash code is shown."
```

## Collisions: open addressing

Chaining costs a list per bucket. **Open addressing** stores every entry in the bucket
array itself and resolves collisions by **probing** — trying other cells in a fixed
order until a free one turns up:

- **Linear probing**: try $h(k)$, then $h(k) + 1$, $h(k) + 2$, … (mod $N$). Simple, but
  occupied cells cluster and probe sequences lengthen (**primary clustering**).
- **Quadratic probing**: try $h(k) + j^2$ for $j = 0, 1, 2, \dots$ Spreads clusters,
  but may miss free cells — and can cycle — when the table is more than half full.
- **Double hashing**: try $h(k) + j \cdot d(k)$ with a second hash function
  $d(k) = q - (k \bmod q)$ for a prime $q < N$, never zero; different keys with the same
  $h$ get different step sizes, so no clustering.

Searching follows the same probe sequence until the key or an *empty* cell is found.
Deleting cannot simply empty a cell — that would break the probe sequences that pass
through it — so a removed entry is replaced by an **AVAILABLE** marker that searches
skip and insertions may reuse. The table must be **rehashed** into a larger array
before the load factor reaches about $\frac12$; past that the expected number of
probes grows without bound.

```sim
id: ds-352-hash-probing
custom: true
engine: ds
mode: hash-table
scheme: linear
buckets: 13
data: [18, 41, 22, 44, 59, 32, 31, 73]
ops: ["insert 25", "find 44", "remove 18", "find 44", "insert 18"]
note: "An example: N = 13, h(k) = k mod 13. 44 collides with 18 and lands at 6; 31 then probes past both. remove(18) leaves an AVAILABLE marker, and find(44) must step over it — delete the marker in your head and 44 would be lost. Re-insert 18 into the marker's cell. Then change the scheme in the block to quadratic or double and rerun."
```

```sim
id: ds-352-hash-double
custom: true
engine: ds
mode: hash-table
scheme: double
buckets: 13
q: 7
data: [18, 41, 22, 44, 59, 32, 31, 73]
ops: ["insert 25", "find 31"]
note: "Double hashing with d(k) = 7 − (k mod 7): 44 and 18 both hash to 5, but their step sizes differ (44 → 5, 18 → 3), so their probe sequences part immediately instead of piling up. The description shows the arithmetic of each probe."
```

```sim
id: ds-load-factor
controls:
  - {id: N, label: "table size N", min: 4, max: 1024, step: 4, default: 16, decimals: 0}
note: "Expected probes per search against the load factor, assuming a good hash function. Chaining stays near 1 + α/2 even past α = 1 (it just means longer lists); linear probing follows ½(1 + 1/(1−α)²) for a miss and explodes as α → 1, which is why open-addressing tables rehash at α ≈ ½."
```

## Hash tables in Java

`java.util.HashMap` is a chained table that rehashes when the load factor passes 0.75;
the keys' `hashCode()` supplies the hash code and the table compresses it. A class used
as a key must override `hashCode()` consistently with `equals()`: equal objects must
have equal codes, or a lookup will search the wrong bucket. The word-count idiom from
COMP 249 is the map ADT in practice; the example below builds the same thing by hand
to show where the time goes.

```sim
id: java-352-hash-map-by-hand
custom: true
engine: java
code: |
  import java.util.*;
  class ChainedMap {
      private static class Entry { String key; int value; Entry(String k, int v) { key = k; value = v; } }
      private ArrayList<LinkedList<Entry>> table;
      private int n = 0;
      ChainedMap(int buckets) { table = new ArrayList<>(); for (int i = 0; i < buckets; i++) table.add(new LinkedList<>()); }
      private int hash(String k) {                      // polynomial hash code (a = 33), then division compression
          int h = 0;
          for (int i = 0; i < k.length(); i++) h = 33 * h + k.charAt(i);
          return Math.abs(h) % table.size();
      }
      Integer get(String k) { for (Entry e : table.get(hash(k))) if (e.key.equals(k)) return e.value; return null; }
      void put(String k, int v) {
          LinkedList<Entry> bucket = table.get(hash(k));
          for (Entry e : bucket) if (e.key.equals(k)) { e.value = v; return; }
          bucket.add(new Entry(k, v)); n++;
      }
      double loadFactor() { return (double) n / table.size(); }
      int longestChain() { int m = 0; for (LinkedList<Entry> b : table) m = Math.max(m, b.size()); return m; }
  }
  public class Main {
      public static void main(String[] args) {
          String text = "the cat saw the dog and the dog saw the cat again";
          ChainedMap counts = new ChainedMap(7);
          for (String w : text.split(" ")) { Integer c = counts.get(w); counts.put(w, c == null ? 1 : c + 1); }
          for (String w : new String[] {"the", "dog", "again", "fish"}) System.out.println(w + " -> " + counts.get(w));
          System.out.printf("load factor %.2f, longest chain %d%n", counts.loadFactor(), counts.longestChain());
      }
  }
note: 'Seven buckets, seven distinct words. hash() is Horner''s rule for the polynomial code followed by mod N; get() scans one bucket. Change the bucket count to 2 and to 31 and compare the longest chain — the load factor is the whole story of hash-table speed.'
```

## Ordered maps and search tables

When keys must also be visited in order — `firstEntry`, `floorEntry(k)` ("the largest
key ≤ k"), a range — a hash table cannot help; the entries are stored **sorted**. In a
**search table** (a sorted array) `get` is **binary search**: compare with the middle
key, discard half, repeat — $O(\log n)$ — but `put` and `remove` shift entries, $O(n)$.
Good for lookup-mostly ordered data; the next unit's search trees make all three
operations logarithmic.

**Equations**

- *Polynomial hash code*: $h(x_0 \dots x_{k-1}) = \sum_{i=0}^{k-1} x_i\, a^{k-1-i}$, by Horner: $h \leftarrow a h + x_i$.
- *Compression*: division $y \bmod N$ ($N$ prime); MAD $((a y + b) \bmod p) \bmod N$ with prime $p > N$, $a \bmod p \ne 0$.
- *Probe sequences*: linear $(h(k) + j) \bmod N$; quadratic $(h(k) + j^2) \bmod N$; double $(h(k) + j\,d(k)) \bmod N$, $d(k) = q - (k \bmod q)$.
- *Expected cost*: chaining $O(1 + \alpha)$; open addressing $\approx \frac{1}{1 - \alpha}$ probes for an unsuccessful search (linear probing worse: $\frac12(1 + (1-\alpha)^{-2})$), so rehash at $\alpha \approx \frac12$.
- *Binary search*: $O(\log n)$ comparisons on a sorted array.

> **Key insight.** A hash table trades order for speed: a good hash code and
> compression spread keys evenly, collisions are handled by chaining or probing, and
> as long as the load factor stays small every operation is expected $O(1)$. Keys that
> must stay sorted need a search table or, better, a search tree.

## Further reading

- [Java API — HashMap](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/HashMap.html) — Initial capacity, load factor and the rehashing policy of the real thing.
