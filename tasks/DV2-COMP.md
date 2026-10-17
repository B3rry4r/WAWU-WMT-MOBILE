---
id: DV2-COMP
title: Shared pieces for tiers, points and the Voice Intro
owner: YOU
area: DESIGN
order: 268
priority: launch
repo: wawu-wmt-mobile
type: component
status: verifying
depends_on: [UI-03, SHARED-06]
decisions: [R-43, R-66, R-68]
passes: [V1, V4, V5, V6]
artboards: [M1, VF11, VF14, M19, PT5]
---
# DV2-COMP · Shared pieces for tiers, points and the Voice Intro

## Current state

As of 17 Oct 2026 (builder, Sonnet, round 2 on the round 1 head 51235be; mobile `wmt/DV2-COMP` from `origin/wmt/SHARED-06` d563eb3, which sits on batch 7 f45ffbd; no backend or wawu-id change, no migration).
- **Status:** verifying. The four pieces and their four preview routes are built; round 2 fixed the verifier's two mediums and four lows (below). Full mobile check, once at the end, `EXIT 0`: typecheck, lint, 192 suites and 3387 tests, gates (10 run, 0 fail, 5 warn as before, 710 files), tasks.
- **Round 2 (the verifier's findings 1 to 6):** (1) the meter caption reads the Lagos day and month from the history's `MONTHS` table (`lagosTime.ts`), never Intl: September is "Sep". (2) `PointsFigure` fits a long balance: a phone sets one line and `adjustsFontSizeToFit` (floor 0.5) on the count and the word; the web, which has no such prop, measures the box and the row and scales the same two texts. Proven in the dev export at 150, 182 and 200 px, light and dark, 7 and 9 digits: inside the parent, one line, never clipped. (3) The error row is the one button "Try again" (the pill's padding is its touch area). (4) Bars: no bar thinner than 2 px, down to none; none drawn until the strip is measured. (5) `TierBadge` takes `stretch` (VF14's full-width chip). (6) The 1.2 line height is `boardLeading`; the figure's styles come from `figureStyles`, not inline objects.
- **Built (`src/components/`, each by props only, no API call, tokens only):**
  - `TierBadge` (`name`, `number`, `stretch`): the kit's `tierBadge`. No number is the tint with the accent ink; a number (Founding Maker #128) is the dark pill with white writing, as VF7a draws it. `stretch` fills the card's width, name at the start (VF14); off, the pill is as wide as its name.
  - `ProductsMeter` (`used`, `allowed`, `caption`, `loading`): "2 of 3 products" with the bar; `productsMeterCaption(tierName, endsAt)` writes "Verify · ends 26 Nov" in Lagos time (three-letter months from `MONTHS`, "Sep" for September). No allowance draws nothing; loading is a block the meter's size.
  - `PointsFigure` (`count`, `size` hero, row, line, chip or tile, `word`, `icon`): the star, the count and "points", never naira; in a narrow parent the count and the word shrink to fit (`pointsFitMinScale` 0.5), never wrap or clip. `formatPoints` and `formatPointsCount` are exported.
  - `VoicePlayer` (`status` idle, loading, playing or error, `progress`, `durationSeconds`, `onToggle`, `label`, `aiVoice`) and `VoiceLabel`: Play and Pause, the 26-bar strip, the length, the "Bio" label and the small "AI voice" tag (R-66). It plays nothing itself: the screen owns the audio.
- **Preview routes (development only, `__DEV__`; a release build goes home):** `/preview/tier-badge`, `/preview/products-meter`, `/preview/points-figure`, `/preview/voice-player`, each with `?state=<name>` or every state on one page. The stack's `--with mobile` export is a production build, so these redirect there: export with `expo export --platform web --dev` (own `TMPDIR`) and serve it, as the builder did (ports 7620 and 7627 baked, nothing else).
- **Compared picture with picture** (390 px, light and dark, from the dev export, beside `render_design.py` M1 VF11 VF14 M19 PT5 VF7a): tier chip on VF14 and VF7a, the meter on M1 and M19, points on PT5 and M19, the player on M1 and VF11 match; the differences are below. Pictures are in the builder's scratch folder (`dv2-comp-b/compare/`), not committed.
- **Differs from a board, on purpose:**
  - M1's chip text is 8 px (2x) tighter on the board because the name row's -0.03em tracking is inherited by the chip there; VF14 and VF7a, which inherit none, match. Not reproduced.
  - VF7a's dark pill is #2A0C3E in both themes; `TierBadge` uses the token `surfaceCardInk` (a step lighter in dark, darker in light). SHARED-CHANGES DV2-COMP #2 asks the lead whether the owner wants the exact colour as its own token.
  - The "AI voice" tag is on no board (R-66 adds it): 20 high, 10 at 700, the sunken tone. With it, M1's strip has about 100 px less than the board's; in a strip too narrow for 26 bars at 2 px the player draws fewer, never thinner (none until the strip is measured, none where no bar fits; below about 280 px of screen the inline label leaves no strip).
  - The length drawn is the clip's whole length (the boards' 0:22 idle and 0:21 playing are the Hub's values, not a countdown).
- **Not drawn by any board, so built plainly:** a full meter (same accent bar), the player's loading and error states (a busy button; the strip becomes "Couldn't play this. Tap to try again." and the whole row is the "Try again" button), a count of one ("1 point"), "1 product".
- **Capability checks:** each state above is a preview state and a test (`src/__tests__/dv2-comp.test.tsx`, 60 tests); no outside brand name in any piece (a test reads the sources); every figure comes from props.
- **Open, none blocking:** SHARED-CHANGES DV2-COMP #2 (the two confetti tokens, for ME-12, which draws VF7). No new BACKEND_GAPS row: G-800 already says the Hub marks the audio `aiVoice` and G-803 covers the badge on public profiles.
- **Next:** a verifier (V1, V4, V5, V6). The screen tasks (VERIFY-01 to 05, ME-12, POINTS-05 to 07, DV2-01 to 04, REF-03) import these pieces and never draw their own.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- `design/CLAUDE.md` and `docs/designer/BRIEF.md` (R-29: where the brief changes a board, build the brief's version); the rulings below outrank both where they differ
- Render each board with `python3 scripts/design/render_design.py <IDs>` and compare picture with picture, light and dark (V5). Board ids come from this file and `design/canvas-inventory.json`, never from a code comment.
- `DECISIONS.md`: R-43, R-66, R-68 (ruled; build what they say). Rulings outrank the boards, the brief and any older task text.
- `tasks/DESIGN-V2-CUT.md` (the list this task was cut in)

## Goal

The pieces that two or more of the new screens draw are built once, in `src/components/`, so no task forks them (law 9): the tier badge, the products meter, the points figure and the Voice Intro player with its "Bio" label and "AI voice" tag.

## Scope

- `src/components/` (fenced: this task is the shared-change pass for them; SHARED-CHANGES row DV2-COMP #1). Pieces: `TierBadge` (Verify, Verify Plus, Founding Maker with an optional number, VF7a), `ProductsMeter` ("2 of 3 products", VF12, VF14, M1, M19), `PointsFigure` (points as a count with the "points" word, never naira, PT1, PT5, W1, M19), `VoicePlayer` (play and pause, progress, the label "Bio" and a small "AI voice" tag, R-66; used on M1, M5 to M7 and VF11).
- Each takes its values by props; none calls the API. Colours, spacing and type come from `@/theme` tokens only (VF7 and VF7a hard-code #C368EA, #FFB020 and #5C64FF in the confetti: map #C368EA to `--accent-fg` and ask for tokens for the other two in the same row).
- A preview route under `src/app/preview/` for each piece, as the pay sheet has, so verifiers can see every state without the API.

## Why a component task

- ME-01, ME-04, VERIFY-03, VERIFY-05, POINTS-05 and DV2-03 all draw these. Building them here, first, is what keeps two tasks from writing two badges.

## Capability checks

- [ ] Each piece draws every state its boards show (badge for each tier and numbered, meter at 0, partial and full, player idle, playing and with the tag) in light and dark.
- [ ] No piece contains a string that names an outside brand (R-68).
- [ ] Each board above (M1, VF11, VF14, M19, PT5) matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the Hub or the user, never a literal; anything the Hub does not serve yet is in `BACKEND_GAPS.md` and its part of the screen is not drawn (R-47).
- [ ] Loading, empty and error states exist and are entered by their real cause (V6), as are the drawn states of these boards.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/DV2-COMP.md](history/DV2-COMP.md).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
