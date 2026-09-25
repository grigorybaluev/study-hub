---
title: Graphs, depth-first and breadth-first search
order: 11
status: detailed
weeks: [11]
introduces:
  - {concept: graph, perspective: "the graph ADT: edge list, adjacency list and adjacency matrix, with the cost of every operation"}
  - graph-traversal
requires:
  - {concept: linked-list, strength: hard}
  - {concept: queue, strength: hard}
  - {concept: stack, strength: hard}
  - {concept: recursion, strength: hard}
  - {concept: algorithm-analysis, strength: hard}
  - {concept: tree, strength: hard}
  - {concept: hash-table, strength: soft}
reinforces: []
---

Cities and flights, pages and links, tasks and prerequisites: a **graph** is the
structure for "things and the connections between them", and it is the most general
one in the course — trees and lists are special cases. This unit fixes the
vocabulary, the three ways to store a graph, and the two ways to walk one; almost
every graph algorithm afterwards is one of the two walks with extra bookkeeping.

## Vocabulary

> **Definition.** A **graph** $G = (V, E)$ is a set of **vertices** (nodes) and a
> collection of **edges**, each a pair of vertices. An edge is **directed** (an
> ordered pair, drawn as an arrow from origin to destination) or **undirected**; a
> graph is directed, undirected or mixed accordingly. Edges and vertices may carry
> elements (a flight's distance, a city's name).

Terms used throughout (deck 19, slides 8–16): the **endpoints** of an edge; an edge is
**incident** on its endpoints; two vertices are **adjacent** when an edge joins them;
the **degree** of a vertex is the number of incident edges (in-degree and out-degree
in a digraph); **parallel edges** share both endpoints, a **self-loop** has one; a
**path** is an alternating sequence of vertices and edges (**simple** when no vertex
repeats), a **cycle** a path that returns to its start; a **subgraph** keeps some of
the vertices and edges; a graph is **connected** when every pair of vertices is joined
by a path, and its **connected components** are its maximal connected subgraphs; a
**tree** is a connected graph with no cycles, a **forest** a graph whose components
are trees, and a **spanning tree** of a connected graph a spanning subgraph that is a
tree.

Two counting facts: the degrees of an undirected graph sum to $2m$ (each edge is
counted at both ends; in a digraph, in-degrees and out-degrees each sum to $m$); and
a simple undirected graph has $m \le n(n-1)/2$ edges — so $m$ is $O(n^2)$, and "linear
in the graph" means $O(n + m)$.

## The graph ADT and three representations

The ADT (slides 20–21) treats vertices and edges as positions: `endVertices(e)`,
`opposite(v, e)`, `areAdjacent(v, w)`, `incidentEdges(v)`, `insertVertex(o)`,
`insertEdge(v, w, o)`, `removeVertex(v)`, `removeEdge(e)`, plus the collections
`vertices()` and `edges()`. Three structures implement it:

| operation | edge list | adjacency list | adjacency matrix |
|---|---|---|---|
| space | $n + m$ | $n + m$ | $n^2$ |
| `incidentEdges(v)` | $m$ | $\deg(v)$ | $n$ |
| `areAdjacent(v, w)` | $m$ | $\min(\deg(v), \deg(w))$ | $1$ |
| `insertVertex(o)` | $1$ | $1$ | $n^2$ |
| `insertEdge(v, w, o)` | $1$ | $1$ | $1$ |
| `removeVertex(v)` | $m$ | $\deg(v)$ | $n^2$ |
| `removeEdge(e)` | $1$ | $1$ | $1$ |

The **edge list** stores vertices and edges in two sequences with references between
them — simple, but finding a vertex's edges means scanning all of them. The
**adjacency list** gives every vertex its own list of incident edges, so a vertex's
neighbourhood costs its degree — the representation of choice for sparse graphs and
for every traversal below. The **adjacency matrix** stores an $n \times n$ array with
the edge (or its absence) at $[v][w]$: constant-time adjacency tests, $n^2$ space, and
adding a vertex means rebuilding the matrix — the choice for dense graphs.

```sim
id: ds-352-graph-representations
custom: true
engine: ds
mode: graph
edges: ["A-B", "A-C", "B-C", "B-D", "C-E", "D-E", "D-F"]
ops: ["adjacency"]
note: "The same undirected graph as an adjacency list (each vertex with its neighbours: total 2m entries) and as an adjacency matrix (symmetric, n² cells mostly zero). Sum the degrees in the list: 2m = 14. The DFS and BFS buttons below run on this graph too."
```

## Depth-first search

> **Definition.** **DFS** from a start vertex $s$ visits $s$, then for each incident
> edge $(s, w)$ in turn: if $w$ is unexplored, the edge is a **discovery edge** and DFS
> recurses into $w$; if $w$ was already visited, the edge is a **back edge**. It is
> the maze strategy — mark the intersection, walk down an unwalked corridor, retreat
> when stuck — and the recursion stack is the thread you unwind along.

DFS from $s$ visits every vertex of $s$'s connected component and labels every edge of
it, and the discovery edges form a **spanning tree** of that component (deck 20,
slides 18–19). Its cost is $O(n + m)$ once the representation gives incident edges in
$O(\deg(v))$: each vertex is labelled twice, each edge twice, and the time is
$\sum_v \deg(v) = 2m$ plus $n$. Two specialisations: **path finding** keeps the
current recursion path on a stack and stops when the target is reached; **cycle
finding** stops at the first back edge — the stack between the two endpoints is the
cycle.

```sim
id: ds-352-dfs
custom: true
engine: ds
mode: graph
edges: ["A-B", "A-C", "B-C", "B-D", "C-E", "D-E", "D-F"]
start: A
ops: ["dfs A"]
note: "Discovery edges (thick red) form the DFS spanning tree A–B–C–E–D–F; back edges (dashed blue) close cycles: C–A, met when C looks back at its grandparent, and D–B. The side panel is the recursion stack — the path from A to the current vertex; it is four deep when D is reached. The order of exploration follows the adjacency lists."
```

## Breadth-first search

> **Definition.** **BFS** from $s$ visits vertices in **levels**: $L_0 = \{s\}$, and
> $L_{i+1}$ is the set of unexplored vertices adjacent to $L_i$. An edge from a vertex
> of $L_i$ to an unexplored vertex is a **discovery edge**; to an already discovered
> one, a **cross edge**. A queue drives it: dequeue a vertex, enqueue its unexplored
> neighbours.

BFS also visits the whole component, also in $O(n + m)$, and its discovery edges also
form a spanning tree — but a special one: the path in it from $s$ to any $v$ has the
*fewest edges* of any path, and $v \in L_i$ means $v$ is exactly $i$ edges from $s$
(deck 21, slides 12–15). Cross edges join vertices of the same level or adjacent
levels, never two levels apart; in an undirected graph there are no back edges.

```sim
id: ds-352-bfs
custom: true
engine: ds
mode: graph
edges: ["A-B", "A-C", "B-C", "B-D", "C-E", "D-E", "D-F"]
start: A
ops: ["bfs A"]
note: "The levels L0, L1, L2, L3 are labelled at the vertices as they are discovered; the queue is in the side panel. Compare the spanning trees: DFS reached D along A–B–C–E–D, four edges; BFS reaches it in two (A–B–D), because a BFS tree path is always a shortest path in edge count. B–C and D–E are cross edges: same or adjacent level."
```

## DFS or BFS?

Both find the component, a spanning tree, connectivity, paths and cycles, in
$O(n + m)$. DFS is the natural fit when the recursion is the point — cycle detection,
topological order, biconnected components (a vertex whose removal disconnects the
graph is an **articulation vertex**; DFS back edges find them), the digraph
algorithms of the next unit. BFS is the fit when *distance in edges* is the point —
shortest paths in an unweighted graph, the nearest vertex with a property, level
structure. The Java skeleton is the same for both; only the container differs.

```sim
id: java-352-bfs-dfs
custom: true
engine: java
code: |
  import java.util.*;
  public class Main {
      static Map<String, List<String>> adj = new TreeMap<>();
      static void edge(String u, String v) {
          adj.computeIfAbsent(u, k -> new ArrayList<>()).add(v);
          adj.computeIfAbsent(v, k -> new ArrayList<>()).add(u);
      }
      static void dfs(String u, Set<String> seen, List<String> order) {
          seen.add(u); order.add(u);
          for (String w : adj.get(u)) if (!seen.contains(w)) dfs(w, seen, order);
      }
      static Map<String, Integer> bfs(String s) {
          Map<String, Integer> level = new LinkedHashMap<>();
          Deque<String> queue = new ArrayDeque<>();
          level.put(s, 0); queue.add(s);
          while (!queue.isEmpty()) {
              String u = queue.remove();
              for (String w : adj.get(u)) if (!level.containsKey(w)) { level.put(w, level.get(u) + 1); queue.add(w); }
          }
          return level;
      }
      public static void main(String[] args) {
          edge("A", "B"); edge("A", "C"); edge("B", "C"); edge("B", "D"); edge("C", "E"); edge("D", "E"); edge("D", "F");
          List<String> order = new ArrayList<>();
          dfs("A", new HashSet<>(), order);
          System.out.println("DFS order: " + order);
          System.out.println("BFS levels: " + bfs("A"));
      }
  }
note: 'The adjacency list is a map from vertex to neighbours. dfs is the recursion with a seen set; bfs is the same loop with a queue and a level map. Step through bfs and watch the queue hold exactly one level at a time. Add edge("F", "A") and see DFS find a cycle it never notices — cycle detection needs the back-edge test.'
```

**Equations**

- *Degree sum*: $\sum_{v} \deg(v) = 2m$; in a digraph $\sum \deg_{in} = \sum \deg_{out} = m$; simple undirected: $m \le n(n-1)/2$.
- *Traversal cost* with adjacency lists: $O(n + m)$ — each vertex and each edge is handled a constant number of times.
- *BFS levels*: $v \in L_i \iff$ the shortest path from $s$ to $v$ has $i$ edges; a cross edge joins $L_i$ to $L_j$ with $|i - j| \le 1$.

> **Key insight.** Store a graph as adjacency lists and both traversals run in
> $O(n + m)$. DFS follows one path as far as it goes and backs up — a stack, and the
> tool for structure (cycles, order, components); BFS grows outward one level at a
> time — a queue, and the tool for distance.

## Further reading

- [Goodrich, Tamassia & Goldwasser — Graphs (ch. 14 slides)](https://www.cs.uic.edu/~jbell/CourseNotes/DataStructures/Graphs.html) — Terminology, the three representations, DFS and BFS with the same figures.
- [Sedgewick & Wayne — Undirected Graphs](https://algs4.cs.princeton.edu/41graph/) — Adjacency lists in Java, DFS and BFS with path reconstruction and connected components.
