import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { href, useData } from "../data/load";

interface Hit { kind: string; title: string; sub: string; to: string; key: string }

export default function Search() {
  const d = useData();
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const [hi, setHi] = useState(0);
  // on a phone the box is behind a search button and takes its own row when open (#190)
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  // blur too: on a phone the closed box is a hidden input that would keep the keyboard up
  const done = () => { setQ(""); setOpen(false); input.current?.blur(); };

  const all = useMemo<Hit[]>(() => [
    ...d.courses.map((c) => ({ kind: "course", title: `${c.code} ${c.title}`, sub: c.kind, to: href.course(c.id), key: c.id })),
    ...d.units.map((u) => ({ kind: "unit", title: u.title, sub: u.course.split("/")[1], to: href.unit(u.id), key: u.id })),
    ...d.concepts.map((c) => ({ kind: "concept", title: c.title, sub: [...(c.short ? [c.short] : []), c.domain, ...c.aliases].join(" · "), to: href.concept(c.id), key: c.id })),
    ...d.skills.filter((s) => s.level === "skill").map((s) => ({ kind: "skill", title: s.title, sub: "roadmap", to: href.skill(s.id), key: s.id })),
  ], [d]);

  const hits = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (t.length < 2) return [];
    return all.filter((h) => (h.title + " " + h.sub).toLowerCase().includes(t)).slice(0, 12);
  }, [q, all]);

  useEffect(() => {
    const close = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) done(); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div className={open ? "search open" : "search"} ref={box}>
      <button className="search-toggle" aria-label={open ? "Close search" : "Search"}
        onClick={() => { if (open) done(); else { setOpen(true); input.current?.focus(); } }}>  {/* focus inside the tap, or iOS keeps the keyboard closed */}
        {open ? "\u2715" : <SearchIcon />}
      </button>
      <input
        ref={input}
        placeholder="Search courses, units, concepts…"
        value={q}
        onChange={(e) => { setQ(e.target.value); setHi(0); }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") setHi((h) => Math.min(h + 1, hits.length - 1));
          else if (e.key === "ArrowUp") setHi((h) => Math.max(h - 1, 0));
          else if (e.key === "Enter" && hits[hi]) { nav(hits[hi].to); done(); }
          else if (e.key === "Escape") done();
        }}
      />
      {hits.length > 0 && (
        <div className="results">
          {hits.map((h, i) => (
            <Link key={h.key} to={h.to} className={i === hi ? "hi" : ""} onClick={done}>
              <span className="kind">{h.kind}</span>
              {h.title}
              <div className="small muted">{h.sub}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
      <circle cx="10.5" cy="10.5" r="6.5" /><line x1="15.5" y1="15.5" x2="21" y2="21" />
    </svg>
  );
}
