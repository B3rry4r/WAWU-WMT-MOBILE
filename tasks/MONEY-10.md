---
id: MONEY-10
title: The ledger
owner: YOU
area: MONEY
order: 61
priority: launch
repo: wawu-backend
type: money-path
status: todo
depends_on: [MONEY-07]
decisions: []
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# MONEY-10 · The ledger

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/` (Fintava's docs and real sandbox responses, task OPS-02)
- `docs/fintava/fees.md` (what each payment costs; the dashboard rates, final)

## Goal

Our record of every movement of money, mirrored from Fintava, in kobo.

## Scope

Transaction store: amount in kobo, direction, counterparty, category, note, Fintava reference, status.

Sandbox checks need Fintava to activate WAWU's sandbox merchant: unblocked when `POST /create/customer` stops answering `403 Merchant is not active` (OPS-02, `docs/fintava/sandbox/README.md`). Build and unit-test meanwhile; report each sandbox check NOT RUN with that reason until then.

## Capability checks

- [ ] Every sandbox movement in MONEY-06 to MONEY-08 appears once in the ledger with the right sign.
- [ ] Amounts survive round trips exactly (no floats).

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
