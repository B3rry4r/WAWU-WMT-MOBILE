# INBOX-10 · round history

Moved out of [tasks/INBOX-10.md](../INBOX-10.md) word for word, oldest first. The current state is in that file.

## Builder report

Files: `src/features/paid-ask/` (api, model, useAsk, AskSheets, PaidThreadScreen, PaidFanRow, parts, routes, tests), `src/app/paid-thread/[wawuId].tsx`, `src/app/profile/[wawuId].tsx`, `src/features/visitor/` (Message and Messages off), `src/features/inbox/rows.tsx`, `src/features/chat/Bubbles.tsx` (one prop); backend `PaidQuestionDraftView.usualReplyMinutes` and its spec. Checks and the stack run are in Current state; the ask, the pay and the retry are tested in `askFlow.test.tsx` against the Hub's shapes and on the real stack. Not done: Message on P2, H10 and M35; the "+" and "..." (R-47).

Round 2 (18 Oct 2026, F1 to F5): `src/features/paid-ask/{model,useAsk,PaidThreadScreen}`, `visitor/VisitorProfileScreen`, `src/app/profile/[wawuId].tsx`, their tests; backend `src/money/holds/hold-view.service.ts` (+ two comments) and a case in `paid-dm-wallet.contract.spec.ts`. Details in Current state.

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

