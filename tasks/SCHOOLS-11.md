---
id: SCHOOLS-11
title: Paying schools
owner: DEV3
area: SCHOOLS
order: 131
priority: launch
repo: wawu-backend
type: money-path
status: todo
depends_on: [MONEY-17, SCHOOLS-07]
decisions: [R-12]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# SCHOOLS-11 · Paying schools

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV3.md` (what you own)
- `DECISIONS.md`: R-12 (ruled; build what it says)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/` (Fintava's docs and real sandbox responses, task OPS-02)

## Goal

Enrolment money reaches the school at the ruled split.

## Scope

School payee details and verification, settlement through Fintava at the split in R-12.

## Capability checks

- [ ] After an enrolment, the school's settlement equals the ruled amount and the ledger shows WAWU's share.
- [ ] V8: a replayed settlement does not pay twice.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
