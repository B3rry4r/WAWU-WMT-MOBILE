---
id: FIX-27
title: The schools list pages the same way on every database, so no school is skipped
owner: YOU
area: FIX
order: 169
priority: launch
repo: wawu-backend
type: backend-endpoint
status: todo
depends_on: [SCHOOLS-04]
decisions: []
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# FIX-27 · The schools list pages the same way on every database, so no school is skipped

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`
- `tasks/SCHOOLS-04.md` (its D2: a cursor for every name the admin accepts) and the backend's `src/schools/` cursor code
- The backend's `.github/workflows/deploy.yml` (the Test job runs the full jest suite on a `postgres:16` container before every deploy)

## Goal

Backend main dc3baa2 (the SCHOOLS-04 merge, 8 Oct 2026 22:09 UTC) failed its pre-deploy Test job, so production was not updated and stays on d92e998. One suite failed, `src/schools/tests/schools-admin-written.contract.spec.ts`, 2 tests (5719 others passed):
- "a walk at limit 1 passes both longest names and reaches the school after each": the longest name came after its neighbour (`indexOf` 1, expected before).
- "the name in a cursor may be as long as the admin allows, and no longer": the page after the cursor held no school where `units-next` was expected.

Both pass on the build machine. The likely cause is collation: CI's `postgres:16` image sorts text by `en_US.utf8`, the build machine's databases do not, and the cursor's comparison and the list's order disagree under one of them. If production's database sorts like CI's, a person paging the schools directory can miss schools. Find the real cause first; do not assume this one.

## Scope

- Reproduce the failure locally on a database that sorts as CI's does (a database created with the CI image's locale, or an ICU collation that gives the same order; say which and show it fails on main dc3baa2 before any change).
- Fix the code so the order and the cursor agree on every collation (for example one explicit collation for both the `ORDER BY` and the cursor comparison), not by changing the test's expectations. The order people see must stay sensible (state what changes, if anything, for ordinary names).
- Find any other cursor-paged list ordered by text with the same weakness (`grep` the backend for cursor code ordered by a name or title); fix them the same way or list each in the report with why it is safe.
- The full jest suite and the protected suite pass on both kinds of database.

## Capability checks

- [ ] On a database that sorts as CI's, a person paging the schools directory one at a time sees every school exactly once, in the same order as one big page.
- [ ] The two failing tests pass on that database and on the build machine's, unchanged in what they assert.
- [ ] Protected suite 253/253; full suite green on both databases.

## Builder report

_Not started._

## Verifier report

_Not started._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
