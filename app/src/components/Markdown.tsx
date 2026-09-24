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
import type {} from "mdast-util-math";
import MathFit from "./MathFit";
import type { VFile } from "vfile";

// Plotly + the engines are heavy; load them only when a page actually contains a simulation.
const Sim = lazy(() => import("../sims/Sim"));
const Automaton = lazy(() => import("./Automaton"));
import Views from "./Views";

const CALLOUTS: Record<string, string> = {
  definition: "def", example: "example", note: "note", steps: "steps", "key insight": "insight", caution: "caution",
  theorem: "def", lemma: "def", rule: "def", proposition: "def",
};

/** Container names and their labels; build/schema.py BLOCKS has the same names (lint checks them). */
const BLOCKS: Record<string, string> = {
  definition: "Definition", theorem: "Theorem", lemma: "Lemma", proposition: "Proposition", corollary: "Corollary",
  proof: "Proof", example: "Example", solution: "Solution", note: "Note", remark: "Remark", caution: "Caution",
  insight: "Key insight", steps: "Steps", equations: "Equations",
  algorithm: "Algorithm", machine: "Machine", trace: "Trace", exercise: "Exercise",
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
          const collapsed = COLLAPSED.has(child.name);
          child.data = { hName: collapsed ? "details" : "section", hProperties: { className: ["blk", `blk-${child.name}`] } };
          child.children.unshift({
            type: "paragraph", data: { hName: collapsed ? "summary" : "header", hProperties: { className: ["blk-head"] } },
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

/** Proofs and solutions start collapsed: the reader opens them (#89). */
const COLLAPSED = new Set(["proof", "solution"]);

/**
 * Display math renders through MathFit, which breaks a formula that is too wide instead of scrolling.
 * A one-line `$$…$$` is parsed as inline math, but its author meant a display, so it gets the same
 * treatment (as a block-level span inside its paragraph).
 */
function remarkMathFit() {
  return (tree: Root, file: VFile) => {
    const source = String(file);
    const walk = (node: Nodes) => {
      const doubled = node.type === "inlineMath" && node.position !== undefined && source.startsWith("$$", node.position.start.offset);
      if (node.type === "math" || doubled) {
        node.data = { hName: node.type === "math" ? "div" : "span", hProperties: { className: ["math-fit-src"], dataTex: node.value }, hChildren: [] };
        return;
      }
      if ("children" in node) node.children.forEach(walk);
    };
    walk(tree);
  };
}

/**
 * Keeps punctuation right after short inline math on the same line as the math, so a comma never
 * starts a line on its own. Long inline math is left alone: it must stay free to wrap on a phone.
 */
function remarkMathPunct() {
  const walk = (node: Nodes) => {
    if (!("children" in node) || (node.data?.hProperties?.className as string[] | undefined)?.includes("math-nowrap")) return;   // not into our own wrappers
    const kids = node.children as Nodes[];
    for (let i = 0; i < kids.length - 1; i++) {
      const math = kids[i], next = kids[i + 1];
      if (math.type !== "inlineMath" || math.data?.hProperties?.dataTex || math.value.length > 40) continue;
      if (next.type !== "text") continue;
      const punct = /^[,.;:!?)]+/.exec(next.value)?.[0];
      if (!punct) continue;
      next.value = next.value.slice(punct.length);
      kids[i] = { type: "emphasis", data: { hName: "span", hProperties: { className: ["math-nowrap"] } },
                  children: [math, { type: "text", value: punct }] } as Nodes;
    }
    kids.forEach(walk);
  };
  return (tree: Root) => walk(tree);
}

/** Inline math that is taller than a line (fractions, sums, integrals, nested scripts). */
const TALL = /\\(?:d?frac|tfrac|sum|prod|int|iint|oint|lim|sqrt|binom|displaystyle|begin|overbrace|underbrace)(?![A-Za-z])|[\^_]\{[^}]*[\^_]/;

/** Paragraphs (and list items) with tall inline math get more line spacing: class math-dense. */
function remarkMathDense() {
  const tall = (node: Nodes): boolean =>
    (node.type === "inlineMath" && !node.data?.hProperties?.dataTex && TALL.test(node.value)) || ("children" in node && node.children.some(tall));
  const mark = (node: Nodes) => {
    const cls = (node.data?.hProperties?.className as string[] | undefined) ?? [];
    node.data = { ...node.data, hProperties: { ...node.data?.hProperties, className: [...cls, "math-dense"] } };
  };
  const walk = (node: Nodes) => {
    if ((node.type === "paragraph" || node.type === "listItem") && tall(node)) mark(node);
    if ("children" in node) node.children.forEach(walk);
  };
  return (tree: Root) => walk(tree);
}

/**
 * A transition table next to a ```automaton diagram (either order, only blank lines between) is
 * one object shown two ways: wrap the pair so it renders as <Views> — side by side, or switchable (#111).
 */
function remarkViews() {
  const walk = (node: Nodes) => {
    if (!("children" in node) || (node.data?.hProperties?.className as string[] | undefined)?.includes("views-src")) return;   // not into our own wrappers
    const kids = node.children as Nodes[];
    for (let i = 0; i < kids.length - 1; i++) {
      const a = kids[i], b = kids[i + 1];
      const isDiagram = (n: Nodes) => n.type === "code" && n.lang === "automaton";
      if ((a.type === "table" && isDiagram(b)) || (isDiagram(a) && b.type === "table")) {
        const pair = a.type === "table" ? [a, b] : [b, a];            // table first: the "Table" tab
        kids.splice(i, 2, { type: "blockquote", data: { hName: "div", hProperties: { className: ["views-src"] } }, children: pair } as Nodes);
      }
    }
    kids.forEach(walk);
  };
  return (tree: Root) => walk(tree);
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
      remarkPlugins={[remarkGfm, remarkMath, remarkDirective, remarkBlocks, remarkMathFit, remarkMathDense, remarkMathPunct, remarkViews, remarkSimCode]}
      rehypePlugins={[rehypeKatex, [rehypeHighlight, { ignoreMissing: true, plainText: ["sim", "automaton"] }]]}
      components={{
        blockquote: ({ children }) => <blockquote className={calloutClass(children)}>{children}</blockquote>,
        code: ({ className, children, ...rest }) => {
          if (className === "language-automaton" || className === "hljs language-automaton") {
            return <Suspense fallback={<div className="automaton" />}><Automaton source={textOf(children)} /></Suspense>;
          }
          if (className === "language-sim" || className === "hljs language-sim") {
            let cfg: Record<string, unknown> | null = null;
            try { cfg = YAML.parse(textOf(children)); } catch { cfg = null; }
            return cfg && typeof cfg.id === "string"
              ? <Suspense fallback={<div className="sim-box"><div className="sim-note">Loading simulation…</div></div>}><Sim cfg={cfg as never} /></Suspense>
              : <pre><code>{children}</code></pre>;
          }
          return <code className={className} {...rest}>{children}</code>;
        },
        div: ({ node: _node, className, children, ...rest }) => className === "math-fit-src"
          ? <MathFit tex={String((rest as Record<string, unknown>)["data-tex"] ?? "")} />
          : className === "views-src" ? <Views>{children}</Views>
          : <div className={className} {...rest}>{children}</div>,
        span: ({ node: _node, className, ...rest }) => className === "math-fit-src"
          ? <MathFit tex={String((rest as Record<string, unknown>)["data-tex"] ?? "")} as="span" />
          : <span className={className} {...rest} />,
        pre: ({ children }) => {
          // unwrap <pre> around a sim block so the Sim renders as a block element
          const only = Children.toArray(children)[0];
          if (isValidElement(only)) {
            const cls = (only.props as { className?: string }).className ?? "";
            if (cls.includes("language-sim") || cls.includes("language-automaton")) return <>{children}</>;
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
