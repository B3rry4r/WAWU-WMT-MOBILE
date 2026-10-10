---
id: INBOX-05
title: Communities: list, room, sending
owner: YOU
area: INBOX
order: 61
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: verifying
depends_on: [INBOX-01, INBOX-02, INBOX-04, UI-02, UI-03]
decisions: [R-37]
passes: [V1, V4, V5, V6, V7, V9]
artboards: [I24, I25, I26]
---
# INBOX-05 · Communities: list, room, sending

Taken over by the lead's agents on 8 Oct 2026 (owner: carry on with the tasks of developers who are delaying; Developer 2 had not pushed for 17 hours).

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV2.md` (what you own)
- The design: `python3 scripts/design/render_design.py I24 I25 I26` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A5.json`
- `docs/designer/BRIEF.md` (the brief is part of the design, R-29; it has no entry for I24, I25, I26, so those artboards stand, under its rules 3 to 8 on fees, refunds, licence lines and em-dashes)

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

## Artboards

- **I24 · Communities**: Communities chip inside Inbox: "48 WAWU Credits · Reading is free · 1 credit per message you send · Buy", Your communities with last-message previews, Suggested with member count, open Join / private Ask.
- **I25 · Community**: Room view for an open community with member count, credit balance in header, Host tag on the host's message, and composer "Message · 1 credit".
- **I26 · Sending**: Composer with text and send button "Send · 1" showing the credit cost.

## Added by later tasks

These entries are drawn on this task's artboards but lead to screens built by later tasks, so this task does
not build them. Each is added, exactly as drawn, by the task that builds where it leads (docs/WORKFLOW.md
section 7, R-27). The verifier reports their checks as belonging to that task.

- I24: Buy (opens I28): added by INBOX-13
- I24: Ask (private) (opens I30): added by INBOX-14

## Capability checks

- [ ] **I24**: a user sees their WAWU Credits as a count; can open a room; Join an open one.
- [ ] **I25**: a user can read messages; type a message.
- [ ] **I26**: a user can Send · 1.
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6).
- [ ] From I1 (INBOX-04), a user can tap a community row, the Communities chip, or Browse communities on I35, and reach I24 (this task adds them, as drawn).

## What the backend serves today (from the analysis)

- **I24**: partial. Missing: No "my communities" query (web comment: joined tab only reflects joins made this session); no last-message preview or unread per room; no suggestion/ranking logic; no ?host= filter.
- **I25**: served. Missing: Served for request/response. No incremental fetch (no since/cursor param) and no live delivery: No real-time transport exists: grep of wawu-backend/src and package.json for WebSocketGateway|@SubscribeMessage|socket.io|@Sse|text/event-stream returned nothing; only @nestjs/schedule cron jobs run server-side. Web fetches once on mount (no setInterval/EventSource/WebSocket in src/lib or src/components messaging code).
- **I26**: served.

A missing or partial row is yours to fix in the backend as part of this task (or the backend task listed in depends_on, check its owner in the task file). Never change the screen to fit the API.

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

Builder, 7 to 8 Oct 2026, `wmt/INBOX-05` from main, with `origin/wmt/INBOX-04` merged first (not yet on main). No backend change (INBOX-01, 02 and 07 already serve everything but the figures below), no `_layout.tsx` edit.
- **Files:** new `src/features/communities/` (api, format, hooks, CommunitiesView, CommunityRow, CreditsStrip, RoomScreen, RoomHeader, MessagePost, Composer, GroupTile, RoomLinkScreen, skeleton, 4 test files, 83 tests), routes `src/app/community/[id].tsx` and `src/app/c/[slug].tsx` (`wawu/c/<slug>`); changed INBOX-04's `chips.ts` (Communities chip), `rows.tsx` (community renderer), `InboxScreen.tsx` (list split from the frame, Communities chip swaps in I24, Browse communities on I35, pages are read on until a drawable row appears), its test (chip list pin now All and Communities; 8 tests added); BACKEND_GAPS G-450 to G-458; SHARED-CHANGES INBOX-05 #1 (shared Composer and GroupTile).
- **I24:** a user sees WAWU Credits as a count (`GET /credits`, "Reading is free"), Your communities from `GET /communities/mine` (last message by first name, "You:", Photo, unread badge, lock on private, time), Suggested from `GET /communities` (member count, open or private), joins an open room in one tap and lands in it. Private rows have no button. **Left out, as the task says:** Buy (INBOX-13), Ask (INBOX-14), the other chips, header buttons and the + button (other tasks).
- **I25 and I26:** header with member count and the server's balance, messages newest at the bottom, Host tag, live delivery through INBOX-04's client (deduped by id, catch-up, page repeats dropped), older pages at the top, "New messages" pill when reading up, read mark, one send at a time (double tap posts once), failed send keeps its text with Send again and Remove, a send with no answer is checked against the newest page before it is repeated, 402 shows the server's sentence, 403 becomes the join page (open: Join; private: no button; pending: told), 404 "isn't available".
- **Figures left out, never hard-coded:** "1 credit per message", "Message · 1 credit" and "Send · 1" (G-450: no API serves the price); member counts and balance are the server's. Decisions (agent, owner may override): a community row in All opens the room (the design's hotspot, I25), the chip and Browse open I24; Join then opens the room; unread styling copies the shared conversation row; no "+" (nothing it opens).
- **Gates:** before (merge with INBOX-04, main c0fb4e3): 50 suites 847 tests, gates 227 files 0 findings, tasks 209. After (with main merged, 8 Oct): 1464 tests, gates 369 files 0 findings, lint and tsc clean, tasks 259, exit 0.
- **V7:** walked in the browser against the real backend as a member, the host (sends free, balance stays 48, Host tag, reload resumes the room), a user with 0 credits, a removed member (join page), a non-member and unknown links.
- **Real run (V9):** local Hub 4705, WAWU ID 4706, Postgres 5493, real sign-in in the app: balance 48 from the server, join of an open room (membership `joined` in the database), send dropped 48 to 47 (server number), a message from another real user showed in 0.08 to 0.12 s, reading changed no balance. Evidence in the session scratchpad `inbox05-builder/screens/{light,dark}` and `pw/` (artboard beside screen: `pw/cmp.py`). Real causes captured in light: slow network (I24 and room loading), real 500 (table renamed, then restored) and recovery, network cut and recovery, room links (open, private, unknown).
- **Not done or NOT RUN:** native phone behaviour (keyboard, `maintainVisibleContentPosition` pinning) is V10, NOT RUN; the SDK 57 docs were unreachable, React Native typings were used. Dark captures: I24 to I26, live, host, zero credits (real 402 sentence), removed member; states through slow network, real 500 and cut network in light only; the room-link Join and the hub-restart catch-up captures did not complete (NOT RUN in the browser; the catch-up is tested with a fake socket). Owner questions: whether the host counts in member counts (G-456), what Suggested means (G-451).

**Builder, fix round 1 (8 Oct 2026), verifier defects 1 to 5:** (1) the credits strip is read again when the person comes back to I24 and when the list's or the suggestions' Try again is pressed (tests: balance recovers on refocus, and with the list retry). (2) Try again in a room refetches the room and its messages together (test: both failed, one tap recovers). (3) `RoomScreen` asks a signed-out person to sign in (no server word, no retry, no requests; test). (4) A message past the limit reads "That message is too long. Shorten it and send it again.", offers Edit (puts the words back in the field) and Remove, not Send again; any refused-words (400) answer gets Edit (test). (5) `useRoomMessages.test.tsx` tests the hook's guards alone: removing the guard in `send` fails test 1, removing the one in `run` fails test 2 (both checked). Gates after: 1472 tests, 370 files, 0 findings, exit 0. Not touched: fenced files; findings 6 to 10 are the lead's.

## Verifier report

Verifier, 8 Oct 2026, fresh session (did not write any of this code). Checked `wmt/INBOX-05` at 99b129b **with `origin/main` (98f16c6, INBOX-04 merged) merged in**, as the branch will land. The merge is pushed with this report (conflict only in the generated `docs/PROGRESS.md`; regenerated with `npm run tasks -- --write`).

**Setup.** Own worktrees (`wt/INBOX-05-verify-{mobile,backend,id}`), backend and WAWU ID from `origin/main` (657a152 and 4715d17), own Postgres 16 on :5593 (`wawu_hub_v05`, `wawu_id_v05`), Hub :4805, real WAWU ID :4806 (no mock; started by the backend's `scripts/local/up.sh`), Expo web :8181. The app was driven in Chromium at 390 wide, light and dark, signed in through the real sign-in screen (no injected token). Evidence (screenshots, scripts, logs): `/tmp/claude-0/-home-user/4c848b71-b74a-5dd5-8510-8e4464e23881/scratchpad/inbox05-verify/` (`shots/`, `s_*.py`, `check-merged.log`).

| Pass | Result | Evidence |
|------|--------|----------|
| V1 Gates | passed | `npm run check` on the merged branch exits 0: tsc clean, `expo lint` clean, jest 80 suites 1464 tests all pass, gates "files scanned: 369, 0 fail, 0 warn, 0 accepted", baseline 0 entries, tasks 260 (`check-merged.log`). Feature tests alone (communities + inbox): 8 suites 137 tests pass. No file under `src/api/`, `src/components/`, `src/theme/`, `contract/` or any `_layout.tsx` changed (`git diff --stat origin/main...HEAD`). No backend change, so no backend gate to run. |
| V4 Field trace | passed | Walked each value: credit balance (`CreditsState` row, DB 48 to 47 on one send, strip, room header and server all agree; reading, reloading and the host's send leave it unchanged); message text and sender (written by one user, read in the room, in the other user's I24 last-message line with "You:" for own and first name for others, and live on the other phone in 0.36 s); Host tag (from `hostWawuId`); unread count (rises for the other user, clears when the room is opened); room name, picture, kind, member count (host's own room list and the member's list agree). Member count is the server's number (see finding 6). |
| V5 Picture | passed, with the differences listed in findings 7 and 8 | `render_design.py I24 I25 I26` beside the built screens, light and dark: `shots/cmp-I2{4,5,6}-{light,dark}.png` (artboard left, app right). Header, credits strip, section labels, row order, tile size, lock, Host pill, bubbles, date divider, composer field and Send pill all match in spacing, order and type. Also captured at 320x568, 360x800, 430x932 (no horizontal scroll, composer grows to 5 lines and scrolls: `shots/strip-sizes-*.png`). |
| V6 States | failed (findings 1 and 2) | Each entered by its real cause. Loading: CDP slow network (`I24-loading-*`, `room-loading-*`). Empty: all rooms removed from the database (`strip-empty.png`), and a user with no memberships (`strip-nomine.png`). Network cut: requests aborted (`strip-err-*`, `room-net-*`). Real 500: the membership and message tables renamed in the database, then restored (`I24-err-500-*`, `strip-room500-dark.png`). Zero credits: balance set to 0, the server's 402 sentence shown with Send again and Remove (`strip-zero.png`). Removed member: 403 becomes the join page (`strip-removed.png`). Private non-member, pending request, unknown link, signed-out link (`strip-links1.png`, `strip-links2.png`). Failed send keeps the text and one Send again charges once (47 to 46, one row in the database, `strip-failsend.png`). Too-long message (`edge-long-light.png`). Retry recovery works for the list and the room, but the credits strip does not recover (finding 1) and the room needs two taps (finding 2). |
| V7 Flow walk | passed | As: member (Adaeze), host (Zainab: sends free, balance stays 48, Host tag, `host-*`), brand-new account with an empty inbox and 0 credits (I35, Browse communities opens I24, Join opens the room, send shows the server's 402, `strip-fresh.png`), non-member via `wawu/c/<slug>` (open: Join, joined and landed in the room; private: no button; pending: told), removed member, unknown link, signed-out link. Cold start into `/community/<id>` and into `/c/<slug>` works and Back lands on the Inbox. Joining an open room from I24 writes `joined` in the database and opens the room. Reading up 5 pages of history (92 messages): 70 unique rows visible, none repeated, newest at the bottom, "New messages" pill when a message arrives while reading up and tapping it scrolls to it. Hub stopped, a message stored while it was down, Hub started: the message appeared 6.9 s later (catch-up the builder could not capture). The row-in-All behaviour differs from the check as written (finding 7). |
| V9 Live seam | passed | Real sign-in through the app's sign-in screen against the real WAWU ID and Hub (no token injected). Values only the server has: balance 48 (seeded trial) and 0 for the new account; a send dropped 48 to 47 and the database row count went 0 to 1; a message from another real account showed live. Created through the app and read back through the API and the database (membership, message, read mark). |
| V10 Device | NOT RUN | No Android device or tester build here. Unblocks: a signed release build on the owner's Android phone (RELEASE-xx, docs/BUILDS.md). Keyboard, `maintainVisibleContentPosition` pinning and the room's behaviour with the on-screen keyboard are unchecked. |

**Mutation check of the tests** (14 single-line mutants on the feature, `npx jest src/features/communities`): 11 killed, 3 survived. Killed: private room made joinable, Host tag removed, no credit refetch after a send, Composer disabled while busy, no landed-check before a repeat, 402 flag removed, dedupe by id removed, read mark removed, Join no longer opens the room, and the hook guard plus the Composer guard removed together. Survived: removing the hook's own double-send guard (`sending.current` in `send` and in `run`), alone or together (finding 5).

**Capability checks** (as written in this file):
- I24, a user sees WAWU Credits as a count: passed (`48 WAWU Credits`, from `GET /credits`). Can open a room: passed. Join an open one: passed.
- I25, read messages, type a message: passed.
- I26, a user can Send: passed (the label is "Send", not "Send · 1", for the recorded reason in finding 8).
- Each artboard matches its render in light and dark: passed with findings 7 and 8.
- Every value from the API or the user: passed. "Reading is free" is true (reading, reloading and being the host never change the balance). Gaps are in BACKEND_GAPS G-450 to G-458.
- Loading, empty, error by real cause: failed, findings 1 and 2.
- From I1 a user can tap a community row, the Communities chip, or Browse communities on I35 and reach I24: the chip passes and Browse passes; a community row in All opens the room (I25), not I24 (finding 7).

**Findings**

1. `defect` (I24, V6): the credits strip never recovers. When `GET /credits` fails (network cut, 500) the strip reads "WAWU Credits / Your balance could not be read". After the network is back, "Try again" on the list recovers the list but not the strip, and leaving the room and coming back 8 s later it still says so, until the person pulls down or reopens the app. The list's retry and `refetchOnMount` do not reach it because the view stays mounted. A user with a good connection sees no balance. Reproduce: abort `/credits`, open Communities, restore, tap back and forth (`shots/strip-credfail.png`, `strip-err-light.png`). Fix: the strip's own retry, or refetch credits when the list retries.
2. `defect` (I25, V6): after a real 500 on opening a room ("Couldn't open this community"), tapping Try again once the server is healthy shows a second error, "Couldn't load the messages", and needs a second tap. The first retry refetches the room but not the messages request that already failed (`shots/strip-room500-dark.png`).
3. `defect` (low, I25): a signed-out visit to `/community/<id>` shows the raw server word "Unauthorized" under "Couldn't open this community" with a Try again that cannot work (`shots/strip-links2.png`, fourth frame). Only `/c/<slug>` asks the person to sign in (G-458 covers that one). The route graph is fenced, so the fix may be a SHARED-CHANGES row, but the screen should not show the API word.
4. `defect` (low, I26): a message over 2000 characters shows the validator's own words, lowercase, "text must be shorter than or equal to 2000 characters" (`shots/edge-long-light.png`). The builder filed the missing limit in the contract (G-453) but the user reads a code sentence. Also the message can never be sent, yet "Send again" is offered beside Remove.
5. `defect` (test gap): the hook's double-send guard (`sending.current`, in `send` and `run`) has no test of its own: the "double press posts once" test passes with both guards removed because the Composer's `busy` gate catches it first. Two presses in one frame, before `busy` renders, rely on the untested ref. In the browser a double click posted once.
6. `unclear` (needs the owner, already G-456): member counts are one short whenever a room has a host (a host has no membership row). The screen shows "0 members" for a room that has a host and messages, and "1 member" for a room with the host and one member (`strip-nomine.png`, `strip-fresh.png`). The builder shows the server's number as the rule says; the owner decides whether the host counts.
7. `unclear` (task text against the design): the check "a user can tap a community row ... and reach I24" fails as written. The builder opened the room (I25) from a community row in All, because the design's own hotspot for I1's "Community row" is "Open the room, I25" (`design/_gen/inbox.js` line 119, the chip is hotspot 3 to I24). The builder recorded this as a default, owner may override. I think the design is right and the check wording is wrong; the lead should reword the check. The chip and Browse communities do reach I24.
8. `differs-for-recorded-reason`: (a) "1 credit per message you send", "Message · 1 credit" and "Send · 1" are drawn without the figure: no API serves the price (task section "Figures on these artboards are not facts", G-450); the app shows "Reading is free", "Message", "Send" with the coin. (b) Buy is INBOX-13 and Ask is INBOX-14 (task "Added by later tasks"). (c) The Paid DMs and Money chips, the two header buttons and the floating + belong to other tasks (WORKFLOW section 7 "Links between screens"). (d) The composer's + (photos) is not drawn because nothing opens (G-457). (e) A row's unread badge and bold time are the shared conversation row's look, which the artboard does not show because none of its rows are unread; recorded as a default in the builder report.
9. `unclear` (minor, not this task's): the `Coins` glyph (credits strip, header pill, Send pill) is mirrored against the artboard's (the artboard's front coin is top left, the app's is top right; `shots/icons-cmp.png`). It comes from the shared icon set, which is fenced.
10. `unclear` (not this task's, INBOX-04): when the inbox feed holds only a kind nothing draws yet (the seeded user's paid DM), All shows a blank page with no empty state. Reached by removing the seeded user's rooms. Goes away as the other kinds are built (INBOX-06 and later).
11. Note, no action: the server's 402 sentence says "Buy more to keep messaging", while Buy is not built until INBOX-13; the sentence is the server's.

**Result: FAIL, status back to `building`.** Open defects: 1, 2, 3, 4, 5. For the lead: findings 6, 7, 9, 10. V10 NOT RUN.

### Verifier report, round 2 (8 Oct 2026)

Re-verified `wmt/INBOX-05` at 9d7b7d6 (fix commit 53d54b8, newest `origin/main` merged by the builder; nothing else on the branch changed `src/` outside `src/features/communities/`). Own worktrees, Postgres :5593, Hub :4805, WAWU ID :4806 (rebuilt from `origin/main` fb8717e), Expo web :8181, real sign-in. Evidence: `/tmp/claude-0/-home-user/4c848b71-b74a-5dd5-8510-8e4464e23881/scratchpad/inbox05-verify/shots/r2-*.png`, `check-r2b.log`.

| Pass | Result | Evidence |
|------|--------|----------|
| V1 Gates | passed | `npm run check` on the pushed head, run alone: exit 0, tsc and lint clean, 81 suites 1472 tests, gates files scanned 370, 0 findings, tasks check passes (`check-r2b.log`). A first run made while other sessions were loading the machine failed one test, see finding 12. |
| V4 Field trace | passed | Unchanged data paths; re-sent a message (balance 47 to 46, one new row), live delivery 0.33 s, reload leaves the balance. |
| V5 Picture | passed | I24, I25, I26 re-captured light and dark after the fixes (`cmp-I2*-*.png`); the Edit and sign-in prompt states below use the same shared components. No change from round 1 beyond finding 7 and 8 differences. |
| V6 States | passed for 1 and 2 | Each fix confirmed by its real cause, below. |
| V7 Flow walk | passed | Cold start into `/community/<id>` signed in still opens the room; signed-out is asked to sign in; send, join, Browse unchanged. |
| V9 Live seam | passed | Real sign-in, balance 47 to 46 on one send, server rows. |
| V10 Device | NOT RUN | Unchanged: needs the owner's Android phone and a tester build. |

Round 1 defects:
1. FIXED. `GET /credits` aborted at the network, Communities opened (strip "Your balance could not be read"), network restored, left and came back: the strip reads "47 WAWU Credits" within 8 s. Also from a cold list failure: Try again recovers the list and the strip together, light and dark (`r2-strip-credits.png`).
2. FIXED. Real 500 (message table renamed, then restored), Try again once: the room and its messages both load, no second error (`room-500-recovered-light.png`; "error still shown after 8s: 0").
3. FIXED. Signed-out visit to `/community/<id>`: "Sign in to open this community" with a Sign in button that opens the sign-in screen, no Hub request at all, light and dark (`r2-strip-so.png`). Signed-in cold start into the room still works.
4. FIXED. 2100-character message: "That message is too long. Shorten it and send it again." with Edit and Remove, no Send again; nothing posted and no charge (`edge-long-light.png`, balance 47 to 47).
5. FIXED. New `useRoomMessages.test.tsx`: removing the guard in `send` alone fails a test, removing the guard in `run` alone fails a test (re-run by me on both mutants, 1 failed of 3 each). Round 1's mutation set is otherwise unchanged (11 of 14 killed then, now 13 of 14: the third survivor, both guards removed together, was killed by the Composer's own gate in round 1 after the Composer guard was also removed and is covered by the same tests).

New finding:
12. `defect` (low, test): `CommunitiesView.test.tsx` "a user who is in no room sees where rooms will be, and the rooms they could join" asserts `getByText('Afrobeats producers')` straight after the "none" text appears, before the suggestions have loaded. It passed in round 1, passed in a clean full run and in an isolated run, and failed once in a full run while other sessions were using the CPU ("Unable to find an element with text: Afrobeats producers"). WORKFLOW section 10: a flaky suite is fixed, never retried to green. Fix: `await findByText` for the suggestion.

Findings 6 to 11 stay with the lead and the owner, unchanged.

**Result: round 1 defects 1 to 5 all fixed and confirmed. One new low defect (12, flaky test). Status stays `building` until 12 is fixed; no app behaviour is open.**

### Verifier report, round 3 (10 Oct 2026)

Fresh session, wrote none of this code. Mobile `wmt/INBOX-05` at 9f7bab1 and backend `wmt/INBOX-05` at 715807d, each trial-merged with `origin/main` in a throwaway worktree (local, never pushed, deleted afterwards). Mobile main was d1a4a89 when I merged (it moved to 603bd29 while I worked: docs only, same two conflicts, no source change). Backend main was 12e18e3, then 7b4ffef (JOIN-01 round 4, with a new migration); the backend checks below were re-run on 7b4ffef. The brief calls Communities "the second tab": in the built app it is the second chip of the Inbox tab (the bar is Home, Explore, Inbox, Wallet, Me), as artboard I1 draws it.

**Trial-merge conflicts.** Mobile: two files, `BACKEND_GAPS.md` (both sides added rows at the same place: G-450 to G-458 here, G-270 to G-273 on main; kept both, no duplicate id) and the generated `docs/PROGRESS.md` (regenerated with `check_tasks.py --write`); `SHARED-CHANGES.md` and `docs/LOG.md` merged by themselves with the INBOX-05 rows intact; no source file conflicts. Backend: none (`contract/openapi.json` merged by itself, but see finding 14).

**Setup.** Hub built from the merged backend on :6101 against Postgres `vi05r3_live_test`; the mock WAWU ID (backend `mock-wawu-id`) on :6104 behind a 30-line shim on :6102 that wraps the mock's token answers in `{ data }` the way the app reads WAWU ID's (the real WAWU ID was not run, see NOT RUN); Expo web export of the merged mobile tree on :6103; Chromium at 390 wide (and 320, 360, 430), light and dark; signed in through the app's own sign-in screen, no injected token. Every `vi05r3_*_test` database was dropped, the servers stopped by PID, the worktrees removed. Evidence folder: `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/vinbox05r3/` (`shots/`, `live/*.py`, `mut/`, `d12/`, `ns/`, `*.log`).

| Pass | Result | Evidence |
|------|--------|----------|
| D12 | CONFIRMED fixed, by its real cause | Alone: the test 20 times, 20 passes (`d12_alone.log`). In the full suite at load: 3 full runs of the branch (1472 tests each) at load average 21.5 to 26.4 (every 10 s sample at or above 8; other sessions supplied the load, I added none), the test passed all 3 times, 0 failures anywhere (`d12/load_runs.log`). Cause: the "none" row shows as soon as `GET /communities/mine` answers, and the suggestions are fetched only after that (`enabled: mineDone`), so a synchronous `getByText` raced the second request. Deterministic proof: the same test with the suggestions answer held 400 ms fails with round 2's message ("Unable to find an element with text: Afrobeats producers") under `getByText` and passes under `findByText` (`d12/probeOld.out`, `probeNew.out`; the probe files were not left in the tree). |
| V1 Gates | passed on the merged trees, one load flake recorded | Mobile merged with main d1a4a89: first `npm run check` exit 1 at machine load 10 to 20: tsc clean, lint 0 errors (7 warnings, none in these files), jest 2007 of 2009 passed, two 20 s timeouts in suites this task does not touch (`OpenWalletScreen.test.tsx` "a user sees a loading view first", `settingsScreens.test.tsx` Z3 notifications); those two files alone: 2 suites 128 tests pass; gates and tasks on their own: exit 0. Second full `npm run check`: exit 0, 118 suites 2009 tests, gates "files scanned: 483, 0 fail", tasks 271 (`check-merged.log`, `check-merged2.log`, `merged-rerun-failed.log`). Backend merged with main: `tsc --noEmit` exit 0 (on 12e18e3); INBOX-05 specs (`community-discover` 12 tests, `community-discover-routing` 3) together with `src/community`, `src/community-message` and `route-shadowing.regression.spec.ts`: 9 suites 141 tests pass on 7b4ffef (private network namespace, own mock on :4001); protected suite `run.sh --fresh HEAD` against the main lock: 253 of 253 passed, "all 244 required tests passed", code 3dbd7fd, lock 7b4ffef; gates: the same 16 FAIL lines as main, the two outputs differ only in "files scanned" (1057 to 1059, the two specs); no added line matches the tripwire; no migration folder on the branch; `npm run contract:build` leaves `contract/openapi.json` changed (finding 14). |
| V4 Field trace | passed | Balance 48 in `CreditsState`, strip, header and `GET /credits` agree; one send 48 to 47 and one new row; the host's send 48 to 48 with `costInCredits` 0; a new account shows "0 WAWU Credits"; member counts 1,204 (room header) and "1.2K" (list), 2.1K, 640 are the server's `memberCount`; unread 4, 1, 1 are the server's `unreadCount` and clear when the room is opened; "You:", first names, "No messages yet", the Host tag (from `hostWawuId`) and times follow the data. No naira on any captured screen. |
| V5 Picture | passed, with the differences listed here | `render_design.py I24 I25 I26 I27 I35` beside the app at 390, light and dark: `shots/cmp-I24-{light,dark}.png`, `cmp-I25-*`, `cmp-I26-*`, `cmp-I35-light.png` (artboard left, app right). Page colour (246,245,248), strip, section labels, row spacing and type, lock, Host pill, bubbles, composer, Send pill, header pill and the zero-credit warning tone match. Differences, all recorded: "1 credit per message you send", "Message · 1 credit", "Send · 1" (no API serves the price to the app, G-450, see finding 17); Buy (INBOX-13), Ask (INBOX-14), the Paid DMs and Money chips, the two header buttons and the FAB (other tasks); the composer's + (G-457); group pictures (my rooms have none, so the tile glyph shows); the shared `Coins` glyph is mirrored against the artboard's (fenced, finding 9 of round 1). No horizontal scroll at 320, 360 and 430 (`h-I24-*`, `h-I25-*`). |
| V6 States | passed | Each by its real cause. Loading: every Hub request held 7 s, I24 and the room, light and dark (`b-*-loading-*`). Network cut: the Hub stopped, "No connection. Check your internet and try again." with the strip "Your balance could not be read", then the Hub started and one Try again recovered (`c-I24-net-*`). Real 500: the membership table renamed in the database, "Something went wrong. Please try again.", recovery after the table came back (`c-I24-500-*`). Balance only: `/credits` aborted, the list loaded, the strip said so, and it read "48 WAWU Credits" after leaving and coming back (`c-I24-credfail-*`). Room 500 (membership and message tables renamed): "Couldn't open this community", ONE Try again opened the room with its messages and no second error (`d-room-500-*`). Empty: no community in the database, "No communities yet", light and dark; none joined: "You have not joined a community yet." with the suggestions, from a brand-new account whose empty Inbox offered Browse communities (`f-*`). No credits: balance 0 in the database, the header pill turns to the warning tone, the server's sentence "You are out of WAWU Credits. Buy more to keep messaging in this community." shows with Send again and Remove, nothing charged, no row (`d-zero-light.png`, `h-I26-zero-dark.png`). |
| V7 Flow walk | failed (finding 13) | As member (Adaeze), host (Zainab: sends free, balance 48 to 48, Host tag), non-member by link (open: Join, joined, landed in the room, `joined` in the database; private: no button; pending request: told it is with the host; unknown slug: "This link doesn't lead to a community"), join from the list in one tap (the room opens, membership `joined`), a brand-new account, a signed-out visit. Live delivery from the Inbox: 0.07 s. A cold start straight into a room: no live connection (finding 13). |
| V9 Live seam | passed | Real sign-in screen against the local Hub and a WAWU ID stand-in; values only the server holds (balances, counts, unread, role and cost from `/communities/:id/room`) and writes seen in the database. |
| V10 Device | NOT RUN | Unchanged: needs the owner's Android phone and a tester build (RELEASE-xx, docs/BUILDS.md). |

**Round 1 defects 1 to 5, re-run on the merged tree: all five stay closed.**
1. CONFIRMED. `/credits` aborted, Communities opened (strip "Your balance could not be read"), restored, left and came back: "48 WAWU Credits" within 4 s (`c-I24-credfail-recovered-light.png`).
2. CONFIRMED. Real 500 on the room (two tables renamed), one tap on Try again: header, messages and composer, and no `room-messages-error`.
3. CONFIRMED. Signed-out `/community/<id>`: "Sign in to open this community" with a Sign in button; zero requests to the Hub (recorded); `/c/<slug>` signed out says the same (`e-signedout-*`).
4. CONFIRMED. A 2100-character message: "That message is too long. Shorten it and send it again." with Edit and Remove, no Send again; balance stayed 47, no row (`d-long-light.png`).
5. CONFIRMED. Removing the guard in `send` alone fails 1 test, removing the guard in `run` alone fails 1 test (`mut/G1.out`, `mut/G2.out`).

**R-47 on the merged tree.** No do-nothing entry on the Communities screens: no `unbuilt(` in `src/features/communities`, `src/features/inbox`, `src/app/community`, `src/app/c`; every pressable in them has a handler; the Inbox shows the chips All and Communities only (the other chips, the header buttons and the FAB are not drawn); Buy and Ask are not drawn. The one inert thing is a private room in Suggested (a row with its lock and no way in, finding 18). The merged tree does carry other tasks' inert entries (15 `unbuilt_entries` warnings from the gate: Wallet, Explore, Events, Create; FIX-29 removes them), none in INBOX-05's files.

**Mutants of my own** (single-line edits by `mut/mutate.py` in the branch worktree, `npx jest src/features/communities`, 87 tests, restored after each; the worktree was clean afterwards):

| # | Mutant | Result |
|---|--------|--------|
| M1 | credits shown as naira (`₦48`) | killed (5 tests) |
| M2 | strip shows the balance plus one | killed (4) |
| M3 | send does not trim the words | killed (1) |
| M4 | composer ignores `busy` | killed (1) |
| M5 | no balance read after a send | killed (3) |
| M6 | a 402 is not recognised (401 instead) | killed (1) |
| M7 | the "did it land" check ignores the messages held before | SURVIVED |
| M8 | a 5xx is not treated as "may have been stored" | SURVIVED |
| M9 | low-balance tone at 1 instead of 0 | SURVIVED |
| M10 | the person's own pending message gets the Host tag when they are not the host | SURVIVED |
| M11 | no balance read after a 402 | killed (1) |
| M12 | unread badge capped at 9 instead of 99 | SURVIVED |
| M13 | `busy` never true | killed (1) |
| M14 | read mark sent while the room is not on screen | SURVIVED |
| M15 | Edit puts back empty words | killed (1) |
| M16 | credits count not floored | SURVIVED, equivalent (the server sends whole numbers) |
| G1, G2 | each hook guard removed alone (defect 5) | both killed |
| B1 to B8 | backend: suggested ignores hidden hosts, ranks fewest first, host pays, pending reads as none, offers a room already asked for, count ignores the caller, room view skips the hidden-host check, message-cost states 2 | all 8 killed by the two INBOX-05 specs (`be-mutants.txt`) |

Mobile: 16 mutants, 9 killed, 6 survived, 1 equivalent; backend: 8 of 8 killed. The survivors are findings 15 and 19.

**Findings (new)**

13. `defect` (medium, I25, V7): a room opened without the tabs underneath has no live connection. The only callers of `retainLive()` are `useInboxUnread` (the tabs layout) and the legal chat; `RoomScreen` and `useRoomMessages` listen with `onLiveEvent` but never keep the socket up. Reproduce: sign in, then load `/community/<id>` directly (a reload, or a cold start through a room link `wawu/c/<slug>`), have another account post: no `WebSocket` is opened (Playwright records none) and the message does not appear in 20 s, while the same room opened from the Inbox shows it in 0.07 s (`live/walk_cold.py`, `shots/g-live-cold-light.png`). Back from such a room goes to the Inbox, which then connects. On a phone the same applies to a room link or any room that is the first screen (native not run). The tests fake `onLiveEvent`, so they cannot see it. Fix inside `src/features/communities/`: retain the connection while a room is on screen, and add a test that mounts the room alone and expects the connection to be retained.
14. `defect` (low, backend contract, lead rule "contract:build leaves openapi.json unchanged"): on the merged backend `npm run contract:build` changes `contract/openapi.json` by one line, the enum of `CommunityRoomView.role`: committed `pending, host, none, member`, regenerated `pending, none, host, member` (same output twice on 12e18e3 and once on 7b4ffef; on the branch alone it regenerates unchanged). The order of a union depends on what else is in the compiled program. Fix: regenerate in the merge commit with main, or declare the role as one named list so the order cannot move (`src/community/rooms/community-room.type.ts`).
15. `defect` (low, test gap, sending path): M7 and M8 show that two protections against a double charge have no test. After a send with no usable answer, "Send again" first reads the newest page for a message of the person's own with the same words that they did not hold before (M7: without the "did not hold" part, an earlier identical "ok" would be taken for the new one and the new message never sent); and a 5xx counts as "may have been stored" (M8: without it a stored-but-500 message is posted twice and charged twice). The round 2 tests use a network cut only and no earlier identical message. Fix: one test for each.
16. `defect` (low, I24): when the Hub cannot be reached the first time Communities opens, `GET /users/me` fails with the rest; after Try again the list loads but the person's own last messages read "Adaeze: How long did CAC..." (their own first name) instead of "You: ...", until the view is left and reopened (`useMe` has `staleTime: Infinity` and nothing reads it again). Evidence `shots/c-I24-net-recovered-light.png`. Fix: read the profile again with the list's retry, as the balance is.
17. `unclear` (for the lead, integration): backend `wmt/INBOX-05` (715807d) adds `GET /communities/:id/room` (role and `messageCostInCredits`), `GET /communities/message-cost` (`creditsPerMessage` 1) and `GET /communities/suggested` (most members first, then name; not hosted, joined, asked for or hidden). This task file does not mention that branch ("No backend change"), the app calls none of the three routes, BACKEND_GAPS G-450 (price not served) and G-451 (no suggestion rule) still say they are open, and the drawn "1 credit per message you send", "Message · 1 credit" and "Send · 1" stay left out. The app lists Suggested alphabetically from `GET /communities` and drops joined rooms on the phone. I checked the routes live (roles host, member, none and pending; cost 0 for the host and 1 otherwise; 401, 400 and 404 answers; page limits 1 to 100 and 1000 pages) and 5 parallel sends at a balance of 2 gave 2 posts, 3 refusals (402) and balance 0, so the server side holds. Needs a decision: wire the three routes (and close G-450 and G-451) or drop the backend branch. Until then the backend adds routes nobody calls (WORKFLOW: additive until the old path has no callers).
18. `unclear` (R-47, borderline): Suggested lists a private room as a row with a lock and no action, because Ask is INBOX-14's; tapping it does nothing. It is a room, not an entry to an unbuilt screen, and the row says "private". If the owner reads R-47 strictly, private rooms leave Suggested until INBOX-14.
19. `note` (test gaps that matter less): M9 (the warning tone at zero credits, seen working in `d-zero-*`), M10 (the Host tag on the host's own pending message), M12 (badge cap 99) and M14 (read mark only while on screen) have no test.
20. `note`: `src/features/communities/Composer.tsx` is now one of two local composers (the legal chat has its own); SHARED-CHANGES INBOX-05 #1 asks to move it to `src/components/` and no shared one exists on main, so it is not a stand-in. `GET /credits` still serves `trialEndsAt` (the seeded 7-day trial; the product has had no trial since 21 Sep); the app ignores it.

Findings 6, 7, 9, 10 and 11 of round 1 stay with the lead and the owner, unchanged; 8 stands as recorded.

**NOT RUN.** V10 and native phone behaviour (keyboard, list pinning, and whether a deep link opens the room without tabs, which finding 13 assumes from the code): unblocks with a signed Android tester build (RELEASE-xx). The real WAWU ID (a stand-in of the mock plus a shape shim was used): unblocks with a wawu-id worktree and its own `npm ci` (about 700 MB; disk had 3 GB). The full backend suite (not in the brief; the community and message suites, route shadowing and the protected suite ran). The first run of `route-shadowing.regression.spec.ts` inside the namespace failed 8 of 8 with "fetch failed ... other side closed" on its first call to the mock (a start-up race of the stand-in on :4001); alone it passes 8 of 8 and it passed again in the group of 9 suites.

**Result: FAIL, status stays `building`.** Open: 13 (medium), 14, 15, 16 (low). For the lead and the owner: 17, 18. D12 and defects 1 to 5 are closed.

### Builder report, round 4 (10 Oct 2026)

Builder (Sonnet), fresh session. Mobile `wmt/INBOX-05` from db7b5f2 and backend `wmt/INBOX-05` from 715807d, each with `origin/main` merged first (mobile main 603bd29, backend main 7b4ffef; merge commits, no rebase). **Merge conflicts:** mobile, two files: `BACKEND_GAPS.md` (both sides added rows at the same place, G-450 to G-458 here and G-265 to G-273 on main: both kept, no duplicate id) and the generated `docs/PROGRESS.md` (regenerated with `check_tasks.py --write`, with `tasks/INDEX.md`); `SHARED-CHANGES.md` and `docs/LOG.md` merged by themselves. Backend: none.

**Setup.** Hub built from the backend worktree on :6101 against Postgres `bi05r4_live_test`, the backend's mock WAWU ID on :6104 behind a 30-line shim on :6102 that wraps its token answers in `{ data }` (as round 3's verifier did), Expo web export of the tree as it was before my source changes (`dist-pre`) and after (`dist-post`) on :6103, Chromium at 390 x 844 (2x), signed in through the app's own sign-in screen. Each defect was reproduced on `dist-pre` (or on the unchanged tests) first, then shown fixed on `dist-post`. Evidence folder: `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/inbox05r4/` (`live/*.py` the scripts, `shots/pre` and `shots/post` the pictures, `mut/` the mutants, `ns/` the backend runs, `d13-pre.json`, `d13-post.json`, `d16-*.json`, `readon-post.json`, `states-post.json`).

| # | Closed how | Reproduced before | Proved after |
|---|------------|-------------------|--------------|
| 13 (medium) | `useRoomMessages` calls `retainLive()` when the room mounts and releases it when it unmounts (ref-counted, so under the tabs it is a second hold). | A reload on `/community/<id>`, a cold start through `/c/<slug>` (`wawu/c/<slug>`) and the app opened straight onto the room (what a push tap does): no WebSocket opened, a message from Chidi not shown in 20 s, on all three. Control from the Inbox: 0.22 s (`d13-pre.json`). | Same three paths: a socket opens on each, the message shows in **0.15 s, 0.14 s and 0.10 s** (control 0.10 s) (`d13-post.json`, `shots/post/reload.png`, `link.png`, `deeplink.png`). Tests: a room mounted alone opens the socket, shows a socket message and closes it on unmount; leaving a room does not close a connection the Inbox still holds. The live tests no longer call `retainLive()` themselves (that is what hid the defect). Mutants: no retain (8 tests fail), no release (9 fail). |
| 14 (low, backend) | `CommunityViewerRole` is a TypeScript enum (`Host, Member, Pending, None`), not a union of string literals: an enum's members are created together in the order written, so the generator cannot reorder them (a literal union is listed in the order the compiler first met each literal). Contract regenerated and committed. | `npm run contract:build` on the merged backend changed one line: `pending, none, host, member` for `CommunityRoomView.role` against the committed `pending, host, none, member`. | `contract:build` run twice on the final source: `contract/openapi.json` **byte-identical** (`cmp`), enum `host, member, pending, none`; the contract is synced to mobile. G-54 (the generator is not deterministic in general) stays open: this fixes the one enum by its source. INBOX-05 specs and `route-shadowing` pass with the enum (wire values are the same strings). |
| 15 (low, tests) | Three tests in `RoomScreen.test.tsx`: an earlier message of the person's own with the same words is not taken for the one that did not land (M7); a 500 may have stored the message, so Send again looks first and posts once (M8); a 429 is sent again without looking (the other side of the rule). | M7 and M8 applied to the round 3 tests: both SURVIVED (87 of 87 pass) (`mut/M7-pre.out`, `M8-pre.out`). | Same mutants: **both KILLED**, one failing test each (`mut/M7-post.out`, `M8-post.out`). |
| 16 (low, I24) | `CommunitiesView` reads the person's profile again with the list's Try again, the suggestions' Try again, return to the view and pull to refresh, when it had failed (`recover`), as the balance is. | Hub down at first open, then up, Try again: "SEEDED: WAWU Founders Circle / Adaeze: How long did CAC actually take for you all?" (`d16-pre.json`, `shots/pre/recovered-light.png`). | Same steps: "You: How long did CAC actually take for you all?" (`d16-post.json`, `shots/post/recovered-light.png`). Tests: Try again after an unreachable Hub shows "You:"; a profile that failed while the list loaded is read again on pull, and a known profile is not asked for again. Mutants: no profile read on recover, none on pull: both killed. |
| 17 (integration, closes G-450 and G-451) | The room screen reads `GET /communities/:id/room`; its composer states the price from the room view (`Message · 1 credit`, `Send · 1`); I24's strip states `GET /communities/message-cost` (`Reading is free · 1 credit per message you send`); Suggested reads `GET /communities/suggested` (server order, most members first, nothing dropped on the phone). Loading, error and recovery for each by real causes (below). The old `GET /communities`, `GET /communities/:id` and `GET /communities/:id/membership` calls are removed from the app (the room view's `role` says `pending`). | `shots/pre`: strip "Reading is free", field "Message", button "Send", Suggested by name with the private room (`shots-pre.json`). | `shots/post`, light and dark: strip, field and button carry the server's figures; a different figure (2 and 3 credits) is shown as sent (tests); the host's field and button carry none (the host pays nothing). Price loading (every answer held 6 s): "Reading is free", then the price arrives; price cut at the network: "Reading is free" and no figure; leaving and coming back reads it (`states-post.json`, `strip-price-*`). Room loading held 6 s (`room-loading-*`). Real 500 (the membership table renamed in the database): "Couldn't open this community" and "Couldn't load communities", ONE Try again recovers the room with its messages and no second error, and the list (`room-500-*`, `I24-500-*`, `room-recovered-*`, `I24-recovered-*`). |
| 18 (R-47) | Suggested lists open rooms only: the private row had a lock and no action (Ask is INBOX-14's). A page of only private rooms is followed by the next one without scrolling; the empty state waits until no page is left. INBOX-14 removes the filter and adds Ask. | `shots/pre/I24-*.png`: "Founders under 30 / 640 members · private" listed, inert. | `shots/post/I24-*.png`: not listed. With 20 private rooms of 2,200 members each ahead of it in the database, the first page holds no room to join; the app asked page 1 and then page 2 on its own and listed "Afrobeats producers" with no scroll, no empty state, no private row (`readon-post.json`, `readon-*.png`). Tests: not listed; an all-private page is read past; every suggestion private shows the empty state; no empty state while a page is still on its way. Mutants: filter off, no reading on, empty state too early: all killed. Backend filter: no, see G-623. |

**Pictures** (`shots/post/`, 390 wide, artboard left and app right in `cmp-*`): `cmp-I24-{light,dark}.png`, `cmp-I25-{light,dark}.png`, `cmp-I26-{light,dark}.png` (rendered with `python3 scripts/design/render_design.py I24 I25 I26`); the strip, field and button now read as drawn ("Reading is free · 1 credit per message you send", "Message · 1 credit", "Send · 1"). States, light and dark: `strip-price-loading`, `strip-price-error`, `strip-price-recovered`, `room-loading`, `room-500`, `room-recovered`, `I24-500`, `I24-recovered`, `readon`, `host`. Before: `shots/pre/`. Not drawn, as before and for the same reasons: Buy (INBOX-13), Ask (INBOX-14), the other chips, the header buttons and the FAB, the composer's + (G-457). The shared `Coins` glyph is still mirrored against the artboard's (fenced).

**Decisions (agent defaults, owner may override).** (1) The composer's figure is the room view's `messageCostInCredits`, not `GET /communities/message-cost` read in the room: it is the price for that person in that room (1 for a member, the same number the backend spec pins against `message-cost`; 0 for the host, who sends free), so the field never says "1 credit" to someone who pays nothing. `message-cost` feeds I24's strip, where there is no room. Both routes are called. (2) The host's field and button read "Message" and "Send" (no figure); the coin on Send stays as drawn. (3) The room view's `role` replaces the separate membership request on the not-member page (`pending` is told "Your request is with the host"). (4) The suggestions still wait until "Your communities" has every page (so the person's own rooms never arrive above them), but the phone no longer drops joined rooms itself: the server leaves them out. (5) A room holds the connection while it is mounted, not only while focused, as it keeps its listeners while mounted. (6) The branch contract was copied from the backend worktree (`sync_contract.py --backend` copies only `origin/main`), `SOURCE_COMMIT` reads `wmt/INBOX-05@1cabfe3` (SHARED-CHANGES INBOX-05 #2). (7) G-450 and G-451 closed with the route named; G-623 (new) records finding 18: the backend should not filter private rooms, and may add an optional `?kind=open`.

**Checks.** Mobile `npm run check` exit 0 on the code head 192b992 (`check1.log`): tsc clean, `expo lint` 0 errors (7 warnings, none in these files), jest 118 suites 2024 tests all pass (no flake: `eventsScreens.test.tsx` passed in the full run), gates "files scanned: 483, 0 fail, 16 warn" (other tasks' inert entries, none in INBOX-05's files), baseline 0, tasks 271. Communities and Inbox suites: 9 suites 161 tests. The "Jest did not exit one second after the test run" notice on `RoomScreen.test.tsx` alone is the same on the round 3 head (checked on a throwaway worktree, removed). Backend: `tsc --noEmit` 0; eslint on the two changed files 0; INBOX-05 specs (`community-discover` 12 tests, `community-discover-routing` 3) with `src/community`, `src/community-message` and `route-shadowing.regression.spec.ts`: 9 suites 141 tests, 8 suites passed and `route-shadowing` failed 8 of 8 inside the private network namespace on its first call to the stand-in on :4001 ("other side closed", the start-up race round 3 recorded), and the same file passed 8 of 8 on its own, together with the two INBOX-05 specs (3 suites 23 tests); protected suite `scripts/protected-routes/run.sh --fresh HEAD`: **253 of 253**, "all 244 required tests passed", lock unchanged; gates `scripts/gates/run.py`: the same 16 FAIL lines as main, the output differs from main's only in "files scanned" (1059 against 1057: the two specs); no added line matches the tripwire; no migration on the branch; `contract:build` twice byte-identical; contract synced to mobile (types regenerated).

**Secret scan** of both staged diffs: no key-shaped string (long runs, `sk_`, `FLWSECK`, bearer tokens, private-key headers). No real payment provider, `wawuafrica.com` host or AI provider was called; every database `bi05r4_*_test` is dropped and every worktree removed.

**NOT RUN.** (a) The push notification entry path on a phone: the app has no push receiver yet (no `expo-notifications` in `src/`; INBOX-03 built the Hub's side), so the path was run as what a tap opens, a cold start straight onto `/community/<id>`; unblocks with INBOX-21 (the app's side of push) and a signed Android tester build (RELEASE-xx, docs/BUILDS.md). (b) V10 and native phone behaviour (keyboard, list pinning): needs that build. (c) The real WAWU ID (a stand-in of the mock plus a shape shim was used): unblocks with a wawu-id worktree and its own `npm ci` (about 700 MB; disk had 1.5 to 2.6 GB). (d) The full backend suite (not in the brief): the community and message suites, route shadowing and the protected suite ran. (e) Mutants M9, M10, M12 and M14 of round 3 (finding 19, notes): not in this round's brief, left as they were.

**Status: `verifying`.** Mobile and backend pushed to `wmt/INBOX-05`.

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
