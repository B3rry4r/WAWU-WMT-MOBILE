---
id: MONEY-16
title: Nightly check against Fintava
owner: DEV1
area: MONEY
day: 3
repo: wawu-backend
type: money-path
status: queued
blocked_by: ""
depends_on: [MONEY-10, MONEY-11]
decisions: []
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# MONEY-16 · Nightly check against Fintava

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV1.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/` (Fintava's docs and real sandbox responses, task OPS-02)

## Goal

Any difference between our ledger and Fintava is found the same night.

## Scope

A nightly job that compares every wallet's movements and balance with Fintava's and alerts the owner on any mismatch.

## Capability checks

- [ ] A deliberately altered staging row is reported the next run.
- [ ] A clean night reports zero mismatches and says how many wallets it checked.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
