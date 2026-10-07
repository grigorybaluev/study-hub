// The graph behind review scopes (#197): a term's courses (the program's default variant), a roadmap
// area's concepts (mapped to the area or to one of its skills), how many units of a course require a
// concept (exam prep's order), and a scope's name.
import { defaultVariantId, edgesIn, edgesOut, node, type Data } from "../data/load";
import type { ConceptNode, CourseNode, RoadmapSkillNode, UnitNode } from "../data/types";
import type { Scope, ScopeContext, Weight } from "./scope";

export interface Scopes extends ScopeContext {
  /** units of these courses that require a concept (hard), later than a given unit order */
  weight(courses: string[]): Weight;
  label(s: Scope): string;
  /** the courses a course or term scope covers (for the weight) */
  courses(s: Scope): string[];
  terms: { index: number; label: string; courses: string[] }[];
  areas: RoadmapSkillNode[];
}

export function scopes(d: Data): Scopes {
  const program = d.programs[0];
  const variant = program?.variants.find((v) => v.id === defaultVariantId(program));
  const terms = (variant?.terms ?? []).filter((t) => t.courses?.length).map((t) => ({
    index: t.index, label: `Term ${t.index + 1} · year ${t.year}, ${t.season}`, courses: t.courses ?? [],   // year of study, not calendar
  }));
  const areas = d.skills.filter((s) => s.level === "area" && s.roadmap.endsWith("/ds-core"));
  const areaCache = new Map<string, Set<string>>();
  const areaConcepts = (id: string) => {
    if (!areaCache.has(id)) {
      const targets = [id, ...d.skills.filter((s) => s.parent === id).map((s) => s.id)];
      areaCache.set(id, new Set(targets.flatMap((t) => edgesIn(d, t, "maps_to").map((e) => e.from))));
    }
    return areaCache.get(id)!;
  };
  const termCourses = (index: number) => terms.find((t) => t.index === index)?.courses ?? [];
  return {
    termCourses, areaConcepts, terms, areas,
    courses: (s) => s.kind === "course" ? [s.id] : s.kind === "term" ? termCourses(s.index) : [],
    weight(courses) {
      const orders = new Map<string, number[]>();             // concept -> orders of the units requiring it
      for (const c of courses) for (const u of d.unitsOf.get(c) ?? []) {
        for (const e of edgesOut(d, u.id, "requires")) {
          if ((e.strength ?? "hard") === "hard") orders.set(e.to, [...(orders.get(e.to) ?? []), u.order]);
        }
      }
      return (k, after) => (orders.get(k) ?? []).filter((o) => o > after).length;
    },
    label(s) {
      switch (s.kind) {
        case "all": return "All cards";
        case "course": { const c = node<CourseNode>(d, s.id); return c ? `${c.code} · ${c.title}` : s.id; }
        case "term": return terms.find((t) => t.index === s.index)?.label ?? `Term ${s.index + 1}`;
        case "unit": { const u = node<UnitNode>(d, s.id); const c = u && node<CourseNode>(d, u.course); return u ? `${c?.code ?? ""} · ${u.title}` : s.id; }
        case "concept": return node<ConceptNode>(d, s.id)?.title ?? s.id;
        case "area": return `Interview prep · ${node<RoadmapSkillNode>(d, s.id)?.title ?? s.id}`;
      }
    },
  };
}
