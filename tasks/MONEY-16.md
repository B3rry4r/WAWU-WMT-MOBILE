---
id: MONEY-16
title: Nightly check against Fintava
owner: YOU
area: MONEY
order: 100
priority: launch
repo: wawu-backend
type: money-path
status: todo
depends_on: [MONEY-10, MONEY-11, MONEY-17, MONEY-18]
decisions: [R-10, R-19]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# MONEY-16 · Nightly check against Fintava

## Current state

As of 16 Oct 2026, from the lead's log (12 Oct 17:15, nothing newer) and the branches.
- **Status:** review on its branches (round 2 verified: no blocker, no false clean). This file on main still says todo.
- **Branches:** mobile `wmt/MONEY-16` 3c5b536. Backend `wmt/MONEY-16` 61e2b08 (migration `20261021170000_money_check_runs`). wawu-id `wmt/MONEY-16` 3a17b6a (the mail route). No PRs yet.
- **Merged and live:** nothing of this task.
- **Open findings:** blocker 0, high 0, medium 0. Lows RF-1 to RF-7 are in tasks/SWEEP-MONEY.md.
- **Next:** the lead merges: rename the migration off NUV-06's stamp (after main's last folder), backend PR, wawu-id PR, mobile sign-off. The reversed-send rule assumes Fintava reports FAILURE; it is loud if that is wrong.
- **Records:** on the branch, `wmt/MONEY-16`, in tasks/MONEY-16.md there (75 KB, not in this file on main). After the merge run `python3 scripts/tasks/compact_task.py MONEY-16`; the history goes to tasks/history/MONEY-16.md.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/naira-api.md` (what Fintava's API really does; the pages are in `docs/fintava/reference/`)
- `docs/fintava/fees.md` (what each payment costs; the dashboard rates, final)

## Goal

Any difference between our ledger and Fintava is found the same night.

## Scope

A nightly job that compares every wallet's movements and balance with Fintava's, and emails the owner (the
backend's existing mailer) on any mismatch. It also checks that held money in WAWU's merchant wallet equals the
open holds in our ledger (R-19), and that WAWU's merchant charge landed in WAWU's wallet for each fee-bearing
transaction (R-10, OPS-09).

## Fintava facts

From `docs/fintava/naira-api.md`; a real sandbox response overrides it.

Compare against `GET /txn?customerId=` per customer, `GET /txn/merchant` for WAWU, and `GET /merchant/balance`. Pages take up to 100 rows.

## Capability checks

- [ ] A deliberately altered test row is reported the next run.
- [ ] A clean night reports zero mismatches and says how many wallets it checked.
- [ ] A hold that is not in the ledger is reported.
- [ ] A transfer whose merchant charge didn't land in WAWU's wallet is reported.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
