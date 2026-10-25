---
id: FIX-71
title: A community message's photo, video and voice note still load after a week
owner: YOU
area: FIX
order: -71
priority: launch
repo: wawu-backend
type: backend-endpoint
status: review
depends_on: []
decisions: [R-62]
passes: [V1, V2, V3, V4, V9]
artboards: []
tier: T1
---
# FIX-71 · A community message's photo, video and voice note still load after a week

## Current state

As of 18 Oct 2026, merging (lead): verified (PASS) and stacked in batch 18.
- **Status:** merging (lead). The verifier said PASS, no blocker, high or medium (report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/FIX-71.md`: every media reader signs fresh, removing each path's signing turns exactly its test red, `objectKeyFrom` old against new differs only for the 3 added folders). Backend `wmt/FIX-71` `5d8f50b`, this record `daaf894`. Stacked in batch 18 by MERGE-18 (backend `wmt/MERGE-18`, mobile `wmt/MERGE-18`); not on main.
- **Merge (MERGE-18):** FIX-71 was built on INBOX-22 `2d311df`, so it merged after INBOX-22 round 2 (`a0f59fa`). Conflicts: `community-message.service.ts` (kept round 2's `assertUploaded` with `deliverableKeyFrom` and FIX-71's constructor, `withFreshMedia` on list, create, live, catch-up and rooms; `StorageService` imported once) and `community-message.module.ts` (`StorageModule` once). The inherited red `publishing-gate-coverage.spec.ts` is fixed by INBOX-22 round 2. The verifier's lows are SWEEP-INBOX rows FIX-71 L1 and L2 (open). SWEEP-APP FIX-65 F3 is closed by this task (`objectKeyFrom` now knows the chat and AI folders).
- **Built:** by a Sonnet builder (tier T1). Backend `wmt/FIX-71` (from `wmt/INBOX-22` `2d311df`); this record and the gap rows on mobile `wmt/FIX-71` (from `wmt/INBOX-22` `6c0313da`). No schema, no migration, no route, no Fintava file, no app code.
- **Closes:** G-INBOX-22-2. **Found by:** INBOX-22's builder.
- **Cause:** a message's `imageUrl`, `videoUrl` and `voiceUrl` are stored as the 7-day signed link the app sent, so a week later every read of the room returned a dead link although the file was untouched.
- **Fix:** the key is derived from the stored link (`objectKeyFrom`, as avatars and content previews already do) and signed on every read, in the five paths that return a message: the room's list, the answer to a send and to its repeat, the live event, the catch-up page and the last message of `GET /communities/mine`. New `src/community-message/message-media.ts`; `CommunityMessageService.withFreshMedia` / `withFreshMediaAll` call it; the list, `create`, `LiveDispatcher.communityMessage`, `LiveCatchUpService` and `CommunityRoomsService.mine` use them. Nothing stored is rewritten; an old row that holds a full link or a bare key works. The inbox preview (`GET /inbox`) carries no link, only a kind, so there is nothing to sign there.
- **Who is signed for:** only `<folder for that field>/<the message's sender>/<one file name>` (photo `community/message`, video `community/message-video`, voice note `community/message-voice`). Another person's key, a file from another folder (an identity document, an avatar, a chat attachment), a video in the photo field and a link elsewhere come back exactly as stored and are never signed. A photo link is not checked when it is sent (G-FIX-71-2), so this check is what keeps a room from being handed a signed link to a file that is not the sender's.
- **`objectKeyFrom`:** also recognises `chat/media`, `chat/file` and `ai/voiceover` now (new `KEY_FOLDERS`, the upload folders then the chat folders then `GENERATED_KEY_FOLDERS`). Same answer for every key it knew before; only the missing folders were added. FIX-65's finding.
- **Specs:** new `community-message-resign.contract.spec.ts` (9; red on `2d311df` for the list, the host's list, the send and its repeat, `mine`, the live event and the catch-up page, green after; the outsider refusal, the stored rows and a foreign last message pass on both), `message-media.spec.ts` (unit, 25) and `src/storage/tests/object-key-folders.spec.ts` (4). Storage is configured only to sign, at a host that does not resolve; nothing leaves the machine.
- **Protected suite (V3):** 2 of 253 red, `GET` and `POST /communities/:id/messages` "videoUrl, voiceUrl not in the lock". They are INBOX-22's own, red on `2d311df` too, and nothing here adds a field.
- **Merge note:** INBOX-22 round 2 changes `assertUploaded` in `community-message.service.ts`; this branch does not touch it. Functions changed in `storage.service.ts`: `objectKeyFrom` (loops `KEY_FOLDERS`), plus the new exports `KEY_FOLDERS` and `GENERATED_KEY_FOLDERS` and the import of `CHAT_UPLOAD_FOLDERS`. In `community-message.service.ts`: the constructor (adds `StorageService`), `create`, `list`, new `withFreshMedia` and `withFreshMediaAll`.
- **Next:** the batch 18 pull request (the lead).

Status set to review by the records sync, 25 Oct 2026: merged as backend 6e815cd9, verifier PASS in the lead's merge log, 18 Oct (v FIX-71 PASS).

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`
- `tasks/INBOX-22.md` (G-INBOX-22-2), BACKEND_GAPS G-FIX-71-1, G-FIX-71-2

## Goal

A community message's photo, video and voice note load however long ago the message was sent, in the room, live, in the catch-up and in "my communities", and no one is handed a signed link to a file that is not the sender's own.

## Scope (backend only)

`src/community-message/` (the new helper, the service, the module), the three callers named above, `objectKeyFrom` in `src/storage/storage.service.ts`, and the three specs.

## Capability checks

- [ ] A message stored 8 days ago returns a link signed now for its photo, its video and its voice note in the list, the answer to a send and its repeat, the live event, the catch-up page and `GET /communities/mine`.
- [ ] An old row that holds a full link, or a bare key, loads.
- [ ] Another person's key, a file from another folder and a link elsewhere are never signed, and a person outside the room is sent nothing.
- [ ] `objectKeyFrom` recognises the chat and AI folders and answers as before for every other key.

## Owner sign-off

Not needed.
