# INBOX-20 · round history

Moved out of [tasks/INBOX-20.md](../INBOX-20.md) word for word, oldest first. The current state is in that file.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

- Files: `src/features/chat/` (`requestApi.ts`, `useRequestPay.ts`, `RequestPaySheet.tsx`, `RequestSheet.tsx`, `Bubbles.tsx`'s `RequestBubble`, `ChatInboxRow.tsx`'s `MoneyRequestInboxRow` and `requestLine`), `inbox/rows.tsx` and `chips.ts` (the Money chip), `InboxScreen.tsx` (a request is a row only under Money), the contract copy (SHARED-CHANGES INBOX-13 #1).
- Tests: `chatThread.test.tsx` (the request and pay cases), `inboxChat.test.tsx` (the Money chip, `requestLine`); with the other suites 1041 green; tsc, eslint, gates EXIT 0.
- Pictures at 390 px light and dark beside the boards: I16, I17, I18 (review, PIN, not enough), I19 (paid, declined, cancelled), I1, I20 in `s2-b/pics/`. Not photographed: "Payment on its way", a failed payment (tests only).
- Not done: V10; the other moments I20 draws (G-827).

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

