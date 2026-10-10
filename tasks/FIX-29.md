---
id: FIX-29
title: Unbuilt screens' entries are not drawn (R-47)
owner: YOU
area: FIX
order: 239
priority: launch
repo: wawu-wmt-mobile
type: component
status: todo
depends_on: [COMPLETE-01]
decisions: [R-47, R-27, R-41]
passes: [V1, V5, V6]
artboards: [X1, W1, Z1]
---
# FIX-29 · Unbuilt screens' entries are not drawn (R-47)

## Read first

- `docs/WORKFLOW.md` ("Links between screens"), `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`
- `DECISIONS.md` R-47 (the owner withdrew R-46 on 9 Oct 2026), R-27, R-41
- `tasks/COMPLETE-02.md`, `tasks/COMPLETE-05.md`, `tasks/BRAND-01.md` (what R-46 added)

## Goal

The owner, 9 Oct 2026: "UI isn't even necessary to be there if the tasks are not complete." R-46 had drawn every entry of an unbuilt screen as an inert button. This task takes them out again, so the app shows only what works.

## Scope

- Remove every `unbuilt('<ID>')` entry in `src/` (list them with `python3 scripts/gates/run.py --gate unbuilt_entries --json`): on Explore (search pill, bell, Featured creators' See all, Find a school, Create) and on the Wallet tab (scan, settings, the Dollar and Crypto tabs and Swap, Send, Add money, the bills tiles, the WAWU card row, See all). A card or row that shows real data but whose detail screen is not built stays drawn and is not pressable (a creator card, a transaction row).
- BRAND-01's Me menu sheet (Z1): only rows whose screen exists are drawn (Settings today); the seven do-nothing rows go. If one row is left, the sheet still opens as drawn with that row.
- Sections whose own task is complete stay drawn, with their designed empty state when the Hub serves nothing (keep COMPLETE-02's failed-read banner and its kept sections). Entries that are already wired (for example PROS-01's Find a professional door, merged by Developer 3) stay exactly as they are.
- Tests that asserted an inert entry is drawn now assert it is not drawn; keep the tests that pin wired entries.
- After this task `unbuilt_entries` lists nothing. The helper and the gate stay (R-47).

## Capability checks

- [ ] A user on Explore, the Wallet tab and the Me menu sees no button that does nothing (`python3 scripts/gates/run.py --gate unbuilt_entries` lists none, and a tap sweep of every pressable element lands somewhere).
- [ ] Every wired entry still lands on its screen (Find a professional, List your services, events, categories, Open your wallet, Settings).
- [ ] Nothing runs off the screen from 320 to 430 px.
- [ ] `npm run check` exit 0.

## Builder report

_Not started._

## Verifier report

_Not started._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
