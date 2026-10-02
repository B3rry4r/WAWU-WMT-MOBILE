---
id: CHECK-1
title: Checkpoint 1: the app talks to the real backend, screens match the design
owner: YOU
area: CHECK
order: 125
priority: launch
repo: all
type: ops
status: todo
depends_on: [CHECK-0, SHELL-03, AUTH-01, HOME-02]
decisions: [R-24, R-25]
passes: [V11]
artboards: []
---
# CHECK-1 · Checkpoint 1: the app talks to the real backend, screens match the design

## Read first

- `docs/WORKFLOW.md`
- `docs/roles/AUDITOR.md`
- `docs/people/YOU.md`

## Goal

Prove the app talks to the real backend, signed in for real, and that the screens built so far match the
design. It gates nothing; payment work continues alongside.

## Scope

Dispatch an AUDITOR session over everything marked done so far.

## Capability checks

- [ ] A tester signs in against the backend running locally from wawu-backend's `scripts/local/up.sh` (OPS-03) with seeded data, reached over the LAN or the tunnel, with the real login, and sees a seeded creator's real content (V9).
- [ ] Every screen built so far is compared picture against picture in the audit, or listed as not reachable with a reason.
- [ ] A preview build runs on the owner's Android phone and reaches the local backend through the tunnel (V10, Android only, R-24).

## Builder report

_Owner: what was checked, and the decision._

## Verifier report

_The AUDITOR session report (docs/roles/AUDITOR.md), where this checkpoint calls for one._

## Owner sign-off

_Owner: date, and "go" or what blocks it._
