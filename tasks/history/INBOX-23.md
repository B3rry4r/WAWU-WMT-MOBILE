# INBOX-23 · round history

Moved out of [tasks/INBOX-23.md](../INBOX-23.md) word for word, oldest first. The current state is in that file.

## Builder report

Files: `src/features/communities/` (`Composer.tsx` rebuilt, `RoomScreen.tsx`, `useRoomMessages.ts`, `MessagePost.tsx`, `api.ts`, `format.ts`, `CreditsStrip.tsx`, `CommunitiesView.tsx`), `src/features/credits/OutOfCreditsPanel.tsx` (optional `line`), the contract copy (SHARED-CHANGES INBOX-23 #1), tests in `communities/__tests__` (RoomScreen, CommunitiesView, format) and `credits/__tests__/outOfCredits.test.tsx`.
Checks: see Current state. Stack walk and pictures: scratchpad `inbox-23-b/` (`walk1.log`, `walk2.log`, `walk3.log`, `side/`).
Gaps: G-INBOX-23-1 to -3. Differs for a recorded reason: "WAWU Credits" stays where the board prints "Who Made This? Credits" (R-37, DV2-COPY). The Hub's `creditsByKind` has `text`, `photo`, `video`, `voice` (no `emoji` key): emoji is text, free.

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

