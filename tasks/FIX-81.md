---
id: FIX-81
title: The school report spec no longer goes red beside another process on the same database
owner: YOU
area: FIX
order: -81
priority: launch
repo: wawu-backend
type: backend-endpoint
status: verifying
depends_on: []
decisions: [R-5]
passes: [V1, V2, V3, V4, V9]
artboards: []
tier: T1
---
# FIX-81 · The school report spec no longer goes red beside another process on the same database

## Current state

As of 18 Oct 2026, verifying.
- **Status:** verifying. Backend `wmt/FIX-81` `3fa6c5e` (from `wmt/MERGE-18` `c71742d`); this record on mobile `wmt/FIX-81` (from `wmt/MERGE-18` `f3a7dcaa`). One spec and one line of the school harness changed; no product code, no app code. No Fintava file touched (the spec and its Nuvion harness import no Fintava double; `school-enrolment.contract.spec.ts` not run).
- **G-FIX-76-1, the cause (b), already fixed:** the 48 reds of 174 (FIX-76) ran on a tree WITHOUT FIX-64: `wmt/FIX-76`'s spec waits on `attempts >= 1` alone (no `firstTryDone`, no `delayMs`; `29e400b` is not in that branch). `attempts` counts from the claim, before the relay is called, so the wait ended with the first try still on its way and `lastError` still null: FIX-64's race. On `wmt/MERGE-18` the same spec is red **0 of 102** (three loops at once, each on its own database, machine load average 11 to 19). Forced every time: the current spec with only the old wait put back is red **5 of 5** (five servers: 2 requests for 1; the lost answer; the relay down), the current wait never.
- **A second cause (b), found by running it the way FIX-76 did (several processes on ONE database):** the spec's two `reports.sweep(...)` calls (the old `:145`, `:208`, `:211`) read every due report in the database, not only its own. Beside another process the sweep sent THAT process's reports through this relay and that process's sweep sent this one's (it also moves a resting report forward, `+5 min`). Cases and messages, old code, three copies of the spec on one database, 96 runs, 13 red: "a relay that refuses ten times" 11 (`:233` attempts 4, 5 or 9, expected 10: the report was sent by the other process, so every later `deliver` was `not_due`) and "a relay that is down" 2 (`:205` `nextAttemptAt` null: already sent by the other process). Beside the locks spec (two copies) on one database, 20 runs: red 11 ("a paid course" 10: 2 or 3 requests for 1; "a relay that is down" 2: a request while resting). The product is right: the Hub's sweep is meant to take every due report, and many servers on one database make one mail (the lease and the key). README already says the contract suite is not parallel-safe.
- **Fix (spec only, no assertion changed):** the three sweeps go through a second `SchoolReportService` whose `findMany` (the sweep's selection) is narrowed to the students this spec made (`h.users`) with a Prisma `$extends` query hook. The real `sweep` code runs, so rest, lease and the batch are still tested. Everything else in the spec already went by one enrolment id.
- **A third cause (b), the harness, found by the fixed spec on the shared database (1 red of 27):** `test/schools/school-nuvion-harness.ts` builds a person's ten-digit account number from the clock's last six digits and a per-process counter; two processes asking in the same millisecond with the same counter made the same number and the unique column refused the second ("a student who removed their account", `person()` threw). The six digits are now random (`randomInt`); nothing else in the harness changed.
- **Counts (100-run rule):** old code, own database per process, 102 runs: red 0. Old code, three copies on one database, 96 runs: red 13 (refuses ten times 11, relay down 2). Fixed code, three copies on one database, spec fix alone 27 runs, red 1 (the account number above); spec and harness fix 75 runs, red 0. Fixed code, own database per process, 102 runs, red 0. Old code beside two locks-spec loops on one database, 20 runs: red 11; fixed code, 20 runs: red 0.
- **Checks:** `tsc` 0, `eslint` 0 and prettier on the changed file, the spec 12 of 12 alone, gates EXIT 0 (0 fail, 129 warn, 88 accepted; the base shows the same 129), baseline EXIT 0; the three school specs that use the harness, run by name together: 39 of 40 (the report and locks specs green; the one red, in the settlement spec, is "a failed payout is retried once..." at `:508`, expected paid, got sent: the ten-minute wait FIX-76 replaces; FIX-76 is not on this base).
- **Not fixed (sweep list):** the locks spec is red every run beside another copy of itself on one database (its release sweeps are global too, G-FIX-81-1); a fresh tree run by several processes at once can write a mismatched `mock-wawu-id/private.pem` and `public.pem`, so every case answers 401 "pin not set" (G-FIX-81-2).
- **Next:** an independent verifier; then the lead's batch.

## Read first

- `docs/WORKFLOW.md`, `docs/roles/VERIFIER.md`
- wawu-backend `src/schools/enrolment/school-report.service.ts` (`deliver`, `sweep`), FIX-64 and FIX-76 records

## Goal

The school report spec does not go red because the machine is slow, or because another process uses the same database.

## Scope (backend only, test file)

`src/schools/enrolment/tests/school-report.contract.spec.ts`, `test/schools/school-nuvion-harness.ts` (one line, the account number).

## Capability checks

- [x] The first-try wait is FIX-64's: with the old wait the spec is red 5 of 5, with the current one it is not.
- [x] The spec's sweeps read only its own reports; a second process on the same database no longer changes the result.
- [x] Three copies of the spec on one database: old code red 13 of 96, fixed code red 0 of 75; one database each: red 0 of 102 both ways.
- [x] The product is unchanged: one mail per enrolment, the lease holds a second caller off.

## Owner sign-off

Not needed.
