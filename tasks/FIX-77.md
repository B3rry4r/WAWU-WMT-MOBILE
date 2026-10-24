---
id: FIX-77
title: A community message photo must be the sender's own upload on this bucket
owner: YOU
area: FIX
order: -77
priority: launch
repo: wawu-backend
type: backend-endpoint
status: verifying
depends_on: []
decisions: [R-62, R-5]
passes: [V1, V2, V3, V4, V9]
artboards: []
tier: T2
---
# FIX-77 · A community message photo must be the sender's own upload on this bucket

## Current state

As of 18 Oct 2026, merging (lead): verified (PASS) and stacked in batch 20.
- **Status:** merging (lead). The verifier said PASS, no blocker, high or medium (report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/FIX-77.md`: the web path (presign, PUT, no confirm) and the app path each 201 and charged once; 58 refusals each 400 with nothing stored or charged; a double tap across two Hubs charged once; the 8 older specs keep every expect; protected 251 of 253, the two reds the widened POST and GET `/communities/:id/messages`; CI Branch checks 39090746354 red only on `earning-settlement.contract.spec.ts` (Q-42, ruled in R-70) and those 2). Stacked in batch 20 by MERGE-20; not on main. Backend `wmt/FIX-77` `84d56ff` (from `wmt/INBOX-22` `a0f59fa`); this record on mobile `wmt/FIX-77` (from `wmt/INBOX-22` `dbf020fd`). Built by a Sonnet builder (tier T2). No schema, no migration, no Fintava file touched, no app code, `contract/openapi.json` unchanged (the DTO comment was left alone so the contract text does not move).
- **Found by:** G-INBOX-22-4 (INBOX-23 check F1): `POST /communities/:id/messages` took any `imageUrl` (another host, a userinfo trick, example.com, another person's key, a video file), charged the photo price and stored the link for every member to load. Only `videoUrl` and `voiceUrl` went through `assertUploaded`. The earlier "do not tighten imageUrl" call is superseded by the lead's ruling.
- **Fix:** `imageUrl` goes through the same `assertUploaded` (`src/community-message/community-message.service.ts`, before anything is charged). It must be a link on this bucket's own host and prefix (`deliverableKeyFrom`), key exactly `community/message/<sender>/<uuid>.<ext>`, and a `StorageObject` row for that key, that sender and that folder must exist. A photo needs no confirm (the web presigns and PUTs and never confirms, `src/lib/api/uploads.ts`), so a `pending` or a `confirmed` row passes; only a given-up (`abandoned`) row is refused, as the private chat does. Anything else is 400 "That photo could not be sent. Choose it again." with nothing stored and nothing charged. A null or missing `imageUrl` (a text message) is untouched, and the response shape and every other field are as before.
- **Specs (kinds spec, new describe "what a photo may be", 7 cases):** four refusal cases red on the base (`a0f59fa`), all four green after: a link that is not this bucket's own (example.com, another host with a signature, a key under a path, the bucket host as the login of another host, a longer host, another port, the other scheme, a made-up host, a picture anywhere), another person's key on every link (theirs on this bucket, their signed link, their pending photo, their key on another host, the sender id swapped in), a file from another folder or a key that is not exactly folder, sender and one file (a video file, a voice note, an avatar, a cover-folder file, the folder buried, an extra segment, `%2F`, a dot segment, a backslash), and a key with no `StorageObject` row or a photo the sender gave up. Each case is 400 with the photo sentence, no message, no balance change, no ledger row. Green on the base and after, as the positive cover: the web's presigned-but-unconfirmed photo and the app's confirmed photo are each accepted and charged once (a repeat of the same key is the same message and takes nothing more), and a text message (no photo, or a null one) costs nothing.
- **Specs that sent a made-up photo link and now send a real upload** (each assertion kept; the link is the sender's own presign link from a local bucket, built by the new `src/community-message/tests/photo-upload.ts`): `community-message`, `-idempotency` (one photo per sender, reused so a repeat of a keyed send is the same message), `-entitlement`, `-kinds`, `credit-host-earnings`, `community-discover`, `community-image`, `notification-wiring`. `publishing-gate-coverage` has only its `why` text for this route updated.
- **Checks:** the four `community-message` specs 77 of 77 (kinds 31 with the 7 new); `credit-host-earnings`, `community-discover`, `community-image`, `publishing-gate-coverage` 59 of 59 and `notification-wiring` 16 of 16 (each spec named, none with Fintava in it; `community-pass-nuvion` skipped); protected suite on a fresh seeded database 251 of 253, the only reds `POST` and `GET /communities/:id/messages` ("`videoUrl`, `voiceUrl` not in the lock (response widened)"), the same two as INBOX-22; tsc 0; eslint on the 12 changed files adds no error (counts equal or lower than the base; those specs carry older lint errors, none new); gates passed (0 fail, 129 warn, 88 accepted), baseline ok.
- **Not run:** a real bucket (the local bucket host is a placeholder, links are signed locally), the app, `community-pass-nuvion`, Fintava specs.
- **For the lead:** (1) the route is protected and this makes its input stricter (the web's flow keeps working: presign, PUT, send the `fileUrl`); SHARED-CHANGES INBOX-22 #1 already carries this route's behaviour change and the owner's `relock-approved`, and no new row was added. (2) Two older specs outside this task's list had a made-up photo link and are changed here (`community-image`, `community-discover`), as INBOX-22 did for its own list.
- **Merge (MERGE-20):** backend merged with no conflict; `community-message.service.ts` keeps FIX-71's `withFreshMedia` and this task's `imageUrl` check. One test is stale only because the two branches met: FIX-71's `community-message-resign.contract.spec.ts` ("the answer to a send, and to its repeat, carries a link that loads today") sends a link on the spec's own host (`fix71-bucket.test.invalid`, not the bucket's `fix71-bucket.fix71-bucket.test.invalid`) with no upload row behind its key, so this task's check answers 400. Fixture patch (no assertion changed; the spec then passes 9 of 9): `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/mg20-m/merge20-resign-fixture.patch`, handed to the lead and not applied in MERGE-20.
- **Lows (SWEEP-INBOX FIX-77 L1 and L2, open):** the DTO's own sentence ("imageUrl must be a full link") for a value that is not a link; the sender's own key with an unsigned or altered link is stored as sent.
- **Next:** the batch 20 pull request (the lead). Gaps: G-FIX-77-1, G-FIX-77-2 in BACKEND_GAPS; G-FIX-71-2 and G-INBOX-22-4 are closed by this task.

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`
- BACKEND_GAPS G-FIX-77-1, G-FIX-77-2; `tasks/INBOX-22.md` (G-INBOX-22-4)

## Goal

A photo sent into a community room is a file its sender uploaded to this bucket for that purpose, so nobody can have the Hub charge for, store and serve a link to somewhere else.

## Scope (backend only)

`src/community-message/community-message.service.ts`, `docs/contract/CONVENTIONS.md` (one sentence), and specs: `src/community-message/tests/photo-upload.ts` (new helper), the kinds spec (new cases, and its older photo links made real) and the other seven specs above (real uploads in place of a made-up link), `src/plans/tests/publishing-gate-coverage.spec.ts` (a `why` string).

## Capability checks

- [x] A photo link on another host, a look-alike host, with userinfo, or a made-up one is 400 and nothing is stored or charged.
- [x] Another person's photo key, a file from another folder and a key with no upload row are 400 and nothing is charged.
- [x] The sender's own presigned-but-unconfirmed photo (the web's path) and confirmed photo (the app's path) are accepted and charged once.
- [x] A text message, with no photo or a null one, is unchanged.
- [x] The protected suite has only the two known "response widened" reds.

## Owner sign-off

Not needed.
