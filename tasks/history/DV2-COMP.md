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

