/* ── Clojure-subset evaluator + stepper (COMP 348) ─────────────────────────────
   Pure core (no DOM): CLJ.run(code, opts) → { trace, out, error, results }.
   UI: CLJ.mount(id, cfg) builds the stepper inside #sim-<id>; cfg = { code, repl?, maxSteps? }.
   The evaluator is written as generators, so every reduction can be a step: the form about to be
   evaluated is highlighted and, once evaluated, replaced by its value in the view. Each function
   call gets a frame with its bindings. Futures and agents run as threads under a deterministic
   round-robin scheduler with a virtual clock (Thread/sleep), so swap! retries and STM transaction
   retries really happen when threads interleave. Values follow Clojure: longs (overflow is an
   error), doubles printed as Java prints them, ratios, strings, characters, keywords, symbols,
   persistent lists, vectors, maps (array maps up to 8 entries, then hash maps in Clojure's hash
   order) and sets (hash order), lazy sequences (range, map, filter, iterate, repeat …). */
(function () {
  'use strict';
  const CLJ = {};

  /* ════════════════════════════════════════════════════════════════
     1. Values
     ════════════════════════════════════════════════════════════════ */
  class Sym { constructor(name, ns, src) { this.name = name; this.ns = ns || null; this.src = src; } }
  const KWS = new Map();
  class Kw { constructor(name) { this.name = name; } }
  const kw = n => { let k = KWS.get(n); if (!k) { k = new Kw(n); KWS.set(n, k); } return k; };
  class Char { constructor(c) { this.c = c; } }
  class Ratio { constructor(n, d) { this.n = n; this.d = d; } }
  class CList { constructor(items, src) { this.items = items; this.src = src; } }
  class CVec { constructor(items, src) { this.items = items; this.src = src; } }
  class CMap { constructor(entries, hash, src) { this.entries = entries; this.hash = !!hash; this.src = src; } } // entries: [[k, v]]
  class CSet { constructor(items, src, sorted) { this.items = items; this.src = src; this.sorted = !!sorted; } }
  class Fn { constructor(name, arities, env, isMacro) { this.name = name; this.arities = arities; this.env = env; this.macro = isMacro; } }
  class Builtin { constructor(name, fn, gen) { this.name = name; this.fn = fn; this.gen = gen; } }
  class Var { constructor(ns, name, v) { this.ns = ns; this.name = name; this.v = v; this.private = false; } }
  class Atom { constructor(v) { this.v = v; this.version = 0; } }
  class Agent { constructor(v) { this.v = v; this.queue = []; this.thread = null; } }
  class Ref { constructor(v) { this.v = v; this.version = 0; } }
  class Future { constructor() { this.done = false; this.v = null; this.thread = null; } }
  class Lazy { constructor(gen) { this.gen = gen; this.realized = false; this.cell = null; } } // cell: null (empty) or [first, restSeq]
  class Cons { constructor(first, rest) { this.first = first; this.rest = rest; } }          // rest: any seqable
  class Recur { constructor(args) { this.args = args; } }
  class CljError extends Error { constructor(cls, msg, compile) { super(msg); this.cls = cls; this.compile = !!compile; } }
  const err = (cls, msg) => new CljError(cls, msg);
  const isInt = x => typeof x === 'bigint';
  const isNum = x => typeof x === 'bigint' || typeof x === 'number' || x instanceof Ratio;
  const isSeqColl = x => x instanceof CList || x instanceof CVec || x instanceof Lazy || x instanceof Cons;

  /* ── Clojure's hashing (Murmur3), for the iteration order of hash maps and sets ── */
  const imul = Math.imul;
  const rotl = (x, r) => (x << r) | (x >>> (32 - r));
  const mixK1 = k => imul(rotl(imul(k, 0xcc9e2d51), 15), 0x1b873593);
  const mixH1 = (h, k) => (imul(rotl(h ^ k, 13), 5) + 0xe6546b64) | 0;
  const fmix = (h, len) => { h ^= len; h ^= h >>> 16; h = imul(h, 0x85ebca6b); h ^= h >>> 13; h = imul(h, 0xc2b2ae35); h ^= h >>> 16; return h | 0; };
  const hashInt = i => (i === 0 ? 0 : fmix(mixH1(0, mixK1(i)), 4));
  const hashLong = v => { if (v === 0n) return 0; const low = Number(BigInt.asIntN(32, v)), high = Number(BigInt.asIntN(32, v >> 32n)); let h = mixH1(0, mixK1(low)); h = mixH1(h, mixK1(high)); return fmix(h, 8); };
  const hashChars = s => { let h = 0; for (let i = 1; i < s.length; i += 2) h = mixH1(h, mixK1(s.charCodeAt(i - 1) | (s.charCodeAt(i) << 16))); if (s.length & 1) h ^= mixK1(s.charCodeAt(s.length - 1)); return fmix(h, 2 * s.length); };
  const javaStrHash = s => { let h = 0; for (let i = 0; i < s.length; i++) h = (imul(h, 31) + s.charCodeAt(i)) | 0; return h; };
  const hashCombine = (seed, h) => (seed ^ (h + 0x9e3779b9 + (seed << 6) + (seed >> 2))) | 0;
  function hasheq(x) {
    if (x === null || x === undefined) return 0;
    if (isInt(x)) return hashLong(x);
    if (typeof x === 'number') { if (Number.isInteger(x) && Math.abs(x) < 2 ** 53) { /* Java Double.hashCode */ } const b = new DataView(new ArrayBuffer(8)); b.setFloat64(0, x === 0 ? 0 : x); return (b.getInt32(0) ^ b.getInt32(4)) | 0; }
    if (typeof x === 'string') return hashInt(javaStrHash(x));
    if (typeof x === 'boolean') return x ? 1231 : 1237;
    if (x instanceof Kw) return (hashCombine(hashChars(x.name), 0) + 0x9e3779b9) | 0;
    if (x instanceof Sym) return hashCombine(hashChars(x.name), x.ns ? javaStrHash(x.ns) : 0);
    if (x instanceof Char) return x.c.charCodeAt(0);
    if (x instanceof Ratio) return (hashLong(x.n) ^ hashLong(x.d)) | 0;
    if (x instanceof CVec || x instanceof CList || x instanceof Lazy || x instanceof Cons) { let h = 1, n = 0; for (const y of realizeSync(x)) { h = (imul(31, h) + hasheq(y)) | 0; n++; } return fmix(mixH1(0, mixK1(h)), n); }
    if (x instanceof CMap) { let h = 0; for (const [k, v] of x.entries) h = (h + ((imul(31, 1) + hasheq(k)) * 31 + hasheq(v))) | 0; h = 0; for (const [k, v] of x.entries) { let e = 1; e = (imul(31, e) + hasheq(k)) | 0; e = (imul(31, e) + hasheq(v)) | 0; h = (h + fmix(mixH1(0, mixK1(e)), 2)) | 0; } return fmix(mixH1(0, mixK1(h)), x.entries.length); }
    if (x instanceof CSet) { let h = 0; for (const y of x.items) h = (h + hasheq(y)) | 0; return fmix(mixH1(0, mixK1(h)), x.items.length); }
    return 0;
  }
  // order of a PersistentHashMap / Set: by 5-bit chunks of the hash, lowest chunk first
  function hashOrder(items, keyOf) {
    const withH = items.map((it, i) => ({ it, i, h: hasheq(keyOf(it)) >>> 0 }));
    withH.sort((a, b) => { for (let s = 0; s < 32; s += 5) { const x = (a.h >>> s) & 31, y = (b.h >>> s) & 31; if (x !== y) return x - y; } return a.i - b.i; });
    return withH.map(w => w.it);
  }
  const mkSet = (items, sorted) => { const out = []; for (const x of items) if (!out.some(y => equals(x, y))) out.push(x); return new CSet(sorted ? out.sort(compare) : hashOrder(out, x => x), null, sorted); };
  // array maps keep insertion order up to 8 entries; beyond, or when built by hash-map, hash order
  function mapWith(m, k, v) {
    const entries = m.entries.slice();
    const i = entries.findIndex(e => equals(e[0], k));
    if (i >= 0) { entries[i] = [entries[i][0], v]; return new CMap(entries, m.hash); }
    entries.push([k, v]);
    const hash = m.hash || entries.length > 8;
    return new CMap(hash ? hashOrder(entries, e => e[0]) : entries, hash);
  }
  function mapWithout(m, k) { return new CMap(m.entries.filter(e => !equals(e[0], k)), m.hash); }
  const mapGet = (m, k) => { const e = m.entries.find(e => equals(e[0], k)); return e ? e[1] : undefined; };

  /* ── equality and ordering ── */
  function equals(a, b) {
    if (a === b) return true;
    if (a === null || b === null || a === undefined || b === undefined) return a == b; // eslint-disable-line eqeqeq
    if (isInt(a) && isInt(b)) return a === b;
    if (isNum(a) && isNum(b)) { if (typeof a === 'number' || typeof b === 'number') return (typeof a === 'number') === (typeof b === 'number') && toNum(a) === toNum(b); return a instanceof Ratio && b instanceof Ratio && a.n === b.n && a.d === b.d; }
    if (a instanceof Char && b instanceof Char) return a.c === b.c;
    if (a instanceof Sym && b instanceof Sym) return a.name === b.name && a.ns === b.ns;
    if (isSeqColl(a) && isSeqColl(b)) { if ((a instanceof CVec) !== (b instanceof CVec) && !(a instanceof CVec || b instanceof CVec) === false) { /* vector equals list with same items */ } const x = realizeSync(a), y = realizeSync(b); return x.length === y.length && x.every((v, i) => equals(v, y[i])); }
    if (a instanceof CMap && b instanceof CMap) return a.entries.length === b.entries.length && a.entries.every(([k, v]) => { const w = mapGet(b, k); return w !== undefined && equals(v, w); });
    if (a instanceof CSet && b instanceof CSet) return a.items.length === b.items.length && a.items.every(x => b.items.some(y => equals(x, y)));
    return false;
  }
  function toNum(x) { if (isInt(x)) return Number(x); if (x instanceof Ratio) return Number(x.n) / Number(x.d); return x; }
  function compare(a, b) {
    if (isNum(a) && isNum(b)) { if (isInt(a) && isInt(b)) return a < b ? -1 : a > b ? 1 : 0; const x = toNum(a), y = toNum(b); return x < y ? -1 : x > y ? 1 : 0; }
    if (typeof a === 'string' && typeof b === 'string') { const n = Math.min(a.length, b.length); for (let i = 0; i < n; i++) if (a.charCodeAt(i) !== b.charCodeAt(i)) return a.charCodeAt(i) - b.charCodeAt(i); return a.length - b.length; }
    if (a instanceof Kw && b instanceof Kw) return compare(a.name, b.name);
    if (a instanceof Char && b instanceof Char) return a.c.charCodeAt(0) - b.c.charCodeAt(0);
    if (a instanceof CVec && b instanceof CVec) { if (a.items.length !== b.items.length) return a.items.length - b.items.length; for (let i = 0; i < a.items.length; i++) { const c = compare(a.items[i], b.items[i]); if (c) return c; } return 0; }
    if (typeof a === 'boolean' && typeof b === 'boolean') return (a ? 1 : 0) - (b ? 1 : 0);
    if (a === null && b === null) return 0;
    if (a === null) return -1; if (b === null) return 1;
    throw err('ClassCastException', `class ${className(a)} cannot be cast to class java.lang.Comparable`);
  }
  function className(x) {
    if (x === null || x === undefined) return 'nil';
    if (isInt(x)) return 'java.lang.Long'; if (typeof x === 'number') return 'java.lang.Double'; if (x instanceof Ratio) return 'clojure.lang.Ratio';
    if (typeof x === 'string') return 'java.lang.String'; if (typeof x === 'boolean') return 'java.lang.Boolean';
    if (x instanceof Kw) return 'clojure.lang.Keyword'; if (x instanceof Sym) return 'clojure.lang.Symbol'; if (x instanceof Char) return 'java.lang.Character';
    if (x instanceof CList) return 'clojure.lang.PersistentList'; if (x instanceof CVec) return 'clojure.lang.PersistentVector';
    if (x instanceof CMap) return x.hash ? 'clojure.lang.PersistentHashMap' : 'clojure.lang.PersistentArrayMap'; if (x instanceof CSet) return x.sorted ? 'clojure.lang.PersistentTreeSet' : 'clojure.lang.PersistentHashSet';
    if (x instanceof Lazy) return 'clojure.lang.LazySeq'; if (x instanceof Cons) return 'clojure.lang.Cons';
    if (x instanceof Fn || x instanceof Builtin) return 'clojure.lang.IFn';
    if (x instanceof Atom) return 'clojure.lang.Atom'; if (x instanceof Agent) return 'clojure.lang.Agent'; if (x instanceof Ref) return 'clojure.lang.Ref';
    return 'java.lang.Object';
  }

  /* ── number formatting: Java's Double.toString ── */
  function dbl(x) {
    if (Number.isNaN(x)) return 'NaN';
    if (!Number.isFinite(x)) return x > 0 ? 'Infinity' : '-Infinity';
    if (x === 0) return Object.is(x, -0) ? '-0.0' : '0.0';
    const a = Math.abs(x);
    const m = /^(-?)(\d)(?:\.(\d+))?e([-+]\d+)$/.exec(x.toExponential());
    const sign = m[1], digits = m[2] + (m[3] || ''), exp = +m[4];
    if (a >= 1e-3 && a < 1e7) {
      let s;
      if (exp >= 0) { const ip = digits.slice(0, exp + 1).padEnd(exp + 1, '0'); const fp = digits.slice(exp + 1); s = ip + '.' + (fp || '0'); }
      else s = '0.' + '0'.repeat(-exp - 1) + digits;
      return sign + s;
    }
    return sign + digits[0] + '.' + (digits.slice(1) || '0') + 'E' + exp;
  }
  const bigGcd = (a, b) => { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) [a, b] = [b, a % b]; return a; };
  function ratio(n, d) {
    if (d === 0n) throw err('ArithmeticException', 'Divide by zero');
    if (d < 0n) { n = -n; d = -d; }
    const g = bigGcd(n, d); n /= g; d /= g;
    return d === 1n ? n : new Ratio(n, d);
  }

  /* ── printing ── */
  function pr(x, readably = true, depth = 0) {
    if (depth > 30) return '…';
    if (x === null || x === undefined) return 'nil';
    if (x === true) return 'true'; if (x === false) return 'false';
    if (isInt(x)) return x.toString();
    if (typeof x === 'number') return dbl(x);
    if (x instanceof Ratio) return x.n + '/' + x.d;
    if (typeof x === 'string') return readably ? '"' + x.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\t/g, '\\t') + '"' : x;
    if (x instanceof Char) return readably ? '\\' + ({ ' ': 'space', '\n': 'newline', '\t': 'tab' }[x.c] || x.c) : x.c;
    if (x instanceof Kw) return ':' + x.name;
    if (x instanceof Sym) return (x.ns ? x.ns + '/' : '') + x.name;
    if (x instanceof CVec) return '[' + x.items.map(y => pr(y, readably, depth + 1)).join(' ') + ']';
    if (x instanceof CList) return '(' + x.items.map(y => pr(y, readably, depth + 1)).join(' ') + ')';
    if (x instanceof Lazy || x instanceof Cons) { const items = realizeSync(x, 10000); return '(' + items.map(y => pr(y, readably, depth + 1)).join(' ') + ')'; }
    if (x instanceof CMap) return '{' + x.entries.map(([k, v]) => pr(k, readably, depth + 1) + ' ' + pr(v, readably, depth + 1)).join(', ') + '}';
    if (x instanceof CSet) return '#{' + x.items.map(y => pr(y, readably, depth + 1)).join(' ') + '}';
    if (x instanceof Fn) return `#object[user$${(x.name || 'fn').replace(/-/g, '_')}]`;
    if (x instanceof Builtin) return `#object[clojure.core$${x.name.replace(/-/g, '_')}]`;
    if (x instanceof Var) return `#'${x.ns}/${x.name}`;
    if (x instanceof Atom) return `#object[clojure.lang.Atom {:status :ready, :val ${pr(x.v, true, depth + 1)}}]`;
    if (x instanceof Ref) return `#object[clojure.lang.Ref {:status :ready, :val ${pr(x.v, true, depth + 1)}}]`;
    if (x instanceof Agent) return `#object[clojure.lang.Agent {:status :ready, :val ${pr(x.v, true, depth + 1)}}]`;
    if (x instanceof Future) return `#object[clojure.core$future_call {:status ${x.done ? ':ready' : ':pending'}, :val ${x.done ? pr(x.v, true, depth + 1) : 'nil'}}]`;
    return String(x);
  }
  // printing for the step view: never realizes anything; unrealized parts of lazy sequences show as …
  function prView(x, depth = 0) {
    if (depth > 6) return '…';
    if (x instanceof Lazy || x instanceof Cons) {
      const out = []; let s = x;
      for (let k = 0; k < 30; k++) {
        if (s === null || s === undefined) return '(' + out.join(' ') + ')';
        if (s instanceof Cons) { out.push(prView(s.first, depth + 1)); s = s.rest; continue; }
        if (s instanceof Lazy) { if (!s.realized) { out.push('…'); return '(' + out.join(' ') + ')'; } if (!s.cell) return '(' + out.join(' ') + ')'; out.push(prView(s.cell[0], depth + 1)); s = s.cell[1]; continue; }
        if (s instanceof CList || s instanceof CVec) { out.push(...s.items.map(y => prView(y, depth + 1))); return '(' + out.join(' ') + ')'; }
        out.push('…'); break;
      }
      return '(' + out.join(' ') + ' …)';
    }
    if (x instanceof CVec) return '[' + x.items.map(y => prView(y, depth + 1)).join(' ') + ']';
    if (x instanceof CList) return '(' + x.items.map(y => prView(y, depth + 1)).join(' ') + ')';
    if (x instanceof CMap) return '{' + x.entries.map(([k, v]) => prView(k, depth + 1) + ' ' + prView(v, depth + 1)).join(', ') + '}';
    if (x instanceof CSet) return '#{' + x.items.map(y => prView(y, depth + 1)).join(' ') + '}';
    if (x instanceof Atom || x instanceof Ref || x instanceof Agent) return x.constructor.name.toLowerCase() + ' ' + prView(x.v, depth + 1);
    return pr(x);
  }
  // realize a sequence without stepping (for printing, hashing, equality): lazy cells must already
  // have been realized by the stepping evaluator, or are realized here synchronously
  function realizeSync(x, limit = 1e6) {
    const out = [];
    let s = x;
    for (;;) {
      if (s === null || s === undefined) return out;
      if (s instanceof CVec || s instanceof CList) { out.push(...s.items); return out; }
      if (s instanceof CSet) { out.push(...s.items); return out; }
      if (s instanceof CMap) { out.push(...s.entries.map(e => new CVec(e))); return out; }
      if (typeof s === 'string') { out.push(...[...s].map(c => new Char(c))); return out; }
      if (s instanceof Cons) { out.push(s.first); s = s.rest; }
      else if (s instanceof Lazy) { const cell = forceSync(s); if (!cell) return out; out.push(cell[0]); s = cell[1]; }
      else throw err('IllegalArgumentException', `Don't know how to create ISeq from: ${className(s)}`);
      if (out.length > limit) throw err('OutOfMemoryError', 'an infinite sequence was realized (use take)');
    }
  }
  function forceSync(l) {
    if (l.realized) return l.cell;
    const g = l.gen(); let r;
    for (;;) { r = g.next(); if (r.done) break; }
    l.cell = r.value; l.realized = true;
    return l.cell;
  }

  /* ════════════════════════════════════════════════════════════════
     2. Reader
     ════════════════════════════════════════════════════════════════ */
  function read(src) {
    let i = 0, line = 1;
    const forms = [];
    const ws = () => { for (;;) { const c = src[i]; if (c === undefined) return; if (c === '\n') { line++; i++; } else if (c === ' ' || c === '\t' || c === '\r' || c === ',') i++; else if (c === ';') { while (i < src.length && src[i] !== '\n') i++; } else if (c === '#' && src[i + 1] === '_') { i += 2; one(); } else return; } };
    const DELIM = /[\s,()[\]{}"';@^`~]/;
    function one() {
      ws();
      const start = i, startLine = line;
      const c = src[i];
      if (c === undefined) throw new CljError('RuntimeException', 'EOF while reading', true);
      const mk = (form) => { if (form && typeof form === 'object' && !(form instanceof Kw)) form.src = { start, end: i, line: startLine }; return form; };
      if (c === '(' || c === '[' || c === '{') {
        const close = { '(': ')', '[': ']', '{': '}' }[c]; i++;
        const items = [];
        for (;;) { ws(); if (i >= src.length) throw new CljError('RuntimeException', 'EOF while reading, starting at line ' + startLine, true); if (src[i] === close) { i++; break; } if (')]}'.includes(src[i])) throw new CljError('RuntimeException', `Unmatched delimiter: ${src[i]}`, true); items.push(one()); }
        if (c === '(') return mk(new CList(items));
        if (c === '[') return mk(new CVec(items));
        if (items.length % 2) throw new CljError('RuntimeException', 'Map literal must contain an even number of forms', true);
        const m = new CList(items); m.mapLiteral = true; return mk(m);
      }
      if (')]}'.includes(c)) { i++; throw new CljError('RuntimeException', `Unmatched delimiter: ${c}`, true); }
      if (c === '#' && src[i + 1] === '{') {
        i += 2; const items = [];
        for (;;) { ws(); if (i >= src.length) throw new CljError('RuntimeException', 'EOF while reading', true); if (src[i] === '}') { i++; break; } items.push(one()); }
        const m = new CList(items); m.setLiteral = true; return mk(m);
      }
      if (c === '#' && src[i + 1] === '(') { i++; const body = one(); const f = new CList([new Sym('fn*'), body]); f.anon = true; return mk(f); }
      if (c === "'") { i++; return mk(new CList([new Sym('quote'), one()])); }
      if (c === '@') { i++; return mk(new CList([new Sym('deref'), one()])); }
      if (c === '^') { i++; one(); return one(); } // metadata: read and drop (^:private is handled by defn-)
      if (c === '#' && src[i + 1] === "'") { i += 2; return mk(new CList([new Sym('var'), one()])); }
      if (c === '"') {
        i++; let s = '';
        while (src[i] !== '"') { if (i >= src.length) throw new CljError('RuntimeException', 'EOF while reading string', true); if (src[i] === '\\') { const e = src[i + 1]; s += { n: '\n', t: '\t', r: '\r', '"': '"', '\\': '\\' }[e] ?? e; i += 2; continue; } if (src[i] === '\n') line++; s += src[i++]; }
        i++; return s;
      }
      if (c === '\\') {
        i++; let j = i + 1; while (j < src.length && !DELIM.test(src[j])) j++;
        const t = src.slice(i, j); i = j;
        const named = { space: ' ', newline: '\n', tab: '\t', return: '\r' };
        return new Char(named[t] || t);
      }
      let j = i; while (j < src.length && !DELIM.test(src[j])) j++;
      const tok = src.slice(i, j); i = j;
      if (/^[-+]?\d+N?$/.test(tok)) return BigInt(tok.replace(/N$/, ''));
      if (/^[-+]?\d+\/\d+$/.test(tok)) { const [a, b] = tok.split('/'); return ratio(BigInt(a), BigInt(b)); }
      if (/^[-+]?(\d+\.\d*|\d*\.\d+|\d+)([eE][-+]?\d+)?M?$/.test(tok)) return parseFloat(tok);
      if (tok === 'nil') return null; if (tok === 'true') return true; if (tok === 'false') return false;
      if (tok[0] === ':') return kw(tok.replace(/^::?/, ''));
      const slash = tok.indexOf('/');
      const s = slash > 0 && tok.length > 1 ? new Sym(tok.slice(slash + 1), tok.slice(0, slash)) : new Sym(tok);
      return mk(s);
    }
    for (;;) { ws(); if (i >= src.length) break; forms.push(one()); }
    return forms;
  }

  /* ════════════════════════════════════════════════════════════════
     3. Evaluator (generators), threads and the scheduler
     ════════════════════════════════════════════════════════════════ */
  class Env { constructor(parent, vars) { this.parent = parent; this.vars = vars || new Map(); } get(n) { for (let e = this; e; e = e.parent) if (e.vars.has(n)) return { found: true, v: e.vars.get(n) }; return { found: false }; } }
  const SPECIAL = new Set(['def', 'defn', 'defn-', 'defmacro', 'fn', 'fn*', 'let', 'if', 'do', 'when', 'when-not', 'if-not', 'cond', 'and', 'or', 'quote', 'loop', 'recur', 'ns', 'require', 'import', 'comment', 'doseq', 'dotimes', 'dosync', 'future', 'var', 'try', 'throw', '->', '->>', 'time', 'letfn', 'case', 'condp', 'when-let', 'if-let', 'for']);
  const STEP = Symbol('step');

  class Interp {
    constructor(opts) {
      this.opts = opts;
      this.out = ''; this.trace = []; this.steps = 0; this.maxSteps = opts.maxSteps || 4000;
      this.ns = 'user'; this.vars = new Map(); // "ns/name" -> Var
      this.threads = []; this.clock = 0; this.txCounter = 0; this.nextThreadId = 1;
      this.core = makeCore(this);
      this.results = [];
    }
    lookupVar(sym) {
      const ns = sym.ns === 'str' || sym.ns === 'clojure.string' ? 'clojure.string' : sym.ns === 'Thread' || sym.ns === 'Math' ? sym.ns : sym.ns;
      if (ns) { const k = ns + '/' + sym.name; if (this.core.has(k)) return this.core.get(k); const v = this.vars.get(this.aliasNs(ns) + '/' + sym.name); if (v) return v.v; return undefined; }
      const v = this.vars.get(this.ns + '/' + sym.name); if (v) return v.v;
      if (this.core.has(sym.name)) return this.core.get(sym.name);
      return undefined;
    }
    aliasNs(ns) { return (this.aliases && this.aliases.get(ns)) || ns; }

    /* ── stepping: every yield from the evaluator is one step for the current thread ── */
    *step(th, kind, info) { yield { th, kind, info }; }

    *ev(form, env, act) {
      // symbols and literals
      if (form instanceof Sym) {
        const v = this.resolve(form, env);
        if (act && form.src) act.done.set(form, v);
        return v;
      }
      if (form instanceof CVec) { const items = []; for (const f of form.items) items.push(yield* this.ev(f, env, act)); const v = new CVec(items); if (act && form.src) act.done.set(form, v); return v; }
      if (!(form instanceof CList)) return form;
      if (form.mapLiteral) { let m = new CMap([], false); for (let k = 0; k < form.items.length; k += 2) m = mapWith(m, yield* this.ev(form.items[k], env, act), yield* this.ev(form.items[k + 1], env, act)); if (form.items.length / 2 > 8) m = new CMap(hashOrder(m.entries, e => e[0]), true); if (act) act.done.set(form, m); return m; }
      if (form.setLiteral) { const items = []; for (const f of form.items) items.push(yield* this.ev(f, env, act)); const s = mkSet(items); if (s.items.length !== items.length) throw new CljError('IllegalArgumentException', 'Duplicate key: ' + pr(items.find((x, k) => items.findIndex(y => equals(x, y)) !== k))); if (act) act.done.set(form, s); return s; }
      if (!form.items.length) return new CList([]);
      const head = form.items[0];
      if (head instanceof Sym && !head.ns && SPECIAL.has(head.name) && !env.get(head.name).found) {
        const v = yield* this.special(head.name, form, env, act);
        if (act && !['def', 'defn', 'defn-', 'ns', 'require'].includes(head.name)) act.done.set(form, v);
        return v;
      }
      // macros defined with defmacro
      if (head instanceof Sym) {
        const m = this.resolveMaybe(head, env);
        if (m instanceof Fn && m.macro) {
          const expansion = yield* this.apply(m, form.items.slice(1), form, act, true);
          const v = yield* this.ev(expansion, env, act);
          if (act) act.done.set(form, v);
          return v;
        }
      }
      if (act) { act.cur = form; yield* this.step(this.cur, 'eval', form); }
      const f = yield* this.ev(head, env, act);
      const args = [];
      for (const a of form.items.slice(1)) args.push(yield* this.ev(a, env, act));
      if (act) act.cur = form;
      const v = yield* this.apply(f, args, form, act);
      if (act) { act.done.set(form, v); act.cur = null; yield* this.step(this.cur, 'value', form); }
      return v;
    }
    resolve(sym, env) {
      if (!sym.ns) { const l = env.get(sym.name); if (l.found) return l.v; }
      const v = this.lookupVar(sym);
      if (v === undefined) {
        if (sym.ns && /^[A-Z]/.test(sym.ns)) throw new CljError('RuntimeException', `No such namespace: ${sym.ns}`, true);
        throw new CljError('RuntimeException', `Unable to resolve symbol: ${sym.ns ? sym.ns + '/' : ''}${sym.name} in this context`, true);
      }
      return v;
    }
    resolveMaybe(sym, env) { try { return this.resolve(sym, env); } catch (_) { return undefined; } }

    *apply(f, args, form, act, macro) {
      if (f instanceof Builtin) {
        if (f.gen) return yield* f.fn.call(this, args, form);
        return f.fn.call(this, args, form);
      }
      if (f instanceof Fn) return yield* this.callFn(f, args, form, macro);
      if (f instanceof Kw) { const m = args[0]; if (m instanceof CMap) { const v = mapGet(m, f); return v === undefined ? (args.length > 1 ? args[1] : null) : v; } if (m instanceof CSet) return m.items.some(x => equals(x, f)) ? f : (args[1] ?? null); return args.length > 1 ? args[1] : null; }
      if (f instanceof CMap) { const v = mapGet(f, args[0]); return v === undefined ? (args.length > 1 ? args[1] : null) : v; }
      if (f instanceof CSet) return f.items.find(x => equals(x, args[0])) ?? null;
      if (f instanceof CVec) { const i = args[0]; if (!isInt(i) || i < 0n || i >= BigInt(f.items.length)) throw err('IndexOutOfBoundsException', null); return f.items[Number(i)]; }
      throw err('ClassCastException', `class ${className(f)} cannot be cast to class clojure.lang.IFn`);
    }
    pickArity(f, n) {
      const exact = f.arities.find(a => !a.rest && a.params.length === n);
      if (exact) return exact;
      const v = f.arities.find(a => a.rest && n >= a.params.length);
      if (v) return v;
      throw err('ArityException', `Wrong number of args (${n}) passed to: ${f.name ? 'user/' + f.name : 'user/eval-fn'}`);
    }
    *callFn(f, args, form, macro) {
      let ar = this.pickArity(f, args.length);
      const th = this.cur;
      if (th.frames.length > 400) throw err('StackOverflowError', null);
      for (;;) {
        const vars = new Map();
        ar.params.forEach((p, k) => this.bindPattern(p, args[k], vars));
        if (ar.rest) this.bindPattern(ar.rest, args.length > ar.params.length ? new CList(args.slice(ar.params.length)) : null, vars);
        const env = new Env(f.env, vars);
        if (f.name) vars.set(f.name, f);
        if (f.anonPercent && vars.has('%1')) vars.set('%', vars.get('%1'));
        const act = { name: f.name || 'fn', vars, body: ar.body, done: new Map(), cur: null, fn: f, form };
        th.frames.push(act);
        let v = null, recur = null;
        try {
          if (!macro) yield* this.step(th, 'call', form);
          for (let k = 0; k < ar.body.length; k++) {
            v = yield* this.ev(ar.body[k], env, act);
            if (v instanceof Recur) { recur = v; break; }
          }
        } finally { th.frames.pop(); }
        if (recur) {
          args = recur.args;
          if (args.length !== ar.params.length + (ar.rest ? 1 : 0) && !ar.rest) throw new CljError('IllegalArgumentException', `Mismatched argument count to recur, expected: ${ar.params.length} args, got: ${args.length}`, true);
          if (ar.rest) args = args.slice(0, ar.params.length).concat(args[ar.params.length] ? realizeSync(args[ar.params.length]) : []);
          continue;
        }
        return v;
      }
    }
    // destructuring: symbols, [a b & rest] vectors, {:keys [a b]} maps
    bindPattern(p, v, vars) {
      if (p instanceof Sym) { vars.set(p.name, v); return; }
      if (p instanceof CVec) {
        const items = v === null ? [] : realizeSync(v);
        for (let k = 0; k < p.items.length; k++) {
          const q = p.items[k];
          if (q instanceof Sym && q.name === '&') { this.bindPattern(p.items[k + 1], items.length > k ? new CList(items.slice(k)) : null, vars); return; }
          if (q instanceof Kw && q.name === 'as') { this.bindPattern(p.items[k + 1], v, vars); return; }
          this.bindPattern(q, items[k] === undefined ? null : items[k], vars);
        }
        return;
      }
      if (p instanceof CList && p.mapLiteral) {
        for (let k = 0; k < p.items.length; k += 2) {
          const key = p.items[k], val = p.items[k + 1];
          if (key instanceof Kw && key.name === 'keys') for (const s of val.items) vars.set(s.name, v instanceof CMap ? (mapGet(v, kw(s.name)) ?? null) : null);
          else if (key instanceof Kw && key.name === 'as') vars.set(val.name, v);
          else if (key instanceof Sym) vars.set(key.name, v instanceof CMap ? (mapGet(v, val) ?? null) : null);
        }
        return;
      }
      throw new CljError('IllegalArgumentException', 'Unsupported binding form: ' + pr(p), true);
    }
    makeFn(name, specs, env, isMacro) {
      // specs: [params-vector body...] or ([params] body...)+
      const arities = [];
      const one = (params, body) => {
        if (!(params instanceof CVec)) throw new CljError('IllegalArgumentException', 'Parameter declaration missing', true);
        const amp = params.items.findIndex(x => x instanceof Sym && x.name === '&');
        arities.push({ params: amp >= 0 ? params.items.slice(0, amp) : params.items, rest: amp >= 0 ? params.items[amp + 1] : null, body });
      };
      if (specs[0] instanceof CVec) one(specs[0], specs.slice(1));
      else for (const s of specs) { if (!(s instanceof CList)) throw new CljError('IllegalArgumentException', 'Parameter declaration missing', true); one(s.items[0], s.items.slice(1)); }
      return new Fn(name, arities, env, isMacro);
    }
    defVar(name, v, priv) {
      const key = this.ns + '/' + name;
      let vr = this.vars.get(key);
      if (!vr) { vr = new Var(this.ns, name, v); this.vars.set(key, vr); } else vr.v = v;
      vr.private = !!priv;
      return vr;
    }

    *special(name, form, env, act) {
      const it = form.items;
      const evBody = function* (self, forms, e) { let v = null; for (const f of forms) { v = yield* self.ev(f, e, act); if (v instanceof Recur) return v; } return v; };
      switch (name) {
        case 'quote': return it[1];
        case 'var': { const v = this.vars.get(this.ns + '/' + it[1].name); if (!v) throw new CljError('RuntimeException', `Unable to resolve var: ${it[1].name} in this context`, true); return v; }
        case 'do': return yield* evBody(this, it.slice(1), env);
        case 'def': {
          if (!(it[1] instanceof Sym)) throw new CljError('RuntimeException', 'First argument to def must be a Symbol', true);
          if (act) { act.cur = form; yield* this.step(this.cur, 'eval', form); }
          const vr = this.defVar(it[1].name, null);
          vr.v = it.length > 2 ? yield* this.ev(it[it.length - 1], env, act) : null;
          if (act) act.done.set(form, vr);
          return vr;
        }
        case 'defn': case 'defn-': case 'defmacro': {
          const nm = it[1].name;
          let rest = it.slice(2);
          let doc = null;
          if (typeof rest[0] === 'string') { doc = rest[0]; rest = rest.slice(1); }
          if (rest[0] instanceof CList && rest[0].mapLiteral) rest = rest.slice(1);
          const f = this.makeFn(nm, rest, env, name === 'defmacro');
          f.doc = doc;
          const vr = this.defVar(nm, f, name === 'defn-');
          if (act) { act.done.set(form, vr); yield* this.step(this.cur, 'value', form); }
          return vr;
        }
        case 'fn': case 'fn*': {
          if (form.anon) { // #( … % %1 %2 %& … )
            let max = 0, rest = false;
            const scan = x => { if (x instanceof Sym) { if (x.name === '%' || x.name === '%1') max = Math.max(max, 1); else if (/^%\d$/.test(x.name)) max = Math.max(max, +x.name[1]); else if (x.name === '%&') rest = true; } else if (x instanceof CList || x instanceof CVec) x.items.forEach(scan); };
            scan(it[1]);
            const params = []; for (let k = 1; k <= max; k++) params.push(new Sym('%' + k));
            if (rest) params.push(new Sym('&'), new Sym('%&'));
            const f = this.makeFn(null, [new CVec(params), it[1]], env);
            f.anonPercent = true;
            return f;
          }
          const nm = it[1] instanceof Sym ? it[1].name : null;
          return this.makeFn(nm, it.slice(nm ? 2 : 1), env);
        }
        case 'let': case 'loop': {
          const bindings = it[1];
          if (!(bindings instanceof CVec) || bindings.items.length % 2) throw new CljError('IllegalArgumentException', `${name} requires an even number of forms in binding vector`, true);
          const vars = new Map(); const e = new Env(env, vars);
          const names = [];
          for (let k = 0; k < bindings.items.length; k += 2) { const v = yield* this.ev(bindings.items[k + 1], e, act); this.bindPattern(bindings.items[k], v, vars); names.push(bindings.items[k]); }
          if (name === 'let') return yield* evBody(this, it.slice(2), e);
          for (;;) {
            if (act) for (const f of it.slice(2)) this.clearDone(act, f);
            const v = yield* evBody(this, it.slice(2), e);
            if (!(v instanceof Recur)) return v;
            if (v.args.length !== names.length) throw new CljError('IllegalArgumentException', `Mismatched argument count to recur, expected: ${names.length} args, got: ${v.args.length}`, true);
            names.forEach((n, k) => this.bindPattern(n, v.args[k], vars));
            yield* this.step(this.cur, 'recur', form);
          }
        }
        case 'recur': { const args = []; for (const a of it.slice(1)) args.push(yield* this.ev(a, env, act)); return new Recur(args); }
        case 'if': case 'if-not': {
          if (it.length < 3 || it.length > 4) throw new CljError('RuntimeException', it.length < 3 ? 'Too few arguments to if' : 'Too many arguments to if', true);
          let c = truthy(yield* this.ev(it[1], env, act)); if (name === 'if-not') c = !c;
          return c ? yield* this.ev(it[2], env, act) : it.length > 3 ? yield* this.ev(it[3], env, act) : null;
        }
        case 'when': case 'when-not': { let c = truthy(yield* this.ev(it[1], env, act)); if (name === 'when-not') c = !c; return c ? yield* evBody(this, it.slice(2), env) : null; }
        case 'when-let': case 'if-let': {
          const b = it[1]; const v = yield* this.ev(b.items[1], env, act);
          if (!truthy(v)) return name === 'if-let' && it.length > 3 ? yield* this.ev(it[3], env, act) : null;
          const vars = new Map(); this.bindPattern(b.items[0], v, vars);
          return name === 'if-let' ? yield* this.ev(it[2], new Env(env, vars), act) : yield* evBody(this, it.slice(2), new Env(env, vars));
        }
        case 'cond': { for (let k = 1; k < it.length; k += 2) { const t = it[k]; if ((t instanceof Kw && t.name === 'else') || truthy(yield* this.ev(t, env, act))) return yield* this.ev(it[k + 1], env, act); } return null; }
        case 'case': {
          const v = yield* this.ev(it[1], env, act);
          for (let k = 2; k + 1 < it.length; k += 2) { const t = it[k]; const hit = t instanceof CList && !t.mapLiteral && !t.setLiteral ? t.items.some(x => equals(x, v)) : equals(t, v); if (hit) return yield* this.ev(it[k + 1], env, act); }
          if ((it.length - 2) % 2 === 1) return yield* this.ev(it[it.length - 1], env, act);
          throw err('IllegalArgumentException', 'No matching clause: ' + pr(v));
        }
        case 'condp': {
          const pred = yield* this.ev(it[1], env, act), expr = yield* this.ev(it[2], env, act);
          for (let k = 3; k + 1 < it.length; k += 2) { const t = yield* this.ev(it[k], env, act); if (truthy(yield* this.apply(pred, [t, expr], form, act))) return yield* this.ev(it[k + 1], env, act); }
          if ((it.length - 3) % 2 === 1) return yield* this.ev(it[it.length - 1], env, act);
          throw err('IllegalArgumentException', 'No matching clause: ' + pr(expr));
        }
        case 'and': { let v = true; for (const f of it.slice(1)) { v = yield* this.ev(f, env, act); if (!truthy(v)) return v; } return v; }
        case 'or': { let v = null; for (const f of it.slice(1)) { v = yield* this.ev(f, env, act); if (truthy(v)) return v; } return v; }
        case 'ns': { this.ns = it[1].name; for (const clause of it.slice(2)) if (clause instanceof CList) this.nsClause(clause); return null; }
        case 'require': { for (const spec of it.slice(1)) this.requireSpec(spec instanceof CList && spec.items[0] instanceof Sym && spec.items[0].name === 'quote' ? spec.items[1] : spec); return null; }
        case 'import': return null;
        case 'comment': return null;
        case 'doseq': case 'for': {
          const b = it[1].items; const results = [];
          const walk = function* (self, k, e) {
            if (k >= b.length) { const v = yield* evBody(self, it.slice(2), e); if (name === 'for') results.push(v); return; }
            const key = b[k];
            if (key instanceof Kw) { if (key.name === 'when') { if (truthy(yield* self.ev(b[k + 1], e, act))) yield* walk(self, k + 2, e); return; } if (key.name === 'let') { const vars = new Map(); const e2 = new Env(e, vars); const lb = b[k + 1].items; for (let j = 0; j < lb.length; j += 2) self.bindPattern(lb[j], yield* self.ev(lb[j + 1], e2, act), vars); yield* walk(self, k + 2, e2); return; } if (key.name === 'while') { if (truthy(yield* self.ev(b[k + 1], e, act))) yield* walk(self, k + 2, e); return; } }
            const coll = yield* self.ev(b[k + 1], e, act);
            let s = coll;
            for (;;) {
              const cell = yield* self.seqCell(s); if (!cell) break;
              const vars = new Map(); self.bindPattern(key, cell[0], vars);
              if (act) for (const f of it.slice(2)) self.clearDone(act, f);
              yield* walk(self, k + 2, new Env(e, vars));
              s = cell[1];
            }
          };
          yield* walk(this, 0, env);
          return name === 'for' ? new CList(results) : null;
        }
        case 'dotimes': { const [s, nf] = it[1].items; const n = yield* this.ev(nf, env, act); for (let k = 0n; k < n; k++) { const vars = new Map([[s.name, k]]); if (act) for (const f of it.slice(2)) this.clearDone(act, f); yield* evBody(this, it.slice(2), new Env(env, vars)); } return null; }
        case 'time': { const t0 = this.clock; const v = yield* this.ev(it[1], env, act); this.emit(`"Elapsed time: ${(Math.max(1, this.clock - t0)).toFixed(1)} msecs"\n`); return v; }
        case '->': case '->>': {
          let x = it[1];
          for (const f of it.slice(2)) {
            const call = f instanceof CList ? f.items.slice() : [f];
            if (name === '->') call.splice(1, 0, x); else call.push(x);
            x = new CList(call); x.src = null;
          }
          return yield* this.ev(x, env, act);
        }
        case 'letfn': { const vars = new Map(); const e = new Env(env, vars); for (const spec of it[1].items) vars.set(spec.items[0].name, this.makeFn(spec.items[0].name, spec.items.slice(1), e)); return yield* evBody(this, it.slice(2), e); }
        case 'try': {
          const body = [], catches = []; let fin = null;
          for (const f of it.slice(1)) { if (f instanceof CList && f.items[0] instanceof Sym && f.items[0].name === 'catch') catches.push(f); else if (f instanceof CList && f.items[0] instanceof Sym && f.items[0].name === 'finally') fin = f; else body.push(f); }
          try { return yield* evBody(this, body, env); }
          catch (e) {
            if (!(e instanceof CljError) || e.compile) throw e;
            for (const c of catches) {
              const cls = c.items[1].name;
              if (cls === 'Exception' || cls === 'Throwable' || cls === 'RuntimeException' && e.cls !== 'StackOverflowError' || cls === e.cls || (cls === 'ArithmeticException' && e.cls === 'ArithmeticException') || (cls === 'clojure.lang.ExceptionInfo' && e.cls === 'ExceptionInfo')) {
                const vars = new Map([[c.items[2].name, e]]);
                return yield* evBody(this, c.items.slice(3), new Env(env, vars));
              }
            }
            throw e;
          } finally { if (fin) yield* evBody(this, fin.items.slice(1), env); }
        }
        case 'throw': { const v = yield* this.ev(it[1], env, act); if (v instanceof CljError) throw v; throw err('ClassCastException', 'cannot throw ' + className(v)); }
        case 'future': {
          const fut = new Future();
          const body = it.slice(1);
          const self = this;
          fut.thread = this.spawn('future', function* () { const act2 = { name: 'future', vars: new Map(), body, done: new Map(), cur: null, form }; self.cur.frames.push(act2); let v = null; for (const f of body) v = yield* self.ev(f, env, act2); fut.v = v; fut.done = true; return v; });
          return fut;
        }
        case 'dosync': return yield* this.dosync(it.slice(1), env, act);
      }
      throw new CljError('RuntimeException', 'unsupported special form ' + name, true);
    }
    clearDone(act, form) { if (!form || typeof form !== 'object') return; act.done.delete(form); if (form.items) for (const x of form.items) this.clearDone(act, x); }
    nsClause(clause) {
      const k = clause.items[0];
      if (k instanceof Kw && k.name === 'require') for (const spec of clause.items.slice(1)) this.requireSpec(spec);
    }
    requireSpec(spec) {
      if (spec instanceof CVec) {
        const lib = spec.items[0].name + (spec.items[0].ns ? '' : '');
        const full = spec.items[0].ns ? spec.items[0].ns + '/' + spec.items[0].name : spec.items[0].name;
        for (let k = 1; k < spec.items.length; k += 2) {
          const key = spec.items[k];
          if (key instanceof Kw && key.name === 'as') { (this.aliases = this.aliases || new Map()).set(spec.items[k + 1].name, full === 'clojure.string' ? 'clojure.string' : full); }
          if (key instanceof Kw && key.name === 'refer') { const names = spec.items[k + 1] instanceof CVec ? spec.items[k + 1].items.map(s => s.name) : [spec.items[k + 1].name]; for (const n of names) { const f = this.core.get(full + '/' + n); if (f) this.defVar(n, f); } }
        }
        void lib;
      }
    }

    /* ── sequences, stepping-aware ── */
    // returns null (empty) or [first, rest]
    *seqCell(s) {
      for (;;) {
        if (s === null || s === undefined) return null;
        if (s instanceof CVec || s instanceof CList) return s.items.length ? [s.items[0], s.items.length > 1 ? new CList(s.items.slice(1)) : null] : null;
        if (s instanceof Cons) return [s.first, s.rest];
        if (s instanceof Lazy) { if (!s.realized) { s.cell = yield* s.gen(); s.realized = true; } return s.cell; }
        if (s instanceof CSet) return s.items.length ? [s.items[0], s.items.length > 1 ? new CList(s.items.slice(1)) : null] : null;
        if (s instanceof CMap) return s.entries.length ? [new CVec(s.entries[0]), s.entries.length > 1 ? new CList(s.entries.slice(1).map(e => new CVec(e))) : null] : null;
        if (typeof s === 'string') return s.length ? [new Char(s[0]), s.length > 1 ? s.slice(1) : null] : null;
        throw err('IllegalArgumentException', `Don't know how to create ISeq from: ${className(s)}`);
      }
    }
    *toArray(s, limit = 200000) { const out = []; for (;;) { const c = yield* this.seqCell(s); if (!c) return out; out.push(c[0]); s = c[1]; if (out.length > limit) throw err('OutOfMemoryError', 'an infinite sequence was realized (use take)'); } }

    /* ── threads and the scheduler ── */
    spawn(name, genFn) {
      const th = { id: this.nextThreadId++, name, frames: [], gen: null, done: false, value: null, sleepUntil: 0, blockedOn: null };
      const self = this;
      th.gen = (function* () { th.value = yield* genFn(); th.done = true; })();
      void self;
      this.threads.push(th);
      return th;
    }
    emit(s) { this.out += s; }
    snap(ev) {
      if (++this.steps > this.maxSteps) throw err('StepLimit', `stopped after ${this.maxSteps} steps (an endless loop?)`);
      this.trace.push({ ...ev, outLen: this.out.length, view: this.view(ev) });
    }
    view(ev) {
      const renderAct = a => ({ name: a.name, vars: [...a.vars].filter(([n]) => !(a.fn && n === a.fn.name) && n !== '%').map(([n, v]) => [n, short(prView(v))]), expr: a.body ? a.body.map(b => this.renderForm(b, a)).join('\n') : '' });
      const threads = this.threads.filter(t => !t.done || t === ev.th).map(t => ({ id: t.id, name: t.name, status: t.done ? 'done' : t.blockedOn ? 'waiting' : t.sleepUntil > this.clock ? 'sleeping' : 'running', frames: t.frames.map(renderAct) }));
      const ids = [...this.vars.values()].filter(v => v.v instanceof Atom || v.v instanceof Ref || v.v instanceof Agent).map(v => [v.name, (v.v instanceof Atom ? 'atom ' : v.v instanceof Ref ? 'ref ' : 'agent ') + short(prView(v.v.v))]);
      return { threads, ids, clock: this.clock, results: this.results.slice() };
    }
    // the form with its evaluated sub-forms replaced by their values; the current one is marked
    renderForm(f, act) {
      const R = x => {
        if (x && typeof x === 'object' && act.done.has(x) && x !== act.cur && !(x instanceof Sym && isFnValue(act.done.get(x)))) return '\u0001' + short(prView(act.done.get(x))) + '\u0002';
        let s;
        if (x instanceof CList) {
          if (x.mapLiteral) s = '{' + x.items.map(R).join(' ') + '}';
          else if (x.setLiteral) s = '#{' + x.items.map(R).join(' ') + '}';
          else if (x.anon) s = '#' + R(x.items[1]);
          else if (x.items[0] instanceof Sym && x.items[0].name === 'quote' && x.items.length === 2) s = "'" + prForm(x.items[1]);
          else if (x.items[0] instanceof Sym && x.items[0].name === 'deref' && x.items.length === 2) s = '@' + R(x.items[1]);
          else s = '(' + x.items.map(R).join(' ') + ')';
        } else if (x instanceof CVec) s = '[' + x.items.map(R).join(' ') + ']';
        else s = prForm(x);
        return x === act.cur ? '\u0003' + s + '\u0004' : s;
      };
      return R(f);
    }

    *dosync(body, env, act) {
      if (this.cur.tx) { let v = null; for (const f of body) v = yield* this.ev(f, env, act); return v; }
      for (let attempt = 1; ; attempt++) {
        const tx = { start: this.txCounter, reads: new Map(), writes: new Map() };
        this.cur.tx = tx;
        let v = null, retry = false;
        try { for (const f of body) v = yield* this.ev(f, env, act); }
        catch (e) { if (e === RETRY) retry = true; else { this.cur.tx = null; throw e; } }
        this.cur.tx = null;
        if (!retry) {
          const touched = new Set([...tx.reads.keys(), ...tx.writes.keys()]);
          const conflict = [...touched].some(r => r.version > tx.start);
          if (!conflict) {
            this.txCounter++;
            for (const [r, val] of tx.writes) { r.v = val; r.version = this.txCounter; }
            yield* this.step(this.cur, 'commit', null);
            return v;
          }
        }
        this.cur.retries = (this.cur.retries || 0) + 1;
        this.emitNote(`transaction retry ${attempt}: a ref it used was changed by another thread`);
        yield* this.step(this.cur, 'retry', null);
      }
    }
    emitNote(s) { this.notes = this.notes || []; this.notes.push({ at: this.steps, s }); }
  }
  const RETRY = { retry: true };
  const isFnValue = v => v instanceof Fn || v instanceof Builtin;
  const truthy = v => v !== null && v !== undefined && v !== false;
  const short = s => (s.length > 70 ? s.slice(0, 67) + '…' : s);
  function prForm(x) {
    if (x instanceof CList) { if (x.mapLiteral) return '{' + x.items.map(prForm).join(' ') + '}'; if (x.setLiteral) return '#{' + x.items.map(prForm).join(' ') + '}'; return '(' + x.items.map(prForm).join(' ') + ')'; }
    if (x instanceof CVec) return '[' + x.items.map(prForm).join(' ') + ']';
    return pr(x);
  }

  /* ════════════════════════════════════════════════════════════════
     4. clojure.core subset
     ════════════════════════════════════════════════════════════════ */
  function makeCore(I) {
    const M = new Map();
    const def = (name, fn) => M.set(name, new Builtin(name, fn, false));
    const gdef = (name, fn) => M.set(name, new Builtin(name, fn, true));
    const num = (x, fname) => { if (!isNum(x)) throw err('ClassCastException', `class ${className(x)} cannot be cast to class java.lang.Number`); return x; };
    const L64 = v => { if (v > 9223372036854775807n || v < -9223372036854775808n) throw err('ArithmeticException', 'long overflow'); return v; };
    const arith = (a, b, op) => {
      num(a); num(b);
      if (typeof a === 'number' || typeof b === 'number') { const x = toNum(a), y = toNum(b); return op === '+' ? x + y : op === '-' ? x - y : x * y; }
      if (a instanceof Ratio || b instanceof Ratio) { const [an, ad] = a instanceof Ratio ? [a.n, a.d] : [a, 1n], [bn, bd] = b instanceof Ratio ? [b.n, b.d] : [b, 1n]; return op === '+' ? ratio(an * bd + bn * ad, ad * bd) : op === '-' ? ratio(an * bd - bn * ad, ad * bd) : ratio(an * bn, ad * bd); }
      return L64(op === '+' ? a + b : op === '-' ? a - b : a * b);
    };
    const div = (a, b) => {
      num(a); num(b);
      if (typeof a === 'number' || typeof b === 'number') { const y = toNum(b); if (y === 0 && isInt(b)) throw err('ArithmeticException', 'Divide by zero'); return toNum(a) / y; }
      const [an, ad] = a instanceof Ratio ? [a.n, a.d] : [a, 1n], [bn, bd] = b instanceof Ratio ? [b.n, b.d] : [b, 1n];
      if (bn === 0n) throw err('ArithmeticException', 'Divide by zero');
      return ratio(an * bd, ad * bn);
    };
    def('+', a => a.reduce((x, y) => arith(x, y, '+'), 0n));
    def('*', a => a.reduce((x, y) => arith(x, y, '*'), 1n));
    def('-', a => { if (!a.length) throw err('ArityException', 'Wrong number of args (0) passed to: clojure.core/-'); return a.length === 1 ? arith(0n, a[0], '-') : a.slice(1).reduce((x, y) => arith(x, y, '-'), a[0]); });
    def('/', a => (a.length === 1 ? div(1n, a[0]) : a.slice(1).reduce(div, a[0])));
    def('inc', a => arith(a[0], 1n, '+')); def('dec', a => arith(a[0], 1n, '-'));
    def("inc'", a => num(a[0]) + 1n); def("*'", a => a.reduce((x, y) => x * y, 1n)); def("+'", a => a.reduce((x, y) => x + y, 0n));
    def('quot', a => { if (a[1] === 0n) throw err('ArithmeticException', 'Divide by zero'); return isInt(a[0]) && isInt(a[1]) ? a[0] / a[1] : Math.trunc(toNum(a[0]) / toNum(a[1])); });
    def('rem', a => { if (a[1] === 0n) throw err('ArithmeticException', 'Divide by zero'); return isInt(a[0]) && isInt(a[1]) ? a[0] % a[1] : toNum(a[0]) % toNum(a[1]); });
    def('mod', a => { if (a[1] === 0n) throw err('ArithmeticException', 'Divide by zero'); if (isInt(a[0]) && isInt(a[1])) { const r = a[0] % a[1]; return r !== 0n && (r < 0n) !== (a[1] < 0n) ? r + a[1] : r; } const r = toNum(a[0]) % toNum(a[1]); return r !== 0 && (r < 0) !== (toNum(a[1]) < 0) ? r + toNum(a[1]) : r; });
    def('max', a => a.reduce((x, y) => (compare(y, x) > 0 ? y : x))); def('min', a => a.reduce((x, y) => (compare(y, x) < 0 ? y : x)));
    def('abs', a => (isInt(a[0]) ? (a[0] < 0n ? -a[0] : a[0]) : Math.abs(toNum(a[0]))));
    def('double', a => toNum(a[0])); def('int', a => (typeof a[0] === 'number' ? BigInt(Math.trunc(a[0])) : a[0] instanceof Char ? BigInt(a[0].c.charCodeAt(0)) : a[0])); def('long', a => (typeof a[0] === 'number' ? BigInt(Math.trunc(a[0])) : a[0]));
    def('Math/sqrt', a => Math.sqrt(toNum(a[0]))); def('Math/pow', a => Math.pow(toNum(a[0]), toNum(a[1]))); def('Math/abs', a => (isInt(a[0]) ? (a[0] < 0n ? -a[0] : a[0]) : Math.abs(a[0])));
    const cmpChain = (a, test) => { for (let k = 1; k < a.length; k++) if (!test(compare(num(a[k - 1]), num(a[k])))) return false; return true; };
    def('<', a => cmpChain(a, c => c < 0)); def('>', a => cmpChain(a, c => c > 0)); def('<=', a => cmpChain(a, c => c <= 0)); def('>=', a => cmpChain(a, c => c >= 0));
    def('==', a => a.every((x, k) => k === 0 || toNum(a[k - 1]) === toNum(x)));
    def('=', a => a.every((x, k) => k === 0 || equals(a[k - 1], x))); def('not=', a => !a.every((x, k) => k === 0 || equals(a[k - 1], x)));
    def('compare', a => BigInt(Math.sign(compare(a[0], a[1]))));
    def('not', a => !truthy(a[0])); def('identity', a => a[0]);
    def('zero?', a => toNum(num(a[0])) === 0); def('pos?', a => toNum(num(a[0])) > 0); def('neg?', a => toNum(num(a[0])) < 0);
    def('even?', a => { if (!isInt(a[0])) throw err('IllegalArgumentException', 'Argument must be an integer: ' + pr(a[0])); return a[0] % 2n === 0n; });
    def('odd?', a => { if (!isInt(a[0])) throw err('IllegalArgumentException', 'Argument must be an integer: ' + pr(a[0])); return a[0] % 2n !== 0n; });
    def('nil?', a => a[0] === null); def('some?', a => a[0] !== null); def('true?', a => a[0] === true); def('false?', a => a[0] === false);
    def('number?', a => isNum(a[0])); def('integer?', a => isInt(a[0])); def('string?', a => typeof a[0] === 'string'); def('keyword?', a => a[0] instanceof Kw); def('symbol?', a => a[0] instanceof Sym);
    def('vector?', a => a[0] instanceof CVec); def('map?', a => a[0] instanceof CMap); def('set?', a => a[0] instanceof CSet); def('list?', a => a[0] instanceof CList); def('seq?', a => a[0] instanceof CList || a[0] instanceof Lazy || a[0] instanceof Cons);
    def('fn?', a => a[0] instanceof Fn || a[0] instanceof Builtin); def('coll?', a => [CList, CVec, CMap, CSet, Lazy, Cons].some(C => a[0] instanceof C));
    def('str', a => a.map(x => (x === null ? '' : pr(x, false))).join(''));
    def('name', a => (a[0] instanceof Kw || a[0] instanceof Sym ? a[0].name : String(a[0])));
    def('keyword', a => kw(a.length > 1 ? a[0] + '/' + a[1] : String(a[0]))); def('symbol', a => new Sym(String(a[0])));
    def('subs', a => a[0].slice(Number(a[1]), a.length > 2 ? Number(a[2]) : undefined));
    def('println', a => { I.emit(a.map(x => pr(x, false)).join(' ') + '\n'); return null; });
    def('print', a => { I.emit(a.map(x => pr(x, false)).join(' ')); return null; });
    def('prn', a => { I.emit(a.map(x => pr(x, true)).join(' ') + '\n'); return null; });
    def('pr', a => { I.emit(a.map(x => pr(x, true)).join(' ')); return null; });
    def('pr-str', a => a.map(x => pr(x, true)).join(' ')); def('prn-str', a => a.map(x => pr(x, true)).join(' ') + '\n');
    def('newline', () => { I.emit('\n'); return null; });
    // collections
    def('list', a => new CList(a)); def('vector', a => new CVec(a));
    def('hash-map', a => { let m = new CMap([], true); for (let k = 0; k < a.length; k += 2) m = mapWith(m, a[k], a[k + 1]); return m; });
    def('array-map', a => { let m = new CMap([], false); for (let k = 0; k < a.length; k += 2) m = mapWith(m, a[k], a[k + 1]); return m; });
    def('hash-set', a => mkSet(a)); def('sorted-set', a => mkSet(a, true));
    gdef('set', function* (a) { return mkSet(yield* this.toArray(a[0])); });
    gdef('vec', function* (a) { return new CVec(yield* this.toArray(a[0])); });
    gdef('seq', function* (a) { const c = yield* this.seqCell(a[0]); if (!c) return null; return a[0] instanceof CList || a[0] instanceof Cons || a[0] instanceof Lazy ? a[0] : new CList(yield* this.toArray(a[0])); });
    gdef('count', function* (a) { const x = a[0]; if (x === null) return 0n; if (x instanceof CVec || x instanceof CList || x instanceof CSet) return BigInt(x.items.length); if (x instanceof CMap) return BigInt(x.entries.length); if (typeof x === 'string') return BigInt(x.length); if (x instanceof Lazy || x instanceof Cons) return BigInt((yield* this.toArray(x)).length); throw err('UnsupportedOperationException', 'count not supported on this type: ' + className(x).split('.').pop()); });
    gdef('first', function* (a) { const c = yield* this.seqCell(a[0]); return c ? c[0] : null; });
    gdef('second', function* (a) { const c = yield* this.seqCell(a[0]); if (!c) return null; const d = yield* this.seqCell(c[1]); return d ? d[0] : null; });
    gdef('ffirst', function* (a) { const c = yield* this.seqCell(a[0]); if (!c) return null; const d = yield* this.seqCell(c[0]); return d ? d[0] : null; });
    gdef('rest', function* (a) { const c = yield* this.seqCell(a[0]); return c ? (c[1] === null ? new CList([]) : (c[1] instanceof CList ? c[1] : c[1])) : new CList([]); });
    gdef('next', function* (a) { const c = yield* this.seqCell(a[0]); if (!c) return null; const d = yield* this.seqCell(c[1]); return d ? c[1] : null; });
    gdef('last', function* (a) { const xs = yield* this.toArray(a[0]); return xs.length ? xs[xs.length - 1] : null; });
    gdef('butlast', function* (a) { const xs = yield* this.toArray(a[0]); return xs.length > 1 ? new CList(xs.slice(0, -1)) : null; });
    gdef('nth', function* (a) { const x = a[0], i = Number(a[1]); if (x instanceof CVec) { if (i < 0 || i >= x.items.length) { if (a.length > 2) return a[2]; throw err('IndexOutOfBoundsException', null); } return x.items[i]; } const xs = yield* this.toArray(x); if (i < 0 || i >= xs.length) { if (a.length > 2) return a[2]; throw err('IndexOutOfBoundsException', null); } return xs[i]; });
    def('get', a => { const [m, k, d] = a; const dv = a.length > 2 ? d : null; if (m instanceof CMap) { const v = mapGet(m, k); return v === undefined ? dv : v; } if (m instanceof CVec) { if (!isInt(k) || k < 0n || k >= BigInt(m.items.length)) return dv; return m.items[Number(k)]; } if (m instanceof CSet) { const v = m.items.find(x => equals(x, k)); return v === undefined ? dv : v; } if (typeof m === 'string' && isInt(k)) return k >= 0n && k < BigInt(m.length) ? new Char(m[Number(k)]) : dv; return dv; });
    def('get-in', a => { let v = a[0]; for (const k of realizeSync(a[1])) { v = v instanceof CMap ? mapGet(v, k) ?? null : v instanceof CVec && isInt(k) ? v.items[Number(k)] ?? null : null; if (v === null) return a.length > 2 ? a[2] : null; } return v; });
    def('contains?', a => { const [c, k] = a; if (c instanceof CMap) return mapGet(c, k) !== undefined; if (c instanceof CSet) return c.items.some(x => equals(x, k)); if (c instanceof CVec) return isInt(k) && k >= 0n && k < BigInt(c.items.length); if (c === null) return false; throw err('IllegalArgumentException', 'contains? not supported on type: ' + className(c).split('.').pop()); });
    def('keys', a => (a[0] && a[0].entries.length ? new CList(a[0].entries.map(e => e[0])) : null)); def('vals', a => (a[0] && a[0].entries.length ? new CList(a[0].entries.map(e => e[1])) : null));
    const assoc1 = (c, k, v) => { if (c === null) return mapWith(new CMap([]), k, v); if (c instanceof CMap) return mapWith(c, k, v); if (c instanceof CVec) { const i = Number(k); if (i < 0 || i > c.items.length) throw err('IndexOutOfBoundsException', null); const items = c.items.slice(); items[i] = v; return new CVec(items); } throw err('ClassCastException', `class ${className(c)} cannot be cast to class clojure.lang.Associative`); };
    def('assoc', a => { let c = a[0]; for (let k = 1; k < a.length; k += 2) c = assoc1(c, a[k], a[k + 1]); return c; });
    def('dissoc', a => { let c = a[0]; for (const k of a.slice(1)) c = c === null ? null : mapWithout(c, k); return c; });
    def('disj', a => new CSet(a[0].items.filter(x => !a.slice(1).some(y => equals(x, y))), null, a[0].sorted));
    const assocIn = (c, ks, v) => (ks.length === 1 ? assoc1(c, ks[0], v) : assoc1(c, ks[0], assocIn(c === null ? null : (c instanceof CMap ? mapGet(c, ks[0]) ?? null : c.items[Number(ks[0])]), ks.slice(1), v)));
    def('assoc-in', a => assocIn(a[0], realizeSync(a[1]), a[2]));
    gdef('update', function* (a) { const [m, k, f, ...rest] = a; const cur = m instanceof CMap ? mapGet(m, k) ?? null : m instanceof CVec ? m.items[Number(k)] : null; return assoc1(m, k, yield* this.apply(f, [cur, ...rest])); });
    gdef('update-in', function* (a) { const [m, ks0, f, ...rest] = a; const ks = realizeSync(ks0); let cur = m; for (const k of ks) cur = cur instanceof CMap ? mapGet(cur, k) ?? null : cur instanceof CVec ? cur.items[Number(k)] ?? null : null; return assocIn(m, ks, yield* this.apply(f, [cur, ...rest])); });
    gdef('conj', function* (a) {
      let c = a[0]; const xs = a.slice(1);
      if (c === null) return new CList(xs.slice().reverse());
      for (const x of xs) {
        if (c instanceof CVec) c = new CVec(c.items.concat([x]));
        else if (c instanceof CList) c = new CList([x].concat(c.items));
        else if (c instanceof CSet) c = c.items.some(y => equals(x, y)) ? c : mkSet(c.items.concat([x]), c.sorted);
        else if (c instanceof CMap) { if (x instanceof CVec) c = mapWith(c, x.items[0], x.items[1]); else if (x instanceof CMap) for (const [k, v] of x.entries) c = mapWith(c, k, v); }
        else if (c instanceof Lazy || c instanceof Cons) c = new Cons(x, c);
      }
      return c;
    });
    def('cons', a => new Cons(a[0], a[1]));
    gdef('into', function* (a) { let c = a[0]; const conj = M.get('conj'); for (const x of yield* this.toArray(a[1])) c = yield* conj.fn.call(this, [c, x]); return c; });
    def('empty?', a => { const x = a[0]; if (x === null) return true; if (x instanceof CVec || x instanceof CList || x instanceof CSet) return !x.items.length; if (x instanceof CMap) return !x.entries.length; if (typeof x === 'string') return !x.length; if (x instanceof Cons) return false; if (x instanceof Lazy) return !forceSync(x); return false; });
    gdef('not-empty', function* (a) { const c = yield* this.seqCell(a[0]); return c ? a[0] : null; });
    gdef('reverse', function* (a) { return new CList((yield* this.toArray(a[0])).reverse()); });
    gdef('concat', function* (a) { const out = []; for (const x of a) out.push(...(yield* this.toArray(x))); return lazyFrom(out); });
    gdef('sort', function* (a) { const [f, c] = a.length > 1 ? a : [null, a[0]]; const xs = yield* this.toArray(c); const keyed = []; for (const x of xs) keyed.push(x); if (!f) return new CList(stableSort(keyed, compare)); const cmpVals = []; /* comparator fn: call synchronously per comparison */ const self = this; return new CList(stableSort(keyed, (x, y) => { const r = runSync(self, f, [x, y]); return typeof r === 'boolean' ? (r ? -1 : runSync(self, f, [y, x]) ? 1 : 0) : Number(r); })); void cmpVals; });
    gdef('sort-by', function* (a) { const [kf, c] = a; const xs = yield* this.toArray(c); const keys = []; for (const x of xs) keys.push(yield* this.apply(kf, [x])); const idx = xs.map((x, i) => i); return new CList(stableSort(idx, (i, j) => compare(keys[i], keys[j])).map(i => xs[i])); });
    gdef('distinct', function* (a) { const out = []; for (const x of yield* this.toArray(a[0])) if (!out.some(y => equals(x, y))) out.push(x); return lazyFrom(out); });
    gdef('frequencies', function* (a) { let m = new CMap([]); for (const x of yield* this.toArray(a[0])) { const c = mapGet(m, x); m = mapWith(m, x, (c ?? 0n) + 1n); } return m; });
    gdef('group-by', function* (a) { let m = new CMap([]); for (const x of yield* this.toArray(a[1])) { const k = yield* this.apply(a[0], [x]); const g = mapGet(m, k); m = mapWith(m, k, new CVec((g ? g.items : []).concat([x]))); } return m; });
    gdef('zipmap', function* (a) { const ks = yield* this.toArray(a[0]), vs = yield* this.toArray(a[1]); let m = new CMap([]); for (let k = 0; k < Math.min(ks.length, vs.length); k++) m = mapWith(m, ks[k], vs[k]); return m; });
    def('merge', a => { let m = null; for (const x of a) { if (x === null) continue; if (m === null) { m = x; continue; } for (const [k, v] of x.entries) m = mapWith(m, k, v); } return m; });
    def('select-keys', a => { let m = new CMap([]); for (const k of realizeSync(a[1])) { const v = mapGet(a[0], k); if (v !== undefined) m = mapWith(m, k, v); } return m; });
    // higher order
    gdef('apply', function* (a) { const f = a[0]; const args = a.slice(1, -1).concat(yield* this.toArray(a[a.length - 1])); return yield* this.apply(f, args); });
    def('partial', a => { const [f, ...pre] = a; return new Builtin('partial', function* (args) { return yield* this.apply(f, pre.concat(args)); }, true); });
    def('comp', a => { const fs = a.slice(); return new Builtin('comp', function* (args) { if (!fs.length) return args[0]; let v = yield* this.apply(fs[fs.length - 1], args); for (let k = fs.length - 2; k >= 0; k--) v = yield* this.apply(fs[k], [v]); return v; }, true); });
    def('constantly', a => new Builtin('constantly', () => a[0], false));
    def('juxt', a => new Builtin('juxt', function* (args) { const out = []; for (const f of a) out.push(yield* this.apply(f, args)); return new CVec(out); }, true));
    gdef('reduce', function* (a) {
      const f = a[0]; let acc, s;
      if (a.length === 2) { const c = yield* this.seqCell(a[1]); if (!c) return yield* this.apply(f, []); acc = c[0]; s = c[1]; }
      else { acc = a[1]; s = a[2]; }
      for (;;) { const c = yield* this.seqCell(s); if (!c) return acc; acc = yield* this.apply(f, [acc, c[0]]); s = c[1]; }
    });
    gdef('mapv', function* (a) { const out = []; for (const x of yield* this.toArray(a[1])) out.push(yield* this.apply(a[0], [x])); return new CVec(out); });
    gdef('filterv', function* (a) { const out = []; for (const x of yield* this.toArray(a[1])) if (truthy(yield* this.apply(a[0], [x]))) out.push(x); return new CVec(out); });
    gdef('every?', function* (a) { for (const x of yield* this.toArray(a[1])) if (!truthy(yield* this.apply(a[0], [x]))) return false; return true; });
    gdef('some', function* (a) { let s = a[1]; for (;;) { const c = yield* this.seqCell(s); if (!c) return null; const v = yield* this.apply(a[0], [c[0]]); if (truthy(v)) return v; s = c[1]; } });
    gdef('doall', function* (a) { yield* this.toArray(a[0]); return a[0]; }); gdef('dorun', function* (a) { yield* this.toArray(a[0]); return null; });
    gdef('max-key', function* (a) { const [f, ...xs] = a; let best = xs[0], bk = yield* this.apply(f, [best]); for (const x of xs.slice(1)) { const k = yield* this.apply(f, [x]); if (compare(k, bk) >= 0) { best = x; bk = k; } } return best; });
    gdef('min-key', function* (a) { const [f, ...xs] = a; let best = xs[0], bk = yield* this.apply(f, [best]); for (const x of xs.slice(1)) { const k = yield* this.apply(f, [x]); if (compare(k, bk) <= 0) { best = x; bk = k; } } return best; });
    // lazy sequences
    const lazy = gen => new Lazy(gen);
    def('range', a => {
      const [start, end, step] = a.length === 0 ? [0n, null, 1n] : a.length === 1 ? [0n, a[0], 1n] : [a[0], a[1], a.length > 2 ? a[2] : 1n];
      const from = x => lazy(function* () { if (end !== null && (compare(step, 0n) > 0 ? compare(x, end) >= 0 : compare(x, end) <= 0)) return null; return [x, from(arith(x, step, '+'))]; });
      return from(start);
    });
    def('repeat', a => { const [n, x] = a.length > 1 ? a : [null, a[0]]; const from = k => lazy(function* () { if (n !== null && k >= n) return null; return [x, from(k + 1n)]; }); return from(0n); });
    def('iterate', a => { const [f, x0] = a; const from = x => lazy(function* () { return [x, lazy(function* () { const y = yield* I.apply(f, [x]); return (yield* I.seqCell(from(y))); })]; }); return from(x0); });
    def('cycle', a => { const xs = realizeSync(a[0]); if (!xs.length) return new CList([]); const from = k => lazy(function* () { return [xs[k % xs.length], from(k + 1)]; }); return from(0); });
    def('map', a => {
      const [f, ...colls] = a;
      const from = ss => lazy(function* () { const firsts = [], rests = []; for (const s of ss) { const c = yield* I.seqCell(s); if (!c) return null; firsts.push(c[0]); rests.push(c[1]); } return [yield* I.apply(f, firsts), from(rests)]; });
      return from(colls);
    });
    def('map-indexed', a => { const [f, coll] = a; const from = (s, k) => lazy(function* () { const c = yield* I.seqCell(s); if (!c) return null; return [yield* I.apply(f, [k, c[0]]), from(c[1], k + 1n)]; }); return from(coll, 0n); });
    def('filter', a => { const [p, coll] = a; const from = s => lazy(function* () { for (;;) { const c = yield* I.seqCell(s); if (!c) return null; if (truthy(yield* I.apply(p, [c[0]]))) return [c[0], from(c[1])]; s = c[1]; } }); return from(coll); });
    def('remove', a => { const [p, coll] = a; const from = s => lazy(function* () { for (;;) { const c = yield* I.seqCell(s); if (!c) return null; if (!truthy(yield* I.apply(p, [c[0]]))) return [c[0], from(c[1])]; s = c[1]; } }); return from(coll); });
    def('take', a => { const [n, coll] = a; const from = (s, k) => lazy(function* () { if (k >= n) return null; const c = yield* I.seqCell(s); if (!c) return null; return [c[0], from(c[1], k + 1n)]; }); return from(coll, 0n); });
    def('drop', a => { const [n, coll] = a; return lazy(function* () { let s = coll; for (let k = 0n; k < n; k++) { const c = yield* I.seqCell(s); if (!c) return null; s = c[1]; } return yield* I.seqCell(s); }); });
    def('take-while', a => { const [p, coll] = a; const from = s => lazy(function* () { const c = yield* I.seqCell(s); if (!c) return null; if (!truthy(yield* I.apply(p, [c[0]]))) return null; return [c[0], from(c[1])]; }); return from(coll); });
    def('drop-while', a => { const [p, coll] = a; return lazy(function* () { let s = coll; for (;;) { const c = yield* I.seqCell(s); if (!c) return null; if (!truthy(yield* I.apply(p, [c[0]]))) return c; s = c[1]; } }); });
    def('interleave', a => { const from = ss => lazy(function* () { const firsts = [], rests = []; for (const s of ss) { const c = yield* I.seqCell(s); if (!c) return null; firsts.push(c[0]); rests.push(c[1]); } const tail = from(rests); let cell = tail; for (let k = firsts.length - 1; k >= 0; k--) cell = new Cons(firsts[k], cell); return yield* I.seqCell(cell); }); return from(a); });
    def('partition', a => { const [n, coll] = a; const from = s => lazy(function* () { const part = []; for (let k = 0n; k < n; k++) { const c = yield* I.seqCell(s); if (!c) return null; part.push(c[0]); s = c[1]; } return [new CList(part), from(s)]; }); return from(coll); });
    def('realized?', a => (a[0] instanceof Lazy ? a[0].realized : a[0] instanceof Future ? a[0].done : true));
    def('flatten', a => { const out = []; const walk = x => { if (isSeqColl(x)) realizeSync(x).forEach(walk); else out.push(x); }; walk(a[0]); return lazyFrom(out); });
    // strings
    def('clojure.string/upper-case', a => String(a[0]).toUpperCase()); def('clojure.string/lower-case', a => String(a[0]).toLowerCase());
    def('clojure.string/trim', a => String(a[0]).trim()); def('clojure.string/blank?', a => a[0] === null || !String(a[0]).trim());
    def('clojure.string/join', a => { const [sep, c] = a.length > 1 ? a : ['', a[0]]; return realizeSync(c).map(x => (x === null ? '' : pr(x, false))).join(sep); });
    def('clojure.string/split', a => new CVec(String(a[0]).split(a[1] instanceof RegExp ? a[1] : String(a[1])))); def('clojure.string/reverse', a => [...String(a[0])].reverse().join(''));
    def('clojure.string/includes?', a => String(a[0]).includes(String(a[1]))); def('clojure.string/starts-with?', a => String(a[0]).startsWith(String(a[1])));
    def('clojure.string/capitalize', a => { const s = String(a[0]); return s ? s[0].toUpperCase() + s.slice(1).toLowerCase() : s; });
    def('clojure.string/replace', a => String(a[0]).split(String(a[1])).join(String(a[2])));
    // documentation
    def('clojure.repl/doc', () => null);
    // exceptions
    def('ex-info', a => { const e = new CljError('ExceptionInfo', a[0]); e.data = a[1]; return e; });
    def('ex-message', a => (a[0] instanceof CljError ? a[0].message : null)); def('ex-data', a => (a[0] instanceof CljError ? a[0].data ?? null : null));
    // identities: atoms, agents, refs, futures
    def('atom', a => new Atom(a[0]));
    gdef('deref', function* (a) {
      const x = a[0];
      if (x instanceof Atom || x instanceof Agent) return x.v;
      if (x instanceof Ref) { const tx = this.cur.tx; if (tx) { if (tx.writes.has(x)) return tx.writes.get(x); tx.reads.set(x, true); } return x.v; }
      if (x instanceof Future) { while (!x.done) { this.cur.blockedOn = x; yield* this.step(this.cur, 'block', null); } this.cur.blockedOn = null; return x.v; }
      if (x instanceof Var) return x.v;
      throw err('ClassCastException', `class ${className(x)} cannot be cast to class clojure.lang.IDeref`);
    });
    gdef('swap!', function* (a) {
      const [at, f, ...rest] = a;
      if (!(at instanceof Atom)) throw err('ClassCastException', `class ${className(at)} cannot be cast to class clojure.lang.IAtom`);
      for (;;) {
        const old = at.v, ver = at.version;
        const nv = yield* this.apply(f, [old, ...rest]);
        if (at.version === ver) { at.v = nv; at.version++; return nv; }
        this.emitNote(`swap! retry: another thread changed the atom from ${pr(old)} to ${pr(at.v)} meanwhile`);
        yield* this.step(this.cur, 'retry', null);
      }
    });
    def('reset!', a => { a[0].v = a[1]; a[0].version++; return a[1]; });
    def('compare-and-set!', a => { if (equals(a[0].v, a[1]) || a[0].v === a[1]) { a[0].v = a[2]; a[0].version++; return true; } return false; });
    def('agent', a => new Agent(a[0]));
    const send = function (a) {
      const [ag, f, ...rest] = a;
      ag.queue.push({ f, rest });
      if (!ag.thread || ag.thread.done) {
        const self = this;
        ag.thread = this.spawn('agent', function* () { while (ag.queue.length) { const job = ag.queue.shift(); const act = { name: 'agent action', vars: new Map([['state', ag.v]]), body: [], done: new Map(), cur: null }; self.cur.frames.push(act); try { ag.v = yield* self.apply(job.f, [ag.v, ...job.rest]); } finally { self.cur.frames.pop(); } yield* self.step(self.cur, 'agent', null); } return ag.v; });
      }
      return ag;
    };
    def('send', send); def('send-off', send);
    gdef('await', function* (a) { for (const ag of a) while (ag.queue.length || (ag.thread && !ag.thread.done)) { this.cur.blockedOn = ag; yield* this.step(this.cur, 'block', null); } this.cur.blockedOn = null; return null; });
    def('shutdown-agents', () => null);
    def('ref', a => new Ref(a[0]));
    const needTx = (I2) => { const tx = I2.cur.tx; if (!tx) throw err('IllegalStateException', 'No transaction running'); return tx; };
    gdef('alter', function* (a) { const [r, f, ...rest] = a; const tx = needTx(this); const cur = tx.writes.has(r) ? tx.writes.get(r) : r.v; tx.reads.set(r, true); const nv = yield* this.apply(f, [cur, ...rest]); tx.writes.set(r, nv); return nv; });
    gdef('commute', function* (a) { const [r, f, ...rest] = a; const tx = needTx(this); const cur = tx.writes.has(r) ? tx.writes.get(r) : r.v; const nv = yield* this.apply(f, [cur, ...rest]); tx.writes.set(r, nv); return nv; });
    def('ref-set', a => { const tx = needTx(I); tx.reads.set(a[0], true); tx.writes.set(a[0], a[1]); return a[1]; });
    def('future-done?', a => a[0].done);
    gdef('Thread/sleep', function* (a) { this.cur.sleepUntil = this.clock + Number(a[0]); while (this.clock < this.cur.sleepUntil) yield* this.step(this.cur, 'sleep', null); return null; });
    def('rand-int', a => { I.seed = ((I.seed || 42) * 1103515245 + 12345) % 2147483648; return BigInt(Math.floor(I.seed / 2147483648 * Number(a[0]))); });
    def('type', a => new Sym(className(a[0]))); def('class', a => new Sym(className(a[0])));
    return M;
  }
  function stableSort(xs, cmp) { return xs.map((x, i) => [x, i]).sort((a, b) => cmp(a[0], b[0]) || a[1] - b[1]).map(p => p[0]); }
  function lazyFrom(arr) { const from = k => new Lazy(function* () { return k < arr.length ? [arr[k], from(k + 1)] : null; }); return from(0); }
  function runSync(I, f, args) { const g = I.apply(f, args); let r; for (;;) { r = g.next(); if (r.done) return r.value; } }

  /* ════════════════════════════════════════════════════════════════
     5. Running a program: the REPL loop over the top-level forms, and the scheduler
     ════════════════════════════════════════════════════════════════ */
  CLJ.run = function (code, opts = {}) {
    const I = new Interp(opts);
    const repl = opts.repl !== false;
    let forms;
    try { forms = read(code); }
    catch (e) { return { trace: [], out: '', error: { kind: 'syntax', cls: e.cls || 'RuntimeException', message: e.message, line: null }, results: [] }; }
    const main = I.spawn('main', function* () {
      for (const f of forms) {
        const act = { name: 'user', vars: new Map(), body: [f], done: new Map(), cur: null, top: true, line: f && f.src ? f.src.line : null };
        I.cur.frames.push(act);
        let v;
        try { v = yield* I.ev(f, new Env(null), act); }
        finally { I.cur.frames.pop(); }
        if (v instanceof Lazy || v instanceof Cons) yield* I.toArray(v);
        const src = f && f.src ? code.slice(f.src.start, f.src.end) : pr(f);
        I.results.push({ src, value: v instanceof Var ? `#'${v.ns}/${v.name}` : pr(v), line: f && f.src ? f.src.line : null, outAt: I.out.length });
        if (repl) I.transcript = (I.transcript || '') + '';
        yield { th: I.cur, kind: 'result', info: f };
      }
    });
    // the scheduler: round robin over runnable threads, one step each; the clock moves 1 ms per step
    let error = null, rr = 0;
    try {
      for (;;) {
        const live = I.threads.filter(t => !t.done);
        if (!live.length) break;
        const runnable = live.filter(t => t.sleepUntil <= I.clock);
        if (!runnable.length) { I.clock = Math.min(...live.map(t => t.sleepUntil)); continue; }
        const th = runnable[rr++ % runnable.length];
        I.cur = th;
        const r = th.gen.next();
        I.clock += 1;
        if (r.done) continue;
        const ev = r.value || {};
        if (ev.kind === 'sleep' || ev.kind === 'block') continue;
        const f = ev.th && ev.th.frames.length ? ev.th.frames[0] : null;
        I.snap({ kind: ev.kind, thread: th.id, line: lineOf(th, ev), top: f ? f.line : null });
      }
      I.snap({ kind: 'finished', thread: 1, line: null });
    } catch (e) {
      if (e instanceof CljError) error = { kind: e.compile ? 'syntax' : 'runtime', cls: e.cls, message: e.message, line: lineOfErr(I) };
      else { error = { kind: 'runtime', cls: 'InternalError', message: String(e && e.message || e), line: null }; if (typeof console !== 'undefined') console.warn('clj.js internal error', e); }
      try { I.trace.push({ kind: 'error', line: error.line, outLen: I.out.length, view: I.view({}) }); } catch (_) { /* keep the error */ }
    }
    return { trace: I.trace, out: I.out, error, results: I.results, notes: I.notes || [] };
  };
  function lineOf(th, ev) {
    const f = ev.info;
    if (f && f.src) return f.src.line;
    for (let k = th.frames.length - 1; k >= 0; k--) { const a = th.frames[k]; if (a.cur && a.cur.src) return a.cur.src.line; }
    return th.frames.length && th.frames[0].line;
  }
  function lineOfErr(I) {
    for (const th of I.threads) for (let k = th.frames.length - 1; k >= 0; k--) { const a = th.frames[k]; if (a.cur && a.cur.src) return a.cur.src.line; if (a.line) return a.line; }
    return null;
  }
  // the text a REPL shows for a run: each form, its output, then its value
  CLJ.transcript = function (r, code) {
    let s = '', at = 0;
    for (const x of r.results) { s += 'user=> ' + x.src + '\n' + r.out.slice(at, x.outAt) + x.value + '\n'; at = x.outAt; }
    return s;
  };
  CLJ.read = read; CLJ.pr = pr;

  /* ════════════════════════════════════════════════════════════════
     6. Stepper UI
     ════════════════════════════════════════════════════════════════ */
  const UIS = {};
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  function highlight(line) {
    const parts = []; const re = /(;.*$)|("(?:[^"\\]|\\.)*")|(:[\w\-?!*<>=.\/]+)/g;
    let last = 0, m;
    const plain = s => esc(s).replace(/(\(|\s)(defn-?|def|fn|let|loop|recur|if|do|when|cond|and|or|ns|require|future|dosync|doseq|dotimes|defmacro|try|catch|throw|quote)(?=[\s)])/g, '$1<b>$2</b>').replace(/(^|[\s(\[{])(-?\d+(?:\.\d+)?(?:\/\d+)?)(?=[\s)\]}]|$)/g, '$1<i>$2</i>');
    while ((m = re.exec(line))) { parts.push(plain(line.slice(last, m.index))); parts.push(`<span class="${m[1] ? 'jv-cm' : m[2] ? 'jv-str' : 'clj-kw'}">${esc(m[0])}</span>`); last = re.lastIndex; }
    parts.push(plain(line.slice(last)));
    return parts.join('');
  }
  const exprHtml = s => esc(s).replace(/\u0003/g, '<span class="clj-cur">').replace(/\u0004/g, '</span>').replace(/\u0001/g, '<span class="clj-val">').replace(/\u0002/g, '</span>');

  class Stepper {
    constructor(id, cfg) {
      this.id = id; this.cfg = cfg;
      this.code = (cfg.code || '').replace(/\s+$/, '');
      this.result = null; this.i = 0; this.editing = true;
      this.el = document.getElementById('sim-' + id);
    }
    run() {
      this.result = CLJ.run(this.code, { maxSteps: this.cfg.maxSteps || 4000, repl: this.cfg.repl !== false });
      this.i = Math.max(0, this.result.trace.length - 1); this.editing = false; this.render();
    }
    goto(k) { if (!this.result) return; this.i = Math.max(0, Math.min(this.result.trace.length - 1, k)); this.render(); }
    render() {
      const el = this.el; if (!el) return;
      const lines = this.code.split('\n');
      const tr = this.result ? this.result.trace : [];
      const cur = tr[this.i] || null;
      const last = !tr.length || this.i === tr.length - 1;
      const err = this.result && this.result.error;
      const curLine = cur ? cur.line : null;
      const codeHtml = this.editing
        ? `<textarea class="jv-editor" spellcheck="false" rows="${Math.max(3, lines.length + 1)}">${esc(this.code)}</textarea>`
        : `<pre class="jv-listing">${lines.map((l, k) => `<span class="jv-ln${curLine === k + 1 ? ' cur' : ''}${err && last && err.line === k + 1 ? ' err' : ''}"><span class="jv-no">${k + 1}</span>${highlight(l) || ' '}</span>`).join('')}</pre>`;
      let evalHtml = '<div class="jv-empty">press ▶ Run, then step through the evaluation</div>';
      if (cur && cur.view) {
        const v = cur.view;
        const threads = v.threads.map(t => `<div class="clj-thread${t.id === cur.thread ? ' on' : ''}">${v.threads.length > 1 ? `<div class="clj-thread-name">${t.id === 1 ? 'main thread' : esc(t.name) + ' thread ' + t.id} · ${esc(t.status)}</div>` : ''}${t.frames.slice().reverse().map((f, k) => `<div class="jv-frame${k === 0 ? ' top' : ''}"><div class="jv-frame-name">${f.name === 'user' ? 'top level' : esc(f.name)}${f.vars.length ? ' <span class="clj-binds">' + f.vars.map(([n, x]) => esc(n) + ' = ' + esc(x)).join(', ') + '</span>' : ''}</div><pre class="clj-expr">${exprHtml(f.expr)}</pre></div>`).join('') || '<div class="jv-empty">idle</div>'}</div>`).join('');
        const ids = v.ids.length ? `<div class="clj-ids">${v.ids.map(([n, x]) => `<span><b>${esc(n)}</b> ${esc(x)}</span>`).join('')}</div>` : '';
        evalHtml = threads + ids;
      }
      const outText = cur ? this.result.out.slice(0, cur.outLen) : '';
      const results = cur && cur.view ? cur.view.results : [];
      const replHtml = results.length ? results.map(r => `<div class="clj-res"><span class="clj-prompt">user=&gt;</span> ${esc(r.src.length > 60 ? r.src.slice(0, 57) + '…' : r.src)}<br><span class="clj-arrow">⇒</span> ${esc(r.value)}</div>`).join('') : '';
      let errHtml = '';
      if (err && last) errHtml = `<div class="jv-err"><b>${err.kind === 'syntax' ? 'Syntax error' : 'Execution error'} (${esc(err.cls)})${err.line ? ' at line ' + err.line : ''}.</b><br>${esc(err.message || '')}</div>`;
      const notes = this.result ? this.result.notes.filter(n => n.at <= (this.i + 1)) : [];
      const status = !this.result || this.editing ? '' : err && err.kind === 'syntax' && !tr.length ? 'did not run' : cur && cur.kind === 'finished' ? 'finished' : cur && cur.kind === 'error' ? 'stopped by an exception' : `step ${this.i} of ${tr.length - 1}${curLine ? ' — line ' + curLine : ''}${cur && cur.kind === 'retry' ? ' — retry' : ''}`;
      el.innerHTML = `
        <div class="jv-wrap c-wrap clj-wrap">
          <div class="jv-toolbar">
            <button class="btn fa-btn jv-run" data-act="run">▶ Run</button>
            ${this.editing ? '' : '<button class="btn fa-btn fa-secondary" data-act="edit">✎ Edit</button>'}
            <button class="btn fa-btn fa-secondary" data-act="reset" title="restore the original program">⟲ Reset</button>
            ${this.editing || !tr.length ? '' : `<span class="jv-sep"></span>
            <button class="btn fa-btn fa-secondary" data-act="first" ${this.i === 0 ? 'disabled' : ''}>|◀</button>
            <button class="btn fa-btn fa-secondary" data-act="back" ${this.i === 0 ? 'disabled' : ''}>◀ Back</button>
            <button class="btn fa-btn jv-step" data-act="step" ${last ? 'disabled' : ''}>Step ▶</button>
            <button class="btn fa-btn fa-secondary" data-act="last" ${last ? 'disabled' : ''}>▶|</button>`}
            <span class="jv-status">${esc(status)}</span>
          </div>
          <div class="c-main">
            <div class="jv-code">${codeHtml}</div>
            <div class="jv-panel"><div class="jv-panel-title">Evaluation</div><div class="clj-eval">${evalHtml}</div></div>
            <div class="c-io">
              <div class="jv-panel"><div class="jv-panel-title">Output</div><pre class="jv-console">${esc(outText)}</pre>${errHtml}</div>
              ${replHtml || notes.length ? `<div class="jv-panel"><div class="jv-panel-title">REPL</div><div class="clj-repl">${replHtml}${notes.map(n => `<div class="clj-note">${esc(n.s)}</div>`).join('')}</div></div>` : ''}
            </div>
          </div>
        </div>`;
      el.querySelectorAll('[data-act]').forEach(b => b.addEventListener('click', () => {
        const a = b.dataset.act;
        if (a === 'run') this.run(); else if (a === 'edit') { this.editing = true; this.render(); } else if (a === 'reset') { this.result = null; this.editing = true; this.code = (this.cfg.code || '').replace(/\s+$/, ''); this.render(); }
        else if (a === 'first') this.goto(0); else if (a === 'back') this.goto(this.i - 1); else if (a === 'step') this.goto(this.i + 1); else this.goto(Infinity);
      }));
      const ta = el.querySelector('.jv-editor');
      if (ta) {
        ta.addEventListener('input', () => { this.code = ta.value; ta.rows = Math.max(3, ta.value.split('\n').length + 1); });
        ta.addEventListener('keydown', ev => { if (ev.key === 'Tab') { ev.preventDefault(); const s = ta.selectionStart, e = ta.selectionEnd; ta.value = ta.value.slice(0, s) + '  ' + ta.value.slice(e); ta.selectionStart = ta.selectionEnd = s + 2; this.code = ta.value; } if ((ev.metaKey || ev.ctrlKey) && ev.key === 'Enter') { ev.preventDefault(); this.run(); } });
      }
      const listing = el.querySelector('.jv-listing'); if (listing) listing.addEventListener('dblclick', () => { this.editing = true; this.render(); });
    }
  }
  CLJ.mount = function (id, cfg) { const ui = new Stepper(id, cfg || {}); UIS[id] = ui; ui.render(); return ui; };
  CLJ.ui = id => UIS[id];

  if (typeof window !== 'undefined') window.CLJ = CLJ;
  if (typeof module !== 'undefined' && module.exports) module.exports = CLJ;
})();
