---
id: INBOX-22
title: Community credits by kind of message (backend)
owner: YOU
area: INBOX
order: 258
priority: launch
repo: wawu-backend
type: money-path
status: todo
depends_on: [INBOX-16, INBOX-05, WALLET-17]
decisions: [R-62, R-5]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# INBOX-22 · Community credits by kind of message (backend)

## Current state

As of 16 Oct 2026, cut by DESIGN-V2-CUT from the owner's 16 Oct 2026 designs and answers.
- **Status:** todo. No branch, no code, nothing merged, no findings.
- **Size:** L. **Wave:** 2 (see `tasks/DESIGN-V2-CUT.md`).
- **Next:** a builder starts from the brief below after these are done (or in review): INBOX-16, WALLET-17.
- **History:** none yet. Reports go to tasks/history/INBOX-22.md.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands (its additive-only and protected-route rules apply).
- `DECISIONS.md`: R-62, R-5 (ruled; build what they say). Rulings outrank the boards, the brief and any older task text.
- `tasks/DESIGN-V2-CUT.md` (the list this task was cut in)

## Goal

Sending in a community costs credits by kind: text and emoji free, a photo 1 credit, a video or voice note 3 (R-62). Credits stay a count, never naira. Costs are admin settings.

## Scope

- `POST /communities/{id}/messages` charges by kind from settings (`community_credit_cost_photo` 1, `_video` 3, `_voice` 3; text 0). A free message writes no credit row. Hosts still receive 85% of credits spent in their room (WALLET-17).
- The send route accepts a video and a voice note attachment (additive nullable fields beside `imageUrl`), uploaded through the existing presign and confirm path (`POST /uploads/presign`, `/uploads/confirm`).
- `GET /communities/message-cost` keeps `creditsPerMessage` for the web and adds the per-kind costs.
- This changes what the web is charged for text in a community: a deliberate protected-route change (R-62), SHARED-CHANGES row INBOX-22 #1; it needs the owner's `relock-approved` label before merge. Add, then move: the web keeps working until the label is on.
- A refused or failed send charges nothing and a repeated request charges once (V8).

## Capability checks

- [ ] A text or emoji message costs 0 credits and works with a balance of 0.
- [ ] A photo costs 1 credit and a video or voice note 3, once, even when the request is sent twice.
- [ ] With 2 credits, a video is refused with the shortfall in plain words and nothing is taken; a photo still works.
- [ ] A host's 85% share is computed on credits actually spent; free messages add nothing.
- [ ] V3: the protected route suite is run before and after and the one expected difference is named.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
