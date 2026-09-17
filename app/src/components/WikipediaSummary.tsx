import { useEffect, useState } from "react";

// First paragraph of the English Wikipedia article named by a concept's `wikipedia` field,
// fetched at view time (nothing is stored in the repo) and shown with attribution: the
// text is CC BY-SA 4.0, the same licence as content/. Any failure renders nothing.
const SUMMARY = "https://en.wikipedia.org/api/rest_v1/page/summary/";

interface Summary { extract: string; url: string }

export default function WikipediaSummary({ title }: { title: string }) {
  const [s, setS] = useState<Summary | null>(null);

  useEffect(() => {
    const ctl = new AbortController();
    setS(null);
    fetch(SUMMARY + encodeURIComponent(title.replace(/ /g, "_")), {
      signal: ctl.signal,
      headers: { Accept: "application/json" },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (j && typeof j.extract === "string" && j.extract) {
          setS({ extract: j.extract, url: j.content_urls?.desktop?.page ?? `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}` });
        }
      })
      .catch(() => { /* offline, blocked, or no such article: show nothing */ });
    return () => ctl.abort();
  }, [title]);

  if (!s) return null;
  return (
    <blockquote className="wiki">
      <p>{s.extract}</p>
      <p className="small muted">
        From <a href={s.url}>Wikipedia</a> · <a href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a>
      </p>
    </blockquote>
  );
}
