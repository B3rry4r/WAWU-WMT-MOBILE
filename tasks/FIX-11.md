---
id: FIX-11
title: The legal thread's opener is written once, metered and locked
owner: YOU
area: FIX
order: 192
priority: launch
repo: wawu-backend
type: backend-endpoint
status: todo
depends_on: [LEGAL-01]
decisions: []
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# FIX-11 · The legal thread's opener is written once, metered and locked

## Read first

- `docs/WORKFLOW.md` (the rules every task follows; section 4, fenced files)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `tasks/LEGAL-01.md` (round 5 verifier: Finding 1)

## Goal

`getThread` writes the assistant's opener with an AI call that is neither metered nor locked: 20 parallel reads of an empty paid thread made 19 AI calls (main 11). Reading a thread must never multiply paid AI calls.

## Scope

The opener is written at most once per thread under a lock (or written at creation), and its AI call is metered like every other. Parallel reads see one opener. No change to the thread's other answers.

## Capability checks

- [ ] 20 parallel reads of an empty thread make exactly 1 AI call (stand the AI client in at its seam; never a real provider).
- [ ] The opener's call is metered like the others.
- [ ] Protected routes 253/253.

## Builder report

_Not started._

## Verifier report

_Not started._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
