---
id: RELEASE-02
title: Fix QA defects, re-verify, submit to the stores
owner: YOU
area: RELEASE
order: 161
priority: launch
repo: wawu-wmt-mobile
type: ops
status: todo
depends_on: [CHECK-3]
decisions: []
passes: []
artboards: []
---
# RELEASE-02 · Fix QA defects, re-verify, submit to the stores

## Read first

- `docs/WORKFLOW.md`
- `docs/people/YOU.md`

## Goal

Nothing new is built here. Each CHECK-3 defect is fixed by the owner of that feature and re-verified by a different session; then both apps are submitted. Review time is the stores' decision, typically one to three days.

## Scope

Fixes for CHECK-3 defects only, each re-verified. Anything still failing is turned off behind its flag rather than shipped broken. Any payment path not signed off in CHECK-2 stays behind its flag.

## Capability checks

- [ ] Every CHECK-3 defect is fixed and re-verified, or its feature is off behind a flag.
- [ ] Both apps are submitted with the final builds.

## Builder report

_Owner: what was checked, and the decision._

## Verifier report

_The AUDITOR session report (docs/roles/AUDITOR.md), where this checkpoint calls for one._

## Owner sign-off

_Owner: date, and "go" or what blocks it._
