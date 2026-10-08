// A review session (#194): the cards (cards.json), this device's log (storage.ts) and the engine.
// Due cards come first, then new ones in course order; when nothing is left, a learning step due
// within 20 minutes is shown early, as Anki's "learn ahead" does.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { loadCards } from "../data/load";
import type { Card } from "../data/types";
import { Engine, dayStart, nextDay, type Rating, type Settings } from "./engine";
import { EMPTY_TALLY, rewardOf, tally as addTo, type GradeReward, type SessionTally } from "./rewards";
import { streak, type Streak } from "./days";
import { prefs } from "./feedback";
import { openStore, type Store } from "./storage";
import type { ExamPlan } from "./term";
import { makeFile, missing, type ProgressFile } from "./transfer";

const LEARN_AHEAD = 20 * 60_000;
const MAX_MS = 60_000;          // time on a card counts up to a minute, as in Anki
const REMIND_AFTER = 3 * 24 * 3_600_000;

/** Exchanges with another device (#193), kept in the store's meta: sending and receiving separately,
 *  because receiving says nothing about whether this device's own grades went out. */
export interface Sent { at: number }
export interface Received { at: number; with: string }
export interface SyncStatus {
  device: string;
  sent: Sent | null;
  received: Received | null;
  /** grades made on this device since its progress was last sent */
  since: number;
  /** time to send them: some, and more than 3 days old */
  remind: boolean;
}

export interface Deck {
  status: "loading" | "ready" | "error";
  error?: string;
  /** false: IndexedDB is unavailable here and this session's grades will not be kept */
  persistent: boolean;
  current: Card | null;
  next: Card | null;
  /** cards left today: reviews (due now) and new ones within the daily limit */
  left: { due: number; fresh: number };
  doneToday: number;
  /** grades today on this scope's cards (doneToday when the scope is everything) */
  doneHere: number;
  leftAll: number;
  /** the exam plans behind this session (#221), nearest first */
  plans: ExamPlan[];
  /** when each grade would bring the current card back */
  preview: Record<Rating, number> | null;
  /** the current card's text changed since it was last graded */
  updated: boolean;
  /** with nothing to do now: when the next learning step falls due today */
  laterAt: number | null;
  /** today's work, from the log: grades, minutes, review-type grades and how many were recalls */
  day: { graded: number; ms: number; reviewed: number; recalled: number };
  /** cards that fall due during tomorrow's review day */
  tomorrow: number;
  /** this session's tally of the rewards (#195) */
  tally: SessionTally;
  /** today's new cards are used up but unseen cards remain, and today's extension has room */
  canExtend: boolean;
  /** five more new cards today, at most the daily limit again (session only, never saved) */
  extendNew(): void;
  /** every card, whatever the scope (the scope picker counts them) */
  cards: Card[];
  /** days in a row (#195), computed only once the deck is done */
  streak: Streak | null;
  /** learning steps still to come back today */
  learning: number;
  /** record that the deck was cleared today (a day that counts for the streak) */
  markCleared(): void;
  canUndo: boolean;
  sync: SyncStatus | null;
  /** the whole log as a progress document (no side effect) */
  exportProgress(): Promise<ProgressFile>;
  /** record that progress went out (after a successful copy or save) */
  markSent(): Promise<void>;
  /** merge another device's progress: never overwrites; returns how many reviews were new */
  importProgress(file: ProgressFile): Promise<{ added: number; total: number }>;
  /** goes up each time a card is put on top, also when the same card comes straight back */
  showing: number;
  /** grade the current card; returns what the grade earned (#195) */
  grade(rating: Rating): GradeReward | null;
  undo(): void;
}

const EXTEND_BY = 5;

/** The cards, this device's store and an engine over its log: what the deck and the stats page read. */
export function useReviewData(enabled = true): { st: { store: Store; engine: Engine; cards: Card[] } | null; error?: string } {
  const [st, setSt] = useState<{ store: Store; engine: Engine; cards: Card[] } | null>(null);
  const [error, setError] = useState<string | undefined>();
  useEffect(() => {
    if (!enabled || st) return;
    let live = true;
    Promise.all([openStore(), loadCards()])
      .then(([store, file]) => live && setSt({ store, engine: new Engine(store.reviews, store.settings), cards: file.cards }))
      .catch((e) => live && setError(String(e)));
    return () => { live = false; };
  }, [enabled, st]);
  return { st, error };
}

/** Days the deck was cleared, kept in the store's meta (the last 400). */
export function clearedDays(store: Store): number[] {
  return Array.isArray(store.meta.cleared) ? (store.meta.cleared as number[]) : [];
}

/** Exam plans (#221) reshape the session at each look: which new cards come first, and how many new cards
 *  the session may still start today (in place of the daily setting), and seen cards to review before
 *  they fall due (an exam's weakest, served after the due and new ones). */
export type Shape = (pool: Card[], engine: Engine, now: number) => { cards: Card[]; newLeft?: number; plans?: ExamPlan[]; early?: string[] };

/** `select` narrows and orders the cards of the session (a review scope, #197); `shape` applies exam plans;
 *  keep both stable (useMemo). */
export function useDeck(select?: (cards: Card[]) => Card[], shape?: Shape): Deck {
  const { st, error } = useReviewData();
  const [tick, setTick] = useState(0);
  const [forced, setForced] = useState<string | null>(null);     // an undone card comes back first
  const [tally, setTally] = useState<SessionTally>(EMPTY_TALLY);
  // "5 more new cards": an allowance for one review day, apart from the settings, never saved or sent
  const [extra, setExtra] = useState({ day: 0, n: 0 });
  const shownAt = useRef(Date.now());
  useEffect(() => { setForced(null); }, [select]);           // an undone card does not follow into another scope
  const bump = useCallback(() => setTick((t) => t + 1), []);

  // back to the app (a new day, a learning step now due) or a learning step's time: look again
  useEffect(() => {
    const vis = () => { if (document.visibilityState === "visible") bump(); };
    document.addEventListener("visibilitychange", vis);
    return () => document.removeEventListener("visibilitychange", vis);
  }, [bump]);

  const view = useMemo(() => {
    if (!st) return null;
    const now = Date.now();
    const byId = new Map(st.cards.map((c) => [c.id, c]));
    const selected = select ? select(st.cards) : st.cards;
    const shaped: ReturnType<Shape> = shape ? shape(selected, st.engine, now) : { cards: selected };
    const pool = shaped.cards;
    const ids = pool.map((c) => c.id);
    const inPool = new Set(ids);
    const extraToday = extra.day === dayStart(now) ? extra.n : 0;
    // the queue allows newPerDay + extra - newToday new cards: a plan's own count replaces the setting's
    const planned = shaped.newLeft === undefined ? 0 : shaped.newLeft - st.engine.settings.newPerDay + st.engine.today(now).newToday;
    const q = st.engine.queue(ids, now, extraToday + planned);
    const listed = new Set([...q.due, ...q.later.map((l) => l.card)]);
    const early = (shaped.early ?? []).filter((id) => inPool.has(id) && !listed.has(id));
    let order = [...q.due, ...q.fresh, ...early];
    if (forced && inPool.has(forced)) order = [forced, ...order.filter((id) => id !== forced)];   // an undone card, if in scope
    let laterAt: number | null = null;
    if (!order.length && q.later.length) {
      if (q.later[0].due - now <= LEARN_AHEAD) order = q.later.map((l) => l.card);
      else laterAt = q.later[0].due;
    }
    const current = order.length ? byId.get(order[0])! : null;
    const state = current ? st.engine.state(current.id) : null;
    const today = st.engine.today(now);
    const unseen = ids.reduce((n, id) => n + (st.engine.seen(id) ? 0 : 1), 0);
    const tomorrow = nextDay(now);
    return {
      current, next: order.length > 1 ? byId.get(order[1])! : null,
      left: { due: q.due.length + early.length, fresh: q.fresh.length },
      doneToday: today.graded,
      // this scope's grades today (the ring of a scoped session counts these with its cards left)
      doneHere: select ? st.engine.log.slice(-today.graded).filter((r) => inPool.has(r.card)).length : today.graded,
      // the badge counts every card left today, whatever the scope
      leftAll: (() => { if (!select) return q.due.length + q.fresh.length + q.later.length; const a = st.engine.queue(st.cards.map((c) => c.id), now, extraToday); return a.due.length + a.fresh.length + a.later.length; })(),
      preview: current ? st.engine.preview(current.id, now) : null,
      updated: !!state && !!state.hash && state.hash !== current!.hash,
      laterAt,
      sync: syncStatus(st.store, st.engine, now),
      day: { graded: today.graded, ms: today.ms, reviewed: today.reviewed, recalled: today.recalled },
      tomorrow: st.engine.dueBetween(ids, tomorrow, nextDay(tomorrow)),
      canExtend: !q.fresh.length && unseen > 0 && extraToday + EXTEND_BY <= st.engine.settings.newPerDay,
      // only the done screen shows it: no walk over the whole log on every swipe
      streak: current ? null : streak(st.engine.log, clearedDays(st.store), now),
      learning: q.later.length,
      plans: shaped.plans ?? [],
    };
    // tick: recomputed after a grade, an undo, a timer or a return to the app
  }, [st, tick, forced, extra, select, shape]);

  // the clock that starts when a card is shown
  useEffect(() => { shownAt.current = Date.now(); }, [tick]);

  // wake up when the next learning step comes within the learn-ahead window
  useEffect(() => {
    if (!view?.laterAt) return;
    const t = setTimeout(bump, Math.max(1000, view.laterAt - LEARN_AHEAD - Date.now()));
    return () => clearTimeout(t);
  }, [view?.laterAt, bump]);

  const grade = useCallback((rating: Rating): GradeReward | null => {
    if (!st || !view?.current) return null;
    const now = Date.now(), id = view.current.id;
    const before = { state: st.engine.state(id), tier: st.engine.mastery(id).tier };
    const r = st.engine.grade(id, rating, {
      now, ms: Math.min(MAX_MS, now - shownAt.current), hash: view.current.hash, device: st.store.device,
    });
    st.store.add(r).catch((e) => console.warn("review not saved", e));
    const reward = rewardOf(before, { tier: st.engine.mastery(id).tier }, rating);
    setTally((t) => addTo(t, reward));
    setForced(null);
    bump();
    return reward;
  }, [st, view, bump]);

  // the cards left today on the app icon (learning steps included, every scope), where allowed and switched on
  const left = view ? view.leftAll : 0;
  useEffect(() => {
    if (!view || !prefs().badge || !("setAppBadge" in navigator)) return;
    (left ? navigator.setAppBadge(left) : navigator.clearAppBadge()).catch(() => { /* not allowed here */ });
  }, [view, left]);

  const markCleared = useCallback(() => {
    if (!st) return;
    const day = dayStart(Date.now()), days = clearedDays(st.store);
    if (days.includes(day)) return;
    st.store.setMeta("cleared", [...days, day].slice(-400)).then(bump).catch(() => { /* not kept */ });
  }, [st, bump]);

  const extendNew = useCallback(() => {
    const day = dayStart(Date.now());
    setExtra((x) => ({ day, n: (x.day === day ? x.n : 0) + EXTEND_BY }));
  }, []);

  const undo = useCallback(() => {
    if (!st) return;
    const r = st.engine.undo();
    if (!r) return;
    st.store.remove(r.id).catch((e) => console.warn("undo not saved", e));
    // a grade taken back: today no longer counts as cleared (clearing again records it again)
    const today = dayStart(Date.now()), days = clearedDays(st.store);
    if (days.includes(today)) st.store.setMeta("cleared", days.filter((d) => d !== today)).catch(() => { /* not kept */ });
    setForced(r.card);
    bump();
  }, [st, bump]);

  const exportProgress = useCallback(async () => {
    if (!st) throw new Error("the deck is not loaded");
    const now = Date.now();
    return makeFile(st.store.device, [...st.engine.log], st.engine.settings, Number(st.store.meta.settingsAt) || 0, now, clearedDays(st.store));
  }, [st]);

  const markSent = useCallback(async () => {
    if (!st) return;
    await st.store.setMeta("sent", { at: Date.now() } satisfies Sent);
    st.engine.forgetUndo();
    bump();
  }, [st, bump]);

  const importProgress = useCallback(async (file: ProgressFile) => {
    if (!st) throw new Error("the deck is not loaded");
    const add = missing(st.engine.log, file);
    st.engine.merge(add);
    await st.store.addAll(add);
    // the newer settings win; settings that do not look like settings are ignored
    if (file.settingsAt > (Number(st.store.meta.settingsAt) || 0) && validSettings(file.settings)) {
      st.engine.setSettings(file.settings);
      await st.store.saveSettings(file.settings, file.settingsAt);
    }
    const days = clearedDays(st.store), more = (file.cleared ?? []).filter((d) => !days.includes(d));
    if (more.length) await st.store.setMeta("cleared", [...days, ...more].sort((a, b) => a - b).slice(-400));
    if (file.device !== st.store.device) await st.store.setMeta("received", { at: Date.now(), with: file.device } satisfies Received);
    bump();
    return { added: add.length, total: st.engine.log.length };
  }, [st, bump]);

  if (error) return { ...EMPTY, status: "error", error };
  if (!st || !view) return EMPTY;
  return {
    status: "ready", persistent: st.store.persistent, ...view, canUndo: st.engine.canUndo(), showing: tick, cards: st.cards,
    tally, extendNew, markCleared, exportProgress, markSent, importProgress, grade, undo,
  };
}

const EMPTY: Deck = {
  status: "loading", persistent: true, current: null, next: null, left: { due: 0, fresh: 0 }, doneToday: 0, doneHere: 0, leftAll: 0, plans: [],
  preview: null, updated: false, laterAt: null, canUndo: false, showing: 0, grade: () => null, undo: () => {},
  day: { graded: 0, ms: 0, reviewed: 0, recalled: 0 }, tomorrow: 0, tally: EMPTY_TALLY, canExtend: false, extendNew: () => {},
  streak: null, learning: 0, markCleared: () => {}, cards: [],
  sync: null, exportProgress: () => Promise.reject(new Error("loading")), markSent: async () => {},
  importProgress: () => Promise.reject(new Error("loading")),
};

/** One pass over the log: this device's grades since its progress was last sent, and the oldest of them. */
function syncStatus(store: Store, engine: Engine, now: number): SyncStatus {
  const sent = (store.meta.sent as Sent | undefined) ?? null;
  const received = (store.meta.received as Received | undefined) ?? null;
  const mine = `${store.device}-`, after = sent?.at ?? 0;
  let since = 0, oldest = now;
  for (const r of engine.log) {
    if (r.ts > after && r.id.startsWith(mine)) { since++; if (r.ts < oldest) oldest = r.ts; }
  }
  return { device: store.device, sent, received, since, remind: since > 0 && now - oldest > REMIND_AFTER };
}

function validSettings(s: Settings | undefined): s is Settings {
  return !!s && [s.newPerDay, s.reviewsPerDay].every((n) => Number.isInteger(n) && n >= 0 && n <= 9999)
    && typeof s.retention === "number" && s.retention >= 0.7 && s.retention <= 0.99;
}
