---
id: FIX-87
title: A PIN or money write the Hub never answers ends after 30 s, where its screen can send it again under the same key
owner: YOU
area: MONEY
order: 207
priority: launch
repo: wawu-wmt-mobile
type: mobile-screen
status: verifying
tier: T2
depends_on: [WALLET-06]
decisions: [R-47]
passes: [V1, V4, V5, V6, V9]
artboards: []
---
# FIX-87 · A PIN or money write the Hub never answers ends after 30 s, where its screen can send it again under the same key

## Current state

As of 18 Oct 2026, built (Sonnet builder, T2; mobile `wmt/FIX-87` on `origin/wmt/MERGE-23` `5cd1ef3e`; no backend change, no migration; status verifying). This is the write half of SHARED-CHANGES WALLET-06 #5 (WALLET-06 verifier note c: W36's "Changing your PIN" spinner kept Back disabled for good, reproduced at 15 s). SWEEP-APP-7 gave reads their 30 s (`READ_TIMEOUT_MS`).

- **The rule (lead's ruling), decided per request in one place, `src/api/client.ts` (`timeoutOf`).** A write ends after `WRITE_TIMEOUT_MS` (30 s) as the network failure (`ApiError` kind `network`, status 0, "No connection. Check your internet and try again.") ONLY when it carries a non-empty `Idempotency-Key` AND its caller passed `fetch: resendsUnderKey`. Every other write is never aborted (a write with no key could move money twice).
- **Why an opt-in the caller passes, not an allow-list in the client.** The fact that makes the timeout safe is a fact about the screen (it sends the same request again under the same key), so it is stated next to the key, at the call. A new keyed write is never aborted until its screen says so; a spec (`keyed-write-sites.test.ts`) reads the source and fails on any call that carries an `Idempotency-Key` and is in neither list below. The client still refuses the opt-in without a key. The 401 refresh repeat is timed the same way as the first send.
- **Which keyed writes got it (22 calls, each screen keeps its attempt's key and sends the same request again after "no answer"; checked in the screen's code, not by the call's comment):**
  - PIN: `PUT /money/pin` (W36 `ChangePinScreen`, the attempt's key in a ref), `POST /money/pin/reset/confirm` (W37 `ResetPinScreen`), `POST /money/statements/email` (`StatementScreen`: a `network` failure keeps the key).
  - Pay sheet, same attempt key and quote until the Hub decides (`unanswered` keeps it; `usePaymentFlow`, `money-attempt`, or the screen's intent): tips, unlock, paid question pay (`feedpay`), community pass, credits, chat money request pay, legal fee, events order pay and `createOrder` (one key per same tickets), points convert, points shortfall, points pack, voiceover job, plan purchase (`verify`), school enrolment, send to a WAWU user and to a bank (2 calls).
  - Others that send again under their own key: a community message (`useRoomMessages`, one key per composed message, look-up then same key) and a creator's paid answer (`PaidThreadScreen`, same question and words keep the key).
- **Which keyed writes did NOT (2 calls, listed with reasons in `keyed-write-sites.test.ts`):** the paid question's first ask (`POST /dm/{creatorWawuId}/send/wallet`: `useAsk` makes a fresh key on every ask, so a repeat is a new draft, not a re-send; G-FIX-87-2), and the door check-in (`POST /events/{id}/door/check-in`: it already ends itself after 10 s, `ANSWER_WAIT_MS`, and Try again re-sends the same key).
- **One screen change, W36 and W37 (`ChangePinScreen.send`, `ResetPinScreen.send`): no second send "at once" after a full wait.** Both send a no-answer change twice in a row (`REPEATS`) before showing "We couldn't tell". With the timeout that would be 60 s of spinner. A send that waited the whole 30 s now goes straight to the "no answer" line with Try again (a send that failed at once, a dropped connection, still repeats at once as before). Nothing else in either screen changed.
- **Red before, green after.** On `origin/wmt/MERGE-23` plus the new tests: `changePinTimeout.test.tsx` 3 of 4 red (W36 spinner never ends and Back stays off, W37 the same), `client-write-timeout.test.ts` 2 of 7 red (a keyed opted-in write is never ended; the 401 repeat is never ended), `keyed-write-sites.test.ts` 1 of 4 red (22 calls unclassified); the cases that must stay true on both (a write with no key, an empty key, or no opt-in is never aborted; no timer is left behind) are green on both. After: all green.
- **W36 against a Hub that takes the change and never answers (390 px, real Chromium on the Expo web export, light and dark):** change sent at 14.6 s, spinner and Back off at 3 s and at 28.5 s, the "no answer" line at 30.3 s, Back on, Try again sends the second PUT with the SAME key and the same 45-byte body at 45.4 s, the Hub answers its one answer and the screen leaves. Pictures: `/tmp/claude-0/-home-user/f6abda14-ea52-5aeb-b102-78d31cb7857d/scratchpad/b-fx87/pics/w36-saving-light.png`, `w36-saving-dark.png`, `w36-no-answer-light.png`, `w36-no-answer-dark.png`; the Hub's log of the run: `.../b-fx87/logs/hub.log`. The body re-wrap (`new Request(input, { signal })`) was checked in the browser too, not only in jest.
- **Checks:** tsc EXIT 0; eslint on the 25 changed files EXIT 0; jest, the 68 spec files of the touched features by name (none imports a Fintava double; nine only mention the word, in assertions that the app never says it): 68 suites, 1261 tests, EXIT 0; `npm run tasks` and gates below.
- **Gaps recorded, not fixed here (the ruling leaves them):**
  - **G-FIX-87-1 (medium, V6):** the writes with no key (about 109 calls; the nearest one for the PIN screens is `POST /money/pin/verify`, W36's "Checking your PIN") are never aborted, so they can still wait for good. A 30 s end for them is safe only per call, where repeating it moves nothing (the PIN check spends a try); each is its own decision.
  - **G-FIX-87-2 (low):** the paid question's first ask makes a new key on every ask; if its screen kept one key per words (as `useAsk` already keeps the draft per words), the call could pass `resendsUnderKey` and move to the list above.

## Read first

- `docs/WORKFLOW.md`, `docs/roles/BUILDER.md` or `docs/roles/VERIFIER.md`
- SHARED-CHANGES `WALLET-06 #5`, `src/api/client.ts` (`timeoutOf`, `resendsUnderKey`), `src/features/wallet/settings/ChangePinScreen.tsx` (`send`), `src/features/money-attempt/refusal.ts` (what "unanswered" proves)

## Goal

A PIN change, a PIN reset and every pay-sheet payment the Hub takes but never answers ends as "no answer" after 30 s, so Back and Try again come back, and Try again sends the same request under the same key so the Hub's one answer stands. A write that has no key, or whose screen would make a new key, is never aborted.

## Capability checks

- [x] A user changing the PIN against a Hub that never answers sees "Changing your PIN" with Back off, and after 30 s "We couldn't tell whether your PIN was changed" with Back and Try again working (`changePinTimeout.test.tsx`, and in the browser).
- [x] Try again sends the same request again: the same `Idempotency-Key`, the same `X-Transaction-Pin` and the same body, byte for byte, and the Hub's one answer finishes the change (one change landed).
- [x] A write with no Idempotency-Key, an empty one, or one whose caller did not opt in is never aborted, however long the Hub takes (`client-write-timeout.test.ts`; W36's PIN check with no answer for 5 minutes).
- [x] Every call that carries an Idempotency-Key is either opted in or listed with its reason (`keyed-write-sites.test.ts`).
- [x] The repeat of a keyed write after a 401 refresh ends the same way as the first send.

## Owner sign-off

Not needed.
