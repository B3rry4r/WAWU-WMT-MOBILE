# FIX-18 verifier report (16 Oct 2026)
Verdict: merge. Backend wmt/FIX-18 0841821 (base 56f94d0) vs main 22bb2cc; mobile 6a4d67d docs only.

Live runs (stack fix_18, ports 7080-7083, branch Hub then main Hub, same 145-request script, raw HTTP, distinct X-Forwarded-For):
- 0 answers of 500 on the branch; 44 on main (35 history, 9 download incl. HEAD). All 44 now 400/404 with the builder's bodies.
- 101 other answers identical in status, content type, headers and body (66 history 200s identical row sets, genuine download 200 identical, pending/deleted/expired/tampered 404 identical, no-auth 401 identical).
- Download repeated token (a&b, good&good, good&junk, junk&good, good&empty, empty&good, x3, 22 tokens): 404 with the same 81-byte body as any failed link.
- 8 raw-socket variants x3 (xff + body bytes, chunk garbage, short content-length, on health, wallet/history, download): Hub log 0 toLowerCase / 0 TypeError on branch; main 30 toLowerCase, 15 TypeError.
- Fractions (1.5, 0.5, -0.5, -1.5) answer 200 on both (lead's ruling, not reported).
- Checks: tsc EXIT 0; eslint on 7 changed files EXIT 0; wallet-history-take.spec + wallet.contract + hub-rate-limits 44 pass; data-export.contract 17/17 on branch, 16/16 on main (needs seeded DB + the mock's service key + ADMIN_JWT_SECRET, set up by me); CI: protected routes 253 passed of 253, contract, baseline, netns green.

Findings
1. LOW, test robustness, not this branch. src/nuvion/tests/nuvion-opening.contract.spec.ts:2754 `addr = () => 203.0.113.${randomInt(1,250)}`; the file sets 4 tries per address per hour (stored in BvnCheckAttempt), and the block's 5 draws (2761, 2774, 2780, 2793, 2847) share 249 values: any two equal and the later test gets 429 "expected 200 got 429" (CI shard 1: line 2850, 'the view says so too'). Odds per run about 3.9% for the block (1.5% for that test). Nothing FIX-18 changes is on that path (isLoopbackAddress differs only for a non-string address). Reproduce: on main, set line 2754 to a constant address and run `-t "round 3: at most 10 opening tries"`: 3 failed, the same 429. Under load: branch 5/5 pass, main 5/5 pass (365 tests each). Fix for the sweep list: draw distinct addresses (counter or shuffle).
2. INFO, pre-existing: the CI job "Executable gates" is red on this branch, and identical on main 22bb2cc and base 56f94d0 (same 18 FAIL lines, none in FIX-18 files, mostly Flutterwave/R-1 items). Not this branch.
3. Disclosure: I ran one `git checkout -q -- <spec>` in my own detached diagnostic worktree to undo my temporary edit (the rules forbid it). Worktree removed after; no branch or product file affected.

Cleanup: stack down (ports 7080-7087 free, db dropped), worktrees v-fix-18-br and v-fix-18-main removed. Scratch: /tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/fix-18-v/ (logs, out-br.jsonl, out-main.jsonl, s/attack.mjs).
