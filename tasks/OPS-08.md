---
id: OPS-08
title: Retire Shop on the backend
owner: YOU
area: OPS
day: 2
repo: wawu-backend
type: removal
status: queued
blocked_by: ""
depends_on: []
decisions: []
passes: [V1, V3, V4, V7, V9]
artboards: []
---
# OPS-08 · Retire Shop on the backend

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.

## Goal

Shop is retired (R-2). Its routes stop taking orders without breaking past orders or anything else.

## Scope

Before deleting anything, search for every reference. Shop routes return 410 behind a flag; past orders stay readable in purchases; Shop is removed from search and from any Home payload. The web already hides Shop (SHOP_LIVE=false).

## Capability checks

- [ ] A buyer can still see a past shop order in their purchases.
- [ ] Placing a new shop order is refused with a clear message.
- [ ] Search never returns a shop product.
- [ ] V3: every other protected route behaves the same.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
