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

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
