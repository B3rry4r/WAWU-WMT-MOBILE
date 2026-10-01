---
id: CHECK-0
title: Day 0 checkpoint: safe to start building
owner: YOU
area: CHECK
day: 0
repo: all
type: ops
status: ready
blocked_by: ""
depends_on: [SETUP-01, MONEY-01, OPS-01, OPS-02, OPS-03]
decisions: []
passes: []
artboards: []
---
# CHECK-0 · Day 0 checkpoint: safe to start building

## Read first

- `docs/WORKFLOW.md`
- `docs/people/YOU.md`

## Goal

Nobody builds on a foundation that hasn't been proven. Day 1 starts only when this is signed.

## Scope

Read the verifier's report on SETUP-01, the protected-route suite (MONEY-01), and the state of D1 to D4 and Fintava access.

## Capability checks

- [ ] SETUP-01 was verified by a different session, with no open defects.
- [ ] The protected-route suite (MONEY-01) passes on the live backend's main branch.
- [ ] D1 to D4 are ruled in DECISIONS.md.
- [ ] Fintava sandbox keys are in hand, or the owner has recorded that money is built against the mock this week.

## Builder report

_Owner: what was checked, and the decision._

## Verifier report

_The AUDITOR session report (docs/roles/AUDITOR.md), where this checkpoint calls for one._

## Owner sign-off

_Owner: date, and "go" or what blocks it._
