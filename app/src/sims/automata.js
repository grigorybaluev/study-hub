/* ── Finite automata & grammars: JFLAP-style engine + UI (COMP 335) ─────────
   Pure engine (no DOM): FA.closure, FA.run, FA.subset, FA.minimize, FA.derive, string/set tools.
   UI: FA.mount(id, cfg) builds the simulator inside #sim-<id>; controls call FA.ui('<id>').method().
   Every stepper offers manual stepping (Reset / Back / Step / End) and automatic playback (Play with speed). */
(function () {
  'use strict';
  const FA = window.FA = {};
  const LAMBDA = 'λ';
  FA.LAMBDA = LAMBDA;

  /* ════════════════════════════════════════════════════════════════
     1. Example machines (transcribed from the lecture slides)
     ════════════════════════════════════════════════════════════════ */
  function S(id, x, y, label) { return { id, x, y, label: label || id }; }
  function T(from, sym, to) { return { from, sym, to }; }
  function expand(list) {           // 'q0 a q1; q0 b q5; q5 a,b q5' → transitions
    const out = [];
    list.split(';').map(s => s.trim()).filter(Boolean).forEach(rule => {
      const [from, syms, to] = rule.split(/\s+/);
      syms.split(',').forEach(sym => out.push(T(from, sym, to)));
    });
    return out;
  }
  const M = FA.machines = {};
  FA.expand = expand;
  /** A machine for a static diagram (#111): `{machine: id}` from the library above, or an inline spec
   *  `{type, states, start, finals, trans}` where states are "q0 60 120, q1 …" (id x y) or bare ids
   *  (then laid out on a row, or on a circle for more than four states). */
  FA.fromSpec = function (spec) {
    if (spec.machine) {
      const lib = M[spec.machine];
      if (!lib) throw new Error('unknown machine ' + spec.machine);
      return crop(Object.assign({}, lib, { states: lib.states.map(q => Object.assign({}, q)) }));   // a copy: the simulator keeps its canvas
    }
    const list = v => (Array.isArray(v) ? v.map(String) : String(v || '').split(',')).map(x => x.trim()).filter(Boolean);
    const items = list(spec.states).map(x => x.split(/\s+/));
    let states;
    if (items.every(a => a.length >= 3)) {
      states = items.map(a => S(a[0], +a[1], +a[2]));
      const bad = states.find(q => !Number.isFinite(q.x) || !Number.isFinite(q.y));
      if (bad) throw new Error('state ' + bad.id + ': coordinates must be numbers ("q0 60 120")');
    }
    else if (items.length <= 4) states = items.map((a, i) => S(a[0], 90 + i * 150, 120));
    else { const n = items.length, cx = 240, cy = 170, r = 125; states = items.map((a, i) => S(a[0], Math.round(cx + r * Math.cos(Math.PI + 2 * Math.PI * i / n)), Math.round(cy + r * Math.sin(Math.PI + 2 * Math.PI * i / n)))); }
    const m = { id: spec.id || 'inline', type: spec.type || 'dfa', name: spec.name || '', states,
      start: spec.start || states[0].id, finals: list(spec.finals),
      trans: expand(Array.isArray(spec.trans) ? spec.trans.join(';') : String(spec.trans || '')), curves: spec.curves || {} };
    const known = new Set(states.map(q => q.id)), unknown = [m.start, ...m.finals, ...m.trans.flatMap(t => [t.from, t.to])].find(id => !known.has(id));
    if (unknown) throw new Error('state ' + unknown + ' is used but not listed in states');
    m.alphabet = [...new Set(m.trans.map(t => t.sym).filter(x => x !== LAMBDA))].sort();
    return crop(m);
  };
  // shrink the canvas to the states, leaving room for the start arrow (left) and self-loops (top)
  function crop(m) {
    const pts = m.states.map(q => [q.x, q.y]), at = {};
    m.states.forEach(q => { at[q.id] = q; });
    Object.keys(m.curves || {}).forEach(k => {     // a curved edge bulges out by half its bend, plus room for its label
      const [f, t] = k.split('|'), P = at[f], Q = at[t], bend = m.curves[k];
      if (!P || !Q || f === t || !bend || !m.trans.some(x => x.from === f && x.to === t)) return;
      const dx = Q.x - P.x, dy = Q.y - P.y, d = Math.hypot(dx, dy) || 1, off = bend / 2 + Math.sign(bend) * 18;
      pts.push([(P.x + Q.x) / 2 - dy / d * off, (P.y + Q.y) / 2 + dx / d * off]);
    });
    const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
    const left = Math.min(...xs) - 70, top = Math.min(...ys) - 90;
    m.states.forEach(q => { q.x -= left; q.y -= top; });
    m.w = Math.max(...xs) - left + 45; m.h = Math.max(...ys) - top + 45;
    return m;
  }
  function def(m) { m.alphabet = m.alphabet || [...new Set(m.trans.map(t => t.sym).filter(s => s !== LAMBDA))].sort(); M[m.id] = m; return m; }

  // Lecture 1 p.96 / Lecture 2 p.5 — the running DFA example, L = {abba}
  def({ id: 'dfa-abba', type: 'dfa', name: 'DFA: L(M) = {abba}', source: 'Lec 1 p.96, Lec 2 p.5–14', sample: 'abba',
    states: [S('q0', 60, 210), S('q1', 170, 210), S('q2', 280, 210), S('q3', 390, 210), S('q4', 500, 210), S('q5', 390, 70)],
    start: 'q0', finals: ['q4'],
    trans: expand('q0 a q1; q0 b q5; q1 b q2; q1 a q5; q2 b q3; q2 a q5; q3 a q4; q3 b q5; q4 a,b q5; q5 a,b q5'),
    curves: { 'q0|q5': 70, 'q1|q5': 45, 'q2|q5': 25 }, w: 600, h: 270 });
  // Lecture 2 p.25 — same graph, F = {q0, q2, q4}, L = {λ, ab, abba}
  def({ id: 'dfa-lambda-ab-abba', type: 'dfa', name: 'DFA: L(M) = {λ, ab, abba}', source: 'Lec 2 p.25', sample: 'ab',
    states: M['dfa-abba'].states, start: 'q0', finals: ['q0', 'q2', 'q4'], trans: M['dfa-abba'].trans, curves: M['dfa-abba'].curves, w: 600, h: 270 });
  // Lecture 1 p.110 / Lecture 2 p.28 — L = {aⁿb : n ≥ 0}
  def({ id: 'dfa-anb', type: 'dfa', name: 'DFA: L(M) = {aⁿb : n ≥ 0}', source: 'Lec 1 p.110, Lec 2 p.28', sample: 'aab',
    states: [S('q0', 110, 170), S('q1', 310, 170), S('q2', 510, 170)], start: 'q0', finals: ['q1'],
    trans: expand('q0 a q0; q0 b q1; q1 a,b q2; q2 a,b q2'), w: 600, h: 240 });
  // Lecture 2 p.29 — all strings with prefix ab
  def({ id: 'dfa-prefix-ab', type: 'dfa', name: 'DFA: all strings with prefix ab', source: 'Lec 2 p.29', sample: 'abba',
    states: [S('q0', 100, 110), S('q1', 300, 110), S('q2', 500, 110), S('q3', 300, 250)], start: 'q0', finals: ['q2'],
    trans: expand('q0 a q1; q0 b q3; q1 b q2; q1 a q3; q2 a,b q2; q3 a,b q3'), w: 600, h: 320 });
  // Lecture 2 p.30 — w does not contain the substring 001 (alphabet {0,1})
  def({ id: 'dfa-no-001', type: 'dfa', name: 'DFA: strings without substring 001', source: 'Lec 2 p.30', sample: '01001',
    states: [S('s0', 90, 170, 'λ'), S('s1', 250, 170, '0'), S('s2', 410, 170, '00'), S('s3', 560, 170, '001')], start: 's0', finals: ['s0', 's1', 's2'],
    trans: expand('s0 1 s0; s0 0 s1; s1 1 s0; s1 0 s2; s2 0 s2; s2 1 s3; s3 0,1 s3'), w: 640, h: 240 });
  // Lecture 2 p.33 — L = {awa : w ∈ {a,b}*}
  def({ id: 'dfa-awa', type: 'dfa', name: 'DFA: L = {awa : w ∈ {a,b}*}', source: 'Lec 2 p.33', sample: 'abba',
    states: [S('q0', 100, 120), S('q2', 320, 120), S('q3', 540, 120), S('q4', 100, 270)], start: 'q0', finals: ['q3'],
    trans: expand('q0 a q2; q0 b q4; q2 b q2; q2 a q3; q3 a q3; q3 b q2; q4 a,b q4'), w: 620, h: 340 });
  // Lecture 2 p.116 — DFA M2 with L = {10}*
  def({ id: 'dfa-10star', type: 'dfa', name: 'DFA M₂: L = {10}*', source: 'Lec 2 p.116', sample: '1010',
    states: [S('q0', 100, 170), S('q1', 300, 170), S('q2', 500, 170)], start: 'q0', finals: ['q0'],
    trans: expand('q0 1 q1; q1 0 q0; q0 0 q2; q1 1 q2; q2 0,1 q2'), curves: { 'q0|q2': -70 }, w: 600, h: 260 });
  // Lecture 2 p.38 — NFA with two choices, L = {aa}
  def({ id: 'nfa-aa', type: 'nfa', name: 'NFA: L = {aa} (two choices on a)', source: 'Lec 2 p.38–68', sample: 'aa',
    states: [S('q0', 100, 170), S('q1', 300, 80), S('q2', 500, 80), S('q3', 300, 260)], start: 'q0', finals: ['q2'],
    trans: expand('q0 a q1; q0 a q3; q1 a q2'), w: 600, h: 330 });
  // Lecture 2 p.69 — null (λ) transitions, L = {aa}
  def({ id: 'nfa-lambda-aa', type: 'nfa', name: 'NFA with λ-transition: L = {aa}', source: 'Lec 2 p.69–80', sample: 'aa',
    states: [S('q0', 80, 150), S('q1', 240, 150), S('q2', 400, 150), S('q3', 560, 150)], start: 'q0', finals: ['q3'],
    trans: expand('q0 a q1; q1 λ q2; q2 a q3'), w: 640, h: 220 });
  // Lecture 2 p.81 — L = {ab}⁺
  def({ id: 'nfa-abplus', type: 'nfa', name: 'NFA: L = {ab}⁺ = {ab, abab, ababab, …}', source: 'Lec 2 p.81–94', sample: 'abab',
    states: [S('q0', 80, 150), S('q1', 240, 150), S('q2', 400, 150), S('q3', 560, 150)], start: 'q0', finals: ['q2'],
    trans: expand('q0 a q1; q1 b q2; q2 λ q3; q3 λ q0'), curves: { 'q3|q0': 80 }, w: 640, h: 280 });
  // Lecture 2 p.95 — L = {10}* with a redundant state
  def({ id: 'nfa-10star', type: 'nfa', name: 'NFA: L = {10}* (q₂ redundant)', source: 'Lec 2 p.95–102', sample: '1010',
    states: [S('q0', 120, 150), S('q1', 320, 150), S('q2', 520, 150)], start: 'q0', finals: ['q0'],
    trans: expand('q0 1 q1; q1 0 q0; q1 0,1 q2; q0 λ q2'), curves: { 'q0|q2': -80 }, w: 620, h: 260 });
  // Lecture 2 p.116 — NFA M1 with L = {10}*
  def({ id: 'nfa-10star-m1', type: 'nfa', name: 'NFA M₁: L = {10}*', source: 'Lec 2 p.116', sample: '1010',
    states: [S('q0', 200, 150), S('q1', 440, 150)], start: 'q0', finals: ['q0'],
    trans: expand('q0 1 q1; q1 0 q0'), w: 640, h: 220 });
  // Lecture 2 p.103–111 — L = {ab}* ∪ {ab}*{aa}
  def({ id: 'nfa-abstar-aa', type: 'nfa', name: 'NFA: L = {ab}* ∪ {ab}*{aa}', source: 'Lec 2 p.103–113', sample: 'abaa',
    states: [S('q0', 80, 230), S('q1', 240, 230), S('q2', 400, 230), S('q3', 560, 230), S('q4', 170, 80), S('q5', 320, 80)], start: 'q0', finals: ['q0', 'q5'],
    trans: expand('q0 a q1; q1 b q2; q2 λ q3; q3 λ q0; q1 a q4; q1 a q5'), curves: { 'q3|q0': 80 }, w: 640, h: 340 });
  // Lecture 2 p.97 — simplest automata
  def({ id: 'nfa-empty', type: 'nfa', name: 'M₁: L(M₁) = ∅ (no final state)', source: 'Lec 2 p.97', sample: '',
    states: [S('q0', 300, 120)], start: 'q0', finals: [], trans: [], alphabet: ['a'], w: 600, h: 200 });
  def({ id: 'nfa-lambda-only', type: 'nfa', name: 'M₂: L(M₂) = {λ}', source: 'Lec 2 p.97', sample: '',
    states: [S('q0', 300, 120)], start: 'q0', finals: ['q0'], trans: [], alphabet: ['a'], w: 600, h: 200 });
  // Lecture 2 p.124–137 — NFA to convert
  def({ id: 'nfa-conv', type: 'nfa', name: 'NFA M from the conversion example (Lec 2 p.124)', source: 'Lec 2 p.124–138', sample: 'aab',
    states: [S('q0', 120, 170), S('q1', 320, 170), S('q2', 520, 170)], start: 'q0', finals: ['q1'],
    trans: expand('q0 a q1; q1 a q1; q1 λ q2; q2 b q0'), curves: { 'q2|q0': 70 }, w: 640, h: 270 });
  // Lecture 2 p.154–158 — DFA to minimise (q3 inaccessible; q0 ≡ q2)
  def({ id: 'dfa-min', type: 'dfa', name: 'DFA to minimise (Lec 2 p.154)', source: 'Lec 2 p.154–158', sample: 'abab',
    states: [S('q0', 100, 200), S('q1', 300, 200), S('q2', 500, 200), S('q3', 500, 60)], start: 'q0', finals: ['q1'],
    trans: expand('q0 a q1; q0 b q2; q1 a q1; q1 b q2; q2 a q1; q2 b q0; q3 a q3; q3 b q2'), curves: { 'q0|q2': -80, 'q2|q0': 80 }, w: 620, h: 300 });

  // Regular languages unit (#165): the running machines of the closure constructions, the state-elimination
  // example, and the two grammar conversions. Laid out tight; `crop` below frames them.
  def({ id: 'rl-m1', type: 'nfa', name: 'M₁: L₁ = {aⁿb : n ≥ 0}', sample: 'aab',
    states: [S('p0', 100, 120), S('p1', 260, 120)], start: 'p0', finals: ['p1'], trans: expand('p0 a p0; p0 b p1') });
  def({ id: 'rl-m2', type: 'nfa', name: 'M₂: L₂ = {ba}', sample: 'ba',
    states: [S('r0', 100, 120), S('r1', 230, 120), S('r2', 360, 120)], start: 'r0', finals: ['r2'], trans: expand('r0 b r1; r1 a r2') });
  def({ id: 'rl-union', type: 'nfa', name: 'L₁ ∪ L₂ = {aⁿb} ∪ {ba}', sample: 'aab',
    states: [S('s', 40, 150), S('p0', 170, 70), S('p1', 320, 70), S('r0', 150, 230), S('r1', 260, 230), S('r2', 370, 230), S('f', 480, 150)], start: 's', finals: ['f'],
    trans: expand('s λ p0; s λ r0; p0 a p0; p0 b p1; r0 b r1; r1 a r2; p1 λ f; r2 λ f') });
  def({ id: 'rl-concat', type: 'nfa', name: 'L₁L₂ = {aⁿbba}', sample: 'abba',
    states: [S('p0', 50, 100), S('p1', 180, 100), S('r0', 310, 100), S('r1', 430, 100), S('r2', 550, 100)], start: 'p0', finals: ['r2'],
    trans: expand('p0 a p0; p0 b p1; p1 λ r0; r0 b r1; r1 a r2') });
  def({ id: 'rl-star', type: 'nfa', name: 'L₁* = {aⁿb}*', sample: 'abaab',
    states: [S('s', 40, 150), S('p0', 170, 150), S('p1', 320, 150), S('f', 450, 150)], start: 's', finals: ['f'],
    trans: expand('s λ p0; p0 a p0; p0 b p1; p1 λ f; p1 λ p0; s λ f'), curves: { 'p1|p0': 40, 's|f': 80 } });
  def({ id: 'rl-reverse', type: 'nfa', name: 'L₁ᴿ = {baⁿ}', sample: 'baa',
    states: [S('p1', 60, 100), S('p0', 220, 100)], start: 'p1', finals: ['p0'], trans: expand('p1 b p0; p0 a p0') });
  def({ id: 'rl-complement', type: 'dfa', name: 'complement of L₁ = {a,b}* − {aⁿb}', sample: 'aba',
    states: [S('q0', 60, 120), S('q1', 220, 120), S('t', 380, 120)], start: 'q0', finals: ['q0', 't'], trans: expand('q0 a q0; q0 b q1; q1 a,b t; t a,b t') });
  def({ id: 'rl-elim', type: 'nfa', name: 'NFA for (bb*a)*bb*(a+b)b*', sample: 'bab',
    states: [S('q0', 60, 120), S('q1', 220, 120), S('q2', 380, 120)], start: 'q0', finals: ['q2'],
    trans: expand('q0 b q1; q1 b q1; q1 a q0; q1 a,b q2; q2 b q2'), curves: { 'q0|q1': 30, 'q1|q0': 30 } });
  def({ id: 'rl-grammar-nfa', type: 'nfa', name: 'From S → aA | B, A → aaB, B → bB | a', sample: 'aaaba',
    states: [S('S', 60, 80), S('A', 220, 80), S('x', 380, 80), S('B', 380, 220), S('VF', 540, 220)], start: 'S', finals: ['VF'],
    trans: expand('S a A; S λ B; A a x; x a B; B b B; B a VF') });
  def({ id: 'rl-nfa-grammar', type: 'nfa', name: 'NFA for ab*ab(b*ab)*', sample: 'abab',
    states: [S('q0', 60, 120), S('q1', 200, 120), S('q2', 340, 120), S('q3', 480, 120)], start: 'q0', finals: ['q3'],
    trans: expand('q0 a q1; q1 b q1; q1 a q2; q2 b q3; q3 λ q1'), curves: { 'q3|q1': 60 } });
  ['rl-m1', 'rl-m2', 'rl-union', 'rl-concat', 'rl-star', 'rl-reverse', 'rl-complement', 'rl-elim', 'rl-grammar-nfa', 'rl-nfa-grammar'].forEach(id => crop(M[id]));

  /* ════════════════════════════════════════════════════════════════
     2. Engine
     ════════════════════════════════════════════════════════════════ */
  function delta(m, q, sym) { return m.trans.filter(t => t.from === q && t.sym === sym).map(t => t.to); }
  FA.delta = delta;
  // λ-closure of a set of states
  function closure(m, set) {
    const out = new Set(set); const stack = [...set];
    while (stack.length) { const q = stack.pop(); delta(m, q, LAMBDA).forEach(p => { if (!out.has(p)) { out.add(p); stack.push(p); } }); }
    return out;
  }
  FA.closure = closure;
  // δ*(set, a): closure( ∪ δ(q, a) ) with q ranging over closure(set)
  function move(m, set, sym) {
    const next = new Set();
    closure(m, set).forEach(q => delta(m, q, sym).forEach(p => next.add(p)));
    return closure(m, next);
  }
  FA.move = move;
  const sortQ = set => [...set].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  const key = set => sortQ(set).join(',');
  FA.key = key;

  // Run w on a machine. Returns { steps: [snapshot...], accepted }.
  // snapshot = { pos, states:[...active], dead:[...states that could not read the symbol], sym, note }
  function run(m, w) {
    const steps = [];
    let cur = closure(m, [m.start]);
    steps.push({ pos: 0, states: sortQ(cur), dead: [], sym: null, note: 'initial configuration' });
    for (let i = 0; i < w.length; i++) {
      const sym = w[i];
      const cl = closure(m, cur);
      const dead = [...cl].filter(q => delta(m, q, sym).length === 0);
      const next = move(m, cur, sym);
      steps.push({ pos: i + 1, states: sortQ(next), dead: sortQ(dead), sym, note: next.size ? 'read ' + sym : 'read ' + sym + ' — no transition: the automaton hangs' });
      cur = next;
      if (!cur.size) { steps[steps.length - 1].hung = true; return { steps, accepted: false, consumed: i + 1, w }; }
    }
    const accepted = [...cur].some(q => m.finals.includes(q));
    return { steps, accepted, consumed: w.length, w };
  }
  FA.run = run;
  FA.accepts = (m, w) => run(m, w).accepted;

  // NFA → DFA (subset construction, exactly the 4-step algorithm of the slides)
  function subset(nfa) {
    const log = [];
    const startKey = key([nfa.start]);
    const states = [{ key: startKey, set: [nfa.start] }];
    const trans = [];
    log.push({ type: 'init', text: 'Step 1 — initial state of the DFA: {' + nfa.start + '}', state: startKey });
    let i = 0;
    while (i < states.length) {
      const st = states[i];
      nfa.alphabet.forEach(a => {
        const target = move(nfa, st.set, a);
        const tk = key(target);
        let isNew = false;
        if (!states.find(s => s.key === tk)) { states.push({ key: tk, set: sortQ(target) }); isNew = true; }
        trans.push({ from: st.key, sym: a, to: tk });
        const lhs = st.set.length ? '{' + st.set.join(',') + '}' : '∅';
        const rhs = target.size ? '{' + sortQ(target).join(',') + '}' : '∅';
        log.push({ type: 'trans', text: 'Step 2 — δ*(' + lhs + ', ' + a + ') = ' + rhs + (isNew ? '   (new DFA state)' : ''), from: st.key, sym: a, to: tk, isNew });
      });
      i++;
    }
    const finals = [];
    states.forEach(s => { if (s.set.some(q => nfa.finals.includes(q))) finals.push(s.key); });
    finals.forEach(k => log.push({ type: 'final', text: 'Step 3 — {' + k + '} contains a final state of the NFA ⇒ mark it final', state: k }));
    const acceptsLambda = [...closure(nfa, [nfa.start])].some(q => nfa.finals.includes(q));
    if (acceptsLambda && !finals.includes(startKey)) { finals.push(startKey); log.push({ type: 'final', text: 'Step 4 — the NFA accepts λ ⇒ mark {' + nfa.start + '} final as well', state: startKey }); }
    else log.push({ type: 'note', text: 'Step 4 — the NFA ' + (acceptsLambda ? 'accepts λ (initial state already final)' : 'does not accept λ') + '; nothing more to mark' });
    // layout: BFS layers from the start state
    const layer = {}; layer[startKey] = 0; const order = [startKey];
    for (let j = 0; j < order.length; j++) trans.filter(t => t.from === order[j]).forEach(t => { if (layer[t.to] === undefined) { layer[t.to] = layer[order[j]] + 1; order.push(t.to); } });
    const byLayer = {}; order.forEach(k => { (byLayer[layer[k]] = byLayer[layer[k]] || []).push(k); });
    const L = Object.keys(byLayer).length;
    const W = Math.max(560, 220 * L), H = 320;
    const dfaStates = states.map(s => {
      const l = layer[s.key], col = byLayer[l], idx = col.indexOf(s.key);
      return { id: s.key, label: s.set.length ? '{' + s.set.join(',') + '}' : '∅', x: 100 + l * ((W - 200) / Math.max(1, L - 1)), y: H / (col.length + 1) * (idx + 1) };
    });
    const dfa = { id: nfa.id + '-dfa', type: 'dfa', name: 'DFA M′', states: dfaStates, start: startKey, finals, trans, alphabet: nfa.alphabet, w: W, h: H, bigLabels: true };
    return { dfa, log };
  }
  FA.subset = subset;

  // DFA minimisation (remove inaccessible states, then partition refinement — the "mark" procedure)
  function minimize(dfa) {
    const log = [];
    // 0. inaccessible states
    const reach = new Set([dfa.start]); const st = [dfa.start];
    while (st.length) { const q = st.pop(); dfa.trans.filter(t => t.from === q).forEach(t => { if (!reach.has(t.to)) { reach.add(t.to); st.push(t.to); } }); }
    const removed = dfa.states.map(s => s.id).filter(q => !reach.has(q));
    log.push({ type: 'inaccessible', text: 'Step 0 — inaccessible states (not reachable from ' + dfa.start + '): ' + (removed.length ? removed.join(', ') + ' → removed' : 'none'), removed });
    const Q = dfa.states.map(s => s.id).filter(q => reach.has(q));
    const d = (q, a) => { const t = dfa.trans.find(t => t.from === q && t.sym === a); return t ? t.to : null; };
    // 1. initial partition: non-final / final
    let blocks = [Q.filter(q => !dfa.finals.includes(q)), Q.filter(q => dfa.finals.includes(q))].filter(b => b.length);
    const show = bs => bs.map(b => '{' + b.join(',') + '}').join('  ');
    log.push({ type: 'partition', text: 'Step 1 — split into non-final and final states: ' + show(blocks), blocks: blocks.map(b => b.slice()) });
    let changed = true, round = 0;
    while (changed) {
      changed = false; round++;
      const blockOf = {}; blocks.forEach((b, i) => b.forEach(q => { blockOf[q] = i; }));
      const next = [];
      blocks.forEach(b => {
        const groups = {};
        b.forEach(q => { const sig = dfa.alphabet.map(a => { const t = d(q, a); return t === null ? '-' : blockOf[t]; }).join('|'); (groups[sig] = groups[sig] || []).push(q); });
        const gs = Object.values(groups);
        if (gs.length > 1) changed = true;
        gs.forEach(g => next.push(g));
      });
      const detail = blocks.map(b => b.map(q => q + ': ' + dfa.alphabet.map(a => { const t = d(q, a); return a + '→' + (t === null ? '∅' : t); }).join(', ')).join('; ')).join(' | ');
      blocks = next;
      log.push({ type: 'partition', text: 'Step 2 (round ' + round + ') — where does each state go on each symbol? ' + detail + '. ' + (changed ? 'States that go to different blocks are distinguishable → split: ' : 'No block splits further — the partition is stable: ') + show(blocks), blocks: blocks.map(b => b.slice()) });
    }
    // 2–5. build the reduced DFA
    const labelOf = {}; blocks.forEach(b => { const lab = b.map(q => q.replace(/^q/, '')).join(','); b.forEach(q => { labelOf[q] = lab; }); });
    const pos = {}; dfa.states.forEach(s => { pos[s.id] = s; });
    const states = blocks.map(b => { const rep = b[0]; return { id: labelOf[rep], label: labelOf[rep], x: pos[rep].x, y: pos[rep].y, members: b }; });
    const seen = new Set(); const trans = [];
    blocks.forEach(b => dfa.alphabet.forEach(a => { const t = d(b[0], a); if (t === null) return; const k = labelOf[b[0]] + '|' + a + '|' + labelOf[t]; if (!seen.has(k)) { seen.add(k); trans.push({ from: labelOf[b[0]], sym: a, to: labelOf[t] }); } }));
    const start = labelOf[dfa.start];
    const finals = [...new Set(dfa.finals.filter(q => reach.has(q)).map(q => labelOf[q]))];
    log.push({ type: 'result', text: 'Steps 3–5 — one state per block, one transition per (block, symbol); initial state = the block containing 0, i.e. ' + start + '; final states = blocks containing a final state: ' + finals.join(', ') });
    const min = { id: dfa.id + '-min', type: 'dfa', name: 'Minimal DFA M′', states, start, finals, trans, alphabet: dfa.alphabet, w: dfa.w, h: dfa.h, curves: {} };
    if (dfa.curves) Object.keys(dfa.curves).forEach(k => { const parts = k.split('|'); const f = parts[0], t = parts[1]; if (labelOf[f] && labelOf[t] && labelOf[f] !== labelOf[t]) min.curves[labelOf[f] + '|' + labelOf[t]] = dfa.curves[k]; });
    return { min, log, removed, blocks };
  }
  FA.minimize = minimize;

  /* ── Grammars & derivations ───────────────────────────────────── */
  // grammar: { vars:[...], start, rules:[{lhs, rhs:[tokens]}], sep:'' or ' ' }
  const G = FA.grammars = {};
  G['anbn'] = { id: 'anbn', name: 'S → aSb | λ   (L = {aⁿbⁿ : n ≥ 0})', vars: ['S'], start: 'S', sep: '', rules: [{ lhs: 'S', rhs: ['a', 'S', 'b'] }, { lhs: 'S', rhs: [] }], examples: ['ab', 'aabb', 'aaabbb', 'aaaabbbb', ''] };
  G['anbnb'] = { id: 'anbnb', name: 'S → Ab,  A → aAb | λ   (L = {aⁿbⁿb : n ≥ 0})', vars: ['S', 'A'], start: 'S', sep: '', rules: [{ lhs: 'S', rhs: ['A', 'b'] }, { lhs: 'A', rhs: ['a', 'A', 'b'] }, { lhs: 'A', rhs: [] }], examples: ['b', 'abb', 'aabbb', 'aaaabbbbb'] };
  G['english'] = { id: 'english', name: 'sentence → noun_phrase predicate …  (the cat/dog runs/walks)', vars: ['sentence', 'noun_phrase', 'predicate', 'article', 'noun', 'verb'], start: 'sentence', sep: ' ',
    rules: [{ lhs: 'sentence', rhs: ['noun_phrase', 'predicate'] }, { lhs: 'noun_phrase', rhs: ['article', 'noun'] }, { lhs: 'predicate', rhs: ['verb'] },
            { lhs: 'article', rhs: ['a'] }, { lhs: 'article', rhs: ['the'] }, { lhs: 'noun', rhs: ['cat'] }, { lhs: 'noun', rhs: ['dog'] }, { lhs: 'verb', rhs: ['runs'] }, { lhs: 'verb', rhs: ['walks'] }],
    examples: ['the dog walks', 'a cat runs', 'the cat walks'] };
  // Regular languages unit (#165): linear, right-linear and left-linear grammars
  const P = (lhs, rhs) => ({ lhs, rhs });
  G['rl-g1'] = { id: 'rl-g1', name: 'G₁: S → abS | a   (right-linear, L = (ab)*a)', vars: ['S'], start: 'S', sep: '', rules: [P('S', ['a', 'b', 'S']), P('S', ['a'])], examples: ['a', 'aba', 'ababa', 'ab'] };
  G['rl-g2'] = { id: 'rl-g2', name: 'G₂: S → Aa,  A → Aab | λ   (left-linear, L = (ab)*a)', vars: ['S', 'A'], start: 'S', sep: '', rules: [P('S', ['A', 'a']), P('A', ['A', 'a', 'b']), P('A', [])], examples: ['a', 'aba', 'ababa', 'ab'] };
  G['rl-right'] = { id: 'rl-right', name: 'S → aA | B,  A → aaB,  B → bB | a   (L = aaab*a + b*a)', vars: ['S', 'A', 'B'], start: 'S', sep: '', rules: [P('S', ['a', 'A']), P('S', ['B']), P('A', ['a', 'a', 'B']), P('B', ['b', 'B']), P('B', ['a'])], examples: ['aaaba', 'aaaa', 'bba', 'a', 'aba'] };
  G['rl-left'] = { id: 'rl-left', name: 'S → Aab,  A → Aab | B,  B → a   (left-linear, L = a(ab)⁺)', vars: ['S', 'A', 'B'], start: 'S', sep: '', rules: [P('S', ['A', 'a', 'b']), P('A', ['A', 'a', 'b']), P('A', ['B']), P('B', ['a'])], examples: ['aab', 'aabab', 'ab'] };
  G['rl-nfa-g'] = { id: 'rl-nfa-g', name: 'q0 → aq1,  q1 → bq1 | aq2,  q2 → bq3,  q3 → q1 | λ   (from an NFA)', vars: ['q0', 'q1', 'q2', 'q3'], start: 'q0', sep: '', rules: [P('q0', ['a', 'q1']), P('q1', ['b', 'q1']), P('q1', ['a', 'q2']), P('q2', ['b', 'q3']), P('q3', ['q1']), P('q3', [])], examples: ['abab', 'abbab', 'ababab', 'aab'] };
  G['rl-linear'] = { id: 'rl-linear', name: 'S → A,  A → aB | λ,  B → Ab   (linear, not regular: L = {aⁿbⁿ})', vars: ['S', 'A', 'B'], start: 'S', sep: '', rules: [P('S', ['A']), P('A', ['a', 'B']), P('A', []), P('B', ['A', 'b'])], examples: ['ab', 'aabb', '', 'aab'] };

  // Leftmost derivation of w (array of tokens) by breadth-first search with pruning. Returns [{form, rule, at}] or null.
  function derive(g, w, limit) {
    limit = limit || 20000;
    const isVar = t => g.vars.includes(t);
    const startForm = [g.start];
    const seen = new Set([startForm.join('')]);
    const queue = [{ form: startForm, path: [{ form: startForm, rule: null, at: -1 }] }];
    let expanded = 0;
    while (queue.length && expanded < limit) {
      const item = queue.shift(); const form = item.form, path = item.path; expanded++;
      if (form.length === w.length && form.every((t, i) => t === w[i])) return path;
      const at = form.findIndex(isVar);
      if (at < 0) continue;
      const prefix = form.slice(0, at);
      if (prefix.length > w.length || prefix.some((t, i) => t !== w[i])) continue;
      if (form.filter(t => !isVar(t)).length > w.length) continue;
      g.rules.forEach((r, ri) => {
        if (r.lhs !== form[at]) return;
        const nf = form.slice(0, at).concat(r.rhs, form.slice(at + 1));
        const k = nf.join('');
        if (seen.has(k) || nf.length > w.length + 2) return;
        seen.add(k);
        queue.push({ form: nf, path: path.concat([{ form: nf, rule: ri, at }]) });
      });
    }
    return null;
  }
  FA.derive = derive;
  FA.tokenize = (g, s) => g.sep === ' ' ? s.trim().split(/\s+/).filter(Boolean) : s.replace(/\s+/g, '').split('');
  FA.ruleText = (g, r) => r.lhs + ' → ' + (r.rhs.length ? r.rhs.join(g.sep) : LAMBDA);

  /* ── String / language / set tools ────────────────────────────── */
  const uniq = arr => [...new Set(arr)].sort((a, b) => a.length - b.length || a.localeCompare(b));
  FA.str = {
    reverse: u => [...u].reverse().join(''),
    power: (u, n) => u.repeat(n),
    prefixes: u => Array.from({ length: u.length + 1 }, (_, i) => u.slice(0, i)),
    suffixes: u => Array.from({ length: u.length + 1 }, (_, i) => u.slice(i)),
    substrings: u => { const s = new Set(['']); for (let i = 0; i < u.length; i++) for (let j = i + 1; j <= u.length; j++) s.add(u.slice(i, j)); return uniq([...s]); },
  };
  FA.lang = {
    // "a, ab, λ" → ['', 'a', 'ab']
    parse: s => uniq(s.split(',').map(x => x.trim()).filter(Boolean).map(x => /^(λ|lambda|ε|eps)$/i.test(x) ? '' : x)),
    union: (A, B) => uniq(A.concat(B)),
    inter: (A, B) => uniq(A.filter(x => B.includes(x))),
    diff: (A, B) => uniq(A.filter(x => !B.includes(x))),
    concat: (A, B) => uniq(A.flatMap(x => B.map(y => x + y))),
    reverse: A => uniq(A.map(FA.str.reverse)),
    power: (A, n) => { let L = ['']; for (let i = 0; i < n; i++) L = FA.lang.concat(L, A); return L; },
    star: (A, maxLen) => { const out = new Set(['']); let L = ['']; for (let i = 1; i <= maxLen; i++) { L = FA.lang.concat(L, A).filter(x => x.length <= maxLen); if (!L.length) break; L.forEach(x => out.add(x)); } return uniq([...out]); },
    plus: (A, maxLen) => { const s = FA.lang.star(A, maxLen); return A.includes('') ? s : s.filter(x => x !== ''); },
    complement: (A, alphabet, maxLen) => { const all = []; const rec = p => { if (p.length > maxLen) return; all.push(p); alphabet.forEach(a => rec(p + a)); }; rec(''); return uniq(all.filter(x => !A.includes(x))); },
    fmt: L => L.length ? '{ ' + L.map(x => x === '' ? LAMBDA : x).join(', ') + ' }' : '∅',
  };
  FA.sets = {
    parse: s => uniq(s.split(',').map(x => x.trim()).filter(Boolean)),
    powerset: A => { const out = [[]]; A.forEach(a => { const n = out.length; for (let i = 0; i < n; i++) out.push(out[i].concat([a])); }); return out; },
    product: (A, B) => A.flatMap(a => B.map(b => '(' + a + ',' + b + ')')),
    fmt: A => A.length ? '{ ' + A.join(', ') + ' }' : '∅',
  };

  /* ════════════════════════════════════════════════════════════════
     3. SVG renderer
     ════════════════════════════════════════════════════════════════ */
  const R = 22;
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function stateText(label) { return esc(label).replace(/^q(\d+)$/, 'q<tspan baseline-shift="sub" font-size="11">$1</tspan>'); }
  let drawCount = 0;   // marker ids must be unique per drawing: a hidden first SVG would otherwise take the arrowheads with it
  function drawMachine(m, hl) {
    hl = hl || {};
    const uid = 'fa' + (++drawCount);
    const act = new Set(hl.states || []), dead = new Set(hl.dead || []), grey = new Set(hl.grey || []), color = hl.color || {};
    const actEdges = new Set(hl.edges || []);
    const pos = {}; m.states.forEach(s => { pos[s.id] = s; });
    const groups = {}; const order = [];
    m.trans.forEach(t => { const k = t.from + '|' + t.to; if (!groups[k]) { groups[k] = []; order.push(k); } groups[k].push(t.sym); });
    const rr = m.bigLabels ? 32 : R;
    let out = '';
    order.forEach(k => {
      const parts = k.split('|'); const f = parts[0], t = parts[1]; const syms = groups[k]; const P = pos[f], Q = pos[t];
      if (!P || !Q) return;
      const label = syms.join(',');
      const active = syms.some(s => actEdges.has(f + '|' + s + '|' + t));
      const cls = 'fa-edge' + (active ? ' active' : '');
      const mk = active ? 'url(#' + uid + '-arrow-a)' : 'url(#' + uid + '-arrow)';
      if (f === t) {
        const d = 'M ' + (P.x - 10) + ' ' + (P.y - rr + 3) + ' C ' + (P.x - 42) + ' ' + (P.y - rr - 52) + ', ' + (P.x + 42) + ' ' + (P.y - rr - 52) + ', ' + (P.x + 10) + ' ' + (P.y - rr + 3);
        out += '<path d="' + d + '" class="' + cls + '" marker-end="' + mk + '"/><text x="' + P.x + '" y="' + (P.y - rr - 46) + '" class="fa-label">' + esc(label) + '</text>';
        return;
      }
      const both = groups[t + '|' + f] !== undefined;
      const bend = (m.curves && m.curves[k] !== undefined) ? m.curves[k] : (both ? 34 : 0);
      const dx = Q.x - P.x, dy = Q.y - P.y, dd = Math.hypot(dx, dy), ux = dx / dd, uy = dy / dd;
      const nx = -uy, ny = ux;
      const mx = (P.x + Q.x) / 2, my = (P.y + Q.y) / 2;
      const cx = mx + nx * bend, cy = my + ny * bend;
      const dir = (a, b) => { const l = Math.hypot(b.x - a.x, b.y - a.y); return { x: (b.x - a.x) / l, y: (b.y - a.y) / l }; };
      const d1 = dir(P, { x: cx, y: cy }), d2 = dir(Q, { x: cx, y: cy });
      const sx = P.x + d1.x * rr, sy = P.y + d1.y * rr, ex = Q.x + d2.x * (rr + 3), ey = Q.y + d2.y * (rr + 3);
      out += '<path d="M ' + sx + ' ' + sy + ' Q ' + cx + ' ' + cy + ' ' + ex + ' ' + ey + '" class="' + cls + '" marker-end="' + mk + '"/>';
      let lx, ly;
      if (bend === 0) { let px = nx, py = ny; if (py > 0 || (py === 0 && px < 0)) { px = -px; py = -py; } lx = mx + px * 14; ly = my + py * 14; }
      else { const bx = 0.25 * sx + 0.5 * cx + 0.25 * ex, by = 0.25 * sy + 0.5 * cy + 0.25 * ey; const sg = Math.sign(bend); lx = bx + nx * sg * 13; ly = by + ny * sg * 13; }
      out += '<text x="' + lx + '" y="' + ly + '" class="fa-label">' + esc(label) + '</text>';
    });
    m.states.forEach(s => {
      const isFinal = m.finals.includes(s.id);
      const fill = act.has(s.id) ? '#fca5a5' : dead.has(s.id) ? '#e5e7eb' : (color[s.id] || '#ffffff');
      const stroke = act.has(s.id) ? '#dc2626' : grey.has(s.id) ? '#9ca3af' : '#1e293b';
      if (s.id === m.start) out += '<path d="M ' + (s.x - rr - 34) + ' ' + s.y + ' L ' + (s.x - rr - 3) + ' ' + s.y + '" class="fa-edge fa-start" marker-end="url(#' + uid + '-arrow)"/>';
      out += '<circle cx="' + s.x + '" cy="' + s.y + '" r="' + rr + '" fill="' + fill + '" stroke="' + stroke + '" stroke-width="' + (act.has(s.id) ? 3 : 2) + '"' + (grey.has(s.id) ? ' stroke-dasharray="4 3"' : '') + '/>';
      if (isFinal) out += '<circle cx="' + s.x + '" cy="' + s.y + '" r="' + (rr - 5) + '" fill="none" stroke="' + stroke + '" stroke-width="2"/>';
      out += '<text x="' + s.x + '" y="' + (s.y + 5) + '" class="fa-state' + (m.bigLabels ? ' small' : '') + (dead.has(s.id) || grey.has(s.id) ? ' muted' : '') + '">' + stateText(s.label) + '</text>';
      if (dead.has(s.id)) out += '<text x="' + (s.x + rr - 4) + '" y="' + (s.y - rr + 8) + '" class="fa-hang">✕</text>';
    });
    const defs = '<defs><marker id="' + uid + '-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#1e293b"/></marker><marker id="' + uid + '-arrow-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#dc2626"/></marker></defs>';
    return '<svg class="fa-svg" viewBox="0 0 ' + (m.w || 640) + ' ' + (m.h || 300) + '" preserveAspectRatio="xMidYMid meet">' + defs + out + '</svg>';
  }
  FA.drawMachine = drawMachine;

  function tapeHTML(w, pos, hung) {
    const cells = [...w].map((c, i) => '<span class="fa-cell' + (i === pos ? ' head' : '') + (i < pos ? ' read' : '') + '">' + esc(c) + '</span>').join('');
    const end = '<span class="fa-cell end' + (pos >= w.length ? ' head' : '') + '">&nbsp;</span>';
    const note = pos >= w.length ? 'input finished' : hung ? 'input cannot be consumed' : 'read head at position ' + (pos + 1);
    return '<div class="fa-tape">' + cells + end + '<span class="fa-tape-note">' + note + '</span></div>';
  }
  function stateLabelHTML(m, id) { const s = m.states.find(s => s.id === id); return s ? esc(s.label) : esc(id); }
  function setText(m, ids) { return ids.length ? '{' + ids.map(id => stateLabelHTML(m, id)).join(', ') + '}' : '∅'; }

  /* ════════════════════════════════════════════════════════════════
     4. Playback base class (manual stepping + automatic animation)
     ════════════════════════════════════════════════════════════════ */
  const UIS = FA._ui = {};
  FA.ui = id => UIS[id];
  class Player {
    constructor(id) { this.id = id; this.i = 0; this.timer = null; this.speed = 700; this.total = 0; }
    host() { return document.getElementById('sim-' + this.id); }
    at() { return "FA.ui('" + this.id + "')"; }
    controlsHTML() {
      const at = this.at();
      return '<div class="fa-playback">' +
        '<button class="btn fa-btn" onclick="' + at + '.first()" title="Reset">⏮ Reset</button>' +
        '<button class="btn fa-btn" onclick="' + at + '.back()" title="Previous step">◀ Back</button>' +
        '<button class="btn fa-btn" onclick="' + at + '.next()" title="Next step">Step ▶</button>' +
        '<button class="btn fa-btn" onclick="' + at + '.last()" title="Run to the end">⏭ End</button>' +
        '<button class="btn fa-btn fa-play" onclick="' + at + '.toggle()">' + (this.timer ? '⏸ Pause' : '▶ Play') + '</button>' +
        '<label class="fa-speed">Speed <input type="range" min="150" max="2000" step="50" value="' + (2150 - this.speed) + '" oninput="' + at + '.setSpeed(2150 - parseInt(this.value))"><span>' + (1000 / this.speed).toFixed(1) + ' steps/s</span></label>' +
        '<span class="fa-counter">step ' + this.i + ' / ' + this.total + '</span>' +
        '</div>';
    }
    setSpeed(ms) { this.speed = ms; if (this.timer) { this.stop(); this.play(); } else this.render(); }
    first() { this.stop(); this.i = 0; this.render(); }
    back() { this.stop(); if (this.i > 0) this.i--; this.render(); }
    next() { if (this.i < this.total) this.i++; else this.stop(); this.render(); }
    last() { this.stop(); this.i = this.total; this.render(); }
    toggle() { if (this.timer) this.stop(); else this.play(); this.render(); }
    play() {
      if (this.i >= this.total) this.i = 0;
      const self = this;
      this.timer = setInterval(() => {
        if (!self.host()) { self.stop(); return; }          // page changed
        if (self.i >= self.total) { self.stop(); self.render(); return; }
        self.i++; self.render();
      }, this.speed);
    }
    stop() { if (this.timer) { clearInterval(this.timer); this.timer = null; } }
    render() { const h = this.host(); if (h) h.innerHTML = this.html(); }
  }

  /* ── 4a. Run an input on a DFA / NFA ──────────────────────────── */
  class Runner extends Player {
    constructor(id, cfg) {
      super(id); this.cfg = cfg;
      this.machineIds = cfg.machines || Object.keys(M);
      this.mid = cfg.machine || this.machineIds[0];
      this.input = cfg.input !== undefined ? cfg.input : (M[this.mid].sample || '');
      this.multi = cfg.multi || '';
      this.showMulti = false;
      this.compute();
    }
    m() { return M[this.mid]; }
    compute() { this.result = run(this.m(), this.input); this.total = this.result.steps.length - 1; if (this.i > this.total) this.i = this.total; }
    setMachine(id) { this.stop(); this.mid = id; this.i = 0; this.ignored = null; if (M[id].sample !== undefined) this.input = M[id].sample; this.compute(); this.render(); }
    setInput(w) {
      this.stop(); const alpha = this.m().alphabet;
      const bad = [...new Set([...w].filter(c => !alpha.includes(c) && c.trim() !== ''))];
      this.ignored = bad.length ? bad : null;              // reported in the toolbar instead of silently dropped
      this.input = [...w].filter(c => alpha.includes(c)).join(''); this.i = 0; this.compute(); this.render();
    }
    setMulti(t) { this.multi = t; }
    runMulti() { this.showMulti = true; this.render(); }
    toggleMulti() { this.showMulti = !this.showMulti; this.render(); }
    html() {
      const m = this.m(), r = this.result, s = r.steps[this.i], at = this.at();
      const prev = this.i > 0 ? r.steps[this.i - 1] : null;
      const edges = [];
      if (prev) closure(m, prev.states).forEach(q => m.trans.forEach(t => { if (t.from === q && t.sym === s.sym && s.states.includes(t.to)) edges.push(t.from + '|' + t.sym + '|' + t.to); }));
      s.states.forEach(q => m.trans.forEach(t => { if (t.from === q && t.sym === LAMBDA && s.states.includes(t.to)) edges.push(t.from + '|' + t.sym + '|' + t.to); }));
      const finished = this.i === this.total;
      let verdict = '';
      if (finished) {
        if (r.accepted) verdict = '<span class="fa-verdict accept">✔ accept</span> — all input consumed and ' + (m.type === 'dfa' ? 'the automaton is' : 'at least one computation ends') + ' in a final state';
        else if (s.hung) verdict = '<span class="fa-verdict reject">✘ reject</span> — the input cannot be consumed (' + (m.type === 'dfa' ? 'no transition' : 'every computation hangs') + ')';
        else verdict = '<span class="fa-verdict reject">✘ reject</span> — input consumed but ' + (m.type === 'dfa' ? 'the automaton is not' : 'no computation ends') + ' in a final state';
      }
      const consumed = this.input.slice(0, Math.min(s.pos, this.input.length));
      const dstar = 'δ*(' + stateLabelHTML(m, m.start) + ', ' + (esc(consumed) || LAMBDA) + ') = ' + (m.type === 'dfa' ? (s.states.length ? stateLabelHTML(m, s.states[0]) : '∅ (hang)') : setText(m, s.states));
      const rest = esc(this.input.slice(s.pos)) || LAMBDA;
      const configs = s.states.map(q => '<span class="fa-config' + (finished && r.accepted && m.finals.includes(q) ? ' ok' : finished && !r.accepted ? ' bad' : '') + '"><b>' + stateLabelHTML(m, q) + '</b><span class="fa-rest">' + rest + '</span></span>').join('')
        + s.dead.map(q => '<span class="fa-config dead"><b>' + stateLabelHTML(m, q) + '</b><span class="fa-rest">' + (esc(this.input.slice(s.pos - 1)) || LAMBDA) + '</span><i>hangs</i></span>').join('');
      const trace = r.steps.slice(0, this.i + 1).map((st, k) => (k ? ' <span class="fa-arrow">—' + esc(st.sym) + '→</span> ' : '') + '<span class="' + (k === this.i ? 'cur' : '') + '">' + (st.states.length ? (m.type === 'dfa' ? stateLabelHTML(m, st.states[0]) : setText(m, st.states)) : '∅') + '</span>').join('');
      const sel = this.machineIds.length > 1
        ? '<label class="fa-field">Automaton <select onchange="' + at + '.setMachine(this.value)">' + this.machineIds.map(id => '<option value="' + id + '"' + (id === this.mid ? ' selected' : '') + '>' + esc(M[id].name) + '</option>').join('') + '</select></label>'
        : '<span class="fa-machine-name">' + esc(m.name) + '</span>';
      const multi = this.showMulti ? this.multiHTML() : '';
      const idle = '<div class="fa-line fa-note">Press <b>Step ▶</b> to read the next symbol, or <b>▶ Play</b> to animate the whole run.</div>';
      return '<div class="fa-wrap">' +
        '<div class="fa-toolbar">' + sel +
        '<label class="fa-field">Input w <input class="fa-input" type="text" value="' + esc(this.input) + '" spellcheck="false" onchange="' + at + ".setInput(this.value)\" onkeyup=\"if(event.key==='Enter')" + at + '.setInput(this.value)"> <small>Σ = {' + m.alphabet.join(', ') + '}</small></label>' +
        (this.ignored ? '<span class="fa-verdict reject">symbols not in Σ ignored: ' + esc(this.ignored.join(' ')) + '</span>' : '') +
        '<button class="btn fa-btn fa-secondary" onclick="' + at + '.toggleMulti()">' + (this.showMulti ? 'Hide multiple run' : 'Multiple run…') + '</button>' +
        '</div>' + multi +                                  // under the toolbar, where the button is
        this.controlsHTML() +
        tapeHTML(this.input, s.pos, s.hung) +
        drawMachine(m, { states: s.states, dead: s.dead, edges }) +
        '<div class="fa-status">' +
        '<div class="fa-line"><b>Configuration' + (m.type === 'nfa' ? 's' : '') + ':</b> ' + (configs || '<span class="fa-config dead"><b>∅</b><i>no live computation</i></span>') + '</div>' +
        '<div class="fa-line"><b>Trace:</b> ' + trace + '</div>' +
        '<div class="fa-line"><b>Extended transition function:</b> ' + dstar + (s.note && this.i > 0 ? ' &nbsp;<span class="fa-note">(' + esc(s.note) + ')</span>' : '') + '</div>' +
        (finished ? '<div class="fa-line fa-final">' + verdict + '</div>' : idle) +
        '</div></div>';
    }
    multiHTML() {
      const at = this.at(); const m = this.m();
      const lines = this.multi.split('\n').map(x => x.trim()).filter((x, i, a) => x !== '' && a.indexOf(x) === i);
      const rows = lines.map(w => { const ww = w === LAMBDA ? '' : w; const bad = [...ww].some(c => !m.alphabet.includes(c)); const acc = !bad && FA.accepts(m, ww); return '<tr><td>' + esc(w) + '</td><td class="' + (bad ? 'bad' : acc ? 'ok' : 'bad') + '">' + (bad ? 'invalid symbol' : acc ? 'Accept' : 'Reject') + '</td></tr>'; }).join('');
      return '<div class="fa-multi"><div class="fa-line"><b>Multiple run</b> — one string per line (write λ for the empty string):</div>' +
        '<textarea rows="4" spellcheck="false" oninput="' + at + '.setMulti(this.value)">' + esc(this.multi) + '</textarea>' +
        '<button class="btn fa-btn" onclick="' + at + '.runMulti()">Run all</button>' +
        (rows ? '<table class="fa-table"><tr><th>Input</th><th>Result</th></tr>' + rows + '</table>' : '') + '</div>';
    }
  }

  /* ── 4b. NFA → DFA conversion stepper ─────────────────────────── */
  class Converter extends Player {
    constructor(id, cfg) { super(id); this.cfg = cfg; this.machineIds = cfg.machines || ['nfa-conv']; this.mid = cfg.machine || this.machineIds[0]; this.compute(); }
    compute() { this.res = subset(M[this.mid]); this.total = this.res.log.length; this.i = 0; }
    setMachine(id) { this.stop(); this.mid = id; this.compute(); this.render(); }
    html() {
      const nfa = M[this.mid], dfa = this.res.dfa, log = this.res.log, at = this.at();
      const done = log.slice(0, this.i);
      const shownStates = new Set([dfa.start]); const shownTrans = []; const shownFinals = [];
      done.forEach(e => { if (e.type === 'trans') { shownStates.add(e.from); shownStates.add(e.to); shownTrans.push({ from: e.from, sym: e.sym, to: e.to }); } if (e.type === 'final') shownFinals.push(e.state); });
      const partial = Object.assign({}, dfa, { states: dfa.states.filter(s => shownStates.has(s.id)), trans: shownTrans, finals: shownFinals });
      const cur = this.i > 0 ? log[this.i - 1] : null;
      const hlN = {}, hlD = {};
      if (cur && cur.type === 'trans') { hlN.states = cur.from.split(',').filter(Boolean); hlD.states = [cur.from, cur.to]; hlD.edges = [cur.from + '|' + cur.sym + '|' + cur.to]; }
      if (cur && cur.type === 'final') hlD.states = [cur.state];
      if (cur && cur.type === 'init') hlD.states = [dfa.start];
      const sel = this.machineIds.length > 1
        ? '<label class="fa-field">NFA <select onchange="' + at + '.setMachine(this.value)">' + this.machineIds.map(id => '<option value="' + id + '"' + (id === this.mid ? ' selected' : '') + '>' + esc(M[id].name) + '</option>').join('') + '</select></label>'
        : '<span class="fa-machine-name">' + esc(nfa.name) + '</span>';
      const logHTML = log.map((e, k) => '<li class="' + (k < this.i ? 'done' : '') + (k === this.i - 1 ? ' cur' : '') + '">' + esc(e.text) + '</li>').join('');
      const right = this.i === 0 ? '<div class="fa-empty">press Step ▶ to create the initial state {' + esc(nfa.start) + '}</div>' : drawMachine(partial, hlD);
      const done2 = this.i === this.total ? '<div class="fa-line fa-final"><span class="fa-verdict accept">done</span> L(M′) = L(M).  DFA states: ' + dfa.states.map(s => esc(s.label)).join(', ') + ';  final: ' + dfa.finals.map(f => '{' + esc(f) + '}').join(', ') + '</div>' : '';
      return '<div class="fa-wrap"><div class="fa-toolbar">' + sel + '</div>' + this.controlsHTML() +
        '<div class="fa-two"><div><div class="fa-caption">NFA M</div>' + drawMachine(nfa, hlN) + '</div><div><div class="fa-caption">DFA M′ (under construction)</div>' + right + '</div></div>' +
        '<ol class="fa-log">' + logHTML + '</ol>' + done2 + '</div>';
    }
  }

  /* ── 4c. DFA minimisation stepper ─────────────────────────────── */
  class Minimizer extends Player {
    constructor(id, cfg) { super(id); this.cfg = cfg; this.machineIds = cfg.machines || ['dfa-min']; this.mid = cfg.machine || this.machineIds[0]; this.compute(); }
    compute() { this.res = minimize(M[this.mid]); this.total = this.res.log.length; this.i = 0; }
    setMachine(id) { this.stop(); this.mid = id; this.compute(); this.render(); }
    html() {
      const dfa = M[this.mid], min = this.res.min, log = this.res.log, removed = this.res.removed, at = this.at();
      const cur = this.i > 0 ? log[this.i - 1] : null;
      const palette = ['#dbeafe', '#fde68a', '#bbf7d0', '#fbcfe8', '#ddd6fe', '#fed7aa'];
      const hl = {};
      let machine = dfa;
      if (cur) {
        if (cur.type === 'inaccessible') hl.grey = cur.removed;
        if (this.i >= 2) machine = Object.assign({}, dfa, { states: dfa.states.filter(s => !removed.includes(s.id)), trans: dfa.trans.filter(t => !removed.includes(t.from) && !removed.includes(t.to)) });
        if (cur.type === 'partition') { hl.color = {}; cur.blocks.forEach((b, k) => b.forEach(q => { hl.color[q] = palette[k % palette.length]; })); }
      }
      const showResult = cur && cur.type === 'result';
      const sel = this.machineIds.length > 1
        ? '<label class="fa-field">DFA <select onchange="' + at + '.setMachine(this.value)">' + this.machineIds.map(id => '<option value="' + id + '"' + (id === this.mid ? ' selected' : '') + '>' + esc(M[id].name) + '</option>').join('') + '</select></label>'
        : '<span class="fa-machine-name">' + esc(dfa.name) + '</span>';
      const logHTML = log.map((e, k) => '<li class="' + (k < this.i ? 'done' : '') + (k === this.i - 1 ? ' cur' : '') + '">' + esc(e.text) + '</li>').join('');
      const blocksHTML = cur && cur.type === 'partition' ? '<div class="fa-line"><b>Current partition:</b> ' + cur.blocks.map((b, k) => '<span class="fa-block" style="background:' + palette[k % palette.length] + '">{' + b.join(', ') + '}</span>').join(' ') + '</div>' : '';
      const right = showResult ? drawMachine(min, {}) : '<div class="fa-empty">appears at the last step</div>';
      return '<div class="fa-wrap"><div class="fa-toolbar">' + sel + '</div>' + this.controlsHTML() +
        '<div class="fa-two"><div><div class="fa-caption">DFA M' + (this.i >= 2 && removed.length ? ' (inaccessible states removed)' : '') + '</div>' + drawMachine(machine, hl) + '</div><div><div class="fa-caption">Minimal DFA M′</div>' + right + '</div></div>' +
        blocksHTML + '<ol class="fa-log">' + logHTML + '</ol></div>';
    }
  }

  /* ── 4d. Grammar derivation stepper ───────────────────────────── */
  class Deriver extends Player {
    constructor(id, cfg) { super(id); this.cfg = cfg; this.gids = cfg.grammars || Object.keys(G); this.gid = cfg.grammar || this.gids[0]; this.target = cfg.target !== undefined ? cfg.target : G[this.gid].examples[0]; this.compute(); }
    g() { return G[this.gid]; }
    compute() { const g = this.g(); this.w = FA.tokenize(g, this.target); this.path = derive(g, this.w); this.total = this.path ? this.path.length - 1 : 0; this.i = 0; }
    setGrammar(id) { this.stop(); this.gid = id; this.target = G[id].examples[0]; this.compute(); this.render(); }
    setTarget(t) { this.stop(); this.target = t; this.compute(); this.render(); }
    html() {
      const g = this.g(), at = this.at();
      const sel = '<label class="fa-field">Grammar <select onchange="' + at + '.setGrammar(this.value)">' + this.gids.map(id => '<option value="' + id + '"' + (id === this.gid ? ' selected' : '') + '>' + esc(G[id].name) + '</option>').join('') + '</select></label>';
      const rules = g.vars.map(v => esc(v) + ' → ' + g.rules.filter(r => r.lhs === v).map(r => r.rhs.length ? esc(r.rhs.join(g.sep)) : LAMBDA).join(' | ')).join('<br>');
      const ex = g.examples.map(e => '<button class="fa-chip" onclick="' + at + ".setTarget('" + esc(e) + "')\">" + (esc(e) || LAMBDA) + '</button>').join(' ');
      let body;
      if (!this.path) body = '<div class="fa-line fa-final"><span class="fa-verdict reject">✘</span> “' + (esc(this.target) || LAMBDA) + '” cannot be derived from ' + esc(g.start) + ' — it is not in L(G).</div>';
      else {
        const steps = this.path.slice(0, this.i + 1);
        const fmtForm = (form, atIdx, k) => form.map((t, j) => { const isV = g.vars.includes(t); const mark = (k === this.i && j === atIdx) ? ' will-expand' : ''; return '<span class="' + (isV ? 'fa-var' : 'fa-term') + mark + '">' + esc(t) + '</span>'; }).join(g.sep === ' ' ? ' ' : '') || LAMBDA;
        const chain = steps.map((st, k) => { const nextAt = (k < this.total && this.path[k + 1]) ? this.path[k + 1].at : -1; return (k ? ' <span class="fa-arrow">⇒</span> ' : '') + '<span class="fa-form' + (k === this.i ? ' cur' : '') + '">' + fmtForm(st.form, nextAt, k) + '</span>'; }).join('');
        const used = this.i > 0 ? '<div class="fa-line"><b>Rule applied:</b> ' + esc(FA.ruleText(g, g.rules[this.path[this.i].rule])) + ' &nbsp; (the leftmost variable is replaced)</div>' : '<div class="fa-line fa-note">Start with the start variable ' + esc(g.start) + '; each step replaces the <u>leftmost</u> variable using one production (the variable about to be replaced is underlined).</div>';
        const done = this.i === this.total ? '<div class="fa-line fa-final"><span class="fa-verdict accept">✔</span> ' + esc(g.start) + ' ⇒* ' + (esc(this.target) || LAMBDA) + ' in ' + this.total + ' step' + (this.total === 1 ? '' : 's') + ', so “' + (esc(this.target) || LAMBDA) + '” ∈ L(G).</div>' : '';
        body = '<div class="fa-derivation">' + chain + '</div>' + used + done;
      }
      return '<div class="fa-wrap"><div class="fa-toolbar">' + sel +
        '<label class="fa-field">Target string <input class="fa-input" type="text" value="' + esc(this.target) + '" spellcheck="false" onchange="' + at + ".setTarget(this.value)\" onkeyup=\"if(event.key==='Enter')" + at + '.setTarget(this.value)"></label><span class="fa-note">examples: ' + ex + '</span></div>' +
        this.controlsHTML() +
        '<div class="fa-two"><div><div class="fa-caption">Productions P</div><div class="fa-rules">' + rules + '</div></div><div><div class="fa-caption">Derivation of “' + (esc(this.target) || LAMBDA) + '”</div>' + body + '</div></div></div>';
    }
  }

  /* ── 4e. Small calculators (strings / languages / sets) ───────── */
  class Tool {
    constructor(id, cfg) { this.id = id; this.cfg = cfg; this.v = Object.assign({}, cfg.defaults || {}); }
    host() { return document.getElementById('sim-' + this.id); }
    set(k, val) { this.v[k] = val; this.render(); }
    stop() {}
    render() { const h = this.host(); if (h) h.innerHTML = this.html(); }
    field(k, label, size) { return '<label class="fa-field">' + label + ' <input class="fa-input" size="' + (size || 16) + '" type="text" value="' + esc(this.v[k] || '') + '" spellcheck="false" onchange="FA.ui(\'' + this.id + '\').set(\'' + k + "', this.value)\" onkeyup=\"if(event.key==='Enter')FA.ui('" + this.id + "').set('" + k + '\', this.value)"></label>'; }
    row(label, val) { return '<tr><th>' + label + '</th><td>' + val + '</td></tr>'; }
    html() {
      const kind = this.cfg.kind, v = this.v;
      const L = x => esc(x) || LAMBDA;
      if (kind === 'strings') {
        const u = v.u || '', w = v.v || ''; const st = FA.str;
        const rows = [
          this.row('|u|, |v|', u.length + ', ' + w.length),
          this.row('concatenation uv', L(u + w) + ' &nbsp; (|uv| = |u| + |v| = ' + u.length + ' + ' + w.length + ' = ' + (u.length + w.length) + ')'),
          this.row('vu', L(w + u)),
          this.row('reverse u<sup>R</sup>', L(st.reverse(u))),
          this.row('(uv)<sup>R</sup> = v<sup>R</sup>u<sup>R</sup>', L(st.reverse(u + w)) + ' = ' + L(st.reverse(w) + st.reverse(u))),
          this.row('u<sup>0</sup>, u<sup>1</sup>, u<sup>2</sup>, u<sup>3</sup>', [0, 1, 2, 3].map(n => L(st.power(u, n))).join(', ')),
          this.row('prefixes of u', st.prefixes(u).map(L).join(', ')),
          this.row('suffixes of u', st.suffixes(u).map(L).join(', ')),
          this.row('substrings of u', st.substrings(u).map(L).join(', ')),
          this.row('λu = uλ = u', L(u)),
        ].join('');
        return '<div class="fa-wrap"><div class="fa-toolbar">' + this.field('u', 'u =') + ' ' + this.field('v', 'v =') + '</div><table class="fa-table kv">' + rows + '</table></div>';
      }
      if (kind === 'languages') {
        const L1 = FA.lang.parse(v.L1 || ''), L2 = FA.lang.parse(v.L2 || ''); const N = Math.max(1, Math.min(6, parseInt(v.n) || 4)); const lg = FA.lang;
        const alpha = uniq([...(L1.join('') + L2.join(''))]);
        const rows = [
          this.row('L₁ ∪ L₂', lg.fmt(lg.union(L1, L2))), this.row('L₁ ∩ L₂', lg.fmt(lg.inter(L1, L2))), this.row('L₁ − L₂', lg.fmt(lg.diff(L1, L2))),
          this.row('L₁<sup>R</sup>', lg.fmt(lg.reverse(L1))), this.row('L₁L₂', lg.fmt(lg.concat(L1, L2))),
          this.row('L₁<sup>0</sup> ; L₁<sup>1</sup> ; L₁<sup>2</sup>', lg.fmt(lg.power(L1, 0)) + ' ; ' + lg.fmt(lg.power(L1, 1)) + ' ; ' + lg.fmt(lg.power(L1, 2))),
          this.row('L₁* (strings of length ≤ ' + N + ')', lg.fmt(lg.star(L1, N))), this.row('L₁⁺ (length ≤ ' + N + ')', lg.fmt(lg.plus(L1, N))),
          this.row('complement of L₁ over Σ = {' + alpha.join(',') + '} (length ≤ ' + Math.min(N, 3) + ')', lg.fmt(lg.complement(L1, alpha, Math.min(N, 3)))),
        ].join('');
        return '<div class="fa-wrap"><div class="fa-toolbar">' + this.field('L1', 'L₁ =', 22) + ' ' + this.field('L2', 'L₂ =', 22) + ' ' + this.field('n', 'max length for * and ⁺', 3) + '<span class="fa-note">comma-separated strings; write λ for the empty string</span></div><table class="fa-table kv">' + rows + '</table></div>';
      }
      if (kind === 'sets') {
        const A = FA.sets.parse(v.A || ''), B = FA.sets.parse(v.B || ''), U = FA.sets.parse(v.U || ''); const ss = FA.sets;
        const comp = X => U.filter(x => !X.includes(x));
        const rows = [
          this.row('A ∪ B', ss.fmt(uniq(A.concat(B)))), this.row('A ∩ B', ss.fmt(A.filter(x => B.includes(x)))), this.row('A − B', ss.fmt(A.filter(x => !B.includes(x)))), this.row('B − A', ss.fmt(B.filter(x => !A.includes(x)))),
          this.row('complement of A (w.r.t. U)', ss.fmt(comp(A))), this.row('De Morgan: complement(A ∪ B) = Ā ∩ B̄', ss.fmt(comp(uniq(A.concat(B)))) + ' = ' + ss.fmt(comp(A).filter(x => comp(B).includes(x)))),
          this.row('A ⊆ B ?', A.every(x => B.includes(x)) ? 'yes' : 'no'), this.row('A ∩ B = ∅ (disjoint)?', A.some(x => B.includes(x)) ? 'no' : 'yes'),
          this.row('|A|, |B|', A.length + ', ' + B.length), this.row('A × B', ss.fmt(ss.product(A, B)) + ' &nbsp; |A × B| = ' + A.length + '·' + B.length + ' = ' + (A.length * B.length)),
          this.row('2<sup>A</sup> (powerset)', ss.fmt(ss.powerset(A).map(s => '{' + s.join(',') + '}')) + ' &nbsp; |2<sup>A</sup>| = 2<sup>' + A.length + '</sup> = ' + Math.pow(2, A.length)),
        ].join('');
        return '<div class="fa-wrap"><div class="fa-toolbar">' + this.field('A', 'A =') + ' ' + this.field('B', 'B =') + ' ' + this.field('U', 'U =', 22) + '</div><table class="fa-table kv">' + rows + '</table></div>';
      }
      return '';
    }
  }

  /* ── 4f. Relations & graphs tool (COMP 335 unit 1) ────────────── */
  function circleLayout(ids, w, h) {
    const cx = w / 2, cy = h / 2 + 10, rad = Math.min(w, h) / 2 - 50;
    return ids.map((id, k) => { const a = -Math.PI / 2 + 2 * Math.PI * k / ids.length; return { id, label: id, x: Math.round(cx + rad * Math.cos(a)), y: Math.round(cy + rad * Math.sin(a)) }; });
  }
  function parsePairs(str) {   // "a b, b c" → [['a','b'],['b','c']]
    return str.split(',').map(x => x.trim().split(/\s+/)).filter(p => p.length === 2 && p[0] && p[1]);
  }
  class GraphTool extends Tool {
    html() {
      const v = this.v;
      const nodes = FA.sets.parse(v.nodes || '');
      const edges = parsePairs(v.edges || '');
      const walk = (v.walk || '').trim().split(/[\s,]+/).filter(Boolean);
      const has = (a, b) => edges.some(e => e[0] === a && e[1] === b);
      const gW = 420, gH = 330;
      const g = { states: circleLayout(nodes, gW, gH), start: null, finals: [], trans: edges.map(e => ({ from: e[0], sym: '', to: e[1] })), w: gW, h: gH };
      // classify the walk
      let cls = '', hlEdges = [], hlStates = [], bad = false;
      if (walk.length >= 2) {
        const es = [];
        for (let i = 0; i < walk.length - 1; i++) { if (!has(walk[i], walk[i + 1]) || !nodes.includes(walk[i])) bad = true; es.push([walk[i], walk[i + 1]]); }
        if (!nodes.includes(walk[walk.length - 1])) bad = true;
        if (bad) cls = '<span class="fa-verdict reject">not a walk</span> — every consecutive pair must be an edge of the graph';
        else {
          hlEdges = es.map(e => e[0] + '||' + e[1]); hlStates = walk;
          const edgeKeys = es.map(e => e.join('>'));
          const noRepeatedEdge = new Set(edgeKeys).size === edgeKeys.length;
          const inner = walk.slice(0, -1);
          const noRepeatedNode = new Set(walk).size === walk.length;
          const isCycle = walk[0] === walk[walk.length - 1];
          const simpleCycle = isCycle && new Set(inner).size === inner.length;
          const tags = ['<span class="fa-verdict accept">walk</span> (sequence of adjacent edges)'];
          if (noRepeatedEdge) tags.push('<span class="fa-verdict accept">path</span> (no edge repeated)'); else tags.push('<span class="fa-verdict reject">not a path</span> (an edge is repeated)');
          if (noRepeatedEdge && noRepeatedNode) tags.push('<span class="fa-verdict accept">simple path</span> (no node repeated)');
          if (isCycle) tags.push(simpleCycle ? '<span class="fa-verdict accept">simple cycle</span> (base ' + esc(walk[0]) + ' is the only repeated node)' : '<span class="fa-verdict accept">cycle</span> (from ' + esc(walk[0]) + ' back to itself, but another node repeats)');
          cls = tags.join('<br>');
        }
      } else cls = '<span class="fa-note">type at least two nodes, e.g. e d c a</span>';
      // relation part
      const A = FA.sets.parse(v.set || '');
      const R = parsePairs(v.rel || '');
      const inR = (a, b) => R.some(p => p[0] === a && p[1] === b);
      const refl = A.every(a => inR(a, a));
      const symm = R.every(p => inR(p[1], p[0]));
      const trans = R.every(p => R.every(q => q[0] !== p[1] || inR(p[0], q[1])));
      const missing = { refl: A.filter(a => !inR(a, a)), symm: R.filter(p => !inR(p[1], p[0])).map(p => '(' + p[1] + ',' + p[0] + ')'), trans: [] };
      R.forEach(p => R.forEach(q => { if (q[0] === p[1] && !inR(p[0], q[1])) missing.trans.push('(' + p[0] + ',' + q[1] + ')'); }));
      let classes = '';
      if (refl && symm && trans) {
        const seen = new Set(); const cl = [];
        A.forEach(a => { if (seen.has(a)) return; const c = A.filter(b => inR(a, b)); c.forEach(x => seen.add(x)); cl.push('[' + a + ']<sub>R</sub> = {' + c.join(', ') + '}'); });
        classes = '<div class="fa-line fa-final"><span class="fa-verdict accept">equivalence relation</span> Equivalence classes: ' + cl.join(' &nbsp; ') + '</div>';
      } else classes = '<div class="fa-line fa-final"><span class="fa-verdict reject">not an equivalence relation</span> ' + (!refl ? 'missing for reflexivity: ' + missing.refl.map(a => '(' + a + ',' + a + ')').join(', ') + '. ' : '') + (!symm ? 'missing for symmetry: ' + missing.symm.join(', ') + '. ' : '') + (!trans ? 'missing for transitivity: ' + [...new Set(missing.trans)].join(', ') + '.' : '') + '</div>';
      const rW = 420, rH = 300;
      const rg = { states: circleLayout(A, rW, rH), start: null, finals: [], trans: R.map(p => ({ from: p[0], sym: '', to: p[1] })), w: rW, h: rH };
      const prop = (name, okv, hint) => '<span class="fa-config' + (okv ? ' ok' : ' bad') + '"><b>' + name + '</b><span class="fa-rest">' + (okv ? 'yes' : 'no') + '</span></span>';
      return '<div class="fa-wrap">' +
        '<div class="fa-two">' +
        '<div><div class="fa-caption">Relation R on a set A</div><div class="fa-toolbar">' + this.field('set', 'A =', 12) + this.field('rel', 'R = pairs', 30) + '</div>' +
        drawMachine(rg, {}) + '<div class="fa-line" style="margin-top:.5rem">' + prop('reflexive', refl) + prop('symmetric', symm) + prop('transitive', trans) + '</div>' + classes + '</div>' +
        '<div><div class="fa-caption">Directed graph G = ⟨V, E⟩ and walks</div><div class="fa-toolbar">' + this.field('nodes', 'V =', 12) + this.field('edges', 'E = pairs', 30) + this.field('walk', 'walk (nodes)', 14) + '</div>' +
        drawMachine(g, { states: hlStates, edges: hlEdges }) + '<div class="fa-line" style="margin-top:.5rem">' + cls + '</div>' +
        '<div class="fa-note">Definitions: walk = sequence of adjacent edges; path = walk with no repeated edge; simple path = no repeated node; cycle = walk from a node (the base) back to itself; simple cycle = only the base is repeated.</div></div>' +
        '</div></div>';
    }
  }

  /* ── 4g. Proof techniques demo: induction dominoes + pigeonhole ── */
  class ProofsDemo extends Player {
    constructor(id, cfg) { super(id); this.cfg = cfg; this.total = cfg.n || 8; this.i = 0; this.newPoints(); }
    newPoints() { this.pts = Array.from({ length: 5 }, () => [Math.random() * 2, Math.random() * 2]); this.render(); }
    html() {
      const N = this.total, at = this.at();
      // induction panel
      const dom = [];
      for (let n = 0; n <= N; n++) {
        const fallen = n < this.i, cur = n === this.i;
        const sum = n * (n + 1) / 2;
        dom.push('<div class="fa-domino' + (fallen ? ' fallen' : '') + (cur ? ' cur' : '') + '"><div class="fa-domino-n">P(' + n + ')</div><div class="fa-domino-s">0+…+' + n + ' = ' + sum + '</div><div class="fa-domino-f">' + n + '·' + (n + 1) + '/2 = ' + sum + '</div><div class="fa-domino-ok">' + (fallen || cur ? '✔' : '?') + '</div></div>');
      }
      const k = this.i;
      const step = k === 0
        ? '<div class="fa-line"><b>Basis</b> P(0): the sum of no positive integers is 0, and 0·1/2 = 0 ✔</div>'
        : '<div class="fa-line"><b>Inductive step</b> P(' + (k - 1) + ') ⇒ P(' + k + '): assume 0+…+' + (k - 1) + ' = ' + ((k - 1) * k / 2) + '. Then 0+…+' + k + ' = ' + ((k - 1) * k / 2) + ' + ' + k + ' = ' + (k * (k + 1) / 2) + ' = ' + k + '·' + (k + 1) + '/2 ✔ — the next domino falls.</div>';
      const conclusion = this.i === N ? '<div class="fa-line fa-final"><span class="fa-verdict accept">∀n P(n)</span> basis + inductive step ⇒ every domino falls, i.e. the formula holds for all n (the animation stops at ' + N + ' but the argument never does).</div>' : '<div class="fa-line fa-note">Press Step ▶ (or ▶ Play) to apply the inductive step once more.</div>';
      // pigeonhole panel
      const S = 240, pad = 20; const P = this.pts;
      const box = p => [Math.min(1, Math.floor(p[0])), Math.min(1, Math.floor(p[1]))];
      const groups = {}; P.forEach((p, idx) => { const b = box(p).join(','); (groups[b] = groups[b] || []).push(idx); });
      const crowded = Object.keys(groups).find(b => groups[b].length >= 2);
      const [i1, i2] = groups[crowded];
      const dist = Math.hypot(P[i1][0] - P[i2][0], P[i1][1] - P[i2][1]);
      const sx = x => pad + x * S / 2, sy = y => pad + (2 - y) * S / 2;
      let svg = '<svg class="fa-svg" viewBox="0 0 ' + (S + 2 * pad) + ' ' + (S + 2 * pad) + '" style="max-width:300px;max-height:300px">';
      for (let bx = 0; bx < 2; bx++) for (let by = 0; by < 2; by++) { const hot = crowded === bx + ',' + by; svg += '<rect x="' + sx(bx) + '" y="' + sy(by + 1) + '" width="' + (S / 2) + '" height="' + (S / 2) + '" fill="' + (hot ? '#fef3c7' : '#f8fafc') + '" stroke="#94a3b8" stroke-dasharray="4 3"/>'; }
      svg += '<rect x="' + pad + '" y="' + pad + '" width="' + S + '" height="' + S + '" fill="none" stroke="#1e293b" stroke-width="2"/>';
      svg += '<line x1="' + sx(P[i1][0]) + '" y1="' + sy(P[i1][1]) + '" x2="' + sx(P[i2][0]) + '" y2="' + sy(P[i2][1]) + '" stroke="#dc2626" stroke-width="2"/>';
      P.forEach((p, idx) => { svg += '<circle cx="' + sx(p[0]) + '" cy="' + sy(p[1]) + '" r="6" fill="' + (idx === i1 || idx === i2 ? '#dc2626' : '#3b82f6') + '" stroke="#fff" stroke-width="1.5"/>'; });
      svg += '<text x="' + (pad + S / 2) + '" y="' + (S + 2 * pad - 4) + '" class="fa-label" style="font-style:normal;font-size:12px">2 cm × 2 cm square, four 1 cm × 1 cm boxes</text></svg>';
      return '<div class="fa-wrap"><div class="fa-two">' +
        '<div><div class="fa-caption">Proof by induction: 0 + 1 + ⋯ + n = n(n+1)/2</div>' + this.controlsHTML() + '<div class="fa-dominoes">' + dom.join('') + '</div>' + step + conclusion + '</div>' +
        '<div><div class="fa-caption">Pigeonhole principle: 5 points in a 2 cm square</div><div class="fa-toolbar"><button class="btn fa-btn" onclick="' + at + '.newPoints()">🎲 New random points</button></div>' + svg +
        '<div class="fa-line">5 points (pigeons) in 4 boxes (pigeonholes) ⇒ some box holds two points: the red pair. Their distance is <b>' + dist.toFixed(3) + ' cm ≤ √2 ≈ 1.414 cm</b> (the diagonal of a box) ✔</div>' +
        '<div class="fa-note">The pigeonhole principle does not say <em>which</em> box is crowded — only that one must be. Re-draw the points: the crowded box changes, the conclusion never fails.</div></div>' +
        '</div></div>';
    }
  }

  /* ════════════════════════════════════════════════════════════════
     4h. Regular languages (#165): regular expressions, state elimination, closure constructions
     ════════════════════════════════════════════════════════════════ */
  // ── Regular expressions: AST {t: sym|eps|empty|alt|cat|star}, parser, printer, simplifying constructors
  const RX = FA.rx = {};
  const EPS = { t: 'eps' }, EMPTY = { t: 'empty' };
  const PREC = { alt: 1, cat: 2, star: 3, sym: 4, eps: 4, empty: 4 };
  // compact form ("(a+b)a*"); `full` parenthesises every operator and writes concatenation as · (how the parser read it)
  function show(n, ctx, full) {
    ctx = ctx || 0;
    if (n.t === 'sym') return n.a;
    if (n.t === 'eps') return LAMBDA;
    if (n.t === 'empty') return '∅';
    if (n.t === 'star') { const inner = show(n.x, 4, full); return (n.x.t === 'star' ? '(' + inner + ')' : inner) + '*'; }
    const s = n.t === 'alt' ? show(n.l, 1, full) + '+' + show(n.r, 1, full) : show(n.l, 2, full) + (full ? '·' : '') + show(n.r, 2, full);
    return (full ? ctx > 0 && ctx !== PREC[n.t] : ctx > PREC[n.t]) ? '(' + s + ')' : s;   // + and concatenation are associative: no brackets inside a chain
  }
  RX.show = show;
  RX.parse = function (src) {
    const toks = [...String(src)].filter(c => !/\s/.test(c));
    let i = 0;
    const err = msg => { throw new Error(msg + (i < toks.length ? ' at “' + toks[i] + '” (character ' + (i + 1) + ')' : ' at the end')); };
    const atomStart = c => c !== undefined && (c === '(' || c === 'λ' || c === 'ε' || c === '∅' || /^[a-zA-Z0-9]$/.test(c));
    function expr() { let n = term(); while (toks[i] === '+' || toks[i] === '|') { i++; n = { t: 'alt', l: n, r: term() }; } return n; }
    function term() { if (!atomStart(toks[i])) err('expected a symbol, λ, ∅ or “(”'); let n = factor(); while (atomStart(toks[i])) n = { t: 'cat', l: n, r: factor() }; return n; }
    function factor() { let n = atom(); while (toks[i] === '*') { i++; n = { t: 'star', x: n }; } return n; }
    function atom() {
      const c = toks[i++];
      if (c === '(') { const n = expr(); if (toks[i] !== ')') err('expected “)”'); i++; return n; }
      return c === 'λ' || c === 'ε' ? EPS : c === '∅' ? EMPTY : { t: 'sym', a: c };
    }
    if (!toks.length) throw new Error('the expression is empty');
    const n = expr();
    if (i < toks.length) err('unexpected character');
    return n;
  };
  const same = (x, y) => show(x) === show(y);
  RX.alt = (x, y) => x.t === 'empty' ? y : y.t === 'empty' ? x : same(x, y) ? x : { t: 'alt', l: x, r: y };
  RX.cat = (x, y) => x.t === 'empty' || y.t === 'empty' ? EMPTY : x.t === 'eps' ? y : y.t === 'eps' ? x : { t: 'cat', l: x, r: y };
  RX.star = x => x.t === 'empty' || x.t === 'eps' ? EPS : x.t === 'star' ? x : { t: 'star', x };
  RX.symbols = n => n.t === 'sym' ? [n.a] : n.t === 'star' ? RX.symbols(n.x) : n.l ? RX.symbols(n.l).concat(RX.symbols(n.r)) : [];

  // Expression → NFA by the inductive construction of the proof (single final state per piece), laid out
  // recursively: concatenation side by side, union stacked between a new initial and final state, star wrapped.
  const COL = 82, ROW = 76;
  function thompson(root) {
    let k = 0; const nid = () => 'n' + (k++);
    const shift = (f, dc, dr) => f.states.forEach(s => { s.c += dc; s.r += dr; });
    function build(n) {
      if (n.t === 'eps') { const a = nid(); return { states: [{ id: a, c: 0, r: 0 }], trans: [], start: a, final: a, W: 1, H: 1, curves: {} }; }
      if (n.t === 'sym' || n.t === 'empty') { const a = nid(), b = nid(); return { states: [{ id: a, c: 0, r: 0 }, { id: b, c: 1, r: 0 }], trans: n.t === 'sym' ? [T(a, n.a, b)] : [], start: a, final: b, W: 2, H: 1, curves: {} }; }
      if (n.t === 'cat') {
        const A = build(n.l), B = build(n.r), H = Math.max(A.H, B.H);
        shift(A, 0, (H - A.H) / 2); shift(B, A.W, (H - B.H) / 2);
        return { states: A.states.concat(B.states), trans: A.trans.concat([T(A.final, LAMBDA, B.start)], B.trans), start: A.start, final: B.final, W: A.W + B.W, H, curves: Object.assign(A.curves, B.curves) };
      }
      if (n.t === 'alt') {
        const A = build(n.l), B = build(n.r), s = nid(), f = nid(), Wi = Math.max(A.W, B.W), H = A.H + B.H, cy = (H - 1) / 2;
        shift(A, 1 + (Wi - A.W) / 2, 0); shift(B, 1 + (Wi - B.W) / 2, A.H);
        return { states: [{ id: s, c: 0, r: cy }].concat(A.states, B.states, [{ id: f, c: Wi + 1, r: cy }]),
          trans: [T(s, LAMBDA, A.start), T(s, LAMBDA, B.start)].concat(A.trans, B.trans, [T(A.final, LAMBDA, f), T(B.final, LAMBDA, f)]),
          start: s, final: f, W: Wi + 2, H, curves: Object.assign(A.curves, B.curves) };
      }
      const A = build(n.x), s = nid(), f = nid(), H = A.H + 1, cy = (H - 1) / 2;   // star
      shift(A, 1, 0.5);
      const curves = Object.assign(A.curves, { [s + '|' + f]: A.H * ROW + 40 });
      if (A.final !== A.start) curves[A.final + '|' + A.start] = A.H * ROW + 20;
      return { states: [{ id: s, c: 0, r: cy }].concat(A.states, [{ id: f, c: A.W + 1, r: cy }]),
        trans: [T(s, LAMBDA, A.start)].concat(A.trans, [T(A.final, LAMBDA, A.start), T(A.final, LAMBDA, f), T(s, LAMBDA, f)]),
        start: s, final: f, W: A.W + 2, H, curves };
    }
    const F = build(root);
    const named = F.states.slice().sort((x, y) => x.c - y.c || x.r - y.r);   // q0, q1, … left to right
    const m = { id: 'rx', type: 'nfa', name: show(root), states: F.states.map(s => S(s.id, 70 + s.c * COL, 70 + s.r * ROW, 'q' + named.indexOf(s))),
      start: F.start, finals: [F.final], trans: F.trans, curves: F.curves };
    m.alphabet = [...new Set(m.trans.map(t => t.sym).filter(x => x !== LAMBDA))].sort();
    return crop(m);
  }
  RX.nfa = thompson;

  // fast membership test for a machine (the Runner's run() keeps every snapshot; this only answers yes/no)
  function matcher(m) {
    const adj = new Map();
    m.trans.forEach(t => { const k = t.from + '\u0000' + t.sym; if (!adj.has(k)) adj.set(k, []); adj.get(k).push(t.to); });
    const clo = set => { const out = new Set(set), st = [...set]; while (st.length) { const q = st.pop(); (adj.get(q + '\u0000' + LAMBDA) || []).forEach(p => { if (!out.has(p)) { out.add(p); st.push(p); } }); } return out; };
    const F = new Set(m.finals);
    return w => {
      let cur = clo([m.start]);
      for (const c of w) { const nx = new Set(); cur.forEach(q => (adj.get(q + '\u0000' + c) || []).forEach(p => nx.add(p))); cur = clo(nx); if (!cur.size) return false; }
      return [...cur].some(q => F.has(q));
    };
  }
  FA.matcher = matcher;
  RX.matcher = r => matcher(thompson(r));
  // every string over `alpha` of length ≤ n, shortest first
  function allStrings(alpha, n) {
    const out = ['']; let layer = [''];
    for (let k = 1; k <= n; k++) { layer = layer.flatMap(u => alpha.map(a => u + a)); out.push(...layer); }
    return out;
  }
  FA.allStrings = allStrings;
  // the largest length ≤ n whose strings over alpha number at most cap
  const lengthCap = (alpha, n, cap) => { let len = 0, total = 1, pw = 1; while (len < n) { pw *= Math.max(1, alpha.length); if (total + pw > cap) break; total += pw; len++; } return len; };
  const fmtW = w => w === '' ? LAMBDA : esc(w);

  /* ── Regular-expression tester ─────────────────────────────────── */
  class RegexTool extends Tool {
    constructor(id, cfg) { super(id, cfg); this.v = Object.assign({ r1: '(a+b)a*', r2: '', n: '5', w: '' }, cfg.defaults || {}); this.showNfa = !!cfg.nfa; }
    toggleNfa() { this.showNfa = !this.showNfa; this.render(); }
    insert(k, ch) { this.v[k] = (this.v[k] || '') + ch; this.render(); }
    preset(i) { const p = this.cfg.presets[i]; this.v.r1 = p.r1 || ''; this.v.r2 = p.r2 || ''; this.render(); }
    html() {
      const v = this.v, id = this.id, at = "FA.ui('" + id + "')";
      const parse = s => { try { return { r: RX.parse(s) }; } catch (e) { return { error: e.message }; } };
      const p1 = parse(v.r1), p2 = (v.r2 || '').trim() ? parse(v.r2) : null;
      const alpha = uniq([...(p1.r ? RX.symbols(p1.r) : []), ...(p2 && p2.r ? RX.symbols(p2.r) : [])]);
      const want = Math.max(0, Math.min(10, parseInt(v.n, 10) || 0));
      const n = lengthCap(alpha.length ? alpha : ['a'], want, 20000);
      const words = allStrings(alpha, alpha.length ? n : 0);
      const lang = (r) => { const acc = RX.matcher(r); return words.filter(acc); };
      const list = L => { const shown = L.slice(0, 60).map(fmtW).join(', '); return (L.length ? '{ ' + shown + (L.length > 60 ? ', …' : '') + ' }' : '∅') + ' <span class="fa-note">(' + L.length + ' string' + (L.length === 1 ? '' : 's') + ')</span>'; };
      const presets = (this.cfg.presets || []).map((p, i) => '<button class="fa-chip" onclick="' + at + '.preset(' + i + ')">' + esc(p.r1) + (p.r2 ? ' ≡? ' + esc(p.r2) : '') + '</button>').join(' ');
      const ins = k => '<button class="fa-chip" title="insert λ" onclick="' + at + ".insert('" + k + "','λ')\">+λ</button><button class=\"fa-chip\" title=\"insert ∅\" onclick=\"" + at + ".insert('" + k + "','∅')\">+∅</button>";
      const rows = [];
      const note = n < want ? ' <span class="fa-note">(capped at length ' + n + ' to keep the list small)</span>' : '';
      if (p1.error) rows.push(this.row('r₁', '<span class="fa-verdict reject">not a regular expression</span> ' + esc(p1.error)));
      else {
        rows.push(this.row('r₁ is read as', esc(show(p1.r, 0, true))));
        rows.push(this.row('L(r₁), strings of length ≤ ' + n + note, list(lang(p1.r))));
      }
      if (p2 && p2.error) rows.push(this.row('r₂', '<span class="fa-verdict reject">not a regular expression</span> ' + esc(p2.error)));
      else if (p2) {
        rows.push(this.row('r₂ is read as', esc(show(p2.r, 0, true))));
        rows.push(this.row('L(r₂), strings of length ≤ ' + n, list(lang(p2.r))));
        if (p1.r) {
          const a1 = RX.matcher(p1.r), a2 = RX.matcher(p2.r);
          const diff = words.find(w => a1(w) !== a2(w));
          rows.push(this.row('r₁ ≡ r₂ ?', diff === undefined
            ? '<span class="fa-verdict accept">agree</span> on all ' + words.length + ' strings of length ≤ ' + n + ' over {' + alpha.join(', ') + '} — evidence, not a proof'
            : '<span class="fa-verdict reject">not equivalent</span> “' + fmtW(diff) + '” is in L(' + (a1(diff) ? 'r₁' : 'r₂') + ') but not in L(' + (a1(diff) ? 'r₂' : 'r₁') + ')'));
        }
      }
      const w = (v.w || '').replace(/\s+/g, '').replace(/λ/g, '');
      if ((v.w || '').trim() && p1.r) rows.push(this.row('is “' + fmtW(w) + '” in L(r₁)' + (p2 && p2.r ? ', L(r₂)' : '') + '?',
        [p1.r, p2 && p2.r].filter(Boolean).map((r, k) => (k ? 'r₂: ' : 'r₁: ') + (RX.matcher(r)(w) ? '<span class="fa-verdict accept">yes</span>' : '<span class="fa-verdict reject">no</span>')).join(' &nbsp; ')));
      let nfa = '';
      if (this.showNfa && p1.r) {
        const m = thompson(p1.r);
        nfa = m.states.length > 60 ? '<div class="fa-note">The NFA for r₁ has ' + m.states.length + ' states — too many to draw.</div>'
          : '<div class="fa-caption" style="margin-top:.8rem">NFA for r₁ by the inductive construction</div>' + drawMachine(m, {}) +
            '<div class="fa-note">' + m.states.length + ' states, ' + m.trans.filter(t => t.sym === LAMBDA).length + ' of the ' + m.trans.length + ' edges are λ-edges.</div>';
      }
      return '<div class="fa-wrap"><div class="fa-toolbar">' + this.field('r1', 'r₁ =', 22) + ins('r1') + ' ' + this.field('r2', 'r₂ =', 22) + ins('r2') + '</div>' +
        '<div class="fa-toolbar">' + this.field('n', 'max length', 3) + this.field('w', 'test string', 10) +
        '<button class="btn fa-btn fa-secondary" onclick="' + at + '.toggleNfa()">' + (this.showNfa ? 'Hide the NFA' : 'Show the NFA for r₁') + '</button></div>' +
        (presets ? '<div class="fa-toolbar"><span class="fa-note">try:</span> ' + presets + '</div>' : '') +
        '<div class="fa-note">+ is union, juxtaposition is concatenation, * is star; star binds tightest, then concatenation, then +. Leave r₂ empty to explore one expression.</div>' +
        '<table class="fa-table kv">' + rows.join('') + '</table>' + nfa + '</div>';
    }
  }

  /* ── State elimination on a generalized transition graph ──────── */
  function eliminate(nfa, order) {
    const pos = {}; nfa.states.forEach(s => { pos[s.id] = { id: s.id, label: s.label, x: s.x, y: s.y }; });
    let states = nfa.states.map(s => s.id), finals = nfa.finals.slice();
    const E = new Map();                                  // 'p|q' → label AST
    const add = (p, q, r) => { const k = p + '|' + q; E.set(k, E.has(k) ? RX.alt(E.get(k), r) : r); };
    nfa.trans.forEach(t => add(t.from, t.to, t.sym === LAMBDA ? EPS : { t: 'sym', a: t.sym }));
    const log = [];
    const snap = (text, hl) => log.push({ text, states: states.slice(), finals: finals.slice(), edges: [...E.entries()], hl: hl || {} });
    snap('Write M as a generalized transition graph: every edge label is a regular expression (a, b on one edge becomes a+b).');
    if (finals.length !== 1 || finals[0] === nfa.start) {
      const xs = nfa.states.map(s => s.x), ys = nfa.states.map(s => s.y);
      pos.qf = { id: 'qf', label: 'qf', x: Math.max(...xs) + 150, y: (Math.min(...ys) + Math.max(...ys)) / 2 };
      const old = finals;
      old.forEach(q => add(q, 'qf', EPS));
      states.push('qf'); finals = ['qf'];
      snap('Make the final state unique and different from the initial one: add qf with a λ-edge from ' + (old.length ? old.join(', ') : 'no state (M has no final state)') + '.', { states: ['qf'], edges: old.map(q => q + '|' + LAMBDA + '|qf') });
    }
    const qf = finals[0];
    const inner = states.filter(q => q !== nfa.start && q !== qf);
    const seq = (order || []).filter(q => inner.includes(q)).concat(inner.filter(q => !(order || []).includes(q)));
    seq.forEach(q => {
      const e = E.get(q + '|' + q), es = e ? RX.star(e) : EPS;
      const ins = [...E.entries()].filter(([k]) => k.endsWith('|' + q) && !k.startsWith(q + '|'));
      const outs = [...E.entries()].filter(([k]) => k.startsWith(q + '|') && !k.endsWith('|' + q));
      snap('Remove ' + q + (e ? ' — its loop is ' + show(e) + ', so every path through it reads (' + show(e) + ')* there' : ' — it has no loop') + ': ' + ins.length + ' edge' + (ins.length === 1 ? '' : 's') + ' in, ' + outs.length + ' out.',
        { states: [q], edges: [...E.entries()].filter(([k]) => k.split('|').includes(q)).map(([k, r]) => k.split('|')[0] + '|' + show(r) + '|' + k.split('|')[1]) });
      [...E.keys()].filter(k => k.split('|').includes(q)).forEach(k => E.delete(k));
      states = states.filter(s => s !== q);
      const made = [];
      ins.forEach(([ki, a]) => outs.forEach(([ko, b]) => {
        const p = ki.split('|')[0], r = ko.split('|')[1];
        add(p, r, RX.cat(RX.cat(a, es), b));
        made.push(p + ' → ' + r + ': ' + show(E.get(p + '|' + r)));
      }));
      snap(q + ' removed. ' + (made.length ? 'New or updated edges — ' + made.join(';  ') : 'No path went through it.'),
        { edges: ins.flatMap(([ki]) => outs.map(([ko]) => { const p = ki.split('|')[0], r = ko.split('|')[1]; return p + '|' + show(E.get(p + '|' + r)) + '|' + r; })) });
    });
    const g = k => E.get(k) || EMPTY, q0 = nfa.start;
    const r1 = g(q0 + '|' + q0), r2 = g(q0 + '|' + qf), r3 = g(qf + '|' + q0), r4 = g(qf + '|' + qf);
    const r = RX.cat(RX.cat(RX.star(r1), r2), RX.star(RX.alt(r4, RX.cat(RX.cat(r3, RX.star(r1)), r2))));
    snap('Two states left. r₁ = ' + show(r1) + ', r₂ = ' + show(r2) + ', r₃ = ' + show(r3) + ', r₄ = ' + show(r4) + '  ⇒  r = r₁*r₂(r₄ + r₃r₁*r₂)* = ' + show(r), { states: [q0, qf] });
    return { log, r, pos, order: seq };
  }
  FA.eliminate = eliminate;

  class Eliminator extends Player {
    constructor(id, cfg) { super(id); this.cfg = cfg; this.machineIds = cfg.machines || ['rl-elim']; this.mid = cfg.machine || this.machineIds[0]; this.order = ''; this.compute(); }
    compute() {
      const m = M[this.mid];
      this.res = eliminate(m, this.order.split(/[\s,]+/).filter(Boolean));
      this.total = this.res.log.length - 1; this.i = 0;
      const acc = matcher(m), rx = RX.matcher(this.res.r), alpha = m.alphabet.length ? m.alphabet : ['a'];
      const words = allStrings(alpha, lengthCap(alpha, 7, 5000));
      this.check = { bad: words.find(w => acc(w) !== rx(w)), count: words.length, n: words.length ? words[words.length - 1].length : 0 };
    }
    setMachine(id) { this.stop(); this.mid = id; this.order = ''; this.compute(); this.render(); }
    setOrder(s) { this.stop(); this.order = s; this.compute(); this.render(); }
    html() {
      const m = M[this.mid], at = this.at(), e = this.res.log[this.i], pos = this.res.pos;
      const gtg = crop({ id: 'gtg', type: 'nfa', states: e.states.map(q => Object.assign({}, pos[q])), start: m.start, finals: e.finals,
        trans: e.edges.map(([k, r]) => T(k.split('|')[0], show(r), k.split('|')[1])), curves: Object.assign({}, m.curves) });
      const hl = { states: e.hl.states || [], edges: e.hl.edges || [] };
      const sel = this.machineIds.length > 1
        ? '<label class="fa-field">NFA <select onchange="' + at + '.setMachine(this.value)">' + this.machineIds.map(id => '<option value="' + id + '"' + (id === this.mid ? ' selected' : '') + '>' + esc(M[id].name) + '</option>').join('') + '</select></label>'
        : '<span class="fa-machine-name">' + esc(m.name) + '</span>';
      const orderField = '<label class="fa-field">Removal order <input class="fa-input" size="10" type="text" value="' + esc(this.order) + '" placeholder="' + esc(this.res.order.join(', ')) + '" spellcheck="false" onchange="' + at + ".setOrder(this.value)\" onkeyup=\"if(event.key==='Enter')" + at + '.setOrder(this.value)"></label>';
      const logHTML = this.res.log.map((x, k) => '<li class="' + (k <= this.i ? 'done' : '') + (k === this.i ? ' cur' : '') + '">' + esc(x.text) + '</li>').join('');
      const c = this.check;
      const done = this.i === this.total ? '<div class="fa-line fa-final"><span class="fa-verdict accept">r = ' + esc(show(this.res.r)) + '</span> ' +
        (c.bad === undefined ? 'Check: L(r) and L(M) agree on all ' + c.count + ' strings of length ≤ ' + c.n + ' ✔' : 'Check failed on “' + fmtW(c.bad) + '”') +
        ' <span class="fa-note">Another removal order gives a different, equivalent expression.</span></div>' : '';
      return '<div class="fa-wrap"><div class="fa-toolbar">' + sel + orderField + '</div>' + this.controlsHTML() +
        '<div class="fa-two"><div><div class="fa-caption">NFA M</div>' + drawMachine(m, {}) + '</div><div><div class="fa-caption">Generalized transition graph</div>' + drawMachine(gtg, hl) + '</div></div>' +
        '<ol class="fa-log">' + logHTML + '</ol>' + done + '</div>';
    }
  }

  /* ── Closure constructions, step by step ───────────────────────── */
  function bbox(m) { const xs = m.states.map(s => s.x), ys = m.states.map(s => s.y); return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) }; }
  // a copy of m with ids prefixed and its top-left state corner moved to (dx, dy)
  function placed(m, prefix, dx, dy) {
    const b = bbox(m), curves = {};
    Object.keys(m.curves || {}).forEach(k => { const [f, t] = k.split('|'); curves[prefix + f + '|' + prefix + t] = m.curves[k]; });
    return { states: m.states.map(s => ({ id: prefix + s.id, label: s.label, x: s.x - b.x0 + dx, y: s.y - b.y0 + dy })), trans: m.trans.map(t => T(prefix + t.from, t.sym, prefix + t.to)),
      curves, start: prefix + m.start, finals: m.finals.map(f => prefix + f), w: b.x1 - b.x0, h: b.y1 - b.y0, big: !!m.bigLabels };
  }
  function singleFinal(m) {
    if (m.finals.length === 1) return null;
    const b = bbox(m);
    return Object.assign({}, m, { states: m.states.concat([S('qf', b.x1 + 140, (b.y0 + b.y1) / 2)]), trans: m.trans.concat(m.finals.map(q => T(q, LAMBDA, 'qf'))), finals: ['qf'] });
  }
  const isCompleteDfa = m => m.type === 'dfa' && m.states.every(s => m.alphabet.every(a => m.trans.filter(t => t.from === s.id && t.sym === a).length === 1));
  const toDfa = m => isCompleteDfa(m) ? m : subset(m).dfa;
  // lay out states in BFS layers from the start state
  function layered(ids, trans, start) {
    const layer = { [start]: 0 }, order = [start];
    for (let j = 0; j < order.length; j++) trans.filter(t => t.from === order[j]).forEach(t => { if (layer[t.to] === undefined) { layer[t.to] = layer[order[j]] + 1; order.push(t.to); } });
    ids.forEach(id => { if (layer[id] === undefined) { layer[id] = 0; order.push(id); } });
    const by = {}; order.forEach(k => (by[layer[k]] = by[layer[k]] || []).push(k));
    const pos = {}; Object.keys(by).forEach(l => by[l].forEach((k, i) => { pos[k] = { x: 90 + l * 190, y: 80 + i * 130 }; }));
    return pos;
  }
  const OPS = {
    union: { name: 'union L₁ ∪ L₂', binary: true, expect: (a1, a2) => w => a1(w) || a2(w) },
    concat: { name: 'concatenation L₁L₂', binary: true, expect: (a1, a2) => w => { for (let i = 0; i <= w.length; i++) if (a1(w.slice(0, i)) && a2(w.slice(i))) return true; return false; } },
    star: { name: 'star L₁*', expect: a1 => w => { const ok = [true]; for (let j = 1; j <= w.length; j++) { ok[j] = false; for (let i = 0; i < j && !ok[j]; i++) ok[j] = ok[i] && a1(w.slice(i, j)); } return ok[w.length]; } },
    reverse: { name: 'reversal L₁ᴿ', expect: a1 => w => a1([...w].reverse().join('')) },
    complement: { name: 'complement of L₁', expect: a1 => w => !a1(w) },
    intersection: { name: 'intersection L₁ ∩ L₂ (product of DFAs)', binary: true, expect: (a1, a2) => w => a1(w) && a2(w) },
  };
  // steps: [{text, m (machine snapshot), hl}]; the last snapshot is the result
  function construct(op, M1, M2) {
    const steps = [], snap = (text, m, hl) => steps.push({ text, m: JSON.parse(JSON.stringify(m)), hl: hl || {} });
    const norm = (m, k) => { const n = op === 'complement' || op === 'intersection' ? null : singleFinal(m); if (n) steps.push({ text: 'M' + k + ' has ' + (m.finals.length || 'no') + ' final state' + (m.finals.length === 1 ? '' : 's') + ': add one final state qf with λ-edges from ' + (m.finals.join(', ') || 'nowhere') + '.', pre: true }); return n || m; };
    const A0 = norm(M1, '₁'), B0 = OPS[op].binary ? norm(M2, '₂') : null;
    const lam = (f, t) => f + '|' + LAMBDA + '|' + t;
    if (op === 'union') {
      const A = placed(A0, '1', 190, 60), B = placed(B0, '2', 190, 60 + A.h + 120), mid = (60 + 60 + A.h + 120 + B.h) / 2, fx = 190 + Math.max(A.w, B.w) + 150;
      const m = { type: 'nfa', states: A.states.concat(B.states), trans: A.trans.concat(B.trans), curves: Object.assign({}, A.curves, B.curves), start: null, finals: A.finals.concat(B.finals), big: A.big || B.big };
      snap('M₁ on top, M₂ below, each with a single final state.', m);
      m.states.unshift(S('s', 60, mid)); m.trans.push(T('s', LAMBDA, A.start), T('s', LAMBDA, B.start)); m.start = 's';
      snap('Add a new initial state s with λ-edges to the initial states of M₁ and M₂: from s the automaton guesses which one to run.', m, { states: ['s'], edges: [lam('s', A.start), lam('s', B.start)] });
      m.states.push(S('f', fx, mid)); m.trans.push(T(A.finals[0], LAMBDA, 'f'), T(B.finals[0], LAMBDA, 'f')); m.finals = ['f'];
      snap('Add a new final state f with λ-edges from the old final states, which become non-final.', m, { states: ['f'], edges: [lam(A.finals[0], 'f'), lam(B.finals[0], 'f')] });
    } else if (op === 'concat') {
      const bB = bbox(B0), A = placed(A0, '1', 90, 80), B = placed(B0, '2', 90 + A.w + 170, 80 + (A.h - (bB.y1 - bB.y0)) / 2);
      const m = { type: 'nfa', states: A.states.concat(B.states), trans: A.trans.concat(B.trans), curves: Object.assign({}, A.curves, B.curves), start: null, finals: A.finals.concat(B.finals), big: A.big || B.big };
      snap('M₁ on the left, M₂ on the right, each with a single final state.', m);
      m.trans.push(T(A.finals[0], LAMBDA, B.start)); m.start = A.start; m.finals = B.finals.slice();
      snap('Add a λ-edge from the final state of M₁ to the initial state of M₂. The initial state is M₁’s, the only final state M₂’s.', m, { edges: [lam(A.finals[0], B.start)] });
    } else if (op === 'star') {
      const A = placed(A0, '1', 200, 120), my = 120 + A.h / 2, fx = 200 + A.w + 140;
      const m = { type: 'nfa', states: A.states.slice(), trans: A.trans.slice(), curves: Object.assign({}, A.curves), start: A.start, finals: A.finals.slice(), big: A.big };
      snap('M₁ with a single final state.', m);
      m.states.unshift(S('s', 60, my)); m.states.push(S('f', fx, my)); m.trans.push(T('s', LAMBDA, A.start), T(A.finals[0], LAMBDA, 'f')); m.start = 's'; m.finals = ['f'];
      snap('Add a new initial state s and a new final state f, joined to M₁ by λ-edges; the old final state becomes non-final.', m, { states: ['s', 'f'], edges: [lam('s', A.start), lam(A.finals[0], 'f')] });
      m.trans.push(T(A.finals[0], LAMBDA, A.start)); m.curves[A.finals[0] + '|' + A.start] = A.h + 110;
      snap('Add a λ-edge from the final state of M₁ back to its initial state, so M₁ can run again on the next piece.', m, { edges: [lam(A.finals[0], A.start)] });
      m.trans.push(T('s', LAMBDA, 'f')); m.curves['s|f'] = A.h + 150;
      snap('Add a λ-edge from s to f, so that λ (zero pieces) is accepted.', m, { edges: [lam('s', 'f')] });
    } else if (op === 'reverse') {
      const A = placed(A0, '', 90, 80);
      const m = { type: 'nfa', states: A.states, trans: A.trans, curves: A.curves, start: A.start, finals: A.finals, big: A.big };
      snap('M₁ with a single final state.', m);
      m.trans = A.trans.map(t => T(t.to, t.sym, t.from)); const cv = {}; Object.keys(A.curves).forEach(k => { const [f, t] = k.split('|'); cv[t + '|' + f] = -A.curves[k]; }); m.curves = cv;
      snap('Reverse the direction of every transition.', m, { edges: m.trans.map(t => t.from + '|' + t.sym + '|' + t.to) });
      m.start = A.finals[0]; m.finals = [A.start];
      snap('Swap the roles: the old final state is the initial state, the old initial state the only final state.', m, { states: [m.start, A.start] });
    } else if (op === 'complement') {
      const A = placed(A0, '', 90, 80);
      snap('M₁ over Σ = {' + M1.alphabet.join(', ') + '}.', { type: A0.type, states: A.states, trans: A.trans, curves: A.curves, start: A.start, finals: A.finals, big: A.big });
      const D = toDfa(A0), Dp = placed(D, '', 90, 80);
      const m = { type: 'dfa', states: Dp.states, trans: Dp.trans, curves: Dp.curves, start: Dp.start, finals: Dp.finals, big: Dp.big };
      if (D !== A0) snap('Complementing needs a complete DFA: the subset construction gives one (∅, if it appears, is the trap state).', m);
      m.finals = m.states.map(s => s.id).filter(q => !Dp.finals.includes(q));
      snap('Swap final and non-final states. A string the DFA rejected now ends in a final state, and vice versa.', m, { states: m.finals });
    } else {   // intersection
      const D1 = toDfa(A0), D2 = toDfa(B0), P1 = placed(D1, '1', 90, 60), P2 = placed(D2, '2', 90, 60 + P1.h + 130);
      snap('Complete DFAs D₁ (top) for L₁ and D₂ (bottom) for L₂.', { type: 'dfa', states: P1.states.concat(P2.states), trans: P1.trans.concat(P2.trans), curves: Object.assign({}, P1.curves, P2.curves), start: null, finals: P1.finals.concat(P2.finals), big: P1.big || P2.big });
      const lbl = (D, q) => D.states.find(s => s.id === q).label.replace(/^\{([^,]*)\}$/, '$1');   // {p0} → p0
      const d = (D, q, a) => (D.trans.find(t => t.from === q && t.sym === a) || {}).to;
      const alpha = uniq(D1.alphabet.concat(D2.alphabet));
      const key = (p, q) => p + '&' + q, ids = [key(D1.start, D2.start)], pairs = { [ids[0]]: [D1.start, D2.start] }, trans = [];
      for (let j = 0; j < ids.length; j++) {
        const [p, q] = pairs[ids[j]];
        alpha.forEach(a => {
          const p2 = d(D1, p, a), q2 = d(D2, q, a); if (p2 === undefined || q2 === undefined) return;
          const k = key(p2, q2); if (!pairs[k]) { pairs[k] = [p2, q2]; ids.push(k); }
          trans.push(T(ids[j], a, k));
        });
      }
      const pos = layered(ids, trans, ids[0]);
      const m = { type: 'dfa', states: ids.map(k => S(k, pos[k].x, pos[k].y, '(' + lbl(D1, pairs[k][0]) + ', ' + lbl(D2, pairs[k][1]) + ')')), trans, curves: {}, start: ids[0], finals: [], big: true };
      snap('Run both at once: a state is a pair (state of D₁, state of D₂), and each symbol moves both components.', m);
      m.finals = ids.filter(k => D1.finals.includes(pairs[k][0]) && D2.finals.includes(pairs[k][1]));
      snap('A pair is final when both components are final: the string is in L₁ and in L₂. (De Morgan gives the same language.)', m, { states: m.finals });
    }
    const res = steps[steps.length - 1].m;
    const result = { type: res.type, states: res.states, trans: res.trans, start: res.start, finals: res.finals };
    return { steps: steps.filter(s => !s.pre), pre: steps.filter(s => s.pre).map(s => s.text), result };
  }
  FA.construct = construct;

  class Constructor extends Player {
    constructor(id, cfg) {
      super(id); this.cfg = cfg;
      this.ops = cfg.ops || Object.keys(OPS); this.op = cfg.op || this.ops[0];
      this.machineIds = cfg.machines || ['rl-m1', 'rl-m2']; this.m1 = cfg.m1 || this.machineIds[0]; this.m2 = cfg.m2 || this.machineIds[1] || this.machineIds[0];
      this.multi = cfg.multi || ''; this.compute();
    }
    compute() {
      const M1 = M[this.m1], M2 = M[this.m2], bin = OPS[this.op].binary;
      this.res = construct(this.op, M1, M2); this.total = this.res.steps.length - 1; this.i = 0;
      const a1 = matcher(M1), a2 = matcher(M2), got = matcher(this.res.result), want = OPS[this.op].expect(a1, a2);
      const alpha = this.op === 'complement' ? M1.alphabet : uniq(M1.alphabet.concat(bin ? M2.alphabet : []));
      const words = allStrings(alpha, lengthCap(alpha, 6, 3000));
      this.fns = { a1, a2, got, want, alpha };
      this.check = { bad: words.find(w => got(w) !== want(w)), count: words.length, n: words.length ? words[words.length - 1].length : 0 };
    }
    set(k, v) { this.stop(); this[k] = v; this.compute(); this.render(); }
    setMulti(t) { this.multi = t; }
    runMulti() { this.render(); }
    html() {
      const at = this.at(), st = this.res.steps[this.i], bin = OPS[this.op].binary, f = this.fns;
      const m = crop(Object.assign({ id: 'cons', name: '' }, JSON.parse(JSON.stringify(st.m)), { bigLabels: st.m.big }));
      const opt = (ids, cur, names) => ids.map(id => '<option value="' + id + '"' + (id === cur ? ' selected' : '') + '>' + esc(names(id)) + '</option>').join('');
      const tb = '<label class="fa-field">Operation <select onchange="' + at + ".set('op', this.value)\">" + opt(this.ops, this.op, id => OPS[id].name) + '</select></label>' +
        '<label class="fa-field">M₁ <select onchange="' + at + ".set('m1', this.value)\">" + opt(this.machineIds, this.m1, id => M[id].name) + '</select></label>' +
        (bin ? '<label class="fa-field">M₂ <select onchange="' + at + ".set('m2', this.value)\">" + opt(this.machineIds, this.m2, id => M[id].name) + '</select></label>' : '');
      const pre = this.res.pre.length ? '<div class="fa-line fa-note">First: ' + this.res.pre.map(esc).join(' ') + '</div>' : '';
      const logHTML = this.res.steps.map((x, k) => '<li class="' + (k <= this.i ? 'done' : '') + (k === this.i ? ' cur' : '') + '">' + esc(x.text) + '</li>').join('');
      let tail = '<div class="fa-line fa-note">Step to the end to test the result.</div>';
      if (this.i === this.total) {
        const c = this.check, ok = s => '<span class="fa-verdict ' + (s ? 'accept">yes' : 'reject">no') + '</span>';
        const lines = this.multi.split('\n').map(x => x.trim()).filter((x, i, a) => x && a.indexOf(x) === i);
        const rows = lines.map(w => { const ww = w === LAMBDA ? '' : w; if ([...ww].some(ch => !f.alpha.includes(ch))) return '<tr><td>' + esc(w) + '</td><td colspan="4" class="bad">symbol not in Σ = {' + f.alpha.join(', ') + '}</td></tr>';
          const g = f.got(ww), e = f.want(ww); return '<tr><td>' + fmtW(ww) + '</td><td>' + ok(f.a1(ww)) + '</td>' + (bin ? '<td>' + ok(f.a2(ww)) + '</td>' : '') + '<td>' + ok(g) + '</td><td class="' + (g === e ? 'ok">✔' : 'bad">✘') + '</td></tr>'; }).join('');
        tail = '<div class="fa-line fa-final">' + (c.bad === undefined ? '<span class="fa-verdict accept">correct</span> the result accepts exactly the strings the ' + esc(OPS[this.op].name.split(' ')[0]) + ' should contain — checked on all ' + c.count + ' strings of length ≤ ' + c.n + '.' : '<span class="fa-verdict reject">mismatch</span> on “' + fmtW(c.bad) + '”') + '</div>' +
          '<div class="fa-multi"><div class="fa-line"><b>Test strings</b> — one per line (λ for the empty string):</div><textarea rows="3" spellcheck="false" oninput="' + at + '.setMulti(this.value)">' + esc(this.multi) + '</textarea>' +
          '<button class="btn fa-btn" onclick="' + at + '.runMulti()">Test</button>' +
          (rows ? '<table class="fa-table"><tr><th>w</th><th>in L(M₁)</th>' + (bin ? '<th>in L(M₂)</th>' : '') + '<th>result accepts</th><th>as expected</th></tr>' + rows + '</table>' : '') + '</div>';
      }
      return '<div class="fa-wrap"><div class="fa-toolbar">' + tb + '</div>' + pre + this.controlsHTML() + drawMachine(m, st.hl) + '<ol class="fa-log">' + logHTML + '</ol>' + tail + '</div>';
    }
  }

  /* ════════════════════════════════════════════════════════════════
     5. Mounting
     ════════════════════════════════════════════════════════════════ */
  const KINDS = { run: Runner, convert: Converter, minimize: Minimizer, derive: Deriver, tool: Tool, graph: GraphTool, proofs: ProofsDemo, regex: RegexTool, eliminate: Eliminator, construct: Constructor };
  FA.mount = function (id, cfg) {
    cfg = cfg || {};
    const old = UIS[id]; if (old && old.stop) old.stop();
    const Cls = KINDS[cfg.mode || 'run'];
    const ui = new Cls(id, cfg); UIS[id] = ui; ui.render(); return ui;
  };
})();
