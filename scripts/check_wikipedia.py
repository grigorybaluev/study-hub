"""Check every concept's `wikipedia` title against the English Wikipedia summary endpoint.

Needs the network, so it is not part of lint: run it by hand before a PR that adds or
changes `wikipedia` fields. Reports, per concept, an article that does not exist, one
that is a disambiguation (or otherwise not a plain article), and a title that redirects
(with the canonical title to use instead). Exit 1 if anything is reported.

    python scripts/check_wikipedia.py            # all concepts
    python scripts/check_wikipedia.py matrix …   # only these slugs
"""
from __future__ import annotations

import json
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "build"))
from schema import load  # noqa: E402

SUMMARY = "https://en.wikipedia.org/api/rest_v1/page/summary/"
HEADERS = {"Accept": "application/json", "User-Agent": "study-hub/check_wikipedia (https://github.com/grigorybaluev/study-hub)"}


def summary(title: str) -> tuple[int, dict | None]:
    url = SUMMARY + urllib.parse.quote(title.replace(" ", "_"), safe="()',")
    try:
        with urllib.request.urlopen(urllib.request.Request(url, headers=HEADERS), timeout=15) as r:
            return r.status, json.load(r)
    except urllib.error.HTTPError as e:
        return e.code, None
    except (urllib.error.URLError, TimeoutError, OSError):
        return 0, None  # network trouble: reported for this slug, the run goes on


def main(argv: list[str]) -> int:
    c = load()
    only = set(argv)
    problems = 0
    checked = 0
    for slug in sorted(only - c.concepts.keys()):
        print(f"{slug}: no such concept")
        problems += 1
    for slug, doc in sorted(c.concepts.items()):
        if only and slug not in only:
            continue
        title = doc.meta.get("wikipedia")
        if not title:
            continue
        checked += 1
        status, j = summary(title)
        time.sleep(0.1)  # be polite; ~200 requests
        if j is None:
            print(f"{slug}: {title!r} -> {'HTTP ' + str(status) if status else 'network error'}")
            problems += 1
            continue
        canonical = (j.get("titles") or {}).get("normalized") or j.get("title")
        if j.get("type") != "standard":
            print(f"{slug}: {title!r} is {j.get('type')!r}, not an article")
            problems += 1
        elif canonical and canonical != title:
            print(f"{slug}: {title!r} redirects to {canonical!r}")
            problems += 1
    print(f"{checked} checked, {problems} problem(s)")
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
