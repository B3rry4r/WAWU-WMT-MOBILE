---
id: INBOX-04
title: Inbox: the list, empty, loading
owner: DEV2
area: INBOX
order: 57
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: verifying
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

Builder, 7 Oct 2026, `wmt/INBOX-04` from main d36ae51 (backend main 0e7b617; contract already had /inbox, /inbox/unread, /live/catch-up). No backend change, no `_layout.tsx` edit, no SHARED-CHANGES row (the tab layout already calls `useInboxUnread()`; `src/api` untouched).
- **Files:** new `src/features/inbox/` `live.ts` (socket client, backoff, close codes, catch-up, event bus), `api.ts`, `useInbox.ts`, `InboxScreen.tsx`, `InboxSkeleton.tsx`, `chips.ts`, `rows.tsx`, 3 test files (43 tests); changed `unread.ts` (now also keeps the socket and count live), `src/app/(tabs)/inbox.tsx`, `BACKEND_GAPS.md` (G-4 marked built), `docs/LOG.md`. No gaps filed: G-185, G-186 and G-23 already cover what the live feed and push do not.
- **I1** frame: title, chip row (All only), cursor-paged list (opaque cursor sent back as given, exact server order, a row seen twice kept once), pull to refresh, refetch on return to the tab. **What it renders for a row kind it does not own: nothing.** Rows, the Paid DMs, Communities and Money chips, the two header buttons and the + button are added by INBOX-19, 10, 18, 5, 20, 12, 14 (section 7); `rows.tsx` is where each adds its renderer. So a user with chats sees the title, chips and a blank list, while the badge and total are right; there is no empty state then (the list is not empty) and no paging ahead (nothing is drawn). Tested with a labelled stand-in row renderer.
- **I35** empty: real cause is `GET /inbox` returning no rows (fresh account on the real backend). "Browse communities" is INBOX-05's, so the button is not drawn. **I36** loading: real request in flight (proxy holds `/inbox` 8 s). **Error**: a 500 shows the server's sentence, a cut network shows "No connection...", both with Try again that really refetches (captured on the real backend through a local proxy; also a failed next page keeps the rows and offers its own retry).
- **Live** (`live.ts`): first-frame `auth` (never the URL); waits are exponential with full jitter, floor 0.5 s, cap 30 s, reset only after 10 s stable (so 429 and 503 upgrades never loop tight); 1001/4408/4503/1006 reconnect, 4401 refreshes the session only when the token is near expiry (or on the second 4401) then reconnects, 4403 signs out, 4409 stops until the next foreground; app ping every 25 s with a 10 s answer window; background closes the socket, foreground reconnects and catches up; catch-up from the held cursor until `hasMore` is false, repeats dropped by message id, a refused cursor (400) restarts from now. Decision (agent, owner may override): a live event never patches a row or the count; it marks the inbox stale and the server's answer replaces it (events carry no unread counts), coalesced over 300 ms.
- **Badge (G-4):** `useInboxUnread()` (called by the tab layout, which mounts at sign-in) holds the socket and reads `GET /inbox/unread`; hidden at 0 (the bar's own rule, "99+" cap is the bar's), zero and socket closed on sign-out, no socket or request while signed out. While backgrounded the badge is as fresh as the last read.
- **Tests:** `live.test.ts` (25, fake WebSocket = transport test double only), `unread.test.tsx` (6, real client and session, fake socket), `InboxScreen.test.tsx` (12, mocked fetch). Real run (V9) on a local Hub 4701 + WAWU ID 4702 + Postgres 5472, real login through the app's sign-in: server unread 1 shown as 1; a message sent by another real user raised it in 1.3 to 1.5 s; socket killed and network cut for 8 s with two messages sent: 4 reconnects with growing waits, catch-up on return, badge matched the server (+2) after 4 to 7 s. Light and dark.
- **Gates:** `npm run check` exit 0. Before (main d36ae51): gates 216 files, 0 findings; 46 suites, 797 tests (measured on main; its worker-exit warning is there too). After: gates 226 files, 0 findings; 49 suites, 840 tests; lint clean; tasks 208.
- **Evidence:** `build/inbox04/` (not committed): `I35-empty-*`, `I36-loading-*`, `error-500-*`, `error-cut-*`, `recovered-*`, `I1-all-*`, `I1-badge-live-*`, `home-badge-*`, `compare-I35-*` and `compare-I36-*` (artboard beside the screen). Known differences from the artboards, all other tasks' or the device's: status bar, header buttons, the other chips, the + button, the header row height the buttons set.
- **Not done / NOT RUN:** SDK 57 docs could not be fetched (docs.expo.dev blocked by the egress proxy); the AppState and WebSocket behaviour used is React Native core's (0.86 typings in `node_modules`), and a phone or device run is V10 (NOT RUN, needs a development build). Owner question (default built): while backgrounded no socket is held, push (INBOX-03, G-23) is what reaches a closed app.

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
