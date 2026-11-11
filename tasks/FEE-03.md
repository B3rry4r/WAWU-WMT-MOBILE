---
id: FEE-03
title: App: every withdrawal and payment shows the fee and what is received under the new schedule; switched-off products hidden; adding money by account number only
owner: YOU
area: MONEY
order: 396
priority: after-launch
repo: wawu-wmt-mobile
type: money-path
status: verifying
depends_on: [FEE-01]
decisions: [R-139, R-47]
passes: [V1, V2, V3, V4, V5, V6, V7, V8, V9]
artboards: []
tier: T2
---
# FEE-03 · App: the fee and what is received, before every confirm

## Current state

As of 11 Nov 2026.
- **Status:** verifying. Built 11 Nov 2026 on Hub `wmt/FEE-01` `176859ec`; see the Builder report. Cut by the lead from R-139 points 3, 5 and 11.
- **What exists:** the confirm screens already show fees before the PIN: `features/send/ReviewScreen.tsx`, `features/withdraw/WithdrawScreen.tsx`, `features/abroad/views.tsx` (`AbroadReviewView`), `features/wallet/fx/swap/SwapReview.tsx`, `components/pay-sheet/PaySheet.tsx` (and TipSheets, AskSheets, RequestPaySheet, legal PaySheets), `features/addmoney/model.ts`. They draw today's provider plus WAWU lines.

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md` or `VERIFIER.md`
- DECISIONS.md R-139, R-47 (show only what is built)
- tasks/FEE-01.md (the quote's new fields)

## Goal

Before any withdrawal, payout, send, swap or payment, a person sees WAWU's fee (and VAT when on) and the exact amount the receiver gets, taken from the Hub's quote; products switched off are not drawn; adding money shows only the wallet's account number with the bank charge passed on.

## Scope

- Each confirm screen draws the quote's fee, VAT (only when the Hub says it is on), total and "they get" lines; no figure is worked out in the app. The provider's own charge is never shown.
- Swap and receiving dollars from local banks are not drawn while the Hub says they are off.
- Add money: the account number only; no card, no USSD.
- A refusal below the minimum, or with a fee bigger than the amount, reads plainly on the screen.
- Ships to usewmt.com (R-134). Pictures at 390 px, dark and light, of every confirm screen beside its artboard.

## Capability checks

- [ ] A user withdrawing NGN 10,000 sees a fee of NGN 100 and NGN 9,900 reaching the bank (or the amount plus fee, as the Hub's quote says) before the PIN.
- [ ] A user does not see swap while it is off.
- [ ] A user adding money sees only their account number.

## Builder report

Round 0 (11 Nov 2026) is in [tasks/history/FEE-03.md](history/FEE-03.md). **Round 1 (builder, Sonnet, 11 Nov 2026):** Hub `wmt/FEE-01` head `4c781f08` (contract copied in; `contract/SOURCE_COMMIT` names it, under review).

- **Pay sheets moved to the quote's own fields.** `PaymentQuoteView` now carries `currency`, `feeMinor`, `vatMinor`, `vatOn`, `totalMinor`, `receiveMinor` (optional in the contract; `readPaymentQuote` refuses a quote without them, in both readers). Tip, Ask, Unlock, Ticket, School, Legal (matter pay and fixed price), the web wallet buy and PaySheet draw Fee, VAT only when `vatOn`, and Total; nothing reads `fee.totalFeeKobo` for them any more (`feeLines` and `quoteAddsUp` in `events/buyModel.ts`). Every wrapper type of a payment quote is derived from the generated one (`WithPayment`).
- **Abroad:** the review draws the quote's Fee, VAT (when on), Total and "<name> gets"; the receipt draws Fee and, when `vatMinor` is above nothing, VAT. On this head `providerFeeMinor` is 0 and `totalMinor` = amount + fee + VAT, so the rows add up on screen ($100.00 + $8.00 = $108.00 in the picture).
- **Judgment call 5 reverted (lead ruling):** the USD account's "Get paid from abroad" row is drawn whatever `localUsdIn` says; nothing is drawn or hidden for `localUsdIn`. The test now pins that.
- **Checks (exit codes):** `npm run check` exit 0 on this head (typecheck 0, lint 0 with 29 warnings and no errors, jest 549 suites and 8151 tests passed with 6 skipped, gates 0 fail, tasks 0); `npm run tasks` exit 0 again after this report was written.
- **Pictures** (390 px, light and dark), all in `audits/FEE-03/`: `round1/` (pay sheet `pay-sheet-390-*`, send `pay-sheet-send-390-*`, send with VAT `pay-sheet-send-vat-390-*`, `abroad-review-390-*`, the USD account with Get paid while `localUsdIn` is false `usd-get-paid-390-*`), `round0/` (withdraw, withdraw with VAT, withdraw refused, send review, send review with VAT, add money, round 0 abroad review and pay sheets) and `artboards/` (W17, W10, W15, H14 rendered with `render_design.py`). Stand-in Hub for the pictures: `/home/user/wt/fee-03-scratch/hub.js` (never the live Hub).
- **NOT RUN:** a picture of the Tip sheet and of the Ticket sheet on their own (their screens need a profile and an event from the Hub; both flows pass in jest with the new fields, and the pay sheet pictures show the same Fee, VAT, Total rows; Tip's breakdown draws them in its own list); the swap review (swap is off); a real Android phone; the live Hub. Still saying "Bank charge" or "WAWU fee", outside the confirm screens: transaction detail for past rows, crypto send, Capital, dev Showcase.

## Verifier report

## Owner sign-off
