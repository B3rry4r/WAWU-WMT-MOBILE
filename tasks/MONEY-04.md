---
id: MONEY-04
title: Money conventions and the wallet contract
owner: DEV1
area: MONEY
day: 1
repo: wawu-backend
type: contract
status: ready
blocked_by: ""
depends_on: [OPS-02]
decisions: []
passes: [V1]
artboards: []
---
# MONEY-04 · Money conventions and the wallet contract

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV1.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/` (Fintava's docs and real sandbox responses, task OPS-02)

## Goal

Mobile builds wallet screens against an agreed contract before Fintava is connected.

## Scope

docs/contract/CONVENTIONS.md (money in kobo, phone in +234 normalised by the server, one error shape, Idempotency-Key header, how the PIN is sent, cursor pages). Contract entries for wallet, PIN, transfers, pay-from-wallet, holds and history in the backend's registry, from Fintava's docs (OPS-02). Also: named schemas instead of the duplicated inline response shapes (BACKEND_GAPS G-1).

## Capability checks

- [ ] Every wallet artboard's data needs (docs/analysis evidence, flow wallet) maps to a contract entry.
- [ ] Conflicts between the canvas and Fintava's real behaviour are listed for the owner, not resolved.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
