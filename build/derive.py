"""graph.json -> derived.json: everything computed from the authored graph.

Variant-independent: concept index, unit_depends_on, course_uses, unmet.
Per variant: concept debt by term, re-teaching. Assumed-prior courses count as
taught before term 0 in every variant.
"""
from __future__ import annotations

import json
import sys
from collections import defaultdict
from pathlib import Path

from schema import ROOT

GRAPH = ROOT / "graph.json"
OUT = ROOT / "derived.json"
SCHEMA_VERSION = 1


class Graph:
    def __init__(self, data: dict):
        self.meta = data["meta"]
        self.nodes = {n["id"]: n for n in data["nodes"]}
        self.edges = data["edges"]
        self.by_type = defaultdict(list)
        for n in data["nodes"]:
            self.by_type[n["type"]].append(n)
        self.out = defaultdict(list)   # (from, type) -> edges
        self.inc = defaultdict(list)   # (to, type) -> edges
        for e in self.edges:
            self.out[(e["from"], e["type"])].append(e)
            self.inc[(e["to"], e["type"])].append(e)

    def course_of(self, unit_id: str) -> str:
        return self.nodes[unit_id]["course"]


# --------------------------------------------------------------------------- variant-independent
def concept_index(g: Graph) -> dict:
    idx = {}
    for c in g.by_type["concept"]:
        cid = c["id"]
        intro = g.inc[(cid, "introduces")]
        reinf = g.inc[(cid, "reinforces")]
        req = g.inc[(cid, "requires")]
        idx[cid] = {
            "introduced_by": sorted(e["from"] for e in intro),
            "reinforced_by": sorted(e["from"] for e in reinf),
            "required_by": sorted(({"unit": e["from"], "strength": e["strength"]} for e in req), key=lambda x: x["unit"]),
            "perspectives": sorted(
                ({"unit": e["from"], "role": e["type"], "perspective": e.get("perspective")} for e in intro + reinf),
                key=lambda x: (x["unit"], x["role"])),
        }
    return idx


def unit_depends_on(g: Graph, idx: dict) -> list[dict]:
    """A depends on every unit introducing a concept A requires (outside A's own course)."""
    acc: dict[tuple[str, str], dict] = {}
    for u in g.by_type["unit"]:
        for e in g.out[(u["id"], "requires")]:
            for introducer in idx[e["to"]]["introduced_by"]:
                if g.course_of(introducer) == u["course"]:
                    continue
                d = acc.setdefault((u["id"], introducer), {"via": set(), "hard": False})
                d["via"].add(e["to"])
                d["hard"] |= e["strength"] == "hard"
    return [{"from": a, "to": b, "via": sorted(d["via"]), "strength": "hard" if d["hard"] else "soft",
             "provenance": "derived"} for (a, b), d in sorted(acc.items())]


def course_uses(g: Graph, idx: dict) -> list[dict]:
    """Course X uses course Y: distinct (unit, concept) requires from X into concepts Y introduces."""
    acc: dict[tuple[str, str], dict] = {}
    for u in g.by_type["unit"]:
        for e in g.out[(u["id"], "requires")]:
            for course in {g.course_of(i) for i in idx[e["to"]]["introduced_by"]}:
                if course == u["course"]:
                    continue
                d = acc.setdefault((u["course"], course), {"hard": 0, "soft": 0, "via": set()})
                d[e["strength"]] += 1
                d["via"].add(e["to"])
    return [{"from": a, "to": b, "weight": d["hard"] + d["soft"], "hard": d["hard"], "soft": d["soft"],
             "via": sorted(d["via"]), "provenance": "derived"} for (a, b), d in sorted(acc.items())]


def unmet(g: Graph, idx: dict) -> list[dict]:
    out = []
    for cid, d in idx.items():
        if d["required_by"] and not d["introduced_by"]:
            strengths = {r["strength"] for r in d["required_by"]}
            out.append({"concept": cid, "required_by": [r["unit"] for r in d["required_by"]],
                        "strength": "hard" if "hard" in strengths else "soft", "reason": "no_introducer"})
    return sorted(out, key=lambda x: x["concept"])


# --------------------------------------------------------------------------- per variant
def variant_analysis(g: Graph, idx: dict, program: dict, variant: dict) -> dict:
    uni = g.nodes[program["university"]]
    assumed = set(uni["assumed_prior"])
    term_of_course: dict[str, int] = {c: -1 for c in assumed}
    for t in variant["terms"]:
        for c in t.get("courses", []):
            term_of_course[c] = t["index"]

    units_by_course = defaultdict(list)
    for u in g.by_type["unit"]:
        units_by_course[u["course"]].append(u)

    def term_of_unit(uid: str) -> int | None:
        return term_of_course.get(g.course_of(uid))

    # first term in which each concept is introduced, and by whom (course order, then unit order)
    first_intro: dict[str, tuple[int, str]] = {}
    for cid, d in idx.items():
        placed = [(term_of_unit(u), g.nodes[u]["order"], u) for u in d["introduced_by"] if term_of_unit(u) is not None]
        if placed:
            t, _, u = min(placed)
            first_intro[cid] = (t, u)

    terms_out = []
    for t in variant["terms"]:
        if "work_term" in t:
            terms_out.append({"index": t["index"], "year": t["year"], "season": t["season"], "work_term": t["work_term"]})
            continue
        introduced = sorted(c for c, (ti, _) in first_intro.items() if ti == t["index"])
        debt = []
        for course in t["courses"]:
            for u in sorted(units_by_course[course], key=lambda x: x["order"]):
                for e in g.out[(u["id"], "requires")]:
                    cid = e["to"]
                    introducers = idx[cid]["introduced_by"]
                    # satisfied by an earlier term (assumed prior counts), or by an earlier unit of the same course
                    if any(term_of_unit(i) is not None and term_of_unit(i) < t["index"] for i in introducers) or any(
                            g.course_of(i) == course and g.nodes[i]["order"] <= u["order"] for i in introducers):
                        continue
                    fi = first_intro.get(cid)
                    debt.append({
                        "concept": cid, "unit": u["id"], "strength": e["strength"],
                        "introduced_in_term": fi[0] if fi else None,
                        "same_term": bool(fi) and fi[0] == t["index"],
                        "introducer": fi[1] if fi else None,
                    })
        terms_out.append({"index": t["index"], "year": t["year"], "season": t["season"],
                          "courses": t["courses"], "electives": t.get("electives", 0),
                          "introduced": introduced, "debt": debt})

    reteach = []
    for cid, d in idx.items():
        placed = sorted((term_of_unit(u), g.nodes[u]["order"], u) for u in d["introduced_by"] if term_of_unit(u) is not None)
        if len(placed) < 2:
            continue
        t0, _, u0 = placed[0]
        for t1, _, u1 in placed[1:]:
            if g.course_of(u1) != g.course_of(u0):
                reteach.append({"concept": cid, "first": u0, "again": u1, "terms_apart": t1 - t0})
    reteach.sort(key=lambda r: (r["concept"], r["again"]))

    return {"program": program["id"], "variant": variant["id"], "terms": terms_out, "reteach": reteach}


# --------------------------------------------------------------------------- roadmap coverage
def roadmap_coverage(g: Graph, idx: dict, variants: dict) -> dict:
    """Per roadmap skill: which concepts map to it, which courses introduce them, and the first term
    per variant. status: covered (all mapped concepts introduced, more than two of them), thin (all
    introduced but only one or two concepts map), partial (some introduced), gap (mapped, none
    introduced), unmapped (no concept maps to it)."""
    out = {}
    for rm in g.by_type["roadmap"]:
        skills = {}
        for node in g.by_type["roadmap_node"]:
            if node["roadmap"] != rm["id"] or node["level"] != "skill":
                continue
            concepts = sorted(e["from"] for e in g.inc[(node["id"], "maps_to")])
            introduced = [c for c in concepts if idx[c]["introduced_by"]]
            courses = sorted({g.course_of(u) for c in introduced for u in idx[c]["introduced_by"]})
            status = ("unmapped" if not concepts else "gap" if not introduced
                      else "partial" if len(introduced) < len(concepts)
                      else "thin" if len(concepts) <= 2 else "covered")
            first_term = {}
            for vid, v in variants.items():
                terms = [t["index"] for t in v["terms"] for c in t.get("introduced", []) if c in concepts]
                first_term[vid] = min(terms) if terms else None
            skills[node["id"]] = {"area": node["parent"], "title": node["title"], "order": node["order"], "status": status,
                                  "concepts": concepts, "missing": sorted(set(concepts) - set(introduced)),
                                  "courses": courses, "first_term": first_term}
        out[rm["id"]] = {"skills": skills, "summary": dict(sorted(
            __import__("collections").Counter(s["status"] for s in skills.values()).items()))}
    return out


# --------------------------------------------------------------------------- main
def derive(data: dict) -> dict:
    g = Graph(data)
    idx = concept_index(g)
    variants = {}
    for p in g.by_type["program"]:
        for v in p["variants"]:
            variants[f"{p['id']}/{v['id']}"] = variant_analysis(g, idx, p, v)
    return {
        "meta": {"content_version": g.meta["content_version"], "graph_built": g.meta["built"], "schema": SCHEMA_VERSION},
        "concepts": idx,
        "unit_depends_on": unit_depends_on(g, idx),
        "course_uses": course_uses(g, idx),
        "unmet": unmet(g, idx),
        "variants": variants,
        "roadmap_coverage": roadmap_coverage(g, idx, variants),
    }


def main(graph: Path = GRAPH, out: Path = OUT) -> int:
    if not graph.exists():
        print(f"{graph.name} not found; run build/build_graph.py first")
        return 1
    d = derive(json.loads(graph.read_text(encoding="utf-8")))
    out.write_text(json.dumps(d, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"wrote {out.relative_to(ROOT)} ({out.stat().st_size // 1024} KB)")
    print(f"unit_depends_on: {len(d['unit_depends_on'])}  course_uses: {len(d['course_uses'])}  unmet: {len(d['unmet'])}")
    for vid, v in d["variants"].items():
        debt = sum(len(t.get("debt", [])) for t in v["terms"])
        same = sum(1 for t in v["terms"] for x in t.get("debt", []) if x["same_term"])
        later = sum(1 for t in v["terms"] for x in t.get("debt", []) if x["introduced_in_term"] is not None and not x["same_term"])
        print(f"{vid}: debt={debt} (same term {same}, later term {later}, never {debt - same - later}); reteach={len(v['reteach'])}")
    for rid, r in d["roadmap_coverage"].items():
        print(f"{rid}: {r['summary']}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
