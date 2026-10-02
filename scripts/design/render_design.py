#!/usr/bin/env python3
"""Render WMT design artboards to PNG, one image per artboard per theme.

Adapted from the verification-harness renderer for THIS export format. The
generic renderer looks for `data-screen-label` in the `.dc.html` files and
finds none here: each `<Flow>.dc.html` is a small shell that fetches
`<Flow>.sections.json` at runtime and lazily injects each section as it
scrolls into view. Run unadapted, it reports zero artboards, and every
"compared against the design" claim built on it would be fake.

What this does instead:
  1. Enumerates artboards from `design/*.sections.json` (every artboard wrapper
     carries `id="W2" data-screen-label="W2 Wallet · Dollar"`).
  2. Serves `design/` over local HTTP (file:// cannot fetch the sections, and
     support.js cannot load React from file://).
  3. Opens the flow, waits for React and every <x-import>, then fills every
     lazy section itself instead of relying on scroll.
  4. Screenshots the dark and the light phone inside each artboard separately:
     build/design_shots/<ID>-dark.png and <ID>-light.png.
  5. Fails loudly (exit 1) when React never loaded, Alan Sans did not load, an
     artboard has no phone, or an image is blank. A smaller honest number beats
     a flattering one.

Usage:
    python3 scripts/design/render_design.py --list
    python3 scripts/design/render_design.py W1 W2          # by id
    python3 scripts/design/render_design.py --flow Wallet  # one flow
    python3 scripts/design/render_design.py                # everything (slow)

Setup: `pip install -r scripts/design/requirements.txt` (playwright, Pillow) and
a Chromium (PLAYWRIGHT_BROWSERS_PATH, /opt/pw-browsers or ~/.cache/ms-playwright).
No network is needed: React 18.3.1 and the Alan Sans variable font are served
from scripts/design/vendor/ (licences beside them), so the render is the same
on any machine and nothing is fetched from unpkg.com or cdn.jsdelivr.net.
"""
from __future__ import annotations

import argparse
import contextlib
import functools
import glob
import http.server
import json
import pathlib
import re
import socketserver
import sys
import threading

ROOT = pathlib.Path(__file__).resolve().parents[2]
DESIGN = ROOT / "design"
OUT = ROOT / "build" / "design_shots"
VENDOR = pathlib.Path(__file__).resolve().parent / "vendor"
# URL fragment the design files request -> (local file, content type). The
# bytes are the ones the design pins: the React files match the SRI hashes in
# design/support.js.
LOCAL_ASSETS = {
    "unpkg.com/react@18.3.1/umd/react.production.min.js":
        ("react.production.min.js", "application/javascript"),
    "unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js":
        ("react-dom.production.min.js", "application/javascript"),
    "cdn.jsdelivr.net/fontsource/fonts/alan-sans:vf@5.3.0/latin-wght-normal.woff2":
        ("alan-sans-vf-latin-wght-normal.woff2", "font/woff2"),
}
ARTBOARD = re.compile(r'<div id="([^"]+)" data-screen-label="([^"]+)"')


def write_inventory(boards: list[dict]) -> pathlib.Path:
    """design/canvas-inventory.json: every artboard id, label, flow, and a hash
    of its markup. Artboard ids in tickets come from here, never from a code
    comment, and a changed hash is how a redesign is noticed."""
    import hashlib
    rows = []
    for sj in sorted(DESIGN.glob("*.sections.json")):
        if not (DESIGN / sj.name.replace(".sections.json", ".dc.html")).exists():
            continue
        sections = json.loads(sj.read_text())
        for html in sections:
            starts = [(m.start(), m.group(1)) for m in ARTBOARD.finditer(html)]
            for k, (pos, aid) in enumerate(starts):
                end = starts[k + 1][0] if k + 1 < len(starts) else len(html)
                b = next(x for x in boards if x["id"] == aid and x["file"] == sj.name.replace(".sections.json", ".dc.html"))
                rows.append({**{k2: b[k2] for k2 in ("id", "label", "flow")},
                             "hash": hashlib.sha256(html[pos:end].encode()).hexdigest()[:16]})
    out = DESIGN / "canvas-inventory.json"
    out.write_text(json.dumps({"artboards": len(rows), "items": rows}, indent=1, ensure_ascii=False) + "\n")
    return out


def enumerate_artboards() -> list[dict]:
    boards = []
    for sj in sorted(DESIGN.glob("*.sections.json")):
        shell = sj.name.replace(".sections.json", ".dc.html")
        if not (DESIGN / shell).exists():
            continue
        sections = json.loads(sj.read_text())
        for i, html in enumerate(sections):
            for aid, label in ARTBOARD.findall(html):
                boards.append({"id": aid, "label": label, "flow": shell[:-8].replace(" Flow", ""),
                               "file": shell, "section": i})
    return boards


@contextlib.contextmanager
def serve(directory: pathlib.Path):
    class Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *args):  # noqa: D401 - the request log is noise here
            pass

    handler = functools.partial(Quiet, directory=str(directory))
    with socketserver.TCPServer(("127.0.0.1", 0), handler) as httpd:
        t = threading.Thread(target=httpd.serve_forever, daemon=True)
        t.start()
        try:
            yield f"http://127.0.0.1:{httpd.server_address[1]}"
        finally:
            httpd.shutdown()


def chromium() -> str | None:
    for pattern in ("/opt/pw-browsers/chromium-*/chrome-linux/chrome",
                    str(pathlib.Path.home() / ".cache/ms-playwright/chromium-*/chrome-linux/chrome")):
        hits = sorted(glob.glob(pattern))
        if hits:
            return hits[-1]
    return None


def is_blank(png: pathlib.Path) -> bool:
    from PIL import Image
    im = Image.open(png).convert("RGB")
    colors = im.getcolors(maxcolors=4096)
    return colors is not None and len(colors) <= 3


FILL_ALL = """async (file) => {
  const host = document.querySelector('[data-slot]')?.parentElement;
  if (!host) return {ok: false, why: 'no section host'};
  const secs = await (await fetch('./' + file.replace('.dc.html', '.sections.json').replace(/ /g, '%20'))).json();
  [...host.children].forEach(d => { if (!d.dataset.filled) { d.dataset.filled = '1'; d.innerHTML = secs[Number(d.dataset.slot)]; d.style.minHeight = ''; } });
  return {ok: true, sections: secs.length};
}"""

READY = """() => ({
  react: typeof window.React,
  unresolved: document.querySelectorAll('x-import').length,
  slots: document.querySelectorAll('[data-slot]').length,
  alanSans: [...document.fonts].some(f => f.family.replace(/"/g, '') === 'Alan Sans' && f.status === 'loaded'),
})"""


def route_local(route) -> None:
    """Answer the design's CDN requests from scripts/design/vendor/. Anything
    else that is not the local design server is refused, so a render never
    depends on (or silently uses) the network."""
    url = route.request.url
    for fragment, (name, ctype) in LOCAL_ASSETS.items():
        if fragment in url:
            route.fulfill(body=(VENDOR / name).read_bytes(), content_type=ctype,
                          headers={"access-control-allow-origin": "*"})
            return
    if url.startswith(("http://127.0.0.1", "data:", "blob:")):
        route.continue_()
    else:
        route.abort()


def render(boards: list[dict]) -> tuple[list[dict], list[dict]]:
    from playwright.sync_api import sync_playwright

    exe = chromium()
    results, failures = [], []
    by_file: dict[str, list[dict]] = {}
    for b in boards:
        by_file.setdefault(b["file"], []).append(b)

    OUT.mkdir(parents=True, exist_ok=True)
    with serve(DESIGN) as base, sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path=exe, ignore_default_args=["--headless"],
            args=["--headless=new", "--ignore-certificate-errors", "--disable-gpu",
                  "--no-sandbox", "--hide-scrollbars", "--no-proxy-server"])
        for fname, group in by_file.items():
            page = browser.new_page(ignore_https_errors=True, viewport={"width": 1600, "height": 1200},
                                    device_scale_factor=2)
            page.route("**/*", route_local)
            page.goto(f"{base}/{fname.replace(' ', '%20')}", wait_until="networkidle", timeout=120_000)
            try:
                page.wait_for_function("document.querySelectorAll('[data-slot]').length > 0", timeout=60_000)
            except Exception:
                pass
            filled = page.evaluate(FILL_ALL, fname)
            try:
                page.wait_for_function("document.querySelectorAll('x-import').length === 0", timeout=60_000)
            except Exception:
                pass
            page.evaluate("document.fonts.ready")
            page.wait_for_timeout(1500)
            st = page.evaluate(READY)
            problems = []
            if st["react"] != "object":
                problems.append("React never loaded (is scripts/design/vendor/ intact?)")
            if not filled.get("ok"):
                problems.append(filled.get("why", "sections not filled"))
            if st["unresolved"]:
                problems.append(f"{st['unresolved']} <x-import> unresolved")
            if not st["alanSans"]:
                problems.append("Alan Sans did not load: renders would be in a fallback face")
            if problems:
                failures += [{"artboard": b["id"], "why": "; ".join(problems)} for b in group]
                page.close()
                continue
            for b in group:
                for theme in ("dark", "light"):
                    el = page.query_selector(f'[id="{b["id"]}"] [data-theme="{theme}"]')
                    if el is None:
                        failures.append({"artboard": b["id"], "theme": theme, "why": "no phone for this theme"})
                        continue
                    el.scroll_into_view_if_needed()
                    page.wait_for_timeout(150)
                    png = OUT / f"{b['id']}-{theme}.png"
                    el.screenshot(path=str(png))
                    if is_blank(png):
                        png.unlink(missing_ok=True)
                        failures.append({"artboard": b["id"], "theme": theme, "why": "rendered blank"})
                        continue
                    results.append({"artboard": b["id"], "theme": theme, "png": str(png.relative_to(ROOT))})
            page.close()
        browser.close()
    return results, failures


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("ids", nargs="*", help="artboard ids, e.g. W1 H3")
    ap.add_argument("--flow", help="one flow, e.g. Wallet")
    ap.add_argument("--label", help="substring of the artboard label")
    ap.add_argument("--list", action="store_true")
    ap.add_argument("--inventory", action="store_true", help="write design/canvas-inventory.json")
    args = ap.parse_args()

    boards = enumerate_artboards()
    if not boards:
        print("no artboards found in design/*.sections.json", file=sys.stderr)
        return 2
    if args.inventory:
        out = write_inventory(boards)
        print(f"wrote {out.relative_to(ROOT)} ({len(boards)} artboards)")
        return 0
    if args.list:
        for b in boards:
            print(f"{b['id']:12} {b['flow']:14} {b['label']}")
        print(f"\n{len(boards)} artboards in {len({b['file'] for b in boards})} flows")
        return 0
    if args.ids:
        boards = [b for b in boards if b["id"] in set(args.ids)]
    if args.flow:
        boards = [b for b in boards if b["flow"].lower() == args.flow.lower()]
    if args.label:
        boards = [b for b in boards if args.label.lower() in b["label"].lower()]
    if not boards:
        print("nothing matched; run --list", file=sys.stderr)
        return 2

    results, failures = render(boards)
    print(f"rendered {len(results)} images for {len({r['artboard'] for r in results})} artboards -> build/design_shots/")
    for f in failures:
        print(f"  NOT RENDERED {f['artboard']} {f.get('theme', '')}: {f['why']}")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
