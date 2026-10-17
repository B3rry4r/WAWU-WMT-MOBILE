# FIX-13 verifier report (wawu-id wmt/FIX-13 7d25c1c, mobile record 7cf93ec)

Verdict: merge. Nothing medium or worse.

## Checks (all against the stack fix_13: real wawu-id from the branch, local Postgres; logs in scratchpad/fix-13-v/logs)
- CI on 7d25c1c: build, deploy-build-in-sync, gates, baseline all success. wawu-id CI runs no unit tests and no lint.
- Auth suites on the branch (7 suites, --testTimeout=120000): 115 of 115 passed (jest-auth.log).
- New spec refresh-sweep-failure.spec.ts copied onto main's tokens.service.ts (81e5e05): 5 of 10 fail, so the spec catches the old bug (mutant-main-spec.log).
- AUTH-08 lookup spec (the F-3 line, now state not time): 11 runs in a row, 20 of 20 each, load 11 to 16 (lookup-runs.log).
- Live attack (attack.mjs) with a Postgres trigger that refuses deletes of expired rows:
  - branch: sign-in 200; refresh 200 with a new token; old row gone and new row stored (rotation not undone); old token 401; new token refreshes again; sign-out 200 and the token dies; "Could not prune" logged; second sign-in 200; after the trigger is dropped the next refresh takes the 7-row backlog. All PASS (attack1.log).
  - two refreshes of one token at once, 6 rounds of 2 and 12, trigger off and on: exactly one 200, the rest 401, row count unchanged, winner's token works. Refresh racing sign-out, 8 races: at most one rotation. Ten devices rotating at once under the trigger: all 200, live rows still 10. A sweep that sleeps 3 s then fails: both refreshes 200 (3.6 s and 6.7 s, no lock held through the sweep).
  - same script on main (81e5e05): refresh 500 under the trigger, and every parallel round 500 (attack-main.log). So the attack bites and the branch fixes it.
- contract:build on the branch: contract/openapi.json byte-identical (git status clean). Diff touches only tokens.service.ts and two specs; no route, schema or migration change.
- tsc --noEmit clean. eslint on the three files: the same 8 errors on main and on the branch, all in code this change did not write (lines 168-190, 390 on main). Not a regression.

## Findings
1. low (F-4 grade): a pre-change (null-jti) token costs one argon2 check per unexpired null-jti row of that account, 0.4 to 0.5 s each here at load 15. Measured last in the scan: 10 rows 5.0 s, 30 rows 13.8 s; a refusal scans all rows (10 rows 4.4 s, 30 rows 12.6 s); a new-style token beside the same rows 1.3 s, unaffected. Linear, so 200 rows is the 41.7 s class. Not a live risk worth its own task: only rows made before AUTH-08 (merged 7 Oct) count, none are added any more, all expire by 6 Nov at the latest (30 days after the deploy), an account holds one row per signed-in device, and a refusal scan needs a validly signed old token. Unknown and not checkable here: the production count of unexpired null-jti rows per account (query is in tasks/AUTH-08.md). If the owner wants a number first, run that query once; no code task.
2. low: the post-commit sweep is awaited, so a sweep that hangs delays the 200 (3 s sleep gave 3.6 s). Same cost as before the change (it was inside the transaction); fire-and-forget would remove it. Sweep list, no round.
3. low (pre-existing, not this change): eslint reports 8 errors in tokens.service.ts on main and branch; wawu-id CI does not lint.

## Cleanup
Stack fix_13 down, databases dropped, worktrees v-fix-13-be, v-fix-13-id, v-fix-13-idmain removed, nothing of mine listening on 7160-7167.
