# OPS-DEL-TEST · round history

Moved out of [tasks/OPS-DEL-TEST.md](../OPS-DEL-TEST.md) word for word, oldest first. The current state is in that file.

## Current state as cut (11 Nov 2026, the lead)

As of 11 Nov 2026.
- **Status:** todo. Cut by the lead from the owner's ask (11 Nov, about 08:48 UTC by the owner's phone). The owner asked to delete their own test account, which holds test wallet money: "we are not wiping the database but deleting just this test account... in fact just this my own". The app cannot delete it, because R-17 refuses deletion while the wallet holds money, and the money is sandbox money that cannot be withdrawn.
- **Facts checked by the lead:**
  - The Hub has no admin delete.
  - `DELETE /account` waits `DELETION_GRACE_DAYS` (30) and then `AccountPurgeService.purge(wawuUserId)` runs.
  - The deletion blockers are in `src/account/account-deletion-money.service.ts`.
  - Admin dashboard logins are their own `AdminUser` rows (README, "Admin surface"), so deleting an app account never touches an admin login.
  - The live server's wallet provider is Nuvion on its TEST keys (the owner switches to live keys themselves).
- **Next:** a builder on wawu-backend `wmt/OPS-DEL-TEST`, then a T2 verifier. The owner then runs the script on the server themselves.


## Builder report

**Files (wawu-backend `wmt/OPS-DEL-TEST`):** `scripts/ops/delete-test-account.ts` (new); `src/account/account-deletion-sweep.service.ts` (one added method, `purgeNow(id)`, which runs the sweep's own `purgeOne` for one account; nothing else in that file changed); `src/account/tests/ops-delete-test-account.contract.spec.ts` (new, 8 cases). No schema change, no new route, no fenced file, no `SHARED-CHANGES.md` row.

**The command the owner runs on the server** (only after this is merged and deployed; the deploy's `nest build` already compiles `scripts/` into `dist/scripts/`):

```
cd /srv/wawu/hub-api
set -a; . /etc/wawu/hub-api.env; set +a
export WAWU_ID_DATABASE_URL='<a read-only connection string for the WAWU ID database>'
# 1. dry run, writes nothing, prints the confirmation phrase:
node dist/scripts/ops/delete-test-account.js --email '<the test account email>'
# 2. apply, only after reading the dry run:
node dist/scripts/ops/delete-test-account.js --email '<the test account email>' --apply --confirm 'DELETE <the phrase the dry run printed>'
```
Add `--allow-test-holds` to either only if the dry run lists a blocker other than the wallet balance and the owner says that is test money too. Exit 0 is done or nothing to do, 1 refused (nothing changed), 2 stopped part way (run the same command again).

**One thing the owner must supply.** The Hub keeps no email, and WAWU ID has no route that finds a user by email. So the script reads WAWU ID's `wawu_users` table, read only (`SET default_transaction_read_only`), through `WAWU_ID_DATABASE_URL`. It is used only to turn the email into the user id. Every write to WAWU ID goes through the Hub's own client (mark-deletion, then anonymise). If the owner would rather not hand the Hub box that connection string, the alternative is a small WAWU ID internal route (another repo, another task).

**What it refuses** (each prints `REFUSED: ...` and `Nothing was changed.`, exit 1): the provider not proven to be on sandbox; zero matches is not a refusal but "Nothing to do"; two or more matches; an email that is an `AdminUser` login (case-insensitive); a blocker other than `wallet_balance` without `--allow-test-holds`; `--apply` without `--confirm`; a wrong phrase. The phrase is `DELETE ` plus the first 8 characters of the WAWU ID user id (stable before and after a half-finished run).

**How the sandbox proof works.** It calls the provider adapters' own settings readers on the same environment the Hub boots with. `WALLET_PROVIDER` picks the provider through `readWalletProviderName`. Nuvion: `readNuvionSettings` must say the environment is `sandbox`, which it does only when `NUVION_BASE_URL` is exactly `https://api.nuvion.dev` (`https://api.nuvion.co` reads as production and any other value is a config error). Fintava: `readFintavaSettings` must say `sandbox`, that is `FINTAVA_BASE_URL` on `dev.fintavapay.com` (`live.fintavapay.com`, a local address or no setting in production all refuse). It prints the key name that proves it, never an address or a key, and reads no API key. It runs before the database or the provider is touched. Limit: the proof is the host; a key from the wrong environment on the sandbox host is not detectable here.

**What apply does**, reusing the app's services: `AccountDeletionMoneyService.check` (balance and blockers, read live from the provider; `wallet_balance` waived, others waived only with the flag); writes the `AccountDeletion` row at `purging` with `purgeAfter` one second after `scheduledAt` (the table requires it to be later), reason `ops_delete_test_account`, so no 30 days; `AccountDeletionIdentityService.tell` (WAWU ID mark-deletion, must confirm before any purge); then `AccountDeletionSweepService.purgeNow`: the sweep's own steps (wallet frozen by the row, held points released, `AccountPurgeService.purge`, the "account deleted" email, WAWU ID anonymise, row `purged`). The test balance stays at the provider in a frozen wallet; nothing is moved. The audit record is that `AccountDeletion` row (it is kept by the purge, with the purge note) plus the printed Audit line. The row write is the only logic the script holds itself (the app writes the same row in a private method that also demands an empty wallet).

**Proof on a local stack** (`stack.sh up --name odt_test --ports 16600-16609 --with id`: real WAWU ID on a throwaway database, Nuvion stand-in, databases `odt_test_*` on 127.0.0.1:14001). Seeded: A (Nuvion test wallet with 5,000,000 kobo, two pieces, one bought by D), B (same display name, email one character different from A's), C (an open hold), D (the buyer).
- Dry run on A: printed the user, wallet and balance, blockers (`wallet_balance: waived`), counts (2 pieces, 1 bought by others) and the phrase. Row counts of all 252 Hub tables and 17 WAWU ID tables before and after: identical.
- Refusals, each with every Hub table identical afterwards: provider switched to the production Nuvion host; two matches (a second WAWU ID row with the email in capitals); `--apply` with no phrase; a wrong phrase; C without the flag (`open_hold: REFUSES`).
- Apply on A: `Outcome: purged`. Tables that changed (before, after): AccountDeletion 0 to 1, AccountDeletionContent 0 to 1, ContentPiece 3 to 2, FintavaWallet 1 to 0, Notification 4 to 3, NotificationTarget 4 to 3, TgifDailyNotice 4 to 3, UserProfile 4 to 3; no other table changed, and no WAWU ID table changed in row count. B, C and D are untouched. R-130: "A piece sold" stays (hidden, creator set to the deleted-creator id) and D's purchase still points at it; the unsold piece is gone.
- WAWU ID side: A's row is kept and anonymised (email and names null, phone `deleted:<id>`, status `banned`), the same as the sweep's `?mode=anonymize`. **A's email can sign up again**: the email column is cleared, so the unique value is free (the new sign-up gets a new user id).
- Second apply: `Nothing to do: no account has this email`, exit 0, all tables identical. A run that stopped because WAWU ID was down is finished by running it again (spec).
- One log line of the local run: the "account deleted" email was not sent (`WAWU ID answered 503`: the stack's WAWU ID has no mail provider). The purge goes on, as the sweep does. On the server the owner's test address will get that email.

**Checks (each to its EXIT):**
- `NODE_OPTIONS=--max-old-space-size=4096 npx tsc --noEmit`: EXIT 0
- eslint on the three changed files: EXIT 0
- `python3 scripts/gates/run.py`: EXIT 0 (0 fail, 139 warn, 88 accepted); `python3 scripts/gates/check_baseline.py`: EXIT 0
- `jest --runInBand src/account/tests/ops-delete-test-account.contract.spec.ts` on a fresh database: 8 of 8, EXIT 0
- `jest --runInBand src/account src/account-purge` on a fresh database: 29 suites, 388 tests, EXIT 0 (run with the stack's mock WAWU ID as the `test:contract` environment)

**Not done / for the verifier:** nothing run on the server or against a real provider. Look at: `purgeNow` is the only edit to existing code; the script writes one `AccountDeletion` row itself; the email lookup needs the WAWU ID database string (above); the proof is the host only.

## Verifier report

T2 verifier, 11 Nov 2026. Hub `109213b5` on main `bf3f4a3b`. Local stack odv_test (real WAWU ID, Nuvion stand-in, Postgres 14001), 12 seeded accounts. **Verdict: FIX** (1 blocker).

| Pass | Result | Evidence |
|------|--------|----------|
| V1 | passed | tsc EXIT 0; eslint on 3 changed files EXIT 0; new spec 8/8 EXIT 0; `src/account` + `src/account-purge` 29 suites, 388 tests, fresh db, `--runInBand`, EXIT 0 |
| V3 | failed | blocker 1 (real-money rows not checked) |
| V4 | passed | dry runs: every table row count and md5 in the Hub and WAWU ID identical before and after (only the running Hub's own `CommunityNoticeCursor` ticker moves, every 20 s, with no script running) |
| V6, V7, V9 | passed, see below | |
| gates | passed | `gates/run.py` EXIT 0 (0 fail, 139 warn, 88 accepted); `check_baseline.py` EXIT 0 |
| full `test:contract` | NOT RUN to the end | 708 spec files, in-band, hours; started, killed after a few minutes. GitHub runs it on the PR |

### Blocker

**B1 (defect): real-money rows other than the Nuvion wallet are deleted with no refusal.** The script's whole money check is `AccountDeletionMoneyService.check` (wallet balance, holds, waiting earnings, payments in flight, FX, Capital). Nothing in `src/account` or `src/account-purge` looks at the website's Flutterwave wallets. Seeded one account with: `CreatorWallet` (a Flutterwave payout subaccount, R-1), a completed earning and a PENDING withdrawal in `WalletLedgerEntry` plus its `WalletWithdrawal`, a PENDING card `Purchase` and a completed one, a `BillPayment`, a `CreditPurchase` + `CreditLot` (credits bought with real money), a `WalletCard`, and a `CommunityPassRefund` owed to the account. Dry run: `Blockers: none`, "Would remove" lists them. Apply: `Outcome: purged`; CreatorWallet, both ledger rows (one a withdrawal in flight), WalletWithdrawal, BillPayment, CreditPurchase, CreditLot, WalletCard and both Purchase rows are gone (`CommunityPassRefund` stays, anonymised). The sandbox proof is only the Nuvion/Fintava host, so it says nothing about Flutterwave: an account with a live web wallet or an unsettled withdrawal passes the script's "cannot be used on an account that holds real money". Fix: refuse, not waivable by `--allow-test-holds`, when any of those rows exist for the account (CreatorWallet; WalletLedgerEntry pending or withdrawal not failed; Purchase/BillPayment/EventOrder/CreditPurchase pending; WalletCard; CommunityPassRefund pending either side), or list them and require a separate flag per kind; add a spec seeding each.

### Medium

**M1 (defect): `--allow-test-holds` waives every blocker, including other people's money.** Seeded payer C with a held paid DM (100 naira) and a completed tip (170 naira share unsettled) to payee P. Dry run on P: `open_hold, waiting_earnings` REFUSE. With the flag: apply purged P; C's `WalletHold` stays `held` and both `WalletPayment` rows keep P's id with `payeeSettledAt` null, so a counterparty's money sits against a deleted payee and WAWU's owed earning has no owner. The flag text says "test money" but nothing checks that the other side is a test account. Fix: with the flag still refuse when the other party of a hold or payment is not the same account, or name the other party's id in the dry run and ask for it in the phrase.

### Low

- L1: the access token the target held before keeps working on the Hub for its life (900 s): `GET /users/me` 200 after apply. Refresh is refused (401), password login is refused (404 USER_NOT_IN_WAWUID) and the 2 refresh tokens are gone. Same as an app deletion.
- L2: exit 2 ("not finished") still prints the `Audit:` line as if written; it is only the row.
- L3: WAWU ID side of a half-done run: if WAWU ID is down at the start, the row is `purging`, nothing else changed, the wallet is not yet frozen and the account can still sign in until the rerun; the hourly sweep treats a `purging` row as past its money check (purge steps skip it), which is the intent here but means an abandoned half run finishes by itself within the hour once WAWU ID answers.
- L4: `export WAWU_ID_DATABASE_URL='...'` typed in an interactive shell goes into shell history; prefix it on the node line, or `read -rs`.
- L5: a WAWU ID email stored with surrounding spaces never matches (trim is on the argument only). Fails closed.
- L6: the stale `Hub profile: none` line on rerun is correct; no issue.

### What was attacked and held

1. **Wrong account.** Matching is exactly `lower(email) = lower(trim(argument))` against `wawu_users.email` (plus `AdminUser.email` case-insensitive for the admin refusal). Tested: `target@odv.test` and `  TARGET@Odv.Test  ` find the target; `target+x@odv.test` finds only its own decoy (plus-address of the target is a different account and is not matched by the target's email); one-letter-off, truncated and local-part-only emails: "Nothing to do", exit 0. Two WAWU ID rows differing only by case (`dup@` and `DUP@`): `REFUSED: 2 accounts match`, exit 1, nothing changed. A same-name decoy (all had first/last name Same Name) was never touched: after six applies exactly six WAWU ID rows are anonymised, all targets. WAWU ID user with no Hub profile: dry run lists it with `Hub profile: none`, 0 rows, and apply would only anonymise the identity (as designed). Hub profile whose WAWU ID row is missing: unreachable by email ("Nothing to do"). Admin email: `REFUSED: this email is an admin login.` Missing `--confirm`, wrong phrase, lowercase phrase, `--confirm` with no value: all REFUSED, tables identical.
2. **Money places** (from the schema and `account-data-map.ts`): blocked by the script: Nuvion/Fintava wallet balance (waived by design), `WalletHold` open, `WalletPayment`/`EarningSettlement`/`StoreEarning` owed, pending `WalletPayment`, `AbroadSend` unfinished, `PointHold` cash-out, `FxAccount` balance, Capital orders and holdings, wallet opening. NOT checked, deleted silently (B1): `CreatorWallet`, `WalletLedgerEntry`, `WalletWithdrawal`, `Purchase` (buyer side, pending or completed), `BillPayment`, `EventOrder`, `CreditPurchase`/`CreditLot`/`CreditsState`, `WalletCard`, `MoneyPayoutAccount`, `StoreCredit`. Refunds owed: `CommunityPassRefund` is kept anonymised (not lost) but does not block.
3. **Sandbox proof.** Nuvion: `https://api.nuvion.co` refused (production); unknown host, empty, `HTTP://API.NUVION.DEV`, `:443`, `/v1`, `http://`, subdomain, `?x=1` all refused (config error); `https://api.nuvion.dev/` and a trailing space are accepted because the Hub's own reader normalises them to the same exact sandbox host. Fintava (NODE_ENV=production): live host refused ("runs in live"), empty refused, unknown host, lookalike hosts and a local address refused; the sandbox host passes the proof. Unset `WALLET_PROVIDER` with no Fintava host: "runs in local", refused. A live key on the sandbox host: not detectable by the script (it reads no key); the sandbox host would answer 401, the balance read fails and the script refuses ("could not be read"), so no deletion, but a sandbox-host/live-DB mix is only guarded by that. Flutterwave keys are not proven at all (B1).
4. **Dry run** writes nothing: see V4 row. Email outbox and all 17 WAWU ID tables identical.
5. **Apply** (target A: wallet with 100,000,000 kobo at the stand-in, 2 pieces, one bought by D, 2 storage files, real WAWU ID login): changed rows were only A's: ContentPiece 3 to 2 (unsold deleted; the sold one stays `removed`, creator set to `deleted-account`), D's Purchase still points at it (R-130 held), FintavaWallet 1 to 0, UserProfile, AccountDeletion +1, AccountDeletionContent +1; storage: unsold file deleted, sold file kept for the buyer. WAWU ID: A's row anonymised (email null, phone `deleted:<id>`, names null, status banned, deleted_at and sessions_revoked_at set), refresh tokens 2 to 0, `/auth/refresh` with the old refresh token 401, login 404; the email then signed up again (insert succeeded). Audit: `AccountDeletion` row `purged`, reason `ops_delete_test_account`, purge note "1 content piece(s) that buyers paid for were kept hidden and anonymised". Rerun with the old phrase after a re-sign-up with the same email: new account matched, phrase mismatch, REFUSED, nothing changed; rerun with no match: "Nothing to do", exit 0.
6. **Half-done runs.** WAWU ID down from the start: exit 2, only an `AccountDeletion` row at `purging` (identity not marked, no Hub data touched, account still active); rerun finished (purged, anonymised). WAWU ID answers mark but fails the anonymise (proxy returning 503 on DELETE): exit 2, Hub data gone, WAWU ID `pending_deletion` (sign-in refused, email still held), row `purging` with `purgeBlockedBy identity_service`; dry run shows `Hub profile: none, Deletion row: purging`; rerun finished. `kill -9` right after the mark (3 pieces still there): rerun finished and left 0 rows.
7. **`purgeNow` and the sweep.** The diff to the sweep service is the added method only; the hourly pass and `purgeOne` are untouched, and the 29 account suites (which hold the 30-day grace cases) pass. `purgeNow` has one caller, the script; no controller or provider calls it. The script's Nest module has no `ScheduleModule`, so no cron or interval runs in the script process.
8. **Server commands.** `set -a; . /etc/wawu/hub-api.env; set +a` is the same load `deploy.sh` and `resign-content-urls.yml` use; the file sets `NODE_ENV=production`, so the Fintava host rule applies as on the Hub. `nest build` (49 s here) emits `dist/scripts/ops/delete-test-account.js` next to `dist/src`; I ran that file with its `node` command from a different cwd with the stack's env: it works as written (the entry is `dist/src/main.js`, not `dist/main.js`, which is pre-existing). `pg` and `reflect-metadata` are runtime dependencies. No `.env` is read (rsync excludes it). Output never printed a host, key or the connection string (a refused connection with a password in the URL printed only `connect ECONNREFUSED 127.0.0.1:1`). `git ls-files` shows no `dist`, `dist-odt` or other build output. Not run on the live server (not allowed); see L4.
9. **Tests.** Diff against main: 1 added script, 1 added spec, 1 method added to the sweep; no existing test or gate touched.

Mutants not run (budget).



## Round 1 builder report (11 Nov 2026, Hub `9f054474` on `109213b5`)

Files: `scripts/ops/delete-test-account.ts` (changed), `scripts/ops/real-money-rows.ts` (new, the table list), `src/account/tests/ops-delete-test-account.contract.spec.ts` (12 cases, was 8). No schema change, no new route, no fenced file.

**B1 (lead ruling, 11 Nov).** The script refuses outright when the account has any row that touches a real-money provider, pending or final. The dry run prints every such row (table, id, status, amount in kobo, class and why); apply refuses with the same list; there is no flag. Whole-naira columns are shown as naira times 100. A table that cannot be read is listed as unreadable and refuses. The classification, with the provider of each table (unclear is live):

| Table | Account columns | Rule | Provider and why |
|---|---|---|---|
| CreatorWallet | wawuUserId | refuse any row | Flutterwave (live, R-1) payout subaccount |
| WalletLedgerEntry | wawuUserId | refuse any row | Flutterwave (live, R-1) wallet ledger |
| WalletWithdrawal | wawuUserId | refuse any row | Flutterwave (live, R-1) payout withdrawal |
| Purchase | buyerWawuId, creatorWawuId | refuse any row | Flutterwave (live, R-1) card payment, buyer or seller |
| VerificationPurchase | wawuUserId | refuse any row | Flutterwave (live, R-1) tick payment |
| DirectMessage | senderWawuId, creatorWawuId | refuse any row | Flutterwave (live, R-1) paid DM, either side |
| CreditPurchase | userWawuId | refuse any row | Flutterwave (live, R-1) credits bought |
| CreditLot | userWawuId | refuse any row | credits bought with money |
| CreditSpend | userWawuId, creatorWawuId | refuse any row | credits spent; the host is owed a share of money paid on Flutterwave |
| CreditsState | userWawuId | refuse any row | a credit balance bought with money |
| PendingCharge | wawuUserId | refuse any row | Flutterwave (live, R-1) charge waiting for its answer |
| BillPayment | buyerWawuId | refuse any row | Flutterwave (live, R-1) bill |
| HealthSubscription | wawuUserId | refuse any row | Flutterwave (live, R-1) health plan |
| EventOrder | buyerWawuId | refuse any row | Flutterwave (live, R-1) event tickets |
| ShopOrder | buyerWawuId | refuse any row | Flutterwave (live, R-1) shop order |
| MakerPurchase | wawuUserId | refuse any row | payment by reference; provider not stated in the schema (unclear is live) |
| MakerExtraProducts | wawuUserId | refuse any row | payment by reference; provider not stated in the schema (unclear is live) |
| PlanTransferOrder | wawuUserId | refuse any row | no provider column (unclear is live) |
| MoneyPayoutAccount | wawuUserId | refuse any row | a bank account for payouts (provider not stated; unclear is live) |
| StoreCredit | wawuUserId | refuse any row | store credit (provider not stated; unclear is live) |
| CommunityPass | userWawuId | refuse any row | a pass bought with money (provider not stated; unclear is live) |
| CommunityPassRefund | userWawuId, hostWawuId | refuse unless row.provider is the running provider | wallet provider refund, either side |
| WalletCard | wawuUserId | refuse unless row.provider is the running provider | wallet provider card |
| StoreEarning | payeeWawuUserId | refuse unless row.provider is the running provider | wallet provider earning |
| StoreEarningPayout | payeeWawuUserId | refuse unless row.provider is the running provider | wallet provider payout |
| PointConversion | wawuUserId | refuse unless row.provider is the running provider | wallet provider cash-out |
| WalletTransfer | payerWawuUserId, recipientWawuUserId | refuse unless row.provider is the running provider | wallet provider transfer, either side |
| AddMoneySession | wawuUserId | refuse unless row.provider is the running provider | wallet provider top-up |
| EarningMove | payeeWawuUserId | refuse unless row.provider is the running provider | wallet provider earning move |

The wallet provider's own tables (`FintavaWallet`, `WalletHold`, `WalletPayment`, `EarningSettlement`, `FxAccount`, Capital and the rest) are sandbox-only and stay under the existing money check. Not listed because they hold no money: `MoneyRequest`, `PriceListMove`.

**M1.** `--allow-test-holds` is removed (an unknown option now refuses). Any open hold, waiting earning, payment in flight, cash-out or wallet opening always refuses, on either side, and the dry run says what to settle first.

**Lows.** A refusal prints no `Audit:` line (and exit 2 prints none either; only a purge prints it). The server commands load the WAWU ID string inside a subshell. The 900 s token window is in the task file as a known limit. L5 (spaces around a stored email) fails closed and is left.

**Tests that fail on `109213b5`** (5 of the 12 failed there, run against the old script): the verifier's seed (CreatorWallet, pending WalletLedgerEntry and WalletWithdrawal, pending Purchase, BillPayment, a WalletCard of another provider, CreditPurchase and CreditLot): the dry run lists each, apply exits 1, every table is unchanged; the payee side of an open hold refuses; `--allow-test-holds` is an error; a refusal prints no Audit line. And a clean sandbox-only account (a wallet with a balance and a WalletCard of the running provider) still deletes. The R-130 assertion moved out of this spec: a sale writes a Flutterwave `Purchase`, which the script now refuses; R-130 stays held by `sold-content-survives.contract.spec.ts`.

**Checks:** tsc (alone, 4 GB) EXIT 0; eslint on the 3 changed files EXIT 0; gates EXIT 0; baseline EXIT 0; the spec 12 of 12 EXIT 0; account and account-purge suites on a fresh database, `--runInBand`: 29 suites, 392 tests, EXIT 0.

## Round 2 Builder report (11 Nov 2026)

Hub `wmt/OPS-DEL-TEST` d4d76123 (on 9f054474). Changed: `scripts/ops/real-money-rows.ts` (exports and return shapes kept; the query now ANDs a table's `only` filter with its account columns, and three exports are added: `WALLET_PROVIDER_TABLES`, `NOT_MONEY_TABLES`, more `REAL_MONEY_TABLES` rows), the ops spec (R-130 test, a test seeding the three Flutterwave tables), a new `ops-real-money-schema-walk.contract.spec.ts`.

Classification:
- LegalRequest: real money (Flutterwave consultation or service fee). Refuses when `consultationTxRef` or `serviceTxRef` is set.
- WaitlistRegistration: real money (Flutterwave, /join). Refuses any row claimed by the account.
- ServiceApplication: real money (Flutterwave CAC fee). Refuses when `amountPaid` is set.
- StorePurchase: real money (App Store / Play), buyer or creator owed a share. Refuses unless `environment` is `sandbox`.
- StoreSubscription: real money (store), no environment on the row, so unclear is live. Any row refuses.
- StorePurchaseIntent: not money, a price quote; money moves only in a StorePurchase.
- FintavaLedgerEntry: provider-scoped (`provider` column), either side; a row of another provider than the one running refuses.
- WalletBill, SchoolEnrolment: wallet-provider money (paid through WalletPayment and WalletHold, no Flutterwave field, no provider column); covered by the sandbox proof and the money service. Listed in `WALLET_PROVIDER_TABLES`.
- MoneyBeneficiary: not money, a saved payee.
- KycSubmission: not money, an identity review; the payout bank is a destination.
- Found by the walk: CreditSpendEarning (host share of Flutterwave-bought credits): real money, refuses. The remaining ~60 flagged models are placed in `WALLET_PROVIDER_TABLES` or `NOT_MONEY_TABLES`, each with a reason.

Open for the verifier: wallet-provider tables with their own `provider` column (FintavaWallet, FintavaWalletOpening, EarningSettlement, EarningDeduction, SchoolSettlement and others) are listed as covered by the money service, not row-checked by provider here, as in round 1.

Evidence (own database `odt_r2`, deleted after): `npm run test:contract -- src/account/tests/ops-` 2 suites, 18 tests, EXIT 0. The walk spec fails on 9f054474's list (68 unclassified models, shown by running it against that file with empty new lists) and passes on the new one. eslint on 3 files EXIT 0. `gates/run.py` EXIT 0, `check_baseline.py` EXIT 0. `tsc --noEmit` EXIT 2 only for `sharp` missing from the shared node_modules (`storage/thumbs`), nothing in changed files. The specs ran with `sharp` installed in scratch outside the repo (NODE_PATH), nothing in shared node_modules. Full account and account-purge suites: NOT RUN.


## Round 2 Verifier report (11 Nov 2026, T2)

T2 verifier, a different session from the builder. Hub `wmt/OPS-DEL-TEST` d4d76123 (round 2) against 9f054474 (round 1) and `origin/main` bf3f4a3b. Own database `odt_v3` (Postgres 127.0.0.1:14001, migrated), `sharp` installed in a scratch folder outside every repo (NODE_PATH). **Verdict: FIX** (2 findings of medium severity, both small; B1 of round 1 is closed for the tables it named).

| Pass | Result | Evidence |
|------|--------|----------|
| V1 | passed | tsc EXIT 2 only for `sharp` missing from the shared node_modules (2 lines, both `storage/thumbs`, nothing in changed files; same as the builder); eslint on the 3 changed files EXIT 0; `jest --runInBand src/account/tests/ops-` 2 suites, 18 tests, EXIT 0 |
| V3 | failed | M1, M2 below |
| V4 | passed | dry runs: row count of every public table (252 Hub tables) identical before and after; the WAWU ID gateway is not called (no schedule, no finalize) in any refusal or dry run |
| V6, V7, V9 | passed for what the diff changes | sandbox proof, phrase, no waiver flag, rerun after a cut-off: unchanged code (`git diff 9f054474 d4d76123` is `real-money-rows.ts` and two specs only) and their cases pass |
| gates | passed | `gates/run.py` EXIT 0 (0 fail, 139 warn, 88 accepted, 2243 files); `check_baseline.py` EXIT 0 (125 entries) |
| account and account-purge suites | NOT RUN | shared machine; GitHub's PR run is the evidence |

### Findings

**M1 (medium, defect, blocks): the 100-row cap lets a row of the other provider slip through.** `scripts/ops/real-money-rows.ts:434` reads `take: 100`, and the provider test (`isRowOf`, line 450) runs in JS afterwards. For the `provider` class tables (round 2 moved `FintavaLedgerEntry`, the highest-volume one, into this class) a row of the other provider that is not among the first 100 rows read is never seen. Reproduced on `odt_v3`: an account with 3000 ledger rows of the running provider (fintava) and one row `provider = 'nuvion'` (once with `occurredAt` far future, once far past, once inserted last): the dry run prints `Real-money rows: none`, exit 0, so apply would go ahead. With 120 rows the odd row was found in all three variants, so the cut-off depends on the plan's row order; do not read 100 as a safe size. This breaks the rule the table is built on ("a row of any other provider refuses") on exactly the case the rule is for (a server that switched provider and an account with history on both). `FintavaLedgerEntry` is `OWNED`, so apply deletes those rows. Fix: put the provider test in the query (AND with `NOT` of `rowsOf(running)` from `src/wallet-provider/provider-rows.ts`, then `take` only to cap the printout), and add a spec with more than 100 running-provider rows and one other. Live-class tables are not affected (the first row already refuses).

**M2 (medium, defect, blocks): a CAC application waiting for its Flutterwave payment is not refused.** `real-money-rows.ts:215-222` lists `ServiceApplication` only where `amountPaid` is not null. `service-application.service.ts:112-130` creates the application at `awaiting_payment` with `amountPaid: null` and starts the Flutterwave charge (tx_ref prefix plus the application id); `verifyCac` (line 190 on) and the webhook settle it later and only then write `amountPaid`. An account that has started and not finished (or just paid, before the webhook lands) shows `Real-money rows: none`; apply deletes the row and the charge lands on nothing. I seeded the shape (CAC application, `amountPaid` null): dry run clean, exit 0. Round 1's ruling is "pending or final". Fix: drop the `only`, or use `OR [{ amountPaid: not null }, { status: 'awaiting_payment' }]`; add the case to the Flutterwave spec. The other two new Flutterwave tables are fine on this point: `LegalRequest` gets its tx ref when the fee is booked (`legal.service.ts:469`, `:864`, `legal-fee-wallet.service.ts:299`), so pending and paid both refuse; a `consultationPaidAt` with no tx ref cannot be written (`legal.service.ts:508` requires the ref first).

### B1 (round 1) closed

Seeded on `odt_v3` one account per table, each its own spec case in a scratch copy of the builder's harness (real services, real database, Fintava double): `LegalRequest` with `consultationTxRef`; `LegalRequest` with `serviceTxRef` only; `WaitlistRegistration` claimed with `flutterwaveTxId` and `paidKobo`; `ServiceApplication` with `amountPaid`; `StorePurchase` environment `production`, buyer side and creator side; `StoreSubscription`; `CreditSpendEarning` (host side); `FintavaLedgerEntry` of provider nuvion, either side; `CreditsState` with 5 credits. In every case the dry run lists the row (table, id, status, kobo, why), apply with the right phrase exits 1 with `touch a real-money provider`, every public table's row count is identical before and after, and the WAWU ID gateway got no call. Controls that must not refuse also held: a `LegalRequest` with no payment fields; `ServiceApplication` with `amountPaid` null (see M2); a `WaitlistRegistration` claimed by another account or unclaimed under this account's email; `StorePurchase` `sandbox`; ledger rows of the running provider or with a null provider; `CreditsState` 0. The `only` filter change: a clean account X is not refused because account Y has a paid legal request (the extra filter is ANDed with the account columns, not replacing them). Round 1 had `only` on one table (`CreditsState`); `OR` of columns with a spread would have clobbered a filter that has its own `OR` (LegalRequest), which the AND fixes. The builder's own cases for round 1's tables (CreatorWallet, ledger, withdrawal, Purchase, BillPayment, CreditPurchase and CreditLot, the card of another provider, and the clean sandbox account that still deletes) pass.

### The classification (read against the code that writes each row)

- `StorePurchase`: right. `environment` is a non-null string the store sets; `not 'sandbox'` also refuses `Sandbox` (conservative). Buyer and creator columns both listed.
- `StoreSubscription`: right and conservative (no environment on the row, so an account that ever held a sandbox subscription is refused for good; say so to the owner if it happens).
- `StorePurchaseIntent`: right, not money (a quote with `listPriceKobo`; money moves only in a `StorePurchase`).
- `FintavaLedgerEntry`: right class (provider column), see M1 for the read.
- `WalletBill`, `SchoolEnrolment`: right, wallet-provider money. Paid through a `WalletPayment` and hold; the money check counts pending payments and open holds; no Flutterwave field.
- `MoneyBeneficiary`: right, a saved payee (bank code and account number, no amount).
- `KycSubmission`: right, an identity review; the payout bank is a destination.
- `CreditSpendEarning`: right.
- Spot-checked beyond those, all right: `PaymentWebhookReceipt` (Flutterwave delivery log keyed by tx_ref, no account column), `NuvionBookTransfer`, `MoneyRequest` (paid by a `WalletTransfer`, which is listed), `ReferralReward` (points only), `StoreProceedsEntry`, `ProductDraft`, `ReferralCode`, `AbroadRecipient`, `NuvionReconcileFinding`, `UserProfile`, `CreatorState`, `ContentPiece`, `Community`, `Notification`, `AccountDeletion`, `EmailRecipient`, `FxAccount`, `EarningDeduction`, `SchoolSettlement`, `FintavaWalletOpening`.

### The builder's open question (wallet-provider tables with a `provider` column)

No row of the other provider, and no live-key row, slips through apply on that path:
- `FintavaWallet` of the other provider: `AccountDeletionMoneyService.check` throws unreachable (`account-deletion-money.service.ts:411-418`); the script refuses with "the wallet provider could not be read". Tested: wallet row `provider = 'nuvion'` on a fintava server, apply exit 1, tables unchanged.
- `FintavaWalletOpening` of the other provider in `opening` or `unknown`: blocks as `wallet_opening` whatever the provider (tested). A finished opening holds no money.
- `EarningSettlement`: a database trigger ties it to a payment of the same provider (a settlement with a mismatching payment is rejected by the database), and the check counts the payment or the credit earning with no provider filter, so an owed one always refuses. It is `COUNTERPARTY` in the purge map: kept, not deleted.
- `EarningDeduction` is `COUNTERPARTY` (kept). `SchoolSettlement` has no account column (school and WAWU shares); no account purge touches it.
- Live-key rows: no row carries an environment, so a final record from a live period cannot be told from a sandbox one (only the host is proven). A live wallet's balance read from the sandbox host fails and the script refuses. Final records only could be removed. This is the known limit already in the task file. Does not block.

### The schema walk

Fails on 9f054474's list and passes on d4d76123's: I ran the real spec with 9f054474's `real-money-rows.ts` plus two empty exports: 3 of 4 cases fail, the first with 68 unclassified models; on d4d76123 4 of 4 pass and none is unclassified. The pattern is `kobo|amount|price|fee|txref|tx_ref|flutterwave|payment|provider|balance|paid`. I walked the schema for the names the lead listed (`total`, `charge`, `cost`, `reference`, `ref`, `settled`, `payout`, plus `purchase`, `order`, `bill`, `pay`, `refund`, `cash`, `currency`) on the unclassified models: 33 hits, all read; none holds money: `EventPass` and `PersonBilling` (`purchaseRef`) and `PointLot` and `PointLedger` and `PointHold` (`sourceRef`, `reference`, points never naira, the cash-out is checked by the money service) are grants or records derived from a purchase table that is listed; `CommunityMessage.costInCredits` is a credit count; `FintavaWebhookEvent` and `NuvionWebhookEvent` are delivery logs; the rest are order/sort/tier/id names. Low, test gap: widen the pattern with `ref|purchase|payout|settled|cost|total|charge|currency` so a new table with only such a name is caught, and classify the six above.

### Other

- R-130: the new case passes (seller refused on dry run and apply, buyer refused on apply, `Purchase` and the piece unchanged, every table identical, no WAWU ID call). Together with the Hub's `sold-content-survives` spec this holds.
- Unchanged, re-checked: the sandbox proof case; no waiver flag (`--allow-test-holds` is an unknown option); a missing or wrong phrase; the rerun after a cut-off run (WAWU ID down, then finished); dry run writes nothing; a refusal prints no `Audit:` line. `git diff 9f054474 d4d76123` shows only `real-money-rows.ts`, the ops spec and the new walk spec; `delete-test-account.ts` is untouched.
- Low: the walk spec only reads names, so a field in a JSON column (a payment reference inside `Json`) is invisible to it.

NOT RUN: the full account and account-purge suites (GitHub's PR run); the script on the server or against any provider.
