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
  /** learning steps still to go (0 in review), for Anki's `left` (#198) */
  stepsLeft: number;
  /** hash of the content last graded */
  hash: string;
}

/** Mastery tiers by FSRS stability (days a memory lasts at 90 % recall); names and rewards are #195's. */
export type Tier = "new" | "learning" | "bronze" | "silver" | "gold" | "diamond";
const TIERS: [Tier, number][] = [["diamond", 365], ["gold", 90], ["silver", 30], ["bronze", 7]];

/** The tier a stability (days) reaches: Bronze from 7, Silver 30, Gold 90, Diamond 365; else learning. */
export function tierOf(stability: number): Tier {
  return TIERS.find(([, d]) => stability >= d)?.[0] ?? "learning";
}
/** The tiers in order, lowest first (the rewards compare them, #195). */
export const TIER_RANK: Record<Tier, number> = { new: 0, learning: 1, bronze: 2, silver: 3, gold: 4, diamond: 5 };

const DAY_TURNS_AT = 4;   // a review day starts at 4 am, as in Anki
const HOUR = 3_600_000;

/** Start of the review day after the one `now` falls in (calendar arithmetic: a DST day is 23 or 25 h). */
export function nextDay(now: number): number {
  return dayStart(dayStart(now) + 36 * HOUR);
}

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
  private _settings: Settings;
  private f: FSRS;
  private cards = new Map<string, FsrsCard>();
  private hashes = new Map<string, string>();
  private first = new Map<string, number>();   // ts of each card's first grade
  private ivls = new Map<string, [number, number]>();   // review id -> [interval it set, the one before] (#198)
  private cardIvl = new Map<string, number>();           // card -> the interval its last grade set
  private ids = new Set<string>();
  private mine: string[] = [];                 // ids graded in this session, latest last: what undo takes back

  constructor(log: Review[] = [], settings: Settings = DEFAULT_SETTINGS) {
    this._settings = { ...settings };
    this.f = Engine.scheduler(settings);
    this.log = [...log].sort(byTime);
    this.replay();
  }

  private get learnSteps() { return this.f.parameters.learning_steps.length; }
  private get relearnSteps() { return this.f.parameters.relearning_steps.length; }

  private static scheduler(s: Settings): FSRS {
    return fsrs(generatorParameters({ request_retention: s.retention, enable_fuzz: false }));
  }

  get settings(): Settings { return { ...this._settings }; }

  /** New limits apply at once; a new retention reschedules every card (a replay). */
  setSettings(s: Settings) {
    const retention = s.retention !== this._settings.retention;
    this._settings = { ...s };
    if (retention) { this.f = Engine.scheduler(s); this.replay(); }
  }

  private replay() {
    this.cards.clear();
    this.hashes.clear();
    this.first.clear();
    this.ivls.clear();
    this.cardIvl.clear();
    this.ids = new Set(this.log.map((r) => r.id));
    for (const r of this.log) this.apply(r);
  }

  private apply(r: Review) {
    const before = this.cards.get(r.card) ?? createEmptyCard<FsrsCard>(new Date(r.ts));
    // the type is the card's state at this grade's time, whatever order records arrived in (merge, clock)
    r.type = TYPE_OF[before.state];
    const after = this.f.next(before, new Date(r.ts), r.rating as Grade).card;
    this.cards.set(r.card, after);
    // Anki's revlog interval: days once in review, else negative seconds (a learning step)
    const secs = Math.max(0, Math.round((after.due.getTime() - r.ts) / 1000));
    const ivl = after.state === State.Review ? Math.max(1, Math.round(secs / 86_400)) : -secs;
    this.ivls.set(r.id, [ivl, this.cardIvl.get(r.card) ?? 0]);
    this.cardIvl.set(r.card, ivl);
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
      last: c.last_review?.getTime() ?? 0,
      stepsLeft: c.state === State.Review ? 0 : Math.max(1, (c.state === State.Relearning ? this.relearnSteps : this.learnSteps) - c.learning_steps),
      hash: this.hashes.get(card) ?? "",
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
    let id = `${opts.device}-${opts.now}`;
    for (let k = 2; this.ids.has(id); k++) id = `${opts.device}-${opts.now}-${k}`;   // same ms, or a clock that went back
    const r: Review = {
      id, card, ts: opts.now, rating, ms: Math.max(0, Math.round(opts.ms)),
      type: TYPE_OF[c ? c.state : State.New], hash: opts.hash,
    };
    const last = this.log[this.log.length - 1];
    this.log.push(r);
    this.ids.add(id);
    this.mine.push(id);
    if (!last || byTime(last, r) <= 0) this.apply(r);
    else { this.log.sort(byTime); this.replay(); }   // a clock that went back: replay in time order
    return r;
  }

  /** Grades already sent to another device cannot be taken back: a later import would return them. */
  forgetUndo() {
    this.mine = [];
  }

  /** Whether this session has a grade to take back. */
  canUndo(): boolean {
    return this.mine.length > 0;
  }

  /** Take back the last grade made in this session (never one merged from another device); returns it
   *  so storage.ts can delete it too. */
  undo(): Review | undefined {
    const id = this.mine.pop();
    if (!id) return undefined;
    const i = this.log.findIndex((r) => r.id === id);
    if (i < 0) return undefined;
    const [r] = this.log.splice(i, 1);
    this.replay();
    return r;
  }

  /** Add reviews from another device: union by id, then replay. Returns how many were new. */
  merge(reviews: Review[]): number {
    const have = new Set(this.log.map((r) => r.id));
    const add = reviews.filter((r) => !have.has(r.id)).map((r) => ({ ...r }));
    if (!add.length) return 0;
    this.log.push(...add);
    this.log.sort(byTime);
    this.replay();
    return add.length;
  }

  /** What to review now among `cards` (in their given order for new ones), within the daily limits. */
  /** `extraNew`: new cards allowed today beyond the daily limit (the deck's "5 more", never saved). */
  queue(cards: string[], now: number, extraNew = 0): { due: string[]; fresh: string[]; later: { card: string; due: number }[] } {
    const tomorrow = nextDay(now);
    const { newToday, reviewsToday } = this.today(now);
    const due: { card: string; due: number; learning: boolean }[] = [];
    const later: { card: string; due: number }[] = [];
    const fresh: string[] = [];
    for (const id of cards) {
      const c = this.cards.get(id);
      if (!c) { fresh.push(id); continue; }
      const t = c.due.getTime(), learning = c.state === State.Learning || c.state === State.Relearning;
      // a review is due for its whole day, as in Anki; a learning step at its minute
      if (learning ? t <= now : t < tomorrow) due.push({ card: id, due: t, learning });
      else if (learning && t < tomorrow) later.push({ card: id, due: t });
    }
    due.sort((a, b) => a.due - b.due);
    // learning steps are never held back by the review limit, as in Anki
    let room = Math.max(0, this.settings.reviewsPerDay - reviewsToday);
    const shown = due.filter((d) => d.learning || room-- > 0).map((d) => d.card);
    later.sort((a, b) => a.due - b.due);
    return { due: shown, fresh: fresh.slice(0, Math.max(0, this._settings.newPerDay + extraNew - newToday)), later };
  }

  /** Counts for the current review day: new cards started, review cards seen, grades, time spent, and how
   *  many review-type grades were recalls (not Again). */
  today(now: number): { newToday: number; reviewsToday: number; graded: number; ms: number; reviewed: number; recalled: number } {
    const start = dayStart(now);
    let newToday = 0;
    for (const ts of this.first.values()) if (ts >= start) newToday++;
    let lo = 0, hi = this.log.length;                          // the log is sorted: find today's first grade
    while (lo < hi) { const mid = (lo + hi) >> 1; if (this.log[mid].ts < start) lo = mid + 1; else hi = mid; }
    const graded = this.log.slice(lo);
    const reviews = graded.filter((r) => r.type === "review");
    return {
      newToday, reviewsToday: new Set(graded.filter((r) => r.type !== "learn").map((r) => r.card)).size, graded: graded.length,
      ms: graded.reduce((s, r) => s + r.ms, 0), reviewed: reviews.length, recalled: reviews.filter((r) => r.rating > 1).length,
    };
  }

  /** The log as Anki's revlog (#198): each grade with the interval it set (days once in review, else
   *  negative seconds, as Anki writes learning steps) and the card's interval before it. */
  revlog(): { review: Review; ivl: number; lastIvl: number }[] {
    return this.log.map((r) => { const [ivl, lastIvl] = this.ivls.get(r.id) ?? [0, 0]; return { review: r, ivl, lastIvl }; });
  }

  /** The chance of recalling a card at a time (FSRS retrievability); 0 for a new card (exam decks, #221). */
  recallAt(card: string, at: number): number {
    const c = this.cards.get(card);
    return c ? this.f.get_retrievability(c, new Date(at), false) : 0;
  }

  /** When a card was first graded, ms; undefined for a new card (exam plans, #221). */
  firstSeen(card: string): number | undefined {
    return this.first.get(card);
  }

  /** Whether a card has been graded at all. */
  seen(card: string): boolean {
    return this.cards.has(card);
  }

  /** How many of `cards` fall due in [from, until) (the forecast on the done screen). */
  dueBetween(cards: string[], from: number, until: number): number {
    let n = 0;
    for (const id of cards) { const t = this.cards.get(id)?.due.getTime(); if (t !== undefined && t >= from && t < until) n++; }
    return n;
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
    return { stability: c.stability, tier: tierOf(c.stability) };
  }
}
