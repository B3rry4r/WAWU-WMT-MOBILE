# SUPPORT-01 · round history

Moved out of [tasks/SUPPORT-01.md](../SUPPORT-01.md) word for word, oldest first. The current state is in that file.

## Builder report

- **Backend files:** `src/support/` (account, service, controller, module, dto, view types, `tests/support.contract.spec.ts`), `src/admin/support/` (controller, module), `src/chat/chat.service.ts` (`ensureConversation`, `people()` names the support side, money refused in a support chat, `writeMessage` takes a `clientMessageId`), `src/inbox/inbox.service.ts` (the support side's row), `chat-view.type.ts` and `inbox-view.type.ts` (optional `support`), `src/app.module.ts`, `contract/openapi.json`.
- **App files:** `src/features/support/` (api, `useOpenSupport`), `UnlockSheets.tsx` (H18), `wallet/history/DetailScreen.tsx` (W27), `wallet/settings/WalletSettingsScreen.tsx` (W35), `chat/ChatScreen.tsx`, `ChatComposer.tsx`, `ChatInboxRow.tsx`, contract and generated types.
- **Staff reply route:** the dashboard had no support tools, so `POST /admin/support/threads/{chatId}/messages` (list: `GET /admin/support/threads`, read: `GET .../messages`).
- **H18, W27, W35 open the chat with the reference attached:** jest per entry (unlockFlow, historyScreens, WalletSettingsScreen: right POST body, lands on `/chat/<id>`, a tap while it is on its way asks nothing more, a refusal shows the Hub's words) and on the stack (Hub on the Nuvion stand-in, `support01_test`, 7760-7767): payment reference, transaction reference and none all open the same chat; the same reference again returns the same message.
- **Another user cannot read it:** on the stack and in the contract spec, someone else's payment, someone else's transaction and an id that does not exist are the same 404 and write nothing (no thread is made for the asker); another person reading the chat gets 404.
- **Staff reply reaches the chat and I1:** contract spec: reply lands with `mine` false, the inbox row is kind `chat` with `other.support`, unread 1; a repeated `clientMessageId` posts once; reviewer and finance get 403.
- **Checks:** backend `tsc` EXIT 0, eslint EXIT 0 on changed files, `support.contract.spec.ts` 15 of 15 on the stack database, `contract:build` EXIT 0, gates 0 fail (127 warn, 88 accepted, as before), `check_baseline.py` EXIT 0. Mobile: jest for historyScreens, unlockFlow, WalletSettingsScreen, chat and inbox (all pass), eslint EXIT 0 on changed files, `tsc` has one error that is not mine (`react-native-view-shot` is missing from the shared node_modules, `src/features/referral/cardPicture.ts`). In the chat and inbox specs five tests fail on the base branch too (the mock WAWU ID returns no names here).
- **Gate counts:** backend gates before and after 0 fail, 127 warn, 88 accepted. The mobile full check runs once per batch (the merge agent).
- **Decisions the builder took:** the first message is written as the person (it is theirs), once per reference through the chat's own `clientMessageId`; W35 attaches nothing; the support account is a fixed id with no WAWU ID; no promise about money is made anywhere (the line states the payment's facts only, BRIEF rule 6).

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

