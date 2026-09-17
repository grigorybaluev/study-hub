# Issues

Work is tracked as GitHub issues: https://github.com/grigorybaluev/study-hub/issues

This file holds only what is not yet filed.

## Parked until the first postgrad units are authored (from #58)

Both change `build/` and need the schema discussion first.

- lint: warn on case-insensitive duplicate titles or aliases across concepts. The scan
  of 2026-09-17 found four (transition matrix, diagonalization, partition, null); #50
  fixes them by hand, the check would keep them from coming back.
- `DOMAINS` in `build/schema.py` is a closed set. A postgrad extension needs at least
  `math.optimization`, `math.numerical` and `math.geometry` (or `spatial`), and a
  `math.foundations` to take `function` (now in `math.calculus`) and `complex-numbers`
  (now in `math.linear-algebra`). Decide the list when the first unit in one of those
  domains exists, not before.
