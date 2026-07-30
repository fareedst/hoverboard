#!/usr/bin/env python3
"""Inject full-block IMPL pseudocode comments into src/ and tests/ loci.

Usage:
  python3 scripts/sync_impl_full_blocks.py [--phase storage|ui|util|all] [--dry-run]
  python3 scripts/sync_impl_full_blocks.py --check   # report Active IMPLs missing leads in src+tests
"""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TIED = ROOT / "tied"
IMPL_DIR = TIED / "implementation-decisions"
INDEX = TIED / "implementation-decisions.yaml"

EXCLUDE = {
    "IMPL-CONFIG_STRUCT",
    "IMPL-ERROR_HANDLING",
    "IMPL-EXAMPLE_IMPLEMENTATION",
    "IMPL-TESTING",
    "IMPL-SAFARI_ADAPTATION",
    "IMPL-MCP_FEEDBACK_TOOLS",
    "IMPL-MODULE_VALIDATION",
    "IMPL-TIED_FILES",
}

STORAGE_RE = re.compile(
    r"STORAGE|BOOKMARK|PINBOARD|NATIVE_HOST|LOCAL_|FILE_|SYNC_|BROWSER_BOOKMARK|"
    r"MOVE_BOOKMARK|URL_TAGS|USAGE",
    re.I,
)
UI_RE = re.compile(
    r"SIDE_PANEL|OVERLAY|POPUP|BADGE|THEME|ICON|DEMO|SCREENSHOT|SELECTION|"
    r"RECENT_TAGS|SUGGESTED|SESSION_TAGS|TAG_|TAB_|SEARCH|MESSAGE|CONTEXT_MENU|"
    r"UI_|UX_|QUICK|EXTENSION_COMMANDS|UIManager|URL_INHIBITION|AI_TAGGING_POPUP|AI_TAG_TEST",
    re.I,
)

BEGIN = "=== IMPL-FULL-BLOCK: {token} ==="
END = "=== END IMPL-FULL-BLOCK: {token} ==="


def load_active_tokens() -> list[str]:
    """Index is a map keyed by IMPL-* (not a list of token: fields)."""
    text = INDEX.read_text(encoding="utf-8")
    tokens: list[str] = []
    current: str | None = None
    for line in text.splitlines():
        m = re.match(r"^(IMPL-[A-Za-z0-9_]+):\s*$", line)
        if m:
            current = m.group(1)
            continue
        if current and re.match(r"^  status:\s*", line):
            status = line.split(":", 1)[1].strip().strip("\"'")
            if status == "Active" and current not in EXCLUDE:
                tokens.append(current)
            current = None
    return tokens


def phase_of(token: str) -> str:
    if STORAGE_RE.search(token) and "TIME_ASYNC" not in token:
        return "storage"
    if UI_RE.search(token):
        return "ui"
    return "util"


def parse_sidecar(path: Path) -> tuple[str, list[tuple[str, str]]]:
    """Return (h1_line, [(h2_title, h2_body_including_title_line), ...])."""
    text = path.read_text(encoding="utf-8")
    lines = text.splitlines()
    h1 = ""
    blocks: list[tuple[str, str]] = []
    i = 0
    while i < len(lines):
        line = lines[i]
        if line.startswith("# ") and not line.startswith("## "):
            h1 = line[2:].strip()
            i += 1
            continue
        if line.startswith("## "):
            title = line[3:].strip()
            start = i
            i += 1
            while i < len(lines) and not lines[i].startswith("## "):
                i += 1
            body = "\n".join(lines[start:i]).rstrip() + "\n"
            blocks.append((title, body))
            continue
        i += 1
    return h1, blocks


def read_detail_paths(token: str) -> tuple[list[str], list[str]]:
    """Prefer detail file; fall back to index slice for same token."""
    detail = IMPL_DIR / f"{token}.yaml"
    text = detail.read_text(encoding="utf-8") if detail.exists() else ""
    if not text:
        # extract from index
        idx = INDEX.read_text(encoding="utf-8")
        m = re.search(
            rf"^{re.escape(token)}:\n(.*?)(?=^IMPL-[A-Za-z0-9_]+:|\Z)",
            idx,
            re.M | re.S,
        )
        text = m.group(1) if m else ""
    code_files: list[str] = []
    tests: list[str] = []
    in_files = False
    in_tests = False
    for line in text.splitlines():
        if re.match(r"^  code_locations:", line) or re.match(r"^code_locations:", line):
            in_files = False
            in_tests = False
            continue
        if re.match(r"^    files:", line) or re.match(r"^  files:", line):
            in_files = True
            in_tests = False
            continue
        if in_files and ("path:" in line):
            code_files.append(line.split("path:", 1)[1].strip().strip("\"'"))
            continue
        if in_files and re.match(r"^    \w", line) and "path:" not in line:
            in_files = False
        if re.match(r"^    tests:", line) or re.match(r"^  tests:", line):
            in_tests = True
            in_files = False
            continue
        if in_tests and re.match(r"^      - ", line):
            val = line.split("-", 1)[1].strip().strip("\"'")
            if val.startswith("tests/") or val.endswith(".js") or val.endswith(".ts"):
                tests.append(val)
            continue
        if in_tests and re.match(r"^  \w", line):
            in_tests = False
    # de-dupe preserving order
    def uniq(xs: list[str]) -> list[str]:
        seen = set()
        out = []
        for x in xs:
            if x not in seen:
                seen.add(x)
                out.append(x)
        return out

    return uniq(code_files), uniq(tests)


def wrap_comment(content: str) -> str:
    # Escape */ in content
    safe = content.replace("*/", "* /")
    # Empty sidecar lines become " *" (no trailing space) so eslint no-trailing-spaces passes.
    body = "\n".join((" * " + ln) if ln else " *" for ln in safe.splitlines())
    return f"/**\n{body}\n */\n"


def build_full_block_comment(token: str, h1: str, blocks: list[tuple[str, str]]) -> str:
    parts = [BEGIN.format(token=token)]
    if h1:
        parts.append(h1)
        parts.append("")
    for _title, body in blocks:
        parts.append(body.rstrip())
        parts.append("")
    parts.append(END.format(token=token))
    return wrap_comment("\n".join(parts).rstrip() + "\n")


MARKER_RE = re.compile(
    r"/\*\*\n \* === IMPL-FULL-BLOCK: (IMPL-[A-Za-z0-9_]+) ===.*?=== END IMPL-FULL-BLOCK: \1 ===\n \*/\n?",
    re.S,
)


def inject_into_file(path: Path, token: str, comment: str, dry_run: bool) -> str:
    if not path.exists():
        return "missing"
    text = path.read_text(encoding="utf-8")
    begin = BEGIN.format(token=token)
    end = END.format(token=token)
    if begin in text and end in text:
        # Replace existing marked block for this token
        pattern = re.compile(
            rf"/\*\*\n \* {re.escape(begin)}.*?{re.escape(end)}\n \*/\n?",
            re.S,
        )
        # Use a callable repl so sidecar backslashes (e.g. \HOME) are not
        # interpreted as re.sub template escapes.
        new_text, n = pattern.subn(lambda _m: comment, text, count=1)
        if n == 0:
            return "marker-miss"
        action = "replaced"
    else:
        # Insert after any existing leading block comments / shebang, before first import/code
        # Prefer: remove a short leading JSDoc that mentions this token (paraphrase), then insert
        new_text = text
        lead = re.match(r"^(?:/\*\*.*?\*/\s*)+", text, re.S)
        if lead and token in lead.group(0) and BEGIN.format(token=token) not in lead.group(0):
            # Strip paraphrased headers that mention this token only if the whole lead is "about" this impl
            # Keep multi-impl headers: if other IMPL-FULL-BLOCK markers exist, don't strip wholesale
            if "=== IMPL-FULL-BLOCK:" not in lead.group(0):
                # Only strip if the lead is relatively short (< 80 lines) and mentions this token
                lead_lines = lead.group(0).count("\n")
                if lead_lines < 80:
                    new_text = text[lead.end() :]
                    action = "stripped+inserted"
                else:
                    action = "inserted"
            else:
                action = "inserted"
        else:
            action = "inserted"
        # Place after any remaining leading full-block comments
        m = re.match(r"^(?:\s*/\*\*.*?\*/\s*)*", new_text, re.S)
        insert_at = m.end() if m else 0
        new_text = new_text[:insert_at] + comment + new_text[insert_at:]
    if new_text != text:
        if not dry_run:
            path.write_text(new_text, encoding="utf-8")
        return action
    return "unchanged"


def guess_loci(token: str) -> tuple[list[str], list[str]]:
    """Fallback guesses when YAML lists empty."""
    slug = token.replace("IMPL-", "").lower().replace("_", "-")
    candidates_src = [
        f"src/features/storage/{slug}.js",
        f"src/features/{slug}.js",
        f"src/core/{slug}.js",
        f"src/config/{slug}.js",
        f"src/shared/{slug}.js",
        f"src/ui/{slug}.js",
    ]
    # common renames
    aliases = {
        "IMPL-BADGE": (["src/core/badge-manager.js"], ["tests/unit/badge-manager.test.js"]),
        "IMPL-STORAGE": (["src/config/config-manager.js"], ["tests/unit/config-manager.test.js"]),
        "IMPL-BOOKMARKING": (["src/core/message-handler.js"], ["tests/unit/message-handler.test.js"]),
        "IMPL-SERVICE_WORKER": (["src/background/service-worker.js", "src/service-worker.js"], []),
        "IMPL-MESSAGE_HANDLING": (["src/core/message-handler.js"], ["tests/unit/message-handler.test.js"]),
        "IMPL-URL_UTILITIES": (["src/shared/utils.js"], ["tests/unit/utils.test.js"]),
        "IMPL-ARRAY_OBJECT_UTILITIES": (["src/shared/utils.js"], ["tests/unit/utils.test.js"]),
        "IMPL-TEXT_UTILITIES": (["src/shared/utils.js"], ["tests/unit/utils.test.js"]),
        "IMPL-TIME_ASYNC_UTILITIES": (["src/shared/utils.js"], ["tests/unit/utils.test.js"]),
        "IMPL-DOM_UTILITIES": (["src/shared/utils.js"], ["tests/unit/utils.test.js"]),
    }
    if token in aliases:
        return aliases[token]
    src = [p for p in candidates_src if (ROOT / p).exists()]
    test = f"tests/unit/{slug}.test.js"
    tests = [test] if (ROOT / test).exists() else []
    return src, tests


def process_token(token: str, dry_run: bool) -> dict:
    sidecar = IMPL_DIR / f"{token}-pseudocode.md"
    if not sidecar.exists():
        return {"token": token, "status": "no-sidecar"}
    h1, blocks = parse_sidecar(sidecar)
    if not blocks:
        return {"token": token, "status": "no-h2"}
    comment = build_full_block_comment(token, h1, blocks)
    code_files, tests = read_detail_paths(token)
    g_src, g_tests = guess_loci(token)
    if not code_files:
        code_files = g_src
    if not tests:
        tests = g_tests
    # Prefer unit tests only for injection; still inject into listed integration if under tests/
    unit_tests = [t for t in tests if t.startswith("tests/unit/")]
    if not unit_tests and tests:
        unit_tests = [t for t in tests if t.startswith("tests/")][:1]
    if not unit_tests:
        unit_tests = g_tests

    results = []
    js_code = [r for r in code_files if r.endswith((".js", ".ts", ".mjs", ".cjs"))]
    if not js_code:
        js_code = g_src
    for rel in js_code:
        results.append((rel, inject_into_file(ROOT / rel, token, comment, dry_run)))
    for rel in unit_tests:
        if rel.endswith((".js", ".ts", ".mjs", ".cjs")):
            results.append((rel, inject_into_file(ROOT / rel, token, comment, dry_run)))
    return {"token": token, "status": "ok", "loci": results, "h2": len(blocks)}


def check_corpus(tokens: list[str]) -> None:
    missing = []
    for token in tokens:
        sidecar = IMPL_DIR / f"{token}-pseudocode.md"
        if not sidecar.exists():
            continue
        _h1, blocks = parse_sidecar(sidecar)
        if not blocks:
            continue
        # use first block lead line
        lead = None
        for _t, body in blocks:
            for line in body.splitlines():
                if "[IMPL-" in line and "How:" in line:
                    lead = line.lstrip("- ").strip()
                    break
            if lead:
                break
        if not lead:
            continue
        # search src and tests for BEGIN marker or lead
        found_src = False
        found_test = False
        needle = BEGIN.format(token=token)

        def scan(paths: list[Path]) -> bool:
            for base in paths:
                if not base.exists():
                    continue
                patterns = ("*.js", "*.mjs", "*.ts", "*.sh", "*.ps1")
                files: list[Path] = []
                if base.is_file():
                    files = [base]
                else:
                    for pat in patterns:
                        files.extend(base.rglob(pat))
                for p in files:
                    try:
                        t = p.read_text(encoding="utf-8")
                    except Exception:
                        continue
                    if needle in t or lead in t:
                        return True
            return False

        found_src = scan(
            [
                ROOT / "src",
                ROOT / "scripts",
                ROOT / "native_host",
                ROOT / "eslint.config.mjs",
                ROOT / "playwright.extension.config.js",
            ]
        )
        found_test = scan([ROOT / "tests"])
        if not (found_src and found_test):
            missing.append((token, found_src, found_test))
    print(f"Active checked: {len(tokens)}; missing src and/or tests: {len(missing)}")
    for token, fs, ft in missing:
        print(f"  {token}: src={fs} tests={ft}")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--phase", choices=["storage", "ui", "util", "all"], default="all")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--check", action="store_true")
    ap.add_argument("--token", action="append", default=[])
    args = ap.parse_args()
    tokens = args.token or load_active_tokens()
    if args.phase != "all" and not args.token:
        tokens = [t for t in tokens if phase_of(t) == args.phase]
    if args.check:
        check_corpus(tokens)
        return 0
    ok = 0
    for token in tokens:
        r = process_token(token, args.dry_run)
        if r["status"] == "ok":
            ok += 1
            loci = ", ".join(f"{a}:{b}" for a, b in r.get("loci", []))
            print(f"OK {token} h2={r['h2']} {loci}")
        else:
            print(f"SKIP {token} {r['status']}")
    print(f"Processed ok: {ok}/{len(tokens)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
