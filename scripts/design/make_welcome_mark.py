#!/usr/bin/env python3
"""Make the welcome screen's mark: the vertical logo with a purple glow (R-90).

The glow is baked into the pictures so it looks the same on iOS, Android and the
web: nothing is drawn at run time (no blur view, no shadow, no native module).

Source (read only): assets/brand/source/vertical-white.svg, the P holding WHO MADE
THIS with the purple drop. The SVG is drawn once per density by the Chromium that
scripts/design/render_design.py already uses, on a clear ground; the glow is that
drawing's own shape blurred two ways and tinted with the accent colour, laid under
it. The accent is read from src/theme/tokens.generated.ts, never typed here.

Writes assets/images/welcome-mark.png, welcome-mark@2x.png and welcome-mark@3x.png.
All three share one drawing: MARK_W points of mark, GLOW_PAD points of room for the
glow on every side, so the screen sizes the picture in points and picks a density.

Usage:
    python3 scripts/design/make_welcome_mark.py
Setup: `pip install -r scripts/design/requirements.txt` (playwright, Pillow).
"""
from __future__ import annotations

import glob
import io
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
SVG = ROOT / "assets/brand/source/vertical-white.svg"
TOKENS = ROOT / "src/theme/tokens.generated.ts"
OUT = ROOT / "assets/images"

#: The mark's size in points (the SVG's own shape, viewBox 171.6 x 186.53, fitted inside; whole points so
#: every density is an exact multiple of the 1x file), and the room around it for the glow, in points.
MARK_W, MARK_H = 190, 207
GLOW_PAD = 80
#: Glow layers: (blur radius in points, strength 0 to 1). A wide soft halo, a nearer
#: glow, and a tight one hugging the letters, so it reads as light and not a shadow.
GLOW = ((38.0, 0.75), (15.0, 0.75), (4.5, 0.85))
DENSITIES = ((1, "welcome-mark.png"), (2, "welcome-mark@2x.png"), (3, "welcome-mark@3x.png"))


def accent() -> tuple[int, int, int]:
    """The dark theme's accent colour from the generated tokens."""
    text = TOKENS.read_text()
    block = text[text.index("darkColors"):]
    hit = re.search(r'\baccent:\s*"#([0-9A-Fa-f]{6})"', block)
    if not hit:
        sys.exit("make_welcome_mark: no accent in " + str(TOKENS))
    h = hit.group(1)
    return int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)


def chromium() -> str:
    for pattern in ("/opt/pw-browsers/chromium-*/chrome-linux/chrome",
                    str(pathlib.Path.home() / ".cache/ms-playwright/chromium-*/chrome-linux/chrome")):
        hits = sorted(glob.glob(pattern))
        if hits:
            return hits[-1]
    sys.exit("make_welcome_mark: no Chromium found")


def draw_mark(browser, width: int, height: int):
    """The SVG on a clear ground at an exact pixel size."""
    from PIL import Image

    svg = SVG.read_text()
    svg = svg[svg.index("<svg"):]
    page = browser.new_page(viewport={"width": width, "height": height}, device_scale_factor=1)
    page.set_content(
        "<!doctype html><style>html,body{margin:0;background:transparent}"
        f"svg{{display:block;width:{width}px;height:{height}px}}</style>" + svg)
    png = page.screenshot(omit_background=True, clip={"x": 0, "y": 0, "width": width, "height": height})
    page.close()
    return Image.open(io.BytesIO(png)).convert("RGBA")


def make(browser, scale: int, color: tuple[int, int, int]):
    from PIL import Image, ImageChops, ImageFilter

    mark_w, mark_h = MARK_W * scale, MARK_H * scale
    pad = GLOW_PAD * scale
    size = (mark_w + 2 * pad, mark_h + 2 * pad)

    mark = draw_mark(browser, mark_w, mark_h)
    shape = Image.new("L", size, 0)
    shape.paste(mark.getchannel("A"), (pad, pad))

    # Each layer is the shape blurred, brightened so a thin letter still lights up, then
    # scaled by its strength; the layers stack like light does (1 - (1-a)(1-b)).
    alpha = Image.new("L", size, 0)
    for radius, strength in GLOW:
        layer = shape.filter(ImageFilter.GaussianBlur(radius * scale / 2))
        layer = layer.point(lambda v, s=strength: min(255, round(v * 2.2 * s)))
        alpha = ImageChops.screen(alpha, layer)

    out = Image.new("RGBA", size, color + (0,))
    out.putalpha(alpha)
    out.alpha_composite(mark, (pad, pad))
    return out


def main() -> None:
    from playwright.sync_api import sync_playwright

    color = accent()
    OUT.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(
            executable_path=chromium(), ignore_default_args=["--headless"],
            args=["--headless=new", "--disable-gpu", "--no-sandbox", "--hide-scrollbars", "--no-proxy-server"])
        for scale, name in DENSITIES:
            img = make(browser, scale, color)
            img.save(OUT / name, optimize=True)
            print(f"{name}: {img.width} x {img.height}, {(OUT / name).stat().st_size} bytes")
        browser.close()


if __name__ == "__main__":
    main()
