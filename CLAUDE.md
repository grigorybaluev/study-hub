# CLAUDE.md

Concept-level knowledge graph of a CS Data Science curriculum, cross-linked to the
roadmap.sh AI/Data Scientist roadmap, with analytics on course dependencies and gaps.
Content is authored as markdown/YAML; the graph is a build artifact; the site is static.

## Layout

```
content/
  concepts/<slug>.md                  global concept vocabulary (shared by all universities)
  roadmaps/<roadmap>.yaml             imported roadmap trees (titles + hierarchy only)
  universities/<uni>/
    university.yaml                   name, assumed_prior courses
    courses/<CODE>.md                 course metadata, official prereqs/coreqs
    units/<CODE>/<slug>.md            unit content + authored edges (frontmatter)
    programs/<program>.yaml           entry variants -> terms -> courses
build/    schema.py, build_graph.py, derive.py, lint.py   -> graph.json, derived.json
analytics/ report generator and notebooks
app/      Vite + React + TS + Cytoscape.js, reads graph.json and derived.json
```

## Commands

```
python build/lint.py           # validate content; run before every commit
python build/build_graph.py    # content -> graph.json
python build/derive.py         # graph.json -> derived.json
python analytics/report.py     # derived.json -> analytics/report.md
cd app && npm run dev
```

## Graph model

Node types: Concept, Unit, Course, Program (with variants), RoadmapNode, University.

IDs: concepts are global slugs (`conditional-probability`); everything else is
namespaced (`concordia/COMP232`, `concordia/MAST218/parametric-curves`,
`roadmap-sh/ai-data-scientist/linear-algebra`). Unit IDs are slugs, never numbers:
nothing hand-written references a unit, so units can be renamed, split, merged, or
inserted freely as a course's real structure emerges from lecture notes.

Authored edges (the only ones humans write, in unit/concept frontmatter):
- `unit introduces concept`
- `unit requires concept` with `strength: hard | soft`
- `unit reinforces concept`
- `concept generalizes | part_of concept`
- `concept maps_to roadmapNode`
- `course prereq | coreq course` (copied from the official calendar)

Derived edges (never hand-written; rebuilt by `derive.py`):
`unit depends_on unit`, `course uses course` (weighted), `course covers roadmapNode`,
per-variant concept debt by term. Every edge carries
`provenance: authored | official | derived`.

## Authoring rules

- Concepts are global. Never create a university-specific concept; if one is
  missing, add it to `content/concepts/` with a one-sentence definition and aliases.
- A `requires` edge must reference an existing concept. Lint fails otherwise.
- One concept per file; keep granularity coarse (`eigenvalue` covers eigenvectors
  unless a unit needs them separately).
- A unit is one coherent teaching chunk of one course (roughly a week or a textbook
  chapter, ~10-12 per course). Its `order` (frontmatter only) is the teaching order;
  lint requires orders to be unique and contiguous. Headings inside the unit body are
  parts of the unit, not graph nodes.
- A concept exists only if another unit could plausibly `require` it on its own.
  Applying a known concept to a new object ("tangent to a parametric curve") is a
  heading, not a concept; split a concept out only when a unit needs it separately.
- Unit `status`: `detailed` (written from lecture notes), `outline` (from the official
  course outline only), `planned` (no outline available). The official outline is only
  the initial hypothesis; lecture notes are ground truth. Record provenance in
  `weeks`, `textbook`, `notes`.
- Assumed-prior courses (e.g. MATH 203/204/205, `kind: assumed_prior`) have a few
  coarse units whose only job is to `introduce` the concepts the program assumes, so
  every required concept is introduced somewhere. Courses from other programs that
  appear only as prerequisite alternatives are `kind: external` stubs with no units.
- Course prerequisites are OR-groups (`[[COMP232, COEN231], [COMP249, COEN244]]`);
  co-requisites mean "prior or concurrent". Free-text requirements (writing test,
  credit counts) go in `requirements:` and are not edges.
- Program variants (`programs/*.yaml`) hold term placements only; prerequisites live
  in `courses/`. Personal plans use the same shape under `programs/local/` (git-ignored).
- Do not edit `graph.json` or `derived.json` by hand.

## Content rules

- Own words only. No lecture slides, textbook figures, or copied problem sets.
- roadmap.sh data: titles and structure only, with source attribution.
- Code is MIT; everything under `content/` is CC BY-SA 4.0.

## When adding a new university

Add `universities/<uni>/` with `university.yaml`, courses, units, programs.
Map units to existing concepts. Touching `content/concepts/` should be the
exception, not the rule.
