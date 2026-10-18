---
id: INBOX-23
title: Community messages by kind: the composer, the header and sending a photo
owner: YOU
area: INBOX
order: 283
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: verifying
depends_on: [INBOX-22, INBOX-13, INBOX-05]
decisions: [R-62, R-5, R-69]
passes: [V1, V4, V5, V6, V7, V8, V9]
artboards: [I38]
---
# INBOX-23 · Community messages by kind: the composer, the header and sending a photo

## Current state

As of 18 Oct 2026, merging (lead): verified (PASS for the app) and stacked in batch 19.
- **Status:** merging (lead). The verifier said PASS for the mobile task, no defect of medium or higher in the app (report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/INBOX-23.md`: the Hub's prices drive every figure, text and emoji are free, one message and one debit on a double tap, a lost answer and a dropped request, the photo uploads once, the Hub's count equals the ledger after every step). Mobile `wmt/INBOX-23` `90245d20` (from `origin/wmt/MERGE-16` `5ee3994d`). No backend change. Stacked in batch 19 by MERGE-19 (mobile `wmt/MERGE-19`); not on main.
- **Merge (MERGE-19):** no code conflict (BACKEND_GAPS.md and SHARED-CHANGES.md are unions; `RoomScreen.test.tsx` merged by itself on top of MERGE-18's fixture patch). The contract copy, which the builder made from a local merge, is replaced by the contract of backend `wmt/MERGE-19` `c56a576` and `npm run api` was run (no diff to the generated types beyond SWEEP-IEA's two description strings); `contract/SOURCE_COMMIT` names `c56a576`. SHARED-CHANGES INBOX-23 #1 says so. The verifier's lows are SWEEP-INBOX rows INBOX-23 F1 (medium, backend, taken by FIX-77), F2, F3 and F4 (open).
- **Built:** I24's strip line "Chat free · photos, video, voice use credits" and I25 to I26 (a "+" beside the field, text free: an arrow button, no price anywhere) from the Hub's `creditsByKind`; I38 (the photo card "Photo · Photos 1 credit · video and voice notes 3", "Send · 1" with the coin, X to remove); a sent photo shows in the thread; I27 reads the board's words from the same costs and shows at 0 credits.
- **Upload path:** presign (`community/message`), PUT, confirm, then the send with `imageUrl`; the address is kept so a retry sends the same photo under the same Idempotency-Key and never uploads twice. A refused photo (402) shows the Hub's sentence with Buy credits, Send again, Remove.
- **Decisions taken:** the host sees no cost line and no figure (the Hub makes every kind free in their room); the "+" is not drawn until the Hub's prices are read (R-47); with 0 credits and a priced photo the "+" opens Buy credits instead of the library; the credits instrument stays "WAWU Credits" (R-37, DV2-COPY) where the board prints "Who Made This? Credits".
- **Touched outside the room:** `OutOfCreditsPanel` takes an optional `line` (INBOX-13's panel; its old words are the default); `outOfCredits.test.tsx` and `CommunitiesView.test.tsx` assertions that pinned the pre-R-62 words ("Buy credits to send messages here", "1 credit per message you send") now pin the board's, because R-62 made the old ones untrue.
- **Open:** G-INBOX-23-1 (video and voice composers: no board), -2 (I28's by-kind line, INBOX-13's sheet), -3 (a sent photo's bubble: no board); SHARED-CHANGES INBOX-23 #1 (contract copy, replaced at MERGE-19 by the merged backend's). Passes: V1, V4, V5, V6, V7, V8, V9.
- **Stack (name `inb23`, ports 7840 to 7845, storage stand-in 7846, taken down after):** text with 0 credits sends and nothing moves; a photo with 48 credits sends, the count 48 to 47 (the Hub's photo price 1), Hub count = db balance = 48 minus the ledger after each step; with 0 credits the photo is blocked and Buy credits opens (a person with no wallet is then led to Open your wallet, INBOX-13); a double tap sends one message and moves one credit; a lost answer leaves one message and one debit, and the same key again (201) stores and charges nothing more; a stale balance gets the Hub's 402 sentence and nothing is stored.
- **Checks:** tsc EXIT 0; eslint on 13 changed files EXIT 0; jest `src/features/communities` and `src/features/credits` 7 suites, 179 tests EXIT 0 (78 in RoomScreen, 16 of them new or rewritten); gates EXIT 0 (baseline 0, 56 unit tests). Pictures at 390 px, light and dark, board then built: `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/inbox-23-b/side/` (I24, I25, I26, I38, I27).
- **Not run:** V10 (no phone); a real provider or bucket (never).
- **Next:** the batch 19 pull request (the lead). FIX-77 (backend `84d56ff`, mobile `a92f29e9`, ready for batch 20) closes INBOX-23 F1 and F2.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- `design/CLAUDE.md` and `docs/designer/BRIEF.md` (R-29: where the brief changes a board, build the brief's version); the rulings below outrank both where they differ
- Render each board with `python3 scripts/design/render_design.py <IDs>` and compare picture with picture, light and dark (V5). Board ids come from this file and `design/canvas-inventory.json`, never from a code comment.
- `DECISIONS.md`: R-62, R-5, R-69 (ruled; build what they say). Rulings outrank the boards, the brief and any older task text.
- `tasks/DESIGN-V2-CUT.md` (the list this task was cut in)

## Goal

Text and emoji in a community are free and say so; a photo costs 1 credit and shows the cost on the send button (I38); video and voice notes show their cost of 3. Reworks INBOX-05's I24 to I26 (done) to the 16 Oct boards.

## Scope

- Edits INBOX-05's community room (`src/features/communities/`). I24 header: chat is free, photos, video and voice use credits. I25 composer: placeholder "Message", hint "Type a message · free", no 1-credit button. I26 "Sending text": free, no cost on the button, "Attach a photo". I38: with a photo chosen the button reads "Send · 1" and the line reads the Hub's costs.
- Costs come from `GET /communities/message-cost` (INBOX-22). Photo send uses `imageUrl` through presign and confirm. Video and voice note sending in the app is not drawn by any board (G-807): this task shows their cost line only and builds their composer when a board draws it.
- INBOX-13 (todo) prints the same costs on I27 and I28; this task does not touch those two screens.

## Capability checks

- [ ] A person with 0 credits can still send text and emoji in a community.
- [ ] A person attaches a photo, sees "Send · 1", sends it, and their credit count drops by 1; with 0 credits the photo is blocked and Buy credits opens I28.
- [ ] I24 to I26 now read as the 16 Oct boards in light and dark (V5).
- [ ] Each board above (I38) matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the Hub or the user, never a literal; anything the Hub does not serve yet is in `BACKEND_GAPS.md` and its part of the screen is not drawn (R-47).
- [ ] Loading, empty and error states exist and are entered by their real cause (V6), as are the drawn states of these boards.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/INBOX-23.md](history/INBOX-23.md).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
