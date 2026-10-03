---
id: MONEY-17
title: Pay from wallet
owner: YOU
area: MONEY
order: 92
priority: launch
repo: wawu-backend
type: money-path
status: verifying
depends_on: [MONEY-09, MONEY-10, MONEY-13, WALLET-15]
decisions: [R-5, R-10, R-19, R-31]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# MONEY-17 · Pay from wallet

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.
- `docs/fintava/` (Fintava's docs and real sandbox responses, task OPS-02)
- `docs/fintava/fees.md` (what each payment costs; the dashboard rates, final)

## Goal

One shared way to take a payment from a user's wallet for anything WAWU sells.

## Scope

A debit from the buyer's wallet to WAWU's Fintava merchant wallet (R-19), with the 85/15 split on the ledger
and an Idempotency-Key. The buyer pays the price plus Fintava's balance-transfer charge from the fee quote
(WALLET-15), and the seller's 85% is of the price (R-10). A user with no wallet gets the `no_wallet` answer
(MONEY-13). Fintava's charge on WAWU's own later movements (releases, refunds, payouts) is paid by WAWU from its
15% (R-31).

## Capability checks

- [ ] A buyer paying for a ₦1,000 item is debited ₦1,023.25 once (₦1,000 + Fintava's ₦23.25 from the fee quote); the ledger shows the creator's ₦850 and WAWU's ₦150.
- [ ] The same request sent twice debits once.

## Builder report

Builder, 3 Oct 2026. wawu-backend `wmt/MONEY-17` at `ff0323b` (its work commit `ec70969` on `wmt/WALLET-15` `c6f66f8`, then main `44fdd7d` merged, the same tree); this repo `wmt/MONEY-17` (main `2a0c90a` merged). Dependencies: MONEY-09, MONEY-10, MONEY-13 `done`; WALLET-15 verified and merged (PR #52).
- **Built:** `GET /money/payments/quote` and `POST /money/payments` are served (`src/money/payments/`; moved out of the declared controller; `GET /money/payments/{id}` stays MONEY-19's, the holds MONEY-18's). One wallet-to-wallet of the price from the buyer's wallet to WAWU's merchant wallet (R-19, account number from `GET /merchant/balance`), our reference `wawu-pay-<payment id>`; Fintava's charge on top as WALLET-15 quotes it (R-10); `PaymentQuoteView` gains `quoteToken`, `expiresAt`, `PaymentDto` requires `quoteToken`, checked with `FeeQuoteService.check()` (G-64): anything not honoured, a token signed before a restart included, is `409 quote_changed` with `reason.paymentQuote`. Checks before money moves: wallet gate, Idempotency-Key, PIN or biometric approval (`@RequireApproval()`), body, target, quote, merchant cap, Fintava's available balance (`402 insufficient_funds` with the shortfall; never a sum of ours). The 85/15 split of the price is on the payment (`WalletPayment.payeeShareKobo`, `wawuShareKobo`: payee floor, WAWU the rest; no payee, all WAWU's). Both ledger sides are written `pending` with the payment, in one transaction, before Fintava is called, then with Fintava's figures. A lost answer (timeout, 5xx, 2xx without a transaction, repeated reference) is `pending`, never resent or refunded; a sweep every minute copies the ledger row's status (MONEY-08's check) onto the payment and calls the feature's delivery. Fintava's "not enough", a frozen wallet or an unusable Fintava fail the payment and give the key back (402, 423, 503); any other refusal is `failed`, stored.
- **Idempotency-Key** (`idempotency.ts`, CONVENTIONS section 4 rule 8, `@RequireIdempotentApproval()` for WALLET-07 and WALLET-09 too): taken after the wallet gate and before the PIN; the row's primary key is the lock; a repeat gets the stored answer byte for byte (`Idempotent-Replayed: true`, PIN not checked), another body `409 idempotency_key_reused`, still running `409 idempotency_in_progress`; a refusal before the payment exists deletes the row (`IdempotencyFilter`, which then answers as AllExceptionsFilter). A key left running past the money timeout plus a minute is answered from its payment, or freed if it made none. Kept `IDEMPOTENCY_KEY_HOURS` (PROVISIONAL, 48, 24 to 720), purged hourly. Taking the key before the PIN matters: N taps at once with the right PIN each take a PIN try before comparing (MONEY-09), so 8 taps reaching the PIN guard could see `423 pin_locked` (finding 1).
- **What is paid for:** `PayableRegistry` (exported); each selling feature registers its kind (G-70). None is registered on main, so every kind answers `409 target_not_payable` until its task does; held kinds are refused until MONEY-18.
- **Files (backend):** `src/money/payments/` (registry, config, idempotency, merchant wallet, service, controller, two specs), `money.module.ts`, `money-payment.controller.ts`, `dto/money-request.dto.ts` (`quoteToken`; the quote's `amountKobo` digits only, as WALLET-15's), `money-view.type.ts`, additive migration `20261003210348_wallet_payments` (`MoneyIdempotencyKey`, `WalletPayment`), `account-data-map.ts` (payer OWNED, payee COUNTERPARTY), the served-route lists in `money-contract.spec.ts` (the debit header test expects the approval pair on the payment, as CONVENTIONS section 5 says) and the two wallet-gate specs, `.env.example`, `docs/contract/CONVENTIONS.md` (section 12), `WALLET.md`, `contract/openapi.json` (regenerated: the two payment operations, `PaymentDto`, `PaymentQuoteView`, plus enum-order-only changes in `DirectMessage`, `HoldView`, `ShopOrderView`, two admin shop paths), `scripts/fintava/payment-sandbox-check.ts`. Mobile: this file, BACKEND_GAPS (G-70, G-71 new; G-64, G-38 updated), sandbox notes `41-` and its README row, LOG.
- **Check 1 (₦1,000 debited ₦1,023.25 once; ledger creator ₦850, WAWU ₦150):** passed in `wallet-payment.contract.spec.ts` against the Fintava stand-in charging the dashboard rate: one transfer of 1000 naira, buyer down 102325 kobo, payment split 85000/15000, buyer `out` 100000 + 2325 = 102325 and merchant `in` 100000, both completed, no discrepancy. Against the real sandbox (notes 41, ₦10 item): completed, split 850/150, but the sandbox debited ₦10 with fee ₦0 (G-71), so the ₦23.25 debit is NOT RUN there.
- **Check 2 (the same request twice debits once):** passed: twice in a row (same bytes, `Idempotent-Replayed`, a wrong PIN on the repeat uses no try), 8 taps at once over one listening server (FIX-02; one transfer, every answer that payment or `in_progress`), and in the sandbox (the repeat never reached Fintava).
- **Also tested** (23 HTTP + 25 unit tests): 3 keys at once with money for 2 (Fintava refuses the third: 402, nothing moved); reused key; missing or malformed key before the PIN; wrong PIN then the same key pays; a key left running answered from its payment; shortfall `₦523.25` and the key usable after a top-up; quote changed, another person's token, forged, rotated key; unregistered, held, missing, owned and own-item targets; tip amount and note rules, digits only; tip ₦2,000 split 1700/300; no payee; ₦999.99 split 849.99/150.00 and 20,000 prices; timeout pending then settled by MONEY-08's check and delivered once with no second send; 5xx pending; refusal failed; Fintava's own insufficient; sandbox ₦0 fee kept as a discrepancy. Mutants killed: no key lock (17 fail), split of price plus fee (4), unknown outcome read as failure (2), no balance check (1), key not given back (2), fingerprint ignored (1).
- **Checks run:** `tsc` 0; eslint 0 on the 17 changed `.ts` files; full contract suite on fresh seeded `m17_full_test` (stand-in WAWU ID on :4001, free before, stopped after): 138/138 suites, 3322 passed, 3 skipped, 0 failed, money, Fintava, KYC, identity and `hub-rate-limits` included (no `@Throttle` added); protected route suite `--fresh HEAD`: 253/253, all 244 required, lock `origin/main` 44fdd7d, no lock or registry file touched; gates 16 fail / 14 warn before, 16 / 15 after (the new warning is `PROVISIONAL(IDEMPOTENCY-KEY-HOURS)`), baseline check passes; CI tripwire 0 added lines; 0 em-dashes added; staged diff scanned for every 8 characters of the Fintava key, 0 of 58. Mobile: `contract:build` then `sync_contract.py --backend` copied backend main 44fdd7d (no diff; the branch contract lands with the backend merge), and the branch contract was generated and typechecked here (tsc 0, then main's restored); `npm run check` exit 0 (28 suites, 485 tests; gates 0 fail, 0 warn, 123 files; 205 tasks) on the second run; the first failed once in `OpenWalletScreen.test.tsx` (5 s timeout under load average 8, no file of this task; finding 2).
- **Decisions, Default (agent), owner may override:** (a) a kind is paid only once its feature registers it; an unregistered kind is `target_not_payable` "This can't be paid for from your wallet yet."; (b) the split lives on the payment row, payee rounded down; (c) paying for your own item is `target_not_payable`; (d) a lost answer is never resent by MONEY-17: past the resend window with no record at Fintava the payment fails with no money moved and the buyer pays again (G-38); (e) a payment completes when Fintava moved the price even if its fee differs from the quote, the difference kept for MONEY-16 (a stop on the ledger row, not on the buyer); another amount leaves it pending for review; (f) keys kept 48 hours (PROVISIONAL); (g) Fintava's insufficient, frozen and unusable answers give the key back, other refusals are stored as `failed`; (h) the narration Fintava sees is "WAWU purchase".
- **Findings:** (1) MONEY-09: right PINs sent at once on a PIN route each take a try before comparing, so 5 or more at once can answer `423 pin_locked` to some until one finishes (the PIN ends unlocked); the payment route is safe from it because the key is taken first. (2) `OpenWalletScreen.test.tsx` "a user sees a loading view first" timed out once at 5 s under load and passed on the rerun.
- **NOT RUN:** (1) the ₦1,023.25 debit at Fintava: the sandbox charges ₦0 on wallet to wallet; unblocked when a sandbox wallet-to-wallet answers a non-zero `transaction_fee` (question 18) or by OPS-10's first live purchase (G-71). (2) A payment of a real kind end to end: none is registered (G-70); unblocked by HOME-15's `content_unlock`. (3) Biometric approval on this route over HTTP: the guard is MONEY-14's `@RequireApproval()` unchanged and is covered by its specs; unblocked by WALLET-06's phone key (G-43) for a device run. (4) V10: no screen; the app does not call these routes yet.


## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
