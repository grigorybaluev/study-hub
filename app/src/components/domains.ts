// Concept domains: their order around the maps and their colours.
//
// DOMAIN_COLOR is the original per-domain palette of the Explore views (#155). FIELD_COLOR is the
// palette of DS map 2 (#173): one hue per family of domains, taken from the validated categorical
// palette, so neighbouring families stay apart under protanopia and deuteranopia (worst adjacent
// OKLab ΔE 8.4, normal vision 19.3, light and dark); the domains inside a family are lightness
// steps of its hue (monotone, ΔL >= 0.06). Families are ordered so that the ones that touch around
// the rings (maths, probability and statistics, computing, data, ML, back to maths) are the
// validated neighbours. Identity is never colour alone: every region is labelled.

export const DOMAIN_ORDER = [
  "math.discrete", "math.calculus", "math.linear-algebra", "math.optimization", "probability", "statistics",
  "theory", "algorithms", "programming", "systems", "data", "ml", "ml.deep", "ml.production",
];

export const DOMAIN_COLOR: Record<string, string> = {
  "math.calculus": "#3b6fd6", "math.linear-algebra": "#5b8def", "math.discrete": "#7c5cd6", "math.optimization": "#1f7fb8",
  theory: "#a04fb5", probability: "#d65c8c", statistics: "#d67f3b", programming: "#2f9e7a", algorithms: "#3f8f4f",
  systems: "#7a8a3b", data: "#2f8fa3", ml: "#c9a227", "ml.deep": "#e0a800", "ml.production": "#b5562d",
};

export type Family = "maths" | "probability" | "computing" | "data" | "ml";

export const FAMILY_OF: Record<string, Family> = {
  "math.discrete": "maths", "math.calculus": "maths", "math.linear-algebra": "maths", "math.optimization": "maths",
  probability: "probability", statistics: "probability",
  theory: "computing", algorithms: "computing", programming: "computing", systems: "computing",
  data: "data", ml: "ml", "ml.deep": "ml", "ml.production": "ml",
};

export const FAMILY_LABEL: Record<Family, string> = {
  maths: "Mathematics", probability: "Probability & statistics", computing: "Computing", data: "Data", ml: "Machine learning",
};

export const DOMAIN_LABEL: Record<string, string> = {
  "math.discrete": "Discrete maths", "math.calculus": "Calculus", "math.linear-algebra": "Linear algebra",
  "math.optimization": "Optimization", probability: "Probability", statistics: "Statistics", theory: "Theory of computation",
  algorithms: "Algorithms", programming: "Programming", systems: "Systems", data: "Data management", ml: "Machine learning",
  "ml.deep": "Deep learning", "ml.production": "ML in production",
};

const FIELD_LIGHT: Record<string, string> = {
  "math.discrete": "#0553a4", "math.calculus": "#1d6dca", "math.linear-algebra": "#3c89e9", "math.optimization": "#62a6ff",
  probability: "#9f3964", statistics: "#d56a93",
  theory: "#724d08", algorithms: "#946409", programming: "#b77c07", systems: "#db9404",
  data: "#1baf7a",
  ml: "#9a3501", "ml.deep": "#c84704", "ml.production": "#eb6834",
};

const FIELD_DARK: Record<string, string> = {
  "math.discrete": "#045cb3", "math.calculus": "#1e6fcb", "math.linear-algebra": "#3583e1", "math.optimization": "#4a98f7",
  probability: "#b12f63", statistics: "#db5786",
  theory: "#7e540c", algorithms: "#97640b", programming: "#b07509", systems: "#cb8705",
  data: "#199e70",
  ml: "#a73b07", "ml.deep": "#ca4b13", "ml.production": "#e66534",
};

/** The family base hue (the validated categorical slot), for family-level marks such as region outlines. */
export const FAMILY_COLOR: Record<"light" | "dark", Record<Family, string>> = {
  light: { maths: "#2a78d6", probability: "#e87ba4", computing: "#eda100", data: "#1baf7a", ml: "#eb6834" },
  dark: { maths: "#3987e5", probability: "#d55181", computing: "#c98500", data: "#199e70", ml: "#d95926" },
};

export const NEUTRAL = "#94a3b8";

export function fieldColor(domain: string, theme: "light" | "dark"): string {
  return (theme === "dark" ? FIELD_DARK : FIELD_LIGHT)[domain] ?? NEUTRAL;
}

export function domainIndex(domain: string): number {
  const i = DOMAIN_ORDER.indexOf(domain);
  return i < 0 ? DOMAIN_ORDER.length : i;
}
