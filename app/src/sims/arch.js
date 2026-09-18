/* ── Computer-architecture engine (COMP 228) ─────────────────────────────────────
   ARCH.mount(id, cfg) builds a stepper inside #sim-<id>; cfg = { mode, … } (see MODES).
   Models are DOM-free: `init(cfg)` returns a JSON state and each operation is a generator over
   (state, args) that mutates the state and yields a step { d: description, hl? }. The shell
   records every step, replays them with ◀ Back / Step ▶ and renders a snapshot as HTML (tables,
   register panes) or SVG (gate diagrams, timing diagrams, the bus datapath). A block either lists
   scripted `ops` or, when it has none, the mode's `auto` operation runs from the block's own keys
   (the keys share the names of the toolbar controls, so the reader can change them and run again).
   Modes by unit: convert signed add multiply divide (bases and integer arithmetic) · float
   float-add text (IEEE 754 and text) · parity hamming gray (error codes) · truth-table circuit
   decoder mux adder alu timing (digital logic) · rtn cpu x86 (bus datapath, a 6502-style CPU,
   x86-64 Linux) · endian memory-chips cache io (memory and I/O).
   ARCH.model(cfg) drives a mode without a DOM (app/scripts/test-arch.mjs). */
(function () {
  'use strict';
  const ARCH = {};
  const clone = s => JSON.parse(JSON.stringify(s, (k, v) => typeof v === 'bigint' ? { $big: v.toString() } : v), (k, v) => v && typeof v === 'object' && '$big' in v ? BigInt(v.$big) : v);
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const num = (x, d) => { const v = Number(x); return Number.isFinite(v) ? v : d; };
  const C = { ink: '#1e293b', muted: '#64748b', line: '#94a3b8', hi: '#dc2626', hiBg: '#fee2e2', ok: '#16a34a', okBg: '#dcfce7', warn: '#d97706', warnBg: '#fef3c7', blue: '#2563eb', blueBg: '#dbeafe', cell: '#fff', cellBg: '#f8fafc', purple: '#7c3aed', purpleBg: '#ede9fe' };

  /* ═══════════════════════ number helpers ═══════════════════════ */
  const DIG = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const SUB = { 0: '₀', 1: '₁', 2: '₂', 3: '₃', 4: '₄', 5: '₅', 6: '₆', 7: '₇', 8: '₈', 9: '₉' };
  const SUP = { 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹', '-': '⁻' };
  const sub = n => String(n).replace(/\d/g, d => SUB[d]);
  const sup = n => String(n).replace(/[\d-]/g, d => SUP[d]);
  const based = (s, b) => s + sub(b);
  const pow2 = w => Math.pow(2, w);
  // non-negative integer → digits in base b (b ≤ 36)
  const toBase = (n, b) => n.toString(b).toUpperCase();
  // fixed-width unsigned bit string (w ≤ 52)
  const bits = (n, w) => { const m = pow2(w); const v = ((n % m) + m) % m; return v.toString(2).padStart(w, '0'); };
  const grp = (s, k) => { let out = ''; for (let i = 0; i < s.length; i++) { if (i && (s.length - i) % k === 0) out += ' '; out += s[i]; } return out; };  // group from the right
  const grpL = (s, k) => s.replace(new RegExp(`(.{${k}})(?=.)`, 'g'), '$1 ');   // group from the left (fractions)
  const parseInt2 = s => parseInt(s, 2);
  // a literal in any of the forms the blocks use: 13, -45, 0b1101, %1101, 0x1E, $1E, '0101' (string of bits when b is 2)
  function lit(x) {
    if (typeof x === 'number') return x;
    const s = String(x).trim();
    let m;
    if ((m = /^(-?)(?:0b|%)([01]+)$/i.exec(s))) return (m[1] ? -1 : 1) * parseInt(m[2], 2);
    if ((m = /^(-?)(?:0x|\$)([0-9a-f]+)$/i.exec(s))) return (m[1] ? -1 : 1) * parseInt(m[2], 16);
    if (/^-?\d+$/.test(s)) return parseInt(s, 10);
    const v = Number(s); return Number.isFinite(v) ? v : NaN;
  }
  // parse "443.13" in base b → { neg, ip (integer part), fp (fraction, 0 ≤ fp < 1), id, fd (digit strings) } or null
  function parseIn(str, b) {
    let s = String(str).trim().toUpperCase(), neg = false;
    if (s[0] === '-') { neg = true; s = s.slice(1); } else if (s[0] === '+') s = s.slice(1);
    const [id, fd = ''] = s.split('.');
    if (!id && !fd) return null;
    for (const ch of id + fd) { const d = DIG.indexOf(ch); if (d < 0 || d >= b) return null; }
    let ip = 0; for (const ch of id) ip = ip * b + DIG.indexOf(ch);
    let fp = 0; for (let i = fd.length - 1; i >= 0; i--) fp = (fp + DIG.indexOf(fd[i])) / b;
    return { neg, ip, fp, id: id || '0', fd };
  }
  // fraction 0 ≤ f < 1 → up to n digits in base b, with the multiplication rows; exact when the last rest is 0
  function fracDigits(f, b, n) {
    const rows = []; let rest = f;
    for (let i = 0; i < n && rest > 1e-15; i++) { const p = rest * b; const d = Math.floor(p + 1e-12); rows.push({ from: rest, prod: p, d, rest: p - d }); rest = p - d; if (rest < 1e-12) rest = 0; }
    return { rows, exact: rest === 0, digits: rows.map(r => DIG[r.d]).join('') };
  }
  const fmtDec = v => { if (v === null || v === undefined) return '?'; if (!Number.isFinite(v)) return v > 0 ? '∞' : v < 0 ? '−∞' : 'NaN'; if (Number.isInteger(v)) return String(v); const s = v.toPrecision(12); return String(parseFloat(s)); };

  /* ═══════════════════════ HTML / SVG helpers ═══════════════════════ */
  const td = (s, cls) => `<td${cls ? ` class="${cls}"` : ''}>${s}</td>`;
  // rows: arrays of cell strings (already escaped/HTML) ; head: array of header strings ; rowCls: fn(i) → class
  function table(head, rows, opts) {
    const o = opts || {};
    let h = `<table class="arch-table${o.cls ? ' ' + o.cls : ''}">`;
    if (head) h += '<thead><tr>' + head.map(x => `<th>${x}</th>`).join('') + '</tr></thead>';
    h += '<tbody>' + rows.map((r, i) => `<tr${o.rowCls && o.rowCls(i) ? ` class="${o.rowCls(i)}"` : ''}>` + r.map(c => typeof c === 'object' && c !== null ? td(c.v, c.cls) : td(c)).join('') + '</tr>').join('') + '</tbody></table>';
    return h;
  }
  const mono = s => `<code class="arch-mono">${esc(s)}</code>`;
  const tag = (s, tone) => `<span class="arch-tag arch-${tone || 'muted'}">${s}</span>`;
  const bitsHtml = (s, tones) => `<span class="arch-bits">${[...s].map((ch, i) => `<b class="${tones && tones[i] ? 'arch-' + tones[i] : ''}">${esc(ch)}</b>`).join('')}</span>`;
  const svgOpen = (w, h, extra) => `<svg class="arch-svg" viewBox="0 0 ${w} ${h}" ${extra || ''} xmlns="http://www.w3.org/2000/svg">`;
  const rect = (x, y, w, h, fill, stroke, r, extra) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r === undefined ? 4 : r}" fill="${fill}" stroke="${stroke || C.line}" stroke-width="1.4" ${extra || ''}/>`;
  const text = (x, y, s, cls, extra) => `<text x="${x}" y="${y}" class="arch-t ${cls || ''}" ${extra || ''}>${esc(s)}</text>`;
  const line = (x1, y1, x2, y2, stroke, w, extra) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke || C.line}" stroke-width="${w || 1.5}" ${extra || ''}/>`;
  const poly = (pts, stroke, w, fill) => `<polyline points="${pts.map(p => p.join(',')).join(' ')}" fill="${fill || 'none'}" stroke="${stroke || C.line}" stroke-width="${w || 1.5}" stroke-linejoin="round"/>`;
  const arrow = (x1, y1, x2, y2, stroke, w, id) => { const st = stroke || C.ink; return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${st}" stroke-width="${w || 1.6}" marker-end="url(#${id || 'arch-ah'})"/>`; };
  const circle = (x, y, r, fill, stroke, w) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${stroke || C.ink}" stroke-width="${w || 1.5}"/>`;
  const defs = () => `<defs>
    <marker id="arch-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="${C.ink}"/></marker>
    <marker id="arch-ah-hi" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="${C.hi}"/></marker>
    <marker id="arch-ah-blue" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="${C.blue}"/></marker>
    <marker id="arch-ah-ok" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="${C.ok}"/></marker>
  </defs>`;
  const toneFill = t => t === 'hi' ? [C.hiBg, C.hi] : t === 'ok' ? [C.okBg, C.ok] : t === 'blue' ? [C.blueBg, C.blue] : t === 'warn' ? [C.warnBg, C.warn] : t === 'purple' ? [C.purpleBg, C.purple] : t === 'muted' ? ['#f1f5f9', '#cbd5e1'] : [C.cell, C.line];

  const MODES = {};
  const fail = d => ({ d, hl: { err: true } });

  /* ═══════════════════════ NUMBERS ═══════════════════════ */
  MODES.convert = {
    title: 'Base conversion',
    init() { return { value: '', from: 10, to: 2, expansion: null, toBits: null, groups: null, intRows: [], fracRows: [], fracExact: true, result: '', phase: 'idle' }; },
    controls: [{ kind: 'text', name: 'value', label: 'value', default: '13.75' }, { kind: 'number', name: 'from', label: 'from base', default: 10 }, { kind: 'number', name: 'to', label: 'to base', default: 2 }, { kind: 'button', label: 'convert', op: 'convert', args: ['value', 'from', 'to'] }],
    auto: { op: 'convert', args: ['value', 'from', 'to'] },
    ops: {
      *convert(s, [value, from, to], cfg) {
        const b1 = num(from, 10), b2 = num(to, 2), maxFrac = num(cfg.digits, 12), fast = !!cfg.fast;
        Object.assign(s, { value: String(value), from: b1, to: b2, expansion: null, toBits: null, groups: null, intRows: [], fracRows: [], fracExact: true, result: '' });
        if (b1 < 2 || b1 > 36 || b2 < 2 || b2 > 36) { yield fail('bases must be between 2 and 36'); return; }
        const p = parseIn(value, b1);
        if (!p) { yield fail(`${value} is not a base-${b1} numeral`); return; }
        const sign = p.neg ? '-' : '';
        const isPow2 = b => (b & (b - 1)) === 0;
        if (fast && isPow2(b1) && isPow2(b2)) {
          // digit-by-digit through binary
          const k1 = Math.log2(b1), k2 = Math.log2(b2);
          const ib = [...p.id].map(ch => bits(DIG.indexOf(ch), k1)), fb = [...p.fd].map(ch => bits(DIG.indexOf(ch), k1));
          s.toBits = { ib, fb, k1 };
          s.phase = 'toBits';
          yield { d: `each base-${b1} digit is ${k1} bit${k1 > 1 ? 's' : ''}: ${[...p.id].map((ch, i) => `${ch} → ${ib[i]}`).join(', ')}${p.fd ? '; after the point ' + [...p.fd].map((ch, i) => `${ch} → ${fb[i]}`).join(', ') : ''}` };
          let ibin = ib.join('').replace(/^0+(?=\d)/, ''), fbin = fb.join('').replace(/0+$/, '');
          const padI = ibin.padStart(Math.ceil(ibin.length / k2) * k2, '0'), padF = fbin.padEnd(Math.ceil(fbin.length / k2) * k2, '0');
          const gi = padI.match(new RegExp(`.{${k2}}`, 'g')) || ['0'.repeat(k2)], gf = fbin ? padF.match(new RegExp(`.{${k2}}`, 'g')) : [];
          s.groups = { gi, gf, k2 };
          s.phase = 'groups';
          const di = gi.map(g => DIG[parseInt2(g)]).join(''), df = gf.map(g => DIG[parseInt2(g)]).join('');
          s.result = sign + di + (df ? '.' + df : '');
          s.phase = 'done';
          yield { d: `regroup the bits ${k2} at a time from the point outward (pad with zeros): ${gi.join(' ')}${gf.length ? ' . ' + gf.join(' ') : ''} → ${based(s.result, b2)}` };
          return;
        }
        // to decimal by positional expansion (also the first leg of any other conversion)
        const dec = p.ip + p.fp;
        if (b1 !== 10) {
          const terms = [...p.id].map((ch, i) => ({ ch, e: p.id.length - 1 - i })).concat([...p.fd].map((ch, i) => ({ ch, e: -(i + 1) })));
          s.expansion = { terms: terms.map(t => `${t.ch}×${b1}${sup(t.e)}`), values: terms.map(t => fmtDec(DIG.indexOf(t.ch) * Math.pow(b1, t.e))), dec: fmtDec(dec) };
          s.phase = 'expansion';
          yield { d: `expand by place value: ${based(sign + p.id + (p.fd ? '.' + p.fd : ''), b1)} = ${s.expansion.terms.join(' + ')} = ${s.expansion.values.join(' + ')} = ${based(sign + fmtDec(dec), 10)}` };
          if (b2 === 10) { s.result = sign + fmtDec(dec); s.phase = 'done'; yield { d: `result: ${based(sign + p.id + (p.fd ? '.' + p.fd : ''), b1)} = ${based(s.result, 10)}` }; return; }
        }
        // integer part by repeated division
        let n = p.ip;
        s.phase = 'int';
        if (n === 0) { s.intRows.push({ n: 0, q: 0, r: 0 }); yield { d: `integer part 0 is just the digit 0` }; }
        while (n > 0) { const q = Math.floor(n / b2), r = n % b2; s.intRows.push({ n, q, r }); n = q; yield { d: `${s.intRows[s.intRows.length - 1].n} ÷ ${b2} = ${q} remainder ${r} → digit ${DIG[r]}${q === 0 ? ' (quotient 0: stop)' : ''}` }; }
        const idig = s.intRows.map(r => DIG[r.r]).reverse().join('');
        yield { d: `read the remainders from the last to the first: integer part ${based(p.id, b1)} = ${based(idig, b2)}` };
        // fraction by repeated multiplication
        let fdig = '';
        if (p.fp > 0) {
          s.phase = 'frac';
          const f = fracDigits(p.fp, b2, maxFrac);
          for (const r of f.rows) { s.fracRows.push(r); yield { d: `${fmtDec(r.from)} × ${b2} = ${fmtDec(r.prod)} → digit ${DIG[r.d]}, keep ${fmtDec(r.rest)}${r.rest === 0 ? ' (0: stop)' : ''}` }; }
          s.fracExact = f.exact; fdig = f.digits;
          yield { d: f.exact ? `read the integer parts from the first to the last: fraction .${p.fd} = .${fdig} in base ${b2}` : `the fraction does not terminate in base ${b2}: truncated after ${maxFrac} digits (.${p.fd} ≈ .${fdig})` };
        }
        s.result = sign + idig + (fdig ? '.' + fdig : '');
        s.phase = 'done';
        yield { d: `result: ${based(sign + p.id + (p.fd ? '.' + p.fd : ''), b1)} = ${based(s.result, b2)}${!s.fracExact ? ' (truncated)' : ''}` };
      }
    },
    render(s) {
      if (s.phase === 'idle') return '<div class="arch-empty">enter a numeral and its base</div>';
      let h = '';
      if (s.expansion) h += `<div class="arch-line">${esc(s.expansion.terms.join(' + '))} = ${esc(s.expansion.values.join(' + '))} = <b>${esc(s.expansion.dec)}</b></div>`;
      if (s.toBits) h += `<div class="arch-line">${s.toBits.ib.map(b => tag(b, 'blue')).join(' ')}${s.toBits.fb.length ? ' . ' + s.toBits.fb.map(b => tag(b, 'blue')).join(' ') : ''}</div>`;
      if (s.groups) h += `<div class="arch-line">${s.groups.gi.map(g => tag(g + ' → ' + DIG[parseInt2(g)], 'ok')).join(' ')}${s.groups.gf.length ? ' . ' + s.groups.gf.map(g => tag(g + ' → ' + DIG[parseInt2(g)], 'ok')).join(' ') : ''}</div>`;
      if (s.intRows.length) h += `<div class="arch-cols">` + table(['÷ ' + s.to, 'quotient', 'remainder', 'digit'], s.intRows.map(r => [r.n, r.q, r.r, { v: DIG[r.r], cls: 'k' }]), { rowCls: i => s.phase === 'int' && i === s.intRows.length - 1 ? 'hl' : '' });
      if (s.fracRows.length) h += table(['× ' + s.to, 'product', 'digit', 'keep'], s.fracRows.map(r => [fmtDec(r.from), fmtDec(r.prod), { v: DIG[r.d], cls: 'k' }, fmtDec(r.rest)]), { rowCls: i => s.phase === 'frac' && i === s.fracRows.length - 1 ? 'hl' : '' });
      if (s.intRows.length) h += '</div>';
      if (s.phase === 'done') h += `<div class="arch-result">${esc(based(s.value, s.from))} = <b>${esc(based(s.result, s.to))}</b>${!s.fracExact ? ' (truncated)' : ''}</div>`;
      return h;
    }
  };

  MODES.signed = {
    title: 'Signed representations',
    init() { return { v: null, w: 8, rows: [], ext: null, phase: 'idle' }; },
    controls: [{ kind: 'number', name: 'value', label: 'value', default: -45 }, { kind: 'number', name: 'bits', label: 'bits', default: 8 }, { kind: 'button', label: 'represent', op: 'represent', args: ['value', 'bits'] }],
    auto: { op: 'represent', args: ['value', 'bits'] },
    ops: {
      *represent(s, [value, w0], cfg) {
        const v = lit(value), w = num(w0, 8);
        s.rows = []; s.ext = null; s.v = v; s.w = w; s.phase = 'run';
        if (!Number.isInteger(v)) { yield fail(`${value} is not an integer`); return; }
        if (w < 2 || w > 32) { yield fail('bits must be between 2 and 32'); return; }
        const mag = Math.abs(v), half = pow2(w - 1);
        if (mag >= half && !(v === -half)) { yield fail(`|${v}| needs more than ${w - 1} magnitude bits`); return; }
        const magBits = bits(mag, w - 1);
        const push = (name, b, range, note, tone) => { s.rows.push({ name, b, range, note, tone }); s.cur = s.rows.length - 1; };
        yield { d: `|${v}| = ${mag} = ${based(magBits, 2)} on ${w - 1} bits; the remaining bit says how the sign is stored` };
        if (v === -half) push('sign-magnitude', '—', `−${half - 1} … +${half - 1}`, 'out of range', 'muted');
        else push('sign-magnitude', (v < 0 ? '1' : '0') + magBits, `−${half - 1} … +${half - 1}`, v < 0 ? 'sign bit 1, then the magnitude' : 'sign bit 0, then the magnitude', 'blue');
        yield { d: `sign-magnitude: ${s.rows[0].b === '—' ? 'the most negative value does not fit — ' + `−${half}` + ' has no sign-magnitude form' : `sign bit ${v < 0 ? 1 : 0} followed by the magnitude → ${s.rows[0].b}`}; two zeros (${'0'.repeat(w)} and 1${'0'.repeat(w - 1)})` };
        const pos = bits(mag, w), ones = [...pos].map(c => c === '1' ? '0' : '1').join('');
        if (v === -half) push("one's complement", '—', `−${half - 1} … +${half - 1}`, 'out of range', 'muted');
        else push("one's complement", v < 0 ? ones : pos, `−${half - 1} … +${half - 1}`, v < 0 ? 'flip every bit of +' + mag : 'positive: unchanged', 'blue');
        yield { d: v < 0 ? `one's complement: flip every bit of ${based(pos, 2)} → ${based(ones, 2)} (still two zeros, and a wrap-around carry in addition)` : `one's complement of a non-negative value is the plain binary ${based(pos, 2)}` };
        const twos = v < 0 ? bits(pow2(w) - mag, w) : pos;
        push("two's complement", twos, `−${half} … +${half - 1}`, v < 0 ? `flip, then add 1: ${ones} + 1` : 'positive: unchanged', 'ok');
        yield { d: v < 0 ? `two's complement: ${ones} + 1 = ${based(twos, 2)} — equivalently ${pow2(w)} − ${mag} = ${pow2(w) - mag}; one zero, and addition needs no special case` : `two's complement of a non-negative value is the plain binary ${based(pos, 2)}` };
        const N = cfg.excess !== undefined ? num(cfg.excess, half - 1) : half - 1;
        const ex = v + N;
        if (ex < 0 || ex >= pow2(w)) push(`excess-${N}`, '—', `−${N} … +${pow2(w) - 1 - N}`, 'out of range', 'muted');
        else push(`excess-${N}`, bits(ex, w), `−${N} … +${pow2(w) - 1 - N}`, `${v} + ${N} = ${ex}`, 'purple');
        yield { d: ex < 0 || ex >= pow2(w) ? `excess-${N}: ${v} + ${N} = ${ex} does not fit in ${w} bits` : `excess-${N} (the bias an exponent field of ${w} bits would use): store ${v} + ${N} = ${ex} = ${based(bits(ex, w), 2)}; unsigned order matches signed order` };
        s.ext = { from: twos, to: (v < 0 ? '1' : '0').repeat(w) + twos };
        yield { d: `sign extension to ${2 * w} bits copies the sign bit of the two's-complement form: ${twos} → ${grp(s.ext.to, w)}` };
        s.phase = 'done';
      }
    },
    render(s) {
      if (s.phase === 'idle') return '<div class="arch-empty">enter a value</div>';
      let h = table(['representation', `${s.w} bits`, 'range', 'how'], s.rows.map(r => [r.name, { v: r.b === '—' ? '—' : bitsHtml(r.b, [r.tone].concat(Array(s.w - 1).fill(''))), cls: 'mono' }, r.range, r.note]), { rowCls: i => i === s.cur && s.phase !== 'done' ? 'hl' : '' });
      if (s.ext) h += `<div class="arch-line">sign-extended: ${bitsHtml(s.ext.to, [...s.ext.to].map((_, i) => i < s.w ? 'hi' : ''))}</div>`;
      return h;
    }
  };

  // two's-complement addition/subtraction with the carry chain and the N Z C V flags
  function addBits(a, b, w, cin) {
    const cols = []; let c = cin;
    for (let i = w - 1; i >= 0; i--) { const x = +a[i], y = +b[i]; const t = x + y + c; cols.unshift({ i: w - 1 - i, x, y, cin: c, s: t & 1, cout: t >> 1 }); c = t >> 1; }
    const sum = cols.map(k => k.s).join('');
    const cinMsb = cols[0].cin, coutMsb = cols[0].cout;
    return { cols, sum, C: coutMsb, V: cinMsb ^ coutMsb, N: +sum[0], Z: sum.indexOf('1') < 0 ? 1 : 0 };
  }
  const signedVal = (b) => { const w = b.length, u = parseInt2(b); return b[0] === '1' ? u - pow2(w) : u; };
  MODES.add = {
    title: 'Binary addition and subtraction',
    init() { return { a: '', b: '', w: 4, op: 'add', ab: null, bb: null, bOrig: null, cols: [], done: 0, res: null, phase: 'idle' }; },
    controls: [{ kind: 'text', name: 'a', label: 'A', default: '2' }, { kind: 'text', name: 'b', label: 'B', default: '3' }, { kind: 'number', name: 'bits', label: 'bits', default: 4 }, { kind: 'select', name: 'op', label: 'op', options: ['add', 'sub'], default: 'add' }, { kind: 'button', label: 'compute', op: 'compute', args: ['a', 'b', 'bits', 'op'] }],
    auto: { op: 'compute', args: ['a', 'b', 'bits', 'op'] },
    ops: {
      *compute(s, [a0, b0, w0, op0], cfg) {
        const w = num(w0, 4), op = op0 === 'sub' ? 'sub' : 'add', unsigned = !!cfg.unsigned;
        const a = lit(a0), b = lit(b0);
        Object.assign(s, { a: String(a0), b: String(b0), w, op, cols: [], done: 0, res: null, phase: 'run', unsigned });
        if (!Number.isInteger(a) || !Number.isInteger(b)) { yield fail('operands must be integers'); return; }
        const lo = unsigned ? 0 : -pow2(w - 1), hi = unsigned ? pow2(w) - 1 : pow2(w - 1) - 1;
        if (a < lo || a > hi || b < lo || b > hi) { yield fail(`operands must be in ${lo} … ${hi} for ${w} bits`); return; }
        s.ab = bits(a, w); s.bOrig = bits(b, w);
        yield { d: `A = ${a} → ${based(s.ab, 2)}; B = ${b} → ${based(s.bOrig, 2)} on ${w} bits` };
        let cin = 0;
        if (op === 'sub') { s.bb = [...s.bOrig].map(c => c === '1' ? '0' : '1').join(''); cin = 1; yield { d: `A − B = A + (−B): flip the bits of B → ${s.bb} and add 1 through the carry-in (two's complement without a separate step)` }; }
        else s.bb = s.bOrig;
        const r = addBits(s.ab, s.bb, w, cin);
        for (let k = w - 1; k >= 0; k--) {
          const col = r.cols[k]; s.cols = r.cols; s.done = w - k;
          yield { d: `bit ${col.i}: ${col.x} + ${col.y} + carry ${col.cin} = ${col.x + col.y + col.cin} → sum ${col.s}, carry out ${col.cout}` };
        }
        s.res = r; s.phase = 'done';
        const u = parseInt2(r.sum), sv = signedVal(r.sum);
        const exact = op === 'sub' ? a - b : a + b;
        const flags = `N=${r.N} Z=${r.Z} C=${r.C} V=${r.V}`;
        let verdict;
        if (unsigned) verdict = r.C === (op === 'sub' ? 0 : 1) ? `unsigned result ${u} is wrong (${exact} does not fit): the carry flag signals it` : `unsigned result ${u} is right`;
        else verdict = r.V ? `signed result ${sv} is wrong (${exact} does not fit in ${w} bits): overflow, V=1 — the carry C=${r.C} is irrelevant for signed values` : `signed result ${sv} is right${r.C ? ' even though C=1 — the carry out is not an error for signed values' : ''}`;
        yield { d: `result ${based(r.sum, 2)}: ${flags}; ${verdict}` };
      }
    },
    render(s) {
      if (s.phase === 'idle') return '<div class="arch-empty">enter two operands</div>';
      if (!s.ab) return '';
      const w = s.w, cur = s.phase === 'done' ? -1 : w - s.done;
      const cell = (v, i, cls) => ({ v: v === '' ? '' : String(v), cls: (cls || '') + (i === cur ? ' hl' : '') });
      const carries = [], sums = [];
      for (let i = 0; i < w; i++) { const col = s.cols[i]; const computed = i >= w - s.done; carries.push(cell(computed || (i === w - 1 && s.cols.length) ? (s.cols[i] ? s.cols[i].cin : '') : '', i, 'muted')); sums.push(cell(computed ? col.s : '', i, 'k')); }
      const rows = [
        [{ v: 'carry', cls: 'lbl' }].concat(carries).concat([{ v: '', cls: '' }]),
        [{ v: 'A', cls: 'lbl' }].concat([...s.ab].map((c, i) => cell(c, i))).concat([{ v: esc(String(lit(s.a))), cls: 'muted' }]),
        [{ v: s.op === 'sub' ? '+ (−B)' : '+ B', cls: 'lbl' }].concat([...s.bb].map((c, i) => cell(c, i))).concat([{ v: s.op === 'sub' ? '−' + esc(String(lit(s.b))) : esc(String(lit(s.b))), cls: 'muted' }]),
        [{ v: 'sum', cls: 'lbl' }].concat(sums).concat([{ v: s.res ? (s.unsigned ? parseInt2(s.res.sum) : signedVal(s.res.sum)) : '', cls: 'muted' }])
      ];
      let h = table(null, rows, { cls: 'arch-grid' });
      if (s.res) { const r = s.res; h += `<div class="arch-flags">${['N', 'Z', 'C', 'V'].map(f => tag(f + '=' + r[f], r[f] ? (f === 'V' ? 'hi' : 'blue') : 'muted')).join(' ')} <span class="arch-muted">unsigned ${parseInt2(r.sum)} · signed ${signedVal(r.sum)}</span></div>`; }
      else if (s.op === 'sub') h += `<div class="arch-muted">carry-in 1 supplies the +1 of the two's complement</div>`;
      return h;
    }
  };

  MODES.multiply = {
    title: 'Binary multiplication',
    init() { return { algo: 'shift-add', rows: [], w: 4, a: 0, b: 0, res: null, phase: 'idle', pp: [] }; },
    controls: [{ kind: 'number', name: 'a', label: 'multiplicand', default: 13 }, { kind: 'number', name: 'b', label: 'multiplier', default: 11 }, { kind: 'number', name: 'bits', label: 'bits', default: 4 }, { kind: 'select', name: 'algo', label: 'algorithm', options: ['shift-add', 'booth'], default: 'shift-add' }, { kind: 'button', label: 'multiply', op: 'multiply', args: ['a', 'b', 'bits', 'algo'] }],
    auto: { op: 'multiply', args: ['a', 'b', 'bits', 'algo'] },
    ops: {
      *multiply(s, [a0, b0, w0, algo0]) {
        const a = lit(a0), b = lit(b0), w = num(w0, 4), algo = algo0 === 'booth' ? 'booth' : 'shift-add';
        Object.assign(s, { a, b, w, algo, rows: [], pp: [], res: null, phase: 'run' });
        if (!Number.isInteger(a) || !Number.isInteger(b)) { yield fail('operands must be integers'); return; }
        if (algo === 'shift-add') {
          const neg = (a < 0) !== (b < 0), ma = Math.abs(a), mb = Math.abs(b);
          if (ma >= pow2(w) || mb >= pow2(w)) { yield fail(`magnitudes must fit in ${w} bits`); return; }
          const A = bits(ma, w), B = bits(mb, w);
          s.A = A; s.B = B; s.neg = neg;
          yield { d: `${a} × ${b}: multiply the magnitudes ${based(A, 2)} × ${based(B, 2)}${neg ? ', the signs differ so the product is negative' : ''}` };
          let acc = 0;
          for (let i = 0; i < w; i++) {
            const bit = +B[w - 1 - i];
            const pp = bit ? ma * pow2(i) : 0;
            acc += pp;
            s.pp.push({ i, bit, pp: bits(pp, 2 * w), acc: bits(acc, 2 * w) });
            yield { d: bit ? `multiplier bit ${i} is 1: add the multiplicand shifted left by ${i} (${based(A, 2)} ≪ ${i} = ${bits(pp, 2 * w).replace(/^0+(?=\d)/, '')}); running sum ${acc}` : `multiplier bit ${i} is 0: partial product 0, nothing to add` };
          }
          s.res = { bits: bits(acc, 2 * w), value: neg ? -acc : acc };
          s.phase = 'done';
          yield { d: `product ${based(s.res.bits, 2)} = ${acc}${neg ? ', negated: ' + s.res.value : ''} (${w} bits × ${w} bits needs ${2 * w} bits)` };
        } else {
          const half = pow2(w - 1);
          if (a < -half || a >= half || b < -half || b >= half) { yield fail(`operands must fit in ${w}-bit two's complement (−${half} … ${half - 1})`); return; }
          const M = bits(a, w), negM = bits(-a, w);
          let A = '0'.repeat(w), Q = bits(b, w), q1 = 0;
          s.M = M; s.rows.push({ it: 0, A, Q, q1, act: 'initial: A = 0, Q = multiplier, Q₋₁ = 0' });
          yield { d: `Booth's algorithm on ${w}-bit two's complement: M = ${a} = ${M}, Q = ${b} = ${Q}, Q₋₁ = 0; each step looks at the pair Q₀Q₋₁` };
          const addW = (x, y) => addBits(x, y, w, 0).sum;
          for (let it = 1; it <= w; it++) {
            const q0 = +Q[w - 1]; let act;
            if (q0 === 1 && q1 === 0) { A = addW(A, negM); act = `Q₀Q₋₁ = 10: A ← A − M (${A})`; }
            else if (q0 === 0 && q1 === 1) { A = addW(A, M); act = `Q₀Q₋₁ = 01: A ← A + M (${A})`; }
            else act = `Q₀Q₋₁ = ${q0}${q1}: no add`;
            // arithmetic shift right of A:Q:Q-1
            const joined = A + Q; const shifted = A[0] + joined.slice(0, -1);
            q1 = +Q[w - 1]; A = shifted.slice(0, w); Q = shifted.slice(w);
            s.rows.push({ it, A, Q, q1, act: act + ', then arithmetic shift right' });
            yield { d: `step ${it}: ${act}; shift A:Q:Q₋₁ right one place keeping the sign → A = ${A}, Q = ${Q}, Q₋₁ = ${q1}` };
          }
          const prod = A + Q; s.res = { bits: prod, value: signedVal(prod) };
          s.phase = 'done';
          yield { d: `product A:Q = ${prod} = ${s.res.value} (${a} × ${b}); runs of 1s in the multiplier cost one subtraction and one addition instead of an add per bit` };
        }
      }
    },
    render(s) {
      if (s.phase === 'idle') return '<div class="arch-empty">enter two operands</div>';
      if (s.algo === 'shift-add') {
        if (!s.A) return '';
        const w = s.w;
        const rows = [[{ v: '', cls: 'lbl' }, { v: bitsHtml(s.A.padStart(2 * w, ' ')), cls: 'mono' }, { v: 'multiplicand', cls: 'muted' }], [{ v: '×', cls: 'lbl' }, { v: bitsHtml(s.B.padStart(2 * w, ' ')), cls: 'mono' }, { v: 'multiplier', cls: 'muted' }]];
        s.pp.forEach((p, i) => rows.push([{ v: i === 0 ? '' : '+', cls: 'lbl' }, { v: bitsHtml(p.pp, [...p.pp].map((c, j) => p.bit && j >= 2 * w - w - p.i && j < 2 * w - p.i ? 'blue' : 'muted')), cls: 'mono' + (i === s.pp.length - 1 && s.phase !== 'done' ? ' hl' : '') }, { v: `bit ${p.i} = ${p.bit}`, cls: 'muted' }]));
        if (s.res) rows.push([{ v: '=', cls: 'lbl' }, { v: bitsHtml(s.res.bits, [...s.res.bits].map(() => 'ok')), cls: 'mono' }, { v: `${s.res.value}`, cls: 'muted' }]);
        return table(null, rows, { cls: 'arch-grid' });
      }
      return table(['step', 'A', 'Q', 'Q₋₁', 'action'], s.rows.map(r => [r.it, { v: bitsHtml(r.A), cls: 'mono' }, { v: bitsHtml(r.Q, [...r.Q].map((c, i) => i === r.Q.length - 1 ? 'blue' : '')), cls: 'mono' }, { v: String(r.q1), cls: 'mono' }, r.act]), { rowCls: i => i === s.rows.length - 1 && s.phase !== 'done' ? 'hl' : '' }) + (s.res ? `<div class="arch-result">A:Q = ${bitsHtml(s.res.bits)} = <b>${s.res.value}</b></div>` : '') + `<div class="arch-muted">M = ${esc(s.M)}, −M = ${esc(bits(-s.a, s.w))}</div>`;
    }
  };

  MODES.divide = {
    title: 'Restoring division',
    init() { return { rows: [], w: 4, res: null, phase: 'idle' }; },
    controls: [{ kind: 'number', name: 'a', label: 'dividend', default: 13 }, { kind: 'number', name: 'b', label: 'divisor', default: 3 }, { kind: 'number', name: 'bits', label: 'bits', default: 4 }, { kind: 'button', label: 'divide', op: 'divide', args: ['a', 'b', 'bits'] }],
    auto: { op: 'divide', args: ['a', 'b', 'bits'] },
    ops: {
      *divide(s, [a0, b0, w0]) {
        const a = lit(a0), b = lit(b0), w = num(w0, 4);
        Object.assign(s, { a, b, w, rows: [], res: null, phase: 'run' });
        if (!Number.isInteger(a) || !Number.isInteger(b) || a < 0 || b <= 0) { yield fail('the deck divides positive by positive: signs are handled afterwards'); return; }
        if (a >= pow2(w) || b >= pow2(w)) { yield fail(`operands must fit in ${w} bits`); return; }
        const W = w + 1;   // A has one extra bit for the sign of the trial subtraction
        let A = '0'.repeat(W), Q = bits(a, w); const M = bits(b, W), negM = bits(-b, W);
        s.M = bits(b, w); s.rows.push({ it: 0, A, Q, act: 'initial: A = 0, Q = dividend' });
        yield { d: `restoring division: A = 0 (${W} bits), Q = ${a} = ${Q}, M = ${b} = ${s.M}; each step shifts A:Q left, tries A − M and restores if it went negative` };
        for (let it = 1; it <= w; it++) {
          const joined = (A + Q).slice(1) + '0'; A = joined.slice(0, W); Q = joined.slice(W);
          const trial = addBits(A, negM, W, 0).sum;
          let act;
          if (trial[0] === '1') { act = `shift left; A − M = ${trial} < 0 → restore A, Q₀ = 0`; Q = Q.slice(0, -1) + '0'; }
          else { A = trial; act = `shift left; A − M = ${trial} ≥ 0 → keep it, Q₀ = 1`; Q = Q.slice(0, -1) + '1'; }
          s.rows.push({ it, A, Q, act });
          yield { d: `step ${it}: ${act} → A = ${A}, Q = ${Q}` };
        }
        s.res = { q: parseInt2(Q), r: parseInt2(A) };
        s.phase = 'done';
        yield { d: `quotient Q = ${Q} = ${s.res.q}, remainder A = ${A} = ${s.res.r} (${a} = ${b} × ${s.res.q} + ${s.res.r})` };
      }
    },
    render(s) {
      if (s.phase === 'idle') return '<div class="arch-empty">enter a dividend and a divisor</div>';
      return table(['step', 'A', 'Q', 'action'], s.rows.map(r => [r.it, { v: bitsHtml(r.A, [...r.A].map((c, i) => i === 0 ? 'muted' : '')), cls: 'mono' }, { v: bitsHtml(r.Q), cls: 'mono' }, r.act]), { rowCls: i => i === s.rows.length - 1 && s.phase !== 'done' ? 'hl' : '' }) + `<div class="arch-muted">M = ${esc(s.M)}</div>` + (s.res ? `<div class="arch-result">quotient <b>${s.res.q}</b>, remainder <b>${s.res.r}</b></div>` : '');
    }
  };

  /* ═══════════════════════ FLOATING POINT AND TEXT ═══════════════════════ */
  // encode a decimal value in a sign / e-bit exponent / m-bit mantissa format; returns fields and the trace of steps
  function floatEncode(v, e, m) {
    const bias = pow2(e - 1) - 1, maxE = pow2(e) - 1, trace = [];
    const sign = v < 0 || (v === 0 && 1 / v < 0) ? 1 : 0;
    const out = { sign, e, m, bias, kind: 'normal', trace };
    if (Number.isNaN(v)) { Object.assign(out, { kind: 'nan', E: '1'.repeat(e), M: '1' + '0'.repeat(m - 1) }); trace.push('NaN: exponent all 1s and a non-zero mantissa'); return out; }
    if (!Number.isFinite(v)) { Object.assign(out, { kind: 'inf', E: '1'.repeat(e), M: '0'.repeat(m) }); trace.push(`${sign ? '−' : '+'}∞: exponent all 1s, mantissa all 0s`); return out; }
    const av = Math.abs(v);
    if (av === 0) { Object.assign(out, { kind: 'zero', E: '0'.repeat(e), M: '0'.repeat(m) }); trace.push(`${sign ? '−' : '+'}0: every exponent and mantissa bit 0`); return out; }
    const ip = Math.floor(av), fp = av - ip;
    const ib = ip ? ip.toString(2) : '';
    const need = m + 4 + (ib ? 0 : 200);
    const f = fracDigits(fp, 2, need);
    out.intBits = ib || '0'; out.fracBits = f.digits; out.fracExact = f.exact;
    trace.push(`|${v}| = ${ib || '0'}.${f.digits || '0'}${f.exact ? '' : '…'} in binary`);
    let exp, mantAll;
    if (ib) { exp = ib.length - 1; mantAll = ib.slice(1) + f.digits; }
    else { const k = f.digits.indexOf('1'); if (k < 0) { Object.assign(out, { kind: 'zero', E: '0'.repeat(e), M: '0'.repeat(m) }); return out; } exp = -(k + 1); mantAll = f.digits.slice(k + 1); }
    out.exp = exp; out.norm = `1.${mantAll.slice(0, m + 4)}${mantAll.length > m + 4 || !f.exact ? '…' : ''} × 2${sup(exp)}`;
    trace.push(`normalise: ${out.norm}`);
    let E = exp + bias;
    if (E >= maxE) { Object.assign(out, { kind: 'inf', E: '1'.repeat(e), M: '0'.repeat(m), Eval: E }); trace.push(`exponent ${exp} + bias ${bias} = ${E} ≥ ${maxE}: overflow → ${sign ? '−' : '+'}∞`); return out; }
    let mbits, hidden = '1';
    if (E <= 0) {
      // denormal: exponent field 0, value = 0.M × 2^(1-bias)
      const shift = 1 - E; mbits = ('1' + mantAll).padEnd(shift + m + 2, '0'); mbits = '0'.repeat(shift - 1) + mbits; hidden = '0';
      trace.push(`exponent ${exp} + bias ${bias} = ${E} ≤ 0: too small to normalise — denormal, hidden bit 0, mantissa shifted right by ${shift}`);
      out.kind = 'denormal'; E = 0;
    } else { mbits = mantAll.padEnd(m + 2, '0'); trace.push(`biased exponent ${exp} + ${bias} = ${E} = ${bits(E, e)}`); }
    // round to nearest, ties to even
    let M = mbits.slice(0, m); const rest = mbits.slice(m);
    const roundUp = rest[0] === '1' && (rest.slice(1).indexOf('1') >= 0 || !f.exact || M[m - 1] === '1');
    out.rounded = false;
    if (rest.indexOf('1') >= 0 || !f.exact) { out.rounded = true; if (roundUp) { const inc = addBits('0' + M, '0'.repeat(m) + '1', m + 1, 0).sum; if (inc[0] === '1') { E += 1; M = '0'.repeat(m); } else M = inc.slice(1); trace.push(`mantissa ${mbits.slice(0, m)}|${rest.slice(0, 3)}… rounds up to ${M}`); } else trace.push(`mantissa ${mbits.slice(0, m)}|${rest.slice(0, 3)}… rounds down (truncated)`); }
    else trace.push(`mantissa: drop the hidden 1, keep ${m} bits → ${M}${mantAll.length < m ? ' (padded with zeros)' : ''}`);
    out.E = bits(E, e); out.M = M; out.Eval = E; out.hidden = hidden;
    return out;
  }
  function floatDecode(sb, E, M) {
    const e = E.length, m = M.length, bias = pow2(e - 1) - 1, Ev = parseInt2(E), sign = +sb;
    const allOnes = E.indexOf('0') < 0, allZero = E.indexOf('1') < 0, mZero = M.indexOf('1') < 0;
    if (allOnes) return mZero ? { kind: 'inf', value: sign ? -Infinity : Infinity, sign } : { kind: 'nan', value: NaN, sign };
    let frac = 0; for (let i = 0; i < m; i++) if (M[i] === '1') frac += pow2(-(i + 1));
    if (allZero) { const value = (sign ? -1 : 1) * frac * pow2(1 - bias); return { kind: mZero ? 'zero' : 'denormal', value, sign, exp: 1 - bias, sig: frac, formula: `${sign ? '−' : ''}0.${M} × 2${sup(1 - bias)}` }; }
    const value = (sign ? -1 : 1) * (1 + frac) * pow2(Ev - bias);
    return { kind: 'normal', value, sign, exp: Ev - bias, sig: 1 + frac, formula: `${sign ? '−' : ''}1.${M} × 2${sup(Ev - bias)}` };
  }
  const fieldsHtml = (S, E, M, hl) => `<div class="arch-fields"><span class="arch-field arch-fs${hl === 'S' ? ' hl' : ''}"><small>sign</small>${S}</span><span class="arch-field arch-fe${hl === 'E' ? ' hl' : ''}"><small>exponent (${E.length})</small>${esc(E)}</span><span class="arch-field arch-fm${hl === 'M' ? ' hl' : ''}"><small>mantissa (${M.length})</small>${esc(M)}</span></div>`;

  MODES.float = {
    title: 'IEEE 754 encoding',
    init() { return { phase: 'idle', dir: 'encode', trace: [], f: null, dec: null, e: 8, m: 23 }; },
    controls: [{ kind: 'text', name: 'value', label: 'value', default: '13.75' }, { kind: 'number', name: 'exp', label: 'exponent bits', default: 8 }, { kind: 'number', name: 'mant', label: 'mantissa bits', default: 23 }, { kind: 'button', label: 'encode', op: 'encode', args: ['value', 'exp', 'mant'] }, { kind: 'text', name: 'bits', label: 'bits', default: '' }, { kind: 'button', label: 'decode', op: 'decode', args: ['bits', 'exp', 'mant'] }],
    auto: { op: 'run', args: ['value', 'bits', 'exp', 'mant'] },
    ops: {
      // a block gives either `value` (encode) or `bits` (decode)
      *run(s, [value, b, e0, m0]) { if (b !== undefined && b !== null && String(b).trim() !== '') yield* MODES.float.ops.decode(s, [b, e0, m0]); else yield* MODES.float.ops.encode(s, [value, e0, m0]); },
      *encode(s, [value, e0, m0]) {
        const e = num(e0, 8), m = num(m0, 23);
        Object.assign(s, { phase: 'run', dir: 'encode', trace: [], f: null, dec: null, e, m, value: String(value) });
        if (e < 2 || e > 11 || m < 1 || m > 52) { yield fail('exponent bits 2 … 11, mantissa bits 1 … 52'); return; }
        const t = String(value).trim().toLowerCase();
        const v = t === 'inf' || t === '+inf' || t === 'infinity' ? Infinity : t === '-inf' || t === '-infinity' ? -Infinity : t === 'nan' ? NaN : Number(t);
        if (t === '' || (Number.isNaN(v) && t !== 'nan')) { yield fail(`${value} is not a number`); return; }
        const f = floatEncode(v, e, m); s.f = f;
        for (let i = 0; i < f.trace.length; i++) { s.trace = f.trace.slice(0, i + 1); yield { d: f.trace[i] }; }
        const d = floatDecode(String(f.sign), f.E, f.M); s.dec = Object.assign({ text: fmtDec(d.value) }, d);
        s.phase = 'done';
        const w = 1 + e + m, hex = w % 4 === 0 ? ' = 0x' + parseInt(String(f.sign) + f.E + f.M, 2).toString(16).toUpperCase().padStart(w / 4, '0') : '';
        yield { d: `stored: ${f.sign} ${f.E} ${f.M}${hex}; reading it back gives ${fmtDec(d.value)}${f.kind === 'normal' && f.rounded ? ` — not exactly ${fmtDec(v)}: the representation error is ${fmtDec(d.value - v)}` : f.kind === 'normal' ? ' — exact' : ''}` };
      },
      *decode(s, [bstr, e0, m0]) {
        const e = num(e0, 8), m = num(m0, 23);
        const b = String(bstr).replace(/\s+/g, '');
        Object.assign(s, { phase: 'run', dir: 'decode', trace: [], f: null, dec: null, e, m });
        if (!/^[01]+$/.test(b) || b.length !== 1 + e + m) { yield fail(`expected ${1 + e + m} bits (1 + ${e} + ${m}), got ${b.length || 'none'}`); return; }
        const S = b[0], E = b.slice(1, 1 + e), M = b.slice(1 + e);
        s.f = { sign: +S, E, M, e, m, bias: pow2(e - 1) - 1, kind: 'normal' };
        s.trace = [`split: sign ${S}, exponent ${E}, mantissa ${M}`]; yield { d: s.trace[0] };
        const d = floatDecode(S, E, M); s.dec = Object.assign({ text: fmtDec(d.value) }, d); s.f.kind = d.kind;
        const bias = pow2(e - 1) - 1;
        if (d.kind === 'inf' || d.kind === 'nan') { s.trace.push(d.kind === 'inf' ? 'exponent all 1s, mantissa 0 → infinity' : 'exponent all 1s, mantissa non-zero → NaN'); s.phase = 'done'; yield { d: s.trace[1] + `: ${fmtDec(d.value)}` }; return; }
        if (d.kind === 'zero') { s.trace.push('all exponent and mantissa bits 0 → zero'); s.phase = 'done'; yield { d: s.trace[1] }; return; }
        if (d.kind === 'denormal') s.trace.push(`exponent field 0 → denormal: no hidden 1, exponent fixed at 1 − ${bias} = ${1 - bias}`);
        else s.trace.push(`exponent ${E} = ${parseInt2(E)}, minus the bias ${bias} → ${d.exp}`);
        yield { d: s.trace[s.trace.length - 1] };
        s.trace.push(`significand ${d.kind === 'denormal' ? '0' : '1'}.${M} = ${fmtDec(d.sig)}`); yield { d: s.trace[s.trace.length - 1] };
        s.phase = 'done';
        yield { d: `value = ${d.formula} = ${fmtDec(d.value)}` };
      }
    },
    render(s) {
      if (s.phase === 'idle' || !s.f) return '<div class="arch-empty">enter a value</div>';
      const f = s.f;
      let h = '';
      if (s.dir === 'encode' && f.norm) h += `<div class="arch-line">${esc(f.intBits)}.${esc((f.fracBits || '0').slice(0, 40))}${f.fracBits && f.fracBits.length > 40 ? '…' : ''} → <b>${esc(f.norm)}</b> &nbsp; bias ${f.bias}</div>`;
      if (f.E !== undefined) h += fieldsHtml(f.sign, f.E, f.M, s.phase === 'done' ? '' : s.trace.length <= 1 ? 'S' : /exponent|denormal|overflow/.test(s.trace[s.trace.length - 1]) ? 'E' : 'M');
      h += '<ol class="arch-trace">' + s.trace.map(t => `<li>${esc(t)}</li>`).join('') + '</ol>';
      if (s.dec && s.phase === 'done') h += `<div class="arch-result">${tag(f.kind, f.kind === 'normal' ? 'ok' : 'warn')} ${s.dec.formula ? esc(s.dec.formula) + ' = ' : ''}<b>${esc(s.dec.text)}</b></div>`;
      return h;
    }
  };

  MODES['float-add'] = {
    title: 'Floating-point addition',
    init() { return { phase: 'idle', rows: [], e: 5, m: 10 }; },
    controls: [{ kind: 'text', name: 'a', label: 'A', default: '13.75' }, { kind: 'text', name: 'b', label: 'B', default: '0.375' }, { kind: 'number', name: 'exp', label: 'exponent bits', default: 5 }, { kind: 'number', name: 'mant', label: 'mantissa bits', default: 10 }, { kind: 'button', label: 'add', op: 'add', args: ['a', 'b', 'exp', 'mant'] }],
    auto: { op: 'add', args: ['a', 'b', 'exp', 'mant'] },
    ops: {
      *add(s, [a0, b0, e0, m0]) {
        const e = num(e0, 5), m = num(m0, 10), a = Number(a0), b = Number(b0);
        Object.assign(s, { phase: 'run', rows: [], e, m, res: null });
        if (!Number.isFinite(a) || !Number.isFinite(b)) { yield fail('operands must be finite numbers'); return; }
        const fa = floatEncode(a, e, m), fb = floatEncode(b, e, m);
        if (fa.kind !== 'normal' || fb.kind !== 'normal') { yield fail('this stepper adds two normal numbers'); return; }
        const da = floatDecode(String(fa.sign), fa.E, fa.M), db = floatDecode(String(fb.sign), fb.E, fb.M);
        s.rows.push({ lbl: 'A', sig: '1.' + fa.M, exp: da.exp, sign: fa.sign, note: `${fmtDec(da.value)}` });
        s.rows.push({ lbl: 'B', sig: '1.' + fb.M, exp: db.exp, sign: fb.sign, note: `${fmtDec(db.value)}` });
        yield { d: `unpack both operands, putting the hidden 1 back: A = ${fa.sign ? '−' : ''}1.${fa.M} × 2${sup(da.exp)} (${fmtDec(da.value)}), B = ${fb.sign ? '−' : ''}1.${fb.M} × 2${sup(db.exp)} (${fmtDec(db.value)})` };
        // align to the larger exponent
        let big = da.exp >= db.exp ? 0 : 1; const small = 1 - big;
        const ops = [{ sig: '1' + fa.M, exp: da.exp, sign: fa.sign }, { sig: '1' + fb.M, exp: db.exp, sign: fb.sign }];
        const diff = ops[big].exp - ops[small].exp;
        const guard = 3;
        const sigInt = x => parseInt2(x.sig + '0'.repeat(guard));   // integer significands with guard bits
        let big_i = sigInt(ops[big]); let small_i = Math.floor(sigInt(ops[small]) / pow2(diff)); const sticky = sigInt(ops[small]) % pow2(diff) !== 0;
        const shown = (ops[small].sig + '0'.repeat(guard)); const shiftedStr = ('0'.repeat(diff) + shown).slice(0, shown.length);
        s.rows.push({ lbl: ['A', 'B'][small] + ' aligned', sig: shiftedStr.slice(0, 1) + '.' + shiftedStr.slice(1), exp: ops[big].exp, sign: ops[small].sign, note: diff ? `shifted right ${diff}${sticky ? ', bits lost' : ''}` : 'same exponent' });
        yield { d: diff ? `align the binary points: the smaller exponent (${ops[small].exp}) is raised to ${ops[big].exp} by shifting its significand right ${diff} place${diff > 1 ? 's' : ''}${sticky ? ' — low bits fall off the end' : ''}` : 'the exponents are equal: nothing to align' };
        const sameSign = ops[0].sign === ops[1].sign;
        let sum = sameSign ? big_i + small_i : big_i - small_i; let sign = ops[big].sign;
        if (sum < 0) { sum = -sum; sign = ops[small].sign; }
        const total = m + 1 + guard;
        let sumBits = sum.toString(2);
        s.rows.push({ lbl: sameSign ? 'sum' : 'difference', sig: sumBits.length > total ? sumBits[0] + sumBits[1] + '.' + sumBits.slice(2) : (sumBits.padStart(total, '0')).slice(0, 1) + '.' + sumBits.padStart(total, '0').slice(1), exp: ops[big].exp, sign, note: sumBits.length > total ? 'carried out: ≥ 2' : sumBits.length < total ? 'leading zeros' : '' });
        yield { d: `${sameSign ? 'add' : 'subtract'} the significands (the signs ${sameSign ? 'agree' : 'differ'}): ${sumBits}${sumBits.length > total ? ' — the result is ≥ 2 and needs renormalising' : sumBits.length < total ? ' — the leading 1 moved right, renormalise' : ''}` };
        if (sum === 0) { s.res = { value: 0, text: '0' }; s.phase = 'done'; yield { d: 'the significands cancel: the result is zero' }; return; }
        let exp = ops[big].exp;
        // renormalise: leading 1 at position `total-1`
        const lead = sumBits.length - 1;
        if (lead !== total - 1) { const shift = lead - (total - 1); exp += shift; if (shift > 0) { sum = Math.floor(sum / pow2(shift)); } else sum = sum * pow2(-shift); sumBits = sum.toString(2).padStart(total, '0'); s.rows.push({ lbl: 'normalised', sig: sumBits[0] + '.' + sumBits.slice(1), exp, sign, note: `shift ${shift > 0 ? 'right' : 'left'} ${Math.abs(shift)}, exponent ${shift > 0 ? '+' : '−'}${Math.abs(shift)}` }); yield { d: `renormalise: shift ${shift > 0 ? 'right' : 'left'} ${Math.abs(shift)} so the significand is 1.…, exponent becomes ${exp}` }; }
        // round to m bits (nearest, ties to even)
        const keep = Math.floor(sum / pow2(guard)), rest = sum % pow2(guard);
        let mantInt = keep; const halfG = pow2(guard - 1);
        if (rest > halfG || (rest === halfG && (keep & 1))) mantInt += 1;
        if (mantInt >= pow2(m + 1)) { mantInt = Math.floor(mantInt / 2); exp += 1; }
        const M = mantInt.toString(2).padStart(m + 1, '0').slice(1);
        s.rows.push({ lbl: 'rounded', sig: '1.' + M, exp, sign, note: rest || sticky ? `guard bits ${rest.toString(2).padStart(guard, '0')} → ${mantInt === keep ? 'down' : 'up'}` : 'exact' });
        yield { d: `round to ${m} mantissa bits${rest || sticky ? ` using the guard bits ${rest.toString(2).padStart(guard, '0')}: ${mantInt === keep ? 'round down' : 'round up'}` : ': nothing to drop, exact'}` };
        const bias = pow2(e - 1) - 1;
        const value = (sign ? -1 : 1) * (mantInt / pow2(m)) * pow2(exp);
        const exact = da.value + db.value;
        s.res = { sign, E: bits(exp + bias, e), M, value, exact };
        s.phase = 'done';
        const inputs = exact !== a + b ? ` (the inputs were already rounded when stored: ${fmtDec(a)} + ${fmtDec(b)} = ${fmtDec(a + b)})` : '';
        yield { d: `pack: ${sign} ${s.res.E} ${M} = ${fmtDec(value)}${Math.abs(value - exact) > 0 ? ` — the exact sum of the stored operands is ${fmtDec(exact)}, rounding error ${fmtDec(value - exact)}` : ' — the exact sum of the stored operands'}${inputs}` };
      }
    },
    render(s) {
      if (s.phase === 'idle') return '<div class="arch-empty">enter two values</div>';
      let h = table(['', 'sign', 'significand', 'exponent', ''], s.rows.map(r => [{ v: r.lbl, cls: 'lbl' }, { v: r.sign ? '−' : '+', cls: 'mono' }, { v: bitsHtml(r.sig), cls: 'mono' }, { v: '2' + sup(r.exp), cls: 'mono' }, { v: r.note, cls: 'muted' }]), { rowCls: i => i === s.rows.length - 1 && s.phase !== 'done' ? 'hl' : '' });
      if (s.res && s.res.E) h += fieldsHtml(s.res.sign, s.res.E, s.res.M) + `<div class="arch-result"><b>${esc(fmtDec(s.res.value))}</b> <span class="arch-muted">exact ${esc(fmtDec(s.res.exact))}</span></div>`;
      else if (s.res) h += `<div class="arch-result"><b>0</b></div>`;
      return h;
    }
  };

  MODES.text = {
    title: 'Text as bytes',
    init() { return { rows: [], phase: 'idle', text: '' }; },
    controls: [{ kind: 'text', name: 'text', label: 'text', default: 'Hi!' }, { kind: 'button', label: 'encode', op: 'encode', args: ['text'] }],
    auto: { op: 'encode', args: ['text'] },
    ops: {
      *encode(s, [t]) {
        const str = String(t === undefined ? '' : t).replace(/\\n/g, '\n');
        s.rows = []; s.text = str; s.phase = 'run';
        const enc = typeof TextEncoder !== 'undefined' ? new TextEncoder() : null;
        for (const ch of str) {
          const cp = ch.codePointAt(0);
          const bytes = enc ? [...enc.encode(ch)] : utf8(cp);
          const row = { ch, cp, hex: bytes.map(b => b.toString(16).toUpperCase().padStart(2, '0')), bin: bytes.map(b => bits(b, 8)), ascii: cp < 128 };
          s.rows.push(row);
          const name = cp === 10 ? 'newline (LF)' : cp === 32 ? 'space' : cp < 32 ? 'control character' : `'${ch}'`;
          yield { d: `${name}: code point ${cp} = U+${cp.toString(16).toUpperCase().padStart(4, '0')} → ${row.ascii ? `one byte ${row.hex[0]} = ${row.bin[0]} (ASCII, high bit 0)` : `${bytes.length} UTF-8 bytes ${row.hex.join(' ')} (${bytes.length === 2 ? '110xxxxx 10xxxxxx' : bytes.length === 3 ? '1110xxxx 10xxxxxx 10xxxxxx' : '11110xxx 10xxxxxx 10xxxxxx 10xxxxxx'})`}` };
        }
        s.phase = 'done';
        const total = s.rows.reduce((n, r) => n + r.hex.length, 0);
        yield { d: `${[...str].length} character${[...str].length === 1 ? '' : 's'}, ${total} byte${total === 1 ? '' : 's'}: ${s.rows.map(r => r.hex.join(' ')).join(' ')}` };
      }
    },
    render(s) {
      if (s.phase === 'idle') return '<div class="arch-empty">enter text</div>';
      return table(['char', 'code point', 'hex', 'binary', ''], s.rows.map(r => [{ v: esc(r.ch === '\n' ? '⏎' : r.ch === ' ' ? '␠' : r.ch), cls: 'mono' }, `${r.cp} (U+${r.cp.toString(16).toUpperCase().padStart(4, '0')})`, { v: r.hex.join(' '), cls: 'mono' }, { v: r.bin.map(b => bitsHtml(b, [r.ascii ? 'muted' : 'blue'])).join(' '), cls: 'mono' }, r.ascii ? tag('ASCII', 'ok') : tag(`UTF-8 ×${r.hex.length}`, 'blue')]), { rowCls: i => i === s.rows.length - 1 && s.phase !== 'done' ? 'hl' : '' });
    }
  };
  function utf8(cp) {
    if (cp < 0x80) return [cp];
    if (cp < 0x800) return [0xC0 | (cp >> 6), 0x80 | (cp & 63)];
    if (cp < 0x10000) return [0xE0 | (cp >> 12), 0x80 | ((cp >> 6) & 63), 0x80 | (cp & 63)];
    return [0xF0 | (cp >> 18), 0x80 | ((cp >> 12) & 63), 0x80 | ((cp >> 6) & 63), 0x80 | (cp & 63)];
  }

  /* ═══════════════════════ ERROR DETECTION AND CORRECTION ═══════════════════════ */
  const ones = s => [...s].filter(c => c === '1').length;
  MODES.parity = {
    title: 'Parity',
    init() { return { phase: 'idle', rows: [], kind: 'even', dim: 1 }; },
    controls: [{ kind: 'text', name: 'data', label: 'data', default: '1011001' }, { kind: 'select', name: 'kind', label: 'parity', options: ['even', 'odd'], default: 'even' }, { kind: 'text', name: 'flip', label: 'flip bit', default: '' }, { kind: 'button', label: 'send', op: 'send', args: ['data', 'kind', 'flip'] }],
    auto: { op: 'send', args: ['data', 'kind', 'flip'] },
    ops: {
      *send(s, [data0, kind0, flip0]) {
        const kind = kind0 === 'odd' ? 'odd' : 'even';
        const rowsIn = Array.isArray(data0) ? data0.map(String) : String(data0).trim().split(/[\s,;/]+/).filter(Boolean);
        Object.assign(s, { phase: 'run', kind, rows: [], colP: null, flip: null, found: null, dim: rowsIn.length > 1 ? 2 : 1 });
        if (!rowsIn.length || rowsIn.some(r => !/^[01]+$/.test(r)) || new Set(rowsIn.map(r => r.length)).size > 1) { yield fail('data must be one bit string, or several of equal length for 2-D parity'); return; }
        const want = kind === 'even' ? 0 : 1;
        for (const r of rowsIn) { const p = (ones(r) + want) % 2; s.rows.push({ bits: r, p, ok: true }); yield { d: `${r} has ${ones(r)} one${ones(r) === 1 ? '' : 's'}: ${kind} parity needs the total ${kind}, so the parity bit is ${p}` }; }
        if (s.dim === 2) { const n = rowsIn[0].length; const cols = []; for (let c = 0; c <= n; c++) { const colStr = s.rows.map(r => c < n ? r.bits[c] : String(r.p)).join(''); cols.push((ones(colStr) + want) % 2); } s.colP = cols; s.colOk = cols.map(() => true); yield { d: `2-D parity: a parity bit per column as well (${cols.slice(0, n).join('')}), plus one for the parity column itself (${cols[n]})` }; }
        const flipS = flip0 === undefined || flip0 === null ? '' : String(flip0).trim();
        if (!flipS) { s.phase = 'done'; yield { d: 'transmitted without error: every check passes' }; return; }
        let fr = 0, fc; if (s.dim === 2) { const m = /^(\d+)\D+(\d+)$/.exec(flipS); if (!m) { yield fail('flip needs a row and a column, e.g. "1,2"'); return; } fr = +m[1]; fc = +m[2]; } else fc = +flipS;
        const n = rowsIn[0].length;
        if (!(fr >= 0 && fr < s.rows.length && fc >= 0 && fc <= n)) { yield fail('flip position out of range'); return; }
        const row = s.rows[fr];
        if (fc < n) row.bits = row.bits.slice(0, fc) + (row.bits[fc] === '1' ? '0' : '1') + row.bits.slice(fc + 1); else row.p ^= 1;
        s.flip = [fr, fc];
        yield { d: `a bit flips in transit: ${s.dim === 2 ? `row ${fr}, ` : ''}${fc < n ? `bit ${fc}` : 'the parity bit itself'}` };
        // check
        for (const r of s.rows) r.ok = (ones(r.bits) + r.p) % 2 === want;
        if (s.dim === 1) { s.phase = 'done'; yield { d: `receiver counts ${ones(row.bits) + row.p} ones including the parity bit: ${kind === 'even' ? 'odd' : 'even'} → error detected, but a single parity bit cannot say which bit (and two flips would cancel)` }; return; }
        s.colOk = s.colP.map((p, c) => { const colStr = s.rows.map(r => c < n ? r.bits[c] : String(r.p)).join(''); return (ones(colStr) + p) % 2 === want; });
        const badR = s.rows.findIndex(r => !r.ok), badC = s.colOk.findIndex(ok => !ok);
        s.found = [badR, badC];
        yield { d: `row check fails at row ${badR}, column check fails at column ${badC}: the error is at their intersection` };
        const r2 = s.rows[badR]; if (badC < n) r2.bits = r2.bits.slice(0, badC) + (r2.bits[badC] === '1' ? '0' : '1') + r2.bits.slice(badC + 1); else r2.p ^= 1;
        for (const r of s.rows) r.ok = true; s.colOk = s.colOk.map(() => true); s.phase = 'done';
        yield { d: 'flip it back: corrected without retransmission' };
      }
    },
    render(s) {
      if (s.phase === 'idle') return '<div class="arch-empty">enter data bits</div>';
      const n = s.rows.length ? s.rows[0].bits.length : 0;
      const rows = s.rows.map((r, i) => [...r.bits].map((b, c) => ({ v: b, cls: 'mono' + (s.flip && s.flip[0] === i && s.flip[1] === c ? ' hi' : '') })).concat([{ v: String(r.p), cls: 'mono k' + (s.flip && s.flip[0] === i && s.flip[1] === n ? ' hi' : '') }, { v: r.ok ? tag('ok', 'ok') : tag('fail', 'hi'), cls: '' }]));
      if (s.colP) rows.push(s.colP.map((p, c) => ({ v: String(p), cls: 'mono k' })).concat([{ v: '', cls: '' }]));
      if (s.colOk) rows.push(s.colOk.map(ok => ({ v: ok ? tag('ok', 'ok') : tag('fail', 'hi'), cls: '' })).concat([{ v: '', cls: '' }]));
      const head = Array.from({ length: n }, (_, c) => `b${c}`).concat(['P', 'check']);
      return table(head, rows, { cls: 'arch-grid', rowCls: i => s.found && i === s.found[0] && s.phase !== 'done' ? 'hl' : '' });
    }
  };

  MODES.hamming = {
    title: 'Hamming code',
    init() { return { phase: 'idle', pos: [], r: 0 }; },
    controls: [{ kind: 'text', name: 'data', label: 'data bits', default: '1011' }, { kind: 'text', name: 'flip', label: 'flip position', default: '' }, { kind: 'button', label: 'encode', op: 'encode', args: ['data', 'flip'] }],
    auto: { op: 'encode', args: ['data', 'flip'] },
    ops: {
      *encode(s, [data0, flip0]) {
        const data = String(data0).replace(/\s+/g, '');
        Object.assign(s, { phase: 'run', pos: [], checks: null, flip: null, syndrome: null, data });
        if (!/^[01]+$/.test(data)) { yield fail('data must be a bit string'); return; }
        const k = data.length; let r = 0; while (pow2(r) < k + r + 1) r++;
        s.r = r; const N = k + r;
        let di = 0;
        for (let p = 1; p <= N; p++) { const isP = (p & (p - 1)) === 0; s.pos.push(isP ? { p, lbl: 'p' + p, b: null, parity: true } : { p, lbl: 'd' + (++di), b: data[di - 1], parity: false }); }
        yield { d: `${k} data bits need ${r} parity bits (2${sup(r)} ≥ ${k} + ${r} + 1): positions 1, 2, 4${r > 3 ? ', 8' : ''}… are parity, the rest carry the data in order` };
        for (let i = 0; i < r; i++) {
          const pp = pow2(i); const covered = s.pos.filter(x => (x.p & pp) && !x.parity);
          const par = covered.reduce((a, x) => a ^ +x.b, 0);
          s.pos.find(x => x.p === pp).b = String(par); s.cur = pp;
          yield { d: `p${pp} covers every position whose binary form has bit ${i} set (${s.pos.filter(x => x.p & pp).map(x => x.p).join(', ')}): the data bits there are ${covered.map(x => x.b).join('')} → even parity gives ${par}` };
        }
        s.cur = null; s.code = s.pos.map(x => x.b).join('');
        yield { d: `code word (position 1 first): ${s.code}` };
        const flip = flip0 === undefined || flip0 === null ? '' : String(flip0).trim();
        if (!flip) { s.phase = 'done'; yield { d: 'no error injected: every parity check passes and the syndrome is 0' }; return; }
        const fp = +flip; if (!(fp >= 1 && fp <= N)) { yield fail(`flip position must be 1 … ${N}`); return; }
        const cell = s.pos[fp - 1]; cell.b = cell.b === '1' ? '0' : '1'; s.flip = fp;
        yield { d: `position ${fp} (${cell.lbl}) flips in transit` };
        const checks = []; let syn = 0;
        for (let i = 0; i < r; i++) { const pp = pow2(i); const tot = s.pos.filter(x => x.p & pp).reduce((a, x) => a ^ +x.b, 0); checks.push({ pp, ok: tot === 0 }); if (tot) syn += pp; }
        s.checks = checks; s.syndrome = syn;
        yield { d: `recheck each parity group: ${checks.map(c => `p${c.pp} ${c.ok ? 'ok' : 'FAIL'}`).join(', ')} — the failing groups add up to ${checks.filter(c => !c.ok).map(c => c.pp).join(' + ') || 0} = ${syn}: the syndrome names the bad position` };
        cell.b = cell.b === '1' ? '0' : '1'; s.phase = 'done'; s.corrected = fp;
        yield { d: `flip position ${syn} back: corrected — ${data} recovered from the data positions` };
      }
    },
    render(s) {
      if (s.phase === 'idle') return '<div class="arch-empty">enter data bits</div>';
      const head = s.pos.map(x => String(x.p));
      const rows = [s.pos.map(x => ({ v: x.lbl, cls: x.parity ? 'muted' : '' })), s.pos.map(x => ({ v: x.b === null ? '?' : x.b, cls: 'mono ' + (x.parity ? 'k' : '') + (s.flip === x.p && s.phase !== 'done' ? ' hi' : '') + (s.cur === x.p ? ' hl' : '') }))];
      for (let i = 0; i < s.r; i++) { const pp = pow2(i); rows.push(s.pos.map(x => ({ v: x.p & pp ? '•' : '', cls: 'muted' + (s.cur === pp ? ' hl' : '') + (s.checks && !s.checks[i].ok ? ' hi' : '') }))); }
      let h = table(head, rows, { cls: 'arch-grid' });
      if (s.checks) h += `<div class="arch-line">${s.checks.map(c => tag('p' + c.pp + (c.ok ? ' ✓' : ' ✗'), c.ok ? 'ok' : 'hi')).join(' ')} syndrome = <b>${s.syndrome}</b></div>`;
      return h;
    }
  };

  MODES.gray = {
    title: 'Gray code',
    init() { return { phase: 'idle', rows: [], n: 3, lists: [] }; },
    controls: [{ kind: 'number', name: 'bits', label: 'bits', default: 3 }, { kind: 'button', label: 'build', op: 'build', args: ['bits'] }],
    auto: { op: 'build', args: ['bits'] },
    ops: {
      *build(s, [n0]) {
        const n = num(n0, 3);
        Object.assign(s, { phase: 'run', rows: [], lists: [], n });
        if (n < 1 || n > 5) { yield fail('1 … 5 bits'); return; }
        let list = ['0', '1']; s.lists.push(list);
        yield { d: '1 bit: 0, 1' };
        for (let k = 2; k <= n; k++) { list = list.map(x => '0' + x).concat(list.slice().reverse().map(x => '1' + x)); s.lists.push(list); yield { d: `${k} bits: write the ${k - 1}-bit list, then the same list reflected (in reverse), prefix the first half with 0 and the mirror with 1 — neighbours across the seam differ only in the new bit` }; }
        for (let i = 0; i < pow2(n); i++) {
          const b = bits(i, n), g = bits(i ^ (i >> 1), n);
          const prev = s.rows[s.rows.length - 1];
          s.rows.push({ i, b, g, db: prev ? ones(bits(parseInt2(prev.b) ^ i, n)) : 0, dg: prev ? ones(bits(parseInt2(prev.g) ^ parseInt2(g), n)) : 0 });
        }
        s.phase = 'done';
        const worst = s.rows.reduce((m, r) => Math.max(m, r.db), 0);
        yield { d: `same list by formula g = b ⊕ (b ≫ 1); consecutive binary values differ in up to ${worst} bits (${bits(pow2(n - 1) - 1, n)} → ${bits(pow2(n - 1), n)}), consecutive Gray codes always in exactly 1` };
      }
    },
    render(s) {
      if (s.phase === 'idle') return '<div class="arch-empty">choose a width</div>';
      let h = s.lists.map((l, k) => `<div class="arch-line">${k + 1} bit${k ? 's' : ''}: ${l.map((x, i) => tag(x, k && i >= l.length / 2 ? 'blue' : 'muted')).join(' ')}</div>`).join('');
      if (s.rows.length) h += table(['n', 'binary', 'Δ', 'Gray', 'Δ'], s.rows.map(r => [r.i, { v: bitsHtml(r.b), cls: 'mono' }, { v: String(r.db), cls: r.db > 1 ? 'hi' : 'muted' }, { v: bitsHtml(r.g), cls: 'mono' }, { v: String(r.dg), cls: 'ok' }]));
      return h;
    }
  };

  /* ═══════════════════════ DIGITAL LOGIC ═══════════════════════ */
  // Boolean expressions: x + y z, x'y + (x ⊕ y), ¬x, x·y, and/or/not/xor/nand/nor, 0/1; juxtaposition is AND.
  // Identifiers are single letters (x, y, A0) unless `vars` lists longer names. Precedence: not > and > xor > or.
  const KEYWORDS = ['nand', 'nor', 'xor', 'and', 'not', 'or'];
  function tokenize(src, vars) {
    const out = []; let i = 0; const s = String(src);
    const names = (vars || []).slice().sort((a, b) => b.length - a.length);
    while (i < s.length) {
      const ch = s[i];
      if (/\s/.test(ch)) { i++; continue; }
      let m = null;
      for (const k of KEYWORDS) if (s.slice(i, i + k.length).toLowerCase() === k && !/[A-Za-z0-9_]/.test(s[i + k.length] || '')) { m = k; break; }
      if (m) { out.push({ t: m }); i += m.length; continue; }
      for (const n of names) if (s.slice(i, i + n.length) === n && !/[A-Za-z0-9_]/.test(s[i + n.length] || '')) { m = n; break; }
      if (m) { out.push({ t: 'id', v: m }); i += m.length; continue; }
      if (/[A-Za-z]/.test(ch)) { let j = i + 1; while (j < s.length && /[0-9_]/.test(s[j])) j++; out.push({ t: 'id', v: s.slice(i, j) }); i = j; continue; }
      if (ch === '0' || ch === '1') { out.push({ t: 'const', v: +ch }); i++; continue; }
      if ('+|∨'.includes(ch)) { out.push({ t: 'or' }); i++; continue; }
      if ('^⊕'.includes(ch)) { out.push({ t: 'xor' }); i++; continue; }
      if ('·*&∧.'.includes(ch)) { out.push({ t: 'and' }); i++; continue; }
      if ('¬!~'.includes(ch)) { out.push({ t: 'not' }); i++; continue; }
      if (ch === "'" || ch === '′') { out.push({ t: 'post' }); i++; continue; }
      if (ch === '(') { out.push({ t: '(' }); i++; continue; }
      if (ch === ')') { out.push({ t: ')' }); i++; continue; }
      if (ch === ',') { out.push({ t: ',' }); i++; continue; }
      throw new Error(`unexpected character "${ch}" in ${src}`);
    }
    return out;
  }
  function parseBool(src, vars) {
    const tk = tokenize(src, vars); let p = 0;
    const peek = () => tk[p], next = () => tk[p++];
    const startsPrimary = t => t && (t.t === 'id' || t.t === 'const' || t.t === '(' || t.t === 'not' || t.t === 'nand' || t.t === 'nor');
    function pOr() { let a = pXor(); while (peek() && peek().t === 'or') { next(); const b = pXor(); a = a.t === 'or' ? { t: 'or', a: a.a.concat([b]) } : { t: 'or', a: [a, b] }; } return a; }
    function pXor() { let a = pAnd(); while (peek() && peek().t === 'xor') { next(); const b = pAnd(); a = a.t === 'xor' ? { t: 'xor', a: a.a.concat([b]) } : { t: 'xor', a: [a, b] }; } return a; }
    function pAnd() { let a = pNot(); for (;;) { if (peek() && peek().t === 'and') { next(); } else if (!startsPrimary(peek())) break; const b = pNot(); a = a.t === 'and' ? { t: 'and', a: a.a.concat([b]) } : { t: 'and', a: [a, b] }; } return a; }
    function pNot() { if (peek() && peek().t === 'not') { next(); return { t: 'not', a: [pNot()] }; } return pPost(); }
    function pPost() { let a = pPrimary(); while (peek() && peek().t === 'post') { next(); a = { t: 'not', a: [a] }; } return a; }
    function pPrimary() {
      const t = next(); if (!t) throw new Error('unexpected end of expression');
      if (t.t === 'id') return { t: 'var', v: t.v };
      if (t.t === 'const') return { t: 'const', v: t.v };
      if (t.t === 'nand' || t.t === 'nor') { if (!peek() || peek().t !== '(') throw new Error(`${t.t} needs a parenthesised argument list`); next(); const args = [pOr()]; while (peek() && peek().t === ',') { next(); args.push(pOr()); } if (!peek() || peek().t !== ')') throw new Error('missing )'); next(); return { t: t.t, a: args }; }
      if (t.t === '(') { const e = pOr(); if (!peek() || peek().t !== ')') throw new Error('missing )'); next(); return e; }
      throw new Error(`unexpected token ${t.t}`);
    }
    const ast = pOr(); if (p < tk.length) throw new Error(`unexpected token after the expression`);
    return ast;
  }
  const boolVars = (ast, acc) => { acc = acc || []; if (ast.t === 'var') { if (!acc.includes(ast.v)) acc.push(ast.v); } else if (ast.a) ast.a.forEach(x => boolVars(x, acc)); return acc; };
  function boolEval(ast, env) {
    switch (ast.t) {
      case 'var': return +env[ast.v] || 0;
      case 'const': return ast.v;
      case 'not': return 1 - boolEval(ast.a[0], env);
      case 'and': return ast.a.every(x => boolEval(x, env)) ? 1 : 0;
      case 'or': return ast.a.some(x => boolEval(x, env)) ? 1 : 0;
      case 'xor': return ast.a.reduce((s, x) => s ^ boolEval(x, env), 0);
      case 'nand': return ast.a.every(x => boolEval(x, env)) ? 0 : 1;
      case 'nor': return ast.a.some(x => boolEval(x, env)) ? 0 : 1;
    }
    return 0;
  }
  const boolStr = ast => {
    const wrap = (x, inner) => (x.t === 'or' || x.t === 'xor' || (x.t === 'and' && inner === 'not')) ? '(' + boolStr(x) + ')' : boolStr(x);
    switch (ast.t) {
      case 'var': return ast.v;
      case 'const': return String(ast.v);
      case 'not': return ast.a[0].t === 'var' || ast.a[0].t === 'const' ? ast.a[0].v + "'" : '(' + boolStr(ast.a[0]) + ")'";
      case 'and': return ast.a.map(x => wrap(x, 'and')).join('');
      case 'or': return ast.a.map(x => boolStr(x)).join(' + ');
      case 'xor': return ast.a.map(x => wrap(x, 'xor')).join(' ⊕ ');
      case 'nand': return 'nand(' + ast.a.map(boolStr).join(', ') + ')';
      case 'nor': return 'nor(' + ast.a.map(boolStr).join(', ') + ')';
    }
    return '?';
  };
  // rewrite with NAND gates only: not a = nand(a,a); a·b = nand(nand(a,b), nand(a,b)); a+b = nand(nand(a,a), nand(b,b)); a⊕b = via the four-NAND form
  function toNand(ast) {
    const nand = (...a) => ({ t: 'nand', a });
    const not = x => nand(x, x);
    switch (ast.t) {
      case 'var': case 'const': return ast;
      case 'not': return not(toNand(ast.a[0]));
      case 'nand': return nand(...ast.a.map(toNand));
      case 'and': { let acc = toNand(ast.a[0]); for (let i = 1; i < ast.a.length; i++) { const n = nand(acc, toNand(ast.a[i])); acc = nand(n, n); } return acc; }
      case 'or': { let acc = toNand(ast.a[0]); for (let i = 1; i < ast.a.length; i++) acc = nand(not(acc), not(toNand(ast.a[i]))); return acc; }
      case 'nor': { let acc = toNand(ast.a[0]); for (let i = 1; i < ast.a.length; i++) acc = nand(not(acc), not(toNand(ast.a[i]))); return not(acc); }
      case 'xor': { let acc = toNand(ast.a[0]); for (let i = 1; i < ast.a.length; i++) { const b = toNand(ast.a[i]); const m = nand(acc, b); acc = nand(nand(acc, m), nand(b, m)); } return acc; }
    }
    return ast;
  }
  const rowsOf = vars => { const n = vars.length, rows = []; for (let i = 0; i < pow2(n); i++) { const env = {}; vars.forEach((v, k) => { env[v] = (i >> (n - 1 - k)) & 1; }); rows.push(env); } return rows; };

  MODES['truth-table'] = {
    title: 'Truth table',
    init() { return { phase: 'idle', expr: '', vars: [], rows: [], done: 0, forms: null }; },
    controls: [{ kind: 'text', name: 'expr', label: 'expression', default: 'x + y z', wide: true }, { kind: 'button', label: 'tabulate', op: 'tabulate', args: ['expr'] }],
    auto: { op: 'tabulate', args: ['expr'] },
    ops: {
      *tabulate(s, [expr], cfg) {
        Object.assign(s, { phase: 'run', expr: String(expr), rows: [], done: 0, forms: null });
        let ast; try { ast = parseBool(expr, cfg.vars); } catch (e) { yield fail(e.message); return; }
        const vars = cfg.vars || boolVars(ast);
        if (vars.length > 5) { yield fail('at most 5 variables'); return; }
        s.vars = vars; s.pretty = boolStr(ast);
        const rows = rowsOf(vars).map((env, i) => ({ i, env, f: boolEval(ast, env) })); s.rows = rows;
        yield { d: `${vars.length} variable${vars.length > 1 ? 's' : ''} → ${pow2(vars.length)} rows, counting up in binary; evaluate ${s.pretty} on each` };
        for (const r of rows) { s.done = r.i + 1; yield { d: `row ${r.i} (${vars.map(v => v + '=' + r.env[v]).join(', ')}): ${s.pretty} = ${r.f}` }; }
        const mins = rows.filter(r => r.f === 1), maxs = rows.filter(r => r.f === 0);
        const minterm = r => vars.map(v => r.env[v] ? v : v + "'").join('');
        const maxterm = r => '(' + vars.map(v => r.env[v] ? v + "'" : v).join(' + ') + ')';
        s.forms = { sop: mins.length ? mins.map(minterm).join(' + ') : '0', pos: maxs.length ? maxs.map(maxterm).join('') : '1', m: mins.map(r => r.i), M: maxs.map(r => r.i) };
        s.phase = 'done';
        yield { d: `sum of products: one minterm per 1-row (Σm(${s.forms.m.join(',')})) → ${s.forms.sop}; product of sums: one maxterm per 0-row (ΠM(${s.forms.M.join(',')})) → ${s.forms.pos}` };
      }
    },
    render(s) {
      if (s.phase === 'idle') return '<div class="arch-empty">enter an expression</div>';
      if (!s.rows.length) return '';
      const head = s.vars.concat([esc(s.pretty)]).concat(s.forms ? ['minterm', 'maxterm'] : []);
      const rows = s.rows.map(r => { const shown = r.i < s.done; const cells = s.vars.map(v => ({ v: String(r.env[v]), cls: 'mono' })); cells.push({ v: shown ? String(r.f) : '', cls: 'mono ' + (shown ? (r.f ? 'k' : '') : '') }); if (s.forms) { cells.push({ v: r.f ? s.vars.map(v => r.env[v] ? v : v + "'").join('') : '', cls: 'mono ok' }); cells.push({ v: r.f ? '' : '(' + s.vars.map(v => r.env[v] ? v + "'" : v).join(' + ') + ')', cls: 'mono blue' }); } return cells; });
      let h = table(head, rows, { cls: 'arch-grid', rowCls: i => s.phase !== 'done' && i === s.done - 1 ? 'hl' : '' });
      if (s.forms) h += `<div class="arch-line">SOP: ${mono(s.forms.sop)}</div><div class="arch-line">POS: ${mono(s.forms.pos)}</div>`;
      return h;
    }
  };

  // gate diagram: the expression DAG laid out by depth, one column per level; shared sub-expressions drawn once
  function buildGates(ast) {
    const nodes = [], byKey = new Map();
    const key = n => n.t === 'var' ? 'v:' + n.v : n.t === 'const' ? 'c:' + n.v : n.t + '(' + n.a.map(key).join(',') + ')';
    const add = n => {
      const k = key(n); if (byKey.has(k)) return byKey.get(k);
      const ins = n.a ? n.a.map(add) : [];   // children first, so their ids come before the gate's
      const g = { id: nodes.length, t: n.t, v: n.v, in: ins, key: k };
      g.depth = g.in.length ? 1 + Math.max(...g.in.map(i => nodes[i].depth)) : 0;
      nodes.push(g); byKey.set(k, g.id); return g.id;
    };
    const out = add(ast);
    return { nodes, out };
  }
  function gateShape(t, x, y, w, h, fill, stroke) {
    const st = stroke || C.ink, sw = 1.6;
    const bubble = `<circle cx="${x + w + 5}" cy="${y + h / 2}" r="4.5" fill="#fff" stroke="${st}" stroke-width="${sw}"/>`;
    const andP = `<path d="M ${x} ${y} h ${w / 2} a ${h / 2} ${h / 2} 0 0 1 0 ${h} h ${-w / 2} z" fill="${fill}" stroke="${st}" stroke-width="${sw}"/>`;
    const orP = `<path d="M ${x} ${y} q ${w * 0.55} 0 ${w} ${h / 2} q ${-w * 0.45} ${h / 2} ${-w} ${h / 2} q ${w * 0.3} ${-h / 2} 0 ${-h} z" fill="${fill}" stroke="${st}" stroke-width="${sw}"/>`;
    const xorArc = `<path d="M ${x - 6} ${y} q ${w * 0.3} ${h / 2} 0 ${h}" fill="none" stroke="${st}" stroke-width="${sw}"/>`;
    switch (t) {
      case 'and': return andP;
      case 'nand': return andP + bubble;
      case 'or': return orP;
      case 'nor': return orP + bubble;
      case 'xor': return orP + xorArc;
      case 'not': return `<path d="M ${x} ${y} l ${w} ${h / 2} l ${-w} ${h / 2} z" fill="${fill}" stroke="${st}" stroke-width="${sw}"/>` + bubble;
    }
    return rect(x, y, w, h, fill, st);
  }
  function drawCircuit(g, vals, cur, opts) {
    const o = Object.assign({ colW: 120, rowH: 52, gw: 44, gh: 32 }, opts);
    const nodes = g.nodes; const maxD = Math.max(...nodes.map(n => n.depth));
    const inputs = nodes.filter(n => n.t === 'var'); const consts = nodes.filter(n => n.t === 'const');
    const cols = []; for (let d = 0; d <= maxD; d++) cols.push(nodes.filter(n => n.depth === d));
    const pos = {}; let rows = 0;
    cols.forEach((col, d) => { col.forEach((n, i) => { pos[n.id] = { x: 40 + d * o.colW, y: 30 + i * o.rowH }; }); rows = Math.max(rows, col.length); });
    const W = 40 + (maxD + 1) * o.colW + 40, H = 30 + rows * o.rowH + 10;
    let s = svgOpen(W, H) + defs();
    const outPt = n => { const p = pos[n.id]; return n.t === 'var' || n.t === 'const' ? [p.x + 26, p.y + o.gh / 2] : [p.x + o.gw + (n.t === 'nand' || n.t === 'nor' || n.t === 'not' ? 10 : 0), p.y + o.gh / 2]; };
    // wires first
    for (const n of nodes) {
      if (!n.in.length) continue;
      const p = pos[n.id]; const k = n.in.length;
      n.in.forEach((src, i) => {
        const sp = outPt(nodes[src]); const ty = p.y + o.gh * (i + 1) / (k + 1); const tx = p.x - (n.t === 'xor' ? 8 : 0);
        const v = vals ? vals[src] : undefined; const st = v === undefined ? C.line : v ? C.hi : C.line; const w = v ? 2.4 : 1.5;
        const midx = tx - 18 - (i * 4);
        s += poly([[sp[0], sp[1]], [midx, sp[1]], [midx, ty], [tx, ty]], st, w);
      });
    }
    for (const n of nodes) {
      const p = pos[n.id]; const v = vals ? vals[n.id] : undefined;
      if (n.t === 'var' || n.t === 'const') { const on = v === 1; s += rect(p.x - 4, p.y + 4, 30, o.gh - 8, on ? C.hiBg : '#fff', on ? C.hi : C.line, 5) + text(p.x + 11, p.y + o.gh / 2 + 5, n.t === 'var' ? n.v : String(n.v), 'arch-val'); if (n.t === 'var' && v !== undefined) s += text(p.x + 11, p.y - 3, String(v), 'arch-idx'); continue; }
      const hl = cur === n.id; const fill = hl ? C.warnBg : v === undefined ? '#fff' : v ? C.hiBg : '#fff';
      s += gateShape(n.t, p.x, p.y, o.gw, o.gh, fill, hl ? C.warn : C.ink);
      s += text(p.x + o.gw / 2 - (n.t === 'not' ? 8 : 0), p.y + o.gh / 2 + 4, n.t.toUpperCase(), 'arch-gate');
      if (v !== undefined) { const op = outPt(n); s += text(op[0] + 8, op[1] - 6, String(v), 'arch-idx', `fill="${v ? C.hi : C.muted}" font-weight="700"`); }
    }
    const on = nodes[g.out]; const op = outPt(on); const ov = vals ? vals[g.out] : undefined;
    s += arrow(op[0], op[1], op[0] + 28, op[1], ov ? C.hi : C.ink, ov ? 2.4 : 1.6, ov ? 'arch-ah-hi' : 'arch-ah');
    s += text(op[0] + 34, op[1] + 4, 'F' + (ov === undefined ? '' : ' = ' + ov), 'arch-val', 'text-anchor="start"');
    return s + '</svg>';
  }
  MODES.circuit = {
    title: 'Gate circuit',
    init(cfg) {
      const st = { phase: 'idle', expr: String(cfg.expr || ''), vals: null, cur: null, gates: null, err: null, nand: cfg.gates === 'nand' };
      try { const ast0 = parseBool(st.expr, cfg.vars); const ast = st.nand ? toNand(ast0) : ast0; st.vars = cfg.vars || boolVars(ast0); st.gates = buildGates(ast); st.pretty = boolStr(ast0); } catch (e) { st.err = e.message; }
      return st;
    },
    controls: [],   // built per block: one toggle per input (see mount-time hook below)
    setup(cfg, st) { return (st.vars || []).map(v => ({ kind: 'toggle', name: v, label: v, default: cfg.inputs && cfg.inputs[v] !== undefined ? +cfg.inputs[v] : 0 })); },
    onToggle: { op: 'eval', args: [] },   // args filled from every toggle by the shell
    auto: { op: 'eval', args: [] },
    ops: {
      *eval(s, args, cfg, values) {
        if (s.err) { yield fail(s.err); return; }
        const env = {}; for (const v of s.vars) env[v] = +((values && values[v] !== undefined) ? values[v] : (cfg.inputs && cfg.inputs[v]) || 0) ? 1 : 0;
        s.phase = 'run'; s.env = env; s.vals = {}; s.cur = null;
        const nodes = s.gates.nodes;
        for (const n of nodes) if (n.t === 'var') s.vals[n.id] = env[n.v]; else if (n.t === 'const') s.vals[n.id] = n.v;
        yield { d: `inputs ${s.vars.map(v => v + '=' + env[v]).join(', ')}; ${s.nand ? 'the circuit is rewritten with NAND gates only (De Morgan)' : 'follow the signals from the inputs on the left to the output on the right'}` };
        const order = nodes.filter(n => n.in.length).sort((a, b) => a.depth - b.depth || a.id - b.id);
        for (const n of order) {
          const ins = n.in.map(i => s.vals[i]);
          const fake = { t: n.t, a: ins.map(v => ({ t: 'const', v })) };
          const out = boolEval(fake, {}); s.vals[n.id] = out; s.cur = n.id;
          yield { d: `${n.t.toUpperCase()}(${ins.join(', ')}) = ${out}` };
        }
        s.cur = null; s.phase = 'done';
        yield { d: `output F = ${s.vals[s.gates.out]} for ${s.pretty}${s.nand ? ` with ${order.length} NAND gates` : ''} — toggle an input to re-evaluate` };
      }
    },
    render(s) {
      if (s.err) return `<div class="arch-empty">${esc(s.err)}</div>`;
      if (!s.gates) return '';
      return drawCircuit(s.gates, s.vals, s.cur);
    }
  };

  MODES.decoder = {
    title: 'Decoder',
    init() { return { phase: 'idle', n: 3, input: 0, active: null }; },
    controls: [{ kind: 'number', name: 'n', label: 'input lines', default: 3 }, { kind: 'number', name: 'input', label: 'input', default: 5 }, { kind: 'button', label: 'decode', op: 'decode', args: ['n', 'input'] }],
    auto: { op: 'decode', args: ['n', 'input'] },
    ops: {
      *decode(s, [n0, in0]) {
        const n = num(n0, 3), v = lit(in0);
        Object.assign(s, { phase: 'run', n, input: v, active: null });
        if (n < 1 || n > 4) { yield fail('1 … 4 input lines'); return; }
        if (!(v >= 0 && v < pow2(n))) { yield fail(`input must be 0 … ${pow2(n) - 1}`); return; }
        const b = bits(v, n);
        yield { d: `${n} input lines select one of 2${sup(n)} = ${pow2(n)} outputs: input ${b} = ${v}` };
        s.active = v; s.phase = 'done';
        const term = [...b].map((c, i) => `A${n - 1 - i}${c === '1' ? '' : "'"}`).join('');
        yield { d: `only D${v} is 1: its AND gate is ${term}, every other output stays 0 — this is how a memory chip turns an address into one selected row` };
      }
    },
    render(s) {
      if (s.phase === 'idle') return '';
      const n = s.n, N = pow2(n);
      const W = 420, rowH = 22, H = Math.max(140, 40 + N * rowH);
      let g = svgOpen(W, H) + defs();
      const bx = 150, by = 20, bw = 110, bh = H - 40;
      g += rect(bx, by, bw, bh, '#fff', C.ink, 8) + text(bx + bw / 2, by + bh / 2 + 5, `${n}-to-${N}`, 'arch-val');
      const b = s.active === null ? null : bits(s.active, n);
      for (let i = 0; i < n; i++) { const y = by + bh * (i + 1) / (n + 1); const on = b && b[n - 1 - i] === '1'; g += line(60, y, bx, y, on ? C.hi : C.line, on ? 2.4 : 1.5) + text(45, y + 4, `A${n - 1 - i}` + (b ? '=' + b[n - 1 - i] : ''), 'arch-small', on ? `fill="${C.hi}"` : ''); }
      for (let k = 0; k < N; k++) { const y = by + 12 + k * ((bh - 24) / Math.max(1, N - 1)); const on = s.active === k; g += line(bx + bw, y, bx + bw + 70, y, on ? C.hi : C.line, on ? 2.4 : 1.5) + text(bx + bw + 78, y + 4, `D${k} = ${s.active === null ? '' : on ? 1 : 0}`, 'arch-small', `text-anchor="start" ${on ? `fill="${C.hi}" font-weight="700"` : ''}`); }
      g += '</svg>';
      const rows = []; for (let k = 0; k < N; k++) { const bb = bits(k, n); rows.push([...bb].map(c => ({ v: c, cls: 'mono' })).concat(Array.from({ length: N }, (_, j) => ({ v: j === k ? '1' : '', cls: 'mono ' + (j === k ? 'k' : 'muted') })))); }
      const side = table(Array.from({ length: n }, (_, i) => `A${n - 1 - i}`).concat(Array.from({ length: N }, (_, j) => `D${j}`)), rows, { cls: 'arch-grid arch-tiny', rowCls: i => i === s.active ? 'hl' : '' });
      return { html: g, side };
    }
  };

  MODES.mux = {
    title: 'Multiplexer',
    init() { return { phase: 'idle', n: 2, sel: 0, data: [], out: null }; },
    controls: [{ kind: 'number', name: 'n', label: 'select lines', default: 2 }, { kind: 'number', name: 'select', label: 'select', default: 2 }, { kind: 'text', name: 'data', label: 'data lines', default: '0 1 1 0' }, { kind: 'button', label: 'select', op: 'select', args: ['n', 'select', 'data'] }],
    auto: { op: 'select', args: ['n', 'select', 'data'] },
    ops: {
      *select(s, [n0, sel0, data0]) {
        const n = num(n0, 2), sel = lit(sel0);
        const data = (Array.isArray(data0) ? data0 : String(data0).trim().split(/[\s,]+/)).map(x => +x);
        Object.assign(s, { phase: 'run', n, sel, data, out: null });
        if (n < 1 || n > 3) { yield fail('1 … 3 select lines'); return; }
        if (data.length !== pow2(n) || data.some(x => x !== 0 && x !== 1)) { yield fail(`need ${pow2(n)} data bits`); return; }
        if (!(sel >= 0 && sel < pow2(n))) { yield fail(`select must be 0 … ${pow2(n) - 1}`); return; }
        yield { d: `${n} select line${n > 1 ? 's' : ''} pick one of 2${sup(n)} = ${pow2(n)} data lines: S = ${bits(sel, n)} = ${sel}` };
        s.out = data[sel]; s.phase = 'done';
        yield { d: `Y = D${sel} = ${s.out}; internally a decoder enables one AND gate and an OR gate merges them: Y = ${data.map((d, i) => `D${i}·${[...bits(i, n)].map((c, k) => `S${n - 1 - k}${c === '1' ? '' : "'"}`).join('')}`).join(' + ')}` };
      }
    },
    render(s) {
      if (s.phase === 'idle') return '';
      const N = s.data.length; const W = 380, H = Math.max(150, 50 + N * 26);
      let g = svgOpen(W, H) + defs();
      const bx = 150, by = 20, bh = H - 60, bw = 70;
      g += `<path d="M ${bx} ${by} L ${bx + bw} ${by + 20} L ${bx + bw} ${by + bh - 20} L ${bx} ${by + bh} z" fill="#fff" stroke="${C.ink}" stroke-width="1.6"/>` + text(bx + bw / 2, by + bh / 2 + 5, 'MUX', 'arch-val');
      s.data.forEach((d, i) => { const y = by + 14 + i * ((bh - 28) / Math.max(1, N - 1)); const on = s.out !== null && i === s.sel; g += line(70, y, bx, y, on ? C.hi : d ? C.blue : C.line, on ? 2.6 : 1.5) + text(55, y + 4, `D${i} = ${d}`, 'arch-small', on ? `fill="${C.hi}" font-weight="700"` : ''); });
      const sy = by + bh + 22; for (let k = 0; k < s.n; k++) { const x = bx + 12 + k * 22; const bit = bits(s.sel, s.n)[k]; g += line(x, sy, x, by + bh - (bx + bw - x) * 20 / bw + 0, C.purple, 1.6) + text(x, sy + 12, `S${s.n - 1 - k}=${bit}`, 'arch-idx', `fill="${C.purple}"`); }
      const oy = by + bh / 2; g += arrow(bx + bw, oy, bx + bw + 60, oy, s.out ? C.hi : C.ink, s.out ? 2.6 : 1.6, s.out ? 'arch-ah-hi' : 'arch-ah') + text(bx + bw + 66, oy + 4, `Y${s.out === null ? '' : ' = ' + s.out}`, 'arch-val', 'text-anchor="start"');
      return g + '</svg>';
    }
  };

  MODES.adder = {
    title: 'Ripple-carry adder',
    init() { return { phase: 'idle', a: '', b: '', cin: 0, cols: [], done: 0 }; },
    controls: [{ kind: 'text', name: 'a', label: 'A', default: '0110' }, { kind: 'text', name: 'b', label: 'B', default: '0011' }, { kind: 'number', name: 'cin', label: 'carry in', default: 0 }, { kind: 'button', label: 'add', op: 'add', args: ['a', 'b', 'cin'] }],
    auto: { op: 'add', args: ['a', 'b', 'cin'] },
    ops: {
      *add(s, [a0, b0, cin0]) {
        const a = String(a0).replace(/\s+/g, ''), b = String(b0).replace(/\s+/g, ''), cin = +cin0 ? 1 : 0;
        Object.assign(s, { phase: 'run', a, b, cin, cols: [], done: 0 });
        if (!/^[01]+$/.test(a) || !/^[01]+$/.test(b) || a.length !== b.length) { yield fail('A and B must be bit strings of the same length'); return; }
        const w = a.length; if (w > 8) { yield fail('at most 8 bits'); return; }
        const r = addBits(a, b, w, cin); s.cols = r.cols;
        yield { d: `${w} full adders in a chain: each takes Aᵢ, Bᵢ and the carry from the adder to its right, so the carry ripples from bit 0 to bit ${w - 1}` };
        for (let i = 0; i < w; i++) { const c = r.cols[w - 1 - i]; s.done = i + 1; yield { d: `FA${i}: A=${c.x}, B=${c.y}, Cin=${c.cin} → S = A ⊕ B ⊕ Cin = ${c.s}, Cout = AB + Cin(A ⊕ B) = ${c.cout}` }; }
        s.phase = 'done'; s.res = r;
        yield { d: `sum ${r.sum} with carry out ${r.C}: ${parseInt2(a)} + ${parseInt2(b)} + ${cin} = ${parseInt2(r.sum) + r.C * pow2(w)}` };
      }
    },
    render(s) {
      if (s.phase === 'idle') return '';
      const w = s.a.length; const boxW = 64, gap = 26, x0 = 50, y0 = 60;
      const W = x0 + w * (boxW + gap) + 40, H = 170;
      let g = svgOpen(W, H) + defs();
      for (let i = 0; i < w; i++) {
        const bit = w - 1 - i;   // leftmost box is the most significant bit
        const x = x0 + i * (boxW + gap); const col = s.cols[i]; const donei = bit < s.done; const cur = s.phase !== 'done' && bit === s.done - 1;
        g += rect(x, y0, boxW, 50, cur ? C.warnBg : donei ? C.okBg : '#fff', cur ? C.warn : donei ? C.ok : C.ink, 6) + text(x + boxW / 2, y0 + 30, `FA${bit}`, 'arch-val');
        g += line(x + 18, y0 - 26, x + 18, y0, C.line) + text(x + 18, y0 - 30, `A${bit}=${s.a[i]}`, 'arch-idx');
        g += line(x + 46, y0 - 26, x + 46, y0, C.line) + text(x + 46, y0 - 30, `B${bit}=${s.b[i]}`, 'arch-idx');
        g += arrow(x + boxW / 2, y0 + 50, x + boxW / 2, y0 + 78, donei ? C.ok : C.line, 1.6, donei ? 'arch-ah-ok' : 'arch-ah') + text(x + boxW / 2, y0 + 94, `S${bit}${donei ? ' = ' + col.s : ''}`, 'arch-small');
        // carry into this box from the right (bit-1) — drawn as an arrow from the right neighbour
        const cinv = donei || cur ? col.cin : (bit === 0 ? s.cin : null);
        const rx = x + boxW + gap;
        if (i < w - 1) g += arrow(rx, y0 + 25, x + boxW, y0 + 25, cinv === 1 ? C.hi : C.line, cinv === 1 ? 2.4 : 1.5, cinv === 1 ? 'arch-ah-hi' : 'arch-ah') + text(x + boxW + gap / 2, y0 + 18, `C${bit}${cinv === null ? '' : '=' + cinv}`, 'arch-idx');
        else g += arrow(x + boxW + 30, y0 + 25, x + boxW, y0 + 25, s.cin ? C.hi : C.line, 1.6, s.cin ? 'arch-ah-hi' : 'arch-ah') + text(x + boxW + 36, y0 + 29, `Cin=${s.cin}`, 'arch-idx', 'text-anchor="start"');
        if (i === 0) { const co = s.done === w ? s.cols[0].cout : null; g += arrow(x, y0 + 25, x - 30, y0 + 25, co === 1 ? C.hi : C.line, co === 1 ? 2.4 : 1.5, co === 1 ? 'arch-ah-hi' : 'arch-ah') + text(x - 34, y0 + 29, `Cout${co === null ? '' : '=' + co}`, 'arch-idx', 'text-anchor="end"'); }
      }
      g += '</svg>';
      const cur = s.phase !== 'done' && s.done ? s.cols[w - s.done] : null;
      const tt = [[0, 0, 0, 0, 0], [0, 0, 1, 1, 0], [0, 1, 0, 1, 0], [0, 1, 1, 0, 1], [1, 0, 0, 1, 0], [1, 0, 1, 0, 1], [1, 1, 0, 0, 1], [1, 1, 1, 1, 1]];
      const side = `<div class="arch-side-title">full adder</div>` + table(['A', 'B', 'Cin', 'S', 'Cout'], tt.map(r => r.map((v, k) => ({ v: String(v), cls: 'mono' + (k >= 3 ? ' k' : '') }))), { cls: 'arch-grid arch-tiny', rowCls: i => cur && tt[i][0] === cur.x && tt[i][1] === cur.y && tt[i][2] === cur.cin ? 'hl' : '' });
      return { html: g, side };
    }
  };

  const ALU_OPS = ['add', 'sub', 'and', 'or', 'xor', 'inc', 'dec', 'neg', 'not', 'shl', 'shr'];
  MODES.alu = {
    title: 'Arithmetic logic unit',
    init() { return { phase: 'idle', a: 0, b: 0, w: 8, op: 'add', x: null, flags: null }; },
    controls: [{ kind: 'number', name: 'a', label: 'A', default: 6 }, { kind: 'number', name: 'b', label: 'B', default: 3 }, { kind: 'number', name: 'bits', label: 'bits', default: 8 }, { kind: 'select', name: 'op', label: 'operation', options: ALU_OPS, default: 'add' }, { kind: 'button', label: 'run', op: 'run', args: ['a', 'b', 'bits', 'op'] }],
    auto: { op: 'run', args: ['a', 'b', 'bits', 'op'] },
    ops: {
      *run(s, [a0, b0, w0, op0]) {
        const a = lit(a0), b = lit(b0), w = num(w0, 8), op = ALU_OPS.includes(op0) ? op0 : 'add';
        Object.assign(s, { phase: 'run', a, b, w, op, x: null, flags: null });
        if (!Number.isInteger(a) || !Number.isInteger(b)) { yield fail('operands must be integers'); return; }
        const half = pow2(w - 1);
        if (a < -half || a >= pow2(w) || b < -half || b >= pow2(w)) { yield fail(`operands must fit in ${w} bits`); return; }
        const A = bits(a, w), B = bits(b, w); s.A = A; s.B = B;
        const unary = ['inc', 'dec', 'neg', 'not', 'shl', 'shr'].includes(op);
        yield { d: `A = ${a} = ${A}${unary ? '' : `, B = ${b} = ${B}`}; operation ${op}` };
        let X, C = 0, V = 0, how;
        const ones = '1'.repeat(w);
        if (op === 'add') { const r = addBits(A, B, w, 0); X = r.sum; C = r.C; V = r.V; how = `A + B through the adder`; }
        else if (op === 'sub') { const nb = [...B].map(c => c === '1' ? '0' : '1').join(''); const r = addBits(A, nb, w, 1); X = r.sum; C = r.C; V = r.V; how = `A − B = A + B' + 1`; }
        else if (op === 'and') { X = [...A].map((c, i) => (+c & +B[i]) + '').join(''); how = 'bit-wise AND'; }
        else if (op === 'or') { X = [...A].map((c, i) => (+c | +B[i]) + '').join(''); how = 'bit-wise OR'; }
        else if (op === 'xor') { X = [...A].map((c, i) => (+c ^ +B[i]) + '').join(''); how = 'bit-wise XOR'; }
        else if (op === 'inc') { const r = addBits(A, bits(1, w), w, 0); X = r.sum; C = r.C; V = r.V; how = 'A + 1'; }
        else if (op === 'dec') { const r = addBits(A, ones, w, 0); X = r.sum; C = r.C; V = r.V; how = 'A + (−1) = A + 111…1'; }
        else if (op === 'neg') { const na = [...A].map(c => c === '1' ? '0' : '1').join(''); const r = addBits(na, bits(1, w), w, 0); X = r.sum; C = r.C; V = r.V; how = "−A = A' + 1"; }
        else if (op === 'not') { X = [...A].map(c => c === '1' ? '0' : '1').join(''); how = 'complement every bit'; }
        else if (op === 'shl') { X = A.slice(1) + '0'; C = +A[0]; how = 'shift left one place (×2), the bit shifted out goes to C'; }
        else { X = '0' + A.slice(0, -1); C = +A[w - 1]; how = 'shift right one place (÷2), the bit shifted out goes to C'; }
        s.x = X;
        yield { d: `${how}: X = ${X} (unsigned ${parseInt2(X)}, signed ${signedVal(X)})` };
        const N = +X[0], Z = X.indexOf('1') < 0 ? 1 : 0;
        s.flags = { N, Z, C, V }; s.phase = 'done';
        yield { d: `flags: N=${N} (sign bit of X), Z=${Z} (all bits of X NORed), C=${C} (carry out), V=${V} (carry into the sign bit ≠ carry out of it)${op === 'sub' ? ` — a compare instruction is this subtraction with X thrown away: ${a} < ${b} shows as N ≠ V (${N !== V ? 'true' : 'false'}), ${a} == ${b} as Z=${Z}` : ''}` };
      }
    },
    render(s) {
      if (s.phase === 'idle') return '';
      const W = 420, H = 190; let g = svgOpen(W, H) + defs();
      const x = 130, y = 40;
      g += `<path d="M ${x} ${y} L ${x + 160} ${y} L ${x + 130} ${y + 90} L ${x + 30} ${y + 90} L ${x + 10} ${y + 60} L ${x + 0} ${y + 40} z" fill="#fff" stroke="${C.ink}" stroke-width="1.6"/>`;
      g += text(x + 80, y + 55, 'ALU', 'arch-val');
      g += arrow(x + 40, y - 30, x + 40, y, C.blue, 1.8, 'arch-ah-blue') + text(x + 40, y - 34, `A = ${s.A}`, 'arch-idx', `fill="${C.blue}"`);
      g += arrow(x + 120, y - 30, x + 120, y, C.blue, 1.8, 'arch-ah-blue') + text(x + 120, y - 34, `B = ${s.B}`, 'arch-idx', `fill="${C.blue}"`);
      g += arrow(x + 200, y + 45, x + 165, y + 45, C.purple, 1.6, 'arch-ah') + text(x + 206, y + 49, s.op, 'arch-small', `text-anchor="start" fill="${C.purple}"`);
      g += arrow(x + 80, y + 90, x + 80, y + 125, s.x ? C.hi : C.line, 1.8, s.x ? 'arch-ah-hi' : 'arch-ah') + text(x + 80, y + 140, `X = ${s.x || '?'}`, 'arch-val', s.x ? `fill="${C.hi}"` : '');
      if (s.flags) ['N', 'Z', 'C', 'V'].forEach((f, i) => { const fx = 20 + i * 26; g += rect(fx, y + 110, 22, 22, s.flags[f] ? C.hiBg : '#fff', s.flags[f] ? C.hi : C.line, 4) + text(fx + 11, y + 125, f + s.flags[f], 'arch-small'); });
      else text(40, y + 125, 'N Z C V', 'arch-small');
      return g + '</svg>';
    }
  };

  // latches and flip-flops driven by signal strings over time slots; Q follows with a visible lag
  const DEVICES = {
    'rs-latch': { title: 'R-S latch', inputs: ['S', 'R'], level: true },
    'd-latch': { title: 'D latch', inputs: ['D', 'E'], level: true },
    'd-ff': { title: 'D flip-flop', inputs: ['D', 'CLK'] },
    't-ff': { title: 'T flip-flop', inputs: ['T', 'CLK'] },
    'jk-ff': { title: 'J-K flip-flop', inputs: ['J', 'K', 'CLK'] }
  };
  MODES.timing = {
    title: 'Timing diagram',
    init(cfg) { return { phase: 'idle', device: cfg.device || 'd-ff', sig: {}, q: [], t: -1, T: 0, edge: cfg.edge === 'neg' ? 'neg' : 'pos', notes: [] }; },
    controls: [{ kind: 'select', name: 'device', label: 'device', options: Object.keys(DEVICES), default: 'd-ff' }, { kind: 'button', label: 'run', op: 'run', args: ['device'] }],
    auto: { op: 'run', args: ['device'] },
    ops: {
      *run(s, [dev0], cfg) {
        const device = DEVICES[dev0] ? dev0 : 'd-ff'; const D = DEVICES[device];
        const sig = {}; const given = cfg.signals || {};
        let T = 0;
        for (const name of D.inputs) { const raw = given[name] !== undefined ? String(given[name]).replace(/[^01]/g, '') : ''; sig[name] = raw; T = Math.max(T, raw.length); }
        if (!T) { T = 12; for (const name of D.inputs) if (!sig[name]) sig[name] = name === 'CLK' ? '01'.repeat(6) : name === 'E' ? '000111000111' : name === 'R' || name === 'K' ? '000000110000' : '001100001100'; }
        for (const name of D.inputs) { if (!sig[name]) sig[name] = name === 'CLK' ? '01'.repeat(Math.ceil(T / 2)).slice(0, T) : '0'.repeat(T); sig[name] = sig[name].padEnd(T, sig[name].slice(-1) || '0').slice(0, T); }
        Object.assign(s, { phase: 'run', device, sig, q: [], t: -1, T, notes: [] });
        yield { d: `${D.title}: ${D.level ? 'level-triggered — the output can change whenever the enabling input is held high' : `edge-triggered — the output changes only on the ${s.edge === 'neg' ? 'falling' : 'rising'} edge of CLK`}; inputs ${D.inputs.join(', ')} over ${T} time slots` };
        let q = 0, qbar = 1, invalid = false;
        for (let t = 0; t < T; t++) {
          const at = n => +sig[n][t], prev = n => t ? +sig[n][t - 1] : 0;
          let note = 'hold';
          const edge = D.level ? false : s.edge === 'neg' ? (prev('CLK') === 1 && at('CLK') === 0) : (prev('CLK') === 0 && at('CLK') === 1);
          if (device === 'rs-latch') { const S = at('S'), R = at('R'); invalid = false; if (S && R) { q = 0; qbar = 0; invalid = true; note = 'S=R=1: invalid, both outputs 0'; } else if (S) { note = q ? 'S=1: already set' : 'S=1: set, Q → 1'; q = 1; qbar = 0; } else if (R) { note = q ? 'R=1: reset, Q → 0' : 'R=1: already clear'; q = 0; qbar = 1; } else { note = invalid ? 'S=R=0 after 1,1: race' : 'S=R=0: hold'; qbar = 1 - q; } }
          else if (device === 'd-latch') { const Dv = at('D'), E = at('E'); if (E) { note = q === Dv ? `E=1: Q follows D (${Dv})` : `E=1: Q follows D → ${Dv}`; q = Dv; } else note = 'E=0: hold'; qbar = 1 - q; }
          else if (device === 'd-ff') { if (edge) { const Dv = at('D'); note = `clock edge: sample D=${Dv} → Q=${Dv}`; q = Dv; } else note = at('D') !== q ? `D=${at('D')} but no edge: ignored` : 'no edge: hold'; qbar = 1 - q; }
          else if (device === 't-ff') { if (edge) { if (at('T')) { q = 1 - q; note = `clock edge with T=1: toggle → Q=${q}`; } else note = 'clock edge with T=0: hold'; } else note = 'no edge: hold'; qbar = 1 - q; }
          else { if (edge) { const J = at('J'), K = at('K'); if (J && K) { q = 1 - q; note = `edge, J=K=1: toggle → Q=${q}`; } else if (J) { q = 1; note = 'edge, J=1: set'; } else if (K) { q = 0; note = 'edge, K=1: reset'; } else note = 'edge, J=K=0: hold'; } else note = 'no edge: hold'; qbar = 1 - q; }
          s.q.push({ q, qbar, invalid }); s.notes.push(note); s.t = t;
          yield { d: `t=${t}: ${D.inputs.map(n => n + '=' + at(n)).join(' ')} — ${note}` };
        }
        s.phase = 'done';
        yield { d: D.level ? 'while the enable is high, glitches on the data input pass straight through — that is why registers are built from edge-triggered flip-flops' : 'between edges the inputs may change freely: the flip-flop only looks at them for an instant, so all registers in a CPU update together on the clock' };
      }
    },
    render(s) {
      if (s.phase === 'idle') return '';
      const D = DEVICES[s.device]; const names = D.inputs.concat(['Q']).concat(s.device === 'rs-latch' ? ["Q'"] : []);
      const T = s.T, slot = 36, x0 = 60, rowH = 44, H = 20 + names.length * rowH + 10, W = x0 + T * slot + 30;
      let g = svgOpen(W, H) + defs();
      for (let t = 0; t <= T; t++) g += line(x0 + t * slot, 10, x0 + t * slot, H - 10, '#eef2f7', 1);
      if (s.t >= 0 && s.phase !== 'done') g += rect(x0 + s.t * slot, 8, slot, H - 16, C.warnBg, 'none', 4);
      names.forEach((n, r) => {
        const yTop = 20 + r * rowH + 6, yBot = yTop + 26;
        g += text(x0 - 10, (yTop + yBot) / 2 + 4, n, 'arch-small', 'text-anchor="end"');
        const isOut = n === 'Q' || n === "Q'";
        const val = t => isOut ? (t < s.q.length ? (n === 'Q' ? s.q[t].q : s.q[t].qbar) : null) : +s.sig[n][t];
        const lag = isOut ? 8 : 0;
        let prev = null;
        for (let t = 0; t < T; t++) {
          const v = val(t); if (v === null) break;
          const y = v ? yTop : yBot; const xa = x0 + t * slot + lag, xb = x0 + (t + 1) * slot + lag;
          const col = isOut ? (s.q[t].invalid ? C.hi : C.blue) : n === 'CLK' ? C.muted : C.ink;
          if (prev !== null && prev !== v) g += line(xa, prev ? yTop : yBot, xa, y, col, 2);
          g += line(xa, y, Math.min(xb, x0 + T * slot), y, col, 2);
          if (!isOut && n === 'CLK' && t && +s.sig.CLK[t - 1] !== v && ((s.edge === 'neg') === (v === 0))) g += `<path d="M ${xa - 4} ${(yTop + yBot) / 2 + 3} l 4 -7 l 4 7 z" fill="${C.purple}"/>`;
          prev = v;
        }
      });
      for (let t = 0; t < T; t++) g += text(x0 + t * slot + slot / 2, H - 2, String(t), 'arch-idx');
      return g + '</svg>';
    }
  };

  /* ═══════════════════════ BUS DATAPATH (register-transfer notation) ═══════════════════════ */
  const RTN_REGS = ['PC', 'IR', 'MAR', 'MDR', 'ACC', 'R1', 'R2', 'R3'];
  const hex = (v, w) => '$' + (v >>> 0).toString(16).toUpperCase().padStart(w || 2, '0');
  function parseAddrMap(m) {   // { "$10": 5, "16": 7 } or [v0, v1, …] → { addr: value }
    const out = {};
    if (Array.isArray(m)) m.forEach((v, i) => { out[i] = lit(v); });
    else if (m && typeof m === 'object') for (const k of Object.keys(m)) out[lit(k)] = lit(m[k]);
    return out;
  }
  MODES.rtn = {
    title: 'Bus datapath',
    init(cfg) {
      const regs = {}; for (const r of RTN_REGS) regs[r] = 0;
      const given = cfg.regs || {}; for (const k of Object.keys(given)) if (RTN_REGS.includes(k.toUpperCase())) regs[k.toUpperCase()] = lit(given[k]);
      return { phase: 'idle', regs, mem: parseAddrMap(cfg.memory), lhs: null, rhs: null, bus: null, hl: {}, w: num(cfg.width, 8), lines: [], pc: -1, op: null };
    },
    controls: [{ kind: 'textarea', name: 'program', label: 'transfers', default: 'PC → MAR\nM[MAR] → MDR\nMDR → IR\nPC + 1 → PC', rows: 5 }, { kind: 'button', label: 'run', op: 'run', args: ['program'] }],
    auto: { op: 'run', args: ['program'] },
    ops: {
      *run(s, [prog]) {
        const lines = String(prog || '').split('\n').map(l => l.replace(/;.*$/, '').trim()).filter(Boolean);
        s.lines = lines; s.phase = 'run'; s.pc = -1;
        const mask = pow2(s.w) - 1;
        const isReg = t => RTN_REGS.includes(t);
        const val = t => { if (isReg(t)) return s.regs[t]; if (t === 'M[MAR]') return s.mem[s.regs.MAR] || 0; const v = lit(t.replace(/^#/, '')); if (Number.isNaN(v)) throw new Error(`unknown source ${t}`); return v; };
        const norm = l => l.replace(/\s+/g, ' ').replace(/->/g, '→').replace(/<-/g, '←').replace(/\bM\s*\[\s*MAR\s*\]/gi, 'M[MAR]').toUpperCase().replace(/M\[MAR\]/g, 'M[MAR]');
        for (let i = 0; i < lines.length; i++) {
          s.pc = i; const l = norm(lines[i]);
          let src, dst;
          if (l.includes('→')) { [src, dst] = l.split('→').map(x => x.trim()); } else if (l.includes('←')) { [dst, src] = l.split('←').map(x => x.trim()); } else { yield fail(`line ${i + 1}: expected "source → destination" or "destination ← source"`); return; }
          s.hl = {}; s.bus = null;
          if (!isReg(dst) && dst !== 'M[MAR]') { yield fail(`line ${i + 1}: cannot load into ${dst}`); return; }
          const m = /^(.+?) ([+\-&|^]) (.+)$/.exec(src) || /^(.+?)([+\-])(1)$/.exec(src);
          try {
            if (m) {
              // two-operand ALU transfer: three micro-steps through the LHS and RHS latches
              const [, x, op, y] = m;
              s.hl = { src: x, dst: 'LHS', bus: true }; s.bus = val(x); s.lhs = s.bus;
              yield { d: `${lines[i]} — first ${x} → LHS: ${x}enable puts ${x} on the bus, LHSload latches it` };
              s.hl = { src: y, dst: 'RHS', bus: true }; s.bus = val(y); s.rhs = s.bus;
              yield { d: `then ${y} → RHS${isReg(y) ? `: ${y}enable, RHSload` : ': the constant is driven onto the bus, RHSload'}` };
              const a = s.lhs, b = s.rhs; const r = (op === '+' ? a + b : op === '-' ? a - b : op === '&' ? a & b : op === '|' ? a | b : a ^ b) & mask;
              s.hl = { src: 'ALU', dst, bus: true }; s.bus = r; s.regs[dst] = r; if (dst === 'M[MAR]') s.mem[s.regs.MAR] = r;
              yield { d: `ALU → ${dst}: operation = ${op === '+' ? 'add' : op === '-' ? 'sub' : op === '&' ? 'and' : op === '|' ? 'or' : 'xor'}, ALUenable, ${dst}load; ${a} ${op} ${b} = ${r}` };
            } else if (src === 'M[MAR]') {
              if (dst !== 'MDR') { yield fail(`line ${i + 1}: memory is read only through MDR`); return; }
              const a = s.regs.MAR; s.regs.MDR = s.mem[a] || 0; s.hl = { src: 'MEM', dst: 'MDR', mem: true };
              yield { d: `${lines[i]} — memory read: the address lines carry MAR = ${hex(a, 2)}, output enable on the chip, MDRload; MDR = ${s.regs.MDR}` };
            } else if (dst === 'M[MAR]') {
              if (src !== 'MDR') { yield fail(`line ${i + 1}: memory is written only from MDR`); return; }
              const a = s.regs.MAR; s.mem[a] = s.regs.MDR; s.hl = { src: 'MDR', dst: 'MEM', mem: true };
              yield { d: `${lines[i]} — memory write: address MAR = ${hex(a, 2)}, MDR's buffer enabled onto the data lines, write enable; M[${hex(a, 2)}] = ${s.regs.MDR}` };
            } else {
              const v = val(src) & mask; s.hl = { src: isReg(src) ? src : 'CONST', dst, bus: true }; s.bus = v; s.regs[dst] = v;
              yield { d: `${lines[i]} — ${isReg(src) ? `${src}enable puts ${src} on the bus` : 'the constant is driven onto the bus'}, ${dst}load latches it at the clock: ${dst} = ${v}` };
            }
          } catch (e) { yield fail(`line ${i + 1}: ${e.message}`); return; }
        }
        s.phase = 'done'; s.hl = {}; s.bus = null; s.pc = -1;
        yield { d: `done: ${lines.length} transfer${lines.length === 1 ? '' : 's'} — each one is a pattern of enable and load signals the control unit asserts for one clock cycle` };
      }
    },
    render(s) {
      const W = 560, H = 330; let g = svgOpen(W, H) + defs();
      const busX = 250, top = 20, bot = H - 20;
      const busOn = s.hl.bus;
      g += line(busX, top, busX, bot, busOn ? C.hi : C.line, busOn ? 5 : 3) + text(busX, 14, busOn ? `bus = ${s.bus}` : 'bus', 'arch-small', busOn ? `fill="${C.hi}" font-weight="700"` : '');
      const box = (name, x, y, w, val, tone) => { const [bg, st] = toneFill(tone); g += rect(x, y, w, 26, bg, st, 5) + text(x + 8, y + 17, name, 'arch-small', 'text-anchor="start"') + text(x + w - 8, y + 17, String(val), 'arch-val', 'text-anchor="end"'); };
      const tone = name => s.hl.dst === name ? 'blue' : s.hl.src === name ? 'ok' : '';
      RTN_REGS.forEach((r, i) => {
        const y = 30 + i * 34; const x = 40; const w = 130;
        box(r, x, y, w, s.regs[r], tone(r));
        const on = s.hl.src === r || s.hl.dst === r;
        g += line(x + w, y + 13, busX, y + 13, on ? (s.hl.dst === r ? C.blue : C.ok) : C.line, on ? 2.4 : 1.2);
        if (s.hl.src === r) g += text(x + w + 30, y + 9, 'enable', 'arch-idx', `fill="${C.ok}"`);
        if (s.hl.dst === r) g += text(x + w + 30, y + 9, 'load', 'arch-idx', `fill="${C.blue}"`);
      });
      // ALU with LHS / RHS latches on the right
      box('LHS', 330, 40, 90, s.lhs === null ? '' : s.lhs, tone('LHS')); box('RHS', 440, 40, 90, s.rhs === null ? '' : s.rhs, tone('RHS'));
      g += line(busX, 53, 330, 53, s.hl.dst === 'LHS' ? C.blue : C.line, s.hl.dst === 'LHS' ? 2.4 : 1.2);
      g += line(busX, 66, 440, 66, s.hl.dst === 'RHS' ? C.blue : C.line, s.hl.dst === 'RHS' ? 2.4 : 1.2) + line(440, 66, 440, 66, C.line);
      const ax = 350, ay = 90;
      g += `<path d="M ${ax} ${ay} L ${ax + 160} ${ay} L ${ax + 130} ${ay + 50} L ${ax + 30} ${ay + 50} L ${ax + 10} ${ay + 30} L ${ax} ${ay + 20} z" fill="${s.hl.src === 'ALU' ? C.okBg : '#fff'}" stroke="${s.hl.src === 'ALU' ? C.ok : C.ink}" stroke-width="1.6"/>` + text(ax + 80, ay + 33, 'ALU', 'arch-val');
      g += line(375, 66, 375, ay, C.line, 1.2) + line(485, 66, 485, ay, C.line, 1.2);
      g += line(ax + 80, ay + 50, ax + 80, ay + 80, s.hl.src === 'ALU' ? C.ok : C.line, s.hl.src === 'ALU' ? 2.4 : 1.2) + line(busX, ay + 80, ax + 80, ay + 80, s.hl.src === 'ALU' ? C.ok : C.line, s.hl.src === 'ALU' ? 2.4 : 1.2);
      if (s.hl.src === 'ALU') g += text(ax + 100, ay + 72, 'ALUenable', 'arch-idx', `fill="${C.ok}"`);
      // memory box, wired to MAR and MDR
      const mx = 340, my = 200; const memOn = s.hl.mem;
      g += rect(mx, my, 190, 100, memOn ? C.warnBg : '#fff', memOn ? C.warn : C.ink, 6) + text(mx + 95, my + 18, 'memory', 'arch-small');
      const addrs = Object.keys(s.mem).map(Number).sort((a, b) => a - b).slice(0, 4);
      addrs.forEach((a, i) => g += text(mx + 12, my + 38 + i * 15, `${hex(a, 2)}: ${s.mem[a]}`, 'arch-idx', `text-anchor="start" ${a === s.regs.MAR && memOn ? `fill="${C.warn}" font-weight="700"` : ''}`));
      if (Object.keys(s.mem).length > 4) g += text(mx + 12, my + 98, '…', 'arch-idx', 'text-anchor="start"');
      g += poly([[170, 30 + 2 * 34 + 13], [200, 30 + 2 * 34 + 13], [200, my + 30], [mx, my + 30]], memOn ? C.warn : C.line, 1.2) + text(mx - 6, my + 26, 'address', 'arch-idx', 'text-anchor="end"');
      g += poly([[170, 30 + 3 * 34 + 13], [190, 30 + 3 * 34 + 13], [190, my + 70], [mx, my + 70]], memOn ? C.warn : C.line, 1.2) + text(mx - 6, my + 66, 'data', 'arch-idx', 'text-anchor="end"');
      g += '</svg>';
      const side = `<div class="arch-side-title">transfers</div>` + (s.lines.length ? '<ol class="arch-listing">' + s.lines.map((l, i) => `<li class="${i === s.pc ? 'cur' : ''}">${esc(l)}</li>`).join('') + '</ol>' : '<div class="arch-empty">none</div>');
      return { html: g, side };
    }
  };

  /* ═══════════════════════ A 6502-STYLE CPU ═══════════════════════ */
  // opcode table: mnemonic → { addressing mode: opcode }; modes: imp acc imm zp zpx zpy abs abx aby ind izx izy rel
  const OPS6502 = {
    LDA: { imm: 0xA9, zp: 0xA5, zpx: 0xB5, abs: 0xAD, abx: 0xBD, aby: 0xB9, izx: 0xA1, izy: 0xB1 },
    LDX: { imm: 0xA2, zp: 0xA6, zpy: 0xB6, abs: 0xAE, aby: 0xBE },
    LDY: { imm: 0xA0, zp: 0xA4, zpx: 0xB4, abs: 0xAC, abx: 0xBC },
    STA: { zp: 0x85, zpx: 0x95, abs: 0x8D, abx: 0x9D, aby: 0x99, izx: 0x81, izy: 0x91 },
    STX: { zp: 0x86, zpy: 0x96, abs: 0x8E }, STY: { zp: 0x84, zpx: 0x94, abs: 0x8C },
    ADC: { imm: 0x69, zp: 0x65, zpx: 0x75, abs: 0x6D, abx: 0x7D, aby: 0x79, izx: 0x61, izy: 0x71 },
    SBC: { imm: 0xE9, zp: 0xE5, zpx: 0xF5, abs: 0xED, abx: 0xFD, aby: 0xF9, izx: 0xE1, izy: 0xF1 },
    AND: { imm: 0x29, zp: 0x25, zpx: 0x35, abs: 0x2D, abx: 0x3D, aby: 0x39, izx: 0x21, izy: 0x31 },
    ORA: { imm: 0x09, zp: 0x05, zpx: 0x15, abs: 0x0D, abx: 0x1D, aby: 0x19, izx: 0x01, izy: 0x11 },
    EOR: { imm: 0x49, zp: 0x45, zpx: 0x55, abs: 0x4D, abx: 0x5D, aby: 0x59, izx: 0x41, izy: 0x51 },
    CMP: { imm: 0xC9, zp: 0xC5, zpx: 0xD5, abs: 0xCD, abx: 0xDD, aby: 0xD9, izx: 0xC1, izy: 0xD1 },
    CPX: { imm: 0xE0, zp: 0xE4, abs: 0xEC }, CPY: { imm: 0xC0, zp: 0xC4, abs: 0xCC },
    INC: { zp: 0xE6, zpx: 0xF6, abs: 0xEE, abx: 0xFE }, DEC: { zp: 0xC6, zpx: 0xD6, abs: 0xCE, abx: 0xDE },
    ASL: { acc: 0x0A, zp: 0x06, zpx: 0x16, abs: 0x0E, abx: 0x1E }, LSR: { acc: 0x4A, zp: 0x46, zpx: 0x56, abs: 0x4E, abx: 0x5E },
    ROL: { acc: 0x2A, zp: 0x26, zpx: 0x36, abs: 0x2E, abx: 0x3E }, ROR: { acc: 0x6A, zp: 0x66, zpx: 0x76, abs: 0x6E, abx: 0x7E },
    BIT: { zp: 0x24, abs: 0x2C },
    JMP: { abs: 0x4C, ind: 0x6C }, JSR: { abs: 0x20 }, RTS: { imp: 0x60 }, RTI: { imp: 0x40 }, BRK: { imp: 0x00 }, NOP: { imp: 0xEA },
    BPL: { rel: 0x10 }, BMI: { rel: 0x30 }, BVC: { rel: 0x50 }, BVS: { rel: 0x70 }, BCC: { rel: 0x90 }, BCS: { rel: 0xB0 }, BNE: { rel: 0xD0 }, BEQ: { rel: 0xF0 },
    CLC: { imp: 0x18 }, SEC: { imp: 0x38 }, CLI: { imp: 0x58 }, SEI: { imp: 0x78 }, CLV: { imp: 0xB8 }, CLD: { imp: 0xD8 }, SED: { imp: 0xF8 },
    PHA: { imp: 0x48 }, PLA: { imp: 0x68 }, PHP: { imp: 0x08 }, PLP: { imp: 0x28 },
    TAX: { imp: 0xAA }, TXA: { imp: 0x8A }, TAY: { imp: 0xA8 }, TYA: { imp: 0x98 }, TSX: { imp: 0xBA }, TXS: { imp: 0x9A },
    INX: { imp: 0xE8 }, INY: { imp: 0xC8 }, DEX: { imp: 0xCA }, DEY: { imp: 0x88 }
  };
  const MODE_NAMES = { imp: 'implied', acc: 'accumulator', imm: 'immediate', zp: 'direct (zero page)', zpx: 'zero page,X', zpy: 'zero page,Y', abs: 'direct (absolute)', abx: 'absolute indexed,X', aby: 'absolute indexed,Y', ind: 'indirect', izx: 'indexed indirect (zp,X)', izy: 'indirect indexed (zp),Y', rel: 'relative' };
  const MODE_LEN = { imp: 1, acc: 1, imm: 2, zp: 2, zpx: 2, zpy: 2, abs: 3, abx: 3, aby: 3, ind: 3, izx: 2, izy: 2, rel: 2 };
  const h16 = v => '$' + (v & 0xFFFF).toString(16).toUpperCase().padStart(4, '0'), h8 = v => '$' + (v & 0xFF).toString(16).toUpperCase().padStart(2, '0');
  function asm6502(src, opts) {
    const lines = String(src).split('\n'); const labels = {}; const items = []; const errors = [];
    const o = opts || {};
    const evalExpr = (e, strict) => {
      e = e.trim();
      let m;
      if ((m = /^([<>])(.+)$/.exec(e))) { const v = evalExpr(m[2], strict); return v === null ? null : m[1] === '<' ? v & 0xFF : (v >> 8) & 0xFF; }
      if ((m = /^(.+?)\s*([+-])\s*(.+)$/.exec(e)) && !/^['$%]/.test(e)) { const a = evalExpr(m[1], strict), b = evalExpr(m[3], strict); if (a === null || b === null) return null; return m[2] === '+' ? a + b : a - b; }
      if ((m = /^'(.)'$/.exec(e))) return e.charCodeAt(1);
      if (/^\$[0-9a-f]+$/i.test(e)) return parseInt(e.slice(1), 16);
      if (/^%[01]+$/.test(e)) return parseInt(e.slice(1), 2);
      if (/^\d+$/.test(e)) return parseInt(e, 10);
      if (/^[A-Za-z_.][\w.]*$/.test(e)) { if (labels[e] !== undefined) return labels[e]; if (strict) throw new Error(`unknown label ${e}`); return null; }
      throw new Error(`bad expression ${e}`);
    };
    // pass 1: sizes and labels; pass 2: bytes
    for (let pass = 0; pass < 2; pass++) {
      let pc = o.org !== undefined ? o.org : 0x0200; let firstCode = null;
      items.length = 0;
      for (let ln = 0; ln < lines.length; ln++) {
        let l = lines[ln].replace(/;.*$/, '').trim(); if (!l) continue;
        let m;
        if ((m = /^([A-Za-z_.][\w.]*)\s*(?:=|\.?equ)\s*(.+)$/i.exec(l)) && !/^\.(org|byte|word|db|dw|res|ds|text|ascii)\b/i.test(l)) { try { const v = evalExpr(m[2], pass === 1); if (v !== null) labels[m[1]] = v; } catch (e) { if (pass) errors.push(`line ${ln + 1}: ${e.message}`); } continue; }
        if ((m = /^([A-Za-z_][\w]*):\s*(.*)$/.exec(l))) { labels[m[1]] = pc; l = m[2].trim(); if (!l) continue; }
        if ((m = /^\.?(org)\s+(.+)$/i.exec(l))) { pc = evalExpr(m[2], true); continue; }
        if ((m = /^\.?(byte|db)\s+(.+)$/i.exec(l))) {
          const vals = []; for (const part of m[2].match(/"[^"]*"|'[^']'|[^,]+/g)) { const p = part.trim(); if (/^"/.test(p)) for (const ch of p.slice(1, -1)) vals.push(ch.charCodeAt(0)); else { const v = evalExpr(p, pass === 1); vals.push(v === null ? 0 : v & 0xFF); } }
          items.push({ ln, addr: pc, bytes: vals, src: lines[ln].trim(), data: true }); pc += vals.length; continue;
        }
        if ((m = /^\.?(word|dw)\s+(.+)$/i.exec(l))) { const vals = []; for (const p of m[2].split(',')) { const v = evalExpr(p, pass === 1) || 0; vals.push(v & 0xFF, (v >> 8) & 0xFF); } items.push({ ln, addr: pc, bytes: vals, src: lines[ln].trim(), data: true }); pc += vals.length; continue; }
        if ((m = /^\.?(res|ds)\s+(.+)$/i.exec(l))) { const n = evalExpr(m[2], true); items.push({ ln, addr: pc, bytes: Array(n).fill(0), src: lines[ln].trim(), data: true }); pc += n; continue; }
        if ((m = /^\.?(text|ascii|asciiz)\s+"([^"]*)"$/i.exec(l))) { const vals = [...m[2]].map(c => c.charCodeAt(0)); if (/asciiz/i.test(m[1])) vals.push(0); items.push({ ln, addr: pc, bytes: vals, src: lines[ln].trim(), data: true }); pc += vals.length; continue; }
        const im = /^([A-Za-z]{3})\s*(.*)$/.exec(l);
        if (!im) { if (pass) errors.push(`line ${ln + 1}: cannot parse "${l}"`); continue; }
        const mn = im[1].toUpperCase(), opd = im[2].trim(); const tbl = OPS6502[mn];
        if (!tbl) { if (pass) errors.push(`line ${ln + 1}: unknown instruction ${mn}`); continue; }
        let mode, val = 0;
        try {
          if (!opd || opd.toUpperCase() === 'A') mode = tbl.acc !== undefined && opd ? 'acc' : tbl.imp !== undefined ? 'imp' : tbl.acc !== undefined ? 'acc' : null;
          else if ((m = /^#(.+)$/.exec(opd))) { mode = 'imm'; val = evalExpr(m[1], pass === 1) || 0; }
          else if ((m = /^\((.+),\s*X\)$/i.exec(opd))) { mode = 'izx'; val = evalExpr(m[1], pass === 1) || 0; }
          else if ((m = /^\((.+)\),\s*Y$/i.exec(opd))) { mode = 'izy'; val = evalExpr(m[1], pass === 1) || 0; }
          else if ((m = /^\((.+)\)$/.exec(opd))) { mode = 'ind'; val = evalExpr(m[1], pass === 1) || 0; }
          else if (tbl.rel !== undefined) { mode = 'rel'; val = evalExpr(opd, pass === 1); if (val === null) val = pc; }
          else if ((m = /^(.+),\s*([XY])$/i.exec(opd))) { const v = evalExpr(m[1], pass === 1); const idx = m[2].toUpperCase(); const zpm = idx === 'X' ? 'zpx' : 'zpy', abm = idx === 'X' ? 'abx' : 'aby'; mode = v !== null && v < 256 && tbl[zpm] !== undefined ? zpm : abm; val = v === null ? 0 : v; }
          else { const v = evalExpr(opd, pass === 1); mode = v !== null && v < 256 && tbl.zp !== undefined ? 'zp' : 'abs'; val = v === null ? 0 : v; }
        } catch (e) { if (pass) errors.push(`line ${ln + 1}: ${e.message}`); continue; }
        if (mode === null || tbl[mode] === undefined) { if (pass) errors.push(`line ${ln + 1}: ${mn} does not support ${MODE_NAMES[mode] || 'that'} addressing`); continue; }
        if (pass && ['zp', 'zpx', 'zpy', 'izx', 'izy'].includes(mode) && val > 255) { errors.push(`line ${ln + 1}: ${MODE_NAMES[mode]} needs a zero-page address (< $100), got ${h16(val)}`); continue; }
        const len = MODE_LEN[mode]; const bytes = [tbl[mode]];
        if (mode === 'rel') { const off = val - (pc + 2); if (pass && (off < -128 || off > 127)) errors.push(`line ${ln + 1}: branch target out of range`); bytes.push(off & 0xFF); }
        else if (len === 2) bytes.push(val & 0xFF); else if (len === 3) bytes.push(val & 0xFF, (val >> 8) & 0xFF);
        items.push({ ln, addr: pc, bytes, src: lines[ln].trim(), mn, mode, val: mode === 'rel' ? val : val & 0xFFFF });
        if (firstCode === null) firstCode = pc;
        pc += len;
      }
      if (pass === 1) { labels.__start = labels.start !== undefined ? labels.start : labels._start !== undefined ? labels._start : labels.reset !== undefined ? labels.reset : firstCode; }
    }
    return { items, labels, errors };
  }
  const P_FLAGS = ['C', 'Z', 'I', 'D', 'B', '-', 'V', 'N'];
  MODES.cpu = {
    title: '6502-style CPU',
    init(cfg) {
      const st = { phase: 'idle', regs: { A: 0, X: 0, Y: 0, S: 0xFF, PC: 0 }, P: { N: 0, V: 0, B: 0, D: 0, I: 0, Z: 0, C: 0 }, mem: {}, listing: [], labels: {}, err: null, halted: false, count: 0, micro: !!cfg.micro, ir: { MAR: 0, MDR: 0, IR: 0 }, hl: {}, inIsr: false, irqAt: cfg.interrupt_at !== undefined ? num(cfg.interrupt_at, -1) : -1, irqDone: false, last: '' };
      const a = asm6502(cfg.program || '', { org: cfg.org !== undefined ? lit(cfg.org) : undefined });
      if (a.errors.length) { st.err = a.errors.join('; '); return st; }
      st.listing = a.items.map(it => ({ addr: it.addr, bytes: it.bytes.slice(0, 8), src: it.src, data: !!it.data, len: it.bytes.length }));
      for (const it of a.items) it.bytes.forEach((b, i) => { st.mem[it.addr + i] = b; });
      st.labels = a.labels;
      const given = parseAddrMap(cfg.memory); for (const k of Object.keys(given)) st.mem[k] = given[k] & 0xFF;
      st.regs.PC = a.labels.__start || 0x0200;
      const isr = cfg.isr !== undefined ? a.labels[cfg.isr] : a.labels.irq !== undefined ? a.labels.irq : a.labels.isr;
      if (isr !== undefined) { st.mem[0xFFFE] = isr & 0xFF; st.mem[0xFFFF] = (isr >> 8) & 0xFF; st.isr = isr; }
      st.codeAddrs = a.items.filter(i => !i.data).map(i => i.addr);
      return st;
    },
    controls: [{ kind: 'textarea', name: 'program', label: 'program', default: '', rows: 8 }, { kind: 'number', name: 'steps', label: 'instructions', default: 200 }, { kind: 'button', label: 'run', op: 'run', args: ['steps'] }],
    auto: { op: 'run', args: ['steps'] },
    ops: {
      *run(s, [n0], cfg, values) {
        // a program typed in the toolbar replaces the block's program
        if (values && values.program && values.program !== (cfg.program || '')) { const fresh = MODES.cpu.init(Object.assign({}, cfg, { program: values.program })); Object.assign(s, fresh); }
        if (s.err) { yield fail(s.err); return; }
        if (!s.listing.some(l => !l.data)) { yield fail('no instructions'); return; }
        const max = num(n0, 200);
        s.phase = 'run';
        if (s.count === 0) yield { d: `assembled ${s.listing.filter(l => !l.data).length} instructions; PC = ${h16(s.regs.PC)}${s.irqAt >= 0 ? `; an IRQ will arrive after instruction ${s.irqAt}` : ''} — ${s.micro ? 'each step is one register transfer of the fetch–decode–execute cycle' : 'each step runs one instruction'}` };
        for (let k = 0; k < max && !s.halted; k++) {
          if (s.irqAt >= 0 && !s.irqDone && s.count >= s.irqAt && !s.P.I) {
            s.irqDone = true; s.inIsr = true;
            const pc = s.regs.PC; push16(s, pc); push8(s, packP(s.P, 0)); s.P.I = 1;
            s.regs.PC = (s.mem[0xFFFE] || 0) | ((s.mem[0xFFFF] || 0) << 8);
            s.hl = { pc: s.regs.PC }; s.last = 'IRQ';
            yield { d: `IRQ line asserted: the CPU finishes the current instruction, pushes PC ${h16(pc)} and P onto the stack, sets I to mask further interrupts and jumps to the ISR address held at $FFFE/$FFFF = ${h16(s.regs.PC)}` };
            continue;
          }
          yield* exec6502(s);
        }
        if (!s.halted && max) yield { d: `paused after ${max} instructions — run again to continue` };
      }
    },
    render(s) {
      if (s.err) return `<div class="arch-empty">assembly error: ${esc(s.err)}</div>`;
      const pc = s.regs.PC;
      const rows = s.listing.map(l => [{ v: h16(l.addr), cls: 'mono muted' }, { v: l.bytes.map(b => b.toString(16).toUpperCase().padStart(2, '0')).join(' ') + (l.len > 8 ? ' …' : ''), cls: 'mono muted' }, { v: esc(l.src), cls: 'mono' + (l.data ? ' muted' : '') }]);
      const html = table(['addr', 'bytes', 'source'], rows, { cls: 'arch-listing-t', rowCls: i => s.listing[i].addr === pc && !s.listing[i].data ? 'cur' : (s.hl.addr !== undefined && s.listing[i].addr <= s.hl.addr && s.hl.addr < s.listing[i].addr + s.listing[i].len && s.listing[i].data ? 'hl' : '') });
      const r = s.regs;
      let side = `<div class="arch-side-title">registers</div><div class="arch-regs">` + [['A', h8(r.A), r.A], ['X', h8(r.X), r.X], ['Y', h8(r.Y), r.Y], ['S', h8(r.S), r.S], ['PC', h16(r.PC), r.PC]].map(([n, h, d]) => `<div class="${s.hl.reg === n ? 'hl' : ''}"><b>${n}</b> ${h} <span class="arch-muted">${d}</span></div>`).join('') + '</div>';
      side += `<div class="arch-side-title">flags</div><div class="arch-flags">${['N', 'V', 'B', 'D', 'I', 'Z', 'C'].map(f => tag(f + '=' + s.P[f], s.P[f] ? 'blue' : 'muted')).join(' ')}</div>`;
      if (s.micro) side += `<div class="arch-side-title">bus registers</div><div class="arch-regs"><div><b>MAR</b> ${h16(s.ir.MAR)}</div><div><b>MDR</b> ${h8(s.ir.MDR)}</div><div><b>IR</b> ${h8(s.ir.IR)}</div></div>`;
      const stack = []; for (let a = r.S + 1; a <= 0xFF; a++) stack.push(`${h16(0x100 + a)}: ${h8(s.mem[0x100 + a] || 0)}`);
      side += `<div class="arch-side-title">stack (top first)</div><div class="arch-mem">${stack.length ? stack.map(x => `<div>${x}</div>`).join('') : '<div class="arch-empty">empty</div>'}</div>`;
      const dataAddrs = Object.keys(s.mem).map(Number).filter(a => a < 0x100 || (a >= 0x200 && !s.codeAddrs.some(c => a >= c && a < c + 3 && s.listing.find(l => l.addr === c && !l.data))) ).filter(a => a < 0xFFFE && !(a >= 0x100 && a < 0x200)).sort((a, b) => a - b);
      const shown = dataAddrs.filter(a => !s.listing.some(l => !l.data && a >= l.addr && a < l.addr + l.len)).slice(0, 24);
      if (shown.length) side += `<div class="arch-side-title">memory</div><div class="arch-mem">${shown.map(a => `<div class="${s.hl.addr === a ? 'hl' : ''}">${h16(a)}: ${h8(s.mem[a])} <span class="arch-muted">${s.mem[a]}</span></div>`).join('')}</div>`;
      if (s.out) side += `<div class="arch-side-title">output ($F000)</div><pre class="arch-out">${esc(s.out)}</pre>`;
      return { html, side };
    }
  };
  const packP = (P, b) => (P.N << 7) | (P.V << 6) | 0x20 | (b << 4) | (P.D << 3) | (P.I << 2) | (P.Z << 1) | P.C;
  const unpackP = (v, P) => { P.N = (v >> 7) & 1; P.V = (v >> 6) & 1; P.D = (v >> 3) & 1; P.I = (v >> 2) & 1; P.Z = (v >> 1) & 1; P.C = v & 1; };
  const push8 = (s, v) => { s.mem[0x100 + s.regs.S] = v & 0xFF; s.regs.S = (s.regs.S - 1) & 0xFF; };
  const pop8 = s => { s.regs.S = (s.regs.S + 1) & 0xFF; return s.mem[0x100 + s.regs.S] || 0; };
  const push16 = (s, v) => { push8(s, (v >> 8) & 0xFF); push8(s, v & 0xFF); };
  const pop16 = s => { const lo = pop8(s); return lo | (pop8(s) << 8); };
  const setNZ = (s, v) => { s.P.N = (v >> 7) & 1; s.P.Z = (v & 0xFF) === 0 ? 1 : 0; };
  // decode the instruction at PC from the opcode table (reverse lookup)
  const DECODE = (() => { const t = {}; for (const mn of Object.keys(OPS6502)) for (const md of Object.keys(OPS6502[mn])) t[OPS6502[mn][md]] = { mn, md }; return t; })();
  function* exec6502(s) {
    const r = s.regs, M = s.mem; const rd = a => M[a & 0xFFFF] || 0;
    const pc0 = r.PC; const op = rd(pc0); const dec = DECODE[op];
    s.hl = {};
    if (!dec) { s.halted = true; yield fail(`PC = ${h16(pc0)}: byte ${h8(op)} is not an instruction the sim knows — the CPU ran into data`); return; }
    const { mn, md } = dec; const len = MODE_LEN[md];
    const b1 = rd(pc0 + 1), b2 = rd(pc0 + 2); const imm16 = b1 | (b2 << 8);
    const line = s.listing.find(l => l.addr === pc0); const srcText = line ? line.src.replace(/;.*$/, '').replace(/^[A-Za-z_]\w*:\s*/, '').replace(/\s+/g, ' ').trim() : `${mn}`;
    const micro = s.micro;
    if (micro) {
      s.ir.MAR = pc0; r.PC = (pc0 + 1) & 0xFFFF; yield { d: `fetch: PC → MAR (${h16(pc0)}), PC + 1 → PC` };
      s.ir.MDR = op; s.ir.IR = op; yield { d: `M[MAR] → MDR, MDR → IR: opcode ${h8(op)} decodes as ${mn} ${MODE_NAMES[md]}${len > 1 ? `, ${len - 1} operand byte${len > 2 ? 's' : ''} follow` : ''}` };
    } else r.PC = (pc0 + len) & 0xFFFF;
    // effective address
    let addr = null, val = null, how = '';
    const fetchOperandMicro = function* () {
      if (!micro) return;
      if (len >= 2) { s.ir.MAR = r.PC; r.PC = (r.PC + 1) & 0xFFFF; s.ir.MDR = b1; yield { d: `operand: PC → MAR, PC + 1 → PC, M[MAR] → MDR = ${h8(b1)}${md === 'imm' ? ' (the value itself)' : md === 'rel' ? ' (branch offset)' : ' (low address byte, kept in IDL)'}` }; }
      if (len === 3) { s.ir.MAR = r.PC; r.PC = (r.PC + 1) & 0xFFFF; s.ir.MDR = b2; yield { d: `PC → MAR, PC + 1 → PC, M[MAR] → MDR = ${h8(b2)} (high address byte); MDR → ABH, IDL → ABL forms ${h16(imm16)}` }; }
    };
    yield* fetchOperandMicro();
    switch (md) {
      case 'imm': val = b1; how = `#${h8(b1)}`; break;
      case 'zp': addr = b1; how = `${h8(b1)} (zero page)`; break;
      case 'zpx': addr = (b1 + r.X) & 0xFF; how = `${h8(b1)},X = ${h8(addr)}`; break;
      case 'zpy': addr = (b1 + r.Y) & 0xFF; how = `${h8(b1)},Y = ${h8(addr)}`; break;
      case 'abs': addr = imm16; how = h16(addr); break;
      case 'abx': addr = (imm16 + r.X) & 0xFFFF; how = `${h16(imm16)} + X(${r.X}) = ${h16(addr)}`; break;
      case 'aby': addr = (imm16 + r.Y) & 0xFFFF; how = `${h16(imm16)} + Y(${r.Y}) = ${h16(addr)}`; break;
      case 'ind': addr = rd(imm16) | (rd(imm16 + 1) << 8); how = `(${h16(imm16)}) → ${h16(addr)}`; break;
      case 'izx': { const zp = (b1 + r.X) & 0xFF; addr = rd(zp) | (rd(zp + 1) << 8); how = `(${h8(b1)},X): pointer at ${h8(zp)} → ${h16(addr)}`; break; }
      case 'izy': { const base = rd(b1) | (rd(b1 + 1) << 8); addr = (base + r.Y) & 0xFFFF; how = `(${h8(b1)}),Y: pointer ${h16(base)} + Y(${r.Y}) = ${h16(addr)}`; break; }
      case 'rel': addr = (r.PC + ((b1 & 0x80) ? b1 - 256 : b1)) & 0xFFFF; break;
    }
    if (addr !== null && md !== 'rel' && micro && !['STA', 'STX', 'STY', 'JMP', 'JSR'].includes(mn)) { s.ir.MAR = addr; s.ir.MDR = rd(addr); yield { d: `effective address ${how} → MAR, M[MAR] → MDR = ${h8(s.ir.MDR)}${md === 'ind' || md === 'izx' || md === 'izy' ? ' (after reading the pointer from memory first)' : ''}` }; }
    if (addr !== null && md !== 'rel' && !['STA', 'STX', 'STY', 'JMP', 'JSR', 'INC', 'DEC', 'ASL', 'LSR', 'ROL', 'ROR'].includes(mn)) val = rd(addr);
    const hlAddr = a => { s.hl.addr = a; };
    let d = '';
    const flagsTxt = () => `N=${s.P.N} Z=${s.P.Z}${s.P.C !== undefined ? ` C=${s.P.C}` : ''}`;
    const branch = (cond, name) => { if (cond) { r.PC = addr; d = `${srcText}: ${name} → taken, PC = ${h16(addr)}`; } else d = `${srcText}: ${name} → not taken`; };
    switch (mn) {
      case 'LDA': r.A = val; setNZ(s, val); s.hl.reg = 'A'; if (addr !== null) hlAddr(addr); d = `${srcText}: A = ${h8(val)}${addr !== null ? ` from ${how}` : ''}; ${flagsTxt()}`; break;
      case 'LDX': r.X = val; setNZ(s, val); s.hl.reg = 'X'; if (addr !== null) hlAddr(addr); d = `${srcText}: X = ${h8(val)}; ${flagsTxt()}`; break;
      case 'LDY': r.Y = val; setNZ(s, val); s.hl.reg = 'Y'; if (addr !== null) hlAddr(addr); d = `${srcText}: Y = ${h8(val)}; ${flagsTxt()}`; break;
      case 'STA': M[addr] = r.A; hlAddr(addr); d = `${srcText}: M[${h16(addr)}] = A = ${h8(r.A)}${addr === 0xF000 ? ' (memory-mapped output)' : ''}`; if (addr === 0xF000) s.out = (s.out || '') + String.fromCharCode(r.A); break;
      case 'STX': M[addr] = r.X; hlAddr(addr); d = `${srcText}: M[${h16(addr)}] = X = ${h8(r.X)}`; break;
      case 'STY': M[addr] = r.Y; hlAddr(addr); d = `${srcText}: M[${h16(addr)}] = Y = ${h8(r.Y)}`; break;
      case 'ADC': { const cin = s.P.C; const sum = r.A + val + cin; const res = sum & 0xFF; s.P.C = sum > 0xFF ? 1 : 0; s.P.V = (~(r.A ^ val) & (r.A ^ res) & 0x80) ? 1 : 0; d = `${srcText}: A = ${h8(r.A)} + ${h8(val)} + C(${cin}) = ${h8(res)}; C=${s.P.C} V=${s.P.V}`; r.A = res; setNZ(s, res); s.hl.reg = 'A'; d += ` N=${s.P.N} Z=${s.P.Z}`; break; }
      case 'SBC': { const diff = r.A - val - (1 - s.P.C); const res = diff & 0xFF; const oldA = r.A; s.P.C = diff >= 0 ? 1 : 0; s.P.V = ((oldA ^ val) & (oldA ^ res) & 0x80) ? 1 : 0; r.A = res; setNZ(s, res); s.hl.reg = 'A'; d = `${srcText}: A = ${h8(oldA)} − ${h8(val)} − (1 − C) = ${h8(res)}; C=${s.P.C} (1 means no borrow) V=${s.P.V} N=${s.P.N} Z=${s.P.Z}`; break; }
      case 'AND': r.A &= val; setNZ(s, r.A); s.hl.reg = 'A'; d = `${srcText}: A = A ∧ ${h8(val)} = ${h8(r.A)}; ${flagsTxt()}`; break;
      case 'ORA': r.A |= val; setNZ(s, r.A); s.hl.reg = 'A'; d = `${srcText}: A = A ∨ ${h8(val)} = ${h8(r.A)}; ${flagsTxt()}`; break;
      case 'EOR': r.A ^= val; setNZ(s, r.A); s.hl.reg = 'A'; d = `${srcText}: A = A ⊕ ${h8(val)} = ${h8(r.A)}; ${flagsTxt()}`; break;
      case 'CMP': case 'CPX': case 'CPY': { const reg = mn === 'CMP' ? r.A : mn === 'CPX' ? r.X : r.Y; const diff = (reg - val) & 0xFF; s.P.C = reg >= val ? 1 : 0; setNZ(s, diff); d = `${srcText}: ${mn[2] === 'P' ? 'A' : mn[2]} − ${h8(val)} = ${reg} − ${val} (result discarded); Z=${s.P.Z} (equal) C=${s.P.C} (≥ unsigned) N=${s.P.N}`; break; }
      case 'INC': { const v = (rd(addr) + 1) & 0xFF; M[addr] = v; setNZ(s, v); hlAddr(addr); d = `${srcText}: M[${h16(addr)}] = ${h8(v)}; ${flagsTxt()}`; break; }
      case 'DEC': { const v = (rd(addr) - 1) & 0xFF; M[addr] = v; setNZ(s, v); hlAddr(addr); d = `${srcText}: M[${h16(addr)}] = ${h8(v)}; ${flagsTxt()}`; break; }
      case 'INX': r.X = (r.X + 1) & 0xFF; setNZ(s, r.X); s.hl.reg = 'X'; d = `${srcText}: X = ${h8(r.X)} (${r.X}); ${flagsTxt()}`; break;
      case 'INY': r.Y = (r.Y + 1) & 0xFF; setNZ(s, r.Y); s.hl.reg = 'Y'; d = `${srcText}: Y = ${h8(r.Y)} (${r.Y}); ${flagsTxt()}`; break;
      case 'DEX': r.X = (r.X - 1) & 0xFF; setNZ(s, r.X); s.hl.reg = 'X'; d = `${srcText}: X = ${h8(r.X)} (${r.X}); ${flagsTxt()}`; break;
      case 'DEY': r.Y = (r.Y - 1) & 0xFF; setNZ(s, r.Y); s.hl.reg = 'Y'; d = `${srcText}: Y = ${h8(r.Y)} (${r.Y}); ${flagsTxt()}`; break;
      case 'ASL': case 'LSR': case 'ROL': case 'ROR': {
        const v = md === 'acc' ? r.A : rd(addr); let res;
        if (mn === 'ASL') { s.P.C = v >> 7; res = (v << 1) & 0xFF; } else if (mn === 'LSR') { s.P.C = v & 1; res = v >> 1; } else if (mn === 'ROL') { const c = s.P.C; s.P.C = v >> 7; res = ((v << 1) | c) & 0xFF; } else { const c = s.P.C; s.P.C = v & 1; res = (v >> 1) | (c << 7); }
        if (md === 'acc') { r.A = res; s.hl.reg = 'A'; } else { M[addr] = res; hlAddr(addr); }
        setNZ(s, res); d = `${srcText}: ${bits(v, 8)} → ${bits(res, 8)}; ${flagsTxt()}`; break;
      }
      case 'BIT': s.P.Z = (r.A & val) === 0 ? 1 : 0; s.P.N = val >> 7; s.P.V = (val >> 6) & 1; d = `${srcText}: A ∧ M = ${h8(r.A & val)}; Z=${s.P.Z} N=${s.P.N} V=${s.P.V} (bits 7 and 6 of M)`; break;
      case 'JMP': r.PC = addr; d = `${srcText}: PC = ${h16(addr)}${md === 'ind' ? ` (read from the pointer at ${h16(imm16)})` : ''}`; break;
      case 'JSR': push16(s, (r.PC - 1) & 0xFFFF); r.PC = addr; d = `${srcText}: push the return address ${h16((pc0 + 2) & 0xFFFF)} (last byte of this instruction) onto the stack, S = ${h8(r.S)}; PC = ${h16(addr)}`; break;
      case 'RTS': { const ret = (pop16(s) + 1) & 0xFFFF; r.PC = ret; d = `${srcText}: pop the return address and add 1 → PC = ${h16(ret)}, S = ${h8(r.S)}`; break; }
      case 'RTI': { unpackP(pop8(s), s.P); r.PC = pop16(s); s.inIsr = false; d = `${srcText}: pop P (I cleared again) and PC = ${h16(r.PC)} — the interrupted code resumes as if nothing happened`; break; }
      case 'BRK': s.halted = true; d = `${srcText}: BRK — the sim stops here (on a real 6502 this raises a software interrupt)`; break;
      case 'NOP': d = `${srcText}: nothing`; break;
      case 'BPL': branch(!s.P.N, 'N=0?'); break; case 'BMI': branch(!!s.P.N, 'N=1?'); break;
      case 'BVC': branch(!s.P.V, 'V=0?'); break; case 'BVS': branch(!!s.P.V, 'V=1?'); break;
      case 'BCC': branch(!s.P.C, 'C=0?'); break; case 'BCS': branch(!!s.P.C, 'C=1?'); break;
      case 'BNE': branch(!s.P.Z, 'Z=0?'); break; case 'BEQ': branch(!!s.P.Z, 'Z=1?'); break;
      case 'CLC': s.P.C = 0; d = `${srcText}: C = 0`; break; case 'SEC': s.P.C = 1; d = `${srcText}: C = 1 (SBC needs C=1 for a plain subtraction)`; break;
      case 'CLI': s.P.I = 0; d = `${srcText}: I = 0, interrupts enabled`; break; case 'SEI': s.P.I = 1; d = `${srcText}: I = 1, IRQ ignored`; break;
      case 'CLV': s.P.V = 0; d = `${srcText}: V = 0`; break; case 'CLD': s.P.D = 0; d = `${srcText}: D = 0`; break; case 'SED': s.P.D = 1; d = `${srcText}: D = 1 (decimal mode — not modelled)`; break;
      case 'PHA': push8(s, r.A); d = `${srcText}: M[${h16(0x100 + ((r.S + 1) & 0xFF))}] = A, S = ${h8(r.S)} (the stack grows down from $01FF)`; break;
      case 'PLA': r.A = pop8(s); setNZ(s, r.A); s.hl.reg = 'A'; d = `${srcText}: A = ${h8(r.A)} from the stack, S = ${h8(r.S)}`; break;
      case 'PHP': push8(s, packP(s.P, 1)); d = `${srcText}: push P, S = ${h8(r.S)}`; break;
      case 'PLP': unpackP(pop8(s), s.P); d = `${srcText}: P restored from the stack`; break;
      case 'TAX': r.X = r.A; setNZ(s, r.X); s.hl.reg = 'X'; d = `${srcText}: X = A = ${h8(r.X)}`; break;
      case 'TXA': r.A = r.X; setNZ(s, r.A); s.hl.reg = 'A'; d = `${srcText}: A = X = ${h8(r.A)}${micro ? ' (X → A on the internal bus, reset the cycle counter)' : ''}`; break;
      case 'TAY': r.Y = r.A; setNZ(s, r.Y); s.hl.reg = 'Y'; d = `${srcText}: Y = A = ${h8(r.Y)}`; break;
      case 'TYA': r.A = r.Y; setNZ(s, r.A); s.hl.reg = 'A'; d = `${srcText}: A = Y = ${h8(r.A)}`; break;
      case 'TSX': r.X = r.S; setNZ(s, r.X); s.hl.reg = 'X'; d = `${srcText}: X = S = ${h8(r.X)}`; break;
      case 'TXS': r.S = r.X; d = `${srcText}: S = X = ${h8(r.S)}`; break;
    }
    s.count++; s.last = mn;
    yield { d: micro ? `execute: ${d}` : d };
  }

  /* ═══════════════════════ x86-64 (NASM, Linux) ═══════════════════════ */
  const R64 = ['rax', 'rbx', 'rcx', 'rdx', 'rsi', 'rdi', 'rbp', 'rsp', 'r8', 'r9', 'r10', 'r11', 'r12', 'r13', 'r14', 'r15'];
  const REGMAP = (() => {
    const m = {};
    const r32 = ['eax', 'ebx', 'ecx', 'edx', 'esi', 'edi', 'ebp', 'esp'], r16 = ['ax', 'bx', 'cx', 'dx', 'si', 'di', 'bp', 'sp'], r8 = ['al', 'bl', 'cl', 'dl', 'sil', 'dil', 'bpl', 'spl'], r8h = ['ah', 'bh', 'ch', 'dh'];
    R64.forEach((n, i) => { m[n] = { i, size: 8 }; });
    r32.forEach((n, i) => { m[n] = { i, size: 4 }; }); r16.forEach((n, i) => { m[n] = { i, size: 2 }; }); r8.forEach((n, i) => { m[n] = { i, size: 1 }; }); r8h.forEach((n, i) => { m[n] = { i, size: 1, hi: true }; });
    for (let k = 8; k < 16; k++) { m[`r${k}d`] = { i: k, size: 4 }; m[`r${k}w`] = { i: k, size: 2 }; m[`r${k}b`] = { i: k, size: 1 }; }
    return m;
  })();
  const MASK = { 1: 0xFFn, 2: 0xFFFFn, 4: 0xFFFFFFFFn, 8: 0xFFFFFFFFFFFFFFFFn };
  const SIZE_NAMES = { byte: 1, word: 2, dword: 4, qword: 8 };
  const toSigned = (v, size) => { const m = MASK[size]; v &= m; const half = 1n << BigInt(size * 8 - 1); return v >= half ? v - m - 1n : v; };
  const bhex = (v, size) => '0x' + (v & MASK[size]).toString(16);
  const TEXT_BASE = 0x401000n, DATA_BASE = 0x402000n, BSS_BASE = 0x403000n, STACK_TOP = 0x7ffffffde000n;
  function asmX86(src) {
    const lines = String(src).split('\n'); const labels = {}; const equs = {}; const dataItems = []; const code = []; const errors = [];
    let section = '.text'; let dataPc = DATA_BASE, bssPc = BSS_BASE;
    const sizes = { db: 1, dw: 2, dd: 4, dq: 8, resb: 1, resw: 2, resd: 4, resq: 8 };
    const evalExpr = (e, here) => {
      const t = e.replace(/\s+/g, '');
      // split on the last top-level + or − (not a leading sign): "$ - msg", "msg + 1"
      for (let i = t.length - 1; i > 0; i--) if ((t[i] === '+' || t[i] === '-') && !/[+\-*]/.test(t[i - 1])) { const a = evalExpr(t.slice(0, i), here), b = evalExpr(t.slice(i + 1), here); return t[i] === '+' ? a + b : a - b; }
      let m;
      if (t === '$') return here;
      if ((m = /^'(.)'$/.exec(t))) return BigInt(t.charCodeAt(1));
      if (/^-?0x[0-9a-f]+$/i.test(t)) return BigInt(t);
      if (/^-?[0-9a-f]+h$/i.test(t)) return BigInt('0x' + t.slice(0, -1).replace('-', '')) * (t[0] === '-' ? -1n : 1n);
      if (/^-?0b[01]+$/i.test(t)) return BigInt(t);
      if (/^-?\d+$/.test(t)) return BigInt(t);
      if (equs[t] !== undefined) return equs[t];
      if (labels[t] !== undefined) return labels[t];
      throw new Error(`unknown symbol ${t}`);
    };
    // pass 1: labels and data layout
    const pending = [];
    for (let ln = 0; ln < lines.length; ln++) {
      let l = lines[ln].replace(/;.*$/, '').trim(); if (!l) continue;
      let m;
      if ((m = /^section\s+(\.\w+)/i.exec(l)) || (m = /^segment\s+(\.\w+)/i.exec(l))) { section = m[1].toLowerCase(); continue; }
      if (/^(global|extern|default|bits)\b/i.test(l)) continue;
      if ((m = /^([A-Za-z_.$][\w.$]*)\s+equ\s+(.+)$/i.exec(l))) { pending.push({ kind: 'equ', name: m[1], expr: m[2], here: section === '.data' ? dataPc : section === '.bss' ? bssPc : TEXT_BASE + BigInt(code.length) }); continue; }
      if ((m = /^([A-Za-z_.$][\w.$]*):\s*equ\s+(.+)$/i.exec(l))) { pending.push({ kind: 'equ', name: m[1], expr: m[2], here: section === '.data' ? dataPc : section === '.bss' ? bssPc : TEXT_BASE + BigInt(code.length) }); continue; }
      if ((m = /^([A-Za-z_.$][\w.$]*):\s*(.*)$/.exec(l))) { labels[m[1]] = section === '.data' ? dataPc : section === '.bss' ? bssPc : TEXT_BASE + BigInt(code.length); l = m[2].trim(); if (!l) continue; }
      if ((m = /^([A-Za-z_.$][\w.$]*)\s+(db|dw|dd|dq|resb|resw|resd|resq)\b\s*(.*)$/i.exec(l))) { labels[m[1]] = section === '.bss' ? bssPc : dataPc; l = `${m[2]} ${m[3]}`; }
      if ((m = /^(db|dw|dd|dq)\s+(.+)$/i.exec(l))) {
        const sz = sizes[m[1].toLowerCase()]; const parts = m[2].match(/"[^"]*"|'[^']*'|[^,]+/g) || []; const item = { addr: dataPc, sz, parts: parts.map(p => p.trim()), ln };
        let n = 0; for (const p of item.parts) n += /^["']/.test(p) ? p.length - 2 : 1;
        dataItems.push(item); dataPc += BigInt(n * sz); continue;
      }
      if ((m = /^(resb|resw|resd|resq)\s+(.+)$/i.exec(l))) { const sz = sizes[m[1].toLowerCase()]; const n = Number(evalExpr(m[2], bssPc)); dataItems.push({ addr: bssPc, sz, count: n, bss: true, ln }); bssPc += BigInt(n * sz); continue; }
      if (section === '.text') { const im = /^([a-z]+)\s*(.*)$/i.exec(l); if (!im) { errors.push(`line ${ln + 1}: cannot parse "${l}"`); continue; } code.push({ ln, mn: im[1].toLowerCase(), ops: im[2] ? (im[2].match(/"[^"]*"|'[^']*'|\[[^\]]*\]|[^,]+/g) || []).map(x => x.trim()) : [], src: lines[ln].trim() }); }
      else errors.push(`line ${ln + 1}: not a data directive in ${section}`);
    }
    for (const p of pending) { try { equs[p.name] = evalExpr(p.expr, p.here); } catch (e) { errors.push(`line ?: ${e.message}`); } }
    // data bytes
    const mem = {};
    const put = (addr, v, sz) => { let x = BigInt.asUintN(sz * 8, v); for (let i = 0; i < sz; i++) { mem[(addr + BigInt(i)).toString()] = Number(x & 0xFFn); x >>= 8n; } };
    const dataView = [];
    for (const it of dataItems) {
      if (it.bss) { for (let i = 0; i < it.count * it.sz; i++) mem[(it.addr + BigInt(i)).toString()] = 0; dataView.push({ addr: it.addr, len: it.count * it.sz, bss: true }); continue; }
      let a = it.addr;
      try { for (const p of it.parts) { if (/^["']/.test(p)) { for (const ch of p.slice(1, -1)) { put(a, BigInt(ch.charCodeAt(0)), it.sz); a += BigInt(it.sz); } } else { put(a, evalExpr(p, a), it.sz); a += BigInt(it.sz); } } } catch (e) { errors.push(`line ${it.ln + 1}: ${e.message}`); }
      dataView.push({ addr: it.addr, len: Number(a - it.addr), sz: it.sz });
    }
    return { code, labels, equs, mem, errors, dataView, evalExpr };
  }
  const JCC = { je: ['ZF'], jz: ['ZF'], jne: ['!ZF'], jnz: ['!ZF'], js: ['SF'], jns: ['!SF'], jc: ['CF'], jb: ['CF'], jnae: ['CF'], jnc: ['!CF'], jae: ['!CF'], jnb: ['!CF'], jo: ['OF'], jno: ['!OF'], ja: ['!CF', '!ZF'], jnbe: ['!CF', '!ZF'], jbe: ['CF|ZF'], jna: ['CF|ZF'], jl: ['SF!=OF'], jnge: ['SF!=OF'], jge: ['SF==OF'], jnl: ['SF==OF'], jle: ['ZF|SF!=OF'], jng: ['ZF|SF!=OF'], jg: ['!ZF', 'SF==OF'], jnle: ['!ZF', 'SF==OF'] };
  MODES.x86 = {
    title: 'x86-64 assembly',
    init(cfg) {
      const st = { phase: 'idle', regs: R64.map(() => 0n), flags: { ZF: 0, SF: 0, CF: 0, OF: 0 }, mem: {}, pc: 0, code: [], labels: {}, err: null, halted: false, exit: null, stdout: '', stdin: String(cfg.stdin || ''), count: 0, hl: {}, used: [], dataView: [] };
      const a = asmX86(cfg.program || '');
      if (a.errors.length) { st.err = a.errors.join('; '); return st; }
      st.code = a.code.map(c => ({ ln: c.ln, mn: c.mn, ops: c.ops, src: c.src })); st.labels = {}; for (const k of Object.keys(a.labels)) st.labels[k] = a.labels[k];
      st.equs = {}; for (const k of Object.keys(a.equs)) st.equs[k] = a.equs[k];
      st.mem = a.mem; st.dataView = a.dataView; st.regs[7] = STACK_TOP;
      const entry = a.labels._start !== undefined ? a.labels._start : a.labels.main !== undefined ? a.labels.main : TEXT_BASE;
      st.pc = Number(entry - TEXT_BASE);
      const used = new Set(); for (const c of st.code) for (const op of c.ops) for (const w of op.toLowerCase().match(/[a-z]+\d*[a-z]*/g) || []) if (REGMAP[w]) used.add(REGMAP[w].i);
      st.used = [...used].sort((x, y) => x - y);
      if (!st.code.length) st.err = 'no instructions';
      return st;
    },
    controls: [{ kind: 'textarea', name: 'program', label: 'program', default: '', rows: 10 }, { kind: 'text', name: 'stdin', label: 'stdin', default: '' }, { kind: 'number', name: 'steps', label: 'instructions', default: 500 }, { kind: 'button', label: 'run', op: 'run', args: ['steps'] }],
    auto: { op: 'run', args: ['steps'] },
    ops: {
      *run(s, [n0], cfg, values) {
        if (values && ((values.program && values.program !== (cfg.program || '')) || (values.stdin !== undefined && String(values.stdin) !== String(cfg.stdin || '')))) { const fresh = MODES.x86.init(Object.assign({}, cfg, { program: values.program || cfg.program, stdin: values.stdin })); Object.assign(s, fresh); }
        if (s.err) { yield fail(s.err); return; }
        const max = num(n0, 500); s.phase = 'run';
        if (s.count === 0) yield { d: `${s.code.length} instructions assembled; execution starts at _start; the stack pointer rsp = ${bhex(s.regs[7], 8)}` };
        for (let k = 0; k < max && !s.halted; k++) yield* execX86(s);
        if (!s.halted && max) yield { d: `paused after ${max} instructions — run again to continue` };
      }
    },
    render(s) {
      if (s.err) return `<div class="arch-empty">assembly error: ${esc(s.err)}</div>`;
      const cur = s.code[s.pc];
      const rows = s.code.map(c => [{ v: String(c.ln + 1), cls: 'mono muted' }, { v: esc(c.src), cls: 'mono' }]);
      const html = table(null, rows, { cls: 'arch-listing-t', rowCls: i => i === s.pc && !s.halted ? 'cur' : '' });
      const regRow = i => { const v = s.regs[i]; const sv = toSigned(v, 8); return `<div class="${s.hl.reg === i ? 'hl' : ''}"><b>${R64[i]}</b> ${bhex(v, 8)} <span class="arch-muted">${sv.toString()}</span></div>`; };
      let side = `<div class="arch-side-title">registers</div><div class="arch-regs">${(s.used.length ? s.used : [0]).map(regRow).join('')}${s.used.includes(7) ? '' : regRow(7)}</div>`;
      side += `<div class="arch-side-title">flags</div><div class="arch-flags">${['ZF', 'SF', 'CF', 'OF'].map(f => tag(f + '=' + s.flags[f], s.flags[f] ? 'blue' : 'muted')).join(' ')}</div>`;
      const sp = s.regs[7]; const stack = [];
      for (let a = sp; a < STACK_TOP && stack.length < 6; a += 8n) { let v = 0n; for (let i = 7; i >= 0; i--) v = (v << 8n) | BigInt(s.mem[(a + BigInt(i)).toString()] || 0); stack.push(`${bhex(a, 8)}: ${bhex(v, 8)}`); }
      side += `<div class="arch-side-title">stack (rsp first)</div><div class="arch-mem">${stack.length ? stack.map(x => `<div>${x}</div>`).join('') : '<div class="arch-empty">empty</div>'}</div>`;
      if (s.dataView.length) {
        side += `<div class="arch-side-title">data</div><div class="arch-mem">`;
        for (const dv of s.dataView) { const name = Object.keys(s.labels).find(k => s.labels[k] === dv.addr) || ''; const n = Math.min(dv.len, 24); const bytesArr = []; for (let i = 0; i < n; i++) bytesArr.push(s.mem[(dv.addr + BigInt(i)).toString()] || 0); const hexs = bytesArr.map(b => b.toString(16).padStart(2, '0')).join(' '); const asc = bytesArr.map(b => b >= 32 && b < 127 ? String.fromCharCode(b) : '·').join(''); side += `<div class="${s.hl.addr !== undefined && s.hl.addr >= dv.addr && s.hl.addr < dv.addr + BigInt(dv.len) ? 'hl' : ''}"><b>${esc(name)}</b> ${bhex(dv.addr, 8)}: ${hexs}${dv.len > n ? ' …' : ''} <span class="arch-muted">${esc(asc)}</span></div>`; }
        side += '</div>';
      }
      side += `<div class="arch-side-title">stdout</div><pre class="arch-out">${esc(s.stdout)}${s.exit !== null ? `<span class="arch-muted">[exit ${s.exit}]</span>` : ''}</pre>`;
      return { html, side };
    }
  };
  function* execX86(s) {
    const c = s.code[s.pc];
    if (!c) { s.halted = true; yield fail('ran past the end of the program without exiting'); return; }
    const R = s.regs, F = s.flags, M = s.mem;
    s.hl = {};
    const getReg = (r) => { const v = R[r.i]; if (r.hi) return (v >> 8n) & 0xFFn; return v & MASK[r.size]; };
    const setReg = (r, v) => { v = BigInt.asUintN(r.size * 8, v); if (r.size === 8) R[r.i] = v; else if (r.size === 4) R[r.i] = v; else if (r.hi) R[r.i] = (R[r.i] & ~0xFF00n) | (v << 8n); else R[r.i] = (R[r.i] & ~MASK[r.size]) | v; s.hl.reg = r.i; };
    const load = (addr, size) => { let v = 0n; for (let i = size - 1; i >= 0; i--) v = (v << 8n) | BigInt(M[(addr + BigInt(i)).toString()] || 0); return v; };
    const store = (addr, v, size) => { let x = BigInt.asUintN(size * 8, v); for (let i = 0; i < size; i++) { M[(addr + BigInt(i)).toString()] = Number(x & 0xFFn); x >>= 8n; } s.hl.addr = addr; };
    const evalSym = (t) => { t = t.trim(); const m = /^(.+?)\s*([+-])\s*(.+)$/.exec(t); if (m && !/^-?\d+$/.test(t) && !/^-?0x/i.test(t)) { return m[2] === '+' ? evalSym(m[1]) + evalSym(m[3]) : evalSym(m[1]) - evalSym(m[3]); } if (/^'(.)'$/.test(t)) return BigInt(t.charCodeAt(1)); if (/^-?0x[0-9a-f]+$/i.test(t)) return BigInt(t); if (/^-?\d+$/.test(t)) return BigInt(t); if (/^-?[0-9a-f]+h$/i.test(t)) return BigInt('0x' + t.replace(/h$/i, '')); if (s.equs && s.equs[t] !== undefined) return s.equs[t]; if (s.labels[t] !== undefined) return s.labels[t]; throw new Error(`unknown symbol ${t}`); };
    // operand parsing
    const parse = (t) => {
      const raw = t.trim(); let m;
      let size = null; let rest = raw;
      if ((m = /^(byte|word|dword|qword)\s+(?:ptr\s+)?(.+)$/i.exec(raw))) { size = SIZE_NAMES[m[1].toLowerCase()]; rest = m[2].trim(); }
      const lower = rest.toLowerCase();
      if (REGMAP[lower]) return { k: 'reg', r: REGMAP[lower], size: REGMAP[lower].size, txt: lower };
      if ((m = /^\[(.+)\]$/.exec(rest))) {
        let addr = 0n; const terms = m[1].replace(/\s+/g, '').replace(/-/g, '+-').split('+').filter(Boolean); const desc = [];
        for (const term of terms) { let mm; if ((mm = /^(-?)([a-z0-9]+)\*(\d+)$/i.exec(term)) && REGMAP[mm[2].toLowerCase()]) { const v = getReg(REGMAP[mm[2].toLowerCase()]) * BigInt(mm[3]); addr += mm[1] ? -v : v; desc.push(`${mm[2]}×${mm[3]}=${v}`); } else if (REGMAP[term.toLowerCase()]) { const v = getReg(REGMAP[term.toLowerCase()]); addr += v; desc.push(`${term}=${bhex(v, 8)}`); } else { const v = evalSym(term); addr += v; desc.push(/^-?\d|^-?0x|^'/.test(term) ? term : `${term}=${bhex(v, 8)}`); } }
        return { k: 'mem', addr: BigInt.asUintN(64, addr), size, txt: raw, desc: desc.join(' + ') };
      }
      return { k: 'imm', v: evalSym(rest), size, txt: raw };
    };
    const sizeOf = (a, b) => a.size || (b && b.size) || 8;
    const read = (o, size) => o.k === 'reg' ? getReg(o.r) : o.k === 'mem' ? load(o.addr, size) : BigInt.asUintN(size * 8, o.v);
    const write = (o, v, size) => { if (o.k === 'reg') setReg(o.r, v); else if (o.k === 'mem') store(o.addr, v, size); else throw new Error('cannot write to an immediate'); };
    const setFlagsArith = (res, a, b, size, sub) => { const m = MASK[size]; const r = res & m; F.ZF = r === 0n ? 1 : 0; F.SF = (r >> BigInt(size * 8 - 1)) & 1n ? 1 : 0; F.CF = sub ? (a < b ? 1 : 0) : (res > m ? 1 : 0); const sa = toSigned(a, size), sb = toSigned(b, size), sr = toSigned(r, size); F.OF = sub ? ((sa - sb !== sr) ? 1 : 0) : ((sa + sb !== sr) ? 1 : 0); return r; };
    const setFlagsLogic = (r, size) => { F.ZF = (r & MASK[size]) === 0n ? 1 : 0; F.SF = (r >> BigInt(size * 8 - 1)) & 1n ? 1 : 0; F.CF = 0; F.OF = 0; };
    const flagsTxt = () => `ZF=${F.ZF} SF=${F.SF} CF=${F.CF} OF=${F.OF}`;
    const memTxt = o => o.k === 'mem' ? ` ([${o.desc}] → ${bhex(o.addr, 8)})` : '';
    const idxOf = addr => Number(addr - TEXT_BASE);
    let d = ''; let next = s.pc + 1;
    const src = c.src.replace(/;.*$/, '').replace(/^[A-Za-z_.$][\w.$]*:\s*/, '').replace(/\s+/g, ' ').trim();
    try {
      const mn = c.mn, ops = c.ops;
      const o = ops.map(parse);
      switch (mn) {
        case 'mov': { const size = sizeOf(o[0], o[1]); const v = read(o[1], size); write(o[0], v, size); d = `${src}: ${o[0].txt} = ${bhex(v, size)} (${toSigned(v, size)})${memTxt(o[1])}${memTxt(o[0])}`; break; }
        case 'movzx': case 'movsx': { const ssz = o[1].size || (o[1].k === 'reg' ? o[1].r.size : 1); let v = read(o[1], ssz); if (mn === 'movsx') v = BigInt.asUintN(o[0].size * 8, toSigned(v, ssz)); write(o[0], v, o[0].size); d = `${src}: ${o[0].txt} = ${bhex(v, o[0].size)} (${mn === 'movzx' ? 'zero' : 'sign'}-extended)`; break; }
        case 'lea': { write(o[0], o[1].addr, o[0].size); d = `${src}: ${o[0].txt} = the address ${bhex(o[1].addr, 8)} (${o[1].desc}), not its contents`; break; }
        case 'xchg': { const size = sizeOf(o[0], o[1]); const a = read(o[0], size), b = read(o[1], size); write(o[0], b, size); write(o[1], a, size); d = `${src}: swapped`; break; }
        case 'add': case 'sub': case 'adc': case 'sbb': { const size = sizeOf(o[0], o[1]); const a = read(o[0], size); let b = read(o[1], size); if (o[1].k === 'imm') b = BigInt.asUintN(size * 8, o[1].v); const carry = (mn === 'adc' || mn === 'sbb') ? BigInt(F.CF) : 0n; const sub = mn === 'sub' || mn === 'sbb'; const res = sub ? a - b - carry : a + b + carry; const r = setFlagsArith(sub ? BigInt.asUintN(size * 8, res) : res, a, b + carry, size, sub); if (sub && res < 0n) F.CF = 1; write(o[0], r, size); d = `${src}: ${toSigned(a, size)} ${sub ? '−' : '+'} ${toSigned(b, size)}${carry ? ` ${sub ? '−' : '+'} CF` : ''} = ${toSigned(r, size)} (${bhex(r, size)}); ${flagsTxt()}`; break; }
        case 'inc': case 'dec': { const size = o[0].size || 8; const a = read(o[0], size); const r = BigInt.asUintN(size * 8, mn === 'inc' ? a + 1n : a - 1n); const cf = F.CF; setFlagsArith(mn === 'inc' ? a + 1n : r, a, 1n, size, mn === 'dec'); F.CF = cf; write(o[0], r, size); d = `${src}: ${o[0].txt} = ${toSigned(r, size)} (CF untouched); ZF=${F.ZF} SF=${F.SF}`; break; }
        case 'neg': { const size = o[0].size || 8; const a = read(o[0], size); const r = BigInt.asUintN(size * 8, -a); setFlagsArith(r, 0n, a, size, true); F.CF = a === 0n ? 0 : 1; write(o[0], r, size); d = `${src}: ${o[0].txt} = ${toSigned(r, size)}`; break; }
        case 'not': { const size = o[0].size || 8; const a = read(o[0], size); const r = BigInt.asUintN(size * 8, ~a); write(o[0], r, size); d = `${src}: ${o[0].txt} = ${bhex(r, size)} (flags untouched)`; break; }
        case 'and': case 'or': case 'xor': case 'test': { const size = sizeOf(o[0], o[1]); const a = read(o[0], size), b = read(o[1], size); const r = mn === 'and' || mn === 'test' ? a & b : mn === 'or' ? a | b : a ^ b; setFlagsLogic(r, size); if (mn !== 'test') write(o[0], r, size); d = `${src}: ${bhex(a, size)} ${mn} ${bhex(b, size)} = ${bhex(r, size)}${mn === 'test' ? ' (discarded)' : mn === 'xor' && o[0].txt === o[1].txt ? ' — the idiom for zeroing a register' : ''}; ZF=${F.ZF} SF=${F.SF}`; break; }
        case 'shl': case 'sal': case 'shr': case 'sar': { const size = o[0].size || 8; const a = read(o[0], size); const n = o[1] ? (o[1].k === 'imm' ? o[1].v : getReg(o[1].r) & 0x3Fn) : 1n; let r; if (mn === 'sar') r = BigInt.asUintN(size * 8, toSigned(a, size) >> n); else if (mn === 'shr') r = a >> n; else r = BigInt.asUintN(size * 8, a << n); if (n > 0n) F.CF = mn === 'shr' || mn === 'sar' ? Number((a >> (n - 1n)) & 1n) : Number((a >> (BigInt(size * 8) - n)) & 1n); F.ZF = r === 0n ? 1 : 0; F.SF = (r >> BigInt(size * 8 - 1)) & 1n ? 1 : 0; write(o[0], r, size); d = `${src}: ${bhex(a, size)} ${mn} ${n} = ${bhex(r, size)} (${toSigned(r, size)})`; break; }
        case 'imul': {
          if (o.length === 1) { const size = o[0].size || (o[0].k === 'reg' ? o[0].r.size : 8); const a = toSigned(getReg({ i: 0, size }), size), b = toSigned(read(o[0], size), size); const p = a * b; if (size === 1) setReg(REGMAP.ax, p); else { setReg({ i: 0, size }, p); setReg({ i: 3, size }, p >> BigInt(size * 8)); } F.CF = F.OF = (toSigned(BigInt.asUintN(size * 8, p), size) !== p) ? 1 : 0; d = `${src}: ${a} × ${b} = ${p} into ${size === 1 ? 'ax' : size === 8 ? 'rdx:rax' : size === 4 ? 'edx:eax' : 'dx:ax'}`; }
          else { const size = sizeOf(o[0], o[1]); const a = toSigned(read(o.length === 3 ? o[1] : o[0], size), size), b = toSigned(read(o.length === 3 ? o[2] : o[1], size), size); const p = a * b; const r = BigInt.asUintN(size * 8, p); F.CF = F.OF = toSigned(r, size) !== p ? 1 : 0; write(o[0], r, size); d = `${src}: ${a} × ${b} = ${p}${F.OF ? ' (truncated: OF=1)' : ''}`; }
          break;
        }
        case 'mul': { const size = o[0].size || (o[0].k === 'reg' ? o[0].r.size : 8); const a = getReg({ i: 0, size }), b = read(o[0], size); const p = a * b; if (size === 1) setReg(REGMAP.ax, p); else { setReg({ i: 0, size }, p); setReg({ i: 3, size }, p >> BigInt(size * 8)); } F.CF = F.OF = (p >> BigInt(size * 8)) ? 1 : 0; d = `${src}: ${a} × ${b} = ${p} (unsigned) into ${size === 1 ? 'ax' : size === 8 ? 'rdx:rax' : size === 4 ? 'edx:eax' : 'dx:ax'}`; break; }
        case 'div': case 'idiv': {
          const size = o[0].size || (o[0].k === 'reg' ? o[0].r.size : 8); const divisor = read(o[0], size);
          if (divisor === 0n) throw new Error('division by zero (#DE)');
          let dividend; if (size === 1) dividend = getReg(REGMAP.ax); else dividend = (getReg({ i: 3, size }) << BigInt(size * 8)) | getReg({ i: 0, size });
          let q, rem, txt;
          if (mn === 'idiv') { const dd = toSigned(dividend, size * 2), dv = toSigned(divisor, size); q = dd / dv; rem = dd % dv; txt = `${dd} ÷ ${dv}`; } else { q = dividend / divisor; rem = dividend % divisor; txt = `${dividend} ÷ ${divisor}`; }
          if (size === 1) { setReg(REGMAP.al, q); setReg(REGMAP.ah, rem); d = `${src}: ${txt} → al = ${q} remainder ah = ${rem}`; } else { setReg({ i: 0, size }, q); setReg({ i: 3, size }, rem); d = `${src}: ${txt} → ${size === 8 ? 'rax' : size === 4 ? 'eax' : 'ax'} = ${q} remainder ${size === 8 ? 'rdx' : size === 4 ? 'edx' : 'dx'} = ${rem}`; }
          break;
        }
        case 'cdq': setReg(REGMAP.edx, toSigned(getReg(REGMAP.eax), 4) < 0n ? 0xFFFFFFFFn : 0n); d = `${src}: edx = sign of eax (${getReg(REGMAP.edx) ? '−' : '+'}), ready for idiv`; break;
        case 'cqo': R[3] = toSigned(R[0], 8) < 0n ? MASK[8] : 0n; d = `${src}: rdx = sign of rax, ready for idiv`; break;
        case 'cmp': { const size = sizeOf(o[0], o[1]); const a = read(o[0], size); const b = o[1].k === 'imm' ? BigInt.asUintN(size * 8, o[1].v) : read(o[1], size); setFlagsArith(BigInt.asUintN(size * 8, a - b), a, b, size, true); d = `${src}: ${toSigned(a, size)} − ${toSigned(b, size)} (discarded); ${flagsTxt()} — equal? ${F.ZF ? 'yes' : 'no'}, below (unsigned)? ${F.CF ? 'yes' : 'no'}, less (signed)? ${F.SF !== F.OF ? 'yes' : 'no'}`; break; }
        case 'jmp': { next = idxOf(o[0].v); d = `${src}: PC = ${o[0].txt}`; break; }
        case 'call': { const ret = TEXT_BASE + BigInt(s.pc + 1); R[7] -= 8n; store(R[7], ret, 8); next = idxOf(o[0].v); d = `${src}: push the return address ${bhex(ret, 8)} (rsp = ${bhex(R[7], 8)}) and jump to ${o[0].txt}`; break; }
        case 'ret': { const ret = load(R[7], 8); R[7] += 8n; next = idxOf(ret); if (o[0]) R[7] += o[0].v; d = `${src}: pop the return address ${bhex(ret, 8)} → back to line ${(s.code[next] ? s.code[next].ln + 1 : '?')}, rsp = ${bhex(R[7], 8)}`; break; }
        case 'push': { const v = o[0].k === 'imm' ? BigInt.asUintN(64, o[0].v) : read(o[0], 8); R[7] -= 8n; store(R[7], v, 8); d = `${src}: rsp −= 8 → ${bhex(R[7], 8)}, M[rsp] = ${bhex(v, 8)}`; break; }
        case 'pop': { const v = load(R[7], 8); R[7] += 8n; write(o[0], v, 8); d = `${src}: ${o[0].txt} = M[rsp] = ${bhex(v, 8)}, rsp += 8 → ${bhex(R[7], 8)}`; break; }
        case 'loop': { R[1] = BigInt.asUintN(64, R[1] - 1n); if (R[1] !== 0n) next = idxOf(o[0].v); d = `${src}: rcx = ${R[1]} → ${R[1] ? 'loop again' : 'fall through'}`; break; }
        case 'nop': d = `${src}: nothing`; break;
        case 'syscall': case 'int': {
          const is32 = mn === 'int';
          if (is32 && o[0] && o[0].v !== 0x80n) throw new Error('only int 0x80 is modelled');
          const nr = is32 ? Number(getReg(REGMAP.eax)) : Number(R[0]);
          const a1 = is32 ? getReg(REGMAP.ebx) : R[5], a2 = is32 ? getReg(REGMAP.ecx) : R[4], a3 = is32 ? getReg(REGMAP.edx) : R[3];
          const abi = is32 ? 'int 0x80 (32-bit ABI: number in eax, arguments in ebx, ecx, edx)' : 'syscall (64-bit ABI: number in rax, arguments in rdi, rsi, rdx)';
          if ((is32 && nr === 1) || (!is32 && nr === 60)) { s.halted = true; s.exit = Number(a1 & 0xFFn); d = `${src}: ${abi} → exit(${a1}): the process ends with status ${s.exit}`; }
          else if ((is32 && nr === 4) || (!is32 && nr === 1)) { let txt = ''; for (let i = 0n; i < a3; i++) txt += String.fromCharCode(M[(a2 + i).toString()] || 0); s.stdout += txt; if (!is32) R[0] = a3; else setReg(REGMAP.eax, a3); d = `${src}: ${abi} → write(${a1}, ${bhex(a2, 8)}, ${a3}): ${a1 === 1n ? 'stdout' : a1 === 2n ? 'stderr' : 'fd ' + a1} receives ${JSON.stringify(txt)}`; }
          else if ((is32 && nr === 3) || (!is32 && nr === 0)) { const take = s.stdin.slice(0, Number(a3)); s.stdin = s.stdin.slice(take.length); for (let i = 0; i < take.length; i++) M[(a2 + BigInt(i)).toString()] = take.charCodeAt(i); if (!is32) R[0] = BigInt(take.length); else setReg(REGMAP.eax, BigInt(take.length)); d = `${src}: ${abi} → read(${a1}, buf, ${a3}): ${take.length} byte${take.length === 1 ? '' : 's'} ${JSON.stringify(take)} copied into memory, count returned in ${is32 ? 'eax' : 'rax'}`; }
          else throw new Error(`system call ${nr} is not modelled (exit, write and read are)`);
          break;
        }
        default:
          if (JCC[mn]) { const conds = JCC[mn]; const ev = cnd => cnd.split('|').some(t => { if (t === 'SF!=OF') return F.SF !== F.OF; if (t === 'SF==OF') return F.SF === F.OF; const neg = t[0] === '!'; const f = F[neg ? t.slice(1) : t]; return neg ? !f : !!f; }); const taken = conds.every(ev); if (taken) next = idxOf(o[0].v); d = `${src}: ${conds.join(' and ')} → ${taken ? 'taken' : 'not taken'}`; break; }
          throw new Error(`instruction ${mn} is not in the subset`);
      }
    } catch (e) { s.halted = true; yield fail(`line ${c.ln + 1} (${src}): ${e.message}`); return; }
    s.pc = next; s.count++;
    yield { d };
  }

  /* ═══════════════════════ MEMORY AND I/O ═══════════════════════ */
  MODES.endian = {
    title: 'Endianness',
    init() { return { phase: 'idle', bytes: [], addr: 0, big: null, little: null }; },
    controls: [{ kind: 'text', name: 'value', label: 'value (hex)', default: '12345678' }, { kind: 'text', name: 'address', label: 'address', default: '$100' }, { kind: 'button', label: 'store', op: 'store', args: ['value', 'address'] }],
    auto: { op: 'store', args: ['value', 'address'] },
    ops: {
      *store(s, [v0, a0]) {
        let h = String(v0).trim().replace(/^0x|^\$/i, '').toUpperCase();
        if (/^\d+$/.test(String(v0).trim()) && !/^0x/i.test(String(v0).trim()) && String(v0).trim().length <= 12 && s.decimal) h = parseInt(v0, 10).toString(16).toUpperCase();
        Object.assign(s, { phase: 'run', big: null, little: null, addr: lit(a0) || 0 });
        if (!/^[0-9A-F]+$/.test(h)) { yield fail('give the value in hex, e.g. 12345678'); return; }
        if (h.length % 2) h = '0' + h;
        const bytes = h.match(/../g); s.bytes = bytes;
        yield { d: `${h}₁₆ is ${bytes.length} bytes: ${bytes.join(' ')} — memory is byte-addressable, so a ${bytes.length * 8}-bit word occupies ${bytes.length} consecutive addresses starting at ${hex(s.addr, 3)}` };
        s.big = bytes.slice();
        yield { d: `big-endian ("Motorola", network order): the most significant byte ${bytes[0]} goes at the lowest address ${hex(s.addr, 3)} — reads naturally in a memory dump` };
        s.little = bytes.slice().reverse(); s.phase = 'done';
        yield { d: `little-endian ("Intel"): the least significant byte ${bytes[bytes.length - 1]} goes at the lowest address ${hex(s.addr, 3)} — bit 0 of the value is in byte 0, which makes widening a value in place free (x86-64 does this)` };
      }
    },
    render(s) {
      if (s.phase === 'idle') return '';
      const col = (lbl, arr) => { const rows = []; for (let i = 0; i < s.bytes.length; i++) rows.push([{ v: hex(s.addr + i, 3), cls: 'mono muted' }, { v: arr ? arr[i] : '', cls: 'mono' + (arr && ((lbl[0] === 'b' && i === 0) || (lbl[0] === 'l' && i === s.bytes.length - 1)) ? ' k' : '') }]); return `<div><div class="arch-side-title">${lbl}</div>${table(['addr', 'byte'], rows, { cls: 'arch-grid' })}</div>`; };
      return `<div class="arch-cols">${col('big-endian', s.big)}${col('little-endian', s.little)}</div><div class="arch-muted">the highlighted byte is the most significant one, ${esc(s.bytes[0] || '')}, in each layout</div>`;
    }
  };

  MODES['memory-chips'] = {
    title: 'Building a memory from chips',
    init() { return { phase: 'idle', chip: null, mem: null, rows: 0, cols: 0, probe: null }; },
    controls: [{ kind: 'text', name: 'chip', label: 'chip (addresses × bits)', default: '16x4' }, { kind: 'text', name: 'memory', label: 'memory wanted', default: '64x8' }, { kind: 'text', name: 'address', label: 'example address', default: '' }, { kind: 'button', label: 'arrange', op: 'arrange', args: ['chip', 'memory', 'address'] }],
    auto: { op: 'arrange', args: ['chip', 'memory', 'address'] },
    ops: {
      *arrange(s, [c0, m0, a0]) {
        const parse = t => { const m = /^\s*(\d+)\s*([kKmM]?)\s*[x×]\s*(\d+)\s*$/.exec(String(t)); if (!m) return null; const mult = m[2].toLowerCase() === 'k' ? 1024 : m[2].toLowerCase() === 'm' ? 1048576 : 1; return { a: +m[1] * mult, w: +m[3] }; };
        const chip = parse(c0), mem = parse(m0);
        Object.assign(s, { phase: 'run', chip, mem, rows: 0, cols: 0, probe: null });
        if (!chip || !mem) { yield fail('write sizes as addresses × bits, e.g. 16x4 or 256Kx1'); return; }
        if (mem.a % chip.a || mem.w % chip.w) { yield fail('the memory must be a whole number of chips in each direction'); return; }
        const rows = mem.a / chip.a, cols = mem.w / chip.w;
        const aLines = c => Math.log2(c); s.rows = rows; s.cols = cols; s.aChip = aLines(chip.a); s.aMem = aLines(mem.a);
        yield { d: `a ${chip.a}×${chip.w} chip has ${s.aChip} address lines (2${sup(s.aChip)} = ${chip.a}) and ${chip.w} data line${chip.w > 1 ? 's' : ''}; the memory needs ${s.aMem} address lines and ${mem.w} data lines` };
        yield { d: `width: ${cols} chip${cols > 1 ? 's' : ''} side by side share the same address lines, each supplying ${chip.w} of the ${mem.w} data bits` };
        const extra = s.aMem - s.aChip;
        yield { d: extra ? `depth: ${rows} rows of chips cover ${mem.a} addresses; the ${extra} high address bit${extra > 1 ? 's' : ''} go through a ${extra}-to-${rows} decoder whose outputs drive the chip-enable lines, so exactly one row responds` : `depth: one row — every address line goes straight to the chips, no decoder needed` };
        yield { d: `${rows * cols} chips in total (${mem.a * mem.w} bits = ${rows * cols} × ${chip.a * chip.w})` };
        const addrTxt = a0 === undefined || a0 === null ? '' : String(a0).trim();
        if (addrTxt) {
          const a = lit(addrTxt);
          if (!(a >= 0 && a < mem.a)) { yield fail(`address must be 0 … ${mem.a - 1}`); return; }
          const row = Math.floor(a / chip.a), inChip = a % chip.a; s.probe = { a, row, inChip };
          const ab = bits(a, s.aMem);
          yield { d: `address ${a} = ${ab}: the top ${extra} bit${extra === 1 ? '' : 's'} ${extra ? ab.slice(0, extra) + ' select row ' + row : 'select nothing (one row)'}, the low ${s.aChip} bits ${ab.slice(extra)} = ${inChip} pick the location inside each of that row's ${cols} chips` };
        }
        s.phase = 'done';
      }
    },
    render(s) {
      if (s.phase === 'idle' || !s.chip) return '';
      const { rows, cols, chip } = s; const cw = 74, ch = 44, gx = 18, gy = 16, x0 = 130, y0 = 40;
      const W = x0 + cols * (cw + gx) + 30, H = y0 + rows * (ch + gy) + 40;
      let g = svgOpen(W, H) + defs();
      const extra = s.aMem - s.aChip;
      if (extra) { g += rect(20, y0, 70, rows * (ch + gy) - gy, '#fff', C.ink, 6) + text(55, y0 + 14, 'decoder', 'arch-idx') + text(55, y0 + 28, `${extra}→${rows}`, 'arch-idx'); g += text(55, y0 - 8, `A${s.aMem - 1}${extra > 1 ? '…A' + s.aChip : ''}`, 'arch-idx', `fill="${C.purple}"`); }
      g += text(x0 + (cols * (cw + gx) - gx) / 2, 18, `A${s.aChip - 1}…A0 to every chip`, 'arch-idx', `fill="${C.purple}"`);
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const x = x0 + c * (cw + gx), y = y0 + r * (ch + gy);
        const on = s.probe && s.probe.row === r;
        g += rect(x, y, cw, ch, on ? C.hiBg : '#fff', on ? C.hi : C.ink, 5) + text(x + cw / 2, y + 18, `${chip.a}×${chip.w}`, 'arch-small') + text(x + cw / 2, y + 34, `D${(cols - 1 - c) * chip.w + chip.w - 1}…D${(cols - 1 - c) * chip.w}`, 'arch-idx');
        if (extra) g += line(90, y + ch / 2, x, y + ch / 2, on ? C.hi : C.line, on ? 2 : 1) ;
        if (extra && c === 0) g += text(96, y + ch / 2 - 4, `CE${r}`, 'arch-idx', `text-anchor="start" ${on ? `fill="${C.hi}"` : ''}`);
      }
      g += text(x0 + (cols * (cw + gx) - gx) / 2, H - 8, `${s.mem.w} data lines out: D${s.mem.w - 1}…D0`, 'arch-idx', `fill="${C.blue}"`);
      return g + '</svg>';
    }
  };

  // seeded PRNG for the random policy so a block replays identically
  const lcg = seed => () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  MODES.cache = {
    title: 'Cache',
    init(cfg) { return { phase: 'idle', kind: cfg.kind || 'direct', lines: num(cfg.lines, 4), ways: num(cfg.ways, 2), block: num(cfg.block, 4), abits: num(cfg.bits, 8), policy: (cfg.policy || 'lru').toLowerCase(), sets: [], trace: [], i: -1, hits: 0, misses: 0, log: [], hitTime: num(cfg.hit_time, 1), missPenalty: num(cfg.miss_penalty, 10), cur: null }; },
    controls: [{ kind: 'select', name: 'kind', label: 'mapping', options: ['direct', 'full', 'set'], default: 'direct' }, { kind: 'select', name: 'policy', label: 'eviction', options: ['lru', 'fifo', 'random'], default: 'lru' }, { kind: 'text', name: 'trace', label: 'address trace', default: '0 4 8 0 16 4 32 0', wide: true }, { kind: 'button', label: 'run', op: 'run', args: ['kind', 'policy', 'trace'] }],
    auto: { op: 'run', args: ['kind', 'policy', 'trace'] },
    ops: {
      *run(s, [kind0, pol0, tr0], cfg) {
        const kind = ['direct', 'full', 'set'].includes(kind0) ? kind0 : 'direct'; const policy = ['lru', 'fifo', 'random'].includes(pol0) ? pol0 : 'lru';
        const trace = (Array.isArray(tr0) ? tr0 : String(tr0).trim().split(/[\s,]+/)).filter(x => x !== '').map(lit);
        const lines = s.lines, block = s.block, ways = kind === 'direct' ? 1 : kind === 'full' ? lines : s.ways;
        const nsets = lines / ways;
        Object.assign(s, { phase: 'run', kind, policy, trace, i: -1, hits: 0, misses: 0, log: [], cur: null, ways, nsets });
        if (trace.some(a => !(a >= 0 && a < pow2(s.abits)))) { yield fail(`addresses must be 0 … ${pow2(s.abits) - 1} (${s.abits}-bit addresses)`); return; }
        if (!Number.isInteger(Math.log2(lines)) || !Number.isInteger(Math.log2(block)) || !Number.isInteger(nsets) || nsets < 1) { yield fail('lines, block size and ways must be powers of two with ways ≤ lines'); return; }
        s.sets = Array.from({ length: nsets }, () => Array.from({ length: ways }, () => ({ v: 0, tag: null, blk: null, last: 0, in: 0 })));
        const ob = Math.log2(block), ib = Math.log2(nsets), tb = s.abits - ob - ib; s.ob = ob; s.ib = ib; s.tb = tb;
        const rnd = lcg(42); let clock = 0;
        yield { d: `${kind === 'direct' ? 'direct-mapped' : kind === 'full' ? 'fully associative' : `${ways}-way set-associative`} cache: ${lines} lines of ${block} words${nsets > 1 && ways > 1 ? ` in ${nsets} sets` : ''}; addresses of ${s.abits} bits split into tag (${tb}) | ${kind === 'full' ? '' : `${kind === 'direct' ? 'line' : 'set'} (${ib}) | `}offset (${ob})` };
        for (let k = 0; k < trace.length; k++) {
          const a = trace[k]; s.i = k; clock++;
          const ab = bits(a, s.abits); const blk = Math.floor(a / block); const off = a % block; const idx = blk % nsets; const tag = Math.floor(blk / nsets);
          const set = s.sets[idx]; const split = { tagB: ab.slice(0, tb), idxB: ab.slice(tb, tb + ib), offB: ab.slice(tb + ib) };
          s.cur = { a, blk, idx, tag, off, split };
          const hitWay = set.findIndex(l => l.v && l.tag === tag);
          if (hitWay >= 0) { s.hits++; set[hitWay].last = clock; s.cur.way = hitWay; s.cur.hit = true; s.log.push({ a, blk, idx, tag, hit: true }); yield { d: `access ${a} (${split.tagB}|${split.idxB ? split.idxB + '|' : ''}${split.offB}): block ${blk}, ${kind === 'full' ? 'compare every tag at once' : `${kind === 'direct' ? 'line' : 'set'} ${idx}`} — tag ${tag} matches → hit, word ${off} of the block` }; continue; }
          s.misses++;
          let way = set.findIndex(l => !l.v); let why;
          if (way >= 0) why = 'an empty line';
          else if (ways === 1) { way = 0; why = `the only line it can use, evicting block ${set[0].blk}`; }
          else { if (policy === 'lru') way = set.reduce((b, l, i) => l.last < set[b].last ? i : b, 0); else if (policy === 'fifo') way = set.reduce((b, l, i) => l.in < set[b].in ? i : b, 0); else way = Math.floor(rnd() * ways); why = `way ${way} (${policy.toUpperCase()}'s choice), evicting block ${set[way].blk}`; }
          const evicted = set[way].v ? set[way].blk : null;
          set[way] = { v: 1, tag, blk, last: clock, in: clock }; s.cur.way = way; s.cur.hit = false; s.cur.evicted = evicted;
          s.log.push({ a, blk, idx, tag, hit: false, evicted });
          yield { d: `access ${a} (${split.tagB}|${split.idxB ? split.idxB + '|' : ''}${split.offB}): block ${blk} → ${kind === 'full' ? 'no tag matches' : `${kind === 'direct' ? 'line' : 'set'} ${idx}, tag ${tag} not there`} → miss; the whole block (words ${blk * block}–${blk * block + block - 1}) is copied into ${why}` };
        }
        s.phase = 'done'; s.cur = null;
        const n = trace.length, hr = s.hits / n;
        yield { d: `${s.hits} hits, ${s.misses} misses: hit rate ${(hr * 100).toFixed(0)}%; EAT = ${s.hitTime} × ${hr.toFixed(2)} + ${s.missPenalty} × ${(1 - hr).toFixed(2)} = ${(s.hitTime * hr + s.missPenalty * (1 - hr)).toFixed(2)} cycles per access (hit time ${s.hitTime}, miss penalty ${s.missPenalty})` };
      }
    },
    render(s) {
      if (s.phase === 'idle') return '';
      const rows = [];
      s.sets.forEach((set, si) => set.forEach((l, wi) => rows.push([{ v: s.nsets > 1 ? String(si) : '', cls: 'mono muted' }, { v: s.ways > 1 ? String(wi) : '', cls: 'mono muted' }, { v: String(l.v), cls: 'mono' }, { v: l.v ? String(l.tag) : '', cls: 'mono' }, { v: l.v ? `block ${l.blk} (${l.blk * s.block}–${l.blk * s.block + s.block - 1})` : '', cls: 'muted' }, { v: l.v && s.policy !== 'random' && s.ways > 1 ? String(s.policy === 'lru' ? l.last : l.in) : '', cls: 'mono muted' }])));
      const curRow = s.cur ? (s.cur.idx * s.ways + s.cur.way) : -1;
      let html = table([s.nsets > 1 ? 'set' : '', s.ways > 1 ? 'way' : '', 'valid', 'tag', 'contents', s.policy === 'lru' ? 'last use' : s.policy === 'fifo' ? 'loaded' : ''], rows, { cls: 'arch-grid', rowCls: i => i === curRow ? (s.cur.hit ? 'ok' : 'hl') : '' });
      if (s.cur) html += `<div class="arch-line">address ${s.cur.a} = ${tag(s.cur.split.tagB, 'purple')}${s.cur.split.idxB ? tag(s.cur.split.idxB, 'blue') : ''}${tag(s.cur.split.offB, 'muted')} → tag ${s.cur.tag}${s.cur.split.idxB ? `, ${s.kind === 'direct' ? 'line' : 'set'} ${s.cur.idx}` : ''}, offset ${s.cur.off} → ${s.cur.hit ? tag('hit', 'ok') : tag('miss', 'hi')}</div>`;
      const side = `<div class="arch-side-title">trace</div><div class="arch-trace-list">${s.trace.map((a, k) => `<span class="arch-tag ${k > s.i && s.phase !== 'done' ? 'arch-muted' : s.log[k] && s.log[k].hit ? 'arch-ok' : 'arch-hi'}${k === s.i ? ' cur' : ''}">${a}</span>`).join(' ')}</div><div class="arch-side-title">so far</div><div>hits ${s.hits} · misses ${s.misses}${s.hits + s.misses ? ` · hit rate ${Math.round(100 * s.hits / (s.hits + s.misses))}%` : ''}</div>`;
      return { html, side };
    }
  };

  MODES.io = {
    title: 'I/O timing',
    init(cfg) { return { phase: 'idle', kind: cfg.kind || 'polling', T: num(cfg.cycles, 24), events: [], rate: num(cfg.rate, 4), service: num(cfg.service, 2), rows: null, cur: -1, missed: 0, polls: 0, latency: [], dma: cfg.dma || 'block', words: num(cfg.words, 6) }; },
    controls: [{ kind: 'select', name: 'kind', label: 'kind', options: ['polling', 'interrupt', 'dma'], default: 'polling' }, { kind: 'number', name: 'rate', label: 'poll every', default: 4 }, { kind: 'text', name: 'events', label: 'device events at', default: '3 7 8 15' }, { kind: 'select', name: 'dma', label: 'DMA mode', options: ['block', 'stealing', 'interleaved'], default: 'block' }, { kind: 'button', label: 'run', op: 'run', args: ['kind', 'rate', 'events', 'dma'] }],
    auto: { op: 'run', args: ['kind', 'rate', 'events', 'dma'] },
    ops: {
      *run(s, [kind0, rate0, ev0, dma0], cfg) {
        const kind = ['polling', 'interrupt', 'dma'].includes(kind0) ? kind0 : 'polling'; const rate = Math.max(1, num(rate0, 4)); const dma = ['block', 'stealing', 'interleaved'].includes(dma0) ? dma0 : 'block';
        const events = (Array.isArray(ev0) ? ev0 : String(ev0).trim().split(/[\s,]+/)).filter(x => x !== '').map(lit).filter(x => Number.isFinite(x)).sort((a, b) => a - b);
        const T = s.T;
        Object.assign(s, { phase: 'run', kind, rate, events, dma, cur: -1, missed: 0, polls: 0, latency: [], busy: 0 });
        const dev = Array(T).fill(0), cpu = Array(T).fill('work'), note = Array(T).fill('');
        s.rows = { dev, cpu };
        if (kind === 'dma') {
          // CPU memory-access pattern: it needs the bus on the cycles given in `cpu` (default every other cycle)
          const pattern = cfg.cpu_access ? String(cfg.cpu_access).replace(/[^01]/g, '') : '';
          const pat = pattern || '1101'; const needs = t => pat[t % pat.length] === '1';
          const busRow = Array(T).fill('free'); s.rows.bus = busRow; let left = s.words, t = 0, stalls = 0, done = -1;
          const start = 2;
          yield { d: `a DMA controller must copy ${s.words} words over the memory bus while the CPU also needs the bus on some cycles (access pattern ${pattern || '1101'}, repeating) — mode: ${dma}` };
          for (t = 0; t < T; t++) {
            const wants = needs(t);
            if (t < start || left === 0) { busRow[t] = wants ? 'cpu' : 'free'; cpu[t] = wants ? 'mem' : 'work'; continue; }
            if (dma === 'block') { busRow[t] = 'dma'; left--; if (wants) { cpu[t] = 'stall'; stalls++; } else cpu[t] = 'work'; }
            else if (dma === 'stealing') { if ((t - start) % 2 === 0) { busRow[t] = 'dma'; left--; if (wants) { cpu[t] = 'stall'; stalls++; } else cpu[t] = 'work'; } else { busRow[t] = wants ? 'cpu' : 'free'; cpu[t] = wants ? 'mem' : 'work'; } }
            else { if (wants) { busRow[t] = 'cpu'; cpu[t] = 'mem'; } else { busRow[t] = 'dma'; left--; cpu[t] = 'work'; } }
            if (left === 0 && done < 0) done = t;
          }
          s.cur = T - 1; s.done = done; s.stalls = stalls; s.phase = 'done';
          yield { d: done >= 0 ? `transfer finished at cycle ${done} with ${stalls} CPU stall${stalls === 1 ? '' : 's'}: ${dma === 'block' ? 'fastest, but the CPU is locked out while it runs' : dma === 'stealing' ? 'the CPU loses one cycle in two, predictable end time' : 'no CPU stalls at all, but the end time depends on how busy the CPU is'}` : `still ${left} words to go after ${T} cycles${dma === 'interleaved' ? ' — with a busy CPU, interleaved DMA may starve' : ''}` };
          return;
        }
        yield { d: kind === 'polling' ? `programmed I/O: the CPU reads the device's status register every ${rate} cycles; an event the device raises is only noticed at the next poll, and two events between polls look like one` : `interrupt-driven I/O: the device raises the interrupt line at the event; the CPU finishes its current instruction, then runs the ISR for ${s.service} cycles and resumes` };
        let pendingEv = []; let isrLeft = 0;
        for (let t = 0; t < T; t++) {
          if (events.includes(t)) { dev[t] = 1; pendingEv.push(t); }
          if (kind === 'polling') {
            if (t % rate === 0) { s.polls++; cpu[t] = 'poll'; if (pendingEv.length) { const first = pendingEv[0]; s.latency.push(t - first); if (pendingEv.length > 1) { s.missed += pendingEv.length - 1; note[t] = `${pendingEv.length} events since the last poll: ${pendingEv.length - 1} missed`; } cpu[t] = 'service'; pendingEv = []; note[t] = note[t] || `event at ${first} noticed after ${t - first} cycle${t - first === 1 ? '' : 's'}`; } else note[t] = 'poll: nothing new'; }
          } else {
            if (isrLeft > 0) { cpu[t] = 'isr'; isrLeft--; }
            else if (pendingEv.length) { const first = pendingEv.shift(); s.latency.push(t - first); cpu[t] = 'isr'; isrLeft = s.service - 1; note[t] = `interrupt from the event at ${first}: save PC, jump to the ISR`; }
          }
          s.cur = t;
          if (note[t] || dev[t]) yield { d: `cycle ${t}: ${dev[t] ? `device raises an event${kind === 'interrupt' && isrLeft === 0 && cpu[t] !== 'isr' ? '' : ''}` : ''}${dev[t] && note[t] ? '; ' : ''}${note[t] || (dev[t] && kind === 'polling' ? ' — the CPU does not know yet' : dev[t] ? ' — the interrupt line goes up' : '')}` };
        }
        s.phase = 'done';
        const avg = s.latency.length ? (s.latency.reduce((a, b) => a + b, 0) / s.latency.length).toFixed(1) : '—';
        yield { d: kind === 'polling' ? `${s.polls} polls in ${T} cycles (${Math.round(100 * s.polls / T)}% of the CPU's time), average latency ${avg} cycles, ${s.missed} event${s.missed === 1 ? '' : 's'} missed — a faster poll rate cuts latency and misses but burns more cycles` : `${events.length} interrupts serviced with an average latency of ${avg} cycles and no polling overhead; the cost is ${s.service} ISR cycles per event plus the context switch` };
      }
    },
    render(s) {
      if (!s.rows) return '';
      const T = s.T, slot = 22, x0 = 70, rowH = 34;
      const rowsDef = s.kind === 'dma' ? [['bus', s.rows.bus], ['CPU', s.rows.cpu]] : [['device', s.rows.dev], ['CPU', s.rows.cpu]];
      const H = 30 + rowsDef.length * rowH + 20, W = x0 + T * slot + 20;
      let g = svgOpen(W, H) + defs();
      const colour = v => v === 'work' ? [C.okBg, C.ok] : v === 'poll' ? [C.warnBg, C.warn] : v === 'service' || v === 'isr' ? [C.blueBg, C.blue] : v === 'stall' ? [C.hiBg, C.hi] : v === 'mem' ? [C.purpleBg, C.purple] : v === 'dma' ? [C.blueBg, C.blue] : v === 'cpu' ? [C.purpleBg, C.purple] : ['#f8fafc', '#e2e8f0'];
      rowsDef.forEach(([name, arr], r) => {
        const y = 24 + r * rowH; g += text(x0 - 8, y + 16, name, 'arch-small', 'text-anchor="end"');
        for (let t = 0; t < T; t++) {
          const x = x0 + t * slot;
          if (name === 'device') { if (arr[t]) g += `<path d="M ${x + slot / 2} ${y + 20} l -6 0 l 6 -14 l 6 14 z" fill="${C.hi}"/>`; else g += line(x, y + 20, x + slot, y + 20, '#e2e8f0', 1); }
          else { const v = arr[t]; if (t > s.cur && s.phase !== 'done') continue; const [bg, st] = colour(v); g += rect(x + 1, y + 2, slot - 2, 22, bg, st, 3); if (v !== 'work' && v !== 'free') g += text(x + slot / 2, y + 17, v === 'service' ? 'svc' : v === 'stall' ? '✕' : v === 'mem' ? 'M' : v === 'dma' ? 'D' : v === 'cpu' ? 'C' : v === 'poll' ? 'P' : v, 'arch-idx', `fill="${st}" font-weight="700"`); }
        }
      });
      for (let t = 0; t < T; t += 2) g += text(x0 + t * slot + slot / 2, H - 4, String(t), 'arch-idx');
      if (s.cur >= 0 && s.phase !== 'done') g += rect(x0 + s.cur * slot, 20, slot, rowsDef.length * rowH, 'none', C.warn, 3);
      g += '</svg>';
      const legend = s.kind === 'dma' ? `${tag('D DMA transfer', 'blue')} ${tag('C CPU memory access', 'purple')} ${tag('✕ CPU stalled', 'hi')} ${tag('free', 'muted')}` : s.kind === 'polling' ? `${tag('P poll', 'warn')} ${tag('svc service', 'blue')} ${tag('work', 'ok')}` : `${tag('isr', 'blue')} ${tag('work', 'ok')}`;
      return g + `<div class="arch-line">${legend}</div>`;
    }
  };

  /* ═══════════════════════ shell ═══════════════════════ */
  class Viewer {
    constructor(id, cfg) {
      this.id = id; this.cfg = cfg; this.mode = MODES[cfg.mode];
      if (!this.mode) throw new Error('unknown arch mode ' + cfg.mode);
      this.el = typeof document !== 'undefined' ? document.getElementById('sim-' + id) : null;
      // controls are per mode, or per block when the mode builds them from the block (circuit: one toggle per input)
      this.controls = this.mode.setup ? this.mode.setup(cfg, this.mode.init(cfg)) : this.mode.controls || [];
      this.values = {}; this.seedValues();
      this.reset();
    }
    seedValues() {
      for (const c of this.controls) if (c.kind !== 'button') this.values[c.name] = this.cfg[c.name] !== undefined ? this.cfg[c.name] : c.default === undefined ? '' : c.default;
    }
    reset() {
      this.state = this.mode.init(this.cfg);
      this.steps = [{ d: this.cfg.intro || `${this.mode.title}: ${this.scriptText()}`, hl: {}, state: clone(this.state) }];
      this.i = 0;
      const ops = this.scripted();
      if (ops.length) for (const op of ops) this.run(op.name, op.args, true);
      else if (this.mode.auto) this.run(this.mode.auto.op, (this.mode.auto.args || []).map(n => this.values[n]), true);
      this.i = this.steps.length > 1 ? 1 : 0;
      if (this.el) this.render();
    }
    scripted() {
      const ops = Array.isArray(this.cfg.ops) ? this.cfg.ops : [];
      return ops.map(o => { if (typeof o === 'string') { const [name, ...rest] = o.trim().split(/\s+/); return { name, args: rest.map(x => isNaN(+x) || x === '' ? x : +x) }; } return { name: o.op || o.name, args: o.args || [] }; });
    }
    scriptText() { const ops = this.scripted(); return ops.length ? `scripted operations ${ops.map(o => o.name + (o.args.length ? '(' + o.args.join(', ') + ')' : '()')).join(', ')} — step through them, then use the controls` : 'step through, then change the inputs and run again'; }
    run(name, args, quiet) {
      const op = this.mode.ops[name];
      if (!op) { this.steps.push({ d: `unknown operation ${name}`, hl: { err: true }, state: clone(this.state) }); return; }
      const before = this.steps.length;
      try { const g = op.call(this.mode, this.state, args || [], this.cfg, this.values); for (const st of g) this.steps.push({ d: st.d, hl: st.hl || {}, state: clone(this.state) }); }
      catch (e) { this.steps.push({ d: 'internal error: ' + (e && e.message), hl: { err: true }, state: clone(this.state) }); if (typeof console !== 'undefined') console.warn('arch.js', e); }
      if (!quiet) { this.i = Math.min(before, this.steps.length - 1); this.render(); }
    }
    goto(k) { this.i = Math.max(0, Math.min(this.steps.length - 1, k)); this.render(); }
    render() {
      const el = this.el; if (!el) return;
      const step = this.steps[this.i];
      const r = this.mode.render(step.state, step, this);
      const main = typeof r === 'string' ? r : r.html, side = typeof r === 'string' ? '' : r.side;
      const ctrls = this.controls.map(c => {
        if (c.kind === 'button') return `<button class="btn fa-btn arch-op${c.primary ? ' arch-primary' : ''}" data-op="${esc(c.op)}" data-args="${esc((c.args || []).join(','))}">${esc(c.label)}</button>`;
        if (c.kind === 'select') return `<label class="arch-field">${esc(c.label)} <select data-name="${esc(c.name)}">${c.options.map(o => `<option value="${esc(o)}" ${String(this.values[c.name]) === String(o) ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select></label>`;
        if (c.kind === 'toggle') return `<button class="btn fa-btn fa-secondary arch-toggle" data-toggle="${esc(c.name)}">${esc(c.label)} = ${esc(String(this.values[c.name]))}</button>`;
        if (c.kind === 'textarea') return `<label class="arch-field arch-wide">${esc(c.label)} <textarea class="arch-text" data-name="${esc(c.name)}" rows="${c.rows || 6}" spellcheck="false">${esc(this.values[c.name])}</textarea></label>`;
        return `<label class="arch-field">${esc(c.label)} <input class="arch-input${c.wide ? ' wide' : ''}" data-name="${esc(c.name)}" type="${c.kind === 'number' ? 'number' : 'text'}" value="${esc(this.values[c.name])}" size="${c.kind === 'number' ? 4 : c.wide ? 24 : 10}"></label>`;
      }).join('');
      const last = this.i === this.steps.length - 1;
      el.innerHTML = `<div class="arch-wrap">
        <div class="arch-toolbar">${ctrls}<button class="btn fa-btn fa-secondary" data-act="reset" title="back to the block's own inputs">⟲ Reset</button></div>
        <div class="arch-playback">
          <button class="btn fa-btn fa-secondary" data-act="first" ${this.i === 0 ? 'disabled' : ''}>|◀</button>
          <button class="btn fa-btn fa-secondary" data-act="back" ${this.i === 0 ? 'disabled' : ''}>◀ Back</button>
          <button class="btn fa-btn arch-step" data-act="step" ${last ? 'disabled' : ''}>Step ▶</button>
          <button class="btn fa-btn fa-secondary" data-act="last" ${last ? 'disabled' : ''}>▶|</button>
          <span class="arch-counter">step ${this.i} of ${this.steps.length - 1}</span>
        </div>
        <div class="arch-desc ${step.hl && step.hl.err ? 'err' : ''}">${esc(step.d)}</div>
        <div class="arch-main ${side ? 'with-side' : ''}"><div class="arch-figure">${main}</div>${side ? `<div class="arch-side">${side}</div>` : ''}</div>
      </div>`;
      el.querySelectorAll('[data-act]').forEach(b => b.addEventListener('click', () => { const a = b.dataset.act; if (a === 'reset') { this.seedValues(); this.reset(); } else if (a === 'first') this.goto(0); else if (a === 'back') this.goto(this.i - 1); else if (a === 'step') this.goto(this.i + 1); else this.goto(Infinity); }));
      el.querySelectorAll('[data-name]').forEach(inp => { const h = () => { this.values[inp.dataset.name] = inp.value; }; inp.addEventListener('change', h); inp.addEventListener('input', h); });
      el.querySelectorAll('.arch-op').forEach(b => b.addEventListener('click', () => { const names = b.dataset.args ? b.dataset.args.split(',').filter(Boolean) : []; this.run(b.dataset.op, names.map(n => this.values[n])); }));
      el.querySelectorAll('.arch-toggle').forEach(b => b.addEventListener('click', () => { const n = b.dataset.toggle; this.values[n] = String(this.values[n]) === '1' ? 0 : 1; if (this.mode.onToggle) this.run(this.mode.onToggle.op, (this.mode.onToggle.args || []).map(k => this.values[k])); else this.render(); }));
    }
  }

  const UIS = {};
  ARCH.mount = function (id, cfg) { const v = new Viewer(id, cfg || {}); UIS[id] = v; v.render(); return v; };
  ARCH.ui = id => UIS[id];
  ARCH.modes = () => Object.keys(MODES);
  // DOM-free driver for tests: ARCH.model(cfg) → { state, steps, run(name, args) → new steps, render(k) }
  ARCH.model = function (cfg) {
    const v = new Viewer('test', cfg);
    return { get state() { return v.state; }, get steps() { return v.steps; }, values: v.values, run(name, args) { const before = v.steps.length; v.run(name, args, true); return v.steps.slice(before); }, render(k) { const st = v.steps[k === undefined ? v.steps.length - 1 : k]; return v.mode.render(st.state, st, v); } };
  };
  ARCH.floatEncode = floatEncode; ARCH.floatDecode = floatDecode; ARCH.addBits = addBits;

  if (typeof window !== 'undefined') window.ARCH = ARCH;
  if (typeof module !== 'undefined' && module.exports) module.exports = ARCH;
})();
