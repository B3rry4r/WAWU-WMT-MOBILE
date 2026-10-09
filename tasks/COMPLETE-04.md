---
id: COMPLETE-04
title: Me shows its whole design
owner: YOU
area: ME
order: 240
priority: launch
repo: wawu-wmt-mobile
type: component
status: todo
depends_on: [COMPLETE-01, BRAND-01]
decisions: [R-46, R-27, R-29]
passes: [V1, V5, V6, V9]
artboards: [M1, M2, M4]
---
# COMPLETE-04 · Me shows its whole design

## Read first

- `docs/WORKFLOW.md` ("Links between screens"), `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`
- `DECISIONS.md` R-46 (the UI is always complete), R-27, R-29, R-41
- `docs/designer/BRIEF.md` for each artboard below (the brief's version wins, R-29)
- `src/features/me/MeScreen.tsx`, `AboutTab.tsx` and their comments listing what they leave out
- BRAND-01's Settings entry (keep it as it lands)

## Goal

Me (M1) leaves out QR, Menu, the tick and its prompt, Create and the paid message settings entry. M1, M2 and M4 are drawn in full now.

## Scope

- The header: QR (WALLET-20, after launch), Menu (ME-03; BRAND-01 may already open Settings from here: keep its wiring), and everything else M1 draws.
- The tick and "Get your professional tick" prompt (ME-12), as drawn for a person without one.
- Create (ME-04), the paid message settings entry on Services (INBOX-12), and every card on About (M4) with its empty state.
- Files: `src/features/me/*`, `src/app/(tabs)/me.tsx`. Starts after BRAND-01 merges.
- Every entry whose task is built (`review` or `done`) is wired for real, not made inert. Check each named task's status on main before choosing.
- A section with nothing to show draws its designed empty state; where the canvas has none, its heading and frame with a neutral placeholder picture. Never an invented name, figure or price.
- Tests that asserted an entry is absent now assert it is drawn, and that tapping an inert one opens nothing.
- Pictures (V5): the built screen beside `python3 scripts/design/render_design.py <ID>` for each artboard, 390 px, light and dark, with an empty Hub and with data.

## Capability checks

- [ ] A user on Me sees every element M1, M2 and M4 draw, for a new account and a full one.
- [ ] A user can tap QR, Menu, the tick prompt and Create; built ones open their screen, the rest do nothing.
- [ ] Every element on each artboard is on the built screen (a table in the report: element, built, wired or `unbuilt('<task>')`).
- [ ] `npm run check` exit 0.

## Builder report

_Not started._

## Verifier report

_Not started._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
