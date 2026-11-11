---
id: FEE-01
title: The fee engine: WAWU's fee schedule with history, Nuvion's rates in a locked table, VAT, a full record per transaction, and the withdrawal safety checks
owner: YOU
area: MONEY
order: 394
priority: after-launch
repo: wawu-backend
type: money-path
status: verifying
depends_on: []
decisions: [R-139, R-138, R-42, R-11]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
tier: T2
---
# FEE-01 · The fee engine

## Current state

**Lead, 11 Nov 2026, 22:10 UTC: MERGE taken on the round 2 re-check. G1, G2 and G3 are owned by SWEEP-1111 rows F1 to F3, F4 holds the probes not run. The migration was edited in place before it reached main; no database outside the dropped test ones ever applied the old version. Merges after Branch checks pass on c992b2ed.** Verifier round 2 re-check (11 Nov 2026): MERGE, with G1 (VAT lost when a reversed record reopens) and G2 (a wallet_to_wallet fee above 0 would 503 every wallet payment) to be owned. See "Verifier report, round 2 re-check".** Earlier: **Verifier round 1: FIX.** No blocker; F1 to F4 medium, F5 to F9 low. See tasks/history/FEE-01.md, "Verifier report, round 1".

As of 11 Nov 2026.
- **Status:** todo. Cut by the lead from R-139. Nuvion's go-live waits for this task, FEE-02 and FEE-03 (R-139 point 12).
- **What exists** (lead's map of Hub main 158be141): `GET /money/fees/quote` (`src/money/fees/fee-quote.service.ts`, kinds `wawu_transfer`, `bank_transfer`, `purchase`, `bill`; provider and WAWU lines, total, a signed `quoteToken` checked at pay time, `409 quote_changed`). Fee figures are env settings read at boot (`fee-config.ts`, `nuvion-fee-config.ts`, `abroad-settings.ts`, `fx-settings.ts`, `add-money-config.ts`): flat or `from:fee` bands in kobo, no percentage, no minimum or maximum, no currency, no start date, no history. `fees-set.guard.ts` answers `503 fees_not_set` while a `NUVION_FEE_*` is unset. Admins edit plan settings live (`PATCH /admin/plan-settings`, audit rows in `AdminOpsAudit`, no route reads the audit back). No VAT anywhere; no "amount kept" field; no minimum withdrawal; no fee-bigger-than-amount check on withdrawals. Gating settings: `fx.product.swap.on` (default 1), no switch for dollars received from local banks. Percentage arithmetic in BigInt (millionths, no floating point) exists on the stopped branch `wmt/NUV-FEES` 4c28ef51 (`src/money/fees/percent-fee.ts`): reuse it.

## Read first

- `docs/WORKFLOW.md`, and `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`
- DECISIONS.md R-139 (all of it), R-138, R-42, R-11, R-10 (replaced for the fees R-139 names)
- tasks/NUV-FEES.md (stopped; what it learned) and the Hub branch `wmt/NUV-FEES`
- wawu-backend: `src/money/fees/`, `src/money/fx/`, `src/money/abroad/`, `src/money/add-money/`, `src/money/limits/`, `src/nuvion/fee-legs.ts`, `src/nuvion/areas/` (where Nuvion's `applicable_fee` is read), `src/admin/plan-settings/`, `src/plan-settings/plan-setting-registry.ts`, the money check (`src/money/check/`), `prisma/schema.prisma` (WalletTransfer, FintavaLedgerEntry, WalletPayment, AddMoneySession, FxQuote, FxOperation, FxMovement, AbroadSend)

## Goal

Every fee a person pays on a Nuvion money move comes from WAWU's fee schedule (percentage, minimum, maximum, currency, start date), changeable by an admin without a release and with every change kept; Nuvion's own rates sit in a separate admin-only table; every transaction keeps the amount, WAWU's fee, Nuvion's charge, any tax and what WAWU kept; and no withdrawal goes out below the minimum or with a fee bigger than its amount.

## Scope

- **Fee schedule (additive migration, named here: `FeeSchedule`).** One row per change: kind, currency, percentage (millionths), minimum and maximum in minor units (maximum optional), start time, who changed it, a note. The fee in force for a kind is the latest row whose start time has passed; rows are never edited or deleted (the history). Kinds: `ngn_bank_withdrawal`, `usd_bank_payout`, `intl_wire_in`, `usd_local_in`, `fx_swap` (percentage on top of the provider's rate, minimum as a USD amount converted at the quote's own rate), `wallet_to_wallet`, `ngn_add_money` (pass the provider's charge through, nothing extra: a flag, not a percentage). The migration seeds the starting fees of R-139 point 2 as the first rows (start now, changed by "R-139 seed"); no amount is written in code.
- **The rule:** fee = percentage of the amount, raised to the minimum, lowered to the maximum, in whole minor units, half up. Specs: NGN 10,000 withdrawal fee NGN 100; NGN 100,000 fee NGN 400; NGN 500,000 fee NGN 700; USD 100 payout fee USD 8; USD 1,000 wire received fee USD 30; plus every edge.
- **Provider rates (additive migration, named here: `ProviderRate`).** Nuvion's rates from the owner's copy of its commercials (tasks/NUV-FEES.md table), one row per change with provider, kind, currency, percentage, minimum, maximum, fixed part, start time, who changed it. Admin-only routes (superadmin and finance); never in any app route, contract answer for the app, log line a person sees, or error message. Used to work out the expected provider charge for the record and the check. Replaces the `NUVION_FEE_*` env figures as the source of the provider's charge; `fees_not_set` now means "no fee schedule row in force for this kind".
- **Alert on a rate change.** When a provider rate row is added, or when Nuvion's actual `applicable_fee` on a transfer differs from the expected charge, the owner is emailed (the money check's recipients, `MONEY_CHECK_RECIPIENT_WAWU_IDS`), at most once a day per kind.
- **VAT.** Plan settings `tax.vat_on` (default 0) and `tax.vat_percent` (default 7.5, a setting, not code). When on, VAT is worked out on WAWU's fee and shown and saved apart from it.
- **The quote.** `GET /money/fees/quote` (additively: new kinds and new fields, the existing answer unchanged for the web's routes) returns, for every Nuvion money move, WAWU's fee, VAT, the total the person pays and the exact amount the receiver gets, in the move's currency. The pay step checks it as today (`quoteToken`).
- **The record (additive migration, named here: `MoneyFeeRecord`).** For every Nuvion transaction: its reference, kind, currency, amount, WAWU's fee, VAT, Nuvion's expected charge, Nuvion's actual charge (filled when known), what WAWU kept (fee minus Nuvion's actual charge), and the schedule and rate rows used.
- **Safety.** Plan setting `money.min_withdrawal_minor` per currency (NGN and USD lines). A withdrawal or payout below it, or whose fee is bigger than its amount, is refused before anything is sent, with a plain message.
- **Gating.** Currency swaps and dollars received from local banks stay off (R-139 point 3): `fx.product.swap.on` set to 0 by this task's migration and a new `fx.product.local_usd_in.on` default 0; the routes refuse while off.
- **Additive only:** nothing the web or the dashboard calls today changes behaviour (the protected route suite); Flutterwave and Fintava paths untouched.
- **Tests:** the five owner tests above; history (a change with a future start time applies from then, old transactions keep their row); the provider-rate table never reaches an app route (a spec scans the contract and the app routes' answers); VAT off and on; the record for each kind; refusals below the minimum and fee bigger than amount; swap and local dollar receiving refused while off; the protected suite.

## Capability checks

- [ ] A user withdrawing NGN 100,000 is shown a fee of NGN 400 and exactly what reaches the bank before confirming.
- [ ] An admin's fee change applies from its start time without a release, and the old fee stays in the history.
- [ ] Nuvion's rates are readable only by an admin, never by the app.
- [ ] Every transaction keeps the amount, WAWU's fee, Nuvion's charge, the tax and what WAWU kept.
- [ ] A withdrawal below the minimum or with a fee bigger than its amount is refused.

## Builder report

Builder, 11 Nov 2026. Hub branch `wmt/FEE-01` (head in the Hub repo's log; first push `171c538c`).

**Lead ruling recorded (11 Nov 2026), which side the fee sits on.** Money going out (naira bank send or withdrawal, dollar payout, wallet-to-wallet, wallet payments): fee and VAT are added on top; `totalMinor` = amount + fee + VAT, `receiveMinor` = amount. NGN 10,000 withdrawal: fee NGN 100, the bank gets NGN 10,000, the wallet pays NGN 10,100 (plus VAT when on). A fee bigger than the amount is refused. Money coming in (international wire, dollars from local banks, adding money by account number): fee and VAT come off what arrives, `receiveMinor` = amount - fee - VAT. Swap: the person's rate is the provider's made 2% worse (at least USD 1 equivalent); the quote shows the difference as the fee.

**Built**
- Additive migration `20270101090000_fee_engine` (stamp later than main's newest `20261231110000`): `FeeSchedule`, `ProviderRate`, `MoneyFeeRecord`, and a small `FeeAlertSent` (one row per kind, the once-a-day mail claim; not named in the brief). `FeeSchedule` and `ProviderRate` are append-only (a trigger refuses UPDATE and DELETE). Seeds (first rows, changed by "R-139 seed", starting now): NGN bank withdrawal 0.4% min 10000 max 70000 kobo; USD payout 1% min 800 max 6000 cents; wire in 1.25% min 3000 max 75000; local dollars in 1.5% min 700 no max; swap 2% min 100 cents (USD 1) no max; wallet to wallet 0; add money pass-through. Nuvion rates (from tasks/NUV-FEES.md): bank payout 0.2% min 5000 max 50000 kobo; receive domestic 0.2% min 5000; book transfer 0; card issuance 100 cents, monthly 250, decline 100. The same migration sets the saved `fx.product.swap.on` to 0. Rollback `rollback.sql` refuses while any non-seed fee or rate row or any MoneyFeeRecord exists.
- Settings (plan registry): `tax.vat_on` (default 0), `tax.vat_percent` ("7.5"), `money.min_withdrawal_minor` (lines such as "NGN 100000", default none), `fx.product.local_usd_in.on` (default 0).
- Routes (`src/money/fees/engine/`): `GET/POST /admin/money/fees`, `GET /admin/money/fees/preview`, `GET/POST /admin/money/provider-rates`. Roles: fees read superadmin, finance, support; fees write superadmin, finance; provider rates read and write superadmin and finance only.
- The rule in BigInt millionths, half up (`percent-fee.ts`, from NUV-FEES). The quote under Nuvion takes the fee from the schedule and Nuvion's expected charge from the rate table (the NUVION_FEE_* settings are no longer read for the quote or the money-limits check). `fees_not_set` now means no schedule row in force.
- Error codes `below_minimum_withdrawal` 422, `fee_exceeds_amount` 422, `product_off` 409 (added to the enum and status table).
- MoneyFeeRecord written when a Nuvion wallet or bank send is claimed and its Nuvion charge filled when the provider's record states `applicable_fee`; a difference from the expected charge, or a new rate row, emails `MONEY_CHECK_RECIPIENT_WAWU_IDS` once a day per kind.

**Differences and gaps, plainly**
1. The quote's new fields (`currency`, `feeMinor`, `vatMinor`, `vatOn`, `totalMinor`, `receiveMinor`) are present only when the fee engine prices the move (Nuvion running); under Fintava the answer stays byte-identical to main (NUV-07's golden test fails otherwise). They are optional in the type.
2. Under Nuvion `fee.providerFeeKobo` still shows the part of the fee Nuvion keeps (its expected charge from the rate table, inside the fee, not on top), so the existing fee legs are unchanged. That is a per-amount figure derived from a confidential rate; the owner may want it folded into `fee.wawuFeeKobo` for the app (then the fee leg has to change). `GET /money/fees/quote` does not carry the rate table itself.
3. The alert email goes through the money check's mailer (WAWU ID's `money-check-report` route) as one item of the check `merchant_charges`, because WAWU ID takes only that shape. WAWU ID owns the wording; a dedicated mail type needs a WAWU ID change. NOT RUN against a real WAWU ID.
4. Swaps and local-dollar receiving: the switches exist and `GET /money/fx/currencies` now answers `localUsdIn` beside `products` (not inside it, so `products` keeps its three keys); swaps still refuse with the existing `fx_switched_off` (changing its code would change a response the app handles). There is no WAWU route for receiving dollars from local banks to refuse (it arrives at Nuvion); `product_off` is defined and not yet thrown by any route.
5. Swap quote, dollar payout (abroad quote) and the add-money quote gain the added fields from the fees they already quote; they are NOT yet priced from the schedule (`usd_bank_payout`, `fx_swap`, `intl_wire_in`, `usd_local_in`, `ngn_add_money` rows are stored, previewed and edited, but only the naira bank send and wallet-to-wallet use them). VAT is not applied on those. The add-money quote keeps its existing "amount the wallet gets, charge on top" meaning, which differs from the lead ruling for money coming in. A follow-up task (FEE-07 suggested) must price those four from the schedule and take the fee off what arrives.
6. MoneyFeeRecord is written for wallet and bank sends only (not abroad, swap, add-money, cards).
7. `money.min_withdrawal_minor` applies to the naira bank send; the USD line is stored but nothing reads it until the dollar payout is priced from the schedule.

**Checks (exit codes, Hub head `176859ec`, merged with main 148e76a9 (contract rebuilt, protected suite 253 of 253, gates 0))**
- `npx tsc --noEmit` 0; eslint without --fix on the changed .ts 0 (after `--fix` on my own files).
- New spec `src/money/fees/engine/tests/fee-engine.spec.ts` 16 of 16 (the five owner tests, edges, history, VAT, safety, record, rate table not in an app route, roles). `nuvion-fees.spec.ts` (Fintava quotes byte-identical) and `fee-quote.spec.ts` pass.
- Areas touched, run against a migrated `fee01_test` database with a local mock WAWU ID: 50 of 58 suites pass. **Failing, by design of the replacement, not edited:** `nuvion-fees.contract.spec.ts` (3 tests: it sets `NUVION_FEE_*` and expects those to be the fee source and `fees_not_set` while unset; the engine replaces them) and the five Nuvion money-movement contract specs under `src/money/transfers/tests/` (`wallet-transfer-bank-nuvion`, `wallet-transfer-fee-back-failed-nuvion`, `wallet-transfer-nuvion`, `wallet-transfer-nuvion-adapter`, `wallet-transfer-wawu-fee-nuvion`, 55 tests: each pins the fee through `NUVION_FEE_*` and `WAWU_FEE_*` env and a stand-in charging those figures, so the quote now comes from the seeded schedule and rate table while the stand-in charges its own). Their setup (stand-in fees aligned to the rate table, or a fee row written in the spec's `beforeAll`) needs the lead's or verifier's approval; I did not touch a test. Until then they are red on this branch.
- `python3 scripts/gates/run.py` 0 (0 fail, 139 warn, 88 accepted); `check_baseline.py` 0.
- `npm run contract:build` 0; diff against main is additive: 3 new paths, no path or schema removed; schemas widened: `FeeQuoteView`, `FeeQuotePartView`, `FxCurrenciesView`, `MoneyErrorReason` and the abroad, FX and add-money quote views.
- Protected route suite as CI runs it (`ci-check.sh 158be141 HEAD 0`, fresh `fee01_protected` database): 0, 253 of 253 (244 required).
- Migration applied to a fresh database: 0; the append-only trigger refuses an UPDATE (tried by hand). `rollback.sql` NOT RUN.
- `python3 scripts/tasks/check_tasks.py` 0.
- NOT RUN: a real WAWU ID mail for the alert; any live provider (stand-ins only); the rest of the full jest suite beyond the areas listed; the rollback script; abroad, swap and add-money priced from the schedule (not built, see gap 5); the app's `GET /money/fees/quote` over HTTP with the engine (covered by the service spec only).

## Fix round 1, the naira side (lead rulings, 11 Nov 2026)

1. **One fee in the app.** Under Nuvion the app's quote shows ONE fee: WAWU's schedule fee F (plus VAT when on). Nuvion's expected charge P is in no app answer: `fee.providerFeeKobo` is 0, there is no provider part, and the transfer and payment views fold P into WAWU's line. Inside the Hub Nuvion takes P with the transfer and the fee leg moves F - P (plus VAT) to the operational account, so the person's total is exactly amount + F + VAT. If F is under P the leg moves only the VAT, the fee record shows a negative kept and the rate alert fires. The record keeps F, VAT, P expected, P actual (when Nuvion states it) and kept = F - P actual. Under Fintava the answer stays byte-identical to main. `purchase` (wallet payments) under the engine is priced by the `wallet_to_wallet` row in the same way; payments have no fee leg, so any F - P above 0 on a purchase is not collected (seeded F and P are 0; flagged).
2. **The red specs aligned.** R-139 replaced R-10's "provider plus WAWU on top" for these sends. Each spec seeds its own fee-schedule and provider-rate rows in its setup (`src/money/fees/engine/tests/seed-fees.ts`), with F equal to the old provider charge plus the old WAWU fee and P equal to the old provider charge, so every money figure the specs assert is unchanged. Changed assertions are listed in `tasks/history/FEE-01.md`.
3. **Naira safety** unchanged: `money.min_withdrawal_minor` NGN line on every naira bank send; `fee_exceeds_amount` kept.
3b. `PaymentQuoteView` (wallet payments) gains the same added fields under Nuvion (priced by `wallet_to_wallet`, no provider charge in any of them); `FeeQuoteView`'s fields are optional in the contract but always present under Nuvion (a spec asserts it).
4. `src/money/abroad/`, `src/money/fx/` and `src/money/add-money/` not touched in this round.
**Fix round 1, dollar side (11 Nov 2026, Hub `wmt/FEE-01-usd` `5e1629a7`):** dollar payout to a bank, dollars received, and add money now follow the schedule and the lead's side rule; the wire fee waits for the owner to name Nuvion's wire `payment_type` (`FX_WIRE_PAYMENT_TYPES`). Full report in tasks/history/FEE-01.md.

## Verifier report

## Owner sign-off
