// Renders a unit body: GFM + math + code highlighting, labelled blockquotes as callouts,
// and ```sim fenced blocks as interactive simulations.
import { Children, Suspense, isValidElement, lazy, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeHighlight from "rehype-highlight";
import YAML from "yaml";

// Plotly + the engines are heavy; load them only when a page actually contains a simulation.
const Sim = lazy(() => import("../sims/Sim"));

const CALLOUTS: Record<string, string> = {
  definition: "def", example: "example", note: "note", steps: "steps", "key insight": "insight", caution: "caution",
  theorem: "def", lemma: "def", rule: "def", proposition: "def",
};

/** Label of a `> **Label.** …` or `> **Label — title.** …` blockquote, if any. */
function calloutClass(children: ReactNode): string {
  const first = Children.toArray(children).find((c) => isValidElement(c) && c.type === "p");
  if (!isValidElement(first)) return "";
  const strong = Children.toArray((first.props as { children?: ReactNode }).children)[0];
  if (!isValidElement(strong) || strong.type !== "strong") return "";
  const text = String(Children.toArray((strong.props as { children?: ReactNode }).children)[0] ?? "").toLowerCase();
  const label = text.split(/[—.:]/)[0].trim();
  return CALLOUTS[label] ?? "";
}

function textOf(children: ReactNode): string {
  return Children.toArray(children).map((c) => (typeof c === "string" ? c : "")).join("");
}

export default function Markdown({ source }: { source: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeKatex, [rehypeHighlight, { ignoreMissing: true, plainText: ["sim"] }]]}
      components={{
        blockquote: ({ children }) => <blockquote className={calloutClass(children)}>{children}</blockquote>,
        code: ({ className, children, ...rest }) => {
          if (className === "language-sim" || className === "hljs language-sim") {
            let cfg: Record<string, unknown> | null = null;
            try { cfg = YAML.parse(textOf(children)); } catch { cfg = null; }
            return cfg && typeof cfg.id === "string"
              ? <Suspense fallback={<div className="sim-box"><div className="sim-note">Loading simulation…</div></div>}><Sim cfg={cfg as never} /></Suspense>
              : <pre><code>{children}</code></pre>;
          }
          return <code className={className} {...rest}>{children}</code>;
        },
        pre: ({ children }) => {
          // unwrap <pre> around a sim block so the Sim renders as a block element
          const only = Children.toArray(children)[0];
          if (isValidElement(only)) {
            const cls = (only.props as { className?: string }).className ?? "";
            if (cls.includes("language-sim")) return <>{children}</>;
          }
          return <pre>{children}</pre>;
        },
      }}
    >
      {source}
    </ReactMarkdown>
  );
}
