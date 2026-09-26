---
title: Digraphs, topological order and shortest paths
order: 12
status: detailed
weeks: [12]
introduces: [shortest-path]
requires:
  - {concept: graph, strength: hard}
  - {concept: graph-traversal, strength: hard}
  - {concept: priority-queue, strength: hard}
  - {concept: heap, strength: soft}
  - {concept: algorithm-analysis, strength: hard}
  - {concept: matrix, strength: soft}
reinforces: []
---

When edges have a direction, "connected" splits into "can reach" and "can be reached
from", cycles become the difference between a schedule and a deadlock, and paths get a
length worth minimising. This last unit runs DFS and BFS on digraphs, computes what
reaches what, orders a DAG, and finds shortest paths in weighted graphs — Dijkstra's
algorithm being the priority queue's most important application.

## Digraphs, reachability and strong connectivity

> **Definition.** A **digraph** has directed edges only. Vertex $v$ is **reachable**
> from $u$ if there is a directed path from $u$ to $v$. A digraph is **strongly
> connected** if every vertex is reachable from every other; its **strongly connected
> components** are the maximal strongly connected subgraphs. The **transitive
> closure** $G^*$ of $G$ has the same vertices and an edge $(u, v)$ whenever $v$ is
> reachable from $u$ in $G$.

DFS and BFS specialise to digraphs by following edges only in their direction: DFS
from $s$ then visits exactly the vertices reachable from $s$, in $O(n + m)$. On a
digraph DFS classifies non-discovery edges into three kinds — a **back** edge to an
ancestor on the recursion stack (a cycle!), a **forward** edge to a descendant already
finished, and a **cross** edge to a vertex finished in another branch. Strong
connectivity is two searches: DFS from any $v$ must reach everything, and DFS from $v$
in the graph with all edges reversed must reach everything too — $O(n + m)$.

```sim
id: ds-352-digraph-dfs
custom: true
engine: ds
mode: graph
directed: true
edges: ["A-B", "A-C", "B-D", "C-D", "D-E", "E-B", "C-F", "F-E", "A-F"]
start: A
ops: ["dfs A"]
note: "Directed DFS from A. Edge E→B is a back edge — B is still on the recursion stack when E looks at it — so the digraph has a cycle B→D→E→B. A→F is a forward edge (F was finished under C before A got to it); C→D is a cross edge. Start the search from F instead and only E, B, D are reached: reachability depends on the start."
```

## Transitive closure and Floyd-Warshall

Computing the closure by running DFS from every vertex costs $O(n(n + m))$. The
**Floyd-Warshall** algorithm does it with an adjacency matrix and three nested loops:
number the vertices $v_1 \dots v_n$; let $G_k$ have an edge $(v_i, v_j)$ whenever there
is a path from $v_i$ to $v_j$ using only $v_1 \dots v_k$ as intermediate vertices. Then
$G_0 = G$ and $G_k$ is $G_{k-1}$ plus the edge $(v_i, v_j)$ whenever $G_{k-1}$ has both
$(v_i, v_k)$ and $(v_k, v_j)$; $G_n = G^*$. Each round is $n^2$ constant-time checks:
$O(n^3)$ — better than $n$ searches when the graph is dense. The same loop with
$\min(M[i][j],\ M[i][k] + M[k][j])$ computes all-pairs shortest distances in a weighted
graph.

```sim
id: ds-352-floyd-warshall
custom: true
engine: ds
mode: graph
directed: true
edges: ["A-B", "B-C", "C-A", "C-D", "D-E"]
ops: ["floyd"]
note: "The matrix on the right is G₀, then G_k after each round k; the highlighted row and column are the vertex allowed as an intermediate. After the round for C, A reaches D through the cycle; after D's round, everything on the cycle reaches E. Five rounds of 25 checks for five vertices: n³."
```

## DAGs and topological order

> **Definition.** A **directed acyclic graph (DAG)** is a digraph with no directed
> cycle. A **topological ordering** numbers the vertices $v_1 \dots v_n$ so that every
> edge $(v_i, v_j)$ has $i < j$. A digraph has a topological ordering *if and only if*
> it is a DAG — prerequisites, task dependencies and build orders are DAGs precisely
> when they can be scheduled.

Two algorithms, both $O(n + m)$. **By in-degrees**: compute
every vertex's in-degree; repeatedly output a vertex of in-degree 0, remove it, and
decrement the in-degrees of its out-neighbours, adding those that reach 0 to the
ready set. If the ready set empties before every vertex is out, the remaining vertices
lie on a cycle. **By DFS**: run DFS and number each vertex when its call
*finishes*, counting down from $n$ — a vertex finishes after every vertex reachable
from it, so finishing order reversed is a topological order.

```sim
id: ds-352-topological
custom: true
engine: ds
mode: graph
directed: true
edges: ["A-C", "B-C", "B-D", "C-E", "D-E", "D-F", "E-G", "F-G"]
ops: ["topo"]
note: "Each vertex shows its current in-degree; the ready set (in-degree 0) is on the right. Removing a vertex decrements its out-neighbours, and a vertex is output the moment it reaches 0. Several orders are valid — A, B could start in either order. Add an edge G-A to the block and the algorithm stalls with every remaining vertex on the cycle."
```

## Weighted graphs and shortest paths

> **Definition.** In a **weighted graph** each edge has a numeric **weight**; the
> **length** of a path is the sum of its edges' weights, and the **distance**
> $d(u, v)$ is the length of a shortest path from $u$ to $v$ ($\infty$ if none). Two
> properties: a subpath of a shortest path is a shortest path, and the shortest paths
> from one source form a tree, the **shortest-path tree**. If a **negative-weight
> cycle** is reachable, distances are undefined (going round again always helps).

BFS finds shortest paths only when every edge weighs the same. For general
non-negative weights the algorithm is Dijkstra's.

## Dijkstra's algorithm

> **Definition.** **Dijkstra's algorithm** computes the distances from a source $s$
> to all vertices in a graph with non-negative weights. Every vertex carries a label
> $D[v]$, an upper bound on its distance: $D[s] = 0$, all others $\infty$. A **cloud**
> of finished vertices grows from $s$: repeatedly remove from a priority queue (keyed
> by $D$) the vertex $u$ outside the cloud with the smallest label — its $D[u]$ is now
> the true distance — and **relax** every edge $(u, z)$ to a vertex $z$ still outside:
> if $D[u] + w(u, z) < D[z]$, set $D[z]$ to that and update its key.

Why the removed vertex is final: any other path to $u$ would have to leave the cloud
through some vertex $y$ with $D[y] \ge D[u]$ and then add non-negative weights — this is
exactly where negative edges break the argument. With a heap-based **adaptable**
priority queue (entries that can be found and re-keyed in $O(\log n)$), the $n$
removals and $m$ relaxations cost $O((n + m) \log n)$; with an unsorted list the
removals dominate at $O(n^2)$, better for dense graphs.

```sim
id: ds-352-dijkstra
custom: true
engine: ds
mode: graph
directed: true
edges: ["A-B 8", "A-C 2", "A-D 4", "B-E 7", "C-B 5", "C-D 1", "C-E 4", "D-E 3", "E-F 2", "D-F 9"]
start: A
ops: ["dijkstra A"]
note: "The priority queue on the right holds every unfinished vertex with its label. Each removal takes the smallest label into the cloud (green) and relaxes its outgoing edges; a relaxation that improves a label turns the edge red — the current best incoming edge, which ends up in the shortest-path tree. B's label drops from 8 to 7 through C; F is reached in 8 via C–D–E rather than 12 through the direct edge D→F."
```

```sim
id: java-352-dijkstra
custom: true
engine: java
code: |
  import java.util.*;
  public class Main {
      static class Edge { String to; int w; Edge(String to, int w) { this.to = to; this.w = w; } }
      static Map<String, List<Edge>> adj = new TreeMap<>();
      static void edge(String u, String v, int w) { adj.computeIfAbsent(u, k -> new ArrayList<>()).add(new Edge(v, w)); adj.computeIfAbsent(v, k -> new ArrayList<>()); }
      static Map<String, Integer> dijkstra(String s) {
          Map<String, Integer> dist = new TreeMap<>();
          for (String v : adj.keySet()) dist.put(v, Integer.MAX_VALUE);
          dist.put(s, 0);
          Set<String> cloud = new HashSet<>();
          while (cloud.size() < adj.size()) {
              String u = null;                                      // the simple O(n) "removeMin": scan the labels
              for (String v : adj.keySet()) if (!cloud.contains(v) && (u == null || dist.get(v) < dist.get(u))) u = v;
              if (dist.get(u) == Integer.MAX_VALUE) break;          // the rest is unreachable
              cloud.add(u);
              for (Edge e : adj.get(u))
                  if (!cloud.contains(e.to) && dist.get(u) + e.w < dist.get(e.to)) dist.put(e.to, dist.get(u) + e.w);   // relax
          }
          return dist;
      }
      public static void main(String[] args) {
          edge("A", "B", 8); edge("A", "C", 2); edge("A", "D", 4); edge("B", "E", 7); edge("C", "B", 5);
          edge("C", "D", 1); edge("C", "E", 4); edge("D", "E", 3); edge("E", "F", 2); edge("D", "F", 9);
          System.out.println(dijkstra("A"));
      }
  }
note: 'Dijkstra with the labels in a map and the "priority queue" a linear scan — O(n²), which is fine for dense graphs and easiest to read. Watch cloud and dist in the Variables panel grow and drop together. Replace the scan by a PriorityQueue of (label, vertex) pairs for the O((n + m) log n) version.'
```

## Negative weights: Bellman-Ford and DAGs

Dijkstra's argument needs non-negative weights; with a negative edge a vertex may be
finalised too early. **Bellman-Ford** drops the cloud: start
with the same labels and simply relax *every* edge, $n - 1$ times over. After round
$i$ every shortest path with at most $i$ edges is correct, and no shortest path has
more than $n - 1$ edges, so the labels are final — $O(nm)$, and an $n$-th round that
still improves something proves a negative cycle. On a **DAG** even
that is more than needed: relax the edges of each vertex in topological order, once —
$O(n + m)$, negative weights allowed, because every path reaches a vertex only through
vertices earlier in the order.

```sim
id: ds-352-bellman-ford
custom: true
engine: ds
mode: graph
directed: true
edges: ["A-B 4", "A-C 2", "B-C -3", "B-D 2", "C-D 3", "C-E 5", "D-E -1", "E-F 2"]
start: A
ops: ["bellmanFord A"]
note: "The edge B→C weighs −3, so Dijkstra would finalise C at 2 and miss the path A→B→C of length 1 (press Dijkstra to see it refuse). Bellman-Ford relaxes every edge in rounds; with the edges in this order the labels settle in the first round and the second confirms nothing changes (a worse order needs up to n − 1). Change B→C to −7 with an edge C→B 1 and a negative cycle appears."
```

**Equations**

- *Floyd-Warshall*: $G_k$ gains $(v_i, v_j)$ when $G_{k-1}$ has $(v_i, v_k)$ and $(v_k, v_j)$; $n$ rounds of $n^2$ checks, $O(n^3)$. Weighted: $M_k[i][j] = \min(M_{k-1}[i][j],\ M_{k-1}[i][k] + M_{k-1}[k][j])$.
- *Topological order*: exists iff the digraph is a DAG; both algorithms $O(n + m)$.
- *Dijkstra relaxation*: $D[z] \leftarrow \min(D[z],\ D[u] + w(u, z))$; heap-based $O((n + m)\log n)$, list-based $O(n^2)$.
- *Bellman-Ford*: $n - 1$ rounds over all edges, $O(nm)$; a further improving round $\iff$ a reachable negative cycle. *DAG*: one pass in topological order, $O(n + m)$.

> **Key insight.** Direction turns "connected" into "reachable" (DFS), acyclic into
> "orderable" (topological sort), and weights turn "fewest edges" (BFS) into "least
> total weight": Dijkstra grows a cloud by smallest label and is right exactly because
> weights are non-negative; Bellman-Ford pays $O(nm)$ to drop that assumption.

## Further reading

- [Sedgewick & Wayne — Shortest Paths](https://algs4.cs.princeton.edu/44sp/) — Dijkstra with an indexed priority queue, the DAG algorithm and Bellman-Ford, with negative-cycle detection.
