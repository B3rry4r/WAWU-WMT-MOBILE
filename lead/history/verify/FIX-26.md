# FIX-26 verifier report (Sonnet verifier, 16 Oct 2026)

Backend wmt/FIX-26 c98bd77 (merge-base 56f94d0; main is now 22bb2cc, MONEY-16 merged, no new callers). Mobile 8dd313c: docs only
(BACKEND_GAPS.md G-410, docs/PROGRESS.md, tasks/FIX-26.md; no em-dash added).

Verdict: merge. Nothing medium or worse. Three low findings (sweep list).

## Findings
1. LOW. The deny-by-default list misses a write at exactly `money` (no sub-path). `unnamedMoneyWrites` and the stale-name test match
   `/^\w+ money\//`, so `@Controller('money') @Post()` (key "POST money") passes the spec with no guard and no documented code.
   File: src/money/limits/tests/money-moving-coverage.spec.ts (the regex in `unnamedMoneyWrites`, line ~340, and the stale-name test, line ~900).
   Repro: scratch copy, add a controller `@UseGuards(WawuAuthGuard) @Controller('money') class B { @Post() pay() {} }` to MoneyModule.controllers; run the spec: 43 of 43 pass.
   Fix: `/^\w+ money(\/|$)/`.
2. LOW. The deny list stops at `money/`. A debit outside it (e.g. `@Controller('payouts') @Post('send')`, no PIN guard, no documented debit code) passes
   (43 of 43). The task says "under money/", so this is in scope as built; `POST plans/purchases` already shows a payment route outside money/.
   Money-moving routes WITH the PIN guard or a debit-only code are caught anywhere (the hard-coded list of two routes in "finds the routes it checks").
3. LOW (informational). A mutant that reads the daily total through the service's own client instead of `tx` survives all four limits specs (54 of 54).
   Near-equivalent today: the lock is taken first and a rival's pending row is committed before it lets go, and no caller writes before the check. Not worth a round.

## Checks (all on the branch, real Postgres, stack fix_26)
- Callers: `assertMayMove` is called once, wallet-payment.service.ts:521 inside `prisma.$transaction(async (tx) => ...)`, `{ tx }`. `assertWithinLimits` only by `assertMayMove`. Fees controller uses `dailyStanding` (no tx, read only). Same on main 22bb2cc.
- tsc --noEmit EXIT 0 (specs included; CI runs it). Scratch: passing `this.prisma` at the one caller is `TS2322 PrismaService is not assignable to MovementTx`.
- src/money/limits: 6 suites, 102 tests pass. wallet-payment-nuvion.contract 56 of 56, wallet-payment.contract 72 of 72.
- Parallel through the real route (scratch spec, HTTP POST /money/payments, no claim hold): 20 rounds of 2 and 3 parallel payments by one person with room for one: exactly one 201, the rest 403 limit_reached, 20 of 20. The same spec with the lock line removed fails at round 0 (so it detects). Existing 50-round DB test passes.
- Runtime probe (Prisma 7.9.1): real tx, nested `tx.$transaction`, and a `$extends` client's tx all accepted; the extended root client refused (NotInTransactionError); `{...prisma}` fails at TypeError before any lock; a stale tx fails at its first statement.
- Mutants re-run on a scratch copy, one at a time, file restored each time: service/guard 8 of 8 killed (S1 tx check out of assertMayMove 1 test, S2 2, S3 6, identity 1, $connect 1, level after per-tx 1, tx check after fees 1, level removed 8); coverage spec 10 of 10 killed (1 to 3 tests each). Extra: lock taken via `this.prisma` killed (3 tests); daily read via `this.prisma` survives (finding 3).
- Deny list in a scratch copy: new unguarded `POST money/scratch/send` fails the spec (1 test); array-path controller `['money/scratch-arr']` fails; a PIN-less debit documenting `pin_incorrect` outside money/ fails 2 tests; findings 1 and 2 above pass.
- Gates: 16 fail / 76 accepted on the branch and on main, FAIL lines identical, none in a changed file. check_baseline OK (108 entries). CI on c98bd77: shards 1 to 3, contract, netns, protected routes (253), baseline, deploy-test-in-sync green; Executable gates red as main (56f94d0).
- No em-dash added in either repo's diff. No route, contract or answer change (diff touches no controller, contract/ or schema).

Cleanup: stack fix_26 down (hub 16138, mock-id 16125 stopped, database dropped), nothing listening on 7090 to 7097, worktrees v-fix-26-be, -main, -scratch removed. Pushed nothing.
