---
id: OPS-08
title: Retire Shop on the backend
owner: YOU
area: OPS
order: 37
priority: launch
repo: wawu-backend
type: removal
status: todo
depends_on: [MONEY-01]
decisions: [R-2]
passes: [V1, V3, V4, V7, V9]
artboards: []
---
# OPS-08 · Retire Shop on the backend

## Current state

As of 16 Oct 2026, from the lead's log (10 Oct) and the branch.
- **Status:** review on its branches (round 2 verifier: PASS, no open finding). This file on main still says todo.
- **Branches:** mobile `wmt/OPS-08` 2434f5a. Backend `wmt/OPS-08` 60e3fd9, PR #26.
- **Merged and live:** nothing of this task.
- **Held by:** the owner's `relock-approved` label on backend PR #26 (ten Shop entries are relocked).
- **Open findings:** none. Where a buyer sees a past Shop order stays the owner's call.
- **Next:** the owner applies the label; the lead merges #26. FIX-17's D3 needs this merge (retired shop routes answer 410).
- **Records:** on the branch, `wmt/OPS-08`, in tasks/OPS-08.md there (30 KB, not in this file on main). After the merge run `python3 scripts/tasks/compact_task.py OPS-08`; the history goes to tasks/history/OPS-08.md.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.

## Goal

Shop is retired (R-2). Its routes stop taking orders without breaking past orders or anything else.

## Scope

Before deleting anything, search for every reference. Shop routes return 410; past orders stay readable in
purchases; Shop is removed from search and from any Home payload. The web already hides Shop (SHOP_LIVE=false).

In the same pull request:
- change the deploy smoke test, which probes `https://$API_DOMAIN/api/hub/shop/products` and accepts only 200 or
  401 (wawu-backend `.github/workflows/deploy.yml`), to a route that stays (for example `/api/hub/health`), or
  every deploy after this one fails;
- relock the protected-route list (MONEY-01) for the Shop routes only; the owner applies `relock-approved`.

## Capability checks

- [ ] Production logs show no Shop order calls for the two weeks before the change (docs/WORKFLOW.md section 6, Remove).
- [ ] A buyer can still see a past shop order in their purchases.
- [ ] Placing a new shop order is refused with a clear message.
- [ ] Search never returns a shop product.
- [ ] The deploy after this change goes green with the new smoke-test route.
- [ ] V3: every other protected route behaves the same.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
