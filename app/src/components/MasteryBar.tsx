// A course's cards by mastery tier, as one bar (#195 stats page, #197 course page).
import { TIER_RANK, type Tier } from "../review/engine";
import { TIER_NAME } from "../review/rewards";

export const TIERS = (Object.keys(TIER_RANK) as Tier[]).sort((a, b) => TIER_RANK[a] - TIER_RANK[b]);

export default function MasteryBar({ tiers }: { tiers: Record<Tier, number> }) {
  const total = TIERS.reduce((n, t) => n + tiers[t], 0) || 1;
  return (
    <span className="mastery-bar" title={TIERS.map((t) => `${TIER_NAME[t]} ${tiers[t]}`).join(" · ")}>
      {TIERS.map((t) => tiers[t] > 0 && <i key={t} className={`t-${t}`} style={{ width: `${(100 * tiers[t]) / total}%` }} />)}
    </span>
  );
}

/** The share of a course's cards remembered a week or longer (Bronze and above), as a small ring. */
export function MasteryRing({ tiers }: { tiers: Record<Tier, number> }) {
  const total = TIERS.reduce((n, t) => n + tiers[t], 0);
  const held = TIERS.filter((t) => TIER_RANK[t] >= TIER_RANK.bronze).reduce((n, t) => n + tiers[t], 0);
  const r = 7, c = 2 * Math.PI * r, share = total ? held / total : 0;
  return (
    <svg className="mastery-ring" viewBox="0 0 18 18" width="16" height="16" role="img" aria-label={`${held} of ${total} cards remembered a week or longer`}>
      <title>{`${held} of ${total} cards remembered a week or longer`}</title>
      <circle cx="9" cy="9" r={r} className="ring-track" />
      <circle cx="9" cy="9" r={r} className="ring-fill" strokeDasharray={`${c * share} ${c}`} transform="rotate(-90 9 9)" />
    </svg>
  );
}
