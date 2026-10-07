// "Export to Anki" on the stats page (#198): builds the .apkg in the browser (sql.js and the markdown
// pipeline load only when asked) and shares it (iOS share sheet) or downloads it.
import { useState } from "react";
import { node, useData } from "../data/load";
import type { Card, CourseNode, UnitNode } from "../data/types";
import type { Engine } from "./engine";

export default function AnkiExport({ cards, engine }: { cards: Card[]; engine: Engine }) {
  const d = useData();
  const [state, setState] = useState<{ busy: boolean; note?: string; ok?: boolean }>({ busy: false });

  const run = async () => {
    setState({ busy: true });
    try {
      const [{ buildApkg }, mod, wasm] = await Promise.all([
        import("./anki"), import("sql.js"), import("sql.js/dist/sql-wasm.wasm?url"),
      ]);
      const initSqlJs = (mod as unknown as { default?: unknown }).default ?? mod;
      const SQL = await (initSqlJs as (o: object) => Promise<unknown>)({ locateFile: () => wasm.default });
      const code = (course: string) => node<CourseNode>(d, course)?.code ?? course.split("/").pop()!;
      const bytes = await buildApkg(SQL as never, {
        cards, engine, now: Date.now(), courseCode: code,
        where: (c) => [code(c.course), node<UnitNode>(d, c.unit)?.title ?? c.part_title, c.unit ? c.part_title : null].filter(Boolean).join(" › "),
      });
      const day = new Date().toISOString().slice(0, 10);
      const file = new File([bytes as BlobPart], `study-hub-${day}.apkg`, { type: "application/octet-stream" });
      if (navigator.canShare?.({ files: [file] })) {
        try { await navigator.share({ files: [file], title: "Study Hub for Anki" }); } catch (e) { if ((e as Error).name === "AbortError") { setState({ busy: false }); return; } throw e; }
      } else {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(file);
        a.download = file.name;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      }
      const seen = cards.filter((c) => engine.seen(c.id)).length;
      setState({ busy: false, ok: true, note: `${file.name}: ${cards.length} cards (${seen} with their schedule) and ${engine.log.length} reviews. In Anki: File › Import.` });
    } catch (e) {
      setState({ busy: false, ok: false, note: `Could not build the Anki file: ${String(e)}` });
    }
  };

  return (
    <div className="settings">
      <p className="small muted">
        Every card, with its schedule and your whole review history, as an Anki deck (Study Hub::course). Importing it again
        later updates the same notes; Anki's statistics and FSRS optimiser see the history.
      </p>
      <button onClick={run} disabled={state.busy}>{state.busy ? "Building…" : "Export to Anki (.apkg)"}</button>
      {state.note && <p className={state.ok ? "sync-note ok" : "sync-note bad"} role="status">{state.note}</p>}
    </div>
  );
}
