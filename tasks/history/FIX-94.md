# FIX-94 · round history

Moved out of [tasks/FIX-94.md](../FIX-94.md) word for word, oldest first. The current state is in that file.

## Builder report

- **Files:** backend `src/voice-intro/tests/voice-intro.contract.spec.ts` (+8 -2, one test). Mobile: this file, `tasks/INDEX.md`, `docs/PROGRESS.md`.
- **Red before.** Fresh database `fix94_test` (migrated and seeded as `deploy.yml` does, mock WAWU ID on 7860). A throwaway spec (not committed) held points for a person outside the harness's seeded people, leaving one `held` `ai_job` hold. The harness's own `clean()` purges only its seeded people, so a stray for one of those would not have survived. Original spec: `Expected: 1  Received: 2`, 1 failed, 23 passed (EXIT 1).
- **Green after.** Same condition (one stray held hold in the database): 24 of 24 pass (EXIT 0); the stray is released by the sweep and the test checks only its own hold.
- **Checks:** voice specs (`voice-intro.contract`, `voice-provider-own-voice`) EXIT 0, 29 tests; eslint EXIT 0; prettier EXIT 0; tsc EXIT 0; `gates/run.py` EXIT 0 (0 fail, 130 warn, 88 accepted).
- **Not run:** the whole suite (CI runs it); anything Fintava.
- **Cleanup:** mock stopped, database dropped, worktrees removed, ports 7860-7867 empty.

## Verifier report


Lean verifier (T2 check), Sonnet, 25 Oct 2026. Backend `origin/main` `dcee8af`; the old spec from `bd637b6^` (`ef69e7a`) in a second worktree. Verdict: **PASS** (status `review`).

| Pass | Result | Evidence |
|------|--------|----------|
| V1 | passed | `tsc --noEmit` EXIT 0; eslint (no fix) on the spec EXIT 0; prettier --check EXIT 0; `gates/run.py` EXIT 0 (1977 files scanned, 0 fail, 138 warn, 88 accepted); `check_baseline.py` EXIT 0 |

Capability checks, on a fresh database (`vun3_f94_test`: `prisma migrate deploy`, `npm run db:seed` as `deploy.yml` does, the harness's own mock WAWU ID), whole spec file in band:
- Clean database, main's spec: 29 of 30 pass; the one failure is another test (see the low finding), the stale-sweep test passes.
- One stray `held` `ai_job` hold of an unknown person (inserted with SQL, a day old), main's spec: 30 of 30 pass, EXIT 0. The sweep gave the stray back and the test read only its own hold by id.
- The same stray, the OLD spec (`bd637b6^`): 23 of 24 pass, 1 fails at the stale-sweep test, `Expected: 1  Received: 2`, EXIT 1. So the stray reproduces the deploy failure and the fix cures it.
- The spec file mentions Fintava only in two comments (no import of the double); no other voice or Fintava file ran.
- Other sweeps: `releaseStale` is called in 4 other specs (`ai-tools.contract`, `-files`, `-sound`, `-pipeline`); each counts with `toBeGreaterThanOrEqual` or reads its own holds (FIX-91), so none still pins a global equality.
- The changed test keeps every other assertion (run `failed` with `timed_out`, no audio url, no file kept, points back) and its new by-id check (`state released`, `wawuUserId` equal) is stronger than the count it replaced.
- Whole backend run on CI: NOT RUN (the lead's).

Findings:
- `defect` low (test gap, not made by this task, for SWEEP-VOICE): `voice-intro.contract.spec.ts:551` ("makes the first for a person with a tier without taking a point") expected the run `working` right after the 202 and read `done`. It failed once in 6 runs: the first, cold run, while a stack build and a wallet seed were using the machine. Four isolated reruns of that test and a full rerun passed. The test starts its run with `h.prepare(PLAIN)` (line 539) and no `[[slow:N]]` marker, unlike the stale-sweep test beside it (`[[slow:900]]`), so it depends on the 202 arriving before the stand-in finishes. A marker would pin it. Since the deploy gate is this file's whole-suite run, a flake here can turn the deploy red again.

