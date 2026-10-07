// Rewards (#195), the rule: they follow effort and real memory, never the grade pressed. Every grade gets
// the same feedback (the swipe, the +1, the ring). Only two moments depend on the card, and both are
// earned over time rather than by pressing Good: a level-up (FSRS stability crossed a tier, which only
// grows across real intervals) and a comeback (a card forgotten after it was learned, now recalled).
// Pure logic, tested in node (tests/review-rewards.test.mjs).
// `.ts` on purpose: node runs this file directly in the tests (and Vite reads it either way)
import { TIER_RANK, type CardState, type Rating, type Tier } from "./engine.ts";
export const TIER_NAME: Record<Tier, string> = {
  new: "New", learning: "Learning", bronze: "Bronze", silver: "Silver", gold: "Gold", diamond: "Diamond",
};

export interface GradeReward {
  /** every grade: the same +1, whatever the rating */
  point: 1;
  /** the tier the card reached, when this grade lifted it to Bronze or above */
  levelUp: Tier | null;
  /** a lapsed card (forgotten after it was learned) recalled again, with any grade but Again */
  comeback: boolean;
}

/** What a grade earns, from the card's state and tier before it and its tier after. A level-up needs a
 *  card that was already in review, recalled after a real interval: Easy on a new card jumps straight to a
 *  long interval, and rewarding that would reward the button, not the memory. */
export function rewardOf(before: { state: CardState | null; tier: Tier }, after: { tier: Tier }, rating: Rating): GradeReward {
  const up = before.state?.state === "review" && TIER_RANK[after.tier] > TIER_RANK[before.tier] && TIER_RANK[after.tier] >= TIER_RANK.bronze;
  return { point: 1, levelUp: up ? after.tier : null, comeback: before.state?.state === "relearning" && rating >= 2 };
}

/** The quarter (1-3) that `done` of `total` has just crossed, coming from `prev` done; 0 if none. */
export function quarterCrossed(prev: number, done: number, total: number): number {
  if (total <= 0) return 0;
  const q = (n: number) => Math.floor((n / total) * 4);
  const a = q(prev), b = q(done);
  return b > a && b >= 1 && b <= 3 ? b : 0;
}

/** This session's moments, for the done screen (the day's grades and minutes come from the log). */
export interface SessionTally { levelUps: number; comebacks: number }
export const EMPTY_TALLY: SessionTally = { levelUps: 0, comebacks: 0 };

export function tally(t: SessionTally, r: GradeReward): SessionTally {
  return { levelUps: t.levelUps + (r.levelUp ? 1 : 0), comebacks: t.comebacks + (r.comeback ? 1 : 0) };
}
