---
id: FIX-14
title: Shared UI follow-ups: chip outline, hidden decorations, the consent box, a hanging test, the fork gate
owner: YOU
area: FIX
order: 195
priority: launch
repo: wawu-wmt-mobile
type: component
status: done
depends_on: [SHARED-03]
decisions: []
passes: [V1, V5, V6]
artboards: []
---
# FIX-14 · Shared UI follow-ups: chip outline, hidden decorations, the consent box, a hanging test, the fork gate

## Current state

As of 16 Oct 2026.
- **Status:** done (live on main; records pass OPS-R0, 17 Oct 2026). Checked once by an independent verifier (report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/FIX-14.md`): verdict merge, nothing medium or worse. Batch 4: stacked on `wmt/SHARED-05` (this branch contains it); API types regenerated from backend `wmt/FIX-14` (b9cda2a).
- **Branches:** mobile `wmt/FIX-14` (code `208d87c` and `5238c29`, from main `3117807`, nothing newer to merge). Backend: none changed. wawu-id: none. Migration: none. Contract: unchanged.
- **Built:** R1 row chips draw their outline inside the padding (15, or 11 and 14 in an icon row, less the border), so a chip is exactly the canvas's width; N1 decorative `Avatar` and the `MediaCard` placeholder pass `aria-hidden`; A5's consent box passes `aria-checked`; `settingsScreens.test.tsx` exits on its own (a mutation's 5 minute `gcTime` timer, now `Infinity` in that test's client); the fork gate reads function components (a copy of a component exported from `src/components/` fails).
- **Checks:** typecheck, lint, jest (157 suites, 2,841 tests) and gates pass in one local run; tasks passes after `PROGRESS.md` is regenerated. No CI for mobile (billing).
- **Edited tests that were not mine (4 assertions, for the new padding):** `src/__tests__/hubSharedProps.test.tsx` (3) and `src/__tests__/lists.test.tsx` (1) asserted the row chip's padding without its border (15, 11, 14). They now assert padding plus border equals those numbers, the same sum `chips.test.tsx` already asserts for option chips. `settingsScreens.test.tsx` also changed, one config line (the `gcTime: Infinity` above, named here by SWEEP-APP-1). Nothing else in any test, gate or baseline was changed.
- **Not run:** a phone; the live web DOM for the decorative avatar and the consent box (jest checks the props the components set); Apply's and the host day picker's chips on screen (same component, not reachable without data).
- **Open findings:** blocker 0, high 0, medium 0. Lows: 5 (a gate misses three component spellings, other decorative components lack aria-hidden, the gate test runs by hand only, a changed test missing from the Current state list, 14 other QueryClient files). They are in tasks/SWEEP-APP.md with the report path.
- **Next:** the lead opens one pull request per repo from the last batch 4 head, for the owner to merge after batch 3 (PR #138); then mobile sign-off.

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

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/FIX-14.md](history/FIX-14.md).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
