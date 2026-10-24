# DV2-RM · round history

Moved out of [tasks/DV2-RM.md](../DV2-RM.md) word for word, oldest first. The current state is in that file.

## Builder report

- **Files:** `src/features/home/` `Services.tsx`, `MoneyCard.tsx`, `TodayScreen.tsx`, `TodayLoading.tsx`, `model.ts` (`showsTgif` removed, `todayPhase` takes balance and creators), `look.ts`, `api.ts`, `TgifCard.tsx` (comments only); `MeScreen.tsx` (comment only). Tests: `home/__tests__/HomeScreen.test.tsx` and `model.test.ts`, `ads/__tests__/TodaySponsored.test.tsx`, `bills/__tests__/billsFlow.test.tsx`, `send/__tests__/model.test.tsx`.
- **Tests removed or changed, each by a ruling, none weakened** (SHARED-CHANGES DV2-RM #5): Today TGIF card, "TGIF off" and "TGIF cannot be read" cases removed and one case added (R-59: no card, no TGIF read); Bills action, Events tile and Pay bills cases replaced by absence checks (R-52, R-61); services row now two tiles; `showsTgif` cases removed; ad tests no longer have a TGIF card beside the ad (R-59); the Home-to-Pay-a-bill walk now asserts no entry (R-52); the Send-before-Bills order is now "no Bills".
- **Checks:** typecheck EXIT 0; eslint on the 14 changed files EXIT 0; jest home, explore, wallet, settings, tgif, ads, bills, me, send, push and the two tgif root tests: 68 suites, 1196 tests, EXIT 0; `npm run gates` before 10 run, 880 files, 0 fail, 9 warn, after the same (log lines below).
- **A search of `src/`** finds no push to `/bills` and no `Pay bills` or `today-action-bills` outside the bills feature and tests that assert absence.
- **Gaps and shared-change requests:** none filed (no new data or fenced file); SHARED-CHANGES DV2-RM #1 to #4 closed, #5 records the tests.
- **Not run:** the V7 walk on a real Hub (no stack, by the brief); the pictures use fixtures.

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

