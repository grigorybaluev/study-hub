// Fixture tests for the data-structure visualiser models (app/src/sims/ds.js). Run: node scripts/test-ds.mjs
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const src = readFileSync(new URL('../src/sims/ds.js', import.meta.url), 'utf8');
const sandbox = { window: {}, console, module: { exports: {} } };
vm.runInNewContext(src, sandbox);
const DS = sandbox.window.DS;

let pass = 0, fail = 0;
const t = (name, fn) => { try { fn(); pass++; } catch (e) { fail++; console.log(`✗ ${name}: ${e.message}`); } };
const eq = (a, b, what) => { const A = JSON.stringify(a), B = JSON.stringify(b); if (A !== B) throw new Error(`${what || 'value'}: expected ${B}, got ${A}`); };
const ok = (c, what) => { if (!c) throw new Error(what || 'assertion failed'); };
const renders = m => { for (let k = 0; k < m.steps.length; k++) { const r = m.render(k); const svg = typeof r === 'string' ? r : r.svg; ok(svg.startsWith('<svg') && svg.endsWith('</svg>'), 'render ' + k); } };

t('stack: push/pop with capacity and doubling', () => {
  const m = DS.model({ mode: 'stack', data: [1, 2], capacity: 3, ops: ['push 3', 'push 4', 'pop'] });
  eq(m.state.a.slice(0, m.state.t + 1), [1, 2], 'after scripted ops (push 4 refused at full capacity, then pop)');
  ok(m.steps.some(s => s.hl.err), 'a full stack reports an error step');
  const g = DS.model({ mode: 'stack', data: [1, 2, 3], capacity: 3, grow: 'doubling' });
  g.run('push', [4]); eq(g.state.cap, 6, 'capacity doubled'); eq(g.state.a.slice(0, 4), [1, 2, 3, 4]);
  g.run('pop'); g.run('pop'); eq(g.state.t, 1); renders(g);
});
t('queue: circular wrap-around', () => {
  const m = DS.model({ mode: 'queue', data: [1, 2, 3], capacity: 4, ops: ['dequeue', 'dequeue', 'enqueue 4', 'enqueue 5'] });
  eq(m.state.f, 2); eq(m.state.n, 3);
  const logical = []; for (let k = 0; k < m.state.n; k++) logical.push(m.state.a[(m.state.f + k) % m.state.cap]);
  eq(logical, [3, 4, 5], 'front to back'); ok(m.state.a[0] === 5, 'wrapped into index 0'); renders(m);
});
t('array-list: insert shifts, remove shifts, growth', () => {
  const m = DS.model({ mode: 'array-list', data: [1, 2, 3], capacity: 3, ops: ['add 1 9', 'remove 0'] });
  eq(m.state.a.slice(0, m.state.n), [9, 2, 3]); eq(m.state.cap, 6); ok(m.state.shifts === 5, 'two shifts in, three out: ' + m.state.shifts); renders(m);
});
t('linked-list singly: front/end/at and removals', () => {
  const m = DS.model({ mode: 'linked-list', data: [2, 3], ops: ['insertFirst 1', 'insertLast 4', 'insertAt 2 9', 'removeAt 2', 'removeLast', 'removeFirst'] });
  const seq = []; for (let c = m.state.head; c; c = m.state.nodes[c].next) seq.push(m.state.nodes[c].v);
  eq(seq, [2, 3]); eq(m.state.size, 2); ok(m.state.tail && m.state.nodes[m.state.tail].v === 3, 'tail'); renders(m);
});
t('linked-list doubly: sentinels and O(1) removal at both ends', () => {
  const m = DS.model({ mode: 'linked-list', kind: 'doubly', data: [5, 6, 7], ops: ['removeLast', 'insertFirst 4', 'removeAt 1'] });
  const seq = []; for (let c = m.state.nodes[m.state.header].next; c !== m.state.trailer; c = m.state.nodes[c].next) seq.push(m.state.nodes[c].v);
  eq(seq, [4, 6]); const back = []; for (let c = m.state.nodes[m.state.trailer].prev; c !== m.state.header; c = m.state.nodes[c].prev) back.push(m.state.nodes[c].v); eq(back, [6, 4], 'prev chain'); renders(m);
});
t('call-tree: fib(5) makes 15 calls, depth 4; sum is linear', () => {
  const m = DS.model({ mode: 'call-tree', fn: 'fib', n: 5, ops: ['run'] });
  eq(m.state.calls, 15); eq(m.state.maxDepth, 4); eq(m.state.nodes[0].value, 5); renders(m);
  const s = DS.model({ mode: 'call-tree', fn: 'sum', n: 4, data: [1, 2, 3, 4] }); s.run('run'); eq(s.state.calls, 5); eq(s.state.nodes[0].value, 10);
  const b = DS.model({ mode: 'call-tree', fn: 'binsum', n: 8, data: [1, 2, 3, 4, 5, 6, 7, 8] }); b.run('run'); eq(b.state.nodes[0].value, 36); eq(b.state.maxDepth, 3);
});
t('binary-tree: traversal orders and Euler tour', () => {
  const m = DS.model({ mode: 'binary-tree', data: [1, 2, 3, 4, 5, 6, 7] });
  m.run('preorder'); eq(m.state.order.map(id => m.state.nodes[id].v), [1, 2, 4, 5, 3, 6, 7]);
  m.run('inorder'); eq(m.state.order.map(id => m.state.nodes[id].v), [4, 2, 5, 1, 6, 3, 7]);
  m.run('postorder'); eq(m.state.order.map(id => m.state.nodes[id].v), [4, 5, 2, 6, 7, 3, 1]);
  m.run('euler'); eq(m.state.euler.length, 21); m.run('height'); ok(m.steps[m.steps.length - 1].d.includes('height of the tree = 2')); renders(m);
  const n = DS.model({ mode: 'binary-tree', data: ['+', ['*', 2, 3], ['-', 8, 5]] }); n.run('inorder'); eq(n.state.order.map(id => n.state.nodes[id].v), [2, '*', 3, '+', 8, '-', 5]);
});
t('heap: insert keeps heap order, removeMin returns ascending, bottom-up build, heap-sort', () => {
  const m = DS.model({ mode: 'heap', data: [9, 4, 7, 1, 8] });
  const isHeap = a => a.every((x, i) => i === 0 || a[Math.floor((i - 1) / 2)] <= x);
  ok(isHeap(m.state.a), 'initial'); m.run('insert', [2]); ok(isHeap(m.state.a), 'after insert'); eq(m.state.a[0], 1);
  const out = []; while (m.state.a.length) { m.run('removeMin'); const d = m.steps[m.steps.length - 1].d; out.push(+d.match(/returned (\d+)/)[1]); }
  eq(out, [1, 2, 4, 7, 8, 9]); renders(m);
  const b = DS.model({ mode: 'heap', data: [5, 3, 8, 1, 9, 2], build: 'bottom-up' }); b.run('build'); ok(isHeap(b.state.a), 'bottom-up'); eq(b.state.a[0], 1);
  const h = DS.model({ mode: 'heap', data: [5, 3, 8, 1, 9, 2] }); h.run('heapSort'); eq(h.state.a, [9, 8, 5, 3, 2, 1], 'min-heap sort leaves descending order');
});
t('bst: insert/find/remove keep in-order sorted; avl stays balanced', () => {
  const inorder = s => { const out = []; const w = id => { if (id === null) return; w(s.nodes[id].l); out.push(s.nodes[id].k); w(s.nodes[id].r); }; w(s.root); return out; };
  const m = DS.model({ mode: 'bst', data: [8, 3, 10, 1, 6, 14, 4, 7, 13] });
  eq(inorder(m.state), [1, 3, 4, 6, 7, 8, 10, 13, 14]); m.run('remove', [3]); eq(inorder(m.state), [1, 4, 6, 7, 8, 10, 13, 14]); m.run('remove', [8]); eq(m.state.nodes[m.state.root].k, 10, 'successor replaces the root');
  m.run('find', [99]); ok(m.steps[m.steps.length - 1].hl.err, 'not found'); renders(m);
  const a = DS.model({ mode: 'avl' });
  const H = (s, id) => id === null ? -1 : s.nodes[id].h;
  const balanced = s => Object.keys(s.nodes).every(id => Math.abs(H(s, s.nodes[id].l) - H(s, s.nodes[id].r)) <= 1 && s.nodes[id].h === 1 + Math.max(H(s, s.nodes[id].l), H(s, s.nodes[id].r)));
  for (const k of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) { a.run('insert', [k]); ok(balanced(a.state), 'balanced after ' + k); }
  eq(inorder(a.state), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]); ok(H(a.state, a.state.root) <= 3, 'height ' + H(a.state, a.state.root));
  for (const k of [1, 2, 3, 10]) { a.run('remove', [k]); ok(balanced(a.state), 'balanced after removing ' + k); }
  eq(inorder(a.state), [4, 5, 6, 7, 8, 9]); renders(a);
  const dr = DS.model({ mode: 'avl', data: [3, 1] }); dr.run('insert', [2]); ok(dr.steps.some(s => /double rotation/.test(s.d)), 'left-right case is a double rotation'); eq(dr.state.nodes[dr.state.root].k, 2); ok(balanced(dr.state));
});
t('hash-table: chaining and probing find every key; removal markers', () => {
  for (const scheme of ['chaining', 'linear', 'quadratic', 'double']) {
    const m = DS.model({ mode: 'hash-table', buckets: 11, scheme, data: [18, 41, 22, 44, 59, 32, 31, 73] });
    for (const k of [18, 41, 22, 44, 59, 32, 31, 73]) { m.run('find', [k]); ok(/found/.test(m.steps[m.steps.length - 1].d), `${scheme} find ${k}`); }
    m.run('find', [99]); ok(/not/.test(m.steps[m.steps.length - 1].d), scheme + ' miss');
    m.run('remove', [44]); m.run('find', [59]); ok(/found/.test(m.steps[m.steps.length - 1].d), scheme + ' find past a removal');
    renders(m);
  }
  const s = DS.model({ mode: 'hash-table', buckets: 7, data: ['cat', 'dog'] }); s.run('find', ['dog']); ok(/found/.test(s.steps[s.steps.length - 1].d), 'string keys');
});
t('sort: every algorithm sorts; comparison counts sensible', () => {
  const data = [7, 2, 9, 4, 3, 8, 6, 1];
  for (const algo of ['merge', 'quick', 'insertion', 'selection', 'bucket', 'radix']) {
    const m = DS.model({ mode: 'sort', algo, data }); m.run('sort');
    eq(m.state.a, [1, 2, 3, 4, 6, 7, 8, 9], algo); ok(m.state.done, algo + ' done'); renders(m);
    if (algo === 'merge') ok(m.state.cmp <= 17 && m.state.cmp >= 12, 'merge comparisons ' + m.state.cmp);
    if (algo === 'bucket') ok(m.state.cmp === 0, 'bucket makes no comparisons');
  }
  const r = DS.model({ mode: 'sort', algo: 'radix', data: [170, 45, 75, 90, 802, 24, 2, 66] }); r.run('sort'); eq(r.state.a, [2, 24, 45, 66, 75, 90, 170, 802]);
});
t('graph: DFS/BFS orders, topological sort, Dijkstra, Bellman-Ford, Floyd-Warshall', () => {
  const g = DS.model({ mode: 'graph', edges: ['A-B', 'A-C', 'B-D', 'C-D', 'D-E'] });
  g.run('dfs', ['A']); eq(g.state.order, ['A', 'B', 'D', 'C', 'E']); ok(Object.values(g.state.etone).filter(t => t === 'back').length === 1, 'one back edge');
  g.run('bfs', ['A']); eq(g.state.order, ['A', 'B', 'C', 'D', 'E']); renders(g);
  const d = DS.model({ mode: 'graph', directed: true, edges: ['A-B', 'A-C', 'B-D', 'C-D', 'D-E', 'C-E'] });
  d.run('topo'); eq(d.state.order, ['A', 'B', 'C', 'D', 'E']);
  const cyc = DS.model({ mode: 'graph', directed: true, edges: ['A-B', 'B-C', 'C-A'] }); cyc.run('topo'); ok(cyc.steps[cyc.steps.length - 1].hl.err, 'cycle detected');
  const w = DS.model({ mode: 'graph', directed: true, edges: ['A-B 4', 'A-C 1', 'C-B 2', 'B-D 1', 'C-D 5'] });
  w.run('dijkstra', ['A']); eq(w.state.side.lines, ['A: 0', 'B: 3', 'C: 1', 'D: 4']);
  w.run('bellmanFord', ['A']); eq(w.state.side.lines, ['A: 0', 'B: 3', 'C: 1', 'D: 4']);
  w.run('floyd'); eq(w.state.matrix.rows[0], [0, 3, 1, 4]); renders(w);
  const u = DS.model({ mode: 'graph', edges: ['A-B', 'B-C'] }); u.run('floyd'); eq(u.state.matrix.rows, [[1, 1, 1], [1, 1, 1], [1, 1, 1]], 'transitive closure');
  u.run('adjacency'); ok(u.state.side.lines[0].startsWith('A: B'), 'adjacency list');
});
t('scripted ops run on load and the initial step describes them', () => {
  const m = DS.model({ mode: 'stack', data: [], ops: ['push 1', 'push 2'] });
  ok(m.steps[0].d.includes('push(1)'), 'intro'); eq(m.state.t, 1);
});

t('review regressions: binsum n=0 terminates, heap usable after heap-sort, Dijkstra refuses negative weights', () => {
  const b = DS.model({ mode: 'call-tree', fn: 'binsum', n: 0, data: [1, 2, 3] }); b.run('run'); ok(b.state.done, 'binsum finished');
  const h = DS.model({ mode: 'heap', data: [5, 3, 8, 1] }); h.run('heapSort'); h.run('insert', [2]);
  ok(h.state.sorted === null && h.state.a.every((x, i) => i === 0 || h.state.a[Math.floor((i - 1) / 2)] <= x), 'heap order restored after sort');
  const g = DS.model({ mode: 'graph', directed: true, edges: ['A-B -2', 'B-C 1'] }); const steps = g.run('dijkstra', ['A']); ok(steps.length === 1 && steps[0].hl.err, 'negative weights refused');
});

console.log(`${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
