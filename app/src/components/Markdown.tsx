// Renders a unit body: GFM + math + code highlighting, `:::name[title]` containers (#89) and
// labelled blockquotes (legacy) as callouts,
// ```sim fenced blocks as interactive simulations, and a ```python block placed right after a
// sim as that sim's code, collapsed under it.
import { Children, Suspense, isValidElement, lazy, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkDirective from "remark-directive";
import rehypeKatex from "rehype-katex";
import rehypeHighlight from "rehype-highlight";
import YAML from "yaml";
import type { Nodes, PhrasingContent, Root } from "mdast";
import type {} from "mdast-util-directive";
import type { VFile } from "vfile";

// Plotly + the engines are heavy; load them only when a page actually contains a simulation.
const Sim = lazy(() => import("../sims/Sim"));

const CALLOUTS: Record<string, string> = {
  definition: "def", example: "example", note: "note", steps: "steps", "key insight": "insight", caution: "caution",
  theorem: "def", lemma: "def", rule: "def", proposition: "def",
};

/** Container names and their labels; build/schema.py BLOCKS has the same names (lint checks them). */
const BLOCKS: Record<string, string> = {
  definition: "Definition", theorem: "Theorem", lemma: "Lemma", proposition: "Proposition", corollary: "Corollary",
  proof: "Proof", example: "Example", solution: "Solution", note: "Note", remark: "Remark", caution: "Caution",
  insight: "Key insight", steps: "Steps", equations: "Equations",
};

/**
 * `:::name[Title]` … `:::` becomes <section class="blk blk-name"> with a header (label + title).
 * Inline `:x` / `::x` directives are not part of the syntax, so they go back to their source text
 * (otherwise 'hh:mm:ss' would lose ':ss').
 */
function remarkBlocks() {
  return (tree: Root, file: VFile) => {
    const source = String(file);
    const raw = (n: Nodes): PhrasingContent => ({
      type: "text", value: n.position ? source.slice(n.position.start.offset, n.position.end.offset) : "",
    });
    const walk = (node: Nodes) => {
      if (!("children" in node)) return;
      node.children = node.children.map((child) => {
        if (child.type === "textDirective") return raw(child);
        if (child.type === "leafDirective") return { type: "paragraph", children: [raw(child)] };
        if (child.type === "containerDirective") {
          const first = child.children[0];
          const hasLabel = first?.type === "paragraph" && !!first.data?.directiveLabel;
          const title = hasLabel ? first.children : [];
          if (hasLabel) child.children.shift();   // also an empty [] label
          child.data = { hName: "section", hProperties: { className: ["blk", `blk-${child.name}`] } };
          child.children.unshift({
            type: "paragraph", data: { hName: "header", hProperties: { className: ["blk-head"] } },
            children: [
              { type: "strong", data: { hProperties: { className: ["blk-label"] } }, children: [{ type: "text", value: Object.hasOwn(BLOCKS, child.name) ? BLOCKS[child.name] : child.name }] },
              ...(title.length ? [{ type: "emphasis", data: { hName: "span", hProperties: { className: ["blk-title"] } }, children: title } as PhrasingContent] : []),
            ],
          });
        }
        return child;
      }) as typeof node.children;
      node.children.forEach(walk);
    };
    walk(tree);
  };
}

/** Marks a python code block that directly follows a sim block (anywhere in the tree) as that sim's code. */
function remarkSimCode() {
  const walk = (node: Nodes) => {
    if (!("children" in node)) return;
    node.children.forEach((child, i) => {
      const prev = node.children[i - 1];
      if (child.type === "code" && child.lang === "python" && prev?.type === "code" && prev.lang === "sim") {
        child.data = { ...child.data, hProperties: { ...child.data?.hProperties, dataSimCode: true } };
      }
      walk(child);
    });
  };
  return (tree: Root) => walk(tree);
}

/** Label of a `> **Label.** …` or `> **Label — title.** …` blockquote, if any. */
function calloutClass(children: ReactNode): string {
  const first = Children.toArray(children).find((c) => isValidElement(c) && c.type === "p");
  if (!isValidElement(first)) return "";
  const strong = Children.toArray((first.props as { children?: ReactNode }).children)[0];
  if (!isValidElement(strong) || strong.type !== "strong") return "";
  const text = String(Children.toArray((strong.props as { children?: ReactNode }).children)[0] ?? "").toLowerCase();
  const label = Object.keys(CALLOUTS).find((k) => text.startsWith(k));
  return label ? CALLOUTS[label] : "";
}

function textOf(children: ReactNode): string {
  return Children.toArray(children).map((c) => (typeof c === "string" ? c : "")).join("");
}

export default function Markdown({ source }: { source: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath, remarkDirective, remarkBlocks, remarkSimCode]}
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
            if ((only.props as Record<string, unknown>)["data-sim-code"]) {
              return <details className="sim-code"><summary>Show Python code</summary><pre>{children}</pre></details>;
            }
          }
          return <pre>{children}</pre>;
        },
      }}
    >
      {source}
    </ReactMarkdown>
  );
}
