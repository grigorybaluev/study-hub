# study-hub

Open study hub for Concordia's BCompSc Data Science program: a concept-level knowledge
graph of the curriculum, cross-linked to a data-science skill roadmap, with analytics on
course dependencies and gaps, and the course notes themselves with interactive examples.

Live site: https://grigorybaluev.github.io/study-hub/

- `content/` — the source of truth: concepts, courses, units, program variants, roadmap
  (markdown/YAML, CC BY-SA 4.0)
- `build/` — lint, graph build, derived analytics (Python, no dependencies beyond PyYAML)
- `analytics/` — markdown report generator
- `app/` — the static site (Vite + React + TypeScript + Cytoscape)

## Run

```
python -m venv .venv && .venv/bin/pip install -r requirements.txt
nvm use && cd app && npm install
npm run dev          # lints content, builds graph.json/derived.json, starts the site
```

## Release

`main` is never deployed on its own. Cutting a GitHub release builds the site in Actions
and publishes it to GitHub Pages:

```
gh release create vX.Y.Z --generate-notes
```

See `CLAUDE.md` for the data model and authoring rules.
