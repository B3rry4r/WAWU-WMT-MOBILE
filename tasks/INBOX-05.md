---
id: INBOX-05
title: Communities: list, room, sending
owner: DEV3
area: INBOX
day: 3
repo: wawu-wmt-mobile
type: mobile-screen
status: queued
blocked_by: ""
depends_on: [INBOX-01]
decisions: []
passes: [V1, V4, V5, V6, V7, V9]
artboards: [I24, I25, I26]
---
# INBOX-05 · Communities: list, room, sending

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV3.md` (what you own)
- The design: `python3 scripts/design/render_design.py I24 I25 I26` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A5.json`

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API. Scheduled for Day 3.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

## Artboards

| id | screen | what it shows |
|----|--------|---------------|
| I24 | Communities | Communities chip inside Inbox: "48 WAWU Credits · Reading is free · 1 credit per message you send · Buy", Your communities with last-message previews, Suggested with member count, open Join / private Ask. |
| I25 | Community | Room view for an open community with member count, credit balance in header, Host tag on the host's message, and composer "Message · 1 credit". |
| I26 | Sending | Composer with text and send button "Send · 1" showing the credit cost. |

## Capability checks

- [ ] **I24**: a user can Buy credits; open a room; Join (open); Ask (private).
- [ ] **I25**: a user can read messages; type a message.
- [ ] **I26**: a user can Send · 1.
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6).

## What the backend serves today (from the analysis)

| artboard | backend | what is missing |
|----------|---------|-----------------|
| I24 | partial | No "my communities" query (web comment: joined tab only reflects joins made this session); no last-message preview or unread per room; no suggestion/ranking logic; no ?host= filter. |
| I25 | served | Served for request/response. No incremental fetch (no since/cursor param) and no live delivery: No real-time transport exists: grep of wawu-backend/src and package.json for WebSocketGateway|@SubscribeMessage|socket.io|@Sse|text/event-stream returned nothing; only @nestjs/schedule cron jobs run server-side. Web fetches once on mount (no setInterval/EventSource/WebSocket in src/lib or src/components messaging code). |
| I26 | served | served |

A missing or partial row is yours to fix in the backend as part of this task (or the backend task listed in depends_on, which is also yours unless it says otherwise). Never change the screen to fit the API.

## Figures on these artboards are not facts

Do not hard-code any of these. Show what the API returns, or leave the figure out and file it.

- I24: 48 WAWU Credits
- I24: 1 credit per message
- I24: Afrobeats producers 2.1K members
- I24: Founders under 30 640 members
- I25: 1,204 members
- I25: 48 credits
- I25: Message · 1 credit
- I26: Send · 1

## Designer notes (⚠, unresolved)

- None.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
