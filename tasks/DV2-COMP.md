---
id: DV2-COMP
title: Shared pieces for tiers, points and the Voice Intro
owner: YOU
area: DESIGN
order: 268
priority: launch
repo: wawu-wmt-mobile
type: component
status: review
depends_on: [UI-03, SHARED-06]
decisions: [R-43, R-66, R-68]
passes: [V1, V4, V5, V6]
artboards: [M1, VF11, VF14, M19, PT5]
---
# DV2-COMP · Shared pieces for tiers, points and the Voice Intro

## Current state

As of 17 Oct 2026 (builder, Sonnet, round 5 on the round 4 head acf1865; mobile `wmt/DV2-COMP` from `origin/wmt/SHARED-06` d563eb3, which sits on batch 7 f45ffbd; no backend or wawu-id change, no migration).
- **Status:** merging (lead). Checked by an independent verifier (report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/DV2-COMP-r5.md`; rounds 1 to 4 in -r2 to -r4 and DV2-COMP.md; round 5 verdict merge, nothing medium or worse; the lows are in tasks/SWEEP-APP.md). Stacked in batch 7 by MERGE-7f (c6da2af, a descendant of acf1865, which DV2-01 and DV2-03 already carry). The four pieces and their four preview routes are built; round 5 gave `PointsFigure` two modes (the round 4 verifier's high and medium, and its lows 3 and 5). Full mobile check, once at the end: `EXIT 0`: typecheck, lint, 192 suites and 3442 tests, gates (10 run, 0 fail, 5 warn as before, 710 files, baseline 0), tasks (log `scratchpad/dv2-comp-b5/logs/mobile-check.log`).
- **Round 5 (the round 4 verifier's findings 1, 2, 3 and 5, the lead's ruling: the figure hugs unless a screen asks it to fit):** round 4's one-pass fitting stands (`pointsFit`, the invisible copies, the floors, the break between digit groups, no loop). What was wrong was the room being always the full width of the parent: in M19's Studio card the title block collapsed to 0, in PT3's value cell the value drew beside its label, a centred or end-aligned parent did not move it, and a hugging pill fed its own width back into the fit. Now there are two modes. DEFAULT (no `fit`): the figure hugs its content like a Text, at the board's size (no width, no room box, no measuring, no copies, never hidden), so the parent places it exactly as the boards draw: M19's count at the end of the card with the title keeping its width (207 px at 390), PT3's value at the row's end, centred, end-aligned, in a pill, PT5's lot row with the date on one line. FIT (`fit`, `fit="start"`, `"center"` or `"end"`; `true` is `'start'`): round 4's behaviour, the room being the parent's width, the content placed inside it by the align value; used where a long number must fit a width the screen knows (PT5's balance beside "Buy points", the previews' 120 and 150 px cases). A change of text no longer blinks (finding 2): the figure keeps the fit it had while the new copy is read (the fit is the room over the last natural widths at that size) and is hidden only before its first reading; 0 hidden frames in a +1 every 700 ms run (hero, narrow 150 px 9 digits, chip). First reveal (finding 3): the height cannot be known before the room is read, so in a narrow room the content below still moves once as the figure first appears (recorded, low); wide rooms do not move. Proof: the verifier's layout probes rebuilt (Chromium 390 px, light and dark, beside M19, PT3 and PT5), RN 0.86.3's own Yoga for FIT (569,835 cases per alignment: 0 unsettled, 0 cut, at most 2 renders; sub-pixel overs only, as round 4), tests for each placement. Details: [history/DV2-COMP.md](history/DV2-COMP.md), Builder report, round 5.
- **Round 4 (superseded by round 5 for the figure's width; the fitting stands):** `PointsFigure` reads three numbers that do not depend on how it is drawn, the ROOM (the width of its outer box, `width: 100%` of the parent) and the NATURAL width of the count and of the word at the board's size (invisible copies, out of the layout, clipped, hidden from screen readers, read once per text and size), and `pointsFit` computes the sizes from them in one pass: full size where it fits, else one line at the largest share that fits with the count never under 11 px and the word never under 10 px (`pointsReadableFloor`), else the word under the count, else the count at 11 px broken only between its digit groups; never an ellipsis, never a digit cut. Nothing shows before all three are known (it keeps its height, invisible). There is no tolerance, cap or read-back, and the web and the phone take the same path. Proof: RN 0.86.3's own Yoga, 13608 cases (4 sizes x 6 counts x 81 widths x 7 pixel scales): 13608 settle, at most 1 render after the measurements, 0 past the parent, 0 cut, 0 under a floor; web: 729-width sweep, window drag and 45 rapid resizes 0 idle commits and never past the parent; the 24 never-cut cases all pass. Round 4 made the figure fill its parent's width; round 5 makes that the FIT mode only. Details: [history/DV2-COMP.md](history/DV2-COMP.md), Builder report, round 4.
- **Round 3 (superseded by round 4 for `PointsFigure`):** the round 2 verifier's findings 1 to 3 were fixed with a tolerance and a cap on the measuring loop, which round 4 replaced; the error row's label (3) stands: "Couldn't play this. Try again" (`voiceErrorLabel`). Finding 4 (below 280 dp) is accepted for launch: no change.
- **Round 2 (the verifier's findings 1 to 6):** (1) the meter caption reads the Lagos day and month from the history's `MONTHS` table (`lagosTime.ts`), never Intl: September is "Sep". (2) `PointsFigure` fits a long balance: a phone sets one line and `adjustsFontSizeToFit` (floor 0.5) on the count and the word; the web, which has no such prop, measures the box and the row and scales the same two texts. Proven in the dev export at 150, 182 and 200 px, light and dark, 7 and 9 digits: inside the parent, one line, never clipped. (3) The error row is the one button "Try again" (the pill's padding is its touch area). (4) Bars: no bar thinner than 2 px, down to none; none drawn until the strip is measured. (5) `TierBadge` takes `stretch` (VF14's full-width chip). (6) The 1.2 line height is `boardLeading`; the figure's styles come from `figureStyles`, not inline objects.
- **Built (`src/components/`, each by props only, no API call, tokens only):**
  - `TierBadge` (`name`, `number`, `stretch`): the kit's `tierBadge`. No number is the tint with the accent ink; a number (Founding Maker #128) is the dark pill with white writing, as VF7a draws it. `stretch` fills the card's width, name at the start (VF14); off, the pill is as wide as its name.
  - `ProductsMeter` (`used`, `allowed`, `caption`, `loading`): "2 of 3 products" with the bar; `productsMeterCaption(tierName, endsAt)` writes "Verify · ends 26 Nov" in Lagos time (three-letter months from `MONTHS`, "Sep" for September). No allowance draws nothing; loading is a block the meter's size.
  - `PointsFigure` (`count`, `size` hero, row, line, chip or tile, `word`, `icon`, `fit`): the star, the count and "points", never naira. Without `fit` it hugs its content at the board's size, like a Text, and the parent places it (M19, PT3, centred, end-aligned, in a pill, PT5's lot row). With `fit` (or `fit="start" | "center" | "end"`) it is the parent's width and fits it: the count and the word shrink (never under 11 px and 10 px), then the word moves under the count, then the count breaks between its digit groups: every digit kept, never clipped, never an ellipsis (`pointsFit`); the parent needs a width of its own. `formatPoints` and `formatPointsCount` are exported.
  - `VoicePlayer` (`status` idle, loading, playing or error, `progress`, `durationSeconds`, `onToggle`, `label`, `aiVoice`) and `VoiceLabel`: Play and Pause, the 26-bar strip, the length, the "Bio" label and the small "AI voice" tag (R-66). It plays nothing itself: the screen owns the audio.
- **Preview routes (development only, `__DEV__`; a release build goes home):** `/preview/tier-badge`, `/preview/products-meter`, `/preview/points-figure`, `/preview/voice-player`, each with `?state=<name>` or every state on one page. The stack's `--with mobile` export is a production build, so these redirect there: export with `expo export --platform web --dev` (own `TMPDIR`) and serve it, as the builder did (ports 7620 and 7627 baked, nothing else).
- **Compared picture with picture** (390 px, light and dark, from the dev export, beside `render_design.py` M1 VF11 VF14 M19 PT5 VF7a): tier chip on VF14 and VF7a, the meter on M1 and M19, points on PT5 and M19, the player on M1 and VF11 match; the differences are below. Pictures are in the builder's scratch folder (`dv2-comp-b/compare/`), not committed.
- **Differs from a board, on purpose:**
  - M1's chip text is 8 px (2x) tighter on the board because the name row's -0.03em tracking is inherited by the chip there; VF14 and VF7a, which inherit none, match. Not reproduced.
  - VF7a's dark pill is #2A0C3E in both themes; `TierBadge` uses the token `surfaceCardInk` (a step lighter in dark, darker in light). SHARED-CHANGES DV2-COMP #2 asks the lead whether the owner wants the exact colour as its own token.
  - The "AI voice" tag is on no board (R-66 adds it): 20 high, 10 at 700, the sunken tone. With it, M1's strip has about 100 px less than the board's; in a strip too narrow for 26 bars at 2 px the player draws fewer, never thinner (none until the strip is measured, none where no bar fits; below about 280 px of screen the inline label leaves no strip).
  - The length drawn is the clip's whole length (the boards' 0:22 idle and 0:21 playing are the Hub's values, not a countdown).
- **Not drawn by any board, so built plainly:** a full meter (same accent bar), the player's loading and error states (a busy button; the strip becomes "Couldn't play this. Tap to try again." and the whole row is one button labelled "Couldn't play this. Try again"), a count of one ("1 point"), "1 product".
- **Capability checks:** each state above is a preview state and a test (`src/__tests__/dv2-comp.test.tsx`, 115 tests); no outside brand name in any piece (a test reads the sources); every figure comes from props.
- **Open, none blocking:** SHARED-CHANGES DV2-COMP #2 (the two confetti tokens, for ME-12, which draws VF7). No new BACKEND_GAPS row: G-800 already says the Hub marks the audio `aiVoice` and G-803 covers the badge on public profiles.
- **Next:** the lead merges with batch 7. The screen tasks (VERIFY-01 to 05, ME-12, POINTS-05 to 07, DV2-01 to 04, REF-03) import these pieces and never draw their own.

Status set to review by the records sync, 25 Oct 2026: merged as app 9c9890bd, verifier PASS in the lead's merge log, 17 Oct.

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
