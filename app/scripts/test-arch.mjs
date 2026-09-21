// Tests for the computer-architecture engine (arch.js) through its DOM-free driver ARCH.model.
// Run from app/: node scripts/test-arch.mjs
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const src = readFileSync(new URL('../src/sims/arch.js', import.meta.url), 'utf8');
const sandbox = { window: {}, console, module: { exports: {} }, TextEncoder };
vm.runInNewContext(src, sandbox);
const ARCH = sandbox.window.ARCH;

let pass = 0, fail = 0;
const t = (name, fn) => { try { fn(); pass++; } catch (e) { fail++; console.log(`✗ ${name}: ${e.message}`); } };
const J = v => JSON.stringify(v, (k, x) => typeof x === 'bigint' ? x.toString() + 'n' : x);
const eq = (a, b, what) => { if (J(a) !== J(b)) throw new Error(`${what || ''} expected ${J(b)}, got ${J(a)}`); };
const ok = (c, what) => { if (!c) throw new Error(what || 'condition failed'); };
const model = cfg => ARCH.model(cfg);
const last = m => m.steps[m.steps.length - 1].d;
const clean = m => { const bad = m.steps.filter(s => s.hl && s.hl.err); if (bad.length) throw new Error('error step: ' + bad[0].d); };
const renders = m => { for (let k = 0; k < m.steps.length; k++) { const r = m.render(k); const h = typeof r === 'string' ? r : r.html + (r.side || ''); ok(typeof h === 'string' && h.length > 0, `render ${k} empty`); ok(!/undefined|NaN/.test(h.replace(/is undefined/g, '')), `render ${k} has undefined/NaN`); } };

/* ── numbers ── */
t('convert 13.75 → 1101.11', () => { const m = model({ mode: 'convert', value: '13.75', from: 10, to: 2 }); clean(m); eq(m.state.result, '1101.11'); renders(m); });
t('convert 753₈ → 1EB₁₆ (fast)', () => { const m = model({ mode: 'convert', value: '753', from: 8, to: 16, fast: true }); clean(m); eq(m.state.result, '1EB'); });
t('convert 753₈ → 1EB₁₆ (long way)', () => { const m = model({ mode: 'convert', value: '753', from: 8, to: 16 }); clean(m); eq(m.state.result, '1EB'); });
t('convert 443.13₅ → 123.32', () => { const m = model({ mode: 'convert', value: '443.13', from: 5, to: 10 }); clean(m); eq(m.state.result, '123.32'); });
t('convert 0.1 does not terminate', () => { const m = model({ mode: 'convert', value: '0.1', from: 10, to: 2 }); clean(m); eq(m.state.fracExact, false); ok(/truncated/.test(last(m))); });
t('convert rejects bad digits', () => { const m = model({ mode: 'convert', value: '129', from: 8, to: 10 }); ok(m.steps.some(s => s.hl.err)); });
t('signed −45 on 8 bits', () => {
  const m = model({ mode: 'signed', value: -45, bits: 8 }); clean(m);
  const by = Object.fromEntries(m.state.rows.map(r => [r.name, r.b]));
  eq(by['sign-magnitude'], '10101101'); eq(by["one's complement"], '11010010'); eq(by["two's complement"], '11010011'); eq(by['excess-127'], '01010010');
  eq(m.state.ext.to, '1111111111010011'); renders(m);
});
t('signed −128 has no sign-magnitude form', () => { const m = model({ mode: 'signed', value: -128, bits: 8 }); clean(m); eq(m.state.rows[0].b, '—'); eq(m.state.rows[2].b, '10000000'); });
t('add 2 + 3 on 4 bits', () => { const m = model({ mode: 'add', a: 2, b: 3, bits: 4 }); clean(m); eq(m.state.res.sum, '0101'); eq([m.state.res.N, m.state.res.Z, m.state.res.C, m.state.res.V], [0, 0, 0, 0]); renders(m); });
t('add 7 + 1 overflows on 4 bits (V=1, C=0)', () => { const m = model({ mode: 'add', a: 7, b: 1, bits: 4 }); clean(m); eq(m.state.res.sum, '1000'); eq(m.state.res.V, 1); eq(m.state.res.C, 0); ok(/overflow/.test(last(m))); });
t('add 100 + 200 unsigned: carry, no overflow', () => { const m = model({ mode: 'add', a: 100, b: 200, bits: 8, unsigned: true }); clean(m); eq(m.state.res.C, 1); eq(m.state.res.V, 0); ok(/carry flag/.test(last(m))); });
t('sub 5 − 3 = 2 by two\'s complement', () => { const m = model({ mode: 'add', a: 5, b: 3, bits: 4, op: 'sub' }); clean(m); eq(m.state.res.sum, '0010'); eq(m.state.res.C, 1); });
t('multiply 13 × 11 shift-and-add', () => { const m = model({ mode: 'multiply', a: 13, b: 11, bits: 4 }); clean(m); eq(m.state.res.value, 143); eq(m.state.res.bits, '10001111'); renders(m); });
t('multiply −3 × 7 Booth', () => { const m = model({ mode: 'multiply', a: -3, b: 7, bits: 4, algo: 'booth' }); clean(m); eq(m.state.res.value, -21); renders(m); });
t('multiply −8 × 7 Booth works, −8 as multiplicand is refused', () => { const m = model({ mode: 'multiply', a: 7, b: -8, bits: 4, algo: 'booth' }); clean(m); eq(m.state.res.value, -56); ok(model({ mode: 'multiply', a: -8, b: 3, bits: 4, algo: 'booth' }).steps.some(s => s.hl.err)); });
t('divide 13 ÷ 3 restoring', () => { const m = model({ mode: 'divide', a: 13, b: 3, bits: 4 }); clean(m); eq([m.state.res.q, m.state.res.r], [4, 1]); renders(m); });
t('divide by zero is refused', () => { const m = model({ mode: 'divide', a: 13, b: 0, bits: 4 }); ok(m.steps.some(s => s.hl.err)); });

/* ── floating point and text ── */
t('float 13.75 in the 5/10 format', () => { const m = model({ mode: 'float', value: '13.75', exp: 5, mant: 10 }); clean(m); eq([m.state.f.sign, m.state.f.E, m.state.f.M], [0, '10010', '1011100000']); ok(/0x4AE0/.test(last(m))); ok(/exact/.test(last(m))); renders(m); });
t('float 0.1 as a single: 0x3DCCCCCD', () => { const m = model({ mode: 'float', value: '0.1', exp: 8, mant: 23 }); clean(m); ok(/0x3DCCCCCD/.test(last(m))); eq(m.state.f.rounded, true); });
t('float −0.0001 in 5/10 is denormal', () => { const m = model({ mode: 'float', value: '-0.0001', exp: 5, mant: 10 }); clean(m); eq(m.state.f.sign, 1); eq(m.state.f.E, '00001'); });
t('float 1e-6 in 5/10 is denormal', () => { const m = model({ mode: 'float', value: '0.000001', exp: 5, mant: 10 }); clean(m); eq(m.state.f.kind, 'denormal'); eq(m.state.f.E, '00000'); });
t('float 100000 in 5/10 overflows to ∞', () => { const m = model({ mode: 'float', value: '100000', exp: 5, mant: 10 }); clean(m); eq(m.state.f.kind, 'inf'); eq(m.state.f.E, '11111'); });
t('float zero and NaN', () => { eq(model({ mode: 'float', value: '0', exp: 5, mant: 10 }).state.f.kind, 'zero'); eq(model({ mode: 'float', value: 'nan', exp: 5, mant: 10 }).state.f.kind, 'nan'); });
t('float decode 0 10010 1011100000 = 13.75', () => { const m = model({ mode: 'float', bits: '0 10010 1011100000', exp: 5, mant: 10 }); clean(m); eq(m.state.dir, 'decode'); eq(m.state.dec.value, 13.75); renders(m); });
t('float decode smallest denormal', () => { const m = model({ mode: 'float', bits: '0 00000 0000000001', exp: 5, mant: 10 }); clean(m); eq(m.state.dec.kind, 'denormal'); ok(Math.abs(m.state.dec.value - Math.pow(2, -24)) < 1e-12); });
t('float decode wrong width is refused', () => { const m = model({ mode: 'float', bits: '0101', exp: 5, mant: 10 }); ok(m.steps.some(s => s.hl.err)); });
t('float-add 13.75 + 0.375 exact', () => { const m = model({ mode: 'float-add', a: 13.75, b: 0.375, exp: 5, mant: 10 }); clean(m); eq(m.state.res.value, 14.125); renders(m); });
t('float-add 0.1 + 0.2 rounds', () => { const m = model({ mode: 'float-add', a: 0.1, b: 0.2, exp: 8, mant: 23 }); clean(m); ok(Math.abs(m.state.res.value - 0.30000001192092896) < 1e-12); });
t('float-add cancellation 1 − 0.99', () => { const m = model({ mode: 'float-add', a: 1, b: -0.99, exp: 5, mant: 10 }); clean(m); ok(Math.abs(m.state.res.value - 0.009765625) < 1e-12); });
t('float-add to zero', () => { const m = model({ mode: 'float-add', a: 2.5, b: -2.5, exp: 5, mant: 10 }); clean(m); eq(m.state.res.value, 0); });
t('text Hi é€ as UTF-8', () => { const m = model({ mode: 'text', text: 'Hi é€' }); clean(m); eq(m.state.rows.map(r => r.hex.join(' ')), ['48', '69', '20', 'C3 A9', 'E2 82 AC']); renders(m); });

/* ── error codes ── */
t('parity even on 1011001, flip detected', () => { const m = model({ mode: 'parity', data: '1011001', kind: 'even', flip: 2 }); clean(m); eq(m.state.rows[0].p, 0); eq(m.state.rows[0].ok, false); ok(/cannot say which/.test(last(m))); renders(m); });
t('parity odd on 1011001', () => { const m = model({ mode: 'parity', data: '1011001', kind: 'odd' }); clean(m); eq(m.state.rows[0].p, 1); });
t('2-D parity locates and corrects (1,2)', () => { const m = model({ mode: 'parity', data: '1011 0110 1100', flip: '1,2' }); clean(m); eq(m.state.found, [1, 2]); eq(m.state.rows[1].bits, '0110'); ok(/corrected/.test(last(m))); renders(m); });
t('hamming 1011 → 0110011, every single flip corrected', () => {
  const base = model({ mode: 'hamming', data: '1011' }); clean(base); eq(base.state.code, '0110011');
  for (let p = 1; p <= 7; p++) { const m = model({ mode: 'hamming', data: '1011', flip: p }); clean(m); eq(m.state.syndrome, p, `flip ${p}`); eq(m.state.pos.map(x => x.b).join(''), '0110011', `restored ${p}`); }
  renders(base);
});
t('hamming 8 data bits use 4 parity bits', () => { const m = model({ mode: 'hamming', data: '10110011' }); clean(m); eq(m.state.r, 4); eq(m.state.pos.length, 12); });
t('gray 3 bits', () => { const m = model({ mode: 'gray', bits: 3 }); clean(m); eq(m.state.lists[2], ['000', '001', '011', '010', '110', '111', '101', '100']); ok(m.state.rows.every(r => r.i === 0 || r.dg === 1)); renders(m); });

/* ── digital logic ── */
const tableOf = m => m.state.rows.map(r => r.f).join('');
t('truth table x + yz', () => { const m = model({ mode: 'truth-table', expr: 'x + y z' }); clean(m); eq(m.state.vars, ['x', 'y', 'z']); eq(tableOf(m), '00011111'); eq(m.state.forms.m, [3, 4, 5, 6, 7]); renders(m); });
t('truth table half adder', () => { eq(tableOf(model({ mode: 'truth-table', expr: 'A ⊕ B' })), '0110'); eq(tableOf(model({ mode: 'truth-table', expr: 'A B' })), '0001'); });
t('truth table full adder', () => { eq(tableOf(model({ mode: 'truth-table', expr: 'A ⊕ B ⊕ Cin', vars: ['A', 'B', 'Cin'] })), '01101001'); eq(tableOf(model({ mode: 'truth-table', expr: 'A B + Cin (A ⊕ B)', vars: ['A', 'B', 'Cin'] })), '00010111'); });
t('truth table operators and forms', () => { const m = model({ mode: 'truth-table', expr: "x'y + xy'" }); clean(m); eq(tableOf(m), '0110'); eq(m.state.forms.sop, "x'y + xy'"); eq(m.state.forms.pos, "(x + y)(x' + y')"); eq(tableOf(model({ mode: 'truth-table', expr: 'nand(x, y)' })), '1110'); eq(tableOf(model({ mode: 'truth-table', expr: 'not x or y' })), '1101'); });
t('truth table rejects garbage', () => { ok(model({ mode: 'truth-table', expr: 'x +' }).steps.some(s => s.hl.err)); });
t('circuit x + yz evaluates gate by gate', () => { const m = model({ mode: 'circuit', expr: 'x + y z', inputs: { x: 0, y: 1, z: 1 } }); clean(m); eq(m.state.vals[m.state.gates.out], 1); eq(m.steps.slice(2, 4).map(s => s.d), ['AND(1, 1) = 1', 'OR(0, 1) = 1']); ok(/^<svg/.test(m.render())); renders(m); });
t('circuit NAND-only XOR', () => { for (const [x, y] of [[0, 0], [0, 1], [1, 0], [1, 1]]) { const m = model({ mode: 'circuit', expr: 'x ⊕ y', gates: 'nand', inputs: { x, y } }); clean(m); eq(m.state.vals[m.state.gates.out], x ^ y, `${x}⊕${y}`); ok(m.state.gates.nodes.filter(n => n.in.length).every(n => n.t === 'nand')); } });
t('circuit toggles rebuild controls per input', () => { const m = model({ mode: 'circuit', expr: 'a b + c' }); eq(Object.keys(m.values), ['a', 'b', 'c']); });
t('decoder 3-to-8 input 5', () => { const m = model({ mode: 'decoder', n: 3, input: 5 }); clean(m); eq(m.state.active, 5); ok(/A2A1'A0/.test(last(m))); renders(m); });
t('mux 4-to-1 select 2', () => { const m = model({ mode: 'mux', n: 2, select: 2, data: '0 1 1 0' }); clean(m); eq(m.state.out, 1); renders(m); });
t('adder 0110 + 0011 = 1001', () => { const m = model({ mode: 'adder', a: '0110', b: '0011' }); clean(m); eq(m.state.res.sum, '1001'); eq(m.state.res.C, 0); eq(m.state.cols.map(c => c.cout).join(''), '0110'); renders(m); });
t('adder with carry in and carry out', () => { const m = model({ mode: 'adder', a: '1111', b: '0000', cin: 1 }); clean(m); eq(m.state.res.sum, '0000'); eq(m.state.res.C, 1); });
t('alu 6 − 3: X = 3, C = 1 (no borrow)', () => { const m = model({ mode: 'alu', a: 6, b: 3, bits: 8, op: 'sub' }); clean(m); eq(m.state.x, '00000011'); eq(m.state.flags, { N: 0, Z: 0, C: 1, V: 0 }); renders(m); });
t('alu 100 + 100 overflows', () => { const m = model({ mode: 'alu', a: 100, b: 100, bits: 8, op: 'add' }); clean(m); eq(m.state.x, '11001000'); eq(m.state.flags, { N: 1, Z: 0, C: 0, V: 1 }); });
t('alu logic and shifts', () => { eq(model({ mode: 'alu', a: 6, b: 3, op: 'and' }).state.x, '00000010'); eq(model({ mode: 'alu', a: 6, b: 3, op: 'xor' }).state.x, '00000101'); eq(model({ mode: 'alu', a: 3, b: 3, op: 'sub' }).state.flags.Z, 1); const s = model({ mode: 'alu', a: 129, b: 0, op: 'shl' }); eq(s.state.x, '00000010'); eq(s.state.flags.C, 1); });
t('timing D flip-flop samples on the rising edge', () => { const m = model({ mode: 'timing', device: 'd-ff', signals: { D: '001111000110', CLK: '010101010101' } }); clean(m); eq(m.state.q.map(x => x.q).join(''), '000111100110'); ok(/^<svg/.test(m.render())); renders(m); });
t('timing D flip-flop negative edge', () => { const m = model({ mode: 'timing', device: 'd-ff', edge: 'neg', signals: { D: '0011', CLK: '1010' } }); clean(m); eq(m.state.q.map(x => x.q).join(''), '0001'); });
t('timing RS latch set/hold/reset', () => { const m = model({ mode: 'timing', device: 'rs-latch', signals: { S: '01000000', R: '00001000' } }); clean(m); eq(m.state.q.map(x => x.q).join(''), '01110000'); });
t('timing D latch follows while enabled', () => { const m = model({ mode: 'timing', device: 'd-latch', signals: { D: '0110100110', E: '0011110000' } }); clean(m); eq(m.state.q.map(x => x.q).join(''), '0010100000'); });
t('timing T and JK flip-flops', () => { const tt = model({ mode: 'timing', device: 't-ff', signals: { T: '111111', CLK: '010101' } }); clean(tt); eq(tt.state.q.map(x => x.q).join(''), '011001'); const jk = model({ mode: 'timing', device: 'jk-ff', signals: { J: '11000011', K: '00001111', CLK: '01010101' } }); clean(jk); eq(jk.state.q.map(x => x.q).join(''), '01111001'); });

/* ── CPU ── */
t('rtn: fetch sequence and an ALU transfer', () => {
  const m = model({ mode: 'rtn', program: 'PC → MAR\nM[MAR] → MDR\nMDR → IR\nPC + 1 → PC\nACC ← ACC + R1\nMDR ← R2\nM[MAR] ← MDR', regs: { PC: '$10', ACC: 5, R1: 3, R2: 9 }, memory: { '$10': '$A9' } });
  clean(m); eq([m.state.regs.MAR, m.state.regs.IR, m.state.regs.PC, m.state.regs.ACC], [16, 169, 17, 8]); eq(m.state.mem[16], 9);
  ok(m.steps.some(s => /LHSload/.test(s.d)) && m.steps.some(s => /ALUenable/.test(s.d))); renders(m);
});
t('rtn rejects a bad transfer', () => { ok(model({ mode: 'rtn', program: 'MAR → M[MAR]' }).steps.some(s => s.hl.err)); });
const run = (program, extra) => { const m = model(Object.assign({ mode: 'cpu', program }, extra || {})); return m; };
t('cpu LDA/STA/ADC with flags', () => { const m = run('    LDA #5\n    STA $30\n    LDA #7\n    CLC\n    ADC $30\n    STA $31\n    BRK'); clean(m); eq(m.state.regs.A, 12); eq(m.state.mem[0x31], 12); eq(m.state.halted, true); renders(m); });
t('cpu assembles the real opcodes', () => { const m = run('    LDA #$2A\n    STA $0300\n    LDA $0300,X\n    JMP ($0400)\n    BNE foo\nfoo: RTS'); eq(m.state.listing.slice(0, 4).map(l => l.bytes[0]), [0xA9, 0x8D, 0xBD, 0x6C]); eq(m.state.listing[0].bytes, [0xA9, 0x2A]); eq(m.state.listing[1].bytes, [0x8D, 0x00, 0x03]); });
t('cpu indexed loop sums an array', () => { const m = run('    LDX #0\n    LDA #0\n    CLC\nloop:\n    ADC nums,X\n    INX\n    CPX #5\n    BNE loop\n    STA total\n    BRK\nnums:  .byte 5, 11, 23, 83, 15\ntotal: .byte 0'); clean(m); eq(m.state.regs.A, 137); eq(m.state.regs.X, 5); eq(m.state.P.V, 1); });
t('cpu JSR/RTS and the stack', () => { const m = run('    LDA #3\n    JSR double\n    STA $40\n    BRK\ndouble:\n    PHA\n    ASL A\n    TAX\n    PLA\n    TXA\n    RTS'); clean(m); eq(m.state.mem[0x40], 6); eq(m.state.regs.S, 0xFF); ok(m.steps.some(s => /push the return address \$0204/.test(s.d))); });
t('cpu IRQ runs the ISR and RTI resumes', () => { const m = run('    CLI\n    LDA #1\n    LDA #2\n    BRK\nirq:\n    PHA\n    INC $50\n    PLA\n    RTI', { interrupt_at: 2 }); clean(m); eq(m.state.mem[0x50], 1); eq(m.state.regs.A, 2); eq(m.state.regs.S, 0xFF); const i = m.steps.findIndex(s => /IRQ line asserted/.test(s.d)); ok(i > 0 && /RTI/.test(m.steps[i + 4].d)); });
t('cpu micro steps follow the fetch–decode–execute cycle', () => { const m = run('    LDA $0300\n    BRK\n    .org $0300\nval: .byte $2A', { micro: true }); clean(m); const d = m.steps.map(s => s.d); ok(/PC → MAR \(\$0200\), PC \+ 1 → PC/.test(d[2]), 'fetch'); ok(/opcode \$AD decodes as LDA direct \(absolute\)/.test(d[3]), 'decode'); ok(/IDL → ABL forms \$0300/.test(d[5]), 'address'); ok(/M\[MAR\] → MDR = \$2A/.test(d[6]), 'read'); eq(m.state.regs.A, 0x2A); });
t('cpu (zp),Y indirect indexed', () => { const m = run('    LDY #2\n    LDA (ptr),Y\n    BRK\n    .org $0300\ntbl: .byte 9, 8, 7\n    .org $0010\nptr: .word tbl'); clean(m); eq(m.state.regs.A, 7); });
t('cpu refuses a non-zero-page pointer', () => { ok(run('    LDA (ptr),Y\n    BRK\nptr: .word $0300').state.err); });
t('cpu branch out of range is an error', () => { ok(/out of range/.test(run('    BNE far\n    .org $0400\nfar: BRK').state.err || '')); });
const x86 = (program, extra) => model(Object.assign({ mode: 'x86', program }, extra || {}));
t('x86 exit(42) through syscall', () => { const m = x86('section .text\nglobal _start\n_start:\n    mov rax, 60\n    mov rdi, 42\n    syscall'); clean(m); eq(m.state.exit, 42); eq(m.state.halted, true); renders(m); });
t('x86 write a string with equ $ - msg', () => { const m = x86('section .data\nmsg: db "Hello, World!", 10\nlen: equ $ - msg\nsection .text\nglobal _start\n_start:\n    mov rax, 1\n    mov rdi, 1\n    mov rsi, msg\n    mov rdx, len\n    syscall\n    mov rax, 60\n    xor rdi, rdi\n    syscall'); clean(m); eq(m.state.stdout, 'Hello, World!\n'); eq(m.state.exit, 0); });
t('x86 TwoSum over dq array with scaled index', () => { const m = x86('section .data\nnums: dq 5, 11, 23, 83, 15\ntarget: dq 106\ncount: dq 5\nsection .text\nglobal _start\n_start:\n    mov rcx, 0\nouter:\n    mov rdx, 0\ninner:\n    cmp rcx, rdx\n    je next\n    mov rax, [nums + rcx*8]\n    add rax, [nums + rdx*8]\n    cmp rax, [target]\n    je found\nnext:\n    inc rdx\n    cmp rdx, [count]\n    jl inner\n    inc rcx\n    cmp rcx, [count]\n    jl outer\nfound:\n    mov rax, 60\n    mov rdi, rcx\n    syscall'); clean(m); eq(m.state.exit, 2); eq(m.state.regs[3], 3n); });
t('x86 32-bit ABI: gcd with int 0x80, div cl, .bss', () => {
  const m = x86('section .text\nglobal _start\n_start:\n\tmov al, [num1]\n\tmov bl, [num2]\ngcd_loop:\n\tcmp al, bl\n\tje  gcd_done\n\tja  a_greater\n\tsub bl, al\n\tjmp gcd_loop\na_greater:\n\tsub al, bl\n\tjmp gcd_loop\ngcd_done:\n\tmov [output], al\n\tmov al, [num1]\n\tcall print_num\n\tmov al, [num2]\n\tcall print_num\n\tmov al, [output]\n\tcall print_num\nexit:\n\tmov eax, 1\n\tmov ebx, 0\n\tint 0x80\nprint_num:\n\tmov cl, 10\n\tmov esi, numstringend\n\tsub esi, 1\n\tmov [esi], cl\nprint_num_loop:\n\tcmp al, 0\n\tjz print_done\n\tmov ah, 0\n\tdiv cl\n\tsub esi, 1\n\tadd ah, 48\n\tmov [esi], ah\n\tjmp print_num_loop\nprint_done:\n\tmov eax, 4\n\tmov ebx, 1\n\tmov ecx, esi\n\tmov edx, numstringend\n\tsub edx, esi\n\tint 0x80\n\tret\nsection .bss\nnumstring: resb 4\nnumstringend:\noutput: resb 1\nsection .data\nnum1: db 51\nnum2: db 85', { steps: 2000 });
  clean(m); eq(m.state.stdout, '51\n85\n17\n'); eq(m.state.exit, 0);
});
t('x86 flags, jcc, push/pop, sizes', () => {
  const m = x86('_start:\n    mov eax, -1\n    mov bx, 0x1234\n    mov bl, 0\n    push rbx\n    pop rcx\n    cmp rax, 0xFFFFFFFF\n    jne bad\n    mov rdx, 5\n    sub rdx, 7\n    js ok\nbad:\n    mov rdi, 1\n    mov rax, 60\n    syscall\nok:\n    mov rdi, 0\n    mov rax, 60\n    syscall');
  clean(m); eq(m.state.exit, 0); eq(m.state.regs[2], 0x1200n); eq(m.state.regs[0], 60n); eq(m.state.flags.SF, 1);
});
t('x86 read from stdin', () => { const m = x86('section .bss\nbuf: resb 8\nsection .text\n_start:\n    mov rax, 0\n    mov rdi, 0\n    mov rsi, buf\n    mov rdx, 8\n    syscall\n    mov rdx, rax\n    mov rax, 1\n    mov rdi, 1\n    mov rsi, buf\n    syscall\n    mov rax, 60\n    xor rdi, rdi\n    syscall', { stdin: 'hey\n' }); clean(m); eq(m.state.stdout, 'hey\n'); });
t('x86 errors are reported, not thrown', () => { ok(x86('_start:\n    frob rax').steps.some(s => s.hl.err)); ok(x86('_start:\n    mov rax, 1\n    xor rbx, rbx\n    div rbx').steps.some(s => /division by zero/.test(s.d))); ok(x86('_start:\n    mov rax, 60').steps.some(s => /ran past the end/.test(s.d))); });

/* ── memory and I/O ── */
t('endian 12345678', () => { const m = model({ mode: 'endian', value: '12345678', address: '$100' }); clean(m); eq(m.state.big, ['12', '34', '56', '78']); eq(m.state.little, ['78', '56', '34', '12']); renders(m); });
t('memory-chips 16x4 → 64x8', () => { const m = model({ mode: 'memory-chips', chip: '16x4', memory: '64x8', address: 37 }); clean(m); eq([m.state.rows, m.state.cols], [4, 2]); eq(m.state.probe.row, 2); eq(m.state.probe.inChip, 5); renders(m); });
t('memory-chips 256Kx1 → 256Kx8 needs no decoder', () => { const m = model({ mode: 'memory-chips', chip: '256Kx1', memory: '256Kx8' }); clean(m); eq([m.state.rows, m.state.cols], [1, 8]); ok(/no decoder/.test(m.steps[3].d)); });
const trace = '0 4 8 0 16 4 32 0';
t('cache direct-mapped: 2 hits of 8', () => { const m = model({ mode: 'cache', kind: 'direct', lines: 4, block: 4, bits: 8, trace }); clean(m); eq([m.state.hits, m.state.misses], [2, 6]); eq(m.state.log.map(l => l.hit ? 'H' : 'M').join(''), 'MMMHMHMM'); ok(/EAT = 1 × 0.25 \+ 10 × 0.75 = 7.75/.test(last(m))); renders(m); });
t('cache fully associative FIFO and LRU', () => { const f = model({ mode: 'cache', kind: 'full', lines: 4, block: 4, bits: 8, policy: 'fifo', trace }); clean(f); eq(f.state.log.map(l => l.hit ? 'H' : 'M').join(''), 'MMMHMHMM'); eq(f.state.log[7].evicted, 1); const l = model({ mode: 'cache', kind: 'full', lines: 4, block: 4, bits: 8, policy: 'lru', trace: '0 4 8 12 0 16 4' }); clean(l); eq(l.state.log[5].evicted, 1, 'LRU evicts block 1 (address 4): block 0 was just reused'); });
t('cache 2-way set-associative', () => { const m = model({ mode: 'cache', kind: 'set', lines: 4, ways: 2, block: 4, bits: 8, policy: 'lru', trace }); clean(m); eq([m.state.nsets, m.state.ways], [2, 2]); eq([m.state.tb, m.state.ib, m.state.ob], [5, 1, 2]); eq([m.state.hits, m.state.misses], [2, 6]); });
t('cache rejects a bad geometry', () => { ok(model({ mode: 'cache', lines: 3, block: 4, trace: '0' }).steps.some(s => s.hl.err)); });
t('io polling misses a burst and counts polls', () => { const m = model({ mode: 'io', kind: 'polling', rate: 4, events: '3 7 8 15' }); clean(m); eq(m.state.missed, 1); eq(m.state.polls, 6); eq(m.state.latency, [1, 1, 1]); renders(m); });
t('io interrupts service every event', () => { const m = model({ mode: 'io', kind: 'interrupt', events: '3 7 8 15', service: 2 }); clean(m); eq(m.state.latency.length, 4); eq(m.state.rows.cpu.filter(v => v === 'isr').length, 8); });
t('io DMA modes finish in the expected order', () => { const done = mode => { const m = model({ mode: 'io', kind: 'dma', dma: mode, words: 6 }); clean(m); return [m.state.done, m.state.stalls]; }; const [b, bs] = done('block'), [s, ss] = done('stealing'), [i, is] = done('interleaved'); ok(b < s && s < i, `block ${b} < stealing ${s} < interleaved ${i}`); ok(bs > 0 && is === 0, `stalls block ${bs}, interleaved ${is}`); ok(ss <= bs); });

/* ── shell ── */
t('every mode is listed and renders its idle state', () => { const modes = ARCH.modes(); eq(modes.length, 25); for (const mode of modes) { const m = model({ mode, program: '', expr: 'x' }); const r = m.render(0); ok(r !== undefined, mode); } });
t('unknown mode throws', () => { let threw = false; try { model({ mode: 'nope' }); } catch (e) { threw = true; } ok(threw); });
t('scripted ops replace auto', () => { const m = model({ mode: 'convert', value: '13.75', ops: ['convert 5 10 2'] }); clean(m); eq(m.state.result, '101'); });
t('cloned steps keep BigInt registers', () => { const m = x86('_start:\n    mov rax, 0x123456789ABCDEF0\n    mov rdi, 0\n    mov rax, 60\n    syscall'); eq(m.steps[2].state.regs[0], 0x123456789ABCDEF0n); });

/* ── regressions from the first review ── */
t('float: tiny values are not rounded to zero', () => { const a = model({ mode: 'float', value: '1e-13', exp: 8, mant: 23 }); clean(a); eq(a.state.f.kind, 'normal'); ok(Math.abs(a.state.dec.value - 1e-13) / 1e-13 < 1e-6); const b = model({ mode: 'float', value: '3e-40', exp: 8, mant: 23 }); clean(b); eq(b.state.f.kind, 'denormal'); ok(b.state.f.M.indexOf('1') >= 0); });
t('float: rounding that carries past the largest exponent is an overflow', () => { const m = model({ mode: 'float', value: '65520', exp: 5, mant: 10 }); clean(m); eq(m.state.f.kind, 'inf'); ok(/overflow/.test(m.steps.map(x => x.d).join(' '))); const n = model({ mode: 'float', value: '65504', exp: 5, mant: 10 }); clean(n); eq(n.state.f.kind, 'normal'); eq(n.state.dec.value, 65504); });
t('float: a denormal that rounds up becomes the smallest normal', () => { const m = model({ mode: 'float', value: String(Math.pow(2, -14) * (1 - Math.pow(2, -12))), exp: 5, mant: 10 }); clean(m); eq(m.state.f.kind, 'normal'); eq(m.state.f.E, '00001'); eq(m.state.f.M, '0000000000'); });
t('convert 0.6 → base 5 is exactly 0.3 despite double noise', () => { const m = model({ mode: 'convert', value: '0.6', from: 10, to: 5 }); clean(m); eq(m.state.result, '0.3'); eq(m.state.fracExact, true); const r = model({ mode: 'convert', value: '0.3', from: 10, to: 4 }); clean(r); eq(r.state.fracExact, false); ok(/^0\.10303/.test(r.state.result)); });
t('cpu: forward references keep the same size in both passes', () => { const m = run('    LDA foo\n    BNE done\n    INX\ndone: BRK\n    .org $50\nfoo: .byte 1'); ok(!m.state.err, m.state.err); eq(m.state.labels.done, 0x0206); eq(m.state.listing[1].bytes, [0xD0, 0x01]); clean(m); eq(m.state.regs.X, 0); });
t('cpu: labels containing "equ" are labels', () => { const m = run('sequence: LDA #1\n    BRK'); ok(!m.state.err, m.state.err); eq(m.state.regs.A, 1); const e = run('base equ $30\n    LDA base\n    BRK'); ok(!e.state.err, e.state.err); eq(e.state.listing[0].bytes, [0xA5, 0x30]); });
t('x86: a − b − c is left-associative in instructions and data alike', () => { const m = x86('section .data\nb: db 1\nc: db 2\ne: db 3\nn: dq e - b - 1\nsection .text\n_start:\n    mov rax, e - b - 1\n    mov rdi, rax\n    sub rdi, [n]\n    mov rax, 60\n    syscall'); clean(m); eq(m.state.exit, 0); eq(m.state.regs[0], 60n); ok(m.steps.some(st => /rax = 0x1 \(1\)/.test(st.d))); });
t('x86: an absurd write length is an error, not a hang', () => { const m = x86('_start:\n    mov rax, 1\n    mov rdi, 1\n    mov rsi, 0x402000\n    mov rdx, -1\n    syscall'); ok(m.steps.some(st => st.hl.err && /length register/.test(st.d))); });
t('scripted ops keep bit strings intact', () => { const m = model({ mode: 'adder', ops: ['add 0110 0011 0'] }); clean(m); eq(m.state.res.sum, '1001'); const p = model({ mode: 'parity', ops: ['send 0110 even'] }); clean(p); eq(p.state.rows[0].bits, '0110'); });
t('timing: RS latch notes the race after S=R=1', () => { const m = model({ mode: 'timing', device: 'rs-latch', signals: { S: '0110', R: '0010' } }); clean(m); ok(/race/.test(m.state.notes[3])); });
t('multiply: Booth render survives a refused operand', () => { const m = model({ mode: 'multiply', a: -8, b: 3, bits: 4, algo: 'booth' }); const h = m.render(); ok(!/undefined/.test(h)); });

console.log(`${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
