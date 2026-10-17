# FIX-33 verifier report (16 Oct 2026, Sonnet verifier)

Verdict: merge. Backend wmt/FIX-33 4e6c865 (code in 83d8db3), mobile f2d5c45. One spec file changed, no product code.

## Checks (stack fix_33, ports 7320-7327; logs in scratchpad/fix-33-v/logs/)
- Branch, -t "round 3": 89 passed, EXIT 0.
- Planted bug A (per-address limit raised by 6 in opening-attempts.ts, both the assertLeft count and the reservePlace count): round 3 gives 5 failed, 84 passed.
- Planted bug B (address count skipped: used = 0 in reservePlace, used >= 0 in addressOpensAt): round 3 gives 5 failed, 84 passed.
  Both fail the same 5 tests: 5th try is a 429, probes of held BVNs, burst learns at most the limit, IPv6 /64 is one place, canResubmit view. Product file restored by copy, git status clean.
- Old generator on main's spec, round 3 generator set to constant 203.0.113.5: 3 failed, 86 passed, each "expected 200 OK, got 429", including the "Another address is not affected" line.
- New generator, same constant draw: 4 failed, each "no unused test address left in the range" (the helper refuses a repeat, it does not hand one out).
- freshAddress extracted and run alone: 200 draws from 249 values, 0 duplicates; a 5-value range gives 5 distinct, the 6th draw throws. Old 5 draws collide 1 in 25 (any pair) in 200k trials.
- Whole file 5 runs in a row: 365 of 365 passed, EXIT 0 each time.
- tsc --noEmit EXIT 0; eslint (no --fix) on the file EXIT 0; prettier --check clean.
- Scope: git diff main...branch is one file (+31 -8); no assertion, limit, timing or range changed. The IPv6 test's "next block" line keeps its .expect(200).
- Gates: 16 fail, 107 warn, 76 accepted on the branch and on main 18ac5f9, identical FAIL lines. CI Executable gates is red on main (18ac5f9, 3797fb2) too.
- CI: 83d8db3 shard 2 red on admin-identity-holds line 200 (regex /\d{11}|bvn/i hits 11 digits of a random id), confirmed in the job log; the nuvion-opening spec passed there. 4e6c865 all green except the same gates.

## Findings
1. Low (rule breach, not undone): 4e6c865 is an empty commit pushed only to re-run CI; the rules forbid it.
2. Low, pre-existing, out of scope: src/admin/identity-holds/tests/admin-identity-holds.contract.spec.ts:200 flakes on a random id with 11 digits in a row. Needs its own task (strip ids before the scan). Sweep list.
3. Low: the helper's memory is per run. Rows left by an earlier run that died before afterAll stay for an hour and a fresh draw can still land on one (1 in 249 per draw against a few addresses). CI starts clean, so it only bites a reused local database.
4. Low: the helper comment says "about 1 run in 70"; any-pair collision of the 5 old draws is 1 in 25 (only some pairs fail a test). Wording only.

Cleanup: stack down (hub 31481, mock-id 31468 stopped, ports closed, database dropped); worktrees v-fix-33-be and v-fix-33-main removed; nothing pushed.
