---
id: FIX-21
title: The money-route checks see class-level guards, and the limits lock names its isolation level
owner: YOU
area: FIX
order: 225
priority: launch
repo: wawu-backend
type: backend-endpoint
status: verifying
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
TIER-01); this repo `wmt/FIX-21` on main `49ef608`. No migration, no route, no contract change (`contract:build` leaves
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
  258 tasks). A first run at load 12 had two screen tests over the 20 s limit (A26 `OpenWalletScreen`, the settings
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

_Not started._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
