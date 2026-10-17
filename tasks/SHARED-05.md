---
id: SHARED-05
title: The route graph: signed-in screens sit under the guard, and the chosen theme applies at launch
owner: YOU
area: SHARED
order: 228
priority: launch
repo: wawu-wmt-mobile
type: component
status: done
depends_on: []
decisions: []
passes: [V1, V2, V4, V5, V6, V10]
artboards: []
---
# SHARED-05 · The route graph: signed-in screens sit under the guard, and the chosen theme applies at launch

## Current state

As of 16 Oct 2026, built (Sonnet builder), waiting for a verifier.
- **Status:** done (live on main; records pass OPS-R0, 17 Oct 2026). Checked once by an independent verifier (report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/SHARED-05.md`): verdict merge, nothing medium or worse. Batch 4: stacked on `wmt/WALLET-35` (this branch contains it); API types regenerated from backend `wmt/SHARED-05` (b9cda2a).
- **Branch:** mobile `wmt/SHARED-05` from main `3117807`. No pull request (the lead merges).
- **Built:** `src/app/_layout.tsx` lists `payout-account`, `edit-profile`, `social-links`, `open-wallet`, `open-wallet-details`, `open-wallet-selfie`, `open-wallet-account`, `open-wallet-pin` and the five `settings/*` screens in the signed-in group beside `(tabs)`; and lists `about`, `terms` and `privacy-policy` outside every guard, after the signed-out set.
- **Own checks removed** from the eight route files that carried one (the `restoring` null and the `/welcome` redirect). `social-links` keeps its redirect to `/edit-profile` when no form is open.
- **Theme:** the root layout runs `applyStoredTheme()` once and draws nothing, with the splash screen still up, until it finishes. A phone store that cannot be read counts as nothing saved.
- **Rows marked applied** in SHARED-CHANGES.md: WALLET-11 #2, ME-06 #3, KYC-05 R1, KYC-03 R1, KYC-04 R1, SETTINGS-02 R1, SETTINGS-01 #3.
- **Tests:** `src/__tests__/route-graph.test.tsx` (39 cases, 18 of them fail on main's layout). One existing test edited: `payoutAccountRoute.test.tsx` lost its signed-out case, because the route no longer carries that check (the route graph test covers it).
- **Records:** tasks/history/SHARED-05.md (the builder report).
- **Open findings:** blocker 0, high 0, medium 0. Lows: 5 (the theme read has no time bound, an unasserted scheme in a test, a wording cell, 31 unlisted route files and a fixed native splash colour, both pre-existing). They are in tasks/SWEEP-APP.md with the report path.
- **Next:** the lead opens one pull request per repo from the last batch 4 head, for the owner to merge after batch 3 (PR #138); then mobile sign-off.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows; section 4, fenced files: this task IS the lead's shared-change pass, so it may edit the fenced files its rows name, and nothing else that is fenced)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `SHARED-CHANGES.md` rows: WALLET-11 #2, ME-06 #3, KYC-05 R1, KYC-03 R1, KYC-04 R1, SETTINGS-02 R1, SETTINGS-01 #3 (each row says what to change and why; the status cells were audited on 8 Oct 2026, mobile `fb01391`)
- `src/app/_layout.tsx` and every route file the rows name

## Goal

Seven rows ask for routes to be listed in `src/app/_layout.tsx`, and none were. Each screen redirects a signed-out visitor to `/welcome` itself, so nobody is stranded, but the guard is in many places instead of one. And SETTINGS-01 #3 (a): the Theme a person picks in Settings (System, Light or Dark) only applies after Settings is opened, not from the start of the next launch.

## Scope

- List every route the rows name under the right `Stack.Protected` guard, then remove each screen's own signed-out check that the guard now covers (the rows say which).
- Call `applyStoredTheme()` once before the first screen is drawn (SETTINGS-01 #3 (a)).
- Mark each row applied.

## Capability checks

- [ ] A signed-out visit to each listed route lands on `/welcome` through the guard (a test per route), and a signed-in one opens the screen.
- [ ] A person who picked Dark sees Dark on the first screen of the next launch, with no flash of the other theme.
- [ ] `npm run check` exit 0.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/SHARED-05.md](history/SHARED-05.md).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
