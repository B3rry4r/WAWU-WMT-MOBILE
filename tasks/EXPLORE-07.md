---
id: EXPLORE-07
title: The Explore slider: events and adverts take turns, and TGIF on Explore
owner: YOU
area: EXPLORE
order: 282
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: todo
depends_on: [ADS-07, ADS-01, EXPLORE-01, HOME-16, HOME-09]
decisions: [R-59, R-68]
passes: [V1, V4, V5, V6, V9]
artboards: [X16, X17]
---
# EXPLORE-07 · The Explore slider: events and adverts take turns, and TGIF on Explore

## Current state

As of 16 Oct 2026, cut by DESIGN-V2-CUT from the owner's 16 Oct 2026 designs and answers.
- **Status:** todo. No branch, no code, nothing merged, no findings.
- **Size:** M. **Wave:** 3 (see `tasks/DESIGN-V2-CUT.md`).
- **Next:** a builder starts from the brief below after these are done (or in review): ADS-07, ADS-01, HOME-16.
- **History:** none yet. Reports go to tasks/history/EXPLORE-07.md.

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

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
