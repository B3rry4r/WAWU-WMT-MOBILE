---
id: FIX-14
title: Shared UI follow-ups: chip outline, hidden decorations, the consent box, a hanging test, the fork gate
owner: YOU
area: FIX
order: 195
priority: launch
repo: wawu-wmt-mobile
type: component
status: todo
depends_on: [SHARED-03]
decisions: []
passes: [V1, V5, V6]
artboards: []
---
# FIX-14 · Shared UI follow-ups: chip outline, hidden decorations, the consent box, a hanging test, the fork gate

## Read first

- `docs/WORKFLOW.md` (the rules every task follows; section 4, fenced files)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `tasks/SHARED-03.md` (verifier report: R1, N1, the settings test hang)
- `tasks/KYC-03.md` (R3-1: A5's consent box)
- `scripts/gates/checks/forks.py`

## Goal

Small shared items the checks found, none blocking alone: row chips are 2 px wider than the canvas on every row (R1); decorative avatars are read aloud on the web (N1); A5's consent box has no checked state for screen readers on the web (KYC-03 R3-1); `settingsScreens.test.tsx` hangs about 5 minutes after passing; and the fork gate misses function components.

## Scope

R1: draw the row chip's outline as the canvas does (it takes no room), and fix `chipIconMetrics`'s comment; prove every chip on every screen with pictures. N1: decorative `Avatar` and the placeholder pass `aria-hidden` on web. A5: `aria-checked` on web, as the design-system showcase does. The hanging test: find what stays open and close it. `scripts/gates/checks/forks.py`: catch a local function component that copies a shared one (with a test).

## Capability checks

- [ ] Row chips match X2 and X3 to the pixel; Inbox and M34 chips match their artboards.
- [ ] Screen readers on web skip decorative avatars and read the consent box's state.
- [ ] The settings test file exits on its own.
- [ ] The fork gate fails on a planted function-component copy.

## Builder report

_Not started._

## Verifier report

_Not started._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
