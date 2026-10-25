---
id: EXPLORE-07
title: The Explore slider: events and adverts take turns, and TGIF on Explore
owner: YOU
area: EXPLORE
order: 282
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: review
depends_on: [ADS-07, ADS-01, EXPLORE-01, HOME-16, HOME-09]
decisions: [R-59, R-68]
passes: [V1, V4, V5, V6, V9]
artboards: [X16, X17]
---
# EXPLORE-07 · The Explore slider: events and adverts take turns, and TGIF on Explore

## Current state

As of 17 Oct 2026.
- **Status:** merging (lead). Checked by an independent verifier (report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/EXPLORE-07.md`, verdict merge, nothing medium or worse; the lows are in tasks/SWEEP-APP.md). Stacked in batch 7 by MERGE-7f. Built by a Sonnet builder on `wmt/EXPLORE-07`, stacked on `origin/wmt/MERGE-7` (`0aca612c`). App only: no backend, wawu-id, contract or migration change. No PR (the lead opens it).
- **Built:** the featured-event card on Explore is now a slider (`ExploreSlider.tsx`). Its slides take turns, an advert first: advert, event, advert, event, each list in the order the Hub serves it (`slider.ts`, `sliderSlides`). Adverts come from `GET /ads?placement=explore_slider` (`fetchAdList` and `useAdList` in `src/features/ads`), events from every featured event (`fetchFeaturedEvents`, one page of 20, `featuredListKey`). With no featured event it is adverts only (X17), with no advert events only, with neither it is not drawn (no empty frame). One slide is not a pager: no dots, no swipe. Swipe is a paged horizontal scroll; the dots are one per slide, the current one 16 wide (`sdots` in `design/_gen/explore.js`), 14 up on an advert and 18 up on an event.
- **Adverts:** `AdSlide.tsx` is the board's `adHero` (artwork, SPONSORED chip, headline, line, the whole card opens the advert's event). Every word but SPONSORED is the advertiser's (R-68). An advert with no picture or an unknown button is dropped by `drawable()`. A view is sent when the advert's slide is the one on screen and Explore is the tab on screen, a tap when it is pressed, each once per advert (`useAdReports`, ADS-05; the Hub keeps one of each a day per person). A failed advert read is no adverts, never an error.
- **TGIF on Explore (X1):** the card under the slider is the Home `TgifCard` unchanged (`src/features/home/TgifCard.tsx`), reading `GET /tgif/{date}` and `/stats`; it opens `/tgif` (`onOpenTgif`, wired in `src/app/(tabs)/explore.tsx`). "12.4K reading today" is the Hub's reader count in the board's wording; with none or a failed read the count is left out, never a literal. A failed day draws `TgifProblem` with Try again; while the day is on the way a 104 high block holds its place. **DV2-RM must keep `TgifCard.tsx` (or move it) when it removes the Home TGIF card: Explore imports it.**
- **Copy (R-69):** the creators rail heading reads "Who Made This?" as X1 draws it (was "Featured creators"). "Search Who Made This?" is the search pill's placeholder; the pill is EXPLORE-02's and is not on this base, so nothing is printed here (R-47). Whoever lands EXPLORE-02 on this base uses that text.
- **Loading and states (V6):** X14 holds until the categories, featured creators, events and adverts have answered or failed (adverts and events do not retry), so nothing moves after the first paint. Entered by their real causes: the slider by what the Hub serves, the TGIF block by the day read, the banner by a failed categories or creators read.
- **Differs from the boards, for recorded reasons:** (1) X17 draws a "Sponsored" block with a second advert in Upcoming events' place. Not drawn: the Hub serves an advert only while its event is published and upcoming (`src/ads/ads-serving.ts`), so Upcoming events always holds that event and the block could never replace an empty rail. (2) X16 overlays two sets of dots (the event card's own and the slider's); the app draws one set. (3) The boards' search pill, bell and Create are not drawn (EXPLORE-02, ME-14; Create is drawn only for creator accounts as before). (4) "2 min" on the TGIF card is left out (G-280). (5) The board's sample advertiser and its picture are never drawn (R-68). (6) The Hub's TGIF series name and day replace the board's.
- **Existing tests changed because the subject changed (R-59 and the capability "no advert and no event: no slider")**: `src/features/explore/__tests__/screens.test.tsx` now answers the advert list and the TGIF day by default, its featured-events request is the 20-row page, the "empty hero frame" and "three decorative dots" tests became "no slider" tests, and the heading and word lists say "Who Made This?" and carry the TGIF card. `HeroDots`, `ExploreFeaturedEventEmpty` and their metrics are removed from `parts.tsx` (nothing draws them now).
- **Checks (builder):** typecheck clean; eslint 0 errors (7 warnings, none in these files); new `slider.test.tsx` 21 tests; the explore, events and ads suites 445 tests pass; full local check below. Pictures at 390 px, light and dark, from a web export through a local stack (Hub on backend `wmt/MERGE-7` `9c40478`): `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/explore-07-b/pics/` (`x1-advert-first`, `x16-event-slide`, `x17-no-events`, each `-dark` and `-light`), beside `build/design_shots/X1, X16, X17`. Two seeded neutral adverts (Gospel Night Live, Harvest Praise Night) with generated artwork; the export predates the removal of the unreachable Sponsored block, which no picture reaches.
- **Not done / for the verifier:** the swipe is checked by scroll events in jest and by a wheel scroll on the web export (the web export does not snap a scripted scroll); a finger swipe on a phone is not run. The slider has no cap and no autoplay (none ruled); with very many adverts the dots would run long (no figure invented).
- **Next:** the lead merges with batch 7. Then DV2-RM (see the TGIF note above: it keeps `TgifCard` and `TgifProblem`).

Status set to review by the records sync, 25 Oct 2026: merged as app bf4dcdda, verifier PASS in the lead's merge log, 17 Oct.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- `design/CLAUDE.md` and `docs/designer/BRIEF.md` (R-29: where the brief changes a board, build the brief's version); the rulings below outrank both where they differ
- Render each board with `python3 scripts/design/render_design.py <IDs>` and compare picture with picture, light and dark (V5). Board ids come from this file and `design/canvas-inventory.json`, never from a code comment.
- `DECISIONS.md`: R-59, R-68 (ruled; build what they say). Rulings outrank the boards, the brief and any older task text.
- `tasks/DESIGN-V2-CUT.md` (the list this task was cut in)

## Goal

The featured-event card at the top of Explore becomes a slider that alternates an advert with the featured events (X1, X16), shows only adverts when no event is running (X17), and Explore carries the TGIF card.

## Scope

- Edits EXPLORE-01's Explore screen (`src/features/explore/ExploreScreen.tsx`); the boards X1, X16 and X17 describe one slider. Slides from the featured events EXPLORE-01 reads, interleaved with `GET /ads?placement=explore_slider` (ADS-07), advert first (R-59). With no event, adverts only (X17). Dots and swipe; a slide's view and tap counts go through ADS-05.
- The TGIF card on Explore (X1) opens the reader (`/tgif`); its reader count reads "12.4K reading today" from the Hub. No sample advertiser is ever drawn (R-68).
- Adverts drawn here need artwork (ADS-07). Brand copy: "Search Who Made This?" (R-69).

## Capability checks

- [ ] A person swipes the slider and sees an advert first, then an event, then an advert, as the Hub returns them.
- [ ] With no event running only adverts show; with no advert and no event the slider is not drawn.
- [ ] The TGIF card opens today's reader.
- [ ] An advert view and tap are counted once each.
- [ ] Each board above (X16, X17) matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the Hub or the user, never a literal; anything the Hub does not serve yet is in `BACKEND_GAPS.md` and its part of the screen is not drawn (R-47).
- [ ] Loading, empty and error states exist and are entered by their real cause (V6), as are the drawn states of these boards.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/EXPLORE-07.md](history/EXPLORE-07.md).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
