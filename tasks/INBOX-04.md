---
id: INBOX-04
title: Inbox: the list, empty, loading
owner: DEV2
area: INBOX
order: 57
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: review
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

Verifier, 7 Oct 2026, independent of the builder. Head `88a24f8` (mobile main `d36ae51` is its ancestor, so the trial merge is a no-op: `git merge origin/main` says "Already up to date", tree `56e7069d` identical). Backend: origin/main `0e7b617`, built in a detached worktree on a fresh migrated and `db:seed`ed database `vi04_hub_test`, the real wawu-id (local, own database `vi04_id_test`, :5252) as the stand-in WAWU ID, Hub :5251, web export (`expo export -p web --clear`, private TMPDIR, API base :5253) on :8251. :5253 is my pass-through proxy between the app and the Hub: it forwards HTTP and the socket untouched unless told to hold a path, answer a status, drop a connection, refuse an upgrade (429, 503), close with a code, or accept and never answer; it logs every request, close and first frame (token hashed). Chromium 390 x 845 (the artboard's size), 320 x 568 and 430 x 932, light and dark, device scale 2. Sign-in was always through the app's own sign-in screen (no injected token). Evidence: `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/vi04/` (`shots/art`, `shots/build`, `shots/pairs`, `check-branch.log`, `check-trial.log`, `mutate.out`, `mutate2.out`, `backoff.out`, `cu.out`, `ab.out`, `states.out`, `v4.out`, `skel.out`, `run/proxy.jsonl` the full request and socket log, `run/*.py` the drivers).

| Pass | Result | Evidence |
|------|--------|----------|
| V1 code | passed | `npm run check` exit 0 on the branch and on the trial merge (same tree): 49 suites, 840 tests, gates 9 run, 226 files scanned, 0 findings, baseline 0, 208 tasks. Scope fence held: changed files are `src/features/inbox/*`, `src/app/(tabs)/inbox.tsx`, three test files, `BACKEND_GAPS.md` (G-4 note), `docs/LOG.md`, generated PROGRESS and this task file; `_layout.tsx`, `src/api`, `src/components`, `src/theme` untouched. No hex, no `style={{}}`, no em-dash in user copy; no `fetch(` in the feature (only `refetch`); the one place outside `@/api` that opens a connection is `live.ts`'s `new WebSocket` (the app's one socket, see info I3). Test output carries act() and "worker failed to exit" noise from `InboxScreen.test.tsx` (info I4). |
| V4 data trace | passed, with the limit in D1 | The only server values this build draws are the Inbox tab badge, the empty state (a zero-row answer) and a 500's own sentence; names, previews and times are not drawn at all (no row renderer yet, D1). Badge traced by changing the DB: seeded `user` shows 1 (server 1); I added 6 unread room messages by SQL: server 8, badge 8; 120 more: server 128, badge `99+` (the bar's cap); moved the room read marker past them: server 1, badge 1; a fresh account with no rows (creator-basic): no badge. A message sent from another account by REST raised the badge 1 to 2 in 1.07 s (browser) and the server total matched each time (`v4.out`, `cu.out`). A 500 with my own sentence "Stand-in server error" showed that sentence. |
| V5 picture | passed with recorded differences, one defect (D2) | See the pairs table below. |
| V6 states | passed, 1 NOT RUN | Each by its real cause, below. |
| Live and badge | passed | Below. |
| V9 live seam | passed | Sign-in through the app's own screen against the built Hub and the real wawu-id: the first screen after sign-in showed badge 1, the number only the seeded database held for Adaeze (1 unread room message); empty state for the seeded account with no rows; badge values 8 and `99+` that only my SQL could have produced. |
| Mutants | 27 of 32 killed, 5 survived | Below. |

**V5 pairs** (artboard on the left, the build on the right, in `shots/pairs/`): `I35-390-light`, `I35-390-dark`, `I36-390-light`, `I36-390-dark`, `I1-390-light`, `I1-390-dark`; the same states at 320 x 568 (`small-320`, I35 and I36 in both themes) and 430 x 932 (`big-430`, I35 both themes; `I36-loading-430-*`, `I1-list-430-*` in `shots/build`); plus `error-500-390-light`, `error-500-390-dark` (no artboard draws an error).
- I35 (light and dark, 390): MATCHES in icon tile, title, guidance copy, centring (icon centre 745 vs 743 at 2x), title colour and weight, chip pill, tab bar. DIFFERS for a recorded reason: no header buttons, no Paid DMs, Communities, Money chips, no Browse communities button, no + button (task file "Added by later tasks": INBOX-12, 14, 18, 5, 20, 10, 19); no tab badge (the artboard's "3" on an empty inbox is a canvas inconsistency, the build is data-driven and the account has 0); the title and chips sit higher by the status bar (the device's) and the header-button row (the buttons').
- I36 (light and dark, 390): MATCHES in six rows, 52 circle, 140 and 210 bars, 36 time pill, 13 gaps, 156 px row pitch, colours both themes, and the 54 px from chips to first row. DIFFERS for the same recorded reasons as I35. 320 x 568: DEFECT D2.
- I1: the build cannot match the artboard's list: it has the title, the All chip and the badge only (D1). Everything the artboard draws below the chips is another task's by the task file.
- Error 500 and cut network (no artboard): shown with the shared ErrorState, "Try again" refetches. Info I5: a server 500 carries the no-connection icon.
- R-37: I1's `wawuAv` avatar (the WAWU thread) is not drawn here; nothing in this build draws a WAWU logo.

**V6 states** (`states.out`, `paging.py` output, `proxy.jsonl`):
- Empty: seeded creator-basic, `GET /inbox` really returns `items: []`. Shows "No messages yet" and the guidance. NOT drawn: Browse communities (INBOX-05's).
- Loading: proxy held `GET /inbox?` 6 s and 60 s: the skeleton shows while held, empty state replaces it on release.
- Error 500: proxy answered 500 to the GET (not the CORS preflight): 3 GETs (the query client's two retries at 1.0 s and 3.0 s), the server's sentence shows, "Try again" sends 1 GET and lands on the empty state. Cut network: proxy dropped the connection: "No connection. Check your internet and try again.", 4 GETs, "Try again" recovers to the empty state.
- Long list and paging: seeded creator-basic with 45 rooms (three of them at one millisecond). On the real build the screen requests page 1 (20 rows) only, draws nothing, shows no empty state and never asks for page 2 (D1). With a verifier-only stand-in renderer (throwaway build from the trial worktree, product file restored, `git status` clean) the list drew 45 rows: 3 requests, each cursor sent back exactly as the previous answer gave it (`True` x2), 45 unique ids, screen order equals server order including the three tied rows.
- Return to the tab: back within 30 s sends 0 GETs, back after 32 s sends 1 GET (stale time 30 s, `src/api/query.ts`).
- Signed out: cold load at `/welcome` for 5 s: 0 requests to the Hub, 0 socket upgrades, no badge. A 4403 close signs the user out: tokens cleared, `/welcome`, badge gone, no upgrade and no request in the next 6 s.
- Pull to refresh: NOT RUN. react-native-web's RefreshControl has no pull gesture, so a browser cannot start it. Unblocked by: a device or emulator run (V10), or a simulator with a touch drag. The jest test `a user pulling down reads the inbox again` covers the handler only.

**Live and badge** (`backoff.out`, `cu.out`, `ab.out`, `proxy.jsonl`):
- First frame: the upgrade is `/api/hub/live` with no query string and no Authorization header, the first frame is `auth` (token hash logged, never the token); `ready` follows in 8 ms to 60 ms.
- Reconnect waits, 50 s each, drivers set before sign-in, gaps between upgrades in ms: close without a frame (1006) 637, 1655, 1162, 650, 11339, 15704; 4503 2364, 3500, 11340, 10897, 23799; 4408 988, 964, 3345, 7964, 11554, 1077, 18505; 1001 1045, 1988, 1483, 7161, 11854, 921, 4220, 22161; HTTP 429 on the upgrade 903, 913, 1295, 2232, 13313, 8928, 5899; HTTP 503 929, 1274, 2351, 3795, 9661, 3624, 25685; accepted and never ready 10675, 11949, 11425, 13308 (the 10 s ready timeout plus a wait); ready then 1001 after 100 ms 781, 1161, 3972, 7707, 9137, 15898, 7194. Smallest gap 637 ms (floor 500), largest 25685 ms (cap 30000), waits grow, never a tight loop, and the flapping case did not reset the wait. Stopping the real Hub (SIGTERM, then 45 s down): a 1001, then 7 upgrades refused with 1006 over 36 s (0.7, 0.9, 1.0, 5.7, 0.8, 27.5 s), then a connect 28 s after the Hub was back, catch-up, badge read.
- 4401: wawu-id on a 40 s token, tokens expired on the socket: close 4401 at 43.2 s, one `POST /auth/refresh` at once, next `auth` frame carries a new token (hash 76cc6dcf to 5072245c), unread read. 4401 on a token that is still good (stand-in closing every socket 4401): no refresh after the first close, a refresh after the second, and a refresh after every later one (new hash each time).
- Live update: with the list on screen (stand-in renderer build) a room message from another account showed as the row's preview in 831 ms; chat message raised the badge 1 to 2 in 1.07 s.
- Catch-up: socket dropped (terminated) and upgrades refused with 503 for 15 s while 4 messages were sent (3 chat, 1 room, from two other accounts) plus 2 read marks; waits 0.7, 1.6, 0.9, 7.8, 6.0 s; on `ready` one `GET /live/catch-up?limit=100` from the newest held cursor answered 7 events (the one already seen, 4 new messages, 2 read marks, `hasMore` false); the list's row ids, previews and unread counts equal `GET /inbox` and the badge equals `GET /inbox/unread` (6). Duplicates cannot show in this screen (events only mark the inbox stale), so no-duplicate is proved by the mutants M5, E2 below, not by the picture.
- Background: hidden page closes the socket with 1000 at once and the badge stays at its last read (7 while the server held 8, as G-4 says); visible again: reconnect, catch-up, badge 8 in under 4 s.
- Sign-out and the next account: A = user (badge 6, rows drawn), B = creator-pro (badge 2). With `GET /inbox/unread` and `GET /inbox?` held 6 s and a message sent to A so a refresh was in flight, the socket was closed 4403 (`signOut()`): `/welcome`, badge gone, tokens gone, 0 rows. B signed in 10 s later: badge hidden until B's own read, then 2; B's list held B's rows only; A's held answer never reached the screen and never wrote a count. The socket is not reopened between the two sessions.
- Badge: hidden at 0, `99+` over 99 (the bar's rule, `TabBar.tsx`), live count equals `GET /inbox/unread`.

**Mutants** (own, on the trial worktree, restored by `git status` clean after every one; `mutate.py`, `mutate.out`, `mutate2.out`; 43 inbox tests each): KILLED 27 of 32: M1 backoff floor removed (2 tests), M2 cap removed, M3 4503 extra wait removed, M4 4409 reconnects, M5 seen-set dedupe off (2), M6 catch-up stops after first page, M7 4401 always refreshes, M8 wait reset at ready, M9 token in URL (2), M10 reset keeps seen set, M11 refused cursor not restarted, M12 socket cursor during catch-up lost, M13 4403 does not sign out, U1 badge not zeroed at session end, U2 badge off by one (5), U3 no coalescing, U4 socket not released at sign-out (4), P1 paging off, P2 cursor not sent back, P3 duplicates kept, P4 order changed, P5 cursor altered, P6 empty state for a non-empty list, E3 unanswered ping never drops the socket, E6 background does not close the socket, E8 socket and count held while signed out, E9 first ready cursor not kept. SURVIVED 5, each a test gap, none a visible defect today: **E1** seen-set limit 500 changed to 1; **E2** `community.message` never deduplicated (no test sends a room message twice, and the catch-up does resend one: it re-sent "online message A" in the live run); **E4** the refresh no longer refetches the on-screen lists (no test fails; the live run proved the list does refetch, so the code is right and the test that claims it, `InboxScreen` "marked stale by a live event", does not go through it); **E5** the 4401 counter not reset at `ready` (a later 4401 then refreshes at once instead of waiting for a second); **E7** the 500 ms floor constant set to 0 (the test pins "never zero", not the number; the live run measured the floor at 637 ms).

**Findings**
- **D1 `unclear`, needs the lead (launch ordering), not fixed by this task as scoped.** `rows.tsx` has no renderer for any row kind, so a signed-in user who has conversations sees the title, the All chip and a blank list while the tab badge counts their unread messages (`shots/build/I1-list-390-light.png`, `I1-list-390-dark.png`; repro: sign in as the seeded `user@test.wawu.dev`, open Inbox: 2 conversations on the server (a room and a paid question), nothing drawn, badge 1 or more). It is not an empty state (the list is not empty), nothing pages (`onEndReached` needs a drawn row), and the capability check "I1: a user sees the inbox list ... and a new message appears without a refresh" holds for the badge only. The builder reported this and the task file's "Added by later tasks" assigns every row kind to INBOX-19, 10, 18, 5, 20, so I score it as the recorded split of docs/WORKFLOW.md section 7, not as a defect of this branch. The consequence is for ordering: merged alone, every user with a message sees a blank Inbox. Needs: INBOX-19, INBOX-05 and INBOX-10 or INBOX-18 land with or before this branch merges, or the lead accepts the blank state.
- **D2 `defect`, I36 at 320 px.** The skeleton's rows are fixed widths (52 circle, 13, a 210 preview bar, 13, a 36 time pill = 324 px of content in 280 px), so at 320 x 568 the time pill sits on top of the preview bar. Measured (`skel.out`): row boxes 85 to 251 for the lines, preview bar 85 to 295, time pill 264 to 300: 31 px overlap. At 360 and 390 no overlap. Repro: hold `GET /inbox` and open Inbox at 320 px wide (`shots/build/I36-loading-320-light.png`, `-dark.png`, side by side in `shots/pairs/small-320.png`). The artboard is 390 wide so it does not draw this case; the bar lengths must shrink with the row (`flex`/max width).
- **I1 `info`, test gap:** survivors E2 and E4 above (a room message delivered twice is not tested; the refresh-the-lists step has no test that fails without it). E5 and E7 likewise.
- **I3 `info`:** `live.ts` calls `new WebSocket` itself and `api.ts` goes through `@/api/client`; the conventions' "no fetch outside the API layer" holds, there is no wrapper for sockets in `src/api` to use.
- **I4 `info`:** `InboxScreen.test.tsx` prints "environment is not configured to support act(...)" and the jest run ends with "A worker process has failed to exit gracefully" (also on main, per the builder).
- **I5 `info`:** a 500 shows the shared ErrorState with the WifiOff icon and the server's sentence; the icon says "no connection", which a 500 is not (`ErrorState` accepts an `icon`).
- **I6 `info`:** every `ready` triggers 2 reads of `GET /inbox/unread` on sign-in (200 then 304), and each reconnect cycle of a flapping server costs 1 to 2 HTTP reads; bounded by the socket's own waits (15 reads in 8 cycles).

**NOT RUN**
- Pull to refresh on a touch device: unblocked by a device or simulator run (V10).
- A phone or emulator run of the whole screen (V10, safe areas, status bar, real AppState): unblocked by a development build.
- Sign-out through the Settings screen: no sign-out control exists on this branch (SETTINGS-03's screen is not built); the session end was driven by a 4403 close (the app's own `signOut()`) instead. A refused refresh ending the session was not driven.
- A brand-new registered account (sign-up sends a phone code through Fintava SMS, off limits): the empty state was shown for the seeded account with no conversations, a real zero-row answer.
- The Hub's own "21st unsigned socket" 429: driven by a stand-in refusal of the upgrade, same client path.
- Status: `building`, because D2 is open. D1 needs the lead's ordering decision.

### Builder addendum, round 2 (7 Oct 2026)

Branch `wmt/INBOX-04` at 5ed2bb7 plus newest main (c0fb4e3 and later) merged. D2 fixed in `InboxSkeleton.tsx` only: the lines column has `minWidth: 0` and each bar `maxWidth: '100%'`, so the bars shrink with the row. Measured in the web build (stub Hub for the skeleton only, no real backend needed; `scripts` not added): bars past their column and past the time pill's left edge, before 44 px and 31 px at 320, after 0 and 0 at 320, 390 and 430, both themes; 390 and 430 screenshots (I36 and I35) are pixel-identical before and after. Screenshots: `/tmp/claude-0/-home-user/4c848b71-b74a-5dd5-8510-8e4464e23881/scratchpad/inbox04-builder/I36-{320,390,430}-{light,dark}-{before,after}.png`, same for I35.
- **Tests added (50 inbox tests, was 43):** `InboxSkeleton.test.tsx` (style rules; jest has no layout, so the measurement is the web run above), seen-set limit (E1), room message sent twice (E2, deduped by message id), live event refetches an on-screen list (E4), 4401 count reset at ready (E5), 500 ms floor to the millisecond (E7). Each mutant (E1, E2, E4, E5, E7, and D2 itself) re-applied in place: the new test failed, then restored (git status clean of mutants).
- **I5:** a non-network error (500) now uses `TriangleAlert`; a cut network keeps `WifiOff`. **I6** left: the second `GET /inbox/unread` comes from the socket's first `ready` reading again; skipping it could miss an event that arrives while the first read is in flight. **I3, I4** left as notes.
- **D1** (blank list under a correct badge until INBOX-19, 10, 18, 5, 20 add row renderers) is an ordering note for the lead: those should land with or before this branch.

### Verifier report, round 2 (7 Oct 2026)

Verifier (a fresh session for round 2, independent of the builder). Head `e987544` (the builder's merge `574cbf2` of origin/main `c0fb4e3`). `git merge-base --is-ancestor origin/main HEAD` is true, so the trial merge onto the newest main is a no-op: no conflict in `docs/PROGRESS.md`, `tasks/INDEX.md` or any gap id. My own stack for the live checks: backend worktree of origin/main `0e7b617` (its `src/live`, `src/inbox`, `src/chat` and `docs/contract/LIVE.md` are byte-identical to backend main `6c0e435`; only prisma migrations and the legal and ads modules differ), real wawu-id from a worktree, own Postgres on :5483 (tmpfs), Hub :4731, wawu-id :4732, a pass-through proxy :4733 (hold, drop, refuse, kill) and the app's web build on :8081 (the Hub's local CORS list). Sign-in was always the app's own sign-in screen. Screenshots (390 px and the sizes below, light and dark): `/tmp/claude-0/-home-user/4c848b71-b74a-5dd5-8510-8e4464e23881/scratchpad/inbox04-verify/` (`r2-I36-{280x560,300x600,320x568,360x800,390x845,430x932}-{light,dark}.png`, the same for `r2-I35-*`, `r2-error-network-cut-{light,dark}.png`, `r2-error-server-500-{light,dark}.png`, `r2-recovered-after-try-again-*.png`); round 1's `I35-empty-*`, `I36-loading-*`, `I1-*`, `badge-*`, `error-*` are in the same folder.

| Pass | Result | Evidence |
|------|--------|----------|
| V1 gates | passed | `npm run check` exit 0 on the branch (`e987544`, same tree as the trial merge): 50 suites, 847 tests, gates 9 run, 227 files scanned, 0 findings, baseline 0, 209 tasks. Main `c0fb4e3` on its own worktree and install: 46 suites, 797 tests, 216 files, 0 findings, 209 tasks, exit 0. (A first run of main under load had the known cold-cache OpenWalletScreen 20 s timeout in my round 1; this run was clean.) Scope fence held: `git diff --name-only origin/main...HEAD` touches no `_layout.tsx`, `src/api`, `src/components`, `src/theme`, `package.json`, `scripts`, `design` or `contract`; the 17 files are exactly the builder's list. No hex, `style={{}}`, em-dash, TODO, `for now`, `console.` or token in a URL in `src/features/inbox`. |
| V4 field trace | passed | Round 1's trace stands; re-checked on the real stack: server total 7 = badge 7 = sum of `GET /inbox` rows (4 + 2 + 1 + 0); badge hidden at 0, `1`, `9`, `10`, `99` shown as is, `100` and `140` shown `99+` with label "Inbox, 140 unread" (the bar's own rule). 1000 was not driven on the real server (the Hub's throttler answered 429 at about 100 sends a minute); the code path is the same comparison `count > 99`. |
| V5 picture | passed (D2 closed) | Below. |
| V6 states | passed (pull to refresh still NOT RUN in a browser) | Below. |
| V9 live seam | passed | Below. |
| Mutants | 32 of 32 killed (round 1: 27 of 32), 2 of 2 D2 mutants killed, 1 added mutant survived | Below. |
| V10 | NOT RUN | Needs a real Android development build (DECISIONS R-24). |

**D2, I36 and I35 at every width** (web build, `GET /inbox` held 12 s by my proxy so the skeleton is the real loading state; boxes measured with `getBoundingClientRect` on the `inbox-skeleton-*` test ids): the preview and name bars end inside their column and the preview bar ends left of the time pill's left edge at 280, 300, 320, 360, 390 and 430 px wide (past the column 0.0 px, past the pill 0.0 px at each), no horizontal scroll. Bar widths: name 126, 140, 140, 140, 140, 140; preview 126, 146, 166, 206, 210, 210; time pill 36; row pitch 78 CSS px (156 device px) at every width; six rows. At 390 the sizes are the artboard's (circle 52, bars 140 and 210, pill 36, gaps 13). The 390 I36 screenshot is pixel-identical to my round 1 screenshot in both themes (`ImageChops.difference` bounding box None over the top 1400 device px); the I35 screenshot differs only inside the centred block (x 270 to 512, y 688 to 867) because the viewport is 845 high and round 1's was 844 (half a CSS px of centring). I36 side by side with the rendered artboard: 54 device px from the chips to the first row on both, as in round 1. D2 mutants: removing `maxWidth: '100%'` (the bar style) fails `InboxSkeleton.test.tsx` ("on a narrow phone the bars shrink..."), removing `minWidth: 0` fails it too.

**I5**: a real 500 (I renamed a table the inbox query reads, then renamed it back) shows the `TriangleAlert` icon in the shared ErrorState with the server's sentence "Something went wrong. Please try again."; a cut network (my proxy closes the connection) shows `WifiOff` with "No connection. Check your internet and try again."; light and dark captured for both, same layout as the shared ErrorState. "Try again" refetches: after the cut, one `GET /inbox?limit=20` (and the socket's resync reads) and the list replaces the error; after the 500, the same, once the table was back. Empty (I35), loading and recovery as in round 1.

**E2 and the live seam.** `git diff 88a24f8 e987544 -- src/features/inbox/live.ts` is empty: `live.ts` did not change in this round. The room-message dedupe by id was already in round 1's code (`seenKey` returns `room:${message.id}` for `community.message`, `chat:${message.id}` for `chat.message`); the new test pins it. So the round 2 hand-over's "E2 was a real code gap, community.message events are now deduplicated" is not what the diff shows (info I7). I checked the key anyway: ids repeated across kinds do not collide (a chat message and a room message with the same id `X`, then room `X` again, then chat `X` again, then room `Y`, `Z`: delivered `chat:X room:X room:Y room:Z`), two different room messages are never collapsed, and the seen set stays at 500 after 2000 distinct ids (oldest dropped first). Against the real server: a host's room message was delivered on the socket, the socket was killed 300 ms later, and the reconnect's `GET /live/catch-up` really resent the same message (checked by calling the route with a cursor just before it: `community.message:b33fe659` is in the answer); the badge and server agreed (3 = 3), and the app made one `GET /inbox/unread` and one `GET /inbox` for the live event and one pair after the resync, not one per delivery. Catch-up after an 8.5 s gap (3 chat messages, 1 room message, 2 read marks from two other people; client attempts at 1.4, 5.1, 6.3, 11.2 s): after the unblock one `GET /live/catch-up?limit=100` from the held cursor, then `GET /inbox/unread` and `GET /inbox`; server 7, badge 7 after 3.2 s, sum of `GET /inbox` rows 7 (the rows are not drawn, D1, so "list equals GET /inbox" is checked by the numbers, not by a picture).
- Live latency: message sent by another real user, badge raised in 0.29 to 0.39 s (3 samples).
- Backoff against the real Hub (the app's own `LiveClient` class with a real `ws` socket and the real clock, `lc/C.js`): SIGTERM to the Hub gave close 1001 "shutting down"; 14 refused connections over 120 s with waits 0.7, 1.0, 2.0, 2.5, 5.2, 13.1, 27.5, 1.9, 11.3, 1.6, 2.3, 7.0, 16.2, 18.8 s (floor 500 ms, cap 30 s, full jitter so a short wait can follow a long one); the Hub back at 123 s, the client connected at 132.9 s, `ready`, caught up, status live; no tight loop. In the browser the same Hub restart showed the same pattern (12 refused upgrades, the 13th opened at 165 s).
- 4401 for real: a browser session held for 15 minutes on the real wawu-id: the Hub closed the socket 4401 `token_expired` at 895 s (the app had pinged every 25 s, 30 pings), and the app opened a new socket at 898 s with a fresh `auth` frame and got `ready`.
- 4409 for real: eight raw sockets for the same person after the app's: the app's socket was closed `4409 replaced`, the client stopped (`halted`), no new upgrade in the next 15 s (no fight), and it connected again when the app went to the background and returned. 4403 for real: a second `auth` with another person's token on a live socket is closed `4403 wrong_person` by the Hub; the client's own code never sends a second `auth`, so its 4403 path (stop and sign out) is covered by the unit test and by round 1's driver, not reachable from the app as built. 4408, 4503 and the 1001-on-restart codes: unit tests plus round 1's stand-in driver (the real Hub closed with 1001 in this round; `live.ts` is unchanged).
- Background and foreground in the web build (document visibility maps to AppState): hidden closes the socket 1000 at once, a message sent meanwhile is not shown (badge 7, server 8, as documented), visible again reconnects, catches up and the badge reads 8 in 0.43 s.
- One socket per person from the app: the browser held exactly one `/api/hub/live` socket after sign-in with the Inbox tab and the tab layout both mounted.
- Not re-run because `live.ts`, `unread.ts`, `useInbox.ts` and the sign-out wiring did not change since round 1 and their unit tests passed: sign-out then another account (no sign-out control exists on this branch; round 1 drove it with a 4403), the Hub's own "21st unsigned socket" 429, flapping at scale. Round 1's evidence for them stands.

**Mutants** (own set of 32 rebuilt from round 1's list, on a scratch copy of the branch with hard-linked `node_modules`; each re-applied against all 50 inbox tests, restored, the verify worktree untouched): KILLED 32 of 32: M1 floor removed, M2 cap removed, M3 4503 wait removed, M4 4409 reconnects, M5 seen dedupe off, M6 catch-up one page, M7 4401 always refreshes, M8 wait reset at ready, M9 token in URL, M10 reset keeps seen set, M11 refused cursor not restarted, M12 socket cursor lost during catch-up, M13 4403 no sign-out, U1 badge not zeroed, U2 badge off by one, U3 no coalescing, U4 socket not released, P1 paging off, P2 cursor not sent back, P3 duplicates kept, P4 order changed, P5 cursor altered, P6 empty state for a non-empty list, E1 seen limit 1 (now killed), E2 room message not deduped (now killed), E3 ping never drops, E4 refresh does not refetch lists (now killed), E5 4401 counter not reset (now killed), E6 background keeps the socket, E7 floor 0 (now killed), E8 socket held while signed out, E9 first cursor not kept. Plus D2 `maxWidth` removed and D2b `minWidth` removed: both killed by `InboxSkeleton.test.tsx`. One mutant I added survived: **I5 icon** (`'TriangleAlert'` replaced by `'WifiOff'` for a server error): no test pins the icon (the picture and the screenshots do).

**Findings (round 2)**
- D2 closed (see above). I5 closed (see above). E1, E2, E4, E5, E7 closed: each is now killed.
- **D1 `unclear`, for the lead (ordering), unchanged.** `rows.tsx` has no renderer for any row kind: a signed-in user with conversations sees the title, the All chip and a blank list under a correct tab badge (seeded `user@test.wawu.dev`: server unread 2 to 8, nothing drawn, `I1-inbox-with-chats-*`, `I1-badge-live-*`). By the task file's "Added by later tasks" and docs/WORKFLOW.md section 7 this is the recorded split, so it is not scored as a defect of this branch; the product question (merge this alone, or only with a row task) is not mine. Facts for the lead: INBOX-05 (community rows) has `depends_on` INBOX-01, 02, 04, UI-02, UI-03; all are `done` except INBOX-04 (this task), so INBOX-05 is the next startable task that adds rows once this is `review`. INBOX-19 (chat rows) is blocked: MONEY-19, WALLET-07 and WALLET-02 are `todo`. INBOX-10 and INBOX-18 depend on INBOX-17, ME-02, ME-11, HOME-07, PROS-01 and on INBOX-19, INBOX-12.
- **I7 `info`, claim not borne out by the diff.** The hand-over says `live.ts` changed for E2 (community.message dedupe). `live.ts` is byte-identical to round 1's (`git diff 88a24f8 e987544 -- live.ts` empty); the behaviour was already there and is now tested. No action; recorded so nobody looks for a change.
- **F-4409 `unclear`, LIVE.md vs the client on 4409.** `wawu-backend docs/contract/LIVE.md` lists 4409 among the "close codes the app reconnects on"; the client stops on 4409 until the app returns to the foreground (builder's recorded decision, owner may override). The server closes the oldest socket only when one person holds a ninth, so a single phone never meets it, but when it happens (a leaking second client) the badge stops updating live until the next foreground. Needs the owner to confirm one of the two.
- **I8 `info`, no marker on the timing numbers.** `LIVE_TIMING` (0.5 s floor, 1 s base, 30 s cap, 10 s stable, 10 s ready, 25 s ping, 10 s pong, 30 s token slack) and the 300 ms coalescing carry no `PROVISIONAL(...)`. The gate `provisional` only reads a `PROVISIONAL(id, owner=, why=)` marker and the file's own comment calls them technical settings, none a money, fee or legal figure; the server's own numbers (30 s heartbeat, 5 s auth timeout, 8 sockets, 20 unsigned per address) are in LIVE.md. Not a rule-7 figure; stated so the owner can tell.
- **I9 `info`, pull to refresh, `expo-doctor` and the I5 icon.** Pull to refresh is still NOT RUN in a browser (react-native-web's RefreshControl has no pull gesture; the jest test covers the handler): unblocked by a device or emulator run (V10). `npx expo-doctor` here fails the same way on main `c0fb4e3` and on the branch (diffed, identical): "Check Expo config schema" ("Host not in allowlist" from the egress proxy) and "React Native Directory" ("unexpected server response"); 19 of 21 checks pass on both. The known 5-package version failure CI shows is not reproduced in this environment, so that comparison is NOT RUN (needs api.expo.dev). The I5 icon has no test (the surviving mutant above).
- I1 (round 1, the second `GET /inbox/unread` after the socket's first `ready`) left by the builder, accepted: bounded by the socket's waits.

**Status:** no open defect. `status: review`. Open for the owner or lead: D1 (ordering), F-4409 (4409 versus LIVE.md).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
