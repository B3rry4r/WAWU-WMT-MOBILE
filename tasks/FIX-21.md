---
id: FIX-21
title: The money-route checks see class-level guards, and the limits lock names its isolation level
owner: YOU
area: FIX
order: 225
priority: launch
repo: wawu-backend
type: backend-endpoint
status: done
depends_on: [NUV-07]
decisions: []
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# FIX-21 · The money-route checks see class-level guards, and the limits lock names its isolation level

## Read first

- `docs/WORKFLOW.md` (the rules every task follows; section 4, fenced files)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `tasks/NUV-07.md` (verifier findings 3 and 4) and `BACKEND_GAPS.md` G-410

## Goal

Two gaps in NUV-07's guards, found by its verifier:
- `money-moving-coverage.spec.ts` reads method guards only, and counts a route as money-moving only if it documents `idempotency_key_required`. A controller with a class-level PIN guard and `@RequireFeesSet()` last on the method passes the spec, yet answers `403 pin_required` before `fees_not_set`. A money route that documents only the wallet gate errors is not checked at all.
- The per-person lock in `assertMayMove` orders reads only under READ COMMITTED (Prisma's default). Under REPEATABLE READ, two movements of 600 against a daily limit of 1000 both pass; under SERIALIZABLE one fails with a write conflict instead of `limit_reached`.

## Scope

- The coverage spec reads class-level and method guards together, and counts as money-moving any route that carries a debit gate (the PIN guard, `@RequireTransactionPin()` or the debit gate errors), whatever it documents. The verifier's two throwaway controllers must fail it.
- `assertMayMove` refuses to run outside READ COMMITTED (it reads `transaction_isolation`) with an error naming the level. G-410 says READ COMMITTED.
- Land this before any money-moving route merges (MONEY-17, NUV-04, NUV-05).

## Capability checks

- [ ] The coverage spec fails each of the verifier's two controllers, and passes on main's routes.
- [ ] `assertMayMove` inside a REPEATABLE READ or SERIALIZABLE transaction refuses; under READ COMMITTED, parallel movements never pass a limit (at least 50 rounds).
- [ ] Protected routes 253/253.

## Builder report

Builder, 8 Oct 2026 (the lead's agents). wawu-backend `wmt/FIX-21` `301d56a` (merged backend main `657a152`, NUV-01 and
TIER-01); this repo `wmt/FIX-21` on main `98f16c6`. No migration, no route, no contract change (`contract:build` leaves
`contract/openapi.json` byte-identical to main). No Nuvion, Fintava, Flutterwave, wawuafrica.com or AI host was called.

**Built** (backend):
- `src/money/limits/tests/money-moving-coverage.spec.ts` reads each route's guards as Nest runs them: the controller's, then
  the method's, inherited handlers included (Nest's MetadataScanner walks the prototype chain). A route **moves money** when
  it carries a debit gate, whatever it documents: the PIN guard (class or method; `@RequireTransactionPin()`,
  `@RequireApproval()`), or a code only a debit or a PIN check answers (`DEBIT_GATE_ERRORS` less the wallet gate,
  `provider_unreachable`, `amount_out_of_range`, `fees_not_set`, `pin_not_set`; a code added to that list later counts by
  default). The four PIN routes that move no money (`PUT money/pin`, `POST money/pin/verify`, `PUT money/device`,
  `POST money/approval/verify`) are named with their reasons, and a test holds that list honest (mounted, checks a PIN,
  documents no idempotency, funds, quote or limit code). On a money-moving route nothing but `WawuAuthGuard` may run before
  `FeesSetGuard`, and it documents `fees_not_set` and `limit_reached`; any other route documents `fees_not_set` exactly when
  it runs the guard, as early. The verifier's two routes are rebuilt as fixtures in the spec, each beside its properly
  guarded version, plus a debit whose PIN is checked in the service and one whose handler is inherited.
- `src/money/limits/read-committed.ts` (new): `assertReadCommitted(tx)` runs `SELECT current_setting('transaction_isolation')`
  inside the caller's transaction and throws `IsolationLevelError` (a plain Error, `level` and a message naming it) for
  anything but `read committed`. `MoneyLimits.assertWithinLimits` calls it first whenever a `tx` is given, so
  `assertMayMove` answers `fees_not_set` first (NUV-07), then the level, then the limits; signature unchanged; without a
  `tx` nothing changes. New spec `src/money/limits/tests/read-committed.contract.spec.ts` (real Postgres).
- `docs/contract/CONVENTIONS.md` section 11, the comments on `RequireFeesSet()` and `MoneyLimitsModule`; here, G-410.

**Capability checks**
1. The coverage spec fails each of the verifier's two controllers, and passes on main's routes: **passed.** NUV-07's
   reading (kept in the spec) lets all four bad fixtures through. The new rules: the class-guarded debit fails with
   "runs WalletGateGuard before FeesSetGuard" and "runs TransactionPinGuard before FeesSetGuard"; the debit documenting only
   `WALLET_GATE_ERRORS, 'pin_incorrect'` (method PIN guard, service PIN, inherited handler) fails with "moves money and does
   not run FeesSetGuard", "does not document fees_not_set", "does not document limit_reached"; both properly guarded
   versions give no failure; every mounted route on main (and on main `657a152` after the merge) gives none. Over HTTP the
   order the spec reads is the order Nest runs, for all six fixtures (recording guards; the PIN guard refusing as with no
   PIN, the fees guard as with Nuvion's fees unset): the class-guarded debit answers `403 pin_required` after the gate and
   the PIN ran, its fixed version `503 fees_not_set` with only the sign-in before it.
2. `assertMayMove` refuses in a REPEATABLE READ or SERIALIZABLE transaction; under READ COMMITTED parallel movements never
   pass a limit (at least 50 rounds): **passed.** 50 rounds at Prisma's default level, each two movements of 600 kobo at once
   against a daily 1000: every round one passes, one `403 limit_reached` naming `daily`, 600 written; 20 more rounds naming
   READ COMMITTED explicitly, the same. REPEATABLE READ, SERIALIZABLE and READ UNCOMMITTED: `IsolationLevelError` naming
   `"repeatable read"`, `"serializable"`, `"read uncommitted"`, with a daily limit set and with none; two at once at either
   level: both refused, 0 written. A level raised by `SET TRANSACTION` inside a default transaction is refused too (the level
   is read, not assumed). `fees_not_set` still comes first under nuvion. Through `AllExceptionsFilter` it is a 500 whose body
   names neither the level nor READ COMMITTED. The reason, shown without the check (the same lock and count): REPEATABLE
   READ lets both pass (1200 written), SERIALIZABLE fails one with a write conflict, not `limit_reached`.
3. Protected routes 253/253: **passed** (`run.sh --fresh HEAD` on `301d56a`, lock origin/main `657a152`: 253/253, all 244
   required; no protected file touched).

**Runs** (load 13 to 25 from other sessions throughout)
- `npx tsc --noEmit` 0 (before and after the merge); eslint 0 on the 6 changed `.ts` files; `src/money/limits` and
  `src/money/fees` 134/134 (limits 68: NUV-07's 43 plus 13 isolation and 12 new coverage tests; fees 66), before and after
  the merge.
- Gates: main `657a152` 16 fail / 66 warn / 76 accepted on 974 files; branch 16 / 66 / 76 on 976; the whole output identical
  but for the file count (before the merge: 16 / 59 / 76 on 925 and 927). No PROVISIONAL. Tripwire on added lines: 0.
  Key-shaped scan of the diff against main: 0. Em-dash scan of added lines: 0.
- Full suite in my own network namespace (copies of `t3ns/ns2.sh` and `inner2.sh`, worktree and database changed; a fresh
  migrated and seeded `bf21_full_test` per shard, the namespace's own mock on its :4001, checked before, during and after),
  three serial `--shard=i/3` on `301d56a`: **209 suites, 5,570 tests, 5,480 passed, 4 skipped, 86 failed in 3 suites**, none
  in a file this task changed: `hub-rate-limits` 11 (needs a non-loopback interface), `fintava-stall` 74 (its 1 s timing
  bound at load 15) and `selfie-match.contract` 1 (a 5 s test limit). Each alone on the host at load 13 to 14:
  `hub-rate-limits` 22/22, `fintava-stall` 120/120, `selfie-match.contract` 182/182.
- Mobile `npm run check`: **exit 0** (typecheck, lint, jest 76/76 suites and 1,377 tests, gates 9 run / 346 files / 0 fail / 0 warn,
  260 tasks after merging main `98f16c6`). A first run at load 12 had two screen tests over the 20 s limit (A26 `OpenWalletScreen`, the settings
  screens), 128/128 alone; this task changes no app code. `npm run api -- --backend` the worktree: no change (this repo's
  contract already names backend `657a152`, and the branch's contract equals it).
- **MONEY-17 beside it** (a local trial, `git merge-tree` of `83036e3` and `origin/wmt/MONEY-17` `66b86bb` exported to a
  scratch folder, never committed or pushed): merges with no conflict (the first commit's version of the coverage spec
  conflicted with MONEY-17's edit to its first test, so that test was kept as on main, `83036e3`). On the trial: `tsc` 0;
  the coverage spec passes with MONEY-17's routes (`POST money/payments` money-moving by its PIN guard and properly guarded;
  `GET money/payments/quote` not money-moving, runs the fees guard first and documents `fees_not_set`); `src/money/limits`
  and `src/money/payments` 187/188 in one run at load 25 (R2-2, six taps through a barrier, answered 503 once; it fails
  before the claim transaction where the level is read), then R2-2 alone 5/5 on the trial and 5/5 on MONEY-17 alone, and
  `wallet-payment.contract.spec.ts` whole, twice each: MONEY-17 alone 55/55, 55/55; the trial 55/55, 55/55. MONEY-17's
  `claim()` transaction runs at the default level, so it passes the check.
- **Mutants**, 11 of my own on `a65a48d`, each applied, its spec run, `git restore`d, tree clean after each: **11 killed, 0 survived.**
  M1 no level check; M2 the level read outside the caller's transaction (`this.prisma`); M3 REPEATABLE READ accepted; M4 the
  level checked only when a daily or monthly limit is set; M5 no per-person lock (the 50 rounds catch it); M6 the level
  checked before `fees_not_set`; M7 the spec reading method guards only (NUV-07's hole); M8 the wallet gate and PIN guard
  allowed before the fees guard; M9 money-moving only when `idempotency_key_required` is documented (NUV-07's hole); M10 own
  handlers only; M11 a PIN route that moves no money dropped from the named list (main's own route then fails).

**Gaps and shared changes:** G-410 edited (class guards; READ COMMITTED). No new gap number, no SHARED-CHANGES row (no
fenced file touched: `src/common` and the contract unchanged).

**Decisions** (each Default (agent), owner may override)
1. What counts as moving money: the PIN guard, or a code only a debit or a PIN check answers; the codes a read, a quote or a
   PIN reset also answers do not count, so a quote (MONEY-17's included) is held by the fees rule, not the debit rule.
2. The four routes that check a PIN and move no money are named in the spec and do not take the fees guard: changing the
   PIN, checking a PIN or an approval and turning on the phone still work while Nuvion's fees are unset.
3. Only `WawuAuthGuard` may run before `FeesSetGuard` on a money-moving route (the global throttler aside): a 401 uses no
   try, opens no wallet and stores nothing.
4. Inherited handlers are read too (Nest serves them); a guard given as an instance counts as its class.
5. The level is checked whenever `assertMayMove` gets a `tx`, whatever limits are set (a caller at the wrong level fails in
   its own specs), after `fees_not_set` and before the per-transaction limit, the lock and every read.
6. READ UNCOMMITTED is refused too, though Postgres runs it as READ COMMITTED: no caller asks for it.
7. `IsolationLevelError` is a plain Error (a 500 through the global filter, text never sent), not a `MoneyError`: it is a
   programming error, never a refusal a person can meet.

**Process note:** one wait loop in this session called `pgrep -f` with a pattern (read only; it killed nothing and was stopped
at once). Every process stopped here was one this session started, by PID.

**NOT RUN**
- A served money-moving route on backend main refusing over HTTP with the class-guard rule and the level check in the real
  app: none is served on main. Run here on the MONEY-17 trial merge only. Unblocked when MONEY-17 (or NUV-05, NUV-06) is on
  backend main.
- Dashboard lint, typecheck, build and screenshots, and app screenshots: no dashboard or app file changed (docs and
  `BACKEND_GAPS.md` only here), so there is no screen to shoot. Unblocked if a later round changes one.

## Verifier report

Verifier, 8 Oct 2026. Independent session; wrote none of this task's code. Checked backend `wmt/FIX-21` `301d56a`
(backend main `657a152` merged in; main had not moved at the start or at the end of this check) and this repo's
`wmt/FIX-21` `5175272` (mobile main has moved on to `d85492b` since the builder merged `98f16c6`: the lead's merge).
Fresh detached worktrees `vf21b` (branch), `vf21main` (main), `vf21t` (a local trial merge of `301d56a` with backend
`origin/wmt/MONEY-17`, which moved to `665c7d9` after the builder's trial on `66b86bb`; never committed or pushed),
`vf21id` (wawu-id `fb8717e`, its own `npm ci`) and `vf21m` (this repo). Databases `vf21_*_test`, all dropped; ports 5851
to 5854; every live server ran in a private network namespace (loopback only, Postgres through a unix-socket relay;
`api.nuvion.dev` did not resolve there and the proxy was unreachable), so no Nuvion, Fintava, wawuafrica.com or AI host
could be called and none was. Evidence: `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/vf21/`
(`vf21/` below).

**Verdict: no open defect, status review.** Both capability checks hold, by their real causes and live: the coverage
spec reads class and method guards in the order Nest runs them (30 of 30 live answers on a built server match the order
it reads) and counts a route as money-moving by its PIN guard or a debit's own codes; the level check refuses REPEATABLE
READ, SERIALIZABLE and READ UNCOMMITTED by reading the caller's own transaction (a 500 whose body names nothing, nothing
written, the key given back). Three findings, none a defect: shapes of route the coverage spec still cannot see (F1),
four of my mutants the branch's specs do not kill (F2), and a caller that passes no transaction, or the service client
as one, keeps neither the lock nor the check (F3).

| Pass | Result | Evidence |
|------|--------|----------|
| V1 Gates | passed | `tsc --noEmit` 0 (branch, and the MONEY-17 trial). eslint (no `--fix`) on the 6 changed `.ts` files: 0. Gates: branch 9 run / 976 files / 16 fail / 66 warn / 76 accepted, main 974 / 16 / 66 / 76; the 16 FAIL lines identical, the whole output identical but for the file count; no new PROVISIONAL. Tripwire on added lines: 0. Em-dashes in added lines (both repos): 0. Key-shaped scan of the backend diff: 0. No fenced file touched (`src/common`, `src/app.module.ts`, `prisma/`, `contract/`, the protected suite). `contract:build` leaves `contract/openapi.json` unchanged, byte-identical to main's. This repo's `npm run check` on `5175272`: first run exit 1, two jest timeouts at load 14 (A26 `OpenWalletScreen`, Z3 notifications; 1,375 of 1,377), the two files alone 128/128; with this report: **exit 0** (typecheck, lint, jest 76/76 suites and 1,377 tests, gates 9 run / 346 files / 0 fail / 0 warn, 260 tasks). | `vf21/tsc-branch.txt`, `eslint-branch.txt`, `gates-branch.txt`, `gates-main.txt`, `tripwire.txt`, `keyscan.txt`, `contract-build.txt`, `mobile-check-*.txt`, `mobile-rerun-2.txt` |
| V2 Contract | passed | The branch's `src/money/limits` and `src/money/fees`: 134/134. My bypass spec (13 fixtures beyond the builder's six, read by the spec's own functions and served over HTTP with recording guards) and my isolation spec over real Postgres: tables below. | `vf21/bypass-run1.txt`, `vf21/specs/`, `iso-run1.txt`, `iso-run2.txt`, `limits-fees-branch.txt` |
| V3 Regression | passed | Protected suite `run.sh --fresh HEAD`, lock `origin/main` `657a152`: **253/253, all 244 required**. `hub-rate-limits` on the host: 22/22. Full suite in my own network namespace (copies of `t3ns/ns2.sh` and `inner2.sh`: worktree, database and paths changed, `/dev` redirects written to files, `--json` added; a fresh migrated and seeded `vf21_full_test` per shard, the namespace's own mock on its :4001, checked before, during and after), three serial `--shard=i/3` on `301d56a`, load 4 to 9 at each start: **209 suites, 5,570 tests, 5,543 passed, 4 skipped, 23 failed in 2 suites**, none in a file this task changed: `hub-rate-limits` 11 (needs a non-loopback interface) and `fintava-stall` 12 (its timing bound, load 9 to 12). Each alone on the host: `hub-rate-limits` 22/22, `fintava-stall` 120/120 at load 7. | `vf21/protected.txt`, `hub-rate-limits.txt`, `vf21/ns/full-s*.json`, `ns/port4001-s*.txt`, `ns/shard-loads.txt` |
| V4 Field trace | passed | What FIX-21 adds, writer to reader: `transaction_isolation` is read once per `assertMayMove` given a `tx`, through that `tx` (a level set by Prisma's option, by `SET TRANSACTION` as the first statement, or by the database's own default, all seen); `IsolationLevelError` is thrown only there and read only by the global filter (500, generic body, the message logged server-side), on MONEY-17 by `IdempotencyFilter` first (it gives the key back, then the same 500). The coverage spec reads `GUARDS_METADATA` (class, then method, inherited) and `swagger/apiResponse` (method only, F1); its walk equals Nest's own route table: 458 routes read, 458 `Mapped` at boot of the trial build, the same set. | `vf21/v9/spec-mounted.txt`, `boot-mapped.txt`, `mounted-vs-boot.diff` (empty) |
| V9 Live seam | passed | Built servers in a private namespace: wawu-id (`dist/main.js`, its own `npm ci`, own database, argon2 password, RS256 keys from openssl) on :5851; the Hub (the MONEY-17 trial build with the spec's six fixtures mounted in AppModule by a throwaway module) on :5852, checking wawu-id's JWKS. Signed in through `POST /auth/login` (RS256, `sub` the seeded person); `GET /money/wallet` answered that person's own `not_open` state. Details below. | `vf21/v9/drive-A.txt`, `drive-B.txt`, `drive-C.txt`, `hub-*.log`, `standin-calls.jsonl`, `ns-check.txt` |

**Capability checks, as written**
1. The coverage spec fails each of the verifier's two controllers, and passes on main's routes: **passed.** Each of the
   four bad fixtures fails with the builder's lines; both guarded versions pass; main's mounted routes pass. Mounted for
   real in AppModule (the trial build), the spec's own "every mounted route keeps the rules" test fails on exactly the
   four bad fixtures (`v9/coverage-with-fixtures-mounted.txt`).
2. `assertMayMove` refuses in a REPEATABLE READ or SERIALIZABLE transaction; under READ COMMITTED parallel movements
   never pass a limit (at least 50 rounds): **passed** (250 rounds of my own, below).
3. Protected routes 253/253: **passed.**

**The coverage spec, by its real cause.** Each shape read by the spec's own `routesOf` and `coverageFailures`, then served
over HTTP with recording guards (`vf21/bypass-run1.txt`); "Nest ran" is what ran up to the first refusal.

| Shape | The spec fails it | Nest ran | Should it fail |
|---|---|---|---|
| A custom class decorator wrapping `UseGuards(WalletGateGuard, TransactionPinGuard)`, under `@UseGuards(WawuAuthGuard)` | yes: gate and PIN before the fees guard | gate, PIN, before the sign-in (class decorators apply bottom-up, and the spec reads them so) | yes |
| `applyDecorators(UseGuards(...), Controller(path))` on the class | yes | sign-in, gate, PIN | yes |
| A custom method decorator wrapping the gate and the PIN, below `@RequireFeesSet()` | yes | sign-in, gate, PIN | yes |
| A mixin that adds the handler | yes (moves money, no fees guard, neither code) | sign-in, gate, PIN | yes |
| An abstract base class carrying the class guards (with and without the controller's own `@UseGuards`) | yes | gate, PIN | yes (no fixture locks it: F2) |
| A guard given as an instance on the class | yes | sign-in, PIN (the instance) | yes (no fixture locks it: F2) |
| `@UseGuards` given an array | cannot exist: Nest throws at decoration | | |
| A route whose handler is renamed | no effect: a route is its method and path, and so is the allow list; a second route at a named key fails the allow-list test (a duplicate key) | | |
| A controller in a module AppModule imports | yes (the walk follows imports and `forwardRef`) | | yes |
| A controller listed only in a dynamic module's own `controllers` | **no**: the walk sees nothing | sign-in, gate, PIN (`403 pin_required`) | yes (F1) |
| A subclass of `TransactionPinGuard`, given by class, on a route documenting only the wallet gate | **no** (not money-moving) | sign-in, gate, the PIN subclass | yes (F1) |
| The same subclass on the class with `@RequireFeesSet()` last | yes (only the sign-in may come first) | | yes |
| A global guard (`APP_GUARD`; Nest has no per-module guard: `APP_GUARD` in any module is global) | **no**: the spec reads no global guard | the global guard, then sign-in, fees | arguably (F1) |
| Debit codes documented on the class with swagger's `@ApiResponse` (the contract shows them on the route) | **no** | sign-in, gate (201) | yes (F1) |
| A debit that documents nothing and carries no PIN guard | **no**, and not catchable from metadata: nothing on the route says it moves money; only a deny-by-default list of non-GET money routes, or a check in the service, would | sign-in, gate (201) | (F1) |
| `@RequireFeesSet()` on the class, the gate and the PIN on the method | passes, correctly | sign-in, fees (`503`) | no |

The four named PIN routes, read: `PUT money/pin` (`TransactionPinService.change`: one `transactionPin` update),
`POST money/pin/verify` and `POST money/approval/verify` (the guard's check, then a PIN-state read), `PUT money/device`
(`ApprovalDeviceService.register`: challenges deleted, the device upserted). None reaches the ledger, the wallet provider
or a fee: all four are money-free. The reading order equals Nest's at runtime: the builder's HTTP test passes, my 13
fixtures ran exactly the prefix the spec reads, and live 30 of 30.

**The isolation check** (`vf21/specs/zz-vf21-iso.contract.spec.ts`, real Postgres; each movement checks in the
transaction that writes its pending row, with a 100 ms pause):

| Run | Rounds | Result |
|---|---|---|
| 2 at once, 600 each, daily 1000 | 50 | every round 1 passes, 1 `limit_reached` daily, 600 written |
| 10 at once, 300 each, daily 1000 | 50 | every round exactly 3 pass, 7 daily, 900 written |
| 2 at once, 600 each, monthly 1000, no daily | 50 | every round 1 passes, 1 monthly |
| 10 at once, 300 each, monthly 2000, 500 moved earlier this month | 50 | every round exactly 5 pass, 5 monthly |
| 10 at once, 200 each, daily 1000 and monthly 1500, 800 moved earlier this month | 50 | every round exactly 3 pass, 7 monthly |
| REPEATABLE READ, SERIALIZABLE, READ UNCOMMITTED, each with no limit, a daily, a monthly, a per-transaction limit | | `IsolationLevelError` naming `repeatable read`, `serializable`, `read uncommitted`; a plain Error, not an HttpException |
| The order | | nuvion with fees unset, at REPEATABLE READ or SERIALIZABLE: `fees_not_set`; fees set, at REPEATABLE READ: the level; at REPEATABLE READ with an amount above the per-transaction limit, or of 0: the level; at READ COMMITTED: `limit_reached` per_transaction |
| `SET TRANSACTION ISOLATION LEVEL SERIALIZABLE` as the first statement of a default transaction | | refused naming `serializable` (the level is read inside the caller's transaction; a fresh connection would read `read committed`) |
| The database default set to REPEATABLE READ (`ALTER DATABASE`), a fresh client, `$transaction` with no level | | the transaction runs at `repeatable read` and is refused; naming READ COMMITTED explicitly passes |
| No `tx` | 20 | no lock taken, no level read: both movements pass every round, 1200 written against 1000 (F3) |

**V9, live** (`v9/drive-*.txt`). Phase A, `WALLET_PROVIDER=nuvion`, fees unset: the six fixtures in five states (no
token; signed in with no wallet and a PIN sent; a wallet and no PIN; a wrong PIN; the right PIN), each answer predicted
from the order the spec reads: **30 of 30 as predicted.** The class-guarded debit answers `409 wallet_not_open`, then
`403 pin_required`, `403 pin_incorrect`, and `503 fees_not_set` only with the right PIN; its fixed version
`503 fees_not_set` in every signed-in state. With fees unset the three bad debits used three PIN tries (tries left 5 to
2), the fixed ones none. MONEY-17's `GET /money/payments/quote` and `POST /money/payments` (no key and no PIN; a key and
a wrong PIN): `503 fees_not_set`, no try used, no Idempotency-Key row. Phase B, `fintava` through a local stand-in, the
database's default level REPEATABLE READ: quote 200 (total 102325, balance 500000), the payment `500` with body
`{"statusCode":500,"message":"Something went wrong. Please try again.","data":null}` (no level, no READ COMMITTED), no
`WalletPayment`, no ledger row, the key given back, the stand-in asked only for the balances and never for a transfer;
the server log names `"repeatable read"`. Phase C, the default back to READ COMMITTED: the claim passes, the transfer
reaches the stand-in (which refuses it), and the payment is `failed`, as MONEY-17 answers a refusal.

**MONEY-17 interplay** (trial `301d56a` + `665c7d9`, local, never pushed): merges with no conflict (the coverage spec and
`CONVENTIONS.md` auto-merge); `tsc` 0; the coverage spec passes with MONEY-17's routes (`POST money/payments`
money-moving and properly guarded; `GET money/payments/quote` not money-moving, the fees guard first, `fees_not_set`
documented); `src/money/limits` and `src/money/payments` 189/189 (`wallet-payment.contract.spec.ts` included);
`src/money/tests`, `gate`, `pin` and `fees` 249/249. MONEY-17's claim passes its own `tx` at the default level.

**Mutants** (my own, 14, each applied to the branch, the branch's specs run, the file restored, tree clean after each;
`vf21/mut/`): **10 killed, 4 survived.** Killed: method guards read before class guards; the wallet gate allowed before
the fees guard; `pin_incorrect` not a PIN code; a guarded debit added to the allow list; only method guards checked
before the fees guard; any level starting `read` accepted; the level checked after the lock; `default_transaction_isolation`
read instead of the transaction's own; `IsolationLevelError` an HttpException carrying its text; limits before
`fees_not_set`. Survived (F2): a guard instance no longer counted as its class (MV2); the walk ignoring a dynamic module's
imports (MV7); class guards read with `getOwnMetadata`, so inherited class guards are missed (MV8); the level checked
after the per-transaction limit (ML2). Today's code behaves correctly in all four (my specs above); nothing on the branch
locks it.

**Findings** (no `defect`)
- **F1, test gap: shapes the coverage spec cannot see.** Reproduction: `vf21/specs/zz-vf21-bypass.spec.ts` (the
  branch's spec with my fixtures appended), cases `dynamic`, `pin-subclass`, `class-documented`, `proper under a global
  guard` and `silent`. (a) A controller listed only in a dynamic module's `controllers` (`{ module, controllers: [...] }`,
  the `forRoot()` shape) is mounted by Nest (`DependenciesScanner.reflectControllers` reads dynamic metadata) and never
  read: the class-guarded debit served that way answers `403 pin_required` and the spec stays green. (b) A subclass of
  `TransactionPinGuard` given by class is not "the PIN guard" to `isGuard` (an instance of it is). (c) Codes documented
  on the class reach the contract but are not read. (d) Global guards are not read at all. (e) A debit with no PIN guard
  and no debit code cannot be told from a read. None of these shapes exists today: the walk's 458 routes are Nest's 458.
  Cheap closes: collect `controllers` from dynamic modules in `reachable()`; `isGuard` also true when
  `guard.prototype instanceof type`; read class-level `swagger/apiResponse` with the method's; hold the `APP_GUARD`
  providers of reachable modules to `[ThrottlerGuard]`; for (e), a deny-by-default list of non-GET `money/` routes.
- **F2, test gap: four of my mutants survive** (above). One fixture each (an instance guard, an abstract base carrying
  class guards, a dynamic-module import, an amount above the per-transaction limit at REPEATABLE READ) would lock
  decisions 4 and 5 as written.
- **F3, unclear (for the lead): the check needs a transaction but does not ask for one.** `assertMayMove` without `tx`
  takes no lock and reads no level (the service comment says so): 20 of 20 rounds, two movements of 600 both pass a
  daily 1000. Passing the service client as `tx` compiles with no cast (`tsc` 0) and passes the level check, since an
  autocommit statement runs at READ COMMITTED, while the advisory lock ends with its own statement: 20 of 20 rounds over
  the limit (`vf21/roottx-run.txt`). No caller does either today (main has none; MONEY-17's claim passes its own `tx`).
  Making `tx` required on `assertMayMove`, and refusing `tx === this.prisma`, would close both.

**Decisions, judged**
1. What counts as moving money (the PIN guard, or a code only a debit or a PIN check answers; a quote held by the fees
   rule): agree. MONEY-17's quote is classed correctly. A debit approved only by the phone, checked in the service,
   would document `device_approval_refused`, which is not counted; no such route is planned.
2. The four PIN routes named, without the fees guard: agree; each read and money-free (above).
3. Only `WawuAuthGuard` before `FeesSetGuard`, the global throttler aside: agree; the spec reads no global guard at all,
   so "aside" covers any future global guard too (F1 d).
4. Inherited handlers read; an instance counts as its class: agree; neither instances nor inherited class guards are
   locked by a fixture (F2), and a subclass given by class is not counted (F1 b).
5. The level checked whenever there is a `tx`, after `fees_not_set`, before the per-transaction limit, the lock and every
   read: agree; verified, the per-transaction part untested on the branch (ML2).
6. READ UNCOMMITTED refused too: agree.
7. `IsolationLevelError` a plain Error, a 500 whose text is never sent: agree; verified on a real server, through
   MONEY-17's `IdempotencyFilter` as well.

**NOT RUN**
- A served money-moving route on backend main refusing over HTTP: none is served on main; run here on the local
  MONEY-17 trial only. Unblocked when MONEY-17 (or NUV-05, NUV-06) is on backend main.
- The full suite as one in-band process: run as three serial shards, as the builder did (memory). Unblocked by a
  machine where one `npm run test:contract` fits in memory beside the other sessions.

## Lead merge note (8 Oct 2026)

Merged after the independent verifier (report 2d97aa2, no defect) and backend PR #92 (merge 283aa8c): the money-route coverage spec reads guards in Nest's own order (controller, then method, inherited handlers included), counts a route as money-moving by its PIN guard or a debit-only refusal, lets only WawuAuthGuard run before FeesSetGuard, and names the four PIN-only routes; assertMayMove refuses any isolation level but READ COMMITTED inside the caller's transaction. Protected suite 253/253; no route or contract change. The verifier's F1 to F3 (the lock without a real transaction, four surviving mutants, route shapes the spec cannot see) are FIX-26.

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
