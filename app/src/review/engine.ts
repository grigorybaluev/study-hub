// The review engine (#192): FSRS (ts-fsrs, the scheduler Anki uses since 23.10) over an append-only
// review log, with Anki's four grades. The log is the only state: every card's schedule is computed
// by replaying it in time order, so logs from two devices merge by taking their union (#193).
// Pure logic, no browser APIs: storage.ts keeps the log, tests/review-engine.test.mjs runs this in node.
import { createEmptyCard, fsrs, generatorParameters, State, type Card as FsrsCard, type FSRS, type Grade } from "ts-fsrs";

/** Anki's ease: 1 Again, 2 Hard, 3 Good, 4 Easy. */
export type Rating = 1 | 2 | 3 | 4;
/** Anki's revlog type, from the card's state before the grade. */
export type ReviewType = "learn" | "review" | "relearn";

/** One grade, as Anki's revlog records it. */
export interface Review {
  /** `<device>-<ms>`: unique across devices, so two logs merge without collisions */
  id: string;
  card: string;
  /** when it was graded, ms since the epoch */
  ts: number;
  rating: Rating;
  /** time spent on the card, ms */
  ms: number;
  type: ReviewType;
  /** the card's content hash when it was graded (cards.json): a different hash now means "updated" */
  hash: string;
}

export interface Settings {
  newPerDay: number;
  reviewsPerDay: number;
  /** FSRS desired retention */
  retention: number;
}
export const DEFAULT_SETTINGS: Settings = { newPerDay: 15, reviewsPerDay: 200, retention: 0.9 };

export interface CardState {
  due: number;
  state: "learning" | "review" | "relearning";
  stability: number;
  difficulty: number;
  reps: number;
  lapses: number;
  last: number;
  /** hash of the content last graded */
  hash: string;
}

/** Mastery tiers by FSRS stability (days a memory lasts at 90 % recall); names and rewards are #195's. */
export type Tier = "new" | "learning" | "bronze" | "silver" | "gold" | "diamond";
const TIERS: [Tier, number][] = [["diamond", 365], ["gold", 90], ["silver", 30], ["bronze", 7]];

const DAY_TURNS_AT = 4;   // a review day starts at 4 am, as in Anki
const HOUR = 3_600_000;

/** Start of the review day that `now` falls in. */
export function dayStart(now: number): number {
  const d = new Date(now);
  if (d.getHours() < DAY_TURNS_AT) d.setDate(d.getDate() - 1);
  d.setHours(DAY_TURNS_AT, 0, 0, 0);
  return d.getTime();
}

const STATE_NAMES = { [State.Learning]: "learning", [State.Review]: "review", [State.Relearning]: "relearning" } as const;
const TYPE_OF: Record<number, ReviewType> = { [State.New]: "learn", [State.Learning]: "learn", [State.Review]: "review", [State.Relearning]: "relearn" };
const byTime = (a: Review, b: Review) => a.ts - b.ts || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

export class Engine {
  readonly log: Review[] = [];
  settings: Settings;
  private f: FSRS;
  private cards = new Map<string, FsrsCard>();
  private hashes = new Map<string, string>();
  private first = new Map<string, number>();   // ts of each card's first grade

  constructor(log: Review[] = [], settings: Settings = DEFAULT_SETTINGS) {
    this.settings = { ...settings };
    this.f = fsrs(generatorParameters({ request_retention: settings.retention, enable_fuzz: false }));
    this.log = [...log].sort(byTime);
    this.replay();
  }

  private replay() {
    this.cards.clear();
    this.hashes.clear();
    this.first.clear();
    for (const r of this.log) this.apply(r);
  }

  private apply(r: Review) {
    const before = this.cards.get(r.card) ?? createEmptyCard<FsrsCard>(new Date(r.ts));
    this.cards.set(r.card, this.f.next(before, new Date(r.ts), r.rating as Grade).card);
    this.hashes.set(r.card, r.hash);
    if (!this.first.has(r.card)) this.first.set(r.card, r.ts);
  }

  /** A card's schedule, or null if it was never graded (a new card). */
  state(card: string): CardState | null {
    const c = this.cards.get(card);
    if (!c) return null;
    return {
      due: c.due.getTime(), state: STATE_NAMES[c.state as keyof typeof STATE_NAMES] ?? "learning",
      stability: c.stability, difficulty: c.difficulty, reps: c.reps, lapses: c.lapses,
      last: c.last_review?.getTime() ?? 0, hash: this.hashes.get(card) ?? "",
    };
  }

  /** When each grade would bring the card back (ms since the epoch): the intervals on the buttons. */
  preview(card: string, now: number): Record<Rating, number> {
    const p = this.f.repeat(this.cards.get(card) ?? createEmptyCard<FsrsCard>(new Date(now)), new Date(now));
    return { 1: p[1].card.due.getTime(), 2: p[2].card.due.getTime(), 3: p[3].card.due.getTime(), 4: p[4].card.due.getTime() };
  }

  /** Grade a card: appends to the log and returns the record (storage.ts saves it). */
  grade(card: string, rating: Rating, opts: { now: number; ms: number; hash: string; device: string }): Review {
    const c = this.cards.get(card);
    const r: Review = {
      id: `${opts.device}-${opts.now}`, card, ts: opts.now, rating, ms: Math.max(0, Math.round(opts.ms)),
      type: TYPE_OF[c ? c.state : State.New], hash: opts.hash,
    };
    const last = this.log[this.log.length - 1];
    this.log.push(r);
    if (!last || byTime(last, r) <= 0) this.apply(r);
    else { this.log.sort(byTime); this.replay(); }   // a clock that went back: replay in time order
    return r;
  }

  /** Remove the latest grade (by time); returns it so storage.ts can delete it too. */
  undo(): Review | undefined {
    const r = this.log.pop();
    if (r) this.replay();
    return r;
  }

  /** Add reviews from another device: union by id, then replay. Returns how many were new. */
  merge(reviews: Review[]): number {
    const have = new Set(this.log.map((r) => r.id));
    const add = reviews.filter((r) => !have.has(r.id));
    if (!add.length) return 0;
    this.log.push(...add);
    this.log.sort(byTime);
    this.replay();
    return add.length;
  }

  /** What to review now among `cards` (in their given order for new ones), within the daily limits. */
  queue(cards: string[], now: number): { due: string[]; fresh: string[]; later: { card: string; due: number }[] } {
    const today = dayStart(now), tomorrow = today + 24 * HOUR;
    const { newToday, reviewsToday } = this.today(now);
    const due: { card: string; due: number; learning: boolean }[] = [];
    const later: { card: string; due: number }[] = [];
    const fresh: string[] = [];
    for (const id of cards) {
      const c = this.cards.get(id);
      if (!c) { fresh.push(id); continue; }
      const t = c.due.getTime(), learning = c.state === State.Learning || c.state === State.Relearning;
      if (t <= now) due.push({ card: id, due: t, learning });
      else if (learning && t < tomorrow) later.push({ card: id, due: t });
    }
    due.sort((a, b) => a.due - b.due);
    // learning steps are never held back by the review limit, as in Anki
    let room = Math.max(0, this.settings.reviewsPerDay - reviewsToday);
    const shown = due.filter((d) => d.learning || room-- > 0).map((d) => d.card);
    later.sort((a, b) => a.due - b.due);
    return { due: shown, fresh: fresh.slice(0, Math.max(0, this.settings.newPerDay - newToday)), later };
  }

  /** Counts for the current review day. */
  today(now: number): { newToday: number; reviewsToday: number; graded: number } {
    const start = dayStart(now);
    let newToday = 0;
    for (const ts of this.first.values()) if (ts >= start) newToday++;
    const graded = this.log.filter((r) => r.ts >= start);
    return { newToday, reviewsToday: new Set(graded.filter((r) => r.type !== "learn").map((r) => r.card)).size, graded: graded.length };
  }

  /** Lifetime counts and true retention: share of review-type grades in the last 30 days that were not Again. */
  stats(now: number): { reviews: number; cards: number; retention30: number | null; ms: number } {
    const recent = this.log.filter((r) => r.type === "review" && r.ts >= now - 30 * 24 * HOUR);
    return {
      reviews: this.log.length, cards: this.cards.size, ms: this.log.reduce((s, r) => s + r.ms, 0),
      retention30: recent.length ? recent.filter((r) => r.rating > 1).length / recent.length : null,
    };
  }

  /** A card's mastery: its stability in days and the tier that reaches. */
  mastery(card: string): { stability: number; tier: Tier } {
    const c = this.cards.get(card);
    if (!c) return { stability: 0, tier: "new" };
    if (c.state !== State.Review) return { stability: c.stability, tier: "learning" };
    return { stability: c.stability, tier: TIERS.find(([, d]) => c.stability >= d)?.[0] ?? "learning" };
  }
}
