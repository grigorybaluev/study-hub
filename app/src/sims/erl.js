/* ── Erlang-subset interpreter with processes and mailboxes (COMP 348) ─────────
   Pure core (no DOM): ERL.run(cfg) → { trace, out, error, results }.
   UI: ERL.mount(id, cfg) builds the stepper inside #sim-<id>.
   cfg = { mode: 'shell' | 'processes' | 'shared', code?: module source, shell?: expressions for the
   shell (each ended by a full stop), maxSteps? }. The language is the subset a first Erlang unit
   uses: integers of any size, floats, atoms, strings (lists of character codes), tuples, lists with
   [H|T], maps, records, funs; pattern matching in =, function clauses with guards, case, if,
   receive … after, list comprehensions; the lists, io, maps, erlang and timer functions it needs.
   Processes are lightweight: spawn, self(), !, receive and register run under a deterministic
   round-robin scheduler with a virtual clock, one step per expression, so mailboxes, selective
   receive and timeouts can be watched. Mode 'shared' is a separate model: threads running tiny
   scripts over shared variables, to show a lost update, a lock, and a deadlock. */
(function () {
  'use strict';
  const ERL = {};

  /* ════════════════════════════════════════════════════════════════
     1. Terms
     ════════════════════════════════════════════════════════════════ */
  class Atom { constructor(n) { this.n = n; } }
  const ATOMS = new Map();
  const atom = n => { let a = ATOMS.get(n); if (!a) { a = new Atom(n); ATOMS.set(n, a); } return a; };
  const TRUE = atom('true'), FALSE = atom('false'), OK = atom('ok'), UNDEF = atom('undefined');
  class Tuple { constructor(items) { this.items = items; } }
  class Cons { constructor(h, t) { this.h = h; this.t = t; } }       // a list cell; [] is NIL
  const NIL = { nil: true };
  class EMap { constructor(entries) { this.entries = entries; } }     // [[k, v]], kept in term order
  class Pid { constructor(n) { this.n = n; } }
  class Fun { constructor(clauses, env, name, arity, mod) { this.clauses = clauses; this.env = env; this.name = name; this.arity = arity; this.mod = mod; } }
  class TailCall { constructor(target, args) { this.target = target; this.args = args; } }
  class ErlError extends Error { constructor(kind, reason, msg) { super(msg || ''); this.kind = kind; this.reason = reason; } }
  const isInt = x => typeof x === 'bigint';
  const isNum = x => typeof x === 'bigint' || typeof x === 'number';
  const list = arr => { let l = NIL; for (let k = arr.length - 1; k >= 0; k--) l = new Cons(arr[k], l); return l; };
  const str = s => list([...s].map(c => BigInt(c.codePointAt(0))));
  function toArr(l, what) { const out = []; while (l instanceof Cons) { out.push(l.h); l = l.t; } if (l !== NIL) throw new ErlError('error', badarg(), what ? `${what}: not a proper list` : 'not a proper list'); return out; }
  const bool = b => (b ? TRUE : FALSE);
  const badarg = () => atom('badarg');

  /* ── term order: number < atom < pid < fun < tuple < map < nil < list ── */
  const rank = x => (isNum(x) ? 0 : x instanceof Atom ? 1 : x instanceof Pid ? 3 : x instanceof Fun ? 2 : x instanceof Tuple ? 4 : x instanceof EMap ? 5 : x === NIL ? 6 : x instanceof Cons ? 7 : 8);
  function cmp(a, b) {
    const ra = rank(a), rb = rank(b);
    if (ra !== rb) return ra - rb;
    if (isNum(a)) { if (isInt(a) && isInt(b)) return a < b ? -1 : a > b ? 1 : 0; const x = Number(a), y = Number(b); return x < y ? -1 : x > y ? 1 : 0; }
    if (a instanceof Atom) return a.n < b.n ? -1 : a.n > b.n ? 1 : 0;
    if (a instanceof Pid) return a.n - b.n;
    if (a instanceof Tuple) { if (a.items.length !== b.items.length) return a.items.length - b.items.length; for (let k = 0; k < a.items.length; k++) { const c = cmp(a.items[k], b.items[k]); if (c) return c; } return 0; }
    if (a instanceof EMap) { if (a.entries.length !== b.entries.length) return a.entries.length - b.entries.length; for (let k = 0; k < a.entries.length; k++) { const c = cmp(a.entries[k][0], b.entries[k][0]) || cmp(a.entries[k][1], b.entries[k][1]); if (c) return c; } return 0; }
    if (a instanceof Cons) { let x = a, y = b; while (x instanceof Cons && y instanceof Cons) { const c = cmp(x.h, y.h); if (c) return c; x = x.t; y = y.t; } if (x === NIL && y === NIL) return 0; if (x === NIL) return -1; if (y === NIL) return 1; return cmp(x, y); }
    return 0;
  }
  // == compares numbers by value (1 == 1.0); =:= also needs the same type
  function eqv(a, b, exact) {
    if (a === b) return true;
    if (isNum(a) && isNum(b)) return exact ? (isInt(a) === isInt(b) && (isInt(a) ? a === b : a === b)) : Number(a) === Number(b) && (isInt(a) && isInt(b) ? a === b : true);
    if (rank(a) !== rank(b)) return false;
    if (a instanceof Tuple) return a.items.length === b.items.length && a.items.every((x, k) => eqv(x, b.items[k], exact));
    if (a instanceof Cons) { let x = a, y = b; while (x instanceof Cons && y instanceof Cons) { if (!eqv(x.h, y.h, exact)) return false; x = x.t; y = y.t; } return eqv(x, y, exact); }
    if (a instanceof EMap) return a.entries.length === b.entries.length && a.entries.every(([k, v], i) => eqv(k, b.entries[i][0], true) && eqv(v, b.entries[i][1], exact));
    return cmp(a, b) === 0 && rank(a) !== 0;
  }
  /* ── the order of keys inside a map. A small map (up to 32 keys) keeps its keys in the VM's
     internal order, which is term order except that atoms go by their index in the atom table, the
     order in which the VM first saw them. PRE_ATOMS lists common atoms that exist when the shell
     starts, in index order (read from an Erlang/OTP 29 shell after the modules a session uses are loaded); any other atom counts as created when
     the run first meets it. ── */
  const PRE_ATOMS = new Map((
    'false true nonode@nohost infinity timeout normal call return throw error exit undefined nocatch ' +
    'nil no abandoned abort access active alias alive all allocator anchored and any apply args ' +
    'asynchronous atom auto badarg badarith badmatch bag band big binary block blocked bor busy ' +
    'caller capture case_clause caseless catch cause clear close closed code command compact compile ' +
    'complete compressed connect connected control copy count creation data default deterministic ' +
    'dictionary disabled discard div driver emulator entry env eof erlang exclusive export extended ' +
    'external extra first flush force free function function_clause generational global grun handle ' +
    'heir hidden hide high id if_clause ignore in inactive incomplete inconsistent index info inherit ' +
    'init input integer internal invalid io kill known label legacy line links list little loaded ' +
    'local logger low machine major match max maximum memory message meta microsecond millisecond min ' +
    'minor module monitor monotonic more name native new node noproc not notify nul offset ok open ' +
    'opt or out output owner packet parallelism parent pause pending permanent pid port positive ' +
    'position prepare print priority private process profile protection public raw re reason receive ' +
    'register reload rem reply reset restart resume reuse runnable running safe scheme scientific ' +
    'scope second send sensitive serial session set short shutdown silent size skip start status stop ' +
    'stream suspend suspended system table tag this total trace tracer trim type undef ungreedy ' +
    'unregister used unblock unit unloaded unsafe unsupported value version visible waiting warning x ' +
    'y yes yield abs atom_to_list date display element erase float float_to_list get halt hd ' +
    'integer_to_list length link list_to_atom list_to_tuple now put registered round self setelement ' +
    'spawn statistics time tl trunc tuple_to_list unlink whereis math cos cosh sin sinh tan tanh log ' +
    'pow is_process_alive raise append subtract is_atom is_list is_tuple is_float is_integer ' +
    'is_number is_pid is_function delete last member next prev insert rename slot select os run lists ' +
    'reverse keyfind disassemble same dirty hibernate is_boolean string tuple_size at part file ' +
    'inspect is_map map_size maps find from_list is_key keys merge remove update values take split ' +
    'floor ceil atomics add exchange list_to_integer check import create other sleep purge continued ' +
    'continue boot fatal request mode interactive map relaxed strict state crash progress foreach ' +
    'loop user stopping heart resend unload terminate path es root pa script directory join dot timer ' +
    'flag sort io_lib format prepared starting read write wipe unlock bool linger bind sync accept ' +
    'listen broadcast subscribe detach attach buffer deliver header membership record ether family ' +
    'decode once dec rev len tree unordered term up down bound truncate advise allocate cur ' +
    'sequential universal deflate cut inflate compress finish zip finished empty full socket mon ' +
    'registry protocol fold domain nth completion with msg cancel level foldl seek regular splitter ' +
    'skipper loader report primary cache archive absolute relative normalize clean combine radix ' +
    'crasher disconnect core processor thread logical instance idle working passive unexpected done ' +
    'sub acquired random device address association authentication do dont exclude how include ' +
    'indication initial interface listening missing null offender origin probe remote selected ' +
    'unconfirmed want action alen already bridge cellular chaos confirm congestion context cork ' +
    'dormant dup dying dynamic echo established faith flash gif host immediate kernel mark master ' +
    'notification off on outgoing peek policy precedence pup reliability routine sec seq simplex ' +
    'slave throughput transparent tunnel unknown void zero mux ah swipe mobile visa carp fire pipe ' +
    'hip divert description disconnected duplicate manual mask operational preferred service speed ' +
    'tentative testing transient unchanged unreachable net home application gen supervisor group ' +
    'array c calendar digraph graph peer pool queue rand shell rex notice load temporary concurrent ' +
    'to_list deadlock permit cast child ack flatten distributed persistent loading search stopped ' +
    'allow unlimited depth p single title extension partition bad good compiler which attribute ' +
    'signature filter clash build decorate removed spec worker super ram put_chars consult character ' +
    'choose sticky keep foldr verify chunk traverse i mem choice trailing slice real fun should be a ' +
    'the repair replace author validate success failure try unbound case maybe location else v k q ' +
    'bin char if clause m f generate store unused guard number reference binding unscannable text ' +
    'eventually possibly lint usage form behavior doc nominal opaque dialyzer relation converse union ' +
    'head pattern begin product range reachable obsolete fwrite warn intersection constraint item b s ' +
    'abstract parse when after cond end let of pass unfold cat intensity period strategy proxy simple ' +
    'exist handler emergency alert critical via where equal prefix cycle wait modifier without tid ' +
    'rich pad dead suffix sum fail enumerate nack visit never specs significant drop result tail ' +
    'property expand lowercase connection booting cover deadline detached unquote relay strip image ' +
    'restriction documentation symbol uppercase singleton balance smaller found ordered reversed push ' +
    'difference enter category letter punctuation connector long history experimental adjust disable ' +
    'enable feature unless while until server terminal primitive writer reader resize move left right ' +
    'tab encode bold canon sig recurse retry times backlog sent upper hex separate exception signal ' +
    'response verbose publish ticker tick longer shorter static controller inserted remark ' +
    'inconsistency uniform bye setup fetch registrar aborted seed resolved participant locker resolve ' +
    'lock added resolver him removing jump shuffle dummy intersect agreed nonexisting old dumb editor ' +
    'interrupt chomp die activate blink h r j below postpone consume both help prompt stack ' +
    'interrupted edit key redraw yank scan indentation intermediate benign reconstruct limit e ' +
    'serious redirect foo leading beam source d column garb width precision collect w base final go ' +
    'ping pong l pi ni iba ist calli cleanup resource circular illegal mismatch redefine define ' +
    'defined comma simplify template month dev rotation rehash caught unterminated sigil comment less ' +
    'procline render hash fragment query identifier field indent alice bob carol dave eve frank grace ' +
    'general str span lower decompose compose circle square font decimal narrow wide currency dash ' +
    'isolated medial small vertical separator space fraction paragraph surrogate unhex z instant ' +
    'interval req'
  ).split(' ').map((a, k) => [a, k]));
  let newAtoms = new Map();
  const noteAtom = n => { if (!PRE_ATOMS.has(n) && !newAtoms.has(n)) newAtoms.set(n, newAtoms.size); };
  const atomIndex = a => { if (PRE_ATOMS.has(a.n)) return PRE_ATOMS.get(a.n); noteAtom(a.n); return 1e6 + newAtoms.get(a.n); };
  const keyCmp = (a, b) => (a instanceof Atom && b instanceof Atom ? atomIndex(a) - atomIndex(b) : cmp(a, b));
  const mapPut = (m, k, v) => { const e = m.entries.filter(([x]) => !eqv(x, k, true)); e.push([k, v]); if (e.length <= 32) e.sort((p, q) => keyCmp(p[0], q[0])); else e.sort((p, q) => cmp(p[0], q[0])); return new EMap(e); };
  const mapGet = (m, k) => { const e = m.entries.find(([x]) => eqv(x, k, true)); return e ? e[1] : undefined; };

  /* ── printing: ~p / ~w ── */
  const ATOM_PLAIN = /^[a-z][A-Za-z0-9_@]*$/;
  const RESERVED = new Set(['after', 'and', 'andalso', 'band', 'begin', 'bnot', 'bor', 'bsl', 'bsr', 'bxor', 'case', 'catch', 'cond', 'div', 'end', 'fun', 'if', 'let', 'not', 'of', 'or', 'orelse', 'receive', 'rem', 'try', 'when', 'xor']);
  const atomText = a => (ATOM_PLAIN.test(a.n) && !RESERVED.has(a.n) ? a.n : "'" + a.n.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'");
  function isPrintableList(l) {
    if (l === NIL) return false;
    let x = l;
    while (x instanceof Cons) { const c = x.h; if (!isInt(c) || !((c >= 32n && c <= 126n) || (c >= 160n && c <= 255n) || c === 10n || c === 9n || c === 13n || c === 8n || c === 11n || c === 12n || c === 27n)) return false; x = x.t; }
    return x === NIL;
  }
  function fmtFloat(x) {
    // like float_to_list(X, [short]): the shortest digits that read back, written in fixed or
    // scientific notation, whichever is shorter (fixed on a tie): 0.0025, 123456.0, 1.0e4, 3.0e10
    if (x === 0) return Object.is(x, -0) ? '-0.0' : '0.0';
    const m = /^(-?)(\d)(?:\.(\d+))?e([-+]\d+)$/.exec(x.toExponential());
    const sign = m[1], digits = m[2] + (m[3] || ''), exp = +m[4];
    const sci = sign + digits[0] + '.' + (digits.slice(1) || '0') + 'e' + exp;
    let fixed;
    if (exp >= 0) { const ip = digits.slice(0, exp + 1).padEnd(exp + 1, '0'); fixed = sign + ip + '.' + (digits.slice(exp + 1) || '0'); }
    else fixed = sign + '0.' + '0'.repeat(-exp - 1) + digits;
    return fixed.length <= sci.length ? fixed : sci;
  }
  function show(x, strings = true, depth = 0) {
    if (depth > 60) return '...';
    if (isInt(x)) return x.toString();
    if (typeof x === 'number') return fmtFloat(x);
    if (x instanceof Atom) return atomText(x);
    if (x === NIL) return '[]';
    if (x instanceof Cons) {
      if (strings && isPrintableList(x)) return '"' + toArr(x).map(c => { const ch = String.fromCharCode(Number(c)); return ch === '"' ? '\\"' : ch === '\\' ? '\\\\' : ({ '\n': '\\n', '\t': '\\t', '\v': '\\v', '\f': '\\f', '\b': '\\b', '\r': '\\r', '\x1b': '\\e', '\x07': '\\a' })[ch] || ch; }).join('') + '"';
      const parts = []; let l = x;
      while (l instanceof Cons) { parts.push(show(l.h, strings, depth + 1)); l = l.t; }
      return '[' + parts.join(',') + (l === NIL ? '' : '|' + show(l, strings, depth + 1)) + ']';
    }
    if (x instanceof Tuple) return '{' + x.items.map(y => show(y, strings, depth + 1)).join(',') + '}';
    if (x instanceof EMap) return '#{' + x.entries.map(([k, v]) => show(k, strings, depth + 1) + ' => ' + show(v, strings, depth + 1)).join(',') + '}';
    if (x instanceof Pid) return `<0.${x.n}.0>`;
    if (x instanceof Fun) return x.name ? `fun ${x.mod ? x.mod + ':' : ''}${x.name}/${x.arity}` : '#Fun<erl_eval>';
    return String(x);
  }
  /* ── the pretty printer (~p and shell results), after io_lib_pretty: a term that fits on the
     line is written flat; otherwise a list, tuple or map breaks, filling lines with its atomic
     elements and starting a new line for each compound one. A tuple whose first element is an
     atom keeps that tag on the first line and indents the rest after it. The shell also limits the
     depth (30: `|...`) and the characters per line (60, not counting indentation). ── */
  const dec = d => (d < 0 ? d : d - 1);
  function inter(x, D) {
    if (D === 0) return { s: '...', len: 3, atomic: true };
    if (x instanceof Cons && !isPrintableList(x)) {
      const items = []; let l = x, d = D;
      while (l instanceof Cons) { if (d === 1) { items.push({ s: '...', len: 3, atomic: true, sep: '|' }); l = NIL; break; } items.push(inter(l.h, dec(d))); l = l.t; d = dec(d); }
      if (l !== NIL) { const t = inter(l, dec(d)); t.sep = '|'; items.push(t); }
      return node('list', '[', ']', items);
    }
    if (x instanceof Tuple && x.items.length) {
      const items = []; let d = D;
      for (const y of x.items) { if (d === 1) { items.push({ s: '...', len: 3, atomic: true }); break; } items.push(inter(y, dec(d))); d = dec(d); }
      const n = node('tuple', '{', '}', items);
      n.tag = x.items[0] instanceof Atom && items.length > 1;
      return n;
    }
    if (x instanceof EMap && x.entries.length) {
      const items = []; let d = D;
      for (const [k, v] of x.entries) {
        if (d === 1) { items.push({ s: '...', len: 3, atomic: true }); break; }
        const kn = inter(k, dec(d)), vn = inter(v, dec(d));
        items.push({ kind: 'pair', k: kn, v: vn, s: kn.s + ' => ' + vn.s, len: kn.len + 4 + vn.len, atomic: kn.atomic && vn.atomic });
        d = dec(d);
      }
      return node('map', '#{', '}', items);
    }
    // a string is written whole, but like a compound term it starts its own line in a broken list
    const t = show(x); return { s: t, len: t.length, atomic: !(x instanceof Cons), leaf: true };
  }
  function node(kind, open, close, items) {
    const body = items.map((e, k) => (k ? e.sep || ',' : '') + e.s).join('');
    const s = open + body + close;
    return { kind, open, close, items, s, len: s.length, atomic: false };
  }
  function pretty(x, { col = 1, ll = 80, M = Infinity, depth = -1 } = {}) {
    const n = inter(x, depth);
    if (n.len < ll - col && n.len <= M) return n.s;
    return pp(n, col, ll, M, 0, 0);
  }
  function pp(n, col, ll, M, LD, W) {
    if (n.atomic || n.leaf || (n.len < ll - col - LD && n.len + W + LD <= M)) return n.s;
    if (n.kind === 'pair') return n.k.s + ' => ' + pp(n.v, col + n.k.len + 4, ll, M, LD, W + n.k.len + 4);
    if (n.kind === 'tuple' && n.tag) {
      const tag = n.items[0].s, ind = tag.length + 2;
      return '{' + tag + ',' + ppList(n.items.slice(1), col + ind, ll, M, LD, W + ind) + '}';
    }
    const w = n.open.length;
    return n.open + ppList(n.items, col + w, ll, M, LD, W + w) + n.close;
  }
  function ppList(items, col0, ll, M, LD, W) {
    const lastDepth = k => (k === items.length - 1 ? LD + 1 : 0);
    const lineWidth = s => { const k = s.lastIndexOf('\n'); return k < 0 ? s.length : Infinity; };
    let out = pp(items[0], col0, ll, M, lastDepth(0), W);
    let w = lineWidth(out), col = col0 + w; W += w;
    for (let k = 1; k < items.length; k++) {
      const e = items[k], LD1 = lastDepth(k), ELen = 1 + e.len, sep = e.sep || ',';
      const fits = LD1 === 0 ? ELen + 1 < ll - col && W + ELen + 1 <= M : ELen + LD1 < ll - col && W + ELen + LD1 <= M;
      if (e.s === '...' || (e.atomic && fits)) { out += sep + e.s; col += ELen; W += ELen; continue; }
      const t = pp(e, col0, ll, M, LD1, 0);
      out += sep + '\n' + ' '.repeat(col0 - 1) + t;
      w = lineWidth(t); col = col0 + w; W = w;
    }
    return out;
  }
  const chars = l => { if (typeof l === 'string') return l; if (l instanceof Atom) return l.n; if (isNum(l)) return show(l); return toArr(l).map(c => (c instanceof Cons || c === NIL ? chars(c) : String.fromCodePoint(Number(c)))).join(''); };
  // io:format
  function format(fmt, args) {
    const a = toArr(args, 'io:format'); let k = 0, out = '';
    const next = () => { if (k >= a.length) throw new ErlError('error', atom('format'), 'io:format: too few arguments'); return a[k++]; };
    for (let i = 0; i < fmt.length; i++) {
      const c = fmt[i];
      if (c !== '~') { out += c; continue; }
      let j = i + 1, width = '', prec = '';
      while (/[0-9-]/.test(fmt[j])) width += fmt[j++];
      if (fmt[j] === '.') { j++; while (/[0-9]/.test(fmt[j])) prec += fmt[j++]; }
      const d = fmt[j]; i = j;
      let s;
      switch (d) {
        case 'n': s = '\n'; break;
        case '~': s = '~'; break;
        case 'p': { const nl = out.lastIndexOf('\n'); s = pretty(next(), { col: out.length - nl }); break; }
        case 'w': s = show(next(), false); break;
        case 's': s = chars(next()); break;
        case 'b': s = next().toString(); break;
        case 'f': { const x = Number(next()); s = x.toFixed(prec === '' ? 6 : +prec); break; }
        case 'e': { const x = Number(next()); s = x.toExponential(prec === '' ? 5 : +prec - 1).replace(/e([-+])(\d)$/, 'e$10$2'); break; }
        case 'c': s = String.fromCodePoint(Number(next())); break;
        default: throw new ErlError('error', atom('format'), `io:format: unknown control ~${d}`);
      }
      if (width) { const w = Math.abs(+width); s = width.startsWith('-') ? s.padEnd(w) : s.padStart(w); }
      out += s;
    }
    if (k < a.length) throw new ErlError('error', atom('format'), 'io:format: too many arguments');
    return out;
  }

  /* ════════════════════════════════════════════════════════════════
     2. Lexer and parser
     ════════════════════════════════════════════════════════════════ */
  const KW = new Set(['after', 'begin', 'case', 'catch', 'end', 'fun', 'if', 'of', 'receive', 'when', 'try', 'div', 'rem', 'band', 'bor', 'bxor', 'bnot', 'bsl', 'bsr', 'and', 'or', 'not', 'andalso', 'orelse', 'xor']);
  const OPS = ['->', '||', '<-', '<=', '=>', ':=', '=:=', '=/=', '==', '/=', '=<', '>=', '++', '--', '::', '!', '#', '.', ',', ';', '(', ')', '[', ']', '{', '}', '|', '+', '-', '*', '/', '<', '>', '=', ':', '?'];
  class SyntaxErr extends Error { constructor(msg, line, col) { super(msg); this.line = line; this.col = col; } }
  const tokText = p => (p.k === 'eof' ? "'.'" : p.k === 'str' ? '"' + p.v + '"' : p.k === 'op' || p.k === 'kw' ? "'" + p.v + "'" : p.k === 'atom' ? atomText(atom(p.v)) : String(p.v));
  function lex(src, lineBase = 0) {
    const toks = []; let i = 0, line = 1 + lineBase, lineStart = 0;
    const push = t => { t.col = i - lineStart + 1; toks.push(t); };
    const n = src.length;
    while (i < n) {
      const c = src[i];
      if (c === '\n') { line++; i++; lineStart = i; continue; }
      if (/\s/.test(c)) { i++; continue; }
      if (c === '%') { while (i < n && src[i] !== '\n') i++; continue; }
      if (/[a-z]/.test(c)) { let j = i; while (j < n && /[A-Za-z0-9_@]/.test(src[j])) j++; const w = src.slice(i, j); if (!KW.has(w)) noteAtom(w); push(KW.has(w) ? { k: 'kw', v: w, line } : { k: 'atom', v: w, line }); i = j; continue; }
      if (/[A-Z_]/.test(c)) { let j = i; while (j < n && /[A-Za-z0-9_@]/.test(src[j])) j++; push({ k: 'var', v: src.slice(i, j), line }); i = j; continue; }
      if (/[0-9]/.test(c)) {
        let m = /^(\d+)#([0-9a-zA-Z]+)/.exec(src.slice(i));
        if (m) { push({ k: 'int', v: BigInt(parseInt(m[2], +m[1])), line }); i += m[0].length; continue; }
        m = /^\d[\d_]*(\.\d[\d_]*([eE][-+]?\d+)?)?/.exec(src.slice(i));
        const t = m[0].replace(/_/g, '');
        push(m[1] ? { k: 'float', v: parseFloat(t), line } : { k: 'int', v: BigInt(t), line }); i += m[0].length; continue;
      }
      if (c === '$') { let ch = src[i + 1], len = 2; if (ch === '\\') { const e = src[i + 2]; ch = { n: '\n', t: '\t', s: ' ', '\\': '\\' }[e] ?? e; len = 3; } push({ k: 'int', v: BigInt(ch.codePointAt(0)), line }); i += len; continue; }
      if (c === '"' || c === "'") {
        let j = i + 1, s = '';
        while (j < n && src[j] !== c) { if (src[j] === '\\') { const e = src[j + 1]; s += { n: '\n', t: '\t', '"': '"', "'": "'", '\\': '\\', s: ' ' }[e] ?? e; j += 2; continue; } if (src[j] === '\n') line++; s += src[j++]; }
        if (j >= n) throw new SyntaxErr('unterminated ' + (c === '"' ? 'string' : 'atom'), line);
        if (c === "'") noteAtom(s); push({ k: c === '"' ? 'str' : 'atom', v: s, line }); i = j + 1; continue;
      }
      let op = null; for (const o of OPS) if (src.startsWith(o, i)) { op = o; break; }
      if (!op) throw new SyntaxErr(`illegal character '${c}'`, line);
      // a full stop ends a form only when followed by whitespace, a comment or the end
      if (op === '.' && !(i + 1 >= n || /[\s%]/.test(src[i + 1]))) { push({ k: 'op', v: '.', line, dot: false }); i++; continue; }
      push({ k: 'op', v: op, line, end: op === '.' }); i += op.length;
    }
    push({ k: 'eof', v: '<end>', line });
    return toks;
  }
  class Parser {
    constructor(toks, records) { this.t = toks; this.i = 0; this.records = records || new Map(); }
    peek(o = 0) { return this.t[this.i + o]; }
    next() { return this.t[this.i++]; }
    is(v, o = 0) { const p = this.peek(o); return p && (p.k === 'op' || p.k === 'kw') && p.v === v; }
    eat(v) { if (this.is(v)) { this.i++; return true; } return false; }
    expect(v) { if (!this.is(v)) { const p = this.peek(); throw new SyntaxErr(`syntax error before: ${tokText(p)}`, p.line, p.col); } return this.next(); }
    atEnd() { return this.peek().k === 'eof'; }
    // module forms: attributes and functions
    forms() {
      const out = [];
      while (!this.atEnd()) {
        if (this.is('-')) { out.push(this.attribute()); continue; }
        out.push(this.func());
      }
      return out;
    }
    attribute() {
      const line = this.next().line; const name = this.next().v;
      this.expect('(');
      let val;
      if (name === 'record') {
        const rname = this.next().v; this.expect(','); this.expect('{');
        const fields = [];
        while (!this.eat('}')) { const f = this.next().v; let def = null; if (this.eat('=')) def = this.expr(); fields.push({ f, def }); if (!this.eat(',')) { this.expect('}'); break; } }
        this.records.set(rname, fields);
        val = { rname, fields };
      } else if (name === 'export' || name === 'import') {
        let mod = null; if (name === 'import') { mod = this.next().v; this.expect(','); }
        this.expect('['); const fs = [];
        while (!this.eat(']')) { const f = this.next().v; this.expect('/'); const a = Number(this.next().v); fs.push(f + '/' + a); if (!this.eat(',')) { this.expect(']'); break; } }
        val = { mod, fs };
      } else { let depth = 1; while (depth) { const t = this.next(); if (t.k === 'eof') break; if (t.v === '(') depth++; if (t.v === ')') depth--; } this.expect('.'); return { k: 'attr', name, line }; }
      this.expect(')'); this.expect('.');
      return { k: 'attr', name, val, line };
    }
    func() {
      const first = this.peek();
      if (first.k !== 'atom') throw new SyntaxErr(`syntax error before: ${first.v}`, first.line);
      const name = first.v; const clauses = [];
      for (;;) {
        const t = this.next(); if (t.v !== name) throw new SyntaxErr(`head mismatch: ${t.v} vs ${name}`, t.line);
        const c = this.clauseAfterName(t.line); clauses.push(c);
        if (this.eat(';')) continue;
        this.expect('.'); break;
      }
      const arity = clauses[0].pats.length;
      if (clauses.some(c => c.pats.length !== arity)) throw new SyntaxErr(`head mismatch: ${name} has clauses with different arities`, first.line);
      return { k: 'func', name, arity, clauses, line: first.line };
    }
    clauseAfterName(line) {
      this.expect('('); const pats = [];
      if (!this.eat(')')) { do pats.push(this.expr()); while (this.eat(',')); this.expect(')'); }
      const guard = this.eat('when') ? this.guard() : null;
      this.expect('->');
      return { pats, guard, body: this.body(), line };
    }
    guard() { const alts = []; do { const g = []; do g.push(this.expr()); while (this.eat(',')); alts.push(g); } while (this.eat(';')); return alts; }
    body() { const es = [this.expr()]; while (this.eat(',')) es.push(this.expr()); return es; }
    // shell input: expressions each ended by '.'
    shellForms() {
      const out = [];
      while (!this.atEnd()) { const line = this.peek().line; const b = this.body(); this.expect('.'); out.push({ body: b, line }); }
      return out;
    }
    expr() { return this.catchExpr(); }
    catchExpr() { if (this.is('catch')) { const line = this.next().line; return { k: 'catch', e: this.catchExpr(), line }; } return this.matchSend(); }
    matchSend() {
      const lhs = this.orelse();
      if (this.is('=')) { const line = this.next().line; return { k: 'match', p: lhs, e: this.matchSend(), line }; }
      if (this.is('!')) { const line = this.next().line; return { k: 'send', to: lhs, msg: this.matchSend(), line }; }
      return lhs;
    }
    orelse() { let a = this.andalso(); while (this.is('orelse')) { const line = this.next().line; a = { k: 'op', op: 'orelse', a, b: this.andalso(), line }; } return a; }
    andalso() { let a = this.comparison(); while (this.is('andalso')) { const line = this.next().line; a = { k: 'op', op: 'andalso', a, b: this.comparison(), line }; } return a; }
    comparison() { const a = this.listOp(); for (const op of ['==', '/=', '=<', '<', '>=', '>', '=:=', '=/=']) if (this.is(op)) { const line = this.next().line; return { k: 'op', op, a, b: this.listOp(), line }; } return a; }
    listOp() { const a = this.additive(); for (const op of ['++', '--']) if (this.is(op)) { const line = this.next().line; return { k: 'op', op, a, b: this.listOp(), line }; } return a; }
    additive() { let a = this.mult(); for (;;) { const p = this.peek(); if ((p.k === 'op' && (p.v === '+' || p.v === '-')) || (p.k === 'kw' && ['bor', 'bxor', 'bsl', 'bsr', 'or', 'xor'].includes(p.v))) { this.next(); a = { k: 'op', op: p.v, a, b: this.mult(), line: p.line }; } else return a; } }
    mult() { let a = this.unary(); for (;;) { const p = this.peek(); if ((p.k === 'op' && (p.v === '*' || p.v === '/')) || (p.k === 'kw' && ['div', 'rem', 'band', 'and'].includes(p.v))) { this.next(); a = { k: 'op', op: p.v, a, b: this.unary(), line: p.line }; } else return a; } }
    unary() { const p = this.peek(); if ((p.k === 'op' && (p.v === '-' || p.v === '+')) || (p.k === 'kw' && (p.v === 'not' || p.v === 'bnot'))) { this.next(); return { k: 'unop', op: p.v, a: this.unary(), line: p.line }; } return this.postfix(); }
    postfix() {
      let e = this.primary();
      for (;;) {
        if (this.is('#') && this.peek(1).k === 'atom') {
          const line = this.next().line; const r = this.next().v;
          if (this.eat('.')) { e = { k: 'recfield', e, r, f: this.next().v, line }; continue; }
          e = { k: 'recupdate', e, r, fields: this.recFields(), line }; continue;
        }
        if (this.is('#') && this.is('{', 1)) { const line = this.next().line; e = { k: 'mapupdate', e, assoc: this.mapAssocs(), line }; continue; }
        if (this.is('(')) { const line = this.peek().line; e = { k: 'call', f: e, args: this.args(), line }; continue; }
        if (this.is(':') && !this.noRemote) { const line = this.next().line; const fn = this.primary(); e = { k: 'remote', m: e, f: fn, line }; if (this.is('(')) e = { k: 'call', f: e, args: this.args(), line }; continue; }
        return e;
      }
    }
    args() { this.expect('('); const a = []; if (!this.eat(')')) { do a.push(this.expr()); while (this.eat(',')); this.expect(')'); } return a; }
    recFields() { this.expect('{'); const fs = []; while (!this.eat('}')) { const f = this.next().v; this.expect('='); fs.push({ f, e: this.expr() }); if (!this.eat(',')) { this.expect('}'); break; } } return fs; }
    mapAssocs() { this.expect('{'); const as = []; while (!this.eat('}')) { const k = this.expr(); const op = this.next().v; if (op !== '=>' && op !== ':=') throw new SyntaxErr('syntax error in map', this.peek().line); as.push({ k, op, v: this.expr() }); if (!this.eat(',')) { this.expect('}'); break; } } return as; }
    clauses(end) {
      const cs = [];
      for (;;) {
        const line = this.peek().line;
        const pat = this.expr(); const guard = this.eat('when') ? this.guard() : null; this.expect('->');
        cs.push({ pats: [pat], guard, body: this.body(), line });
        if (!this.eat(';')) break;
      }
      if (end) this.expect(end);
      return cs;
    }
    primary() {
      const p = this.next(), line = p.line;
      switch (p.k) {
        case 'int': case 'float': return { k: 'lit', v: p.v, line };
        case 'str': { let s = p.v; while (this.peek().k === 'str') s += this.next().v; return { k: 'lit', v: str(s), line }; }
        case 'atom': return { k: 'lit', v: atom(p.v), line, col: p.col, atomName: p.v };
        case 'var': return { k: 'var', n: p.v, line, col: p.col };
        case 'op':
          if (p.v === '(') { const e = this.expr(); this.expect(')'); return e; }
          if (p.v === '{') { const items = []; if (!this.eat('}')) { do items.push(this.expr()); while (this.eat(',')); this.expect('}'); } return { k: 'tuple', items, line }; }
          if (p.v === '[') {
            if (this.eat(']')) return { k: 'lit', v: NIL, line };
            const first = this.expr();
            if (this.eat('||')) {
              const quals = [];
              do { const q = this.expr(); if (this.eat('<-')) quals.push({ gen: q, src: this.expr() }); else quals.push({ filter: q }); } while (this.eat(','));
              this.expect(']');
              return { k: 'lc', e: first, quals, line };
            }
            const items = [first]; let tail = null;
            while (this.eat(',')) items.push(this.expr());
            if (this.eat('|')) tail = this.expr();
            this.expect(']');
            return { k: 'list', items, tail, line };
          }
          if (p.v === '#') {
            if (this.is('{')) return { k: 'map', assoc: this.mapAssocs(), line };
            const r = this.next().v;
            if (this.eat('.')) return { k: 'recindex', r, f: this.next().v, line };
            return { k: 'record', r, fields: this.recFields(), line };
          }
          break;
        case 'kw':
          if (p.v === 'fun') {
            if (this.peek().k === 'atom' && (this.is('/', 1) || this.is(':', 1))) {
              let mod = null, name = this.next().v;
              if (this.eat(':')) { mod = name; name = this.next().v; }
              this.expect('/'); const ar = Number(this.next().v);
              return { k: 'funref', mod, name, arity: ar, line, col: p.col };
            }
            const cs = []; let fname = null;
            if (this.peek().k === 'var' && this.is('(', 1)) fname = this.peek().v;
            do { if (fname) { const t = this.next(); if (t.v !== fname) throw new SyntaxErr(`syntax error before: ${tokText(t)}`, t.line, t.col); } const c = this.clauseAfterName(this.peek().line); cs.push(c); } while (this.eat(';'));
            this.expect('end');
            return { k: 'fun', clauses: cs, fname, line };
          }
          if (p.v === 'case') { const e = this.expr(); this.expect('of'); return { k: 'case', e, clauses: this.clauses('end'), line }; }
          if (p.v === 'if') { const cs = []; do { const l2 = this.peek().line; const g = this.guard(); this.expect('->'); cs.push({ guard: g, body: this.body(), line: l2 }); } while (this.eat(';')); this.expect('end'); return { k: 'if', clauses: cs, line }; }
          if (p.v === 'receive') {
            let cs = [];
            if (!this.is('after')) cs = this.clauses(null);
            let after = null;
            if (this.eat('after')) { const t = this.expr(); this.expect('->'); after = { t, body: this.body() }; }
            this.expect('end');
            return { k: 'receive', clauses: cs, after, line };
          }
          if (p.v === 'begin') { const b = this.body(); this.expect('end'); return { k: 'block', body: b, line }; }
          if (p.v === 'try') {
            const b = this.body(); let ofc = null, catches = [], afterB = null;
            if (this.eat('of')) ofc = this.clauses(null);
            if (this.eat('catch')) {
              do {
                const l2 = this.peek().line;
                this.noRemote = true; let cls = null, pat;
                try { pat = this.expr(); } finally { this.noRemote = false; }
                if (this.eat(':')) { cls = pat; pat = this.expr(); }
                const guard = this.eat('when') ? this.guard() : null; this.expect('->');
                catches.push({ cls, pat, guard, body: this.body(), line: l2 });
              } while (this.eat(';'));
            }
            if (this.eat('after')) afterB = this.body();
            this.expect('end');
            return { k: 'try', body: b, ofc, catches, after: afterB, line };
          }
      }
      throw new SyntaxErr(`syntax error before: ${tokText(p)}`, p.line, p.col);
    }
  }

  /* ── the compiler's check for unbound variables: Erlang rejects a use of a variable that no
     pattern before it binds, before running anything ── */
  function firstUnbound(body, bound) {
    let err = null;
    const use = (e, B) => {
      if (err || !e || typeof e !== 'object') return;
      switch (e.k) {
        case 'var': if (e.n !== '_' && !B.has(e.n)) err = e; return;
        case 'lit': case 'funref': case 'recindex': return;
        case 'match': use(e.e, B); pat(e.p, B); return;
        case 'fun': e.clauses.forEach(c => { const B2 = new Set(B); if (e.fname) B2.add(e.fname); clause(c, B2); }); return;
        case 'case': case 'receive': {
          if (e.e) use(e.e, B);
          const added = e.clauses.map(c => clause(c, new Set(B)));
          if (e.after) { use(e.after.t, B); seq(e.after.body, new Set(B)); }
          added.forEach(A => A.forEach(n => B.add(n)));
          return;
        }
        case 'if': e.clauses.map(c => { const B2 = new Set(B); c.guard.forEach(g => g.forEach(x => use(x, B2))); seq(c.body, B2); return B2; }).forEach(A => A.forEach(n => B.add(n))); return;
        case 'lc': { const B2 = new Set(B); for (const q of e.quals) { if (q.filter) use(q.filter, B2); else { use(q.src, B2); pat(q.gen, B2); } } use(e.e, B2); return; }
        case 'block': seq(e.body, B); return;
        case 'try': {
          seq(e.body, B);
          if (e.ofc) e.ofc.map(c => clause(c, new Set(B))).forEach(A => A.forEach(n => B.add(n)));
          e.catches.forEach(c => { const B2 = new Set(B); if (c.cls) pat(c.cls, B2); pat(c.pat, B2); if (c.guard) c.guard.forEach(g => g.forEach(x => use(x, B2))); seq(c.body, B2); });
          if (e.after) seq(e.after, B);
          return;
        }
        case 'call': if (!(e.f.k === 'lit')) use(e.f, B); e.args.forEach(a => use(a, B)); return;
        case 'remote': use(e.m, B); use(e.f, B); return;
        case 'map': case 'mapupdate': if (e.e) use(e.e, B); e.assoc.forEach(a => { use(a.k, B); use(a.v, B); }); return;
        case 'record': case 'recupdate': if (e.e) use(e.e, B); e.fields.forEach(f => use(f.e, B)); return;
        case 'recfield': use(e.e, B); return;
        case 'tuple': e.items.forEach(x => use(x, B)); return;
        case 'list': e.items.forEach(x => use(x, B)); if (e.tail) use(e.tail, B); return;
        case 'send': use(e.to, B); use(e.msg, B); return;
        case 'op': use(e.a, B); use(e.b, B); return;
        case 'unop': case 'catch': use(e.a || e.e, B); return;
      }
    };
    // a pattern binds its new variables; map keys and bound variables in it are uses
    const pat = (p, B) => {
      if (err || !p) return;
      switch (p.k) {
        case 'var': if (p.n !== '_') B.add(p.n); return;
        case 'tuple': p.items.forEach(x => pat(x, B)); return;
        case 'list': p.items.forEach(x => pat(x, B)); if (p.tail) pat(p.tail, B); return;
        case 'map': p.assoc.forEach(a => { use(a.k, B); pat(a.v, B); }); return;
        case 'record': p.fields.forEach(f => pat(f.e, B)); return;
        case 'match': pat(p.p, B); pat(p.e, B); return;
        case 'op': if (p.op === '++') { use(p.a, B); pat(p.b, B); } return;
      }
    };
    const clause = (c, B) => { c.pats.forEach(p => pat(p, B)); if (c.guard) c.guard.forEach(g => g.forEach(x => use(x, B))); seq(c.body, B); return B; };
    const seq = (es, B) => es.forEach(x => use(x, B));
    seq(body, bound);
    return err;
  }

  /* ════════════════════════════════════════════════════════════════
     3. Evaluator (generators), processes and the scheduler
     ════════════════════════════════════════════════════════════════ */
  const reasonText = e => { if (!(e instanceof ErlError)) return String(e); return e.message || show(e.reason); };
  class Proc {
    constructor(id, name) { this.id = id; this.pid = new Pid(id); this.name = name; this.mailbox = []; this.frames = []; this.done = false; this.sleepUntil = 0; this.waiting = null; this.registered = null; this.exit = null; }
  }
  class Interp {
    constructor(opts) {
      this.opts = opts; this.out = ''; this.trace = []; this.steps = 0; this.maxSteps = opts.maxSteps || 3000;
      this.modules = new Map(); this.records = new Map(); this.procs = []; this.registry = new Map(); this.clock = 0; this.nextPid = 84;
      this.messages = []; // delivered messages, for the view: {from, to, msg, at}
      this.results = [];
    }
    *step(kind, info) { yield { kind, info }; }
    spawn(genFn, name) {
      const p = new Proc(this.nextPid++, name);
      const self = this;
      p.gen = (function* () {
        try { p.value = yield* genFn(p); }
        catch (e) { if (e instanceof ErlError && e.reason !== atom('steplimit')) { p.exit = e; if (p.id !== self.mainPid && e.kind !== 'exit') self.emit(`=ERROR REPORT====\nError in process <0.${p.id}.0> with exit value:\n${fmtExit(e)}\n\n`); } else throw e; }
        p.done = true;
      })();
      this.procs.push(p);
      return p;
    }
    emit(s) { this.out += s; }
    snap(kind, line, proc) {
      if (++this.steps > this.maxSteps) throw new ErlError('error', atom('steplimit'), `stopped after ${this.maxSteps} steps (an endless loop?)`);
      this.trace.push({ kind, line, pid: proc ? proc.id : null, outLen: this.out.length, view: this.view() });
    }
    view() {
      return {
        procs: this.procs.map(p => ({ id: p.id, name: p.registered || p.name, status: p.done ? (p.exit ? 'exited: ' + short(reasonText(p.exit)) : 'finished') : p.waiting ? 'waiting in receive' : p.sleepUntil > this.clock ? 'sleeping' : 'runnable',
          mailbox: p.mailbox.map(m => short(show(m.msg))), skipped: p.waiting ? p.waiting.skipped : p.scan ? p.scan.skipped : 0, hit: p.scan ? p.scan.hit : -1,
          frames: p.frames.map(f => ({ name: f.name, vars: [...f.vars].filter(([n]) => !n.startsWith('_')).map(([n, v]) => [n, short(show(v))]) })) })),
        msgs: this.messages.slice(-6).map(m => ({ from: m.from, to: m.to, msg: short(show(m.msg)), at: m.at })),
        clock: this.clock, results: this.results.slice(),
      };
    }
    lookupFn(mod, name, arity, line) {
      const m = this.modules.get(mod);
      if (!m) throw new ErlError('error', new Tuple([atom('undef')]), `undefined function ${mod}:${name}/${arity}`);
      const f = m.funcs.get(name + '/' + arity);
      if (!f) throw new ErlError('error', atom('undef'), `undefined function ${mod}:${name}/${arity}`);
      return f;
    }

    /* ── pattern matching: binds new variables into vars, compares bound ones ── */
    match(p, v, vars) {
      switch (p.k) {
        case 'var': if (p.n === '_') return true; if (vars.has(p.n)) return eqv(vars.get(p.n), v, true); vars.set(p.n, v); return true;
        case 'lit': return eqv(p.v, v, true);
        case 'tuple': return v instanceof Tuple && v.items.length === p.items.length && p.items.every((q, k) => this.match(q, v.items[k], vars));
        case 'list': {
          let x = v;
          for (const q of p.items) { if (!(x instanceof Cons)) return false; if (!this.match(q, x.h, vars)) return false; x = x.t; }
          return p.tail ? this.match(p.tail, x, vars) : x === NIL;
        }
        case 'map': { if (!(v instanceof EMap)) return false; for (const a of p.assoc) { const key = this.constVal(a.k, vars); const got = mapGet(v, key); if (got === undefined || !this.match(a.v, got, vars)) return false; } return true; }
        case 'record': { const fields = this.records.get(p.r); if (!fields || !(v instanceof Tuple) || v.items[0] !== atom(p.r)) return false; for (const f of p.fields) { const k = fields.findIndex(x => x.f === f.f); if (!this.match(f.e, v.items[k + 1], vars)) return false; } return true; }
        case 'match': return this.match(p.p, v, vars) && this.match(p.e, v, vars);
        case 'op': if (p.op === '++' && p.a.k === 'lit') { let x = v, pre = p.a.v; while (pre instanceof Cons) { if (!(x instanceof Cons) || !eqv(x.h, pre.h, true)) return false; pre = pre.t; x = x.t; } return this.match(p.b, x, vars); } break;
        case 'unop': if (p.op === '-' && p.a.k === 'lit') return eqv(-p.a.v, v, true); break;
      }
      throw new ErlError('error', atom('illegal_pattern'), 'illegal pattern');
    }
    constVal(e, vars) { if (e.k === 'lit') return e.v; if (e.k === 'var' && vars.has(e.n)) return vars.get(e.n); throw new ErlError('error', atom('illegal_pattern'), 'illegal map key in pattern'); }
    // guards: no side effects, errors mean false
    guardOk(alts, vars, proc) {
      if (!alts) return true;
      return alts.some(g => g.every(e => { try { return this.evalSync(e, vars, proc) === TRUE; } catch (_) { return false; } }));
    }
    evalSync(e, vars, proc) { const g = this.ev(e, vars, proc); let r; for (;;) { r = g.next(); if (r.done) return r.value; } }

    // tail: the body is in tail position, so a call as its last expression becomes a TailCall that
    // the caller's callFun runs in place of the current frame (Erlang's last call optimisation)
    *body(es, vars, proc, frame, tail = false) {
      let v = null;
      for (let k = 0; k < es.length; k++) {
        const e = es[k];
        if (frame) frame.cur = e;
        yield* this.step('expr', e.line);
        v = yield* this.ev(e, vars, proc, tail && k === es.length - 1);
      }
      return v;
    }
    *callFun(f, args, proc, line) {
      for (;;) {
        if (f.native) return yield* f.native.call(this, args, proc, line);
        if (f.arity !== undefined && f.arity !== args.length) throw new ErlError('error', new Tuple([atom('badarity'), new Tuple([f, list(args)])]), f.name ? `${show(f)} called with ${args.length} argument${args.length === 1 ? '' : 's'}` : `interpreted function with arity ${f.arity} called with ${['no arguments', 'one argument', 'two arguments'][args.length] || args.length + ' arguments'}`);
        if (proc.frames.length > 250) throw new ErlError('error', atom('steplimit'), 'more than 250 nested calls that are not tail calls: this stepper stops there (Erlang itself would grow the stack)');
        let hit = null;
        for (const c of f.clauses) {
          if (c.pats.length !== args.length) continue;
          const vars = new Map(f.env || []);
          if (c.pats.every((p, k) => this.match(p, args[k], vars)) && this.guardOk(c.guard, vars, proc)) { hit = { c, vars }; break; }
        }
        if (!hit) throw new ErlError('error', atom('function_clause'), `no function clause matching ${f.name ? (f.mod ? f.mod + ':' : '') + f.name : 'fun'}(${args.map(a => show(a)).join(',')})${f.name && f.mod && f.line ? ` (${f.mod}.erl:${f.line})` : ''}`);
        const { c, vars } = hit;
        const frame = { name: f.name ? `${f.mod ? f.mod + ':' : ''}${f.name}/${args.length}` : 'fun', vars, cur: null };
        proc.frames.push(frame);
        let r;
        try { r = yield* this.body(c.body, vars, proc, frame, true); }
        catch (e) { if (e instanceof ErlError && !e.where && f.name && f.mod) e.where = { mod: f.mod, name: f.name, arity: args.length, line: frame.cur ? frame.cur.line : c.line }; throw e; }
        finally { proc.frames.pop(); }
        if (!(r instanceof TailCall)) return r;
        f = r.target; args = r.args;
        if (f.mod) proc.mod = f.mod;
      }
    }

    *ev(e, vars, proc, tail = false) {
      switch (e.k) {
        case 'lit': return e.v;
        case 'var': {
          if (e.n === '_') throw new ErlError('error', atom('unbound'), "variable '_' is unbound");
          if (!vars.has(e.n)) throw new ErlError('error', atom('unbound'), `variable '${e.n}' is unbound`);
          return vars.get(e.n);
        }
        case 'match': {
          const v = yield* this.ev(e.e, vars, proc);
          const trial = new Map(vars);
          if (!this.match(e.p, v, trial)) throw new ErlError('error', new Tuple([atom('badmatch'), v]), `no match of right hand side value ${show(v)}`);
          for (const [k, x] of trial) vars.set(k, x);
          return v;
        }
        case 'tuple': { const items = []; for (const x of e.items) items.push(yield* this.ev(x, vars, proc)); return new Tuple(items); }
        case 'list': { const items = []; for (const x of e.items) items.push(yield* this.ev(x, vars, proc)); let l = e.tail ? yield* this.ev(e.tail, vars, proc) : NIL; for (let k = items.length - 1; k >= 0; k--) l = new Cons(items[k], l); return l; }
        case 'map': { let m = new EMap([]); for (const a of e.assoc) m = mapPut(m, yield* this.ev(a.k, vars, proc), yield* this.ev(a.v, vars, proc)); return m; }
        case 'mapupdate': {
          let m = yield* this.ev(e.e, vars, proc);
          if (!(m instanceof EMap)) throw new ErlError('error', new Tuple([atom('badmap'), m]), `bad map: ${show(m)}`);
          for (const a of e.assoc) { const k = yield* this.ev(a.k, vars, proc); if (a.op === ':=' && mapGet(m, k) === undefined) throw new ErlError('error', new Tuple([atom('badkey'), k]), `bad key: ${show(k)}`); m = mapPut(m, k, yield* this.ev(a.v, vars, proc)); }
          return m;
        }
        case 'record': {
          const fields = this.records.get(e.r); if (!fields) throw new ErlError('error', atom('undefined_record'), `record ${e.r} undefined`);
          const vals = [];
          for (const f of fields) { const given = e.fields.find(x => x.f === f.f); vals.push(given ? yield* this.ev(given.e, vars, proc) : f.def ? yield* this.ev(f.def, new Map(), proc) : UNDEF); }
          return new Tuple([atom(e.r), ...vals]);
        }
        case 'recfield': { const t = yield* this.ev(e.e, vars, proc); const fields = this.records.get(e.r); const k = fields ? fields.findIndex(x => x.f === e.f) : -1; if (!(t instanceof Tuple) || t.items[0] !== atom(e.r) || k < 0) throw new ErlError('error', new Tuple([atom('badrecord'), t]), `bad record ${e.r}: ${show(t)}`); return t.items[k + 1]; }
        case 'recupdate': { const t = yield* this.ev(e.e, vars, proc); const fields = this.records.get(e.r); if (!(t instanceof Tuple) || t.items[0] !== atom(e.r)) throw new ErlError('error', new Tuple([atom('badrecord'), t]), `bad record ${e.r}`); const items = t.items.slice(); for (const f of e.fields) items[fields.findIndex(x => x.f === f.f) + 1] = yield* this.ev(f.e, vars, proc); return new Tuple(items); }
        case 'recindex': { const fields = this.records.get(e.r); return BigInt(fields.findIndex(x => x.f === e.f) + 2); }
        case 'fun': { const env = new Map(vars); const f = new Fun(e.clauses, env, null, e.clauses[0].pats.length, proc.mod); if (e.fname) env.set(e.fname, f); return f; }
        case 'funref': { const mod = e.mod || proc.mod; const f = this.lookupFn(mod, e.name, e.arity, e.line); return f; }
        case 'block': return yield* this.body(e.body, vars, proc, null, tail);
        case 'catch': { try { return yield* this.ev(e.e, vars, proc); } catch (x) { if (!(x instanceof ErlError) || x.reason === atom('steplimit')) throw x; if (x.kind === 'throw') return x.reason; return new Tuple([atom('EXIT'), new Tuple([x.reason, NIL])]); } }
        case 'case': {
          const v = yield* this.ev(e.e, vars, proc);
          for (const c of e.clauses) { const trial = new Map(vars); if (this.match(c.pats[0], v, trial) && this.guardOk(c.guard, trial, proc)) { for (const [k, x] of trial) vars.set(k, x); return yield* this.body(c.body, vars, proc, null, tail); } }
          throw new ErlError('error', new Tuple([atom('case_clause'), v]), `no case clause matching ${show(v)}`);
        }
        case 'if': { for (const c of e.clauses) if (this.guardOk(c.guard, vars, proc)) return yield* this.body(c.body, vars, proc, null, tail); throw new ErlError('error', atom('if_clause'), 'no true branch found when evaluating an if expression'); }
        case 'lc': {
          const out = [];
          const walk = function* (self, k, env) {
            if (k === e.quals.length) { out.push(yield* self.ev(e.e, env, proc)); return; }
            const q = e.quals[k];
            if (q.filter) { const v = yield* self.ev(q.filter, env, proc); if (v === TRUE) yield* walk(self, k + 1, env); return; }
            const src = toArr(yield* self.ev(q.src, env, proc), 'list comprehension');
            for (const x of src) { const env2 = new Map(env); if (self.match(q.gen, x, env2)) yield* walk(self, k + 1, env2); }
          };
          yield* walk(this, 0, vars);
          return list(out);
        }
        case 'send': {
          let to = yield* this.ev(e.to, vars, proc);
          const msg = yield* this.ev(e.msg, vars, proc);
          if (to instanceof Atom) { const p = this.registry.get(to.n); if (!p || p.done) throw new ErlError('error', badarg(), `bad argument\n     in operator  !/2\n        called as ${show(to)} ! ${show(msg)}`); to = p.pid; }
          if (!(to instanceof Pid)) throw new ErlError('error', badarg(), `bad argument\n     in operator  !/2\n        called as ${show(to)} ! ${show(msg)}`);
          const target = this.procs.find(p => p.id === to.n);
          if (target && !target.done) target.mailbox.push({ msg, from: proc.id });
          this.messages.push({ from: proc.id, to: to.n, msg, at: this.steps });
          yield* this.step('send', e.line);
          return msg;
        }
        case 'receive': return yield* this.receive(e, vars, proc, tail);
        case 'try': {
          let v;
          try {
            v = yield* this.body(e.body, vars, proc);
            if (e.ofc) { let hit = null; for (const c of e.ofc) { const trial = new Map(vars); if (this.match(c.pats[0], v, trial) && this.guardOk(c.guard, trial, proc)) { hit = [c, trial]; break; } } if (!hit) throw new ErlError('error', new Tuple([atom('try_clause'), v]), `no try clause matching ${show(v)}`); for (const [k, x] of hit[1]) vars.set(k, x); v = yield* this.body(hit[0].body, vars, proc); }
            return v;
          } catch (x) {
            if (!(x instanceof ErlError) || x.reason === atom('steplimit')) throw x;
            for (const c of e.catches) {
              const cls = c.cls ? c.cls.v : atom('throw');
              const clsName = cls instanceof Atom ? cls.n : '_';
              if (c.cls && c.cls.k === 'var') { /* Class:Reason with a variable class */ } else if (clsName !== x.kind) continue;
              const trial = new Map(vars);
              if (c.cls && c.cls.k === 'var' && !this.match(c.cls, atom(x.kind), trial)) continue;
              if (this.match(c.pat, x.reason, trial) && this.guardOk(c.guard, trial, proc)) { for (const [k, y] of trial) vars.set(k, y); return yield* this.body(c.body, vars, proc); }
            }
            throw x;
          } finally { if (e.after) yield* this.body(e.after, vars, proc); }
        }
        case 'unop': {
          const a = yield* this.ev(e.a, vars, proc);
          if (e.op === 'not') { if (a !== TRUE && a !== FALSE) throw badarith(); return bool(a === FALSE); }
          if (e.op === '-') { if (!isNum(a)) throw badarith(a, '-'); return -a; }
          if (e.op === '+') return a;
          if (e.op === 'bnot') return ~a;
          break;
        }
        case 'op': return yield* this.binop(e, vars, proc);
        case 'remote': { const m = yield* this.ev(e.m, vars, proc), f = yield* this.ev(e.f, vars, proc); return { remote: true, m, f }; }
        case 'call': return yield* this.call(e, vars, proc, tail);
      }
      throw new ErlError('error', atom('internal'), 'cannot evaluate ' + e.k);
    }
    *binop(e, vars, proc) {
      const op = e.op;
      if (op === 'andalso') { const a = yield* this.ev(e.a, vars, proc); if (a === FALSE) return FALSE; if (a !== TRUE) throw new ErlError('error', new Tuple([atom('badarg'), a]), `bad argument: ${show(a)}`); return yield* this.ev(e.b, vars, proc); }
      if (op === 'orelse') { const a = yield* this.ev(e.a, vars, proc); if (a === TRUE) return TRUE; if (a !== FALSE) throw new ErlError('error', new Tuple([atom('badarg'), a]), `bad argument: ${show(a)}`); return yield* this.ev(e.b, vars, proc); }
      const a = yield* this.ev(e.a, vars, proc), b = yield* this.ev(e.b, vars, proc);
      switch (op) {
        case '+': case '-': case '*': {
          if (!isNum(a) || !isNum(b)) throw badarith(a, op, b);
          if (isInt(a) && isInt(b)) return op === '+' ? a + b : op === '-' ? a - b : a * b;
          const x = Number(a), y = Number(b); const r = op === '+' ? x + y : op === '-' ? x - y : x * y; if (!Number.isFinite(r)) throw badarith(a, op, b); return r;
        }
        case '/': { if (!isNum(a) || !isNum(b)) throw badarith(a, op, b); const r = Number(a) / Number(b); if (Number(b) === 0 || !Number.isFinite(r)) throw badarith(a, op, b); return r; }
        case 'div': case 'rem': { if (!isInt(a) || !isInt(b) || b === 0n) throw badarith(a, op, b); return op === 'div' ? a / b : a % b; }
        case 'band': return a & b; case 'bor': return a | b; case 'bxor': return a ^ b; case 'bsl': return a << b; case 'bsr': return a >> b;
        case 'and': case 'or': case 'xor': { if ((a !== TRUE && a !== FALSE) || (b !== TRUE && b !== FALSE)) throw new ErlError('error', badarg(), 'bad argument'); const x = a === TRUE, y = b === TRUE; return bool(op === 'and' ? x && y : op === 'or' ? x || y : x !== y); }
        case '==': return bool(eqv(a, b, false)); case '/=': return bool(!eqv(a, b, false));
        case '=:=': return bool(eqv(a, b, true)); case '=/=': return bool(!eqv(a, b, true));
        case '<': return bool(cmp(a, b) < 0); case '>': return bool(cmp(a, b) > 0); case '=<': return bool(cmp(a, b) <= 0); case '>=': return bool(cmp(a, b) >= 0);
        case '++': { const items = toArr(a, '++'); let l = b; for (let k = items.length - 1; k >= 0; k--) l = new Cons(items[k], l); return l; }
        case '--': { const items = toArr(a, '--'); for (const y of toArr(b, '--')) { const k = items.findIndex(x => eqv(x, y, true)); if (k >= 0) items.splice(k, 1); } return list(items); }
      }
      throw new ErlError('error', atom('internal'), 'unknown operator ' + op);
    }
    *call(e, vars, proc, tail = false) {
      const args = [];
      let target;
      if (e.f.k === 'remote') {
        const m = yield* this.ev(e.f.m, vars, proc), f = yield* this.ev(e.f.f, vars, proc);
        for (const a of e.args) args.push(yield* this.ev(a, vars, proc));
        const key = m.n + ':' + f.n + '/' + args.length;
        const bif = BIFS[key] || BIFS[m.n + ':' + f.n + '/*'];
        if (bif) return yield* bif.call(this, args, proc, e.line);
        target = this.lookupFn(m.n, f.n, args.length, e.line);
        const mod = this.modules.get(m.n);
        if (mod && !mod.exports.has(f.n + '/' + args.length) && m.n !== proc.mod) throw new ErlError('error', atom('undef'), `undefined function ${m.n}:${f.n}/${args.length}`);
      } else if (e.f.k === 'lit' && e.f.v instanceof Atom) {
        for (const a of e.args) args.push(yield* this.ev(a, vars, proc));
        const name = e.f.v.n;
        const bif = BIFS['erlang:' + name + '/' + args.length] || BIFS['erlang:' + name + '/*'];
        if (!proc.mod && name === 'flush' && !args.length) { for (const m of proc.mailbox.splice(0)) this.emit(`Shell got ${show(m.msg)}\n`); return OK; }
        const local = proc.mod && this.modules.get(proc.mod) && this.modules.get(proc.mod).funcs.get(name + '/' + args.length);
        if (local) target = local;
        else if (this.imports && this.imports.has(name + '/' + args.length)) { const m = this.imports.get(name + '/' + args.length); const b2 = BIFS[m + ':' + name + '/' + args.length]; if (b2) return yield* b2.call(this, args, proc, e.line); target = this.lookupFn(m, name, args.length, e.line); }
        else if (bif) return yield* bif.call(this, args, proc, e.line);
        else throw new ErlError('error', atom('undef'), proc.mod ? `undefined function ${name}/${args.length}` : `undefined shell command ${name}/${args.length}`);
      } else {
        target = yield* this.ev(e.f, vars, proc);
        for (const a of e.args) args.push(yield* this.ev(a, vars, proc));
        if (!(target instanceof Fun)) throw new ErlError('error', new Tuple([atom('badfun'), target]), `bad function ${show(target)}`);
      }
      yield* this.step('call', e.line);
      if (tail) return new TailCall(target, args);
      const prevMod = proc.mod;
      if (target.mod) proc.mod = target.mod;
      try { return yield* this.callFun(target, args, proc, e.line); }
      finally { proc.mod = prevMod; }
    }
    *receive(e, vars, proc, tail = false) {
      let deadline = Infinity;
      if (e.after) { const t = yield* this.ev(e.after.t, vars, proc); if (t !== atom('infinity')) { if (!isInt(t) || t < 0n) throw new ErlError('error', new Tuple([atom('timeout_value')]), `bad receive timeout value: ${show(t)}`); deadline = this.clock + Number(t); } }
      proc.waiting = { skipped: 0 };
      for (;;) {
        // selective receive: the oldest message that matches a clause; the ones before it stay
        for (let k = 0; k < proc.mailbox.length; k++) {
          const m = proc.mailbox[k].msg;
          for (const c of e.clauses) {
            const trial = new Map(vars);
            if (this.match(c.pats[0], m, trial) && this.guardOk(c.guard, trial, proc)) {
              proc.waiting = null; proc.scan = { skipped: k, hit: k };
              yield* this.step('receive', c.line);
              proc.mailbox.splice(k, 1); proc.scan = null;
              for (const [kk, x] of trial) vars.set(kk, x);
              return yield* this.body(c.body, vars, proc, null, tail);
            }
          }
        }
        proc.waiting.skipped = proc.mailbox.length;
        if (this.clock >= deadline) { proc.waiting = null; yield* this.step('timeout', e.line); return yield* this.body(e.after.body, vars, proc, null, tail); }
        proc.waiting.until = deadline;
        yield { kind: 'block' };
      }
    }
  }
  // Eshell explains a failed operator: the operator and the values it was called with
const badarith = (a, op, b) => new ErlError('error', atom('badarith'), 'an error occurred when evaluating an arithmetic expression' + (op === undefined ? '' : `\n     in operator  ${op === '/' ? "'/'" : op}/${b === undefined ? 1 : 2}\n        called as ${b === undefined ? op + ' ' + show(a) : show(a) + ' ' + op + ' ' + show(b)}`));
  const short = s => (s.length > 60 ? s.slice(0, 57) + '...' : s);
  // the exit value of a crashed process: the reason and (the innermost frame of) the stack
  function fmtExit(e) {
    const w = e.where, stack = w ? `[{${atomText(atom(w.mod))},${atomText(atom(w.name))},${w.arity},[{file,"${w.mod}.erl"},{line,${w.line}}]}]` : '[]';
    return `{${e.kind === 'throw' ? `{nocatch,${show(e.reason)}}` : show(e.reason)},${stack}}`;
  }

  /* ════════════════════════════════════════════════════════════════
     4. Built-in functions (the parts of erlang, io, lists, maps, timer the course uses)
     ════════════════════════════════════════════════════════════════ */
  function* callF(I, f, args, proc, line) { if (!(f instanceof Fun)) throw new ErlError('error', new Tuple([atom('badfun'), f]), `bad function ${show(f)}`); const prev = proc.mod; if (f.mod) proc.mod = f.mod; try { return yield* I.callFun(f, args, proc, line); } finally { proc.mod = prev; } }
  // a failed built-in, explained the way Eshell does: which function, called with what, and why
  const bifErr = (reason, text, mfa, args, why) => new ErlError('error', reason, `${text}\n     in function  ${mfa}/${args.length}\n        called as ${mfa}(${args.map(a => show(a)).join(',')})${why ? '\n        *** ' + why : ''}`);
  const BIFS = {
    'io:format/1': function* (a) { this.emit(format(chars(a[0]), NIL)); return OK; },
    'io:format/2': function* (a) { let t; try { t = format(chars(a[0]), a[1]); } catch (e) { throw bifErr(badarg(), 'bad argument', 'io:format', a, 'argument 1: wrong number of arguments'); } this.emit(t); return OK; },
    'io:fwrite/1': function* (a) { this.emit(format(chars(a[0]), NIL)); return OK; },
    'io:fwrite/2': function* (a) { this.emit(format(chars(a[0]), a[1])); return OK; },
    'io:put_chars/1': function* (a) { this.emit(chars(a[0])); return OK; },
    'io_lib:format/2': function* (a) { return str(format(chars(a[0]), a[1])); },
    'erlang:self/0': function* (a, proc) { return proc.pid; },
    'erlang:spawn/1': function* (a, proc, line) { const f = a[0]; const I = this; const p = this.spawn(function* (pp) { return yield* callF(I, f, [], pp, line); }, 'spawned'); yield* this.step('spawn', line); return p.pid; },
    'erlang:spawn/3': function* (a, proc, line) { const [m, f, args] = a; const I = this; const argv = toArr(args); const fn = this.lookupFn(m.n, f.n, argv.length, line); const p = this.spawn(function* (pp) { pp.mod = m.n; return yield* I.callFun(fn, argv, pp, line); }, `${m.n}:${f.n}`); yield* this.step('spawn', line); return p.pid; },
    'erlang:register/2': function* (a) { const [n, pid] = a; if (this.registry.has(n.n)) throw new ErlError('error', badarg(), `bad argument: ${n.n} is already registered`); const p = this.procs.find(x => x.id === pid.n); this.registry.set(n.n, p); p.registered = n.n; return TRUE; },
    'erlang:unregister/1': function* (a) { const p = this.registry.get(a[0].n); if (p) p.registered = null; this.registry.delete(a[0].n); return TRUE; },
    'erlang:whereis/1': function* (a) { const p = this.registry.get(a[0].n); return p && !p.done ? p.pid : UNDEF; },
    'erlang:registered/0': function* () { return list([...this.registry.keys()].map(atom)); },
    'erlang:is_process_alive/1': function* (a) { const p = this.procs.find(x => x.id === a[0].n); return bool(p && !p.done); },
    'timer:sleep/1': function* (a, proc) { proc.sleepUntil = this.clock + Number(a[0]); while (this.clock < proc.sleepUntil) yield { kind: 'block' }; return OK; },
    'erlang:length/1': function* (a) { return BigInt(toArr(a[0], 'length').length); },
    'erlang:hd/1': function* (a) { if (!(a[0] instanceof Cons)) throw new ErlError('error', badarg(), 'bad argument: hd([])'); return a[0].h; },
    'erlang:tl/1': function* (a) { if (!(a[0] instanceof Cons)) throw new ErlError('error', badarg(), 'bad argument: tl([])'); return a[0].t; },
    'erlang:element/2': function* (a) { const t = a[1], i = Number(a[0]); if (!(t instanceof Tuple) || i < 1 || i > t.items.length) throw new ErlError('error', badarg(), 'bad argument'); return t.items[i - 1]; },
    'erlang:setelement/3': function* (a) { const items = a[1].items.slice(); items[Number(a[0]) - 1] = a[2]; return new Tuple(items); },
    'erlang:tuple_size/1': function* (a) { return BigInt(a[0].items.length); }, 'erlang:size/1': function* (a) { return BigInt(a[0].items.length); },
    'erlang:tuple_to_list/1': function* (a) { return list(a[0].items); }, 'erlang:list_to_tuple/1': function* (a) { return new Tuple(toArr(a[0])); },
    'erlang:abs/1': function* (a) { return isInt(a[0]) ? (a[0] < 0n ? -a[0] : a[0]) : Math.abs(a[0]); },
    'erlang:max/2': function* (a) { return cmp(a[0], a[1]) >= 0 ? a[0] : a[1]; }, 'erlang:min/2': function* (a) { return cmp(a[0], a[1]) <= 0 ? a[0] : a[1]; },
    'erlang:round/1': function* (a) { return BigInt(Math.round(Number(a[0]))); }, 'erlang:trunc/1': function* (a) { return BigInt(Math.trunc(Number(a[0]))); },
    'erlang:float/1': function* (a) { return Number(a[0]); },
    'erlang:integer_to_list/1': function* (a) { return str(a[0].toString()); }, 'erlang:list_to_integer/1': function* (a) { const s = chars(a[0]); if (!/^[-+]?\d+$/.test(s)) throw new ErlError('error', badarg(), 'bad argument'); return BigInt(s); },
    'erlang:atom_to_list/1': function* (a) { return str(a[0].n); }, 'erlang:list_to_atom/1': function* (a) { const n = chars(a[0]); noteAtom(n); return atom(n); },
    'erlang:float_to_list/1': function* (a) { return str(Number(a[0]).toExponential(20).replace(/e([-+])(\d)$/, 'e$10$2')); },
    'erlang:is_atom/1': function* (a) { return bool(a[0] instanceof Atom); }, 'erlang:is_integer/1': function* (a) { return bool(isInt(a[0])); }, 'erlang:is_float/1': function* (a) { return bool(typeof a[0] === 'number'); },
    'erlang:is_number/1': function* (a) { return bool(isNum(a[0])); }, 'erlang:is_list/1': function* (a) { return bool(a[0] instanceof Cons || a[0] === NIL); }, 'erlang:is_tuple/1': function* (a) { return bool(a[0] instanceof Tuple); },
    'erlang:is_map/1': function* (a) { return bool(a[0] instanceof EMap); }, 'erlang:is_pid/1': function* (a) { return bool(a[0] instanceof Pid); }, 'erlang:is_function/1': function* (a) { return bool(a[0] instanceof Fun); },
    'erlang:is_boolean/1': function* (a) { return bool(a[0] === TRUE || a[0] === FALSE); },
    'erlang:throw/1': function* (a) { throw new ErlError('throw', a[0], show(a[0])); },
    'erlang:error/1': function* (a) { throw new ErlError('error', a[0], show(a[0])); },
    'erlang:exit/1': function* (a) { throw new ErlError('exit', a[0], show(a[0])); },
    'erlang:node/0': function* () { return atom('nonode@nohost'); },
    'lists:map/2': function* (a, proc, line) { const out = []; for (const x of toArr(a[1], 'lists:map')) out.push(yield* callF(this, a[0], [x], proc, line)); return list(out); },
    'lists:filter/2': function* (a, proc, line) { const out = []; for (const x of toArr(a[1], 'lists:filter')) if ((yield* callF(this, a[0], [x], proc, line)) === TRUE) out.push(x); return list(out); },
    'lists:foldl/3': function* (a, proc, line) { let acc = a[1]; for (const x of toArr(a[2], 'lists:foldl')) acc = yield* callF(this, a[0], [x, acc], proc, line); return acc; },
    'lists:foldr/3': function* (a, proc, line) { let acc = a[1]; for (const x of toArr(a[2], 'lists:foldr').reverse()) acc = yield* callF(this, a[0], [x, acc], proc, line); return acc; },
    'lists:foreach/2': function* (a, proc, line) { for (const x of toArr(a[1], 'lists:foreach')) yield* callF(this, a[0], [x], proc, line); return OK; },
    'lists:reverse/1': function* (a) { return list(toArr(a[0]).reverse()); },
    'lists:sort/1': function* (a) { return list(toArr(a[0]).map((x, i) => [x, i]).sort((p, q) => cmp(p[0], q[0]) || p[1] - q[1]).map(p => p[0])); },
    'lists:sort/2': function* (a, proc, line) { const xs = toArr(a[1]); const out = []; for (const x of xs) { let k = out.length; while (k > 0 && (yield* callF(this, a[0], [out[k - 1], x], proc, line)) === FALSE) k--; out.splice(k, 0, x); } return list(out); },
    'lists:seq/2': function* (a) { const out = []; for (let k = a[0]; k <= a[1]; k++) out.push(k); return list(out); },
    'lists:seq/3': function* (a) { const out = []; for (let k = a[0]; a[2] > 0n ? k <= a[1] : k >= a[1]; k += a[2]) out.push(k); return list(out); },
    'lists:sum/1': function* (a) { return toArr(a[0]).reduce((s, x) => (isInt(s) && isInt(x) ? s + x : Number(s) + Number(x)), 0n); },
    'lists:max/1': function* (a) { return toArr(a[0]).reduce((m, x) => (cmp(x, m) > 0 ? x : m)); }, 'lists:min/1': function* (a) { return toArr(a[0]).reduce((m, x) => (cmp(x, m) < 0 ? x : m)); },
    'lists:nth/2': function* (a) { const xs = toArr(a[1]); const i = Number(a[0]); if (i < 1 || i > xs.length) throw new ErlError('error', atom('function_clause'), 'no function clause matching lists:nth'); return xs[i - 1]; },
    'lists:last/1': function* (a) { const xs = toArr(a[0]); return xs[xs.length - 1]; },
    'lists:append/1': function* (a) { return list([].concat(...toArr(a[0]).map(x => toArr(x)))); }, 'lists:append/2': function* (a) { return list(toArr(a[0]).concat(toArr(a[1]))); },
    'lists:member/2': function* (a) { return bool(toArr(a[1]).some(x => eqv(x, a[0], true))); },
    'lists:delete/2': function* (a) { const xs = toArr(a[1]); const k = xs.findIndex(x => eqv(x, a[0], true)); if (k >= 0) xs.splice(k, 1); return list(xs); },
    'lists:split/2': function* (a) { const xs = toArr(a[1]); const n = Number(a[0]); return new Tuple([list(xs.slice(0, n)), list(xs.slice(n))]); },
    'lists:zip/2': function* (a) { const xs = toArr(a[0]), ys = toArr(a[1]); return list(xs.map((x, k) => new Tuple([x, ys[k]]))); },
    'lists:flatten/1': function* (a) { const out = []; const walk = l => { for (const x of toArr(l)) { if (x instanceof Cons || x === NIL) walk(x); else out.push(x); } }; walk(a[0]); return list(out); },
    'lists:keyfind/3': function* (a) { const k = Number(a[1]); const hit = toArr(a[2]).find(t => t instanceof Tuple && eqv(t.items[k - 1], a[0], false)); return hit || FALSE; },
    'lists:duplicate/2': function* (a) { return list(Array(Number(a[0])).fill(a[1])); },
    'lists:all/2': function* (a, proc, line) { for (const x of toArr(a[1])) if ((yield* callF(this, a[0], [x], proc, line)) !== TRUE) return FALSE; return TRUE; },
    'lists:any/2': function* (a, proc, line) { for (const x of toArr(a[1])) if ((yield* callF(this, a[0], [x], proc, line)) === TRUE) return TRUE; return FALSE; },
    'maps:get/2': function* (a) { if (!(a[1] instanceof EMap)) throw bifErr(new Tuple([atom('badmap'), a[1]]), `bad map: ${show(a[1])}`, 'maps:get', a, 'argument 2: not a map'); const v = mapGet(a[1], a[0]); if (v === undefined) throw bifErr(new Tuple([atom('badkey'), a[0]]), `bad key: ${show(a[0])}`, 'maps:get', a, 'argument 1: not present in map'); return v; },
    'maps:get/3': function* (a) { const v = mapGet(a[1], a[0]); return v === undefined ? a[2] : v; },
    'maps:put/3': function* (a) { return mapPut(a[2], a[0], a[1]); },
    'maps:remove/2': function* (a) { return new EMap(a[1].entries.filter(([k]) => !eqv(k, a[0], true))); },
    'maps:find/2': function* (a) { const v = mapGet(a[1], a[0]); return v === undefined ? atom('error') : new Tuple([OK, v]); },
    'maps:is_key/2': function* (a) { return bool(mapGet(a[1], a[0]) !== undefined); },
    'maps:keys/1': function* (a) { return list(a[0].entries.map(e => e[0])); }, 'maps:values/1': function* (a) { return list(a[0].entries.map(e => e[1])); },
    'maps:size/1': function* (a) { return BigInt(a[0].entries.length); }, 'erlang:map_size/1': function* (a) { return BigInt(a[0].entries.length); },
    'maps:to_list/1': function* (a) { return list(a[0].entries.map(([k, v]) => new Tuple([k, v]))); },
    'maps:from_list/1': function* (a) { let m = new EMap([]); for (const t of toArr(a[0])) m = mapPut(m, t.items[0], t.items[1]); return m; },
    'string:uppercase/1': function* (a) { return str(chars(a[0]).toUpperCase()); }, 'string:lowercase/1': function* (a) { return str(chars(a[0]).toLowerCase()); },
    'string:length/1': function* (a) { return BigInt(chars(a[0]).length); },
  };

  // what the compiler rejects before anything runs: unbound variables, calls to local functions
  // that do not exist, exported functions that are not defined. The first error by position.
  function compileErrors(forms, mod, I) {
    const errs = [];
    const known = (name, ar) => mod.funcs.has(name + '/' + ar) || BIFS['erlang:' + name + '/' + ar] || (I.imports && I.imports.has(name + '/' + ar));
    const walk = x => {
      if (!x || typeof x !== 'object') return;
      if (Array.isArray(x)) { x.forEach(walk); return; }
      if (x instanceof Fun || x instanceof Atom || x instanceof Cons || x instanceof Tuple || x instanceof EMap) return;
      if (x.k === 'call' && x.f.k === 'lit' && x.f.v instanceof Atom && !known(x.f.v.n, x.args.length)) errs.push({ line: x.f.line, col: x.f.col || 1, msg: `function ${x.f.v.n}/${x.args.length} undefined` });
      if (x.k === 'funref' && !x.mod && !known(x.name, x.arity)) errs.push({ line: x.line, col: x.col || 1, msg: `function ${x.name}/${x.arity} undefined` });
      for (const [key, v] of Object.entries(x)) if (key !== 'v') walk(v);
    };
    for (const f of forms) {
      if (f.k === 'func') for (const c of f.clauses) {
        const u = firstUnbound([{ k: 'fun', clauses: [c] }], new Set());
        if (u) errs.push({ line: u.line, col: u.col, msg: `variable '${u.n}' is unbound` });
        walk(c);
      }
      if (f.k === 'attr' && f.name === 'export') for (const x of f.val.fs) if (!mod.funcs.has(x)) errs.push({ line: f.line, col: 2, msg: `function ${x} undefined` });
    }
    errs.sort((a, b) => a.line - b.line || a.col - b.col);
    return errs[0] || null;
  }

  /* ════════════════════════════════════════════════════════════════
     5. Running: load the module, run the shell expressions in the shell process
     ════════════════════════════════════════════════════════════════ */
  ERL.run = function (cfg) {
    newAtoms = new Map();
    const I = new Interp(cfg);
    const code = cfg.code || '', shellSrc = cfg.shell || '';
    let error = null;
    const codeLines = code ? code.split('\n').length : 0;
    try {
      if (code.trim()) {
        const p = new Parser(lex(code), I.records);
        const forms = p.forms();
        const modAttr = forms.find(f => f.k === 'attr' && f.name === 'module');
        const mod = { name: null, funcs: new Map(), exports: new Set() };
        if (modAttr) { const t = lex(code); const k = t.findIndex(x => x.v === 'module'); mod.name = t[k + 2].v; }
        else mod.name = 'user_default';
        for (const f of forms) {
          if (f.k === 'func') { const fn = new Fun(f.clauses, null, f.name, f.arity, mod.name); fn.line = f.line; mod.funcs.set(f.name + '/' + f.arity, fn); }
          if (f.k === 'attr' && f.name === 'export') f.val.fs.forEach(x => mod.exports.add(x));
          if (f.k === 'attr' && f.name === 'import') { I.imports = I.imports || new Map(); f.val.fs.forEach(x => I.imports.set(x, f.val.mod)); }
        }
        const bad = compileErrors(forms, mod, I);
        if (bad) throw new SyntaxErr(bad.msg, bad.line, bad.col);
        I.modules.set(mod.name, mod);
        I.mainMod = mod.name;
      }
    } catch (e) {
      if (e instanceof SyntaxErr) { const name = (/-module\((\w+)\)/.exec(code) || [, 'module'])[1]; return { trace: [], out: '', error: { kind: 'compile', message: `${name}.erl:${e.line}:${e.col || 1}: ${e.message}`, line: e.line, where: 'code' }, results: [] }; }
      throw e;
    }
    // the shell reads one expression at a time: a syntax error spoils only its own expression
    const base = codeLines ? codeLines + 1 : 0;
    const exprs = splitShell(shellSrc).map(ch => {
      try {
        const toks = lex(ch.text, base + ch.line - 1);
        const first = toks[0].line;
        try { const f = new Parser(toks, I.records).shellForms(); return { body: f.length ? f[0].body : [], line: f.length ? f[0].line : first, first, src: ch.text.trim() }; }
        catch (e) { if (e instanceof SyntaxErr) return { syntax: `* ${e.line - first + 1}:${e.col || 1}: ${e.message}`, line: e.line, src: ch.text.trim() }; throw e; }
      } catch (e) { if (e instanceof SyntaxErr) return { syntax: `* 1:1: ${e.message}`, line: base + ch.line, src: ch.text.trim() }; throw e; }
    });
    const shellVars = new Map();
    const shell = I.spawn(function* (p) {
      for (let k = 0; k < exprs.length; k++) {
        const x = exprs[k];
        const unbound = x.syntax ? null : firstUnbound(x.body, new Set(shellVars.keys()));
        if (x.syntax || unbound) {
          I.results.push({ n: k + 1, src: x.src, value: x.syntax || `* ${unbound.line - x.first + 1}:${unbound.col}: variable '${unbound.n}' is unbound`, failed: true, outAt: I.out.length, line: x.line });
          yield { kind: 'result', line: x.line };
          continue;
        }
        // like Eshell: an expression that raises an exception binds nothing, prints the exception,
        // and the shell goes on with the next expression
        const trial = new Map(shellVars);
        const frame = { name: 'shell', vars: trial, cur: null };
        p.frames.push(frame);
        let value, failed = false;
        try { value = pretty(yield* I.body(x.body, trial, p, frame), { M: 60, depth: 30 }); for (const [n, v] of trial) shellVars.set(n, v); }
        catch (e) { if (!(e instanceof ErlError) || e.reason === atom('steplimit')) throw e; value = `** exception ${e.kind}: ${e.message || show(e.reason)}`; failed = true; }
        finally { p.frames.pop(); }
        // printing the value takes the shell a while: processes it woke up get to run first
        p.deferring = true; yield { kind: 'block' }; p.deferring = false;
        I.results.push({ n: k + 1, src: x.src, value, failed, outAt: I.out.length, line: x.line });
        yield { kind: 'result', line: x.line };
      }
      return OK;
    }, 'shell');
    I.mainPid = shell.id;
    // the scheduler: one step per process in turn; a waiting process is skipped until a message
    // arrives or its timeout passes; the clock moves 1 ms per step and jumps when all wait
    let rr = 0, deferred = 0, after = 0;
    try {
      for (;;) {
        const live = I.procs.filter(p => !p.done);
        if (!live.length) break;
        const ready = live.filter(p => (p.waiting ? p.mailbox.length > (p.waiting.skipped || 0) || I.clock >= p.waiting.until : p.sleepUntil <= I.clock));
        if (!ready.length) {
          const wake = Math.min(...live.map(p => (p.waiting ? p.waiting.until : p.sleepUntil)));
          if (!Number.isFinite(wake)) break; // everyone waits forever: the shell has nothing left
          I.clock = wake; continue;
        }
        // a shell about to print a result waits while other processes can run (up to a budget)
        let pick = ready.filter(q => !q.deferring);
        if (!pick.length || deferred > 400) { pick = ready; deferred = 0; } else if (pick.length < ready.length) deferred++;
        // once the shell has finished, the others run a little longer, then the trace ends
        if (shell.done && ++after > 400) break;
        const p = pick[rr++ % pick.length];
        const r = p.gen.next();
        I.clock += 1;
        if (r.done) { if (p === shell && shell.exit) throw shell.exit; continue; }
        const ev = r.value || {};
        if (ev.kind === 'block') continue;
        I.snap(ev.kind, ev.info !== undefined ? ev.info : ev.line, p);
      }
      if (shell.exit) throw shell.exit;
      I.snap('finished', null, null);
    } catch (e) {
      if (e instanceof ErlError) error = { kind: 'runtime', reason: e.kind + ':' + show(e.reason), message: e.message, line: I.trace.length ? I.trace[I.trace.length - 1].line : null };
      else if (e instanceof RangeError) error = { kind: 'runtime', reason: 'stack', message: 'the calls nest too deeply for this stepper', line: null };
      else { error = { kind: 'runtime', reason: 'internal', message: String(e && e.message || e), line: null }; if (typeof console !== 'undefined') console.warn('erl.js internal error', e); }
      I.trace.push({ kind: 'error', line: error.line, pid: shell.id, outLen: I.out.length, view: I.view() });
    }
    return { trace: I.trace, out: I.out, error, results: I.results, pids: I.procs.map(p => p.id) };
  };
  // split shell input on the full stops that end expressions (a '.' followed by whitespace or the end)
  function splitShell(src) {
    const parts = []; let start = 0, i = 0, q = null;
    const lineAt = k => src.slice(0, k).split('\n').length;
    while (i < src.length) {
      const c = src[i];
      if (q) { if (c === '\\') { i += 2; continue; } if (c === q) q = null; i++; continue; }
      if (c === '"' || c === "'") { q = c; i++; continue; }
      if (c === '$') { i += src[i + 1] === '\\' ? 3 : 2; continue; }
      if (c === '%') { while (i < src.length && src[i] !== '\n') i++; continue; }
      if (c === '.' && (i + 1 >= src.length || /\s/.test(src[i + 1]))) {
        const text = src.slice(start, i + 1); const lead = text.length - text.trimStart().length;
        if (text.trim() !== '.') parts.push({ text: text.slice(lead), line: lineAt(start + lead) });
        start = i + 1;
      }
      i++;
    }
    const rest = src.slice(start);
    if (rest.replace(/%.*$/gm, '').trim()) { const lead = rest.length - rest.trimStart().length; parts.push({ text: rest.slice(lead), line: lineAt(start + lead) }); }
    return parts;
  }

  /* ════════════════════════════════════════════════════════════════
     6. Mode 'shared': threads over shared variables, with locks
     ════════════════════════════════════════════════════════════════ */
  // cfg.shared: { x: 0 }; cfg.threads: { A: ["t = x", "t = t + 1", "x = t"], … }; cfg.schedule: "AABB…" or
  // "round-robin" (a schedule that runs out continues round-robin); instructions: "<v> = <expr>" (expr over numbers and variables with + - *), "lock m",
  // "unlock m", "print <expr>"
  ERL.runShared = function (cfg) {
    const shared = Object.assign({}, cfg.shared || {});
    const names = Object.keys(cfg.threads || {});
    const th = names.map(n => ({ name: n, code: cfg.threads[n].map(String), pc: 0, locals: {}, blocked: null, done: false }));
    const locks = {};
    const trace = [{ d: 'start', shared: { ...shared }, threads: th.map(t => ({ name: t.name, pc: t.pc, locals: { ...t.locals }, blocked: null, done: false })), locks: {} }];
    const sched = typeof cfg.schedule === 'string' && cfg.schedule !== 'round-robin' ? cfg.schedule.replace(/[^A-Za-z]/g, '').split('') : null;
    let rr = 0, guard = 0, out = '';
    const val = (e, t) => { const tokens = e.trim().split(/\s*([+\-*])\s*/); let acc = null, op = '+'; for (const tok of tokens) { if (['+', '-', '*'].includes(tok)) { op = tok; continue; } const v = /^-?\d+$/.test(tok) ? Number(tok) : tok in t.locals ? t.locals[tok] : tok in shared ? shared[tok] : NaN; acc = acc === null ? v : op === '+' ? acc + v : op === '-' ? acc - v : acc * v; } return acc; };
    const runnable = () => th.filter(t => !t.done && !(t.blocked && locks[t.blocked] !== undefined && locks[t.blocked] !== t.name));
    let deadlock = false;
    while (guard++ < 500) {
      if (th.every(t => t.done)) break;
      const ready = runnable();
      if (!ready.length) { deadlock = true; trace.push({ d: `deadlock: ${th.filter(t => !t.done).map(t => `${t.name} waits for ${t.blocked} (held by ${locks[t.blocked]})`).join(', ')} — no thread can ever continue`, shared: { ...shared }, threads: snapT(th), locks: { ...locks }, dead: true }); break; }
      let t;
      if (sched && rr < sched.length) { const n = sched[rr++]; t = th.find(x => x.name === n); if (!t || t.done) continue; if (!ready.includes(t)) { trace.push({ d: `${t.name} tries to run but waits for lock ${t.blocked}, held by ${locks[t.blocked]}`, active: t.name, shared: { ...shared }, threads: snapT(th), locks: { ...locks } }); continue; } }
      else t = ready[rr++ % ready.length]; // after the schedule: round-robin
      const ins = t.code[t.pc];
      let d;
      let m;
      if ((m = /^lock\s+(\w+)$/.exec(ins))) {
        if (locks[m[1]] === undefined) { locks[m[1]] = t.name; t.blocked = null; t.pc++; d = `${t.name}: lock ${m[1]} — acquired`; }
        else if (locks[m[1]] === t.name) { t.pc++; d = `${t.name}: lock ${m[1]} — already held`; }
        else { t.blocked = m[1]; d = `${t.name}: lock ${m[1]} — held by ${locks[m[1]]}, so ${t.name} waits`; }
      } else if ((m = /^unlock\s+(\w+)$/.exec(ins))) { delete locks[m[1]]; t.pc++; d = `${t.name}: unlock ${m[1]}`; }
      else if ((m = /^print\s+(.+)$/.exec(ins))) { const v = val(m[1], t); out += `${t.name}: ${v}\n`; t.pc++; d = `${t.name}: print ${m[1]} → ${v}`; }
      else if ((m = /^(\w+)\s*=\s*(.+)$/.exec(ins))) { const v = val(m[2], t); if (m[1] in shared) shared[m[1]] = v; else t.locals[m[1]] = v; t.pc++; d = `${t.name}: ${ins}   → ${m[1]} = ${v}${m[1] in shared ? ' (shared)' : ''}`; }
      else { t.pc++; d = `${t.name}: ${ins}`; }
      if (t.pc >= t.code.length) t.done = true;
      trace.push({ d, active: t.name, shared: { ...shared }, threads: snapT(th), locks: { ...locks } });
    }
    return { trace, names, code: Object.fromEntries(th.map(t => [t.name, t.code])), out, deadlock, final: shared };
    function snapT(ts) { return ts.map(t => ({ name: t.name, pc: t.pc, locals: { ...t.locals }, blocked: t.blocked, done: t.done })); }
  };

  /* ════════════════════════════════════════════════════════════════
     7. UI
     ════════════════════════════════════════════════════════════════ */
  const UIS = {};
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  function highlight(line) {
    const parts = []; const re = /(%.*$)|("(?:[^"\\]|\\.)*")|('(?:[^'\\]|\\.)*')/g;
    let last = 0, m;
    const plain = s => esc(s).replace(/\b(after|begin|case|catch|end|fun|if|of|receive|when|try|div|rem|andalso|orelse|not)\b/g, '<b>$1</b>').replace(/(^|[^A-Za-z_])([A-Z_][A-Za-z0-9_]*)/g, '$1<span class="erl-var">$2</span>').replace(/(^|\W)(-\w+)(?=\()/g, '$1<span class="c-pp">$2</span>').replace(/\b(\d+(?:\.\d+)?)\b/g, '<i>$1</i>');
    while ((m = re.exec(line))) { parts.push(plain(line.slice(last, m.index))); parts.push(`<span class="${m[1] ? 'jv-cm' : 'jv-str'}">${esc(m[0])}</span>`); last = re.lastIndex; }
    parts.push(plain(line.slice(last)));
    return parts.join('');
  }
  class Stepper {
    constructor(id, cfg) { this.id = id; this.cfg = cfg; this.el = document.getElementById('sim-' + id); this.reset(false); }
    reset(render = true) { this.code = (this.cfg.code || '').replace(/\s+$/, ''); this.shell = (this.cfg.shell || '').replace(/\s+$/, ''); this.result = null; this.i = 0; this.editing = true; if (render) this.render(); }
    run() { this.result = ERL.run({ code: this.code, shell: this.shell, maxSteps: this.cfg.maxSteps || 3000 }); this.i = Math.max(0, this.result.trace.length - 1); this.editing = false; this.render(); }
    goto(k) { if (!this.result) return; this.i = Math.max(0, Math.min(this.result.trace.length - 1, k)); this.render(); }
    listing(text, base, cur, errLine) {
      const lines = text.split('\n');
      return `<pre class="jv-listing">${lines.map((l, k) => `<span class="jv-ln${cur === base + k + 1 ? ' cur' : ''}${errLine === base + k + 1 ? ' err' : ''}"><span class="jv-no">${k + 1}</span>${highlight(l) || ' '}</span>`).join('')}</pre>`;
    }
    render() {
      const el = this.el; if (!el) return;
      const tr = this.result ? this.result.trace : [];
      const cur = tr[this.i] || null;
      const last = !tr.length || this.i === tr.length - 1;
      const err = this.result && this.result.error;
      const codeLines = this.code ? this.code.split('\n').length : 0;
      const curLine = cur ? cur.line : null;
      const errLine = err && last ? err.line : null;
      const codeHtml = this.editing
        ? `${this.code ? `<div class="erl-label">module</div><textarea class="jv-editor" data-f="code" spellcheck="false" rows="${Math.max(3, this.code.split('\n').length + 1)}">${esc(this.code)}</textarea>` : ''}<div class="erl-label">shell</div><textarea class="jv-editor" data-f="shell" spellcheck="false" rows="${Math.max(2, this.shell.split('\n').length + 1)}">${esc(this.shell)}</textarea>`
        : `${this.code ? `<div class="erl-label">module</div>${this.listing(this.code, 0, curLine, errLine)}` : ''}<div class="erl-label">shell</div>${this.listing(this.shell, codeLines ? codeLines + 1 : 0, curLine, errLine)}`;
      let procHtml = '<div class="jv-empty">press ▶ Run, then step through the processes</div>';
      if (cur && cur.view) {
        const v = cur.view;
        const lanes = v.procs.map(p => `<div class="erl-proc${p.id === cur.pid ? ' on' : ''}${p.status.startsWith('finished') || p.status.startsWith('exited') ? ' done' : ''}">
          <div class="erl-proc-head"><b>&lt;0.${p.id}.0&gt;</b> ${esc(p.name)}${p.name === 'shell' ? '' : ''} <span class="erl-status">${esc(p.status)}</span></div>
          <div class="erl-mailbox"><span class="erl-mb-label">mailbox</span>${p.mailbox.length ? p.mailbox.map((m, k) => `<span class="erl-msg${k < p.skipped ? ' skipped' : ''}${k === p.hit ? ' hit' : ''}" title="${k < p.skipped ? 'no receive clause matches this message: it stays in the mailbox' : ''}">${esc(m)}</span>`).join('') : '<span class="jv-empty">empty</span>'}</div>
          ${p.frames.length ? p.frames.slice().reverse().map(f => `<div class="erl-frame"><span class="erl-fname">${esc(f.name)}</span>${f.vars.length ? ' ' + f.vars.map(([n, x]) => `<span class="erl-var">${esc(n)}</span> = ${esc(x)}`).join(', ') : ''}</div>`).join('') : ''}
        </div>`).join('');
        const msgs = v.msgs.length ? `<div class="erl-msgs">${v.msgs.slice().reverse().map(m => `<div${m.at === this.i || m.at === this.result.trace[this.i].stepNo ? ' class="new"' : ''}>&lt;0.${m.from}.0&gt; → &lt;0.${m.to}.0&gt; ! ${esc(m.msg)}</div>`).join('')}</div>` : '';
        procHtml = `<div class="erl-lanes">${lanes}</div>${msgs}<div class="erl-clock">clock ${v.clock} ms</div>`;
      }
      const outText = cur ? this.result.out.slice(0, cur.outLen) : '';
      const results = cur && cur.view ? cur.view.results : [];
      const resHtml = results.length ? results.map(r => `<div class="clj-res"><span class="clj-prompt">${r.n}&gt;</span> ${esc(r.src || '')}<br><span class="${r.failed ? 'erl-fail' : 'erl-val'}">${esc(r.value)}</span></div>`).join('') : '';
      let errHtml = '';
      if (err && last) errHtml = err.kind === 'compile' ? `<div class="jv-err"><b>the module does not compile:</b> ${esc(err.message)}</div>` : `<div class="jv-err"><b>stopped:</b> ${esc(err.message)}</div>`;
      const status = !this.result || this.editing ? '' : err && err.kind === 'compile' ? 'did not compile' : cur && cur.kind === 'finished' ? 'finished' : cur && cur.kind === 'error' ? 'stopped by an exception' : `step ${this.i} of ${tr.length - 1}${cur && cur.pid ? ' — process <0.' + cur.pid + '.0>' : ''}`;
      el.innerHTML = `<div class="jv-wrap c-wrap erl-wrap">
        <div class="jv-toolbar">
          <button class="btn fa-btn jv-run" data-act="run">▶ Run</button>
          ${this.editing ? '' : '<button class="btn fa-btn fa-secondary" data-act="edit">✎ Edit</button>'}
          <button class="btn fa-btn fa-secondary" data-act="reset">⟲ Reset</button>
          ${this.editing || !tr.length ? '' : `<span class="jv-sep"></span>
          <button class="btn fa-btn fa-secondary" data-act="first" ${this.i === 0 ? 'disabled' : ''}>|◀</button>
          <button class="btn fa-btn fa-secondary" data-act="back" ${this.i === 0 ? 'disabled' : ''}>◀ Back</button>
          <button class="btn fa-btn jv-step" data-act="step" ${last ? 'disabled' : ''}>Step ▶</button>
          <button class="btn fa-btn fa-secondary" data-act="last" ${last ? 'disabled' : ''}>▶|</button>`}
          <span class="jv-status">${esc(status)}</span>
        </div>
        <div class="c-main">
          <div class="jv-code">${codeHtml}</div>
          <div class="jv-panel"><div class="jv-panel-title">Processes</div><div class="erl-procs">${procHtml}</div></div>
          <div class="c-io">
            <div class="jv-panel"><div class="jv-panel-title">Output</div><pre class="jv-console">${esc(outText)}</pre>${errHtml}</div>
            ${resHtml ? `<div class="jv-panel"><div class="jv-panel-title">Shell</div><div class="clj-repl">${resHtml}</div></div>` : ''}
          </div>
        </div>
      </div>`;
      this.bind();
    }
    bind() {
      const el = this.el;
      el.querySelectorAll('[data-act]').forEach(b => b.addEventListener('click', () => {
        const a = b.dataset.act;
        if (a === 'run') this.run(); else if (a === 'edit') { this.editing = true; this.render(); } else if (a === 'reset') this.reset();
        else if (a === 'first') this.goto(0); else if (a === 'back') this.goto(this.i - 1); else if (a === 'step') this.goto(this.i + 1); else this.goto(Infinity);
      }));
      el.querySelectorAll('textarea[data-f]').forEach(ta => ta.addEventListener('input', () => { this[ta.dataset.f] = ta.value; ta.rows = Math.max(2, ta.value.split('\n').length + 1); }));
      el.querySelectorAll('.jv-listing').forEach(l => l.addEventListener('dblclick', () => { this.editing = true; this.render(); }));
    }
  }
  class SharedViewer {
    constructor(id, cfg) { this.id = id; this.cfg = cfg; this.el = document.getElementById('sim-' + id); this.result = ERL.runShared(cfg); this.i = 0; }
    goto(k) { this.i = Math.max(0, Math.min(this.result.trace.length - 1, k)); this.render(); }
    render() {
      const el = this.el; if (!el) return;
      const r = this.result, st = r.trace[this.i], last = this.i === r.trace.length - 1;
      const cols = r.names.map(n => {
        const t = st.threads.find(x => x.name === n);
        const code = r.code[n].map((ins, k) => `<div class="erl-ins${k === t.pc && !t.done ? ' next' : ''}${k < t.pc ? ' ran' : ''}">${esc(ins)}</div>`).join('');
        const locals = Object.entries(t.locals).map(([k, v]) => `${esc(k)} = ${v}`).join(', ');
        return `<div class="erl-thread${st.active === n ? ' on' : ''}${t.blocked ? ' blocked' : ''}"><div class="erl-proc-head"><b>thread ${esc(n)}</b> <span class="erl-status">${t.done ? 'done' : t.blocked ? 'waiting for ' + esc(t.blocked) : ''}</span></div>${code}<div class="erl-locals">${locals || '&nbsp;'}</div></div>`;
      }).join('');
      const shared = Object.entries(st.shared).map(([k, v]) => `<span><b>${esc(k)}</b> = ${v}</span>`).join('');
      const locks = Object.entries(st.locks).map(([k, v]) => `<span>🔒 ${esc(k)}: ${esc(v)}</span>`).join('') || '<span class="jv-empty">no locks held</span>';
      el.innerHTML = `<div class="jv-wrap c-wrap erl-wrap">
        <div class="jv-toolbar">
          <button class="btn fa-btn fa-secondary" data-act="first" ${this.i === 0 ? 'disabled' : ''}>|◀</button>
          <button class="btn fa-btn fa-secondary" data-act="back" ${this.i === 0 ? 'disabled' : ''}>◀ Back</button>
          <button class="btn fa-btn jv-step" data-act="step" ${last ? 'disabled' : ''}>Step ▶</button>
          <button class="btn fa-btn fa-secondary" data-act="last" ${last ? 'disabled' : ''}>▶|</button>
          <span class="jv-status">step ${this.i} of ${r.trace.length - 1}</span>
        </div>
        <div class="ds-desc${st.dead ? ' err' : ''}">${esc(st.d)}</div>
        <div class="erl-shared">${shared}<span class="erl-sep"></span>${locks}</div>
        <div class="erl-threads">${cols}</div>
      </div>`;
      el.querySelectorAll('[data-act]').forEach(b => b.addEventListener('click', () => { const a = b.dataset.act; if (a === 'first') this.goto(0); else if (a === 'back') this.goto(this.i - 1); else if (a === 'step') this.goto(this.i + 1); else this.goto(Infinity); }));
    }
  }
  ERL.mount = function (id, cfg) { const ui = cfg && cfg.mode === 'shared' ? new SharedViewer(id, cfg) : new Stepper(id, cfg || {}); UIS[id] = ui; ui.render(); return ui; };
  ERL.ui = id => UIS[id];
  ERL.show = show;

  if (typeof window !== 'undefined') window.ERL = ERL;
  if (typeof module !== 'undefined' && module.exports) module.exports = ERL;
})();
