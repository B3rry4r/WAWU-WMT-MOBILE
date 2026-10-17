# VERIFY-01 · round history

Moved out of [tasks/VERIFY-01.md](../VERIFY-01.md) word for word, oldest first. The current state is in that file.

## Builder report

Files: new `src/features/verify/` (api, model, bonusStep, parts, BonusScreen, ShopScreen, DraftFormScreen, 4 test files), routes `src/app/verify-bonus.tsx`, `shop.tsx`, `shop-product.tsx`; edits `src/features/me/ContentGrid.tsx`, `MeScreen.tsx`, `src/app/(tabs)/me.tsx` (the draft tile entry) and `src/features/create/CreateScreen.tsx`, `src/app/create.tsx` (the draft row); SHARED-CHANGES, BACKEND_GAPS, LOG.
Checks: VF1 reads `GET /plans` (test: rows from the preselected tier only, a tier with no points or Voice Intro draws no row, a failed read keeps the button); VF2 lists, empties and errors (tests); form saves with only a title, sends only changed fields, deletes after one confirmation, shows the Hub's refusal (tests); entries (tests). `tsc` clean, eslint clean on every changed file.
Not done: pictures, the A4 hand-on (fenced, rows filed), the Voice Intro entries (R-47).

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

