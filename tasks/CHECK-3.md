---
id: CHECK-3
title: Checkpoint 3: full verification and QA (nothing new is built)
owner: YOU
area: CHECK
order: 161
priority: launch
repo: all
type: ops
status: todo
depends_on: [CHECK-2, RELEASE-01]
decisions: []
passes: [V10, V11]
artboards: []
---
# CHECK-3 · Checkpoint 3: full verification and QA (nothing new is built)

## Read first

- `docs/WORKFLOW.md`
- `docs/roles/AUDITOR.md`
- `docs/people/YOU.md`

## Goal

Nothing new is built here. An independent AUDITOR session checks everything built so far: every artboard picture against picture, every flow as every type of user, every payment path attacked, release builds on real phones. Its defects are fixed in RELEASE-02.

## Scope

An AUDITOR session over the whole app: every launch artboard compared picture against picture, every flow walked as every type of user, release builds on real phones.

## Capability checks

- [ ] Every launch artboard is either compared and conforming, or listed with a reason.
- [ ] No open defects.
- [ ] Release builds work on a real Android phone and a real iPhone (network, camera, push, deep links).

## Builder report

_Owner: what was checked, and the decision._

## Verifier report

_The AUDITOR session report (docs/roles/AUDITOR.md), where this checkpoint calls for one._

## Owner sign-off

_Owner: date, and "go" or what blocks it._
