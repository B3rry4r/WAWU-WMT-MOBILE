---
id: INBOX-17
title: Move paid DMs to the wallet
owner: DEV2
area: INBOX
order: 153
priority: launch
repo: wawu-backend
type: money-path
status: todo
depends_on: [MONEY-18]
decisions: []
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# INBOX-17 · Move paid DMs to the wallet

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV2.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/` (Fintava's docs and real sandbox responses, task OPS-02)

## Goal

Payments are tested one at a time, safest first (docs/WORKFLOW.md section 6): locally against the Fintava sandbox, then a small real payment, then live with the app.

## Scope

Sending a paid DM holds the money; a reply releases it to the creator; expiry refunds it to the sender's wallet (I3-I11). The web stays on Flutterwave until after launch; V3 checks it still works.

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
