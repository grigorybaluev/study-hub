"""derived.json (+ graph.json for titles) -> analytics/report.md.

A readable summary of what the graph currently says: coverage status, unmet dependencies,
per-variant concept debt by term, re-teaching, and course coupling.
"""
from __future__ import annotations

import json
import sys
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
GRAPH = ROOT / "graph.json"
DERIVED = ROOT / "derived.json"
OUT = ROOT / "analytics" / "report.md"


def short(node_id: str) -> str:
    """`concordia/MAST221/probability-rules` -> `MAST221/probability-rules`."""
    return node_id.split("/", 1)[1] if "/" in node_id else node_id


def code(course_id: str) -> str:
    return course_id.rsplit("/", 1)[-1]


class Report:
    def __init__(self, graph: dict, derived: dict):
        self.g, self.d = graph, derived
        self.nodes = {n["id"]: n for n in graph["nodes"]}
        self.lines: list[str] = []

    def h(self, level: int, text: str):
        self.lines += ["", "#" * level + " " + text, ""]

    def p(self, text: str = ""):
        self.lines.append(text)

    def table(self, header: list[str], rows: list[list]):
        self.lines.append("| " + " | ".join(header) + " |")
        self.lines.append("|" + "|".join("---" for _ in header) + "|")
        for r in rows:
            self.lines.append("| " + " | ".join(str(x) for x in r) + " |")
        self.lines.append("")

    # ------------------------------------------------------------------ sections
    def summary(self):
        n = Counter(x["type"] for x in self.g["nodes"])
        e = Counter(x["type"] for x in self.g["edges"])
        self.h(1, "Study-hub analytics report")
        self.p(f"Content version `{self.d['meta']['content_version']}`, graph built {self.d['meta']['graph_built']}.")
        self.p()
        self.p(f"{n['concept']} concepts · {n['course']} courses · {n['unit']} units · {n['program']} program · "
               f"{e['introduces']} introduces · {e['requires']} requires · {e['reinforces']} reinforces edges.")

    def coverage(self):
        self.h(2, "Coverage by course")
        self.p("Units per course and their status. `outline` = from the official course outline only; "
               "`detailed` = written from lecture notes.")
        self.p()
        units = defaultdict(list)
        for u in self.g["nodes"]:
            if u["type"] == "unit":
                units[u["course"]].append(u)
        rows = []
        for c in sorted((x for x in self.g["nodes"] if x["type"] == "course"), key=lambda x: (x["kind"] != "core", x["code"])):
            us = units.get(c["id"], [])
            st = Counter(u["status"] for u in us)
            intro = sum(1 for e in self.g["edges"] if e["type"] == "introduces" and self.nodes[e["from"]]["course"] == c["id"])
            rows.append([c["code"], c["title"], c["kind"], len(us),
                         ", ".join(f"{k} {v}" for k, v in sorted(st.items())) or "—", intro])
        self.table(["course", "title", "kind", "units", "status", "concepts introduced"], rows)

    def unmet(self):
        self.h(2, "Unmet dependencies")
        if not self.d["unmet"]:
            self.p("None.")
            return
        self.p("Concepts some unit requires that no unit in the program introduces. "
               "Either a real gap in the curriculum or an introducer not yet authored.")
        self.p()
        self.table(["concept", "strength", "required by"],
                   [[u["concept"], u["strength"], ", ".join(short(x) for x in u["required_by"])] for u in self.d["unmet"]])

    def variants(self):
        self.h(2, "Concept debt by program variant")
        self.p("A unit has *debt* when it requires a concept not yet introduced by an earlier term "
               "(assumed-prior courses count as earlier) or by an earlier unit of its own course. "
               "*same term*: the introducer runs in parallel; *later*: the introducer comes in a later term; "
               "*never*: no introducer exists.")
        for vid, v in self.d["variants"].items():
            self.h(3, f"{v['variant']}")
            rows = []
            for t in v["terms"]:
                if "work_term" in t:
                    rows.append([f"Y{t['year']} {t['season']}", f"work term {t['work_term']}", "", "", "", ""])
                    continue
                debt = t["debt"]
                same = sum(1 for x in debt if x["same_term"])
                never = sum(1 for x in debt if x["introduced_in_term"] is None)
                later = len(debt) - same - never
                rows.append([f"Y{t['year']} {t['season']}", ", ".join(code(c) for c in t["courses"]),
                             len(t["introduced"]), same, later, never])
            self.table(["term", "courses", "concepts introduced", "same term", "later", "never"], rows)
            items = [(t, x) for t in v["terms"] for x in t.get("debt", [])]
            if items:
                self.p("Details:")
                self.p()
                rows = []
                for t, x in items:
                    kind = "same term" if x["same_term"] else ("later" if x["introduced_in_term"] is not None else "never")
                    rows.append([f"Y{t['year']} {t['season']}", short(x["unit"]), f"`{x['concept']}`", x["strength"], kind,
                                 short(x["introducer"]) if x["introducer"] else "—"])
                self.table(["term", "unit", "needs", "strength", "kind", "introducer"], rows)
            if v["reteach"]:
                self.p("Re-teaching (a concept introduced from scratch by two courses):")
                self.p()
                self.table(["concept", "first", "again", "terms apart"],
                           [[f"`{r['concept']}`", short(r["first"]), short(r["again"]), r["terms_apart"]] for r in v["reteach"]])

    def coupling(self):
        self.h(2, "Course coupling")
        self.p("How many (unit, concept) requirements of one course point at concepts another course introduces.")
        self.p()
        uses = sorted(self.d["course_uses"], key=lambda e: (-e["weight"], e["from"]))
        rows = [[code(e["from"]), code(e["to"]), e["weight"], e["hard"], e["soft"],
                 ", ".join(f"`{c}`" for c in e["via"][:6]) + (" …" if len(e["via"]) > 6 else "")] for e in uses]
        self.table(["uses", "from", "weight", "hard", "soft", "via"], rows)
        provides = Counter()
        needs = Counter()
        for e in uses:
            provides[code(e["to"])] += e["weight"]
            needs[code(e["from"])] += e["weight"]
        self.p("Most relied-upon courses (total incoming weight):")
        self.p()
        self.table(["course", "relied upon", "relies on others"],
                   [[c, provides[c], needs[c]] for c, _ in provides.most_common(10)])

    def concepts(self):
        self.h(2, "Concepts with several perspectives")
        self.p("Concepts introduced or reinforced by more than one course — the app shows these side by side.")
        self.p()
        rows = []
        for cid, c in self.d["concepts"].items():
            courses = {self.nodes[p["unit"]]["course"] for p in c["perspectives"]}
            if len(courses) >= 3:
                rows.append([f"`{cid}`", len(courses), ", ".join(sorted(code(x) for x in courses))])
        rows.sort(key=lambda r: (-r[1], r[0]))
        self.table(["concept", "courses", "which"], rows[:25])

    def roadmap(self):
        self.h(2, "Roadmap coverage")
        cov = self.d.get("roadmap_coverage") or {}
        if not cov:
            self.p("No roadmap loaded.")
            return
        self.p("For each skill: *covered* = every concept mapped to it is introduced by some unit; "
               "*thin* = covered, but only one or two concepts map to it; "
               "*partial* = some are introduced; *gap* = concepts map to it but none is introduced (a known hole); "
               "*unmapped* = no concept maps to it yet — either the program has nothing there or the "
               "vocabulary for it has not been written (Year 2–3 courses have no units yet).")
        for rid, r in cov.items():
            self.h(3, self.nodes[rid]["title"])
            self.p(", ".join(f"{k}: {v}" for k, v in r["summary"].items()))
            self.p()
            rows = []
            for sid, sk in sorted(r["skills"].items(), key=lambda kv: kv[1]["order"]):
                area = self.nodes[sk["area"]]["title"]
                rows.append([area, sk["title"], sk["status"], len(sk["concepts"]),
                             ", ".join(code(c) for c in sk["courses"]) or "—",
                             ", ".join(f"`{m}`" for m in sk["missing"]) or ""])
            self.table(["area", "skill", "status", "concepts", "taught in", "missing concepts"], rows)

    def ds_field(self):
        f = self.d.get("ds_field")
        if not f:
            return
        self.h(2, "DS relevance of the field")
        self.p("Every concept, whatever the program teaches (#173): the same tiers, scored by the DS concepts that rest on a "
               "concept through hard concept edges (never by units). *Taught*: introduced by some unit, or covered inside a taught "
               "topic it is part of.")
        self.p()
        tiers = ["application", "core", "supporting", "peripheral"]
        rows = []
        for t in tiers:
            cs = [r for r in f["concepts"].values() if r["tier"] == t]
            rows.append([t, len(cs), sum(r["taught"] == "unit" for r in cs), sum(r["taught"] == "parent" for r in cs),
                         sum(r["taught"] is None for r in cs)])
        self.table(["tier", "concepts", "taught", "within a taught topic", "not taught"], rows)
        gaps = sorted(((cid, r) for cid, r in f["concepts"].items() if r["taught"] is None and r["tier"] in ("application", "core")),
                      key=lambda kv: (tiers.index(kv[1]["tier"]), -kv[1]["score"], kv[0]))
        if gaps:
            self.h(3, "DS concepts no unit teaches")
            self.p("Application and core concepts of the field that no unit introduces, most load-bearing first.")
            self.p()
            self.table(["concept", "domain", "tier", "score", "DS concepts resting on it"],
                       [[f"`{cid}`", self.nodes[cid]["domain"], r["tier"], f"{r['score']:.2f}", r["reach"]] for cid, r in gaps[:40]])

    def ds_relevance(self):
        ds = self.d.get("ds_relevance")
        if not ds:
            return
        self.h(2, "DS relevance")
        tiers = Counter(r["tier"] for r in ds["concepts"].values())
        self.p("Concepts mapped to a *target* skill of the roadmap are the data-science work itself "
               f"({len(ds['anchors'])} anchors, taught in {len(ds['ds_units'])} DS units). Every other concept is scored by the DS units "
               "that rest on it through hard dependencies (weighted by distance), the DS concepts that rest on it, and its betweenness "
               "in the dependency graph. Tiers: *application* = anchor; *core* = depth-weighted reach ≥ "
               f"{ds['core_weight']}; *supporting* = reached by a few paths; *peripheral* = no DS unit rests on it.")
        self.p()
        self.table(["application", "core", "supporting", "peripheral"],
                   [[tiers.get("application", 0), tiers.get("core", 0), tiers.get("supporting", 0), tiers.get("peripheral", 0)]])
        rows = sorted(((cid, r) for cid, r in ds["concepts"].items() if r["tier"] == "core"), key=lambda kv: -kv[1]["score"])
        self.h(3, "Core foundations")
        self.p("Not data science themselves, but the DS units rest on them most.")
        self.p()
        self.table(["concept", "domain", "score", "DS units", "weighted", "DS concepts", "reached through"],
                   [[f"`{cid}`", self.nodes[cid]["domain"], f"{r['score']:.2f}", r["ds_units"], f"{r['ds_weight']:.1f}", r["ds_reach"],
                     ", ".join(f"`{v}`" for v in r["via"][:4])] for cid, r in rows[:25]])
        self.h(3, "Courses by DS relevance of what they introduce")
        self.p("How the concepts each course introduces fall into the tiers; courses whose concepts are mostly peripheral to DS first.")
        self.p()
        courses = sorted(ds["courses"].items(), key=lambda kv: (-(kv[1]["peripheral"] / kv[1]["concepts"] if kv[1]["concepts"] else 0), kv[0]))
        self.table(["course", "concepts", "application", "core", "supporting", "peripheral", "peripheral share"],
                   [[code(cid), c["concepts"], c["application"], c["core"], c["supporting"], c["peripheral"],
                     f"{round(100 * c['peripheral'] / c['concepts']) if c['concepts'] else 0}%"] for cid, c in courses])
        self.h(3, "Peripheral concepts by course")
        self.p("Taught for the degree; no DS unit rests on them. An entry here is a finding to check (a missing edge shrinks the list), not a verdict.")
        self.p()
        by_course: dict[str, list[str]] = defaultdict(list)
        for cid, r in ds["concepts"].items():
            if r["tier"] == "peripheral":
                for u in self.d["concepts"][cid]["introduced_by"]:
                    by_course[self.nodes[u]["course"]].append(cid)
        self.table(["course", "n", "peripheral concepts"],
                   [[code(c), len(set(lst)), ", ".join(f"`{x}`" for x in sorted(set(lst)))]
                    for c, lst in sorted(by_course.items(), key=lambda kv: (-len(set(kv[1])), kv[0]))])

    def render(self) -> str:
        self.summary(); self.coverage(); self.unmet(); self.variants(); self.coupling(); self.concepts(); self.roadmap(); self.ds_relevance()
        self.ds_field()
        return "\n".join(self.lines).strip() + "\n"


def main(out: Path = OUT) -> int:
    for p in (GRAPH, DERIVED):
        if not p.exists():
            print(f"{p.name} not found; run build/build_graph.py and build/derive.py first")
            return 1
    graph = json.loads(GRAPH.read_text(encoding="utf-8"))
    derived = json.loads(DERIVED.read_text(encoding="utf-8"))
    out.write_text(Report(graph, derived).render(), encoding="utf-8")
    print(f"wrote {out.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
