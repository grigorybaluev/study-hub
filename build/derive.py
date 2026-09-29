"""graph.json -> derived.json: everything computed from the authored graph.

Variant-independent: concept index, unit_depends_on, concept_depends_on, course_uses, unmet.
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
        req = [e for e in g.inc[(cid, "requires")] if g.nodes[e["from"]]["type"] == "unit"]
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
    """A depends on every unit introducing a concept A requires. Same-course edges are kept
    (they are the course's own spine) and flagged with same_course; a unit never depends on
    itself or on a later unit of its own course."""
    acc: dict[tuple[str, str], dict] = {}
    for u in g.by_type["unit"]:
        for e in g.out[(u["id"], "requires")]:
            for introducer in idx[e["to"]]["introduced_by"]:
                if introducer == u["id"]:
                    continue
                same = g.course_of(introducer) == u["course"]
                if same and g.nodes[introducer]["order"] > u["order"]:
                    continue
                d = acc.setdefault((u["id"], introducer), {"via": set(), "hard": False, "same": same})
                d["via"].add(e["to"])
                d["hard"] |= e["strength"] == "hard"
    return [{"from": a, "to": b, "via": sorted(d["via"]), "strength": "hard" if d["hard"] else "soft",
             "same_course": d["same"], "provenance": "derived"} for (a, b), d in sorted(acc.items())]


def concept_depends_on(g: Graph, idx: dict) -> list[dict]:
    """B depends on A when a unit that introduces B requires A (provenance derived; weight =
    number of such units), or when B's own frontmatter says `requires: A` (provenance authored,
    for what units cannot express, #155). Strength is hard if any source says hard."""
    acc: dict[tuple[str, str], dict] = {}
    for u in g.by_type["unit"]:
        intro = [e["to"] for e in g.out[(u["id"], "introduces")]]
        for b in intro:
            for e in g.out[(u["id"], "requires")]:
                a = e["to"]
                if a == b:
                    continue
                d = acc.setdefault((b, a), {"weight": 0, "hard": False, "units": set(), "authored": False})
                d["weight"] += 1
                d["hard"] |= e["strength"] == "hard"
                d["units"].add(u["id"])
    for c in g.by_type["concept"]:
        for e in g.out[(c["id"], "requires")]:
            d = acc.setdefault((c["id"], e["to"]), {"weight": 0, "hard": False, "units": set(), "authored": False})
            d["weight"] += 1
            d["hard"] |= e["strength"] == "hard"
            d["authored"] = True
    return [{"from": b, "to": a, "weight": d["weight"], "strength": "hard" if d["hard"] else "soft",
             "via_units": sorted(d["units"]), "provenance": "authored" if d["authored"] else "derived"}
            for (b, a), d in sorted(acc.items())]


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


# --------------------------------------------------------------------------- DS relevance (#155)
def _betweenness(nodes: list[str], succ: dict[str, list[str]]) -> dict[str, float]:
    """Brandes' betweenness on a directed graph, normalised to [0, 1] by (n-1)(n-2)."""
    from collections import deque
    cb = {v: 0.0 for v in nodes}
    for s in nodes:
        stack, pred, sigma, dist = [], {v: [] for v in nodes}, {v: 0 for v in nodes}, {v: -1 for v in nodes}
        sigma[s], dist[s] = 1, 0
        q = deque([s])
        while q:
            v = q.popleft()
            stack.append(v)
            for w in succ[v]:
                if dist[w] < 0:
                    dist[w] = dist[v] + 1
                    q.append(w)
                if dist[w] == dist[v] + 1:
                    sigma[w] += sigma[v]
                    pred[w].append(v)
        delta = {v: 0.0 for v in nodes}
        while stack:
            w = stack.pop()
            for v in pred[w]:
                delta[v] += sigma[v] / sigma[w] * (1 + delta[w])
            if w != s:
                cb[w] += delta[w]
    n = len(nodes)
    scale = (n - 1) * (n - 2) if n > 2 else 1
    return {v: cb[v] / scale for v in nodes}


def ds_relevance(g: Graph, idx: dict, deps: list[dict]) -> dict:
    """How much each concept matters for data science.

    Anchors: concepts that map to a roadmap skill with `role: target` (a skill inherits its area's
    role). DS units: the units introducing an anchor. Dependency is followed upward along hard
    `concept_depends_on` edges and `generalizes` edges (soft edges are context, not prerequisites):
    a DS unit that requires b reaches every a that b rests on, at distance d = path length + 1,
    and a DS unit that introduces a non-anchor concept (from its own perspective) reaches it at d = 1.
    ds_units counts the DS units that reach a concept; ds_weight sums 1/d over them, so a direct
    requirement counts 1, a requirement two concepts away 1/3; ds_reach counts the anchor concepts
    resting on it. Betweenness on the whole dependency graph says how load-bearing it is. score
    in [0, 1] blends ds_weight, ds_reach and betweenness on a log scale.
    Tiers: application = anchor; core = ds_weight >= CORE_WEIGHT; supporting = some path into DS;
    peripheral = none."""
    target_nodes = {n["id"] for n in g.by_type["roadmap_node"] if n.get("role") == "target"}
    targets = sorted(n["id"] for n in g.by_type["roadmap_node"] if n["level"] == "skill" and n["id"] in target_nodes)
    concepts = [c["id"] for c in g.by_type["concept"]]
    anchors = {c for c in concepts if any(e["to"] in target_nodes for e in g.out[(c, "maps_to")])}
    ds_units = sorted({u for a in anchors for u in idx[a]["introduced_by"]})

    # up[a] = concepts that rest on a (hard dependency or generalization); down = the reverse
    up: dict[str, list[str]] = {c: [] for c in concepts}
    down: dict[str, list[str]] = {c: [] for c in concepts}
    down_all: dict[str, list[str]] = {c: [] for c in concepts}
    for e in deps:
        down_all[e["from"]].append(e["to"])
        if e["strength"] == "hard":
            up[e["to"]].append(e["from"])
            down[e["from"]].append(e["to"])
    for e in g.edges:
        if e["type"] == "generalizes" and e["to"] not in down[e["from"]]:
            up[e["to"]].append(e["from"])
            down[e["from"]].append(e["to"])
    required_by_ds: dict[str, set[str]] = {c: set() for c in concepts}
    for u in ds_units:
        for e in g.out[(u, "requires")]:
            if e["strength"] == "hard":
                required_by_ds[e["to"]].add(u)
    introduces = {u: {e["to"] for e in g.out[(u, "introduces")]} for u in ds_units}

    def dependants(c: str) -> dict[str, int]:
        """concepts resting on c -> distance (BFS upward)"""
        dist = {c: 0}
        frontier = [c]
        while frontier:
            nxt = []
            for x in frontier:
                for y in up[x]:
                    if y not in dist:
                        dist[y] = dist[x] + 1
                        nxt.append(y)
            frontier = nxt
        return dist

    bet = _betweenness(concepts, down_all)
    rows = {}
    for c in concepts:
        dist = dependants(c)
        unit_dist: dict[str, int] = {}
        for x, dx in dist.items():
            for u in required_by_ds[x]:
                if c in introduces[u]:      # a unit does not reach what it introduces itself
                    continue
                unit_dist[u] = min(unit_dist.get(u, 99), dx + 1)
        if c not in anchors:                # a DS unit that teaches a foundation from its own angle rests on it too
            for u in idx[c]["introduced_by"]:
                if u in introduces:
                    unit_dist[u] = min(unit_dist.get(u, 99), 1)
        reach = sorted((a for a in dist if a in anchors and a != c), key=lambda a: (dist[a], -len(required_by_ds[a]), a))
        rows[c] = {"anchor": c in anchors, "ds_units": len(unit_dist), "ds_weight": round(sum(1 / d for d in unit_dist.values()), 2),
                   "ds_reach": len(reach), "betweenness": round(bet[c], 4),
                   "in_degree": len(up[c]), "out_degree": len(down[c]), "via": reach[:6]}
    import math
    mx_w = max((r["ds_weight"] for r in rows.values()), default=1) or 1
    mx_r = max((r["ds_reach"] for r in rows.values()), default=1) or 1
    mx_b = max((r["betweenness"] for r in rows.values()), default=1) or 1
    for c, r in rows.items():
        score = (0.5 * math.log1p(r["ds_weight"]) / math.log1p(mx_w) + 0.3 * math.log1p(r["ds_reach"]) / math.log1p(mx_r)
                 + 0.2 * math.log1p(r["betweenness"] * 100) / math.log1p(mx_b * 100))
        r["score"] = round(score, 3)
        if r["anchor"]:
            r["tier"] = "application"
        elif r["ds_units"] == 0 and r["ds_reach"] == 0:
            r["tier"] = "peripheral"
        elif r["ds_weight"] >= CORE_WEIGHT:
            r["tier"] = "core"
        else:
            r["tier"] = "supporting"

    courses: dict[str, dict] = {}
    for c in concepts:
        for course in sorted({g.course_of(u) for u in idx[c]["introduced_by"]}):   # once per course, however many of its units introduce c
            cs = courses.setdefault(course, {"application": 0, "core": 0, "supporting": 0, "peripheral": 0, "concepts": 0})
            cs[rows[c]["tier"]] += 1
            cs["concepts"] += 1
    return {"targets": targets, "anchors": sorted(anchors), "ds_units": ds_units, "core_weight": CORE_WEIGHT,
            "concepts": rows, "courses": dict(sorted(courses.items()))}


CORE_WEIGHT = 3.0   # a non-anchor concept is core DS when its depth-weighted DS reach is at least this


# --------------------------------------------------------------------------- main
def derive(data: dict) -> dict:
    g = Graph(data)
    idx = concept_index(g)
    variants = {}
    for p in g.by_type["program"]:
        for v in p["variants"]:
            variants[f"{p['id']}/{v['id']}"] = variant_analysis(g, idx, p, v)
    deps = concept_depends_on(g, idx)
    return {
        "meta": {"content_version": g.meta["content_version"], "graph_built": g.meta["built"], "schema": SCHEMA_VERSION},
        "concepts": idx,
        "unit_depends_on": unit_depends_on(g, idx),
        "concept_depends_on": deps,
        "course_uses": course_uses(g, idx),
        "unmet": unmet(g, idx),
        "variants": variants,
        "roadmap_coverage": roadmap_coverage(g, idx, variants),
        "ds_relevance": ds_relevance(g, idx, deps),
    }


def main(graph: Path = GRAPH, out: Path = OUT) -> int:
    if not graph.exists():
        print(f"{graph.name} not found; run build/build_graph.py first")
        return 1
    d = derive(json.loads(graph.read_text(encoding="utf-8")))
    out.write_text(json.dumps(d, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"wrote {out.relative_to(ROOT)} ({out.stat().st_size // 1024} KB)")
    print(f"unit_depends_on: {len(d['unit_depends_on'])}  concept_depends_on: {len(d['concept_depends_on'])}  "
          f"course_uses: {len(d['course_uses'])}  unmet: {len(d['unmet'])}")
    for vid, v in d["variants"].items():
        debt = sum(len(t.get("debt", [])) for t in v["terms"])
        same = sum(1 for t in v["terms"] for x in t.get("debt", []) if x["same_term"])
        later = sum(1 for t in v["terms"] for x in t.get("debt", []) if x["introduced_in_term"] is not None and not x["same_term"])
        print(f"{vid}: debt={debt} (same term {same}, later term {later}, never {debt - same - later}); reteach={len(v['reteach'])}")
    for rid, r in d["roadmap_coverage"].items():
        print(f"{rid}: {r['summary']}")
    ds = d["ds_relevance"]
    tiers = __import__("collections").Counter(r["tier"] for r in ds["concepts"].values())
    print(f"ds relevance: {len(ds['anchors'])} anchors, {len(ds['ds_units'])} DS units; tiers {dict(sorted(tiers.items()))}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
