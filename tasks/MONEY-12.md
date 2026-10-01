---
id: MONEY-12
title: Open a Tier 1 account at sign-up
owner: YOU
area: MONEY
order: 66
priority: launch
repo: wawu-backend
type: money-path
status: todo
depends_on: [MONEY-06, AUTH-07]
decisions: []
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# MONEY-12 · Open a Tier 1 account at sign-up

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/` (Fintava's docs and real sandbox responses, task OPS-02)

## Goal

A8: every new user gets their own Fintava account.

## Scope

Account opening after BVN, safe to retry, a visible 'still opening' state, the account number shown on W1.

## Capability checks

- [ ] A new sandbox user ends sign-up with an account number Fintava also reports.
- [ ] Retrying a failed opening never opens two accounts.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
