# EXPLORE-07 · round history

Moved out of [tasks/EXPLORE-07.md](../EXPLORE-07.md) word for word, oldest first. The current state is in that file.

## Builder report

Files: `src/features/explore/{ExploreScreen,ExploreSlider,AdSlide,slider,parts}.ts(x)`, `src/features/events/{api,ExploreEvents}.ts(x)`, `src/features/ads/{api,useAd}.ts`, `src/app/(tabs)/explore.tsx`, tests `explore/__tests__/slider.test.tsx` (new) and `screens.test.tsx` (updated). No fenced file changed; no SHARED-CHANGES row; no BACKEND_GAPS row (G-280, the reading time, already covers "2 min").
Capability checks: swipe order advert, event, advert (`slider.test.tsx`, turns and the rendered order); only adverts with no event, nothing with neither (model and screen tests); TGIF card opens `onOpenTgif` (screen test); a view once per advert and a tap once (fetch bodies counted, a second press changes nothing, no view while the tab is not focused); boards by pictures (see Current state); values from the Hub (reader count from `/stats`, none drawn at 0); states: loading holds X14 for the adverts, TGIF block, TGIF failure with Try again.
Gate counts: see the full check in the hand-back; no gate file changed.

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

