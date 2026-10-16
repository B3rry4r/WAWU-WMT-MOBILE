# FIX-13 · round history

Moved out of [tasks/FIX-13.md](../FIX-13.md) word for word, oldest first. The current state is in that file.

## Builder report

**Builder: FIX-13**, Sonnet, 16 Oct 2026. wawu-id `wmt/FIX-13` `7d25c1c` (from `81e5e05`). Backend and app: no change.
- **Files:** `src/auth/tokens.service.ts` (sweep out of the rotation transaction), `src/auth/refresh-token-lookup.spec.ts` (the clock line), `src/auth/refresh-sweep-failure.spec.ts` (new).
- **Capability 1, a forced sweep failure leaves the refresh answering 200:** passed two ways. Spec: delete refused, and read of the expired rows failing, each over refresh, sign-in, sign-out and the next refresh; the sweep's statements are all outside a transaction; killed 5 of 10 against the old code. Live: stack `fix_13` with the real wawu-id on the local database and a delete-refusing trigger, 9 of 9 PASS (`fix13-live.mjs`, scratch).
- **Capability 2, 50 runs in a row under load:** `refresh-token-lookup.spec.ts` alone, 50 times one after another, 50 of 50 passed, load average 26 to 44 throughout, 49 to 99 s a run. One run printed a 1838 ms refresh at load 33 (the old line would have failed it); the count of hash checks was still 1.
- **Capability 3, suite and contract:** wawu-id full suite 32 of 32 suites, 520 of 520 tests. `tsc --noEmit` 0. `contract:build` leaves `contract/openapi.json` unchanged; `src/contract/contract.spec.ts` passes.
- **GitHub on `7d25c1c`:** build, deploy-build-in-sync, Executable gates, Baseline: all success.
- **F-4:** measured, see Current state. No code changed for it.
- **Gate counts (mobile repo, no code changed):** typecheck, lint, 152 of 152 jest suites (2756 of 2756 tests), gates (0 fail, 5 warn), tasks check: all pass in one run. wawu-id has no gate counts of its own beyond the suite above.
- **Gaps / shared changes:** none filed. Nothing could not be done.

## Verifier report

_Not started._

