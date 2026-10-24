// Ticked checklist items of exam preps (#260), kept with the review log so they travel in the progress
// file (#193). One entry per item: whether it is ticked and when that last changed, so that merging two
// devices keeps the newer change of each item (unticking on one device beats an older tick elsewhere).
// Pure; tests/review-ticks.test.mjs.

export type Ticks = Record<string, { on: boolean; at: number }>;

/** The ticks in a store's meta (or a file), dropping anything malformed. */
export function ticksOf(v: unknown): Ticks {
  const out: Ticks = {};
  if (!v || typeof v !== "object") return out;
  for (const [k, t] of Object.entries(v as Record<string, unknown>)) {
    const x = t as { on?: unknown; at?: unknown };
    if (x && typeof x.on === "boolean" && Number.isFinite(x.at)) out[k] = { on: x.on, at: Number(x.at) };
  }
  return out;
}

/** An item's key: the prep, its list and the item's text as a slug, so reordering a list keeps the ticks. */
export function tickKey(prep: string, list: string, item: string): string {
  const slug = item.toLowerCase().replace(/\$[^$]*\$/g, (m) => m.replace(/[^a-z0-9]+/g, "")).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `${prep}/${list}/${slug.slice(0, 80)}`;
}

/** Both sets of ticks, the newer change winning for an item in both. */
export function mergeTicks(a: Ticks, b: Ticks): Ticks {
  const out: Ticks = { ...a };
  for (const [k, t] of Object.entries(b)) if (!out[k] || t.at > out[k].at) out[k] = t;
  return out;
}

/** How many of these keys are ticked. */
export function countOn(ticks: Ticks, keys: string[]): number {
  return keys.filter((k) => ticks[k]?.on).length;
}
