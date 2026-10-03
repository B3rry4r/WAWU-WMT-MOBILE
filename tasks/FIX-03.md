---
id: FIX-03
title: The PIN reset spec's leak scan never matches by chance (backend main's deploy)
owner: YOU
area: FIX
order: 105
priority: launch
repo: wawu-backend
type: setup
status: review
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

Verifier, 3 Oct 2026. Fresh session that wrote none of this. Detached worktrees `/home/user/wt/vfx03b` (wawu-backend `86b740e`: fix `10b27d1` on `48b9043`, main `ad1e515` merged in) and `/home/user/wt/vfx03m` (mobile `a83f922`). Databases `vfx03_*_test`, stand-in WAWU ID on :4926 for the loops and on :4001 only for the full suite (`lsof` free before, stopped right after). Every database is dropped and both mocks are stopped by their recorded PIDs. No Fintava, id.wawuafrica.com or api.wawuafrica.com call. Evidence: `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/vfx03/` (abbreviated `vfx03/` below).

**Verdict: no open defect. Status `review`.** The diff is test-only and loosens nothing. The cause was reproduced as the builder named it, and the fix removes it. No chance collision is left in the text the scan reads. Two required checks could not be run here: the 30 runs under burners and the key scan. Both are listed under NOT RUN with what unblocks them.

| Pass | Result | Evidence |
|------|--------|----------|
| V1 Gates | passed. Backend: `tsc --noEmit` exit 0; eslint 0 problems on both changed files; gates 16 fail / 12 warn / 76 accepted on 636 files, output byte-identical to main `ad1e515`. Mobile `npm run check` exit 0: 21 suites, 377 tests, gates 0 fail / 0 warn on 98 files, 204 tasks | `vfx03/tsc.log`, `eslint.log`, `gates-branch.log`, `gates-main.log`, `mobile-check.log` |
| V2 Contract | passed. Full suite as `deploy.yml` runs it (`npx jest --runInBand --forceExit`, fresh migrated and seeded `vfx03_full_test`, mock on :4001 with a keypair made as `deploy.yml` makes it): **130/130 suites, 3,144 passed, 3 skipped, 0 failed** (the reset spec ran 9th). The reset spec alone: **100 of 100 in a row** on `86b740e` | `vfx03/full.log`, `full-results.json`, `loop100/summary.txt` |
| V3 Regression | passed. `scripts/protected-routes/run.sh --fresh HEAD`: 253/253, all 244 required. The branch touches no lock, suite or registry file (lock checked against origin/main `a055b4f`, which has the same lock as `ad1e515`). CI tripwire: 0 added lines match | `vfx03/protected.log`, `backend-branch.diff` |

Focus checks:

1. **Only tests changed, nothing loosened.** `git diff 48b9043 10b27d1` and `git diff ad1e515...86b740e` are the same 2 files: the spec and `test/money/pin-approval-harness.ts`. No product file. The `expect(` count is 104 on both commits, `.expect(` 38 on both, `it(` 21 on both. Every changed `expect` line only swaps a literal PIN for a pool PIN; no status code or matcher changed. The scan block (from `describe('nothing secret leaves the server'` to the end) is byte-identical on both commits: same corpus (logs, answers, the same 5 columns of `transactionPinReset`), same `(^|\D)…(\D|$)` boundaries, same masks. The secret set grew: 56 values a run (37 PINs, 16 codes, 3 malformed inputs), and wrong PINs are now in it.
2. **The cause is real.** `48b9043`, spec looped at the machine's own load: **run 6 failed** (load 7.35) with leak `"7788"`. A dump of the scan's corpus (my instrumentation, not committed, restored from a copy) shows where: a `PinResetView` answer `"sentTo":"+234 *** *** 7788"`. `7788` is the fixed `newPin` on line 323 of the `48b9043` spec. A random phone tail equalled a fixed test PIN, as the builder said. No burners were running (see NOT RUN). Evidence `vfx03/repro/run-6.log`, `run-6.json`, `summary.txt`.
3. **The fix holds.**
   - 100 consecutive runs on `86b740e`: 100 passed, load 3.1 to 8.4 (3 runs at 8 or more), from other agents and my own suites, not from burners. `vfx03/loop100/summary.txt`.
   - The harness: `reservePins(40)` runs at module load, before any person exists. Every phone (`newPhone`, used by `person()`, `reissue`, and the shared-phone test), BVN and NIN goes through `unreserved()`, which redraws until the last four digits are not reserved. The spec builds no phone any other way. No fixed PIN is left in the spec or the harness: the only 4-digit literals are in comments. The remaining fixed secrets are the 6-digit wrong codes `000000`/`000001`/`999999`/`999998`. Per run 37 of the 40 reserved PINs are used, so a new `pin()` call beyond 3 throws instead of reusing one.
   - What the scan actually reads: I dumped the masked corpus from 12 runs alone, from the reset spec inside an instrumented full-suite run, after 11 boot, webhook and rate-limit suites in one band (spec last, ordered with a custom sequencer), after a failing suite, and from 10 runs on a local merge with the newest main. In all of them the only standalone 4- or 6-digit runs are the `sentTo` phone tails. The only other number of 4 to 6 digits is `retryAfterSeconds` (86338 or 86339). It is always 5 digits (24 h minus at most a few minutes of ageing), so it cannot match a 4-digit PIN or a 6-digit code. Ids, times, `ms` durations, hosts and pids are masked; amounts, account numbers and BVNs never reach this corpus. `vfx03/dump/`, `vfx03/merged/`, `vfx03/analyze2.py`.
   - **The lead's "1234" report (another agent, a 39-suite run on a shared database, before FIX-03).** On `48b9043`, `'1234'` was a fixed PIN typed 7 times in this spec. The match was most likely the same masked phone tail as above, though that agent's output was not available to confirm it. On the branch no fixed PIN remains. Other suites cannot reach the scanned text: rows are read only `where wawuUserId in t.users` (this file's own random people), answers are only this file's own responses, and the harness boots `MoneyModule` without `ScheduleModule`, so no sweep reads other rows. The log capture does take the whole process's stdout and stderr while the file runs. In every multi-suite run above, though, the spec's log held only its own 88 lines (96 on the merge), with no line from another suite.
4. **A real leak still fails it.** Each mutant was run once and then restored from a copy; `git status` was clean after each (`vfx03/mut/*.patch`, `*.log`):
   - M1, the reset service logs the code (`logger.log`): scan fails.
   - M2, the new PIN goes into the `pin_mismatch` error message: scan fails.
   - M3, `POST /reset` returns the code in its answer: scan fails (plus "asking again").
   - M4, the new PIN is stored in a scanned column (`sendState`): scan fails (plus the lockout test).
   - M6, `verify` prints the wrong PIN typed (`console.warn`): scan fails. The lockout test's wrong PIN is now itself a secret; on `48b9043` its `9999` was not.
   - M5, PINs stored unhashed everywhere: caught by `money-pin.contract.spec.ts` ("stored only as an argon2id hash").
   - M5b, only the reset path stores the new PIN unhashed in `TransactionPin.pinHash`: survives all five PIN specs (117 tests). See finding 1.
5. **Renumbering.** 99 task files changed, each by exactly one line, `order: N` to `N+1`, covering every task that was at order 105 or later on main `8a58a67`. FIX-03 is the only task at 105, right after MONEY-14 (104), and no order is duplicated. Every `depends_on` points to a lower order (my own check over 204 tasks, 0 violations). `check_tasks.py` exit 0. `check_tasks.py --write` on `a83f922` produces no diff, so INDEX and PROGRESS are as generated.

Findings:
- `unclear` (pre-existing since MONEY-14, not caused by FIX-03): **a reset that stores the new PIN unhashed is caught by no spec** (M5b, `vfx03/mut/M5b-reset-stores-new-pin-raw.patch`). Reproduction: in `pin-reset.service.ts` `confirm()`, set `const pinHash = dto.newPin;`, and in `transaction-pin.service.ts` `verify()` compare a non-argon2 `pinHash` with `===`. Result: `pin-reset`, `money-pin`, `device-approval`, `pin-reset-and-approval` and `transaction-pin` all pass, 117/117. The scan reads only `transactionPinReset` (the title says "any stored column but a hash"), and only `money-pin` checks `pinHash`, on the set path. The scan block and both PIN service files are byte-identical on `48b9043`, so the gap predates this task, and FIX-03's scope was "without making it weaker". The owner decides whether a test-only follow-up should assert, after a reset, that `transactionPin.pinHash` starts with `$argon2id$` and does not contain the new PIN.
- `note` **Both mains moved during verification.** Backend main is `c197d58` (WALLET-14 `a055b4f`, then SCHOOLS-01); mobile main is `0b83be8`.
  - Backend trial merge (local only): clean, with no overlap with FIX-03's files (`money.module.ts` gains routes only). The spec passed 10/10 on the merge, and its corpus still holds only `sentTo` tails (`vfx03/merged/`).
  - Mobile trial merge (local, aborted): it conflicts only in the generated `docs/PROGRESS.md`. Main's WALLET-14 keeps the branch's 117 and SCHOOLS-01 sits at 12. After `check_tasks.py --write`, `npm run check` exits 0 (377 tests, 204 tasks; `vfx03/mobile-check-trialmerge.log`).
  - WORKFLOW 8.3 applies before the pull request: merge main into `wmt/FIX-03` in both repos and regenerate.
- `note` The backend merge commit `86b740e` has no trailers (git's default message), as the builder reported.

NOT RUN:
- **30 of the 100 runs under burners at load 8 or more.** This session's permission check refused starting busy-loop burner processes, so none were started. The 100 runs ran at load 3.1 to 8.4, with 3 runs at 8 or more. Unblocked by a session allowed to start burners: loop the spec 30 times under them and record their PIDs.
- **Key scan (8-character windows of the Fintava key over both branch diffs).** This session's permission check refused reading the key file into the scan's environment, so the scan did not run. The diffs to scan are saved: `vfx03/backend-branch.diff`, `backend-fix.diff`, `mobile-branch.diff`. Unblocked by a session allowed to read `secrets/fintava.env` into the scan's environment (or the lead running the scan on those files).
- CI's own run of `wmt/FIX-03`. No pull request is open. Unblocked by opening it after merging main (the note above).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
