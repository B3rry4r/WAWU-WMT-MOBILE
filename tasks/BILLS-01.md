---
id: BILLS-01
title: Pay a bill: choose biller, meter and amount
owner: DEV2
area: BILLS
order: 67
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: todo
depends_on: [SHELL-02, UI-02, MONEY-06]
decisions: [R-20]
passes: [V1, V4, V5, V6, V9]
artboards: [S2, S3, S4, S10, S13]
---
# BILLS-01 · Pay a bill: choose biller, meter and amount

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV2.md` (what you own)
- The design: `python3 scripts/design/render_design.py S2 S3 S4 S10 S13` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A6.json`
- `docs/fintava/naira-api.md` (what Fintava's API really does; the pages are in `docs/fintava/reference/`)
- `docs/designer/BRIEF.md`: its entries for S2, S3, S13 (the brief is part of the design: build its version, not the canvas's; R-29)

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

Bill payments move to Fintava. The catalogue (categories, billers, bundles, plans) and the meter preview come from Fintava through the backend's Fintava client (MONEY-06), served by the Hub; the app never talks to Fintava. That backend work is in this task. Airtime, Data and Cable TV on S2 are added by BILLS-03, and the Bill reminders banner by BILLS-05 (docs/WORKFLOW.md section 7).

## Artboards

- **S2 · Pay a bill**: Pay a bill home: Bill reminders banner '3 due in October · ₦38,200', categories Airtime / Data / Electricity / Cable TV, Recent (Ikeja Electric meter ₦10,500, MTN airtime ₦2,000, DStv Compact ₦15,700). Reached from S1 (Start-here: Home Pay bills, balance-card Bills, Wallet bills row).
- **S3 · Biller**: Electricity billers: Ikeja Electric, Eko Electricity, Abuja Electric, Ibadan Electric, Port Harcourt Electric with prepaid/postpaid notes.
- **S4 · Meter and amount**: Meter number with validated name AND address ('Chidinma Okoro · 14 Admiralty Way'), amount ₦10,000 with presets ₦2,000/₦5,000/₦10,000/₦20,000.
- **S10 · Meter not found**: 'We couldn't find this meter. Check the number.'
- **S13 · Not live yet**: 'Bill payments aren't switched on yet · You'll be able to pay airtime, data, electricity and cable from your wallet here soon.' Entered only by a real cause: Fintava refuses bills with `403 Merchant is not active`, or every biller in the category is `is_available: "No"`. No feature flag (R-20).

## Fintava facts

From the sandbox (`docs/fintava/sandbox/16-21`); a newer real response overrides it.

- Electricity billers, their prepaid and postpaid codes, and each disco's minimum and maximum come from
  `GET /billing/discos` (`16-bills-discos.md`): postpaid is listed; minimums run from ₦0 to ₦1,000, so never
  assume ₦500; hide any biller with `is_available: "No"`. Ikeja has two prepaid codes; which to use is Fintava's
  question 15 in `docs/fintava/naira-api.md`. The brief's S3 item ("every biller says Prepaid") predates the
  sandbox: S3 shows what the list returns.
- `POST /billing/preview-meter` returns the name on the meter; any 400 means "We couldn't find this meter" (S10,
  `17-bills-preview-meter.md`).
- Data bundles: `GET /billing/data-bundles/{network}`; 9mobile is `ETISALAT`; titles need cleaning; a bundle is
  network plus code (`20-bills-data.md`). Cable: `GOTV` and `DSTV` only (`21-bills-cable.md`).
- Every purchase answers `403 Merchant is not active` until Fintava activates WAWU's sandbox merchant (OPS-02).

## Brief changes (build these, not the canvas)

- **S2**: Data is built on S8's layout with the bundle list in place of the amount presets (BILLS-03). (Why: the tile is drawn; its screen is built in the canvas's own style.)
- **S3**: the billers Fintava lists, with their prepaid and postpaid codes as listed, each with its own minimum and maximum. (This item first said "Prepaid only, never below ₦500"; the sandbox corrected it.) (Why: Fintava fact from the sandbox (`docs/fintava/sandbox/16-bills-discos.md`): postpaid is listed, minimums run from ₦0 to ₦1,000, and some billers are unavailable and are hidden.)
- **S13**: shown only on a real cause: Fintava refuses bills with `403 Merchant is not active`, or every biller in the category is unavailable. No switch. (Why: R-20: no feature flags.)

## Added by later tasks

These entries are drawn on this task's artboards but lead to screens built by later tasks, so this task does
not build them. Each is added, exactly as drawn, by the task that builds where it leads (docs/WORKFLOW.md
section 7, R-27). The verifier reports their checks as belonging to that task.

- S2: Airtime, Data and Cable TV (opens S8): added by BILLS-03
- S2: the Bill reminders banner (opens S27): added by BILLS-05
- S4: Continue (opens S5): added by BILLS-02

## Capability checks

- [ ] **S2**: a user can pick Electricity (S3); repeat a recent bill.
- [ ] **S3**: a user sees the billers Fintava lists, each with its prepaid or postpaid code, and can pick one (S4).
- [ ] **S4**: a user can enter a meter number and see the name on it; pick an amount within that disco's minimum and maximum.
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6), as are the drawn states S10, S13.
- [ ] A user sees S13 only when Fintava refuses bills with `403 Merchant is not active` or every biller in the category is unavailable.

## What the backend serves today (from the analysis)

- **S2**: partial. Missing: Categories and recents served (Flutterwave top-bill-categories). The reminders banner has no source: no reminder model or route (searched backend-models, backend-routes, grep -i 'reminder' finds only verification-reminder.service.ts and NotificationSettings.dmReminders).
- **S3**: served.
- **S4**: partial. Missing: Validation returns name only; the address on the board is not passed through from the provider response.
- **S10**: served.
- **S13**: served.

A missing or partial row is yours to fix in the backend as part of this task (or the backend task listed in depends_on, check its owner in the task file). Never change the screen to fit the API.

## Figures on these artboards are not facts

Do not hard-code any of these. Show what the API returns, or leave the figure out and file it.

- S2: 3 due in October · ₦38,200
- S2: Ikeja Electric ₦10,500
- S2: MTN airtime ₦2,000
- S2: DStv Compact ₦15,700
- S3: Billers: Ikeja Electric, Eko Electricity, Abuja Electric, Ibadan Electric, Port Harcourt Electric
- S4: Amount presets ₦2,000 / ₦5,000 / ₦10,000 / ₦20,000

## Designer notes (⚠, unresolved)

- None.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
