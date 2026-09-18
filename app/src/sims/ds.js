/* ── Data-structure visualiser (COMP 352) ──────────────────────────────────────
   DS.mount(id, cfg) builds a stepper inside #sim-<id>. cfg = { mode, data?, ops?, … } (see MODES).
   A mode is a pure model: `init(cfg)` returns a JSON state, and each operation is a generator over
   (state, args) that mutates the state and `yield`s a step { d: description, hl: highlights }.
   The shell snapshots the state after every yield, so ◀ Back / Step ▶ replay the operation, then
   renders a snapshot as SVG (plus an optional side table). Scripted `ops` run on load; the mode's
   controls let the reader keep driving the structure. Models are DOM-free (DS.model(cfg) in node). */
(function () {
  'use strict';
  const DS = {};
  const clone = s => JSON.parse(JSON.stringify(s));
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const num = (x, d) => { const v = Number(x); return Number.isFinite(v) ? v : d; };
  const fmt = v => typeof v === 'number' && !Number.isInteger(v) ? v.toFixed(2) : String(v);
  const C = { ink: '#1e293b', muted: '#64748b', line: '#94a3b8', hi: '#dc2626', hiBg: '#fee2e2', ok: '#16a34a', okBg: '#dcfce7', warn: '#d97706', warnBg: '#fef3c7', blue: '#2563eb', blueBg: '#dbeafe', cell: '#fff', cellBg: '#f8fafc', purple: '#7c3aed', purpleBg: '#ede9fe' };

  /* ═══════════════════════ SVG helpers ═══════════════════════ */
  const svgOpen = (w, h, extra) => `<svg class="ds-svg" viewBox="0 0 ${w} ${h}" ${extra || ''} xmlns="http://www.w3.org/2000/svg">`;
  const rect = (x, y, w, h, fill, stroke, r) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r === undefined ? 4 : r}" fill="${fill}" stroke="${stroke || C.line}" stroke-width="1.4"/>`;
  const text = (x, y, s, cls, extra) => `<text x="${x}" y="${y}" class="ds-t ${cls || ''}" ${extra || ''}>${esc(s)}</text>`;
  const line = (x1, y1, x2, y2, stroke, w, extra) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke || C.line}" stroke-width="${w || 1.5}" ${extra || ''}/>`;
  const arrow = (x1, y1, x2, y2, stroke, w, id) => { const st = stroke || C.ink; return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${st}" stroke-width="${w || 1.6}" marker-end="url(#${id || 'ds-ah'})"/>`; };
  const circle = (x, y, r, fill, stroke, w) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${stroke || C.ink}" stroke-width="${w || 1.5}"/>`;
  const defs = () => `<defs>
    <marker id="ds-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="${C.ink}"/></marker>
    <marker id="ds-ah-hi" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="${C.hi}"/></marker>
    <marker id="ds-ah-blue" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="${C.blue}"/></marker>
    <marker id="ds-ah-muted" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="${C.line}"/></marker>
  </defs>`;
  // a row of array cells; hl: { [index]: 'hi'|'ok'|'blue'|'warn'|'muted' }, marks: [{ i, label, color, below? }]
  function cellsRow(items, x0, y0, cw, ch, hl, marks, opts) {
    const o = opts || {};
    let out = '';
    const tone = t => t === 'hi' ? [C.hiBg, C.hi] : t === 'ok' ? [C.okBg, C.ok] : t === 'blue' ? [C.blueBg, C.blue] : t === 'warn' ? [C.warnBg, C.warn] : t === 'purple' ? [C.purpleBg, C.purple] : t === 'muted' ? ['#f1f5f9', '#cbd5e1'] : [C.cell, C.line];
    items.forEach((v, i) => {
      const [bg, st] = tone(hl && hl[i]);
      out += rect(x0 + i * cw, y0, cw, ch, bg, st, 3);
      if (v !== null && v !== undefined && v !== '') out += text(x0 + i * cw + cw / 2, y0 + ch / 2 + 5, fmt(v), 'ds-val' + (hl && hl[i] === 'muted' ? ' ds-muted' : ''));
      if (!o.noIndex) out += text(x0 + i * cw + cw / 2, y0 + ch + 13, String(i), 'ds-idx');
    });
    for (const m of marks || []) {
      const cx = x0 + m.i * cw + cw / 2;
      if (m.below) out += text(cx, y0 + ch + 28 + (m.dy || 0), m.label, 'ds-mark', `fill="${m.color || C.hi}"`);
      else { out += arrow(cx, y0 - 22 - (m.dy || 0), cx, y0 - 3, m.color || C.hi, 1.6, m.color === C.blue ? 'ds-ah-blue' : 'ds-ah-hi'); out += text(cx, y0 - 26 - (m.dy || 0), m.label, 'ds-mark', `fill="${m.color || C.hi}"`); }
    }
    return out;
  }
  // tree layout: nodes {id, l, r} → positions by in-order rank; returns { pos: {id:[x,y]}, w, h }
  function layoutBinary(root, get, opts) {
    const o = Object.assign({ dx: 44, dy: 62, pad: 28 }, opts);
    const pos = {}; let rank = 0, depth = 0;
    const walk = (id, d) => { if (id === null || id === undefined) return; const n = get(id); walk(n.l, d + 1); pos[id] = [rank++, d]; depth = Math.max(depth, d); walk(n.r, d + 1); };
    walk(root, 0);
    const w = Math.max(1, rank) * o.dx + 2 * o.pad, h = (depth + 1) * o.dy + 2 * o.pad;
    for (const k of Object.keys(pos)) pos[k] = [o.pad + pos[k][0] * o.dx + o.dx / 2, o.pad + pos[k][1] * o.dy + 16];
    return { pos, w, h };
  }
  // general tree layout (children lists) by leaf counting
  function layoutTree(root, kids, opts) {
    const o = Object.assign({ dx: 40, dy: 58, pad: 24 }, opts);
    const pos = {}; let leaf = 0, depth = 0;
    const walk = (id, d) => {
      const ch = kids(id); depth = Math.max(depth, d);
      if (!ch.length) { pos[id] = [leaf++, d]; return; }
      ch.forEach(c => walk(c, d + 1));
      pos[id] = [(pos[ch[0]][0] + pos[ch[ch.length - 1]][0]) / 2, d];
    };
    if (root !== null && root !== undefined) walk(root, 0);
    const w = Math.max(1, leaf) * o.dx + 2 * o.pad, h = (depth + 1) * o.dy + 2 * o.pad;
    for (const k of Object.keys(pos)) pos[k] = [o.pad + pos[k][0] * o.dx + o.dx / 2, o.pad + pos[k][1] * o.dy + 16];
    return { pos, w, h };
  }
  const node = (x, y, label, tone, r) => {
    const t = tone === 'hi' ? [C.hiBg, C.hi] : tone === 'ok' ? [C.okBg, C.ok] : tone === 'blue' ? [C.blueBg, C.blue] : tone === 'warn' ? [C.warnBg, C.warn] : tone === 'purple' ? [C.purpleBg, C.purple] : tone === 'muted' ? ['#f1f5f9', '#cbd5e1'] : [C.cell, C.ink];
    return circle(x, y, r || 15, t[0], t[1], tone && tone !== 'muted' ? 2.2 : 1.5) + text(x, y + 5, label, 'ds-val' + (tone === 'muted' ? ' ds-muted' : ''));
  };

  /* ═══════════════════════ MODES ═══════════════════════ */
  const MODES = {};
  const parseList = (data, d) => Array.isArray(data) ? data.slice() : (typeof data === 'string' ? data.split(/[\s,]+/).filter(Boolean).map(x => isNaN(+x) ? x : +x) : (d || []));
  const val = a => (a && a.length ? a[0] : undefined);
  const asNum = (x, d) => { const v = typeof x === 'string' && x.trim() === '' ? NaN : Number(x); return Number.isFinite(v) ? v : d; };

  /* ── stack: array-based, with a capacity and optional growth policy ── */
  MODES.stack = {
    title: 'Array-based stack',
    init(cfg) {
      const items = parseList(cfg.data, []);
      const cap = Math.max(items.length, num(cfg.capacity, Math.max(4, items.length)));
      return { cap, a: items.concat(Array(cap - items.length).fill(null)), t: items.length - 1, grow: cfg.grow || 'none', cost: 0, pushes: 0, msg: '' };
    },
    controls: [{ kind: 'number', name: 'v', label: 'value', default: 7 }, { kind: 'button', label: 'push', op: 'push', args: ['v'] }, { kind: 'button', label: 'pop', op: 'pop' }, { kind: 'button', label: 'top', op: 'top' }],
    ops: {
      *push(s, args) {
        const v = asNum(val(args), val(args));
        if (s.t + 1 === s.cap) {
          if (s.grow === 'none') { yield { d: `push(${v}): the array is full (t + 1 = capacity ${s.cap}) — throw FullStackException`, hl: { err: true } }; return; }
          const ncap = s.grow === 'doubling' ? s.cap * 2 : s.cap + num(s.step, 4);
          yield { d: `push(${v}): the array is full; allocate a new array of size ${ncap} (${s.grow}) and copy ${s.t + 1} elements`, hl: { copy: true } };
          s.cost += s.t + 1; s.cap = ncap; s.a = s.a.slice(0, s.t + 1).concat(Array(ncap - s.t - 1).fill(null));
        }
        s.t++; s.a[s.t] = v; s.cost++; s.pushes++;
        yield { d: `push(${v}): t ← t + 1 = ${s.t}, S[t] ← ${v}    (size ${s.t + 1}, ${s.grow === 'none' ? '' : 'total cost so far ' + s.cost + ' for ' + s.pushes + ' pushes'})`, hl: { i: s.t, tone: 'ok' } };
      },
      *pop(s) {
        if (s.t < 0) { yield { d: 'pop(): the stack is empty — throw EmptyStackException', hl: { err: true } }; return; }
        const v = s.a[s.t];
        yield { d: `pop(): return S[t] = ${v}, then t ← t − 1 = ${s.t - 1}; the slot keeps its old value but is no longer part of the stack`, hl: { i: s.t, tone: 'hi' } };
        s.a[s.t] = null; s.t--;
        yield { d: `after pop: size ${s.t + 1}`, hl: {} };
      },
      *top(s) {
        if (s.t < 0) { yield { d: 'top(): empty stack — throw EmptyStackException', hl: { err: true } }; return; }
        yield { d: `top(): S[t] = ${s.a[s.t]} (no change)`, hl: { i: s.t, tone: 'blue' } };
      },
    },
    render(s, step) {
      const cw = 42, ch = 36, x0 = 30, y0 = 50;
      const hl = {}; for (let i = 0; i <= s.t; i++) hl[i] = 'blue';
      if (step.hl && step.hl.i !== undefined) hl[step.hl.i] = step.hl.tone;
      if (step.hl && step.hl.copy) for (let i = 0; i <= s.t; i++) hl[i] = 'warn';
      const marks = s.t >= 0 ? [{ i: s.t, label: 't', color: C.hi }] : [];
      const w = x0 * 2 + s.cap * cw;
      let out = svgOpen(Math.max(320, w), y0 + ch + 44) + defs();
      out += cellsRow(s.a, x0, y0, cw, ch, hl, marks);
      out += text(x0, y0 + ch + 38, `size = t + 1 = ${s.t + 1}, capacity ${s.cap}${s.t < 0 ? '  (t = −1: empty)' : ''}`, 'ds-note');
      return out + '</svg>';
    },
  };

  /* ── queue: circular array with f and size ── */
  MODES.queue = {
    title: 'Circular-array queue',
    init(cfg) {
      const items = parseList(cfg.data, []);
      const cap = Math.max(items.length + 1, num(cfg.capacity, Math.max(5, items.length + 2)));
      const a = Array(cap).fill(null); items.forEach((v, i) => { a[i] = v; });
      return { cap, a, f: 0, n: items.length, dequeued: 0 };
    },
    controls: [{ kind: 'number', name: 'v', label: 'value', default: 9 }, { kind: 'button', label: 'enqueue', op: 'enqueue', args: ['v'] }, { kind: 'button', label: 'dequeue', op: 'dequeue' }, { kind: 'button', label: 'first', op: 'first' }],
    ops: {
      *enqueue(s, args) {
        const v = asNum(val(args), val(args));
        if (s.n === s.cap) { yield { d: `enqueue(${v}): size = capacity ${s.cap} — full (a growable queue would double here)`, hl: { err: true } }; return; }
        const r = (s.f + s.n) % s.cap;
        yield { d: `enqueue(${v}): r = (f + size) mod N = (${s.f} + ${s.n}) mod ${s.cap} = ${r}`, hl: { i: r, tone: 'warn' } };
        s.a[r] = v; s.n++;
        yield { d: `Q[${r}] ← ${v}, size ← ${s.n}${r < s.f ? '  (wrapped around the end of the array)' : ''}`, hl: { i: r, tone: 'ok' } };
      },
      *dequeue(s) {
        if (s.n === 0) { yield { d: 'dequeue(): empty queue — throw EmptyQueueException', hl: { err: true } }; return; }
        const v = s.a[s.f];
        yield { d: `dequeue(): return Q[f] = ${v}`, hl: { i: s.f, tone: 'hi' } };
        s.a[s.f] = null; s.f = (s.f + 1) % s.cap; s.n--; s.dequeued++;
        yield { d: `f ← (f + 1) mod N = ${s.f}, size ← ${s.n}`, hl: {} };
      },
      *first(s) {
        if (s.n === 0) { yield { d: 'first(): empty queue — throw EmptyQueueException', hl: { err: true } }; return; }
        yield { d: `first(): Q[f] = ${s.a[s.f]}`, hl: { i: s.f, tone: 'blue' } };
      },
    },
    render(s, step) {
      const cw = 42, ch = 36, x0 = 30, y0 = 50;
      const hl = {};
      for (let k = 0; k < s.n; k++) hl[(s.f + k) % s.cap] = 'blue';
      if (step.hl && step.hl.i !== undefined) hl[step.hl.i] = step.hl.tone;
      const r = (s.f + s.n) % s.cap;
      const marks = [{ i: s.f, label: 'f', color: C.hi }, { i: r, label: 'r', color: C.blue, dy: s.f === r ? 18 : 0 }];
      let out = svgOpen(Math.max(320, x0 * 2 + s.cap * cw), y0 + ch + 44) + defs();
      out += cellsRow(s.a, x0, y0, cw, ch, hl, marks);
      const logical = []; for (let k = 0; k < s.n; k++) logical.push(s.a[(s.f + k) % s.cap]);
      out += text(x0, y0 + ch + 38, `size ${s.n} of N = ${s.cap};  front → back: [${logical.join(', ')}]  (r = (f + size) mod N = ${r})`, 'ds-note');
      return out + '</svg>';
    },
  };

  /* ── array-list: insert/remove with shifting, growth on overflow ── */
  MODES['array-list'] = {
    title: 'Array list',
    init(cfg) {
      const items = parseList(cfg.data, []);
      const cap = Math.max(items.length, num(cfg.capacity, Math.max(6, items.length + 2)));
      return { cap, a: items.concat(Array(cap - items.length).fill(null)), n: items.length, grow: cfg.grow || 'doubling', shifts: 0 };
    },
    controls: [{ kind: 'number', name: 'i', label: 'index', default: 1 }, { kind: 'number', name: 'v', label: 'value', default: 5 }, { kind: 'button', label: 'add(i, v)', op: 'add', args: ['i', 'v'] }, { kind: 'button', label: 'remove(i)', op: 'remove', args: ['i'] }, { kind: 'button', label: 'get(i)', op: 'get', args: ['i'] }],
    ops: {
      *add(s, args) {
        const i = asNum(args[0], s.n), v = asNum(args[1], args[1]);
        if (i < 0 || i > s.n) { yield { d: `add(${i}, ${v}): index out of bounds (size ${s.n}) — IndexOutOfBoundsException`, hl: { err: true } }; return; }
        if (s.n === s.cap) {
          const ncap = s.grow === 'doubling' ? s.cap * 2 : s.cap + 2;
          yield { d: `add(${i}, ${v}): array full; allocate a new array of size ${ncap} and copy ${s.n} elements (${s.grow} growth)`, hl: { all: 'warn' } };
          s.cap = ncap; s.a = s.a.slice(0, s.n).concat(Array(ncap - s.n).fill(null));
        }
        for (let k = s.n - 1; k >= i; k--) { s.a[k + 1] = s.a[k]; s.shifts++; yield { d: `shift A[${k}] = ${s.a[k]} right to A[${k + 1}]`, hl: { i: k + 1, tone: 'warn', from: k } }; }
        s.a[i] = v; s.n++;
        yield { d: `A[${i}] ← ${v}, size ← ${s.n}  (${s.n - 1 - i} element${s.n - 1 - i === 1 ? '' : 's'} shifted; total shifts so far ${s.shifts})`, hl: { i, tone: 'ok' } };
      },
      *remove(s, args) {
        const i = asNum(args[0], 0);
        if (i < 0 || i >= s.n) { yield { d: `remove(${i}): index out of bounds (size ${s.n})`, hl: { err: true } }; return; }
        const v = s.a[i];
        yield { d: `remove(${i}): the element is ${v}`, hl: { i, tone: 'hi' } };
        for (let k = i; k < s.n - 1; k++) { s.a[k] = s.a[k + 1]; s.shifts++; yield { d: `shift A[${k + 1}] = ${s.a[k]} left to A[${k}]`, hl: { i: k, tone: 'warn', from: k + 1 } }; }
        s.a[s.n - 1] = null; s.n--;
        yield { d: `size ← ${s.n}; returned ${v}  (${s.n - i} shifted)`, hl: {} };
      },
      *get(s, args) {
        const i = asNum(args[0], 0);
        if (i < 0 || i >= s.n) { yield { d: `get(${i}): index out of bounds (size ${s.n})`, hl: { err: true } }; return; }
        yield { d: `get(${i}) = A[${i}] = ${s.a[i]} in one step: the index is the address`, hl: { i, tone: 'blue' } };
      },
    },
    render(s, step) {
      const cw = 42, ch = 36, x0 = 30, y0 = 40;
      const hl = {}; for (let i = 0; i < s.n; i++) hl[i] = 'blue';
      if (step.hl && step.hl.all) for (let i = 0; i < s.n; i++) hl[i] = step.hl.all;
      if (step.hl && step.hl.i !== undefined) hl[step.hl.i] = step.hl.tone;
      if (step.hl && step.hl.from !== undefined) hl[step.hl.from] = 'muted';
      let out = svgOpen(Math.max(320, x0 * 2 + s.cap * cw), y0 + ch + 44) + defs();
      out += cellsRow(s.a, x0, y0, cw, ch, hl, []);
      out += text(x0, y0 + ch + 38, `size ${s.n}, capacity ${s.cap}, shifts so far ${s.shifts}`, 'ds-note');
      return out + '</svg>';
    },
  };

  /* ── linked-list: singly with head (and tail), or doubly with header/trailer sentinels ── */
  MODES['linked-list'] = {
    title: 'Linked list',
    init(cfg) {
      const items = parseList(cfg.data, []);
      const kind = cfg.kind === 'doubly' ? 'doubly' : 'singly';
      const s = { kind, nodes: {}, next: 1, head: null, tail: null, header: null, trailer: null, size: 0 };
      const mk = v => { const id = 'n' + (s.next++); s.nodes[id] = { v, next: null, prev: null }; return id; };
      if (kind === 'doubly') {
        s.header = mk('⌂'); s.trailer = mk('⌃');
        let prev = s.header;
        for (const v of items) { const id = mk(v); s.nodes[prev].next = id; s.nodes[id].prev = prev; prev = id; }
        s.nodes[prev].next = s.trailer; s.nodes[s.trailer].prev = prev;
      } else {
        let prev = null;
        for (const v of items) { const id = mk(v); if (prev) s.nodes[prev].next = id; else s.head = id; prev = id; }
        s.tail = prev;
      }
      s.size = items.length;
      return s;
    },
    controls: [{ kind: 'number', name: 'v', label: 'value', default: 8 }, { kind: 'number', name: 'i', label: 'position', default: 1 },
      { kind: 'button', label: 'insertFirst', op: 'insertFirst', args: ['v'] }, { kind: 'button', label: 'insertLast', op: 'insertLast', args: ['v'] },
      { kind: 'button', label: 'insertAt(i)', op: 'insertAt', args: ['i', 'v'] }, { kind: 'button', label: 'removeFirst', op: 'removeFirst' }, { kind: 'button', label: 'removeLast', op: 'removeLast' }, { kind: 'button', label: 'removeAt(i)', op: 'removeAt', args: ['i'] }],
    ops: {
      *insertFirst(s, args) {
        const v = asNum(val(args), val(args)); const id = 'n' + (s.next++); s.nodes[id] = { v, next: null, prev: null };
        yield { d: `insertFirst(${v}): create a node holding ${v}`, hl: { n: id, tone: 'ok', float: true } };
        if (s.kind === 'doubly') { yield* insertBetween(s, id, s.header, s.nodes[s.header].next, v); return; }
        s.nodes[id].next = s.head;
        yield { d: `node.next ← head${s.head ? ' (the old first node)' : ' (null: the list was empty)'}`, hl: { n: id, tone: 'ok', float: true, ptr: [id, 'next'] } };
        s.head = id; if (!s.tail) s.tail = id; s.size++;
        yield { d: `head ← node; size ${s.size}.  Two assignments, no matter how long the list is: O(1)`, hl: { n: id, tone: 'ok' } };
      },
      *insertLast(s, args) {
        const v = asNum(val(args), val(args)); const id = 'n' + (s.next++); s.nodes[id] = { v, next: null, prev: null };
        yield { d: `insertLast(${v}): create a node holding ${v}, next = null`, hl: { n: id, tone: 'ok', float: true } };
        if (s.kind === 'doubly') { yield* insertBetween(s, id, s.nodes[s.trailer].prev, s.trailer, v); return; }
        if (!s.tail) { s.head = s.tail = id; s.size++; yield { d: 'the list was empty: head ← node, tail ← node', hl: { n: id, tone: 'ok' } }; return; }
        s.nodes[s.tail].next = id;
        yield { d: `tail.next ← node  (the tail reference makes this O(1); without it we would walk the whole list)`, hl: { n: id, tone: 'ok', ptr: [s.tail, 'next'] } };
        s.tail = id; s.size++;
        yield { d: `tail ← node; size ${s.size}`, hl: { n: id, tone: 'ok' } };
      },
      *insertAt(s, args) {
        const i = asNum(args[0], 0), v = asNum(args[1], args[1]);
        if (i < 0 || i > s.size) { yield { d: `insertAt(${i}): out of range (size ${s.size})`, hl: { err: true } }; return; }
        if (i === 0) { yield* MODES['linked-list'].ops.insertFirst(s, [v]); return; }
        if (i === s.size) { yield* MODES['linked-list'].ops.insertLast(s, [v]); return; }
        let cur = s.kind === 'doubly' ? s.nodes[s.header].next : s.head;
        for (let k = 0; k < i - 1; k++) { yield { d: `walk: at position ${k} (value ${s.nodes[cur].v})`, hl: { n: cur, tone: 'blue' } }; cur = s.nodes[cur].next; }
        yield { d: `stop at position ${i - 1} (value ${s.nodes[cur].v}): the new node goes after it — ${i} steps of walking, then O(1) re-wiring`, hl: { n: cur, tone: 'blue' } };
        const id = 'n' + (s.next++); s.nodes[id] = { v, next: null, prev: null };
        if (s.kind === 'doubly') { yield* insertBetween(s, id, cur, s.nodes[cur].next, v); return; }
        s.nodes[id].next = s.nodes[cur].next;
        yield { d: `node.next ← cur.next`, hl: { n: id, tone: 'ok', float: true, ptr: [id, 'next'] } };
        s.nodes[cur].next = id; s.size++;
        yield { d: `cur.next ← node; size ${s.size}`, hl: { n: id, tone: 'ok' } };
      },
      *removeFirst(s) {
        if (!s.size) { yield { d: 'removeFirst(): empty list', hl: { err: true } }; return; }
        if (s.kind === 'doubly') { yield* removeNode(s, s.nodes[s.header].next); return; }
        const id = s.head;
        yield { d: `removeFirst(): the first node holds ${s.nodes[id].v}`, hl: { n: id, tone: 'hi' } };
        s.head = s.nodes[id].next; if (!s.head) s.tail = null; delete s.nodes[id]; s.size--;
        yield { d: `head ← head.next; the old node is garbage; size ${s.size}`, hl: {} };
      },
      *removeLast(s) {
        if (!s.size) { yield { d: 'removeLast(): empty list', hl: { err: true } }; return; }
        if (s.kind === 'doubly') { yield* removeNode(s, s.nodes[s.trailer].prev); return; }
        yield { d: `removeLast(): the tail holds ${s.nodes[s.tail].v}, but we must find the node *before* it — there is no prev pointer`, hl: { n: s.tail, tone: 'hi' } };
        if (s.head === s.tail) { delete s.nodes[s.head]; s.head = s.tail = null; s.size = 0; yield { d: 'only one node: head ← tail ← null', hl: {} }; return; }
        let cur = s.head, k = 0;
        while (s.nodes[cur].next !== s.tail) { yield { d: `walk: position ${k}`, hl: { n: cur, tone: 'blue' } }; cur = s.nodes[cur].next; k++; }
        yield { d: `position ${k} is the second-to-last node: ${k + 1} steps — removeLast is O(n) on a singly linked list`, hl: { n: cur, tone: 'blue' } };
        delete s.nodes[s.tail]; s.nodes[cur].next = null; s.tail = cur; s.size--;
        yield { d: `cur.next ← null, tail ← cur; size ${s.size}`, hl: { n: cur, tone: 'ok' } };
      },
      *removeAt(s, args) {
        const i = asNum(args[0], 0);
        if (i < 0 || i >= s.size) { yield { d: `removeAt(${i}): out of range (size ${s.size})`, hl: { err: true } }; return; }
        if (i === 0) { yield* MODES['linked-list'].ops.removeFirst(s); return; }
        let cur = s.kind === 'doubly' ? s.nodes[s.header].next : s.head;
        for (let k = 0; k < i; k++) { yield { d: `walk: position ${k}`, hl: { n: cur, tone: 'blue' } }; cur = s.nodes[cur].next; }
        if (s.kind === 'doubly') { yield* removeNode(s, cur); return; }
        let prev = s.head; while (s.nodes[prev].next !== cur) prev = s.nodes[prev].next;
        yield { d: `position ${i} holds ${s.nodes[cur].v}; its predecessor is position ${i - 1}`, hl: { n: cur, tone: 'hi' } };
        s.nodes[prev].next = s.nodes[cur].next; if (s.tail === cur) s.tail = prev; delete s.nodes[cur]; s.size--;
        yield { d: `prev.next ← cur.next; size ${s.size}`, hl: { n: prev, tone: 'ok' } };
      },
    },
    render(s, step) {
      const order = []; let cur = s.kind === 'doubly' ? s.header : s.head;
      const seen = new Set();
      while (cur && !seen.has(cur)) { seen.add(cur); order.push(cur); cur = s.nodes[cur].next; }
      const floating = Object.keys(s.nodes).filter(id => !seen.has(id));
      const bw = 58, bh = 34, gap = 30, x0 = 30, y0 = 58;
      const all = order.concat(floating);
      const w = Math.max(340, x0 * 2 + all.length * (bw + gap));
      let out = svgOpen(w, 150) + defs();
      const pos = {}; all.forEach((id, i) => { pos[id] = [x0 + i * (bw + gap), floating.includes(id) ? y0 + 56 : y0]; });
      for (const id of all) {
        const n = s.nodes[id]; const [x, y] = pos[id];
        const isSent = id === s.header || id === s.trailer;
        const tone = step.hl && step.hl.n === id ? step.hl.tone : (isSent ? 'muted' : null);
        const [bg, st] = tone === 'hi' ? [C.hiBg, C.hi] : tone === 'ok' ? [C.okBg, C.ok] : tone === 'blue' ? [C.blueBg, C.blue] : tone === 'muted' ? ['#f1f5f9', '#cbd5e1'] : [C.cell, C.ink];
        out += rect(x, y, bw, bh, bg, st, 5);
        out += line(x + bw * 0.62, y, x + bw * 0.62, y + bh, st, 1);
        out += text(x + bw * 0.31, y + bh / 2 + 5, isSent ? (id === s.header ? 'hdr' : 'trl') : fmt(n.v), 'ds-val' + (isSent ? ' ds-muted' : ''));
        if (s.kind === 'doubly') out += line(x + bw * 0.62, y + bh / 2, x + bw, y + bh / 2, st, 1);
        const hiPtr = step.hl && step.hl.ptr && step.hl.ptr[0] === id;
        if (n.next && pos[n.next]) {
          const [tx, ty] = pos[n.next];
          if (ty === y) out += arrow(x + bw * 0.81, y + (s.kind === 'doubly' ? bh * 0.28 : bh / 2), tx - 2, ty + (s.kind === 'doubly' ? bh * 0.28 : bh / 2), hiPtr && step.hl.ptr[1] === 'next' ? C.hi : C.ink, hiPtr ? 2.4 : 1.6, hiPtr ? 'ds-ah-hi' : 'ds-ah');
          else out += `<path d="M ${x + bw * 0.81} ${y + bh * 0.3} C ${x + bw * 0.81} ${ty - 10}, ${tx - 30} ${ty + bh / 2}, ${tx - 2} ${ty + bh / 2}" fill="none" stroke="${C.hi}" stroke-width="2.2" marker-end="url(#ds-ah-hi)"/>`;
        } else if (!n.next && !isSent && s.kind === 'singly') out += text(x + bw * 0.81, y + bh / 2 + 4, '∅', 'ds-idx');
        if (s.kind === 'doubly' && n.prev && pos[n.prev]) {
          const [px, py] = pos[n.prev];
          if (py === y) out += arrow(x + bw * 0.81, y + bh * 0.74, px + bw + 2, py + bh * 0.74, hiPtr && step.hl.ptr[1] === 'prev' ? C.hi : C.line, hiPtr && step.hl.ptr[1] === 'prev' ? 2.4 : 1.4, hiPtr && step.hl.ptr[1] === 'prev' ? 'ds-ah-hi' : 'ds-ah-muted');
          else out += `<path d="M ${x + bw * 0.81} ${y + bh * 0.74} C ${x + bw * 0.81} ${py + bh + 20}, ${px + bw + 20} ${py + bh}, ${px + bw + 2} ${py + bh * 0.74}" fill="none" stroke="${C.hi}" stroke-width="2.2" marker-end="url(#ds-ah-hi)"/>`;
        }
      }
      if (s.kind === 'singly') {
        if (s.head && pos[s.head]) out += text(pos[s.head][0] + bw * 0.31, y0 - 14, 'head', 'ds-mark', `fill="${C.hi}"`);
        if (s.tail && pos[s.tail]) out += text(pos[s.tail][0] + bw * 0.31, y0 - 14, s.tail === s.head ? '' : 'tail', 'ds-mark', `fill="${C.blue}"`);
      }
      out += text(x0, 140, `${s.kind} linked list, size ${s.size}${s.kind === 'doubly' ? '  (header and trailer are sentinels: never removed, hold no data)' : ''}`, 'ds-note');
      return out + '</svg>';
    },
  };
  function* insertBetween(s, id, p, q, v) {
    s.nodes[id].prev = p; s.nodes[id].next = q;
    yield { d: `node.prev ← p (${labelOf(s, p)}), node.next ← q (${labelOf(s, q)})`, hl: { n: id, tone: 'ok', float: true, ptr: [id, 'next'] } };
    s.nodes[p].next = id;
    yield { d: `p.next ← node`, hl: { n: id, tone: 'ok', ptr: [p, 'next'] } };
    s.nodes[q].prev = id; s.size++;
    yield { d: `q.prev ← node; size ${s.size}.  Four pointer changes, O(1) — the sentinels mean there is never a "first" or "last" special case`, hl: { n: id, tone: 'ok', ptr: [q, 'prev'] } };
    void v;
  }
  function* removeNode(s, id) {
    const p = s.nodes[id].prev, q = s.nodes[id].next;
    yield { d: `remove the node holding ${s.nodes[id].v}: its neighbours are ${labelOf(s, p)} and ${labelOf(s, q)}`, hl: { n: id, tone: 'hi' } };
    s.nodes[p].next = q;
    yield { d: `p.next ← q`, hl: { n: id, tone: 'hi', ptr: [p, 'next'] } };
    s.nodes[q].prev = p; delete s.nodes[id]; s.size--;
    yield { d: `q.prev ← p; the node is unreachable (garbage); size ${s.size}`, hl: { n: q, tone: 'ok', ptr: [q, 'prev'] } };
  }
  const labelOf = (s, id) => id === s.header ? 'header' : id === s.trailer ? 'trailer' : String(s.nodes[id].v);

  /* ── call-tree: the recursion tree of a small recursive function ── */
  const RECURSIONS = {
    fib: { label: n => `fib(${n})`, base: n => n < 2 ? n : null, sub: n => [n - 1, n - 2], combine: (n, rs) => rs[0] + rs[1], text: 'fib(n) = fib(n−1) + fib(n−2); fib(0) = 0, fib(1) = 1 — binary recursion' },
    sum: { label: n => `sum(A, ${n})`, base: n => n === 0 ? 0 : null, sub: n => [n - 1], combine: (n, rs, A) => rs[0] + A[n - 1], text: 'sum(A, n) = sum(A, n−1) + A[n−1]; sum(A, 0) = 0 — linear recursion' },
    binsum: { label: (n, lo, hi) => `sum(A, ${lo}, ${hi})`, text: 'binary sum: split the range in half, add the two halves — binary recursion with O(log n) depth' },
    power: { label: n => `power(x, ${n})`, base: n => n === 0 ? 1 : null, sub: n => [Math.floor(n / 2)], combine: (n, rs) => n % 2 === 0 ? rs[0] * rs[0] : rs[0] * rs[0] * 2, text: 'power(x, n) = power(x, ⌊n/2⌋)² (× x if n odd); x = 2 here — linear recursion with O(log n) depth' },
    hanoi: { label: n => `hanoi(${n})`, base: n => n === 0 ? 0 : null, sub: n => [n - 1, n - 1], combine: (n, rs) => rs[0] + rs[1] + 1, text: 'moves(n) = moves(n−1) + 1 + moves(n−1); moves(0) = 0 — binary recursion, 2ⁿ − 1 moves' },
  };
  MODES['call-tree'] = {
    title: 'Recursion tree',
    init(cfg) {
      const fn = RECURSIONS[cfg.fn] ? cfg.fn : 'fib';
      const A = parseList(cfg.data, [4, 3, 6, 2, 7, 1]);
      return { fn, n: num(cfg.n, fn === 'fib' ? 5 : 4), A, nodes: [], calls: 0, maxDepth: 0, done: false };
    },
    controls: [{ kind: 'select', name: 'fn', label: 'function', options: ['fib', 'sum', 'binsum', 'power', 'hanoi'] }, { kind: 'number', name: 'n', label: 'n', default: 5 }, { kind: 'button', label: 'run', op: 'run', args: ['fn', 'n'] }],
    ops: {
      *run(s, args) {
        if (args[0] && RECURSIONS[args[0]]) s.fn = args[0];
        if (args[1] !== undefined) s.n = Math.max(0, Math.min(asNum(args[1], s.n), s.fn === 'sum' ? s.A.length : 8));
        s.nodes = []; s.calls = 0; s.maxDepth = 0; s.done = false;
        const R = RECURSIONS[s.fn];
        const self = this;
        function* call(arg, parent, depth, lo, hi) {
          const id = s.nodes.length;
          const label = s.fn === 'binsum' ? R.label(null, lo, hi) : R.label(arg);
          s.nodes.push({ id, label, parent, depth, value: null, open: true });
          s.calls++; s.maxDepth = Math.max(s.maxDepth, depth);
          yield { d: `call ${label}  (depth ${depth}, ${s.calls} call${s.calls === 1 ? '' : 's'} so far)`, hl: { n: id, tone: 'warn' } };
          let value;
          if (s.fn === 'binsum') {
            if (lo === hi) { value = s.A[lo]; yield { d: `${label}: single element A[${lo}] = ${value} — base case`, hl: { n: id, tone: 'ok' } }; }
            else {
              const mid = Math.floor((lo + hi) / 2);
              const a = yield* call(null, id, depth + 1, lo, mid); const b = yield* call(null, id, depth + 1, mid + 1, hi);
              value = a + b; yield { d: `${label} = ${a} + ${b} = ${value}`, hl: { n: id, tone: 'ok' } };
            }
          } else {
            const base = R.base(arg);
            if (base !== null) { value = base; yield { d: `${label} = ${value} — base case, no further calls`, hl: { n: id, tone: 'ok' } }; }
            else {
              const rs = []; for (const sub of R.sub(arg)) rs.push(yield* call(sub, id, depth + 1));
              value = R.combine(arg, rs, s.A);
              yield { d: `${label} returns ${value}  (combining ${rs.join(' and ')}${s.fn === 'sum' ? ' with A[' + (arg - 1) + '] = ' + s.A[arg - 1] : ''})`, hl: { n: id, tone: 'ok' } };
            }
          }
          s.nodes[id].value = value; s.nodes[id].open = false;
          return value;
        }
        void self;
        const result = s.fn === 'binsum' ? yield* call(null, null, 0, 0, Math.min(s.n, s.A.length) - 1) : yield* call(s.n, null, 0);
        s.done = true;
        yield { d: `done: result ${result}, ${s.calls} calls, maximum depth ${s.maxDepth} (that many frames on the stack at once)`, hl: {} };
      },
    },
    render(s, step) {
      const R = RECURSIONS[s.fn];
      if (!s.nodes.length) return svgOpen(600, 80) + text(20, 40, R.text, 'ds-note') + text(20, 62, 'press run (or step through the scripted run)', 'ds-note') + '</svg>';
      const kids = id => s.nodes.filter(n => n.parent === id).map(n => n.id);
      const dx = s.fn === 'binsum' ? 92 : s.fn === 'sum' || s.fn === 'power' ? 60 : 54;
      const L = layoutTree(0, kids, { dx, dy: 60, pad: 30 });
      let out = svgOpen(Math.max(420, L.w), L.h + 30) + defs();
      for (const n of s.nodes) if (n.parent !== null) { const [x1, y1] = L.pos[n.parent], [x2, y2] = L.pos[n.id]; out += line(x1, y1 + 14, x2, y2 - 14, C.line, 1.4); }
      for (const n of s.nodes) {
        const [x, y] = L.pos[n.id];
        const tone = step.hl && step.hl.n === n.id ? step.hl.tone : (n.open ? 'warn' : null);
        const [bg, st] = tone === 'ok' ? [C.okBg, C.ok] : tone === 'warn' ? [C.warnBg, C.warn] : [C.cell, C.ink];
        const w = Math.max(44, n.label.length * 7.2 + 10);
        out += rect(x - w / 2, y - 14, w, 28, bg, st, 6) + text(x, y + 4, n.label, 'ds-small');
        if (n.value !== null) out += text(x, y + 30, '= ' + n.value, 'ds-idx', `fill="${C.ok}"`);
      }
      out += text(16, L.h + 22, R.text, 'ds-note');
      return out + '</svg>';
    },
  };

  /* ── binary-tree: traversals and representations ── */
  // data: nested array [v, left, right] (null for a missing child) or a flat list read as a complete tree
  function buildTree(data) {
    const nodes = {}; let next = 0;
    const mk = v => { const id = 't' + (next++); nodes[id] = { v, l: null, r: null }; return id; };
    if (Array.isArray(data) && data.length && Array.isArray(data[0]) || (Array.isArray(data) && data.some(x => Array.isArray(x)))) {
      const walk = d => { if (d === null || d === undefined) return null; if (!Array.isArray(d)) return mk(d); const id = mk(d[0]); nodes[id].l = walk(d[1]); nodes[id].r = walk(d[2]); return id; };
      return { nodes, root: walk(data) };
    }
    const list = parseList(data, [1, 2, 3, 4, 5, 6, 7]);
    const ids = list.map(v => mk(v));
    ids.forEach((id, i) => { if (2 * i + 1 < ids.length) nodes[id].l = ids[2 * i + 1]; if (2 * i + 2 < ids.length) nodes[id].r = ids[2 * i + 2]; });
    return { nodes, root: ids[0] || null };
  }
  MODES['binary-tree'] = {
    title: 'Binary tree traversals',
    init(cfg) { const t = buildTree(cfg.data); return { nodes: t.nodes, root: t.root, order: [], visits: {}, euler: [], kind: '' }; },
    controls: [{ kind: 'button', label: 'preorder', op: 'preorder' }, { kind: 'button', label: 'inorder', op: 'inorder' }, { kind: 'button', label: 'postorder', op: 'postorder' }, { kind: 'button', label: 'Euler tour', op: 'euler' }, { kind: 'button', label: 'height / depth', op: 'height' }],
    ops: {
      *preorder(s) { yield* traverse(s, 'preorder'); },
      *inorder(s) { yield* traverse(s, 'inorder'); },
      *postorder(s) { yield* traverse(s, 'postorder'); },
      *euler(s) { yield* traverse(s, 'euler'); },
      *height(s) {
        s.order = []; s.visits = {}; s.kind = 'height'; s.euler = [];
        const h = function* (id, depth) {
          if (id === null) return -1;
          const hl = yield* h(s.nodes[id].l, depth + 1), hr = yield* h(s.nodes[id].r, depth + 1);
          const val = 1 + Math.max(hl, hr);
          s.visits[id] = `d${depth} h${val}`;
          yield { d: `node ${s.nodes[id].v}: depth ${depth} (edges from the root), height ${val} = 1 + max(${hl}, ${hr})`, hl: { n: id, tone: 'ok' } };
          return val;
        };
        const H = yield* h(s.root, 0);
        yield { d: `height of the tree = ${H}; computed bottom-up in one postorder pass, O(n)`, hl: {} };
      },
    },
    render(s, step) {
      const L = layoutBinary(s.root, id => s.nodes[id], { dx: 46, dy: 60 });
      let out = svgOpen(Math.max(360, L.w), L.h + 40) + defs();
      for (const id of Object.keys(L.pos)) { const n = s.nodes[id]; for (const c of [n.l, n.r]) if (c && L.pos[c]) out += line(L.pos[id][0], L.pos[id][1], L.pos[c][0], L.pos[c][1], C.line, 1.4); }
      for (const id of Object.keys(L.pos)) {
        const [x, y] = L.pos[id];
        const tone = step.hl && step.hl.n === id ? step.hl.tone : (s.visits[id] !== undefined ? 'blue' : null);
        out += node(x, y, s.nodes[id].v, tone);
        if (s.visits[id] !== undefined) out += text(x + 20, y - 12, String(s.visits[id]), 'ds-idx', `fill="${C.hi}" text-anchor="start"`);
      }
      const seq = s.kind === 'euler' ? s.euler.join(' ') : s.order.map(id => s.nodes[id].v).join(', ');
      out += text(16, L.h + 30, s.kind ? `${s.kind}: ${seq}` : 'choose a traversal', 'ds-note');
      return out + '</svg>';
    },
  };
  function* traverse(s, kind) {
    s.order = []; s.visits = {}; s.euler = []; s.kind = kind;
    let k = 0;
    const visit = function* (id) {
      const n = s.nodes[id];
      if (kind === 'preorder') { s.order.push(id); s.visits[id] = ++k; yield { d: `visit ${n.v} (${k}), then the left subtree, then the right`, hl: { n: id, tone: 'hi' } }; }
      if (kind === 'euler') { s.euler.push(n.v + '↓'); yield { d: `Euler tour: arrive at ${n.v} from above (left of the node)`, hl: { n: id, tone: 'warn' } }; }
      if (n.l) yield* visit(n.l); else if (kind === 'euler') { /* no left child */ }
      if (kind === 'inorder') { s.order.push(id); s.visits[id] = ++k; yield { d: `left subtree done: visit ${n.v} (${k}), then the right subtree`, hl: { n: id, tone: 'hi' } }; }
      if (kind === 'euler') { s.euler.push(n.v + '·'); yield { d: `Euler tour: pass below ${n.v} (between the subtrees)`, hl: { n: id, tone: 'blue' } }; }
      if (n.r) yield* visit(n.r);
      if (kind === 'postorder') { s.order.push(id); s.visits[id] = ++k; yield { d: `both subtrees done: visit ${n.v} (${k})`, hl: { n: id, tone: 'hi' } }; }
      if (kind === 'euler') { s.euler.push(n.v + '↑'); yield { d: `Euler tour: leave ${n.v} upward (right of the node)`, hl: { n: id, tone: 'ok' } }; }
    };
    if (s.root) yield* visit(s.root);
    yield { d: `${kind} complete: ${kind === 'euler' ? s.euler.join(' ') : s.order.map(id => s.nodes[id].v).join(', ')}${kind === 'euler' ? '  (each node seen three times: left, below, right)' : ''}`, hl: {} };
  }

  /* ── heap: array-based binary min-heap ── */
  MODES.heap = {
    title: 'Binary heap',
    init(cfg) {
      const items = parseList(cfg.data, []);
      const s = { a: [], max: cfg.order === 'max', sorted: null, phase: '' };
      if (cfg.build === 'bottom-up') s.pending = items; else for (const v of items) { s.a.push(v); heapUpSilent(s, s.a.length - 1); }
      return s;
    },
    controls: [{ kind: 'number', name: 'v', label: 'key', default: 3 }, { kind: 'button', label: 'insert', op: 'insert', args: ['v'] }, { kind: 'button', label: 'removeMin', op: 'removeMin' }, { kind: 'button', label: 'bottom-up build', op: 'build' }, { kind: 'button', label: 'heap-sort', op: 'heapSort' }],
    ops: {
      *insert(s, args) {
        const v = asNum(val(args), 0);
        s.a.push(v); let i = s.a.length - 1;
        yield { d: `insert(${v}): place it in the next free position (the last leaf, index ${i}), keeping the tree complete`, hl: { i, tone: 'warn' } };
        yield* upheap(s, i);
      },
      *removeMin(s) {
        if (!s.a.length) { yield { d: 'removeMin(): the heap is empty', hl: { err: true } }; return; }
        const m = s.a[0];
        yield { d: `remove${s.max ? 'Max' : 'Min'}(): the root holds ${m}`, hl: { i: 0, tone: 'hi' } };
        const last = s.a.pop();
        if (s.a.length) { s.a[0] = last; yield { d: `move the last leaf (${last}) to the root to keep the tree complete, then down-heap`, hl: { i: 0, tone: 'warn' } }; yield* downheap(s, 0, s.a.length); }
        yield { d: `returned ${m}; size ${s.a.length}`, hl: {} };
      },
      *build(s) {
        const items = s.pending || s.a.slice();
        s.a = items.slice(); s.pending = null;
        yield { d: `bottom-up construction: put all ${s.a.length} keys in the array in any order, then fix subtrees from the last internal node up to the root`, hl: { all: 'warn' } };
        for (let i = Math.floor(s.a.length / 2) - 1; i >= 0; i--) { yield { d: `down-heap at index ${i} (key ${s.a[i]}): its two subtrees are already heaps`, hl: { i, tone: 'warn' } }; yield* downheap(s, i, s.a.length); }
        yield { d: `done: a heap in O(n) total — most nodes are near the bottom and travel little`, hl: {} };
      },
      *heapSort(s) {
        const n = s.a.length;
        if (!n) { yield { d: 'nothing to sort', hl: {} }; return; }
        yield { d: `heap-sort in place: repeatedly swap the ${s.max ? 'max' : 'min'} (root) with the last unsorted position and down-heap the rest; the sorted part grows from the right`, hl: {} };
        s.sorted = n;
        for (let end = n - 1; end > 0; end--) {
          [s.a[0], s.a[end]] = [s.a[end], s.a[0]]; s.sorted = end;
          yield { d: `swap root ${s.a[end]} with position ${end}; positions ${end}…${n - 1} are sorted`, hl: { i: end, tone: 'ok' } };
          yield* downheap(s, 0, end);
        }
        s.sorted = 0;
        yield { d: `sorted (${s.max ? 'ascending' : 'descending'}, because the ${s.max ? 'largest' : 'smallest'} went to the end each time): ${s.a.join(', ')} — n removals of O(log n): O(n log n)`, hl: { all: 'ok' } };
      },
    },
    render(s, step) {
      const n = s.a.length, live = s.sorted === null ? n : s.sorted;
      const get = i => ({ l: 2 * i + 1 < live ? 2 * i + 1 : null, r: 2 * i + 2 < live ? 2 * i + 2 : null });
      const L = layoutBinary(live ? 0 : null, get, { dx: 40, dy: 54, pad: 24 });
      const cw = 36, ch = 32, rowY = L.h + 22, x0 = 24;
      const w = Math.max(360, L.w, x0 * 2 + Math.max(n, 1) * cw);
      let out = svgOpen(w, rowY + ch + 50) + defs();
      const hl = {}; if (step.hl && step.hl.all) for (let i = 0; i < n; i++) hl[i] = step.hl.all;
      if (step.hl && step.hl.i !== undefined) hl[step.hl.i] = step.hl.tone;
      if (step.hl && step.hl.j !== undefined) hl[step.hl.j] = 'blue';
      for (let i = 0; i < live; i++) { const g = get(i); for (const c of [g.l, g.r]) if (c !== null && L.pos[c]) out += line(L.pos[i][0], L.pos[i][1], L.pos[c][0], L.pos[c][1], C.line, 1.4); }
      for (let i = 0; i < live; i++) { const [x, y] = L.pos[i]; out += node(x, y, s.a[i], hl[i]); out += text(x + 19, y - 10, String(i), 'ds-idx'); }
      const rowHl = Object.assign({}, hl); for (let i = live; i < n; i++) if (!rowHl[i]) rowHl[i] = 'ok';
      out += cellsRow(s.a, x0, rowY, cw, ch, rowHl, []);
      out += text(x0, rowY + ch + 40, `array view: children of i at 2i + 1 and 2i + 2, parent at ⌊(i − 1)/2⌋; size ${n}${s.sorted !== null && s.sorted < n ? `, sorted tail from index ${s.sorted}` : ''}`, 'ds-note');
      return out + '</svg>';
    },
  };
  const better = (s, a, b) => s.max ? a > b : a < b;
  function heapUpSilent(s, i) { while (i > 0) { const p = Math.floor((i - 1) / 2); if (better(s, s.a[i], s.a[p])) { [s.a[i], s.a[p]] = [s.a[p], s.a[i]]; i = p; } else break; } }
  function* upheap(s, i) {
    while (i > 0) {
      const p = Math.floor((i - 1) / 2);
      if (better(s, s.a[i], s.a[p])) {
        yield { d: `up-heap: ${s.a[i]} at index ${i} is ${s.max ? 'larger' : 'smaller'} than its parent ${s.a[p]} at ${p} — swap`, hl: { i, tone: 'hi', j: p } };
        [s.a[i], s.a[p]] = [s.a[p], s.a[i]]; i = p;
      } else { yield { d: `up-heap stops: ${s.a[i]} is not ${s.max ? 'larger' : 'smaller'} than its parent ${s.a[p]}; heap order holds along the path`, hl: { i, tone: 'ok' } }; return; }
    }
    yield { d: `up-heap reached the root; the path had at most ⌈log₂ n⌉ swaps`, hl: { i: 0, tone: 'ok' } };
  }
  function* downheap(s, i, end) {
    for (;;) {
      const l = 2 * i + 1, r = 2 * i + 2;
      if (l >= end) { yield { d: `down-heap stops at index ${i}: no children`, hl: { i, tone: 'ok' } }; return; }
      let c = l; if (r < end && better(s, s.a[r], s.a[l])) c = r;
      if (better(s, s.a[c], s.a[i])) {
        yield { d: `down-heap: ${s.a[i]} at ${i} vs its ${s.max ? 'larger' : 'smaller'} child ${s.a[c]} at ${c} — swap`, hl: { i, tone: 'hi', j: c } };
        [s.a[i], s.a[c]] = [s.a[c], s.a[i]]; i = c;
      } else { yield { d: `down-heap stops at index ${i}: ${s.a[i]} is already ${s.max ? '≥' : '≤'} both children`, hl: { i, tone: 'ok' } }; return; }
    }
  }

  /* ── bst / avl: binary search tree, with AVL rebalancing when mode is avl ── */
  function bstInit(cfg, avl) {
    const s = { nodes: {}, root: null, next: 1, avl, cmp: 0, msg: '' };
    for (const k of parseList(cfg.data, [])) { const g = bstInsertGen(s, k, true); while (!g.next().done) { /* silent */ } }
    return s;
  }
  const H = (s, id) => id === null ? -1 : s.nodes[id].h;
  const upd = (s, id) => { const n = s.nodes[id]; n.h = 1 + Math.max(H(s, n.l), H(s, n.r)); };
  const bal = (s, id) => H(s, s.nodes[id].l) - H(s, s.nodes[id].r);
  function* bstInsertGen(s, k, silent) {
    const mk = () => { const id = 'b' + (s.next++); s.nodes[id] = { k, l: null, r: null, p: null, h: 0 }; return id; };
    if (s.root === null) { s.root = mk(); if (!silent) yield { d: `insert(${k}): empty tree — the new node is the root`, hl: { n: s.root, tone: 'ok' } }; return s.root; }
    let cur = s.root, path = [];
    for (;;) {
      const n = s.nodes[cur]; path.push(cur);
      if (k === n.k) { if (!silent) yield { d: `insert(${k}): key already present at this node — a map would replace the value`, hl: { n: cur, tone: 'warn' } }; return cur; }
      const goLeft = k < n.k;
      if (!silent) yield { d: `${k} ${goLeft ? '<' : '>'} ${n.k}: go ${goLeft ? 'left' : 'right'}`, hl: { n: cur, tone: 'blue' } };
      const nxt = goLeft ? n.l : n.r;
      if (nxt === null) { const id = mk(); s.nodes[id].p = cur; if (goLeft) n.l = id; else n.r = id; if (!silent) yield { d: `reached an empty ${goLeft ? 'left' : 'right'} child: insert ${k} there (depth ${path.length})`, hl: { n: id, tone: 'ok' } }; cur = id; break; }
      cur = nxt;
    }
    for (let id = s.nodes[cur].p; id !== null; id = s.nodes[id].p) upd(s, id);
    if (s.avl) yield* rebalanceUp(s, s.nodes[cur].p, silent);
    return cur;
  }
  function* rebalanceUp(s, id, silent) {
    while (id !== null) {
      upd(s, id);
      const b = bal(s, id);
      if (Math.abs(b) > 1) {
        if (!silent) yield { d: `node ${s.nodes[id].k} is unbalanced: height(left) − height(right) = ${b}`, hl: { n: id, tone: 'hi' } };
        id = yield* restructure(s, id, silent);
      }
      id = s.nodes[id].p;
    }
  }
  function rotate(s, x, dir) { // dir 'left': x's right child comes up
    const n = s.nodes[x], y = dir === 'left' ? n.r : n.l, Y = s.nodes[y];
    const p = n.p;
    if (dir === 'left') { n.r = Y.l; if (Y.l !== null) s.nodes[Y.l].p = x; Y.l = x; }
    else { n.l = Y.r; if (Y.r !== null) s.nodes[Y.r].p = x; Y.r = x; }
    Y.p = p; n.p = y;
    if (p === null) s.root = y; else if (s.nodes[p].l === x) s.nodes[p].l = y; else s.nodes[p].r = y;
    upd(s, x); upd(s, y);
    return y;
  }
  function* restructure(s, z, silent) {
    const b = bal(s, z);
    const y = b > 0 ? s.nodes[z].l : s.nodes[z].r;
    const by = bal(s, y);
    const zk = s.nodes[z].k, yk = s.nodes[y].k;
    if (b > 0 && by >= 0) { if (!silent) yield { d: `left-left case (y = ${yk} is z's left child and is left-heavy or even): single right rotation at ${zk}`, hl: { n: y, tone: 'warn', n2: z } }; const r = rotate(s, z, 'right'); if (!silent) yield { d: `after the rotation ${s.nodes[r].k} is the subtree root; heights updated`, hl: { n: r, tone: 'ok' } }; return r; }
    if (b < 0 && by <= 0) { if (!silent) yield { d: `right-right case: single left rotation at ${zk}`, hl: { n: y, tone: 'warn', n2: z } }; const r = rotate(s, z, 'left'); if (!silent) yield { d: `after the rotation ${s.nodes[r].k} is the subtree root`, hl: { n: r, tone: 'ok' } }; return r; }
    if (b > 0) { const x = s.nodes[y].r; if (!silent) yield { d: `left-right case (y = ${yk} is right-heavy): double rotation — first rotate left at ${yk}`, hl: { n: x, tone: 'warn', n2: y } }; rotate(s, y, 'left'); if (!silent) yield { d: `then rotate right at ${zk}`, hl: { n: s.nodes[z].l, tone: 'warn', n2: z } }; const r = rotate(s, z, 'right'); if (!silent) yield { d: `${s.nodes[r].k} is now the subtree root with the other two as children (trinode restructuring)`, hl: { n: r, tone: 'ok' } }; return r; }
    const x = s.nodes[y].l; if (!silent) yield { d: `right-left case (y = ${yk} is left-heavy): double rotation — first rotate right at ${yk}`, hl: { n: x, tone: 'warn', n2: y } }; rotate(s, y, 'right'); if (!silent) yield { d: `then rotate left at ${zk}`, hl: { n: s.nodes[z].r, tone: 'warn', n2: z } }; const r = rotate(s, z, 'left'); if (!silent) yield { d: `${s.nodes[r].k} is now the subtree root (trinode restructuring)`, hl: { n: r, tone: 'ok' } }; return r;
  }
  function* bstFind(s, k) {
    let cur = s.root, steps = 0;
    while (cur !== null) {
      steps++; const n = s.nodes[cur];
      if (k === n.k) { yield { d: `found ${k} after ${steps} comparison${steps === 1 ? '' : 's'}`, hl: { n: cur, tone: 'ok' } }; return cur; }
      yield { d: `${k} ${k < n.k ? '<' : '>'} ${n.k}: go ${k < n.k ? 'left' : 'right'}`, hl: { n: cur, tone: 'blue' } };
      cur = k < n.k ? n.l : n.r;
    }
    yield { d: `${k} is not in the tree (${steps} comparisons, one per level of the path)`, hl: { err: true } };
    return null;
  }
  function* bstRemove(s, k) {
    const id = yield* bstFind(s, k);
    if (id === null) return;
    const n = s.nodes[id];
    let start; // where rebalancing / height updates begin
    const replaceIn = (id, withId) => { const p = s.nodes[id].p; if (withId !== null) s.nodes[withId].p = p; if (p === null) s.root = withId; else if (s.nodes[p].l === id) s.nodes[p].l = withId; else s.nodes[p].r = withId; return p; };
    if (n.l === null || n.r === null) {
      const child = n.l !== null ? n.l : n.r;
      yield { d: `${k} has ${child === null ? 'no children: unlink it' : 'one child: splice it out, its child takes its place'}`, hl: { n: id, tone: 'hi' } };
      start = replaceIn(id, child); delete s.nodes[id];
    } else {
      let succ = n.r; while (s.nodes[succ].l !== null) succ = s.nodes[succ].l;
      yield { d: `${k} has two children: find its in-order successor, the leftmost node of the right subtree (${s.nodes[succ].k})`, hl: { n: succ, tone: 'warn', n2: id } };
      n.k = s.nodes[succ].k;
      yield { d: `copy ${n.k} into the node, then remove the successor node (it has no left child)`, hl: { n: id, tone: 'ok', n2: succ } };
      const sc = s.nodes[succ].r; start = replaceIn(succ, sc); delete s.nodes[succ];
    }
    for (let x = start; x !== null; x = s.nodes[x].p) upd(s, x);
    if (s.avl) yield* rebalanceUp(s, start, false);
    yield { d: `removed ${k}; size ${Object.keys(s.nodes).length}`, hl: {} };
  }
  const bstMode = avl => ({
    title: avl ? 'AVL tree' : 'Binary search tree',
    init(cfg) { return bstInit(cfg, avl); },
    controls: [{ kind: 'number', name: 'k', label: 'key', default: 5 }, { kind: 'button', label: 'insert', op: 'insert', args: ['k'] }, { kind: 'button', label: 'find', op: 'find', args: ['k'] }, { kind: 'button', label: 'remove', op: 'remove', args: ['k'] }],
    ops: {
      *insert(s, args) { yield* bstInsertGen(s, asNum(val(args), 0), false); yield { d: `inserted ${asNum(val(args), 0)}; height ${H(s, s.root)}${avl ? ' (AVL keeps it O(log n))' : ''}`, hl: {} }; },
      *find(s, args) { yield* bstFind(s, asNum(val(args), 0)); },
      *remove(s, args) { yield* bstRemove(s, asNum(val(args), 0)); },
    },
    render(s, step) {
      const L = layoutBinary(s.root, id => s.nodes[id], { dx: 44, dy: 58 });
      let out = svgOpen(Math.max(360, L.w), L.h + 36) + defs();
      for (const id of Object.keys(L.pos)) { const n = s.nodes[id]; for (const c of [n.l, n.r]) if (c && L.pos[c]) out += line(L.pos[id][0], L.pos[id][1], L.pos[c][0], L.pos[c][1], C.line, 1.4); }
      for (const id of Object.keys(L.pos)) {
        const [x, y] = L.pos[id];
        const tone = step.hl && step.hl.n === id ? step.hl.tone : (step.hl && step.hl.n2 === id ? 'purple' : null);
        out += node(x, y, s.nodes[id].k, tone);
        if (avl) { const b = bal(s, id); out += text(x + 19, y - 10, `h${s.nodes[id].h}`, 'ds-idx', `fill="${Math.abs(b) > 1 ? C.hi : C.muted}" text-anchor="start"`); }
      }
      const n = Object.keys(s.nodes).length;
      out += text(16, L.h + 26, `${n} node${n === 1 ? '' : 's'}, height ${H(s, s.root)}${avl ? ' — every node: |height(left) − height(right)| ≤ 1' : ` (a search costs at most height + 1 comparisons; ⌈log₂(n+1)⌉ − 1 = ${Math.max(0, Math.ceil(Math.log2(n + 1)) - 1)} would be ideal)`}`, 'ds-note');
      return out + '</svg>';
    },
  });
  MODES.bst = bstMode(false);
  MODES.avl = bstMode(true);

  /* ── hash-table: separate chaining or open addressing ── */
  const polyHash = (str, a) => { let h = 0; for (let i = 0; i < str.length; i++) h = (h * a + str.charCodeAt(i)) % 2147483647; return h; };
  function hashOf(s, key) { // hash code then compression, returned with the arithmetic shown
    const code = typeof key === 'number' ? key : polyHash(String(key), s.a);
    const codeText = typeof key === 'number' ? `${key}` : `h("${key}") = ${code} (polynomial, a = ${s.a})`;
    if (s.compress === 'mad') { const v = ((s.ma * code + s.mb) % s.p) % s.N; return { i: v, text: `${codeText} → ((${s.ma}·code + ${s.mb}) mod ${s.p}) mod ${s.N} = ${v}` }; }
    const v = ((code % s.N) + s.N) % s.N; return { i: v, text: `${codeText} mod ${s.N} = ${v}` };
  }
  MODES['hash-table'] = {
    title: 'Hash table',
    init(cfg) {
      const N = num(cfg.buckets, 11);
      const s = { N, scheme: ['chaining', 'linear', 'quadratic', 'double'].includes(cfg.scheme) ? cfg.scheme : 'chaining', compress: cfg.compress === 'mad' ? 'mad' : 'mod', a: num(cfg.a, 33), ma: 3, mb: 5, p: 109345121, q: num(cfg.q, 7), n: 0, probes: 0, lookups: 0 };
      s.table = s.scheme === 'chaining' ? Array.from({ length: N }, () => []) : Array(N).fill(null);
      for (const k of parseList(cfg.data, [])) { const g = MODES['hash-table'].ops.insert(s, [k], true); while (!g.next().done) { /* silent */ } }
      s.probes = 0; s.lookups = 0;
      return s;
    },
    controls: [{ kind: 'text', name: 'k', label: 'key', default: '17' }, { kind: 'button', label: 'insert', op: 'insert', args: ['k'] }, { kind: 'button', label: 'find', op: 'find', args: ['k'] }, { kind: 'button', label: 'remove', op: 'remove', args: ['k'] }],
    ops: {
      *insert(s, args, silent) {
        const raw = val(args); const k = typeof raw === 'number' ? raw : (/^-?\d+$/.test(String(raw).trim()) ? +raw : String(raw).trim());
        const h = hashOf(s, k);
        if (!silent) yield { d: `insert(${JSON.stringify(k)}): ${h.text}`, hl: { b: h.i, tone: 'warn' } };
        if (s.scheme === 'chaining') {
          const bucket = s.table[h.i];
          if (bucket.some(x => x === k)) { if (!silent) yield { d: `${k} is already in bucket ${h.i} (a map would replace its value)`, hl: { b: h.i, tone: 'blue' } }; return; }
          bucket.push(k); s.n++;
          if (!silent) yield { d: `append ${k} to the list at bucket ${h.i}${bucket.length > 1 ? ` — a collision: the bucket now holds ${bucket.length} keys` : ''}; load factor n/N = ${s.n}/${s.N} = ${(s.n / s.N).toFixed(2)}`, hl: { b: h.i, tone: bucket.length > 1 ? 'hi' : 'ok', k } };
          return;
        }
        if (s.n === s.N) { if (!silent) yield { d: 'the table is full — an open-addressing table must be rehashed into a bigger array', hl: { err: true } }; return; }
        let i = h.i, j = 0;
        const step = s.scheme === 'double' ? (s.q - (((typeof k === 'number' ? k : polyHash(String(k), s.a)) % s.q) + s.q) % s.q) : 1;
        for (;;) {
          const cell = s.table[i];
          if (cell === null || cell === '⌫') { s.table[i] = k; s.n++; if (!silent) yield { d: `cell ${i} is ${cell === '⌫' ? 'AVAILABLE (a removed marker)' : 'empty'}: store ${k} there after ${j} probe${j === 1 ? '' : 's'}; load factor ${(s.n / s.N).toFixed(2)}`, hl: { b: i, tone: 'ok' } }; return; }
          if (cell === k) { if (!silent) yield { d: `${k} is already at cell ${i}`, hl: { b: i, tone: 'blue' } }; return; }
          j++;
          const next = s.scheme === 'linear' ? (i + 1) % s.N : s.scheme === 'quadratic' ? (h.i + j * j) % s.N : (h.i + j * step) % s.N;
          if (!silent) yield { d: `cell ${i} holds ${cell}: collision — probe ${j}: ${s.scheme === 'linear' ? `(i + 1) mod N` : s.scheme === 'quadratic' ? `(h + ${j}²) mod N` : `(h + ${j}·${step}) mod N  (step = q − (k mod q) = ${step})`} = ${next}`, hl: { b: i, tone: 'hi', b2: next } };
          i = next;
          if (j > s.N) { if (!silent) yield { d: 'probed every cell without finding a free one (quadratic probing can cycle) — rehash', hl: { err: true } }; return; }
        }
      },
      *find(s, args) {
        const raw = val(args); const k = typeof raw === 'number' ? raw : (/^-?\d+$/.test(String(raw).trim()) ? +raw : String(raw).trim());
        const h = hashOf(s, k); s.lookups++;
        yield { d: `find(${JSON.stringify(k)}): ${h.text}`, hl: { b: h.i, tone: 'warn' } };
        if (s.scheme === 'chaining') {
          const bucket = s.table[h.i]; let cmp = 0;
          for (const x of bucket) { cmp++; s.probes++; if (x === k) { yield { d: `walk the bucket's list: found ${k} after ${cmp} comparison${cmp === 1 ? '' : 's'}`, hl: { b: h.i, tone: 'ok', k } }; return; } }
          yield { d: `walked the whole list at bucket ${h.i} (${bucket.length} key${bucket.length === 1 ? '' : 's'}): ${k} is not here. Expected cost is the load factor, ${(s.n / s.N).toFixed(2)} comparisons`, hl: { b: h.i, tone: 'hi' } };
          return;
        }
        let i = h.i, j = 0;
        const step = s.scheme === 'double' ? (s.q - (((typeof k === 'number' ? k : polyHash(String(k), s.a)) % s.q) + s.q) % s.q) : 1;
        for (;;) {
          const cell = s.table[i]; s.probes++;
          if (cell === null) { yield { d: `cell ${i} is empty: ${k} is not in the table (${j + 1} probes)`, hl: { b: i, tone: 'hi' } }; return; }
          if (cell === k) { yield { d: `cell ${i} holds ${k}: found after ${j + 1} probe${j === 0 ? '' : 's'}`, hl: { b: i, tone: 'ok' } }; return; }
          j++;
          const next = s.scheme === 'linear' ? (i + 1) % s.N : s.scheme === 'quadratic' ? (h.i + j * j) % s.N : (h.i + j * step) % s.N;
          yield { d: `cell ${i} holds ${cell === '⌫' ? 'AVAILABLE (keep probing past a removed marker)' : cell}: probe ${j} → cell ${next}`, hl: { b: i, tone: 'blue', b2: next } };
          i = next;
          if (j > s.N) { yield { d: 'cycled through the table: not found', hl: { err: true } }; return; }
        }
      },
      *remove(s, args) {
        const raw = val(args); const k = typeof raw === 'number' ? raw : (/^-?\d+$/.test(String(raw).trim()) ? +raw : String(raw).trim());
        const h = hashOf(s, k);
        yield { d: `remove(${JSON.stringify(k)}): ${h.text}`, hl: { b: h.i, tone: 'warn' } };
        if (s.scheme === 'chaining') {
          const bucket = s.table[h.i]; const at = bucket.indexOf(k);
          if (at < 0) { yield { d: `${k} is not in bucket ${h.i}`, hl: { b: h.i, tone: 'hi' } }; return; }
          bucket.splice(at, 1); s.n--;
          yield { d: `unlink ${k} from the bucket's list; n = ${s.n}`, hl: { b: h.i, tone: 'ok' } };
          return;
        }
        let i = h.i, j = 0;
        const step = s.scheme === 'double' ? (s.q - (((typeof k === 'number' ? k : polyHash(String(k), s.a)) % s.q) + s.q) % s.q) : 1;
        for (;;) {
          const cell = s.table[i];
          if (cell === null) { yield { d: `cell ${i} is empty: ${k} is not in the table`, hl: { b: i, tone: 'hi' } }; return; }
          if (cell === k) { s.table[i] = '⌫'; s.n--; yield { d: `cell ${i} holds ${k}: mark it AVAILABLE rather than empty, so later probe sequences that passed through here still work`, hl: { b: i, tone: 'ok' } }; return; }
          j++;
          const next = s.scheme === 'linear' ? (i + 1) % s.N : s.scheme === 'quadratic' ? (h.i + j * j) % s.N : (h.i + j * step) % s.N;
          yield { d: `cell ${i} holds ${cell}: probe ${j} → cell ${next}`, hl: { b: i, tone: 'blue', b2: next } };
          i = next;
          if (j > s.N) { yield { d: 'cycled: not found', hl: { err: true } }; return; }
        }
      },
    },
    render(s, step) {
      const cw = 44, ch = 32, x0 = 24, y0 = 34;
      const hl = {}; if (step.hl && step.hl.b !== undefined) hl[step.hl.b] = step.hl.tone; if (step.hl && step.hl.b2 !== undefined && hl[step.hl.b2] === undefined) hl[step.hl.b2] = 'warn';
      const w = Math.max(360, x0 * 2 + s.N * cw);
      if (s.scheme !== 'chaining') {
        let out = svgOpen(w, y0 + ch + 60) + defs();
        out += cellsRow(s.table.map(x => x === null ? '' : x), x0, y0, cw, ch, hl, []);
        out += text(x0, y0 + ch + 40, `open addressing, ${s.scheme} probing, N = ${s.N}, n = ${s.n}, load factor ${(s.n / s.N).toFixed(2)}${s.lookups ? `, ${(s.probes / s.lookups).toFixed(1)} probes per lookup so far` : ''}`, 'ds-note');
        out += text(x0, y0 + ch + 56, '⌫ = AVAILABLE marker left by a removal', 'ds-idx', 'text-anchor="start"');
        return out + '</svg>';
      }
      const maxLen = Math.max(1, ...s.table.map(b => b.length));
      const h = y0 + ch + 14 + maxLen * (ch + 6) + 40;
      let out = svgOpen(w, h) + defs();
      out += cellsRow(s.table.map(() => ''), x0, y0, cw, ch, hl, []);
      s.table.forEach((bucket, b) => bucket.forEach((k, j) => {
        const x = x0 + b * cw + 4, y = y0 + ch + 14 + j * (ch + 6);
        const tone = hl[b] && (step.hl.k === undefined || step.hl.k === k) ? hl[b] : null;
        const [bg, st] = tone === 'ok' ? [C.okBg, C.ok] : tone === 'hi' ? [C.hiBg, C.hi] : tone === 'blue' ? [C.blueBg, C.blue] : tone === 'warn' ? [C.warnBg, C.warn] : [C.cell, C.line];
        out += line(x + (cw - 8) / 2, y - 6, x + (cw - 8) / 2, y, C.line, 1.2);
        out += rect(x, y, cw - 8, ch - 2, bg, st, 4) + text(x + (cw - 8) / 2, y + ch / 2 + 3, fmt(k), 'ds-small');
      }));
      out += text(x0, h - 12, `separate chaining, N = ${s.N} buckets, n = ${s.n}, load factor ${(s.n / s.N).toFixed(2)}, longest chain ${maxLen}${s.lookups ? `, ${(s.probes / s.lookups).toFixed(1)} comparisons per lookup so far` : ''}`, 'ds-note');
      return out + '</svg>';
    },
  };

  /* ── sort: merge, quick, insertion, selection, bucket, radix ── */
  MODES.sort = {
    title: 'Sorting',
    init(cfg) {
      const a = parseList(cfg.data, [7, 2, 9, 4, 3, 8, 6, 1]);
      const algo = ['merge', 'quick', 'insertion', 'selection', 'bucket', 'radix'].includes(cfg.algo) ? cfg.algo : 'merge';
      return { a, orig: a.slice(), algo, cmp: 0, rows: [], buckets: null, done: false, pivotRule: cfg.pivot || 'last', digits: num(cfg.digits, 0) };
    },
    controls: [{ kind: 'select', name: 'algo', label: 'algorithm', options: ['merge', 'quick', 'insertion', 'selection', 'bucket', 'radix'] }, { kind: 'text', name: 'data', label: 'data', default: '' }, { kind: 'button', label: 'sort', op: 'sort', args: ['algo', 'data'] }],
    ops: {
      *sort(s, args) {
        if (args[0]) s.algo = args[0];
        if (args[1] && String(args[1]).trim()) s.orig = parseList(String(args[1]));
        s.a = s.orig.slice(); s.cmp = 0; s.rows = []; s.buckets = null; s.done = false;
        const A = s.a, n = A.length;
        const cmpLess = (x, y) => { s.cmp++; return x < y; };
        if (s.algo === 'merge') {
          // recursion rows: each level shows the segments; merges shown as they complete
          const rec = function* (lo, hi, depth) {
            if (hi - lo < 1) return;
            const mid = Math.floor((lo + hi) / 2);
            s.rows[depth] = s.rows[depth] || []; s.rows[depth].push([lo, hi]);
            yield { d: `divide [${lo}..${hi}] into [${lo}..${mid}] and [${mid + 1}..${hi}]  (depth ${depth})`, hl: { range: [lo, hi], tone: 'warn' } };
            yield* rec(lo, mid, depth + 1); yield* rec(mid + 1, hi, depth + 1);
            const L = A.slice(lo, mid + 1), R = A.slice(mid + 1, hi + 1); let i = 0, j = 0, k = lo;
            while (i < L.length && j < R.length) { if (cmpLess(R[j], L[i])) A[k++] = R[j++]; else A[k++] = L[i++]; }
            while (i < L.length) A[k++] = L[i++]; while (j < R.length) A[k++] = R[j++];
            yield { d: `merge [${lo}..${mid}] and [${mid + 1}..${hi}] → ${A.slice(lo, hi + 1).join(' ')}  (${s.cmp} comparisons so far)`, hl: { range: [lo, hi], tone: 'ok' } };
          };
          yield* rec(0, n - 1, 0);
        } else if (s.algo === 'quick') {
          const rec = function* (lo, hi, depth) {
            if (lo >= hi) { if (lo === hi) yield { d: `[${lo}] is a single element: sorted`, hl: { range: [lo, lo], tone: 'ok' } }; return; }
            let p = s.pivotRule === 'first' ? lo : s.pivotRule === 'middle' ? Math.floor((lo + hi) / 2) : hi;
            if (p !== hi) { [A[p], A[hi]] = [A[hi], A[p]]; }
            const pivot = A[hi];
            yield { d: `partition [${lo}..${hi}] around the pivot ${pivot} (${s.pivotRule} element, moved to the end)`, hl: { range: [lo, hi], tone: 'warn', pivot: hi } };
            let l = lo, r = hi - 1;
            while (l <= r) {
              while (l <= r && !cmpLess(pivot, A[l])) l++;
              while (r >= l && !cmpLess(A[r], pivot)) r--;
              if (l < r) { yield { d: `A[l=${l}] = ${A[l]} > pivot and A[r=${r}] = ${A[r]} < pivot: swap`, hl: { range: [lo, hi], tone: 'blue', l, r, pivot: hi } }; [A[l], A[r]] = [A[r], A[l]]; l++; r--; }
            }
            [A[l], A[hi]] = [A[hi], A[l]];
            yield { d: `l and r crossed at ${l}: put the pivot there — ${pivot} is in its final place, smaller keys left, larger right  (${s.cmp} comparisons so far)`, hl: { range: [lo, hi], tone: 'ok', pivot: l } };
            s.rows[depth] = s.rows[depth] || []; s.rows[depth].push([lo, hi]);
            yield* rec(lo, l - 1, depth + 1); yield* rec(l + 1, hi, depth + 1);
          };
          yield* rec(0, n - 1, 0);
        } else if (s.algo === 'insertion') {
          for (let i = 1; i < n; i++) {
            const x = A[i]; let j = i - 1;
            yield { d: `take A[${i}] = ${x}; the prefix [0..${i - 1}] is sorted — shift larger keys right`, hl: { range: [0, i - 1], tone: 'ok', pivot: i } };
            while (j >= 0 && cmpLess(x, A[j])) { A[j + 1] = A[j]; j--; }
            A[j + 1] = x;
            yield { d: `insert ${x} at position ${j + 1}  (${s.cmp} comparisons so far)`, hl: { range: [0, i], tone: 'ok', pivot: j + 1 } };
          }
        } else if (s.algo === 'selection') {
          for (let i = 0; i < n - 1; i++) {
            let m = i; for (let j = i + 1; j < n; j++) if (cmpLess(A[j], A[m])) m = j;
            yield { d: `scan [${i}..${n - 1}]: the minimum is A[${m}] = ${A[m]} (${n - 1 - i} comparisons)`, hl: { range: [i, n - 1], tone: 'warn', pivot: m } };
            [A[i], A[m]] = [A[m], A[i]];
            yield { d: `swap it into position ${i}; [0..${i}] is sorted  (${s.cmp} comparisons so far)`, hl: { range: [0, i], tone: 'ok' } };
          }
        } else if (s.algo === 'bucket') {
          const N = Math.max(...A) + 1;
          s.buckets = Array.from({ length: N }, () => []);
          yield { d: `bucket sort: keys are integers in [0, ${N - 1}] — make ${N} buckets`, hl: {} };
          for (let i = 0; i < n; i++) { s.buckets[A[i]].push(A[i]); yield { d: `A[${i}] = ${A[i]} goes into bucket ${A[i]}`, hl: { pivot: i, bucket: A[i] } }; }
          let k = 0; for (let b = 0; b < N; b++) for (const x of s.buckets[b]) A[k++] = x;
          yield { d: `read the buckets in order: ${A.join(' ')} — no comparisons at all, O(n + N) time`, hl: { range: [0, n - 1], tone: 'ok' } };
        } else if (s.algo === 'radix') {
          const digits = s.digits || Math.max(...A.map(x => String(Math.abs(x)).length));
          for (let d = 0; d < digits; d++) {
            const div = Math.pow(10, d);
            s.buckets = Array.from({ length: 10 }, () => []);
            for (let i = 0; i < n; i++) s.buckets[Math.floor(A[i] / div) % 10].push(A[i]);
            yield { d: `pass ${d + 1}: bucket-sort by digit ${d + 1} from the right (the ${['ones', 'tens', 'hundreds', 'thousands'][d] || '10^' + d}), keeping the order within each bucket (stable)`, hl: { range: [0, n - 1], tone: 'warn', digit: d } };
            let k = 0; for (let b = 0; b < 10; b++) for (const x of s.buckets[b]) A[k++] = x;
            yield { d: `after pass ${d + 1}: ${A.join(' ')}`, hl: { range: [0, n - 1], tone: 'ok', digit: d } };
          }
          s.buckets = null;
          yield { d: `sorted after ${digits} stable passes: O(d·(n + 10))`, hl: { range: [0, n - 1], tone: 'ok' } };
        }
        s.done = true;
        if (s.algo !== 'bucket' && s.algo !== 'radix') yield { d: `sorted: ${A.join(' ')} — ${s.cmp} comparisons for n = ${n}  (n log₂ n ≈ ${(n * Math.log2(n)).toFixed(0)}, n² = ${n * n})`, hl: { range: [0, n - 1], tone: 'ok' } };
      },
    },
    render(s, step) {
      const n = s.a.length, cw = Math.max(30, Math.min(44, 520 / Math.max(n, 1))), ch = 32, x0 = 24, y0 = 40;
      const hl = {};
      if (step.hl && step.hl.range) for (let i = step.hl.range[0]; i <= step.hl.range[1]; i++) hl[i] = step.hl.tone;
      if (step.hl && step.hl.pivot !== undefined) hl[step.hl.pivot] = 'hi';
      const marks = []; if (step.hl && step.hl.l !== undefined) marks.push({ i: step.hl.l, label: 'l', color: C.blue }, { i: step.hl.r, label: 'r', color: C.hi });
      if (step.hl && step.hl.pivot !== undefined && s.algo === 'quick') marks.push({ i: step.hl.pivot, label: 'pivot', color: C.hi, below: true });
      let extraH = 0;
      const w = Math.max(360, x0 * 2 + n * cw);
      const rows = s.algo === 'merge' || s.algo === 'quick' ? s.rows : [];
      const bucketsH = s.buckets ? 24 + Math.max(1, ...s.buckets.map(b => b.length)) * 22 + 20 : 0;
      extraH = rows.length * 22 + bucketsH;
      let out = svgOpen(w, y0 + ch + 44 + extraH) + defs();
      out += cellsRow(s.a, x0, y0, cw, ch, hl, marks);
      let y = y0 + ch + 40;
      rows.forEach((segs, depth) => { for (const [lo, hi] of segs) { out += rect(x0 + lo * cw + 2, y, (hi - lo + 1) * cw - 4, 16, s.algo === 'merge' ? C.blueBg : C.purpleBg, s.algo === 'merge' ? C.blue : C.purple, 3); out += text(x0 + lo * cw + 6, y + 12, `${lo}..${hi}`, 'ds-idx', 'text-anchor="start"'); } y += 22; });
      if (s.buckets) {
        const bw = Math.max(26, Math.min(44, (w - 2 * x0) / s.buckets.length));
        s.buckets.forEach((b, i) => {
          const bx = x0 + i * bw;
          out += text(bx + bw / 2, y + 12, String(i), 'ds-idx', `fill="${step.hl && step.hl.bucket === i ? C.hi : C.muted}"`);
          b.forEach((k, j) => { out += rect(bx + 2, y + 18 + j * 22, bw - 4, 20, step.hl && step.hl.bucket === i ? C.hiBg : C.cell, C.line, 3) + text(bx + bw / 2, y + 32 + j * 22, String(k), 'ds-small'); });
        });
        y += bucketsH;
      }
      out += text(x0, y0 + ch + 30, `${s.algo} sort — comparisons: ${s.cmp}${s.done ? ' (done)' : ''}`, 'ds-note');
      return out + '</svg>';
    },
  };

  /* ── graph: representations, DFS/BFS, topological sort, Dijkstra, Bellman-Ford, Floyd-Warshall ── */
  function parseGraph(cfg) {
    let vs = cfg.vertices ? parseList(cfg.vertices, []).map(String) : [];
    const edges = [];
    const raw = Array.isArray(cfg.edges) ? cfg.edges : typeof cfg.edges === 'string' ? cfg.edges.split(/[,;\n]+/).map(x => x.trim()).filter(Boolean) : [];
    for (const e of raw) {
      let u, v, w = null;
      if (Array.isArray(e)) { [u, v, w] = e; }
      else { const m = String(e).match(/^\s*(\S+?)\s*(?:-+>?|→|>)\s*(\S+?)(?:\s*[: ]\s*(-?\d+(?:\.\d+)?))?\s*$/); if (!m) continue; u = m[1]; v = m[2]; w = m[3] !== undefined ? +m[3] : null; }
      u = String(u); v = String(v);
      if (!vs.includes(u)) vs.push(u); if (!vs.includes(v)) vs.push(v);
      edges.push({ u, v, w: w === null || w === undefined ? null : +w });
    }
    const directed = !!cfg.directed, weighted = edges.some(e => e.w !== null);
    const pos = {};
    if (cfg.layout && typeof cfg.layout === 'object') for (const [k, p] of Object.entries(cfg.layout)) pos[String(k)] = [+p[0], +p[1]];
    vs.forEach((v, i) => { if (!pos[v]) { const a = -Math.PI / 2 + 2 * Math.PI * i / vs.length; pos[v] = [50 + 42 * Math.cos(a), 50 + 42 * Math.sin(a)]; } });
    return { vs, edges, directed, weighted, pos };
  }
  MODES.graph = {
    title: 'Graph',
    init(cfg) {
      const g = parseGraph(cfg);
      return Object.assign(g, { start: cfg.start !== undefined ? String(cfg.start) : g.vs[0], vlabel: {}, vtone: {}, etone: {}, side: null, order: [], matrix: null, kRound: null, view: cfg.view || 'graph' });
    },
    controls: [{ kind: 'text', name: 's', label: 'start', default: '' }, { kind: 'button', label: 'DFS', op: 'dfs', args: ['s'] }, { kind: 'button', label: 'BFS', op: 'bfs', args: ['s'] }, { kind: 'button', label: 'topological', op: 'topo' }, { kind: 'button', label: 'Dijkstra', op: 'dijkstra', args: ['s'] }, { kind: 'button', label: 'Bellman-Ford', op: 'bellmanFord', args: ['s'] }, { kind: 'button', label: 'Floyd-Warshall', op: 'floyd' }, { kind: 'button', label: 'adjacency', op: 'adjacency' }],
    ops: {
      *adjacency(s) {
        reset(s);
        const list = s.vs.map(v => `${v}: ${outEdges(s, v).map(e => other(e, v) + (s.weighted ? '(' + e.w + ')' : '')).join(' ')}`);
        const M = s.vs.map(u => s.vs.map(v => { const e = s.edges.find(e => (e.u === u && e.v === v) || (!s.directed && e.u === v && e.v === u)); return e ? (s.weighted ? e.w : 1) : (s.weighted ? '∞' : 0); }));
        s.side = { title: 'adjacency list', lines: list }; s.matrix = { rows: M, title: `adjacency matrix (${s.vs.length}×${s.vs.length})` };
        yield { d: `n = ${s.vs.length} vertices, m = ${s.edges.length} edges; the list uses O(n + m) space and finds a vertex's neighbours in O(deg), the matrix uses O(n²) and tests one edge in O(1)${s.directed ? '' : '  (undirected: Σ deg = 2m)'}`, hl: {} };
      },
      *dfs(s, args) {
        reset(s); const start = pick(s, args);
        const visited = new Set(), edgeSeen = new Set(); let k = 0;
        const stack = [];
        const visit = function* (u) {
          visited.add(u); s.vtone[u] = 'warn'; s.vlabel[u] = String(++k); s.order.push(u); stack.push(u); s.side = { title: 'call stack (DFS recursion)', lines: stack.slice().reverse() };
          yield { d: `visit ${u} (${k}${k === 1 ? 'st' : k === 2 ? 'nd' : k === 3 ? 'rd' : 'th'}); examine its ${s.directed ? 'outgoing ' : ''}edges in order`, hl: { v: u } };
          for (const e of outEdges(s, u)) {
            const ei = s.edges.indexOf(e), w = other(e, u);
            if (edgeSeen.has(ei)) continue; edgeSeen.add(ei);
            if (!visited.has(w)) { s.etone[ei] = 'discovery'; yield { d: `edge ${u}–${w}: ${w} unvisited → discovery edge, recurse into ${w}`, hl: { e: ei, v: w } }; yield* visit(w); s.side = { title: 'call stack (DFS recursion)', lines: stack.slice().reverse() }; yield { d: `back in ${u} after finishing ${w}`, hl: { v: u } }; }
            else if (!s.directed) { s.etone[ei] = 'back'; yield { d: `edge ${u}–${w}: ${w} already visited → back edge (it points to an ancestor: a cycle)`, hl: { e: ei } }; }
            else if (stack.includes(w)) { s.etone[ei] = 'back'; yield { d: `edge ${u}→${w}: ${w} is on the stack (an ancestor) → back edge, so the digraph has a cycle`, hl: { e: ei } }; }
            else if (s.order.indexOf(w) > s.order.indexOf(u)) { s.etone[ei] = 'forward'; yield { d: `edge ${u}→${w}: ${w} is a descendant already finished → forward edge`, hl: { e: ei } }; }
            else { s.etone[ei] = 'cross'; yield { d: `edge ${u}→${w}: ${w} was finished in another branch → cross edge`, hl: { e: ei } }; }
          }
          s.vtone[u] = 'ok'; stack.pop();
        };
        yield* visit(start);
        const rest = s.vs.filter(v => !visited.has(v));
        s.side = { title: 'DFS order', lines: [s.order.join(' → ')] };
        yield { d: `DFS from ${start} done: ${s.order.length} of ${s.vs.length} vertices reached; the discovery edges form a spanning tree of the component. ${rest.length ? 'Unreached: ' + rest.join(', ') + ' (another component — restart there for a forest).' : 'The graph is connected.'} Time O(n + m).`, hl: {} };
      },
      *bfs(s, args) {
        reset(s); const start = pick(s, args);
        const level = { [start]: 0 }; let queue = [start]; s.vlabel[start] = 'L0'; s.vtone[start] = 'warn'; let i = 0;
        s.side = { title: 'queue', lines: queue.slice() };
        yield { d: `BFS from ${start}: level L0 = {${start}}`, hl: { v: start } };
        while (queue.length) {
          const next = [];
          for (const u of queue) {
            s.order.push(u);
            for (const e of outEdges(s, u)) {
              const ei = s.edges.indexOf(e), w = other(e, u);
              if (s.etone[ei]) continue;
              if (level[w] === undefined) { level[w] = i + 1; s.etone[ei] = 'discovery'; s.vlabel[w] = 'L' + (i + 1); s.vtone[w] = 'warn'; next.push(w); s.side = { title: `level L${i + 1} being built`, lines: next.slice() }; yield { d: `from ${u}: ${w} is new → discovery edge, ${w} joins level L${i + 1}`, hl: { e: ei, v: w } }; }
              else { s.etone[ei] = 'cross'; yield { d: `from ${u}: ${w} already has a level (L${level[w]}) → cross edge`, hl: { e: ei } }; }
            }
            s.vtone[u] = 'ok';
          }
          queue = next; i++;
          if (queue.length) yield { d: `level L${i} = {${queue.join(', ')}}: every vertex at distance ${i} edges from ${start}`, hl: {} };
        }
        const rest = s.vs.filter(v => level[v] === undefined);
        s.side = { title: 'levels', lines: Object.entries(level).sort((a, b) => a[1] - b[1]).map(([v, l]) => `${v}: L${l}`) };
        yield { d: `BFS done: ${Object.keys(level).length} vertices reached in ${i} level${i === 1 ? '' : 's'}; the discovery edges give shortest paths in number of edges. ${rest.length ? 'Unreached: ' + rest.join(', ') : ''} Time O(n + m).`, hl: {} };
      },
      *topo(s) {
        reset(s);
        if (!s.directed) { yield { d: 'topological sort needs a directed graph', hl: { err: true } }; return; }
        const indeg = {}; s.vs.forEach(v => { indeg[v] = 0; }); s.edges.forEach(e => { indeg[e.v]++; });
        let ready = s.vs.filter(v => indeg[v] === 0); let k = 0;
        s.vs.forEach(v => { s.vlabel[v] = 'in ' + indeg[v]; });
        s.side = { title: 'ready (in-degree 0)', lines: ready.slice() };
        yield { d: `count in-degrees; vertices with in-degree 0 have no prerequisites: ${ready.join(', ') || 'none — every vertex is on a cycle'}`, hl: {} };
        while (ready.length) {
          const u = ready.shift(); s.vlabel[u] = String(++k); s.vtone[u] = 'ok'; s.order.push(u);
          yield { d: `output ${u} as number ${k}`, hl: { v: u } };
          for (const e of outEdges(s, u)) { const ei = s.edges.indexOf(e); indeg[e.v]--; s.etone[ei] = 'done'; if (s.vtone[e.v] !== 'ok') s.vlabel[e.v] = 'in ' + indeg[e.v]; if (indeg[e.v] === 0) { ready.push(e.v); s.vtone[e.v] = 'warn'; } s.side = { title: 'ready (in-degree 0)', lines: ready.slice() }; yield { d: `remove edge ${u}→${e.v}: in-degree of ${e.v} is now ${indeg[e.v]}${indeg[e.v] === 0 ? ' → ready' : ''}`, hl: { e: ei, v: e.v } }; }
        }
        const left = s.vs.filter(v => s.vtone[v] !== 'ok');
        s.side = { title: 'topological order', lines: [s.order.join(' → ')] };
        yield { d: left.length ? `stuck with ${left.join(', ')} still having in-degree > 0: the digraph has a cycle, no topological order exists` : `topological order: ${s.order.join(' → ')} — every edge goes forward in it; O(n + m)`, hl: left.length ? { err: true } : {} };
      },
      *dijkstra(s, args) {
        reset(s); const start = pick(s, args);
        if (s.edges.some(e => e.w !== null && e.w < 0)) { yield { d: 'Dijkstra requires non-negative weights (a negative edge could improve a vertex already finalised)', hl: { err: true } }; }
        const D = {}; s.vs.forEach(v => { D[v] = Infinity; }); D[start] = 0;
        const inQ = new Set(s.vs); const show = () => { s.vs.forEach(v => { s.vlabel[v] = D[v] === Infinity ? '∞' : String(D[v]); }); s.side = { title: 'priority queue (vertex: D)', lines: [...inQ].sort((a, b) => D[a] - D[b]).map(v => `${v}: ${D[v] === Infinity ? '∞' : D[v]}`) }; };
        show();
        yield { d: `D[${start}] = 0, every other D = ∞; all vertices are in the priority queue keyed by D`, hl: { v: start } };
        while (inQ.size) {
          let u = null; for (const v of inQ) if (u === null || D[v] < D[u]) u = v;
          if (D[u] === Infinity) { yield { d: `the remaining vertices (${[...inQ].join(', ')}) are unreachable from ${start}`, hl: {} }; break; }
          inQ.delete(u); s.vtone[u] = 'ok'; show();
          yield { d: `removeMin: ${u} with D = ${D[u]} — its distance is now final (the cloud grows by ${u})`, hl: { v: u } };
          for (const e of outEdges(s, u)) {
            const w = other(e, u), ei = s.edges.indexOf(e); if (!inQ.has(w)) continue;
            const cand = D[u] + (e.w === null ? 1 : e.w);
            if (cand < D[w]) { const old = D[w]; D[w] = cand; s.etone[ei] = 'discovery'; for (const f of s.edges) if (f !== e && s.etone[s.edges.indexOf(f)] === 'discovery' && other(f, f.u) === w && f.u !== u && (s.directed ? f.v === w : (f.u === w || f.v === w)) && !inQ.has(f.u === w ? f.v : f.u)) { /* keep */ } show(); yield { d: `relax ${u}→${w}: D[${u}] + w = ${D[u]} + ${e.w === null ? 1 : e.w} = ${cand} < ${old === Infinity ? '∞' : old} → D[${w}] = ${cand}, key updated in the PQ`, hl: { e: ei, v: w } }; }
            else yield { d: `edge ${u}→${w}: ${D[u]} + ${e.w === null ? 1 : e.w} = ${cand} is not better than D[${w}] = ${D[w]}`, hl: { e: ei } };
          }
        }
        s.side = { title: 'shortest distances', lines: s.vs.map(v => `${v}: ${D[v] === Infinity ? '∞' : D[v]}`) };
        yield { d: `Dijkstra done from ${start}. With a heap-based PQ: O((n + m) log n)`, hl: {} };
      },
      *bellmanFord(s, args) {
        reset(s); const start = pick(s, args);
        if (!s.directed) { yield { d: 'Bellman-Ford is stated for digraphs (an undirected negative edge is a negative cycle by itself)', hl: { err: true } }; return; }
        const D = {}; s.vs.forEach(v => { D[v] = Infinity; }); D[start] = 0;
        const show = () => { s.vs.forEach(v => { s.vlabel[v] = D[v] === Infinity ? '∞' : String(D[v]); }); s.side = { title: 'D', lines: s.vs.map(v => `${v}: ${D[v] === Infinity ? '∞' : D[v]}`) }; };
        show(); yield { d: `D[${start}] = 0, others ∞. Repeat n − 1 = ${s.vs.length - 1} rounds: relax every edge`, hl: { v: start } };
        for (let r = 1; r < s.vs.length; r++) {
          let changed = false;
          for (const e of s.edges) {
            const ei = s.edges.indexOf(e); if (D[e.u] === Infinity) continue;
            const cand = D[e.u] + (e.w === null ? 1 : e.w);
            if (cand < D[e.v]) { const old = D[e.v]; D[e.v] = cand; changed = true; s.etone[ei] = 'discovery'; show(); yield { d: `round ${r}: relax ${e.u}→${e.v}: ${cand} < ${old === Infinity ? '∞' : old}`, hl: { e: ei, v: e.v } }; }
          }
          yield { d: changed ? `end of round ${r}` : `round ${r}: nothing changed — distances are final early`, hl: {} };
          if (!changed) break;
        }
        let neg = false; for (const e of s.edges) if (D[e.u] !== Infinity && D[e.u] + (e.w === null ? 1 : e.w) < D[e.v]) neg = true;
        yield { d: neg ? 'one more round still improves a distance: a negative cycle is reachable — no shortest paths exist' : `Bellman-Ford done: O(n·m), and it tolerates negative edges`, hl: neg ? { err: true } : {} };
      },
      *floyd(s) {
        reset(s);
        const n = s.vs.length, INF = Infinity;
        const M = s.vs.map(u => s.vs.map(v => u === v ? (s.weighted ? 0 : 1) : (() => { const e = s.edges.find(e => (e.u === u && e.v === v) || (!s.directed && e.u === v && e.v === u)); return e ? (s.weighted ? e.w : 1) : (s.weighted ? INF : 0); })()));
        s.matrix = { rows: M.map(r => r.map(x => x === INF ? '∞' : x)), title: s.weighted ? 'shortest-path distances' : 'transitive closure (1 = reachable)' };
        yield { d: s.weighted ? `Floyd-Warshall: start from the adjacency matrix of weights (∞ where there is no edge)` : `Floyd-Warshall transitive closure: start from the adjacency matrix; round k lets paths pass through vertex ${s.vs[0]}, then ${s.vs[1] || '…'}, …`, hl: {} };
        for (let k = 0; k < n; k++) {
          s.kRound = k; let changes = 0;
          for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
            if (s.weighted) { if (M[i][k] + M[k][j] < M[i][j]) { M[i][j] = M[i][k] + M[k][j]; changes++; } }
            else if (M[i][k] && M[k][j] && !M[i][j]) { M[i][j] = 1; changes++; }
          }
          s.matrix = { rows: M.map(r => r.map(x => x === INF ? '∞' : x)), title: s.weighted ? `distances after round k = ${s.vs[k]}` : `closure after round k = ${s.vs[k]}`, k };
          yield { d: `round ${k + 1} (through ${s.vs[k]}): ${changes} entr${changes === 1 ? 'y' : 'ies'} improved — every pair (i, j) checks ${s.weighted ? 'M[i][k] + M[k][j] < M[i][j]' : 'M[i][k] and M[k][j]'}`, hl: {} };
        }
        s.kRound = null;
        yield { d: `done: n rounds of n² updates, O(n³)`, hl: {} };
      },
    },
    render(s, step) {
      const W = 520, Hh = 300, pad = 34;
      const P = v => [pad + s.pos[v][0] / 100 * (W - 2 * pad), pad + s.pos[v][1] / 100 * (Hh - 2 * pad)];
      let out = svgOpen(W, Hh) + defs();
      const toneColor = { discovery: C.hi, back: C.blue, cross: C.line, forward: C.purple, done: '#cbd5e1' };
      s.edges.forEach((e, ei) => {
        const [x1, y1] = P(e.u), [x2, y2] = P(e.v);
        const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len;
        const t = s.etone[ei]; const col = step.hl && step.hl.e === ei ? C.warn : (t ? toneColor[t] : C.ink);
        const wdt = step.hl && step.hl.e === ei ? 3 : t === 'discovery' ? 2.6 : 1.5;
        const dash = t === 'back' || t === 'cross' || t === 'forward' ? 'stroke-dasharray="6 4"' : '';
        // curve slightly when the reverse edge also exists
        const twin = s.directed && s.edges.some(f => f.u === e.v && f.v === e.u);
        const sx = x1 + ux * 17, sy = y1 + uy * 17, ex = x2 - ux * 18, ey = y2 - uy * 18;
        if (twin) { const cx = (sx + ex) / 2 - uy * 18, cy = (sy + ey) / 2 + ux * 18; out += `<path d="M ${sx} ${sy} Q ${cx} ${cy} ${ex} ${ey}" fill="none" stroke="${col}" stroke-width="${wdt}" ${dash} ${s.directed ? `marker-end="url(#${col === C.hi ? 'ds-ah-hi' : col === C.blue ? 'ds-ah-blue' : 'ds-ah'})"` : ''}/>`; if (e.w !== null) out += text(cx, cy + 4, String(e.w), 'ds-w'); }
        else { out += `<line x1="${sx}" y1="${sy}" x2="${ex}" y2="${ey}" stroke="${col}" stroke-width="${wdt}" ${dash} ${s.directed ? `marker-end="url(#${col === C.hi ? 'ds-ah-hi' : col === C.blue ? 'ds-ah-blue' : col === C.line || col === '#cbd5e1' ? 'ds-ah-muted' : 'ds-ah'})"` : ''}/>`; if (e.w !== null) out += text((x1 + x2) / 2 - uy * 9, (y1 + y2) / 2 + ux * 9 + 4, String(e.w), 'ds-w'); }
      });
      for (const v of s.vs) {
        const [x, y] = P(v);
        const tone = step.hl && step.hl.v === v ? 'hi' : s.vtone[v];
        out += node(x, y, v, tone, 15);
        if (s.vlabel[v] !== undefined) out += text(x + 17, y - 11, String(s.vlabel[v]), 'ds-idx', `fill="${C.hi}" text-anchor="start" font-weight="700"`);
      }
      const legend = Object.keys(toneColor).filter(k => s.edges.some((e, i) => s.etone[i] === k));
      if (legend.length) out += text(12, Hh - 8, legend.map(k => `${k}: ${k === 'discovery' ? 'thick red' : k === 'back' ? 'dashed blue' : k === 'forward' ? 'dashed purple' : k === 'cross' ? 'dashed grey' : 'grey'}`).join('   '), 'ds-idx', 'text-anchor="start"');
      out += '</svg>';
      let side = '';
      if (s.side) side += `<div class="ds-side-title">${esc(s.side.title)}</div><div class="ds-side-body">${s.side.lines.map(l => `<div>${esc(l)}</div>`).join('') || '<div class="ds-empty">(empty)</div>'}</div>`;
      if (s.matrix) side += `<div class="ds-side-title">${esc(s.matrix.title)}</div><table class="ds-matrix"><tr><th></th>${s.vs.map(v => `<th>${esc(v)}</th>`).join('')}</tr>${s.matrix.rows.map((r, i) => `<tr><th>${esc(s.vs[i])}</th>${r.map((x, j) => `<td class="${s.matrix.k !== undefined && (i === s.matrix.k || j === s.matrix.k) ? 'k' : ''}">${esc(x)}</td>`).join('')}</tr>`).join('')}</table>`;
      return { svg: out, side };
    },
  };
  const outEdges = (s, u) => s.edges.filter(e => e.u === u || (!s.directed && e.v === u));
  const other = (e, u) => e.u === u ? e.v : e.u;
  const pick = (s, args) => { const a = val(args); const v = a !== undefined && a !== '' && s.vs.includes(String(a)) ? String(a) : s.start; return v; };
  function reset(s) { s.vlabel = {}; s.vtone = {}; s.etone = {}; s.side = null; s.order = []; s.matrix = null; s.kRound = null; }

  /* ═══════════════════════ shell ═══════════════════════ */
  class Viewer {
    constructor(id, cfg) {
      this.id = id; this.cfg = cfg; this.mode = MODES[cfg.mode];
      if (!this.mode) throw new Error('unknown ds mode ' + cfg.mode);
      this.el = typeof document !== 'undefined' ? document.getElementById('sim-' + id) : null;
      this.values = {};
      for (const c of this.mode.controls) if (c.kind !== 'button') this.values[c.name] = c.default === undefined ? '' : c.default;
      this.reset();
    }
    reset() {
      this.state = this.mode.init(this.cfg);
      this.steps = [{ d: this.cfg.intro || `${this.mode.title}: ${this.scriptText()}`, hl: {}, state: clone(this.state) }];
      this.i = 0; this.error = null;
      for (const op of this.scripted()) this.run(op.name, op.args, true);
      this.i = this.steps.length > 1 ? 1 : 0;
      if (this.el) this.render();
    }
    scripted() {
      const ops = Array.isArray(this.cfg.ops) ? this.cfg.ops : [];
      return ops.map(o => { if (typeof o === 'string') { const [name, ...rest] = o.trim().split(/\s+/); return { name, args: rest.map(x => isNaN(+x) ? x : +x) }; } return { name: o.op || o.name, args: o.args || [] }; });
    }
    scriptText() { const ops = this.scripted(); return ops.length ? `the scripted operations are ${ops.map(o => o.name + (o.args.length ? '(' + o.args.join(', ') + ')' : '()')).join(', ')} — step through them, then use the controls` : 'use the controls'; }
    run(name, args, quiet) {
      const op = this.mode.ops[name];
      if (!op) { this.steps.push({ d: `unknown operation ${name}`, hl: { err: true }, state: clone(this.state) }); return; }
      const before = this.steps.length;
      try { const g = op.call(this.mode, this.state, args || []); for (const st of g) this.steps.push({ d: st.d, hl: st.hl || {}, state: clone(this.state) }); }
      catch (e) { this.steps.push({ d: 'internal error: ' + (e && e.message), hl: { err: true }, state: clone(this.state) }); if (typeof console !== 'undefined') console.warn('ds.js', e); }
      if (!quiet) { this.i = Math.min(before, this.steps.length - 1); this.render(); }
    }
    goto(k) { this.i = Math.max(0, Math.min(this.steps.length - 1, k)); this.render(); }
    render() {
      const el = this.el; if (!el) return;
      const step = this.steps[this.i];
      const r = this.mode.render(step.state, step);
      const svg = typeof r === 'string' ? r : r.svg, side = typeof r === 'string' ? '' : r.side;
      const ctrls = this.mode.controls.map(c => {
        if (c.kind === 'button') return `<button class="btn fa-btn ds-op" data-op="${esc(c.op)}" data-args="${esc((c.args || []).join(','))}">${esc(c.label)}</button>`;
        if (c.kind === 'select') return `<label class="ds-field">${esc(c.label)} <select data-name="${esc(c.name)}">${c.options.map(o => `<option value="${esc(o)}" ${String(this.values[c.name]) === String(o) ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select></label>`;
        return `<label class="ds-field">${esc(c.label)} <input class="ds-input" data-name="${esc(c.name)}" type="${c.kind === 'number' ? 'number' : 'text'}" value="${esc(this.values[c.name])}" size="${c.kind === 'number' ? 4 : 10}"></label>`;
      }).join('');
      const last = this.i === this.steps.length - 1;
      el.innerHTML = `<div class="ds-wrap">
        <div class="ds-toolbar">${ctrls}<button class="btn fa-btn fa-secondary" data-act="reset" title="back to the initial structure">⟲ Reset</button></div>
        <div class="ds-playback">
          <button class="btn fa-btn fa-secondary" data-act="first" ${this.i === 0 ? 'disabled' : ''}>|◀</button>
          <button class="btn fa-btn fa-secondary" data-act="back" ${this.i === 0 ? 'disabled' : ''}>◀ Back</button>
          <button class="btn fa-btn ds-step" data-act="step" ${last ? 'disabled' : ''}>Step ▶</button>
          <button class="btn fa-btn fa-secondary" data-act="last" ${last ? 'disabled' : ''}>▶|</button>
          <span class="ds-counter">step ${this.i} of ${this.steps.length - 1}</span>
        </div>
        <div class="ds-desc ${step.hl && step.hl.err ? 'err' : ''}">${esc(step.d)}</div>
        <div class="ds-main ${side ? 'with-side' : ''}"><div class="ds-figure">${svg}</div>${side ? `<div class="ds-side">${side}</div>` : ''}</div>
      </div>`;
      el.querySelectorAll('[data-act]').forEach(b => b.addEventListener('click', () => { const a = b.dataset.act; if (a === 'reset') this.reset(); else if (a === 'first') this.goto(0); else if (a === 'back') this.goto(this.i - 1); else if (a === 'step') this.goto(this.i + 1); else this.goto(Infinity); }));
      el.querySelectorAll('[data-name]').forEach(inp => inp.addEventListener('change', () => { this.values[inp.dataset.name] = inp.value; }));
      el.querySelectorAll('[data-name]').forEach(inp => inp.addEventListener('input', () => { this.values[inp.dataset.name] = inp.value; }));
      el.querySelectorAll('.ds-op').forEach(b => b.addEventListener('click', () => { const names = b.dataset.args ? b.dataset.args.split(',').filter(Boolean) : []; this.run(b.dataset.op, names.map(n => this.values[n])); }));
    }
  }

  const UIS = {};
  DS.mount = function (id, cfg) { const v = new Viewer(id, cfg || {}); UIS[id] = v; v.render(); return v; };
  DS.ui = id => UIS[id];
  DS.modes = () => Object.keys(MODES);
  // DOM-free driver for tests: DS.model(cfg) → { state, run(name, args) → steps (descriptions + snapshots) }
  DS.model = function (cfg) {
    const v = new Viewer('test', cfg);
    return { get state() { return v.state; }, steps: v.steps, run(name, args) { const before = v.steps.length; v.run(name, args, true); return v.steps.slice(before); }, render(k) { const st = v.steps[k === undefined ? v.steps.length - 1 : k]; return v.mode.render(st.state, st); } };
  };

  if (typeof window !== 'undefined') window.DS = DS;
  if (typeof module !== 'undefined' && module.exports) module.exports = DS;
})();
