---
id: WALLET-15
title: Fee quotes
owner: DEV1
area: WALLET
day: 3
repo: wawu-backend
type: backend-endpoint
status: blocked
blocked_by: "until D5 is ruled in DECISIONS.md"
depends_on: []
decisions: [D5]
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# WALLET-15 · Fee quotes

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV1.md` (what you own)
- `DECISIONS.md`: D5 (open: this task is blocked until they are ruled)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/` (Fintava's docs and real sandbox responses, task OPS-02)

## Goal

Every fee shown before paying comes from the server, never from the app.

## Scope

GET fee quote for transfer, withdraw, card top-up and card order, from configuration set per D5.

## Capability checks

- [ ] Changing a fee in configuration changes the quote and the charge together.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
