---
id: NUV-LIVE
title: A one-off command that retires every test-system Nuvion wallet record before the Hub moves to Nuvion live
owner: YOU
area: MONEY
order: 392
priority: after-launch
repo: wawu-backend
type: money-path
status: verifying
depends_on: []
decisions: [R-138, R-39, R-42, R-11, R-19]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
tier: T2
---
# NUV-LIVE · A one-off command that retires every test-system Nuvion wallet record before the Hub moves to Nuvion live

## Current state

As of 11 Nov 2026.
- **Status:** built, verifying. Hub `wmt/NUV-LIVE` `c7c1862a` (on main `158be141`). No schema change, no fenced file, no contract change (`contract:build` leaves `contract/` as it is).
- **Files (Hub):** `scripts/ops/nuvion-live-reset.ts` (the command), `scripts/ops/nuvion-live-reset-kinds.ts` (every kind and its reason, the SQL steps), three specs under `src/money/tests/ops-nuvion-live-reset*.contract.spec.ts` (behaviour, live keys, schema walk).
- **Owner commands** (on the server, still on the test keys; after the two account deletes and the community clear, before the keys change):
  `cd /srv/wawu/hub-api; set -a; . /etc/wawu/hub-api.env; set +a`
  dry run: `node dist/scripts/ops/nuvion-live-reset.js`
  apply: `node dist/scripts/ops/nuvion-live-reset.js --apply --confirm "RETIRE <n> NUVION TEST WALLETS"` (the dry run prints the exact phrase; n is the people to retire).
- **It prints** the proof line (sandbox host proven, address and key not printed), the people found, to retire and kept, rows per kind (deleted, closed, relabelled, cleared), per person an id and counts (no name, email, phone, BVN or account number), each kept person with the real-money rows that keep them, the phrase, and after apply one line per person plus an audit line. Exit 0 done or nothing to do, 1 refused (live keys, no proof, wrong phrase), 2 failed (safe to run again). On live keys it refuses before it connects.
- **A retired row says `nuvion_test`** in its `provider` column. No server runs that provider, so no read or sweep picks it. Rows in motion are also made final (some paths, like the payment sweep, read by status and not by provider), and their timers, review marks and fee-owed flags are cleared. The command has no provider code: it reads and writes the database only (a spec checks its source).
- **Per kind (reasons in `nuvion-live-reset-kinds.ts`):**

| Kind | Action | Why every read still works |
|---|---|---|
| FintavaWallet, FintavaWalletOpening (provider nuvion) | deleted | the screen answers "no wallet yet"; the unique BVN hash and phone are free, so the same BVN and phone open again |
| NuvionEntity, NuvionOnboarding, NuvionDocument | deleted | live Nuvion does not know them; the identity check starts again |
| WalletIdentity, SelfieMatchAttempt, BvnCheckAttempt | deleted | R-138: the identity check is done again on live |
| FintavaLedgerEntry (person's own), its references and notices, MoneyReceipt | deleted | history is read by the current account number, so a live wallet never shows them; the daily limits add a person's rows with no account filter, so they must go |
| FintavaLedgerEntry (WAWU's own account, no person) | relabelled, timers cleared | the live check compares only its provider |
| EarningSettlement, EarningMove | deleted (owed and landed) | every settlement is wallet money of the test system; the move table forbids a provider change; a landed test move would also block a live move the same Lagos day |
| EarningDeduction | relabelled | a test debt is never taken from live earnings |
| WalletPayment | pending to failed; completed and undelivered to delivered-as-test; relabelled | open key freed (the item can be bought again); what was bought stays the buyer's |
| WalletHold | held to refunded-as-test (release already chosen: released, no transfer); relabelled | the table forbids changing a chosen action; no release, refund, host share or event payout can pay it |
| WalletTransfer, AddMoneySession, WalletCard, FxOperation | in motion to final, fee flags stamped; relabelled | final rows are never selected |
| CapitalOrder | not final to cancelled, fee owed to none, Nuvion ids emptied; relabelled | no fee is taken for a test order |
| FxQuote, FxAccount, FxMovement | quote expired and used; others relabelled | reads are by provider |
| AbroadSend, AbroadQuote, AbroadRecipient | in motion cancelled, fee give-back and settle stamped done; quote used; recipient removed | no provider column, picked by person |
| CommunityPassRefund | pending to refunded-as-test, notified stamped; relabelled | no false message, no payment |
| SchoolSettlement | pending, sent, review to paid or refunded as test; relabelled | its enrolment stays |
| StoreEarning, StoreEarningPayout | only of a store SANDBOX purchase: cancelled; relabelled | an earning of a real store purchase is never touched (its person is kept) |
| PointConversion | held to cancelled and the points hold released in the same transaction | the table forbids a provider change; points stay as counts |
| MoneyBeneficiary, MoneyPayoutAccount | six Nuvion cache columns emptied, row stays | the name check runs again before the first live send |
| NuvionBookTransfer | deleted when an end is a retired entity (or unowned) | test log |
| MoneyCheckRun | relabelled | tonight's live run is not suppressed by a test row |
| NuvionReconcileFinding, NuvionWebhookEvent | open findings resolved; pending or failed events marked processed with a note | the dispatcher takes only `pending`; history stays |
| WalletPaymentFx, BillPayment, HealthSubscription, EventOrder, AccountDeletion, vendor ids | follow or untouched | named with a reason in the kinds file |

- **Kept, never touched, listed:** a person with a Flutterwave, store (not sandbox), credits-with-money or other-provider row (`real-money-rows.ts`, the OPS-DEL-TEST rows), and anyone with a payment, hold, transfer or refund in motion with a kept person. No flag overrides it. The command ends with a warning while any kept person remains.
- **Owner decisions:** (a) A KEPT person still carries a test wallet, and the command never touches them. On live keys their test ids would be read and their test earnings could be swept, so settle each kept person by hand (delete-test-account, or the owner's call) before the keys change. Anyone holding a credit balance above zero counts as real money (unclear is live), so they are kept: read the kept count in the dry run before choosing the day. (b) Store SANDBOX earnings are test money of another kind; the command cancels them for the people it retires.
- **Not run:** the reconcile sweep and a replayed test webhook (by construction only), the whole contract suite (CI), the real command on the real database. History: `tasks/history/NUV-LIVE.md` has the builder report with exit codes.

## Read first

- `docs/WORKFLOW.md`, and `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`
- DECISIONS.md R-138 (this task), R-39 (one provider seam), R-42, R-11 (earnings wait for a wallet), R-19 (held money)
- tasks/NUV-10.md (the go-live checklist this task makes safe)
- wawu-backend: `scripts/ops/delete-test-account.ts` (its `proveTestProvider`), `scripts/ops/real-money-rows.ts`, `scripts/ops/clear-communities.ts` and `scripts/ops/room-money-rows.ts` (the pattern: dry run, typed phrase, one transaction per unit, row locked, money check repeated inside); `prisma/schema.prisma` (every Nuvion model and every model with a `provider` column); `src/nuvion/`, `src/wallet-provider/`, `src/money/` (opening, BVN claims, identity holds, balances, holds, payments, payouts, earnings and their sweep, cards, bills, FX, capital, reconcile and the nightly check)

## Goal

The owner runs one command on the server while it is still on Nuvion's test keys, sees every test wallet record it would retire, types the phrase, and afterwards, on live keys: nobody sees a test wallet, everyone can open a wallet again with the same BVN and phone, the Hub never calls live Nuvion with a test id, and no test money is ever paid out of a live account.

## Scope

- **`scripts/ops/nuvion-live-reset.ts`**, built by the deploy like `clear-communities.ts`, run the same way (`cd /srv/wawu/hub-api; set -a; . /etc/wawu/hub-api.env; set +a; node dist/scripts/ops/nuvion-live-reset.js`).
- **It runs only on the test system.** It refuses unless `proveTestProvider` shows `WALLET_PROVIDER=nuvion` on Nuvion's sandbox host, so it can never touch a live wallet. It calls no provider at all (dry run and apply are database-only).
- **Dry run (default), writes nothing.** Counts, and per person an id (no name, email, phone, BVN or account number): Nuvion entities, accounts and account details, onboardings, documents, identity holds and BVN or phone claims, wallet and ledger rows of provider `nuvion`, holds, payments, transfers, payouts, refunds and fees in flight, earnings waiting or settling that came from Nuvion test money, cards, bills, FX, capital, book transfers, webhook events and reconcile findings; then what apply would do to each kind, totals, and the exact phrase (it carries the person count).
- **Apply:** `--apply --confirm "<phrase>"`. One transaction per person, the person's rows locked first and every check repeated inside. Retire, do not guess: for each kind, record in the task file whether it is deleted, closed (cancelled, refunded-as-test, no provider call) or relabelled so the live server never acts on it, and why that keeps every read working. Prefer keeping money history where a read can show it safely; prefer deleting what would make the Hub think a wallet exists. WAWU's own operational account references from the test system are retired the same way.
- **Test money never becomes real money (R-138 point 3).** After apply, no earning, refund, hold, payout, fee or host share that came from Nuvion test money can be paid from a live account, by any sweep, retry, reconcile or webhook. Earnings from real money (Flutterwave, store) that wait for a wallet (R-11) are untouched and still land when the person opens a live wallet.
- **What stays:** anything bought or unlocked with test money stays the buyer's; WAWU Credits and Studio points stay as counts; Flutterwave, Fintava, store and every real-money row are untouched. If the dry run finds a money row it cannot prove is Nuvion test money, that person is kept and listed, with no override (the OPS-DEL-TEST rule).
- **After apply, on live keys** (proven by specs with the provider stand-in on a production-shaped config): a reset person's wallet screen answers "no wallet yet" and opening starts from the beginning; the same BVN and phone are accepted; the money routes, the earnings sweep, the reconcile and the nightly check make no call with a test id; running the command again finds nothing.
- **Tests** (contract specs on the test database, stand-ins only, never a live provider): dry run writes nothing; the phrase must match; apply retires exactly what the dry run listed; a person with a real-money row is kept; a payment or hold in flight is closed with no provider call; a test-money earning is never paid on live (try the sweep, a retry, a webhook and the reconcile); a real-money earning still lands; the protected suite passes; a schema-walk spec fails if a model with a Nuvion id or a `provider` column is left unclassified.

## Capability checks

- [ ] The owner can run the dry run and see every test wallet record it would retire, with no personal data printed.
- [ ] After apply, a person who had a test wallet can open a wallet on live with the same BVN and phone.
- [ ] No test-money earning, refund, hold, payout or fee can be paid from a live account after apply, by any path.
- [ ] A person with a real-money row is kept and listed; nothing real is touched.
- [ ] The command refuses on live keys and calls no provider.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/NUV-LIVE.md](history/NUV-LIVE.md).

## Owner sign-off
