// Runs the Python pipeline and copies graph.json, cards.json and derived.json into public/data/.
// Uses the repo's .venv if present so the app never runs against stale data.
// Unit bodies (about half of graph.json) move to one file per course, data/units/<university>/<CODE>.json
// ({unit id: markdown}), which the unit page fetches on demand (#189); the app's graph.json has none.
// Likewise each exam prep (#255) moves to data/prep/<university>/<CODE>/<exam>.json; graph.json keeps an
// index entry (id, course, exam, date, title, summary and which sections it has).
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..", "..");
const python = existsSync(resolve(root, ".venv/bin/python")) ? resolve(root, ".venv/bin/python") : "python3";
const run = (script) => execFileSync(python, [resolve(root, script)], { cwd: root, stdio: "inherit" });

run("build/lint.py");
run("build/build_graph.py");
run("build/build_cards.py");
run("build/derive.py");

const out = resolve(import.meta.dirname, "..", "public", "data");
mkdirSync(out, { recursive: true });
copyFileSync(resolve(root, "derived.json"), resolve(out, "derived.json"));
copyFileSync(resolve(root, "cards.json"), resolve(out, "cards.json"));

const graph = JSON.parse(readFileSync(resolve(root, "graph.json"), "utf8"));
const bodies = new Map();
for (const n of graph.nodes) {
  if (n.type !== "unit") continue;
  if (!bodies.has(n.course)) bodies.set(n.course, {});
  bodies.get(n.course)[n.id] = n.body;
  delete n.body;
}
rmSync(resolve(out, "prep"), { recursive: true, force: true });
graph.preps = (graph.preps ?? []).map((p) => {
  const file = resolve(out, "prep", `${p.id}.json`);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(p));
  const sections = [p.overview && "overview", p.types.length && "types", p.table && "table", p.maps.length && "map", p.plan.length && "plan"];
  return { id: p.id, course: p.course, exam: p.exam, date: p.date, title: p.title, summary: p.summary, sections: sections.filter(Boolean) };
});
writeFileSync(resolve(out, "graph.json"), JSON.stringify(graph));

rmSync(resolve(out, "units"), { recursive: true, force: true });
for (const [course, units] of bodies) {
  const file = resolve(out, "units", `${course}.json`);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(units));
}
console.log(`copied graph.json (unit bodies split into ${bodies.size} course files, ${graph.preps.length} prep(s) into their own), cards.json, derived.json -> app/public/data/`);
