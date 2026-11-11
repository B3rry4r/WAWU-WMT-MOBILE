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
