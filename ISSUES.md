# Issues

Open questions and deferred work. Move to GitHub issues once `gh` is set up.

## 1. Same-named concepts across domains

Several concept slugs carry one name for ideas that are related but treated as different
things in different domains, and currently share a single node:

- `function` (math: a mapping between sets, MATH 203 / COMP 232) vs `function-definition`
  (programming: a named block of code, COMP 248). Already two nodes, but the naming does not
  make the split obvious, and STAT 280 / COMP 348 reinforce the programming one under the
  same word.
- `recursion`: introduced by COMP 249 (recursive methods) and COMP 232 (recursive definitions
  of functions, sequences and sets) as two perspectives on one node. The logic/maths sense and
  the programming sense may deserve separate nodes with a `generalizes` or `part_of` link.
- Likely others as content grows: `tree` / `graph` (discrete-math objects vs data
  structures), `set` (maths vs collections), `matrix` (linear algebra vs R/Sage objects),
  `vector` (geometry vs R vectors / arrays), `variable`, `relation` (maths vs relational model).

Decide a rule: when is a same-named idea one concept with perspectives, and when is it two
concepts linked by `generalizes` / `part_of`? Candidate test: if a unit can *require* one
sense without the other (e.g. COMP 352 requires the programming `recursion`, COMP 335 the
mathematical one), split; otherwise keep one node with perspectives. Then audit the
vocabulary against that rule and adjust `introduces` / `requires` edges accordingly.

Raised 2026-09-15 while reviewing the concept explorer.
