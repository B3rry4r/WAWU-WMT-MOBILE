---
id: FIX-12
title: Ticket price edits: the follow-ups from EVENTS-11
owner: YOU
area: FIX
order: 193
priority: launch
repo: wawu-backend
type: backend-endpoint
status: todo
depends_on: [EVENTS-11]
decisions: [R-40]
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# FIX-12 · Ticket price edits: the follow-ups from EVENTS-11

## Read first

- `docs/WORKFLOW.md` (the rules every task follows; section 4, fenced files)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `tasks/EVENTS-11.md` (round 5 verifier: O7, O8; and the note on a host-cancelled event)

## Goal

EVENTS-11 passed with three follow-ups: spec gaps R7, R8 and R10 (O7); a 409 for a duplicate tier name that names the tier twice (O8); and PATCH accepted on an event its host cancelled.

## Scope

Specs for R7, R8 and R10; the 409 names the tier once; PATCH on a host-cancelled event is refused with a clear 409 (and the price-edit route the same). No other answer changes.

## Capability checks

- [ ] Each O7 spec fails on a mutant of the rule it covers.
- [ ] The duplicate-name 409 reads naturally, naming the tier once.
- [ ] PATCH and the price edit on a host-cancelled event answer 409; on a live event they work as today.

## Builder report

_Not started._

## Verifier report

_Not started._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
