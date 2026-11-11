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

## Verifier report, round 1 re-check (11 Nov 2026, Hub `9f054474` on `109213b5`, main `bf3f4a3b`)

T2 verifier. Local stack odv2_test (real WAWU ID on 16631, Nuvion stand-in, Postgres 14001, databases `odv2_test_*`). **Verdict: FIX (1 blocker).** Round 0's B1 and M1 are fixed for every table on the builder's list, but the list itself misses tables that hold Flutterwave payments, and the script deletes those silently.

| Pass | Result | Evidence |
|------|--------|----------|
| V1 | passed | tsc (alone, 4 GB) EXIT 0; eslint on the 4 changed files (no --fix) EXIT 0; gates EXIT 0 (2242 files, 0 fail, 139 warn, 88 accepted); baseline EXIT 0; new spec 12/12 EXIT 0 on a fresh db; account + account-purge suites: NOT RUN to the end (see the line under the table) |
| V3 | failed | blocker 1 (list incomplete) |
| V4 | passed | every dry run: Hub row counts of all 251 tables and the WAWU ID checksum unchanged (`CommunityNoticeCursor`, the running Hub's own ticker, excluded) |
| V6, V7, V9 | passed for what the list covers | see below |

### Blocker

**B1 (defect): real-money tables the list does not cover are deleted with no refusal.** Seeded one account per table (a row naming the account) and ran dry run then apply:
- `LegalRequest` with `consultationTxRef` set and `consultationPaidAt` (a legal consultation paid by Flutterwave; `payment-webhook.service.ts` settles it by `consultationTxRef`): dry run `Real-money rows: none`, apply exit 0, row deleted.
- `WaitlistRegistration` with `claimedByWawuId`, `flutterwaveTxId`, `paidKobo` 100000 (a paid Flutterwave waitlist spot, disposition OWNED): dry run `none`, apply exit 0, row deleted.
- `ServiceApplication` with `amountPaid` 5000 (the CAC fee, "Flutterwave-gated" in `service-application.service.ts`, OWNED): dry run `none`, exit 0 (would delete).
Under the lead's ruling (any row touching a real-money provider, unclear counts as live) these must refuse. Also dry run `none` and exit 0, so also unlisted: `StorePurchase` (buyer; App Store and Play money, `environment` production; the row is kept anonymised, so not lost, but it is real money), `StorePurchaseIntent`, `StoreSubscription`, `WalletBill`, `SchoolEnrolment`, `FintavaLedgerEntry`, `MoneyBeneficiary` (bank details), `KycSubmission` (payout bank). The last four are wallet-provider or identity rows and arguably belong under the provider rule; the builder should classify each in the table, not leave it silent. Fix: add LegalRequest, WaitlistRegistration (claimedByWawuId) and ServiceApplication as `live` any-row; classify the store tables (live) and the others; add a spec seeding each; and a spec that walks the schema (every model with a Flutterwave, TxRef, card or amount column and an account column must be in the list or in a short "not money" list), so the next table cannot be missed.

### Medium

None.

### Low

- L1: `StorePurchase` creator side (COUNTERPARTY) and the other-side columns of `WalletBill`/`SchoolEnrolment` are not looked at by the list; part of the B1 fix.
- L2: the spec no longer asserts R-130 (the sold-piece case moved out because a sale writes a `Purchase`, which now refuses). R-130 holds by refusal for every sale path I found (`purchase.create`, `tip-wallet`, `unlock-wallet`, `store-grant` all write a `Purchase` row with `creatorWawuId`); the spec seeds the buyer side only. A seller-side `Purchase` case in the spec would pin it (I ran it by hand: refused).
- L3: the server command sources WAWU ID's env file into the same subshell; any variable that file defines and the Hub's file does not (a port, a secret) reaches the script. Nothing read it in my run (only `DATABASE_URL` differed). Prefer `grep '^DATABASE_URL=' file` or the `read -rs` form.
- L4: `--confirm --allow-test-holds` parses as a confirm value and then fails the phrase check, so it still refuses (harmless).

### What was attacked and held

1. **B1, listed tables (29).** Seeded one row per table, one table at a time, on a fresh account (rows via SQL with foreign keys off so each table stands alone): CreatorWallet; WalletLedgerEntry pending and final; WalletWithdrawal; Purchase buyer pending, buyer final, seller final; VerificationPurchase; DirectMessage both sides; CreditPurchase; CreditLot; CreditSpend both sides; CreditsState (balance above 0); PendingCharge; BillPayment; HealthSubscription; EventOrder; ShopOrder; MakerPurchase; MakerExtraProducts; PlanTransferOrder; MoneyPayoutAccount; StoreCredit; CommunityPass; CommunityPassRefund both sides with provider fintava; WalletCard provider flutterwave and fintava; StoreEarning, StoreEarningPayout, PointConversion, AddMoneySession, EarningMove and WalletTransfer (both sides) with provider fintava. Every case: dry run exit 1 with the row listed (table, id, status, kobo), apply exit 1, no `Audit:` line, row counts of every Hub table and the WAWU ID checksum identical before and after. Rows of the running provider (WalletCard nuvion, CommunityPassRefund nuvion) pass, as designed (a sandbox-only account still deletes; see 5). Not seeded: `WalletCard` with a null provider (the column is NOT NULL).
2. **M1.** `--allow-test-holds` prints `unknown option ... There is no flag that waives a blocker or a real-money row.`, exit 1. A held DM with the target as payee, with the target as payer, a completed unsettled sale (waiting earning), and a pending payment with the target on either side each print `REFUSES` with what to settle, apply exit 1, nothing written.
3. **Lows.** A refusal prints no `Audit:` (checked on all refusals above). The server commands run as written against `dist` with two env files in a subshell: the parent shell holds no `DATABASE_URL` and no `WAWU_ID_DATABASE_URL` afterwards, the Hub's value wins, and the string never appears on the command line (the `read -rs` form works too). The 900 s token window is in the Known limits.
4. **Round 0 passes.** Email: `  CLEAN.TGT@odv2.test  ` finds the target; a plus-address, a longer domain and a longer local part (decoys) are untouched (their profile, piece and refresh token remain); `clean.tgt@odv2.te` is "Nothing to do". Wrong phrase and missing `--confirm` refuse. Apply changed exactly `AccountDeletion` +1, `ContentPiece` -1, `UserProfile` -1; WAWU ID: the target anonymised (email null, phone `deleted:<id>`, banned, deleted_at set), refresh tokens 1 to 0, and the same email then registered again. Sandbox proof: `api.nuvion.co`, a lookalike host, an empty host, Fintava without a sandbox host, Fintava live in production and a bogus provider name all refuse (exit 1). Half-done runs: WAWU ID unreachable at the start leaves only a `purging` row (data intact, account active), the rerun finishes (purged, anonymised); `kill -9` right after the row appears leaves `purging` with WAWU ID `pending_deletion` and the email held, the rerun finishes. `purgeNow` has one caller, the script (grep over `src` and `scripts`). `dist` is ignored, nothing built is tracked.
5. **A sandbox-only account still deletes** (clean account above; the spec also covers one with a wallet balance and a WalletCard of the running provider).
6. **R-130.** Every sale path writes a `Purchase` with `creatorWawuId`, which refuses, so no buyer can lose a piece through this script; the purge's own keep rule is unchanged (`purges` suites pass).
7. **Tests.** Spec diff against `109213b5`: 205 added, 35 removed; the removed lines are the old flag, the sold-piece R-130 case (see L2) and the flagged-apply case, all replaced by stronger ones; no gate or baseline touched. Diff against main: 3 added files and the `purgeNow` method on the sweep.

### Not run
The account and account-purge suites (29 files): started twice on fresh databases with `--runInBand`; the first run used the wrong mock-ID variable and failed at once, the second ran 13 minutes on a machine at load average 12 without finishing its first suite, so I stopped it. No result either way. Round 0 recorded 29 suites green on `109213b5`, and this branch changes only the script, its table list, the spec and the added `purgeNow` method, but GitHub's run on the PR is the evidence. The full `test:contract` (GitHub runs it on the PR). Mutants not run (budget).
