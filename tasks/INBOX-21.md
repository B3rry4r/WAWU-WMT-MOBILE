---
id: INBOX-21
title: Turn on phone notifications in the app
owner: YOU
area: INBOX
order: 52
priority: launch
repo: wawu-wmt-mobile
type: flow
status: todo
depends_on: [INBOX-03, SHELL-02]
decisions: []
passes: [V1, V6, V7, V9, V10]
artboards: []
---
# INBOX-21 · Turn on phone notifications in the app

Taken over by the lead's agents on 10 Oct 2026 (owner: the developers' subscriptions have ended; was DEV2).

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

## Builder report

_Filled in by the builder (docs/roles/BUILDER.md). Files changed, each check and how it was tested, gate counts before and after, gaps and shared-change requests filed, anything not done and why._

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
