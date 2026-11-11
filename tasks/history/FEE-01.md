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

## Verifier report, round 1

Verifier, 11 Nov 2026. Hub `wmt/FEE-01` 263ecd12 (still the head at the end; no newer push). Stand-ins only; no live service called. Verdict: **FIX** (no blocker; four highs/mediums below that the owner should see before go-live).

| Pass | Result | Evidence |
|---|---|---|
| V1 owner tests and edges | PASS | Probe of `percent-fee.ts` (scratch, removed): NGN 10,000 = 100, 100,000 = 400, 500,000 = 700 (cap); USD 100 payout = 8; USD 1,000 wire = 30; 1 kobo = min; just under/over each clamp; half up at x.5 and x.4999; 10^18 kobo = cap; `0.12345` and `100.0001` refused. fee-engine.spec (quote route, 100,000 -> 400, total 100,400) green. |
| V2 money conservation | PARTIAL | transfers (182), add-money, abroad (98), fx (54), nuvion (1514) specs pass on a fresh DB, incl. leg split, fee under provider charge, fee-back. NOT RUN by me: own end-to-end probe of actual charge higher/lower than expected, two sends at once (code path unchanged: claim is unique, `record` is an upsert with empty update, so a repeat adds nothing). |
| V3 history | PASS with low finding | Future start applies only from then (spec); old token: `check()` compares total, so a changed fee gives `quote_changed`; FeeSchedule/ProviderRate refuse UPDATE/DELETE (tried by hand). Gaps F5, F6. |
| V4 confidentiality | PARTIAL | Provider-rate routes superadmin and finance only (support excluded, code and spec); no `expected()` result reaches a view; quote, transfer view, history (out), payment view fold to one fee. Gaps F2. |
| V5 safety | PASS | min withdrawal NGN and USD, `fee_exceeds_amount`, `fees_not_set`, swap `fx_switched_off`: specs green. |
| V6 VAT | PASS | on and off, on the fee only, saved and shown apart (fee-engine and dollar-fees specs). Gap F4 (purchases). |
| V7 Fintava byte-identity | PASS for quotes, FAIL for receipts | nuvion-fees golden and fee-quote specs green. See F3. |
| V8 changed assertions | PASS | `git diff` of specs: every removed line is an R-139 ruling-1 or point-11 change; replacements equal or stronger; no test deleted; setup seeds F and P equal to old figures. One hygiene finding F7. |
| V9 migration | PASS | Fresh DB applies; seed rows match R-139 point 2 and tasks/NUV-FEES.md (0.2% min 50 max 500; receive 0.2% min 50; book free; card 1.00/2.50/1.00); rollback refuses with a non-seed FeeSchedule row, and succeeds on a seed-only DB (tables, triggers, migration row gone). |
| NUV-LIVE | PASS | `src/money/tests` (8 suites, incl. reset kinds and schema walk) 67 of 67. |

Lead items: (a) `abroad-usd-fee.spec` and add-money spec re-run on 263ecd12, green (abroad 98, add-money 31); the fold still has no dedicated assertion that a configured partner fee lands in `feeMinor` with `providerFeeMinor` 0 (F8). (b) Incoming rows: history and receipts fold outgoing rows only. Add money shows Nuvion's receiving charge as the one fee (ruling point 11, fine). A dollar inflow statement line keeps `feeMinor` as Nuvion's figure (builder report) while the new fields carry WAWU's (F2).

### Findings

- **F1 medium** `src/money/fees/engine/fee-record.service.ts` (no failed path; `wallet-transfer.service.ts` settles only on completion). A send that fails and is given back keeps its `MoneyFeeRecord` with `keptMinor = F - P` and no status: the record says WAWU kept money it returned. Probe: fail a send in the fee-back-failed world, read the record. Kill: a spec asserting kept 0 (or a status) after fee-back.
- **F2 medium** dollar inflow statement line (`dollar-fees.ts` / statement line `feeMinor`): still Nuvion's actual charge, so a person sees a provider figure next to WAWU's. R-139 point 9. Kill: scan the statement answer for a funded dollar account under Nuvion with a stand-in charge and assert the charge figure is absent.
- **F3 medium** `src/money/receipts/receipt-document.ts:172` drops the "Fintava's charge" line when `providerFeeKobo === 0 && wawuFeeKobo > 0`, with no engine check. Under Fintava (provider fee 0, WAWU fee above 0) the receipt differs from main. Kill: a receipt spec, Fintava, provider 0, WAWU fee 50, expects the line.
- **F4 medium** purchases (`wallet_to_wallet` via `legSplit`, `wallet-payment.service.ts`): no `MoneyFeeRecord` is written for wallet payments, and no leg moves F - P or VAT (builder-flagged). With the seeded 0 fee it is harmless; the moment an admin sets a wallet-to-wallet fee or turns VAT on, buyers are quoted a fee that is never collected or recorded. Kill: payment spec with F 100, VAT on; assert record and collection.
- **F5 low** `fee-schedule.service.ts` `START_SLACK_MS` 5 minutes: a start up to 5 minutes in the past is accepted and takes effect at once (ruling: past start refused). `ProviderRate.add` has no start check at all.
- **F6 low** `FeeSchedule` and `ProviderRate` triggers are row-level, so `TRUNCATE` succeeds (tried: emptied the table). Add a TRUNCATE trigger. The spec cleanup helper also relies on `session_replication_role = replica` (superuser): confirm the app's production DB role is not.
- **F7 low** `add-money.contract.spec.ts` writes a `ProviderRate` row (`changedBy` "add-money spec") and never removes it; the table is append-only, so it stays in a shared test DB and sits over the seed row in later runs. Use `seedFees`/`removeSpecFees`.
- **F8 low** abroad partner-fee fold untested (see above); `product_off` defined, never thrown; USD provider rates (payout, wire) have no seed row (commercials list none), so expected charge there is the env estimate or 0.
- **F9 low** `legSplit` re-reads the schedule and rates after `check()`, so a refresh between the two (15 s cache) could move a different leg than the checked total. Narrow; derive the split from the checked quote.

### Exit codes and NOT RUN
tsc, lint, gates, contract:build: not re-run by me (builder's results taken as claimed). Jest, one directory at a time, fresh DB: src/money/fees 113/113; transfers 182/182; add-money 31/31; abroad 98/98; fx 54/54; money/tests 67/67; payments 242/242 (alone); history 47/47; receipts 64/64; nuvion 1514/1514; protected-routes 248 of 253: the 5 failures (`/learn/*`, `/creators/:id/evg`) connect to 127.0.0.1:5432, my environment, not the code; the CI script `ci-check.sh` was not run. A first parallel run of mine raced on one database and gave false reds; discarded. NOT RUN: own two-sends-at-once and actual-charge-differs probes, real WAWU ID mail, any live provider, gates and contract diff.
