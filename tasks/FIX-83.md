---
id: FIX-83
title: A test that lists a message's media compares the object key and a valid signed link, never the whole signed link
owner: YOU
area: FIX
order: -83
priority: launch
repo: wawu-backend
type: setup
status: review
depends_on: []
decisions: [R-62]
passes: [V1]
artboards: []
tier: T0
---
# FIX-83 · A test that lists a message's media compares the object key and a valid signed link, never the whole signed link

## Current state

As of 18 Oct 2026, merging (lead): accepted (T0, the lead's read; test only) and stacked in batch 21 (backend `wmt/FIX-83` `a0ca0f5`, mobile `628a08bf`).
- **Status:** merging (lead). Backend `wmt/FIX-83` `a0ca0f5` (from `origin/wmt/MERGE-19` `c56a576`); this record on mobile `wmt/FIX-83` (from `origin/wmt/MERGE-19` `d2af6e5b`). Order -83, free. Test only: no source file, route, DTO, schema or Fintava file touched.
- **Found by:** the SWEEP-LATE check, finding 2 (report `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/verify/SWEEP-LATE.md`). `community-message-kinds.contract.spec.ts` "lists a video and a voice note with their links" was red 5 of 6 runs on MERGE-18 and 2 of 6 on SWEEP-LATE, and red in SWEEP-LATE's CI run.
- **Cause:** since FIX-71 every read signs a message's media link fresh, so the listed link has a new `X-Amz-Date` (second resolution) and a new signature whenever the list is read in a later second than the send. The test compared the whole listed string with the link it sent. The product is right (a fresh signature on read is FIX-71's ruled behaviour); the assertion was wrong.
- **Fix (one spec):** the listed link is checked for what matters. The key is read from the sent link and from the listed link with the codebase's own reader (`objectKeyFrom`) and the two keys must be equal; the key must start with `<the kind's folder>/<the sender>/`; the listed link must be on this bucket at exactly that key; and it must be signed (a 64 hex signature is present, signed no later than now, `X-Amz-Expires` positive and the expiry in the future). No signature or date part is compared with the sent link. The video and the voice note each keep their own folder check; the "other two as null" assertions are unchanged.
- **The clock is moved in the test:** between the send and the list the test moves `Date` two seconds ahead (jest fake timers, only `Date` faked, real time still advancing), so every run meets the case that used to fail one run in two. `afterEach` puts the real clock back.
- **Proof (test database on ports 7840-7847, spec run in band):**
  - Old test, unforced clock, `-t` that test: 3 of 6 red.
  - Old test with the clock moved two seconds between send and list: 0 of 20 green, 20 of 20 red on the listed link differing from the sent one (the signature and date only).
  - New spec, whole file, 20 runs: 20 of 20 green, 24 of 24 tests each.
- **Same shape elsewhere (grep of every spec that reads a signed link: `readUrlFor`, `freshUrlFor`, `X-Amz`, `fileUrl`, `videoUrl`, `voiceUrl`, `imageUrl`, `AssetUrl`, `avatarUrl`, `coverUrl`):** none compares a whole returned signed link with a stored or sent one. `community-message-resign.contract.spec.ts` and `message-media.spec.ts` already compare key, folder and a "signed now" check; the legal, admin review and storage specs compare the path and `X-Amz-Expires`; the live, catch-up, rooms, inbox, chat, profile, explore and content specs run with storage unconfigured or a stub, so the link comes back as stored and is compared with a literal. Nothing else changed.
- **Checks:** backend tsc EXIT 0, eslint on the spec EXIT 0, prettier clean, gates 0 fail, 129 warn, 88 accepted EXIT 0, check_baseline EXIT 0. Spec run by name; no Fintava spec run.
- **Next:** an independent verifier; then the lead's batch.

Status set to review by the records sync, 25 Oct 2026: merged as backend b3594cd8, lead acceptance in this file (accepted, T0 lead read).

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`
- `tasks/FIX-71.md`; the SWEEP-LATE report above (finding 2)

## Goal

A spec that lists a message's video or voice note passes on every run, in any second, and still proves that the listed link points at the sender's own file in the kind's own folder and is a valid signed link.

## Scope

`wawu-backend`: `src/community-message/tests/community-message-kinds.contract.spec.ts`. `wawu-wmt-mobile`: this file.

## Capability checks

- [x] The listed link and the sent link name the same object key, read with `objectKeyFrom`.
- [x] The key is the sender's own and in the kind's own folder.
- [x] The listed link is on the bucket, signed, signed no later than now, and not expired.
- [x] With the clock moved across a second boundary between send and list, the old assertion fails 20 of 20 and the new one passes 20 of 20.
- [x] Every other spec that reads a signed link was checked; none compares a whole signed link.

## Owner sign-off

Not needed.
