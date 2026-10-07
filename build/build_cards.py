"""content/ -> cards.json: review cards derived from unit blocks (#191). Nothing is authored twice.

A course takes part with `cards: true` in its courses/<CODE>.md. Each titled block of a card kind
becomes a card, and each line of an `equations` block becomes one:

    definition, theorem, lemma,         front: the title                      back: the body (no proofs)
    proposition, corollary
    steps                               front: "How: <title>"                 back: the steps
    caution                             front: "<title> — why, and what …"    back: the body
    insight                             front: "Key idea: <title or part>"    back: the body
    equations line `- *Name*: formula`  front: the name                       back: the formula

Card ids leave out the unit, so units stay free to be renamed, split or merged:
`<course>/<kind>/<slug of title>`, an untitled insight `<course>/insight/<slug of its ## part>`,
an equations line `<course>/eq/<slug of name>`. `{#x}` on a block replaces the slug (keep a card's
history across a title change). A card's concepts: `{concept=a,b}` on the block, else the concept
whose title or alias is the card's title, else the concepts the unit introduces.

lint.py runs the same extraction and reports duplicate ids (error) and untitled card blocks (warning).
"""
from __future__ import annotations

import hashlib
import html
import json
import re
import sys
import unicodedata
from dataclasses import dataclass, field

from schema import OPEN_RE, QUOTE_RE, ROOT, SLUG_RE, Content, Doc, edge_entries, load, unit_slug

OUT = ROOT / "cards.json"

TITLED_KINDS = {"definition", "theorem", "lemma", "proposition", "corollary", "steps", "caution"}
CARD_KINDS = TITLED_KINDS | {"insight", "equations"}

CLOSE_RE = re.compile(r"^(:{3,})\s*$")
FENCE_RE = re.compile(r"^\s*(`{3,}|~{3,})")
HEADING_RE = re.compile(r"^(#{2,3})\s+(.+?)(?:\s+#+)?\s*$")     # a closing # run needs a space before it
EQ_ITEM_RE = re.compile(r"^[-*]\s+\*(?P<name>[^*]+)\*\s*:\s*(?P<rest>.*)$")
SPAN_RE = re.compile(r"(`+)(.+?)\1|\$([^$]+)\$")


# --------------------------------------------------------------------------- text helpers
def plain(md: str) -> str:
    """Inline markdown as text: code and math keep their content, emphasis and link syntax go, images
    and HTML tags drop out, entities are decoded. This is the text remarkHeadingIds
    (app/src/components/Markdown.tsx) reads from a heading: text, inline code and inline math nodes."""
    out, last = [], 0
    for m in SPAN_RE.finditer(md):
        out.append(_strip_inline(md[last:m.start()]))
        out.append(m.group(2) if m.group(1) else m.group(3))
        last = m.end()
    out.append(_strip_inline(md[last:]))
    return "".join(out).strip()


def _strip_inline(s: str) -> str:
    s = re.sub(r"!\[[^\]]*\]\([^)]*\)", "", s)             # an image has no text node
    s = re.sub(r"\[([^\]]*)\]\([^)]*\)", r"\1", s)          # a link keeps its text
    s = re.sub(r"<[^>]+>", "", s)                            # inline HTML is not text
    s = html.unescape(s)
    s = re.sub(r"(\*\*|__)(.+?)\1", r"\2", s)
    s = re.sub(r"(?<![\w*])\*(?!\s)(.+?)(?<!\s)\*(?![\w*])", r"\1", s)
    s = re.sub(r"(?<!\w)_(?!\s)(.+?)(?<!\s)_(?!\w)", r"\1", s)
    return s


def slugify(text: str) -> str:
    """The app's slugify (Markdown.tsx): heading ids and card ids use the same rule."""
    s = unicodedata.normalize("NFKD", text.lower())
    s = re.sub(r"[\u0300-\u036f]", "", s)
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s or "part"


ATTR_KEYS = {"id", "concept"}


def attrs_of(raw: str | None) -> dict:
    """`{#id concept=a,b}` -> {"id": "id", "concept": ["a", "b"]}; other keys are kept for lint to report."""
    out: dict = {}
    for tok in re.findall(r'#[\w-]+|[\w-]+="[^"]*"|[\w-]+=[^\s}]+', raw or ""):
        if tok.startswith("#"):
            out["id"] = tok[1:]
        else:
            k, v = tok.split("=", 1)
            out[k] = [x for x in re.split(r"[,\s]+", v.strip('"')) if x] if k == "concept" else v.strip('"')
    return out


# --------------------------------------------------------------------------- scanning a unit
@dataclass
class Block:
    kind: str
    title: str | None
    attrs: dict
    line: int
    body: list[str] = field(default_factory=list)
    part: tuple[str, str] | None = None      # nearest ## or ### heading: (id, text)
    section: str | None = None               # nearest ## heading text (an insight's name)


def scan(body: str) -> list[Block]:
    """The unit's containers of card kinds, with their raw body lines and the part they sit in.
    Heading ids follow remarkHeadingIds: slug of the text, numbered -2, -3 … when repeated."""
    blocks: list[Block] = []
    stack: list[tuple[int, Block | None]] = []      # (colons, block or None for other kinds)
    fence: str | None = None
    seen: dict[str, int] = {}
    part = section = None
    def keep(line: str):
        for _, b in stack:
            if b:
                b.body.append(line)

    for n, line in enumerate(body.split("\n"), 1):
        if fence is not None:                        # inside code: a line of only the fence char closes it
            keep(line)
            s = line.strip()
            if s.startswith(fence) and not s.strip(fence[0]):
                fence = None
            continue
        f = FENCE_RE.match(line)
        if f:
            fence = f.group(1)
            keep(line)
            continue
        bare = QUOTE_RE.sub("", line, count=1)     # as lint reads it: blocks may sit in a list or quote
        h = HEADING_RE.match(line)
        if h and not stack:
            text = plain(h.group(2))
            base = slugify(text)
            seen[base] = seen.get(base, 0) + 1
            part = (base if seen[base] == 1 else f"{base}-{seen[base]}", text)
            if len(h.group(1)) == 2:
                section = text
            continue
        o = OPEN_RE.match(bare)
        if o:
            keep(line)
            name = o.group(2)
            title = (o.group(3) or "[]")[1:-1].strip() or None
            blk = Block(name, title, attrs_of((o.group(4) or "{}")[1:-1]), n, part=part, section=section) \
                if name in CARD_KINDS else None
            stack.append((len(o.group(1)), blk))
            continue
        c = CLOSE_RE.match(bare)
        if c and stack and len(c.group(1)) == stack[-1][0]:
            _, blk = stack.pop()
            keep(line)
            if blk:
                blocks.append(blk)
            continue
        keep(line)
    blocks.sort(key=lambda b: b.line)
    return blocks


def without_proofs(lines: list[str]) -> list[str]:
    """A statement's body without its nested proof containers."""
    out, depth = [], 0
    for line in lines:
        bare = QUOTE_RE.sub("", line, count=1)
        o, c = OPEN_RE.match(bare), CLOSE_RE.match(bare)
        if depth:
            if o:
                depth += 1
            elif c:
                depth -= 1
            continue
        if o and o.group(2) == "proof":
            depth = 1
            continue
        out.append(line)
    return out


def text_of(lines: list[str]) -> str:
    return "\n".join(lines).strip()


# --------------------------------------------------------------------------- cards of a course
def concept_names(c: Content) -> dict[str, str]:
    """Lower-cased name -> concept. A concept's own title or short name wins over another's alias,
    and an alias shared by several concepts names none of them."""
    names: dict[str, str] = {}
    for slug, doc in sorted(c.concepts.items()):
        for t in (doc.meta.get("title"), doc.meta.get("short")):
            if t:
                names.setdefault(str(t).lower(), slug)
    owners: dict[str, set[str]] = {}
    for slug, doc in c.concepts.items():
        for t in doc.meta.get("aliases") or []:
            owners.setdefault(str(t).lower(), set()).add(slug)
    for alias, slugs in owners.items():
        if alias not in names and len(slugs) == 1:
            names[alias] = next(iter(slugs))
    return names


def course_cards(c: Content, uni_id: str, code: str, docs: list[Doc], names: dict[str, str] | None = None):
    """(cards, problems) for one course. problems: (doc, message, is_error)."""
    names = names if names is not None else concept_names(c)
    cards, problems = [], []
    course = f"{uni_id}/{code}"
    order = lambda d: d.meta.get("order") if isinstance(d.meta.get("order"), int) else 0   # lint reports a bad order
    for doc in sorted(docs, key=order):
        uid = f"{course}/{unit_slug(doc)}"
        introduced = [e["concept"] for e in edge_entries(doc.meta.get("introduces")) if e["concept"]]
        for b in scan(doc.body):
            where = f"line {b.line} :::{b.kind}"
            for k in sorted(b.attrs.keys() - ATTR_KEYS):
                problems.append((doc, f"{where}: unknown attribute {k!r} (cards read #id and concept=)", False))
            if "id" in b.attrs and not SLUG_RE.match(b.attrs["id"]):
                problems.append((doc, f"{where}: {{#{b.attrs['id']}}} is not a slug", True))
            for k in b.attrs.get("concept") or []:
                if k not in c.concepts:
                    problems.append((doc, f"{where}: concept={k} is not a concept", True))

            def card(kind: str, slug_src: str, front: str, back: str, title: str | None, content: str, line_of_block: bool = False):
                # an equations line: the block's {#x} goes before the line's own slug, so a block can
                # tell generic names ("Definition", "Exercise 1") apart from another block's
                if line_of_block:
                    slug = f"{b.attrs['id']}-{slugify(slug_src)}" if b.attrs.get("id") else slugify(slug_src)
                else:
                    slug = b.attrs.get("id") or slugify(slug_src)
                concepts = b.attrs.get("concept") or ([names[title.lower()]] if title and title.lower() in names else introduced)
                cards.append({
                    "id": f"{course}/{kind}/{slug}", "kind": kind, "front": front, "back": back,
                    "course": course, "unit": uid, "order": doc.meta.get("order"),
                    "part": b.part[0] if b.part else None, "part_title": b.part[1] if b.part else None,
                    "concepts": sorted(set(concepts)),
                    # content only (title or name, and the back): rewording a front template changes no hash
                    "hash": hashlib.sha1(f"{content}\n{back}".encode()).hexdigest()[:8],
                })

            title = plain(b.title) if b.title else None
            if b.kind == "equations":
                items, cur = [], None
                for line in b.body:
                    m = EQ_ITEM_RE.match(line)
                    if m:
                        cur = [m.group("name").strip(), m.group("rest")]
                        items.append(cur)
                    elif cur and line.startswith((" ", "\t")) and line.strip():
                        cur[1] += " " + line.strip()
                    elif line.strip():
                        problems.append((doc, f"{where}: line {line.strip()[:40]!r} is not `- *Name*: formula`", False))
                for name, rest in items:     # one card per line; a block {#id} would not tell them apart
                    card("eq", plain(name), name, rest.strip(), plain(name), name, line_of_block=True)
                continue
            if b.kind == "insight":
                name = title or b.section
                if not name:
                    problems.append((doc, f"{where}: an untitled insight needs a ## part above it to be a card", False))
                    continue
                card("insight", name, f"Key idea: {b.title or b.section}", text_of(b.body), title, b.title or b.section)
                continue
            if not title:
                problems.append((doc, f"{where} has no title, so it makes no review card (#191)", False))
                continue
            back = text_of(without_proofs(b.body) if b.kind in {"theorem", "lemma", "proposition", "corollary"} else b.body)
            front = {"steps": f"How: {b.title}", "caution": f"{b.title} — why, and what instead?"}.get(b.kind, b.title)
            card(b.kind, title, front, back, title, b.title)

    where_used: dict[str, list[str]] = {}
    for card_ in cards:
        where_used.setdefault(card_["id"], []).append(card_["unit"].rsplit("/", 1)[1])
    for cid, units in where_used.items():
        if len(units) > 1:
            problems.append((None, f"card id {cid} is used by {len(units)} blocks (units: {', '.join(units)}): "
                                   "rename a title, or give one block `{#other-id}` (on an equations block it goes "
                                   "before each line's name)", True))
    return cards, problems


def card_courses(c: Content):
    for uni in c.universities.values():
        for code, doc in sorted(uni.courses.items()):
            if doc.meta.get("cards") is True:
                yield uni, code, doc


def build(c: Content) -> list[dict]:
    """All cards, problems ignored (lint reports them)."""
    names = concept_names(c)
    out = []
    for uni, code, _ in card_courses(c):
        out += course_cards(c, uni.id, code, uni.units.get(code, []), names)[0]
    return out


def main() -> int:
    """Runs after build_graph.py, which has already refused content with lint errors; this checks only
    the card errors (duplicate ids, bad attributes) rather than linting everything again."""
    import build_graph
    c = load()
    names = concept_names(c)
    cards, errors = [], []
    for uni, code, _ in card_courses(c):
        got, problems = course_cards(c, uni.id, code, uni.units.get(code, []), names)
        cards += got
        errors += [f"{code}: {msg}" for _, msg, is_error in problems if is_error]
    if errors:
        for e in errors:
            print(f"error: {e}")
        print(f"\nnot building: {len(errors)} card error(s); run build/lint.py")
        return 1
    data = {"meta": {"content_version": build_graph.content_version(), "schema": 1}, "cards": cards}
    OUT.write_text(json.dumps(data, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    from collections import Counter
    print(f"wrote {OUT.relative_to(ROOT)} ({OUT.stat().st_size // 1024} KB): {len(cards)} cards")
    for course, n in sorted(Counter(x["course"] for x in cards).items()):
        kinds = Counter(x["kind"] for x in cards if x["course"] == course)
        print(f"  {course}: {n} ({', '.join(f'{k} {v}' for k, v in sorted(kinds.items()))})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
