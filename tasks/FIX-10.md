---
id: FIX-10
title: Calls to WAWU ID give up after a bounded time
owner: YOU
area: FIX
order: 191
priority: launch
repo: wawu-backend
type: setup
status: todo
depends_on: []
decisions: []
passes: [V1, V2, V3]
artboards: []
---
# FIX-10 · Calls to WAWU ID give up after a bounded time

## Current state

As of 16 Oct 2026.
- **Status:** todo. No branch, no code, nothing merged, no findings.
- **Next:** a builder starts from the brief below. Dependencies done; ready to schedule.
- **History:** none yet. Reports go to tasks/history/FIX-10.md.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows; section 4, fenced files)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `tasks/ME-11.md` (round 2: the owner lookup bounded at 2 s, and the note that sockets stay held)
- wawu-backend's `WawuIdClient`

## Goal

When WAWU ID stalls, every Hub request waiting on it holds a socket until WAWU ID answers. ME-11 bounded its own lookup at 2 s, but the client itself has no abort, so the chat, professionals and other callers still wait without limit.

## Scope

`WawuIdClient` aborts each call after a bounded time (an `AbortController`, the bound in one constant, a sensible default per call kind) and frees the socket; callers get a typed timeout they already map to a clear answer. No route's normal answers change.

## Capability checks

- [ ] With WAWU ID held, every Hub route that calls it answers within the bound, and the open sockets return to baseline.
- [ ] With WAWU ID healthy, answers are unchanged (protected routes 253/253).

## Builder report

_Not started._

## Verifier report

_Not started._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
