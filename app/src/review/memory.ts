// Memory on the map and the pages (#197): the one place the tier colours are defined (the map, the
// course bars, the stats page and the rings all read them), and the mastery read from this device's log.
import { useMemo } from "react";
import type { Card } from "../data/types";
import { conceptMastery, tierCounts } from "./days";
import { TIER_RANK, type Engine, type Tier } from "./engine";
import { useReviewData } from "./useDeck";

export const TIER_COLOR: Record<Tier, string> = {
  new: "#7f8ba0",          // cards not seen yet: slate, apart from "no cards"
  learning: "#b39ce6",     // lavender: not a metal, unlike the tiers after it
  bronze: "#c4834a", silver: "#8d99a8", gold: "#d9ab25", diamond: "#4fa3e6",
};
/** a concept with no card: barely there */
export const NO_CARDS = { light: "#e4e1d8", dark: "#34373e" };

export interface Memory {
  /** per concept with cards: its tier, and how many of its cards were seen */
  concepts: Map<string, { tier: Tier; cards: number; seen: number }>;
  /** cards per tier, per course with cards */
  courses: Map<string, Record<Tier, number>>;
  /** concepts with cards at Silver or above */
  silverPlus: number;
  cards: Card[];
}

/** Pure: the memory of every concept and course with cards. */
export function memoryOf(engine: Engine, cards: Card[]): Memory {
  const courses = new Map<string, Record<Tier, number>>();
  const byCourse = new Map<string, string[]>();
  for (const c of cards) byCourse.set(c.course, [...(byCourse.get(c.course) ?? []), c.id]);
  for (const [course, ids] of byCourse) courses.set(course, tierCounts(engine, ids));
  const concepts = conceptMastery(engine, cards);
  const silverPlus = [...concepts.values()].filter((c) => TIER_RANK[c.tier] >= TIER_RANK.silver).length;
  return { concepts, courses, silverPlus, cards };
}

// one replay per state of the log, shared by the pages that show memory
let cached: { key: string; memory: Memory } | null = null;

/** This device's memory (null while loading); `enabled: false` loads nothing (a map in domain colours). */
export function useMemory(enabled = true): { memory: Memory | null; error?: string } {
  const { st, error } = useReviewData(enabled);
  const memory = useMemo(() => {
    if (!st) return null;
    const last = st.engine.log[st.engine.log.length - 1];
    const key = `${st.engine.log.length}:${last?.id ?? ""}:${st.cards.length}`;
    if (cached?.key !== key) cached = { key, memory: memoryOf(st.engine, st.cards) };
    return cached.memory;
  }, [st]);
  return { memory, error };
}
