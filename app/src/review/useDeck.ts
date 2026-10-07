// A review session (#194): the cards (cards.json), this device's log (storage.ts) and the engine.
// Due cards come first, then new ones in course order; when nothing is left, a learning step due
// within 20 minutes is shown early, as Anki's "learn ahead" does.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { loadCards } from "../data/load";
import type { Card } from "../data/types";
import { Engine, type Rating, type Settings } from "./engine";
import { openStore, type Store } from "./storage";
import { makeFile, missing, type ProgressFile } from "./transfer";

const LEARN_AHEAD = 20 * 60_000;
const MAX_MS = 60_000;          // time on a card counts up to a minute, as in Anki
const REMIND_AFTER = 3 * 24 * 3_600_000;

/** The last exchange with another device (#193), kept in the store's meta. */
export interface LastSync { at: number; dir: "in" | "out"; with?: string }
export interface SyncStatus {
  device: string;
  last: LastSync | null;
  /** grades made on this device since the last exchange */
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
  /** when each grade would bring the current card back */
  preview: Record<Rating, number> | null;
  /** the current card's text changed since it was last graded */
  updated: boolean;
  /** with nothing to do now: when the next learning step falls due today */
  laterAt: number | null;
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
  grade(rating: Rating): void;
  undo(): void;
}

export function useDeck(): Deck {
  const [st, setSt] = useState<{ store: Store; engine: Engine; cards: Card[] } | null>(null);
  const [error, setError] = useState<string | undefined>();
  const [tick, setTick] = useState(0);
  const [forced, setForced] = useState<string | null>(null);     // an undone card comes back first
  const shownAt = useRef(Date.now());
  const bump = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    Promise.all([openStore(), loadCards()])
      .then(([store, file]) => setSt({ store, engine: new Engine(store.reviews, store.settings), cards: file.cards }))
      .catch((e) => setError(String(e)));
  }, []);

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
    const q = st.engine.queue(st.cards.map((c) => c.id), now);
    let order = [...q.due, ...q.fresh];
    if (forced && byId.has(forced)) order = [forced, ...order.filter((id) => id !== forced)];
    let laterAt: number | null = null;
    if (!order.length && q.later.length) {
      if (q.later[0].due - now <= LEARN_AHEAD) order = q.later.map((l) => l.card);
      else laterAt = q.later[0].due;
    }
    const current = order.length ? byId.get(order[0])! : null;
    const state = current ? st.engine.state(current.id) : null;
    return {
      current, next: order.length > 1 ? byId.get(order[1])! : null,
      left: { due: q.due.length, fresh: q.fresh.length },
      doneToday: st.engine.today(now).graded,
      preview: current ? st.engine.preview(current.id, now) : null,
      updated: !!state && !!state.hash && state.hash !== current!.hash,
      laterAt,
    };
    // tick: recomputed after a grade, an undo, a timer or a return to the app
  }, [st, tick, forced]);

  // the clock that starts when a card is shown
  useEffect(() => { shownAt.current = Date.now(); }, [tick]);

  // wake up when the next learning step comes within the learn-ahead window
  useEffect(() => {
    if (!view?.laterAt) return;
    const t = setTimeout(bump, Math.max(1000, view.laterAt - LEARN_AHEAD - Date.now()));
    return () => clearTimeout(t);
  }, [view?.laterAt, bump]);

  const grade = useCallback((rating: Rating) => {
    if (!st || !view?.current) return;
    const now = Date.now();
    const r = st.engine.grade(view.current.id, rating, {
      now, ms: Math.min(MAX_MS, now - shownAt.current), hash: view.current.hash, device: st.store.device,
    });
    st.store.add(r).catch((e) => console.warn("review not saved", e));
    setForced(null);
    bump();
  }, [st, view, bump]);

  const undo = useCallback(() => {
    if (!st) return;
    const r = st.engine.undo();
    if (!r) return;
    st.store.remove(r.id).catch((e) => console.warn("undo not saved", e));
    setForced(r.card);
    bump();
  }, [st, bump]);

  const exportProgress = useCallback(async () => {
    if (!st) throw new Error("the deck is not loaded");
    const now = Date.now();
    return makeFile(st.store.device, [...st.engine.log], st.engine.settings, Number(st.store.meta.settingsAt) || 0, now);
  }, [st]);

  const markSent = useCallback(async () => {
    if (!st) return;
    await st.store.setMeta("sync", { at: Date.now(), dir: "out" } satisfies LastSync);
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
      await st.store.saveSettings(file.settings);
      await st.store.setMeta("settingsAt", file.settingsAt);
    }
    if (file.device !== st.store.device) await st.store.setMeta("sync", { at: Date.now(), dir: "in", with: file.device } satisfies LastSync);
    bump();
    return { added: add.length, total: st.engine.log.length };
  }, [st, bump]);

  if (error) return { ...EMPTY, status: "error", error };
  if (!st || !view) return EMPTY;
  const last = (st.store.meta.sync as LastSync | undefined) ?? null;
  const mine = `${st.store.device}-`;
  const since = st.engine.log.filter((r) => r.id.startsWith(mine) && r.ts > (last?.at ?? 0)).length;
  const oldest = st.engine.log.find((r) => r.id.startsWith(mine) && r.ts > (last?.at ?? 0))?.ts ?? Date.now();
  const sync: SyncStatus = { device: st.store.device, last, since, remind: since > 0 && Date.now() - Math.max(last?.at ?? 0, oldest) > REMIND_AFTER };
  return {
    status: "ready", persistent: st.store.persistent, ...view, canUndo: st.engine.canUndo(), showing: tick,
    sync, exportProgress, markSent, importProgress, grade, undo,
  };
}

const EMPTY: Deck = {
  status: "loading", persistent: true, current: null, next: null, left: { due: 0, fresh: 0 }, doneToday: 0,
  preview: null, updated: false, laterAt: null, canUndo: false, showing: 0, grade: () => {}, undo: () => {},
  sync: null, exportProgress: () => Promise.reject(new Error("loading")), markSent: async () => {},
  importProgress: () => Promise.reject(new Error("loading")),
};

function validSettings(s: Settings | undefined): s is Settings {
  return !!s && [s.newPerDay, s.reviewsPerDay].every((n) => Number.isInteger(n) && n >= 0 && n <= 9999)
    && typeof s.retention === "number" && s.retention >= 0.7 && s.retention <= 0.99;
}
