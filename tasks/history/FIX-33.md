# FIX-33 · round history

Moved out of [tasks/FIX-33.md](../FIX-33.md) word for word, oldest first. The current state is in that file.

## Builder report

Sonnet builder. Backend `wmt/FIX-33` `83d8db3` (the change) and `4e6c865` (an empty commit to run CI again), from main `18ac5f9`. One file, +31 -8 lines.
- **Red:** on a scratch copy of the spec with `addr = () => "203.0.113.5"`, `-t "round 3"` gave 3 failed, 86 passed, each "expected 200 OK, got 429 Too Many Requests" (the 5th-try test, the held-BVN probes test and the canResubmit view test).
- **Green:** `-t "round 3"` 20 runs in a row, all EXIT 0, 89 passed each; the whole file once, EXIT 0, 365 of 365 passed. Run on the local stack `fix_29` (database `fix_29_wawu_hub_test`), stopped after.
- **Checks:** `tsc --noEmit` EXIT 0; eslint on the file EXIT 0 (after its own prettier fix); the gates give the same 18 FAIL lines on main and on the branch (`gates run: 1223 files scanned, 16 fail`).
- **CI on `83d8db3`:** 7 of 9 green. Shard 2 failed on another flake in a file this task does not touch: `admin-identity-holds.contract.spec.ts` line 200 scans an audit row with `/\d{11}|bvn/i` and a random admin id ended in `f43762817252` (11 decimal digits in a row). About 1 run in 100 for that file; it needs its own fix (strip the ids before the scan). The failed job could not be rerun with the token, so `4e6c865` runs the checks again: the three suite shards, netns, contract, deploy-test-in-sync, protected routes and baseline all green; Executable gates red with the same FAIL lines as main.
- **FIX-18 sweep row:** none exists on main (no sweep file names this flake), so there was no row to mark.

## Verifier report

_Not started._

