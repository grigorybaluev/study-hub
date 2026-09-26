/* ── C-subset interpreter + stepper with a memory view (COMP 348) ──────────────
   Pure core (no DOM): C.run(code, stdin, opts) → { trace, out, error, report, warnings }.
   UI: C.mount(id, cfg) builds the stepper inside #sim-<id>; cfg = { code, stdin?, args?, maxSteps? }.
   Memory is real bytes on an x86-64-like layout (int 4, long 8, pointer 8, natural struct padding):
   code at the bottom, then static data, the heap growing up and the stack growing down, so a pointer
   is just a number, an array overrun on the stack lands in the neighbouring variable, and a dangling
   pointer reads whatever was left behind. Heap blocks sit between red zones and freed blocks are never
   reused, so the checks report what valgrind's memcheck reports: invalid reads and writes, invalid
   frees and, at exit, the blocks still allocated. Execution records a snapshot before every statement
   (line, frames with their variables and addresses, the heap, the statics, output so far). */
(function () {
  'use strict';
  const C = {};

  /* ════════════════════════════════════════════════════════════════
     1. Types
     ════════════════════════════════════════════════════════════════ */
  const INT = (name, size, signed) => ({ k: 'int', name, size, signed });
  const T = {
    void: { k: 'void', name: 'void', size: 1 },
    bool: INT('_Bool', 1, false),
    char: INT('char', 1, true), schar: INT('signed char', 1, true), uchar: INT('unsigned char', 1, false),
    short: INT('short', 2, true), ushort: INT('unsigned short', 2, false),
    int: INT('int', 4, true), uint: INT('unsigned int', 4, false),
    long: INT('long', 8, true), ulong: INT('unsigned long', 8, false),
    llong: INT('long long', 8, true), ullong: INT('unsigned long long', 8, false),
    float: { k: 'float', name: 'float', size: 4 }, double: { k: 'float', name: 'double', size: 8 },
    ldouble: { k: 'float', name: 'long double', size: 16 },
  };
  const RANK = { _Bool: 0, char: 1, 'signed char': 1, 'unsigned char': 1, short: 2, 'unsigned short': 2, int: 3, 'unsigned int': 3, long: 4, 'unsigned long': 4, 'long long': 5, 'unsigned long long': 5 };
  const ptr = (to, c) => ({ k: 'ptr', to, size: 8, c: !!c });
  const arr = (of, n, nExpr) => ({ k: 'array', of, n, nExpr, get size() { return this.n == null ? 8 : this.n * sizeOf(this.of); } });
  const fnT = (ret, params, variadic, noProto) => ({ k: 'func', ret, params, variadic, noProto, size: 1 });
  const withConst = (t, c) => (c && !t.c ? Object.assign(Object.create(Object.getPrototypeOf(t)), t, { c: true }) : t);
  const unq = t => (t.c ? Object.assign(Object.create(Object.getPrototypeOf(t)), t, { c: false }) : t);
  const isInt = t => t.k === 'int' || t.k === 'enum';
  const isFloat = t => t.k === 'float';
  const isArith = t => isInt(t) || isFloat(t);
  const isPtr = t => t.k === 'ptr';
  const isScalar = t => isArith(t) || isPtr(t);
  const SIZE_T = T.ulong;

  function sizeOf(t) {
    if (t.k === 'struct') { if (!t.complete) throw cerr(`incomplete type 'struct ${t.tag}'`); return t.size; }
    if (t.k === 'array') return t.n == null ? 8 : t.n * sizeOf(t.of);
    if (t.k === 'enum') return 4;
    return t.size;
  }
  function alignOf(t) {
    if (t.k === 'array') return alignOf(t.of);
    if (t.k === 'struct') return t.align;
    if (t.k === 'enum') return 4;
    return Math.min(t.size, 16);
  }
  function layoutStruct(st, fields, isUnion) {
    let off = 0, al = 1, size = 0;
    for (const f of fields) {
      const a = alignOf(f.type), s = sizeOf(f.type);
      al = Math.max(al, a);
      if (isUnion) { f.offset = 0; size = Math.max(size, s); }
      else { off = Math.ceil(off / a) * a; f.offset = off; off += s; size = off; }
    }
    st.fields = fields; st.align = al; st.size = Math.ceil(size / al) * al || 0; st.complete = true;
  }
  function sameType(a, b) {
    if (a === b) return true;
    if (a.k !== b.k) return false;
    if (a.k === 'int' || a.k === 'float') return a.name === b.name;
    if (a.k === 'ptr') return sameType(unq(a.to), unq(b.to)) || a.to.k === 'void' || b.to.k === 'void';
    if (a.k === 'struct') return a.tag === b.tag && a.fields === b.fields;
    if (a.k === 'array') return sameType(a.of, b.of);
    return true;
  }
  // C declaration syntax for a type, e.g. typeStr(int *const) → 'int *const'
  function typeStr(t, inner = '') {
    const cq = t.c ? 'const ' : '';
    switch (t.k) {
      case 'ptr': {
        const s = '*' + (t.c ? 'const' + (inner ? ' ' : '') : '') + inner;
        return typeStr(t.to, t.to.k === 'array' || t.to.k === 'func' ? '(' + s + ')' : s);
      }
      case 'array': return typeStr(t.of, inner + '[' + (t.n == null ? '' : t.n) + ']');
      case 'func': return typeStr(t.ret, inner + '(' + (t.params.length ? t.params.map(p => typeStr(p.type)).join(', ') + (t.variadic ? ', ...' : '') : t.noProto ? '' : 'void') + ')');
      case 'struct': return cq + (t.union ? 'union ' : 'struct ') + (t.tag || '(anonymous)') + (inner ? ' ' + inner : '');
      case 'enum': return cq + 'enum ' + (t.tag || '') + (inner ? ' ' + inner : '');
      default: return cq + t.name + (inner ? (inner[0] === '*' || inner[0] === '(' || inner[0] === '[' ? ' ' : ' ') + inner : '');
    }
  }

  class CError extends Error {
    constructor(kind, msg, line) { super(msg); this.kind = kind; this.line = line; }
  }
  const cerr = (msg, line) => new CError('compile', msg, line);
  const rterr = (name, msg, line) => { const e = new CError('runtime', msg, line); e.name = name; return e; };

  /* ════════════════════════════════════════════════════════════════
     2. Preprocessor and lexer
     ════════════════════════════════════════════════════════════════ */
  const KW = new Set(['auto', 'break', 'case', 'char', 'const', 'continue', 'default', 'do', 'double', 'else', 'enum', 'extern',
    'float', 'for', 'goto', 'if', 'int', 'long', 'register', 'return', 'short', 'signed', 'sizeof', 'static', 'struct',
    'switch', 'typedef', 'union', 'unsigned', 'void', 'volatile', 'while', '_Bool', 'bool', 'inline', 'restrict']);
  const OPS = ['<<=', '>>=', '...', '->', '++', '--', '<<', '>>', '<=', '>=', '==', '!=', '&&', '||', '+=', '-=', '*=', '/=', '%=', '&=', '^=', '|=',
    '+', '-', '*', '/', '%', '<', '>', '=', '!', '~', '&', '|', '^', '?', ':', ';', ',', '.', '(', ')', '[', ']', '{', '}', '#'];
  const ESC = { n: 10, t: 9, r: 13, '0': 0, a: 7, b: 8, f: 12, v: 11, '\\': 92, "'": 39, '"': 34, '?': 63 };

  function lexLine(src, line, toks) {
    let i = 0;
    const n = src.length;
    while (i < n) {
      const c = src[i];
      if (c === ' ' || c === '\t' || c === '\r' || c === '\f' || c === '\v') { i++; continue; }
      if (/[A-Za-z_]/.test(c)) {
        let j = i; while (j < n && /[A-Za-z0-9_]/.test(src[j])) j++;
        const w = src.slice(i, j);
        toks.push({ k: KW.has(w) ? 'kw' : 'id', v: w, line }); i = j; continue;
      }
      if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(src[i + 1] || ''))) {
        let j = i, isF = false, text;
        if (c === '0' && /[xX]/.test(src[i + 1] || '')) { j += 2; while (j < n && /[0-9a-fA-F]/.test(src[j])) j++; }
        else {
          while (j < n && /[0-9]/.test(src[j])) j++;
          if (src[j] === '.') { isF = true; j++; while (j < n && /[0-9]/.test(src[j])) j++; }
          if (/[eE]/.test(src[j] || '') && /[-+0-9]/.test(src[j + 1] || '')) { isF = true; j++; if (/[-+]/.test(src[j])) j++; while (j < n && /[0-9]/.test(src[j])) j++; }
        }
        text = src.slice(i, j);
        let suf = ''; while (j < n && /[uUlLfF]/.test(src[j])) suf += src[j++];
        if (isF || (/[fF]/.test(suf) && !/^0[xX]/.test(text))) {
          toks.push({ k: 'num', v: parseFloat(text), t: /[fF]/.test(suf) ? T.float : /[lL]/.test(suf) ? T.ldouble : T.double, line });
        } else {
          let v = /^0[xX]/.test(text) ? BigInt(text) : /^0[0-7]+$/.test(text) ? BigInt('0o' + text.slice(1)) : BigInt(text);
          const u = /[uU]/.test(suf), l = (suf.match(/[lL]/g) || []).length;
          let t = l ? (u ? T.ulong : T.long) : u ? T.uint : T.int;
          if (t === T.int && v > 2147483647n) t = /^0[xX0]/.test(text) && v <= 4294967295n ? T.uint : T.long;
          if (t === T.uint && v > 4294967295n) t = T.ulong;
          toks.push({ k: 'num', v, t, line });
        }
        i = j; continue;
      }
      if (c === '"' || c === "'") {
        let j = i + 1; const bytes = [];
        while (j < n && src[j] !== c) {
          if (src[j] === '\\') {
            const e = src[j + 1];
            if (e === 'x') { let k = j + 2, h = ''; while (k < n && /[0-9a-fA-F]/.test(src[k])) h += src[k++]; bytes.push(parseInt(h || '0', 16) & 255); j = k; continue; }
            if (/[0-7]/.test(e)) { let k = j + 1, o = ''; while (k < n && o.length < 3 && /[0-7]/.test(src[k])) o += src[k++]; bytes.push(parseInt(o, 8) & 255); j = k; continue; }
            bytes.push(e in ESC ? ESC[e] : e.charCodeAt(0)); j += 2; continue;
          }
          const cp = src.codePointAt(j);
          const enc = unescape(encodeURIComponent(String.fromCodePoint(cp)));
          for (const ch of enc) bytes.push(ch.charCodeAt(0));
          j += cp > 0xffff ? 2 : 1;
        }
        if (j >= n) throw cerr(c === '"' ? 'missing terminating \'"\' character' : "missing terminating ' character", line);
        if (c === '"') toks.push({ k: 'str', v: bytes, line });
        else toks.push({ k: 'num', v: BigInt(bytes.length ? (bytes[0] > 127 ? bytes[0] - 256 : bytes[0]) : 0), t: T.int, line, chr: true });
        i = j + 1; continue;
      }
      let op = null;
      for (const o of OPS) if (src.startsWith(o, i)) { op = o; break; }
      if (!op) throw cerr(`unexpected character '${c}'`, line);
      toks.push({ k: 'op', v: op, line }); i += op.length;
    }
  }

  // Line numbers carry the file: line + LINE_BASE × file index (0 is the main file).
  const LINE_BASE = 100000;
  function stripComments(code) {
    let s = '', i = 0;
    while (i < code.length) {
      if (code[i] === '/' && code[i + 1] === '/') { while (i < code.length && code[i] !== '\n') i++; continue; }
      if (code[i] === '/' && code[i + 1] === '*') { i += 2; while (i < code.length && !(code[i] === '*' && code[i + 1] === '/')) { if (code[i] === '\n') s += '\n'; i++; } i += 2; s += ' '; continue; }
      if (code[i] === '"' || code[i] === "'") { const q = code[i]; let j = i + 1; while (j < code.length && code[j] !== q && code[j] !== '\n') { if (code[j] === '\\') j++; j++; } s += code.slice(i, j + 1); i = j + 1; continue; }
      s += code[i++];
    }
    return s;
  }
  // Runs the directives of one translation unit (following #include "file" into the virtual files)
  // and expands macros with the definitions in force at each point.
  function preprocess(code, fileIdx, ctx) {
    if (!ctx.macros) { ctx.macros = new Map(); for (const [name, body] of PREDEFINED) { const b = []; lexLine(body, 0, b); ctx.macros.set(name, { params: null, body: b }); } }
    const macros = ctx.macros;
    if ((ctx.depth = (ctx.depth || 0) + 1) > 20) throw cerr('#include nested too deeply (does a header include itself without a guard?)', fileIdx * LINE_BASE + 1);
    const lines = stripComments(code).split('\n');
    const out = [];
    let pending = [];
    const flush = () => { if (pending.length) { out.push(...expand(pending, macros, new Set())); pending = []; } };
    const cond = []; // stack of { active, taken }
    const active = () => cond.every(c => c.active);
    for (let li = 0; li < lines.length; li++) {
      let text = lines[li]; const line = li + 1 + fileIdx * LINE_BASE;
      while (/\\\s*$/.test(text) && li + 1 < lines.length) text = text.replace(/\\\s*$/, ' ') + lines[++li];
      const m = /^\s*#\s*(\w*)\s*(.*)$/.exec(text);
      if (!m) { if (active()) lexLine(text, line, pending); continue; }
      flush();
      const [, d, rest] = m;
      if (d === 'ifdef' || d === 'ifndef') { const has = macros.has(rest.trim().split(/\s/)[0]); const a = d === 'ifdef' ? has : !has; cond.push({ active: a, taken: a }); }
      else if (d === 'if') { const a = active() && ppEval(rest, macros, line); cond.push({ active: a, taken: a }); }
      else if (d === 'elif') { const c = cond[cond.length - 1]; if (!c) throw cerr('#elif without #if', line); if (c.taken) c.active = false; else { c.active = ppEval(rest, macros, line); c.taken = c.active; } }
      else if (d === 'else') { const c = cond[cond.length - 1]; if (!c) throw cerr('#else without #if', line); c.active = !c.taken; c.taken = true; }
      else if (d === 'endif') { if (!cond.pop()) throw cerr('#endif without #if', line); }
      else if (active()) {
        if (d === 'include') {
          const h = /^\s*([<"])([^>"]+)[>"]/.exec(rest);
          if (!h) throw cerr('#include expects "FILENAME" or <FILENAME>', line);
          const f = ctx.files && ctx.files.get(h[2]);
          if (h[1] === '"' && f) out.push(...preprocess(f.text, f.idx, ctx));
          else if (h[1] === '"' && !LIBS[h[2]]) throw cerr(`'${h[2]}' file not found`, line);
          else ctx.includes.add(h[2]);
        } else if (d === 'define') {
          const dm = /^([A-Za-z_]\w*)(\(([^)]*)\))?\s*(.*)$/.exec(rest);
          if (!dm) throw cerr('macro name missing', line);
          const body = []; lexLine(dm[4], line, body);
          macros.set(dm[1], { params: dm[2] ? dm[3].split(',').map(p => p.trim()).filter(Boolean) : null, body });
        } else if (d === 'undef') macros.delete(rest.trim());
        else if (d === 'pragma') { if (/^\s*once\b/.test(rest)) { const key = '#once:' + fileIdx; if (ctx.once && ctx.once.has(key)) { ctx.depth--; return out; } (ctx.once = ctx.once || new Set()).add(key); } }
        else if (d === '' || d === 'line') { /* ignored */ }
        else if (d === 'error') throw cerr('#error ' + rest, line);
        else throw cerr(`invalid preprocessing directive '#${d}'`, line);
      }
    }
    flush();
    if (cond.length) throw cerr('unterminated conditional directive', lines.length + fileIdx * LINE_BASE);
    ctx.depth--;
    return out;
  }
  const PREDEFINED = [['NULL', '((void *)0)'], ['EOF', '(-1)'], ['true', '1'], ['false', '0'], ['EXIT_SUCCESS', '0'], ['EXIT_FAILURE', '1'],
    ['INT_MAX', '2147483647'], ['INT_MIN', '(-2147483647-1)'], ['UINT_MAX', '4294967295U'], ['LONG_MAX', '9223372036854775807L'], ['LONG_MIN', '(-9223372036854775807L-1)'],
    ['CHAR_BIT', '8'], ['SIZE_MAX', '18446744073709551615UL'], ['CHAR_MAX', '127'], ['CHAR_MIN', '(-128)'], ['SHRT_MAX', '32767'], ['RAND_MAX', '2147483647'], ['__STDC__', '1'], ['__STDC_VERSION__', '201710L']];
  function expand(toks, macros, hide) {
    const res = [];
    for (let i = 0; i < toks.length; i++) {
      const t = toks[i];
      const m = t.k === 'id' && !hide.has(t.v) ? macros.get(t.v) : null;
      if (!m) { res.push(t); continue; }
      if (m.params) {
        if (!(toks[i + 1] && toks[i + 1].v === '(')) { res.push(t); continue; }
        const args = [[]]; let depth = 0, j = i + 2;
        for (; j < toks.length; j++) {
          const v = toks[j].v;
          if (toks[j].k === 'op' && (v === '(' || v === '[' || v === '{')) depth++;
          if (toks[j].k === 'op' && (v === ')' || v === ']' || v === '}')) { if (depth === 0 && v === ')') break; depth--; }
          if (toks[j].k === 'op' && v === ',' && depth === 0) { args.push([]); continue; }
          args[args.length - 1].push(toks[j]);
        }
        const body = [];
        for (let b = 0; b < m.body.length; b++) {
          const bt = m.body[b];
          if (bt.k === 'op' && bt.v === '#' && m.body[b + 1] && m.params.includes(m.body[b + 1].v)) {
            const a = args[m.params.indexOf(m.body[++b].v)] || [];
            body.push({ k: 'str', v: [...a.map(x => x.k === 'str' ? JSON.stringify(String.fromCharCode(...x.v)) : String(x.v)).join(' ')].flatMap(s => [...s].map(ch => ch.charCodeAt(0))), line: t.line });
            continue;
          }
          const pi = bt.k === 'id' ? m.params.indexOf(bt.v) : -1;
          if (pi >= 0) body.push(...expand(args[pi] || [], macros, hide).map(x => ({ ...x, line: t.line })));
          else body.push({ ...bt, line: t.line });
        }
        res.push(...expand(body, macros, new Set([...hide, t.v])));
        i = j;
      } else res.push(...expand(m.body.map(x => ({ ...x, line: t.line })), macros, new Set([...hide, t.v])));
    }
    return res;
  }
  function ppEval(text, macros, line) {
    const toks = []; lexLine(text.replace(/defined\s*\(\s*(\w+)\s*\)|defined\s+(\w+)/g, (_, a, b) => (macros.has(a || b) ? ' 1 ' : ' 0 ')), line, toks);
    const ex = expand(toks, macros, new Set()).map(t => (t.k === 'id' ? { k: 'num', v: 0n, t: T.int, line } : t));
    const p = new Parser(ex, {});
    const e = p.expr();
    return constEval(e, null) !== 0n;
  }

  /* ════════════════════════════════════════════════════════════════
     3. Parser
     ════════════════════════════════════════════════════════════════ */
  class Parser {
    constructor(toks, scope) {
      this.t = toks; this.i = 0;
      this.typedefs = scope.typedefs || new Map();
      this.tags = scope.tags || new Map();
      this.enums = scope.enums || new Map();
    }
    peek(o = 0) { return this.t[this.i + o] || { k: 'eof', v: '<end>', line: (this.t[this.t.length - 1] || { line: 1 }).line }; }
    next() { return this.t[this.i++] || this.peek(); }
    is(v, o = 0) { const p = this.peek(o); return (p.k === 'op' || p.k === 'kw') && p.v === v; }
    eat(v) { if (this.is(v)) { this.i++; return true; } return false; }
    expect(v) {
      if (!this.is(v)) { const p = this.peek(); throw cerr(p.k === 'eof' ? `expected '${v}' at end of input` : `expected '${v}' before '${p.k === 'str' ? '"..."' : p.v}'`, p.line); }
      return this.next();
    }
    ident() { const p = this.next(); if (p.k !== 'id') throw cerr(`expected identifier before '${p.v}'`, p.line); return p.v; }

    isTypeStart(o = 0) {
      const p = this.peek(o);
      if (p.k === 'kw') return ['void', 'char', 'short', 'int', 'long', 'float', 'double', 'signed', 'unsigned', '_Bool', 'bool', 'struct', 'union', 'enum',
        'const', 'volatile', 'static', 'extern', 'typedef', 'auto', 'register', 'inline', 'restrict'].includes(p.v);
      return p.k === 'id' && this.typedefs.has(p.v);
    }
    // declaration specifiers → { type, storage }
    specifiers() {
      let storage = null, isConst = false, base = null;
      const words = [];
      const line = this.peek().line;
      for (;;) {
        const p = this.peek();
        if (p.k === 'kw' && ['static', 'extern', 'typedef', 'auto', 'register'].includes(p.v)) { storage = p.v; this.i++; continue; }
        if (p.k === 'kw' && (p.v === 'const')) { isConst = true; this.i++; continue; }
        if (p.k === 'kw' && ['volatile', 'inline', 'restrict'].includes(p.v)) { this.i++; continue; }
        if (p.k === 'kw' && ['void', 'char', 'short', 'int', 'long', 'float', 'double', 'signed', 'unsigned', '_Bool', 'bool'].includes(p.v)) { words.push(p.v); this.i++; continue; }
        if (p.k === 'kw' && (p.v === 'struct' || p.v === 'union')) { if (base || words.length) break; base = this.structSpec(); continue; }
        if (p.k === 'kw' && p.v === 'enum') { if (base || words.length) break; base = this.enumSpec(); continue; }
        if (p.k === 'id' && this.typedefs.has(p.v) && !base && !words.length) { base = this.typedefs.get(p.v); this.i++; continue; }
        break;
      }
      if (!base) {
        if (!words.length) { if (storage || isConst) base = T.int; else throw cerr('expected a type', line); }
        else base = wordsToType(words, line);
      }
      return { type: withConst(base, isConst), storage };
    }
    structSpec() {
      const kw = this.next().v, line = this.peek().line;
      const tag = this.peek().k === 'id' ? this.next().v : null;
      let st = tag ? this.tags.get((kw === 'union' ? 'union ' : '') + tag) : null;
      if (this.is('{')) {
        if (st && st.complete) throw cerr(`redefinition of '${tag}'`, line);
        if (!st) { st = { k: 'struct', tag, union: kw === 'union', complete: false }; if (tag) this.tags.set((kw === 'union' ? 'union ' : '') + tag, st); }
        this.next();
        const fields = [];
        while (!this.eat('}')) {
          const sp = this.specifiers();
          do {
            const d = this.declarator(sp.type);
            if (!d.name) throw cerr('expected member name', this.peek().line);
            if (d.type.k === 'struct' && !d.type.complete) throw cerr(`field has incomplete type '${typeStr(d.type)}'`, line);
            fields.push({ name: d.name, type: d.type });
          } while (this.eat(','));
          this.expect(';');
        }
        layoutStruct(st, fields, kw === 'union');
        return st;
      }
      if (!tag) throw cerr('expected struct name', line);
      if (!st) { st = { k: 'struct', tag, union: kw === 'union', complete: false }; this.tags.set((kw === 'union' ? 'union ' : '') + tag, st); }
      return st;
    }
    enumSpec() {
      this.next();
      const tag = this.peek().k === 'id' ? this.next().v : null;
      if (this.eat('{')) {
        let v = 0n;
        while (!this.eat('}')) {
          const name = this.ident();
          if (this.eat('=')) v = constEval(this.assign(), this);
          this.enums.set(name, v); v++;
          if (!this.eat(',')) { this.expect('}'); break; }
        }
      }
      return { k: 'enum', tag, size: 4, name: 'int', signed: true };
    }
    // declarator: pointers, a name (or none), then array / function suffixes
    declarator(base, allowAbstract) {
      const ptrs = [];
      while (this.is('*')) { this.next(); let c = false; while (this.is('const') || this.is('volatile') || this.is('restrict')) { if (this.next().v === 'const') c = true; } ptrs.push(c); }
      let name = null, inner = null, line = this.peek().line;
      if (this.is('(') && (this.is('*', 1) || (this.peek(1).k === 'id' && !this.typedefs.has(this.peek(1).v) && this.is(')', 2) === false && this.is('(', 2) === false && false))) {
        this.next(); inner = this.declarator(null, allowAbstract); this.expect(')');
      } else if (this.peek().k === 'id') name = this.next().v;
      else if (!allowAbstract) throw cerr(`expected identifier or '(' before '${this.peek().v}'`, line);
      const suffixes = [];
      for (;;) {
        if (this.is('[')) {
          this.next();
          if (this.eat(']')) { suffixes.push({ arr: true, n: null }); continue; }
          const e = this.expr(); this.expect(']');
          let n = null, nExpr = null;
          try { n = Number(constEval(e, this)); } catch (err) { if (err instanceof NotConst) nExpr = e; else throw err; }
          suffixes.push({ arr: true, n, nExpr });
        } else if (this.is('(')) {
          this.next();
          const params = []; let variadic = false, noProto = false;
          if (this.eat(')')) noProto = true;
          else if (this.is('void') && this.is(')', 1)) { this.next(); this.next(); }
          else {
            do {
              if (this.eat('...')) { variadic = true; break; }
              const sp = this.specifiers();
              const d = this.declarator(sp.type, true);
              let pt = d.type;
              if (pt.k === 'array') pt = ptr(pt.of);
              if (pt.k === 'func') pt = ptr(pt);
              params.push({ name: d.name, type: pt });
            } while (this.eat(','));
            this.expect(')');
          }
          suffixes.push({ fn: true, params, variadic, noProto });
        } else break;
      }
      const build = t => {
        if (t == null) return null;
        for (const c of ptrs) t = ptr(t, c);
        for (let k = suffixes.length - 1; k >= 0; k--) {
          const s = suffixes[k];
          t = s.arr ? arr(t, s.n, s.nExpr) : fnT(t, s.params, s.variadic, s.noProto);
        }
        return inner ? inner.build(t) : t;
      };
      const res = { name: inner ? inner.name : name, build, line, params: null };
      const fnSuf = suffixes.find(s => s.fn);
      if (!inner && fnSuf) res.params = fnSuf.params;
      if (inner && inner.params) res.params = inner.params;
      res.type = base ? build(base) : null;
      return res;
    }
    typeName() { const sp = this.specifiers(); return this.declarator(sp.type, true).type; }

    program() {
      const items = [];
      while (this.peek().k !== 'eof') {
        if (this.eat(';')) continue;
        if (this.isTypeStart()) items.push(...this.declaration(true));
        else items.push({ k: 'stmt', s: this.statement() });
      }
      return items;
    }
    // a declaration or, at top level, a function definition
    declaration(top) {
      const line = this.peek().line;
      const sp = this.specifiers();
      if (this.eat(';')) return [];
      const out = [];
      for (;;) {
        const d = this.declarator(sp.type);
        if (sp.storage === 'typedef') { this.typedefs.set(d.name, d.type); }
        else if (d.type.k === 'func') {
          if (top && this.is('{')) {
            const body = this.block();
            out.push({ k: 'fndef', name: d.name, type: d.type, params: d.params || [], body, storage: sp.storage, line: d.line });
            return out;
          }
          out.push({ k: 'proto', name: d.name, type: d.type, storage: sp.storage, line: d.line });
        } else {
          let init = null;
          if (this.eat('=')) init = this.initializer();
          if (d.type.k === 'array' && d.type.n == null && !d.type.nExpr && init) {
            const n = init.k === 'list' ? init.items.length : init.k === 'str' ? init.v.length + 1 : null;
            if (n != null) d.type = arr(d.type.of, init.k === 'list' ? Math.max(n, ...init.items.map(it => it.pos + 1)) : n);
          }
          out.push({ k: 'decl', name: d.name, type: d.type, init, storage: sp.storage, line: d.line });
        }
        if (this.eat(',')) continue;
        this.expect(';');
        return out;
      }
    }
    initializer() {
      if (this.is('{')) {
        const line = this.next().line; const items = [];
        let idx = 0;
        while (!this.eat('}')) {
          let field = null, index = null;
          if (this.is('.') && this.peek(1).k === 'id') { this.next(); field = this.ident(); this.expect('='); }
          else if (this.is('[')) { this.next(); index = Number(constEval(this.expr(), this)); this.expect(']'); this.expect('='); idx = index; }
          const v = this.initializer();
          items.push({ field, index: index != null ? index : null, pos: idx++, v });
          if (!this.eat(',')) { this.expect('}'); break; }
        }
        return { k: 'list', items, line };
      }
      return this.assign();
    }
    block() {
      const line = this.expect('{').line; const body = [];
      while (!this.eat('}')) {
        if (this.peek().k === 'eof') throw cerr("expected '}'", this.peek().line);
        body.push(this.isTypeStart() && !(this.peek().k === 'id' && this.is(':', 1)) ? { k: 'declstmt', decls: this.declaration(false), line: this.peek(-1).line } : this.statement());
      }
      return { k: 'block', body, line, endLine: this.peek(-1).line };
    }
    statement() {
      const p = this.peek(), line = p.line;
      if (p.k === 'op' && p.v === '{') return this.block();
      if (p.k === 'kw') {
        switch (p.v) {
          case 'if': { this.next(); this.expect('('); const c = this.expr(); this.expect(')'); const a = this.statement(); const b = this.eat('else') ? this.statement() : null; return { k: 'if', c, a, b, line }; }
          case 'while': { this.next(); this.expect('('); const c = this.expr(); this.expect(')'); return { k: 'while', c, body: this.statement(), line }; }
          case 'do': { this.next(); const body = this.statement(); this.expect('while'); this.expect('('); const c = this.expr(); this.expect(')'); this.expect(';'); return { k: 'do', c, body, line, cline: this.peek(-1).line }; }
          case 'for': {
            this.next(); this.expect('(');
            let init = null;
            if (this.isTypeStart()) init = { k: 'declstmt', decls: this.declaration(false), line };
            else { if (!this.is(';')) init = { k: 'expr', e: this.expr(), line }; this.expect(';'); }
            const c = this.is(';') ? null : this.expr(); this.expect(';');
            const step = this.is(')') ? null : this.expr(); this.expect(')');
            return { k: 'for', init, c, step, body: this.statement(), line };
          }
          case 'return': { this.next(); const e = this.is(';') ? null : this.expr(); this.expect(';'); return { k: 'return', e, line }; }
          case 'break': this.next(); this.expect(';'); return { k: 'break', line };
          case 'continue': this.next(); this.expect(';'); return { k: 'continue', line };
          case 'switch': { this.next(); this.expect('('); const e = this.expr(); this.expect(')'); return { k: 'switch', e, body: this.statement(), line }; }
          case 'case': { this.next(); const v = constEval(this.cond(), this); this.expect(':'); return { k: 'case', v, line }; }
          case 'default': this.next(); this.expect(':'); return { k: 'default', line };
          case 'goto': throw cerr('goto is not supported by this interpreter', line);
        }
      }
      if (p.k === 'op' && p.v === ';') { this.next(); return { k: 'empty', line }; }
      const e = this.expr(); this.expect(';');
      return { k: 'expr', e, line };
    }

    // expressions, by precedence
    expr() { let e = this.assign(); while (this.is(',')) { const line = this.next().line; e = { k: 'comma', a: e, b: this.assign(), line }; } return e; }
    assign() {
      const a = this.cond();
      const p = this.peek();
      if (p.k === 'op' && ['=', '+=', '-=', '*=', '/=', '%=', '<<=', '>>=', '&=', '^=', '|='].includes(p.v)) { this.next(); return { k: 'assign', op: p.v, a, b: this.assign(), line: p.line }; }
      return a;
    }
    cond() {
      const c = this.bin(0);
      if (this.is('?')) { const line = this.next().line; const a = this.expr(); this.expect(':'); const b = this.cond(); return { k: 'cond', c, a, b, line }; }
      return c;
    }
    bin(level) {
      const LV = [['||'], ['&&'], ['|'], ['^'], ['&'], ['==', '!='], ['<', '>', '<=', '>='], ['<<', '>>'], ['+', '-'], ['*', '/', '%']];
      if (level >= LV.length) return this.cast();
      let a = this.bin(level + 1);
      for (;;) {
        const p = this.peek();
        if (p.k === 'op' && LV[level].includes(p.v)) { this.next(); a = { k: 'bin', op: p.v, a, b: this.bin(level + 1), line: p.line }; }
        else return a;
      }
    }
    cast() {
      if (this.is('(') && this.isTypeStart(1)) {
        const line = this.next().line; const t = this.typeName(); this.expect(')');
        if (this.is('{')) throw cerr('compound literals are not supported', line);
        return { k: 'cast', t, a: this.cast(), line };
      }
      return this.unary();
    }
    unary() {
      const p = this.peek();
      if (p.k === 'op' && ['++', '--'].includes(p.v)) { this.next(); return { k: 'pre', op: p.v, a: this.unary(), line: p.line }; }
      if (p.k === 'op' && ['+', '-', '!', '~', '*', '&'].includes(p.v)) { this.next(); return { k: 'un', op: p.v, a: this.cast(), line: p.line }; }
      if (p.k === 'kw' && p.v === 'sizeof') {
        this.next();
        if (this.is('(') && this.isTypeStart(1)) { this.next(); const t = this.typeName(); this.expect(')'); return { k: 'sizeofT', t, line: p.line }; }
        return { k: 'sizeofE', a: this.unary(), line: p.line };
      }
      return this.postfix(this.primary());
    }
    postfix(e) {
      for (;;) {
        const p = this.peek();
        if (p.k !== 'op') return e;
        if (p.v === '[') { this.next(); const i = this.expr(); this.expect(']'); e = { k: 'idx', a: e, i, line: p.line }; }
        else if (p.v === '(') {
          this.next(); const args = [];
          if (!this.eat(')')) { do args.push(this.assign()); while (this.eat(',')); this.expect(')'); }
          e = { k: 'call', f: e, args, line: p.line };
        } else if (p.v === '.' || p.v === '->') { this.next(); e = { k: 'mem', a: e, name: this.ident(), arrow: p.v === '->', line: p.line }; }
        else if (p.v === '++' || p.v === '--') { this.next(); e = { k: 'post', op: p.v, a: e, line: p.line }; }
        else return e;
      }
    }
    primary() {
      const p = this.next();
      if (p.k === 'num') return { k: 'num', v: p.v, t: p.t, line: p.line };
      if (p.k === 'str') { let v = p.v.slice(); while (this.peek().k === 'str') v = v.concat(this.next().v); return { k: 'str', v, line: p.line }; }
      if (p.k === 'id' && p.v === 'va_arg' && this.is('(')) {
        this.next(); const ap = this.assign(); this.expect(','); const t = this.typeName(); this.expect(')');
        return { k: 'va_arg', ap, t, line: p.line };
      }
      if (p.k === 'id') {
        if (this.enums.has(p.v)) return { k: 'num', v: this.enums.get(p.v), t: T.int, line: p.line };
        return { k: 'id', name: p.v, line: p.line };
      }
      if (p.k === 'op' && p.v === '(') { const e = this.expr(); this.expect(')'); return e; }
      throw cerr(p.k === 'eof' ? 'expected expression at end of input' : `expected expression before '${p.v}'`, p.line);
    }
  }
  function wordsToType(w, line) {
    const has = x => w.includes(x);
    const longs = w.filter(x => x === 'long').length;
    const u = has('unsigned');
    if (has('void')) return T.void;
    if (has('_Bool') || has('bool')) return T.bool;
    if (has('float')) return T.float;
    if (has('double')) return longs ? T.ldouble : T.double;
    if (has('char')) return u ? T.uchar : has('signed') ? T.schar : T.char;
    if (has('short')) return u ? T.ushort : T.short;
    if (longs >= 2) return u ? T.ullong : T.llong;
    if (longs === 1) return u ? T.ulong : T.long;
    if (has('int') || has('signed') || u) return u ? T.uint : T.int;
    throw cerr('invalid type', line);
  }
  class NotConst extends Error {}
  // integer constant expressions: array sizes, case labels, enum values, #if
  function constEval(e, p) {
    switch (e.k) {
      case 'num': if (typeof e.v !== 'bigint') throw new NotConst(); return e.v;
      case 'sizeofT': return BigInt(sizeOf(e.t));
      case 'un': { const a = constEval(e.a, p); switch (e.op) { case '-': return -a; case '+': return a; case '!': return a ? 0n : 1n; case '~': return ~a; } throw new NotConst(); }
      case 'cast': return constEval(e.a, p);
      case 'cond': return constEval(e.c, p) ? constEval(e.a, p) : constEval(e.b, p);
      case 'bin': {
        const a = constEval(e.a, p), b = constEval(e.b, p);
        switch (e.op) {
          case '+': return a + b; case '-': return a - b; case '*': return a * b;
          case '/': if (!b) throw cerr('division by zero in constant expression', e.line); return a / b;
          case '%': if (!b) throw cerr('division by zero in constant expression', e.line); return a % b;
          case '<<': return a << b; case '>>': return a >> b;
          case '<': return a < b ? 1n : 0n; case '>': return a > b ? 1n : 0n; case '<=': return a <= b ? 1n : 0n; case '>=': return a >= b ? 1n : 0n;
          case '==': return a === b ? 1n : 0n; case '!=': return a !== b ? 1n : 0n;
          case '&': return a & b; case '|': return a | b; case '^': return a ^ b;
          case '&&': return a && b ? 1n : 0n; case '||': return a || b ? 1n : 0n;
        }
      }
    }
    throw new NotConst();
  }

  /* ════════════════════════════════════════════════════════════════
     4. Memory: code, static, heap, stack
     ════════════════════════════════════════════════════════════════ */
  const CODE_BASE = 0x8000, STATIC_BASE = 0x10000, STATIC_END = 0x20000, HEAP_BASE = 0x20000, HEAP_END = 0x7e0000, STACK_BOTTOM = 0x7f0000, STACK_TOP = 0x800000;
  const REDZONE = 16;
  const hex = a => '0x' + a.toString(16);

  class Memory {
    constructor() {
      this.stat = new Uint8Array(STATIC_END - STATIC_BASE);
      this.heap = new Uint8Array(1 << 16); // grows as blocks are allocated
      this.heapDef = new Uint8Array(1 << 16);
      this.stack = new Uint8Array(STACK_TOP - STACK_BOTTOM);
      this.stackDef = new Uint8Array(STACK_TOP - STACK_BOTTOM);
      // stack memory starts out holding leftovers, as it does in a real process: uninitialised locals read junk
      let seed = 0x2545f491;
      for (let k = 0; k < this.stack.length; k++) { seed = (Math.imul(seed, 1103515245) + 12345) >>> 0; this.stack[k] = (seed >>> 16) & 255; }
      this.staticTop = STATIC_BASE + 16; // the first bytes stay unused so nothing lives at a round address
      this.heapTop = HEAP_BASE + REDZONE;
      this.blocks = []; // heap blocks
      this.readonly = []; // [start, end) ranges of string literals
    }
    seg(a) {
      if (a >= STATIC_BASE && a < STATIC_END) return [this.stat, null, a - STATIC_BASE];
      if (a >= HEAP_BASE && a < HEAP_END) { if (a - HEAP_BASE >= this.heap.length) return null; return [this.heap, this.heapDef, a - HEAP_BASE]; }
      if (a >= STACK_BOTTOM && a < STACK_TOP) return [this.stack, this.stackDef, a - STACK_BOTTOM];
      return null;
    }
    allocStatic(size, align) { this.staticTop = Math.ceil(this.staticTop / align) * align; const a = this.staticTop; this.staticTop += Math.max(size, 1); if (this.staticTop > STATIC_END) throw rterr('OutOfMemory', 'static data too large', null); return a; }
    growHeap(top) {
      let n = this.heap.length;
      while (n < top - HEAP_BASE + 64) n *= 2;
      if (n === this.heap.length) return;
      const h = new Uint8Array(n), d = new Uint8Array(n);
      h.set(this.heap); d.set(this.heapDef); this.heap = h; this.heapDef = d;
    }
    blockAt(a) { for (const b of this.blocks) if (a >= b.base - REDZONE && a < b.base + b.size + REDZONE) return b; return null; }
  }

  /* ════════════════════════════════════════════════════════════════
     5. Values and formatting
     ════════════════════════════════════════════════════════════════ */
  const V = (t, v) => ({ t, v });
  const bits = t => BigInt(t.size * 8);
  function wrapInt(v, t) { if (t.k === 'enum') t = T.int; if (t === T.bool || t.name === '_Bool') return v ? 1n : 0n; return t.signed ? BigInt.asIntN(t.size * 8, v) : BigInt.asUintN(t.size * 8, v); }
  function toNum(val) { return typeof val.v === 'bigint' ? Number(val.v) : val.v; }
  function truthy(val) { return typeof val.v === 'bigint' ? val.v !== 0n : val.v !== 0; }

  // exact decimal expansion of a double: [digits, pointPos] with value = 0.digits × 10^pointPos
  function exactDec(x) {
    const buf = new DataView(new ArrayBuffer(8)); buf.setFloat64(0, x);
    const hi = buf.getUint32(0), lo = buf.getUint32(4);
    const e = (hi >>> 20) & 0x7ff;
    let m = (BigInt(hi & 0xfffff) << 32n) | BigInt(lo);
    let ex;
    if (e === 0) ex = -1074; else { m |= 1n << 52n; ex = e - 1075; }
    if (m === 0n) return ['0', 1];
    let digits, point;
    if (ex >= 0) { digits = (m << BigInt(ex)).toString(); point = digits.length; }
    else { const k = -ex; digits = (m * 5n ** BigInt(k)).toString(); point = digits.length - k; }
    return [digits, point];
  }
  // round the digit string to `keep` digits, half to even; returns [digits, pointShift]
  function roundDigits(digits, keep) {
    if (keep < 0) return ['', 0];
    if (digits.length <= keep) return [digits.padEnd(keep, '0'), 0];
    const head = digits.slice(0, keep), rest = digits.slice(keep);
    let up = rest[0] > '5' || (rest[0] === '5' && (/[1-9]/.test(rest.slice(1)) || (head.length && +head[head.length - 1] % 2 === 1)));
    if (rest[0] === '5' && !/[1-9]/.test(rest.slice(1)) && !head.length) up = false;
    if (!up) return [head, 0];
    let n = (BigInt(head || '0') + 1n).toString();
    if (head.length === 0) return [n, 1];
    if (n.length > head.length) return [n.slice(0, head.length), 1];
    return [n.padStart(head.length, '0'), 0];
  }
  function fmtF(x, prec) {
    if (!isFinite(x)) return isNaN(x) ? 'nan' : 'inf';
    const [d, p] = exactDec(Math.abs(x));
    // digits before the point: p (may be ≤ 0)
    let digits = p > 0 ? d : '0'.repeat(-p) + d, point = p > 0 ? p : 0;
    const [r, sh] = roundDigits(digits, point + prec);
    let intPart, frac;
    if (sh) { const all = r + '0'; intPart = all.slice(0, point + 1); frac = all.slice(point + 1, point + 1 + prec); } // rounding carried into a new leading digit
    else { intPart = r.slice(0, point) || '0'; frac = r.slice(point); }
    intPart = intPart.replace(/^0+(?=\d)/, '');
    return intPart + (prec > 0 ? '.' + frac : '');
  }
  function fmtE(x, prec, upper) {
    if (!isFinite(x)) return isNaN(x) ? 'nan' : 'inf';
    if (x === 0) return '0' + (prec ? '.' + '0'.repeat(prec) : '') + (upper ? 'E+00' : 'e+00');
    const [d, p] = exactDec(Math.abs(x));
    const [r, sh] = roundDigits(d, prec + 1);
    const exp = p - 1 + sh;
    const s = r[0] + (prec ? '.' + r.slice(1, prec + 1) : '');
    return s + (upper ? 'E' : 'e') + (exp < 0 ? '-' : '+') + String(Math.abs(exp)).padStart(2, '0');
  }
  function fmtG(x, prec, alt, upper) {
    if (!isFinite(x)) return isNaN(x) ? 'nan' : 'inf';
    const P = prec === 0 ? 1 : prec;
    let X;
    if (x === 0) X = 0;
    else { const [d, p] = exactDec(Math.abs(x)); const [, sh] = roundDigits(d, P); X = p - 1 + sh; }
    let s = P > X && X >= -4 ? fmtF(x, P - 1 - X) : fmtE(x, P - 1, upper);
    if (!alt) {
      if (s.includes('e') || s.includes('E')) s = s.replace(/\.?0+(?=[eE])/, '');
      else if (s.includes('.')) s = s.replace(/\.?0+$/, '');
    }
    return s;
  }
  // printf-style formatting; `take()` returns the next argument value
  // bytes (one char per byte) → text, for output that may hold UTF-8 sequences
  function utf8(bytes) { try { return decodeURIComponent(escape(bytes)); } catch (_) { return bytes; } }
  function formatC(fmt, take, readStr) {
    let out = '';
    for (let i = 0; i < fmt.length; i++) {
      const c = fmt[i];
      if (c !== '%') { out += c; continue; }
      let j = i + 1, flags = '';
      while ('-+ 0#'.includes(fmt[j]) && j < fmt.length) flags += fmt[j++];
      let width = '';
      if (fmt[j] === '*') { width = String(toNum(take())); j++; } else while (/[0-9]/.test(fmt[j])) width += fmt[j++];
      let prec = null;
      if (fmt[j] === '.') { j++; prec = ''; if (fmt[j] === '*') { prec = String(toNum(take())); j++; } else while (/[0-9]/.test(fmt[j])) prec += fmt[j++]; prec = +prec || 0; }
      let len = '';
      while ('hlLqjzt'.includes(fmt[j]) && j < fmt.length) len += fmt[j++];
      const conv = fmt[j];
      i = j;
      if (conv === '%') { out += '%'; continue; }
      if (conv === undefined) { out += '%' + flags + width; break; }
      let s = '', neg = false, numeric = true;
      const intBits = len === 'hh' ? 8 : len === 'h' ? 16 : (len === 'l' || len === 'll' || len === 'z' || len === 'j' || len === 't' || len === 'q') ? 64 : 32;
      if ('di'.includes(conv)) {
        const a = take(); let v = typeof a.v === 'bigint' ? BigInt.asIntN(intBits, a.v) : BigInt(Math.trunc(a.v));
        neg = v < 0n; s = (neg ? -v : v).toString();
        if (prec !== null) { s = prec === 0 && v === 0n ? '' : s.padStart(prec, '0'); }
      } else if ('uxXo'.includes(conv)) {
        const a = take(); let v = typeof a.v === 'bigint' ? BigInt.asUintN(intBits, a.v) : BigInt.asUintN(64, BigInt(Math.trunc(a.v)));
        s = v.toString(conv === 'o' ? 8 : conv === 'u' ? 10 : 16);
        if (conv === 'X') s = s.toUpperCase();
        if (prec !== null) s = prec === 0 && v === 0n ? '' : s.padStart(prec, '0');
        if (flags.includes('#') && v !== 0n) { if (conv === 'o') s = '0' + s; else if (conv === 'x' || conv === 'X') neg = conv; }
      } else if ('fFeEgGaA'.includes(conv)) {
        const a = take(); const x = typeof a.v === 'bigint' ? Number(a.v) : a.v;
        neg = x < 0 || Object.is(x, -0);
        const p = prec === null ? 6 : prec;
        s = 'fF'.includes(conv) ? fmtF(Math.abs(x), p) : 'eE'.includes(conv) ? fmtE(Math.abs(x), p, conv === 'E') : fmtG(Math.abs(x), p, flags.includes('#'), conv === 'G');
        if (conv === 'F' || conv === 'E' || conv === 'G') s = s.toUpperCase();
        if (flags.includes('#') && !s.includes('.') && /^\d+$/.test(s)) s += '.';
      } else if (conv === 'c') { numeric = false; s = String.fromCharCode(Number(BigInt.asUintN(8, take().v))); }
      else if (conv === 's') { numeric = false; const a = take(); s = readStr(a); if (prec !== null) s = s.slice(0, prec); }
      else if (conv === 'p') { numeric = false; const a = take(); s = a.v === 0 ? '(nil)' : hex(a.v); }
      else if (conv === 'n') { take(); continue; }
      else { out += '%' + flags + width + (prec !== null ? '.' + prec : '') + len + conv; continue; }
      let sign = numeric && 'dieEfFgG'.includes(conv) ? (neg ? '-' : flags.includes('+') ? '+' : flags.includes(' ') ? ' ' : '') : (neg === 'x' ? '0x' : neg === 'X' ? '0X' : '');
      const w = +width || 0;
      const total = sign.length + s.length;
      if (total < w) {
        if (flags.includes('-')) s = sign + s + ' '.repeat(w - total);
        else if (flags.includes('0') && numeric && (prec === null || 'fFeEgG'.includes(conv)) && isFinite(Number(s.replace(/[^0-9.]/g, '') || 0))) s = sign + '0'.repeat(w - total) + s;
        else s = ' '.repeat(w - total) + sign + s;
      } else s = sign + s;
      out += s;
    }
    return out;
  }

  /* ════════════════════════════════════════════════════════════════
     6. Interpreter
     ════════════════════════════════════════════════════════════════ */
  const BREAK = { sig: 'break' }, CONTINUE = { sig: 'continue' };
  class Return { constructor(v) { this.v = v; } }
  class Exit { constructor(code) { this.code = code; } }
  const LIBS = {
    'stdio.h': ['printf', 'fprintf', 'sprintf', 'snprintf', 'puts', 'putchar', 'scanf', 'getchar', 'fputs', 'fflush', 'perror'],
    'stdarg.h': ['va_start', 'va_end'], 'time.h': ['time'],
    'stdlib.h': ['malloc', 'calloc', 'realloc', 'free', 'exit', 'abs', 'atoi', 'atof', 'atol', 'qsort', 'rand', 'srand', 'labs'],
    'string.h': ['strlen', 'strcpy', 'strncpy', 'strcat', 'strncat', 'strcmp', 'strncmp', 'strchr', 'strrchr', 'strstr', 'strdup', 'memcpy', 'memset', 'memmove', 'memcmp', 'strtok'],
    'math.h': ['sqrt', 'pow', 'fabs', 'floor', 'ceil', 'sin', 'cos', 'tan', 'exp', 'log', 'log10', 'round', 'fmod'],
    'ctype.h': ['toupper', 'tolower', 'isdigit', 'isalpha', 'isalnum', 'isspace', 'isupper', 'islower', 'ispunct'],
  };
  const LIB_OF = {}; for (const [h, fs] of Object.entries(LIBS)) for (const f of fs) LIB_OF[f] = h;

  const STD_TYPEDEFS = [['size_t', T.ulong], ['ssize_t', T.long], ['ptrdiff_t', T.long], ['intptr_t', T.long], ['uintptr_t', T.ulong], ['time_t', T.long], ['clock_t', T.long],
    ['int8_t', T.schar], ['uint8_t', T.uchar], ['int16_t', T.short], ['uint16_t', T.ushort], ['int32_t', T.int], ['uint32_t', T.uint], ['int64_t', T.long], ['uint64_t', T.ulong],
    ['va_list', T.long]];
  class Interp {
    constructor(prog, info, opts) {
      this.mem = new Memory();
      this.info = info; this.opts = opts;
      this.out = ''; this.stdin = opts.stdin || ''; this.inPos = 0;
      this.trace = []; this.steps = 0; this.maxSteps = opts.maxSteps || 5000;
      this.funcs = new Map(); this.funcAddr = new Map(); this.globals = new Map();
      this.frames = []; this.sp = STACK_TOP - 256; // above main: the environment and the C runtime's own frames
      this.errors = []; this.warnings = [];
      this.statics = []; // { name, type, addr, fn }
      this.literals = new Map();
      this.allocs = 0; this.frees = 0; this.allocBytes = 0; this.nextBlockId = 1;
      this.strtokPtr = 0; this.randSeed = 1;
      this.prog = prog;
    }
    warn(msg, line) { if (!this.warnings.some(w => w.msg === msg && w.line === line)) this.warnings.push({ msg, line }); }

    /* ── raw bytes ── */
    check(a, n, write, line) {
      const m = this.mem;
      if (a >= STATIC_BASE && a + n <= m.staticTop) {
        if (write) for (const [s, e] of m.readonly) if (a < e && a + n > s) throw rterr('SIGSEGV', `Segmentation fault: writing to a string literal at ${hex(a)} (string literals are read-only)`, line);
        return;
      }
      if (a >= HEAP_BASE && a < HEAP_END) {
        const b = m.blockAt(a);
        if (b && b.alive && a >= b.base && a + n <= b.base + b.size) return;
        let where;
        if (b && !b.alive) where = `${a - b.base} bytes inside a block of size ${b.size} free'd at ${L(b.freeLine)}`;
        else if (b && a >= b.base + b.size) where = `${a - b.base - b.size} bytes after a block of size ${b.size} alloc'd at ${L(b.line)}`;
        else if (b && a < b.base) where = `${b.base - a} bytes before a block of size ${b.size} alloc'd at ${L(b.line)}`;
        else if (b) where = `${a - b.base} bytes inside a block of size ${b.size} alloc'd at ${L(b.line)}`;
        else throw rterr('SIGSEGV', `Segmentation fault: invalid ${write ? 'write' : 'read'} of size ${n} at ${hex(a)}`, line);
        this.errors.push({ kind: write ? 'Invalid write' : 'Invalid read', line, msg: `Invalid ${write ? 'write' : 'read'} of size ${n} at ${L(line)}: address ${hex(a)} is ${where}` });
        return;
      }
      if (a >= STACK_BOTTOM && a < STACK_TOP) {
        if (a < this.sp && !this.errors.some(x => x.kind === 'Dangling' && x.line === line)) this.errors.push({ kind: 'Dangling', line, msg: `${L(line)}: ${write ? 'writes' : 'reads'} ${hex(a)}, stack memory that belongs to no live variable — a function that has already returned (undefined behaviour)` });
        return;
      }
      throw rterr('SIGSEGV', a < 0x1000 ? `Segmentation fault: invalid ${write ? 'write' : 'read'} of size ${n} at address ${hex(a)} — dereferencing ${a === 0 ? 'a NULL pointer' : 'an address near NULL'}` : `Segmentation fault: invalid ${write ? 'write' : 'read'} of size ${n} at address ${hex(a)}, which is not stack'd, malloc'd or free'd`, line);
    }
    rd(a, n, line) {
      this.check(a, n, false, line);
      const s = this.mem.seg(a); if (!s) return new Uint8Array(n);
      return s[0].slice(s[2], s[2] + n);
    }
    wr(a, bytes, line) {
      this.check(a, bytes.length, true, line);
      const s = this.mem.seg(a); if (!s) return;
      s[0].set(bytes, s[2]);
      if (s[1]) s[1].fill(1, s[2], s[2] + bytes.length);
    }
    isDef(a, n) { const s = this.mem.seg(a); if (!s || !s[1]) return true; for (let k = 0; k < n; k++) if (!s[1][s[2] + k]) return false; return true; }
    undef(a, n) { const s = this.mem.seg(a); if (s && s[1]) s[1].fill(0, s[2], s[2] + n); }

    load(a, t, line, quiet) {
      if (t.k === 'array') return V(ptr(t.of), a);
      if (t.k === 'func') return V(ptr(t), a);
      if (t.k === 'struct') return V(t, this.rd(a, sizeOf(t), line));
      const n = sizeOf(t);
      const b = quiet ? this.peekBytes(a, n) : this.rd(a, n, line);
      if (t.k === 'float' || (t.k === 'float')) {
        const dv = new DataView(b.buffer, b.byteOffset, n);
        return V(t, n === 4 ? dv.getFloat32(0, true) : dv.getFloat64(0, true));
      }
      let v = 0n;
      for (let k = n - 1; k >= 0; k--) v = (v << 8n) | BigInt(b[k]);
      if (t.k === 'ptr') return V(t, Number(v));
      return V(t, wrapInt(v, t));
    }
    peekBytes(a, n) { const s = this.mem.seg(a); if (!s) return new Uint8Array(n); return s[0].slice(s[2], s[2] + n); }
    store(a, t, val, line) {
      if (t.k === 'struct') { this.wr(a, val.v, line); return; }
      const n = sizeOf(t), b = new Uint8Array(n);
      if (t.k === 'float') { const dv = new DataView(b.buffer); if (n === 4) dv.setFloat32(0, val.v, true); else dv.setFloat64(0, val.v, true); }
      else { let v = t.k === 'ptr' ? BigInt.asUintN(64, BigInt(val.v)) : BigInt.asUintN(n * 8, val.v); for (let k = 0; k < n; k++) { b[k] = Number(v & 255n); v >>= 8n; } }
      this.wr(a, b, line);
    }

    /* ── conversions ── */
    convert(val, to, line, ctx) {
      const from = val.t;
      to = to.k === 'enum' ? T.int : to;
      if (to.k === 'void') return V(T.void, 0n);
      if (to.k === 'struct') return val;
      if (to.k === 'float') { const x = typeof val.v === 'bigint' ? Number(val.v) : val.v; return V(to, to.size === 4 ? Math.fround(x) : x); }
      if (to.k === 'ptr') {
        if (from.k === 'ptr') return V(to, val.v);
        if (isInt(from)) return V(to, Number(BigInt.asUintN(64, val.v)));
        throw cerr(`incompatible type converting '${typeStr(from)}' to '${typeStr(to)}'`, line);
      }
      if (to.k === 'int') {
        if (from.k === 'float') { if (to === T.bool || to.name === '_Bool') return V(to, val.v !== 0 ? 1n : 0n); if (!isFinite(val.v)) return V(to, to.signed ? -(1n << (bits(to) - 1n)) : 0n); return V(to, wrapInt(BigInt(Math.trunc(val.v)), to)); }
        if (from.k === 'ptr') return V(to, wrapInt(BigInt(val.v), to));
        if (from.k === 'struct') throw cerr(`incompatible type converting 'struct ${from.tag}' to '${typeStr(to)}'`, line);
        return V(to, wrapInt(val.v, to));
      }
      return val;
    }
    promote(t) { if (t.k === 'enum') return T.int; if (t.k === 'int' && RANK[t.name] < 3) return T.int; return t; }
    usual(a, b) {
      if (a.k === 'float' || b.k === 'float') { if (a.size === 16 || b.size === 16) return T.ldouble; if ((a.k === 'float' && a.size === 8) || (b.k === 'float' && b.size === 8)) return T.double; return T.float; }
      a = this.promote(a); b = this.promote(b);
      if (a.name === b.name) return a;
      if (a.signed === b.signed) return RANK[a.name] >= RANK[b.name] ? a : b;
      const [u, s] = a.signed ? [b, a] : [a, b];
      if (RANK[u.name] >= RANK[s.name]) return u;
      if (s.size > u.size) return s;
      return { long: T.ulong, 'long long': T.ullong }[s.name] || T.uint;
    }

    /* ── scope and variables ── */
    frame() { return this.frames[this.frames.length - 1]; }
    tu() { const f = this.frame(); return f && f.fn.def && f.fn.def.tu != null ? f.fn.def.tu : this.curTU || 0; }
    lookup(name, line) {
      const f = this.frame();
      if (f) for (let k = f.scopes.length - 1; k >= 0; k--) if (f.scopes[k].has(name)) return f.scopes[k].get(name);
      const tu = this.tu();
      const g = this.globals.get(tu + ':' + name) || this.globals.get(name);
      if (g) return g;
      const fn = this.resolveFunc(name, tu);
      if (fn) return { name, type: fn.type, addr: fn.addr, isFn: true };
      throw cerr(`use of undeclared identifier '${name}'`, line);
    }
    resolveFunc(name, tu) { return this.funcs.get(tu + ':' + name) || this.funcs.get(name) || null; }
    allocLocal(type, line) {
      const n = Math.max(sizeOf(type), 1), al = alignOf(type);
      let a = Math.floor((this.sp - n) / al) * al;
      if (a < STACK_BOTTOM) throw rterr('SIGSEGV', 'Segmentation fault: stack overflow (too many nested calls — is there a base case?)', line);
      this.sp = a;
      return a;
    }
    literal(bytes) {
      const key = bytes.join(',');
      if (this.literals.has(key)) return this.literals.get(key);
      const a = this.mem.allocStatic(bytes.length + 1, 1);
      const s = this.mem.seg(a); s[0].set(bytes, s[2]); s[0][s[2] + bytes.length] = 0;
      this.mem.readonly.push([a, a + bytes.length + 1]);
      this.literals.set(key, a);
      return a;
    }

    /* ── snapshots ── */
    snap(line, note) {
      if (++this.steps > this.maxSteps) throw rterr('StepLimit', `stopped after ${this.maxSteps} steps (an endless loop?)`, line);
      this.trace.push({ line, note, outLen: this.out.length, frames: this.viewFrames(), heap: this.viewHeap(), statics: this.viewStatics(), errs: this.errors.length, sp: this.sp });
    }
    viewVar(name, type, addr) {
      return { name, type: typeStr(type), addr: hex(addr), a: addr, size: sizeOf(type), val: this.show(addr, type, 0), ptr: type.k === 'ptr' && this.isDef(addr, 8) ? this.ptrTarget(Number(this.peekInt(addr, 8))) : null };
    }
    peekInt(a, n) { const b = this.peekBytes(a, n); let v = 0n; for (let k = n - 1; k >= 0; k--) v = (v << 8n) | BigInt(b[k]); return v; }
    viewFrames() {
      return this.frames.map(f => ({ name: f.name, vars: f.vars.filter(v => v.live).map(v => this.viewVar(v.name, v.type, v.addr)) }));
    }
    viewHeap() {
      return this.mem.blocks.map(b => ({ id: b.id, a: b.base, addr: hex(b.base), size: b.size, alive: b.alive, line: b.line, freeLine: b.freeLine, how: b.how,
        val: b.alive ? this.showBlock(b) : '' }));
    }
    viewStatics() {
      return this.statics.map(s => ({ ...this.viewVar(s.name, s.type, s.addr), owner: s.owner }));
    }
    showBlock(b) {
      const et = b.elem && sizeOf(b.elem) > 0 && b.elem.k !== 'void' ? b.elem : T.uchar;
      const es = sizeOf(et), n = Math.floor(b.size / es);
      if (et.k === 'int' && et.size === 1 && (b.elem === T.char || !b.elem)) return this.showChars(b.base, b.size, !b.elem);
      if (n === 1 && et.k === 'struct') return this.show(b.base, et, 1);
      const items = [];
      for (let k = 0; k < Math.min(n, 16); k++) items.push(this.show(b.base + k * es, et, 1));
      return '{' + items.join(', ') + (n > 16 ? ', …' : '') + '}';
    }
    showChars(a, n, raw) {
      let s = '', allDef = true, term = false;
      const b = this.peekBytes(a, n);
      for (let k = 0; k < Math.min(n, 40); k++) {
        if (!this.isDef(a + k, 1)) { s += '?'; allDef = false; continue; }
        const c = b[k];
        if (c === 0) { s += '\\0'; term = true; if (!raw && k < n - 1 && this.restUnused(a + k + 1, n - k - 1)) break; continue; }
        s += c === 10 ? '\\n' : c === 9 ? '\\t' : c < 32 || c > 126 ? '\\x' + c.toString(16).padStart(2, '0') : String.fromCharCode(c);
      }
      if (n > 40) s += '…';
      return '"' + s + '"' + (allDef || term ? '' : '');
    }
    restUnused(a, n) { const b = this.peekBytes(a, n); for (let k = 0; k < n; k++) if (b[k] !== 0 && this.isDef(a + k, 1)) return false; return true; }
    show(a, t, depth) {
      if (t.k === 'array') {
        if (t.n == null) return '[]';
        if (t.of === T.char || t.of === T.uchar || t.of === T.schar) return this.showChars(a, t.n);
        const es = sizeOf(t.of), items = [];
        for (let k = 0; k < Math.min(t.n, 12); k++) items.push(this.show(a + k * es, t.of, depth + 1));
        return '{' + items.join(', ') + (t.n > 12 ? ', …' : '') + '}';
      }
      if (t.k === 'struct') {
        if (depth > 2) return '{…}';
        return '{' + t.fields.map(f => (t.fields.length > 1 || true ? '.' + f.name + ' = ' : '') + this.show(a + f.offset, f.type, depth + 1)).join(', ') + '}';
      }
      const n = sizeOf(t);
      if (!this.isDef(a, n)) return '?';
      const v = this.load(a, t, 0, true);
      if (t.k === 'ptr') return v.v === 0 ? 'NULL' : hex(v.v);
      if (t.k === 'float') return fmtG(v.v, t.size === 4 ? 6 : 10, false);
      if ((t === T.char || t === T.schar || t === T.uchar) && depth >= 0) {
        const c = Number(BigInt.asUintN(8, v.v));
        return (c >= 32 && c < 127 ? `'${c === 39 ? "\\'" : String.fromCharCode(c)}' ` : c === 0 ? "'\\0' " : c === 10 ? "'\\n' " : '') + v.v;
      }
      return String(v.v);
    }
    // a readable name for the thing an address points at
    ptrTarget(a) {
      if (a === 0) return { label: 'NULL', kind: 'null' };
      if (a >= CODE_BASE && a < STATIC_BASE) { for (const [n, f] of this.funcs) if (f.addr === a) return { label: n + '()', kind: 'code' }; return { label: 'code', kind: 'code' }; }
      const m = this.mem;
      for (const [s, e] of m.readonly) if (a >= s && a < e) { const str = this.showChars(s, e - s); return { label: (a === s ? '' : `${a - s} into `) + 'literal ' + str, kind: 'literal', a0: s, a }; }
      if (a >= HEAP_BASE && a < HEAP_END) {
        const b = m.blockAt(a);
        if (!b) return { label: 'heap (no block)', kind: 'bad' };
        const off = a - b.base;
        if (!b.alive) return { label: `block #${b.id} (freed)`, kind: 'freed', id: b.id };
        if (off < 0 || off >= b.size) return { label: off < 0 ? `before block #${b.id}` : `past the end of block #${b.id}`, kind: 'bad', id: b.id };
        const es = b.elem && b.elem.k !== 'void' ? sizeOf(b.elem) : 1;
        return { label: `block #${b.id}` + (off ? (off % es === 0 && es > 1 ? `[${off / es}]` : `+${off}`) : ''), kind: 'heap', id: b.id, a };
      }
      const all = [];
      for (const f of this.frames) for (const v of f.vars) if (v.live) all.push(v);
      for (const s of this.statics) all.push(s);
      for (const v of all) {
        const n = sizeOf(v.type);
        if (a >= v.addr && a < v.addr + Math.max(n, 1)) return { label: this.pathIn(v.name, v.type, a - v.addr), kind: 'var', a };
        if (a === v.addr + n && v.type.k === 'array') return { label: `one past ${v.name}`, kind: 'var', a };
      }
      if (a >= STACK_BOTTOM && a < STACK_TOP && a < this.sp) return { label: 'dead stack slot', kind: 'bad' };
      return { label: hex(a), kind: 'bad' };
    }
    pathIn(name, t, off) {
      if (off === 0 && t.k !== 'array' && t.k !== 'struct') return name;
      if (t.k === 'array') { const es = sizeOf(t.of); const k = Math.floor(off / es); return this.pathIn(`${name}[${k}]`, t.of, off - k * es); }
      if (t.k === 'struct') { for (let k = t.fields.length - 1; k >= 0; k--) { const f = t.fields[k]; if (off >= f.offset) return this.pathIn(`${name}.${f.name}`, f.type, off - f.offset); } }
      return off ? `${name}+${off}` : name;
    }

    /* ── program ── */
    run() {
      const tus = this.prog;
      let fi = 0;
      const place = (key, it) => {
        const old = this.funcs.get(key);
        if (it.k === 'fndef') {
          if (old && old.def) throw cerr(old.def.tu === it.tu ? `redefinition of '${it.name}'` : `duplicate symbol '${it.name}': defined in ${fileName(old.def.line)} and ${fileName(it.line)}`, it.line);
          this.funcs.set(key, { ...(old || {}), def: it, type: it.type, addr: old ? old.addr : CODE_BASE + 16 * fi++, name: it.name, line: it.line });
        } else if (!old) this.funcs.set(key, { proto: it, type: it.type, addr: CODE_BASE + 16 * fi++, name: it.name, line: it.line });
      };
      // a static function is visible in its own file only
      const staticIn = new Map();
      for (const tu of tus) for (const it of tu.items) if ((it.k === 'fndef' || it.k === 'proto') && it.storage === 'static') staticIn.set(tu.idx + ':' + it.name, true);
      for (const tu of tus) for (const it of tu.items) if (it.k === 'fndef') place(staticIn.has(tu.idx + ':' + it.name) ? tu.idx + ':' + it.name : it.name, it);
      for (const tu of tus) for (const it of tu.items) if (it.k === 'proto') place(staticIn.has(tu.idx + ':' + it.name) ? tu.idx + ':' + it.name : it.name, it);
      for (const f of this.funcs.values()) this.funcAddr.set(f.addr, f);
      // first declaration of each function in each file, for the implicit-declaration warning
      this.declPos = new Map();
      for (const tu of tus) tu.items.forEach(it => { if ((it.k === 'fndef' || it.k === 'proto') && !this.declPos.has(tu.idx + ':' + it.name)) this.declPos.set(tu.idx + ':' + it.name, it.pos); });
      this.tuIncludes = new Map(tus.map(tu => [tu.idx, tu.includes]));
      const mainFn = this.funcs.get('main');
      const snippet = !mainFn || !mainFn.def;
      // bare statements run as main's body; their declarations are main's locals, unless the snippet
      // also defines functions, which must be able to see them: then they are globals
      const snippetLocals = snippet && !tus[0].items.some(it => it.k === 'fndef');
      const mainBody = [];
      for (const tu of tus) {
        this.curTU = tu.idx;
        for (const it of tu.items) {
          if (it.k === 'decl') {
            if (snippetLocals && tu.idx === 0 && it.storage !== 'extern') { mainBody.push({ k: 'declstmt', decls: [it], line: it.line }); continue; }
            if (it.storage === 'extern') continue;
            const key = it.storage === 'static' ? tu.idx + ':' + it.name : it.name;
            const old = this.globals.get(key);
            if (old) { if (it.init && old.init) throw cerr(`redefinition of '${it.name}'`, it.line); if (it.init) { old.init = true; this.initialize(old.addr, old.type, it.init, it.line, true); } continue; }
            this.defineGlobal(it, key);
          } else if (it.k === 'stmt') { if (!snippet || tu.idx !== 0) throw cerr('expected declaration at file scope', it.s.line); mainBody.push(it.s); }
        }
      }
      // every extern must be defined somewhere
      for (const tu of tus) for (const it of tu.items) if (it.k === 'decl' && it.storage === 'extern' && !this.globals.has(it.name)) {
        if (snippet && tu.idx === 0) { this.defineGlobal({ ...it, storage: null }, it.name); continue; }
        throw cerr(`undefined reference to '${it.name}' (declared extern, but no file defines it)`, it.line);
      }
      this.curTU = 0;
      if (snippet) {
        const def = { name: 'main', params: [], tu: 0, pos: Infinity, body: { k: 'block', body: mainBody, line: mainBody.length ? mainBody[0].line : 1 }, type: fnT(T.int, [], false) };
        const main = { def, type: def.type, addr: CODE_BASE + 16 * fi++, name: 'main', snippet: true };
        this.funcs.set('main', main); this.funcAddr.set(main.addr, main);
      }
      const main = this.funcs.get('main');
      let code = 0;
      try {
        const args = [];
        if (main.def.params.length >= 2) {
          const argv = ['./a.out', ...(this.opts.args || [])];
          const strs = argv.map(s => this.literalW(s));
          const vec = this.mem.allocStatic(8 * (argv.length + 1), 8);
          strs.forEach((s, k) => this.store(vec + 8 * k, ptr(T.char), V(ptr(T.char), s), 0));
          this.store(vec + 8 * argv.length, ptr(T.char), V(ptr(T.char), 0), 0);
          args.push(V(T.int, BigInt(argv.length)), V(ptr(ptr(T.char)), vec));
        }
        const r = this.call(main, args, main.def.line || 1);
        code = r && typeof r.v === 'bigint' ? Number(BigInt.asIntN(32, r.v)) : 0;
      } catch (e) {
        if (e instanceof Exit) code = e.code;
        else throw e;
      }
      return code;
    }
    literalW(s) { const bytes = [...unescape(encodeURIComponent(s))].map(c => c.charCodeAt(0)); const a = this.mem.allocStatic(bytes.length + 1, 1); this.wr(a, new Uint8Array([...bytes, 0]), 0); return a; }
    defineGlobal(it, key) {
      let type = it.type;
      if (type.k === 'array' && type.n == null && type.nExpr) throw cerr('variable length array declaration not allowed at file scope', it.line);
      const a = this.mem.allocStatic(sizeOf(type), alignOf(type));
      const g = { name: it.name, type, addr: a, live: true, init: !!it.init };
      this.globals.set(key || it.name, g); this.statics.push(g);
      if (it.init) this.initialize(a, type, it.init, it.line, true);
    }

    call(fn, args, line) {
      if (!fn.def) {
        if (fn.builtin) return fn.builtin(args, line);
        throw cerr(`undefined reference to '${fn.name}'`, line);
      }
      const d = fn.def;
      const ps = d.params || [];
      if (!fn.type.variadic && !fn.type.noProto && args.length !== ps.length) throw cerr(`too ${args.length > ps.length ? 'many' : 'few'} arguments to function call, expected ${ps.length}, have ${args.length}`, line);
      const savedSp = this.sp;
      const f = { name: d.name, fn, scopes: [new Map()], vars: [], savedSp, line };
      if (this.frames.length > 2000) throw rterr('SIGSEGV', 'Segmentation fault: stack overflow', line);
      this.frames.push(f);
      this.sp -= 16; // return address and saved frame pointer
      ps.forEach((p, k) => {
        const t = p.type;
        const a = this.allocLocal(t, line);
        const v = { name: p.name || `(arg ${k + 1})`, type: t, addr: a, live: true };
        this.store(a, t, this.convert(args[k], t, line), line);
        if (p.name) f.scopes[0].set(p.name, v);
        f.vars.push(v);
      });
      if (fn.type.variadic) f.varargs = args.slice(ps.length).map(a => (a.t.k === 'float' ? V(T.double, a.v) : isInt(a.t) && RANK[a.t.name] < 3 ? V(T.int, a.v) : a));
      let ret = null;
      try { this.execBlock(d.body, true); }
      catch (e) { if (e instanceof Return) ret = e.v; else { throw e; } }
      const rt = fn.type.ret;
      if (ret && rt.k !== 'void') ret = this.convert(ret, rt, line);
      if (!ret && rt.k !== 'void') ret = d.name === 'main' ? V(T.int, 0n) : V(rt.k === 'float' ? rt : T.int, rt.k === 'float' ? 0 : 0n);
      this.snap(d.body.endLine || d.body.line, 'return');
      this.frames.pop();
      this.sp = savedSp;
      return ret;
    }

    execBlock(b, fnBody) {
      const f = this.frame();
      if (!fnBody) f.scopes.push(new Map());
      const mark = f.vars.length, savedSp = this.sp;
      try {
        // switch cases are handled by execSwitch; here statements run in order
        for (const s of b.body) this.exec(s);
      } finally {
        if (!fnBody) { f.scopes.pop(); for (let k = mark; k < f.vars.length; k++) f.vars[k].live = false; f.vars.length = mark; this.sp = savedSp; }
      }
    }
    exec(s) {
      switch (s.k) {
        case 'block': return this.execBlock(s);
        case 'declstmt': for (const d of s.decls) this.declareLocal(d); return;
        case 'expr': this.snap(s.line); this.eval(s.e); return;
        case 'empty': return;
        case 'if': this.snap(s.line); if (truthy(this.eval(s.c))) this.exec(s.a); else if (s.b) this.exec(s.b); return;
        case 'while':
          for (;;) {
            this.snap(s.line);
            if (!truthy(this.eval(s.c))) return;
            try { this.exec(s.body); } catch (e) { if (e === BREAK) return; if (e !== CONTINUE) throw e; }
          }
        case 'do':
          for (;;) {
            try { this.exec(s.body); } catch (e) { if (e === BREAK) return; if (e !== CONTINUE) throw e; }
            this.snap(s.cline);
            if (!truthy(this.eval(s.c))) return;
          }
        case 'for': {
          const f = this.frame(); f.scopes.push(new Map()); const mark = f.vars.length, savedSp = this.sp;
          try {
            if (s.init) this.exec(s.init);
            for (;;) {
              this.snap(s.line);
              if (s.c && !truthy(this.eval(s.c))) return;
              try { this.exec(s.body); } catch (e) { if (e === BREAK) return; if (e !== CONTINUE) throw e; }
              if (s.step) { this.snap(s.line, 'update'); this.eval(s.step); }
            }
          } finally { f.scopes.pop(); for (let k = mark; k < f.vars.length; k++) f.vars[k].live = false; f.vars.length = mark; this.sp = savedSp; }
        }
        case 'return': this.snap(s.line); throw new Return(s.e ? this.eval(s.e) : null);
        case 'break': this.snap(s.line); throw BREAK;
        case 'continue': this.snap(s.line); throw CONTINUE;
        case 'switch': return this.execSwitch(s);
        case 'case': case 'default': return;
        case 'fndef': throw cerr('function definition is not allowed here', s.line);
      }
      throw cerr('unsupported statement', s.line);
    }
    execSwitch(s) {
      this.snap(s.line);
      const v = this.eval(s.e);
      const body = s.body.k === 'block' ? s.body.body : [s.body];
      let start = body.findIndex(x => x.k === 'case' && x.v === BigInt.asIntN(64, v.v));
      if (start < 0) start = body.findIndex(x => x.k === 'default');
      if (start < 0) return;
      const f = this.frame(); f.scopes.push(new Map()); const mark = f.vars.length, savedSp = this.sp;
      try { for (let k = start; k < body.length; k++) this.exec(body[k]); }
      catch (e) { if (e !== BREAK) throw e; }
      finally { f.scopes.pop(); for (let k = mark; k < f.vars.length; k++) f.vars[k].live = false; f.vars.length = mark; this.sp = savedSp; }
    }
    declareLocal(d) {
      const f = this.frame();
      if (d.storage === 'extern') { return; }
      let type = d.type;
      if (type.k === 'array' && type.n == null && type.nExpr) {
        this.snap(d.line);
        const n = toNum(this.eval(type.nExpr));
        if (n <= 0) throw rterr('SIGSEGV', `variable length array with non-positive size ${n}`, d.line);
        type = arr(type.of, n);
      }
      if (type.k === 'struct' && !type.complete) throw cerr(`variable has incomplete type '${typeStr(type)}'`, d.line);
      if (f.scopes[f.scopes.length - 1].has(d.name)) throw cerr(`redefinition of '${d.name}'`, d.line);
      if (d.storage === 'static') {
        const key = f.name + '.' + d.name;
        let g = this.globals.get('@' + key);
        if (!g) {
          const a = this.mem.allocStatic(sizeOf(type), alignOf(type));
          g = { name: d.name, type, addr: a, live: true, owner: f.name };
          this.globals.set('@' + key, g); this.statics.push(g);
          if (d.init) this.initialize(a, type, d.init, d.line, true);
        }
        f.scopes[f.scopes.length - 1].set(d.name, g);
        return;
      }
      if (d.init) this.snap(d.line);
      const a = this.allocLocal(type, d.line);
      this.undef(a, sizeOf(type));
      const v = { name: d.name, type, addr: a, live: true };
      // the name is in scope from its declarator on, so `int *p = malloc(sizeof *p)` works
      f.scopes[f.scopes.length - 1].set(d.name, v);
      f.vars.push(v);
      if (d.init) this.initialize(a, type, d.init, d.line, false);
    }
    initialize(a, type, init, line, isStatic) {
      const isCharArr = t => t.k === 'array' && t.of.k === 'int' && t.of.size === 1;
      if (isCharArr(type) && (init.k === 'str' || (init.k === 'list' && init.items.length === 1 && init.items[0].v.k === 'str'))) {
        const str = init.k === 'str' ? init : init.items[0].v;
        const bytes = new Uint8Array(type.n);
        bytes.set(str.v.slice(0, type.n));
        if (str.v.length > type.n) this.warn('initializer-string for char array is too long', line);
        this.wr(a, bytes, line); return;
      }
      if (init.k === 'list' && (type.k === 'array' || type.k === 'struct')) {
        this.wr(a, new Uint8Array(sizeOf(type)), line);
        const cur = { i: 0 };
        this.initAggregate(a, type, init.items, cur, line, isStatic, true);
        if (cur.i < init.items.length) this.warn(`excess elements in ${type.k === 'array' ? 'array' : 'struct'} initializer`, line);
        return;
      }
      if (type.k === 'array') throw cerr('array initializer must be an initializer list', line);
      if (init.k === 'list') { if (!init.items.length) { this.store(a, type, this.convert(V(T.int, 0n), type, line), line); return; } init = init.items[0].v; }
      const v = this.eval(init);
      this.checkAssign(type, v, init, line, true);
      this.store(a, type, this.convert(v, type, line), line);
      this.hintHeap(type, v);
    }
    // fills the elements of an array or the fields of a struct from items[cur.i…]; a braced item
    // initialises one element, a bare value starts filling the element's own parts (brace elision)
    initAggregate(a, type, items, cur, line, isStatic, braced) {
      const n = type.k === 'array' ? type.n : type.fields.length;
      let k = 0;
      while (cur.i < items.length && (k < n || (braced && (items[cur.i].field || items[cur.i].index != null)))) {
        const it = items[cur.i];
        if (it.field || it.index != null) {
          if (!braced) return; // a designator belongs to the enclosing braces
          if (type.k === 'struct' && it.field) { k = type.fields.findIndex(f => f.name === it.field); if (k < 0) throw cerr(`field designator '${it.field}' does not refer to any field in type '${typeStr(type)}'`, line); }
          else if (type.k === 'array' && it.index != null) k = it.index;
          else throw cerr('designator does not match the type', line);
          if (k >= n) { this.warn('excess elements in initializer', line); cur.i++; continue; }
        }
        const et = type.k === 'array' ? type.of : type.fields[k].type;
        const ea = a + (type.k === 'array' ? k * sizeOf(type.of) : type.fields[k].offset);
        if (it.v.k === 'list' || !(et.k === 'array' || et.k === 'struct') || (et.k === 'array' && et.of.k === 'int' && et.of.size === 1 && it.v.k === 'str')) {
          this.initialize(ea, et, it.v, line, isStatic);
          cur.i++;
        } else {
          const sub = { i: cur.i };
          const plain = items.map(x => (x === it ? { ...x, field: null, index: null } : x));
          this.initAggregate(ea, et, plain, sub, line, isStatic, false);
          cur.i = sub.i;
        }
        k++;
      }
    }
    hintHeap(type, v) {
      if (type.k === 'ptr' && v.t.k === 'ptr' && typeof v.v === 'number' && v.v >= HEAP_BASE && v.v < HEAP_END) {
        const b = this.mem.blockAt(v.v);
        if (b && b.base === v.v && (!b.elem || b.elem.k === 'void') && type.to.k !== 'void') b.elem = unq(type.to);
      }
    }
    checkAssign(to, v, e, line) {
      if (isScalar(to) && v.t.k === 'struct') throw cerr(`initializing '${typeStr(to)}' with an expression of incompatible type '${typeStr(v.t)}'`, line);
      if (to.k === 'ptr' && isInt(v.t) && !(e && e.k === 'num' && e.v === 0n) && !(e && e.k === 'cast')) this.warn(`incompatible integer to pointer conversion initializing '${typeStr(to)}' with an expression of type '${typeStr(v.t)}'`, line);
      if (to.k === 'ptr' && v.t.k === 'ptr' && v.t.to.c && !to.to.c && to.to.k !== 'void') this.warn(`assigning to '${typeStr(to)}' from '${typeStr(v.t)}' discards qualifiers`, line);
      if (isInt(to) && v.t.k === 'ptr') this.warn(`incompatible pointer to integer conversion initializing '${typeStr(to)}' with an expression of type '${typeStr(v.t)}'`, line);
      if (to.k === 'struct' && (v.t.k !== 'struct' || v.t.tag !== to.tag)) throw cerr(`initializing '${typeStr(to)}' with an expression of incompatible type '${typeStr(v.t)}'`, line);
    }

    /* ── lvalues ── */
    lval(e) {
      switch (e.k) {
        case 'id': {
          const v = this.lookup(e.name, e.line);
          if (v.isFn) return { t: v.type, addr: v.addr, name: e.name, isFn: true };
          return { t: v.type, addr: v.addr, name: e.name };
        }
        case 'un':
          if (e.op === '*') {
            const p = this.eval(e.a);
            if (p.t.k !== 'ptr') throw cerr(`indirection requires pointer operand ('${typeStr(p.t)}' invalid)`, e.line);
            if (p.t.to.k === 'void') throw cerr('dereferencing a void pointer', e.line);
            return { t: p.t.to, addr: p.v, deref: true };
          }
          break;
        case 'idx': {
          let b = this.eval(e.a), i = this.eval(e.i);
          if (b.t.k !== 'ptr' && i.t.k === 'ptr') [b, i] = [i, b];
          if (b.t.k !== 'ptr') throw cerr(`subscripted value is not an array or pointer`, e.line);
          if (!isInt(i.t)) throw cerr('array subscript is not an integer', e.line);
          const et = b.t.to;
          const addr = b.v + Number(i.v) * sizeOf(et);
          // an index past a known array is compile-time visible to clang only for constants; checked at access
          return { t: et, addr, deref: true, arrInfo: this.arrayOf(e.a), index: Number(i.v) };
        }
        case 'mem': {
          let base, st;
          if (e.arrow) {
            const p = this.eval(e.a);
            if (p.t.k !== 'ptr' || p.t.to.k !== 'struct') throw cerr(`member reference type '${typeStr(p.t)}' is not a pointer to a struct`, e.line);
            st = p.t.to; base = p.v;
          } else {
            const l = this.lval(e.a);
            if (l.t.k !== 'struct') throw cerr(`member reference base type '${typeStr(l.t)}' is not a structure`, e.line);
            st = l.t; base = l.addr;
          }
          const f = st.fields && st.fields.find(x => x.name === e.name);
          if (!f) throw cerr(`no member named '${e.name}' in '${typeStr(st)}'`, e.line);
          return { t: st.c ? withConst(f.type, true) : f.type, addr: base + f.offset };
        }
        case 'str': { const a = this.literal(e.v); return { t: arr(T.char, e.v.length + 1), addr: a }; }
        case 'comma': this.eval(e.a); return this.lval(e.b);
      }
      throw cerr('expression is not assignable', e.line);
    }
    arrayOf(e) { if (e.k === 'id') { try { const v = this.lookup(e.name, e.line); if (v.type && v.type.k === 'array') return { name: e.name, n: v.type.n }; } catch (_) { /* not an array */ } } return null; }
    assertWritable(l, e, line) {
      if (l.t.c) {
        if (e.k === 'id') throw cerr(`cannot assign to variable '${e.name}' with const-qualified type '${typeStr(l.t)}'`, line);
        throw cerr('read-only variable is not assignable', line);
      }
      if (l.t.k === 'array') throw cerr(`array type '${typeStr(l.t)}' is not assignable`, line);
      if (l.isFn) throw cerr('non-object type is not assignable', line);
    }

    /* ── expressions ── */
    eval(e) {
      switch (e.k) {
        case 'num': return V(e.t, e.v);
        case 'str': return V(ptr(T.char), this.literal(e.v));
        case 'id': {
          const v = this.lookup(e.name, e.line);
          if (v.isFn) return V(ptr(v.type), v.addr);
          return this.load(v.addr, v.type, e.line);
        }
        case 'idx': case 'mem': { const l = this.lval(e); return this.load(l.addr, l.t, e.line); }
        case 'sizeofT': return V(SIZE_T, BigInt(sizeOf(e.t)));
        case 'sizeofE': return V(SIZE_T, BigInt(sizeOf(this.typeOf(e.a))));
        case 'cast': {
          const v = this.eval(e.a);
          if (e.t.k === 'struct') throw cerr('used type where arithmetic or pointer type is required', e.line);
          return this.convert(v, unq(e.t), e.line);
        }
        case 'cond': return truthy(this.eval(e.c)) ? this.eval(e.a) : this.eval(e.b);
        case 'comma': this.eval(e.a); return this.eval(e.b);
        case 'un': return this.unary(e);
        case 'pre': case 'post': return this.incdec(e);
        case 'assign': return this.assign(e);
        case 'bin': return this.binary(e);
        case 'call': return this.callExpr(e);
        case 'va_arg': {
          const l = this.lval(e.ap), f = this.frame();
          const k = Number(this.load(l.addr, l.t, e.line).v);
          if (!f.varargs || k >= f.varargs.length) throw rterr('SIGSEGV', 'va_arg read past the last variable argument', e.line);
          this.store(l.addr, l.t, V(l.t, BigInt(k + 1)), e.line);
          return this.convert(f.varargs[k], e.t, e.line);
        }
      }
      throw cerr('unsupported expression', e.line);
    }
    typeOf(e) {
      switch (e.k) {
        case 'num': return e.t;
        case 'str': return arr(T.char, e.v.length + 1);
        case 'id': return this.lookup(e.name, e.line).type;
        case 'idx': { const a = this.typeOf(e.a), i = this.typeOf(e.i); const p = a.k === 'array' || a.k === 'ptr' ? a : i; return p.k === 'array' ? p.of : p.to; }
        case 'mem': { let t = this.typeOf(e.a); if (e.arrow) t = t.k === 'array' ? t.of : t.to; const f = t.fields && t.fields.find(x => x.name === e.name); if (!f) throw cerr(`no member named '${e.name}' in '${typeStr(t)}'`, e.line); return f.type; }
        case 'un': {
          const a = this.typeOf(e.a);
          if (e.op === '*') return a.k === 'array' ? a.of : a.to;
          if (e.op === '&') return ptr(a);
          if (e.op === '!') return T.int;
          return this.promote(a);
        }
        case 'cast': return e.t;
        case 'sizeofT': case 'sizeofE': return SIZE_T;
        case 'call': { const f = this.typeOf(e.f); return (f.k === 'ptr' ? f.to : f).ret; }
        case 'assign': case 'pre': case 'post': return this.typeOf(e.a);
        case 'cond': return this.typeOf(e.a);
        case 'comma': return this.typeOf(e.b);
        case 'bin': {
          if (['<', '>', '<=', '>=', '==', '!=', '&&', '||'].includes(e.op)) return T.int;
          let a = this.typeOf(e.a), b = this.typeOf(e.b);
          if (a.k === 'array') a = ptr(a.of); if (b.k === 'array') b = ptr(b.of);
          if (a.k === 'ptr' && b.k === 'ptr') return T.long;
          if (a.k === 'ptr') return a; if (b.k === 'ptr') return b;
          if (e.op === '<<' || e.op === '>>') return this.promote(a);
          return this.usual(a, b);
        }
      }
      return T.int;
    }
    unary(e) {
      if (e.op === '&') {
        if (e.a.k === 'un' && e.a.op === '*') { const p = this.eval(e.a.a); return V(p.t, p.v); }
        const l = this.lval(e.a);
        return V(ptr(l.t), l.addr);
      }
      if (e.op === '*') {
        const l = this.lval(e);
        return this.load(l.addr, l.t, e.line);
      }
      const v = this.eval(e.a);
      if (e.op === '!') return V(T.int, truthy(v) ? 0n : 1n);
      if (!isArith(v.t)) throw cerr(`invalid argument type '${typeStr(v.t)}' to unary expression`, e.line);
      const t = this.promote(v.t);
      const x = this.convert(v, t, e.line);
      switch (e.op) {
        case '+': return x;
        case '-': return V(t, t.k === 'float' ? -x.v : wrapInt(-x.v, t));
        case '~': if (t.k === 'float') throw cerr("invalid argument type 'double' to unary expression", e.line); return V(t, wrapInt(~x.v, t));
      }
    }
    incdec(e) {
      const l = this.lval(e.a);
      this.assertWritable(l, e.a, e.line);
      const old = this.load(l.addr, l.t, e.line);
      const d = e.op === '++' ? 1 : -1;
      let nv;
      if (l.t.k === 'ptr') nv = V(l.t, old.v + d * sizeOf(l.t.to));
      else if (l.t.k === 'float') nv = V(l.t, old.v + d);
      else nv = V(l.t, wrapInt(old.v + BigInt(d), l.t));
      this.store(l.addr, l.t, nv, e.line);
      return e.k === 'pre' ? nv : old;
    }
    assign(e) {
      const l = this.lval(e.a);
      this.assertWritable(l, e.a, e.line);
      let v;
      if (e.op === '=') {
        v = this.eval(e.b);
        if (l.t.k === 'struct') { if (v.t.k !== 'struct' || v.t.tag !== l.t.tag) throw cerr(`assigning to '${typeStr(l.t)}' from incompatible type '${typeStr(v.t)}'`, e.line); }
        else this.checkAssign(l.t, v, e.b, e.line);
      } else {
        const cur = this.load(l.addr, l.t, e.line);
        v = this.arith(e.op.slice(0, -1), cur, this.eval(e.b), e.line);
      }
      const cv = this.convert(v, l.t, e.line);
      this.store(l.addr, l.t, cv, e.line);
      this.hintHeap(l.t, v);
      return cv;
    }
    binary(e) {
      if (e.op === '&&') { if (!truthy(this.eval(e.a))) return V(T.int, 0n); return V(T.int, truthy(this.eval(e.b)) ? 1n : 0n); }
      if (e.op === '||') { if (truthy(this.eval(e.a))) return V(T.int, 1n); return V(T.int, truthy(this.eval(e.b)) ? 1n : 0n); }
      return this.arith(e.op, this.eval(e.a), this.eval(e.b), e.line);
    }
    arith(op, a, b, line) {
      if (a.t.k === 'ptr' || b.t.k === 'ptr') {
        if (['+', '-'].includes(op) && a.t.k === 'ptr' && isInt(b.t)) return V(a.t, a.v + (op === '+' ? 1 : -1) * Number(b.v) * sizeOf(a.t.to.k === 'void' ? T.char : a.t.to));
        if (op === '+' && b.t.k === 'ptr' && isInt(a.t)) return V(b.t, b.v + Number(a.v) * sizeOf(b.t.to));
        if (op === '-' && a.t.k === 'ptr' && b.t.k === 'ptr') return V(T.long, BigInt(Math.trunc((a.v - b.v) / sizeOf(a.t.to))));
        const x = a.t.k === 'ptr' ? a.v : Number(a.v), y = b.t.k === 'ptr' ? b.v : Number(b.v);
        switch (op) {
          case '==': return V(T.int, x === y ? 1n : 0n); case '!=': return V(T.int, x !== y ? 1n : 0n);
          case '<': return V(T.int, x < y ? 1n : 0n); case '>': return V(T.int, x > y ? 1n : 0n);
          case '<=': return V(T.int, x <= y ? 1n : 0n); case '>=': return V(T.int, x >= y ? 1n : 0n);
        }
        throw cerr(`invalid operands to binary expression ('${typeStr(a.t)}' and '${typeStr(b.t)}')`, line);
      }
      if (!isArith(a.t) || !isArith(b.t)) throw cerr(`invalid operands to binary expression ('${typeStr(a.t)}' and '${typeStr(b.t)}')`, line);
      if (op === '<<' || op === '>>') {
        const t = this.promote(a.t); const x = this.convert(a, t, line).v, y = Number(this.convert(b, this.promote(b.t), line).v);
        if (t.k === 'float') throw cerr("invalid operands to binary expression ('double' and 'int')", line);
        return V(t, wrapInt(op === '<<' ? x << BigInt(y) : x >> BigInt(y), t));
      }
      const t = this.usual(a.t, b.t);
      const x = this.convert(a, t, line).v, y = this.convert(b, t, line).v;
      const cmp = r => V(T.int, r ? 1n : 0n);
      if (t.k === 'float') {
        const f = r => V(t, t.size === 4 ? Math.fround(r) : r);
        switch (op) {
          case '+': return f(x + y); case '-': return f(x - y); case '*': return f(x * y); case '/': return f(x / y);
          case '%': throw cerr(`invalid operands to binary expression ('${typeStr(a.t)}' and '${typeStr(b.t)}')`, line);
          case '<': return cmp(x < y); case '>': return cmp(x > y); case '<=': return cmp(x <= y); case '>=': return cmp(x >= y);
          case '==': return cmp(x === y); case '!=': return cmp(x !== y);
          default: throw cerr(`invalid operands to binary expression ('${typeStr(a.t)}' and '${typeStr(b.t)}')`, line);
        }
      }
      switch (op) {
        case '+': return V(t, wrapInt(x + y, t)); case '-': return V(t, wrapInt(x - y, t)); case '*': return V(t, wrapInt(x * y, t));
        case '/': if (y === 0n) throw rterr('SIGFPE', 'Floating point exception: integer division by zero', line); return V(t, wrapInt(x / y, t));
        case '%': if (y === 0n) throw rterr('SIGFPE', 'Floating point exception: integer division by zero', line); return V(t, wrapInt(x % y, t));
        case '&': return V(t, wrapInt(x & y, t)); case '|': return V(t, wrapInt(x | y, t)); case '^': return V(t, wrapInt(x ^ y, t));
        case '<': return cmp(x < y); case '>': return cmp(x > y); case '<=': return cmp(x <= y); case '>=': return cmp(x >= y);
        case '==': return cmp(x === y); case '!=': return cmp(x !== y);
      }
      throw cerr(`unsupported operator ${op}`, line);
    }

    callExpr(e) {
      let fn = null;
      if (e.f.k === 'id') {
        const name = e.f.name;
        const tu = this.tu();
        const local = this.frame() && this.frame().scopes.some(s => s.has(name));
        if (!local && !this.globals.has(name) && !this.globals.has(tu + ':' + name)) {
          const found = this.resolveFunc(name, tu);
          if (found) {
            fn = found;
            const here = this.frame() && this.frame().fn.def ? this.frame().fn.def.pos : Infinity;
            const decl = this.declPos.get(tu + ':' + name);
            if (decl == null) this.warn(`implicit declaration of function '${name}' is invalid in C99 — this file has no prototype for it (include its header)`, e.line);
            else if (decl > here) this.warn(`implicit declaration of function '${name}' is invalid in C99 — it is declared further down: put a prototype above the call`, e.line);
          } else if (this.funcs.has(name) || [...this.funcs.keys()].some(k => k.endsWith(':' + name))) {
            throw cerr(`undefined reference to '${name}' — it is static in another file, so it is invisible here`, e.line);
          } else if (BUILTINS[name]) {
            if (!(this.tuIncludes.get(tu) || new Set()).has(LIB_OF[name])) this.warn(`implicitly declaring library function '${name}' — include the header <${LIB_OF[name]}>`, e.line);
            fn = { name, builtin: (args, line) => BUILTINS[name].call(this, args, line, e) };
          } else throw cerr(`call to undeclared function '${name}'; ISO C99 and later do not support implicit function declarations`, e.line);
        }
      }
      if (!fn) {
        const fv = this.eval(e.f);
        const ft = fv.t.k === 'ptr' ? fv.t.to : fv.t;
        if (ft.k !== 'func') throw cerr(`called object type '${typeStr(fv.t)}' is not a function or function pointer`, e.line);
        fn = this.funcAddr.get(fv.v);
        if (!fn) throw rterr('SIGSEGV', `Segmentation fault: calling through a pointer that does not point to a function (${hex(fv.v)})`, e.line);
      }
      const args = e.args.map(a => this.eval(a));
      if (fn.builtin) return fn.builtin(args, e.line);
      // default argument promotions for variadic arguments; conversion to parameter types happens in call()
      return this.call(fn, args, e.line);
    }

    /* ── helpers for the library ── */
    cstr(a, line) {
      if (a === 0) throw rterr('SIGSEGV', 'Segmentation fault: reading a string through a NULL pointer', line);
      const bytes = [];
      for (let k = 0; ; k++) { const b = this.rd(a + k, 1, line)[0]; if (b === 0) break; bytes.push(b); if (k > 100000) break; }
      return bytes;
    }
    cstrS(a, line) { return String.fromCharCode(...this.cstr(a, line)); }
    emit(s) { this.out += s; }
    malloc(size, line, how, zero) {
      const n = Number(size);
      if (n < 0 || n > HEAP_END - this.mem.heapTop - REDZONE) return 0;
      const base = Math.ceil(this.mem.heapTop / 16) * 16;
      this.mem.heapTop = base + n + REDZONE;
      this.mem.growHeap(this.mem.heapTop);
      const b = { id: this.nextBlockId++, base, size: n, alive: true, line, how, elem: null };
      this.mem.blocks.push(b);
      const off = base - HEAP_BASE;
      if (zero) { this.mem.heap.fill(0, off, off + n); this.mem.heapDef.fill(1, off, off + n); } else this.mem.heapDef.fill(0, off, off + n);
      this.allocs++; this.allocBytes += n;
      return base;
    }
    free(a, line) {
      if (a === 0) return;
      const b = this.mem.blockAt(a);
      if (!b || b.base !== a) {
        this.errors.push({ kind: 'Invalid free', line, msg: `Invalid free() at ${L(line)}: ${hex(a)} is ${b ? `${a - b.base} bytes inside a block of size ${b.size} alloc'd at ${L(b.line)}` : a >= STACK_BOTTOM ? 'on the stack, not a heap block' : 'not the start of a heap block'}` });
        return;
      }
      if (!b.alive) {
        this.errors.push({ kind: 'Invalid free', line, msg: `Invalid free() at ${L(line)}: block #${b.id} (size ${b.size}, alloc'd at ${L(b.line)}) was already free'd at ${L(b.freeLine)} — a double free` });
        throw rterr('SIGABRT', 'free(): double free detected in tcache 2 — Aborted (core dumped)', line);
      }
      b.alive = false; b.freeLine = line; this.frees++;
      // the allocator reuses the first bytes of a free block for its own bookkeeping
      const off = b.base - HEAP_BASE;
      for (let k = 0; k < Math.min(16, b.size); k++) this.mem.heap[off + k] = [0x10, 0x52, 0x85, 0x9c, 0x55, 0x55, 0, 0, 0x7a, 0x3c, 0xe1, 0x04, 0x66, 0x2b, 0x91, 0xd8][k];
    }
    leakReport() {
      const live = this.mem.blocks.filter(b => b.alive);
      // reachability from the static data (the stack is gone at exit)
      const reach = new Set();
      const scan = (lo, hi) => {
        for (let a = lo; a + 8 <= hi; a += 8) {
          const v = Number(this.peekInt(a, 8));
          const b = v >= HEAP_BASE && v < HEAP_END ? this.mem.blockAt(v) : null;
          if (b && b.alive && !reach.has(b) && v >= b.base && v < b.base + b.size) { reach.add(b); scan(b.base, b.base + b.size); }
        }
      };
      scan(STATIC_BASE, this.mem.staticTop);
      if (this.frames.length) scan(Math.floor(this.sp / 8) * 8, STACK_TOP); // exit() leaves the frames alive
      const direct = new Set(reach);
      const pointedByLost = new Set();
      for (const b of live) if (!reach.has(b)) {
        for (let a = b.base; a + 8 <= b.base + b.size; a += 8) {
          const v = Number(this.peekInt(a, 8));
          const t = v >= HEAP_BASE && v < HEAP_END ? this.mem.blockAt(v) : null;
          if (t && t.alive && t !== b && !reach.has(t)) pointedByLost.add(t);
        }
      }
      return {
        inUse: live.reduce((s, b) => s + b.size, 0), blocks: live.length, allocs: this.allocs, frees: this.frees, bytes: this.allocBytes,
        lost: live.filter(b => !reach.has(b)).map(b => ({ id: b.id, size: b.size, line: b.line, kind: pointedByLost.has(b) ? 'indirectly lost' : 'definitely lost' })),
        reachable: live.filter(b => direct.has(b)).map(b => ({ id: b.id, size: b.size, line: b.line })),
      };
    }
  }

  /* ════════════════════════════════════════════════════════════════
     7. The standard library subset
     ════════════════════════════════════════════════════════════════ */
  const num = v => (typeof v.v === 'bigint' ? Number(v.v) : v.v);
  const I = v => V(T.int, BigInt(v));
  const D = v => V(T.double, v);
  const P = (v, t) => V(ptr(t || T.void), v);
  function printfArgs(self, args, line) { let k = 0; return () => { if (k >= args.length) { self.warn('more \'%\' conversions than data arguments', line); return V(T.int, 0n); } const a = args[k++]; return a.t.k === 'float' && a.t.size === 4 ? V(T.double, a.v) : a; }; }
  function doFormat(self, fmtArg, rest, line) {
    const fmt = self.cstrS(fmtArg.v, line);
    return formatC(fmt, printfArgs(self, rest, line), a => (a.v === 0 ? '(null)' : self.cstrS(a.v, line)));
  }
  const BUILTINS = {
    printf(args, line) { const s = doFormat(this, args[0], args.slice(1), line); this.emit(s); return I(s.length); },
    fprintf(args, line) { const s = doFormat(this, args[1], args.slice(2), line); this.emit(s); return I(s.length); },
    sprintf(args, line) { const s = doFormat(this, args[1], args.slice(2), line); this.wr(args[0].v, new Uint8Array([...s].map(c => c.charCodeAt(0)).concat([0])), line); return I(s.length); },
    snprintf(args, line) { const s = doFormat(this, args[2], args.slice(3), line); const n = num(args[1]); if (n > 0) { const b = [...s.slice(0, n - 1)].map(c => c.charCodeAt(0)); this.wr(args[0].v, new Uint8Array(b.concat([0])), line); } return I(s.length); },
    puts(args, line) { this.emit(this.cstrS(args[0].v, line) + '\n'); return I(1); },
    fputs(args, line) { this.emit(this.cstrS(args[0].v, line)); return I(1); },
    putchar(args) { this.emit(String.fromCharCode(num(args[0]) & 255)); return I(num(args[0]) & 255); },
    fflush() { return I(0); },
    perror(args, line) { this.emit(this.cstrS(args[0].v, line) + ': error\n'); return V(T.void, 0n); },
    getchar() { if (this.inPos >= this.stdin.length) return I(-1); return I(this.stdin.charCodeAt(this.inPos++)); },
    scanf(args, line) {
      const fmt = this.cstrS(args[0].v, line); let ai = 1, count = 0;
      const inp = this.stdin;
      const skipWs = () => { while (this.inPos < inp.length && /\s/.test(inp[this.inPos])) this.inPos++; };
      for (let i = 0; i < fmt.length; i++) {
        const c = fmt[i];
        if (/\s/.test(c)) { skipWs(); continue; }
        if (c !== '%') { if (inp[this.inPos] === c) { this.inPos++; continue; } break; }
        let j = i + 1, suppress = false, width = '';
        if (fmt[j] === '*') { suppress = true; j++; }
        while (/[0-9]/.test(fmt[j])) width += fmt[j++];
        let len = ''; while ('hlL'.includes(fmt[j])) len += fmt[j++];
        const conv = fmt[j]; i = j;
        if (conv === '%') { skipWs(); if (inp[this.inPos] === '%') { this.inPos++; continue; } break; }
        if (conv !== 'c') skipWs();
        if (this.inPos >= inp.length) { if (count === 0) return I(-1); break; }
        const w = +width || Infinity;
        let m;
        const rest = inp.slice(this.inPos, this.inPos + (w === Infinity ? inp.length : w));
        if ('di'.includes(conv)) m = /^[-+]?\d+/.exec(rest);
        else if (conv === 'u') m = /^\+?\d+/.exec(rest);
        else if ('feg'.includes(conv)) m = /^[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?/.exec(rest);
        else if (conv === 's') m = /^\S+/.exec(rest);
        else if (conv === 'c') m = { 0: rest.slice(0, width ? w : 1) };
        else if (conv === 'x') m = /^[-+]?(0[xX])?[0-9a-fA-F]+/.exec(rest);
        if (!m || !m[0]) break;
        this.inPos += m[0].length;
        if (suppress) continue;
        const dst = args[ai++]; if (!dst) break;
        const dt = dst.t.k === 'ptr' ? dst.t.to : T.int;
        if ('diux'.includes(conv)) { const v = conv === 'x' ? BigInt(/^[-+]?0[xX]/.test(m[0]) ? m[0] : (m[0][0] === '-' ? '-0x' + m[0].slice(1) : '0x' + m[0].replace(/^\+/, ''))) : BigInt(m[0]); const t = len === 'l' || len === 'll' ? (conv === 'u' ? T.ulong : T.long) : len === 'h' ? T.short : len === 'hh' ? T.char : conv === 'u' ? T.uint : T.int; this.store(dst.v, t, V(t, wrapInt(v, t)), line); }
        else if ('feg'.includes(conv)) { const t = len === 'l' ? T.double : len === 'L' ? T.double : T.float; this.store(dst.v, t, V(t, t === T.float ? Math.fround(parseFloat(m[0])) : parseFloat(m[0])), line); }
        else if (conv === 's') this.wr(dst.v, new Uint8Array([...m[0]].map(ch => ch.charCodeAt(0)).concat([0])), line);
        else if (conv === 'c') this.wr(dst.v, new Uint8Array([...m[0]].map(ch => ch.charCodeAt(0))), line);
        void dt;
        count++;
      }
      return I(count);
    },
    malloc(args, line) { const a = this.malloc(num(args[0]), line, 'malloc'); return P(a); },
    calloc(args, line) { const a = this.malloc(num(args[0]) * num(args[1]), line, 'calloc', true); return P(a); },
    realloc(args, line) {
      const old = args[0].v, n = num(args[1]);
      if (old === 0) return P(this.malloc(n, line, 'realloc'));
      const b = this.mem.blockAt(old);
      if (!b || b.base !== old || !b.alive) { this.free(old, line); return P(0); }
      const a = this.malloc(n, line, 'realloc');
      if (!a) return P(0); // the old block stays allocated
      const k = Math.min(n, b.size);
      const src = this.mem.seg(old), dst = this.mem.seg(a);
      dst[0].set(src[0].slice(src[2], src[2] + k), dst[2]);
      dst[1].set(src[1].slice(src[2], src[2] + k), dst[2]);
      this.mem.blocks[this.mem.blocks.length - 1].elem = b.elem;
      this.allocs--; this.allocs++; // realloc counts as one alloc and one free, as valgrind does
      this.free(old, line);
      return P(a);
    },
    free(args, line) { this.free(args[0].v, line); return V(T.void, 0n); },
    exit(args) { throw new Exit(num(args[0])); },
    abs(args) { return I(Math.abs(num(args[0]))); },
    labs(args) { return V(T.long, BigInt(Math.abs(num(args[0])))); },
    atoi(args, line) { const m = /^\s*[-+]?\d+/.exec(this.cstrS(args[0].v, line)); return I(m ? wrapInt(BigInt(m[0].trim()), T.int) : 0); },
    atol(args, line) { const m = /^\s*[-+]?\d+/.exec(this.cstrS(args[0].v, line)); return V(T.long, m ? BigInt(m[0].trim()) : 0n); },
    atof(args, line) { const v = parseFloat(this.cstrS(args[0].v, line)); return D(isNaN(v) ? 0 : v); },
    rand() { this.randSeed = (this.randSeed * 1103515245 + 12345) % 2147483648; return I(this.randSeed); },
    srand(args) { this.randSeed = num(args[0]); return V(T.void, 0n); },
    qsort(args, line) {
      const base = args[0].v, n = num(args[1]), size = num(args[2]), cmp = this.funcAddr.get(args[3].v);
      if (!cmp) throw rterr('SIGSEGV', 'qsort: the comparison argument is not a function', line);
      const items = []; for (let k = 0; k < n; k++) items.push(this.rd(base + k * size, size, line));
      const tmpA = this.mem.allocStatic(size, 16), tmpB = this.mem.allocStatic(size, 16);
      // insertion sort: stable and easy to follow in the stepper
      for (let i = 1; i < n; i++) {
        const x = items[i]; let j = i - 1;
        for (;;) {
          if (j < 0) break;
          this.wr(tmpA, items[j], line); this.wr(tmpB, x, line);
          const r = this.call(cmp, [P(tmpA), P(tmpB)], line);
          if (Number(r.v) <= 0) break;
          items[j + 1] = items[j]; j--;
        }
        items[j + 1] = x;
      }
      items.forEach((b, k) => this.wr(base + k * size, b, line));
      return V(T.void, 0n);
    },
    strlen(args, line) { return V(SIZE_T, BigInt(this.cstr(args[0].v, line).length)); },
    strcpy(args, line) { const s = this.cstr(args[1].v, line); this.wr(args[0].v, new Uint8Array([...s, 0]), line); return P(args[0].v, T.char); },
    strncpy(args, line) { const s = this.cstr(args[1].v, line), n = num(args[2]); const b = new Uint8Array(n); b.set(s.slice(0, n)); this.wr(args[0].v, b, line); return P(args[0].v, T.char); },
    strcat(args, line) { const d = this.cstr(args[0].v, line), s = this.cstr(args[1].v, line); this.wr(args[0].v + d.length, new Uint8Array([...s, 0]), line); return P(args[0].v, T.char); },
    strncat(args, line) { const d = this.cstr(args[0].v, line), s = this.cstr(args[1].v, line).slice(0, num(args[2])); this.wr(args[0].v + d.length, new Uint8Array([...s, 0]), line); return P(args[0].v, T.char); },
    strcmp(args, line) { const a = this.cstr(args[0].v, line), b = this.cstr(args[1].v, line); for (let k = 0; ; k++) { const x = a[k] || 0, y = b[k] || 0; if (x !== y || !x) return I(x - y); } },
    strncmp(args, line) { const a = this.cstr(args[0].v, line), b = this.cstr(args[1].v, line), n = num(args[2]); for (let k = 0; k < n; k++) { const x = a[k] || 0, y = b[k] || 0; if (x !== y || !x) return I(x - y); } return I(0); },
    strchr(args, line) { const s = this.cstr(args[0].v, line), c = num(args[1]) & 255; const k = c === 0 ? s.length : s.indexOf(c); return P(k < 0 ? 0 : args[0].v + k, T.char); },
    strrchr(args, line) { const s = this.cstr(args[0].v, line), c = num(args[1]) & 255; const k = c === 0 ? s.length : s.lastIndexOf(c); return P(k < 0 ? 0 : args[0].v + k, T.char); },
    strstr(args, line) { const s = this.cstrS(args[0].v, line), t = this.cstrS(args[1].v, line); const k = s.indexOf(t); return P(k < 0 ? 0 : args[0].v + k, T.char); },
    strdup(args, line) { const s = this.cstr(args[0].v, line); const a = this.malloc(s.length + 1, line, 'strdup'); this.wr(a, new Uint8Array([...s, 0]), line); this.mem.blocks[this.mem.blocks.length - 1].elem = T.char; return P(a, T.char); },
    memcpy(args, line) { const b = this.rd(args[1].v, num(args[2]), line); this.wr(args[0].v, b, line); return P(args[0].v); },
    memmove(args, line) { const b = this.rd(args[1].v, num(args[2]), line); this.wr(args[0].v, b, line); return P(args[0].v); },
    memset(args, line) { this.wr(args[0].v, new Uint8Array(num(args[2])).fill(num(args[1]) & 255), line); return P(args[0].v); },
    memcmp(args, line) { const a = this.rd(args[0].v, num(args[2]), line), b = this.rd(args[1].v, num(args[2]), line); for (let k = 0; k < a.length; k++) if (a[k] !== b[k]) return I(a[k] - b[k]); return I(0); },
    strtok(args, line) {
      const delim = this.cstr(args[1].v, line);
      let p = args[0].v || this.strtokPtr;
      if (!p) return P(0, T.char);
      const at = k => this.rd(p + k, 1, line)[0];
      let k = 0; while (at(k) && delim.includes(at(k))) k++;
      if (!at(k)) { this.strtokPtr = 0; return P(0, T.char); }
      const start = p + k;
      while (at(k) && !delim.includes(at(k))) k++;
      if (at(k)) { this.wr(p + k, new Uint8Array([0]), line); this.strtokPtr = p + k + 1; } else this.strtokPtr = 0;
      return P(start, T.char);
    },
    va_start(args, line, e) { const l = this.lval(e.args[0]); this.store(l.addr, l.t, V(l.t, 0n), line); return V(T.void, 0n); },
    va_end() { return V(T.void, 0n); },
    time(args, line) { const t = V(T.long, 1700000000n); if (args[0] && args[0].v) this.store(args[0].v, T.long, t, line); return t; },
    sqrt(a) { return D(Math.sqrt(num(a[0]))); }, pow(a) { return D(Math.pow(num(a[0]), num(a[1]))); }, fabs(a) { return D(Math.abs(num(a[0]))); },
    floor(a) { return D(Math.floor(num(a[0]))); }, ceil(a) { return D(Math.ceil(num(a[0]))); }, round(a) { const x = num(a[0]); return D(Math.sign(x) * Math.round(Math.abs(x))); },
    sin(a) { return D(Math.sin(num(a[0]))); }, cos(a) { return D(Math.cos(num(a[0]))); }, tan(a) { return D(Math.tan(num(a[0]))); },
    exp(a) { return D(Math.exp(num(a[0]))); }, log(a) { return D(Math.log(num(a[0]))); }, log10(a) { return D(Math.log10(num(a[0]))); }, fmod(a) { return D(num(a[0]) % num(a[1])); },
    toupper(a) { const c = num(a[0]); return I(c >= 97 && c <= 122 ? c - 32 : c); }, tolower(a) { const c = num(a[0]); return I(c >= 65 && c <= 90 ? c + 32 : c); },
    isdigit(a) { const c = num(a[0]); return I(c >= 48 && c <= 57 ? 2048 : 0); }, isalpha(a) { const c = num(a[0]) | 32; return I(c >= 97 && c <= 122 ? 1024 : 0); },
    isalnum(a) { const c = num(a[0]); return I((c >= 48 && c <= 57) || ((c | 32) >= 97 && (c | 32) <= 122) ? 8 : 0); }, isspace(a) { const c = num(a[0]); return I(c === 32 || (c >= 9 && c <= 13) ? 8192 : 0); },
    isupper(a) { const c = num(a[0]); return I(c >= 65 && c <= 90 ? 256 : 0); }, islower(a) { const c = num(a[0]); return I(c >= 97 && c <= 122 ? 512 : 0); },
    ispunct(a) { const c = num(a[0]); return I(c > 32 && c < 127 && !((c >= 48 && c <= 57) || ((c | 32) >= 97 && (c | 32) <= 122)) ? 4 : 0); },
  };
  // stdout / stderr are only used as the first argument of fprintf / fputs
  const STD_STREAMS = ['stdout', 'stderr'];

  /* ════════════════════════════════════════════════════════════════
     8. Entry point
     ════════════════════════════════════════════════════════════════ */
  let FILES = ['main.c'];
  const fileName = line => FILES[Math.floor((line || 0) / LINE_BASE)] || 'main.c';
  function L(line) { if (line == null) return 'exit'; const f = Math.floor(line / LINE_BASE), n = line % LINE_BASE; return f ? `${FILES[f]} line ${n}` : `line ${n}`; }
  C.parse = function (code, files, mainName) {
    const list = [{ name: mainName || 'main.c', text: code, idx: 0 }];
    Object.entries(files || {}).forEach(([name, text], k) => list.push({ name, text: String(text), idx: k + 1 }));
    FILES = list.map(f => f.name);
    const map = new Map(list.map(f => [f.name, f]));
    const tus = list.filter(f => f.idx === 0 || /\.c$/.test(f.name)).map(f => {
      const ctx = { files: map, includes: new Set() };
      const toks = preprocess(f.text, f.idx, ctx);
      const p = new Parser(toks, { typedefs: new Map(STD_TYPEDEFS) });
      const items = p.program();
      items.forEach((it, pos) => { it.tu = f.idx; it.pos = pos; });
      return { idx: f.idx, name: f.name, items, includes: ctx.includes };
    });
    return { tus, files: list };
  };
  C.run = function (code, stdin, opts = {}) {
    let prog, it;
    try { prog = C.parse(code, opts.files, opts.main); }
    catch (e) {
      if (e instanceof CError) return { trace: [], out: '', error: { kind: 'compile', message: e.message, line: e.line }, warnings: [], report: null };
      return { trace: [], out: '', error: { kind: 'compile', message: String(e.message || e), line: null }, warnings: [], report: null };
    }
    it = new Interp(prog.tus, null, { ...opts, stdin: stdin || '' });
    for (const s of STD_STREAMS) it.globals.set(s, { name: s, type: ptr(T.void), addr: it.mem.allocStatic(8, 8), live: true });
    let error = null, exitCode = null;
    try { exitCode = it.run(); it.snap(null, 'finished'); }
    catch (e) {
      if (e instanceof CError && e.kind === 'compile') return { trace: [], out: '', error: { kind: 'compile', message: e.message, line: e.line }, warnings: it.warnings, report: null };
      if (e instanceof CError) error = { kind: 'runtime', name: e.name, message: e.message, line: e.line };
      else if (e === BREAK || e === CONTINUE) return { trace: [], out: '', error: { kind: 'compile', message: `'${e.sig}' statement not in loop or switch statement`, line: null }, warnings: it.warnings, report: null };
      else { error = { kind: 'runtime', name: 'InternalError', message: String(e && e.message || e), line: null }; if (typeof console !== 'undefined') console.warn('c.js internal error', e); }
      try { it.trace.push({ ...(it.trace[it.trace.length - 1] || { frames: [], heap: [], statics: [] }), line: error.line, note: 'error', outLen: it.out.length, errs: it.errors.length }); } catch (_) { /* keep going */ }
    }
    const report = { errors: it.errors, leaks: error && error.name === 'StepLimit' ? null : it.leakReport(), exitCode };
    return { trace: it.trace, out: utf8(it.out), outRaw: it.out, error, warnings: it.warnings, report, steps: it.steps };
  };
  C.format = formatC;

  /* ════════════════════════════════════════════════════════════════
     9. Stepper UI
     ════════════════════════════════════════════════════════════════ */
  const UIS = {};
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const KW_RE = /\b(auto|break|case|char|const|continue|default|do|double|else|enum|extern|float|for|if|int|long|register|return|short|signed|sizeof|static|struct|switch|typedef|union|unsigned|void|volatile|while|bool|NULL|true|false)\b/g;
  function highlight(line) {
    if (/^\s*#/.test(line)) return `<span class="c-pp">${esc(line)}</span>`;
    const parts = []; const re = /(\/\/.*$|\/\*.*?\*\/)|("(?:[^"\\]|\\.)*")|('(?:[^'\\]|\\.)')/g;
    let last = 0, m;
    const kw = s => esc(s).replace(KW_RE, '<b>$1</b>').replace(/\b(\d+\.?\d*[fFuUlL]*|0x[0-9a-fA-F]+)\b/g, '<i>$1</i>');
    while ((m = re.exec(line))) { parts.push(kw(line.slice(last, m.index))); parts.push(`<span class="${m[1] ? 'jv-cm' : 'jv-str'}">${esc(m[0])}</span>`); last = re.lastIndex; }
    parts.push(kw(line.slice(last)));
    return parts.join('');
  }

  class Stepper {
    constructor(id, cfg) {
      this.id = id; this.cfg = cfg;
      this.initFiles();
      this.stdin = cfg.stdin || '';
      this.result = null; this.i = 0; this.editing = true;
      this.el = document.getElementById('sim-' + id);
    }
    // files[0] is the program (cfg.code, shown as main.c when there are other files); the rest come from cfg.files
    initFiles() {
      const cfg = this.cfg;
      this.files = [{ name: cfg.main || 'main.c', text: (cfg.code || '').replace(/\s+$/, '') }]
        .concat(Object.entries(cfg.files && typeof cfg.files === 'object' ? cfg.files : {}).map(([name, text]) => ({ name, text: String(text).replace(/\s+$/, '') })));
      this.tab = 0;
    }
    get code() { return this.files[0].text; }
    usesStdin() { return /\b(scanf|getchar)\s*\(/.test(this.files.map(f => f.text).join('\n')); }
    run() {
      const extra = Object.fromEntries(this.files.slice(1).map(f => [f.name, f.text]));
      this.result = C.run(this.files[0].text, this.stdin, { maxSteps: this.cfg.maxSteps || 5000, args: this.cfg.args || [], files: extra, main: this.files[0].name });
      this.i = Math.max(0, this.result.trace.length - 1);
      this.editing = false;
      this.render();
    }
    edit() { this.editing = true; this.render(); }
    goto(k) {
      if (!this.result) return;
      this.i = Math.max(0, Math.min(this.result.trace.length - 1, k));
      const t = this.result.trace[this.i]; const line = t && t.line != null ? t.line : this.result.error && this.result.error.line;
      if (line != null) this.tab = Math.floor(line / LINE_BASE) || 0;
      this.render();
    }
    reset() { this.result = null; this.i = 0; this.editing = true; this.initFiles(); this.stdin = this.cfg.stdin || ''; this.render(); }
    memHtml(cur, prev) {
      if (!cur) return '<div class="jv-empty">press ▶ Run, then step through the program</div>';
      const prevVals = new Map();
      if (prev) { prev.frames.forEach((f, fi) => f.vars.forEach(v => prevVals.set(fi + '|' + v.addr, v.val))); prev.statics.forEach(v => prevVals.set('s|' + v.addr, v.val)); prev.heap.forEach(b => prevVals.set('h|' + b.id, b.val)); }
      const cls = (key, val) => (prev ? (prevVals.has(key) ? (prevVals.get(key) !== val ? ' changed' : '') : ' new') : '');
      const row = (v, key) => {
        const target = v.ptr ? `<span class="c-arrow c-t-${v.ptr.kind}">→ ${esc(v.ptr.label)}</span>` : '';
        return `<tr class="c-var${cls(key, v.val)}" data-a="${v.a}" data-size="${v.size}"${v.ptr && v.ptr.a != null ? ` data-to="${v.ptr.a}"` : ''}><td class="c-name" title="${esc(v.type)}">${esc(v.name)}</td><td class="c-val">${esc(v.val)}${target ? ' ' + target : ''}</td><td class="c-addr">${esc(v.addr)}</td></tr>`;
      };
      const frames = cur.frames.slice().reverse().map((f, ri) => {
        const fi = cur.frames.length - 1 - ri;
        const rows = f.vars.map(v => row(v, fi + '|' + v.addr)).join('');
        return `<div class="jv-frame${ri === 0 ? ' top' : ''}"><div class="jv-frame-name">${esc(f.name)}()</div>${rows ? `<table class="c-tbl">${rows}</table>` : '<div class="jv-empty">no variables yet</div>'}</div>`;
      }).join('');
      const heap = cur.heap.length ? cur.heap.map(b => `<div class="c-block${b.alive ? '' : ' freed'}${cls('h|' + b.id, b.val)}" data-a="${b.a}" data-size="${b.size}"><div class="c-block-head"><b>#${b.id}</b> ${esc(b.how)}(${b.size}) <span class="c-addr">${esc(b.addr)}</span> <span class="c-line">${L(b.line)}${b.alive ? '' : `, freed ${L(b.freeLine)}`}</span></div>${b.alive ? `<div class="c-block-val">${esc(b.val)}</div>` : ''}</div>`).join('') : '<div class="jv-empty">nothing allocated</div>';
      const statics = cur.statics.map(v => row({ ...v, name: v.owner ? `${v.owner}.${v.name}` : v.name }, 's|' + v.addr)).join('');
      return `<div class="c-sec"><div class="c-sec-title">Stack <span>grows down ↓</span></div>${frames || '<div class="jv-empty">empty</div>'}</div>
        <div class="c-col"><div class="c-sec"><div class="c-sec-title">Heap</div>${heap}</div>
        ${statics ? `<div class="c-sec"><div class="c-sec-title">Static data</div><table class="c-tbl">${statics}</table></div>` : ''}</div>`;
    }
    reportHtml(last) {
      const r = this.result; if (!r) return '';
      const cur = r.trace[this.i];
      const nErr = cur ? cur.errs : 0;
      const errs = (r.report ? r.report.errors : []).slice(0, last ? undefined : nErr);
      let lines = errs.map(e => `<div class="c-rep-err">${esc(e.msg)}</div>`);
      if (last && r.report && r.report.leaks && (r.report.leaks.allocs || r.report.leaks.blocks)) {
        const lk = r.report.leaks;
        lines.push(`<div class="c-rep-sum"><b>HEAP SUMMARY:</b> in use at exit: ${lk.inUse} bytes in ${lk.blocks} block${lk.blocks === 1 ? '' : 's'}<br>total heap usage: ${lk.allocs} alloc${lk.allocs === 1 ? '' : 's'}, ${lk.frees} free${lk.frees === 1 ? '' : 's'}, ${lk.bytes} bytes allocated</div>`);
        lk.lost.forEach(b => lines.push(`<div class="c-rep-err">${b.size} bytes in 1 block (#${b.id}) are ${b.kind} — allocated at ${L(b.line)}</div>`));
        lk.reachable.forEach(b => lines.push(`<div class="c-rep-ok">${b.size} bytes in 1 block (#${b.id}) are still reachable (a global or a live variable still points at them) — allocated at ${L(b.line)}</div>`));
        if (!lk.blocks) lines.push('<div class="c-rep-ok">All heap blocks were freed — no leaks are possible.</div>');
      }
      if (!lines.length) return '';
      return `<div class="jv-panel"><div class="jv-panel-title">Memory check</div><div class="c-report">${lines.join('')}</div></div>`;
    }
    render() {
      const el = this.el; if (!el) return;
      const file = this.files[this.tab] || this.files[0];
      const lines = file.text.split('\n');
      const base = this.tab * LINE_BASE;
      const tr = this.result ? this.result.trace : [];
      const cur = tr[this.i] || null;
      const last = this.i === tr.length - 1;
      const prev = this.i > 0 ? tr[this.i - 1] : null;
      const err = this.result && this.result.error;
      const curLine = cur && cur.line != null ? cur.line - base : null;
      const errLine = err && last && err.line != null ? err.line - base : null;
      const warns = this.result ? this.result.warnings : [];
      const warnLines = new Set(warns.map(w => w.line - base));
      FILES = this.files.map(f => f.name);

      const tabs = this.files.length > 1 ? `<div class="c-tabs">${this.files.map((f, k) => `<button class="c-tab${k === this.tab ? ' on' : ''}" data-tab="${k}">${esc(f.name)}</button>`).join('')}</div>` : '';
      const codeHtml = tabs + (this.editing
        ? `<textarea class="jv-editor" spellcheck="false" rows="${Math.max(3, lines.length + 1)}">${esc(file.text)}</textarea>`
        : `<pre class="jv-listing">${lines.map((l, k) => `<span class="jv-ln${curLine === k + 1 ? ' cur' : ''}${errLine === k + 1 ? ' err' : ''}${warnLines.has(k + 1) ? ' warn' : ''}"><span class="jv-no">${k + 1}</span>${highlight(l) || ' '}</span>`).join('')}</pre>`);
      const outText = cur ? utf8(this.result.outRaw.slice(0, cur.outLen)) : '';
      let errHtml = '';
      if (err && last) {
        errHtml = err.kind === 'compile'
          ? `<div class="jv-err"><b>error${err.line ? ` (${L(err.line)})` : ''}:</b> ${esc(err.message)}</div>`
          : `<div class="jv-err"><b>${esc(err.name === 'StepLimit' ? 'Stopped' : err.message.split(':')[0])}</b>${err.name === 'StepLimit' ? ': ' + esc(err.message) : esc(err.message.slice(err.message.split(':')[0].length))}${err.line ? `<br>&nbsp;&nbsp;at ${L(err.line)}` : ''}</div>`;
      }
      const warnHtml = warns.length && !this.editing ? `<div class="c-warns">${warns.map(w => `<div><b>warning${w.line ? ` (${L(w.line)})` : ''}:</b> ${esc(w.msg)}</div>`).join('')}</div>` : '';
      const exitCode = this.result && this.result.report && this.result.report.exitCode;
      const status = !this.result || this.editing ? '' : err && err.kind === 'compile' ? 'did not compile' : cur && cur.note === 'finished' ? `program finished (exit code ${exitCode})` : cur && cur.note === 'error' ? 'crashed' : `step ${this.i} of ${tr.length - 1}${cur && cur.line != null ? ` — about to run ${L(cur.line)}` : ''}`;

      el.innerHTML = `
        <div class="jv-wrap c-wrap">
          <div class="jv-toolbar">
            <button class="btn fa-btn jv-run" data-act="run">▶ Run</button>
            ${this.editing ? '' : `<button class="btn fa-btn fa-secondary" data-act="edit">✎ Edit</button>`}
            <button class="btn fa-btn fa-secondary" data-act="reset" title="restore the original program">⟲ Reset</button>
            ${this.editing || !tr.length ? '' : `<span class="jv-sep"></span>
            <button class="btn fa-btn fa-secondary" data-act="first" ${this.i === 0 ? 'disabled' : ''} title="first step">|◀</button>
            <button class="btn fa-btn fa-secondary" data-act="back" ${this.i === 0 ? 'disabled' : ''}>◀ Back</button>
            <button class="btn fa-btn jv-step" data-act="step" ${last ? 'disabled' : ''}>Step ▶</button>
            <button class="btn fa-btn fa-secondary" data-act="last" ${last ? 'disabled' : ''} title="last step">▶|</button>`}
            <span class="jv-status">${esc(status)}</span>
          </div>
          ${warnHtml}
          <div class="c-main">
            <div class="jv-code">${codeHtml}</div>
            <div class="jv-panel"><div class="jv-panel-title">Memory</div><div class="c-mem">${err && err.kind === 'compile' ? '<div class="jv-empty">the program did not compile, so nothing ran</div>' : this.memHtml(cur, prev)}</div></div>
            <div class="c-io">
              <div class="jv-panel"><div class="jv-panel-title">Console</div><pre class="jv-console">${esc(outText)}${cur && !last && !this.editing ? '<span class="jv-caret">▌</span>' : ''}</pre>${errHtml}</div>
              ${this.reportHtml(last)}
            </div>
          </div>
          ${this.usesStdin() ? `<div class="jv-stdin"><label>Input (what the user would type):</label><textarea class="jv-stdin-box" rows="${Math.max(2, this.stdin.split('\n').length)}" spellcheck="false">${esc(this.stdin)}</textarea></div>` : ''}
        </div>`;

      el.querySelectorAll('[data-act]').forEach(b => b.addEventListener('click', () => this.act(b.dataset.act)));
      el.querySelectorAll('[data-tab]').forEach(b => b.addEventListener('click', () => { this.tab = +b.dataset.tab; this.render(); }));
      // hovering a pointer highlights what it points at
      el.querySelectorAll('[data-to]').forEach(r => {
        const to = +r.dataset.to;
        const targets = [...el.querySelectorAll('.c-mem [data-a]')].filter(t => t !== r && to >= +t.dataset.a && to < +t.dataset.a + Math.max(1, +t.dataset.size));
        r.addEventListener('mouseenter', () => targets.forEach(t => t.classList.add('c-hit')));
        r.addEventListener('mouseleave', () => targets.forEach(t => t.classList.remove('c-hit')));
      });
      const ta = el.querySelector('.jv-editor');
      if (ta) {
        ta.addEventListener('input', () => { file.text = ta.value; ta.rows = Math.max(3, ta.value.split('\n').length + 1); });
        ta.addEventListener('keydown', ev => {
          if (ev.key === 'Tab') { ev.preventDefault(); const s = ta.selectionStart, e = ta.selectionEnd; ta.value = ta.value.slice(0, s) + '    ' + ta.value.slice(e); ta.selectionStart = ta.selectionEnd = s + 4; file.text = ta.value; }
          if ((ev.metaKey || ev.ctrlKey) && ev.key === 'Enter') { ev.preventDefault(); this.run(); }
        });
      }
      const listing = el.querySelector('.jv-listing');
      if (listing) listing.addEventListener('dblclick', () => this.edit());
      const sb = el.querySelector('.jv-stdin-box');
      if (sb) sb.addEventListener('input', () => { this.stdin = sb.value; });
      const curEl = el.querySelector('.jv-ln.cur');
      if (curEl && curEl.scrollIntoView && listing && listing.scrollHeight > listing.clientHeight) curEl.scrollIntoView({ block: 'nearest' });
    }
    act(a) {
      switch (a) {
        case 'run': return this.run();
        case 'edit': return this.edit();
        case 'reset': return this.reset();
        case 'first': return this.goto(0);
        case 'back': return this.goto(this.i - 1);
        case 'step': return this.goto(this.i + 1);
        case 'last': return this.goto(Infinity);
      }
    }
  }

  C.mount = function (id, cfg) {
    const ui = new Stepper(id, cfg || {}); UIS[id] = ui; ui.render(); return ui;
  };
  C.ui = id => UIS[id];

  if (typeof window !== 'undefined') window.C = C;
  if (typeof module !== 'undefined' && module.exports) module.exports = C;
})();
