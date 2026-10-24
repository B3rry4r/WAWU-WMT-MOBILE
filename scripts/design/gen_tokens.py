#!/usr/bin/env python3
"""Generate src/theme/tokens.generated.ts from the design system's CSS tokens.

The tokens in design/_ds/wawu/tokens/*.css are the source of truth. This file
turns them into TypeScript so nobody types a hex, a radius or a spacing value by
hand. Run it after any design-system update:

    python3 scripts/design/gen_tokens.py          # write
    python3 scripts/design/gen_tokens.py --check  # CI: fail if out of date

Cascade rule, copied from colors.css: dark is the default (:root) and light
only overrides some tokens. A token light does not redefine keeps its dark
value, exactly as the browser resolves it.

Box shadows (`--shadow-*`) become React Native `boxShadow` lists, per theme.
Tokens this generator cannot express as a React Native value (blur filters,
fonts) are listed in the generated file's header under NOT GENERATED, so their
absence is visible rather than silent.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
TOKENS = ROOT / "design" / "_ds" / "wawu" / "tokens"
OUT = ROOT / "src" / "theme" / "tokens.generated.ts"

DECL = re.compile(r"--([a-z0-9-]+)\s*:\s*([^;]+);")
BLOCK = re.compile(r"([^{}]+)\{([^{}]*)\}", re.S)
COMMENT = re.compile(r"/\*.*?\*/", re.S)


def camel(name: str) -> str:
    parts = name.split("-")
    out = parts[0] + "".join(p[:1].upper() + p[1:] for p in parts[1:])
    if out[0].isdigit():
        out = "s" + out
    return out


def parse_blocks(css: str) -> list[tuple[str, dict[str, str]]]:
    css = COMMENT.sub("", css)
    blocks = []
    for sel, body in BLOCK.findall(css):
        decls = {k: v.strip() for k, v in DECL.findall(body)}
        if decls:
            blocks.append((sel.strip(), decls))
    return blocks


def load() -> tuple[dict[str, str], dict[str, str]]:
    dark: dict[str, str] = {}
    light: dict[str, str] = {}
    for f in sorted(TOKENS.glob("*.css")):
        css = f.read_text()
        # Reduced-motion overrides live in a media query; the base values are
        # what the app uses, and Flutter reads the platform's own setting.
        css = re.sub(r"@media[^{]*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}", "", css)
        for sel, decls in parse_blocks(css):
            if 'data-theme="light"' in sel:
                light.update(decls)
            elif ":root" in sel or 'data-theme="dark"' in sel:
                dark.update(decls)
    return dark, light


def resolve(value: str, scope: dict[str, str]) -> str:
    for _ in range(5):
        m = re.fullmatch(r"var\(--([a-z0-9-]+)\)", value.strip())
        if not m:
            return value
        value = scope.get(m.group(1), value)
    return value


HEX = re.compile(r"#([0-9a-fA-F]{6})$")
RGBA = re.compile(r"rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)$")
GRAD = re.compile(r"linear-gradient\(\s*([\d.]+)deg\s*,(.+)\)$")


def color(value: str) -> str | None:
    v = value.strip()
    if HEX.match(v):
        return v.upper()
    if m := RGBA.match(v):
        r, g, b = (int(m.group(i)) for i in (1, 2, 3))
        a = float(m.group(4)) if m.group(4) is not None else 1.0
        return f"rgba({r}, {g}, {b}, {a:g})"
    if v == "transparent":
        return "rgba(0, 0, 0, 0)"
    return None


def gradient(value: str) -> dict | None:
    m = GRAD.match(value.strip())
    if not m:
        return None
    stops = [s.strip() for s in re.split(r",(?![^(]*\))", m.group(2))]
    colors, locations = [], []
    for i, s in enumerate(stops):
        parts = s.rsplit(" ", 1)
        has_pos = len(parts) == 2 and parts[1].endswith("%")
        c = color(parts[0] if has_pos else s)
        if c is None:
            return None
        colors.append(c)
        locations.append(round(float(parts[1][:-1]) / 100, 3) if has_pos else round(i / (len(stops) - 1), 3))
    return {"angle": float(m.group(1)), "colors": colors, "locations": locations}


LENGTH = re.compile(r"-?[\d.]+(px)?$")


def shadow(value: str) -> list[dict] | None:
    """A CSS box-shadow as React Native `boxShadow` entries; `none` is an empty list."""
    v = value.strip()
    if v == "none":
        return []
    out = []
    for part in (p.strip() for p in re.split(r",(?![^(]*\))", v)):
        inset = part.startswith("inset ")
        if inset:
            part = part[len("inset "):].strip()
        m = re.match(r"((?:-?[\d.]+(?:px)?\s+){2,4})(.+)$", part)
        if not m:
            return None
        lengths = [float(x[:-2] if x.endswith("px") else x) for x in m.group(1).split()]
        if any(not LENGTH.match(x) for x in m.group(1).split()):
            return None
        c = color(m.group(2))
        if c is None:
            return None
        lengths += [0.0] * (4 - len(lengths))
        entry = {"offsetX": lengths[0], "offsetY": lengths[1], "blurRadius": lengths[2], "spreadDistance": lengths[3], "color": c}
        if inset:
            entry["inset"] = True
        out.append(entry)
    return out


def px(value: str) -> float | None:
    m = re.fullmatch(r"(-?[\d.]+)px", value.strip())
    return float(m.group(1)) if m else None


def num(value: str) -> float | None:
    m = re.fullmatch(r"(-?[\d.]+)(em)?", value.strip())
    return float(m.group(1)) if m else None


def ms(value: str) -> int | None:
    m = re.fullmatch(r"(\d+)ms", value.strip())
    return int(m.group(1)) if m else None


COLOR_PREFIXES = ("surface-", "border-", "text-", "accent", "positive", "warning", "danger",
                  "info", "success", "locked", "tick-", "cur-", "hue-", "brand-", "tgif-", "glow-", "media-")
TEXT_SIZES = ("text-display", "text-title", "text-h1", "text-h2", "text-h3", "text-body",
              "text-sec", "text-caption", "text-label", "text-tab")


def js(v) -> str:
    if isinstance(v, float) and v.is_integer():
        return str(int(v))
    return json.dumps(v, ensure_ascii=False)


def inline(d: dict) -> str:
    return "{ " + ", ".join(f"{k}: {js(v)}" for k, v in d.items()) + " }"


def obj(d: dict, indent: int = 2) -> str:
    pad = " " * indent

    def value(v) -> str:
        if isinstance(v, dict):
            return obj(v, indent + 2)
        if isinstance(v, list) and all(isinstance(x, dict) for x in v):
            return "[" + ", ".join(inline(x) for x in v) + "]"
        return js(v)

    return "{\n" + "".join(f"{pad}{k}: {value(v)},\n" for k, v in d.items()) + " " * (indent - 2) + "}"


def build() -> str:
    dark, light = load()
    light_full = {**dark, **light}
    skipped: list[str] = []

    colors_dark, colors_light, gradients_dark, gradients_light = {}, {}, {}, {}
    for k in dark:
        if not k.startswith(COLOR_PREFIXES) or k in TEXT_SIZES:
            continue
        dv, lv = resolve(dark[k], dark), resolve(light_full[k], light_full)
        dc, lc = color(dv), color(lv)
        if dc and lc:
            colors_dark[camel(k)], colors_light[camel(k)] = dc, lc
            continue
        dg = gradient(dv) or ({"angle": 180.0, "colors": [dc, dc], "locations": [0, 1]} if dc else None)
        lg = gradient(lv) or ({"angle": 180.0, "colors": [lc, lc], "locations": [0, 1]} if lc else None)
        if dg and lg:
            gradients_dark[camel(k)], gradients_light[camel(k)] = dg, lg
            continue
        skipped.append(f"--{k}: {dv}")

    for k in ("scrim-feed", "scrim-card"):
        if k in dark and (g := gradient(dark[k])):
            gradients_dark[camel(k)] = gradients_light[camel(k)] = g
    shadows_dark, shadows_light = {}, {}
    for k, v in dark.items():
        if k.startswith("shadow-"):
            ds, ls = shadow(v), shadow(light_full[k])
            if ds is not None and ls is not None:
                shadows_dark[camel(k[7:])], shadows_light[camel(k[7:])] = ds, ls
                continue
        if k.startswith(("shadow-", "blur-", "font-", "numeric", "press-")):
            skipped.append(f"--{k}: {v}")

    space = {camel(k[6:]): px(v) for k, v in dark.items() if k.startswith("space-") and px(v) is not None}
    radius = {camel(k[7:]): px(v) for k, v in dark.items() if k.startswith("radius-") and px(v) is not None}
    layout = {camel(k): px(dark[k]) for k in ("screen-w", "gutter", "section-gap", "card-pad", "tabbar-h", "control-h", "tap-min") if k in dark}
    size = {camel(k[5:]): px(dark[k]) for k in TEXT_SIZES if k in dark}
    leading = {camel(k[8:]): num(v) for k, v in dark.items() if k.startswith("leading-")}
    tracking = {camel(k[9:]): num(v) for k, v in dark.items() if k.startswith("tracking-")}
    motion = {camel(k[4:]): ms(v) for k, v in dark.items() if k.startswith("dur-") and ms(v) is not None}

    out = [
        "// GENERATED by scripts/design/gen_tokens.py from design/_ds/wawu/tokens/*.css.",
        "// Do not edit by hand: change the design tokens and re-run `npm run tokens`.",
        "//",
        "// NOT GENERATED (no direct React Native value; components implement these):",
        *[f"//   {s.strip()}" for s in skipped],
        "",
        f"export const darkColors = {obj(colors_dark)} as const;",
        "",
        "export type ColorToken = keyof typeof darkColors;",
        "",
        f"export const lightColors: Record<ColorToken, string> = {obj(colors_light)};",
        "",
        "export type GradientToken = { angle: number; colors: readonly string[]; locations: readonly number[] };",
        "",
        f"export const darkGradients = {obj(gradients_dark)} as const;",
        "",
        f"export const lightGradients: Record<keyof typeof darkGradients, GradientToken> = {obj(gradients_light)};",
        "",
        "/** A box shadow as React Native's `boxShadow` takes it (lengths in logical px). */",
        "export type ShadowToken = { offsetX: number; offsetY: number; blurRadius: number; spreadDistance: number; color: string; inset?: boolean };",
        "",
        f"export const darkShadows = {obj(shadows_dark)} as const;",
        "",
        f"export const lightShadows: Record<keyof typeof darkShadows, readonly ShadowToken[]> = {obj(shadows_light)};",
        "",
        f"export const space = {obj(space)} as const;",
        "",
        f"export const radius = {obj(radius)} as const;",
        "",
        f"export const layout = {obj(layout)} as const;",
        "",
        "/** Font sizes in logical px; tracking in em (multiply by the size). */",
        f"export const type = {obj({'size': size, 'leading': leading, 'tracking': tracking})} as const;",
        "",
        "/** Durations in ms. easeSoft is cubic-bezier(0.32, 0.72, 0, 1). */",
        f"export const motion = {obj({**motion, 'easeSoft': [0.32, 0.72, 0, 1]})} as const;",
        "",
    ]
    return "\n".join(out)


def main() -> int:
    text = build()
    if "--check" in sys.argv:
        current = OUT.read_text() if OUT.exists() else ""
        if current != text:
            print("tokens.generated.ts is out of date: run npm run tokens")
            return 1
        print("tokens.generated.ts is up to date")
        return 0
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(text)
    print(f"wrote {OUT.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
