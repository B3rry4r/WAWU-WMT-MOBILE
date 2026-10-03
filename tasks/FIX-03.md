---
id: FIX-03
title: The PIN reset spec's leak scan never matches by chance (backend main's deploy)
owner: YOU
area: FIX
order: 105
priority: launch
repo: wawu-backend
type: setup
status: verifying
depends_on: [MONEY-14]
decisions: [R-25]
passes: [V1, V2, V3]
artboards: []
---
# FIX-03 · The PIN reset spec's leak scan never matches by chance (backend main's deploy)

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `tasks/MONEY-14.md` (the PIN reset and its contract spec, `src/money/pin/tests/pin-reset.contract.spec.ts`)
- `tasks/FIX-02.md` (the same kind of fix: a deploy-blocking spec made reliable, never by a retry or a looser check)

## Goal

Backend main `48b9043` (MONEY-14, PR #43) carries a spec that fails now and then: "nothing secret leaves the
server" in `pin-reset.contract.spec.ts` scans every log line, answer and stored column for the codes and PINs the
file sent, and once in a full-suite run (MONEY-15 round-2 verifier) it found one that nothing had leaked. It passed
3 of 3 alone. The deploy workflow runs the whole suite, so a chance failure stops a production deploy.

## Scope

Test files only: the spec and its harness (`test/money/pin-approval-harness.ts`). No product code, route,
contract, schema or config. Reproduce first and name the cause; then make the scan unable to match by chance
without making it weaker: it must still fail when the code or a PIN is really logged or answered.

## Capability checks

- [ ] The failure is reproduced and what matched is named.
- [ ] The spec passes 100 times in a row, and the whole contract suite passes on a fresh migrated database.
- [ ] A real leak still fails it: the service made to log the code, and made to log a PIN, each fail the scan.

## Builder report

Builder, 3 Oct 2026. wawu-backend `wmt/FIX-03` `86b740e` (fix `10b27d1` on main `48b9043`, then backend main `ad1e515` (MONEY-15) merged in); mobile `wmt/FIX-03` with main `8a58a67` (MONEY-15) merged in.
- **Cause, reproduced:** the scan looked for every PIN the file typed as a digit run in logs, answers and columns. The app masks a phone to its last four digits (`sentTo: "+234 *** *** 1590"`), and the test people's phones are random, so now and then one ended in one of the file's fixed PINs. Instrumented loops (a debug writer, not committed) caught it twice, both the same way: idle, 1 failure in 30 runs (`1590` in a `PinResetView` answer); under 6 busy-loop burners (load 5 to 9), 1 failure by run 18 of 30 (`3434`, same place). The durations da76d13 masked were not the cause this time; that mask stays.
- **Fix (test files only):** `test/money/pin-approval-harness.ts`: `reservePins(n)` draws `n` distinct random four-digit PINs per run (no round hundreds, no 1900 to 2100) and reserves them; every phone (`newPhone`), BVN and NIN the harness makes is redrawn until its last four digits are not a reserved PIN. `pin-reset.contract.spec.ts`: every PIN it types comes from that pool (`pin()`), the wrong PINs included, which the scan now also covers; the junk code in the format test is random. The scan itself is unchanged: same corpus, same digit boundaries, same masks for ids, times, durations, hosts and process ids. So a PIN can only be found where it was written, and a 6-digit code cannot match a 4-digit mask.
- **Still catches a real leak (each run once, then restored from a copy):** the reset service logging the code (`logger.log`), the service logging the new PIN (`logger.debug`), and the PIN guard printing the typed PIN (`console.warn`) each fail exactly "nothing secret leaves the server" (1 failed, 20 passed).
- **Proof:** the spec passes 100 times in a row: runs 1 to 70 at the machine's own load (2.7 to 7.5, other agents working), runs 71 to 100 with 6 burners (load 8.4 to 8.8), their PIDs recorded and killed. 10 more passes after merging backend main. Full `npx jest --runInBand --forceExit` on a fresh migrated, seeded `fx03_full_test`, my mock on :4001 (`lsof` free first, stopped after): 128 suites, 3,097 passed, 3 skipped, 0 failed. Money specs after the merge: 25 suites, 678 passed.
- **Checks:** tsc 0; eslint 0 on both files; protected `run.sh --fresh` 253/253 (244 required), lock untouched; gates 16 fail / 12 warn / 76 accepted, as main; tripwire 0 added lines; key scan 0 hits; no Fintava call. Mobile `npm run check` exit 0 after merging main (typecheck, lint, jest 21 suites 377 tests, gates 0 fail on 98 files, 204 tasks).
- **Defaults (agent), owner may override:** type `setup` (as FIX-02; `test-fix` is not a type the task checker knows, and `scripts/**` is fenced); order 105, right after MONEY-14 (the checker refuses a task ordered before its dependency, so "just after FIX-02" at 81 was not possible), and every task from 105 moved down one (99 files; the checker does not renumber, as at FIX-01).
- **Notes:** the container restarted twice during the work. After the first restart my six burners were still running and were killed by their recorded PIDs. After the second, Postgres was down; I started it with `pg_ctlcluster 16 main start`, which removed a stale pid file. The backend merge commit `86b740e` was pushed with git's default message, so it has no trailers.
- **NOT RUN:** the deploy workflow's own run (unblocked by the pull request's CI). V2 and V3 are the verifier's.

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md)._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
