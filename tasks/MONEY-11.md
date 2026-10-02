---
id: MONEY-11
title: Balance
owner: YOU
area: MONEY
order: 69
priority: launch
repo: wawu-backend
type: money-path
status: done
depends_on: [MONEY-06]
decisions: [R-10]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# MONEY-11 · Balance

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/naira-api.md` (what Fintava's API really does; the pages are in `docs/fintava/reference/`)
- `docs/fintava/fees.md` (what each payment costs; the dashboard rates, final)

## Goal

W1: the balance is Fintava's, never a sum of our records.

## Scope

GET balance in kobo from Fintava; a typed 'can't reach your account' error (W6).

## Fintava facts

From `docs/fintava/naira-api.md`; a real sandbox response overrides it.

`GET /customer/wallet/balance/{walletId}` returns `data { balance { bookedBalance, availableBalance }, tier }` in naira, as JSON numbers (`sandbox/08-`). Show `availableBalance`, fetched from Fintava. An unknown walletId is `400 ["Wallet not found"]`, not a 404 (`sandbox/08-`); a frozen wallet's balance can still be read (`sandbox/15-`), so a frozen wallet only refuses through Fintava's own "Kindly confirm both customer accounts are active". (Corrected by the MONEY-11 builder from the sandbox files.)

## Capability checks

- [ ] The balance shown equals Fintava's after every movement.
- [ ] With Fintava unreachable, the app shows W6, not zero.

## Builder report

Builder, 2 Oct 2026, branch `wmt/MONEY-11` in both repos (backend `175f032` on main `433a826`; mobile on main `cdcb7e0`; neither main moved).
- **Backend:** `src/money/balance/` (controller, service, contract spec) serves `GET /money/wallet/balance` (`WalletBalanceView`, unchanged) from `FintavaClient.getWalletBalance` on every call, `Cache-Control: no-store`; declaration removed from `money-wallet.controller.ts`; `MoneyModule` imports `FintavaModule`; additive table `FintavaWallet` (wawuUserId, customerId, walletId, accountNumber; no money figure) with migration and purge-map entry; contract via `npm run contract:build`; CONVENTIONS, WALLET.md, deploy/README updated.
- **Mobile:** `src/api/money.ts` (`fetchWalletBalance`, `walletBalanceQuery` staleTime 0, `balanceProblem`), `src/api/errors.ts` reads money `reason.code` into `ApiError.code`, test `src/__tests__/money-balance.test.ts`, evidence `docs/fintava/sandbox/27-money11-balance.md`. No screen. `npm run api` copied backend origin/main `433a826` (the script reads main by design): no change; after the backend merges only the operationId changes.
- **Check 1, equals Fintava after every movement:** sandbox, real mock login, route vs direct client read: 25000 / 25000, +₦10 26000 / 26000, back 25000 / 25000 kobo (`27-`). 7 balance reads of customer A, 2 ₦10 sends (WAWU to A, A back), fee 0.
- **Check 2, unreachable is W6 not 0:** sandbox with a 50 ms timeout answers `503 provider_unreachable`; double: 500/502/503/504, timeout, hang-up, 2xx without a balance, bad key (401/400/404), 429, unknown walletId, no key (nothing sent), all 503 with no figure.
- **Tests (backend spec, 14):** kobo conversion (1234.56 to 123456, 0.29, 1.15, 0.1, strings, 2^53-1 kobo; 3 decimals and 1e21 refused, not rounded), available only, asked every call, unreachable cases, frozen 423, no wallet 409 (Fintava not asked), auth 401, another user's wallet cannot be named. Mutation-checked (0 on error, frozen branch removed, booked instead of available: each fails).
- **Runs:** tsc 0; eslint 0 on 11 changed backend files and 3 mobile; full `test:contract` on fresh `m11_full_test`: 88 suites, 1847 passed, 3 skipped, 0 failed; protected suite `--fresh` on `m11_protected_test`: 253/253 (244 required), lock untouched; gates 16 fail / 3 warn / 76 accepted on 556 files, the same 16 as main (553 files); baseline check passes. Mobile `npm run check`: before exit 0 (14 suites, 271 tests, gates 0 on 71 files); after exit 0 (15 suites, 278 tests, gates 0 on 73 files, tasks check passes).
- **NOT RUN:** 9 contract suites that hard-code mock WAWU ID port 4001 (blocked-account, credits-state, kyc-submission, mentor, mentor-request, notification, partner-service, privacy-settings, saved-item): this run was barred from :4001; none imports the money code. Unblocked by a run with :4001 free. Frozen and unknown wallet against the sandbox (freezing is a write; covered by the double).
- **Defaults (agent), owner may override:** the `FintavaWallet` table is added here because nothing stored a person's walletId (MONEY-12 writes rows and adds the opening state); no `bookedBalance` (W1 draws one figure, W6 none); a stored walletId Fintava does not know is 503, not `wallet_not_open`; frozen still shows the balance when Fintava reads it (sandbox `15-`).
- **Round 2 (coordinator, rule 6), backend `03a1503`:** the server no longer needs Fintava settings to start. Production with `FINTAVA_BASE_URL` unset builds the client unconfigured: one startup warning (no secret), any key dropped, every call `not_configured`, nothing sent; the balance answers `503 provider_unreachable`, never 0. The settings are needed for the wallet to work, not for the server to start (deploy/README). New spec `production-boot.contract.spec.ts` boots AppModule with `NODE_ENV=production` and every FINTAVA_* empty: boots, health 200, balance 503, no Fintava request, wrong hosts still refused (5 tests; reverting to eager construction fails all 5). Re-run: tsc 0, eslint 0 (12 .ts files), money/fintava/purge 9 suites 277/277, full `test:contract` on fresh `m11_full_test` 89 suites 1852 passed 3 skipped, protected 253/253 on fresh `m11_protected_test`, contract regenerated byte-identical, gates the same 16 (557 files). Mobile: merged main `6dc661a` (R-37), generated files unchanged by `npm run api`/`tokens`; `npm run check` exit 0 (16 suites, 285 tests, gates 0 on 75 files, tasks check passes).
- **Defaults (agent), round 2:** a set but wrong FINTAVA_BASE_URL still stops the server at boot, as MONEY-06 designed (a wrong value is a deploy mistake; unset is the normal state before OPS-10). No new error code: unconfigured answers `provider_unreachable` (W6 either way, so the app needs no second branch).
- **Gaps:** `wallet_opening` is declared but not answered until MONEY-12 records opening; SHARED-CHANGES row 11 (`unwrap` returns the envelope while generated types describe `data`; `money.ts` reads `data` until it is fixed).

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

Verifier, 2 Oct 2026. I wrote none of this code. Checked: backend `wmt/MONEY-11` at `03a1503` (main `433a826`), mobile `wmt/MONEY-11` at `3d7a04e` (main `6dc661a` merged in). Neither main moved during the run. Fresh detached worktrees, databases `v11_*` only, mock WAWU ID on :4731 and the app on :4732. Evidence is in the verifier scratchpad `v11/` (not committed).

**Verdict: PASS.** There are no defects. One `unclear` item and some observations are listed below.

| Pass | Result | Evidence |
|------|--------|----------|
| Diff vs report | passed. Backend 18 files, mobile 9 files. Both match the reports. The backend report does not name `src/money/tests/money-contract.spec.ts`; that file only adds the route to `SERVED_MONEY_ROUTES`, as CONVENTIONS asks. | `git diff --stat` |
| No stand-ins | passed. The branch has no copy of anything on main. `money.ts` uses main's `unwrap` and reads `data` itself. Main has no unwrap that returns `data`, so this works around a gap in main rather than copying something main has. SHARED-CHANGES row 11 is correct: `unwrap` resolves with the whole `{statusCode,message,data}` body while the generated types describe `data`. | `src/api/client.ts`, `src/api/money.ts` |
| V1 Gates | passed. Backend: tsc 0; eslint 0 on the 12 changed .ts files (repo-wide eslint has existing errors in untouched files only); gates 16 fail / 3 warn / 76 accepted on 557 files. These are the same 16 findings, line for line, as main's 16 on 553 files. `check_baseline` passes. Mobile: `npm run check` exits 0 (16 suites, 285 tests; gates 0 on 75 files; tasks check passes). | `gates-branch.txt`, `gates-main.txt`, `mobile-check.txt` |
| V2 Contract | passed. On a fresh `v11_full_test` (migrated and seeded), the full `test:contract` minus the 9 suites below gave 89 suites, 1852 passed, 3 skipped, 0 failed. `npm run contract:build` regenerates `contract/openapi.json` byte-identical (sha256 `fe94f303...`). A structural diff against main shows only the balance route changing: its operationId, its tag, and the removal of `x-wawu-served:false` and the "not served yet" text. | `full-contract2.txt` |
| V3 Regression | passed. `scripts/protected-routes/run.sh --fresh 03a1503` on `v11_protected_test`, lock from origin/main `433a826`: 253/253. `.pipeline/`, the runner, the harness and the lock are unchanged (`git diff` empty). | `protected.txt` |
| V4 Field trace | passed. `availableKobo` flows: Fintava `data.balance.availableBalance` (naira) → `fintavaAmountToKobo` (the one conversion, in the MONEY-06 client) → `WalletBalanceService` (passed through untouched) → `GET /money/wallet/balance` → `fetchWalletBalance` (whole-kobo check) → `Money` (R-21). `bookedBalance` is parsed but never served. `FintavaWallet`: no writer yet (MONEY-12 will write it). Readers: the balance service, plus the purge map (OWNED). | code |
| V6 States | passed. Through real causes on the sandbox: a 50 ms timeout gave 503; an unknown walletId (Fintava `400 "Wallet not found"`) gave 503 and logged once for us; production with no Fintava settings gave 503 with nothing sent. On the local backend: no wallet gave 409 `wallet_not_open` with Fintava not called; no token gave 401. Through the double: 500/502/503/504, hang-up, a 2xx with no balance in six shapes, key 401/400/404, 429, and frozen 423. In mobile, `balanceProblem` maps `provider_unreachable` to unreachable (W6), `wallet_not_open` to no_wallet, `wallet_opening` to opening, `wallet_frozen` to frozen, and offline, 401, 500 and non-API errors to other. An answer without whole kobo (`1234.56`, `"123456"`, null, `{}`, missing `asOf`) is refused as `unknown`, never read as 0. | `sbx-calls.txt`, specs |
| V7 Flow walk | passed (API level; this task has no screen). A real mock login (no injected token) followed the path: no wallet (409), then wallet on record, then balance, then movement, then balance again, then unreachable (503). WALLET-01 walks the screen. | `sbx-calls.txt` |
| V8 Money | passed for a read route. The balance equals Fintava's after every movement (below). It is never a sum of our records: the only table read is `FintavaWallet` (ids). No cache: three reads gave three Fintava calls, every answer (200/409/503) carries `Cache-Control: no-store`, and the mobile query has staleTime 0. Same request twice: each one asks Fintava. PIN, double-debit and webhook replay/forgery do not apply to a read (MONEY-07, MONEY-09, MONEY-10). There is no ledger yet to compare (MONEY-10, MONEY-16). | |
| V9 Live seam | passed. The built app ran against the sandbox with a real mock login, and the route returned values only Fintava has: A 25000 and B 4000 kobo, equal to direct reads of ₦250 and ₦40. | `sbx-calls.txt` |
| V5 Picture | not applicable (`artboards: []`, no screen). I rendered W1/W6 for the facts: W1 draws one figure with kobo; W6 draws none. | `build/design_shots/W1-*.png`, `W6-*.png` |
| V10 | NOT RUN: not in the ticket's passes, and no tester build exists before OPS-10. | |

**Pass 1: equals Fintava, kobo, mutations.**
- **Code path, end to end:** token `sub` → `FintavaWallet.findUnique` → `FintavaClient.getWalletBalance` → `readBalance` → `fintavaAmountToKobo`, which splits the decimal text (no float multiply). More than 2 decimals, `1e21`, NaN, null and non-numbers are refused. The refusal becomes `bad_response`, which the route answers as 503, so nothing is rounded.
- **Sandbox (`dev.fintavapay.com` only):** the route and a direct read agreed at each step.
  - Start: A 25000 / ₦250 and B 4000 / ₦40.
  - ₦10 WAWU→A (`V11-SBX-20261002190102-1`): A 26000 / ₦260.
  - ₦10 A→WAWU (`-2`): A 25000 / ₦250.
  - Both sends had fee 0. A ends where it started.
- **Mutations of `wallet-balance.service.ts`.** Each was killed by the balance spec:
  - 0 on error: 9 tests fail.
  - booked instead of available: 1 fails.
  - a 30 s cache: 3 fail.
  - last-good fallback on error: 1 fails.
  - Fintava asked before the wallet lookup: 3 fail.
  - not_found answered as 409: 1 fails.
  - frozen answered as 503: 1 fails.
- **Mutations of the client:** removing the unconfigured mode fails all 5 boot tests; keeping the key when no URL is set fails 1.
- **Conversion:** plain `x*100` is killed by the balance spec. `Math.round(Number(x)*100)` survives the balance spec but is killed by MONEY-06's unit spec. Below about ₦70 trillion that mutant gives the same answers, so it is equivalent there.
- **Mobile mutations:**
  - no whole-kobo check: 1 fails;
  - missing balance read as 0: 1 fails;
  - unreachable dropped: 1 fails;
  - frozen mapped to unreachable: 1 fails;
  - staleTime 30 s: 1 fails;
  - `reason.code` not read: 3 fail.
- Every mutated file was restored. `git status` is clean in both worktrees.

**Pass 3: rule 6, production boot.**
- **Unset settings:** I booted the BUILT app (`node dist/src/main.js`) under `env -i` with `NODE_ENV=production` and no FINTAVA_* variable in the process environment (checked in `/proc`). It logged one warning ("FINTAVA_BASE_URL is not set...", no secret). Results: `/health` 200, `/shop/products` 200, balance 503 `provider_unreachable` with `no-store`, no wallet 409, no token 401.
- **Key set, URL unset:** the key is dropped. A fetch recorder preloaded into the app logged 0 outbound requests; the same recorder logged every sandbox call in the sandbox run, so it does record. The log has `not_configured` and no 8-character window of the key.
- **Set but wrong:** each of these stops the server at boot with `FintavaConfigError` (exit 1), and the key does not appear in the output: `https://evil.example.com`, `https://dev.fintavapay.com.evil.com`, `http://localhost:9`, `http://dev.fintavapay.com`, and a correct host with `FINTAVA_TIMEOUT_MS=15s`.
- **Ruling on the builder's default (refuse at boot): accepted.** Unset is the normal state before OPS-10 and now boots. A wrong value can only come from an operator editing `/etc/wawu/hub-api.env`. Failing at once, with one line naming the variable, is better than a server that starts and shows W6 to every user for a mistyped live URL. The cost: `deploy.sh` has no rollback, so the OPS-10 runbook should restart and check `systemctl is-active` and `/health` straight after editing that file. This is noted for OPS-10, not a defect here.
- **Where the key goes:** in the sandbox run every outbound request went to `https://dev.fintavapay.com/api/dev/customer/wallet/balance/{id}` with the Authorization header; nothing else was called.

**Pass 4: the `FintavaWallet` table.**
- The migration is additive (one table, 3 unique indexes) and applies on a fresh database (`v11_mig_test`, `v11_boot_test`, `v11_full_test`).
- `prisma migrate diff` against the schema shows only the existing `ContentPiece_specializations_idx` drift (from before this task).
- It holds ids only (`wawuUserId` PK, `customerId`, `walletId`, `accountNumber`, timestamps) and no money figure.
- The purge-map entry `OWNED` is right, and `account-data-map.spec` enforces coverage.
- **Ruling: accepted.** It stores exactly what MONEY-12's ticket says to store (customerId, walletId, account number). Without it the route has no walletId to ask for.
- **With MONEY-07 (`9941aa0`, read-only):** `20261002180000_fintava_wallet` sorts before `20261002180000_fintava_webhook_event`. On `v11_both_test` both applied in order (FintavaWallet and FintavaWebhookEvent both exist). On `v11_both_rev_test`, MONEY-07's migration was applied first and MONEY-11's was added afterwards; `migrate deploy` applied it and both tables exist.

**Merge note (for whoever merges second):** `git merge-tree 03a1503 9941aa0` conflicts in three files:
- `prisma/schema.prisma`: both append a model at the end. Keep both.
- `deploy/README.md`: both add text to the FINTAVA block. Keep both.
- `contract/openapi.json`: regenerate it with `npm run contract:build`; never merge it by hand.

`src/fintava/fintava-config.ts` auto-merges. With MONEY-07's `FintavaWebhookModule` in AppModule, re-run `production-boot.contract.spec.ts` after the merge, so the webhook module is also seen to boot without FINTAVA_*.

**Pass 5: the module move.**
- On main, AppModule mounted nothing from `src/fintava`. Now `MoneyModule` imports `FintavaModule`, and that is the only new provider at boot.
- The balance declaration left `money-wallet.controller.ts`. `GET /money/wallet` is still declared only (MONEY-12).
- No other route, schema or module changed. The protected 253/253 and the contract structural diff above prove it.

**Port 4001 and NOT RUN.**
- **NOT RUN:** the 9 suites that hard-code :4001: blocked-account, credits-state, kyc-submission, mentor, mentor-request, notification, partner-service, privacy-settings, saved-item.
  - grep: none of them imports `money/`, `fintava/` or AppModule, and nor do their feature modules.
  - They run once :4001 is free.
- **Port 4001 incident:** in my first full run, `account.contract.spec` reached :4001. It reads `WAWU_ID_BASE_URL_TEST`, which defaults to :4001, so it logged in on MONEY-07's mock. That was one login call; nothing was written. Its 3 DELETE tests then got 401, because that mock signs with other keys. I re-ran on a fresh database with `WAWU_ID_BASE_URL_TEST` pointed at :4731, and all 5 passed. The counts above come from that clean run.
- **Other NOT RUN items:**
  - A frozen wallet against the sandbox: freezing is a write, which I did not do.
  - V10 (above).

**Sandbox calls (all `dev.fintavapay.com`, never live):** 12 in total.
- 10 balance GETs:
  - through the route: A, B, the unknown wallet, A, A, and A again, which was aborted at 50 ms;
  - direct: A, B, A, A.
- 2 sends of ₦10, wallet to wallet (one round trip).
- I added a key scanner (any 8-character window of the key, self-tested on a planted window). It found 0 hits in:
  - both branch diffs and every commit patch in both ranges;
  - the app logs;
  - this report.

**Findings**
1. `unclear`: mobile `src/api/**` is fenced (WORKFLOW section 4). This ticket does not name it, but the branch adds `src/api/money.ts` and edits `src/api/errors.ts` with no SHARED-CHANGES row, while it does file one for `client.ts`. The edit is additive and changes nothing that works today: only `MoneyError` sends `reason`, and no screen reads `ApiError.code`. The owner should either accept it as covered by the scope's "typed ... error (W6)", or queue it. It is not a defect.
2. Observation: on a frozen wallet the route answers 200 with the balance, because Fintava reads frozen balances (`15-`). It gives 423 only if Fintava refuses the read. That is the builder's recorded default, and I accept it. The app's `frozen` state can be reached only once MONEY-13 records frozen state or Fintava changes behaviour.
3. Observation, for WALLET-01: `walletBalanceQuery` sets no retry. Under `src/api/query.ts` (retry on server errors, once SHARED-CHANGES row 1 lands), a 503 is retried before W6 shows. The backend sends `retryAfterSeconds: 30`.
4. Observation: when the JSON number has 16 or more significant digits (balances above about ₦10 trillion), `String(n)` may not reproduce Fintava's text. That cannot be fixed without the raw JSON and is not reachable in practice.

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._

**Lead at merge (2 Oct 2026):** the verifier's finding 1 (`src/api/money.ts` and `src/api/errors.ts` are fenced files changed without a SHARED-CHANGES row) is accepted as part of this ticket: the typed W6 error is the ticket's own scope, and nothing live reads `ApiError.code` yet. Finding 3 (no retry before W6) goes to WALLET-01 with SHARED-CHANGES row 1. Backend PR #28 merged as ac2a057; contract re-synced from it.
