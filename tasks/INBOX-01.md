---
id: INBOX-01
title: Communities: my communities, links, join decisions
owner: DEV2
area: INBOX
order: 7
priority: launch
repo: wawu-backend
type: backend-endpoint
status: verifying
depends_on: []
decisions: []
passes: [V1, V2, V3, V4, V9]
artboards: []
---
# INBOX-01 · Communities: my communities, links, join decisions

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/DEV2.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands.

## Goal

A member sees their own communities with the last message and unread count, can share a room by a wawu/c/ link, and hears when a host answers their join request. Additive only.

## Scope

My communities with last message and unread; share links by slug; private rooms need a cover; join-decision notifications.

## Capability checks

- [ ] A user who asked to join a private room gets a notification when the host approves or declines; a user can open wawu/c/<slug> and land in that room.

## Builder report

- **Files (wawu-backend, `wmt/INBOX-01`):** new `src/community/rooms/` (controller, service, `community-room.type.ts`, `community-slug.ts`), `src/community/tests/community-rooms.contract.spec.ts` (26 tests); changed `community.service.ts` (approve/decline notify), `community.module.ts`, `community-message.{module,service}.ts` (sender lookup reused), `notification-event.ts` (kinds `community_join_approved`, `community_join_declined`), `notification.service.ts` (comment), `account-data-map.ts`; schema + migration `20261002210000_community_links_and_reads` (tables `CommunityLink`, `CommunityReadMarker`; no column on `Community`, so no web response gains a key); `contract/openapi.json` regenerated. The join-request spec's teardown also deletes the notifications approvals now write (no assertion changed).
- **Routes (all new):** `GET /communities/mine` (hosted and joined rooms, newest activity first, link, last message with sender, `unreadCount`); `POST /communities/:id/read`; `GET /communities/:id/link`; `GET /communities/links/:slug`; `POST /communities/rooms` (the app's create: private needs a cover, answer carries the link). `POST /communities` (web) is unchanged.
- **Check, notification on approve or decline:** contract spec (opens the link, asks, approved, `GET /notifications` holds one `community_join_approved` with "Open room" and `/communities/<id>`; repeat approve sends nothing; decline gives one `community_join_declined`), and live on a built server (:3071, mock WAWU ID login, seeded creator and user), log in the builder's scratchpad.
- **Check, open wawu/c/<slug> and land in the room:** API side tested in the spec and live (link resolves, capitals accepted, unknown 404; after approval the room's messages read). The app's route for the link and the phone check are INBOX-14 ("A user who opens wawu/c/aba-tailors ... lands in that room", V10).
- **Gates before (main 2b407e7) / after (merged with main 14a7fb2):** tsc 0 / 0; eslint 3642 errors 850 warnings / 3640 and 850 (current main also 3640/850); gates 16 fail 3 warn 76 accepted / 16 fail 4 warn 76 accepted (current main identical); baseline 108 entries OK / OK; contract 113 failed 1865 passed / 62 failed 1983 passed, the same 9 suites both times (tests that need a fresh identity from the shared :4001 mock, 401s), no test fails that passed before; protected routes and route shadowing pass. Mobile `npm run check` exit 0 before and after (285 tests, gates 0).
- **Defaults (agent), owner may override:** unread counts messages from others after the last read, else after joining; a host who never opened counts all. Slugs come from the name, fixed after, `-2` for a repeat. Join decisions are not muted by the `communityMessages` switch (an answer to the person's own request, like `kyc_verified`). Approval opens `/communities/<id>`.
- **Filed:** SHARED-CHANGES `INBOX-01 #1` (schema, migration, contract); BACKEND_GAPS G-25 (web routes still allow a private room with no cover), G-26 (the web was not checked for the two new kinds).
- **Not done:** mobile types not regenerated (`src/api` is fenced; `npm run api` runs after the backend merges).

## Verifier report

_Filled in by the verifier (docs/roles/VERIFIER.md). One row per pass: passed, failed or NOT RUN with the reason, and where the evidence is. Then findings: defect, differs-for-recorded-reason (cite the decision), or unclear._

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
