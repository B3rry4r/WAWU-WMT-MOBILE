# FEE-01 · round history

Moved out of [tasks/FEE-01.md](../FEE-01.md), oldest first. The current state is in that file.

## Round 1 (builder, 11 Nov 2026)

- Hub `wmt/FEE-01`, first push `171c538c` (schema, migration, routes, contract) so FEE-02 and FEE-03 could build against the shapes; the rule, the quote, VAT, safety, the fee record, the alert and the specs followed in later commits.
- Lead ruling recorded in the task file: fee on top for money out, off what arrives for money in, swap shown as the difference from the provider's rate.
- Gaps handed on: the four non-naira kinds are stored and edited but not yet priced from the schedule (see the task file).

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
