/* ── Database engine (COMP 353) ──────────────────────────────────────────────────
   DB.mount(id, cfg) builds a stepper inside #sim-<id>; cfg = { mode, tables?, … } (see MODES).
   Models are DOM-free: `init(cfg)` returns a JSON state and each operation is an (async) generator
   over (state, args) that mutates the state and yields a step { d: description, html?: …, err? }.
   The shell records every step, replays them with ◀ Back / Step ▶, and renders a snapshot as HTML
   (tables) or SVG (E/R diagrams). Modes: sql (real SQL through sql.js, loaded lazily), ra
   (relational algebra evaluated one node at a time), fd-closure, fd-keys, fd-cover, decomposition
   (chase test + dependency preservation), normal-form (2NF/3NF/BCNF check, BCNF decomposition, 3NF
   synthesis), datalog (naive bottom-up evaluation with recursion), er (diagram + conversion to relations).
   DB.model(cfg) drives a mode without a DOM (used by app/scripts/test-db.mjs). */
const DB = {};
const clone = s => JSON.parse(JSON.stringify(s));
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const isNum = v => typeof v === 'number';
const fmtVal = v => v === null || v === undefined ? '<i class="db-null">NULL</i>' : esc(isNum(v) && !Number.isInteger(v) ? String(Math.round(v * 1000) / 1000) : String(v));

/* ═══════════════════════ tables ═══════════════════════ */
// cfg.tables: { name: { columns: [..], rows: [[..], ..] } } or { name: "col1 col2\nv v\n..." } (whitespace-separated, 'quoted strings')
function parseTables(cfg) {
  const out = {};
  const src = cfg.tables || {};
  for (const [name, spec] of Object.entries(src)) {
    if (typeof spec === 'string') {
      const lines = spec.split('\n').map(l => l.trim()).filter(Boolean);
      if (!lines.length) { out[name] = { columns: [], rows: [] }; continue; }
      const columns = lines[0].split(/[\s,]+/);
      const rows = lines.slice(1).map(l => tokens(l).map(coerce));
      out[name] = { columns, rows };
    } else out[name] = { columns: (spec.columns || []).map(String), rows: (spec.rows || []).map(r => r.map(v => typeof v === 'string' ? coerce(v) : v)) };
  }
  return out;
}
function tokens(line) { const re = /'((?:[^']|'')*)'|"([^"]*)"|(\S+)/g; const out = []; let m; while ((m = re.exec(line))) out.push(m[1] !== undefined ? "'" + m[1].replace(/''/g, "'") + "'" : m[2] !== undefined ? "'" + m[2] + "'" : m[3]); return out; }
function coerce(tok) {
  if (tok === null || tok === undefined) return null;
  if (typeof tok !== 'string') return tok;
  if (/^'.*'$/.test(tok)) return tok.slice(1, -1);
  if (/^(null|NULL|-)$/.test(tok)) return null;
  if (/^-?\d+(\.\d+)?$/.test(tok)) return Number(tok);
  return tok;
}
const rowKey = r => JSON.stringify(r);
function dedupe(rows) { const seen = new Set(); return rows.filter(r => { const k = rowKey(r); if (seen.has(k)) return false; seen.add(k); return true; }); }
// an HTML table; hl: { rows: Set of row indexes, cols: Set of column indexes, tone }
function tableHtml(name, t, opts) {
  const o = opts || {};
  const cols = t.columns, rows = t.rows;
  let h = `<div class="db-table${o.cls ? ' ' + o.cls : ''}">`;
  if (name) h += `<div class="db-table-name">${esc(name)}${o.suffix ? ` <span class="db-muted">${esc(o.suffix)}</span>` : ''}</div>`;
  h += '<table><thead><tr>' + cols.map((c, j) => `<th class="${o.hlCols && o.hlCols.has(j) ? 'hl' : ''}">${esc(c)}</th>`).join('') + '</tr></thead><tbody>';
  const max = o.max || 40;
  rows.slice(0, max).forEach((r, i) => { h += `<tr class="${o.hlRows && o.hlRows.has(i) ? (o.tone || 'hl') : ''}">` + r.map((v, j) => `<td class="${o.hlCols && o.hlCols.has(j) ? 'hl' : ''}">${fmtVal(v)}</td>`).join('') + '</tr>'; });
  if (!rows.length) h += `<tr><td colspan="${Math.max(1, cols.length)}" class="db-empty">(no tuples)</td></tr>`;
  if (rows.length > max) h += `<tr><td colspan="${cols.length}" class="db-empty">… ${rows.length - max} more</td></tr>`;
  return h + '</tbody></table></div>';
}
const tablesHtml = (tables, opts) => `<div class="db-tables">${Object.entries(tables).map(([n, t]) => tableHtml(n, t, Object.assign({ max: 12 }, opts))).join('')}</div>`;

/* ═══════════════════════ SQL through sql.js ═══════════════════════ */
let sqlPromise = null;
DB.useSql = fn => { sqlPromise = Promise.resolve(fn()); }; // tests inject require('sql.js')()
async function loadSql() {
  if (!sqlPromise) {
    sqlPromise = (async () => {
      const mod = await import('sql.js');
      const initSqlJs = mod.default || mod;
      const wasm = await import('sql.js/dist/sql-wasm.wasm?url');
      return initSqlJs({ locateFile: () => wasm.default });
    })();
  }
  return sqlPromise;
}
function sqlType(values) { return values.every(v => v === null || isNum(v)) ? (values.every(v => v === null || Number.isInteger(v)) ? 'INTEGER' : 'REAL') : 'TEXT'; }
function seedSql(db, tables, schema) {
  if (schema) db.run(schema);
  for (const [name, t] of Object.entries(tables)) {
    const types = t.columns.map((c, j) => sqlType(t.rows.map(r => r[j])));
    db.run(`CREATE TABLE IF NOT EXISTS ${name} (${t.columns.map((c, j) => `${c} ${types[j]}`).join(', ')})`);
    for (const r of t.rows) db.run(`INSERT INTO ${name} VALUES (${r.map(() => '?').join(', ')})`, r);
  }
}
function dumpSql(db) {
  const out = {};
  const names = db.exec("SELECT name FROM sqlite_master WHERE type IN ('table','view') AND name NOT LIKE 'sqlite_%' ORDER BY type DESC, rowid");
  if (!names.length) return out;
  for (const [name] of names[0].values) {
    const res = db.exec(`SELECT * FROM ${name}`);
    if (res.length) out[name] = { columns: res[0].columns, rows: res[0].values };
    else { const cols = db.exec(`PRAGMA table_info(${name})`); out[name] = { columns: cols.length ? cols[0].values.map(r => r[1]) : [], rows: [] }; }
  }
  return out;
}
function splitStatements(sql) { // on ';' outside quotes; a CREATE TRIGGER … BEGIN … END; block stays one statement
  const out = []; let cur = '', q = null, depth = 0, word = '';
  const flushWord = () => { const w = word.toUpperCase(); if (w === 'BEGIN' || w === 'CASE') depth++; else if (w === 'END') depth = Math.max(0, depth - 1); word = ''; };
  for (let i = 0; i < sql.length; i++) {
    const c = sql[i];
    if (q) { cur += c; if (c === q) q = null; continue; }
    if (c === "'" || c === '"') { flushWord(); q = c; cur += c; continue; }
    if (/[A-Za-z_]/.test(c)) { word += c; cur += c; continue; }
    flushWord();
    if (c === ';' && depth === 0) { if (cur.trim()) out.push(cur.trim()); cur = ''; continue; }
    cur += c;
  }
  flushWord();
  if (cur.trim()) out.push(cur.trim());
  return out;
}
const MODES = {};
MODES.sql = {
  title: 'SQL',
  async: true,
  init(cfg) {
    const tables = parseTables(cfg);
    return { tables, schema: cfg.schema || '', query: (cfg.query || '').trim(), results: [], current: tables, log: [] };
  },
  controls: [{ kind: 'sqltext', name: 'q', label: 'SQL' }, { kind: 'button', label: '▶ Run SQL', op: 'run', args: ['q'], primary: true }],
  async *run(s, args) {
    const text = String(args[0] !== undefined && args[0] !== '' ? args[0] : s.query);
    const SQL = await loadSql();
    // rebuild the database from the initial tables and the statements run so far, so Back/Step stay consistent
    const db = new SQL.Database();
    try { seedSql(db, s.tables, s.schema); for (const prev of s.log) db.run(prev); } catch (e) { yield { d: 'could not rebuild the database: ' + e.message, err: true }; db.close(); return; }
    const stmts = splitStatements(text);
    if (!stmts.length) { yield { d: 'nothing to run', err: true }; db.close(); return; }
    for (const stmt of stmts) {
      const isQuery = /^\s*(SELECT|WITH|VALUES|EXPLAIN)\b/i.test(stmt); // PRAGMAs are logged and replayed like DDL
      try {
        if (isQuery) {
          const res = db.exec(stmt);
          const r = res.length ? { columns: res[0].columns, rows: res[0].values } : { columns: [], rows: [] };
          s.results = [{ stmt, table: r }];
          yield { d: `${r.rows.length} row${r.rows.length === 1 ? '' : 's'}${r.rows.length ? '' : ' (empty result)'}`, html: tableHtml('result', r, { max: 60 }) };
        } else {
          db.run(stmt);
          const changed = db.getRowsModified();
          s.log.push(stmt);
          s.current = dumpSql(db);
          const kind = (stmt.match(/^\s*(\w+)/) || ['', ''])[1].toUpperCase();
          s.results = [];
          yield { d: `${kind}: ${/^(INSERT|UPDATE|DELETE)$/.test(kind) ? changed + ' row' + (changed === 1 ? '' : 's') + ' affected' : 'done'}`, html: tablesHtml(s.current) };
        }
      } catch (e) {
        yield { d: 'SQL error: ' + e.message, err: true };
        db.close(); return;
      }
    }
    db.close();
  },
  render(s, step) {
    const body = step.html || tablesHtml(s.current);
    return { html: body, tablesHtml: step.html ? tablesHtml(s.current, { cls: 'db-dim' }) : '' };
  },
};

/* ═══════════════════════ relational algebra ═══════════════════════ */
// Expression syntax (ASCII or Greek): project(a, b; E)  select(cond; E)  rename(S(a,b); E) or rename(S; E)
// join(cond; E1, E2)  njoin(E1, E2)  product(E1, E2)  union/intersect/minus/divide(E1, E2)   — E is a table name or an expression.
// Greek aliases: π σ ρ ⋈ × ∪ ∩ − ÷ ; conditions: comparisons with = <> != < <= > >=, and/or/not, attributes may be qualified R.A.
const RA_ALIASES = { 'π': 'project', 'σ': 'select', 'ρ': 'rename', '⋈': 'join', '×': 'product', 'x': 'product', '∪': 'union', '∩': 'intersect', '−': 'minus', '-': 'minus', '÷': 'divide', 'pi': 'project', 'sigma': 'select', 'rho': 'rename', 'natural': 'njoin', 'times': 'product', 'diff': 'minus', 'difference': 'minus', 'div': 'divide' };
function raLex(src) {
  const out = []; let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (/\s/.test(c)) { i++; continue; }
    if (c === "'" || c === '"') { let j = i + 1; while (j < src.length && src[j] !== c) j++; out.push({ t: 'str', v: src.slice(i + 1, j) }); i = j + 1; continue; }
    const prev = out[out.length - 1];
    const negOk = !prev || (prev.t === 'op' && prev.v !== ')'); // "-3" after "(", ",", ";" or a comparison operator is a number, not the minus operator
    if (/[0-9]/.test(c) || (c === '-' && /[0-9]/.test(src[i + 1] || '') && negOk)) { let j = i + 1; while (j < src.length && /[0-9.]/.test(src[j])) j++; out.push({ t: 'num', v: Number(src.slice(i, j)) }); i = j; continue; }
    const two = src.slice(i, i + 2);
    if (['<=', '>=', '<>', '!='].includes(two)) { out.push({ t: 'op', v: two }); i += 2; continue; }
    if ('(),;=<>'.includes(c)) { out.push({ t: 'op', v: c }); i++; continue; }
    if ('πσρ⋈×∪∩−÷'.includes(c)) { out.push({ t: 'id', v: RA_ALIASES[c] }); i++; continue; }
    if (c === '-' ) { out.push({ t: 'id', v: 'minus' }); i++; continue; }
    if (/[A-Za-z_]/.test(c)) { let j = i; while (j < src.length && /[A-Za-z0-9_.#]/.test(src[j])) j++; const w = src.slice(i, j); const lw = w.toLowerCase(); out.push({ t: 'id', v: RA_ALIASES[lw] && ['pi', 'sigma', 'rho', 'natural', 'times', 'diff', 'difference', 'div', 'x'].includes(lw) ? RA_ALIASES[lw] : w }); i = j; continue; }
    throw new Error(`unexpected character '${c}' in the expression`);
  }
  out.push({ t: 'eof', v: '' });
  return out;
}
const RA_OPS = { project: [1, 'list'], select: [1, 'cond'], rename: [1, 'rename'], join: [2, 'cond'], njoin: [2, null], product: [2, null], union: [2, null], intersect: [2, null], minus: [2, null], divide: [2, null] };
function raParse(src) {
  const toks = raLex(src); let p = 0;
  const peek = () => toks[p], next = () => toks[p++];
  const expect = v => { const t = next(); if (t.v !== v) throw new Error(`expected '${v}' but found '${t.v || 'end'}'`); return t; };
  const INFIX = { union: 'union', intersect: 'intersect', minus: 'minus', product: 'product', njoin: 'njoin', join: 'njoin', divide: 'divide' };
  function expr() { // infix set operators between primaries: R ∪ S, R × S, R ⋈ S (natural), R − S, R ÷ S; left-associative, use ( ) to group
    let l = primary();
    while (peek().t === 'id' && INFIX[peek().v.toLowerCase()] && l !== null) {
      // "R union(S, T)" would be the function form; infix needs something other than "name(" — a name, a Greek/function operator or "("
      const nxt = toks[p + 1];
      if (nxt && nxt.v === '(' && !isInfixOperand(p + 2)) break;
      const op = next().v.toLowerCase(); const r = primary(); l = { k: INFIX[op], args: [l, r] };
    }
    return l;
  }
  function primary() {
    if (peek().v === '(') { next(); const e = expr(); expect(')'); return e; }
    const t = next();
    if (t.t !== 'id') throw new Error(`expected a relation name or an operator, found '${t.v || 'end'}'`);
    const name = t.v.toLowerCase();
    if (!RA_OPS[name] || peek().v !== '(') return { k: 'rel', name: t.v };
    const [arity, param] = RA_OPS[name];
    expect('(');
    const node = { k: name };
    if (param === 'list') { node.attrs = []; do { node.attrs.push(next().v); } while (peek().v === ',' && next()); expect(';'); }
    else if (param === 'cond') { node.cond = cond(); expect(';'); }
    else if (param === 'rename') { node.newName = next().v; if (peek().v === '(') { next(); node.attrs = []; do { node.attrs.push(next().v); } while (peek().v === ',' && next()); expect(')'); } expect(';'); }
    node.args = [expr()];
    if (arity === 2) { expect(','); node.args.push(expr()); }
    expect(')');
    return node;
  }
  function isInfixOperand(k) { // after "op (": the function form has "E1, E2)" → find a top-level comma before the matching ')'
    let d = 0; for (let i = k; i < toks.length; i++) { const v = toks[i].v; if (v === '(') d++; else if (v === ')') { if (d === 0) return true; d--; } else if (v === ',' && d === 0) return false; else if (toks[i].t === 'eof') return true; } return true;
  }
  function cond() { let l = andCond(); while (peek().t === 'id' && peek().v.toLowerCase() === 'or') { next(); l = { k: 'or', l, r: andCond() }; } return l; }
  function andCond() { let l = notCond(); while (peek().t === 'id' && peek().v.toLowerCase() === 'and') { next(); l = { k: 'and', l, r: notCond() }; } return l; }
  function notCond() { if (peek().t === 'id' && peek().v.toLowerCase() === 'not') { next(); return { k: 'not', e: notCond() }; } if (peek().v === '(') { next(); const c = cond(); expect(')'); return c; } return cmp(); }
  function cmp() { const l = operand(); const op = next(); if (op.t !== 'op' || !['=', '<>', '!=', '<', '<=', '>', '>='].includes(op.v)) throw new Error(`expected a comparison operator, found '${op.v}'`); return { k: 'cmp', op: op.v === '!=' ? '<>' : op.v, l, r: operand() }; }
  function operand() { const t = next(); if (t.t === 'num') return { k: 'lit', v: t.v }; if (t.t === 'str') return { k: 'lit', v: t.v }; if (t.t === 'id') return { k: 'attr', name: t.v }; throw new Error(`unexpected '${t.v}' in a condition`); }
  const e = expr();
  if (peek().t !== 'eof') throw new Error(`unexpected '${peek().v}' after the expression`);
  return e;
}
function raShow(n) {
  const G = { project: 'π', select: 'σ', rename: 'ρ', join: '⋈', njoin: '⋈', product: '×', union: '∪', intersect: '∩', minus: '−', divide: '÷' };
  const condShow = c => c.k === 'cmp' ? `${opShow(c.l)} ${c.op} ${opShow(c.r)}` : c.k === 'and' ? `${condShow(c.l)} ∧ ${condShow(c.r)}` : c.k === 'or' ? `(${condShow(c.l)} ∨ ${condShow(c.r)})` : `¬(${condShow(c.e)})`;
  const opShow = o => o.k === 'lit' ? (isNum(o.v) ? String(o.v) : `'${o.v}'`) : o.name;
  if (n.k === 'rel') return n.name;
  if (n.k === 'project') return `π_${n.attrs.join(',')}(${raShow(n.args[0])})`;
  if (n.k === 'select') return `σ_${condShow(n.cond)}(${raShow(n.args[0])})`;
  if (n.k === 'rename') return `ρ_${n.newName}${n.attrs ? '(' + n.attrs.join(',') + ')' : ''}(${raShow(n.args[0])})`;
  if (n.k === 'join') return `(${raShow(n.args[0])} ⋈_${condShow(n.cond)} ${raShow(n.args[1])})`;
  return `(${raShow(n.args[0])} ${G[n.k]} ${raShow(n.args[1])})`;
}
// attribute lookup: columns are stored as "R.A" when a product/join created ambiguity, plain otherwise
function colIndex(t, name, what) {
  const idx = t.columns.indexOf(name);
  if (idx >= 0) return idx;
  const bare = name.includes('.') ? name.split('.').pop() : name;
  const cands = t.columns.map((c, i) => [c, i]).filter(([c]) => c === bare || c.endsWith('.' + bare));
  if (cands.length === 1) return cands[0][1];
  if (cands.length > 1) throw new Error(`attribute ${name} is ambiguous in ${what || 'the relation'} (${cands.map(c => c[0]).join(', ')}) — qualify it as R.A`);
  throw new Error(`attribute ${name} is not in ${what || 'the relation'} (${t.columns.join(', ')})`);
}
function evalCond(c, t, row, what) {
  const val = o => o.k === 'lit' ? o.v : row[colIndex(t, o.name, what)];
  switch (c.k) {
    case 'and': return evalCond(c.l, t, row, what) && evalCond(c.r, t, row, what);
    case 'or': return evalCond(c.l, t, row, what) || evalCond(c.r, t, row, what);
    case 'not': return !evalCond(c.e, t, row, what);
    case 'cmp': { const a = val(c.l), b = val(c.r); if (a === null || b === null) return false; switch (c.op) { case '=': return a === b; case '<>': return a !== b; case '<': return a < b; case '<=': return a <= b; case '>': return a > b; case '>=': return a >= b; } }
  }
  return false;
}
const bareName = c => c.includes('.') ? c.split('.').pop() : c;
function qualify(t, name) { return { columns: t.columns.map(c => c.includes('.') ? c : `${name}.${c}`), rows: t.rows }; }
function sameSchema(a, b) { return a.columns.length === b.columns.length; }
MODES.ra = {
  title: 'Relational algebra',
  init(cfg) { return { tables: parseTables(cfg), expr: (cfg.expr || '').trim(), bag: !!cfg.bag, results: [], final: null }; },
  controls: [{ kind: 'sqltext', name: 'e', label: 'expression', rows: 2 }, { kind: 'button', label: '▶ Evaluate', op: 'evaluate', args: ['e'], primary: true }],
  *evaluate(s, args) {
    const text = String(args[0] !== undefined && args[0] !== '' ? args[0] : s.expr);
    let tree;
    s.results = []; s.final = null;
    try { tree = raParse(text); } catch (e) { yield { d: 'cannot parse: ' + e.message, err: true }; return; }
    const self = MODES.ra;
    try {
      const out = yield* self.evalNode(s, tree);
      s.final = out;
      yield { d: `result of ${raShow(tree)}: ${out.rows.length} tuple${out.rows.length === 1 ? '' : 's'}${s.bag ? ' (bag semantics: duplicates kept)' : ' (set semantics: duplicates removed)'}`, html: tableHtml('result', out, { max: 60 }) };
    } catch (e) { yield { d: e.message, err: true }; }
  },
  *evalNode(s, n) {
    const bag = s.bag;
    const fin = rows => bag ? rows : dedupe(rows);
    if (n.k === 'rel') {
      const t = s.tables[n.name];
      if (!t) throw new Error(`no relation named ${n.name} (have ${Object.keys(s.tables).join(', ')})`);
      return { columns: t.columns.slice(), rows: t.rows.map(r => r.slice()) };
    }
    const kids = []; for (const a of n.args) kids.push(yield* MODES.ra.evalNode(s, a));
    let out, note = '';
    const a = kids[0], b = kids[1];
    switch (n.k) {
      case 'project': { const idx = n.attrs.map(x => colIndex(a, x, raShow(n.args[0]))); out = { columns: idx.map(i => bareName(a.columns[i])), rows: fin(a.rows.map(r => idx.map(i => r[i]))) }; note = bag ? '' : ` — ${a.rows.length - out.rows.length} duplicate${a.rows.length - out.rows.length === 1 ? '' : 's'} removed`; break; }
      case 'select': out = { columns: a.columns, rows: a.rows.filter(r => evalCond(n.cond, a, r, raShow(n.args[0]))) }; note = ` — ${out.rows.length} of ${a.rows.length} tuples satisfy the condition`; break;
      case 'rename': out = { columns: n.attrs ? (n.attrs.length === a.columns.length ? n.attrs.slice() : (() => { throw new Error(`rename lists ${n.attrs.length} attributes for a relation with ${a.columns.length}`); })()) : a.columns.map(c => `${n.newName}.${bareName(c)}`), rows: a.rows }; break;
      case 'product': { const A = qualify(a, relName(n.args[0])), B = qualify(b, relName(n.args[1])); out = { columns: A.columns.concat(B.columns), rows: [] }; for (const r of A.rows) for (const q of B.rows) out.rows.push(r.concat(q)); note = ` — ${a.rows.length} × ${b.rows.length} = ${out.rows.length} tuples`; break; }
      case 'join': { const A = qualify(a, relName(n.args[0])), B = qualify(b, relName(n.args[1])); const prod = { columns: A.columns.concat(B.columns), rows: [] }; for (const r of A.rows) for (const q of B.rows) prod.rows.push(r.concat(q)); out = { columns: prod.columns, rows: prod.rows.filter(r => evalCond(n.cond, prod, r, 'the product')) }; note = ` — ${out.rows.length} of ${prod.rows.length} pairs satisfy the condition`; break; }
      case 'njoin': {
        const common = a.columns.map(bareName).filter(c => b.columns.map(bareName).includes(c));
        const ai = common.map(c => a.columns.map(bareName).indexOf(c)), bi = common.map(c => b.columns.map(bareName).indexOf(c));
        const bRest = b.columns.map((c, j) => j).filter(j => !bi.includes(j));
        out = { columns: a.columns.map(bareName).concat(bRest.map(j => bareName(b.columns[j]))), rows: [] };
        for (const r of a.rows) for (const q of b.rows) if (ai.every((i, k) => r[i] === q[bi[k]])) out.rows.push(r.concat(bRest.map(j => q[j])));
        note = common.length ? ` — on the common attribute${common.length === 1 ? '' : 's'} ${common.join(', ')}` : ' — no common attributes: this is the Cartesian product'; break;
      }
      case 'union': case 'intersect': case 'minus': {
        if (!sameSchema(a, b)) throw new Error(`${n.k}: the two relations must have the same number of attributes (${a.columns.length} vs ${b.columns.length})`);
        const keysB = b.rows.map(rowKey);
        if (n.k === 'union') out = { columns: a.columns, rows: fin(a.rows.concat(b.rows)) };
        else if (n.k === 'intersect') { const cnt = {}; for (const k of keysB) cnt[k] = (cnt[k] || 0) + 1; out = { columns: a.columns, rows: a.rows.filter(r => { const k = rowKey(r); if (cnt[k] > 0) { if (bag) cnt[k]--; return true; } return false; }) }; if (!bag) out.rows = dedupe(out.rows); }
        else { const cnt = {}; for (const k of keysB) cnt[k] = (cnt[k] || 0) + 1; out = { columns: a.columns, rows: a.rows.filter(r => { const k = rowKey(r); if (cnt[k] > 0) { if (bag) cnt[k]--; return false; } return true; }) }; if (!bag) out.rows = dedupe(out.rows); }
        break;
      }
      case 'divide': {
        const bCols = b.columns.map(bareName), aCols = a.columns.map(bareName);
        if (!bCols.every(c => aCols.includes(c))) throw new Error('divide: every attribute of the divisor must appear in the dividend');
        const keep = aCols.map((c, j) => j).filter(j => !bCols.includes(aCols[j]));
        const bi = bCols.map(c => aCols.indexOf(c));
        const bKeys = dedupe(b.rows).map(rowKey);
        const groups = new Map();
        for (const r of a.rows) { const k = rowKey(keep.map(j => r[j])); if (!groups.has(k)) groups.set(k, new Set()); groups.get(k).add(rowKey(bi.map(j => r[j]))); }
        out = { columns: keep.map(j => aCols[j]), rows: [...groups.entries()].filter(([, set]) => bKeys.every(k => set.has(k))).map(([k]) => JSON.parse(k)) };
        note = ` — keeps the ${out.columns.join(', ')} values paired with every tuple of the divisor`; break;
      }
    }
    s.results.push({ label: raShow(n), table: out });
    yield { d: `${raShow(n)}: ${out.rows.length} tuple${out.rows.length === 1 ? '' : 's'}${note}`, html: tableHtml(raShow(n), out, { max: 40 }) };
    return out;
  },
  render(s, step) {
    return { html: step.html || tablesHtml(s.tables), tablesHtml: step.html ? tablesHtml(s.tables, { cls: 'db-dim' }) : '' };
  },
};
const relName = n => n.k === 'rel' ? n.name : n.k === 'rename' ? n.newName : (n.k === 'project' || n.k === 'select') ? relName(n.args[0]) : 'T';

/* ═══════════════════════ functional dependencies ═══════════════════════ */
// attributes: single letters written together (ABC) or names separated by commas/spaces; FDs "AB -> C", "A, B → C, D"
function parseAttrs(text, known) {
  const s = String(text).trim();
  if (!s) return [];
  if (/[,\s]/.test(s)) return s.split(/[,\s]+/).filter(Boolean);
  if (known && known.includes(s)) return [s];
  if (known && known.some(a => a.length > 1)) return [s]; // named attributes: never split a word into letters
  if (/^[A-Za-z0-9_]+$/.test(s)) return s.split('');
  return [s];
}
// the FDs and the attribute list of a block, parsed together so that multi-letter names are kept whole
function readFds(cfg) {
  const declared = cfg.attributes ? uniq(parseAttrs(cfg.attributes)) : null;
  const fds = parseFds(cfg.fds, declared);
  const all = declared || allAttrs(cfg, fds);
  return { fds, all };
}
function parseFds(text, known) {
  const items = Array.isArray(text) ? text : String(text || '').split(/[;\n]+/);
  const out = [];
  for (const it of items) {
    const m = String(it).trim().match(/^(.+?)\s*(?:->|→|=>)\s*(.+)$/);
    if (!m) { if (String(it).trim()) throw new Error(`cannot read the FD '${it}' (write it as X -> Y)`); continue; }
    out.push({ lhs: uniq(parseAttrs(m[1], known)), rhs: uniq(parseAttrs(m[2], known)) });
  }
  return out;
}
const uniq = a => { const s = new Set(); return a.filter(x => (s.has(x) ? false : (s.add(x), true))); };
const A = a => a.length ? a.join(a.some(x => x.length > 1) ? ',' : '') : '∅';
const F = f => `${A(f.lhs)} → ${A(f.rhs)}`;
const subset = (a, b) => a.every(x => b.includes(x));
const setEq = (a, b) => subset(a, b) && subset(b, a);
const sortAttrs = (xs, order) => uniq(xs).sort((p, q) => order.indexOf(p) - order.indexOf(q));
function allAttrs(cfg, fds) { if (cfg.attributes) return uniq(parseAttrs(cfg.attributes)); const seen = []; for (const f of fds) for (const x of f.lhs.concat(f.rhs)) if (!seen.includes(x)) seen.push(x); return seen; }
// X⁺ under fds, with a trace of the FDs applied (in the order they fire)
function closure(X, fds, order) {
  let cur = sortAttrs(X, order); const trace = []; let changed = true;
  while (changed) {
    changed = false;
    for (const f of fds) if (subset(f.lhs, cur) && !subset(f.rhs, cur)) { const added = f.rhs.filter(x => !cur.includes(x)); cur = sortAttrs(cur.concat(added), order); trace.push({ f, added, cur: cur.slice() }); changed = true; }
  }
  return { cur, trace };
}
function isSuperkey(X, fds, all) { return subset(all, closure(X, fds, all).cur); }
function candidateKeys(fds, all) {
  // attributes never on a right-hand side must be in every key; grow from there
  const rhsAll = uniq(fds.flatMap(f => f.rhs));
  const core = all.filter(a => !rhsAll.includes(a));
  const rest = all.filter(a => !core.includes(a));
  const keys = [];
  const combos = []; for (let k = 0; k <= rest.length; k++) combos.push(...choose(rest, k));
  for (const c of combos) { const cand = sortAttrs(core.concat(c), all); if (keys.some(k => subset(k, cand))) continue; if (isSuperkey(cand, fds, all)) keys.push(cand); }
  return { keys, core };
}
function choose(arr, k) { if (k === 0) return [[]]; if (arr.length < k) return []; const [h, ...t] = arr; return choose(t, k - 1).map(c => [h].concat(c)).concat(choose(t, k)); }
function fdHtml(fds, hl) { return `<div class="db-fds">${fds.map((f, i) => `<span class="db-fd ${hl && hl.i === i ? (hl.tone || 'hl') : ''} ${hl && hl.gone && hl.gone.includes(i) ? 'gone' : ''}">${esc(F(f))}</span>`).join('')}</div>`; }
const attrsHtml = (xs, tone) => `<span class="db-attrs ${tone || ''}">${esc(A(xs))}</span>`;

MODES['fd-closure'] = {
  title: 'Attribute closure',
  init(cfg) { const { fds, all } = readFds(cfg); return { fds, all, x: cfg.x ? uniq(parseAttrs(cfg.x, all)) : [], check: cfg.check || '', last: null }; },
  controls: [{ kind: 'text', name: 'x', label: 'X', default: '' }, { kind: 'button', label: 'closure X⁺', op: 'closure', args: ['x'], primary: true }, { kind: 'text', name: 'fd', label: 'X → Y', default: '' }, { kind: 'button', label: 'does F imply it?', op: 'implies', args: ['fd'] }],
  *closure(s, args) {
    const X = args[0] ? uniq(parseAttrs(args[0], s.all)) : s.x;
    const bad = X.filter(a => !s.all.includes(a)); if (bad.length) { yield { d: `unknown attribute${bad.length > 1 ? 's' : ''} ${bad.join(', ')} (schema: ${A(s.all)})`, err: true }; return; }
    let cur = sortAttrs(X, s.all); s.last = { X, cur };
    yield { d: `start with X⁺ = X = ${A(cur)}; scan the FDs for one whose left side lies inside X⁺`, hl: {} };
    let changed = true, round = 0;
    while (changed) {
      changed = false; round++;
      for (let i = 0; i < s.fds.length; i++) {
        const f = s.fds[i];
        if (subset(f.lhs, cur) && !subset(f.rhs, cur)) { const added = f.rhs.filter(x => !cur.includes(x)); cur = sortAttrs(cur.concat(added), s.all); s.last.cur = cur; changed = true; yield { d: `${F(f)}: ${A(f.lhs)} ⊆ X⁺, so add ${A(added)} — X⁺ = ${A(cur)}`, hl: { i, tone: 'ok' } }; }
      }
      if (changed) yield { d: `end of pass ${round}: X⁺ = ${A(cur)}; scan again in case a new attribute unlocks an FD`, hl: {} };
    }
    const isKey = subset(s.all, cur);
    yield { d: `no FD adds anything: ${A(X)}⁺ = ${A(cur)}${isKey ? ` = all attributes, so ${A(X)} is a superkey` : ` (missing ${A(s.all.filter(a => !cur.includes(a)))}: not a superkey)`}`, hl: {} };
  },
  *implies(s, args) {
    let fd; try { fd = parseFds([args[0] || s.check], s.all)[0]; } catch (e) { yield { d: e.message, err: true }; return; }
    if (!fd) { yield { d: 'write the FD to test as X -> Y', err: true }; return; }
    yield { d: `does F imply ${F(fd)}? Compute ${A(fd.lhs)}⁺ and check that it contains ${A(fd.rhs)}`, hl: {} };
    yield* MODES['fd-closure'].closure(s, [A(fd.lhs)]);
    const ok = subset(fd.rhs, s.last.cur);
    yield { d: ok ? `${A(fd.rhs)} ⊆ ${A(fd.lhs)}⁺: yes, ${F(fd)} is in F⁺` : `${A(fd.rhs.filter(a => !s.last.cur.includes(a)))} ∉ ${A(fd.lhs)}⁺: no, F does not imply ${F(fd)}`, hl: {} };
  },
  render(s, step) {
    return { html: `<div class="db-schema">R = ${esc(A(s.all))}</div>${fdHtml(s.fds, step.hl)}${s.last ? `<div class="db-closure">${attrsHtml(s.last.X)}<sup>+</sup> = ${attrsHtml(s.last.cur, 'ok')}</div>` : ''}` };
  },
};

MODES['fd-keys'] = {
  title: 'Candidate keys',
  init(cfg) { const { fds, all } = readFds(cfg); return { fds, all, keys: [], tried: [] }; },
  controls: [{ kind: 'text', name: 'x', label: 'test a set', default: '' }, { kind: 'button', label: 'superkey?', op: 'test', args: ['x'] }, { kind: 'button', label: 'find all candidate keys', op: 'keys', primary: true }],
  *test(s, args) {
    const X = uniq(parseAttrs(args[0] || '', s.all)); if (!X.length) { yield { d: 'write a set of attributes', err: true }; return; }
    const c = closure(X, s.fds, s.all);
    const sk = subset(s.all, c.cur);
    s.tried.push({ X, cur: c.cur, sk });
    if (!sk) { yield { d: `${A(X)}⁺ = ${A(c.cur)} ≠ R: not a superkey`, hl: {} }; return; }
    const minimal = X.every(a => !subset(s.all, closure(X.filter(b => b !== a), s.fds, s.all).cur));
    yield { d: `${A(X)}⁺ = R: a superkey${minimal ? ', and minimal — a candidate key' : ` but not minimal: ${A(X.filter(a => subset(s.all, closure(X.filter(b => b !== a), s.fds, s.all).cur)))} can be dropped`}`, hl: {} };
  },
  *keys(s) {
    const rhsAll = uniq(s.fds.flatMap(f => f.rhs));
    const core = s.all.filter(a => !rhsAll.includes(a));
    yield { d: core.length ? `${A(core)} never appear${core.length === 1 ? 's' : ''} on a right-hand side, so no FD can produce ${core.length === 1 ? 'it' : 'them'}: every key contains ${A(core)}` : 'every attribute appears on some right-hand side, so start from single attributes', hl: {} };
    const rest = s.all.filter(a => !core.includes(a));
    s.keys = []; s.tried = [];
    for (let k = 0; k <= rest.length; k++) {
      for (const c of choose(rest, k)) {
        const cand = sortAttrs(core.concat(c), s.all);
        if (s.keys.some(key => subset(key, cand))) continue;
        const cl = closure(cand, s.fds, s.all).cur; const sk = subset(s.all, cl);
        s.tried.push({ X: cand, cur: cl, sk });
        if (sk) { s.keys.push(cand); yield { d: `${A(cand)}⁺ = R: candidate key (no proper subset is one, or it would have been found earlier)`, hl: {} }; }
        else yield { d: `${A(cand)}⁺ = ${A(cl)}: not a superkey`, hl: {} };
      }
    }
    const prime = uniq(s.keys.flat());
    yield { d: `candidate keys: ${s.keys.map(A).join(', ')}; prime attributes ${A(sortAttrs(prime, s.all))}${s.all.filter(a => !prime.includes(a)).length ? `, non-prime ${A(s.all.filter(a => !prime.includes(a)))}` : ''}`, hl: {} };
  },
  render(s) {
    const rows = s.tried.map(t => `<tr class="${t.sk ? 'ok' : ''}"><td>${esc(A(t.X))}</td><td>${esc(A(t.cur))}</td><td>${t.sk ? 'superkey' : '—'}</td></tr>`).join('');
    return { html: `<div class="db-schema">R = ${esc(A(s.all))}</div>${fdHtml(s.fds)}${rows ? `<table class="db-mini"><thead><tr><th>X</th><th>X⁺</th><th></th></tr></thead><tbody>${rows}</tbody></table>` : ''}${s.keys.length ? `<div class="db-closure">keys: ${s.keys.map(k => attrsHtml(k, 'ok')).join(' ')}</div>` : ''}` };
  },
};

// canonical cover: split right sides, remove extraneous attributes on the left, drop redundant FDs
function canonicalCover(fds, all, emit) {
  let G = fds.flatMap(f => f.rhs.map(a => ({ lhs: f.lhs.slice(), rhs: [a] })));
  emit && emit(`1. split every right-hand side into single attributes: ${G.length} FDs`, G.slice());
  // left reduction
  for (let i = 0; i < G.length; i++) {
    let f = G[i];
    for (const a of f.lhs.slice()) {
      if (f.lhs.length === 1) break;
      const smaller = f.lhs.filter(x => x !== a);
      const cl = closure(smaller, G, all).cur;
      if (subset(f.rhs, cl)) { emit && emit(`2. in ${F(f)}, ${a} is extraneous: ${A(smaller)}⁺ = ${A(cl)} already contains ${A(f.rhs)} — replace by ${A(smaller)} → ${A(f.rhs)}`, G.slice(), i); f = { lhs: smaller, rhs: f.rhs }; G[i] = f; }
      else emit && emit(`2. in ${F(f)}, ${a} is needed: ${A(smaller)}⁺ = ${A(cl)} misses ${A(f.rhs)}`, G.slice(), i);
    }
  }
  // remove redundant FDs
  for (let i = 0; i < G.length; i++) {
    const rest = G.filter((_, j) => j !== i);
    const cl = closure(G[i].lhs, rest, all).cur;
    if (subset(G[i].rhs, cl)) { emit && emit(`3. ${F(G[i])} is redundant: without it ${A(G[i].lhs)}⁺ = ${A(cl)} still contains ${A(G[i].rhs)} — drop it`, G.slice(), i, true); G.splice(i, 1); i--; }
    else emit && emit(`3. ${F(G[i])} is not redundant: without it ${A(G[i].lhs)}⁺ = ${A(cl)}`, G.slice(), i);
  }
  // merge same left sides
  const merged = [];
  for (const f of G) { const m = merged.find(g => setEq(g.lhs, f.lhs)); if (m) m.rhs = uniq(m.rhs.concat(f.rhs)); else merged.push({ lhs: f.lhs.slice(), rhs: f.rhs.slice() }); }
  emit && emit(`4. merge FDs with the same left side: canonical cover G = { ${merged.map(F).join(', ')} }`, merged.slice());
  return merged;
}
MODES['fd-cover'] = {
  title: 'Canonical cover',
  init(cfg) { const { fds, all } = readFds(cfg); return { fds, all, G: fds.slice(), hl: null, done: false }; },
  controls: [{ kind: 'button', label: 'compute the canonical cover', op: 'cover', primary: true }],
  *cover(s) {
    const steps = [];
    const G = canonicalCover(s.fds, s.all, (d, G, i, gone) => steps.push({ d, G: clone(G), hl: i === undefined ? null : { i, tone: gone ? 'hi' : 'ok' } }));
    for (const st of steps) { s.G = st.G; s.hl = st.hl; yield { d: st.d, hl: st.hl }; }
    s.G = G; s.done = true;
  },
  render(s, step) { return { html: `<div class="db-schema">R = ${esc(A(s.all))}, F = { ${esc(s.fds.map(F).join(', '))} }</div><div class="db-label">${s.done ? 'canonical cover' : 'working set'}</div>${fdHtml(s.G, step.hl)}` }; },
};

/* ── decomposition: lossless join by the chase, dependency preservation ── */
function parseDecomposition(text, all) { // "ABC, CD" | "ABC; CD" | "R1(A,B,C); R2(C,D)" | ["ABC", "CD"]
  let parts;
  if (Array.isArray(text)) parts = text.map(String);
  else { const s = String(text || '').trim(); parts = /[;|]/.test(s) || /\)/.test(s) ? s.split(/[;|]+/).map(p => p.replace(/^[^(]*\(|\)\s*$/g, '')) : s.split(/\s*,\s*/); }
  return parts.map(p => uniq(parseAttrs(p.trim(), all))).filter(p => p.length);
}
MODES.decomposition = {
  title: 'Decomposition',
  init(cfg) { const { fds, all } = readFds(cfg); return { fds, all, parts: parseDecomposition(cfg.decomposition || cfg.parts || '', all), tableau: null, result: null, dp: null }; },
  controls: [{ kind: 'text', name: 'dec', label: 'decomposition (AB, BC)', default: '' }, { kind: 'button', label: 'chase (lossless?)', op: 'chase', args: ['dec'], primary: true }, { kind: 'button', label: 'dependency-preserving?', op: 'preserve', args: ['dec'] }],
  *chase(s, args) {
    if (args[0]) s.parts = parseDecomposition(args[0], s.all);
    if (s.parts.length < 2) { yield { d: 'give at least two relation schemas, e.g. ABC, BD', err: true }; return; }
    const all = s.all, parts = s.parts;
    // tableau: one row per part; unsubscripted a for attributes of the part, b_ij otherwise
    const T = parts.map((p, i) => all.map(a => p.includes(a) ? a : `b${i + 1}${a}`));
    s.tableau = { rows: clone(T), hl: null }; s.result = null;
    yield { d: `tableau: one row per relation of the decomposition, unsubscripted symbols for its attributes, distinct b's elsewhere. Apply the FDs: rows that agree on the left side must agree on the right`, hl: {} };
    let changed = true, guard = 0;
    while (changed && guard++ < 50) {
      changed = false;
      for (const f of s.fds) {
        const li = f.lhs.map(a => all.indexOf(a)), ri = f.rhs.map(a => all.indexOf(a));
        for (let i = 0; i < T.length; i++) for (let j = i + 1; j < T.length; j++) {
          if (!li.every(k => T[i][k] === T[j][k])) continue;
          for (const k of ri) {
            if (T[i][k] === T[j][k]) continue;
            const vi = T[i][k], vj = T[j][k];
            const keep = !vi.startsWith('b') ? vi : !vj.startsWith('b') ? vj : (vi < vj ? vi : vj);
            const drop = keep === vi ? vj : vi;
            for (const row of T) for (let m = 0; m < row.length; m++) if (row[m] === drop) row[m] = keep;
            s.tableau = { rows: clone(T), hl: { rows: [i, j], col: k } };
            changed = true;
            yield { d: `${F(f)}: rows ${i + 1} and ${j + 1} agree on ${A(f.lhs)}, so ${drop} becomes ${keep} in column ${all[k]}`, hl: {} };
          }
        }
      }
    }
    const full = T.findIndex(r => r.every(v => !v.startsWith('b')));
    s.result = full >= 0;
    s.tableau = { rows: clone(T), hl: full >= 0 ? { rows: [full] } : null };
    yield { d: full >= 0 ? `row ${full + 1} has no subscripts: the decomposition is lossless (every tuple of the join is a tuple of R)` : `no row is unsubscripted and nothing changes any more: the decomposition is lossy — the join can produce spurious tuples`, hl: {}, err: full < 0 };
  },
  *preserve(s, args) {
    if (args[0]) s.parts = parseDecomposition(args[0], s.all);
    const all = s.all;
    const lost = [];
    yield { d: `for each FD X → Y in F, compute X⁺ using only the FDs that can be enforced inside single relations of the decomposition (projected closure)`, hl: {} };
    for (const f of s.fds) {
      // projected closure: iterate: for each part, add (cur ∩ part)⁺ ∩ part
      let cur = f.lhs.slice(); let changed = true;
      while (changed) { changed = false; for (const p of s.parts) { const inP = cur.filter(a => p.includes(a)); const add = closure(inP, s.fds, all).cur.filter(a => p.includes(a) && !cur.includes(a)); if (add.length) { cur = sortAttrs(cur.concat(add), all); changed = true; } } }
      const ok = subset(f.rhs, cur);
      if (!ok) lost.push(f);
      yield { d: `${F(f)}: projected closure of ${A(f.lhs)} = ${A(cur)} — ${ok ? 'preserved' : `does not reach ${A(f.rhs.filter(a => !cur.includes(a)))}: this FD needs a join to check, it is not preserved`}`, hl: { fd: f, tone: ok ? 'ok' : 'hi' } };
    }
    s.dp = { lost };
    yield { d: lost.length ? `not dependency-preserving: ${lost.map(F).join(', ')} cannot be enforced without joining` : 'dependency-preserving: every FD can be checked inside one relation', hl: {}, err: lost.length > 0 };
  },
  render(s, step) {
    let h = `<div class="db-schema">R = ${esc(A(s.all))}, F = { ${esc(s.fds.map(F).join(', '))} }</div><div class="db-label">decomposition: ${s.parts.map(p => `<span class="db-attrs">${esc(A(p))}</span>`).join(' ')}</div>`;
    if (s.tableau) {
      const t = s.tableau;
      h += `<table class="db-chase"><thead><tr><th></th>${s.all.map((a, k) => `<th class="${t.hl && t.hl.col === k ? 'hl' : ''}">${esc(a)}</th>`).join('')}</tr></thead><tbody>${t.rows.map((r, i) => `<tr class="${t.hl && t.hl.rows && t.hl.rows.includes(i) ? (s.result && t.hl.rows.length === 1 ? 'ok' : 'hl') : ''}"><th>${esc(A(s.parts[i]))}</th>${r.map((v, k) => `<td class="${t.hl && t.hl.col === k ? 'hl' : ''}">${v.startsWith('b') ? `b<sub>${esc(v.slice(1))}</sub>` : esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    }
    h += fdHtml(s.fds, step.hl && step.hl.fd ? { i: s.fds.indexOf(step.hl.fd), tone: step.hl.tone } : null);
    if (s.dp) h += `<div class="db-label">${s.dp.lost.length ? 'not preserved: ' + s.dp.lost.map(F).join(', ') : 'every FD preserved'}</div>`;
    return { html: h };
  },
};

/* ── normal forms: check, BCNF decomposition, 3NF synthesis ── */
function nfCheck(all, fds) {
  const { keys } = candidateKeys(fds, all);
  const prime = uniq(keys.flat());
  const problems = [];
  for (const f of fds) for (const a of f.rhs) {
    if (f.lhs.includes(a)) continue; // trivial
    const sk = subset(all, closure(f.lhs, fds, all).cur);
    if (sk) continue;
    if (prime.includes(a)) problems.push({ f, a, level: 'BCNF', why: `${A(f.lhs)} is not a superkey but ${a} is prime: violates BCNF only` });
    else if (keys.some(k => f.lhs.every(x => k.includes(x)) && f.lhs.length < k.length)) problems.push({ f, a, level: '2NF', why: `${A(f.lhs)} is a proper part of the key ${A(keys.find(k => f.lhs.every(x => k.includes(x))))} and ${a} is non-prime: a partial dependency, violates 2NF` });
    else problems.push({ f, a, level: '3NF', why: `${A(f.lhs)} is not a superkey and ${a} is non-prime: a transitive dependency, violates 3NF` });
  }
  const level = problems.some(p => p.level === '2NF') ? '1NF' : problems.some(p => p.level === '3NF') ? '2NF' : problems.some(p => p.level === 'BCNF') ? '3NF' : 'BCNF';
  return { keys, prime, problems, level };
}
MODES['normal-form'] = {
  title: 'Normal forms',
  init(cfg) { const { fds, all } = readFds(cfg); return { fds, all, name: cfg.name || 'R', result: [], keys: [], report: null }; },
  controls: [{ kind: 'button', label: 'which normal form?', op: 'check', primary: true }, { kind: 'button', label: 'decompose into BCNF', op: 'bcnf' }, { kind: 'button', label: '3NF synthesis', op: 'threenf' }],
  *check(s) {
    const r = nfCheck(s.all, s.fds); s.keys = r.keys; s.report = r; s.result = [];
    yield { d: `candidate keys: ${r.keys.map(A).join(', ')}; prime attributes ${A(sortAttrs(r.prime, s.all))}`, hl: {} };
    for (const p of r.problems) yield { d: `${F(p.f)} → ${p.a}: ${p.why}`, hl: { fd: p.f, tone: 'hi' } };
    yield { d: r.problems.length ? `highest normal form: ${r.level}` : 'every non-trivial FD has a superkey on the left: BCNF (hence 3NF, 2NF)', hl: {} };
  },
  *bcnf(s) {
    const work = [{ name: s.name, attrs: s.all.slice() }]; const done = [];
    s.result = []; let n = 1;
    yield { d: `BCNF decomposition of ${s.name}(${A(s.all)}): find an FD X → Y that violates BCNF (X not a superkey), split into X⁺ and X ∪ (R − X⁺), repeat on the pieces`, hl: {} };
    while (work.length) {
      const R = work.shift();
      const proj = projectFds(s.fds, R.attrs, s.all);
      const bad = proj.find(f => !subset(R.attrs, closure(f.lhs, proj, R.attrs).cur) && !subset(f.rhs, f.lhs));
      if (!bad) { done.push(R); s.result = done.concat(work); yield { d: `${R.name}(${A(R.attrs)}) is in BCNF: every FD projected onto it has a superkey on the left`, hl: {} }; continue; }
      const xp = closure(bad.lhs, proj, R.attrs).cur.filter(a => R.attrs.includes(a));
      const R1 = { name: `${s.name}${n++}`, attrs: sortAttrs(xp, s.all) }, R2 = { name: `${s.name}${n++}`, attrs: sortAttrs(bad.lhs.concat(R.attrs.filter(a => !xp.includes(a))), s.all) };
      work.push(R1, R2); s.result = done.concat(work);
      yield { d: `${R.name}(${A(R.attrs)}): ${F(bad)} violates BCNF (${A(bad.lhs)}⁺ = ${A(xp)} ≠ ${R.name}). Split into ${R1.name}(${A(R1.attrs)}) = ${A(bad.lhs)}⁺ and ${R2.name}(${A(R2.attrs)}) = ${A(bad.lhs)} ∪ the rest — lossless because they share ${A(bad.lhs)}, a key of ${R1.name}`, hl: { fd: bad, tone: 'hi' } };
    }
    const lost = s.fds.filter(f => !preservedIn(f, done.map(r => r.attrs), s.fds, s.all));
    yield { d: `BCNF decomposition: ${done.map(r => `${r.name}(${A(r.attrs)})`).join(', ')}${lost.length ? ` — not dependency-preserving: ${lost.map(F).join(', ')} span two relations` : ' — and every FD is preserved'}`, hl: {}, err: lost.length > 0 };
  },
  *threenf(s) {
    const G = canonicalCover(s.fds, s.all);
    yield { d: `3NF synthesis starts from a canonical cover: G = { ${G.map(F).join(', ')} }`, hl: {} };
    const rels = []; let n = 1;
    for (const f of G) { const attrs = sortAttrs(f.lhs.concat(f.rhs), s.all); if (rels.some(r => subset(attrs, r.attrs))) { yield { d: `${F(f)}: ${A(attrs)} is already inside ${rels.find(r => subset(attrs, r.attrs)).name}`, hl: {} }; continue; } rels.push({ name: `${s.name}${n++}`, attrs, from: f }); s.result = rels.slice(); yield { d: `one relation per FD of G: ${rels[rels.length - 1].name}(${A(attrs)}) from ${F(f)} — its left side is a key of it, so ${F(f)} is enforced inside`, hl: { fd: f, tone: 'ok' } }; }
    const { keys } = candidateKeys(s.fds, s.all);
    if (!rels.some(r => keys.some(k => subset(k, r.attrs)))) { const k = keys[0]; rels.push({ name: `${s.name}${n++}`, attrs: k.slice() }); s.result = rels.slice(); yield { d: `no relation contains a key of ${s.name} (${keys.map(A).join(' or ')}): add ${rels[rels.length - 1].name}(${A(k)}) so the join is lossless`, hl: {} }; }
    else yield { d: `some relation contains a key of ${s.name} (${keys.map(A).join(' or ')}): the decomposition is lossless as it is`, hl: {} };
    yield { d: `3NF synthesis: ${rels.map(r => `${r.name}(${A(r.attrs)})`).join(', ')} — lossless and dependency-preserving by construction; a relation may still allow a BCNF violation when its key overlaps`, hl: {} };
  },
  render(s, step) {
    let h = `<div class="db-schema">${esc(s.name)} = ${esc(A(s.all))}, F = { ${esc(s.fds.map(F).join(', '))} }</div>` + fdHtml(s.fds, step.hl && step.hl.fd ? { i: s.fds.indexOf(step.hl.fd), tone: step.hl.tone } : null);
    if (s.report) h += `<div class="db-label">keys ${s.report.keys.map(k => attrsHtml(k, 'ok')).join(' ')} · normal form <b>${s.report.level}</b></div>`;
    if (s.result.length) h += `<div class="db-rels">${s.result.map(r => `<span class="db-rel">${esc(r.name)}(${esc(A(r.attrs))})</span>`).join(' ')}</div>`;
    return { html: h };
  },
};
function projectFds(fds, attrs, all) { // F restricted to a subset: X → A for X ⊆ attrs, A ∈ (X⁺ ∩ attrs) − X, X minimal-ish (all subsets of attrs up to size 3 kept simple)
  const out = [];
  const subs = []; for (let k = 1; k <= Math.min(attrs.length, 4); k++) subs.push(...choose(attrs, k));
  for (const X of subs) { const cl = closure(X, fds, all).cur; const rhs = cl.filter(a => attrs.includes(a) && !X.includes(a)); if (rhs.length && !out.some(f => subset(f.lhs, X) && subset(rhs, f.rhs))) out.push({ lhs: sortAttrs(X, all), rhs: sortAttrs(rhs, all) }); }
  return out;
}
function preservedIn(f, parts, fds, all) {
  let cur = f.lhs.slice(); let changed = true;
  while (changed) { changed = false; for (const p of parts) { const inP = cur.filter(a => p.includes(a)); const add = closure(inP, fds, all).cur.filter(a => p.includes(a) && !cur.includes(a)); if (add.length) { cur = cur.concat(add); changed = true; } } }
  return subset(f.rhs, cur);
}

/* ═══════════════════════ Datalog (naive bottom-up evaluation) ═══════════════════════ */
// rules: head(X, Y) :- p(X, Z), q(Z, Y), X > 3, NOT r(X, Y).    (also "<-" and "←"); variables start with an upper-case letter
function parseDatalog(text) {
  const rules = [];
  for (const raw of String(text).split(/\.\s*(?:\n|$)|\n(?=\s*\w+\s*\()/)) {
    const line = raw.trim().replace(/\.$/, '');
    if (!line || line.startsWith('%') || line.startsWith('//')) continue;
    const m = line.match(/^(\w+)\s*\(([^)]*)\)\s*(?::-|<-|←)\s*(.+)$/s);
    if (!m) throw new Error(`cannot read the rule '${line.slice(0, 40)}'`);
    const head = { pred: m[1], args: m[2].split(',').map(a => term(a)) };
    const body = [];
    for (const g of splitGoals(m[3])) {
      const neg = /^(not|¬|!)\s*/i.test(g); const gg = g.replace(/^(not|¬|!)\s*/i, '').trim();
      const atom = gg.match(/^(\w+)\s*\(([^)]*)\)$/);
      if (atom) body.push({ neg, pred: atom[1], args: atom[2].split(',').map(a => term(a)) });
      else { const cmp = gg.match(/^(.+?)\s*(<=|>=|<>|!=|=|<|>)\s*(.+)$/); if (!cmp) throw new Error(`cannot read the subgoal '${gg}'`); body.push({ cmp: cmp[2] === '!=' ? '<>' : cmp[2], l: term(cmp[1]), r: term(cmp[3]) }); }
    }
    rules.push({ head, body, text: line });
  }
  return rules;
}
function splitGoals(s) { const out = []; let cur = '', d = 0; for (const c of s) { if (c === '(') d++; if (c === ')') d--; if (c === ',' && d === 0) { out.push(cur.trim()); cur = ''; } else cur += c; } if (cur.trim()) out.push(cur.trim()); return out; }
function term(s) { s = s.trim(); if (/^[A-Z_]\w*$/.test(s)) return { v: s }; if (/^'.*'$/.test(s) || /^".*"$/.test(s)) return { c: s.slice(1, -1) }; if (/^-?\d+(\.\d+)?$/.test(s)) return { c: Number(s) }; return { c: s }; }
const termShow = t => t.v !== undefined ? t.v : (isNum(t.c) ? String(t.c) : `'${t.c}'`);
const goalShow = g => g.cmp ? `${termShow(g.l)} ${g.cmp} ${termShow(g.r)}` : `${g.neg ? 'NOT ' : ''}${g.pred}(${g.args.map(termShow).join(', ')})`;
const ruleShow = r => `${r.head.pred}(${r.head.args.map(termShow).join(', ')}) ← ${r.body.map(goalShow).join(', ')}`;
MODES.datalog = {
  title: 'Datalog',
  init(cfg) {
    const edb = parseTables(cfg);
    let rules = []; try { rules = parseDatalog(cfg.program || cfg.rules || ''); } catch (e) { rules = []; }
    const idb = {}; for (const r of rules) if (!idb[r.head.pred]) idb[r.head.pred] = { columns: r.head.args.map((a, i) => a.v || 'c' + i), rows: [] };
    return { edb, program: cfg.program || cfg.rules || '', rules, idb, round: 0, done: false, hl: null };
  },
  controls: [{ kind: 'sqltext', name: 'p', label: 'program', rows: 3 }, { kind: 'button', label: '▶ Evaluate', op: 'evaluate', args: ['p'], primary: true }],
  *evaluate(s, args) {
    const text = String(args[0] !== undefined && args[0] !== '' ? args[0] : s.program);
    try { s.rules = parseDatalog(text); } catch (e) { yield { d: e.message, err: true }; return; }
    s.idb = {}; for (const r of s.rules) if (!s.idb[r.head.pred]) s.idb[r.head.pred] = { columns: r.head.args.map((a, i) => a.v || 'c' + i), rows: [] };
    const unsafe = s.rules.find(r => { const bound = new Set(r.body.filter(g => !g.cmp && !g.neg).flatMap(g => g.args.filter(a => a.v).map(a => a.v))); return r.head.args.some(a => a.v && !bound.has(a.v)) || r.body.some(g => (g.neg && g.args.some(a => a.v && !bound.has(a.v))) || (g.cmp && [g.l, g.r].some(t => t.v && !bound.has(t.v)))); });
    if (unsafe) { yield { d: `unsafe rule: ${ruleShow(unsafe)} — every variable of the head, of a negated subgoal and of a comparison must also appear in a positive subgoal`, err: true }; return; }
    s.round = 0; s.done = false;
    yield { d: `EDB: ${Object.keys(s.edb).join(', ') || 'none'}; IDB predicates ${Object.keys(s.idb).join(', ')} start empty. Repeat: apply every rule to the current relations until nothing new appears`, hl: {} };
    let changed = true;
    while (changed && s.round < 30) {
      changed = false; s.round++;
      for (const r of s.rules) {
        const rel = p => s.edb[p] || s.idb[p];
        const tuples = deriveRule(r, rel);
        const existing = new Set(s.idb[r.head.pred].rows.map(rowKey));
        const fresh = tuples.filter(t => !existing.has(rowKey(t)));
        if (fresh.length) { s.idb[r.head.pred].rows.push(...fresh); changed = true; }
        s.hl = { pred: r.head.pred, fresh: fresh.map(rowKey) };
        yield { d: `round ${s.round}, ${ruleShow(r)}: ${fresh.length ? `${fresh.length} new tuple${fresh.length === 1 ? '' : 's'} ${fresh.slice(0, 4).map(t => '(' + t.join(', ') + ')').join(' ')}${fresh.length > 4 ? ' …' : ''}` : 'nothing new'}`, hl: {} };
      }
      if (!changed) { s.done = true; s.hl = null; yield { d: `round ${s.round} produced nothing new: the fixpoint is reached — ${Object.entries(s.idb).map(([p, t]) => `${p} has ${t.rows.length} tuple${t.rows.length === 1 ? '' : 's'}`).join(', ')}`, hl: {} }; }
    }
    if (!s.done) yield { d: 'stopped after 30 rounds', err: true };
  },
  render(s) {
    const idbHtml = Object.entries(s.idb).map(([p, t]) => tableHtml(p, t, { max: 20, hlRows: s.hl && s.hl.pred === p ? new Set(t.rows.map((r, i) => s.hl.fresh.includes(rowKey(r)) ? i : -1).filter(i => i >= 0)) : null, tone: 'ok', suffix: '(IDB)' })).join('');
    return { html: `<div class="db-rules">${s.rules.map(r => `<div>${esc(ruleShow(r))}</div>`).join('')}</div><div class="db-tables">${idbHtml}</div>`, tablesHtml: tablesHtml(s.edb, { cls: 'db-dim' }) };
  },
};
function deriveRule(r, rel) {
  const pos = r.body.filter(g => !g.cmp && !g.neg), rest = r.body.filter(g => g.cmp || g.neg);
  let envs = [{}];
  for (const g of pos) {
    const t = rel(g.pred); if (!t) throw new Error(`unknown predicate ${g.pred}`);
    const next = [];
    for (const env of envs) for (const row of t.rows) {
      if (row.length !== g.args.length) continue;
      const e = Object.assign({}, env); let ok = true;
      g.args.forEach((a, i) => { if (!ok) return; if (a.v !== undefined) { if (e[a.v] !== undefined && e[a.v] !== row[i]) ok = false; else e[a.v] = row[i]; } else if (a.c !== row[i]) ok = false; });
      if (ok) next.push(e);
    }
    envs = next;
  }
  const val = (t, e) => t.v !== undefined ? e[t.v] : t.c;
  envs = envs.filter(e => rest.every(g => {
    if (g.cmp) { const a = val(g.l, e), b = val(g.r, e); switch (g.cmp) { case '=': return a === b; case '<>': return a !== b; case '<': return a < b; case '<=': return a <= b; case '>': return a > b; case '>=': return a >= b; } return false; }
    const t = rel(g.pred); if (!t) return true;
    return !t.rows.some(row => g.args.every((a, i) => val(a, e) === row[i]));
  }));
  return dedupe(envs.map(e => r.head.args.map(a => val(a, e))));
}

/* ═══════════════════════ E/R diagrams and their conversion to relations ═══════════════════════ */
// cfg.er: { entities: { Name: { attrs: ['title*', 'year*', 'length'], weak: true? } }, relationships: [ { name, between: [E1, E2, …], arrow: [E2] (the "one" side), rounded: [E], attrs: [], supporting: true } ], isa: [ { sub, super } ] }
function parseEr(cfg) {
  const er = cfg.er || {};
  const entities = Object.entries(er.entities || {}).map(([name, e]) => ({ name, attrs: (e.attrs || []).map(a => ({ name: String(a).replace(/\*$/, ''), key: /\*$/.test(String(a)) })), weak: !!e.weak }));
  const rels = (er.relationships || []).map(r => ({ name: r.name, between: r.between || [], arrow: r.arrow || [], rounded: r.rounded || [], attrs: r.attrs || [], supporting: !!r.supporting, roles: r.roles || [] }));
  const isa = (er.isa || []).map(x => ({ sub: x.sub, super: x.super }));
  return { entities, rels, isa };
}
MODES.er = {
  title: 'E/R diagram',
  init(cfg) { const er = parseEr(cfg); return Object.assign(er, { relations: [], hl: null, layout: (cfg.er && cfg.er.layout) || null }); },
  controls: [{ kind: 'button', label: 'convert to relations', op: 'convert', primary: true }],
  *convert(s) {
    s.relations = [];
    const keyOf = name => { const e = s.entities.find(x => x.name === name); if (!e) return []; let k = e.attrs.filter(a => a.key).map(a => `${a.name}`); if (e.weak) for (const r of s.rels.filter(r => r.supporting && r.between.includes(name))) for (const other of r.between.filter(o => o !== name)) k = k.concat(keyOf(other).map(a => a.includes('.') ? a : `${other}.${a}`)); const sup = s.isa.find(i => i.sub === name); if (sup && !k.length) k = keyOf(sup.super); return k; };
    for (const e of s.entities) {
      if (s.isa.some(i => i.sub === e.name)) continue;
      let attrs = e.attrs.map(a => a.name);
      if (e.weak) { const supp = s.rels.filter(r => r.supporting && r.between.includes(e.name)); for (const r of supp) for (const other of r.between.filter(o => o !== e.name)) attrs = attrs.concat(keyOf(other).map(a => `${other}.${a}`)); }
      s.relations.push({ name: e.name, attrs, keys: keyOf(e.name), from: e.name }); s.hl = { entity: e.name };
      yield { d: `entity set ${e.name} → relation ${e.name}(${attrs.join(', ')})${e.weak ? ` — weak: its key includes the key${s.rels.filter(r => r.supporting && r.between.includes(e.name)).length > 1 ? 's' : ''} of the supporting entity set${s.rels.filter(r => r.supporting && r.between.includes(e.name)).length > 1 ? 's' : ''}` : ''}; key ${keyOf(e.name).join(', ') || '(none given)'}`, hl: {} };
    }
    for (const i of s.isa) {
      const e = s.entities.find(x => x.name === i.sub); if (!e) continue;
      const attrs = keyOf(i.super).concat(e.attrs.map(a => a.name));
      s.relations.push({ name: e.name, attrs, keys: keyOf(i.super), from: e.name }); s.hl = { entity: e.name };
      yield { d: `${i.sub} isa ${i.super} (E/R style): relation ${i.sub}(${attrs.join(', ')}) — the key of ${i.super} plus the subclass's own attributes; an object of the subclass has a tuple in both relations`, hl: {} };
    }
    for (const r of s.rels) {
      if (r.supporting) { s.hl = { rel: r.name }; yield { d: `${r.name} is the supporting relationship of a weak entity set: its attributes are already in that relation, so no relation is needed for it`, hl: {} }; continue; }
      const attrs = []; const keyAttrs = [];
      const arrowAt = (en, role) => r.arrow.includes(en) || (role !== undefined && r.arrow.includes(role));
      r.between.forEach((en, idx) => { const role = r.roles[idx]; for (const k of keyOf(en)) { const nm = `${role || en}.${k.includes('.') ? k.split('.').pop() : k}`; attrs.push(nm); if (!arrowAt(en, role) || r.arrow.length >= r.between.length) keyAttrs.push(nm); } });
      for (const a of r.attrs) attrs.push(a);
      const manyOne = r.arrow.length && r.arrow.length < r.between.length;
      s.relations.push({ name: r.name, attrs, keys: keyAttrs, from: r.name }); s.hl = { rel: r.name };
      yield { d: `relationship ${r.name} → relation ${r.name}(${attrs.join(', ')}): the keys of the connected entity sets${r.attrs.length ? ' plus its own attributes' : ''}${manyOne ? `; many-one toward ${r.arrow.join(', ')}, so the key is only ${keyAttrs.join(', ')} (and the relation could be merged into ${r.between.filter(e => !r.arrow.includes(e)).join('/')})` : `; key: all the key attributes ${keyAttrs.join(', ')}`}`, hl: {} };
    }
    s.hl = null;
    yield { d: `relational schema: ${s.relations.map(r => `${r.name}(${r.attrs.join(', ')})`).join('; ')}`, hl: {} };
  },
  render(s) {
    const W = 640, H = Math.max(300, 140 + 90 * Math.ceil(s.entities.length / 3));
    const pos = {};
    const cols = Math.min(3, Math.max(1, s.entities.length));
    s.entities.forEach((e, i) => { pos[e.name] = s.layout && s.layout[e.name] ? [s.layout[e.name][0] / 100 * W, s.layout[e.name][1] / 100 * H] : [W * ((i % cols) + 0.5) / cols, 90 + Math.floor(i / cols) * 150]; });
    let svg = `<svg class="db-er" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg"><defs><marker id="db-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto"><path d="M0 0L10 5L0 10z" fill="#1e293b"/></marker><marker id="db-rd" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" orient="auto"><path d="M0 0Q10 5 0 10" fill="none" stroke="#1e293b" stroke-width="1.5"/></marker></defs>`;
    // relationships (diamonds between the entities)
    for (const r of s.rels) {
      const pts = r.between.map(n => pos[n]).filter(Boolean); if (!pts.length) continue;
      const cx = pts.reduce((a, p) => a + p[0], 0) / pts.length, cy = pts.reduce((a, p) => a + p[1], 0) / pts.length;
      const hl = s.hl && s.hl.rel === r.name;
      r.between.forEach((n, idx) => { const [x, y] = pos[n]; const arrow = r.arrow.includes(n) || (r.roles[idx] !== undefined && r.arrow.includes(r.roles[idx])); const rounded = r.rounded.includes(n); svg += `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="${hl ? '#dc2626' : '#1e293b'}" stroke-width="${r.supporting ? 3 : 1.5}" ${arrow ? 'marker-end="url(#db-ah)"' : rounded ? 'marker-end="url(#db-rd)"' : ''}/>`; if (r.roles[idx]) svg += `<text x="${(cx + x) / 2}" y="${(cy + y) / 2 - 5}" class="db-er-role">${esc(r.roles[idx])}</text>`; });
      svg += `<polygon points="${cx},${cy - 22} ${cx + 48},${cy} ${cx},${cy + 22} ${cx - 48},${cy}" fill="${hl ? '#fee2e2' : '#fff'}" stroke="${hl ? '#dc2626' : '#1e293b'}" stroke-width="${r.supporting ? 3 : 1.5}"/><text x="${cx}" y="${cy + 4}" class="db-er-name">${esc(r.name)}</text>`;
      r.attrs.forEach((a, k) => { const ax = cx + 60 + k * 10, ay = cy + 42 + k * 24; svg += `<line x1="${cx}" y1="${cy + 18}" x2="${ax}" y2="${ay}" stroke="#94a3b8"/><ellipse cx="${ax}" cy="${ay}" rx="${Math.max(24, a.length * 4)}" ry="11" fill="#fff" stroke="#94a3b8"/><text x="${ax}" y="${ay + 4}" class="db-er-attr">${esc(a)}</text>`; });
    }
    for (const i of s.isa) { const a = pos[i.sub], b = pos[i.super]; if (!a || !b) continue; const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2; svg += `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="#1e293b" stroke-width="1.5"/><polygon points="${mx},${my - 14} ${mx + 20},${my + 10} ${mx - 20},${my + 10}" fill="#fff" stroke="#1e293b"/><text x="${mx}" y="${my + 6}" class="db-er-attr">isa</text>`; }
    for (const e of s.entities) {
      const [x, y] = pos[e.name]; const hl = s.hl && s.hl.entity === e.name;
      svg += `<rect x="${x - 46}" y="${y - 16}" width="92" height="32" fill="${hl ? '#dcfce7' : '#fff'}" stroke="${hl ? '#16a34a' : '#1e293b'}" stroke-width="1.6"/>${e.weak ? `<rect x="${x - 42}" y="${y - 12}" width="84" height="24" fill="none" stroke="#1e293b" stroke-width="1.2"/>` : ''}<text x="${x}" y="${y + 5}" class="db-er-name">${esc(e.name)}</text>`;
      const n = e.attrs.length;
      e.attrs.forEach((a, k) => { const ang = Math.PI * (0.8 + 1.4 * (k + 0.5) / Math.max(n, 1)); const ax = x + 78 * Math.cos(ang), ay = y - 48 * Math.sin(ang) - 6; svg += `<line x1="${x}" y1="${y - 10}" x2="${ax}" y2="${ay}" stroke="#94a3b8"/><ellipse cx="${ax}" cy="${ay}" rx="${Math.max(22, a.name.length * 4)}" ry="10" fill="#fff" stroke="#94a3b8"/><text x="${ax}" y="${ay + 4}" class="db-er-attr ${a.key ? 'key' : ''}">${esc(a.name)}</text>`; });
    }
    svg += '</svg>';
    const rels = s.relations.length ? `<div class="db-rels">${s.relations.map(r => `<span class="db-rel ${s.hl && (s.hl.entity === r.from || s.hl.rel === r.from) ? 'hl' : ''}">${esc(r.name)}(${r.attrs.map(a => r.keys.includes(a) ? `<u>${esc(a)}</u>` : esc(a)).join(', ')})</span>`).join(' ')}</div>` : '';
    return { html: svg + rels };
  },
};

/* ═══════════════════════ shell ═══════════════════════ */
class Viewer {
  constructor(id, cfg) {
    this.id = id; this.cfg = cfg; this.mode = MODES[cfg.mode];
    if (!this.mode) throw new Error('unknown db mode ' + cfg.mode);
    this.el = typeof document !== 'undefined' ? document.getElementById('sim-' + id) : null;
    this.values = {};
    for (const c of this.mode.controls) if (c.kind !== 'button') this.values[c.name] = c.default === undefined ? '' : c.default;
    this.busy = false; this.ready = this.reset();
  }
  scripted() {
    const ops = Array.isArray(this.cfg.ops) ? this.cfg.ops : [];
    return ops.map(o => { if (typeof o === 'string') { const [name, ...rest] = o.trim().split(/\s+/); return { name, args: [rest.join(' ')] }; } return { name: o.op || o.name, args: o.args || [] }; });
  }
  scriptText() { const ops = this.scripted(); return ops.length ? 'step through the scripted operations, then use the controls' : 'use the controls'; }
  async reset() {
    this.state = this.mode.init(this.cfg);
    // the editable text of the main control starts as the block's text
    for (const c of this.mode.controls) if (c.kind === 'sqltext') this.values[c.name] = this.state.query !== undefined ? this.state.query : this.state.expr !== undefined ? this.state.expr : this.state.program !== undefined ? this.state.program : '';
    this.steps = [{ d: this.cfg.intro || `${this.mode.title}: ${this.scriptText()}`, hl: {}, state: clone(this.state) }];
    this.i = 0;
    const auto = this.scripted().length ? this.scripted() : (this.mode.autorun !== false && this.mode.controls.some(c => c.kind === 'sqltext') ? [{ name: this.mode.controls.find(c => c.primary).op, args: [] }] : []);
    for (const op of auto) await this.run(op.name, op.args, true);
    this.i = this.steps.length > 1 ? 1 : 0;
    if (this.el) this.render();
  }
  async run(name, args, quiet) {
    const op = this.mode[name];
    if (!op) { this.steps.push({ d: `unknown operation ${name}`, hl: { err: true }, state: clone(this.state) }); return; }
    const before = this.steps.length;
    this.busy = true; if (!quiet && this.el) this.render();
    try {
      const it = op.call(this.mode, this.state, args || []);
      for (;;) { const r = await it.next(); if (r.done) break; const st = r.value; this.steps.push({ d: st.d, hl: Object.assign({}, st.hl || {}, st.err ? { err: true } : {}), html: st.html, state: clone(this.state) }); }
    } catch (e) { this.steps.push({ d: 'internal error: ' + (e && e.message), hl: { err: true }, state: clone(this.state) }); if (typeof console !== 'undefined') console.warn('db.js', e); }
    this.busy = false;
    if (!quiet) { this.i = Math.min(before, this.steps.length - 1); this.render(); }
  }
  goto(k) { this.i = Math.max(0, Math.min(this.steps.length - 1, k)); this.render(); }
  render() {
    const el = this.el; if (!el) return;
    const step = this.steps[this.i];
    const r = this.mode.render(step.state, step);
    const ctrls = this.mode.controls.map(c => {
      if (c.kind === 'button') return `<button class="btn fa-btn ${c.primary ? 'db-primary' : 'fa-secondary'} db-op" data-op="${esc(c.op)}" data-args="${esc((c.args || []).join(','))}" ${this.busy ? 'disabled' : ''}>${esc(c.label)}</button>`;
      if (c.kind === 'sqltext') return `<label class="db-field wide">${esc(c.label)}<textarea class="db-text" data-name="${esc(c.name)}" rows="${c.rows || Math.max(2, Math.min(8, String(this.values[c.name]).split('\n').length + 1))}" spellcheck="false">${esc(this.values[c.name])}</textarea></label>`;
      return `<label class="db-field">${esc(c.label)} <input class="db-input" data-name="${esc(c.name)}" type="text" value="${esc(this.values[c.name])}" size="12"></label>`;
    }).join('');
    const last = this.i === this.steps.length - 1;
    el.innerHTML = `<div class="db-wrap">
      <div class="db-toolbar">${ctrls}<button class="btn fa-btn fa-secondary" data-act="reset" title="back to the initial state">⟲ Reset</button></div>
      <div class="db-playback">
        <button class="btn fa-btn fa-secondary" data-act="first" ${this.i === 0 ? 'disabled' : ''}>|◀</button>
        <button class="btn fa-btn fa-secondary" data-act="back" ${this.i === 0 ? 'disabled' : ''}>◀ Back</button>
        <button class="btn fa-btn db-step" data-act="step" ${last ? 'disabled' : ''}>Step ▶</button>
        <button class="btn fa-btn fa-secondary" data-act="last" ${last ? 'disabled' : ''}>▶|</button>
        <span class="db-counter">${this.busy ? 'running…' : `step ${this.i} of ${this.steps.length - 1}`}</span>
      </div>
      <div class="db-desc ${step.hl && step.hl.err ? 'err' : ''}">${esc(step.d)}</div>
      <div class="db-main">${r.html || ''}</div>${r.tablesHtml ? `<div class="db-aside"><div class="db-label">tables</div>${r.tablesHtml}</div>` : ''}
    </div>`;
    el.querySelectorAll('[data-act]').forEach(b => b.addEventListener('click', () => { const a = b.dataset.act; if (a === 'reset') this.reset(); else if (a === 'first') this.goto(0); else if (a === 'back') this.goto(this.i - 1); else if (a === 'step') this.goto(this.i + 1); else this.goto(Infinity); }));
    el.querySelectorAll('[data-name]').forEach(inp => { const h = () => { this.values[inp.dataset.name] = inp.value; }; inp.addEventListener('input', h); inp.addEventListener('change', h); if (inp.tagName === 'TEXTAREA') inp.addEventListener('keydown', ev => { if ((ev.metaKey || ev.ctrlKey) && ev.key === 'Enter') { ev.preventDefault(); const p = this.mode.controls.find(c => c.primary); if (p) this.run(p.op, (p.args || []).map(n => this.values[n])); } }); });
    el.querySelectorAll('.db-op').forEach(b => b.addEventListener('click', () => { const names = b.dataset.args ? b.dataset.args.split(',').filter(Boolean) : []; this.run(b.dataset.op, names.map(n => this.values[n])); }));
  }
}
const UIS = {};
DB.mount = function (id, cfg) { const v = new Viewer(id, cfg || {}); UIS[id] = v; return v; };
DB.ui = id => UIS[id];
DB.modes = () => Object.keys(MODES);
// DOM-free driver: DB.model(cfg) → { ready, state, steps, run(name, args) → new steps, render(k) }
DB.model = function (cfg) {
  const v = new Viewer('test', cfg);
  return { ready: v.ready, get state() { return v.state; }, get steps() { return v.steps; }, async run(name, args) { await v.ready; const before = v.steps.length; await v.run(name, args, true); return v.steps.slice(before); }, render(k) { const st = v.steps[k === undefined ? v.steps.length - 1 : k]; return v.mode.render(st.state, st); } };
};
DB.parseTables = parseTables; DB.raParse = raParse; DB.closure = closure; DB.candidateKeys = candidateKeys; DB.canonicalCover = canonicalCover; DB.parseFds = parseFds; DB.parseDatalog = parseDatalog;
if (typeof window !== 'undefined') window.DB = DB;
export default DB;
