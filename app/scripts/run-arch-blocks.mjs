// Runs every ```sim block with `engine: arch` of the given unit files through the engine (no DOM) and
// prints each block's id, its step descriptions and the text of its final render, so the examples of a
// unit can be read against what the stepper really shows. Exits 1 if any block ends in an error step.
// Run from app/: node scripts/run-arch-blocks.mjs ../content/universities/concordia/units/COMP228/*.md
// Set V=0 to print only the last step of each block.
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import YAML from 'yaml';

const src = readFileSync(new URL('../src/sims/arch.js', import.meta.url), 'utf8');
const sandbox = { window: {}, console, module: { exports: {} }, TextEncoder };
vm.runInNewContext(src, sandbox);
const ARCH = sandbox.window.ARCH;
const verbose = process.env.V !== '0';
const strip = h => String(h || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

let blocks = 0, bad = 0;
for (const file of process.argv.slice(2)) {
  const text = readFileSync(file, 'utf8');
  const re = /^```sim\n([\s\S]*?)^```/gm; let m;
  while ((m = re.exec(text))) {
    let cfg;
    try { cfg = YAML.parse(m[1]); } catch (e) { console.log(`\n### ${file}: sim block is not valid YAML: ${e.message}`); bad++; continue; }
    if (cfg.engine !== 'arch') continue;
    blocks++;
    let model;
    try { model = ARCH.model(cfg); } catch (e) { console.log(`\n### ${cfg.id}: THREW ${e.message}`); bad++; continue; }
    const steps = model.steps.slice(1);
    const errs = steps.filter(s => s.hl && s.hl.err);
    console.log(`\n### ${cfg.id} [${cfg.mode}] ${steps.length} step${steps.length === 1 ? '' : 's'}${errs.length ? ' — ' + errs.length + ' ERROR step(s)' : ''}`);
    for (const s of verbose ? steps : steps.slice(-1)) console.log('  - ' + s.d);
    const r = model.render();
    const html = typeof r === 'string' ? r : r.html + ' ' + (r.side || '');
    console.log('  [render] ' + strip(html).slice(0, 240));
    if (errs.length) bad++;
  }
}
console.log(`\n${blocks} arch block(s), ${bad} problem(s)`);
process.exit(bad ? 1 : 0);
