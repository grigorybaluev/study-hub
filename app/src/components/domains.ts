// Concept domains: their order around the maps and their colours.
//
// DOMAIN_COLOR is the original per-domain palette of the Explore views (#155). FIELD_COLOR is the
// palette of the DS Concept Map (#173): one hue per family of domains, taken from the validated categorical
// palette, so neighbouring families stay apart under protanopia and deuteranopia (worst adjacent
// OKLab ΔE 8.4, normal vision 19.3, light and dark); the domains inside a family are lightness
// steps of its hue (monotone, ΔL >= 0.06). Families are ordered so that the ones that touch around
// the radial map (maths, probability and statistics, computing, data, ML, back to maths) are the
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

// ---------------------------------------------------------------- titles
/** Typeface for domain titles: a DIN-style face, stricter than the UI sans (system fonts, no download). */
export const TITLE_FONT = '"DIN Alternate", "DIN Condensed", Bahnschrift, "D-DIN", "Barlow Semi Condensed", "Roboto Condensed", "Arial Narrow", sans-serif';

const CANVAS_BG = { light: "#ffffff", dark: "#1a1d22" };

const toLin = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const fromLin = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
const rgbOf = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
const luminance = (hex: string) => { const [r, g, b] = rgbOf(hex).map(toLin); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const contrast = (a: string, b: string) => { const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); };

function toOklch(hex: string): [number, number, number] {
  const [r, g, b] = rgbOf(hex).map(toLin);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const q = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * q;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * q;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * q;
  return [L, Math.hypot(A, B), Math.atan2(B, A)];
}

function fromOklch(L: number, C: number, H: number): string {
  const A = C * Math.cos(H), B = C * Math.sin(H);
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const q = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
  const rgb = [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * q, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * q, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * q];
  return "#" + rgb.map((v) => Math.round(Math.max(0, Math.min(1, fromLin(v))) * 255).toString(16).padStart(2, "0")).join("");
}

/** The colour itself when it reads as large text on the canvas (3:1); otherwise the nearest shade of the
 *  same hue that does — darker in light mode, lighter in dark mode. */
function readable(hex: string, theme: "light" | "dark"): string {
  const bg = CANVAS_BG[theme];
  if (contrast(hex, bg) >= 3) return hex;
  const [L, C, H] = toOklch(hex);
  for (let k = 1; k <= 60; k++) {
    const next = fromOklch(Math.max(0, Math.min(1, L + (theme === "light" ? -0.01 : 0.01) * k)), C, H);
    if (contrast(next, bg) >= 3) return next;
  }
  return theme === "light" ? "#1a1a2e" : "#e6e6e3";
}

/** Colour of a domain's title: the domain's own colour, kept readable. */
export function titleColor(domain: string, theme: "light" | "dark"): string {
  return readable(fieldColor(domain, theme), theme);
}

/** Colour of a family's title: the family hue, kept readable. */
export function familyTitleColor(family: Family, theme: "light" | "dark"): string {
  return readable(FAMILY_COLOR[theme][family], theme);
}
