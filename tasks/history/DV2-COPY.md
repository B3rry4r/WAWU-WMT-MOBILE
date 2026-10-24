# DV2-COPY · round history

Moved out of [tasks/DV2-COPY.md](../DV2-COPY.md) word for word, oldest first. The current state is in that file.

## Builder report

- **Strings changed (31):** the app's name with its question mark 10 (profile share text, "On Who Made This? since", account type heading, send "On Who Made This?", the credential line twice, wallet and send receipt first line, Showcase placeholder, push channel name); fee label "Bank charge" 7 (history `FEE_LABELS.provider`, which the send screens and receipts read, Showcase 2, preview pay sheet 4); legal header "Who Made This? Legal" 5 (assistant, waiting, consultant sub-line twice, the empty chat); plus 9 doc comments.
- **Files:** `src/lib/appName.ts` (new); `me/model.ts`, `AccountTypeScreen.tsx`, `professionals/model.ts`, `legal/model.ts` and `LegalChatScreen.tsx`, `push/registration.ts`, `send/RecipientScreen.tsx`, `send/model.ts`, `wallet/history/model.ts`, `showcase/Showcase.tsx`, `app/preview/pay-sheet.tsx`, pay-sheet comments, `SHARED-CHANGES.md` (#1 applied, #2 filed).
- **Tests following the new copy (16 files):** pay-sheet `money` and `PaySheet`; `historyModel`, `historyScreens`, `walletHomeModel` (title); send `model`, `sendFlow`; professionals `model`, `screens`, `routes`; legal `model`, `LegalChatScreen`; me `model`, `MeScreen`; explore `screens`; push `pushFlow`. Only the quoted words changed; no assertion added, removed or loosened.
- **Capability checks:** (1) name search: the only "Who Made This" without the question mark left in shipped strings is `BrandMark` `APP_NAME` and `app.json` (SHARED-CHANGES #2); no "WAWU" names the app. (2) pay sheet, receipt and history detail print "Bank charge" (specs above). (3) no licence or CBN line, no ElevenLabs, Instagram card or sample advertiser in a screen. (4) tests pass.
- **Checks:** typecheck EXIT 0; eslint on 15 changed files plus the new one EXIT 0 (one warning, old, `professionals/__tests__/screens.test.tsx:17`); `jest --findRelatedTests` on the changed sources: 88 suites, 1778 tests, EXIT 0; `npm run gates` EXIT 0 (0 fail, 9 warn, 0 accepted; baseline entries 0; the warns are the existing PROVISIONAL lines).
- **No gaps filed.**

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

