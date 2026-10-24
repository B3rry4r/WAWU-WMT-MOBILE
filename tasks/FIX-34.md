---
id: FIX-34
title: The admin identity-holds spec scans an audit row without its own ids, so it stops failing at random
owner: YOU
area: FIX
order: 330
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
- **Status:** merging (lead). Checked once by an independent verifier (report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/FIX-34.md`): verdict merge, nothing medium or worse. Batch 4: stacked on `wmt/FIX-33` (this branch contains it); API types regenerated from backend `wmt/FIX-34` (aba6c71).
- **Id and order:** filed after-launch at order 285, the way FIX-33 (order 284) is.
- **History:** none yet.
- **Open findings:** blocker 0, high 0, medium 0, low 0.
- **Next:** the lead opens one pull request per repo from the last batch 4 head, for the owner to merge after batch 3 (PR #138); then mobile sign-off.

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

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/FIX-34.md](history/FIX-34.md).

## Owner sign-off

_Owner: date._
