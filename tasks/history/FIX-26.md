# FIX-26 · round history

Moved out of [tasks/FIX-26.md](../FIX-26.md) word for word, oldest first. The current state is in that file.

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

**Backend CI** on the head c98bd77 (workflow runs 38896835284 gates, 38896835355 protected routes, 38896835329 branch checks; 6860da9: 38895640352, 38895640693, 38895640742): suite shards 1 to 3 green (shard 1: 97 suites, 4,019 tests), contract, netns, protected routes, baseline and deploy-test-in-sync green; gates red with 16 FAIL (103 warn, 76 accepted), none in a changed file. **Mobile** (this branch, docs only): typecheck, lint (0 errors, 5 warnings) and gates (0 fail) pass; `docs/PROGRESS.md` regenerated with `check_tasks.py --write`, then `npm run tasks` passes; jest 2,711 of 2,713 passed, 3 suites (walletSettingsFlow, PinSheet, LegalChatScreen) failed under a load average of 33 to 37 and pass alone, 81/81.

**Decisions for the verifier to judge**
1. The transaction check runs before `fees_not_set` (a programming error whatever the settings), which FIX-21's decision 5 did not cover; the level check keeps its place after it.
2. `assertWithinLimits` (public, used only by `assertMayMove` and one unit test) also requires `tx`.
3. A subclass of the throttler counts as the throttler for the global-guard rule; a subclass of `WawuAuthGuard` counts as the sign-in guard.
4. `tx` is detected at run time by a missing `$connect`, not by `$transaction` (Prisma 7 keeps `$transaction` on the transaction client). Not caught: a hand-made object with no `$connect` that is not the service's own client (it would fail at its first statement).

**Not done:** nothing open. The full suite ran on GitHub only (three shards), not locally.

## Verifier report

_Not started._

