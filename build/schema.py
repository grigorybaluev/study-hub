"""Content schema and loader.

Single reader shared by lint.py, build_graph.py and derive.py. Parses everything under
content/ into plain dicts; performs no validation beyond "frontmatter parses" (that is
lint's job). Field and enum definitions live here so the rules have one home.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent.parent
CONTENT = ROOT / "content"

# --------------------------------------------------------------------------- vocabulary
DOMAINS = {
    "math.calculus", "math.linear-algebra", "math.discrete", "theory", "probability",
    "statistics", "programming", "algorithms", "systems", "data", "ml",
}
UNIT_STATUS = {"detailed", "outline", "planned"}
UNIT_KIND = {"teaching", "review"}
UNIT_REVIEW = {"draft", "reviewed"}
SIM_CHECKS = ("interface", "content")  # a sim block's `verified:` list; both = verified
COURSE_KIND = {"core", "assumed_prior", "external"}
PAGE_KINDS = {"math", "programming", "systems", "data"}  # course `pages:` -- which unit-page design applies (#89)
# `:::name[title]` containers a unit body may use; the app's Markdown.tsx has the same list
BLOCKS = {"definition", "theorem", "lemma", "proposition", "corollary", "proof", "example", "solution",
          "note", "remark", "caution", "insight", "steps", "equations"}
STRENGTH = {"hard", "soft"}
SEASONS = ("fall", "winter", "summer")  # ordered: index within a year

SLUG_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
CODE_RE = re.compile(r"^[A-Z]{4}\d{3}$")
WIKIDATA_RE = re.compile(r"^Q[1-9]\d*$")

REQUIRED = {
    "concept": {"title", "domain"},
    "unit": {"title", "order", "status"},
    "course": {"code", "title", "credits", "kind"},
    "program": {"id", "name", "variants"},
    "university": {"id", "name"},
}
OPTIONAL = {
    "concept": {"aliases", "generalizes", "part_of", "maps_to", "short", "wikipedia", "wikidata"},
    "unit": {"kind", "review", "weeks", "textbook", "notes", "introduces", "requires", "reinforces"},
    "course": {"prereqs", "coreqs", "requirements", "source", "pages"},
    "program": {"source"},
    "university": {"faculty", "department", "assumed_prior", "sources"},
}


# --------------------------------------------------------------------------- records
@dataclass
class Doc:
    """One markdown file: frontmatter + body."""
    path: Path
    meta: dict
    body: str


@dataclass
class University:
    id: str
    path: Path
    meta: dict
    courses: dict[str, Doc] = field(default_factory=dict)          # code -> Doc
    units: dict[str, list[Doc]] = field(default_factory=dict)      # code -> [Doc] (unsorted)
    programs: dict[str, dict] = field(default_factory=dict)        # program id -> yaml


@dataclass
class Content:
    concepts: dict[str, Doc]                    # slug -> Doc
    roadmaps: dict[str, dict]                   # roadmap id -> yaml
    universities: dict[str, University]         # uni id -> University
    parse_errors: list[tuple[Path, str]]


# --------------------------------------------------------------------------- helpers
def unit_slug(doc: Doc) -> str:
    return doc.path.stem


def edge_entries(value) -> list[dict]:
    """Normalize an introduces/requires/reinforces list to dicts with a `concept` key.

    Accepts bare slugs, `{concept, strength}` and `{concept, perspective}` entries.
    Malformed entries are returned as {"concept": None, "raw": entry} for lint to report.
    """
    out = []
    for entry in value or []:
        if isinstance(entry, str):
            out.append({"concept": entry})
        elif isinstance(entry, dict) and isinstance(entry.get("concept"), str):
            out.append(dict(entry))
        else:
            out.append({"concept": None, "raw": entry})
    return out


def roadmap_root(data: dict, rid: str) -> str:
    return f"{data.get('source', 'roadmap')}/{rid}"


def roadmap_node_ids(data: dict, rid: str) -> set[str]:
    """All node ids a concept may `maps_to`: areas and skills, fully qualified."""
    root = roadmap_root(data, rid)
    ids = set()
    for area in data.get("areas") or []:
        ids.add(f"{root}/{area['id']}")
        for skill in area.get("skills") or []:
            ids.add(f"{root}/{skill['id']}")
    return ids


def prereq_groups(value) -> list[list[str]]:
    """Normalize prereqs to a list of OR-groups. `[A, [B, C]]` -> `[[A], [B, C]]`."""
    groups = []
    for g in value or []:
        groups.append([g] if isinstance(g, str) else list(g))
    return groups


# --------------------------------------------------------------------------- loading
def _read_doc(path: Path, errors: list) -> Doc | None:
    text = path.read_text(encoding="utf-8")
    if not text.startswith("---\n"):
        errors.append((path, "missing frontmatter"))
        return None
    parts = text.split("\n---\n", 1)
    if len(parts) != 2:
        errors.append((path, "unterminated frontmatter"))
        return None
    try:
        meta = yaml.safe_load(parts[0][4:]) or {}
    except yaml.YAMLError as e:
        errors.append((path, f"yaml: {e}"))
        return None
    if not isinstance(meta, dict):
        errors.append((path, "frontmatter is not a mapping"))
        return None
    return Doc(path=path, meta=meta, body=parts[1].strip())


def _read_yaml(path: Path, errors: list) -> dict | None:
    try:
        data = yaml.safe_load(path.read_text(encoding="utf-8"))
    except yaml.YAMLError as e:
        errors.append((path, f"yaml: {e}"))
        return None
    if not isinstance(data, dict):
        errors.append((path, "top level is not a mapping"))
        return None
    return data


def load(content_dir: Path = CONTENT) -> Content:
    errors: list[tuple[Path, str]] = []

    concepts = {}
    for p in sorted((content_dir / "concepts").glob("*.md")):
        if doc := _read_doc(p, errors):
            concepts[p.stem] = doc

    roadmaps = {}
    for p in sorted((content_dir / "roadmaps").glob("*.yaml")):
        if data := _read_yaml(p, errors):
            roadmaps[p.stem] = data

    universities = {}
    for udir in sorted(d for d in (content_dir / "universities").iterdir() if d.is_dir()):
        meta = _read_yaml(udir / "university.yaml", errors) if (udir / "university.yaml").exists() else None
        if meta is None:
            errors.append((udir, "missing or invalid university.yaml"))
            continue
        uni = University(id=udir.name, path=udir, meta=meta)
        for p in sorted((udir / "courses").glob("*.md")):
            if doc := _read_doc(p, errors):
                uni.courses[p.stem] = doc
        for cdir in sorted(d for d in (udir / "units").glob("*") if d.is_dir()):
            docs = [d for p in sorted(cdir.glob("*.md")) if (d := _read_doc(p, errors))]
            uni.units[cdir.name] = docs
        for p in sorted((udir / "programs").glob("*.yaml")):
            if data := _read_yaml(p, errors):
                uni.programs[p.stem] = data
        universities[udir.name] = uni

    return Content(concepts=concepts, roadmaps=roadmaps, universities=universities, parse_errors=errors)
