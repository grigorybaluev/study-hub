---
title: Trees
order: 5
status: detailed
weeks: [5]
introduces:
  - {concept: tree, perspective: "the tree ADT: general and binary trees, traversals, linked and array representations"}
requires:
  - {concept: recursion, strength: hard}
  - {concept: linked-list, strength: hard}
  - {concept: abstract-data-type, strength: hard}
  - {concept: algorithm-analysis, strength: soft}
reinforces: []
---

Lists are linear. A file system, a company chart, an arithmetic expression, a family
are **hierarchical**: each item has one parent and any number of children. The tree
is the structure for that, and because a tree is made of smaller trees, everything
about it — size, height, printing, evaluating — is a recursion of the shape "do the
children, then combine".

## Terminology

> **Definition.** A **tree** is a set of nodes with a **parent–child** relation such
> that one node, the **root**, has no parent and every other node has exactly one.
> An **internal** node has at least one child, an **external** node (**leaf**) none.
> **Ancestors** of a node are its parent, grandparent, …; **descendants** the reverse;
> **siblings** share a parent. The **subtree** at a node is the node with all its
> descendants. The **depth** of a node is the number of ancestors it has (the root: 0);
> the **height** of a tree is the maximum depth of a node (a single node: 0). A tree is
> **ordered** when the children of every node have a linear order.

The tree ADT (slides 8–11) is position-based like the node list: `root()`,
`parent(p)`, `children(p)`, `isInternal(p)`, `isExternal(p)`, `isRoot(p)`, `size()`,
`isEmpty()`, `replace(p, e)`, plus iterators over elements and positions. Depth and
height come from two short recursions: `depth(p)` is 0 at the root and
`1 + depth(parent(p))` otherwise — $O(d_p)$; `height(p)` is 0 at a leaf and
`1 + max(height(c))` over the children — computing it at the root visits every node
once, $O(n)$, whereas the naive "maximum depth over all nodes" costs
$O(\sum_p (d_p + 1))$, quadratic in the worst case.

## Traversals

> **Definition.** A **traversal** visits every node of a tree in a systematic order.
> **Preorder**: visit the node, then traverse each child's subtree in order — a
> document's headings in reading order. **Postorder**: traverse the children first,
> then visit the node — computing the size of each directory from its contents. Both
> are $O(n)$: each node is visited once and each edge crossed twice.

```sim
id: ds-352-tree-traversals
custom: true
engine: ds
mode: binary-tree
data: [1, [2, [4, null, null], [5, null, null]], [3, [6, null, null], [7, null, null]]]
ops: ["preorder"]
note: "Preorder numbers the visits as it descends; run postorder and inorder on the same tree and compare the sequences — the root is first, last and in the middle respectively. The Euler tour visits each node three times, and every classical traversal is the Euler tour with two of the three visits deleted."
```

## Binary trees

> **Definition.** A **binary tree** is an ordered tree in which every node has at most
> two children, the **left** and the **right**; it is **proper** (full) when every
> internal node has exactly two. Recursively: a binary tree is a single node, or a node
> with a left and a right binary tree as subtrees. **Arithmetic expression trees**
> (operators internal, operands external) and **decision trees** (yes/no questions
> internal, outcomes external) are the two standard examples.

The ADT adds `left(p)`, `right(p)`, `hasLeft(p)`, `hasRight(p)`. With $n$ nodes,
$e$ external, $i$ internal and height $h$, a proper binary tree satisfies
$e = i + 1$, $n = 2e - 1$, $h \le i$, $h \ge \log_2 e$ and $h \ge \log_2 (n+1) - 1$ — the
lower bound on height is what makes balanced trees (unit 8) attractive.

**Inorder** is the binary tree's third traversal: left subtree, node, right subtree.
On an expression tree it prints the infix expression (with parentheses added when
descending into an internal node); on a search tree it lists keys in sorted order.
**Evaluating** an expression tree is a postorder computation: evaluate both subtrees,
apply the operator at the node.

```sim
id: java-352-expression-tree
custom: true
engine: java
code: |
  public class Main {
      static class Node {
          String v; Node left, right;
          Node(String v, Node l, Node r) { this.v = v; left = l; right = r; }
          boolean isLeaf() { return left == null && right == null; }
      }
      static String infix(Node t) {                          // inorder: left, node, right
          if (t.isLeaf()) return t.v;
          return "(" + infix(t.left) + " " + t.v + " " + infix(t.right) + ")";
      }
      static int evaluate(Node t) {                          // postorder: children first, then combine
          if (t.isLeaf()) return Integer.parseInt(t.v);
          int a = evaluate(t.left), b = evaluate(t.right);
          switch (t.v) {
              case "+": return a + b;
              case "-": return a - b;
              case "*": return a * b;
              default: return a / b;
          }
      }
      static int height(Node t) { return t == null ? -1 : 1 + Math.max(height(t.left), height(t.right)); }
      static int size(Node t) { return t == null ? 0 : 1 + size(t.left) + size(t.right); }
      public static void main(String[] args) {
          Node t = new Node("*", new Node("+", new Node("3", null, null), new Node("1", null, null)),
                                 new Node("-", new Node("9", null, null), new Node("5", null, null)));
          System.out.println(infix(t) + " = " + evaluate(t));
          System.out.println("size " + size(t) + ", height " + height(t) + ", external " + (size(t) + 1) / 2);
      }
  }
note: 'Three recursions of the same shape. Step into evaluate and watch the frames: the leaves return first (postorder), then (3 + 1) and (9 − 5) are combined at the root. The tree is proper, so external = (n + 1)/2. Replace the root operator or add a subtree and re-run.'
```

## The Euler tour

> **Definition.** The **Euler tour** of a binary tree walks around it keeping the tree
> on the left: each node is met three times — on the **left** (before its left
> subtree), from **below** (between the subtrees) and on the **right** (after the right
> subtree). Preorder, inorder and postorder are the tour with the other two visits
> ignored, and the tour is the general template: a **template method** `eulerTour(p)`
> calls `visitLeft`, recurses left, `visitBelow`, recurses right, `visitRight`, and a
> subclass overrides whichever visits it needs — printing the parentheses of an
> expression on the left and right visits, the operator below.

```sim
id: ds-352-euler-tour
custom: true
engine: ds
mode: binary-tree
data: ["*", ["+", 3, 1], ["-", 9, 5]]
ops: ["euler"]
note: "The same expression tree as the Java example. The tour sequence marks each visit with ↓ (left), · (below) and ↑ (right); keep only the · visits and you have the inorder listing 3 + 1 * 9 − 5, keep the ↑ and you have postorder, which is how the evaluation proceeds."
```

## Representations

**Linked structure** (slides 26–28): each node holds its element, a reference to the
parent, and either a list of children (general tree) or `left` and `right` (binary).
Space $O(n)$; `parent`, `left`, `right`, `isInternal` are $O(1)$; `children(p)` is
$O(c_p)$; a full traversal $O(n)$.

**Array-based binary tree** (slides 29–31): number the nodes by level, root $1$, and for
the node at index $p$ put the left child at $2p$ and the right at $2p + 1$ (parent at
$\lfloor p/2 \rfloor$). No references at all, $O(1)$ navigation — but the array must
be long enough for the *deepest* possible index, $2^{h+1} - 1$, so an unbalanced tree
wastes exponential space. The next unit's heap is always complete, which is why it is
the one tree stored this way.

```sim
id: ds-352-tree-height
custom: true
engine: ds
mode: binary-tree
data: [8, [3, [1, null, null], [6, [4, null, null], null]], [10, null, [14, [13, null, null], null]]]
ops: ["height"]
note: "height / depth labels each node with d (its depth, counted from the root) and h (its height, from the deepest leaf below it), computed in one postorder pass: a node's height is 1 + the larger of its children's. Level-number this tree (root 1, children 2p and 2p + 1) and note the gaps an array would have to leave."
```

**Equations**

- *Depth and height*: $\mathrm{depth}(p) = 0$ at the root, else $1 + \mathrm{depth}(\mathrm{parent}(p))$; $\mathrm{height}(p) = 0$ at a leaf, else $1 + \max_c \mathrm{height}(c)$.
- *Proper binary tree with $n$ nodes, $e$ leaves, $i$ internal, height $h$*: $e = i + 1$, $n = 2e - 1$, $\log_2(n + 1) - 1 \le h \le (n - 1)/2$.
- *Level numbering*: children of $p$ at $2p$ and $2p + 1$, parent at $\lfloor p / 2 \rfloor$ (1-based); an array of size $2^{h+1} - 1$ in the worst case.

> **Key insight.** A tree is a node plus smaller trees, so every tree algorithm is a
> recursion: choose where the node's own work goes — before the children (preorder),
> after (postorder), between the two in a binary tree (inorder) — and the Euler tour is
> the template that contains all three.

## Further reading

- [Goodrich, Tamassia & Goldwasser — Trees (ch. 8 slides)](https://www.cs.uic.edu/~jbell/CourseNotes/DataStructures/Trees.html) — Terminology, traversals, expression trees and the two representations.
- [Sedgewick & Wayne — Binary Trees](https://algs4.cs.princeton.edu/32bst/) — Traversals and the linked representation in Java, leading into search trees.
