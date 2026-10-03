---
id: HOME-12
title: Unlock from the feed
owner: DEV
area: HOME
order: 126
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: todo
depends_on: [MONEY-02, MONEY-03, MONEY-13, MONEY-19, WALLET-15, HOME-15, UI-02, HOME-02]
decisions: [R-6, R-10]
passes: [V1, V4, V5, V6, V7, V8, V9]
artboards: [H14, H15, H16, H17, H18]
---
# HOME-12 · Unlock from the feed

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV.md` (what you own)
- The design: `python3 scripts/design/render_design.py H14 H15 H16 H17 H18` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A4.json`
- `docs/designer/BRIEF.md`: its entries for H14, H15, H16, H17, H18 (the brief is part of the design: build its version, not the canvas's; R-29)
- `docs/fintava/fees.md` (what each payment costs; the dashboard rates, final)

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

## Artboards

- **H14 · Unlock sheet**: Bottom sheet: title, creator, type, Price ₦2,500, 'Yours Forever, in My purchases', the breakdown (Price, Fintava's charge, Total), Pay from wallet (Naira wallet · balance available), 'Unlock · ₦2,523.25' (BRIEF H14). 'Paid from the Naira wallet with the transaction PIN. There's no checkout page and no card form.'
- **H15 · PIN**: Transaction PIN sheet 'Approve ₦2,500 to Chidi Eze' with keypad; 'The same PIN sheet as Wallet (W11)'.
- **H16 · Unlocked**: Success: 'Unlocked … it's in My purchases from now on.' Paid ₦2,500.00, From Naira wallet, Reference WAW-UNL-4K2P, Watch now.
- **H17 · Not enough in wallet**: From H14 when the wallet is too low: 'This costs ₦2,500. You have ₦1,200.00.' Top up at least the shortfall including the charge (₦1,323.25, BRIEF H17); Add opens Wallet W15 with the shortfall filled in, then returns (added by WALLET-05).
- **H18 · Couldn't confirm**: From H15: 'Paid, still opening. ₦2,500 left your wallet and we couldn't finish opening the video. You won't be charged twice.' Refresh, Contact support.

## Brief changes (build these, not the canvas)

- **H14**: the breakdown (rule 3): Price ₦2,500, Fintava's charge ₦23.25, Total ₦2,523.25; button "Unlock · ₦2,523.25". (Why: R-10 and the purchases default: an unlock is a wallet to wallet move, which Fintava charges ₦23.25 for under ₦5,000.)
- **H15**: "Approve ₦2,523.25 to Chidi Eze". (Why: rule 5, following H14.)
- **H16**: "Paid ₦2,523.25" (or the price and Fintava's charge as two rows, your call). (Why: rule 5.)
- **H17**: "This costs ₦2,523.25. You have ₦1,200.00." Show Fintava's charge under the price, then "Top up at least ₦1,323.25" and "Add ₦1,323.25". (Why: rule 5: the shortfall includes the charge.)
- **H18**: "₦2,523.25 left your wallet ...", the total H14 now shows. (Why: rule 5.)

## Added by later tasks

These entries are drawn on this task's artboards but lead to screens built by later tasks, so this task does
not build them. Each is added, exactly as drawn, by the task that builds where it leads (docs/WORKFLOW.md
section 7, R-27). The verifier reports their checks as belonging to that task.

- H17: Add ₦amount (opens W15): added by WALLET-05
- H18: Contact support (opens the support chat): added by SUPPORT-01

## Capability checks

- [ ] **H14**: a user sees ₦2,500 + ₦23.25 = ₦2,523.25 and can tap "Unlock · ₦2,523.25"; dismiss.
- [ ] **H15**: a user can enter 4-digit PIN.
- [ ] **H16**: a user can Watch now (plays in place).
- [ ] **H17**: with ₦1,200 a user sees "Top up at least ₦1,323.25"; Cancel.
- [ ] **H18**: a user sees the total that left their wallet (₦2,523.25) and can Refresh.
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6), as are the drawn states H17, H18.
- [ ] From the offer bars on H3, H4 and H5 (HOME-02), a user can tap and reach H14 (this task adds them, as drawn).
- [ ] A user with no wallet who taps Unlock lands in Open your wallet (A26).

## What the backend serves today (from the analysis)

- **H14**: partial. Missing: Unlock exists but only as a Flutterwave charge; no wallet-debit unlock, no buyer wallet balance.
- **H15**: missing. Missing: No transaction PIN model or verify route anywhere in the backend.
- **H16**: partial. Missing: Purchase + full asset exist; reference is a Flutterwave tx_ref, not a WAW-UNL-xxxx wallet reference; source 'Naira wallet' not modelled.
- **H17**: missing. Missing: No buyer wallet; no insufficient-funds error contract on unlock.
- **H18**: partial. Missing: Reconciliation exists for Flutterwave charges; no wallet-debit idempotency key or 'debited but entitlement not granted' state; no support-contact route.

A missing or partial row is yours to fix in the backend as part of this task (or the backend task listed in depends_on, check its owner in the task file). Never change the screen to fit the API.

## Figures on these artboards are not facts

Do not hard-code any of these. Show what the API returns, or leave the figure out and file it.

- H14: Price ₦2,500
- H14: Fee: No fee
- H14: Yours Forever
- H14: Naira wallet ₦485,250.75 available
- H16: Reference format WAW-UNL-4K2P
- H16: Paid ₦2,500.00
- H17: ₦1,200.00 balance
- H17: shortfall ₦1,300
- H18: 'You won't be charged twice' (guarantee claim)

## Designer notes (⚠, unresolved)

- None.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
