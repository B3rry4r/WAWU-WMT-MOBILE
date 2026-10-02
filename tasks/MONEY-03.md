---
id: MONEY-03
title: The pay-from-wallet sheet
owner: YOU
area: MONEY
order: 45
priority: launch
repo: wawu-wmt-mobile
type: component
status: todo
depends_on: [UI-02, MONEY-02, MONEY-04]
decisions: [R-6, R-10]
passes: [V1, V5, V6]
artboards: [H14, W10]
---
# MONEY-03 · The pay-from-wallet sheet

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- The design: `python3 scripts/design/render_design.py H14 W10` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A1.json`, `docs/analysis/evidence/A4.json`
- `docs/designer/BRIEF.md`: its entries for H14 and W10, and rules 3 to 5 (the brief is part of the design: build its version)
- `docs/fintava/fees.md` (what each payment costs)

## Goal

One payment sheet: what you're paying for, the amount, the wallet balance, and what happens when it's not enough.

## Scope

src/components/pay-sheet/ with states: enough, not enough (top-up path), paying, still confirming, failed,
and no wallet yet. It shows the price, Fintava's charge and the total from the fee quote (WALLET-15), with one
"Fees" row when there are two or more parts (the owner's ruling on this task's branch, R-23). The button shows
the total the payer pays (BRIEF rule 5). With no wallet yet, the sheet shows no balance and no Pay; KYC-05 adds
the way into Open your wallet (docs/WORKFLOW.md section 7, "Links between screens").

## Brief changes (build these, not the canvas)

- **H14**: the breakdown (rule 3): Price ₦2,500, Fintava's charge ₦23.25, Total ₦2,523.25; button "Unlock · ₦2,523.25". (Why: R-10 and the purchases default: an unlock is a wallet to wallet move, which Fintava charges ₦23.25 for under ₦5,000.)
- **W10**: the fee breakdown (rule 3). For this bank send: Fintava's charge ₦40 + WAWU's fee ₦25 = ₦65, Total ₦25,065.00. If you also draw the WAWU-user version: ₦15.75 + ₦10 = ₦25.75, Total ₦25,025.75. The button shows the total, "Send ₦25,065", and a line above it says what arrives: "They get ₦25,000" (rule 5). Your note on W10, "The button shows the amount the person receives", changes to match. (Why: R-10, Fintava's price list.)

## Capability checks

- [ ] With too little money, the sheet shows the shortfall and a way to add money.
- [ ] A user sees the sheet exactly as H14 draws it with the brief's breakdown, light and dark (V5).
- [ ] With ₦5,000 in the wallet, a user unlocking a ₦2,500 piece sees ₦2,500 + ₦23.25 = ₦2,523.25 and the button "Unlock · ₦2,523.25" (BRIEF H14).
- [ ] A user with no wallet sees no balance and no Pay button.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
