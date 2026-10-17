# Verifier report: FIX-36, FIX-37, FIX-38 (three test-only tasks) - 16 Oct 2026

Verdict: merge for all three. Nothing medium or worse. Backend branches changed only spec/fixture files (a3fd7ce, cdffcae, ace6ec0); mobile branches only docs and the task file.
Method: detached worktrees v-fix-36-a/b/c on the three branches, stack fix_36 (7360-7369). Every plant restored by copy; each worktree ended with `git status` empty.

## FIX-36 (money-recipient.contract.spec.ts) - merge
- Plants in recipient.service.ts views(), case "a result has five fields...": bvnLast4 into avatarUrl fails on secret "qz4321xk"; ninLast4 into avatarUrl fails on "wj8765zq"; nested key `bvn` (inside tick, so the five-key check still passes) fails word "bvn"; nested `ninLast4` and `Nin` fail word "nin".
- Ids forced to start 4321 / 8765: changed spec 41 of 41 pass; main's spec fails on secret "4321" / "8765".
- Tag forced to hold "bvnnin": changed spec passes; main's spec fails on secret "bvn".
- 5 runs: 41 of 41 each, EXIT 0.
## FIX-37 (live-hardening spec + live-server.fixture.ts) - merge
- Listener holding 2982 of 36000-38999 on 127.0.0.1 (18 were held by others): main's shutdown case fails EADDRINUSE; changed spec 12 passed, 1 skipped (pooler), and 5 runs green while the listener was up.
- Shutdown case unchanged apart from where the port comes from (assertions identical in the diff). Mutations: goingAway 1001 -> 1000 fails "Expected 1001, Received 1000"; no stop signal handler fails "Received 1006".
- freePort() extracted and run 300 times: none in 36000-38999, all bindable after. pgbouncer is not installed, so the pooler case stays skipped; with a stub pgbouncer that only binds, the port from freePort() bound fine (34175); the case then failed at the 503 expectation because the stub is not a pooler (stub's limit, not the spec's).
- No orphan after passing runs (5 runs, fixture process count unchanged). Leftover PID 12437 (started 16:35, cwd /home/user/wt/bb-fix-37, deleted) is the builder's, from a failed run; not killed by me.
## FIX-38 (wallet-transfer.contract.spec.ts) - merge
- Helper table (exact function extracted): hits for pin 1397, pin=1397, "1397", PIN: 1397, {"pin":"1397"}, {"pin":1397}, x-transaction-pin: 1397, (1397), pin_1397, pin-1397, ?pin=1397; not hits for the e1397f65 reference, a UUID with 1397 group, spec.ts:1397:54, 1397 ms, 1397ms, +1397ms, 213970, 1397abcd.
- Planted in transaction-pin.guard.ts via the app logger, case fails (Expected false, Received true) for: `pin ${pin}`, `pin=${pin}`, `"${pin}"`, `PIN: ${pin}`, JSON.stringify({pin}), a sentence. Glued `pin${pin}` passes (the named gap).
- Reference forced to e1397f65...: changed spec 35 of 35; main's spec fails `not "1397"`.
- Real run's 403 log lines: after the strip only HTTP codes and fixed kobo amounts stand alone; no fractional durations.
- 5 runs: 35 of 35, EXIT 0.
## Checks common
- eslint on the 4 files EXIT 0; `tsc --noEmit` EXIT 0 in all three worktrees.
- CI: FIX-36 and FIX-37 all green except Executable gates (16 fail, as main, none in these files). FIX-38 shard 1 red = nuvion/tests/nuvion-opening.contract.spec.ts:2850 "the view says so too", 429 from one address (1 failed, 4188 passed); FIX-38 does not touch that file; FIX-33 changes it ("draws every client address once"). Unrelated.
## Findings (all low)
1. FIX-38 gap pin glued to letters (pin1397, 1397abc) is not seen. Low: a log line needs "pin" and the digits with no separator; every separator form is caught.
2. FIX-38 `pin 1397 ms` is read as a duration and hidden; fractional "1397.5 ms" reads as a hit (false alarm). Neither occurs in real logs. Low.
3. FIX-37 the shutdown case has no finally that kills its child, so a failure before child.kill leaves a listening fixture (PID 12437 is one). Pre-existing, not from this change. Low.
4. FIX-37 the pooler case (freePort) cannot run here or in CI (no pgbouncer); only its port step was proved. Low.
