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
