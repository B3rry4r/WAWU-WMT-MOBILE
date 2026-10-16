---
id: INBOX-21
title: Turn on phone notifications in the app
owner: YOU
area: INBOX
order: 52
priority: launch
repo: wawu-wmt-mobile
type: flow
status: verifying
depends_on: [INBOX-03, SHELL-02]
decisions: []
passes: [V1, V6, V7, V9, V10]
artboards: []
---
# INBOX-21 · Turn on phone notifications in the app

## Current state

As of 16 Oct 2026.
- **Status:** verifying. Built on `wmt/INBOX-21` (mobile only; no backend, wawu-id or website change, no migration).
- **Built:** `src/features/push/`. After sign-in, once the tabs are reachable, the app makes the Android channel,
  asks the system for notification permission once per phone, and registers the phone with the Hub
  (`POST /push-tokens`, every live start and after 30 minutes away). Sign-out removes it (`DELETE /push-tokens`)
  inside the existing sign-out wait, before the WAWU ID logout is sent (round 2). A tap opens: the room (join
  approved; a declined join names no room, so it opens the app where it is), the Wallet tab (sale, tip, refund), the
  Inbox tab (paid question, deadline). Every other kind opens the app where it is.
- **Refusal:** a refused or unanswered ask changes nothing else; no screen, no nag, in-app notifications unchanged.
- **Round 2 (16 Oct):** the verifier's high finding is fixed: sign-out removes the phone first (refreshing an
  expired access token), then sends the logout, then signs out, all inside the 3 s wait; a registration still on its
  way is bounded by the same 3 s and cannot leave the phone registered to the person who left or block the next
  person. Open findings: none medium or worse. Lows: a forced session end leaves the phone registered (Hub fix) and the
  web export's expo-notifications warning, both in the sweep (`SWEEP-INBOX`, `SWEEP-APP`).
- **Next:** the verifier re-checks round 2 (V1, V6, V7, V9). V10 (a real Android phone) is NOT RUN: needs a new development build
  (`app.json` changed, SHARED-CHANGES INBOX-21 #2), the owner's FCM key uploaded to Expo, and `PUSH_ENABLED=true`
  on the Hub (INBOX-03 #3).
- **Each later screen a notification is about adds its row** to `src/features/push/routes.ts`: the other person's
  profile (ME-02, `new_follower`), a piece of content (`content_published`, `content_rejected`, `review_received`),
  the paid question itself (INBOX-18, `dm_received`, `dm_deadline`; today they open the Inbox).
- **History:** the builder report is in tasks/history/INBOX-21.md.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV2.md` (what you own)
- `docs/EXPO-AGENTS.md` and the SDK 57 notifications docs
- `docs/BUILDS.md` (a native module needs a new development build)

## Goal

Push notifications reach the phone: the app asks for permission, registers its push token with the backend
(INBOX-03), removes it on sign-out, and a tap opens the screen the notification is about.

## Scope

`expo-notifications` (request it in `SHARED-CHANGES.md` on day one, with `npx expo install`; it needs a new
development build). Permission ask, token register and unregister, tap routing. A tap opens its target screen for
every target screen that exists when this task is built; each later screen that is a notification target adds its
own route to the same map (docs/WORKFLOW.md section 7, "Links between screens"). Android push needs the owner's
FCM credentials uploaded to Expo (owner input).

V10 runs on a real Android phone only (DECISIONS R-24).

## Capability checks

- [ ] A user who allows notifications gets a push on their Android phone within a minute of a new follower.
- [ ] A user who signs out gets no more pushes on that phone.
- [ ] A user who taps a notification lands on the screen it is about.
- [ ] A user who refuses permission keeps using the app, and in-app notifications still work.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/INBOX-21.md](history/INBOX-21.md).

## Builder report, round 2

Mobile `wmt/INBOX-21`, continued from a0bf293 (main 3117807, nothing to merge). Mobile only.
- **High, fixed.** Before: `signOutFlow.ts` sent the WAWU ID logout and `forgetPush()` together, the logout ended the refresh token, and a removal needing a refresh got 401, so the Hub kept the phone. After: `forgetPush` first, then the logout, inside the one 3 s wait; the API client's own 401 refresh runs while the refresh token is still alive. The logout names the refresh token the session holds at that moment (a refresh hands out a new one). If the removal has not finished at 3 s the phone signs out and the logout is still sent, once.
- **Test first.** New `src/features/push/__tests__/signOutPush.test.ts`: a fake Hub that expires access tokens and a fake WAWU ID that rotates and ends refresh tokens (the verifier's ATTACK 1, 4 and 5 and their controls). Red on a0bf293's code: 6 of 7 failed (log `inbox-21-b/logs/red-final.log`); green after: 7 of 7. The verifier's own attack files also pass (8 of 8).
- **Low 2, fixed.** `forgetPush(waitMs)` waits for an in-flight registration at most `SERVER_WAIT_MS`, then cancels it: it sends nothing it has not sent, and if its POST lands after the sign-out it removes the phone again with the access token it was started with. A run started in an ended session is never shared with the next person (`syncPush` starts a new one), and if a late landing finds another person signed in, the phone is registered to them again. A removal that outlives the sign-out never uses the next person's session.
- **Low 3, fixed.** `routes.ts` no longer lists `community_join_declined` (the Hub's push names no target); `routes.test.ts` uses the data the Hub sends for approved and declined; Current state corrected.
- **Low 4, fixed.** SHARED-CHANGES INBOX-21 #1 now lists what `_layout.tsx` gains: one import, three comment lines, one constant, one element.
- **Sweep, no code.** A forced session end leaves the phone registered (Hub fix) in `SWEEP-INBOX`; the web export's expo-notifications warning in `SWEEP-APP`.
- **Not changed:** a removal that cannot be sent in 3 s, or sent with no connection, still leaves the phone registered (G-268, as before).
- **Checks.** `(npm run typecheck && npm run lint && npm test -- --maxWorkers=2 && npm run gates && npm run tasks; echo "EXIT $?")`: EXIT 0 (159 suites, 2880 tests; gates 0 fail; tasks 283). `check_tasks.py --write` run.
- **NOT RUN:** V10 (a real phone).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
