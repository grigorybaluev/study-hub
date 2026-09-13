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
    university.yaml                   name, assumed_prior courses, sources
    courses/<CODE>.md                 catalog entry: credits, kind, official prereqs/coreqs
    units/<CODE>/<slug>.md            unit content + authored edges (frontmatter)
    programs/<program>.yaml           variants -> terms -> courses (placements only)
    programs/local/                   personal plans, same shape, git-ignored
build/    schema.py, build_graph.py, derive.py, lint.py   -> graph.json, derived.json (never hand-edited)
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

Nodes: Concept, Unit, Course, Program (with variants), RoadmapNode, University.
IDs: concepts are global slugs (`conditional-probability`); everything else is namespaced
(`concordia/COMP232`, `concordia/MAST218/parametric-curves`,
`roadmap-sh/ai-data-scientist/linear-algebra`).

Authored edges (the only ones humans write, in unit/concept/course frontmatter):
- `unit introduces concept` — entry is a slug or `{concept, perspective}`; several units
  (in different courses) may introduce the same concept, each from its own perspective
- `unit requires concept` with `strength: hard | soft`
- `unit reinforces concept` — slug or `{concept, perspective}`
- `concept generalizes | part_of concept`; `concept maps_to roadmapNode`
- `course prereq | coreq course` (official calendar)

Derived (rebuilt by `derive.py`): `unit depends_on unit` (to the earliest introducer in the
variant's term order), `course uses course` (weighted), `course covers roadmapNode`,
per-variant concept debt by term, unmet dependencies. Every edge carries
`provenance: authored | official | derived`.

## Authoring rules

Concepts
- Global, one per file, one-sentence definition, `domain`, `aliases`. Never
  university-specific. A `requires` must reference an existing concept (lint fails).
- A concept exists only if another unit could plausibly `require` it on its own.
  Applying a known concept to a new object is a heading, not a concept. Keep coarse;
  split only when a unit needs the part separately.
- A concept nobody introduces is a finding (unmet dependency), reported by derive and
  warned by lint — never author around it.

Units
- One coherent teaching chunk of one course (~a week or chapter, ~10-12 per course).
  ID and filename are slugs, never numbers: nothing hand-written references a unit, so
  units are freely renamed, split, merged, or inserted. `order` (frontmatter) is the
  teaching order; lint requires it unique and contiguous. Headings inside the body are
  parts, not nodes.
- `kind: teaching | review`. A review unit recaps material introduced elsewhere with no
  new perspective: `reinforces` only, minimal body; the app links to the introducer.
  A unit that revisits a concept from a new angle is `teaching` with a `perspective`.
- `status: detailed` (from lecture notes) | `outline` (official outline only) |
  `planned` (no outline). The outline is the initial hypothesis; notes are ground truth.
  Record provenance in `weeks`, `textbook`, `notes`.
- Every course the student has taken gets units, at least coarse concept-introducing
  ones, so every required concept has an introducer.

Courses and programs
- `kind: core | assumed_prior | external`. Assumed-prior courses (MATH 203/204/205) have
  coarse units; external alternates (COEN 231 …) are stubs with no units.
- Prereqs are OR-groups (`[[COMP232, COEN231], [COMP249, COEN244]]`); coreqs mean
  "prior or concurrent"; free-text requirements go in `requirements:` (not edges).
- Variants hold term placements only; prereqs live in `courses/`.

## Content rules

- Own words only. No lecture slides, textbook figures, or copied problem sets.
- roadmap.sh data: titles and structure only, with source attribution.
- Code is MIT; everything under `content/` is CC BY-SA 4.0.

## Adding a university

Add `universities/<uni>/` with `university.yaml`, courses, units, programs. Map units to
existing concepts; touching `content/concepts/` should be the exception.
