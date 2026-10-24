---
id: SWEEP-APP-8
title: App sweep, bundle B17: seven low rows from FIX-107, FIX-110, FIX-113, POINTS-10 and the Inbox (names, name token, Studio file result, lesson pill, profile works, price terms)
owner: YOU
area: SWEEP
order: -170
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: review
depends_on: []
decisions: [R-27, R-47]
passes: [V1, V4, V5, V6, V9]
artboards: []
tier: T1
---
# SWEEP-APP-8 · App sweep, bundle B17

## Current state

As of 24 Oct 2026, built by a Sonnet builder (T1, bundle B17), mobile `wmt/SWEEP-APP-8` from `origin/main` `48bd75a9`. The brief called this task SWEEP-APP-6; that id is already the stack-rows part of `tasks/SWEEP-APP.md` (branch `wmt/SWEEP-APP-6`, merged in batch 22), so this one is SWEEP-APP-8. App only: no backend change (the Hub's rules were read from backend `origin/main` `b69aa7f`). Status review. Round 2 (24 Oct 2026, Sonnet T1): `origin/main` `d9b70d20` merged in, then row 6 and the two name lows from the verifier's report done (rows 6, a, b below).

| # | Low (source) | Before (`origin/main`) | After |
|---|---|---|---|
| 1 | Inbox rows draw a blank name for a person with no name (Inbox sweep: `ChatInboxRow.tsx`, `PaidFanRow.tsx`) | the Hub gives such a person `name: ""`; the chat row, the money-request row and a fan's paid-question row drew an empty line, an avatar with "W", and "They paid" in a request line | the row says the name, else the `@handle`, else "Someone" (as the chat and the feed do); the avatar takes the handle's first letter; the request line says "@kemi paid ₦12,000" |
| 2 | The `nameToken` travels in the send URL (WALLET-09 follow-up) | W14 to W9 to W10 carried `nameToken=...` as a route param, which on the web is the address in the bar, the history and a shared link | the token is kept in memory by the account's key (`rememberNameToken` in `send/model.ts`, the newest 8) and read back by `payeeFromParams`; no route carries it; the send body still carries it. A web reload on W10 forgets it, and the Hub then asks for the name check again (its own sentence) |
| 3 | Studio file tool: after done or failed the limits line and "Choose another" stay above the result (POINTS-10, `ToolScreen.tsx` ~402-405) | done: the row said "Choose another" and the line under it was "MP3, WAV, ... Up to 500 MB and 60 minutes."; failed: the same limits line | done: the row names the recording and its size, the line under it is the Hub's length ("About 2 minutes"), and no "Choose another" is written (the row is still a button, and says "Choose another" to a screen reader); failed: no limits line (the failure banner is next, the row is the empty "Choose a recording") |
| 4 | Course H25: the Free pill sits about 8 px above the row's centre (FIX-107, `Parts.tsx` `LessonList`) | the pill's own `alignSelf: flex-start` beats the row's `alignItems: center` | the Free pill and the lock sit in a box the row centres (`lessonEnd`, one style and one wrapper) |
| 5a | Profile works: description counts collapse spaces the Hub keeps (FIX-113, `works/form.ts`) | `lengthOf` collapsed runs of spaces for every field but a link | only title, role, client and category collapse (the Hub's `cleanText` collapses single-line fields and keeps the paragraph as typed); a description counts its spaces and line breaks |
| 5b | A typed but un-added skill is dropped silently on M8 Save (FIX-113, `AboutSections.tsx`) | Save sent the list without it, and was off when only that was typed | Save is on as soon as a skill is typed; Save adds it and sends it with the rest. A skill that cannot be added (a repeat, over 40 characters, a full list) is said in words under the box and nothing is saved; Back asks before discarding it |
| 5c | `/add-work` for another person's work opens Edit (FIX-113) | the route drew the edit form for any work; Save would be refused by the Hub | the form is drawn only once the signed-in person is known to be the work's owner; for another person's work the route opens the work's own page (M35); with no way to do that the screen says "This is not your work"; a failed read of who is signed in is "The work did not load" with Try again |
| 6 | M24 price step asks sale terms on every keystroke (FIX-110, `PriceScreen.tsx`) | five digits typed fast made five reads of `GET /content/sale-terms` (100, 1200, 12300, 123400, 1234500 kobo), each for a half-typed price | **done (round 2):** the Hub is asked when the typed price has rested for 400 ms (`SALE_TERMS_DELAY_MS`, `useDebounced`, as the wallet history search and the paid-message earn line use it), once, for the price that is there; the first read (no price) goes at once. "You earn per sale" already says "..." until the answer is for the price typed, so nothing stale shows meanwhile. A quick price tapped in settles the same way (400 ms) |
| a | `MoneyMoveInboxRow` draws a blank name for a person with no name (FIX-114, verifier low) | `move.other.name` for the row and the avatar | **done (round 2):** `rowNameOf(move.other)` and `avatarNameOf(move.other)`: the name, else the `@handle`, else "Someone"; the avatar takes the handle's first letter |
| b | `PaidInboxRow` (the creator's side of a paid question, INBOX-18) draws a blank name (row 1's leftover) | `dm.other.name` for the row and the avatar | **done (round 2):** the same `rowNameOf` and `avatarNameOf` |
| 7 | W39 earnings sweep delay line; G-FIX-99-1 search community count | not in the app | **not app work.** G-FIX-99-1 needs the Hub's protected list re-recorded (BACKEND_GAPS); the W39 sweep delay line has no app code to change (no sweep wording exists in `src/features/earnings`) |

Row 2's trade-off, for the verifier: on the web a reload while on W10 loses the in-memory token; the send then goes without it and the Hub answers with its own refusal, so the person goes back one step and checks the account again. Before, the token survived the reload in the address. A phone never showed the address, so nothing changes there.

Round 2 merge: `origin/main` `d9b70d20` conflicted in `PROGRESS.md` and `INDEX.md` (main's side, then `check_tasks.py --write`), `ChatInboxRow.tsx` (both blocks kept: `rowNameOf`/`avatarNameOf` and main's `moveLine`) and `content-detail/Parts.tsx` (row 4 re-applied on FIX-107's `mark` as `{mark ? <View style={styles.lessonEnd}>{mark}</View> : null}`). No other conflict.

Merge notes: `LessonList` in `Parts.tsx` is rewritten by FIX-107 (play marks); the one-line change here is the wrapper `<View style={styles.lessonEnd}>` around the mark and `lessonEnd: { alignSelf: 'center' }`. The new test (`lessonRow.test.tsx`) renders `LessonList` on its own, so it holds after FIX-107.

### Pictures (390 px, light and dark; web dev server, a throw-away preview route that is not committed)

`/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/sweep-app-6/pics/sweep-app-8-light.png` and `sweep-app-8-dark.png`: three Inbox rows (`@kemi`, `Someone`, `Femi Bankole`; the avatars say K, S, FB), H25's lesson rows (the Free pill and the lock at the row's centre), and the Studio file row after a job with the length line under it. Row 3 is pictured as its parts (`RecordingBox` settled and the length line), NOT the real Studio screen on a stack: no board draws the file tool (G-POINTS-10-1), and the full screen was walked only in `fileToolsFlow` (the four new tests). Nothing else was run live.

### Tests (red before, green after)

| Row | Test | Fails on `origin/main` |
|---|---|---|
| 1 | `chat/__tests__/rowName.test.tsx` (5) | yes, 5 of 5 |
| 2 | `send/__tests__/model.test.tsx` (1 new), `bankSendFlow.test.tsx` (1 new: the address of W14, W9 and W10 holds no token, the send still carries it) | yes, both |
| 3 | `points/__tests__/fileToolsFlow.test.tsx` (4 new: Captions and Clean audio, done and failed) | yes, 4 of 4 |
| 4 | `content-detail/__tests__/lessonRow.test.tsx` (1) | yes (`flex-start`) |
| 5a | `works/__tests__/form.test.ts` (1 new) | yes |
| 5b | `profile-edit/__tests__/aboutSections.test.tsx` (3 new) | yes, 3 of 3 |
| 5c | `works/__tests__/editReorder.test.tsx` (3 new) | yes, 3 of 3 |
| 6 | `create/__tests__/saleTerms.test.tsx` (1 new: five digits typed fast, one read after the 400 ms rest, none before) | yes (five reads) |
| a, b | `chat/__tests__/rowName.test.tsx` (4 new: a send and a paid question asked of the person, each with a handle and with none) | yes, 4 of 4 |

Two existing tests in `editReorder.test.tsx` ("a user can edit a work", "a change the Hub refuses stays on the form") gained one stand-in answer each, `GET /users/me` as the owner, because the edit form now waits to know who is signed in; no assertion in them changed.

### Verifier, 24 Oct 2026: PASS, status review (full report in `tasks/history/SWEEP-APP-8.md`)

Merging `origin/main` `d9b70d20` conflicts in `ChatInboxRow.tsx` (keep `rowNameOf`/`avatarNameOf` and main's `moveLine`) and `content-detail/Parts.tsx` (re-apply row 4 around FIX-107's `mark`: `{mark ? <View style={styles.lessonEnd}>{mark}</View> : null}`); `PROGRESS.md` and `INDEX.md` are generated. With that, tsc, eslint, gates and check_tasks are EXIT 0 and 44 suites / 760 tests pass. The 19 new tests fail on `48bd75a9`. Row 2 holds, and a web reload on W10 shows the Hub's refusal.
Open lows from that report are closed in round 2 (rows 6, a, b above). Row 7 is not app work.

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md`
- `tasks/SWEEP-APP.md`, and the tasks the lows come from: `tasks/FIX-107.md`, `tasks/FIX-110.md`, `tasks/FIX-113.md`, `tasks/POINTS-10.md`, `tasks/FIX-105.md`

## Goal

Seven small lows from the sweep list are fixed in the app, each with a test that fails before.

## Scope

`wawu-wmt-mobile` only: `src/features/chat/ChatInboxRow.tsx`, `src/features/paid-ask/PaidFanRow.tsx`, `src/features/send/model.ts`, `src/features/points/ToolScreen.tsx`, `src/features/points/FileParts.tsx`, `src/features/content-detail/Parts.tsx`, `src/features/works/form.ts`, `src/features/works/EditWorkScreen.tsx`, `src/app/add-work.tsx`, `src/features/profile-edit/AboutSections.tsx`, `src/features/profile-edit/EditProfileScreen.tsx`, `src/features/paid-answers/PaidInboxRow.tsx`, `src/features/create/PriceScreen.tsx`, and their tests.

## Capability checks

- [x] A user sees a person with no name in the Inbox by their @handle (chat, money request and paid question rows).
- [x] A user's bank send works through W14, W9 and W10 with no token in the address.
- [x] A user who runs Captions or Clean audio sees the recording's name and length above the result, no limits and no "Choose another".
- [x] A user sees the Free pill and the lock at the centre of a lesson row.
- [x] A user's description counts as the Hub counts it.
- [x] A user who types a skill and presses Save has it saved, or is told why not.
- [x] A user who opens `/add-work` for somebody else's work lands on the work's page, not on an edit form.
- [x] M24's sale terms ask once after the price stops changing.
- [x] A user sees a person with no name by their @handle in a money send row and in a creator's paid question row.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/SWEEP-APP-8.md](history/SWEEP-APP-8.md).

