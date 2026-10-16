# FIX-34 · round history

Moved out of [tasks/FIX-34.md](../FIX-34.md) word for word, oldest first. The current state is in that file.

## Builder report

Sonnet builder. Backend `wmt/FIX-34` `2bf6e97`, from main `3797fb2`. One file.
- **Red:** with every generated id ending in 11 decimal digits (`00000000-0000-4000-8000-f43762817260` and the like), the unchanged spec fails 2 tests on the response scan (line 188, `Expected pattern: not /bvn|hash|released:|\d{11}/i`); with only that line fixed, the audit-row scan (line 200) fails the same 2 tests.
- **Green:** the same ids with the changed spec: 12 of 12 pass. Planting `22212345678` in the audit row's `detail` fails the audit-row scan (2 tests, the planted value shown in the received text); planting a `bvn` key fails it the same way. The spec ran 10 times in a row on the local stack `fix_34`, each 12 of 12, EXIT 0; the stack is down and its database dropped.
- **Checks:** `tsc --noEmit` EXIT 0; eslint on the file EXIT 0; prettier check clean.
- **CI on `2bf6e97`:** all 3 suite shards, netns, contract, deploy-test-in-sync, the baseline check and the protected route suite green. Executable gates red with the same 18 FAIL lines as on main (`gates run: 1249 files scanned, 16 fail`, identical on `3797fb2`).

## Verifier report

_Not started._

