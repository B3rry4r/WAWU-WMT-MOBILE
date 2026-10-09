---
id: LEGAL-02
title: Legal: chat, profiling, brief, consultant joins
owner: DEV3
area: LEGAL
order: 66
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: verifying
depends_on: [LEGAL-01, INBOX-02, UI-02]
decisions: [R-14, R-37]
passes: [V1, V4, V5, V6, V7, V9]
artboards: [S14, S15, S16, S17]
---
# LEGAL-02 · Legal: chat, profiling, brief, consultant joins

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV3.md` (what you own)
- `DECISIONS.md`: R-14 (ruled; build what it says)
- The design: `python3 scripts/design/render_design.py S14 S15 S16 S17` then open `build/design_shots/`
- What the analysis found for these artboards: `docs/analysis/evidence/A6.json`
- `docs/designer/BRIEF.md` (the brief is part of the design, R-29; it has no entry for S14, S15, S16, S17, so those artboards stand, under its rules 3 to 8 on fees, refunds, licence lines and em-dashes)

## Goal

You own these screens AND the backend work behind them. Build the screens as the design draws them, in light and dark, against the real API.

## Scope

New files under `src/features/` for these screens and their route files under `src/app/` (no `_layout.tsx` edits; those belong to the route-graph tasks). Shared components, theme, API client and layouts are fenced: request changes in `SHARED-CHANGES.md`.

Book (S17) is added by LEGAL-04 (docs/WORKFLOW.md section 7).

## Artboards

- **S14 · Legal chat**: WAWU Legal Assistant opening chat: 'Tell me what's going on… then a consultant picks it up. Nothing is charged, and no price is quoted until a consultant has read it.' Quick replies: A tenancy problem / Register a business / Check a contract / Something else.
- **S15 · Profiling**: Assistant asks follow-ups about a 60% mid-lease rent rise (lease signed? time left? review clause?) with quick replies.
- **S16 · Brief**: Brief card for confirmation: Matter Tenancy · rent increase, Lease signed 14 months left, Rent review clause Not sure, Location Lekki, Lagos; 'Send to a consultant · Nothing is charged yet.' Add anything else.
- **S17 · Consultant joins**: Handover: 'Adaora joined. The assistant has stopped replying.' Consultant message, 'Book a consultation · Video, phone or in person', Book / Message Adaora.

## Added by later tasks

These entries are drawn on this task's artboards but lead to screens built by later tasks, so this task does
not build them. Each is added, exactly as drawn, by the task that builds where it leads (docs/WORKFLOW.md
section 7, R-27). The verifier reports their checks as belonging to that task.

- S17: Book (opens S18): added by LEGAL-04

## Capability checks

- [ ] **S14**: a user can type the problem; pick a quick reply.
- [ ] **S15**: a user can answer in free text; tap quick replies.
- [ ] **S16**: a user can Send to a consultant; Add anything else.
- [ ] **S17**: a user can Message Adaora, and the consultant's messages arrive without a refresh (INBOX-02).
- [ ] Each artboard above matches its render in light and dark, compared picture with picture (V5).
- [ ] Every value on screen comes from the API or the user, never a literal. Anything the API does not serve yet is in `BACKEND_GAPS.md`.
- [ ] Loading, empty and error states exist and are entered by their real cause (V6).

## What the backend serves today (from the analysis)

- **S14**: partial. Missing: The backend's assistant chat (legal-chat.service.ts, Gemini) opens ONLY after a consultation is paid (OPEN_FROM = consultation_scheduled…; send() throws 'This conversation opens once your consultation is paid for.'). Free pre-payment profiling is the structured questionnaire legal-intake (matters → answers → complete → brief), not a chat. Board makes chat the intake; needs the assistant reachable on an intake (not a paid LegalRequest) and AI-driven profiling that fills LegalIntake answers.
- **S15**: partial. Missing: Questions exist as a fixed set; no AI that asks them conversationally before payment (see S14).
- **S16**: served.
- **S17**: partial. Missing: Handover-stops-AI is implemented, but the thread is keyed by a LegalRequest and opens only after consultation payment; on the board the consultant joins BEFORE any payment. Consultant name/avatar not modelled (replies are authorRole 'consultant', no consultant id).

A missing or partial row is yours to fix in the backend as part of this task (or the backend task listed in depends_on, check its owner in the task file). Never change the screen to fit the API.

## Figures on these artboards are not facts

Do not hard-code any of these. Show what the API returns, or leave the figure out and file it.

- S14: 'Nothing is charged, and no price is quoted until a consultant has read it.'
- S16: 'Nothing is charged yet.'

## Designer notes (⚠, unresolved)

- S14: “From the code: it starts with a chat. The assistant profiles the problem and writes a brief. When a consultant replies, the assistant stops for good. No price until a consultant has read it. Fees are placeholders ⚠.” Answered: R-14. Show the admin-set price; do not stop.

## Builder report

Builder, 8 Oct 2026 (resumed after a crash; the earlier session's work reviewed and kept). Mobile `wmt/LEGAL-02` merged with main `8cabe72`+; backend `wmt/LEGAL-02` (PR #95) merged with backend main `9d90d57`.

- **Files.** New: `src/app/legal.tsx`, `src/features/legal/` (`api.ts`, `model.ts`, `draft.ts`, `look.ts`, `parts.tsx`, `LegalChatScreen.tsx`, tests), `src/features/home/Services.tsx`. Changed: `TodayScreen.tsx` (adds `Services`), `TodayLoading.tsx` (one tile shape per tile present), `HomeScreen.test.tsx` (Legal no longer in the "not built" list; new Legal tile tests). Backend: `legal.thread` live frame (SHARED-CHANGES LEGAL-02 #4).
- **S14 to S16.** One conversation (`/legal/assistant`, LEGAL-01): the opener and taps the Hub writes, typed words and taps sent by id, the brief rows as served, Send to a consultant, Add anything else as a message. Tests in `LegalChatScreen.test.tsx` (S14, S15, S16 blocks).
- **S17.** Header, "joined" notice and name label come from `consultant`/`consultantName`; the notice stands before the consultant's first message wherever it falls (mid-chat). Message Adaora writes to the messages route. New messages arrive without a refresh on the `legal.thread` frame, on live reconnect, on focus and on foreground (tests, and backend spec `live-legal.contract.spec.ts`). Book and its card are LEGAL-04's.
- **States, by real cause.** Loading skeleton; open fails offline / Hub error with Try again; 503 `assistant_unavailable` keeps the message and offers Ask again; 409 busy re-reads; a failed send puts the words back in the box in front of anything typed since, with inline Try again (none where retrying cannot work); double tap and double Send send once (ref guard); a failed refresh keeps the conversation and typed text; drafts kept across leave and return. "Empty": a person with no conversation gets a new one. Model tests kill the state branches (`model.test.ts`).
- **Hub entry (R-41).** The Legal tile in "What would you like to do today?" opens `/legal`, packed from the left (U-H1). EVENTS-01 (PR #14) builds the same row: merge note SHARED-CHANGES LEGAL-02 #5.
- **Pictures.** Web screenshots at 2x, light and dark, against the Hub's legal module on a test DB with a scripted AI stand-in (no GEMINI_API_KEY locally), beside `render_design.py S14 S15 S16 S17`. Not claimed to match; the verifier decides. Known difference: S16's "Nothing is charged yet." is left out (G-500).
- **Gaps filed.** G-500 (S16 line not served), G-501 (no route for the current conversation once sent), G-502 (LEGAL-03 deliverable lines send no live frame). Shared changes LEGAL-02 #1 (`_layout.tsx` guard), #3 (`toApiError` reads `reason.retryAfterSeconds`), #4 (backend live), #5 (services row merge); #2 not needed (contract already current on main).
- **Ran.** Mobile: tsc 0; legal + home jest 107 passed; `npm run check`: typecheck and lint pass, jest 1509 of 1509, gates 0 fail / 0 warn / 0 accepted (366 files), task check failed only because PROGRESS.md was stale from this report's own edit, then `npm run tasks -- --write` and `npm run tasks` pass. Backend: tsc 0; `src/live` + `src/legal-intake` 165 passed, 4 skipped; `src/legal/` + new spec 306 passed; gates 16 fail / 69 warn / 76 accepted on the branch and on main alike (no new finding).
- **NOT RUN.** Native iOS/Android build (web only); a real Gemini assistant (no key locally; profiling pictures used the stand-in).

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

Verifier session, 8 Oct 2026, fresh (did not build this task). PARTIAL REPORT, in progress: passes not listed below are still running.

| Pass | Result | Evidence |
|------|--------|----------|
| V1 | passed: mobile `59d7523` already contains origin/main `e1c975a` (nothing to merge, no conflict markers); `npm run check` exit 0: 85 suites, 1,509 tests, gates 9 run, 366 files scanned, 0 fail / 0 warn / 0 accepted, task check pass. Backend `e5c41f0` already contains origin/main `9d90d57`: `tsc --noEmit` 0, eslint on the changed files 0, gates 994 files 16 fail / 69 warn / 76 accepted with no finding in any changed file, `src/live` + `src/legal-intake` 8 suites 165 passed, 4 skipped | scratchpad `legal02v/check.log`, `be-*.log` |
| V9 | in progress; first finding below (D1) | `legal02v/walk-light.log` |

**D1 (defect).** The consultant's message does not arrive without a refresh. Live run: the Hub sends `{"type":"legal.thread",...}` on the client's socket the moment the admin ops route writes the consultant's message (frame captured), but the screen makes no request and shows nothing for 15 s; only a reload shows "Adaora joined..." and the message. Cause: the shared live client `src/features/inbox/live.ts` `onMessage` hands listeners only `chat.message`, `chat.read` and `community.message`; any other frame type is dropped, so `onLiveEvent` never calls the screen's `isLegalLiveEvent` check. The screen test passes because it mocks `onLiveEvent`. The S17 capability check ("the consultant's messages arrive without a refresh") fails.

## Builder report, round 2

Builder session, 9 Oct 2026, fix round 1 for D1.

- **D1 fixed.** `src/features/inbox/live.ts` is not fenced (WORKFLOW section 4 lists `src/theme`, `src/api`, `_layout.tsx`, `src/components`, config and `scripts`; `src/features/**` is not on it), so the task changes it directly, no SHARED-CHANGES row. `onMessage` now hands a `legal.thread` frame to `onLiveEvent` listeners (4 lines). It never moves the chat catch-up cursor (the frame is socket only and not in `GET /live/catch-up`), and it carries no words: the screen reads the conversation itself.
- **Test with nothing mocked on the live path.** New `src/features/legal/__tests__/LegalLive.test.tsx` renders the real screen over the real shared live client with a fake `WebSocket` transport, feeds the frame string `{"type":"legal.thread",...}` a Hub sends, and asserts a second read of the conversation and the consultant's message on screen; a second test shows an unknown frame type changes nothing. Proved: with the old `live.ts` restored from HEAD the first test fails (2 run, 1 failed), with the fix both pass.
- **Live run against a real Hub** (backend `wmt/LEGAL-02` at the merge `7d69556`, mock-wawu-id, `npm run web` equivalent on 4247, DB `wawu_hub_test_legal_02_f`, dropped after). A real admin login wrote the consultant message through `POST /legal/ops/intakes/chat/:id`: the Hub sent the `legal.thread` frame and the message and the "joined" notice were on screen 72 ms later with one `GET /legal/assistant/:id` and no refresh. Screenshot `legal02f/app-S17-light.png`. The local setup needed a `GEMINI_API_KEY` placeholder and the verifier's Gemini stand-in (no key exists locally; the assistant's turns are not under test here) and the `{data}` envelope wrapper on the mock's `/auth/*`.
- **Frame authorization (backend).** `LiveDispatcher.legalThread` sends only to the matter's own client (`LegalRequest.wawuUserId`), after checking the message is a consultant's on that matter. Already covered by `live-legal.contract.spec.ts` ("another person's socket is sent nothing", "wakes nobody"); no new spec needed.
- **Merges.** origin/main merged into both branches (backend clean, contract unchanged after `npm run contract:build`; mobile conflicts in BACKEND_GAPS, SHARED-CHANGES, PROGRESS, Services, TodayScreen and HomeScreen tests resolved). The services row now holds Events then Legal; the Home tests that counted one tile now count two and one new test taps Legal. `docs/PROGRESS.md` regenerated.

## Verifier report, round 2

Verifier session, 9 Oct 2026, fresh (did not build this task). Mobile verify branch `verify-legal-02b` from `b74b7be`; backend `7d69556`. Complete. Two defects open (D2, D3), so the status is `building`. Not run: V10 (no GEMINI_API_KEY anywhere; the builder's pictures and my runs used a verifier stand-in for the model, so real Gemini answers were not exercised); native iOS/Android (web only).

| Pass | Result | Evidence |
|------|--------|----------|
| V1 (as it will land) | passed: origin/main merged into mobile (20 new commits; the only conflict was generated `docs/PROGRESS.md`, regenerated with `npm run tasks -- --write`; no conflict markers anywhere); `npm run check` exit 0: 101 suites, 1,744 tests, gates 0 fail, task check pass. Backend `7d69556` already contains origin/main | scratchpad `legal02v2/check.log` |
| D1 unit | passed: `LegalLive.test.tsx` with the old `live.ts` (`git show 9c7ffad^:...`) fails (1 failed, 1 passed); with the fix both pass. inbox + legal + home suites 10 suites, 161 tests pass (`live.test.ts` covers chat.message, chat.read, community.message). Code read: `legal.thread` goes to `deliver` and never touches `cursor` or `pendingCursor`; `seenKey` is null for it, so it is not de-duplicated away; the only other listener (`unread.ts`) refreshes the unread count, harmless | this report |
| D1 live (V9) | passed: real Hub (backend `7d69556`, which already contains origin/main) from `dist`, **mock-wawu-id from the backend repo** (with the `{data}` envelope wrapper on `/auth/*`, as the real WAWU ID answers), the app on `expo start --web`, a real admin login (`ops-v@wawu.africa`) posting through `POST /legal/ops/intakes/chat/:id`. Light and dark: the consultant message and the "joined" notice on screen 61 ms and 66 ms after the post, one `GET /legal/assistant/:id`, no refresh. Backgrounded then foregrounded (visibility hidden, post, visible): the message shows after the foreground with a catch-up and one read (46 to 126 ms), and a post while the screen is open again shows in 46 to 63 ms | `legal02v2/walk-*.log`, `live2.js` |
| Frame scope | passed, two users asserted over real sockets: the matter's own client got exactly one `legal.thread` `{type,cursor,legalRequestId}` (no words); another user's socket got none, and the reverse for the second user's matter; `GET /live/catch-up` never lists it | `legal02v2/frames.js` output |
| Other live traffic | passed: with the Inbox tab open, a `chat.message`, a `legal.thread`, then a second `chat.message` arrived and the tab badge and `GET /inbox/unread` moved (1, 2, 3 total); no page error. There is no Inbox chat screen or row renderer in this build (rows are drawn by later tasks on main as well), so that was checked through the badge and the frames. Scratch test (not committed): after `chat.message` c2 then `legal.thread` c9, a background and foreground asks catch-up from `c2`, never `c9`; passes on the code and fails with a cursor-moving mutant | this report |
| V6 / rest of V9 | passed in a real browser, light: loading skeleton; offline open shows "You're offline" with Try again, and Try again opens it after the connection returns; Hub 500 on open shows "The assistant didn't open" with Try again; model failure (assistant 503) keeps the message on screen, shows "taking a while... Your message is saved" with Ask again, and Ask again gets the answer; a failed send (offline) puts the words back with inline Try again and the draft kept in front of what was typed after (`... extra`); double click on Send: 1 POST, 1 bubble; double tap on a quick reply: 1 POST; system Back and on-screen back both land on Home and the draft ("Draft words kept") is there on return; offline return keeps the brief, shows the stale note and the draft; double click on Send to a consultant: 1 POST; consultant joins live (above) and Message Ops writes to the thread and the admin side sees it | `legal02v2/states.log` |
| V4 | passed: no consultant name, price, fact or notice is a literal in `src/features/legal` (only comments mention Adaora); on screen the title "Ops V", "Ops joined", "Hi Lennox", the brief rows and the opener all come from the Hub | grep, screenshots |
| V5 | passed with two findings below: `render_design.py S14 S15 S16 S17 H1` at 780 px wide beside the app at 390 px, 2x, light and dark. S14 ink bands match the design exactly after the 100 px status bar (header 80 high, divider, bubble lines 27/28 high at a 41 pitch, chips 72 high at a 88 pitch, composer 88, all equal). S16 brief card: title to first row 61, row pitch 84, card to button 16, in both. S17 name label, joined notice and bubbles line up; the Book card is LEGAL-04's. Home: services row Events then Legal packed left, tile 60 square, tile pitch 131 and 132, label gap and glyph to label 104 px in both. Dark is the same tokens (S14 dark bands equal) | `legal02v2/cmp-*.png`, `bands.py` |
| Mutants (V6 logic) | 5 on the screen's state logic, `src/features/legal` jest: no double-send ref guard SURVIVED (71 pass; also in the browser with the guard removed a double click still made 1 POST, the disabled Send covers it, so the guard is defence in depth and not a defect); failed send loses the words killed (3 fail); 503 not kept killed (1); live-frame check inverted killed (4); server errors not retryable killed (1). A sixth, in `live.ts`, moving the cursor on `legal.thread`, SURVIVED the whole inbox and legal suites (see D3) | scratch copies restored with `git restore` |
| Odd inputs | client `POST /legal/assistant/:id/messages`: NUL 400, lone surrogates 201, 200,000 chars 413, empty 400, wrong types 400, bad JSON 400; bad ids 400/404. No 5xx on the client route or on the frame. One 5xx outside this branch: see F1 | `frames.js` output |
| Backend (as it will land) | passed: `7d69556` contains origin/main; `tsc --noEmit` 0; `src/legal`, `src/legal-intake`, `src/live` 18 suites, 466 passed, 4 skipped, 0 failed (with the mock WAWU ID running, which those specs need; a first run without it failed 6 suites on `fetch failed`, an environment fault); gates 1,012 files 16 fail, 70 warn, 76 accepted, the same counts as `origin/main` (1,011 files; the 16 are main's, none in a changed file); protected suite on a seeded DB: all 244 required tests pass (on an unseeded DB 5 learn/evg tests failed, unrelated to this branch); `npm run contract:build` leaves `contract/openapi.json` unchanged | `legal02v2/be-*.log` |

**D2 (defect).** Gap ids G-470, G-471 and G-472 are already taken on `origin/wmt/NUV-03` (BACKEND_GAPS.md: Nuvion identity rows). Both branches landing gives duplicate ids with different meanings. Main's highest is G-493, so these three are free on main only; the builder must take unused ids (and the references in the code, tests and this file move with them).

**D3 (defect, small).** The suites never check the rule the builder states for the new frame: that `legal.thread` does not move the catch-up cursor. A mutant that sets `this.cursor` from the frame passes all 121 inbox and legal tests, yet it would make a catch-up after a reconnect skip chat messages (it asks from the legal frame's cursor). The code is right today (my scratch test passes on it and fails on the mutant); add that assertion to `LegalLive.test.tsx` or `live.test.ts`.

**F1 (finding, not this task's).** `POST /legal/ops/intakes/chat/:id` with a NUL in `body` (`"a\u0000b"`) answers 500 (Postgres refuses the character). The client route rejects it with 400. This task only adds the publish after the write, so the 500 is on main's ops route (admin only); worth a one-line guard by the LEGAL-01 owner.

**F2 (finding, pre-existing on main).** Home "What would you like to do today?" heading: the app sets `fontSize` 18.5 but keeps the body variant's line height (about 21.75), where the canvas's `line-height: normal` at 18.5 is `canvasNormalLineHeight(18.5)` = 24; measured at 2x the gap above the heading is 4 px short and the gap below it 2 px short against H1. The same line is in `origin/main` `src/features/home/Services.tsx` (not introduced here); the tile label next to it does use `canvasNormalLineHeight`.

## Builder report, round 3

Builder session, 9 Oct 2026, fix round 2 for D2 and D3.

- **D2 fixed.** Highest gap id on mobile main and every origin wmt/* branch is G-493. This task's gaps are now G-500 (S16 line not served), G-501 (no route for the current conversation once sent) and G-502 (LEGAL-03 deliverable lines / `legal.thread` socket row), renumbered in BACKEND_GAPS.md, the Builder reports above and the code comments in `api.ts`, `model.ts`, `LegalChatScreen.tsx` and `live.ts`. Verifier reports are untouched.
- **D3 fixed.** New case in `src/features/inbox/__tests__/live.test.ts` (catching up): a real `legal.thread` frame through the real `LiveClient` with the fake socket reaches listeners but the next reconnect still catches up from the earlier `chat.message` cursor; a later `chat.message` moves it. Added only; no assertion edited. Mutant (`this.cursor = frame.cursor` in the `legal.thread` branch of `live.ts`, scratch edit restored by copying the original back) makes exactly that test fail (1 failed, 29 passed); passes on the real code (30 passed).
- **Merge.** origin/main already contained in the branch; no conflict markers.
- `npm run check`: exit 0.

## Hub entries this task adds (R-41)

The HOME-01 hub was built before this task, so the entries on it that lead to this task's screens are left out until now. This task adds each one exactly as the hub's artboard draws it, and the verifier checks it opens the right screen. The hub task's builder report names the entries.

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
