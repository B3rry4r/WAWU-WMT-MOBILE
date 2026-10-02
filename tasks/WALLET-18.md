---
id: WALLET-18
title: Receipts
owner: YOU
area: WALLET
order: 164
priority: after-launch
repo: wawu-backend
type: backend-endpoint
status: todo
depends_on: [MONEY-15]
decisions: []
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# WALLET-18 · Receipts

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/` (Fintava's docs and real sandbox responses, task OPS-02)

## Goal

W12, W27, W41-W43: a receipt with a short code anyone can verify at wawu/r/<code>, as image or PDF.

## Scope

Short code, public verification page, PNG and PDF rendering.

## Capability checks

- [ ] A receipt's code opens a page that matches the transaction.
- [ ] A made-up code shows 'not found', never someone else's receipt.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
