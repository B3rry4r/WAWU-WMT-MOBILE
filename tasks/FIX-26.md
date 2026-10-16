---
id: FIX-26
title: The limits lock always runs in a real transaction, and the money-route checks pin what they read
owner: YOU
area: FIX
order: 234
priority: launch
repo: wawu-backend
type: backend-endpoint
status: verifying
depends_on: [FIX-21]
decisions: []
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# FIX-26 · The limits lock always runs in a real transaction, and the money-route checks pin what they read

## Current state

As of 16 Oct 2026.
- **Status:** merging (lead). Checked once by an independent verifier (report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/FIX-26.md`): verdict merge, nothing medium or worse. Batch 3: stacked on `wmt/WALLET-23` (this branch contains it); API types regenerated from backend `wmt/FIX-26` (5c5b47a).
- **Branches:** backend `wmt/FIX-26` at c98bd77 (two commits on main 56f94d0: 6860da9 the build, c98bd77 one more spec test). Mobile `wmt/FIX-26`: this file and the G-410 text in BACKEND_GAPS.md. wawu-id: none. Migration: none. No route, contract or answer changes.
- **Merged / live:** nothing yet.
- **Built:** `assertMayMove` and `assertWithinLimits` take `tx` as required (`MovementTx`, `src/money/limits/movement-tx.ts`); the service's own client does not type-check there, and at run time nothing, the service's own client or any root client throws `NotInTransactionError` (a 500, before fees_not_set and before anything is locked, read or written).
- **Specs:** `movement-tx.contract.spec.ts` (new, real Postgres), `read-committed.contract.spec.ts` (level before the per-transaction limit), `money-moving-coverage.spec.ts` (walk, subclass, class `@ApiResponse`, global guards, deny-by-default list, 11 fixtures served over HTTP). Existing calls in `money-limits.spec.ts` and `money-limits.contract.spec.ts` now pass a `tx` (the API changed; no assertion changed).
- **Checks (builder):** backend `tsc`, eslint and prettier clean; limits folder passed on the fix_26 stack before the push. Backend CI on c98bd77 (the head): suite shards 1 to 3 (97 suites, 4,019 tests in shard 1), contract, netns, protected routes and baseline all green; the gates job red with 16 FAIL, none in a changed file (6860da9 the same). Mobile (docs only): typecheck, lint (0 errors, 5 warnings), gates (0 fail) and tasks pass; jest 2,711 of 2,713 with 3 suites down under load 33 to 37 (timeouts, a killed worker), those 3 alone 81/81.
- **Mutants run by the builder:** 10 on the coverage spec (the 3 F2 ones, 7 F1 shapes), 8 on the service and guard (the F2 level order among them); all killed, files restored.
- **History:** none yet. Reports go to tasks/history/FIX-26.md.
- **Open findings:** blocker 0, high 0, medium 0. Lows: the deny-by-default list misses a write at exactly `money`; it stops at `money/`; a mutant reading the daily total through the service's own client survives. They are in tasks/SWEEP-MONEY.md with the report path.
- **Next:** the lead opens the backend pull request from the batch 3 head. Merge note: with WALLET-23 stacked below, the merge needed three small changes (the account-limit read goes through the required tx; WALLET-23's account-limits.contract.spec.ts passes a tx; POST money/statements/email, a WALLET-35 route on main, is named in NON_MONEY_WRITES with its reason).

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `tasks/FIX-21.md` (its verifier report: F1, F2, F3), `tasks/NUV-07.md`, `BACKEND_GAPS.md` G-410

## Goal

FIX-21's verifier found:
- **F3.** `assertMayMove` called without `tx` takes no lock and checks no level. Two movements of 600 both passed a daily 1,000 in 20 of 20 rounds. Passing the service's own client as `tx` compiles, passes the level check, and the lock ends with its own statement: also over the limit every round. No caller does either today.
- **F2.** Four mutants survive the specs: a guard instance not counted as its class; the walk ignoring a dynamic module's imports; class guards read with `getOwnMetadata` (inherited class guards missed); the level checked after the per-transaction limit.
- **F1.** Route shapes the coverage spec cannot see: a controller listed only in a dynamic module's `controllers`; a subclass of the PIN guard given by class; error codes documented on the class with `@ApiResponse`; global guards; a debit that documents nothing and carries no PIN guard.

## Scope

- `assertMayMove` takes `tx` as required (typed so the root client is refused at compile time where possible) and refuses at run time when `tx` is the service's own client; every caller passes its transaction.
- Specs that kill the four F2 mutants.
- The coverage spec walks dynamic modules' controllers and imports, counts guard subclasses as their base, reads class-level `@ApiResponse` codes, and, for the last F1 case, keeps a deny-by-default list: every non-GET route under `money/` must be either money-moving (and guarded) or named with a reason.
- No change to any answer a person can get today.

## Capability checks

- [ ] `assertMayMove` without a real transaction refuses; with one, 50 rounds of parallel movements never pass a limit.
- [ ] The four F2 mutants and each F1 shape fail the spec.
- [ ] Protected routes 253/253 with the lock unchanged.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/FIX-26.md](history/FIX-26.md).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
