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
  /** Which unit-page design applies (#89); null until the course is assigned one. */
  pages: "math" | "theory" | "programming" | "systems" | "data" | null;
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
  /** `target` = the data-science work itself (anchors the DS relevance score, #155); a skill inherits its area's role */
  role: "target" | "foundation" | "practice";
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

/** A method graph (content/methods/<id>.yaml, #91): how to choose a method, as a flowchart. */
export interface MethodNode {
  id: string;
  kind: "decision" | "method" | "end";
  label: string;
  concept: string | null;
}

/** A decision's outgoing edges carry the answer ("yes", "no", ...); other edges have none. */
export interface MethodEdge {
  from: string;
  to: string;
  label: string | null;
}

export interface MethodGraph {
  id: string;
  title: string;
  description: string | null;
  start: string;
  nodes: MethodNode[];
  edges: MethodEdge[];
}

export interface Graph {
  meta: { built: string; content_version: string; schema: number; seasons: string[] };
  nodes: GraphNode[];
  edges: Edge[];
  methods: MethodGraph[];
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
  /** authored = the concept's own `requires` says so (#155); derived = through the units that introduce it */
  provenance: "authored" | "derived";
}

/** DS relevance of one concept (#155). */
export type DsTier = "application" | "core" | "supporting" | "peripheral";

export interface DsConcept {
  anchor: boolean;
  tier: DsTier;
  score: number;        // 0..1
  ds_units: number;     // DS units resting on it (hard dependencies, any distance)
  ds_weight: number;    // the same, each weighted 1/distance
  ds_reach: number;     // anchor concepts resting on it
  betweenness: number;
  in_degree: number;
  out_degree: number;
  /** nearest anchor concepts that rest on it */
  via: string[];
}

export interface DsRelevance {
  targets: string[];    // roadmap skills with role target
  anchors: string[];    // concepts mapped to a target skill
  ds_units: string[];   // units introducing an anchor
  core_weight: number;
  concepts: Record<string, DsConcept>;
  /** per course: how many of the concepts it introduces fall in each tier */
  courses: Record<string, Record<DsTier | "concepts", number>>;
}

/** Field relevance of one concept (#173): every concept takes part, whatever a program teaches. */
export interface DsFieldConcept {
  anchor: boolean;
  tier: DsTier;
  score: number;          // 0..1
  field_weight: number;   // sum of 1/distance over the anchor concepts resting on it
  reach: number;          // anchor concepts resting on it
  betweenness: number;
  in_degree: number;
  out_degree: number;
  /** nearest anchor concepts that rest on it */
  via: string[];
  /** "unit" = some unit introduces it; "parent" = covered inside a taught whole it is part_of; null = not taught */
  taught: "unit" | "parent" | null;
  taught_within?: string;
}

export interface DsField {
  targets: string[];
  anchors: string[];
  core_weight: number;
  concepts: Record<string, DsFieldConcept>;
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
  /** over program concepts only: those some unit introduces, requires or reinforces */
  ds_relevance: DsRelevance;
  ds_field: DsField;
}
