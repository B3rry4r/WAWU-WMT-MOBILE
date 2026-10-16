---
id: INBOX-23
title: Community messages by kind: the composer, the header and sending a photo
owner: YOU
area: INBOX
order: 283
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: todo
depends_on: [INBOX-22, INBOX-13, INBOX-05]
decisions: [R-62, R-5, R-69]
passes: [V1, V4, V5, V6, V7, V8, V9]
artboards: [I38]
---
# INBOX-23 · Community messages by kind: the composer, the header and sending a photo

## Current state

As of 16 Oct 2026, cut by DESIGN-V2-CUT from the owner's 16 Oct 2026 designs and answers.
- **Status:** todo. No branch, no code, nothing merged, no findings.
- **Size:** M. **Wave:** 3 (see `tasks/DESIGN-V2-CUT.md`).
- **Next:** a builder starts from the brief below after these are done (or in review): INBOX-22, INBOX-13.
- **History:** none yet. Reports go to tasks/history/INBOX-23.md.

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

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
