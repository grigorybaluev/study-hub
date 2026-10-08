// Export to Anki (#198): the cards and their review history as an .apkg that Anki imports. An .apkg is
// a zip of an Anki collection (SQLite, the schema-11 layout every Anki version still imports) and a media
// list. Each card is a note of one "Study Hub" note type, in a deck per course; each grade becomes a row
// of Anki's revlog with the interval the replay gives it, so Anki's statistics and FSRS see the history.
// The grades are Anki's already (1 Again … 4 Easy): nothing is converted. Re-importing updates the notes
// in place, since a note's guid is the card id. Runs in node (tests) and the browser (sql.js is passed in).
import rehypeStringify from "rehype-stringify";
import remarkDirective from "remark-directive";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import YAML from "yaml";
import { BLOCKS } from "../components/blocks.ts";
import type { Card } from "../data/types";
import { dayStart, type Engine } from "./engine.ts";

const DAY = 86_400_000;

// the slice of sql.js used here (the package ships no types; src/sims/db.js loads it the same way)
interface Statement { run(params: unknown[]): void; free(): void }
interface Database { run(sql: string, params?: unknown[]): void; prepare(sql: string): Statement; export(): Uint8Array; close(): void }
export interface SqlJs { Database: new () => Database }

// ---------------------------------------------------------------- markdown to Anki's HTML

type MdNode = { type: string; name?: string; value?: string; position?: { start: { offset?: number }; end: { offset?: number } };
  data?: Record<string, unknown>; children?: MdNode[] };

/** As the unit page renders them (Markdown.tsx): a container (:::name[Title]) becomes a div with its label
 *  and title; an inline `:x` or leaf `::x` directive is not syntax, so it goes back to its source text
 *  ("10:30:45" keeps ":45"); a one-line `$$…$$` is a display formula, though markdown parses it inline. */
function remarkAnki() {
  return (tree: MdNode, file: { toString(): string }) => {
    const source = String(file);
    const src = (n: MdNode) => n.position ? source.slice(n.position.start.offset, n.position.end.offset) : "";
    const walk = (node: MdNode) => {
      if (!node.children) return;
      node.children = node.children.map((child) => {
        if (child.type === "textDirective") return { type: "text", value: src(child) };
        if (child.type === "leafDirective") return { type: "paragraph", children: [{ type: "text", value: src(child) }] };
        if (child.type === "inlineMath" && child.position && source.startsWith("$$", child.position.start.offset)) {
          child.data = { ...child.data, hProperties: { className: ["language-math", "math-display"] } };
        }
        if (child.type === "containerDirective") {
          const first = child.children?.[0];
          const title = first?.type === "paragraph" && first.data?.directiveLabel ? child.children!.shift()!.children ?? [] : [];
          const name = child.name ?? "";
          child.data = { hName: "div", hProperties: { className: ["blk", `blk-${name}`] } };
          child.children!.unshift({ type: "paragraph", data: { hProperties: { className: ["blk-head"] } }, children: [
            { type: "strong", children: [{ type: "text", value: Object.hasOwn(BLOCKS, name) ? BLOCKS[name] : name }] },
            ...(title.length ? [{ type: "text", value: " " }, { type: "emphasis", children: title }] : []),
          ] });
        }
        return child;
      });
      node.children.forEach(walk);
    };
    walk(tree);
  };
}

const processor = unified().use(remarkParse).use(remarkGfm).use(remarkMath).use(remarkDirective).use(remarkAnki as never)
  .use(remarkRehype).use(rehypeStringify);

/** Markdown as HTML for Anki: math in MathJax's \( \) and \[ \], which Anki renders. */
export function toHtml(md: string): string {
  return String(processor.processSync(md))
    .replace(/<pre><code class="language-math math-display">([\s\S]*?)<\/code><\/pre>/g, (_, m) => `\\[${m}\\]`)
    .replace(/<code class="language-math math-display">([\s\S]*?)<\/code>/g, (_, m) => `\\[${m}\\]`)
    .replace(/<code class="language-math math-inline">([\s\S]*?)<\/code>/g, (_, m) => `\\(${m}\\)`);
}

const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// ---------------------------------------------------------------- notes

export interface NoteFields { front: string; back: string; where: string; kind: string }

const KIND: Record<Card["kind"], string> = {
  definition: "Definition", theorem: "Theorem", lemma: "Lemma", proposition: "Proposition", corollary: "Corollary",
  steps: "Method", caution: "Caution", insight: "Key idea", eq: "Formula", output: "What does this print?", method: "Which method?",
};

/** A card's four fields. A method quiz becomes a plain question: its options on the front, the method and
 *  the worked steps on the back (the interactive map has no place in Anki). */
export function fields(card: Card, where: string): NoteFields {
  if (card.kind === "method" && card.options && card.answer !== undefined) {
    const map = (YAML.parse(card.back.replace(/^```solution-map\n|\n?```$/g, "")) ?? {}) as { steps?: { text?: string }[] };
    const steps = (map.steps ?? []).map((s) => s.text).filter(Boolean) as string[];
    return {
      front: toHtml(card.front) + `<ol class="options">${card.options.map((o) => `<li>${escape(o)}</li>`).join("")}</ol>`,
      back: `<p><b>${escape(card.options[card.answer])}</b></p>` + (steps.length ? `<ol>${steps.map((t) => `<li>${toHtml(t)}</li>`).join("")}</ol>` : ""),
      where: escape(where), kind: KIND[card.kind],
    };
  }
  return { front: toHtml(card.front), back: toHtml(card.back), where: escape(where), kind: KIND[card.kind] };
}

// ---------------------------------------------------------------- ids

/** A stable positive integer from a string (FNV-1a over 48 bits): note, card and deck ids that do not
 *  change between exports, so a re-import updates instead of duplicating. */
export function stableId(s: string): number {
  let h = 0xcbf29ce484222325n;
  for (const ch of new TextEncoder().encode(s)) h = BigInt.asUintN(64, (h ^ BigInt(ch)) * 0x100000001b3n);
  return Number(h & 0xffffffffffffn) + 1;
}

/** SHA-1 in plain JS: crypto.subtle exists only in a secure context, and the export must work over http too. */
export function sha1(bytes: Uint8Array): Uint8Array {
  const n = ((bytes.length + 8) >> 6) + 1, w = new Uint32Array(n * 16);
  for (let i = 0; i < bytes.length; i++) w[i >> 2] |= bytes[i] << (24 - (i & 3) * 8);
  w[bytes.length >> 2] |= 0x80 << (24 - (bytes.length & 3) * 8);
  w[n * 16 - 1] = bytes.length * 8;
  w[n * 16 - 2] = Math.floor(bytes.length / 0x20000000);
  let [a, b, c, d, e] = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476, 0xc3d2e1f0];
  const x = new Uint32Array(80), rol = (v: number, k: number) => (v << k) | (v >>> (32 - k));
  for (let blk = 0; blk < w.length; blk += 16) {
    for (let t = 0; t < 80; t++) x[t] = t < 16 ? w[blk + t] : rol(x[t - 3] ^ x[t - 8] ^ x[t - 14] ^ x[t - 16], 1);
    let [A, B, C, D, E] = [a, b, c, d, e];
    for (let t = 0; t < 80; t++) {
      const f = t < 20 ? (B & C) | (~B & D) : t < 40 ? B ^ C ^ D : t < 60 ? (B & C) | (B & D) | (C & D) : B ^ C ^ D;
      const k = t < 20 ? 0x5a827999 : t < 40 ? 0x6ed9eba1 : t < 60 ? 0x8f1bbcdc : 0xca62c1d6;
      const tmp = (rol(A, 5) + f + E + k + x[t]) | 0;
      E = D; D = C; C = rol(B, 30); B = A; A = tmp;
    }
    a = (a + A) | 0; b = (b + B) | 0; c = (c + C) | 0; d = (d + D) | 0; e = (e + E) | 0;
  }
  const out = new Uint8Array(20), v = new DataView(out.buffer);
  [a, b, c, d, e].forEach((h, i) => v.setUint32(i * 4, h >>> 0));
  return out;
}

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

/** A field as Anki sorts and checksums it: tags removed, entities decoded, whitespace kept. */
export function stripHtml(html: string): string {
  return html.replace(/<!--[\s\S]*?-->/g, "").replace(/<[^>]*>/g, "")
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => e[0] === "#"
      ? String.fromCodePoint(parseInt(e[1] === "x" || e[1] === "X" ? e.slice(2) : e.slice(1), e[1] === "x" || e[1] === "X" ? 16 : 10))
      : ENTITIES[e.toLowerCase()] ?? m);
}

/** Anki's note checksum: the first 8 hex digits of the SHA-1 of the stripped first field. */
export function fieldChecksum(field: string): number {
  const d = sha1(new TextEncoder().encode(stripHtml(field)));
  return ((d[0] << 24) >>> 0) + (d[1] << 16) + (d[2] << 8) + d[3];
}

// ---------------------------------------------------------------- the collection

const SCHEMA = `
CREATE TABLE col (id integer primary key, crt integer not null, mod integer not null, scm integer not null, ver integer not null,
  dty integer not null, usn integer not null, ls integer not null, conf text not null, models text not null, decks text not null,
  dconf text not null, tags text not null);
CREATE TABLE notes (id integer primary key, guid text not null, mid integer not null, mod integer not null, usn integer not null,
  tags text not null, flds text not null, sfld integer not null, csum integer not null, flags integer not null, data text not null);
CREATE TABLE cards (id integer primary key, nid integer not null, did integer not null, ord integer not null, mod integer not null,
  usn integer not null, type integer not null, queue integer not null, due integer not null, ivl integer not null,
  factor integer not null, reps integer not null, lapses integer not null, left integer not null, odue integer not null,
  odid integer not null, flags integer not null, data text not null);
CREATE TABLE revlog (id integer primary key, cid integer not null, usn integer not null, ease integer not null, ivl integer not null,
  lastIvl integer not null, factor integer not null, time integer not null, type integer not null);
CREATE TABLE graves (usn integer not null, oid integer not null, type integer not null);
CREATE INDEX ix_notes_usn on notes (usn); CREATE INDEX ix_cards_usn on cards (usn); CREATE INDEX ix_revlog_usn on revlog (usn);
CREATE INDEX ix_cards_nid on cards (nid); CREATE INDEX ix_cards_sched on cards (did, queue, due);
CREATE INDEX ix_revlog_cid on revlog (cid); CREATE INDEX ix_notes_csum on notes (csum);`;

const CSS = `.card { font-family: -apple-system, "Segoe UI", sans-serif; font-size: 19px; line-height: 1.5; text-align: left; color: #1a1a2e; background: #fffefb; }
.night_mode .card { color: #e6e6ea; background: #1a1d22; }
.kind { font-size: 12px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: #00804a; }
.where { margin-top: 1.2em; font-size: 13px; color: #8a8f99; }
pre { background: #0d1117; color: #c9d1d9; padding: .7em 1em; border-radius: 8px; overflow-x: auto; font-size: 15px; }
code { font-family: Menlo, monospace; } .options li { margin: .3em 0; }
.blk { border-left: 3px solid #c9ccd3; padding-left: .8em; margin: .8em 0; } .blk-head { margin: 0 0 .3em; }`;

export interface ExportInput {
  cards: Card[];
  engine: Engine;
  /** "STAT280 · Getting started with R › Parts" for a card */
  where(card: Card): string;
  /** "STAT280" for a course id */
  courseCode(course: string): string;
  now: number;
}

/** The collection's SQLite bytes, and how many reviews went into its revlog. */
export function buildCollection(SQL: SqlJs, input: ExportInput): { bytes: Uint8Array; reviews: number } {
  const { cards, engine, now } = input;
  const db: Database = new SQL.Database();
  db.run(SCHEMA);
  const first = engine.log[0]?.ts ?? now;
  const crt = Math.floor(dayStart(first) / 1000);                 // the collection's day 0 (Anki counts review due days from it)
  const sec = Math.floor(now / 1000);
  const mid = stableId("study-hub:model");

  const decks: Record<string, unknown> = {
    1: { id: 1, name: "Default", mod: sec, usn: -1, lrnToday: [0, 0], revToday: [0, 0], newToday: [0, 0], timeToday: [0, 0], collapsed: false, desc: "", dyn: 0, conf: 1, extendNew: 0, extendRev: 0 },
  };
  const deckOf = new Map<string, number>();
  for (const course of new Set(cards.map((c) => c.course))) {
    const id = stableId(`study-hub:deck:${course}`);
    deckOf.set(course, id);
    decks[id] = { id, name: `Study Hub::${input.courseCode(course)}`, mod: sec, usn: -1, lrnToday: [0, 0], revToday: [0, 0], newToday: [0, 0], timeToday: [0, 0], collapsed: false, desc: "Exported from Study Hub", dyn: 0, conf: 1, extendNew: 0, extendRev: 0 };
  }
  const fld = (name: string, ord: number) => ({ name, ord, sticky: false, rtl: false, font: "Arial", size: 20, media: [] });
  const models = {
    [mid]: {
      id: mid, name: "Study Hub", type: 0, mod: sec, usn: -1, sortf: 0, did: [...deckOf.values()][0] ?? 1,
      flds: [fld("Front", 0), fld("Back", 1), fld("Where", 2), fld("Kind", 3)],
      tmpls: [{ name: "Card 1", ord: 0, qfmt: '<div class="kind">{{Kind}}</div>\n{{Front}}', afmt: '{{FrontSide}}\n<hr id="answer">\n{{Back}}\n<div class="where">{{Where}}</div>', did: null, bqfmt: "", bafmt: "" }],
      css: CSS, latexPre: "\\documentclass[12pt]{article}\n\\special{papersize=3in,5in}\n\\usepackage{amssymb,amsmath}\n\\pagestyle{empty}\n\\begin{document}\n", latexPost: "\\end{document}",
      latexsvg: false, req: [[0, "any", [0]]], tags: [], vers: [],
    },
  };
  const conf = { schedVer: 2, activeDecks: [1], curDeck: 1, newSpread: 0, collapseTime: 1200, timeLim: 0, estTimes: true, dueCounts: true, curModel: mid, nextPos: cards.length + 1, sortType: "noteFld", sortBackwards: false, addToCur: true };
  const dconf = { 1: { id: 1, name: "Default", mod: 0, usn: 0, maxTaken: 60, autoplay: true, timer: 0, replayq: true, dyn: false,
    new: { delays: [1, 10], ints: [1, 4, 7], initialFactor: 2500, order: 1, perDay: engine.settings.newPerDay, bury: true, separate: true },
    lapse: { delays: [10], mult: 0, minInt: 1, leechFails: 8, leechAction: 0 },
    rev: { perDay: engine.settings.reviewsPerDay, ease4: 1.3, fuzz: 0.05, minSpace: 1, ivlFct: 1, maxIvl: 36500, bury: true, hardFactor: 1.2 } } };
  db.run("INSERT INTO col VALUES (1, ?, ?, ?, 11, 0, 0, 0, ?, ?, ?, ?, '{}')",
    [crt, now, now, JSON.stringify(conf), JSON.stringify(models), JSON.stringify(decks), JSON.stringify(dconf)]);

  const cid = new Map<string, number>();
  const insNote = db.prepare("INSERT INTO notes VALUES (?, ?, ?, ?, -1, ?, ?, ?, ?, 0, '')");
  const insCard = db.prepare("INSERT INTO cards VALUES (?, ?, ?, 0, ?, -1, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, ?)");
  let position = 0;
  for (const card of cards) {
    const f = fields(card, input.where(card));
    const nid = stableId(`study-hub:note:${card.id}`), id = stableId(`study-hub:card:${card.id}`);
    cid.set(card.id, id);
    const tags = ` study-hub ${input.courseCode(card.course)} ${card.kind} ${card.concepts.join(" ")} `;
    insNote.run([nid, card.id, mid, sec, tags, [f.front, f.back, f.where, f.kind].join("\x1f"), stripHtml(f.front), fieldChecksum(f.front)]);
    // the card's schedule now: new (by position), learning (due in seconds) or review (due in days from crt)
    const s = engine.state(card.id);
    let type = 0, queue = 0, due = ++position, ivl = 0, left = 0;
    if (s) {
      const learning = s.state !== "review";
      type = s.state === "review" ? 2 : s.state === "relearning" ? 3 : 1;
      queue = learning ? 1 : 2;
      due = learning ? Math.floor(s.due / 1000) : Math.max(0, Math.round((dayStart(s.due) - crt * 1000) / DAY));
      ivl = learning ? 0 : Math.max(1, Math.round((s.due - s.last) / DAY));
      left = learning ? s.stepsLeft * 1000 + s.stepsLeft : 0;        // Anki: steps left today * 1000 + steps left
    }
    const data = s ? JSON.stringify({ s: +s.stability.toFixed(4), d: +s.difficulty.toFixed(4), dr: engine.settings.retention }) : "";
    insCard.run([id, nid, deckOf.get(card.course) ?? 1, sec, type, queue, due, ivl, s ? 2500 : 0, s?.reps ?? 0, s?.lapses ?? 0, left, data]);
  }
  insNote.free(); insCard.free();

  // the history: every grade of a card in the export, with the interval its replay sets
  const insRev = db.prepare("INSERT INTO revlog VALUES (?, ?, -1, ?, ?, ?, ?, ?, ?)");
  const used = new Set<number>();
  for (const { review: r, ivl, lastIvl } of engine.revlog()) {
    const c = cid.get(r.card);
    if (!c) continue;                                  // a card no longer in cards.json
    let id = r.ts;
    while (used.has(id)) id++;                         // revlog ids are milliseconds and must be unique
    used.add(id);
    const type = r.type === "learn" ? 0 : r.type === "review" ? 1 : 2;
    insRev.run([id, c, r.rating, ivl, lastIvl, type === 1 ? 2500 : 0, Math.min(60_000, r.ms), type]);
  }
  insRev.free();
  const bytes = db.export();
  db.close();
  return { bytes, reviews: used.size };
}

// ---------------------------------------------------------------- a zip with stored entries

const CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
  return t;
})();
function crc32(b: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/** A zip of uncompressed entries: all an .apkg needs, and readable by Anki's importer. */
export function zip(files: { name: string; data: Uint8Array }[]): Uint8Array {
  const parts: Uint8Array[] = [], central: Uint8Array[] = [];
  let offset = 0;
  for (const f of files) {
    const name = new TextEncoder().encode(f.name), crc = crc32(f.data);
    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true); local.setUint16(4, 20, true); local.setUint16(8, 0, true);
    local.setUint32(14, crc, true); local.setUint32(18, f.data.length, true); local.setUint32(22, f.data.length, true);
    local.setUint16(26, name.length, true);
    parts.push(new Uint8Array(local.buffer), name, f.data);
    const cen = new DataView(new ArrayBuffer(46));
    cen.setUint32(0, 0x02014b50, true); cen.setUint16(4, 20, true); cen.setUint16(6, 20, true);
    cen.setUint32(16, crc, true); cen.setUint32(20, f.data.length, true); cen.setUint32(24, f.data.length, true);
    cen.setUint16(28, name.length, true); cen.setUint32(42, offset, true);
    central.push(new Uint8Array(cen.buffer), name);
    offset += 30 + name.length + f.data.length;
  }
  const size = central.reduce((n, p) => n + p.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true);
  end.setUint32(12, size, true); end.setUint32(16, offset, true);
  const all = [...parts, ...central, new Uint8Array(end.buffer)];
  const out = new Uint8Array(all.reduce((n, p) => n + p.length, 0));
  let at = 0;
  for (const p of all) { out.set(p, at); at += p.length; }
  return out;
}

/** The whole .apkg (the collection and an empty media list), and how many reviews it carries. */
export function buildApkg(SQL: SqlJs, input: ExportInput): { bytes: Uint8Array; reviews: number } {
  const { bytes, reviews } = buildCollection(SQL, input);
  return { bytes: zip([{ name: "collection.anki2", data: bytes }, { name: "media", data: new TextEncoder().encode("{}") }]), reviews };
}
