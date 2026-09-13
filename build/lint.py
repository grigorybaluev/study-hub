"""Validate content/. Run before every commit.

Errors make the graph wrong and exit 1. Warnings are curriculum findings or hygiene and
exit 0. The rules are numbered to match the design discussion; see CLAUDE.md.
"""
from __future__ import annotations

import sys
from collections import Counter
from pathlib import Path

from schema import (CODE_RE, COURSE_KIND, DOMAINS, OPTIONAL, REQUIRED, SEASONS, SLUG_RE, STRENGTH,
                    UNIT_KIND, UNIT_STATUS, Content, Doc, edge_entries, load, prereq_groups, unit_slug)


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


def lint_concepts(c: Content, rep: Report):
    for slug, doc in c.concepts.items():
        check_fields(doc, "concept", rep)
        if not SLUG_RE.match(slug):
            rep.error(doc.path, f"filename {slug!r} is not a slug")
        check_enum(doc, "domain", DOMAINS, rep)
        for key in ("generalizes", "part_of"):
            for target in doc.meta.get(key) or []:
                if target not in c.concepts:
                    rep.error(doc.path, f"{key}: unknown concept {target!r}")
                elif target == slug:
                    rep.error(doc.path, f"{key}: concept refers to itself")
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


def lint_unit(c: Content, doc: Doc, rep: Report):
    slug = unit_slug(doc)
    check_fields(doc, "unit", rep)
    if not SLUG_RE.match(slug):
        rep.error(doc.path, f"filename {slug!r} is not a slug")
    check_enum(doc, "status", UNIT_STATUS, rep)
    check_enum(doc, "kind", UNIT_KIND, rep, default="teaching")
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
def run(content=None) -> Report:
    c = content or load()
    rep = Report()
    for path, msg in c.parse_errors:
        rep.error(path, msg)
    lint_concepts(c, rep)
    lint_concept_cycles(c, rep)
    for uni in c.universities.values():
        lint_university(c, uni, rep)
    lint_findings(c, rep)
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
