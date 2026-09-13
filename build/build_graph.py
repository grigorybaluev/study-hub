"""content/ -> graph.json: nodes and authored edges, nothing computed.

Refuses to build if lint reports errors. Output is deterministic (sorted, no timestamps
beyond meta.built) so diffs stay readable.
"""
from __future__ import annotations

import datetime as dt
import json
import subprocess
import sys
from pathlib import Path

import lint
from schema import ROOT, SEASONS, Content, edge_entries, load, prereq_groups, unit_slug

OUT = ROOT / "graph.json"
SCHEMA_VERSION = 1


def content_version() -> str:
    try:
        return subprocess.check_output(["git", "rev-parse", "--short", "HEAD"], cwd=ROOT, text=True).strip()
    except (subprocess.CalledProcessError, FileNotFoundError):
        return "unknown"


def build(c: Content) -> dict:
    nodes: list[dict] = []
    edges: list[dict] = []

    def edge(src, dst, type_, **attrs):
        edges.append({"from": src, "to": dst, "type": type_, **attrs})

    # ---- concepts
    for slug, doc in c.concepts.items():
        m = doc.meta
        nodes.append({
            "id": slug, "type": "concept", "title": m["title"], "domain": m["domain"],
            "aliases": m.get("aliases") or [], "body": doc.body,
        })
        for target in m.get("generalizes") or []:
            edge(slug, target, "generalizes", provenance="authored")
        for target in m.get("part_of") or []:
            edge(slug, target, "part_of", provenance="authored")
        for target in m.get("maps_to") or []:
            edge(slug, target, "maps_to", provenance="authored")

    # ---- roadmaps (titles + hierarchy only)
    for rid, data in c.roadmaps.items():
        root = f"{data.get('source', 'roadmap')}/{rid}"
        for node in data.get("nodes") or []:
            nid = f"{root}/{node['id']}"
            nodes.append({
                "id": nid, "type": "roadmap_node", "roadmap": root, "title": node["title"],
                "parent": f"{root}/{node['parent']}" if node.get("parent") else None,
            })

    # ---- universities
    for uni in c.universities.values():
        U = uni.id
        cid = lambda code: f"{U}/{code}"
        nodes.append({
            "id": U, "type": "university", "name": uni.meta["name"],
            "assumed_prior": [cid(x) for x in uni.meta.get("assumed_prior") or []],
            "sources": uni.meta.get("sources") or [],
        })

        for code, doc in uni.courses.items():
            m = doc.meta
            nodes.append({
                "id": cid(code), "type": "course", "university": U, "code": code,
                "title": m["title"], "credits": m["credits"], "kind": m["kind"],
                "requirements": m.get("requirements") or [], "source": m.get("source"),
                "body": doc.body,
            })
            for gi, group in enumerate(prereq_groups(m.get("prereqs"))):
                for alt in group:
                    edge(cid(code), cid(alt), "prereq", group=gi, provenance="official")
            for alt in m.get("coreqs") or []:
                edge(cid(code), cid(alt), "coreq", provenance="official")

        for code, docs in uni.units.items():
            for doc in sorted(docs, key=lambda d: d.meta["order"]):
                m = doc.meta
                uid = f"{U}/{code}/{unit_slug(doc)}"
                nodes.append({
                    "id": uid, "type": "unit", "course": cid(code), "title": m["title"],
                    "order": m["order"], "kind": m.get("kind", "teaching"), "status": m["status"],
                    "weeks": m.get("weeks") or [], "textbook": m.get("textbook"),
                    "notes": m.get("notes"), "body": doc.body,
                })
                for e in edge_entries(m.get("introduces")):
                    edge(uid, e["concept"], "introduces", perspective=e.get("perspective"), provenance="authored")
                for e in edge_entries(m.get("requires")):
                    edge(uid, e["concept"], "requires", strength=e.get("strength", "hard"), provenance="authored")
                for e in edge_entries(m.get("reinforces")):
                    edge(uid, e["concept"], "reinforces", perspective=e.get("perspective"), provenance="authored")

        for pid, prog in uni.programs.items():
            variants = []
            for v in prog.get("variants") or []:
                terms = []
                for i, t in enumerate(v.get("terms") or []):
                    term = {"index": i, "year": t["year"], "season": t["season"]}
                    if "work_term" in t:
                        term["work_term"] = t["work_term"]
                    else:
                        term["courses"] = [cid(x) for x in t.get("courses") or []]
                        term["electives"] = t.get("electives", 0)
                    terms.append(term)
                variants.append({"id": v["id"], "name": v.get("name"), "entry": v.get("entry"),
                                 "coop": bool(v.get("coop")), "terms": terms})
            nodes.append({
                "id": f"{U}/{pid}", "type": "program", "university": U, "name": prog["name"],
                "source": prog.get("source"), "variants": variants,
            })

    nodes.sort(key=lambda n: (n["type"], n["id"]))
    edges.sort(key=lambda e: (e["type"], e["from"], e["to"]))
    return {
        "meta": {
            "built": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"),
            "content_version": content_version(),
            "schema": SCHEMA_VERSION,
            "seasons": list(SEASONS),
        },
        "nodes": nodes,
        "edges": edges,
    }


def _json_default(o):
    if isinstance(o, (dt.date, dt.datetime)):
        return o.isoformat()
    raise TypeError(f"not JSON serializable: {type(o).__name__}")


def main(out: Path = OUT) -> int:
    c = load()
    rep = lint.run(c)
    if rep.errors:
        for e in rep.errors:
            print(f"error: {e}")
        print(f"\nnot building: {len(rep.errors)} lint error(s)")
        return 1
    graph = build(c)
    out.write_text(json.dumps(graph, indent=1, ensure_ascii=False, default=_json_default) + "\n", encoding="utf-8")
    from collections import Counter
    n, e = Counter(x["type"] for x in graph["nodes"]), Counter(x["type"] for x in graph["edges"])
    print(f"wrote {out.relative_to(ROOT)} ({out.stat().st_size // 1024} KB)")
    print("nodes:", dict(sorted(n.items())))
    print("edges:", dict(sorted(e.items())))
    return 0


if __name__ == "__main__":
    sys.exit(main())
