# FIX-37 · round history

Moved out of [tasks/FIX-37.md](../FIX-37.md) word for word, oldest first. The current state is in that file.

## Builder report

Sonnet builder. Backend `wmt/FIX-37` `cdffcae`, from main `3797fb2`. Two test files.
- **Red (the defect, before):** a small listener (`node hold.cjs 36000 38999`, 2974 ports held) running during a run of main's spec fails the shutdown case: `Error: listen EADDRINUSE: address already in use 0.0.0.0:38018` (1 failed, 11 passed, 1 skipped).
- **Green:** the changed spec with the same listener still running passes (12 passed, 1 skipped); the skipped case is the pooler one, which needs `pgbouncer` (not installed on this machine nor in CI), so `freePort()` is typechecked and linted but not run.
- **10 runs in a row:** the second loop passed 10 of 10 on the local stack `fix_37` with nothing else of mine running. A first loop had two red runs while I ran another spec on the same database: run 7 was `Too many database connections opened: sorry, too many clients already` (the machine's Postgres limit of 100, shared with other agents) and run 2 was the live feed answering 503 at the upgrade (its listener probe); neither was an address error.
- **Checks:** `tsc --noEmit` EXIT 0; eslint on both files EXIT 0; prettier check clean. The stack is down and its database dropped.
- **CI on `cdffcae`:** all 3 suite shards, netns, contract, deploy-test-in-sync, the baseline check and the protected route suite green. Executable gates red with the same 16 FAIL lines as on main (`files scanned: 1249, findings: 16 fail`; none in these files).

## Verifier report

_Not started._

