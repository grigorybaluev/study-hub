// Runs every ```sim block with `engine: java` of the given unit files through the interpreter (no DOM)
// and prints each program's output, its ending (ok / exception / compile error) and the final file
// system, so the examples of a unit can be read against what Java would print.
// Run from app/: node scripts/run-unit-sims.mjs ../content/universities/concordia/units/COMP249/*.md
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import YAML from 'yaml';

const src = readFileSync(new URL('../src/sims/java.js', import.meta.url), 'utf8');
const sandbox = { window: {}, console, performance, module: { exports: {} } };
vm.runInNewContext(src, sandbox);
const JAVA = sandbox.window.JAVA;

let internal = 0;
for (const f of process.argv.slice(2)) {
  const text = readFileSync(f, 'utf8');
  const re = /^```sim\n([\s\S]*?)^```/gm;
  let m;
  while ((m = re.exec(text))) {
    const cfg = YAML.parse(m[1]);
    if (cfg.engine !== 'java') continue;
    const r = JAVA.run(cfg.code, cfg.stdin || '', { maxSteps: cfg.maxSteps || 5000, files: cfg.files || {} });
    const tag = r.error ? `${r.error.kind.toUpperCase()} ${r.error.name || ''} (line ${r.error.line}): ${r.error.message}` : 'ok';
    console.log(`\n### ${cfg.id}  [${r.trace.length} steps, ${tag}]`);
    process.stdout.write(r.out.split('\n').map(l => '  | ' + l).join('\n') + '\n');
    if (r.files) {
      const last = r.files[Math.max(...Object.keys(r.files).map(Number))];
      for (const [name, body] of Object.entries(last)) console.log(`  [file ${name}] ${JSON.stringify(body)}`);
    }
    if (r.error && r.error.name === 'InternalError') internal++;
  }
}
if (internal) { console.log(`\n${internal} internal error(s) — the interpreter itself failed`); process.exit(1); }
