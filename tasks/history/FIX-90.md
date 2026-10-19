# FIX-90 · round history

Moved out of [tasks/FIX-90.md](../FIX-90.md) word for word, oldest first. The current state is in that file.

## Builder report

- Files: `src/event/tests/event-host-wizard.contract.spec.ts`, `src/event-ticketing/tests/event-door-scan.contract.spec.ts` (the EVENTS-11 refresh edit plus the fix, so it merges onto batch 17 and later as the same hunk; it also passes on main), `src/learn-entitlement/tests/learn-entitlement.contract.spec.ts`, `src/course-lesson/tests/course-lesson.contract.spec.ts`, `src/fintava/tests/fintava-stall.spec.ts`.
- Found by running the specs of the deploy order that come before the victims (321 files, three databases) and reading the seeded user's profile, enrollment and purchase after each: they went from present to gone right after `account-deletion-identity`, and the one scheduled deletion row it purged was written by `search-popular-privacy`.
- Red (fresh DB `fix90_test_proof`): after the two polluters the seeded rows read 0, 0, 0 (were 1, 1, 1); victims 4 failed suites, 25 failed tests (23 PrismaClientKnownRequestError, the toEqual, the toBe: the deploy's four signatures). Green on the same database: 4 passed, 36 passed.
- Stall: a heavy heap was too slow to use, so the red is a forced collection that blocks 1 s (scratch setup file, not committed): 38 of 38 red, Received about 2020 against 2010 allowed. Green with the fix, same setup: 38 of 38; whole spec 120 of 120 on its own.
- Checks: tsc EXIT 0; prettier clean; eslint on the five files: only the 12 problems learn-entitlement already had (7 errors, 5 warnings, same before and after).
- Not done: the polluters are untouched (G-FIX-90-1). paid-dm-wallet, host-share, event-host-payout, ai-tools are FIX-91's; the local-only failures are left as the brief says.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/FIX-90.md](history/FIX-90.md).

