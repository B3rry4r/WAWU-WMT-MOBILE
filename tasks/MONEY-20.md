---
id: MONEY-20
title: Wallet provider seam, one interface with Fintava behind a switch
owner: YOU
area: MONEY
order: 181
priority: launch
repo: wawu-backend
type: backend-refactor
status: review
depends_on: [MONEY-06, MONEY-07, MONEY-08, MONEY-09, MONEY-10, MONEY-11, MONEY-12, MONEY-13, MONEY-14, MONEY-15, WALLET-14, WALLET-15]
decisions: [R-39, R-1, R-19, R-20]
passes: [V1, V2, V3, V9]
artboards: []
---
# MONEY-20 · Wallet provider seam, one interface with Fintava behind a switch

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- DECISIONS.md R-39 (this task's ruling)
- The lead's Fintava inventory and Nuvion research (6 Oct 2026, lead's scratchpad `nuvion/FINTAVA-INVENTORY.md` sections 2, 7, 8, and `nuvion/NUVION-RESEARCH.md` with the raw docs in `nuvion/docs/`)

## Goal

Owner, 6 Oct 2026: Fintava is being replaced by Nuvion, and **"Fintava's removal should not be permanent but
something of an easy roll back"**. Today eight services in `src/money/` take `FintavaClient` directly and there is
no provider layer, so swapping providers would mean rewriting them, and rolling back would mean rewriting them
again. This task puts one provider-neutral interface between the money code and the provider, with Fintava as the
first adapter and one setting, `WALLET_PROVIDER`, choosing it at boot. Rollback is changing that setting and
restarting. Nothing a user, the app, the web or the dashboard sees changes.

Also covered (done, after-launch, so not in `depends_on`: a launch task may not depend on after-launch ones):
WALLET-18 (receipts) and WALLET-27 (statements). Neither calls the provider; their specs run unchanged in the
full suite.

## Scope

- wawu-backend only. New `src/wallet-provider/` (interface, neutral error, config, Nest module, specs); new
  Fintava adapter `src/fintava/fintava-wallet-provider.ts`; Fintava's delivery parser moved into `src/fintava/`;
  every `src/money` service that used `FintavaClient` re-pointed at `WALLET_PROVIDER` (or `OTP_SENDER`).
- No behaviour change: no route, field, status code, error code, migration or contract change. Existing money
  and Fintava specs pass unchanged in meaning (only imports and wiring may change).
- Keep every Fintava file. Do not rename or drop the Fintava-named tables.
- `WALLET_PROVIDER=nuvion` is reserved: a clear startup error until the Nuvion adapter task lands. Never call
  Nuvion or any Fintava host (stand-ins only).

## Capability checks

- [x] No file under `src/money/` (tests aside) imports anything under `src/fintava/`; a spec fails if one does.
- [x] `WALLET_PROVIDER` unset or `fintava` boots with the Fintava adapter; `nuvion` stops the server at boot with a message that says how to roll back; any other value stops it too.
- [x] Every existing money and Fintava spec passes with the same assertions; `contract/openapi.json` comes out unchanged.

## Builder report

Builder, 6 Oct 2026. wawu-backend `wmt/MONEY-20` `23a4b77` (built on main a94f338, then origin/main 872cf45, merge
train 1, merged in at `9669c08`); mobile `wmt/MONEY-20` (this file, on main 6df916d merged in). The owner's ruling is
R-39 on mobile main (the lead recorded it; this task adds no ruling).

**The interface** (`src/wallet-provider/wallet-provider.interface.ts`, tokens `WALLET_PROVIDER` and `OTP_SENDER`).
Amounts are kobo `bigint`; failures are `WalletProviderError` (`wallet-provider-error.ts`) whose kinds are the
seventeen the Fintava client already told apart, word for word, plus `not_supported`.
- Properties: `name`, `label` ("Fintava": notes and logs keep their exact words), `configured`, `timings`,
  `capabilities` (selfieMatch, hostedLiveness, separateKyc, asyncAccountNumber, identityLookup), `walletBankCode`,
  `deliveries` (`ledgerEvents`, `read`: the stored webhook deliveries, for the ledger).
- Identity: `checkIdentity`, `matchSelfie`, `startLivenessSession`, `getLivenessResult`, `submitKyc`.
- Opening: `openWallet` (answers `open` with the account, or `provisioning` for a provider that issues the account
  number later), `getWalletAccount`, `findCustomerByPhone`, `getCustomerMatch`, `listCustomerSightings`.
- Balances: `getBalance`, `getPlatformAccount`. Banks: `listBanks`, `checkAccountName` (Nuvion: `POST
  /counterparty-lookups`). Money: `bankTransfer` (from a person or WAWU's own account), `walletToWallet`.
- Transactions: `findTransactionByReference`, `findTransactionById`, `listTransactions`, `reconcileSend`,
  `decideRetry`, `confirmMovement`, `secondaryReferenceOf`.
- `OtpSender.sendText` (the PIN reset code; Fintava's SMS today, email in the Nuvion work per R-39).
- Fintava answers `not_supported` for `startLivenessSession`, `getLivenessResult` and `submitKyc` (it has neither).

**The adapter** `src/fintava/fintava-wallet-provider.ts` (`FintavaWalletProvider`, `FintavaOtpSender`): every
method is the same client call, with the same arguments, in the same order, that the service made; it translates
results to the neutral types and `FintavaError` to `WalletProviderError` of the same kind and facts. Fintava's
quirks stay in `src/fintava/`: the delivery parser moved there by `git mv` (`src/money/ledger/ledger-webhook.ts` to
`src/fintava/fintava-ledger-delivery.ts`), the ledger consumer's history walk moved into `confirmMovement`
unchanged, and `decideFintavaRetry` (now generic in the transaction type) runs on the neutral one.
`fintavaErrorToHttp` delegates to the neutral mapping, so the two cannot drift. `FINTAVA_WALLET_BANK_CODE` moved
from `ledger-config.ts` to `fintava-config.ts`. No Fintava file was deleted.

**Re-pointed at the seam** (each injects `WALLET_PROVIDER`, the PIN reset `OTP_SENDER`):
`balance/wallet-balance.service.ts`, `identity/wallet-identity.service.ts`, `identity/selfie-match.service.ts`,
`identity/bvn-name.ts` (type only), `opening/wallet-opening.service.ts`, `saved-accounts/bank-account-check.service.ts`,
`ledger/ledger-status.service.ts` (the pending sweep), `ledger/ledger-consumer.service.ts` (the delivery sweep),
`pin/pin-reset.service.ts`, `recipients/recipient-query.ts` (WALLET-08, arrived with the merge: the phone rule,
now `src/wallet-provider/nigerian-phone.ts`, which the Fintava client also uses), and the modules `money.module.ts`
and `ledger/ledger.module.ts` (import `WalletProviderModule`, not `FintavaModule`).

**The switch** `WALLET_PROVIDER` (`wallet-provider-config.ts`, `wallet-provider.module.ts`): unset, blank or
`fintava` (any case) is Fintava; `nuvion` stops the server at boot with "WALLET_PROVIDER=nuvion is reserved: the
nuvion wallet adapter is not built yet. Set WALLET_PROVIDER=fintava (or leave it unset) and restart."; anything
else stops it with "WALLET_PROVIDER must be one of: fintava, nuvion (unset means fintava).". Documented in
`.env.example`, `deploy/README.md` (with the rollback: change the value, `sudo systemctl restart wawu-hub-api`),
`docs/LOCAL.md` and the backend `CLAUDE.md` money section.

**Specs touched** (wiring only, no assertion changed): `money-identity.contract`, `selfie-match.contract` and
`ledger-status.spec` build the service over `new FintavaWalletProvider(client)`; `wallet-opening.contract` passes
the module's provider; `ledger-units.spec` imports the parser from its new path and expects `provider_wallet`
where it expected `fintava_wallet` (the neutral name of the same party). New: `src/wallet-provider/tests/
wallet-provider-seam.spec.ts`, 18 tests: no file under `src/money` (tests aside) imports `src/fintava` or names
the client, its error or result types (shown to fail when one does); inside the seam only the wiring module
imports `src/fintava`; the eight services inject the tokens; `WALLET_PROVIDER` unset, `fintava` and `FINTAVA` boot
the Fintava adapter over the one client, `nuvion` and an unknown value stop the module; the adapter keeps every
Fintava kind and `recordMayExist`, passes a non-Fintava error through untouched, answers bigint kobo with the same
digits and `not_supported` where Fintava has nothing; the OTP sender texts through Fintava's SMS.

**Capability checks**
1. No `src/money` file imports `src/fintava`: passed (seam spec; grep shows none).
2. The switch: passed in the seam spec, and on the built server on :5111 against a migrated `m20_boot_test`
   (stand-in hosts only): unset boots, `GET /api/hub/health` 200; `nuvion` and `flutterwave` stop at boot with the
   two messages above.
3. Existing specs pass with the same assertions, contract unchanged: passed (runs below).

**Runs** (machine load average 28 to 48 on 4 cores throughout, from other sessions' suites):
- `npx tsc --noEmit` 0; eslint 0 on every changed `.ts` file.
- `npm run contract:build`: `contract/openapi.json` byte-identical to origin/main 872cf45 (the HTTP contract did
  not move), so no mobile contract sync is needed.
- Protected suite `run.sh --fresh HEAD` on 23a4b77, lock at origin/main 872cf45: 253/253 (244 required); lock files
  untouched. Also 253/253 on 0493b87 before the merge.
- Gates: main 872cf45 16 fail / 51 warn, branch 16 fail / 51 warn; fail lines identical, warnings in the same
  files (two moved line numbers). No new PROVISIONAL marker. Tripwire: 0 added lines match. Key-shaped scan of
  every staged diff: 0 hits.
- Full suite in its own network namespace (mock WAWU ID on :4001 there), fresh migrated and seeded `m20_full_test`,
  run as three serial `--runInBand --shard=i/3` passes because a single in-band run was OOM-killed (exit 137) at
  16 GB with other sessions' suites running: 163 suites, 3,952 tests, 3,863 passed, 4 skipped, 85 failed in 7
  suites, every one a time limit under load and none in a file this task changed in meaning:
  `hub-rate-limits` (needs a non-loopback interface; 22/22 on the host network), `admin-kyc-review`,
  `admin-content-review` and `recipient-throttle` (5 s `beforeAll` timeouts; all pass rerun alone),
  `money-pin.contract` (5 s timeouts on argon2 under load; all pass rerun with `--testTimeout=60000`, and it fails
  the same way on origin/main 872cf45 under the same load), `ledger.contract` (one race test that waits up to 10 s
  for a lock; passed in two reruns alone; `ledger.service.ts` is unchanged), `receipt-units` (the 300 ms drawing
  bound; fails alone at load 43 to 48). `fintava-stall` (timing) failed in an earlier run under load and fails the
  same way on origin/main; the client's timeout code is unchanged.
- `data-export-map.spec` and `account-data-map.spec` pass (no model added).
- Mobile `npm run check` exit 0 (typecheck, lint, jest 43 suites / 754 tests, gates 0 fail / 0 warn on 195 files,
  208 tasks). A first run had one 20 s timeout in `OpenWalletScreen.test.tsx` at load 33 (no app code changed);
  the rerun passed.

**Decisions (Default (agent), owner may override)**
- No schema change. Nothing writes a row for a provider other than Fintava yet, so a `provider` column would only
  ever say `fintava`. The Nuvion adapter task must add a nullable `provider` column to the wallet, opening and
  ledger tables (default `fintava`, migration after every main folder) before it writes its first row, so a
  rollback can tell the two apart.
- The interface sits in `src/wallet-provider/`, outside `src/money/`, so the wiring module (the only importer of
  `src/fintava/`) is not a money file and the static check has no exception.
- Delivery readings keep safe-integer number kobo (what the ledger takes); provider results are bigint.
- A bank send's unreported status reads as pending when its receiver is a bank account; that is exactly Fintava's
  `customer_bank_transfer`, the only such movement, so the consumer no longer names a provider event.
- `not_supported` from an identity check gives the day's try back, as `not_configured` does (nothing was sent).
- `openWallet` answering `provisioning` (Nuvion) leaves the opening `unknown`, found again by phone, never created
  twice. Fintava always answers `open`.
- `FintavaModule` stays imported whichever provider is picked: the Fintava webhook receiver keeps running.
- Type `backend-refactor` (V1 V2 V3 V9) is new in `scripts/tasks/check_tasks.py`, as the lead's brief names it
  (SHARED-CHANGES MONEY-20 #1). WALLET-18 and WALLET-27 are named in the Goal, not in `depends_on`: they are
  after-launch and the task check refuses a launch task that depends on one. Order 181, tasks from 181 down one.

**Merge note:** origin/wmt/MONEY-17 edits `ledger.service.ts`, `ledger-consumer.service.ts` and
`fee-quote.service.ts` and calls `FintavaClient` from `src/money/payments/`; merged after this, its payment code
goes through `WALLET_PROVIDER` (`walletToWallet`, `getPlatformAccount`, `reconcileSend`) or the seam spec fails.

**NOT RUN**
- The full suite as one in-band run: OOM-killed at 16 GB with other sessions' suites on the machine. Unblocked when
  `free -m` shows about 8 GB available for the run's length.
- The timing tests (`receipt-units` 300 ms, `fintava-stall`) green: they need a load average under about 4 on
  this machine; both fail identically on origin/main under the same load.
- A Fintava sandbox call through the adapter: stand-ins only, as the brief says. Unblocked by a session whose brief
  allows `dev.fintavapay.com`.
- The Nuvion adapter, and the `provider` column: the Nuvion adapter task, once Nuvion's NGN fees and limits are in
  (R-39).

## Verifier report

Verifier, 7 Oct 2026 (independent; wrote none of this). Backend `wmt/MONEY-20` `23a4b77` in detached worktree
`/home/user/wt/vm20b`; backend main `872cf45` in `/home/user/wt/vm20x` for every comparison; mobile `be93dd5`.
Evidence: lead's scratchpad `vm20/`. Stand-ins only: no Fintava or Nuvion host was called (`FINTAVA_BASE_URL`
pointed at a closed local port or the specs' own double; no key set on the booted server).

**Verdict: passed, no defect.** With `WALLET_PROVIDER` unset or `fintava` every Fintava call I traced is the same
endpoint, arguments, order and error handling as main, the ledger rows written from the same deliveries are
identical, and the HTTP contract and schema did not move.

| Pass | Result | Evidence |
|------|--------|----------|
| V1 Gates | passed | `tsc --noEmit` 0 (`tsc-branch.txt`). eslint (no `--fix`) on the 31 changed `.ts` files: exit 0. Gates: main 872cf45 16 fail / 51 warn / 76 accepted on 799 files; branch 16 / 51 / 76 on 806 files; the 16 FAIL lines identical byte for byte, warnings identical apart from line numbers; no new PROVISIONAL marker. Tripwire: 0 added lines match. Key-shaped scan of the whole branch diff: 0 hits. Mobile `npm run check` (below). |
| V2 Contract | passed | `npm run contract:build` on the branch: `contract/openapi.json` sha256 `c4d1acde...4b07`, byte-identical to main 872cf45. `git diff 872cf45 23a4b77 -- prisma contract` empty: no migration, no schema change. Protected lock files, `account-data-map.ts` and `data-export-sections.ts` unchanged. |
| V3 Regression | passed | Protected suite `run.sh --fresh HEAD`, lock origin/main 872cf45: 253/253 (244 required) (`protected.txt`). Full suite in my own network namespace, fresh migrated and seeded `vm20_full_test`, three serial `--runInBand --shard=i/3` passes: 163 suites, 3,952 tests, 3,937 passed, 4 skipped, 11 failed, all 11 in `hub-rate-limits` (needs a non-loopback interface), which is 22/22 on the host network. `account-data-map` 4/4 and `data-export-map` 5/5 inside it. Money and Fintava specs (`src/(money|fintava|wallet-provider)/`) on main and branch under the same load (`cmpjson.py`, below). |
| V9 Live seam | NOT RUN (real login half) | The built branch server (`dist`) on :5221 against a migrated `vm20_boot_test`: unset, `fintava`, ` FINTAVA ` and blank boot, `GET /api/hub/health` 200, `GET /money/wallet/balance` 401 without a token. Signing in through the real WAWU ID login was not run: unblocked by a session with a local wawu-id on a free port and a Fintava stand-in reachable from the hub. |

**Capability checks, as written**
1. No `src/money` file imports `src/fintava`: passed. The seam spec has teeth: adding `import { fintavaAmountToKobo } from '../../fintava/fintava-amount'` to `wallet-balance.service.ts` fails it (`money/balance/wallet-balance.service.ts -> fintava/fintava-amount`, 1 failed / 17 passed); restored.
2. The switch, on the built server: unset, `fintava` (any case, spaces) and blank boot; `nuvion` and `NUVION` exit 1 with `WalletProviderConfigError: WALLET_PROVIDER=nuvion is reserved: the nuvion wallet adapter is not built yet. Set WALLET_PROVIDER=fintava (or leave it unset) and restart.`; `flutterwave` exits 1 with `WALLET_PROVIDER must be one of: fintava, nuvion (unset means fintava).` (`boot/*.log`). See finding 1 on Fintava config.
3. Same assertions, contract unchanged: passed. The only assertion text changed is `ledger-units.spec` (`fintava_wallet` to `provider_wallet`); see below.

**Behaviour unchanged (diff of every moved or re-pointed file against 872cf45, and a94f338 where it predates the merge)**
- Each adapter method makes the same client call with the same arguments as the service did: `verifyBvn`, `verifyBvnSelfie`, `createCustomer` (same 8 fields), `lookupCustomerByPhone`, `getCustomerMatch`, `listCustomerSightings({page,take})`, `getWalletBalance`, `getMerchantBalance`, `listBanks`, `bankNameEnquiry(accountNumber, bankCode)`, `reconcile(ref, holder, since)`, `getTransactionByReference/ById`, `sendSms`. The ledger consumer's confirmation walk moved into `FintavaWalletProvider.confirmMovement` line for line (same 4-reference cap, `sha256:` filter, history pages, 24-hour same-amount window, nearest-first, by-id checks, `not_configured`/`auth` early stop). `decideFintavaRetry` is only made generic. The status sweep's `tagapayOf` became `secondaryReferenceOf`, called only when the record has none, as before.
- Errors: `FintavaError` becomes `WalletProviderError` with the same kind, operation, HTTP status, messages, reference and `recordMayExist`; every service now catches the neutral class at exactly the places it caught `FintavaError`. `fintavaErrorToHttp` now delegates to `walletProviderErrorToHttp`, whose switch is the old one verbatim; `retryAfterSeconds` is still Fintava's 30 everywhere. `WALLET_PROVIDER_UNKNOWN_OUTCOMES` equals `FINTAVA_UNKNOWN_OUTCOMES`. The added `not_supported` kind is never produced on a Fintava path.
- The consumer's one reworded rule, `m.to?.where === 'bank_account'` for `m.event === 'customer_bank_transfer'`: in the Fintava parser only `customer_bank_transfer` gives a `bank_account` receiver, and always a non-null one, so it is the same rule.
- Kobo: the client only produces safe integers (`fintavaAmountToKobo`), so the bigint round trip (`BigInt`, `safeKoboNumber`) cannot throw or change a figure; disagreement notes print the same digits.
- `fintava_wallet` to `provider_wallet`: it is `LedgerParty.where`, an in-memory value of the parsed delivery. It is not a DB enum or column, is never stored (the row's `counterpartyKind` is still `wawu_user` / `wawu` / `bank_account`), and appears in no response, receipt or log. No stored data or HTTP answer changes.
- Webhook path: the receiver, signature check and store are untouched (`src/fintava/webhook/*` not in the diff; its specs pass on both). Same inputs, same rows: I ran `ledger.contract.spec` (25 tests) and `ledger-status.contract.spec` (37) on main and on the branch, each on a fresh DB, dumping every ledger entry, reference and webhook event before cleanup, then masking ids, run tokens and generated account digits (`rows/norm.py`): 63 and 172 normalised rows and events, **identical** on main and branch, including statuses, figures, counterparties, the three references, failure reasons, discrepancies and every note ("confirmed with Fintava", "Fintava's record says 1000 kobo, the delivery 1500; left pending for review").
- Money and Fintava specs, main 872cf45 against branch, same machine and similar load: main 46 suites / 1,661 tests, 1,622 passed; branch 47 / 1,679, 1,618 passed (+18 are the new seam spec). Every difference is a timing test flipping either way (`fintava-stall` 30 tests both directions; the `ledger.contract` lock race and two `money-pin` tests failed on main only; one `selfie-match` 5 s whole-table scan on the branch only). Each of those suites passed in the branch's full run, and alone at load 7 to 9 (`reruns/`): `fintava-stall`, `receipt-units`, `selfie-match`, `money-pin`, `ledger.contract` all pass; `recipient-throttle` failed alone at load 11 (5 s `beforeAll`), passed in the full run, and fails the same way on main.

**Mutants** (28, in a separate detached worktree, `mutants/`): 19 killed, 9 survived.
Killed: swapped provider/secondary reference in `fromFintavaTransaction`; balance reading `bookedKobo`; wrong `walletBankCode`; name check arguments swapped; consumer's bank-send rule on `provider_wallet`; status sweep without `resendSafetyMs`; `below_minimum` dropped from the HTTP mapping; `selectWalletAdapter` falling back to Fintava; `secondaryReferenceOf` always null; `configured` always true; platform account number from its name; first ledger event dropped; BVN phone dropped; `outcome` null; sightings phone dropped; Nigerian phone rule narrowed; error messages dropped; balance retry 31 s; OTP sender not translating (by `pin-reset.contract` only).
Survived, none a defect of this change: `recordMayExist` not copied (equivalent on main: only the bank sends set it explicitly, and they have no caller yet); history walk from page 2 (the double ignores the page); `walletToWallet` sender and receiver swapped, and the merchant/customer branch of `bankTransfer` inverted (no caller on main); the consumer keeping `customerReference` when the sender is not ours, the status sweep's receiving-side reference, `merchant_inactive` giving the BVN try back, and the PIN reset's `not_confirmed`/`duplicate_reference` handling (all four untested on main as well); `provisioning` treated as anything not `open` (equivalent: Fintava always answers `open`).

**Findings** (no `defect`)
1. Not a defect (the lead's brief asked for it; the task's checks do not): the Fintava config is read whatever `WALLET_PROVIDER` says, by design (`FintavaModule` stays mounted for the webhook receiver; `.env.example` says so). On the built server `WALLET_PROVIDER=nuvion` with `FINTAVA_TIMEOUT_MS=abc` stops with `FintavaConfigError: FINTAVA_TIMEOUT_MS must be ...`, and with `FINTAVA_BASE_URL=https://example.com` with the Fintava host error, not the rollback message. Harmless today (nuvion cannot boot either way). For the Nuvion task: a leftover wrong `FINTAVA_*` value would stop a Nuvion server.
2. For the Nuvion adapter task (rollback realism): nothing in this head makes rollback unsafe, because no row can come from another provider (nuvion refuses to boot). Once Nuvion runs, switching back to `fintava` breaks unless that task adds the `provider` column and filters by it: the status sweep would ask Fintava about Nuvion sends, find them absent and `markAbsentFailed` them; the opening sweep would look up Nuvion openings by phone at Fintava; the balance would ask Fintava for a Nuvion `walletId` (503); the consumer reads only `FintavaWebhookEvent`. Also `GET /money/wallet` takes `bankCode` from the provider but `bankName`, the licence line and the deposit-insurance line from `WALLET_BANK_NAME`, `WALLET_LICENCE_LINE` and `WALLET_DEPOSIT_INSURANCE_LINE`, so a switch also needs those changed. "One setting" holds only while they stay the same for both providers.
3. For MONEY-17: merged after this (trial merge, local, deleted), `origin/wmt/MONEY-17` d840c73 (a) does not compile: `src/money/payments/wallet-payment.service.ts` imports `ledgerStatusOf` from `../ledger/ledger-webhook`, now `src/fintava/fintava-ledger-delivery.ts`; (b) with that import fixed it does not boot: `Nest can't resolve dependencies of the MerchantWallet (?)`, because `money.module.ts` no longer imports `FintavaModule`; (c) fails the seam spec (2 tests): `src/money/payments/merchant-wallet.ts` (FintavaClient, FINTAVA_DEFAULTS, FintavaError) and `src/money/payments/wallet-payment.service.ts` (FintavaClient, FINTAVA_DEFAULTS, FintavaError, FintavaErrorKind, FintavaReconciliation). Those two files must use `WALLET_PROVIDER` (`walletToWallet`, `getPlatformAccount`, `reconcileSend`, `decideRetry`, `timings.retryAfterSeconds`, `WalletProviderError`). Its edits to `ledger-consumer.service.ts`, `ledger.service.ts`, `fee-quote.service.ts` and `money.module.ts` merge cleanly. The textual conflicts (`contract/openapi.json`, `docs/contract/CONVENTIONS.md`, the two wallet-gate specs) come from train 1, not from MONEY-20.
4. For MONEY-17 and WALLET-09 (test gaps): `walletToWallet` and `bankTransfer` have no test (mutants survive), nor does an explicit `recordMayExist: true` on a refused bank send crossing the adapter. The seam spec's "failures translated" OTP test passes with an untranslated `FintavaError` (`toMatchObject` on `kind`), so it does not prove the translation; `pin-reset.contract` does. The first caller should test all three.
5. Log text only: the opening sweep's "a lost answer could not be reconciled" log now names `WalletProviderError` where it named `FintavaError`. No stored or answered text changed.

**Mobile** (branch be93dd5, merged with origin/main 6df916d, nothing newer on main): the 27 renumbered task files change only their `order:` line (181 to 207 move down one, contiguous, no duplicate order). `check_tasks.py` adds one `MIN_PASSES` entry (`backend-refactor`: V1 V2 V3 V9) and nothing else; WORKFLOW.md and TEMPLATE.md add the type. `npm run check` with this report: exit 0 (typecheck, lint, jest 43 suites / 754 tests, gates 0 fail / 0 warn on 195 files, 208 tasks, 279 artboards).

**NOT RUN**
- V9 real login: unblocked by a session with a local wawu-id on a free port.
- A Fintava sandbox call through the adapter, and the `scripts/fintava/*-sandbox-check.ts` scripts: unblocked by a brief that allows `dev.fintavapay.com`.
- The full suite as one in-band process (run as three serial shards; memory).

## Owner sign-off
