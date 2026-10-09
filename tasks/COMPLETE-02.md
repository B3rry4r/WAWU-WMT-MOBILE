---
id: COMPLETE-02
title: Explore shows its whole design
owner: YOU
area: EXPLORE
order: 238
priority: launch
repo: wawu-wmt-mobile
type: component
status: todo
depends_on: [COMPLETE-01]
decisions: [R-46, R-27, R-29]
passes: [V1, V5, V6, V9]
artboards: [X1, X14]
---
# COMPLETE-02 · Explore shows its whole design

## Read first

- `docs/WORKFLOW.md` ("Links between screens"), `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`
- `DECISIONS.md` R-46 (the UI is always complete), R-27, R-29, R-41
- `docs/designer/BRIEF.md` for each artboard below (the brief's version wins, R-29)
- `src/features/explore/ExploreScreen.tsx` and its comment listing what it leaves out

## Goal

The owner opened Explore and saw only the category pills: everything else is left out until its task is built, or drawn only when the Hub serves data. X1 is drawn in full now.

## Scope

- The bar as drawn: search pill (EXPLORE-02) and bell (ME-14), plus anything else X1 draws in it.
- Featured event hero and Upcoming events with See all (EVENTS-01): always drawn; the empty state when the Hub serves none.
- Featured creators with See all (EXPLORE-02) and a card opening the profile (ME-02): always drawn; the empty state when there are none.
- Every door on the doors card as drawn: List your services (PROS-03, wired), Find a professional (PROS-01), Schools (SCHOOLS-03), and the rest X1 draws.
- Create (ME-04) if X1 draws it, and every other element X1 draws.
- Files: `src/features/explore/*`, `src/app/(tabs)/explore.tsx`. Developer 3 works on events and professionals: merge main before pushing.
- Every entry whose task is built (`review` or `done`) is wired for real, not made inert. Check each named task's status on main before choosing.
- A section with nothing to show draws its designed empty state; where the canvas has none, its heading and frame with a neutral placeholder picture. Never an invented name, figure or price.
- Tests that asserted an entry is absent now assert it is drawn, and that tapping an inert one opens nothing.
- Pictures (V5): the built screen beside `python3 scripts/design/render_design.py <ID>` for each artboard, 390 px, light and dark, with an empty Hub and with data.

## Capability checks

- [ ] A user opening Explore with an empty Hub sees every section X1 draws, each with its empty state.
- [ ] A user can tap search, the bell, See all and each door; built ones open their screen, the rest do nothing.
- [ ] Every element on each artboard is on the built screen (a table in the report: element, built, wired or `unbuilt('<task>')`).
- [ ] `npm run check` exit 0.

## Builder report

_Not started._

## Verifier report

_Not started._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
