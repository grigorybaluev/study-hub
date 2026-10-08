// The graph behind review scopes (#197): a term's courses (the program's default variant), a roadmap
// area's concepts (mapped to the area or to one of its skills), how many units of a course require a
// concept (exam prep's order), and a scope's name.
import { defaultVariantId, edgesIn, edgesOut, node, type Data } from "../data/load";
import type { Card, ConceptNode, CourseNode, RoadmapSkillNode, UniversityNode, UnitNode } from "../data/types";
import type { Scope, ScopeContext, Weight } from "./scope";
import { covers, localDate, taught, type Calendar, type Exam } from "./term";

export interface Scopes extends ScopeContext {
  /** units of these courses that require a concept (hard), later than a given unit order */
  weight(courses: string[]): Weight;
  label(s: Scope): string;
  /** the courses a course or term scope covers (for the weight) */
  courses(s: Scope): string[];
  terms: { index: number; label: string; courses: string[] }[];
  areas: RoadmapSkillNode[];
  /** every exam of every course with a term (#221) */
  exams: Exam[];
  /** a unit's teaching weeks */
  unitWeeks(unit: string): number[];
  /** whether a card's unit has been taught by `now` (always, without a calendar) */
  isTaught(card: Card, now: number): boolean;
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
  /** hard requires of these courses' units: (concept, unit order) pairs */
  const hardRequires = (courses: string[]) => courses.flatMap((c) => (d.unitsOf.get(c) ?? []).flatMap((u) =>
    edgesOut(d, u.id, "requires").filter((e) => (e.strength ?? "hard") === "hard").map((e) => ({ concept: e.to, order: u.order }))));
  const earlierCourses = (index: number) => terms.filter((t) => t.index < index).flatMap((t) => t.courses);
  const requiresCache = new Map<number, Set<string>>();
  const termRequires = (index: number) => {
    if (!requiresCache.has(index)) requiresCache.set(index, new Set(hardRequires(termCourses(index)).map((r) => r.concept)));
    return requiresCache.get(index)!;
  };
  // the term calendar (#221): a course's `term` in its university's `terms`
  const calendarOf = (course: string): Calendar | null => {
    const c = node<CourseNode>(d, course);
    return (c?.term && node<UniversityNode>(d, c.university)?.terms?.[c.term]) || null;
  };
  const unitWeeks = (unit: string) => node<UnitNode>(d, unit)?.weeks ?? [];
  const exams: Exam[] = d.courses.filter((c) => c.exams?.length)
    .flatMap((c) => c.exams.map((e, index) => ({ course: c.id, index, name: e.name, date: localDate(e.date), weeks: e.weeks })));
  const examCovers = (course: string, index: number, unit: string) => {
    const e = exams.find((x) => x.course === course && x.index === index);
    return !!e && covers(e, unitWeeks(unit));
  };
  return {
    termCourses, areaConcepts, termRequires, earlierCourses, terms, areas, exams, unitWeeks, examCovers,
    isTaught: (card, now) => !card.unit || taught(calendarOf(card.course), unitWeeks(card.unit), now),
    courses: (s) => s.kind === "course" ? [s.id] : s.kind === "term" ? termCourses(s.index) : s.kind === "exam" ? [s.course] : [],
    weight(courses) {
      const orders = new Map<string, number[]>();             // concept -> orders of the units requiring it
      for (const r of hardRequires(courses)) orders.set(r.concept, [...(orders.get(r.concept) ?? []), r.order]);
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
        case "before": return `Before ${terms.find((t) => t.index === s.index)?.label ?? `term ${s.index + 1}`}`;
        case "exam": {
          const c = node<CourseNode>(d, s.course), e = c?.exams?.[s.index];
          return e ? `${c!.code} · ${e.name} · ${new Date(localDate(e.date)).toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" })}` : s.course;
        }
      }
    },
  };
}
