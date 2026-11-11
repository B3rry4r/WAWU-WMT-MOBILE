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

As of 11 Nov 2026, fix round 1.
- **Status:** built, verifying (round 1 of 2). Round 0 verifier said FIX: `SchoolPayee` test ids stayed (high), the schema walk could not see them (medium), and the lead ruled that the unit retired is the Nuvion TEST WALLET, not the person. Round 1 does all of that. Hub `wmt/NUV-LIVE` (head in `history/NUV-LIVE.md`, "Builder report, fix round 1"), on main `158be141`. No schema change, no fenced file, no contract change (`contract:build` leaves `contract/` as it is).
- **Files (Hub):** `scripts/ops/nuvion-live-reset.ts` (the command), `scripts/ops/nuvion-live-reset-kinds.ts` (every kind and its reason, the SQL steps), five specs under `src/money/tests/ops-nuvion-live-reset*.contract.spec.ts` (behaviour, live keys, schema walk, school payout, bill probe).
- **Owner commands** (on the server, still on the test keys; after the two account deletes and the community clear, before the keys change):
  `cd /srv/wawu/hub-api; set -a; . /etc/wawu/hub-api.env; set +a`
  dry run: `node dist/scripts/ops/nuvion-live-reset.js`
  apply: `node dist/scripts/ops/nuvion-live-reset.js --apply --confirm "RETIRE <n> NUVION TEST WALLETS"` (the dry run prints the exact phrase; n is the people to retire).
  **If it exits 2, run the same command again.** Exit 2 means not finished and safe to run again. One cause is a person who opens a wallet while the command runs: the plan was made before, the audit at the end counts what is left, says so, and exits 2; the next run retires that wallet too. The other cause is a refused person (below): settle the row the dry run names, then run again. Keep the server quiet while it runs if you can, but nothing breaks if it is not.
- **The rule (lead ruling, 11 Nov 2026, replacing round 0):** the unit retired is the Nuvion test wallet. For EVERY person with a Nuvion test row the command retires the wallet, entity, accounts, opening, onboarding, documents, identity rows, BVN and phone claims, and every Nuvion-provider money row that is provably test money. After apply nobody keeps a Nuvion test id the live server could read. Real money (Flutterwave, a store purchase that is not a sandbox one, Fintava, other providers) was never a Nuvion row: no step reaches it, and a person who holds it is retired all the same. WAWU Credits and Studio points are counts and are never touched; a credit balance is never a reason to keep anything. There are no "kept people" any more.
- **Rows that stay, listed in the dry run (never touched).** Only a Nuvion-provider row that cannot be proven test money. There are exactly three kinds, all real store money:
  1. `StoreEarning`, provider `nuvion`, of a store purchase that is not sandbox, status `owed`. It holds no Nuvion id. It stays owed and lands on the person's live wallet (R-11). Does not refuse.
  2. `EarningDeduction`, provider `nuvion`, from a refund of a real store purchase (`storePurchaseId` set, not sandbox). It holds no id. It is taken from the next live move. Does not refuse. (A deduction from a community pass refund or a sandbox purchase is test money and is relabelled.)
  3. `StoreEarningPayout`, provider `nuvion`, of such an earning, that is not final (`pending`, including one waiting for review). **This is the one row that REFUSES its person.** It holds the TEST merchant account number and the TEST destination account number, and the store payout sweep would send from them once the person has a live wallet. The person's whole apply is refused (nothing of theirs is touched, their wallet stays), the row is listed by id, and there is no override. The owner settles that row first (for example by cancelling that payout as an owner's call, after which the earning is planned again on live with the live merchant account), then runs the command again. A final payout (`paid`, `cancelled`) holds nothing a sweep reads and does not refuse.
  Specs prove it: every other kind of Nuvion row on a person (the person with a row of every kind in `ops-nuvion-live-reset.contract.spec.ts`) retires with exit 0 and refuses nobody; real money rows (Flutterwave payout subaccount, pending charge, credit balance) are retired around and left as they were; the source has exactly one `refuses: true`; a person with owed real earnings, a final payout, a real debt, and a sandbox payout is retired, and the person with a pending real payout is refused, then retired once that row is cancelled; a payout that appears between the plan and the person's transaction refuses inside the transaction.
- **It prints** the proof line (sandbox host proven, address and key not printed; the key is also checked not to start with `nv_live_`), the people found, to retire and refused, rows per kind (deleted, closed, relabelled, cleared), per person an id and counts (no name, email, phone, BVN or account number), the rows that stay (with `REFUSES` marked), each refused person, the phrase, and after apply one line per person plus an audit line. Exit 0 done or nothing to do, 1 refused (live keys or a live-shaped key, no proof, wrong phrase), 2 not finished (a refused person, a failed person, or rows left; safe to run again). On live keys it refuses before it connects. A dry run exits 0 and writes nothing.
- **Refused at the door:** the host must be Nuvion's sandbox host (`proveTestProvider`), AND `NUVION_API_KEY` must not start with `nv_live_` (case and quotes ignored; the key is read, never printed; the refusal line says so without it).
- **A retired row says `nuvion_test`** in its `provider` column. No server runs that provider, so no read or sweep picks it. Rows in motion are also made final (some paths, like the payment sweep, read by status and not by provider), and their timers, review marks and fee-owed flags are cleared. The command has no provider code: it reads and writes the database only (a spec checks its source).
- **Per kind (reasons in `nuvion-live-reset-kinds.ts`):**

| Kind | Action | Why every read still works |
|---|---|---|
| FintavaWallet, FintavaWalletOpening (provider nuvion) | deleted | the screen answers "no wallet yet"; the unique BVN hash and phone are free, so the same BVN and phone open again |
| NuvionEntity, NuvionOnboarding, NuvionDocument | deleted | live Nuvion does not know them; the identity check starts again |
| WalletIdentity, SelfieMatchAttempt, BvnCheckAttempt | deleted | R-138: the identity check is done again on live |
| FintavaLedgerEntry (person's own), its references and notices, MoneyReceipt | deleted | history is read by the current account number, so a live wallet never shows them; the daily limits add a person's rows with no account filter, so they must go |
| FintavaLedgerEntry (WAWU's own account, no person) | relabelled, timers cleared | the live check compares only its provider |
| EarningSettlement, EarningMove | deleted (owed and landed) | every settlement is wallet money of the test system (a sale's payment, or a host share of wallet-bought credits: the adoption sweep takes only credits bought with a wallet payment of the running provider); the move table forbids a provider change; a landed test move would also block a live move the same Lagos day |
| EarningDeduction | relabelled if a pass refund or sandbox purchase; a refund of a real store purchase stays and is listed | a test debt is never taken from live earnings; a real debt still is |
| WalletPayment | pending to failed; completed and undelivered to delivered-as-test; relabelled | open key freed (the item can be bought again); what was bought stays the buyer's |
| WalletHold | held to refunded-as-test (release already chosen: released, no transfer); relabelled | the table forbids changing a chosen action; no release, refund, host share or event payout can pay it |
| WalletTransfer, AddMoneySession, WalletCard, FxOperation | in motion to final, fee flags stamped; relabelled | final rows are never selected |
| CapitalOrder | not final to cancelled, fee owed to none, Nuvion ids emptied; relabelled | no fee is taken for a test order |
| FxQuote, FxAccount, FxMovement | quote expired and used; others relabelled | reads are by provider |
| AbroadSend, AbroadQuote, AbroadRecipient | in motion cancelled, fee give-back and settle stamped done; quote used; recipient removed | no provider column, picked by person |
| CommunityPassRefund | pending to refunded-as-test, notified stamped; relabelled | no false message, no payment |
| SchoolSettlement | pending, sent, review to paid or refunded as test; relabelled | its enrolment stays |
| **SchoolPayee** (new) | the counterparty and payment detail ids emptied, row stays | the row belongs to a school, so it is cleared with the unowned rows. The first live school payout sends from the live merchant account with no id, Nuvion makes a fresh counterparty, and the payee row caches the new ids. Spec drives a real payout before the clear (the stand-in is sent the test ids) and after (none) |
| StoreEarning, StoreEarningPayout | of a store SANDBOX purchase only: cancelled; relabelled | a real purchase's earning, debt and payout are the rows that stay (above) |
| PointConversion | held to cancelled and the points hold released in the same transaction | the table forbids a provider change; points stay as counts |
| MoneyBeneficiary, MoneyPayoutAccount | six Nuvion cache columns emptied, row stays | the name check runs again before the first live send |
| NuvionBookTransfer | deleted when an end is a retired entity (or unowned) | test log |
| MoneyCheckRun | relabelled | tonight's live run is not suppressed by a test row |
| NuvionReconcileFinding, NuvionWebhookEvent | open findings resolved; pending or failed events marked processed with a note | the dispatcher takes only `pending`; history stays |
| WalletBill | follows its payment (probed) | bills ride on Fintava only (R-45), so a Nuvion-era bill does not exist; a bill hung on a retired payment is neither delivered nor looked for (spec with a recording Fintava client; the control is asked) |
| WalletPaymentFx, BillPayment, HealthSubscription, EventOrder, AccountDeletion, PaymentWebhookReceipt, StorePurchase, FintavaWebhookEvent, vendor ids | follow or untouched | named with a reason in the kinds file |

- **Schema walk (widened):** the walk now flags every column that can hold a provider id: `provider*`, `nuvion*`, `entityId`, `bvnHash`, `customerId`, `walletId`, `accountId`, `*CounterpartyId`, `*PaymentDetailId`, `fintava*`, `*TransactionId`, `merchantAccountNumber`, `destinationAccountNumber`, `recipientAccountNumber`. It newly flags five models: `SchoolPayee` (cleared), `WalletBill` (follows, probed), `PaymentWebhookReceipt` (Flutterwave log, untouched), `StorePurchase` (store id, untouched), `FintavaWebhookEvent` (Fintava log, untouched). A self-test adds a fake model with each kind of column and fails if the regex is narrower; it also shows the round 0 regex missed `counterpartyId`, `paymentDetailId` and `fintava*`.
- **Owner decisions:** (a) from round 0, "a KEPT person still carries a test wallet, settle by hand" is **withdrawn** by the lead ruling: nobody is kept. What the owner may still have to settle is the rare refused person: a pending payout of a real store purchase (read the list in the dry run before choosing the day). (b) Store SANDBOX earnings are test money of another kind; the command cancels them for every person it retires. (c) People with no row of the test system are not listed at all. (d) A real store-refund debt that had been partly taken from a test earning move comes back in full once the test move is deleted (the take is deleted with it); it is taken again from live earnings. The debt is real, so this is the safe direction.
- **Not run:** the reconcile sweep and a replayed test webhook (by construction only), the whole contract suite (CI), the real command on the real database. History: `tasks/history/NUV-LIVE.md` has the builder reports and the round 0 verifier report.

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
- **What stays:** anything bought or unlocked with test money stays the buyer's; WAWU Credits and Studio points stay as counts; Flutterwave, Fintava, store and every real-money row are untouched. If the dry run finds a Nuvion-provider row it cannot prove is test money, that row stays untouched and is listed; if it holds a Nuvion test id that a live sweep would use (an unfinished payout of a real store purchase), that person's apply is refused, listed by row, with no override. Lead ruling 11 Nov 2026 (the unit retired is the test wallet, not the person) replaced the round 0 rule that kept a whole person.
- **After apply, on live keys** (proven by specs with the provider stand-in on a production-shaped config): a reset person's wallet screen answers "no wallet yet" and opening starts from the beginning; the same BVN and phone are accepted; the money routes, the earnings sweep, the reconcile and the nightly check make no call with a test id; running the command again finds nothing.
- **Tests** (contract specs on the test database, stand-ins only, never a live provider): dry run writes nothing; the phrase must match; apply retires exactly what the dry run listed; a person with real money is retired and the real rows are untouched; only an unfinished payout of a real store purchase refuses a person; a payment or hold in flight is closed with no provider call; a test-money earning is never paid on live (try the sweep, a retry, a webhook and the reconcile); a real-money earning still lands; the protected suite passes; a schema-walk spec fails if a model with a Nuvion id or a `provider` column is left unclassified.

## Capability checks

- [ ] The owner can run the dry run and see every test wallet record it would retire, with no personal data printed.
- [ ] After apply, a person who had a test wallet can open a wallet on live with the same BVN and phone.
- [ ] No test-money earning, refund, hold, payout or fee can be paid from a live account after apply, by any path.
- [ ] A person with real money is retired and nothing real is touched; a Nuvion row that cannot be proven test money stays and is listed, and one that holds a test id refuses its person by row.
- [ ] The command refuses on live keys and calls no provider.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/NUV-LIVE.md](history/NUV-LIVE.md).

## Owner sign-off
