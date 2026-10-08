// Shared by the unit renderer (Markdown.tsx) and the Anki export (review/anki.ts), so both label a block alike.

/** Container names and their labels; build/schema.py BLOCKS has the same names (lint checks them). */
export const BLOCKS: Record<string, string> = {
  definition: "Definition", theorem: "Theorem", lemma: "Lemma", proposition: "Proposition", corollary: "Corollary",
  proof: "Proof", example: "Example", solution: "Solution", note: "Note", remark: "Remark", caution: "Caution",
  insight: "Key insight", steps: "Steps", equations: "Equations",
  algorithm: "Algorithm", machine: "Machine", trace: "Trace", exercise: "Exercise",
  syntax: "Syntax",
};
