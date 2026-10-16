---
id: FIX-34
title: The admin identity-holds spec scans an audit row without its own ids, so it stops failing at random
owner: YOU
area: FIX
order: 285
priority: after-launch
repo: wawu-backend
type: backend-endpoint
status: verifying
depends_on: []
decisions: []
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# FIX-34 · The admin identity-holds spec scans an audit row without its own ids, so it stops failing at random

## Current state

As of 16 Oct 2026.
- **Status:** verifying. Builder done; backend `wmt/FIX-34` (one spec file, no product code).
- **Next:** a verifier checks the branch against the Capability checks below.
- **Id and order:** filed after-launch at order 285, the way FIX-33 (order 284) is.
- **History:** none yet.

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`
- The FIX-33 builder report (the second flake found on its CI run, 16 Oct)

## Goal

`src/admin/identity-holds/tests/admin-identity-holds.contract.spec.ts` stops failing at random. It scans the audit row (line 200) and the response (line 188) with `/\d{11}|bvn/i` to prove no BVN leaks, but a random uuid (the admin id, the holder id, the row id) sometimes holds 11 decimal digits in a row, so the scan matched an id and failed about 1 run in 100.

## Scope (the spec only; no product file, gate or baseline)

A helper, `withoutKnownIds`, cuts the ids the test generated (the row's own uuid, the holder's, the admins', also inside an admin email) out of the text before the scan, leaving a marker so the text either side cannot join into a run. The patterns are unchanged. One new case in the file proves the scan on a fixed row: the old scan trips on an id with 11 digits, the new one does not, and a planted 11-digit number or the word bvn in any other field (or in an id field in place of the id) still trips it.

## Capability checks

- [ ] On a scratch copy of the spec with every generated id ending in 11 decimal digits, the old scan fails (lines 188 and 200) and the changed spec passes.
- [ ] On a scratch copy that plants `22212345678` in the audit row's `detail`, and another that plants a `bvn` key, the changed spec fails at the audit-row scan.
- [ ] The changed spec passes 10 runs in a row.
- [ ] No pattern, assertion, route or product file changed (`git diff` is one file: the helper, the two scan lines, one new case).
- [ ] Backend `tsc --noEmit` and eslint on the file exit 0; CI gates show the same FAIL lines as main.

## Builder report

Sonnet builder. Backend `wmt/FIX-34` `2bf6e97`, from main `3797fb2`. One file.
- **Red:** with every generated id ending in 11 decimal digits (`00000000-0000-4000-8000-f43762817260` and the like), the unchanged spec fails 2 tests on the response scan (line 188, `Expected pattern: not /bvn|hash|released:|\d{11}/i`); with only that line fixed, the audit-row scan (line 200) fails the same 2 tests.
- **Green:** the same ids with the changed spec: 12 of 12 pass. Planting `22212345678` in the audit row's `detail` fails the audit-row scan (2 tests, the planted value shown in the received text); planting a `bvn` key fails it the same way. The spec ran 10 times in a row on the local stack `fix_34`, each 12 of 12, EXIT 0; the stack is down and its database dropped.
- **Checks:** `tsc --noEmit` EXIT 0; eslint on the file EXIT 0; prettier check clean.
- **CI on `2bf6e97`:** all 3 suite shards, netns, contract, deploy-test-in-sync, the baseline check and the protected route suite green. Executable gates red with the same 18 FAIL lines as on main (`gates run: 1249 files scanned, 16 fail`, identical on `3797fb2`).

## Verifier report

_Not started._

## Owner sign-off

_Owner: date._
