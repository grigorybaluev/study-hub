---
title: Binary search trees and AVL trees
order: 8
status: detailed
weeks: [8]
introduces: [binary-search-tree]
requires:
  - {concept: tree, strength: hard}
  - {concept: dictionary, strength: hard}
  - {concept: recursion, strength: hard}
  - {concept: algorithm-analysis, strength: hard}
reinforces: []
---

A sorted array finds a key in $O(\log n)$ but inserts in $O(n)$; a linked list inserts
in $O(1)$ but finds in $O(n)$. A binary search tree is the structure that does both in
time proportional to its **height** — and the AVL rule is what keeps that height
logarithmic whatever order the keys arrive in.

## Binary search trees

> **Definition.** A **binary search tree (BST)** is a binary tree storing keys at its
> internal nodes such that for every node $v$, all keys in the left subtree are $\le$
> the key at $v$ and all keys in the right subtree are $\ge$ it. Consequently an
> **inorder traversal** lists the keys in increasing order, which is what makes a BST
> an *ordered* map.

**Search** for $k$ walks down from the root: at each node compare $k$ with the node's
key and go left if smaller, right if larger, stop if equal or on reaching an empty
child. **Insertion** searches, and puts the new key at the empty position where the
search ended — new keys are always leaves. **Removal** of a node with at most one
child splices it out; a node with two children is replaced by its **inorder
successor** (the leftmost node of the right subtree, which has no left child and can
be spliced out), so the ordering property survives.

```sim
id: ds-352-bst
custom: true
engine: ds
mode: bst
data: [8, 3, 10, 1, 6, 14, 4, 7, 13]
ops: ["find 7", "insert 5", "remove 3", "remove 8", "find 12"]
note: "Each comparison discards a subtree. remove(3) has two children: the successor 4 is copied up and its node spliced out; remove(8) at the root does the same with 10. Now reset and insert 1, 2, 3, 4, 5, 6 in that order — the tree becomes a chain of height 5, and a search costs six comparisons where three would do."
```

Every operation costs $O(h)$ for a tree of height $h$, and there lies the problem: the
height depends on the insertion order. Random keys give $h = O(\log n)$ on average,
but sorted (or nearly sorted) input builds a chain of height $n - 1$ — a linked list
with extra steps. A BST is $O(\log n)$ only when something keeps it balanced.

```sim
id: java-352-bst
custom: true
engine: java
code: |
  public class Main {
      static class Node { int key; Node left, right; Node(int k) { key = k; } }
      static Node insert(Node t, int k) {
          if (t == null) return new Node(k);
          if (k < t.key) t.left = insert(t.left, k);
          else if (k > t.key) t.right = insert(t.right, k);
          return t;
      }
      static boolean contains(Node t, int k) {
          while (t != null) { if (k == t.key) return true; t = k < t.key ? t.left : t.right; }
          return false;
      }
      static int height(Node t) { return t == null ? -1 : 1 + Math.max(height(t.left), height(t.right)); }
      static void inorder(Node t, StringBuilder sb) { if (t == null) return; inorder(t.left, sb); sb.append(t.key).append(' '); inorder(t.right, sb); }
      public static void main(String[] args) {
          int[][] inputs = { {8, 3, 10, 1, 6, 14, 4, 7, 13}, {1, 3, 4, 6, 7, 8, 10, 13, 14} };
          for (int[] keys : inputs) {
              Node root = null;
              for (int k : keys) root = insert(root, k);
              StringBuilder sb = new StringBuilder();
              inorder(root, sb);
              System.out.println("inorder: " + sb + "| height " + height(root) + ", contains 7: " + contains(root, 7));
          }
      }
  }
note: 'The same nine keys inserted in two orders: a tree of height 3 and a chain of height 8. Inorder lists both in sorted order — the property holds for any shape — but the search cost is the height. Step into contains on the second tree and count the comparisons.'
```

## AVL trees: the height-balance property

> **Definition.** An **AVL tree** is a binary search tree in which, for every internal
> node, the heights of the two child subtrees differ by at most 1 (the
> **height-balance property**). Its height is $O(\log n)$: writing $n(h)$ for the
> fewest nodes in an AVL tree of height $h$, $n(1) = 1$, $n(2) = 2$ and
> $n(h) = 1 + n(h-1) + n(h-2) > 2\,n(h-2)$, so $n(h) > 2^{h/2 - 1}$ and
> $h < 2\log_2 n(h) + 2$. Search is therefore $O(\log n)$ — the question is how
> insertion and removal keep the property.

**Insertion** is a BST insertion followed by a walk back up the path: the new leaf may
raise the height of its ancestors, and the first ancestor whose subtrees now differ by
2 is **unbalanced**. Call it $z$, its taller child $y$, and $y$'s taller child $x$ (the
path toward the new node). **Trinode restructuring** rewires these three nodes and
their four subtrees $T_0 \dots T_3$ so that the middle key of $x, y, z$ (in inorder,
call it $b$) becomes the subtree root with the other two as its children and the four
subtrees hung in order — one **single rotation** when $x, y, z$ lie on a straight
path (left-left or right-right), a **double rotation** when they zigzag (left-right or
right-left). After it the subtree has the height it had before the insertion, so no
ancestor above is unbalanced: one restructuring, $O(1)$, fixes an insertion.

```sim
id: ds-352-avl-insert
custom: true
engine: ds
mode: avl
data: [44, 17, 78, 32, 50, 88, 48, 62]
ops: ["insert 54"]
note: "An example. insert(54) unbalances 78 (its left subtree, rooted at 50, is now two taller than its right): z = 78, y = 50, x = 62 zigzag, so the double rotation makes 62 the subtree root with 50 and 78 as children. Every node shows its height; a red h marks an unbalanced node. Reset and insert 1, 2, 3, 4, 5, 6 to see single rotations keep a sorted insertion at height 2."
```

**Removal** is a BST removal followed by the same walk: the removed node may shorten a
subtree, unbalancing an ancestor $z$; take $y$ as $z$'s *taller* child and $x$ as $y$'s
taller child (either on a tie), restructure — and, unlike insertion, the subtree may
end up shorter than before, so an ancestor higher up may now be unbalanced too. The
walk continues to the root: $O(\log n)$ restructurings, each $O(1)$.

```sim
id: ds-352-avl-remove
custom: true
engine: ds
mode: avl
data: [44, 17, 62, 32, 50, 78, 48, 54, 88]
ops: ["remove 32", "remove 17"]
note: "The removal example. remove(32) leaves 44 with a left subtree of height 0 and a right subtree of height 2: z = 44, y = 62, and on the tie between 50 and 78 the single rotation is chosen — 62 becomes the root. remove(17) then unbalances 44 again (now a child of 62) and a second single rotation lifts 50. Every node shows its height; a red h marks the unbalanced node before each repair."
```

## Costs

| operation | BST (height $h$) | AVL tree |
|---|---|---|
| `get(k)` | $O(h)$, up to $O(n)$ | $O(\log n)$ |
| `put(k, v)` | $O(h)$ | $O(\log n)$: search, insert, one restructuring |
| `remove(k)` | $O(h)$ | $O(\log n)$: search, remove, up to $\log n$ restructurings |
| inorder listing | $O(n)$ | $O(n)$ |
| space | $O(n)$ | $O(n)$ |

Java's `TreeMap` and `TreeSet` are balanced search trees (red-black rather than AVL,
same guarantees) — the choice when keys must stay ordered.

**Equations**

- *BST property*: keys in the left subtree $\le$ key at $v$ $\le$ keys in the right subtree; inorder is sorted.
- *AVL height*: $n(h) = 1 + n(h-1) + n(h-2) > 2^{h/2-1}$, hence $h < 2\log_2 n + 2 = O(\log n)$.
- *Restructuring*: with $a < b < c$ the inorder listing of $x, y, z$ and $T_0 < T_1 < T_2 < T_3$ their subtrees, the result is $b$ at the top, $a$ and $c$ as children, $T_0, T_1$ under $a$, $T_2, T_3$ under $c$.

> **Key insight.** A search tree is only as fast as it is short. The BST property
> gives $O(h)$ for everything; the AVL rule — subtree heights differ by at most 1 at
> every node — bounds $h$ by $2\log_2 n$ and is restored after any change by
> rearranging three nodes.

## Further reading

- [Sedgewick & Wayne — Binary Search Trees](https://algs4.cs.princeton.edu/32bst/) — The Hibbard deletion and the average-case argument for random keys.
