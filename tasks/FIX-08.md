---
id: FIX-08
title: A request body over the size limit answers 413, not 500
owner: YOU
area: FIX
order: 188
priority: launch
repo: wawu-backend
type: setup
status: todo
depends_on: []
decisions: []
passes: [V1, V2, V3]
artboards: []
---
# FIX-08 · A request body over the size limit answers 413, not 500

## Read first

- `docs/WORKFLOW.md` (the rules every task follows; section 4, fenced files)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- wawu-backend's global exception filter (`AllExceptionsFilter`) and the body parser config in `src/main.ts`

## Goal

A body over 100 kB answers 500 on every route, because the global exception filter turns the body parser's `PayloadTooLargeError` into a 500. Seen by the SCHOOLS-02 and LEGAL-01 verifiers. It is the caller's error: 413, with the same error shape as other 4xx answers.

## Scope

Map the body parser's size error (and its other client errors: bad JSON, bad encoding) to their 4xx status in the filter. The limit itself does not change. Every route's other answers stay the same.

## Capability checks

- [ ] A 101 kB JSON body answers 413 on a public route, a signed-in route and an admin route.
- [ ] Malformed JSON answers 400, as it does today (say what it does today first).
- [ ] Protected routes 253/253.

## Builder report

_Not started._

## Verifier report

_Not started._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
