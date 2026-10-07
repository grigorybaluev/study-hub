// What a review session covers (#197): everything (daily review), a course or a term (exam prep), a
// unit or a concept (started from its page), or a roadmap area across courses (interview prep). A scope
// only filters and orders the cards; FSRS still decides what is due. Pure; tests/review-scope.test.mjs.
import type { Card } from "../data/types";

export type Scope =
  | { kind: "all" }
  | { kind: "course"; id: string }         // concordia/STAT280 (a code alone could name two universities' courses)
  | { kind: "term"; index: number }         // a term of the program's default variant, 0-based
  | { kind: "unit"; id: string }            // concordia/STAT280/vectors
  | { kind: "concept"; id: string }
  | { kind: "area"; id: string }            // a roadmap area, study-hub/ds-core/<area>
  | { kind: "before"; index: number };      // what a term's units require: review before it starts

export const ALL: Scope = { kind: "all" };

export function parseScope(q: URLSearchParams): Scope {
  const course = q.get("course"), term = q.get("term"), unit = q.get("unit"), concept = q.get("concept"), area = q.get("area"), before = q.get("before");
  if (course) return { kind: "course", id: course };
  if (term !== null && /^\d+$/.test(term)) return { kind: "term", index: Number(term) };
  if (unit) return { kind: "unit", id: unit };
  if (concept) return { kind: "concept", id: concept };
  if (area) return { kind: "area", id: area };
  if (before !== null && /^\d+$/.test(before)) return { kind: "before", index: Number(before) };
  return ALL;
}

/** The query string that opens /review on a scope ("" for everything). */
export function scopeQuery(s: Scope): string {
  switch (s.kind) {
    case "course": return `?course=${encodeURIComponent(s.id)}`;
    case "term": return `?term=${s.index}`;
    case "unit": return `?unit=${encodeURIComponent(s.id)}`;
    case "concept": return `?concept=${encodeURIComponent(s.id)}`;
    case "area": return `?area=${encodeURIComponent(s.id)}`;
    case "before": return `?before=${s.index}`;
    default: return "";
  }
}

/** What a scope needs from the graph: the courses of a term, the concepts of a roadmap area. */
export interface ScopeContext {
  termCourses(index: number): string[];          // course ids
  areaConcepts(id: string): Set<string>;
  /** concepts the units of a term's courses require (hard): what to have in memory before it starts */
  termRequires(index: number): Set<string>;
  /** courses of the terms before a term: before it, review only what was already taught */
  earlierCourses(index: number): string[];
}

export function inScope(card: Card, s: Scope, ctx: ScopeContext): boolean {
  switch (s.kind) {
    case "all": return true;
    case "course": return card.course === s.id;
    case "term": return ctx.termCourses(s.index).includes(card.course);
    case "unit": return card.unit === s.id;
    case "concept": return card.concepts.includes(s.id);
    case "area": { const k = ctx.areaConcepts(s.id); return card.concepts.some((c) => k.has(c)); }
    case "before": {
      if (!ctx.earlierCourses(s.index).includes(card.course)) return false;
      const k = ctx.termRequires(s.index);
      return card.concepts.some((c) => k.has(c));
    }
  }
}

/** How many of the scope's units after a card's own unit require a concept (exam prep's order). */
export type Weight = (concept: string, after: number) => number;

/** Exam prep: new cards whose concepts the later units require most come first; otherwise the course
 *  order is kept (a stable sort). */
export function examOrder(cards: Card[], weight: Weight): Card[] {
  const w = new Map(cards.map((c) => [c.id, Math.max(0, ...c.concepts.map((k) => weight(k, c.order)))]));
  return [...cards].sort((a, b) => w.get(b.id)! - w.get(a.id)!);
}

/** Cards of a scope, in the order new ones should come: exam order for a course or a term. */
export function scopeCards(cards: Card[], s: Scope, ctx: ScopeContext, weight?: Weight): Card[] {
  const picked = cards.filter((c) => inScope(c, s, ctx));
  return (s.kind === "course" || s.kind === "term") && weight ? examOrder(picked, weight) : picked;
}
