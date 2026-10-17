# DV2-COMP · round history

Moved out of [tasks/DV2-COMP.md](../DV2-COMP.md) word for word, oldest first. The current state is in that file.

## Builder report

Files changed: `src/components/TierBadge.tsx`, `ProductsMeter.tsx`, `PointsFigure.tsx`, `VoicePlayer.tsx`; `src/app/preview/tier-badge.tsx`, `products-meter.tsx`, `points-figure.tsx`, `voice-player.tsx`; `src/__tests__/dv2-comp.test.tsx`; `SHARED-CHANGES.md` (DV2-COMP #1 applied, #2 new); this file, `docs/LOG.md`, `docs/PROGRESS.md`.
- **Pictures (V5):** M1, VF11, VF14, M19, PT5, VF7a rendered with `render_design.py`, then each piece pictured from a dev web export at 390 px, light and dark, side by side with the board crop; sizes, weights and colours match except the recorded differences in Current state.
- **Tests (V1, V6):** 43 new tests: every state of each piece in dark and light, the pure helpers (`formatPoints`, `productsMeterCaption`, `voiceClock`, `barCountFor`), the four preview routes, no brand name and no colour literal in the sources.
- **Full check (once, at the end, two jest workers):** typecheck, lint, 192 suites and 3370 tests, gates, tasks: `EXIT 0`. GitHub cannot run mobile CI now (billing).
- **Gates:** 10 gates, 0 fail and 5 warn before (701 files) and after (710 files); the five warns are the same PROVISIONAL lines as before. The first run caught `gap` literals in my metrics; renamed, not accepted.
- **Shared change:** DV2-COMP #1 applied here; #2 (confetti tokens) filed for ME-12. No backend, wawu-id, theme or API change.
- **Not done:** the confetti (VF7, VF7a) belongs to ME-12's screens. The audio itself (loading, playing, position) is each screen's to wire with `expo-audio`; the player only draws what it is given.

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._


## Builder report, round 2

Files changed: `src/components/PointsFigure.tsx`, `ProductsMeter.tsx`, `TierBadge.tsx`, `VoicePlayer.tsx`; `src/app/preview/points-figure.tsx` (six fit cases: 7 and 9 digits in a 150, 182 and 200 px parent), `tier-badge.tsx` (a `stretch` case); `src/__tests__/dv2-comp.test.tsx` (43 to 60 tests); this file, `docs/LOG.md`, `docs/PROGRESS.md`.
- **1 (medium) "Sept":** `productsMeterCaption` imports `lagos` and `MONTHS` from `lagosTime.ts`; no Intl. Tests: September (30 Sep 12:00Z, 1 Sep), all 12 months, 30 Sep 22:59:59Z to 30 Sep and 23:00Z to 1 Oct, 31 Dec 22:59Z and 23:59Z, 28 Feb 2026 and 2028, offsets -05:00 and +01:00, a Date.
- **2 (medium) points overflow:** phone: row `flexShrink` and `maxWidth 100%`, count and word `numberOfLines 1`, `adjustsFontSizeToFit`, `minimumFontScale 0.5`. Web: the box takes the layout's width, the row reports its own, `pointsFitScale` rounds down so a pixel never pushes it over; the star and gaps keep their size, the two texts scale (never below 0.5). Pure helpers and the web path are tested (Platform.OS replaced); the phone path is tested by its props (no device here).
  Measured in a dev export (own TMPDIR, ports 7620 and 7627 baked), figure inside its parent, one line, nothing clipped, 12 of 12 (light and dark): 7 digits 15.6, 19.8 and 22 px; 9 digits 13.2, 16.9 and 18.9 px for 150, 182 and 200. Pictures: `scratchpad/dv2-comp-b/r2/shots/sheet-fit-dark.png`, `sheet-fit-light.png`; script `fit.py`.
- **3 (low) error row:** the whole row (circle, words) is one Pressable "Try again" (`vp-button`), with a hit slop over the pill's padding; the circle still scales on press. Test: one button, a press on the words fires `onToggle`. Browser: clicking the words leaves the error.
- **4 (low) bars:** `barCountFor` is `floor((width + gap) / (2 + gap))` capped at 26, 0 for an unmeasured or empty strip, no floor of 8; no bars until `onLayout`. Measured: 390 px 26 at 3.22, 360 26 at 2.08, 320 16 at 2.13, 280 6 at 2.31, 240 none. A test walks widths 1 to 400: never under 2 px.
- **5 (low) `stretch`:** `TierBadge stretch` is `alignSelf: stretch`; in the preview and a test (350 px wide against 72 px).
- **6 (low):** `boardLeading = 1.2` named; `figureStyles(size, scale)` builds the text styles once per size and scale (the Button and FilterChips pattern). The meter's `aria-valuenow` on web is not changed (the label already carries "2 of 3 products").
- **Not done:** below about 280 px of screen the inline Bio and AI voice label leaves no strip and, at 240, the tag meets the pill's edge: not in the findings, noted only.
- **Checks:** dv2-comp 60 passed; eslint on the 7 changed files EXIT 0; typecheck; gates EXIT 0 (10 run, 0 fail, 5 warn as before, 710 files); full check, once at the end, EXIT 0 (log `scratchpad/dv2-comp-b/r2/logs/mobile-check.log`).
