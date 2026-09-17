/* ── Java-subset interpreter + stepper (COMP 248 / COMP 249) ────────────────────
   Pure core (no DOM): JAVA.parse(code), JAVA.run(code, stdin, opts) → { trace, out, error }.
   UI: JAVA.mount(id, cfg) builds the stepper inside #sim-<id>; cfg = { code, stdin?, files?, maxSteps? }.
   The subset is what the first two Java courses use: primitives with Java int semantics, String,
   arrays, if/switch/loops, static and instance methods, classes with fields and constructors,
   System.out.print / println / printf, Math/Integer/Double/Character helpers, Scanner over a stdin box;
   then inheritance with dynamic dispatch, abstract classes, interfaces, enums, nested/inner/anonymous
   classes and lambdas, exceptions (try/catch/finally, throw, checked-exception rule), generics by
   erasure with boxing, the java.util collections (ArrayList, LinkedList, HashMap in Java's iteration
   order, TreeMap, sets, iterators, Collections/Arrays helpers) and file I/O over a virtual file system.
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
  // '>>' / '>>>' are split back into '>' tokens by the parser when closing generic arguments
  const OPS = ['>>>=', '<<=', '>>=', '>>>', '...', '++', '--', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '==', '!=', '<=', '>=', '&&', '||',
    '<<', '>>', '->', '+', '-', '*', '/', '%', '=', '<', '>', '!', '~', '?', ':', '.', ',', ';', '(', ')', '{', '}', '[', ']', '&', '|', '^', '@'];

  class JavaError extends Error {
    constructor(kind, msg, line) { super(msg); this.kind = kind; this.line = line; }
  }
  const compileError = (msg, line) => new JavaError('compile', msg, line);
  const runtimeError = (name, msg, line) => { const e = new JavaError('runtime', msg, line); e.name = name; return e; };

  const ESC = { n: '\n', t: '\t', r: '\r', b: '\b', f: '\f', '0': '\0', '\\': '\\', "'": "'", '"': '"' };

  // Generic types are kept as text in declarations (`ArrayList<Integer>`) and erased wherever types are compared.
  const erase = t => { const i = t.indexOf('<'); if (i < 0) return t; let d = 0, j = i; for (; j < t.length; j++) { if (t[j] === '<') d++; else if (t[j] === '>' && --d === 0) break; } return t.slice(0, i) + t.slice(j + 1); };
  const targsOf = t => { const i = t.indexOf('<'); if (i < 0) return null; let d = 0, j = i, out = [], last = i + 1; for (; j < t.length; j++) { const c = t[j]; if (c === '<') d++; else if (c === '>') { if (--d === 0) { out.push(t.slice(last, j)); break; } } else if (c === ',' && d === 1) { out.push(t.slice(last, j)); last = j + 1; } } return out; };

  const BOX = { int: 'Integer', long: 'Long', double: 'Double', float: 'Float', boolean: 'Boolean', char: 'Character', byte: 'Byte', short: 'Short' };
  const UNBOX = Object.fromEntries(Object.entries(BOX).map(([p, b]) => [b, p]));
  const isBox = t => t in UNBOX;
  // Built-in reference types and their supertypes (Object is implicit everywhere).
  const BUILTIN_SUPER = {
    Number: ['Comparable'], Integer: ['Number', 'Comparable'], Long: ['Number', 'Comparable'], Double: ['Number', 'Comparable'], Float: ['Number', 'Comparable'],
    Short: ['Number', 'Comparable'], Byte: ['Number', 'Comparable'], Character: ['Comparable'], Boolean: ['Comparable'],
    String: ['Comparable', 'CharSequence'], StringBuilder: ['CharSequence'],
    Collection: ['Iterable'], List: ['Collection'], Set: ['Collection'], SortedSet: ['Set'], Queue: ['Collection'], Deque: ['Queue'], SortedMap: ['Map'],
    AbstractList: ['List'], ArrayList: ['AbstractList'], LinkedList: ['AbstractList', 'Deque'], Stack: ['List'], ArrayDeque: ['Deque'], PriorityQueue: ['Queue'],
    HashMap: ['Map'], LinkedHashMap: ['HashMap'], TreeMap: ['SortedMap'], HashSet: ['Set'], LinkedHashSet: ['HashSet'], TreeSet: ['SortedSet'],
    Entry: [], Iterator: [], ListIterator: ['Iterator'], Scanner: ['Iterator'], Random: [],
    Throwable: [], Exception: ['Throwable'], Error: ['Throwable'], RuntimeException: ['Exception'],
    ArithmeticException: ['RuntimeException'], NullPointerException: ['RuntimeException'], ClassCastException: ['RuntimeException'],
    IllegalArgumentException: ['RuntimeException'], IllegalStateException: ['RuntimeException'], IndexOutOfBoundsException: ['RuntimeException'],
    UnsupportedOperationException: ['RuntimeException'], NegativeArraySizeException: ['RuntimeException'], ArrayStoreException: ['RuntimeException'],
    ConcurrentModificationException: ['RuntimeException'], NoSuchElementException: ['RuntimeException'],
    ArrayIndexOutOfBoundsException: ['IndexOutOfBoundsException'], StringIndexOutOfBoundsException: ['IndexOutOfBoundsException'],
    NumberFormatException: ['IllegalArgumentException'], InputMismatchException: ['NoSuchElementException'],
    IOException: ['Exception'], FileNotFoundException: ['IOException'], EOFException: ['IOException'], NotSerializableException: ['IOException'],
    ClassNotFoundException: ['Exception'], InterruptedException: ['Exception'], CloneNotSupportedException: ['Exception'],
    StackOverflowError: ['Error'], OutOfMemoryError: ['Error'],
    File: [], PrintWriter: [], FileWriter: [], BufferedWriter: [], FileReader: [], BufferedReader: [], FileOutputStream: [], FileInputStream: [],
    ObjectOutputStream: [], ObjectInputStream: [], PrintStream: [], InputStream: [], Class: [],
  };
  const BUILTIN_INTERFACES = new Set(['Comparable', 'Comparator', 'Iterable', 'Iterator', 'ListIterator', 'Runnable', 'Serializable', 'Cloneable', 'CharSequence',
    'Collection', 'List', 'Set', 'SortedSet', 'Queue', 'Deque', 'Map', 'SortedMap', 'Entry', 'Function', 'BiFunction', 'Predicate', 'Consumer', 'BiConsumer', 'Supplier', 'UnaryOperator', 'BinaryOperator']);
  const EXCEPTION_PKG = { InputMismatchException: 'java.util', NoSuchElementException: 'java.util', ConcurrentModificationException: 'java.util',
    IOException: 'java.io', FileNotFoundException: 'java.io', EOFException: 'java.io', NotSerializableException: 'java.io' };
  const isBuiltinThrowable = name => name === 'Throwable' || (BUILTIN_SUPER[name] && BUILTIN_SUPER[name].length && ['Throwable', 'Exception', 'Error', 'RuntimeException', 'IOException', 'IndexOutOfBoundsException', 'IllegalArgumentException', 'NoSuchElementException'].includes(BUILTIN_SUPER[name][0]));

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
        if (kind === 'int' && v > 2147483648) throw compileError('integer number too large', line);
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
      this.unit = unit;
      this.tp = [];        // stack of type-parameter maps (name → erased bound)
      this.anon = 0;
      while (this.is('import') || this.is('package')) { while (!this.is(';')) this.next(); this.next(); }
      const hasClass = this.toks.some(t => t.t === 'kw' && (t.v === 'class' || t.v === 'interface' || t.v === 'enum'));
      if (hasClass) {
        while (this.peek().t !== 'eof') this.classDecl(null);
      } else {
        // snippet: statements and helper methods of an implicit class, run as main
        const cls = this.newClass('Main', 1);
        const body = [];
        unit.classes.push(cls);
        while (this.peek().t !== 'eof') {
          if (this.looksLikeMethod()) cls.methods.push(this.methodDecl(this.modifiers(), cls));
          else body.push(this.statement());
        }
        cls.methods.push({ name: 'main', params: [], ret: 'void', static: true, body: { k: 'Block', body, line: 1 }, line: 1, throws: [] });
        unit.snippet = true;
      }
      return unit;
    }
    newClass(name, line) {
      return { name, fields: [], methods: [], ctors: [], line, superName: null, interfaces: [], kind: 'class', abstract: false, final: false, static: true, outerName: null, typeParams: [], constants: [] };
    }
    modifiers() {
      const m = { static: false, final: false, access: null, abstract: false, default: false };
      for (;;) {
        if (this.is('static')) { m.static = true; this.next(); }
        else if (this.is('final')) { m.final = true; this.next(); }
        else if (this.is('public') || this.is('private') || this.is('protected')) { m.access = this.next().v; }
        else if (this.is('abstract')) { m.abstract = true; this.next(); }
        else if (this.is('default') && !this.is(':', 1) && !this.is('->', 1)) { m.default = true; this.next(); }
        else if (this.is('@')) { this.next(); this.ident(); if (this.is('(')) { let d = 0; do { if (this.is('(')) d++; if (this.is(')')) d--; this.next(); } while (d > 0); } }
        else if (this.peek().t === 'id' && ['synchronized', 'transient', 'volatile', 'native', 'strictfp'].includes(this.peek().v)) this.next();
        else return m;
      }
    }
    skipAngles(k) { // index just after the '>' matching a '<' at k; '>>' counts as two
      let depth = 0;
      for (;;) {
        const t = this.peek(k);
        if (t.t === 'eof') return k;
        if (t.v === '<') depth++;
        else if (t.v === '>') depth--;
        else if (t.v === '>>') depth -= 2;
        else if (t.v === '>>>') depth -= 3;
        k++;
        if (depth <= 0) return k;
      }
    }
    looksLikeMethod() {
      let k = 0;
      while (['static', 'public', 'private', 'protected', 'final', 'abstract'].includes(this.peek(k).v) && this.peek(k).t === 'kw') k++;
      if (this.is('<', k)) k = this.skipAngles(k);
      const t = this.peek(k);
      if (!(t.t === 'id' || (t.t === 'kw' && (PRIM.has(t.v) || t.v === 'void')))) return false;
      k++;
      if (this.is('<', k)) k = this.skipAngles(k);
      while (this.is('[', k) && this.is(']', k + 1)) k += 2;
      return this.peek(k).t === 'id' && this.is('(', k + 1);
    }
    // type parameters `<T, U extends Comparable<U>>` → pushes a map onto this.tp; returns the names
    typeParams() {
      const map = Object.create(this.tp.length ? this.tp[this.tp.length - 1] : null);
      const names = [];
      this.expect('<');
      do {
        const name = this.ident();
        let bound = 'Object';
        if (this.accept('extends')) { bound = this.type(); while (this.accept('&')) this.type(); }
        map[name] = bound; names.push(name);
      } while (this.accept(','));
      this.closeAngle();
      this.tp.push(map);
      return names;
    }
    closeAngle() {
      const t = this.peek();
      if (t.t === 'op' && (t.v === '>>' || t.v === '>>>')) { t.v = t.v.slice(1); return; } // consume one '>' of a '>>'
      this.expect('>');
    }
    classDecl(outer, mods) {
      const line = this.peek().line;
      mods = mods || this.modifiers();
      const kind = this.is('interface') ? 'interface' : this.is('enum') ? 'enum' : 'class';
      if (kind === 'class') this.expect('class'); else this.next();
      const name = this.ident();
      const cls = this.newClass(name, line);
      cls.kind = kind; cls.abstract = mods.abstract || kind === 'interface'; cls.final = mods.final || kind === 'enum';
      cls.static = !outer || mods.static || kind !== 'class';
      cls.outerName = outer ? outer.name : null;
      if (this.unit.classes.some(c => c.name === name)) throw compileError(`duplicate class: ${name}`, line);
      this.unit.classes.push(cls);
      if (this.is('<')) { if (kind === 'enum') throw compileError('enum types cannot have type parameters', line); cls.typeParams = this.typeParams(); }
      if (this.accept('extends')) {
        if (kind === 'interface') { do cls.interfaces.push(erase(this.type())); while (this.accept(',')); }
        else if (kind === 'enum') throw compileError('enum types cannot extend a class', line);
        else cls.superName = erase(this.type());
      }
      if (this.accept('implements')) {
        if (kind === 'interface') throw compileError("'{' expected (an interface extends other interfaces, it does not implement them)", line);
        do cls.interfaces.push(erase(this.type())); while (this.accept(','));
      }
      this.classBody(cls);
      if (cls.typeParams.length) this.tp.pop();
      return cls;
    }
    classBody(cls) {
      const name = cls.name;
      this.expect('{');
      if (cls.kind === 'enum') { // constants first: RED, GREEN(1), BLUE;
        while (this.peek().t === 'id') {
          const cline = this.peek().line;
          const cname = this.ident();
          const args = this.is('(') ? this.args() : [];
          if (this.is('{')) throw compileError('enum constants with a class body are not supported here', cline);
          cls.constants.push({ name: cname, args, line: cline });
          if (!this.accept(',')) break;
        }
        if (!this.accept(';') && !this.is('}')) throw compileError("';' expected after the enum constants", this.peek().line);
      }
      while (!this.is('}')) {
        if (this.peek().t === 'eof') throw compileError("reached end of file while parsing ('}' expected)", this.peek().line);
        if (this.accept(';')) continue;
        const mline = this.peek().line;
        const mods = this.modifiers();
        if (this.is('class') || this.is('interface') || this.is('enum')) { // nested type
          const nested = this.classDecl(cls, mods);
          if (cls.kind === 'interface') nested.static = true;
          continue;
        }
        if (this.is('{')) { // initializer block: treat as static/instance init statements
          const blk = this.block();
          cls.fields.push({ init: blk, static: mods.static, block: true, line: mline });
          continue;
        }
        if (this.is('<')) { // generic method
          const names = this.typeParams();
          const m = this.methodDecl(mods, cls);
          m.typeParams = names; this.tp.pop();
          cls.methods.push(m);
          continue;
        }
        if (this.peek().t === 'id' && this.peek().v === name && this.is('(', 1)) {
          if (cls.kind === 'interface') throw compileError('interfaces cannot have constructors', mline);
          this.next();
          const params = this.params();
          const throwsList = this.throwsClause();
          const body = this.block();
          cls.ctors.push({ params, body, line: mline, throws: throwsList, access: mods.access });
          continue;
        }
        const type = this.type();
        let fname = this.ident();
        if (this.is('(')) {
          this.p--; // unread name
          cls.methods.push(this.methodDecl(mods, cls, type, mline));
        } else {
          for (;;) { // int a, b[] = {1}, c;
            let ftype = type;
            while (this.accept('[')) { this.expect(']'); ftype += '[]'; }
            const init = this.accept('=') ? this.varInit(ftype) : null;
            const isStatic = mods.static || cls.kind === 'interface';
            cls.fields.push({ name: fname, type: ftype, init, static: isStatic, final: mods.final || cls.kind === 'interface', line: mline, access: mods.access });
            if (!this.accept(',')) break;
            fname = this.ident();
          }
          this.expect(';');
        }
      }
      this.expect('}');
    }
    throwsClause() {
      const list = [];
      if (this.accept('throws')) { do list.push(erase(this.type())); while (this.accept(',')); }
      return list;
    }
    methodDecl(mods, cls, type, line) {
      if (type === undefined) { line = this.peek().line; type = this.type(); }
      const name = this.ident();
      const params = this.params();
      while (this.accept('[')) { this.expect(']'); type += '[]'; }
      const throwsList = this.throwsClause();
      let body = null;
      const inInterface = cls && cls.kind === 'interface';
      if (this.accept(';')) {
        if (!(mods.abstract || (inInterface && !mods.static && !mods.default))) throw compileError(`missing method body, or declare abstract`, line);
        if (cls && cls.kind === 'class' && !cls.abstract) throw compileError(`${cls.name} is not abstract and does not override abstract method ${name}(${params.map(p => p.type).join(',')}) in ${cls.name}`, line);
      } else {
        if (mods.abstract) throw compileError('abstract methods cannot have a body', line);
        if (inInterface && !mods.static && !mods.default) throw compileError('interface abstract methods cannot have body', line);
        body = this.block();
      }
      const retGeneric = this.isTypeVar(type);
      return { name, params, ret: type, static: mods.static, body, line, abstract: body === null, final: mods.final, access: mods.access, throws: throwsList, retGeneric, default: mods.default };
    }
    params() {
      this.expect('(');
      const ps = [];
      if (!this.is(')')) {
        do {
          this.modifiers();
          let type = this.type();
          if (this.accept('...')) type += '[]';
          const name = this.ident();
          while (this.accept('[')) { this.expect(']'); type += '[]'; }
          ps.push({ type, name, generic: this.isTypeVar(type) });
        } while (this.accept(','));
      }
      this.expect(')');
      return ps;
    }
    isTypeVar(name) { return this.tp.length > 0 && name in this.tp[this.tp.length - 1]; }
    // a type: primitives, names (type variables erased to their bound), generic arguments kept as text, arrays
    type() {
      const t = this.peek();
      let name;
      if (t.t === 'kw' && (PRIM.has(t.v) || t.v === 'void')) name = this.next().v;
      else if (t.t === 'op' && t.v === '?') { this.next(); name = 'Object'; if (this.accept('extends')) name = this.type(); else if (this.accept('super')) this.type(); return name; }
      else if (t.t === 'id') { name = this.next().v; while (this.is('.') && this.peek(1).t === 'id') { this.next(); name = this.next().v; } }
      else throw compileError(`<identifier> expected, found '${t.v}'`, t.line);
      if (this.tp.length && name in this.tp[this.tp.length - 1]) name = this.tp[this.tp.length - 1][name];
      if (this.is('<')) {
        this.next();
        const targs = [];
        if (!this.is('>') && !this.is('>>') && !this.is('>>>')) { do targs.push(this.type()); while (this.accept(',')); }
        this.closeAngle();
        if (targs.length) name += '<' + targs.join(',') + '>';
      }
      while (this.is('[') && this.is(']', 1)) { this.next(); this.next(); name += '[]'; }
      return name;
    }
    isTypeStart(k = 0) {
      const t = this.peek(k);
      if (t.t === 'kw' && PRIM.has(t.v)) return true;
      if (t.t !== 'id') return false;
      // Name [ ] ... ident  |  Name ident  |  Name<...> ident  |  Name.Name ident
      let j = k + 1;
      while (this.is('.', j) && this.peek(j + 1).t === 'id') j += 2;
      if (this.is('<', j)) j = this.skipAngles(j);
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
            if ((this.isTypeStart() || this.is('final')) && this.forEachColon() >= 0 && this.is(':', this.forEachColon())) {
              this.accept('final'); const type = this.type(); const name = this.ident(); this.expect(':'); const iter = this.expr(); this.expect(')');
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
          case 'throw': { this.next(); const expr = this.expr(); this.expect(';'); return { k: 'Throw', expr, line }; }
          case 'try': {
            this.next();
            if (this.is('(')) throw compileError('try-with-resources is not supported here; close the resource in finally', line);
            const body = this.block();
            const catches = [];
            while (this.is('catch')) {
              const cline = this.next().line;
              this.expect('(');
              this.modifiers();
              const types = [erase(this.type())];
              while (this.accept('|')) types.push(erase(this.type()));
              const name = this.ident();
              this.expect(')');
              catches.push({ types, name, body: this.block(), line: cline });
            }
            const fin = this.accept('finally') ? this.block() : null;
            if (!catches.length && !fin) throw compileError("'catch' or 'finally' expected", line);
            return { k: 'Try', body, catches, fin, line };
          }
          case 'class': case 'interface': case 'enum': case 'abstract': {
            const cls = this.classDecl(null);
            cls.local = true;
            return { k: 'LocalClass', name: cls.name, line };
          }
        }
      }
      if (this.is('static') && (this.is('class', 1))) { const cls = this.classDecl(null); cls.local = true; return { k: 'LocalClass', name: cls.name, line }; }
      if (this.isTypeStart()) { const d = this.localDecl({ final: false }); this.expect(';'); return d; }
      const e = this.expr();
      this.expect(';');
      return { k: 'ExprStmt', expr: e, line };
    }
    forEachColon() { // index of the token after "Type name" in a for header (the ':' of a for-each)
      let j = 0;
      if (this.is('final', 0)) j++;
      if (this.peek(j).t === 'id') { j++; while (this.is('.', j) && this.peek(j + 1).t === 'id') j += 2; if (this.is('<', j)) j = this.skipAngles(j); }
      else if (this.peek(j).t === 'kw' && PRIM.has(this.peek(j).v)) j++;
      else return -1;
      while (this.is('[', j) && this.is(']', j + 1)) j += 2;
      return this.peek(j).t === 'id' ? j + 1 : -1;
    }
    exprList() { const xs = [this.expr()]; while (this.accept(',')) xs.push(this.expr()); return xs; }

    // ── expressions (precedence climbing) ──
    expr() { return this.assign(); }
    lambdaAhead() { // `x ->` | `(a, b) ->` | `(Type a, Type b) ->` | `() ->`
      if (this.peek().t === 'id' && this.is('->', 1)) return true;
      if (!this.is('(')) return false;
      let k = 1, depth = 1;
      while (depth > 0) { const t = this.peek(k); if (t.t === 'eof') return false; if (t.v === '(') depth++; if (t.v === ')') depth--; k++; }
      return this.is('->', k);
    }
    lambda() {
      const line = this.peek().line;
      const params = [];
      if (this.peek().t === 'id') params.push(this.ident());
      else {
        this.expect('(');
        if (!this.is(')')) do { if (this.isTypeStart()) this.type(); params.push(this.ident()); } while (this.accept(','));
        this.expect(')');
      }
      this.expect('->');
      if (this.is('{')) return { k: 'Lambda', params, body: this.block(), line };
      return { k: 'Lambda', params, expr: this.expr(), line };
    }
    assign() {
      if (this.lambdaAhead()) return this.lambda();
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
      const LEVELS = [['||'], ['&&'], ['|'], ['^'], ['&'], ['==', '!='], ['<', '>', '<=', '>='], ['<<', '>>', '>>>'], ['+', '-'], ['*', '/', '%']];
      if (level >= LEVELS.length) return this.unary();
      let l = this.binary(level + 1);
      for (;;) {
        const t = this.peek();
        if (t.t === 'op' && LEVELS[level].includes(t.v)) { this.next(); const r = this.binary(level + 1); l = { k: 'Bin', op: t.v, l, r, line: t.line }; }
        else if (level === 6 && t.t === 'kw' && t.v === 'instanceof') {
          this.next();
          const type = erase(this.type());
          const bind = this.peek().t === 'id' && !this.is('(', 1) ? this.ident() : null;
          l = { k: 'InstanceOf', e: l, type, bind, line: t.line };
        }
        else return l;
      }
    }
    unary() {
      const t = this.peek();
      if (t.t === 'op') {
        if (t.v === '++' || t.v === '--') { this.next(); const e = this.unary(); return { k: 'IncDec', op: t.v, prefix: true, target: e, line: t.line }; }
        if (t.v === '-' && this.peek(1).t === 'num' && this.peek(1).kind === 'int' && this.peek(1).v === 2147483648) { this.next(); this.next(); return { k: 'Lit', type: 'int', v: -2147483648, line: t.line }; }
        if (t.v === '-' || t.v === '+' || t.v === '!' || t.v === '~') { this.next(); return { k: 'Unary', op: t.v, e: this.unary(), line: t.line }; }
        if (t.v === '(' && this.peek(1).t === 'kw' && PRIM.has(this.peek(1).v) && this.is(')', 2)) {
          this.next(); const type = this.next().v; this.next();
          return { k: 'Cast', type, e: this.unary(), line: t.line };
        }
        if (t.v === '(' && this.peek(1).t === 'id') {
          let k = 2;
          while (this.is('.', k) && this.peek(k + 1).t === 'id') k += 2;
          if (this.is('<', k)) k = this.skipAngles(k);
          while (this.is('[', k) && this.is(']', k + 1)) k += 2;
          const nx = this.peek(k + 1);
          if (this.is(')', k) && (nx.t === 'id' || nx.t === 'str' || nx.t === 'char' || nx.t === 'num' || this.is('(', k + 1) || this.is('new', k + 1) || this.is('this', k + 1) || this.is('super', k + 1))) {
            this.next(); const type = this.type(); this.expect(')');
            return { k: 'Cast', type: erase(type), e: this.unary(), line: t.line };
          }
        }
        if (t.v === '(' && this.peek(1).t === 'kw' && PRIM.has(this.peek(1).v) && this.is('[', 2)) { // (int[]) o
          this.next(); const type = this.type(); this.expect(')');
          return { k: 'Cast', type, e: this.unary(), line: t.line };
        }
      }
      return this.postfix(this.primary());
    }
    postfix(e) {
      for (;;) {
        const t = this.peek();
        if (this.is('.') && this.is('new', 1)) { // outer.new Inner(...)
          this.next(); this.next();
          const cls = this.ident();
          if (this.is('<')) { this.next(); while (!this.is('>') && !this.is('>>')) this.next(); this.closeAngle(); }
          e = { k: 'New', cls, args: this.args(), line: t.line, outerExpr: e };
        } else if (this.is('.')) {
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
        case 'num':
          if (t.kind === 'int' && t.v > 2147483647) throw compileError('integer number too large', line);
          return { k: 'Lit', type: t.kind, v: t.v, line };
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
          if (t.v === 'super') {
            if (this.is('(')) return { k: 'Call', target: null, name: 'super', args: this.args(), line };
            this.expect('.');
            const name = this.ident();
            if (this.is('(')) return { k: 'Call', target: { k: 'Super', line }, name, args: this.args(), line };
            return { k: 'Member', target: { k: 'Super', line }, name, line };
          }
          if (t.v === 'new') {
            let base = this.peek().t === 'kw' && PRIM.has(this.peek().v) ? this.next().v : this.ident();
            while (this.is('.') && this.peek(1).t === 'id') { this.next(); base = this.next().v; }
            if (this.tp.length && base in this.tp[this.tp.length - 1]) throw compileError(`unexpected type: cannot instantiate the type variable ${base}`, line);
            let targs = null;
            if (this.is('<')) {
              this.next(); targs = [];
              if (!this.is('>') && !this.is('>>')) { do targs.push(this.type()); while (this.accept(',')); }
              this.closeAngle();
            }
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
            const args = this.args();
            if (this.is('{')) { // anonymous class
              const cls = this.newClass(`${base}$${++this.anon}`, line);
              cls.anon = base; cls.static = false;
              this.unit.classes.push(cls);
              this.classBody(cls);
              return { k: 'New', cls: cls.name, args, line, targs, anon: true };
            }
            return { k: 'New', cls: base, args, line, targs };
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
  // A value is { t, v }. t: 'int' 'long' 'double' 'float' 'boolean' 'char' 'String' 'null' | 'T[]' | class name | built-in object type.
  // char.v is a code unit; String.v is text and String.id an identity (literals interned by text);
  // boxed numbers (Integer …) carry v = number and id (cached like Java for -128..127);
  // arrays/objects: v = { id, elems } / { id, cls, fields, outer?, closure? }; collections: v = { id, kind, items | entries }.
  // A value read from a variable, field, cast or typed method also carries st = its static (declared) type,
  // which is what javac checks: `Animal a = new Dog(); a.fetch();` must fail even though the object is a Dog.
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
  const box = val => {
    const b = BOX[val.t];
    const cached = (b === 'Boolean') || (b === 'Character' ? val.v <= 127 : (b !== 'Double' && b !== 'Float' && val.v >= -128 && val.v <= 127));
    return { t: b, v: val.v, id: cached ? `B:${b}:${val.v}` : 'B' + (nextId++) };
  };
  const unboxed = val => isBox(val.t) ? V(UNBOX[val.t], val.v) : val;

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
  const hexId = id => (id * 2654435).toString(16).slice(0, 7);
  // Java's string conversion of a value (used by + and print)
  function* toStr(val, ctx, line) {
    switch (val.t) {
      case 'String': return val.v;
      case 'null': return 'null';
      case 'char': case 'Character': return String.fromCharCode(val.v);
      case 'boolean': case 'Boolean': return val.v ? 'true' : 'false';
      case 'double': case 'Double': return fmtDouble(val.v, false);
      case 'float': case 'Float': return fmtDouble(val.v, true);
      case 'int': case 'long': case 'byte': case 'short': case 'Integer': case 'Long': case 'Byte': case 'Short': return String(val.v);
      case 'Scanner': return 'java.util.Scanner';
      case 'StringBuilder': return val.v.text;
      case '$Lambda': return `Main$$Lambda@${hexId(val.v.id)}`;
      case 'Class': return (val.v.iface ? 'interface ' : 'class ') + val.v.name;
    }
    if (val.t.endsWith('[]')) return `[${val.t.startsWith('int') || val.t.startsWith('String') ? (val.t.startsWith('int') ? 'I' : 'Ljava.lang.String;') : val.t[0].toUpperCase()}@${hexId(val.v.id)}`;
    if (val.v && val.v.kind) return yield* ctx.collectionToString(val, line);
    if (val.t === 'Entry') return (yield* toStr(val.v.k, ctx, line)) + '=' + (yield* toStr(val.v.val, ctx, line));
    const cls = ctx.classes[val.t];
    if (cls) {
      const m = ctx.findMethod(cls, 'toString', [], line, true);
      if (m && !m.builtin) { const r = yield* ctx.invoke(m.cls, m, val, [], line); return r.v; }
      if (val.v.enumName !== undefined) return val.v.enumName;
      if (ctx.isSubtype(val.t, 'Throwable')) { const msg = val.v.fields.message; return val.t + (msg && msg.v !== null ? ': ' + msg.v : ''); }
      return `${val.t}@${hexId(val.v.id)}`;
    }
    if (val.v && val.v.name !== undefined) return val.v.name; // File and friends
    return String(val.v);
  }
  // Short display of a value for the variables panel (no user code is run)
  function show(val, depth = 0) {
    if (val.v === null || val.v === undefined) return isNum(val.t) || val.t === 'boolean' ? '?' : 'null';
    switch (val.t) {
      case 'String': return JSON.stringify(val.v);
      case 'null': return 'null';
      case 'char': return "'" + String.fromCharCode(val.v).replace('\n', '\\n').replace('\t', '\\t') + "'";
      case 'Character': return "'" + String.fromCharCode(val.v) + "'";
      case 'boolean': case 'Boolean': return val.v ? 'true' : 'false';
      case 'double': case 'Double': return fmtDouble(val.v, false);
      case 'float': case 'Float': return fmtDouble(val.v, true);
      case 'int': case 'long': case 'byte': case 'short': case 'Integer': case 'Long': case 'Byte': case 'Short': return String(val.v);
      case 'Scanner': return 'Scanner#' + val.v.id;
      case 'StringBuilder': return `StringBuilder#${val.v.id} ${JSON.stringify(val.v.text)}`;
      case '$Lambda': return 'lambda#' + val.v.id;
      case 'Iterator': case 'ListIterator': return `${val.t}#${val.v.id} (at ${val.v.pos})`;
      case 'Entry': return `${show(val.v.k, depth + 1)}=${show(val.v.val, depth + 1)}`;
      case 'Class': return 'Class ' + val.v.name;
    }
    if (val.t.endsWith('[]')) {
      const et = val.t.slice(0, -2);
      if (depth > 1) return `${val.t}#${val.v.id}`;
      const items = val.v.elems.slice(0, 12).map(e => show(tagElem(et, e), depth + 1));
      if (val.v.elems.length > 12) items.push(`… (${val.v.elems.length})`);
      return `#${val.v.id} [${items.join(', ')}]`;
    }
    if (val.v.kind) { // collections
      if (depth > 1) return `${val.t}#${val.v.id}`;
      if (val.v.kind === 'map') {
        const items = val.v.entries.slice(0, 10).map(en => `${show(en.k, depth + 1)}=${show(en.val, depth + 1)}`);
        if (val.v.entries.length > 10) items.push(`… (${val.v.entries.length})`);
        return `${val.t}#${val.v.id} {${items.join(', ')}}`;
      }
      const src = val.v.kind === 'view' ? val.v.of() : val.v.items;
      const items = src.slice(0, 12).map(e => show(e, depth + 1));
      if (src.length > 12) items.push(`… (${src.length})`);
      return `${val.t}#${val.v.id} [${items.join(', ')}]`;
    }
    if (val.v.enumName !== undefined) return val.v.enumName;
    if (val.v.name !== undefined && !val.v.fields) return `${val.t}(${JSON.stringify(val.v.name)})`; // File, PrintWriter …
    if (depth > 1) return `${val.t}#${val.v.id}`;
    const fs = Object.entries(val.v.fields || {}).filter(([k]) => !k.startsWith('$')).map(([k, v]) => `${k}=${showSlot(v, depth + 1)}`);
    return `${val.t}#${val.v.id}{${fs.join(', ')}}`;
  }
  const showSlot = (slot, depth) => show(slot.rt && slot.v !== null ? { t: slot.rt, v: slot.v, id: slot.id } : slot, depth);
  const tagElem = (et, raw) => raw === null || raw === undefined ? NULL : (typeof raw === 'object' && 't' in raw) ? raw : V(et, raw);

  // subtype test over user classes (ctx.classes) and the built-in tables; both arguments erased
  function isSubtypeIn(classes, a, b) {
    a = erase(a); b = erase(b);
    if (a === b || b === 'Object') return true;
    if (a === 'null') return isRef(b);
    if (a === '$Lambda') return BUILTIN_INTERFACES.has(b) || (classes[b] && classes[b].kind === 'interface');
    if (a.endsWith('[]')) { if (!b.endsWith('[]')) return b === 'Cloneable' || b === 'Serializable'; const ea = a.slice(0, -2), eb = b.slice(0, -2); return isRef(ea) && isRef(eb) ? isSubtypeIn(classes, ea, eb) : ea === eb; }
    const seen = new Set();
    const walk = t => {
      if (t === b) return true;
      if (seen.has(t)) return false; seen.add(t);
      const c = classes[t];
      if (c) return (c.superName && walk(c.superName)) || c.interfaces.some(walk);
      const sup = BUILTIN_SUPER[t];
      return !!sup && sup.some(walk);
    };
    return walk(a);
  }

  // Can a value be stored in a slot of type `to` (assignment context)? Uses the static type when the value has one.
  function assignable(val, to, ctx) {
    to = erase(to);
    const from = val.st && isRef(val.st) && val.t !== 'null' ? val.st : val.t;
    if (from === to) return true;
    if (from === 'null') return isRef(to) || (isBox(val.st) && (UNBOX[val.st] === to || (isNum(to) && ['byte', 'short', 'char', 'int', 'long', 'float'].indexOf(UNBOX[val.st]) < ['byte', 'short', 'char', 'int', 'long', 'float', 'double'].indexOf(to) && UNBOX[val.st] !== 'char' && to !== 'char')));
    const widen = { byte: ['short', 'int', 'long', 'float', 'double'], short: ['int', 'long', 'float', 'double'], char: ['int', 'long', 'float', 'double'],
      int: ['long', 'float', 'double'], long: ['float', 'double'], float: ['double'] };
    if (isNum(from) && isNum(to)) {
      if (widen[from] && widen[from].includes(to)) return true;
      // int constant → byte/short/char is allowed by javac when it fits
      return from === 'int' && (to === 'char' || to === 'byte' || to === 'short') && !!val.constant;
    }
    if (isNum(from) && isRef(to)) return isSubtypeIn(ctx ? ctx.classes : {}, BOX[from], to) || (val.constant && from === 'int' && (to === 'Byte' || to === 'Short' || to === 'Character'));
    if (from === 'boolean') return isRef(to) && isSubtypeIn(ctx ? ctx.classes : {}, 'Boolean', to);
    if (isBox(from)) {
      const p = UNBOX[from];
      if (to === p) return true;
      if (isNum(to)) return !!(widen[p] && widen[p].includes(to));
      if (to === 'boolean') return false;
    }
    if (isRef(from) && isRef(to)) return isSubtypeIn(ctx ? ctx.classes : {}, from, to);
    return false;
  }
  function convert(val, to) {
    to = erase(to);
    if (val.t === to) return val;
    if (val.t === 'null') { if (!isRef(to)) throw runtimeError('NullPointerException', `Cannot unbox null value (a ${val.st || 'null'} reference holding null was used as ${to})`, 0); return NULL; }
    if (isRef(to)) { // boxing, or a reference stored as is
      if (isNum(val.t) || val.t === 'boolean') { if (isBox(to) && UNBOX[to] !== val.t) return box(convert(val, UNBOX[to])); return box(val); }
      return val;
    }
    if (isBox(val.t)) val = unboxed(val);
    if (to === 'boolean') return V('boolean', val.v);
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
  const typeName = t => t === 'null' ? '<null>' : t === '$Lambda' ? 'lambda' : t;
  const sigOf = m => m.name + '(' + m.params.map(p => erase(p.type)).join(',') + ')';

  /* ════════════════════════════════════════════════════════════════
     4. Interpreter (generators: `yield` = one recorded step)
     ════════════════════════════════════════════════════════════════ */
  class Env {
    constructor(parent, frame) { this.vars = new Map(); this.parent = parent; this.frame = frame || (parent && parent.frame); }
    // a frame's root env may chain to the environment a lambda / anonymous class captured, so lookup walks every parent
    lookup(name) { for (let e = this; e; e = e.parent) { if (e.vars.has(name)) return e.vars.get(name); } return null; }
    declare(name, type, val, isFinal, line) {
      for (let e = this; e; e = e.parent) { if (e.vars.has(name)) throw compileError(`variable ${name} is already defined in method ${this.frame.name}`, line); if (e.frame && e === e.frame.env) break; }
      const slot = { t: type, v: val, final: !!isFinal, name };
      this.vars.set(name, slot); return slot;
    }
  }
  const BREAK = { sig: 'break' }, CONTINUE = { sig: 'continue' };
  const OBJECT_METHODS = new Set(['toString', 'equals', 'hashCode', 'getClass']);
  const ACCESS_RANK = { private: 0, package: 1, protected: 2, public: 3 };
  class ThrowSignal { constructor(val, line) { this.val = val; this.line = line; } }

  function pickOverload(cands, args, name, line, ctx) {
    let best = null, bestScore = -1;
    for (const m of cands) {
      let score = 0, ok = true;
      m.params.forEach((p, i) => {
        const a = args[i];
        const pt = erase(p.type);
        const at = a.st && isRef(a.st) && a.t !== 'null' ? a.st : a.t;
        if (at === pt) score += 3;
        else if (assignable(a, pt, ctx)) score += (a.t === 'null' ? 2 : isNum(at) && isNum(pt) ? 1 : (pt === 'Object' ? 0.5 : 1));
        else ok = false;
      });
      if (ok && score > bestScore) { best = m; bestScore = score; }
    }
    if (!best) throw compileError(`no suitable ${name === '<init>' ? 'constructor' : 'method'} found for ${name}(${args.map(a => typeName(a.st || a.t)).join(',')})`, line);
    return best;
  }
  class Interp {
    constructor(unit, stdin, opts) {
      this.unit = unit; this.classes = {};
      for (const c of unit.classes) { this.classes[c.name] = c; c.statics = {}; }
      this.stdinReader = { text: stdin || '', pos: 0, stdin: true };
      this.out = '';
      this.stack = [];
      this.steps = 0; this.maxSteps = (opts && opts.maxSteps) || 5000;
      this.trace = [];
      this.maxDepth = 200;
      this.files = Object.assign({}, (opts && opts.files) || {}); // virtual file system: name → text
      this.binFiles = {};                                          // name → [serialized values] (object streams)
      this.filesUsed = !!(opts && opts.files && Object.keys(opts.files).length);
      this.fsVersion = 0;
      this.fsHistory = { 0: this.fileView() };
      this.link();
      this.checkExceptions();
    }
    // ── linking: resolve supertypes, validate the hierarchy, check abstract methods are implemented ──
    link() {
      for (const c of this.unit.classes) {
        if (c.anon) { // anonymous class: the named type is a class to extend or an interface to implement
          const target = this.classes[c.anon];
          if ((target && target.kind === 'interface') || BUILTIN_INTERFACES.has(c.anon)) c.interfaces = [c.anon];
          else c.superName = c.anon;
        }
        if (c.kind === 'class' && !c.superName) c.superName = 'Object';
        if (c.superName && c.superName !== 'Object') {
          const s = this.classes[c.superName];
          if (!s && !BUILTIN_SUPER[c.superName]) throw compileError(`cannot find symbol: class ${c.superName}`, c.line);
          if (s && s.kind === 'interface') throw compileError(`no interface expected here (${c.name} implements ${c.superName}, it does not extend it)`, c.line);
          if (s && s.final) throw compileError(`cannot inherit from final ${c.superName}`, c.line);
          if (s && s.kind === 'enum') throw compileError(`cannot inherit from final ${c.superName}`, c.line);
          if (BUILTIN_INTERFACES.has(c.superName)) throw compileError(`no interface expected here`, c.line);
          if (BUILTIN_SUPER[c.superName] && !isBuiltinThrowable(c.superName) && !['Object', 'Throwable'].includes(c.superName)) throw compileError(`cannot inherit from final ${c.superName}`, c.line);
        }
        for (const i of c.interfaces) {
          const s = this.classes[i];
          if (!s && !BUILTIN_INTERFACES.has(i)) throw compileError(`cannot find symbol: class ${i}`, c.line);
          if (s && s.kind !== 'interface') throw compileError(`interface expected here`, c.line);
        }
        for (const m of c.methods) m.cls = c;
      }
      // cycles
      for (const c of this.unit.classes) { const seen = new Set(); let s = c; while (s) { if (seen.has(s.name)) throw compileError(`cyclic inheritance involving ${c.name}`, c.line); seen.add(s.name); s = s.superName ? this.classes[s.superName] : null; } }
      // overriding rules and abstract methods
      for (const c of this.unit.classes) {
        for (const m of c.methods) {
          if (m.static || c.kind === 'interface') continue;
          const inherited = this.findMethodIn(this.superOf(c), m.name, m.params.length, true);
          const same = inherited.find(x => sigOf(x) === sigOf(m));
          if (same && same.final) throw compileError(`${sigOf(m)} in ${c.name} cannot override ${sigOf(same)} in ${same.cls.name}; overridden method is final`, m.line);
          if (same && same.static) throw compileError(`${sigOf(m)} in ${c.name} cannot override ${sigOf(same)} in ${same.cls.name}; overriding method is not static`, m.line);
          if (same && erase(same.ret) !== erase(m.ret) && !same.retGeneric && !(isRef(same.ret) && isRef(m.ret) && this.isSubtype(m.ret, same.ret))) throw compileError(`${sigOf(m)} in ${c.name} cannot override ${sigOf(same)} in ${same.cls.name}; return type ${erase(m.ret)} is not compatible with ${erase(same.ret)}`, m.line);
          if (same && same.access !== 'private' && ACCESS_RANK[m.access || 'package'] < ACCESS_RANK[same.access || 'package']) throw compileError(`${sigOf(m)} in ${c.name} cannot override ${sigOf(same)} in ${same.cls.name}; attempting to assign weaker access privileges; was ${same.access || 'package'}`, m.line);
        }
        if (c.kind === 'class' && !c.abstract) {
          const missing = this.abstractMethods(c).find(am => !this.implementationOf(c, am));
          if (missing) throw compileError(`${c.name} is not abstract and does not override abstract method ${sigOf(missing)} in ${missing.cls.name}`, c.line);
        }
      }
    }
    superOf(c) { return c && c.superName ? this.classes[c.superName] || null : null; }
    // every abstract method the class inherits (own abstract ones included), from classes and interfaces
    abstractMethods(c) {
      const out = [], seen = new Set();
      const walk = k => {
        if (!k || seen.has(k.name)) return; seen.add(k.name);
        for (const m of k.methods) if (m.abstract) out.push(m);
        walk(this.superOf(k)); k.interfaces.forEach(i => walk(this.classes[i]));
      };
      walk(c);
      return out;
    }
    implementationOf(c, am) {
      const sig = sigOf(am);
      for (let k = c; k; k = this.superOf(k)) { const m = k.methods.find(x => !x.abstract && !x.static && sigOf(x) === sig); if (m) return m; }
      // default method in an interface
      const seen = new Set();
      const walk = k => { if (!k || seen.has(k.name)) return null; seen.add(k.name); const m = k.methods.find(x => x.default && sigOf(x) === sig); if (m) return m; for (const i of k.interfaces) { const r = walk(this.classes[i]); if (r) return r; } return walk(this.superOf(k)); };
      return walk(c);
    }
    isSubtype(a, b) { return isSubtypeIn(this.classes, a, b); }
    isChecked(t) { return this.isSubtype(t, 'Throwable') && !this.isSubtype(t, 'RuntimeException') && !this.isSubtype(t, 'Error'); }
    // methods named `name` with `arity` params visible from class `cls`: own first, then inherited, then interface defaults
    findMethodIn(cls, name, arity, includeAbstract) {
      const out = [], seen = new Set(), visited = new Set();
      const add = k => {
        if (!k || visited.has(k.name)) return; visited.add(k.name);
        for (const m of k.methods) if (m.name === name && m.params.length === arity && (includeAbstract || !m.abstract || k.kind === 'interface')) { const s = sigOf(m); if (!seen.has(s)) { seen.add(s); out.push(m); } }
        add(this.superOf(k));
        for (const i of k.interfaces) add(this.classes[i]);
      };
      add(cls);
      return out;
    }
    findMethod(cls, name, args, line, quiet) {
      const cands = this.findMethodIn(cls, name, args.length, true);
      if (!cands.length) {
        if (quiet) return null;
        const any = this.findMethodIn(cls, name, -1, true).length || [cls, ...this.chainOf(cls)].some(k => k.methods.some(m => m.name === name));
        const anyM = [cls, ...this.chainOf(cls)].flatMap(k => k.methods.filter(m => m.name === name));
        if (any && anyM.length) throw compileError(`method ${name} in class ${anyM[0].cls.name} cannot be applied to given types: required ${anyM[0].params.map(p => erase(p.type)).join(',') || 'no arguments'}, found ${args.map(a => typeName(a.st || a.t)).join(',') || 'no arguments'}`, line);
        throw compileError(`cannot find symbol: method ${name}(${args.map(a => typeName(a.st || a.t)).join(',')}) in ${cls.kind} ${cls.name}`, line);
      }
      return pickOverload(cands, args, name, line, this);
    }
    chainOf(cls) { const out = []; for (let k = this.superOf(cls); k; k = this.superOf(k)) out.push(k); return out; }
    // the field/static slot of a user class chain
    findFieldDecl(cls, name) { for (let k = cls; k; k = this.superOf(k)) { const f = k.fields.find(x => x.name === name); if (f) return { f, cls: k }; } return null; }
    findStatic(cls, name) {
      for (let k = cls; k; k = this.superOf(k)) if (k.statics[name]) return k.statics[name];
      const seen = new Set();
      const walk = k => { if (!k || seen.has(k.name)) return null; seen.add(k.name); if (k.statics[name]) return k.statics[name]; for (const i of k.interfaces) { const r = walk(this.classes[i]); if (r) return r; } return walk(this.superOf(k)); };
      return walk(cls);
    }

    // ── checked exceptions: `unreported exception X; must be caught or declared to be thrown` ──
    checkExceptions() {
      const self = this;
      const ctorThrows = (name) => { const c = this.classes[name]; return c ? c.ctors.flatMap(k => k.throws) : []; };
      const walkBody = (body, handled, declared, where) => {
        const covered = (t, handled) => handled.some(h => this.isSubtype(t, h)) || declared.some(d => this.isSubtype(t, d));
        const report = (t, line, handled) => { if (this.isChecked(t) && !covered(t, handled)) throw compileError(`unreported exception ${t}; must be caught or declared to be thrown`, line); };
        const callThrows = (e) => { // what a call may throw: user methods by name+arity, known library calls
          const out = [];
          if (e.k === 'New') {
            if (this.classes[e.cls]) out.push(...ctorThrows(e.cls));
            const a0 = e.args[0];
            const fileArg = a0 && (a0.k === 'New' && ['File', 'FileReader', 'FileInputStream', 'FileWriter', 'FileOutputStream', 'BufferedReader', 'BufferedWriter'].includes(a0.cls) || a0.k === 'Lit' && a0.type === 'String' || a0.k === 'Name');
            if (['Scanner', 'PrintWriter', 'FileReader', 'FileInputStream'].includes(e.cls) && fileArg && !(a0.k === 'Member' && a0.name === 'in')) out.push('FileNotFoundException');
            if (['FileWriter', 'FileOutputStream', 'ObjectOutputStream', 'ObjectInputStream'].includes(e.cls)) out.push(e.cls === 'FileOutputStream' ? 'FileNotFoundException' : 'IOException');
          } else if (e.k === 'Call') {
            if (e.target && e.target.k === 'Name' && e.target.name === 'Thread' && e.name === 'sleep') out.push('InterruptedException');
            if (['readLine', 'writeObject', 'readObject', 'write', 'newLine'].includes(e.name) && e.target) { out.push('IOException'); if (e.name === 'readObject') out.push('ClassNotFoundException'); }
            const user = this.unit.classes.flatMap(c => c.methods.filter(m => m.name === e.name && m.params.length === e.args.length));
            if (user.length && (!e.target || e.target.k !== 'Name' || !['System', 'Math', 'Integer', 'Double', 'String', 'Arrays', 'Collections', 'Character'].includes(e.target.name))) out.push(...user[0].throws);
            if (!e.target && e.name === 'super' && where.cls) out.push(...ctorThrows(where.cls.superName));
            if (!e.target && e.name === 'this' && where.cls) out.push(...ctorThrows(where.cls.name));
          }
          return out;
        };
        const expr = (e, handled) => {
          if (!e || typeof e !== 'object') return;
          if (e.k === 'Lambda') return; // a lambda body is checked against its own functional interface; skipped here
          if (e.k === 'New' || e.k === 'Call') for (const t of callThrows(e)) report(t, e.line, handled);
          for (const key of Object.keys(e)) { const v = e[key]; if (Array.isArray(v)) v.forEach(x => x && typeof x === 'object' && x.k && expr(x, handled)); else if (v && typeof v === 'object' && v.k) expr(v, handled); }
        };
        const stmt = (s, handled) => {
          if (!s) return;
          switch (s.k) {
            case 'Block': s.body.forEach(x => stmt(x, handled)); return;
            case 'Try': {
              const inner = handled.concat(s.catches.flatMap(c => c.types));
              stmt(s.body, inner);
              s.catches.forEach(c => stmt(c.body, handled.concat(c.types.map(() => '$rethrow'))));
              if (s.fin) stmt(s.fin, handled);
              return;
            }
            case 'Throw': {
              if (s.expr.k === 'New') { const t = s.expr.cls; if (this.classes[t] || BUILTIN_SUPER[t]) { const c = this.classes[t]; if (c && c.anon) { /* anonymous */ } else if (!covered(t, handled) && this.isChecked(t)) throw compileError(`unreported exception ${t}; must be caught or declared to be thrown`, s.line); } }
              expr(s.expr, handled);
              return;
            }
            case 'If': expr(s.cond, handled); stmt(s.then, handled); stmt(s.els, handled); return;
            case 'While': case 'DoWhile': expr(s.cond, handled); stmt(s.body, handled); return;
            case 'For': if (s.init) { if (s.init.k === 'VarDecl') s.init.decls.forEach(d => expr(d.init, handled)); else s.init.exprs.forEach(x => expr(x, handled)); } expr(s.cond, handled); (s.update || []).forEach(x => expr(x, handled)); stmt(s.body, handled); return;
            case 'ForEach': expr(s.iter, handled); stmt(s.body, handled); return;
            case 'Switch': expr(s.subject, handled); s.cases.forEach(c => c.body.forEach(x => stmt(x, handled))); return;
            case 'VarDecl': s.decls.forEach(d => expr(d.init, handled)); return;
            case 'ExprStmt': expr(s.expr, handled); return;
            case 'Return': expr(s.value, handled); return;
            case 'LocalClass': return;
          }
        };
        stmt(body, handled);
      };
      for (const c of this.unit.classes) {
        for (const m of c.methods) if (m.body) walkBody(m.body, [], m.throws, { cls: c, name: m.name });
        for (const k of c.ctors) walkBody(k.body, [], k.throws, { cls: c, name: '<init>' });
        for (const f of c.fields) if (f.init && !f.block) walkBody({ k: 'ExprStmt', expr: f.init, line: f.line }, [], [], { cls: c });
      }
      void self;
    }

    // ── snapshots ──
    snap(line, note) {
      const frames = [];
      const statics = [];
      for (const c of this.unit.classes) for (const [k, slot] of Object.entries(c.statics)) if (!slot.hidden) statics.push([`${c.name}.${k}`, showSlot(slot)]);
      if (statics.length) frames.push({ name: 'static fields', vars: statics, kind: 'static' });
      for (const f of this.stack) {
        const vars = [];
        if (f.self) vars.push(['this', show(f.self)]);
        const scopes = []; // outermost first, so main's variables come before a loop's
        for (let e = f.scope || f.env; e; e = e.parent) { scopes.unshift(e); if (e === f.env) break; }
        for (const e of scopes) for (const s of e.vars.values()) vars.push([s.name, showSlot(s)]);
        frames.push({ name: f.name, vars });
      }
      this.trace.push({ line, frames, outLen: this.out.length, note: note || null, files: this.fsVersion });
    }
    touchFiles() { this.filesUsed = true; this.fsVersion++; this.fsHistory[this.fsVersion] = this.fileView(); }
    fileView() { const o = {}; for (const [k, v] of Object.entries(this.files)) o[k] = v; for (const [k, v] of Object.entries(this.binFiles)) o[k] = `«object stream: ${v.length} object${v.length === 1 ? '' : 's'}»`; return o; }
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
      // static field initialisers and enum constants, in order
      for (const c of this.unit.classes) yield* this.initStatics(c);
      const main = mainCls.methods.find(m => m.name === 'main' && m.static);
      const args = main.params.length ? [V('String[]', { id: nextId++, elems: [] })] : [];
      yield* this.invoke(mainCls, main, null, args, main.line);
    }
    *initStatics(c) {
      if (c.kind === 'enum') {
        c.constants.forEach((k, i) => { c.statics[k.name] = { t: c.name, v: null, final: true, name: k.name, hidden: true }; });
        for (let i = 0; i < c.constants.length; i++) {
          const k = c.constants[i];
          const frame = this.pushFrame(`enum ${c.name}`, null); frame.cls = c;
          const args = []; for (const a of k.args) args.push(yield* this.eval(a, frame.env));
          this.stack.pop();
          const obj = yield* this.instantiate(c, args, k.line, { enumName: k.name, ordinal: i });
          c.statics[k.name].v = obj.v; c.statics[k.name].rt = c.name;
        }
      }
      for (const f of c.fields) if (f.static) {
        const frame = this.pushFrame(`static init of ${c.name}`, null); frame.cls = c;
        if (f.block) yield* this.execBlockIn(f.init, frame.env, true);
        else {
          c.statics[f.name] = { t: f.type, v: isDefault(erase(f.type)).v, final: f.final, name: f.name };
          if (f.init) this.store(c.statics[f.name], yield* this.eval(f.init, frame.env, f.type), f.line, true);
        }
        this.stack.pop();
      }
    }
    pushFrame(name, self, closure) {
      if (this.stack.length >= this.maxDepth) throw runtimeError('StackOverflowError', 'too many nested method calls', 0);
      const frame = { name, self, env: null, scope: null };
      frame.env = new Env(closure || null, frame);
      this.stack.push(frame);
      return frame;
    }
    *invoke(cls, m, self, args, line) {
      const closure = self && self.v && self.v.closure && !m.static ? self.v.closure : null;
      const frame = this.pushFrame(`${m.name === '<init>' ? cls.name : m.name}(${m.params.map(p => erase(p.type)).join(', ')})`, self, closure);
      frame.cls = cls; frame.method = m;
      const depth = this.stack.length;
      if (!m.body) throw compileError(`abstract method ${sigOf(m)} in ${cls.kind} ${cls.name} cannot be accessed directly`, line);
      try {
        m.params.forEach((p, i) => this.store(frame.env.declare(p.name, p.type, null, false, line), args[i], line, true));
        const sig = yield* this.execBlockIn(m.body, frame.env, true);
        if (this.stack.length === 1 && m.name === 'main') this.snap(null, 'finished'); // main's variables stay visible at the end
        if (sig && sig.sig === 'return') {
          if (m.ret === 'void') throw compileError('incompatible types: unexpected return value', sig.line);
          const r = sig.value;
          if (r.t === 'void') throw compileError(`incompatible types: missing return value`, sig.line);
          if (!assignable(r, m.ret, this)) throw compileError(`incompatible types: ${typeName(r.st || r.t)} cannot be converted to ${erase(m.ret)}`, sig.line);
          const out = convert(r, m.ret);
          if (isRef(erase(m.ret)) && !m.retGeneric && erase(m.ret) !== 'Object') out.st = erase(m.ret); else delete out.st;
          return out;
        }
        if (m.ret !== 'void' && m.name !== '<init>') throw compileError(`missing return statement in ${m.name}`, m.line);
        return V('void', undefined);
      } finally { this.stack.length = depth - 1; }
    }
    *execBlockIn(block, env, sameScope) {
      const inner = sameScope ? env : new Env(env);
      for (const s of block.body) { const sig = yield* this.exec(s, inner); if (sig) return sig; }
      return null;
    }
    store(slot, val, line, init) {
      if (slot.final && !init && slot.assigned) throw compileError(`cannot assign a value to final variable ${slot.name}`, line);
      if (val.t === 'void') throw compileError(`'void' type not allowed here`, line);
      if (!assignable(val, slot.t, this)) {
        const from = typeName(val.st && isRef(val.st) && val.t !== 'null' ? val.st : val.t);
        if (isNum(val.t) && isNum(erase(slot.t))) throw compileError(`incompatible types: possible lossy conversion from ${val.t} to ${slot.t}`, line);
        throw compileError(`incompatible types: ${from} cannot be converted to ${slot.t}`, line);
      }
      const c = convert(val, slot.t);
      slot.v = c.v; slot.assigned = true;
      if (isRef(erase(slot.t))) { slot.rt = c.t; slot.id = c.id; } else { delete slot.rt; delete slot.id; }
      return c;
    }
    read(slot) {
      const st = erase(slot.t);
      if (slot.v === null) { if (isBox(st)) { const n = V('null', null); n.st = st; return n; } return NULL; }
      const v = V(isRef(st) ? (slot.rt || st) : st, slot.v);
      if (slot.id !== undefined) v.id = slot.id;
      if (isRef(st) && st !== 'Object') v.st = st;
      return v;
    }

    // ── statements ──
    *exec(s, env) {
      switch (s.k) {
        case 'Block': return yield* this.execBlockIn(s, env, false);
        case 'Empty': return null;
        case 'LocalClass': { const c = this.classes[s.name]; c.closure = env; c.outerSelf = this.stack[this.stack.length - 1].self; return null; }
        case 'VarDecl': {
          yield* this.step(s.line, env);
          for (const d of s.decls) {
            const slot = env.declare(d.name, d.type, isDefault(erase(d.type)).v, s.final, s.line);
            slot.assigned = false; if (d.generic) slot.generic = true;
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
            if (s.init.k === 'VarDecl') { for (const d of s.init.decls) { const slot = scope.declare(d.name, d.type, isDefault(erase(d.type)).v, false, s.line); if (d.init) this.store(slot, yield* this.eval(d.init, scope, d.type), s.line, true); } }
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
          const src = yield* this.eval(s.iter, env);
          if (src.t === 'null') throw runtimeError('NullPointerException', 'Cannot iterate because the collection is null', s.line);
          let next; // generator-returning function: () → value | undefined at the end
          if (src.t.endsWith('[]')) {
            const et = src.t.slice(0, -2), elems = src.v.elems; let i = 0;
            next = function* () { return i < elems.length ? tagElem(et, elems[i++]) : undefined; };
          } else if (src.v && src.v.kind) {
            const it = this.makeIterator(src, s.line);
            const self = this;
            next = function* () { return self.iteratorHasNext(it) ? self.iteratorNext(it, s.line) : undefined; };
          } else if (this.classes[src.t] && this.findMethod(this.classes[src.t], 'iterator', [], s.line, true)) {
            const m = this.findMethod(this.classes[src.t], 'iterator', [], s.line, true);
            const it = yield* this.invoke(m.cls, m, src, [], s.line);
            const self = this;
            next = function* () {
              const hn = yield* self.callMethodOn(it, 'hasNext', [], s.line);
              if (!hn.v) return undefined;
              return yield* self.callMethodOn(it, 'next', [], s.line);
            };
          } else throw compileError(`for-each not applicable to expression type ${typeName(src.st || src.t)}`, s.line);
          let k = 0;
          for (;;) {
            const item = yield* next();
            if (item === undefined) return null;
            if (k++ > 0) yield* this.step(s.line, env);
            const scope = new Env(env);
            const slot = scope.declare(s.name, s.type, isDefault(erase(s.type)).v, false, s.line);
            this.store(slot, item, s.line, true);
            const sig = yield* this.exec(s.body, scope);
            if (sig === BREAK) return null;
            if (sig && sig.sig === 'return') return sig;
          }
        }
        case 'Switch': {
          yield* this.step(s.line, env);
          let subj = yield* this.eval(s.subject, env);
          subj = unboxed(subj);
          const enumCls = subj.v && subj.v.enumName !== undefined ? this.classes[subj.t] : null;
          let start = -1;
          for (let i = 0; i < s.cases.length && start < 0; i++) {
            for (const lab of s.cases[i].labels) {
              let lv;
              if (enumCls && lab.k === 'Name') { const slot = enumCls.statics[lab.name]; if (!slot) throw compileError(`an enum switch case label must be the unqualified name of an enumeration constant`, lab.line); lv = this.read(slot); }
              else lv = yield* this.eval(lab, env);
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
        case 'Throw': {
          yield* this.step(s.line, env);
          const val = yield* this.eval(s.expr, env);
          if (val.t === 'null') throw runtimeError('NullPointerException', 'Cannot throw exception because value is null', s.line);
          if (!this.isSubtype(val.t, 'Throwable')) throw compileError(`incompatible types: ${typeName(val.st || val.t)} cannot be converted to Throwable`, s.line);
          throw new ThrowSignal(val, s.line);
        }
        case 'Try': {
          const depth = this.stack.length;
          const frame = this.stack[depth - 1];
          let sig = null, pending = null;
          try {
            sig = yield* this.exec(s.body, new Env(env));
          } catch (ex) {
            const thrown = this.asThrown(ex);
            if (!thrown) throw ex;
            this.stack.length = depth; frame.scope = env;
            const c = s.catches.find(c => c.types.some(t => this.isSubtype(thrown.val.t, t)));
            if (!c) pending = thrown;
            else {
              const scope = new Env(env);
              const slot = scope.declare(c.name, c.types.length === 1 ? c.types[0] : 'Throwable', null, false, c.line);
              this.store(slot, thrown.val, c.line, true);
              this.snap(c.line, 'caught');
              this.trace[this.trace.length - 1].caught = thrown.val.t;
              yield null;
              try { sig = yield* this.exec(c.body, scope); }
              catch (ex2) { const t2 = this.asThrown(ex2); if (!t2) throw ex2; this.stack.length = depth; frame.scope = env; pending = t2; }
            }
          }
          if (s.fin) {
            const fs = yield* this.exec(s.fin, new Env(env));
            if (fs) { sig = fs; pending = null; } // return/break in finally discards the exception, as in Java
          }
          if (pending) throw pending;
          return sig;
        }
        default: throw compileError(`unsupported statement ${s.k}`, s.line);
      }
    }
    // a JS exception → the Java exception it stands for (ThrowSignal), or null when it is not catchable
    asThrown(ex) {
      if (ex instanceof ThrowSignal) return ex;
      if (ex instanceof JavaError && ex.kind === 'runtime' && isBuiltinThrowable(ex.name)) return new ThrowSignal(this.makeException(ex.name, ex.message, ex.line), ex.line);
      return null;
    }
    makeException(name, message, line) {
      const cls = this.builtinClass(name);
      const obj = V(name, { id: nextId++, cls: name, fields: { message: { t: 'String', v: message === undefined || message === null ? null : String(message), name: 'message', rt: 'String', id: 'M' + nextId } } });
      obj.v.trace = this.stack.map(f => f.name).reverse();
      obj.v.line = line;
      void cls;
      return obj;
    }
    builtinClass(name) {
      if (this.classes[name]) return this.classes[name];
      if (!BUILTIN_SUPER[name]) return null;
      const c = { name, fields: [], methods: [], ctors: [], line: 0, superName: name === 'Throwable' ? 'Object' : BUILTIN_SUPER[name][0] || 'Object', interfaces: BUILTIN_SUPER[name].slice(1), kind: 'class', abstract: false, final: false, static: true, outerName: null, typeParams: [], constants: [], statics: {}, builtin: true };
      this.classes[name] = c;
      return c;
    }
    *evalBool(e, env) {
      const v = unboxed(yield* this.eval(e, env));
      if (v.t !== 'boolean') throw compileError(`incompatible types: ${typeName(v.st || v.t)} cannot be converted to boolean`, e.line);
      return v.v;
    }
    equalsValue(a, b, strict) {
      if (isBox(a.t) && isBox(b.t)) return strict ? (a.t === b.t && a.v === b.v) : a.id === b.id;
      if (isBox(a.t)) a = unboxed(a); if (isBox(b.t)) b = unboxed(b);
      if (isNum(a.t) && isNum(b.t)) return a.v === b.v;
      if (a.t === 'boolean' && b.t === 'boolean') return a.v === b.v;
      if (a.t === 'String' && b.t === 'String') return strict ? a.v === b.v : a.id === b.id;
      if (a.t === 'null' || b.t === 'null') return a.t === b.t;
      if (a.v && b.v && typeof a.v === 'object' && typeof b.v === 'object') return a.v.id === b.v.id && a.v.id !== undefined;
      return false;
    }
    // Java equals(): user equals() if defined, value equality for strings/boxes/collections, identity otherwise
    *javaEquals(a, b, line) {
      if (isNum(a.t) || a.t === 'boolean') a = box(a); if (isNum(b.t) || b.t === 'boolean') b = box(b);
      if (a.t === 'null') throw runtimeError('NullPointerException', 'Cannot invoke "Object.equals(Object)" because value is null', line);
      if (b.t === 'null') return false;
      const cls = this.classes[a.t];
      if (cls) { const m = this.findMethod(cls, 'equals', [b], line, true); if (m && !m.builtin) { const r = yield* this.invoke(m.cls, m, a, [b], line); return !!r.v; } return a.v.id === b.v.id; }
      if (a.t === 'String' || isBox(a.t)) return a.t === b.t && a.v === b.v;
      if (a.v && a.v.kind && b.v && b.v.kind) return yield* this.collectionEquals(a, b, line);
      if (a.t === 'Entry' && b.t === 'Entry') return (yield* this.javaEquals(a.v.k, b.v.k, line)) && (yield* this.javaEquals(a.v.val, b.v.val, line));
      return this.equalsValue(a, b, false);
    }
    *javaHash(a, line) {
      if (isNum(a.t) || a.t === 'boolean') a = box(a);
      switch (a.t) {
        case 'null': return 0;
        case 'String': { let h = 0; for (let i = 0; i < a.v.length; i++) h = wrapInt(Math.imul(31, h) + a.v.charCodeAt(i)); return h; }
        case 'Integer': case 'Short': case 'Byte': case 'Character': return a.v;
        case 'Long': return wrapInt(Number(BigInt.asIntN(32, BigInt(a.v) ^ (BigInt(a.v) >> 32n))));
        case 'Boolean': return a.v ? 1231 : 1237;
        case 'Double': case 'Float': { const buf = new DataView(new ArrayBuffer(8)); buf.setFloat64(0, a.v); return wrapInt(buf.getInt32(0) ^ buf.getInt32(4)); }
      }
      const cls = this.classes[a.t];
      if (cls) { const m = this.findMethod(cls, 'hashCode', [], line, true); if (m && !m.builtin) { const r = yield* this.invoke(m.cls, m, a, [], line); return r.v; } }
      if (a.v && a.v.kind === 'list') { let h = 1; for (const x of a.v.items) h = wrapInt(Math.imul(31, h) + (yield* this.javaHash(x, line))); return h; }
      if (a.v && a.v.kind === 'set') { let h = 0; for (const x of a.v.items) h = wrapInt(h + (yield* this.javaHash(x, line))); return h; }
      return wrapInt(Math.imul(a.v.id || 0, 2654435761) >>> 0);
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
          const v = V(f.self.t, f.self.v); v.st = f.cls ? f.cls.name : f.self.t; return v;
        }
        case 'Super': {
          const f = this.stack[this.stack.length - 1];
          if (!f.self) throw compileError('non-static variable super cannot be referenced from a static context', e.line);
          return f.self;
        }
        case 'Unary': {
          const v = unboxed(yield* this.eval(e.e, env));
          if (e.op === '!') { if (v.t !== 'boolean') throw compileError(`bad operand type ${v.t} for unary operator '!'`, e.line); return V('boolean', !v.v); }
          if (!isNum(v.t)) throw compileError(`bad operand type ${typeName(v.t)} for unary operator '${e.op}'`, e.line);
          const t = promote(v.t, 'int');
          const r = e.op === '-' ? V(t, t === 'int' ? wrapInt(-v.v) : -v.v) : e.op === '~' ? V(t, ~v.v) : V(t, v.v);
          if (v.constant && t === 'int') r.constant = true;
          return r;
        }
        case 'Cast': {
          const v = yield* this.eval(e.e, env);
          if (PRIM.has(e.type)) {
            const u = unboxed(v);
            if (v.t === 'null' || (v.t === 'Object' || v.st === 'Object') && isBox(v.t)) { if (v.t === 'null') throw runtimeError('NullPointerException', `Cannot unbox null value`, e.line); }
            if (!isNum(u.t) && !(u.t === 'boolean' && e.type === 'boolean')) throw compileError(`incompatible types: ${typeName(v.st || v.t)} cannot be converted to ${e.type}`, e.line);
            return convert(u, e.type);
          }
          if (v.t === 'null') return NULL;
          if (isNum(v.t) || v.t === 'boolean') { // (Integer) 5, (Object) 3
            if (!assignable(v, e.type, this)) throw compileError(`incompatible types: ${v.t} cannot be converted to ${e.type}`, e.line);
            const b = convert(v, e.type); b.st = e.type; return b;
          }
          const st = v.st && isRef(v.st) ? v.st : v.t;
          // javac rejects casts between unrelated classes; a downcast that fails at run time is a ClassCastException
          if (this.classes[st] && this.classes[e.type] && this.classes[st].kind === 'class' && this.classes[e.type].kind === 'class' && !this.isSubtype(st, e.type) && !this.isSubtype(e.type, st))
            throw compileError(`incompatible types: ${st} cannot be converted to ${e.type}`, e.line);
          if (!this.isSubtype(v.t, e.type)) throw runtimeError('ClassCastException', `class ${this.qualified(v.t)} cannot be cast to class ${this.qualified(e.type)}`, e.line);
          const out = Object.assign({}, v); out.st = e.type; return out;
        }
        case 'InstanceOf': {
          const v = yield* this.eval(e.e, env);
          if (!isRef(v.t)) throw compileError(`unexpected type: required reference, found ${v.t}`, e.line);
          const st = v.st && isRef(v.st) ? v.st : v.t;
          if (this.classes[st] && this.classes[e.type] && this.classes[st].kind === 'class' && this.classes[e.type].kind === 'class' && !this.isSubtype(st, e.type) && !this.isSubtype(e.type, st))
            throw compileError(`incompatible types: ${st} cannot be converted to ${e.type}`, e.line);
          const ok = v.t !== 'null' && this.isSubtype(v.t, e.type);
          if (e.bind) { if (!env.lookup(e.bind)) env.declare(e.bind, e.type, null, false, e.line); const slot = env.lookup(e.bind); if (ok) { this.store(slot, v, e.line, true); slot.uninit = false; } else slot.uninit = true; }
          return V('boolean', ok);
        }
        case 'Bin': return yield* this.evalBin(e, env);
        case 'Cond': {
          const c = yield* this.evalBool(e.cond, env);
          const a = yield* this.eval(c ? e.a : e.b, env, hint);
          return a;
        }
        case 'Assign': {
          const ref = yield* this.lvalue(e.target, env);
          let v = yield* this.eval(e.value, env, ref.t);
          if (e.op !== '=') {
            const cur = ref.get();
            if (e.op === '+=' && (cur.t === 'String' || v.t === 'String' || erase(ref.t) === 'String')) {
              v = str((yield* toStr(cur, this, e.line)) + (yield* toStr(v, this, e.line)));
            } else {
              v = this.binop({ k: 'Bin', op: e.op.slice(0, -1), line: e.line }, unboxed(cur), unboxed(v));
              if (isNum(erase(ref.t)) && isNum(v.t)) v = convert(v, ref.t); // compound assignment narrows implicitly
            }
          }
          return ref.set(v);
        }
        case 'IncDec': {
          const ref = yield* this.lvalue(e.target, env);
          const cur0 = ref.get();
          const cur = unboxed(cur0);
          if (!isNum(cur.t)) throw compileError(`bad operand type ${typeName(cur0.t)} for unary operator '${e.op}'`, e.line);
          const d = e.op === '++' ? 1 : -1;
          const nv = cur.t === 'int' ? V('int', wrapInt(cur.v + d)) : convert(V(promote(cur.t, 'int'), cur.v + d), cur.t);
          ref.set(nv);
          return e.prefix ? nv : cur;
        }
        case 'Index': {
          const arr = yield* this.eval(e.target, env);
          const idx = unboxed(yield* this.eval(e.index, env));
          return this.indexGet(arr, idx, e.line);
        }
        case 'Member': return yield* this.member(e, env);
        case 'Call': return yield* this.call(e, env);
        case 'Lambda': {
          const f = this.stack[this.stack.length - 1];
          return V('$Lambda', { id: nextId++, params: e.params, body: e.body, expr: e.expr, env, self: f.self, cls: f.cls });
        }
        case 'New': {
          const args = []; for (const a of e.args) args.push(yield* this.eval(a, env));
          const targs = e.targs && e.targs.length ? e.targs : (hint ? targsOf(hint) : null);
          const cls = this.classes[e.cls];
          if (cls) {
            if (cls.kind === 'interface') throw compileError(`${cls.name} is abstract; cannot be instantiated`, e.line);
            if (cls.kind === 'enum') throw compileError(`enum classes may not be instantiated`, e.line);
            if (cls.abstract && !cls.anon) throw compileError(`${cls.name} is abstract; cannot be instantiated`, e.line);
            const f = this.stack[this.stack.length - 1];
            const extra = {};
            if (cls.anon || cls.local) { extra.closure = env; extra.outer = f.self; }
            else if (!cls.static && cls.outerName) { // inner class: needs an enclosing instance
              const outer = e.outerExpr ? yield* this.eval(e.outerExpr, env) : this.enclosingInstance(f, cls.outerName);
              if (!outer) throw compileError(`non-static variable this cannot be referenced from a static context (${cls.name} is an inner class of ${cls.outerName})`, e.line);
              extra.outer = outer;
            }
            const obj = yield* this.instantiate(cls, args, e.line, extra);
            obj.st = cls.anon ? (cls.superName !== 'Object' ? cls.superName : cls.interfaces[0]) : cls.name;
            if (targs) obj.targs = targs;
            return obj;
          }
          return yield* this.newBuiltin(e.cls, args, targs, e.line, hint);
        }
        case 'NewArray': {
          const dims = []; for (const d of e.dims) dims.push(d ? unboxed(yield* this.eval(d, env)) : null);
          const build = (t, k) => {
            const d = dims[k];
            if (!d) return null;
            if (!INTEGRAL.has(d.t) || d.t === 'long') throw compileError(`incompatible types: ${d.t} cannot be converted to int`, e.line);
            if (d.v < 0) throw runtimeError('NegativeArraySizeException', String(d.v), e.line);
            const et = t.slice(0, -2);
            const elems = [];
            for (let i = 0; i < d.v; i++) elems.push(k + 1 < dims.length ? (build(et, k + 1) || NULL) : isDefault(erase(et)).v);
            return V(erase(t), { id: nextId++, elems });
          };
          return build(e.type, 0);
        }
        case 'ArrayInit': return yield* this.arrayInit(e, env, hint);
        default: throw compileError(`unsupported expression ${e.k}`, e.line);
      }
    }
    enclosingInstance(frame, outerName) {
      for (let s = frame.self; s && s.v; s = s.v.outer) if (this.isSubtype(s.t, outerName)) return s;
      return null;
    }
    *arrayInit(e, env, hint) {
      const type = erase(e.type || hint || '');
      if (!type || !type.endsWith('[]')) throw compileError('illegal initializer for ' + (type || 'unknown type'), e.line);
      const et = type.slice(0, -2);
      const elems = [];
      for (const x of e.elems) {
        const v = yield* this.eval(x, env, et);
        const slot = { t: et, name: '' };
        this.store(slot, v, e.line, true);
        elems.push(isRef(et) ? (v.t === 'null' ? NULL : this.read(slot)) : slot.v);
      }
      return V(type, { id: nextId++, elems });
    }
    // name → slot: locals (and captured ones), this.fields, enclosing instances' fields, statics of the class chain and the outer classes
    resolveVar(name, env, line) {
      const local = env.lookup(name);
      if (local) { if (local.uninit) throw compileError(`variable ${name} might not have been initialized`, line); return local; }
      const f = this.stack[this.stack.length - 1];
      for (let s = f && f.self, k = f && f.cls; s && s.v; s = s.v.outer, k = k && k.outerName ? this.classes[k.outerName] : null) { const slot = this.fieldSlot(s, name, k || this.classes[s.t]); if (slot) return slot; }
      for (let cls = f && f.cls; cls; cls = cls.outerName ? this.classes[cls.outerName] : null) {
        const st = this.findStatic(cls, name);
        if (st) return st;
        if (cls === f.cls && this.findFieldDecl(cls, name) && !f.self) throw compileError(`non-static variable ${name} cannot be referenced from a static context`, line);
      }
      if (this.classes[name]) throw compileError(`cannot find symbol: variable ${name} (${name} is a class)`, line);
      throw compileError(`cannot find symbol: variable ${name}`, line);
    }
    *lvalue(e, env) {
      const self = this;
      if (e.k === 'Name') {
        const local = env.lookup(e.name);
        let slot = local;
        if (!slot) { const f = this.stack[this.stack.length - 1]; for (let s = f.self, k = f.cls; s && s.v && !slot; s = s.v.outer, k = k && k.outerName ? this.classes[k.outerName] : null) slot = this.fieldSlot(s, e.name, k || this.classes[s.t]); if (!slot) for (let cls = f.cls; cls && !slot; cls = cls.outerName ? this.classes[cls.outerName] : null) slot = this.findStatic(cls, e.name); }
        if (!slot) this.resolveVar(e.name, env, e.line);
        if (local && slot.captured) throw compileError(`local variables referenced from ${slot.captured} must be final or effectively final`, e.line);
        return { t: slot.t, get: () => { if (slot.uninit) throw compileError(`variable ${e.name} might not have been initialized`, e.line); return self.read(slot); }, set: v => { const r = self.store(slot, v, e.line); slot.uninit = false; return r; } };
      }
      if (e.k === 'Index') {
        const arr = yield* this.eval(e.target, env);
        const idx = unboxed(yield* this.eval(e.index, env));
        this.checkIndex(arr, idx, e.line);
        const et = arr.t.slice(0, -2);
        return { t: et, get: () => tagElem(et, arr.v.elems[idx.v]), set: v => {
          if (isRef(et) && v.t !== 'null' && !self.isSubtype(v.t, et)) throw runtimeError('ArrayStoreException', self.qualified(v.t), e.line);
          const slot = { t: et, name: '' }; const r = self.store(slot, v, e.line, true); arr.v.elems[idx.v] = isRef(et) ? (v.t === 'null' ? NULL : self.read(slot)) : r.v; return r; } };
      }
      if (e.k === 'Member') {
        const slot = (yield* this.memberTarget(e, env)).slot;
        return { t: slot.t, get: () => self.read(slot), set: v => self.store(slot, v, e.line) };
      }
      throw compileError('unexpected type: required variable', e.line);
    }
    classRef(e, env) { // e names a class (not shadowed by a variable) → the class, else null
      if (e.k !== 'Name' || env.lookup(e.name)) return null;
      const f = this.stack[this.stack.length - 1];
      for (let s = f && f.self; s && s.v; s = s.v.outer) if (s.v.fields && s.v.fields[e.name]) return null;
      for (let cls = f && f.cls; cls; cls = cls.outerName ? this.classes[cls.outerName] : null) if (this.findStatic(cls, e.name)) return null;
      return this.classes[e.name] || null;
    }
    *memberTarget(e, env) {
      const cls = this.classRef(e.target, env);
      if (cls) {
        const slot = this.findStatic(cls, e.name);
        if (!slot) throw compileError(`cannot find symbol: variable ${e.name} in class ${cls.name}`, e.line);
        return { slot };
      }
      const obj = yield* this.eval(e.target, env);
      if (obj.t === 'null') throw runtimeError('NullPointerException', `Cannot assign field "${e.name}" because value is null`, e.line);
      if (!obj.v || !obj.v.fields) throw compileError(`cannot find symbol: variable ${e.name}`, e.line);
      this.checkFieldVisible(obj, e.name, e.line);
      const slot = this.fieldSlot(obj, e.name, this.viewClass(obj, e.target));
      if (!slot) throw compileError(`cannot find symbol: variable ${e.name} in ${obj.t}`, e.line);
      return { slot };
    }
    // javac sees the static type: a field of the subclass is not visible through a superclass reference
    checkFieldVisible(obj, name, line) {
      const st = obj.st && isRef(obj.st) ? obj.st : null;
      if (st && this.classes[st] && !this.findFieldDecl(this.classes[st], name) && this.fieldSlot(obj, name, null)) throw compileError(`cannot find symbol: variable ${name} in ${st} (the variable's type is ${st}; ${name} belongs to ${obj.t})`, line);
      const d = this.classes[obj.t] && this.findFieldDecl(this.classes[obj.t], name);
      if (d && d.f.access === 'private') { const f = this.stack[this.stack.length - 1]; const cur = f.cls; if (!cur || (cur.name !== d.cls.name && !this.sameNest(cur, d.cls))) throw compileError(`${name} has private access in ${d.cls.name}`, line); }
    }
    // the field slot of obj named `name` as the code of class `fromCls` sees it (shadowing resolves to the nearest declaration)
    fieldSlot(obj, name, fromCls) {
      if (!obj || !obj.v || !obj.v.fields) return null;
      if (fromCls && this.classes[fromCls.name]) {
        for (let k = fromCls; k; k = this.superOf(k)) if (k.fields.some(x => x.name === name && !x.static)) return obj.v.fields[`${k.name}.${name}`] || obj.v.fields[name] || null;
      }
      return obj.v.fields[name] || null;
    }
    sameNest(a, b) { const top = c => { while (c && c.outerName) c = this.classes[c.outerName]; return c; }; return top(a) === top(b); }
    checkIndex(arr, idx, line) {
      if (arr.t === 'null') throw runtimeError('NullPointerException', 'Cannot load from array because it is null', line);
      if (!arr.t.endsWith('[]')) throw compileError(`array required, but ${typeName(arr.st || arr.t)} found`, line);
      if (!INTEGRAL.has(idx.t) || idx.t === 'long') throw compileError(`incompatible types: ${typeName(idx.t)} cannot be converted to int`, line);
      if (idx.v < 0 || idx.v >= arr.v.elems.length) throw runtimeError('ArrayIndexOutOfBoundsException', `Index ${idx.v} out of bounds for length ${arr.v.elems.length}`, line);
    }
    indexGet(arr, idx, line) { this.checkIndex(arr, idx, line); return tagElem(arr.t.slice(0, -2), arr.v.elems[idx.v]); }
    *member(e, env) {
      // static constants and class-qualified fields
      const CONST = {
        Integer: { MAX_VALUE: V('int', 2147483647), MIN_VALUE: V('int', -2147483648) },
        Long: { MAX_VALUE: V('long', 9223372036854775807), MIN_VALUE: V('long', -9223372036854775808) },
        Double: { MAX_VALUE: V('double', Number.MAX_VALUE), MIN_VALUE: V('double', 5e-324), POSITIVE_INFINITY: V('double', Infinity), NEGATIVE_INFINITY: V('double', -Infinity), NaN: V('double', NaN) },
        Math: { PI: V('double', Math.PI), E: V('double', Math.E) },
        Character: { MAX_VALUE: V('char', 0xffff), MIN_VALUE: V('char', 0) },
        Byte: { MAX_VALUE: V('byte', 127), MIN_VALUE: V('byte', -128) }, Short: { MAX_VALUE: V('short', 32767), MIN_VALUE: V('short', -32768) },
      };
      if (e.target.k === 'Name' && !env.lookup(e.target.name)) {
        const q = e.target.name;
        if (CONST[q] && CONST[q][e.name]) return CONST[q][e.name];
        if (q === 'System' && e.name === 'in') return V('InputStream', { id: 0 });
        if (q === 'System' && (e.name === 'out' || e.name === 'err')) return V('PrintStream', { id: 0, name: e.name });
      }
      const cls = this.classRef(e.target, env);
      if (cls) {
        const slot = this.findStatic(cls, e.name);
        if (slot) return this.read(slot);
        if (this.classes[e.name] && this.classes[e.name].outerName === cls.name) return V('$Class', { name: e.name });
        if (this.findFieldDecl(cls, e.name)) throw compileError(`non-static variable ${e.name} cannot be referenced from a static context`, e.line);
        throw compileError(`cannot find symbol: variable ${e.name} in class ${cls.name}`, e.line);
      }
      if (e.target.k === 'Name' && !env.lookup(e.target.name)) {
        const f = this.stack[this.stack.length - 1];
        let known = false;
        for (let s = f.self; s && s.v; s = s.v.outer) if (s.v.fields && s.v.fields[e.target.name]) known = true;
        for (let c = f.cls; c; c = c.outerName ? this.classes[c.outerName] : null) if (this.findStatic(c, e.target.name)) known = true;
        if (!known) throw compileError(`cannot find symbol: variable ${e.target.name}`, e.line);
      }
      const obj = yield* this.eval(e.target, env);
      if (obj.t === 'null') throw runtimeError('NullPointerException', `Cannot read field "${e.name}" because value is null`, e.line);
      if (obj.t === '$Class') { const c = this.classes[obj.v.name]; const slot = c && this.findStatic(c, e.name); if (!slot) throw compileError(`cannot find symbol: variable ${e.name} in class ${obj.v.name}`, e.line); return this.read(slot); }
      if (obj.t.endsWith('[]')) {
        if (e.name === 'length') return V('int', obj.v.elems.length);
        throw compileError(`cannot find symbol: variable ${e.name} (arrays have .length, Strings have .length())`, e.line);
      }
      if (obj.t === 'String') throw compileError(`cannot find symbol: variable ${e.name} in String${e.name === 'length' ? ' (did you mean length()?)' : ''}`, e.line);
      if (obj.v && obj.v.fields) {
        this.checkFieldVisible(obj, e.name, e.line);
        const slot = this.fieldSlot(obj, e.name, this.viewClass(obj, e.target));
        if (!slot) throw compileError(`cannot find symbol: variable ${e.name} in ${obj.t}`, e.line);
        return this.read(slot);
      }
      throw compileError(`cannot find symbol: variable ${e.name}`, e.line);
    }
    // the class whose view of the fields applies: super → the superclass of the current class, otherwise the static type
    viewClass(obj, targetExpr) {
      const f = this.stack[this.stack.length - 1];
      if (targetExpr && targetExpr.k === 'Super') return this.superOf(f.cls);
      if (obj.st && this.classes[obj.st]) return this.classes[obj.st];
      return this.classes[obj.t] || null;
    }

    *evalBin(e, env) {
      const l = yield* this.eval(e.l, env);
      if (e.op === '&&') { const lb = unboxed(l); if (lb.t !== 'boolean') throw compileError(`bad operand types for binary operator '&&'`, e.line); if (!lb.v) return V('boolean', false); return V('boolean', yield* this.evalBool(e.r, env)); }
      if (e.op === '||') { const lb = unboxed(l); if (lb.t !== 'boolean') throw compileError(`bad operand types for binary operator '||'`, e.line); if (lb.v) return V('boolean', true); return V('boolean', yield* this.evalBool(e.r, env)); }
      const r = yield* this.eval(e.r, env);
      if (e.op === '+' && (l.t === 'String' || r.t === 'String')) {
        const a = yield* toStr(l, this, e.line), b = yield* toStr(r, this, e.line);
        return str(a + b);
      }
      return this.binop(e, l, r);
    }
    binop(e, l0, r0) {
      const op = e.op;
      const bad = () => compileError(`bad operand types for binary operator '${op}': first type: ${typeName(l0.st || l0.t)}, second type: ${typeName(r0.st || r0.t)}`, e.line);
      if (op === '==' || op === '!=') {
        // two boxed values compare by reference (the Integer cache makes small ones equal); a box next to a primitive unboxes
        let l = l0, r = r0;
        if (isBox(l.t) && (isNum(r.t) || r.t === 'boolean')) l = unboxed(l);
        if (isBox(r.t) && (isNum(l.t) || l.t === 'boolean')) r = unboxed(r);
        if ((isNum(l.t) && isNum(r.t)) || (l.t === 'boolean' && r.t === 'boolean') || (isRef(l.t) && isRef(r.t))) {
          const ls = l.st && isRef(l.st) && l.t !== 'null' ? l.st : l.t, rs = r.st && isRef(r.st) && r.t !== 'null' ? r.st : r.t;
          if (isRef(l.t) && isRef(r.t) && l.t !== 'null' && r.t !== 'null' && this.classes[ls] && this.classes[rs] && this.classes[ls].kind === 'class' && this.classes[rs].kind === 'class' && !this.isSubtype(ls, rs) && !this.isSubtype(rs, ls))
            throw compileError(`incomparable types: ${ls} and ${rs}`, e.line);
          const eq = this.equalsValue(l, r, false);
          return V('boolean', op === '==' ? eq : !eq);
        }
        throw compileError(`incomparable types: ${typeName(l0.st || l0.t)} and ${typeName(r0.st || r0.t)}`, e.line);
      }
      const l = unboxed(l0), r = unboxed(r0);
      if (l.t === 'boolean' && r.t === 'boolean' && (op === '&' || op === '|' || op === '^')) {
        return V('boolean', op === '&' ? (l.v && r.v) : op === '|' ? (l.v || r.v) : (l.v !== r.v));
      }
      if (!isNum(l.t) || !isNum(r.t)) throw bad();
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
          case '<<': x = t === 'int' ? a << b : Number(BigInt.asIntN(64, BigInt(a) << BigInt(b & 63))); break;
          case '>>': x = t === 'int' ? a >> b : Number(BigInt(a) >> BigInt(b & 63)); break;
          case '>>>': x = t === 'int' ? a >>> b : Number(BigInt.asIntN(64, BigInt.asUintN(64, BigInt(a)) >> BigInt(b & 63))); break;
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
    // new: allocate, then run constructors from the root of the chain down (super(...) first, then field initialisers, then the body)
    *instantiate(cls, args, line, extra) {
      const obj = V(cls.name, { id: nextId++, cls: cls.name, fields: {} });
      if (extra) { if (extra.closure) obj.v.closure = extra.closure; if (extra.outer) obj.v.outer = extra.outer; if (extra.enumName !== undefined) { obj.v.enumName = extra.enumName; obj.v.ordinal = extra.ordinal; } }
      if (this.isSubtype(cls.name, 'Throwable')) { obj.v.trace = this.stack.map(f => f.name).reverse(); obj.v.line = line; }
      yield* this.construct(cls, obj, args, line);
      return obj;
    }
    *construct(cls, obj, args, line) {
      if (cls.builtin || !this.classes[cls.name]) { // built-in superclass (Exception …): (), (String), (String, Throwable)
        if (this.isSubtype(cls.name, 'Throwable')) {
          const msg = args.length && args[0].t === 'String' ? args[0].v : (args.length && args[0].t !== 'null' && this.isSubtype(args[0].t, 'Throwable') ? yield* toStr(args[0], this, line) : null);
          obj.v.fields.message = { t: 'String', v: msg, name: 'message', rt: 'String', id: 'M' + nextId++ };
          if (args.length > 1 || (args.length === 1 && args[0].t !== 'String' && args[0].t !== 'null' && !this.isSubtype(args[0].t, 'Throwable'))) throw compileError(`no suitable constructor found for ${cls.name}(${args.map(a => typeName(a.t)).join(',')})`, line);
        } else if (args.length) throw compileError(`constructor ${cls.name} in class ${cls.name} cannot be applied to given types: required no arguments, found ${args.map(a => typeName(a.t)).join(',')}`, line);
        return;
      }
      let ctor = null;
      if (cls.ctors.length) {
        const cands = cls.ctors.filter(c => c.params.length === args.length);
        if (!cands.length) throw compileError(`constructor ${cls.name} in class ${cls.name} cannot be applied to given types: required ${cls.ctors[0].params.map(p => erase(p.type)).join(',') || 'no arguments'}, found ${args.map(a => typeName(a.st || a.t)).join(',') || 'no arguments'}`, line);
        ctor = pickOverload(cands, args, '<init>', line, this);
        if (ctor.access === 'private') { const f = this.stack[this.stack.length - 1]; if (!f.cls || (f.cls.name !== cls.name && !this.sameNest(f.cls, cls))) throw compileError(`${cls.name}(${ctor.params.map(p => erase(p.type)).join(',')}) has private access in ${cls.name}`, line); }
      } else if (args.length && !cls.anon) throw compileError(`constructor ${cls.name} in class ${cls.name} cannot be applied to given types: required no arguments, found ${args.map(a => typeName(a.st || a.t)).join(',')}`, line);
      const body = ctor ? ctor.body.body : [];
      const first = body[0] && body[0].k === 'ExprStmt' && body[0].expr.k === 'Call' && !body[0].expr.target && (body[0].expr.name === 'super' || body[0].expr.name === 'this') ? body[0].expr : null;
      const frame = this.pushFrame(`${cls.name}(${ctor ? ctor.params.map(p => erase(p.type)).join(', ') : ''})`, obj, obj.v.closure && cls.anon ? obj.v.closure : null);
      frame.cls = cls; frame.ctor = true;
      const depth = this.stack.length;
      try {
        if (ctor) ctor.params.forEach((p, i) => this.store(frame.env.declare(p.name, p.type, null, false, line), args[i], line, true));
        if (first && first.name === 'this') { // this(...): delegate, then run the rest of the body
          yield* this.step(first.line, frame.env);
          const a2 = []; for (const a of first.args) a2.push(yield* this.eval(a, frame.env));
          yield* this.construct(cls, obj, a2, first.line);
        } else {
          let superArgs = [];
          if (first) { yield* this.step(first.line, frame.env); for (const a of first.args) superArgs.push(yield* this.eval(a, frame.env)); }
          const sup = cls.superName && cls.superName !== 'Object' ? (this.classes[cls.superName] || this.builtinClass(cls.superName)) : null;
          if (cls.anon && cls.superName !== 'Object' && sup) superArgs = args; // anonymous subclass: the arguments go to the superclass constructor
          if (sup) {
            if (!first && sup.ctors.length && !sup.ctors.some(c => c.params.length === 0)) throw compileError(`constructor ${sup.name} in class ${sup.name} cannot be applied to given types: required ${sup.ctors[0].params.map(p => erase(p.type)).join(',')}, found no arguments (add super(...) as the first statement)`, ctor ? ctor.line : cls.line);
            yield* this.construct(sup, obj, superArgs, first ? first.line : line);
          }
          // field initialisers of this class, in order; a field that a subclass redeclares is kept under "Class.name"
          for (const f of cls.fields) if (!f.static) {
            if (f.block) { yield* this.execBlockIn(f.init, frame.env, true); continue; }
            const slot = { t: f.type, v: isDefault(erase(f.type)).v, name: f.name, final: f.final };
            if (f.generic) slot.generic = true;
            let shadowed = false;
            for (let k = this.classes[obj.v.cls]; k && k !== cls; k = this.superOf(k)) if (k.fields.some(x => x.name === f.name && !x.static)) shadowed = true;
            obj.v.fields[shadowed ? `${cls.name}.${f.name}` : f.name] = slot;
            if (f.init) this.store(slot, yield* this.eval(f.init, frame.env, f.type), f.line, true);
          }
        }
        const rest = { k: 'Block', body: first ? body.slice(1) : body, line: ctor ? ctor.line : line };
        if (body.some((s, i) => i > 0 && s.k === 'ExprStmt' && s.expr.k === 'Call' && !s.expr.target && (s.expr.name === 'super' || s.expr.name === 'this'))) throw compileError('call to super must be first statement in constructor', ctor.line);
        const sig = yield* this.execBlockIn(rest, frame.env, true);
        if (sig && sig.sig === 'return' && sig.value.t !== 'void') throw compileError('incompatible types: unexpected return value', sig.line);
      } finally { this.stack.length = depth - 1; }
    }
    qualified(t) {
      if (BUILTIN_SUPER[t] || t === 'Object' || t === 'String' || isBox(t)) return (EXCEPTION_PKG[t] || (['ArrayList', 'LinkedList', 'HashMap', 'TreeMap', 'HashSet', 'TreeSet', 'Scanner', 'Stack', 'ArrayDeque', 'PriorityQueue', 'Iterator', 'Random'].includes(t) ? 'java.util' : ['File', 'PrintWriter', 'FileWriter', 'FileReader', 'BufferedReader', 'BufferedWriter', 'FileOutputStream', 'FileInputStream', 'ObjectOutputStream', 'ObjectInputStream', 'PrintStream', 'InputStream'].includes(t) ? 'java.io' : 'java.lang')) + '.' + t;
      return t;
    }

    // ── calls ──
    *call(e, env) {
      const args = []; for (const a of e.args) { const v = yield* this.eval(a, env); if (v.t === 'void') throw compileError(`'void' type not allowed here`, a.line); args.push(v); }
      const top = this.stack[this.stack.length - 1];
      if (!e.target && (e.name === 'this' || e.name === 'super')) throw compileError(`call to ${e.name} must be first statement in constructor`, e.line);
      if (!e.target) { // unqualified: method of the current class (dispatched on this), an enclosing instance's class, or an Object method
        for (let cls = top.cls, self = top.self; cls; cls = cls.outerName ? this.classes[cls.outerName] : null, self = self && self.v ? self.v.outer : null) {
          let m = this.findMethod(cls, e.name, args, e.line, true);
          if (m) {
            if (!m.static && !self) throw compileError(`non-static method ${sigOf(m)} cannot be referenced from a static context`, e.line);
            if (!m.static && m.access !== 'private' && self && this.classes[self.t] && self.t !== cls.name) { const rm = this.findMethod(this.classes[self.t], e.name, args, e.line, true); if (rm && !rm.static) m = rm; }
            if (m.abstract) throw compileError(`abstract method ${sigOf(m)} in ${m.cls.kind} ${m.cls.name} cannot be accessed directly (no implementation in ${self ? self.t : cls.name})`, e.line);
            return yield* this.invoke(m.cls, m, m.static ? null : self, args, e.line);
          }
          if (self && (OBJECT_METHODS.has(e.name) || this.isSubtype(self.t, 'Throwable'))) { const r = yield* this.callMethodOn(self, e.name, args, e.line); return r; }
        }
        this.findMethod(top.cls, e.name, args, e.line); // throws the right message
      }
      if (e.target.k === 'Super') { // super.m(): the superclass implementation, no dynamic dispatch
        const sup = this.superOf(top.cls) || this.builtinClass('Object');
        if (!top.self) throw compileError('non-static variable super cannot be referenced from a static context', e.line);
        const m = sup && this.findMethod(sup, e.name, args, e.line, true);
        if (!m) return yield* this.objectMethod(top.self, e.name, args, e.line, true);
        if (m.abstract) throw compileError(`abstract method ${sigOf(m)} in class ${m.cls.name} cannot be accessed directly`, e.line);
        return yield* this.invoke(m.cls, m, top.self, args, e.line);
      }
      // System.out.* / System.err.*
      if (e.target.k === 'Member' && e.target.target.k === 'Name' && e.target.target.name === 'System' && (e.target.name === 'out' || e.target.name === 'err') && !env.lookup('System')) {
        return yield* this.print(e.name, args, e.line);
      }
      const cls = this.classRef(e.target, env);
      if (cls) {
        const m = this.findMethod(cls, e.name, args, e.line, true);
        if (m) {
          if (!m.static) throw compileError(`non-static method ${sigOf(m)} cannot be referenced from a static context`, e.line);
          return yield* this.invoke(m.cls, m, null, args, e.line);
        }
        if (cls.kind === 'enum') return this.enumStatic(cls, e.name, args, e.line);
        this.findMethod(cls, e.name, args, e.line);
      }
      if (e.target.k === 'Name' && !env.lookup(e.target.name) && !this.classes[e.target.name]) {
        const q = e.target.name;
        const f = this.stack[this.stack.length - 1];
        let known = false;
        for (let s = f.self; s && s.v; s = s.v.outer) if (s.v.fields && s.v.fields[q]) known = true;
        for (let c = f.cls; c; c = c.outerName ? this.classes[c.outerName] : null) if (this.findStatic(c, q)) known = true;
        if (!known) return yield* this.staticLib(q, e.name, args, e.line);
      }
      const obj = yield* this.eval(e.target, env);
      if (obj.t === '$Class') { const c = this.classes[obj.v.name]; const m = c && this.findMethod(c, e.name, args, e.line); return yield* this.invoke(m.cls, m, null, args, e.line); }
      return yield* this.callMethodOn(obj, e.name, args, e.line);
    }
    // obj.name(args) for any receiver value
    *callMethodOn(obj, name, args, line) {
      if (obj.t === 'null') throw runtimeError('NullPointerException', `Cannot invoke "${name}()" because value is null`, line);
      if (obj.t === 'void') throw compileError(`void cannot be dereferenced`, line);
      if (obj.t === 'String') return yield* this.stringMethod(obj, name, args, line);
      if (obj.t === '$Lambda') return yield* this.invokeLambda(obj, args, line, name);
      if (isNum(obj.t) || obj.t === 'boolean') throw compileError(`${obj.t} cannot be dereferenced`, line);
      if (obj.t.endsWith('[]')) { if (name === 'length') throw compileError(`cannot find symbol: method length() on an array (arrays have .length without parentheses)`, line); if (name === 'clone') return V(obj.t, { id: nextId++, elems: obj.v.elems.slice() }); if (name === 'equals') return V('boolean', this.equalsValue(obj, args[0], false)); if (name === 'getClass') return V('Class', { name: obj.t }); throw compileError(`cannot find symbol: method ${name}() on an array`, line); }
      const cls = this.classes[obj.t];
      if (cls && !cls.builtin) {
        // javac checks the static type: a method of the subclass is not visible through a superclass reference
        const st = obj.st && isRef(obj.st) ? obj.st : null;
        if (st && st !== obj.t && this.classes[st] && !this.findMethod(this.classes[st], name, args, line, true) && !this.objectMethodNames.has(name) && !(this.classes[st].kind === 'interface' && this.findMethodIn(this.classes[st], name, args.length, true).length)) {
          if (this.findMethod(cls, name, args, line, true)) throw compileError(`cannot find symbol: method ${name}(${args.map(a => typeName(a.st || a.t)).join(',')}) in ${st} — the variable's type is ${st}, and ${name} is declared in ${obj.t}. Cast it, or move the method up`, line);
        }
        const m = this.findMethod(cls, name, args, line, true);
        if (m) {
          if (m.abstract) throw compileError(`${m.cls.name} is abstract; cannot be instantiated`, line);
          if (m.access === 'private') { const f = this.stack[this.stack.length - 1]; if (!f.cls || (f.cls.name !== m.cls.name && !this.sameNest(f.cls, m.cls))) throw compileError(`${sigOf(m)} has private access in ${m.cls.name}`, line); }
          return yield* this.invoke(m.cls, m, m.static ? null : obj, args, line);
        }
        if (cls.kind === 'enum' || obj.v.enumName !== undefined) { const r = this.enumMethod(obj, name, args, line); if (r) return r; }
        if (this.isSubtype(obj.t, 'Throwable')) return yield* this.throwableMethod(obj, name, args, line);
        return yield* this.objectMethod(obj, name, args, line);
      }
      if (this.isSubtype(obj.t, 'Throwable') || (cls && cls.builtin)) return yield* this.throwableMethod(obj, name, args, line);
      if (isBox(obj.t)) return yield* this.boxMethod(obj, name, args, line);
      switch (obj.t) {
        case 'Scanner': return yield* this.scannerMethod(obj, name, args, line);
        case 'StringBuilder': return yield* this.stringBuilderMethod(obj, name, args, line);
        case 'Class': if (name === 'getName' || name === 'getSimpleName') return str(obj.v.name); if (name === 'toString') return str(yield* toStr(obj, this, line)); break;
        case 'PrintStream': return yield* this.print(name, args, line);
        case 'Iterator': case 'ListIterator': return yield* this.iteratorMethod(obj, name, args, line);
        case 'Entry': return yield* this.entryMethod(obj, name, args, line);
        case 'File': case 'PrintWriter': case 'FileWriter': case 'BufferedWriter': case 'BufferedReader': case 'FileReader': case 'ObjectOutputStream': case 'ObjectInputStream': case 'FileOutputStream': case 'FileInputStream':
          return yield* this.fileMethod(obj, name, args, line);
        case 'Random': return this.randomMethod(obj, name, args, line);
      }
      if (obj.v && obj.v.kind) return yield* this.collectionMethod(obj, name, args, line);
      throw compileError(`cannot find symbol: method ${name} in ${typeName(obj.st || obj.t)}`, line);
    }
    get objectMethodNames() { return OBJECT_METHODS; }
    // methods every object has
    *objectMethod(obj, name, args, line, fromSuper) {
      switch (name) {
        case 'toString': if (!args.length) return str(fromSuper || !this.classes[obj.t] ? (obj.v.enumName !== undefined ? obj.v.enumName : `${obj.t}@${hexId(obj.v.id)}`) : yield* toStr(obj, this, line)); break;
        case 'equals': if (args.length === 1) return V('boolean', fromSuper ? this.equalsValue(obj, args[0], false) : yield* this.javaEquals(obj, args[0], line)); break;
        case 'hashCode': if (!args.length) return V('int', fromSuper ? wrapInt(Math.imul(obj.v.id, 2654435761) >>> 0) : yield* this.javaHash(obj, line)); break;
        case 'getClass': if (!args.length) return V('Class', { name: obj.t, iface: false }); break;
        case 'compareTo': if (args.length === 1 && !this.isSubtype(obj.t, 'Comparable')) throw compileError(`cannot find symbol: method compareTo(${typeName(args[0].t)}) in ${obj.t} (${obj.t} does not implement Comparable)`, line); break;
      }
      const cls = this.classes[obj.t];
      if (cls) this.findMethod(cls, name, args, line); // throws with the javac message
      throw compileError(`cannot find symbol: method ${name} in ${obj.t}`, line);
    }
    enumMethod(obj, name, args, line) {
      switch (name) {
        case 'name': case 'toString': return str(obj.v.enumName);
        case 'ordinal': return V('int', obj.v.ordinal);
        case 'compareTo': if (args[0].t !== obj.t) throw compileError(`incompatible types: ${typeName(args[0].t)} cannot be converted to ${obj.t}`, line); return V('int', obj.v.ordinal - args[0].v.ordinal);
        case 'equals': return V('boolean', this.equalsValue(obj, args[0], false));
        case 'hashCode': return V('int', wrapInt(Math.imul(obj.v.id, 2654435761) >>> 0));
        case 'getDeclaringClass': return V('Class', { name: obj.t });
      }
      return null;
    }
    enumStatic(cls, name, args, line) {
      if (name === 'values') return V(cls.name + '[]', { id: nextId++, elems: cls.constants.map(k => this.read(cls.statics[k.name])) });
      if (name === 'valueOf') { const k = cls.constants.find(k => k.name === args[0].v); if (!k) throw runtimeError('IllegalArgumentException', `No enum constant ${cls.name}.${args[0].v}`, line); return this.read(cls.statics[k.name]); }
      throw compileError(`cannot find symbol: method ${name} in enum ${cls.name}`, line);
    }
    // a lambda called through any method of its functional interface
    *invokeLambda(fn, args, line, name) {
      if (name === 'equals' && args.length === 1) return V('boolean', this.equalsValue(fn, args[0], false));
      if (name === 'toString' && !args.length) return str(yield* toStr(fn, this, line));
      const L = fn.v;
      if (L.native) return V('int', yield* L.native(args[0], args[1]));
      if (L.params.length !== args.length) throw compileError(`incompatible types: lambda takes ${L.params.length} argument(s), ${name} passes ${args.length}`, line);
      const frame = this.pushFrame(`lambda(${L.params.join(', ')})`, L.self, L.env);
      frame.cls = L.cls;
      const depth = this.stack.length;
      try {
        L.params.forEach((p, i) => { const a = args[i]; const t = a.t === 'null' ? 'Object' : (isNum(a.t) || a.t === 'boolean') ? BOX[a.t] : (a.st && a.st !== 'Object' && isRef(a.st) ? a.st : a.t); this.store(frame.env.declare(p, t, null, false, line), a, line, true); });
        if (L.expr) { yield* this.step(L.expr.line, frame.env); const r = yield* this.eval(L.expr, frame.env); return r; }
        const sig = yield* this.execBlockIn(L.body, frame.env, true);
        if (sig && sig.sig === 'return') return sig.value;
        return V('void', undefined);
      } finally { this.stack.length = depth - 1; }
    }
    // compare two values with a Comparator (lambda or object with compare) or their natural order
    *compare(a, b, cmp, line) {
      if (cmp && cmp.t !== 'null') { const r = unboxed(yield* this.callMethodOn(cmp, 'compare', [a, b], line)); if (r.t !== 'int') throw compileError('compare must return an int', line); return r.v; }
      if (a.t === 'null' || b.t === 'null') throw runtimeError('NullPointerException', 'Cannot compare null', line);
      const ua = unboxed(a), ub = unboxed(b);
      if (isNum(ua.t) && isNum(ub.t)) return ua.v < ub.v ? -1 : ua.v > ub.v ? 1 : 0;
      if (ua.t === 'boolean' && ub.t === 'boolean') return (ua.v ? 1 : 0) - (ub.v ? 1 : 0);
      if (a.t === 'String' && b.t === 'String') { const r = yield* this.stringMethod(a, 'compareTo', [b], line); return r.v; }
      if (this.classes[a.t]) {
        if (!this.isSubtype(a.t, 'Comparable') && a.v.enumName === undefined) throw runtimeError('ClassCastException', `class ${a.t} cannot be cast to class java.lang.Comparable (${a.t} does not implement Comparable)`, line);
        const r = unboxed(yield* this.callMethodOn(a, 'compareTo', [b], line)); return r.v;
      }
      throw runtimeError('ClassCastException', `class ${this.qualified(a.t)} cannot be cast to class java.lang.Comparable`, line);
    }
    *sortValues(items, cmp, line) { // stable merge sort with user comparisons
      if (items.length < 2) return items;
      const mid = items.length >> 1;
      const l = yield* this.sortValues(items.slice(0, mid), cmp, line), r = yield* this.sortValues(items.slice(mid), cmp, line);
      const out = []; let i = 0, j = 0;
      while (i < l.length && j < r.length) { if ((yield* this.compare(r[j], l[i], cmp, line)) < 0) out.push(r[j++]); else out.push(l[i++]); }
      while (i < l.length) out.push(l[i++]); while (j < r.length) out.push(r[j++]);
      return out;
    }
    *boxMethod(obj, name, args, line) {
      const p = UNBOX[obj.t];
      switch (name) {
        case 'intValue': return convert(unboxed(obj), 'int'); case 'longValue': return convert(unboxed(obj), 'long');
        case 'doubleValue': return convert(unboxed(obj), 'double'); case 'floatValue': return convert(unboxed(obj), 'float');
        case 'booleanValue': return V('boolean', obj.v); case 'charValue': return V('char', obj.v);
        case 'equals': return V('boolean', args[0].t === obj.t && args[0].v === obj.v);
        case 'hashCode': return V('int', yield* this.javaHash(obj, line));
        case 'toString': return str(yield* toStr(obj, this, line));
        case 'compareTo': { if (args[0].t !== obj.t && !(isNum(args[0].t) && BOX[args[0].t] === obj.t)) throw compileError(`incompatible types: ${typeName(args[0].t)} cannot be converted to ${obj.t}`, line); return V('int', yield* this.compare(obj, args[0], null, line)); }
        case 'getClass': return V('Class', { name: obj.t });
        case 'isNaN': return V('boolean', Number.isNaN(obj.v));
      }
      void p;
      throw compileError(`cannot find symbol: method ${name} in class ${obj.t}`, line);
    }
    *throwableMethod(obj, name, args, line) {
      const msg = obj.v.fields.message;
      switch (name) {
        case 'getMessage': case 'getLocalizedMessage': return msg && msg.v !== null ? str(msg.v) : NULL;
        case 'toString': return str(yield* toStr(obj, this, line));
        case 'printStackTrace': {
          this.out += (yield* toStr(obj, this, line)) + '\n';
          for (const f of (obj.v.trace || [])) this.out += `\tat ${f}\n`;
          return V('void');
        }
        case 'getStackTrace': return V('String[]', { id: nextId++, elems: (obj.v.trace || []).map(f => str(f)) });
        case 'getClass': return V('Class', { name: obj.t });
        case 'equals': return V('boolean', this.equalsValue(obj, args[0], false));
        case 'hashCode': return V('int', wrapInt(Math.imul(obj.v.id, 2654435761) >>> 0));
        case 'getCause': return NULL;
      }
      const cls = this.classes[obj.t];
      if (cls) { const m = this.findMethod(cls, name, args, line, true); if (m) return yield* this.invoke(m.cls, m, obj, args, line); }
      throw compileError(`cannot find symbol: method ${name} in class ${obj.t}`, line);
    }
    randomMethod(obj, name, args, line) {
      // a small deterministic generator so runs are reproducible
      const rnd = () => { let x = obj.v.seed = (Math.imul(obj.v.seed, 1103515245) + 12345) >>> 0; return x / 4294967296; };
      switch (name) {
        case 'nextInt': if (args.length) { const n = args[0].v; if (n <= 0) throw runtimeError('IllegalArgumentException', 'bound must be positive', line); return V('int', Math.floor(rnd() * n)); } return V('int', wrapInt(Math.floor(rnd() * 4294967296)));
        case 'nextDouble': return V('double', rnd());
        case 'nextBoolean': return V('boolean', rnd() < 0.5);
      }
      throw compileError(`cannot find symbol: method ${name} in class Random`, line);
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
          case 'e': case 'E': if (!isNum(a.t) || INTEGRAL.has(a.t)) throw runtimeError('IllegalFormatConversionException', `${conv} != ${a.t === 'String' ? 'java.lang.String' : a.t}`, line);
            s = a.v.toExponential(prec === undefined ? 6 : +prec).replace(/e([+-])(\d)$/, 'e$10$2'); if (conv === 'E') s = s.toUpperCase(); break;
          case 's': case 'S': s = yield* toStr(a, this, line); if (prec !== undefined) s = s.slice(0, +prec); if (conv === 'S') s = s.toUpperCase(); break;
          case 'c': s = a.t === 'char' ? String.fromCharCode(a.v) : (INTEGRAL.has(a.t) ? String.fromCharCode(a.v) : (() => { throw runtimeError('IllegalFormatConversionException', `c != ${a.t}`, line); })()); break;
          case 'b': s = a.t === 'boolean' ? String(a.v) : (a.t === 'null' ? 'false' : 'true'); break;
          case 'x': case 'X': if (!INTEGRAL.has(a.t) || a.t === 'char') throw runtimeError('IllegalFormatConversionException', `${conv} != ${a.t === 'String' ? 'java.lang.String' : a.t}`, line);
            s = (a.v >>> 0).toString(16); if (conv === 'X') s = s.toUpperCase(); break;
        }
        if (width) { const w = +width; if (s.length < w) s = flags.includes('-') ? s.padEnd(w) : (flags.includes('0') && conv !== 's' ? (s[0] === '-' ? '-' + s.slice(1).padStart(w - 1, '0') : s.padStart(w, '0')) : s.padStart(w)); }
        out += s;
      }
      out += fmt.slice(last);
      return out;
    }
    *staticLib(q, name, rawArgs, line) {
      let args = rawArgs;
      args = args.map(unboxed);
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
          if (args[0].t !== 'String') return name === 'valueOf' ? box(convert(unboxed(args[0]), target)) : convert(unboxed(args[0]), target);
          const s = args[0].v;
          if (target === 'boolean') return V('boolean', s.toLowerCase() === 'true');
          const ok = target === 'int' || target === 'long' ? /^[+-]?\d+$/.test(s) : /^\s*[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?[fFdD]?\s*$/.test(s) || /^\s*[+-]?(NaN|Infinity)\s*$/.test(s);
          if (!ok) throw runtimeError('NumberFormatException', target === 'int' || target === 'long' ? `For input string: "${s}"` : (s.trim() === '' ? 'empty String' : `For input string: "${s}"`), line);
          const v = target === 'int' || target === 'long' ? parseInt(s, 10) : parseFloat(s);
          if (target === 'int' && (v > 2147483647 || v < -2147483648)) throw runtimeError('NumberFormatException', `For input string: "${s}"`, line);
          return name === 'valueOf' ? box(V(target, v)) : V(target, v);
        }
        if (name === 'toString') { need(1, a => true); return str(yield* toStr(args[0], this, line)); }
        if (name === 'toBinaryString' || name === 'toHexString' || name === 'toOctalString') { need(1, num); const base = name === 'toBinaryString' ? 2 : name === 'toHexString' ? 16 : 8; return str((unboxed(args[0]).v >>> 0).toString(base)); }
        if (name === 'sum') { need(2, num); return V(target, target === 'int' ? wrapInt(args[0].v + args[1].v) : args[0].v + args[1].v); }
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
        if (name === 'join') { let items = rawArgs.slice(1); if (items.length === 1 && items[0].t.endsWith('[]')) items = items[0].v.elems.map(x => tagElem(items[0].t.slice(0, -2), x)); else if (items.length === 1 && items[0].v && items[0].v.kind) items = yield* this.itemsOf(items[0], line); const parts = []; for (const a of items) parts.push(yield* toStr(a, this, line)); return str(parts.join(args[0].v)); }
      }
      if (q === 'Arrays') {
        if (name === 'toString') { need(1, a => a.t.endsWith('[]') || a.t === 'null', 'an array'); if (args[0].t === 'null') return lit('null'); const et = args[0].t.slice(0, -2); const parts = []; for (const x of args[0].v.elems) parts.push(yield* toStr(tagElem(et, x), this, line)); return str('[' + parts.join(', ') + ']'); }
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
      if (q === 'Character' && name === 'valueOf') { need(1, a => a.t === 'char' || a.t === 'int'); return box(V('char', args[0].v)); }
      if (q === 'Objects') {
        if (name === 'equals') { need(2, a => true); return V('boolean', rawArgs[0].t === 'null' ? rawArgs[1].t === 'null' : yield* this.javaEquals(rawArgs[0], rawArgs[1], line)); }
        if (name === 'hash') { let h = 1; for (const a of rawArgs) h = wrapInt(Math.imul(31, h) + (yield* this.javaHash(a, line))); return V('int', h); }
        if (name === 'requireNonNull') { if (rawArgs[0].t === 'null') throw runtimeError('NullPointerException', rawArgs[1] ? rawArgs[1].v : '', line); return rawArgs[0]; }
        if (name === 'isNull') return V('boolean', rawArgs[0].t === 'null');
        if (name === 'toString') return str(yield* toStr(rawArgs[0], this, line));
      }
      if (q === 'Arrays' && (name === 'asList' || name === 'sort' || name === 'copyOfRange' || name === 'stream')) {
        if (name === 'asList') { const items = rawArgs.length === 1 && rawArgs[0].t.endsWith('[]') ? rawArgs[0].v.elems.map(x => tagElem(rawArgs[0].t.slice(0, -2), x)) : rawArgs; return this.newList('ArrayList', items.map(x => isNum(x.t) || x.t === 'boolean' ? box(x) : x), null, true); }
        if (name === 'copyOfRange') { const src = rawArgs[0], a = args[1].v, b = args[2].v; return V(src.t, { id: nextId++, elems: src.v.elems.slice(a, b) }); }
        if (name === 'sort') { const arr = rawArgs[0]; if (!arr.t.endsWith('[]')) throw compileError('no suitable method found for sort', line); const et = arr.t.slice(0, -2); if (isNum(et) || et === 'boolean') { arr.v.elems.sort((a, b) => a - b); return V('void'); } const sorted = yield* this.sortValues(arr.v.elems.map(x => tagElem(et, x)), rawArgs[1] || null, line); arr.v.elems.splice(0, arr.v.elems.length, ...sorted); return V('void'); }
      }
      if (q === 'Collections') return yield* this.collectionsLib(name, rawArgs, line);
      if ((q === 'List' || q === 'Set') && name === 'of') { const items = rawArgs.map(x => isNum(x.t) || x.t === 'boolean' ? box(x) : x); const l = q === 'List' ? this.newList('ArrayList', items, null, true) : yield* this.newSet('HashSet', items, null, line); l.v.immutable = true; l.st = q; return l; }
      if (q === 'Map' && (name === 'of' || name === 'entry')) { if (name === 'entry') return V('Entry', { id: nextId++, k: rawArgs[0], val: rawArgs[1] }); const m = this.newMap('HashMap', null); m.v.immutable = true; for (let i = 0; i + 1 < rawArgs.length; i += 2) yield* this.mapPut(m, rawArgs[i], rawArgs[i + 1], line, true); m.st = 'Map'; return m; }
      if (this.classes[q]) throw compileError(`cannot find symbol: method ${name} in class ${q}`, line);
      throw compileError(`cannot find symbol: ${q}.${name}`, line);
    }
    *stringMethod(s, name, args, line) {
      args = args.map(unboxed);
      const t = s.v;
      const argStr = i => { const a = args[i]; if (!a || a.t !== 'String') throw compileError(`method ${name} in class String cannot be applied to given types: found ${args.map(a => typeName(a.t)).join(',')}`, line); return a.v; };
      const argInt = i => { const a = args[i]; if (!a || !INTEGRAL.has(a.t) || a.t === 'long') throw compileError(`incompatible types: ${a ? typeName(a.t) : 'missing'} cannot be converted to int`, line); return a.v; };
      const argChar = i => { const a = args[i]; if (!a || (a.t !== 'char' && a.t !== 'int')) throw compileError(`method ${name} in class String cannot be applied to given types: found ${args.map(a => typeName(a.t)).join(',')}`, line); return String.fromCharCode(a.v); };
      const ARITY = { length: [0], charAt: [1], substring: [1, 2], indexOf: [1, 2], lastIndexOf: [1], equals: [1], equalsIgnoreCase: [1], compareTo: [1], compareToIgnoreCase: [1],
        toUpperCase: [0], toLowerCase: [0], trim: [0], strip: [0], isEmpty: [0], isBlank: [0], contains: [1], startsWith: [1], endsWith: [1], replace: [2], concat: [1], repeat: [1],
        toCharArray: [0], split: [1], toString: [0], hashCode: [0], matches: [1] };
      if (ARITY[name] && !ARITY[name].includes(args.length)) throw compileError(`method ${name} in class String cannot be applied to given types: required ${ARITY[name][0]} argument(s), found ${args.length}`, line);
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
    *scannerMethod(obj, name, args, line) {
      const rd = obj.v.reader; const src = rd.text;
      const hint = rd.stdin ? '— type it in the Input box' : '';
      const skipWs = () => { while (rd.pos < src.length && /\s/.test(src[rd.pos])) rd.pos++; };
      const peekToken = () => { let p = rd.pos; while (p < src.length && /\s/.test(src[p])) p++; let q = p; while (q < src.length && !/\s/.test(src[q])) q++; return p < src.length ? src.slice(p, q) : null; };
      const token = () => { skipWs(); const tk = peekToken(); if (tk === null) throw runtimeError('NoSuchElementException', 'no more input ' + hint, line); rd.pos += tk.length; return tk; };
      const isInt = s => /^[+-]?\d+$/.test(s), isDbl = s => /^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(s);
      switch (name) {
        case 'nextInt': { const tk = peekToken(); if (tk === null) throw runtimeError('NoSuchElementException', 'no more input ' + hint, line); if (!isInt(tk)) throw runtimeError('InputMismatchException', `For input string: "${tk}"`, line); return V('int', parseInt(token(), 10)); }
        case 'nextLong': { const tk = token(); if (!isInt(tk)) throw runtimeError('InputMismatchException', `For input string: "${tk}"`, line); return V('long', parseInt(tk, 10)); }
        case 'nextDouble': case 'nextFloat': { const tk = peekToken(); if (tk === null) throw runtimeError('NoSuchElementException', 'no more input ' + hint, line); if (!isDbl(tk)) throw runtimeError('InputMismatchException', `For input string: "${tk}"`, line); return V(name === 'nextDouble' ? 'double' : 'float', parseFloat(token())); }
        case 'nextBoolean': { const tk = token(); if (!/^(true|false)$/i.test(tk)) throw runtimeError('InputMismatchException', `For input string: "${tk}"`, line); return V('boolean', tk.toLowerCase() === 'true'); }
        case 'next': return str(token());
        case 'nextLine': {
          if (rd.pos >= src.length) throw runtimeError('NoSuchElementException', 'No line found ' + hint, line);
          let q = src.indexOf('\n', rd.pos); if (q < 0) q = src.length;
          const s = src.slice(rd.pos, q).replace(/\r$/, ''); rd.pos = q + 1; return str(s);
        }
        case 'hasNext': return V('boolean', peekToken() !== null);
        case 'hasNextInt': { const tk = peekToken(); return V('boolean', tk !== null && isInt(tk)); }
        case 'hasNextDouble': { const tk = peekToken(); return V('boolean', tk !== null && isDbl(tk)); }
        case 'hasNextLine': return V('boolean', rd.pos < src.length);
        case 'close': return V('void');
      }
      throw compileError(`cannot find symbol: method ${name} in class Scanner`, line);
    }

    // ── built-in objects: new Scanner / StringBuilder / collections / files ──
    *newBuiltin(name, args, targs, line, hint) {
      const argTypes = args.map(a => typeName(a.st || a.t)).join(',');
      switch (name) {
        case 'Scanner': {
          if (args.length !== 1) throw compileError(`no suitable constructor found for Scanner(${argTypes})`, line);
          const a = args[0];
          if (a.t === 'InputStream') return V('Scanner', { id: nextId++, reader: this.stdinReader });
          if (a.t === 'String') return V('Scanner', { id: nextId++, reader: { text: a.v, pos: 0 } });
          if (a.t === 'File') { const text = this.readFile(a.v.name, line); return V('Scanner', { id: nextId++, reader: { text, pos: 0 } }); }
          throw compileError(`no suitable constructor found for Scanner(${argTypes})`, line);
        }
        case 'String': return str(args.length ? (args[0].t === 'char[]' ? String.fromCharCode(...args[0].v.elems) : yield* toStr(args[0], this, line)) : '');
        case 'StringBuilder': case 'StringBuffer': return V('StringBuilder', { id: nextId++, text: args.length && args[0].t === 'String' ? args[0].v : '' });
        case 'Random': return V('Random', { id: nextId++, seed: (args.length ? unboxed(args[0]).v : 42) >>> 0 });
        case 'Integer': case 'Double': case 'Long': case 'Boolean': case 'Character': case 'Float': case 'Short': case 'Byte': {
          if (args.length !== 1) throw compileError(`no suitable constructor found for ${name}(${argTypes})`, line);
          const a = unboxed(args[0]);
          if (a.t === 'String') return box(yield* this.staticLib(name, 'valueOf', [a], line));
          const b = box(convert(a, UNBOX[name])); b.id = 'B' + (nextId++); return b; // `new Integer(5)` is never cached
        }
        case 'Object': return V('Object', { id: nextId++, cls: 'Object', fields: {} });
        case 'ArrayList': case 'LinkedList': case 'Stack': case 'ArrayDeque': case 'Vector': {
          const list = this.newList(name === 'Vector' ? 'ArrayList' : name, [], targs);
          if (args.length === 1 && args[0].v && args[0].v.kind) { list.v.items = (yield* this.itemsOf(args[0], line)).slice(); }
          else if (args.length === 1 && isNum(unboxed(args[0]).t)) { /* initial capacity */ }
          else if (args.length) throw compileError(`no suitable constructor found for ${name}(${argTypes})`, line);
          return list;
        }
        case 'PriorityQueue': {
          const pq = this.newList('PriorityQueue', [], targs);
          for (const a of args) { if (a.t === '$Lambda' || (this.classes[a.t] && this.isSubtype(a.t, 'Comparator'))) pq.v.cmp = a; else if (a.v && a.v.kind) pq.v.items = (yield* this.itemsOf(a, line)).slice(); }
          if (pq.v.items.length) pq.v.items = yield* this.sortValues(pq.v.items, pq.v.cmp, line);
          return pq;
        }
        case 'HashSet': case 'TreeSet': case 'LinkedHashSet': {
          const set = yield* this.newSet(name, [], targs, line);
          for (const a of args) { if (a.t === '$Lambda' || (this.classes[a.t] && this.isSubtype(a.t, 'Comparator'))) set.v.cmp = a; else if (a.v && a.v.kind) for (const x of yield* this.itemsOf(a, line)) yield* this.setAdd(set, x, line); }
          return set;
        }
        case 'HashMap': case 'TreeMap': case 'LinkedHashMap': {
          const map = this.newMap(name, targs);
          for (const a of args) { if (a.t === '$Lambda' || (this.classes[a.t] && this.isSubtype(a.t, 'Comparator'))) map.v.cmp = a; else if (a.v && a.v.kind === 'map') for (const en of a.v.entries) yield* this.mapPut(map, en.k, en.val, line); }
          return map;
        }
        case 'File': { if (args.length !== 1 || args[0].t !== 'String') throw compileError(`no suitable constructor found for File(${argTypes})`, line); this.filesUsed = true; return V('File', { id: nextId++, name: args[0].v }); }
        case 'FileOutputStream': case 'FileWriter': {
          const a = args[0]; if (!a || (a.t !== 'String' && a.t !== 'File')) throw compileError(`no suitable constructor found for ${name}(${argTypes})`, line);
          const fname = a.t === 'File' ? a.v.name : a.v;
          const append = args.length > 1 && unboxed(args[1]).v === true;
          return this.openWriter(name, fname, append, line);
        }
        case 'PrintWriter': case 'BufferedWriter': {
          const a = args[0]; if (!a) throw compileError(`no suitable constructor found for ${name}()`, line);
          if (a.t === 'String' || a.t === 'File') return this.openWriter(name, a.t === 'File' ? a.v.name : a.v, false, line);
          if (a.t === 'PrintStream') return V('PrintWriter', { id: nextId++, name: 'System.out', console: true, buf: '' });
          if (['FileOutputStream', 'FileWriter', 'BufferedWriter', 'PrintWriter'].includes(a.t)) { const w = V(name, Object.assign({}, a.v, { id: nextId++ })); w.v.inner = a; return w; }
          throw compileError(`no suitable constructor found for ${name}(${argTypes})`, line);
        }
        case 'FileReader': case 'FileInputStream': {
          const a = args[0]; if (!a || (a.t !== 'String' && a.t !== 'File')) throw compileError(`no suitable constructor found for ${name}(${argTypes})`, line);
          const fname = a.t === 'File' ? a.v.name : a.v;
          if (name === 'FileInputStream' && this.binFiles[fname]) return V(name, { id: nextId++, name: fname, objects: this.binFiles[fname].slice(), pos: 0 });
          const text = this.readFile(fname, line);
          return V(name, { id: nextId++, name: fname, reader: { text, pos: 0 } });
        }
        case 'BufferedReader': { const a = args[0]; if (!a || a.t !== 'FileReader') throw compileError(`no suitable constructor found for BufferedReader(${argTypes})`, line); return V('BufferedReader', { id: nextId++, name: a.v.name, reader: a.v.reader }); }
        case 'ObjectOutputStream': { const a = args[0]; if (!a || a.t !== 'FileOutputStream') throw compileError(`no suitable constructor found for ObjectOutputStream(${argTypes})`, line); this.binFiles[a.v.name] = a.v.append && this.binFiles[a.v.name] ? this.binFiles[a.v.name] : []; delete this.files[a.v.name]; this.touchFiles(); return V('ObjectOutputStream', { id: nextId++, name: a.v.name }); }
        case 'ObjectInputStream': { const a = args[0]; if (!a || a.t !== 'FileInputStream') throw compileError(`no suitable constructor found for ObjectInputStream(${argTypes})`, line); if (!a.v.objects) throw runtimeError('StreamCorruptedException', `invalid stream header (${a.v.name} is a text file)`, line); return V('ObjectInputStream', { id: nextId++, name: a.v.name, objects: a.v.objects, pos: 0 }); }
      }
      if (BUILTIN_INTERFACES.has(name)) throw compileError(`${name} is abstract; cannot be instantiated`, line);
      if (BUILTIN_SUPER[name] && isBuiltinThrowable(name)) { const cls = this.builtinClass(name); const obj = V(name, { id: nextId++, cls: name, fields: {} }); obj.v.trace = this.stack.map(f => f.name).reverse(); obj.v.line = line; yield* this.construct(cls, obj, args, line); obj.st = name; return obj; }
      throw compileError(`cannot find symbol: class ${name}`, line);
    }
    // ── files ──
    readFile(name, line) {
      this.filesUsed = true;
      if (this.files[name] === undefined) throw runtimeError('FileNotFoundException', `${name} (No such file or directory)`, line);
      return this.files[name];
    }
    openWriter(kind, name, append, line) {
      this.filesUsed = true;
      if (!append || this.files[name] === undefined) { this.files[name] = ''; delete this.binFiles[name]; }
      this.touchFiles();
      void line;
      return V(kind, { id: nextId++, name, append, buf: '', closed: false });
    }
    flushWriter(w) {
      if (w.v.console) { this.out += w.v.buf; w.v.buf = ''; return; }
      if (w.v.buf) { this.files[w.v.name] = (this.files[w.v.name] || '') + w.v.buf; w.v.buf = ''; this.touchFiles(); }
    }
    *fileMethod(obj, name, args, line) {
      const t = obj.t;
      if (t === 'File') {
        switch (name) {
          case 'exists': return V('boolean', this.files[obj.v.name] !== undefined || this.binFiles[obj.v.name] !== undefined);
          case 'getName': case 'getPath': case 'toString': case 'getAbsolutePath': return str(obj.v.name);
          case 'length': return V('long', (this.files[obj.v.name] || '').length);
          case 'delete': { const had = this.files[obj.v.name] !== undefined || this.binFiles[obj.v.name] !== undefined; delete this.files[obj.v.name]; delete this.binFiles[obj.v.name]; if (had) this.touchFiles(); return V('boolean', had); }
          case 'createNewFile': { if (this.files[obj.v.name] !== undefined) return V('boolean', false); this.files[obj.v.name] = ''; this.touchFiles(); return V('boolean', true); }
          case 'canRead': case 'canWrite': case 'isFile': return V('boolean', this.files[obj.v.name] !== undefined);
          case 'isDirectory': return V('boolean', false);
        }
      }
      if (t === 'PrintWriter' || t === 'FileWriter' || t === 'BufferedWriter' || t === 'FileOutputStream') {
        if (obj.v.closed && name !== 'close') return V('void'); // PrintWriter swallows writes after close
        switch (name) {
          case 'println': obj.v.buf += (args.length ? yield* toStr(args[0], this, line) : '') + '\n'; return V('void');
          case 'print': case 'write': case 'append': obj.v.buf += yield* toStr(args[0], this, line); return V('void');
          case 'printf': case 'format': obj.v.buf += yield* this.format(args[0].v, args.slice(1), line); return V('void');
          case 'newLine': obj.v.buf += '\n'; return V('void');
          case 'flush': this.flushWriter(obj); return V('void');
          case 'close': this.flushWriter(obj); obj.v.closed = true; if (obj.v.inner) obj.v.inner.v.closed = true; return V('void');
          case 'checkError': return V('boolean', false);
        }
      }
      if (t === 'BufferedReader' || t === 'FileReader') {
        const rd = obj.v.reader;
        switch (name) {
          case 'readLine': { if (rd.pos >= rd.text.length) return NULL; let q = rd.text.indexOf('\n', rd.pos); if (q < 0) q = rd.text.length; const s = rd.text.slice(rd.pos, q).replace(/\r$/, ''); rd.pos = q + 1; return str(s); }
          case 'read': { if (rd.pos >= rd.text.length) return V('int', -1); return V('int', rd.text.charCodeAt(rd.pos++)); }
          case 'ready': return V('boolean', rd.pos < rd.text.length);
          case 'close': return V('void');
        }
      }
      if (t === 'ObjectOutputStream') {
        switch (name) {
          case 'writeObject': { const v = args[0]; this.checkSerializable(v, line); this.binFiles[obj.v.name].push(this.deepCopy(v)); this.touchFiles(); return V('void'); }
          case 'writeInt': case 'writeDouble': case 'writeBoolean': case 'writeUTF': case 'writeChar': case 'writeLong': this.binFiles[obj.v.name].push(this.deepCopy(args[0])); this.touchFiles(); return V('void');
          case 'close': case 'flush': return V('void');
        }
      }
      if (t === 'ObjectInputStream') {
        switch (name) {
          case 'readObject': case 'readInt': case 'readDouble': case 'readBoolean': case 'readUTF': case 'readChar': case 'readLong': {
            if (obj.v.pos >= obj.v.objects.length) throw runtimeError('EOFException', 'end of the object stream', line);
            const v = this.deepCopy(obj.v.objects[obj.v.pos++]);
            if (name === 'readObject') { if (isNum(v.t) || v.t === 'boolean') return box(v); v.st = 'Object'; return v; }
            return unboxed(v);
          }
          case 'close': case 'available': return name === 'available' ? V('int', obj.v.objects.length - obj.v.pos) : V('void');
        }
      }
      if (t === 'FileInputStream' || t === 'FileOutputStream') { if (name === 'close') return V('void'); }
      throw compileError(`cannot find symbol: method ${name} in class ${t}`, line);
    }
    checkSerializable(v, line) {
      if (v.t === 'null' || v.t === 'String' || isBox(v.t) || isNum(v.t) || v.t === 'boolean') return;
      if (v.t.endsWith('[]')) { for (const x of v.v.elems) this.checkSerializable(tagElem(v.t.slice(0, -2), x), line); return; }
      if (v.v && v.v.kind) { if (v.v.kind === 'map') for (const en of v.v.entries) { this.checkSerializable(en.k, line); this.checkSerializable(en.val, line); } else for (const x of v.v.items) this.checkSerializable(x, line); return; }
      if (this.classes[v.t]) {
        if (!this.isSubtype(v.t, 'Serializable')) throw runtimeError('NotSerializableException', v.t, line);
        for (const [k, slot] of Object.entries(v.v.fields)) if (!k.startsWith('$') && slot.v !== null && isRef(erase(slot.t)) && !slot.transient) this.checkSerializable(this.read(slot), line);
        return;
      }
      throw runtimeError('NotSerializableException', this.qualified(v.t), line);
    }
    deepCopy(v, seen = new Map()) { // a serialized copy: same structure, fresh identities
      if (v.t === 'null' || isNum(v.t) || v.t === 'boolean' || isBox(v.t)) return Object.assign({}, v);
      if (v.t === 'String') return str(v.v);
      if (!v.v || typeof v.v !== 'object') return Object.assign({}, v);
      if (seen.has(v.v.id)) return seen.get(v.v.id);
      const out = V(v.t, { id: nextId++ }); seen.set(v.v.id, out);
      if (v.t.endsWith('[]')) { const et = v.t.slice(0, -2); out.v.elems = v.v.elems.map(x => isRef(et) ? this.deepCopy(tagElem(et, x), seen) : x); return out; }
      if (v.v.kind) { Object.assign(out.v, v.v, { id: out.v.id }); if (v.v.kind === 'map') out.v.entries = v.v.entries.map(en => ({ k: this.deepCopy(en.k, seen), val: this.deepCopy(en.val, seen), hash: en.hash })); else out.v.items = v.v.items.map(x => this.deepCopy(x, seen)); return out; }
      out.v.cls = v.v.cls; out.v.fields = {};
      if (v.v.enumName !== undefined) { out.v.enumName = v.v.enumName; out.v.ordinal = v.v.ordinal; }
      for (const [k, slot] of Object.entries(v.v.fields)) { const s = Object.assign({}, slot); if (slot.v !== null && isRef(erase(slot.t)) && typeof slot.v === 'object') { const c = this.deepCopy(this.read(slot), seen); s.v = c.v; s.id = c.id; } out.v.fields[k] = s; }
      return out;
    }
    // ── StringBuilder ──
    *stringBuilderMethod(sb, name, args, line) {
      const t = sb.v.text;
      switch (name) {
        case 'append': sb.v.text += yield* toStr(args[0], this, line); return sb;
        case 'toString': return str(t);
        case 'length': return V('int', t.length);
        case 'charAt': { const i = unboxed(args[0]).v; if (i < 0 || i >= t.length) throw runtimeError('StringIndexOutOfBoundsException', `index ${i},length ${t.length}`, line); return V('char', t.charCodeAt(i)); }
        case 'reverse': sb.v.text = [...t].reverse().join(''); return sb;
        case 'insert': { const i = unboxed(args[0]).v; const s = yield* toStr(args[1], this, line); sb.v.text = t.slice(0, i) + s + t.slice(i); return sb; }
        case 'deleteCharAt': { const i = unboxed(args[0]).v; if (i < 0 || i >= t.length) throw runtimeError('StringIndexOutOfBoundsException', `index ${i},length ${t.length}`, line); sb.v.text = t.slice(0, i) + t.slice(i + 1); return sb; }
        case 'delete': { const a = unboxed(args[0]).v, b = Math.min(unboxed(args[1]).v, t.length); sb.v.text = t.slice(0, a) + t.slice(b); return sb; }
        case 'setCharAt': { const i = unboxed(args[0]).v; sb.v.text = t.slice(0, i) + String.fromCharCode(unboxed(args[1]).v) + t.slice(i + 1); return V('void'); }
        case 'setLength': { const n = unboxed(args[0]).v; sb.v.text = n <= t.length ? t.slice(0, n) : t + '\0'.repeat(n - t.length); return V('void'); }
        case 'indexOf': return V('int', t.indexOf(args[0].v));
        case 'replace': { const a = unboxed(args[0]).v, b = unboxed(args[1]).v; sb.v.text = t.slice(0, a) + args[2].v + t.slice(b); return sb; }
        case 'substring': return str(t.slice(unboxed(args[0]).v, args.length > 1 ? unboxed(args[1]).v : t.length));
        case 'isEmpty': return V('boolean', t.length === 0);
        case 'equals': return V('boolean', this.equalsValue(sb, args[0], false));
      }
      throw compileError(`cannot find symbol: method ${name} in class StringBuilder`, line);
    }

    // ── collections ──
    // list: { kind: 'list', items: [value], targs, mod }   set: { kind: 'set', items, sorted?, cmp, cap }
    // map: { kind: 'map', entries: [{k, val, hash}], sorted?, cmp, cap }   view: { kind: 'view', of: () => items }
    newList(type, items, targs, fixed) { const v = V(type, { id: nextId++, kind: 'list', items, targs: targs || null, mod: 0 }); if (fixed) v.v.fixedSize = true; return v; }
    *newSet(type, items, targs, line) { const s = V(type, { id: nextId++, kind: 'set', items: [], targs: targs || null, mod: 0, sorted: type === 'TreeSet', linked: type === 'LinkedHashSet', cap: 16 }); for (const x of items) yield* this.setAdd(s, x, line); return s; }
    newMap(type, targs) { return V(type, { id: nextId++, kind: 'map', entries: [], targs: targs || null, mod: 0, sorted: type === 'TreeMap', linked: type === 'LinkedHashMap', cap: 16 }); }
    elemType(c, i) { return c.v.targs && c.v.targs[i] ? erase(c.v.targs[i]) : null; }
    // an element to store: checked against the declared type argument when known, boxed when primitive
    checkElem(c, val, i, line) {
      const et = this.elemType(c, i);
      if (et) { const slot = { t: et, name: '' }; this.store(slot, val, line, true); return this.read(slot); }
      const v = isNum(val.t) || val.t === 'boolean' ? box(val) : Object.assign({}, val);
      delete v.st; return v;
    }
    *itemsOf(c, line) { // the elements of any collection or view, in iteration order
      if (c.v.kind === 'list') return c.v.items;
      if (c.v.kind === 'set') return this.orderedItems(c);
      if (c.v.kind === 'view') return c.v.of();
      if (c.v.kind === 'map') return this.orderedEntries(c).map(en => V('Entry', { id: nextId++, k: en.k, val: en.val, map: c, entry: en }));
      void line;
      return [];
    }
    // HashMap / HashSet iterate by bucket (hash & (capacity-1)), insertion order inside a bucket; capacity doubles past 75 %
    orderedEntries(m) {
      if (m.v.sorted || m.v.linked) return m.v.entries;
      const spread = h => (h ^ (h >>> 16)) & (m.v.cap - 1);
      return m.v.entries.map((en, i) => [spread(en.hash), i, en]).sort((a, b) => a[0] - b[0] || a[1] - b[1]).map(x => x[2]);
    }
    orderedItems(s) {
      if (s.v.sorted || s.v.linked) return s.v.items;
      const spread = h => (h ^ (h >>> 16)) & (s.v.cap - 1);
      return s.v.items.map((x, i) => [spread(x.$hash), i, x]).sort((a, b) => a[0] - b[0] || a[1] - b[1]).map(x => x[2]);
    }
    grow(c, n) { while (n > c.v.cap * 0.75) c.v.cap *= 2; }
    mutable(c, line) { if (c.v.immutable || c.v.fixedSize) throw runtimeError('UnsupportedOperationException', c.v.fixedSize ? 'Arrays.asList returns a fixed-size list' : 'this collection is immutable', line); }
    *indexOfValue(items, x, line) { for (let i = 0; i < items.length; i++) if (yield* this.javaEquals(x.t === 'null' ? items[i] : x, x.t === 'null' ? x : items[i], line)) return i; return -1; }
    *mapFind(m, key, line) {
      if (m.v.sorted) { for (let i = 0; i < m.v.entries.length; i++) { const c = yield* this.compare(key, m.v.entries[i].k, m.v.cmp, line); if (c === 0) return i; if (c < 0) return -1 - i; } return -1 - m.v.entries.length; }
      const h = yield* this.javaHash(key, line);
      for (let i = 0; i < m.v.entries.length; i++) if (m.v.entries[i].hash === h && (yield* this.javaEquals(key.t === 'null' ? m.v.entries[i].k : key, key.t === 'null' ? key : m.v.entries[i].k, line))) return i;
      return -1;
    }
    *mapPut(m, key, val, line, init) {
      if (!init) this.mutable(m, line);
      const k = this.checkElem(m, key, 0, line), v = this.checkElem(m, val, 1, line);
      if (m.v.sorted && k.t === 'null') throw runtimeError('NullPointerException', 'TreeMap does not permit null keys', line);
      const i = yield* this.mapFind(m, k, line);
      if (i >= 0) { const old = m.v.entries[i].val; m.v.entries[i].val = v; return old; }
      const en = { k, val: v, hash: m.v.sorted ? 0 : yield* this.javaHash(k, line) };
      if (m.v.sorted) m.v.entries.splice(-1 - i, 0, en); else m.v.entries.push(en);
      m.v.mod++; this.grow(m, m.v.entries.length);
      return NULL;
    }
    *setAdd(s, val, line) {
      this.mutable(s, line);
      const v = this.checkElem(s, val, 0, line);
      if (s.v.sorted) {
        if (v.t === 'null') throw runtimeError('NullPointerException', 'TreeSet does not permit null', line);
        for (let i = 0; i < s.v.items.length; i++) { const c = yield* this.compare(v, s.v.items[i], s.v.cmp, line); if (c === 0) return false; if (c < 0) { s.v.items.splice(i, 0, v); s.v.mod++; return true; } }
        s.v.items.push(v); s.v.mod++; return true;
      }
      v.$hash = yield* this.javaHash(v, line);
      for (const x of s.v.items) if (x.$hash === v.$hash && (yield* this.javaEquals(v.t === 'null' ? x : v, v.t === 'null' ? v : x, line))) return false;
      s.v.items.push(v); s.v.mod++; this.grow(s, s.v.items.length);
      return true;
    }
    *setFind(s, val, line) {
      if (s.v.sorted) { for (let i = 0; i < s.v.items.length; i++) if ((yield* this.compare(val, s.v.items[i], s.v.cmp, line)) === 0) return i; return -1; }
      const h = yield* this.javaHash(val, line);
      for (let i = 0; i < s.v.items.length; i++) if (s.v.items[i].$hash === h && (yield* this.javaEquals(val.t === 'null' ? s.v.items[i] : val, val.t === 'null' ? val : s.v.items[i], line))) return i;
      return -1;
    }
    *collectionToString(c, line) {
      if (c.v.kind === 'map') { const parts = []; for (const en of this.orderedEntries(c)) parts.push((yield* toStr(en.k, this, line)) + '=' + (yield* toStr(en.val, this, line))); return '{' + parts.join(', ') + '}'; }
      const items = yield* this.itemsOf(c, line);
      const parts = []; for (const x of items) parts.push(x.v === c.v ? '(this Collection)' : yield* toStr(x, this, line));
      return '[' + parts.join(', ') + ']';
    }
    *collectionEquals(a, b, line) {
      if (a.v.kind === 'map' || b.v.kind === 'map') {
        if (a.v.kind !== 'map' || b.v.kind !== 'map' || a.v.entries.length !== b.v.entries.length) return false;
        for (const en of a.v.entries) { const i = yield* this.mapFind(b, en.k, line); if (i < 0 || !(yield* this.javaEquals(en.val, b.v.entries[i].val, line))) return false; }
        return true;
      }
      const ai = yield* this.itemsOf(a, line), bi = yield* this.itemsOf(b, line);
      if (ai.length !== bi.length) return false;
      if (a.v.kind === 'set' || b.v.kind === 'set') { for (const x of ai) if ((yield* this.indexOfValue(bi, x, line)) < 0) return false; return true; }
      for (let i = 0; i < ai.length; i++) if (!(yield* this.javaEquals(ai[i], bi[i], line))) return false;
      return true;
    }
    makeIterator(c, line) {
      const src = c.v.kind === 'map' ? null : c;
      const it = V(c.t === 'LinkedList' || c.t === 'ArrayList' ? 'Iterator' : 'Iterator', { id: nextId++, src, pos: 0, mod: c.v.mod, last: -1, line, of: c });
      it.v.items = c.v.kind === 'list' ? c.v.items : c.v.kind === 'set' ? this.orderedItems(c) : c.v.kind === 'view' ? c.v.of() : [];
      it.v.live = c.v.kind === 'list';
      if (c.v.kind === 'view' && c.v.map) it.v.map = c.v.map;
      return it;
    }
    iteratorHasNext(it) { return it.v.live ? it.v.pos !== it.v.items.length : it.v.pos < it.v.items.length; }
    iteratorNext(it, line) {
      const owner = it.v.of.v.map || it.v.of;
      if (owner.v.mod !== it.v.mod) throw runtimeError('ConcurrentModificationException', 'the collection was modified while iterating over it (use the iterator\'s remove, or collect first)', line);
      if (it.v.pos >= it.v.items.length) throw runtimeError('NoSuchElementException', 'the iterator has no next element', line);
      it.v.last = it.v.pos;
      return it.v.items[it.v.pos++];
    }
    *iteratorMethod(it, name, args, line) {
      switch (name) {
        case 'hasNext': return V('boolean', this.iteratorHasNext(it));
        case 'next': return this.iteratorNext(it, line);
        case 'remove': {
          if (it.v.last < 0) throw runtimeError('IllegalStateException', 'next() has not been called, or remove() was already called', line);
          const owner = it.v.of.v.map || it.v.of;
          const target = it.v.items[it.v.last];
          if (owner.v.kind === 'list') { owner.v.items.splice(it.v.last, 1); it.v.pos--; }
          else if (owner.v.kind === 'set') { const i = owner.v.items.indexOf(target); owner.v.items.splice(i, 1); it.v.items.splice(it.v.last, 1); it.v.pos--; }
          else if (owner.v.kind === 'map') { const key = target.t === 'Entry' ? target.v.k : target; const i = yield* this.mapFind(owner, key, line); if (i >= 0) owner.v.entries.splice(i, 1); it.v.items.splice(it.v.last, 1); it.v.pos--; }
          owner.v.mod++; it.v.mod = owner.v.mod; it.v.last = -1;
          return V('void');
        }
        case 'hasPrevious': return V('boolean', it.v.pos > 0);
        case 'previous': { if (it.v.pos <= 0) throw runtimeError('NoSuchElementException', 'no previous element', line); it.v.last = --it.v.pos; return it.v.items[it.v.pos]; }
        case 'nextIndex': return V('int', it.v.pos);
        case 'set': { if (it.v.last < 0) throw runtimeError('IllegalStateException', 'next() has not been called', line); it.v.of.v.items[it.v.last] = this.checkElem(it.v.of, args[0], 0, line); return V('void'); }
        case 'add': { it.v.of.v.items.splice(it.v.pos++, 0, this.checkElem(it.v.of, args[0], 0, line)); it.v.last = -1; it.v.of.v.mod++; it.v.mod = it.v.of.v.mod; return V('void'); }
      }
      throw compileError(`cannot find symbol: method ${name} in interface Iterator`, line);
    }
    *entryMethod(en, name, args, line) {
      switch (name) {
        case 'getKey': { const k = Object.assign({}, en.v.k); const et = en.v.map && this.elemType(en.v.map, 0); if (et) k.st = et; return k; }
        case 'getValue': { const v = Object.assign({}, en.v.val); const et = en.v.map && this.elemType(en.v.map, 1); if (et) v.st = et; return v; }
        case 'setValue': { const old = en.v.val; const v = this.checkElem(en.v.map, args[0], 1, line); en.v.val = v; if (en.v.entry) en.v.entry.val = v; return old; }
        case 'toString': return str(yield* toStr(en, this, line));
        case 'equals': return V('boolean', yield* this.javaEquals(en, args[0], line));
      }
      throw compileError(`cannot find symbol: method ${name} in interface Map.Entry`, line);
    }
    *collectionMethod(c, name, args, line) {
      const k = c.v.kind;
      const a0 = args[0];
      const items = k === 'list' ? c.v.items : null;
      const typed = (v, i) => { if (v.t === 'null') return NULL; const out = Object.assign({}, v); const et = this.elemType(c, i || 0); if (et && et !== 'Object') out.st = et; else delete out.st; return out; };
      const idx = (a, allowEnd) => { const u = unboxed(a); if (!INTEGRAL.has(u.t) || u.t === 'long') throw compileError(`incompatible types: ${typeName(a.t)} cannot be converted to int`, line); if (u.v < 0 || u.v > items.length - (allowEnd ? 0 : 1)) throw runtimeError('IndexOutOfBoundsException', `Index ${u.v} out of bounds for length ${items.length}`, line); return u.v; };
      const isCmp = a => a && (a.t === '$Lambda' || (this.classes[a.t] && this.isSubtype(a.t, 'Comparator')));
      // methods shared by every collection
      switch (name) {
        case 'size': return V('int', k === 'map' ? c.v.entries.length : (yield* this.itemsOf(c, line)).length);
        case 'isEmpty': return V('boolean', (k === 'map' ? c.v.entries.length : (yield* this.itemsOf(c, line)).length) === 0);
        case 'toString': return str(yield* this.collectionToString(c, line));
        case 'equals': return V('boolean', a0.v && a0.v.kind ? yield* this.collectionEquals(c, a0, line) : false);
        case 'hashCode': return V('int', yield* this.javaHash(c, line));
        case 'getClass': return V('Class', { name: c.t });
        case 'clear': this.mutable(c, line); if (k === 'map') c.v.entries = []; else c.v.items = []; c.v.mod++; return V('void');
        case 'iterator': if (k !== 'map') return this.makeIterator(c, line); break;
        case 'listIterator': if (k === 'list') { const it = this.makeIterator(c, line); it.t = 'ListIterator'; if (a0) it.v.pos = unboxed(a0).v; return it; } break;
        case 'forEach': {
          if (k === 'map') { for (const en of this.orderedEntries(c).slice()) yield* this.callMethodOn(a0, 'accept', [en.k, en.val], line); return V('void'); }
          for (const x of (yield* this.itemsOf(c, line)).slice()) yield* this.callMethodOn(a0, 'accept', [x], line);
          return V('void');
        }
        case 'stream': throw compileError('streams are not supported here; use a loop', line);
      }
      if (k === 'list' || k === 'view' || k === 'set') {
        const all = k === 'list' ? items : yield* this.itemsOf(c, line);
        switch (name) {
          case 'contains': return V('boolean', k === 'set' ? (yield* this.setFind(c, a0, line)) >= 0 : (yield* this.indexOfValue(all, a0, line)) >= 0);
          case 'containsAll': { for (const x of yield* this.itemsOf(a0, line)) if ((yield* this.indexOfValue(all, x, line)) < 0) return V('boolean', false); return V('boolean', true); }
          case 'toArray': { const et = this.elemType(c, 0) || 'Object'; return V(et + '[]', { id: nextId++, elems: all.map(x => Object.assign({}, x)) }); }
          case 'addAll': { this.mutable(c, line); if (!a0 || !a0.v || !a0.v.kind) throw compileError(`no suitable method found for addAll(${typeName(a0 ? a0.t : 'nothing')})`, line); const src = (yield* this.itemsOf(a0, line)).slice(); let changed = false; for (const x of src) { if (k === 'set') changed = (yield* this.setAdd(c, x, line)) || changed; else { items.push(this.checkElem(c, x, 0, line)); changed = true; } } if (changed) c.v.mod++; return V('boolean', changed); }
          case 'removeAll': case 'retainAll': { this.mutable(c, line); const other = yield* this.itemsOf(a0, line); const keep = []; let changed = false; for (const x of all) { const inOther = (yield* this.indexOfValue(other, x, line)) >= 0; if (name === 'removeAll' ? !inOther : inOther) keep.push(x); else changed = true; } if (k === 'view') throw runtimeError('UnsupportedOperationException', 'views are read-only here', line); c.v.items = keep; if (changed) c.v.mod++; return V('boolean', changed); }
          case 'removeIf': { this.mutable(c, line); const keep = []; let changed = false; for (const x of all) { const r = unboxed(yield* this.callMethodOn(a0, 'test', [x], line)); if (r.v) changed = true; else keep.push(x); } c.v.items = keep; if (changed) c.v.mod++; return V('boolean', changed); }
        }
      }
      if (k === 'list') {
        const pq = c.t === 'PriorityQueue', deque = c.t === 'ArrayDeque' || c.t === 'LinkedList', stack = c.t === 'Stack';
        switch (name) {
          case 'add': case 'addLast': case 'offer': case 'offerLast': {
            this.mutable(c, line);
            if (args.length === 2 && name === 'add') { const i = idx(args[0], true); items.splice(i, 0, this.checkElem(c, args[1], 0, line)); c.v.mod++; return V('void'); }
            if (args.length !== 1) throw compileError(`no suitable method found for ${name}(${args.map(a => typeName(a.t)).join(',')})`, line);
            const v = this.checkElem(c, a0, 0, line);
            if (pq) { let i = 0; while (i < items.length && (yield* this.compare(items[i], v, c.v.cmp, line)) <= 0) i++; items.splice(i, 0, v); }
            else items.push(v);
            c.v.mod++; return name === 'add' || name === 'offer' ? V('boolean', true) : V('void');
          }
          case 'addFirst': case 'offerFirst': case 'push': { this.mutable(c, line); const v = this.checkElem(c, a0, 0, line); if (stack) { items.push(v); c.v.mod++; return typed(v); } items.unshift(v); c.v.mod++; return name === 'push' ? V('void') : name === 'offerFirst' ? V('boolean', true) : V('void'); }
          case 'get': { const i = idx(a0); return typed(items[i]); }
          case 'set': { this.mutable(c, line); if (c.v.immutable) this.mutable(c, line); const i = idx(a0); const old = items[i]; items[i] = this.checkElem(c, args[1], 0, line); return typed(old); }
          case 'remove': {
            this.mutable(c, line);
            if (!args.length) { if (!items.length) throw runtimeError('NoSuchElementException', 'the queue is empty', line); const v = items.shift(); c.v.mod++; return typed(v); }
            // remove(int index) when the argument is a primitive int; remove(Object) when it is boxed or a reference
            if (a0.t === 'int' || a0.t === 'short' || a0.t === 'byte' || a0.t === 'char') { const i = idx(a0); const v = items.splice(i, 1)[0]; c.v.mod++; return typed(v); }
            const i = yield* this.indexOfValue(items, a0, line); if (i < 0) return V('boolean', false); items.splice(i, 1); c.v.mod++; return V('boolean', true);
          }
          case 'removeFirst': case 'pop': case 'poll': case 'pollFirst': {
            this.mutable(c, line);
            if (stack && name === 'pop') { if (!items.length) throw runtimeError('EmptyStackException', '', line); const v = items.pop(); c.v.mod++; return typed(v); }
            if (!items.length) { if (name.startsWith('poll')) return NULL; throw runtimeError('NoSuchElementException', 'the deque is empty', line); }
            const v = items.shift(); c.v.mod++; return typed(v);
          }
          case 'removeLast': case 'pollLast': { this.mutable(c, line); if (!items.length) { if (name === 'pollLast') return NULL; throw runtimeError('NoSuchElementException', 'the deque is empty', line); } const v = items.pop(); c.v.mod++; return typed(v); }
          case 'getFirst': case 'element': case 'peek': case 'peekFirst': {
            if (stack && name === 'peek') { if (!items.length) throw runtimeError('EmptyStackException', '', line); return typed(items[items.length - 1]); }
            if (!items.length) { if (name.startsWith('peek')) return NULL; throw runtimeError('NoSuchElementException', 'the list is empty', line); }
            return typed(items[0]);
          }
          case 'getLast': case 'peekLast': { if (!items.length) { if (name === 'peekLast') return NULL; throw runtimeError('NoSuchElementException', 'the list is empty', line); } return typed(items[items.length - 1]); }
          case 'indexOf': return V('int', yield* this.indexOfValue(items, a0, line));
          case 'lastIndexOf': { for (let i = items.length - 1; i >= 0; i--) if (yield* this.javaEquals(items[i], a0, line)) return V('int', i); return V('int', -1); }
          case 'search': { if (!stack) break; for (let i = items.length - 1; i >= 0; i--) if (yield* this.javaEquals(items[i], a0, line)) return V('int', items.length - i); return V('int', -1); }
          case 'empty': if (stack) return V('boolean', items.length === 0); break;
          case 'subList': { const a = idx(a0, true), b = idx(args[1], true); const l = this.newList('ArrayList', items.slice(a, b), c.v.targs); return l; }
          case 'sort': { this.mutable(c, line); const sorted = yield* this.sortValues(items, a0 && a0.t !== 'null' ? a0 : null, line); items.splice(0, items.length, ...sorted); c.v.mod++; return V('void'); }
          case 'descendingIterator': { const it = this.makeIterator(c, line); it.v.items = items.slice().reverse(); it.v.live = false; return it; }
          case 'ensureCapacity': case 'trimToSize': return V('void');
        }
        if (pq || deque) { /* fall through to the error */ }
        void isCmp;
      }
      if (k === 'set') {
        switch (name) {
          case 'add': return V('boolean', yield* this.setAdd(c, a0, line));
          case 'remove': { this.mutable(c, line); const i = yield* this.setFind(c, a0, line); if (i < 0) return V('boolean', false); c.v.items.splice(i, 1); c.v.mod++; return V('boolean', true); }
          case 'first': case 'last': { if (!c.v.items.length) throw runtimeError('NoSuchElementException', 'the set is empty', line); return typed(name === 'first' ? c.v.items[0] : c.v.items[c.v.items.length - 1]); }
          case 'pollFirst': case 'pollLast': { if (!c.v.items.length) return NULL; const v = name === 'pollFirst' ? c.v.items.shift() : c.v.items.pop(); c.v.mod++; return typed(v); }
          case 'floor': case 'ceiling': case 'lower': case 'higher': { let best = null; for (const x of c.v.items) { const cmp = yield* this.compare(x, a0, c.v.cmp, line); if ((name === 'floor' && cmp <= 0) || (name === 'lower' && cmp < 0)) best = x; if ((name === 'ceiling' && cmp >= 0) || (name === 'higher' && cmp > 0)) { best = x; break; } } return best ? typed(best) : NULL; }
          case 'headSet': case 'tailSet': { const out = yield* this.newSet(c.t, [], c.v.targs, line); out.v.cmp = c.v.cmp; for (const x of c.v.items) { const cmp = yield* this.compare(x, a0, c.v.cmp, line); if (name === 'headSet' ? cmp < 0 : cmp >= 0) yield* this.setAdd(out, x, line); } return out; }
        }
      }
      if (k === 'map') {
        const en = c.v.entries;
        switch (name) {
          case 'put': return typed(yield* this.mapPut(c, a0, args[1], line), 1);
          case 'putIfAbsent': { const i = yield* this.mapFind(c, a0, line); if (i >= 0) return typed(en[i].val, 1); yield* this.mapPut(c, a0, args[1], line); return NULL; }
          case 'putAll': { for (const x of a0.v.entries) yield* this.mapPut(c, x.k, x.val, line); return V('void'); }
          case 'get': { const i = yield* this.mapFind(c, a0, line); return i >= 0 ? typed(en[i].val, 1) : NULL; }
          case 'getOrDefault': { const i = yield* this.mapFind(c, a0, line); return i >= 0 ? typed(en[i].val, 1) : args[1]; }
          case 'containsKey': return V('boolean', (yield* this.mapFind(c, a0, line)) >= 0);
          case 'containsValue': { for (const x of en) if (yield* this.javaEquals(x.val, a0, line)) return V('boolean', true); return V('boolean', false); }
          case 'remove': { this.mutable(c, line); const i = yield* this.mapFind(c, a0, line); if (i < 0) return NULL; const old = en[i].val; en.splice(i, 1); c.v.mod++; return typed(old, 1); }
          case 'keySet': { const self = this; return V('Set', { id: nextId++, kind: 'view', map: c, of: () => self.orderedEntries(c).map(x => x.k), targs: c.v.targs ? [c.v.targs[0]] : null, get mod() { return c.v.mod; } }); }
          case 'values': { const self = this; return V('Collection', { id: nextId++, kind: 'view', map: c, of: () => self.orderedEntries(c).map(x => x.val), targs: c.v.targs ? [c.v.targs[1]] : null, get mod() { return c.v.mod; } }); }
          case 'entrySet': { const self = this; return V('Set', { id: nextId++, kind: 'view', map: c, of: () => self.orderedEntries(c).map(x => V('Entry', { id: x.id || (x.id = nextId++), k: x.k, val: x.val, map: c, entry: x })), targs: null, get mod() { return c.v.mod; } }); }
          case 'merge': { const i = yield* this.mapFind(c, a0, line); if (i < 0) { yield* this.mapPut(c, a0, args[1], line); return typed(args[1], 1); } const nv = yield* this.callMethodOn(args[2], 'apply', [en[i].val, args[1]], line); en[i].val = this.checkElem(c, nv, 1, line); return typed(en[i].val, 1); }
          case 'firstKey': case 'lastKey': { if (!en.length) throw runtimeError('NoSuchElementException', 'the map is empty', line); return typed(name === 'firstKey' ? en[0].k : en[en.length - 1].k); }
          case 'firstEntry': case 'lastEntry': { if (!en.length) return NULL; const x = name === 'firstEntry' ? en[0] : en[en.length - 1]; return V('Entry', { id: nextId++, k: x.k, val: x.val, map: c, entry: x }); }
        }
      }
      throw compileError(`cannot find symbol: method ${name}(${args.map(a => typeName(a.st || a.t)).join(',')}) in ${typeName(c.st || c.t)}`, line);
    }
    *collectionsLib(name, args, line) {
      const c = args[0];
      const list = () => { if (!c || !c.v || c.v.kind !== 'list') throw compileError(`no suitable method found for Collections.${name}(${args.map(a => typeName(a.st || a.t)).join(',')})`, line); return c.v.items; };
      switch (name) {
        case 'sort': { const items = list(); this.mutable(c, line); const sorted = yield* this.sortValues(items, args[1] || null, line); items.splice(0, items.length, ...sorted); c.v.mod++; return V('void'); }
        case 'reverse': { const items = list(); items.reverse(); c.v.mod++; return V('void'); }
        case 'shuffle': { const items = list(); let seed = 12345; for (let i = items.length - 1; i > 0; i--) { seed = (Math.imul(seed, 1103515245) + 12345) >>> 0; const j = seed % (i + 1); [items[i], items[j]] = [items[j], items[i]]; } c.v.mod++; return V('void'); }
        case 'swap': { const items = list(); const i = unboxed(args[1]).v, j = unboxed(args[2]).v; [items[i], items[j]] = [items[j], items[i]]; return V('void'); }
        case 'max': case 'min': { const items = yield* this.itemsOf(c, line); if (!items.length) throw runtimeError('NoSuchElementException', 'the collection is empty', line); let best = items[0]; for (const x of items.slice(1)) { const r = yield* this.compare(x, best, args[1] || null, line); if (name === 'max' ? r > 0 : r < 0) best = x; } return best; }
        case 'frequency': { let n = 0; for (const x of yield* this.itemsOf(c, line)) if (yield* this.javaEquals(x, args[1], line)) n++; return V('int', n); }
        case 'addAll': { for (const x of args.slice(1)) yield* this.collectionMethod(c, 'add', [x], line); return V('boolean', args.length > 1); }
        case 'unmodifiableList': case 'unmodifiableSet': case 'unmodifiableMap': case 'unmodifiableCollection': { const out = Object.assign({}, c, { v: Object.assign({}, c.v, { immutable: true }) }); return out; }
        case 'emptyList': return this.newList('ArrayList', [], null);
        case 'nCopies': { const n = unboxed(c).v; const l = this.newList('ArrayList', Array.from({ length: n }, () => Object.assign({}, args[1])), null, true); return l; }
        case 'reverseOrder': return V('$Lambda', { id: nextId++, params: ['a', 'b'], expr: null, body: null, native: (a, b) => this.compare(b, a, null, line) });
        case 'binarySearch': { const items = list(); let lo = 0, hi = items.length - 1; while (lo <= hi) { const mid = (lo + hi) >> 1; const r = yield* this.compare(items[mid], args[1], args[2] || null, line); if (r === 0) return V('int', mid); if (r < 0) lo = mid + 1; else hi = mid - 1; } return V('int', -(lo + 1)); }
      }
      throw compileError(`cannot find symbol: method ${name} in class Collections`, line);
    }
  }

  /* ════════════════════════════════════════════════════════════════
     5. Public run: parse + execute to the end, return the trace
     ════════════════════════════════════════════════════════════════ */
  JAVA.run = function (code, stdin, opts) {
    nextId = 1;
    let unit, it;
    try { unit = JAVA.parse(code); it = new Interp(unit, stdin, opts); }
    catch (e) { if (e instanceof JavaError) return { trace: [], out: '', error: { kind: 'compile', message: e.message, line: e.line } }; throw e; }
    let error = null;
    try {
      const g = it.runMain();
      while (!g.next().done) { /* each yield = one recorded step */ }
    } catch (e) {
      if (e instanceof ThrowSignal) { // an uncaught Java exception
        const msg = e.val.v.fields && e.val.v.fields.message;
        error = { kind: 'runtime', name: e.val.t, qualified: it.qualified(e.val.t), message: msg && msg.v !== null ? msg.v : '', line: e.line, at: e.val.v.trace || [] };
      } else if (!(e instanceof JavaError)) { error = { kind: 'runtime', name: 'InternalError', message: String(e && e.message || e), line: null }; console.warn('java.js internal error', e); }
      else error = { kind: e.kind, name: e.name, message: e.message, line: e.line, qualified: e.kind === 'runtime' && isBuiltinThrowable(e.name) ? it.qualified(e.name) : e.name, at: e.kind === 'runtime' ? it.stack.map(f => f.name).reverse() : [] };
      it.snap(error.line, 'error');
    }
    return { trace: it.trace, out: it.out, error, steps: it.steps, snippet: !!unit.snippet, files: it.filesUsed ? it.fsHistory || { 0: it.fileView() } : null };
  };

  /* ════════════════════════════════════════════════════════════════
     6. Stepper UI
     ════════════════════════════════════════════════════════════════ */
  const UIS = {};
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const KW_RE = /\b(class|interface|enum|public|private|protected|static|final|abstract|void|int|long|double|float|boolean|char|byte|short|if|else|while|do|for|switch|case|default|break|continue|return|new|this|super|null|true|false|import|package|extends|implements|instanceof|try|catch|finally|throw|throws)\b/g;
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
      this.files = cfg.files && typeof cfg.files === 'object' ? Object.fromEntries(Object.entries(cfg.files).map(([k, v]) => [k, String(v)])) : {};
      this.result = null; this.i = 0; this.editing = true;
      this.el = document.getElementById('sim-' + id);
    }
    usesStdin() { return /\bScanner\b/.test(this.code); }
    run() {
      this.result = JAVA.run(this.code, this.stdin, { maxSteps: this.cfg.maxSteps || 5000, files: this.files });
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
        const at = (err.at || []).map(f => `<br>&nbsp;&nbsp;at ${esc(f)}`).join('');
        errHtml = err.kind === 'compile'
          ? `<div class="jv-err"><b>error${err.line ? ` (line ${err.line})` : ''}:</b> ${esc(err.message)}</div>`
          : `<div class="jv-err"><b>Exception in thread "main" ${esc(err.qualified || (err.name === 'StepLimit' || err.name === 'Exit' ? err.name : 'java.lang.' + err.name))}${err.message ? ':' : ''}</b> ${esc(err.message)}${err.line ? `<br>&nbsp;&nbsp;at line ${err.line}` : ''}${at}</div>`;
      }
      let filesHtml = '';
      if (this.result && this.result.files && cur) {
        const fs = this.result.files[cur.files] || this.result.files[0] || {};
        const names = Object.keys(fs);
        filesHtml = `<div class="jv-panel"><div class="jv-panel-title">Files</div><div class="jv-files">${names.length ? names.map(n => `<div class="jv-file"><div class="jv-file-name">${esc(n)}</div><pre class="jv-file-body">${esc(fs[n]) || '<span class="jv-empty">(empty)</span>'}</pre></div>`).join('') : '<div class="jv-empty">no files yet</div>'}</div></div>`;
      }
      const status = !this.result ? '' : this.editing ? '' : cur && cur.note === 'finished' ? 'program finished' : cur && cur.note === 'error' ? 'stopped' : cur && cur.note === 'caught' ? `caught ${cur.caught} — handler on line ${curLine}` : `step ${this.i} of ${tr.length - 1}${curLine ? ` — about to run line ${curLine}` : ''}`;

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
              ${filesHtml}
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
