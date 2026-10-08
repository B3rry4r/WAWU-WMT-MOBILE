---
id: FIX-07
title: Search answers 400, not 500, for a NUL in the query
owner: YOU
area: FIX
order: 188
priority: launch
repo: wawu-backend
type: backend-endpoint
status: todo
depends_on: []
decisions: []
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# FIX-07 · Search answers 400, not 500, for a NUL in the query

## Read first

- `docs/WORKFLOW.md` (the rules every task follows; section 4, fenced files)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `tasks/SCHOOLS-04.md` (both verifier reports: `GET /search?q=%00`)

## Goal

`GET /search?q=%00` answers 500 on the tabs all, content and creators, on main and every branch (Postgres refuses a NUL in a text parameter). `tab=schools` already answers 400. A bad query is the caller's fault and gets a 400 naming `q`, never a 500.

## Scope

Refuse a `q` with a NUL (and any other character Postgres cannot take in text) with 400 naming `q` on every `/search` tab and on suggestions, before the query runs. `/search` is a protected route: every answer that is not a 500 today stays byte-identical, and the protected suite's lock changes only if it captured the 500 (then the PR needs the relock-approved label).

## Capability checks

- [ ] `q=%00`, `q=a%00b` and a lone surrogate answer 400 naming `q` on every tab.
- [ ] Every other `/search` answer is byte-identical to main on the same data (a recorded sweep).
- [ ] Protected routes 253/253.

## Builder report

_Not started._

## Verifier report

_Not started._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
