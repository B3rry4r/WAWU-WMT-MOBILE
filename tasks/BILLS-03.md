---
id: BILLS-03
title: Airtime, data and cable TV
owner: DEV2
area: BILLS
order: 122
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: todo
depends_on: [MONEY-02, MONEY-03, MONEY-13, MONEY-19, WALLET-15, BILLS-01, BILLS-02, BILLS-04, UI-02]
decisions: [R-10, R-6]
passes: [V1, V4, V5, V6, V7, V8, V9]
artboards: [S8, S9]
---
# BILLS-03 · Airtime, data and cable TV

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV2.md` (what you own)
- The design: `python3 scripts/design/render_design.py S8 S9` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A6.json`
- `docs/fintava/naira-api.md` (what Fintava's API really does; the pages are in `docs/fintava/reference/`)
- `docs/designer/BRIEF.md`: its entries for S8, S9 (the brief is part of the design: build its version, not the canvas's; R-29)
- `docs/fintava/fees.md` (what each payment costs; the dashboard rates, final)

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

The PIN step, the receipt and the failure states reuse BILLS-02's screens; never a fork.

Payouts out of Fintava don't work in the sandbox yet: bank sends and the airtime, data and electricity purchases answer `400 "Unable to find customers"`, and cable answers "service not currently available", with nothing debited (`docs/fintava/sandbox/README.md`, "The blocker"). Unblocked when a ₦100 `POST /bank/credit/merchant` to the sandbox stub `0123456789`/`000013` stops answering "Unable to find customers" (question 17 in `docs/fintava/naira-api.md`). Build and unit-test meanwhile; report the bank-send and bill checks NOT RUN with that reason until then.

## Artboards

- **S8 · Airtime**: Airtime: network MTN/Airtel/Glo/9mobile, phone number with 'Mine', amount presets ₦500/₦1,000/₦2,000/₦5,000, a fee line before the PIN (₦0 + ₦0 today, BRIEF S8), Buy with the total; then PIN and the receipt like S7.
- **S9 · Cable package**: DStv packages with monthly prices; then smartcard (S4's layout), review with the breakdown (S5's layout: Compact ₦15,700 + ₦100 + ₦0, BRIEF S9), PIN, receipt like S7.
- **Data** (not drawn; S2 draws its tile): built on S8's layout with the bundle list from `GET /billing/data-bundles/{network}` in place of the amount presets.

## Fintava facts

From `docs/fintava/naira-api.md`; a real sandbox response overrides it.

Airtime `POST /billing/airtime` (GLO, MTN, AIRTEL; 9mobile is untested for airtime), data `GET /billing/data-bundles/{network}` (9mobile is `ETISALAT`, `docs/fintava/sandbox/20-bills-data.md`) then `POST /billing/data-bundle`, cable `GET /cable-service-name` (`GOTV`, `DSTV`) and `GET /cable-service-name/{name}` (case-sensitive) then `POST /billing/cable-subscription`, which takes the plan code and no amount (`21-bills-cable.md`). Same two-step debit as BILLS-02.

## Brief changes (build these, not the canvas)

- **S8**: show the fee before the PIN, either a review step like S5 or a fee line above the button: ₦0 + ₦0 = ₦0, Total ₦2,000. It reads ₦0 today, but WAWU may set a bill fee, so the line must exist. (Why: R-10: the fee is always shown before paying.)
- **S9**: no change to S9 itself; the cable review it leads to must carry the breakdown. If you draw that review, sample: Compact ₦15,700 + (₦100 + ₦0) = Total ₦15,800. (Why: R-10, Fintava's price list.)

## Capability checks

- [ ] **S8**: a user can pick a network; enter or choose a number; pick an amount; see the fee line and the total before the PIN; Buy.
- [ ] **S9**: a user can pick a package; enter a smartcard; see the review with ₦100 + ₦0 and the total; Pay.
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6).
- [ ] A user can pay for airtime, a data bundle and a DStv plan from the wallet with their PIN and see the receipt.
- [ ] From S2 (BILLS-01), a user can tap Airtime, Data and Cable TV and reach S8, the data step and S9 (this task adds them, as drawn).

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
