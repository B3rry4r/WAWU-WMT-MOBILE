# FEE-03 · round history

Moved out of [tasks/FEE-03.md](../FEE-03.md) word for word, oldest first. The current state is in that file.

## Round 1 (builder)

Round 1, builder (Sonnet), 11 Nov 2026. Mobile `wmt/FEE-03` on `origin/main` `74cd7790`, with `origin/wmt/RECORDS-1111c` `a1e13759` merged in so R-139 and tasks/FEE-01 exist for `npm run tasks`. Types generated from Hub `wmt/FEE-01` head `176859ec` (its `contract/openapi.json` copied in; `contract/SOURCE_COMMIT` names it "under review"; `sync_contract.py --backend` reads `origin/main` only, so the file was copied by hand and `npm run api` run without `--backend`). Nothing was committed to the Hub. Ships to usewmt.com (R-134): no eas build, submit or update.

**What each confirm screen draws (R-139 points 5 and 8; the lead's ruling for money going out):** Fee (`feeMinor`), VAT only when `vatOn`, Total (`totalMinor`) and what the other gets (`receiveMinor`). The provider's charge is never a row: no "Bank charge", "Partner fee" or "Conversion fee", and no "Fees" sum beside a VAT line.

| Screen | Change |
|---|---|
| `features/send/ReviewScreen.tsx` (PaySheet send variant) | Fee, VAT (when on), Total, "They get" = `receiveMinor`; a refusal (`below_minimum_withdrawal`, `fee_exceeds_amount`, `product_off`, `fees_not_set`) reads in the Hub's words under "This can't be sent" with no Try again |
| `features/withdraw/WithdrawScreen.tsx` | Fee, VAT, Total, "Your bank gets" rows before the PIN; the refusal reads under the amount; Max follows `feeMinor + vatMinor` of a fresh quote (fees on top) |
| `features/chat/ChatSendScreen.tsx`, `RequestPaySheet.tsx`, `useRequestPay.ts` | the same lines from the quote |
| `features/abroad/views.tsx` (amount card, `AbroadReviewView`, receipt) | one Fee row, VAT when on, Total, "<name> gets"; the partner-fee rows and the "partner fee is on the receipt" line are gone |
| `components/pay-sheet/PaySheet.tsx` and the Tip, Ask, Unlock, Ticket, School and Legal fixed-price sheets | one Fee row (`fee.totalFeeKobo`) instead of Bank charge; the from-a-dollar-account sheet shows one Fee |
| `features/wallet/fx/swap/*` | review draws Fee, VAT (when on), Total; swap (`products.swap`) and the USD "Get paid" row (`localUsdIn`) are not drawn while off |
| `features/addmoney/*` | the account number only: the other-ways list (card, USSD) is no longer mounted; one Fee row, the bank's receiving charge passed on |
| receipts (`receiptRows`, `withdrawReceiptRows`) | one Fee row from the transfer's own fee |

**Quote fields used:** `FeeQuoteView`: `currency`, `feeMinor`, `vatMinor`, `vatOn`, `totalMinor`, `receiveMinor` (and `amountKobo`, `quoteToken`, `expiresAt`, `arrivalMinutes` as before; `parts` is no longer read). `AbroadQuoteView` and `FxQuoteView`: the same six. `FxCurrenciesView.localUsdIn` and `products.swap` for the switches. The four new error codes show the Hub's sentence.

**Mismatches with FEE-01's real contract at `176859ec` (for the lead):**
1. `FeeQuoteView`'s new fields are OPTIONAL and NULLABLE in the contract (required at `171c538c`). The app derives its `FeeQuote` from the generated type and `readQuote` refuses a quote without them ("Your fees could not be read"), so a missing field stops the screen and never draws a guess. The Hub should make them required again.
2. `localUsdIn` is a field of `FxCurrenciesView` itself, not inside `products`.
3. `PaymentQuoteView` (tips, asks, unlocks, tickets, school and legal fees, bills) has NO new fields. Those sheets draw one "Fee" from `fee.totalFeeKobo` (provider plus WAWU merged), no VAT line and no "They get". If the Hub adds the fields they move to them.
4. `AbroadQuoteView.feeMinor` is WAWU's fee only while `totalMinor` still includes the partner's fee, so on this head the abroad review's Fee and Total do not add up (a $1.50 partner fee and $0 WAWU fee reads Fee $0.00, Total $101.50). The lead said the Hub removes the provider's part in its fix round; the screen draws the quote as it comes. `AbroadSendView` (the receipt) has no new fields: its Fee row is WAWU's fee only. The abroad test double follows the target (one Fee that holds everything).
5. FEE-01's fix round (one fee under Nuvion) was not on the branch when this was handed back; head used is `176859ec`. Regenerate with `npm run api` after copying the next head's contract.

**Tests:** fixtures of the Hub's quote gained the six fields; assertions that named "Bank charge", "WAWU's fee" or "Fees" now name "Fee" (changed on purpose: R-139 replaces R-10 for these lines). New specs: Withdraw (refusal below the minimum, fee bigger than the amount, VAT on, Android), Send review (VAT on, refusal, Android), PaySheet VAT, swap fee rows with VAT, held abroad quote without the new fields refused, USD Get paid not drawn when `localUsdIn` is false.

**Pictures (390 px, light and dark; stand-in Hub `/home/user/wt/fee-03-scratch/hub.js`, web build on port 16900; artboards W17, W10, W15, H14 from `render_design.py` in `/home/user/wt/fee-03-scratch/pics/design/`):** in `/home/user/wt/fee-03-scratch/pics/`: `withdraw-390-{light,dark}.png`, `withdraw-vat-390-*`, `withdraw-refused-390-*`, `send-review-390-*`, `send-review-vat-390-*`, `add-money-390-*`, `abroad-review-390-*`, `pay-sheet-390-*`, `pay-sheet-send-390-*`, `pay-sheet-send-vat-390-*`. Known difference: the boards still draw "Bank charge" and "WAWU's fee" rows, which R-139 replaces.

**Checks (exit codes):** `npx tsc --noEmit` 0; `npm run lint` 0; `npx jest` (whole suite) 548 suites passed, 8148 tests passed, 6 skipped, exit 0; `npm run gates` 0 (0 fail, 17 warn, 0 accepted); `npm run tasks` exit 0 (after the merge of `origin/wmt/RECORDS-1111c`).

**NOT RUN:** pictures of the Tip, Ask, Request, Unlock, Ticket and school/legal sheets one by one (they draw through the same rows and are covered by their jest flows); a swap review picture (swap is off); a real Android phone (jest `Platform.OS` android specs added for Withdraw and Send review; PHONE CHECK: none beyond the usual); the live Hub (never called). Still saying "Bank charge" or "WAWU fee", outside this task's confirm screens: the transaction detail screen (`wallet/history/DetailScreen`, past rows), crypto send (`CryptoSendScreen`), the Capital screens, the dev Showcase.

## Builder report, round 1

Round 0 (11 Nov 2026) is in [tasks/history/FEE-03.md](history/FEE-03.md). **Round 1 (builder, Sonnet, 11 Nov 2026):** Hub `wmt/FEE-01` head `4c781f08` (contract copied in; `contract/SOURCE_COMMIT` names it, under review).

- **Pay sheets moved to the quote's own fields.** `PaymentQuoteView` now carries `currency`, `feeMinor`, `vatMinor`, `vatOn`, `totalMinor`, `receiveMinor` (optional in the contract; `readPaymentQuote` refuses a quote without them, in both readers). Tip, Ask, Unlock, Ticket, School, Legal (matter pay and fixed price), the web wallet buy and PaySheet draw Fee, VAT only when `vatOn`, and Total; nothing reads `fee.totalFeeKobo` for them any more (`feeLines` and `quoteAddsUp` in `events/buyModel.ts`). Every wrapper type of a payment quote is derived from the generated one (`WithPayment`).
- **Abroad:** the review draws the quote's Fee, VAT (when on), Total and "<name> gets"; the receipt draws Fee and, when `vatMinor` is above nothing, VAT. On this head `providerFeeMinor` is 0 and `totalMinor` = amount + fee + VAT, so the rows add up on screen ($100.00 + $8.00 = $108.00 in the picture).
- **Judgment call 5 reverted (lead ruling):** the USD account's "Get paid from abroad" row is drawn whatever `localUsdIn` says; nothing is drawn or hidden for `localUsdIn`. The test now pins that.
- **Checks (exit codes):** `npm run check` exit 0 on this head (typecheck 0, lint 0 with 29 warnings and no errors, jest 549 suites and 8151 tests passed with 6 skipped, gates 0 fail, tasks 0); `npm run tasks` exit 0 again after this report was written.
- **Pictures** (390 px, light and dark), all in `audits/FEE-03/`: `round1/` (pay sheet `pay-sheet-390-*`, send `pay-sheet-send-390-*`, send with VAT `pay-sheet-send-vat-390-*`, `abroad-review-390-*`, the USD account with Get paid while `localUsdIn` is false `usd-get-paid-390-*`), `round0/` (withdraw, withdraw with VAT, withdraw refused, send review, send review with VAT, add money, round 0 abroad review and pay sheets) and `artboards/` (W17, W10, W15, H14 rendered with `render_design.py`). Stand-in Hub for the pictures: `/home/user/wt/fee-03-scratch/hub.js` (never the live Hub).
- **NOT RUN:** a picture of the Tip sheet and of the Ticket sheet on their own (their screens need a profile and an event from the Hub; both flows pass in jest with the new fields, and the pay sheet pictures show the same Fee, VAT, Total rows; Tip's breakdown draws them in its own list); the swap review (swap is off); a real Android phone; the live Hub. Still saying "Bank charge" or "WAWU fee", outside the confirm screens: transaction detail for past rows, crypto send, Capital, dev Showcase.

## Verifier report, round 1

Verifier (Sonnet), 11 Nov 2026, on `origin/wmt/FEE-03` `6a62f0f1`. Verdict: **FIX**.

`npm run check` on the head: exit 0 (typecheck 0, lint 0, jest 549 suites, 8151 passed, 6 skipped, gates 0 fail / 17 warn / 0 accepted, tasks 0). Hub contract: the app's `contract/openapi.json` is byte-identical to `origin/wmt/FEE-01` `e5474cbe` (the Hub's later commits are test fixes only); nothing to report.

| Pass | Result | Evidence |
|---|---|---|
| V1 types and contract | PASS | contract identical to Hub head; `FeeQuoteView`, `PaymentQuoteView`, `AbroadQuoteView`, `FxQuoteView` carry the six fields, all optional in the contract (not in `required`); app narrows them with `-?`/`NonNullable` and refuses a quote without them. |
| V2 one fee, VAT only when `vatOn` | PASS on Withdraw, Send, chat Send, Request, pay sheets, abroad review, swap rows; FAIL on three paths | see F2, F3, F4. |
| V3 no app-side fee arithmetic | PARTIAL | `sourceRows` in `components/pay-sheet/PaySheet.tsx:358` adds `providerFeeMinor + wawuFeeMinor` into "Fee" and `sourceTotalMinor` (:295) adds amount + both: arithmetic and the provider's charge on the from-a-dollar-account sheet (F3). Receipts show `transfer.fee.totalFeeKobo`. |
| V4 refusals read plainly | PASS | Withdraw (`withdraw-refusal`) and Send review draw the Hub's sentence for `below_minimum_withdrawal`, `fee_exceeds_amount`, `product_off`, `fees_not_set`, no Try again; jest covers the first two and the Hub-worded fallback. |
| V5 switched-off products and add money | PASS | `OtherWays` no longer mounted; Add money draws account name, number, bank, one Fee row, Share details. USD "Get paid" drawn whatever `localUsdIn` says (picture `usd-get-paid`). Swap not drawn when `products.swap` is off. |
| V6 Max and totals | PASS with a note | a person cannot submit a total above the balance (`withdrawBlock` `short_with_fees` blocks the button, `withdraw()` re-quotes and stops on a changed total). Probe: `maxWithdrawKobo` with a fee that rises on every read returns 4,960,000 of 5,000,000 after 4 reads without checking the last candidate's fee, so Max can fill an amount the next quote refuses (F6). |
| V7 renamed assertions | PASS with a note | diffed `git diff origin/main...origin/wmt/FEE-03 -- '*.test.*'`: every "Bank charge"/"WAWU's fee"/"Fees" assertion became a "Fee"/"Total" assertion plus `queryByText('Bank charge')` null; none dropped a figure check except the receipt's `15 naira 75 kobo` (the provider's part, correctly gone). Fixtures set `feeMinor` = provider + WAWU (₦65) so tests cannot tell WAWU's fee from the whole; nothing exercises `totalKobo` differing from `totalMinor` (F7). |
| V8 pictures | FAIL (hard rule 1) | opened all 10 round 1, 20 round 0 and 8 artboard pictures. Withdraw, withdraw VAT, withdraw refused, send review (+VAT), unlock pay sheet, send pay sheet (+VAT), abroad review, add money, USD Get paid drawn as built. Missing: Tip sheet, Ticket sheet (NOT RUN by the builder), and also Ask, Request pay, chat Send, School, Legal fixed price and matter pay, web wallet buy, the from-a-dollar-account sheet, withdraw and send receipts, the PIN sheet over a confirm, crypto send. Round 0 pictures were taken before round 1 and show the pre-round-1 code for abroad and pay sheets. Artboards differ only by the expected Bank charge/WAWU's fee rows (W10 already draws Fee and Total). Pictures are of a stand-in Hub; the Add money picture says "Nuvion MFB" as the bank name (stand-in data). |
| V9 Android | PASS | `Platform.OS` android specs exist and pass: `withdrawFlow.test.tsx:308`, `sendFlow.test.tsx:424` (inside the 549-suite run). |

### Findings

**High**
- F1 Deploy order. Under Fintava the Hub omits the six fields (`fee-quote.service.ts` adds them only when `this.engine`; `wallet-payment.service.ts` and abroad likewise), and `WALLET_PROVIDER` defaults to `fintava`. `readQuote` (`src/features/send/api.ts:100`) and `readPaymentQuote` (`src/features/events/buyApi.ts:83`) then throw, and Withdraw shows "We couldn't work out the fees. Tap to try again." (`WithdrawScreen.tsx:420`) with a retry that can never succeed; Send review shows the blocked state; every pay sheet is dead. The app is on Fintava until the keys swap (R-139 point 12). The app must not reach usewmt.com before the Hub runs Nuvion, or FEE-01 must serve the fields under Fintava. Lead ruling needed; record the order in the task. Test that kills it: a hub double with a Fintava-shaped quote, asserting the sheet reads the fees another way or the deploy gate is stated.
- F2 Abroad review button says `Send $100.00` (`views.tsx:361`, `amountFromMinor`) while the card above says Total from your USD account $108.00 (picture `round1/abroad-review-390-*`). The button must carry the total (`q.totalMinor`), as Withdraw and Send do. Kill: a spec that the button label equals the Total row.
- F8 Hard rule 1: pictures of Tip and Ticket, and the other touched sheets listed in V8, are missing. FIX, never MERGE.

**Medium**
- F3 `sourceRows` (`PaySheet.tsx:355-361`) is the from-a-dollar-account pay sheet: "Fee" = `providerFeeMinor + wawuFeeMinor` worked out in the app, total from `sourceTotalMinor`; it ignores the quote's `feeMinor`/`totalMinor`/`receiveMinor` and shows the provider's charge inside "Fee". `usePaySource.ts:122` feeds it. Move it to `FxQuoteView.feeMinor/totalMinor`.
- F4 Abroad, non-payout path: Hub `totalMinor` = amount + partner fee + WAWU fee while `feeMinor` is WAWU's only, so Fee and Total do not add up on screen (a $1.50 partner fee reads Fee $0.00, Total $101.50). Hub side (FEE-01); the app also has no test of it.
- F5 Still drawing a provider charge or the old labels on a confirm or receipt: `cards/GetCardScreen.tsx:169` with `cards/model.ts:33,134` ("Bank charge" then WAWU's fee, total from `fee.totalFeeKobo`); `wallet/fx/FxReceiptScreen.tsx:46-63` ("Bank charge", "WAWU fee", "Fees") for swap and abroad-style receipts; `wallet/fx/CryptoSendScreen.tsx:326,350` ("Network fee" from `providerFeeMinor`, "WAWU fee", total plus network fee); `wallet/history/model.ts:178,243` (past rows, allowed); `capital/*` ("WAWU's fee"); `showcase/Showcase.tsx` (dev). The builder listed crypto send, Capital, detail and Showcase; GetCard and the swap receipt were not listed. Lead to rule whether card issue and crypto send are inside R-139 point 5.
- F9 Receipts (`receiptRows`, `withdrawReceiptRows`) draw `transfer.fee.totalFeeKobo` as "Fee". If that is provider + WAWU under any provider, the receipt Fee will not match the confirm Fee. Not provable from the contract; needs a sandbox answer.

**Low**
- F6 `maxWithdrawKobo` (`withdraw/model.ts:136`) leaves its last candidate unchecked after 4 rounds, and may offer an amount under the minimum; submit stays blocked, so nothing overspends. Kill: a fee that rises per read, asserting `max + fee(max) <= balance`.
- F7 `totalKobo` (approval line, changed-total compare) and `totalMinor` (button, rows) are both read on one path (`WithdrawScreen.tsx:187,286,304`, `ReviewScreen.tsx:363,441`, `ChatSendScreen.tsx:173`). Equal on this Hub (`fee-quote.service.ts`), but one test with them unequal is missing.
- Add money still draws one "Fee" row (R-139 point 11 says the receiving fee is passed on; the lead said "only the account number"): lead to confirm the row stays.
- `usd-get-paid` picture shows "Couldn't load your transactions" from the stand-in Hub; unrelated to this task.

### Probes (scratch tests, removed, `git status` clean)
Max with a rising fee: 4 reads, returns 4,960,000, last fee 40,000 (total 5,000,000 = balance, next read 50,000 would not fit). `formatMinor`: 2688 NGN = ₦26.88, 10010750 = ₦100,107.50, 10800 USD = $108.00, 5 USD = $0.05, 123456789 USD = $1,234,567.89.

### NOT RUN
A real Android phone (PHONE CHECK as the builder said); the live Hub and a Fintava-mode Hub; a Nuvion sandbox transfer (F9); my own web build pictures (I judged the builder's from the files; none of the touched sheets lacking a picture was taken by me).

## Builder report, fix round 2

Fix round 2 (builder, Sonnet, 11 Nov 2026) on `origin/wmt/FEE-03-verify` `85ceea32` (fast-forwarded, so the verifier report is kept). Hub `wmt/FEE-01` head used: `e5474cbe` (newest when this was written; its contract is byte-identical to the app's, and the pay-fx quote `PaymentSourceView` still carries no `feeMinor`, `vatMinor`, `totalMinor` or `receiveMinor`).

| Finding | Fix |
|---|---|
| F1 high, never a dead end | A quote without the fee fields is no longer refused. `send/quotedFee.ts` holds `hasQuotedFee` (the whole set or none, never a mix), `totalOf` and `receiveOf`. With the fields every screen draws Fee, VAT when on, Total, "gets"; without them Withdraw, Send review, chat send and request, and every pay sheet (`events/buyModel.feeLines`, `quoteAddsUp`) and the Legal fixed-price card draw their old rows (Bank charge, WAWU's fee, Fees, Total) from the quote's `parts` or `fee`. Types are the generated ones again (the derived "whole" types are gone). Specs: Withdraw, Send review and the Unlock pay sheet each with a Fintava-shaped quote, `payQuoteFee.test.ts`, `model.test.tsx`. |
| F2 high | The abroad review button and the PIN sheet line carry `totalMinor` ("Send $108.00" in the picture); spec asserts the button equals the Total row. |
| F3 medium | The from-a-dollar sheet (`PaySheet` `sourceRows`) is back to its pre-R-139 rows (Bank charge, Conversion fee) because `PaymentSourceView` has no `feeMinor`, `vatMinor`, `totalMinor` or `receiveMinor` at `e5474cbe`; the app does no new fee arithmetic there. It moves to those fields once the Hub adds them. The one-fee draw I made in round 1 (`providerFeeMinor + wawuFeeMinor`) is removed. |
| F5 medium | One "Fee" and no "Bank charge", "WAWU fee" or "Network fee" on: the card-issue confirm (`cards/model.ts` `feeRows`, the Hub's `totalFeeKobo`), the FX receipt (`FxReceiptScreen`: swap and crypto-send rows), crypto send (`CryptoSendScreen`: the form's fee list and the review sheet; Fee is everything beyond the amount from the quote's own two figures). Capital, the dev Showcase and past transaction detail rows stay. |
| F7 low | Every shown or compared total reads `totalOf` (approval line, changed-total compare, button, Total row) in Withdraw, Send review, chat send and request. Specs where `totalKobo` and `totalMinor` differ: Withdraw, Send review, `model.test.tsx`, `payQuoteFee.test.ts`, the Unlock sheet with VAT. |
| Add money | One Fee row kept (R-139 point 11), as ruled. |
| F6, F9 | F6 left as a low. F9 (receipt Fee source) goes to the Hub builder. |
| F4 | Hub side; the abroad review is drawn from the quote's own fields and the Hub's `providerFeeMinor` is 0 on this head. |

**Checks:** `npm run check` exit 0 (typecheck 0, lint 0 with 28 warnings and no errors, jest 549 suites, 8160 tests passed, 6 skipped, gates 0 fail, tasks 0); `npm run tasks` exit 0 again after this report.

**Pictures (F8)**, 390 px, light and dark, from this round's code, in `audits/FEE-03/round2/` (artboards W17, W10, W15, H14 stay in `audits/FEE-03/artboards/`; the stale round 0 and round 1 pictures are removed). Stand-in Hub (never the live Hub): `withdraw`, `withdraw-pin` (PIN sheet over Withdraw), `withdraw-receipt`, `withdraw-vat`, `withdraw-refused`, `withdraw-fallback` (a Fintava-shaped quote: Bank charge, WAWU's fee, Fees), `send-review`, `send-pin` (PIN sheet over Send), `send-receipt`, `send-review-vat`, `send-review-fallback`, `crypto-send`, `crypto-send-review`, `card-issue`, `add-money`, `abroad-review`, `abroad-receipt`, `tip` and `tip-vat` (the real Tip sheet), `pay-sheet`, `pay-sheet-send`, `pay-sheet-send-vat`, `pay-sheet-from-usd` (from-a-dollar sheet). Every one was opened and looked at.

**Pictures added after the first push of round 2** (same folder, light and dark, each opened and looked at): `ticket` (event sheet), `ask` (Ask sheet), `request-pay`, `chat-send`, `school` (Enroll sheet), `legal-fixed`, `legal-matter` (Pay and start), `web-buy` (points buy, web wallet). They were taken by running the test doubles unchanged behind HTTP (legalHub, the chat double, and the school, ticket, ask and web-wallet doubles cut out of their jest files) so the real screens answered with the quote fields. A real Android phone; the live Hub; a Fintava-mode Hub run end to end. Not photographed: the Unlock sheet on its own (its feed screen needs a feed; the pay sheet pictures and its jest flows cover it).

### Fix round 2, step 2 (Hub `wmt/FEE-01` head `263ecd12`)

- Contract regenerated from `263ecd12`: the generated types do not change from `e5474cbe` (the Hub's pay-fx fields ride on the existing `PaymentQuoteView` fields: under the engine `feeMinor`, `vatMinor`, `vatOn`, `totalMinor`, `receiveMinor` and `currency` are in the SOURCE currency while a payment is made from a foreign account, and `source.providerFeeMinor` is folded to 0).
- **F3 now on the quote's fields:** `PaySource` gained an optional `quoted` (set by `usePaySource` from the payment quote when it says the whole set in the source's currency). The from-a-dollar sheet draws one Fee, VAT when on, and the quote's `totalMinor` (button and PIN line too). Without `quoted` it keeps the earlier rows (Bank charge, Conversion fee), so a Hub on Fintava is not a dead end. Spec in `PaySheet.test.tsx`; picture `pay-sheet-from-usd` retaken ($1.90 + Fee $0.08 = $1.98).
- Next: when the lead names the final Hub head, regenerate once more if `git diff 263ecd12..<final> -- contract/openapi.json` shows a change.


## Verifier report, round 2 re-check

Verifier (Sonnet), 11 Nov 2026, on `origin/wmt/FEE-03` `b1f9e40d` (merged into `wmt/FEE-03-verify`, no rebase). Verdict: **MERGE**, with the lows below carried.

`npm run check` on `b1f9e40d`: exit 0 (typecheck 0, lint 0 with 28 warnings and no errors, jest 549 suites, 8161 passed, 6 skipped, gates 0 fail / 17 warn / 0 accepted, tasks 0). Hub `origin/wmt/FEE-01` is still `263ecd12`; its `contract/openapi.json` is byte-identical to the app's copy (`contract/SOURCE_COMMIT` names `263ecd12`): no regeneration needed.

| Finding | Result | Evidence |
|---|---|---|
| F1 no dead end | PASS | `send/quotedFee.ts` `hasQuotedFee` takes the whole set or none; without it Withdraw (`withdrawFeeRows`, `feeAt`), Send review (`feeLinesOf`, `quoteAddsUp`), chat send/request and `events/buyModel.feeLines` draw main's rows from `parts`/`fee`. Specs with a Fintava-shaped quote: Withdraw, Send review, Unlock pay sheet, `payQuoteFee.test.ts`, `model.test.tsx`, plus "a partial set is none". Pictures `withdraw-fallback`, `send-review-fallback` show Bank charge, WAWU's fee, Fees, Total and a working button. The old refuse-tests were replaced on purpose (lead ruling). Abroad `readHeldQuote` still refuses a quote without the fields (abroad is Nuvion only; low). |
| F2 abroad button | PASS | `views.tsx:361` and `model.ts:204-207` use `totalMinor`; spec `Send $101.50` equals the Total row; `approvalPurpose` spec uses `totalMinor`; picture `abroad-review` "Send $108.00" = Total $108.00. |
| F3 from-a-dollar sheet | PASS | `PaySource.quoted` set in `usePaySource.ts` only when the whole set is present and `payment.currency === source.currency`; sheet draws the quote's Fee, VAT when on, `totalMinor`; without `quoted` it keeps Bank charge and Conversion fee (no new arithmetic). Spec in `PaySheet.test.tsx`; picture `pay-sheet-from-usd` ($1.90 + $0.08 = $1.98, button $1.98). |
| F5 one Fee | PASS with a low | card issue (`cards/model.ts` one "Fee" from `totalFeeKobo`, picture `card-issue`), FX receipt rows and crypto send (form and review sheet) draw one Fee and a Total, no "Bank charge", "WAWU fee" or "Network fee". Low: crypto send and the FX receipt's Fee is `wawuFeeMinor + providerFeeMinor` added in the app (`feeOfQuote`, `FxReceiptScreen.feeRows`) because `FxSendQuote` carries no `feeMinor`; it merges the provider's part into the shown Fee, which is the lead's ruling, but it is app-side arithmetic. Still old labels by design: Capital, dev Showcase, past detail rows (`wallet/history/model.ts`). |
| F7 one total source | PASS with a low | `totalOf`/`receiveOf` used for button, approval line, changed-total compare and Total row in Withdraw, Send review, chat send and request. Specs where `totalKobo` differs from `totalMinor`: Withdraw, Send review, PaySheet, `payQuoteFee.test.ts`, `model.test.tsx`. Low: chat send and request pay have no spec with the two unequal. |
| F8 pictures | PASS | 62 files in `audits/FEE-03/round2/` (31 screens, light and dark). Opened and looked at: withdraw, withdraw-pin, withdraw-vat, withdraw-refused, withdraw-fallback, withdraw-receipt, send-review-vat, send-review-fallback, send-pin, send-receipt, tip-vat, ticket, ask, request-pay, chat-send, school, legal-fixed, legal-matter, web-buy, pay-sheet, pay-sheet-send-vat, pay-sheet-from-usd, abroad-review, abroad-receipt, crypto-send, crypto-send-review, card-issue, add-money (round 1 set). Unlock on its own: `pay-sheet` is the Unlock sheet (price, Yours, Fee, Total, button) and `pay-sheet-from-usd` is Unlock from a dollar account; both seen, judged covered. Pictures I did not open one by one are the other theme of the same screens (dark twin of a light picture I opened, or the reverse) and `tip`, `send-review`, `pay-sheet-send`, `withdraw`, `request-pay`/`ticket` twins; they share code with the opened ones. |
| Tests since `6a62f0f1` | PASS | diffed `git diff 6a62f0f1..HEAD -- '*.test.*'`: removed assertions are the refuse-a-quote tests (replaced by never-refused and partial-set tests), the crypto "Network fee"/"Shown on your receipt" and "+ network fee" assertions (gone by F5), the card Bank charge/WAWU rows (now one Fee), and the abroad `$100.00` approval text (now `$108.00`). None is weaker than the ruling requires. |

### Findings (all low, none blocks the merge)
- L1 Abroad picture pair: `abroad-review` says Fee $8.00 and Total $108.00, while `abroad-receipt` for the same send says Fee $0.00 and shows no Total (`AbroadSendView` has no new fee fields; the stand-in sends back a send record with WAWU fee 0). The two screens can disagree for one send; Hub side (the receipt view carries no `feeMinor`/`vatMinor`/`totalMinor`).
- L2 Crypto send and FX receipt Fee is summed in the app (above).
- L3 Chat send and request pay have no `totalKobo` versus `totalMinor` spec.
- L4 Still carried from round 1: F4 (abroad non-payout path total includes the partner fee, Hub side), F6 (`maxWithdrawKobo` leaves its last candidate unchecked; submit stays blocked), F9 (receipt Fee is `transfer.fee.totalFeeKobo`; needs a Nuvion sandbox answer), add money keeps one Fee row.
- L5 Deploy order: with the F1 fallback the app no longer dead-ends under Fintava, it shows the pre-R-139 rows (Bank charge, WAWU's fee). Shipping before Nuvion is safe but does not show R-139 until the Hub serves the fields.

### NOT RUN
A real Android phone (jest `Platform.OS` android specs for Withdraw and Send review exist and pass); the live Hub and a Fintava-mode Hub end to end (stand-in only); a Nuvion sandbox transfer (F9); my own web build pictures (judged the builder's files); every one of the 62 pictures opened individually (about 35 opened, the rest are twins).
