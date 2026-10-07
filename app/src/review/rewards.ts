// Rewards (#195), the rule: they follow effort and real memory, never the grade pressed. Every grade gets
// the same feedback (the swipe, the +1, the ring). Only two moments depend on the card, and both are
// earned over time rather than by pressing Good: a level-up (FSRS stability crossed a tier, which only
// grows across real intervals) and a comeback (a card forgotten after it was learned, now recalled).
// Pure logic, tested in node (tests/review-rewards.test.mjs).
import type { CardState, Rating, Tier } from "./engine";

export const TIER_RANK: Record<Tier, number> = { new: 0, learning: 1, bronze: 2, silver: 3, gold: 4, diamond: 5 };
export const TIER_NAME: Record<Tier, string> = {
  new: "New", learning: "Learning", bronze: "Bronze", silver: "Silver", gold: "Gold", diamond: "Diamond",
};

export interface GradeReward {
  /** every grade: the same +1, whatever the rating */
  point: 1;
  /** the tier the card reached, when this grade lifted it to Bronze or above */
  levelUp: Tier | null;
  /** a lapsed card (forgotten after it was learned) recalled again */
  comeback: boolean;
}

/** What a grade earns, from the card's state and tier before it and its tier after. A level-up needs a
 *  card that was already in review, recalled after a real interval: Easy on a new card jumps straight to a
 *  long interval, and rewarding that would reward the button, not the memory. */
export function rewardOf(before: { state: CardState | null; tier: Tier }, after: { tier: Tier }, rating: Rating): GradeReward {
  const up = before.state?.state === "review" && TIER_RANK[after.tier] > TIER_RANK[before.tier] && TIER_RANK[after.tier] >= TIER_RANK.bronze;
  return { point: 1, levelUp: up ? after.tier : null, comeback: before.state?.state === "relearning" && rating >= 3 };
}

/** The quarter (1-3) that `done` of `total` has just crossed, coming from `prev` done; 0 if none. */
export function quarterCrossed(prev: number, done: number, total: number): number {
  if (total <= 0) return 0;
  const q = (n: number) => Math.floor((n / total) * 4);
  const a = q(prev), b = q(done);
  return b > a && b >= 1 && b <= 3 ? b : 0;
}

export interface SessionTally { graded: number; levelUps: number; comebacks: number; started: number }
export const EMPTY_TALLY: SessionTally = { graded: 0, levelUps: 0, comebacks: 0, started: 0 };

export function tally(t: SessionTally, r: GradeReward, now: number): SessionTally {
  return {
    graded: t.graded + r.point, levelUps: t.levelUps + (r.levelUp ? 1 : 0), comebacks: t.comebacks + (r.comeback ? 1 : 0),
    started: t.started || now,
  };
}
