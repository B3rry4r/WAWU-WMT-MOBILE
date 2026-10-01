---
id: WALLET-23
title: Tier 2: NIN upgrade and limits
owner: DEV1
area: WALLET
day: later
repo: wawu-backend
type: money-path
status: queued
blocked_by: ""
depends_on: [MONEY-12]
decisions: []
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# WALLET-23 · Tier 2: NIN upgrade and limits

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV1.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/` (Fintava's docs and real sandbox responses, task OPS-02)

## Goal

A17-A19: raise limits with a NIN; limits come from Fintava, never from the canvas.

## Scope

NIN submission and check, tier and limits read from Fintava, limits enforced on debits.

## Capability checks

- [ ] A debit over the Tier 1 limit is refused with the limit shown.
- [ ] After NIN, the new limit applies without signing out.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
