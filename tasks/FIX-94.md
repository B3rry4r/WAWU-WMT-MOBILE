---
id: FIX-94
title: The deploy's whole-suite run passes again: the Voice Intro stale-sweep test checks its own hold, not a global count
owner: YOU
area: OPS
order: -94
priority: launch
repo: wawu-backend
type: setup
status: review
depends_on: []
decisions: [R-20]
passes: [V1]
artboards: []
tier: T0
---
# FIX-94 · The deploy's whole-suite run passes again: the Voice Intro stale-sweep test checks its own hold, not a global count

## Current state


As of 25 Oct 2026.
- **Status:** review. Independent lean verifier (T2 check, 25 Oct): PASS, no open defect. Backend `bd637b6` is in main (merge `bb21578`, PR #168); checked on `origin/main` `dcee8af`.
- **Still the lead's:** the last capability check, the whole backend run green on CI. Deploy runs the suite in 3 shards now (DEPLOY-FAST, 24 Oct), so "one process" in the earlier text is out of date; a shard still shares one database, so the fix is still the right one.
- **Open findings:** none medium or worse. One low, for the lead to place in SWEEP-VOICE (a timing race in a neighbouring test, not made by this task).
- **History:** [history/FIX-94.md](history/FIX-94.md).

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
- [ ] The full backend run (CI, Branch checks, and the deploy's Test job) is green on the head. (The lead's: not waited on by the verifier.)

## Owner sign-off

Not needed.
