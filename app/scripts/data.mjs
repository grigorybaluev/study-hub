// Runs the Python pipeline and copies graph.json + derived.json into public/data/.
// Uses the repo's .venv if present so the app never runs against stale data.
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..", "..");
const python = existsSync(resolve(root, ".venv/bin/python")) ? resolve(root, ".venv/bin/python") : "python3";
const run = (script) => execFileSync(python, [resolve(root, script)], { cwd: root, stdio: "inherit" });

run("build/lint.py");
run("build/build_graph.py");
run("build/derive.py");

const out = resolve(import.meta.dirname, "..", "public", "data");
mkdirSync(out, { recursive: true });
for (const f of ["graph.json", "derived.json"]) copyFileSync(resolve(root, f), resolve(out, f));
console.log("copied graph.json, derived.json -> app/public/data/");
