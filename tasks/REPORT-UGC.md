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

As of 31 Oct 2026. Built by a Sonnet builder (T1): Hub branch `wmt/REPORT-UGC` on backend `origin/main` `66f1e05` (head `f85c3de6`), app branch `wmt/REPORT-UGC` on `origin/wmt/STORE-BUY-APP` `0d730a7a`. Status verifying. Default (lead), owner may override: the reasons list, 30 new reports an hour per person, and the two kinds that cannot be taken down (below).

- **Hub.** One route `POST /reports { kind, targetId, reason, note? }` for `piece`, `comment`, `profile`, `community_message`, `chat_message`, `direct_message` (a paid question). Reasons (fixed list): spam, harassment, hate, sexual, illegal, impersonation, other. One table `UgcReport`, migration `20261228090000_ugc_reports` (rollback refuses while rows exist). One report per person per item: a repeat answers the same report (200, `alreadyReported: true`, no second row, no second mail). A paid question also writes the old `DmReport` row, so `POST /dm/{id}/report` (protected, unchanged) and the new route stay in step. Own thing: 400. Room or chat the reporter is not in: 404.
- **Reporter never sees it again (them only).** Feed (ranked and newest), search (and "closest"), comments, a room's messages, a chat's messages; a reported profile joins `BlockedAccountService.hiddenFrom` for the reporter, so that person's pieces, comments and listings leave every surface that already hides a blocked person.
- **Admin.** `GET /admin/reports` (open reports, one row per reported item: the item, the first reporter, the subject, `count`, `emailed`), `POST /admin/reports/{id}/resolve { action: dismiss | take_down, note }` (settles every open report on the item). Roles as content review (finance refused). Take-down uses what exists: a piece goes through the existing content take-down (`AdminContentReviewService.takeDown`); the Hub has no admin removal for a comment, community message or chat message, so those are deleted by the resolve (a comment gives its piece's count back). A profile and a paid question can only be dismissed (409 otherwise): the Hub has no account suspension (WAWU ID has a `status` column and no admin route sets it) and a paid question carries money. GAP for the lead: suspending a reported account.
- **Email.** Each new report is mailed to support@wawuafrica.com through the existing Hub to WAWU ID relay (`WawuIdMailRelay`, `POST /internal/mail/send`); `emailedAt` records it. If the relay is down the report stays in the admin list, which is the source of truth.
- **App.** One shared sheet `src/features/report/ReportSheet.tsx` (a reason, an optional note, Report) used with a `kind` prop everywhere, never forked; `useReporting` draws it and the "Thanks. We'll review this." toast. Placements, with existing menus and sheets, tokens only: a piece (the `...` button beside Share in the piece page header, "Report this piece"; not drawn on the person's own piece); a comment (press and hold, in the page preview and in the comments sheet; not on the person's own); a profile (the profile menu, "Report this profile" above the existing Block, not on one's own profile); a community message (press and hold, not on one's own); a chat message (press and hold, not on one's own); a paid question (the paid thread's `...` menu, whose report part is now this sheet, kind `direct_message`). After sending, the item leaves the reporter's view (lists refetch; the piece and profile pages close).
- **Block.** The profile menu already has Block (existing route); the paid thread's menu has Block. A free chat has no block action in the app today and none was added: GAP (a chat's `...` menu with Block through `POST /settings/privacy/blocked`).
- **Changed assertions (named).** `src/features/paid-answers/__tests__/paidAnswers.test.tsx`: the fake Hub answers `POST /reports`; "Report asks first" now picks a reason in the shared sheet and expects `direct_message:q1:harassment` and the new thanks line; the 409 "already reported" case became "a repeat answers the same report (the thanks again)", because the new route has no 409.
- **Checks.** See the hand-back for EXIT lines. Hub specs: `ugc-report.contract.spec.ts` (every kind, the repeat, the 30 an hour cap, the filter for the reporter only on comments, feed, ranked feed, room and chat, the support mail through the mock WAWU ID, admin list, dismiss, take-down, role refusals) and `ugc-report-migration.contract.spec.ts` (up, refuse, down, up). App: `report/__tests__/report.test.tsx` on `Platform.OS` android (the seven reasons, one send, the note, a failure keeps the sheet, the Android back button closes it, press and hold opens it and the person's own cannot be held).
- **NOT RUN.** Pictures at 390 px dark and light beside the nearest boards (no artboard draws these menus): NOT RUN, no screenshots were taken in this round; the verifier or the next round takes them against a local Hub (the stack is `scripts/dev/stack.sh up --name test_reportugc --ports 11780-11789 --with mobile`). Verify on a phone: the hold feels right on the room and chat lists, and the report sheet opens above the comments sheet on iOS (two modals).
- **PHONE CHECK.** (1) Press and hold a comment, a room message and a chat message: the sheet opens, the Android back button closes it. (2) After Report, the item is gone on the next refresh. (3) The comments sheet is a modal: confirm the report sheet draws above it on iOS.
- **Fingerprints.** JS only, no native change: android `e871fe1a`, ios `e8e7de85` (printed by the hand-back).

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
- [ ] Pictures at 390 px dark and light (NOT RUN).
