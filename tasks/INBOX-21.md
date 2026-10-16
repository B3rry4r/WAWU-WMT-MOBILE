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
- **Status:** merging (lead). Checked once by an independent verifier (report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/INBOX-21-r2.md`): verdict FIX in round 1 (one high: sign-out left the phone registered once the access token had run out), MERGE in round 2 (report INBOX-21.md for round 1), nothing medium or worse. Batch 3: stacked on `wmt/FIX-22` (this branch contains it); mobile only, no backend change; API types regenerated from the last batch 3 backend head `wmt/FIX-22` (51f1bc2).
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
- **Each later screen a notification is about adds its row** to `src/features/push/routes.ts`: the other person's
  profile (ME-02, `new_follower`), a piece of content (`content_published`, `content_rejected`, `review_received`),
  the paid question itself (INBOX-18, `dm_received`, `dm_deadline`; today they open the Inbox).
- **History:** the builder report is in tasks/history/INBOX-21.md.
- **Open findings:** blocker 0, high 0, medium 0. Lows: the next person's registration can be forgotten if the previous person's removal hangs past it; the late removal uses a stale bearer; (a forced session end and the web export warning are in the sweep already). They are in tasks/SWEEP-INBOX.md with the report path.
- **Next:** the lead opens the mobile pull request with the batch 3 head. V10 (a real Android phone) is NOT RUN: it needs a new development build (app.json changed, SHARED-CHANGES INBOX-21 #2), the owner's FCM key uploaded to Expo, and PUSH_ENABLED=true on the Hub (INBOX-03 #3).

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

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
