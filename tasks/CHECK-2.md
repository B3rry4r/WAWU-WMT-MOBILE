---
id: CHECK-2
title: End of Day 4 checkpoint: money moves correctly
owner: YOU
area: CHECK
day: 4
repo: all
type: ops
status: queued
blocked_by: ""
depends_on: [CHECK-1]
decisions: []
passes: [V8, V11]
artboards: []
---
# CHECK-2 · End of Day 4 checkpoint: money moves correctly

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
- [ ] The nightly check reports zero differences between our ledger and Fintava (or the mock, if the owner ruled so on Day 0).
- [ ] Staff have made real small payments on each live path with no mismatch, or the path stays behind its flag.

## Builder report

_Owner: what was checked, and the decision._

## Verifier report

_The AUDITOR session report (docs/roles/AUDITOR.md), where this checkpoint calls for one._

## Owner sign-off

_Owner: date, and "go" or what blocks it._
