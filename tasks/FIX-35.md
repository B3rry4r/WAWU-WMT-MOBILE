---
id: FIX-35
title: The documents spec checks the temporary folder only for what could be a document, so it stops failing at random
owner: YOU
area: FIX
order: 286
priority: after-launch
repo: wawu-backend
type: backend-endpoint
status: verifying
depends_on: []
decisions: []
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# FIX-35 · The documents spec checks the temporary folder only for what could be a document, so it stops failing at random

## Current state

As of 16 Oct 2026.
- **Status:** verifying. Builder done; backend `wmt/FIX-35` (one spec file, no product code).
- **Next:** a verifier checks the branch against the Capability checks below.
- **Id and order:** filed after-launch at order 286, the way FIX-34 (order 285) is.
- **History:** none yet.

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`
- The FIX-34 task file (the same kind of fix: a spec that failed for a reason outside the code)

## Goal

`src/nuvion/tests/nuvion-documents.contract.spec.ts`, the case "WAWU keeps no document content", stops failing at random. It compared the whole `os.tmpdir()` listing before and after the run (line 3292 on main `3797fb2`), so on a GitHub runner, where other processes create and remove entries in that folder (seen 16 Oct on `wmt/EVENTS-11` `a4b61fa`, shard 1: `runc-process982506495` vanished), it failed with nothing of ours changed.

## Scope (the spec only; no product file, gate or baseline)

The listing compare is replaced by `tmpEntriesHolding(before, needles)`: an entry that was not there at the start of the file and whose name or bytes (a regular file, or inside a folder, up to four levels) hold one of the file's markers, or the base64 or hex of one, is a hit. The case expects no hits. The needles are the ones the case already builds. A socket, a pipe, an entry that cannot be read or that vanishes while it is read is somebody else's and is skipped. Nothing else in the file changes.

## Capability checks

- [ ] On a scratch copy that writes the uploaded document to `os.tmpdir()` in the service, the case fails and names the written file.
- [ ] With another process creating and removing entries in the temporary folder during the run, and one entry left there, the changed spec passes and the unchanged spec (main's) fails the same case.
- [ ] The changed spec passes 10 runs in a row.
- [ ] `git diff` is one file: the helper, one import, the snapshot line and the one assertion.
- [ ] Backend `tsc --noEmit` and eslint on the file exit 0; CI gates show the same FAIL lines as main.

## Builder report

Sonnet builder. Backend `wmt/FIX-35` `0d5acda`, from main `3797fb2`. One file.
- **Red (the fix still catches a write):** a write of the uploaded front image to `os.tmpdir()` planted in `documents.service.ts` (a scratch edit, put back from a saved copy; `git status` showed only the spec afterwards) fails the case: `Expected: []`, `Received: ["planted-...bin", "planted-...bin"]` (the two uploads of the run that reached the planted line).
- **Red (the defect, before):** main's spec with another process creating and removing entries in the temporary folder during the run (a loop making `runc-process-*` folders and `*.log` files and leaving one file) fails the case on the listing compare (`fix35-other-21.log` in the before list, `fix35-other-29.log` in the after list, the kept file in both).
- **Green:** the changed spec with the same churn running throughout passes, and passes alone with none. 10 runs in a row green (130 of 130 tests each) on the local stack `fix_35` with the churn running for all ten.
- **Checks:** `tsc --noEmit` EXIT 0; eslint on the file EXIT 0; prettier check clean.
- **CI on `0d5acda`:** all 3 suite shards, netns, contract, deploy-test-in-sync, the baseline check and the protected route suite green. Executable gates red with the same 16 FAIL lines as on main (`gates run: 1249 files scanned, 16 fail`, the same as `3797fb2`; none in this spec).

## Verifier report

_Not started._

## Owner sign-off

_Owner: date._
