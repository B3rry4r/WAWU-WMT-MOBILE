"""Coded is not reachable.

Two related defects, both invisible at review and both fatal at runtime:

1. A signal that stands in for a real source -- `bool get isOnline => true`.
   The offline state exists in code, is beautifully designed, and can never be
   entered by any user under any condition. It looks like working code.
2. A raw colour literal where a token layer exists -- the design system is
   the source of truth, and a hex that bypasses it will not follow a theme
   change and will not be caught by anyone reading the diff.

The colour check deliberately does not flag every `Color(0x........)` literal.
Fully transparent colours (`Color(0x00000000)`) and alpha-only white/black
overlays and scrims (e.g. `Color(0x33FFFFFF)`, `Color(0x520F0F12)`) are not
brand colours -- they carry no hue for a token to name, only an opacity over
whatever sits underneath. A token layer cannot express "40% black scrim" any
better than the literal does, and flagging them just teaches people to ignore
this gate. Real hues -- anything with actual chroma, like the purple in
charts.dart -- are still flagged; only the transparent/near-black/near-white
alpha overlays are exempt. See `_is_overlay_or_transparent` below.

WAWU's rule is "colours, spacing and radii come from @/theme, never a literal",
so `literal_strictness: "all"` (gates.config.json) closes the exemption above
and also fails: 3, 4 and 8 digit hex, rgb()/rgba()/hsl()/hsla(), CSS named
colours (`'white'`) on a colour property, and a non-zero numeric literal for
padding, margin, gap or a corner radius. Allowed: the keyword `transparent`
(it names no hue), `0` (no spacing, nothing to tokenise), anything under
`token_layer`, generated tokens and tests (excluded by the file config), and
`allow_paths`. Sizes, borders and font metrics (width, height, borderWidth)
are not spacing or radii and are not checked.
"""

from __future__ import annotations

import fnmatch
import re
from typing import Iterator

from run import Context, Finding

NAME = "hardcoded_signals"

SIGNAL_WORDS = (
    r"online|offline|connected|enabled|disabled|verified|approved|available|ready|"
    r"allowed|premium|pro|paid|subscribed|active|complete|loaded|authenticated|"
    r"hasAccess|canTrade|isAdmin|isStaff|kyc\w*"
)

# Grouped by stack. The semicolon is optional throughout: TypeScript written
# without semicolons escaped every one of these patterns, silently.
COMMON_PATTERNS = [
    # bool get isOnline => true;   /   get isOnline(): boolean { return true }
    (re.compile(rf"\b(?:bool|boolean)\s+get\s+(\w*(?:{SIGNAL_WORDS})\w*)\s*=>\s*(true|false)\s*;?", re.I),
     "getter returns a constant where a real source belongs"),
    # Only immutable bindings: a reassignable `var`/`let` is not a hardcoded
    # signal, it is a variable with an initial value.
    (re.compile(rf"\b(?:const|final|static\s+(?:const|final|readonly)|readonly)\s+(?:bool\s+|boolean\s+)?(\w*(?:{SIGNAL_WORDS})\w*)\s*(?::\s*boolean\s*)?=\s*(true|false)\s*;?", re.I),
     "constant stands in for a runtime signal"),
]

DART_PATTERNS = [
    (re.compile(rf"\b(\w*(?:{SIGNAL_WORDS})\w*)\s*=\s*ValueNotifier(?:<bool>)?\(\s*(true|false)\s*\)", re.I),
     "state holder seeded with a literal instead of a real source"),
    (re.compile(rf"\blate\s+(?:final\s+)?bool\s+(\w*(?:{SIGNAL_WORDS})\w*)\s*=\s*(true|false)", re.I),
     "field seeded with a literal instead of a real source"),
]

NODE_PATTERNS = [
    # useState(true) / signal(true) / useRef(true), including destructured form
    (re.compile(rf"\b(\w*(?:{SIGNAL_WORDS})\w*)\s*(?:,\s*set\w+\s*\])?\s*=\s*(?:useState|useSignal|signal|useRef|ref|reactive)\s*(?:<\s*boolean\s*>)?\(\s*(true|false)\s*\)", re.I),
     "state holder seeded with a literal instead of a real source"),
    (re.compile(rf"\bconst\s*\[\s*(\w*(?:{SIGNAL_WORDS})\w*)\s*,\s*\w+\s*\]\s*=\s*(?:useState|useSignal)\s*(?:<\s*boolean\s*>)?\(\s*(true|false)\s*\)", re.I),
     "state holder seeded with a literal instead of a real source"),
    # Object literal / default props / context default: isVerified: true
    (re.compile(rf"^\s*(\w*(?:{SIGNAL_WORDS})\w*)\s*:\s*(true|false)\s*,?\s*$", re.I | re.M),
     "literal stands in for a runtime signal"),
    # JSX prop pinned on: <Gate isVerified />  /  isVerified={true}
    (re.compile(rf"\b(\w*(?:{SIGNAL_WORDS})\w*)\s*=\s*\{{\s*(true|false)\s*\}}", re.I),
     "prop pinned to a literal instead of a real source"),
]

HEX = re.compile(
    r"(?:Color\(\s*0x([0-9a-fA-F]{6,8})\s*\)"      # Dart: Color(0xFF3B2537)
    r"|#([0-9a-fA-F]{6})\b"                          # CSS/JS: #3B2537
    r"|\[#([0-9a-fA-F]{6})\]"                        # Tailwind arbitrary: bg-[#3B2537]
    r")")


# --- strict literal rules (literal_strictness == "all") ---------------------

_HEX_BODY = r"(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})"
# A hex that is a whole string ('#fff', "#00000080") ...
HEX_WHOLE = re.compile(rf"""['"`]\s*#({_HEX_BODY})\s*['"`]""")
# ... or sits inside a longer string (gradient, shadow). Needs a letter a-f or
# 6/8 digits so "Item #123" is not read as a colour.
HEX_EMBEDDED = re.compile(rf"(?<![\w&/#])#({_HEX_BODY})(?![\w-])")
COLOR_FUNC = re.compile(r"\b(rgba?|hsla?)\s*\(", re.I)

_NAMED = (
    "aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue "
    "blueviolet brown burlywood cadetblue chartreuse chocolate coral cornflowerblue cornsilk "
    "crimson cyan darkblue darkcyan darkgoldenrod darkgray darkgreen darkgrey darkkhaki "
    "darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen "
    "darkslateblue darkslategray darkslategrey darkturquoise darkviolet deeppink deepskyblue "
    "dimgray dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite "
    "gold goldenrod gray green greenyellow grey honeydew hotpink indianred indigo ivory khaki "
    "lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan "
    "lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen "
    "lightskyblue lightslategray lightslategrey lightsteelblue lightyellow lime limegreen linen "
    "magenta maroon mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen "
    "mediumslateblue mediumspringgreen mediumturquoise mediumvioletred midnightblue mintcream "
    "mistyrose moccasin navajowhite navy oldlace olive olivedrab orange orangered orchid "
    "palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru pink plum "
    "powderblue purple rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown "
    "seagreen seashell sienna silver skyblue slateblue slategray slategrey snow springgreen "
    "steelblue tan teal thistle tomato turquoise violet wheat white whitesmoke yellow "
    "yellowgreen"
).split()
NAMED_COLOR = re.compile(r"""['"`]\s*(""" + "|".join(_NAMED) + r""")\s*['"`]""", re.I)
# A named colour only counts where a colour goes: color, backgroundColor,
# borderColor, tintColor, shadowColor, colors={[...]}, fill, stroke.
COLOR_KEY = re.compile(r"(?:\b\w*[cC]olors?|\b[bB]ackground\w*|\bfill|\bstroke|\btint\w*)\s*[:=]")

_SPACING_KEYS = (
    r"padding(?:Top|Bottom|Left|Right|Start|End|Horizontal|Vertical)?|"
    r"margin(?:Top|Bottom|Left|Right|Start|End|Horizontal|Vertical)?|"
    r"gap|rowGap|columnGap|"
    r"border(?:Top|Bottom)?(?:Left|Right|Start|End)?Radius|"
    r"border(?:Top|Bottom)(?:Left|Right|Start|End)Radius"
)
# `padding: 13,`  `gap={8}`  `borderRadius: 7 }`  but not `padding: space.md`,
# `padding: 2 * space.sm`, `padding: 0`.
SPACING_LITERAL = re.compile(
    rf"\b({_SPACING_KEYS})\s*[:=]\s*\{{?\s*-?(?!0+(?:\.0+)?\b)\d+(?:\.\d+)?\s*\}}?\s*(?=[,;)}}]|$)")


_COLOR_CONTEXT = re.compile(r"shadow|gradient|[cC]olors?\b|[bB]ackground|\bfill|\bstroke|\btint", re.I)


def _strict_color_hit(line: str):
    """The literal colour on this line ('#fff', 'rgba()', "'white'"), or None."""
    whole = HEX_WHOLE.search(line)
    if whole:
        return f"#{whole.group(1)}"
    for m in HEX_EMBEDDED.finditer(line):
        digits = m.group(1)
        # "Item #123" is not a colour; "#0003" in a shadow or "#1a2" anywhere is.
        if re.search(r"[a-fA-F]", digits) or _COLOR_CONTEXT.search(line):
            return f"#{digits}"
    m = COLOR_FUNC.search(line)
    if m:
        return f"{m.group(1)}()"
    if COLOR_KEY.search(line):
        m = NAMED_COLOR.search(line)
        if m:
            return f"'{m.group(1)}'"
    return None


# Thresholds for "this is a shade of grey, not a hue": how far apart the R/G/B
# channels are allowed to be (near-monochrome) and how close the average
# channel value must sit to black or to white. A real brand colour like
# 0xB98AE6 (a purple) has a wide R/G/B spread and fails both checks.
_GREY_SPREAD_MAX = 10
_BLACK_AVG_MAX = 20
_WHITE_AVG_MIN = 235


def _is_overlay_or_transparent(hexdigits: str) -> bool:
    """True for a colour literal that carries no hue: fully transparent, or an
    alpha-only near-black/near-white overlay or scrim."""
    digits = hexdigits
    if len(digits) == 8:
        alpha, rgb = digits[0:2], digits[2:8]
    else:
        alpha, rgb = "ff", digits  # 6-digit literal (e.g. #RRGGBB): opaque

    if int(alpha, 16) == 0:
        return True  # fully transparent -- the RGB behind it never renders

    r, g, b = int(rgb[0:2], 16), int(rgb[2:4], 16), int(rgb[4:6], 16)
    spread = max(r, g, b) - min(r, g, b)
    avg = (r + g + b) / 3
    if spread > _GREY_SPREAD_MAX:
        return False  # has real chroma -- a hue, not a grey
    return avg <= _BLACK_AVG_MAX or avg >= _WHITE_AVG_MIN


def run(ctx: Context) -> Iterator[Finding]:
    patterns = list(COMMON_PATTERNS)
    if ctx.stack_is("flutter"):
        patterns += DART_PATTERNS
    if ctx.stack_is("node"):
        patterns += NODE_PATTERNS

    token_layer = ctx.gate_config.get("token_layer", [])
    check_colors = ctx.gate_config.get("check_colors", True)
    # "fail" for projects whose rule is "never hardcode a colour" (WAWU is one).
    color_severity = ctx.gate_config.get("color_severity", "warn")
    allow = set(ctx.gate_config.get("allow_paths", []))
    strict = ctx.gate_config.get("literal_strictness", "overlay-exempt") == "all"
    spacing_severity = ctx.gate_config.get("spacing_severity", color_severity)

    for path in ctx.source_files("source"):
        if ctx.is_test(path):
            continue
        rel = ctx.rel(path)
        if rel in allow:
            continue
        in_token_layer = any(fnmatch.fnmatch(rel, pat) for pat in token_layer)

        for lineno, line in ctx.lines(path):
            stripped = line.strip()
            if stripped.startswith(("//", "///", "#", "*")):
                continue

            for rx, msg in patterns:
                m = rx.search(line)
                if m:
                    yield Finding(
                        gate=NAME,
                        path=rel,
                        line=lineno,
                        message=f"'{m.group(1)}' - {msg}",
                        evidence=line,
                    )
                    break

            if strict and not in_token_layer:
                hit = _strict_color_hit(line) if check_colors else None
                if hit:
                    yield Finding(
                        gate=NAME,
                        path=rel,
                        line=lineno,
                        message=f"raw colour {hit} outside the token layer",
                        evidence=line,
                        severity=color_severity,
                    )
                m = SPACING_LITERAL.search(line)
                if m:
                    yield Finding(
                        gate=NAME,
                        path=rel,
                        line=lineno,
                        message=f"literal {m.group(1)} outside the token layer: use space/radius from @/theme",
                        evidence=line,
                        severity=spacing_severity,
                    )
                continue

            if check_colors and not in_token_layer:
                m = HEX.search(line)
                if m:
                    hexdigits = m.group(1) or m.group(2) or m.group(3)
                    if not _is_overlay_or_transparent(hexdigits):
                        yield Finding(
                            gate=NAME,
                            path=rel,
                            line=lineno,
                            message=f"raw colour {m.group(0)} outside the token layer",
                            evidence=line,
                            severity=color_severity,
                        )
