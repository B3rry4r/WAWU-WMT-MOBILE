---
id: FIX-84
title: Tests that compare a sent photo link with a returned one compare the object and a valid signed link, never the whole signed link
owner: YOU
area: FIX
order: -84
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
# FIX-84 · Tests that compare a sent photo link with a returned one compare the object and a valid signed link, never the whole signed link

## Current state

As of 18 Oct 2026, merging (lead): accepted (T0, the lead's read; the assertions are not weakened) and stacked in batch 21 (backend `wmt/FIX-84` `eb50a7b`, mobile `d853b380`). Merge (MERGE-21): no conflict with FIX-83 in `community-message-kinds.contract.spec.ts` (both edits kept).
- **Status:** merging (lead). Backend `wmt/FIX-84` `eb50a7b` (from `origin/wmt/MERGE-20` `af10ed2`); this record on mobile `wmt/FIX-84` (from `origin/wmt/MERGE-20` `90b00d9c`). Order -84, free. Test only: no source file, route, DTO, schema or Fintava file touched.
- **Found by:** the FIX-83 builder's note that "takes the sender's own confirmed photo" (added by FIX-77) has the same shape as the test FIX-83 fixed.
- **Cause:** since FIX-71 every answer and every read signs a message's media link fresh, so the returned link carries the `X-Amz-Date` (second resolution) and signature of the second the Hub answered in. A test that compares it with the link it sent is red whenever the two are signed in different seconds. The product is right; the assertions were wrong.
- **How every spec was checked (not a grep):** the 31 spec files that sign links against the test bucket were run on `af10ed2` with the signer made to date each signing one second after the last, so any comparison of two separately signed links fails every time. 27 passed unchanged. 3 files failed, 8 tests (one more is FIX-83's, below). The admin verification review spec is red on this stack with or without that change (the mock WAWU ID refuses its service key), and the protected-route suite has the same 10 reds with and without it; neither compares a link.
- **The 8 tests fixed (3 files):**
  - `community-message-kinds.contract.spec.ts`: "takes the sender's own confirmed photo (the app's path)" (the send answer and the list) and "takes the sender's own presigned photo that was never confirmed (the web's path)" (the send answer and its repeat).
  - `community/tests/community-image.contract.spec.ts`: "accepts an image with no text", "charges the same 1 credit for text AND an image together", "charges the HOST nothing for the same photo".
  - `community-message/tests/community-message-idempotency.contract.spec.ts`: the three repeats of a send in "a repeat of a send (the answer was lost)" (the first answer's body against the repeat's).
- **Not touched:** "lists a video and a voice note with their links" in the kinds spec is FIX-83's (`wmt/FIX-83` `a0ca0f5`, merges in batch 21). Both branches edit `community-message-kinds.contract.spec.ts`, in different places: FIX-83 the imports, a helper before the `describe`, the first `afterEach` and the "lists a video" test; FIX-84 one import line after `CommunityMessageService`, one `afterEach` and the two photo tests in "what a photo may be (FIX-77)". No line is shared. FIX-83's helper has its own name (`expectFreshLinkToSameObject`), so the two do not collide.
- **Fix:** a new test helper, `src/community-message/tests/fresh-link.ts`. `expectLinkSignedAgain(returned, sent)` needs the same object (`objectKeyFrom`), the same bucket and path, every parameter equal except the date, signature and the credential's date, and a 64 hex signature made no later than now that has not run out. `expectSameAnswerSignedAgain` compares two answers equal in every field but the three links. `moveClockForward` fakes only `Date` and moves it two seconds, so every run meets the later-second case; `restoreClock` runs in `afterEach`. A throwaway spec (not committed) showed the helper refuses another object, another bucket, another disposition, expiry or key, a short signature, a link signed in the future or long ago, and a null.
- **Proof (test database, ports 7840-7847, in band, the changed tests only):** the old assertions with the clock moved two seconds between send and read: 8 of 8 red, in 10 of 10 runs (the same 8 each run). The new tests: 14 of 14 green (the 8 and 6 siblings in the same blocks), in 10 of 10 runs. Whole three files, once: 3 suites, 69 of 69, EXIT 0.
- **Checks:** backend tsc EXIT 0; eslint EXIT 0 on the helper, kinds and idempotency specs; `community-image` has 25 lint findings before and after (all older, none added); prettier clean; gates 0 fail, 129 warn, 88 accepted, EXIT 0; check_baseline EXIT 0. No Fintava spec run.
- **Low, for the sweep:** after FIX-83 and FIX-84 both merge, the kinds spec holds FIX-83's local helper and the shared one. They could be one.
- **Next:** an independent verifier; then the lead's batch.

Status set to review by the records sync, 25 Oct 2026: merged as backend b3594cd8, lead acceptance in this file (accepted, T0 lead read).

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`
- `tasks/FIX-71.md`, `tasks/FIX-83.md`

## Goal

A test that sends a photo into a room and reads its link back passes on every run, in any second, and still proves the link points at the sender's own file on this bucket and is a valid signed link.

## Scope

`wawu-backend`: `src/community-message/tests/fresh-link.ts` (new), `community-message-kinds.contract.spec.ts`, `community-message-idempotency.contract.spec.ts`, `src/community/tests/community-image.contract.spec.ts`. `wawu-wmt-mobile`: this file.

## Capability checks

- [x] Every spec that signs a link against the test bucket was run with the signer moving; the three that compared two signings are fixed.
- [x] A returned link must name the same object on the same bucket with the same unsigned parameters.
- [x] A returned link is signed, signed no later than now, and not expired.
- [x] With the clock moved two seconds between send and read, the old assertions fail 8 of 8 in 10 of 10 runs and the new ones pass in 10 of 10 runs.
- [x] FIX-83's test is untouched and the two branches share no line.

## Owner sign-off

Not needed.
