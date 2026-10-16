---
id: FIX-13
title: WAWU ID token rotation: a failed sweep never fails the sign-in
owner: YOU
area: FIX
order: 194
priority: launch
repo: wawu-id
type: setup
status: todo
depends_on: [AUTH-08]
decisions: []
passes: [V1, V2, V3]
artboards: []
---
# FIX-13 · WAWU ID token rotation: a failed sweep never fails the sign-in

## Current state

As of 16 Oct 2026.
- **Status:** todo. No branch, no code, nothing merged, no findings.
- **Next:** a builder starts from the brief below. Dependencies done; ready to schedule.
- **History:** none yet. Reports go to tasks/history/FIX-13.md.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows; section 4, fenced files)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- This task changes `wawu-id`. Follow that repo's CLAUDE.md for its commands.
- `tasks/AUTH-08.md` (merge note: F-1, F-3, F-4)

## Goal

AUTH-08 merged with follow-ups: the sweep of old refresh tokens runs inside the rotation transaction, so a sweep failure answers 500 to a person refreshing (F-1); one spec line depends on a 1000 ms timing and flakes (F-3).

## Scope

The sweep can no longer fail the rotation (outside the transaction or best-effort with a log); the flaky spec line asserts on state, not time. F-4 (transition cost) is measured and recorded, not changed.

## Capability checks

- [ ] A forced sweep failure leaves the refresh answering 200 with a new token.
- [ ] The spec passes 50 runs in a row under load.
- [ ] wawu-id's suite passes; the Hub's sign-in contract is unchanged.

## Builder report

_Not started._

## Verifier report

_Not started._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
