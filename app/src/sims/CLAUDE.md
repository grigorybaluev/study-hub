# app/src/sims — the simulation engines

Interactive examples in unit bodies are ```` ```sim ```` fenced YAML blocks. `Markdown.tsx`
parses the block and renders `<Sim cfg>`; `Sim.tsx` gives it an empty `#sim-<id>` host and
calls `window.runSim(id, cfg)` (defined in `simulations.js`), which either draws a Plotly
figure (`id` in the `SIMS` table) or, for `custom: true`, hands the block to the engine named by
`engine` (default `automata`). `registry.yaml` lists every Plotly id and every engine's modes;
`build/lint.py` checks each block against it (missing `mode` defaults to `run`).

## Engines

| engine | file | global | block shape |
|---|---|---|---|
| plotly | `simulations.js` | `runSim` | `id` from the SIMS table, `controls:` sliders, `note` |
| automata | `automata.js` | `FA` | `custom: true`, `mode: run \| convert \| minimize \| derive \| tool \| graph \| proofs`, machine keys |
| java | `java.js` | `JAVA` | `engine: java`, `code:` (snippet or compilation unit), `stdin:`, `files:` |
| ds | `ds.js` | `DS` | `engine: ds`, `mode:` (stack … graph), `data`, `ops`, mode keys |
| db | `db.js` | `DB` | `engine: db`, `mode:` (sql, ra, fd-closure, …), `tables`, `ops` |
| arch | `arch.js` | `ARCH` | `engine: arch`, `mode:` (25 modes), keys named after the mode's controls |

Every engine but `db` is an IIFE that sets `window.<NAME>` and `module.exports`, so it loads in
node through `vm.runInNewContext` with `{ window: {}, console, module: { exports: {} } }`
(`arch` also needs `TextEncoder`). `db.js` is an ES module because it lazy-imports `sql.js` and
its wasm (`?url`); tests `import` it and inject the node build with `DB.useSql`.

## The stepper pattern (ds, db, arch)

- `MODES[name] = { title, init(cfg) → JSON state, controls, ops: { *op(state, args, cfg, values) },
  render(state, step) → html | { html|svg, side } }`. An op is a generator that mutates the state
  and `yield`s `{ d: description, hl? }`; `hl.err` marks a failure step.
- The `Viewer` shell snapshots the state after every yield (`clone` = JSON round trip; `arch`'s
  clone also carries BigInt), so ◀ Back / Step ▶ replay without re-running. State must stay
  JSON-safe: `Infinity`/`NaN` become `null` — keep a text field computed in the op instead.
- Scripted `ops:` in the block run on load. In `arch`, a block with no `ops` runs `mode.auto`
  with the block's keys (the keys share the toolbar control names, so ⟲ Reset restores them);
  `mode.setup(cfg, state)` may build per-block controls (`circuit`: one toggle per input).
- Sparse memory: keep memories as `{ addr: byte }` objects, never 64 K arrays (every step is
  cloned).
- CSS is per engine, prefixed (`.ds-`, `.db-`, `.arch-`), light-on-white; buttons reuse
  `.fa-btn` / `.fa-secondary` from `automata.css`. `Sim.tsx` side-imports each engine's js and
  css; adding an engine touches `Sim.tsx` (three lines), `simulations.js` (the dispatch
  ternary), `registry.yaml`, and the root `CLAUDE.md` layout line.

## Testing (run from `app/`, node 24 via nvm — the Homebrew node is broken)

- `node scripts/test-java.mjs`, `test-ds.mjs`, `test-db.mjs` (and `test-arch.mjs` once added):
  pure fixtures through `<ENGINE>.model(cfg)` → `{ state, steps, run(name, args), render(k) }`.
  CI does not run them; run them by hand before a PR.
- `node scripts/run-unit-sims.mjs <unit.md …>` runs every java block of the units and prints
  the output; do the same for ds/db/arch blocks with a throwaway driver over `model()` and read
  every block's `note` against the actual steps.
- Browser: `npm run build`, `vite preview`, then headless Firefox over WebDriver BiDi
  (`/Applications/Firefox.app/Contents/MacOS/firefox --headless --remote-debugging-port N`):
  count `.sim-box` against mounted engines, and fail on `log.entryAdded` errors and
  `.katex-error`. No Chrome or Playwright on this machine.

## Conventions for blocks in units

- `id: <engine>-<course>-<slug>`; lint checks engine/mode, not the id.
- `note` is plain text, quoted (no markdown or backticks; YAML chokes on `: ` and a leading
  backtick). Say in the note when an example ends in an error or exception on purpose.
- Programs (`code`, `program`) use a block scalar (`|`); tabs are fine for NASM.
- Own words and own examples only; the engines reproduce course computations, not slide text.
