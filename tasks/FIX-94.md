---
id: FIX-94
title: The deploy's whole-suite run passes again: the Voice Intro stale-sweep test checks its own hold, not a global count
owner: YOU
area: OPS
order: -94
priority: launch
repo: wawu-backend
type: setup
status: verifying
depends_on: []
decisions: [R-20]
passes: [V1]
artboards: []
tier: T0
---
# FIX-94 · The deploy's whole-suite run passes again: the Voice Intro stale-sweep test checks its own hold, not a global count

## Current state

As of 20 Oct 2026, verifying: built by a Sonnet builder (tier T0, test only; backend `wmt/FIX-94` `bd637b6` on `origin/main` `ef69e7a`; this record on mobile `wmt/FIX-94` from `origin/main` `b870de9a`). No product code, gate, baseline, other assertion or Fintava file changed. CI on the backend head: the lead watches it.

- **Why main was red on deploy.** Deploy Hub API run 39494343722 failed in Test after VOICE-01 merged (`ef69e7a`), so the deploy was skipped and the live server is unchanged. The deploy runs the whole suite in one process on one database (`npx jest --runInBand --forceExit`); sharded CI passed.
- **The failure.** `voice-intro.contract.spec.ts:647`, "a finish that comes after the stale-hold sweep gave the points back is refused": `spend.releaseStale(0, now + 60 s)` released 2, expected 1. The sweep is global (every stale `ai_job` hold in the database). An earlier spec in the same run left one pending hold, so the count included a row the test did not make.
- **The fix (lead's ruling, as FIX-89 scoped specs to their own rows).** The test reads its own hold (`holdsOf(PLAIN)`, state `held`), runs the same sweep, then asserts that hold is `released` (by id, for that person). The count line is gone. Every other assertion is unchanged (run failed with `timed_out`, no audio, view has no audio, points back).
- **Rest of the file checked.** No other assertion counts rows it did not create: the hold and run counts are by person, the stand-in call and clone counts and the in-memory file store belong to the spec's own harness.

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`
- DECISIONS R-20; the backend's `test/plans/lapsed-orders.ts` (FIX-89), `src/points/spend/points-spend.service.ts` (`releaseStale`)

## Goal

The deploy's whole-suite run passes on main, so a merged batch goes live.

## Scope

`wawu-backend`: `src/voice-intro/tests/voice-intro.contract.spec.ts` (one test). `wawu-wmt-mobile`: this file, `tasks/INDEX.md`, `docs/PROGRESS.md`.

## Capability checks

- [x] On one fresh database seeded as `deploy.yml` seeds it, with one stray pending points hold of another person left in it, the voice-intro spec in band is red before (1 of 24 failed, released 2, expected 1) and green after (24 of 24).
- [x] Both voice-intro specs in band: 2 suites, 29 tests pass.
- [x] eslint, prettier, `tsc --noEmit` and `scripts/gates/run.py` pass.
- [ ] The full backend run (CI, Branch checks, and the deploy's Test job) is green on the head.

## Builder report

- **Files:** backend `src/voice-intro/tests/voice-intro.contract.spec.ts` (+8 -2, one test). Mobile: this file, `tasks/INDEX.md`, `docs/PROGRESS.md`.
- **Red before.** Fresh database `fix94_test` (migrated and seeded as `deploy.yml` does, mock WAWU ID on 7860). A throwaway spec (not committed) held points for a person outside the harness's seeded people, leaving one `held` `ai_job` hold. The harness's own `clean()` purges only its seeded people, so a stray for one of those would not have survived. Original spec: `Expected: 1  Received: 2`, 1 failed, 23 passed (EXIT 1).
- **Green after.** Same condition (one stray held hold in the database): 24 of 24 pass (EXIT 0); the stray is released by the sweep and the test checks only its own hold.
- **Checks:** voice specs (`voice-intro.contract`, `voice-provider-own-voice`) EXIT 0, 29 tests; eslint EXIT 0; prettier EXIT 0; tsc EXIT 0; `gates/run.py` EXIT 0 (0 fail, 130 warn, 88 accepted).
- **Not run:** the whole suite (CI runs it); anything Fintava.
- **Cleanup:** mock stopped, database dropped, worktrees removed, ports 7860-7867 empty.

## Verifier report

## Owner sign-off

Not needed.
