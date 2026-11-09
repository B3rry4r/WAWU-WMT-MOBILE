# WEBAPP-06 · round history

Moved out of [tasks/WEBAPP-06.md](../WEBAPP-06.md) word for word, oldest first. The current state is in that file.

## Builder report

- Files: `src/features/store/webwallet/{api,catalog,useWebBuy}.ts(x)` (new), `useStore.ts` (web branch of `useStoreCatalog` and `useStoreBuyer`, plus `sheets`), `StoreParts.tsx` (no Restore on web), `CheckoutScreen`, `points/BuyScreen`, `credits/BuyCreditsSheet`, `verify/ProductsFullSheet`, `community-pass/PassScreen` (draw `buyer.sheets`), `bills/offered.ts`, `home/MoneyCard.tsx`, `wallet/home/WalletScreen.tsx`, `app/bills/index.tsx`. `iap.web.ts` is unchanged: the screens read the Hub's list prices through the same `useStoreCatalog`.
- Flow: the feed's own `usePaymentFlow` (a fresh quote on every Pay, one key per attempt kept across the sheet closing, a taken payment is only read).
- Tests: `src/features/store/__tests__/webWallet.test.tsx` (5: packs drawn at list price, no "Buy in the app", no Restore; a double tap on Buy asks one quote; Pay asks again; the PIN goes out once with `X-Transaction-Pin` and an `Idempotency-Key`, body `{kind, packId, method:'wallet', expectedTotalKobo, quoteToken}`; paid draws the Added view; short balance shows "Not enough", the top-up and sends nothing; no Bills on Home on web, yes on android).
- Money proofs on the stack (Hub + Nuvion stand-in, drivers in `/tmp/wmt-shots/webapp05/money-proofs.txt`): tier Verify: debit 299,900 exactly once, two simultaneous taps under one key gave 201 paid and 409 idempotency_in_progress, a later replay of the same key answered 201 with `Idempotent-Replayed: true`, same purchase id, extra debit 0, grant read back `paid`; points pack: debit 100,000 once, replay extra debit 0, points balance 1,100 (1,000 plus the tier's 100 bonus); credits starter: debit 50,000 once, replay extra debit 0, credits 50; wallet 20,000,000 to 19,550,100 = 299,900 + 100,000 + 50,000. Short wallet (balance 100,000, tier 299,900): the quote says shortfall 199,900 and the payment is 402 insufficient_funds with the same figures, balance unchanged. Wrong PIN five times: locked (see WEBAPP-05).
- Checks: as WEBAPP-05; `src/features/store` and the touched screens' specs all pass.
- Gaps: none filed.

- Pictures: 40 of 40 taken (10 states x dark and light x 390 and 1440) on the stack web export, into /tmp/wmt-shots/webapp05/ (no artboard exists for these states: the tasks list none, so there is no picture beside an artboard; the pay sheet is the shared one). Money proofs: /tmp/wmt-shots/webapp05/money-proofs.txt.

## Verifier report

