# FIX-45 verifier report (17 Oct 2026)

Verdict: fix (one medium, three low). Backend wmt/FIX-45 153a36e on main a5e48fc; mobile a3f88be.

## Findings
1. MEDIUM. src/money/pin/tests/pin-request-key.contract.spec.ts:593 (reset-confirm test): the reset-code scan was changed from
   `JSON.stringify(row)` to `scannable(row)`, which blanks any `hmac-sha256:v1:<64 hex>`. The next line only checks the prefix
   (`toMatch(/^hmac-sha256:v1:/)`), and the closing "nothing secret" test does not select `fingerprint`. So a reset code in clear in a
   shape-valid fingerprint now passes. Plant (fingerprint = prefix + code + 58 hex): main's spec fails `not.toContain(code)`, the branch passes.
   Not needed: the builder's own figure for the reset code is 0.00033% (a 6-digit code). Fix: keep `JSON.stringify(row)` for that line, or add
   `expect(row.fingerprint).not.toContain(reset.code)`.
2. LOW. tasks/FIX-45.md Builder report says the new case "sends 12". The code sends 3 * (2 + 1) = 9 (publishing-gate.contract.spec.ts:~521).
3. LOW. Both burst sizes follow STORAGE_LOCK_WAITERS_PER_PERSON. Set it to 0 and the first case sends one publish and no longer races.
   An `expect(together).toBeGreaterThan(1)` would keep it honest.
4. LOW (info). The 9-way case is mostly refused by the queue: 429 count per run 3 to 6 of 9 (18 of 30 runs had only two 402s). It proves
   "one place, one 201, count unchanged"; the 402 path is proven by the 3-burst. Not a hole.

## Checks (all in worktrees v-fix-45-*, removed; stack fix_45 down; nothing listening on 7520-7527; extra DBs dropped)
- Diff main..head: two spec files only (+80 -7); no product, harness, gate or baseline file. Order 294 unique; area FIX (40 tasks) and priority launch accepted. Mobile `check_tasks.py` EXIT 0 (331 tasks).
- CI on 153a36e: 3 suite shards, contract, protected routes, baseline, netns, deploy-test-in-sync green. "Executable gates" red with the same 5 FAIL lines as on main a5e48fc (admin-notifications.controller:40, compose-campaign.dto:44, content-piece.service:62, notification-event:496, flutterwave-wallet.gateway:72), so pre-existing.
- tsc --noEmit EXIT 0; eslint --no-fix on both files EXIT 0; prettier --check clean.
- 30 full runs in a row: pin-request-key 30/30 (43 of 43 each); publishing-gate 30/30 (62 of 62 each; the gate loop ran under extra load from my other jobs).
- PIN plants on the branch (30-iteration forced and plant specs, scratch copies): PIN in the answer, route, state, resourceId, fingerprint prefix,
  in clear in a shape-valid fingerprint (prefix and suffix), the old PIN in the fingerprint, and in a log line: each FAILS. PIN as one UUID group
  passes (the intended collision). Force-PIN-into-fingerprint on even first digit: main 17 of 30 iterations fail on `not "<PIN>"`; branch 30 of 30 pass.
  Forced on every PIN: the helper throws "the fingerprint carries the PIN".
- Burst flake on main with a 12-request warm-up: main's 4-burst fails 30 of 30 with [201,402,402,429]; branch's two cases pass 60 of 60 under the same warm-up.
- Real race (scratch mutations of product code): queue off, atomic claim intact: 9 parallel give [201, 402 x8] 30 of 30, no 429, limit holds.
  Queue off + non-atomic claim: still one 201 (the storage advisory lock still serialises). Queue, advisory lock and atomic claim all off: branch fails 60 of 60
  (nine 201s), main's 4-burst fails 30 of 30, so the branch detects a lost limit as well as main did. Queue on with lock and claim off: both pass (the queue masks it; same as before the change).
- Sibling concurrent tests in the same file (3 draft taps, 6 deletes, 6 resubmits, 2 publishes) stay within the queue or do not use it; no latent twin of the flake found.
