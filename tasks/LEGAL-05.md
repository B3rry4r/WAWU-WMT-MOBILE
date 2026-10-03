---
id: LEGAL-05
title: Pay legal fees from the wallet (backend)
owner: DEV3
area: LEGAL
order: 112
priority: launch
repo: wawu-backend
type: money-path
status: todo
depends_on: [MONEY-17, MONEY-13, MONEY-16, WALLET-15, WALLET-16, LEGAL-03]
decisions: [R-10, R-14]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# LEGAL-05 · Pay legal fees from the wallet (backend)

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV3.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/` (Fintava's docs and real sandbox responses, task OPS-02)
- `docs/fintava/fees.md` (what each payment costs)

## Goal

Consultation and service fees are paid from the wallet with the PIN, at the prices WAWU sets in admin (R-14). The web keeps Flutterwave until after launch.

## Scope

Consultation and service fees, and business-name registration, pay from the wallet (S19, S22, S26) at the prices WAWU sets in admin (R-14). The web stays on Flutterwave until after launch; V3 checks it still works.

## Capability checks

- [ ] The price charged equals the price set in admin at the time of the quote (R-14), plus Fintava's charge from the fee quote.
- [ ] The same request twice charges once (V8).
- [ ] The ledger and Fintava agree after the payment (MONEY-16).

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
