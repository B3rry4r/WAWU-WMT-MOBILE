# INBOX-19 · round history

Moved out of [tasks/INBOX-19.md](../INBOX-19.md) word for word, oldest first. The current state is in that file.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

- Files: `src/features/chat/` (`api.ts`, `useChatThread.ts`, `ChatScreen.tsx`, `ChatComposer.tsx`, `AttachSheet.tsx`, `Bubbles.tsx`, `ChatSendScreen.tsx`, `sends.ts`, `thread.ts`, `ChatInboxRow.tsx`), `src/app/chat/[id].tsx` and `send.tsx`, `inbox/rows.tsx` (chat renderer).
- Tests: `chat/__tests__/chatThread.test.tsx` (21, shared with INBOX-20), `chatSend.test.tsx` (13), `inboxChat.test.tsx` (11); with the other suites 1041 green; tsc, eslint, gates all EXIT 0.
- Pictures at 390 px light and dark beside the boards: I12, I13, I14 (and its PIN), I15 in `s2-b/pics/`. Not photographed: sending, not delivered, a failed text bubble, the empty, loading, error and closed chat (tests only).
- Not done: Photo or video, File, "..." and compose (G-882); V10.

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

