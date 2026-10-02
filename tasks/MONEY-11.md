---
id: MONEY-11
title: Balance
owner: YOU
area: MONEY
order: 69
priority: launch
repo: wawu-backend
type: money-path
status: todo
depends_on: [MONEY-06]
decisions: [R-10]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# MONEY-11 · Balance

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/naira-api.md` (what Fintava's API really does; the pages are in `docs/fintava/reference/`)
- `docs/fintava/fees.md` (what each payment costs; the dashboard rates, final)

## Goal

W1: the balance is Fintava's, never a sum of our records.

## Scope

GET balance in kobo from Fintava; a typed 'can't reach your account' error (W6).

## Fintava facts

From `docs/fintava/naira-api.md`; a real sandbox response overrides it.

`GET /customer/wallet/balance/{walletId}` returns `availableBalance` and `bookedBalance` in naira. Show `availableBalance`, fetched from Fintava.

## Capability checks

- [ ] The balance shown equals Fintava's after every movement.
- [ ] With Fintava unreachable, the app shows W6, not zero.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
