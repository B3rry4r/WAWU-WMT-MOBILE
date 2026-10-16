---
id: FIX-18
title: Three small 500s: wallet history paging, a repeated export token, a request whose socket has gone
owner: YOU
area: FIX
order: 222
priority: launch
repo: wawu-backend
type: backend-endpoint
status: todo
depends_on: [FIX-08]
decisions: []
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# FIX-18 · Three small 500s: wallet history paging, a repeated export token, a request whose socket has gone

## Current state

As of 16 Oct 2026.
- **Status:** todo. No branch, no code, nothing merged, no findings.
- **Next:** a builder starts from the brief below. Dependencies done; ready to schedule.
- **History:** none yet. Reports go to tasks/history/FIX-18.md.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows; section 4, fenced files)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `tasks/FIX-17.md` ("Findings, for a follow-up") and `tasks/FIX-08.md` (verifier note O2)

## Goal

Verifiers found three requests that answer 500 on main, each outside the task that found it:
- `GET /wallet/history?take=<not a number>` (and `take` sent twice): the controller passes `Number(take)` (NaN) to Prisma's `take`.
- `GET /settings/privacy/export/download?token=a&token=b` (a repeated `token`): an array reaches `verifyExportLink`.
- When the socket is already gone before anything reads `req.ip` (a `GET` with an unframed body), `hubTrustProxy` calls `isLoopbackAddress(undefined)` and throws a TypeError, logged as a 500 (OPS-11's file).

## Scope

- `take` that is not a whole number, or sent twice, answers 400 naming `take`. Every answer that is not a 500 today stays byte-identical. `/wallet/history` is a protected route: if the lock captures any request this changes, stop and say so.
- A repeated or non-string `token` answers the route's own 404 for a failed link, the same bytes as any other failed link.
- An unknown socket address is treated as not loopback (never trusted) and never throws.
- No em-dashes in any new message.

## Capability checks

- [ ] Each of the three requests answers its 4xx, not 500 (specs and a live run).
- [ ] Clean requests to the two routes answer byte-identically to main.
- [ ] Protected routes 253/253 with the lock unchanged.

## Builder report

_Not started._

## Verifier report

_Not started._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
