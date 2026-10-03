---
id: WALLET-15
title: Fee quotes
owner: YOU
area: WALLET
order: 90
priority: launch
repo: wawu-backend
type: backend-endpoint
status: verifying
depends_on: [MONEY-04, OPS-09]
decisions: [R-10, R-31]
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# WALLET-15 · Fee quotes

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- `DECISIONS.md`: R-10 (ruled; build what it says)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/naira-api.md` (what Fintava's API really does; the pages are in `docs/fintava/reference/`)

## Goal

Every fee shown before paying comes from the server, never from the app.

## Scope

GET a fee quote, from configuration set per R-10 (Fintava's charge plus WAWU's fee), for:
- a purchase (unlock, tip, tick, ticket, paid DM, credits, course, legal service): Fintava's balance-transfer
  charge by amount band, no WAWU fee;
- a bill: Fintava's bill charge by category (₦100 electricity or cable, ₦0 airtime or data) plus WAWU's bill fee
  (₦0 today), and the payer's balance-transfer charge into WAWU's wallet (R-31);
- a send to a WAWU user: Fintava's balance-transfer charge by band + WAWU's ₦10;
- a send or withdrawal to a bank: ₦40 + ₦25.
Card top-up and card order are added by WALLET-25 and WALLET-31 after launch. The rates are the dashboard ones in
`docs/fintava/fees.md` (final).

Payouts out of Fintava don't work in the sandbox yet: bank sends and the airtime, data and electricity purchases answer `400 "Unable to find customers"`, and cable answers "service not currently available", with nothing debited (`docs/fintava/sandbox/README.md`, "The blocker"). Unblocked when a ₦100 `POST /bank/credit/merchant` to the sandbox stub `0123456789`/`000013` stops answering "Unable to find customers" (question 17 in `docs/fintava/naira-api.md`). Build and unit-test meanwhile; report the bank-send and bill checks NOT RUN with that reason until then.

## Fintava facts

From `docs/fintava/naira-api.md`; a real sandbox response overrides it.

The user pays Fintava's fee plus WAWU's fee (R-10). The quote is Fintava's fee for that action plus WAWU's fee from config, shown as one total with both parts in the breakdown. Fintava's charges are in `docs/fintava/fees.md`. WAWU's fee is set as a merchant charge in Fintava's dashboard; config holds the same numbers so the quote shows the total before the user confirms.

## Capability checks

- [ ] A user sending ₦10,000 to a bank sees ₦40 + ₦25 = ₦65 and a total of ₦10,065 before confirming, and Fintava's record of that transfer debits ₦10,065. A difference between config and the dashboard is reported by MONEY-16.
- [ ] A user sees the same total on the review screen and in the debit for a ₦4,999 and a ₦5,000 purchase (₦23.25 and ₦15.75 charges).
- [ ] An electricity bill of ₦10,000 quotes its ₦100 bill charge and the payer's balance-transfer charge, each as its own part.

## Builder report

Builder, 3 Oct 2026. wawu-backend `wmt/WALLET-15` at `c6f66f8` (from main `fe1ec6c`, still current); this repo `wmt/WALLET-15` (from main `e7dc879`, still current). Dependency: MONEY-04 is `done`; OPS-09 (the owner setting the merchant charges in the dashboard) is `todo` and was not waited for, by the lead's instruction: the rates are ruled (R-10, `docs/fintava/fees.md` final), and whether Fintava adds WAWU's fee on a real transfer is OPS-09's, checked in OPS-10.
- **Built:** `GET /money/fees/quote?kind=&amountKobo=&billCategory=` is served (moved out of the declared contract), behind the wallet gate, `no-store`, with no Fintava call. Kinds `wawu_transfer`, `bank_transfer` (send or withdrawal), `purchase`, `bill` (electricity, cable, airtime, data). `FeeQuoteView` gains `billCategory`, `parts` (each charge: `code`, `source` provider or wawu, `amountKobo`), `quoteToken`, `expiresAt`. Every figure is integer kobo; `amountKobo` is digits only (`100.00`, `1e4`, `10,000` are a 400). Rules: wawu-backend `docs/contract/CONVENTIONS.md` section 11.
- **Backend files:** `src/money/fees/` (fee-config.ts, fee-quote.service.ts, money-fees.controller.ts, two specs), `src/money/dto/money-enums.ts`, `money-request.dto.ts`, `money-view.type.ts`, `money-transfer.controller.ts` (declaration removed), `money.module.ts`, `money-contract.module.ts`, `src/money/tests/money-contract.spec.ts` and the two wallet-gate specs (the route added to their registries of served and gated routes), `.env.example`, `docs/contract/CONVENTIONS.md`, `WALLET.md`, `contract/openapi.json` (regenerated: only `/money/fees/quote`, `FeeQuoteView` and the new `FeeQuotePartView` differ). Mobile: this file, `BACKEND_GAPS.md` (G-64), `docs/fintava/sandbox/38-wallet15-fee-quotes.md` and its README row, `docs/LOG.md`, and `contract/` plus `src/api/schema.generated.ts` from `sync_contract.py --backend` (it copies backend origin/main, so it brings main `fe1ec6c`, not this branch; the branch contract generates and typechecks too: `FeeQuoteView` with `parts`, `billCategory | null`).
- **Capability checks:** (1) ₦10,000 to a bank quotes ₦40 + ₦25 = ₦65, total ₦10,065: passed in the unit spec, the HTTP spec and on the built Hub (:4961, real `/auth/login` on the stand-in WAWU ID :4962, sandbox notes 38). Its second half, "Fintava's record debits ₦10,065", NOT RUN (below). (2) ₦4,999 and ₦5,000 purchases quote ₦23.25 and ₦15.75 (totals 502225 and 501575 kobo) and `check()` honours exactly those totals: passed; the same total in the debit NOT RUN (below). (3) ₦10,000 electricity: parts `bill_charge` 10000, `wawu_fee` 0, `balance_transfer` 1575: passed.
- **Checks run:** `tsc` 0; eslint 0 on changed files; fee specs 38/38; money, Fintava, KYC and identity specs (`src/money src/fintava src/kyc-submission src/common/auth`) green; full contract suite on a fresh, seeded `w15_full_test` (stand-in WAWU ID on :4001, free before, stopped after): 136/136 suites, 3274 passed, 3 skipped, 0 failed, `hub-rate-limits` included (no `@Throttle` added); protected route suite `--fresh c6f66f8`: 244/244 required (253 tests), lock `fe1ec6c` unchanged; gates 16 fail / 13 warn before, 16 / 14 after (the one new warning is `PROVISIONAL(FEE-QUOTE-SECONDS)`), 650 files; CI tripwire 0 added lines; staged diff scanned for every 8 characters of the Fintava key, 0 hits. Mobile `npm run check` exit 0 (26 suites, 431 tests; gates 0 fail, 0 warn, 110 files).
- **Decisions, Default (agent), owner may override:** (a) a bill's balance-transfer charge is banded on what the payer moves into WAWU's wallet, the bill plus its charge plus WAWU's bill fee (R-31 names the charge, not the base); (b) the merchant cap (`MERCHANT_MAX_PER_TXN_KOBO`, Lead ruling 1) applies to a purchase's or bill's total, with `maximumKobo` the largest amount that fits; sends are not capped; (c) a quote lives 300 s (`FEE_QUOTE_SECONDS`, 60 to 3600, PROVISIONAL); (d) quotes are signed with HMAC-SHA256 under `FEE_QUOTE_KEY`; unset, the server makes a key at boot and warns once, so a restart costs a re-quote (`409 quote_changed`), never a wrong charge (set it if more than one server ever answers); (e) every rate is a setting whose default is the ruled figure, an unusable value stops the app at boot; (f) `withinDailyLimit` true and `remainingTodayKobo` null, since no task holds the limit (G-7); (g) a bill's parts include WAWU's ₦0 bill fee as its own row, so the app can show or hide a zero.
- **Gap filed:** G-64, the debits' request bodies (`WawuTransferDto`, `BankTransferDto`, `PaymentDto`) and `PaymentQuoteView` do not carry `quoteToken` yet; WALLET-07, WALLET-09 and MONEY-17 add it and call `FeeQuoteService.check()`, which is exported for them. No shared-change request.
- **NOT RUN:** (1) Fintava's record of a ₦10,000 bank send debiting ₦10,065, and an electricity bill's charges in Fintava's record: payouts answer `400 "Unable to find customers"` (`docs/fintava/sandbox/README.md`, "The blocker"); unblocked when a ₦100 `POST /bank/credit/merchant` to the stub `0123456789`/`000013` stops answering that (question 17 in `docs/fintava/naira-api.md`), WALLET-09 is built and OPS-09 has set the ₦25 merchant charge. This session sent no sandbox call: its permission policy refused the money-moving probe, so the blocker's state is the one recorded on 2 Oct. (2) The same total in the debit for a ₦4,999 and a ₦5,000 purchase: MONEY-17 is not built, and the sandbox takes ₦0 on wallet to wallet (`13-wallet-to-wallet.md`); unblocked when MONEY-17 is served and a sandbox wallet to wallet move answers a non-zero `transaction_fee`, or by OPS-10's first live purchase. (3) Whether the dashboard can apply WAWU's ₦10 only to customer-to-customer sends, leaving purchases free (OPS-09's second check): until it does, the quote shows ₦10 that Fintava may not collect, which MONEY-16 would report.

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
