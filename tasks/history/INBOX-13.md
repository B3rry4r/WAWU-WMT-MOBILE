# INBOX-13 · round history

Moved out of [tasks/INBOX-13.md](../INBOX-13.md) word for word, oldest first. The current state is in that file.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

- Files: `src/features/credits/` (`api.ts`, `model.ts`, `useBuyCredits.ts`, `BuyCreditsSheet.tsx`, `BuyCreditsEntry.tsx`, `OutOfCreditsPanel.tsx`), `src/features/money-attempt/` (`refusal.ts`, `attempts.ts`, `fees.ts`, `WalletRow.tsx`, shared with INBOX-19 and INBOX-20), edits to `RoomScreen.tsx`, `CommunitiesView.tsx`, `CreditsStrip.tsx`, the contract copy (SHARED-CHANGES INBOX-13 #1).
- Tests: `credits/__tests__/buyCredits.test.tsx` (13), `outOfCredits.test.tsx` (5); the communities, inbox and chat suites 1041 tests green with `src/__tests__`; `npx tsc --noEmit` EXIT 0; eslint on changed files EXIT 0; `npm run gates` EXIT 0, 0 fail, 9 warn (before: 0 fail).
- Pictures at 390 px light and dark beside the boards: I24, I27, I28 (and its PIN), I29 in `s2-b/pics/`. Not photographed: the shared pay sheet's not enough, confirming and failed states for credits (tests only).
- Not done: V10; the board's per-kind costs and "Text and emoji stay free" (G-881).

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

