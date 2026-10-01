---
id: MONEY-15
title: Transaction history and detail
owner: YOU
area: MONEY
order: 59
priority: launch
repo: wawu-backend
type: backend-endpoint
status: todo
depends_on: [MONEY-10]
decisions: []
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# MONEY-15 · Transaction history and detail

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/` (Fintava's docs and real sandbox responses, task OPS-02)

## Goal

W26-W28: search, filter, monthly in and out, and one transaction's detail.

## Scope

GET history with search, category filter and cursor pages; monthly totals; GET one transaction.

## Capability checks

- [ ] Searching a recipient's name finds their transfers.
- [ ] Monthly totals equal the sum of that month's rows.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
