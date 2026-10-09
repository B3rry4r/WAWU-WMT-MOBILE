---
id: COMPLETE-03
title: Home shows its whole design
owner: YOU
area: HOME
order: 239
priority: launch
repo: wawu-wmt-mobile
type: component
status: todo
depends_on: [COMPLETE-01]
decisions: [R-46, R-27, R-29]
passes: [V1, V5, V6, V9]
artboards: [H1, H36]
---
# COMPLETE-03 · Home shows its whole design

## Read first

- `docs/WORKFLOW.md` ("Links between screens"), `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`
- `DECISIONS.md` R-46 (the UI is always complete), R-27, R-29, R-41
- `docs/designer/BRIEF.md` for each artboard below (the brief's version wins, R-29)
- `src/features/home/TodayScreen.tsx`, `MoneyCard.tsx`, `CreatorRail.tsx`, `TgifCard.tsx` and their comments listing what they leave out

## Goal

Today (H1) leaves out search, the bell, the money actions, the services row entries, See all and Create until their tasks are built. H1 and H36 are drawn in full now.

## Scope

- The bar: search (EXPLORE-02), the bell (ME-14), and anything else H1 draws.
- The money card: Send (WALLET-02), Add (WALLET-05), Bills (BILLS-01), Scan (WALLET-20, after launch) and the currency chip as drawn.
- The services row: Legal (LEGAL-02), Schools (SCHOOLS-03), Pay bills (BILLS-01), Events (EVENTS-01, wired) and the rest H1 draws.
- Creators to discover: See all (EXPLORE-02) and a card opening the profile (ME-02); the section and its empty state always drawn.
- H36 (TGIF off): the sponsored card (ADS-01) drawn with a neutral placeholder and no advertiser name when no campaign is served.
- Create (ME-04) and every other element H1 draws.
- Files: `src/features/home/*` except the feed (`src/features/feed/*` is COMPLETE-06's).
- Every entry whose task is built (`review` or `done`) is wired for real, not made inert. Check each named task's status on main before choosing.
- A section with nothing to show draws its designed empty state; where the canvas has none, its heading and frame with a neutral placeholder picture. Never an invented name, figure or price.
- Tests that asserted an entry is absent now assert it is drawn, and that tapping an inert one opens nothing.
- Pictures (V5): the built screen beside `python3 scripts/design/render_design.py <ID>` for each artboard, 390 px, light and dark, with an empty Hub and with data.

## Capability checks

- [ ] A user on Today sees every element H1 draws (and H36 with TGIF off), with an empty Hub and with data.
- [ ] A user can tap each money action and service tile; built ones open their screen, the rest do nothing.
- [ ] Every element on each artboard is on the built screen (a table in the report: element, built, wired or `unbuilt('<task>')`).
- [ ] `npm run check` exit 0.

## Builder report

_Not started._

## Verifier report

_Not started._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
