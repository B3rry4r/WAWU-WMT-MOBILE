---
id: INBOX-04
title: Inbox: the list, empty, loading
owner: DEV2
area: INBOX
order: 55
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: todo
depends_on: [INBOX-07, INBOX-02, UI-02, UI-03]
decisions: [R-37]
passes: [V1, V4, V5, V6, V9]
artboards: [I1, I35, I36]
---
# INBOX-04 · Inbox: the list, empty, loading

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV2.md` (what you own)
- The design: `python3 scripts/design/render_design.py I1 I35 I36` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A5.json`
- `docs/designer/BRIEF.md` (the brief is part of the design, R-29; it has no entry for I1, I35, I36, so those artboards stand, under its rules 3 to 8 on fees, refunds, licence lines and em-dashes)

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

This task builds I1's frame and chips, the empty (I35) and loading (I36) states, the app's live connection
(`src/features/inbox/live.ts`, reused by every chat screen) and the Inbox tab's unread badge (BACKEND_GAPS G-4).
I1 is also UI-02's showcase artboard: reuse UI-02's list, never rebuild it. Each kind of row (chat, paid DM,
community, money request), each chip's view, the Money filter (I20, INBOX-20), compose and the paid-message settings
button are added, as drawn, by the task that builds where they lead (docs/WORKFLOW.md section 7).

## Artboards

- **I1 · Inbox · All**: One list mixing P2P chats, paid DMs with countdown, community rooms, money requests and a WAWU system thread, with filter chips All / Paid DMs / Communities / Money. Tab bar is Home · Explore · Inbox · Wallet · Me, with an unread badge on Inbox.
- **I35 · Inbox · empty**: Empty inbox with "No messages yet", guidance to message a creator from their profile or join a community, and a Browse communities button.
- **I36 · Inbox · loading**: Skeleton list under the chips while the inbox loads.

## Added by later tasks

These entries are drawn on this task's artboards but lead to screens built by later tasks, so this task does
not build them. Each is added, exactly as drawn, by the task that builds where it leads (docs/WORKFLOW.md
section 7, R-27). The verifier reports their checks as belonging to that task.

- I1: a chat row and compose (opens I12): added by INBOX-19
- I1: a paid DM row (fan) (opens I4): added by INBOX-10
- I1: a paid DM row (creator) and the Paid DMs chip (opens I9): added by INBOX-18
- I1: a community row, the Communities chip and Browse communities (I35) (opens I24): added by INBOX-05
- I1: a money-request row and the Money chip (opens I20): added by INBOX-20
- I1: paid-message settings (creator) (opens I21): added by INBOX-12
- I1: new community (opens I32): added by INBOX-14

## Capability checks

- [ ] **I1**: a user sees the inbox list with its chips and the unread badge on the Inbox tab (G-4), and a new message appears without a refresh.
- [ ] **I35**: a user with no messages sees "No messages yet" and the guidance.
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6), as are the drawn states I35, I36.

## What the backend serves today (from the analysis)

- **I1**: partial. Missing: No unified inbox/feed endpoint; no free user-to-user chat model (models searched: only DirectMessage, CommunityMessage, LegalChatMessage); no money-in-chat events; no unread/last-read state on DirectMessage or CommunityMessage; no "my communities" list; no per-thread last-message preview for communities. No real-time transport exists: grep of wawu-backend/src and package.json for WebSocketGateway|@SubscribeMessage|socket.io|@Sse|text/event-stream returned nothing; only @nestjs/schedule cron jobs run server-side. Web fetches once on mount (no setInterval/EventSource/WebSocket in src/lib or src/components messaging code).
- **I35**: partial. Missing: Empty state needs the same unified feed I1 lacks; an empty response from the existing per-module endpoints is available today.
- **I36**: n/a.

A missing or partial row is yours to fix in the backend as part of this task (or the backend task listed in depends_on, check its owner in the task file). Never change the screen to fit the API.

## Figures on these artboards are not facts

Do not hard-code any of these. Show what the API returns, or leave the figure out and file it.

- I1: Amaka Nwosu "Sent you ₦5,000"
- I1: Chidi Eze "Paid DM · 18h left to reply"
- I1: Kemi Okafor "Requested ₦12,000 · Logo edits"
- I1: WAWU "Your card has shipped"

## Designer notes (⚠, unresolved)

- None.

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
