---
id: MONEY-05
title: Mock server for the wallet contract
owner: DEV1
area: MONEY
day: 1
repo: wawu-backend
type: setup
status: ready
blocked_by: ""
depends_on: [MONEY-04]
decisions: []
passes: [V1]
artboards: []
---
# MONEY-05 · Mock server for the wallet contract

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV1.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/` (Fintava's docs and real sandbox responses, task OPS-02)

## Goal

Dev 2 builds wallet screens before the real wallet exists.

## Scope

A command that serves the MONEY-04 contract with realistic example responses (Prism or similar), documented in the mobile README.

## Capability checks

- [ ] The mobile app pointed at the mock shows a wallet balance and history from the contract's examples.
- [ ] Every wallet endpoint in the contract answers, including its error examples.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
