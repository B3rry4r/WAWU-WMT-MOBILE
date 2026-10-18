---
id: FIX-71
title: A community message's photo, video and voice note still load after a week
owner: YOU
area: FIX
order: -71
priority: launch
repo: wawu-backend
type: backend-endpoint
status: verifying
depends_on: []
decisions: [R-62]
passes: [V1, V2, V3, V4, V9]
artboards: []
tier: T1
---
# FIX-71 · A community message's photo, video and voice note still load after a week

## Current state

As of 18 Oct 2026, verifying: built by a Sonnet builder (tier T1), not yet checked. Backend `wmt/FIX-71` (from `wmt/INBOX-22` `2d311df`); this record and the gap rows on mobile `wmt/FIX-71` (from `wmt/INBOX-22` `6c0313da`). No schema, no migration, no route, no Fintava file, no app code.
- **Closes:** G-INBOX-22-2. **Found by:** INBOX-22's builder.
- **Cause:** a message's `imageUrl`, `videoUrl` and `voiceUrl` are stored as the 7-day signed link the app sent, so a week later every read of the room returned a dead link although the file was untouched.
- **Fix:** the key is derived from the stored link (`objectKeyFrom`, as avatars and content previews already do) and signed on every read, in the five paths that return a message: the room's list, the answer to a send and to its repeat, the live event, the catch-up page and the last message of `GET /communities/mine`. New `src/community-message/message-media.ts`; `CommunityMessageService.withFreshMedia` / `withFreshMediaAll` call it; the list, `create`, `LiveDispatcher.communityMessage`, `LiveCatchUpService` and `CommunityRoomsService.mine` use them. Nothing stored is rewritten; an old row that holds a full link or a bare key works. The inbox preview (`GET /inbox`) carries no link, only a kind, so there is nothing to sign there.
- **Who is signed for:** only `<folder for that field>/<the message's sender>/<one file name>` (photo `community/message`, video `community/message-video`, voice note `community/message-voice`). Another person's key, a file from another folder (an identity document, an avatar, a chat attachment), a video in the photo field and a link elsewhere come back exactly as stored and are never signed. A photo link is not checked when it is sent (G-FIX-71-2), so this check is what keeps a room from being handed a signed link to a file that is not the sender's.
- **`objectKeyFrom`:** also recognises `chat/media`, `chat/file` and `ai/voiceover` now (new `KEY_FOLDERS`, the upload folders then the chat folders then `GENERATED_KEY_FOLDERS`). Same answer for every key it knew before; only the missing folders were added. FIX-65's finding.
- **Specs:** new `community-message-resign.contract.spec.ts` (9; red on `2d311df` for the list, the host's list, the send and its repeat, `mine`, the live event and the catch-up page, green after; the outsider refusal, the stored rows and a foreign last message pass on both), `message-media.spec.ts` (unit, 25) and `src/storage/tests/object-key-folders.spec.ts` (4). Storage is configured only to sign, at a host that does not resolve; nothing leaves the machine.
- **Protected suite (V3):** 2 of 253 red, `GET` and `POST /communities/:id/messages` "videoUrl, voiceUrl not in the lock". They are INBOX-22's own, red on `2d311df` too, and nothing here adds a field.
- **Merge note:** INBOX-22 round 2 changes `assertUploaded` in `community-message.service.ts`; this branch does not touch it. Functions changed in `storage.service.ts`: `objectKeyFrom` (loops `KEY_FOLDERS`), plus the new exports `KEY_FOLDERS` and `GENERATED_KEY_FOLDERS` and the import of `CHAT_UPLOAD_FOLDERS`. In `community-message.service.ts`: the constructor (adds `StorageService`), `create`, `list`, new `withFreshMedia` and `withFreshMediaAll`.
- **Next:** an independent verifier (V3 protected suite, gates, the three specs).

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
