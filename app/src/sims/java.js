/* ── Java-subset interpreter + stepper (COMP 248) ───────────────────────────────
   Pure core (no DOM): JAVA.parse(code), JAVA.run(code, stdin, opts) → { trace, out, error }.
   UI: JAVA.mount(id, cfg) builds the stepper inside #sim-<id>; cfg = { code, stdin?, maxSteps? }.
   The subset is what a first Java course uses: primitives with Java int semantics, String,
   arrays, if/switch/loops, static and instance methods, classes with fields and constructors,
   System.out.print / println / printf, Math/Integer/Double/Character helpers, Scanner over a stdin box.
   Execution records a snapshot before every statement (line, call frames, output so far);
   the UI just walks the trace. */
(function () {
  'use strict';
  const JAVA = {};

  /* ════════════════════════════════════════════════════════════════
     1. Lexer
     ════════════════════════════════════════════════════════════════ */
  const KW = new Set(['class', 'public', 'private', 'protected', 'static', 'final', 'void', 'int', 'long', 'double',
    'float', 'boolean', 'char', 'byte', 'short', 'if', 'else', 'while', 'do', 'for', 'switch', 'case', 'default',
    'break', 'continue', 'return', 'new', 'this', 'null', 'true', 'false', 'import', 'package', 'extends',
    'implements', 'abstract', 'super', 'instanceof', 'try', 'catch', 'finally', 'throw', 'throws', 'interface', 'enum']);
  const PRIM = new Set(['int', 'long', 'double', 'float', 'boolean', 'char', 'byte', 'short']);
  const OPS = ['>>>=', '<<=', '>>=', '>>>', '...', '++', '--', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '==', '!=', '<=', '>=', '&&', '||',
    '<<', '>>', '->', '+', '-', '*', '/', '%', '=', '<', '>', '!', '~', '?', ':', '.', ',', ';', '(', ')', '{', '}', '[', ']', '&', '|', '^'];

  class JavaError extends Error {
    constructor(kind, msg, line) { super(msg); this.kind = kind; this.line = line; }
  }
  const compileError = (msg, line) => new JavaError('compile', msg, line);
  const runtimeError = (name, msg, line) => { const e = new JavaError('runtime', msg, line); e.name = name; return e; };

  const ESC = { n: '\n', t: '\t', r: '\r', b: '\b', f: '\f', '0': '\0', '\\': '\\', "'": "'", '"': '"' };

  function lex(src) {
    const toks = [];
    let i = 0, line = 1;
    const n = src.length;
    while (i < n) {
      const c = src[i];
      if (c === '\n') { line++; i++; continue; }
      if (c === ' ' || c === '\t' || c === '\r') { i++; continue; }
      if (c === '/' && src[i + 1] === '/') { while (i < n && src[i] !== '\n') i++; continue; }
      if (c === '/' && src[i + 1] === '*') {
        i += 2;
        while (i < n && !(src[i] === '*' && src[i + 1] === '/')) { if (src[i] === '\n') line++; i++; }
        i += 2; continue;
      }
      if (/[A-Za-z_$]/.test(c)) {
        let j = i; while (j < n && /[A-Za-z0-9_$]/.test(src[j])) j++;
        const w = src.slice(i, j);
        toks.push({ t: KW.has(w) ? 'kw' : 'id', v: w, line }); i = j; continue;
      }
      if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(src[i + 1] || ''))) {
        let j = i, isFloat = false;
        if (c === '0' && /[xX]/.test(src[i + 1] || '')) {
          j = i + 2; while (j < n && /[0-9a-fA-F_]/.test(src[j])) j++;
          const v = parseInt(src.slice(i + 2, j).replace(/_/g, ''), 16);
          let kind = 'int'; if (/[lL]/.test(src[j] || '')) { kind = 'long'; j++; }
          toks.push({ t: 'num', v, kind, line }); i = j; continue;
        }
        while (j < n && /[0-9_]/.test(src[j])) j++;
        if (src[j] === '.' && /[0-9]/.test(src[j + 1] || '')) { isFloat = true; j++; while (j < n && /[0-9_]/.test(src[j])) j++; }
        else if (src[j] === '.' && !/[A-Za-z_]/.test(src[j + 1] || '')) { isFloat = true; j++; }
        if (/[eE]/.test(src[j] || '') && /[0-9+-]/.test(src[j + 1] || '')) { isFloat = true; j++; if (/[+-]/.test(src[j])) j++; while (j < n && /[0-9]/.test(src[j])) j++; }
        let kind = isFloat ? 'double' : 'int';
        const suf = src[j] || '';
        if (/[fF]/.test(suf)) { kind = 'float'; j++; } else if (/[dD]/.test(suf)) { kind = 'double'; j++; } else if (/[lL]/.test(suf)) { kind = 'long'; j++; }
        const text = src.slice(i, j).replace(/[_fFdDlL]/g, '');
        const v = kind === 'int' || kind === 'long' ? parseInt(text, 10) : parseFloat(text);
        if (kind === 'int' && v > 2147483647) throw compileError('integer number too large', line);
        toks.push({ t: 'num', v, kind, line }); i = j; continue;
      }
      if (c === '"') {
        let j = i + 1, s = '';
        while (j < n && src[j] !== '"') {
          if (src[j] === '\n') throw compileError('unclosed string literal', line);
          if (src[j] === '\\') { const e = src[j + 1]; if (e === 'u') { s += String.fromCharCode(parseInt(src.substr(j + 2, 4), 16)); j += 6; continue; } s += ESC[e] !== undefined ? ESC[e] : e; j += 2; continue; }
          s += src[j++];
        }
        if (j >= n) throw compileError('unclosed string literal', line);
        toks.push({ t: 'str', v: s, line }); i = j + 1; continue;
      }
      if (c === "'") {
        let j = i + 1, ch;
        if (src[j] === '\\') { const e = src[j + 1]; if (e === 'u') { ch = String.fromCharCode(parseInt(src.substr(j + 2, 4), 16)); j += 6; } else { ch = ESC[e] !== undefined ? ESC[e] : e; j += 2; } }
        else { ch = src[j]; j++; }
        if (src[j] !== "'" || ch === undefined) throw compileError('unclosed character literal', line);
        toks.push({ t: 'char', v: ch.charCodeAt(0), line }); i = j + 1; continue;
      }
      const op = OPS.find(o => src.startsWith(o, i));
      if (!op) throw compileError(`illegal character: '${c}'`, line);
      toks.push({ t: 'op', v: op, line }); i += op.length;
    }
    toks.push({ t: 'eof', v: '<eof>', line });
    return toks;
  }

  /* ════════════════════════════════════════════════════════════════
     2. Parser → AST (plain objects; every statement carries its line)
     ════════════════════════════════════════════════════════════════ */
  class Parser {
    constructor(toks) { this.toks = toks; this.p = 0; }
    peek(k = 0) { return this.toks[this.p + k]; }
    next() { return this.toks[this.p++]; }
    is(v, k = 0) { const t = this.peek(k); return t.v === v && (t.t === 'op' || t.t === 'kw'); }
    accept(v) { if (this.is(v)) { this.p++; return true; } return false; }
    expect(v) {
      if (!this.is(v)) { const t = this.peek(); throw compileError(`'${v}' expected` + (t.t === 'eof' ? ' (reached end of file while parsing)' : `, found '${t.v}'`), t.line); }
      return this.next();
    }
    ident() { const t = this.peek(); if (t.t !== 'id') throw compileError(`<identifier> expected, found '${t.v}'`, t.line); return this.next().v; }

    // ── program ──
    program() {
      const unit = { classes: [], snippet: null };
      while (this.is('import') || this.is('package')) { while (!this.is(';')) this.next(); this.next(); }
      const hasClass = this.toks.some(t => t.t === 'kw' && (t.v === 'class' || t.v === 'interface' || t.v === 'enum'));
      if (hasClass) {
        while (this.peek().t !== 'eof') unit.classes.push(this.classDecl());
      } else {
        // snippet: statements and helper methods of an implicit class, run as main
        const cls = { name: 'Main', fields: [], methods: [], ctors: [], line: 1 };
        const body = [];
        while (this.peek().t !== 'eof') {
          if (this.looksLikeMethod()) cls.methods.push(this.methodDecl(this.modifiers(), cls.name));
          else body.push(this.statement());
        }
        cls.methods.push({ name: 'main', params: [], ret: 'void', static: true, body: { k: 'Block', body, line: 1 }, line: 1 });
        unit.classes.push(cls);
        unit.snippet = true;
      }
      return unit;
    }
    modifiers() {
      const m = { static: false, final: false, access: null };
      for (;;) {
        if (this.is('static')) { m.static = true; this.next(); }
        else if (this.is('final')) { m.final = true; this.next(); }
        else if (this.is('public') || this.is('private') || this.is('protected')) { m.access = this.next().v; }
        else if (this.is('abstract')) { this.next(); }
        else return m;
      }
    }
    looksLikeMethod() {
      let k = 0;
      while (['static', 'public', 'private', 'protected', 'final'].includes(this.peek(k).v) && this.peek(k).t === 'kw') k++;
      const t = this.peek(k);
      if (!(t.t === 'id' || (t.t === 'kw' && (PRIM.has(t.v) || t.v === 'void')))) return false;
      k++;
      while (this.is('[', k) && this.is(']', k + 1)) k += 2;
      return this.peek(k).t === 'id' && this.is('(', k + 1);
    }
    classDecl() {
      const line = this.peek().line;
      this.modifiers();
      if (this.is('interface') || this.is('enum')) throw compileError(`${this.peek().v} declarations are not supported here (COMP 249 material)`, line);
      this.expect('class');
      const name = this.ident();
      if (this.is('extends') || this.is('implements')) throw compileError('inheritance and interfaces are not supported here (COMP 249 material)', this.peek().line);
      this.expect('{');
      const cls = { name, fields: [], methods: [], ctors: [], line };
      while (!this.is('}')) {
        const mline = this.peek().line;
        const mods = this.modifiers();
        if (this.is('{')) { // initializer block: treat as static/instance init statements
          const blk = this.block();
          cls.fields.push({ init: blk, static: mods.static, block: true, line: mline });
          continue;
        }
        if (this.peek().t === 'id' && this.peek().v === name && this.is('(', 1)) {
          this.next();
          const params = this.params();
          const body = this.block();
          cls.ctors.push({ params, body, line: mline });
          continue;
        }
        const type = this.type();
        const fname = this.ident();
        if (this.is('(')) {
          this.p--; // unread name
          cls.methods.push(this.methodDecl(mods, name, type, mline));
        } else {
          for (;;) {
            let ftype = type;
            while (this.accept('[')) { this.expect(']'); ftype += '[]'; }
            const init = this.accept('=') ? this.varInit(ftype) : null;
            cls.fields.push({ name: fname === undefined ? this.ident() : fname, type: ftype, init, static: mods.static, final: mods.final, line: mline });
            if (!this.accept(',')) break;
            fname === undefined; // keep lints quiet
            const nn = this.ident(); cls.fields[cls.fields.length] = undefined; cls.fields.length--; // placeholder removed below
            let t2 = type; while (this.accept('[')) { this.expect(']'); t2 += '[]'; }
            const init2 = this.accept('=') ? this.varInit(t2) : null;
            cls.fields.push({ name: nn, type: t2, init: init2, static: mods.static, final: mods.final, line: mline });
            if (!this.accept(',')) break;
          }
          this.expect(';');
        }
      }
      this.expect('}');
      return cls;
    }
    methodDecl(mods, clsName, type, line) {
      if (type === undefined) { line = this.peek().line; type = this.type(); }
      const name = this.ident();
      const params = this.params();
      if (this.is('throws')) { this.next(); this.ident(); while (this.accept(',')) this.ident(); }
      const body = this.block();
      return { name, params, ret: type, static: mods.static, body, line };
    }
    params() {
      this.expect('(');
      const ps = [];
      if (!this.is(')')) {
        do {
          this.accept('final');
          let type = this.type();
          if (this.accept('...')) type += '[]';
          const name = this.ident();
          while (this.accept('[')) { this.expect(']'); type += '[]'; }
          ps.push({ type, name });
        } while (this.accept(','));
      }
      this.expect(')');
      return ps;
    }
    type() {
      const t = this.peek();
      let name;
      if (t.t === 'kw' && (PRIM.has(t.v) || t.v === 'void')) name = this.next().v;
      else if (t.t === 'id') { name = this.next().v; while (this.is('.') && this.peek(1).t === 'id') { this.next(); name = this.next().v; } }
      else throw compileError(`<identifier> expected, found '${t.v}'`, t.line);
      if (this.is('<')) throw compileError('generic types are not supported here (COMP 249 material)', t.line);
      while (this.is('[') && this.is(']', 1)) { this.next(); this.next(); name += '[]'; }
      return name;
    }
    isTypeStart(k = 0) {
      const t = this.peek(k);
      if (t.t === 'kw' && PRIM.has(t.v)) return true;
      if (t.t !== 'id') return false;
      // Name [ ] ... ident  |  Name ident
      let j = k + 1;
      while (this.is('[', j) && this.is(']', j + 1)) j += 2;
      return this.peek(j).t === 'id';
    }
    block() {
      const line = this.expect('{').line;
      const body = [];
      while (!this.is('}')) { if (this.peek().t === 'eof') throw compileError("reached end of file while parsing ('}' expected)", this.peek().line); body.push(this.statement()); }
      this.expect('}');
      return { k: 'Block', body, line };
    }
    varInit(type) {
      if (this.is('{')) return this.arrayInit(type);
      return this.expr();
    }
    arrayInit(type) {
      const line = this.expect('{').line;
      const elems = [];
      const et = type.endsWith('[]') ? type.slice(0, -2) : type;
      while (!this.is('}')) { elems.push(this.is('{') ? this.arrayInit(et) : this.expr()); if (!this.accept(',')) break; }
      this.expect('}');
      return { k: 'ArrayInit', type, elems, line };
    }
    localDecl(mods) {
      const line = this.peek().line;
      const type = this.type();
      const decls = [];
      do {
        const name = this.ident();
        let vt = type; while (this.accept('[')) { this.expect(']'); vt += '[]'; }
        const init = this.accept('=') ? this.varInit(vt) : null;
        decls.push({ name, type: vt, init });
      } while (this.accept(','));
      return { k: 'VarDecl', decls, final: mods.final, line };
    }
    statement() {
      const t = this.peek(), line = t.line;
      if (this.is('{')) return this.block();
      if (this.accept(';')) return { k: 'Empty', line };
      if (this.is('final')) { const m = this.modifiers(); const d = this.localDecl(m); this.expect(';'); return d; }
      if (t.t === 'kw') {
        switch (t.v) {
          case 'if': {
            this.next(); this.expect('('); const cond = this.expr(); this.expect(')');
            const then = this.statement();
            const els = this.accept('else') ? this.statement() : null;
            return { k: 'If', cond, then, els, line };
          }
          case 'while': { this.next(); this.expect('('); const cond = this.expr(); this.expect(')'); return { k: 'While', cond, body: this.statement(), line }; }
          case 'do': { this.next(); const body = this.statement(); this.expect('while'); this.expect('('); const cond = this.expr(); this.expect(')'); this.expect(';'); return { k: 'DoWhile', cond, body, line }; }
          case 'for': {
            this.next(); this.expect('(');
            if (this.isTypeStart() && this.is(':', this.forEachColon())) {
              const type = this.type(); const name = this.ident(); this.expect(':'); const iter = this.expr(); this.expect(')');
              return { k: 'ForEach', type, name, iter, body: this.statement(), line };
            }
            let init = null;
            if (!this.is(';')) init = this.isTypeStart() ? this.localDecl({ final: false }) : { k: 'ExprList', exprs: this.exprList(), line };
            this.expect(';');
            const cond = this.is(';') ? null : this.expr(); this.expect(';');
            const update = this.is(')') ? [] : this.exprList(); this.expect(')');
            return { k: 'For', init, cond, update, body: this.statement(), line };
          }
          case 'switch': {
            this.next(); this.expect('('); const subject = this.expr(); this.expect(')'); this.expect('{');
            const cases = [];
            while (!this.is('}')) {
              const cline = this.peek().line;
              let labels = [], isDefault = false;
              if (this.accept('default')) { isDefault = true; }
              else { this.expect('case'); labels.push(this.expr()); while (this.accept(',')) labels.push(this.expr()); }
              if (this.is('->')) throw compileError("arrow-form switch is not supported here; use 'case x:' with break", cline);
              this.expect(':');
              const body = [];
              while (!this.is('case') && !this.is('default') && !this.is('}')) body.push(this.statement());
              cases.push({ labels, isDefault, body, line: cline });
            }
            this.expect('}');
            return { k: 'Switch', subject, cases, line };
          }
          case 'break': this.next(); this.expect(';'); return { k: 'Break', line };
          case 'continue': this.next(); this.expect(';'); return { k: 'Continue', line };
          case 'return': { this.next(); const value = this.is(';') ? null : this.expr(); this.expect(';'); return { k: 'Return', value, line }; }
          case 'try': case 'throw': throw compileError('exceptions (try/throw) are not supported here (COMP 249 material)', line);
          case 'class': throw compileError('a class cannot be declared inside a method', line);
        }
      }
      if (this.isTypeStart()) { const d = this.localDecl({ final: false }); this.expect(';'); return d; }
      const e = this.expr();
      this.expect(';');
      return { k: 'ExprStmt', expr: e, line };
    }
    forEachColon() { // index of ':' after "Type name" in a for header, or -1
      let k = 0; while (this.is('[', k) || this.is(']', k) || this.peek(k).t === 'id' || (this.peek(k).t === 'kw' && PRIM.has(this.peek(k).v))) { k++; if (k > 6) break; }
      return k;
    }
    exprList() { const xs = [this.expr()]; while (this.accept(',')) xs.push(this.expr()); return xs; }

    // ── expressions (precedence climbing) ──
    expr() { return this.assign(); }
    assign() {
      const l = this.ternary();
      const t = this.peek();
      if (t.t === 'op' && ['=', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^='].includes(t.v)) {
        this.next();
        const r = this.assign();
        if (!['Name', 'Index', 'Member'].includes(l.k)) throw compileError('unexpected type: required variable, found value', t.line);
        return { k: 'Assign', op: t.v, target: l, value: r, line: t.line };
      }
      return l;
    }
    ternary() {
      const c = this.binary(0);
      if (this.is('?')) { const line = this.next().line; const a = this.assign(); this.expect(':'); const b = this.assign(); return { k: 'Cond', cond: c, a, b, line }; }
      return c;
    }
    binary(level) {
      const LEVELS = [['||'], ['&&'], ['|'], ['^'], ['&'], ['==', '!='], ['<', '>', '<=', '>='], ['+', '-'], ['*', '/', '%']];
      if (level >= LEVELS.length) return this.unary();
      let l = this.binary(level + 1);
      for (;;) {
        const t = this.peek();
        if (t.t === 'op' && LEVELS[level].includes(t.v)) { this.next(); const r = this.binary(level + 1); l = { k: 'Bin', op: t.v, l, r, line: t.line }; }
        else if (level === 6 && t.t === 'kw' && t.v === 'instanceof') throw compileError('instanceof is not supported here', t.line);
        else return l;
      }
    }
    unary() {
      const t = this.peek();
      if (t.t === 'op') {
        if (t.v === '++' || t.v === '--') { this.next(); const e = this.unary(); return { k: 'IncDec', op: t.v, prefix: true, target: e, line: t.line }; }
        if (t.v === '-' || t.v === '+' || t.v === '!' || t.v === '~') { this.next(); return { k: 'Unary', op: t.v, e: this.unary(), line: t.line }; }
        if (t.v === '(' && this.peek(1).t === 'kw' && PRIM.has(this.peek(1).v) && this.is(')', 2)) {
          this.next(); const type = this.next().v; this.next();
          return { k: 'Cast', type, e: this.unary(), line: t.line };
        }
        if (t.v === '(' && this.peek(1).t === 'id' && this.is(')', 2) && (this.peek(3).t === 'id' || this.peek(3).t === 'str' || this.is('(', 3) || this.is('new', 3))) {
          this.next(); const type = this.next().v; this.next();
          return { k: 'Cast', type, e: this.unary(), line: t.line };
        }
      }
      return this.postfix(this.primary());
    }
    postfix(e) {
      for (;;) {
        const t = this.peek();
        if (this.is('.')) {
          this.next();
          const name = this.ident();
          if (this.is('(')) e = { k: 'Call', target: e, name, args: this.args(), line: t.line };
          else e = { k: 'Member', target: e, name, line: t.line };
        } else if (this.is('[')) {
          this.next(); const idx = this.expr(); this.expect(']');
          e = { k: 'Index', target: e, index: idx, line: t.line };
        } else if (this.is('++') || this.is('--')) {
          this.next(); e = { k: 'IncDec', op: t.v, prefix: false, target: e, line: t.line };
        } else return e;
      }
    }
    args() {
      this.expect('(');
      const xs = [];
      if (!this.is(')')) { do xs.push(this.expr()); while (this.accept(',')); }
      this.expect(')');
      return xs;
    }
    primary() {
      const t = this.next(), line = t.line;
      switch (t.t) {
        case 'num': return { k: 'Lit', type: t.kind, v: t.v, line };
        case 'str': return { k: 'Lit', type: 'String', v: t.v, line };
        case 'char': return { k: 'Lit', type: 'char', v: t.v, line };
        case 'id':
          if (this.is('(')) return { k: 'Call', target: null, name: t.v, args: this.args(), line };
          return { k: 'Name', name: t.v, line };
        case 'kw':
          if (t.v === 'true' || t.v === 'false') return { k: 'Lit', type: 'boolean', v: t.v === 'true', line };
          if (t.v === 'null') return { k: 'Lit', type: 'null', v: null, line };
          if (t.v === 'this') {
            if (this.is('(')) return { k: 'Call', target: null, name: 'this', args: this.args(), line };
            return { k: 'This', line };
          }
          if (t.v === 'new') {
            const base = this.peek().t === 'kw' && PRIM.has(this.peek().v) ? this.next().v : this.ident();
            if (this.is('[')) {
              const dims = [];
              let type = base;
              while (this.is('[')) {
                this.next();
                if (this.is(']')) { this.next(); type += '[]'; dims.push(null); }
                else { dims.push(this.expr()); this.expect(']'); type += '[]'; }
              }
              if (this.is('{')) return this.arrayInit(type);
              return { k: 'NewArray', type, dims, line };
            }
            return { k: 'New', cls: base, args: this.args(), line };
          }
          if (PRIM.has(t.v) && this.is('.')) { this.next(); this.expect('class'); return { k: 'Lit', type: 'String', v: t.v, line }; }
          throw compileError(`illegal start of expression: '${t.v}'`, line);
        case 'op':
          if (t.v === '(') { const e = this.expr(); this.expect(')'); return e; }
          throw compileError(`illegal start of expression: '${t.v}'`, line);
        default: throw compileError('reached end of file while parsing', line);
      }
    }
  }

  JAVA.parse = function (code) { return new Parser(lex(code)).program(); };

  /* ════════════════════════════════════════════════════════════════
     3. Values and types
     ════════════════════════════════════════════════════════════════ */
  // A value is { t, v }. t: 'int' 'long' 'double' 'float' 'boolean' 'char' 'String' 'null' | 'T[]' | class name | 'Scanner'.
  // char.v is a code unit; String.v is text and String.id an identity (literals interned by text);
  // arrays/objects: v = { id, elems } / { id, cls, fields }.
  const V = (t, v) => ({ t, v });
  const NULL = V('null', null);
  const NUMERIC = new Set(['int', 'long', 'double', 'float', 'char', 'byte', 'short']);
  const INTEGRAL = new Set(['int', 'long', 'char', 'byte', 'short']);
  const isNum = t => NUMERIC.has(t);
  const isRef = t => !NUMERIC.has(t) && t !== 'boolean';
  let nextId = 1;
  const str = (text, id) => ({ t: 'String', v: text, id: id === undefined ? 'S' + (nextId++) : id });
  const lit = text => str(text, 'L:' + text);
  const isDefault = t => isNum(t) ? V(t, 0) : t === 'boolean' ? V('boolean', false) : NULL;

  function promote(a, b) {
    if (a === 'double' || b === 'double') return 'double';
    if (a === 'float' || b === 'float') return 'float';
    if (a === 'long' || b === 'long') return 'long';
    return 'int';
  }
  const wrapInt = x => x | 0;
  function fmtDouble(x, isFloat) {
    if (Number.isNaN(x)) return 'NaN';
    if (x === Infinity) return 'Infinity'; if (x === -Infinity) return '-Infinity';
    if (isFloat) x = Math.fround(x), x = parseFloat(x.toPrecision(8));
    const a = Math.abs(x);
    if (a === 0) return Object.is(x, -0) ? '-0.0' : '0.0';
    if (a >= 1e-3 && a < 1e7) { const s = String(x); return /[.eE]/.test(s) ? s : s + '.0'; }
    const [m, e] = x.toExponential().split('e');
    return (m.includes('.') ? m : m + '.0') + 'E' + e.replace('+', '');
  }
  // Java's string conversion of a value (used by + and print)
  function* toStr(val, ctx, line) {
    switch (val.t) {
      case 'String': return val.v;
      case 'null': return 'null';
      case 'char': return String.fromCharCode(val.v);
      case 'boolean': return val.v ? 'true' : 'false';
      case 'double': return fmtDouble(val.v, false);
      case 'float': return fmtDouble(val.v, true);
      case 'int': case 'long': case 'byte': case 'short': return String(val.v);
      case 'Scanner': return 'java.util.Scanner';
    }
    if (val.t.endsWith('[]')) return `[${val.t.startsWith('int') || val.t.startsWith('String') ? (val.t.startsWith('int') ? 'I' : 'Ljava.lang.String;') : val.t[0].toUpperCase()}@${(val.v.id * 2654435).toString(16).slice(0, 7)}`;
    const cls = ctx.classes[val.t];
    if (cls) {
      const m = findMethod(cls, 'toString', [], line, true);
      if (m) { const r = yield* ctx.invoke(cls, m, val, [], line); return r.v; }
      return `${val.t}@${(val.v.id * 2654435).toString(16).slice(0, 7)}`;
    }
    return String(val.v);
  }
  // Short display of a value for the variables panel (no user code is run)
  function show(val, depth = 0) {
    if (val.v === null || val.v === undefined) return isNum(val.t) || val.t === 'boolean' ? '?' : 'null';
    switch (val.t) {
      case 'String': return JSON.stringify(val.v);
      case 'null': return 'null';
      case 'char': return "'" + String.fromCharCode(val.v).replace('\n', '\\n').replace('\t', '\\t') + "'";
      case 'boolean': return val.v ? 'true' : 'false';
      case 'double': return fmtDouble(val.v, false);
      case 'float': return fmtDouble(val.v, true);
      case 'int': case 'long': case 'byte': case 'short': return String(val.v);
      case 'Scanner': return 'Scanner#' + val.v.id;
    }
    if (val.t.endsWith('[]')) {
      const et = val.t.slice(0, -2);
      if (depth > 1) return `${val.t}#${val.v.id}`;
      const items = val.v.elems.slice(0, 12).map(e => show(tagElem(et, e), depth + 1));
      if (val.v.elems.length > 12) items.push(`… (${val.v.elems.length})`);
      return `#${val.v.id} [${items.join(', ')}]`;
    }
    if (depth > 1) return `${val.t}#${val.v.id}`;
    const fs = Object.entries(val.v.fields).map(([k, v]) => `${k}=${show(v, depth + 1)}`);
    return `${val.t}#${val.v.id}{${fs.join(', ')}}`;
  }
  const tagElem = (et, raw) => (raw && typeof raw === 'object' && 't' in raw) ? raw : V(et, raw);

  // Can a value of type `from` be stored in a slot of type `to` (assignment context)?
  function assignable(val, to, ctx) {
    const from = val.t;
    if (from === to) return true;
    if (from === 'null') return isRef(to) && to !== 'String' ? true : to === 'String';
    const widen = { byte: ['short', 'int', 'long', 'float', 'double'], short: ['int', 'long', 'float', 'double'], char: ['int', 'long', 'float', 'double'],
      int: ['long', 'float', 'double'], long: ['float', 'double'], float: ['double'] };
    if (widen[from] && widen[from].includes(to)) return true;
    // int constant → byte/short/char is allowed by javac when it fits; we allow any int → char/byte/short with a literal-ish check
    if (from === 'int' && (to === 'char' || to === 'byte' || to === 'short') && val.constant) return true;
    return false;
  }
  function convert(val, to) {
    if (val.t === to || !isNum(to)) return val.t === to ? val : V(to === 'String' && val.t === 'null' ? 'null' : val.t, val.v);
    let x = val.v;
    switch (to) {
      case 'int': x = wrapInt(Number.isFinite(x) ? Math.trunc(x) : (Number.isNaN(x) ? 0 : (x > 0 ? 2147483647 : -2147483648))); break;
      case 'long': x = Number.isFinite(x) ? Math.trunc(x) : (Number.isNaN(x) ? 0 : x); break;
      case 'char': x = Math.trunc(x) & 0xffff; break;
      case 'byte': x = (Math.trunc(x) << 24) >> 24; break;
      case 'short': x = (Math.trunc(x) << 16) >> 16; break;
      case 'float': x = Math.fround(x); break;
      case 'double': x = Number(x); break;
    }
    return V(to, x);
  }
  const typeName = t => t === 'null' ? '<null>' : t;

  /* ════════════════════════════════════════════════════════════════
     4. Interpreter (generators: `yield` = one recorded step)
     ════════════════════════════════════════════════════════════════ */
  class Env {
    constructor(parent, frame) { this.vars = new Map(); this.parent = parent; this.frame = frame || (parent && parent.frame); }
    lookup(name) { for (let e = this; e; e = e.parent) { if (e.vars.has(name)) return e.vars.get(name); if (e.frame && e === e.frame.env) break; } return null; }
    declare(name, type, val, isFinal, line) {
      for (let e = this; e; e = e.parent) { if (e.vars.has(name)) throw compileError(`variable ${name} is already defined in method ${this.frame.name}`, line); if (e.frame && e === e.frame.env) break; }
      const slot = { t: type, v: val, final: !!isFinal, name };
      this.vars.set(name, slot); return slot;
    }
  }
  const BREAK = { sig: 'break' }, CONTINUE = { sig: 'continue' };

  function findMethod(cls, name, args, line, quiet) {
    const cands = cls.methods.filter(m => m.name === name && m.params.length === args.length);
    if (!cands.length) {
      if (quiet) return null;
      const any = cls.methods.filter(m => m.name === name);
      if (any.length) throw compileError(`method ${name} in class ${cls.name} cannot be applied to given types: required ${any[0].params.map(p => p.type).join(',') || 'no arguments'}, found ${args.map(a => typeName(a.t)).join(',') || 'no arguments'}`, line);
      throw compileError(`cannot find symbol: method ${name}(${args.map(a => typeName(a.t)).join(',')}) in class ${cls.name}`, line);
    }
    return pickOverload(cands, args, name, line);
  }
  function pickOverload(cands, args, name, line) {
    let best = null, bestScore = -1;
    for (const m of cands) {
      let score = 0, ok = true;
      m.params.forEach((p, i) => {
        const a = args[i];
        if (a.t === p.type) score += 3;
        else if (assignable(a, p.type)) score += (a.t === 'null' ? 2 : 1);
        else ok = false;
      });
      if (ok && score > bestScore) { best = m; bestScore = score; }
    }
    if (!best) throw compileError(`no suitable ${name === '<init>' ? 'constructor' : 'method'} found for ${name}(${args.map(a => typeName(a.t)).join(',')})`, line);
    return best;
  }

  class Interp {
    constructor(unit, stdin, opts) {
      this.unit = unit; this.classes = {}; unit.classes.forEach(c => { this.classes[c.name] = c; c.statics = {}; });
      this.stdin = stdin || ''; this.stdinPos = 0;
      this.out = '';
      this.stack = [];
      this.steps = 0; this.maxSteps = (opts && opts.maxSteps) || 5000;
      this.trace = [];
      this.maxDepth = 200;
    }
    // ── snapshots ──
    snap(line, note) {
      const frames = [];
      const statics = [];
      for (const c of this.unit.classes) for (const [k, slot] of Object.entries(c.statics)) statics.push([`${c.name}.${k}`, show(slot)]);
      if (statics.length) frames.push({ name: 'static fields', vars: statics, kind: 'static' });
      for (const f of this.stack) {
        const vars = [];
        if (f.self) vars.push(['this', show(f.self)]);
        const scopes = []; // outermost first, so main's variables come before a loop's
        for (let e = f.scope || f.env; e; e = e.parent) { scopes.unshift(e); if (e === f.env) break; }
        for (const e of scopes) for (const s of e.vars.values()) vars.push([s.name, show(s)]);
        frames.push({ name: f.name, vars });
      }
      this.trace.push({ line, frames, outLen: this.out.length, note: note || null });
    }
    *step(line, env) {
      if (++this.steps > this.maxSteps) throw runtimeError('StepLimit', `stopped after ${this.maxSteps} steps — is there an infinite loop?`, line);
      if (env) env.frame.scope = env;
      this.snap(line);
      yield null;
    }
    // ── entry ──
    *runMain() {
      const mainCls = this.unit.classes.find(c => c.methods.some(m => m.name === 'main' && m.static));
      if (!mainCls) throw compileError('no class with a "public static void main(String[] args)" method', 1);
      // static field initialisers, in order
      for (const c of this.unit.classes) for (const f of c.fields) if (f.static) {
        if (f.block) { yield* this.execBlockIn(f.init, new Env(null, this.pushFrame(`static init of ${c.name}`, null)), true); this.stack.pop(); continue; }
        c.statics[f.name] = { t: f.type, v: isDefault(f.type).v, final: f.final, name: f.name };
        if (f.init) { const v = yield* this.evalIn(f.init, new Env(null, this.pushFrame(`static init of ${c.name}`, null))); this.stack.pop(); this.store(c.statics[f.name], v, f.line, true); }
      }
      const main = mainCls.methods.find(m => m.name === 'main' && m.static);
      const args = main.params.length ? [V('String[]', { id: nextId++, elems: [] })] : [];
      yield* this.invoke(mainCls, main, null, args, main.line);
    }
    pushFrame(name, self) {
      if (this.stack.length >= this.maxDepth) throw runtimeError('StackOverflowError', 'too many nested method calls', 0);
      const frame = { name, self, env: null, scope: null };
      frame.env = new Env(null, frame);
      this.stack.push(frame);
      return frame;
    }
    *invoke(cls, m, self, args, line) {
      const frame = this.pushFrame(`${m.name === '<init>' ? cls.name : m.name}(${m.params.map(p => p.type).join(', ')})`, self);
      frame.cls = cls;
      m.params.forEach((p, i) => frame.env.declare(p.name, p.type, convert(args[i], p.type).v, false, line));
      const sig = yield* this.execBlockIn(m.body, frame.env, true);
      if (this.stack.length === 1 && m.name === 'main') this.snap(null, 'finished'); // main's variables stay visible at the end
      this.stack.pop();
      if (sig && sig.sig === 'return') {
        if (m.ret === 'void') throw compileError('incompatible types: unexpected return value', sig.line);
        return sig.value;
      }
      if (m.ret !== 'void' && m.name !== '<init>') throw compileError(`missing return statement in ${m.name}`, m.line);
      return V('void', undefined);
    }
    *execBlockIn(block, env, sameScope) {
      const inner = sameScope ? env : new Env(env);
      for (const s of block.body) { const sig = yield* this.exec(s, inner); if (sig) return sig; }
      return null;
    }
    *evalIn(e, env) { return yield* this.eval(e, env); }
    store(slot, val, line, init) {
      if (slot.final && !init && slot.assigned) throw compileError(`cannot assign a value to final variable ${slot.name}`, line);
      if (!assignable(val, slot.t, this)) {
        if (isNum(val.t) && isNum(slot.t)) throw compileError(`incompatible types: possible lossy conversion from ${val.t} to ${slot.t}`, line);
        throw compileError(`incompatible types: ${typeName(val.t)} cannot be converted to ${slot.t}`, line);
      }
      const c = convert(val, slot.t);
      slot.v = c.v; if (c.t === 'String') slot.id = c.id; slot.assigned = true;
      return c;
    }
    read(slot) { if (slot.v === null) return NULL; const v = V(slot.t, slot.v); if (slot.t === 'String') v.id = slot.id; return v; }

    // ── statements ──
    *exec(s, env) {
      switch (s.k) {
        case 'Block': return yield* this.execBlockIn(s, env, false);
        case 'Empty': return null;
        case 'VarDecl': {
          yield* this.step(s.line, env);
          for (const d of s.decls) {
            const slot = env.declare(d.name, d.type, isDefault(d.type).v, s.final, s.line);
            slot.assigned = false;
            if (d.init) { const v = yield* this.eval(d.init, env, d.type); this.store(slot, v, s.line, true); }
            else slot.uninit = true;
          }
          return null;
        }
        case 'ExprStmt': {
          yield* this.step(s.line, env);
          if (!['Assign', 'IncDec', 'Call', 'New'].includes(s.expr.k)) throw compileError('not a statement', s.line);
          yield* this.eval(s.expr, env);
          return null;
        }
        case 'If': {
          yield* this.step(s.line, env);
          const c = yield* this.evalBool(s.cond, env);
          if (c) return yield* this.exec(s.then, new Env(env));
          if (s.els) return yield* this.exec(s.els, new Env(env));
          return null;
        }
        case 'While': {
          for (;;) {
            yield* this.step(s.line, env);
            if (!(yield* this.evalBool(s.cond, env))) return null;
            const sig = yield* this.exec(s.body, new Env(env));
            if (sig === BREAK) return null;
            if (sig && sig.sig === 'return') return sig;
          }
        }
        case 'DoWhile': {
          for (;;) {
            const sig = yield* this.exec(s.body, new Env(env));
            if (sig === BREAK) return null;
            if (sig && sig.sig === 'return') return sig;
            yield* this.step(s.line, env);
            if (!(yield* this.evalBool(s.cond, env))) return null;
          }
        }
        case 'For': {
          const scope = new Env(env);
          yield* this.step(s.line, env);
          if (s.init) {
            if (s.init.k === 'VarDecl') { for (const d of s.init.decls) { const slot = scope.declare(d.name, d.type, isDefault(d.type).v, false, s.line); if (d.init) this.store(slot, yield* this.eval(d.init, scope, d.type), s.line, true); } }
            else for (const e of s.init.exprs) yield* this.eval(e, scope);
          }
          let first = true;
          for (;;) {
            if (!first) { yield* this.step(s.line, scope); for (const u of s.update) yield* this.eval(u, scope); }
            first = false;
            if (s.cond && !(yield* this.evalBool(s.cond, scope))) return null;
            const sig = yield* this.exec(s.body, new Env(scope));
            if (sig === BREAK) return null;
            if (sig && sig.sig === 'return') return sig;
          }
        }
        case 'ForEach': {
          yield* this.step(s.line, env);
          const arr = yield* this.eval(s.iter, env);
          if (arr.t === 'null') throw runtimeError('NullPointerException', 'Cannot read the array length because the array is null', s.line);
          if (!arr.t.endsWith('[]')) throw compileError(`for-each not applicable to expression type ${arr.t}`, s.line);
          const et = arr.t.slice(0, -2);
          const elems = arr.v.elems;
          for (let i = 0; i < elems.length; i++) {
            if (i > 0) yield* this.step(s.line, env);
            const scope = new Env(env);
            const slot = scope.declare(s.name, s.type, isDefault(s.type).v, false, s.line);
            this.store(slot, tagElem(et, elems[i]), s.line, true);
            const sig = yield* this.exec(s.body, scope);
            if (sig === BREAK) return null;
            if (sig && sig.sig === 'return') return sig;
          }
          return null;
        }
        case 'Switch': {
          yield* this.step(s.line, env);
          const subj = yield* this.eval(s.subject, env);
          let start = -1;
          for (let i = 0; i < s.cases.length && start < 0; i++) {
            for (const lab of s.cases[i].labels) {
              const lv = yield* this.eval(lab, env);
              if (this.equalsValue(subj, lv, true)) { start = i; break; }
            }
          }
          if (start < 0) start = s.cases.findIndex(c => c.isDefault);
          if (start < 0) return null;
          const scope = new Env(env);
          for (let i = start; i < s.cases.length; i++) {
            for (const st of s.cases[i].body) {
              const sig = yield* this.exec(st, scope);
              if (sig === BREAK) return null;
              if (sig) return sig;
            }
          }
          return null;
        }
        case 'Break': yield* this.step(s.line, env); return BREAK;
        case 'Continue': yield* this.step(s.line, env); return CONTINUE;
        case 'Return': {
          yield* this.step(s.line, env);
          const value = s.value ? yield* this.eval(s.value, env) : V('void', undefined);
          return { sig: 'return', value, line: s.line };
        }
        default: throw compileError(`unsupported statement ${s.k}`, s.line);
      }
    }
    *evalBool(e, env) {
      const v = yield* this.eval(e, env);
      if (v.t !== 'boolean') throw compileError(`incompatible types: ${typeName(v.t)} cannot be converted to boolean`, e.line);
      return v.v;
    }
    equalsValue(a, b, strict) {
      if (isNum(a.t) && isNum(b.t)) return a.v === b.v;
      if (a.t === 'boolean' && b.t === 'boolean') return a.v === b.v;
      if (a.t === 'String' && b.t === 'String') return strict ? a.v === b.v : a.id === b.id;
      if (a.t === 'null' || b.t === 'null') return a.t === b.t;
      if (a.v && b.v && typeof a.v === 'object' && typeof b.v === 'object') return a.v.id === b.v.id;
      return false;
    }

    // ── expressions ──
    *eval(e, env, hint) {
      switch (e.k) {
        case 'Lit': {
          if (e.type === 'String') return lit(e.v);
          const v = V(e.type, e.v); if (e.type === 'int') v.constant = true; return v;
        }
        case 'Name': return this.read(this.resolveVar(e.name, env, e.line));
        case 'This': {
          const f = this.stack[this.stack.length - 1];
          if (!f.self) throw compileError('non-static variable this cannot be referenced from a static context', e.line);
          return f.self;
        }
        case 'Unary': {
          const v = yield* this.eval(e.e, env);
          if (e.op === '!') { if (v.t !== 'boolean') throw compileError(`bad operand type ${v.t} for unary operator '!'`, e.line); return V('boolean', !v.v); }
          if (!isNum(v.t)) throw compileError(`bad operand type ${typeName(v.t)} for unary operator '${e.op}'`, e.line);
          const t = promote(v.t, 'int');
          if (e.op === '-') return V(t, t === 'int' ? wrapInt(-v.v) : -v.v);
          if (e.op === '~') return V(t, ~v.v);
          return V(t, v.v);
        }
        case 'Cast': {
          const v = yield* this.eval(e.e, env);
          if (PRIM.has(e.type)) {
            if (!isNum(v.t) && !(v.t === 'boolean' && e.type === 'boolean')) throw compileError(`incompatible types: ${typeName(v.t)} cannot be converted to ${e.type}`, e.line);
            return convert(v, e.type);
          }
          if (v.t === 'null' || v.t === e.type) return v;
          throw compileError(`incompatible types: ${typeName(v.t)} cannot be converted to ${e.type}`, e.line);
        }
        case 'Bin': return yield* this.evalBin(e, env);
        case 'Cond': {
          const c = yield* this.evalBool(e.cond, env);
          const a = yield* this.eval(c ? e.a : e.b, env);
          return a;
        }
        case 'Assign': {
          const ref = yield* this.lvalue(e.target, env);
          let v = yield* this.eval(e.value, env, ref.t);
          if (e.op !== '=') {
            const cur = ref.get();
            const fake = { k: 'Bin', op: e.op.slice(0, -1), line: e.line };
            v = this.binop(fake, cur, v);
            if (isNum(ref.t) && isNum(v.t)) v = convert(v, ref.t); // compound assignment narrows implicitly
          }
          return ref.set(v);
        }
        case 'IncDec': {
          const ref = yield* this.lvalue(e.target, env);
          const cur = ref.get();
          if (!isNum(cur.t)) throw compileError(`bad operand type ${typeName(cur.t)} for unary operator '${e.op}'`, e.line);
          const nv = convert(V(promote(cur.t, 'int'), cur.v + (e.op === '++' ? 1 : -1)), cur.t);
          ref.set(nv);
          return e.prefix ? nv : cur;
        }
        case 'Index': {
          const arr = yield* this.eval(e.target, env);
          const idx = yield* this.eval(e.index, env);
          return this.indexGet(arr, idx, e.line);
        }
        case 'Member': return yield* this.member(e, env);
        case 'Call': return yield* this.call(e, env);
        case 'New': {
          const cls = this.classes[e.cls];
          const args = []; for (const a of e.args) args.push(yield* this.eval(a, env));
          if (e.cls === 'Scanner') return V('Scanner', { id: nextId++ });
          if (e.cls === 'String') return str(args.length ? args[0].v : '');
          if (e.cls === 'Random') throw compileError('java.util.Random is not supported here; use Math.random()', e.line);
          if (!cls) throw compileError(`cannot find symbol: class ${e.cls}`, e.line);
          return yield* this.instantiate(cls, args, e.line);
        }
        case 'NewArray': {
          const dims = []; for (const d of e.dims) dims.push(d ? yield* this.eval(d, env) : null);
          const build = (t, k) => {
            const d = dims[k];
            if (!d) return null;
            if (!INTEGRAL.has(d.t) || d.t === 'long') throw compileError(`incompatible types: ${d.t} cannot be converted to int`, e.line);
            if (d.v < 0) throw runtimeError('NegativeArraySizeException', String(d.v), e.line);
            const et = t.slice(0, -2);
            const elems = [];
            for (let i = 0; i < d.v; i++) elems.push(k + 1 < dims.length ? (build(et, k + 1) || NULL) : isDefault(et).v);
            return V(t, { id: nextId++, elems });
          };
          return build(e.type, 0);
        }
        case 'ArrayInit': return yield* this.arrayInit(e, env, hint);
        default: throw compileError(`unsupported expression ${e.k}`, e.line);
      }
    }
    *arrayInit(e, env, hint) {
      const type = e.type || hint;
      if (!type || !type.endsWith('[]')) throw compileError('illegal initializer for ' + (type || 'unknown type'), e.line);
      const et = type.slice(0, -2);
      const elems = [];
      for (const x of e.elems) {
        const v = yield* this.eval(x, env, et);
        const slot = { t: et, name: '' };
        this.store(slot, v, e.line, true);
        elems.push(et === 'String' ? (v.t === 'null' ? NULL : v) : (isRef(et) ? (v.t === 'null' ? NULL : v) : slot.v));
      }
      return V(type, { id: nextId++, elems });
    }
    resolveVar(name, env, line) {
      const local = env.lookup(name);
      if (local) { if (local.uninit) throw compileError(`variable ${name} might not have been initialized`, line); return local; }
      const f = this.stack[this.stack.length - 1];
      if (f && f.self && f.self.v.fields[name]) return f.self.v.fields[name];
      const cls = f && f.cls;
      if (cls && cls.statics[name]) return cls.statics[name];
      if (cls && cls.fields.some(x => x.name === name && !x.static)) throw compileError(`non-static variable ${name} cannot be referenced from a static context`, line);
      throw compileError(`cannot find symbol: variable ${name}`, line);
    }
    *lvalue(e, env) {
      const self = this;
      if (e.k === 'Name') {
        const local = env.lookup(e.name);
        let slot = local;
        if (!slot) { const f = this.stack[this.stack.length - 1]; slot = (f.self && f.self.v.fields[e.name]) || (f.cls && f.cls.statics[e.name]); }
        if (!slot) this.resolveVar(e.name, env, e.line);
        return { t: slot.t, get: () => { if (slot.uninit) throw compileError(`variable ${e.name} might not have been initialized`, e.line); return self.read(slot); }, set: v => { const r = self.store(slot, v, e.line); slot.uninit = false; return r; } };
      }
      if (e.k === 'Index') {
        const arr = yield* this.eval(e.target, env);
        const idx = yield* this.eval(e.index, env);
        this.checkIndex(arr, idx, e.line);
        const et = arr.t.slice(0, -2);
        return { t: et, get: () => tagElem(et, arr.v.elems[idx.v]), set: v => { const slot = { t: et, name: '' }; const r = self.store(slot, v, e.line, true); arr.v.elems[idx.v] = isRef(et) ? (v.t === 'null' ? NULL : r) : r.v; return r; } };
      }
      if (e.k === 'Member') {
        const slot = (yield* this.memberTarget(e, env)).slot;
        return { t: slot.t, get: () => self.read(slot), set: v => self.store(slot, v, e.line) };
      }
      throw compileError('unexpected type: required variable', e.line);
    }
    *memberTarget(e, env) {
      if (e.target.k === 'Name' && !env.lookup(e.target.name) && this.classes[e.target.name]) {
        const cls = this.classes[e.target.name];
        const slot = cls.statics[e.name];
        if (!slot) throw compileError(`cannot find symbol: variable ${e.name} in class ${cls.name}`, e.line);
        return { slot };
      }
      const obj = yield* this.eval(e.target, env);
      if (obj.t === 'null') throw runtimeError('NullPointerException', `Cannot assign field "${e.name}" because value is null`, e.line);
      if (!obj.v || !obj.v.fields) throw compileError(`cannot find symbol: variable ${e.name}`, e.line);
      const slot = obj.v.fields[e.name];
      if (!slot) throw compileError(`cannot find symbol: variable ${e.name} in ${obj.t}`, e.line);
      return { slot };
    }
    checkIndex(arr, idx, line) {
      if (arr.t === 'null') throw runtimeError('NullPointerException', 'Cannot load from array because it is null', line);
      if (!arr.t.endsWith('[]')) throw compileError(`array required, but ${typeName(arr.t)} found`, line);
      if (!INTEGRAL.has(idx.t) || idx.t === 'long') throw compileError(`incompatible types: ${typeName(idx.t)} cannot be converted to int`, line);
      if (idx.v < 0 || idx.v >= arr.v.elems.length) throw runtimeError('ArrayIndexOutOfBoundsException', `Index ${idx.v} out of bounds for length ${arr.v.elems.length}`, line);
    }
    indexGet(arr, idx, line) { this.checkIndex(arr, idx, line); return tagElem(arr.t.slice(0, -2), arr.v.elems[idx.v]); }
    *member(e, env) {
      // static constants and class-qualified fields
      if (e.target.k === 'Name' && !env.lookup(e.target.name)) {
        const q = e.target.name;
        const CONST = {
          Integer: { MAX_VALUE: V('int', 2147483647), MIN_VALUE: V('int', -2147483648) },
          Long: { MAX_VALUE: V('long', 9223372036854775807), MIN_VALUE: V('long', -9223372036854775808) },
          Double: { MAX_VALUE: V('double', Number.MAX_VALUE), MIN_VALUE: V('double', 5e-324), POSITIVE_INFINITY: V('double', Infinity), NEGATIVE_INFINITY: V('double', -Infinity), NaN: V('double', NaN) },
          Math: { PI: V('double', Math.PI), E: V('double', Math.E) },
          Character: { MAX_VALUE: V('char', 0xffff), MIN_VALUE: V('char', 0) },
          Byte: { MAX_VALUE: V('byte', 127), MIN_VALUE: V('byte', -128) }, Short: { MAX_VALUE: V('short', 32767), MIN_VALUE: V('short', -32768) },
        };
        if (CONST[q] && CONST[q][e.name]) return CONST[q][e.name];
        if (q === 'System' && e.name === 'in') return V('InputStream', { id: 0 });
        if (q === 'System' && e.name === 'out') return V('PrintStream', { id: 0 });
        if (this.classes[q]) {
          const slot = this.classes[q].statics[e.name];
          if (!slot) throw compileError(`cannot find symbol: variable ${e.name} in class ${q}`, e.line);
          return this.read(slot);
        }
        if (!(this.stack[this.stack.length - 1].self && this.stack[this.stack.length - 1].self.v.fields[q]) && !(this.stack[this.stack.length - 1].cls && this.stack[this.stack.length - 1].cls.statics[q]))
          throw compileError(`cannot find symbol: variable ${q}`, e.line);
      }
      const obj = yield* this.eval(e.target, env);
      if (obj.t === 'null') throw runtimeError('NullPointerException', `Cannot read field "${e.name}" because value is null`, e.line);
      if (obj.t.endsWith('[]')) {
        if (e.name === 'length') return V('int', obj.v.elems.length);
        throw compileError(`cannot find symbol: variable ${e.name} (arrays have .length, Strings have .length())`, e.line);
      }
      if (obj.t === 'String') throw compileError(`cannot find symbol: variable ${e.name} in String${e.name === 'length' ? ' (did you mean length()?)' : ''}`, e.line);
      if (obj.v && obj.v.fields) {
        const slot = obj.v.fields[e.name];
        if (!slot) throw compileError(`cannot find symbol: variable ${e.name} in ${obj.t}`, e.line);
        return this.read(slot);
      }
      throw compileError(`cannot find symbol: variable ${e.name}`, e.line);
    }

    *evalBin(e, env) {
      const l = yield* this.eval(e.l, env);
      if (e.op === '&&') { if (l.t !== 'boolean') throw compileError(`bad operand types for binary operator '&&'`, e.line); if (!l.v) return V('boolean', false); return V('boolean', yield* this.evalBool(e.r, env)); }
      if (e.op === '||') { if (l.t !== 'boolean') throw compileError(`bad operand types for binary operator '||'`, e.line); if (l.v) return V('boolean', true); return V('boolean', yield* this.evalBool(e.r, env)); }
      const r = yield* this.eval(e.r, env);
      if (e.op === '+' && (l.t === 'String' || r.t === 'String')) {
        const a = yield* toStr(l, this, e.line), b = yield* toStr(r, this, e.line);
        return str(a + b);
      }
      return this.binop(e, l, r);
    }
    binop(e, l, r) {
      const op = e.op;
      const bad = () => compileError(`bad operand types for binary operator '${op}': first type: ${typeName(l.t)}, second type: ${typeName(r.t)}`, e.line);
      if (op === '==' || op === '!=') {
        if ((isNum(l.t) && isNum(r.t)) || (l.t === 'boolean' && r.t === 'boolean') || (isRef(l.t) && isRef(r.t))) {
          const eq = this.equalsValue(l, r, false);
          return V('boolean', op === '==' ? eq : !eq);
        }
        throw compileError(`incomparable types: ${typeName(l.t)} and ${typeName(r.t)}`, e.line);
      }
      if (l.t === 'boolean' && r.t === 'boolean' && (op === '&' || op === '|' || op === '^')) {
        return V('boolean', op === '&' ? (l.v && r.v) : op === '|' ? (l.v || r.v) : (l.v !== r.v));
      }
      if (!isNum(l.t) || !isNum(r.t)) throw bad();
      if (op === '+' && false) return null;
      const t = promote(l.t, r.t);
      const a = l.v, b = r.v;
      switch (op) {
        case '<': return V('boolean', a < b); case '>': return V('boolean', a > b);
        case '<=': return V('boolean', a <= b); case '>=': return V('boolean', a >= b);
      }
      let x;
      if (t === 'int' || t === 'long') {
        switch (op) {
          case '+': x = a + b; break; case '-': x = a - b; break;
          case '*': x = t === 'int' ? Math.imul(a, b) : a * b; break;
          case '/': if (b === 0) throw runtimeError('ArithmeticException', '/ by zero', e.line); x = Math.trunc(a / b); break;
          case '%': if (b === 0) throw runtimeError('ArithmeticException', '/ by zero', e.line); x = a % b; break;
          case '&': x = a & b; break; case '|': x = a | b; break; case '^': x = a ^ b; break;
          case '<<': x = a << b; break; case '>>': x = a >> b; break; case '>>>': x = a >>> b; break;
          default: throw bad();
        }
        return V(t, t === 'int' ? wrapInt(x) : x);
      }
      switch (op) {
        case '+': x = a + b; break; case '-': x = a - b; break; case '*': x = a * b; break;
        case '/': x = a / b; break; case '%': x = a % b; break;
        default: throw bad();
      }
      return V(t, t === 'float' ? Math.fround(x) : x);
    }

    // ── objects ──
    *instantiate(cls, args, line) {
      const obj = V(cls.name, { id: nextId++, cls: cls.name, fields: {} });
      const frame = this.pushFrame(`new ${cls.name}`, obj); frame.cls = cls;
      for (const f of cls.fields) if (!f.static) {
        if (f.block) { yield* this.execBlockIn(f.init, frame.env, true); continue; }
        const slot = { t: f.type, v: isDefault(f.type).v, name: f.name, final: f.final };
        obj.v.fields[f.name] = slot;
        if (f.init) this.store(slot, yield* this.eval(f.init, frame.env, f.type), f.line, true);
      }
      this.stack.pop();
      if (cls.ctors.length) {
        const cands = cls.ctors.filter(c => c.params.length === args.length);
        if (!cands.length) throw compileError(`constructor ${cls.name} in class ${cls.name} cannot be applied to given types: found ${args.map(a => typeName(a.t)).join(',') || 'no arguments'}`, line);
        const ctor = pickOverload(cands, args, '<init>', line);
        yield* this.invoke(cls, { name: '<init>', params: ctor.params, ret: 'void', body: ctor.body, line: ctor.line }, obj, args, line);
      } else if (args.length) throw compileError(`constructor ${cls.name} in class ${cls.name} cannot be applied to given types: required no arguments, found ${args.map(a => typeName(a.t)).join(',')}`, line);
      return obj;
    }

    // ── calls ──
    *call(e, env) {
      const args = []; for (const a of e.args) args.push(yield* this.eval(a, env));
      const top = this.stack[this.stack.length - 1];
      if (!e.target && e.name === 'this') { // this(...): chain to another constructor
        const cls = top.cls;
        if (!top.self || !top.name.startsWith(cls.name + '(')) throw compileError('call to this must be first statement in constructor', e.line);
        const cands = cls.ctors.filter(c => c.params.length === args.length);
        if (!cands.length) throw compileError(`constructor ${cls.name} cannot be applied to given types: found ${args.map(a => typeName(a.t)).join(',') || 'no arguments'}`, e.line);
        const ctor = pickOverload(cands, args, '<init>', e.line);
        return yield* this.invoke(cls, { name: '<init>', params: ctor.params, ret: 'void', body: ctor.body, line: ctor.line }, top.self, args, e.line);
      }
      if (!e.target) { // unqualified: method of the current class
        const cls = top.cls || this.unit.classes[0];
        const m = findMethod(cls, e.name, args, e.line);
        if (!m.static && !top.self) throw compileError(`non-static method ${e.name}(${m.params.map(p => p.type).join(',')}) cannot be referenced from a static context`, e.line);
        return yield* this.invoke(cls, m, m.static ? null : top.self, args, e.line);
      }
      // System.out.*
      if (e.target.k === 'Member' && e.target.target.k === 'Name' && e.target.target.name === 'System' && e.target.name === 'out') {
        return yield* this.print(e.name, args, e.line);
      }
      if (e.target.k === 'Name' && !env.lookup(e.target.name) && !(top.self && top.self.v.fields[e.target.name]) && !(top.cls && top.cls.statics[e.target.name])) {
        const q = e.target.name;
        if (this.classes[q]) {
          const m = findMethod(this.classes[q], e.name, args, e.line);
          if (!m.static) throw compileError(`non-static method ${e.name}(${m.params.map(p => p.type).join(',')}) cannot be referenced from a static context`, e.line);
          return yield* this.invoke(this.classes[q], m, null, args, e.line);
        }
        return yield* this.staticLib(q, e.name, args, e.line);
      }
      const obj = yield* this.eval(e.target, env);
      if (obj.t === 'null') throw runtimeError('NullPointerException', `Cannot invoke "${e.name}()" because value is null`, e.line);
      if (obj.t === 'String') return yield* this.stringMethod(obj, e.name, args, e.line);
      if (obj.t === 'Scanner') return this.scannerMethod(e.name, args, e.line);
      if (obj.t.endsWith('[]')) throw compileError(`cannot find symbol: method ${e.name}() on an array${e.name === 'length' ? ' (arrays have .length without parentheses)' : ''}`, e.line);
      const cls = this.classes[obj.t];
      if (!cls) throw compileError(`cannot find symbol: method ${e.name}`, e.line);
      if (e.name === 'equals' && args.length === 1 && !cls.methods.some(m => m.name === 'equals')) return V('boolean', this.equalsValue(obj, args[0], false));
      if (e.name === 'toString' && !args.length && !cls.methods.some(m => m.name === 'toString')) return str(yield* toStr(obj, this, e.line));
      const m = findMethod(cls, e.name, args, e.line);
      return yield* this.invoke(cls, m, m.static ? null : obj, args, e.line);
    }
    *print(name, args, line) {
      if (name === 'println') { if (args.length > 1) throw compileError('println takes at most one argument', line); this.out += (args.length ? yield* toStr(args[0], this, line) : '') + '\n'; return V('void'); }
      if (name === 'print') { if (args.length !== 1) throw compileError('print takes exactly one argument', line); this.out += yield* toStr(args[0], this, line); return V('void'); }
      if (name === 'printf' || name === 'format') { if (!args.length || args[0].t !== 'String') throw compileError('printf needs a format string', line); this.out += yield* this.format(args[0].v, args.slice(1), line); return V('void'); }
      throw compileError(`cannot find symbol: method ${name} in PrintStream`, line);
    }
    *format(fmt, args, line) {
      let k = 0, out = '';
      const re = /%([-+0, #]*)(\d+)?(?:\.(\d+))?([dfsScbnxXeE%])/g;
      let last = 0, m;
      while ((m = re.exec(fmt))) {
        out += fmt.slice(last, m.index); last = re.lastIndex;
        const [, flags, width, prec, conv] = m;
        if (conv === 'n') { out += '\n'; continue; }
        if (conv === '%') { out += '%'; continue; }
        if (k >= args.length) throw runtimeError('MissingFormatArgumentException', `Format specifier '${m[0]}'`, line);
        const a = args[k++];
        let s;
        switch (conv) {
          case 'd': if (!INTEGRAL.has(a.t) || a.t === 'char') throw runtimeError('IllegalFormatConversionException', `d != ${a.t === 'double' ? 'java.lang.Double' : a.t === 'String' ? 'java.lang.String' : a.t}`, line);
            s = String(a.v); if (flags.includes(',')) s = s.replace(/\B(?=(\d{3})+(?!\d))/g, ','); if (flags.includes('+') && a.v >= 0) s = '+' + s; break;
          case 'f': if (!isNum(a.t) || INTEGRAL.has(a.t)) throw runtimeError('IllegalFormatConversionException', `f != ${a.t === 'int' ? 'java.lang.Integer' : a.t === 'String' ? 'java.lang.String' : a.t}`, line);
            s = a.v.toFixed(prec === undefined ? 6 : +prec); if (flags.includes(',')) { const [i, f] = s.split('.'); s = i.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (f !== undefined ? '.' + f : ''); } if (flags.includes('+') && a.v >= 0) s = '+' + s; break;
          case 'e': case 'E': s = a.v.toExponential(prec === undefined ? 6 : +prec).replace(/e([+-])(\d)$/, 'e$10$2'); if (conv === 'E') s = s.toUpperCase(); break;
          case 's': case 'S': s = yield* toStr(a, this, line); if (prec !== undefined) s = s.slice(0, +prec); if (conv === 'S') s = s.toUpperCase(); break;
          case 'c': s = a.t === 'char' ? String.fromCharCode(a.v) : (INTEGRAL.has(a.t) ? String.fromCharCode(a.v) : (() => { throw runtimeError('IllegalFormatConversionException', `c != ${a.t}`, line); })()); break;
          case 'b': s = a.t === 'boolean' ? String(a.v) : (a.t === 'null' ? 'false' : 'true'); break;
          case 'x': case 'X': s = (a.v >>> 0).toString(16); if (conv === 'X') s = s.toUpperCase(); break;
        }
        if (width) { const w = +width; if (s.length < w) s = flags.includes('-') ? s.padEnd(w) : (flags.includes('0') && conv !== 's' ? (s[0] === '-' ? '-' + s.slice(1).padStart(w - 1, '0') : s.padStart(w, '0')) : s.padStart(w)); }
        out += s;
      }
      out += fmt.slice(last);
      return out;
    }
    *staticLib(q, name, args, line) {
      const need = (n, pred, what) => { if (args.length !== n || !args.every(pred)) throw compileError(`no suitable method found for ${q}.${name}(${args.map(a => typeName(a.t)).join(',')})${what ? ' — expected ' + what : ''}`, line); };
      const num = a => isNum(a.t);
      if (q === 'Math') {
        const dbl = x => V('double', x);
        switch (name) {
          case 'abs': need(1, num); return V(promote(args[0].t, 'int'), Math.abs(args[0].v));
          case 'max': need(2, num); return V(promote(args[0].t, args[1].t), Math.max(args[0].v, args[1].v));
          case 'min': need(2, num); return V(promote(args[0].t, args[1].t), Math.min(args[0].v, args[1].v));
          case 'pow': need(2, num); return dbl(Math.pow(args[0].v, args[1].v));
          case 'sqrt': need(1, num); return dbl(Math.sqrt(args[0].v));
          case 'cbrt': need(1, num); return dbl(Math.cbrt(args[0].v));
          case 'floor': need(1, num); return dbl(Math.floor(args[0].v));
          case 'ceil': need(1, num); return dbl(Math.ceil(args[0].v));
          case 'round': need(1, num); return args[0].t === 'float' ? V('int', Math.round(args[0].v)) : V('long', Math.floor(args[0].v + 0.5));
          case 'random': need(0, num); return dbl(Math.random());
          case 'sin': case 'cos': case 'tan': case 'log': case 'log10': case 'exp': case 'asin': case 'acos': case 'atan': need(1, num); return dbl(Math[name](args[0].v));
          case 'atan2': case 'hypot': need(2, num); return dbl(Math[name](args[0].v, args[1].v));
          case 'toRadians': need(1, num); return dbl(args[0].v * Math.PI / 180);
          case 'toDegrees': need(1, num); return dbl(args[0].v * 180 / Math.PI);
          case 'signum': need(1, num); return dbl(Math.sign(args[0].v));
        }
      }
      if (q === 'Integer' || q === 'Long' || q === 'Double' || q === 'Float' || q === 'Boolean') {
        const target = { Integer: 'int', Long: 'long', Double: 'double', Float: 'float', Boolean: 'boolean' }[q];
        if (name === 'parseInt' || name === 'parseLong' || name === 'parseDouble' || name === 'parseFloat' || name === 'parseBoolean' || name === 'valueOf') {
          need(1, a => a.t === 'String' || (name === 'valueOf' && isNum(a.t)), 'a String');
          if (args[0].t !== 'String') return convert(args[0], target);
          const s = args[0].v;
          if (target === 'boolean') return V('boolean', s.toLowerCase() === 'true');
          const ok = target === 'int' || target === 'long' ? /^[+-]?\d+$/.test(s) : /^\s*[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?[fFdD]?\s*$/.test(s) || /^\s*[+-]?(NaN|Infinity)\s*$/.test(s);
          if (!ok) throw runtimeError('NumberFormatException', target === 'int' || target === 'long' ? `For input string: "${s}"` : (s.trim() === '' ? 'empty String' : `For input string: "${s}"`), line);
          const v = target === 'int' || target === 'long' ? parseInt(s, 10) : parseFloat(s);
          if (target === 'int' && (v > 2147483647 || v < -2147483648)) throw runtimeError('NumberFormatException', `For input string: "${s}"`, line);
          return V(target, v);
        }
        if (name === 'toString') { need(1, a => true); return str(yield* toStr(args[0], this, line)); }
        if (name === 'compare') { need(2, num); return V('int', Math.sign(args[0].v - args[1].v)); }
        if (name === 'isNaN' && q === 'Double') { need(1, num); return V('boolean', Number.isNaN(args[0].v)); }
        if (name === 'max' || name === 'min') { need(2, num); return V(target, Math[name](args[0].v, args[1].v)); }
      }
      if (q === 'Character') {
        const ch = () => { need(1, a => a.t === 'char' || a.t === 'int', 'a char'); return String.fromCharCode(args[0].v); };
        switch (name) {
          case 'isDigit': return V('boolean', /^[0-9]$/.test(ch()));
          case 'isLetter': return V('boolean', /^\p{L}$/u.test(ch()));
          case 'isLetterOrDigit': return V('boolean', /^[\p{L}0-9]$/u.test(ch()));
          case 'isUpperCase': { const c = ch(); return V('boolean', c !== c.toLowerCase() && c === c.toUpperCase()); }
          case 'isLowerCase': { const c = ch(); return V('boolean', c !== c.toUpperCase() && c === c.toLowerCase()); }
          case 'isWhitespace': return V('boolean', /^\s$/.test(ch()));
          case 'toUpperCase': return V('char', ch().toUpperCase().charCodeAt(0));
          case 'toLowerCase': return V('char', ch().toLowerCase().charCodeAt(0));
          case 'toString': return str(ch());
          case 'getNumericValue': { const c = ch(); return V('int', /[0-9]/.test(c) ? +c : /[a-z]/i.test(c) ? c.toLowerCase().charCodeAt(0) - 87 : -1); }
        }
      }
      if (q === 'String') {
        if (name === 'valueOf') { need(1, a => true); return str(yield* toStr(args[0], this, line)); }
        if (name === 'format') { if (!args.length || args[0].t !== 'String') throw compileError('String.format needs a format string', line); return str(yield* this.format(args[0].v, args.slice(1), line)); }
        if (name === 'join') { const parts = []; for (const a of args.slice(1)) parts.push(yield* toStr(a, this, line)); return str(parts.join(args[0].v)); }
      }
      if (q === 'Arrays') {
        if (name === 'toString') { need(1, a => a.t.endsWith('[]') || a.t === 'null', 'an array'); if (args[0].t === 'null') return lit('null'); const et = args[0].t.slice(0, -2); const parts = []; for (const x of args[0].v.elems) parts.push(yield* toStr(tagElem(et, x), this, line)); return str('[' + parts.join(', ') + ']'); }
        if (name === 'sort') { need(1, a => a.t.endsWith('[]'), 'an array'); const et = args[0].t.slice(0, -2); args[0].v.elems.sort(isNum(et) ? (a, b) => a - b : (a, b) => (a.v < b.v ? -1 : a.v > b.v ? 1 : 0)); return V('void'); }
        if (name === 'fill') { need(2, a => true); const et = args[0].t.slice(0, -2); const slot = { t: et, name: '' }; this.store(slot, args[1], line, true); args[0].v.elems.fill(isRef(et) ? args[1] : slot.v); return V('void'); }
        if (name === 'equals') { need(2, a => a.t.endsWith('[]') || a.t === 'null'); const a = args[0], b = args[1]; if (a.t === 'null' || b.t === 'null') return V('boolean', a.t === b.t); return V('boolean', a.v.elems.length === b.v.elems.length && a.v.elems.every((x, i) => this.equalsValue(tagElem(a.t.slice(0, -2), x), tagElem(b.t.slice(0, -2), b.v.elems[i]), true))); }
        if (name === 'copyOf') { need(2, a => true); const src = args[0]; const n = args[1].v; const et = src.t.slice(0, -2); const elems = src.v.elems.slice(0, n); while (elems.length < n) elems.push(isRef(et) ? NULL : isDefault(et).v); return V(src.t, { id: nextId++, elems }); }
      }
      if (q === 'System') {
        if (name === 'exit') throw runtimeError('Exit', `System.exit(${args.length ? args[0].v : 0})`, line);
        if (name === 'currentTimeMillis') return V('long', Date.now());
        if (name === 'nanoTime') return V('long', Math.round(performance.now() * 1e6));
      }
      if (q === 'Thread' && name === 'sleep') return V('void');
      if (this.classes[q]) throw compileError(`cannot find symbol: method ${name} in class ${q}`, line);
      throw compileError(`cannot find symbol: ${q}.${name}${['ArrayList', 'HashMap', 'List', 'Collections'].includes(q) ? ' (collections are COMP 249 material)' : ''}`, line);
    }
    *stringMethod(s, name, args, line) {
      const t = s.v;
      const argStr = i => { const a = args[i]; if (!a || a.t !== 'String') throw compileError(`method ${name} in class String cannot be applied to given types: found ${args.map(a => typeName(a.t)).join(',')}`, line); return a.v; };
      const argInt = i => { const a = args[i]; if (!a || !INTEGRAL.has(a.t) || a.t === 'long') throw compileError(`incompatible types: ${a ? typeName(a.t) : 'missing'} cannot be converted to int`, line); return a.v; };
      const argChar = i => { const a = args[i]; if (!a || (a.t !== 'char' && a.t !== 'int')) throw compileError(`method ${name} in class String cannot be applied to given types: found ${args.map(a => typeName(a.t)).join(',')}`, line); return String.fromCharCode(a.v); };
      switch (name) {
        case 'length': return V('int', t.length);
        case 'charAt': { const i = argInt(0); if (i < 0 || i >= t.length) throw runtimeError('StringIndexOutOfBoundsException', `Index ${i} out of bounds for length ${t.length}`, line); return V('char', t.charCodeAt(i)); }
        case 'substring': { const a = argInt(0), b = args.length > 1 ? argInt(1) : t.length; if (a < 0 || b > t.length || a > b) throw runtimeError('StringIndexOutOfBoundsException', `begin ${a}, end ${b}, length ${t.length}`, line); return str(t.slice(a, b)); }
        case 'indexOf': { const needle = args[0].t === 'String' ? argStr(0) : argChar(0); return V('int', t.indexOf(needle, args.length > 1 ? argInt(1) : 0)); }
        case 'lastIndexOf': { const needle = args[0].t === 'String' ? argStr(0) : argChar(0); return V('int', t.lastIndexOf(needle)); }
        case 'equals': { if (args.length !== 1) throw compileError('equals takes one argument', line); return V('boolean', args[0].t === 'String' && args[0].v === t); }
        case 'equalsIgnoreCase': return V('boolean', args[0].t === 'String' && args[0].v.toLowerCase() === t.toLowerCase());
        case 'compareTo': { const o = argStr(0); let i = 0; while (i < t.length && i < o.length && t[i] === o[i]) i++; return V('int', i < t.length && i < o.length ? t.charCodeAt(i) - o.charCodeAt(i) : t.length - o.length); }
        case 'compareToIgnoreCase': { const a = t.toLowerCase(), o = argStr(0).toLowerCase(); let i = 0; while (i < a.length && i < o.length && a[i] === o[i]) i++; return V('int', i < a.length && i < o.length ? a.charCodeAt(i) - o.charCodeAt(i) : a.length - o.length); }
        case 'toUpperCase': return str(t.toUpperCase());
        case 'toLowerCase': return str(t.toLowerCase());
        case 'trim': case 'strip': return str(t.trim());
        case 'isEmpty': return V('boolean', t.length === 0);
        case 'isBlank': return V('boolean', t.trim().length === 0);
        case 'contains': return V('boolean', t.includes(argStr(0)));
        case 'startsWith': return V('boolean', t.startsWith(argStr(0)));
        case 'endsWith': return V('boolean', t.endsWith(argStr(0)));
        case 'replace': { const a = args[0].t === 'char' ? argChar(0) : argStr(0); const b = args[1].t === 'char' ? argChar(1) : argStr(1); return str(t.split(a).join(b)); }
        case 'concat': return str(t + argStr(0));
        case 'repeat': return str(t.repeat(argInt(0)));
        case 'toCharArray': return V('char[]', { id: nextId++, elems: [...t].map(c => c.charCodeAt(0)) });
        case 'split': { const parts = t.split(new RegExp(argStr(0))); return V('String[]', { id: nextId++, elems: parts.map(p => str(p)) }); }
        case 'toString': return s;
        case 'hashCode': { let h = 0; for (let i = 0; i < t.length; i++) h = wrapInt(Math.imul(31, h) + t.charCodeAt(i)); return V('int', h); }
        case 'matches': return V('boolean', new RegExp('^(?:' + argStr(0) + ')$').test(t));
        case 'format': return str(yield* this.format(t, args, line));
      }
      throw compileError(`cannot find symbol: method ${name} in class String`, line);
    }
    // ── Scanner over the stdin box ──
    scannerMethod(name, args, line) {
      const src = this.stdin;
      const skipWs = () => { while (this.stdinPos < src.length && /\s/.test(src[this.stdinPos])) this.stdinPos++; };
      const peekToken = () => { let p = this.stdinPos; while (p < src.length && /\s/.test(src[p])) p++; let q = p; while (q < src.length && !/\s/.test(src[q])) q++; return p < src.length ? src.slice(p, q) : null; };
      const token = () => { skipWs(); const tk = peekToken(); if (tk === null) throw runtimeError('NoSuchElementException', 'no more input — type it in the Input box', line); this.stdinPos += tk.length; return tk; };
      const isInt = s => /^[+-]?\d+$/.test(s), isDbl = s => /^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(s);
      switch (name) {
        case 'nextInt': { const tk = peekToken(); if (tk === null) throw runtimeError('NoSuchElementException', 'no more input — type it in the Input box', line); if (!isInt(tk)) throw runtimeError('InputMismatchException', `For input string: "${tk}"`, line); return V('int', parseInt(token(), 10)); }
        case 'nextLong': { const tk = token(); if (!isInt(tk)) throw runtimeError('InputMismatchException', `For input string: "${tk}"`, line); return V('long', parseInt(tk, 10)); }
        case 'nextDouble': case 'nextFloat': { const tk = peekToken(); if (tk === null) throw runtimeError('NoSuchElementException', 'no more input — type it in the Input box', line); if (!isDbl(tk)) throw runtimeError('InputMismatchException', `For input string: "${tk}"`, line); return V(name === 'nextDouble' ? 'double' : 'float', parseFloat(token())); }
        case 'nextBoolean': { const tk = token(); if (!/^(true|false)$/i.test(tk)) throw runtimeError('InputMismatchException', `For input string: "${tk}"`, line); return V('boolean', tk.toLowerCase() === 'true'); }
        case 'next': return str(token());
        case 'nextLine': {
          if (this.stdinPos >= src.length) throw runtimeError('NoSuchElementException', 'No line found — type it in the Input box', line);
          let q = src.indexOf('\n', this.stdinPos); if (q < 0) q = src.length;
          const s = src.slice(this.stdinPos, q).replace(/\r$/, ''); this.stdinPos = q + 1; return str(s);
        }
        case 'hasNext': return V('boolean', peekToken() !== null);
        case 'hasNextInt': { const tk = peekToken(); return V('boolean', tk !== null && isInt(tk)); }
        case 'hasNextDouble': { const tk = peekToken(); return V('boolean', tk !== null && isDbl(tk)); }
        case 'hasNextLine': return V('boolean', this.stdinPos < src.length);
        case 'close': return V('void');
      }
      throw compileError(`cannot find symbol: method ${name} in class Scanner`, line);
    }
  }

  /* ════════════════════════════════════════════════════════════════
     5. Public run: parse + execute to the end, return the trace
     ════════════════════════════════════════════════════════════════ */
  JAVA.run = function (code, stdin, opts) {
    nextId = 1;
    let unit;
    try { unit = JAVA.parse(code); }
    catch (e) { if (e instanceof JavaError) return { trace: [], out: '', error: { kind: 'compile', message: e.message, line: e.line } }; throw e; }
    const it = new Interp(unit, stdin, opts);
    let error = null;
    try {
      const g = it.runMain();
      while (!g.next().done) { /* each yield = one recorded step */ }
    } catch (e) {
      if (!(e instanceof JavaError)) { error = { kind: 'runtime', name: 'InternalError', message: String(e && e.message || e), line: null }; console.warn('java.js internal error', e); }
      else error = { kind: e.kind, name: e.name, message: e.message, line: e.line };
      it.snap(error.line, 'error');
    }
    return { trace: it.trace, out: it.out, error, steps: it.steps, snippet: !!unit.snippet };
  };

  /* ════════════════════════════════════════════════════════════════
     6. Stepper UI
     ════════════════════════════════════════════════════════════════ */
  const UIS = {};
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const KW_RE = /\b(class|public|private|protected|static|final|void|int|long|double|float|boolean|char|byte|short|if|else|while|do|for|switch|case|default|break|continue|return|new|this|null|true|false|import|package)\b/g;
  function highlight(line) {
    // comments / strings / chars first so keywords inside them stay plain
    const parts = [];
    const re = /(\/\/.*$)|("(?:[^"\\]|\\.)*")|('(?:[^'\\]|\\.)')/g;
    let last = 0, m;
    const kw = s => esc(s).replace(KW_RE, '<b>$1</b>').replace(/\b(\d+\.?\d*[fFdDlL]?)\b/g, '<i>$1</i>');
    while ((m = re.exec(line))) { parts.push(kw(line.slice(last, m.index))); parts.push(`<span class="${m[1] ? 'jv-cm' : 'jv-str'}">${esc(m[0])}</span>`); last = re.lastIndex; }
    parts.push(kw(line.slice(last)));
    return parts.join('');
  }

  class Stepper {
    constructor(id, cfg) {
      this.id = id; this.cfg = cfg;
      this.code = (cfg.code || '').replace(/\s+$/, '');
      this.stdin = cfg.stdin || '';
      this.result = null; this.i = 0; this.editing = true;
      this.el = document.getElementById('sim-' + id);
    }
    usesStdin() { return /\bScanner\b/.test(this.code); }
    run() {
      this.result = JAVA.run(this.code, this.stdin, { maxSteps: this.cfg.maxSteps || 5000 });
      this.i = Math.max(0, this.result.trace.length - 1);
      this.editing = false;
      this.render();
    }
    edit() { this.editing = true; this.render(); }
    goto(k) { if (!this.result) return; this.i = Math.max(0, Math.min(this.result.trace.length - 1, k)); this.render(); }
    reset() { this.result = null; this.i = 0; this.editing = true; this.code = (this.cfg.code || '').replace(/\s+$/, ''); this.stdin = this.cfg.stdin || ''; this.render(); }
    render() {
      const el = this.el; if (!el) return;
      const lines = this.code.split('\n');
      const tr = this.result ? this.result.trace : [];
      const cur = tr[this.i] || null;
      const last = this.i === tr.length - 1;
      const prev = this.i > 0 ? tr[this.i - 1] : null;
      const err = this.result && this.result.error;
      const curLine = cur ? cur.line : null;
      const errLine = err && last ? err.line : null;

      const codeHtml = this.editing
        ? `<textarea class="jv-editor" spellcheck="false" rows="${Math.max(3, lines.length + 1)}">${esc(this.code)}</textarea>`
        : `<pre class="jv-listing">${lines.map((l, k) => `<span class="jv-ln${curLine === k + 1 ? ' cur' : ''}${errLine === k + 1 ? ' err' : ''}"><span class="jv-no">${k + 1}</span>${highlight(l) || ' '}</span>`).join('')}</pre>`;

      let varsHtml = '';
      if (cur) {
        const prevMap = new Map();
        if (prev) prev.frames.forEach(f => f.vars.forEach(([n, v]) => prevMap.set(f.name + '|' + n, v)));
        varsHtml = cur.frames.map((f, fi) => {
          const rows = f.vars.map(([n, v]) => `<tr class="${prevMap.has(f.name + '|' + n) ? (prevMap.get(f.name + '|' + n) !== v ? 'changed' : '') : 'new'}"><td>${esc(n)}</td><td>${esc(v)}</td></tr>`).join('');
          const top = fi === cur.frames.length - 1 && f.kind !== 'static';
          return `<div class="jv-frame${top ? ' top' : ''}"><div class="jv-frame-name">${esc(f.name)}</div>${rows ? `<table>${rows}</table>` : '<div class="jv-empty">no variables yet</div>'}</div>`;
        }).join('') || '<div class="jv-empty">no variables yet</div>';
      }
      const outText = cur ? this.result.out.slice(0, cur.outLen) : '';
      let errHtml = '';
      if (err && last) {
        errHtml = err.kind === 'compile'
          ? `<div class="jv-err"><b>error${err.line ? ` (line ${err.line})` : ''}:</b> ${esc(err.message)}</div>`
          : `<div class="jv-err"><b>Exception in thread "main" ${esc(err.name === 'StepLimit' || err.name === 'Exit' ? err.name : 'java.lang.' + err.name)}:</b> ${esc(err.message)}${err.line ? `<br>&nbsp;&nbsp;at line ${err.line}` : ''}</div>`;
      }
      const status = !this.result ? '' : this.editing ? '' : cur && cur.note === 'finished' ? 'program finished' : cur && cur.note === 'error' ? 'stopped' : `step ${this.i} of ${tr.length - 1}${curLine ? ` — about to run line ${curLine}` : ''}`;

      el.innerHTML = `
        <div class="jv-wrap">
          <div class="jv-toolbar">
            <button class="btn fa-btn jv-run" data-act="run">▶ Run</button>
            ${this.editing ? '' : `<button class="btn fa-btn fa-secondary" data-act="edit">✎ Edit</button>`}
            <button class="btn fa-btn fa-secondary" data-act="reset" title="restore the original program">⟲ Reset</button>
            ${this.editing ? '' : `<span class="jv-sep"></span>
            <button class="btn fa-btn fa-secondary" data-act="first" ${this.i === 0 ? 'disabled' : ''} title="first step">|◀</button>
            <button class="btn fa-btn fa-secondary" data-act="back" ${this.i === 0 ? 'disabled' : ''}>◀ Back</button>
            <button class="btn fa-btn jv-step" data-act="step" ${last ? 'disabled' : ''}>Step ▶</button>
            <button class="btn fa-btn fa-secondary" data-act="last" ${last ? 'disabled' : ''} title="last step">▶|</button>`}
            <span class="jv-status">${esc(status)}</span>
          </div>
          <div class="jv-main">
            <div class="jv-code">${codeHtml}</div>
            <div class="jv-side">
              <div class="jv-panel"><div class="jv-panel-title">Variables</div><div class="jv-vars">${varsHtml || '<div class="jv-empty">press ▶ Run, then step through the program</div>'}</div></div>
              <div class="jv-panel"><div class="jv-panel-title">Console</div><pre class="jv-console">${esc(outText)}${cur && !last && !this.editing ? '<span class="jv-caret">▌</span>' : ''}</pre>${errHtml}</div>
            </div>
          </div>
          ${this.usesStdin() ? `<div class="jv-stdin"><label>Input (what the user would type):</label><textarea class="jv-stdin-box" rows="${Math.max(2, this.stdin.split('\n').length)}" spellcheck="false">${esc(this.stdin)}</textarea></div>` : ''}
        </div>`;

      el.querySelectorAll('[data-act]').forEach(b => b.addEventListener('click', () => this.act(b.dataset.act)));
      const ta = el.querySelector('.jv-editor');
      if (ta) {
        ta.addEventListener('input', () => { this.code = ta.value; ta.rows = Math.max(3, ta.value.split('\n').length + 1); });
        ta.addEventListener('keydown', ev => {
          if (ev.key === 'Tab') { ev.preventDefault(); const s = ta.selectionStart, e = ta.selectionEnd; ta.value = ta.value.slice(0, s) + '    ' + ta.value.slice(e); ta.selectionStart = ta.selectionEnd = s + 4; this.code = ta.value; }
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

  JAVA.mount = function (id, cfg) {
    const ui = new Stepper(id, cfg || {}); UIS[id] = ui; ui.render(); return ui;
  };
  JAVA.ui = id => UIS[id];

  if (typeof window !== 'undefined') window.JAVA = JAVA;
  if (typeof module !== 'undefined' && module.exports) module.exports = JAVA;
})();
