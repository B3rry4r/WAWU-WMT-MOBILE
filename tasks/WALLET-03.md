---
id: WALLET-03
title: Send to a bank, not enough money, failed send
owner: YOU
area: WALLET
order: 137
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: todo
depends_on: [WALLET-02, WALLET-09]
decisions: [R-10]
passes: [V1, V4, V5, V6, V7, V8, V9]
artboards: [W8, W13, W14]
---
# WALLET-03 · Send to a bank, not enough money, failed send

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- `DECISIONS.md`: R-10 (ruled; build what it says)
- The design: `python3 scripts/design/render_design.py W8 W13 W14` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A1.json`
- `docs/fintava/naira-api.md` (what Fintava's API really does; the pages are in `docs/fintava/reference/`)

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

## Artboards

- **W8 · Send · to a bank account**: Bank + account number entry; account name resolves from the bank before Continue unlocks; saved beneficiaries incl. 'My payout account' (withdraw).
- **W13 · Send · insufficient balance**: Amount over balance: inline error, Continue disabled, Add money one tap away.
- **W14 · Send · failed**: Transfer the receiving bank did not confirm in time; shows automatic reversal to wallet, amount incl. fee, reference, Done / Try again.

## Fintava facts

From `docs/fintava/naira-api.md`; a real sandbox response overrides it.

`POST /bank/credit` (sourceId is the customerId) after `GET /name/enquiry`; bank codes from `GET /banks`. The user pays Fintava's bank-send fee plus WAWU's ₦25 (R-10); WALLET-15 gives the total.

## Capability checks

- [ ] **W8**: a user can pick bank; type 10-digit account; Continue after name resolves; pick saved beneficiary; pick My payout account (W17).
- [ ] **W13**: a user can Add money.
- [ ] **W14**: a user can Done; Try again.
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6), as are the drawn states W13, W14.

## What the backend serves today (from the analysis)

- **W8**: partial. Missing: Bank list and name enquiry exist on Flutterwave. Missing: beneficiaries store, and KYC stores payoutBankName as free text, not a bank code, so 'My payout account' cannot be sent to without mapping.
- **W13**: partial. Missing: Server-side check exists for withdraw only.
- **W14**: partial. Missing: Failure settlement exists for withdrawals, but nothing records a reversal credit or fee refund, and no per-transaction read endpoint exists for the client to poll.

A missing or partial row is yours to fix in the backend as part of this task (or the backend task listed in depends_on, check its owner in the task file). Never change the screen to fit the API.

## Figures on these artboards are not facts

Do not hard-code any of these. Show what the API returns, or leave the figure out and file it.

- W8: Guaranty Trust Bank 0123456789 -> Chidinma Adaeze Okoro (sample)
- W8: Kuda MFB · 2011458890 (sample)
- W14: 'the money is reversed automatically' (provider behaviour claim)
- W14: Amount ₦25,010.00
- W14: Reference WAW-8F2K-91QX

## Designer notes (⚠, unresolved)

- None.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
