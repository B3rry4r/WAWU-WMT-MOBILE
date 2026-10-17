# LEGAL-04 · round history

Moved out of [tasks/LEGAL-04.md](../LEGAL-04.md) word for word, oldest first. The current state is in that file.

## Builder report

Files: `src/features/legal/{book,pay,matter}/`, `ui.tsx`, `look2.ts`, `cards.tsx`, `testing/legalHub.ts`, `LegalChatScreen.tsx` (S17's card), routes `legal-book.tsx`, `legal-matter.tsx`; tests `LegalPayments.test.tsx` (26), `legalModels.test.ts` (15); one assertion in `LegalChatScreen.test.tsx` changed on purpose (it said the Book card is absent until LEGAL-04; it now says it is there).
Checks (worktree `/home/user/wt/b-s4-m`, `npm ci`): `tsc --noEmit` EXIT 0; eslint on `src/features/legal` and the three routes EXIT 0; `jest src/features/legal` 6 suites, 112 passed, 0 failed (before: 4 suites, 71); `npm run gates` EXIT 0, 0 fail, 12 warn (before 9 warn; the 3 new are PROVISIONAL markers: LEGAL-FEE-POLL, LEGAL-MATTER-POLL, LEGAL-FIXED-MATTERS); `check_baseline` clean.
Capability checks: S18 pick medium, day, time, Pay (test 1 and 2, live pictures); S19 sees price + bank charge = total and taps Pay with the PIN (tests 3, 4; live debit equals the quote total); S20 Add to calendar (test, `createEventInCalendarAsync` called); S25 Request in person (test; live picture with the Hub's calendar emptied by a stub); no wallet lands in Open your wallet (test).
Attacks: see Current state; each ran as a test and once on the stack.
Gaps filed: G-LEGAL-04-1 (no email), G-LEGAL-04-2 (consultant read). Shared change: LEGAL-04 #1. Not done: the S19 header icon tile and the board's "Pay ₦X" (shared sheet); V10.

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

