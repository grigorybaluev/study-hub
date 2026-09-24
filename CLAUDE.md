# CLAUDE.md

Concept-level knowledge graph of a CS Data Science curriculum, cross-linked to a
data-science skill roadmap, with analytics on course dependencies and gaps.
Content is authored as markdown/YAML; the graph is a build artifact; the site is static.

## Layout

```
content/
  concepts/<slug>.md                  global concept vocabulary (shared by all universities)
  roadmaps/<roadmap>.yaml             skill roadmaps: areas -> skills (ds-core is our own)
  universities/<uni>/
    university.yaml                   name, assumed_prior courses, sources
    courses/<CODE>.md                 catalog entry: credits, kind, official prereqs/coreqs
    units/<CODE>/<slug>.md            unit content + authored edges (frontmatter)
    programs/<program>.yaml           variants -> terms -> courses (placements only)
    programs/local/                   personal plans, same shape, git-ignored
build/    schema.py, build_graph.py, derive.py, lint.py   -> graph.json, derived.json (never hand-edited)
analytics/ report generator and notebooks
app/      Vite + React + TS + Cytoscape.js, reads graph.json and derived.json
app/src/sims/   simulation engines (simulations.js, automata.js) + registry.yaml checked by lint
```

## Commands

```
python build/lint.py           # validate content; run before every commit
python build/build_graph.py    # content -> graph.json
python build/derive.py         # graph.json -> derived.json
python analytics/report.py     # derived.json -> analytics/report.md
cd app && npm run dev        # runs the pipeline first (npm run data), then Vite
```

Node via nvm (`nvm use`, .nvmrc = 24); Python via `.venv` (3.12). The app's `npm run data`
runs lint -> build_graph -> derive and copies the JSON into app/public/data/.

## Graph model

Nodes: Concept, Unit, Course, Program (with variants), RoadmapNode, University.
IDs: concepts are global slugs (`conditional-probability`); everything else is namespaced
(`concordia/COMP232`, `concordia/MAST218/parametric-curves`,
`study-hub/ds-core/linear-algebra`).

Authored edges (the only ones humans write, in unit/concept/course frontmatter):
- `unit introduces concept` — entry is a slug or `{concept, perspective}`; several units
  (in different courses) may introduce the same concept, each from its own perspective
- `unit requires concept` with `strength: hard | soft`
- `unit reinforces concept` — slug or `{concept, perspective}`
- `concept generalizes | part_of concept`; `concept maps_to roadmapNode`
- `course prereq | coreq course` (official calendar)

Derived (rebuilt by `derive.py`): `unit depends_on unit` (every introducer of a required
concept; same-course edges flagged), `concept depends_on concept` (B on A when a unit
introducing B requires A), `course uses course` (weighted), `course covers roadmapNode`,
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
- The vocabulary serves the whole roadmap and its postgrad reach, not one program: when
  judging whether a part is "required on its own", count units that could plausibly be
  written later (optimization, numerical methods, ML, spatial), not only the ones filed.

Naming (slugs are global and un-namespaced; `domain` is metadata, not part of the ID)
- A bare single-word slug is fine when the word has one dominant meaning across the
  roadmap's reach (`matrix`, `gradient`, `recursion`, `queue`).
- When the concept is the *narrow* meaning of a word that means something else elsewhere
  in the roadmap, the slug carries the qualifier, Wikipedia-style (`database-normalization`,
  `conditional-statement`); the bare word stays free for the general concept.
- Aliases are search terms and may repeat across concepts, but a word that names different
  objects gets a parenthetical on both sides ("transition matrix (Markov)",
  "change-of-basis matrix").
- Probability quantities keep the plain name (`expected-value`, `variance`); statistics
  estimators take `sample-` (`sample-mean`, `sample-variance`).
- The same object under two course-specific names is one concept; the other name is an
  alias (null space / kernel).
- `short` is an optional display name, unique across concepts; `wikipedia` is the English
  article title, with its parenthetical disambiguator when the meaning is not the
  article's primary one ("Kernel (linear algebra)"); `wikidata` is the Q-id.

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
- `review: draft` (default) | `reviewed` records the owner's editing pass, separate from
  `status` (which records the source). Only the owner flips a unit to `reviewed`.
- Every course the student has taken gets units, at least coarse concept-introducing
  ones, so every required concept has an introducer.
- Body conventions: `## part` per topic, `###` sub-part, nothing deeper; LaTeX in
  `$…$`/`$$…$$`; blocks as fenced containers `:::name[Title]` … `:::` (definition, theorem,
  lemma, proposition, corollary, proof, example, solution, note, remark, caution, insight,
  steps, equations; names in `build/schema.py` BLOCKS), nested with more colons on the outer
  (`::::example` around `:::solution`); fenced code with a language; `## Further reading`.
  A course's `pages:` field (`math | programming | systems | data`) picks the unit-page
  design; each kind's rules and specimens are one page, `app/src/design/<kind>.md`, served
  at `/design/<kind>`. Change the design there first. Legacy `> **Label.**` callouts still
  render; `scripts/convert_callouts.py <COURSE>` converts them (lint lists what is left).
  Interactive examples are ```` ```sim ```` fenced YAML blocks (`id`, `controls`, `note`, or
  `custom: true` + `mode` for automata) placed where they belong in the text; lint checks
  ids against `app/src/sims/registry.yaml`. A ```` ```python ```` block placed directly after
  a sim block (only blank lines between) is that sim's code: it renders collapsed under the
  sim as "Show Python code". `verified: [interface, content]` in a sim block records the two
  hand checks of #93 (each only after it was actually done); until both are there the sim
  shows "Needs verification". Lecture notes are written directly into units.

Courses and programs
- `kind: core | assumed_prior | external`. Assumed-prior courses (MATH 203/204/205) have
  coarse units; external alternates (COEN 231 …) are stubs with no units.
- Prereqs are OR-groups (`[[COMP232, COEN231], [COMP249, COEN244]]`); coreqs mean
  "prior or concurrent"; free-text requirements go in `requirements:` (not edges).
- Variants hold term placements only; prereqs live in `courses/`.

## Workflow

- Every piece of work is a GitHub issue first (templates: content, build; extra labels
  `finding` for a lint/derive result that needs a decision, `tracking` for a checklist
  umbrella whose child issues do the work). One issue = one thing reviewable in a
  sitting. `ISSUES.md` holds only what is not yet filed.
- Branch per issue off `main`: `content/<n>-<slug>`, `feat/<n>-<slug>`, `fix/<n>-<slug>`,
  `chore/<n>-<slug>`. Never commit to `main` directly (branch protection requires a PR
  with green CI).
- Discuss the plan before code for anything touching `build/`, the graph/derived JSON
  shape, or `app/src/data/types.ts` (that file mirrors the Python output; change both).
  Content-only passes can go straight to implementation.
- Commits: one logical change each, message says what and why; if it needs "and", split.
  The pre-commit hook runs `lint.py` (enable once: `git config core.hooksPath .githooks`).
- PR per branch using the template: what, why, how it was verified (lint/build output,
  screenshots of the app), what was left out. Run `/code-review` before opening it.
  CI runs lint -> build_graph -> derive -> report and `npm run build`.
- Merge when CI is green with `gh pr merge <n> --squash --delete-branch` (the PR title and
  body become the history, so branch commits need not be tidy); then
  `git switch main && git pull` before the next branch.
- Releases: `main` is never deployed by itself. `gh release create vX.Y.Z --generate-notes`
  runs `.github/workflows/deploy.yml`, which builds the app and publishes `app/dist` to
  GitHub Pages (https://grigorybaluev.github.io/study-hub/). The site is built only in
  Actions, never from a laptop, so git-ignored personal plans cannot leak into it.
  Releases are cut from `main` only: the workflow refuses a tag whose commit is not on
  `main`, and tag rulesets make `v*` tags owner-created and immutable (undoing a release
  means disabling the "release tags: immutable" ruleset in Settings first).

## Content rules

- Own words only. No lecture slides, textbook figures, or copied problem sets.
- Attributed CC BY-SA 4.0 text (a Wikipedia summary) may be *displayed* by the app, fetched
  at view time with the article link and licence named; it is never pasted into `content/`.
- Roadmaps are authored here (CC BY-SA). roadmap.sh's content is under a personal-use-only
  licence: link to it as a reference, never reproduce its titles or structure.
- Code is MIT; everything under `content/` is CC BY-SA 4.0.

## Adding a university

Add `universities/<uni>/` with `university.yaml`, courses, units, programs. Map units to
existing concepts; touching `content/concepts/` should be the exception.
