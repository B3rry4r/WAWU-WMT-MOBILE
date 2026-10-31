---
id: REPORT-UGC
title: A person can report a piece, comment, profile, community message, chat message or paid question, and the Hub's moderators act on it (Apple 1.2, Google Play UGC)
owner: YOU
area: APP
order: -1300
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: verifying
depends_on: []
decisions: [R-27, R-29, R-47]
passes: [V1, V4, V5, V6, V9]
artboards: []
tier: T1
---
# REPORT-UGC · Report content and people from where they are seen

## Current state

As of 31 Oct 2026, fix round 1. Status verifying. Hub branch `wmt/REPORT-UGC` (on `origin/main` `66f1e05`), app branch `wmt/REPORT-UGC` (on `origin/wmt/STORE-BUY-APP` `0d730a7a`); heads in the hand-back. Round 0 built the report route, the table `UgcReport` (migration `20261228090000_ugc_reports`), the admin queue, the support mail and the shared `ReportSheet` at every placement (see the Hub and app files named below). Default (lead), owner may override: the seven reasons, 30 new reports an hour per person, a profile and a paid question can only be dismissed in the admin queue.

Round 1 (the verifier's FIX), each with its proof:
- **HIGH 1, the report sheet fits a phone.** `src/components/BottomSheet.tsx` (SHARED-CHANGES REPORT-UGC #3, one change in the shared component): the panel stops at the window height less the safe-area insets and a 24 gap, keeps its grabber, rounded top and backdrop, and a sheet whose content does not fit scrolls inside the cap (measured once drawn, sticky while open). A sheet that fits is drawn as before; a sheet with its own list is never wrapped. Proof: `src/components/__tests__/BottomSheet.test.tsx` (Android: the cap, the scroll, back button, backdrop, the report sheet with every reason, note, Report and Cancel inside the scroller at 390 x 844 and 360 x 640); pictures `shots-r1/*-report-sheet-top|bottom.png` and `small-360x640-report-sheet-*.png` (sheet box y 24 to 844 and 24 to 640, grabber at y 34, seven reasons, Report and Cancel all pass a trial click). Other BottomSheet users, unchanged pixel for pixel in the sheet region (0 differing pixels, before this round's pictures against after): the profile's "..." menu and the piece page's "..." menu, `unchanged-*-before-after.png`. The users that hold their own list (`CountryPicker`, `StatePicker`, `CountryStep`, `BankSheet`, the create pickers) are shorter than the cap by their own list heights and are never wrapped.
- **MEDIUM 2, Hub specs pin the reporter filter.** `src/ugc-report/tests/ugc-report-reporter-filter.contract.spec.ts`: a person reports ONE piece and nothing else; it is gone for them from the feed (trending, recent, top), following, search, closest, the creator shelf and Saved (and Saved's count), and still there for another person; the creator's other piece stays. Mutation, in a scratch worktree with every `id: { notIn: reported }` line and both raw SQL clauses removed: the new spec FAILS (all eight lists named as leaking) while the old `ugc-report.contract.spec.ts` still passes 11/11 (the masking the verifier found); with the filters back the new spec passes 5/5.
- **MEDIUM 3, the thanks above the composer.** The chat draws it above the composer (`useReporting(onReported, above)`, the composer's height read with `onLayout`), after the other children so nothing covers it; picture `*-u-chat-toast.png` (toast y 713 to 761, composer from y 773). Jest: `chatMenu.test.tsx`.
- **MEDIUM 4, a reported piece leaves the profile Content tab and Saved, for the reporter only.** Hub: `listByCreator` (`GET /users/{creator}/content`) and `MeSavedService` (`GET /me/saved` and its count) use `reportedIds`. A signed-out reader and everyone else see the piece; opening it by its own link still works; a reported PROFILE still opens (visitor profile, profile fields and its shelf answer 200): specs in the same file. The routes are on the protected list for the web only as unchanged callers: the web never sends a report, so its answers are the same.
- **STORE GAP A, Block in a free chat.** The chat header has "..." (not on the support thread): `PersonMenu` (`src/features/report/PersonMenu.tsx`), Report this profile above Block {name}, the profile menu's Block question, the existing block route (`POST /settings/privacy/blocked`), then the chat closes (`onBack`). Report this profile sends kind `profile` and closes the chat too. Pictures `*-u-chat-menu.png`, `*-u-chat-block-confirm.png`, `*-u-chat-after-block.png` (the app lands on the Inbox). Jest: `chatMenu.test.tsx` on Android with the real handlers.
- **STORE GAP B, LOW 7, the asker's paid thread has "..."** (`src/features/paid-ask/PaidThreadScreen.tsx`): `PersonMenu` with Report this conversation (kind `direct_message`, the newest question of theirs; no row when there is none) above Block. Pictures `*-u-paid-menu.png`, `*-u-paid-report-sheet.png`. Jest: `askerMenu.test.tsx`.
- **LOW 5, a screen reader can report.** `reportAction` (`LongPressable.tsx`) puts a "Report" accessibility action on the accessible element of a comment, a room message, a chat bubble and a chat attachment (only on another person's). The old action on the non-accessible wrapper was dead and is removed. Jest: `report/__tests__/reportAction.test.tsx`.
- **Changed assertions.** None this round (round 0's change in `paidAnswers.test.tsx` stands). The new tests are new files.
- **Not found while looking (Follow-ups below).** The Hub's inbox keeps a chat row with a person after Block (it was so before; the chat opens closed).
- **Pictures DONE** (owner hard rule 1): `scratchpad/report-ugc/shots-r1/`, 390 x 844 and 360 x 640, dark and light, from the web export of this app head against a local Hub of the Hub branch (stack `test_reportr1`, ports 11820 to 11839), beside the boards H19, H21, M5, I12, I9 (`beside-<board>-<theme>.png`).
- **PHONE CHECK.** (1) Press and hold a comment, a room message, a chat message: the sheet opens and the Android back button closes it. (2) The report sheet scrolls with a thumb and the keyboard opening on the note keeps the note in view (the sheet scrolls; verify on an iPhone and an Android). (3) TalkBack and VoiceOver: the actions menu of a comment, room message and chat message offers "Report". (4) The comments sheet is a modal: the report sheet draws above it on iOS. (5) After Block in a chat the phone lands on the Inbox. (6) The thanks sits above the keyboard-less composer on a phone with a home bar.
- **Fingerprints.** JS only, no native change: android `e871fe1a`, ios `e8e7de85`.

## Follow-ups

- USER-SUSPEND (next, lead): a moderator suspending a reported account (the admin queue can only dismiss a profile today).
- L6 (hard delete) and L8 (unpublished-id 200) go to the sweep list (lead).
- The Hub inbox lists a chat with a person the viewer blocked (`GET /inbox`); the chat itself opens closed. Sweep.

## Read first

`DECISIONS.md` R-27, R-29, R-47; backend `src/ugc-report/`, `src/dm-report/`; app `src/features/report/`, `src/features/paid-answers/PaidThreadScreen.tsx`.

## Goal

A store reviewer finds, where people post: Report on a piece, comment, profile, message; Block on a profile; reports that reach moderators who can act; and published contact (support@wawuafrica.com).

## Scope

Backend `src/ugc-report/`, the read filters in `src/blocked-account/`, `src/content-piece/`, `src/search-response/`, `src/comment/`, `src/community-message/`, `src/chat/`; app `src/features/report/` and the screens named above.

## Capability checks

- [x] A person reports each of the six kinds once; a repeat is not an error (Hub spec).
- [x] The reporter does not see the item again in the feed, search, comments, the room, the chat (Hub spec).
- [x] Moderators list, dismiss and take down; support is mailed (Hub spec).
- [x] The shared sheet is used by the paid thread and every other placement (app tests).
- [x] Pictures at 390 px and 360 x 640, dark and light, beside the boards (DONE, `scratchpad/report-ugc/shots-r1/`).
