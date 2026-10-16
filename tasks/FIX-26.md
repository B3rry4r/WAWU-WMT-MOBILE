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
- **Status:** verifying. Built by a Sonnet builder; the independent verifier is next.
- **Branches:** backend `wmt/FIX-26` at c98bd77 (two commits on main 56f94d0: 6860da9 the build, c98bd77 one more spec test). Mobile `wmt/FIX-26`: this file and the G-410 text in BACKEND_GAPS.md. wawu-id: none. Migration: none. No route, contract or answer changes.
- **Merged / live:** nothing yet.
- **Built:** `assertMayMove` and `assertWithinLimits` take `tx` as required (`MovementTx`, `src/money/limits/movement-tx.ts`); the service's own client does not type-check there, and at run time nothing, the service's own client or any root client throws `NotInTransactionError` (a 500, before fees_not_set and before anything is locked, read or written).
- **Specs:** `movement-tx.contract.spec.ts` (new, real Postgres), `read-committed.contract.spec.ts` (level before the per-transaction limit), `money-moving-coverage.spec.ts` (walk, subclass, class `@ApiResponse`, global guards, deny-by-default list, 11 fixtures served over HTTP). Existing calls in `money-limits.spec.ts` and `money-limits.contract.spec.ts` now pass a `tx` (the API changed; no assertion changed).
- **Checks (builder):** limits folder 102/102 on the fix_26 stack; backend `tsc`, eslint and prettier clean; gates 16 FAIL, the same 16 as main, none in a changed file. Backend CI on 6860da9: all green but the gates job (the 16). Run ids and the c98bd77 run are in the builder report.
- **Mutants run by the builder:** 10 on the coverage spec (the 3 F2 ones, 7 F1 shapes), 8 on the service and guard (the F2 level order among them); all killed, files restored.
- **Open findings:** none known.
- **Next:** a verifier (not the builder) runs V1 to V4 and V9 from the Capability checks, and re-runs the mutants in the Builder report.
- **History:** none yet. Reports go to tasks/history/FIX-26.md.

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

## Builder report

**Builder: Sonnet, 16 Oct 2026.** Backend `wmt/FIX-26` from main 56f94d0. Local stack `fix_26` (ports 7090 to 7093), stopped at the end. Nothing here calls a provider.

**What changed**
- `src/money/limits/movement-tx.ts` (new). `MovementTx = Prisma.TransactionClient & { $connect?: never; $disconnect?: never }`: Prisma 7 leaves `$connect` and `$disconnect` off the client it hands a transaction and a `PrismaService` has both, so the root client does not fit (`@ts-expect-error` lines in the new spec, checked by `tsc`). `$transaction` is not usable for this: Prisma 7 keeps it on the transaction client (nested transactions). `assertOwnTransaction(tx, ownClient)` throws `NotInTransactionError('missing' | 'root_client')` for nothing, for the service's own client, and for anything with a `$connect` function (another `PrismaService`, an extended client).
- `money-limits.service.ts`. `assertMayMove(input, opts: MovementCheckOptions)` and `assertWithinLimits(...)`: `tx` required; the transaction check comes first (before `fees_not_set`, so it is met in the caller's own specs and not only once fees are set; it does no I/O); then fees, then the level (FIX-21), then the limits. The lock is now always taken. `wallet-payment.service.ts` already passed its `tx`; unchanged.
- Docs: `docs/contract/CONVENTIONS.md` (backend) and `BACKEND_GAPS.md` G-410 (mobile) say `tx` is required.

**Specs (F3, F2, F1)**
- `movement-tx.contract.spec.ts` (9 tests): the types refuse no tx and the root client; the premise (a transaction client has no `$connect`, the root client has); `missing` and `root_client` for both methods; a second `PrismaService`; `$extends`; a stand-in client compared with the one the service was built with; no statement reaches the database and `fees_not_set` does not come first; a real transaction passes; the global filter answers a 500 without the text; 20 rounds x 2 (own client, undefined) of two movements at once: both refused, 0 written (the verifier saw both pass 20 of 20).
- `read-committed.contract.spec.ts` (+1, kills ML2): at REPEATABLE READ and SERIALIZABLE an amount above the per-transaction limit, or 0, is the level error; at READ COMMITTED the same amounts are `limit_reached` and `RangeError`. The 50-round parallel check already there (two of 600 against 1,000) still holds.
- `money-moving-coverage.spec.ts`: the walk (`walkModules`, async) reads dynamic modules' `controllers`, `imports` and `providers`, and awaits a Promise import (`ConfigModule.forRoot()` is one in AppModule today); `isGuard` counts a subclass given by class; class-level `@ApiResponse` is merged under the method's by status as swagger merges it into the contract; global guards are held to `ThrottlerGuard` (`APP_GUARD` in any reachable module, and no `useGlobalGuards()` in `src`); `NON_MONEY_WRITES` (16 routes, each with a reason) plus `MOVES_NO_MONEY` are the deny-by-default list for every non-GET route under `money/`, and a stale name fails. 11 fixtures, one per shape, each also served over HTTP with recording guards (reading equals running). 43 tests.
- Existing specs edited only to pass a `tx` (`money-limits.spec.ts`: a fake `tx` that answers the level read; `money-limits.contract.spec.ts`: two calls run inside `prisma.$transaction`). No assertion changed.

**Capability checks**
1. Without a real transaction `assertMayMove` refuses; with one, 50 rounds of parallel movements never pass a limit: passed (above; `read-committed.contract.spec.ts` rounds = 50).
2. The four F2 mutants and each F1 shape fail the spec: passed. Applied one at a time to a copy, the folder run, the file restored (`cmp` equal):
   - Coverage spec (10): guard instance not its class; dynamic module's imports ignored; `getOwnMetadata` for class guards; dynamic `controllers` ignored; subclass given by class not counted; class responses ignored; method wins not by status; global guards unread; deny list off; Promise import skipped. Each fails 1 to 3 tests.
   - Service and guard (8): tx check removed from `assertMayMove`, from `assertWithinLimits`, from both; identity check removed; `$connect` check removed; level after the per-transaction limit (ML2); tx check after `fees_not_set`; level check removed. Each fails 1 to 8 tests.
3. Protected routes: backend CI job "Protected route suite against the base branch's checker and lock" green on 6860da9 (no route changed).

**Backend CI** (6860da9, workflow runs 38895640693 protected, 38895640352 gates, 38895640742 branch checks): suite shards 1 to 3 green (shard 1: 97 suites, 4,018 tests), contract, netns, protected, baseline, deploy-test-in-sync green; gates red with the same 16 FAIL lines as main (103 warn, 76 accepted), none in a changed file.

**Decisions for the verifier to judge**
1. The transaction check runs before `fees_not_set` (a programming error whatever the settings), which FIX-21's decision 5 did not cover; the level check keeps its place after it.
2. `assertWithinLimits` (public, used only by `assertMayMove` and one unit test) also requires `tx`.
3. A subclass of the throttler counts as the throttler for the global-guard rule; a subclass of `WawuAuthGuard` counts as the sign-in guard.
4. `tx` is detected at run time by a missing `$connect`, not by `$transaction` (Prisma 7 keeps `$transaction` on the transaction client). Not caught: a hand-made object with no `$connect` that is not the service's own client (it would fail at its first statement).

**Not done:** nothing open. The full suite ran on GitHub only (three shards), not locally.

## Verifier report

_Not started._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
