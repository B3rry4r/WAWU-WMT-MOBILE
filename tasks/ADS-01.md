---
id: ADS-01
title: TGIF sponsored card
owner: YOU
area: ADS
order: 178
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: done
depends_on: [HOME-09, HOME-01, ADS-04, ADS-05, EVENTS-01]
decisions: [R-15, R-37]
passes: [V1, V4, V5, V6, V9]
artboards: [H33]
---
# ADS-01 · TGIF sponsored card

## Current state

As of 16 Oct 2026.
- **Status:** done (live on main; records pass OPS-R0, 17 Oct 2026). Checked once by an independent verifier (report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/ADS-01.md`): verdict merge, nothing medium or worse. Batch 4: stacked on `wmt/FIX-14` (this branch contains it); API types regenerated from backend `wmt/ADS-01` (b9cda2a).
- **What is built:** `src/features/ads/` (`api.ts`, `useAd.ts`, `SponsoredStep.tsx`, `SponsoredSlot.tsx`, `look.ts`, 4 test files).
  - H33: the TGIF reader asks `GET /ads?placement=tgif_card` and, when a card comes, shows it as a sixth step before the takeaway (`readerSteps(true)`). Words, picture and button word are the Hub's. Get tickets opens the event (`/events/[id]`, E2) and stays on the card for the way back. Skip goes on to the takeaway.
  - H36: with TGIF off, Today asks `GET /ads?placement=today_slot` and draws `SponsoredSlot` in TGIF's place; the whole card opens the event.
  - Counting: one view when the card is on screen (Today: only while that tab is in front), one tap, one skip, each sent once per screen; the Hub keeps one of each per person per day. A report that fails is dropped without a word.
  - No campaign, loading, error, a destination this build cannot open: nothing is drawn, no frame, no message (V6: the real cause enters each, tested).
- **Left out on purpose (R-47, task file's "figures are not facts"):** "Ads keep TGIF free" (G-760). The reader offers no card unless the route gives it `onOpenEvent`, so there is never a button that does nothing.
- **Not backend work:** the contract copy was refreshed from backend main 3797fb2 (SHARED-CHANGES ADS-01 #1); the two calls live in `src/features/ads/api.ts`, not in fenced `src/api/`.
- **Checks:** full local check EXIT 0 (159 suites, 2878 tests; gates 0 fail, 5 warn, 0 accepted, the same 5 warns as main). GitHub cannot run mobile CI now.
- **Evidence (builder's, for the verifier to repeat):** `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/ads-01-b/shots/` (H33 and H36, dark and light, each beside its artboard as `*-compare.png`; E2 reached from the card).
- **Open for the owner (in BACKEND_GAPS.md):** G-760 (the "Ads keep TGIF free" line), G-761 (a campaign with no artwork).
- **Open findings:** blocker 0, high 0, medium 0. Lows: 5 (skip sits under Next and Done, the SPONSORED label breaks at 320 px, the Today slot cuts the longest allowed words, advertiser is read by no screen, an artwork link that will not load). They are in tasks/SWEEP-APP.md with the report path.
- **Next:** the lead opens one pull request per repo from the last batch 4 head, for the owner to merge after batch 3 (PR #138); then mobile sign-off.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV2.md` (what you own)
- `DECISIONS.md`: R-15 (ruled; build what it says)
- The design: `python3 scripts/design/render_design.py H33` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A4.json`
- `docs/designer/BRIEF.md` (the brief is part of the design, R-29; it has no entry for H33, so those artboards stand, under its rules 3 to 8 on fees, refunds, licence lines and em-dashes)

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

This task adds the sponsored card to both placements: in the TGIF reader (H33) and in TGIF's place on Today when TGIF is off (H36, built by HOME-01). Each view, tap and skip is sent to ADS-05.

## Artboards

- **H33 · Sponsored**: Skippable sponsored card before the takeaway: 'SPONSORED · Gospel Night Live · Abuja · Sat 18 October · from ₦5,000 · Get tickets · Ads keep TGIF free · Skip ›'. Note: 'Ads are sold from the WAWU dashboard.'

## Capability checks

- [ ] **H33**: a user can Get tickets (event detail, Events flow); Skip.
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6).
- [ ] With a live campaign and TGIF off, a user sees the sponsored card on Today (H36, this task adds it, as drawn) and can open the event (E2).
- [ ] Each view, tap and skip is counted once (ADS-05).

## What the backend serves today (from the analysis)

- **H33**: missing. Missing: Entire ad product missing: ad model, placement, scheduling, serving endpoint, impression/click/skip tracking, admin dashboard to sell/manage, advertiser billing.

A missing or partial row is yours to fix in the backend as part of this task (or the backend task listed in depends_on, check its owner in the task file). Never change the screen to fit the API.

## Figures on these artboards are not facts

Do not hard-code any of these. Show what the API returns, or leave the figure out and file it.

- H33: 'from ₦5,000' ticket price
- H33: 'Ads keep TGIF free'
- H33: 'Ads are sold from the WAWU dashboard'
- H33: event Gospel Night Live, Abuja, Sat 18 October

## Designer notes (⚠, unresolved)

- None.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/ADS-01.md](history/ADS-01.md).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
