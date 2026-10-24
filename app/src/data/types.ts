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
  /** The term calendar its units' `weeks` count in (#221), a key of its university's `terms`. */
  term: string | null;
  /** Its exams in that term (#221): the teaching weeks each covers, from and to. */
  exams: { name: string; date: string; weeks: [number, number] }[];
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
  // `body` is in graph.json but not in the app's copy: scripts/data.mjs moves it to UnitBodies (#189)
}

/** data/units/<university>/<CODE>.json: unit id -> markdown body, for one course (#189). */
export type UnitBodies = Record<string, string>;

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
  /** Term calendars (#221): the Monday of week 1 and the Mondays of break weeks, ISO dates. */
  terms: Record<string, { start: string; breaks: string[] }>;
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

/** Colour tokens shared by maps and prep tables (#255); styles map them to light and dark colours. */
export type Tone = "blue" | "navy" | "sky" | "violet" | "lavender" | "green" | "mint" | "teal" | "forest" | "grey" | "amber";

/** A representation on a map (content/maps/<id>.yaml, #255), boxed on the map's authored canvas. */
export interface MapNode {
  id: string;
  label: string;
  /** small caps line under the label */
  sub: string | null;
  concept: string | null;
  tone: Tone;
  /** an intermediate or helper representation: drawn dashed */
  aux: boolean;
  /** x, y, width, height on the canvas */
  box: [number, number, number, number];
  /** markdown: what it is */
  text: string | null;
  /** markdown: what is easy in this representation */
  easy: string | null;
}

/** A method between two representations. `n` is the number (or letter) the map shows. */
export interface MapEdge {
  id: string;
  n: string;
  from: string;
  to: string;
  kind: "algorithm" | "reversal" | "design" | "free";
  cost: "free" | "same" | "shrinks" | "linear" | "design" | "explodes";
  /** the method runs both ways (drawn double-headed) */
  both: boolean;
  name: string;
  /** markdown: the line under the name on the map */
  short: string | null;
  /** where the map's label sits: x, y, width and alignment; null = beside the arrow's middle */
  label: [number, number, number, ("left" | "right" | "center")?] | null;
  /** SVG path on the canvas; null = a straight line between the two boxes */
  path: string | null;
  /** markdown: the steps to show, what it does to the size, when to use it, its trap */
  steps: string;
  size: string | null;
  when: string;
  trap: string | null;
}

export interface MapRoute {
  task: string;
  /** node ids, each pair joined by an edge */
  path: string[];
  why: string | null;
}

/** One step of a map's worked example: at a node (the language in that representation) or along an edge. */
export interface MapExampleStep {
  node?: string;
  edge?: string;
  text: string;
  /** an inline automaton spec for the drawing (as in ```automaton blocks) */
  automaton?: Record<string, unknown>;
}

export interface ConversionMap {
  id: string;
  title: string;
  description: string | null;
  canvas: [number, number];
  nodes: MapNode[];
  edges: MapEdge[];
  routes: MapRoute[];
  example: { title: string; language?: string; walk: MapExampleStep[] } | null;
}

export type PrepSection = "overview" | "types" | "table" | "map" | "plan";

/** graph.json's entry for an exam prep (#255); the rest is in data/prep/<id>.json (`Prep`). */
export interface PrepIndex {
  /** `<university>/<CODE>/<exam slug>` */
  id: string;
  course: string;
  /** the exam's name as in the course's `exams` */
  exam: string;
  date: string;
  title: string;
  summary: string;
  sections: PrepSection[];
}

export interface PrepType {
  slug: string;
  title: string;
  order: number;
  /** what the problem asks, one line */
  asks: string;
  units: string[];
  method: string | null;
  body: string;
}

export interface PrepTable {
  title: string | null;
  lead: string | null;
  columns: { id: string; title: string; sub: string | null; tone: Tone; concept: string | null }[];
  /** cells by column id, markdown */
  rows: { label: string; cells: Record<string, string> }[];
  /** rows that hold for every column */
  shared: { label: string; text: string }[];
}

/** data/prep/<id>.json: one study guide for one exam (#255). */
export interface Prep extends Omit<PrepIndex, "sections"> {
  format: string | null;
  maps: string[];
  overview: string | null;
  types: PrepType[];
  table: PrepTable | null;
  plan: { id: string; title: string; items: string[] }[];
}

export interface Graph {
  meta: { built: string; content_version: string; schema: number; seasons: string[] };
  nodes: GraphNode[];
  edges: Edge[];
  methods: MethodGraph[];
  maps: ConversionMap[];
  preps: PrepIndex[];
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
  /** program concepts mapped to the skill: some unit introduces, requires or reinforces them */
  concepts: string[];
  missing: string[];
  /** concepts mapped to the skill that no unit touches (#173): the field the program does not reach */
  field_concepts: string[];
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

// ---------------------------------------------------------------- cards.json (build/build_cards.py, #191)

/** A review card derived from a unit block; ids leave out the unit, so units can be renamed freely. */
export interface Card {
  /** `<course>/<kind>/<slug>`, e.g. `concordia/STAT280/definition/data-frame` */
  id: string;
  kind: "definition" | "theorem" | "lemma" | "proposition" | "corollary" | "steps" | "caution" | "insight" | "eq"
    | "output" | "method" | "exercise";   // quizzes (#196): "what does this print?", "which method?", an exercise
  /** markdown: the prompt ("Data frame", "How: Rejection sampling", "Key idea: Lists"; an exercise's question) */
  front: string;
  /** markdown: the block body (a statement without its proof; an equation line's formula; an exercise's solution) */
  back: string;
  course: string;
  /** the unit it comes from; "" for a quiz from the solution-map gallery (see `link`) */
  unit: string;
  /** where a card from outside a unit is taught (a method quiz: /design/solution-map) */
  link?: string;
  /** a method quiz: the method graph's method nodes, and the index of the one the worked solution reaches */
  options?: string[];
  answer?: number;
  /** every option the worked solution uses (a path can pass two methods); `answer` is the first */
  accepted?: number[];
  /** the unit's teaching order */
  order: number;
  /** heading id of the part the block sits in (the unit page's `?part=`), and its text */
  part: string | null;
  part_title: string | null;
  concepts: string[];
  /** first 8 hex digits of sha1(front + back): a change marks the card "updated" */
  hash: string;
}

export interface CardsFile {
  meta: { content_version: string; schema: number };
  cards: Card[];
}
