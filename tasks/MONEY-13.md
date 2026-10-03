---
id: MONEY-13
title: No wallet yet: money screens lead to Open your wallet
owner: YOU
area: MONEY
order: 82
priority: launch
repo: wawu-backend
type: money-path
status: review
depends_on: [MONEY-12]
decisions: [R-10]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# MONEY-13 · No wallet yet: money screens lead to Open your wallet

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/` (Fintava's docs and real sandbox responses, task OPS-02)
- `docs/fintava/fees.md` (what each payment costs; the dashboard rates, final)

## Goal

Nobody has a wallet until they open one (R-6), new and existing users alike. Every money endpoint answers 'no wallet yet' the same way, and every money screen leads to Open your wallet.

## Scope

A consistent `no_wallet` error on every wallet and payment endpoint, in the contract (MONEY-04). The screens
that lead to Open your wallet are wired by KYC-05 (the pay sheet) and by each screen task that draws a way in
(docs/WORKFLOW.md section 7, "Links between screens").

## Capability checks

- [ ] A signed-in user with no wallet gets the same `no_wallet` answer from every wallet and payment endpoint (no 500s).

## Builder report

Builder, 3 Oct 2026. wawu-backend `wmt/MONEY-13` `35b68af` (on main `6d48c97`); mobile `wmt/MONEY-13` (on main `12aa3c9`). Neither main moved. Evidence: `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/m13/` (logs, `full*.json`, `live-drive.json`, `sbx/`).
- **Built:** a wallet gate, `src/money/gate/wallet-gate.ts`: `WalletGate.requireOpen`, `WalletGateGuard`, `@RequireOpenWallet()`, `@CurrentWallet()`, and `walletStateOf`, the one rule `GET /money/wallet`'s `state` and the gate's code both use (so they never disagree). It answers before the PIN, the body, the quote or Fintava, reads only our database, and drops an `X-Transaction-Pin` header unread when it refuses. `@RequireTransactionPin()` now brings the gate ahead of the PIN. Gated: `GET`, `POST`, `PUT /money/pin`, `POST /money/pin/verify` (closes G-12) and `GET /money/wallet/balance` (its own check removed; it takes the gate's wallet). MoneyModule exports the gate. Files: the gate and 3 specs (new), `money.module.ts`, `money-pin.controller.ts`, `transaction-pin.guard.ts`, the balance controller and service, `wallet-opening.service.ts` (view uses `walletStateOf`), CONVENTIONS section 7, the MONEY-09 PIN spec and the MONEY-11 balance spec. Mobile: sandbox `34-` and its README row, BACKEND_GAPS.
- **The `no_wallet` answer is the contract's `409 wallet_not_open`** (MONEY-04; the app already maps it to `no_wallet` in `src/api/money.ts`). One body on every route: message "You don't have a wallet yet. Open your wallet to continue."; `409 wallet_opening` "Your account is still being opened. Check again in a moment.". Not gated: Open your wallet itself (`/money/identity/*`, `POST /money/wallet/open`), `GET /money/wallet` (200 `not_open`), and the declared bank list and name check (WALLET-09).
- **Check, "the same `no_wallet` answer from every wallet and payment endpoint, no 500s":** `wallet-gate.contract.spec.ts` (real MoneyModule, database, RS256 tokens, MONEY-06 client to the stand-in) finds the gated routes from the controllers, not a hand list, and sends each 3 shapes (nothing; a wrong body and a PIN; a malformed PIN and a non-UUID id) as: a new user, BVN checked only, last opening `failed`, both identity stops, and an existing web creator with a Flutterwave wallet and an old PIN: 15 of 15 byte-identical `409 wallet_not_open`, `GET /money/wallet` `not_open`, 0 Fintava calls. Opening `opening`, `unknown`, `conflict` (held) and `open` without the wallet row: 15 of 15 `409 wallet_opening`, GET `opening`. Five wrong PINs without a wallet: 409 each, 0 tries used, old PIN untouched. 30 at once: all 409, one body. A wallet holder passes (PIN set, read, checked; balance from Fintava). No token: 401. Unit spec: the state table (14 rows), header drop, once per request.
- **Every route, held by code:** `wallet-gate-coverage.spec.ts` walks every controller AppModule mounts: a route documenting the gate codes runs the gate and the reverse; the gate runs before the PIN guard; every mounted `/money` route is gated or listed with a reason; every declared `/money` route documents both codes (so it fails the first rule if served ungated).
- **Mutants (9), all killed:** GET pin ungated, PIN guard before the gate, `failed` read as opening, identity stop ignored, no header drop, balance ungated, a route-specific message, gate run twice, gate passing without a wallet.
- **Sandbox (2 reads, `34-money13-no-wallet.md`):** built Hub :4911, stand-in WAWU ID :4912, real register and login. Four kinds of person without a wallet: every gated route, bare and with a PIN and a wrong body, the one body each, 0 Fintava calls; the holder of `1192964482` set and checked a PIN and read the balance from the sandbox (`availableKobo: 0`). Key: 0 of 58 windows in logs, outputs and the staged diff.
- **Runs:** tsc 0; eslint 0 on the 12 changed `.ts` files; money, Fintava, KYC review, identity, purge and rate-limit specs 32 suites 1,318/1,318 (`m13_test`, :4912). Full suite on fresh seeded databases with the mock on :4001 (`lsof` empty before): run 1 (`m13_full_test`) 3,019 passed, 3 skipped, 2 failed, both timing under load from other sessions' jest runs (load 5 to 8 on 4 CPUs): `wallet-opening` "a create that lands after the timeout" (`opening` where `open` expected, line 804) and `ledger-status` "two servers never ask about the same row in one minute" (98 rows, 49 expected). Neither touches the gate; both passed 3 of 3 on that database at load 5.3 to 8.1. Run 2 (`m13_full2_test`): **124 suites, 3,021 passed, 3 skipped, 0 failed**. Protected `--fresh HEAD` 253/253, all 244 required, lock "No change", registry sha256 `767e27bf...`; tripwire 0 of 1,386 added lines; `hub-rate-limits` 10/10, no `@Throttle` added; gates main 16 fail / 10 warn, branch 16 / 10, identical findings (no new warn), baseline OK; `contract:build` byte-stable (`74e3f2d4...`): the contract already declared every code, so no API change and no sync (`sync_contract.py` gave no diff). Mobile `npm run check`: main exit 1 only on a stale `docs/PROGRESS.md`; branch exit 0 (typecheck, lint, 371 tests, gates 0 fail / 0 warn on 96 files, 203 tasks).
- **Defaults (agent), owner may override:** `no_wallet` is `409 wallet_not_open`, not a new code; the two sentences above, one per code, on every route (the balance's "Open your wallet to see your balance." retired); the PIN routes are gated (the PIN is set on A9, after A8); an opening `conflict` held because another WAWU account holds the account reads `opening` (MONEY-12's view), an identity stop `not_open`; `423 wallet_frozen` is never answered by the gate (nothing stores a freeze, G-10).
- **Tests changed, and why:** the MONEY-09 PIN spec's people now hold a wallet (precondition only, no assertion changed); the MONEY-11 balance spec expects the gate's sentence.
- **Filed:** G-12 closed on this branch; G-40 (the web's Flutterwave payment routes take money without a wallet and are protected: WALLET-30); G-41 (a PIN set before the gate stays; A9 must read `pin.isSet`: KYC-04). No SHARED-CHANGES row (no fenced file touched).
- **For the parallel builders (findings):** MONEY-15's history service and WALLET-14's saved-accounts controller check the wallet inline; MONEY-15 imports `BALANCE_OPENING_MESSAGE`, which this branch removes. Whichever merges after this branch replaces the inline check with `@RequireOpenWallet()` and `@CurrentWallet()`; `wallet-gate-coverage.spec.ts` fails until each served wallet route is gated. Small overlaps in `money.module.ts`, `transaction-pin.guard.ts`, `money-pin.controller.ts` (MONEY-14) and `wallet-opening.service.ts` (WALLET-14).
- **NOT RUN:** `opening` and `unknown` openings on the live Hub against the sandbox (its 30 s sweep would ask Fintava about made-up phones): proved against the stand-in; unblocked when Fintava names a sandbox BVN its check passes (question 11) and its selfie success body (question 6), so a real opening can be left in flight. The screens leading to Open your wallet (V6, V7 on screens): KYC-05 (pay sheet), KYC-03, WALLET-01 and each screen task; unblocked when they are built. V10: no screen. CI's `ci-check.sh`: tripwire and lock checked by hand; unblocked by the pull request's CI run (no PR opened, by instruction).

## Verifier report

Verifier, 3 Oct 2026. This is a fresh session that wrote none of MONEY-13's code. I checked wawu-backend `wmt/MONEY-13` `35b68af` (on main `6d48c97`, which has not moved) and mobile `wmt/MONEY-13` `f06ce18`, in fresh detached worktrees `/home/user/wt/vm13b` and `/home/user/wt/vm13m`. Mobile main moved to `3304f1e` (a regenerated `docs/PROGRESS.md` only). A merge of it into the branch conflicts only in that generated file, which `check_tasks.py --write` regenerates.

- **Databases:** `vm13_test`, `vm13_full_test`, `vm13_full2_test`, `vm13_hub_test`, `vm13_protected_test`. All were dropped afterwards.
- **Ports:**
  - the built Hub on :4913;
  - the stand-in WAWU ID on :4914;
  - a counting proxy in front of the Fintava sandbox on an OS-assigned 127.0.0.1 port;
  - my mock on :4001 for the two full runs only. `lsof` was empty before, and I stopped it right after (`lsof-4001-after.txt`). A later :4001 listener is another session's (`/home/user/wt/vm14b2`), not mine.
  All my processes are stopped.
- **Evidence:** `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/vm13/`:
  - `ev/`: logs and JSON results;
  - `live/`: the Hub launcher, the counting proxy and the drive scripts;
  - `mut/`: the mutation runner and per-mutant results;
  - `vm13-attack.contract.spec.ts`: my spy spec. It was copied into `src/money/gate/tests/`, run and removed. Nothing of it is committed.

**Verdict: no open defect. Status `review`.**

| Pass | Result | Evidence |
|------|--------|----------|
| V1 Gates | passed | **Backend:** `tsc --noEmit` 0 (`tsc-branch.txt`); eslint 0 on the 12 changed `.ts` files (`eslint-branch.txt`). Gates: main `6d48c97` 9 run / 619 files / **16 fail / 10 warn** / 76 accepted; branch 9 / 623 / **16 / 10** / 76, with **identical findings** (`gates-vm13main.all`, `gates-vm13b.all`). `check_baseline.py`: 108 entries OK. **Diff against the report:** the 13 backend files in `git diff --stat` are exactly the ones the builder lists. The mobile files are the task file, LOG, PROGRESS, `BACKEND_GAPS.md`, sandbox `34-` and its README row. `transaction-pin.guard.ts` is MONEY-09's PIN guard, not an auth guard, so no SHARED-CHANGES row is needed. **Key scan** (58 eight-character windows, the key read from file into the scanner's environment and never printed): **0 hits** in the backend diff, the mobile diff and every evidence file (`keyscan.txt`). **Mobile:** `npm run check` exit 0: typecheck, lint, 20 suites / 371 tests, gates 9 run / 96 files / 0 fail / 0 warn, 203 tasks (`mobile-check-before.log`). |
| V2 Contract | passed | **Full suite, the way the deploy runs it:** fresh migrated and seeded databases, my mock WAWU ID on :4001 with a keypair made as `deploy.yml` makes it, CI's environment, `npx jest --runInBand --forceExit`. <br>- Run 1 (`vm13_full_test`): **124 suites, 3,021 passed, 3 skipped, 0 failed**. <br>- Run 2 (`vm13_full2_test`, load 5 to 6.5): **124, 3,021, 3, 0 failed** (`full1.json`, `full2.json`). <br>The builder's two timing failures (wallet-opening late create, ledger-status two servers) did not occur in either run, so the 10-run load test the brief makes conditional on seeing them was not needed. <br>**Inside:** `wallet-gate.contract` 16/16, `wallet-gate-coverage` 7/7, `wallet-gate` 22/22, `money-pin.contract` 25/25, `money-balance.contract` 14/14, `hub-rate-limits` **10/10**. Money and Fintava specs alone on `vm13_test`: 29 suites, 1,273/1,273 (`money-specs.json`). <br>**Contract:** `npm run contract:build` leaves `contract/openapi.json` byte for byte (sha256 `74e3f2d4...`), equal to mobile's copy. Every gate code was already declared, so there is no API change. |
| V3 Regression | passed | `scripts/protected-routes/run.sh --fresh HEAD` (`vm13_protected_test`): **253/253, all 244 required** (`protected.log`). `lock-diff.py 6d48c97 35b68af`: "No change". `.pipeline/protected-registry.json` sha256 `767e27bf...` on main and branch. CI tripwire, run as `ci-check.sh` runs it: **0 of 1,265 added lines** match (`outside.diff`). |
| V4 Field trace | passed | The answer's only inputs are `FintavaWallet` (written by MONEY-12's `record()`, in one transaction with the opening row going to `open`) and `FintavaWalletOpening.state`/`failure` (MONEY-12). Both are read by `walletStateOf`, which `GET /money/wallet` (`view`, and `isOpening` through it) and the gate share. No other rule is left: the balance's own check and its two sentences are gone, and nothing else imports `stoppedOnIdentity` for a state. The wallet the gate finds reaches the balance as `walletId` (mutant M7 below). |
| V6 States | passed | Every state was reached through its cause on the built Hub (real login) and in specs. **`not_open`:** nothing stored; a web creator with a `CreatorWallet` and a completed Flutterwave earning; `failed` / `not_created`; `conflict` with `phone_held_by_other_identity`; `conflict` with `phone_holder_bvn_unreadable`. **`opening`:** `opening`, `unknown`, `conflict` with `held_by_another_account` (the value MONEY-12 really writes), and `open` with no wallet row. **`open`:** the wallet row alone, with a stale `failed` row, and with no opening row. **`401`** with no token on all 5 gated routes (`live-drive.json`, `live-transitions.json`). |
| V7 Flow walk | passed (backend); screens NOT RUN | **Built Hub, real sign-in** (`/auth/register` then `/auth/login` on the stand-in, no minted token). One person walked the whole sequence with `GET /money/wallet` and `GET /money/pin` at each step: <br>- nothing: `not_open` / 409 `wallet_not_open`; <br>- opening `failed`: `not_open` / 409; <br>- second attempt claimed: `opening` / 409 `wallet_opening`; <br>- row `open`, wallet not yet written: `opening` / 409 `wallet_opening`; <br>- wallet recorded: `open` / 200 (`live-transitions.json`). <br>So a failed opening followed by a successful one never reads `not_open` while an account exists. The screens are NOT RUN (below). |
| V8 Money | passed | **The rule:** every one of MONEY-12's five states maps to exactly one answer, and a wallet row always wins. The only states that read `not_open` without a wallet row are no row, `failed` (proved not created, or refused before anything was made) and the two identity stops (the phone's Fintava customer is someone else's, MONEY-12 D1). No state in which this person's account exists reads `not_open`. **No bypass, order, side effects and mutants:** see below. |
| V9 Live seam | passed | Built branch Hub (`node dist/src/main.js`, :4913, `vm13_hub_test`), real login. The wallet holder's row points at sandbox account `1192964482`. <br>- `GET /money/wallet` answered `open`, `1192964482`, `john ugochukwu`, `Loma Bank`. <br>- A PIN was set (201), read (200, `isSet: true`) and checked (200 three times, 71 to 106 ms). A wrong PIN answered 403 `pin_incorrect`, `triesLeft: 4`. <br>- `GET /money/wallet/balance` answered 200 `availableKobo: 0`, `no-store`. It was the **only call forwarded to `dev.fintavapay.com`** in the whole run (`fintava-calls.log`). |

**No bypass (built Hub, as the new person and as the web creator, each sending `X-Transaction-Pin` with the creator's right PIN).** `live-drive.json`:

| Request | Answer |
|---|---|
| `HEAD` balance and pin | 409, empty body |
| Trailing slash (`/money/wallet/balance/`, `/money/pin/`, `/money/pin/verify/`) | 409 `wallet_not_open` |
| Upper or mixed case (`/MONEY/WALLET/BALANCE`, `/Money/Pin`, `/money/PIN/verify`) | 409 `wallet_not_open` |
| `?wawuUserId=<the holder>` | 409 `wallet_not_open` |
| `X-Wawu-User-Id: <the holder>` | 409 `wallet_not_open` |
| `X-HTTP-Method-Override` on GET `/money/pin` | 409 `wallet_not_open` |
| `X-HTTP-Method-Override` or `?_method=GET` on POST to the balance | 404 (no override middleware) |
| `PATCH` or `DELETE` `/money/pin`; `.json` suffix; `%77allet`; `%2F` | 404 |
| Raw socket: `//api/hub//money//wallet//balance`, `identity/../wallet/balance`, `./pin`, `;x=1`, `%00` | 404 |
| `OPTIONS` | 204 (CORS preflight, no body) |

**Every mounted money route is covered.** The 296 routes the Hub maps (`mapped-money-routes.txt`) include 12 under `/money`: 5 gated and 7 exempt. Each exemption is justified:
- the 5 `/money/identity/*` routes and `POST /money/wallet/open` are Open your wallet itself, where the gate leads;
- `GET /money/wallet` is how the Wallet tab learns `not_open`.

The 2 declared, unserved exemptions (`GET /money/banks`, `POST /money/banks/name-check`) read no wallet. MONEY-04 declares neither with gate codes, while all 21 other declared `/money` routes carry both (checked from the compiled metadata).

Nothing outside `src/money` reads `FintavaWallet` or calls `FintavaClient` from a user route. The routes outside `/money` that take money are the web's Flutterwave ones (G-40, finding below).

**Order and side effects (spies and counters, not code reading).** I wrote my own spec (`vm13-attack.contract.spec.ts`). It spies on:
- every method of `TransactionPinService`, `FintavaClient`, `WalletOpeningService` and `WalletIdentityService`;
- `argon2.verify` and `argon2.hash`;
- `ValidationPipe.transform`.

Three people were tested: a web creator holding PIN `4826`, an opening in flight, and a held conflict. Each got 60 requests: 5 routes x {right PIN, wrong PIN, malformed PIN, none} x {no body, valid body, a body the pipe refuses}. Results:
- all 409, **one body per person across all 60**;
- **0 calls** to any spied method, Fintava stand-in `seen` 0;
- PIN row `failedTries: 0`, no lock, the hash unchanged and still verifying `4826`.

**Control:** the same spies on a wallet holder see `argon2.verify` x2, `ValidationPipe.transform` x3 and `failedTries` 1, so the zeros above are real. A body the pipe would refuse with 400 gets 409 with 0 pipe calls.

**Live:** 10 right and 10 wrong PINs to `POST /money/pin/verify`, plus `PUT /money/pin` with each, as the web creator. All answers were byte-identical in body and headers, apart from the throttler's per-request counters. The median time was 5.9 ms against 6.4 ms, where an argon2 check takes 71 to 106 ms. The row was unchanged.

Over the whole no-wallet phase, Fintava saw only the opening sweep's `GET /customers/details`, every 30 s for the `unknown` rows. The proxy answered those locally and forwarded none. The gate made no Fintava call.

**Changed specs (focus 4).**
- **MONEY-09 PIN spec:** `newUser()` now also writes a `FintavaWallet` row (and becomes async), and `afterAll` deletes those rows. Every `expect` line is unchanged; no assertion was removed or loosened.
- **MONEY-11 balance spec:** only the two `message` strings changed, to the gate's sentence, plus a comment. The test still asserts the full envelope, `409`, `wallet_not_open` and 0 Fintava calls.

**Mutants: 16 of my own (none of the builder's 9).** Each was run against the gate, PIN, balance, opening and money-contract specs; files restored and hash-checked after each (`mut/`).

| # | Mutant | Result |
|---|---|---|
| M1 | held `conflict` read as `not_open` | killed (3) |
| M2 | `open` without a wallet row read as `not_open` | killed (2) |
| M3 | `unknown` read as `not_open` | killed (22) |
| M4 | the gate ignores the opening row | killed (6) |
| M5 | the header drop leaves `req.headers` | killed (1) |
| M6 | the header drop leaves `rawHeaders` | killed (1) |
| M7 | the gate hands the route `customerId` as `walletId` | killed (10) |
| M8 | an opening row outranks a wallet row in `walletStateOf` | killed (23) |
| M9 | `wallet_opening` carries the not-open sentence | killed (5) |
| M10 | the PIN header is dropped only on `wallet_not_open`, not on `wallet_opening` | **survived** |
| M11 | the once-per-request cache also trusts a client query field (`?w=1`) | **survived** |
| M12 | a new ungated `/money` controller | killed (coverage) |
| M13 | an ungated route under `/payouts` documenting the gate codes | killed (coverage) |
| M14 | an ungated route under `/payouts` not documenting the codes | **survived** |
| M15 | an ungated `/money` route on `@Controller(['money', 'm'])` | **survived** |
| M16 | the gate runs before the auth guard | killed (37; fails closed with 500) |

**Survivors explained:**
- **M10:** the unit test drops the header only on a `not_open` refusal. Today nothing runs after a refusal (spies above), so there is no user impact.
- **M11:** a contrived backdoor. No test tries to pre-fill the gate's per-request cache.
- **M14 and M15** are the coverage spec's limits, recorded in note N1.

### Findings

No defect.

- **`differs-for-recorded-reason`, R-6 (and the task's Goal, "new and existing users alike"):** a web creator with a Flutterwave wallet and real Flutterwave earnings reads `not_open` and gets `409 wallet_not_open` on every Naira route. Their money is in `CreatorWallet`/Flutterwave, which no `/money` route reads (CONVENTIONS section 7).
- **`differs-for-recorded-reason`, backend CLAUDE.md "The web stays on Flutterwave until after launch" and the protected registry (V3):** the web's Flutterwave payment routes are not gated (G-40). The app's `src/api` calls none of them; they appear only in the generated schema.
  - G-40's list is incomplete. It names `/wallet`, `/wallet/withdraw`, `POST /bills/init`, `POST /credits/purchase`, `POST /payments/hosted-link` and legal `init`/`verify`.
  - It omits `POST /tips` and `POST /tips/verify`, `POST /credits/purchase/verify`, `POST /bills/:id/verify`, `GET /wallet/history`, `POST /wallet/resolve-account` and `GET /wallet/banks`. WALLET-30 should work from the full list.

**Notes (not defects, not blocking):**
- **N1, the coverage spec's reach (M14, M15).**
  - It holds every route that documents the gate codes, and every route whose key starts `money/`.
  - A wallet route served outside `/money` without the codes is not caught (M14). Neither is a `/money` route on a controller with an array path, whose key becomes `GET money,m/...` (M15).
  - Since MONEY-14, MONEY-15 and WALLET-14 adopt this gate next, a cheap hardening is to expand array paths in `routesOf`, and to fail on any mounted route outside the exemption list that reads `FintavaWallet` or calls `FintavaClient`.
- **N2:** `wallet-gate.contract.spec.ts` and the unit table use `failure: 'held_by_other_account'`. MONEY-12 writes `held_by_another_account`. The rule treats both alike (any non-identity `conflict` is `opening`), and the live run used the real value.
- **N3, an unknown future state reads `not_open`.** An opening state outside MONEY-12's five reads `not_open`, where main's old balance check read `opening`. Today the five are all there are (`OpeningState`). A task that adds a state must add it to `ON_ITS_WAY`, or a person with money could be sent to Open your wallet.
- **N4, pre-existing (not this branch):** a JSON body over the parser's limit (3 MB) answers **500** "Something went wrong" on the gated routes. It does so for a wallet holder too, because the body parser runs before any guard and `AllExceptionsFilter` does not map its 413. The branch does not touch `src/main.ts`, `src/hub-app-options.ts` or `src/common/`. A malformed JSON body answers 400, also for everyone. Neither reveals wallet state.

### NOT RUN
- **`opening` and `unknown` openings on the live Hub against the sandbox.** On my Hub they were proved through the counting proxy, which answered the sweep locally. Real ones are unblocked when Fintava names a sandbox BVN its check passes (question 11) and its selfie success body (question 6).
- **The screens that lead to Open your wallet** (V6 and V7 on screens): KYC-05 (the pay sheet), KYC-03, WALLET-01 and each screen task. Unblocked when they are built.
- **V10:** no screen.
- **CI's `ci-check.sh` itself:** the tripwire and lock were checked by hand, as CI runs them. Unblocked by the pull request's CI run (no PR opened).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
