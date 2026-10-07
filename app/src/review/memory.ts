// Memory on the map and the pages (#197): the colours of the mastery tiers (the same as the stats page's
// bars), and the concept mastery read from this device's review log, for whoever shows it.
import { useMemo } from "react";
import { conceptMastery, tierCounts } from "./days";
import type { Tier } from "./engine";
import { useReviewData } from "./useDeck";

export const TIER_COLOR: Record<Tier, string> = {
  new: "#a9a497", learning: "#a98fdc", bronze: "#c4834a", silver: "#8d99a8", gold: "#d4a419", diamond: "#4fa3e6",
};
/** a concept with no card: no colour of its own */
export const NO_CARDS = { light: "#d9d6cd", dark: "#3c3f47" };

export interface Memory {
  /** per concept with cards: its tier, and how many of its cards were seen */
  concepts: Map<string, { tier: Tier; cards: number; seen: number }>;
  /** cards per tier, per course with cards */
  courses: Map<string, Record<Tier, number>>;
}

/** This device's memory of every concept and course that has cards; null while loading. */
export function useMemory(): Memory | null {
  const { st } = useReviewData();
  return useMemo(() => {
    if (!st) return null;
    const courses = new Map<string, Record<Tier, number>>();
    for (const c of new Set(st.cards.map((x) => x.course))) {
      courses.set(c, tierCounts(st.engine, st.cards.filter((x) => x.course === c).map((x) => x.id)));
    }
    return { concepts: conceptMastery(st.engine, st.cards), courses };
  }, [st]);
}
