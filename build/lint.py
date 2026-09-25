"""Validate content/. Run before every commit.

Errors make the graph wrong and exit 1. Warnings are curriculum findings or hygiene and
exit 0. The rules are numbered to match the design discussion; see CLAUDE.md.
"""
from __future__ import annotations

import re
import sys
from collections import Counter
from pathlib import Path

import yaml

from schema import (BLOCKS, CODE_RE, ROOT, COURSE_KIND, PAGE_KINDS, DOMAINS, OPTIONAL, REQUIRED, SEASONS, SIM_CHECKS, SLUG_RE, STRENGTH, METHOD_NODE_KINDS,
                    UNIT_KIND, UNIT_REVIEW, UNIT_STATUS, WIKIDATA_RE, Content, Doc, edge_entries, load, prereq_groups,
                    roadmap_node_ids, roadmap_root, unit_slug, answer_label)


class Report:
    def __init__(self):
        self.errors: list[str] = []
        self.warnings: list[str] = []

    def error(self, where, msg):
        self.errors.append(f"{_rel(where)}: {msg}")

    def warn(self, where, msg):
        self.warnings.append(f"{_rel(where)}: {msg}")


def _rel(where) -> str:
    if isinstance(where, Path):
        try:
            return str(where.relative_to(Path.cwd()))
        except ValueError:
            return str(where)
    return str(where)


# --------------------------------------------------------------------------- structure (1-3)
def check_fields(doc: Doc, kind: str, rep: Report):
    missing = REQUIRED[kind] - doc.meta.keys()
    if missing:
        rep.error(doc.path, f"missing required field(s): {', '.join(sorted(missing))}")
    unknown = doc.meta.keys() - REQUIRED[kind] - OPTIONAL[kind]
    if unknown:
        rep.warn(doc.path, f"unknown field(s): {', '.join(sorted(unknown))}")


def check_enum(doc: Doc, key: str, allowed: set, rep: Report, default=None):
    value = doc.meta.get(key, default)
    if value is not None and value not in allowed:
        rep.error(doc.path, f"{key}: {value!r} not in {sorted(allowed)}")


def lint_roadmaps(c: Content, rep: Report) -> set[str]:
    """Return the set of valid maps_to targets."""
    targets: set[str] = set()
    for rid, data in c.roadmaps.items():
        path = Path("content/roadmaps") / f"{rid}.yaml"
        for key in ("id", "title", "areas"):
            if key not in data:
                rep.error(path, f"missing required field {key!r}")
        if data.get("id") != rid:
            rep.error(path, f"id {data.get('id')!r} does not match filename")
        seen = Counter()
        for area in data.get("areas") or []:
            for node in [area] + (area.get("skills") or []):
                nid = node.get("id")
                if not nid or not SLUG_RE.match(nid):
                    rep.error(path, f"node id {nid!r} is not a slug")
                if not node.get("title"):
                    rep.error(path, f"node {nid!r} has no title")
                seen[nid] += 1
        for nid, n in seen.items():
            if n > 1:
                rep.error(path, f"node id {nid!r} used {n} times (ids are unique across areas and skills)")
        targets |= roadmap_node_ids(data, rid)
    return targets


def lint_concepts(c: Content, rep: Report, roadmap_targets: set[str] = frozenset()):
    # display names must be unique: a short may not repeat another short or another
    # concept's title, since views label a concept by `short ?? title`
    names: dict[str, str] = {str(d.meta.get("title", "")).strip().lower(): s for s, d in c.concepts.items()}
    for slug, doc in c.concepts.items():
        check_fields(doc, "concept", rep)
        if not SLUG_RE.match(slug):
            rep.error(doc.path, f"filename {slug!r} is not a slug")
        check_enum(doc, "domain", DOMAINS, rep)
        for key in ("short", "wikipedia"):
            value = doc.meta.get(key)
            if value is not None and (not isinstance(value, str) or not value.strip()):
                rep.error(doc.path, f"{key}: must be a non-empty string")
            elif value is not None and value != value.strip():
                rep.error(doc.path, f"{key}: has leading or trailing whitespace")
        short = doc.meta.get("short")
        if isinstance(short, str) and short.strip():
            other = names.setdefault(short.strip().lower(), slug)
            if other != slug:
                rep.error(doc.path, f"short {short!r} already used as a name by concept {other!r}")
        wikidata = doc.meta.get("wikidata")
        if wikidata is not None and not (isinstance(wikidata, str) and WIKIDATA_RE.match(wikidata)):
            rep.error(doc.path, f"wikidata: {wikidata!r} is not a Q-id")
        for key in ("generalizes", "part_of"):
            for target in doc.meta.get(key) or []:
                if target not in c.concepts:
                    rep.error(doc.path, f"{key}: unknown concept {target!r}")
                elif target == slug:
                    rep.error(doc.path, f"{key}: concept refers to itself")
        for target in doc.meta.get("maps_to") or []:
            if target not in roadmap_targets:
                rep.error(doc.path, f"maps_to: unknown roadmap node {target!r}")
        if not doc.body:
            rep.warn(doc.path, "empty definition")


# --------------------------------------------------------------------------- references (4-11)
def lint_university(c: Content, uni, rep: Report):
    courses = uni.courses
    for code, doc in courses.items():
        check_fields(doc, "course", rep)
        if not CODE_RE.match(code):
            rep.error(doc.path, f"filename {code!r} is not a course code")
        if doc.meta.get("code") != code:
            rep.error(doc.path, f"code {doc.meta.get('code')!r} does not match filename")
        check_enum(doc, "kind", COURSE_KIND, rep)
        check_enum(doc, "pages", PAGE_KINDS, rep)
        for key in ("prereqs", "coreqs"):
            groups = prereq_groups(doc.meta.get(key)) if key == "prereqs" else [[x] for x in doc.meta.get(key) or []]
            for group in groups:
                for target in group:
                    if target not in courses:
                        rep.error(doc.path, f"{key}: unknown course {target!r}")
                    elif target == code:
                        rep.error(doc.path, f"{key}: course refers to itself")

    for code in uni.meta.get("assumed_prior") or []:
        if code not in courses:
            rep.error(uni.path / "university.yaml", f"assumed_prior: unknown course {code!r}")

    # units
    for code, docs in uni.units.items():
        cdir = uni.path / "units" / code
        if code not in courses:
            rep.error(cdir, "unit directory has no matching course")
            continue
        if courses[code].meta.get("kind") == "external":
            rep.error(cdir, "external course must not have units")
        orders = Counter()
        for doc in docs:
            lint_unit(c, doc, rep)
            lint_unit_structure(doc, courses[code].meta.get("pages"), rep)
            orders[doc.meta.get("order")] += 1
        n = len(docs)
        expected = set(range(1, n + 1))
        if set(orders) != expected or any(v > 1 for v in orders.values()):
            rep.error(cdir, f"unit orders must be exactly 1..{n}; got {sorted(k for k in orders if k is not None)}")

    # programs
    core = {code for code, d in courses.items() if d.meta.get("kind") == "core"}
    for pid, prog in uni.programs.items():
        ppath = uni.path / "programs" / f"{pid}.yaml"
        for key in REQUIRED["program"]:
            if key not in prog:
                rep.error(ppath, f"missing required field {key!r}")
        for variant in prog.get("variants") or []:
            lint_variant(uni, variant, core, ppath, rep)


SIM_BLOCK_RE = re.compile(r"^```sim\n(.*?)^```", re.M | re.S)


def sim_counts(body: str) -> dict:
    """Per-unit tally of sim blocks and their `verified:` checks (blocks that do not parse are skipped)."""
    n = {"total": 0, **{c: 0 for c in SIM_CHECKS}, "verified": 0}
    for m in SIM_BLOCK_RE.finditer(body):
        try:
            cfg = yaml.safe_load(m.group(1))
        except yaml.YAMLError:
            continue
        if not isinstance(cfg, dict):
            continue
        done = cfg.get("verified") if isinstance(cfg.get("verified"), list) else []
        n["total"] += 1
        for c in SIM_CHECKS:
            n[c] += c in done
        n["verified"] += all(c in done for c in SIM_CHECKS)
    return n


def load_sim_registry() -> dict | None:
    p = ROOT / "app" / "src" / "sims" / "registry.yaml"
    return yaml.safe_load(p.read_text(encoding="utf-8")) if p.exists() else None


def lint_sim_blocks(doc: Doc, registry: dict | None, rep: Report):
    for m in SIM_BLOCK_RE.finditer(doc.body):
        try:
            cfg = yaml.safe_load(m.group(1))
        except yaml.YAMLError as e:
            rep.error(doc.path, f"sim block is not valid YAML: {e}")
            continue
        if not isinstance(cfg, dict) or not cfg.get("id"):
            rep.error(doc.path, "sim block needs an `id`")
            continue
        verified = cfg.get("verified", [])
        if not (isinstance(verified, list) and all(v in SIM_CHECKS for v in verified)):
            rep.error(doc.path, f"sim {cfg['id']!r}: verified must be a list of {list(SIM_CHECKS)}, got {verified!r}")
        if registry is None:
            rep.warn(doc.path, f"sim {cfg['id']!r}: no registry (app/src/sims/registry.yaml) to check against")
        elif cfg.get("custom"):
            engine = cfg.get("engine", "automata")
            if engine == "plotly" or engine not in registry:
                rep.error(doc.path, f"sim {cfg['id']!r}: unknown engine {engine!r}")
                continue
            modes = registry.get(engine, {}).get("modes") or []
            if cfg.get("mode", "run") not in modes:
                rep.error(doc.path, f"sim {cfg['id']!r}: {engine} mode {cfg.get('mode')!r} not in {modes}")
            if engine == "java" and not isinstance(cfg.get("code"), str):
                rep.error(doc.path, f"sim {cfg['id']!r}: java block needs a `code` string")
            if engine == "java" and "files" in cfg and not (
                isinstance(cfg["files"], dict) and all(isinstance(k, str) and isinstance(v, str) for k, v in cfg["files"].items())
            ):
                rep.error(doc.path, f"sim {cfg['id']!r}: java `files` must map file names to text")
        elif cfg["id"] not in (registry.get("plotly") or []):
            rep.error(doc.path, f"sim {cfg['id']!r} is not in the registry")


# --------------------------------------------------------------------------- method graphs and solution maps (#91)
SOLMAP_BLOCK_RE = re.compile(r"^```solution-map\n(.*?)^```", re.M | re.S)


def lint_methods(c: Content, rep: Report):
    """content/methods/<id>.yaml: a flowchart of how to choose a method. Nodes are decisions
    (their outgoing edges are the answers), methods, and ends; `start` names the entry node."""
    for mid, g in c.methods.items():
        where = f"content/methods/{mid}.yaml"
        if not SLUG_RE.match(mid):
            rep.error(where, "file name must be a slug")
        if g.get("id", mid) != mid:
            rep.error(where, f"id {g.get('id')!r} must match the file name")
        if not isinstance(g.get("title"), str):
            rep.error(where, "needs a `title`")
        nodes, edges = g.get("nodes"), g.get("edges")
        if not isinstance(nodes, list) or not nodes or not isinstance(edges, list):
            rep.error(where, "needs non-empty `nodes` and an `edges` list")
            continue
        kinds: dict[str, str] = {}
        for n in nodes:
            if not isinstance(n, dict) or not isinstance(n.get("id"), str) or not SLUG_RE.match(n["id"]):
                rep.error(where, f"node {n!r} needs a slug `id`")
                continue
            if n["id"] in kinds:
                rep.error(where, f"duplicate node {n['id']!r}")
            if n.get("kind") not in METHOD_NODE_KINDS:
                rep.error(where, f"node {n['id']!r}: kind must be one of {sorted(METHOD_NODE_KINDS)}")
            if not isinstance(n.get("label"), str) or not n["label"].strip():
                rep.error(where, f"node {n['id']!r} needs a `label`")
            if n.get("concept") is not None and n["concept"] not in c.concepts:
                rep.error(where, f"node {n['id']!r}: concept {n['concept']!r} does not exist")
            kinds[n["id"]] = n.get("kind")
        out: dict[str, list[dict]] = {k: [] for k in kinds}
        for e in edges:
            if not isinstance(e, dict) or not isinstance(e.get("from"), str) or not isinstance(e.get("to"), str) \
                    or e["from"] not in kinds or e["to"] not in kinds:
                rep.error(where, f"edge {e!r}: `from` and `to` must be nodes of this graph")
                continue
            out[e["from"]].append(e)
        start = g.get("start")
        if not isinstance(start, str) or start not in kinds:
            rep.error(where, f"`start` {start!r} must name a node")
            continue
        for nid, kind in kinds.items():
            labels = [answer_label(e.get("label")) for e in out[nid]]
            if kind == "decision":
                if len(out[nid]) < 2:
                    rep.error(where, f"decision {nid!r} needs at least two answers (outgoing edges)")
                if not all(isinstance(l, str) and l for l in labels) or len(set(labels)) != len(labels):
                    rep.error(where, f"decision {nid!r}: every outgoing edge needs a distinct `label` (the answer)")
            elif kind == "end" and out[nid]:
                rep.error(where, f"end node {nid!r} has outgoing edges")
            elif kind == "method" and not out[nid]:
                rep.error(where, f"method {nid!r} leads nowhere; point it at an end or a next decision")
        seen, todo = {start}, [start]
        while todo:
            for e in out[todo.pop()]:
                if e["to"] not in seen:
                    seen.add(e["to"])
                    todo.append(e["to"])
        for nid in kinds:
            if nid not in seen:
                rep.warn(where, f"node {nid!r} cannot be reached from start")


def lint_solution_maps(c: Content, body: str, where, rep: Report):
    """A ```solution-map block walks its method graph: first step at `start`, each next step along
    an edge (a decision step names the edge's answer), last step at an end node."""
    for m in SOLMAP_BLOCK_RE.finditer(body):
        try:
            cfg = yaml.safe_load(m.group(1))
        except yaml.YAMLError as e:
            rep.error(where, f"solution-map block is not valid YAML: {e}")
            continue
        if not isinstance(cfg, dict) or not cfg.get("id"):
            rep.error(where, "solution-map block needs an `id`")
            continue
        name = f"solution-map {cfg['id']!r}"
        verified = cfg.get("verified", [])
        if not (isinstance(verified, list) and all(v in SIM_CHECKS for v in verified)):
            rep.error(where, f"{name}: verified must be a list of {list(SIM_CHECKS)}")
        g = c.methods.get(cfg["method"]) if isinstance(cfg.get("method"), str) else None
        if g is None:
            rep.error(where, f"{name}: method {cfg.get('method')!r} is not in content/methods/")
            continue
        if not isinstance(cfg.get("task"), str):
            rep.error(where, f"{name}: needs a `task`")
        steps = cfg.get("steps")
        if not isinstance(steps, list) or not steps or not all(isinstance(s, dict) for s in steps):
            rep.error(where, f"{name}: needs a non-empty `steps` list")
            continue
        kinds = {n["id"]: n.get("kind") for n in g.get("nodes") or [] if isinstance(n, dict) and "id" in n}
        edges = [e for e in g.get("edges") or [] if isinstance(e, dict)]
        for st in steps:
            if not isinstance(st.get("node"), str):
                st["node"] = repr(st.get("node"))      # reported below as not in the graph
        for i, st in enumerate(steps, 1):
            if st.get("node") not in kinds:
                rep.error(where, f"{name} step {i}: node {st.get('node')!r} is not in method {g.get('id')!r}")
            if not isinstance(st.get("text"), str) or not st["text"].strip():
                rep.error(where, f"{name} step {i}: needs `text`")
        if any(st.get("node") not in kinds for st in steps):
            continue
        if steps[0]["node"] != g.get("start"):
            rep.error(where, f"{name}: the first step must be at the start node {g.get('start')!r}")
        for i, (a, b) in enumerate(zip(steps, steps[1:]), 1):
            cand = [e for e in edges if e.get("from") == a["node"] and e.get("to") == b["node"]]
            if kinds[a["node"]] == "decision":
                cand = [e for e in cand if answer_label(e.get("label")) == answer_label(a.get("answer"))]
                if not cand:
                    rep.error(where, f"{name} step {i}: decision {a['node']!r} has no answer {answer_label(a.get('answer'))!r} leading to {b['node']!r}")
            elif not cand:
                rep.error(where, f"{name} step {i}: no edge {a['node']!r} -> {b['node']!r}")
        if kinds[steps[-1]["node"]] != "end":
            rep.error(where, f"{name}: the last step must be at an end node")


FENCE_RE = re.compile(r"^```.*?^```", re.M | re.S)
QUOTE_RE = re.compile(r"^[ \t]*(?:>[ \t]?)*[ \t]*")        # list indent / blockquote markers before a fence
OPEN_RE = re.compile(r"^(:{3,})([A-Za-z][\w-]*)(\[.*\])?(\{.*\})?\s*$")


def blank_fences(body: str) -> str:
    """Code blocks out of the way, line numbers kept."""
    return FENCE_RE.sub(lambda m: "\n" * m.group(0).count("\n"), body)
LEGACY_CALLOUT_RE = re.compile(r"^> \*\*[A-Z]", re.M)


def container_problems(body: str) -> list[str]:
    """Container fences: known names, the form remark-directive accepts (`:::name`, `[title]`,
    `{attrs}`, nothing else), balanced, and a nested container with fewer colons than its parent
    (otherwise the parent closes early and a stray ::: shows on the page)."""
    stack: list[tuple[int, int]] = []   # (colons, line)
    problems = []
    for n, raw in enumerate(blank_fences(body).split("\n"), 1):
        line = QUOTE_RE.sub("", raw, count=1)
        if not line.startswith(":::"):
            continue
        colons = len(line) - len(line.lstrip(":"))
        rest = line[colons:].strip()
        if not rest:
            if not stack:
                problems.append(f"body line {n}: closing {':' * colons} with no open container")
            else:
                if colons != stack[-1][0]:
                    problems.append(f"body line {n}: {':' * colons} closes the container opened with {stack[-1][0]} colons on line {stack[-1][1]}")
                stack.pop()
            continue
        m = OPEN_RE.match(line)
        if not m:
            problems.append(f"body line {n}: {line.strip()!r} does not open a block (write :::name or :::name[Title])")
            continue
        name = m.group(2)
        if name not in BLOCKS:
            problems.append(f"body line {n}: unknown container :::{name} (known: {', '.join(sorted(BLOCKS))})")
        if stack and colons >= stack[-1][0]:
            problems.append(f"body line {n}: nested :::{name} needs fewer colons than its parent (line {stack[-1][1]})")
        stack.append((colons, n))
    problems += [f"body line {line}: container is never closed" for _, line in stack]
    return problems


# machine ids of the automata engine's library, for ```automaton blocks that name one
_FA_JS = ROOT / "app" / "src" / "sims" / "automata.js"
FA_MACHINES = set(re.findall(r"def\(\{ id: '([\w-]+)'", _FA_JS.read_text(encoding="utf-8"))) if _FA_JS.exists() else set()


def code_fences(body: str):
    """(line, language, language of the previous fence if only blank lines separate them) per opening fence."""
    out, open_lang, open_len, prev, prev_end = [], None, 0, None, -1
    lines = body.split("\n")
    for n, text in enumerate(lines):
        m = re.match(r"^(`{3,})\s*([\w-]*)\s*$", text)
        if not m:
            continue
        if open_lang is None:
            adjacent = prev_end >= 0 and all(not l.strip() for l in lines[prev_end + 1:n])
            out.append((n + 1, m.group(2), prev if adjacent else None))
            open_lang, open_len = m.group(2), len(m.group(1))
        elif not m.group(2) and len(m.group(1)) >= open_len:   # a closing fence is at least as long, with no language
            prev, prev_end, open_lang = open_lang, n, None
    return out


def lint_unit_structure(doc: Doc, pages: str | None, rep: Report):
    """Unit-page design (#89): container names always; for a designed kind, what is left to convert."""
    body = blank_fences(doc.body)
    for problem in container_problems(doc.body):
        rep.error(doc.path, problem)
    for m in re.finditer(r"^```automaton\n(.*?)^```", doc.body, re.M | re.S):   # static diagrams (#111)
        try:
            spec = yaml.safe_load(m.group(1))
        except yaml.YAMLError as e:
            rep.error(doc.path, f"automaton block is not valid YAML: {e}")
            continue
        if not isinstance(spec, dict) or not (spec.get("machine") or (spec.get("states") and spec.get("trans"))):
            rep.error(doc.path, "automaton block needs `machine: <id>` or inline `states` and `trans`")
        elif spec.get("machine") and spec["machine"] not in FA_MACHINES:
            rep.error(doc.path, f"automaton block: unknown machine {spec['machine']!r} (not defined in app/src/sims/automata.js)")
    fences = code_fences(doc.body)
    for k, (line, lang, prev) in enumerate(fences):
        sim_code = k > 0 and fences[k - 1][2] == "sim"   # the code before it is a sim's code: collapsed, so no pre to attach to
        if lang == "output" and (prev is None or prev in ("sim", "automaton", "solution-map", "output") or sim_code):
            rep.warn(doc.path, f"body line {line}: an output block must come right after the code block it belongs to"
                     + (" (not after a sim's collapsed code)" if sim_code else ""))
        if pages == "programming" and not lang:   # every fence names its language (#131)
            rep.warn(doc.path, f"body line {line}: code fence without a language")
    if pages not in ("math", "theory", "programming"):   # theory inherits the math design (#111); programming (#131)
        return
    legacy = len(LEGACY_CALLOUT_RE.findall(body))
    if legacy:
        rep.warn(doc.path, f"{legacy} blockquote callout(s) left: convert with scripts/convert_callouts.py")
    if re.search(r"^#{4,} ", body, re.M):
        rep.warn(doc.path, "headings deeper than ### (a unit has parts ## and sub-parts ### only)")


def lint_unit(c: Content, doc: Doc, rep: Report):
    slug = unit_slug(doc)
    check_fields(doc, "unit", rep)
    if not SLUG_RE.match(slug):
        rep.error(doc.path, f"filename {slug!r} is not a slug")
    check_enum(doc, "status", UNIT_STATUS, rep)
    check_enum(doc, "kind", UNIT_KIND, rep, default="teaching")
    check_enum(doc, "review", UNIT_REVIEW, rep, default="draft")
    if not isinstance(doc.meta.get("order"), int):
        rep.error(doc.path, "order must be an integer")
    weeks = doc.meta.get("weeks")
    if weeks is not None and not (isinstance(weeks, list) and all(isinstance(w, int) for w in weeks)):
        rep.warn(doc.path, "weeks should be a list of integers")
    if "textbook" in doc.meta and not doc.meta["textbook"]:
        rep.warn(doc.path, "textbook is empty")

    seen: dict[str, set] = {}
    for key in ("introduces", "requires", "reinforces"):
        for entry in edge_entries(doc.meta.get(key)):
            concept = entry["concept"]
            if concept is None:
                rep.error(doc.path, f"{key}: malformed entry {entry['raw']!r}")
                continue
            if concept not in c.concepts:
                rep.error(doc.path, f"{key}: unknown concept {concept!r}")
            if key == "requires":
                strength = entry.get("strength", "hard")
                if strength not in STRENGTH:
                    rep.error(doc.path, f"requires {concept}: strength {strength!r} not in {sorted(STRENGTH)}")
            if concept in seen.setdefault(key, set()):
                rep.error(doc.path, f"{key}: {concept!r} listed twice")
            seen[key].add(concept)
    both = seen.get("introduces", set()) & seen.get("requires", set())
    if both:
        rep.error(doc.path, f"cannot both introduce and require: {', '.join(sorted(both))}")

    if doc.meta.get("kind") == "review":
        if seen.get("introduces"):
            rep.error(doc.path, "review unit must not introduce concepts")
        if not seen.get("reinforces"):
            rep.error(doc.path, "review unit must reinforce at least one concept")

    if len(doc.body) < 40:
        rep.warn(doc.path, "body is empty or very short")
    lint_sim_blocks(doc, SIM_REGISTRY, rep)
    lint_solution_maps(c, doc.body, doc.path, rep)


def lint_variant(uni, variant: dict, core: set, ppath: Path, rep: Report):
    vid = variant.get("id", "?")
    where = f"{_rel(ppath)} [{vid}]"
    placed = Counter()
    seen_so_far: set[str] = set()
    for term in variant.get("terms") or []:
        if term.get("season") not in SEASONS:
            rep.error(where, f"season {term.get('season')!r} not in {list(SEASONS)}")
        codes = term.get("courses") or []
        for code in codes:
            placed[code] += 1
            doc = uni.courses.get(code)
            if doc is None:
                rep.error(where, f"unknown course {code!r}")
                continue
            if doc.meta.get("kind") != "core":
                rep.error(where, f"{code} is {doc.meta.get('kind')}, only core courses are placed")
                continue
            # rule 15: official ordering must respect prereqs (assumed-prior/external count as satisfied)
            for group in prereq_groups(doc.meta.get("prereqs")):
                ok = any(alt in seen_so_far or uni.courses.get(alt, doc).meta.get("kind") != "core" for alt in group)
                if not ok:
                    rep.warn(where, f"{code} placed before its prerequisite ({' or '.join(group)})")
            for alt in doc.meta.get("coreqs") or []:
                if uni.courses.get(alt, doc).meta.get("kind") == "core" and alt not in seen_so_far | set(codes):
                    rep.warn(where, f"{code} placed before its co-requisite {alt}")
        seen_so_far |= set(codes)
    missing = core - set(placed)
    dup = sorted(k for k, v in placed.items() if v > 1)
    if missing:
        rep.error(where, f"core course(s) never placed: {', '.join(sorted(missing))}")
    if dup:
        rep.error(where, f"course(s) placed more than once: {', '.join(dup)}")


# --------------------------------------------------------------------------- findings (12-14)
def lint_findings(c: Content, rep: Report):
    introduced: set[str] = set()
    required_hard: dict[str, list[str]] = {}
    referenced: set[str] = set()
    for uni in c.universities.values():
        for code, docs in uni.units.items():
            for doc in docs:
                uid = f"{uni.id}/{code}/{unit_slug(doc)}"
                for key in ("introduces", "requires", "reinforces"):
                    for entry in edge_entries(doc.meta.get(key)):
                        if entry["concept"] is None:
                            continue
                        referenced.add(entry["concept"])
                        if key == "introduces":
                            introduced.add(entry["concept"])
                        elif key == "requires" and entry.get("strength", "hard") == "hard":
                            required_hard.setdefault(entry["concept"], []).append(uid)
        for code, doc in uni.courses.items():
            if doc.meta.get("kind") == "core" and not uni.units.get(code):
                rep.warn(doc.path, "core course has no units yet")
    for concept, units in sorted(required_hard.items()):
        if concept not in introduced:
            rep.warn(f"concept {concept}", f"required (hard) by {len(units)} unit(s) but introduced nowhere: "
                                            + ", ".join(units[:3]) + (" …" if len(units) > 3 else ""))
    for slug in sorted(c.concepts.keys() - referenced):
        rep.warn(c.concepts[slug].path, "concept is not referenced by any unit")


# --------------------------------------------------------------------------- cycles (11)
def lint_concept_cycles(c: Content, rep: Report):
    for key in ("generalizes", "part_of"):
        # self-references are already reported by lint_concepts
        graph = {s: [t for t in (d.meta.get(key) or []) if t in c.concepts and t != s] for s, d in c.concepts.items()}
        state: dict[str, int] = {}

        def visit(node, stack):
            state[node] = 1
            for nxt in graph[node]:
                if state.get(nxt) == 1:
                    rep.error(f"concept {node}", f"{key} cycle: {' -> '.join(stack + [node, nxt])}")
                elif nxt not in state:
                    visit(nxt, stack + [node])
            state[node] = 2

        for node in graph:
            if node not in state:
                visit(node, [])


# --------------------------------------------------------------------------- main
SIM_REGISTRY = None


def run(content=None) -> Report:
    global SIM_REGISTRY
    SIM_REGISTRY = load_sim_registry()
    c = content or load()
    rep = Report()
    for path, msg in c.parse_errors:
        rep.error(path, msg)
    targets = lint_roadmaps(c, rep)
    lint_concepts(c, rep, targets)
    lint_concept_cycles(c, rep)
    for uni in c.universities.values():
        lint_university(c, uni, rep)
    lint_findings(c, rep)
    lint_methods(c, rep)
    # the design specimens (app/src/design/*.md) may hold solution maps too
    for p in sorted((ROOT / "app" / "src" / "design").glob("*.md")):
        lint_solution_maps(c, p.read_text(encoding="utf-8"), p, rep)
    return rep


def main() -> int:
    rep = run()
    for w in rep.warnings:
        print(f"warning: {w}")
    for e in rep.errors:
        print(f"error: {e}")
    print(f"\n{len(rep.errors)} error(s), {len(rep.warnings)} warning(s)")
    return 1 if rep.errors else 0


if __name__ == "__main__":
    sys.exit(main())
