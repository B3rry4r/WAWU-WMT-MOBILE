# TIER-RENEW · round history

Moved out of [tasks/TIER-RENEW.md](../TIER-RENEW.md) word for word, oldest first. The current state is in that file.

## Builder report

- Files: `src/features/verify/YourTierScreen.tsx`; tests `publishAndTier.test.tsx`, `productsFullStore.test.tsx`; this file, `tasks/history/TIER-RENEW.md`, `docs/LOG.md`, `tasks/INDEX.md`/`docs/PROGRESS.md`.
- Check 1 (active Verify: Upgrade, no Renew; active Founding Maker: no button): jest ios and android, and the picture. Check 2 (ending or ended: Renew with price): jest, and the pictures show Renew with the store price. Check 3: pictures at 390 and 1440.
- Checks: typecheck EXIT 0, lint EXIT 0, `jest -w 2` 7779 passed, 3 failed in webWallet09 and chatSend (killed under load), both re-run alone with -w 1: pass.
- No shared-file change, no gap.

## Verifier report (T1)

Verdict: MERGE. No findings at any severity; two notes.

- Check 1 (every Renew offer): the only Renew button is `your-tier-renew` in `YourTierScreen.tsx`, now drawn only when `canRenew` (sold and state `ending` or `ended`). The other routes to `/checkout` are `tiers.tsx` (kind `tier` or `upgrade` only, from TiersScreen's `onContinue` type) and `TierOfferBridge.tsx` (kind `tier`). Me and `ProductsMeter` only say "Until"/"Ends"; `PublishScreen` and `shop-product.tsx` send an ended tier to Your tier; the limit sheet has no Renew; push routes (`verify_reminder` goes to `/tiers`; the 3-day reminder opens a room pass, not a tier); `webwallet/api.ts` only prices a `renew` spec once the checkout asks for it. No link or notification sends `/checkout?kind=renew` for an active tier; only a typed URL reaches it (not blocked, as the builder said, not an offer).
- Check 2 (tests vs `origin/wmt/BATCH-1110`): `publishAndTier` active-Verify case flips Renew to Upgrade and no Renew, and the Renew press moves to ending/ended cases with the same `/checkout?kind=renew&tier=verify` assertion; `productsFullStore` changes only the held tier's state `active` to `ended` (and dates), same assertions. Added cases only. Nothing weakened.
- Check 3 (web export behind vercel.json headers, stack `trv`, own databases; tier end dates and email-verified flags set by SQL in my own databases, the Hub computed the states): active Verify: Upgrade only (Upgrade opens /tiers); active Verify Plus: Upgrade only; active Founding Maker: no button; ending (+3 days): Upgrade and `Renew · ₦2,999`; ended: Upgrade and `Renew · ₦2,999`. Renew on ending and ended reaches `/checkout?kind=renew&tier=verify` showing Verify, ₦2,999, "Renew · ₦2,999". Pictures (21) in /tmp/wmt-shots/tier-renew-verify/ at 390 light, 390 dark, 1440 light, each state; looked at.
- Check 4: typecheck EXIT 0; lint EXIT 0; `npx jest -w 2` EXIT 0 (523 suites, 7795 passed, 6 skipped, none killed); `npm run gates` EXIT 0 (10 gates, 1693 files, 0 fail, 17 warn, 0 accepted); `npm run tasks` EXIT 0 (522 tasks).
- Notes (not findings): tapping Upgrade on an ended tier lands on the tiers sheet headed "Make it official" (existing behaviour, not changed here); the export needed `--clear`-free rebuild under load only because the first attempt hit the 580 s cap.

