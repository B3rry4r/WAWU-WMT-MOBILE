---
id: MONEY-14
title: Reset the PIN, and Face ID approval
owner: DEV1
area: MONEY
day: 3
repo: wawu-backend
type: money-path
status: queued
blocked_by: ""
depends_on: [MONEY-09]
decisions: []
passes: [V1, V2, V3, V4, V6, V7, V8, V9, V10]
artboards: []
---
# MONEY-14 · Reset the PIN, and Face ID approval

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV1.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/` (Fintava's docs and real sandbox responses, task OPS-02)

## Goal

W37: reset by a code to the phone. W35: Face ID can stand in for the PIN.

## Scope

PIN reset by code; device key registration so a biometric approval on a known device counts as the PIN.

## Capability checks

- [ ] A user who forgot their PIN can reset it with a code and pay again.
- [ ] An approval from an unregistered device is refused.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
