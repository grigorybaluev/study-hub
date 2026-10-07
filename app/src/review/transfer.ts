// Moving progress between devices (#193): the whole review log as one JSON document. On the clipboard
// it is gzipped and base64-encoded behind an `SHP1:` prefix (two taps over Universal Clipboard between
// an iPhone and a Mac); as a file it is plain JSON, readable as a backup. Importing merges by review id
// (engine.merge), so it never overwrites: the same data twice changes nothing, either direction is safe.
// Pure apart from the web-standard CompressionStream and base64, so node runs it in tests.
import type { Review, Settings } from "./engine";

export const FORMAT = "study-hub-progress";
export const VERSION = 1;
const PREFIX = "SHP1:";

export interface ProgressFile {
  format: typeof FORMAT;
  version: number;
  /** the device that made the export */
  device: string;
  /** ms since the epoch */
  exported: number;
  settings: Settings;
  /** when those settings were last changed (0: never), so the newer settings win on import */
  settingsAt: number;
  reviews: Review[];
}

/** Why an import was refused; nothing has been changed when this is thrown. */
export class ProgressError extends Error {}

export function makeFile(device: string, reviews: Review[], settings: Settings, settingsAt: number, now: number): ProgressFile {
  return { format: FORMAT, version: VERSION, device, exported: now, settings, settingsAt, reviews };
}

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const out = new Response(new Blob([bytes as BlobPart]).stream().pipeThrough(stream));
  return new Uint8Array(await out.arrayBuffer());
}

function toBase64(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

function fromBase64(text: string): Uint8Array {
  const s = atob(text);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

/** The clipboard form: `SHP1:` + base64(gzip(JSON)). */
export async function encode(file: ProgressFile): Promise<string> {
  const json = new TextEncoder().encode(JSON.stringify(file));
  return PREFIX + toBase64(await pipe(json, new CompressionStream("gzip")));
}

/** Read what was pasted or opened: the clipboard form or the plain JSON of a saved file. */
export async function decode(text: string): Promise<ProgressFile> {
  const t = text.trim();
  let json: string;
  if (t.startsWith(PREFIX)) {
    try {
      json = new TextDecoder().decode(await pipe(fromBase64(t.slice(PREFIX.length).replace(/\s+/g, "")), new DecompressionStream("gzip")));
    } catch {
      throw new ProgressError("The pasted progress is incomplete or damaged. Copy it again on the other device.");
    }
  } else if (t.startsWith("{")) {
    json = t;
  } else {
    throw new ProgressError("This is not Study Hub progress. Use “Copy progress” on the other device first.");
  }
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    throw new ProgressError("The progress could not be read: it is not valid JSON.");
  }
  return validate(data);
}

const RATINGS = new Set([1, 2, 3, 4]);
const TYPES = new Set(["learn", "review", "relearn"]);

function validate(d: unknown): ProgressFile {
  const f = d as Partial<ProgressFile>;
  if (!f || typeof f !== "object" || f.format !== FORMAT) throw new ProgressError("This is not Study Hub progress.");
  if (typeof f.version !== "number" || f.version > VERSION) {
    throw new ProgressError(`This progress comes from a newer version of Study Hub (format ${f.version}). Update this app first.`);
  }
  if (typeof f.device !== "string" || !Array.isArray(f.reviews)) throw new ProgressError("The progress is missing its device or its reviews.");
  const bad = f.reviews.findIndex((r) => !r || typeof r.id !== "string" || typeof r.card !== "string" || !Number.isFinite(r.ts)
    || !RATINGS.has(r.rating) || !Number.isFinite(r.ms) || !TYPES.has(r.type) || typeof r.hash !== "string");
  if (bad >= 0) throw new ProgressError(`Review ${bad + 1} of ${f.reviews.length} is malformed; nothing was imported.`);
  return {
    format: FORMAT, version: f.version, device: f.device, exported: Number(f.exported) || 0,
    settings: f.settings as Settings, settingsAt: Number(f.settingsAt) || 0, reviews: f.reviews as Review[],
  };
}

/** The reviews of `file` this log does not have yet, each id once (a hand-joined file may repeat one). */
export function missing(have: Review[], file: ProgressFile): Review[] {
  const ids = new Set(have.map((r) => r.id));
  return file.reviews.filter((r) => !ids.has(r.id) && (ids.add(r.id), true));
}

/** File name of a saved export: study-hub-progress-<device>-<yyyy-mm-dd>.json */
export function fileName(file: ProgressFile): string {
  const d = new Date(file.exported);
  const day = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return `${FORMAT}-${file.device}-${day}.json`;
}
