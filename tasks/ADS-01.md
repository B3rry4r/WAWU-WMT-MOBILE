---
id: ADS-01
title: TGIF sponsored card
owner: YOU
area: ADS
order: 178
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: todo
depends_on: [HOME-09, HOME-01, ADS-04, ADS-05, EVENTS-01]
decisions: [R-15, R-37]
passes: [V1, V4, V5, V6, V9]
artboards: [H33]
---
# ADS-01 · TGIF sponsored card

Taken over by the lead's agents on 10 Oct 2026 (owner: the developers' subscriptions have ended; was DEV2).

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

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
