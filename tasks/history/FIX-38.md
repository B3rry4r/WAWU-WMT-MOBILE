# FIX-38 · round history

Moved out of [tasks/FIX-38.md](../FIX-38.md) word for word, oldest first. The current state is in that file.

## Builder report

Sonnet builder. Backend `wmt/FIX-38` `ace6ec0`, from main `3797fb2`. One file.
- **Red (the fix still catches a leak):** on a scratch worktree, `transaction-pin.guard.ts` logged `checking pin ${pin}` before the check; the changed spec fails exactly the one case (1 failed, 34 passed) with `Expected: false`, `Received: true`.
- **Red (the defect, before):** with `wallet-transfer.service.ts` forced to build ids starting `e1397f65` (the failure output shows the reference on 56 lines), main's spec fails the case with `Expected substring: not "1397"` (1 failed, 34 passed); the changed spec on the same code passes (35 of 35).
- **Helper table:** 9 strings checked by hand: the observed reference, a UUID whose second group is `1397`, a stack frame and a duration are not hits; `wrong pin 1397`, `{"pin":"1397"}`, `x-transaction-pin: 1397`, `pin=1397.` and `pin check failed (1397)` are.
- **Green:** 10 runs in a row (35 of 35 each) on the local stack `fix_37` (down, database dropped). Of 403 log lines in a real run, the only digit runs left after the strip are fixed kobo amounts (205000, 203325, 5000, 3325).
- **Checks:** `tsc --noEmit` EXIT 0; eslint on the file EXIT 0; prettier check clean.
- **CI on `ace6ec0`:** suites 2 and 3, netns, contract, deploy-test-in-sync, the baseline check and the protected route suite green; `wallet-transfer.contract.spec.ts` passed in shard 3. Suite shard 1 is red on one case of another spec this branch does not touch: `nuvion-opening.contract.spec.ts`, "round 3: at most 10 opening tries an hour from one address (a setting) › the view says so too: canResubmit is false with the time the hour opens", got 429 instead of 200 at its line 2850 (4188 of 4189 passed); a flake of its own, to be filed and fixed by its own task. A re-run of the failed job is not allowed from here (403), and an empty commit is not allowed. Executable gates red with the same 16 FAIL count as on main and on `wmt/FIX-36` and `wmt/FIX-37` (none in this spec).

## Verifier report

_Not started._

