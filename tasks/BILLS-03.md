---
id: BILLS-03
title: Airtime and cable TV
owner: DEV2
area: BILLS
order: 147
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: todo
depends_on: [BILLS-04]
decisions: []
passes: [V1, V4, V5, V6, V7, V8, V9]
artboards: [S8, S9]
---
# BILLS-03 · Airtime and cable TV

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV2.md` (what you own)
- The design: `python3 scripts/design/render_design.py S8 S9` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A6.json`
- `docs/fintava/naira-api.md` (what Fintava's API really does; the pages are in `docs/fintava/reference/`)

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

## Artboards

- **S8 · Airtime**: Airtime: network MTN/Airtel/Glo/9mobile, phone number with 'Mine', amount presets ₦500/₦1,000/₦2,000/₦5,000, Buy ₦2,000 airtime; then PIN and receipt like S7.
- **S9 · Cable package**: DStv packages with monthly prices; then smartcard, review, PIN, receipt.

## Fintava facts

From `docs/fintava/naira-api.md`; a real sandbox response overrides it.

Airtime `POST /billing/airtime` (GLO, MTN, AIRTEL, 9MOBILE), data `GET /billing/data-bundles/{network}` then `POST /billing/data-bundle`, cable `GET /cable-service-name/{network}` then `POST /billing/cable-subscription`. Same two-step debit as BILLS-02.

## Capability checks

- [ ] **S8**: a user can pick network; enter/choose number; pick amount; Buy.
- [ ] **S9**: a user can pick package; Continue.
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6).

## What the backend serves today (from the analysis)

- **S8**: partial. Missing: Catalogue served; payment is Flutterwave checkout, not wallet (see S5).
- **S9**: served.

A missing or partial row is yours to fix in the backend as part of this task (or the backend task listed in depends_on, check its owner in the task file). Never change the screen to fit the API.

## Figures on these artboards are not facts

Do not hard-code any of these. Show what the API returns, or leave the figure out and file it.

- S8: Airtime presets ₦500 / ₦1,000 / ₦2,000 / ₦5,000
- S8: Networks MTN, Airtel, Glo, 9mobile
- S9: DStv Padi ₦4,400/month
- S9: DStv Yanga ₦6,000/month
- S9: DStv Confam ₦11,000/month
- S9: DStv Compact ₦15,700/month
- S9: DStv Compact Plus ₦25,000/month

## Designer notes (⚠, unresolved)

- None.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
