---
id: BILLS-02
title: Pay a bill: review, PIN, token, failures
owner: DEV2
area: BILLS
order: 115
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: todo
depends_on: [MONEY-02, MONEY-03, MONEY-13, MONEY-19, WALLET-15, BILLS-01, BILLS-04, UI-02]
decisions: [R-6, R-10, R-19, R-31, R-33]
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
- `docs/designer/BRIEF.md`: its entries for S5, S6, S7, S11, S12 (the brief is part of the design: build its version, not the canvas's; R-29)
- `docs/fintava/fees.md` (what each payment costs; the dashboard rates, final)

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

Native modules: `expo-clipboard` (S7 Copy token). They are in `SHARED-CHANGES.md` row 8 (one batch for Developers 2 and 3, one new development build); if row 8 is not applied when this task starts, say so in the report and build everything else.

Payouts out of Fintava don't work in the sandbox yet: bank sends and the airtime, data and electricity purchases answer `400 "Unable to find customers"`, and cable answers "service not currently available", with nothing debited (`docs/fintava/sandbox/README.md`, "The blocker"). Unblocked when a ₦100 `POST /bank/credit/merchant` to the sandbox stub `0123456789`/`000013` stops answering "Unable to find customers" (question 17 in `docs/fintava/naira-api.md`). Build and unit-test meanwhile; report the bank-send and bill checks NOT RUN with that reason until then.

## Artboards

- **S5 · Review**: Review: Ikeja Electric ₦10,000.00, meter, name, the fee breakdown (Fintava's ₦100 + WAWU's ₦0, and the payer's charge for moving the money into WAWU's wallet, R-31), Total, 'Pay from wallet · Naira wallet · balance available', the total on the Pay button (BRIEF S5).
- **S6 · PIN**: PIN keypad over S5: 'Approve' with the total (BRIEF S6), then 'PIN accepted'.
- **S7 · Token**: Receipt: ₦10,000 paid, prepaid token '4821 0937 5510 2286 7734' with Copy, 45.2 kWh, meter, reference WAW-BIL-8Q2M, date, the total paid (BRIEF S7), Share receipt (the phone's share sheet at launch, R-33), Done.
- **S11 · Not enough in wallet**: 'Not enough in your Naira wallet · You have ₦6,200.00.' and the shortfall including the fee ('Add ₦3,900', BRIEF S11).
- **S12 · Failed**: 'Payment didn't go through · Ikeja Electric didn't confirm it', a 'Returned to your wallet' row with the amount that came back (BRIEF S12, rule 6), reference, Done / Try again.

## Fintava facts

From `docs/fintava/naira-api.md`; a real sandbox response overrides it.

Bill calls debit WAWU's merchant wallet, not the user's. A user's bill is two steps: wallet to WAWU's wallet (`/transaction/wallet-to-wallet`), then pay the biller. If the biller fails, move it back; that is S12's reversal. Whether the electricity response includes the token and units (S7) is not documented: show what comes back and file a gap if it's missing.

## Brief changes (build these, not the canvas)

- **S5**: the fee breakdown: Fintava's charge ₦100 + WAWU's fee ₦0 = ₦100, Total ₦10,100.00. The button says "Pay ₦10,100". (Why: R-10, Fintava's price list.)
- **S6**: S5's new rows behind it, and "Approve ₦10,100 to Ikeja Electric". (Why: rule 5.)
- **S7**: "₦10,100 paid", or "₦10,000 paid" with a row showing the ₦100 charge; the total paid must be visible. (Why: rule 5.)
- **S11**: S5's new rows (Total ₦10,100.00), and the shortfall that follows: "Add ₦3,900". (Why: rule 5: the total includes the fee, so the shortfall does too.)
- **S12**: the Amount row is "Returned to your wallet" with a slot the app fills (sample ₦10,000.00); if a charge was kept, a second row shows it. (Why: rule 6.)

## Added by later tasks

These entries are drawn on this task's artboards but lead to screens built by later tasks, so this task does
not build them. Each is added, exactly as drawn, by the task that builds where it leads (docs/WORKFLOW.md
section 7, R-27). The verifier reports their checks as belonging to that task.

- S11: Add ₦amount (opens W15): added by WALLET-05

## Capability checks

- [ ] **S5**: a user sees ₦10,000, the fee breakdown and the total, and taps Pay with the total (S6).
- [ ] **S6**: a user can enter PIN.
- [ ] **S7**: a user can Copy the token; Share receipt through the phone's share sheet (text and reference); Done.
- [ ] **S11**: with ₦6,200 a user sees the shortfall including the fee ("Add ₦3,900" against a ₦10,100 total).
- [ ] **S12**: a user sees "Returned to your wallet" with the amount that came back; Done; Try again.
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6), as are the drawn states S6, S11, S12.
- [ ] From S4 (BILLS-01), a user who taps Continue reaches S5 (this task adds that step).
- [ ] A user with no wallet who taps Pay lands in Open your wallet (A26).

## What the backend serves today (from the analysis)

- **S5**: missing. Missing: No wallet debit for bills. Needs bills init that debits the buyer's Fintava wallet (after PIN) and then pays the biller, through Fintava's bill APIs (BILLS-04). BillPayment.flutterwaveTxRef is @unique non-null and must become a provider-neutral reference.
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
