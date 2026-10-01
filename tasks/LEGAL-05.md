---
id: LEGAL-05
title: Move legal fees to the wallet
owner: YOU
area: LEGAL
day: 4
repo: wawu-backend
type: money-path
status: queued
blocked_by: ""
depends_on: [MONEY-17]
decisions: []
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# LEGAL-05 · Move legal fees to the wallet

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/` (Fintava's docs and real sandbox responses, task OPS-02)

## Goal

Payments move one at a time, safest first (docs/WORKFLOW.md section 6). Staging with the sandbox, then staff with real money, then everyone on mobile.

## Scope

Consultation and service fees, and business-name registration, pay from the wallet (S19, S22, S26) at configured prices. The web stays on Flutterwave until Stage 9; V3 checks it still works.

## Capability checks

- [ ] A user pays from their wallet with their PIN and gets what they paid for.
- [ ] The same request twice charges once (V8).
- [ ] The ledger and Fintava agree after the payment (MONEY-16).

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
