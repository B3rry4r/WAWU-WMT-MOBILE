---
id: MONEY-17
title: Pay from wallet
owner: YOU
area: MONEY
order: 61
priority: launch
repo: wawu-backend
type: money-path
status: todo
depends_on: [OPS-06, MONEY-09, MONEY-10]
decisions: []
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# MONEY-17 · Pay from wallet

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/` (Fintava's docs and real sandbox responses, task OPS-02)

## Goal

One shared way to take a payment from a user's wallet for anything WAWU sells.

## Scope

Debit to WAWU's collection account with the 85/15 split on the ledger, an Idempotency-Key, behind a feature flag per product.

## Capability checks

- [ ] Paying ₦1,000 moves ₦1,000 once, and the ledger shows the creator's ₦850 and WAWU's ₦150.
- [ ] The same request sent twice debits once.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
