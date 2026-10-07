// Runs the Python pipeline and copies graph.json + derived.json into public/data/.
// Uses the repo's .venv if present so the app never runs against stale data.
// Unit bodies (about half of graph.json) move to one file per course, data/units/<university>/<CODE>.json
// ({unit id: markdown}), which the unit page fetches on demand (#189); the app's graph.json has none.
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..", "..");
const python = existsSync(resolve(root, ".venv/bin/python")) ? resolve(root, ".venv/bin/python") : "python3";
const run = (script) => execFileSync(python, [resolve(root, script)], { cwd: root, stdio: "inherit" });

run("build/lint.py");
run("build/build_graph.py");
run("build/derive.py");

const out = resolve(import.meta.dirname, "..", "public", "data");
mkdirSync(out, { recursive: true });
copyFileSync(resolve(root, "derived.json"), resolve(out, "derived.json"));

const graph = JSON.parse(readFileSync(resolve(root, "graph.json"), "utf8"));
const bodies = new Map();
for (const n of graph.nodes) {
  if (n.type !== "unit") continue;
  if (!bodies.has(n.course)) bodies.set(n.course, {});
  bodies.get(n.course)[n.id] = n.body;
  delete n.body;
}
writeFileSync(resolve(out, "graph.json"), JSON.stringify(graph));

rmSync(resolve(out, "units"), { recursive: true, force: true });
for (const [course, units] of bodies) {
  const file = resolve(out, "units", `${course}.json`);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(units));
}
console.log(`copied graph.json (unit bodies split into ${bodies.size} course files), derived.json -> app/public/data/`);
