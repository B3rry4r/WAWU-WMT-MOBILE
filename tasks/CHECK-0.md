---
id: CHECK-0
title: Checkpoint 0: safe to start building
owner: YOU
area: CHECK
order: 8
priority: launch
repo: all
type: ops
status: todo
depends_on: [SETUP-01, OPS-02, OPS-03, MONEY-01]
decisions: []
passes: []
artboards: []
---
# CHECK-0 · Checkpoint 0: safe to start building

## Read first

- `docs/WORKFLOW.md`
- `docs/people/YOU.md`

## Goal

Nobody builds on a foundation that hasn't been proven.

## Scope

Read the report on SETUP-01, the protected-route suite (MONEY-01), the decision defaults, and the state of Fintava access.

## Capability checks

- [ ] SETUP-01 was verified (it was built by the setup session, so any person's session can verify it) with no open defects.
- [ ] The protected-route suite (MONEY-01) passes on the live backend's main branch.
- [ ] The decision defaults in DECISIONS.md have been read, and any you disagree with are changed.
- [ ] Fintava sandbox keys are in hand, or the owner has recorded that money is built against the mock until access arrives.

## Builder report

_Owner: what was checked, and the decision._

## Verifier report

_The AUDITOR session report (docs/roles/AUDITOR.md), where this checkpoint calls for one._

## Owner sign-off

_Owner: date, and "go" or what blocks it._
