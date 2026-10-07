// A review session (#194): the cards (cards.json), this device's log (storage.ts) and the engine.
// Due cards come first, then new ones in course order; when nothing is left, a learning step due
// within 20 minutes is shown early, as Anki's "learn ahead" does.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { loadCards } from "../data/load";
import type { Card } from "../data/types";
import { Engine, type Rating } from "./engine";
import { openStore, type Store } from "./storage";

const LEARN_AHEAD = 20 * 60_000;
const MAX_MS = 60_000;          // time on a card counts up to a minute, as in Anki

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
  const currentId = view?.current?.id;
  useEffect(() => { shownAt.current = Date.now(); }, [currentId]);

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

  if (error) return { ...EMPTY, status: "error", error };
  if (!st || !view) return EMPTY;
  return { status: "ready", persistent: st.store.persistent, ...view, canUndo: st.engine.canUndo(), grade, undo };
}

const EMPTY: Deck = {
  status: "loading", persistent: true, current: null, next: null, left: { due: 0, fresh: 0 }, doneToday: 0,
  preview: null, updated: false, laterAt: null, canUndo: false, grade: () => {}, undo: () => {},
};
