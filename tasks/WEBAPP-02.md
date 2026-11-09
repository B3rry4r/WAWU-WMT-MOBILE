---
id: WEBAPP-02
title: On a laptop the app shows at phone width, centred
owner: YOU
area: WEB
order: 362
priority: after-launch
repo: wawu-wmt-mobile
type: component
status: verifying
depends_on: []
decisions: [R-127]
passes: [V1, V5, V6]
artboards: []
tier: T1
---
# WEBAPP-02 · On a laptop the app shows at phone width, centred

## Current state

As of 9 Nov 2026.
- **Status:** verifying. Built on branch `wmt/WEBAPP-02` (bundle WEBAPP-02, 03, 04), mobile and Hub worktrees.
- **Branches:** mobile `wmt/WEBAPP-02`; Hub `wmt/WEBAPP-02` (aae111a, CORS only; no merge, a Hub merge deploys).
- Frame: `src/lib/WebFrame.tsx` (root layout wraps the Stack; SHARED-CHANGES row WEBAPP-02 #1 applied, edit is the wrapper and its import), `FrameModal.tsx` (7 Modals), `useFrameWidth.ts` (hook used by 10 files that read window width; height-only readers need no change).
- Column is 390 and only on web wider than 600; phone browsers and phones draw no wrapper.
- **Open findings:** none known. NOT RUN and PHONE CHECK items are in the report in `tasks/history/WEBAPP-02.md`.
- **Next:** the bundle's lean verifier.

## Read first

- `docs/WORKFLOW.md`
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md`
- `DECISIONS.md` R-127 (the web app) and R-128 (wallet purchases on the web), R-44, R-47, R-86, R-101
- `docs/analysis/WEB-APP-READINESS.md` (the readiness check: every finding with its file and line)

## Goal

On a screen wider than a phone, the whole app (tabs, sheets, modals, toasts) sits in a phone-width column in the middle of the page, on the app's own background, so nothing stretches. On a phone it is unchanged.

## Scope

- `src/app/_layout.tsx` (fenced: SHARED-CHANGES row `WEBAPP-02 #1`, approved by the lead) or a new `src/app/+html.tsx`: the web frame, set in one place.
- A shared width hook (for example `src/lib/useFrameWidth.ts`) used by the files that read the window size (readiness section 5 lists 18), so they size to the frame, not the window.
- Web only (`Platform.OS === 'web'` or `*.web.tsx`); no change on phones.

## Capability checks

- [ ] A user on a 1440 px laptop sees every tab, sheet and modal inside a centred column the width of a phone (390 to 430 px), with no stretched rows (pictures at 1440 and 390 for Home, Explore, Inbox, Wallet, Me, a sheet and a modal, light and dark).
- [ ] A user on a phone browser sees exactly what they saw before (390 pictures equal before and after).
- [ ] A user who resizes the window sees the column follow without a reload.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/WEBAPP-02.md](history/WEBAPP-02.md).

## Owner sign-off
