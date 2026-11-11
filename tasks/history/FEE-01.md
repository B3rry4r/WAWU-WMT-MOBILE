# FEE-01 · round history

Moved out of [tasks/FEE-01.md](../FEE-01.md), oldest first. The current state is in that file.

## Round 1 (builder, 11 Nov 2026)

- Hub `wmt/FEE-01`, first push `171c538c` (schema, migration, routes, contract) so FEE-02 and FEE-03 could build against the shapes; the rule, the quote, VAT, safety, the fee record, the alert and the specs followed in later commits.
- Lead ruling recorded in the task file: fee on top for money out, off what arrives for money in, swap shown as the difference from the provider's rate.
- Gaps handed on: the four non-naira kinds are stored and edited but not yet priced from the schedule (see the task file).

## Round 2, fix round 1 (naira side, builder, 11 Nov 2026)

Rulings are in the task file. Setup changes (no assertion touched): the five Nuvion transfer contract specs (`wallet-transfer-bank-nuvion`, `-fee-back-failed-nuvion`, `-nuvion`, `-nuvion-adapter`, `-wawu-fee-nuvion`) now call `seedFlatFees` after the app starts, which writes a flat fee-schedule row (F) and provider-rate row (P) for the two kinds a send uses; F and P per spec (kobo): bank 2650 and 150; fee-back-failed 1150 and 150; nuvion 3325 and 2325; adapter 2500 and 1500 (the spec only sends under the 500,000 band edge); wawu-fee 1150 and 150. The `NUVION_FEE_*` and `WAWU_FEE_*` env lines in those specs are left in place and are no longer read by the quote.

### Changed assertions

| File | Test | Old | New | R-139 point |
|---|---|---|---|---|
| `src/money/transfers/tests/wallet-transfer-nuvion.contract.spec.ts` (line 311) | Send to a WAWU user (WALLET-07) on the provider seam, Nuvion stood in: Nuvion's first answer is pending ... once Nuvion says successful the sweep completes it, 2,000 to her and 2,033.25 from me | view `fee` `{ providerFeeKobo: 2325, wawuFeeKobo: 1000, totalFeeKobo: 3325 }` | `{ providerFeeKobo: 0, wawuFeeKobo: 3325, totalFeeKobo: 3325 }` (the total 3325 and `totalKobo` 203325 are unchanged) | 1 and 5, lead ruling 1 (one fee in the app) |
| `src/money/fees/tests/nuvion-fees.contract.spec.ts` | the fee schedule filled in: a quote shows one fee, WAWU's, and none of Nuvion's (title was "a quote shows Nuvion's charge and WAWU's fee, adding up to one Fees row, and asks Nuvion nothing") | parts `[balance_transfer provider 1234, wawu_fee wawu 1000]`, fee `{1234, 1000, 2234}` | parts `[wawu_fee wawu 2234]`, fee `{0, 2234, 2234}`; `totalKobo` 2,002,234 unchanged | 1 and 5, lead ruling 1 |
| same | same, the bank quote at 500,000 | parts `[bank_transfer provider 4200, wawu_fee wawu 2500]` | parts `[wawu_fee wawu 6700]`; `totalKobo` 506,700 unchanged | 1 and 5, lead ruling 1 |
| same | the `describe` titles and the setup of the "unset" server: "no Nuvion fee setting" became "no fee schedule row in force (R-139)" and its server reads a schedule with no rows (the database holds the seed rows and is append-only); every assertion in the three 503 `fees_not_set` tests is unchanged | env `NUVION_FEE_*` unset | no schedule row in force | 9 and the task's `fees_not_set` meaning |

| `src/nuvion/tests/nuvion-book-money.contract.spec.ts` (setup: `seedFlatFees` F 1500, P 1500 for the wallet-payment quote) | a payment from a wallet: a payer without the price and the charge is told the shortfall and nothing is sent | `expect(q.fee.providerFeeKobo).toBe(1_500)` | `expect(q.fee).toEqual({ providerFeeKobo: 0, wawuFeeKobo: 1_500, totalFeeKobo: 1_500 })` (stronger: also pins the one fee and its total; every balance and ledger figure in the 24 tests is unchanged, row-level `providerFeeKobo` 1500 still asserted) | 1 and 5, lead ruling 1 |

New assertions (none weakened): the same file gains "Nuvion's charge is in no app answer" (the quote of wawu_transfer, bank_transfer and purchase carries no provider part, `providerFeeKobo` 0, and neither of the spec's Nuvion figures appears anywhere in the answer); `fee-engine.spec.ts` gains the one-fee quote, the leg split and the fee-under-the-provider-charge case (leg moves VAT only, kept negative, alert fires).

### Round 2, further setup and assertion changes (same rulings)

Setup (seeds, via the shared harnesses `test/plans/tier-purchase-harness.ts`, `test/credits/credit-wallet-harness.ts`, `test/payments/wallet-pay-harness.ts`, `test/payments/pay-fx-harness.ts`, and per spec in `wallet-hold-nuvion`, `payment-follow-ups-nuvion`, `payment-poll-nuvion`, `wallet-payment-nuvion`, `nuvion-book-money`): the spec's fee is now two rows (F and P equal to the figure the stand-in charges), removed again in `afterAll` (`removeSpecFees`) so the next spec reads the migration's rows. `test/nuvion/harness-wallets.ts`: the shared Nuvion rig's stand-in charge was stepped (2325 below NGN 5,000, 1575 from it); the schedule has no steps, so it is one flat 2325 (`HARNESS_FLAT_FEE_KOBO`), and the harness `liveFee` follows it. Specs that asserted the 1575 step for amounts from NGN 5,000 now see 2325 through `liveFee`; none of them wrote 1575 as a literal.

Changed assertions (none weakened):

| File | Test | Old | New | Ruling |
|---|---|---|---|---|
| `src/money/holds/tests/wallet-hold-nuvion.contract.spec.ts` (line 176 and the reads of the quoted fee) | all | `q.fee.providerFeeKobo` as "the quoted fee" | `q.fee.totalFeeKobo` (the same number: F = P) | 1 |
| `src/money/payments/tests/payment-poll-nuvion.contract.spec.ts` | check 1, shortfall | `fee: { providerFeeKobo: FEE_KOBO, wawuFeeKobo: 0 }`; reads of `q.fee.providerFeeKobo` | `fee: { providerFeeKobo: 0, wawuFeeKobo: FEE_KOBO }`; reads of `q.fee.totalFeeKobo` | 1 |
| `src/money/payments/tests/wallet-payment-nuvion.contract.spec.ts` | check 3; lead ruling 5 (real debit above or below the quote); every read of the quoted fee | `fee: { wawuFeeKobo: 0 }`; `fee: { providerFeeKobo: Number(higher) }`; `q.fee.providerFeeKobo` | `fee: { providerFeeKobo: 0, wawuFeeKobo: q.fee.totalFeeKobo }`; `fee: { providerFeeKobo: 0, wawuFeeKobo: Number(higher) }`; `q.fee.totalFeeKobo` (the real debit is still recorded and flagged as before; `row.providerFeeKobo` assertions unchanged) | 1 |
| `src/money/payments/tests/payment-follow-ups-nuvion.contract.spec.ts` | the quote fee | `q.fee.providerFeeKobo` toBe QUOTE_FEE | `q.fee.totalFeeKobo` | 1 |
| `src/legal/wallet/tests/legal-fee-wallet.contract.spec.ts` (line 131), `src/plans/purchases/tests/plan-purchase-nuvion.contract.spec.ts` (89), `src/credit-purchase/wallet/tests/credit-wallet-nuvion.contract.spec.ts` (72) | payment quote | `fee: { providerFeeKobo: FEE, wawuFeeKobo: 0 }` | `fee: { providerFeeKobo: 0, wawuFeeKobo: FEE }` | 1 |

New assertions: the fee quote and the payment quote carry the added fields under Nuvion (`wallet-payment-nuvion` check 3, `nuvion-fees.contract`); `scripts/ops/nuvion-live-reset-kinds.ts` classifies `MoneyFeeRecord` (deleted, with a step) and `ProviderRate` (untouched) so NUV-LIVE's schema walk stays green.

### Specs still red on this branch (not aligned; need a round 3)

Baseline (origin/main 148e76a9, same database setup) is red for `admin-events`, `admin-notifications`, `community-message`, `community.contract` and `tier-badge-views`: not mine. Passing on main and red here, because each boots its own app with env-pinned Nuvion fees and has no seed rows yet: `src/community/pass/tests/community-pass-nuvion`, `src/points/convert/tests/points-convert-nuvion`, `src/schools/enrolment/tests/school-enrolment`, `src/schools/settlement/tests/school-settlement` and `school-payout-charge`, and the `src/event-ticketing/tests/event-*` suites (10). Also not run after the harness change: `src/money/cards`, `src/money/earnings`, `src/capital`, `src/money-request`, `src/nuvion/tests/*` other than book-money, `src/wallet-bills`. The fix is the same one-line `seedFlatFees` in each boot (`test/points/cash-out-harness.ts` and `test/schools/school-nuvion-harness.ts` step their fee 1500/2500 and need flattening like the shared rig). The broad run was killed once for memory (exit 137), so that list is partial.
## Builder report, fix round 1 (dollar side), 11 Nov 2026

Hub branch `wmt/FEE-01-usd` at `5e1629a7`, from `origin/wmt/FEE-01` 176859ec. Closes gaps 1, 2 and 5 of round 1 for the dollar and incoming kinds. The naira side is the other builder's.

What each kind now does
- `usd_bank_payout` (USD to a bank): the abroad quote takes the fee from the schedule (1%, min USD 8, max USD 60 as seeded), VAT when `tax.vat_on` is 1; the person pays amount + fee + VAT (`totalMinor`), the recipient gets the amount. The app sees one fee (`feeMinor`, `wawuFeeMinor`, `providerFeeMinor` 0). Inside the Hub the provider's expected charge is the `ProviderRate` row for the kind when one is in force, else the `ABROAD_PROVIDER_FEE_*` estimate, else 0. The quote row keeps the book transfer to WAWU = fee + VAT - expected charge, never below 0 (`abroad-fee-legs.ts` takes it as before). `money.min_withdrawal_minor` (USD line) and `fee_exceeds_amount` refuse at the quote and again at the send. `MoneyFeeRecord` is written when the send is claimed (priced at the quote's time) and the provider's `applicable_fee` is filled in when the send reads it; a difference from the expected charge mails the owner (once a day). The send receipt shows the one fee and no provider charge. Only USD from a dollar account to a bank is priced from the schedule; USD to mobile money and other currencies keep today's configured fee.
- `intl_wire_in`: built and OFF in effect. What Nuvion's inflow record carries (`readNuvionTransfer`): id, entity_id, account_id, amount, applicable_fee, currency, status, type (`inflow`), `payment_type`, unique_reference, counterparty_id, narration, created. Nothing in it, and nothing in `docs/nuvion/DEV-RESULTS.md` (dev never funded a dollar account by bank), says that a dollar inflow is a wire or a local transfer, and no `payment_type` value for either is documented or measured (known values: `bank-transfer`, `book-transfer`, `card-acq`, `capital-*`, `card-debit`). So nothing is guessed: the types that count as a wire are named by `FX_WIRE_PAYMENT_TYPES` (comma list, empty by default). With the list empty no dollar inflow is charged or recorded. With a type named, `DollarFeeService.onForeignInflow` (called from the foreign-account handler after the `FxMovement` is written) writes the fee record (keyed on Nuvion's transfer id) and takes fee + VAT once by a book transfer from the person's dollar account to `FX_FEE_COLLECTOR_USD_BAN` under the reference `<transfer id>-fee`; a replayed delivery finds the record and the provider's leg and moves nothing again. A fee bigger than the amount is cut to the amount (money arriving is never refused). The person's statement line carries `wawuFeeMinor`, `vatMinor` and `receiveMinor` (amount - fee - VAT) as additive optional fields; the line's own `feeMinor` is still the provider's figure from the statement. A missing collecting account marks the delivery `failed` for review and takes nothing. NEEDS THE OWNER: one real dollar wire and one local dollar transfer on Nuvion's sandbox to read their `payment_type`, then set `FX_WIRE_PAYMENT_TYPES`.
- `usd_local_in`: off (`fx.product.local_usd_in.on` 0). Types named in `FX_LOCAL_USD_PAYMENT_TYPES` (empty by default) are recorded with fee 0 and a log line while off, never refused. With the switch on they are charged by the schedule row the same way as a wire.
- `ngn_add_money`: under Nuvion the add-money quote shows only Nuvion's receiving charge (`ProviderRate` `ngn_add_money`) as the one fee, WAWU's fee 0, no VAT; `chargeKobo` = `totalMinor` = the amount, `receiveMinor` = amount - fee. A naira bank-transfer inflow (account number) and a settled add-money session write the record (WAWU fee 0, kept 0, expected and actual charge). Card and USSD stay off.
- `fx_swap`: untouched, still `fx_switched_off`.

Changed assertions (src/money/add-money/tests/add-money.contract.spec.ts; all R-139 point 11, adding money passes the provider's charge on and WAWU adds nothing)
| test | old | new |
| constant `WAWU_FEE` | 50 | 0 |
| constant `CHARGE` | AMOUNT + CARD_FEE + WAWU_FEE | AMOUNT (the fee comes off what arrives) |
| "quotes the amount plus Nuvion's charge plus WAWU's (R-10), both from config" (renamed "quotes the amount, with Nuvion's receiving charge as the one fee taken off what arrives") | wawuFeeKobo 50, feeKobo 125, chargeKobo 1000125 | wawuFeeKobo 0, feeKobo 75, chargeKobo 1000000, plus totalMinor and receiveMinor (amount - 75) |
| "a card that goes through is paid once..." | WAWU's fee moved once under `-wawufee`, wallet short by 50 | no WAWU fee moved (`feeCollectedAt` null, no `-wawufee` book transfer) |
| setup (beforeAll) | fee from `ADD_MONEY_FEE_CARD` env | a `ProviderRate` row (`ngn_add_money`, fixed 75) written after boot, as the stand-in charges 75 |
No other existing assertion was changed. The abroad, fx, Nuvion and fee-engine specs pass unchanged.

Checks (Hub head `5e1629a7`)
- `npx tsc --noEmit` 0; eslint (no --fix) on changed .ts 0.
- New specs: `dollar-fees.spec.ts` 17 of 17 (payout fee, VAT on and off, min, max, provider charge above fee, rate row over estimate, refusals, record, add money, wire collected once and on a replay, VAT, fee bigger than amount, local off, no type named, no collector), `abroad-usd-fee.spec.ts` 6 of 6 (the quote through `AbroadService`).
- Areas run against a migrated `feeusd_test` database with a local mock WAWU ID: abroad, fx, add-money, fees, `src/nuvion/tests`: 58 of 60 suites pass. Failing, not from this change: `nuvion-fees.contract.spec.ts` (3 tests, known from round 1) and `nuvion-book-money.contract.spec.ts` (3 tests, wallet payment quotes pin `NUVION_FEE_*` env, the same class as the five round 1 transfer specs; naira side).
- Gates 0 (0 fail, 139 warn, 88 accepted); `check_baseline.py` 0; `npm run contract:build` 0, additive only (16 lines added: `vatMinor` on the send view, three optional fields on the statement line).
- Protected suite `ci-check.sh 148e76a9 HEAD 0`, fresh `feeusd_protected` database: 0, 253 of 253.
- NOT RUN: a real Nuvion call of any kind; a real dollar wire or local inflow (so the payment type of either is unknown); the full HTTP send of a dollar payout through the contract world (the quote is covered through `AbroadService`, the record and settlement as units); the `-fee` book transfer against a real Nuvion; a real WAWU ID mail for the rate-difference alert; the rest of the full jest suite.

## Round 3 (builder, naira side, after the dollar-side merge)

Hub `wmt/FEE-01` merged with `wmt/FEE-01-usd` (5e1629a7), no conflicts; `contract:build` left the contract unchanged by the merge; the fee engine spec, `dollar-fees.spec.ts`, `abroad-usd-fee.spec.ts` and the add-money contract spec pass (71 tests).

### Root causes of the red suites (none was a real behaviour fault; each a setup or a figure that follows R-139)

1. **Env-pinned Nuvion fees, no rows (setup).** Suites that boot their own app and set `NUVION_FEE_*` got no schedule rows. Fixed in the shared harnesses with `seedFlatFees` (rows removed on close): `test/events/event-wallet-harness.ts`, `test/schools/school-enrolment-harness.ts`, `test/schools/school-nuvion-harness.ts` (book 1500, bank 2500; a spec that passes `NUVION_FEE_BANK_PAYOUT: '0:2000'` gets 2000), `test/points/cash-out-harness.ts` (flat 1500 for the two Nuvion cash-out rigs; a boot that blanks `NUVION_FEE_BANK_PAYOUT` stands for an empty schedule, so "fees not set" there means "no schedule row in force", assertions unchanged), `test/payments/pay-fx-harness.ts`, and per spec in `community-pass-nuvion`.
2. **The stand-in's charge read from the quote (setup).** `nuvion.feeKobo = () => BigInt(q.fee.providerFeeKobo)` made the stand-in charge 0 once the quote showed 0 for Nuvion's part (R-139 lead ruling 1). Now `q.fee.totalFeeKobo` (the same number, F = P in these specs): `test/schools/school-nuvion-harness.ts`, `src/money/earnings/tests/earning-settlement-nuvion.contract.spec.ts`, `src/money/payments/tests/payment-fx.contract.spec.ts`.
3. **The stepped fee (figure).** The shared Nuvion rig stepped its charge (2325 below NGN 5,000, 1575 from it); the schedule has no steps, so the rig is flat 2325. The tier harness's `liveFee` follows the rig, and stays stepped when the spec runs on the Fintava double. The Fintava double's own scripting uses a new always-stepped `fintavaDashboardFee` (this fixed the 8 BILLS-04 tests and the bills round-2 test: bills ride Fintava and their path is untouched; the first cut had flattened `liveFee` for them too).
4. **Swaps off (R-139 point 3) switches PAY-FX off.** `payment-fx.service.ts` refuses a payment from another currency with `currency_not_supported` while `fx.product.swap.on` is 0, and the migration sets it to 0 in every database it runs on. The two PAY-FX specs now turn the switch on in their harness and put it back on close. Product question for the lead: paying a naira price from dollars shares the swap switch, so it is off at launch too.

### Changed assertions, round 3 (none weakened)

| File | Test | Old | New | R-139 |
|---|---|---|---|---|
| `src/event-ticketing/tests/event-wallet-order.contract.spec.ts` | EVENTS-07 E3 quote and the mixed-tier basket | `const FEE = 1_575`; `fee: { providerFeeKobo: FEE, wawuFeeKobo: 0 }`; `totalKobo: 1_001_575` | `FEE = 2_325`; `{ providerFeeKobo: 0, wawuFeeKobo: FEE }`; `totalKobo: 1_002_325` | 1 and 5, ruling 1; stepped fee flattened |
| `src/event-ticketing/tests/event-wallet-order-round2.contract.spec.ts`, `event-order-cap.contract.spec.ts` | all figures built from `FEE` | `const FEE = 1_575` | `const FEE = 2_325` | stepped fee flattened |
| `src/event-ticketing/tests/event-call-off-refund.contract.spec.ts` | none (Fintava-bound; `FEE` stays 1_575) | | | |
| `src/schools/enrolment/tests/school-enrolment.contract.spec.ts` | SC5 to SC7 quote | `const FEE = 1_575`; `fee: { providerFeeKobo: FEE, wawuFeeKobo: 0, totalFeeKobo: FEE }` | `FEE = 2_325`; `{ providerFeeKobo: 0, wawuFeeKobo: FEE, totalFeeKobo: FEE }` | 1, flattened |
| `src/direct-message/wallet/tests/paid-dm-wallet.contract.spec.ts` | I3 to I5 paid question quote | `fee: { providerFeeKobo: FEE, wawuFeeKobo: 0 }` | `{ providerFeeKobo: 0, wawuFeeKobo: FEE }` | 1 |
| `src/community/pass/tests/community-pass-nuvion.contract.spec.ts` | member pays N2,000 | `fee: { providerFeeKobo: NUVION_FEE, wawuFeeKobo: 0 }` | `{ providerFeeKobo: 0, wawuFeeKobo: NUVION_FEE }` | 1 |
| `src/legal/wallet/tests/legal-fee-wallet.contract.spec.ts`, `src/plans/purchases/tests/plan-purchase-nuvion.contract.spec.ts`, `src/credit-purchase/wallet/tests/credit-wallet-nuvion.contract.spec.ts` | payment quote | `{ providerFeeKobo: FEE, wawuFeeKobo: 0 }` | `{ providerFeeKobo: 0, wawuFeeKobo: FEE }` | 1 |
| `src/money/payments/tests/payment-fx.contract.spec.ts` (line 446) | stand-in charge | `BigInt(nview.fee.providerFeeKobo)` | `BigInt(nview.fee.totalFeeKobo)` | 1 |
| `src/money/earnings/tests/earning-settlement-nuvion.contract.spec.ts` (194) | stand-in charge | `BigInt(q.fee.providerFeeKobo)` | `BigInt(q.fee.totalFeeKobo)` | 1 |

Gap found, not changed: history and receipt views are built from ledger rows, which still carry Nuvion's charge as `providerFeeKobo` (`src/money/receipts/receipt-document.ts` prints it). That is an app answer showing Nuvion's charge per transaction. Folding it for the app needs a change in the ledger view, a fenced-adjacent area; for the lead.

## How the suites red on main were proved red on main

Worktree of `origin/main` 148e76a9 (detached), its own database migrated with main's migrations only, its own mock WAWU ID, the same runner:

`npx jest --runInBand --forceExit src/event-ticketing/tests/event-door-idempotency src/event-ticketing/tests/event-edit-races src/event-ticketing/tests/event-price-edit-followups src/event-ticketing/tests/event-purchase-races src/event-ticketing/tests/event-tickets-review src/event-ticketing/tests/event-tickets-wallet-orders src/admin/events src/admin/notifications src/community-message src/community/tests/community.contract src/plans/tier-badge`

Output line: `Test Suites: 11 failed, 14 passed, 25 total` / `Tests: 79 failed, 294 passed, 373 total`, with `FAIL` on each of those eleven files: `admin-events`, `admin-notifications`, `community-message`, `community.contract`, `tier-badge-views` and the six `event-*` suites above (the event suites fail on `prisma.userProfile.update` with "No record was found for an update", before any fee). They are red on main in this environment (a local mock WAWU ID and an empty database); CI's environment may differ, which is why the PR is the check.

## Round 3b (CI findings on PR #268 and the verifier's Hub items)

- **Account data map** (`src/account-purge/account-data-map.ts`): `MoneyFeeRecord.wawuFeeMinor` is listed in `NOT_A_USER_REFERENCE` with its reason. A fee record has no person column (it is keyed by the transaction's reference) and is kept as finance's record of the transaction, like the ledger rows it describes. No assertion changed.
- **Real-money walk** (`scripts/ops/real-money-rows.ts`): `MoneyFeeRecord` (no person column, history of a transaction), `FeeSchedule` and `ProviderRate` (configuration, not a person's money) are in `NOT_MONEY_TABLES` with reasons. A `REAL_MONEY_TABLES` entry needs a person column, which a fee record does not have; `nuvion-live-reset` deletes fee records and leaves the rate table (`scripts/ops/nuvion-live-reset-kinds.ts`). No walk assertion changed.
- **tip-wallet, unlock-wallet**: `fee: { providerFeeKobo: FEE, wawuFeeKobo: 0 }` became `{ providerFeeKobo: 0, wawuFeeKobo: FEE }` (ruling 1); the harness seeds F = P = the stand-in's charge, so every "plus the charge once" figure, the 85/15 split and the once-only assertions are unchanged.
- **Abroad (verifier F4)**: under the fee engine a partner fee still configured for a corridor is folded into `feeMinor` and into WAWU's fee fields, `providerFeeMinor` is 0 on the quote and on the send view (the total is unchanged: `totalMinor` = amount + `feeMinor` + `vatMinor`). Fintava-side and non-engine answers unchanged.
- **Pay from a dollar account (F3)**: the quote carries `currency`, `feeMinor`, `vatMinor`, `vatOn`, `totalMinor`, `receiveMinor` (in the source currency) with `source.providerFeeMinor` 0 and the provider's charge folded into `source.wawuFeeMinor`; the paid-from view on the payment is folded the same way. New test in `payment-fx.contract.spec.ts` (no existing assertion changed; the existing quote test has zero provider and WAWU fees so it still holds).
- **Receipts (F9)**: under the engine the history item (and so the receipt) shows one fee, equal to the quote: provider part folded into WAWU's line; `receiptLines` omits the provider line when it is 0 and WAWU's is above 0. New test in `wallet-transfer-bank-nuvion.contract.spec.ts`: quote, send, transfer view and history item show the same fee and total.
- **Also found red on main** (proved the same way as above, `Test Suites: 4 failed, 15 passed, 19 total`, 59 failed tests): `account-deletion`, `account-deletion-reason-route`, `purchase.contract`, `direct-message.contract` (all four), in addition to the eleven already listed.
- Local results: `src/money` 132 of 132 suites; the rest of the Nuvion-touching directories pass except the suites listed as red on main.
