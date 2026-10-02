---
id: MONEY-11
title: Balance
owner: YOU
area: MONEY
order: 69
priority: launch
repo: wawu-backend
type: money-path
status: verifying
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
- **Merge precondition (owner):** mounting the client means production (NODE_ENV=production) does not boot until `FINTAVA_BASE_URL` is in `/etc/wawu/hub-api.env`; set it before this deploys (no key needed: the route then answers 503).
- **Gaps:** `wallet_opening` is declared but not answered until MONEY-12 records opening; SHARED-CHANGES row 11 (`unwrap` returns the envelope while generated types describe `data`; `money.ts` reads `data` until it is fixed).

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
