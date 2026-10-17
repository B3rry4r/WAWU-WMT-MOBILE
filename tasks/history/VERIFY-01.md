# VERIFY-01 · round history

Moved out of [tasks/VERIFY-01.md](../VERIFY-01.md) word for word, oldest first. The current state is in that file.

## Builder report

Files: new `src/features/verify/` (api, model, bonusStep, parts, BonusScreen, ShopScreen, DraftFormScreen, 4 test files), routes `src/app/verify-bonus.tsx`, `shop.tsx`, `shop-product.tsx`; edits `src/features/me/ContentGrid.tsx`, `MeScreen.tsx`, `src/app/(tabs)/me.tsx` (the draft tile entry) and `src/features/create/CreateScreen.tsx`, `src/app/create.tsx` (the draft row); SHARED-CHANGES, BACKEND_GAPS, LOG.
Checks: VF1 reads `GET /plans` (test: rows from the preselected tier only, a tier with no points or Voice Intro draws no row, a failed read keeps the button); VF2 lists, empties and errors (tests); form saves with only a title, sends only changed fields, deletes after one confirmation, shows the Hub's refusal (tests); entries (tests). `tsc` clean, eslint clean on every changed file.
Not done: pictures, the A4 hand-on (fenced, rows filed), the Voice Intro entries (R-47).

## Builder report, round 2

Files: `src/features/auth/signupFlow.ts` (`confirmSignupCode` calls `markBonusPending` beside `markOfferPending`), `src/app/_layout.tsx` (`useBonusStep`; a `Stack.Protected` group for `verify-bonus` after the access-code step; `(tabs)`, `shop`, `shop-product` and the push bridge wait for it), a comment in `src/app/verify-bonus.tsx`, new `src/features/verify/__tests__/bonusStepRoute.test.tsx`; `SHARED-CHANGES.md` rows VERIFY-01 #1 and #2 marked applied (commit `aca6fda4`); one line in `tasks/VERIFY-04.md`'s scope for the category ruling.
Checks: the new test walks sign-up's code step (`confirmSignupCode`) to the access-code step, then VF1, "Build my shop" to the shop, and shows VF1 does not return on the next start or after closing the app on it; signed-out visits to `/shop`, `/shop-product` and `/verify-bonus` land on the signed-out screens. The auth, claim and verify suites pass (19 suites, 311 tests). The full mobile check is in the hand-back.
Not done: pictures and the browser V7 walk (verifier).

## Builder report, round 3

Files: `src/features/verify/bonusGate.ts` and `BonusGate.tsx` (new), `src/app/verify-bonus.tsx`, `parts.tsx`, `ShopScreen.tsx`, `BonusScreen.tsx`, `DraftFormScreen.tsx`, the two route and screen tests. `tasks/VERIFY-01.md` gains `depends_on` AUTH-06.
Findings: 1 (high) VF1 waits while the Hub's account type is unknown (null) and asks again with a bounded backoff, then offers Try again; 2 a failed profile read shows the error with Try again and never finishes the once-only step; 3 sizes on the existing type tokens (no SHARED-CHANGES row needed); 4, 5, 6 fixed; 7 left for the sweep (lead).
Checks: see the hand-back; pictures beside the boards in the builder's scratch folder `verify01-b3/pics/`.

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

