---
id: CHECK-2
title: Checkpoint 2: money moves correctly
owner: YOU
area: CHECK
order: 104
priority: launch
repo: all
type: ops
status: todo
depends_on: [CHECK-1]
decisions: [R-20]
passes: [V8, V11]
artboards: []
---
# CHECK-2 · Checkpoint 2: money moves correctly

## Read first

- `docs/WORKFLOW.md`
- `docs/roles/AUDITOR.md`
- `docs/people/YOU.md`

## Goal

No payment path goes to real users until it has been attacked and reconciled.

## Scope

An AUDITOR session runs V8 across every payment path built so far, on staging.

## Capability checks

- [ ] For every payment path: the same request twice charges once; a wrong PIN five times locks; a failed payment reverses.
- [ ] The nightly check reports zero differences between our ledger and Fintava (or the mock, if Fintava access hasn't arrived).
- [ ] Staff have made a real small payment on each path with no mismatch; any mismatch is fixed before launch.

## Builder report

_Owner: what was checked, and the decision._

## Verifier report

_The AUDITOR session report (docs/roles/AUDITOR.md), where this checkpoint calls for one._

## Owner sign-off

_Owner: date, and "go" or what blocks it._
