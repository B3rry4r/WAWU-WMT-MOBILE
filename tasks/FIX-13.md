---
id: FIX-13
title: WAWU ID token rotation: a failed sweep never fails the sign-in
owner: YOU
area: FIX
order: 194
priority: launch
repo: wawu-id
type: setup
status: verifying
depends_on: [AUTH-08]
decisions: []
passes: [V1, V2, V3]
artboards: []
---
# FIX-13 · WAWU ID token rotation: a failed sweep never fails the sign-in

## Current state

As of 16 Oct 2026.
- **Status:** verifying. Built on wawu-id branch `wmt/FIX-13` (`7d25c1c`, from main `81e5e05`), pushed; GitHub checks on it green (build, deploy-build-in-sync, gates, baseline). No backend or app change, no migration, no SHARED-CHANGES row. This repo's branch holds only this file, LOG and PROGRESS.
- **Next:** an independent verifier (not the builder) checks the three capability checks below and reads the diff (`src/auth/tokens.service.ts`, one spec edited, one spec added). Then the lead merges wawu-id `wmt/FIX-13`.
- **What changed (F-1):** `TokensService.issueTokens(user)` is the sign-in path and sweeps on the pool; the refresh calls a private `mintTokenPair(user, tx, false)` inside its transaction and sweeps after the commit. The sweep always runs on the pool, logs and swallows its error. Nothing in the HTTP contract moved (`contract:build` leaves `contract/openapi.json` byte-identical).
- **What changed (F-3):** `refresh-token-lookup.spec.ts` no longer asserts `< 1000 ms`; it asserts the hash-check count (1 and 1) and the rows left (200). The milliseconds are still printed.
- **New spec:** `src/auth/refresh-sweep-failure.spec.ts` (10 tests). Its stand-in aborts a transaction on a failed statement, as Postgres does. Against the old `tokens.service.ts` 5 of 10 fail; against the new one all pass.
- **Capability 1 (live):** real wawu-id on the OPS-STACK, local Postgres, a trigger that refuses deletes of expired rows: refresh 200 with a new token, old token 401, 3 expired rows left and `Could not prune` logged, sign-in 200, sign-out 200, and the next refresh after dropping the trigger takes the backlog (9 of 9).
- **Capability 2:** the AUTH-08 spec passed 50 runs in a row at load average 26 to 44 (see the builder report in `tasks/history/FIX-13.md`).
- **Capability 3:** wawu-id full suite 32 suites, 520 tests passed (`--testTimeout=120000` because load made the 5 s defaults of other specs fail, as `refresh-closed-account.spec.ts` did at load 37); `npx tsc --noEmit` clean; eslint on the three files: the new spec and the edited spec clean, `tokens.service.ts` carries the same 8 errors as main (none from this change).
- **F-4, measured and recorded, not changed.** 200 unexpired null-jti rows (tokens issued before AUTH-08), real argon2, load average 36 to 38 on a 4-CPU box shared by nine agents: a pre-change token last in the scan refreshes in 181.3 s; refusing a reused token scans all 199 rows left, 155.9 s; a new-style token beside the same 199 rows refreshes in 1.3 s. AUTH-08's verifier saw 41.7 s, 29 to 54 s and 0.38 s on a quieter box, so read the ratio (about 140 to 1), not the seconds: each null-jti row costs one hash check, and a row stops costing when its token expires (30 days at most after AUTH-08 reached production).
- **Not run:** timing on the production database; the AUTH-08 `*.local.mjs` scripts (they start their own server, which the stack rule forbids; the live check above used the stack's wawu-id).

## Read first

- `docs/WORKFLOW.md` (the rules every task follows; section 4, fenced files)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- This task changes `wawu-id`. Follow that repo's CLAUDE.md for its commands.
- `tasks/AUTH-08.md` (merge note: F-1, F-3, F-4)

## Goal

AUTH-08 merged with follow-ups: the sweep of old refresh tokens runs inside the rotation transaction, so a sweep failure answers 500 to a person refreshing (F-1); one spec line depends on a 1000 ms timing and flakes (F-3).

## Scope

The sweep can no longer fail the rotation (outside the transaction or best-effort with a log); the flaky spec line asserts on state, not time. F-4 (transition cost) is measured and recorded, not changed.

## Capability checks

- [ ] A forced sweep failure leaves the refresh answering 200 with a new token.
- [ ] The spec passes 50 runs in a row under load.
- [ ] wawu-id's suite passes; the Hub's sign-in contract is unchanged.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/FIX-13.md](history/FIX-13.md).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
