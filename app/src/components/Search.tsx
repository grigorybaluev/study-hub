import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { href, useData } from "../data/load";

interface Hit { kind: string; title: string; sub: string; to: string; key: string }

export default function Search() {
  const d = useData();
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const [hi, setHi] = useState(0);
  const box = useRef<HTMLDivElement>(null);

  const all = useMemo<Hit[]>(() => [
    ...d.courses.map((c) => ({ kind: "course", title: `${c.code} ${c.title}`, sub: c.kind, to: href.course(c.id), key: c.id })),
    ...d.units.map((u) => ({ kind: "unit", title: u.title, sub: u.course.split("/")[1], to: href.unit(u.id), key: u.id })),
    ...d.concepts.map((c) => ({ kind: "concept", title: c.title, sub: [c.domain, ...c.aliases].join(" · "), to: href.concept(c.id), key: c.id })),
    ...d.skills.filter((s) => s.level === "skill").map((s) => ({ kind: "skill", title: s.title, sub: "roadmap", to: href.skill(s.id), key: s.id })),
  ], [d]);

  const hits = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (t.length < 2) return [];
    return all.filter((h) => (h.title + " " + h.sub).toLowerCase().includes(t)).slice(0, 12);
  }, [q, all]);

  useEffect(() => {
    const close = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setQ(""); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div className="search" ref={box}>
      <input
        placeholder="Search courses, units, concepts…"
        value={q}
        onChange={(e) => { setQ(e.target.value); setHi(0); }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") setHi((h) => Math.min(h + 1, hits.length - 1));
          else if (e.key === "ArrowUp") setHi((h) => Math.max(h - 1, 0));
          else if (e.key === "Enter" && hits[hi]) { nav(hits[hi].to); setQ(""); }
          else if (e.key === "Escape") setQ("");
        }}
      />
      {hits.length > 0 && (
        <div className="results">
          {hits.map((h, i) => (
            <Link key={h.key} to={h.to} className={i === hi ? "hi" : ""} onClick={() => setQ("")}>
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
