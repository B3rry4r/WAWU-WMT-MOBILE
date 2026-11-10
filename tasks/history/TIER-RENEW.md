# TIER-RENEW · round history

Moved out of [tasks/TIER-RENEW.md](../TIER-RENEW.md) word for word, oldest first. The current state is in that file.

## Builder report

- Files: `src/features/verify/YourTierScreen.tsx`; tests `publishAndTier.test.tsx`, `productsFullStore.test.tsx`; this file, `tasks/history/TIER-RENEW.md`, `docs/LOG.md`, `tasks/INDEX.md`/`docs/PROGRESS.md`.
- Check 1 (active Verify: Upgrade, no Renew; active Founding Maker: no button): jest ios and android, and the picture. Check 2 (ending or ended: Renew with price): jest, and the pictures show Renew with the store price. Check 3: pictures at 390 and 1440.
- Checks: typecheck EXIT 0, lint EXIT 0, `jest -w 2` 7779 passed, 3 failed in webWallet09 and chatSend (killed under load), both re-run alone with -w 1: pass.
- No shared-file change, no gap.

## Verifier report

