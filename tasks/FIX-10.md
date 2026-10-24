---
id: FIX-10
title: Calls to WAWU ID give up after a bounded time
owner: YOU
area: FIX
order: 191
priority: launch
repo: wawu-backend
type: setup
status: done
depends_on: []
decisions: []
passes: [V1, V2, V3]
artboards: []
---
# FIX-10 · Calls to WAWU ID give up after a bounded time

## Current state

As of 16 Oct 2026.
- **Status:** done (live on main; records pass OPS-R0, 17 Oct 2026). Checked once by an independent verifier (report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/FIX-10.md`): verdict merge, nothing medium or worse. Batch 3: stacked on `wmt/FIX-18` (this branch contains it); API types regenerated from backend `wmt/FIX-10` (4f52fac).
- **Branches:** backend `wmt/FIX-10` at ad2b3c0 (from main 56f94d0); mobile `wmt/FIX-10` carries this file and one SHARED-CHANGES row (FIX-10 #1). No migration, no contract change.
- **CI on ad2b3c0:** Branch checks run 38900973732 green (suite 3 of 3 shards, contract, baseline, deploy-test-in-sync, netns); Protected routes run 38900973513 green (253/253); Gates run 38900973587 red with the same 16 FAIL lines as main, none in the files this task touches.
- **Open findings:** blocker 0, high 0, medium 0. Lows: a lookup that times out reads as not found in two existence checks; redirect: 'error' is new on the four WAWU ID calls; no floor on WAWU_ID_READ_TIMEOUT_MS; one bound per lookup call, not per route. They are in tasks/SWEEP-APP.md with the report path.
- **Next:** the lead opens the backend pull request from the batch 3 head. Merge needs the SHARED-CHANGES row FIX-10 #1 approved (`src/common/**` is fenced).

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

- [x] With WAWU ID held, every Hub route that calls it answers within the bound, and the open sockets return to baseline.
- [x] With WAWU ID healthy, answers are unchanged (protected routes 253/253).

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/FIX-10.md](history/FIX-10.md).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
