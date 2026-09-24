// Types mirroring graph.json (build/build_graph.py) and derived.json (build/derive.py).
// If the Python side changes shape, change it here too — this file is the contract.

export type NodeType = "concept" | "course" | "unit" | "program" | "university" | "roadmap" | "roadmap_node";

export interface ConceptNode {
  id: string;
  type: "concept";
  title: string;
  domain: string;
  aliases: string[];
  body: string;
  short?: string;      // unique display name, when the title is too long for dense views
  wikipedia?: string;  // English article title, with its disambiguator if any
  wikidata?: string;   // Q-id
}

export interface CourseNode {
  id: string;
  type: "course";
  university: string;
  code: string;
  title: string;
  credits: number;
  kind: "core" | "assumed_prior" | "external";
  requirements: string[];
  source: string | null;
  body: string;
}

export interface UnitNode {
  id: string;
  type: "unit";
  course: string;
  title: string;
  order: number;
  kind: "teaching" | "review";
  status: "detailed" | "outline" | "planned";
  review: "draft" | "reviewed";
  weeks: number[];
  textbook: string | null;
  notes: string[] | null;
  /** Sim blocks in the body and how many carry each `verified:` check; verified = both. */
  sims: { total: number; interface: number; content: number; verified: number };
  body: string;
}

export interface Term {
  index: number;
  year: number;
  season: "fall" | "winter" | "summer";
  courses?: string[];
  electives?: number;
  work_term?: number;
}

export interface Variant {
  id: string;
  name: string | null;
  entry: string | null;
  coop: boolean;
  terms: Term[];
}

export interface ProgramNode {
  id: string;
  type: "program";
  university: string;
  name: string;
  source: string | null;
  variants: Variant[];
}

export interface UniversityNode {
  id: string;
  type: "university";
  name: string;
  assumed_prior: string[];
  sources: { id: string; title: string; url: string; retrieved?: string }[];
}

export interface RoadmapNode {
  id: string;
  type: "roadmap";
  title: string;
  source: string | null;
  description: string | null;
  references: { title: string; url: string }[];
}

export interface RoadmapSkillNode {
  id: string;
  type: "roadmap_node";
  roadmap: string;
  level: "area" | "skill";
  title: string;
  summary?: string | null;
  refs?: string[];
  parent: string | null;
  order: number[];
}

export type GraphNode =
  | ConceptNode | CourseNode | UnitNode | ProgramNode | UniversityNode | RoadmapNode | RoadmapSkillNode;

export type EdgeType =
  | "introduces" | "requires" | "reinforces" | "generalizes" | "part_of" | "maps_to" | "prereq" | "coreq";

export interface Edge {
  from: string;
  to: string;
  type: EdgeType;
  provenance: "authored" | "official" | "derived";
  strength?: "hard" | "soft";
  perspective?: string | null;
  group?: number;
}

export interface Graph {
  meta: { built: string; content_version: string; schema: number; seasons: string[] };
  nodes: GraphNode[];
  edges: Edge[];
}

// ---------------------------------------------------------------- derived.json

export interface ConceptIndex {
  introduced_by: string[];
  reinforced_by: string[];
  required_by: { unit: string; strength: "hard" | "soft" }[];
  perspectives: { unit: string; role: "introduces" | "reinforces"; perspective: string | null }[];
}

export interface UnitDependsOn {
  from: string;
  to: string;
  via: string[];
  strength: "hard" | "soft";
  same_course: boolean;
}

export interface ConceptDependsOn {
  from: string;
  to: string;
  weight: number;
  strength: "hard" | "soft";
  via_units: string[];
}

export interface CourseUses {
  from: string;
  to: string;
  weight: number;
  hard: number;
  soft: number;
  via: string[];
}

export interface Unmet {
  concept: string;
  required_by: string[];
  strength: "hard" | "soft";
  reason: string;
}

export interface Debt {
  concept: string;
  unit: string;
  strength: "hard" | "soft";
  introduced_in_term: number | null;
  same_term: boolean;
  introducer: string | null;
}

export interface VariantTerm extends Term {
  introduced?: string[];
  debt?: Debt[];
}

export interface VariantAnalysis {
  program: string;
  variant: string;
  terms: VariantTerm[];
  reteach: { concept: string; first: string; again: string; terms_apart: number }[];
}

export type SkillStatus = "covered" | "thin" | "partial" | "gap" | "unmapped";

export interface SkillCoverage {
  area: string;
  title: string;
  order: number[];
  status: SkillStatus;
  concepts: string[];
  missing: string[];
  courses: string[];
  first_term: Record<string, number | null>;
}

export interface Derived {
  meta: { content_version: string; graph_built: string; schema: number };
  concepts: Record<string, ConceptIndex>;
  unit_depends_on: UnitDependsOn[];
  concept_depends_on: ConceptDependsOn[];
  course_uses: CourseUses[];
  unmet: Unmet[];
  variants: Record<string, VariantAnalysis>;
  roadmap_coverage: Record<string, { skills: Record<string, SkillCoverage>; summary: Record<string, number> }>;
}
