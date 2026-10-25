---
id: FIX-91
title: Four backend specs count rows other specs left behind, so the live deploy's whole-suite run fails them
owner: YOU
area: OPS
order: -91
priority: launch
repo: wawu-backend
type: setup
status: review
depends_on: []
decisions: []
passes: [V1]
artboards: []
tier: T0
---
# FIX-91 · Four backend specs count rows other specs left behind, so the live deploy's whole-suite run fails them

## Current state

As of 19 Oct 2026, built by a Sonnet builder (tier T0, test files only, no product code, gate or baseline changed): backend `wmt/FIX-91-b12` `d40a363` (from `origin/wmt/MERGE-12` `42a151d`) and `wmt/FIX-91-b13` `2ccd3f8` (from `origin/wmt/MERGE-13` `6bc7b20`). This record is on mobile `wmt/FIX-91` (from `origin/wmt/MERGE-26` `9ca3e6a4`). Source: the batch 26 merge agent's whole-suite run (24 suites failed); these four are the share that arrives in batches 12 and 13.

- **Why they failed.** The deploy runs the whole suite in one process on one database (`npx jest --runInBand --forceExit`). Jest runs the biggest files first. A check that counts every row in a table, or sweeps every row, also meets the rows an earlier spec left. Each of the four passes alone (the batch 26 agent's own re-run).
- **`paid-dm-wallet`, `host-share`, `event-host-payout` (14 tests, batch 12):** each ends with `operationalAgrees()`: the stand-in's operational balance must equal the ledger's completed rows on WAWU's account. Every Nuvion stand-in gives that account the same number (`NVXYT1GUCM`), so the read took the rows of every spec before it. The three were off by exactly 15,000,000 kobo (₦150,000) in every test. Fix: the read keeps the rows whose counterparty is one of the spec's own people (`counterpartyWawuUserId: { in: h.users }`). The balance check itself is unchanged.
- **Polluter of those three: `src/schools/enrolment/tests/school-enrolment.contract.spec.ts`** (SCHOOLS-07, "the person leaves": a ₦150,000 course is paid, then `AccountPurgeService.purge` anonymises the payment's payer; the harness's `close()` finds payments by their payer, so the payment's ledger row on WAWU's account, 15,000,000 kobo, survives). It is 39 KB, so it runs before all three in every batch from 11. It imports the Fintava double, so it was not run (common rules); it was found by elimination (the 52 non-Fintava suites that run before `paid-dm-wallet` in the deploy order, run in that order on a fresh database, leave 0 rows) and by its exact amount and its purge test. First batch where it triggers: **12** (the victims first exist there; the polluter has been there since 11).
- **`ai-tools.contract.spec.ts` (1 test, batch 13):** "a job that finishes after the sweep gave its points back" expected `releaseStale` to give back exactly 1 hold and got 2; the sweep covers every stale AI hold in the database. Fix: the two sweep tests read this job's own hold (held before the sweep and `released` after it; `committed` and untouched), not the sweep's count. The balance, the failed state and the audio checks are unchanged.
- **Polluter of ai-tools: `src/account/tests/account-deletion.contract.spec.ts`** (SETTINGS-06, "leaves no points row of the deleted person and touches nobody else's": another person keeps a held 2-point `ai_job` hold and `afterAll` does not remove it). It imports the Fintava double, so it was not run. First batch where it triggers: **13** (ai-tools first exists there; the polluter is in 11 to 13 and is bigger).
- **Proof, red then green, with a stand-in for each polluter that uses the Nuvion seam only and makes the same leftover** (a held paid question whose payer is purged; a grant and a held `ai_job` hold for another person):
  - batch 12, fresh DB: stand-in, then the three original specs: 3 suites red, 12 tests; stand-in, then the three fixed specs: 22 of 22 green (the leftover row is there). Clean DB: fixed 22 of 22.
  - batch 13, fresh DB: stand-in, then the original ai-tools: 1 red ("Expected: 1 Received: 2", as the deploy); stand-in, then the fixed one: 24 of 24; stand-in, then only "leaves it alone": green.
  - Scratch merge of both branches into `origin/wmt/MERGE-26` `adc455e` (no conflict, 4 files): both stand-ins, then the four original specs: 4 suites, 14 tests red (the deploy's 14); a stand-in again, then the four fixed: 50 of 50 green. `tsc --noEmit` EXIT 0, eslint EXIT 0, gates EXIT 0 (0 fail).
- **Open:** G-FIX-91-1 and G-FIX-91-2 (low, in BACKEND_GAPS.md): the two polluters still leave their rows. Both are Fintava-double specs, so they were not touched; any new spec that counts globally meets them again.

Status set to review by the records sync, 25 Oct 2026: merged as backend 2a05924a, lead acceptance in the lead's merge log, 19 Oct (FIX-91 ACCEPTED, T0 diff read).

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`
- FIX-88 and FIX-89 (the same kind of fix); the backend's `test/payments/wallet-pay-harness.ts` (`close()`)

## Goal

The four specs pass in the deploy's whole-suite run on the batch that first holds them and on the newest batch, and each still proves what it proved before.

## Scope

`wawu-backend`: the four spec files named above (test files only). `wawu-wmt-mobile`: this file, BACKEND_GAPS.md and the log.

## Capability checks

- [x] The three batch 12 specs pass 22 of 22 after the ledger stand-in; ai-tools passes 24 of 24 after the hold stand-in.
- [x] The same four pass 50 of 50 on `origin/wmt/MERGE-26` with both fixes merged and both leftovers present.
- [x] No product file, gate, baseline or other test changed.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/FIX-91.md](history/FIX-91.md).

## Owner sign-off

Not needed.
