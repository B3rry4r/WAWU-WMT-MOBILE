---
id: INBOX-22
title: Community credits by kind of message (backend)
owner: YOU
area: INBOX
order: 258
priority: launch
repo: wawu-backend
type: money-path
status: verifying
depends_on: [INBOX-16, INBOX-05, WALLET-17]
decisions: [R-62, R-5]
passes: [V1, V2, V3, V4, V6, V7, V8, V9]
artboards: []
---
# INBOX-22 · Community credits by kind of message (backend)

## Current state

As of 18 Oct 2026.
- **Status:** verifying (fix round 2 done, needs a re-check of findings 1 and 2). Built by a Sonnet builder; the owner's `relock-approved` label is still needed before merge (SHARED-CHANGES INBOX-22 #1).
- **Branches:** backend `wmt/INBOX-22` `a0f59fa` (round 2) on `2d311df` on `origin/wmt/MERGE-14` `195de50`; mobile `wmt/INBOX-22` (records only). Migration `20261025190000_community_message_media` (two nullable columns and two CHECKs; the lead restamps it at merge if needed; the verifier found the stamp order cosmetic). CI on `a0f59fa`: Gates run 39084583570, Protected routes (V3) run 39084583555, Branch checks run 39084583591, all still running when the builder left (the lead watches them). CI on `2d311df` was: Gates green; V3 red with exactly the two expected `videoUrl`/`voiceUrl` widenings; Branch checks red on `earning-settlement` (Fintava, expected) and `publishing-gate-coverage` (finding 2, fixed in `a0f59fa`).
- **What each kind costs, and where that comes from:** text and emoji 0 (R-62; no setting prices it), photo `community_credit_cost_photo` 1, video `community_credit_cost_video` 3, voice note `community_credit_cost_voice` 3 (R-62, this file, TIER-06 defaults). Read from `PlanSettingsService` at send time, so an admin change applies within a request.
- **Built:** `POST /communities/:id/messages` charges the price of the message's kind. A message carries one photo, video or voice note at most (a second is 400). `videoUrl` and `voiceUrl` must be a link on this bucket's own host (the `fileUrl` presign handed back, checked with `deliverableKeyFrom` against the bucket's origin and prefix) and the sender's own confirmed upload into the new presign folders `community/message-video` and `community/message-voice` (400 and no charge otherwise; another host, a look-alike host, userinfo, a `%` escape or a folder buried under another path is 400). Free messages (text, or anything from the host) write no credit row, no ledger row and no host earning. A short balance is `402 insufficient_credits` with "A video costs 3 WAWU Credits and you have 2. You are 1 short. Text and emoji are free."; nothing is stored or taken and the key stays free. The debit, the message and the ledger row stay one transaction. The host's 85% is the existing per-spend allocation, so it is computed on credits spent (708 and 2125 kobo for a photo then a video on a 120-credit lot).
- **`GET /communities/message-cost`:** `creditsPerMessage` stays and is now 0 (what a plain message costs); `creditsByKind` `{ text, photo, video, voice }` is new. The room view's `messageCostInCredits` is 0 for everyone for the same reason. The inbox preview (`lastMessage`) carries `videoUrl` and `voiceUrl`.
- **For the lead (decisions the builder took):** (1) `creditsPerMessage` and `messageCostInCredits` read 0, not the photo price: the app as built before INBOX-23 then shows no "1 credit per message" and no longer blocks a person with no credits from typing. One line (`meteredMessageCost()`) changes it if the owner wants otherwise. (2) The three links on the send route may be 2048 characters, not 500: a real presigned link is 547 to 553 characters, so the old limit refused every real photo too. Only the limit moves (G-INBOX-22-3). (3) A failing low-credits notice after the commit is logged and no longer turns a paid message into a 500.
- **V3:** on a fresh migrated and seeded database with the suite's own mock WAWU ID: `195de50` 253 of 253 green; `2d311df` and `a0f59fa` 251 of 253, the only reds `POST` and `GET /communities/:id/messages` ("`videoUrl`, `voiceUrl` not in the lock (response widened)"). The builder's first "28 entries fail" was an environment artifact (a stack mock WAWU ID), withdrawn.
- **Specs that pinned the old rule and were changed** (not weakened; each named in the report): the three `community-message` specs, `credit-host-earnings`, `notification-wiring`, `community-image`, `community-discover`, `live.contract`. New: `community-message-kinds.contract.spec.ts` (24 tests; 5 mutants killed in round 1; the spec's uploads are now the real signed link from a local bucket that is never contacted).
- **Verifier round 1 (FAIL, two medium), both fixed in round 2:** (1) a video or voice link on any host with the sender's own key was accepted and charged: fixed, only this bucket's own links pass (three new specs; the foreign-host and the folder-buried-under-a-path cases are red on `2d311df`, the plain another-person and wrong-folder cases were already refused and stay as cover). (2) `publishing-gate-coverage.spec.ts` listed only `imageUrl`: `videoUrl` and `voiceUrl` now sit beside it in the same entry (its reason text updated), nothing else in that spec changed. Lows: price change reaches a second Hub process within 15 s (PLAN_SETTINGS_REFRESH_SECONDS; the "within a request" above is true for the saving process); the `live.contract` loosening (Bola's own text post) is justified by R-62; both for the sweep, no change.
- **Open:** G-INBOX-22-4 `imageUrl` was not checked as an upload, so a video file sent as `imageUrl` cost a photo's price (1, not 3). **Fixed by FIX-77 (backend `wmt/FIX-77`, 18 Oct 2026):** `imageUrl` must be the sender's own upload into `community/message` on this bucket (a presigned or a confirmed row; the web never confirms), otherwise 400 and nothing charged. G-INBOX-22-1 the file size caps for a community video (100 MB) and voice note (25 MB) are PROVISIONAL(COMMUNITY-MEDIA-MAX-BYTES), not money, for the owner to confirm. G-INBOX-22-2 media links are stored as given (7-day signed links), as `imageUrl` is today, so a photo, video or voice note older than a week stops loading; the fix is signing on read in the list, live and catch-up paths. G-INBOX-22-3 as (2) above. G-807 and G-881 are served on the backend side; the app side is INBOX-23 and INBOX-13 (print the costs from `creditsByKind`; the app's contract copy needs `npm run api` from this branch).
- **Fences touched:** SHARED-CHANGES INBOX-22 #1 (the schema columns, the route behaviour, `contract/openapi.json`, the two presign folders and the 2048 link limit; the row now names them).
- **Not run:** Fintava specs and `community-pass-nuvion.contract.spec.ts` (names Fintava); the app; a real bucket upload (the stack's bucket host is a placeholder, so the confirmed-upload path ran on `StorageObject` rows).
- **Next:** a verifier re-checks findings 1 and 2 (and CI on `a0f59fa`). Reports are in tasks/history/INBOX-22.md.

## Read first

- `docs/WORKFLOW.md` (the rules every task follows)
- `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`, whichever your prompt names
- `docs/people/YOU.md` (what you own)
- This task changes `wawu-backend`. Start the session with that repo and `wawu-wmt-mobile` both attached; follow that repo's CLAUDE.md for its commands (its additive-only and protected-route rules apply).
- `DECISIONS.md`: R-62, R-5 (ruled; build what they say). Rulings outrank the boards, the brief and any older task text.
- `tasks/DESIGN-V2-CUT.md` (the list this task was cut in)

## Goal

Sending in a community costs credits by kind: text and emoji free, a photo 1 credit, a video or voice note 3 (R-62). Credits stay a count, never naira. Costs are admin settings.

## Scope

- `POST /communities/{id}/messages` charges by kind from settings (`community_credit_cost_photo` 1, `_video` 3, `_voice` 3; text 0). A free message writes no credit row. Hosts still receive 85% of credits spent in their room (WALLET-17).
- The send route accepts a video and a voice note attachment (additive nullable fields beside `imageUrl`), uploaded through the existing presign and confirm path (`POST /uploads/presign`, `/uploads/confirm`).
- `GET /communities/message-cost` keeps `creditsPerMessage` for the web and adds the per-kind costs.
- This changes what the web is charged for text in a community: a deliberate protected-route change (R-62), SHARED-CHANGES row INBOX-22 #1; it needs the owner's `relock-approved` label before merge. Add, then move: the web keeps working until the label is on.
- A refused or failed send charges nothing and a repeated request charges once (V8).

## Capability checks

- [ ] A text or emoji message costs 0 credits and works with a balance of 0.
- [ ] A photo costs 1 credit and a video or voice note 3, once, even when the request is sent twice.
- [ ] With 2 credits, a video is refused with the shortfall in plain words and nothing is taken; a photo still works.
- [ ] A host's 85% share is computed on credits actually spent; free messages add nothing.
- [ ] V3: the protected route suite is run before and after and the one expected difference is named.

## History

Round reports, verifier reports and lead notes, word for word, oldest first: [history/INBOX-22.md](history/INBOX-22.md).

## Owner sign-off

_Owner: date, and "screenshots and evidence pack reviewed"._
