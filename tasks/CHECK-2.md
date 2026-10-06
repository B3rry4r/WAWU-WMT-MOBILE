---
id: CHECK-2
title: Checkpoint 2: money moves correctly
owner: YOU
area: CHECK
order: 169
priority: launch
repo: all
type: ops
status: todo
depends_on: [CHECK-1, OPS-10, BILLS-03, EVENTS-06, EVENTS-10, INBOX-11, INBOX-13, INBOX-20, KYC-04, LEGAL-06, ME-12, SCHOOLS-06, SCHOOLS-11, WALLET-13, WALLET-17]
decisions: [R-20, R-25]
passes: [V8, V11]
artboards: []
---
# CHECK-2 · Checkpoint 2: money moves correctly

## Read first

- `docs/WORKFLOW.md`
- `docs/roles/AUDITOR.md`
- `docs/people/YOU.md`
- `docs/fintava/fees.md` (what each payment costs; the dashboard rates, final)

## Goal

No payment path goes to real users until it has been attacked and reconciled.

## Scope

An AUDITOR session runs V8 across every payment path, against the local backend with seeded data and the
Fintava sandbox. Then staff make a small real payment on each path on the production backend (the DigitalOcean
droplet, deployed by GitHub Actions) with live keys (OPS-10).

## Capability checks

- [ ] For every payment path: the same request twice charges once; a wrong PIN five times locks; a failed payment reverses.
- [ ] The nightly check reports zero differences between our ledger and Fintava.
- [ ] Staff have made a real small payment on each path on the production backend with live keys, with no mismatch; any mismatch is fixed before launch.

## Builder report

_Owner: what was checked, and the decision._

## Verifier report

_The AUDITOR session report (docs/roles/AUDITOR.md), where this checkpoint calls for one._

## Owner sign-off

_Owner: date, and "go" or what blocks it._
