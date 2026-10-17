# HOME-12 · round history

Moved out of [tasks/HOME-12.md](../HOME-12.md) word for word, oldest first. The current state is in that file.

## Builder report

**Files.** New: `src/features/unlock/` (`api.ts`, `model.ts`, `useUnlock.ts`, `UnlockSheets.tsx`, `patchFeed.ts`, tests); shared `src/features/feedpay/` (see HOME-13). Edited: `parts.tsx` (`OfferBar` is a button only when wired), `PostFrame.tsx`, `FeedScreen.tsx`, `VideoPost.tsx` (an unlocked video leaves its ended preview and plays from the start).
**How it pays.** The bar's tap asks a fresh quote (a double tap asks once), Pay asks another before the PIN, a moved total is shown and not paid, one key per attempt, the Hub's `pending` is only read. After a paid unlock the post is patched in every feed the app holds with the Hub's `fullAssetUrl` and `GET /content/{id}/media`, so Watch now plays in place.
**Checks.** `npx tsc --noEmit` EXIT 0; eslint on changed files EXIT 0; jest (same run as HOME-13) 17 suites, 266 tests EXIT 0 (15 new unlock tests); `npm run gates` EXIT 0, 0 fail (was 0). Tests attack: double tap, wrong PIN, short balance (quote and payment), lost answer then retry, price moved (before the PIN), pending, paid-but-not-opened (H18), a refund after a takedown (the Hub's words shown, post stays locked), no wallet.
**On the stack** (once each, through the screens): double tap on bar and Unlock: 1 payment, debit 252,325. Wrong PIN: same key, 1 debit. Short balance: no payment, no debit. Lost answer then retry: same key, no new quote, 1 debit. Price raised under an open sheet: "The price changed", nothing sent, Try again shows ₦3,023.25. Piece taken down before the PIN: the Hub refuses (404) before any money moves; the app shows its words. The refund after the debit (takedown in the pending window) cannot be raced here: the Hub answers `paid` in about 2 s; covered by the test.
**Pictures** (390 px, light and dark, beside H5, H14, H15, H16, H17, H18): `.../scratchpad/s1-b/pics/beside-*.png`. H18 is a picture-only rewrite of the Hub's answer (the real payment was made; the state lasts a moment).
**Not done.** The phone builds (web export only); the Reference is the Hub's long id (G-1722); a force-quit loses a kept attempt.

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

