"""Convert a course's legacy callouts to :::containers (#89).

    python scripts/convert_callouts.py MATH205            # rewrite the course's units in place
    python scripts/convert_callouts.py MATH205 --dry-run  # only report

A blockquote whose first line is `> **Label.**`, `> **Label — title.**` or `> **Label: title.**`
becomes `:::name[title]` … `:::` when the label maps to a block name (see LABELS). A
`**Equations**` paragraph followed by a list becomes `:::equations`. Blockquotes with any other
label are left alone and listed, so the content pass decides what they are. The conversion is
mechanical: read the diff, then restructure by hand (proofs, solutions, part order).
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
UNITS = ROOT / "content" / "universities" / "concordia" / "units"

LABELS = {
    "definition": "definition", "theorem": "theorem", "lemma": "lemma", "proposition": "proposition",
    "corollary": "corollary", "proof": "proof", "example": "example", "solution": "solution",
    "note": "note", "remark": "remark", "caution": "caution", "key insight": "insight", "steps": "steps",
}
HEAD_RE = re.compile(r"^\*\*(?P<label>[^*]+?)\*\*\s*(?P<rest>.*)$")
FENCE_RE = re.compile(r"^```")


LABEL_RE = re.compile(r"^(?P<head>[A-Za-z' ]+?)(?:\s+\d+)?(?:\s*\((?P<paren>[^)]*)\))?(?:\s*(?:[—–-]|:)\s+(?P<title>.+))?$")


def split_label(text: str) -> tuple[str | None, str | None]:
    """'Example — two dice.' -> ('example', 'two dice'); 'Theorem (ratio test).' -> ('theorem', 'ratio test');
    'Example 1.' -> ('example', None); 'Definition.' -> ('definition', None)."""
    m = LABEL_RE.match(text.strip().rstrip(".:").strip())
    name = LABELS.get(m.group("head").strip().lower()) if m else None
    if not name:
        return None, None
    title = (m.group("title") or m.group("paren") or "").strip() or None
    return name, title


def convert(text: str) -> tuple[str, int, list[str]]:
    lines = text.split("\n")
    out: list[str] = []
    converted, left = 0, []
    i, in_fence = 0, False
    while i < len(lines):
        line = lines[i]
        if FENCE_RE.match(line):
            in_fence = not in_fence
        if in_fence or not line.startswith(">"):
            # **Equations** + list -> :::equations
            if not in_fence and line.strip() == "**Equations**":
                j = i + 1
                while j < len(lines) and not lines[j].strip():
                    j += 1
                k = j
                while k < len(lines) and (lines[k].startswith("- ") or lines[k].startswith("  ")):
                    k += 1
                if k > j:
                    out += [":::equations", *lines[j:k], ":::"]
                    converted += 1
                    i = k
                    continue
            out.append(line)
            i += 1
            continue
        j = i
        while j < len(lines) and lines[j].startswith(">"):
            j += 1
        quote = [re.sub(r"^> ?", "", l) for l in lines[i:j]]
        m = HEAD_RE.match(quote[0])
        name, title = split_label(m.group("label")) if m else (None, None)
        if not name:
            if m:
                left.append(m.group("label").strip())
            out += lines[i:j]
            i = j
            continue
        body = [m.group("rest")] + quote[1:]
        while body and not body[0].strip():
            body.pop(0)
        if title and ("[" in title or "]" in title):   # brackets would end the [title] early
            body.insert(0, f"**{title}.**")
            title = None
        out.append(f":::{name}[{title}]" if title else f":::{name}")
        out += body
        out.append(":::")
        converted += 1
        i = j
    return "\n".join(out), converted, left


def main(argv: list[str]) -> int:
    if not argv or argv[0].startswith("-"):
        print(__doc__)
        return 2
    course, dry = argv[0], "--dry-run" in argv
    files = sorted((UNITS / course).glob("*.md"))
    if not files:
        print(f"no units for {course}")
        return 1
    for f in files:
        text = f.read_text(encoding="utf-8")
        new, n, left = convert(text)
        if n and not dry:
            f.write_text(new, encoding="utf-8")
        note = f"; left as blockquotes: {', '.join(left)}" if left else ""
        print(f"{f.stem}: {n} converted{note}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
