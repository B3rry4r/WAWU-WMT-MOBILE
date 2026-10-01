---
id: SETTINGS-06
title: Delete account: 30 days, cancellable
owner: DEV2
area: SETTINGS
day: 4
repo: wawu-id, wawu-backend
type: backend-endpoint
status: blocked
blocked_by: "until D12 is ruled in DECISIONS.md"
depends_on: []
decisions: [D12]
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# SETTINGS-06 · Delete account: 30 days, cancellable

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV2.md` (what you own)
- `DECISIONS.md`: D12 (open: this task is blocked until they are ruled)
- This task changes `wawu-id, wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.

## Goal

Z6-Z8: deletion waits, signing in cancels it, and money is handled first.

## Scope

Grace period per D12; cancel on sign-in; refuse while the wallet holds money (balance from Fintava).

## Capability checks

- [ ] A user who signs in during the grace period keeps their account.
- [ ] A user with money in their wallet is told to move it first.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
