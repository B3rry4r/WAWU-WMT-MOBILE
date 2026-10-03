---
id: HOME-15
title: Pay for unlocks from the wallet (backend)
owner: DEV
area: HOME
order: 122
priority: launch
repo: wawu-backend
type: money-path
status: todo
depends_on: [MONEY-17, MONEY-19, MONEY-13, MONEY-16, WALLET-15, WALLET-16]
decisions: [R-5, R-10, R-11]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# HOME-15 · Pay for unlocks from the wallet (backend)

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/` (Fintava's docs and real sandbox responses, task OPS-02)
- `docs/fintava/fees.md` (what each payment costs)

## Goal

A piece is unlocked from the buyer's wallet with the PIN, and the creator's 85% lands in their wallet (R-11). The web keeps Flutterwave until after launch.

## Scope

Unlock pays from the wallet (H14-H18); access is granted once the debit settles; a debited-but-not-granted state fixes itself. The web stays on Flutterwave until after launch; V3 checks it still works.

## Capability checks

- [ ] A user unlocking a ₦2,500 piece is debited ₦2,523.25 once and gets access; if access fails after the debit, the sweep grants it or refunds the price.
- [ ] The same request twice charges once (V8).
- [ ] The ledger and Fintava agree after the payment (MONEY-16).

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
