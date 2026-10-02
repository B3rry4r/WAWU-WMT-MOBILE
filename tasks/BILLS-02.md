---
id: BILLS-02
title: Pay a bill: review, PIN, token, failures
owner: DEV2
area: BILLS
order: 146
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: todo
depends_on: [MONEY-02, BILLS-01, BILLS-04]
decisions: []
passes: [V1, V4, V5, V6, V7, V8, V9]
artboards: [S5, S6, S7, S11, S12]
---
# BILLS-02 · Pay a bill: review, PIN, token, failures

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV2.md` (what you own)
- The design: `python3 scripts/design/render_design.py S5 S6 S7 S11 S12` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A6.json`
- `docs/fintava/naira-api.md` (what Fintava's API really does; the pages are in `docs/fintava/reference/`)

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

## Artboards

- **S5 · Review**: Review: Ikeja Electric · Prepaid ₦10,000.00, meter, name, Fee 'No fee', Total, 'Pay from wallet · Naira wallet · ₦485,250.75 available', Pay ₦10,000.
- **S6 · PIN**: PIN keypad over S5: 'Approve ₦10,000 to Ikeja Electric', then 'PIN accepted'. (Not in MANIFEST; present in services.txt between S5 and S7.)
- **S7 · Token**: Receipt: ₦10,000 paid, prepaid token '4821 0937 5510 2286 7734' with Copy, 45.2 kWh, meter, reference WAW-BIL-8Q2M, date, Share receipt, Done.
- **S11 · Not enough in wallet**: 'Not enough in your Naira wallet · You have ₦6,200.00. Add ₦3,800 to pay this.' Add ₦3,800.
- **S12 · Failed**: 'Payment didn't go through · Ikeja Electric didn't confirm it · Reversed to your wallet', amount, reference, Done / Try again.

## Fintava facts

From `docs/fintava/naira-api.md`; a real sandbox response overrides it.

Bill calls debit WAWU's merchant wallet, not the user's. A user's bill is two steps: wallet to WAWU's wallet (`/transaction/wallet-to-wallet`), then pay the biller. If the biller fails, move it back; that is S12's reversal. Whether the electricity response includes the token and units (S7) is not documented: show what comes back and file a gap if it's missing.

## Capability checks

- [ ] **S5**: a user can Pay ₦10,000 (S6).
- [ ] **S6**: a user can enter PIN.
- [ ] **S7**: a user can Copy token; Share receipt; Done.
- [ ] **S11**: a user can Add ₦3,800 (wallet top-up).
- [ ] **S12**: a user can Done; Try again.
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6), as are the drawn states S6, S11, S12.

## What the backend serves today (from the analysis)

- **S5**: missing. Missing: No wallet debit for bills. Needs bills init that debits the buyer's Fintava wallet (after PIN) and then pays the biller, either through a Fintava VAS API or by funding WAWU's Flutterwave float from the wallet. BillPayment.flutterwaveTxRef is @unique non-null and must become a provider-neutral reference.
- **S6**: missing. Missing: Same wallet PIN build as E4.
- **S7**: partial. Missing: No token or units are stored or returned: BillPayment has providerReference/providerStatus only; grep 'token|units|extra' in bill-payment finds nothing. Reference format on board (WAW-BIL-xxxx) differs from backend txRef 'wawu-bill-<uuid>'.
- **S11**: missing. Missing: No buyer wallet, no balance check before a bill, no top-up/fund route (wallet funding is the Wallet flow).
- **S12**: partial. Missing: Failure is detected, but refunds are manual (no Flutterwave refund adapter for bills). Board promises automatic reversal to the wallet: needs an automatic wallet credit on biller failure.

A missing or partial row is yours to fix in the backend as part of this task (or the backend task listed in depends_on, check its owner in the task file). Never change the screen to fit the API.

## Figures on these artboards are not facts

Do not hard-code any of these. Show what the API returns, or leave the figure out and file it.

- S5: Fee: No fee (bills)
- S5: Naira wallet · ₦485,250.75 available
- S7: 45.2 kWh for ₦10,000
- S7: Reference format WAW-BIL-8Q2M
- S11: Balance ₦6,200.00, shortfall ₦3,800

## Designer notes (⚠, unresolved)

- None.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
