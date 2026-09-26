/* ── Python-subset interpreter + stepper with frames, objects and references (COMP 348) ───────
   Pure core (no DOM): PY.run(code, stdin, opts) → { trace, out, error }.
   UI: PY.mount(id, cfg) builds the stepper inside #sim-<id>; cfg = { code, stdin?, files?, args?, maxSteps? }.
   The model is CPython's: every value is an object, a variable is a name bound to a reference, and
   an object is freed when no reference to it is left (reference counting); objects that only
   reference each other survive until gc.collect() (the cycle collector). The subset is what a first
   Python course uses: int (arbitrary precision), float, bool, None, str, list, tuple, dict (insertion
   order), set, range; if/while/for with else, break/continue, comprehensions; def with defaults,
   keyword and *args/**kwargs arguments, lambda, closures, global/nonlocal; classes with class and
   instance attributes, inheritance (C3 order), super(), the common dunder methods; exceptions with
   try/except/else/finally/raise; import of math, sys, random, gc, collections and of the program's
   own modules (cfg.files). Execution records a snapshot before every statement. */
(function () {
  'use strict';
  const PY = {};

  /* ════════════════════════════════════════════════════════════════
     1. Lexer (with INDENT / DEDENT)
     ════════════════════════════════════════════════════════════════ */
  const KW = new Set(['False', 'None', 'True', 'and', 'as', 'assert', 'break', 'class', 'continue', 'def', 'del', 'elif', 'else', 'except',
    'finally', 'for', 'from', 'global', 'if', 'import', 'in', 'is', 'lambda', 'nonlocal', 'not', 'or', 'pass', 'raise', 'return', 'try', 'while', 'with', 'yield']);
  const OPS = ['...', '**=', '//=', '>>=', '<<=', '->', '**', '//', '<<', '>>', '<=', '>=', '==', '!=', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', ':=',
    '+', '-', '*', '/', '%', '@', '<', '>', '=', '(', ')', '[', ']', '{', '}', ',', ':', '.', ';', '&', '|', '^', '~'];
  class PySyntaxError extends Error { constructor(msg, line) { super(msg); this.line = line; } }

  function lex(src) {
    const toks = [];
    const indents = [0];
    let i = 0, line = 1, depth = 0, atLineStart = true;
    const n = src.length;
    const push = (k, v, extra) => toks.push({ k, v, line, ...extra });
    while (i < n) {
      if (atLineStart && depth === 0) {
        let col = 0, j = i;
        while (j < n && (src[j] === ' ' || src[j] === '\t')) { col += src[j] === '\t' ? 8 - (col % 8) : 1; j++; }
        if (j >= n) { i = j; break; }
        if (src[j] === '\n' || src[j] === '#' || src[j] === '\r') { // blank or comment line
          while (j < n && src[j] !== '\n') j++;
          i = j + 1; line++; continue;
        }
        if (col > indents[indents.length - 1]) { indents.push(col); push('INDENT', col); }
        else while (col < indents[indents.length - 1]) {
          indents.pop(); push('DEDENT', col);
          if (col > indents[indents.length - 1]) throw new PySyntaxError('unindent does not match any outer indentation level', line);
        }
        i = j; atLineStart = false;
      }
      const c = src[i];
      if (c === '\n') { if (depth === 0) { push('NEWLINE'); atLineStart = true; } line++; i++; continue; }
      if (c === ' ' || c === '\t' || c === '\r') { i++; continue; }
      if (c === '#') { while (i < n && src[i] !== '\n') i++; continue; }
      if (c === '\\' && src[i + 1] === '\n') { i += 2; line++; continue; }
      // strings, with prefixes r, f, b, rf, fr
      const pm = /^([rRfFbBuU]{0,2})("""|'''|"|')/.exec(src.slice(i, i + 5));
      if (pm && (pm[1] === '' || /^[A-Za-z]/.test(c))) {
        const prefix = pm[1].toLowerCase(), q = pm[2];
        let j = i + pm[0].length, body = '';
        const startLine = line;
        for (;;) {
          if (j >= n) throw new PySyntaxError(q.length === 3 ? 'unterminated triple-quoted string literal' : 'unterminated string literal', startLine);
          if (src.startsWith(q, j)) { j += q.length; break; }
          const ch = src[j];
          if (ch === '\n') { if (q.length === 1) throw new PySyntaxError('unterminated string literal', startLine); line++; body += ch; j++; continue; }
          if (ch === '\\' && !prefix.includes('r')) {
            const e = src[j + 1];
            const map = { n: '\n', t: '\t', r: '\r', '\\': '\\', "'": "'", '"': '"', '0': '\0', a: '\x07', b: '\b', f: '\f', v: '\v' };
            if (e === '\n') { line++; j += 2; continue; }
            if (e === 'x') { body += String.fromCharCode(parseInt(src.substr(j + 2, 2), 16)); j += 4; continue; }
            if (e === 'u') { body += String.fromCharCode(parseInt(src.substr(j + 2, 4), 16)); j += 6; continue; }
            if (e in map) { body += map[e]; j += 2; continue; }
            if (prefix.includes('f') && (e === '{' || e === '}')) { body += '\\' + e; j += 2; continue; }
            body += '\\' + e; j += 2; continue;
          }
          if (ch === '\\' && prefix.includes('r')) { body += ch + (src[j + 1] || ''); if (src[j + 1] === '\n') line++; j += 2; continue; }
          body += ch; j++;
        }
        push(prefix.includes('f') ? 'FSTR' : 'STR', body);
        i = j; continue;
      }
      if (/[A-Za-z_]/.test(c) || c.charCodeAt(0) > 127) {
        let j = i; while (j < n && (/[A-Za-z0-9_]/.test(src[j]) || src.charCodeAt(j) > 127)) j++;
        const w = src.slice(i, j);
        push(KW.has(w) ? 'KW' : 'NAME', w); i = j; continue;
      }
      if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(src[i + 1] || ''))) {
        let m = /^(0[xX][0-9a-fA-F_]+|0[oO][0-7_]+|0[bB][01_]+)/.exec(src.slice(i));
        if (m) { push('INT', BigInt(m[0].replace(/_/g, ''))); i += m[0].length; continue; }
        m = /^(\d[\d_]*)?(\.[\d_]*)?([eE][-+]?\d+)?[jJ]?/.exec(src.slice(i));
        const t = m[0].replace(/_/g, '');
        if (/[jJ]$/.test(t)) throw new PySyntaxError('complex numbers are not supported here', line);
        if (m[2] !== undefined || m[3] !== undefined) push('FLOAT', parseFloat(t));
        else push('INT', BigInt(t));
        i += m[0].length; continue;
      }
      let op = null;
      for (const o of OPS) if (src.startsWith(o, i)) { op = o; break; }
      if (!op) {
        if (c === '!' ) throw new PySyntaxError('invalid syntax', line);
        throw new PySyntaxError(`invalid character '${c}'`, line);
      }
      if ('([{'.includes(op)) depth++;
      if (')]}'.includes(op)) depth = Math.max(0, depth - 1);
      push('OP', op); i += op.length;
    }
    if (toks.length && toks[toks.length - 1].k !== 'NEWLINE') push('NEWLINE');
    while (indents.length > 1) { indents.pop(); push('DEDENT', 0); }
    push('EOF');
    return toks;
  }

  /* ════════════════════════════════════════════════════════════════
     2. Parser
     ════════════════════════════════════════════════════════════════ */
  class Parser {
    constructor(toks) { this.t = toks; this.i = 0; }
    peek(o = 0) { return this.t[this.i + o] || this.t[this.t.length - 1]; }
    next() { return this.t[this.i++]; }
    isOp(v, o = 0) { const p = this.peek(o); return p.k === 'OP' && p.v === v; }
    isKw(v, o = 0) { const p = this.peek(o); return p.k === 'KW' && p.v === v; }
    eatOp(v) { if (this.isOp(v)) { this.i++; return true; } return false; }
    eatKw(v) { if (this.isKw(v)) { this.i++; return true; } return false; }
    err(msg, tok) { const p = tok || this.peek(); return new PySyntaxError(msg || (p.k === 'EOF' ? 'unexpected EOF while parsing' : p.k === 'INDENT' ? 'unexpected indent' : 'invalid syntax'), p.line); }
    expectOp(v) { if (!this.isOp(v)) throw this.err(v === ':' && this.peek().k === 'NEWLINE' ? "expected ':'" : v === ')' ? "'(' was never closed" : undefined); return this.next(); }
    expectKw(v) { if (!this.isKw(v)) throw this.err(); return this.next(); }
    name() { const p = this.next(); if (p.k !== 'NAME') throw this.err(undefined, p); return p.v; }

    program() {
      const body = [];
      while (this.peek().k !== 'EOF') {
        if (this.peek().k === 'NEWLINE') { this.next(); continue; }
        if (this.peek().k === 'INDENT') throw this.err('unexpected indent');
        body.push(...this.statement());
      }
      return body;
    }
    block() {
      if (this.peek().k !== 'NEWLINE') { // simple statements on the same line
        return this.simpleStatements();
      }
      this.next();
      while (this.peek().k === 'NEWLINE') this.next();
      if (this.peek().k !== 'INDENT') throw this.err('expected an indented block');
      this.next();
      const body = [];
      while (this.peek().k !== 'DEDENT' && this.peek().k !== 'EOF') {
        if (this.peek().k === 'NEWLINE') { this.next(); continue; }
        body.push(...this.statement());
      }
      if (this.peek().k === 'DEDENT') this.next();
      return body;
    }
    statement() {
      const p = this.peek();
      if (p.k === 'KW') {
        switch (p.v) {
          case 'if': return [this.ifStmt()];
          case 'while': { this.next(); const c = this.expr(); this.expectOp(':'); const body = this.block(); const orelse = this.elseBlock(); return [{ k: 'while', c, body, orelse, line: p.line }]; }
          case 'for': {
            this.next(); const target = this.targetList(); this.expectKw('in'); const iter = this.exprList(); this.expectOp(':');
            const body = this.block(); const orelse = this.elseBlock();
            return [{ k: 'for', target, iter, body, orelse, line: p.line }];
          }
          case 'def': return [this.funcDef()];
          case 'class': {
            this.next(); const name = this.name(); let bases = [];
            if (this.eatOp('(')) { if (!this.isOp(')')) { do { if (this.isOp(')')) break; bases.push(this.expr()); } while (this.eatOp(',')); } this.expectOp(')'); }
            this.expectOp(':');
            return [{ k: 'class', name, bases, body: this.block(), line: p.line }];
          }
          case 'try': return [this.tryStmt()];
          case 'with': throw this.err("'with' is not supported by this interpreter");
        }
      }
      if (p.k === 'OP' && p.v === '@') throw this.err('decorators are not supported by this interpreter');
      return this.simpleStatements();
    }
    elseBlock() { if (this.isKw('else')) { this.next(); this.expectOp(':'); return this.block(); } return null; }
    ifStmt() {
      const line = this.next().line; const c = this.expr(); this.expectOp(':'); const body = this.block();
      let orelse = null;
      if (this.isKw('elif')) orelse = [this.ifStmt()];
      else if (this.isKw('else')) { this.next(); this.expectOp(':'); orelse = this.block(); }
      return { k: 'if', c, body, orelse, line };
    }
    tryStmt() {
      const line = this.next().line; this.expectOp(':');
      const body = this.block(); const handlers = []; let orelse = null, fin = null;
      while (this.isKw('except')) {
        const hl = this.next().line; let type = null, name = null;
        if (!this.isOp(':')) { type = this.expr(); if (this.eatKw('as')) name = this.name(); }
        this.expectOp(':');
        handlers.push({ type, name, body: this.block(), line: hl });
      }
      if (this.isKw('else')) { this.next(); this.expectOp(':'); orelse = this.block(); }
      if (this.isKw('finally')) { this.next(); this.expectOp(':'); fin = this.block(); }
      if (!handlers.length && !fin) throw this.err("expected 'except' or 'finally' block");
      return { k: 'try', body, handlers, orelse, fin, line };
    }
    funcDef() {
      const line = this.next().line; const name = this.name();
      this.expectOp('('); const params = this.params(')'); this.expectOp(')');
      if (this.eatOp('->')) this.expr();
      this.expectOp(':');
      const body = this.block();
      const doc = body[0] && body[0].k === 'expr' && body[0].e.k === 'str' ? body[0].e.v : null;
      return { k: 'def', name, params, body, doc, line };
    }
    // parameters: name, name=default, *args, **kwargs, and bare * for keyword-only
    params(end) {
      const ps = [];
      let kwOnly = false;
      while (!this.isOp(end)) {
        if (this.eatOp('**')) { ps.push({ name: this.name(), kind: 'kwargs' }); }
        else if (this.eatOp('*')) { if (this.peek().k === 'NAME') ps.push({ name: this.name(), kind: 'varargs' }); kwOnly = true; }
        else {
          const name = this.name();
          if (end === ')' && this.eatOp(':')) this.expr(); // annotation
          let def = null;
          if (this.eatOp('=')) def = this.expr();
          ps.push({ name, def, kind: kwOnly ? 'kwonly' : 'pos' });
        }
        if (!this.eatOp(',')) break;
      }
      return ps;
    }
    simpleStatements() {
      const out = [this.simpleStatement()];
      while (this.eatOp(';')) { if (this.peek().k === 'NEWLINE') break; out.push(this.simpleStatement()); }
      if (this.peek().k === 'NEWLINE') this.next();
      else if (this.peek().k !== 'EOF' && this.peek().k !== 'DEDENT') throw this.err();
      return out;
    }
    simpleStatement() {
      const p = this.peek(), line = p.line;
      if (p.k === 'KW') {
        switch (p.v) {
          case 'pass': this.next(); return { k: 'pass', line };
          case 'break': this.next(); return { k: 'break', line };
          case 'continue': this.next(); return { k: 'continue', line };
          case 'return': { this.next(); const e = this.peek().k === 'NEWLINE' || this.isOp(';') || this.peek().k === 'EOF' ? null : this.exprList(); return { k: 'return', e, line }; }
          case 'global': case 'nonlocal': { this.next(); const names = [this.name()]; while (this.eatOp(',')) names.push(this.name()); return { k: p.v, names, line }; }
          case 'del': { this.next(); const targets = [this.expr()]; while (this.eatOp(',')) targets.push(this.expr()); return { k: 'del', targets, line }; }
          case 'raise': { this.next(); const e = this.peek().k === 'NEWLINE' ? null : this.expr(); if (this.eatKw('from')) this.expr(); return { k: 'raise', e, line }; }
          case 'assert': { this.next(); const c = this.expr(); const msg = this.eatOp(',') ? this.expr() : null; return { k: 'assert', c, msg, line }; }
          case 'import': {
            this.next(); const names = [];
            do { let mod = this.name(); while (this.eatOp('.')) mod += '.' + this.name(); const as = this.eatKw('as') ? this.name() : null; names.push({ mod, as }); } while (this.eatOp(','));
            return { k: 'import', names, line };
          }
          case 'from': {
            this.next(); let mod = this.name(); while (this.eatOp('.')) mod += '.' + this.name();
            this.expectKw('import'); const names = [];
            if (this.eatOp('*')) return { k: 'fromimport', mod, star: true, names, line };
            const paren = this.eatOp('(');
            do { if (paren && this.isOp(')')) break; const name = this.name(); const as = this.eatKw('as') ? this.name() : null; names.push({ name, as }); } while (this.eatOp(','));
            if (paren) this.expectOp(')');
            return { k: 'fromimport', mod, names, line };
          }
          case 'yield': throw this.err('generators (yield) are not supported by this interpreter');
        }
      }
      const e = this.exprList(true);
      if (this.isOp('=')) {
        const targets = [e];
        let value;
        while (this.eatOp('=')) { value = this.exprList(true); targets.push(value); }
        targets.pop();
        for (const t of targets) this.checkTarget(t);
        return { k: 'assign', targets, value, line };
      }
      const aug = ['+=', '-=', '*=', '/=', '//=', '%=', '**=', '&=', '|=', '^=', '<<=', '>>='];
      if (this.peek().k === 'OP' && aug.includes(this.peek().v)) {
        const op = this.next().v.slice(0, -1);
        this.checkTarget(e);
        if (e.k === 'tuple') throw this.err("'tuple' is an illegal expression for augmented assignment");
        return { k: 'augassign', target: e, op, value: this.exprList(), line };
      }
      if (this.isOp(':') && e.k === 'name') { this.next(); this.expr(); if (this.eatOp('=')) return { k: 'assign', targets: [e], value: this.expr(), line }; return { k: 'pass', line }; }
      return { k: 'expr', e, line };
    }
    checkTarget(t) {
      if (t.k === 'name' || t.k === 'attr' || t.k === 'sub') return;
      if ((t.k === 'tuple' || t.k === 'list') ) { t.items.forEach(x => this.checkTarget(x.k === 'star' ? x.e : x)); return; }
      if (t.k === 'star') return this.checkTarget(t.e);
      throw new PySyntaxError(t.k === 'call' ? "cannot assign to function call here. Maybe you meant '==' instead of '='?" : t.k === 'const' || t.k === 'str' || t.k === 'num' ? 'cannot assign to literal' : 'cannot assign to expression', t.line);
    }
    // assignment targets of for / comprehensions: stop before `in`, so parse below comparisons
    targetList() {
      const one = () => (this.isOp('*') ? (this.next(), { k: 'star', e: this.bitor(), line: this.peek().line }) : this.bitor());
      const first = one(); const items = [first];
      if (!this.isOp(',')) return first;
      while (this.eatOp(',')) { if (this.isKw('in') || this.isOp('=')) break; items.push(one()); }
      return { k: 'tuple', items, line: first.line };
    }
    // expression list: a, b  → tuple
    exprList(allowStar) {
      const line = this.peek().line;
      const first = allowStar && this.isOp('*') ? (this.next(), { k: 'star', e: this.orExpr(), line }) : this.expr();
      if (!this.isOp(',')) return first;
      const items = [first];
      while (this.eatOp(',')) {
        if (this.peek().k === 'NEWLINE' || this.isOp('=') || this.isOp(')') || this.peek().k === 'EOF' || this.isOp(';')) break;
        items.push(allowStar && this.isOp('*') ? (this.next(), { k: 'star', e: this.orExpr(), line }) : this.expr());
      }
      return { k: 'tuple', items, line };
    }
    expr() {
      if (this.isKw('lambda')) {
        const line = this.next().line; const params = this.params(':'); this.expectOp(':');
        return { k: 'lambda', params, body: this.expr(), line };
      }
      const e = this.orExpr();
      if (this.isKw('if') ) {
        const line = this.next().line; const c = this.orExpr(); this.expectKw('else');
        return { k: 'ifexp', c, a: e, b: this.expr(), line };
      }
      if (this.isOp(':=')) { const line = this.next().line; return { k: 'walrus', target: e, value: this.expr(), line }; }
      return e;
    }
    orExpr() { let a = this.andExpr(); while (this.isKw('or')) { const line = this.next().line; a = { k: 'bool', op: 'or', a, b: this.andExpr(), line }; } return a; }
    andExpr() { let a = this.notExpr(); while (this.isKw('and')) { const line = this.next().line; a = { k: 'bool', op: 'and', a, b: this.notExpr(), line }; } return a; }
    notExpr() { if (this.isKw('not')) { const line = this.next().line; return { k: 'not', a: this.notExpr(), line }; } return this.comparison(); }
    comparison() {
      const first = this.bitor();
      const ops = [], rest = [];
      for (;;) {
        const p = this.peek();
        let op = null;
        if (p.k === 'OP' && ['<', '>', '==', '>=', '<=', '!='].includes(p.v)) { op = p.v; this.next(); }
        else if (p.k === 'KW' && p.v === 'in') { op = 'in'; this.next(); }
        else if (p.k === 'KW' && p.v === 'not' && this.isKw('in', 1)) { op = 'not in'; this.next(); this.next(); }
        else if (p.k === 'KW' && p.v === 'is') { this.next(); op = this.eatKw('not') ? 'is not' : 'is'; }
        else break;
        ops.push(op); rest.push(this.bitor());
      }
      if (!ops.length) return first;
      return { k: 'compare', first, ops, rest, line: first.line };
    }
    binLevel(next, ops) {
      let a = next();
      for (;;) {
        const p = this.peek();
        if (p.k === 'OP' && ops.includes(p.v)) { this.next(); a = { k: 'bin', op: p.v, a, b: next(), line: p.line }; }
        else return a;
      }
    }
    bitor() { return this.binLevel(() => this.bitxor(), ['|']); }
    bitxor() { return this.binLevel(() => this.bitand(), ['^']); }
    bitand() { return this.binLevel(() => this.shift(), ['&']); }
    shift() { return this.binLevel(() => this.arith(), ['<<', '>>']); }
    arith() { return this.binLevel(() => this.term(), ['+', '-']); }
    term() { return this.binLevel(() => this.factor(), ['*', '/', '//', '%', '@']); }
    factor() {
      const p = this.peek();
      if (p.k === 'OP' && ['-', '+', '~'].includes(p.v)) { this.next(); return { k: 'unary', op: p.v, a: this.factor(), line: p.line }; }
      return this.power();
    }
    power() {
      const a = this.postfix(this.atom());
      if (this.isOp('**')) { const line = this.next().line; return { k: 'bin', op: '**', a, b: this.factor(), line }; }
      return a;
    }
    postfix(e) {
      for (;;) {
        const p = this.peek();
        if (p.k !== 'OP') return e;
        if (p.v === '(') { this.next(); e = { k: 'call', f: e, args: this.callArgs(), line: p.line }; }
        else if (p.v === '[') { this.next(); e = { k: 'sub', a: e, i: this.subscript(), line: p.line }; this.expectOp(']'); }
        else if (p.v === '.') { this.next(); e = { k: 'attr', a: e, name: this.name(), line: p.line }; }
        else return e;
      }
    }
    callArgs() {
      const args = [];
      while (!this.isOp(')')) {
        if (this.eatOp('**')) args.push({ kind: 'kwstar', e: this.expr() });
        else if (this.eatOp('*')) args.push({ kind: 'star', e: this.expr() });
        else if (this.peek().k === 'NAME' && this.isOp('=', 1)) { const name = this.next().v; this.next(); args.push({ kind: 'kw', name, e: this.expr() }); }
        else {
          const e = this.expr();
          if (this.isKw('for')) { args.push({ kind: 'pos', e: this.comprehension('gen', e, null) }); break; }
          args.push({ kind: 'pos', e });
        }
        if (!this.eatOp(',')) break;
      }
      this.expectOp(')');
      return args;
    }
    subscript() {
      const line = this.peek().line;
      const part = () => (this.isOp(':') || this.isOp(']') || this.isOp(',') ? null : this.expr());
      const one = () => {
        const a = part();
        if (!this.isOp(':')) return a;
        this.next(); const b = part(); let c = null;
        if (this.eatOp(':')) c = part();
        return { k: 'slice', a, b, c, line };
      };
      const first = one();
      if (!this.isOp(',')) return first;
      const items = [first]; while (this.eatOp(',')) { if (this.isOp(']')) break; items.push(one()); }
      return { k: 'tuple', items, line };
    }
    comprehension(kind, elt, val) {
      const gens = [];
      while (this.isKw('for')) {
        this.next(); const target = this.targetList(); this.expectKw('in'); const iter = this.orExpr();
        const ifs = []; while (this.isKw('if')) { this.next(); ifs.push(this.orExprNoCond()); }
        gens.push({ target, iter, ifs });
      }
      return { k: 'comp', kind, elt, val, gens, line: elt.line };
    }
    orExprNoCond() { return this.orExpr(); }
    atom() {
      const p = this.next(), line = p.line;
      switch (p.k) {
        case 'INT': return { k: 'num', v: p.v, int: true, line };
        case 'FLOAT': return { k: 'num', v: p.v, line };
        case 'STR': case 'FSTR': {
          // adjacent literals concatenate
          const parts = [p];
          while (this.peek().k === 'STR' || this.peek().k === 'FSTR') parts.push(this.next());
          if (parts.every(x => x.k === 'STR')) return { k: 'str', v: parts.map(x => x.v).join(''), line };
          return { k: 'fstr', parts: parts.map(x => (x.k === 'FSTR' ? parseFString(x.v, line) : [x.v])).flat(), line };
        }
        case 'NAME': return { k: 'name', id: p.v, line };
        case 'KW':
          if (p.v === 'True') return { k: 'const', v: true, line };
          if (p.v === 'False') return { k: 'const', v: false, line };
          if (p.v === 'None') return { k: 'const', v: null, line };
          break;
        case 'OP':
          if (p.v === '(') {
            if (this.eatOp(')')) return { k: 'tuple', items: [], line };
            const first = this.isOp('*') ? (this.next(), { k: 'star', e: this.orExpr(), line }) : this.expr();
            if (this.isKw('for')) { const c = this.comprehension('gen', first, null); this.expectOp(')'); return c; }
            if (this.isOp(')')) { this.next(); return first.k === 'star' ? { k: 'tuple', items: [first], line } : { ...first, paren: true }; }
            const items = [first];
            while (this.eatOp(',')) { if (this.isOp(')')) break; items.push(this.isOp('*') ? (this.next(), { k: 'star', e: this.orExpr(), line }) : this.expr()); }
            this.expectOp(')');
            return { k: 'tuple', items, line };
          }
          if (p.v === '[') {
            if (this.eatOp(']')) return { k: 'list', items: [], line };
            const first = this.isOp('*') ? (this.next(), { k: 'star', e: this.orExpr(), line }) : this.expr();
            if (this.isKw('for')) { const c = this.comprehension('list', first, null); this.expectOp(']'); return c; }
            const items = [first];
            while (this.eatOp(',')) { if (this.isOp(']')) break; items.push(this.isOp('*') ? (this.next(), { k: 'star', e: this.orExpr(), line }) : this.expr()); }
            this.expectOp(']');
            return { k: 'list', items, line };
          }
          if (p.v === '{') {
            if (this.eatOp('}')) return { k: 'dict', keys: [], vals: [], line };
            if (this.eatOp('**')) throw this.err('dict unpacking is not supported by this interpreter');
            const first = this.expr();
            if (this.eatOp(':')) {
              const v = this.expr();
              if (this.isKw('for')) { const c = this.comprehension('dict', first, v); this.expectOp('}'); return c; }
              const keys = [first], vals = [v];
              while (this.eatOp(',')) { if (this.isOp('}')) break; keys.push(this.expr()); this.expectOp(':'); vals.push(this.expr()); }
              this.expectOp('}');
              return { k: 'dict', keys, vals, line };
            }
            if (this.isKw('for')) { const c = this.comprehension('set', first, null); this.expectOp('}'); return c; }
            const items = [first];
            while (this.eatOp(',')) { if (this.isOp('}')) break; items.push(this.expr()); }
            this.expectOp('}');
            return { k: 'set', items, line };
          }
          if (p.v === '...') return { k: 'const', v: null, line };
      }
      this.i--;
      throw this.err();
    }
  }
  // f-string: returns a list of string pieces and { e, conv, spec } fields
  function parseFString(s, line) {
    const parts = []; let i = 0, lit = '';
    while (i < s.length) {
      const c = s[i];
      if (c === '\\' && (s[i + 1] === '{' || s[i + 1] === '}')) { lit += s[i + 1]; i += 2; continue; }
      if (c === '{' && s[i + 1] === '{') { lit += '{'; i += 2; continue; }
      if (c === '}' && s[i + 1] === '}') { lit += '}'; i += 2; continue; }
      if (c === '{') {
        if (lit) { parts.push(lit); lit = ''; }
        let depth = 1, j = i + 1, q = null;
        for (; j < s.length; j++) {
          const d = s[j];
          if (q) { if (d === q) q = null; continue; }
          if (d === '"' || d === "'") { q = d; continue; }
          if ('([{'.includes(d)) depth++;
          if (')]}'.includes(d)) { depth--; if (depth === 0) break; }
        }
        let inner = s.slice(i + 1, j);
        let spec = null, conv = null, eq = false;
        // split off !conv and :spec at depth 0
        let d = 0, cut = -1; q = null;
        for (let k = 0; k < inner.length; k++) {
          const ch = inner[k];
          if (q) { if (ch === q) q = null; continue; }
          if (ch === '"' || ch === "'") { q = ch; continue; }
          if ('([{'.includes(ch)) d++; else if (')]}'.includes(ch)) d--;
          else if (d === 0 && (ch === ':' || (ch === '!' && inner[k + 1] !== '='))) { cut = k; break; }
        }
        if (cut >= 0) {
          let rest = inner.slice(cut); inner = inner.slice(0, cut);
          if (rest[0] === '!') { conv = rest[1]; rest = rest.slice(2); }
          if (rest[0] === ':') spec = rest.slice(1);
        }
        if (/=\s*$/.test(inner) && !/[=!<>]=\s*$/.test(inner)) { eq = true; parts.push(inner); inner = inner.replace(/=\s*$/, ''); if (!conv && spec == null) conv = 'r'; }
        const toks = lex(inner.trim());
        const p = new Parser(toks);
        const e = p.exprList();
        parts.push({ e, conv, spec: spec != null ? parseFString(spec, line) : null, eq });
        i = j + 1; continue;
      }
      lit += c; i++;
    }
    if (lit) parts.push(lit);
    return parts;
  }

  /* ════════════════════════════════════════════════════════════════
     3. Objects
     ════════════════════════════════════════════════════════════════ */
  let OID = 0;
  let IT = null; // the running interpreter, for __hash__ calls from hashKey
  class PyObj { constructor(type) { this.type = type; this.oid = ++OID; } }
  function mkType(name, bases, opts = {}) {
    const t = new PyObj(null);
    t.name = name; t.bases = bases || []; t.dict = new Map(); t.builtin = opts.builtin !== false; t.isType = true;
    t.mro = [t].concat(...t.bases.map(b => b.mro)).filter((x, i, a) => a.indexOf(x) === i);
    return t;
  }
  const TYPE = mkType('type', []);
  TYPE.type = TYPE;
  const OBJECT = mkType('object', []);
  TYPE.bases = [OBJECT]; TYPE.mro = [TYPE, OBJECT]; OBJECT.type = TYPE;
  const T = {};
  for (const n of ['int', 'float', 'str', 'list', 'tuple', 'dict', 'set', 'NoneType', 'function', 'builtin_function_or_method', 'method', 'module', 'range', 'deque', 'dict_keys', 'dict_values', 'dict_items', 'map', 'filter', 'zip', 'enumerate', 'list_iterator', 'reversed', 'frozenset']) { T[n] = mkType(n, [OBJECT]); T[n].type = TYPE; }
  T.bool = mkType('bool', [T.int]); T.bool.type = TYPE;
  T.type = TYPE; T.object = OBJECT;
  // exceptions
  const EXC = {};
  const exc = (name, base) => { const t = mkType(name, [base]); t.type = TYPE; EXC[name] = t; return t; };
  exc('BaseException', OBJECT); exc('Exception', EXC.BaseException); exc('SystemExit', EXC.BaseException); exc('KeyboardInterrupt', EXC.BaseException);
  for (const [n, b] of [['ArithmeticError', 'Exception'], ['ZeroDivisionError', 'ArithmeticError'], ['OverflowError', 'ArithmeticError'], ['LookupError', 'Exception'],
    ['IndexError', 'LookupError'], ['KeyError', 'LookupError'], ['TypeError', 'Exception'], ['ValueError', 'Exception'], ['NameError', 'Exception'],
    ['UnboundLocalError', 'NameError'], ['AttributeError', 'Exception'], ['RuntimeError', 'Exception'], ['RecursionError', 'RuntimeError'],
    ['NotImplementedError', 'RuntimeError'], ['StopIteration', 'Exception'], ['AssertionError', 'Exception'], ['ImportError', 'Exception'],
    ['ModuleNotFoundError', 'ImportError'], ['EOFError', 'Exception'], ['OSError', 'Exception'], ['FileNotFoundError', 'OSError'], ['UnicodeError', 'ValueError']]) exc(n, EXC[b]);

  const NONE = new PyObj(T.NoneType); NONE.v = null;
  const TRUE = new PyObj(T.bool); TRUE.v = 1n;
  const FALSE = new PyObj(T.bool); FALSE.v = 0n;
  const SMALL = new Map();
  function int(v) {
    v = BigInt(v);
    if (v >= -5n && v <= 256n) { let o = SMALL.get(v); if (!o) { o = new PyObj(T.int); o.v = v; SMALL.set(v, o); } return o; }
    const o = new PyObj(T.int); o.v = v; return o;
  }
  const float = v => { const o = new PyObj(T.float); o.v = v; return o; };
  const str = v => { const o = new PyObj(T.str); o.v = v; return o; };
  const bool = b => (b ? TRUE : FALSE);
  const list = items => { const o = new PyObj(T.list); o.items = items; return o; };
  const tuple = items => { const o = new PyObj(T.tuple); o.items = items; return o; };
  const dict = () => { const o = new PyObj(T.dict); o.map = new Map(); return o; };
  const set = (t) => { const o = new PyObj(t || T.set); o.map = new Map(); return o; };
  const isInst = (o, t) => o.type.mro.includes(t);
  const isInt = o => o.type === T.int || o.type === T.bool;
  const isNum = o => isInt(o) || o.type === T.float;
  const isStr = o => o.type === T.str;
  const typeName = o => o.type.name;

  class PyExc extends Error { constructor(obj) { super(obj.args && obj.args[0] ? String(obj.args[0].v) : ''); this.obj = obj; } }
  function mkExc(name, msg) {
    const t = typeof name === 'string' ? EXC[name] : name;
    const o = new PyObj(t); o.dict = new Map(); o.args = msg == null ? [] : [str(msg)]; return o;
  }
  const raise = (name, msg) => { throw new PyExc(mkExc(name, msg)); };

  /* ── hashing and equality ── */
  function hashKey(o) {
    if (isInt(o)) return 'n' + o.v;
    if (o.type === T.float) return Number.isInteger(o.v) && Math.abs(o.v) < 2 ** 63 ? 'n' + BigInt(o.v) : 'f' + o.v;
    if (isStr(o)) return 's' + o.v;
    if (o === NONE) return 'None';
    if (o.type === T.tuple) return 't(' + o.items.map(hashKey).join(',') + ')';
    if (o.type === T.frozenset) return 'z{' + [...o.map.keys()].sort().join(',') + '}';
    if (o.type === T.list || o.type === T.dict || o.type === T.set) raise('TypeError', `unhashable type: '${o.type.name}'`);
    if (o.isType || o.type === T.function || o.type === T.builtin_function_or_method || o.type === T.module) return 'o' + o.oid;
    if (!o.type.builtin) {
      // the first class in the MRO that defines __eq__ or __hash__ decides, as in CPython
      for (const c of o.type.mro) {
        if (c.builtin) break;
        if (c.dict.has('__hash__')) { const h = c.dict.get('__hash__'); if (h === NONE) break; const r = IT.callObj(h, [o], {}); return 'u' + r.v; }
        if (c.dict.has('__eq__')) raise('TypeError', `unhashable type: '${o.type.name}'`);
      }
      if (o.type.mro.some(c => !c.builtin && c.dict.get('__hash__') === NONE)) raise('TypeError', `unhashable type: '${o.type.name}'`);
    }
    return 'o' + o.oid;
  }
  function lookupType(t, name) { for (const c of t.mro) if (c.dict && c.dict.has(name)) return c.dict.get(name); return null; }

  /* ── number formatting (CPython repr) ── */
  function floatRepr(x) {
    if (Number.isNaN(x)) return 'nan';
    if (!Number.isFinite(x)) return x > 0 ? 'inf' : '-inf';
    if (x === 0) return Object.is(x, -0) ? '-0.0' : '0.0';
    const e = x.toExponential(); // shortest round-trip digits
    const m = /^(-?)(\d)(?:\.(\d+))?e([-+]\d+)$/.exec(e);
    const sign = m[1], digits = m[2] + (m[3] || ''), exp = +m[4];
    if (exp >= -4 && exp < 16) {
      // fixed notation
      let s;
      if (exp >= 0) {
        const intPart = digits.slice(0, exp + 1).padEnd(exp + 1, '0');
        const frac = digits.slice(exp + 1);
        s = intPart + '.' + (frac || '0');
      } else s = '0.' + '0'.repeat(-exp - 1) + digits;
      return sign + s;
    }
    const mant = digits.length > 1 ? digits[0] + '.' + digits.slice(1) : digits[0];
    return sign + mant + 'e' + (exp < 0 ? '-' : '+') + String(Math.abs(exp)).padStart(2, '0');
  }
  function strRepr(s) {
    const q = s.includes("'") && !s.includes('"') ? '"' : "'";
    let out = q;
    for (const ch of s) {
      const c = ch.codePointAt(0);
      if (ch === q || ch === '\\') out += '\\' + ch;
      else if (ch === '\n') out += '\\n'; else if (ch === '\t') out += '\\t'; else if (ch === '\r') out += '\\r';
      else if (c < 32 || c === 127) out += '\\x' + c.toString(16).padStart(2, '0');
      else out += ch;
    }
    return out + q;
  }
  // exact decimal of a double (for %-style and format() with a precision)
  function exactDec(x) {
    const buf = new DataView(new ArrayBuffer(8)); buf.setFloat64(0, x);
    const hi = buf.getUint32(0), lo = buf.getUint32(4);
    const e = (hi >>> 20) & 0x7ff;
    let m = (BigInt(hi & 0xfffff) << 32n) | BigInt(lo);
    let ex; if (e === 0) ex = -1074; else { m |= 1n << 52n; ex = e - 1075; }
    if (m === 0n) return ['0', 1];
    if (ex >= 0) { const d = (m << BigInt(ex)).toString(); return [d, d.length]; }
    const d = (m * 5n ** BigInt(-ex)).toString(); return [d, d.length + ex];
  }
  function roundDigits(digits, keep) {
    if (keep < 0) return ['', 0];
    if (digits.length <= keep) return [digits.padEnd(keep, '0'), 0];
    const head = digits.slice(0, keep), rest = digits.slice(keep);
    const tie = rest[0] === '5' && !/[1-9]/.test(rest.slice(1));
    const up = rest[0] > '5' || (rest[0] === '5' && !tie) || (tie && head.length > 0 && +head[head.length - 1] % 2 === 1);
    if (!up) return [head, 0];
    const n = (BigInt(head || '0') + 1n).toString();
    if (!head.length) return [n, 1];
    if (n.length > head.length) return [n.slice(0, head.length), 1];
    return [n.padStart(head.length, '0'), 0];
  }
  function fmtFixed(x, prec) {
    const [d, p] = exactDec(Math.abs(x));
    const digits = p > 0 ? d : '0'.repeat(-p) + d, point = p > 0 ? p : 0;
    const [r, sh] = roundDigits(digits, point + prec);
    let ip, fr;
    if (sh) { const all = r + '0'; ip = all.slice(0, point + 1); fr = all.slice(point + 1, point + 1 + prec); }
    else { ip = r.slice(0, point) || '0'; fr = r.slice(point); }
    ip = ip.replace(/^0+(?=\d)/, '');
    return ip + (prec > 0 ? '.' + fr : '');
  }
  function fmtExp(x, prec) {
    if (x === 0) return '0' + (prec ? '.' + '0'.repeat(prec) : '') + 'e+00';
    const [d, p] = exactDec(Math.abs(x));
    const [r, sh] = roundDigits(d, prec + 1);
    const exp = p - 1 + sh;
    return r[0] + (prec ? '.' + r.slice(1, prec + 1) : '') + 'e' + (exp < 0 ? '-' : '+') + String(Math.abs(exp)).padStart(2, '0');
  }
  function fmtGeneral(x, prec, alt) {
    const P = prec === 0 ? 1 : prec;
    let X = 0;
    if (x !== 0) { const [d, p] = exactDec(Math.abs(x)); const [, sh] = roundDigits(d, P); X = p - 1 + sh; }
    let s = P > X && X >= -4 ? fmtFixed(x, P - 1 - X) : fmtExp(x, P - 1);
    if (!alt) { if (/e/.test(s)) s = s.replace(/\.?0+(?=e)/, ''); else if (s.includes('.')) s = s.replace(/\.?0+$/, ''); }
    return s;
  }
  // format(value, spec): the format-spec mini-language, enough for f-strings and str.format
  function formatSpec(it, o, spec) {
    if (!spec) return it.str(o);
    const m = /^(?:(.)?([<>=^]))?([-+ ])?(#)?(0)?(\d+)?([,_])?(?:\.(\d+))?([bcdeEfFgGnosxX%])?$/s.exec(spec);
    if (!m) raise('ValueError', `Invalid format specifier '${spec}' for object of type '${typeName(o)}'`);
    let [, fill, align, sign, alt, zero, width, group, prec, type] = m;
    width = width ? +width : 0; prec = prec != null ? +prec : null;
    if (zero && !align) { fill = '0'; align = '='; }
    fill = fill || ' ';
    let body, neg = false, prefix = '';
    const numeric = isNum(o);
    if (isStr(o)) {
      if (type && type !== 's') raise('ValueError', `Unknown format code '${type}' for object of type 'str'`);
      body = prec != null ? o.v.slice(0, prec) : o.v;
      align = align || '<';
    } else if (numeric) {
      let x = o.type === T.float ? o.v : o.v;
      let noType = false;
      if (!type) { noType = o.type === T.float && prec != null; type = o.type === T.float ? (prec != null ? 'g' : '') : 'd'; }
      if (isInt(o) && 'eEfFgG%'.includes(type)) x = Number(o.v);
      if (o.type === T.float && 'dxXob'.includes(type)) raise('ValueError', `Unknown format code '${type}' for object of type 'float'`);
      if (typeof x === 'bigint') { neg = x < 0n; x = neg ? -x : x; }
      else { neg = x < 0 || Object.is(x, -0); x = Math.abs(x); }
      switch (type) {
        case 'd': case 'n': body = x.toString(); break;
        case 'x': body = x.toString(16); if (alt) prefix = '0x'; break;
        case 'X': body = x.toString(16).toUpperCase(); if (alt) prefix = '0X'; break;
        case 'o': body = x.toString(8); if (alt) prefix = '0o'; break;
        case 'b': body = x.toString(2); if (alt) prefix = '0b'; break;
        case 'c': body = String.fromCodePoint(Number(x)); break;
        case 'f': case 'F': body = fmtFixed(x, prec == null ? 6 : prec); break;
        case 'e': case 'E': body = fmtExp(x, prec == null ? 6 : prec); if (type === 'E') body = body.toUpperCase(); break;
        case 'g': case 'G': body = fmtGeneral(x, prec == null ? 6 : prec, !!alt); if (noType && /^\d+$/.test(body)) body += '.0'; break;
        case '%': body = fmtFixed(x * 100, prec == null ? 6 : prec) + '%'; break;
        case '': body = floatRepr(x); break;
      }
      if (group) {
        const [ip, rest] = body.includes('.') ? [body.slice(0, body.indexOf('.')), body.slice(body.indexOf('.'))] : [body.replace(/%$/, ''), body.endsWith('%') ? '%' : ''];
        if (/^\d+$/.test(ip)) body = ip.replace(/\B(?=(\d{3})+(?!\d))/g, group) + rest;
      }
      align = align || '>';
    } else { body = it.str(o); align = align || '<'; }
    const signStr = numeric ? (neg ? '-' : sign === '+' ? '+' : sign === ' ' ? ' ' : '') : '';
    const total = signStr.length + prefix.length + body.length;
    if (total >= width) return signStr + prefix + body;
    const pad = fill.repeat(width - total);
    if (align === '<') return signStr + prefix + body + pad;
    if (align === '^') { const l = Math.floor((width - total) / 2); return fill.repeat(l) + signStr + prefix + body + fill.repeat(width - total - l); }
    if (align === '=') return signStr + prefix + pad + body;
    return pad + signStr + prefix + body;
  }

  /* ════════════════════════════════════════════════════════════════
     4. Interpreter
     ════════════════════════════════════════════════════════════════ */
  const BREAK = { sig: 'break' }, CONTINUE = { sig: 'continue' };
  class Return { constructor(v) { this.v = v; } }
  class StepLimit extends Error {}
  class Exit extends Error { constructor(code) { super('exit'); this.code = code; } }

  // names assigned anywhere in a function body are local to it (unless declared global/nonlocal)
  function localNames(body, params) {
    const assigned = new Set(params), glob = new Set(), nonl = new Set();
    const target = t => { if (!t) return; if (t.k === 'name') assigned.add(t.id); else if (t.k === 'tuple' || t.k === 'list') t.items.forEach(target); else if (t.k === 'star') target(t.e); };
    const walk = stmts => {
      for (const s of stmts || []) {
        switch (s.k) {
          case 'assign': s.targets.forEach(target); break;
          case 'augassign': target(s.target); break;
          case 'for': target(s.target); walk(s.body); walk(s.orelse); break;
          case 'while': walk(s.body); walk(s.orelse); break;
          case 'if': walk(s.body); walk(s.orelse); break;
          case 'try': walk(s.body); s.handlers.forEach(h => { if (h.name) assigned.add(h.name); walk(h.body); }); walk(s.orelse); walk(s.fin); break;
          case 'def': case 'class': assigned.add(s.name); break;
          case 'import': s.names.forEach(n => assigned.add(n.as || n.mod.split('.')[0])); break;
          case 'fromimport': s.names.forEach(n => assigned.add(n.as || n.name)); break;
          case 'global': s.names.forEach(n => glob.add(n)); break;
          case 'nonlocal': s.names.forEach(n => nonl.add(n)); break;
          case 'del': s.targets.forEach(target); break;
          case 'expr': walkExpr(s.e); break;
        }
      }
    };
    const walkExpr = e => { if (e && e.k === 'walrus') target(e.target); };
    walk(body);
    for (const g of glob) assigned.delete(g);
    for (const g of nonl) assigned.delete(g);
    return { locals: assigned, globals: glob, nonlocals: nonl };
  }

  class Interp {
    constructor(opts) {
      this.opts = opts;
      this.out = ''; this.stdin = (opts.stdin || '').split('\n'); this.inPos = 0;
      this.trace = []; this.steps = 0; this.maxSteps = opts.maxSteps || 5000;
      this.frames = []; this.modules = new Map(); this.files = opts.files || {};
      this.alive = new Set(); // heap objects that the view tracks (containers, instances, functions, classes)
      this.freed = new Set();
      this.randState = 12345;
      this.builtins = this.makeBuiltins();
    }
    track(o) { this.alive.add(o); return o; }
    // objects made during a statement that is still running may sit in the interpreter's own
    // temporaries (half-built lists, evaluated arguments), so they are not freed until it ends
    stmtStart() { const f = this.frames[this.frames.length - 1]; if (f) f.stmtOid = OID; }
    mkList(items) { return this.track(list(items)); }
    mkTuple(items) { return this.track(tuple(items)); }
    mkDict() { return this.track(dict()); }
    mkSet(t) { return this.track(set(t)); }

    /* ── snapshots ── */
    snap(line, note) {
      if (++this.steps > this.maxSteps) throw new StepLimit();
      this.collectRefcount();
      const f = this.frames[this.frames.length - 1];
      this.trace.push({ line, file: f ? f.file : 0, note, outLen: this.out.length, ...this.view() });
    }
    // roots: every frame's variables and every module's globals
    roots() {
      const r = [], seen = new Set();
      const add = m => { if (seen.has(m)) return; seen.add(m); for (const v of m.values()) r.push(v); };
      for (const f of this.frames) { add(f.locals); if (f.extra) r.push(...f.extra); if (f.temps) r.push(...f.temps); }
      for (const m of this.modules.values()) add(m.dict);
      return r;
    }
    children(o) {
      const out = [];
      if (o.items) out.push(...o.items);
      if (o.map) for (const [, e] of o.map) { if (e && e.k) { out.push(e.k); if (e.v) out.push(e.v); } else out.push(e); }
      if (o.dict && !o.builtinModule) for (const v of o.dict.values()) out.push(v);
      if (o.defaults) out.push(...o.defaults.filter(Boolean));
      if (o.closure) for (const sc of o.closure) for (const v of sc.values()) out.push(v);
      if (o.self) { out.push(o.self); out.push(o.func); }
      if (o.isType && !o.builtin) out.push(...o.bases.filter(b => !b.builtin));
      if (!o.isType && o.type && !o.type.builtin) out.push(o.type);
      if (o.module && o.type === T.function) { /* globals of the defining module: not an owning reference */ }
      if (o.src) out.push(o.src);
      return out;
    }
    // reference counting: free every tracked object with no reference from a root or a live object
    collectRefcount() {
      const oldest = Math.min(...this.frames.map(f => (f.stmtOid == null ? Infinity : f.stmtOid)));
      for (;;) {
        const counts = new Map();
        for (const o of this.alive) counts.set(o, 0);
        // an untracked holder (a bound method, an iterator, a dict view) passes its references on
        const bump = (x, seen) => {
          if (!x || typeof x !== 'object') return;
          if (counts.has(x)) { counts.set(x, counts.get(x) + 1); return; }
          if (seen && seen.has(x)) return;
          const through = [];
          if (x.type === T.method) through.push(x.self, x.func);
          if (x.src) through.push(x.src);
          if (x.live) through.push(x.live);
          if (x.arr) through.push(...x.arr);
          if (x.superOf) through.push(x.superOf.self);
          if (x.userIter) through.push(x.userIter);
          if (x.getitemOf) through.push(x.getitemOf);
          if (through.length) { const s2 = seen || new Set(); s2.add(x); for (const t of through) bump(t, s2); }
        };
        for (const v of this.roots()) bump(v);
        for (const o of this.alive) for (const c of this.children(o)) bump(c);
        let freed = 0;
        for (const [o, n] of counts) if (n === 0 && !(o.oid > oldest)) { this.alive.delete(o); this.freed.add(o); freed++; }
        this.refcounts = counts;
        if (!freed) return;
      }
    }
    gcCollect() {
      const reach = new Set();
      const stack = this.roots().slice();
      while (stack.length) { const o = stack.pop(); if (!o || reach.has(o)) continue; reach.add(o); stack.push(...this.children(o)); }
      let n = 0;
      for (const o of [...this.alive]) if (!reach.has(o)) { this.alive.delete(o); this.freed.add(o); n++; }
      this.collectRefcount();
      return n;
    }
    // what the stepper shows: frames with names bound to values or references, and the objects reached
    view() {
      const objs = [], seen = new Map();
      const ref = o => {
        if (!this.alive.has(o)) return null;
        if (!seen.has(o)) { seen.set(o, objs.length); objs.push(o); }
        return o.oid;
      };
      const val = o => (this.alive.has(o) ? { ref: ref(o) } : { v: this.shortRepr(o) });
      const frames = this.frames.filter(f => !f.hidden).map(f => {
        const vars = [...f.locals].filter(([n, v]) => !(f.isModule && ((v.type === T.module && v.builtinModule) || /^__\w+__$/.test(n)))).map(([n, v]) => ({ name: n, ...val(v) }));
        if (f.extra && f.extra[0]) vars.push({ name: 'return value', ret: true, ...val(f.extra[0]) });
        return { name: f.name, vars };
      });
      // breadth-first over the objects so the listing follows the arrows
      const views = [];
      for (let k = 0; k < objs.length; k++) {
        const o = objs[k];
        views.push(this.objView(o, val));
      }
      const oldest = Math.min(...this.frames.map(f => (f.stmtOid == null ? Infinity : f.stmtOid)));
      const unreachable = [...this.alive].filter(o => !seen.has(o) && !o.hidden && !(o.oid > oldest));
      for (const o of unreachable) { seen.set(o, objs.length); objs.push(o); }
      for (let k = views.length; k < objs.length; k++) views.push({ ...this.objView(objs[k], val), unreachable: true });
      return { frames, objs: views };
    }
    objView(o, val) {
      const rc = this.refcounts ? this.refcounts.get(o) || 0 : 0;
      const base = { id: o.oid, rc, type: o.isType ? 'class' : o.type.name };
      if (o.type === T.list || o.type === T.tuple || o.type === T.deque) return { ...base, kind: 'seq', items: o.items.map(val) };
      if (o.type === T.dict) return { ...base, kind: 'map', items: [...o.map.values()].map(e => [val(e.k), val(e.v)]) };
      if (o.type === T.set || o.type === T.frozenset) return { ...base, kind: 'set', items: this.setOrder(o).map(val) };
      if (o.type === T.function) return { ...base, kind: 'func', label: `${o.name}(${o.params.map(p => (p.kind === 'varargs' ? '*' : p.kind === 'kwargs' ? '**' : '') + p.name).join(', ')})` };
      if (o.type === T.method) return { ...base, kind: 'attrs', label: 'bound method', items: [['__self__', val(o.self)], ['__func__', val(o.func)]] };
      if (o.isType) return { ...base, kind: 'attrs', label: `class ${o.name}` + (o.bases.length && o.bases[0] !== OBJECT ? `(${o.bases.map(b => b.name).join(', ')})` : ''), items: [...o.dict].filter(([n]) => !n.startsWith('__') || n === '__init__' || /^__\w+__$/.test(n) && o.dict.get(n).type === T.function).map(([n, v]) => [n, val(v)]) };
      if (o.type === T.module) return { ...base, kind: 'attrs', label: `module ${o.name}`, items: [...o.dict].filter(([n]) => !n.startsWith('__')).map(([n, v]) => [n, val(v)]) };
      if (o.dict) return { ...base, kind: 'attrs', label: `${o.type.name} instance`, items: [...o.dict].map(([n, v]) => [n, val(v)]) };
      return { ...base, kind: 'other', label: this.shortRepr(o) };
    }
    shortRepr(o) { try { const s = this.repr(o); return s.length > 60 ? s.slice(0, 57) + '…' : s; } catch (_) { return '<' + o.type.name + '>'; } }

    /* ── printing ── */
    str(o) {
      if (isStr(o)) return o.v;
      const m = !o.isType && !o.type.builtin && lookupType(o.type, '__str__');
      if (m) { const r = this.callObj(m, [o], {}); if (!isStr(r)) raise('TypeError', '__str__ returned non-string (type ' + typeName(r) + ')'); return r.v; }
      if (isInst(o, EXC.BaseException) && !o.isType) return o.args.length === 1 ? (isInst(o, EXC.KeyError) ? this.repr(o.args[0]) : this.str(o.args[0])) : o.args.length ? this.repr(this.mkTuple(o.args)) : '';
      return this.repr(o);
    }
    repr(o, depth = 0) {
      if (depth > 40) return '...';
      if (o === NONE) return 'None';
      if (o === TRUE) return 'True';
      if (o === FALSE) return 'False';
      if (o.type === T.int) return o.v.toString();
      if (o.type === T.float) return floatRepr(o.v);
      if (isStr(o)) return strRepr(o.v);
      if (o.reprBusy) return o.type === T.list ? '[...]' : o.type === T.dict ? '{...}' : '...';
      o.reprBusy = true;
      try {
        if (o.type === T.list) return '[' + o.items.map(x => this.repr(x, depth + 1)).join(', ') + ']';
        if (o.type === T.tuple) return '(' + o.items.map(x => this.repr(x, depth + 1)).join(', ') + (o.items.length === 1 ? ',' : '') + ')';
        if (o.type === T.dict) return '{' + [...o.map.values()].map(e => this.repr(e.k, depth + 1) + ': ' + this.repr(e.v, depth + 1)).join(', ') + '}';
        if (o.type === T.set) return o.map.size ? '{' + this.setOrder(o).map(x => this.repr(x, depth + 1)).join(', ') + '}' : 'set()';
        if (o.type === T.frozenset) return 'frozenset(' + (o.map.size ? '{' + this.setOrder(o).map(x => this.repr(x, depth + 1)).join(', ') + '}' : '') + ')';
        if (o.type === T.deque) return 'deque([' + o.items.map(x => this.repr(x, depth + 1)).join(', ') + '])';
        if (o.type === T.range) return `range(${o.start}, ${o.stop}${o.step !== 1n ? ', ' + o.step : ''})`;
        if (o.type === T.dict_keys) return 'dict_keys([' + [...o.src.map.values()].map(e => this.repr(e.k)).join(', ') + '])';
        if (o.type === T.dict_values) return 'dict_values([' + [...o.src.map.values()].map(e => this.repr(e.v)).join(', ') + '])';
        if (o.type === T.dict_items) return 'dict_items([' + [...o.src.map.values()].map(e => '(' + this.repr(e.k) + ', ' + this.repr(e.v) + ')').join(', ') + '])';
        if (o.isType) return o.builtin ? `<class '${o.name}'>` : `<class '__main__.${o.name}'>`;
        if (o.type === T.function) return `<function ${o.qualname || o.name} at ${this.addr(o)}>`;
        if (o.type === T.builtin_function_or_method) return `<built-in function ${o.name}>`;
        if (o.type === T.method) return `<bound method ${o.func.qualname || o.func.name} of ${this.repr(o.self)}>`;
        if (o.type === T.module) return `<module '${o.name}'>`;
        if (!o.type.builtin) {
          const m = lookupType(o.type, '__repr__');
          if (m) { const r = this.callObj(m, [o], {}); return r.v; }
        }
        if (isInst(o, EXC.BaseException)) return `${o.type.name}(${o.args.map(a => this.repr(a)).join(', ')})`;
        if ([T.map, T.filter, T.zip, T.enumerate, T.list_iterator, T.reversed].includes(o.type)) return `<${o.type.name} object at ${this.addr(o)}>`;
        return `<__main__.${o.type.name} object at ${this.addr(o)}>`;
      } finally { o.reprBusy = false; }
    }
    addr(o) { return '0x7f' + (0x3a2c000000 + o.oid * 48).toString(16); }
    // CPython's small-int set order: by value modulo the table size, for non-negative ints
    setOrder(o) {
      const els = [...o.map.values()];
      if (els.length && els.every(e => e.type === T.int && e.v >= 0n && e.v < 1n << 30n)) {
        let size = 8; while (els.length * 5 >= size * 3) size *= 4;
        const slots = new Array(size).fill(null);
        for (const e of els) { let i = Number(e.v % BigInt(size)); while (slots[i]) i = (i + 1) % size; slots[i] = e; }
        return slots.filter(Boolean);
      }
      return els;
    }
    emit(s) { this.out += s; }

    /* ── attribute access ── */
    getattr(o, name, line) {
      // instance attributes, then the class (functions become bound methods)
      if (o.isType) {
        for (const c of o.mro) if (c.dict.has(name)) return c.dict.get(name);
        const sample = { str: () => str(''), list: () => list([]), dict: () => dict(), set: () => set(), tuple: () => tuple([]), int: () => int(0), float: () => float(0) }[o.name];
        if (o.builtin && sample && this.builtinMethod(sample(), name)) return bf(name, function (args, kw) { if (!args.length || !isInst(args[0], o)) raise('TypeError', `descriptor '${name}' for '${o.name}' objects doesn't apply to a '${args.length ? typeName(args[0]) : 'NoneType'}' object`); return this.callObj(this.builtinMethod(args[0], name), args.slice(1), kw); });
        if (name === '__name__') return str(o.name);
        if (name === '__mro__') return this.mkTuple(o.mro);
        if (name === '__dict__') { const d = this.mkDict(); for (const [k, v] of o.dict) this.dictSet(d, str(k), v); return d; }
        if (name === '__doc__') return o.doc != null ? str(o.doc) : NONE;
        raise('AttributeError', `type object '${o.name}' has no attribute '${name}'`);
      }
      if (o.type === T.module) {
        if (o.dict.has(name)) return o.dict.get(name);
        raise('AttributeError', `module '${o.name}' has no attribute '${name}'`);
      }
      if (o.dict && o.dict.has(name)) return o.dict.get(name);
      if (name === '__class__') return o.type;
      if (name === '__dict__' && o.dict) { const d = this.mkDict(); for (const [k, v] of o.dict) this.dictSet(d, str(k), v); return d; }
      if (name === '__doc__' && o.type === T.function) return o.doc != null ? str(o.doc) : NONE;
      if (name === '__name__' && (o.type === T.function || o.type === T.builtin_function_or_method)) return str(o.name);
      if (name === 'args' && isInst(o, EXC.BaseException)) return this.mkTuple(o.args);
      const m = lookupType(o.type, name);
      if (m) {
        if (m.type === T.function || m.type === T.builtin_function_or_method) {
          const bm = new PyObj(T.method); bm.self = o; bm.func = m; return this.track(bm);
        }
        return m;
      }
      const bi = this.builtinMethod(o, name);
      if (bi) return bi;
      raise('AttributeError', `'${o.type.name}' object has no attribute '${name}'`);
    }
    setattr(o, name, v) {
      if (o.isType) { if (o.builtin) raise('TypeError', `cannot set '${name}' attribute of immutable type '${o.name}'`); o.dict.set(name, v); return; }
      if (o.type === T.module) { o.dict.set(name, v); return; }
      if (!o.dict) raise('AttributeError', `'${o.type.name}' object has no attribute '${name}'`);
      o.dict.set(name, v);
    }

    /* ── calls ── */
    callObj(f, args, kwargs, line) {
      if (f.type === T.method) return this.callObj(f.func, [f.self, ...args], kwargs, line);
      if (f.type === T.builtin_function_or_method) return f.fn.call(this, args, kwargs, line);
      if (f.type === T.function) return this.callFunction(f, args, kwargs, line);
      if (f.isType) return this.construct(f, args, kwargs, line);
      const m = !f.type.builtin && lookupType(f.type, '__call__');
      if (m) return this.callObj(m, [f, ...args], kwargs, line);
      raise('TypeError', `'${f.type.name}' object is not callable`);
    }
    bindArgs(f, args, kwargs) {
      const loc = new Map();
      const ps = f.params;
      let ai = 0;
      const extra = [];
      const kw = new Map(Object.entries(kwargs));
      let kwargsParam = null;
      for (let k = 0; k < ps.length; k++) {
        const p = ps[k];
        if (p.kind === 'pos') {
          if (ai < args.length) { if (kw.has(p.name)) raise('TypeError', `${f.name}() got multiple values for argument '${p.name}'`); loc.set(p.name, args[ai++]); }
          else if (kw.has(p.name)) { loc.set(p.name, kw.get(p.name)); kw.delete(p.name); }
          else if (f.defaults[k]) loc.set(p.name, f.defaults[k]);
          else { const missing = ps.slice(k).filter((q, j) => q.kind === 'pos' && !f.defaults[k + j] && !kw.has(q.name)).map(q => `'${q.name}'`); raise('TypeError', `${f.name}() missing ${missing.length} required positional argument${missing.length > 1 ? 's' : ''}: ${missing.length > 1 ? missing.slice(0, -1).join(', ') + ' and ' + missing[missing.length - 1] : missing[0]}`); }
        } else if (p.kind === 'varargs') { loc.set(p.name, this.mkTuple(args.slice(ai))); ai = args.length; }
        else if (p.kind === 'kwonly') {
          if (kw.has(p.name)) { loc.set(p.name, kw.get(p.name)); kw.delete(p.name); }
          else if (f.defaults[k]) loc.set(p.name, f.defaults[k]);
          else raise('TypeError', `${f.name}() missing 1 required keyword-only argument: '${p.name}'`);
        } else if (p.kind === 'kwargs') kwargsParam = p.name;
      }
      if (ai < args.length) { const npos = ps.filter(p => p.kind === 'pos').length; raise('TypeError', `${f.name}() takes ${npos} positional argument${npos === 1 ? '' : 's'} but ${args.length} ${args.length === 1 ? 'was' : 'were'} given`); }
      if (kwargsParam) { const d = this.mkDict(); for (const [k, v] of kw) this.dictSet(d, str(k), v); loc.set(kwargsParam, d); }
      else if (kw.size) { const k0 = [...kw.keys()][0]; raise('TypeError', `${f.name}() got an unexpected keyword argument '${k0}'`); }
      void extra;
      return loc;
    }
    callFunction(f, args, kwargs, line) {
      if (this.frames.length > 200) raise('RecursionError', 'maximum recursion depth exceeded');
      const loc = this.bindArgs(f, args, kwargs);
      const frame = { name: f.name, fn: f, locals: loc, scope: f.scope, closure: f.closure, globals: f.globals, file: f.file, line, cls: f.cls };
      this.frames.push(frame);
      let ret = NONE;
      try {
        if (f.lambda) { this.snap(f.line, 'call'); ret = this.eval(f.body); }
        else { this.execBlock(f.body); }
      } catch (e) {
        if (e instanceof Return) ret = e.v;
        else {
          // record where it happened (innermost first), then leave the frame
          if ((e instanceof PyExc) && !e.where) { e.where = { line: this.curLine, file: this.frame().file }; e.pyStack = this.frames.filter(x => !x.hidden).map(x => ({ name: x.isModule ? '<module>' : x.name, file: x.file })); }
          while (this.frames.length && this.frames[this.frames.length - 1] !== frame) this.frames.pop();
          this.frames.pop();
          throw e;
        }
      }
      frame.extra = [ret];
      this.snap(f.lambda ? f.line : f.endLine, 'return');
      this.frames.pop();
      return ret;
    }
    construct(cls, args, kwargs, line) {
      if (cls.builtin) {
        const ctor = this.builtins.get(cls.name);
        if (ctor && !isInst(cls, TYPE) === false && ctor.type === T.builtin_function_or_method) return ctor.fn.call(this, args, kwargs, line);
        if (cls.mro.includes(EXC.BaseException)) { const o = new PyObj(cls); o.dict = new Map(); o.args = args; this.track(o); return o; }
        if (cls === OBJECT) { const o = new PyObj(OBJECT); return o; }
        raise('TypeError', `cannot create '${cls.name}' instances`);
      }
      const o = new PyObj(cls);
      o.dict = new Map();
      if (cls.mro.includes(EXC.BaseException)) o.args = args;
      this.track(o);
      const init = lookupType(cls, '__init__');
      if (init && init.type === T.function) {
        const r = this.callFunction(init, [o, ...args], kwargs, line);
        if (r !== NONE) raise('TypeError', "__init__() should return None, not '" + typeName(r) + "'");
      } else if (args.length && !cls.mro.includes(EXC.BaseException)) raise('TypeError', `${cls.name}() takes no arguments`);
      return o;
    }

    /* ── names ── */
    lookup(name, line) {
      const f = this.frame();
      if (f.scope && f.scope.locals.has(name)) {
        if (f.locals.has(name)) return f.locals.get(name);
        raise('UnboundLocalError', `cannot access local variable '${name}' where it is not associated with a value`);
      }
      if (f.isClassBody && f.locals.has(name)) return f.locals.get(name);
      if (f.closure) for (let k = f.closure.length - 1; k >= 0; k--) if (f.closure[k].has(name)) return f.closure[k].get(name);
      if (f.globals.has(name)) return f.globals.get(name);
      if (this.builtins.has(name)) return this.builtins.get(name);
      raise('NameError', `name '${name}' is not defined`);
    }
    frame() { return this.frames[this.frames.length - 1]; }
    bind(name, v) {
      const f = this.frame();
      if (f.scope && f.scope.globals.has(name)) { f.globals.set(name, v); return; }
      if (f.scope && f.scope.nonlocals.has(name)) {
        for (let k = f.closure.length - 1; k >= 0; k--) if (f.closure[k].has(name)) { f.closure[k].set(name, v); return; }
        raise('SyntaxError', `no binding for nonlocal '${name}' found`);
      }
      f.locals.set(name, v);
    }
    unbind(name) {
      const f = this.frame();
      const m = f.scope && f.scope.globals.has(name) ? f.globals : f.locals;
      if (!m.has(name)) raise('NameError', `name '${name}' is not defined`);
      m.delete(name);
    }

    /* ── statements ── */
    execBlock(stmts) { for (const s of stmts) this.exec(s); }
    exec(s) {
      this.curLine = s.line;
      if (s.k !== 'if' && s.k !== 'while' && s.k !== 'for' && s.k !== 'try' && s.k !== 'class') this.stmtStart();
      switch (s.k) {
        case 'expr': this.snap(s.line); this.eval(s.e); return;
        case 'assign': { this.snap(s.line); const v = this.eval(s.value); for (const t of s.targets) this.assign(t, v); return; }
        case 'augassign': {
          this.snap(s.line);
          const t = s.target;
          if (t.k === 'name') { this.bind(t.id, this.binop(s.op, this.lookup(t.id, s.line), this.eval(s.value), true)); return; }
          if (t.k === 'attr') { const o = this.eval(t.a); const cur = this.getattr(o, t.name); this.setattr(o, t.name, this.binop(s.op, cur, this.eval(s.value), true)); return; }
          if (t.k === 'sub') { const o = this.eval(t.a); const i = this.eval(t.i); const cur = this.getitem(o, i); this.setitem(o, i, this.binop(s.op, cur, this.eval(s.value), true)); return; }
          return;
        }
        case 'pass': this.snap(s.line); return;
        case 'if': this.snap(s.line); if (this.truthy(this.eval(s.c))) this.execBlock(s.body); else if (s.orelse) this.execBlock(s.orelse); return;
        case 'while': {
          for (;;) {
            this.snap(s.line);
            if (!this.truthy(this.eval(s.c))) { if (s.orelse) this.execBlock(s.orelse); return; }
            try { this.execBlock(s.body); } catch (e) { if (e === BREAK) return; if (e !== CONTINUE) throw e; }
          }
        }
        case 'for': {
          this.snap(s.line);
          const it = this.iter(this.eval(s.iter));
          const fr = this.frame(); (fr.temps = fr.temps || []).push(it); // the loop holds its iterable
          try {
            for (;;) {
              const x = this.next(it);
              if (x === undefined) { if (s.orelse) this.execBlock(s.orelse); return; }
              this.assign(s.target, x);
              try { this.execBlock(s.body); } catch (e) { if (e === BREAK) return; if (e !== CONTINUE) throw e; }
              this.snap(s.line, 'loop');
            }
          } finally { fr.temps.pop(); }
        }
        case 'break': this.snap(s.line); throw BREAK;
        case 'continue': this.snap(s.line); throw CONTINUE;
        case 'return': { this.snap(s.line); throw new Return(s.e ? this.eval(s.e) : NONE); }
        case 'def': { this.snap(s.line); this.bind(s.name, this.makeFunction(s)); return; }
        case 'class': return this.execClass(s);
        case 'global': case 'nonlocal': this.snap(s.line); return;
        case 'del': {
          this.snap(s.line);
          for (const t of s.targets) {
            if (t.k === 'name') this.unbind(t.id);
            else if (t.k === 'sub') this.delitem(this.eval(t.a), this.eval(t.i));
            else if (t.k === 'attr') { const o = this.eval(t.a); if (!o.dict || !o.dict.has(t.name)) raise('AttributeError', `'${o.type.name}' object has no attribute '${t.name}'`); o.dict.delete(t.name); }
          }
          return;
        }
        case 'raise': {
          this.snap(s.line);
          if (!s.e) { if (this.handling) throw this.handling; raise('RuntimeError', 'No active exception to reraise'); }
          let v = this.eval(s.e);
          if (v.isType) v = this.construct(v, [], {}, s.line);
          if (!isInst(v, EXC.BaseException)) raise('TypeError', 'exceptions must derive from BaseException');
          throw new PyExc(v);
        }
        case 'assert': this.snap(s.line); if (!this.truthy(this.eval(s.c))) throw new PyExc(s.msg ? this.construct(EXC.AssertionError, [this.eval(s.msg)], {}) : mkExc('AssertionError')); return;
        case 'try': return this.execTry(s);
        case 'import': {
          this.snap(s.line);
          for (const n of s.names) { const m = this.importModule(n.mod, s.line); this.bind(n.as || n.mod.split('.')[0], n.as ? m : this.modules.get(n.mod.split('.')[0])); }
          return;
        }
        case 'fromimport': {
          this.snap(s.line);
          const m = this.importModule(s.mod, s.line);
          if (s.star) { const all = m.dict.get('__all__'); for (const [k, v] of m.dict) if (all ? all.items.some(x => x.v === k) : !k.startsWith('_')) this.bind(k, v); return; }
          for (const n of s.names) {
            if (!m.dict.has(n.name)) { try { this.importModule(s.mod + '.' + n.name, s.line); } catch (e) { if (!(e instanceof PyExc && isInst(e.obj, EXC.ImportError))) throw e; } }
            if (!m.dict.has(n.name)) raise('ImportError', `cannot import name '${n.name}' from '${s.mod}'`);
            this.bind(n.as || n.name, m.dict.get(n.name));
          }
          return;
        }
      }
      throw new Error('unsupported statement ' + s.k);
    }
    execTry(s) {
      this.snap(s.line);
      try {
        let ok = true;
        try { this.execBlock(s.body); }
        catch (e) {
          if (!(e instanceof PyExc)) throw e;
          ok = false;
          let handled = false;
          for (const h of s.handlers) {
            let match = !h.type;
            if (h.type) {
              const t = this.eval(h.type);
              const types = t.type === T.tuple ? t.items : [t];
              match = types.some(x => x.isType && isInst(e.obj, x));
            }
            if (match) {
              this.curLine = h.line;
              this.snap(h.line, 'caught');
              if (h.name) this.bind(h.name, e.obj);
              const prev = this.handling; this.handling = e;
              try { this.execBlock(h.body); } finally { this.handling = prev; if (h.name) { try { this.unbind(h.name); } catch (_) { /* already gone */ } } }
              handled = true;
              break;
            }
          }
          if (!handled) throw e;
        }
        if (ok && s.orelse) this.execBlock(s.orelse);
      } finally {
        if (s.fin) this.execBlock(s.fin);
      }
    }
    execClass(s) {
      this.snap(s.line);
      const bases = s.bases.map(b => this.eval(b));
      for (const b of bases) if (!b.isType) raise('TypeError', 'bases must be types');
      const cls = mkType(s.name, bases.length ? bases : [OBJECT], { builtin: false });
      cls.type = TYPE;
      cls.mro = this.c3(cls);
      const ns = new Map();
      const f = this.frame();
      const frame = { name: s.name, isClassBody: true, locals: ns, closure: f.scope ? (f.closure || []).concat([f.locals]) : f.closure, globals: f.globals, file: f.file, clsBeingBuilt: cls };
      this.frames.push(frame);
      try { this.execBlock(s.body); } finally { this.frames.pop(); }
      cls.dict = ns;
      for (const v of ns.values()) if (v.type === T.function) { v.cls = cls; v.qualname = s.name + '.' + v.name; }
      const doc = s.body[0] && s.body[0].k === 'expr' && s.body[0].e.k === 'str' ? s.body[0].e.v : null;
      cls.doc = doc;
      this.track(cls);
      this.bind(s.name, cls);
    }
    c3(cls) {
      const merge = seqs => {
        const out = [];
        seqs = seqs.map(x => x.slice()).filter(x => x.length);
        while (seqs.length) {
          let cand = null;
          for (const sq of seqs) { const h = sq[0]; if (!seqs.some(o => o.indexOf(h) > 0)) { cand = h; break; } }
          if (!cand) raise('TypeError', 'Cannot create a consistent method resolution order (MRO)');
          out.push(cand);
          seqs = seqs.map(sq => (sq[0] === cand ? sq.slice(1) : sq)).filter(x => x.length);
        }
        return out;
      };
      return [cls].concat(merge(cls.bases.map(b => b.mro).concat([cls.bases])));
    }
    makeFunction(s, isLambda) {
      const f = new PyObj(T.function);
      const fr = this.frame();
      f.name = isLambda ? '<lambda>' : s.name; f.params = s.params; f.body = s.body; f.line = s.line; f.lambda = !!isLambda; f.doc = s.doc;
      f.defaults = s.params.map(p => (p.def ? this.eval(p.def) : null));
      f.scope = isLambda ? localNames([], s.params.map(p => p.name)) : localNames(s.body, s.params.map(p => p.name));
      f.closure = fr.isClassBody ? fr.closure : fr.scope ? (fr.closure || []).concat([fr.locals]) : null;
      f.globals = fr.globals; f.file = fr.file;
      f.endLine = isLambda ? s.line : lastLine(s.body);
      this.track(f);
      return f;
    }

    /* ── assignment targets ── */
    assign(t, v) {
      switch (t.k) {
        case 'name': this.bind(t.id, v); return;
        case 'attr': this.setattr(this.eval(t.a), t.name, v); return;
        case 'sub': this.setitem(this.eval(t.a), this.eval(t.i), v); return;
        case 'tuple': case 'list': {
          const items = this.toArray(v);
          const star = t.items.findIndex(x => x.k === 'star');
          if (star < 0) {
            if (items.length > t.items.length) raise('ValueError', `too many values to unpack (expected ${t.items.length})`);
            if (items.length < t.items.length) raise('ValueError', `not enough values to unpack (expected ${t.items.length}, got ${items.length})`);
            t.items.forEach((x, k) => this.assign(x, items[k]));
          } else {
            const after = t.items.length - star - 1;
            if (items.length < t.items.length - 1) raise('ValueError', `not enough values to unpack (expected at least ${t.items.length - 1}, got ${items.length})`);
            t.items.slice(0, star).forEach((x, k) => this.assign(x, items[k]));
            this.assign(t.items[star].e, this.mkList(items.slice(star, items.length - after)));
            t.items.slice(star + 1).forEach((x, k) => this.assign(x, items[items.length - after + k]));
          }
          return;
        }
        case 'star': raise('SyntaxError', 'starred assignment target must be in a list or tuple');
      }
      raise('SyntaxError', 'cannot assign to expression');
    }

    /* ── expressions ── */
    eval(e) {
      switch (e.k) {
        case 'num': return e.int ? int(e.v) : float(e.v);
        case 'str': return str(e.v);
        case 'const': return e.v === true ? TRUE : e.v === false ? FALSE : NONE;
        case 'fstr': return str(e.parts.map(p => {
          if (typeof p === 'string') return p;
          if (p.eq && typeof p === 'string') return p;
          let v = this.eval(p.e);
          if (p.conv === 'r') v = str(this.repr(v)); else if (p.conv === 's') v = str(this.str(v)); else if (p.conv === 'a') v = str(this.repr(v));
          const spec = p.spec ? p.spec.map(q => (typeof q === 'string' ? q : this.str(this.eval(q.e)))).join('') : '';
          return this.format(v, spec);
        }).join(''));
        case 'name': return this.lookup(e.id, e.line);
        case 'tuple': return this.mkTuple(this.evalItems(e.items));
        case 'list': return this.mkList(this.evalItems(e.items));
        case 'set': { const s = this.mkSet(); for (const x of this.evalItems(e.items)) this.setAdd(s, x); return s; }
        case 'dict': { const d = this.mkDict(); e.keys.forEach((k, i) => this.dictSet(d, this.eval(k), this.eval(e.vals[i]))); return d; }
        case 'attr': return this.getattr(this.eval(e.a), e.name, e.line);
        case 'sub': return this.getitem(this.eval(e.a), e.i.k === 'slice' ? this.evalSlice(e.i) : this.eval(e.i));
        case 'slice': return this.evalSlice(e);
        case 'call': return this.evalCall(e);
        case 'unary': {
          const a = this.eval(e.a);
          if (e.op === '-') { if (isInt(a)) return int(-a.v); if (a.type === T.float) return float(-a.v); return this.dunder(a, '__neg__', [], 'bad operand type for unary -'); }
          if (e.op === '+') { if (isInt(a)) return int(a.v); if (a.type === T.float) return a; return this.dunder(a, '__pos__', [], 'bad operand type for unary +'); }
          if (e.op === '~') { if (isInt(a)) return int(~a.v); raise('TypeError', `bad operand type for unary ~: '${typeName(a)}'`); }
          break;
        }
        case 'not': return bool(!this.truthy(this.eval(e.a)));
        case 'bool': {
          const a = this.eval(e.a);
          if (e.op === 'and') return this.truthy(a) ? this.eval(e.b) : a;
          return this.truthy(a) ? a : this.eval(e.b);
        }
        case 'bin': return this.binop(e.op, this.eval(e.a), this.eval(e.b));
        case 'compare': {
          let left = this.eval(e.first);
          for (let k = 0; k < e.ops.length; k++) {
            const right = this.eval(e.rest[k]);
            if (!this.compare(e.ops[k], left, right)) return FALSE;
            left = right;
          }
          return TRUE;
        }
        case 'ifexp': return this.truthy(this.eval(e.c)) ? this.eval(e.a) : this.eval(e.b);
        case 'lambda': return this.makeFunction(e, true);
        case 'comp': return this.evalComp(e);
        case 'walrus': { const v = this.eval(e.value); this.assign(e.target, v); return v; }
        case 'star': raise('SyntaxError', "can't use starred expression here");
      }
      throw new Error('unsupported expression ' + e.k);
    }
    evalItems(items) {
      const out = [];
      for (const x of items) if (x.k === 'star') out.push(...this.toArray(this.eval(x.e))); else out.push(this.eval(x));
      return out;
    }
    evalSlice(e) {
      const o = new PyObj(T.object); o.slice = true;
      o.a = e.a ? this.eval(e.a) : NONE; o.b = e.b ? this.eval(e.b) : NONE; o.c = e.c ? this.eval(e.c) : NONE;
      return o;
    }
    evalCall(e) {
      const f = this.eval(e.f);
      const args = [], kwargs = {};
      for (const a of e.args) {
        if (a.kind === 'pos') args.push(this.eval(a.e));
        else if (a.kind === 'star') args.push(...this.toArray(this.eval(a.e)));
        else if (a.kind === 'kw') kwargs[a.name] = this.eval(a.e);
        else if (a.kind === 'kwstar') { const d = this.eval(a.e); for (const en of d.map.values()) kwargs[en.k.v] = en.v; }
      }
      const line = this.curLine;
      const r = this.callObj(f, args, kwargs, e.line);
      this.curLine = line;
      return r;
    }
    evalComp(e) {
      const f = this.frame();
      // a comprehension has its own scope for its loop variables
      const inner = new Map();
      const frame = { name: '<' + (e.kind === 'gen' ? 'genexpr' : e.kind + 'comp') + '>', locals: inner, scope: { locals: new Set(), globals: new Set(), nonlocals: new Set() }, closure: (f.closure || []).concat(f.isClassBody ? [] : [f.locals]), globals: f.globals, file: f.file, hidden: true };
      const result = e.kind === 'dict' ? this.mkDict() : e.kind === 'set' ? this.mkSet() : [];
      const targetsOf = t => (t.k === 'name' ? [t.id] : t.items ? t.items.flatMap(targetsOf) : t.k === 'star' ? targetsOf(t.e) : []);
      e.gens.forEach(g => targetsOf(g.target).forEach(n => frame.scope.locals.add(n)));
      const first = this.eval(e.gens[0].iter);
      this.frames.push(frame);
      try {
        const loop = (k, iterable) => {
          const g = e.gens[k];
          const it = this.iter(iterable);
          for (;;) {
            const x = this.next(it); if (x === undefined) return;
            this.assign(g.target, x);
            if (!g.ifs.every(c => this.truthy(this.eval(c)))) continue;
            if (k + 1 < e.gens.length) loop(k + 1, this.eval(e.gens[k + 1].iter));
            else if (e.kind === 'dict') this.dictSet(result, this.eval(e.elt), this.eval(e.val));
            else if (e.kind === 'set') this.setAdd(result, this.eval(e.elt));
            else result.push(this.eval(e.elt));
          }
        };
        loop(0, first);
      } finally { this.frames.pop(); }
      if (e.kind === 'list') return this.mkList(result);
      if (e.kind === 'gen') { const it = this.mkIter(result, T.list_iterator); return it; }
      return result;
    }

    /* ── truth, iteration ── */
    truthy(o) {
      if (o === NONE || o === FALSE) return false;
      if (o === TRUE) return true;
      if (isInt(o)) return o.v !== 0n;
      if (o.type === T.float) return o.v !== 0;
      if (isStr(o)) return o.v.length > 0;
      if (o.items) return o.items.length > 0;
      if (o.map) return o.map.size > 0;
      if (o.type === T.range) return this.rangeLen(o) > 0;
      if (!o.isType && !o.type.builtin) {
        const b = lookupType(o.type, '__bool__'); if (b) return this.truthy(this.callObj(b, [o], {}));
        const l = lookupType(o.type, '__len__'); if (l) return this.callObj(l, [o], {}).v !== 0n;
      }
      return true;
    }
    mkIter(items, type) { const it = new PyObj(type || T.list_iterator); it.arr = items; it.i = 0; return it; }
    iter(o) {
      if ([T.list_iterator, T.map, T.filter, T.zip, T.enumerate, T.reversed].includes(o.type)) return o;
      if (o.type === T.list || o.type === T.tuple || o.type === T.deque) { const it = new PyObj(T.list_iterator); it.live = o; it.i = 0; return it; }
      if (isStr(o)) return this.mkIter([...o.v].map(str));
      if (o.type === T.dict) return this.mkIter([...o.map.values()].map(e => e.k));
      if (o.type === T.set || o.type === T.frozenset) return this.mkIter(this.setOrder(o));
      if (o.type === T.range) { const it = new PyObj(T.list_iterator); it.range = o; it.cur = o.start; return it; }
      if (o.type === T.dict_keys) return this.mkIter([...o.src.map.values()].map(e => e.k));
      if (o.type === T.dict_values) return this.mkIter([...o.src.map.values()].map(e => e.v));
      if (o.type === T.dict_items) return this.mkIter([...o.src.map.values()].map(e => this.mkTuple([e.k, e.v])));
      if (!o.isType && !o.type.builtin) {
        const m = lookupType(o.type, '__iter__');
        if (m) { const r = this.callObj(m, [o], {}); if (r.arr !== undefined || r.live || r.range) return r; const it = new PyObj(T.list_iterator); it.userIter = r; return it; }
        const gi = lookupType(o.type, '__getitem__');
        if (gi) { const it = new PyObj(T.list_iterator); it.getitemOf = o; it.i = 0; return it; }
      }
      raise('TypeError', `'${typeName(o)}' object is not iterable`);
    }
    // returns the next value, or undefined when exhausted
    next(it) {
      if (it.live) { if (it.i < it.live.items.length) return it.live.items[it.i++]; return undefined; }
      if (it.range) { const r = it.range; if (r.step > 0n ? it.cur < r.stop : it.cur > r.stop) { const v = int(it.cur); it.cur += r.step; return v; } return undefined; }
      if (it.userIter) {
        const m = lookupType(it.userIter.type, '__next__');
        try { return this.callObj(m, [it.userIter], {}); } catch (e) { if (e instanceof PyExc && isInst(e.obj, EXC.StopIteration)) return undefined; throw e; }
      }
      if (it.getitemOf) { try { return this.getitem(it.getitemOf, int(it.i++)); } catch (e) { if (e instanceof PyExc && isInst(e.obj, EXC.IndexError)) return undefined; throw e; } }
      if (it.lazy) return it.lazy();
      if (it.i < it.arr.length) return it.arr[it.i++];
      return undefined;
    }
    toArray(o) {
      if (o.type === T.list || o.type === T.tuple || o.type === T.deque) return o.items.slice();
      const it = this.iter(o), out = [];
      for (;;) { const x = this.next(it); if (x === undefined) return out; out.push(x); if (out.length > 1e6) raise('MemoryError', 'too many items'); }
    }
    rangeLen(r) { const n = r.step > 0n ? (r.stop - r.start + r.step - 1n) / r.step : (r.start - r.stop - r.step - 1n) / -r.step; return n > 0n ? Number(n) : 0; }

    /* ── containers ── */
    dictSet(d, k, v) { const h = hashKey(k); const e = d.map.get(h); if (e) e.v = v; else d.map.set(h, { k, v }); }
    dictGet(d, k) { const e = d.map.get(hashKey(k)); return e ? e.v : undefined; }
    setAdd(s, x) { const h = hashKey(x); if (!s.map.has(h)) s.map.set(h, x); }
    index(o, i, n) {
      if (!isInt(i)) raise('TypeError', `${o.type.name} indices must be integers or slices, not ${typeName(i)}`);
      let k = Number(i.v); if (k < 0) k += n;
      if (k < 0 || k >= n) raise('IndexError', `${o.type === T.str ? 'string' : o.type.name} index out of range`);
      return k;
    }
    sliceRange(sl, n) {
      const g = (x, d) => (x === NONE ? d : Number(x.v));
      const step = g(sl.c, 1);
      if (step === 0) raise('ValueError', 'slice step cannot be zero');
      let a, b;
      if (step > 0) {
        a = sl.a === NONE ? 0 : g(sl.a); b = sl.b === NONE ? n : g(sl.b);
        if (a < 0) a = Math.max(0, a + n); if (b < 0) b = Math.max(0, b + n);
        a = Math.min(a, n); b = Math.min(b, n);
      } else {
        a = sl.a === NONE ? n - 1 : g(sl.a); b = sl.b === NONE ? -1 : g(sl.b);
        if (a < 0) a += n; if (sl.b !== NONE && b < 0) b += n;
        a = Math.min(a, n - 1); if (sl.b !== NONE) b = Math.max(b, -1);
      }
      const idx = [];
      if (step > 0) for (let k = a; k < b; k += step) idx.push(k); else for (let k = a; k > b; k += step) idx.push(k);
      return idx;
    }
    getitem(o, i) {
      if (o.type === T.list || o.type === T.tuple || o.type === T.deque) {
        if (i.slice) { const idx = this.sliceRange(i, o.items.length); const items = idx.map(k => o.items[k]); return o.type === T.tuple ? this.mkTuple(items) : this.mkList(items); }
        return o.items[this.index(o, i, o.items.length)];
      }
      if (isStr(o)) {
        const chars = [...o.v];
        if (i.slice) return str(this.sliceRange(i, chars.length).map(k => chars[k]).join(''));
        return str(chars[this.index(o, i, chars.length)]);
      }
      if (o.type === T.dict) { const v = this.dictGet(o, i); if (v === undefined) throw new PyExc(mkExc('KeyError', null, i)).withArg(i); return v; }
      if (o.type === T.range) {
        const n = this.rangeLen(o);
        if (i.slice) { const idx = this.sliceRange(i, n); return this.mkList(idx.map(k => int(o.start + BigInt(k) * o.step))); }
        return int(o.start + BigInt(this.index(o, i, n)) * o.step);
      }
      if (!o.isType && !o.type.builtin) { const m = lookupType(o.type, '__getitem__'); if (m) return this.callObj(m, [o, i], {}); }
      raise('TypeError', `'${typeName(o)}' object is not subscriptable`);
    }
    setitem(o, i, v) {
      if (o.type === T.list) {
        if (i.slice) {
          const idx = this.sliceRange(i, o.items.length); const vals = this.toArray(v);
          const step = i.c === NONE ? 1 : Number(i.c.v);
          if (step === 1) {
            const n = o.items.length, norm = (x, d) => { if (x === NONE) return d; let k = Number(x.v); if (k < 0) k = Math.max(0, k + n); return Math.min(k, n); };
            const a = norm(i.a, 0), b = Math.max(a, norm(i.b, n));
            o.items.splice(a, b - a, ...vals);
          }
          else { if (vals.length !== idx.length) raise('ValueError', `attempt to assign sequence of size ${vals.length} to extended slice of size ${idx.length}`); idx.forEach((k, j) => { o.items[k] = vals[j]; }); }
          return;
        }
        o.items[this.index(o, i, o.items.length)] = v; return;
      }
      if (o.type === T.dict) { this.dictSet(o, i, v); return; }
      if (o.type === T.deque) { o.items[this.index(o, i, o.items.length)] = v; return; }
      if (!o.isType && !o.type.builtin) { const m = lookupType(o.type, '__setitem__'); if (m) { this.callObj(m, [o, i, v], {}); return; } }
      raise('TypeError', `'${typeName(o)}' object does not support item assignment`);
    }
    delitem(o, i) {
      if (o.type === T.list) {
        if (i.slice) { const idx = new Set(this.sliceRange(i, o.items.length)); o.items = o.items.filter((_, k) => !idx.has(k)); return; }
        o.items.splice(this.index(o, i, o.items.length), 1); return;
      }
      if (o.type === T.dict) { const h = hashKey(i); if (!o.map.has(h)) throw new PyExc(mkExc('KeyError')).withArg(i); o.map.delete(h); return; }
      raise('TypeError', `'${typeName(o)}' object doesn't support item deletion`);
    }
    contains(c, x) {
      if (c.type === T.list || c.type === T.tuple || c.type === T.deque) return c.items.some(y => this.eq(x, y));
      if (isStr(c)) { if (!isStr(x)) raise('TypeError', `'in <string>' requires string as left operand, not ${typeName(x)}`); return c.v.includes(x.v); }
      if (c.type === T.dict || c.type === T.dict_keys) return (c.src || c).map.has(hashKey(x));
      if (c.type === T.set || c.type === T.frozenset) return c.map.has(hashKey(x));
      if (c.type === T.range) { if (!isInt(x)) return false; const v = x.v; return c.step > 0n ? v >= c.start && v < c.stop && (v - c.start) % c.step === 0n : v <= c.start && v > c.stop && (c.start - v) % -c.step === 0n; }
      if (c.type === T.dict_values) return [...c.src.map.values()].some(e => this.eq(x, e.v));
      if (!c.isType && !c.type.builtin) { const m = lookupType(c.type, '__contains__'); if (m) return this.truthy(this.callObj(m, [c, x], {})); }
      return this.toArray(c).some(y => this.eq(x, y));
    }

    /* ── operators ── */
    eq(a, b) {
      if (a === b) return true;
      if (isNum(a) && isNum(b)) return isInt(a) && isInt(b) ? a.v === b.v : Number(a.v) === Number(b.v);
      if (isStr(a) && isStr(b)) return a.v === b.v;
      if ((a.type === T.list && b.type === T.list) || (a.type === T.tuple && b.type === T.tuple) || (a.type === T.deque && b.type === T.deque)) return a.items.length === b.items.length && a.items.every((x, k) => this.eq(x, b.items[k]));
      if (a.type === T.dict && b.type === T.dict) return a.map.size === b.map.size && [...a.map].every(([h, e]) => b.map.has(h) && this.eq(e.v, b.map.get(h).v));
      if ((a.type === T.set || a.type === T.frozenset) && (b.type === T.set || b.type === T.frozenset)) return a.map.size === b.map.size && [...a.map.keys()].every(h => b.map.has(h));
      if (a.type === T.range && b.type === T.range) return this.repr(a) === this.repr(b);
      for (const [x, y] of [[a, b], [b, a]]) {
        if (!x.isType && !x.type.builtin) { const m = lookupType(x.type, '__eq__'); if (m) { const r = this.callObj(m, [x, y], {}); if (r !== this.NotImplemented) return this.truthy(r); } }
      }
      return false;
    }
    compare(op, a, b) {
      switch (op) {
        case '==': return this.eq(a, b);
        case '!=': {
          if (!a.isType && !a.type.builtin) { const m = lookupType(a.type, '__ne__'); if (m) return this.truthy(this.callObj(m, [a, b], {})); }
          return !this.eq(a, b);
        }
        case 'is': return a === b;
        case 'is not': return a !== b;
        case 'in': return this.contains(b, a);
        case 'not in': return !this.contains(b, a);
      }
      return this.order(op, a, b);
    }
    order(op, a, b) {
      const cmp = (x, y) => {
        if (isNum(x) && isNum(y)) { if (isInt(x) && isInt(y)) return x.v < y.v ? -1 : x.v > y.v ? 1 : 0; const p = Number(x.v), q = Number(y.v); return p < q ? -1 : p > q ? 1 : p === q ? 0 : NaN; }
        if (isStr(x) && isStr(y)) return x.v < y.v ? -1 : x.v > y.v ? 1 : 0;
        if ((x.type === T.list && y.type === T.list) || (x.type === T.tuple && y.type === T.tuple)) {
          for (let k = 0; k < Math.min(x.items.length, y.items.length); k++) { if (!this.eq(x.items[k], y.items[k])) return cmp(x.items[k], y.items[k]); }
          return x.items.length - y.items.length;
        }
        if ((x.type === T.set || x.type === T.frozenset) && (y.type === T.set || y.type === T.frozenset)) {
          const sub = [...x.map.keys()].every(h => y.map.has(h)), sup = [...y.map.keys()].every(h => x.map.has(h));
          return sub && sup ? 0 : sub ? -1 : sup ? 1 : NaN;
        }
        return null;
      };
      const names = { '<': '__lt__', '>': '__gt__', '<=': '__le__', '>=': '__ge__' };
      const swap = { '<': '__gt__', '>': '__lt__', '<=': '__ge__', '>=': '__le__' };
      if (!a.isType && !a.type.builtin) { const m = lookupType(a.type, names[op]); if (m) return this.truthy(this.callObj(m, [a, b], {})); }
      if (!b.isType && !b.type.builtin) { const m = lookupType(b.type, swap[op]); if (m) return this.truthy(this.callObj(m, [b, a], {})); }
      const c = cmp(a, b);
      if (c === null) raise('TypeError', `'${op}' not supported between instances of '${typeName(a)}' and '${typeName(b)}'`);
      if (Number.isNaN(c)) return false;
      return op === '<' ? c < 0 : op === '>' ? c > 0 : op === '<=' ? c <= 0 : c >= 0;
    }
    dunder(o, name, args, msg) {
      if (!o.isType && !o.type.builtin) { const m = lookupType(o.type, name); if (m) return this.callObj(m, [o, ...args], {}); }
      raise('TypeError', `${msg}: '${typeName(o)}'`);
    }
    binop(op, a, b, inplace) {
      if (isNum(a) && isNum(b)) return this.arith(op, a, b);
      const names = { '+': 'add', '-': 'sub', '*': 'mul', '/': 'truediv', '//': 'floordiv', '%': 'mod', '**': 'pow', '&': 'and', '|': 'or', '^': 'xor', '<<': 'lshift', '>>': 'rshift', '@': 'matmul' };
      const nm = names[op];
      if (inplace && !a.isType && !a.type.builtin) { const m = lookupType(a.type, `__i${nm}__`); if (m) return this.callObj(m, [a, b], {}); }
      if (!a.isType && !a.type.builtin) { const m = lookupType(a.type, `__${nm}__`); if (m) { const r = this.callObj(m, [a, b], {}); if (r !== this.NotImplemented) return r; } }
      if (!b.isType && !b.type.builtin) { const m = lookupType(b.type, `__r${nm}__`); if (m) { const r = this.callObj(m, [b, a], {}); if (r !== this.NotImplemented) return r; } }
      // built-in sequences and sets
      if (op === '+') {
        if (isStr(a) && isStr(b)) return str(a.v + b.v);
        if (a.type === T.list && b.type === T.list) { if (inplace) { a.items.push(...b.items); return a; } return this.mkList(a.items.concat(b.items)); }
        if (a.type === T.list && inplace) { a.items.push(...this.toArray(b)); return a; }
        if (a.type === T.tuple && b.type === T.tuple) return this.mkTuple(a.items.concat(b.items));
        if (isStr(a) || isStr(b)) raise('TypeError', isStr(a) ? `can only concatenate str (not "${typeName(b)}") to str` : `unsupported operand type(s) for +: '${typeName(a)}' and 'str'`);
        if (a.type === T.list) raise('TypeError', `can only concatenate list (not "${typeName(b)}") to list`);
      }
      if (op === '*') {
        const [s, n] = isInt(b) ? [a, b] : isInt(a) ? [b, a] : [null, null];
        if (s && isStr(s)) return str(s.v.repeat(Math.max(0, Number(n.v))));
        if (s && s.type === T.list) { const out = []; for (let k = 0; k < Number(n.v); k++) out.push(...s.items); if (inplace && s === a) { a.items = out; return a; } return this.mkList(out); }
        if (s && s.type === T.tuple) { const out = []; for (let k = 0; k < Number(n.v); k++) out.push(...s.items); return this.mkTuple(out); }
      }
      if (op === '%' && isStr(a)) return str(this.percentFormat(a.v, b));
      if ((a.type === T.set || a.type === T.frozenset || a.type === T.dict_keys) && (b.type === T.set || b.type === T.frozenset || b.type === T.dict_keys)) {
        const A = a.type === T.dict_keys ? this.toSet(a) : a, B = b.type === T.dict_keys ? this.toSet(b) : b;
        const r = inplace && a.type === T.set ? a : this.mkSet();
        const keysA = [...A.map], keysB = [...B.map];
        if (op === '|') { if (r !== a) keysA.forEach(([h, v]) => r.map.set(h, v)); keysB.forEach(([h, v]) => { if (!r.map.has(h)) r.map.set(h, v); }); return r; }
        if (op === '&') { const out = keysA.filter(([h]) => B.map.has(h)); r.map = new Map(out); return r; }
        if (op === '-') { const out = keysA.filter(([h]) => !B.map.has(h)); r.map = new Map(out); return r; }
        if (op === '^') { const out = keysA.filter(([h]) => !B.map.has(h)).concat(keysB.filter(([h]) => !A.map.has(h))); r.map = new Map(out); return r; }
      }
      if (op === '|' && a.type === T.dict && b.type === T.dict) { const r = inplace ? a : this.mkDict(); if (!inplace) for (const e of a.map.values()) this.dictSet(r, e.k, e.v); for (const e of b.map.values()) this.dictSet(r, e.k, e.v); return r; }
      raise('TypeError', `unsupported operand type(s) for ${op}${inplace ? '=' : ''}: '${typeName(a)}' and '${typeName(b)}'`);
    }
    toSet(o) { const s = this.mkSet(); for (const x of this.toArray(o)) this.setAdd(s, x); return s; }
    arith(op, a, b) {
      if (isInt(a) && isInt(b)) {
        const x = a.v, y = b.v;
        switch (op) {
          case '+': return int(x + y); case '-': return int(x - y); case '*': return int(x * y);
          case '/': if (y === 0n) raise('ZeroDivisionError', 'division by zero'); return float(Number(x) / Number(y));
          case '//': { if (y === 0n) raise('ZeroDivisionError', 'integer division or modulo by zero'); let q = x / y; if ((x % y !== 0n) && ((x < 0n) !== (y < 0n))) q -= 1n; return int(q); }
          case '%': { if (y === 0n) raise('ZeroDivisionError', 'integer division or modulo by zero'); let r = x % y; if (r !== 0n && ((r < 0n) !== (y < 0n))) r += y; return int(r); }
          case '**': if (y < 0n) return float(Math.pow(Number(x), Number(y))); return int(x ** y);
          case '&': return int(x & y); case '|': return int(x | y); case '^': return int(x ^ y);
          case '<<': if (y < 0n) raise('ValueError', 'negative shift count'); return int(x << y);
          case '>>': if (y < 0n) raise('ValueError', 'negative shift count'); return int(x >> y);
        }
      }
      const x = Number(a.v), y = Number(b.v);
      switch (op) {
        case '+': return float(x + y); case '-': return float(x - y); case '*': return float(x * y);
        case '/': if (y === 0) raise('ZeroDivisionError', 'float division by zero'); return float(x / y);
        case '//': if (y === 0) raise('ZeroDivisionError', 'float floor division by zero'); return float(Math.floor(x / y));
        case '%': { if (y === 0) raise('ZeroDivisionError', 'float modulo'); let r = x % y; if (r !== 0 && (r < 0) !== (y < 0)) r += y; return float(r); }
        case '**': { if (x === 0 && y < 0) raise('ZeroDivisionError', '0.0 cannot be raised to a negative power'); return float(Math.pow(x, y)); }
      }
      raise('TypeError', `unsupported operand type(s) for ${op}: '${typeName(a)}' and '${typeName(b)}'`);
    }
    percentFormat(fmt, arg) {
      const args = arg.type === T.tuple ? arg.items.slice() : [arg];
      let k = 0;
      const out = fmt.replace(/%([-+ 0#]*)(\d+|\*)?(?:\.(\d+))?([sdifrxXoeEgGc%])/g, (m, flags, width, prec, conv) => {
        if (conv === '%') return '%';
        const v = args[k++];
        if (v === undefined) raise('TypeError', 'not enough arguments for format string');
        const zero = flags.includes('0') && !flags.includes('-');
        let spec = (zero ? '' : flags.includes('-') ? '<' : '>') + (flags.includes('+') ? '+' : flags.includes(' ') ? ' ' : '') + (zero ? '0' : '') + (width || '') + (prec != null ? '.' + prec : '');
        if (conv === 's') return this.format(str(this.str(v)), spec.replace(/0(?=\d)/, ''));
        if (conv === 'r') return this.format(str(this.repr(v)), spec.replace(/0(?=\d)/, ''));
        if (conv === 'i' || conv === 'd') return this.format(isInt(v) ? v : int(Math.trunc(Number(v.v))), spec.replace(/\.\d+/, '') + 'd');
        if (conv === 'c') return isInt(v) ? String.fromCharCode(Number(v.v)) : v.v;
        return this.format(isInt(v) && 'eEfFgG'.includes(conv) ? float(Number(v.v)) : v, spec + conv);
      });
      if (k < args.length) raise('TypeError', 'not all arguments converted during string formatting');
      return out;
    }
    format(v, spec) {
      if (!v.isType && !v.type.builtin) { const m = lookupType(v.type, '__format__'); if (m) return this.callObj(m, [v, str(spec)], {}).v; if (!spec) return this.str(v); }
      if (!isStr(v) && !isNum(v)) { if (spec) raise('TypeError', `unsupported format string passed to ${typeName(v)}.__format__`); return this.str(v); }
      return formatSpec(this, v, spec);
    }

    /* ── modules ── */
    importModule(name, line) {
      if (this.modules.has(name)) return this.modules.get(name);
      if (name.includes('.')) {
        const parent = this.importModule(name.slice(0, name.lastIndexOf('.')), line);
        const child = this.importModule1(name, line);
        parent.dict.set(name.slice(name.lastIndexOf('.') + 1), child);
        return child;
      }
      return this.importModule1(name, line);
    }
    importModule1(name, line) {
      if (this.modules.has(name)) return this.modules.get(name);
      const builtin = this.builtinModule(name);
      if (builtin) { this.modules.set(name, builtin); return builtin; }
      const path = name.replace(/\./g, '/');
      const text = this.files[path + '.py'] ?? this.files[path + '/__init__.py'];
      if (text == null) raise('ModuleNotFoundError', `No module named '${name}'`);
      const m = new PyObj(T.module); m.name = name; m.dict = new Map(); m.dict.set('__name__', str(name));
      this.modules.set(name, m);
      const fileIdx = Object.keys(this.files).indexOf(this.files[path + '.py'] != null ? path + '.py' : path + '/__init__.py') + 1;
      let body;
      try { body = parseProgram(text); } catch (e) { if (e instanceof PySyntaxError) e.file = fileIdx; throw e; }
      this.track(m); m.hidden = false;
      this.frames.push({ name: name, isModule: true, locals: m.dict, globals: m.dict, file: fileIdx, scope: null });
      try { this.execBlock(body); } finally { this.frames.pop(); }
      return m;
    }
  }
  function lastLine(body) { let l = 0; const walk = ss => { for (const s of ss || []) { l = Math.max(l, s.line); walk(s.body); walk(s.orelse); walk(s.fin); (s.handlers || []).forEach(h => walk(h.body)); } }; walk(body); return l; }
  PyExc.prototype.withArg = function (k) { this.obj.args = [k]; return this; };
  function parseProgram(code) { return new Parser(lex(code)).program(); }

  /* ════════════════════════════════════════════════════════════════
     5. Built-in functions, methods and modules
     ════════════════════════════════════════════════════════════════ */
  const bf = (name, fn) => { const o = new PyObj(T.builtin_function_or_method); o.name = name; o.fn = fn; return o; };
  const noKw = (kw, name) => { const k = Object.keys(kw); if (k.length) raise('TypeError', `${name}() takes no keyword arguments`); };
  const argN = (args, n, name, max = n) => { if (args.length < n || args.length > max) raise('TypeError', n === max ? `${name}() takes exactly ${n === 1 ? 'one argument' : n + ' arguments'} (${args.length} given)` : `${name} expected at most ${max} arguments, got ${args.length}`); };

  Interp.prototype.makeBuiltins = function () {
    const B = new Map();
    const it = this;
    const def = (name, fn) => B.set(name, bf(name, fn));
    it.NotImplemented = new PyObj(T.object); it.NotImplemented.name = 'NotImplemented';
    B.set('NotImplemented', it.NotImplemented);
    def('print', function (args, kw) {
      const sep = kw.sep && kw.sep !== NONE ? kw.sep.v : ' ', end = kw.end && kw.end !== NONE ? kw.end.v : '\n';
      this.emit(args.map(a => this.str(a)).join(sep) + end); return NONE;
    });
    def('input', function (args) {
      if (args.length) this.emit(this.str(args[0]));
      if (this.inPos >= this.stdin.length || (this.inPos === this.stdin.length - 1 && this.stdin[this.inPos] === '')) raise('EOFError', 'EOF when reading a line');
      const line = this.stdin[this.inPos++]; this.emit(line + '\n'); return str(line);
    });
    def('len', function (args) {
      argN(args, 1, 'len'); const o = args[0];
      if (isStr(o)) return int([...o.v].length);
      if (o.items) return int(o.items.length);
      if (o.map) return int(o.map.size);
      if (o.src && o.src.map) return int(o.src.map.size);
      if (o.type === T.range) return int(this.rangeLen(o));
      if (!o.isType && !o.type.builtin) { const m = lookupType(o.type, '__len__'); if (m) return this.callObj(m, [o], {}); }
      raise('TypeError', `object of type '${typeName(o)}' has no len()`);
    });
    def('repr', function (args) { return str(this.repr(args[0])); });
    def('id', function (args) { return int(0x7f3a2c000000 + args[0].oid * 48); });
    def('hash', function (args) { const h = hashKey(args[0]); return int(h[0] === 'n' ? BigInt(h.slice(1)) : BigInt([...h].reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 7))); });
    def('isinstance', function (args) {
      const [o, t] = args; const ts = t.type === T.tuple ? t.items : [t];
      return bool(ts.some(x => (x.isType ? isInst(o, x) : raise('TypeError', 'isinstance() arg 2 must be a type, a tuple of types, or a union'))));
    });
    def('issubclass', function (args) { const [a, t] = args; const ts = t.type === T.tuple ? t.items : [t]; return bool(ts.some(x => a.mro.includes(x))); });
    def('callable', function (args) { const o = args[0]; return bool(o.isType || [T.function, T.builtin_function_or_method, T.method].includes(o.type) || (!o.type.builtin && !!lookupType(o.type, '__call__'))); });
    def('abs', function (args) { const o = args[0]; if (isInt(o)) return int(o.v < 0n ? -o.v : o.v); if (o.type === T.float) return float(Math.abs(o.v)); return this.dunder(o, '__abs__', [], 'bad operand type for abs()'); });
    def('round', function (args) {
      const [x, nd] = args;
      if (isInt(x) && (!nd || nd === NONE)) return x;
      const n = nd && nd !== NONE ? Number(nd.v) : null;
      const v = Number(x.v);
      if (n === null) { const f = Math.floor(v), d = v - f; let r = d > 0.5 ? f + 1 : d < 0.5 ? f : (f % 2 === 0 ? f : f + 1); return int(BigInt(r)); }
      if (isInt(x)) { if (n >= 0) return x; const p = 10n ** BigInt(-n); const q = x.v / p, r = x.v % p; let res = q; if (r * 2n > p || (r * 2n === p && q % 2n !== 0n)) res += 1n; return int(res * p); }
      const s = fmtFixed(v, Math.max(n, 0)); return float(n >= 0 ? parseFloat((v < 0 ? '-' : '') + s) : Math.round(v / 10 ** -n) * 10 ** -n);
    });
    def('divmod', function (args) { return this.mkTuple([this.arith('//', args[0], args[1]), this.arith('%', args[0], args[1])]); });
    def('pow', function (args) { if (args.length === 3) { let [b, e, m] = args.map(a => a.v); let r = 1n; b %= m; while (e > 0n) { if (e & 1n) r = (r * b) % m; b = (b * b) % m; e >>= 1n; } return int(r); } return this.arith('**', args[0], args[1]); });
    def('ord', function (args) { if (!isStr(args[0]) || [...args[0].v].length !== 1) raise('TypeError', 'ord() expected a character'); return int(args[0].v.codePointAt(0)); });
    def('chr', function (args) { return str(String.fromCodePoint(Number(args[0].v))); });
    def('bin', function (args) { const v = args[0].v; return str((v < 0n ? '-0b' : '0b') + (v < 0n ? -v : v).toString(2)); });
    def('hex', function (args) { const v = args[0].v; return str((v < 0n ? '-0x' : '0x') + (v < 0n ? -v : v).toString(16)); });
    def('oct', function (args) { const v = args[0].v; return str((v < 0n ? '-0o' : '0o') + (v < 0n ? -v : v).toString(8)); });
    def('sum', function (args, kw) { let acc = args[1] || kw.start || int(0); for (const x of this.toArray(args[0])) acc = this.binop('+', acc, x); return acc; });
    const minmax = (name, better) => function (args, kw) {
      const items = args.length === 1 ? this.toArray(args[0]) : args;
      if (!items.length) { if (kw.default) return kw.default; raise('ValueError', `${name}() arg is an empty sequence`); }
      const key = kw.key && kw.key !== NONE ? x => this.callObj(kw.key, [x], {}) : x => x;
      let best = items[0], bk = key(best);
      for (const x of items.slice(1)) { const k = key(x); if (this.order(better, k, bk)) { best = x; bk = k; } }
      return best;
    };
    def('min', minmax('min', '<')); def('max', minmax('max', '>'));
    def('all', function (args) { return bool(this.toArray(args[0]).every(x => this.truthy(x))); });
    def('any', function (args) { return bool(this.toArray(args[0]).some(x => this.truthy(x))); });
    def('sorted', function (args, kw) { const l = this.mkList(this.toArray(args[0])); this.sortList(l, kw); return l; });
    def('reversed', function (args) { const o = args[0]; if (!o.isType && !o.type.builtin && lookupType(o.type, '__reversed__')) return this.callObj(lookupType(o.type, '__reversed__'), [o], {}); const arr = this.toArray(o).reverse(); return this.mkIter(arr, T.reversed); });
    def('enumerate', function (args, kw) { const start = args[1] || kw.start || int(0); const src = this.iter(args[0]); let k = start.v; const o = new PyObj(T.enumerate); o.arr = []; o.lazy = () => { const x = this.next(src); if (x === undefined) return undefined; return this.mkTuple([int(k++), x]); }; return o; });
    def('zip', function (args) { const its = args.map(a => this.iter(a)); const o = new PyObj(T.zip); o.arr = []; o.lazy = () => { if (!its.length) return undefined; const xs = []; for (const i of its) { const x = this.next(i); if (x === undefined) return undefined; xs.push(x); } return this.mkTuple(xs); }; return o; });
    def('map', function (args) { const [f, ...srcs] = args; const its = srcs.map(a => this.iter(a)); const o = new PyObj(T.map); o.arr = []; o.lazy = () => { const xs = []; for (const i of its) { const x = this.next(i); if (x === undefined) return undefined; xs.push(x); } return this.callObj(f, xs, {}); }; return o; });
    def('filter', function (args) { const [f, src] = args; const i = this.iter(src); const o = new PyObj(T.filter); o.arr = []; o.lazy = () => { for (;;) { const x = this.next(i); if (x === undefined) return undefined; if (f === NONE ? this.truthy(x) : this.truthy(this.callObj(f, [x], {}))) return x; } }; return o; });
    def('iter', function (args) { return this.iter(args[0]); });
    def('next', function (args) { const x = this.next(args[0]); if (x === undefined) { if (args.length > 1) return args[1]; raise('StopIteration'); } return x; });
    def('hasattr', function (args) { try { this.getattr(args[0], args[1].v); return TRUE; } catch (e) { if (e instanceof PyExc && isInst(e.obj, EXC.AttributeError)) return FALSE; throw e; } });
    def('getattr', function (args) { try { return this.getattr(args[0], args[1].v); } catch (e) { if (args.length > 2 && e instanceof PyExc && isInst(e.obj, EXC.AttributeError)) return args[2]; throw e; } });
    def('setattr', function (args) { this.setattr(args[0], args[1].v, args[2]); return NONE; });
    def('delattr', function (args) { const o = args[0]; if (!o.dict || !o.dict.delete(args[1].v)) raise('AttributeError', args[1].v); return NONE; });
    def('dir', function (args) {
      const o = args[0]; const names = new Set();
      if (!o) { for (const k of this.frame().locals.keys()) names.add(k); }
      else { if (o.dict) for (const k of o.dict.keys()) names.add(k); const t = o.isType ? o : o.type; for (const c of t.mro) if (c.dict) for (const k of c.dict.keys()) names.add(k); }
      return this.mkList([...names].sort().map(str));
    });
    def('vars', function (args) { const o = args[0]; const d = this.mkDict(); for (const [k, v] of (o ? o.dict : this.frame().locals)) this.dictSet(d, str(k), v); return d; });
    def('globals', function () { const d = this.mkDict(); for (const [k, v] of this.frame().globals) this.dictSet(d, str(k), v); return d; });
    def('help', function (args) { const o = args[0]; this.emit(`Help on ${o.type === T.function ? 'function ' + o.name : o.isType ? 'class ' + o.name : typeName(o)}:\n\n${o.doc || ''}\n`); return NONE; });
    def('super', function (args) {
      const f = this.frame();
      const cls = args.length ? args[0] : f.fn && f.fn.cls;
      const self = args.length > 1 ? args[1] : f.locals.get(f.fn.params[0].name);
      if (!cls) raise('RuntimeError', 'super(): no arguments');
      const mro = (self.isType ? self : self.type).mro;
      const rest = mro.slice(mro.indexOf(cls) + 1);
      const proxy = new PyObj(T.object); proxy.superOf = { self, rest };
      return proxy;
    });
    def('exit', function (args) { throw new Exit(args[0] ? Number(args[0].v) : 0); });
    // constructors of the built-in types
    B.set('int', bf('int', function (args, kw) {
      const [x, base] = args; if (!x) return int(0);
      if (isInt(x)) return int(x.v);
      if (x.type === T.float) { if (!Number.isFinite(x.v)) raise('OverflowError', 'cannot convert float infinity to integer'); return int(BigInt(Math.trunc(x.v))); }
      if (isStr(x)) {
        const b = base ? Number(base.v) : kw.base ? Number(kw.base.v) : 10;
        const s = x.v.trim().replace(/_/g, '');
        const re = b === 10 ? /^[-+]?\d+$/ : b === 16 ? /^[-+]?(0[xX])?[0-9a-fA-F]+$/ : b === 2 ? /^[-+]?(0[bB])?[01]+$/ : b === 8 ? /^[-+]?(0[oO])?[0-7]+$/ : /^[-+]?[0-9a-zA-Z]+$/;
        if (!re.test(s)) raise('ValueError', `invalid literal for int() with base ${b}: ${strRepr(x.v)}`);
        const neg = s[0] === '-'; const digits = s.replace(/^[-+]/, '').replace(/^0[xXbBoO]/, '');
        let v = 0n; for (const ch of digits.toLowerCase()) v = v * BigInt(b) + BigInt(parseInt(ch, 36));
        return int(neg ? -v : v);
      }
      return this.dunder(x, '__int__', [], "int() argument must be a string, a bytes-like object or a real number, not");
    }));
    B.set('float', bf('float', function (args) {
      const x = args[0]; if (!x) return float(0);
      if (isNum(x)) return float(Number(x.v));
      if (isStr(x)) { const s = x.v.trim().toLowerCase(); if (/^[-+]?(inf|infinity)$/.test(s)) return float(s[0] === '-' ? -Infinity : Infinity); if (/^[-+]?nan$/.test(s)) return float(NaN); if (!/^[-+]?(\d[\d_]*\.?\d*|\.\d+)(e[-+]?\d+)?$/.test(s)) raise('ValueError', `could not convert string to float: ${strRepr(x.v)}`); return float(parseFloat(s.replace(/_/g, ''))); }
      return this.dunder(x, '__float__', [], 'float() argument must be a string or a real number, not');
    }));
    B.set('str', bf('str', function (args) { return args.length ? str(this.str(args[0])) : str(''); }));
    B.set('bool', bf('bool', function (args) { return args.length ? bool(this.truthy(args[0])) : FALSE; }));
    B.set('list', bf('list', function (args) { return this.mkList(args.length ? this.toArray(args[0]) : []); }));
    B.set('tuple', bf('tuple', function (args) { return args.length && args[0].type === T.tuple ? args[0] : this.mkTuple(args.length ? this.toArray(args[0]) : []); }));
    B.set('set', bf('set', function (args) { const s = this.mkSet(); if (args.length) for (const x of this.toArray(args[0])) this.setAdd(s, x); return s; }));
    B.set('frozenset', bf('frozenset', function (args) { const s = this.mkSet(T.frozenset); if (args.length) for (const x of this.toArray(args[0])) this.setAdd(s, x); return s; }));
    B.set('dict', bf('dict', function (args, kw) {
      const d = this.mkDict();
      if (args.length) { const a = args[0]; if (a.type === T.dict) for (const e of a.map.values()) this.dictSet(d, e.k, e.v); else for (const p of this.toArray(a)) { const kv = this.toArray(p); if (kv.length !== 2) raise('ValueError', `dictionary update sequence element #0 has length ${kv.length}; 2 is required`); this.dictSet(d, kv[0], kv[1]); } }
      for (const [k, v] of Object.entries(kw)) this.dictSet(d, str(k), v);
      return d;
    }));
    B.set('range', bf('range', function (args) {
      for (const a of args) if (!isInt(a)) raise('TypeError', `'${typeName(a)}' object cannot be interpreted as an integer`);
      const r = new PyObj(T.range);
      if (args.length === 1) { r.start = 0n; r.stop = args[0].v; r.step = 1n; }
      else { r.start = args[0].v; r.stop = args[1].v; r.step = args[2] ? args[2].v : 1n; }
      if (r.step === 0n) raise('ValueError', 'range() arg 3 must not be zero');
      return r;
    }));
    B.set('type', bf('type', function (args) { if (args.length === 1) return args[0].isType ? TYPE : args[0].type; raise('TypeError', 'type() with 3 arguments is not supported here'); }));
    B.set('object', OBJECT);
    for (const [n, t] of Object.entries(EXC)) B.set(n, t);
    for (const n of ['int', 'float', 'str', 'bool', 'list', 'tuple', 'set', 'dict', 'range', 'frozenset']) { const ctor = B.get(n); const t = T[n]; t.ctor = ctor; }
    return B;
  };
  // constructors: calling a built-in type object runs its ctor
  const origConstruct = Interp.prototype.construct;
  Interp.prototype.construct = function (cls, args, kwargs, line) {
    if (cls.builtin && cls.ctor) return cls.ctor.fn.call(this, args, kwargs, line);
    return origConstruct.call(this, cls, args, kwargs, line);
  };
  // names of the built-in types resolve to the type objects, so isinstance(x, int) works
  const origMakeBuiltins = Interp.prototype.makeBuiltins;
  Interp.prototype.makeBuiltins = function () {
    const B = origMakeBuiltins.call(this);
    for (const n of ['int', 'float', 'str', 'bool', 'list', 'tuple', 'set', 'dict', 'range', 'frozenset']) B.set(n, T[n]);
    B.set('type', TYPE); TYPE.ctor = bf('type', function (args) { if (args.length === 1) return args[0].isType ? TYPE : args[0].type; raise('TypeError', 'type() takes 1 argument here'); });
    return B;
  };
  // super() proxies and methods of the built-in types
  const origGetattr = Interp.prototype.getattr;
  Interp.prototype.getattr = function (o, name, line) {
    if (o.superOf) {
      for (const c of o.superOf.rest) if (c.dict && c.dict.has(name)) {
        const m = c.dict.get(name);
        if (m.type === T.function) { const bm = new PyObj(T.method); bm.self = o.superOf.self; bm.func = m; return bm; }
        return m;
      }
      if (name === '__init__') return bf('__init__', () => NONE);
      raise('AttributeError', `'super' object has no attribute '${name}'`);
    }
    return origGetattr.call(this, o, name, line);
  };
  Interp.prototype.sortList = function (l, kw) {
    const key = kw.key && kw.key !== NONE ? kw.key : null, rev = kw.reverse && this.truthy(kw.reverse);
    const decorated = l.items.map((x, i) => ({ x, i, k: key ? this.callObj(key, [x], {}) : x }));
    decorated.sort((a, b) => { if (this.order('<', a.k, b.k)) return -1; if (this.order('<', b.k, a.k)) return 1; return 0; });
    if (rev) { // stable reverse: equal keys keep their order
      decorated.sort((a, b) => { if (this.order('<', a.k, b.k)) return 1; if (this.order('<', b.k, a.k)) return -1; return a.i - b.i; });
    }
    l.items = decorated.map(d => d.x);
  };
  Interp.prototype.builtinMethod = function (o, name) {
    const it = this;
    const m = (fn) => { const b = bf(name, fn); return b; };
    const S = o.v;
    if (isStr(o)) {
      const need = (a, k) => { if (!isStr(a[k])) raise('TypeError', `must be str, not ${typeName(a[k])}`); return a[k].v; };
      const M = {
        upper: () => str(S.toUpperCase()), lower: () => str(S.toLowerCase()), title: () => str(S.replace(/[A-Za-z]+/g, w => w[0].toUpperCase() + w.slice(1).toLowerCase())),
        capitalize: () => str(S ? S[0].toUpperCase() + S.slice(1).toLowerCase() : ''), swapcase: () => str([...S].map(c => (c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase())).join('')),
        strip: a => str(a[0] && a[0] !== NONE ? trimChars(S, a[0].v, true, true) : S.trim()), lstrip: a => str(a[0] && a[0] !== NONE ? trimChars(S, a[0].v, true, false) : S.replace(/^\s+/, '')), rstrip: a => str(a[0] && a[0] !== NONE ? trimChars(S, a[0].v, false, true) : S.replace(/\s+$/, '')),
        split: (a, kw) => { const sep = a[0] || kw.sep; const max = a[1] ? Number(a[1].v) : kw.maxsplit ? Number(kw.maxsplit.v) : -1; let parts; if (!sep || sep === NONE) { parts = S.trim().split(/\s+/).filter(Boolean); if (max >= 0 && parts.length > max + 1) { let rest = S.trim(); const out = []; for (let k = 0; k < max; k++) { const mm = /^(\S+)\s+/.exec(rest); out.push(mm[1]); rest = rest.slice(mm[0].length); } out.push(rest); parts = out; } } else { if (sep.v === '') raise('ValueError', 'empty separator'); parts = S.split(sep.v); if (max >= 0 && parts.length > max + 1) parts = parts.slice(0, max).concat([parts.slice(max).join(sep.v)]); } return it.mkList(parts.map(str)); },
        join: a => { const items = it.toArray(a[0]); items.forEach((x, k) => { if (!isStr(x)) raise('TypeError', `sequence item ${k}: expected str instance, ${typeName(x)} found`); }); return str(items.map(x => x.v).join(S)); },
        replace: a => str(a[2] ? replaceN(S, need(a, 0), need(a, 1), Number(a[2].v)) : S.split(need(a, 0)).join(need(a, 1))),
        find: a => int(S.indexOf(need(a, 0), a[1] ? Number(a[1].v) : 0)), rfind: a => int(S.lastIndexOf(need(a, 0))),
        index: a => { const k = S.indexOf(need(a, 0), a[1] ? Number(a[1].v) : 0); if (k < 0) raise('ValueError', 'substring not found'); return int(k); },
        count: a => { const t = need(a, 0); if (!t) return int(S.length + 1); let n = 0, k = 0; while ((k = S.indexOf(t, k)) >= 0) { n++; k += t.length; } return int(n); },
        startswith: a => bool(a[0].type === T.tuple ? a[0].items.some(x => S.startsWith(x.v)) : S.startsWith(need(a, 0))), endswith: a => bool(a[0].type === T.tuple ? a[0].items.some(x => S.endsWith(x.v)) : S.endsWith(need(a, 0))),
        isdigit: () => bool(/^\d+$/.test(S)), isnumeric: () => bool(/^\d+$/.test(S)), isalpha: () => bool(/^[A-Za-zÀ-￿]+$/.test(S)), isalnum: () => bool(/^[A-Za-z0-9À-￿]+$/.test(S)),
        isspace: () => bool(/^\s+$/.test(S)), isupper: () => bool(/[A-Z]/.test(S) && S === S.toUpperCase()), islower: () => bool(/[a-z]/.test(S) && S === S.toLowerCase()),
        center: a => str(centerStr(S, Number(a[0].v), a[1] ? a[1].v : ' ')), ljust: a => str(S.padEnd(Number(a[0].v), a[1] ? a[1].v : ' ')), rjust: a => str(S.padStart(Number(a[0].v), a[1] ? a[1].v : ' ')),
        zfill: a => { const w = Number(a[0].v); const sg = /^[-+]/.test(S) ? S[0] : ''; return str(sg + S.slice(sg.length).padStart(w - sg.length, '0')); },
        format: (a, kw) => { let auto = 0; return str(S.replace(/\{\{|\}\}|\{([^{}]*)\}/g, (mm, inner) => { if (mm === '{{') return '{'; if (mm === '}}') return '}'; let [field, spec] = splitField(inner); let conv = null; const cm = /!([rsa])$/.exec(field); if (cm) { conv = cm[1]; field = field.slice(0, -2); } const path = field.match(/^([^.[]*)(.*)$/); let v = path[1] === '' ? a[auto++] : /^\d+$/.test(path[1]) ? a[+path[1]] : kw[path[1]]; if (v === undefined) raise(path[1] === '' || /^\d+$/.test(path[1]) ? 'IndexError' : 'KeyError', path[1] === '' || /^\d+$/.test(path[1]) ? 'Replacement index ' + (path[1] || auto - 1) + ' out of range for positional args tuple' : `'${path[1]}'`); for (const acc of path[2].match(/\.\w+|\[[^\]]+\]/g) || []) v = acc[0] === '.' ? it.getattr(v, acc.slice(1)) : it.getitem(v, /^\d+$/.test(acc.slice(1, -1)) ? int(acc.slice(1, -1)) : str(acc.slice(1, -1))); if (conv === 'r') v = str(it.repr(v)); else if (conv === 's') v = str(it.str(v)); return it.format(v, spec || ''); })); },
        encode: () => { const o2 = new PyObj(T.object); o2.v = S; return o2; },
      };
      if (M[name]) return m(M[name]);
    }
    if (o.type === T.list) {
      const L = o.items;
      const M = {
        append: a => { argN(a, 1, 'list.append'); L.push(a[0]); return NONE; }, extend: a => { L.push(...it.toArray(a[0])); return NONE; },
        insert: a => { let k = Number(a[0].v); if (k < 0) k = Math.max(0, k + L.length); L.splice(Math.min(k, L.length), 0, a[1]); return NONE; },
        remove: a => { const k = L.findIndex(y => it.eq(a[0], y)); if (k < 0) raise('ValueError', 'list.remove(x): x not in list'); L.splice(k, 1); return NONE; },
        pop: a => { if (!L.length) raise('IndexError', 'pop from empty list'); let k = a.length ? Number(a[0].v) : L.length - 1; if (k < 0) k += L.length; if (k < 0 || k >= L.length) raise('IndexError', 'pop index out of range'); return L.splice(k, 1)[0]; },
        index: a => { const k = L.findIndex(y => it.eq(a[0], y)); if (k < 0) raise('ValueError', `${it.repr(a[0])} is not in list`); return int(k); },
        count: a => int(L.filter(y => it.eq(a[0], y)).length), reverse: () => { L.reverse(); return NONE; },
        sort: (a, kw) => { it.sortList(o, kw); return NONE; }, copy: () => it.mkList(L.slice()), clear: () => { L.length = 0; return NONE; },
      };
      if (M[name]) return m(M[name]);
    }
    if (o.type === T.tuple) {
      const M = { count: a => int(o.items.filter(y => it.eq(a[0], y)).length), index: a => { const k = o.items.findIndex(y => it.eq(a[0], y)); if (k < 0) raise('ValueError', 'tuple.index(x): x not in tuple'); return int(k); } };
      if (M[name]) return m(M[name]);
    }
    if (o.type === T.dict) {
      const view = t => { const v = new PyObj(t); v.src = o; return v; };
      const M = {
        keys: () => view(T.dict_keys), values: () => view(T.dict_values), items: () => view(T.dict_items),
        get: a => { const v = it.dictGet(o, a[0]); return v === undefined ? (a[1] || NONE) : v; },
        pop: a => { const h = hashKey(a[0]); const e = o.map.get(h); if (!e) { if (a.length > 1) return a[1]; throw new PyExc(mkExc('KeyError')).withArg(a[0]); } o.map.delete(h); return e.v; },
        popitem: () => { if (!o.map.size) raise('KeyError', 'popitem(): dictionary is empty'); const [h, e] = [...o.map].pop(); o.map.delete(h); return it.mkTuple([e.k, e.v]); },
        setdefault: a => { const v = it.dictGet(o, a[0]); if (v !== undefined) return v; it.dictSet(o, a[0], a[1] || NONE); return a[1] || NONE; },
        update: (a, kw) => { if (a[0]) { if (a[0].type === T.dict) for (const e of a[0].map.values()) it.dictSet(o, e.k, e.v); else for (const p of it.toArray(a[0])) { const kv = it.toArray(p); it.dictSet(o, kv[0], kv[1]); } } for (const [k, v] of Object.entries(kw)) it.dictSet(o, str(k), v); return NONE; },
        clear: () => { o.map.clear(); return NONE; }, copy: () => { const d = it.mkDict(); for (const e of o.map.values()) it.dictSet(d, e.k, e.v); return d; },
      };
      if (M[name]) return m(M[name]);
    }
    if (o.type === T.set || o.type === T.frozenset) {
      const other = a => { const s = it.mkSet(); for (const x of it.toArray(a)) it.setAdd(s, x); return s; };
      const M = {
        add: a => { it.setAdd(o, a[0]); return NONE; }, remove: a => { const h = hashKey(a[0]); if (!o.map.has(h)) throw new PyExc(mkExc('KeyError')).withArg(a[0]); o.map.delete(h); return NONE; },
        discard: a => { o.map.delete(hashKey(a[0])); return NONE; }, pop: () => { if (!o.map.size) raise('KeyError', 'pop from an empty set'); const x = it.setOrder(o)[0]; o.map.delete(hashKey(x)); return x; },
        clear: () => { o.map.clear(); return NONE; }, copy: () => { const s = it.mkSet(o.type); for (const [h, x] of o.map) s.map.set(h, x); return s; },
        union: a => a.reduce((acc, x) => it.binop('|', acc, other(x)), o), intersection: a => a.reduce((acc, x) => it.binop('&', acc, other(x)), o),
        difference: a => a.reduce((acc, x) => it.binop('-', acc, other(x)), o), symmetric_difference: a => it.binop('^', o, other(a[0])),
        issubset: a => bool([...o.map.keys()].every(h => other(a[0]).map.has(h))), issuperset: a => { const s = other(a[0]); return bool([...s.map.keys()].every(h => o.map.has(h))); },
        isdisjoint: a => { const s = other(a[0]); return bool(![...s.map.keys()].some(h => o.map.has(h))); },
        update: a => { for (const x of it.toArray(a[0])) it.setAdd(o, x); return NONE; },
      };
      if (M[name]) return m(M[name]);
    }
    if (o.type === T.deque) {
      const L = o.items;
      const M = {
        append: a => { L.push(a[0]); if (o.maxlen != null && L.length > o.maxlen) L.shift(); return NONE; }, appendleft: a => { L.unshift(a[0]); if (o.maxlen != null && L.length > o.maxlen) L.pop(); return NONE; },
        pop: () => { if (!L.length) raise('IndexError', 'pop from an empty deque'); return L.pop(); }, popleft: () => { if (!L.length) raise('IndexError', 'pop from an empty deque'); return L.shift(); },
        extend: a => { L.push(...it.toArray(a[0])); return NONE; }, extendleft: a => { for (const x of it.toArray(a[0])) L.unshift(x); return NONE; },
        rotate: a => { let n = a.length ? Number(a[0].v) : 1; const len = L.length; if (!len) return NONE; n = ((n % len) + len) % len; L.unshift(...L.splice(len - n, n)); return NONE; },
        clear: () => { L.length = 0; return NONE; }, count: a => int(L.filter(y => it.eq(a[0], y)).length),
      };
      if (M[name]) return m(M[name]);
    }
    if (isInt(o)) { if (name === 'bit_length') return m(() => int((o.v < 0n ? -o.v : o.v).toString(2).replace(/^0$/, '').length)); }
    if (o.type === T.float) { if (name === 'is_integer') return m(() => bool(Number.isInteger(o.v))); }
    return null;
  };
  function trimChars(s, chars, left, right) { let a = 0, b = s.length; if (left) while (a < b && chars.includes(s[a])) a++; if (right) while (b > a && chars.includes(s[b - 1])) b--; return s.slice(a, b); }
  function replaceN(s, a, b, n) { let out = '', k = 0, i = 0; while (i < n || n < 0) { const j = s.indexOf(a, k); if (j < 0) break; out += s.slice(k, j) + b; k = j + a.length; i++; } return out + s.slice(k); }
  function centerStr(s, w, f) { const tot = w - s.length; if (tot <= 0) return s; const left = Math.floor(tot / 2) + (tot % 2 && s.length % 2 ? 1 : 0); return f.repeat(left) + s + f.repeat(tot - left); }
  function splitField(inner) { let d = 0; for (let k = 0; k < inner.length; k++) { const c = inner[k]; if (c === '[') d++; else if (c === ']') d--; else if (c === ':' && d === 0) return [inner.slice(0, k), inner.slice(k + 1)]; } return [inner, '']; }

  Interp.prototype.builtinModule = function (name) {
    const it = this;
    const mod = (n, entries) => { const m = new PyObj(T.module); m.name = n; m.dict = new Map(entries); m.builtinModule = true; return m; };
    switch (name) {
      case 'math': return mod('math', [['pi', float(Math.PI)], ['e', float(Math.E)], ['inf', float(Infinity)], ['tau', float(2 * Math.PI)],
        ...['sqrt', 'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'exp', 'log10', 'log2', 'fabs'].map(f => [f, bf(f, function (a) { const x = Number(a[0].v); if (f === 'sqrt' && x < 0) raise('ValueError', 'math domain error'); return float(Math[f === 'fabs' ? 'abs' : f](x)); })]),
        ['log', bf('log', function (a) { const x = Number(a[0].v); if (x <= 0) raise('ValueError', 'math domain error'); return float(a[1] ? Math.log(x) / Math.log(Number(a[1].v)) : Math.log(x)); })],
        ['floor', bf('floor', function (a) { return int(BigInt(Math.floor(Number(a[0].v)))); })], ['ceil', bf('ceil', function (a) { return int(BigInt(Math.ceil(Number(a[0].v)))); })],
        ['pow', bf('pow', function (a) { return float(Math.pow(Number(a[0].v), Number(a[1].v))); })], ['atan2', bf('atan2', function (a) { return float(Math.atan2(Number(a[0].v), Number(a[1].v))); })],
        ['hypot', bf('hypot', function (a) { return float(Math.hypot(...a.map(x => Number(x.v)))); })], ['isclose', bf('isclose', function (a) { const x = Number(a[0].v), y = Number(a[1].v); return bool(Math.abs(x - y) <= Math.max(1e-9 * Math.max(Math.abs(x), Math.abs(y)), 0)); })],
        ['factorial', bf('factorial', function (a) { let r = 1n; for (let k = 2n; k <= a[0].v; k++) r *= k; return int(r); })], ['gcd', bf('gcd', function (a) { let [x, y] = a.map(v => (v.v < 0n ? -v.v : v.v)); while (y) [x, y] = [y, x % y]; return int(x); })],
        ['isqrt', bf('isqrt', function (a) { let x = a[0].v, r = BigInt(Math.floor(Math.sqrt(Number(x)))); while (r * r > x) r--; while ((r + 1n) * (r + 1n) <= x) r++; return int(r); })], ['trunc', bf('trunc', function (a) { return int(BigInt(Math.trunc(Number(a[0].v)))); })]]);
      case 'sys': return mod('sys', [['argv', it.mkList(['main.py', ...(it.opts.args || [])].map(str))], ['maxsize', int(9223372036854775807n)], ['version', str('3.11')],
        ['getrefcount', bf('getrefcount', function (a) { this.collectRefcount(); const o = a[0]; return int((this.refcounts && this.refcounts.has(o) ? this.refcounts.get(o) : 1) + 1); })],
        ['exit', bf('exit', function (a) { throw new Exit(a[0] ? Number(a[0].v) : 0); })], ['getrecursionlimit', bf('getrecursionlimit', () => int(200))]]);
      case 'gc': return mod('gc', [['collect', bf('collect', function () { return int(this.gcCollect()); })], ['enable', bf('enable', () => NONE)], ['disable', bf('disable', () => NONE)], ['isenabled', bf('isenabled', () => TRUE)]]);
      case 'random': {
        const rnd = () => { it.randState = (it.randState * 1103515245 + 12345) % 2147483648; return it.randState / 2147483648; };
        return mod('random', [['seed', bf('seed', function (a) { it.randState = a[0] ? Number(a[0].v) % 2147483648 : 12345; return NONE; })], ['random', bf('random', () => float(rnd()))],
          ['randint', bf('randint', function (a) { const lo = Number(a[0].v), hi = Number(a[1].v); return int(lo + Math.floor(rnd() * (hi - lo + 1))); })],
          ['choice', bf('choice', function (a) { const items = this.toArray(a[0]); if (!items.length) raise('IndexError', 'Cannot choose from an empty sequence'); return items[Math.floor(rnd() * items.length)]; })],
          ['shuffle', bf('shuffle', function (a) { const L = a[0].items; for (let k = L.length - 1; k > 0; k--) { const j = Math.floor(rnd() * (k + 1)); [L[k], L[j]] = [L[j], L[k]]; } return NONE; })],
          ['uniform', bf('uniform', function (a) { const lo = Number(a[0].v), hi = Number(a[1].v); return float(lo + rnd() * (hi - lo)); })]]);
      }
      case 'collections': {
        const dq = mkType('deque', [OBJECT]); dq.type = TYPE;
        T.deque.ctor = null;
        const make = bf('deque', function (a, kw) { const d = new PyObj(T.deque); d.items = a.length ? this.toArray(a[0]) : []; d.maxlen = kw.maxlen && kw.maxlen !== NONE ? Number(kw.maxlen.v) : null; if (d.maxlen != null) d.items = d.items.slice(-d.maxlen); this.track(d); return d; });
        T.deque.ctor = make;
        const od = bf('OrderedDict', function (a, kw) { return T.dict.ctor.fn.call(this, a, kw); });
        const counter = bf('Counter', function (a) { const d = this.mkDict(); if (a[0]) for (const x of this.toArray(a[0])) { const v = this.dictGet(d, x); this.dictSet(d, x, int((v ? v.v : 0n) + 1n)); } return d; });
        const dd = bf('defaultdict', function () { raise('NotImplementedError', 'defaultdict is not supported here'); });
        return mod('collections', [['deque', T.deque], ['OrderedDict', od], ['Counter', counter], ['defaultdict', dd]]);
      }
      case 'copy': return mod('copy', [['copy', bf('copy', function (a) { const o = a[0]; if (o.type === T.list) return this.mkList(o.items.slice()); if (o.type === T.dict) { const d = this.mkDict(); for (const e of o.map.values()) this.dictSet(d, e.k, e.v); return d; } if (o.dict) { const c = new PyObj(o.type); c.dict = new Map(o.dict); this.track(c); return c; } return o; })],
        ['deepcopy', bf('deepcopy', function (a) { const memo = new Map(); const dc = o => { if (memo.has(o)) return memo.get(o); if (o.type === T.list) { const c = this.mkList([]); memo.set(o, c); c.items = o.items.map(dc); return c; } if (o.type === T.tuple) return this.mkTuple(o.items.map(dc)); if (o.type === T.dict) { const d = this.mkDict(); memo.set(o, d); for (const e of o.map.values()) this.dictSet(d, dc(e.k), dc(e.v)); return d; } if (o.dict && !o.isType && o.type !== T.module && o.type !== T.function) { const c = new PyObj(o.type); memo.set(o, c); c.dict = new Map([...o.dict].map(([k, v]) => [k, dc(v)])); this.track(c); return c; } return o; }; return dc(a[0]); })]]);
    }
    return null;
  };
  T.deque.ctor = bf('deque', function (a, kw) { const d = new PyObj(T.deque); d.items = a.length ? this.toArray(a[0]) : []; d.maxlen = kw.maxlen && kw.maxlen !== NONE ? Number(kw.maxlen.v) : null; this.track(d); return d; });

  /* ════════════════════════════════════════════════════════════════
     6. Entry point
     ════════════════════════════════════════════════════════════════ */
  function traceback(e, mainName, files) {
    const fname = f => (f ? Object.keys(files)[f - 1] : mainName);
    const lines = ['Traceback (most recent call last):'];
    const tb = (e.tb || []).slice().reverse();
    const frames = [{ name: '<module>', line: e.moduleLine, file: 0 }].concat(tb.map((t, k) => ({ name: t.name, line: (tb[k + 1] ? tb[k + 1].callLine : e.line), file: t.file })));
    void frames;
    return lines;
  }
  PY.run = function (code, stdin, opts = {}) {
    OID = 1000;
    let body;
    const files = opts.files || {};
    const mainName = opts.main || 'main.py';
    try { body = parseProgram(code); }
    catch (e) {
      if (e instanceof PySyntaxError) return { trace: [], out: '', error: { kind: 'syntax', name: e.message.includes('indent') ? 'IndentationError' : 'SyntaxError', message: e.message, line: e.line, file: 0 } };
      return { trace: [], out: '', error: { kind: 'syntax', name: 'SyntaxError', message: String(e.message || e), line: null } };
    }
    const it = new Interp({ ...opts, stdin: stdin || '' });
    IT = it;
    const main = new PyObj(T.module); main.name = '__main__'; main.dict = new Map([['__name__', str('__main__')]]);
    it.modules.set('__main__', main);
    it.frames.push({ name: '<module>', isModule: true, locals: main.dict, globals: main.dict, file: 0, scope: null });
    let error = null, exitCode = 0;
    try { it.execBlock(body); it.frames.length = 1; it.snap(null, 'finished'); }
    catch (e) {
      const line = it.curLine;
      if (e instanceof PyExc) {
        const o = e.obj;
        const stack = e.pyStack || it.frames.filter(f => !f.hidden).map(f => ({ name: f.isModule ? '<module>' : f.name, file: f.file }));
        const where = e.where || { line, file: it.frames.length ? it.frames[it.frames.length - 1].file : 0 };
        error = { kind: 'runtime', name: o.type.name, message: it.str(o), line: where.line, file: where.file, stack };
        if (isInst(o, EXC.SystemExit)) { error = null; exitCode = 0; }
      } else if (e instanceof Exit) { exitCode = e.code; }
      else if (e instanceof StepLimit) error = { kind: 'runtime', name: 'StepLimit', message: `stopped after ${it.maxSteps} steps (an endless loop?)`, line };
      else if (e instanceof PySyntaxError) error = { kind: 'syntax', name: e.message.includes('indent') ? 'IndentationError' : 'SyntaxError', message: e.message, line: e.line, file: e.file || 0 };
      else if (e === BREAK || e === CONTINUE) error = { kind: 'syntax', name: 'SyntaxError', message: `'${e.sig}' outside loop`, line };
      else if (e instanceof Return) error = { kind: 'syntax', name: 'SyntaxError', message: "'return' outside function", line };
      else { error = { kind: 'runtime', name: 'InternalError', message: String(e && e.message || e), line }; if (typeof console !== 'undefined') console.warn('py.js internal error', e); }
      if (error || e instanceof Exit) {
        const last = it.trace[it.trace.length - 1] || { frames: [], objs: [] };
        it.trace.push({ ...last, line: error ? error.line : null, file: error ? error.file || 0 : 0, note: error ? 'error' : 'finished', outLen: it.out.length });
      }
    }
    return { trace: it.trace, out: it.out, error, exitCode, steps: it.steps };
  };
  PY.format = (v, spec) => formatSpec({ str: o => String(o.v) }, v, spec);
  void traceback;

  /* ════════════════════════════════════════════════════════════════
     7. Stepper UI
     ════════════════════════════════════════════════════════════════ */
  const UIS = {};
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const KW_RE = /\b(False|None|True|and|as|assert|break|class|continue|def|del|elif|else|except|finally|for|from|global|if|import|in|is|lambda|nonlocal|not|or|pass|raise|return|try|while|with|yield|self)\b/g;
  const BI_RE = /\b(print|len|range|input|int|float|str|list|dict|set|tuple|type|isinstance|sorted|sum|min|max|enumerate|zip|map|filter|super|id|abs|round)(?=\()/g;
  function highlight(line) {
    const parts = []; const re = /(#.*$)|("""[^]*?"""|'''[^]*?'''|[rRfFbB]{0,2}"(?:[^"\\]|\\.)*"|[rRfFbB]{0,2}'(?:[^'\\]|\\.)*')/g;
    let last = 0, m;
    const kw = s => esc(s).replace(KW_RE, '<b>$1</b>').replace(BI_RE, '<u>$1</u>').replace(/\b(\d+\.?\d*(?:e[-+]?\d+)?)\b/g, '<i>$1</i>');
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
      this.onResize = () => this.drawArrows();
      if (typeof window !== 'undefined') window.addEventListener('resize', this.onResize);
    }
    initFiles() {
      const cfg = this.cfg;
      this.files = [{ name: cfg.main || 'main.py', text: (cfg.code || '').replace(/\s+$/, '') }]
        .concat(Object.entries(cfg.files && typeof cfg.files === 'object' ? cfg.files : {}).map(([name, text]) => ({ name, text: String(text).replace(/\s+$/, '') })));
      this.tab = 0;
    }
    usesStdin() { return /\binput\s*\(/.test(this.files.map(f => f.text).join('\n')); }
    run() {
      const extra = Object.fromEntries(this.files.slice(1).map(f => [f.name, f.text]));
      this.result = PY.run(this.files[0].text, this.stdin, { maxSteps: this.cfg.maxSteps || 5000, files: extra, args: this.cfg.args || [], main: this.files[0].name });
      this.editing = false;
      this.goto(this.result.trace.length - 1);
    }
    edit() { this.editing = true; this.render(); }
    goto(k) {
      if (!this.result) return;
      this.i = Math.max(0, Math.min(this.result.trace.length - 1, k));
      const t = this.result.trace[this.i];
      if (t) this.tab = t.file || 0;
      this.render();
    }
    reset() { this.result = null; this.i = 0; this.editing = true; this.initFiles(); this.stdin = this.cfg.stdin || ''; this.render(); }
    valHtml(v) { return v.ref != null ? `<span class="py-ref" data-ref="${v.ref}"><span class="py-dot"></span></span>` : `<span class="py-prim">${esc(v.v)}</span>`; }
    memHtml(cur, prev) {
      if (!cur) return '<div class="jv-empty">press ▶ Run, then step through the program</div>';
      const pv = new Map();
      if (prev) prev.frames.forEach((f, fi) => f.vars.forEach(v => pv.set(fi + '|' + v.name, v.ref != null ? '#' + v.ref : v.v)));
      const frames = cur.frames.map((f, fi) => {
        const rows = f.vars.map(v => {
          const key = fi + '|' + v.name, now = v.ref != null ? '#' + v.ref : v.v;
          const cls = prev ? (pv.has(key) ? (pv.get(key) !== now ? ' changed' : '') : ' new') : '';
          return `<tr class="py-var${cls}"><td class="py-name">${esc(v.name)}</td><td class="py-val">${this.valHtml(v)}</td></tr>`;
        }).join('');
        const top = fi === cur.frames.length - 1;
        return `<div class="jv-frame${top ? ' top' : ''}"><div class="jv-frame-name">${fi === 0 ? 'Global frame' : esc(f.name)}</div>${rows ? `<table class="py-tbl">${rows}</table>` : '<div class="jv-empty">no names yet</div>'}</div>`;
      }).join('');
      const prevObjs = new Map(prev ? prev.objs.map(o => [o.id, JSON.stringify(o)]) : []);
      const objs = cur.objs.map(o => {
        const changed = prev ? (prevObjs.has(o.id) ? (prevObjs.get(o.id) !== JSON.stringify(o) ? ' changed' : '') : ' new') : '';
        let inner;
        if (o.kind === 'seq') inner = o.items.length ? `<table class="py-seq"><tr>${o.items.map((_, k) => `<td class="py-idx">${k}</td>`).join('')}</tr><tr>${o.items.map(v => `<td>${this.valHtml(v)}</td>`).join('')}</tr></table>` : '<span class="py-empty">empty</span>';
        else if (o.kind === 'map') inner = o.items.length ? `<table class="py-map">${o.items.map(([k, v]) => `<tr><td>${this.valHtml(k)}</td><td>${this.valHtml(v)}</td></tr>`).join('')}</table>` : '<span class="py-empty">empty</span>';
        else if (o.kind === 'set') inner = o.items.length ? `<div class="py-setv">${o.items.map(v => `<span>${this.valHtml(v)}</span>`).join('')}</div>` : '<span class="py-empty">empty</span>';
        else if (o.kind === 'attrs') inner = o.items.length ? `<table class="py-map py-attrs">${o.items.map(([k, v]) => `<tr><td class="py-name">${esc(k)}</td><td>${this.valHtml(v)}</td></tr>`).join('')}</table>` : '<span class="py-empty">no attributes</span>';
        else inner = `<span class="py-label">${esc(o.label || '')}</span>`;
        const head = o.kind === 'attrs' ? o.label : o.kind === 'func' ? 'function ' + o.label : o.type;
        return `<div class="py-obj${changed}${o.unreachable ? ' unreachable' : ''}" data-oid="${o.id}"><div class="py-obj-head"><span>${esc(head)}</span><span class="py-rc" title="references to this object">refs ${o.rc}</span></div>${o.kind === 'func' ? '' : inner}${o.unreachable ? '<div class="py-garbage">unreachable: only a cycle keeps it alive until gc.collect()</div>' : ''}</div>`;
      }).join('');
      return `<div class="py-cols"><div class="py-col"><div class="c-sec-title">Frames</div>${frames}</div><div class="py-col"><div class="c-sec-title">Objects</div>${objs || '<div class="jv-empty">none yet</div>'}</div></div><svg class="py-arrows"></svg>`;
    }
    drawArrows() {
      const el = this.el; if (!el) return;
      const box = el.querySelector('.py-mem'); const svg = el.querySelector('.py-arrows');
      if (!box || !svg) return;
      const B = box.getBoundingClientRect();
      svg.style.width = '100%'; svg.setAttribute('height', box.scrollHeight);
      const paths = [];
      el.querySelectorAll('.py-mem .py-ref').forEach(r => {
        const t = el.querySelector(`.py-obj[data-oid="${r.dataset.ref}"]`); if (!t) return;
        const a = r.getBoundingClientRect(), b = t.getBoundingClientRect();
        const x1 = a.left + a.width / 2 - B.left + box.scrollLeft, y1 = a.top + a.height / 2 - B.top + box.scrollTop;
        const x2 = b.left - B.left + box.scrollLeft - 2, y2 = b.top + 12 - B.top + box.scrollTop;
        // side by side: enter the object from the left; stacked (phone): come down onto its top edge
        const below = x2 < x1 + 10;
        const tx = b.left - B.left + box.scrollLeft + 28, ty = b.top - B.top + box.scrollTop - 2;
        const d = below ? `M${x1},${y1} C${x1 + 40},${y1} ${tx},${ty - 40} ${tx},${ty}`
          : `M${x1},${y1} C${(x1 + x2) / 2},${y1} ${(x1 + x2) / 2},${y2} ${x2},${y2}`;
        paths.push(`<path d="${d}" marker-end="url(#py-head-${this.id})"/>`);
      });
      svg.innerHTML = `<defs><marker id="py-head-${this.id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>${paths.join('')}`;
    }
    render() {
      const el = this.el; if (!el) return;
      const file = this.files[this.tab] || this.files[0];
      const lines = file.text.split('\n');
      const tr = this.result ? this.result.trace : [];
      const cur = tr[this.i] || null;
      const last = !tr.length || this.i === tr.length - 1;
      const prev = this.i > 0 ? tr[this.i - 1] : null;
      const err = this.result && this.result.error;
      const onTab = t => t && (t.file || 0) === this.tab;
      const curLine = cur && onTab(cur) ? cur.line : null;
      const errLine = err && last && (err.file || 0) === this.tab ? err.line : null;
      const tabs = this.files.length > 1 ? `<div class="c-tabs">${this.files.map((f, k) => `<button class="c-tab${k === this.tab ? ' on' : ''}" data-tab="${k}">${esc(f.name)}</button>`).join('')}</div>` : '';
      const codeHtml = tabs + (this.editing
        ? `<textarea class="jv-editor" spellcheck="false" rows="${Math.max(3, lines.length + 1)}">${esc(file.text)}</textarea>`
        : `<pre class="jv-listing">${lines.map((l, k) => `<span class="jv-ln${curLine === k + 1 ? (cur.note === 'return' ? ' ret' : ' cur') : ''}${errLine === k + 1 ? ' err' : ''}"><span class="jv-no">${k + 1}</span>${highlight(l) || ' '}</span>`).join('')}</pre>`);
      const outText = cur ? this.result.out.slice(0, cur.outLen) : '';
      let errHtml = '';
      if (err && last) {
        const where = err.line ? `line ${err.line}${err.file ? ' of ' + this.files[err.file].name : ''}` : '';
        errHtml = err.kind === 'syntax'
          ? `<div class="jv-err"><b>${esc(err.name)}:</b> ${esc(err.message)}${where ? ` (${where})` : ''}</div>`
          : err.name === 'StepLimit' ? `<div class="jv-err"><b>Stopped:</b> ${esc(err.message)}</div>`
          : `<div class="jv-err">Traceback (most recent call last):${(err.stack || []).map(f => `<br>&nbsp;&nbsp;in ${esc(f.name)}`).join('')}${where ? `<br>&nbsp;&nbsp;at ${where}` : ''}<br><b>${esc(err.name)}${err.message ? ':' : ''}</b> ${esc(err.message)}</div>`;
      }
      const status = !this.result || this.editing ? '' : err && err.kind === 'syntax' ? 'did not run' : cur && cur.note === 'finished' ? 'program finished' : cur && cur.note === 'error' ? 'stopped by an exception' : `step ${this.i} of ${tr.length - 1}${cur && cur.line ? ` — ${cur.note === 'return' ? 'returning from' : 'about to run'} line ${cur.line}${cur.file ? ' of ' + this.files[cur.file].name : ''}` : ''}`;
      el.innerHTML = `
        <div class="jv-wrap c-wrap py-wrap">
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
          <div class="c-main">
            <div class="jv-code">${codeHtml}</div>
            <div class="jv-panel"><div class="jv-panel-title">Frames and objects</div><div class="py-mem">${err && err.kind === 'syntax' ? '<div class="jv-empty">the program has a syntax error, so nothing ran</div>' : this.memHtml(cur, prev)}</div></div>
            <div class="jv-panel"><div class="jv-panel-title">Output</div><pre class="jv-console">${esc(outText)}${cur && !last && !this.editing ? '<span class="jv-caret">▌</span>' : ''}</pre>${errHtml}</div>
          </div>
          ${this.usesStdin() ? `<div class="jv-stdin"><label>Input (one line per input() call):</label><textarea class="jv-stdin-box" rows="${Math.max(2, this.stdin.split('\n').length)}" spellcheck="false">${esc(this.stdin)}</textarea></div>` : ''}
        </div>`;
      el.querySelectorAll('[data-act]').forEach(b => b.addEventListener('click', () => this.act(b.dataset.act)));
      el.querySelectorAll('[data-tab]').forEach(b => b.addEventListener('click', () => { this.tab = +b.dataset.tab; this.render(); }));
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
      const mem = el.querySelector('.py-mem');
      if (mem) mem.addEventListener('scroll', () => this.drawArrows());
      // hovering an arrow's tail highlights its object
      el.querySelectorAll('.py-ref').forEach(r => {
        const t = () => el.querySelector(`.py-obj[data-oid="${r.dataset.ref}"]`);
        r.addEventListener('mouseenter', () => { const o = t(); if (o) o.classList.add('c-hit'); });
        r.addEventListener('mouseleave', () => { const o = t(); if (o) o.classList.remove('c-hit'); });
      });
      const curEl = el.querySelector('.jv-ln.cur, .jv-ln.ret');
      if (curEl && curEl.scrollIntoView && listing && listing.scrollHeight > listing.clientHeight) curEl.scrollIntoView({ block: 'nearest' });
      this.drawArrows();
      if (typeof requestAnimationFrame !== 'undefined') requestAnimationFrame(() => this.drawArrows());
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

  PY.mount = function (id, cfg) {
    const old = UIS[id]; if (old && typeof window !== 'undefined') window.removeEventListener('resize', old.onResize);
    const ui = new Stepper(id, cfg || {}); UIS[id] = ui; ui.render(); return ui;
  };
  PY.ui = id => UIS[id];

  if (typeof window !== 'undefined') window.PY = PY;
  if (typeof module !== 'undefined' && module.exports) module.exports = PY;
})();
