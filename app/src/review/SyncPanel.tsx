// Moving progress between devices (#193): Copy progress on one, Paste progress on the other (Universal
// Clipboard carries it between an iPhone and a Mac), or a file as fallback and backup. Import merges.
import { useEffect, useRef, useState } from "react";
import type { Deck } from "./useDeck";
import { ProgressError, decode, encode, fileName, type ProgressFile } from "./transfer";

type Note = { ok: boolean; text: string } | null;

const when = (ms: number) => new Date(ms).toLocaleString([], { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export default function SyncPanel({ deck, onClose }: { deck: Deck; onClose(): void }) {
  const [note, setNote] = useState<Note>(null);
  const [manual, setManual] = useState<"copy" | "paste" | null>(null);   // the clipboard was refused: do it by hand
  const [text, setText] = useState("");
  const [dropping, setDropping] = useState(false);
  const ready = useRef<{ file: ProgressFile; text: string } | null>(null);
  const picker = useRef<HTMLInputElement>(null);
  const area = useRef<HTMLTextAreaElement>(null);

  // encode ahead of the tap, so Copy writes at once, inside the gesture as Safari requires; again after
  // an import, which changes the log
  const prepare = () => {
    ready.current = null;
    deck.exportProgress().then(async (file) => { ready.current = { file, text: await encode(file) }; })
      .catch(() => { ready.current = null; });     // Copy then encodes on the tap
  };
  useEffect(prepare, []);   // on opening; take() prepares again after an import

  // Escape closes; the deck behind does not scroll while the sheet is open (as the parts sheet)
  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", esc);
    document.documentElement.classList.add("sheet-open");
    return () => { document.removeEventListener("keydown", esc); document.documentElement.classList.remove("sheet-open"); };
  }, [onClose]);

  useEffect(() => { if (manual) area.current?.select(); }, [manual]);

  const copy = async () => {
    setNote(null);
    const pending = ready.current ? Promise.resolve(ready.current) : deck.exportProgress().then(async (file) => ({ file, text: await encode(file) }));
    try {
      if (ready.current) await navigator.clipboard.writeText(ready.current.text);
      else await navigator.clipboard.write([new ClipboardItem({ "text/plain": pending.then((p) => new Blob([p.text], { type: "text/plain" })) })]);
      const { file } = await pending;
      await deck.markSent();
      setNote({ ok: true, text: `Copied ${file.reviews.length} reviews. Now tap “Paste progress” on the other device.` });
    } catch {
      try {
        setText((await pending).text);
        setManual("copy");
        setNote({ ok: false, text: "This browser would not write to the clipboard: copy the text below by hand, then save it to the other device." });
      } catch (e) {
        setNote({ ok: false, text: `Could not prepare the progress: ${String(e)}` });
      }
    }
  };

  const take = async (raw: string, from: string) => {
    try {
      const file = await decode(raw);
      const { added, total } = await deck.importProgress(file);
      prepare();                                       // the next Copy or Save carries what just came in
      setNote({ ok: true, text: added ? `Added ${added} reviews from ${from === "file" ? "the file" : `device ${file.device}`}; ${total} in total.` : "Nothing new: this device already has all those reviews." });
      setManual(null);
    } catch (e) {
      setNote({ ok: false, text: e instanceof ProgressError ? e.message : `Could not import: ${String(e)}` });
    }
  };

  const paste = async () => {
    setNote(null);
    try {
      const raw = await navigator.clipboard.readText();
      await take(raw, "clipboard");
    } catch {
      setText("");
      setManual("paste");
      setNote({ ok: false, text: "This browser would not read the clipboard: paste into the box below, then Import." });
    }
  };

  const save = async () => {
    setNote(null);
    let file: ProgressFile;
    try {
      file = ready.current?.file ?? await deck.exportProgress();
    } catch (e) {
      setNote({ ok: false, text: `Could not prepare the progress: ${String(e)}` });
      return;
    }
    const blob = new File([JSON.stringify(file)], fileName(file), { type: "application/json" });
    try {
      if (navigator.canShare?.({ files: [blob] })) {
        await navigator.share({ files: [blob], title: "Study Hub progress" });
        await deck.markSent();
        setNote({ ok: true, text: "Shared the progress file." });
        return;
      }
    } catch (e) {
      if ((e as Error).name === "AbortError") return;      // the share sheet was closed
    }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = blob.name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    await deck.markSent();
    setNote({ ok: true, text: `Saved ${blob.name}.` });
  };

  const open = async (f: File | undefined) => {
    if (!f) return;
    try { await take(await f.text(), "file"); } catch (e) { setNote({ ok: false, text: `Could not read the file: ${String(e)}` }); }
  };

  const s = deck.sync;
  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <div
        className={`sheet sync-sheet${dropping ? " dropping" : ""}`} role="dialog" aria-label="Move progress between devices"
        onDragOver={(e) => { e.preventDefault(); if (!dropping) setDropping(true); }}
        onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDropping(false); }}
        onDrop={(e) => { e.preventDefault(); setDropping(false); open(e.dataTransfer.files[0]); }}
      >
        <div className="sheet-head"><span>Sync progress</span><button onClick={onClose} aria-label="Close">✕</button></div>
        <div className="sync-body">
          <p className="small muted">
            {s?.sent ? <>Last sent: {when(s.sent.at)}. </> : <>Not sent yet. </>}
            {s?.received && <>Last received: {when(s.received.at)}, from <code>{s.received.with}</code>. </>}
            {s && s.since > 0 ? <>{s.since} review{s.since === 1 ? "" : "s"} made here {s.sent ? "since then" : "so far"} still to send.</> : <>Everything made here has been sent.</>}
            {" "}This device is <code>{s?.device}</code>.
          </p>
          <div className="sync-row">
            <button className="sync-main" onClick={copy}>Copy progress</button>
            <button className="sync-main" onClick={paste}>Paste progress</button>
          </div>
          <p className="small muted">Copy on one device, then Paste on the other: between an iPhone and a Mac the clipboard travels by Handoff. A paste only adds reviews, never removes any.</p>
          <div className="sync-row">
            <button onClick={save}>Save file</button>
            <button onClick={() => picker.current?.click()}>Open file</button>
            <input ref={picker} type="file" accept=".json,.txt,application/json,text/plain" hidden onChange={(e) => { open(e.target.files?.[0]); e.target.value = ""; }} />
          </div>
          {manual && (
            <div className="sync-manual">
              <textarea ref={area} value={text} onChange={(e) => setText(e.target.value)} readOnly={manual === "copy"} rows={4}
                placeholder="Paste the progress here (it starts with SHP1:)" />
              {manual === "paste" && <button className="sync-main" onClick={() => take(text, "clipboard")} disabled={!text.trim()}>Import</button>}
            </div>
          )}
          {note && <p className={note.ok ? "sync-note ok" : "sync-note bad"} role="status">{note.text}</p>}
        </div>
      </div>
    </>
  );
}
