// What a review session covers (#197): everything (daily review), a course or a term (exam prep), a
// unit or a concept (started from its page), or a roadmap area across courses (interview prep). A scope
// only filters and orders the cards; FSRS still decides what is due. Pure; tests/review-scope.test.mjs.
import type { Card } from "../data/types";

export type Scope =
  | { kind: "all" }
  | { kind: "course"; code: string }       // STAT280
  | { kind: "term"; index: number }         // a term of the program's default variant, 0-based
  | { kind: "unit"; id: string }            // concordia/STAT280/vectors
  | { kind: "concept"; id: string }
  | { kind: "area"; id: string };           // a roadmap area, study-hub/ds-core/<area>

export const ALL: Scope = { kind: "all" };

export function parseScope(q: URLSearchParams): Scope {
  const course = q.get("course"), term = q.get("term"), unit = q.get("unit"), concept = q.get("concept"), area = q.get("area");
  if (course) return { kind: "course", code: course };
  if (term !== null && /^\d+$/.test(term)) return { kind: "term", index: Number(term) };
  if (unit) return { kind: "unit", id: unit };
  if (concept) return { kind: "concept", id: concept };
  if (area) return { kind: "area", id: area };
  return ALL;
}

/** The query string that opens /review on a scope ("" for everything). */
export function scopeQuery(s: Scope): string {
  switch (s.kind) {
    case "course": return `?course=${encodeURIComponent(s.code)}`;
    case "term": return `?term=${s.index}`;
    case "unit": return `?unit=${encodeURIComponent(s.id)}`;
    case "concept": return `?concept=${encodeURIComponent(s.id)}`;
    case "area": return `?area=${encodeURIComponent(s.id)}`;
    default: return "";
  }
}

/** What a scope needs from the graph: the courses of a term, the concepts of a roadmap area. */
export interface ScopeContext {
  termCourses(index: number): string[];          // course ids
  areaConcepts(id: string): Set<string>;
}

export function inScope(card: Card, s: Scope, ctx: ScopeContext): boolean {
  switch (s.kind) {
    case "all": return true;
    case "course": return card.course.endsWith(`/${s.code}`);
    case "term": return ctx.termCourses(s.index).includes(card.course);
    case "unit": return card.unit === s.id;
    case "concept": return card.concepts.includes(s.id);
    case "area": { const k = ctx.areaConcepts(s.id); return card.concepts.some((c) => k.has(c)); }
  }
}

/** Exam prep: new cards whose concepts the course's units require most come first; otherwise the
 *  course order is kept (a stable sort). `weight(concept)` counts the units that require it. */
export function examOrder(cards: Card[], weight: (concept: string) => number): Card[] {
  const w = new Map(cards.map((c) => [c.id, Math.max(0, ...c.concepts.map(weight))]));
  return [...cards].sort((a, b) => w.get(b.id)! - w.get(a.id)!);
}

/** Cards of a scope, in the order new ones should come: exam order for a course or a term. */
export function scopeCards(cards: Card[], s: Scope, ctx: ScopeContext, weight?: (concept: string) => number): Card[] {
  const picked = cards.filter((c) => inScope(c, s, ctx));
  return (s.kind === "course" || s.kind === "term") && weight ? examOrder(picked, weight) : picked;
}
