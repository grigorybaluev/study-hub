import { useEffect, useState } from "react";

type Theme = "light" | "dark";
const KEY = "study-hub-theme";

function initial(): Theme {
  try { const t = localStorage.getItem(KEY); if (t === "light" || t === "dark") return t; } catch { /* ignore */ }
  return "light";
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(initial);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem(KEY, theme); } catch { /* ignore */ }
  }, [theme]);
  return (
    <button className="theme-toggle" onClick={() => setTheme(theme === "light" ? "dark" : "light")} title="Switch theme">
      {theme === "light" ? "\u263D Dark" : "\u2600 Light"}
    </button>
  );
}
