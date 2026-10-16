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
- **Status:** merging (lead). Checked once by an independent verifier (report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/FIX-34.md`): verdict merge, nothing medium or worse. Batch 4: stacked on `wmt/FIX-34` (this branch contains it); API types regenerated from backend `wmt/FIX-35` (8199f34).
- **Id and order:** filed after-launch at order 286, the way FIX-34 (order 285) is.
- **History:** none yet.
- **Open findings:** blocker 0, high 0, medium 0. Lows: 4 (a pre-existing parallel-request flake in the documents spec, a compressed copy the new check cannot see, an entry written into an existing folder, task text vs code on depth). They are in tasks/SWEEP-APP.md with the report path.
- **Next:** the lead opens one pull request per repo from the last batch 4 head, for the owner to merge after batch 3 (PR #138); then mobile sign-off.

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

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/FIX-35.md](history/FIX-35.md).

## Owner sign-off

_Owner: date._
