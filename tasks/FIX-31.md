---
id: FIX-31
title: The app's tests that fail only under load: make them deterministic
owner: YOU
area: FIX
order: 246
priority: launch
repo: wawu-wmt-mobile
type: component
status: todo
depends_on: []
decisions: [R-49]
passes: [V1, V5, V6]
artboards: []
---
# FIX-31 · The app's tests that fail only under load: make them deterministic

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`
- `docs/LOG.md` lines of 10 Oct 2026 that name a flake, and the verifier reports that list them

## Goal

Every full `npm run check` on 10 Oct needed two to five runs, because a test from another task failed under load
and passed alone. That costs every merge and hides real failures. Each such test gets its real cause fixed so the
full check passes first time on a loaded machine.

## Scope

- The tests named on 10 Oct as failing only under load: eventsScreens (D8 "a tier ended": `getByText` while the
  tickets still load), eventsFocus, OpenWalletScreen (A26), settingsScreens, hostScreens, professionals screens (P1
  paging), proListing (P6), auth-signup (F12), HomeScreen, MeScreen, schoolsScreen, Explore screens, TgifReader.
- For each: find the real cause (a query before the data lands, a fake timer not advanced, a real timer, a shared
  module state, a missing await) and fix the TEST so it waits for what it asserts. A product bug found this way is
  reported, not hidden.
- Never raise a timeout, skip, retry or quarantine a test to make it pass.

## Capability checks

- [ ] The full check passes three runs in a row with two jest workers while the machine's load average is 15 or more.
- [ ] Each named test passes 20 runs alone and 3 full runs, with the cause named in the builder report.
- [ ] No assertion was weakened (the verifier reads each diff).

## Owner sign-off
