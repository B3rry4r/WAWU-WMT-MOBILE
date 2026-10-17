# HOME-13 · round history

Moved out of [tasks/HOME-13.md](../HOME-13.md) word for word, oldest first. The current state is in that file.

## Builder report

**Files.** New: `src/features/tips/` (`api.ts`, `model.ts`, `useTip.ts`, `TipSheets.tsx`, tests) and `src/features/feedpay/` (`payCall.ts`, `usePaymentFlow.ts`, `StatusSheet.tsx`, `useFeedPay.tsx`, `useKeyboardLift.ts`, shared with HOME-12). Edited: `src/features/feed/{FeedScreen,PostFrame,parts,look}`, `src/features/home/HomeScreen.tsx`, `src/app/(tabs)/index.tsx` (the handlers). With no handlers the feed draws no Tip (R-47).
**How it pays.** The breakdown is the Hub's quote for the amount, asked again on every change; Tip asks a FRESH quote before the PIN and shows, never pays, a moved total; ONE Idempotency-Key per attempt, kept (with its quote) across a wrong PIN, a lost answer and a closed sheet; `pending` is only read.
**Checks.** `npx tsc --noEmit` EXIT 0; eslint on changed files EXIT 0; jest tips+unlock+feed+home+shell, route-graph, focus, auth-guard, open-wallet guards: 17 suites, 266 tests EXIT 0 (18 new tip tests); `npm run gates` EXIT 0, 0 fail (was 0). Tests attack: double tap, wrong PIN, short balance (quote and payment), lost answer then retry, quote changed (before and at the PIN), pending, refused, no wallet.
**On the stack** (backend `e41210e` + STACK-NUV, `s1_test`, ports 7700-7707, Nuvion stand-in at ₦23.25): through the app's own screens, once each. Double tap: 1 payment, debit 202,325. Wrong PIN: nothing moved, same key, 1 debit. Short balance: sheet "You have ₦1,000.00", no payment, no debit. Lost answer (Hub took it, answer dropped) then retry: same key, no new quote, 1 debit. Quote changed: not drawable on the stack (the stand-in's fee is fixed); covered by tests.
**Pictures** (390 px, light and dark, beside the boards H2, H26, H27, H28): `.../scratchpad/s1-b/pics/beside-*.png`.
**Not done.** An attempt is kept for the app's run only (a force-quit after a lost answer gets a new key); the quote-changed attack on the stack; the Android and iOS phones (web export only).

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

